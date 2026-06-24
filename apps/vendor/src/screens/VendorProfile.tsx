import { useState } from 'react'
import type { VendorSession } from '../types'
import { setSession } from '../types'

interface Props {
  session: VendorSession
  onSessionUpdate: (s: VendorSession) => void
}

const SPECIALTIES = [
  'Терапевт (кошки, собаки)',
  'Хирург',
  'Дерматолог',
  'Офтальмолог',
  'Стоматолог',
  'Кардиолог',
  'Онколог',
  'Невролог',
]

export default function VendorProfile({ session, onSessionUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<VendorSession>(session)
  const [saved, setSaved] = useState(false)

  const openEdit = () => { setDraft({ ...session }); setEditing(true) }

  const save = () => {
    setSession(draft)
    onSessionUpdate(draft)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const AVATARS = ['🐕', '🐈', '🦜', '🐇', '🦔', '🐠', '🐾', '🩺']

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Профиль</h1>
        <button onClick={openEdit} style={btnGhost}>Редактировать</button>
      </div>

      {saved && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--r-sm)',
          background: 'rgba(76,175,125,.15)', color: 'var(--green)',
          fontWeight: 600, fontSize: 14, marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ✅ Профиль обновлён
        </div>
      )}

      {/* Identity card */}
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-md)',
        border: '1px solid var(--surface3)', padding: '24px 20px',
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(242,120,75,.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 42,
        }}>
          {session.avatar_emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>
            {session.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>{session.specialty}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{
              fontSize: 12, padding: '3px 10px', borderRadius: 999, fontWeight: 700,
              background: 'rgba(242,120,75,.12)', color: 'var(--coral)',
            }}>
              ⭐ {session.rating.toFixed(1)}
            </span>
            <span style={{
              fontSize: 12, padding: '3px 10px', borderRadius: 999, fontWeight: 700,
              background: 'rgba(76,175,125,.12)', color: 'var(--green)',
            }}>
              {session.experience_yr} лет опыта
            </span>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-md)',
        border: '1px solid var(--surface3)', overflow: 'hidden', marginBottom: 16,
      }}>
        {[
          { icon: '💬', label: 'О себе', value: session.bio || '—' },
          { icon: '💰', label: 'Цена за консультацию', value: `${session.price_uzs.toLocaleString('ru-RU')} сум` },
        ].map((row, i) => (
          <div key={row.label} style={{
            padding: '14px 16px',
            borderTop: i === 0 ? 'none' : '1px solid var(--surface3)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
              {row.icon} {row.label}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{row.value}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { icon: '📋', label: 'Консультаций', value: '48' },
          { icon: '⭐', label: 'Рейтинг',       value: session.rating.toFixed(1) },
          { icon: '🏆', label: 'Опыт',           value: `${session.experience_yr} лет` },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--surface3)', padding: '14px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="overlay">
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-md)',
            padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 16px 40px rgba(0,0,0,.25)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Редактировать профиль</h2>

            {/* Avatar picker */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>
                Аватар
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {AVATARS.map(a => (
                  <button
                    key={a}
                    onClick={() => setDraft({ ...draft, avatar_emoji: a })}
                    style={{
                      width: 44, height: 44, borderRadius: 'var(--r-sm)', fontSize: 22,
                      border: draft.avatar_emoji === a
                        ? '2px solid var(--coral)'
                        : '1.5px solid var(--surface3)',
                      background: draft.avatar_emoji === a
                        ? 'rgba(242,120,75,.1)'
                        : 'var(--surface2)',
                      cursor: 'pointer',
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Имя и фамилия">
                <input style={inp} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </Field>
              <Field label="Специальность">
                <select style={inp} value={draft.specialty} onChange={e => setDraft({ ...draft, specialty: e.target.value })}>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="О себе">
                <textarea
                  style={{ ...inp, height: 80, resize: 'vertical' }}
                  value={draft.bio}
                  onChange={e => setDraft({ ...draft, bio: e.target.value })}
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Цена за консультацию (сум)">
                  <input style={inp} type="number" value={draft.price_uzs} onChange={e => setDraft({ ...draft, price_uzs: +e.target.value })} />
                </Field>
                <Field label="Лет опыта">
                  <input style={inp} type="number" value={draft.experience_yr} onChange={e => setDraft({ ...draft, experience_yr: +e.target.value })} />
                </Field>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(false)} style={btnGhost}>Отмена</button>
              <button onClick={save} disabled={!draft.name.trim()} style={btnCoral}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'var(--surface2)',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
}
const btnCoral: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 'var(--r-sm)', border: 'none',
  background: 'var(--coral)', color: '#fff', fontWeight: 600, fontSize: 14,
  cursor: 'pointer', minHeight: 44, fontFamily: 'inherit',
}
const btnGhost: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'var(--surface2)',
  color: 'var(--text2)', fontWeight: 500, fontSize: 14,
  cursor: 'pointer', minHeight: 44, fontFamily: 'inherit',
}
