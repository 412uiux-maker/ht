import { useState, useEffect, useMemo } from 'react'
import { IconSearch, IconPaw } from '@ht/shared'
import { api } from '../api'
import type { VendorClient } from '../types'

const SPECIES_EMOJI: Record<string, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', parrot: '🦜', hamster: '🐹', fish: '🐟', other: '🐾',
}

function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Clients() {
  const [clients, setClients] = useState<VendorClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    api.clients()
      .then(data => { setClients(data); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return clients
    return clients.filter(c =>
      c.client_name.toLowerCase().includes(q) ||
      c.pet_name.toLowerCase().includes(q)
    )
  }, [clients, query])

  const toggleExpand = (key: string) =>
    setExpanded(prev => (prev === key ? null : key))

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Клиенты</h1>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', display: 'flex',
        }}>
          <IconSearch size={16} color="var(--text3)" />
        </span>
        <input
          type="text"
          placeholder="Поиск по клиенту или питомцу…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            borderRadius: 'var(--r-sm)', border: '1px solid var(--surface3)',
            background: 'var(--surface2)', color: 'var(--text)',
            fontSize: 14, fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {loading && (
        <div style={{ color: 'var(--text2)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
          Загрузка…
        </div>
      )}

      {error && !loading && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--r-sm)',
          background: 'rgba(239,68,68,.1)', color: 'var(--danger)',
          fontSize: 14, marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '60px 0', gap: 12,
        }}>
          <IconPaw size={40} color="var(--text3)" />
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>
            {query ? 'Ничего не найдено' : 'Консультации ещё не проводились'}
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(client => {
            const key = `${client.client_name}__${client.pet_name}`
            const isOpen = expanded === key
            return (
              <div
                key={key}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--surface3)',
                  borderRadius: 'var(--r-md)', overflow: 'hidden',
                  transition: 'box-shadow .15s',
                }}
              >
                {/* Row */}
                <button
                  onClick={() => toggleExpand(key)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    fontFamily: 'inherit',
                  }}
                >
                  {/* Pet avatar */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--r-sm)', flexShrink: 0,
                    background: 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>
                    {SPECIES_EMOJI[client.pet_species] ?? '🐾'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', lineHeight: 1.3 }}>
                      {client.client_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                      {client.pet_name} · {client.pet_species}
                    </div>
                  </div>

                  {/* Meta */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {fmtDate(client.last_visit)}
                    </div>
                    <div style={{
                      marginTop: 3, fontSize: 11, fontWeight: 600,
                      color: 'var(--coral)', background: 'rgba(242,120,75,.1)',
                      borderRadius: 999, padding: '1px 8px', display: 'inline-block',
                    }}>
                      {client.consult_count} {pluralConsult(client.consult_count)}
                    </div>
                  </div>

                  {/* Chevron */}
                  <span style={{
                    flexShrink: 0, fontSize: 12, color: 'var(--text3)',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform .15s',
                    marginLeft: 4,
                  }}>▾</span>
                </button>

                {/* Expanded: last summary */}
                {isOpen && (
                  <div style={{
                    padding: '0 16px 14px',
                    borderTop: '1px solid var(--surface3)',
                    paddingTop: 12,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>
                      Последнее заключение
                    </div>
                    {client.last_summary ? (
                      <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                        {client.last_summary}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic' }}>
                        Без заключения
                      </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text3)' }}>
                      Последний визит: {fmtDate(client.last_visit)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function pluralConsult(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return 'консультация'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'консультации'
  return 'консультаций'
}
