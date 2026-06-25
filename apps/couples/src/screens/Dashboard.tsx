import { useEffect, useState } from 'react'
import { IconStethoscope, IconFood, IconSyringe, IconMapPin, IconShield, IconChevronRight, IconPaw, IconHeart, IconCheck } from '@ht/shared'
import type { Deed } from '../api'
import { api, getOwnerId } from '../api'
import { t } from '../i18n'
import type { Tab } from '../components/BottomNav'

interface Props {
  lang: string
  onSwitchLang: () => void
  onNavigate: (tab: Tab) => void
  onInsurance: () => void
  onFood: () => void
  onClinics: () => void
  onPlaces: () => void
}

type QuickAction = 'consult' | 'food' | 'clinics' | 'places'

const QUICK: {
  Icon: React.ComponentType<{ size?: number; color?: string }>
  bg: string
  action: QuickAction
  titleKey: 'dash.consult' | 'dash.food' | 'dash.clinics' | 'dash.places'
  subKey: 'dash.consult_sub' | 'dash.food_sub' | 'dash.clinics_sub' | 'dash.places_sub'
}[] = [
  { Icon: IconStethoscope, bg: 'linear-gradient(135deg,#F8915A,#F26B47)', action: 'consult', titleKey: 'dash.consult', subKey: 'dash.consult_sub' },
  { Icon: IconFood,        bg: 'linear-gradient(135deg,#4ADE80,#22C55E)', action: 'food',    titleKey: 'dash.food',    subKey: 'dash.food_sub'    },
  { Icon: IconSyringe,     bg: 'linear-gradient(135deg,#60A5FA,#3B82F6)', action: 'clinics', titleKey: 'dash.clinics', subKey: 'dash.clinics_sub' },
  { Icon: IconMapPin,      bg: 'linear-gradient(135deg,#4ADE80,#2E7D32)', action: 'places',  titleKey: 'dash.places',  subKey: 'dash.places_sub'  },
]

export default function Dashboard({ lang, onSwitchLang, onNavigate, onInsurance, onFood, onClinics, onPlaces }: Props) {
  void lang

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconPaw size={22} color="var(--primary)" />
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>HappyTails</span>
        </div>
        <button
          onClick={onSwitchLang}
          style={{
            padding: '6px 14px', borderRadius: 'var(--r-pill)',
            border: '1.5px solid var(--border)', background: 'transparent',
            fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', minHeight: 36,
          }}
        >
          {lang === 'ru' ? "O'zb" : 'Рус'}
        </button>
      </header>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Hero */}
        <div style={{
          borderRadius: 'var(--r-xl)',
          background: 'var(--grad-warm)',
          padding: '24px 20px 20px', color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -20, top: -20,
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)',
          }} />
          <div style={{ fontSize: 32, marginBottom: 8 }}>🐶🐱</div>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{t('dash.greeting')}</div>
          <div style={{ fontSize: 13, opacity: 0.85 }}>{t('dash.subtitle')}</div>
        </div>

        {/* Quick access grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {QUICK.map(q => (
            <button
              key={q.titleKey}
              onClick={() => {
                if (q.action === 'food') onFood()
                else if (q.action === 'clinics') onClinics()
                else if (q.action === 'places') onPlaces()
                else onNavigate(q.action === 'consult' ? 'consult' : 'learn')
              }}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: '14px',
                display: 'flex', flexDirection: 'column', gap: 8,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'box-shadow .15s',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--r-md)',
                background: q.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <q.Icon size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
                  {t(q.titleKey)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {t(q.subKey)}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Insurance banner */}
        <button
          onClick={onInsurance}
          style={{
            width: '100%', borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg,#7C3AED,#A78BFA)',
            padding: '16px 20px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
            boxShadow: '0 4px 16px rgba(124,58,237,.25)',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IconShield size={24} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 2 }}>{t('ins.banner_title')}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>{t('ins.banner_sub')}</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,.9)', color: '#7C3AED',
            padding: '6px 12px', borderRadius: 'var(--r-pill)',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            {t('ins.more')} <IconChevronRight size={14} color="#7C3AED" />
          </div>
        </button>

        {/* Deeds section */}
        <DeedsSection onSeeAll={() => onNavigate('learn')} />
      </div>
    </div>
  )
}

