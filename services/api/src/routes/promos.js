const { serverError } = require('../helpers/respond');
const express = require('express');
const pool = require('../db');
const router = express.Router();

// POST /api/promos/validate  { code }
// Returns discount info or 404/400
router.post('/validate', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });
  try {
    const { rows: [promo] } = await pool.query(
      'SELECT * FROM promo_codes WHERE code=$1',
      [code.toUpperCase().trim()]
    );
    if (!promo)
      return res.status(404).json({ error: 'Промокод не найден' });
    if (!promo.is_active)
      return res.status(400).json({ error: 'Промокод деактивирован' });
    if (promo.expires_at && new Date(promo.expires_at) < new Date())
      return res.status(400).json({ error: 'Срок действия промокода истёк' });
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses)
      return res.status(400).json({ error: 'Лимит использований исчерпан' });

    res.json({
      id: promo.id,
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
    });
  } catch (e) { serverError(res, e); }
});

// POST /api/promos/use  { code }  — increment used_count after successful payment
router.post('/use', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code required' });
  try {
    await pool.query(
      'UPDATE promo_codes SET used_count = used_count + 1 WHERE code=$1',
      [code.toUpperCase().trim()]
    );
    res.json({ ok: true });
  } catch (e) { serverError(res, e); }
});

module.exports = router;
