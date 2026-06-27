import { useState, useEffect } from 'react'
import { IconCheck, IconEdit } from '@ht/shared'
import type { PlatformSettings } from '../types'
import { adminApi } from '../api'

type SettingsTab = 'commissions' | 'payments' | 'notifications'

interface CommissionRule {
  key: string
  label: string
  description: string
  unit: 'percent' | 'fixed'
}

const COMMISSION_RULES: CommissionRule[] = [
  { key: 'commission_vet_consult', label: 'Консультация ветеринара', description: 'Комиссия платформы с каждой оплаченной консультации', unit: 'percent' },
  { key: 'commission_insurance',   label: 'Страховой полис',         description: 'Комиссия с продажи страховки',                         unit: 'percent' },
  { key: 'min_payout_uzs',         label: 'Минимальный вывод',       description: 'Минимальная сумма для запроса выплаты',                unit: 'fixed'   },
]

const PAYMENT_PROVIDERS = [
  { key: 'payment_click_enabled', name: 'Click',    logo: '💳' },
  { key: 'payment_payme_enabled', name: 'Payme',    logo: '💳' },
  { key: 'payment_uzum_enabled',  name: 'Uzum Pay', logo: '💳' },
]

interface NotificationTemplate {
  id: string
  event: string
  channel: 'push' | 'email'
  template: string
  enabled: boolean
}

const DEFAULT_NOTIFS: NotificationTemplate[] = [
  { id: 'n1', event: 'Консультация оплачена',   channel: 'push',  template: 'Ваша консультация с {vet_name} оплачена. Ожидайте ответа.', enabled: true },
  { id: 'n2', event: 'Консультация принята',    channel: 'push',  template: 'Ветеринар {vet_name} принял вашу консультацию.',            enabled: true },
  { id: 'n3', event: 'Консультация завершена',  channel: 'push',  template: 'Консультация завершена. Оцените врача!',                    enabled: true },
  { id: 'n4', event: 'Новое сообщение в чате',  channel: 'push',  template: '{vet_name}: {message_preview}',                            enabled: true },
  { id: 'n5', event: 'Страховой полис выдан',   channel: 'email', template: 'Ваш страховой полис #{policy_id} готов.',                  enabled: true },
  { id: 'n6', event: 'Выплата одобрена',        channel: 'push',  template: 'Ваша выплата {amount} сум одобрена.',                      enabled: true },
]

const CHANNEL_COLOR = { push: '#1565C0', email: '#C62828' }
const CHANNEL_LABEL = { push: 'Push', email: 'Email' }

export default function Settings() {
  const [tab, setTab]         = useState<SettingsTab>('commissions')
  const [settings, setSettings] = useState<PlatformSettings>({})
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving]   = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [notifs, setNotifs]   = useState<NotificationTemplate[]>(DEFAULT_NOTIFS)

  useEffect(() => {
    setLoading(true)
    adminApi.getSettings()
      .then(s => { setSettings(s); setError('') })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const showSaved = (msg = 'Сохранено') => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 2500)
  }

  const saveComm = async () => {
    if (!editKey) return
    setSaving(true)
    try {
      await adminApi.updateSetting(editKey, editValue)
      setSettings(s => ({ ...s, [editKey]: editValue }))
      setEditKey(null); showSaved()
    } catch (e) { alert(e instanceof Error ? e.message : 'Ошибка') }
    finally { setSaving(false) }
  }

  const toggleProvider = async (key: string) => {
    const next = settings[key] === 'true' ? 'false' : 'true'
    setSettings(s => ({ ...s, [key]: next }))
    try {
      await adminApi.updateSetting(key, next)
      showSaved('Настройки сохранены')
    } catch (e) {
      setSettings(s => ({ ...s, [key]: next === 'true' ? 'false' : 'true' }))
      alert(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  const toggleNotif = (id: string) => {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n))
    showSaved('Уведомление обновлено')
  }

  const commValue = (key: string) => {
    const raw = settings[key]
    return raw !== undefined ? Number(raw) : null
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>Настройки</div>
        {savedMsg && (
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', background: 'var(--success)22', padding: '6px 12px', borderRadius: 'var(--r-pill)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <IconCheck size={14} /> {savedMsg}
          </span>
        )}
      </div>

      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        <button className={`filter-tab${tab === 'commissions' ? ' active' : ''}`} onClick={() => setTab('commissions')}>Комиссии</button>
        <button className={`filter-tab${tab === 'payments' ? ' active' : ''}`} onClick={() => setTab('payments')}>Платёжные системы</button>
        <button className={`filter-tab${tab === 'notifications' ? ' active' : ''}`} onClick={() => setTab('notifications')}>Уведомления</button>
      </div>

      {loading && <div className="loading">Загрузка…</div>}
      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Commissions */}
      {tab === 'commissions' && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {COMMISSION_RULES.map(c => {
            const val = commValue(c.key)
            return (
              <div key={c.key} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--primary)', minWidth: 90, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {val !== null
                      ? c.unit === 'percent' ? `${val}%` : `${val.toLocaleString('ru-RU')} сум`
                      : '…'}
                  </div>
                  <button className="btn btn-sm btn-ghost" onClick={() => { setEditKey(c.key); setEditValue(val !== null ? String(val) : '') }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconEdit size={14} /> Изменить
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Payments */}
      {tab === 'payments' && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PAYMENT_PROVIDERS.map(p => {
            const enabled = settings[p.key] === 'true'
            return (
              <div key={p.key} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>{p.logo}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <span className={enabled ? 'chip chip-success' : 'chip chip-muted'} style={{ fontSize: 11 }}>
                      {enabled ? 'Включён' : 'Выключен'}
                    </span>
                  </div>
                </div>
                <ToggleSwitch checked={enabled} onChange={() => toggleProvider(p.key)} />
              </div>
            )
          })}
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifs.map(n => (
            <div key={n.id} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
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
      {editKey && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !saving && setEditKey(null)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Изменить настройку</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {COMMISSION_RULES.find(c => c.key === editKey)?.label}
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Значение {COMMISSION_RULES.find(c => c.key === editKey)?.unit === 'percent' ? '(%)' : '(сум)'}
              </div>
              <input
                type="number" min={0}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 14, minHeight: 44, fontFamily: 'inherit' }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" disabled={saving} onClick={() => setEditKey(null)}>Отмена</button>
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
