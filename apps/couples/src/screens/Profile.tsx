import { useEffect, useState } from 'react'
import { IconUsers, IconMoon, IconSun, IconOrders, IconInfo, IconSettings, IconChevronRight } from '@ht/shared'
import type { Pet } from '../api'
import { api, getOwnerId } from '../api'
import { t, getLang } from '../i18n'
import type { Tab } from '../components/BottomNav'

type Person = { id: string; name: string; role: 'adult' | 'child'; birth_date?: string; avatar_emoji: string }
const loadPersons = (): Person[] => {
  try { return JSON.parse(localStorage.getItem('ht_persons') ?? '[]') } catch { return [] }
}
const PERSON_COLORS: Record<'adult' | 'child', { bg: string; text: string }> = {
  adult: { bg: 'rgba(59,130,246,0.12)', text: '#1D4ED8' },
  child: { bg: 'rgba(234,88,12,0.12)',  text: '#9A3412' },
}

// ── Species colors (same system as Pets.tsx) ──────────────────
const SC: Record<string, { bg: string; text: string }> = {
  cat:     { bg: 'rgba(168,85,247,0.10)',  text: '#7C3AED' },
  dog:     { bg: 'rgba(242,120,75,0.11)',  text: '#C0511F' },
  rabbit:  { bg: 'rgba(20,184,166,0.10)',  text: '#0F766E' },
  parrot:  { bg: 'rgba(234,179,8,0.10)',   text: '#92400E' },
  hamster: { bg: 'rgba(234,88,12,0.10)',   text: '#9A3412' },
  fish:    { bg: 'rgba(59,130,246,0.10)',  text: '#1D4ED8' },
  other:   { bg: 'rgba(100,116,139,0.10)', text: '#475569' },
}
const sc = (s: string) => SC[s] ?? SC.other

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
  onOrders: () => void
}

