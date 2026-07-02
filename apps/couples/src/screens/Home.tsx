import { useEffect, useMemo, useState } from 'react'
import { IconShield, IconSearch, IconAlertCircle, IconStarFilled } from '@ht/shared'
import type { Vet, VetReview } from '../api'
import { api } from '../api'
import { t, getLang } from '../i18n'

interface Props {
  lang: string
  onSwitchLang: () => void
  onSelectVet: (vet: Vet) => void
  onInsurance: () => void
  onAiChat: () => void
}

const QUICK_KEYS = ['ai.q1', 'ai.q2', 'ai.q3'] as const

export default function Home({ lang, onSwitchLang, onSelectVet, onInsurance, onAiChat }: Props) {
  void lang
  const isRu = getLang() !== 'uz'
  const [vets, setVets] = useState<Vet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [activeSpec, setActiveSpec] = useState('')

  const load = () => {
    setLoading(true)
    setError(false)
    api.vets()
      .then(data => setVets(data.filter(v => v.is_available)))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const specialties = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    vets.forEach(v => {
      const key = v.specialty.split(' (')[0].trim()
      if (!seen.has(key)) { seen.add(key); result.push(key) }
    })
    return result
  }, [vets])

  const filtered = useMemo(() => vets.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.specialty.toLowerCase().includes(q)
    const matchSpec = !activeSpec || v.specialty.startsWith(activeSpec)
    return matchSearch && matchSpec
  }), [vets, search, activeSpec])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>🐾</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>HappyTails</span>
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

      {/* ── AI Consultation Card ───────────────────────────────────── */}
      <div style={{ padding: '16px 16px 0' }}>
        <button
          onClick={onAiChat}
          style={{
            width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
            background: 'none', padding: 0, fontFamily: 'inherit',
          }}
        >
          <div style={{
            borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg, #5B3BDB 0%, #7C82E8 45%, #F2784B 100%)',
            padding: '20px 20px 16px',
            boxShadow: '0 6px 24px rgba(92,58,220,.28)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circle */}
            <div style={{
              position: 'absolute', right: -24, top: -24,
              width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(255,255,255,.08)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', right: 20, bottom: -32,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,.06)',
              pointerEvents: 'none',
            }} />

            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              {/* Avatar */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, backdropFilter: 'blur(4px)',
                border: '1.5px solid rgba(255,255,255,.25)',
              }}>
                🤖
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 3, lineHeight: 1.2 }}>
                  {t('ai.title')}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', lineHeight: 1.4 }}>
                  {t('ai.subtitle')}
                </div>
                {/* Badges */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {[
                    isRu ? 'Бесплатно' : 'Bepul',
                    isRu ? 'Сразу' : 'Darhol',
                    '24/7',
                  ].map(label => (
                    <span key={label} style={{
                      background: 'rgba(255,255,255,.18)',
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      padding: '2px 9px', borderRadius: 'var(--r-pill)',
                      border: '1px solid rgba(255,255,255,.25)',
                      backdropFilter: 'blur(4px)',
                    }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick-question chips */}
            <div style={{
              display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none',
              marginBottom: 16, paddingBottom: 2,
            }}>
              {QUICK_KEYS.map(k => (
                <span key={k} style={{
                  whiteSpace: 'nowrap', background: 'rgba(255,255,255,.14)',
                  backdropFilter: 'blur(4px)', color: 'rgba(255,255,255,.9)',
                  fontSize: 12, fontWeight: 500,
                  padding: '5px 12px', borderRadius: 'var(--r-pill)',
                  border: '1px solid rgba(255,255,255,.2)',
                }}>
                  {t(k)}
                </span>
              ))}
            </div>

            {/* CTA button */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>
                ⚠️ {isRu ? 'Не заменяет врача' : 'Shifokorni almashtirmaydi'}
              </div>
              <div style={{
                background: '#fff',
                color: '#5B3BDB',
                padding: '10px 20px', borderRadius: 'var(--r-pill)',
                fontSize: 14, fontWeight: 800,
                boxShadow: '0 2px 10px rgba(0,0,0,.12)',
                flexShrink: 0,
              }}>
                {isRu ? 'Спросить AI →' : 'AI ga so\'rash →'}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* ── Insurance banner ─────────────────────────────────────── */}
      <div style={{ padding: '10px 16px 0' }}>
        <button
          onClick={onInsurance}
          style={{
            width: '100%', borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
            padding: '14px 18px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
            boxShadow: '0 4px 16px rgba(124,58,237,.25)',
            fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconShield size={20} color="rgba(255,255,255,.9)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 1 }}>
              {t('ins.banner_title')}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
              {t('ins.banner_sub')}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,.9)', color: '#7C3AED',
            padding: '5px 12px', borderRadius: 'var(--r-pill)',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {t('ins.more')} →
          </div>
        </button>
      </div>

      {/* ── Section title ────────────────────────────────────────── */}
      <div style={{ padding: '20px 16px 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.4px', whiteSpace: 'nowrap' }}>
          {isRu ? 'ИЛИ ЗАПИШИТЕСЬ К ВЕТЕРИНАРУ' : 'YOKI VETERINARGA YOZILING'}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* ── Search ────────────────────────────────────────────────── */}
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
            display: 'flex', alignItems: 'center',
          }}>
            <IconSearch size={16} />
          </span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('home.search')}
            style={{
              width: '100%', padding: '11px 14px 11px 40px', borderRadius: 'var(--r-pill)',
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              fontSize: 15, color: 'var(--text)', outline: 'none', minHeight: 44,
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── Specialty tabs ───────────────────────────────────────── */}
      {!loading && !error && specialties.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, padding: '10px 16px 2px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {['', ...specialties].map(spec => (
            <button
              key={spec || '__all'}
              onClick={() => setActiveSpec(spec)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--r-pill)', whiteSpace: 'nowrap',
                border: '1.5px solid', fontSize: 13, fontWeight: 600, minHeight: 36,
                background: activeSpec === spec ? 'var(--primary)' : 'var(--surface)',
                color: activeSpec === spec ? 'var(--on-primary)' : 'var(--text-muted)',
                borderColor: activeSpec === spec ? 'var(--primary)' : 'var(--border)',
                transition: 'all .15s', fontFamily: 'inherit',
              }}
            >
              {spec || t('home.filter_all')}
            </button>
          ))}
        </div>
      )}

      {/* ── Vet list ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0', fontSize: 15 }}>
            {t('loading')}
          </div>
        )}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ marginBottom: 12 }}><IconAlertCircle size={32} color="var(--text-muted)" /></div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{t('error')}</div>
            <button
              onClick={load}
              style={{
                padding: '10px 24px', borderRadius: 'var(--r-pill)',
                background: 'var(--primary)', color: 'var(--on-primary)',
                border: 'none', fontWeight: 600, fontSize: 14, minHeight: 44,
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              {t('retry')}
            </button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0', fontSize: 15 }}>
            {t('home.no_vets')}
          </div>
        )}
        {!loading && !error && filtered.map(vet => (
          <VetCard key={vet.id} vet={vet} onSelect={onSelectVet} />
        ))}
      </div>
    </div>
  )
}

// ── VetCard ─────────────────────────────────────────────────────────────────

function VetCard({ vet, onSelect }: { vet: Vet; onSelect: (v: Vet) => void }) {
  const [bioExpanded, setBioExpanded] = useState(false)
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [reviews, setReviews] = useState<VetReview[] | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const toggleReviews = async () => {
    if (reviewsOpen) { setReviewsOpen(false); return }
    setReviewsOpen(true)
    if (reviews !== null) return
    setReviewsLoading(true)
    try {
      const data = await api.vetReviews(vet.id)
      setReviews(data)
    } catch { setReviews([]) }
    finally { setReviewsLoading(false) }
  }

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r-lg)',
      border: '1px solid var(--border)',
      boxShadow: '0 2px 8px rgba(35,40,45,.06)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            fontSize: 40, width: 64, height: 64, borderRadius: 'var(--r-md)',
            background: 'var(--surface-2)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, position: 'relative',
          }}>
            {vet.avatar_emoji}
            <span style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 14, height: 14, borderRadius: '50%',
              background: '#22c55e', border: '2px solid var(--surface)',
            }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{vet.name}</div>
              {vet.is_verified && (
                <span title="Верифицирован" style={{ display: 'flex', alignItems: 'center' }}>
                  <IconShield size={15} color="var(--primary)" />
                </span>
              )}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>{vet.specialty}</div>
            <div style={{ display: 'flex', gap: 10, fontSize: 13, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={toggleReviews}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  color: '#d97706', fontWeight: 600, background: 'none',
                  border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                }}
              >
                <IconStarFilled size={13} color="#d97706" />
                {Number(vet.rating).toFixed(1)}
                {vet.review_count > 0 && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>
                    ({vet.review_count})
                  </span>
                )}
              </button>
              <span style={{ color: 'var(--text-muted)' }}>
                {vet.experience_yr} {t('home.exp')}
              </span>
              <span style={{
                background: '#dcfce7', color: '#15803d',
                borderRadius: 'var(--r-pill)', padding: '1px 8px', fontSize: 12, fontWeight: 600,
              }}>
                <span style={{
                  display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                  background: '#15803d', marginRight: 4, verticalAlign: 'middle',
                }} />
                {t('home.available')}
              </span>
            </div>
          </div>
        </div>

        {vet.bio && (
          <div style={{ marginTop: 10 }}>
            <div style={{
              fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box', WebkitLineClamp: bioExpanded ? 99 : 2,
              WebkitBoxOrient: 'vertical' as const,
            }}>
              {vet.bio}
            </div>
            {vet.bio.length > 80 && (
              <button
                onClick={() => setBioExpanded(x => !x)}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: 12, color: 'var(--primary)', fontWeight: 600,
                  marginTop: 2, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {bioExpanded ? '↑' : t('home.bio')}
              </button>
            )}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)',
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
              {vet.price_uzs.toLocaleString('ru-RU')}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{t('home.price')}</span>
          </div>
          <button
            onClick={() => onSelect(vet)}
            style={{
              padding: '10px 22px', borderRadius: 'var(--r-pill)',
              background: 'var(--primary)', color: 'var(--on-primary)',
              border: 'none', fontWeight: 700, fontSize: 14, minHeight: 44,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t('home.book')}
          </button>
        </div>
      </div>

      {reviewsOpen && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          {reviewsLoading && (
            <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
              {t('loading')}
            </div>
          )}
          {!reviewsLoading && reviews !== null && reviews.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
              {t('home.no_reviews')}
            </div>
          )}
          {!reviewsLoading && reviews && reviews.map((r, i) => (
            <div key={r.id} style={{
              padding: '12px 16px',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize: 12, opacity: s <= r.rating ? 1 : 0.25 }}>★</span>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {r.client_name ?? '—'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {r.text && (
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{r.text}</div>
              )}
              {r.reply && (
                <div style={{
                  marginTop: 6, padding: '8px 12px',
                  background: 'rgba(242,120,75,.06)', borderRadius: 'var(--r-sm)',
                  fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
                  borderLeft: '2px solid var(--primary)',
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{vet.name}: </span>
                  {r.reply}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

