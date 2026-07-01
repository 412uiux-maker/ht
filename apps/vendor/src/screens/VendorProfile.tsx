import { useState, useEffect } from 'react'
import { IconCheckCircle, IconAlertCircle, IconStar, IconConsultation, IconCertificate } from '@ht/shared'
import type { VendorSession, Stats, EducationEntry, ScienceEntry, PatientType } from '../types'
import { setSession } from '../types'
import { api } from '../api'

interface DraftEdu extends EducationEntry { id: string }
interface DraftSci extends ScienceEntry   { id: string }

interface Props {
  session: VendorSession
  onSessionUpdate: (s: VendorSession) => void
}

const PET_SPECIALTIES = [
  'Терапевт', 'Хирург', 'Дерматолог', 'Кардиолог', 'Офтальмолог',
  'Диетолог', 'Кинолог', 'Фелинолог', 'Груммер', 'Зоопсихолог',
  'Онколог', 'Репродуктолог', 'Стоматолог', 'Невролог',
]

const HUMAN_SPECIALTIES = [
  'Терапевт', 'Педиатр', 'Хирург', 'Кардиолог', 'Дерматолог',
  'Офтальмолог', 'Гинеколог', 'Невролог', 'Психолог', 'Стоматолог',
  'Диетолог', 'Эндокринолог', 'Ортопед', 'Онколог', 'Уролог', 'Репродуктолог',
]

const PET_AVATARS   = ['👨‍⚕️', '👩‍⚕️', '🐕', '🐈', '🦜', '🐇', '🦔', '🐠', '🐾', '🩺']
const HUMAN_AVATARS = ['👨‍⚕️', '👩‍⚕️', '🩺', '💊', '🏥', '🩻', '💉', '🔬', '🧬', '⚕️']

const PATIENT_TYPE_LABELS: Record<PatientType, { emoji: string; label: string }> = {
  pet:   { emoji: '🐾', label: 'Питомцы' },
  human: { emoji: '👤', label: 'Люди' },
}

