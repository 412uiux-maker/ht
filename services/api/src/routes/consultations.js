const { serverError } = require('../helpers/respond');
const express = require('express');
const pool = require('../db');
const { logHealthEvent } = require('../helpers/healthEvents');
const { notifyClientNewMessage } = require('../notifications');
const router = express.Router();

router.post('/', async (req, res) => {
  const { vet_id, client_name, pet_name, pet_species, problem, slot_time, pet_id, owner_id, reason_event_id } = req.body;
  if (!vet_id || !client_name || !pet_name || !pet_species || !problem) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { rows: [vet] } = await pool.query(
      'SELECT name, consult_duration_min FROM vets WHERE id = $1', [vet_id]
    );
    const vetName = vet ? vet.name : 'Ветеринар';
    const durationMin = (vet && vet.consult_duration_min) || 30;
    const { rows: [consult] } = await pool.query(
      `INSERT INTO consultations (vet_id, client_name, pet_name, pet_species, problem, slot_time, duration_min, pet_id, owner_id, reason_event_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [vet_id, client_name, pet_name, pet_species, problem, slot_time || null, durationMin, pet_id || null, owner_id || null, reason_event_id || null]
    );
    await pool.query(
      `INSERT INTO messages (consultation_id, sender, text) VALUES ($1,'vet',$2)`,
      [consult.id, `Здравствуйте, ${client_name}! Рад вас приветствовать. Расскажите подробнее о симптомах у ${pet_name} — это поможет поставить точный диагноз.`]
    );
    res.status(201).json(consult);
  } catch (e) {
    serverError(res, e);
  }
});

router.get('/:id', async (req, res) => {
  const { owner_id } = req.query;
  try {
    const { rows: [consultation] } = await pool.query(
      `SELECT c.*, v.name AS vet_name, v.specialty, v.avatar_emoji,
              c.call_started_at, c.duration_min, c.pet_id
       FROM consultations c JOIN vets v ON v.id = c.vet_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!consultation) return res.status(404).json({ error: 'Not found' });
    if (owner_id && consultation.owner_id && consultation.owner_id !== owner_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { rows: messages } = await pool.query(
      'SELECT * FROM messages WHERE consultation_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    res.json({ consultation, messages });
  } catch (e) {
    serverError(res, e);
  }
});

router.post('/:id/messages', async (req, res) => {
  const { sender, text } = req.body;
  if (!sender || !text) return res.status(400).json({ error: 'sender and text required' });
  if (!['client', 'vet'].includes(sender)) return res.status(400).json({ error: 'invalid sender' });
  try {
    if (sender === 'client') {
      await pool.query(
        `UPDATE consultations SET status = 'active' WHERE id = $1 AND status = 'pending'`,
        [req.params.id]
      );
    }
    // Vet's first message advances order: accepted → in_progress
    if (sender === 'vet') {
      await pool.query(
        `UPDATE orders SET status = 'in_progress'
         WHERE consultation_id = $1 AND status = 'accepted'`,
        [req.params.id]
      );
    }
    const { rows: [msg] } = await pool.query(
      `INSERT INTO messages (consultation_id, sender, text) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, sender, text]
    );
    // Notify client when vet sends a message
    if (sender === 'vet') {
      const { rows: [vet] } = await pool.query(
        `SELECT v.name FROM vets v
         JOIN consultations c ON c.vet_id = v.id
         WHERE c.id = $1`, [req.params.id]
      );
      notifyClientNewMessage(req.params.id, vet?.name, text).catch(() => {});
    }
    res.status(201).json(msg);
  } catch (e) {
    serverError(res, e);
  }
});

router.patch('/:id/status', async (req, res) => {
  const { status, summary, report } = req.body;
  if (!['pending', 'active', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  try {
    const derivedSummary = (report && report.diagnosis) ? report.diagnosis : (summary || null);
    const { rows: [consult] } = await pool.query(
      `UPDATE consultations SET status=$1, summary=$2, report=$3 WHERE id=$4 RETURNING *`,
      [status, derivedSummary, report ? JSON.stringify(report) : null, req.params.id]
    );
    if (!consult) return res.status(404).json({ error: 'Not found' });

    // Sync linked order on status changes
    if (status === 'active' || status === 'completed') {
      const { rows: [order] } = await pool.query(
        `SELECT id, status, price_uzs, commission_rate FROM orders
         WHERE consultation_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [req.params.id]
      );
      if (status === 'active' && order && order.status === 'paid') {
        await pool.query(`UPDATE orders SET status='accepted' WHERE id=$1`, [order.id]);
      }
      if (status === 'completed' && order && ['paid', 'accepted', 'in_progress'].includes(order.status)) {
        const rate = parseFloat(order.commission_rate ?? 0.15);
        const payout = Math.floor((order.price_uzs ?? 0) * (1 - rate));
        await pool.query(
          `UPDATE orders SET status='completed', payout_amount=$2 WHERE id=$1`,
          [order.id, payout]
        );
      }
    }

    // Log consultation event to pet's health timeline
    if (status === 'completed' && consult.pet_id) {
      const title = consult.summary
        ? `🩺 ${consult.summary.slice(0, 120)}`
        : '🩺 Консультация завершена';
      await logHealthEvent(consult.pet_id, {
        type: 'consultation',
        source: 'vet',
        refTable: 'consultations',
        refId: consult.id,
        title,
        occurredAt: new Date(),
      });
    }

    res.json(consult);
  } catch (e) {
    serverError(res, e);
  }
});

