import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api'

interface Place {
  id: string; type: string; name_ru: string; name_uz: string
  address_ru: string; address_uz: string; desc_ru: string; desc_uz: string
  emoji: string; color: string; rating: number; reviews_cnt: number
  pets_allowed: string[]; working_hours: string; phone: string; tags: string[]
  is_active: boolean; sort_order: number
}

const TYPE_OPTIONS = ['park','cafe','shop','grooming','hotel','clinic','other']
const TYPE_LABELS: Record<string, string> = {
  park: 'Парк', cafe: 'Кафе', shop: 'Магазин',
  grooming: 'Груминг', hotel: 'Зоогостиница', clinic: 'Клиника', other: 'Другое',
}

const EMPTY: Omit<Place, 'id' | 'reviews_cnt' | 'sort_order' | 'is_active'> = {
  type: 'park', name_ru: '', name_uz: '', address_ru: '', address_uz: '',
  desc_ru: '', desc_uz: '', emoji: '📍', color: '#E8911A',
  rating: 4.5, pets_allowed: [], working_hours: '', phone: '', tags: [],
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: 13,
  background: 'var(--surface)', color: 'var(--text)', boxSizing: 'border-box' as const,
}

export default function Places() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [editing, setEditing] = useState<Partial<Place> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await adminApi.getPlaces()
      setPlaces(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!editing || !editing.name_ru || !editing.type) return
    setSaving(true)
    try {
      if (editing.id) {
        const updated = await adminApi.updatePlace(editing.id, editing)
        setPlaces(prev => prev.map(p => p.id === updated.id ? updated : p))
      } else {
        const created = await adminApi.createPlace(editing)
        setPlaces(prev => [created, ...prev])
      }
      setEditing(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally { setSaving(false) }
  }

  const toggleActive = async (p: Place) => {
    try {
      const updated = await adminApi.updatePlace(p.id, { is_active: !p.is_active })
      setPlaces(prev => prev.map(x => x.id === p.id ? updated : x))
    } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка') }
  }

  const del = async (id: string) => {
    if (!confirm('Удалить место?')) return
    try {
      await adminApi.deletePlace(id)
      setPlaces(prev => prev.filter(p => p.id !== id))
    } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка') }
  }

  const set = (k: keyof typeof EMPTY, v: unknown) =>
    setEditing(prev => prev ? { ...prev, [k]: v } : prev)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Места с питомцем</h1>
          {!loading && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{places.length} мест</div>}
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          style={{
            padding: '9px 18px', borderRadius: 'var(--r-sm)', border: 'none',
            background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          + Добавить
        </button>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', padding: '48px 0', textAlign: 'center' }}>Загрузка…</div>}
      {error   && <div className="error-banner">{error}</div>}

      {/* Edit modal */}
      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 28,
            width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
              {editing.id ? 'Редактировать место' : 'Новое место'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Тип *</div>
                <select value={editing.type ?? 'park'} onChange={e => set('type', e.target.value)} style={inp}>
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Эмодзи</div>
                <input value={editing.emoji ?? ''} onChange={e => set('emoji', e.target.value)} maxLength={4} style={inp} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Название (RU) *</div>
                <input value={editing.name_ru ?? ''} onChange={e => set('name_ru', e.target.value)} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Название (UZ)</div>
                <input value={editing.name_uz ?? ''} onChange={e => set('name_uz', e.target.value)} style={inp} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Адрес (RU)</div>
                <input value={editing.address_ru ?? ''} onChange={e => set('address_ru', e.target.value)} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Адрес (UZ)</div>
                <input value={editing.address_uz ?? ''} onChange={e => set('address_uz', e.target.value)} style={inp} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Описание (RU)</div>
              <textarea value={editing.desc_ru ?? ''} onChange={e => set('desc_ru', e.target.value)}
                style={{ ...inp, minHeight: 60, resize: 'vertical' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Описание (UZ)</div>
              <textarea value={editing.desc_uz ?? ''} onChange={e => set('desc_uz', e.target.value)}
                style={{ ...inp, minHeight: 60, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Телефон</div>
                <input value={editing.phone ?? ''} onChange={e => set('phone', e.target.value)} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Часы работы</div>
                <input value={editing.working_hours ?? ''} onChange={e => set('working_hours', e.target.value)} style={inp} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Рейтинг</div>
                <input type="number" min={1} max={5} step={0.1}
                  value={editing.rating ?? 4.5} onChange={e => set('rating', parseFloat(e.target.value))} style={inp} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Питомцы (через запятую)
              </div>
              <input
                value={(editing.pets_allowed ?? []).join(', ')}
                onChange={e => set('pets_allowed', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="🐕 Собаки, 🐱 Кошки"
                style={inp}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Теги (через запятую)
              </div>
              <input
                value={(editing.tags ?? []).join(', ')}
                onChange={e => set('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Поводок обязателен, Терраса..."
                style={inp}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <button
                onClick={() => setEditing(null)}
                style={{
                  padding: '9px 20px', borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                  color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Отмена
              </button>
              <button
                onClick={save} disabled={saving || !editing.name_ru}
                style={{
                  padding: '9px 20px', borderRadius: 'var(--r-sm)', border: 'none',
                  background: 'var(--primary)', color: '#fff', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {places.map(p => (
            <div key={p.id} className="card" style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
              opacity: p.is_active ? 1 : 0.5,
            }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name_ru}</span>
                  <span style={{
                    fontSize: 11, padding: '1px 7px', borderRadius: 999,
                    background: p.color + '22', color: p.color, fontWeight: 600,
                  }}>
                    {TYPE_LABELS[p.type] ?? p.type}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>★ {p.rating}</span>
                </div>
                {p.address_ru && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{p.address_ru}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => toggleActive(p)}
                  style={{
                    padding: '6px 12px', borderRadius: 'var(--r-sm)', fontSize: 12,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {p.is_active ? 'Скрыть' : 'Показать'}
                </button>
                <button
                  onClick={() => setEditing({ ...p })}
                  style={{
                    padding: '6px 12px', borderRadius: 'var(--r-sm)', fontSize: 12,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Редактировать
                </button>
                <button
                  onClick={() => del(p.id)}
                  style={{
                    padding: '6px 12px', borderRadius: 'var(--r-sm)', fontSize: 12,
                    border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)',
                    color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
