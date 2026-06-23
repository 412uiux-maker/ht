const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/orders?owner_id=...
router.get('/', async (req, res) => {
  const { owner_id } = req.query;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  try {
    const { rows } = await pool.query(
      `SELECT
         o.id, o.service_type, o.consultation_id, o.status, o.price_uzs,
         o.provider, o.created_at,
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

module.exports = router;
