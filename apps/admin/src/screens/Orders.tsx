import { useState, useEffect, useCallback } from 'react'
import type { Order, AdminSession } from '../types'
import { adminApi } from '../api'

const STATUS_CHIP: Record<string, string> = {
  created: 'chip chip-muted',
  paid: 'chip chip-success',
  accepted: 'chip chip-blue',
  in_progress: 'chip chip-blue',
  completed: 'chip chip-success',
  cancelled: 'chip chip-warning',
  refunded: 'chip chip-danger',
}
const STATUS_LABEL: Record<string, string> = {
  created: 'Создан', paid: 'Оплачен', accepted: 'Принят',
  in_progress: 'В процессе', completed: 'Завершён', cancelled: 'Отменён', refunded: 'Возврат',
}
const PROVIDER_LABEL: Record<string, string> = { click: 'Click', payme: 'Payme', uzum: 'Uzum' }

interface Props { session: AdminSession }

export default function Orders({ session }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [refundModal, setRefundModal] = useState<Order | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.getOrders({ status: statusFilter || undefined, q: search || undefined, page })
      setOrders(data.orders)
      setTotal(data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, page])

  useEffect(() => { load() }, [load])

  const canRefund = (status: string) => ['paid', 'completed'].includes(status)
  const totalPages = Math.max(1, Math.ceil(total / 20))

  const handleRefund = async () => {
    if (!refundModal) return
    setRefunding(true)
    try {
      await adminApi.refundOrder(refundModal.id, refundReason)
      setRefundModal(null)
      setRefundReason('')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setRefunding(false)
    }
  }

  const canSeeRefund = ['admin', 'support'].includes(session.role)

  return (
    <div>
      <div className="page-title">Заказы</div>

      <div className="search-row">
        <input
          placeholder="Поиск по owner_id..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Все статусы</option>
          <option value="created">Создан</option>
          <option value="paid">Оплачен</option>
          <option value="completed">Завершён</option>
          <option value="cancelled">Отменён</option>
          <option value="refunded">Возврат</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && <div className="loading">Загрузка...</div>}
        {error && <div className="error-banner" style={{ margin: 16 }}>{error}</div>}
        {!loading && !error && orders.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div>Заказы не найдены</div>
          </div>
        )}
        {!loading && orders.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Владелец</th>
                <th>Ветеринар</th>
                <th>Сумма</th>
                <th>Провайдер</th>
                <th>Статус</th>
                <th>Дата</th>
                {canSeeRefund && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                    {o.id.slice(0, 8)}…
                  </td>
                  <td style={{ fontSize: 13 }}>{o.owner_id}</td>
                  <td style={{ fontSize: 13 }}>{o.vet_name ?? '—'}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                    {o.price_uzs != null ? o.price_uzs.toLocaleString() + ' сум' : '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>{o.provider ? PROVIDER_LABEL[o.provider] ?? o.provider : '—'}</td>
                  <td>
                    <span className={STATUS_CHIP[o.status] ?? 'chip chip-muted'}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(o.created_at).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  {canSeeRefund && (
                    <td>
                      {canRefund(o.status) && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => { setRefundModal(o); setRefundReason('') }}
                        >
                          Возврат
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 20 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Назад</button>
          <span>Страница {page} из {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Вперёд →</button>
        </div>
      )}

      {refundModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setRefundModal(null)}>
          <div className="modal">
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Сделать возврат?</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Заказ <code style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: 4 }}>{refundModal.id.slice(0, 8)}…</code>
              {' · '}{refundModal.price_uzs?.toLocaleString()} сум
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Причина</div>
              <textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="Укажите причину возврата..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)', fontSize: 14, resize: 'vertical',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setRefundModal(null)}>Отмена</button>
              <button className="btn btn-danger" onClick={handleRefund} disabled={refunding}>
                {refunding ? 'Обработка...' : 'Подтвердить возврат'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
