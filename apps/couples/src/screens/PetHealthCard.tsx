import { useState, useEffect, useRef } from 'react'
import { IconArrowLeft, IconEdit, IconClose, IconCheck, IconTrash, IconPlus } from '@ht/shared'
import { api, getOwnerId } from '../api'
import type { Pet, HealthEvent } from '../api'
import { getLang } from '../i18n'
import { SPECIES_COLORS, speciesEmoji } from './Pets'

// ── Types ─────────────────────────────────────────────────────
type PetVaxEntry = { id: string; name: string; date: string; next_date?: string; batch?: string; clinic?: string }
type PetTreatEntry = { id: string; type: string; date: string; next_date?: string; drug?: string }

type PetHealthData = {
  chronic?: string
  notes?: string
  vaccinations?: PetVaxEntry[]
  treatments?: PetTreatEntry[]
}

// ── Storage ───────────────────────────────────────────────────
const hKey = (id: string) => `ht_pet_health_${id}`
const loadHealth = (id: string): PetHealthData => {
  try { return JSON.parse(localStorage.getItem(hKey(id)) ?? '{}') } catch { return {} }
}
const saveHealth = (id: string, h: PetHealthData) =>
  localStorage.setItem(hKey(id), JSON.stringify(h))

// ── Ext storage (allergies are stored there) ──────────────────
type PetExtPartial = { allergies?: string }
const loadAllergies = (id: string): string => {
  try { return (JSON.parse(localStorage.getItem(`ht_pet_ext_${id}`) ?? '{}') as PetExtPartial).allergies ?? '' }
  catch { return '' }
}

// ── Species-specific vaccine suggestions ──────────────────────
const VAX_SUGGESTIONS: Record<string, string[]> = {
  dog:     ['Бешенство', 'DHPP', 'Лептоспироз', 'Бордетеллёз'],
  cat:     ['Бешенство', 'РКП', 'Хламидиоз', 'Лейкемия кошек'],
  rabbit:  ['Миксоматоз', 'ВГБК'],
  parrot:  ['Болезнь Ньюкасла'],
  hamster: ['Бешенство'],
  other:   [],
}

const TREAT_TYPES = ['Дегельминтизация', 'Противопаразитарная', 'Витамины', 'Другое']

// ── Date formatter ────────────────────────────────────────────
const fmtDate = (d?: string) => {
  if (!d) return null
  try { return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
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

// ── Vax row ───────────────────────────────────────────────────
function VaxRow({ v, onDelete }: { v: PetVaxEntry; onDelete: (id: string) => void }) {
  const isRu = getLang() !== 'uz'
  const isOverdue = v.next_date && new Date(v.next_date) < new Date()
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
        {v.batch && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {isRu ? 'Серия: ' : 'Seriya: '}<span style={{ fontFamily: 'monospace' }}>{v.batch}</span>
          </div>
        )}
        {v.clinic && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>🏥 {v.clinic}</div>
        )}
        {v.next_date && (
          <div style={{ fontSize: 12, marginTop: 2, fontWeight: 500, color: isOverdue ? 'var(--danger)' : 'var(--primary)' }}>
            {isOverdue
              ? (isRu ? '⚠️ Просрочена: ' : '⚠️ Muddati o\'tgan: ')
              : (isRu ? 'Следующая: ' : 'Keyingisi: ')
            }
            {fmtDate(v.next_date)}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(v.id)}
        aria-label={isRu ? 'Удалить' : 'O\'chirish'}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}
      >
        <IconTrash size={16} />
      </button>
    </div>
  )
}

