import { useEffect, useRef, useState } from 'react'
import { api, Message, Consultation } from '../api'
import { t } from '../i18n'

interface Props {
  lang: string
  consultationId: string
  vetName: string
  onBack: () => void
}

const STATUS_PILL: Record<string, { label: () => string; bg: string; color: string }> = {
  pending:   { label: () => t('chat.status_pending'),   bg: '#FFF3CD', color: '#856404' },
  active:    { label: () => t('chat.status_active'),    bg: '#D1F2E4', color: '#1A7A4A' },
  completed: { label: () => t('chat.status_completed'), bg: '#E8EDFF', color: '#3B5BDB' },
}

export default function Chat({ lang, consultationId, vetName, onBack }: Props) {
  void lang
  const [messages, setMessages] = useState<Message[]>([])
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    try {
      const data = await api.getConsultation(consultationId)
      setConsultation(data.consultation)
      setMessages(data.messages)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(() => {
      if (consultation?.status !== 'completed') fetchData()
    }, 3000)
    return () => clearInterval(id)
  }, [consultationId, consultation?.status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const txt = text.trim()
    if (!txt || sending) return
    setSending(true)
    setText('')
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

  const status = consultation?.status || 'pending'
  const pill = STATUS_PILL[status] || STATUS_PILL.pending
  const isDone = status === 'completed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Topbar */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
            background: 'transparent', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{vetName}</div>
        </div>
        <span style={{
          padding: '4px 12px', borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 600,
          background: pill.bg, color: pill.color,
        }}>
          {pill.label()}
        </span>
      </header>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>{t('loading')}</div>
        )}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 16px', fontSize: 14 }}>
            {t('chat.waiting')}
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender === 'client'
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, textAlign: isMe ? 'right' : 'left' }}>
                  {isMe ? t('chat.you') : t('chat.vet')}
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? 'var(--primary)' : 'var(--surface)',
                  color: isMe ? 'var(--on-primary)' : 'var(--text)',
                  border: isMe ? 'none' : '1px solid var(--border)',
                  fontSize: 14, lineHeight: 1.5,
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        {isDone && consultation?.summary && (
          <div style={{
            margin: '8px 0', padding: '12px 14px', borderRadius: 'var(--r-md)',
            background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>📋 {t('chat.done')}</div>
            <div style={{ color: 'var(--text-muted)' }}>{consultation.summary}</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
      }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isDone || sending}
          placeholder={isDone ? t('chat.done') : t('chat.placeholder')}
          rows={1}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 'var(--r-lg)',
            border: '1.5px solid var(--border)', background: isDone ? 'var(--bg)' : 'var(--surface)',
            fontSize: 15, color: 'var(--text)', resize: 'none', outline: 'none',
            minHeight: 44, maxHeight: 120,
          }}
        />
        <button
          onClick={send}
          disabled={isDone || !text.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: 'var(--r-pill)',
            background: !text.trim() || isDone ? 'var(--border)' : 'var(--primary)',
            color: !text.trim() || isDone ? 'var(--text-muted)' : 'var(--on-primary)',
            border: 'none', fontSize: 18, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .15s',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
