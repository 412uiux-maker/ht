import { useState, useEffect } from 'react'
import { IconUser } from '@ht/shared'
import { adminApi } from '../api'
import type { AdminRole, AppUser, AppUserRole } from '../types'

const ROLE_LABEL: Record<AppUserRole, string> = {
  owner:     'Владелец питомца',
  vendor:    'Вендор',
  admin:     'Администратор',
  moderator: 'Модератор',
  support:   'Поддержка',
}
const ROLE_CHIP: Record<AppUserRole, string> = {
  owner:     'chip-muted',
  vendor:    'chip-warning',
  admin:     'chip-danger',
  moderator: 'chip-blue',
  support:   'chip-success',
}

const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: '2-digit' })

export default function Users({ sessionRole }: { sessionRole: AdminRole }) {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<AppUserRole | 'all'>('all')
  const [editTarget, setEditTarget] = useState<AppUser | null>(null)
  const [editRole, setEditRole] = useState<AppUserRole>('moderator')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    adminApi.getUsers()
      .then(d => { setUsers(d.users); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(search)
  })

  const openEdit = (u: AppUser) => { setEditTarget(u); setEditRole(u.role as AppUserRole) }
  const closeEdit = () => { setEditTarget(null) }

  const saveRole = async () => {
    if (!editTarget) return
    setSaving(true)
    try {
      await adminApi.changeUserRole(editTarget.id, editRole)
      setUsers(prev => prev.map(u => u.id === editTarget.id ? { ...u, role: editRole } : u))
      closeEdit()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const toggleBlock = async (u: AppUser) => {
    const newBlocked = !u.is_blocked
    setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, is_blocked: newBlocked } : usr))
    try {
      await adminApi.blockUser(u.id, newBlocked)
    } catch (e) {
      setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, is_blocked: u.is_blocked } : usr))
      alert((e as Error).message)
    }
  }

  const canEditRoles = sessionRole === 'admin'

  return (
    <div>
      <div className="page-title">Пользователи</div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по имени, email, телефону..."
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      <div className="filter-tabs" style={{ marginBottom: 16 }}>
        {(['all', 'owner', 'vendor', 'admin', 'moderator', 'support'] as const).map(r => (
          <button
            key={r}
            className={`filter-tab${roleFilter === r ? ' active' : ''}`}
            onClick={() => setRoleFilter(r)}
          >
            {r === 'all' ? 'Все' : ROLE_LABEL[r as AppUserRole]}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Всего',         value: users.length,                               color: 'var(--text)' },
          { label: 'Владельцы',     value: users.filter(u => u.role === 'owner').length,  color: 'var(--text-muted)' },
          { label: 'Вендоры',       value: users.filter(u => u.role === 'vendor').length, color: '#F59E0B' },
          { label: 'Заблокированы', value: users.filter(u => u.is_blocked).length,       color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
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

      {/* Table */}
      {!loading && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 && (
            <div className="empty">
              <div className="empty-icon"><IconUser size={40} color="var(--text-muted)" /></div>
              <div>Пользователи не найдены</div>
            </div>
          )}
          {filtered.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Контакт</th>
                  <th>Роль</th>
                  <th>Заказов</th>
                  <th>Рег.</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ opacity: u.is_blocked ? 0.6 : 1 }}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>
                      {u.email && <div style={{ fontSize: 13 }}>{u.email}</div>}
                      {u.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.phone}</div>}
                      {!u.email && !u.phone && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      <span className={`chip ${ROLE_CHIP[u.role as AppUserRole]}`}>{ROLE_LABEL[u.role as AppUserRole]}</span>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
                      {u.orders_count > 0 ? u.orders_count : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(u.created_at)}</td>
                    <td>
                      <span className={u.is_blocked ? 'chip chip-danger' : 'chip chip-success'}>
                        {u.is_blocked ? 'Заблокирован' : 'Активен'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {canEditRoles && ['admin', 'moderator', 'support'].includes(u.role) && (
                          <button className="btn btn-sm btn-ghost" onClick={() => openEdit(u)}>Роль</button>
                        )}
                        <button
                          className={`btn btn-sm ${u.is_blocked ? 'btn-success' : 'btn-ghost'}`}
                          onClick={() => toggleBlock(u)}
                          style={{ minWidth: 88 }}
                        >
                          {u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Role edit modal */}
      {editTarget && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !saving && closeEdit()}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Изменить роль</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{editTarget.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {(['moderator', 'support', 'admin'] as AppUserRole[]).map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, padding: '8px 10px', borderRadius: 'var(--r-md)', background: editRole === r ? 'var(--surface-2)' : 'transparent' }}>
                  <input type="radio" name="role" value={r} checked={editRole === r} onChange={() => setEditRole(r)} />
                  <span className={`chip ${ROLE_CHIP[r]}`}>{ROLE_LABEL[r]}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" disabled={saving} onClick={closeEdit}>Отмена</button>
              <button className="btn btn-primary" disabled={saving || editRole === editTarget.role} onClick={saveRole}>
                {saving ? '…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)', fontSize: 14, minHeight: 44,
  background: 'var(--surface)', fontFamily: 'inherit',
}
