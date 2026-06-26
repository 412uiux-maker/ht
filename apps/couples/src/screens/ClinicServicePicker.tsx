import { useState } from 'react'
import { IconArrowLeft, IconSearch } from '@ht/shared'
import { t, getLang } from '../i18n'

export interface ClinicService {
  id: string
  ru: string
  uz: string
  emoji: string
  color: string
  count: number
}

const SERVICES: ClinicService[] = [
  { id: 'uzi',     emoji: '🔬', color: '#1565C0', ru: 'УЗИ для животных',      uz: 'Hayvonlar uchun UZI',        count: 12 },
  { id: 'xray',    emoji: '📡', color: '#37474F', ru: 'Рентгенография',          uz: 'Rentgenografiya',             count: 8  },
  { id: 'lab',     emoji: '🧪', color: '#6A1B9A', ru: 'Анализы и диагностика',  uz: 'Tahlillar va diagnostika',    count: 15 },
  { id: 'vaccine', emoji: '💉', color: '#00695C', ru: 'Вакцинация',              uz: 'Emlash',                      count: 18 },
  { id: 'steril',  emoji: '🏥', color: '#C62828', ru: 'Стерилизация',            uz: 'Sterilizatsiya',              count: 10 },
  { id: 'dental',  emoji: '🦷', color: '#2E7D32', ru: 'Стоматология',            uz: 'Stomatologiya',               count: 7  },
  { id: 'surgery', emoji: '🩺', color: '#E65100', ru: 'Хирургия',                uz: "Jarrohlik",                   count: 5  },
  { id: 'derm',    emoji: '🧬', color: '#4527A0', ru: 'Дерматология',            uz: 'Dermatologiya',               count: 9  },
]

interface Props {
  onBack: () => void
  onSelectService: (svc: ClinicService) => void
}

export default function ClinicServicePicker({ onBack, onSelectService }: Props) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const lang = getLang()

  const filtered = SERVICES.filter(s => {
    const q = query.toLowerCase()
    return !q || s.ru.toLowerCase().includes(q) || s.uz.toLowerCase().includes(q)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} style={iconBtn} aria-label={t('back')}><IconArrowLeft size={18} /></button>
        {searching ? (
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('clinic.choose_service')}
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: 16, fontFamily: 'inherit', color: 'var(--text)',
            }}
          />
        ) : (
          <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>{t('clinic.choose_service')}</span>
        )}
        <button
          onClick={() => { setSearching(s => !s); setQuery('') }}
          style={{ ...iconBtn, border: 'none', fontSize: 18 }}
          aria-label="Поиск"
        ><IconSearch size={18} /></button>
      </header>

      {/* Service list */}
      <div style={{ flex: 1, background: 'var(--bg)' }}>
        <div style={{
          background: 'var(--surface)',
          margin: '12px 16px',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {filtered.map((svc, i) => (
            <button
              key={svc.id}
              onClick={() => onSelectService(svc)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', background: 'transparent', border: 'none',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              {/* Icon tile */}
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: svc.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, flexShrink: 0,
              }}>
                {svc.emoji}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.3, marginBottom: 3 }}>
                  {lang === 'uz' ? svc.uz : svc.ru}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {svc.count} {t('clinic.vet_clinics')}
                </div>
              </div>

              {/* Arrow */}
              <span style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }}>›</span>
            </button>
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Ничего не найдено
            </div>
          )}
        </div>
      </div>

      {/* Bottom floating banner */}
      <div style={{
        position: 'sticky', bottom: 0, padding: '12px 16px 20px',
        background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
        pointerEvents: 'none',
      }}>
        <button
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 'var(--r-pill)',
            background: 'linear-gradient(135deg,#7C3AED,#A78BFA)',
            border: 'none', cursor: 'pointer', pointerEvents: 'auto',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            boxShadow: '0 4px 20px rgba(124,58,237,.35)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
            {t('clinic.no_vet')}
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginTop: 2 }}>
            {t('clinic.no_vet_sub')}
          </span>
        </button>
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 'var(--r-md)',
  border: '1.5px solid var(--border)', background: 'transparent',
  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}
