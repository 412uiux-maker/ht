const { Telegraf, Markup } = require('telegraf')
const https = require('https')
const http = require('http')

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
// MINI_APP_URL: direct HTTPS URL for web_app buttons (requires domain registered in BotFather)
// If not set or is a t.me link, we fall back to a plain URL button
const MINI_APP_URL = process.env.MINI_APP_URL || ''
const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080'
// WEBHOOK_URL: full HTTPS domain for production webhook (e.g. https://api.happytails.uz)
// If not set, bot falls back to long-polling (suitable for local dev)
const WEBHOOK_URL = process.env.WEBHOOK_URL || ''
const WEBHOOK_PORT = parseInt(process.env.PORT || '8443', 10)

// web_app buttons need a registered HTTPS domain; t.me links are not valid here
const isWebAppUrl = (url) => url && url.startsWith('https://') && !url.includes('t.me')

function appButton(label, url) {
  return isWebAppUrl(url)
    ? Markup.button.webApp(label, url)
    : Markup.button.url(label, url || 'https://t.me/HappyTailsTetrisBot')
}

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
    ask_vet: '🩺 Консультация',
    deeds: '💚 Добрые дела',
    help: (miniAppUrl) =>
      `<b>HappyTails — помощник по питомцам</b>\n\n` +
      `🐾 /start — главное меню\n` +
      `🌐 /language — сменить язык\n` +
      `❓ /help — эта справка\n\n` +
      (miniAppUrl ? `Приложение: ${miniAppUrl}\n\n` : '') +
      `По вопросам поддержки: @HappyTailsSupport`,
    new_order: ({ vet_name, pet_name, problem }) =>
      `🔔 <b>Новая заявка на консультацию</b>\n\nДоктор <b>${vet_name}</b>, к вам обращаются по питомцу <b>${pet_name}</b>:\n\n«${problem}»\n\nПримите или отклоните заявку:`,
    order_accepted: '✅ Ваша заявка принята. Врач скоро выйдет на связь.',
    order_rejected: '❌ Заявка отклонена. Средства вернутся в течение 1–2 рабочих дней.',
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
    help: (miniAppUrl) =>
      `<b>HappyTails — uy hayvonlari yordamchisi</b>\n\n` +
      `🐾 /start — asosiy menyu\n` +
      `🌐 /language — tilni o'zgartirish\n` +
      `❓ /help — bu yordam\n\n` +
      (miniAppUrl ? `Ilova: ${miniAppUrl}\n\n` : '') +
      `Yordam uchun: @HappyTailsSupport`,
    new_order: ({ vet_name, pet_name, problem }) =>
      `🔔 <b>Yangi konsultatsiya so'rovi</b>\n\nDoktor <b>${vet_name}</b>, <b>${pet_name}</b> haqida murojaat:\n\n«${problem}»\n\nSo'rovni qabul qiling yoki rad eting:`,
    order_accepted: "✅ So'rovingiz qabul qilindi. Shifokor tez orada bog'lanadi.",
    order_rejected: "❌ So'rovingiz rad etildi. Mablag' 1–2 ish kuni ichida qaytariladi.",
    accepted: "✅ Siz so'rovni qabul qildingiz. Mijoz xabardor qilindi.",
    rejected: "❌ Siz so'rovni rad etdingiz. Mablag' mijozga qaytariladi.",
    already_handled: "Bu so'rov allaqachon ko'rib chiqilgan.",
    error: (msg) => `⚠️ Xato: ${msg}`,
    vet_not_linked: "⚠️ Hisobingiz veterinar kabinetiga bog'lanmagan. Kabinetga kiring va Telegramni ulang.",
  },
}

// ── /start [payload] ─────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  const payload = ctx.startPayload  // deep-link param from t.me/bot?start=<payload>
  const knownLang = langStore.has(ctx.from?.id)

  // If user tapped a deep-link and already has a language set, open that section
  if (payload && knownLang) {
    const lang = getLang(ctx)
    const t = T[lang]
    const section = payload.replace(/^tab_/, '')
    const url = MINI_APP_URL ? `${MINI_APP_URL}?tab=${section}` : MINI_APP_URL
    await ctx.reply('👇', Markup.inlineKeyboard([[appButton(t.open_app, url)]]))
    return
  }

  await ctx.reply(T.ru.choose_lang, Markup.inlineKeyboard([
    [
      Markup.button.callback('🇷🇺 Русский', 'lang:ru'),
      Markup.button.callback("🇺🇿 O'zbek", 'lang:uz'),
    ],
  ]))
})

// ── /help ────────────────────────────────────────────────────────────────────
bot.help(async (ctx) => {
  const t = T[getLang(ctx)]
  await ctx.reply(t.help(MINI_APP_URL), { parse_mode: 'HTML' })
})

// ── /language ────────────────────────────────────────────────────────────────
bot.command('language', async (ctx) => {
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
      [appButton(t.open_app, MINI_APP_URL)],
      [
        Markup.button.callback(t.my_orders, 'open:orders'),
        Markup.button.callback(t.deeds, 'open:deeds'),
      ],
      [Markup.button.callback(t.ask_vet, 'open:consult')],
    ]),
  })
  await ctx.answerCbQuery(t.lang_saved)
})

// ── Quick-open actions (deep-link into mini-app) ──────────────────────────────
bot.action(/^open:(.+)$/, async (ctx) => {
  const section = ctx.match[1]
  const t = T[getLang(ctx)]
  const url = MINI_APP_URL ? `${MINI_APP_URL}?tab=${section}` : MINI_APP_URL
  await ctx.answerCbQuery()
  await ctx.reply('👇', Markup.inlineKeyboard([
    [appButton(t.open_app, url)],
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

// ── Global error handler — prevents unhandled errors from crashing the bot ───
bot.catch((err, ctx) => {
  console.error('[bot] Error for', ctx?.updateType, err?.message || err)
})

// ── Launch: webhook in production, polling in dev ─────────────────────────────
async function launch() {
  if (WEBHOOK_URL) {
    // Telegram sends updates to WEBHOOK_URL/bot; bot binds locally on WEBHOOK_PORT
    await bot.launch({
      webhook: {
        domain: WEBHOOK_URL,
        path: '/bot',
        port: WEBHOOK_PORT,
      },
    })
    console.log(`[bot] Webhook mode → ${WEBHOOK_URL}/bot (local :${WEBHOOK_PORT})`)
  } else {
    await bot.launch()
    console.log('[bot] Polling mode — HappyTails bot started')
  }
}

launch().catch((err) => { console.error('[bot] Launch failed:', err.message); process.exit(1) })

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
