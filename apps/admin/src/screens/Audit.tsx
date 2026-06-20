import { useState, useEffect } from 'react'
import type { AuditEntry } from '../types'
import { adminApi } from '../api'

const ACTION_LABEL: Record<string, string> = {
  'vendor.approve': 'Одобрение подрядчика',
  'vendor.reject':  'Отклонение подрядчика',
  'order.refund':   'Возврат по заказу',
}

export default function Audit() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.getAudit()
      .then(setEntries)
      .catch(e => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="page-title">Журнал действий</div>

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
    </div>
  )
}
