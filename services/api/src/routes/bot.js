const { serverError } = require('../helpers/respond');
const { Router } = require('express');
const pool = require('../db');
const notify = require('../notifications');

const router = Router();

// Auth: requests must carry Authorization: Bot <TELEGRAM_BOT_TOKEN>
const requireBotAuth = (req, res, next) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(503).json({ error: 'Bot not configured' });
  const auth = req.headers['authorization'] ?? '';
  if (auth !== `Bot ${token}`) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// POST /api/bot/link-vendor  { token, telegram_id }
// Called by the bot when a vet opens the deep-link ?start=link_<token>
router.post('/link-vendor', requireBotAuth, async (req, res) => {
  const { token, telegram_id } = req.body;
  if (!token || !telegram_id) return res.status(400).json({ error: 'token and telegram_id required' });
  const { consumeLinkToken } = require('../helpers/linkTokens');
  const vetId = consumeLinkToken(token);
  if (!vetId) return res.status(400).json({ error: 'Invalid or expired token' });
  try {
    await pool.query(
      'UPDATE vendor_credentials SET telegram_id=$1 WHERE vet_id=$2',
      [String(telegram_id), vetId]
    );
    res.json({ ok: true });
  } catch (e) {
    serverError(res, e);
  }
});

// POST /api/bot/orders/:id/accept  { telegram_id }
router.post('/orders/:id/accept', requireBotAuth, async (req, res) => {
  const { telegram_id } = req.body;
  if (!telegram_id) return res.status(400).json({ error: 'telegram_id required' });
  try {
    const { rows: [cred] } = await pool.query(
      'SELECT vet_id FROM vendor_credentials WHERE telegram_id=$1', [String(telegram_id)]
    );
    if (!cred) return res.status(404).json({ error: 'Vendor not found' });

    const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.vet_id !== cred.vet_id) return res.status(403).json({ error: 'Forbidden' });
    if (order.status !== 'paid') return res.status(400).json({ error: `Cannot accept order in status '${order.status}'` });

    const { rows: [updated] } = await pool.query(
      `UPDATE orders SET status='accepted' WHERE id=$1 RETURNING *`, [req.params.id]
    );
    await pool.query(
      `UPDATE consultations SET status='pending'
       WHERE id = (SELECT consultation_id FROM orders WHERE id=$1 AND consultation_id IS NOT NULL)`,
      [req.params.id]
    );
    notify.notifyClientOrderStatus(req.params.id, '✅ Ваша заявка принята. Врач скоро выйдет на связь.').catch(() => {});
    res.json(updated);
  } catch (e) {
    serverError(res, e);
  }
});

// POST /api/bot/orders/:id/reject  { telegram_id, reason? }
router.post('/orders/:id/reject', requireBotAuth, async (req, res) => {
  const { telegram_id, reason } = req.body;
  if (!telegram_id) return res.status(400).json({ error: 'telegram_id required' });
  try {
    const { rows: [cred] } = await pool.query(
      'SELECT vet_id FROM vendor_credentials WHERE telegram_id=$1', [String(telegram_id)]
    );
    if (!cred) return res.status(404).json({ error: 'Vendor not found' });

    const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.vet_id !== cred.vet_id) return res.status(403).json({ error: 'Forbidden' });
    if (order.status !== 'paid') return res.status(400).json({ error: `Cannot reject order in status '${order.status}'` });

    await pool.query(
      `UPDATE orders SET status='rejected', rejected_reason=$2 WHERE id=$1`,
      [req.params.id, reason || null]
    );
    await pool.query(
      `UPDATE consultations SET status='completed'
       WHERE id = (SELECT consultation_id FROM orders WHERE id=$1 AND consultation_id IS NOT NULL)`,
      [req.params.id]
    );
    // Auto-refund
    await pool.query(
      `UPDATE payments SET status='refunded', refunded_at=NOW() WHERE order_id=$1 AND status='paid'`,
      [req.params.id]
    );
    await pool.query(`UPDATE orders SET status='refunded' WHERE id=$1 AND status='rejected'`, [req.params.id]);

    const { rows: [final] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    notify.notifyClientOrderStatus(req.params.id, '❌ Заявка отклонена. Средства вернутся в течение 1–2 рабочих дней.').catch(() => {});
    res.json(final);
  } catch (e) {
    serverError(res, e);
  }
});

module.exports = router;
