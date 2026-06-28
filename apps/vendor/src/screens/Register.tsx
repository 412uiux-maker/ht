import { useState } from 'react'
import { api } from '../api'
import type { VendorSession } from '../types'

type Step = 1 | 2 | 3

interface EducationEntry { id: string; institution: string; degree: string; year: string }
interface ScienceEntry   { id: string; title: string; year: string }

interface FormData {
  specialty: string
  name: string
  bio: string
  personal_story: string
  education: EducationEntry[]
  science: ScienceEntry[]
  experience_yr: string
  price_uzs: string
  avatar_emoji: string
  phone: string
  email: string
  password: string
  confirmPassword: string
}

const SPECIALTIES: { label: string; emoji: string }[] = [
  { label: 'Терапевт',      emoji: '🩺' },
  { label: 'Хирург',        emoji: '⚕️' },
  { label: 'Дерматолог',    emoji: '🔬' },
  { label: 'Кардиолог',     emoji: '❤️' },
  { label: 'Офтальмолог',   emoji: '👁️' },
  { label: 'Диетолог',      emoji: '🥗' },
  { label: 'Кинолог',       emoji: '🐕' },
  { label: 'Фелинолог',     emoji: '🐈' },
  { label: 'Груммер',       emoji: '✂️' },
  { label: 'Зоопсихолог',   emoji: '🧠' },
  { label: 'Онколог',       emoji: '🎗️' },
  { label: 'Репродуктолог', emoji: '🧬' },
]

const AVATARS = ['👨‍⚕️', '👩‍⚕️', '🩺', '🐾', '🐕', '🐈', '💊', '🔬']

const STEP_LABELS = ['Специализация', 'О вас', 'Аккаунт']

const BIO_MAX = 400

