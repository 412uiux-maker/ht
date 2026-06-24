import { useState } from 'react'

type LessonType = 'video' | 'course' | 'quiz' | 'checklist'
type Level = 'beginner' | 'intermediate' | 'advanced'

interface Lesson {
  id: number
  type: LessonType
  level: Level
  title: string
  description: string
  emoji: string
  author: string
  duration_min: number
  published: boolean
  views: number
  createdAt: string
  tags: string[]
}

const TYPE_LABEL: Record<LessonType, string> = { video: 'Видео', course: 'Курс', quiz: 'Тест', checklist: 'Чек-лист' }
const TYPE_COLOR: Record<LessonType, string> = { video: '#E53935', course: '#3B5BDB', quiz: '#F57C00', checklist: '#2E7D32' }
const LEVEL_LABEL: Record<Level, string> = { beginner: 'Начинающий', intermediate: 'Средний', advanced: 'Продвинутый' }
const LEVEL_COLOR: Record<Level, string> = { beginner: '#2E7D32', intermediate: '#F57C00', advanced: '#C62828' }

const SEED: Lesson[] = [
  { id: 1, type: 'video',     level: 'beginner',     title: 'Первый год с котёнком',           description: 'Всё, что нужно знать новому владельцу котёнка',          emoji: '🐱', author: 'Азиз Каримов',    duration_min: 12, published: true,  views: 2340, createdAt: '2026-06-01', tags: ['кошки', 'новичкам'] },
  { id: 2, type: 'course',    level: 'beginner',     title: 'Основы ухода за собакой',          description: '5 уроков о питании, здоровье и гигиене',                 emoji: '🐕', author: 'Малика Юсупова', duration_min: 45, published: true,  views: 1870, createdAt: '2026-05-20', tags: ['собаки', 'курс'] },
  { id: 3, type: 'quiz',      level: 'intermediate', title: 'Знаете ли вы симптомы болезней?',  description: '15 вопросов о распознавании недугов у питомцев',           emoji: '🩺', author: 'Редакция',        duration_min: 8,  published: true,  views: 980,  createdAt: '2026-05-28', tags: ['здоровье', 'тест'] },
  { id: 4, type: 'checklist', level: 'beginner',     title: 'Ежегодный осмотр питомца',         description: '12 обязательных пунктов перед визитом к ветеринару',     emoji: '📋', author: 'Редакция',        duration_min: 5,  published: true,  views: 670,  createdAt: '2026-06-05', tags: ['ветклиника'] },
  { id: 5, type: 'video',     level: 'intermediate', title: 'Правильная чистка зубов кота',     description: 'Пошаговая техника от профессионального ветеринара',       emoji: '🦷', author: 'Жамшид Рашидов', duration_min: 7,  published: true,  views: 450,  createdAt: '2026-06-10', tags: ['кошки', 'гигиена'] },
  { id: 6, type: 'course',    level: 'advanced',     title: 'Диабет и хронические болезни',     description: 'Долгосрочный уход за питомцем с хроническим заболеванием', emoji: '💊', author: 'Азиз Каримов',    duration_min: 60, published: false, views: 0,    createdAt: '2026-06-18', tags: ['здоровье', 'курс'] },
]

type FilterType = LessonType | 'all'

const emptyForm = {
  title: '', description: '', type: 'video' as LessonType, level: 'beginner' as Level,
  emoji: '📚', author: '', duration_min: 10, published: false, tags: '',
}
type Form = typeof emptyForm

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)', fontSize: 14, minHeight: 44,
  background: 'var(--surface)', fontFamily: 'inherit', color: 'var(--text)',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

