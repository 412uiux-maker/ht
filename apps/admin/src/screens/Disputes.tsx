import { useState, useEffect, useCallback, useRef } from 'react'
import { IconAlertCircle, IconCheckCircle, IconClose } from '@ht/shared'
import type { AdminDispute, DisputeMessage } from '../types'
import { adminApi } from '../api'

const STATUS_FILTERS = ['open', 'resolved', 'closed', 'all'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

const STATUS_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  open:     { bg: 'rgba(239,68,68,.12)',   color: '#ef4444', label: 'Открыта'   },
  resolved: { bg: 'rgba(34,197,94,.12)',   color: '#16a34a', label: 'Решена'    },
  closed:   { bg: 'rgba(100,116,139,.12)', color: '#64748b', label: 'Закрыта'   },
}

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', other: '🐾',
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtTime(dt: string) {
  return new Date(dt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

// ── Expanded panel with thread ────────────────────────────────────────────────
function DisputePanel({
  dispute,
  onUpdate,
}: {
  dispute: AdminDispute
  onUpdate: (d: AdminDispute) => void
}) {
  const [messages, setMessages]     = useState<DisputeMessage[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(true)
  const [msgText, setMsgText]       = useState('')
  const [sending, setSending]       = useState(false)
  const [resolution, setResolution] = useState('')
  const [resolving, setResolving]   = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingMsgs(true)
    adminApi.getDispute(dispute.id)
      .then(data => { if (!cancelled) setMessages(data.messages) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingMsgs(false) })
    return () => { cancelled = true }
  }, [dispute.id])

  useEffect(() => {
    if (!loadingMsgs && threadRef.current)
      threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [messages, loadingMsgs])

  const sendMsg = async () => {
    const text = msgText.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const msg = await adminApi.sendDisputeMessage(dispute.id, text)
      setMessages(prev => [...prev, msg])
      setMsgText('')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  const resolve = async (status: 'resolved' | 'closed') => {
    setResolving(true)
    try {
      const updated = await adminApi.resolveDispute(dispute.id, status, resolution || undefined)
      onUpdate(updated)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setResolving(false)
    }
  }

  const isOpen = dispute.status === 'open'

  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      {/* Detail row */}
      <div style={{
        padding: '14px 20px 12px',
        display: 'flex', gap: 24, flexWrap: 'wrap',
        background: 'var(--bg2, #F9F7F5)',
        fontSize: 13, color: 'var(--text2)',
        borderBottom: '1px solid var(--border)',
      }}>
        {dispute.consultation_id && (
          <span><b>Консультация:</b> #{dispute.consultation_id.slice(0, 8)}…</span>
        )}
        {dispute.vet_name && <span><b>Ветеринар:</b> {dispute.vet_name}</span>}
        {dispute.problem && <span style={{ flex: 1 }}><b>Жалоба клиента:</b> {dispute.problem}</span>}
        {dispute.resolved_by && (
          <span><b>Решил:</b> {dispute.resolved_by}{dispute.resolved_at ? ' · ' + fmtDate(dispute.resolved_at) : ''}</span>
        )}
      </div>

      {/* Thread */}
      <div
        ref={threadRef}
        style={{
          maxHeight: 280, overflowY: 'auto', padding: '14px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}
      >
        {loadingMsgs && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
            Загрузка переписки…
          </div>
        )}
        {!loadingMsgs && messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>
            Переписки нет — напишите первое сообщение
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: m.sender === 'admin' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '80%',
              background: m.sender === 'admin'
                ? 'var(--primary, #E8911A)'
                : 'var(--surface, #fff)',
              color: m.sender === 'admin' ? '#fff' : 'var(--text)',
              border: m.sender === 'system' ? '1px solid var(--border)' : 'none',
              borderRadius: m.sender === 'admin'
                ? '14px 14px 4px 14px'
                : '14px 14px 14px 4px',
              padding: '8px 12px',
              fontSize: 13, lineHeight: 1.5,
            }}>
              {m.sender === 'system' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>
                  🔔 {m.sender_name ?? 'Система'}
                </div>
              )}
              {m.text}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, padding: '0 4px' }}>
              {m.sender === 'admin' ? (m.sender_name ?? 'Поддержка') : ''} {fmtTime(m.created_at)}
            </div>
          </div>
        ))}
      </div>

      {/* Message input (always visible for reference, disabled when closed) */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 10 }}>
        <textarea
          value={msgText}
          onChange={e => setMsgText(e.target.value)}
          placeholder={isOpen ? 'Напишите клиенту…' : 'Тикет закрыт'}
          disabled={!isOpen || sending}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
          }}
          style={{
            flex: 1, resize: 'none', minHeight: 60, padding: '10px 12px',
            border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
            fontFamily: 'inherit', fontSize: 13, background: isOpen ? 'var(--surface)' : 'var(--bg2)',
            color: 'var(--text)', outline: 'none',
          }}
        />
        <button
          onClick={sendMsg}
          disabled={!isOpen || !msgText.trim() || sending}
          style={{
            padding: '0 18px', borderRadius: 'var(--r-sm)', border: 'none',
            background: msgText.trim() && isOpen ? 'var(--primary, #E8911A)' : 'var(--border)',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', alignSelf: 'flex-end', height: 44,
            transition: 'background .15s',
          }}
        >
          {sending ? '…' : '↑'}
        </button>
      </div>

      {/* Resolve actions (only for open tickets) */}
      {isOpen && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <textarea
            value={resolution}
            onChange={e => setResolution(e.target.value)}
            placeholder="Текст решения (необязательно) — появится в тикете как системная запись"
            style={{
              resize: 'none', minHeight: 52, padding: '8px 12px',
              border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              fontFamily: 'inherit', fontSize: 13,
              background: 'var(--surface)', color: 'var(--text)', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              disabled={resolving}
              onClick={() => resolve('closed')}
              style={{
                padding: '8px 16px', borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <IconClose size={14} /> Закрыть без решения
            </button>
            <button
              disabled={resolving}
              onClick={() => resolve('resolved')}
              style={{
                padding: '8px 18px', borderRadius: 'var(--r-sm)',
                border: 'none', background: 'var(--success, #2BB673)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <IconCheckCircle size={14} color="#fff" />
              {resolving ? 'Обрабатываем…' : 'Отметить решённой'}
            </button>
          </div>
        </div>
      )}

      {/* Show resolution text if already resolved */}
      {!isOpen && dispute.resolution && (
        <div style={{
          margin: '0 20px 14px',
          padding: '10px 14px', borderRadius: 'var(--r-sm)',
          background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)',
          fontSize: 13, color: 'var(--text)',
        }}>
          <span style={{ fontWeight: 600, color: '#16a34a' }}>Решение: </span>
          {dispute.resolution}
        </div>
      )}
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Disputes() {
  const [filter, setFilter] = useState<StatusFilter>('open')
  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getDisputes(filter)
      setDisputes(data.disputes)
      setTotal(data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleUpdate = (updated: AdminDispute) => {
    setDisputes(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d))
    setExpanded(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Жалобы</h1>
          {!loading && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{total} записей</div>}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setExpanded(null) }}
            style={{
              padding: '6px 14px', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 600,
              border: '1px solid var(--border)',
              background: filter === s ? 'var(--primary)' : 'var(--surface)',
              color: filter === s ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {{ open: 'Открытые', resolved: 'Решённые', closed: 'Закрытые', all: 'Все' }[s]}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '48px 0', textAlign: 'center' }}>
          Загрузка…
        </div>
      )}

      {error && !loading && <div className="error-banner">{error}</div>}

      {!loading && !error && disputes.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '64px 0' }}>
          <IconCheckCircle size={40} color="var(--success)" />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Жалоб нет</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {filter === 'open' ? 'Все жалобы обработаны' : 'Нет записей в этом разделе'}
          </div>
        </div>
      )}

      {!loading && disputes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {disputes.map(d => {
            const chip = STATUS_CHIP[d.status] ?? STATUS_CHIP.open
            const isOpen = expanded === d.id
            return (
              <div key={d.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Summary row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : d.id)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    padding: '16px 20px', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                  }}
                >
                  <IconAlertCircle size={20} color={chip.color} style={{ flexShrink: 0, marginTop: 2 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {d.client_name ?? d.owner_id}
                      </span>
                      {d.pet_name && (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {SPECIES_EMOJI[d.pet_species ?? ''] ?? '🐾'} {d.pet_name}
                        </span>
                      )}
                      {d.vet_name && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          · {d.vet_name}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 13, color: 'var(--text)', lineHeight: 1.5,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: isOpen ? 99 : 2, WebkitBoxOrient: 'vertical' as const,
                    }}>
                      {d.reason}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                      background: chip.bg, color: chip.color,
                    }}>
                      {chip.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {fmtDate(d.created_at)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {/* Expanded panel */}
                {isOpen && (
                  <DisputePanel dispute={d} onUpdate={handleUpdate} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
