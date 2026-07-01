import { useState, useEffect } from 'react'
import { IconArrowLeft } from '@ht/shared'
import { getLang } from '../i18n'
import { api, getOwnerId } from '../api'
import type { Pet } from '../api'

// ── Types ─────────────────────────────────────────────────────
type Mode = 'pick' | 'tree' | 'ai'

type NodeKey = string
type OptionNode = {
  question: { uz: string; ru: string }
  options: { label: { uz: string; ru: string }; next: NodeKey }[]
}
type ResultNode = {
  result: 'book_vet' | 'monitor' | 'not_urgent'
  severity: 'urgent' | 'watch' | 'ok'
  message: { uz: string; ru: string }
}
type CheckerNode = OptionNode | ResultNode

type AiResult = {
  urgency: 'critical' | 'urgent' | 'monitor' | 'ok'
  urgency_label: string
  summary: string
  possible_conditions: string[]
  recommendations: string[]
  see_vet: boolean
  disclaimer: string
}

type AiStep = 'form' | 'loading' | 'result' | 'error'

// ── Species chips ─────────────────────────────────────────────
const SPECIES_LABELS: Record<string, [string, string]> = {
  dog:     ['Собака',  'It'],
  cat:     ['Кошка',   'Mushuk'],
  rabbit:  ['Кролик',  'Quyon'],
  parrot:  ['Попугай', "To'ti"],
  hamster: ['Хомяк',   'Hamster'],
  other:   ['Другое',  'Boshqa'],
}
const SPECIES_EMOJIS: Record<string, string> = {
  dog: '🐶', cat: '🐱', rabbit: '🐰', parrot: '🦜', hamster: '🐹', other: '🐾',
}

// ── Symptom quick-chips per species ──────────────────────────
const SYMPTOM_CHIPS: Record<string, string[]> = {
  dog:     ['Не ест', 'Рвота', 'Диарея', 'Вялость', 'Кашель', 'Хромает', 'Зуд', 'Пьёт много воды'],
  cat:     ['Не ест', 'Рвота', 'Диарея', 'Вялость', 'Кашель', 'Похудел', 'Зуд', 'Мяукает жалобно'],
  rabbit:  ['Не ест', 'Вялость', 'Диарея', 'Запор', 'Наклоняет голову'],
  parrot:  ['Не ест', 'Перья растрёпаны', 'Тяжело дышит', 'Выделения из клюва', 'Сидит нахохлившись'],
  hamster: ['Не ест', 'Вялость', 'Шерсть взъерошена', 'Диарея'],
  other:   ['Не ест', 'Вялость', 'Рвота', 'Диарея'],
}

// ── Decision tree ─────────────────────────────────────────────
const startKey: NodeKey = 'breathing'

