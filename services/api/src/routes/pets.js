const express = require('express');
const pool = require('../db');
const router = express.Router();

const VALID_SPECIES = ['cat','dog','rabbit','parrot','hamster','fish','other'];
const VALID_SEX     = ['male','female','unknown'];

router.get('/', async (req, res) => {
  const { owner_id } = req.query;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM pets WHERE owner_id = $1 ORDER BY created_at DESC',
      [owner_id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  const { owner_id, species, name, breed, sex, birth_date, weight_kg, notes, avatar_emoji } = req.body;
  if (!owner_id || !name) return res.status(400).json({ error: 'owner_id and name are required' });
  if (species && !VALID_SPECIES.includes(species)) return res.status(400).json({ error: 'invalid species' });
  if (sex     && !VALID_SEX.includes(sex))         return res.status(400).json({ error: 'invalid sex' });
  try {
    const { rows: [pet] } = await pool.query(
      `INSERT INTO pets (owner_id, species, name, breed, sex, birth_date, weight_kg, notes, avatar_emoji)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [owner_id, species || 'other', name, breed || null, sex || 'unknown',
       birth_date || null, weight_kg || null, notes || null, avatar_emoji || '🐾']
    );
    res.status(201).json(pet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows: [pet] } = await pool.query('SELECT * FROM pets WHERE id = $1', [req.params.id]);
    if (!pet) return res.status(404).json({ error: 'Not found' });
    res.json(pet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  const { species, name, breed, sex, birth_date, weight_kg, notes, avatar_emoji } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (species && !VALID_SPECIES.includes(species)) return res.status(400).json({ error: 'invalid species' });
  if (sex     && !VALID_SEX.includes(sex))         return res.status(400).json({ error: 'invalid sex' });
  try {
    const { rows: [pet] } = await pool.query(
      `UPDATE pets SET species=$1, name=$2, breed=$3, sex=$4, birth_date=$5,
       weight_kg=$6, notes=$7, avatar_emoji=$8 WHERE id=$9 RETURNING *`,
      [species || 'other', name, breed || null, sex || 'unknown',
       birth_date || null, weight_kg || null, notes || null, avatar_emoji || '🐾', req.params.id]
    );
    if (!pet) return res.status(404).json({ error: 'Not found' });
    res.json(pet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM pets WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