export default function VendorProfile({ session, onSessionUpdate }: Props) {
  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState<VendorSession>(session)
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState('')
  const [stats, setStats]       = useState<Stats | null>(null)

  const [tgId, setTgId]           = useState('')
  const [tgLinking, setTgLinking] = useState(false)
  const [tgLinked, setTgLinked]   = useState(session.has_telegram ?? false)
  const [tgError, setTgError]     = useState('')

  // edit-modal card drafts
  const [eduDraft, setEduDraft] = useState<Omit<DraftEdu, 'id'> | null>(null)
  const [sciDraft, setSciDraft] = useState<Omit<DraftSci, 'id'> | null>(null)

  useEffect(() => { api.stats(session.vet_id).then(setStats).catch(() => {}) }, [session.vet_id])

  const linkTelegram = async () => {
    const id = parseInt(tgId.replace(/\D/g, ''), 10)
    if (!id) { setTgError('Введите числовой Telegram ID'); return }
    setTgLinking(true); setTgError('')
    try {
      await api.linkTelegram(id)
      setTgLinked(true); setTgId('')
    } catch (e) {
      setTgError((e as Error).message)
    } finally {
      setTgLinking(false)
    }
  }

  const openEdit = () => {
    setDraft({
      ...session,
      // Assign stable keys to entries loaded from server (they have no id)
      education: (session.education ?? []).map((e, i) => ({ ...e, id: `s${i}` }) as any),
      science:   (session.science   ?? []).map((s, i) => ({ ...s, id: `s${i}` }) as any),
    })
    setEduDraft(null)
    setSciDraft(null)
    setSaveError('')
    setEditing(true)
  }

  const save = async () => {
    setSaving(true); setSaveError('')
    try {
      const updated = await api.updateProfile({
        name: draft.name,
        specialty: draft.specialty,
        patient_type: draft.patient_type,
        bio: draft.bio,
        price_uzs: draft.price_uzs,
        experience_yr: draft.experience_yr,
        avatar_emoji: draft.avatar_emoji,
        personal_story: draft.personal_story,
        education: draft.education?.map(({ id: _id, ...e }: any) => e as EducationEntry),
        science:   draft.science?.map(({ id: _id, ...s }: any) => s as ScienceEntry),
      })
      const merged = { ...session, ...updated }
      setSession(merged)
      onSessionUpdate(merged)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const eduList: DraftEdu[] = ((draft.education ?? []) as DraftEdu[])
  const sciList: DraftSci[] = ((draft.science   ?? []) as DraftSci[])

  const viewEdu: EducationEntry[] = session.education ?? []
  const viewSci: ScienceEntry[]   = session.science   ?? []

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>Профиль</h1>
        <button onClick={openEdit} style={btnGhost}>Редактировать</button>
      </div>

      {saved && (
        <div style={{
          padding: '11px 14px', borderRadius: 'var(--r-sm)',
          background: 'rgba(76,175,125,.12)', color: 'var(--green)',
          fontWeight: 600, fontSize: 13, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <IconCheckCircle size={15} color="var(--green)" /> Профиль обновлён
        </div>
      )}

      {/* ── Hero card ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--surface3)',
        borderRadius: 'var(--r-md)', padding: '20px',
        display: 'flex', gap: 16, marginBottom: 12,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(242,120,75,.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38,
        }}>
          {session.avatar_emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>{session.name}</span>
            {session.verification_status === 'verified' && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 7px',
                borderRadius: 'var(--r-pill)',
                background: 'rgba(76,175,125,.12)', color: 'var(--green)',
              }}>✓ Верифицирован</span>
            )}
            {session.verification_status === 'pending' && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 7px',
                borderRadius: 'var(--r-pill)',
                background: 'rgba(245,158,11,.12)', color: 'var(--amber)',
              }}>На проверке</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{session.specialty}</span>
            {session.patient_type && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 7px',
                borderRadius: 'var(--r-pill)',
                background: session.patient_type === 'human' ? 'rgba(59,130,246,.1)' : 'rgba(242,120,75,.12)',
                color: session.patient_type === 'human' ? '#1D4ED8' : 'var(--coral)',
              }}>
                {PATIENT_TYPE_LABELS[session.patient_type].emoji} {PATIENT_TYPE_LABELS[session.patient_type].label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip color="var(--coral)" bg="rgba(242,120,75,.1)">
              <IconStar size={12} color="var(--coral)" /> {session.rating.toFixed(1)}
            </Chip>
            <Chip color="var(--green)" bg="rgba(76,175,125,.1)">
              {session.experience_yr} лет опыта
            </Chip>
            {session.price_uzs > 0 && (
              <Chip color="var(--text2)" bg="var(--surface2)">
                {session.price_uzs.toLocaleString('ru-RU')} сум
              </Chip>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {([
          { icon: <IconConsultation size={20} color="var(--coral)" />, label: 'Консультаций', value: stats ? String(stats.total) : '…' },
          { icon: <IconStar size={20} color="var(--coral)" />,         label: 'Рейтинг',      value: session.rating.toFixed(1) },
          { icon: <IconCertificate size={20} color="var(--coral)" />,  label: 'Опыт',          value: `${session.experience_yr} л.` },
        ]).map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--surface3)',
            borderRadius: 'var(--r-md)', padding: '14px', textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── О себе ───────────────────────────────────────────── */}
      <Section title="О себе" emoji="💬">
        <p style={{ fontSize: 14, color: session.bio ? 'var(--text)' : 'var(--text3)', lineHeight: 1.65, margin: 0 }}>
          {session.bio || 'Не заполнено'}
        </p>
      </Section>

      {/* ── Личная история ───────────────────────────────────── */}
      {session.personal_story && (
        <Section title="Личная история" emoji="📖">
          <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
            {session.personal_story}
          </p>
        </Section>
      )}

      {/* ── Образование ──────────────────────────────────────── */}
      {viewEdu.length > 0 && (
        <Section title="Образование" emoji="🎓">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {viewEdu.map((e, i) => (
              <div key={i} style={{
                background: 'var(--surface2)', border: '1px solid var(--surface3)',
                borderRadius: 'var(--r-sm)', padding: '12px 14px',
              }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{e.institution}</div>
                {(e.degree || e.year) && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                    {[e.degree, e.year].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Научная деятельность ─────────────────────────────── */}
      {viewSci.length > 0 && (
        <Section title="Научная деятельность" emoji="🔬">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {viewSci.map((s, i) => (
              <div key={i} style={{
                background: 'var(--surface2)', border: '1px solid var(--surface3)',
                borderRadius: 'var(--r-sm)', padding: '12px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8,
              }}>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500, lineHeight: 1.4 }}>{s.title}</div>
                {s.year && <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>{s.year}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Telegram ─────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--surface3)',
        borderRadius: 'var(--r-md)', padding: '18px 20px', marginTop: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 22 }}>✈️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Telegram-уведомления</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
              Получайте заявки и принимайте их прямо в Telegram
            </div>
          </div>
        </div>

        {tgLinked ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              flex: 1, padding: '10px 14px', borderRadius: 'var(--r-sm)',
              background: 'rgba(76,175,125,.12)', color: 'var(--green)',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <IconCheckCircle size={15} color="var(--green)" /> Telegram привязан
            </div>
            <button
              onClick={async () => {
                try { await api.unlinkTelegram(); setTgLinked(false) } catch {}
              }}
              style={{ ...btnGhost, padding: '0 14px', minHeight: 40, fontSize: 12 }}
            >
              Отвязать
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>
              Нажмите кнопку ниже — откроется бот. Он сам привяжет ваш аккаунт за один клик.
            </div>
            <button
              onClick={async () => {
                setTgLinking(true); setTgError('')
                try {
                  const { url } = await api.getTelegramLinkUrl()
                  window.open(url, '_blank')
                  // Poll every 3s for up to 2min to detect when linking completes
                  let attempts = 0
                  const timer = setInterval(async () => {
                    attempts++
                    try {
                      const profile = await api.getProfile()
                      if (profile.has_telegram) { setTgLinked(true); clearInterval(timer) }
                    } catch {}
                    if (attempts >= 40) { clearInterval(timer); setTgLinking(false) }
                  }, 3000)
                } catch (e) {
                  setTgError((e as Error).message)
                  setTgLinking(false)
                }
              }}
              disabled={tgLinking}
              style={{ ...btnCoral, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
            >
              {tgLinking ? (
                <><span style={{ opacity: 0.7 }}>Ожидание…</span></>
              ) : (
                <>✈️ Привязать через Telegram</>
              )}
            </button>
            {tgError && (
              <div style={{
                marginTop: 8, padding: '8px 12px', borderRadius: 'var(--r-sm)',
                background: 'rgba(239,68,68,.10)', color: 'var(--danger)', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <IconAlertCircle size={13} color="var(--danger)" /> {tgError}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit modal ───────────────────────────────────────── */}
      {editing && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && !saving && setEditing(false)}>
          <div style={{
            background: 'var(--surface)', borderRadius: 'var(--r-md)',
            padding: '24px 20px', width: '100%', maxWidth: 480,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 16px 40px rgba(0,0,0,.25)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
              Редактировать профиль
            </h2>

            {/* Patient type switcher */}
            <div style={{ marginBottom: 16 }}>
              <ModalLabel>Тип пациента</ModalLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['pet', 'human'] as PatientType[]).map(pt => {
                  const active = draft.patient_type === pt
                  return (
                    <button
                      key={pt}
                      onClick={() => setDraft(d => ({ ...d, patient_type: pt, specialty: '' }))}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 'var(--r-sm)', fontFamily: 'inherit',
                        border: active ? '2px solid var(--coral)' : '1.5px solid var(--surface3)',
                        background: active ? 'rgba(242,120,75,.08)' : 'var(--surface2)',
                        color: active ? 'var(--coral)' : 'var(--text2)',
                        fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      {PATIENT_TYPE_LABELS[pt].emoji} {PATIENT_TYPE_LABELS[pt].label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Avatar */}
            <div style={{ marginBottom: 20 }}>
              <ModalLabel>Аватар</ModalLabel>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(draft.patient_type === 'human' ? HUMAN_AVATARS : PET_AVATARS).map(a => (
                  <button
                    key={a}
                    onClick={() => setDraft(d => ({ ...d, avatar_emoji: a }))}
                    style={{
                      width: 44, height: 44, borderRadius: 'var(--r-sm)', fontSize: 22,
                      border: draft.avatar_emoji === a ? '2px solid var(--coral)' : '1.5px solid var(--surface3)',
                      background: draft.avatar_emoji === a ? 'rgba(242,120,75,.1)' : 'var(--surface2)',
                      cursor: 'pointer',
                    }}
                  >{a}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Name */}
              <Field label="Имя и фамилия">
                <input style={inp} value={draft.name}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
              </Field>

              {/* Specialty */}
              <Field label="Специальность">
                {(() => {
                  const list = draft.patient_type === 'human' ? HUMAN_SPECIALTIES : PET_SPECIALTIES
                  const options = list.includes(draft.specialty) ? list : [draft.specialty, ...list].filter(Boolean)
                  return (
                    <select style={inp} value={draft.specialty}
                      onChange={e => setDraft(d => ({ ...d, specialty: e.target.value }))}>
                      {!list.includes(draft.specialty) && <option value="" disabled>Выберите специальность</option>}
                      {options.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )
                })()}
              </Field>

              {/* Bio */}
              <Field label="О себе">
                <textarea style={{ ...inp, height: 80, resize: 'vertical' }}
                  value={draft.bio}
                  onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))} />
              </Field>

              {/* Personal story */}
              <Field label="Личная история">
                <textarea
                  style={{ ...inp, height: 80, resize: 'vertical' }}
                  placeholder="Почему вы выбрали эту профессию…"
                  value={draft.personal_story ?? ''}
                  onChange={e => setDraft(d => ({ ...d, personal_story: e.target.value }))}
                />
              </Field>

              {/* Education cards editor */}
              <div>
                <ModalLabel>Образование</ModalLabel>
                {eduList.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                    {eduList.map(e => (
                      <div key={e.id} style={{
                        background: 'var(--surface2)', border: '1px solid var(--surface3)',
                        borderRadius: 'var(--r-sm)', padding: '10px 12px',
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                      }}>
                        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🎓</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.institution}
                          </div>
                          {(e.degree || e.year) && (
                            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                              {[e.degree, e.year].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setDraft(d => ({ ...d, education: (d.education ?? []).filter((x: EducationEntry & { id?: string }) => (x as any).id !== e.id) }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 15, padding: '0 0 0 4px', flexShrink: 0 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {eduDraft !== null ? (
                  <div style={{
                    background: 'var(--surface2)', border: '1px solid var(--coral)',
                    borderRadius: 'var(--r-sm)', padding: '12px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <input
                      style={inp} placeholder="Учебное заведение *"
                      value={eduDraft.institution} autoFocus
                      onChange={e => setEduDraft(d => d && ({ ...d, institution: e.target.value }))}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8 }}>
                      <input style={inp} placeholder="Специальность / степень"
                        value={eduDraft.degree}
                        onChange={e => setEduDraft(d => d && ({ ...d, degree: e.target.value }))} />
                      <input style={inp} placeholder="Год" value={eduDraft.year} maxLength={4} inputMode="numeric"
                        onChange={e => setEduDraft(d => d && ({ ...d, year: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEduDraft(null)} style={btnSmGhost}>Отмена</button>
                      <button
                        disabled={!eduDraft.institution.trim()}
                        onClick={() => {
                          if (!eduDraft.institution.trim()) return
                          const entry = { ...eduDraft, id: String(Date.now()) }
                          setDraft(d => ({ ...d, education: [...(d.education ?? []), entry] }))
                          setEduDraft(null)
                        }}
                        style={btnSmCoral(!eduDraft.institution.trim())}
                      >Добавить</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setEduDraft({ institution: '', degree: '', year: '' })} style={addCardBtn}>
                    <span>+</span> Добавить образование
                  </button>
                )}
              </div>

              {/* Science cards editor */}
              <div>
                <ModalLabel>Научная деятельность</ModalLabel>
                {sciList.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                    {sciList.map(s => (
                      <div key={s.id} style={{
                        background: 'var(--surface2)', border: '1px solid var(--surface3)',
                        borderRadius: 'var(--r-sm)', padding: '10px 12px',
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                      }}>
                        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🔬</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.title}
                          </div>
                          {s.year && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.year}</div>}
                        </div>
                        <button
                          onClick={() => setDraft(d => ({ ...d, science: (d.science ?? []).filter((x: ScienceEntry & { id?: string }) => (x as any).id !== s.id) }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 15, padding: '0 0 0 4px', flexShrink: 0 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {sciDraft !== null ? (
                  <div style={{
                    background: 'var(--surface2)', border: '1px solid var(--coral)',
                    borderRadius: 'var(--r-sm)', padding: '12px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <input
                      style={inp} placeholder="Публикация, конференция, учёная степень *"
                      value={sciDraft.title} autoFocus
                      onChange={e => setSciDraft(d => d && ({ ...d, title: e.target.value }))}
                    />
                    <input style={{ ...inp, maxWidth: 120 }} placeholder="Год" value={sciDraft.year} maxLength={4} inputMode="numeric"
                      onChange={e => setSciDraft(d => d && ({ ...d, year: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setSciDraft(null)} style={btnSmGhost}>Отмена</button>
                      <button
                        disabled={!sciDraft.title.trim()}
                        onClick={() => {
                          if (!sciDraft.title.trim()) return
                          const entry = { ...sciDraft, id: String(Date.now()) }
                          setDraft(d => ({ ...d, science: [...(d.science ?? []), entry] }))
                          setSciDraft(null)
                        }}
                        style={btnSmCoral(!sciDraft.title.trim())}
                      >Добавить</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setSciDraft({ title: '', year: '' })} style={addCardBtn}>
                    <span>+</span> Добавить работу
                  </button>
                )}
              </div>

              {/* Price + experience */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Цена за консультацию (сум)">
                  <input style={inp} type="number" value={draft.price_uzs}
                    onChange={e => setDraft(d => ({ ...d, price_uzs: +e.target.value }))} />
                </Field>
                <Field label="Лет опыта">
                  <input style={inp} type="number" value={draft.experience_yr}
                    onChange={e => setDraft(d => ({ ...d, experience_yr: +e.target.value }))} />
                </Field>
              </div>
            </div>

            {saveError && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 'var(--r-sm)',
                background: 'rgba(239,68,68,.10)', color: 'var(--danger)',
                fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <IconAlertCircle size={14} color="var(--danger)" /> {saveError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(false)} style={btnGhost} disabled={saving}>Отмена</button>
              <button onClick={save} disabled={saving || !draft.name.trim()} style={btnCoral}>
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--surface3)',
      borderRadius: 'var(--r-md)', padding: '16px 18px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>{emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function Chip({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 12, padding: '3px 10px', borderRadius: 'var(--r-pill)', fontWeight: 600,
      background: bg, color,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {children}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <ModalLabel>{label}</ModalLabel>
      {children}
    </div>
  )
}

function ModalLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
      {children}
    </label>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'var(--surface2)',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
}

const btnCoral: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 'var(--r-sm)', border: 'none',
  background: 'var(--coral)', color: '#fff', fontWeight: 600, fontSize: 14,
  cursor: 'pointer', minHeight: 44, fontFamily: 'inherit',
}

const btnGhost: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 'var(--r-sm)',
  border: '1px solid var(--surface3)', background: 'var(--surface2)',
  color: 'var(--text2)', fontWeight: 500, fontSize: 14,
  cursor: 'pointer', minHeight: 44, fontFamily: 'inherit',
}

const btnSmGhost: React.CSSProperties = {
  background: 'none', border: '1px solid var(--surface3)',
  borderRadius: 'var(--r-sm)', padding: '6px 12px',
  fontSize: 12, fontWeight: 600, color: 'var(--text2)',
  cursor: 'pointer', fontFamily: 'inherit', minHeight: 32,
}

const addCardBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  background: 'var(--surface2)', border: '1px dashed var(--surface3)',
  borderRadius: 'var(--r-sm)', padding: '10px 14px',
  color: 'var(--coral)', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', width: '100%', fontFamily: 'inherit',
}

function btnSmCoral(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'var(--surface3)' : 'var(--coral)',
    color: disabled ? 'var(--text3)' : '#fff',
    border: 'none', borderRadius: 'var(--r-sm)',
    padding: '6px 14px', fontSize: 12, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', minHeight: 32,
  }
}
