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
    const { rows: [vet] } = await pool.query('SELECT price_uzs, rating FROM vets WHERE id = $1', [vet_id]);
    const income = parseInt(counts.completed) * (vet?.price_uzs || 0);
    res.json({ ...counts, income, rating: vet?.rating || 5.0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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

module.exports = router;
