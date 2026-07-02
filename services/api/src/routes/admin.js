const { serverError } = require('../helpers/respond');
const { validate, body, param } = require('../middleware/validate');
const { Router } = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { requireAdmin, signToken } = require('../middleware/auth');

const router = Router();

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
router.post('/login',
  validate([
    body('email').required().email().maxLen(255),
    body('password').required().string().minLen(6).maxLen(128),
  ]),
  async (req, res) => {
  const { email, password } = req.body;
  try {
    const r = await pool.query(
      'SELECT * FROM admin_users WHERE email=$1 AND is_active=true',
      [email.toLowerCase().trim()]
    );
    const user = r.rows[0];
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = signToken({
      sub: user.id,
      type: 'admin',
      email: user.email,
      name: user.name,
      role: user.role,
    }, '8h');

    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, token });
  } catch (e) { serverError(res, e); }
});

// ─── VENDORS / VERIFICATION ──────────────────────────────────────────────────
router.get('/vendors', requireAdmin('admin', 'moderator'), async (req, res) => {
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
  } catch (e) { serverError(res, e); }
});

router.get('/vendors/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
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
  } catch (e) { serverError(res, e); }
});

router.post('/vendors/:id/verify', requireAdmin('admin', 'moderator'), async (req, res) => {
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
  } catch (e) { serverError(res, e); }
});

// ─── ORDERS ──────────────────────────────────────────────────────────────────
router.get('/orders', requireAdmin('admin', 'support'), async (req, res) => {
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
  } catch (e) { serverError(res, e); }
});

router.get('/orders/:id', requireAdmin('admin', 'support'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.*, v.name as vet_name FROM orders o LEFT JOIN vets v ON v.id=o.vet_id WHERE o.id=$1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { serverError(res, e); }
});

