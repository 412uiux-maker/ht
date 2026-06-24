import { useEffect, useMemo, useState } from 'react'
import type { Vet } from '../api'
import { api } from '../api'
import { t } from '../i18n'

interface Props {
  lang: string
  onSwitchLang: () => void
  onSelectVet: (vet: Vet) => void
  onInsurance: () => void
}

export default function Home({ lang, onSwitchLang, onSelectVet, onInsurance }: Props) {
  void lang
  const [vets, setVets] = useState<Vet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [activeSpec, setActiveSpec] = useState('')

  const load = () => {
    setLoading(true)
    setError(false)
    api.vets()
      .then((data) => setVets(data.filter((v) => v.is_available)))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const specialties = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    vets.forEach((v) => {
      const key = v.specialty.split(' (')[0].trim()
      if (!seen.has(key)) { seen.add(key); result.push(key) }
    })
    return result
  }, [vets])

  const filtered = useMemo(() => {
    return vets.filter((v) => {
      const q = search.toLowerCase()
      const matchSearch = !q || v.name.toLowerCase().includes(q) || v.specialty.toLowerCase().includes(q)
      const matchSpec = !activeSpec || v.specialty.startsWith(activeSpec)
      return matchSearch && matchSpec
    })
  }, [vets, search, activeSpec])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
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

      {/* Hero */}
      <div style={{
        margin: '16px 16px 0', borderRadius: 'var(--r-xl)',
        background: 'var(--grad-warm)', padding: '24px 24px 20px', color: '#fff',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🐶🐱</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{t('home.title')}</div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>{t('home.subtitle')}</div>
      </div>

      {/* Insurance banner */}
      <div style={{ padding: '12px 16px 0' }}>
        <button
          onClick={onInsurance}
          style={{
            width: '100%', borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
            padding: '16px 20px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
            boxShadow: '0 4px 16px rgba(124,58,237,.25)',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0,
          }}>🛡️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 2 }}>
              {t('ins.banner_title')}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
              {t('ins.banner_sub')}
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,.9)', color: '#7C3AED',
            padding: '6px 14px', borderRadius: 'var(--r-pill)',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {t('ins.more')} →
          </div>
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, color: 'var(--text-muted)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('home.search')}
            style={{
              width: '100%', padding: '11px 14px 11px 40px', borderRadius: 'var(--r-pill)',
              border: '1.5px solid var(--border)', background: 'var(--surface)',
              fontSize: 15, color: 'var(--text)', outline: 'none', minHeight: 44,
            }}
          />
        </div>
      </div>

      {/* Specialty tabs */}
      {!loading && !error && specialties.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, padding: '10px 16px 2px',
          overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {['', ...specialties].map((spec) => (
            <button
              key={spec || '__all'}
              onClick={() => setActiveSpec(spec)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--r-pill)', whiteSpace: 'nowrap',
                border: '1.5px solid', fontSize: 13, fontWeight: 600, minHeight: 36,
                background: activeSpec === spec ? 'var(--primary)' : 'var(--surface)',
                color: activeSpec === spec ? 'var(--on-primary)' : 'var(--text-muted)',
                borderColor: activeSpec === spec ? 'var(--primary)' : 'var(--border)',
                transition: 'all .15s',
              }}
            >
              {spec || t('home.filter_all')}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0', fontSize: 15 }}>
            {t('loading')}
          </div>
        )}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '48px 16px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{t('error')}</div>
            <button
              onClick={load}
              style={{
                padding: '10px 24px', borderRadius: 'var(--r-pill)',
                background: 'var(--primary)', color: 'var(--on-primary)',
                border: 'none', fontWeight: 600, fontSize: 14, minHeight: 44,
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
        {!loading && !error && filtered.map((vet) => (
          <VetCard key={vet.id} vet={vet} onSelect={onSelectVet} />
        ))}
      </div>
    </div>
  )
}

function VetCard({ vet, onSelect }: { vet: Vet; onSelect: (v: Vet) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r-lg)',
      padding: '16px', border: '1px solid var(--border)',
      boxShadow: '0 2px 8px rgba(35,40,45,.06)',
    }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Avatar */}
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

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{vet.name}</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>{vet.specialty}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#d97706', fontWeight: 600 }}>
              ⭐ {Number(vet.rating).toFixed(1)}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {vet.experience_yr} {t('home.exp')}
            </span>
            <span style={{
              background: '#dcfce7', color: '#15803d',
              borderRadius: 'var(--r-pill)', padding: '1px 8px', fontSize: 12, fontWeight: 600,
            }}>
              🟢 {t('home.available')}
            </span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {vet.bio && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
            overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: expanded ? 99 : 2,
            WebkitBoxOrient: 'vertical' as const,
          }}>
            {vet.bio}
          </div>
          {vet.bio.length > 80 && (
            <button
              onClick={() => setExpanded((x) => !x)}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 12, color: 'var(--primary)', fontWeight: 600,
                marginTop: 2, cursor: 'pointer',
              }}
            >
              {expanded ? '↑' : t('home.bio')}
            </button>
          )}
        </div>
      )}

      {/* Footer */}
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
          }}
        >
          {t('home.book')}
        </button>
      </div>
    </div>
  )
}
