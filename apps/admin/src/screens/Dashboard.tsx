import { useEffect, useState } from 'react'
import type { DashboardStats } from '../types'
import { adminApi } from '../api'

interface KPIProps {
  label: string
  value: string | number
  sub?: string
  accent?: string
}

function KPI({ label, value, sub, accent = 'var(--primary)' }: KPIProps) {
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch(e => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading">Загрузка...</div>
  if (error)   return <div className="error-banner">{error}</div>
  if (!stats)  return null

  const fmtMoney = (n: number) => n.toLocaleString('ru-RU') + ' сум'

  return (
    <div>
      <div className="page-title">Обзор</div>

      {/* Revenue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPI
          label="Выручка за сегодня"
          value={fmtMoney(stats.revenue_today)}
          accent="var(--primary)"
        />
        <KPI
          label="Выручка всего"
          value={fmtMoney(stats.revenue_total)}
          sub="Оплаченные и завершённые заказы"
          accent="var(--primary)"
        />
        <KPI
          label="Пользователей"
          value={stats.users_total}
          sub="Уникальных владельцев"
          accent="#3B5BDB"
        />
        <KPI
          label="Ветеринаров"
          value={`${stats.vets_available} / ${stats.vets_total}`}
          sub="Онлайн / Всего"
          accent="var(--success)"
        />
      </div>

      {/* Consultations */}
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Консультации</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        <StatusCard label="Ожидают" value={stats.consult_pending}  color="#856404" bg="#FFF3CD" />
        <StatusCard label="Активны"  value={stats.consult_active}   color="#3B5BDB" bg="#E8EDFF" />
        <StatusCard label="Завершены" value={stats.consult_completed} color="var(--success)" bg="#D1F2E4" />
      </div>

      {/* Verification alert */}
      {stats.verif_pending > 0 && (
        <div style={{
          background: '#FFF3CD', border: '1px solid rgba(133,100,4,.2)',
          borderRadius: 'var(--r-md)', padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#856404', fontSize: 14 }}>
              {stats.verif_pending} {stats.verif_pending === 1 ? 'подрядчик ждёт' : 'подрядчиков ждут'} верификации
            </div>
            <div style={{ fontSize: 12, color: '#856404', opacity: 0.8, marginTop: 2 }}>
              Перейдите в раздел «Верификация» для обработки заявок
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 'var(--r-md)', padding: '16px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}