export default function Profile({ lang, onSwitchLang, onNavigate, onOrders }: Props) {
  const [pets, setPets] = useState<Pet[]>([])
  const [persons] = useState<Person[]>(loadPersons)
  const { theme, toggle: toggleTheme } = useTheme()
  const uz = getLang() === 'uz'

  useEffect(() => {
    api.pets(getOwnerId()).then(setPets).catch(() => {})
  }, [lang])

  const ownerId = getOwnerId()
  const shortId = ownerId.slice(0, 8).toUpperCase()

  const familyCount = pets.length + persons.length
  // Floating emojis for card decoration (up to 4): pets first, then people
  const petEmojis = [
    ...pets.slice(0, 2).map(p => p.avatar_emoji),
    ...persons.slice(0, 2).map(p => p.role === 'child' ? '🧒' : '👤'),
  ].slice(0, 4)

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

        {/* ── Identity card ──────────────────────────────────── */}
        <div style={{
          background: 'var(--grad-warm)', borderRadius: 'var(--r-xl)',
          padding: '20px 20px 18px', color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          {/* Floating pet emojis as background decoration */}
          {petEmojis.length > 0 && (
            <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {petEmojis.map((em, i) => {
                const positions = [
                  { right: 14, top: 10 },
                  { right: 50, top: 28 },
                  { right: 22, top: 44 },
                  { right: 58, top: 8 },
                ]
                const pos = positions[i]
                return (
                  <span key={i} style={{
                    position: 'absolute', fontSize: 28 + (i % 2) * 4,
                    opacity: 0.18 + i * 0.04,
                    ...pos,
                  }}>{em}</span>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            {/* Avatar */}
            <div style={{
              width: 58, height: 58, borderRadius: '50%',
              background: 'rgba(255,255,255,.22)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: familyCount > 0 ? 30 : 0,
              border: '2px solid rgba(255,255,255,.35)',
            }}>
              {pets.length > 0
                ? pets[0].avatar_emoji
                : persons.length > 0
                  ? (persons[0].role === 'child' ? '🧒' : '👤')
                  : <IconUsers size={26} color="rgba(255,255,255,.9)" />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 3 }}>
                {uz ? 'Mening profilim' : 'Мой профиль'}
              </div>
              <div style={{
                fontSize: 12, opacity: 0.8,
                fontFamily: 'monospace', letterSpacing: '0.05em',
              }}>
                ID: {shortId}
              </div>
            </div>
          </div>

          {/* Family count hint */}
          {familyCount > 0 && (
            <div style={{
              marginTop: 14, paddingTop: 12,
              borderTop: '1px solid rgba(255,255,255,.2)',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, opacity: 0.9, position: 'relative', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 16 }}>👨‍👩‍👧‍👦</span>
              <span style={{ fontWeight: 600 }}>
                {familyCount}{' '}
                {uz ? 'ta' : familyCount === 1 ? 'в семье' : familyCount < 5 ? 'в семье' : 'в семье'}
              </span>
              {pets.map(p => (
                <span key={`pe-${p.id}`} style={{ fontSize: 15 }}>{p.avatar_emoji}</span>
              ))}
              {persons.map(p => (
                <span key={`pr-${p.id}`} style={{ fontSize: 15 }}>{p.role === 'child' ? '🧒' : '👤'}</span>
              ))}
            </div>
          )}
        </div>

        {/* ── My family strip ────────────────────────────────── */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{uz ? 'Mening oilam' : 'Моя семья'}</span>
            <button
              onClick={() => onNavigate('family')}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 13, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{uz ? "Barchasi →" : 'Все →'}</button>
          </div>

          {familyCount === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '16px 0 8px', gap: 8,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--r-md)',
                border: '1.5px dashed var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>👨‍👩‍👧‍👦</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                {uz ? "Oila a'zolari yo'q" : 'Семья пока пуста'}
              </div>
              <button
                onClick={() => onNavigate('family')}
                style={{
                  padding: '8px 20px', borderRadius: 'var(--r-pill)',
                  background: 'var(--primary)', color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 36,
                }}
              >
                {uz ? "Qo'shish →" : 'Добавить →'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' } as React.CSSProperties}>
              {/* Pets */}
              {pets.map(pet => {
                const colors = sc(pet.species)
                return (
                  <button
                    key={`pe-${pet.id}`}
                    onClick={() => onNavigate('family')}
                    style={{
                      flexShrink: 0, width: 68, border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)', background: 'var(--bg)',
                      overflow: 'hidden', cursor: 'pointer', padding: 0,
                      fontFamily: 'inherit', textAlign: 'left', transition: 'border-color .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = colors.text)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div style={{ height: 42, background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                      {pet.avatar_emoji}
                    </div>
                    <div style={{ padding: '5px 6px 7px', fontSize: 11, fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                      {pet.name}
                    </div>
                  </button>
                )
              })}
              {/* Persons */}
              {persons.map(person => {
                const pc = PERSON_COLORS[person.role]
                const emoji = person.role === 'child' ? '🧒' : '👤'
                return (
                  <button
                    key={`pr-${person.id}`}
                    onClick={() => onNavigate('family')}
                    style={{
                      flexShrink: 0, width: 68, border: '1px solid var(--border)',
                      borderRadius: 'var(--r-lg)', background: 'var(--bg)',
                      overflow: 'hidden', cursor: 'pointer', padding: 0,
                      fontFamily: 'inherit', textAlign: 'left', transition: 'border-color .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = pc.text)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div style={{ height: 42, background: pc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                      {emoji}
                    </div>
                    <div style={{ padding: '5px 6px 7px', fontSize: 11, fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                      {person.name}
                    </div>
                  </button>
                )
              })}
              {/* Add button */}
              <button
                onClick={() => onNavigate('family')}
                style={{
                  flexShrink: 0, width: 68, height: 80,
                  border: '1.5px dashed var(--border)', borderRadius: 'var(--r-lg)',
                  background: 'transparent', fontSize: 22,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  alignSelf: 'flex-start',
                }}
                aria-label={uz ? "Qo'shish" : 'Добавить'}
              >+</button>
            </div>
          )}
        </div>

        {/* ── Personalization group ──────────────────────────── */}
        <SettingsGroup label={uz ? 'Sozlamalar' : 'Персонализация'}>
          {/* Language selector */}
          <SettingsRow
            iconBg="rgba(242,120,75,0.10)" iconColor="#C0511F"
            icon="🌐"
            label={t('profile.language')}
          >
            <button
              onClick={onSwitchLang}
              style={{
                padding: '5px 14px', borderRadius: 'var(--r-pill)',
                border: '1.5px solid var(--primary)', background: 'transparent',
                fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                cursor: 'pointer', fontFamily: 'inherit', minHeight: 32,
              }}
            >
              {lang === 'ru' ? "O'zb →" : 'Рус →'}
            </button>
          </SettingsRow>

          {/* Theme toggle */}
          <SettingsRow
            iconBg={theme === 'dark' ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.10)'}
            iconColor={theme === 'dark' ? '#6366F1' : '#B45309'}
            icon={theme === 'dark' ? '🌙' : '☀️'}
            label={theme === 'dark'
              ? (uz ? 'Qorong\'u mavzu' : 'Тёмная тема')
              : (uz ? 'Yorug\' mavzu' : 'Светлая тема')}
            last
          >
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                width: 48, height: 28, borderRadius: 'var(--r-pill)',
                border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                background: theme === 'dark' ? 'var(--primary)' : 'rgba(100,116,139,0.3)',
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
          </SettingsRow>
        </SettingsGroup>

        {/* ── Account group ──────────────────────────────────── */}
        <SettingsGroup label={uz ? 'Hisob' : 'Аккаунт'}>
          <SettingsRow
            iconBg="rgba(242,120,75,0.10)" iconColor="var(--primary)"
            icon={<IconOrders size={16} />}
            label={t('profile.orders')}
            chevron onClick={onOrders}
          />
          <SettingsRow
            iconBg="rgba(59,130,246,0.10)" iconColor="#1D4ED8"
            icon={<IconInfo size={16} />}
            label={t('profile.about')}
            chevron last onClick={() => {}}
          />
        </SettingsGroup>

        {/* Version */}
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '4px 0 8px' }}>
          HappyTails · {t('profile.version')} 0.1
        </div>
      </div>
    </div>
  )
}

// ── SettingsGroup ─────────────────────────────────────────────
function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
        letterSpacing: '0.05em', textTransform: 'uppercase',
        padding: '0 4px 6px',
      }}>
        {label}
      </div>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}

// ── SettingsRow ───────────────────────────────────────────────
function SettingsRow({ iconBg, iconColor, icon, label, children, chevron, last, onClick }: {
  iconBg: string
  iconColor: string
  icon: React.ReactNode
  label: string
  children?: React.ReactNode
  chevron?: boolean
  last?: boolean
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', width: '100%',
        border: 'none', background: 'transparent',
        borderBottom: last ? 'none' : '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'inherit', textAlign: 'left',
        transition: onClick ? 'background .12s' : undefined,
      } as React.CSSProperties}
    >
      {/* Colored icon tile */}
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: typeof icon === 'string' ? 16 : undefined,
      }}>
        {icon}
      </div>

      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
        {label}
      </span>

      {children}

      {chevron && (
        <IconChevronRight size={16} color="var(--text-muted)" />
      )}
    </Tag>
  )
}
