import { useEffect, useState } from 'react'
import {
  IconStethoscope, IconFood, IconSyringe, IconMapPin,
  IconShield, IconChevronRight, IconPaw, IconHeart,
  IconCheck, IconArrowRight,
} from '@ht/shared'
import type { Deed, Pet } from '../api'
import { api, getOwnerId } from '../api'
import { t, getLang } from '../i18n'
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

// ── Pet species → badge color ─────────────────────────────────
const PET_SC: Record<string, { bg: string; text: string }> = {
  cat:     { bg: 'rgba(168,85,247,0.10)',  text: '#7C3AED' },
  dog:     { bg: 'rgba(242,120,75,0.11)',  text: '#C0511F' },
  rabbit:  { bg: 'rgba(20,184,166,0.10)',  text: '#0F766E' },
  parrot:  { bg: 'rgba(234,179,8,0.10)',   text: '#92400E' },
  hamster: { bg: 'rgba(234,88,12,0.10)',   text: '#9A3412' },
  fish:    { bg: 'rgba(59,130,246,0.10)',  text: '#1D4ED8' },
  other:   { bg: 'rgba(100,116,139,0.10)', text: '#475569' },
}
const petSC = (s: string) => PET_SC[s] ?? PET_SC.other

export default function Dashboard({
  lang, onSwitchLang, onNavigate, onInsurance, onFood, onClinics, onPlaces,
}: Props) {
  const [pets, setPets] = useState<Pet[] | null>(null)
  const uz = getLang() === 'uz'
  void lang

  useEffect(() => {
    api.pets(getOwnerId()).then(setPets).catch(() => setPets([]))
  }, [])

  const firstPet = pets?.[0] ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <IconPaw size={20} color="var(--primary)" />
          <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>HappyTails</span>
        </div>
        <button
          onClick={onSwitchLang}
          style={{
            padding: '5px 12px', borderRadius: 'var(--r-pill)',
            border: '1.5px solid var(--border)', background: 'transparent',
            fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
            minHeight: 32, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {lang === 'ru' ? "O'zb" : 'Рус'}
        </button>
      </header>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Hero ────────────────────────────────────────────── */}
        <HeroCard
          pets={pets}
          firstPet={firstPet}
          uz={uz}
          onConsult={() => onNavigate('consult')}
          onAddPet={() => onNavigate('pets')}
        />

        {/* ── Quick actions ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Consultation — featured full-width */}
          <button
            onClick={() => onNavigate('consult')}
            style={{
              width: '100%', borderRadius: 'var(--r-xl)',
              background: 'linear-gradient(135deg,#F8915A,#F26B47)',
              padding: '16px 18px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
              fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(242,107,71,.22)',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--r-lg)',
              background: 'rgba(255,255,255,.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <IconStethoscope size={24} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 2 }}>
                {t('dash.consult')}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)' }}>
                {t('dash.consult_sub')}
              </div>
            </div>
            <div style={{
              background: 'rgba(255,255,255,.22)', borderRadius: 'var(--r-pill)',
              padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {uz ? 'Boshlash' : 'Начать'} <IconArrowRight size={13} color="#fff" />
            </div>
          </button>

          {/* Secondary actions — compact icon chips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {([
              { icon: <IconFood size={20} color="#fff" />, bg: 'rgba(34,197,94,0.12)', iconBg: '#22C55E', label: t('dash.food'), onClick: onFood },
              { icon: <IconSyringe size={20} color="#fff" />, bg: 'rgba(59,130,246,0.10)', iconBg: '#3B82F6', label: t('dash.clinics'), onClick: onClinics },
              { icon: <IconMapPin size={20} color="#fff" />, bg: 'rgba(20,184,166,0.10)', iconBg: '#14B8A6', label: t('dash.places'), onClick: onPlaces },
            ] as const).map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                style={{
                  padding: '12px 8px 10px', borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                  transition: 'border-color .15s',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 'var(--r-md)',
                  background: item.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Insurance banner ─────────────────────────────────── */}
        <button
          onClick={onInsurance}
          style={{
            width: '100%', borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg,#6D28D9,#7C3AED)',
            padding: '14px 18px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
            fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IconShield size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 1 }}>
              {t('ins.banner_title')}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.78)' }}>
              {t('ins.banner_sub')}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,.18)', borderRadius: 'var(--r-pill)',
            padding: '6px 12px',
            fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.95)', flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            {t('ins.more')} <IconChevronRight size={13} color="rgba(255,255,255,.9)" />
          </div>
        </button>

        {/* ── Deeds ────────────────────────────────────────────── */}
        <DeedsSection />
      </div>
    </div>
  )
}

