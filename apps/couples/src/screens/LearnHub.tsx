import { useCallback, useEffect, useRef, useState } from 'react'
import {
  IconArrowLeft, IconLearning, IconHeart, IconCheck,
  IconClock, IconCheckCircle, IconChevronRight,
} from '@ht/shared'
import type { LearnItem } from '../api'
import { api, getOwnerId } from '../api'
import { getLang, t } from '../i18n'
import Deeds from './Deeds'

type Filter = 'all' | 'checklist' | 'guide' | 'article'

// Type color system — references CSS variables defined in index.css (dark-mode safe)
const TV = {
  checklist: {
    bg:     'var(--type-checklist-bg)',
    text:   'var(--type-checklist-text)',
    accent: 'var(--type-checklist-accent)',
  },
  guide: {
    bg:     'var(--type-guide-bg)',
    text:   'var(--type-guide-text)',
    accent: 'var(--type-guide-accent)',
  },
  article: {
    bg:     'var(--type-article-bg)',
    text:   'var(--type-article-text)',
    accent: 'var(--type-article-accent)',
  },
} as const

function tv(type: string) {
  return TV[type as keyof typeof TV] ?? TV.article
}

// Category labels (ru/uz)
const CAT: Record<string, [string, string]> = {
  vet:         ['Ветеринария',     'Veterinariya'],
  first_aid:   ['Первая помощь',   'Birinchi yordam'],
  onboarding:  ['Первые шаги',     'Dastlabki qadamlar'],
  health:      ['Здоровье',        'Salomatlik'],
  nutrition:   ['Питание',         'Oziqlanish'],
  grooming:    ['Уход',            'Parvarishlash'],
  vaccination: ['Вакцинация',      'Emlash'],
  behavior:    ['Поведение',       'Xulq-atvor'],
}

const catLabel = (cat: string) => {
  const pair = CAT[cat]
  if (!pair) return cat
  return getLang() === 'uz' ? pair[1] : pair[0]
}

const typeLabel = (type: string) =>
  type === 'checklist' ? t('learn.checklist')
  : type === 'guide'   ? t('learn.guide')
  : t('learn.article')

// ─── LearnHub ────────────────────────────────────────────────────────────────

export default function LearnHub({ lang }: { lang: string }) {
  const [tab, setTab] = useState<'learn' | 'deeds'>('learn')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
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
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              {key === 'learn' ? <IconLearning size={14} /> : <IconHeart size={14} />}
              {key === 'learn' ? t('learn.title') : t('deeds.title')}
            </span>
          </button>
        ))}
      </div>

      {tab === 'learn' && <LearnContent lang={lang} />}
      {tab === 'deeds' && <Deeds lang={lang} />}
    </div>
  )
}

// ─── LearnContent ─────────────────────────────────────────────────────────────

