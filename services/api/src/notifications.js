const https = require('https');
const pool = require('./db');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

function sendTelegramMessage(chatId, text, opts = {}) {
  if (!TOKEN || !chatId) return Promise.resolve(null);
  return new Promise((resolve) => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...opts });
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.write(body);
    req.end();
  });
}

async function notifyVetNewOrder(orderId) {
  try {
    const { rows: [row] } = await pool.query(
      `SELECT o.id, o.price_uzs, c.pet_name, c.pet_species, c.problem, vc.telegram_id
       FROM orders o
       LEFT JOIN consultations c ON c.id = o.consultation_id
       JOIN vendor_credentials vc ON vc.vet_id = o.vet_id
       WHERE o.id = $1`,
      [orderId]
    );
    if (!row?.telegram_id) return;
    const pet = row.pet_name
      ? `${row.pet_name}${row.pet_species ? ` (${row.pet_species})` : ''}`
      : '—';
    const text = `🆕 <b>Новый заказ!</b>\n🐾 Питомец: ${pet}\n💬 ${row.problem || 'Онлайн-консультация'}\n💰 ${(row.price_uzs || 0).toLocaleString('ru-RU')} UZS`;
    await sendTelegramMessage(row.telegram_id, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Принять', callback_data: `accept:${row.id}` },
          { text: '❌ Отклонить', callback_data: `reject:${row.id}` },
        ]],
      },
    });
  } catch {}
}

async function notifyClientOrderStatus(orderId, message) {
  try {
    const { rows: [order] } = await pool.query('SELECT owner_id FROM orders WHERE id=$1', [orderId]);
    if (!order) return;
    const { rows: [user] } = await pool.query(
      'SELECT telegram_id FROM users WHERE id::text = $1',
      [order.owner_id]
    );
    if (!user?.telegram_id) return;
    await sendTelegramMessage(user.telegram_id, message);
  } catch {}
}

module.exports = { sendTelegramMessage, notifyVetNewOrder, notifyClientOrderStatus };
