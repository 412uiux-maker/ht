import { useState } from 'react'
import type { AdminSession } from '../types'
import { adminApi } from '../api'

const DEMO_ACCOUNTS = [
  { label: 'Администратор', email: 'admin@happytails.uz', password: 'admin123' },
  { label: 'Модератор',     email: 'moder@happytails.uz', password: 'moder123' },
  { label: 'Поддержка',     email: 'support@happytails.uz', password: 'supp123' },
]

interface Props {
  onLogin: (session: AdminSession) => void
  notice?: string | null
}

export default function Login({ onLogin, notice }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email || !password) { setError('Введите email и пароль'); return }
    setLoading(true)
    setError('')
    try {
      const session = await adminApi.login(email, password)
      onLogin(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (acc: { email: string; password: string }) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setLoading(true)
    setError('')
    try {
      const session = await adminApi.login(acc.email, acc.password)
      onLogin(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🐾</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>HappyTails</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Панель администратора</div>
        </div>

        <div className="card">
          {notice && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 'var(--r-md)',
              background: '#fff8e1',
              border: '1px solid #f59e0b',
              color: '#92400e',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>⚠️</span>
              {notice}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
              Быстрый вход
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  className="btn btn-ghost"
                  style={{ justifyContent: 'flex-start', width: '100%' }}
                  onClick={() => quickLogin(acc)}
                >
                  {acc.label}
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0' }} />

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 14, minHeight: 44 }}
            />
            <input
              type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 14, minHeight: 44 }}
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
