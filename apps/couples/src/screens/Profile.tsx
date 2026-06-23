import { useEffect, useState } from 'react'
import type { Pet } from '../api'
import { api, getOwnerId } from '../api'
import { t } from '../i18n'
import type { Tab } from '../components/BottomNav'

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

interface Props {
  lang: string
  onSwitchLang: () => void
  onNavigate: (tab: Tab) => void
}

export default function Profile({ lang, onSwitchLang, onNavigate }: Props) {
  const [pets, setPets] = useState<Pet[]>([])
  const { theme, toggle: toggleTheme } = useTheme()

  useEffect(() => {
    api.pets(getOwnerId()).then(setPets).catch(() => {})
  }, [lang])

  const ownerId = getOwnerId()
  const shortId = ownerId.slice(0, 8).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
      <header style={{
        display: 'flex', alignItems: 'center', padding: '14px 20px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{t('profile.title')}</span>
      </header>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* User card */}
        <div style={{
          background: 'var(--grad-warm)', borderRadius: 'var(--r-xl)',
          padding: '20px', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, flexShrink: 0,
          }}>🐾</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>HappyTails</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>ID: {shortId}</div>
          </div>
        </div>

        {/* Pets section */}
        <Section title={t('profile.my_pets')} action={t('pets.add')} onAction={() => onNavigate('pets')}>
          {pets.length === 0 ? (
            <div style={{ fontSize: 14, color: 'var(--text-muted)', padding: '12px 0' }}>
              {t('pets.empty')}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
              {pets.map(pet => (
                <div key={pet.id} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  flexShrink: 0, minWidth: 60,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 'var(--r-md)',
                    background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                  }}>{pet.avatar_emoji}</div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{pet.name}</span>
                </div>
              ))}
              <button
                onClick={() => onNavigate('pets')}
                style={{
                  width: 52, height: 52, borderRadius: 'var(--r-md)',
                  border: '1.5px dashed var(--border)', background: 'transparent',
                  fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, alignSelf: 'flex-start',
                }}
              >+</button>
            </div>
          )}
        </Section>

        {/* Language */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{t('profile.language')}</span>
            <button
              onClick={onSwitchLang}
              style={{
                padding: '6px 16px', borderRadius: 'var(--r-pill)',
                border: '1.5px solid var(--primary)', background: 'transparent',
                fontSize: 13, fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {lang === 'ru' ? "O'zbekcha →" : 'Русский →'}
            </button>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, width: 22, textAlign: 'center' }}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                width: 48, height: 28, borderRadius: 'var(--r-pill)',
                border: 'none', cursor: 'pointer', position: 'relative',
                background: theme === 'dark' ? 'var(--primary)' : 'var(--border)',
                transition: 'background .2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, width: 22, height: 22,
                borderRadius: '50%', background: '#fff',
                transition: 'left .2s',
                left: theme === 'dark' ? 23 : 3,
                boxShadow: '0 1px 4px rgba(0,0,0,.2)',
              }} />
            </button>
          </div>

          <NavRow icon="📋" label={t('profile.orders')} onClick={() => {}} />
          <NavRow icon="ℹ️" label={t('profile.about')} last onClick={() => {}} />
        </div>

        {/* Version */}
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', paddingTop: 4 }}>
          HappyTails · {t('profile.version')} 0.1
        </div>
      </div>
    </div>
  )
}

function Section({ title, action, onAction, children }: {
  title: string; action?: string; onAction?: () => void; children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
        {action && (
          <button
            onClick={onAction}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: 13, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{action}</button>
        )}
      </div>
      {children}
    </div>
  )
}

function NavRow({ icon, label, last, onClick }: { icon: string; label: string; last?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '13px 16px', border: 'none', background: 'transparent',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        borderBottom: last ? 'none' : '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: 18, width: 22, textAlign: 'center' }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>›</span>
    </button>
  )
}
