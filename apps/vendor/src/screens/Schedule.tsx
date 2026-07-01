import { useEffect, useState, useCallback } from 'react'
import { IconCalendar, IconArrowLeft, IconArrowRight, IconCheck, IconClock } from '@ht/shared'
import type { VendorSlot } from '../types'
import { api } from '../api'

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// ── Date helpers ──────────────────────────────────────────────────────────────

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

function toWeekKey(d: Date): string { return d.toISOString().slice(0, 10) }

function slotISO(day: Date, hour: number): string {
  const d = new Date(day)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function isToday(d: Date): boolean {
  return d.toDateString() === new Date().toDateString()
}

function isPast(day: Date, hour: number): boolean {
  const slot = new Date(day)
  slot.setHours(hour, 0, 0, 0)
  return slot < new Date()
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Schedule() {
  const [monday, setMonday]     = useState<Date>(() => getMondayOf(new Date()))
  const [slots, setSlots]       = useState<VendorSlot[]>([])
  const [loading, setLoading]   = useState(true)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [error, setError]       = useState('')

  const isCurrentWeek = getMondayOf(new Date()).toDateString() === monday.toDateString()

  const loadSlots = useCallback((mon: Date) => {
    setLoading(true)
    api.slots(toWeekKey(mon))
      .then(rows => { setSlots(rows); setError('') })
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadSlots(monday) }, [monday, loadSlots])

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  const slotMap = new Map<string, VendorSlot>()
  for (const s of slots) slotMap.set(s.slot_at, s)

  // ── Single-cell toggle ────────────────────────────────────────────────────
  const toggle = async (day: Date, hour: number) => {
    if (isPast(day, hour)) return
    const iso = slotISO(day, hour)
    if (slotMap.get(iso)?.is_booked) return
    setToggling(prev => new Set(prev).add(iso))
    try {
      const res = await api.toggleSlot(iso)
      if (res.action === 'added') {
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

  // ── Bulk helpers ──────────────────────────────────────────────────────────
  const bulkOpen = async (dayIndexes: number[]) => {
    const targets: string[] = []
    for (const di of dayIndexes) {
      for (const hour of HOURS) {
        const iso = slotISO(days[di], hour)
        if (!isPast(days[di], hour) && !slotMap.has(iso)) targets.push(iso)
      }
    }
    if (!targets.length) return
    setBulkBusy(true)
    try {
      const results = await Promise.all(targets.map(iso => api.toggleSlot(iso)))
      setSlots(prev => {
        const next = [...prev]
        results.forEach((r, i) => {
          if (r.action === 'added') {
            next.push({ id: 0, vet_id: 0, slot_at: targets[i], is_booked: false, order_id: null })
          }
        })
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBulkBusy(false)
    }
  }

  const bulkClear = async () => {
    const targets = slots.filter(s => !s.is_booked).map(s => s.slot_at)
    if (!targets.length) return
    setBulkBusy(true)
    try {
      await Promise.all(targets.map(iso => api.toggleSlot(iso)))
      setSlots(prev => prev.filter(s => s.is_booked))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBulkBusy(false)
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const openCount   = slots.filter(s => !s.is_booked).length
  const bookedCount = slots.filter(s => s.is_booked).length
  const weekLabel   = `${fmtShort(monday)} — ${fmtShort(addDays(monday, 6))}`

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconCalendar size={22} color="var(--coral)" />
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Расписание</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isCurrentWeek && (
            <button
              onClick={() => setMonday(getMondayOf(new Date()))}
              style={chipBtn}
            >
              Сегодня
            </button>
          )}
          <button onClick={() => setMonday(d => addDays(d, -7))} style={navBtn}>
            <IconArrowLeft size={15} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 148, textAlign: 'center' }}>
            {weekLabel}
          </span>
          <button onClick={() => setMonday(d => addDays(d, 7))} style={navBtn}>
            <IconArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Stats cards ───────────────────────────────────────── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Открытых слотов',  value: openCount,   color: 'var(--coral)',   bg: 'rgba(242,120,75,.08)' },
            { label: 'Забронировано',     value: bookedCount, color: 'var(--green)',   bg: 'rgba(76,175,125,.08)' },
            { label: 'Итого на неделю',   value: openCount + bookedCount, color: 'var(--text)', bg: 'var(--surface2)' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: 'var(--r-sm)',
              border: '1px solid var(--surface3)',
              padding: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bulk actions ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={() => bulkOpen([0, 1, 2, 3, 4])}
          disabled={bulkBusy || loading}
          style={bulkBtn}
        >
          📅 Открыть Пн–Пт
        </button>
        <button
          onClick={() => bulkOpen([0, 1, 2, 3, 4, 5, 6])}
          disabled={bulkBusy || loading}
          style={bulkBtn}
        >
          📆 Всю неделю
        </button>
        <button
          onClick={bulkClear}
          disabled={bulkBusy || loading || openCount === 0}
          style={{ ...bulkBtn, color: 'var(--danger)', borderColor: 'rgba(220,38,38,.2)' }}
        >
          🗑 Очистить
        </button>
        {bulkBusy && (
          <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>Применяю…</span>
        )}
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.18)',
          borderRadius: 'var(--r-sm)', padding: '10px 14px',
          color: '#DC2626', fontSize: 13, marginBottom: 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* ── Legend ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { bg: 'rgba(242,120,75,.18)', border: '1.5px solid rgba(242,120,75,.5)', label: 'Открыт' },
          { bg: 'var(--surface2)',       border: '1px dashed var(--surface3)',       label: 'Нет слота' },
          { bg: 'rgba(76,175,125,.18)', border: '1px solid var(--green)',            label: 'Забронирован' },
          { bg: 'var(--surface3)',       border: '1px solid transparent',            label: 'Прошедший' },
        ].map(({ bg, border, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text2)' }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: bg, border, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>

      {/* ── Grid ──────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text2)', fontSize: 14 }}>
          Загрузка расписания…
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--r-md)', border: '1px solid var(--surface3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface3)' }}>
                <th style={{
                  width: 48, padding: '10px 8px', fontSize: 11,
                  color: 'var(--text3)', textAlign: 'center', fontWeight: 500,
                  background: 'var(--surface2)',
                }}>
                  <IconClock size={13} color="var(--text3)" />
                </th>
                {days.map((d, i) => (
                  <th key={i} style={{
                    padding: '8px 6px', fontSize: 12, fontWeight: 700, textAlign: 'center',
                    color: isToday(d) ? 'var(--coral)' : 'var(--text2)',
                    background: isToday(d) ? 'rgba(242,120,75,.05)' : 'var(--surface2)',
                    minWidth: 68,
                  }}>
                    <div>{DAY_LABELS[i]}</div>
                    <div style={{ fontWeight: 500, fontSize: 11, marginTop: 1, color: isToday(d) ? 'var(--coral)' : 'var(--text3)' }}>
                      {fmtShort(d)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour, hi) => (
                <tr key={hour} style={{ borderBottom: hi < HOURS.length - 1 ? '1px solid var(--surface3)' : 'none' }}>
                  <td style={{
                    padding: '0 6px', fontSize: 11, color: 'var(--text3)', fontWeight: 600,
                    textAlign: 'center', whiteSpace: 'nowrap', background: 'var(--surface2)',
                    borderRight: '1px solid var(--surface3)',
                  }}>
                    {hour}:00
                  </td>
                  {days.map((day, di) => {
                    const iso    = slotISO(day, hour)
                    const slot   = slotMap.get(iso)
                    const past   = isPast(day, hour)
                    const booked = slot?.is_booked
                    const open   = !!slot && !booked
                    const busy   = toggling.has(iso)
                    const todayCol = isToday(day)

                    let bg     = todayCol ? 'rgba(242,120,75,.03)' : 'transparent'
                    let border = 'none'
                    let cursor = 'pointer'

                    if (past)   { bg = 'var(--surface3)'; cursor = 'default' }
                    if (open)   { bg = 'rgba(242,120,75,.15)' }
                    if (booked) { bg = 'rgba(76,175,125,.15)'; cursor = 'default' }

                    return (
                      <td key={di} style={{
                        padding: 0,
                        background: bg,
                        borderLeft: di > 0 ? '1px solid var(--surface3)' : 'none',
                        transition: 'background .1s',
                      }}>
                        <button
                          onClick={() => toggle(day, hour)}
                          disabled={past || !!booked || busy}
                          title={
                            booked ? 'Забронирован клиентом' :
                            past   ? 'Прошедший слот' :
                            open   ? 'Закрыть слот' :
                            'Открыть слот'
                          }
                          style={{
                            width: '100%', height: 40,
                            background: 'none', border,
                            cursor, opacity: busy ? 0.4 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'opacity .1s',
                            fontSize: 13,
                          }}
                        >
                          {booked && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                              <IconCheck size={13} color="var(--green)" />
                              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.02em' }}>занято</span>
                            </div>
                          )}
                          {open && !busy && (
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--coral)', display: 'block' }} />
                          )}
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

      {/* ── Booked list ───────────────────────────────────────── */}
      {!loading && bookedCount > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Записи на этой неделе
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slots
              .filter(s => s.is_booked)
              .sort((a, b) => a.slot_at.localeCompare(b.slot_at))
              .map(s => {
                const d = new Date(s.slot_at)
                return (
                  <div key={s.slot_at} style={{
                    background: 'var(--surface)', border: '1px solid var(--surface3)',
                    borderRadius: 'var(--r-sm)', padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r-sm)', flexShrink: 0,
                      background: 'rgba(76,175,125,.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      📋
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                        {d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                        {d.getHours()}:00 — {d.getHours() + 1}:00
                        {s.order_id && <span style={{ marginLeft: 8, color: 'var(--text3)', fontFamily: 'monospace' }}>#{s.order_id.slice(0, 8)}</span>}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 9px',
                      borderRadius: 'var(--r-pill)',
                      background: 'rgba(76,175,125,.12)', color: 'var(--green)',
                    }}>Занято</span>
                  </div>
                )
              })
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const navBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text2)', flexShrink: 0,
}

const chipBtn: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 'var(--r-pill)',
  border: '1px solid var(--coral)', background: 'rgba(242,120,75,.1)',
  color: 'var(--coral)', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
}

const bulkBtn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'var(--surface2)',
  color: 'var(--text)', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', gap: 6,
}
