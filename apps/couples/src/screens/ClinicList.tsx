import { useState, useEffect } from 'react'
import { IconArrowLeft, IconSearch, IconStarFilled, IconHeart, IconHeartFilled } from '@ht/shared'
import { t, getLang } from '../i18n'
import { api } from '../api'
import type { Vet } from '../api'
import type { ClinicService } from './ClinicServicePicker'

export interface Clinic {
  id: number
  name: string
  type: string
  typeUz: string
  logo_color: string
  logo_initials: string
  rating: number
  experience_yr: number
  consultations: number
  price_uzs: number
  discount_uzs: number
  hours: string
  hoursUz: string
  phone_masked: string
  phone_full: string
  schedule: { days: string; daysUz: string; time: string }[]
  address: string
  addressUz: string
  bio: string
  bioUz: string
}

const LOGO_PALETTE = ['#E53935', '#1565C0', '#2E7D32', '#6A1B9A', '#E65100', '#00838F', '#AD1457']

export function vetToClinic(v: Vet): Clinic {
  const words = v.name.trim().split(/\s+/)
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : v.name.slice(0, 2).toUpperCase()
  return {
    id: v.id,
    name: v.name,
    type: v.specialty,
    typeUz: v.specialty,
    logo_color: LOGO_PALETTE[v.id % LOGO_PALETTE.length],
    logo_initials: initials,
    rating: v.rating,
    experience_yr: v.experience_yr,
    consultations: 0,
    price_uzs: v.price_uzs,
    discount_uzs: 0,
    hours: 'Онлайн-консультации',
    hoursUz: 'Onlayn maslahatlar',
    phone_masked: '',
    phone_full: '',
    schedule: [],
    address: 'Онлайн',
    addressUz: 'Onlayn',
    bio: v.bio,
    bioUz: v.bio,
  }
}

