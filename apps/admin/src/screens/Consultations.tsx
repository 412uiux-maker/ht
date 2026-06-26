import { useState, useEffect, useCallback } from 'react'
import { IconConsultation, IconClose } from '@ht/shared'
import type { ConsultationRow } from '../types'
import { adminApi } from '../api'

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾',
}

const STATUS_CHIP: Record<string, string> = {
  pending: 'chip chip-warning',
  active:  'chip chip-blue',
  completed: 'chip chip-success',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает', active: 'Активна', completed: 'Завершена',
}

export default function Consultations() {
  const [rows, setRows]         = useState<ConsultationRow[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [status, setStatus]     = useState('')
  const [q, setQ]               = useState('')
  const [page, setPage]         = useState(1)
  const [detail, setDetail]     = useState<ConsultationRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const d = await adminApi.getConsultations({ status: status || undefined, q: q || undefined, page })
      setRows(d.consultations); setTotal(d.total)
    } catch (e) { setError(e instanceof Error ? e.message : 'Ошибка') }
    finally { setLoading(false) }
  }, [status, q, page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div>
      <div className="page-title">Консультации</div>

      <div className="search-row">
        <input
          placeholder="Поиск по клиенту, питомцу, врачу…"
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1) }}
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Все статусы</option>
          <option value="pending">Ожидают</option>
          <option value="active">Активные</option>
          <option value="completed">Завершённые</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && <div className="loading">Загрузка...</div>}
        {error   && <div className="error-banner" style={{ margin: 16 }}>{error}</div>}
        {!loading && !error && rows.length === 0 && (
          <div className="empty">
            <div className="empty-icon"><IconConsultation size={40} color="var(--text-muted)" /></div>
            <div>Консультации не найдены</div>
          </div>
        )}
        {!loading && rows.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Питомец · Клиент</th>
                <th>Ветеринар</th>
                <th>Жалоба</th>
                <th>Статус</th>
                <th>Дата</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{SPECIES_EMOJI[r.pet_species] ?? '🐾'}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.pet_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.client_name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{r.vet_emoji ?? '👨‍⚕️'}</span>
                      <span style={{ fontSize: 13 }}>{r.vet_name ?? '—'}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 200 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.problem}
                    </div>
                  </td>
                  <td>
                    <span className={STATUS_CHIP[r.status] ?? 'chip chip-muted'}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleString('ru', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td>
                    {r.status === 'completed' && r.report && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDetail(r)}
                      >
                        Заключение
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 20 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Назад</button>
          <span>Страница {page} из {totalPages} · всего {total}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Вперёд →</button>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {detail.pet_name} · {detail.client_name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  {detail.vet_name} · {new Date(detail.created_at).toLocaleDateString('ru')}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}><IconClose size={16} /></button>
            </div>

            {detail.report && (() => {
              const rep = detail.report as Record<string, unknown>
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Section label="Диагноз">
                    <div style={{ fontWeight: 600 }}>{rep.diagnosis as string}</div>
                  </Section>
                  {Array.isArray(rep.medications) && rep.medications.length > 0 && (
                    <Section label="Препараты">
                      {(rep.medications as Array<{ name: string; dose: string; freq: string; days: number }>).map((m, i) => (
                        <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>
                          <strong>{m.name}</strong> — {m.dose}, {m.freq}, {m.days} дн.
                        </div>
                      ))}
                    </Section>
                  )}
                  {Array.isArray(rep.steps) && rep.steps.length > 0 && (
                    <Section label="Инструкции">
                      <ol style={{ paddingLeft: 16, fontSize: 13, lineHeight: 1.7 }}>
                        {(rep.steps as string[]).map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </Section>
                  )}
                  {typeof rep.followup === 'string' && rep.followup && (
                    <Section label="Наблюдение">
                      <div style={{ fontSize: 13 }}>{rep.followup}</div>
                    </Section>
                  )}
                  {typeof rep.restrictions === 'string' && rep.restrictions && (
                    <Section label="Ограничения">
                      <div style={{ fontSize: 13 }}>{rep.restrictions}</div>
                    </Section>
                  )}
                </div>
              )
            })()}

            {!detail.report && detail.summary && (
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{detail.summary}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  )
}
