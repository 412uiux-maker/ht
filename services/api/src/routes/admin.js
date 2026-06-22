const { Router } = require('express');
const pool = require('../db');
const router = Router();

function requireRole(...roles) {
  return (req, res, next) => {
    const email = req.headers['x-admin-email'];
    const password = req.headers['x-admin-password'];
    if (!email || !password) return res.status(401).json({ error: 'Unauthorized' });
    pool.query('SELECT * FROM admin_users WHERE email=$1 AND password=$2 AND is_active=true', [email, password])
      .then(r => {
        if (!r.rows[0]) return res.status(401).json({ error: 'Invalid credentials' });
        if (!roles.includes(r.rows[0].role)) return res.status(403).json({ error: 'Forbidden' });
        req.adminUser = r.rows[0];
        next();
      })
      .catch(err => res.status(500).json({ error: err.message }));
  };
}

async function writeAudit(actorId, actorRole, action, targetType, targetId, detail) {
  try {
    await pool.query(
      `INSERT INTO audit_log (actor_id, actor_role, action, target_type, target_id, detail, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [actorId, actorRole, action, targetType, String(targetId), JSON.stringify(detail || {})]
    );
  } catch (_) {}
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const r = await pool.query(
      'SELECT * FROM admin_users WHERE email=$1 AND password=$2 AND is_active=true',
      [email, password]
    );
    if (!r.rows[0]) return res.status(401).json({ error: 'Неверный email или пароль' });
    const { id, name, role } = r.rows[0];
    res.json({ id, email, name, role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── VENDORS / VERIFICATION ──────────────────────────────────────────────────
router.get('/vendors', requireRole('admin', 'moderator'), async (req, res) => {
  const { status = 'pending' } = req.query;
  try {
    const r = await pool.query(
      `SELECT v.id, v.name, v.specialty, v.bio, v.price_uzs, v.rating, v.avatar_emoji, v.is_available,
              vv.status as verification_status, vv.comment, vv.created_at as submitted_at,
              vc.email
       FROM vets v
       LEFT JOIN vendor_verification vv ON vv.vet_id = v.id
       LEFT JOIN vendor_credentials vc ON vc.vet_id = v.id
       WHERE vv.status = $1
       ORDER BY vv.created_at DESC`,
      [status]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/vendors/:id', requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT v.*, vv.status as verification_status, vv.comment, vc.email
       FROM vets v
       LEFT JOIN vendor_verification vv ON vv.vet_id = v.id
       LEFT JOIN vendor_credentials vc ON vc.vet_id = v.id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/vendors/:id/verify', requireRole('admin', 'moderator'), async (req, res) => {
  const { action, comment } = req.body;
  if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  const status = action === 'approve' ? 'verified' : 'rejected';
  try {
    await pool.query(
      `INSERT INTO vendor_verification (vet_id, status, comment, reviewed_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (vet_id) DO UPDATE SET status=$2, comment=$3, reviewed_at=NOW()`,
      [req.params.id, status, comment || null]
    );
    if (status === 'verified') {
      await pool.query('UPDATE vets SET is_available=true WHERE id=$1', [req.params.id]);
    }
    await writeAudit(req.adminUser.id, req.adminUser.role, `vendor.${action}`, 'vendor', req.params.id, { comment });
    res.json({ success: true, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ORDERS ──────────────────────────────────────────────────────────────────
router.get('/orders', requireRole('admin', 'support'), async (req, res) => {
  const { status, q, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let where = '1=1';
    const params = [];
    if (status) { params.push(status); where += ` AND o.status=$${params.length}`; }
    if (q) { params.push(`%${q}%`); where += ` AND o.owner_id ILIKE $${params.length}`; }
    const dataParams = [...params, Number(limit), offset];
    const r = await pool.query(
      `SELECT o.*, v.name as vet_name, v.specialty
       FROM orders o
       LEFT JOIN vets v ON v.id = o.vet_id
       WHERE ${where}
       ORDER BY o.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );
    const tot = await pool.query(`SELECT COUNT(*) FROM orders o WHERE ${where}`, params);
    res.json({ orders: r.rows, total: parseInt(tot.rows[0].count) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders/:id', requireRole('admin', 'support'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.*, v.name as vet_name FROM orders o LEFT JOIN vets v ON v.id=o.vet_id WHERE o.id=$1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/orders/:id/refund', requireRole('admin', 'support'), async (req, res) => {
  const { reason } = req.body;
  try {
    const r = await pool.query(
      `UPDATE orders SET status='refunded' WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'order.refund', 'order', req.params.id, { reason });
    res.json({ success: true, order: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────
router.get('/audit', requireRole('admin'), async (req, res) => {
  const { page = 1, limit = 50, action } = req.query;
  try {
    const params = [Number(limit), (Number(page) - 1) * Number(limit)];
    let where = '1=1';
    if (action) { params.push(action); where += ` AND al.action=$${params.length}`; }
    const r = await pool.query(
      `SELECT al.*, au.name as actor_name FROM audit_log al
       LEFT JOIN admin_users au ON au.id = al.actor_id
       WHERE ${where}
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );
    const tot = await pool.query(`SELECT COUNT(*) FROM audit_log al WHERE ${where}`, action ? [action] : []);
    res.json({ entries: r.rows, total: parseInt(tot.rows[0].count) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
router.get('/stats', requireRole('admin', 'moderator', 'support'), async (req, res) => {
  try {
    const [rev, revToday, consultStats, vetStats, verif, users] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(price_uzs),0) AS total FROM orders WHERE status IN ('paid','completed')`),
      pool.query(`SELECT COALESCE(SUM(price_uzs),0) AS total FROM orders WHERE status IN ('paid','completed') AND created_at >= CURRENT_DATE`),
      pool.query(`SELECT status, COUNT(*) as cnt FROM consultations GROUP BY status`),
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_available) as available FROM vets`),
      pool.query(`SELECT COUNT(*) as cnt FROM vendor_verification WHERE status='pending'`),
      pool.query(`SELECT COUNT(DISTINCT owner_id) as cnt FROM orders`),
    ]);
    const cMap = Object.fromEntries(consultStats.rows.map(r => [r.status, parseInt(r.cnt)]));
    res.json({
      revenue_total:    parseInt(rev.rows[0].total),
      revenue_today:    parseInt(revToday.rows[0].total),
      consult_pending:  cMap.pending || 0,
      consult_active:   cMap.active  || 0,
      consult_completed:cMap.completed || 0,
      vets_total:       parseInt(vetStats.rows[0].total),
      vets_available:   parseInt(vetStats.rows[0].available),
      verif_pending:    parseInt(verif.rows[0].cnt),
      users_total:      parseInt(users.rows[0].cnt),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── CONSULTATIONS ────────────────────────────────────────────────────────────
router.get('/consultations', requireRole('admin', 'support'), async (req, res) => {
  const { status, q, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    const params = [];
    let where = '1=1';
    if (status) { params.push(status); where += ` AND c.status=$${params.length}`; }
    if (q) { params.push(`%${q}%`); where += ` AND (c.client_name ILIKE $${params.length} OR c.pet_name ILIKE $${params.length} OR v.name ILIKE $${params.length})`; }
    const dataP = [...params, Number(limit), offset];
    const r = await pool.query(
      `SELECT c.id, c.client_name, c.pet_name, c.pet_species, c.problem, c.status,
              c.summary, c.report, c.created_at,
              v.name as vet_name, v.avatar_emoji as vet_emoji
       FROM consultations c
       LEFT JOIN vets v ON v.id = c.vet_id
       WHERE ${where}
       ORDER BY c.created_at DESC
       LIMIT $${dataP.length-1} OFFSET $${dataP.length}`,
      dataP
    );
    const tot = await pool.query(`SELECT COUNT(*) FROM consultations c LEFT JOIN vets v ON v.id=c.vet_id WHERE ${where}`, params);
    res.json({ consultations: r.rows, total: parseInt(tot.rows[0].count) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PROMO CODES ─────────────────────────────────────────────────────────────
router.get('/promos', requireRole('admin', 'moderator'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/promos', requireRole('admin'), async (req, res) => {
  const { code, discount_type, discount_value, max_uses, expires_at } = req.body;
  if (!code || !discount_type || !discount_value)
    return res.status(400).json({ error: 'code, discount_type, discount_value required' });
  try {
    const r = await pool.query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, expires_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [code.toUpperCase(), discount_type, Number(discount_value),
       max_uses ? Number(max_uses) : null, expires_at || null]
    );
    await writeAudit(req.adminUser.id, req.adminUser.role, 'promo.create', 'promo', r.rows[0].id, { code });
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Такой код уже существует' });
    res.status(500).json({ error: e.message });
  }
});

router.patch('/promos/:id', requireRole('admin'), async (req, res) => {
  const { is_active } = req.body;
  try {
    const r = await pool.query(
      'UPDATE promo_codes SET is_active=$1 WHERE id=$2 RETURNING *',
      [Boolean(is_active), req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
