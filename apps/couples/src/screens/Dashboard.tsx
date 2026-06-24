import { useEffect, useState } from 'react'
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
}

const QUICK = [
  { icon: '🩺', bg: 'linear-gradient(135deg,#F8915A,#F26B47)', action: 'consult'  as const, titleKey: 'dash.consult'  as const, subKey: 'dash.consult_sub'  as const },
  { icon: '🥗', bg: 'linear-gradient(135deg,#4ADE80,#22C55E)', action: 'food'     as const, titleKey: 'dash.food'     as const, subKey: 'dash.food_sub'     as const },
  { icon: '🏥', bg: 'linear-gradient(135deg,#60A5FA,#3B82F6)', action: 'clinics'  as const, titleKey: 'dash.clinics'  as const, subKey: 'dash.clinics_sub'  as const },
  { icon: '❤️', bg: 'linear-gradient(135deg,#F472B6,#EC4899)', action: 'deeds'    as const, titleKey: 'dash.deeds'    as const, subKey: 'dash.deeds_sub'    as const },
]

export default function Dashboard({ lang, onSwitchLang, onNavigate, onInsurance, onFood, onClinics }: Props) {
  void lang
  const [featuredDeed, setFeaturedDeed] = useState<Deed | null>(null)

  useEffect(() => {
    api.deeds(getOwnerId()).then(list => setFeaturedDeed(list[0] ?? null)).catch(() => {})
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🐾</span>
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
                fontSize: 20,
              }}>
                {q.icon}
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
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
          }}>🛡️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 2 }}>{t('ins.banner_title')}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>{t('ins.banner_sub')}</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,.9)', color: '#7C3AED',
            padding: '6px 12px', borderRadius: 'var(--r-pill)',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {t('ins.more')} →
          </div>
        </button>

        {/* Featured deed */}
        {featuredDeed && (
          <button
            onClick={() => onNavigate('learn')}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', padding: '16px', width: '100%',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>{featuredDeed.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {t('deeds.title')}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{featuredDeed.title}</div>
              </div>
            </div>
            <ProgressBar value={featuredDeed.raised_amount} max={featuredDeed.goal_amount} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>{t('deeds.raised')}: {featuredDeed.raised_amount.toLocaleString('ru-RU')} {t('currency')}</span>
              <span>{featuredDeed.participants_count} {t('deeds.participants')}</span>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: 99, transition: 'width .4s' }} />
    </div>
  )
}
