const express = require('express');
const pool = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  const { vet_id, client_name, pet_name, pet_species, problem, slot_time } = req.body;
  if (!vet_id || !client_name || !pet_name || !pet_species || !problem) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { rows: [consult] } = await pool.query(
      `INSERT INTO consultations (vet_id, client_name, pet_name, pet_species, problem, slot_time)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [vet_id, client_name, pet_name, pet_species, problem, slot_time || null]
    );
    const { rows: [vet] } = await pool.query('SELECT name FROM vets WHERE id = $1', [vet_id]);
    const vetName = vet ? vet.name : 'Ветеринар';
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
  try {
    const { rows: [consultation] } = await pool.query(
      `SELECT c.*, v.name AS vet_name, v.specialty, v.avatar_emoji
       FROM consultations c JOIN vets v ON v.id = c.vet_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!consultation) return res.status(404).json({ error: 'Not found' });
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
  const { status, summary } = req.body;
  if (!['pending', 'active', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' });
  }
  try {
    const { rows: [consult] } = await pool.query(
      `UPDATE consultations SET status = $1, summary = $2 WHERE id = $3 RETURNING *`,
      [status, summary || null, req.params.id]
    );
    if (!consult) return res.status(404).json({ error: 'Not found' });
    res.json(consult);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
