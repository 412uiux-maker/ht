import { useState } from 'react'
import type { Vet, Consultation, PaymentResult, PromoResult } from '../api'
import { api } from '../api'
import { t } from '../i18n'

interface Props {
  lang: string
  consultation: Consultation
  vet: Vet
  onBack: () => void
  onPaid: (ref: string) => void
}

const PROVIDERS = [
  {
    id: 'click' as const,
    name: 'Click',
    desc: 'Mobi, internet-banking, ATM',
    color: '#1565C0',
    bg: '#E3F2FD',
  },
  {
    id: 'payme' as const,
    name: 'Payme',
    desc: 'Карта Uzcard / Humo',
    color: '#C62828',
    bg: '#FFEBEE',
  },
  {
    id: 'uzum' as const,
    name: 'Uzum Pay',
    desc: 'Кошелёк Uzum',
    color: '#E65100',
    bg: '#FFF3E0',
  },
]

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾',
}

type PayState = 'select' | 'processing' | 'success'

function calcFinal(base: number, promo: PromoResult | null): number {
  if (!promo) return base
  if (promo.discount_type === 'percent') return Math.round(base * (1 - promo.discount_value / 100))
  return Math.max(0, base - promo.discount_value)
}

export default function Payment({ lang, consultation, vet, onBack, onPaid }: Props) {
  void lang
  const [provider, setProvider] = useState<'click' | 'payme' | 'uzum'>('click')
  const [state, setState] = useState<PayState>('select')
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [err, setErr] = useState('')

  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState<PromoResult | null>(null)
  const [promoApplying, setPromoApplying] = useState(false)
  const [promoErr, setPromoErr] = useState('')

  const baseAmount = vet.price_uzs
  const finalAmount = calcFinal(baseAmount, promo)
  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromoApplying(true); setPromoErr(''); setPromo(null)
    try {
      const res = await api.validatePromo(code)
      setPromo(res)
      setPromoInput(res.code)
    } catch {
      setPromoErr(t('pay.promo_err'))
    } finally { setPromoApplying(false) }
  }

  const pay = async () => {
    setState('processing')
    setErr('')
    try {
      const [res] = await Promise.all([
        api.simulatePayment(consultation.id, provider, finalAmount),
        new Promise((r) => setTimeout(r, 1500)),
      ])
      if (promo) { api.usePromo(promo.code).catch(() => {}) }
      setResult(res)
      setState('success')
    } catch {
      setState('select')
      setErr(t('error'))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* Processing overlay */}
      {state === 'processing' && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(255,255,255,0.96)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 100, gap: 20,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            border: `4px solid ${selectedProvider.color}`,
            borderTopColor: 'transparent',
            animation: 'spin 0.9s linear infinite',
          }} />
          <div style={{ fontWeight: 700, fontSize: 18, textAlign: 'center' }}>
            {t('pay.processing')}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {t('pay.processing_sub')}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Success screen */}
      {state === 'success' && result && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          flex: 1, padding: '40px 24px', textAlign: 'center',
        }}>
          {/* Checkmark */}
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: '#D1F2E4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 52, marginBottom: 24,
          }}>
            ✅
          </div>

          <div style={{ fontWeight: 800, fontSize: 26, marginBottom: 6 }}>
            {t('pay.success')}
          </div>
          <div style={{
            fontWeight: 700, fontSize: 22, color: 'var(--primary)',
            fontVariantNumeric: 'tabular-nums', marginBottom: 4,
          }}>
            {finalAmount.toLocaleString('ru-RU')} {t('currency')}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
            {selectedProvider.name}
          </div>

          {/* Receipt tag */}
          <div style={{
            background: '#F1F2F4', borderRadius: 'var(--r-pill)',
            padding: '6px 16px', fontSize: 12, fontWeight: 600,
            color: 'var(--text-muted)', marginBottom: 8,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {t('pay.receipt')}: {result.ref}
          </div>

          {/* Vet mini-card */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 32, width: '100%', maxWidth: 320,
          }}>
            <span style={{ fontSize: 32 }}>{vet.avatar_emoji}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{vet.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {SPECIES_EMOJI[consultation.pet_species] || '🐾'} {consultation.pet_name}
              </div>
            </div>
          </div>

          <button
            onClick={() => onPaid(result.ref)}
            style={{
              width: '100%', maxWidth: 320, padding: '16px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--primary)', color: 'var(--on-primary)',
              border: 'none', fontWeight: 700, fontSize: 17, minHeight: 56,
              fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            {t('pay.go_chat')}
          </button>
        </div>
      )}

      {/* Select screen */}
      {state === 'select' && (
        <>
          {/* Header */}
          <header style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
            background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            position: 'sticky', top: 0, zIndex: 20,
          }}>
            <button
              onClick={onBack}
              aria-label={t('back')}
              style={{
                width: 44, height: 44, borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)', background: 'transparent',
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ←
            </button>
            <span style={{ fontWeight: 700, fontSize: 17 }}>{t('pay.title')}</span>
          </header>
          <StepBar step={2} />

          <div style={{ flex: 1, padding: '20px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Order summary */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', overflow: 'hidden',
            }}>
              <div style={{
                background: 'var(--grad-warm)', padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 'var(--r-md)',
                  background: 'rgba(255,255,255,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, flexShrink: 0,
                }}>
                  {vet.avatar_emoji}
                </div>
                <div style={{ color: '#fff' }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{vet.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>{vet.specialty}</div>
                </div>
              </div>
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Row label={t('pay.vet')} value={vet.name} />
                <Row
                  label={t('pay.pet')}
                  value={`${SPECIES_EMOJI[consultation.pet_species] || '🐾'} ${consultation.pet_name}`}
                />
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                {promo && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('pay.amount')}</span>
                      <span style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>
                        {baseAmount.toLocaleString('ru-RU')} {t('currency')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#2E7D32', fontWeight: 600 }}>
                        {t('pay.discount')} ({promo.discount_type === 'percent' ? `${promo.discount_value}%` : `${promo.discount_value.toLocaleString()} ${t('currency')}`})
                      </span>
                      <span style={{ fontSize: 13, color: '#2E7D32', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        −{(baseAmount - finalAmount).toLocaleString('ru-RU')} {t('currency')}
                      </span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {t('pay.amount')}
                  </span>
                  <span style={{
                    fontSize: 20, fontWeight: 800, color: 'var(--primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {finalAmount.toLocaleString('ru-RU')} {t('currency')}
                  </span>
                </div>
              </div>
            </div>

            {/* Promo code */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', padding: '14px 16px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>
                {t('pay.promo_label')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoErr(''); if (promo) setPromo(null) }}
                  onKeyDown={e => e.key === 'Enter' && applyPromo()}
                  placeholder={t('pay.promo_placeholder')}
                  disabled={!!promo}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: 'var(--r-md)',
                    border: `1.5px solid ${promo ? '#2E7D32' : promoErr ? 'var(--danger)' : 'var(--border)'}`,
                    fontSize: 14, fontFamily: 'inherit', minHeight: 44,
                    background: promo ? '#F1FDF4' : 'var(--surface)',
                    fontWeight: promo ? 700 : 400, letterSpacing: promo ? '.04em' : 0,
                    color: promo ? '#2E7D32' : 'var(--text)',
                  }}
                />
                <button
                  onClick={promo ? () => { setPromo(null); setPromoInput('') } : applyPromo}
                  disabled={promoApplying || (!promo && !promoInput.trim())}
                  style={{
                    padding: '9px 16px', borderRadius: 'var(--r-md)', minHeight: 44,
                    border: 'none', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                    background: promo ? '#E8F5E9' : 'var(--primary)', color: promo ? '#2E7D32' : '#fff',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    opacity: (promoApplying || (!promo && !promoInput.trim())) ? 0.5 : 1,
                  }}
                >
                  {promoApplying ? '…' : promo ? '✕' : t('pay.promo_apply')}
                </button>
              </div>
              {promo && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#2E7D32', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✅ {t('pay.promo_ok')}
                </div>
              )}
              {promoErr && (
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--danger)' }}>{promoErr}</div>
              )}
            </div>

            {/* Provider select */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
                {t('pay.method')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PROVIDERS.map((p) => {
                  const active = provider === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 'var(--r-lg)',
                        border: `2px solid ${active ? p.color : 'var(--border)'}`,
                        background: active ? p.bg : 'var(--surface)',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        transition: 'all .15s',
                      }}
                    >
                      {/* Logo pill */}
                      <div style={{
                        width: 60, height: 34, borderRadius: 8,
                        background: p.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: 11,
                        letterSpacing: '0.03em', flexShrink: 0,
                      }}>
                        {p.name.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.desc}</div>
                      </div>
                      {/* Radio */}
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: `2.5px solid ${active ? p.color : 'var(--border)'}`,
                        background: active ? p.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .15s',
                      }}>
                        {active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {err && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--r-md)',
                background: '#FFE0DE', color: 'var(--danger)', fontSize: 14,
              }}>
                {err}
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={pay}
              style={{
                padding: '16px', borderRadius: 'var(--r-pill)',
                background: selectedProvider.color, color: '#fff',
                border: 'none', fontWeight: 700, fontSize: 17, minHeight: 56,
                fontFamily: 'inherit', cursor: 'pointer',
                transition: 'opacity .15s',
              }}
            >
              {t('pay.btn')} {finalAmount.toLocaleString('ru-RU')} {t('currency')} · {selectedProvider.name}
            </button>

            {/* Demo disclaimer */}
            <div style={{
              textAlign: 'center', fontSize: 12,
              color: 'var(--text-muted)', padding: '0 8px',
            }}>
              🔒 {t('pay.demo')}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const labels = [t('book.step_form'), t('book.step_pay'), t('book.step_chat')]
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', padding: '10px 24px 12px',
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    }}>
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const done = n < step
        const active = n === step
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < labels.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: active || done ? 'var(--primary)' : 'var(--border)',
                color: active || done ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12,
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{
                fontSize: 11, whiteSpace: 'nowrap',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 400,
              }}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 6px', marginBottom: 14,
                background: done ? 'var(--primary)' : 'var(--border)',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
