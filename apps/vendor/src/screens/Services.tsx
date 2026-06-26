import { useEffect, useState } from 'react'
import { IconTrash } from '@ht/shared'
import type { VendorService } from '../types'
import { api } from '../api'

const CATEGORIES: Record<string, string> = {
  vet_online:  'Онлайн-консультация',
  vet_offline: 'Выезд / приём',
  vaccination: 'Вакцинация',
  surgery:     'Хирургия',
  grooming:    'Груминг',
  training:    'Дрессировка',
  nutrition:   'Диетология',
  other:       'Другое',
}

const EMPTY: Omit<VendorService, 'id' | 'vet_id' | 'sort_order' | 'created_at'> = {
  title_ru: '', title_uz: '', category: 'vet_online', description: '',
  price_uzs: 120000, duration_min: 30, format: 'online', is_active: true,
}

export default function Services() {
  const [services, setServices] = useState<VendorService[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [editing, setEditing] = useState<Partial<VendorService> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleting, setDeleting] = useState<VendorService | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [deleteErr, setDeleteErr] = useState('')

  useEffect(() => {
    api.services()
      .then(rows => { setServices(rows); setLoading(false) })
      .catch(e => { setLoadErr(e.message); setLoading(false) })
  }, [])

  const openCreate = () => {
    setEditing({ ...EMPTY })
    setSaveErr('')
    setIsNew(true)
  }

  const openEdit = (s: VendorService) => {
    setEditing({ ...s })
    setSaveErr('')
    setIsNew(false)
  }

  const save = async () => {
    if (!editing || !editing.title_ru?.trim()) return
    setSaving(true)
    setSaveErr('')
    try {
      if (isNew) {
        const created = await api.createService(editing as Omit<VendorService, 'id' | 'vet_id' | 'sort_order' | 'created_at'>)
        setServices(prev => [...prev, created])
      } else {
        const updated = await api.updateService(editing.id!, editing)
        setServices(prev => prev.map(s => s.id === updated.id ? updated : s))
      }
      setEditing(null)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteErr('')
    try {
      await api.deleteService(deleting.id)
      setServices(prev => prev.filter(s => s.id !== deleting.id))
      setDeleting(null)
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const toggleActive = async (svc: VendorService) => {
    try {
      const updated = await api.updateService(svc.id, { ...svc, is_active: !svc.is_active })
      setServices(prev => prev.map(s => s.id === updated.id ? updated : s))
    } catch { /* silent — UI stays consistent */ }
  }

  const set = (k: string, v: unknown) => setEditing(prev => prev ? { ...prev, [k]: v } : prev)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Мои услуги</h1>
        <button onClick={openCreate} style={btnCoral}>+ Добавить услугу</button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text2)' }}>
          Загрузка…
        </div>
      )}

      {/* Load error */}
      {loadErr && (
        <div style={errBox}>{loadErr}</div>
      )}

      {/* Empty state */}
      {!loading && !loadErr && services.length === 0 && (
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--r-md)',
          border: '1px solid var(--surface3)',
          textAlign: 'center', padding: '48px 24px',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Услуг пока нет</p>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
            Добавьте первую услугу — она появится в каталоге после прохождения верификации
          </p>
          <button onClick={openCreate} style={btnCoral}>+ Добавить услугу</button>
        </div>
      )}

      {/* Table */}
      {!loading && services.length > 0 && (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', border: '1px solid var(--surface3)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Услуга', 'Категория', 'Цена', 'Формат', 'Длит.', 'Активна', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((s, i) => (
                <tr key={s.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--surface3)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.title_ru}</div>
                    {s.title_uz && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.title_uz}</div>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 999, background: 'rgba(242,120,75,.12)', color: 'var(--coral)', fontWeight: 600 }}>
                      {CATEGORIES[s.category] ?? s.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 14, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {s.price_uzs.toLocaleString('ru-RU')} сум
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: 12, padding: '3px 8px', borderRadius: 999, fontWeight: 600,
                      background: s.format === 'online' ? 'rgba(76,175,125,.12)' : 'rgba(124,92,191,.12)',
                      color: s.format === 'online' ? 'var(--green)' : 'var(--violet)',
                    }}>
                      {s.format === 'online' ? 'Онлайн' : 'Оффлайн'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{s.duration_min} мин</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      onClick={() => toggleActive(s)}
                      aria-label={s.is_active ? 'Деактивировать' : 'Активировать'}
                      style={{
                        width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
                        background: s.is_active ? 'var(--green)' : 'var(--surface3)',
                        position: 'relative', transition: 'background .2s', flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3, width: 18, height: 18,
                        borderRadius: '50%', background: '#fff',
                        transition: 'left .2s', left: s.is_active ? 23 : 3,
                        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                      }} />
                    </button>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(s)} style={btnGhost}>Изменить</button>
                      <button onClick={() => { setDeleting(s); setDeleteErr('') }} style={{ ...btnGhost, color: 'var(--danger)' }}>
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      {editing && (
        <div className="overlay">
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-md)',
            padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 16px 40px rgba(0,0,0,.25)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              {isNew ? 'Добавить услугу' : 'Редактировать услугу'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Название (RU) *">
                <input
                  style={inp}
                  placeholder="Онлайн-консультация"
                  value={editing.title_ru ?? ''}
                  onChange={e => set('title_ru', e.target.value)}
                />
              </Field>
              <Field label="Название (UZ)">
                <input
                  style={inp}
                  placeholder="Online maslahat"
                  value={editing.title_uz ?? ''}
                  onChange={e => set('title_uz', e.target.value)}
                />
              </Field>
              <Field label="Категория">
                <select style={inp} value={editing.category ?? 'vet_online'} onChange={e => set('category', e.target.value)}>
                  {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Цена (сум)">
                  <input
                    style={inp} type="number" min={0}
                    value={editing.price_uzs ?? 0}
                    onChange={e => set('price_uzs', parseInt(e.target.value) || 0)}
                  />
                </Field>
                <Field label="Длительность (мин)">
                  <input
                    style={inp} type="number" min={5} max={480}
                    value={editing.duration_min ?? 30}
                    onChange={e => set('duration_min', parseInt(e.target.value) || 30)}
                  />
                </Field>
              </div>
              <Field label="Формат">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 4 }}>
                  {(['online', 'offline'] as const).map(f => (
                    <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                      <input type="radio" checked={editing.format === f} onChange={() => set('format', f)} />
                      {f === 'online' ? 'Онлайн' : 'Оффлайн'}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Описание (необязательно)">
                <textarea
                  style={{ ...inp, height: 72, resize: 'vertical' }}
                  placeholder="Краткое описание услуги…"
                  value={editing.description ?? ''}
                  onChange={e => set('description', e.target.value)}
                />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editing.is_active !== false}
                  onChange={e => set('is_active', e.target.checked)}
                />
                Активна (видна клиентам)
              </label>
            </div>

            {saveErr && <div style={{ ...errBox, marginTop: 12 }}>{saveErr}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} style={btnGhost} disabled={saving}>Отмена</button>
              <button
                onClick={save}
                style={{ ...btnCoral, opacity: saving || !editing.title_ru?.trim() ? 0.6 : 1 }}
                disabled={saving || !editing.title_ru?.trim()}
              >
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleting && (
        <div className="overlay">
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-md)',
            padding: 28, maxWidth: 360, width: '90%',
            boxShadow: '0 16px 40px rgba(0,0,0,.25)',
          }}>
            <div style={{ marginBottom: 12 }}><IconTrash size={32} color="var(--danger)" /></div>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Удалить услугу?</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>
              «{deleting.title_ru}» будет удалена навсегда.
            </p>
            {deleteErr && <div style={{ ...errBox, marginBottom: 12 }}>{deleteErr}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleting(null)} style={btnGhost}>Отмена</button>
              <button onClick={confirmDelete} style={{ ...btnCoral, background: 'var(--danger)' }}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'var(--surface2)',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
}
const btnCoral: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 'var(--r-sm)', border: 'none',
  background: 'var(--coral)', color: '#fff', fontWeight: 600, fontSize: 14,
  cursor: 'pointer', minHeight: 44, fontFamily: 'inherit',
}
const btnGhost: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'var(--surface2)',
  color: 'var(--text2)', fontWeight: 500, fontSize: 14,
  cursor: 'pointer', minHeight: 44, fontFamily: 'inherit',
}
const errBox: React.CSSProperties = {
  background: 'rgba(217,83,74,.08)', border: '1px solid rgba(217,83,74,.25)',
  borderRadius: 'var(--r-sm)', padding: '10px 12px',
  color: 'var(--danger)', fontSize: 13,
}