// POST /api/consultations/:id/reject  — vendor rejects from web cabinet
// Marks consultation completed, finds associated order, rejects+refunds it.
router.post('/:id/reject', async (req, res) => {
  const { reason } = req.body;
  try {
    const { rows: [consult] } = await pool.query(
      `UPDATE consultations SET status='completed' WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!consult) return res.status(404).json({ error: 'Not found' });

    // Reject associated order and trigger refund if it exists and is in paid state
    const { rows: [order] } = await pool.query(
      `SELECT id, status FROM orders WHERE consultation_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    if (order && order.status === 'paid') {
      await pool.query(
        `UPDATE orders SET status='rejected', rejected_reason=$2 WHERE id=$1`,
        [order.id, reason || null]
      );
      await pool.query(
        `UPDATE payments SET status='refunded', refunded_at=NOW() WHERE order_id=$1 AND status='paid'`,
        [order.id]
      );
      await pool.query(
        `UPDATE orders SET status='refunded' WHERE id=$1 AND status='rejected'`,
        [order.id]
      );
    }
    res.json(consult);
  } catch (e) {
    serverError(res, e);
  }
});

// Start (or fetch) the authoritative call clock. Idempotent: the first caller
// stamps call_started_at; later callers get the same value so both peers share
// one countdown. Returns server `now` so clients can correct for clock skew.
router.post('/:id/call/start', async (req, res) => {
  try {
    const { rows: [c] } = await pool.query(
      `UPDATE consultations
         SET call_started_at = COALESCE(call_started_at, NOW())
       WHERE id = $1
       RETURNING call_started_at, duration_min`,
      [req.params.id]
    );
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json({
      call_started_at: c.call_started_at,
      duration_min: c.duration_min || 30,
      now: new Date().toISOString(),
    });
  } catch (e) {
    serverError(res, e);
  }
});

// POST /api/consultations/:id/review  { owner_id, rating:1-5, text? }
// Allows client to leave a review after consultation is completed.
// Finds linked order, marks it reviewed, updates vet rating.
router.post('/:id/review', async (req, res) => {
  const { owner_id, rating, text } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating 1-5 required' });
  try {
    const { rows: [consult] } = await pool.query(
      'SELECT * FROM consultations WHERE id=$1', [req.params.id]
    );
    if (!consult) return res.status(404).json({ error: 'Not found' });
    if (consult.status !== 'completed') return res.status(400).json({ error: 'Consultation not completed' });

    const { rows: [order] } = await pool.query(
      `SELECT id, vet_id, owner_id, status FROM orders WHERE consultation_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (owner_id && order.owner_id !== owner_id) return res.status(403).json({ error: 'Forbidden' });
    if (order.status !== 'completed') return res.status(400).json({ error: 'Order not completed' });

    await pool.query(
      `INSERT INTO reviews (order_id, owner_id, vet_id, rating, text, status)
       VALUES ($1, $2, $3, $4, $5, 'published')
       ON CONFLICT DO NOTHING`,
      [order.id, owner_id || order.owner_id, order.vet_id, rating, text || null]
    );
    await pool.query(`UPDATE orders SET status='reviewed' WHERE id=$1`, [order.id]);
    await pool.query(
      `UPDATE vets SET rating = LEAST(5.0, ROUND((rating * 10 + $1) / 11.0, 1)) WHERE id=$2`,
      [rating, order.vet_id]
    );
    res.json({ ok: true });
  } catch (e) { serverError(res, e); }
});

// POST /api/consultations/:id/dispute  { owner_id, reason }
router.post('/:id/dispute', async (req, res) => {
  const { owner_id, reason } = req.body;
  if (!reason?.trim()) return res.status(400).json({ error: 'reason required' });
  try {
    const { rows: [consult] } = await pool.query('SELECT * FROM consultations WHERE id=$1', [req.params.id]);
    if (!consult) return res.status(404).json({ error: 'Not found' });

    const { rows: [existing] } = await pool.query(
      'SELECT id FROM disputes WHERE consultation_id=$1 AND owner_id=$2', [req.params.id, owner_id || '']
    );
    if (existing) return res.status(409).json({ error: 'Dispute already submitted' });

    const { rows: [dispute] } = await pool.query(
      `INSERT INTO disputes (consultation_id, owner_id, reason) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, owner_id || '', reason.trim().slice(0, 500)]
    );
    res.json(dispute);
  } catch (e) { serverError(res, e); }
});

// GET /api/consultations/disputes?owner_id=
router.get('/disputes', async (req, res) => {
  const { owner_id } = req.query;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  try {
    const { rows } = await pool.query(
      `SELECT d.*, c.pet_name, c.vet_id FROM disputes d
       LEFT JOIN consultations c ON c.id = d.consultation_id
       WHERE d.owner_id=$1 ORDER BY d.created_at DESC`,
      [owner_id]
    );
    res.json(rows);
  } catch (e) { serverError(res, e); }
});

module.exports = router;