function LearnContent({ lang }: { lang: string }) {
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

  const onBack = useCallback((updated?: LearnItem) => {
    if (updated) setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    setOpen(null)
  }, [])

  if (open) return <ItemDetail key={open.id} item={open} onBack={onBack} />

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)
  const completedCount = items.filter(i => i.progress?.status === 'completed').length

  return (
    <div style={{ flex: 1 }}>

      {/* Progress banner — shown once user has completed anything */}
      {!loading && items.length > 0 && completedCount > 0 && (
        <div style={{
          margin: '12px 16px 0',
          padding: '10px 14px',
          borderRadius: 'var(--r-md)',
          background: 'rgba(34,197,94,0.07)',
          border: '1px solid rgba(34,197,94,0.18)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <IconCheckCircle size={20} color="var(--success)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', marginBottom: 5 }}>
              {completedCount} {t('learn.completed_count')} · {Math.round(completedCount / items.length * 100)}%
            </div>
            <div style={{
              height: 4, background: 'rgba(34,197,94,0.15)', borderRadius: 99, overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.round(completedCount / items.length * 100)}%`,
                height: '100%', background: 'var(--success)', borderRadius: 99,
                transition: 'width .4s ease-out',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Filter strip */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 16px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {(['all', 'checklist', 'guide', 'article'] as Filter[]).map(f => {
          const active = filter === f
          const colors = f !== 'all' ? tv(f) : null
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px', borderRadius: 'var(--r-pill)',
                border: `1.5px solid ${active
                  ? (colors ? colors.accent : 'var(--primary)')
                  : 'var(--border)'}`,
                whiteSpace: 'nowrap', minHeight: 34,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                background: active ? (colors ? colors.accent : 'var(--primary)') : 'var(--surface)',
                color: active ? '#fff' : colors ? colors.text : 'var(--text-muted)',
                transition: 'background .15s, color .15s, border-color .15s',
              }}
            >
              {f === 'all' ? t('learn.all') : typeLabel(f)}
            </button>
          )
        })}
      </div>

      {/* Shimmer loading skeletons */}
      {loading && (
        <div style={{ padding: '4px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { h: 12, w: '40%', r: 'var(--r-sm)' },
            { h: 200, w: '100%', r: 'var(--r-lg)' },
            { h: 12, w: '30%', r: 'var(--r-sm)' },
            { h: 130, w: '100%', r: 'var(--r-lg)' },
          ].map((s, i) => (
            <div key={i} style={{
              height: s.h, width: s.w, borderRadius: s.r,
              background: 'linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%)',
              backgroundSize: '200% 100%',
              animation: `shimmer 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.08}s`,
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '56px 32px' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>📚</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            {t('learn.empty')}
          </div>
          {filter !== 'all' && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {getLang() === 'uz' ? 'Barchasini ko\'rish uchun "Barchasi" ni tanlang' : 'Выберите «Все», чтобы увидеть весь список'}
            </div>
          )}
        </div>
      )}

      {/* Items */}
      {!loading && filtered.length > 0 && (
        filter === 'all'
          ? <CategorySections items={filtered} onOpen={setOpen} />
          : <ItemGroup items={filtered} onOpen={setOpen} />
      )}
    </div>
  )
}

// ─── CategorySections ─────────────────────────────────────────────────────────
// Groups items by category; each group is a shared-surface list (no individual cards)

function CategorySections({ items, onOpen }: {
  items: LearnItem[]
  onOpen: (i: LearnItem) => void
}) {
  // Preserve server sort_order within each category
  const groups: [string, LearnItem[]][] = []
  const seen = new Set<string>()
  for (const item of items) {
    if (!seen.has(item.category)) {
      seen.add(item.category)
      groups.push([item.category, []])
    }
    groups.find(g => g[0] === item.category)![1].push(item)
  }

  return (
    <div style={{ padding: '8px 16px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {groups.map(([cat, catItems]) => (
        <section key={cat}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
            marginBottom: 8, paddingLeft: 2,
          }}>
            {catLabel(cat)}
          </div>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}>
            {catItems.map((item, idx) => (
              <ItemRow
                key={item.id}
                item={item}
                onOpen={onOpen}
                hasSeparator={idx < catItems.length - 1}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

// ─── ItemGroup ────────────────────────────────────────────────────────────────
// Flat list for filtered views

function ItemGroup({ items, onOpen }: {
  items: LearnItem[]
  onOpen: (i: LearnItem) => void
}) {
  return (
    <div style={{ padding: '8px 16px 32px' }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {items.map((item, idx) => (
          <ItemRow
            key={item.id}
            item={item}
            onOpen={onOpen}
            hasSeparator={idx < items.length - 1}
          />
        ))}
      </div>
    </div>
  )
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({ item, onOpen, hasSeparator }: {
  item: LearnItem
  onOpen: (i: LearnItem) => void
  hasSeparator: boolean
}) {
  const colors = tv(item.type)
  const isDone = item.progress?.status === 'completed'
  const stepCount = item.steps?.length ?? 0
  const checkedCount = item.progress?.checked_steps?.length ?? 0
  const pct = isDone ? 100 : stepCount > 0 ? Math.round(checkedCount / stepCount * 100) : 0
  const inProgress = !isDone && pct > 0

  return (
    <button
      onClick={() => onOpen(item)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', width: '100%', border: 'none',
        background: isDone ? 'rgba(34,197,94,0.04)' : 'transparent',
        borderBottom: hasSeparator ? '1px solid var(--border)' : 'none',
        textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background .12s',
      }}
    >
      {/* Emoji block */}
      <div style={{
        width: 42, height: 42, borderRadius: 'var(--r-md)',
        background: colors.bg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 21,
      }}>
        {item.emoji || '📄'}
      </div>

      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: 14, lineHeight: 1.3,
          color: isDone ? 'var(--text-muted)' : 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
        }}>
          {item.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px',
            borderRadius: 'var(--r-pill)',
            background: colors.bg, color: colors.text,
          }}>
            {typeLabel(item.type)}
          </span>
          {item.duration_min > 0 && (
            <span style={{
              fontSize: 11, color: 'var(--text-muted)',
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              <IconClock size={9} color="var(--text-muted)" />
              {item.duration_min} {t('learn.min')}
            </span>
          )}
          {inProgress && (
            <span style={{ fontSize: 11, color: colors.text, fontWeight: 600 }}>
              {checkedCount}/{stepCount}
            </span>
          )}
        </div>
        {/* Thin progress bar for in-progress items */}
        {inProgress && (
          <div style={{
            height: 2, background: 'var(--border)', borderRadius: 99,
            overflow: 'hidden', marginTop: 5,
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: colors.accent, borderRadius: 99,
              transition: 'width .3s',
            }} />
          </div>
        )}
      </div>

      {/* Right indicator */}
      <div style={{ flexShrink: 0, paddingLeft: 4 }}>
        {isDone
          ? <IconCheckCircle size={18} color="var(--success)" />
          : <IconChevronRight size={16} color="var(--text-muted)" />
        }
      </div>
    </button>
  )
}

// ─── ItemDetail ───────────────────────────────────────────────────────────────

function ItemDetail({
  item: initialItem,
  onBack,
}: {
  item: LearnItem
  onBack: (updated?: LearnItem) => void
}) {
  const colors = tv(initialItem.type)
  const stepCount = initialItem.steps?.length ?? 0

  const [checked, setChecked] = useState<Set<number>>(
    () => new Set(initialItem.progress?.checked_steps ?? [])
  )
  const [completed, setCompleted] = useState(initialItem.progress?.status === 'completed')
  const [saving, setSaving] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pct = stepCount > 0 ? Math.round(checked.size / stepCount * 100) : (completed ? 100 : 0)
  const allDone = stepCount > 0 && checked.size === stepCount

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [])

  const persist = useCallback((newChecked: Set<number>, isCompleted: boolean) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    const status: 'started' | 'completed' = isCompleted ? 'completed' : 'started'
    const ids = Array.from(newChecked)
    const run = () => api.learnProgress(initialItem.id, getOwnerId(), status, ids).catch(() => {})
    if (isCompleted) { run() }
    else { saveTimer.current = setTimeout(run, 700) }
  }, [initialItem.id])

  const toggle = (stepId: number) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(stepId) ? next.delete(stepId) : next.add(stepId)
      const nowAll = stepCount > 0 && next.size === stepCount
      if (nowAll) { setCompleted(true); setJustCompleted(true) }
      persist(next, nowAll)
      return next
    })
  }

  const markDone = async () => {
    setSaving(true)
    try {
      await api.learnProgress(initialItem.id, getOwnerId(), 'completed', [])
      setCompleted(true)
      setJustCompleted(true)
    } catch {
      // non-blocking
    } finally { setSaving(false) }
  }

  const handleBack = () => {
    const isDone = allDone || completed
    const status: 'started' | 'completed' = isDone ? 'completed' : 'started'
    const ids = Array.from(checked)
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
      if (checked.size > 0) api.learnProgress(initialItem.id, getOwnerId(), status, ids).catch(() => {})
    }
    onBack({ ...initialItem, progress: { status, checked_steps: ids } })
  }

  const isChecklist = initialItem.type === 'checklist' && stepCount > 0

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      animation: 'slide-in 180ms ease-out',
    }}>
      {/* Sticky back nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={handleBack}
          style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <IconArrowLeft size={16} />
        </button>
        <span style={{
          flex: 1, fontWeight: 700, fontSize: 15, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {initialItem.title}
        </span>
      </div>

      {/* Hero zone */}
      <div style={{ background: colors.bg, padding: '22px 20px 0' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{
            width: 62, height: 62, borderRadius: 'var(--r-lg)',
            background: 'rgba(255,255,255,0.55)',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>
            {initialItem.emoji || '📄'}
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <h1 style={{
              fontSize: 17, fontWeight: 800, color: colors.text,
              lineHeight: 1.3, marginBottom: 8,
            }}>
              {initialItem.title}
            </h1>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 9px',
                borderRadius: 'var(--r-pill)',
                background: 'rgba(255,255,255,0.7)', color: colors.text,
              }}>
                {typeLabel(initialItem.type)}
              </span>
              {initialItem.duration_min > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 9px',
                  borderRadius: 'var(--r-pill)',
                  background: 'rgba(255,255,255,0.7)', color: colors.text,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <IconClock size={11} /> {initialItem.duration_min} {t('learn.min')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Checklist progress bar in hero */}
        {isChecklist && (
          <div style={{ paddingBottom: 16 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 11, color: colors.text, fontWeight: 600, marginBottom: 5,
            }}>
              <span>{pct}%</span>
              <span>{checked.size} / {stepCount} {t('learn.steps')}</span>
            </div>
            <div style={{
              height: 5, background: 'rgba(255,255,255,0.4)',
              borderRadius: 99, overflow: 'hidden',
            }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: allDone || completed ? 'var(--success)' : colors.accent,
                borderRadius: 99, transition: 'width .35s ease-out',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '16px 16px 40px' }}>

        {/* Completion banner */}
        {(allDone || completed) && (
          <div style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.22)',
            borderRadius: 'var(--r-md)', padding: '12px 14px',
            display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16,
            animation: justCompleted ? 'scale-in 220ms ease-out' : 'none',
          }}>
            <IconCheckCircle size={22} color="var(--success)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>
                {t('learn.done_all')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--success)', opacity: 0.75, marginTop: 2 }}>
                {t('learn.done_sub')}
              </div>
            </div>
          </div>
        )}

        {/* Subtitle */}
        {initialItem.subtitle && !initialItem.subtitle.includes('·') && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 14 }}>
            {initialItem.subtitle}
          </p>
        )}

        {/* Body prose */}
        {initialItem.body && (
          <p style={{
            fontSize: 15, lineHeight: 1.75, color: 'var(--text)',
            marginBottom: isChecklist ? 20 : 28,
          }}>
            {initialItem.body}
          </p>
        )}

        {/* Steps */}
        {initialItem.steps && initialItem.steps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {initialItem.steps.map((step, idx) => {
              const done = checked.has(step.id)
              return (
                <button
                  key={step.id}
                  onClick={() => toggle(step.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
                    borderRadius: 'var(--r-md)',
                    background: done ? 'rgba(34,197,94,0.06)' : 'var(--surface)',
                    border: `1.5px solid ${done ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'background .15s, border-color .15s',
                    minHeight: 44,
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: done ? 'var(--success)' : 'var(--surface-2)',
                    border: `2px solid ${done ? 'var(--success)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: done ? '#fff' : 'var(--text-muted)',
                    fontSize: 11, fontWeight: 700,
                    transition: 'background .2s ease-out, border-color .2s ease-out',
                  }}>
                    {done ? <IconCheck size={12} color="#fff" /> : idx + 1}
                  </div>
                  <span style={{
                    fontSize: 14, lineHeight: 1.5, flex: 1, paddingTop: 2,
                    color: done ? 'var(--text-muted)' : 'var(--text)',
                    textDecoration: done ? 'line-through' : 'none',
                    transition: 'color .15s',
                  }}>
                    {step.text}
                  </span>
                </button>
              )
            })}

            <div style={{
              textAlign: 'center', fontSize: 12, color: 'var(--text-muted)',
              fontWeight: 600, paddingTop: 4,
            }}>
              {checked.size} / {stepCount} {t('learn.steps')}
            </div>
          </div>
        )}

        {/* Mark done for guides / articles without steps */}
        {!isChecklist && !initialItem.steps?.length && (
          <div style={{ marginTop: 8 }}>
            {completed ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px', borderRadius: 'var(--r-pill)',
                background: 'rgba(34,197,94,0.1)', color: 'var(--success)',
                fontSize: 14, fontWeight: 700,
                animation: justCompleted ? 'scale-in 220ms ease-out' : 'none',
              }}>
                <IconCheckCircle size={16} color="var(--success)" />
                {t('learn.completed_badge')}
              </div>
            ) : (
              <button
                onClick={markDone}
                disabled={saving}
                style={{
                  width: '100%', padding: '14px', borderRadius: 'var(--r-pill)',
                  background: 'var(--primary)', color: '#fff', border: 'none',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  fontFamily: 'inherit', minHeight: 52,
                  opacity: saving ? 0.7 : 1, transition: 'opacity .15s',
                }}
              >
                {saving ? '…' : t('learn.mark_done')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
