import { useState } from 'react'
import { IconArrowLeft, IconStarFilled, IconCalendar, IconMapPin, IconHeart, IconHeartFilled, IconPhone, IconStethoscope } from '@ht/shared'
import { t, getLang } from '../i18n'
import type { Clinic } from './ClinicList'
import type { ClinicService } from './ClinicServicePicker'

interface Props {
  clinic: Clinic
  service: ClinicService
  onBack: () => void
  onViewOthers: () => void
}

export default function ClinicDetail({ clinic, onBack, onViewOthers }: Props) {
  const [bioExpanded, setBioExpanded] = useState(false)
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [fav, setFav] = useState(false)
  const lang = getLang()

  const bio = lang === 'uz' ? clinic.bioUz : clinic.bio
  const type = lang === 'uz' ? clinic.typeUz : clinic.type
  const address = lang === 'uz' ? clinic.addressUz : clinic.address
  const hours = lang === 'uz' ? clinic.hoursUz : clinic.hours

  const price = clinic.price_uzs.toLocaleString('ru-RU')
  const finalPrice = clinic.discount_uzs
    ? (clinic.price_uzs - clinic.discount_uzs).toLocaleString('ru-RU')
    : price

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} style={iconBtn} aria-label={t('back')}><IconArrowLeft size={18} /></button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>
          {lang === 'uz' ? 'Klinika' : 'Клиника'}
        </span>
        <button
          onClick={() => setFav(f => !f)}
          aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
          style={{ ...iconBtn, color: fav ? '#C62828' : 'var(--text-muted)' }}
        >
          {fav ? <IconHeartFilled size={20} color="#C62828" /> : <IconHeart size={20} />}
        </button>
        <button
          aria-label={t('clinic.share')}
          style={{ ...iconBtn, fontSize: 18 }}
        >↗</button>
      </header>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 90 }}>
        {/* Clinic identity card */}
        <div style={{
          margin: '16px 16px 0',
          background: 'var(--surface)', borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)', padding: '20px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 76, height: 76, borderRadius: 20, flexShrink: 0,
            background: clinic.logo_color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 26, letterSpacing: '-0.5px',
            boxShadow: `0 6px 20px ${clinic.logo_color}44`,
          }}>
            {clinic.logo_initials}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', lineHeight: 1.2 }}>
              {clinic.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{type}</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 1, margin: '12px 16px 0',
          background: 'var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          {[
            { val: `${clinic.experience_yr} ${lang === 'uz' ? 'yil' : 'лет'}`, label: t('clinic.experience') },
            { val: <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IconStarFilled size={13} color="#F59E0B" /> {clinic.rating.toFixed(2)}</span>, label: t('clinic.rating') },
            { val: clinic.consultations.toLocaleString('ru-RU'), label: t('clinic.consults') },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--surface)', padding: '14px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{s.val}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Bio */}
        <div style={{ margin: '12px 16px 0' }}>
          <div style={{
            fontSize: 14, color: 'var(--text)', lineHeight: 1.6,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: bioExpanded ? 99 : 3,
            WebkitBoxOrient: 'vertical' as const,
          }}>
            {bio}
          </div>
          {bio.length > 120 && (
            <button
              onClick={() => setBioExpanded(e => !e)}
              style={{
                background: 'none', border: 'none', padding: 0, marginTop: 4,
                fontSize: 13, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              {bioExpanded ? t('clinic.collapse') : t('clinic.read_more')} {bioExpanded ? '↑' : '›'}
            </button>
          )}
        </div>

        {/* Booking block */}
        <div style={{
          margin: '12px 16px 0',
          background: 'var(--surface)', borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)', padding: '16px 20px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
            {t('clinic.book_title')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>
              {finalPrice} {t('currency')}
            </span>
            {clinic.discount_uzs > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-pill)',
                background: '#D1F2E4', color: '#1A7A4A',
              }}>
                −{clinic.discount_uzs.toLocaleString('ru-RU')} {t('currency')}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            {t('clinic.duration')}
          </div>
        </div>

        {/* Phone */}
        <div style={{
          margin: '12px 16px 0',
          background: 'var(--surface)', borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconPhone size={18} color="var(--text-muted)" />
              <span style={{ fontSize: 14, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                {phoneRevealed ? clinic.phone_full : clinic.phone_masked}
              </span>
            </div>
            <button
              onClick={() => setPhoneRevealed(true)}
              style={{
                padding: '8px 14px', borderRadius: 'var(--r-pill)',
                background: 'transparent', border: '1.5px solid var(--primary)',
                fontSize: 13, fontWeight: 600, color: 'var(--primary)',
                cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 36,
                fontFamily: 'inherit',
              }}
            >
              {t('clinic.show_phone')}
            </button>
          </div>

          {/* Schedule */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}><IconCalendar size={18} color="var(--text-muted)" /></span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {clinic.schedule.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {lang === 'uz' ? s.daysUz : s.days}:{' '}
                    </span>
                    {s.time}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Address */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}><IconMapPin size={18} color="var(--text-muted)" /></span>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{address}</div>
            </div>
          </div>
        </div>

        {/* Working hours summary */}
        <div style={{
          margin: '8px 16px 0', padding: '10px 14px',
          background: '#D1F2E4', borderRadius: 'var(--r-md)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1A7A4A', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A7A4A' }}>
            {lang === 'uz' ? 'Bugun ishlaydi' : 'Сегодня работает'}: {hours}
          </span>
        </div>

        {/* Other clinics */}
        <button
          onClick={onViewOthers}
          style={{
            width: 'calc(100% - 32px)', margin: '12px 16px 0',
            background: 'var(--surface)', borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg,#F8915A,#F26B47)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconStethoscope size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
              {t('clinic.other')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {t('clinic.other_sub')}
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
        </button>
      </div>

      {/* Fixed bottom CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        padding: '12px 16px 20px',
        background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
        pointerEvents: 'none',
      }}>
        <a
          href={`tel:${clinic.phone_full}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: '14px',
            borderRadius: 'var(--r-pill)', textAlign: 'center',
            background: 'var(--primary)', color: '#fff',
            fontWeight: 800, fontSize: 16, textDecoration: 'none',
            pointerEvents: 'auto', minHeight: 52,
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(242,120,75,.45)',
          } as React.CSSProperties}
        >
          <span>{t('clinic.call_btn')}</span>
          <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 1 }}>
            {lang === 'uz' ? 'Bugun ishlaydi' : 'Сегодня работает'}: {hours}
          </span>
        </a>
      </div>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 'var(--r-md)',
  border: '1.5px solid var(--border)', background: 'transparent',
  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}
