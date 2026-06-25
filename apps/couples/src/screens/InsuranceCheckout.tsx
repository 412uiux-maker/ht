import { useState, useEffect } from 'react'
import { IconArrowLeft, IconTag, IconHeart } from '@ht/shared'
import type { Pet, PromoResult } from '../api'
import { api, getOwnerId } from '../api'
import { t } from '../i18n'

interface Props {
  lang: string
  onBack: () => void
  onSuccess: () => void
}

const PLANS = [
  {
    id: 'min',
    nameKey: 'ins.plan_min_name' as const,
    features: ['Ветеринарная медицина', 'Хирургия', 'Диагностика'],
    price: 1_240_000,
    cf: '#7EC8F5', ct: '#4AAAE0',
  },
  {
    id: 'ext',
    nameKey: 'ins.plan_ext_name' as const,
    features: ['Все из «Минимальной»', 'Стоматология', 'Онкология'],
    price: 2_400_000,
    cf: '#A78BFA', ct: '#7C3AED',
  },
]

const ADDONS = [
  { id: 'tick', nameKey: 'ins.addon_tick' as const, price: 600_000, cf: '#86EFAC', ct: '#22C55E' },
  { id: 'civil', nameKey: 'ins.addon_civil' as const, price: 360_000, cf: '#A3E635', ct: '#65A30D' },
]

const STUB_PETS: Pet[] = [
  { id: 'egr', name: 'Егерь', species: 'cat', avatar_emoji: '🐱', sex: 'm', owner_id: '', breed: null, birth_date: null, weight_kg: null, notes: null, created_at: '' },
  { id: 'leo', name: 'Лео', species: 'cat', avatar_emoji: '🐱', sex: 'm', owner_id: '', breed: null, birth_date: null, weight_kg: null, notes: null, created_at: '' },
  { id: 'nyu', name: 'Нюша', species: 'dog', avatar_emoji: '🐶', sex: 'f', owner_id: '', breed: null, birth_date: null, weight_kg: null, notes: null, created_at: '' },
  { id: 'grs', name: 'Грайс', species: 'dog', avatar_emoji: '🐶', sex: 'm', owner_id: '', breed: null, birth_date: null, weight_kg: null, notes: null, created_at: '' },
]

const PAYMENT_PROVIDERS = [
  { id: 'uzum', label: 'Uzum', color: '#5B21B6', bg: '#EDE9FE', text: 'U' },
  { id: 'payme', label: 'Payme', color: '#DC2626', bg: '#FEE2E2', text: 'P' },
  { id: 'click', label: 'Click', color: '#1D4ED8', bg: '#DBEAFE', text: '→' },
]

function calcDiscount(base: number, promo: PromoResult | null) {
  if (!promo) return base
  if (promo.discount_type === 'percent') return Math.round(base * (1 - promo.discount_value / 100))
  return Math.max(0, base - promo.discount_value)
}

