const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { requireVendor, signToken } = require('../middleware/auth');

const router = express.Router();
const DEV = process.env.NODE_ENV !== 'production';

// In-memory OTP store: phone → { code, expires }
const otpStore = new Map();

// POST /api/vendor/auth/send-code  { phone }
router.post('/auth/send-code', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });
  const normalized = phone.replace(/\s/g, '');
  try {
    const { rows: [cred] } = await pool.query(
      'SELECT vet_id FROM vendor_credentials WHERE phone = $1',
      [normalized]
    );
    if (!cred) return res.status(404).json({ error: 'Номер не зарегистрирован' });
    const code = String(Math.floor(1000 + Math.random() * 9000));
    otpStore.set(normalized, { code, expires: Date.now() + 5 * 60 * 1000 });
    console.log(`[OTP] ${normalized} → ${code}`);
    // TODO: replace with real SMS gateway (Click SMS, SMSC, etc.)
    const resp = { sent: true };
    if (DEV) resp._dev_code = code;  // Never expose OTP in production
    res.json(resp);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/vendor/auth/verify-code  { phone, code }
router.post('/auth/verify-code', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });
  const normalized = phone.replace(/\s/g, '');
  const stored = otpStore.get(normalized);
  if (!stored) return res.status(400).json({ error: 'Сначала запросите код' });
  if (Date.now() > stored.expires) {
    otpStore.delete(normalized);
    return res.status(400).json({ error: 'Код истёк, запросите новый' });
  }
  if (stored.code !== String(code)) return res.status(400).json({ error: 'Неверный код' });
  otpStore.delete(normalized);
  try {
    const { rows: [row] } = await pool.query(
      `SELECT vc.vet_id, vc.email, v.name, v.specialty, v.avatar_emoji, v.rating, v.experience_yr, v.bio, v.price_uzs,
              COALESCE(vv.status, 'verified') AS verification_status
       FROM vendor_credentials vc
       JOIN vets v ON v.id = vc.vet_id
       LEFT JOIN vendor_verification vv ON vv.vet_id = v.id
       WHERE vc.phone = $1`,
      [normalized]
    );
    if (!row) return res.status(404).json({ error: 'Ветеринар не найден' });
    const token = signToken({ sub: row.vet_id, type: 'vendor', email: row.email || '' }, '7d');
    res.json({ ...row, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/vendor/login  { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const { rows: [cred] } = await pool.query(
      `SELECT vc.vet_id, vc.email, vc.password,
              v.name, v.specialty, v.avatar_emoji, v.rating, v.experience_yr, v.bio, v.price_uzs,
              COALESCE(vv.status, 'verified') AS verification_status
       FROM vendor_credentials vc
       JOIN vets v ON v.id = vc.vet_id
       LEFT JOIN vendor_verification vv ON vv.vet_id = v.id
       WHERE vc.email = $1`,
      [email.toLowerCase().trim()]
    );
    if (!cred) return res.status(401).json({ error: 'Неверный email или пароль' });

    const ok = await bcrypt.compare(password, cred.password);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    const { password: _omit, ...rest } = cred;
    const token = signToken({ sub: cred.vet_id, type: 'vendor', email: cred.email || '' }, '7d');
    res.json({ ...rest, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/vendor/link-telegram  (protected) — stores vet's Telegram chat ID for push notifications
router.post('/link-telegram', requireVendor, async (req, res) => {
  const { telegram_id } = req.body;
  if (!telegram_id) return res.status(400).json({ error: 'telegram_id required' });
  try {
    await pool.query(
      'UPDATE vendor_credentials SET telegram_id=$1 WHERE vet_id=$2',
      [String(telegram_id), req.vendor.vet_id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/vendor/profile  (protected)
router.get('/profile', requireVendor, async (req, res) => {
  try {
    const { rows: [vet] } = await pool.query(
      `SELECT v.*, vc.email FROM vets v JOIN vendor_credentials vc ON vc.vet_id = v.id WHERE v.id = $1`,
      [req.vendor.vet_id]
    );
    if (!vet) return res.status(404).json({ error: 'Not found' });
    res.json(vet);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/vendor/consultations  (protected)
router.get('/consultations', requireVendor, async (req, res) => {
  const { status } = req.query;
  try {
    let q = `SELECT c.*, v.name AS vet_name, v.specialty, v.price_uzs
             FROM consultations c JOIN vets v ON v.id = c.vet_id
             WHERE c.vet_id = $1`;
    const params = [req.vendor.vet_id];
    if (status) { params.push(status); q += ` AND c.status = $${params.length}`; }
    q += ' ORDER BY c.created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/vendor/stats  (protected)
router.get('/stats', requireVendor, async (req, res) => {
  try {
    const vet_id = req.vendor.vet_id;
    const { rows: [counts] } = await pool.query(
      `SELECT
         COUNT(*)                                      AS total,
         COUNT(*) FILTER (WHERE status='active')      AS active,
         COUNT(*) FILTER (WHERE status='pending')     AS pending,
         COUNT(*) FILTER (WHERE status='completed')   AS completed,
         COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS today
       FROM consultations WHERE vet_id = $1`,
      [vet_id]
    );
    const [vetRow, reviewRow] = await Promise.all([
      pool.query('SELECT price_uzs, rating FROM vets WHERE id = $1', [vet_id]),
      pool.query(`SELECT COUNT(*)::int AS review_count FROM reviews WHERE vet_id=$1 AND status='published'`, [vet_id]),
    ]);
    const vet = vetRow.rows[0];
    const income = parseInt(counts.completed) * (vet?.price_uzs || 0);
    res.json({ ...counts, income, rating: vet?.rating || 5.0, review_count: reviewRow.rows[0].review_count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Vendor Services CRUD ─────────────────────────────────────────────────────

// GET /api/vendor/services  (protected)
router.get('/services', requireVendor, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM vendor_services WHERE vet_id=$1 ORDER BY sort_order, id',
      [req.vendor.vet_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vendor/services  (protected)
router.post('/services', requireVendor, async (req, res) => {
  const { title_ru, title_uz, category, description, price_uzs, duration_min, format, is_active } = req.body;
  if (!title_ru) return res.status(400).json({ error: 'title_ru required' });
  try {
    const { rows: [row] } = await pool.query(
      `INSERT INTO vendor_services (vet_id, title_ru, title_uz, category, description, price_uzs, duration_min, format, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.vendor.vet_id, title_ru, title_uz || '', category || 'vet_online',
       description || '', Number(price_uzs) || 0, Number(duration_min) || 30,
       format || 'online', is_active !== false]
    );
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/vendor/services/:id  (protected)
router.patch('/services/:id', requireVendor, async (req, res) => {
  const { title_ru, title_uz, category, description, price_uzs, duration_min, format, is_active } = req.body;
  if (!title_ru) return res.status(400).json({ error: 'title_ru required' });
  try {
    const { rows: [row] } = await pool.query(
      `UPDATE vendor_services
       SET title_ru=$1, title_uz=$2, category=$3, description=$4,
           price_uzs=$5, duration_min=$6, format=$7, is_active=$8
       WHERE id=$9 AND vet_id=$10 RETURNING *`,
      [title_ru, title_uz || '', category || 'vet_online', description || '',
       Number(price_uzs) || 0, Number(duration_min) || 30, format || 'online', is_active !== false,
       req.params.id, req.vendor.vet_id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/vendor/services/:id  (protected)
router.delete('/services/:id', requireVendor, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM vendor_services WHERE id=$1 AND vet_id=$2',
      [req.params.id, req.vendor.vet_id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vendor/register  { name, specialty, phone, password, bio?, email?, price_uzs?, experience_yr?, avatar_emoji? }
router.post('/register', async (req, res) => {
  const { name, specialty, phone, password, bio, email, price_uzs, experience_yr, avatar_emoji } = req.body;
  if (!name || !specialty || !phone || !password)
    return res.status(400).json({ error: 'name, specialty, phone, password — обязательные поля' });
  const normalized = phone.replace(/\s/g, '');
  try {
    const { rows: [existing] } = await pool.query(
      'SELECT id FROM vendor_credentials WHERE phone=$1', [normalized]
    );
    if (existing) return res.status(409).json({ error: 'Номер уже зарегистрирован' });
    if (email) {
      const { rows: [emailExists] } = await pool.query(
        'SELECT id FROM vendor_credentials WHERE email=$1', [email.toLowerCase().trim()]
      );
      if (emailExists) return res.status(409).json({ error: 'Email уже используется' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows: [vet] } = await pool.query(
      `INSERT INTO vets (name, specialty, bio, price_uzs, experience_yr, avatar_emoji, is_available)
       VALUES ($1,$2,$3,$4,$5,$6,false) RETURNING id`,
      [name, specialty, bio || '', Number(price_uzs) || 0, Number(experience_yr) || 1, avatar_emoji || '👨‍⚕️']
    );
    await pool.query(
      `INSERT INTO vendor_credentials (vet_id, phone, email, password) VALUES ($1,$2,$3,$4)`,
      [vet.id, normalized, email ? email.toLowerCase().trim() : null, hash]
    );
    await pool.query(
      `INSERT INTO vendor_verification (vet_id, status) VALUES ($1,'pending')`, [vet.id]
    );
    const token = signToken({ sub: vet.id, type: 'vendor', email: email || '' }, '7d');
    res.json({
      vet_id: vet.id, name, specialty,
      bio: bio || '', price_uzs: Number(price_uzs) || 0, rating: 5.0,
      avatar_emoji: avatar_emoji || '👨‍⚕️', experience_yr: Number(experience_yr) || 1,
      token, verification_status: 'pending',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vendor/me  (protected) — profile + current verification status
router.get('/me', requireVendor, async (req, res) => {
  try {
    const { rows: [row] } = await pool.query(
      `SELECT v.id AS vet_id, v.name, v.specialty, v.bio, v.price_uzs, v.rating,
              v.avatar_emoji, v.experience_yr, vc.email, vc.phone,
              COALESCE(vv.status, 'verified') AS verification_status
       FROM vets v
       JOIN vendor_credentials vc ON vc.vet_id = v.id
       LEFT JOIN vendor_verification vv ON vv.vet_id = v.id
       WHERE v.id = $1`,
      [req.vendor.vet_id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/vendor/me  (protected) — update editable profile fields
router.patch('/me', requireVendor, async (req, res) => {
  const { name, specialty, bio, price_uzs, experience_yr, avatar_emoji } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  try {
    const { rows: [row] } = await pool.query(
      `UPDATE vets
       SET name=$1, specialty=$2, bio=$3, price_uzs=$4, experience_yr=$5, avatar_emoji=$6
       WHERE id=$7
       RETURNING id AS vet_id, name, specialty, bio, price_uzs, experience_yr, avatar_emoji, rating`,
      [name.trim(), specialty || '', bio || '', Number(price_uzs) || 0,
       Number(experience_yr) || 1, avatar_emoji || '👨‍⚕️', req.vendor.vet_id]
    );
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vendor/slots?week=YYYY-MM-DD  (week = Monday date)
router.get('/slots', requireVendor, async (req, res) => {
  try {
    const { week } = req.query;
    const monday = week ? new Date(week) : (() => {
      const d = new Date(); const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      d.setHours(0, 0, 0, 0); return d;
    })();
    const weekEnd = new Date(monday); weekEnd.setDate(weekEnd.getDate() + 7);
    const { rows } = await pool.query(
      'SELECT * FROM vendor_slots WHERE vet_id=$1 AND slot_at >= $2 AND slot_at < $3 ORDER BY slot_at',
      [req.vendor.vet_id, monday.toISOString(), weekEnd.toISOString()]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vendor/slots/toggle  { slot_at: ISO string }
router.post('/slots/toggle', requireVendor, async (req, res) => {
  const { slot_at } = req.body;
  if (!slot_at) return res.status(400).json({ error: 'slot_at required' });
  try {
    const { rows: [existing] } = await pool.query(
      'SELECT * FROM vendor_slots WHERE vet_id=$1 AND slot_at=$2',
      [req.vendor.vet_id, slot_at]
    );
    if (existing) {
      if (existing.is_booked) return res.status(409).json({ error: 'Слот забронирован' });
      await pool.query('DELETE FROM vendor_slots WHERE id=$1', [existing.id]);
      return res.json({ action: 'removed', slot_at });
    }
    const { rows: [slot] } = await pool.query(
      'INSERT INTO vendor_slots (vet_id, slot_at) VALUES ($1,$2) RETURNING *',
      [req.vendor.vet_id, slot_at]
    );
    res.json({ action: 'added', ...slot });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vendor/reviews  (protected)
router.get('/reviews', requireVendor, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.rating, r.text, r.reply, r.status, r.created_at,
              COALESCE(c.client_name, r.owner_id) AS client_name,
              COALESCE(c.pet_name, '') AS pet_name
       FROM reviews r
       LEFT JOIN orders o ON o.id = r.order_id
       LEFT JOIN consultations c ON c.id = o.consultation_id::uuid
       WHERE r.vet_id = $1 AND r.status = 'published'
       ORDER BY r.created_at DESC`,
      [req.vendor.vet_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vendor/reviews/:id/reply  { text }  (protected)
router.post('/reviews/:id/reply', requireVendor, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'reply text required' });
  try {
    const { rows: [row] } = await pool.query(
      'UPDATE reviews SET reply=$1 WHERE id=$2 AND vet_id=$3 RETURNING *',
      [text.trim(), req.params.id, req.vendor.vet_id]
    );
    if (!row) return res.status(404).json({ error: 'Review not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vendor/finance  (protected)
router.get('/finance', requireVendor, async (req, res) => {
  try {
    const vet_id = req.vendor.vet_id;
    const { rows: orders } = await pool.query(
      `SELECT o.id, o.status, o.price_uzs, o.payout_amount, o.commission_rate, o.created_at, o.owner_id
       FROM orders o
       WHERE o.vet_id = $1
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [vet_id]
    );
    const payout = o => o.payout_amount || Math.round((o.price_uzs || 0) * (1 - (o.commission_rate || 0.15)));
    const done = orders.filter(o => ['completed', 'reviewed'].includes(o.status));
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const thisMonth = done.filter(o => new Date(o.created_at) >= monthStart);
    const balance = done.reduce((s, o) => s + payout(o), 0);
    const monthTotal = thisMonth.reduce((s, o) => s + payout(o), 0);
    res.json({
      balance,
      pending: monthTotal,
      month_total: monthTotal,
      transactions: orders.map(o => ({
        id: o.id,
        date: new Date(o.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        status: o.status,
        type: ['cancelled', 'refunded'].includes(o.status) ? 'refund' : 'consult',
        client: o.owner_id,
        amount: ['cancelled', 'refunded'].includes(o.status) ? -(o.price_uzs || 0) : payout(o),
      })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vendor/clients — unique clients with their consultation history summary
router.get('/clients', requireVendor, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         lc.client_name,
         lc.pet_name,
         lc.pet_species,
         lc.created_at  AS last_visit,
         lc.summary     AS last_summary,
         cnt.consult_count::int
       FROM (
         SELECT DISTINCT ON (client_name, pet_name)
           client_name, pet_name, pet_species, created_at, summary, vet_id
         FROM consultations
         WHERE vet_id = $1
         ORDER BY client_name, pet_name, created_at DESC
       ) lc
       JOIN (
         SELECT client_name, pet_name, COUNT(*) AS consult_count
         FROM consultations
         WHERE vet_id = $1
         GROUP BY client_name, pet_name
       ) cnt ON cnt.client_name = lc.client_name AND cnt.pet_name = lc.pet_name
       ORDER BY lc.created_at DESC`,
      [req.vendor.vet_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vendor/payouts  { amount_uzs, method, requisites }
router.post('/payouts', requireVendor, async (req, res) => {
  const { amount_uzs, method, requisites } = req.body;
  if (!amount_uzs || amount_uzs < 50000)
    return res.status(400).json({ error: 'Минимум 50 000 сум' });
  if (!requisites?.trim())
    return res.status(400).json({ error: 'requisites required' });
  const validMethod = ['click', 'payme', 'uzum'].includes(method) ? method : 'click';
  try {
    const { rows: [row] } = await pool.query(
      `INSERT INTO vendor_payouts (vet_id, amount_uzs, method, requisites)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.vendor.vet_id, amount_uzs, validMethod, requisites.trim()]
    );
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vendor/payouts  — history of payout requests
router.get('/payouts', requireVendor, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM vendor_payouts WHERE vet_id=$1 ORDER BY requested_at DESC LIMIT 50',
      [req.vendor.vet_id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
