import { useEffect, useState, type CSSProperties } from 'react'
import {
  IconChevronRight, IconHeart, IconCheck,
  IconBell, IconUser, IconClock,
} from '@ht/shared'
import type { Deed, Pet } from '../api'
import { api, getOwnerId } from '../api'
import { t, getLang } from '../i18n'
import type { Tab } from '../components/BottomNav'

// ── Purple accent palette (hero / CTA)
const P = {
  main:  '#4F46E5',
  deep:  '#7C3AED',
  light: '#EEF2FF',
  mid:   '#C7D2FE',
  text:  '#4338CA',
} as const

interface Props {
  lang: string
  onSwitchLang: () => void
  onNavigate:   (tab: Tab) => void
  onInsurance:  () => void
  onFood:       () => void
  onClinics:    () => void
  onPlaces:     () => void
  onDeeds:      () => void
  onSymptoms:   () => void
}

// ── Horizontal scroll cards data
const SCROLL_ITEMS = {
  ru: [
    { emoji: '💉', title: 'Вакцинация\nпитомцев',     grad: 'linear-gradient(135deg,#FF9A9E,#FAD0C4)' },
    { emoji: '🥗', title: 'Правильное\nпитание',       grad: 'linear-gradient(135deg,#A1C4FD,#C2E9FB)' },
    { emoji: '🆘', title: 'Первая помощь\nпитомцу',    grad: 'linear-gradient(135deg,#FDDB92,#D1FDFF)' },
    { emoji: '📋', title: 'Чек-лист\nщенка',           grad: 'linear-gradient(135deg,#A8EDEA,#FED6E3)' },
    { emoji: '🐱', title: 'Уход\nза кошкой',           grad: 'linear-gradient(135deg,#D4FC79,#96E6A1)' },
  ],
  uz: [
    { emoji: '💉', title: 'Emlash',                            grad: 'linear-gradient(135deg,#FF9A9E,#FAD0C4)' },
    { emoji: '🥗', title: "To'g'ri\novqatlantirish",           grad: 'linear-gradient(135deg,#A1C4FD,#C2E9FB)' },
    { emoji: '🆘', title: 'Birinchi\nyordam',                  grad: 'linear-gradient(135deg,#FDDB92,#D1FDFF)' },
    { emoji: '📋', title: "Kuchukcha\nro'yxati",               grad: 'linear-gradient(135deg,#A8EDEA,#FED6E3)' },
    { emoji: '🐱', title: "Mushukni\nparvarish qilish",        grad: 'linear-gradient(135deg,#D4FC79,#96E6A1)' },
  ],
}

// ── Topics section data
const TOPIC_CARDS = {
  cats: [
    { emoji: '🤒', ru: 'Признаки болезни',       uz: 'Kasallik belgilari' },
    { emoji: '🪥', ru: 'Уход за зубами',          uz: 'Tish parvarishi' },
    { emoji: '💊', ru: 'Дегельминтизация',        uz: 'Degelmintizatsiya' },
  ],
  dogs: [
    { emoji: '🏃', ru: 'Прогулки и нагрузка',    uz: 'Sayr va mashqlar' },
    { emoji: '🛁', ru: 'Купание и груминг',       uz: "Cho'milish" },
    { emoji: '🦴', ru: 'Питание по возрасту',     uz: "Yoshga qarab ovqat" },
  ],
}

const SPEC_LABEL: Record<string, [string, string]> = {
  cat:     ['Кошка',   'Mushuk'],
  dog:     ['Собака',  'It'],
  rabbit:  ['Кролик',  'Quyon'],
  parrot:  ['Попугай', "To'ti"],
  hamster: ['Хомяк',   'Hamster'],
  fish:    ['Рыбка',   'Baliq'],
  other:   ['Другое',  'Boshqa'],
}

