import { t } from '../i18n'

export type Tab = 'home' | 'consult' | 'pets' | 'learn' | 'profile'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const TABS: { id: Tab; icon: string; labelKey: keyof typeof import('../i18n').t extends (k: infer K) => string ? K : never }[] = [
  { id: 'home',    icon: '🏠', labelKey: 'nav.home' as const },
  { id: 'consult', icon: '💬', labelKey: 'nav.consult' as const },
  { id: 'pets',    icon: '🐾', labelKey: 'nav.pets' as const },
  { id: 'learn',   icon: '📚', labelKey: 'nav.learn' as const },
  { id: 'profile', icon: '👤', labelKey: 'nav.profile' as const },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      maxWidth: 480, margin: '0 auto',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, padding: '10px 4px 10px',
              background: 'transparent', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
              minHeight: 56,
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'color .15s',
              position: 'relative',
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute', top: 0, left: '25%', right: '25%',
                height: 2, background: 'var(--primary)',
                borderRadius: '0 0 2px 2px',
              }} />
            )}
            <span style={{
              fontSize: 20,
              filter: isActive ? 'none' : 'grayscale(1) opacity(0.5)',
              transition: 'filter .15s',
            }}>{tab.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.01em', whiteSpace: 'nowrap',
            }}>
              {t(tab.labelKey as Parameters<typeof t>[0])}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
