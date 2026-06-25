import { useState } from 'react'
import { IconCheckCircle, IconClose } from '@ht/shared'

interface Transaction {
  id: string
  type: 'consultation' | 'insurance' | 'payout'
  description: string
  vendor: string
  amount: number
  commission: number
  net: number
  status: 'completed' | 'pending' | 'refunded'
  date: string
}

interface PayoutRequest {
  id: string
  vendor: string
  amount: number
  method: string
  requisites: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
}

const TRANSACTIONS: Transaction[] = [
  { id: 'T001', type: 'consultation', description: 'Онлайн-консультация', vendor: 'Азиз Каримов', amount: 120000, commission: 18000, net: 102000, status: 'completed', date: '2026-06-24' },
  { id: 'T002', type: 'insurance', description: 'Страховой полис «Минимальная»', vendor: 'HappyTails Insurance', amount: 150000, commission: 15000, net: 135000, status: 'completed', date: '2026-06-24' },
  { id: 'T003', type: 'consultation', description: 'Онлайн-консультация', vendor: 'Малика Юсупова', amount: 90000, commission: 13500, net: 76500, status: 'pending', date: '2026-06-23' },
  { id: 'T004', type: 'payout', description: 'Выплата вендору', vendor: 'Азиз Каримов', amount: -204000, commission: 0, net: -204000, status: 'completed', date: '2026-06-22' },
  { id: 'T005', type: 'consultation', description: 'Онлайн-консультация', vendor: 'Жамшид Рашидов', amount: 160000, commission: 24000, net: 136000, status: 'completed', date: '2026-06-21' },
  { id: 'T006', type: 'consultation', description: 'Онлайн-консультация', vendor: 'Нилуфар Хасанова', amount: 100000, commission: 15000, net: 85000, status: 'refunded', date: '2026-06-20' },
  { id: 'T007', type: 'insurance', description: 'Страховой полис «Расширенная»', vendor: 'HappyTails Insurance', amount: 250000, commission: 25000, net: 225000, status: 'completed', date: '2026-06-19' },
]

const PAYOUTS: PayoutRequest[] = [
  { id: 'P001', vendor: 'Малика Юсупова', amount: 76500, method: 'Click', requisites: '+998 90 123 45 67', status: 'pending', requestedAt: '2026-06-23' },
  { id: 'P002', vendor: 'Жамшид Рашидов', amount: 136000, method: 'Payme', requisites: '+998 91 234 56 78', status: 'pending', requestedAt: '2026-06-21' },
  { id: 'P003', vendor: 'Азиз Каримов', amount: 204000, method: 'Click', requisites: '+998 93 345 67 89', status: 'approved', requestedAt: '2026-06-18' },
]

const STATUS_CHIP: Record<string, string> = {
  completed: 'chip-success',
  pending: 'chip-warn',
  refunded: 'chip-danger',
  approved: 'chip-success',
  rejected: 'chip-danger',
}
const STATUS_LABEL: Record<string, string> = {
  completed: 'Выполнен',
  pending: 'В ожидании',
  refunded: 'Возврат',
  approved: 'Одобрено',
  rejected: 'Отклонено',
}

type PayoutAction = { payout: PayoutRequest; action: 'approve' | 'reject' }

const fmt = (n: number) => n.toLocaleString('ru-RU')
const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: '2-digit' })

export default function Finances() {
  const [tab, setTab] = useState<'transactions' | 'payouts'>('transactions')
  const [payouts, setPayouts] = useState(PAYOUTS)
  const [confirm, setConfirm] = useState<PayoutAction | null>(null)
  const [processing, setProcessing] = useState(false)

  const totalRevenue  = TRANSACTIONS.filter(t => t.type !== 'payout' && t.status === 'completed').reduce((s, t) => s + t.amount, 0)
  const totalComm     = TRANSACTIONS.filter(t => t.type !== 'payout' && t.status === 'completed').reduce((s, t) => s + t.commission, 0)
  const pendingPayout = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

  const handleAction = async (payout: PayoutRequest, action: 'approve' | 'reject') => {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 600))
    setPayouts(ps => ps.map(p => p.id === payout.id ? { ...p, status: action === 'approve' ? 'approved' : 'rejected' } : p))
    setConfirm(null)
    setProcessing(false)
  }

  return (
    <div>
      <div className="page-title">Финансы</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Общая выручка', value: `${fmt(totalRevenue)} сум`, sub: 'за всё время', color: 'var(--primary)' },
          { label: 'Комиссия платформы', value: `${fmt(totalComm)} сум`, sub: 'за всё время', color: 'var(--success)' },
          { label: 'Ожидают выплаты', value: `${fmt(pendingPayout)} сум`, sub: `${payouts.filter(p => p.status === 'pending').length} запросов`, color: 'var(--warning, #F59E0B)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: 16 }}>
        <button className={`filter-tab${tab === 'transactions' ? ' active' : ''}`} onClick={() => setTab('transactions')}>Транзакции</button>
        <button className={`filter-tab${tab === 'payouts' ? ' active' : ''}`} onClick={() => setTab('payouts')}>
          Выплаты{payouts.filter(p => p.status === 'pending').length > 0 && (
            <span className="chip chip-danger" style={{ marginLeft: 6, fontSize: 11 }}>
              {payouts.filter(p => p.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Transactions table */}
      {tab === 'transactions' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Описание</th>
                <th>Вендор</th>
                <th>Сумма</th>
                <th>Комиссия</th>
                <th>Дата</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map(tx => (
                <tr key={tx.id}>
                  <td>
                    <code style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{tx.id}</code>
                  </td>
                  <td style={{ fontWeight: 500 }}>{tx.description}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tx.vendor}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: tx.amount < 0 ? 'var(--danger)' : 'var(--text)' }}>
                    {tx.amount < 0 ? '−' : ''}{fmt(Math.abs(tx.amount))} сум
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                    {tx.commission > 0 ? `${fmt(tx.commission)} сум` : '—'}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(tx.date)}</td>
                  <td>
                    <span className={`chip ${STATUS_CHIP[tx.status]}`}>{STATUS_LABEL[tx.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payouts table */}
      {tab === 'payouts' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Вендор</th>
                <th>Сумма</th>
                <th>Метод</th>
                <th>Реквизиты</th>
                <th>Запрошено</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.vendor}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmt(p.amount)} сум</td>
                  <td>
                    <span className="chip chip-muted">{p.method}</span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.requisites}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(p.requestedAt)}</td>
                  <td>
                    <span className={`chip ${STATUS_CHIP[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                  </td>
                  <td>
                    {p.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-success" onClick={() => setConfirm({ payout: p, action: 'approve' })}>Одобрить</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setConfirm({ payout: p, action: 'reject' })}>Откл.</button>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !processing && setConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              {confirm.action === 'approve'
                ? <><IconCheckCircle size={20} color="var(--success)" style={{ marginRight: 8 }} /> Одобрить выплату?</>
                : <><IconClose size={20} color="var(--danger)" style={{ marginRight: 8 }} /> Отклонить выплату?</>
              }
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              <strong>{confirm.payout.vendor}</strong> — {fmt(confirm.payout.amount)} сум<br />
              {confirm.payout.method}: {confirm.payout.requisites}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" disabled={processing} onClick={() => setConfirm(null)}>Отмена</button>
              <button
                className={`btn ${confirm.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                disabled={processing}
                onClick={() => handleAction(confirm.payout, confirm.action)}
              >
                {processing ? '…' : confirm.action === 'approve' ? 'Одобрить' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
