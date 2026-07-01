import { useState, useEffect, useRef } from 'react'
import { IconArrowLeft, IconPlay, IconCheck, IconOrders } from '@ht/shared'
import { api } from '../api'
import type { VendorSession, Consultation, Message, MedicalReport, Medication } from '../types'

const QUICK = [
  'Понял, изучаю вопрос',
  'Требуется осмотр в клинике',
  'Всё в порядке, дам рекомендации',
  'Пришлите фото симптомов',
]

const SPECIES: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾',
}

interface MedDraft { name: string; dose: string; freq: string; days: string }
interface ReportDraft {
  diagnosis: string
  medications: MedDraft[]
  steps: string[]
  followup: string
  restrictions: string
}

const emptyReport = (): ReportDraft => ({
  diagnosis: '', medications: [], steps: [''], followup: '', restrictions: '',
})

function toMedicalReport(d: ReportDraft): MedicalReport {
  return {
    diagnosis: d.diagnosis.trim(),
    medications: d.medications
      .filter(m => m.name.trim())
      .map(m => ({ name: m.name.trim(), dose: m.dose.trim(), freq: m.freq.trim(), days: parseInt(m.days) || 1 })),
    steps: d.steps.map(s => s.trim()).filter(Boolean),
    followup: d.followup.trim(),
    restrictions: d.restrictions.trim() || undefined,
  }
}