// ── Treatment row ─────────────────────────────────────────────
function TreatRow({ v, onDelete }: { v: PetTreatEntry; onDelete: (id: string) => void }) {
  const isRu = getLang() !== 'uz'
  const isOverdue = v.next_date && new Date(v.next_date) < new Date()
  const typeEmoji: Record<string, string> = {
    'Дегельминтизация':    '🪱',
    'Противопаразитарная': '🦟',
    'Витамины':            '💊',
    'Другое':              '🩺',
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>
        {typeEmoji[v.type] ?? '🩺'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{v.type}</div>
        {v.drug && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>💊 {v.drug}</div>
        )}
        {v.date && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {isRu ? 'Дата: ' : 'Sana: '}{fmtDate(v.date)}
          </div>
        )}
        {v.next_date && (
          <div style={{ fontSize: 12, marginTop: 2, fontWeight: 500, color: isOverdue ? 'var(--danger)' : 'var(--primary)' }}>
            {isOverdue
              ? (isRu ? '⚠️ Просрочена: ' : '⚠️ Muddati o\'tgan: ')
              : (isRu ? 'Следующая: ' : 'Keyingisi: ')
            }
            {fmtDate(v.next_date)}
          </div>
        )}
      </div>
      <button
        onClick={() => onDelete(v.id)}
        aria-label={isRu ? 'Удалить' : 'O\'chirish'}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, flexShrink: 0 }}
      >
        <IconTrash size={16} />
      </button>
    </div>
  )
}

// ── Health timeline helpers ───────────────────────────────────
const EVENT_ICON: Record<string, string> = {
  vaccination: '💉', weight: '⚖️', consultation: '🩺',
  prescription: '💊', reminder: '⏰', note: '📝',
}
const EVENT_COLOR: Record<string, string> = {
  vaccination: 'var(--primary)', weight: '#7C82E8', consultation: '#79BE57',
  prescription: '#7C82E8', reminder: '#F59E0B', note: 'var(--text-muted)',
}

type Urgency = 'expired' | 'soon' | null

function getUrgency(ev: HealthEvent): Urgency {
  if (ev.type !== 'reminder' && ev.type !== 'vaccination') return null
  const t = ev.title.toLowerCase()
  if (t.includes('просрочен') || t.includes('muddati') || t.includes('истёк')) return 'expired'
  if (t.includes('скоро') || t.includes('tez orada') || t.includes('через')) return 'soon'
  return null
}

function groupByDate(events: HealthEvent[], isRu: boolean) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const map = new Map<string, HealthEvent[]>()
  for (const ev of events) {
    const d = new Date(ev.occurred_at); d.setHours(0, 0, 0, 0)
    const key = d.toISOString()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ev)
  }
  return [...map.entries()].map(([key, items]) => {
    const d = new Date(key)
    let label: string
    if (d.getTime() === today.getTime()) label = isRu ? 'Сегодня' : 'Bugun'
    else if (d.getTime() === yesterday.getTime()) label = isRu ? 'Вчера' : 'Kecha'
    else label = d.toLocaleDateString(isRu ? 'ru-RU' : 'uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
    return { label, items }
  })
}

