import { useState } from 'react'

type SettingsTab = 'commissions' | 'payments' | 'notifications'

interface CommissionRule {
  id: string
  label: string
  description: string
  value: number
  unit: 'percent' | 'fixed'
}

interface PaymentProvider {
  id: string
  name: string
  logo: string
  enabled: boolean
  testMode: boolean
  connected: boolean
}

interface NotificationTemplate {
  id: string
  event: string
  channel: 'sms' | 'push' | 'email'
  template: string
  enabled: boolean
}

const DEFAULT_COMMISSIONS: CommissionRule[] = [
  { id: 'c1', label: 'Консультация ветеринара', description: 'Комиссия платформы с каждой оплаченной консультации', value: 15, unit: 'percent' },
  { id: 'c2', label: 'Страховой полис', description: 'Комиссия с продажи страховки', value: 10, unit: 'percent' },
  { id: 'c3', label: 'Минимальный вывод', description: 'Минимальная сумма для запроса выплаты', value: 50000, unit: 'fixed' },
]

const DEFAULT_PROVIDERS: PaymentProvider[] = [
  { id: 'click',   name: 'Click',    logo: '💳', enabled: true,  testMode: false, connected: true  },
  { id: 'payme',   name: 'Payme',    logo: '💳', enabled: true,  testMode: false, connected: true  },
  { id: 'uzumpay', name: 'Uzum Pay', logo: '💳', enabled: false, testMode: false, connected: false },
]

const DEFAULT_NOTIFS: NotificationTemplate[] = [
  { id: 'n1', event: 'Консультация оплачена', channel: 'push', template: 'Ваша консультация с {vet_name} оплачена. Ожидайте ответа.', enabled: true },
  { id: 'n2', event: 'Консультация принята', channel: 'push', template: 'Ветеринар {vet_name} принял вашу консультацию.', enabled: true },
  { id: 'n3', event: 'Консультация завершена', channel: 'push', template: 'Консультация завершена. Оцените врача!', enabled: true },
  { id: 'n4', event: 'Новое сообщение в чате', channel: 'push', template: '{vet_name}: {message_preview}', enabled: true },
  { id: 'n5', event: 'Страховой полис выдан', channel: 'email', template: 'Ваш страховой полис #{policy_id} готов. Ссылка: {policy_url}', enabled: true },
  { id: 'n6', event: 'Выплата одобрена', channel: 'push', template: 'Ваша выплата {amount} сум одобрена. Поступит в течение 24 часов.', enabled: true },
]

const CHANNEL_LABEL = { sms: 'SMS', push: 'Push', email: 'Email' }
const CHANNEL_COLOR = { sms: '#2E7D32', push: '#1565C0', email: '#C62828' }

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('commissions')
  const [commissions, setCommissions] = useState<CommissionRule[]>(DEFAULT_COMMISSIONS)
  const [providers, setProviders] = useState<PaymentProvider[]>(DEFAULT_PROVIDERS)
  const [notifs, setNotifs] = useState<NotificationTemplate[]>(DEFAULT_NOTIFS)
  const [editComm, setEditComm] = useState<CommissionRule | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const showSaved = (msg = 'Сохранено') => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 2500)
  }

  const saveComm = async () => {
    if (!editComm) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 400))
    setCommissions(prev => prev.map(c => c.id === editComm.id ? { ...c, value: Number(editValue) } : c))
    setSaving(false); setEditComm(null); showSaved()
  }

  const toggleProvider = (id: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p))
    showSaved('Настройки сохранены')
  }

  const toggleTestMode = (id: string) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, testMode: !p.testMode } : p))
    showSaved('Режим изменён')
  }

  const toggleNotif = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n))
    showSaved('Уведомление обновлено')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Настройки</div>
        {savedMsg && (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', background: 'var(--success)22', padding: '6px 12px', borderRadius: 'var(--r-pill)' }}>
            ✓ {savedMsg}
          </span>
        )}
      </div>

      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        <button className={`filter-tab${tab === 'commissions' ? ' active' : ''}`} onClick={() => setTab('commissions')}>Комиссии</button>
        <button className={`filter-tab${tab === 'payments' ? ' active' : ''}`} onClick={() => setTab('payments')}>Платёжные системы</button>
        <button className={`filter-tab${tab === 'notifications' ? ' active' : ''}`} onClick={() => setTab('notifications')}>Уведомления</button>
      </div>

      {/* Commissions */}
      {tab === 'commissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {commissions.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{c.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontWeight: 800, fontSize: 22, color: 'var(--primary)',
                  minWidth: 80, textAlign: 'right',
                }}>
                  {c.unit === 'percent' ? `${c.value}%` : `${c.value.toLocaleString('ru-RU')} сум`}
                </div>
                <button className="btn btn-sm btn-ghost" onClick={() => { setEditComm(c); setEditValue(String(c.value)) }}>
                  ✏️ Изменить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payments */}
      {tab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {providers.map(p => (
            <div key={p.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: p.connected ? 12 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>{p.logo}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <span className={p.connected ? 'chip chip-success' : 'chip chip-muted'} style={{ fontSize: 11 }}>
                      {p.connected ? 'Подключён' : 'Не подключён'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.enabled ? 'Включён' : 'Выключен'}</span>
                  <ToggleSwitch checked={p.enabled} onChange={() => toggleProvider(p.id)} />
                </div>
              </div>
              {p.connected && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Тестовый режим</span>
                    {p.testMode && <span className="chip chip-warn" style={{ marginLeft: 8, fontSize: 11 }}>Тест</span>}
                  </div>
                  <ToggleSwitch checked={p.testMode} onChange={() => toggleTestMode(p.id)} />
                </div>
              )}
              {!p.connected && (
                <div style={{ marginTop: 10 }}>
                  <button className="btn btn-primary btn-sm">Подключить {p.name}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifs.map(n => (
            <div key={n.id} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{n.event}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-pill)',
                      background: CHANNEL_COLOR[n.channel] + '22', color: CHANNEL_COLOR[n.channel],
                    }}>
                      {CHANNEL_LABEL[n.channel]}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
                    background: 'var(--surface-2)', borderRadius: 'var(--r-md)',
                    padding: '8px 10px', fontFamily: 'monospace',
                  }}>
                    {n.template}
                  </div>
                </div>
                <ToggleSwitch checked={n.enabled} onChange={() => toggleNotif(n.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commission edit modal */}
      {editComm && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !saving && setEditComm(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Изменить комиссию</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{editComm.label}</div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Значение {editComm.unit === 'percent' ? '(%)' : '(сум)'}
              </div>
              <input
                type="number"
                min={0}
                max={editComm.unit === 'percent' ? 100 : undefined}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{ ...inputStyle, width: '100%' }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" disabled={saving} onClick={() => setEditComm(null)}>Отмена</button>
              <button className="btn btn-primary" disabled={saving || !editValue} onClick={saveComm}>
                {saving ? '…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: 42, height: 24, borderRadius: 'var(--r-pill)',
        background: checked ? 'var(--primary)' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, width: 18, height: 18,
        borderRadius: '50%', background: '#fff',
        left: checked ? 21 : 3,
        transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </button>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)', fontSize: 14, minHeight: 44,
  background: 'var(--surface)', fontFamily: 'inherit',
}