function petAge(birthDate: string | null, uz: boolean): string {
  if (!birthDate) return uz ? "Yosh ko'rsatilmagan" : 'Возраст не указан'
  const months = Math.floor((Date.now() - new Date(birthDate).getTime()) / (30.44 * 24 * 3600 * 1000))
  if (months < 1)  return uz ? 'Bir oydan kam' : 'Меньше месяца'
  if (months < 12) return `${months} ${uz ? 'oy' : 'мес.'}`
  const y = Math.floor(months / 12)
  return `${y} ${uz ? 'yil' : 'лет'}`
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard({ lang, onSwitchLang, onNavigate, onInsurance, onFood, onClinics, onPlaces, onDeeds, onSymptoms }: Props) {
  const [pets, setPets] = useState<Pet[] | null>(null)
  const [topicFilter, setTopicFilter] = useState<'cats' | 'dogs'>('cats')
  const uz = getLang() === 'uz'
  void lang

  useEffect(() => { api.pets(getOwnerId()).then(setPets).catch(() => setPets([])) }, [])

  const firstPet = pets?.[0] ?? null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 164, background: 'var(--bg)' }}>

      {/* ─────────────────────────────── HEADER */}
      <header style={{
        background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 20,
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Row 1: avatar + greeting + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: P.light, border: `2px solid ${P.mid}`, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: firstPet ? 22 : 0,
            }}>
              {firstPet
                ? firstPet.avatar_emoji
                : <IconUser size={20} color={P.main} />}
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1 }}>
                {uz ? 'Salom 👋' : 'Привет 👋'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.3 }}>
                {firstPet?.name ?? (uz ? 'Xush kelibsiz!' : 'Добро пожаловать!')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onSwitchLang}
              style={{
                width: 38, height: 38, borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)', background: 'transparent',
                fontFamily: 'inherit', cursor: 'pointer', fontWeight: 700, fontSize: 11,
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {lang === 'ru' ? "O'z" : 'Ру'}
            </button>
            <button style={{
              width: 38, height: 38, borderRadius: 'var(--r-md)',
              border: '1.5px solid var(--border)', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <IconBell size={17} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        {/* Row 2: quick action chips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '0 8px 10px' }}>
          {([
            { emoji: '🩺', label: uz ? 'Qabul'     : 'На приём',   sub: uz ? 'Veterinar'  : 'Ветеринар',   onClick: () => onNavigate('consult') },
            { emoji: '🔬', label: uz ? 'Tahlillar' : 'Анализы',    sub: uz ? 'Lab'        : 'Лаборатории', onClick: onClinics },
            { emoji: '🏥', label: uz ? 'Klinikalar': 'Клиники',    sub: uz ? 'Atrofda'    : 'Рядом',       onClick: onClinics },
            { emoji: '🥘', label: uz ? 'Yem'       : 'Корм',       sub: uz ? 'Tanlash'    : 'Подбор',      onClick: onFood },
          ]).map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              style={{
                padding: '6px 2px 6px', borderRadius: 'var(--r-lg)', border: 'none',
                background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--r-md)',
                background: P.light, fontSize: 21,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.emoji}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>
                {item.label}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1 }}>
                {item.sub}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* ─────────────────────────────── HERO CARDS GRID */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, height: 230 }}>

          {/* Left — large hero (full height) */}
          <button
            onClick={() => onNavigate('consult')}
            style={{
              borderRadius: 'var(--r-xl)', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: `linear-gradient(148deg, ${P.main} 0%, ${P.deep} 100%)`,
              padding: '18px 16px 16px', textAlign: 'left',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
              boxShadow: `0 8px 24px ${P.main}45`,
            }}
          >
            <div aria-hidden style={{
              position: 'absolute', top: -24, right: -24,
              width: 100, height: 100, borderRadius: '50%',
              background: 'rgba(255,255,255,.10)',
            }} />
            <div aria-hidden style={{
              position: 'absolute', bottom: 6, right: 4,
              fontSize: 56, opacity: .22, lineHeight: 1,
              pointerEvents: 'none', userSelect: 'none',
            }}>🩺</div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', lineHeight: 1.3, marginBottom: 7, whiteSpace: 'pre-line' }}>
                {uz ? "Veterinarga\nyozilish" : "Записаться\nк ветеринару"}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.80)', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                {uz ? "50+ malakali\nveterinarlar" : "50+ ветеринаров\nс квалификацией"}
              </div>
            </div>

            <div style={{
              position: 'relative', zIndex: 1,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,255,255,.22)', borderRadius: 'var(--r-pill)',
              padding: '5px 11px', alignSelf: 'flex-start',
            }}>
              <IconClock size={11} color="#fff" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {uz ? '5 daq.' : '5 мин'}
              </span>
            </div>
          </button>

          {/* Right — two stacked cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* AI консультация */}
            <button
              onClick={() => onNavigate('consult')}
              style={{
                flex: 1, borderRadius: 'var(--r-xl)',
                border: '1px solid var(--border)', background: 'var(--surface)',
                cursor: 'pointer', fontFamily: 'inherit',
                padding: '13px 12px', textAlign: 'left',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div aria-hidden style={{
                position: 'absolute', bottom: -8, right: -8,
                fontSize: 44, opacity: .15, lineHeight: 1, pointerEvents: 'none',
              }}>🤖</div>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--r-md)',
                background: P.light, fontSize: 18, marginBottom: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>🤖</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)', lineHeight: 1.3 }}>
                  {uz ? 'AI maslahat' : 'AI консультация'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.35 }}>
                  {uz ? 'Chatbot asosida' : 'Чат-бот ветеринара'}
                </div>
              </div>
            </button>

            {/* Диагностика */}
            <button
              onClick={onClinics}
              style={{
                flex: 1, borderRadius: 'var(--r-xl)',
                border: '1px solid var(--border)', background: 'var(--surface)',
                cursor: 'pointer', fontFamily: 'inherit',
                padding: '13px 12px', textAlign: 'left',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div aria-hidden style={{
                position: 'absolute', bottom: -8, right: -8,
                fontSize: 44, opacity: .15, lineHeight: 1, pointerEvents: 'none',
              }}>🔬</div>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--r-md)',
                background: '#E8F5E9', fontSize: 18, marginBottom: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>🔬</div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)', lineHeight: 1.3 }}>
                  {uz ? 'Diagnostika' : 'Диагностика'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.35 }}>
                  {uz ? '200+ laboratoriya' : '200+ лабораторий'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────── SYMPTOM CHECKER BANNER */}
      <div style={{ padding: '12px 16px 0' }}>
        <button
          onClick={onSymptoms}
          style={{
            width: '100%', border: 'none', borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg, #FF6650 0%, #FF9A3C 100%)',
            padding: '16px 18px', cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
            boxShadow: '0 4px 16px rgba(242,120,75,0.35)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div aria-hidden style={{
            position: 'absolute', top: -20, right: -20,
            width: 90, height: 90, borderRadius: '50%',
            background: 'rgba(255,255,255,.12)', pointerEvents: 'none',
          }} />
          <div style={{
            width: 46, height: 46, borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,0.22)', fontSize: 24, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🩺</div>
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', lineHeight: 1.3 }}>
              {uz ? 'Belgilarni tekshirish' : 'Проверить симптомы'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
              {uz ? 'Veterinar kerakmi? 1 daqiqada bilib oling' : 'Нужен ли ветеринар? Узнайте за 1 минуту'}
            </div>
          </div>
          <div style={{
            width: 30, height: 30, borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,0.22)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconChevronRight size={15} color="#fff" />
          </div>
        </button>
      </div>

      {/* ─────────────────────────────── PACKAGES BANNER */}
      <div style={{ padding: '12px 16px 0' }}>
        <button
          onClick={onInsurance}
          style={{
            width: '100%', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)',
            background: 'var(--surface)', padding: '14px 16px', cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            background: P.light, fontSize: 22, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>📦</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              {uz ? "Maslahat to'plamlari" : 'Пакеты консультаций'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {uz ? 'Qulay narxlarda' : 'по выгодным ценам'}
            </div>
          </div>
          <div style={{
            width: 30, height: 30, borderRadius: 'var(--r-md)',
            background: P.light, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconChevronRight size={15} color={P.main} />
          </div>
        </button>
      </div>

      {/* ─────────────────────────────── HORIZONTAL SCROLL */}
      <div style={{ paddingTop: 20 }}>
        <div style={{
          display: 'flex', gap: 10, overflowX: 'auto',
          padding: '0 16px 6px',
          scrollbarWidth: 'none',
        } as CSSProperties}>
          {SCROLL_ITEMS[uz ? 'uz' : 'ru'].map((item, i) => (
            <button
              key={i}
              onClick={() => onNavigate('learn')}
              style={{
                flexShrink: 0, width: 118, borderRadius: 'var(--r-xl)',
                border: 'none', overflow: 'hidden', cursor: 'pointer',
                fontFamily: 'inherit', padding: 0, background: 'transparent',
              }}
            >
              <div style={{
                background: item.grad, height: 76,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32,
              }}>
                {item.emoji}
              </div>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)', borderTop: 'none',
                borderBottomLeftRadius: 'var(--r-xl)', borderBottomRightRadius: 'var(--r-xl)',
                padding: '8px 10px',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text)',
                  lineHeight: 1.35, textAlign: 'left', whiteSpace: 'pre-wrap',
                  display: 'block',
                }}>
                  {item.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────── MY PETS SECTION */}
      <div style={{ padding: '22px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>
            {uz ? 'Mening hayvonlarim' : 'Мои питомцы'}
          </span>
          <button
            onClick={() => onNavigate('pets')}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13, color: P.main, fontWeight: 600,
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 2,
            }}
          >
            {uz ? 'Barchasi' : 'Все'}<IconChevronRight size={14} color={P.main} />
          </button>
        </div>

        {pets === null ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                height: 72, borderRadius: 'var(--r-xl)', overflow: 'hidden',
                background: 'var(--surface)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg,var(--border) 25%,var(--surface) 50%,var(--border) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.4s infinite',
                }} />
              </div>
            ))}
          </div>
        ) : pets.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)', padding: '28px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>🐾</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              {uz ? "Hayvon qo'shing" : 'Добавьте питомца'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              {uz ? "Sog'liq tarixini saqlang va maslahat oling" : 'Отслеживайте здоровье и историю лечения'}
            </div>
            <button
              onClick={() => onNavigate('pets')}
              style={{
                padding: '10px 28px', borderRadius: 'var(--r-pill)',
                background: P.main, color: '#fff', border: 'none',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                fontFamily: 'inherit', minHeight: 44,
              }}
            >
              {uz ? "Qo'shish" : 'Добавить'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pets.slice(0, 3).map(pet => (
              <button
                key={pet.id}
                onClick={() => onNavigate('pets')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', borderRadius: 'var(--r-xl)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left', width: '100%',
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: P.light, border: `2px solid ${P.mid}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, flexShrink: 0,
                }}>
                  {pet.avatar_emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{pet.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{
                      background: P.light, color: P.text,
                      borderRadius: 'var(--r-pill)', padding: '2px 8px',
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {SPEC_LABEL[pet.species]?.[uz ? 1 : 0] ?? pet.species}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {petAge(pet.birth_date, uz)}
                    </span>
                  </div>
                </div>
                <IconChevronRight size={16} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────── TOPICS SECTION */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>
            {uz ? 'Mavzular' : 'Темы'}
          </span>
          {/* Toggle pill */}
          <div style={{
            display: 'flex', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-pill)', padding: 3,
          }}>
            {(['cats', 'dogs'] as const).map(k => (
              <button
                key={k}
                onClick={() => setTopicFilter(k)}
                style={{
                  padding: '5px 14px', borderRadius: 'var(--r-pill)',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontWeight: 600, fontSize: 12, minHeight: 32,
                  background: topicFilter === k ? P.main : 'transparent',
                  color:      topicFilter === k ? '#fff' : 'var(--text-muted)',
                  transition: 'background .15s, color .15s',
                }}
              >
                {k === 'cats'
                  ? (uz ? 'Mushuklar' : 'Кошки')
                  : (uz ? 'Itlar' : 'Собаки')}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {TOPIC_CARDS[topicFilter].map((item, i) => (
            <button
              key={i}
              onClick={() => onNavigate('learn')}
              style={{
                border: '1px solid var(--border)', borderRadius: 'var(--r-xl)',
                background: 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit',
                padding: '14px 8px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                textAlign: 'center',
              }}
            >
              <div style={{
                width: 50, height: 50, borderRadius: 'var(--r-lg)',
                background: P.light, fontSize: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.emoji}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                {uz ? item.uz : item.ru}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────── DEEDS (conditional) */}
      <div style={{ padding: '24px 16px 0' }}>
        <DeedsSection onViewAll={onDeeds} />
      </div>

      {/* ─────────────────────────────── FIXED CTA */}
      <div style={{
        position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, padding: '12px 16px 8px',
        background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => onNavigate('consult')}
          style={{
            width: '100%', padding: '16px', borderRadius: 'var(--r-pill)',
            background: `linear-gradient(135deg, ${P.main}, ${P.deep})`,
            color: '#fff', border: 'none', fontWeight: 700, fontSize: 16,
            fontFamily: 'inherit', cursor: 'pointer', minHeight: 56,
            boxShadow: `0 8px 28px ${P.main}55`,
            pointerEvents: 'auto',
          }}
        >
          {uz ? 'Maslahat olish' : 'Получить консультацию'}
        </button>
      </div>
    </div>
  )
}

// ── DeedsSection ──────────────────────────────────────────────────────────────
function DeedsSection({ onViewAll }: { onViewAll?: () => void }) {
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
      setActive(null); setAmount('')
    } catch { /**/ } finally { setSubmitting(false) }
  }

  if (loading || deeds.length === 0) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'rgba(239,68,68,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconHeart size={13} color="#EF4444" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 17 }}>{t('deeds.title')}</span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            style={{
              background: 'none', border: 'none', padding: 0,
              color: 'var(--primary)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 2,
            }}
          >
            {uz ? 'Hammasi' : 'Все'} <IconChevronRight size={14} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {deeds.slice(0, 2).map(deed => {
          const pct = Math.min(100, Math.round((deed.raised_amount / deed.goal_amount) * 100))
          const isDone = done.has(deed.id)
          const isOpen = active === deed.id

          return (
            <div key={deed.id} style={{
              background: 'var(--surface)',
              border: `1px solid ${isDone ? '#86EFAC' : 'var(--border)'}`,
              borderRadius: 'var(--r-xl)', overflow: 'hidden', transition: 'border-color .2s',
            }}>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 'var(--r-md)', flexShrink: 0,
                    background: isDone ? 'rgba(34,197,94,.10)' : P.light,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
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
                      background: '#DCFCE7', color: '#15803D', borderRadius: 'var(--r-pill)',
                      padding: '3px 10px', fontSize: 11, fontWeight: 700,
                      alignSelf: 'flex-start', flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <IconCheck size={11} /> {t('deeds.done')}
                    </span>
                  )}
                </div>

                <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: isDone ? 'linear-gradient(90deg,#4ade80,#22c55e)' : `linear-gradient(90deg,${P.main},${P.deep})`,
                    borderRadius: 99, transition: 'width .4s',
                  }} />
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 11, color: 'var(--text-muted)', marginBottom: isDone ? 0 : 8,
                }}>
                  <span style={{ fontWeight: 600, color: isDone ? '#15803D' : P.main }}>{pct}%</span>
                  <span>{deed.raised_amount.toLocaleString('ru-RU')} {t('currency')} · {deed.participants_count} {t('deeds.participants')}</span>
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
                          type="number" value={amount} onChange={e => setAmount(e.target.value)}
                          placeholder="50 000"
                          style={{
                            flex: 1, padding: '9px 12px', borderRadius: 'var(--r-md)',
                            border: '1.5px solid var(--border)', fontSize: 14,
                            fontFamily: 'inherit', minHeight: 44, background: 'var(--bg)', color: 'var(--text)',
                          }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('currency')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => participate(deed.id, 'donate')} disabled={submitting}
                          style={{
                            flex: 2, padding: '10px', borderRadius: 'var(--r-pill)',
                            background: P.main, color: '#fff', border: 'none',
                            fontWeight: 700, fontSize: 14, cursor: 'pointer',
                            fontFamily: 'inherit', minHeight: 44, opacity: submitting ? .6 : 1,
                          }}
                        >{submitting ? '…' : t('deeds.donate')}</button>
                        <button
                          onClick={() => participate(deed.id, 'volunteer')} disabled={submitting}
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
                        background: P.main, color: '#fff', border: 'none',
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
