const express = require('express')
const router = express.Router()

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are a veterinary triage assistant for HappyTails — a pet healthcare platform in Uzbekistan.
Your job is to analyze pet symptoms and help owners understand urgency.

RULES:
- Never make a definitive diagnosis — only suggest possibilities
- When in doubt about severity, escalate (be conservative)
- All text fields must be in the language specified by the user
- Return ONLY raw JSON. No markdown, no preamble, no commentary outside the JSON.

Return this exact JSON structure:
{
  "urgency": "critical" | "urgent" | "monitor" | "ok",
  "urgency_label": "<localized label>",
  "summary": "<2-3 sentence assessment in user language>",
  "possible_conditions": ["<condition 1>", "<condition 2>", "<condition 3>"],
  "recommendations": ["<action 1>", "<action 2>", "<action 3>", "<action 4>"],
  "see_vet": true | false,
  "disclaimer": "<short disclaimer in user language>"
}

Urgency levels:
- "critical": life-threatening signs (seizures, can't breathe, unconscious, severe bleeding) — go to emergency vet NOW
- "urgent": should see vet today or tomorrow
- "monitor": observe closely, vet visit if worsens in 24-48h
- "ok": no serious concern at this time`

/**
 * POST /api/symptom-check
 * Body: { pet_name, pet_species, pet_age?, symptoms, lang: 'ru'|'uz' }
 */
router.post('/', async (req, res) => {
  const { pet_name, pet_species, pet_age, pet_breed, pet_sex, pet_weight_kg, symptoms, lang = 'ru' } = req.body

  if (!symptoms || !symptoms.trim()) {
    return res.status(400).json({ error: 'symptoms field is required' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured (ANTHROPIC_API_KEY missing)' })
  }

  const langLabel = lang === 'uz' ? "O'zbek tilida javob bering" : 'Отвечайте на русском языке'
  const petDesc = [
    pet_name    ? `Кличка: ${pet_name}`           : null,
    pet_species ? `Вид: ${pet_species}`            : null,
    pet_breed   ? `Порода: ${pet_breed}`           : null,
    pet_sex     ? `Пол: ${pet_sex}`                : null,
    pet_age     ? `Возраст: ${pet_age}`            : null,
    pet_weight_kg != null ? `Вес: ${pet_weight_kg} кг` : null,
  ].filter(Boolean).join(', ')

  const userMessage = `${langLabel}.

Информация о питомце: ${petDesc || 'не указана'}

Описание симптомов:
${symptoms.trim()}`

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('[symptoms] Anthropic error:', response.status, errBody)
      return res.status(502).json({ error: 'AI service error', detail: response.status })
    }

    const data = await response.json()
    const raw = data.content?.[0]?.text ?? ''

    let parsed
    try {
      // Strip possible markdown fences
      const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('[symptoms] JSON parse error, raw:', raw)
      return res.status(502).json({ error: 'AI returned invalid response' })
    }

    res.json(parsed)
  } catch (err) {
    console.error('[symptoms] fetch error:', err)
    res.status(500).json({ error: 'Internal error' })
  }
})

module.exports = router
