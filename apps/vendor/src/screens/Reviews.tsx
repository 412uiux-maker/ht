import { useState } from 'react'
import { IconUser, IconStarFilled } from '@ht/shared'

interface Review {
  id: number
  client: string
  pet: string
  rating: number
  date: string
  text: string
  reply: string
}

const STARS = [5, 4, 3, 2, 1]

const INITIAL: Review[] = [
  { id: 1, client: 'Алишер Н.',   pet: 'Бобик (пёс)',    rating: 5, date: '23.06.2026', text: 'Отличный специалист! Всё объяснил понятно, лечение помогло.',        reply: '' },
  { id: 2, client: 'Гульнора Т.', pet: 'Мурзик (кот)',   rating: 5, date: '21.06.2026', text: 'Очень внимательный врач. Ответил на все вопросы, рекомендую.',          reply: 'Спасибо за доверие! Буду рад помочь снова.' },
  { id: 3, client: 'Санжар М.',   pet: 'Рекс (пёс)',     rating: 4, date: '20.06.2026', text: 'Хорошая консультация, но ждал ответа немного дольше, чем хотелось.',    reply: '' },
  { id: 4, client: 'Камола Р.',   pet: 'Снежок (кот)',   rating: 3, date: '18.06.2026', text: 'Консультация помогла, но хотелось бы более подробных рекомендаций.',     reply: '' },
  { id: 5, client: 'Дилноза У.',  pet: 'Тузик (пёс)',    rating: 5, date: '17.06.2026', text: 'Всё на высшем уровне. Питомец поправился, спасибо большое!',            reply: 'Очень рад! Берегите Тузика 🐶' },
  { id: 6, client: 'Бобур Х.',    pet: 'Рыжик (кот)',    rating: 4, date: '15.06.2026', text: 'Хороший врач, знает своё дело. Рекомендую.',                            reply: '' },
]

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL)
  const [filter, setFilter] = useState<number | null>(null)
  const [replying, setReplying] = useState<number | null>(null)
  const [draftReply, setDraftReply] = useState('')

  const filtered = filter ? reviews.filter(r => r.rating === filter) : reviews
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  const submitReply = (id: number) => {
    if (!draftReply.trim()) return
    setReviews(prev => prev.map(r => r.id === id ? { ...r, reply: draftReply.trim() } : r))
    setReplying(null)
    setDraftReply('')
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Отзывы</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>{avgRating.toFixed(1)}</span>
          <Stars value={avgRating} />
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>({reviews.length})</span>
        </div>
      </div>

      {/* Rating bars */}
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-md)',
        border: '1px solid var(--surface3)', padding: '14px 16px', marginBottom: 20,
      }}>
        {STARS.map(s => {
          const cnt = reviews.filter(r => r.rating === s).length
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)', width: 10, textAlign: 'right' }}>{s}</span>
              <IconStarFilled size={13} color="#F59E0B" />
              <div style={{ flex: 1, height: 6, background: 'var(--surface3)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  width: `${(cnt / reviews.length) * 100}%`, height: '100%',
                  background: s >= 4 ? 'var(--green)' : s === 3 ? '#FFA726' : 'var(--danger)',
                  borderRadius: 99, transition: 'width .4s',
                }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text2)', width: 16, textAlign: 'right' }}>{cnt}</span>
            </div>
          )
        })}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <Chip active={filter === null} onClick={() => setFilter(null)}>Все</Chip>
        {STARS.map(s => (
          <Chip key={s} active={filter === s} onClick={() => setFilter(f => f === s ? null : s)}>
            <span style={{ display: 'inline-flex', gap: 1 }}>{Array.from({ length: s }, (_, i) => <IconStarFilled key={i} size={10} color="#F59E0B" />)}</span> ·{reviews.filter(r => r.rating === s).length}
          </Chip>
        ))}
      </div>

      {/* Review cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(r => (
          <div key={r.id} style={{
            background: 'var(--surface)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--surface3)', padding: '16px',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconUser size={20} color="var(--text2)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.client}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{r.pet}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <Stars value={r.rating} />
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>{r.date}</span>
              </div>
            </div>

            {/* Text */}
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>{r.text}</p>

            {/* Existing reply */}
            {r.reply && (
              <div style={{
                marginTop: 10, padding: '10px 12px',
                background: 'rgba(242,120,75,.07)', borderRadius: 'var(--r-sm)',
                borderLeft: '3px solid var(--coral)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--coral)', marginBottom: 4 }}>Ваш ответ</div>
                <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>{r.reply}</p>
              </div>
            )}

            {/* Reply input */}
            {replying === r.id ? (
              <div style={{ marginTop: 12 }}>
                <textarea
                  autoFocus
                  value={draftReply}
                  onChange={e => setDraftReply(e.target.value)}
                  placeholder="Напишите ответ…"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--surface3)', background: 'var(--surface2)',
                    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit',
                    resize: 'vertical', height: 68, outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button onClick={() => { setReplying(null); setDraftReply('') }} style={btnGhost}>Отмена</button>
                  <button onClick={() => submitReply(r.id)} disabled={!draftReply.trim()} style={btnCoral}>
                    Отправить
                  </button>
                </div>
              </div>
            ) : !r.reply ? (
              <button
                onClick={() => { setReplying(r.id); setDraftReply('') }}
                style={{ marginTop: 10, background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 600, color: 'var(--coral)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Ответить ↩
              </button>
            ) : (
              <button
                onClick={() => { setReplying(r.id); setDraftReply(r.reply) }}
                style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Редактировать ответ
              </button>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text2)' }}>
            <div style={{ marginBottom: 10 }}><IconStarFilled size={36} color="#F59E0B" /></div>
            <div style={{ fontSize: 14 }}>Нет отзывов с таким рейтингом</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ opacity: i <= Math.round(value) ? 1 : 0.25 }}>
          <IconStarFilled size={12} color="#F59E0B" />
        </span>
      ))}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
        background: active ? 'var(--coral)' : 'var(--surface2)',
        color: active ? '#fff' : 'var(--text2)',
        fontSize: 12, fontWeight: 600, fontFamily: 'inherit', minHeight: 32,
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  )
}

const btnCoral: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 'var(--r-sm)', border: 'none',
  background: 'var(--coral)', color: '#fff', fontWeight: 600, fontSize: 13,
  cursor: 'pointer', minHeight: 36, fontFamily: 'inherit',
}
const btnGhost: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'var(--surface2)',
  color: 'var(--text2)', fontWeight: 500, fontSize: 13,
  cursor: 'pointer', minHeight: 36, fontFamily: 'inherit',
}