const nodes: Record<NodeKey, CheckerNode> = {
  breathing: {
    question: { uz: 'Hayvon nafas olishda qiynalayaptimi?', ru: 'Есть ли затруднения с дыханием?' },
    options: [
      { label: { uz: 'Ha', ru: 'Да' }, next: 'result_urgent_breathing' },
      { label: { uz: "Yo'q", ru: 'Нет' }, next: 'injury' },
    ],
  },
  injury: {
    question: { uz: "Ko'rinadigan jarohat yoki qon bormi?", ru: 'Есть ли видимые травмы или кровотечение?' },
    options: [
      { label: { uz: 'Ha', ru: 'Да' }, next: 'result_urgent_injury' },
      { label: { uz: "Yo'q", ru: 'Нет' }, next: 'eating' },
    ],
  },
  eating: {
    question: { uz: "Hayvon so'nggi 24 soatda ovqat yeyaptimi?", ru: 'Ел ли питомец последние 24 часа?' },
    options: [
      { label: { uz: "Yo'q, rad etdi", ru: 'Нет, отказывается' }, next: 'lethargy_combined' },
      { label: { uz: 'Ha, yeyapti', ru: 'Да, ест' }, next: 'vomiting' },
    ],
  },
  lethargy_combined: {
    question: { uz: 'Hayvon holsiz yoki harakatsizmi?', ru: 'Животное вялое или малоподвижное?' },
    options: [
      { label: { uz: 'Ha', ru: 'Да' }, next: 'result_urgent_lethargy' },
      { label: { uz: 'Faol', ru: 'Нет, активный' }, next: 'vomiting' },
    ],
  },
  vomiting: {
    question: { uz: 'Qusish yoki ich ketishi bormi?', ru: 'Есть ли рвота или диарея?' },
    options: [
      { label: { uz: 'Ha, 2+ marta', ru: 'Да, 2+ раза' }, next: 'result_urgent_gi' },
      { label: { uz: '1 marta yoki yoq', ru: 'Один раз или нет' }, next: 'behavior' },
    ],
  },
  behavior: {
    question: { uz: "Xatti-harakat sezilarli o'zgardimi?", ru: 'Заметно изменилось поведение питомца?' },
    options: [
      { label: { uz: 'Ha, juda', ru: 'Да, сильно' }, next: 'result_monitor' },
      { label: { uz: "Yo'q", ru: 'Нет' }, next: 'result_ok' },
    ],
  },
  result_urgent_breathing: {
    result: 'book_vet', severity: 'urgent',
    message: { uz: 'Nafas olishda qiyinchilik — zudlik bilan veterinarga murojaat qiling!', ru: 'Затруднение дыхания — срочно обратитесь к ветеринару!' },
  },
  result_urgent_injury: {
    result: 'book_vet', severity: 'urgent',
    message: { uz: 'Jarohat yoki qon — veterinar koʻrigi zarur.', ru: 'Травма или кровотечение — необходим осмотр ветеринара.' },
  },
  result_urgent_lethargy: {
    result: 'book_vet', severity: 'urgent',
    message: { uz: 'Ishtahasizlik va holsizlik birgalikda — veterinar koʻrigi zarur.', ru: 'Отказ от еды и вялость вместе — нужен осмотр ветеринара.' },
  },
  result_urgent_gi: {
    result: 'book_vet', severity: 'urgent',
    message: { uz: 'Takroriy qusish yoki ich ketishi — veterinarga murojaat qiling.', ru: 'Многократная рвота или диарея — обратитесь к ветеринару.' },
  },
  result_monitor: {
    result: 'monitor', severity: 'watch',
    message: { uz: "Hozircha jiddiy emas, lekin kuzating. Yomonlashsa — veterinarga boring.", ru: 'Пока не критично, но наблюдайте. При ухудшении — к ветеринару.' },
  },
  result_ok: {
    result: 'not_urgent', severity: 'ok',
    message: { uz: "Hozircha jiddiy belgilar yo'q. Hayvonni kuzatishda davom eting.", ru: 'Серьёзных симптомов пока нет. Продолжайте наблюдать за питомцем.' },
  },
}

function isResult(n: CheckerNode): n is ResultNode { return 'result' in n }
function L(obj: { uz: string; ru: string }) { return getLang() === 'uz' ? obj.uz : obj.ru }