export const MOCK_CLINICS: Clinic[] = [
  {
    id: 1,
    name: 'VetCity',
    type: 'Ветеринарная клиника',
    typeUz: 'Veterinariya klinikasi',
    logo_color: '#E53935',
    logo_initials: 'VC',
    rating: 4.9,
    experience_yr: 12,
    consultations: 2304,
    price_uzs: 180000,
    discount_uzs: 30000,
    hours: 'с 08:00 до 21:00',
    hoursUz: '08:00 dan 21:00 gacha',
    phone_masked: '+998 71 2** *** 11',
    phone_full: '+998712341211',
    schedule: [
      { days: 'Пн. — Пт.', daysUz: 'Du. — Ju.', time: '08:00 — 21:00' },
      { days: 'Сб.', daysUz: 'Sh.', time: '09:00 — 19:00' },
      { days: 'Вс.', daysUz: 'Ya.', time: '10:00 — 17:00' },
    ],
    address: 'г. Ташкент, ул. Амира Темура, 107Б',
    addressUz: 'Toshkent sh., Amir Temur ko\'chasi, 107B',
    bio: 'VetCity — многопрофильная ветеринарная клиника в самом сердце Ташкента. Работаем с 2012 года, оснащены современным диагностическим оборудованием: УЗИ, рентген, лаборатория. Ведут приём специалисты по хирургии, терапии, дерматологии и стоматологии.',
    bioUz: 'VetCity — Toshkentning markazida joylashgan ko\'p tarmoqli veterinariya klinikasi. 2012 yildan beri ishlayb kelmoqdamiz.',
  },
  {
    id: 2,
    name: 'ZooMed Plus',
    type: 'Диагностический центр',
    typeUz: 'Diagnostika markazi',
    logo_color: '#1565C0',
    logo_initials: 'ZM',
    rating: 4.8,
    experience_yr: 8,
    consultations: 1840,
    price_uzs: 150000,
    discount_uzs: 20000,
    hours: 'с 09:00 до 20:00',
    hoursUz: '09:00 dan 20:00 gacha',
    phone_masked: '+998 71 2** *** 22',
    phone_full: '+998712341222',
    schedule: [
      { days: 'Пн. — Пт.', daysUz: 'Du. — Ju.', time: '09:00 — 20:00' },
      { days: 'Сб. — Вс.', daysUz: 'Sh. — Ya.', time: '10:00 — 18:00' },
    ],
    address: 'г. Ташкент, ул. Навои, 42',
    addressUz: 'Toshkent sh., Navoiy ko\'chasi, 42',
    bio: 'ZooMed Plus специализируется на ультразвуковой диагностике и лабораторных исследованиях для домашних животных. Современный рентген-кабинет, компьютерная томография для мелких животных.',
    bioUz: 'ZooMed Plus uy hayvonlari uchun ultratovush diagnostikasi va laboratoriya tadqiqotlariga ixtisoslashgan.',
  },
  {
    id: 3,
    name: 'Vet Hayot',
    type: 'Многопрофильная клиника',
    typeUz: 'Ko\'p tarmoqli klinika',
    logo_color: '#2E7D32',
    logo_initials: 'VH',
    rating: 4.7,
    experience_yr: 6,
    consultations: 1120,
    price_uzs: 130000,
    discount_uzs: 0,
    hours: 'с 08:00 до 19:00',
    hoursUz: '08:00 dan 19:00 gacha',
    phone_masked: '+998 71 2** *** 33',
    phone_full: '+998712341233',
    schedule: [
      { days: 'Пн. — Пт.', daysUz: 'Du. — Ju.', time: '08:00 — 19:00' },
      { days: 'Сб.', daysUz: 'Sh.', time: '09:00 — 16:00' },
      { days: 'Вс.', daysUz: 'Ya.', time: 'Выходной' },
    ],
    address: 'г. Ташкент, ул. Шота Руставели, 15',
    addressUz: 'Toshkent sh., Shota Rustaveli ko\'chasi, 15',
    bio: 'Vet Hayot — семейная клиника с опытными специалистами. Вакцинация, стерилизация, лечение внутренних болезней. Заботимся о каждом питомце как о своём.',
    bioUz: 'Vet Hayot — tajribali mutaxassislari bo\'lgan oilaviy klinika.',
  },
  {
    id: 4,
    name: 'PetCare',
    type: 'Ветеринарная клиника',
    typeUz: 'Veterinariya klinikasi',
    logo_color: '#6A1B9A',
    logo_initials: 'PC',
    rating: 4.6,
    experience_yr: 4,
    consultations: 780,
    price_uzs: 120000,
    discount_uzs: 15000,
    hours: 'с 10:00 до 22:00',
    hoursUz: '10:00 dan 22:00 gacha',
    phone_masked: '+998 71 2** *** 44',
    phone_full: '+998712341244',
    schedule: [
      { days: 'Пн. — Вс.', daysUz: 'Du. — Ya.', time: '10:00 — 22:00' },
    ],
    address: 'г. Ташкент, пр. Бунёдкор, 8',
    addressUz: 'Toshkent sh., Bunyodkor prospekti, 8',
    bio: 'PetCare работает круглосуточно без выходных. Неотложная ветеринарная помощь, стационар для животных после операций.',
    bioUz: 'PetCare dam olish kunlarisiz ishlaydi. Shoshilinch veterinariya yordami, operatsiyadan keyin stacionar.',
  },
  {
    id: 5,
    name: 'Nord Vet',
    type: 'Ветеринарная клиника',
    typeUz: 'Veterinariya klinikasi',
    logo_color: '#E65100',
    logo_initials: 'NV',
    rating: 4.5,
    experience_yr: 3,
    consultations: 560,
    price_uzs: 100000,
    discount_uzs: 0,
    hours: 'с 08:00 до 18:00',
    hoursUz: '08:00 dan 18:00 gacha',
    phone_masked: '+998 71 2** *** 55',
    phone_full: '+998712341255',
    schedule: [
      { days: 'Пн. — Пт.', daysUz: 'Du. — Ju.', time: '08:00 — 18:00' },
      { days: 'Сб.', daysUz: 'Sh.', time: '09:00 — 15:00' },
      { days: 'Вс.', daysUz: 'Ya.', time: 'Выходной' },
    ],
    address: 'г. Ташкент, ул. Юнусабад, 3',
    addressUz: 'Toshkent sh., Yunusobod ko\'chasi, 3',
    bio: 'Nord Vet — доступная ветеринарная помощь для всей семьи. Лечение, профилактика, грумминг.',
    bioUz: 'Nord Vet — butun oila uchun arzon veterinariya yordami.',
  },
]

type SortKey = 'rating' | 'price'

interface Props {
  service: ClinicService
  onBack: () => void
  onSelectClinic: (clinic: Clinic) => void
}

