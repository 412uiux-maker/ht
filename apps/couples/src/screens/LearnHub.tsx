import { useEffect, useState } from 'react'
import type { LearnItem } from '../api'
import { api, getOwnerId } from '../api'
import { t } from '../i18n'
import Deeds from './Deeds'

type Filter = 'all' | 'checklist' | 'guide' | 'article'

const TYPE_META: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  checklist: { bg: '#DCFCE7', color: '#15803D', label: 'Чек-лист', icon: '✓' },
  guide:     { bg: '#DBEAFE', color: '#1D4ED8', label: 'Гайд',     icon: '📖' },
  article:   { bg: '#FEF3C7', color: '#92400E', label: 'Статья',   icon: '📄' },
}

export default function LearnHub({ lang }: { lang: string }) {
  const [tab, setTab] = useState<'learn' | 'deeds'>('learn')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
      {/* Sub-header */}
      <div style={{
        display: 'flex', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        {(['learn', 'deeds'] as const).map(key => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, padding: '14px 8px', border: 'none', background: 'transparent',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              color: tab === key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: `2px solid ${tab === key ? 'var(--primary)' : 'transparent'}`,
              marginBottom: -1, transition: 'color .15s',
            }}
          >
            {key === 'learn' ? `📚 ${t('learn.title')}` : `❤️ ${t('deeds.title')}`}
          </button>
        ))}
      </div>

      {tab === 'learn' && <LearnContent lang={lang} />}
      {tab === 'deeds' && <Deeds lang={lang} />}
    </div>
  )
}

function LearnContent({ lang }: { lang: string }) {
  void lang
  const [items, setItems] = useState<LearnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<LearnItem | null>(null)

  useEffect(() => {
    api.learn(getOwnerId()).then(list => { setItems(list); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (open) return <ItemDetail item={open} onBack={() => setOpen(null)} />

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  return (
    <div style={{ flex: 1 }}>
      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {(['all', 'checklist', 'guide', 'article'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--r-pill)', border: '1.5px solid',
              whiteSpace: 'nowrap', minHeight: 34, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              background: filter === f ? 'var(--primary)' : 'var(--surface)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              borderColor: filter === f ? 'var(--primary)' : 'var(--border)',
            }}
          >
            {f === 'all' ? t('learn.all') : f === 'checklist' ? t('learn.checklist') : f === 'guide' ? t('learn.guide') : t('learn.article')}
          </button>
        ))}
      </div>

      <div style={{ padding: '4px 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>{t('loading')}</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>{t('learn.empty')}</div>
        )}
        {!loading && filtered.map(item => {
          const meta = TYPE_META[item.type] ?? TYPE_META.article
          return (
            <button
              key={item.id}
              onClick={() => setOpen(item)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: '16px',
                display: 'flex', gap: 14, textAlign: 'left', cursor: 'pointer',
                fontFamily: 'inherit', width: '100%',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--r-md)',
                background: meta.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>
                {meta.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 'var(--r-pill)', background: meta.bg, color: meta.color,
                  display: 'inline-block', marginBottom: 4,
                }}>{meta.label}</span>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {item.subtitle}
                  {item.steps?.length ? ` · ${item.steps.length} ${t('learn.steps')}` : ''}
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 18, alignSelf: 'center' }}>›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ItemDetail({ item, onBack }: { item: LearnItem; onBack: () => void }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.article
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const toggle = (id: number) => setChecked(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div style={{ flex: 1 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <button
          onClick={onBack}
          style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >←</button>
        <span style={{
          flex: 1, fontWeight: 700, fontSize: 16,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{item.title}</span>
      </div>

      <div style={{ padding: '20px 16px 32px' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-pill)',
          background: meta.bg, color: meta.color, display: 'inline-block', marginBottom: 12,
        }}>{meta.label}</span>

        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>{item.title}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{item.subtitle}</p>
        {item.body && <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{item.body}</p>}

        {item.steps && item.steps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {item.steps.map((step, idx) => {
              const done = checked.has(step.id)
              return (
                <button
                  key={step.id}
                  onClick={() => toggle(step.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px',
                    borderRadius: 'var(--r-md)',
                    background: done ? '#F0FDF4' : 'var(--surface)',
                    border: `1.5px solid ${done ? '#86EFAC' : 'var(--border)'}`,
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .15s',
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: done ? '#22C55E' : 'var(--border)',
                    color: done ? '#fff' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, transition: 'all .15s',
                  }}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <span style={{
                    fontSize: 14, lineHeight: 1.5,
                    color: done ? '#15803D' : 'var(--text)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>{step.text}</span>
                </button>
              )
            })}
            {checked.size > 0 && (
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 8 }}>
                {checked.size} / {item.steps.length} выполнено
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
