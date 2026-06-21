import { useEffect, useRef, useState } from 'react'
import type { Vet, Message, Consultation, MedicalReport } from '../api'
import { api } from '../api'
import { t } from '../i18n'

interface Props {
  lang: string
  consultationId: string
  vet: Vet
  onBack: () => void
}

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾',
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function fmtDay(dt: string, lang: string) {
  const d = new Date(dt)
  d.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return lang === 'uz' ? 'Bugun' : 'Сегодня'
  if (diff === 1) return lang === 'uz' ? 'Kecha' : 'Вчера'
  return new Date(dt).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', { day: 'numeric', month: 'long' })
}

interface GroupedMsg { msg: Message; isFirst: boolean; isLast: boolean }

function groupMessages(msgs: Message[]): GroupedMsg[] {
  return msgs.map((msg, i) => ({
    msg,
    isFirst: i === 0 || msgs[i - 1].sender !== msg.sender,
    isLast:  i === msgs.length - 1 || msgs[i + 1].sender !== msg.sender,
  }))
}

function bubbleRadius(isMe: boolean, isLast: boolean) {
  if (isMe) return isLast ? '18px 18px 4px 18px' : '18px 18px 14px 18px'
  return isLast ? '18px 18px 18px 4px' : '18px 18px 18px 14px'
}

