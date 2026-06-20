import { useState, useRef } from 'react'
import { api } from '../api'
import type { VendorSession } from '../types'

const DEMOS = [
  { label: '🩺 Азиз',   email: 'aziz@happytails.uz',    password: 'demo123' },
  { label: '🔬 Малика', email: 'malika@happytails.uz',  password: 'demo123' },
  { label: '🧬 Санжар', email: 'sanzhar@happytails.uz', password: 'demo123' },
  { label: '👶 Дилноза',email: 'dilnoza@happytails.uz', password: 'demo123' },
]

export default function Login({ onLogin }: { onLogin: (s: VendorSession) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pwRef = useRef<HTMLInputElement>(null)

  const submit = async (e?: { preventDefault?: () => void }, overrideEmail?: string, overridePass?: string) => {
    e?.preventDefault?.()
    const em = overrideEmail ?? email
    const pw = overridePass ?? password
    if (!em || !pw) return
    setLoading(true)
    setError('')
    try {
      const data = await api.login(em, pw)
      onLogin(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (demo: typeof DEMOS[0]) => {
    setEmail(demo.email)
    setPassword(demo.password)
    submit(undefined, demo.email, demo.password)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '20px'
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-xl)', padding: '40px 36px',
        width: '100%', maxWidth: '400px', boxShadow: '0 8px 40px rgba(0,0,0,.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', lineHeight: 1, marginBottom: '12px' }}>🐾</div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
            HappyTails
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Кабинет ветеринара</p>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.05em' }}>
          Быстрый вход
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
          {DEMOS.map(d => (
            <button
              key={d.email}
              onClick={() => quickLogin(d)}
              disabled={loading}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--surface3)',
                borderRadius: 'var(--r-sm)', padding: '10px 12px',
                color: 'var(--text)', fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', minHeight: '44px',
                transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--surface3)' }} />
          <span style={{ color: 'var(--text3)', fontSize: '12px' }}>или</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--surface3)' }} />
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && pwRef.current?.focus()}
          />
          <input
            ref={pwRef}
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'var(--surface3)' : 'var(--coral)',
              color: '#fff', border: 'none', borderRadius: 'var(--r-sm)',
              padding: '14px', fontSize: '15px', fontWeight: 600,
              minHeight: '48px', transition: 'background .15s',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Входим…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--surface2)', border: '1px solid var(--surface3)',
  borderRadius: 'var(--r-sm)', padding: '12px 16px',
  color: 'var(--text)', fontSize: '15px', outline: 'none',
  minHeight: '48px', width: '100%',
}