router.post('/orders/:id/refund', requireAdmin('admin', 'support'), async (req, res) => {
  const { reason } = req.body;
  try {
    const r = await pool.query(
      `UPDATE orders SET status='refunded' WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'order.refund', 'order', req.params.id, { reason });
    res.json({ success: true, order: r.rows[0] });
  } catch (e) { serverError(res, e); }
});

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────
router.get('/audit', requireAdmin('admin'), async (req, res) => {
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
  } catch (e) { serverError(res, e); }
});

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
router.get('/stats', requireAdmin('admin', 'moderator', 'support'), async (req, res) => {
  try {
    const [rev, revToday, consultStats, vetStats, verif, users, disputes] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(price_uzs),0) AS total FROM orders WHERE status IN ('paid','completed')`),
      pool.query(`SELECT COALESCE(SUM(price_uzs),0) AS total FROM orders WHERE status IN ('paid','completed') AND created_at >= CURRENT_DATE`),
      pool.query(`SELECT status, COUNT(*) as cnt FROM consultations GROUP BY status`),
      pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_available) as available FROM vets`),
      pool.query(`SELECT COUNT(*) as cnt FROM vendor_verification WHERE status='pending'`),
      pool.query(`SELECT COUNT(DISTINCT owner_id) as cnt FROM orders`),
      pool.query(`SELECT COUNT(*) as cnt FROM disputes WHERE status='open'`),
    ]);
    const cMap = Object.fromEntries(consultStats.rows.map(r => [r.status, parseInt(r.cnt)]));
    res.json({
      revenue_total:     parseInt(rev.rows[0].total),
      revenue_today:     parseInt(revToday.rows[0].total),
      consult_pending:   cMap.pending || 0,
      consult_active:    cMap.active  || 0,
      consult_completed: cMap.completed || 0,
      vets_total:        parseInt(vetStats.rows[0].total),
      vets_available:    parseInt(vetStats.rows[0].available),
      verif_pending:     parseInt(verif.rows[0].cnt),
      users_total:       parseInt(users.rows[0].cnt),
      disputes_open:     parseInt(disputes.rows[0].cnt),
    });
  } catch (e) { serverError(res, e); }
});

// ─── CONSULTATIONS ────────────────────────────────────────────────────────────
router.get('/consultations', requireAdmin('admin', 'support'), async (req, res) => {
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
  } catch (e) { serverError(res, e); }
});

// ─── PROMO CODES ─────────────────────────────────────────────────────────────
router.get('/promos', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { serverError(res, e); }
});

router.post('/promos', requireAdmin('admin'), async (req, res) => {
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
    serverError(res, e);
  }
});

router.patch('/promos/:id', requireAdmin('admin'), async (req, res) => {
  const { is_active } = req.body;
  try {
    const r = await pool.query(
      'UPDATE promo_codes SET is_active=$1 WHERE id=$2 RETURNING *',
      [Boolean(is_active), req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { serverError(res, e); }
});

// ─── МОДЕРАЦИЯ ОТЗЫВОВ ────────────────────────────────────────────────────────

// GET /api/admin/reviews?status=
router.get('/reviews', requireAdmin('admin', 'moderator'), async (req, res) => {
  const { status } = req.query;
  try {
    const cond = status ? 'WHERE r.status=$1' : '';
    const args = status ? [status] : [];
    const { rows } = await pool.query(
      `SELECT r.id, r.rating, r.text, r.reply, r.status, r.owner_id, r.created_at,
              v.name AS vet_name, v.avatar_emoji AS vet_emoji
       FROM reviews r LEFT JOIN vets v ON v.id = r.vet_id
       ${cond} ORDER BY r.created_at DESC LIMIT 200`,
      args
    );
    res.json(rows);
  } catch (e) { serverError(res, e); }
});

// POST /api/admin/reviews/:id/moderate  { action: 'publish' | 'hide' }
router.post('/reviews/:id/moderate', requireAdmin('admin', 'moderator'), async (req, res) => {
  const { action } = req.body;
  if (!['publish', 'hide'].includes(action)) return res.status(400).json({ error: 'invalid action' });
  const status = action === 'publish' ? 'published' : 'hidden';
  try {
    const { rows: [row] } = await pool.query(
      'UPDATE reviews SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    await writeAudit(req.adminUser.id, req.adminUser.role, `review.${action}`, 'review', req.params.id, {});
    res.json(row);
  } catch (e) { serverError(res, e); }
});

// ─── CRUD ДОБРЫХ ДЕЛ ──────────────────────────────────────────────────────────

// GET /api/admin/deeds
router.get('/deeds', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM good_deeds ORDER BY sort_order, created_at DESC');
    res.json(rows);
  } catch (e) { serverError(res, e); }
});

// POST /api/admin/deeds
router.post('/deeds', requireAdmin('admin', 'moderator'), async (req, res) => {
  const { title, subtitle, description, category, goal_amount, emoji, deadline, status, sort_order } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'title and category required' });
  try {
    const { rows: [row] } = await pool.query(
      `INSERT INTO good_deeds (title, subtitle, description, category, goal_amount, emoji, deadline, status, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title.trim(), subtitle || '', description || '', category,
       goal_amount || null, emoji || '🤝', deadline || null, status || 'active', Number(sort_order) || 0]
    );
    await writeAudit(req.adminUser.id, req.adminUser.role, 'deed.create', 'good_deed', String(row.id), { title });
    res.json(row);
  } catch (e) { serverError(res, e); }
});

// PATCH /api/admin/deeds/:id
router.patch('/deeds/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  const { title, subtitle, description, category, goal_amount, emoji, deadline, status, sort_order } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'title and category required' });
  try {
    const { rows: [row] } = await pool.query(
      `UPDATE good_deeds SET title=$1, subtitle=$2, description=$3, category=$4, goal_amount=$5,
         emoji=$6, deadline=$7, status=$8, sort_order=$9 WHERE id=$10 RETURNING *`,
      [title.trim(), subtitle || '', description || '', category,
       goal_amount || null, emoji || '🤝', deadline || null, status || 'active', Number(sort_order) || 0, req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'deed.update', 'good_deed', req.params.id, { title });
    res.json(row);
  } catch (e) { serverError(res, e); }
});

// DELETE /api/admin/deeds/:id
router.delete('/deeds/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM good_deeds WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'deed.delete', 'good_deed', req.params.id, {});
    res.json({ ok: true });
  } catch (e) { serverError(res, e); }
});

