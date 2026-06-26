import { useEffect, useState } from 'react'
import { IconStar, IconStarFilled, IconCheck, IconEyeOff } from '@ht/shared'
import type { Review } from '../types'
import { adminApi } from '../api'

type FilterStatus = 'all' | 'pending' | 'published' | 'hidden'

const STATUS_CHIP: Record<string, string> = {
  pending:   'chip chip-warning',
  published: 'chip chip-success',
  hidden:    'chip chip-muted',
}
const STATUS_LABEL: Record<string, string> = {
  pending:   'На модерации',
  published: 'Опубликован',
  hidden:    'Скрыт',
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) =>
        i < n
          ? <IconStarFilled key={i} size={14} color="#F5A623" />
          : <IconStar      key={i} size={14} color="var(--text-muted)" />
      )}
    </span>
  )
}

export default function Reviews() {
  const [items, setItems]     = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [filter, setFilter]   = useState<FilterStatus>('all')
  const [busy, setBusy]       = useState<Set<number>>(new Set())

  const load = (status?: string) => {
    setLoading(true)
    adminApi.getReviews(status === 'all' ? undefined : status)
      .then(rows => { setItems(rows); setLoading(false) })
      .catch(e   => { setLoadErr(e.message); setLoading(false) })
  }

  useEffect(() => { load(filter) }, [filter])

  const moderate = async (id: number, action: 'publish' | 'hide') => {
    setBusy(prev => new Set(prev).add(id))
    try {
      const updated = await adminApi.moderateReview(id, action)
      setItems(prev => prev.map(r => r.id === updated.id ? { ...r, status: updated.status } : r))
    } catch { /* silent */ }
    finally { setBusy(prev => { const s = new Set(prev); s.delete(id); return s }) }
  }

  const filtered = filter === 'all' ? items : items.filter(r => r.status === filter)

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 20 }}>Отзывы</div>

      {/* Filter tabs */}
      <div className="filter-tabs" style={{ marginBottom: 16 }}>
        {(['all', 'pending', 'published', 'hidden'] as const).map(f => (
          <button
            key={f}
            className={`filter-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Все' : STATUS_LABEL[f]}
            {f !== 'all' && (
              <span style={{
                marginLeft: 6, fontSize: 11, fontWeight: 600,
                background: filter === f ? 'var(--primary)' : 'var(--border)',
                color: filter === f ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--r-pill)', padding: '1px 6px',
              }}>
                {items.filter(r => r.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loadErr && <div className="card" style={{ color: 'var(--danger)', padding: 16, marginBottom: 12 }}>{loadErr}</div>}
      {loading && <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>Загрузка…</div>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
              Отзывов нет
            </div>
          )}
          {filtered.map(review => (
            <div key={review.id} className="card" style={{ padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Vet avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              }}>
                {review.vet_emoji ?? '🩺'}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <Stars n={review.rating} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{review.vet_name ?? 'Ветеринар'}</span>
                  <span className={STATUS_CHIP[review.status]} style={{ fontSize: 11 }}>
                    {STATUS_LABEL[review.status]}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {new Date(review.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {review.text && (
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, marginBottom: 6 }}>
                    «{review.text}»
                  </div>
                )}

                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Автор: {review.owner_id}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {review.status !== 'published' && (
                  <button
                    className="btn btn-sm btn-success"
                    disabled={busy.has(review.id)}
                    onClick={() => moderate(review.id, 'publish')}
                    title="Опубликовать"
                    style={{ minWidth: 36, minHeight: 36 }}
                  >
                    <IconCheck size={15} />
                  </button>
                )}
                {review.status !== 'hidden' && (
                  <button
                    className="btn btn-sm btn-ghost"
                    disabled={busy.has(review.id)}
                    onClick={() => moderate(review.id, 'hide')}
                    title="Скрыть"
                    style={{ minWidth: 36, minHeight: 36 }}
                  >
                    <IconEyeOff size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