export default function Chat({
  consultId, session, onBack, onVideoCall,
}: {
  consultId: string
  session: VendorSession
  onBack: () => void
  onVideoCall?: (info: { clientName: string; petName: string; petSpecies: string }) => void
}) {
  void session
  const [consult, setConsult] = useState<Consultation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [report, setReport] = useState<ReportDraft>(emptyReport())
  const [draftReport, setDraftReport] = useState<ReportDraft | null>(null)
  const [showComplete, setShowComplete] = useState(false)
  const [sending, setSending] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
  const [elapsed, setElapsed] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const consultRef = useRef<Consultation | null>(null)

  const load = async () => {
    try {
      const d = await api.consultation(consultId)
      setConsult(d.consultation)
      consultRef.current = d.consultation
      setMessages(d.messages)
    } catch {}
  }

  useEffect(() => {
    load()
    const iv = setInterval(() => {
      if (consultRef.current?.status !== 'completed') load()
    }, 3000)
    return () => clearInterval(iv)
  }, [consultId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Timer: count up from call_started_at
  useEffect(() => {
    if (!consult?.call_started_at) return
    const start = new Date(consult.call_started_at).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [consult?.call_started_at])

  const send = async () => {
    const t = text.trim()
    if (!t || sending) return
    setSending(true)
    try {
      await api.sendMessage(consultId, t)
      setText('')
      await load()
    } finally {
      setSending(false)
    }
  }

  const accept = async () => {
    setAccepting(true)
    setError('')
    try {
      await api.accept(consultId)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setAccepting(false)
    }
  }

  const saveDraft = () => {
    if (!report.diagnosis.trim()) return
    setDraftReport({ ...report })
    setShowComplete(false)
  }

  const complete = async (r?: ReportDraft | null) => {
    const data = r ?? report
    if (!data.diagnosis.trim() || completing) return
    setCompleting(true)
    setError('')
    try {
      await api.complete(consultId, toMedicalReport(data))
      setShowComplete(false)
      setDraftReport(null)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setCompleting(false)
    }
  }

  const setMed = (i: number, field: keyof MedDraft, val: string) =>
    setReport(r => {
      const meds = [...r.medications]
      meds[i] = { ...meds[i], [field]: val }
      return { ...r, medications: meds }
    })

  const addMed = () =>
    setReport(r => ({ ...r, medications: [...r.medications, { name: '', dose: '', freq: '', days: '' }] }))

  const removeMed = (i: number) =>
    setReport(r => ({ ...r, medications: r.medications.filter((_, j) => j !== i) }))

  const setStep = (i: number, val: string) =>
    setReport(r => { const s = [...r.steps]; s[i] = val; return { ...r, steps: s } })

  const addStep = () =>
    setReport(r => ({ ...r, steps: [...r.steps, ''] }))

  const removeStep = (i: number) =>
    setReport(r => ({ ...r, steps: r.steps.filter((_, j) => j !== i) }))

  const isDone = consult?.status === 'completed'
  const isPending = consult?.status === 'pending'

  const fmtElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    const over = consult?.duration_min && s > consult.duration_min * 60
    return { text: `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`, over: !!over }
  }

  const inp: React.CSSProperties = {
    background: 'var(--surface3)', border: '1px solid var(--surface3)',
    borderRadius: 'var(--r-sm)', padding: '8px 10px', color: 'var(--text)',
    fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--surface3)',
        padding: '0 20px', height: '60px', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--surface3)',
            borderRadius: 'var(--r-sm)', padding: '8px 14px',
            color: 'var(--text2)', fontSize: '20px', minHeight: '44px', minWidth: '44px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IconArrowLeft size={18} />
        </button>
        {consult ? (
          <>
            <span style={{ fontSize: '24px' }}>{SPECIES[consult.pet_species] ?? '🐾'}</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '15px' }}>
                {consult.pet_name} · {consult.client_name}
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text3)' }}>{consult.pet_species}</p>
            </div>
            <span className={`pill pill-${consult.status}`}>
              {consult.status === 'pending' ? 'Ожидает' : consult.status === 'active' ? 'Активна' : 'Завершена'}
            </span>
            {elapsed !== null && (
              <span style={{
                fontSize: '13px', fontVariantNumeric: 'tabular-nums',
                fontWeight: 700, padding: '4px 8px', borderRadius: 'var(--r-sm)',
                background: fmtElapsed(elapsed).over ? 'rgba(220,38,38,.12)' : 'rgba(76,175,125,.12)',
                color: fmtElapsed(elapsed).over ? 'var(--danger)' : 'var(--green)',
              }}>
                {fmtElapsed(elapsed).text}
              </span>
            )}
            {!isDone && !isPending && onVideoCall && (
              <button
                onClick={() => onVideoCall?.({ clientName: consult.client_name, petName: consult.pet_name, petSpecies: consult.pet_species })}
                style={{
                  background: 'var(--violet)', color: '#fff', borderRadius: 'var(--r-sm)',
                  padding: '8px 14px', fontSize: '14px', border: 'none', cursor: 'pointer',
                  minHeight: '44px', display: 'flex', alignItems: 'center', gap: '4px',
                  fontFamily: 'inherit',
                }}
              >
                <IconPlay size={14} /> Видео
              </button>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--text3)' }}>Загрузка…</span>
        )}
      </header>

      {/* Accept banner */}
      {isPending && consult && (
        <div style={{
          background: 'rgba(245,166,35,.08)', borderBottom: '1px solid rgba(245,166,35,.25)',
          padding: '16px 20px', flexShrink: 0,
        }}>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '12px', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--amber)' }}>Жалоба:</strong> {consult.problem}
          </p>
          {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '8px' }}>{error}</p>}
          <button
            onClick={accept}
            disabled={accepting}
            style={{
              background: 'var(--amber)', color: '#000', border: 'none',
              borderRadius: 'var(--r-sm)', padding: '10px 24px',
              fontSize: '14px', fontWeight: 700, minHeight: '44px',
              opacity: accepting ? 0.7 : 1, cursor: 'pointer',
            }}
          >
            {accepting ? 'Принимаем…' : <><IconCheck size={14} /> Принять консультацию</>}
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!isPending && messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--coral)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text3)', fontSize: '14px' }}>Ожидаем ответа клиента…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.sender === 'vet' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '72%', padding: '10px 14px', borderRadius: '16px',
              background: m.sender === 'vet' ? 'var(--coral)' : 'var(--surface2)',
              color: m.sender === 'vet' ? '#fff' : 'var(--text)',
              fontSize: '14px', lineHeight: '1.5',
              borderBottomRightRadius: m.sender === 'vet' ? '4px' : '16px',
              borderBottomLeftRadius: m.sender === 'client' ? '4px' : '16px',
            }}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Completed — show issued report */}
        {isDone && consult?.report && (
          <div style={{
            background: 'rgba(76,175,125,.07)', border: '1px solid rgba(76,175,125,.25)',
            borderRadius: 'var(--r-md)', padding: '16px 18px', marginTop: '8px',
          }}>
            <p style={{ color: 'var(--green)', fontWeight: 700, marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconCheck size={14} /> Заключение выдано
            </p>
            <p style={{ color: 'var(--text2)', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
              {consult.report.diagnosis}
            </p>
            {consult.report.steps.length > 0 && (
              <ol style={{ margin: '8px 0 0', paddingLeft: '18px', color: 'var(--text3)', fontSize: '13px', lineHeight: 1.7 }}>
                {consult.report.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            )}
          </div>
        )}
        {isDone && !consult?.report && consult?.summary && (
          <div style={{
            background: 'rgba(76,175,125,.07)', border: '1px solid rgba(76,175,125,.25)',
            borderRadius: 'var(--r-md)', padding: '14px 18px', marginTop: '8px',
          }}>
            <p style={{ color: 'var(--green)', fontWeight: 600, marginBottom: '4px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}><IconCheck size={12} /> Заключение врача</p>
            <p style={{ color: 'var(--text2)', fontSize: '14px' }}>{consult.summary}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {!isDone && !isPending && (
        <div style={{
          background: 'var(--surface)', borderTop: '1px solid var(--surface3)',
          padding: '12px 16px', flexShrink: 0, maxHeight: '70vh', overflowY: 'auto',
        }}>
          {/* Draft banner — issued separately after review */}
          {draftReport && !showComplete && (
            <div style={{
              background: 'rgba(245,166,35,.08)', border: '1px solid rgba(245,166,35,.3)',
              borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 700, marginBottom: '4px' }}>
                    📝 Черновик заключения
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: 0 }}>
                    {draftReport.diagnosis}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => complete(draftReport)}
                    disabled={completing}
                    style={{
                      background: 'var(--green)', color: '#fff', border: 'none',
                      borderRadius: 'var(--r-sm)', padding: '8px 14px',
                      fontSize: '13px', fontWeight: 700, minHeight: '36px',
                      cursor: completing ? 'default' : 'pointer',
                      opacity: completing ? 0.6 : 1, whiteSpace: 'nowrap',
                    }}
                  >
                    {completing ? '…' : '✓ Выдать клиенту'}
                  </button>
                  <button
                    onClick={() => { setReport(draftReport); setDraftReport(null); setShowComplete(true) }}
                    style={{
                      background: 'transparent', color: 'var(--text3)', border: '1px solid var(--surface3)',
                      borderRadius: 'var(--r-sm)', padding: '6px 14px',
                      fontSize: '12px', minHeight: '32px', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Изменить
                  </button>
                </div>
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
            </div>
          )}

          {/* Quick replies */}
          {!showComplete && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {QUICK.map(q => (
                <button
                  key={q}
                  onClick={() => setText(q)}
                  style={{
                    background: 'var(--surface2)', border: '1px solid var(--surface3)',
                    borderRadius: 'var(--r-sm)', padding: '6px 10px',
                    color: 'var(--text2)', fontSize: '12px', minHeight: '34px', cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* ── REPORT FORM ─────────────────────────── */}
          {showComplete && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                background: 'rgba(245,166,35,.08)', borderRadius: 'var(--r-md)',
                padding: '14px 16px', marginBottom: '12px',
                border: '1px solid rgba(245,166,35,.2)',
              }}>
                <p style={{ color: 'var(--amber)', fontWeight: 700, fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconOrders size={14} /> Медицинское заключение
                </p>

                {/* Diagnosis */}
                <Section label="Диагноз *">
                  <input
                    style={{ ...inp, width: '100%' }}
                    placeholder="Поставьте диагноз…"
                    value={report.diagnosis}
                    onChange={e => setReport(r => ({ ...r, diagnosis: e.target.value }))}
                  />
                </Section>

                {/* Medications */}
                <Section label="Препараты">
                  {report.medications.map((m, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 56px 28px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                      <input style={inp} placeholder="Препарат" value={m.name} onChange={e => setMed(i, 'name', e.target.value)} />
                      <input style={inp} placeholder="Доза" value={m.dose} onChange={e => setMed(i, 'dose', e.target.value)} />
                      <input style={inp} placeholder="Частота" value={m.freq} onChange={e => setMed(i, 'freq', e.target.value)} />
                      <input style={{ ...inp, textAlign: 'center' }} placeholder="Дней" type="number" min={1} value={m.days} onChange={e => setMed(i, 'days', e.target.value)} />
                      <button
                        onClick={() => removeMed(i)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '16px', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                        aria-label="Удалить"
                      >×</button>
                    </div>
                  ))}
                  <button
                    onClick={addMed}
                    style={{
                      background: 'var(--surface2)', border: '1px dashed var(--surface3)',
                      borderRadius: 'var(--r-sm)', padding: '6px 12px',
                      color: 'var(--text3)', fontSize: '12px', cursor: 'pointer', minHeight: '34px',
                    }}
                  >
                    + Добавить препарат
                  </button>
                </Section>

                {/* Steps */}
                <Section label="Инструкции по лечению">
                  {report.steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text3)', fontSize: '12px', minWidth: '18px', textAlign: 'right' }}>{i + 1}.</span>
                      <input
                        style={{ ...inp, flex: 1 }}
                        placeholder={`Шаг ${i + 1}`}
                        value={s}
                        onChange={e => setStep(i, e.target.value)}
                      />
                      {report.steps.length > 1 && (
                        <button
                          onClick={() => removeStep(i)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '16px', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                          aria-label="Удалить"
                        >×</button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addStep}
                    style={{
                      background: 'var(--surface2)', border: '1px dashed var(--surface3)',
                      borderRadius: 'var(--r-sm)', padding: '6px 12px',
                      color: 'var(--text3)', fontSize: '12px', cursor: 'pointer', minHeight: '34px',
                    }}
                  >
                    + Добавить шаг
                  </button>
                </Section>

                {/* Follow-up */}
                <Section label="Наблюдение и повторный приём">
                  <input
                    style={{ ...inp, width: '100%' }}
                    placeholder="Когда обратиться повторно…"
                    value={report.followup}
                    onChange={e => setReport(r => ({ ...r, followup: e.target.value }))}
                  />
                </Section>

                {/* Restrictions */}
                <Section label="Ограничения (необязательно)">
                  <input
                    style={{ ...inp, width: '100%' }}
                    placeholder="Что нельзя, диета и т.д."
                    value={report.restrictions}
                    onChange={e => setReport(r => ({ ...r, restrictions: e.target.value }))}
                  />
                </Section>

                {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>{error}</p>}

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    onClick={saveDraft}
                    disabled={!report.diagnosis.trim()}
                    style={{
                      background: 'var(--amber)', color: '#000', border: 'none',
                      borderRadius: 'var(--r-sm)', padding: '10px 20px',
                      fontSize: '14px', fontWeight: 700, minHeight: '44px',
                      cursor: !report.diagnosis.trim() ? 'default' : 'pointer',
                      opacity: !report.diagnosis.trim() ? 0.6 : 1,
                    }}
                  >
                    <IconCheck size={14} /> Сохранить черновик
                  </button>
                  <button
                    onClick={() => setShowComplete(false)}
                    style={{
                      background: 'var(--surface3)', color: 'var(--text2)', border: 'none',
                      borderRadius: 'var(--r-sm)', padding: '10px 16px',
                      fontSize: '14px', minHeight: '44px', cursor: 'pointer',
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Text + send */}
          {!showComplete && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Напишите сообщение…"
                rows={2}
                style={{
                  flex: 1, background: 'var(--surface2)', border: '1px solid var(--surface3)',
                  borderRadius: 'var(--r-sm)', padding: '10px 14px', color: 'var(--text)',
                  fontSize: '14px', resize: 'none', fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={send}
                  disabled={sending || !text.trim()}
                  style={{
                    background: 'var(--coral)', color: '#fff', border: 'none',
                    borderRadius: 'var(--r-sm)', padding: '10px 18px',
                    fontSize: '14px', fontWeight: 600, minHeight: '44px', cursor: 'pointer',
                    opacity: !text.trim() ? 0.5 : 1,
                  }}
                >
                  {sending ? '…' : 'Отправить'}
                </button>
                <button
                  onClick={() => setShowComplete(true)}
                  style={{
                    background: 'var(--amber)', color: '#000', border: 'none',
                    borderRadius: 'var(--r-sm)', padding: '10px 18px',
                    fontSize: '13px', fontWeight: 600, minHeight: '44px', cursor: 'pointer',
                  }}
                >
                  Завершить
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isDone && (
        <div style={{
          background: 'rgba(76,175,125,.1)', borderTop: '1px solid rgba(76,175,125,.3)',
          padding: '16px', textAlign: 'center', color: 'var(--green)',
          fontWeight: 600, fontSize: '14px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
        }}>
          <IconCheck size={14} /> Консультация завершена
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'transparent', border: '1px solid var(--green)',
              borderRadius: 'var(--r-sm)', padding: '6px 14px',
              color: 'var(--green)', fontSize: '13px', cursor: 'pointer',
            }}
          >
            <IconArrowLeft size={14} /> К списку
          </button>
        </div>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', marginBottom: '6px' }}>
        {label}
      </p>
      {children}
    </div>
  )
}
