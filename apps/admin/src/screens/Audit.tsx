import { useState, useEffect, useCallback } from 'react'
import type { AuditEntry } from '../types'
import { adminApi } from '../api'

const ACTION_LABEL: Record<string, string> = {
  'vendor.approve': 'Одобрение подрядчика',
  'vendor.reject':  'Отклонение подрядчика',
  'order.refund':   'Возврат по заказу',
  'promo.create':   'Создание промокода',
}

export default function Audit() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [action, setAction]   = useState('')
  const [page, setPage]       = useState(1)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const d = await adminApi.getAudit({ action: action || undefined, page })
      setEntries(d.entries); setTotal(d.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки')
    } finally { setLoading(false) }
  }, [action, page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(total / 50))

  return (
    <div>
      <div className="page-title">Журнал действий</div>

      <div className="search-row">
        <select value={action} onChange={e => { setAction(e.target.value); setPage(1) }} style={{ minWidth: 220 }}>
          <option value="">Все действия</option>
          <option value="vendor.approve">Одобрение подрядчика</option>
          <option value="vendor.reject">Отклонение подрядчика</option>
          <option value="order.refund">Возврат по заказу</option>
          <option value="promo.create">Создание промокода</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && <div className="loading">Загрузка...</div>}
        {error && <div className="error-banner" style={{ margin: 16 }}>{error}</div>}
        {!loading && !error && entries.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📜</div>
            <div>Действий пока нет</div>
          </div>
        )}
        {!loading && entries.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Кто</th>
                <th>Роль</th>
                <th>Действие</th>
                <th>Объект</th>
                <th>Когда</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 500 }}>{e.actor_name ?? '—'}</td>
                  <td>
                    <span className="chip chip-muted" style={{ fontSize: 11 }}>{e.actor_role}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{ACTION_LABEL[e.action] ?? e.action}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {e.target_type}/{String(e.target_id).slice(0, 8)}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(e.created_at).toLocaleString('ru', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 50 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Назад</button>
          <span>Страница {page} из {totalPages} · всего {total}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Вперёд →</button>
        </div>
      )}
    </div>
  )
}
