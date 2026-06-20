import type { AdminSession } from '../types'

const ROLE_LABEL: Record<string, string> = { admin: 'Администратор', moderator: 'Модератор', support: 'Поддержка' }
const ROLE_COLOR: Record<string, string> = { admin: 'var(--primary)', moderator: '#3B5BDB', support: 'var(--success)' }

interface NavItem {
  id: string
  label: string
  roles: string[]
}

const NAV: NavItem[] = [
  { id: 'verification', label: '🔍 Верификация',  roles: ['admin', 'moderator'] },
  { id: 'orders',       label: '📋 Заказы',        roles: ['admin', 'support']   },
  { id: 'audit',        label: '📜 Аудит',          roles: ['admin']              },
]

interface Props {
  session: AdminSession
  activeScreen: string
  onNavigate: (screen: string) => void
  onLogout: () => void
  children: React.ReactNode
}

export default function Layout({ session, activeScreen, onNavigate, onLogout, children }: Props) {
  const visibleNav = NAV.filter(n => n.roles.includes(session.role))

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)', background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', flexShrink: 0,
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

        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {visibleNav.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500,
                background: activeScreen === item.id ? 'var(--surface-2)' : 'none',
                color: activeScreen === item.id ? 'var(--primary)' : 'var(--text)',
                minHeight: 44, transition: 'all .15s', border: 'none', cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 8px', borderTop: '1px solid var(--border)' }}>
          <button
            className="btn btn-ghost"
            onClick={onLogout}
            style={{ width: '100%', color: 'var(--text-muted)', fontSize: 13 }}
          >
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
