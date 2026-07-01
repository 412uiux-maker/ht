import { useState } from 'react'
import { IconArrowLeft, IconEdit, IconClose, IconCheck, IconTrash, IconPlus } from '@ht/shared'
import type { Person } from './Family'
import { getLang } from '../i18n'

// ── Types ─────────────────────────────────────────────────────
type VaccinationEntry = { id: string; name: string; date: string; next_date?: string }

type PersonHealth = {
  weight?: string
  height?: string
  blood_type?: string
  allergies?: string
  chronic?: string
  notes?: string
  vaccinations?: VaccinationEntry[]
}

// ── Storage ───────────────────────────────────────────────────
const hKey = (id: string) => `ht_person_health_${id}`
const loadHealth = (id: string): PersonHealth => {
  try { return JSON.parse(localStorage.getItem(hKey(id)) ?? '{}') } catch { return {} }
}
const saveHealth = (id: string, h: PersonHealth) =>
  localStorage.setItem(hKey(id), JSON.stringify(h))

// ── Helpers ───────────────────────────────────────────────────
const calcAge = (d?: string) => {
  if (!d) return null
  try {
    const months = (new Date().getFullYear() - new Date(d).getFullYear()) * 12
      + (new Date().getMonth() - new Date(d).getMonth())
    if (months < 1) return null
    if (months < 12) return getLang() === 'uz' ? `${months} oy` : `${months} мес.`
    const y = Math.floor(months / 12)
    return getLang() === 'uz' ? `${y} yil` : `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'}`
  } catch { return null }
}

const fmtDate = (d?: string) => {
  if (!d) return null
  try { return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

const BLOOD_TYPES = ['0(I)+', '0(I)−', 'A(II)+', 'A(II)−', 'B(III)+', 'B(III)−', 'AB(IV)+', 'AB(IV)−']

const PERSON_COLORS: Record<'adult' | 'child', { bg: string; text: string }> = {
  adult: { bg: 'rgba(59,130,246,0.09)', text: '#1D4ED8' },
  child: { bg: 'rgba(234,88,12,0.09)',  text: '#9A3412' },
}

// ── Shared input style ────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
  borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
  fontSize: 14, fontFamily: 'inherit', minHeight: 44,
  background: 'var(--bg)', color: 'var(--text)',
}

// ── Section wrapper ───────────────────────────────────────────
function Section({ title, action, children }: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r-lg)',
      border: '1px solid var(--border)', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

// ── Label + value row ─────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const isRu = getLang() !== 'uz'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: value ? 'var(--text)' : 'var(--text-muted)', textAlign: 'right', maxWidth: '60%' }}>
        {value || (isRu ? 'Не указано' : 'Ko\'rsatilmagan')}
      </span>
    </div>
  )
}

// ── Vaccination row ───────────────────────────────────────────
function VaxRow({ v, onDelete }: { v: VaccinationEntry; onDelete: (id: string) => void }) {
  const isRu = getLang() !== 'uz'
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>💉</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</div>
        {v.date && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {isRu ? 'Дата: ' : 'Sana: '}{fmtDate(v.date)}
          </div>
        )}
        {v.next_date && (
          <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2, fontWeight: 500 }}>
            {isRu ? 'Следующая: ' : 'Keyingisi: '}{fmtDate(v.next_date)}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(v.id)}
        aria-label={isRu ? 'Удалить' : 'O\'chirish'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 4, flexShrink: 0,
        }}
      >
        <IconTrash size={16} />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
