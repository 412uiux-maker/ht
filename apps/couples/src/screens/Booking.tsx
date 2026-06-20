import { useState, useEffect } from 'react'
import type { Vet, Consultation, Pet } from '../api'
import { api, getOwnerId } from '../api'
import { t } from '../i18n'

interface Props {
  lang: string
  vet: Vet
  onBack: () => void
  onBooked: (consultation: Consultation) => void
}

const SPECIES = [
  { key: 'cat',     emoji: '🐱', labelKey: 'book.cat' as const },
  { key: 'dog',     emoji: '🐶', labelKey: 'book.dog' as const },
  { key: 'rabbit',  emoji: '🐰', labelKey: 'book.rabbit' as const },
  { key: 'parrot',  emoji: '🦜', labelKey: 'book.parrot' as const },
  { key: 'hamster', emoji: '🐹', labelKey: 'book.hamster' as const },
  { key: 'other',   emoji: '🐾', labelKey: 'book.other' as const },
]

const REMEMBERED_NAME_KEY = 'ht_client_name'
const PROBLEM_MAX = 800
const VALID_BOOKING_SPECIES = ['cat', 'dog', 'rabbit', 'parrot', 'hamster', 'other']

export default function Booking({ lang, vet, onBack, onBooked }: Props) {
  void lang
  const [form, setForm] = useState({
    client_name: localStorage.getItem(REMEMBERED_NAME_KEY) || '',
    pet_name: '',
    pet_species: 'cat',
    problem: '',
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')
  const [pets, setPets] = useState<Pet[] | null>(null)
  const [selectedPetId, setSelectedPetId] = useState<string>('new')

  useEffect(() => {
    api.pets(getOwnerId()).then(list => {
      setPets(list)
      if (list.length > 0) {
        const first = list[0]
        setSelectedPetId(first.id)
        setForm(f => ({
          ...f,
          pet_name: first.name,
          pet_species: VALID_BOOKING_SPECIES.includes(first.species) ? first.species : 'other',
        }))
      }
    }).catch(() => setPets([]))
  }, [])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const touch = (k: string) => setTouched((prev) => ({ ...prev, [k]: true }))

  const selectPet = (petId: string) => {
    setSelectedPetId(petId)
    if (petId === 'new') {
      setForm(f => ({ ...f, pet_name: '', pet_species: 'cat' }))
      return
    }
    const pet = pets?.find(p => p.id === petId)
    if (pet) {
      setForm(f => ({
        ...f,
        pet_name: pet.name,
        pet_species: VALID_BOOKING_SPECIES.includes(pet.species) ? pet.species : 'other',
      }))
    }
  }

  const errors: Record<string, string> = {
    client_name: form.client_name.trim() ? '' : t('book.name_empty'),
    pet_name:    (selectedPetId !== 'new' || form.pet_name.trim()) ? '' : t('book.pet_empty'),
    problem:     form.problem.trim()     ? '' : t('book.problem_empty'),
  }
  const hasErrors = Object.values(errors).some(Boolean)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ client_name: true, pet_name: true, problem: true })
    if (hasErrors) return
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

  const baseInput: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 'var(--r-md)',
    border: '1.5px solid var(--border)', background: 'var(--surface)',
    fontSize: 15, color: 'var(--text)', outline: 'none', minHeight: 48,
    fontFamily: 'inherit', transition: 'border-color .15s',
  }
  const inputStyle = (key: string): React.CSSProperties =>
    touched[key] && errors[key]
      ? { ...baseInput, borderColor: 'var(--danger)' }
      : baseInput

  const FieldError = ({ k }: { k: string }) =>
    touched[k] && errors[k] ? (
      <div role="alert" style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
        {errors[k]}
      </div>
    ) : null

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
          aria-label={t('back')}
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

      <StepBar step={1} />

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {/* Vet summary card */}
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{vet.name}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 8 }}>{vet.specialty}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
                {vet.price_uzs.toLocaleString('ru-RU')} {t('currency')}
              </span>
              <span style={{ fontSize: 12, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 4 }}>
                ⭐ {Number(vet.rating).toFixed(1)} · {vet.experience_yr} {t('home.exp')}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Client name */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
              {t('book.client_name')} <Req />
            </label>
            <input
              style={inputStyle('client_name')}
              type="text"
              required
              autoFocus={!form.client_name}
              value={form.client_name}
              onChange={(e) => set('client_name', e.target.value)}
              onBlur={() => touch('client_name')}
              placeholder={t('book.client_name')}
              aria-invalid={!!(touched.client_name && errors.client_name)}
            />
            <FieldError k="client_name" />
          </div>

          {/* Pet picker — shown when pets are loaded */}
          {pets !== null && pets.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-muted)' }}>
                {t('book.select_pet')}
              </label>
              <div style={{
                display: 'flex', gap: 8, overflowX: 'auto',
                padding: '2px 2px 6px', scrollbarWidth: 'none',
              }}>
                {pets.map(pet => {
                  const active = selectedPetId === pet.id
                  return (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => selectPet(pet.id)}
                      aria-pressed={active}
                      style={{
                        flexShrink: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 5, padding: '10px 14px',
                        borderRadius: 'var(--r-lg)',
                        border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        background: active ? 'rgba(242,120,75,.08)' : 'var(--surface)',
                        minWidth: 70, cursor: 'pointer', transition: 'all .15s',
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{pet.avatar_emoji}</span>
                      <span style={{
                        fontSize: 11, fontWeight: active ? 700 : 500,
                        color: active ? 'var(--primary)' : 'var(--text)',
                        maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {pet.name}
                      </span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => selectPet('new')}
                  aria-pressed={selectedPetId === 'new'}
                  style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 5, padding: '10px 14px',
                    borderRadius: 'var(--r-lg)',
                    border: `2px solid ${selectedPetId === 'new' ? 'var(--primary)' : 'var(--border)'}`,
                    background: selectedPetId === 'new' ? 'rgba(242,120,75,.08)' : 'var(--surface)',
                    minWidth: 70, cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 28, lineHeight: 1 }}>➕</span>
                  <span style={{
                    fontSize: 11, fontWeight: selectedPetId === 'new' ? 700 : 500,
                    color: selectedPetId === 'new' ? 'var(--primary)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    {t('book.new_pet')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Pet name + species — only when entering manually */}
          {selectedPetId === 'new' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
                  {t('book.pet_name')} <Req />
                </label>
                <input
                  style={inputStyle('pet_name')}
                  type="text"
                  required
                  value={form.pet_name}
                  onChange={(e) => set('pet_name', e.target.value)}
                  onBlur={() => touch('pet_name')}
                  placeholder={t('book.pet_name')}
                  aria-invalid={!!(touched.pet_name && errors.pet_name)}
                />
                <FieldError k="pet_name" />
              </div>

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
                        aria-pressed={active}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          gap: 4, padding: '12px 8px', borderRadius: 'var(--r-md)',
                          border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                          background: active ? 'var(--surface-2)' : 'var(--surface)',
                          cursor: 'pointer', minHeight: 72, transition: 'all .15s',
                        }}
                      >
                        <span style={{ fontSize: 28 }}>{emoji}</span>
                        <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : 'var(--text-muted)' }}>
                          {t(labelKey)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Problem */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-muted)' }}>
              <span>{t('book.problem')} <Req /></span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 400, fontSize: 12 }}>
                {form.problem.length}/{PROBLEM_MAX}
              </span>
            </label>
            <textarea
              style={{ ...inputStyle('problem'), minHeight: 110, resize: 'vertical' }}
              required
              maxLength={PROBLEM_MAX}
              value={form.problem}
              onChange={(e) => set('problem', e.target.value)}
              onBlur={() => touch('problem')}
              placeholder={t('book.problem_hint')}
              rows={4}
              aria-invalid={!!(touched.problem && errors.problem)}
            />
            <FieldError k="problem" />
          </div>

          {err && (
            <div role="alert" style={{
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

function Req() {
  return <span style={{ color: 'var(--danger)' }} aria-hidden="true">*</span>
}

function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const labels = [t('book.step_form'), t('book.step_pay'), t('book.step_chat')]
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', padding: '10px 24px 12px',
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    }}>
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const done = n < step
        const active = n === step
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < labels.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: active || done ? 'var(--primary)' : 'var(--border)',
                color: active || done ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 12,
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{
                fontSize: 11, whiteSpace: 'nowrap',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 400,
              }}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 6px',
                marginBottom: 14,
                background: done ? 'var(--primary)' : 'var(--border)',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
