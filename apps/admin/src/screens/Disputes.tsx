import { useState, useEffect, useCallback } from 'react'
import { IconAlertCircle, IconCheckCircle, IconClose } from '@ht/shared'
import type { AdminDispute } from '../types'
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
  return new Date(dt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Disputes() {
  const [filter, setFilter] = useState<StatusFilter>('open')
  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [resolving, setResolving] = useState<number | null>(null)

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

  const resolve = async (id: number, status: 'resolved' | 'closed') => {
    setResolving(id)
    try {
      const updated = await adminApi.resolveDispute(id, status)
      setDisputes(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d))
      setExpanded(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setResolving(null)
    }
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
            onClick={() => setFilter(s)}
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

      {error && !loading && (
        <div className="error-banner">{error}</div>
      )}

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
              <div
                key={d.id}
                className="card"
                style={{ padding: 0, overflow: 'hidden' }}
              >
                {/* Row */}
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
                    {/* Client + pet */}
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
                    {/* Reason preview */}
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
                  </div>
                </button>

                {/* Expanded: actions */}
                {isOpen && d.status === 'open' && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '14px 20px',
                    display: 'flex', gap: 10, justifyContent: 'flex-end',
                  }}>
                    <button
                      disabled={resolving === d.id}
                      onClick={() => resolve(d.id, 'closed')}
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
                      disabled={resolving === d.id}
                      onClick={() => resolve(d.id, 'resolved')}
                      style={{
                        padding: '8px 16px', borderRadius: 'var(--r-sm)',
                        border: 'none', background: 'var(--success)',
                        color: '#fff', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <IconCheckCircle size={14} color="#fff" />
                      {resolving === d.id ? 'Обрабатываем…' : 'Отметить решённой'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
