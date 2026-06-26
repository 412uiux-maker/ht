import { useState } from 'react'
import { IconTrash } from '@ht/shared'

interface Service {
  id: number
  title_ru: string
  title_uz: string
  category: string
  price: number
  duration: number
  format: 'online' | 'offline'
  description: string
  active: boolean
}

const CATEGORIES: Record<string, string> = {
  vet_online:  'Онлайн-консультация',
  vet_offline: 'Выезд / приём',
  vaccination: 'Вакцинация',
  surgery:     'Хирургия',
  grooming:    'Груминг',
  other:       'Другое',
}

const INITIAL: Service[] = [
  { id: 1, title_ru: 'Онлайн-консультация', title_uz: 'Online maslahat',   category: 'vet_online',  price: 120000, duration: 30, format: 'online',  description: '', active: true  },
  { id: 2, title_ru: 'Диагностика на дому',  title_uz: 'Uyda diagnostika', category: 'vet_offline', price: 200000, duration: 60, format: 'offline', description: '', active: true  },
  { id: 3, title_ru: 'Вакцинация',           title_uz: 'Emlash',           category: 'vaccination', price: 80000,  duration: 20, format: 'offline', description: '', active: false },
  { id: 4, title_ru: 'Стерилизация',         title_uz: 'Sterilizatsiya',   category: 'surgery',     price: 350000, duration: 90, format: 'offline', description: '', active: true  },
  { id: 5, title_ru: 'Чипирование',          title_uz: 'Chiprovka',        category: 'other',       price: 50000,  duration: 15, format: 'offline', description: '', active: true  },
]

const EMPTY: Omit<Service, 'id'> = {
  title_ru: '', title_uz: '', category: 'vet_online', price: 120000,
  duration: 30, format: 'online', description: '', active: true,
}

export default function Services() {
  const [services, setServices] = useState<Service[]>(INITIAL)
  const [editing, setEditing] = useState<Service | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleting, setDeleting] = useState<Service | null>(null)

  const openCreate = () => {
    setEditing({ id: Date.now(), ...EMPTY })
    setIsNew(true)
  }
  const openEdit = (s: Service) => { setEditing({ ...s }); setIsNew(false) }

  const save = () => {
    if (!editing) return
    if (isNew) setServices(prev => [...prev, editing])
    else setServices(prev => prev.map(s => s.id === editing.id ? editing : s))
    setEditing(null)
  }

  const confirmDelete = () => {
    if (!deleting) return
    setServices(prev => prev.filter(s => s.id !== deleting.id))
    setDeleting(null)
  }

  const toggleActive = (id: number) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Мои услуги</h1>
        <button onClick={openCreate} style={btnCoral}>+ Добавить услугу</button>
      </div>

      {/* Table */}
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
                <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 600 }}>{s.title_ru}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 999, background: 'rgba(242,120,75,.12)', color: 'var(--coral)', fontWeight: 600 }}>
                    {CATEGORIES[s.category]}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 14, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  {s.price.toLocaleString('ru-RU')} сум
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
                <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text2)' }}>{s.duration} мин</td>
                <td style={{ padding: '12px 14px' }}>
                  <button
                    onClick={() => toggleActive(s.id)}
                    aria-label={s.active ? 'Деактивировать' : 'Активировать'}
                    style={{
                      width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
                      background: s.active ? 'var(--green)' : 'var(--surface3)',
                      position: 'relative', transition: 'background .2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, width: 18, height: 18,
                      borderRadius: '50%', background: '#fff',
                      transition: 'left .2s', left: s.active ? 23 : 3,
                      boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                    }} />
                  </button>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(s)} style={btnGhost}>Изменить</button>
                    <button onClick={() => setDeleting(s)} style={{ ...btnGhost, color: 'var(--danger)' }}>Удалить</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
              <Field label="Название (RU)">
                <input style={inp} value={editing.title_ru} onChange={e => setEditing({ ...editing, title_ru: e.target.value })} />
              </Field>
              <Field label="Название (UZ)">
                <input style={inp} value={editing.title_uz} onChange={e => setEditing({ ...editing, title_uz: e.target.value })} />
              </Field>
              <Field label="Категория">
                <select style={inp} value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })}>
                  {Object.entries(CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Цена (сум)">
                  <input style={inp} type="number" value={editing.price} onChange={e => setEditing({ ...editing, price: +e.target.value })} />
                </Field>
                <Field label="Длительность (мин)">
                  <input style={inp} type="number" value={editing.duration} onChange={e => setEditing({ ...editing, duration: +e.target.value })} />
                </Field>
              </div>
              <Field label="Формат">
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 4 }}>
                  {(['online', 'offline'] as const).map(f => (
                    <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                      <input type="radio" checked={editing.format === f} onChange={() => setEditing({ ...editing, format: f })} />
                      {f === 'online' ? 'Онлайн' : 'Оффлайн'}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Описание (необязательно)">
                <textarea
                  style={{ ...inp, height: 72, resize: 'vertical' }}
                  value={editing.description}
                  onChange={e => setEditing({ ...editing, description: e.target.value })}
                />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} />
                Активна
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} style={btnGhost}>Отмена</button>
              <button onClick={save} style={btnCoral} disabled={!editing.title_ru}>Сохранить</button>
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
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
              «{deleting.title_ru}» будет удалена. Это действие нельзя отменить.
            </p>
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