// ── Content (learn_items) CRUD ────────────────────────────────────────────────

// GET /api/admin/content?type=
router.get('/content', requireAdmin('admin', 'moderator'), async (req, res) => {
  const { type } = req.query;
  try {
    let q = `SELECT li.*,
               COALESCE((SELECT COUNT(*)::int FROM learn_progress lp WHERE lp.item_id = li.id), 0) AS views
             FROM learn_items li WHERE 1=1`;
    const params = [];
    if (type) { params.push(type); q += ` AND li.type = $${params.length}`; }
    q += ' ORDER BY li.sort_order, li.id DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (e) { serverError(res, e); }
});

// POST /api/admin/content
router.post('/content', requireAdmin('admin', 'moderator'), async (req, res) => {
  const { type, category, title, subtitle, emoji, author, body, duration_min, is_published, sort_order, level, tags } = req.body;
  if (!type || !title) return res.status(400).json({ error: 'type and title required' });
  try {
    const { rows: [row] } = await pool.query(
      `INSERT INTO learn_items (type, category, title, subtitle, emoji, author, body, duration_min, is_published, sort_order, level, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [type, category || 'other', title.trim(), subtitle || '', emoji || '📄',
       author || 'Редакция', body || '', Number(duration_min) || 5,
       Boolean(is_published), Number(sort_order) || 0,
       level || 'beginner', tags || []]
    );
    await writeAudit(req.adminUser.id, req.adminUser.role, 'content.create', 'learn_item', String(row.id), { title });
    res.json({ ...row, views: 0 });
  } catch (e) { serverError(res, e); }
});

// PATCH /api/admin/content/:id
router.patch('/content/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  const { type, category, title, subtitle, emoji, author, body, duration_min, is_published, sort_order, level, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const { rows: [row] } = await pool.query(
      `UPDATE learn_items SET type=$1, category=$2, title=$3, subtitle=$4, emoji=$5,
         author=$6, body=$7, duration_min=$8, is_published=$9, sort_order=$10, level=$11, tags=$12
       WHERE id=$13 RETURNING *`,
      [type, category || 'other', title.trim(), subtitle || '', emoji || '📄',
       author || 'Редакция', body || '', Number(duration_min) || 5,
       Boolean(is_published), Number(sort_order) || 0,
       level || 'beginner', tags || [], req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'content.update', 'learn_item', req.params.id, { title });
    const views = await pool.query('SELECT COUNT(*)::int AS v FROM learn_progress WHERE item_id=$1', [row.id]);
    res.json({ ...row, views: views.rows[0]?.v ?? 0 });
  } catch (e) { serverError(res, e); }
});

// DELETE /api/admin/content/:id
router.delete('/content/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM learn_items WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'content.delete', 'learn_item', req.params.id, {});
    res.json({ ok: true });
  } catch (e) { serverError(res, e); }
});

// ─── USERS ───────────────────────────────────────────────────────────────────

// GET /api/admin/users?q=&role=&page=
router.get('/users', requireAdmin('admin', 'moderator', 'support'), async (req, res) => {
  const { q, role, page = 1 } = req.query;
  const limit = 50;
  const offset = (Number(page) - 1) * limit;
  try {
    const [{ rows: owners }, { rows: vendors }, { rows: admins }] = await Promise.all([
      pool.query(
        `SELECT u.id::text AS id, COALESCE(u.name,'—') AS name, null::text AS email, null::text AS phone,
                'owner' AS role, u.created_at, u.is_blocked,
                COUNT(DISTINCT o.id)::int AS orders_count
         FROM users u
         LEFT JOIN orders o ON o.owner_id = u.id::text
         GROUP BY u.id, u.name, u.created_at, u.is_blocked`
      ),
      pool.query(
        `SELECT v.id::text AS id, v.name, vc.email, vc.phone,
                'vendor' AS role, v.created_at, (NOT v.is_available) AS is_blocked,
                COUNT(DISTINCT o.id)::int AS orders_count
         FROM vets v
         LEFT JOIN vendor_credentials vc ON vc.vet_id = v.id
         LEFT JOIN orders o ON o.vet_id = v.id
         GROUP BY v.id, v.name, vc.email, vc.phone, v.created_at, v.is_available`
      ),
      pool.query(
        `SELECT id::text AS id, name, email, null::text AS phone,
                role, created_at, (NOT is_active) AS is_blocked, 0 AS orders_count
         FROM admin_users`
      ),
    ]);

    let all = [...owners, ...vendors, ...admins]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (role && role !== 'all') all = all.filter(u => u.role === role);
    if (q) {
      const lq = String(q).toLowerCase();
      all = all.filter(u =>
        (u.name || '').toLowerCase().includes(lq) ||
        (u.email || '').toLowerCase().includes(lq) ||
        (u.phone || '').includes(q)
      );
    }

    const total = all.length;
    res.json({ users: all.slice(offset, offset + limit), total });
  } catch (e) { serverError(res, e); }
});

// POST /api/admin/users/:id/block  { blocked: boolean }
router.post('/users/:id/block', requireAdmin('admin'), async (req, res) => {
  const { blocked } = req.body;
  const id = req.params.id;
  try {
    const { rowCount: u } = await pool.query(
      'UPDATE users SET is_blocked=$1 WHERE id::text=$2',
      [Boolean(blocked), id]
    );
    if (u) {
      await writeAudit(req.adminUser.id, req.adminUser.role,
        blocked ? 'user.block' : 'user.unblock', 'user', id, {});
      return res.json({ ok: true });
    }
    const { rowCount: v } = await pool.query(
      'UPDATE vets SET is_available=$1 WHERE id::text=$2',
      [!Boolean(blocked), id]
    );
    if (v) {
      await writeAudit(req.adminUser.id, req.adminUser.role,
        blocked ? 'user.block' : 'user.unblock', 'vendor', id, {});
      return res.json({ ok: true });
    }
    const { rowCount: a } = await pool.query(
      'UPDATE admin_users SET is_active=$1 WHERE id::text=$2',
      [!Boolean(blocked), id]
    );
    if (a) {
      await writeAudit(req.adminUser.id, req.adminUser.role,
        blocked ? 'user.block' : 'user.unblock', 'admin_user', id, {});
      return res.json({ ok: true });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (e) { serverError(res, e); }
});

// POST /api/admin/users/:id/role  { role }
router.post('/users/:id/role', requireAdmin('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['moderator', 'support', 'admin'].includes(role))
    return res.status(400).json({ error: 'Invalid role for admin user' });
  try {
    const { rowCount } = await pool.query(
      'UPDATE admin_users SET role=$1 WHERE id::text=$2',
      [role, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Admin user not found' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'user.role_change', 'admin_user', req.params.id, { role });
    res.json({ ok: true });
  } catch (e) { serverError(res, e); }
});

// ─── FINANCE (admin only) ─────────────────────────────────────────────────────

// GET /api/admin/finance/stats
router.get('/finance/stats', requireAdmin('admin'), async (req, res) => {
  try {
    const { rows: [rev] } = await pool.query(`
      SELECT
        COALESCE(SUM(p.amount_uzs),0)                                       AS total_revenue,
        COALESCE(SUM(ROUND(p.amount_uzs * COALESCE(o.commission_rate,0.15))),0) AS total_commission,
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month',p.paid_at)=DATE_TRUNC('month',NOW())
                         THEN p.amount_uzs END),0)                          AS month_revenue
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.status = 'paid'
    `);
    const { rows: [pend] } = await pool.query(`
      SELECT COALESCE(SUM(amount_uzs),0) AS pending_payouts,
             COUNT(*) AS pending_count
      FROM vendor_payouts WHERE status='pending'
    `);
    res.json({
      total_revenue:    Number(rev.total_revenue),
      total_commission: Number(rev.total_commission),
      month_revenue:    Number(rev.month_revenue),
      pending_payouts:  Number(pend.pending_payouts),
      pending_count:    Number(pend.pending_count),
    });
  } catch (e) { serverError(res, e); }
});

// GET /api/admin/finance/transactions?page=1&limit=50
router.get('/finance/transactions', requireAdmin('admin'), async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
  const offset = (page - 1) * limit;
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.amount_uzs,
        ROUND(p.amount_uzs * COALESCE(o.commission_rate, 0.15))::int AS commission,
        p.status,
        p.provider,
        COALESCE(p.paid_at, p.created_at) AS date,
        v.name   AS vendor_name,
        o.service_type
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      LEFT JOIN vets v ON v.id = o.vet_id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    const { rows: [ct] } = await pool.query('SELECT COUNT(*) FROM payments');
    res.json({ transactions: rows, total: Number(ct.count) });
  } catch (e) { serverError(res, e); }
});

// GET /api/admin/finance/payouts?status=pending
router.get('/finance/payouts', requireAdmin('admin'), async (req, res) => {
  const { status } = req.query;
  try {
    const params = status ? [status] : [];
    const { rows } = await pool.query(`
      SELECT vp.*, v.name AS vendor_name
      FROM vendor_payouts vp
      LEFT JOIN vets v ON v.id = vp.vet_id
      ${status ? 'WHERE vp.status=$1' : ''}
      ORDER BY vp.requested_at DESC
      LIMIT 200
    `, params);
    res.json(rows);
  } catch (e) { serverError(res, e); }
});

// POST /api/admin/finance/payouts/:id/approve  { admin_note? }
router.post('/finance/payouts/:id/approve', requireAdmin('admin'), async (req, res) => {
  try {
    const { rows: [row] } = await pool.query(
      `UPDATE vendor_payouts
       SET status='approved', admin_note=$1, resolved_at=NOW(), resolved_by=$2
       WHERE id=$3 AND status='pending'
       RETURNING *`,
      [req.body.admin_note || null, req.adminUser.id, req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Payout not found or already resolved' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'payout.approve', 'vendor_payout', req.params.id, { amount: row.amount_uzs });
    res.json(row);
  } catch (e) { serverError(res, e); }
});

// POST /api/admin/finance/payouts/:id/reject  { reason }
router.post('/finance/payouts/:id/reject', requireAdmin('admin'), async (req, res) => {
  try {
    const { rows: [row] } = await pool.query(
      `UPDATE vendor_payouts
       SET status='rejected', admin_note=$1, resolved_at=NOW(), resolved_by=$2
       WHERE id=$3 AND status='pending'
       RETURNING *`,
      [req.body.reason || null, req.adminUser.id, req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Payout not found or already resolved' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'payout.reject', 'vendor_payout', req.params.id, { reason: req.body.reason });
    res.json(row);
  } catch (e) { serverError(res, e); }
});

// ─── DISPUTES ────────────────────────────────────────────────────────────────

// GET /api/admin/disputes?status=open|resolved|closed&page=
router.get('/disputes', requireAdmin('admin', 'support'), async (req, res) => {
  const { status = 'open', page = 1, limit = 30 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    const { rows } = await pool.query(
      `SELECT d.id, d.reason, d.status, d.created_at, d.owner_id,
              c.client_name, c.pet_name, c.pet_species, c.id AS consultation_id,
              v.name AS vet_name
       FROM disputes d
       LEFT JOIN consultations c ON c.id = d.consultation_id
       LEFT JOIN vets v ON v.id = c.vet_id
       WHERE ($1 = 'all' OR d.status = $1)
       ORDER BY d.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, Number(limit), offset]
    );
    const { rows: [cnt] } = await pool.query(
      `SELECT COUNT(*) FROM disputes WHERE ($1 = 'all' OR status = $1)`, [status]
    );
    res.json({ disputes: rows, total: parseInt(cnt.count) });
  } catch (e) { serverError(res, e); }
});