// ── HealthTimeline component ──────────────────────────────────
function HealthTimeline({ pet, onAskVet, onWeightLogged }: {
  pet: Pet
  onAskVet?: (reasonEventId?: string) => void
  onWeightLogged?: (kg: number) => void
}) {
  const isRu = getLang() !== 'uz'
  const ownerId = getOwnerId()
  const [events, setEvents] = useState<HealthEvent[] | null>(null)
  const [err, setErr] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [showWeight, setShowWeight] = useState(false)
  const [weightVal, setWeightVal] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const weightRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setErr(false)
    setEvents(null)
    api.petEvents(pet.id, ownerId).then(setEvents).catch(() => setErr(true))
  }

  useEffect(() => { load() }, [pet.id])

  const saveNote = async () => {
    if (!noteText.trim()) return
    setSaving(true)
    try {
      await api.createPetEvent(pet.id, { owner_id: ownerId, type: 'note', title: noteText.trim() })
      setNoteText(''); setShowNote(false); load()
    } catch { /* silent */ } finally { setSaving(false) }
  }

  const saveWeight = async () => {
    const kg = parseFloat(weightVal.replace(',', '.'))
    if (!kg || kg <= 0 || kg > 999) return
    setSavingWeight(true)
    try {
      await api.logPetWeight(pet.id, { owner_id: ownerId, value: kg })
      onWeightLogged?.(kg)
      setWeightVal(''); setShowWeight(false); load()
    } catch { /* silent */ } finally { setSavingWeight(false) }
  }

  const groups = events ? groupByDate(events, isRu) : []
  const hasEvents = events !== null && events.length > 0

  return (
    <Section
      title={isRu ? 'История здоровья' : "Sog'liq tarixi"}
      action={
        onAskVet ? (
          <button onClick={() => onAskVet()} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontSize: 13, fontWeight: 600,
            fontFamily: 'inherit', padding: 0, minHeight: 44,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            🩺 {isRu ? 'Спросить врача' : "Veterinarga so'rash"}
          </button>
        ) : null
      }
    >
      {/* Loading skeleton */}
      {events === null && !err && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[80, 60, 72].map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} className="ht-pulse" />
              <div style={{ height: 14, borderRadius: 4, background: 'var(--border)', width: `${w}%` }} className="ht-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {err && (
        <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          <div style={{ marginBottom: 8 }}>⚠️ {isRu ? 'Не удалось загрузить' : "Yuklab bo'lmadi"}</div>
          <button onClick={load} style={{
            background: 'none', border: '1.5px solid var(--border)', borderRadius: 'var(--r-pill)',
            padding: '6px 16px', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', color: 'var(--text)', minHeight: 44,
          }}>
            {isRu ? 'Повторить' : 'Qayta urinish'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {events !== null && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0 6px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>
            {isRu ? 'Событий пока нет' : "Hozircha voqealar yo'q"}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>
            {isRu ? 'Добавьте прививку или запись о весе — они появятся здесь' : "Emlash yoki og'irlik yozuvi qo'shing — ular shu yerda paydo bo'ladi"}
          </div>
        </div>
      )}

      {/* Timeline */}
      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: gi < groups.length - 1 ? 18 : 0 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
          }}>
            {g.label}
          </div>
          {g.items.map((ev, i) => {
            const urgency = getUrgency(ev)
            const iconBg = urgency === 'expired'
              ? 'rgba(239,68,68,.12)'
              : urgency === 'soon'
              ? 'rgba(245,158,11,.12)'
              : `${EVENT_COLOR[ev.type] ?? 'var(--text-muted)'}1A`
            return (
            <div key={ev.id} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              paddingBottom: i < g.items.length - 1 ? 12 : 0,
              marginBottom: i < g.items.length - 1 ? 12 : 0,
              borderBottom: i < g.items.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, flexShrink: 0,
              }}>
                {EVENT_ICON[ev.type] ?? '📝'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
                  {ev.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(ev.occurred_at).toLocaleTimeString(isRu ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {urgency === 'expired' && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 'var(--r-pill)', background: 'rgba(239,68,68,.12)',
                      color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {isRu ? 'Просрочено' : "Muddati o'tgan"}
                    </span>
                  )}
                  {urgency === 'soon' && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 'var(--r-pill)', background: 'rgba(245,158,11,.12)',
                      color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {isRu ? 'Скоро' : 'Tez orada'}
                    </span>
                  )}
                  {ev.source === 'vet' && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 'var(--r-pill)', background: 'rgba(121,190,87,.12)',
                      color: '#79BE57', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {isRu ? 'Ветеринар' : 'Veterinar'}
                    </span>
                  )}
                  {ev.note && (
                    <span style={{
                      fontSize: 11, color: 'var(--text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
                    }}>
                      {ev.note}
                    </span>
                  )}
                </div>
                {/* Ask vet button on alert-level events */}
                {onAskVet && (ev.type === 'reminder' || ev.type === 'vaccination') && (
                  <button
                    onClick={() => onAskVet(ev.id)}
                    style={{
                      marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 'var(--r-pill)',
                      border: `1.5px solid ${urgency === 'expired' ? 'var(--danger)' : urgency === 'soon' ? '#D97706' : 'var(--primary)'}`,
                      background: urgency === 'expired' ? 'rgba(239,68,68,.07)' : urgency === 'soon' ? 'rgba(245,158,11,.07)' : 'rgba(242,120,75,.07)',
                      color: urgency === 'expired' ? 'var(--danger)' : urgency === 'soon' ? '#D97706' : 'var(--primary)',
                      fontSize: 12, fontWeight: 600,
                      fontFamily: 'inherit', cursor: 'pointer', minHeight: 32,
                    }}
                  >
                    🩺 {isRu ? 'Спросить врача' : "Veterinarga so'rash"}
                  </button>
                )}
              </div>
            </div>
            )
          })}
        </div>
      ))}

      {/* Add note form */}
      {showNote && (
        <div style={{
          marginTop: hasEvents ? 14 : 0,
          borderTop: hasEvents ? '1px solid var(--border)' : 'none',
          paddingTop: hasEvents ? 12 : 0,
        }}>
          <textarea
            ref={textareaRef}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder={isRu ? 'Опишите наблюдение или событие…' : 'Kuzatuv yoki voqeani tasvirlab bering…'}
            rows={3}
            style={{ ...inp, resize: 'none', lineHeight: 1.5 }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => { setShowNote(false); setNoteText('') }}
              style={{ flex: 1, padding: '10px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--border)', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}
            >
              {isRu ? 'Отмена' : 'Bekor qilish'}
            </button>
            <button
              onClick={saveNote}
              disabled={!noteText.trim() || saving}
              style={{
                flex: 2, padding: '10px', borderRadius: 'var(--r-pill)',
                background: noteText.trim() && !saving ? 'var(--primary)' : 'var(--border)',
                color: noteText.trim() && !saving ? '#fff' : 'var(--text-muted)',
                border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                cursor: noteText.trim() && !saving ? 'pointer' : 'not-allowed', minHeight: 44,
              }}
            >
              {saving ? '…' : (isRu ? 'Сохранить' : 'Saqlash')}
            </button>
          </div>
        </div>
      )}

      {/* Weight form */}
      {showWeight && (
        <div style={{
          marginTop: hasEvents ? 14 : 0,
          borderTop: hasEvents ? '1px solid var(--border)' : 'none',
          paddingTop: hasEvents ? 12 : 0,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            ⚖️ {isRu ? 'Записать вес' : "Og'irlikni yozish"}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={weightRef}
              type="number"
              inputMode="decimal"
              value={weightVal}
              onChange={e => setWeightVal(e.target.value)}
              placeholder={isRu ? 'кг (напр. 4.5)' : 'kg (mas. 4.5)'}
              style={{ ...inp, flex: 1 }}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveWeight()}
            />
            <button
              onClick={() => { setShowWeight(false); setWeightVal('') }}
              style={{ padding: '10px 14px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--border)', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44, color: 'var(--text)' }}
            >
              {isRu ? 'Отмена' : 'Bekor'}
            </button>
            <button
              onClick={saveWeight}
              disabled={!weightVal || savingWeight}
              style={{
                padding: '10px 16px', borderRadius: 'var(--r-pill)',
                background: weightVal && !savingWeight ? '#7C82E8' : 'var(--border)',
                color: weightVal && !savingWeight ? '#fff' : 'var(--text-muted)',
                border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                cursor: weightVal && !savingWeight ? 'pointer' : 'not-allowed', minHeight: 44,
              }}
            >
              {savingWeight ? '…' : (isRu ? 'Сохранить' : 'Saqlash')}
            </button>
          </div>
        </div>
      )}

      {/* Action buttons row */}
      {!showNote && !showWeight && events !== null && (
        <div style={{ display: 'flex', gap: 8, marginTop: hasEvents ? 14 : 8 }}>
          <button
            onClick={() => setShowWeight(true)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              padding: '10px', borderRadius: 'var(--r-pill)',
              border: '1.5px dashed var(--border)',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', minHeight: 44,
            }}
          >
            ⚖️ {isRu ? 'Вес' : "Og'irlik"}
          </button>
          <button
            onClick={() => setShowNote(true)}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              padding: '10px', borderRadius: 'var(--r-pill)',
              border: '1.5px dashed var(--border)',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', minHeight: 44,
            }}
          >
            <IconPlus size={14} />
            {isRu ? 'Добавить заметку' : "Izoh qo'shish"}
          </button>
        </div>
      )}

      <style>{`
        .ht-pulse { animation: ht-pulse 1.4s ease-in-out infinite }
        @keyframes ht-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media (prefers-reduced-motion:reduce) { .ht-pulse { animation:none } }
      `}</style>
    </Section>
  )
}

