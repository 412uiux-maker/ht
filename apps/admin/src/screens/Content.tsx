import { useEffect, useState } from 'react'
import { IconContent, IconEye, IconEdit, IconTrash } from '@ht/shared'
import type { LearnItem } from '../types'
import { adminApi } from '../api'

type ContentType = 'article' | 'guide' | 'checklist'
type FilterType  = ContentType | 'all'

const TYPE_LABEL: Record<ContentType, string> = { article: 'Статья', guide: 'Гайд', checklist: 'Чек-лист' }
const TYPE_COLOR: Record<ContentType, string>  = { article: '#3B5BDB', guide: '#2E7D32', checklist: '#C62828' }

const CATEGORIES = ['vet', 'food', 'care', 'health', 'other']
const CAT_LABEL: Record<string, string> = { vet: 'Ветеринария', food: 'Питание', care: 'Уход', health: 'Здоровье', other: 'Другое' }

type Form = Omit<LearnItem, 'id' | 'created_at' | 'views'>

const emptyForm: Form = {
  type: 'article', category: 'vet', title: '', subtitle: '',
  emoji: '📄', author: 'Редакция', body: '',
  duration_min: 5, is_published: false, sort_order: 0,
}

export default function Content() {
  const [items, setItems]         = useState<LearnItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [loadErr, setLoadErr]     = useState('')
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [modal, setModal]         = useState<null | 'create' | 'edit' | 'delete'>(null)
  const [target, setTarget]       = useState<LearnItem | null>(null)
  const [form, setForm]           = useState<Form>(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [saveErr, setSaveErr]     = useState('')

  useEffect(() => {
    adminApi.getContent()
      .then(rows => { setItems(rows); setLoading(false) })
      .catch(e   => { setLoadErr(e.message); setLoading(false) })
  }, [])

  const filtered = typeFilter === 'all' ? items : items.filter(i => i.type === typeFilter)

  const openCreate = () => { setForm(emptyForm); setTarget(null); setSaveErr(''); setModal('create') }
  const openEdit   = (item: LearnItem) => {
    setForm({
      type: item.type, category: item.category, title: item.title, subtitle: item.subtitle ?? '',
      emoji: item.emoji ?? '📄', author: item.author ?? 'Редакция', body: item.body ?? '',
      duration_min: item.duration_min, is_published: item.is_published, sort_order: item.sort_order,
    })
    setTarget(item); setSaveErr(''); setModal('edit')
  }
  const openDelete = (item: LearnItem) => { setTarget(item); setModal('delete') }
  const close = () => { setModal(null); setTarget(null) }

  const set = (k: keyof Form, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true); setSaveErr('')
    try {
      if (modal === 'create') {
        const created = await adminApi.createContent(form)
        setItems(prev => [created, ...prev])
      } else if (modal === 'edit' && target) {
        const updated = await adminApi.updateContent(target.id, form)
        setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
      }
      close()
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!target) return
    setSaving(true)
    try {
      await adminApi.deleteContent(target.id)
      setItems(prev => prev.filter(i => i.id !== target.id))
      close()
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (item: LearnItem) => {
    try {
      const updated = await adminApi.updateContent(item.id, {
        ...item, is_published: !item.is_published,
      })
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    } catch { /* silent */ }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Контент</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Создать</button>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs" style={{ marginBottom: 16 }}>
        {(['all', 'article', 'guide', 'checklist'] as const).map(f => (
          <button key={f} className={`filter-tab${typeFilter === f ? ' active' : ''}`} onClick={() => setTypeFilter(f)}>
            {f === 'all' ? 'Все' : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>Загрузка…</div>}
      {loadErr  && <div className="card" style={{ color: 'var(--danger)', padding: 16 }}>{loadErr}</div>}

      {/* List */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && (
            <div className="card empty">
              <div className="empty-icon"><IconContent size={40} color="var(--text-muted)" /></div>
              <div>Материалов нет</div>
            </div>
          )}
          {filtered.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: (TYPE_COLOR[item.type as ContentType] ?? '#888') + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {item.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</span>
                  <span className={`chip ${item.is_published ? 'chip-success' : 'chip-muted'}`} style={{ fontSize: 11 }}>
                    {item.is_published ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
                {item.subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{item.subtitle}</div>}
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ color: TYPE_COLOR[item.type as ContentType] ?? '#888', fontWeight: 600 }}>
                    {TYPE_LABEL[item.type as ContentType] ?? item.type}
                  </span>
                  <span>{CAT_LABEL[item.category] ?? item.category}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IconEye size={12} /> {item.views}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IconEdit size={12} /> {item.author}</span>
                  <span>{item.created_at?.slice(0, 10)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className={`btn btn-sm ${item.is_published ? 'btn-ghost' : 'btn-success'}`}
                  onClick={() => togglePublish(item)}
                  style={{ minWidth: 110 }}
                >
                  {item.is_published ? 'Снять с публ.' : 'Опубликовать'}
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => openEdit(item)}><IconEdit size={15} /></button>
                <button className="btn btn-sm btn-danger" onClick={() => openDelete(item)}><IconTrash size={15} /></button>
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
              {modal === 'create' ? 'Новый материал' : 'Редактировать материал'}
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
                <Field label="Тип *">
                  <select value={form.type} onChange={e => set('type', e.target.value)} style={inp}>
                    <option value="article">Статья</option>
                    <option value="guide">Гайд</option>
                    <option value="checklist">Чек-лист</option>
                  </select>
                </Field>
                <Field label="Категория *">
                  <select value={form.category} onChange={e => set('category', e.target.value)} style={inp}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                  </select>
                </Field>
                <Field label="Эмодзи">
                  <input value={form.emoji} onChange={e => set('emoji', e.target.value)} placeholder="📄" maxLength={4} style={inp} />
                </Field>
              </div>

              <Field label="Заголовок *">
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Введите заголовок" required style={inp} />
              </Field>
              <Field label="Подзаголовок">
                <input value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Краткое описание" style={inp} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <Field label="Автор">
                  <input value={form.author} onChange={e => set('author', e.target.value)} placeholder="Редакция" style={inp} />
                </Field>
                <Field label="Длит. (мин)">
                  <input type="number" min={1} max={120} value={form.duration_min} onChange={e => set('duration_min', parseInt(e.target.value) || 5)} style={{ ...inp, width: 80 }} />
                </Field>
              </div>

              <Field label="Текст материала">
                <textarea
                  value={form.body}
                  onChange={e => set('body', e.target.value)}
                  placeholder="Содержание статьи, гайда или описание чек-листа…"
                  style={{ ...inp, minHeight: 120, resize: 'vertical' }}
                />
              </Field>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} />
                Опубликовать сразу
              </label>

              {saveErr && <div style={errBox}>{saveErr}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
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
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconTrash size={20} /> Удалить материал?
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              «{target.title}» будет удалён безвозвратно. Прогресс пользователей по нему тоже удалится.
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

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)', fontSize: 14, minHeight: 44,
  background: 'var(--surface)', fontFamily: 'inherit', color: 'var(--text)',
  outline: 'none', boxSizing: 'border-box',
}

const errBox: React.CSSProperties = {
  background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)',
  borderRadius: 'var(--r-md)', padding: '10px 12px',
  color: '#DC2626', fontSize: 13,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}
