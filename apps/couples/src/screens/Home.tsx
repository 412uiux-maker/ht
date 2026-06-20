import { useEffect, useState } from 'react'
import { api, Vet } from '../api'
import { t } from '../i18n'

interface Props {
  lang: string
  onSwitchLang: () => void
  onSelectVet: (vet: Vet) => void
}

export default function Home({ lang, onSwitchLang, onSelectVet }: Props) {
  const [vets, setVets] = useState<Vet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = () => {
    setLoading(true)
    setError(false)
    api.vets()
      .then((data) => setVets(data.filter((v) => v.is_available)))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

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
            padding: '6px 14px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--border)',
            background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
            minHeight: 36,
          }}
        >
          {lang === 'ru' ? 'O\'zb' : 'Рус'}
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

      {/* Content */}
      <div style={{ flex: 1, padding: '16px 16px 32px' }}>
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
        {!loading && !error && vets.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0', fontSize: 15 }}>
            {t('home.no_vets')}
          </div>
        )}
        {!loading && !error && vets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {vets.map((vet) => (
              <VetCard key={vet.id} vet={vet} onSelect={onSelectVet} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VetCard({ vet, onSelect, lang }: { vet: Vet; onSelect: (v: Vet) => void; lang: string }) {
  void lang
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r-lg)',
      padding: '16px', border: '1px solid var(--border)',
      boxShadow: '0 2px 8px rgba(35,40,45,.06)',
    }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{
          fontSize: 44, width: 64, height: 64, borderRadius: 'var(--r-md)',
          background: 'var(--surface-2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          {vet.avatar_emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{vet.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>{vet.specialty}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--warning)' }}>
              ⭐ {Number(vet.rating).toFixed(1)}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {vet.experience_yr} {t('home.exp')}
            </span>
          </div>
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)',
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
            {vet.price_uzs.toLocaleString('ru-RU')}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>{t('home.price')}</span>
        </div>
        <button
          onClick={() => onSelect(vet)}
          style={{
            padding: '10px 20px', borderRadius: 'var(--r-pill)',
            background: 'var(--primary)', color: 'var(--on-primary)',
            border: 'none', fontWeight: 600, fontSize: 14, minHeight: 44,
          }}
        >
          {t('home.book')}
        </button>
      </div>
    </div>
  )
}
