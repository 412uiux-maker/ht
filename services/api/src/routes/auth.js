const { serverError } = require('../helpers/respond');
const { Router } = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { signToken } = require('../middleware/auth');

const router = Router();
const DEV = process.env.NODE_ENV !== 'production';

/**
 * POST /api/auth/telegram
 * Body: { initData: string }
 *
 * Validates Telegram Web App initData HMAC-SHA256 signature,
 * upserts the user, returns a short-lived JWT.
 *
 * Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
router.post('/telegram', async (req, res) => {
  const { initData } = req.body;
  if (!initData) return res.status(400).json({ error: 'initData required' });

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    if (DEV) {
      // In dev, allow bypass with a fake initData so manual testing still works
      return res.status(501).json({ error: 'TELEGRAM_BOT_TOKEN not set (dev mode)' });
    }
    return res.status(503).json({ error: 'Telegram auth not configured' });
  }

  // Parse and verify
  let valid = false;
  let telegramUser = null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Build data-check-string: sorted key=value lines joined by \n
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    // HMAC key = HMAC-SHA256("WebAppData", bot_token)
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    valid = hash === expectedHash;
    if (valid) {
      const userStr = params.get('user');
      if (userStr) telegramUser = JSON.parse(userStr);
    }
  } catch (e) {
    return res.status(400).json({ error: 'Malformed initData' });
  }

  if (!valid) return res.status(401).json({ error: 'Invalid initData signature' });

  const telegram_id = String(telegramUser?.id ?? '');
  if (!telegram_id) return res.status(400).json({ error: 'No user in initData' });

  try {
    // Upsert user
    const { rows: [user] } = await pool.query(
      `INSERT INTO users (telegram_id, name, locale)
       VALUES ($1, $2, $3)
       ON CONFLICT (telegram_id) DO UPDATE
         SET name = EXCLUDED.name, locale = EXCLUDED.locale
       RETURNING id, telegram_id, name, locale`,
      [
        telegram_id,
        telegramUser.first_name ?? '' + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
        telegramUser.language_code ?? 'ru',
      ]
    );

    const token = signToken({
      sub: user.id,
      type: 'client',
      telegram_id: user.telegram_id,
      owner_id: user.id,   // use DB user.id as the stable owner_id going forward
    }, '30d');

    res.json({ token, user });
  } catch (e) {
    serverError(res, e);
  }
});

module.exports = router;
