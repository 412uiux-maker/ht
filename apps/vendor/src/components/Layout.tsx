import { useState } from 'react'
import type { VendorSession } from '../types'

const NAV = [
  { id: 'dashboard', label: '📋 Консультации' },
  { id: 'services',  label: '⚙️ Услуги'       },
  { id: 'finances',  label: '💰 Финансы'       },
  { id: 'reviews',   label: '⭐ Отзывы'        },
  { id: 'profile',   label: '👤 Профиль'       },
]

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (document.documentElement.dataset.theme as 'light' | 'dark') ||
    (localStorage.getItem('ht_theme') as 'light' | 'dark') || 'dark'
  )
  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    localStorage.setItem('ht_theme', next)
    setTheme(next)
  }
  return { theme, toggle }
}

interface Props {
  session: VendorSession
  activeScreen: string
  onNavigate: (s: string) => void
  onLogout: () => void
  children: React.ReactNode
}

export default function Layout({ session, activeScreen, onNavigate, onLogout, children }: Props) {
  const { theme, toggle: toggleTheme } = useTheme()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'var(--surface)', borderRight: '1px solid var(--surface3)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 14px' }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--coral)' }}>🐾 HappyTails</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Кабинет подрядчика</div>
        </div>

        {/* Session info */}
        <div style={{
          padding: '12px 16px', margin: '0 8px',
          background: 'var(--surface2)', borderRadius: 'var(--r-sm)',
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>{session.avatar_emoji}</div>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{session.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{session.specialty}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 500,
                background: activeScreen === item.id ? 'rgba(242,120,75,.15)' : 'transparent',
                color: activeScreen === item.id ? 'var(--coral)' : 'var(--text2)',
                minHeight: 44, border: 'none', cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--surface3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            onClick={toggleTheme}
            style={{
              width: '100%', textAlign: 'left', padding: '9px 14px',
              borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 500,
              background: 'transparent', color: 'var(--text2)',
              minHeight: 40, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span>{theme === 'dark' ? '🌙 Тёмная' : '☀️ Светлая'}</span>
            <div style={{
              width: 38, height: 20, borderRadius: 999, position: 'relative',
              background: theme === 'dark' ? 'var(--coral)' : 'var(--surface3)',
              transition: 'background .2s', flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute', top: 2, width: 16, height: 16,
                borderRadius: '50%', background: '#fff',
                transition: 'left .2s',
                left: theme === 'dark' ? 20 : 2,
                boxShadow: '0 1px 3px rgba(0,0,0,.25)',
              }} />
            </div>
          </button>
          <button
            onClick={onLogout}
            style={{
              width: '100%', padding: '9px 14px', borderRadius: 'var(--r-sm)',
              background: 'transparent', border: 'none',
              color: 'var(--text3)', fontSize: 13, cursor: 'pointer', minHeight: 40, textAlign: 'left',
            }}
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}