// GET /api/admin/disputes/:id  → dispute + messages[]
router.get('/disputes/:id', requireAdmin('admin', 'support'), async (req, res) => {
  try {
    const { rows: [d] } = await pool.query(
      `SELECT d.id, d.reason, d.status, d.resolution, d.resolved_by, d.resolved_at, d.created_at, d.owner_id,
              c.client_name, c.pet_name, c.pet_species, c.id AS consultation_id, c.problem,
              v.name AS vet_name
       FROM disputes d
       LEFT JOIN consultations c ON c.id = d.consultation_id
       LEFT JOIN vets v ON v.id = c.vet_id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (!d) return res.status(404).json({ error: 'Not found' });
    const { rows: messages } = await pool.query(
      `SELECT id, sender, sender_name, text, created_at
       FROM dispute_messages WHERE dispute_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json({ dispute: d, messages });
  } catch (e) { serverError(res, e); }
});

// POST /api/admin/disputes/:id/messages  { text }
router.post('/disputes/:id/messages', requireAdmin('admin', 'support'), async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });
  try {
    const { rows: [msg] } = await pool.query(
      `INSERT INTO dispute_messages (dispute_id, sender, sender_name, text)
       VALUES ($1, 'admin', $2, $3) RETURNING *`,
      [req.params.id, req.adminUser.name || 'Поддержка', text.trim()]
    );
    await writeAudit(req.adminUser.id, req.adminUser.role, 'dispute.message', 'disputes', String(req.params.id), { text: text.trim() });
    res.json(msg);
  } catch (e) { serverError(res, e); }
});