export default function PersonCard({ person, onBack }: {
  person: Person
  onBack: () => void
}) {
  const isRu = getLang() !== 'uz'
  const [health, setHealth] = useState<PersonHealth>(() => loadHealth(person.id))
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<PersonHealth>(health)

  // Vaccination add form
  const [addVax, setAddVax] = useState(false)
  const [vaxDraft, setVaxDraft] = useState({ name: '', date: '', next_date: '' })

  const age = calcAge(person.birth_date)
  const colors = PERSON_COLORS[person.role]
  const emoji = person.role === 'child' ? '🧒' : '👤'
  const roleLabel = person.role === 'adult'
    ? (isRu ? 'Взрослый' : 'Katta')
    : (isRu ? 'Ребёнок' : 'Bola')

  const openEdit = () => { setDraft({ ...health }); setEditing(true) }
  const cancelEdit = () => setEditing(false)
  const saveEdit = () => {
    const updated: PersonHealth = { ...draft, vaccinations: health.vaccinations }
    setHealth(updated)
    saveHealth(person.id, updated)
    setEditing(false)
  }

  const addVaccination = () => {
    if (!vaxDraft.name.trim()) return
    const entry: VaccinationEntry = {
      id: Date.now().toString(),
      name: vaxDraft.name.trim(),
      date: vaxDraft.date,
      next_date: vaxDraft.next_date || undefined,
    }
    const updated: PersonHealth = { ...health, vaccinations: [...(health.vaccinations ?? []), entry] }
    setHealth(updated)
    saveHealth(person.id, updated)
    setAddVax(false)
    setVaxDraft({ name: '', date: '', next_date: '' })
  }

  const removeVaccination = (id: string) => {
    const updated: PersonHealth = { ...health, vaccinations: (health.vaccinations ?? []).filter(v => v.id !== id) }
    setHealth(updated)
    saveHealth(person.id, updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)', paddingBottom: 72 }}>

      {/* Sticky header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
      }}>
        <button
          onClick={onBack}
          aria-label={isRu ? 'Назад' : 'Orqaga'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4, display: 'flex', minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <IconArrowLeft size={22} />
        </button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 16, textAlign: 'center' }}>{person.name}</span>
        <button
          onClick={editing ? cancelEdit : openEdit}
          aria-label={editing ? (isRu ? 'Отмена' : 'Bekor') : (isRu ? 'Редактировать' : 'Tahrirlash')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: editing ? 'var(--danger)' : 'var(--primary)', padding: 4, display: 'flex', minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          {editing ? <IconClose size={22} /> : <IconEdit size={22} />}
        </button>
      </header>

      {/* Hero */}
      <div style={{
        background: colors.bg, padding: '28px 20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <div style={{ fontSize: 72, lineHeight: 1 }}>{emoji}</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>{person.name}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: colors.text,
            background: 'rgba(255,255,255,0.7)', padding: '3px 10px', borderRadius: 'var(--r-pill)',
          }}>
            {roleLabel}{age ? ` · ${age}` : ''}
          </span>
          {health.blood_type && (
            <span style={{
              fontSize: 13, fontWeight: 600, color: '#DC2626',
              background: 'rgba(255,255,255,0.7)', padding: '3px 10px', borderRadius: 'var(--r-pill)',
            }}>
              🩸 {health.blood_type}
            </span>
          )}
        </div>

        {/* Quick stats */}
        {(health.weight || health.height) && !editing && (
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            {health.weight && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>{health.weight}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isRu ? 'кг' : 'kg'}</div>
              </div>
            )}
            {health.weight && health.height && <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />}
            {health.height && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>{health.height}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{isRu ? 'см' : 'sm'}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── EDIT MODE ─────────────────────────────────────────── */}
        {editing ? (
          <>
            <Section title={isRu ? 'Основные данные' : 'Asosiy ma\'lumotlar'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Вес (кг)' : 'Vazn (kg)'}</div>
                    <input
                      type="number"
                      value={draft.weight ?? ''}
                      onChange={e => setDraft(d => ({ ...d, weight: e.target.value }))}
                      placeholder="70"
                      min={1} max={300}
                      style={inp}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Рост (см)' : 'Bo\'y (sm)'}</div>
                    <input
                      type="number"
                      value={draft.height ?? ''}
                      onChange={e => setDraft(d => ({ ...d, height: e.target.value }))}
                      placeholder="170"
                      min={30} max={250}
                      style={inp}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{isRu ? 'Группа крови' : 'Qon guruhi'}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {BLOOD_TYPES.map(bt => (
                      <button
                        key={bt}
                        onClick={() => setDraft(d => ({ ...d, blood_type: d.blood_type === bt ? undefined : bt }))}
                        style={{
                          padding: '6px 12px', borderRadius: 'var(--r-pill)',
                          border: `1.5px solid ${draft.blood_type === bt ? '#DC2626' : 'var(--border)'}`,
                          background: draft.blood_type === bt ? 'rgba(220,38,38,0.08)' : 'transparent',
                          color: draft.blood_type === bt ? '#DC2626' : 'var(--text-muted)',
                          fontWeight: draft.blood_type === bt ? 700 : 500,
                          fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all .12s',
                        }}
                      >{bt}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Аллергии' : 'Allergiyalar'}</div>
                  <textarea
                    value={draft.allergies ?? ''}
                    onChange={e => setDraft(d => ({ ...d, allergies: e.target.value }))}
                    placeholder={isRu ? 'Пенициллин, орехи...' : 'Penitsillin, yong\'oq...'}
                    rows={2}
                    style={{ ...inp, resize: 'none', lineHeight: 1.5 }}
                  />
                </div>
              </div>
            </Section>

            <Section title={isRu ? 'Хронические состояния' : 'Surunkali kasalliklar'}>
              <textarea
                value={draft.chronic ?? ''}
                onChange={e => setDraft(d => ({ ...d, chronic: e.target.value }))}
                placeholder={isRu ? 'Астма, диабет 2 типа...' : 'Astma, diabet 2-tur...'}
                rows={3}
                style={{ ...inp, resize: 'none', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' }}
              />
            </Section>

            <Section title={isRu ? 'Заметки' : 'Izohlar'}>
              <textarea
                value={draft.notes ?? ''}
                onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                placeholder={isRu ? 'Дополнительная информация...' : 'Qo\'shimcha ma\'lumot...'}
                rows={3}
                style={{ ...inp, resize: 'none', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' }}
              />
            </Section>

            <button
              onClick={saveEdit}
              style={{
                padding: '14px', borderRadius: 'var(--r-pill)',
                background: 'var(--primary)', color: '#fff', border: 'none',
                fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <IconCheck size={18} />
              {isRu ? 'Сохранить' : 'Saqlash'}
            </button>
          </>
        ) : (

          /* ── VIEW MODE ────────────────────────────────────────── */
          <>
            <Section title={isRu ? 'Основные данные' : 'Asosiy ma\'lumotlar'}>
              <div>
                <InfoRow label={isRu ? 'Вес' : 'Vazn'} value={health.weight ? `${health.weight} кг` : null} />
                <InfoRow label={isRu ? 'Рост' : 'Bo\'y'} value={health.height ? `${health.height} см` : null} />
                <InfoRow label={isRu ? 'Группа крови' : 'Qon guruhi'} value={health.blood_type} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{isRu ? 'Аллергии' : 'Allergiyalar'}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: health.allergies ? 'var(--danger)' : 'var(--text-muted)', textAlign: 'right', maxWidth: '60%' }}>
                    {health.allergies || (isRu ? 'Не указано' : 'Ko\'rsatilmagan')}
                  </span>
                </div>
              </div>
            </Section>

            <Section title={isRu ? 'Хронические состояния' : 'Surunkali kasalliklar'}>
              <p style={{ margin: 0, fontSize: 14, color: health.chronic ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.6 }}>
                {health.chronic || (isRu ? 'Не указано' : 'Ko\'rsatilmagan')}
              </p>
            </Section>

            {/* Vaccinations */}
            <Section
              title={isRu ? 'Вакцинации' : 'Emlashlar'}
              action={
                !addVax ? (
                  <button
                    onClick={() => setAddVax(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: 0 }}
                  >
                    <IconPlus size={14} />
                    {isRu ? 'Добавить' : 'Qo\'shish'}
                  </button>
                ) : null
              }
            >
              {(health.vaccinations ?? []).length === 0 && !addVax && (
                <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  {isRu ? 'Нет записей' : 'Yozuvlar yo\'q'}
                </div>
              )}
              {(health.vaccinations ?? []).map(v => (
                <VaxRow key={v.id} v={v} onDelete={removeVaccination} />
              ))}
              {addVax && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {isRu ? 'Новая запись' : 'Yangi yozuv'}
                  </div>
                  <input
                    autoFocus
                    value={vaxDraft.name}
                    onChange={e => setVaxDraft(d => ({ ...d, name: e.target.value }))}
                    placeholder={isRu ? 'Название вакцины' : 'Emlash nomi'}
                    style={inp}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Дата вакцины' : 'Sana'}</div>
                      <input type="date" value={vaxDraft.date} onChange={e => setVaxDraft(d => ({ ...d, date: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Следующая' : 'Keyingisi'}</div>
                      <input type="date" value={vaxDraft.next_date} onChange={e => setVaxDraft(d => ({ ...d, next_date: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setAddVax(false); setVaxDraft({ name: '', date: '', next_date: '' }) }}
                      style={{ flex: 1, padding: '10px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--border)', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}
                    >{isRu ? 'Отмена' : 'Bekor'}</button>
                    <button onClick={addVaccination}
                      style={{ flex: 2, padding: '10px', borderRadius: 'var(--r-pill)', background: 'var(--primary)', color: '#fff', border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}
                    >{isRu ? 'Сохранить' : 'Saqlash'}</button>
                  </div>
                </div>
              )}
            </Section>

            <Section title={isRu ? 'Заметки' : 'Izohlar'}>
              <p style={{ margin: 0, fontSize: 14, color: health.notes ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.6 }}>
                {health.notes || (isRu ? 'Не указано' : 'Ko\'rsatilmagan')}
              </p>
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
