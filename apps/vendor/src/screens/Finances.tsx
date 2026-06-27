import { useState, useEffect } from 'react'
import { IconCheckCircle, IconStethoscope, IconRefresh } from '@ht/shared'
import { api } from '../api'
import type { FinanceData, FinanceTx } from '../types'

export default function Finances() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [card, setCard] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.financeHistory()
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const balance = data?.balance ?? 0

  const submitPayout = async () => {
    if (!valid) return
    setSubmitting(true)
    try {
      await api.requestPayout(Number(amount), 'click', card.replace(/\s/g, ''))
      setPayoutOpen(false)
      setSuccess(true)
      setAmount('')
      setCard('')
      setTimeout(() => setSuccess(false), 4000)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const valid = Number(amount) >= 50000 && Number(amount) <= balance && card.replace(/\s/g, '').length === 16

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Финансы</h1>

      {loading && (
        <div style={{ color: 'var(--text2)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          Загрузка…
        </div>
      )}

      {error && !loading && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--r-sm)',
          background: 'rgba(239,68,68,.1)', color: 'var(--danger)',
          fontSize: 14, marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Баланс',    value: data.balance,     color: 'var(--green)',  bg: 'rgba(76,175,125,.12)' },
              { label: 'К выводу', value: data.pending,     color: 'var(--coral)',  bg: 'rgba(242,120,75,.12)' },
              { label: 'За месяц', value: data.month_total, color: 'var(--violet)', bg: 'rgba(124,92,191,.12)' },
            ].map(c => (
              <div key={c.label} style={{
                background: c.bg, borderRadius: 'var(--r-md)', padding: '16px 14px',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{c.label}</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: c.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                  {c.value.toLocaleString('ru-RU')}<br />
                  <span style={{ fontSize: 10, fontWeight: 500 }}>сум</span>
                </span>
              </div>
            ))}
          </div>

          {/* Payout button */}
          <button
            onClick={() => setPayoutOpen(true)}
            style={{
              width: '100%', padding: '13px 20px', borderRadius: 'var(--r-sm)',
              background: 'var(--coral)', color: '#fff', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: 'pointer', minHeight: 48, fontFamily: 'inherit',
              marginBottom: 28,
            }}
          >
            Вывести средства →
          </button>

          {success && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--r-sm)',
              background: 'rgba(76,175,125,.15)', color: 'var(--green)',
              fontWeight: 600, fontSize: 14, marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <IconCheckCircle size={16} color="var(--green)" /> Заявка на вывод отправлена. Средства поступят в течение 1–2 рабочих дней.
            </div>
          )}

          {/* Transactions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>История операций</h2>
          </div>

          {data.transactions.length === 0 ? (
            <div style={{ color: 'var(--text2)', fontSize: 14, padding: '32px 0', textAlign: 'center' }}>
              Операций пока нет
            </div>
          ) : (
            <div style={{
              background: 'var(--surface)', borderRadius: 'var(--r-md)',
              border: '1px solid var(--surface3)', overflow: 'hidden',
            }}>
              {data.transactions.map((tx: FinanceTx, i: number) => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--surface3)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--r-sm)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                    background: tx.type === 'consult'
                      ? 'rgba(242,120,75,.12)'
                      : 'rgba(239,68,68,.12)',
                  }}>
                    {tx.type === 'consult' ? <IconStethoscope size={17} /> : <IconRefresh size={17} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                      {tx.type === 'consult' ? `Консультация — ${tx.client}` : `Возврат — ${tx.client}`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{tx.date}</div>
                  </div>
                  <span style={{
                    fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                    color: tx.amount > 0 ? 'var(--green)' : 'var(--danger)',
                  }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('ru-RU')} сум
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Payout modal */}
      {payoutOpen && data && (
        <div className="overlay">
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-md)',
            padding: 28, maxWidth: 400, width: '90%',
            boxShadow: '0 16px 40px rgba(0,0,0,.25)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Вывод средств</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              Доступно: <strong>{balance.toLocaleString('ru-RU')} сум</strong> · Минимум 50 000 сум
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                  Сумма (сум)
                </label>
                <input
                  style={inp}
                  type="number"
                  placeholder={`50 000 – ${balance.toLocaleString('ru-RU')}`}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                  Номер карты (16 цифр)
                </label>
                <input
                  style={inp}
                  type="text"
                  placeholder="8600 0000 0000 0000"
                  maxLength={19}
                  value={card}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
                    setCard(raw.replace(/(.{4})/g, '$1 ').trim())
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setPayoutOpen(false)} style={btnGhost}>Отмена</button>
              <button onClick={submitPayout} disabled={!valid || submitting} style={{
                padding: '10px 20px', borderRadius: 'var(--r-sm)', border: 'none',
                background: valid ? 'var(--coral)' : 'var(--surface3)',
                color: valid ? '#fff' : 'var(--text2)',
                fontWeight: 600, fontSize: 14, cursor: valid ? 'pointer' : 'default',
                minHeight: 44, fontFamily: 'inherit',
              }}>
                Вывести
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'var(--surface2)',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
}
const btnGhost: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'var(--surface2)',
  color: 'var(--text2)', fontWeight: 500, fontSize: 14,
  cursor: 'pointer', minHeight: 44, fontFamily: 'inherit',
}
