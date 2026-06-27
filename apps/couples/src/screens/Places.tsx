import { useState, useEffect } from 'react'
import { IconArrowLeft, IconStarFilled, IconPaw, IconClock, IconMapPin, IconHeart, IconHeartFilled, IconPhone } from '@ht/shared'
import { t, getLang } from '../i18n'
import { api } from '../api'
import type { ApiPlace } from '../api'

type PlaceType = 'park' | 'cafe' | 'shop' | 'grooming' | 'hotel'
type Place = ApiPlace

const TYPE_LABEL_RU: Record<PlaceType, string> = {
  park: 'Парк', cafe: 'Кафе', shop: 'Зоомагазин', grooming: 'Груминг', hotel: 'Отель',
}
const TYPE_LABEL_UZ: Record<PlaceType, string> = {
  park: 'Park', cafe: 'Kafe', shop: "Zoomarket", grooming: 'Gruming', hotel: 'Mehmonxona',
}
const TYPE_COLOR: Record<PlaceType, string> = {
  park: '#2E7D32', cafe: '#C62828', shop: '#1565C0', grooming: '#7C3AED', hotel: '#F59E0B',
}

interface Props {
  onBack: () => void
}

export default function Places({ onBack }: Props) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState<PlaceType | 'all'>('all')
  const [selected, setSelected] = useState<Place | null>(null)
  const [favs, setFavs] = useState<Set<string>>(new Set())
  const lang = getLang()

  useEffect(() => {
    api.places()
      .then(data => { setPlaces(data); setError('') })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = typeFilter === 'all' ? places : places.filter(p => p.type === typeFilter)

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (selected) {
    const name = lang === 'uz' ? selected.nameUz : selected.nameRu
    const address = lang === 'uz' ? selected.addressUz : selected.addressRu
    const desc = lang === 'uz' ? selected.descUz : selected.descRu
    const typeLabel = lang === 'uz' ? TYPE_LABEL_UZ[selected.type] : TYPE_LABEL_RU[selected.type]
    const isFav = favs.has(selected.id)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', background: 'var(--surface)',
          borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
        }}>
          <button onClick={() => setSelected(null)} style={iconBtn} aria-label={t('back')}><IconArrowLeft size={18} /></button>
          <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>{name}</span>
          <button
            onClick={e => toggleFav(selected.id, e)}
            style={{ ...iconBtn, color: isFav ? '#C62828' : 'var(--text-muted)', border: 'none' }}
            aria-label={isFav ? 'Убрать' : 'В избранное'}
          >
            {isFav ? <IconHeartFilled size={20} color="#C62828" /> : <IconHeart size={20} />}
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 90 }}>
          {/* Hero tile */}
          <div style={{
            margin: '16px 16px 0',
            background: 'var(--surface)', borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)', padding: 20,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18, flexShrink: 0,
              background: selected.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, boxShadow: `0 6px 20px ${selected.color}44`,
            }}>
              {selected.emoji}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 3 }}>{name}</div>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r-pill)',
                background: selected.color + '22', color: selected.color,
              }}>
                {typeLabel}
              </span>
            </div>
          </div>

          {/* Rating + reviews */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 1, margin: '12px 16px 0',
            background: 'var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden',
            border: '1px solid var(--border)',
          }}>
            {[
              { val: <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IconStarFilled size={13} color="#F59E0B" /> {selected.rating}</span>, label: lang === 'uz' ? 'Reyting' : 'Рейтинг' },
              { val: selected.reviews, label: lang === 'uz' ? 'Sharhlar' : 'Отзывов' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--surface)', padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{s.val}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ margin: '12px 16px 0', fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{desc}</div>

          {/* Tags */}
          <div style={{ margin: '12px 16px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selected.tags.map(tag => (
              <span key={tag} style={{
                fontSize: 12, fontWeight: 600, padding: '5px 10px',
                borderRadius: 'var(--r-pill)',
                background: selected.color + '18', color: selected.color,
              }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Info card */}
          <div style={{
            margin: '12px 16px 0',
            background: 'var(--surface)', borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)',
          }}>
            {[
              { icon: <IconPaw size={18} color="var(--text-muted)" />, key: 'pets', label: lang === 'uz' ? 'Hayvonlar' : 'Питомцы', val: selected.petsAllowed.join(', ') },
              { icon: <IconClock size={18} color="var(--text-muted)" />, key: 'time', label: lang === 'uz' ? 'Ish vaqti' : 'Время работы', val: selected.workingHours },
              { icon: <IconMapPin size={18} color="var(--text-muted)" />, key: 'addr', label: lang === 'uz' ? 'Manzil' : 'Адрес', val: address },
            ].map((row, i, arr) => (
              <div key={row.key} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{row.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '12px 16px 20px',
          background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
          pointerEvents: 'none',
        }}>
          <a
            href={`tel:${selected.phone}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '100%', padding: '14px', borderRadius: 'var(--r-pill)',
              background: selected.color, color: '#fff',
              fontWeight: 800, fontSize: 16, textDecoration: 'none',
              pointerEvents: 'auto', minHeight: 52,
              boxShadow: `0 4px 20px ${selected.color}55`,
            } as React.CSSProperties}
          >
            <IconPhone size={16} color="#fff" style={{ verticalAlign: 'middle' }} /> {lang === 'uz' ? "Qo'ng'iroq qilish" : 'Позвонить'}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} style={iconBtn} aria-label={t('back')}><IconArrowLeft size={18} /></button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>{t('places.title')}</span>
      </header>

      {/* Hero */}
      <div style={{
        margin: '12px 16px 0', borderRadius: 'var(--r-xl)',
        background: 'linear-gradient(135deg,#2E7D32,#4CAF50)',
        padding: '20px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -16, top: -16, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
        <div style={{ fontSize: 28, marginBottom: 6 }}>🐕🌳🐱</div>
        <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 3 }}>{t('places.hero')}</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{t('places.hero_sub')}</div>
      </div>

      {/* Type filter */}
      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['all', 'park', 'cafe', 'shop', 'grooming', 'hotel'] as const).map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            style={{
              padding: '7px 14px', borderRadius: 'var(--r-pill)', whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 600,
              border: typeFilter === type ? 'none' : '1px solid var(--border)',
              cursor: 'pointer',
              background: typeFilter === type ? 'var(--primary)' : 'var(--surface)',
              color: typeFilter === type ? '#fff' : 'var(--text)',
              minHeight: 36,
            } as React.CSSProperties}
          >
            {type === 'all'
              ? (lang === 'uz' ? 'Barchasi' : 'Все')
              : (lang === 'uz' ? TYPE_LABEL_UZ[type] : TYPE_LABEL_RU[type])}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{t('loading')}</div>
        )}
        {!loading && error && (
          <div style={{ textAlign: 'center', color: 'var(--danger, #C62828)', padding: 24, fontSize: 14 }}>{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 14 }}>
            {lang === 'uz' ? "Joylashuvlar topilmadi" : 'Места не найдены'}
          </div>
        )}
        {filtered.map(place => {
          const name = lang === 'uz' ? place.nameUz : place.nameRu
          const address = lang === 'uz' ? place.addressUz : place.addressRu
          const typeLabel = lang === 'uz' ? TYPE_LABEL_UZ[place.type] : TYPE_LABEL_RU[place.type]
          const isFav = favs.has(place.id)

          return (
            <button
              key={place.id}
              onClick={() => setSelected(place)}
              style={{
                width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: place.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, boxShadow: `0 4px 12px ${place.color}44`,
              }}>
                {place.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 'var(--r-pill)',
                    background: place.color + '18', color: place.color,
                  }}>{typeLabel}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 2 }}><IconStarFilled size={11} color="#F59E0B" /> {place.rating} · {place.reviews}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  <IconMapPin size={12} color="var(--text-muted)" style={{ verticalAlign: 'middle' }} /> {address}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={e => toggleFav(place.id, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isFav ? '#C62828' : 'var(--text-muted)', padding: 4, minHeight: 36, display: 'flex', alignItems: 'center' }}
                  aria-label={isFav ? 'Убрать' : 'В избранное'}
                >
                  {isFav ? <IconHeartFilled size={20} color="#C62828" /> : <IconHeart size={20} />}
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
              </div>
            </button>
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
