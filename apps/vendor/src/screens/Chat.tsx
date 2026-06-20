import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import type { VendorSession, Consultation, Message } from '../types'

const QUICK = [
  'Понял, изучаю вопрос',
  'Требуется осмотр в клинике',
  'Всё в порядке, дам рекомендации',
  'Пришлите фото симптомов',
]

const SPECIES: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾'
}

export default function Chat({
  consultId, session, onBack
}: {
  consultId: string
  session: VendorSession
  onBack: () => void
}) {
  void session
  const [consult, setConsult] = useState<Consultation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [summary, setSummary] = useState('')
  const [showComplete, setShowComplete] = useState(false)
  const [sending, setSending] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
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

  const complete = async () => {
    if (!summary.trim() || completing) return
    setCompleting(true)
    setError('')
    try {
      await api.complete(consultId, summary)
      setShowComplete(false)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setCompleting(false)
    }
  }

  const isDone = consult?.status === 'completed'
  const isPending = consult?.status === 'pending'

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
            cursor: 'pointer',
          }}
        >
          ←
        </button>
        {consult ? (
          <>
            <span style={{ fontSize: '24px' }}>{SPECIES[consult.pet_species] ?? '🐾'}</span>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '15px' }}>
                {consult.pet_name} · {consult.client_name}
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text3)' }}>
                {consult.pet_species}
              </p>
            </div>
            <span className={`pill pill-${consult.status}`}>
              {consult.status === 'pending' ? 'Ожидает' : consult.status === 'active' ? 'Активна' : 'Завершена'}
            </span>
            {!isDone && !isPending && (
              <a
                href={`http://localhost:8080/video.html?id=${consultId}&role=vet`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'var(--violet)', color: '#fff', borderRadius: 'var(--r-sm)',
                  padding: '8px 14px', fontSize: '14px', textDecoration: 'none',
                  minHeight: '44px', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                📹 Видео
              </a>
            )}
          </>
        ) : (
          <span style={{ color: 'var(--text3)' }}>Загрузка…</span>
        )}
      </header>

      {/* Accept banner — shown only when pending */}
      {isPending && consult && (
        <div style={{
          background: 'rgba(245,166,35,.08)', borderBottom: '1px solid rgba(245,166,35,.25)',
          padding: '16px 20px', flexShrink: 0,
        }}>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '12px', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--amber)' }}>Жалоба:</strong> {consult.problem}
          </p>
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '8px' }}>{error}</p>
          )}
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
            {accepting ? 'Принимаем…' : '✓ Принять консультацию'}
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!isPending && messages.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', flex: 1, gap: '12px',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid var(--coral)', borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }} />
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
        {isDone && consult?.summary && (
          <div style={{
            background: 'rgba(76,175,125,.1)', border: '1px solid rgba(76,175,125,.3)',
            borderRadius: 'var(--r-md)', padding: '14px 18px', marginTop: '8px',
          }}>
            <p style={{ color: 'var(--green)', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>
              ✓ Заключение врача
            </p>
            <p style={{ color: 'var(--text2)', fontSize: '14px' }}>{consult.summary}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area — only when active */}
      {!isDone && !isPending && (
        <div style={{
          background: 'var(--surface)', borderTop: '1px solid var(--surface3)',
          padding: '12px 16px', flexShrink: 0,
        }}>
          {/* Quick replies */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {QUICK.map(q => (
              <button
                key={q}
                onClick={() => setText(q)}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--surface3)',
                  borderRadius: 'var(--r-sm)', padding: '6px 10px',
                  color: 'var(--text2)', fontSize: '12px', minHeight: '34px',
                  cursor: 'pointer',
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Complete form */}
          {showComplete && (
            <div style={{
              background: 'var(--surface2)', borderRadius: 'var(--r-md)', padding: '14px',
              marginBottom: '10px',
            }}>
              <p style={{ color: 'var(--amber)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Заключение консультации
              </p>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Напишите заключение для клиента…"
                rows={3}
                style={{
                  width: '100%', background: 'var(--surface3)', border: '1px solid var(--surface3)',
                  borderRadius: 'var(--r-sm)', padding: '10px 12px', color: 'var(--text)',
                  fontSize: '14px', resize: 'vertical', marginBottom: '8px', boxSizing: 'border-box',
                }}
              />
              {error && <p style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '8px' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={complete}
                  disabled={completing}
                  style={{
                    background: 'var(--green)', color: '#fff', border: 'none',
                    borderRadius: 'var(--r-sm)', padding: '10px 20px',
                    fontSize: '14px', fontWeight: 600, minHeight: '44px', cursor: 'pointer',
                  }}
                >
                  {completing ? 'Сохраняем…' : 'Завершить'}
                </button>
                <button
                  onClick={() => setShowComplete(false)}
                  style={{
                    background: 'var(--surface3)', color: 'var(--text2)', border: 'none',
                    borderRadius: 'var(--r-sm)', padding: '10px 20px',
                    fontSize: '14px', minHeight: '44px', cursor: 'pointer',
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Text + send */}
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
                fontSize: '14px', resize: 'none',
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
              {!showComplete && (
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
              )}
            </div>
          </div>
        </div>
      )}

      {isDone && (
        <div style={{
          background: 'rgba(76,175,125,.1)', borderTop: '1px solid rgba(76,175,125,.3)',
          padding: '16px', textAlign: 'center', color: 'var(--green)',
          fontWeight: 600, fontSize: '14px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
        }}>
          ✓ Консультация завершена
          <button
            onClick={onBack}
            style={{
              background: 'transparent', border: '1px solid var(--green)',
              borderRadius: 'var(--r-sm)', padding: '6px 14px',
              color: 'var(--green)', fontSize: '13px', cursor: 'pointer',
            }}
          >
            ← К списку
          </button>
        </div>
      )}
    </div>
  )
}