// POST /api/admin/disputes/:id/resolve  { status: 'resolved'|'closed', resolution? }
router.post('/disputes/:id/resolve', requireAdmin('admin', 'support'), async (req, res) => {
  const { status = 'resolved', resolution = '' } = req.body;
  if (!['resolved', 'closed'].includes(status))
    return res.status(400).json({ error: 'status must be resolved or closed' });
  try {
    const { rows: [row] } = await pool.query(
      `UPDATE disputes
       SET status=$1, resolution=$2, resolved_by=$3, resolved_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, resolution.trim() || null, req.adminUser.name || req.adminUser.id, req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    // Post resolution as system message so it appears in thread
    if (resolution?.trim()) {
      await pool.query(
        `INSERT INTO dispute_messages (dispute_id, sender, sender_name, text)
         VALUES ($1, 'system', 'Решение', $2)`,
        [req.params.id, resolution.trim()]
      );
    }
    await writeAudit(req.adminUser.id, req.adminUser.role, 'dispute.resolve', 'disputes', String(req.params.id), { status, resolution });
    res.json(row);
  } catch (e) { serverError(res, e); }
});

// ─── SETTINGS (admin only) ────────────────────────────────────────────────────

// GET /api/admin/settings
router.get('/settings', requireAdmin('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM platform_settings ORDER BY key');
    // Return as flat object { key: value }
    res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
  } catch (e) { serverError(res, e); }
});

// ── Places management ─────────────────────────────────────────────────────────

// GET /api/admin/places
router.get('/places', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM places ORDER BY sort_order, name_ru');
    res.json(rows);
  } catch (e) { serverError(res, e); }
});

// POST /api/admin/places
router.post('/places', requireAdmin('admin', 'moderator'), async (req, res) => {
  const { id, type, name_ru, name_uz, address_ru, address_uz, desc_ru, desc_uz,
          emoji, color, rating, pets_allowed, working_hours, phone, tags } = req.body;
  if (!name_ru || !type) return res.status(400).json({ error: 'name_ru and type required' });
  try {
    const newId = id || ('p' + Date.now());
    const { rows: [row] } = await pool.query(
      `INSERT INTO places (id, type, name_ru, name_uz, address_ru, address_uz, desc_ru, desc_uz,
         emoji, color, rating, pets_allowed, working_hours, phone, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (id) DO UPDATE SET
         type=$2, name_ru=$3, name_uz=$4, address_ru=$5, address_uz=$6,
         desc_ru=$7, desc_uz=$8, emoji=$9, color=$10, rating=$11,
         pets_allowed=$12, working_hours=$13, phone=$14, tags=$15
       RETURNING *`,
      [newId, type, name_ru, name_uz || '', address_ru || '', address_uz || '',
       desc_ru || '', desc_uz || '', emoji || '📍', color || '#E8911A',
       rating || 4.5, pets_allowed || [], working_hours || '', phone || '', tags || []]
    );
    await writeAudit(req.adminUser.id, req.adminUser.role, 'place.upsert', 'places', newId, { name_ru });
    res.json(row);
  } catch (e) { serverError(res, e); }
});

// PATCH /api/admin/places/:id
router.patch('/places/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const sets = Object.entries(req.body)
      .filter(([k]) => ['type','name_ru','name_uz','address_ru','address_uz','desc_ru','desc_uz',
        'emoji','color','rating','pets_allowed','working_hours','phone','tags','is_active','sort_order'].includes(k))
      .map(([k], i) => `${k}=$${i + 2}`)
    if (!sets.length) return res.status(400).json({ error: 'nothing to update' });
    const vals = Object.entries(req.body)
      .filter(([k]) => ['type','name_ru','name_uz','address_ru','address_uz','desc_ru','desc_uz',
        'emoji','color','rating','pets_allowed','working_hours','phone','tags','is_active','sort_order'].includes(k))
      .map(([, v]) => v)
    const { rows: [row] } = await pool.query(
      `UPDATE places SET ${sets.join(',')} WHERE id=$1 RETURNING *`,
      [req.params.id, ...vals]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { serverError(res, e); }
});

// DELETE /api/admin/places/:id
router.delete('/places/:id', requireAdmin('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM places WHERE id=$1', [req.params.id]);
    await writeAudit(req.adminUser.id, req.adminUser.role, 'place.delete', 'places', req.params.id, {});
    res.json({ ok: true });
  } catch (e) { serverError(res, e); }
});

// GET /api/admin/analytics?days=30
router.get('/analytics', requireAdmin('admin', 'support'), async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 90);
  try {
    const [daily, byStatus, topVets, newUsers] = await Promise.all([
      pool.query(
        `SELECT
           DATE(created_at AT TIME ZONE 'Asia/Tashkent') AS day,
           COUNT(*) AS orders,
           COALESCE(SUM(CASE WHEN status NOT IN ('cancelled','rejected','refunded') THEN price_uzs ELSE 0 END), 0) AS gmv
         FROM orders
         WHERE created_at >= NOW() - ($1 || ' days')::interval
         GROUP BY 1 ORDER BY 1`,
        [days]
      ),
      pool.query(
        `SELECT status, COUNT(*) AS cnt FROM orders
         WHERE created_at >= NOW() - ($1 || ' days')::interval
         GROUP BY status`,
        [days]
      ),
      pool.query(
        `SELECT v.name, v.avatar_emoji,
                COUNT(o.id) AS order_count,
                COALESCE(SUM(o.price_uzs),0) AS revenue
         FROM orders o JOIN vets v ON v.id = o.vet_id
         WHERE o.created_at >= NOW() - ($1 || ' days')::interval
           AND o.status NOT IN ('cancelled','rejected','refunded')
         GROUP BY v.id ORDER BY revenue DESC LIMIT 5`,
        [days]
      ),
      pool.query(
        `SELECT DATE(created_at AT TIME ZONE 'Asia/Tashkent') AS day, COUNT(*) AS cnt
         FROM users
         WHERE created_at >= NOW() - ($1 || ' days')::interval
         GROUP BY 1 ORDER BY 1`,
        [days]
      ),
    ]);
    res.json({
      daily: daily.rows,
      byStatus: byStatus.rows,
      topVets: topVets.rows,
      newUsers: newUsers.rows,
    });
  } catch (e) { serverError(res, e); }
});

// PUT /api/admin/settings  { key, value }
router.put('/settings', requireAdmin('admin'), async (req, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) return res.status(400).json({ error: 'key and value required' });
  try {
    await pool.query(
      `INSERT INTO platform_settings (key, value, updated_at) VALUES ($1,$2,NOW())
       ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`,
      [key, String(value)]
    );
    await writeAudit(req.adminUser.id, req.adminUser.role, 'settings.update', 'platform_settings', key, { value });
    res.json({ ok: true, key, value });
  } catch (e) { serverError(res, e); }
});

module.exports = router;
