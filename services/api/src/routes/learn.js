const { serverError } = require('../helpers/respond');
const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/learn?owner_id=&type=&species=
router.get('/', async (req, res) => {
  const { owner_id, type, species } = req.query;
  try {
    let q = 'SELECT * FROM learn_items WHERE is_published';
    const params = [];
    if (type)    { params.push(type);    q += ` AND type = $${params.length}`; }
    if (species) { params.push(species); q += ` AND (species IS NULL OR $${params.length} = ANY(species))`; }
    q += ' ORDER BY sort_order, id';
    const { rows: items } = await pool.query(q, params);

    if (owner_id && items.length) {
      const ids = items.map(i => i.id);
      const { rows: prog } = await pool.query(
        'SELECT * FROM learn_progress WHERE owner_id = $1 AND item_id = ANY($2)',
        [owner_id, ids]
      );
      const progMap = Object.fromEntries(prog.map(p => [p.item_id, p]));
      return res.json(items.map(i => ({ ...i, progress: progMap[i.id] || null })));
    }

    res.json(items.map(i => ({ ...i, progress: null })));
  } catch (e) {
    serverError(res, e);
  }
});

// GET /api/learn/:id?owner_id=
router.get('/:id', async (req, res) => {
  try {
    const { rows: [item] } = await pool.query(
      'SELECT * FROM learn_items WHERE id = $1 AND is_published', [req.params.id]
    );
    if (!item) return res.status(404).json({ error: 'Not found' });

    let progress = null;
    if (req.query.owner_id) {
      const { rows: [p] } = await pool.query(
        'SELECT * FROM learn_progress WHERE owner_id = $1 AND item_id = $2',
        [req.query.owner_id, item.id]
      );
      progress = p || null;
    }
    res.json({ ...item, progress });
  } catch (e) {
    serverError(res, e);
  }
});

// POST /api/learn/:id/progress  { owner_id, status, checked_steps? }
router.post('/:id/progress', async (req, res) => {
  const { owner_id, status, checked_steps } = req.body;
  if (!owner_id) return res.status(400).json({ error: 'owner_id required' });
  if (!['started','completed'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  try {
    const { rows: [prog] } = await pool.query(
      `INSERT INTO learn_progress (owner_id, item_id, status, checked_steps, completed_at)
       VALUES ($1,$2,$3,$4, $5)
       ON CONFLICT (owner_id, item_id) DO UPDATE
         SET status        = EXCLUDED.status,
             checked_steps = EXCLUDED.checked_steps,
             completed_at  = EXCLUDED.completed_at
       RETURNING *`,
      [owner_id, req.params.id, status,
       JSON.stringify(checked_steps || []),
       status === 'completed' ? new Date() : null]
    );
    res.json(prog);
  } catch (e) {
    serverError(res, e);
  }
});

module.exports = router;
