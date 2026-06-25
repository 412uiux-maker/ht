import { useState, useRef, useEffect } from 'react'
import { api } from '../api'
import type { VendorSession } from '../types'

const DEMOS = [
  { label: 'Азиз',    phone: '+998901234567' },
  { label: 'Малика',  phone: '+998901234568' },
  { label: 'Санжар',  phone: '+998901234569' },
  { label: 'Дилноза', phone: '+998901234570' },
]

type Step = 'phone' | 'code'

export default function Login({ onLogin }: { onLogin: (s: VendorSession) => void }) {
  const [step, setStep] = useState<Step>('phone')
  const [digits, setDigits] = useState('')
  const [codeDigits, setCodeDigits] = useState(['', '', '', ''])
  const [devCode, setDevCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const r0 = useRef<HTMLInputElement>(null)
  const r1 = useRef<HTMLInputElement>(null)
  const r2 = useRef<HTMLInputElement>(null)
  const r3 = useRef<HTMLInputElement>(null)
  const codeRefs = [r0, r1, r2, r3]

  const fullPhone = `+998${digits}`

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const startCountdown = () => {
    setCountdown(60)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const doSendCode = async (phone: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.sendCode(phone)
      setDevCode(res._dev_code || '')
      startCountdown()
      setStep('code')
      setTimeout(() => r0.current?.focus(), 50)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки')
    } finally {
      setLoading(false)
    }
  }

  const doVerify = async (phone: string, otp: string) => {
    if (otp.length < 4) return
    setLoading(true)
    setError('')
    try {
      const session = await api.verifyCode(phone, otp)
      onLogin(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код')
      setLoading(false)
    }
  }

  const quickLogin = async (demo: typeof DEMOS[0]) => {
    setDigits(demo.phone.replace('+998', ''))
    setLoading(true)
    setError('')
    try {
      const res = await api.sendCode(demo.phone)
      if (res._dev_code) {
        const session = await api.verifyCode(demo.phone, res._dev_code)
        onLogin(session)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
      setLoading(false)
    }
  }

  const handleDigitInput = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    const next = [...codeDigits]
    next[i] = d
    setCodeDigits(next)
    const joined = next.join('')
    if (d && i < 3) codeRefs[i + 1].current?.focus()
    if (joined.length === 4) doVerify(fullPhone, joined)
  }

  const handleDigitKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[i] && i > 0) {
      codeRefs[i - 1].current?.focus()
    }
  }

  const resetToPhone = () => {
    setStep('phone')
    setCodeDigits(['', '', '', ''])
    setDevCode('')
    setError('')
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(0)
  }

  const formatPhone = (d: string) => {
    const parts: string[] = []
    if (d.length >= 2) parts.push(d.slice(0, 2))
    if (d.length >= 5) parts.push(d.slice(2, 5))
    if (d.length >= 7) parts.push(d.slice(5, 7))
    if (d.length >= 9) parts.push(d.slice(7, 9))
    return parts.length ? parts.join(' ') : d.slice(0, 2)
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

        {step === 'phone' ? (
          <>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text2)', marginBottom: '10px' }}>
              Быстрый вход
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
              {DEMOS.map(d => (
                <button
                  key={d.phone}
                  onClick={() => quickLogin(d)}
                  disabled={loading}
                  style={{
                    background: 'var(--surface2)', border: '1px solid var(--surface3)',
                    borderRadius: 'var(--r-sm)', padding: '10px 12px',
                    color: 'var(--text)', fontSize: '13px', fontWeight: 500,
                    minHeight: '44px', transition: 'background .15s',
                    cursor: loading ? 'not-allowed' : 'pointer',
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

            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--surface2)', border: '1px solid var(--surface3)',
              borderRadius: 'var(--r-sm)', overflow: 'hidden',
              minHeight: '48px', marginBottom: '12px'
            }}>
              <span style={{
                padding: '0 14px', color: 'var(--text2)', fontSize: '15px',
                borderRight: '1px solid var(--surface3)', whiteSpace: 'nowrap',
                lineHeight: '48px', userSelect: 'none', flexShrink: 0
              }}>+998</span>
              <input
                type="tel"
                placeholder="90 000-00-00"
                value={digits}
                onChange={e => setDigits(e.target.value.replace(/\D/g, '').slice(0, 9))}
                inputMode="numeric"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  padding: '12px 14px', color: 'var(--text)', fontSize: '15px',
                  fontFamily: 'var(--font)', letterSpacing: '0.05em'
                }}
                onKeyDown={e => e.key === 'Enter' && digits.length === 9 && doSendCode(fullPhone)}
              />
            </div>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{error}</p>
            )}

            <button
              onClick={() => doSendCode(fullPhone)}
              disabled={loading || digits.length < 9}
              style={{
                width: '100%',
                background: loading || digits.length < 9 ? 'var(--surface3)' : 'var(--coral)',
                color: loading || digits.length < 9 ? 'var(--text3)' : '#fff',
                border: 'none', borderRadius: 'var(--r-sm)',
                padding: '14px', fontSize: '15px', fontWeight: 600,
                minHeight: '48px', transition: 'background .15s',
                cursor: loading || digits.length < 9 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Отправляем…' : 'Получить код'}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text2)', fontSize: '14px', textAlign: 'center', marginBottom: '4px' }}>
              Код отправлен на
            </p>
            <p style={{ color: 'var(--text)', fontSize: '17px', fontWeight: 600, textAlign: 'center', marginBottom: '28px' }}>
              +998 {formatPhone(digits)}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '8px' }}>
              {codeRefs.map((ref, i) => (
                <input
                  key={i}
                  ref={ref}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={codeDigits[i]}
                  onChange={e => handleDigitInput(i, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i, e)}
                  style={{
                    width: '56px', height: '64px',
                    background: 'var(--surface2)',
                    border: `1px solid ${codeDigits[i] ? 'var(--coral)' : 'var(--surface3)'}`,
                    borderRadius: 'var(--r-sm)', outline: 'none',
                    textAlign: 'center', fontSize: '26px', fontWeight: 700,
                    color: 'var(--text)', fontFamily: 'var(--font)',
                    transition: 'border-color .15s',
                  }}
                />
              ))}
            </div>

            {devCode && (
              <p style={{ color: 'var(--text3)', fontSize: '12px', textAlign: 'center', marginTop: '6px', marginBottom: '10px' }}>
                Демо-код: <span style={{ color: 'var(--amber)', fontWeight: 600, letterSpacing: '0.15em' }}>{devCode}</span>
              </p>
            )}

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center', marginBottom: '12px' }}>{error}</p>
            )}

            <button
              onClick={() => doVerify(fullPhone, codeDigits.join(''))}
              disabled={loading || codeDigits.join('').length < 4}
              style={{
                width: '100%',
                background: loading || codeDigits.join('').length < 4 ? 'var(--surface3)' : 'var(--coral)',
                color: loading || codeDigits.join('').length < 4 ? 'var(--text3)' : '#fff',
                border: 'none', borderRadius: 'var(--r-sm)',
                padding: '14px', fontSize: '15px', fontWeight: 600,
                minHeight: '48px', transition: 'background .15s',
                cursor: loading || codeDigits.join('').length < 4 ? 'not-allowed' : 'pointer',
                marginBottom: '16px', marginTop: '4px'
              }}
            >
              {loading ? 'Проверяем…' : 'Подтвердить'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={resetToPhone}
                style={{
                  background: 'none', border: 'none', color: 'var(--text2)',
                  fontSize: '13px', cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font)'
                }}
              >
                ← Изменить номер
              </button>
              {countdown > 0 ? (
                <span style={{ color: 'var(--text3)', fontSize: '13px' }}>
                  Повторить через {countdown}с
                </span>
              ) : (
                <button
                  onClick={() => { setCodeDigits(['', '', '', '']); doSendCode(fullPhone) }}
                  disabled={loading}
                  style={{
                    background: 'none', border: 'none', color: 'var(--coral)',
                    fontSize: '13px', cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font)'
                  }}
                >
                  Отправить снова
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
