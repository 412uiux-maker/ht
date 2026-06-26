const { Telegraf, Markup } = require('telegraf')
const https = require('https')
const http = require('http')

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://t.me/HappyTailsUzBot/app'
const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080'

if (!BOT_TOKEN) {
  console.error('[bot] TELEGRAM_BOT_TOKEN is required')
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)

// In-memory lang store: telegram_id → 'ru' | 'uz'
const langStore = new Map()
const getLang = (ctx) => langStore.get(ctx.from?.id) ?? 'ru'

const T = {
  ru: {
    welcome: (name) =>
      `Привет, ${name}! 🐾\n\nЯ HappyTails — ваш помощник по здоровью питомцев в Узбекистане.\n\nЗаписывайтесь к ветеринару, подбирайте корм и узнавайте, как ухаживать за питомцем.`,
    choose_lang: 'Выберите язык / Tilni tanlang:',
    lang_saved: '🇷🇺 Язык: Русский',
    open_app: '🐾 Открыть HappyTails',
    my_orders: '📋 Мои заказы',
    ask_vet: '🩺 Консультация ветеринара',
    deeds: '💚 Добрые дела',
    new_order: ({ vet_name, pet_name, problem }) =>
      `🔔 <b>Новая заявка на консультацию</b>\n\nДоктор <b>${vet_name}</b>, к вам обращаются по питомцу <b>${pet_name}</b>:\n\n«${problem}»\n\nПримите или отклоните заявку:`,
    accepted: '✅ Вы приняли заявку. Клиент получил уведомление.',
    rejected: '❌ Вы отклонили заявку. Средства будут возвращены клиенту.',
    already_handled: 'Эта заявка уже обработана.',
    error: (msg) => `⚠️ Ошибка: ${msg}`,
    vet_not_linked: '⚠️ Ваш аккаунт не привязан к кабинету ветеринара. Войдите в кабинет и привяжите Telegram.',
  },
  uz: {
    welcome: (name) =>
      `Salom, ${name}! 🐾\n\nMen HappyTails — O'zbekistonda uy hayvonlari salomatligi bo'yicha yordamchingizman.\n\nVeterinar bilan maslahatlashing, oziq-ovqat tanlang va uy hayvonlaringizga g'amxo'rlik qilishni o'rganing.`,
    choose_lang: 'Tilni tanlang / Выберите язык:',
    lang_saved: "🇺🇿 Til: O'zbek",
    open_app: '🐾 HappyTailsni ochish',
    my_orders: '📋 Buyurtmalarim',
    ask_vet: '🩺 Veterinar maslahati',
    deeds: '💚 Yaxshi ishlar',
    new_order: ({ vet_name, pet_name, problem }) =>
      `🔔 <b>Yangi konsultatsiya so'rovi</b>\n\nDoktor <b>${vet_name}</b>, <b>${pet_name}</b> haqida murojaat:\n\n«${problem}»\n\nSo'rovni qabul qiling yoki rad eting:`,
    accepted: "✅ Siz so'rovni qabul qildingiz. Mijoz xabardor qilindi.",
    rejected: "❌ Siz so'rovni rad etdingiz. Mablag' mijozga qaytariladi.",
    already_handled: "Bu so'rov allaqachon ko'rib chiqilgan.",
    error: (msg) => `⚠️ Xato: ${msg}`,
    vet_not_linked: "⚠️ Hisobingiz veterinar kabinetiga bog'lanmagan. Kabinetga kiring va Telegramni ulang.",
  },
}

// ── /start ───────────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  await ctx.reply(T.ru.choose_lang, Markup.inlineKeyboard([
    [
      Markup.button.callback('🇷🇺 Русский', 'lang:ru'),
      Markup.button.callback("🇺🇿 O'zbek", 'lang:uz'),
    ],
  ]))
})

// ── Language selection ────────────────────────────────────────────────────────
bot.action(/^lang:(ru|uz)$/, async (ctx) => {
  const lang = ctx.match[1]
  langStore.set(ctx.from?.id, lang)
  const t = T[lang]
  const name = ctx.from?.first_name || (lang === 'uz' ? "do'st" : 'друг')

  await ctx.editMessageText(t.welcome(name), {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp(t.open_app, MINI_APP_URL)],
      [
        Markup.button.callback(t.my_orders, 'open:orders'),
        Markup.button.callback(t.deeds, 'open:deeds'),
      ],
    ]),
  })
  await ctx.answerCbQuery(t.lang_saved)
})

// ── Quick-open actions (deep-link into mini-app) ──────────────────────────────
bot.action(/^open:(.+)$/, async (ctx) => {
  const section = ctx.match[1]
  const t = T[getLang(ctx)]
  const url = `${MINI_APP_URL}?tab=${section}`
  await ctx.answerCbQuery()
  await ctx.reply('👇', Markup.inlineKeyboard([
    [Markup.button.webApp(t.open_app, url)],
  ]))
})

// ── Vendor: Accept order ──────────────────────────────────────────────────────
bot.action(/^accept:(.+)$/, async (ctx) => {
  const orderId = ctx.match[1]
  const telegramId = ctx.from?.id
  await ctx.answerCbQuery()
  const t = T[getLang(ctx)]

  try {
    const result = await botApiCall('POST', `/api/bot/orders/${orderId}/accept`, { telegram_id: telegramId })
    if (result.error) {
      const msg = result.error.includes('Vendor not found') ? t.vet_not_linked
        : result.error.includes('status') ? t.already_handled
        : t.error(result.error)
      await ctx.editMessageText(msg, { parse_mode: 'HTML' })
      return
    }
    await ctx.editMessageText(t.accepted, { parse_mode: 'HTML' })
  } catch (e) {
    await ctx.editMessageText(t.error(e.message), { parse_mode: 'HTML' })
  }
})

// ── Vendor: Reject order ──────────────────────────────────────────────────────
bot.action(/^reject:(.+)$/, async (ctx) => {
  const orderId = ctx.match[1]
  const telegramId = ctx.from?.id
  await ctx.answerCbQuery()
  const t = T[getLang(ctx)]

  try {
    const result = await botApiCall('POST', `/api/bot/orders/${orderId}/reject`, { telegram_id: telegramId })
    if (result.error) {
      const msg = result.error.includes('Vendor not found') ? t.vet_not_linked
        : result.error.includes('status') ? t.already_handled
        : t.error(result.error)
      await ctx.editMessageText(msg, { parse_mode: 'HTML' })
      return
    }
    await ctx.editMessageText(t.rejected, { parse_mode: 'HTML' })
  } catch (e) {
    await ctx.editMessageText(t.error(e.message), { parse_mode: 'HTML' })
  }
})

// ── API helper ────────────────────────────────────────────────────────────────
function botApiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path)
    const bodyStr = body ? JSON.stringify(body) : null
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${BOT_TOKEN}`,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    }
    const lib = url.protocol === 'https:' ? https : http
    const req = lib.request(opts, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve({ error: 'Invalid JSON response' }) }
      })
    })
    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

// ── Launch ───────────────────────────────────────────────────────────────────
bot.launch()
  .then(() => console.log('[bot] HappyTails bot started'))
  .catch((err) => { console.error('[bot] Launch failed:', err.message); process.exit(1) })

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