export default function Chat({ lang, consultationId, vet, onBack }: Props) {
  void lang
  const [messages, setMessages] = useState<Message[]>([])
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [hover, setHover] = useState(0)
  const [rating, setRating] = useState(0)
  const [rated, setRated] = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const taRef      = useRef<HTMLTextAreaElement>(null)
  const consultRef = useRef<Consultation | null>(null)

  const fetchData = async () => {
    if (consultRef.current?.status === 'completed') return
    try {
      const data = await api.getConsultation(consultationId)
      consultRef.current = data.consultation
      setConsultation(data.consultation)
      setMessages(data.messages)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 3000)
    return () => clearInterval(id)
  }, [consultationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const txt = text.trim()
    if (!txt || sending) return
    setSending(true)
    setText('')
    if (taRef.current) taRef.current.style.height = 'auto'
    try {
      await api.sendMessage(consultationId, txt)
      await fetchData()
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }

  const status  = consultation?.status ?? 'pending'
  const isDone  = status === 'completed'
  const isActive = status === 'active'
  const petEmoji = consultation ? (SPECIES_EMOJI[consultation.pet_species] ?? '🐾') : '🐾'
  void petEmoji
  const grouped  = groupMessages(messages)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* ── HEADER ─────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: 'var(--surface)',
        borderBottom: `2px solid ${isActive ? 'var(--success)' : 'var(--border)'}`,
        position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          aria-label={t('back')}
          style={{
            width: 40, height: 40, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ←
        </button>

        {/* Avatar + online dot */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            background: 'var(--grad-warm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            {vet.avatar_emoji}
          </div>
          {isActive && (
            <div style={{
              position: 'absolute', bottom: 1, right: 1,
              width: 11, height: 11, borderRadius: '50%',
              background: 'var(--success)',
              border: '2px solid var(--surface)',
            }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 14,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {vet.name}
          </div>
          <div style={{
            fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: isActive ? 'var(--success)' : 'var(--text-muted)',
            fontWeight: isActive ? 600 : 400,
          }}>
            {isActive ? t('chat.status_active') : vet.specialty}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isActive && (
            <a
              href={`http://localhost:8080/video.html?id=${consultationId}&role=client`}
              target="_blank"
              rel="noreferrer"
              aria-label={t('chat.video')}
              style={{
                width: 40, height: 40, borderRadius: 'var(--r-md)',
                background: 'var(--grad-warm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(242,120,75,.25)',
              }}
            >
              📹
            </a>
          )}
          {!isActive && (
            <span style={{
              padding: '5px 10px', borderRadius: 'var(--r-pill)',
              fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
              background: isDone ? 'var(--surface-2)' : '#FFF3CD',
              color:      isDone ? 'var(--text-muted)' : '#856404',
            }}>
              {isDone ? t('chat.status_completed') : t('chat.status_pending')}
            </span>
          )}
        </div>
      </header>

      {/* ── MESSAGES ───────────────────────────────── */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '12px 16px 8px',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg)',
      }}>

        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0', fontSize: 14 }}>
            {t('loading')}
          </div>
        )}

        {/* Waiting state */}
        {!loading && status === 'pending' && messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px', gap: 20, textAlign: 'center' }}>
            <div style={{
              background: 'var(--surface)', borderRadius: 'var(--r-lg)',
              padding: '16px 20px', width: '100%', maxWidth: 300,
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 'var(--r-md)',
                background: 'var(--grad-warm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, flexShrink: 0,
              }}>
                {vet.avatar_emoji}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{vet.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{vet.specialty}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: 'var(--primary)',
                  animation: `dot-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{t('chat.waiting')}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('chat.waiting_hint')}</div>
            </div>

            <style>{`
              @keyframes dot-pulse {
                0%, 80%, 100% { opacity: .3; transform: scale(.75); }
                40% { opacity: 1; transform: scale(1.15); }
              }
            `}</style>
          </div>
        )}

        {/* Message list */}
        {grouped.map(({ msg, isFirst, isLast }, i) => {
          const isMe = msg.sender === 'client'
          const prevMsg = messages[i - 1]
          const isDifferentDay = !prevMsg ||
            new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()

          return (
            <div key={msg.id}>
              {isDifferentDay && (
                <div style={{ textAlign: 'center', margin: `${isFirst && i === 0 ? 0 : 12}px 0 8px` }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-pill)', padding: '3px 12px',
                  }}>
                    {fmtDay(msg.created_at, lang)}
                  </span>
                </div>
              )}

              <div style={{
                display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                marginBottom: isLast ? 10 : 2,
                marginTop: isFirst && !isDifferentDay ? 2 : 0,
              }}>
                {/* Vet avatar — only on last bubble in group */}
                {!isMe && (
                  <div style={{ width: 28, marginRight: 8, flexShrink: 0 }}>
                    {isLast && (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--grad-warm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14,
                      }}>
                        {vet.avatar_emoji}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ maxWidth: '72%' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: bubbleRadius(isMe, isLast),
                    background: isMe ? 'var(--primary)' : 'var(--surface)',
                    color: isMe ? 'var(--on-primary)' : 'var(--text)',
                    border: isMe ? 'none' : '1px solid var(--border)',
                    fontSize: 14, lineHeight: 1.55,
                    boxShadow: isMe ? 'none' : '0 1px 4px rgba(35,40,45,.06)',
                  }}>
                    {msg.text}
                  </div>
                  {isLast && (
                    <div style={{
                      fontSize: 10, color: 'var(--text-muted)', marginTop: 3,
                      textAlign: isMe ? 'right' : 'left',
                      paddingLeft: isMe ? 0 : 2,
                    }}>
                      {fmtTime(msg.created_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Completion card */}
        {isDone && (
          <CompletionCard
            consultation={consultation}
            vet={vet}
            lang={lang}
            hover={hover} setHover={setHover}
            rating={rating} setRating={setRating}
            rated={rated} setRated={setRated}
            onBack={onBack}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ──────────────────────────────── */}
      {!isDone && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
          boxShadow: '0 -2px 12px rgba(35,40,45,.06)',
        }}>
          <textarea
            ref={taRef}
            value={text}
            onChange={onTextChange}
            onKeyDown={onKeyDown}
            disabled={sending}
            placeholder={t('chat.placeholder')}
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 'var(--r-lg)',
              border: '1.5px solid var(--border)', background: 'var(--bg)',
              fontSize: 15, color: 'var(--text)', resize: 'none', outline: 'none',
              minHeight: 44, maxHeight: 120, fontFamily: 'inherit', lineHeight: 1.5,
              transition: 'border-color .15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            aria-label={t('chat.send')}
            style={{
              width: 44, height: 44, borderRadius: 'var(--r-pill)', flexShrink: 0,
              background: !text.trim() || sending ? 'var(--border)' : 'var(--primary)',
              color:      !text.trim() || sending ? 'var(--text-muted)' : 'var(--on-primary)',
              border: 'none', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s, box-shadow .15s',
              boxShadow: !text.trim() || sending ? 'none' : '0 2px 10px rgba(242,120,75,.35)',
              cursor: !text.trim() || sending ? 'default' : 'pointer',
            }}
          >
            ↑
          </button>
        </div>
      )}
    </div>
  )
}

// ── COMPLETION CARD ─────────────────────────────────────────────────────────

interface CompletionProps {
  consultation: Consultation | null
  vet: Vet
  lang: string
  hover: number; setHover: (v: number) => void
  rating: number; setRating: (v: number) => void
  rated: boolean; setRated: (v: boolean) => void
  onBack: () => void
}

function MedReportCard({ report }: { report: MedicalReport }) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const toggle = (i: number) =>
    setChecked(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Diagnosis */}
      <div style={{
        background: 'rgba(242,120,75,.08)', border: '1px solid rgba(242,120,75,.2)',
        borderRadius: 'var(--r-md)', padding: '12px 14px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '.05em', marginBottom: 4 }}>
          ДИАГНОЗ
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>
          {report.diagnosis}
        </div>
      </div>

      {/* Medications */}
      {report.medications.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            💊 Препараты
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {report.medications.map((m, i) => (
              <div key={i} style={{
                background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
                padding: '10px 12px',
                display: 'grid', gridTemplateColumns: '1fr auto',
                gap: '4px 12px', alignItems: 'start',
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{m.name}</div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--primary)',
                  background: 'rgba(242,120,75,.1)', borderRadius: 'var(--r-pill)',
                  padding: '2px 8px', whiteSpace: 'nowrap',
                }}>
                  {m.days} дн.
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {[m.dose, m.freq].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps checklist */}
      {report.steps.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            📋 Инструкции
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {report.steps.map((step, i) => {
              const done = checked.has(i)
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left',
                    background: done ? 'rgba(76,175,125,.08)' : 'var(--surface-2)',
                    border: `1px solid ${done ? 'rgba(76,175,125,.25)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)', padding: '10px 12px',
                    cursor: 'pointer', transition: 'all .15s', width: '100%',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    border: `2px solid ${done ? 'var(--success)' : 'var(--border)'}`,
                    background: done ? 'var(--success)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', transition: 'all .15s',
                  }}>
                    {done ? '✓' : ''}
                  </div>
                  <span style={{
                    fontSize: 13, lineHeight: 1.5,
                    color: done ? 'var(--text-muted)' : 'var(--text)',
                    textDecoration: done ? 'line-through' : 'none',
                    transition: 'color .15s',
                  }}>
                    {step}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Follow-up */}
      {report.followup && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          background: 'var(--surface-2)', borderRadius: 'var(--r-md)', padding: '10px 12px',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📅</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>НАБЛЮДЕНИЕ</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{report.followup}</div>
          </div>
        </div>
      )}

      {/* Restrictions */}
      {report.restrictions && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          background: 'rgba(245,166,35,.07)', border: '1px solid rgba(245,166,35,.2)',
          borderRadius: 'var(--r-md)', padding: '10px 12px',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#856404', marginBottom: 2 }}>ОГРАНИЧЕНИЯ</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{report.restrictions}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function CompletionCard({ consultation, vet, hover, setHover, rating, setRating, rated, setRated, onBack }: CompletionProps) {
  const report = consultation?.report ?? null
  const summary = consultation?.summary ?? null

  return (
    <div style={{
      margin: '8px 0 4px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--grad-warm)',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 24 }}>✅</span>
        <div style={{ color: '#fff' }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{t('chat.done')}</div>
          <div style={{ fontSize: 12, opacity: .85 }}>{vet.name}</div>
        </div>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Structured report */}
        {report && <MedReportCard report={report} />}

        {/* Fallback: plain summary */}
        {!report && summary && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
              {t('chat.summary_title')}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65 }}>{summary}</div>
          </div>
        )}

        {/* Star rating */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            {rated ? t('chat.rate_done') : t('chat.rate')}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                onClick={() => { if (!rated) { setRating(i); setRated(true) } }}
                onMouseEnter={() => { if (!rated) setHover(i) }}
                onMouseLeave={() => { if (!rated) setHover(0) }}
                disabled={rated}
                aria-label={`${i} звезд`}
                style={{
                  fontSize: 28, background: 'none', border: 'none',
                  cursor: rated ? 'default' : 'pointer', padding: '1px 2px',
                  filter: i <= (hover || rating) ? 'none' : 'grayscale(1) opacity(.25)',
                  transform: i <= (hover || rating) ? 'scale(1.15)' : 'scale(1)',
                  transition: 'filter .12s, transform .12s',
                }}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onBack}
          style={{
            padding: '13px', borderRadius: 'var(--r-pill)',
            background: 'var(--primary)', color: 'var(--on-primary)',
            border: 'none', fontWeight: 700, fontSize: 15, minHeight: 48,
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          {t('chat.new_consult')}
        </button>
      </div>
    </div>
  )
}
