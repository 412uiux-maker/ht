import { useState } from 'react'
import type { Vet, Consultation } from '../api'
import { api } from '../api'
import { t } from '../i18n'

interface Props {
  lang: string
  vet: Vet
  onBack: () => void
  onBooked: (consultation: Consultation) => void
}

const SPECIES: { key: string; emoji: string; labelKey: keyof ReturnType<typeof buildKeys> }[] = [
  { key: 'cat',     emoji: '🐱', labelKey: 'book.cat' },
  { key: 'dog',     emoji: '🐶', labelKey: 'book.dog' },
  { key: 'rabbit',  emoji: '🐰', labelKey: 'book.rabbit' },
  { key: 'parrot',  emoji: '🦜', labelKey: 'book.parrot' },
  { key: 'hamster', emoji: '🐹', labelKey: 'book.hamster' },
  { key: 'other',   emoji: '🐾', labelKey: 'book.other' },
]

function buildKeys() {
  return {
    'book.cat': '', 'book.dog': '', 'book.rabbit': '',
    'book.parrot': '', 'book.hamster': '', 'book.other': '',
  }
}

const REMEMBERED_NAME_KEY = 'ht_client_name'

export default function Booking({ lang, vet, onBack, onBooked }: Props) {
  void lang
  const [form, setForm] = useState({
    client_name: localStorage.getItem(REMEMBERED_NAME_KEY) || '',
    pet_name: '',
    pet_species: 'cat',
    problem: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_name.trim() || !form.pet_name.trim() || !form.problem.trim()) return
    setSubmitting(true)
    setErr('')
    try {
      localStorage.setItem(REMEMBERED_NAME_KEY, form.client_name.trim())
      const c = await api.createConsultation({ vet_id: vet.id, ...form })
      onBooked(c)
    } catch {
      setErr(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  const input: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 'var(--r-md)',
    border: '1.5px solid var(--border)', background: 'var(--surface)',
    fontSize: 15, color: 'var(--text)', outline: 'none', minHeight: 48,
    fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Topbar */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{t('book.title')}</span>
      </header>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {/* Vet card */}
        <div style={{
          background: 'var(--grad-warm)', borderRadius: 'var(--r-lg)',
          padding: '16px', marginBottom: 24, color: '#fff',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            fontSize: 40, width: 60, height: 60, borderRadius: 'var(--r-md)',
            background: 'rgba(255,255,255,.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {vet.avatar_emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{vet.name}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 6 }}>{vet.specialty}</div>
            <div style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
              {vet.price_uzs.toLocaleString('ru-RU')} сум
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Client name */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
              {t('book.client_name')}
            </label>
            <input
              style={input}
              type="text"
              required
              value={form.client_name}
              onChange={(e) => set('client_name', e.target.value)}
              placeholder={t('book.client_name')}
            />
          </div>

          {/* Pet name */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
              {t('book.pet_name')}
            </label>
            <input
              style={input}
              type="text"
              required
              value={form.pet_name}
              onChange={(e) => set('pet_name', e.target.value)}
              placeholder={t('book.pet_name')}
            />
          </div>

          {/* Species picker */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-muted)' }}>
              {t('book.pet_species')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {SPECIES.map(({ key, emoji, labelKey }) => {
                const active = form.pet_species === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => set('pet_species', key)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 4, padding: '12px 8px', borderRadius: 'var(--r-md)',
                      border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      background: active ? 'var(--surface-2)' : 'var(--surface)',
                      cursor: 'pointer', minHeight: 72, transition: 'all .15s',
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{emoji}</span>
                    <span style={{
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      color: active ? 'var(--primary)' : 'var(--text-muted)',
                    }}>
                      {t(labelKey as Parameters<typeof t>[0])}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Problem */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
              {t('book.problem')}
            </label>
            <textarea
              style={{ ...input, minHeight: 110, resize: 'vertical' }}
              required
              value={form.problem}
              onChange={(e) => set('problem', e.target.value)}
              placeholder={t('book.problem_hint')}
              rows={4}
            />
          </div>

          {err && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--r-md)',
              background: '#FFE0DE', color: 'var(--danger)', fontSize: 14,
            }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '15px', borderRadius: 'var(--r-pill)',
              background: submitting ? 'var(--border)' : 'var(--primary)',
              color: submitting ? 'var(--text-muted)' : 'var(--on-primary)',
              border: 'none', fontWeight: 700, fontSize: 16, minHeight: 54,
              transition: 'background .2s', fontFamily: 'inherit',
            }}
          >
            {submitting ? t('book.submitting') : t('book.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