export default function Register({
  onRegister,
  onBack,
}: {
  onRegister: (s: VendorSession) => void
  onBack: () => void
}) {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>({
    specialty: '', name: '', bio: '', personal_story: '', education: [], science: [],
    experience_yr: '', price_uzs: '', avatar_emoji: '👨‍⚕️',
    phone: '', email: '', password: '', confirmPassword: '',
  })
  const [focused, setFocused] = useState<string | null>(null)
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [eduDraft, setEduDraft] = useState<Omit<EducationEntry, 'id'> | null>(null)
  const [sciDraft, setSciDraft] = useState<Omit<ScienceEntry, 'id'> | null>(null)

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }))
  const touch = (k: keyof FormData) => setTouched(t => ({ ...t, [k]: true }))
  const blur = (k: keyof FormData) => { setFocused(null); touch(k) }

  // Validation errors (only shown after touch)
  const errs = {
    name:            form.name.trim().length < 2 ? 'Минимум 2 символа' : '',
    phone:           form.phone.length < 9 ? 'Введите 9 цифр номера' : '',
    password:        form.password.length < 6 ? 'Минимум 6 символов' : '',
    confirmPassword: form.password !== form.confirmPassword ? 'Пароли не совпадают' : '',
  }

  const canStep1 = form.specialty !== ''
  const canStep2 = form.name.trim().length >= 2
  const canStep3 = !errs.phone && !errs.password && !errs.confirmPassword && form.phone.length === 9

  const goNext = () => {
    if (step === 1 && canStep1) { setStep(2); return }
    if (step === 2) {
      touch('name')
      if (canStep2) setStep(3)
    }
  }
  const goBack = () => step > 1 ? setStep(s => (s - 1) as Step) : onBack()

  const handleSubmit = async () => {
    touch('phone'); touch('password'); touch('confirmPassword')
    if (!canStep3) return
    setLoading(true)
    setApiError('')
    try {
      const session = await api.register({
        name: form.name.trim(),
        specialty: form.specialty,
        phone: `+998${form.phone}`,
        password: form.password,
        bio: form.bio.trim() || undefined,
        email: form.email.trim() || undefined,
        price_uzs: form.price_uzs ? parseInt(form.price_uzs) : undefined,
        experience_yr: form.experience_yr ? parseInt(form.experience_yr) : undefined,
        avatar_emoji: form.avatar_emoji,
        personal_story: form.personal_story.trim() || undefined,
        education: form.education.length ? form.education.map(({ id: _id, ...e }) => e) : undefined,
        science: form.science.length ? form.science.map(({ id: _id, ...s }) => s) : undefined,
      })
      onRegister(session)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  // Style helpers
  const fieldBorder = (name: string, hasErr: boolean) =>
    hasErr ? 'var(--danger)' : focused === name ? 'var(--coral)' : 'var(--surface3)'

  const inp = (name: string, hasErr = false): React.CSSProperties => ({
    width: '100%',
    background: 'var(--surface2)',
    border: `1px solid ${fieldBorder(name, hasErr)}`,
    borderRadius: 'var(--r-sm)',
    padding: '12px 14px',
    color: 'var(--text)',
    fontSize: '15px',
    outline: 'none',
    minHeight: '48px',
    fontFamily: 'var(--font)',
    transition: 'border-color .15s',
    boxSizing: 'border-box',
  })

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', justifyContent: 'center', padding: '24px 16px 40px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Back + branding */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={goBack}
            style={{
              background: 'none', border: 'none', color: 'var(--text2)',
              fontSize: '14px', cursor: 'pointer', padding: '4px 0',
              fontFamily: 'var(--font)', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            ← {step > 1 ? 'Назад' : 'Войти'}
          </button>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🐾</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
            Регистрация специалиста
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.5 }}>
            Заполните анкету — мы проверим данные и активируем кабинет
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '32px' }}>
          {STEP_LABELS.map((label, i) => {
            const s = (i + 1) as Step
            const done = step > s
            const active = step === s
            return (
              <div key={s} style={{ display: 'contents' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: done || active ? 'var(--coral)' : 'var(--surface2)',
                    border: `2px solid ${done || active ? 'var(--coral)' : 'var(--surface3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? '14px' : '13px', fontWeight: 700,
                    color: done || active ? '#fff' : 'var(--text3)',
                    transition: 'background .25s, border-color .25s',
                  }}>
                    {done ? '✓' : s}
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                    color: done || active ? 'var(--text)' : 'var(--text3)',
                    transition: 'color .25s',
                  }}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{
                    flex: 1, height: '2px', margin: '0 6px', marginBottom: '18px', alignSelf: 'flex-start', marginTop: '15px',
                    background: step > s ? 'var(--coral)' : 'var(--surface3)',
                    transition: 'background .25s',
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Step 1: Specialty ─────────────────────────────── */}
        {step === 1 && (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '18px' }}>
              Выберите специализацию — клиенты будут видеть её в карточке.
            </p>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '10px', marginBottom: '28px',
            }}>
              {SPECIALTIES.map(({ label, emoji }) => {
                const active = form.specialty === label
                return (
                  <button
                    key={label}
                    onClick={() => set('specialty', label)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      gap: '6px', padding: '14px 12px',
                      borderRadius: 'var(--r-sm)', textAlign: 'left',
                      background: active ? 'rgba(242,120,75,.1)' : 'var(--surface2)',
                      border: `2px solid ${active ? 'var(--coral)' : 'var(--surface3)'}`,
                      cursor: 'pointer', fontFamily: 'var(--font)',
                      transition: 'border-color .15s, background .15s',
                    }}
                  >
                    <span style={{ fontSize: '22px', lineHeight: 1 }}>{emoji}</span>
                    <span style={{
                      fontSize: '13px', fontWeight: 600, lineHeight: 1.3,
                      color: active ? 'var(--coral)' : 'var(--text)',
                    }}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={goNext}
              disabled={!canStep1}
              style={primaryBtnStyle(!canStep1)}
            >
              Продолжить →
            </button>
          </div>
        )}

        {/* ── Step 2: Profile ───────────────────────────────── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Name */}
            <div>
              <label style={LBL}>Имя и фамилия *</label>
              <input
                style={inp('name', !!(touched.name && errs.name))}
                placeholder="Азиз Каримов"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                onFocus={() => setFocused('name')}
                onBlur={() => blur('name')}
                autoFocus
              />
              {touched.name && errs.name && <p style={ERR_TEXT}>{errs.name}</p>}
            </div>

            {/* Bio */}
            <div>
              <label style={LBL}>О себе</label>
              <textarea
                style={{
                  ...inp('bio'), minHeight: '96px', resize: 'vertical',
                  lineHeight: 1.5, paddingTop: '12px',
                }}
                placeholder="Расскажите об опыте, подходе к лечению, достижениях…"
                value={form.bio}
                maxLength={BIO_MAX}
                onChange={e => set('bio', e.target.value)}
                onFocus={() => setFocused('bio')}
                onBlur={() => setFocused(null)}
              />
              <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px', textAlign: 'right' }}>
                {form.bio.length} / {BIO_MAX}
              </p>
            </div>

            {/* Personal story */}
            <div>
              <label style={LBL}>
                Личная история{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text3)' }}>
                  (необязательно)
                </span>
              </label>
              <textarea
                style={{ ...inp('personal_story'), minHeight: '88px', resize: 'vertical', lineHeight: 1.5, paddingTop: '12px' }}
                placeholder="Почему вы выбрали эту профессию, что вас вдохновляет…"
                value={form.personal_story}
                onChange={e => set('personal_story', e.target.value)}
                onFocus={() => setFocused('personal_story')}
                onBlur={() => setFocused(null)}
              />
            </div>

            {/* Education cards */}
            <div>
              <label style={LBL}>
                Образование{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text3)' }}>
                  (необязательно)
                </span>
              </label>

              {form.education.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {form.education.map(e => (
                    <div key={e.id} style={{
                      background: 'var(--surface2)', border: '1px solid var(--surface3)',
                      borderRadius: 'var(--r-sm)', padding: '12px 14px',
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                    }}>
                      <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>🎓</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.institution}
                        </div>
                        {(e.degree || e.year) && (
                          <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                            {[e.degree, e.year].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setForm(f => ({ ...f, education: f.education.filter(x => x.id !== e.id) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '16px', padding: '0 0 0 4px', lineHeight: 1, flexShrink: 0 }}
                        aria-label="Удалить"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {eduDraft !== null ? (
                <div style={{
                  background: 'var(--surface2)', border: '1px solid var(--coral)',
                  borderRadius: 'var(--r-sm)', padding: '14px',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                  <input
                    style={inp('edu_institution')}
                    placeholder="Учебное заведение *"
                    value={eduDraft.institution}
                    autoFocus
                    onChange={e => setEduDraft(d => d && ({ ...d, institution: e.target.value }))}
                    onFocus={() => setFocused('edu_institution')}
                    onBlur={() => setFocused(null)}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '10px' }}>
                    <input
                      style={inp('edu_degree')}
                      placeholder="Специальность / степень"
                      value={eduDraft.degree}
                      onChange={e => setEduDraft(d => d && ({ ...d, degree: e.target.value }))}
                      onFocus={() => setFocused('edu_degree')}
                      onBlur={() => setFocused(null)}
                    />
                    <input
                      style={inp('edu_year')}
                      placeholder="Год"
                      value={eduDraft.year}
                      maxLength={4}
                      inputMode="numeric"
                      onChange={e => setEduDraft(d => d && ({ ...d, year: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      onFocus={() => setFocused('edu_year')}
                      onBlur={() => setFocused(null)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setEduDraft(null)} style={SMALL_GHOST_BTN}>Отмена</button>
                    <button
                      disabled={!eduDraft.institution.trim()}
                      onClick={() => {
                        if (!eduDraft.institution.trim()) return
                        setForm(f => ({ ...f, education: [...f.education, { ...eduDraft, id: String(Date.now()) }] }))
                        setEduDraft(null)
                      }}
                      style={smallPrimaryBtn(!eduDraft.institution.trim())}
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setEduDraft({ institution: '', degree: '', year: '' })}
                  style={ADD_BTN}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Добавить образование
                </button>
              )}
            </div>

            {/* Science cards */}
            <div>
              <label style={LBL}>
                Научная деятельность{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text3)' }}>
                  (необязательно)
                </span>
              </label>

              {form.science.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {form.science.map(s => (
                    <div key={s.id} style={{
                      background: 'var(--surface2)', border: '1px solid var(--surface3)',
                      borderRadius: 'var(--r-sm)', padding: '12px 14px',
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                    }}>
                      <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>🔬</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.title}
                        </div>
                        {s.year && (
                          <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>{s.year}</div>
                        )}
                      </div>
                      <button
                        onClick={() => setForm(f => ({ ...f, science: f.science.filter(x => x.id !== s.id) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: '16px', padding: '0 0 0 4px', lineHeight: 1, flexShrink: 0 }}
                        aria-label="Удалить"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {sciDraft !== null ? (
                <div style={{
                  background: 'var(--surface2)', border: '1px solid var(--coral)',
                  borderRadius: 'var(--r-sm)', padding: '14px',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                  <input
                    style={inp('sci_title')}
                    placeholder="Публикация, конференция, учёная степень *"
                    value={sciDraft.title}
                    autoFocus
                    onChange={e => setSciDraft(d => d && ({ ...d, title: e.target.value }))}
                    onFocus={() => setFocused('sci_title')}
                    onBlur={() => setFocused(null)}
                  />
                  <input
                    style={{ ...inp('sci_year'), maxWidth: '120px' }}
                    placeholder="Год"
                    value={sciDraft.year}
                    maxLength={4}
                    inputMode="numeric"
                    onChange={e => setSciDraft(d => d && ({ ...d, year: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    onFocus={() => setFocused('sci_year')}
                    onBlur={() => setFocused(null)}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setSciDraft(null)} style={SMALL_GHOST_BTN}>Отмена</button>
                    <button
                      disabled={!sciDraft.title.trim()}
                      onClick={() => {
                        if (!sciDraft.title.trim()) return
                        setForm(f => ({ ...f, science: [...f.science, { ...sciDraft, id: String(Date.now()) }] }))
                        setSciDraft(null)
                      }}
                      style={smallPrimaryBtn(!sciDraft.title.trim())}
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSciDraft({ title: '', year: '' })}
                  style={ADD_BTN}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Добавить работу
                </button>
              )}
            </div>

            {/* Experience + price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={LBL}>Цена консультации (сум)</label>
                <input
                  style={inp('price_uzs')}
                  type="number"
                  placeholder="50 000"
                  inputMode="numeric"
                  min={0}
                  value={form.price_uzs}
                  onChange={e => set('price_uzs', e.target.value)}
                  onFocus={() => setFocused('price_uzs')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <div>
                <label style={LBL}>Стаж (лет)</label>
                <input
                  style={inp('experience_yr')}
                  type="number"
                  placeholder="3"
                  inputMode="numeric"
                  min={0}
                  max={60}
                  value={form.experience_yr}
                  onChange={e => set('experience_yr', e.target.value)}
                  onFocus={() => setFocused('experience_yr')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={() => setStep(1)} style={GHOST_BTN}>← Назад</button>
              <button
                onClick={goNext}
                disabled={!canStep2}
                style={{ ...primaryBtnStyle(!canStep2), flex: 1 }}
              >
                Продолжить →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Account ───────────────────────────────── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Avatar */}
            <div>
              <label style={LBL}>Аватар</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {AVATARS.map(e => (
                  <button
                    key={e}
                    onClick={() => set('avatar_emoji', e)}
                    aria-label={e}
                    style={{
                      width: '48px', height: '48px', fontSize: '22px',
                      background: form.avatar_emoji === e ? 'rgba(242,120,75,.15)' : 'var(--surface2)',
                      border: `2px solid ${form.avatar_emoji === e ? 'var(--coral)' : 'var(--surface3)'}`,
                      borderRadius: 'var(--r-sm)', cursor: 'pointer',
                      transition: 'border-color .15s, background .15s',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={LBL}>Номер телефона *</label>
              <div style={{
                display: 'flex', alignItems: 'center',
                background: 'var(--surface2)',
                border: `1px solid ${fieldBorder('phone', !!(touched.phone && errs.phone))}`,
                borderRadius: 'var(--r-sm)', overflow: 'hidden', minHeight: '48px',
                transition: 'border-color .15s',
              }}>
                <span style={{
                  padding: '0 14px', color: 'var(--text2)', fontSize: '15px',
                  borderRight: '1px solid var(--surface3)', whiteSpace: 'nowrap',
                  lineHeight: '48px', userSelect: 'none', flexShrink: 0,
                }}>
                  +998
                </span>
                <input
                  type="tel"
                  placeholder="90 123-45-67"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => blur('phone')}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    padding: '12px 14px', color: 'var(--text)', fontSize: '15px',
                    fontFamily: 'var(--font)', letterSpacing: '0.05em',
                  }}
                />
              </div>
              {touched.phone && errs.phone && <p style={ERR_TEXT}>{errs.phone}</p>}
            </div>

            {/* Email (optional) */}
            <div>
              <label style={LBL}>Email <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text3)' }}>(необязательно)</span></label>
              <input
                style={inp('email')}
                type="email"
                placeholder="aziz@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </div>

            {/* Password */}
            <div>
              <label style={LBL}>Пароль *</label>
              <input
                style={inp('password', !!(touched.password && errs.password))}
                type="password"
                placeholder="Минимум 6 символов"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => blur('password')}
              />
              {touched.password && errs.password && <p style={ERR_TEXT}>{errs.password}</p>}
              {form.password.length >= 6 && (
                <PasswordStrength password={form.password} />
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label style={LBL}>Подтвердите пароль *</label>
              <input
                style={inp('confirmPassword', !!(touched.confirmPassword && errs.confirmPassword))}
                type="password"
                placeholder="Повторите пароль"
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                onFocus={() => setFocused('confirmPassword')}
                onBlur={() => blur('confirmPassword')}
              />
              {touched.confirmPassword && errs.confirmPassword && <p style={ERR_TEXT}>{errs.confirmPassword}</p>}
              {!errs.confirmPassword && form.confirmPassword.length >= 6 && (
                <p style={{ fontSize: '12px', color: 'var(--green)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ✓ Пароли совпадают
                </p>
              )}
            </div>

            {apiError && (
              <div style={{
                background: 'rgba(217,83,74,.1)', border: '1px solid rgba(217,83,74,.3)',
                borderRadius: 'var(--r-sm)', padding: '12px 14px',
                color: 'var(--danger)', fontSize: '14px', lineHeight: 1.5,
              }}>
                {apiError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={() => setStep(2)} disabled={loading} style={GHOST_BTN}>← Назад</button>
              <button
                onClick={handleSubmit}
                disabled={loading || !canStep3}
                style={{ ...primaryBtnStyle(loading || !canStep3), flex: 1 }}
              >
                {loading ? 'Отправляем заявку…' : 'Зарегистрироваться'}
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 }}>
              Отправляя анкету, вы соглашаетесь с{' '}
              <span style={{ color: 'var(--coral)' }}>условиями использования</span> сервиса
            </p>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text3)', marginTop: '28px' }}>
          Уже есть аккаунт?{' '}
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', color: 'var(--coral)',
              fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font)', padding: 0,
            }}
          >
            Войти
          </button>
        </p>
      </div>
    </div>
  )
}

// ── Password strength indicator ───────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const level = score <= 1 ? 0 : score <= 3 ? 1 : 2
  const labels = ['Слабый', 'Средний', 'Сильный']
  const colors = ['var(--danger)', 'var(--amber)', 'var(--green)']

  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: '3px', borderRadius: 'var(--r-pill)',
              background: i <= level ? colors[level] : 'var(--surface3)',
              transition: 'background .2s',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: '11px', color: colors[level] }}>{labels[level]}</p>
    </div>
  )
}

// ── Style constants ───────────────────────────────────────────────────────────

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'var(--surface3)' : 'var(--coral)',
    color: disabled ? 'var(--text3)' : '#fff',
    border: 'none', borderRadius: 'var(--r-sm)',
    padding: '15px', fontSize: '15px', fontWeight: 700,
    minHeight: '52px', cursor: disabled ? 'not-allowed' : 'pointer',
    width: '100%', fontFamily: 'var(--font)',
    transition: 'background .15s',
  }
}

const LBL: React.CSSProperties = {
  fontSize: '12px', fontWeight: 600, color: 'var(--text2)',
  textTransform: 'uppercase', letterSpacing: '0.04em',
  marginBottom: '6px', display: 'block',
}

const ERR_TEXT: React.CSSProperties = {
  fontSize: '12px', color: 'var(--danger)', marginTop: '4px',
}

const GHOST_BTN: React.CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--surface3)',
  borderRadius: 'var(--r-sm)',
  padding: '15px 20px',
  fontSize: '14px', fontWeight: 600,
  color: 'var(--text2)', cursor: 'pointer',
  minHeight: '52px', whiteSpace: 'nowrap',
  fontFamily: 'var(--font)', transition: 'background .15s',
}

const SMALL_GHOST_BTN: React.CSSProperties = {
  background: 'none', border: '1px solid var(--surface3)',
  borderRadius: 'var(--r-sm)', padding: '7px 14px',
  fontSize: '13px', fontWeight: 600, color: 'var(--text2)',
  cursor: 'pointer', fontFamily: 'var(--font)', minHeight: '36px',
}

const ADD_BTN: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  background: 'var(--surface2)', border: '1px dashed var(--surface3)',
  borderRadius: 'var(--r-sm)', padding: '11px 14px',
  color: 'var(--coral)', fontSize: '14px', fontWeight: 600,
  cursor: 'pointer', width: '100%', fontFamily: 'var(--font)',
  transition: 'border-color .15s',
}

function smallPrimaryBtn(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'var(--surface3)' : 'var(--coral)',
    color: disabled ? 'var(--text3)' : '#fff',
    border: 'none', borderRadius: 'var(--r-sm)',
    padding: '7px 16px', fontSize: '13px', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font)', minHeight: '36px',
    transition: 'background .15s',
  }
}
