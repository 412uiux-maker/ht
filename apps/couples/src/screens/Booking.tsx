import { useState } from 'react'
import { api, Vet } from '../api'
import { t } from '../i18n'

interface Props {
  lang: string
  vet: Vet
  onBack: () => void
  onBooked: (consultationId: string) => void
}

const SPECIES = ['cat', 'dog', 'rabbit', 'parrot', 'other'] as const

export default function Booking({ lang, vet, onBack, onBooked }: Props) {
  void lang
  const [form, setForm] = useState({ client_name: '', pet_name: '', pet_species: 'cat', problem: '' })
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_name.trim() || !form.pet_name.trim() || !form.problem.trim()) return
    setSubmitting(true)
    setErr('')
    try {
      const c = await api.createConsultation({ vet_id: vet.id, ...form })
      onBooked(c.id)
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
            width: 44, height: 44, borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
            background: 'transparent', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ←
        </button>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{t('book.title')}</span>
      </header>

      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        {/* Vet card */}
        <div style={{
          background: 'var(--surface-2)', borderRadius: 'var(--r-lg)',
          padding: '14px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            fontSize: 36, width: 52, height: 52, borderRadius: 'var(--r-md)',
            background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {vet.avatar_emoji}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{vet.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{vet.specialty}</div>
            <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
              {vet.price_uzs.toLocaleString('ru-RU')} {t('home.price')}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
              {t('book.pet_species')}
            </label>
            <select
              style={{ ...input }}
              value={form.pet_species}
              onChange={(e) => set('pet_species', e.target.value)}
              required
            >
              {SPECIES.map((s) => (
                <option key={s} value={s}>{t(`book.${s}` as Parameters<typeof t>[0])}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
              {t('book.problem')}
            </label>
            <textarea
              style={{ ...input, minHeight: 100, resize: 'vertical' }}
              required
              value={form.problem}
              onChange={(e) => set('problem', e.target.value)}
              placeholder={t('book.problem')}
              rows={3}
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
              padding: '14px', borderRadius: 'var(--r-pill)',
              background: submitting ? 'var(--border)' : 'var(--primary)',
              color: submitting ? 'var(--text-muted)' : 'var(--on-primary)',
              border: 'none', fontWeight: 700, fontSize: 16, minHeight: 52,
              transition: 'background .2s',
            }}
          >
            {submitting ? t('book.submitting') : t('book.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
