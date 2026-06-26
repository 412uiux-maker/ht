import { useState } from 'react'
import { api } from '../api'
import type { VendorSession } from '../types'
import { setSession as persistSession } from '../types'

type Status = 'pending' | 'verified' | 'rejected'

const STATUS_CONFIG: Record<Status, {
  icon: string
  color: string
  bg: string
  border: string
  title: string
  body: string
}> = {
  pending: {
    icon: '⏳',
    color: 'var(--amber)',
    bg: 'rgba(245,166,35,.08)',
    border: 'rgba(245,166,35,.25)',
    title: 'Анкета на проверке',
    body: 'Мы проверяем ваши данные. Обычно это занимает 1–2 рабочих дня. После подтверждения вы сможете принимать заявки.',
  },
  verified: {
    icon: '✅',
    color: 'var(--green)',
    bg: 'rgba(76,175,125,.08)',
    border: 'rgba(76,175,125,.25)',
    title: 'Аккаунт подтверждён',
    body: 'Ваша анкета одобрена. Добро пожаловать в HappyTails! Вы можете начать принимать консультации.',
  },
  rejected: {
    icon: '❌',
    color: 'var(--danger)',
    bg: 'rgba(217,83,74,.08)',
    border: 'rgba(217,83,74,.25)',
    title: 'Заявка отклонена',
    body: 'К сожалению, ваша заявка не прошла проверку. Свяжитесь с поддержкой для уточнения причин.',
  },
}

export default function VerificationPending({
  session,
  onApproved,
  onLogout,
}: {
  session: VendorSession
  onApproved: (s: VendorSession) => void
  onLogout: () => void
}) {
  const [status, setStatus] = useState<Status>(
    (session.verification_status as Status) || 'pending'
  )
  const [checking, setChecking] = useState(false)

  const cfg = STATUS_CONFIG[status]

  const checkStatus = async () => {
    setChecking(true)
    try {
      const me = await api.getMe()
      const newStatus = (me.verification_status as Status) || 'pending'
      setStatus(newStatus)
      if (newStatus === 'verified') {
        const updated = { ...session, ...me }
        persistSession(updated)
        onApproved(updated)
      }
    } catch {
      // silent — keep showing current status
    } finally {
      setChecking(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', lineHeight: 1, marginBottom: '12px' }}>🐾</div>
          <p style={{ fontSize: '13px', color: 'var(--text2)' }}>HappyTails · Кабинет ветеринара</p>
        </div>

        {/* Vendor info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          background: 'var(--surface)', borderRadius: 'var(--r-md)',
          padding: '16px', marginBottom: '20px',
          border: '1px solid var(--surface3)',
        }}>
          <div style={{ fontSize: '36px', lineHeight: 1 }}>{session.avatar_emoji}</div>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '15px' }}>{session.name}</p>
            <p style={{ color: 'var(--text2)', fontSize: '13px' }}>{session.specialty}</p>
          </div>
        </div>

        {/* Status card */}
        <div style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: 'var(--r-lg)',
          padding: '28px 24px',
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '52px', lineHeight: 1, marginBottom: '16px' }}>{cfg.icon}</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: cfg.color, marginBottom: '10px' }}>
            {cfg.title}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6, maxWidth: '300px', margin: '0 auto' }}>
            {cfg.body}
          </p>
        </div>

        {/* Steps (only for pending) */}
        {status === 'pending' && (
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--surface3)', padding: '16px 20px',
            marginBottom: '20px',
          }}>
            {[
              { done: true,  label: 'Анкета заполнена' },
              { done: false, label: 'Проверка документов' },
              { done: false, label: 'Активация кабинета' },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 0',
                borderBottom: i < 2 ? '1px solid var(--surface3)' : 'none',
              }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  background: step.done ? 'rgba(76,175,125,.15)' : 'var(--surface2)',
                  border: `2px solid ${step.done ? 'var(--green)' : 'var(--surface3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px',
                }}>
                  {step.done ? '✓' : ''}
                </div>
                <span style={{
                  fontSize: '14px',
                  color: step.done ? 'var(--text)' : 'var(--text3)',
                  fontWeight: step.done ? 600 : 400,
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {status === 'verified' ? (
          <button
            onClick={() => onApproved(session)}
            style={{
              width: '100%', background: 'var(--green)', color: '#fff',
              border: 'none', borderRadius: 'var(--r-sm)',
              padding: '15px', fontSize: '15px', fontWeight: 700,
              minHeight: '52px', cursor: 'pointer', marginBottom: '12px',
            }}
          >
            Перейти в кабинет →
          </button>
        ) : (
          <button
            onClick={checkStatus}
            disabled={checking}
            style={{
              width: '100%',
              background: checking ? 'var(--surface3)' : 'var(--coral)',
              color: checking ? 'var(--text3)' : '#fff',
              border: 'none', borderRadius: 'var(--r-sm)',
              padding: '15px', fontSize: '15px', fontWeight: 700,
              minHeight: '52px', cursor: checking ? 'not-allowed' : 'pointer',
              transition: 'background .15s', marginBottom: '12px',
            }}
          >
            {checking ? 'Проверяем…' : 'Обновить статус'}
          </button>
        )}

        <button
          onClick={onLogout}
          style={{
            width: '100%', background: 'none',
            border: '1px solid var(--surface3)', borderRadius: 'var(--r-sm)',
            padding: '13px', fontSize: '14px', fontWeight: 500,
            color: 'var(--text2)', cursor: 'pointer', minHeight: '48px',
          }}
        >
          Выйти
        </button>
      </div>
    </div>
  )
}
