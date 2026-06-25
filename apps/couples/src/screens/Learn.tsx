import { useEffect, useState } from 'react'
import { IconArrowLeft, IconCheck, IconContent, IconBook } from '@ht/shared'
import type { LearnItem } from '../api'
import { api, getOwnerId } from '../api'
import { t } from '../i18n'

type Filter = 'all' | 'checklist' | 'guide' | 'article'

const TYPE_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  checklist: { bg: '#DCFCE7', color: '#15803D', label: 'Чек-лист' },
  guide:     { bg: '#DBEAFE', color: '#1D4ED8', label: 'Гайд' },
  article:   { bg: '#FEF3C7', color: '#92400E', label: 'Статья' },
}

export default function Learn({ lang }: { lang: string }) {
  void lang
  const [items, setItems] = useState<LearnItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<LearnItem | null>(null)

  useEffect(() => {
    api.learn(getOwnerId())
      .then(list => { setItems(list); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  if (open) {
    return <ItemDetail item={open} onBack={() => setOpen(null)} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
      <header style={{
        display: 'flex', alignItems: 'center', padding: '14px 20px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{t('learn.title')}</span>
      </header>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 16px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {(['all', 'checklist', 'guide', 'article'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--r-pill)',
              border: '1.5px solid', whiteSpace: 'nowrap', minHeight: 34,
              background: filter === f ? 'var(--primary)' : 'var(--surface)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              borderColor: filter === f ? 'var(--primary)' : 'var(--border)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {f === 'all' ? t('learn.all') : f === 'checklist' ? t('learn.checklist') : f === 'guide' ? t('learn.guide') : t('learn.article')}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '12px 16px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>{t('loading')}</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>{t('learn.empty')}</div>
        )}
        {!loading && filtered.map(item => {
          const meta = TYPE_COLOR[item.type] ?? TYPE_COLOR.article
          const stepCount = item.steps?.length ?? 0
          return (
            <button
              key={item.id}
              onClick={() => setOpen(item)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: '16px',
                display: 'flex', gap: 14, textAlign: 'left', cursor: 'pointer',
                fontFamily: 'inherit', width: '100%',
                transition: 'box-shadow .15s',
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--r-md)',
                background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {item.type === 'checklist' ? <IconCheck size={22} color={meta.color} /> : item.type === 'guide' ? <IconBook size={22} color={meta.color} /> : <IconContent size={22} color={meta.color} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 'var(--r-pill)', background: meta.bg, color: meta.color,
                  }}>{meta.label}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: 1.3 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {item.subtitle}
                  {stepCount > 0 && ` · ${stepCount} ${t('learn.steps')}`}
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
  const meta = TYPE_COLOR[item.type] ?? TYPE_COLOR.article
  const [checked, setChecked] = useState<Set<number>>(new Set())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        ><IconArrowLeft size={16} /></button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
      </header>

      <div style={{ flex: 1, padding: '20px 16px 32px' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px',
          borderRadius: 'var(--r-pill)', background: meta.bg, color: meta.color,
          display: 'inline-block', marginBottom: 12,
        }}>{meta.label}</span>

        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>{item.title}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{item.subtitle}</p>

        {item.body && (
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', marginBottom: 20 }}>{item.body}</p>
        )}

        {item.steps && item.steps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {item.steps.map((step, idx) => {
              const done = checked.has(step.id)
              return (
                <button
                  key={step.id}
                  onClick={() => setChecked(prev => {
                    const next = new Set(prev)
                    done ? next.delete(step.id) : next.add(step.id)
                    return next
                  })}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px', borderRadius: 'var(--r-md)',
                    background: done ? '#F0FDF4' : 'var(--surface)',
                    border: `1.5px solid ${done ? '#86EFAC' : 'var(--border)'}`,
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'all .15s',
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: done ? '#22C55E' : 'var(--border)',
                    color: done ? '#fff' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, transition: 'all .15s',
                  }}>
                    {done ? <IconCheck size={12} color="#fff" /> : idx + 1}
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
              <div style={{
                marginTop: 8, textAlign: 'center', fontSize: 13,
                color: 'var(--text-muted)', fontWeight: 600,
              }}>
                {checked.size} / {item.steps.length} выполнено
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