function DeedsSection({ onSeeAll }: { onSeeAll: () => void }) {
  const [deeds, setDeeds] = useState<Deed[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.deeds(getOwnerId())
      .then(list => { setDeeds(list); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const participate = async (id: number, type: 'donate' | 'volunteer') => {
    setSubmitting(true)
    try {
      await api.participateDeed(id, type, type === 'donate' ? Number(amount) || 50000 : undefined)
      setDone(prev => new Set([...prev, id]))
      setActive(null)
      setAmount('')
    } catch {
      //
    } finally { setSubmitting(false) }
  }

  if (loading) return null
  if (deeds.length === 0) return null

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg,#F87171,#EF4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconHeart size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{t('deeds.title')}</span>
        </div>
        <button
          onClick={onSeeAll}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: 'var(--primary)',
            padding: '4px 0', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 2,
          }}
        >
          {t('dash.all')} <IconChevronRight size={13} color="var(--primary)" />
        </button>
      </div>

      {/* Deed cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {deeds.map(deed => {
          const pct = Math.min(100, Math.round((deed.raised_amount / deed.goal_amount) * 100))
          const isDone = done.has(deed.id)
          const isOpen = active === deed.id

          return (
            <div key={deed.id} style={{
              background: 'var(--surface)',
              border: `1px solid ${isDone ? '#86EFAC' : 'var(--border)'}`,
              borderRadius: 'var(--r-lg)', overflow: 'hidden',
              transition: 'border-color .2s',
            }}>
              <div style={{ padding: '14px 16px' }}>
                {/* Header */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--r-md)',
                    background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, flexShrink: 0,
                  }}>{deed.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, lineHeight: 1.3 }}>{deed.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{deed.subtitle}</div>
                  </div>
                  {isDone && (
                    <span style={{
                      background: '#DCFCE7', color: '#15803D',
                      borderRadius: 'var(--r-pill)', padding: '3px 10px',
                      fontSize: 11, fontWeight: 700, alignSelf: 'flex-start', flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <IconCheck size={11} /> {t('deeds.done')}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginBottom: 5 }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: 'linear-gradient(90deg,#F8915A,#F26B47)',
                    borderRadius: 99, transition: 'width .4s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: isDone ? 0 : 10 }}>
                  <span>{pct}% · {deed.raised_amount.toLocaleString('ru-RU')} {t('currency')}</span>
                  <span>{deed.participants_count} {t('deeds.participants')}</span>
                </div>

                {/* Description (only when open) */}
                {isOpen && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '8px 0 0' }}>
                    {deed.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              {!isDone && (
                <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {isOpen ? (
                    <>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="number"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="50 000"
                          style={{
                            flex: 1, padding: '9px 12px', borderRadius: 'var(--r-md)',
                            border: '1.5px solid var(--border)', fontSize: 14,
                            fontFamily: 'inherit', minHeight: 44, background: 'var(--bg)',
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('currency')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => participate(deed.id, 'donate')}
                          disabled={submitting}
                          style={{
                            flex: 2, padding: '10px', borderRadius: 'var(--r-pill)',
                            background: 'var(--primary)', color: '#fff', border: 'none',
                            fontWeight: 700, fontSize: 14, cursor: 'pointer',
                            fontFamily: 'inherit', minHeight: 44, opacity: submitting ? 0.6 : 1,
                          }}
                        >{submitting ? '…' : t('deeds.donate')}</button>
                        <button
                          onClick={() => participate(deed.id, 'volunteer')}
                          disabled={submitting}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 'var(--r-pill)',
                            border: '1.5px solid var(--border)', background: 'transparent',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            fontFamily: 'inherit', minHeight: 44,
                          }}
                        >{t('deeds.volunteer')}</button>
                        <button
                          onClick={() => setActive(null)}
                          style={{
                            width: 44, height: 44, borderRadius: 'var(--r-md)',
                            border: '1.5px solid var(--border)', background: 'transparent',
                            fontSize: 14, cursor: 'pointer',
                          }}
                        >✕</button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => setActive(deed.id)}
                      style={{
                        padding: '10px', borderRadius: 'var(--r-pill)',
                        background: 'var(--primary)', color: '#fff', border: 'none',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        fontFamily: 'inherit', minHeight: 44,
                      }}
                    >{t('deeds.donate')}</button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
