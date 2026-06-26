import { useEffect, useState } from 'react'
import { IconHeart, IconEdit, IconTrash } from '@ht/shared'
import type { GoodDeed } from '../types'
import { adminApi } from '../api'

const CATEGORIES: Record<string, string> = {
  shelter: 'Приют', rescue: 'Спасение', sterilization: 'Стерилизация',
  feeding: 'Кормление', adoption: 'Пристройство', other: 'Другое',
}
const STATUS_CHIP: Record<string, string> = {
  active: 'chip chip-success', completed: 'chip chip-blue', paused: 'chip chip-warning',
}
const STATUS_LABEL: Record<string, string> = { active: 'Активна', completed: 'Завершена', paused: 'Пауза' }

type Form = Omit<GoodDeed, 'id' | 'raised_amount' | 'participants_count' | 'created_at'>

const emptyForm: Form = {
  title: '', subtitle: '', description: '', category: 'shelter',
  goal_amount: null, emoji: '🤝', deadline: null, status: 'active', sort_order: 0,
}

function fmtMoney(n: number | null) {
  if (!n) return '—'
  return n.toLocaleString('ru-RU') + ' сум'
}

const errBox: React.CSSProperties = {
  background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)',
  borderRadius: 'var(--r-md)', padding: '10px 12px', color: '#DC2626', fontSize: 13,
}
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)', fontSize: 14, minHeight: 44,
  background: 'var(--surface)', fontFamily: 'inherit', color: 'var(--text)',
  outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

export default function Deeds() {
  const [items, setItems]     = useState<GoodDeed[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [modal, setModal]     = useState<null | 'create' | 'edit' | 'delete'>(null)
  const [target, setTarget]   = useState<GoodDeed | null>(null)
  const [form, setForm]       = useState<Form>(emptyForm)
  const [saving, setSaving]   = useState(false)
  const [saveErr, setSaveErr] = useState('')

  useEffect(() => {
    adminApi.getDeeds()
      .then(rows => { setItems(rows); setLoading(false) })
      .catch(e   => { setLoadErr(e.message); setLoading(false) })
  }, [])

  const set = (k: keyof Form, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const openCreate = () => { setForm(emptyForm); setTarget(null); setSaveErr(''); setModal('create') }
  const openEdit   = (d: GoodDeed) => {
    setForm({
      title: d.title, subtitle: d.subtitle, description: d.description,
      category: d.category, goal_amount: d.goal_amount, emoji: d.emoji,
      deadline: d.deadline ? d.deadline.slice(0, 10) : null,
      status: d.status, sort_order: d.sort_order,
    })
    setTarget(d); setSaveErr(''); setModal('edit')
  }
  const openDelete = (d: GoodDeed) => { setTarget(d); setModal('delete') }
  const close = () => { setModal(null); setTarget(null) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setSaveErr('')
    try {
      if (modal === 'create') {
        const created = await adminApi.createDeed(form)
        setItems(prev => [created, ...prev])
      } else if (modal === 'edit' && target) {
        const updated = await adminApi.updateDeed(target.id, form)
        setItems(prev => prev.map(d => d.id === updated.id ? updated : d))
      }
      close()
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Ошибка')
    } finally { setSaving(false) }
  }

  const remove = async () => {
    if (!target) return
    setSaving(true)
    try {
      await adminApi.deleteDeed(target.id)
      setItems(prev => prev.filter(d => d.id !== target.id))
      close()
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Добрые дела</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Создать</button>
      </div>

      {loadErr && <div className="card" style={{ color: 'var(--danger)', padding: 16, marginBottom: 12 }}>{loadErr}</div>}
      {loading && <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>Загрузка…</div>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.length === 0 && (
            <div className="card empty">
              <div className="empty-icon"><IconHeart size={40} color="var(--text-muted)" /></div>
              <div>Инициатив нет</div>
            </div>
          )}
          {items.map(deed => (
            <div key={deed.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {deed.emoji}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{deed.title}</span>
                  <span className={STATUS_CHIP[deed.status]} style={{ fontSize: 11 }}>{STATUS_LABEL[deed.status]}</span>
                  <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 'var(--r-pill)', background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    {CATEGORIES[deed.category] ?? deed.category}
                  </span>
                </div>
                {deed.subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{deed.subtitle}</div>}
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  {deed.goal_amount && (
                    <span>
                      Цель: <strong style={{ color: 'var(--text)' }}>{fmtMoney(deed.goal_amount)}</strong>
                      {' '} · Собрано: <strong style={{ color: 'var(--success)' }}>{fmtMoney(deed.raised_amount)}</strong>
                    </span>
                  )}
                  <span>Участников: <strong style={{ color: 'var(--text)' }}>{deed.participants_count}</strong></span>
                  {deed.deadline && <span>До: {deed.deadline.slice(0, 10)}</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="btn btn-sm btn-ghost" onClick={() => openEdit(deed)}><IconEdit size={15} /></button>
                <button className="btn btn-sm btn-danger" onClick={() => openDelete(deed)}><IconTrash size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !saving && close()}>
          <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              {modal === 'create' ? 'Новая инициатива' : 'Редактировать'}
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 64px', gap: 12 }}>
                <Field label="Категория *">
                  <select value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Статус">
                  <select value={form.status} onChange={e => set('status', e.target.value)} style={inp}>
                    <option value="active">Активна</option>
                    <option value="paused">Пауза</option>
                    <option value="completed">Завершена</option>
                  </select>
                </Field>
                <Field label="Эмодзи">
                  <input value={form.emoji ?? ''} onChange={e => set('emoji', e.target.value)} placeholder="🤝" maxLength={4} style={inp} />
                </Field>
              </div>

              <Field label="Заголовок *">
                <input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Название инициативы" style={inp} />
              </Field>
              <Field label="Подзаголовок">
                <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Краткое описание" style={inp} />
              </Field>
              <Field label="Описание">
                <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Полное описание…" style={{ ...inp, minHeight: 90, resize: 'vertical' }} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Цель (сум)">
                  <input type="number" min={0} value={form.goal_amount ?? ''} onChange={e => set('goal_amount', e.target.value ? Number(e.target.value) : null)} placeholder="необязательно" style={inp} />
                </Field>
                <Field label="Дедлайн">
                  <input type="date" value={form.deadline ?? ''} onChange={e => set('deadline', e.target.value || null)} style={inp} />
                </Field>
                <Field label="Порядок">
                  <input type="number" min={0} value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value) || 0)} style={inp} />
                </Field>
              </div>

              {saveErr && <div style={errBox}>{saveErr}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" disabled={saving} onClick={close}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !form.title.trim()}>
                  {saving ? '…' : modal === 'create' ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === 'delete' && target && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !saving && close()}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Удалить инициативу?</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              «{target.title}» будет удалена. Участия и донаты не удаляются.
            </div>
            {saveErr && <div style={{ ...errBox, marginBottom: 12 }}>{saveErr}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" disabled={saving} onClick={close}>Отмена</button>
              <button className="btn btn-danger" disabled={saving} onClick={remove}>{saving ? '…' : 'Удалить'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
