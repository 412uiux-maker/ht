const express = require('express');
const pool = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  const { vet_id, client_name, pet_name, pet_species, problem, slot_time, pet_id, owner_id } = req.body;
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
      `INSERT INTO consultations (vet_id, client_name, pet_name, pet_species, problem, slot_time, duration_min, pet_id, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [vet_id, client_name, pet_name, pet_species, problem, slot_time || null, durationMin, pet_id || null, owner_id || null]
    );
    await pool.query(
      `INSERT INTO messages (consultation_id, sender, text) VALUES ($1,'vet',$2)`,
      [consult.id, `Здравствуйте, ${client_name}! Рад вас приветствовать. Расскажите подробнее о симптомах у ${pet_name} — это поможет поставить точный диагноз.`]
    );
    res.status(201).json(consult);
  } catch (e) {
    res.status(500).json({ error: e.message });
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
    res.status(500).json({ error: e.message });
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
    const { rows: [msg] } = await pool.query(
      `INSERT INTO messages (consultation_id, sender, text) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, sender, text]
    );
    res.status(201).json(msg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { status, summary, report } = req.body;
  if (!['pending', 'active', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  try {
    // Derive plain-text summary from report.diagnosis for backwards compat
    const derivedSummary = (report && report.diagnosis) ? report.diagnosis : (summary || null);
    const { rows: [consult] } = await pool.query(
      `UPDATE consultations SET status=$1, summary=$2, report=$3 WHERE id=$4 RETURNING *`,
      [status, derivedSummary, report ? JSON.stringify(report) : null, req.params.id]
    );
    if (!consult) return res.status(404).json({ error: 'Not found' });
    res.json(consult);
  } catch (e) {
    res.status(500).json({ error: e.message });
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
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
