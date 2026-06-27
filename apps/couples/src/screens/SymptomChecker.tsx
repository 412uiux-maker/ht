import { useState } from 'react'
import { IconArrowLeft } from '@ht/shared'
import { getLang } from '../i18n'

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

function isResult(n: CheckerNode): n is ResultNode {
  return 'result' in n
}

function L(obj: { uz: string; ru: string }) {
  return getLang() === 'uz' ? obj.uz : obj.ru
}

const QUESTION_KEYS = Object.entries(nodes)
  .filter(([, n]) => !isResult(n))
  .map(([k]) => k)

function progressOf(key: NodeKey): number {
  const idx = QUESTION_KEYS.indexOf(key)
  if (idx < 0) return 1
  return (idx + 1) / QUESTION_KEYS.length
}

const SEVERITY_STYLE: Record<string, { bg: string; border: string; title: string; icon: string }> = {
  urgent: { bg: '#FFF0EE', border: '#F26050', title: '#C0511F', icon: '⚠️' },
  watch:  { bg: '#FFFBE6', border: '#F59E0B', title: '#92400E', icon: '👀' },
  ok:     { bg: '#F0FDF4', border: '#22C55E', title: '#166534', icon: '✅' },
}

interface Props {
  lang: string
  onBookVet: () => void
  onBack: () => void
}

export default function SymptomChecker({ lang, onBookVet, onBack }: Props) {
  void lang
  const [history, setHistory] = useState<NodeKey[]>([startKey])

  const currentKey = history[history.length - 1]
  const currentNode = nodes[currentKey]

  const choose = (nextKey: NodeKey) => {
    setHistory(h => [...h, nextKey])
  }

  const goBack = () => {
    if (history.length <= 1) { onBack(); return }
    setHistory(h => h.slice(0, -1))
  }

  const restart = () => setHistory([startKey])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={goBack}
          aria-label={getLang() === 'uz' ? 'Orqaga' : 'Назад'}
          style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <IconArrowLeft size={18} />
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {getLang() === 'uz' ? 'Belgilarni tekshirish' : 'Проверка симптомов'}
          </div>
          {!isResult(currentNode) && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {getLang() === 'uz' ? 'Veterinar maslahati kerakmi?' : 'Нужен ли ветеринар?'}
            </div>
          )}
        </div>
      </header>

      <div style={{ flex: 1, padding: '24px 16px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Progress bar */}
        {!isResult(currentNode) && (
          <div style={{
            height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', background: 'var(--primary)', borderRadius: 2,
              width: `${progressOf(currentKey) * 100}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}

        {/* Question screen */}
        {!isResult(currentNode) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-xl)', padding: '28px 24px',
              textAlign: 'center',
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
          </div>
        )}

        {/* Result screen */}
        {isResult(currentNode) && (() => {
          const sty = SEVERITY_STYLE[currentNode.severity]
          const isUrgent = currentNode.severity === 'urgent'
          const isWatch = currentNode.severity === 'watch'

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              {/* Result card */}
              <div style={{
                background: sty.bg, border: `2px solid ${sty.border}`,
                borderRadius: 'var(--r-xl)', padding: '28px 24px',
                textAlign: 'center',
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
                    {isUrgent
                      ? (getLang() === 'uz' ? 'Zudlik bilan' : 'Срочно')
                      : (getLang() === 'uz' ? 'Kuzatib turing' : 'Наблюдайте')}
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                {currentNode.result === 'book_vet' || isWatch ? (
                  <button
                    onClick={onBookVet}
                    style={{
                      padding: '16px', borderRadius: 'var(--r-pill)',
                      background: 'var(--primary)', color: 'var(--on-primary)',
                      border: 'none', fontWeight: 700, fontSize: 16, minHeight: 56,
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    {getLang() === 'uz' ? '🩺 Veterinarga yozilish' : '🩺 Записаться к ветеринару'}
                  </button>
                ) : null}

                {currentNode.result === 'not_urgent' && (
                  <button
                    onClick={onBack}
                    style={{
                      padding: '16px', borderRadius: 'var(--r-pill)',
                      background: 'var(--primary)', color: 'var(--on-primary)',
                      border: 'none', fontWeight: 700, fontSize: 16, minHeight: 56,
                      fontFamily: 'inherit', cursor: 'pointer',
                    }}
                  >
                    {getLang() === 'uz' ? 'Tushunarli' : 'Понятно'}
                  </button>
                )}

                <button
                  onClick={restart}
                  style={{
                    padding: '14px', borderRadius: 'var(--r-pill)',
                    background: 'transparent', color: 'var(--text-muted)',
                    border: '1.5px solid var(--border)', fontWeight: 600, fontSize: 14,
                    fontFamily: 'inherit', cursor: 'pointer', minHeight: 48,
                  }}
                >
                  {getLang() === 'uz' ? 'Qayta tekshirish' : 'Проверить ещё раз'}
                </button>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
