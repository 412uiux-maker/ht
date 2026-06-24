import { IconHome, IconConsultation, IconPaw, IconBook, IconUser } from '@ht/shared'
import { t } from '../i18n'

export type Tab = 'home' | 'consult' | 'pets' | 'learn' | 'profile'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

type TabDef = {
  id: Tab
  Icon: React.ComponentType<{ size?: number; color?: string }>
  labelKey: 'nav.home' | 'nav.consult' | 'nav.pets' | 'nav.learn' | 'nav.profile'
}

const TABS: TabDef[] = [
  { id: 'home',    Icon: IconHome,         labelKey: 'nav.home' },
  { id: 'consult', Icon: IconConsultation, labelKey: 'nav.consult' },
  { id: 'pets',    Icon: IconPaw,          labelKey: 'nav.pets' },
  { id: 'learn',   Icon: IconBook,         labelKey: 'nav.learn' },
  { id: 'profile', Icon: IconUser,         labelKey: 'nav.profile' },
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
      {TABS.map(({ id, Icon, labelKey }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: '10px 4px',
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
            <Icon size={22} />
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.01em', whiteSpace: 'nowrap',
            }}>
              {t(labelKey)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
