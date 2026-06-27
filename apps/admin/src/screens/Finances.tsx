import { useState, useEffect, useCallback } from 'react'
import { IconCheckCircle, IconClose } from '@ht/shared'
import type { FinanceTx, FinancePayout, FinanceStats } from '../types'
import { adminApi } from '../api'

const STATUS_CHIP: Record<string, string> = {
  paid:     'chip chip-success',
  pending:  'chip chip-warning',
  refunded: 'chip chip-danger',
  failed:   'chip chip-danger',
  approved: 'chip chip-success',
  rejected: 'chip chip-danger',
}
const STATUS_LABEL: Record<string, string> = {
  paid: 'Оплачен', pending: 'В ожидании', refunded: 'Возврат',
  failed: 'Ошибка', approved: 'Одобрено', rejected: 'Отклонено',
}
const PROVIDER_LABEL: Record<string, string> = { click: 'Click', payme: 'Payme', uzum: 'Uzum', simulate: 'Тест' }

const fmt     = (n: number) => n.toLocaleString('ru-RU')
const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: '2-digit' })

type PayoutAction = { payout: FinancePayout; action: 'approve' | 'reject' }

export default function Finances() {
  const [tab, setTab]           = useState<'transactions' | 'payouts'>('transactions')
  const [stats, setStats]       = useState<FinanceStats | null>(null)
  const [txs, setTxs]           = useState<FinanceTx[]>([])
  const [txTotal, setTxTotal]   = useState(0)
  const [txPage, setTxPage]     = useState(1)
  const [payouts, setPayouts]   = useState<FinancePayout[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [confirm, setConfirm]   = useState<PayoutAction | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadStats = useCallback(async () => {
    try { setStats(await adminApi.getFinanceStats()) } catch { /* non-blocking */ }
  }, [])

  const loadTxs = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const d = await adminApi.getFinanceTransactions({ page: txPage })
      setTxs(d.transactions); setTxTotal(d.total)
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка загрузки') }
    finally { setLoading(false) }
  }, [txPage])

  const loadPayouts = useCallback(async () => {
    setLoading(true); setError('')
    try { setPayouts(await adminApi.getFinancePayouts()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка загрузки') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { if (tab === 'transactions') loadTxs() }, [tab, loadTxs])
  useEffect(() => { if (tab === 'payouts') loadPayouts() }, [tab, loadPayouts])

  const pendingPayouts = payouts.filter(p => p.status === 'pending')

  const handleAction = async () => {
    if (!confirm) return
    setProcessing(true)
    try {
      if (confirm.action === 'approve') {
        const updated = await adminApi.approvePayout(confirm.payout.id)
        setPayouts(ps => ps.map(p => p.id === updated.id ? updated : p))
      } else {
        const updated = await adminApi.rejectPayout(confirm.payout.id, rejectNote)
        setPayouts(ps => ps.map(p => p.id === updated.id ? updated : p))
      }
      setConfirm(null); setRejectNote('')
      loadStats()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    } finally { setProcessing(false) }
  }

  const txPages = Math.max(1, Math.ceil(txTotal / 50))

  return (
    <div>
      <div className="page-title">Финансы</div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Общая выручка',        value: stats ? `${fmt(stats.total_revenue)} сум`    : '…', sub: 'за всё время',                    color: 'var(--primary)' },
          { label: 'Комиссия платформы',   value: stats ? `${fmt(stats.total_commission)} сум`  : '…', sub: 'за всё время',                    color: 'var(--success)' },
          { label: 'Ожидают выплаты',      value: stats ? `${fmt(stats.pending_payouts)} сум`   : '…', sub: stats ? `${stats.pending_count} запросов` : '', color: 'var(--warning, #F59E0B)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: 16 }}>
        <button className={`filter-tab${tab === 'transactions' ? ' active' : ''}`} onClick={() => setTab('transactions')}>
          Транзакции {txTotal > 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({txTotal})</span>}
        </button>
        <button className={`filter-tab${tab === 'payouts' ? ' active' : ''}`} onClick={() => setTab('payouts')}>
          Выплаты{pendingPayouts.length > 0 && (
            <span className="chip chip-danger" style={{ marginLeft: 6, fontSize: 11 }}>{pendingPayouts.length}</span>
          )}
        </button>
      </div>

      {loading && <div className="loading">Загрузка…</div>}
      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Transactions table */}
      {tab === 'transactions' && !loading && (
        <>
          {txs.length === 0 && !error ? (
            <div className="empty"><div>Транзакций пока нет</div></div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Вендор</th>
                    <th>Услуга</th>
                    <th>Сумма</th>
                    <th>Комиссия</th>
                    <th>Провайдер</th>
                    <th>Дата</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map(tx => (
                    <tr key={tx.id}>
                      <td><code style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.id.slice(0, 8)}</code></td>
                      <td style={{ fontWeight: 500 }}>{tx.vendor_name ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.service_type}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmt(tx.amount_uzs)} сум</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>{tx.commission > 0 ? `${fmt(tx.commission)} сум` : '—'}</td>
                      <td><span className="chip chip-muted">{PROVIDER_LABEL[tx.provider] ?? tx.provider}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(tx.date)}</td>
                      <td><span className={STATUS_CHIP[tx.status] ?? 'chip chip-muted'}>{STATUS_LABEL[tx.status] ?? tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {txPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>← Назад</button>
              <span>Стр. {txPage} из {txPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={txPage >= txPages} onClick={() => setTxPage(p => p + 1)}>Вперёд →</button>
            </div>
          )}
        </>
      )}

      {/* Payouts table */}
      {tab === 'payouts' && !loading && (
        <>
          {payouts.length === 0 && !error ? (
            <div className="empty"><div>Запросов на выплату нет</div></div>
          ) : (
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
                      <td style={{ fontWeight: 600 }}>{p.vendor_name ?? '—'}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{fmt(p.amount_uzs)} сум</td>
                      <td><span className="chip chip-muted">{p.method}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.requisites}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(p.requested_at)}</td>
                      <td><span className={STATUS_CHIP[p.status]}>{STATUS_LABEL[p.status]}</span></td>
                      <td>
                        {p.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-sm btn-success" onClick={() => setConfirm({ payout: p, action: 'approve' })}>Одобрить</button>
                            <button className="btn btn-sm btn-danger"  onClick={() => { setConfirm({ payout: p, action: 'reject' }); setRejectNote('') }}>Откл.</button>
                          </div>
                        ) : p.admin_note ? (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.admin_note}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !processing && setConfirm(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {confirm.action === 'approve'
                ? <><IconCheckCircle size={20} color="var(--success)" /> Одобрить выплату?</>
                : <><IconClose size={20} color="var(--danger)" /> Отклонить выплату?</>
              }
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
              <strong>{confirm.payout.vendor_name}</strong> — {fmt(confirm.payout.amount_uzs)} сум<br />
              {confirm.payout.method}: {confirm.payout.requisites}
            </div>
            {confirm.action === 'reject' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Причина отклонения</div>
                <input
                  type="text"
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="Укажите причину…"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit', minHeight: 44 }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" disabled={processing} onClick={() => setConfirm(null)}>Отмена</button>
              <button
                className={`btn ${confirm.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                disabled={processing || (confirm.action === 'reject' && !rejectNote.trim())}
                onClick={handleAction}
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
