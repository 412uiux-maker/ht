const express = require('express');
const pool = require('../db');
const { requireVendor } = require('../middleware/auth');
const notify = require('../notifications');
const router = express.Router();

// Valid status transitions per service-spec §8.1
const TRANSITIONS = {
  created:     ['cancelled'],
  paid:        ['accepted', 'rejected', 'cancelled'],
  accepted:    ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed:   ['reviewed'],
  rejected:    ['refunded'],
  cancelled:   ['refunded'],
  reviewed:    [],
  refunded:    [],
};

const canTransition = (from, to) => (TRANSITIONS[from] ?? []).includes(to);

// Sync consultation status when order transitions
async function syncConsultation(orderId, orderStatus) {
  const map = { accepted: 'pending', in_progress: 'active', completed: 'completed', cancelled: 'completed', rejected: 'completed' };
  const cs = map[orderStatus];
  if (!cs) return;
  await pool.query(
    `UPDATE consultations SET status=$1
     WHERE id = (SELECT consultation_id FROM orders WHERE id=$2 AND consultation_id IS NOT NULL)`,
    [cs, orderId]
  );
}

// Trigger refund: mark payment refunded + auto-advance order to refunded
async function triggerRefund(orderId) {
  await pool.query(
    `UPDATE payments SET status='refunded', refunded_at=NOW()
     WHERE order_id=$1 AND status='paid'`,
    [orderId]
  );
  await pool.query(
    `UPDATE orders SET status='refunded'
     WHERE id=$1 AND status IN ('rejected','cancelled')`,
    [orderId]
  );
}

