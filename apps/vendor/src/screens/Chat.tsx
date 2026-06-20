import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import type { VendorSession, Consultation, Message } from '../types'

const QUICK = [
  'Понял, изучаю вопрос',
  'Требуется осмотр в клинике',
  'Всё в порядке, дам рекомендации',
]

export default function Chat({
  consultId, session, onBack
}: {
  consultId: string
  session: VendorSession
  onBack: () => void
}) {
  const [consult, setConsult] = useState<Consultation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [summary, setSummary] = useState('')
  const [showComplete, setShowComplete] = useState(false)
  const [sending, setSending] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = () =>
    api.consultation(consultId).then(d => {
      setConsult(d.consultation)
      setMessages(d.messages)
    }).catch(() => {})

  useEffect(() => {
    load()
    const iv = setInterval(() => {
      if (consult?.status !== 'completed') load()
    }, 3000)
    return () => clearInterval(iv)
  }, [consultId, consult?.status])

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
          }}
        >
          ←
        </button>
        {consult && (
          <>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '15px' }}>
                {consult.pet_name} · {consult.client_name}
              </strong>
              <p style={{ fontSize: '12px', color: 'var(--text3)' }}>{consult.pet_species}</p>
            </div>
            <span className={`pill pill-${consult.status}`}>
              {consult.status === 'pending' ? 'Ожидает' : consult.status === 'active' ? 'Активна' : 'Завершена'}
            </span>
            {!isDone && (
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
        )}
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <p style={{ color: 'var(--text3)', textAlign: 'center', marginTop: '40px' }}>
            {consult ? `Жалоба: ${consult.problem}` : 'Загрузка…'}
          </p>
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

      {/* Input area */}
      {!isDone && (
        <div style={{
          background: 'var(--surface)', borderTop: '1px solid var(--surface3)',
          padding: '12px 16px', flexShrink: 0,
        }}>
          {/* Quick replies */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {QUICK.map(q => (
              <button
                key={q}
                onClick={() => setText(q)}
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--surface3)',
                  borderRadius: 'var(--r-sm)', padding: '6px 12px',
                  color: 'var(--text2)', fontSize: '12px', minHeight: '36px',
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
                  fontSize: '14px', resize: 'vertical', marginBottom: '8px',
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
                    fontSize: '14px', fontWeight: 600, minHeight: '44px',
                  }}
                >
                  {completing ? 'Сохраняем…' : 'Завершить'}
                </button>
                <button
                  onClick={() => setShowComplete(false)}
                  style={{
                    background: 'var(--surface3)', color: 'var(--text2)', border: 'none',
                    borderRadius: 'var(--r-sm)', padding: '10px 20px',
                    fontSize: '14px', minHeight: '44px',
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
                  fontSize: '14px', fontWeight: 600, minHeight: '44px',
                  opacity: !text.trim() ? 0.5 : 1,
                }}
              >
                {sending ? '…' : 'Отправить'}
              </button>
              {consult?.status === 'active' && !showComplete && (
                <button
                  onClick={() => setShowComplete(true)}
                  style={{
                    background: 'var(--amber)', color: '#000', border: 'none',
                    borderRadius: 'var(--r-sm)', padding: '10px 18px',
                    fontSize: '13px', fontWeight: 600, minHeight: '44px',
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
        }}>
          ✓ Консультация завершена
        </div>
      )}
    </div>
  )
}
