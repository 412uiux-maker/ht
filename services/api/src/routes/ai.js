const express = require('express')
const router = express.Router()

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

function systemPrompt(lang) {
  const ru = lang !== 'uz'
  return ru
    ? `Ты — AI-ветеринар HappyTails, дружелюбный и заботливый помощник для владельцев питомцев в Узбекистане.

СТИЛЬ:
- Тёплый, разговорный тон — как опытный ветеринар, которому доверяют
- Задавай уточняющие вопросы по одному, не список
- Отвечай коротко: 2–4 предложения, потом жди ответа пользователя
- Используй эмодзи уместно — не перебарщивай

ОГРАНИЧЕНИЯ:
- Никогда не ставь окончательный диагноз — только предположения
- При критических симптомах (не дышит, судороги, тяжёлое кровотечение, потеря сознания) — немедленно направляй к врачу
- Ты не заменяешь очную консультацию ветеринара

МАРКЕР ЗАПИСИ:
Если в ходе разговора становится очевидно, что питомцу нужен осмотр у ветеринара (серьёзные симптомы, длительное заболевание, нет улучшений), добавь в конце ответа точный маркер: [SUGGEST_BOOKING]
Добавляй его не чаще одного раза и только когда действительно нужна живая консультация.

Отвечай только на русском языке.`
    : `Siz HappyTails AI-veterinari — O'zbekistonda uy hayvonlari egalari uchun mehribon va g'amxo'r yordamchisiz.

USLUB:
- Iliq, suhbatli ohang — ishonchli tajribali veterinar kabi
- Aniqlash savollarini bittadan bering, ro'yxat emas
- Qisqa javob bering: 2–4 gap, keyin foydalanuvchi javobini kuting
- Emoji-lardan o'rinli foydalaning

CHEKLOVLAR:
- Hech qachon aniq tashxis qo'ymang — faqat taxminlar
- Kritik belgilarda (nafas olmayapti, tutqanoq, og'ir qon ketish, hushsizlik) — darhol shifokorga yuboring
- Siz veterinarning shaxsiy ko'rigini almashtirmaysiz

YOZILISH MARKERI:
Agar suhbat davomida hayvonga veterinar ko'rigi kerakligi ayon bo'lsa (jiddiy belgilar, uzoq kasallik, yaxshilanish yo'q), javob oxirida aniq markerni qo'shing: [SUGGEST_BOOKING]
Uni faqat bir marta va haqiqatan ham tirik ko'rik zarur bo'lgandagina qo'shing.

Faqat o'zbek tilida javob bering.`
}

function petContext(ctx) {
  if (!ctx) return ''
  const parts = [
    ctx.name    ? `Имя: ${ctx.name}`     : null,
    ctx.species ? `Вид: ${ctx.species}`  : null,
    ctx.sex     ? `Пол: ${ctx.sex}`      : null,
    ctx.age     ? `Возраст: ${ctx.age}`  : null,
    ctx.weight_kg != null ? `Вес: ${ctx.weight_kg} кг` : null,
  ].filter(Boolean)
  return parts.length ? `[Питомец — ${parts.join(', ')}]\n\n` : ''
}

/**
 * POST /api/ai/chat
 * { messages: [{role:'user'|'assistant', content:string}][], pet?: {name,species,...}, lang:'ru'|'uz' }
 *
 * Streams SSE:
 *   data: {"text":"..."}\n\n          — incremental text chunk
 *   data: {"done":true,"suggest_booking":bool}\n\n  — end of stream
 */
router.post('/chat', async (req, res) => {
  const { messages, pet, lang = 'ru' } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] required' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'AI not configured (ANTHROPIC_API_KEY missing)' })
  }

  // Inject pet context into first user message
  const prefix = petContext(pet)
  const apiMessages = messages.map((m, i) => ({
    role: m.role,
    content: i === 0 && prefix ? prefix + m.content : m.content,
  }))

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  let fullText = ''

  try {
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        stream: true,
        system: systemPrompt(lang),
        messages: apiMessages,
      }),
    })

    if (!upstream.ok) {
      const body = await upstream.text()
      console.error('[ai/chat] Anthropic error:', upstream.status, body)
      res.write(`data: ${JSON.stringify({ error: 'AI error', done: true })}\n\n`)
      return res.end()
    }

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') continue
        try {
          const evt = JSON.parse(raw)
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            const text = evt.delta.text
            fullText += text
            const visible = text.replace(/\[SUGGEST_BOOKING\]/g, '')
            if (visible) res.write(`data: ${JSON.stringify({ text: visible })}\n\n`)
          }
        } catch { /* malformed line — skip */ }
      }
    }

    const suggestBooking = fullText.includes('[SUGGEST_BOOKING]')
    res.write(`data: ${JSON.stringify({ done: true, suggest_booking: suggestBooking })}\n\n`)
    res.end()

  } catch (err) {
    console.error('[ai/chat] error:', err.message)
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'Internal error', done: true })}\n\n`)
      res.end()
    }
  }
})

module.exports = router
