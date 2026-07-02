import { useState, useEffect } from 'react'
import type { Analytics, AnalyticsDay } from '../types'
import { adminApi } from '../api'

const PERIOD_OPTIONS = [7, 14, 30, 60, 90] as const
type Period = typeof PERIOD_OPTIONS[number]

const STATUS_LABEL: Record<string, string> = {
  created: 'Создан', paid: 'Оплачен', accepted: 'Принят', in_progress: 'В работе',
  completed: 'Завершён', reviewed: 'С отзывом', rejected: 'Отклонён',
  cancelled: 'Отменён', refunded: 'Возвращён',
}
const STATUS_COLOR: Record<string, string> = {
  created: '#94a3b8', paid: '#3b82f6', accepted: '#f59e0b', in_progress: '#8b5cf6',
  completed: '#22c55e', reviewed: '#16a34a', rejected: '#ef4444',
  cancelled: '#64748b', refunded: '#dc2626',
}

function fmtMoney(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

function fmtDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

// Simple CSS bar chart
function BarChart({
  data, valueKey, labelKey, color, label, formatValue,
}: {
  data: Record<string, string | number>[]
  valueKey: string
  labelKey: string
  color: string
  label: string
  formatValue?: (n: number) => string
}) {
  const max = Math.max(...data.map(d => Number(d[valueKey])), 1)
  const fmt = formatValue ?? String

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120, overflowX: 'auto' }}>
        {data.map((d, i) => {
          const val = Number(d[valueKey])
          const h = max > 0 ? Math.max(Math.round((val / max) * 110), val > 0 ? 4 : 0) : 0
          return (
            <div
              key={i}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, minWidth: 28 }}
              title={`${d[labelKey]}: ${fmt(val)}`}
            >
              <div style={{
                width: 20, height: h, background: color, borderRadius: '4px 4px 0 0',
                transition: 'height .3s ease', minHeight: val > 0 ? 4 : 0,
              }} />
            </div>
          )
        })}
      </div>
      {/* X-axis labels — show every N-th */}
      <div style={{ display: 'flex', gap: 3, marginTop: 4, overflowX: 'hidden' }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              minWidth: 28, fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', flexShrink: 0,
              opacity: i % Math.max(1, Math.floor(data.length / 12)) === 0 ? 1 : 0,
            }}
          >
            {String(d[labelKey]).length <= 6 ? d[labelKey] : String(d[labelKey]).slice(-5)}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>(30)
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    adminApi.getAnalytics(period)
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false))
  }, [period])

  const totalGmv   = data?.daily.reduce((s, d) => s + Number(d.gmv), 0) ?? 0
  const totalOrders = data?.daily.reduce((s, d) => s + Number(d.orders), 0) ?? 0
  const avgOrder   = totalOrders > 0 ? Math.round(totalGmv / totalOrders) : 0
  const totalUsers = data?.newUsers.reduce((s, d) => s + Number(d.cnt), 0) ?? 0

  const gmvData: AnalyticsDay[] = data?.daily.map(d => ({
    ...d,
    day: fmtDate(d.day),
    gmv: Number(d.gmv),
    orders: Number(d.orders),
  })) ?? []

  const usersData = data?.newUsers.map(d => ({ day: fmtDate(d.day), cnt: Number(d.cnt) })) ?? []

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Аналитика</h1>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Динамика за выбранный период</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '5px 12px', borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 600,
                border: '1px solid var(--border)',
                background: period === p ? 'var(--primary)' : 'var(--surface)',
                color: period === p ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {p}д
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', padding: '48px 0', textAlign: 'center' }}>Загрузка…</div>}
      {error   && <div className="error-banner">{error}</div>}

      {!loading && data && (
        <>
          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard label={`GMV за ${period} дней`}   value={(totalGmv / 1_000_000).toFixed(1) + 'M сум'} />
            <StatCard label="Заказов"       value={String(totalOrders)} />
            <StatCard label="Средний чек"   value={fmtMoney(avgOrder) + ' сум'} />
            <StatCard label="Новых клиентов" value={String(totalUsers)} />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <div className="card" style={{ padding: '20px 20px 10px' }}>
              <BarChart
                data={gmvData as unknown as Record<string, string | number>[]}
                valueKey="gmv"
                labelKey="day"
                color="var(--primary, #E8911A)"
                label="GMV по дням (сум)"
                formatValue={fmtMoney}
              />
            </div>
            <div className="card" style={{ padding: '20px 20px 10px' }}>
              <BarChart
                data={gmvData as unknown as Record<string, string | number>[]}
                valueKey="orders"
                labelKey="day"
                color="#3b82f6"
                label="Заказов по дням"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            {/* Status breakdown */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14 }}>
                Заказы по статусам
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.byStatus
                  .sort((a, b) => Number(b.cnt) - Number(a.cnt))
                  .map(s => {
                    const total = data.byStatus.reduce((acc, x) => acc + Number(x.cnt), 0) || 1
                    const pct = Math.round((Number(s.cnt) / total) * 100)
                    return (
                      <div key={s.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: STATUS_COLOR[s.status] ?? 'var(--text)' }}>
                            {STATUS_LABEL[s.status] ?? s.status}
                          </span>
                          <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                            {s.cnt} ({pct}%)
                          </span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'var(--border)' }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            width: pct + '%',
                            background: STATUS_COLOR[s.status] ?? 'var(--primary)',
                            transition: 'width .4s ease',
                          }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* New users */}
            <div className="card" style={{ padding: '20px 20px 10px' }}>
              <BarChart
                data={usersData as Record<string, string | number>[]}
                valueKey="cnt"
                labelKey="day"
                color="#22c55e"
                label="Новые пользователи по дням"
              />
            </div>
          </div>

          {/* Top vets */}
          {data.topVets.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 14 }}>
                Топ ветеринаров по выручке
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.topVets.map((v, i) => {
                  const maxRev = Number(data.topVets[0]?.revenue) || 1
                  const pct = Math.round((Number(v.revenue) / maxRev) * 100)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 22, flexShrink: 0, width: 36, textAlign: 'center' }}>
                        {v.avatar_emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.name}
                          </span>
                          <span style={{ flexShrink: 0, color: 'var(--text-muted)', fontSize: 12, marginLeft: 8 }}>
                            {v.order_count} заказов · {fmtMoney(Number(v.revenue))} сум
                          </span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: 'var(--border)' }}>
                          <div style={{
                            height: '100%', borderRadius: 3, width: pct + '%',
                            background: 'var(--primary)', transition: 'width .4s ease',
                          }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
