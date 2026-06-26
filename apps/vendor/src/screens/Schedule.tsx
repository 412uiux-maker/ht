import { useEffect, useState, useCallback } from 'react'
import { IconCalendar, IconArrowLeft, IconArrowRight, IconCheck, IconClock } from '@ht/shared'
import type { VendorSlot } from '../types'
import { api } from '../api'

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17]
const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toWeekKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function slotISO(day: Date, hour: number): string {
  const d = new Date(day)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

function fmtDayLabel(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function isToday(d: Date): boolean {
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

function isPast(day: Date, hour: number): boolean {
  const slot = new Date(day)
  slot.setHours(hour, 0, 0, 0)
  return slot < new Date()
}

export default function Schedule() {
  const [monday, setMonday] = useState<Date>(() => getMondayOf(new Date()))
  const [slots, setSlots] = useState<VendorSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const loadSlots = useCallback((mon: Date) => {
    setLoading(true)
    api.slots(toWeekKey(mon))
      .then(rows => { setSlots(rows); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(() => { loadSlots(monday) }, [monday, loadSlots])

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  const slotMap = new Map<string, VendorSlot>()
  for (const s of slots) slotMap.set(s.slot_at, s)

  const weekLabel = () => {
    const end = addDays(monday, 6)
    return `${fmtDayLabel(monday)} — ${fmtDayLabel(end)}`
  }

  const prevWeek = () => setMonday(d => addDays(d, -7))
  const nextWeek = () => setMonday(d => addDays(d, 7))

  const toggle = async (day: Date, hour: number) => {
    if (isPast(day, hour)) return
    const iso = slotISO(day, hour)
    const existing = slotMap.get(iso)
    if (existing?.is_booked) return

    setToggling(prev => new Set(prev).add(iso))
    try {
      const result = await api.toggleSlot(iso)
      if (result.action === 'added') {
        setSlots(prev => [...prev, { id: 0, vet_id: 0, slot_at: iso, is_booked: false, order_id: null }])
      } else {
        setSlots(prev => prev.filter(s => s.slot_at !== iso))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(iso); return s })
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconCalendar size={22} color="var(--coral)" />
          <div className="page-title" style={{ marginBottom: 0 }}>Расписание</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevWeek} style={navBtn}><IconArrowLeft size={16} /></button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', minWidth: 170, textAlign: 'center' }}>
            {weekLabel()}
          </span>
          <button onClick={nextWeek} style={navBtn}><IconArrowRight size={16} /></button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 'var(--r-md)', padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { color: 'rgba(242,120,75,.18)', border: '1.5px solid rgba(242,120,75,.5)', label: 'Открыт' },
          { color: 'rgba(242,120,75,.07)', border: '1px dashed rgba(242,120,75,.3)', label: 'Нет слота' },
          { color: '#D1F2E4', border: '1px solid #3FA46B', label: 'Забронирован' },
          { color: 'var(--surface3)', border: '1px solid var(--surface3)', label: 'Прошедший' },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: color, border }} />
            {label}
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text2)' }}>Загрузка…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 3 }}>
            <thead>
              <tr>
                <th style={{ width: 52, padding: '6px 8px', fontSize: 12, color: 'var(--text3)', textAlign: 'left', fontWeight: 500 }}>
                  <IconClock size={14} />
                </th>
                {days.map((d, i) => (
                  <th key={i} style={{
                    padding: '6px 4px', fontSize: 12, fontWeight: 700, textAlign: 'center',
                    color: isToday(d) ? 'var(--coral)' : 'var(--text2)',
                    borderBottom: isToday(d) ? '2px solid var(--coral)' : 'none',
                    minWidth: 80,
                  }}>
                    <div>{DAY_LABELS[i]}</div>
                    <div style={{ fontWeight: 500, fontSize: 11, marginTop: 2 }}>{fmtDayLabel(d)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td style={{ padding: '3px 8px', fontSize: 12, color: 'var(--text3)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {hour}:00
                  </td>
                  {days.map((day, di) => {
                    const iso = slotISO(day, hour)
                    const slot = slotMap.get(iso)
                    const past    = isPast(day, hour)
                    const booked  = slot?.is_booked
                    const open    = !!slot && !booked
                    const isBusy  = toggling.has(iso)

                    let bg     = 'transparent'
                    let border = '1px dashed rgba(242,120,75,.25)'
                    let cursor = 'pointer'

                    if (past)   { bg = 'var(--surface3)'; border = '1px solid transparent'; cursor = 'default' }
                    if (booked) { bg = '#D1F2E4'; border = '1px solid #3FA46B'; cursor = 'default' }
                    if (open)   { bg = 'rgba(242,120,75,.18)'; border = '1.5px solid rgba(242,120,75,.55)' }

                    return (
                      <td key={di} style={{ padding: 2 }}>
                        <button
                          onClick={() => toggle(day, hour)}
                          disabled={past || !!booked || isBusy}
                          title={booked ? 'Забронирован' : past ? 'Прошедший' : open ? 'Кликните, чтобы закрыть' : 'Кликните, чтобы открыть'}
                          style={{
                            width: '100%', height: 36, borderRadius: 8, border, background: bg, cursor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all .12s', opacity: isBusy ? 0.5 : 1,
                            fontSize: 14,
                          }}
                        >
                          {booked ? <IconCheck size={14} color="#1A7A4A" /> : open ? <span style={{ color: 'var(--coral)', fontSize: 18, lineHeight: 1 }}>·</span> : null}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && (
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
          Открытых слотов на неделю: <strong style={{ color: 'var(--coral)' }}>{slots.filter(s => !s.is_booked).length}</strong>
          {slots.filter(s => s.is_booked).length > 0 && (
            <span> · Забронировано: <strong style={{ color: '#1A7A4A' }}>{slots.filter(s => s.is_booked).length}</strong></span>
          )}
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text2)',
}
