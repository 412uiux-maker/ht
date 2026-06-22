import { useState, useEffect, useCallback } from 'react'
import type { PromoCode, AdminSession } from '../types'
import { adminApi } from '../api'

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'

const isExpired = (d: string | null) => d ? new Date(d) < new Date() : false

interface Props { session: AdminSession }

export default function Promos({ session }: Props) {
  const [promos, setPromos]     = useState<PromoCode[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [showCreate, setCreate] = useState(false)
  const [toggling, setToggling] = useState<number | null>(null)

  const [form, setForm] = useState({
    code: '', discount_type: 'percent', discount_value: '', max_uses: '', expires_at: '',
  })
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setPromos(await adminApi.getPromos()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.discount_value) return
    setCreating(true); setCreateErr('')
    try {
      await adminApi.createPromo({
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_uses: form.max_uses ? Number(form.max_uses) : undefined,
        expires_at: form.expires_at || undefined,
      })
      setForm({ code: '', discount_type: 'percent', discount_value: '', max_uses: '', expires_at: '' })
      setCreate(false)
      await load()
    } catch (e) {
      setCreateErr(e instanceof Error ? e.message : 'Ошибка')
    } finally { setCreating(false) }
  }

  const toggle = async (promo: PromoCode) => {
    setToggling(promo.id)
    try { await adminApi.togglePromo(promo.id, !promo.is_active); await load() }
    catch {}
    finally { setToggling(null) }
  }

  const canCreate = session.role === 'admin'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Промокоды</div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setCreate(true)}>
            + Создать
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && <div className="loading">Загрузка...</div>}
        {!loading && promos.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🏷️</div>
            <div>Промокоды не созданы</div>
          </div>
        )}
        {!loading && promos.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Код</th>
                <th>Скидка</th>
                <th>Использований</th>
                <th>Действует до</th>
                <th>Статус</th>
                {canCreate && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {promos.map(p => {
                const exp = isExpired(p.expires_at)
                const exhausted = p.max_uses !== null && p.used_count >= p.max_uses
                return (
                  <tr key={p.id}>
                    <td>
                      <code style={{
                        fontFamily: 'monospace', fontWeight: 700, fontSize: 15,
                        background: 'var(--border)', padding: '3px 8px', borderRadius: 6,
                        letterSpacing: '.05em',
                      }}>
                        {p.code}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {p.discount_type === 'percent'
                        ? `${p.discount_value}%`
                        : `${p.discount_value.toLocaleString()} сум`}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                      {p.used_count}
                      {p.max_uses !== null && (
                        <span style={{ color: 'var(--text-muted)' }}> / {p.max_uses}</span>
                      )}
                      {exhausted && <span className="chip chip-danger" style={{ marginLeft: 6, fontSize: 11 }}>Исчерпан</span>}
                    </td>
                    <td style={{ fontSize: 13, color: exp ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {fmtDate(p.expires_at)}
                      {exp && <span style={{ marginLeft: 4 }}>⚠️</span>}
                    </td>
                    <td>
                      <span className={p.is_active && !exp && !exhausted ? 'chip chip-success' : 'chip chip-muted'}>
                        {p.is_active && !exp && !exhausted ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    {canCreate && (
                      <td>
                        <button
                          className={`btn btn-sm ${p.is_active ? 'btn-ghost' : 'btn-success'}`}
                          disabled={toggling === p.id}
                          onClick={() => toggle(p)}
                          style={{ minWidth: 88 }}
                        >
                          {toggling === p.id ? '…' : p.is_active ? 'Выключить' : 'Включить'}
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setCreate(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Новый промокод</div>
            {createErr && <div className="error-banner" style={{ marginBottom: 12 }}>{createErr}</div>}
            <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Код промокода *">
                <input
                  placeholder="WELCOME10"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  required
                  style={inputStyle}
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Тип скидки *">
                  <select
                    value={form.discount_type}
                    onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="percent">Процент (%)</option>
                    <option value="fixed">Фиксированная (сум)</option>
                  </select>
                </Field>
                <Field label={form.discount_type === 'percent' ? 'Размер (%)  *' : 'Размер (сум) *'}>
                  <input
                    type="number" min={1} max={form.discount_type === 'percent' ? 100 : undefined}
                    placeholder={form.discount_type === 'percent' ? '10' : '20000'}
                    value={form.discount_value}
                    onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Макс. использований">
                  <input
                    type="number" min={1} placeholder="Без ограничений"
                    value={form.max_uses}
                    onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Действует до">
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setCreate(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Создаём…' : 'Создать промокод'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)', fontSize: 14, minHeight: 44,
  background: 'var(--surface)', fontFamily: 'inherit',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}
