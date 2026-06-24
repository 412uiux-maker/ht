import { useState } from 'react'
import type { AdminRole } from '../types'

type UserRole = 'owner' | 'vendor' | 'admin' | 'moderator' | 'support'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  registered: string
  lastSeen: string
  ordersCount: number
  blocked: boolean
}

const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'Владелец питомца',
  vendor: 'Вендор',
  admin: 'Администратор',
  moderator: 'Модератор',
  support: 'Поддержка',
}
const ROLE_CHIP: Record<UserRole, string> = {
  owner: 'chip-muted',
  vendor: 'chip-warn',
  admin: 'chip-danger',
  moderator: 'chip-info',
  support: 'chip-success',
}

const SEED: User[] = [
  { id: 'U001', name: 'Баходир Турсунов', email: 'baxodir@mail.uz', phone: '+998 90 111 22 33', role: 'owner', registered: '2026-03-14', lastSeen: '2026-06-24', ordersCount: 5, blocked: false },
  { id: 'U002', name: 'Азиз Каримов', email: 'aziz@vetcity.uz', phone: '+998 93 222 33 44', role: 'vendor', registered: '2026-02-01', lastSeen: '2026-06-23', ordersCount: 0, blocked: false },
  { id: 'U003', name: 'Малика Юсупова', email: 'malika@vetcity.uz', phone: '+998 94 333 44 55', role: 'vendor', registered: '2026-04-10', lastSeen: '2026-06-22', ordersCount: 0, blocked: false },
  { id: 'U004', name: 'Дилноза Хашимова', email: 'dilnoza@mail.uz', phone: '+998 91 444 55 66', role: 'owner', registered: '2026-05-05', lastSeen: '2026-06-20', ordersCount: 2, blocked: false },
  { id: 'U005', name: 'Алишер Рустамов', email: 'alisher@admin.uz', phone: '+998 97 555 66 77', role: 'moderator', registered: '2026-01-15', lastSeen: '2026-06-24', ordersCount: 0, blocked: false },
  { id: 'U006', name: 'Гулнора Набиева', email: 'gulnora@mail.uz', phone: '+998 98 666 77 88', role: 'owner', registered: '2026-06-01', lastSeen: '2026-06-18', ordersCount: 1, blocked: true },
  { id: 'U007', name: 'Жамшид Рашидов', email: 'jamshid@zooplus.uz', phone: '+998 99 777 88 99', role: 'vendor', registered: '2026-03-20', lastSeen: '2026-06-21', ordersCount: 0, blocked: false },
]

const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: '2-digit' })

export default function Users({ sessionRole }: { sessionRole: AdminRole }) {
  const [users, setUsers] = useState<User[]>(SEED)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<UserRole>('owner')
  const [saving, setSaving] = useState(false)

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q)
  })

  const openEdit = (u: User) => { setEditTarget(u); setEditRole(u.role) }
  const closeEdit = () => { setEditTarget(null) }

  const saveRole = async () => {
    if (!editTarget) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    setUsers(prev => prev.map(u => u.id === editTarget.id ? { ...u, role: editRole } : u))
    setSaving(false); closeEdit()
  }

  const toggleBlock = (u: User) => {
    setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, blocked: !usr.blocked } : usr))
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
            {r === 'all' ? 'Все' : ROLE_LABEL[r as UserRole]}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Всего', value: users.length, color: 'var(--text)' },
          { label: 'Владельцы', value: users.filter(u => u.role === 'owner').length, color: 'var(--text-muted)' },
          { label: 'Вендоры', value: users.filter(u => u.role === 'vendor').length, color: '#F59E0B' },
          { label: 'Заблокированы', value: users.filter(u => u.blocked).length, color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 && (
          <div className="empty">
            <div className="empty-icon">👤</div>
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
                <th>Был</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ opacity: u.blocked ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>
                    <div style={{ fontSize: 13 }}>{u.email}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.phone}</div>
                  </td>
                  <td>
                    <span className={`chip ${ROLE_CHIP[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
                    {u.ordersCount > 0 ? u.ordersCount : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(u.registered)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtDate(u.lastSeen)}</td>
                  <td>
                    <span className={u.blocked ? 'chip chip-danger' : 'chip chip-success'}>
                      {u.blocked ? 'Заблокирован' : 'Активен'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {canEditRoles && (
                        <button className="btn btn-sm btn-ghost" onClick={() => openEdit(u)}>Роль</button>
                      )}
                      <button
                        className={`btn btn-sm ${u.blocked ? 'btn-success' : 'btn-ghost'}`}
                        onClick={() => toggleBlock(u)}
                        style={{ minWidth: 88 }}
                      >
                        {u.blocked ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Role edit modal */}
      {editTarget && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !saving && closeEdit()}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Изменить роль</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{editTarget.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {(['owner', 'vendor', 'moderator', 'support', 'admin'] as UserRole[]).map(r => (
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
