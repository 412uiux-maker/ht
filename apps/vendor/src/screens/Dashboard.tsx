import { useState, useEffect } from 'react'
import { api } from '../api'
import type { VendorSession, Consultation, Stats } from '../types'

const SPECIES: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾'
}

const STATUS_TABS = [
  { key: 'all',       label: 'Все' },
  { key: 'pending',   label: 'Ожидают' },
  { key: 'active',    label: 'Активные' },
  { key: 'completed', label: 'Завершённые' },
]

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  return `${Math.floor(diff / 86400)} д назад`
}

export default function Dashboard({
  session, onLogout, onOpenChat
}: {
  session: VendorSession
  onLogout: () => void
  onOpenChat: (id: string) => void
}) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.stats(session.vet_id).then(setStats).catch(() => {})
  }, [session.vet_id])

  useEffect(() => {
    setLoading(true)
    setError('')
    api.consultations(session.vet_id, tab)
      .then(data => { setConsultations(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [session.vet_id, tab])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--surface3)',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--coral)' }}>🐾 HappyTails</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--text2)', fontSize: '14px' }}>
            {session.avatar_emoji} {session.name}
          </span>
          <button
            onClick={onLogout}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--surface3)',
              borderRadius: 'var(--r-sm)', padding: '8px 16px',
              color: 'var(--text2)', fontSize: '13px', minHeight: '36px',
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Stats */}
        {stats && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px', marginBottom: '20px',
          }}>
            <StatCard label="Доход" value={`${stats.income.toLocaleString()} сум`} color="var(--coral)" />
            <StatCard label="Всего" value={stats.total} />
            <StatCard label="Активных" value={stats.active} color="var(--green)" />
            <StatCard label="Ожидают" value={stats.pending} color="var(--amber)" />
            <StatCard label="Рейтинг" value={`⭐ ${stats.rating}`} />
          </div>
        )}

        {/* Pending alert */}
        {stats && stats.pending > 0 && (
          <div style={{
            background: 'rgba(245,166,35,.1)', border: '1px solid rgba(245,166,35,.3)',
            borderRadius: 'var(--r-md)', padding: '14px 18px', marginBottom: '20px',
            color: 'var(--amber)', fontSize: '14px', fontWeight: 500,
          }}>
            ⚡ У вас {stats.pending} ожидающих консультаций — ответьте как можно скорее
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? 'var(--coral)' : 'var(--surface2)',
                color: tab === t.key ? '#fff' : 'var(--text2)',
                border: '1px solid ' + (tab === t.key ? 'var(--coral)' : 'var(--surface3)'),
                borderRadius: 'var(--r-sm)', padding: '8px 16px',
                fontSize: '14px', fontWeight: 500, minHeight: '44px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading && (
          <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '60px 0' }}>
            Загрузка…
          </div>
        )}
        {!loading && error && (
          <div style={{ color: 'var(--danger)', textAlign: 'center', padding: '40px 0' }}>
            {error}
          </div>
        )}
        {!loading && !error && consultations.length === 0 && (
          <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '60px 0' }}>
            Нет консультаций
          </div>
        )}
        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {consultations.map(c => (
              <ConsultCard key={c.id} c={c} onClick={() => onOpenChat(c.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r-md)',
      padding: '16px 18px', border: '1px solid var(--surface3)',
    }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color: color ?? 'var(--text)', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        {label}
      </div>
    </div>
  )
}

function ConsultCard({ c, onClick }: { c: Consultation; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)', borderRadius: 'var(--r-md)',
        padding: '16px 18px', border: '1px solid var(--surface3)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
        transition: 'border-color .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--surface3)')}
    >
      <span style={{ fontSize: '28px', flexShrink: 0 }}>
        {SPECIES[c.pet_species] ?? '🐾'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <strong style={{ fontSize: '15px' }}>{c.pet_name}</strong>
          <span className={`pill pill-${c.status}`}>
            {c.status === 'pending' ? 'Ожидает' : c.status === 'active' ? 'Активна' : 'Завершена'}
          </span>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '2px' }}>{c.client_name}</p>
        <p style={{
          color: 'var(--text3)', fontSize: '13px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {c.problem}
        </p>
      </div>
      <span style={{ color: 'var(--text3)', fontSize: '12px', flexShrink: 0 }}>
        {timeAgo(c.created_at)}
      </span>
    </div>
  )
}
