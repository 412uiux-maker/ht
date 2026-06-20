import { useEffect, useRef, useState } from 'react'
import type { Vet, Message, Consultation } from '../api'
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

const STATUS_PILL: Record<string, { label: () => string; bg: string; color: string }> = {
  pending:   { label: () => t('chat.status_pending'),   bg: '#FFF3CD', color: '#856404' },
  active:    { label: () => t('chat.status_active'),    bg: '#D1F2E4', color: '#1A7A4A' },
  completed: { label: () => t('chat.status_completed'), bg: '#E8EDFF', color: '#3B5BDB' },
}

export default function Chat({ lang, consultationId, vet, onBack }: Props) {
  void lang
  const [messages, setMessages] = useState<Message[]>([])
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Ref to track current status without closure issues
  const consultRef = useRef<Consultation | null>(null)

  const fetchData = async () => {
    // Don't re-fetch if already completed
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
  const pill = STATUS_PILL[status] ?? STATUS_PILL.pending
  const isDone = status === 'completed'
  const petEmoji = consultation ? (SPECIES_EMOJI[consultation.pet_species] ?? '🐾') : '🐾'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Topbar */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ←
        </button>

        {/* Vet info */}
        <div style={{
          width: 40, height: 40, borderRadius: 'var(--r-md)',
          background: 'var(--surface-2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
        }}>
          {vet.avatar_emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {vet.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {vet.specialty}
          </div>
        </div>

        {/* Status + video */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {status === 'active' && (
            <a
              href={`http://localhost:8080/video.html?id=${consultationId}&role=client`}
              target="_blank"
              rel="noreferrer"
              title={t('chat.video')}
              style={{
                width: 40, height: 40, borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)', border: '1.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, textDecoration: 'none',
              }}
            >
              📹
            </a>
          )}
          <span style={{
            padding: '4px 10px', borderRadius: 'var(--r-pill)',
            fontSize: 11, fontWeight: 600,
            background: pill.bg, color: pill.color,
            whiteSpace: 'nowrap',
          }}>
            {pill.label()}
          </span>
        </div>
      </header>

      {/* Messages */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
            {t('loading')}
          </div>
        )}

        {/* Pending waiting state */}
        {!loading && status === 'pending' && messages.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '40px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{petEmoji}</div>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid var(--primary)', borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite', marginBottom: 16,
            }} />
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
              {t('chat.waiting')}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {t('chat.waiting_hint')}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender === 'client'
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--surface-2)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, marginRight: 8, flexShrink: 0, alignSelf: 'flex-end',
                }}>
                  {vet.avatar_emoji}
                </div>
              )}
              <div style={{ maxWidth: '72%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? 'var(--primary)' : 'var(--surface)',
                  color: isMe ? 'var(--on-primary)' : 'var(--text)',
                  border: isMe ? 'none' : '1px solid var(--border)',
                  fontSize: 14, lineHeight: 1.55,
                }}>
                  {msg.text}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--text-muted)', marginTop: 3,
                  textAlign: isMe ? 'right' : 'left',
                }}>
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}

        {/* Summary on completion */}
        {isDone && (
          <div style={{
            margin: '8px 0', padding: '14px 16px', borderRadius: 'var(--r-lg)',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
              📋 {t('chat.summary_title')}
            </div>
            {consultation?.summary ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {consultation.summary}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('chat.done')}</div>
            )}
            <button
              onClick={onBack}
              style={{
                marginTop: 14, padding: '10px 20px', borderRadius: 'var(--r-pill)',
                background: 'var(--primary)', color: 'var(--on-primary)',
                border: 'none', fontWeight: 600, fontSize: 14, minHeight: 44,
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              {t('chat.new_consult')}
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isDone && (
        <div style={{
          padding: '10px 14px', background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
        }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={sending}
            placeholder={t('chat.placeholder')}
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 'var(--r-lg)',
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              fontSize: 15, color: 'var(--text)', resize: 'none', outline: 'none',
              minHeight: 44, maxHeight: 120, fontFamily: 'inherit',
            }}
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            style={{
              width: 44, height: 44, borderRadius: 'var(--r-pill)', flexShrink: 0,
              background: !text.trim() || sending ? 'var(--border)' : 'var(--primary)',
              color: !text.trim() || sending ? 'var(--text-muted)' : 'var(--on-primary)',
              border: 'none', fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .15s', cursor: 'pointer',
            }}
          >
            ↑
          </button>
        </div>
      )}
    </div>
  )
}