export default function Learning() {
  const [items, setItems] = useState<Lesson[]>(SEED)
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'create' | 'edit' | 'delete'>(null)
  const [target, setTarget] = useState<Lesson | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [saving, setSaving] = useState(false)

  const filtered = items.filter(i => {
    const matchType = typeFilter === 'all' || i.type === typeFilter
    const q = search.toLowerCase()
    const matchSearch = !q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.tags.some(t => t.includes(q))
    return matchType && matchSearch
  })

  const openCreate = () => { setForm(emptyForm); setTarget(null); setModal('create') }
  const openEdit = (item: Lesson) => {
    setForm({
      title: item.title, description: item.description, type: item.type,
      level: item.level, emoji: item.emoji, author: item.author,
      duration_min: item.duration_min, published: item.published,
      tags: item.tags.join(', '),
    })
    setTarget(item); setModal('edit')
  }
  const openDelete = (item: Lesson) => { setTarget(item); setModal('delete') }
  const close = () => { setModal(null); setTarget(null) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (modal === 'create') {
      setItems(prev => [{
        id: Date.now(), type: form.type, level: form.level,
        title: form.title.trim(), description: form.description.trim(),
        emoji: form.emoji || '📚', author: form.author.trim() || 'Редакция',
        duration_min: Number(form.duration_min) || 10,
        published: form.published, views: 0,
        createdAt: new Date().toISOString().slice(0, 10), tags,
      }, ...prev])
    } else if (modal === 'edit' && target) {
      setItems(prev => prev.map(i => i.id === target.id ? {
        ...i, type: form.type, level: form.level, title: form.title.trim(),
        description: form.description.trim(), emoji: form.emoji || i.emoji,
        author: form.author.trim() || i.author,
        duration_min: Number(form.duration_min) || i.duration_min,
        published: form.published, tags,
      } : i))
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

  const togglePublish = (item: Lesson) =>
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, published: !i.published } : i))

  const stats = {
    total: items.length,
    published: items.filter(i => i.published).length,
    totalViews: items.reduce((s, i) => s + i.views, 0),
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Обучение</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Добавить урок</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Всего уроков',  value: stats.total,      icon: '📚' },
          { label: 'Опубликовано',  value: stats.published,  icon: '✅' },
          { label: 'Просмотров',    value: stats.totalViews.toLocaleString('ru'), icon: '👁' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div className="filter-tabs" style={{ flex: 1 }}>
          {(['all', 'video', 'course', 'quiz', 'checklist'] as const).map(f => (
            <button
              key={f}
              className={`filter-tab${typeFilter === f ? ' active' : ''}`}
              onClick={() => setTypeFilter(f)}
            >
              {f === 'all' ? 'Все' : TYPE_LABEL[f]}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по уроку…"
          style={{ ...inputStyle, width: 220, minHeight: 36, padding: '6px 12px' }}
        />
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div className="card empty">
            <div className="empty-icon">📚</div>
            <div>Уроков не найдено</div>
          </div>
        )}
        {filtered.map(item => (
          <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: TYPE_COLOR[item.type] + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>
              {item.emoji}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</span>
                <span className={`chip ${item.published ? 'chip-success' : 'chip-muted'}`} style={{ fontSize: 11 }}>
                  {item.published ? 'Опубликован' : 'Черновик'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{item.description}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <span style={{ color: TYPE_COLOR[item.type], fontWeight: 600 }}>{TYPE_LABEL[item.type]}</span>
                <span style={{ color: LEVEL_COLOR[item.level], fontWeight: 600 }}>{LEVEL_LABEL[item.level]}</span>
                <span>⏱ {item.duration_min} мин</span>
                <span>👁 {item.views.toLocaleString('ru')}</span>
                <span>✍️ {item.author}</span>
                {item.tags.map(tag => (
                  <span key={tag} style={{
                    background: 'var(--surface-2)', padding: '1px 7px',
                    borderRadius: 'var(--r-pill)',
                  }}>#{tag}</span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                className={`btn btn-sm ${item.published ? 'btn-ghost' : 'btn-success'}`}
                onClick={() => togglePublish(item)}
                style={{ minWidth: 110 }}
              >
                {item.published ? 'Снять с публ.' : 'Опубликовать'}
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => openEdit(item)}>✏️</button>
              <button className="btn btn-sm btn-danger" onClick={() => openDelete(item)}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !saving && close()}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              {modal === 'create' ? '📚 Новый урок' : '✏️ Редактировать урок'}
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
                <Field label="Тип *">
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as LessonType }))} style={inputStyle}>
                    <option value="video">📹 Видео</option>
                    <option value="course">📖 Курс</option>
                    <option value="quiz">🧠 Тест</option>
                    <option value="checklist">✅ Чек-лист</option>
                  </select>
                </Field>
                <Field label="Уровень *">
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as Level }))} style={inputStyle}>
                    <option value="beginner">Начинающий</option>
                    <option value="intermediate">Средний</option>
                    <option value="advanced">Продвинутый</option>
                  </select>
                </Field>
                <Field label="Эмодзи">
                  <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="📚" maxLength={4} style={inputStyle} />
                </Field>
              </div>

              <Field label="Заголовок *">
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Название урока"
                  required
                  style={inputStyle}
                />
              </Field>

              <Field label="Описание">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Краткое описание содержания"
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Автор">
                  <input
                    value={form.author}
                    onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                    placeholder="Редакция"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Длительность (мин)">
                  <input
                    type="number"
                    value={form.duration_min}
                    onChange={e => setForm(f => ({ ...f, duration_min: Number(e.target.value) }))}
                    min={1}
                    max={300}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Field label="Теги (через запятую)">
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="кошки, здоровье, новичкам"
                  style={inputStyle}
                />
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
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>🗑 Удалить урок?</div>
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
