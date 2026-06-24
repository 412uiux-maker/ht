import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import type { VendorSession, Consultation, Stats } from '../types'

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (document.documentElement.dataset.theme as 'light' | 'dark') || 'dark'
  )
  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    localStorage.setItem('ht_theme', next)
    setTheme(next)
  }
  return { theme, toggle }
}

const SPECIES: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾'
}

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
  const { theme, toggle: toggleTheme } = useTheme()
  const [stats, setStats] = useState<Stats | null>(null)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  const loadStats = useCallback(() => {
    api.stats(session.vet_id).then(setStats).catch(() => {})
  }, [session.vet_id])

  const loadConsultations = useCallback(() => {
    setLoading(true)
    setError('')
    api.consultations(session.vet_id, tab)
      .then(data => { setConsultations(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [session.vet_id, tab])

  useEffect(() => {
    loadStats()
    const iv = setInterval(loadStats, 30_000)
    return () => clearInterval(iv)
  }, [loadStats])

  useEffect(() => {
    loadConsultations()
  }, [loadConsultations])

  const acceptConsult = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setAcceptingId(id)
    try {
      await api.accept(id)
      await Promise.all([loadConsultations(), loadStats()])
    } catch {}
    finally { setAcceptingId(null) }
  }

  const STATUS_TABS = [
    { key: 'all',       label: 'Все',          count: stats ? stats.total : null },
    { key: 'pending',   label: 'Ожидают',      count: stats ? stats.pending : null },
    { key: 'active',    label: 'Активные',     count: stats ? stats.active : null },
    { key: 'completed', label: 'Завершённые',  count: stats ? stats.completed : null },
  ]

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            style={{
              width: 36, height: 36, borderRadius: 'var(--r-sm)',
              background: 'var(--surface2)', border: '1px solid var(--surface3)',
              fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={onLogout}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--surface3)',
              borderRadius: 'var(--r-sm)', padding: '8px 16px',
              color: 'var(--text2)', fontSize: '13px', minHeight: '36px',
              cursor: 'pointer',
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Vet profile banner */}
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--r-lg)',
          border: '1px solid var(--surface3)', padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: '20px',
          marginBottom: '20px',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--r-md)',
            background: 'rgba(255,102,80,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '36px', flexShrink: 0,
          }}>
            {session.avatar_emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '2px' }}>{session.name}</div>
            <div style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '6px' }}>{session.specialty}</div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--text3)' }}>
                ⭐ {session.rating} рейтинг
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text3)' }}>
                🎓 {session.experience_yr} лет опыта
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text3)' }}>
                💰 {session.price_uzs.toLocaleString('ru-RU')} сум / консультация
              </span>
            </div>
          </div>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--green)', boxShadow: '0 0 0 3px rgba(76,175,125,.2)',
            flexShrink: 0,
          }} />
        </div>

        {/* Stats */}
        {stats && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px', marginBottom: '20px',
          }}>
            <StatCard label="Доход" value={`${stats.income.toLocaleString('ru-RU')} сум`} color="var(--coral)" />
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
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span>⚡</span>
            <span>
              У вас {stats.pending} {stats.pending === 1 ? 'ожидающая консультация' : 'ожидающих консультации'} — ответьте как можно скорее
            </span>
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
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span style={{
                  background: tab === t.key ? 'rgba(255,255,255,.25)' : 'var(--surface3)',
                  borderRadius: '10px', padding: '1px 7px',
                  fontSize: '12px', fontWeight: 700,
                  color: tab === t.key ? '#fff' : 'var(--text3)',
                }}>
                  {t.count}
                </span>
              )}
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
              <ConsultCard
                key={c.id}
                c={c}
                accepting={acceptingId === c.id}
                onAccept={(e) => acceptConsult(c.id, e)}
                onClick={() => onOpenChat(c.id)}
              />
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
      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
        {label}
      </div>
    </div>
  )
}

function ConsultCard({
  c, onClick, onAccept, accepting
}: {
  c: Consultation
  onClick: () => void
  onAccept: (e: React.MouseEvent) => void
  accepting: boolean
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)', borderRadius: 'var(--r-md)',
        padding: '16px 18px', border: '1px solid var(--surface3)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
        transition: 'border-color .15s',
        borderLeft: c.status === 'pending' ? '3px solid var(--amber)' : c.status === 'active' ? '3px solid var(--green)' : '3px solid transparent',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = c.status === 'pending' ? 'var(--amber)' : c.status === 'active' ? 'var(--green)' : 'transparent')}
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
        <span style={{ color: 'var(--text3)', fontSize: '12px' }}>
          {timeAgo(c.created_at)}
        </span>
        {c.status === 'pending' && (
          <button
            onClick={onAccept}
            disabled={accepting}
            style={{
              background: 'var(--amber)', color: '#000', border: 'none',
              borderRadius: 'var(--r-sm)', padding: '5px 12px',
              fontSize: '12px', fontWeight: 700, minHeight: '32px',
              cursor: 'pointer', opacity: accepting ? 0.7 : 1, whiteSpace: 'nowrap',
            }}
          >
            {accepting ? '…' : '✓ Принять'}
          </button>
        )}
        {c.status === 'active' && (
          <span style={{
            background: 'rgba(76,175,125,.15)', color: 'var(--green)',
            borderRadius: 'var(--r-sm)', padding: '4px 10px',
            fontSize: '11px', fontWeight: 700,
          }}>
            В чат →
          </span>
        )}
      </div>
    </div>
  )
}