export default function InsuranceCheckout({ lang, onBack, onSuccess }: Props) {
  void lang
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<string>('')
  const [selectedPlan, setSelectedPlan] = useState<string>('min')
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [payProvider, setPayProvider] = useState('uzum')
  const [showPromo, setShowPromo] = useState(false)
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<PromoResult | null>(null)
  const [promoErr, setPromoErr] = useState('')
  const [promoApplying, setPromoApplying] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    api.pets(getOwnerId())
      .then(list => {
        const p = list.length ? list : STUB_PETS
        setPets(p)
        setSelectedPet(p[0].id)
      })
      .catch(() => {
        setPets(STUB_PETS)
        setSelectedPet(STUB_PETS[0].id)
      })
  }, [])

  const plan = PLANS.find(p => p.id === selectedPlan)!
  const addonTotal = ADDONS.filter(a => selectedAddons.has(a.id)).reduce((s, a) => s + a.price, 0)
  const baseTotal = plan.price + addonTotal
  const finalTotal = calcDiscount(baseTotal, promo)

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromoApplying(true); setPromoErr(''); setPromo(null)
    try {
      const res = await api.validatePromo(code)
      setPromo(res); setPromoInput(res.code)
    } catch {
      setPromoErr(t('pay.promo_err'))
    } finally { setPromoApplying(false) }
  }

  const handlePay = async () => {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1800))
    if (promo) { api.usePromo(promo.code).catch(() => {}) }
    setProcessing(false)
    onSuccess()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', paddingBottom: 88 }}>

      {/* Processing overlay */}
      {processing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,255,255,.95)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, gap: 20,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: '4px solid #8B5CF6', borderTopColor: 'transparent',
            animation: 'spin .9s linear infinite',
          }} />
          <div style={{ fontWeight: 700, fontSize: 18 }}>{t('pay.processing')}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('pay.processing_sub')}</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={onBack}
          aria-label={t('back')}
          style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IconArrowLeft size={16} />
        </button>
        <span style={{ flex: 1 }} />
        <button style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconHeart size={16} /></button>
        <button style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', background: 'transparent', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⎗</button>
      </header>

      {/* Title + step */}
      <div style={{ background: 'var(--surface)', padding: '16px 20px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 14 }}>{t('ins.checkout_title')}</div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: '#EDE9FE', borderRadius: 'var(--r-pill)',
            padding: '6px 14px 6px 8px', gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: '#7C3AED', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>1</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#5B21B6', whiteSpace: 'nowrap' }}>
              {t('ins.step_prog')}
            </span>
          </div>
          {[2, 3, 4].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 20, height: 1, background: 'var(--border)' }} />
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: '1.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
              }}>{n}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Pet selector */}
        <Section title={t('ins.choose_pet')}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {pets.map(pet => {
              const active = selectedPet === pet.id
              return (
                <button
                  key={pet.id}
                  onClick={() => setSelectedPet(pet.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 6, padding: '8px 12px 10px',
                    borderRadius: 'var(--r-lg)', minWidth: 72, flexShrink: 0,
                    border: `2px solid ${active ? '#8B5CF6' : 'var(--border)'}`,
                    background: active ? '#F5F3FF' : 'var(--surface)',
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 'var(--r-md)',
                    background: active ? '#EDE9FE' : 'var(--bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 30, position: 'relative',
                  }}>
                    {pet.avatar_emoji}
                    <span style={{
                      position: 'absolute', bottom: -4, right: -4,
                      width: 16, height: 16, borderRadius: '50%',
                      background: pet.sex === 'f' ? '#EC4899' : '#3B82F6',
                      border: '2px solid var(--surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, color: '#fff', fontWeight: 700,
                    }}>
                      {pet.sex === 'f' ? '♀' : '♂'}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: active ? '#7C3AED' : 'var(--text)' }}>
                    {pet.name}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Plan selector */}
        <Section title={t('ins.choose_plan_title')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {PLANS.map(p => {
              const active = selectedPlan === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  style={{
                    padding: '16px 14px',
                    borderRadius: 'var(--r-lg)',
                    border: `2px solid ${active ? '#8B5CF6' : 'var(--border)'}`,
                    background: active ? '#F5F3FF' : 'var(--surface)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'all .15s',
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  <ShieldIcon size={48} colorFrom={p.cf} colorTo={p.ct} uid={p.id} />
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    {t(p.nameKey)}
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {p.features.map(f => (
                      <li key={f} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                        <span style={{ color: active ? '#8B5CF6' : 'var(--text-muted)', marginTop: 1 }}>•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
                      {t('ins.premium')}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: active ? '#7C3AED' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                      {p.price.toLocaleString('ru-RU')} {t('currency')}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Add-ons */}
        <Section title={t('ins.addons_title')}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {ADDONS.map(a => {
              const active = selectedAddons.has(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAddon(a.id)}
                  style={{
                    padding: '16px 14px',
                    borderRadius: 'var(--r-lg)',
                    border: `2px solid ${active ? '#22C55E' : 'var(--border)'}`,
                    background: active ? '#F0FDF4' : 'var(--surface)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'all .15s',
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  <ShieldIcon size={48} colorFrom={a.cf} colorTo={a.ct} uid={a.id} />
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.3 }}>
                    {t(a.nameKey)}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>
                      {t('ins.premium')}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: active ? '#15803D' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                      {a.price.toLocaleString('ru-RU')} {t('currency')}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Payment methods */}
        <Section title={t('ins.payment_title')}>
          <div style={{ display: 'flex', gap: 10 }}>
            {PAYMENT_PROVIDERS.map(p => {
              const active = payProvider === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setPayProvider(p.id)}
                  style={{
                    flex: 1, padding: '12px 8px',
                    borderRadius: 'var(--r-lg)',
                    border: `2px solid ${active ? p.color : 'var(--border)'}`,
                    background: active ? p.bg : 'var(--surface)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 6, fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: p.color, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 15,
                  }}>
                    {p.text}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? p.color : 'var(--text-muted)' }}>
                    {p.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Promo */}
        <button
          onClick={() => setShowPromo(x => !x)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderRadius: 'var(--r-lg)',
            background: 'var(--surface)', border: '1px solid var(--border)',
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            width: '100%',
          }}
        >
          <span style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            background: '#FEF3C7', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}><IconTag size={18} color="#92400E" /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: promo ? '#15803D' : 'var(--text)' }}>
              {promo ? `${t('pay.promo_ok')}: ${promo.code}` : t('ins.promo_row')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {promo
                ? (promo.discount_type === 'percent'
                  ? `−${promo.discount_value}% → ${finalTotal.toLocaleString('ru-RU')} ${t('currency')}`
                  : `−${promo.discount_value.toLocaleString()} ${t('currency')}`)
                : t('ins.promo_row_sub')}
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{showPromo ? '▲' : '›'}</span>
        </button>

        {showPromo && (
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-lg)',
            padding: '14px 16px', border: '1px solid var(--border)',
            marginTop: -14,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={promoInput}
                onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoErr(''); if (promo) setPromo(null) }}
                onKeyDown={e => e.key === 'Enter' && applyPromo()}
                placeholder={t('pay.promo_placeholder')}
                disabled={!!promo}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 'var(--r-md)', minHeight: 44,
                  border: `1.5px solid ${promo ? '#22C55E' : promoErr ? 'var(--danger)' : 'var(--border)'}`,
                  fontSize: 14, fontFamily: 'inherit',
                  background: promo ? '#F0FDF4' : 'var(--surface)',
                  color: promo ? '#15803D' : 'var(--text)',
                  fontWeight: promo ? 700 : 400,
                }}
              />
              <button
                onClick={promo ? () => { setPromo(null); setPromoInput('') } : applyPromo}
                disabled={promoApplying || (!promo && !promoInput.trim())}
                style={{
                  padding: '9px 16px', borderRadius: 'var(--r-md)', minHeight: 44,
                  border: 'none', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                  background: promo ? '#DCFCE7' : '#8B5CF6', color: promo ? '#15803D' : '#fff',
                  cursor: 'pointer', opacity: (promoApplying || (!promo && !promoInput.trim())) ? 0.5 : 1,
                }}
              >
                {promoApplying ? '…' : promo ? '✕' : t('pay.promo_apply')}
              </button>
            </div>
            {promoErr && <div style={{ marginTop: 8, fontSize: 13, color: 'var(--danger)' }}>{promoErr}</div>}
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        maxWidth: 480, margin: '0 auto',
        boxShadow: '0 -4px 16px rgba(0,0,0,.06)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{t('ins.total')}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {promo && (
              <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>
                {baseTotal.toLocaleString('ru-RU')}
              </span>
            )}
            <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
              {finalTotal.toLocaleString('ru-RU')} {t('currency')}
            </span>
          </div>
        </div>
        <button
          onClick={handlePay}
          disabled={!selectedPet}
          style={{
            padding: '14px 28px', borderRadius: 'var(--r-pill)',
            background: !selectedPet ? 'var(--border)' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            color: !selectedPet ? 'var(--text-muted)' : '#fff',
            border: 'none', fontWeight: 700, fontSize: 16, minHeight: 52,
            fontFamily: 'inherit', cursor: selectedPet ? 'pointer' : 'default',
            boxShadow: selectedPet ? '0 4px 16px rgba(139,92,246,.4)' : 'none',
            transition: 'all .2s',
          }}
        >
          {t('ins.pay_btn')}
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function ShieldIcon({ size = 48, colorFrom, colorTo, uid }: { size?: number; colorFrom: string; colorTo: string; uid: string }) {
  const id = `sh-co-${uid}`
  return (
    <svg width={size} height={Math.round(size * 1.15)} viewBox="0 0 52 60" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor={colorFrom} />
          <stop offset="100%" stopColor={colorTo} />
        </linearGradient>
      </defs>
      <path d="M26 3L5 12v15c0 13.8 9.2 26.7 21 30 11.8-3.3 21-16.2 21-30V12L26 3z"
        fill={`url(#${id})`} />
      <path d="M26 9L11 16.5v10.5c0 10.5 7 20 15 22.5 8-2.5 15-12 15-22.5V16.5L26 9z"
        fill="white" fillOpacity="0.2" />
    </svg>
  )
}