function ageFromBirthDate(bd: string | null): string {
  if (!bd) return ''
  const ms = Date.now() - new Date(bd).getTime()
  const months = Math.floor(ms / (30.44 * 24 * 3600 * 1000))
  const years  = Math.floor(months / 12)
  if (years >= 1) return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`
  if (months >= 1) return `${months} мес.`
  return '< 1 мес.'
}

const QUESTION_KEYS = Object.entries(nodes).filter(([, n]) => !isResult(n)).map(([k]) => k)
function progressOf(key: NodeKey) {
  const idx = QUESTION_KEYS.indexOf(key)
  return idx < 0 ? 1 : (idx + 1) / QUESTION_KEYS.length
}

// ── Urgency visual config ─────────────────────────────────────
const URGENCY_STYLE = {
  critical: { bg: '#FFF0EE', border: '#EF4444', title: '#B91C1C', icon: '🚨', barColor: '#EF4444' },
  urgent:   { bg: '#FFF0EE', border: '#F26050', title: '#C0511F', icon: '⚠️', barColor: '#F97316' },
  monitor:  { bg: '#FFFBE6', border: '#F59E0B', title: '#92400E', icon: '👀', barColor: '#F59E0B' },
  ok:       { bg: '#F0FDF4', border: '#22C55E', title: '#166534', icon: '✅', barColor: '#22C55E' },
  watch:    { bg: '#FFFBE6', border: '#F59E0B', title: '#92400E', icon: '👀', barColor: '#F59E0B' },
}

const SEVERITY_STYLE: Record<string, { bg: string; border: string; title: string; icon: string }> = {
  urgent: URGENCY_STYLE.urgent,
  watch:  URGENCY_STYLE.watch,
  ok:     URGENCY_STYLE.ok,
}

// ── Props ─────────────────────────────────────────────────────
interface Props {
  lang: string
  onBookVet: () => void
  onBack: () => void
  onAskAi?: (initialMessage?: string) => void
}

// ── Main component ────────────────────────────────────────────
export default function SymptomChecker({ lang: _lang, onBookVet, onBack, onAskAi }: Props) {
  const isRu = getLang() !== 'uz'
  const [mode, setMode] = useState<Mode>('pick')

  // Tree state
  const [history, setHistory] = useState<NodeKey[]>([startKey])

  // Pets loaded from profile
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)

  useEffect(() => {
    api.pets(getOwnerId()).then(setPets).catch(() => {})
  }, [])

  // AI state
  const [aiStep, setAiStep] = useState<AiStep>('form')
  const [species, setSpecies] = useState('dog')
  const [petName, setPetName] = useState('')
  const [petAge, setPetAge] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [aiError, setAiError] = useState('')

  const currentKey = history[history.length - 1]
  const currentNode = nodes[currentKey]

  const choose = (nextKey: NodeKey) => setHistory(h => [...h, nextKey])
  const goBackTree = () => {
    if (history.length <= 1) { setMode('pick'); setHistory([startKey]); return }
    setHistory(h => h.slice(0, -1))
  }

  const runAI = async () => {
    if (!symptoms.trim()) return
    setAiStep('loading')
    setAiError('')
    try {
      const res = await fetch('/api/symptom-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_name:      petName.trim() || undefined,
          pet_species:   species,
          pet_age:       petAge.trim() || undefined,
          pet_breed:     selectedPet?.breed ?? undefined,
          pet_sex:       selectedPet?.sex ?? undefined,
          pet_weight_kg: selectedPet?.weight_kg ?? undefined,
          symptoms:      symptoms.trim(),
          lang:          getLang(),
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || `HTTP ${res.status}`)
      }
      const data: AiResult = await res.json()
      setAiResult(data)
      setAiStep('result')
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Ошибка')
      setAiStep('error')
    }
  }

  const toggleChip = (chip: string) => {
    setSymptoms(s => {
      const chipRu = chip
      if (s.includes(chipRu)) return s.replace(`, ${chipRu}`, '').replace(chipRu, '').trim().replace(/^, /, '')
      return s ? `${s}, ${chipRu}` : chipRu
    })
  }

  const pickPet = (pet: Pet | null) => {
    setSelectedPet(pet)
    if (pet) {
      setSpecies(pet.species)
      setPetName(pet.name)
      setPetAge(ageFromBirthDate(pet.birth_date))
    } else {
      setSpecies('dog')
      setPetName('')
      setPetAge('')
    }
    setSymptoms('')
  }

  const resetAI = () => {
    setAiStep('form')
    setAiResult(null)
    setAiError('')
    setSymptoms('')
    setSelectedPet(null)
    setPetAge('')
    setPetName('')
    setSpecies('dog')
  }

  const goBack = () => {
    if (mode === 'pick') { onBack(); return }
    if (mode === 'tree') { goBackTree(); return }
    if (mode === 'ai') {
      if (aiStep !== 'form') { resetAI(); return }
      setMode('pick')
    }
  }

  const headerTitle = mode === 'pick'
    ? (isRu ? 'Проверка симптомов' : 'Belgilarni tekshirish')
    : mode === 'tree'
      ? (isRu ? 'Быстрая проверка' : 'Tezkor tekshirish')
      : (isRu ? 'AI-анализ симптомов' : 'AI-tahlil')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={goBack}
          aria-label={isRu ? 'Назад' : 'Orqaga'}
          style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <IconArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{headerTitle}</div>
          {mode === 'tree' && !isResult(currentNode) && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {isRu ? 'Нужен ли ветеринар?' : 'Veterinar kerakmi?'}
            </div>
          )}
          {mode === 'ai' && aiStep === 'form' && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {isRu ? 'Powered by Claude AI' : 'Claude AI asosida'}
            </div>
          )}
        </div>
      </header>

      <div style={{ flex: 1, padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── MODE PICKER ─────────────────────────────────────────── */}
        {mode === 'pick' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🩺</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 6 }}>
                {isRu ? 'Что беспокоит питомца?' : 'Hayvonni nima bezovta qilmoqda?'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {isRu
                  ? 'Выберите способ проверки симптомов'
                  : 'Belgilarni tekshirish usulini tanlang'}
              </div>
            </div>

            {/* AI mode — primary */}
            <button
              onClick={() => setMode('ai')}
              style={{
                padding: '20px', borderRadius: 'var(--r-xl)',
                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 'var(--r-lg)', flexShrink: 0,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
              }}>🤖</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 4 }}>
                  {isRu ? 'AI-анализ симптомов' : 'AI-tahlil'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>
                  {isRu
                    ? 'Опишите словами — Claude AI оценит симптомы, предложит диагнозы и рекомендации'
                    : "Belgilarni so'zlar bilan tavsiflang — Claude AI baholaydi"}
                </div>
                <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-pill)', padding: '3px 10px' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>✨ Рекомендуем</span>
                </div>
              </div>
            </button>

            {/* Tree mode — secondary */}
            <button
              onClick={() => setMode('tree')}
              style={{
                padding: '18px', borderRadius: 'var(--r-xl)',
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 'var(--r-lg)', flexShrink: 0,
                background: 'rgba(242,120,75,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
              }}>📋</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>
                  {isRu ? 'Быстрая проверка' : 'Tezkor tekshiruv'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {isRu
                    ? 'Вопрос–ответ для быстрой оценки срочности'
                    : "Shoshilinchlikni baholash uchun savol-javob"}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── DECISION TREE ───────────────────────────────────────── */}
        {mode === 'tree' && (
          <>
            {!isResult(currentNode) && (
              <div style={{
                height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', background: 'var(--primary)', borderRadius: 2,
                  width: `${progressOf(currentKey) * 100}%`, transition: 'width 0.3s ease',
                }} />
              </div>
            )}

            {!isResult(currentNode) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-xl)', padding: '28px 24px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 44, marginBottom: 16 }}>🩺</div>
                  <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.4, color: 'var(--text)' }}>
                    {L((currentNode as OptionNode).question)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(currentNode as OptionNode).options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => choose(opt.next)}
                      style={{
                        padding: '16px 20px', borderRadius: 'var(--r-lg)',
                        border: '2px solid var(--border)', background: 'var(--surface)',
                        fontFamily: 'inherit', fontWeight: 600, fontSize: 15,
                        color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
                        minHeight: 56, transition: 'all 0.12s',
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'
                        ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(242,120,75,0.06)'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
                      }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--bg)', border: '1.5px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0, color: 'var(--text-muted)',
                      }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {L(opt.label)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setMode('ai')}
                  style={{
                    marginTop: 'auto', padding: '12px', borderRadius: 'var(--r-pill)',
                    border: '1.5px dashed var(--border)', background: 'transparent',
                    color: '#4F46E5', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  🤖 {isRu ? 'Попробовать AI-анализ' : "AI-tahlilni sinab ko'ring"}
                </button>
              </div>
            )}

            {isResult(currentNode) && (() => {
              const sty = SEVERITY_STYLE[currentNode.severity]
              const isUrgent = currentNode.severity === 'urgent'
              const isWatch = currentNode.severity === 'watch'
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                  <div style={{
                    background: sty.bg, border: `2px solid ${sty.border}`,
                    borderRadius: 'var(--r-xl)', padding: '28px 24px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 52, marginBottom: 16 }}>{sty.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 17, color: sty.title, marginBottom: 12, lineHeight: 1.4 }}>
                      {L(currentNode.message)}
                    </div>
                    {(isUrgent || isWatch) && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(0,0,0,0.06)', borderRadius: 'var(--r-pill)',
                        padding: '4px 12px', fontSize: 12, color: sty.title, fontWeight: 600,
                      }}>
                        {isUrgent ? (isRu ? 'Срочно' : 'Zudlik bilan') : (isRu ? 'Наблюдайте' : 'Kuzating')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                    {(currentNode.result === 'book_vet' || isWatch) && (
                      <button
                        onClick={onBookVet}
                        style={{
                          padding: '16px', borderRadius: 'var(--r-pill)',
                          background: 'var(--primary)', color: 'var(--on-primary)',
                          border: 'none', fontWeight: 700, fontSize: 16, minHeight: 56,
                          fontFamily: 'inherit', cursor: 'pointer',
                        }}
                      >
                        {isRu ? '🩺 Записаться к ветеринару' : '🩺 Veterinarga yozilish'}
                      </button>
                    )}
                    {currentNode.result === 'not_urgent' && (
                      <button onClick={onBack} style={{ padding: '16px', borderRadius: 'var(--r-pill)', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', fontWeight: 700, fontSize: 16, minHeight: 56, fontFamily: 'inherit', cursor: 'pointer' }}>
                        {isRu ? 'Понятно' : 'Tushunarli'}
                      </button>
                    )}
                    {onAskAi && (
                      <button
                        onClick={() => onAskAi(L(currentNode.message))}
                        style={{
                          padding: '14px', borderRadius: 'var(--r-pill)',
                          background: 'linear-gradient(135deg,rgba(107,111,228,.12),rgba(155,89,182,.12))',
                          color: '#6B6FE4', border: '1.5px solid rgba(107,111,228,.3)',
                          fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                          cursor: 'pointer', minHeight: 48,
                        }}
                      >
                        🤖 {isRu ? 'Спросить AI-ветеринара' : "AI-veterinarga so'rash"}
                      </button>
                    )}
                    <button onClick={() => { setHistory([startKey]) }} style={{ padding: '14px', borderRadius: 'var(--r-pill)', background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border)', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', minHeight: 48 }}>
                      {isRu ? 'Проверить ещё раз' : 'Qayta tekshirish'}
                    </button>
                  </div>
                </div>
              )
            })()}
          </>
        )}

        {/* ── AI MODE ─────────────────────────────────────────────── */}
        {mode === 'ai' && (
          <>
            {/* FORM */}
            {aiStep === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Pet selector from profile */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {isRu ? 'Выберите питомца' : 'Hayvonni tanlang'}
                  </div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {pets.map(pet => {
                      const active = selectedPet?.id === pet.id
                      return (
                        <button
                          key={pet.id}
                          onClick={() => pickPet(active ? null : pet)}
                          style={{
                            flexShrink: 0, padding: '10px 14px',
                            borderRadius: 'var(--r-lg)', cursor: 'pointer',
                            border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                            background: active ? 'rgba(242,120,75,0.08)' : 'var(--surface)',
                            fontFamily: 'inherit', transition: 'all .12s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            minWidth: 70,
                          }}
                        >
                          <span style={{ fontSize: 28, lineHeight: 1 }}>{pet.avatar_emoji}</span>
                          <span style={{
                            fontSize: 12, fontWeight: active ? 700 : 500,
                            color: active ? 'var(--primary)' : 'var(--text)',
                            maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{pet.name}</span>
                          {active && (
                            <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700 }}>✓</span>
                          )}
                        </button>
                      )
                    })}
                    {/* Manual / without pet */}
                    <button
                      onClick={() => pickPet(null)}
                      style={{
                        flexShrink: 0, padding: '10px 14px',
                        borderRadius: 'var(--r-lg)', cursor: 'pointer',
                        border: `2px dashed ${!selectedPet ? 'var(--primary)' : 'var(--border)'}`,
                        background: !selectedPet ? 'rgba(242,120,75,0.06)' : 'transparent',
                        fontFamily: 'inherit', transition: 'all .12s',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        minWidth: 70,
                      }}
                    >
                      <span style={{ fontSize: 28, lineHeight: 1 }}>➕</span>
                      <span style={{ fontSize: 12, color: !selectedPet ? 'var(--primary)' : 'var(--text-muted)', fontWeight: !selectedPet ? 700 : 500 }}>
                        {isRu ? 'Другой' : 'Boshqa'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Selected pet info badge */}
                {selectedPet && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: 'rgba(242,120,75,0.08)', borderRadius: 'var(--r-lg)',
                    border: '1px solid rgba(242,120,75,0.25)',
                  }}>
                    <span style={{ fontSize: 22 }}>{selectedPet.avatar_emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                        {selectedPet.name}
                        {selectedPet.breed && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}> · {selectedPet.breed}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {[
                          SPECIES_LABELS[selectedPet.species]?.[isRu ? 0 : 1],
                          petAge && petAge,
                          selectedPet.weight_kg ? `${selectedPet.weight_kg} кг` : null,
                        ].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
                      {isRu ? 'из анкеты' : 'anketadan'}
                    </span>
                  </div>
                )}

                {/* Species picker — shown only when no pet selected */}
                {!selectedPet && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                      {isRu ? 'Вид питомца' : 'Hayvon turi'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {Object.entries(SPECIES_EMOJIS).map(([key, emoji]) => (
                        <button
                          key={key}
                          onClick={() => setSpecies(key)}
                          style={{
                            padding: '8px 12px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
                            border: `1.5px solid ${species === key ? 'var(--primary)' : 'var(--border)'}`,
                            background: species === key ? 'rgba(242,120,75,0.1)' : 'var(--surface)',
                            color: species === key ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: species === key ? 700 : 500, fontSize: 13, fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 5, transition: 'all .12s',
                          }}
                        >
                          <span>{emoji}</span>
                          <span>{isRu ? SPECIES_LABELS[key]?.[0] : SPECIES_LABELS[key]?.[1]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name + age — only when no pet selected */}
                {!selectedPet && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                        {isRu ? 'Кличка' : 'Ism'} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{isRu ? '(необязательно)' : '(ixtiyoriy)'}</span>
                      </div>
                      <input
                        value={petName}
                        onChange={e => setPetName(e.target.value)}
                        placeholder={isRu ? 'Барсик' : 'Mushuk'}
                        style={INP}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                        {isRu ? 'Возраст' : 'Yosh'} <span style={{ fontWeight: 400 }}>{isRu ? '(необязательно)' : '(ixtiyoriy)'}</span>
                      </div>
                      <input
                        value={petAge}
                        onChange={e => setPetAge(e.target.value)}
                        placeholder={isRu ? '2 года' : '2 yil'}
                        style={INP}
                      />
                    </div>
                  </div>
                )}

                {/* Quick chips */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {isRu ? 'Быстрый выбор симптомов' : 'Tezkor belgilar'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(SYMPTOM_CHIPS[species] ?? SYMPTOM_CHIPS.other).map(chip => {
                      const active = symptoms.includes(chip)
                      return (
                        <button
                          key={chip}
                          onClick={() => toggleChip(chip)}
                          style={{
                            padding: '6px 12px', borderRadius: 'var(--r-pill)', cursor: 'pointer',
                            border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                            background: active ? 'rgba(242,120,75,0.1)' : 'var(--surface)',
                            color: active ? 'var(--primary)' : 'var(--text)',
                            fontWeight: active ? 700 : 500, fontSize: 13, fontFamily: 'inherit',
                            transition: 'all .12s',
                          }}
                        >
                          {active && '✓ '}{chip}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Symptoms textarea */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {isRu ? 'Опишите подробнее' : 'Batafsil tavsiflang'} *
                  </div>
                  <textarea
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                    placeholder={isRu
                      ? 'Например: кошка 2 дня не ест, лежит, не реагирует на игрушки, нос сухой...'
                      : 'Masalan: mushuk 2 kundan beri ovqat yemaydi, yotib olgan...'}
                    rows={5}
                    style={{ ...INP, resize: 'vertical', lineHeight: 1.5, height: 'auto' }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                    {symptoms.length} {isRu ? 'символов' : 'belgi'}
                  </div>
                </div>

                <button
                  onClick={runAI}
                  disabled={!symptoms.trim()}
                  style={{
                    padding: '16px', borderRadius: 'var(--r-pill)', border: 'none',
                    background: symptoms.trim() ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'var(--border)',
                    color: symptoms.trim() ? '#fff' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: 16, cursor: symptoms.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', minHeight: 56, transition: 'all .15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <span>🤖</span>
                  {isRu ? 'Анализировать симптомы' : 'Belgilarni tahlil qilish'}
                </button>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                  {isRu
                    ? 'AI-анализ не заменяет осмотр ветеринара. При серьёзных симптомах — обратитесь к специалисту.'
                    : "AI-tahlil veterinar ko'rigini almashtirmaydi."}
                </p>
              </div>
            )}

            {/* LOADING */}
            {aiStep === 'loading' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '60px 20px' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>🤖</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 8 }}>
                    {isRu ? 'Claude AI анализирует...' : 'Claude AI tahlil qilmoqda...'}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                    {isRu ? 'Обычно занимает 3–6 секунд' : 'Odatda 3–6 soniya'}
                  </div>
                </div>
                <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:.85} }`}</style>
              </div>
            )}

            {/* ERROR */}
            {aiStep === 'error' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 52 }}>😔</div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{isRu ? 'Не удалось получить ответ' : 'Javob olishda xatolik'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '10px 14px', maxWidth: 320 }}>
                  {aiError}
                </div>
                <button onClick={runAI} style={{ padding: '14px 28px', borderRadius: 'var(--r-pill)', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', minHeight: 52 }}>
                  {isRu ? 'Попробовать снова' : 'Qayta urinib ko\'ring'}
                </button>
                <button onClick={resetAI} style={{ padding: '12px 28px', borderRadius: 'var(--r-pill)', background: 'transparent', color: 'var(--text-muted)', border: '1.5px solid var(--border)', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {isRu ? 'Изменить симптомы' : 'Belgilarni o\'zgartirish'}
                </button>
              </div>
            )}

            {/* RESULT */}
            {aiStep === 'result' && aiResult && (() => {
              const sty = URGENCY_STYLE[aiResult.urgency] ?? URGENCY_STYLE.monitor
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Urgency hero */}
                  <div style={{
                    background: sty.bg, border: `2px solid ${sty.border}`,
                    borderRadius: 'var(--r-xl)', padding: '24px 20px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 52, marginBottom: 10 }}>{sty.icon}</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: sty.border, borderRadius: 'var(--r-pill)',
                      padding: '4px 14px', marginBottom: 14,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>
                        {aiResult.urgency_label}
                      </span>
                    </div>
                    <div style={{ fontSize: 15, color: sty.title, fontWeight: 600, lineHeight: 1.5 }}>
                      {aiResult.summary}
                    </div>
                  </div>

                  {/* Possible conditions */}
                  {aiResult.possible_conditions?.length > 0 && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
                        🔍 {isRu ? 'Возможные причины' : 'Mumkin sabablar'}
                      </div>
                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {aiResult.possible_conditions.map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                            <span style={{ color: sty.border, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                            <span style={{ color: 'var(--text)', lineHeight: 1.4 }}>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {aiResult.recommendations?.length > 0 && (
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13 }}>
                        ✅ {isRu ? 'Что делать' : 'Nima qilish kerak'}
                      </div>
                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {aiResult.recommendations.map((r, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              background: 'rgba(34,197,94,0.12)', border: '1.5px solid #22C55E',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: '#15803D', marginTop: 1,
                            }}>{i + 1}</span>
                            <span style={{ color: 'var(--text)', lineHeight: 1.4 }}>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTAs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    {aiResult.see_vet && (
                      <button
                        onClick={onBookVet}
                        style={{
                          padding: '16px', borderRadius: 'var(--r-pill)',
                          background: 'var(--primary)', color: '#fff',
                          border: 'none', fontWeight: 700, fontSize: 16, minHeight: 56,
                          fontFamily: 'inherit', cursor: 'pointer',
                        }}
                      >
                        {isRu ? '🩺 Записаться к ветеринару' : '🩺 Veterinarga yozilish'}
                      </button>
                    )}
                    {onAskAi && (
                      <button
                        onClick={() => onAskAi(aiResult.summary)}
                        style={{
                          padding: '14px', borderRadius: 'var(--r-pill)',
                          background: 'linear-gradient(135deg,rgba(107,111,228,.12),rgba(155,89,182,.12))',
                          color: '#6B6FE4', border: '1.5px solid rgba(107,111,228,.3)',
                          fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                          cursor: 'pointer', minHeight: 48,
                        }}
                      >
                        🤖 {isRu ? 'Спросить AI-ветеринара' : "AI-veterinarga so'rash"}
                      </button>
                    )}
                    <button
                      onClick={resetAI}
                      style={{
                        padding: '14px', borderRadius: 'var(--r-pill)',
                        background: 'transparent', color: 'var(--text-muted)',
                        border: '1.5px solid var(--border)', fontWeight: 600, fontSize: 14,
                        fontFamily: 'inherit', cursor: 'pointer', minHeight: 48,
                      }}
                    >
                      {isRu ? 'Проверить другие симптомы' : 'Boshqa belgilarni tekshirish'}
                    </button>
                  </div>

                  {/* Disclaimer */}
                  {aiResult.disclaimer && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, margin: 0, padding: '0 8px' }}>
                      {aiResult.disclaimer}
                    </p>
                  )}
                </div>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}

const INP: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
  borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
  fontSize: 14, fontFamily: 'inherit', minHeight: 44,
  background: 'var(--bg)', color: 'var(--text)',
}