// POST /api/orders  — create a new order for a consultation
router.post('/', async (req, res) => {
  const { consultation_id, owner_id } = req.body;
  if (!consultation_id || !owner_id)
    return res.status(400).json({ error: 'consultation_id and owner_id required' });
  try {
    const { rows: [c] } = await pool.query(
      'SELECT vet_id FROM consultations WHERE id=$1', [consultation_id]
    );
    if (!c) return res.status(404).json({ error: 'Consultation not found' });

    // Idempotency: return existing unpaid order for this consultation if one exists
    const { rows: [existing] } = await pool.query(
      `SELECT * FROM orders WHERE consultation_id=$1 AND status='created' ORDER BY created_at DESC LIMIT 1`,
      [consultation_id]
    );
    if (existing) return res.json(existing);

    const { rows: [vet] } = await pool.query('SELECT price_uzs FROM vets WHERE id=$1', [c.vet_id]);
    const { rows: [order] } = await pool.query(
      `INSERT INTO orders (owner_id, vet_id, service_type, consultation_id, status, price_uzs)
       VALUES ($1, $2, 'vet_online', $3, 'created', $4) RETURNING *`,
      [owner_id, c.vet_id, consultation_id, vet?.price_uzs || 0]
    );
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/orders?owner_id=...
router.get('/', async (req, res) => {
  const { owner_id } = req.query;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  try {
    const { rows } = await pool.query(
      `SELECT
         o.id, o.vet_id, o.service_type, o.consultation_id, o.status, o.price_uzs,
         o.provider, o.created_at, o.commission_rate, o.payout_amount,
         o.rejected_reason, o.cancel_reason,
         c.problem, c.pet_name, c.pet_species, c.status AS consult_status,
         v.name AS vet_name, v.specialty AS vet_specialty, v.avatar_emoji AS vet_avatar
       FROM orders o
       LEFT JOIN consultations c ON c.id = o.consultation_id
       LEFT JOIN vets v ON v.id = o.vet_id
       WHERE o.owner_id = $1
       ORDER BY o.created_at DESC`,
      [owner_id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows: [order] } = await pool.query(
      `SELECT o.*, v.name AS vet_name, v.specialty AS vet_specialty, v.avatar_emoji AS vet_avatar,
              c.problem, c.pet_name, c.pet_species, c.status AS consult_status
       FROM orders o
       LEFT JOIN vets v ON v.id = o.vet_id
       LEFT JOIN consultations c ON c.id = o.consultation_id
       WHERE o.id = $1`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/orders/:id/accept  (vendor JWT required)
router.post('/:id/accept', requireVendor, async (req, res) => {
  try {
    const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.vet_id !== req.vendor.vet_id) return res.status(403).json({ error: 'Forbidden' });
    if (!canTransition(order.status, 'accepted'))
      return res.status(400).json({ error: `Cannot accept order in status '${order.status}'` });

    const { rows: [updated] } = await pool.query(
      `UPDATE orders SET status='accepted' WHERE id=$1 RETURNING *`, [req.params.id]
    );
    await syncConsultation(req.params.id, 'accepted');
    const vetName = updated.vet_name ?? 'Ветеринар';
    notify.notifyClientOrderStatus(req.params.id,
      `✅ Ветеринар принял вашу заявку. Ожидайте начала консультации.`
    );
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/orders/:id/reject  (vendor JWT required)
router.post('/:id/reject', requireVendor, async (req, res) => {
  const { reason } = req.body;
  try {
    const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.vet_id !== req.vendor.vet_id) return res.status(403).json({ error: 'Forbidden' });
    if (!canTransition(order.status, 'rejected'))
      return res.status(400).json({ error: `Cannot reject order in status '${order.status}'` });

    await pool.query(
      `UPDATE orders SET status='rejected', rejected_reason=$2 WHERE id=$1`,
      [req.params.id, reason || null]
    );
    await syncConsultation(req.params.id, 'rejected');
    await triggerRefund(req.params.id);
    const { rows: [final] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    const reasonText = reason ? `. Причина: ${reason}` : '';
    notify.notifyClientOrderStatus(req.params.id,
      `❌ Ветеринар отклонил вашу заявку${reasonText}. Возврат будет обработан автоматически.`
    );
    res.json(final);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/orders/:id/start  (vendor JWT required)
router.post('/:id/start', requireVendor, async (req, res) => {
  try {
    const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.vet_id !== req.vendor.vet_id) return res.status(403).json({ error: 'Forbidden' });
    if (!canTransition(order.status, 'in_progress'))
      return res.status(400).json({ error: `Cannot start order in status '${order.status}'` });

    const { rows: [updated] } = await pool.query(
      `UPDATE orders SET status='in_progress' WHERE id=$1 RETURNING *`, [req.params.id]
    );
    await syncConsultation(req.params.id, 'in_progress');
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/orders/:id/complete  (vendor JWT required)
router.post('/:id/complete', requireVendor, async (req, res) => {
  try {
    const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (order.vet_id !== req.vendor.vet_id) return res.status(403).json({ error: 'Forbidden' });
    if (!canTransition(order.status, 'completed'))
      return res.status(400).json({ error: `Cannot complete order in status '${order.status}'` });

    const commissionRate = parseFloat(order.commission_rate ?? 0.15);
    const payoutAmount = Math.floor((order.price_uzs ?? 0) * (1 - commissionRate));
    const { rows: [updated] } = await pool.query(
      `UPDATE orders SET status='completed', payout_amount=$2 WHERE id=$1 RETURNING *`,
      [req.params.id, payoutAmount]
    );
    await syncConsultation(req.params.id, 'completed');
    notify.notifyClientOrderStatus(req.params.id,
      `🎉 Консультация завершена! Оставьте отзыв в приложении.`
    );
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/orders/:id/cancel  (client or admin; no JWT required — uses owner_id body param)
router.post('/:id/cancel', async (req, res) => {
  const { owner_id, reason } = req.body;
  try {
    const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (owner_id && order.owner_id !== owner_id) return res.status(403).json({ error: 'Forbidden' });
    if (!canTransition(order.status, 'cancelled'))
      return res.status(400).json({ error: `Cannot cancel order in status '${order.status}'` });

    await pool.query(
      `UPDATE orders SET status='cancelled', cancel_reason=$2 WHERE id=$1`,
      [req.params.id, reason || null]
    );
    await syncConsultation(req.params.id, 'cancelled');
    if (order.status === 'paid' || order.status === 'accepted') {
      await triggerRefund(req.params.id);
    }
    const { rows: [final] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    res.json(final);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/orders/:id/review  (client; no JWT — uses owner_id body param)
router.post('/:id/review', async (req, res) => {
  const { owner_id, rating, text } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating (1–5) required' });
  try {
    const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (owner_id && order.owner_id !== owner_id) return res.status(403).json({ error: 'Forbidden' });
    if (!canTransition(order.status, 'reviewed'))
      return res.status(400).json({ error: `Cannot review order in status '${order.status}'` });

    await pool.query(`UPDATE orders SET status='reviewed' WHERE id=$1`, [req.params.id]);
    // Update vet rating (simple rolling average weighted toward recent data)
    if (order.vet_id) {
      await pool.query(
        `UPDATE vets SET rating = LEAST(5.0, ROUND((rating * 10 + $1) / 11.0, 1)) WHERE id=$2`,
        [rating, order.vet_id]
      );
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
