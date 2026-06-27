import { useState, useEffect } from 'react'
import { IconLearning, IconCheckCircle, IconEye, IconClock, IconEdit, IconTrash } from '@ht/shared'
import { adminApi } from '../api'
import type { LearnItem } from '../types'

type LessonType = 'video' | 'course' | 'quiz' | 'checklist' | 'article' | 'guide'
type Level = 'beginner' | 'intermediate' | 'advanced'

const TYPE_LABEL: Record<LessonType, string> = { video: 'Видео', course: 'Курс', quiz: 'Тест', checklist: 'Чек-лист', article: 'Статья', guide: 'Гайд' }
const TYPE_COLOR: Record<LessonType, string> = { video: '#E53935', course: '#3B5BDB', quiz: '#F57C00', checklist: '#2E7D32', article: '#9333EA', guide: '#0369A1' }
const LEVEL_LABEL: Record<Level, string> = { beginner: 'Начинающий', intermediate: 'Средний', advanced: 'Продвинутый' }
const LEVEL_COLOR: Record<Level, string> = { beginner: '#2E7D32', intermediate: '#F57C00', advanced: '#C62828' }

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
  const [items, setItems] = useState<LearnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<null | 'create' | 'edit' | 'delete'>(null)
  const [target, setTarget] = useState<LearnItem | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    adminApi.getContent()
      .then(list => {
        setItems(list.filter(i => ['video', 'course', 'quiz', 'checklist'].includes(i.type)))
        setError(null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = items.filter(i => {
    const matchType = typeFilter === 'all' || i.type === typeFilter
    const q = search.toLowerCase()
    const matchSearch = !q || i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q) || (i.tags || []).some(t => t.toLowerCase().includes(q))
    return matchType && matchSearch
  })

  const openCreate = () => { setForm(emptyForm); setTarget(null); setModal('create') }
  const openEdit = (item: LearnItem) => {
    setForm({
      title: item.title, description: item.subtitle, type: item.type as LessonType,
      level: (item.level || 'beginner') as Level, emoji: item.emoji, author: item.author,
      duration_min: item.duration_min, published: item.is_published,
      tags: (item.tags || []).join(', '),
    })
    setTarget(item); setModal('edit')
  }
  const openDelete = (item: LearnItem) => { setTarget(item); setModal('delete') }
  const close = () => { setModal(null); setTarget(null) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const data = {
      type: form.type, category: 'learning', title: form.title.trim(),
      subtitle: form.description.trim(), emoji: form.emoji || '📚',
      author: form.author.trim() || 'Редакция', body: '',
      duration_min: Number(form.duration_min) || 10,
      is_published: form.published, sort_order: 0,
      level: form.level, tags,
    }
    try {
      if (modal === 'create') {
        const created = await adminApi.createContent(data)
        setItems(prev => [created, ...prev])
      } else if (modal === 'edit' && target) {
        const updated = await adminApi.updateContent(target.id, data)
        setItems(prev => prev.map(i => i.id === target.id ? updated : i))
      }
      close()
    } catch (e) {
      alert((e as Error).message)
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
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async (item: LearnItem) => {
    const toggled = !item.is_published
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_published: toggled } : i))
    try {
      await adminApi.updateContent(item.id, {
        type: item.type, category: item.category, title: item.title,
        subtitle: item.subtitle, emoji: item.emoji, author: item.author,
        body: item.body, duration_min: item.duration_min, is_published: toggled,
        sort_order: item.sort_order, level: item.level || 'beginner', tags: item.tags || [],
      })
    } catch {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_published: !toggled } : i))
    }
  }

  const stats = {
    total: items.length,
    published: items.filter(i => i.is_published).length,
    totalViews: items.reduce((s, i) => s + (i.views || 0), 0),
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Обучение</div>
        <button className="btn btn-primary" onClick={openCreate}>+ Добавить урок</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {([
          { label: 'Всего уроков',  value: stats.total,      Icon: IconLearning },
          { label: 'Опубликовано',  value: stats.published,  Icon: IconCheckCircle },
          { label: 'Просмотров',    value: stats.totalViews.toLocaleString('ru'), Icon: IconEye },
        ] as { label: string; value: string | number; Icon: React.ComponentType<{ size?: number; color?: string }> }[]).map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ marginBottom: 6 }}><s.Icon size={22} color="var(--primary)" /></div>
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
              {f === 'all' ? 'Все' : TYPE_LABEL[f as LessonType]}
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

      {loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          Загрузка…
        </div>
      )}

      {error && !loading && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--r-sm)',
          background: 'rgba(239,68,68,.1)', color: 'var(--danger)',
          fontSize: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <span>{error}</span>
          <button onClick={load} style={{ marginLeft: 'auto', fontSize: 12, cursor: 'pointer',
            background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 600 }}>
            Повторить
          </button>
        </div>
      )}

      {/* List */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && (
            <div className="card empty">
              <div className="empty-icon"><IconLearning size={40} color="var(--text-muted)" /></div>
              <div>Уроков не найдено</div>
            </div>
          )}
          {filtered.map(item => {
            const typeLbl = TYPE_LABEL[item.type as LessonType] || item.type
            const typeClr = TYPE_COLOR[item.type as LessonType] || '#888'
            const lvl = (item.level || 'beginner') as Level
            return (
              <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: typeClr + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  {item.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{item.title}</span>
                    <span className={`chip ${item.is_published ? 'chip-success' : 'chip-muted'}`} style={{ fontSize: 11 }}>
                      {item.is_published ? 'Опубликован' : 'Черновик'}
                    </span>
                  </div>
                  {item.subtitle && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{item.subtitle}</div>}
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ color: typeClr, fontWeight: 600 }}>{typeLbl}</span>
                    <span style={{ color: LEVEL_COLOR[lvl], fontWeight: 600 }}>{LEVEL_LABEL[lvl]}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IconClock size={12} /> {item.duration_min} мин</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><IconEye size={12} /> {(item.views || 0).toLocaleString('ru')}</span>
                    {(item.tags || []).map(tag => (
                      <span key={tag} style={{ background: 'var(--surface-2)', padding: '1px 7px', borderRadius: 'var(--r-pill)' }}>
                        #{tag}
                      </span>
                    ))}
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
            )
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !saving && close()}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              {modal === 'create'
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IconLearning size={20} /> Новый урок</span>
                : <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><IconEdit size={20} /> Редактировать урок</span>
              }
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
                <Field label="Тип *">
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as LessonType }))} style={inputStyle}>
                    <option value="video">Видео</option>
                    <option value="course">Курс</option>
                    <option value="quiz">Тест</option>
                    <option value="checklist">Чек-лист</option>
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
                  <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Редакция" style={inputStyle} />
                </Field>
                <Field label="Длительность (мин)">
                  <input type="number" value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: Number(e.target.value) }))} min={1} max={300} style={inputStyle} />
                </Field>
              </div>

              <Field label="Теги (через запятую)">
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="кошки, здоровье, новичкам" style={inputStyle} />
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
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}><IconTrash size={20} /> Удалить урок?</div>
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
