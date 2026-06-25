const { Router } = require('express');
const pool = require('../db');
const router = Router();

// Demo-only payment simulation — unavailable in production
router.post('/simulate', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found' });
  const { consultation_id, provider, amount_uzs, owner_id } = req.body;

  if (!consultation_id || !provider || !amount_uzs) {
    return res.status(400).json({ error: 'consultation_id, provider, amount_uzs required' });
  }
  if (!['click', 'payme', 'uzum'].includes(provider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  try {
    // Resolve vet_id from consultation
    const c = await pool.query('SELECT vet_id FROM consultations WHERE id = $1', [consultation_id]);
    if (!c.rows[0]) return res.status(404).json({ error: 'Consultation not found' });

    const ref = `DEMO-${provider.toUpperCase()}-${Date.now()}`;

    const r = await pool.query(
      `INSERT INTO orders
         (owner_id, vet_id, service_type, consultation_id, status, price_uzs, provider)
       VALUES ($1, $2, 'vet_online', $3, 'paid', $4, $5)
       RETURNING id`,
      [owner_id || 'anonymous', c.rows[0].vet_id, consultation_id, amount_uzs, provider]
    );

    res.json({ success: true, order_id: r.rows[0].id, ref, amount_uzs, provider });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Webhook stub — real providers POST here on payment events
router.post('/webhook/:provider', (req, res) => {
  // TODO: verify signature, update order status
  res.json({ received: true });
});

module.exports = router;
