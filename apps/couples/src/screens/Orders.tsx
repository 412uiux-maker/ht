import { useEffect, useState } from 'react'
import type { Order } from '../api'
import { api, getOwnerId } from '../api'
import { t } from '../i18n'

type Filter = 'all' | 'active' | 'done'

const ACTIVE_STATUSES  = new Set(['created', 'paid', 'accepted', 'in_progress'])
const DONE_STATUSES    = new Set(['completed', 'cancelled', 'refunded'])

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾',
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  created:     { label: () => t('orders.status_created'),     bg: 'var(--surface-2)', color: 'var(--text-muted)' } as any,
  paid:        { label: () => t('orders.status_paid'),        bg: '#E8EDFF', color: '#3B5BDB' } as any,
  accepted:    { label: () => t('orders.status_accepted'),    bg: '#FFF3CD', color: '#856404' } as any,
  in_progress: { label: () => t('orders.status_in_progress'), bg: '#FFF4F0', color: 'var(--primary)' } as any,
  completed:   { label: () => t('orders.status_completed'),   bg: '#D1F2E4', color: '#1A7A4A' } as any,
  cancelled:   { label: () => t('orders.status_cancelled'),   bg: '#FFE0DE', color: '#9E1B12' } as any,
  refunded:    { label: () => t('orders.status_refunded'),    bg: '#FFE0DE', color: '#9E1B12' } as any,
}

function statusLabel(s: string): string {
  if (s === 'created')     return t('orders.status_created')
  if (s === 'paid')        return t('orders.status_paid')
  if (s === 'accepted')    return t('orders.status_accepted')
  if (s === 'in_progress') return t('orders.status_in_progress')
  if (s === 'completed')   return t('orders.status_completed')
  if (s === 'cancelled')   return t('orders.status_cancelled')
  if (s === 'refunded')    return t('orders.status_refunded')
  return s
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtMoney(n: number | null) {
  if (!n) return '—'
  return n.toLocaleString('ru-RU') + ' ' + t('currency')
}

interface Props {
  onBack: () => void
  onOpenChat: (consultationId: string) => void
}

export default function Orders({ onBack, onOpenChat }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    api.orders(getOwnerId())
      .then(list => { setOrders(list); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o => {
    if (filter === 'active') return ACTIVE_STATUSES.has(o.status)
    if (filter === 'done')   return DONE_STATUSES.has(o.status)
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} aria-label={t('back')} style={iconBtn}>←</button>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{t('orders.title')}</span>
      </header>

      {/* Filter tabs */}
      <div style={{ display: 'flex', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        {([['all', t('orders.all')], ['active', t('orders.active')], ['done', t('orders.done')]] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              flex: 1, padding: '11px 8px', border: 'none', background: 'transparent',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              color: filter === key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: `2px solid ${filter === key ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -1, transition: 'color .15s',
            }}
          >{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>{t('loading')}</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', gap: 14, textAlign: 'center' }}>
            <span style={{ fontSize: 52 }}>📋</span>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{t('orders.empty')}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 260 }}>{t('orders.empty_sub')}</div>
          </div>
        )}

        {!loading && filtered.map(order => {
          const meta = STATUS_META[order.status] ?? STATUS_META.created
          const isActive = ACTIVE_STATUSES.has(order.status) && order.consultation_id
          const canChat = isActive && order.consultation_id

          return (
            <div
              key={order.id}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', overflow: 'hidden',
              }}
            >
              {/* Top row */}
              <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                {/* Vet avatar */}
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--r-md)',
                  background: 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, flexShrink: 0,
                }}>
                  {order.vet_avatar ?? '🩺'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>
                      {order.vet_name ?? t('orders.consultation')}
                    </div>
                    {/* Status badge */}
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 'var(--r-pill)',
                      background: meta.bg, color: meta.color, flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {statusLabel(order.status)}
                    </span>
                  </div>

                  {order.vet_specialty && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {order.vet_specialty}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                    {order.pet_name && (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {SPECIES_EMOJI[order.pet_species ?? ''] ?? '🐾'} {order.pet_name}
                      </span>
                    )}
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {fmtDate(order.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Problem excerpt */}
              {order.problem && (
                <div style={{
                  margin: '0 16px', padding: '10px 14px',
                  background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
                  fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}>
                  {order.problem}
                </div>
              )}

              {/* Bottom: price + action */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t('orders.price')}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                    {fmtMoney(order.price_uzs)}
                  </div>
                </div>
                {canChat && (
                  <button
                    onClick={() => onOpenChat(order.consultation_id!)}
                    style={{
                      padding: '10px 20px', borderRadius: 'var(--r-pill)',
                      background: 'var(--primary)', color: '#fff', border: 'none',
                      fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
                    }}
                  >
                    💬 {t('orders.open_chat')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 'var(--r-md)',
  border: '1.5px solid var(--border)', background: 'transparent',
  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}
