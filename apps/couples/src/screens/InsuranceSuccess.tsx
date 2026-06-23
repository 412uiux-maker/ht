import { t } from '../i18n'

interface Props {
  onHome: () => void
}

export default function InsuranceSuccess({ onHome }: Props) {
  return (
    <div style={{
      minHeight: '100vh', background: '#F5F3FF',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      {BLOBS.map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: b.x, top: b.y,
          width: b.s, height: b.s,
          borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
          background: b.color,
          opacity: b.o,
          transform: `rotate(${b.r}deg)`,
        }} />
      ))}

      {/* Icon card */}
      <div style={{
        width: 88, height: 88, borderRadius: 24,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(139,92,246,.18)',
        marginBottom: 32, position: 'relative', zIndex: 1,
      }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path d="M22 3L4 10.5v13c0 12.1 8 23.3 18 26 10-2.7 18-13.9 18-26v-13L22 3z" fill="#8B5CF6" />
          <path d="M14 22l5.5 5.5 10-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Text */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 280 }}>
        <p style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.35, marginBottom: 12, margin: '0 0 12px' }}>
          <span style={{ color: '#8B5CF6' }}>{t('ins.success_hi')}</span>{' '}
          {t('ins.success_title')}
        </p>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 40 }}>
          {t('ins.success_sub')}
        </p>

        <button
          onClick={onHome}
          style={{
            padding: '15px 40px', borderRadius: 'var(--r-pill)',
            background: '#fff', color: '#1F2937',
            border: 'none', fontWeight: 700, fontSize: 15,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,.10)',
            minHeight: 52,
          }}
        >
          {t('ins.back_home')}
        </button>
      </div>
    </div>
  )
}

const BLOBS = [
  { x: '-8%', y: '8%',  s: 180, r: -20, color: '#C4B5FD', o: 0.35 },
  { x: '55%', y: '5%',  s: 120, r: 30,  color: '#A78BFA', o: 0.25 },
  { x: '65%', y: '60%', s: 200, r: 45,  color: '#DDD6FE', o: 0.40 },
  { x: '-5%', y: '65%', s: 140, r: -35, color: '#EDE9FE', o: 0.50 },
  { x: '30%', y: '78%', s: 90,  r: 15,  color: '#C4B5FD', o: 0.20 },
]
