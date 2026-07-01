import React, { useState, useRef, useEffect, useCallback } from 'react'
import { IconArrowLeft } from '@ht/shared'
import { t, getLang } from '../i18n'
import { api, getOwnerId } from '../api'
import type { Pet } from '../api'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Msg {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  error?: boolean
}

interface Props {
  initialPet?: Pet
  initialMessage?: string   // pre-fill from SymptomChecker context
  onBack: () => void
  onBookVet?: (context: string) => void
}

// ── Species ───────────────────────────────────────────────────────────────────
const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾',
}

// ── Suggested starter questions ───────────────────────────────────────────────
const SUGGESTED_KEYS = ['ai.q1', 'ai.q2', 'ai.q3', 'ai.q4'] as const

// ── Component ─────────────────────────────────────────────────────────────────
export default function AiVetChat({ initialPet, initialMessage, onBack, onBookVet }: Props) {
  const isRu = getLang() !== 'uz'

  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(initialPet ?? null)
  const [showPetPicker, setShowPetPicker] = useState(false)

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [suggestBooking, setSuggestBooking] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Load pets for selector
  useEffect(() => {
    api.pets(getOwnerId()).then(list => {
      setPets(list)
      if (!selectedPet && list.length === 1) setSelectedPet(list[0])
    }).catch(() => {})
  }, [])

  // Auto-send initialMessage (from SymptomChecker)
  useEffect(() => {
    if (initialMessage) {
      setTimeout(() => sendMessage(initialMessage), 100)
    }
  }, []) // eslint-disable-line

  // Scroll to bottom whenever messages change
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const appendChunk = useCallback((text: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (!last || last.role !== 'assistant') return prev
      return [
        ...prev.slice(0, -1),
        { ...last, content: last.content + text, streaming: true },
      ]
    })
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    const userText = text.trim()
    if (!userText || streaming) return

    setInput('')
    setSuggestBooking(false)

    // Build history from current messages snapshot (before state update)
    const history: { role: 'user' | 'assistant'; content: string }[] = [
      ...messages
        .filter(m => m.content && !m.error)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: userText },
    ]

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userText },
      { role: 'assistant', content: '', streaming: true },
    ])
    setStreaming(true)

    abortRef.current = new AbortController()

    try {
      const resp = await api.aiChat(history, selectedPet, getLang())

      if (!resp.ok) {
        const isConfig = resp.status === 503
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: t(isConfig ? 'ai.error_cfg' : 'ai.error'), error: true },
        ])
        setStreaming(false)
        return
      }

      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) {
              appendChunk(data.text)
            }
            if (data.done) {
              setSuggestBooking(!!data.suggest_booking)
              setMessages(prev => {
                const last = prev[prev.length - 1]
                if (last?.role === 'assistant') {
                  return [...prev.slice(0, -1), { ...last, streaming: false }]
                }
                return prev
              })
              setStreaming(false)
            }
            if (data.error) {
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: t('ai.error'), error: true },
              ])
              setStreaming(false)
            }
          } catch { /* malformed SSE line */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: t('ai.error'), error: true },
      ])
      setStreaming(false)
    }
  }, [streaming, selectedPet, appendChunk, messages])

  const handleSend = () => sendMessage(input)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleBookVet = () => {
    if (!onBookVet) return
    // Build context summary from last 3 exchanges
    const summary = messages
      .filter(m => m.content && !m.error)
      .slice(-6)
      .map(m => `${m.role === 'user' ? (isRu ? 'Владелец' : 'Egasi') : 'AI'}: ${m.content.replace(/\[SUGGEST_BOOKING\]/g, '').trim()}`)
      .join('\n')
    onBookVet(summary)
  }

  const resetChat = () => {
    abortRef.current?.abort()
    setMessages([])
    setInput('')
    setStreaming(false)
    setSuggestBooking(false)
    inputRef.current?.focus()
  }

  const isEmpty = messages.length === 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: 'var(--bg)', position: 'relative',
    }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          aria-label={isRu ? 'Назад' : 'Orqaga'}
          style={{
            width: 40, height: 40, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <IconArrowLeft size={17} />
        </button>

        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg,#F2784B,#7C82E8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          🤖
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>
            {t('ai.title')}
          </div>
          <div style={{ fontSize: 12, color: '#7C82E8', fontWeight: 600 }}>
            {streaming ? t('ai.typing') : (isRu ? 'Онлайн' : 'Onlayn')}
          </div>
        </div>

        {/* Pet selector chip */}
        <button
          onClick={() => setShowPetPicker(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 'var(--r-pill)',
            border: '1.5px solid var(--border)',
            background: selectedPet ? 'rgba(124,130,232,.10)' : 'transparent',
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
            color: selectedPet ? '#7C82E8' : 'var(--text-muted)',
            fontFamily: 'inherit', flexShrink: 0,
          }}
        >
          {selectedPet
            ? <>{SPECIES_EMOJI[selectedPet.species] || '🐾'} {selectedPet.name}</>
            : <>{isRu ? 'Питомец' : 'Hayvon'} ▾</>
          }
        </button>

        {/* New chat */}
        {messages.length > 0 && (
          <button
            onClick={resetChat}
            title={t('ai.new_chat')}
            style={{
              width: 36, height: 36, borderRadius: 'var(--r-md)',
              border: '1.5px solid var(--border)', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16, flexShrink: 0,
            }}
          >
            ✏️
          </button>
        )}
      </header>

      {/* ── Pet picker dropdown ────────────────────────────────── */}
      {showPetPicker && (
        <div style={{
          position: 'absolute', top: 68, right: 12, zIndex: 50,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          minWidth: 180, overflow: 'hidden',
        }}>
          <button
            onClick={() => { setSelectedPet(null); setShowPetPicker(false) }}
            style={pickerItemStyle(selectedPet === null)}
          >
            🐾 {t('ai.no_pet')}
          </button>
          {pets.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedPet(p); setShowPetPicker(false) }}
              style={pickerItemStyle(selectedPet?.id === p.id)}
            >
              {SPECIES_EMOJI[p.species] || '🐾'} {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Tap-outside to close pet picker */}
      {showPetPicker && (
        <div
          onClick={() => setShowPetPicker(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 49 }}
        />
      )}

      {/* ── Message list ──────────────────────────────────────── */}
      <div
        ref={listRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '16px 14px',
          display: 'flex', flexDirection: 'column', gap: 10,
          paddingBottom: suggestBooking ? 0 : 16,
        }}
      >
        {/* Welcome / empty state */}
        {isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24, gap: 20 }}>
            {/* AI avatar large */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg,#F2784B,#7C82E8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40,
              boxShadow: '0 4px 20px rgba(124,130,232,.3)',
            }}>
              🤖
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 6 }}>
                {t('ai.title')}
              </div>
              <div style={{
                fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                maxWidth: 260, margin: '0 auto',
              }}>
                {t('ai.subtitle')}
              </div>
            </div>

            {/* Welcome bubble */}
            <AiBubble text={t('ai.welcome')} />

            {/* Starter chips */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
              padding: '0 8px',
            }}>
              {SUGGESTED_KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => sendMessage(t(k))}
                  style={{
                    padding: '8px 14px', borderRadius: 'var(--r-pill)',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)',
                    fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                    fontWeight: 500, lineHeight: 1.4, textAlign: 'left',
                  }}
                >
                  {t(k)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          msg.role === 'user'
            ? <UserBubble key={i} text={msg.content} />
            : <AiBubble key={i} text={msg.content} streaming={msg.streaming} error={msg.error} />
        ))}

        {/* Disclaimer — after first AI message */}
        {messages.some(m => m.role === 'assistant' && m.content) && (
          <div style={{
            textAlign: 'center', fontSize: 11, color: 'var(--text-muted)',
            padding: '4px 16px', lineHeight: 1.5,
          }}>
            ⚠️ {t('ai.disclaimer')}
          </div>
        )}
      </div>

      {/* ── Book vet CTA ──────────────────────────────────────── */}
      {suggestBooking && onBookVet && (
        <div style={{
          margin: '0 14px 12px',
          background: 'linear-gradient(135deg,rgba(242,120,75,.08),rgba(124,130,232,.08))',
          border: '1.5px solid rgba(124,130,232,.3)',
          borderRadius: 'var(--r-lg)', padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
              🩺 {t('ai.book_cta')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {t('ai.book_sub')}
            </div>
          </div>
          <button
            onClick={handleBookVet}
            style={{
              padding: '10px 16px', borderRadius: 'var(--r-pill)',
              background: 'var(--primary)', color: '#fff',
              border: 'none', fontWeight: 700, fontSize: 13,
              fontFamily: 'inherit', cursor: 'pointer', minHeight: 44,
              flexShrink: 0, whiteSpace: 'nowrap',
            }}
          >
            {isRu ? 'Записаться' : 'Yozilish'}
          </button>
        </div>
      )}

      {/* ── Input bar ─────────────────────────────────────────── */}
      <div style={{
        padding: '10px 12px 16px',
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => {
            setInput(e.target.value)
            // Auto-grow
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('ai.placeholder')}
          disabled={streaming}
          style={{
            flex: 1, resize: 'none', overflow: 'hidden',
            padding: '10px 12px', borderRadius: 'var(--r-lg)',
            border: '1.5px solid var(--border)',
            background: 'var(--bg)', color: 'var(--text)',
            fontSize: 14, fontFamily: 'inherit', lineHeight: 1.5,
            outline: 'none', minHeight: 44,
            opacity: streaming ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || streaming}
          aria-label={t('ai.send')}
          style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: input.trim() && !streaming
              ? 'linear-gradient(135deg,#F2784B,#7C82E8)'
              : 'var(--border)',
            border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, transition: 'background .15s',
          }}
        >
          {streaming
            ? <SpinnerDots />
            : <span style={{ color: input.trim() ? '#fff' : 'var(--text-muted)' }}>↑</span>
          }
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '80%', padding: '10px 14px',
        borderRadius: '18px 18px 4px 18px',
        background: 'linear-gradient(135deg,#F2784B,#F0633A)',
        color: '#fff', fontSize: 14, lineHeight: 1.55,
        wordBreak: 'break-word', whiteSpace: 'pre-wrap',
      }}>
        {text}
      </div>
    </div>
  )
}

