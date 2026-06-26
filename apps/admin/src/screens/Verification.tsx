import { useState, useEffect, useCallback } from 'react'
import { IconOrders, IconStar, IconCheckCircle, IconClose } from '@ht/shared'
import type { VendorVerification } from '../types'
import { adminApi } from '../api'

type Filter = 'pending' | 'verified' | 'rejected'

const FILTER_LABELS: Record<Filter, string> = {
  pending: 'Ожидают',
  verified: 'Верифицированы',
  rejected: 'Отклонены',
}

const STATUS_CHIP: Record<string, string> = {
  pending: 'chip chip-warning',
  verified: 'chip chip-success',
  rejected: 'chip chip-danger',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  verified: 'Верифицирован',
  rejected: 'Отклонён',
}

interface ConfirmState {
  vendor: VendorVerification
  action: 'approve' | 'reject'
}

export default function Verification() {
  const [filter, setFilter] = useState<Filter>('pending')
  const [vendors, setVendors] = useState<VendorVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getVendors(filter)
      setVendors(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  const handleVerify = async () => {
    if (!confirm) return
    if (confirm.action === 'reject' && !comment.trim()) return
    setSubmitting(true)
    try {
      await adminApi.verifyVendor(confirm.vendor.id, confirm.action, comment || undefined)
      setConfirm(null)
      setComment('')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div className="page-title">Верификация подрядчиков</div>

      <div className="filter-tabs">
        {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
          <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && <div className="loading">Загрузка...</div>}
        {error && <div className="error-banner" style={{ margin: 16 }}>{error}</div>}
        {!loading && !error && vendors.length === 0 && (
          <div className="empty">
            <div className="empty-icon"><IconOrders size={40} color="var(--text-muted)" /></div>
            <div>Нет заявок со статусом «{FILTER_LABELS[filter]}»</div>
          </div>
        )}
        {!loading && vendors.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Ветеринар</th>
                <th>Специальность</th>
                <th>Email</th>
                <th>Дата заявки</th>
                <th>Статус</th>
                {filter === 'pending' && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{v.avatar_emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{v.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><IconStar size={12} color="#F59E0B" /> {v.rating} · {v.price_uzs?.toLocaleString()} сум</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{v.specialty}</td>
                  <td style={{ fontSize: 13 }}>{v.email || '—'}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {v.submitted_at ? new Date(v.submitted_at).toLocaleDateString('ru') : '—'}
                  </td>
                  <td>
                    <span className={STATUS_CHIP[v.verification_status] ?? 'chip chip-muted'}>
                      {STATUS_LABEL[v.verification_status] ?? v.verification_status}
                    </span>
                  </td>
                  {filter === 'pending' && (
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success btn-sm" onClick={() => { setConfirm({ vendor: v, action: 'approve' }); setComment('') }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <IconCheckCircle size={14} /> Одобрить
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => { setConfirm({ vendor: v, action: 'reject' }); setComment('') }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <IconClose size={14} /> Отклонить
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal">
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              {confirm.action === 'approve' ? `Одобрить ${confirm.vendor.name}?` : `Отклонить ${confirm.vendor.name}?`}
            </div>
            {confirm.action === 'reject' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Причина отклонения (обязательно)</div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Укажите причину..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)', fontSize: 14, resize: 'vertical',
                  }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Отмена</button>
              <button
                className={`btn ${confirm.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleVerify}
                disabled={submitting || (confirm.action === 'reject' && !comment.trim())}
              >
                {submitting ? 'Сохранение...' : confirm.action === 'approve' ? 'Одобрить' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
