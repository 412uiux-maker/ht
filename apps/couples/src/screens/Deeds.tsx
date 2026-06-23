import { useEffect, useState } from 'react'
import type { Deed } from '../api'
import { api, getOwnerId } from '../api'
import { t } from '../i18n'

export default function Deeds({ lang }: { lang: string }) {
  void lang
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

  const participate = async (id: number, type: 'donate' | 'volunteer' | 'share') => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
      <header style={{
        display: 'flex', alignItems: 'center', padding: '14px 20px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{t('deeds.title')}</span>
      </header>

      <div style={{ flex: 1, padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>{t('loading')}</div>}
        {!loading && deeds.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>{t('deeds.empty')}</div>
        )}

        {!loading && deeds.map(deed => {
          const pct = Math.min(100, Math.round((deed.raised_amount / deed.goal_amount) * 100))
          const isDone = done.has(deed.id)
          const isOpen = active === deed.id

          return (
            <div key={deed.id} style={{
              background: 'var(--surface)', border: `1px solid ${isDone ? '#86EFAC' : 'var(--border)'}`,
              borderRadius: 'var(--r-lg)', overflow: 'hidden',
              transition: 'border-color .15s',
            }}>
              <div style={{ padding: '16px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--r-md)',
                    background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, flexShrink: 0,
                  }}>{deed.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{deed.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{deed.subtitle}</div>
                  </div>
                  {isDone && (
                    <span style={{
                      background: '#DCFCE7', color: '#15803D',
                      borderRadius: 'var(--r-pill)', padding: '3px 10px',
                      fontSize: 11, fontWeight: 700, alignSelf: 'flex-start',
                    }}>✓</span>
                  )}
                </div>

                {/* Progress */}
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: 'linear-gradient(90deg,#F8915A,#F26B47)',
                    borderRadius: 99, transition: 'width .4s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  <span>{pct}% · {deed.raised_amount.toLocaleString('ru-RU')} {t('currency')}</span>
                  <span>{deed.participants_count} {t('deeds.participants')}</span>
                </div>

                {/* Description (truncated) */}
                {!isOpen && (
                  <p style={{
                    fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}>{deed.description}</p>
                )}
                {isOpen && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{deed.description}</p>
                )}
              </div>

              {/* Actions */}
              {!isDone && (
                <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                            border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'inherit', minHeight: 44,
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
                            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
                            opacity: submitting ? 0.6 : 1,
                          }}
                        >{submitting ? '…' : t('deeds.donate')}</button>
                        <button
                          onClick={() => participate(deed.id, 'volunteer')}
                          disabled={submitting}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 'var(--r-pill)',
                            border: '1.5px solid var(--border)', background: 'transparent',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
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
                        fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
                      }}
                    >{t('deeds.donate')}</button>
                  )}
                </div>
              )}
              {isDone && (
                <div style={{
                  margin: '0 16px 16px', padding: '10px', borderRadius: 'var(--r-md)',
                  background: '#F0FDF4', color: '#15803D', textAlign: 'center',
                  fontSize: 13, fontWeight: 600,
                }}>
                  ✓ {t('deeds.done')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