// ═══════════════════════════════════════════════════════════════
export default function PetHealthCard({ pet, onBack, onAskVet }: {
  pet: Pet
  onBack: () => void
  onAskVet?: (reasonEventId?: string) => void
}) {
  const isRu = getLang() !== 'uz'
  const colors = SPECIES_COLORS[pet.species] ?? SPECIES_COLORS.other
  const allergies = loadAllergies(pet.id)

  const [health, setHealth] = useState<PetHealthData>(() => loadHealth(pet.id))
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Pick<PetHealthData, 'chronic' | 'notes'>>(health)
  const [localWeight, setLocalWeight] = useState<number | null>(null)

  // Vaccination add form
  const [addVax, setAddVax] = useState(false)
  const [vaxDraft, setVaxDraft] = useState({ name: '', date: '', next_date: '', batch: '', clinic: '' })

  // Treatment add form
  const [addTreat, setAddTreat] = useState(false)
  const [treatDraft, setTreatDraft] = useState({ type: TREAT_TYPES[0], date: '', next_date: '', drug: '' })

  const vaxSuggestions = VAX_SUGGESTIONS[pet.species] ?? []

  const mutate = (next: PetHealthData) => {
    setHealth(next)
    saveHealth(pet.id, next)
  }

  const saveEdit = () => {
    const next: PetHealthData = { ...health, chronic: draft.chronic, notes: draft.notes }
    mutate(next)
    setEditing(false)
  }

  const addVaccination = () => {
    if (!vaxDraft.name.trim()) return
    const entry: PetVaxEntry = {
      id: Date.now().toString(),
      name: vaxDraft.name.trim(),
      date: vaxDraft.date,
      next_date: vaxDraft.next_date || undefined,
      batch:  vaxDraft.batch.trim()  || undefined,
      clinic: vaxDraft.clinic.trim() || undefined,
    }
    mutate({ ...health, vaccinations: [...(health.vaccinations ?? []), entry] })
    setAddVax(false)
    setVaxDraft({ name: '', date: '', next_date: '', batch: '', clinic: '' })
  }

  const removeVaccination = (id: string) => {
    mutate({ ...health, vaccinations: (health.vaccinations ?? []).filter(v => v.id !== id) })
  }

  const addTreatment = () => {
    const entry: PetTreatEntry = {
      id: Date.now().toString(),
      type: treatDraft.type,
      date: treatDraft.date,
      next_date: treatDraft.next_date || undefined,
      drug: treatDraft.drug.trim() || undefined,
    }
    mutate({ ...health, treatments: [...(health.treatments ?? []), entry] })
    setAddTreat(false)
    setTreatDraft({ type: TREAT_TYPES[0], date: '', next_date: '', drug: '' })
  }

  const removeTreatment = (id: string) => {
    mutate({ ...health, treatments: (health.treatments ?? []).filter(v => v.id !== id) })
  }

  // Upcoming reminders — things due within 30 days
  const upcoming = [
    ...(health.vaccinations ?? [])
      .filter(v => v.next_date && daysUntil(v.next_date) <= 30 && daysUntil(v.next_date) >= 0)
      .map(v => ({ label: v.name, days: daysUntil(v.next_date!), kind: 'vax' as const })),
    ...(health.treatments ?? [])
      .filter(v => v.next_date && daysUntil(v.next_date) <= 30 && daysUntil(v.next_date) >= 0)
      .map(v => ({ label: v.type, days: daysUntil(v.next_date!), kind: 'treat' as const })),
  ].sort((a, b) => a.days - b.days)

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
        <span style={{ flex: 1, fontWeight: 700, fontSize: 16, textAlign: 'center' }}>
          {isRu ? `Здоровье · ${pet.name}` : `Salomatlik · ${pet.name}`}
        </span>
        <button
          onClick={() => { if (editing) { setEditing(false) } else { setDraft({ chronic: health.chronic, notes: health.notes }); setEditing(true) } }}
          aria-label={editing ? (isRu ? 'Отмена' : 'Bekor') : (isRu ? 'Редактировать' : 'Tahrirlash')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: editing ? 'var(--danger)' : 'var(--primary)', padding: 4, display: 'flex', minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          {editing ? <IconClose size={22} /> : <IconEdit size={22} />}
        </button>
      </header>

      {/* Hero */}
      <div style={{
        background: colors.bg, padding: '24px 20px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--r-xl)',
          background: 'rgba(255,255,255,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexShrink: 0,
        }}>
          {pet.avatar_emoji || speciesEmoji(pet.species)}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>{pet.name}</div>
          <div style={{ fontSize: 13, color: colors.text, fontWeight: 600, marginTop: 2 }}>
            {speciesEmoji(pet.species)} {isRu ? 'Медкарта' : 'Tibbiy karta'}
          </div>
          {(localWeight ?? pet.weight_kg) && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              ⚖️ {localWeight ?? pet.weight_kg} {isRu ? 'кг' : 'kg'}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Upcoming reminders ────────────────────────────────── */}
        {upcoming.length > 0 && (
          <div style={{
            background: 'rgba(242,120,75,0.07)', border: '1px solid rgba(242,120,75,0.25)',
            borderRadius: 'var(--r-lg)', padding: '12px 14px',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 8 }}>
              ⏰ {isRu ? 'Скоро' : 'Tez orada'}
            </div>
            {upcoming.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: i < upcoming.length - 1 ? 6 : 0 }}>
                <span style={{ color: 'var(--text)' }}>{r.kind === 'vax' ? '💉' : '🪱'} {r.label}</span>
                <span style={{ color: r.days === 0 ? 'var(--danger)' : 'var(--primary)', fontWeight: 600 }}>
                  {r.days === 0 ? (isRu ? 'Сегодня' : 'Bugun') : isRu ? `через ${r.days} дн.` : `${r.days} kun`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── EDIT MODE ────────────────────────────────────────────── */}
        {editing ? (
          <>
            <Section title={isRu ? 'Хронические болезни' : 'Surunkali kasalliklar'}>
              <textarea
                value={draft.chronic ?? ''}
                onChange={e => setDraft(d => ({ ...d, chronic: e.target.value }))}
                placeholder={isRu ? 'Дисплазия тазобедренного сустава, атопия...' : 'Surunkali kasalliklar...'}
                rows={3}
                style={{ ...inp, resize: 'none', lineHeight: 1.5, width: '100%', boxSizing: 'border-box' }}
                autoFocus
              />
            </Section>

            <Section title={isRu ? 'Заметки врача' : 'Shifokor izohlari'}>
              <textarea
                value={draft.notes ?? ''}
                onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                placeholder={isRu ? 'Рекомендации, наблюдения...' : 'Tavsiyalar, kuzatuvlar...'}
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
          /* ── VIEW MODE ──────────────────────────────────────────── */
          <>
            {/* Allergies from PetExt (read-only here, edited via Profile) */}
            {allergies && (
              <div style={{
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--r-lg)', padding: '12px 14px',
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)', marginBottom: 3 }}>
                    {isRu ? 'Аллергии' : 'Allergiyalar'}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{allergies}</div>
                </div>
              </div>
            )}

            {/* Chronic conditions */}
            <Section title={isRu ? 'Хронические болезни' : 'Surunkali kasalliklar'}>
              <p style={{ margin: 0, fontSize: 14, color: health.chronic ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.6 }}>
                {health.chronic || (isRu ? 'Не указано' : 'Ko\'rsatilmagan')}
              </p>
            </Section>

            {/* ── Vaccinations ─────────────────────────────────────── */}
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
                <div style={{ textAlign: 'center', padding: '10px 0 2px', color: 'var(--text-muted)', fontSize: 13 }}>
                  {isRu ? 'Нет записей о вакцинации' : 'Emlash yozuvlari yo\'q'}
                </div>
              )}
              {(health.vaccinations ?? []).map(v => (
                <VaxRow key={v.id} v={v} onDelete={removeVaccination} />
              ))}
              {addVax && (
                <div style={{ marginTop: (health.vaccinations ?? []).length > 0 ? 12 : 0, display: 'flex', flexDirection: 'column', gap: 10, borderTop: (health.vaccinations ?? []).length > 0 ? '1px solid var(--border)' : 'none', paddingTop: (health.vaccinations ?? []).length > 0 ? 12 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {isRu ? 'Новая вакцина' : 'Yangi emlash'}
                  </div>

                  {/* Species-specific suggestions */}
                  {vaxSuggestions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {vaxSuggestions.map(s => (
                        <button
                          key={s}
                          onClick={() => setVaxDraft(d => ({ ...d, name: s }))}
                          style={{
                            padding: '4px 10px', borderRadius: 'var(--r-pill)',
                            border: `1.5px solid ${vaxDraft.name === s ? 'var(--primary)' : 'var(--border)'}`,
                            background: vaxDraft.name === s ? 'rgba(242,120,75,0.1)' : 'transparent',
                            color: vaxDraft.name === s ? 'var(--primary)' : 'var(--text-muted)',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all .12s',
                          }}
                        >{s}</button>
                      ))}
                    </div>
                  )}

                  <input
                    autoFocus
                    value={vaxDraft.name}
                    onChange={e => setVaxDraft(d => ({ ...d, name: e.target.value }))}
                    placeholder={isRu ? 'Название вакцины' : 'Emlash nomi'}
                    style={inp}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Дата' : 'Sana'}</div>
                      <input type="date" value={vaxDraft.date} onChange={e => setVaxDraft(d => ({ ...d, date: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Следующая' : 'Keyingisi'}</div>
                      <input type="date" value={vaxDraft.next_date} onChange={e => setVaxDraft(d => ({ ...d, next_date: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Серия (номер партии)' : 'Seriya raqami'}</div>
                      <input value={vaxDraft.batch} onChange={e => setVaxDraft(d => ({ ...d, batch: e.target.value }))} placeholder="A1234B" style={{ ...inp, fontFamily: 'monospace' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Клиника' : 'Klinika'}</div>
                      <input value={vaxDraft.clinic} onChange={e => setVaxDraft(d => ({ ...d, clinic: e.target.value }))} placeholder={isRu ? 'Название клиники' : 'Klinika nomi'} style={inp} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setAddVax(false); setVaxDraft({ name: '', date: '', next_date: '', batch: '', clinic: '' }) }}
                      style={{ flex: 1, padding: '10px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--border)', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}
                    >{isRu ? 'Отмена' : 'Bekor'}</button>
                    <button onClick={addVaccination} disabled={!vaxDraft.name.trim()}
                      style={{ flex: 2, padding: '10px', borderRadius: 'var(--r-pill)', background: vaxDraft.name.trim() ? 'var(--primary)' : 'var(--border)', color: vaxDraft.name.trim() ? '#fff' : 'var(--text-muted)', border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: vaxDraft.name.trim() ? 'pointer' : 'not-allowed', minHeight: 44 }}
                    >{isRu ? 'Сохранить' : 'Saqlash'}</button>
                  </div>
                </div>
              )}
            </Section>

            {/* ── Treatments ─────────────────────────────────────── */}
            <Section
              title={isRu ? 'Обработки' : 'Davolanishlar'}
              action={
                !addTreat ? (
                  <button
                    onClick={() => setAddTreat(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: 0 }}
                  >
                    <IconPlus size={14} />
                    {isRu ? 'Добавить' : 'Qo\'shish'}
                  </button>
                ) : null
              }
            >
              {(health.treatments ?? []).length === 0 && !addTreat && (
                <div style={{ textAlign: 'center', padding: '10px 0 2px', color: 'var(--text-muted)', fontSize: 13 }}>
                  {isRu ? 'Нет записей' : 'Yozuvlar yo\'q'}
                </div>
              )}
              {(health.treatments ?? []).map(v => (
                <TreatRow key={v.id} v={v} onDelete={removeTreatment} />
              ))}
              {addTreat && (
                <div style={{ marginTop: (health.treatments ?? []).length > 0 ? 12 : 0, display: 'flex', flexDirection: 'column', gap: 10, borderTop: (health.treatments ?? []).length > 0 ? '1px solid var(--border)' : 'none', paddingTop: (health.treatments ?? []).length > 0 ? 12 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {isRu ? 'Новая запись' : 'Yangi yozuv'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {TREAT_TYPES.map(tp => (
                      <button
                        key={tp}
                        onClick={() => setTreatDraft(d => ({ ...d, type: tp }))}
                        style={{
                          padding: '4px 10px', borderRadius: 'var(--r-pill)',
                          border: `1.5px solid ${treatDraft.type === tp ? 'var(--primary)' : 'var(--border)'}`,
                          background: treatDraft.type === tp ? 'rgba(242,120,75,0.1)' : 'transparent',
                          color: treatDraft.type === tp ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
                        }}
                      >{tp}</button>
                    ))}
                  </div>
                  <input
                    value={treatDraft.drug}
                    onChange={e => setTreatDraft(d => ({ ...d, drug: e.target.value }))}
                    placeholder={isRu ? 'Препарат (Бравекто, Мильбемакс...)' : 'Dori nomi'}
                    style={inp}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Дата' : 'Sana'}</div>
                      <input type="date" value={treatDraft.date} onChange={e => setTreatDraft(d => ({ ...d, date: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{isRu ? 'Следующая' : 'Keyingisi'}</div>
                      <input type="date" value={treatDraft.next_date} onChange={e => setTreatDraft(d => ({ ...d, next_date: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setAddTreat(false); setTreatDraft({ type: TREAT_TYPES[0], date: '', next_date: '', drug: '' }) }}
                      style={{ flex: 1, padding: '10px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--border)', background: 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}
                    >{isRu ? 'Отмена' : 'Bekor'}</button>
                    <button onClick={addTreatment}
                      style={{ flex: 2, padding: '10px', borderRadius: 'var(--r-pill)', background: 'var(--primary)', color: '#fff', border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}
                    >{isRu ? 'Сохранить' : 'Saqlash'}</button>
                  </div>
                </div>
              )}
            </Section>

            {/* Notes */}
            <Section title={isRu ? 'Заметки врача' : 'Shifokor izohlari'}>
              <p style={{ margin: 0, fontSize: 14, color: health.notes ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.6 }}>
                {health.notes || (isRu ? 'Не указано' : 'Ko\'rsatilmagan')}
              </p>
            </Section>

            {/* ── Health event timeline (API-backed) ─────────────── */}
            <HealthTimeline pet={pet} onAskVet={onAskVet} onWeightLogged={kg => setLocalWeight(kg)} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / 86400000)
}
