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
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders/:id', requireAdmin('admin', 'support'), async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.*, v.name as vet_name FROM orders o LEFT JOIN vets v ON v.id=o.vet_id WHERE o.id=$1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
router.get('/stats', requireAdmin('admin', 'moderator', 'support'), async (req, res) => {
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
      revenue_total:     parseInt(rev.rows[0].total),
      revenue_today:     parseInt(revToday.rows[0].total),
      consult_pending:   cMap.pending || 0,
      consult_active:    cMap.active  || 0,
      consult_completed: cMap.completed || 0,
      vets_total:        parseInt(vetStats.rows[0].total),
      vets_available:    parseInt(vetStats.rows[0].available),
      verif_pending:     parseInt(verif.rows[0].cnt),
      users_total:       parseInt(users.rows[0].cnt),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PROMO CODES ─────────────────────────────────────────────────────────────
router.get('/promos', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
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
    res.status(500).json({ error: e.message });
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── CRUD ДОБРЫХ ДЕЛ ──────────────────────────────────────────────────────────

// GET /api/admin/deeds
router.get('/deeds', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM good_deeds ORDER BY sort_order, created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/deeds/:id
router.delete('/deeds/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM good_deeds WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'deed.delete', 'good_deed', req.params.id, {});
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/admin/content/:id
router.delete('/content/:id', requireAdmin('admin', 'moderator'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM learn_items WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    await writeAudit(req.adminUser.id, req.adminUser.role, 'content.delete', 'learn_item', req.params.id, {});
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
