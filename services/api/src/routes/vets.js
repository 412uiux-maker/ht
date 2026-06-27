const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.*, COUNT(r.id)::int AS review_count
       FROM vets v
       LEFT JOIN reviews r ON r.vet_id = v.id AND r.status = 'published'
       WHERE v.is_available = true
       GROUP BY v.id
       ORDER BY v.rating DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/vets/:id/reviews — public reviews for a vet
router.get('/:id/reviews', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.rating, r.text, r.reply, r.created_at,
              COALESCE(c.client_name, r.owner_id) AS client_name
       FROM reviews r
       LEFT JOIN orders o ON o.id = r.order_id
       LEFT JOIN consultations c ON c.id = o.consultation_id::uuid
       WHERE r.vet_id = $1 AND r.status = 'published'
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