function AiBubble({ text, streaming, error }: { text: string; streaming?: boolean; error?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      {/* AI avatar small */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg,#F2784B,#7C82E8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15,
      }}>
        🤖
      </div>
      <div style={{
        maxWidth: '80%', padding: '10px 14px',
        borderRadius: '18px 18px 18px 4px',
        background: error ? 'rgba(217,83,74,.08)' : 'var(--surface)',
        border: `1px solid ${error ? 'rgba(217,83,74,.2)' : 'var(--border)'}`,
        color: error ? 'var(--danger)' : 'var(--text)',
        fontSize: 14, lineHeight: 1.55,
        wordBreak: 'break-word', whiteSpace: 'pre-wrap',
      }}>
        {text || (streaming ? <TypingDots /> : null)}
        {streaming && text && <span style={{
          display: 'inline-block', width: 8, height: 14,
          background: '#7C82E8', borderRadius: 2, marginLeft: 2,
          verticalAlign: 'text-bottom',
          animation: 'ht-blink .7s step-end infinite',
        }} />}
      </div>
      <style>{`
        @keyframes ht-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes ht-dot { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  )
}

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#7C82E8',
          animation: `ht-dot 1.2s ease-in-out ${i * .2}s infinite`,
          display: 'inline-block',
        }} />
      ))}
    </span>
  )
}

function SpinnerDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)',
          animation: `ht-dot 1s ease-in-out ${i * .15}s infinite`,
          display: 'inline-block',
        }} />
      ))}
    </span>
  )
}

function pickerItemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '10px 14px', textAlign: 'left',
    background: active ? 'rgba(124,130,232,.10)' : 'transparent',
    color: active ? '#7C82E8' : 'var(--text)',
    border: 'none', fontFamily: 'inherit', fontSize: 14,
    fontWeight: active ? 700 : 400, cursor: 'pointer', minHeight: 44,
  }
}
