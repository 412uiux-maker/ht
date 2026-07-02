import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import type { VendorOrder } from '../types'

const STATUS_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  created:     { bg: 'rgba(100,116,139,.12)', color: '#64748b', label: 'Создан'     },
  paid:        { bg: 'rgba(59,130,246,.12)',  color: '#2563eb', label: 'Оплачен'    },
  accepted:    { bg: 'rgba(245,158,11,.12)',  color: '#d97706', label: 'Принят'     },
  in_progress: { bg: 'rgba(139,92,246,.12)',  color: '#7c3aed', label: 'В работе'   },
  completed:   { bg: 'rgba(34,197,94,.12)',   color: '#16a34a', label: 'Завершён'   },
  reviewed:    { bg: 'rgba(34,197,94,.12)',   color: '#16a34a', label: 'С отзывом'  },
  rejected:    { bg: 'rgba(239,68,68,.12)',   color: '#ef4444', label: 'Отклонён'   },
  cancelled:   { bg: 'rgba(100,116,139,.12)', color: '#64748b', label: 'Отменён'    },
  refunded:    { bg: 'rgba(239,68,68,.12)',   color: '#ef4444', label: 'Возвращён'  },
}

const STATUS_FILTERS = ['all', 'active', 'completed', 'cancelled'] as const
type StatusFilter = typeof STATUS_FILTERS[number]

const ACTIVE_SET = new Set(['paid', 'accepted', 'in_progress'])
const DONE_SET   = new Set(['completed', 'reviewed'])
const CANCEL_SET = new Set(['rejected', 'cancelled', 'refunded'])

const SPECIES: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', other: '🐾',
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtMoney(n: number | null) {
  if (!n) return '—'
  return n.toLocaleString('ru-RU') + ' сум'
}

function payout(o: VendorOrder) {
  if (o.payout_amount) return o.payout_amount
  const rate = o.commission_rate ?? 0.15
  return Math.round((o.price_uzs ?? 0) * (1 - rate))
}

export default function Orders({ onOpenChat }: { onOpenChat?: (id: string) => void }) {
  const [orders, setOrders]   = useState<VendorOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [filter, setFilter]   = useState<StatusFilter>('all')
  const [search, setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await api.orders()
      setOrders(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const visible = orders.filter(o => {
    const matchFilter = filter === 'all'
      || (filter === 'active'    && ACTIVE_SET.has(o.status))
      || (filter === 'completed' && DONE_SET.has(o.status))
      || (filter === 'cancelled' && CANCEL_SET.has(o.status))
    const q = search.toLowerCase()
    const matchSearch = !q
      || (o.client_name ?? '').toLowerCase().includes(q)
      || (o.pet_name ?? '').toLowerCase().includes(q)
      || (o.problem ?? '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  // Summary stats
  const totalRevenue = orders
    .filter(o => DONE_SET.has(o.status))
    .reduce((s, o) => s + payout(o), 0)
  const activeCount = orders.filter(o => ACTIVE_SET.has(o.status)).length

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Заказы</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {orders.length} всего · {activeCount} в работе · {fmtMoney(totalRevenue)} заработано
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по клиенту, питомцу, проблеме…"
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)',
          border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13,
          background: 'var(--surface)', color: 'var(--text)', marginBottom: 12,
          boxSizing: 'border-box',
        }}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 12px', borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 600,
              border: '1px solid var(--border)',
              background: filter === f ? 'var(--primary)' : 'var(--surface)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {{ all: 'Все', active: 'Активные', completed: 'Завершённые', cancelled: 'Отменённые' }[f]}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>Загрузка…</div>
      )}
      {error && !loading && <div className="error-banner">{error}</div>}

      {!loading && visible.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '64px 0', fontSize: 14 }}>
          {search ? 'Ничего не найдено' : 'Заказов нет'}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(o => {
            const chip = STATUS_CHIP[o.status] ?? STATUS_CHIP.created
            const isOpen = expanded === o.id
            return (
              <div key={o.id} style={{
                background: 'var(--surface)', borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)', overflow: 'hidden',
              }}>
                {/* Summary row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}
                >
                  <div style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, paddingTop: 2 }}>
                    {SPECIES[o.pet_species ?? ''] ?? '🐾'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{o.client_name ?? '—'}</span>
                      {o.pet_name && (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{o.pet_name}</span>
                      )}
                    </div>
                    {o.problem && (
                      <div style={{
                        fontSize: 12, color: 'var(--text2)', lineHeight: 1.4,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: isOpen ? 99 : 1, WebkitBoxOrient: 'vertical' as const,
                      }}>
                        {o.problem}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {fmtDate(o.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: chip.bg, color: chip.color, whiteSpace: 'nowrap',
                    }}>
                      {chip.label}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                      {fmtMoney(o.price_uzs)}
                    </span>
                  </div>
                </button>

                {/* Expanded details */}
                {isOpen && (
                  <div style={{
                    borderTop: '1px solid var(--border)', padding: '12px 16px',
                    background: 'var(--bg2, #F9F7F5)',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
                      <span><b>Выплата:</b> {fmtMoney(payout(o))}</span>
                      <span><b>Комиссия:</b> {Math.round((o.commission_rate ?? 0.15) * 100)}%</span>
                      {o.scheduled_at && <span><b>Слот:</b> {fmtDate(o.scheduled_at)}</span>}
                      <span><b>ID:</b> <code style={{ fontSize: 11 }}>{o.id.slice(0, 8)}…</code></span>
                    </div>
                    {o.summary && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                        <b>Итог:</b> {o.summary}
                      </div>
                    )}
                    {o.rejected_reason && (
                      <div style={{ fontSize: 12, color: '#ef4444' }}>
                        <b>Причина отклонения:</b> {o.rejected_reason}
                      </div>
                    )}
                    {o.consultation_id && onOpenChat && ACTIVE_SET.has(o.status) && (
                      <button
                        onClick={() => onOpenChat(o.consultation_id!)}
                        style={{
                          alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 'var(--r-sm)',
                          border: 'none', background: 'var(--primary)', color: '#fff',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Открыть чат
                      </button>
                    )}
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
