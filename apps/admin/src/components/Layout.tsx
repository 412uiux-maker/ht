import { useState } from 'react'
import {
  IconDashboard, IconVerify, IconConsultation, IconOrders, IconMoney,
  IconUsers, IconContent, IconLearning, IconPromo, IconSettings, IconAudit,
  IconMoon, IconSun, IconLogOut,
} from '@ht/shared'
import type { AdminSession } from '../types'

const ROLE_LABEL: Record<string, string> = { admin: 'Администратор', moderator: 'Модератор', support: 'Поддержка' }
const ROLE_COLOR: Record<string, string> = { admin: 'var(--primary)', moderator: '#3B5BDB', support: 'var(--success)' }

type NavItem = {
  id: string
  label: string
  Icon: React.ComponentType<{ size?: number; color?: string }>
  roles: string[]
}

const NAV: NavItem[] = [
  { id: 'dashboard',     label: 'Обзор',          Icon: IconDashboard,    roles: ['admin', 'moderator', 'support'] },
  { id: 'verification',  label: 'Верификация',     Icon: IconVerify,       roles: ['admin', 'moderator'] },
  { id: 'consultations', label: 'Консультации',    Icon: IconConsultation, roles: ['admin', 'support']   },
  { id: 'orders',        label: 'Заказы',          Icon: IconOrders,       roles: ['admin', 'support']   },
  { id: 'finances',      label: 'Финансы',         Icon: IconMoney,        roles: ['admin']              },
  { id: 'users',         label: 'Пользователи',    Icon: IconUsers,        roles: ['admin', 'moderator'] },
  { id: 'content',       label: 'Контент',         Icon: IconContent,      roles: ['admin', 'moderator'] },
  { id: 'learning',      label: 'Обучение',        Icon: IconLearning,     roles: ['admin', 'moderator'] },
  { id: 'promos',        label: 'Промокоды',       Icon: IconPromo,        roles: ['admin', 'moderator'] },
  { id: 'settings',      label: 'Настройки',       Icon: IconSettings,     roles: ['admin']              },
  { id: 'audit',         label: 'Аудит',           Icon: IconAudit,        roles: ['admin']              },
]

interface Props {
  session: AdminSession
  activeScreen: string
  onNavigate: (screen: string) => void
  onLogout: () => void
  children: React.ReactNode
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (document.documentElement.dataset.theme as 'light' | 'dark') || 'light'
  )
  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    localStorage.setItem('ht_theme', next)
    setTheme(next)
  }
  return { theme, toggle }
}

export default function Layout({ session, activeScreen, onNavigate, onLogout, children }: Props) {
  const visibleNav = NAV.filter(n => n.roles.includes(session.role))
  const { theme, toggle: toggleTheme } = useTheme()

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)', background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🐾 HappyTails</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin Panel</div>
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{session.name}</div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--r-pill)',
            background: ROLE_COLOR[session.role] + '22', color: ROLE_COLOR[session.role],
          }}>
            {ROLE_LABEL[session.role]}
          </span>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {visibleNav.map(({ id, label, Icon }) => {
            const isActive = activeScreen === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500,
                  background: isActive ? 'var(--surface-2)' : 'none',
                  color: isActive ? 'var(--primary)' : 'var(--text)',
                  minHeight: 44, transition: 'all .15s', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <Icon size={17} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                {label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 14px',
              borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500,
              background: 'none', color: 'var(--text-muted)',
              minHeight: 44, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {theme === 'dark' ? <IconMoon size={16} /> : <IconSun size={16} />}
              {theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
            </span>
            <div style={{
              width: 40, height: 22, borderRadius: 'var(--r-pill)', position: 'relative',
              background: theme === 'dark' ? 'var(--primary)' : 'var(--border)',
              transition: 'background .2s',
            }}>
              <span style={{
                position: 'absolute', top: 2, width: 18, height: 18,
                borderRadius: '50%', background: '#fff',
                transition: 'left .2s',
                left: theme === 'dark' ? 20 : 2,
                boxShadow: '0 1px 3px rgba(0,0,0,.2)',
              }} />
            </div>
          </button>

          <button
            className="btn btn-ghost"
            onClick={onLogout}
            style={{ width: '100%', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
          >
            <IconLogOut size={15} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
        {children}
      </main>
    </div>
  )
}