// ─── HeroCard ─────────────────────────────────────────────────
function HeroCard({ pets, firstPet, uz, onConsult, onAddPet }: {
  pets: Pet[] | null
  firstPet: Pet | null
  uz: boolean
  onConsult: () => void
  onAddPet: () => void
}) {
  const hasPets = pets !== null && pets.length > 0
  const loading = pets === null

  return (
    <div style={{
      borderRadius: 'var(--r-xl)',
      background: 'var(--grad-warm)',
      padding: '20px 20px 18px', color: '#fff',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative circle */}
      <div aria-hidden style={{
        position: 'absolute', right: -32, top: -32,
        width: 130, height: 130, borderRadius: '50%',
        background: 'rgba(255,255,255,.10)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', right: 20, bottom: -20,
        width: 70, height: 70, borderRadius: '50%',
        background: 'rgba(255,255,255,.07)',
        pointerEvents: 'none',
      }} />

      {loading ? (
        // Skeleton state
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 14, width: '50%', borderRadius: 6, background: 'rgba(255,255,255,.2)' }} />
          <div style={{ height: 10, width: '65%', borderRadius: 6, background: 'rgba(255,255,255,.15)' }} />
        </div>
      ) : hasPets ? (
        // Personalized: has pets
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--r-md)',
              background: 'rgba(255,255,255,.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, flexShrink: 0,
              border: '2px solid rgba(255,255,255,.3)',
            }}>
              {firstPet!.avatar_emoji}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>
                {firstPet!.name}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                {uz ? "Bugun qanday ahvolda?" : 'Как дела сегодня?'}
              </div>
            </div>
            {pets!.length > 1 && (
              <div style={{
                marginLeft: 'auto', display: 'flex', gap: -6, flexShrink: 0,
              }}>
                {pets!.slice(1, 4).map((p, i) => (
                  <div key={p.id} style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(255,255,255,.22)',
                    border: '2px solid rgba(255,255,255,.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, marginLeft: i === 0 ? 0 : -8,
                  }}>
                    {p.avatar_emoji}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onConsult}
            style={{
              padding: '9px 18px', borderRadius: 'var(--r-pill)',
              background: 'rgba(255,255,255,.22)', color: '#fff',
              border: '1.5px solid rgba(255,255,255,.35)',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 38,
            }}
          >
            <IconStethoscope size={14} color="#fff" />
            {uz ? 'Muammo bormi?' : 'Есть проблема?'}
          </button>
        </div>
      ) : (
        // No pets — onboarding prompt
        <div>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🐾</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
            {t('dash.greeting')}
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>
            {t('dash.subtitle')}
          </div>
          <button
            onClick={onAddPet}
            style={{
              padding: '9px 18px', borderRadius: 'var(--r-pill)',
              background: 'rgba(255,255,255,.22)', color: '#fff',
              border: '1.5px solid rgba(255,255,255,.35)',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 38,
            }}
          >
            <IconPaw size={14} color="#fff" />
            {uz ? "Hayvon qo'shish" : 'Добавить питомца'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── DeedsSection ─────────────────────────────────────────────
function DeedsSection() {
  const [deeds, setDeeds] = useState<Deed[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<number | null>(null)
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const uz = getLang() === 'uz'

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
    } catch { /* noop */ }
    finally { setSubmitting(false) }
  }

  if (loading || deeds.length === 0) return null

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'rgba(239,68,68,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconHeart size={13} color="#EF4444" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{t('deeds.title')}</span>
        </div>
        <span style={{
          fontSize: 12, color: 'var(--text-muted)',
        }}>
          {deeds.length} {uz ? 'tashabbus' : 'инициатив'}
        </span>
      </div>

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
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  {/* Emoji tile with warm tint */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 'var(--r-md)', flexShrink: 0,
                    background: isDone
                      ? 'rgba(34,197,94,0.10)'
                      : 'rgba(242,120,75,0.09)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                  }}>
                    {deed.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, lineHeight: 1.3 }}>
                      {deed.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {deed.subtitle}
                    </div>
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

                {/* Progress */}
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: isDone
                      ? 'linear-gradient(90deg,#4ade80,#22c55e)'
                      : 'linear-gradient(90deg,#F8915A,#F26B47)',
                    borderRadius: 99, transition: 'width .4s',
                  }} />
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, color: 'var(--text-muted)',
                  marginBottom: isDone ? 0 : 8,
                }}>
                  <span style={{ fontWeight: 600, color: isDone ? '#15803D' : 'var(--primary)' }}>
                    {pct}%
                  </span>
                  <span>
                    {deed.raised_amount.toLocaleString('ru-RU')} {t('currency')} · {deed.participants_count} {t('deeds.participants')}
                  </span>
                </div>

                {isOpen && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: '8px 0 0' }}>
                    {deed.description}
                  </p>
                )}
              </div>

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
                            fontFamily: 'inherit', minHeight: 44,
                            background: 'var(--bg)', color: 'var(--text)',
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
