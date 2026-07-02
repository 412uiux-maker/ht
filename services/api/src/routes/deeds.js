const { serverError } = require('../helpers/respond');
const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/deeds?status=&category=&owner_id=
router.get('/', async (req, res) => {
  const { status, category, owner_id } = req.query;
  try {
    let q = 'SELECT * FROM good_deeds WHERE 1=1';
    const params = [];
    if (status)   { params.push(status);   q += ` AND status = $${params.length}`; }
    if (category) { params.push(category); q += ` AND category = $${params.length}`; }
    q += ' ORDER BY sort_order, id';
    const { rows: deeds } = await pool.query(q, params);

    if (owner_id && deeds.length) {
      const ids = deeds.map(d => d.id);
      const { rows: parts } = await pool.query(
        'SELECT deed_id, array_agg(type) AS types FROM deed_participations WHERE owner_id=$1 AND deed_id=ANY($2) GROUP BY deed_id',
        [owner_id, ids]
      );
      const partMap = Object.fromEntries(parts.map(p => [p.deed_id, p.types]));
      return res.json(deeds.map(d => ({ ...d, my_types: partMap[d.id] || [] })));
    }

    res.json(deeds.map(d => ({ ...d, my_types: [] })));
  } catch (e) {
    serverError(res, e);
  }
});

// GET /api/deeds/:id?owner_id=
router.get('/:id', async (req, res) => {
  try {
    const { rows: [deed] } = await pool.query('SELECT * FROM good_deeds WHERE id=$1', [req.params.id]);
    if (!deed) return res.status(404).json({ error: 'Not found' });

    let my_types = [];
    if (req.query.owner_id) {
      const { rows } = await pool.query(
        'SELECT type FROM deed_participations WHERE owner_id=$1 AND deed_id=$2',
        [req.query.owner_id, deed.id]
      );
      my_types = rows.map(r => r.type);
    }

    const { rows: recent } = await pool.query(
      `SELECT type, amount_uzs, message, created_at
       FROM deed_participations WHERE deed_id=$1 ORDER BY created_at DESC LIMIT 10`,
      [deed.id]
    );

    res.json({ ...deed, my_types, recent_participations: recent });
  } catch (e) {
    serverError(res, e);
  }
});

// POST /api/deeds/:id/participate  { owner_id, type, amount_uzs?, message? }
router.post('/:id/participate', async (req, res) => {
  const { owner_id, type, amount_uzs, message } = req.body;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  if (!['donate', 'volunteer', 'share'].includes(type)) return res.status(400).json({ error: 'invalid type' });
  if (type === 'donate' && (!amount_uzs || amount_uzs < 1000)) {
    return res.status(400).json({ error: 'amount_uzs must be >= 1000' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO deed_participations (owner_id, deed_id, type, amount_uzs, message)
       VALUES ($1,$2,$3,$4,$5)`,
      [owner_id, req.params.id, type, amount_uzs || null, message || null]
    );

    if (type === 'donate') {
      await client.query(
        'UPDATE good_deeds SET raised_amount = raised_amount + $1, participants_count = participants_count + 1 WHERE id=$2',
        [amount_uzs, req.params.id]
      );
    } else {
      await client.query(
        'UPDATE good_deeds SET participants_count = participants_count + 1 WHERE id=$2',
        [req.params.id]
      );
    }

    await client.query('COMMIT');
    const { rows: [deed] } = await pool.query('SELECT * FROM good_deeds WHERE id=$1', [req.params.id]);
    res.json(deed);
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return res.status(409).json({ error: 'Already participated with this type' });
    serverError(res, e);
  } finally {
    client.release();
  }
});

module.exports = router;
