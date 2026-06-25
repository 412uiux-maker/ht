import { useState } from 'react'
import { IconContent, IconEye, IconEdit, IconTrash } from '@ht/shared'

type ContentType = 'article' | 'guide' | 'checklist'

interface ContentItem {
  id: number
  type: ContentType
  title: string
  subtitle: string
  emoji: string
  author: string
  published: boolean
  views: number
  createdAt: string
}

const TYPE_LABEL: Record<ContentType, string> = { article: 'Статья', guide: 'Гайд', checklist: 'Чек-лист' }
const TYPE_COLOR: Record<ContentType, string> = { article: '#3B5BDB', guide: '#2E7D32', checklist: '#C62828' }

const SEED: ContentItem[] = [
  { id: 1, type: 'article', title: 'Первый визит к ветеринару', subtitle: 'Что взять с собой и как подготовиться', emoji: '🏥', author: 'Редакция', published: true,  views: 1240, createdAt: '2026-06-01' },
  { id: 2, type: 'guide',   title: 'Правильное питание кошки', subtitle: 'Сухой корм, влажный корм и натуральное питание', emoji: '🥗', author: 'Азиз Каримов', published: true,  views: 870,  createdAt: '2026-05-28' },
  { id: 3, type: 'checklist', title: 'Ежегодный осмотр собаки', subtitle: '12 пунктов для владельца', emoji: '📋', author: 'Малика Юсупова', published: true, views: 530, createdAt: '2026-05-20' },
  { id: 4, type: 'article', title: 'Вакцинация: мифы и правда', subtitle: 'Развенчиваем главные заблуждения', emoji: '💉', author: 'Редакция', published: false, views: 0, createdAt: '2026-06-15' },
  { id: 5, type: 'guide',   title: 'Уход за зубами кота', subtitle: 'Пошаговая инструкция для начинающих', emoji: '🦷', author: 'Жамшид Рашидов', published: true, views: 320, createdAt: '2026-06-10' },
]

const emptyForm = { title: '', subtitle: '', type: 'article' as ContentType, emoji: '📄', author: '', published: false }
type Form = typeof emptyForm

export default function Content() {
  const [items, setItems] = useState<ContentItem[]>(SEED)
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all')
  const [modal, setModal] = useState<null | 'create' | 'edit' | 'delete'>(null)
  const [target, setTarget] = useState<ContentItem | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [saving, setSaving] = useState(false)

  const filtered = typeFilter === 'all' ? items : items.filter(i => i.type === typeFilter)

  const openCreate = () => { setForm(emptyForm); setTarget(null); setModal('create') }
  const openEdit = (item: ContentItem) => {
    setForm({ title: item.title, subtitle: item.subtitle, type: item.type, emoji: item.emoji, author: item.author, published: item.published })
    setTarget(item); setModal('edit')
  }
  const openDelete = (item: ContentItem) => { setTarget(item); setModal('delete') }
  const close = () => { setModal(null); setTarget(null) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    if (modal === 'create') {
      const newItem: ContentItem = {
        id: Date.now(), type: form.type, title: form.title.trim(),
        subtitle: form.subtitle.trim(), emoji: form.emoji || '📄',
        author: form.author.trim() || 'Редакция', published: form.published,
        views: 0, createdAt: new Date().toISOString().slice(0, 10),
      }
      setItems(prev => [newItem, ...prev])
    } else if (modal === 'edit' && target) {
      setItems(prev => prev.map(i => i.id === target.id ? { ...i, ...form } : i))
    }
    setSaving(false); close()
  }

  const remove = async () => {
    if (!target) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    setItems(prev => prev.filter(i => i.id !== target.id))
    setSaving(false); close()
  }

  const togglePublish = (item: ContentItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, published: !i.published } : i))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Контент</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Создать</button>
      </div>

      {/* Filter */}
      <div className="filter-tabs" style={{ marginBottom: 16 }}>
        {(['all', 'article', 'guide', 'checklist'] as const).map(f => (
          <button
            key={f}
            className={`filter-tab${typeFilter === f ? ' active' : ''}`}
            onClick={() => setTypeFilter(f)}
          >
            {f === 'all' ? 'Все' : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      {/* List */}
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
              background: TYPE_COLOR[item.type] + '22',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>
              {item.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</span>
                <span className={`chip ${item.published ? 'chip-success' : 'chip-muted'}`} style={{ fontSize: 11 }}>
                  {item.published ? 'Опубликован' : 'Черновик'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{item.subtitle}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ color: TYPE_COLOR[item.type], fontWeight: 600 }}>{TYPE_LABEL[item.type]}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IconEye size={12} /> {item.views}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IconEdit size={12} /> {item.author}</span>
                <span>{item.createdAt}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                className={`btn btn-sm ${item.published ? 'btn-ghost' : 'btn-success'}`}
                onClick={() => togglePublish(item)}
                style={{ minWidth: 100 }}
              >
                {item.published ? 'Снять с публ.' : 'Опубликовать'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => openEdit(item)}><IconEdit size={15} /></button>
              <button className="btn btn-sm btn-danger" onClick={() => openDelete(item)}><IconTrash size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !saving && close()}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              {modal === 'create' ? 'Новый материал' : 'Редактировать материал'}
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Тип *">
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ContentType }))} style={inputStyle}>
                    <option value="article">Статья</option>
                    <option value="guide">Гайд</option>
                    <option value="checklist">Чек-лист</option>
                  </select>
                </Field>
                <Field label="Эмодзи">
                  <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="📄" maxLength={4} style={inputStyle} />
                </Field>
              </div>
              <Field label="Заголовок *">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Введите заголовок" required style={inputStyle} />
              </Field>
              <Field label="Подзаголовок">
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Краткое описание" style={inputStyle} />
              </Field>
              <Field label="Автор">
                <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Редакция" style={inputStyle} />
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
                Опубликовать сразу
              </label>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" disabled={saving} onClick={close}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
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
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><IconTrash size={20} /> Удалить материал?</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              «{target.title}» будет удалён безвозвратно.
            </div>
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
