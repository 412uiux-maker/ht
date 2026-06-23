import { useState } from 'react'
import { t } from '../i18n'

interface Props {
  lang: string
  onBack: () => void
  onStart: () => void
}

const PROGRAMS = [
  {
    key: 'min',
    label: () => t('ins.plan_min'),
    desc: 'Базовое покрытие: амбулаторное лечение, хирургия, диагностика. Страховая премия от 1 240 000 сум.',
  },
  {
    key: 'ext',
    label: () => t('ins.plan_ext'),
    desc: 'Расширенное покрытие: всё из «Минимальной» + стоматология, госпитализация, лечение онкологии. Страховая премия от 2 400 000 сум.',
  },
  {
    key: 'tel',
    label: () => t('ins.plan_tel'),
    desc: 'Телемедицина 24/7: неограниченные онлайн-консультации ветеринара, второе мнение специалиста, рекомендации по лечению.',
  },
  {
    key: 'add',
    label: () => t('ins.plan_add'),
    desc: 'Дополнительные опции: защита от укуса клеща (от 600 000 сум), гражданская ответственность за вред третьим лицам (от 360 000 сум).',
  },
]

const FAQ_CASE = [
  {
    key: 'c1',
    label: () => t('ins.case1'),
    body: 'Обратитесь в ближайшую ветеринарную клинику или вызовите ветеринара на дом. Сохраните все документы и чеки.',
  },
  {
    key: 'c2',
    label: () => t('ins.case2'),
    body: 'Уведомите страховую компанию в течение 24 часов после страхового события. Заполните форму в приложении.',
  },
  {
    key: 'c3',
    label: () => t('ins.case3'),
    body: 'Статус вашего обращения доступен в разделе «Страхование» → «Мои полисы». Обычно решение принимается за 3–5 рабочих дней.',
  },
  {
    key: 'c4',
    label: () => t('ins.case4'),
    body: 'Позвоните на горячую линию, отправьте email или посетите офис страховой компании с документами.',
  },
]

const FAQ_QUESTIONS = [
  {
    key: 'q1',
    label: 'Что является страховым случаем?',
    body: 'Любое заболевание, травма или несчастный случай с застрахованным питомцем, требующее ветеринарной помощи.',
  },
  {
    key: 'q2',
    label: 'Как оформить полис?',
    body: 'Выберите питомца, укажите программу страхования и оплатите полис в приложении. Полис активируется сразу после оплаты.',
  },
  {
    key: 'q3',
    label: 'Можно ли застраховать нескольких питомцев?',
    body: 'Да, для каждого питомца оформляется отдельный полис. Действует скидка 10% на второго и последующих питомцев.',
  },
]