export default function ClinicList({ service, onBack, onSelectClinic }: Props) {
  const [allClinics, setAllClinics] = useState<Clinic[]>(MOCK_CLINICS)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [showFavs, setShowFavs] = useState(false)
  const [sort, setSort] = useState<SortKey | null>(null)
  const lang = getLang()

  useEffect(() => {
    api.vets()
      .then((vets: Vet[]) => setAllClinics(vets.map(vetToClinic)))
      .catch(() => { /* keep MOCK_CLINICS on error */ })
      .finally(() => setLoading(false))
  }, [])

  const toggleFav = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  let clinics = [...allClinics]
  if (showFavs) clinics = clinics.filter(c => favorites.has(c.id))
  if (sort === 'rating') clinics.sort((a, b) => b.rating - a.rating)
  if (sort === 'price')  clinics.sort((a, b) => a.price_uzs - b.price_uzs)

  const serviceName = lang === 'uz' ? service.uz : service.ru

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} style={iconBtn} aria-label={t('back')}><IconArrowLeft size={18} /></button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {serviceName}
        </span>
        <button style={{ ...iconBtn, border: 'none' }} aria-label="Поиск"><IconSearch size={18} /></button>
      </header>

      {/* Filter chips */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 16px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {/* Heart (favorites) */}
        <button
          onClick={() => setShowFavs(f => !f)}
          style={{
            ...chip,
            background: showFavs ? '#FFE0DE' : 'var(--surface-2)',
            color: showFavs ? '#C62828' : 'var(--text-muted)',
            border: showFavs ? '1.5px solid #C62828' : '1.5px solid var(--border)',
            fontSize: 16,
          }}
          aria-label="Избранные"
        ><IconHeartFilled size={16} /></button>

        {/* Sort by type */}
        <button
          onClick={() => setSort(null)}
          style={{
            ...chip,
            background: sort === null && !showFavs ? 'var(--primary)' : 'var(--surface-2)',
            color: sort === null && !showFavs ? '#fff' : 'var(--text-muted)',
            border: '1.5px solid transparent',
            gap: 4, display: 'inline-flex', alignItems: 'center',
          }}
        >
          {t('clinic.all_types')} <span style={{ fontSize: 10 }}>↕</span>
        </button>

        {/* Sort by rating */}
        <button
          onClick={() => setSort(sort === 'rating' ? null : 'rating')}
          style={{
            ...chip,
            background: sort === 'rating' ? 'var(--primary)' : 'var(--surface-2)',
            color: sort === 'rating' ? '#fff' : 'var(--text-muted)',
            border: '1.5px solid transparent',
            gap: 4, display: 'inline-flex', alignItems: 'center',
          }}
        >
          {t('clinic.by_rating')} <span style={{ fontSize: 10 }}>↕</span>
        </button>

        {/* Sort by price */}
        <button
          onClick={() => setSort(sort === 'price' ? null : 'price')}
          style={{
            ...chip,
            background: sort === 'price' ? 'var(--primary)' : 'var(--surface-2)',
            color: sort === 'price' ? '#fff' : 'var(--text-muted)',
            border: '1.5px solid transparent',
            gap: 4, display: 'inline-flex', alignItems: 'center',
          }}
        >
          {t('clinic.by_price')} <span style={{ fontSize: 10 }}>↕</span>
        </button>
      </div>

      {/* Clinic cards */}
      <div style={{ flex: 1, padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)', fontSize: 14 }}>
            Загрузка…
          </div>
        )}
        {!loading && clinics.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: 12 }}><IconHeart size={40} color="var(--text-muted)" /></div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{showFavs ? 'Нет избранных клиник' : 'Специалисты не найдены'}</div>
          </div>
        )}

        {!loading && clinics.map(clinic => {
          const isFav = favorites.has(clinic.id)
          return (
            <div
              key={clinic.id}
              style={{
                background: 'var(--surface)', borderRadius: 'var(--r-lg)',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(35,40,45,.06)',
                overflow: 'hidden',
              }}
            >
              {/* Top row */}
              <button
                onClick={() => onSelectClinic(clinic)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 14px 12px', background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                {/* Logo */}
                <div style={{
                  width: 68, height: 68, borderRadius: 18, flexShrink: 0,
                  background: clinic.logo_color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px',
                  boxShadow: `0 4px 12px ${clinic.logo_color}55`,
                }}>
                  {clinic.logo_initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                      {clinic.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r-pill)',
                        background: '#FFF8E1', color: '#E65100',
                      }}>
                        <IconStarFilled size={11} color="#E65100" /> {clinic.rating.toFixed(1)}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    {lang === 'uz' ? clinic.hoursUz : clinic.hours}
                  </div>
                </div>
              </button>

              {/* Actions row */}
              <div style={{
                display: 'flex', gap: 8, padding: '0 14px 14px',
              }}>
                <button
                  onClick={() => onSelectClinic(clinic)}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 'var(--r-md)',
                    background: 'var(--primary)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14, color: '#fff',
                    minHeight: 44, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {lang === 'uz' ? 'Yozilish →' : 'Записаться →'}
                </button>
                <button
                  onClick={e => toggleFav(clinic.id, e)}
                  aria-label={isFav ? 'Убрать из избранного' : 'В избранное'}
                  style={{
                    width: 48, height: 44, borderRadius: 'var(--r-md)', flexShrink: 0,
                    background: isFav ? '#FFE0DE' : 'var(--surface-2)',
                    border: isFav ? '1px solid #C62828' : '1px solid var(--border)',
                    fontSize: 20, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: isFav ? '#C62828' : 'var(--text-muted)',
                    transition: 'all .15s',
                  }}
                >
                  {isFav ? <IconHeartFilled size={20} color="#C62828" /> : <IconHeart size={20} />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 'var(--r-md)',
  border: '1.5px solid var(--border)', background: 'transparent',
  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}

const chip: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 'var(--r-pill)', whiteSpace: 'nowrap',
  fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  minHeight: 36, transition: 'all .15s',
}
