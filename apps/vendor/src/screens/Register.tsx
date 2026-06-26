import { useState } from 'react'
import { api } from '../api'
import type { VendorSession } from '../types'

const SPECIALTIES = [
  'Ветеринар', 'Хирург', 'Дерматолог', 'Кардиолог', 'Офтальмолог',
  'Диетолог', 'Кинолог', 'Фелинолог', 'Груммер', 'Зоопсихолог',
]

const AVATARS = ['👨‍⚕️', '👩‍⚕️', '🩺', '🐾', '🐕', '🐈', '💊', '🔬']

const field: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface2)',
  border: '1px solid var(--surface3)',
  borderRadius: 'var(--r-sm)',
  padding: '12px 14px',
  color: 'var(--text)',
  fontSize: '15px',
  outline: 'none',
  transition: 'border-color .15s',
  minHeight: '48px',
}

const label: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text2)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '6px',
  display: 'block',
}

export default function Register({
  onRegister,
  onBack,
}: {
  onRegister: (s: VendorSession) => void
  onBack: () => void
}) {
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    phone: '',
    password: '',
    bio: '',
    email: '',
    price_uzs: '',
    experience_yr: '',
    avatar_emoji: '👨‍⚕️',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const canSubmit = form.name.trim() && form.specialty && form.phone.length >= 9 && form.password.length >= 6

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const session = await api.register({
        name: form.name.trim(),
        specialty: form.specialty,
        phone: `+998${form.phone.replace(/\D/g, '')}`,
        password: form.password,
        bio: form.bio.trim() || undefined,
        email: form.email.trim() || undefined,
        price_uzs: form.price_uzs ? parseInt(form.price_uzs) : undefined,
        experience_yr: form.experience_yr ? parseInt(form.experience_yr) : undefined,
        avatar_emoji: form.avatar_emoji,
      })
      onRegister(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', justifyContent: 'center', padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', color: 'var(--text2)',
              fontSize: '14px', cursor: 'pointer', padding: '4px 0',
              fontFamily: 'var(--font)', marginBottom: '20px', display: 'block',
            }}
          >
            ← Назад
          </button>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🐾</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
            Регистрация специалиста
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.5 }}>
            Заполните анкету — мы проверим данные и активируем кабинет
          </p>
        </div>

        {/* Avatar picker */}
        <div style={{ marginBottom: '24px' }}>
          <span style={label}>Аватар</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {AVATARS.map(e => (
              <button
                key={e}
                onClick={() => set('avatar_emoji', e)}
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

        {/* Required fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>

          <div>
            <label style={label}>Имя и фамилия *</label>
            <input
              style={field}
              placeholder="Азиз Каримов"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--coral)')}
              onBlur={e => (e.target.style.borderColor = 'var(--surface3)')}
            />
          </div>

          <div>
            <label style={label}>Специализация *</label>
            <select
              style={{ ...field, appearance: 'none', cursor: 'pointer' }}
              value={form.specialty}
              onChange={e => set('specialty', e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--coral)')}
              onBlur={e => (e.target.style.borderColor = 'var(--surface3)')}
            >
              <option value="">Выберите специализацию</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={label}>Номер телефона *</label>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--surface2)', border: '1px solid var(--surface3)',
              borderRadius: 'var(--r-sm)', overflow: 'hidden', minHeight: '48px',
            }}>
              <span style={{
                padding: '0 14px', color: 'var(--text2)', fontSize: '15px',
                borderRight: '1px solid var(--surface3)', whiteSpace: 'nowrap',
                lineHeight: '48px', userSelect: 'none', flexShrink: 0,
              }}>+998</span>
              <input
                type="tel"
                placeholder="90 000-00-00"
                inputMode="numeric"
                value={form.phone}
                onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  padding: '12px 14px', color: 'var(--text)', fontSize: '15px',
                  fontFamily: 'var(--font)', letterSpacing: '0.05em',
                }}
              />
            </div>
          </div>

          <div>
            <label style={label}>Пароль * (мин. 6 символов)</label>
            <input
              style={field}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              onFocus={e => (e.target.style.borderColor = 'var(--coral)')}
              onBlur={e => (e.target.style.borderColor = 'var(--surface3)')}
            />
          </div>
        </div>

        {/* Optional fields */}
        <details style={{ marginBottom: '24px' }}>
          <summary style={{
            fontSize: '13px', fontWeight: 600, color: 'var(--coral)',
            cursor: 'pointer', userSelect: 'none', marginBottom: '16px',
            listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            + Дополнительно (необязательно)
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '4px' }}>

            <div>
              <label style={label}>О себе</label>
              <textarea
                style={{ ...field, minHeight: '88px', resize: 'vertical', lineHeight: 1.5 }}
                placeholder="Расскажите о вашем опыте, подходе к лечению…"
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                onFocus={e => (e.target.style.borderColor = 'var(--coral)')}
                onBlur={e => (e.target.style.borderColor = 'var(--surface3)')}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={label}>Цена консультации (сум)</label>
                <input
                  style={field}
                  type="number"
                  placeholder="50000"
                  inputMode="numeric"
                  value={form.price_uzs}
                  onChange={e => set('price_uzs', e.target.value)}
                  onFocus={e => (e.target.style.borderColor = 'var(--coral)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--surface3)')}
                />
              </div>
              <div>
                <label style={label}>Стаж (лет)</label>
                <input
                  style={field}
                  type="number"
                  placeholder="3"
                  inputMode="numeric"
                  min={0}
                  max={50}
                  value={form.experience_yr}
                  onChange={e => set('experience_yr', e.target.value)}
                  onFocus={e => (e.target.style.borderColor = 'var(--coral)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--surface3)')}
                />
              </div>
            </div>

            <div>
              <label style={label}>Email</label>
              <input
                style={field}
                type="email"
                placeholder="aziz@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                onFocus={e => (e.target.style.borderColor = 'var(--coral)')}
                onBlur={e => (e.target.style.borderColor = 'var(--surface3)')}
              />
            </div>
          </div>
        </details>

        {error && (
          <div style={{
            background: 'rgba(217,83,74,.1)', border: '1px solid rgba(217,83,74,.3)',
            borderRadius: 'var(--r-sm)', padding: '12px 14px',
            color: 'var(--danger)', fontSize: '14px', marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !canSubmit}
          style={{
            width: '100%',
            background: loading || !canSubmit ? 'var(--surface3)' : 'var(--coral)',
            color: loading || !canSubmit ? 'var(--text3)' : '#fff',
            border: 'none', borderRadius: 'var(--r-sm)',
            padding: '15px', fontSize: '15px', fontWeight: 700,
            minHeight: '52px', transition: 'background .15s, opacity .15s',
            cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
            marginBottom: '16px',
          }}
        >
          {loading ? 'Отправляем заявку…' : 'Зарегистрироваться'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>
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