export default function Insurance({ lang, onBack, onStart }: Props) {
  void lang
  const [openProgram, setOpenProgram] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [tab, setTab] = useState<'case' | 'faq'>('case')
  const [expanded, setExpanded] = useState(false)

  const desc = t('ins.hero_desc')
  const shortDesc = desc.slice(0, 140)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onBack}
            aria-label={t('back')}
            style={{
              width: 36, height: 36, borderRadius: 'var(--r-md)',
              border: '1.5px solid var(--border)', background: 'transparent',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ←
          </button>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{t('ins.title')}</span>
        </div>
        <button
          style={{
            padding: '6px 16px', borderRadius: 'var(--r-pill)',
            border: '1.5px solid var(--border)', background: 'var(--surface)',
            fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
          }}
        >
          {t('ins.more')}
        </button>
      </header>

      <div style={{ flex: 1, padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Hero card */}
        <div style={{
          borderRadius: 'var(--r-xl)',
          background: 'linear-gradient(145deg, #8B5CF6, #A78BFA)',
          padding: '24px 20px 20px',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative blobs */}
          <div style={{
            position: 'absolute', right: -20, top: -20,
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,.10)',
          }} />
          <div style={{
            position: 'absolute', right: 20, bottom: -30,
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,.07)',
          }} />

          {/* Shield icon */}
          <div style={{
            position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
            opacity: 0.9,
          }}>
            <ShieldIcon size={72} colorFrom="#C4B5FD" colorTo="#DDD6FE" />
          </div>

          <div style={{ position: 'relative', maxWidth: '70%' }}>
            <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.3, marginBottom: 16 }}>
              {t('ins.hero_title')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <HeroFeature icon="💰" label={t('ins.cost_from')} />
              <HeroFeature icon="📅" label={t('ins.validity')} />
              <HeroFeature icon="📞" label={t('ins.vet247')} />
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--r-lg)',
          padding: '16px',
        }}>
          <p style={{
            fontSize: 14, lineHeight: 1.6, color: 'var(--text-muted)', margin: 0,
          }}>
            {expanded ? desc : shortDesc + (desc.length > 140 ? '…' : '')}
          </p>
          {desc.length > 140 && (
            <button
              onClick={() => setExpanded(x => !x)}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 13, color: '#8B5CF6', fontWeight: 600,
                marginTop: 6, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {expanded ? '↑ Свернуть' : t('ins.read_more')}
            </button>
          )}
        </div>

        {/* Programs accordion */}
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--r-lg)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px 10px',
            fontSize: 14, fontWeight: 700, color: 'var(--text)',
          }}>
            {t('ins.choose_plan_title')}
          </div>
          {PROGRAMS.map((prog, idx) => {
            const open = openProgram === prog.key
            return (
              <div key={prog.key}>
                {idx > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />}
                <button
                  onClick={() => setOpenProgram(open ? null : prog.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '14px 16px', textAlign: 'left',
                    background: open ? '#F5F3FF' : 'transparent',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background .15s',
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: '#EDE9FE', color: '#8B5CF6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700,
                  }}>
                    {open ? '−' : '+'}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {prog.label()}
                  </span>
                  <span style={{
                    fontSize: 12, color: 'var(--text-muted)',
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform .2s',
                  }}>
                    ▼
                  </span>
                </button>
                {open && (
                  <div style={{
                    padding: '0 16px 14px 54px',
                    fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                    background: '#F5F3FF',
                  }}>
                    {prog.desc}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Tabs + FAQ */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {(['case', 'faq'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  flex: 1, padding: '12px 8px', border: 'none', background: 'transparent',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  color: tab === key ? '#8B5CF6' : 'var(--text-muted)',
                  borderBottom: `2px solid ${tab === key ? '#8B5CF6' : 'transparent'}`,
                  marginBottom: -1, transition: 'color .15s',
                }}
              >
                {key === 'case' ? t('ins.tab_case') : t('ins.tab_faq')}
              </button>
            ))}
          </div>

          {/* Case tab */}
          {tab === 'case' && (
            <div style={{ padding: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, lineHeight: 1.4 }}>
                {t('ins.case_title')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {FAQ_CASE.map((item, idx) => {
                  const open = openFaq === item.key
                  return (
                    <div key={item.key}>
                      {idx > 0 && <div style={{ height: 1, background: 'var(--border)', marginLeft: 44 }} />}
                      <button
                        onClick={() => setOpenFaq(open ? null : item.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                          padding: '12px 0', background: 'transparent', border: 'none',
                          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--primary)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                        }}>
                          {idx + 1}
                        </div>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                          {item.label()}
                        </span>
                        <span style={{
                          fontSize: 11, color: 'var(--text-muted)',
                          transform: open ? 'rotate(180deg)' : 'none',
                          transition: 'transform .2s',
                        }}>▼</span>
                      </button>
                      {open && (
                        <div style={{
                          paddingLeft: 40, paddingBottom: 12,
                          fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                        }}>
                          {item.body}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* FAQ tab */}
          {tab === 'faq' && (
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {FAQ_QUESTIONS.map((item, idx) => {
                  const open = openFaq === item.key
                  return (
                    <div key={item.key}>
                      {idx > 0 && <div style={{ height: 1, background: 'var(--border)' }} />}
                      <button
                        onClick={() => setOpenFaq(open ? null : item.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '13px 0', background: 'transparent', border: 'none',
                          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        }}
                      >
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: 11, color: 'var(--text-muted)', flexShrink: 0,
                          transform: open ? 'rotate(180deg)' : 'none',
                          transition: 'transform .2s',
                        }}>▼</span>
                      </button>
                      {open && (
                        <div style={{
                          paddingBottom: 12,
                          fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
                        }}>
                          {item.body}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          style={{
            padding: '16px', borderRadius: 'var(--r-pill)',
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            color: '#fff', border: 'none', fontWeight: 700, fontSize: 16,
            minHeight: 56, fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(139,92,246,.35)',
          }}
        >
          {t('ins.continue')} →
        </button>
      </div>
    </div>
  )
}

function HeroFeature({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(255,255,255,.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, flexShrink: 0,
      }}>{icon}</span>
      <span style={{ fontSize: 13, opacity: 0.9 }}>{label}</span>
    </div>
  )
}

function ShieldIcon({ size = 52, colorFrom, colorTo }: { size?: number; colorFrom: string; colorTo: string }) {
  const id = `sh-${colorFrom.replace('#', '')}`
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
        fill="white" fillOpacity="0.18" />
    </svg>
  )
}
