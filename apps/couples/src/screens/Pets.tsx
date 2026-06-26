import { useEffect, useState } from 'react'
import { IconPaw, IconArrowLeft, IconEdit, IconTrash } from '@ht/shared'
import type { Pet, PetConsultation } from '../api'
import { api, getOwnerId } from '../api'
import { t, getLang } from '../i18n'

// ── Species config ────────────────────────────────────────────
const SPECIES = [
  { key: 'cat',     emoji: '🐱', ru: 'Кошка',   uz: 'Mushuk' },
  { key: 'dog',     emoji: '🐶', ru: 'Собака',  uz: 'It' },
  { key: 'rabbit',  emoji: '🐰', ru: 'Кролик',  uz: 'Quyon' },
  { key: 'parrot',  emoji: '🦜', ru: 'Попугай', uz: "To'ti" },
  { key: 'hamster', emoji: '🐹', ru: 'Хомяк',   uz: 'Hamster' },
  { key: 'other',   emoji: '🐾', ru: 'Другое',  uz: 'Boshqa' },
]

// Species → visual identity (background tint + text color)
const SPECIES_COLORS: Record<string, { bg: string; text: string }> = {
  cat:     { bg: 'rgba(168,85,247,0.09)',  text: '#7C3AED' },
  dog:     { bg: 'rgba(242,120,75,0.10)',  text: '#C0511F' },
  rabbit:  { bg: 'rgba(20,184,166,0.09)',  text: '#0F766E' },
  parrot:  { bg: 'rgba(234,179,8,0.09)',   text: '#92400E' },
  hamster: { bg: 'rgba(234,88,12,0.09)',   text: '#9A3412' },
  fish:    { bg: 'rgba(59,130,246,0.09)',  text: '#1D4ED8' },
  other:   { bg: 'rgba(100,116,139,0.09)', text: '#475569' },
}
const sc = (species: string) => SPECIES_COLORS[species] ?? SPECIES_COLORS.other

const speciesEmoji = (key: string) => SPECIES.find(s => s.key === key)?.emoji ?? '🐾'
const speciesLabel = (key: string) => {
  const s = SPECIES.find(x => x.key === key)
  if (!s) return key
  return getLang() === 'uz' ? s.uz : s.ru
}

// ── Sex helpers ───────────────────────────────────────────────
const normSex = (sex: string) => (sex === 'm' ? 'male' : sex === 'f' ? 'female' : sex || 'unknown')
const sexLabel = (sex: string) => {
  const s = normSex(sex)
  if (s === 'male')   return t('pets.male')
  if (s === 'female') return t('pets.female')
  return t('pets.unknown')
}

// ── Age calculator ────────────────────────────────────────────
const calcAge = (birthDate: string | null) => {
  if (!birthDate) return null
  try {
    const months = (new Date().getFullYear() - new Date(birthDate).getFullYear()) * 12
      + (new Date().getMonth() - new Date(birthDate).getMonth())
    if (months < 1) return null
    if (months < 12) return getLang() === 'uz' ? `${months} oy` : `${months} мес.`
    const y = Math.floor(months / 12)
    if (getLang() === 'uz') return `${y} yil`
    return `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'}`
  } catch { return null }
}

// ── Extended fields (stored in localStorage) ─────────────────
type PetExt = { microchip: string; allergies: string; vet_name: string; vet_phone: string; vet_website: string; sterilized: string }
const EXT0: PetExt = { microchip: '', allergies: '', vet_name: '', vet_phone: '', vet_website: '', sterilized: 'unknown' }
const loadExt = (id: string): PetExt => { try { return { ...EXT0, ...JSON.parse(localStorage.getItem(`ht_pet_ext_${id}`) ?? '{}') } } catch { return { ...EXT0 } } }
const saveExt = (id: string, e: PetExt) => localStorage.setItem(`ht_pet_ext_${id}`, JSON.stringify(e))

// ── Date formatter ────────────────────────────────────────────
const fmtDate = (d: string | null) => {
  if (!d) return null
  try { return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

// ── View state ────────────────────────────────────────────────
type View = { t: 'list' } | { t: 'card'; pet: Pet } | { t: 'edit'; pet: Pet }

// ═══════════════════════════════════════════════════════════════
export default function Pets({ lang }: { lang: string }) {
  void lang
  const [view, setView] = useState<View>({ t: 'list' })
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', species: 'cat', sex: 'male' })
  const [addErr, setAddErr] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    api.pets(getOwnerId()).then(list => { setPets(list); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const addPet = async () => {
    if (!addForm.name.trim()) { setAddErr(t('book.pet_empty')); return }
    setSaving(true); setAddErr('')
    try {
      const pet = await api.createPet({
        owner_id: getOwnerId(),
        name: addForm.name.trim(),
        species: addForm.species,
        sex: addForm.sex,
        avatar_emoji: speciesEmoji(addForm.species),
      })
      setPets(p => [...p, pet])
      setShowAdd(false)
      setAddForm({ name: '', species: 'cat', sex: 'male' })
    } catch { setAddErr(t('error')) }
    finally { setSaving(false) }
  }

  if (view.t === 'card') return (
    <PetCard
      pet={view.pet}
      onBack={() => setView({ t: 'list' })}
      onEdit={() => setView({ t: 'edit', pet: view.pet })}
    />
  )
  if (view.t === 'edit') return (
    <PetEditForm
      pet={view.pet}
      onBack={() => setView({ t: 'card', pet: view.pet })}
      onSaved={updated => { setPets(p => p.map(x => x.id === updated.id ? updated : x)); setView({ t: 'card', pet: updated }) }}
      onDeleted={id => { setPets(p => p.filter(x => x.id !== id)); setView({ t: 'list' }) }}
    />
  )

  // ── List view ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{t('pets.title')}</span>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            aria-label={t('pets.add')}
            style={{
              width: 44, height: 44, borderRadius: 'var(--r-md)',
              background: 'var(--primary)', color: '#fff', border: 'none',
              fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontWeight: 400,
            }}
          >+</button>
        )}
      </header>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Shimmer loading */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                height: 146, borderRadius: 'var(--r-lg)',
                background: 'linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && pets.length === 0 && !showAdd && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 16, textAlign: 'center' }}>
            <IconPaw size={56} color="var(--text-muted)" />
            <div style={{ fontWeight: 700, fontSize: 18 }}>{t('pets.empty')}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 260 }}>{t('pets.empty_sub')}</div>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: '12px 28px', borderRadius: 'var(--r-pill)',
                background: 'var(--primary)', color: '#fff', border: 'none',
                fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{t('pets.add')}</button>
          </div>
        )}

        {/* 2-column pet grid */}
        {!loading && pets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {pets.map(pet => (
              <PetTile key={pet.id} pet={pet} onOpen={() => setView({ t: 'card', pet })} />
            ))}
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '18px 16px',
            display: 'flex', flexDirection: 'column', gap: 14,
            animation: 'scale-in 160ms ease-out',
          }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{t('pets.add')}</div>

            <Field label={t('pets.add_name')}>
              <input
                autoFocus
                value={addForm.name}
                onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addPet()}
                placeholder="Барсик"
                maxLength={50}
                style={inputStyle}
              />
            </Field>

            <Field label={t('pets.add_species')}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {SPECIES.map(s => {
                  const colors = sc(s.key)
                  const active = addForm.species === s.key
                  return (
                    <button key={s.key} onClick={() => setAddForm(f => ({ ...f, species: s.key }))}
                      style={{
                        padding: '10px 8px', borderRadius: 'var(--r-lg)',
                        border: `2px solid ${active ? colors.text : 'var(--border)'}`,
                        background: active ? colors.bg : 'transparent',
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        transition: 'all .12s',
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{s.emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: active ? colors.text : 'var(--text-muted)' }}>
                        {getLang() === 'uz' ? s.uz : s.ru}
                      </span>
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label={t('pets.add_sex')}>
              <SegmentToggle
                options={[{ k: 'male', l: t('pets.male') }, { k: 'female', l: t('pets.female') }]}
                value={addForm.sex}
                onChange={v => setAddForm(f => ({ ...f, sex: v }))}
              />
            </Field>

            {addErr && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{addErr}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowAdd(false); setAddErr('') }}
                style={{ flex: 1, padding: '12px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--border)', background: 'transparent', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48 }}
              >{t('back')}</button>
              <button onClick={addPet} disabled={saving}
                style={{ flex: 2, padding: '12px', borderRadius: 'var(--r-pill)', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48, opacity: saving ? 0.6 : 1 }}
              >{saving ? '…' : t('pets.add_save')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PetTile — 2-column grid card ─────────────────────────────
function PetTile({ pet, onOpen }: { pet: Pet; onOpen: () => void }) {
  const colors = sc(pet.species)
  const age = calcAge(pet.birth_date)

  return (
    <button
      onClick={onOpen}
      style={{
        borderRadius: 'var(--r-lg)', background: 'var(--surface)',
        border: '1px solid var(--border)', overflow: 'hidden',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        padding: 0, display: 'flex', flexDirection: 'column',
        transition: 'border-color .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = colors.text)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Colored zone with emoji */}
      <div style={{
        background: colors.bg,
        height: 88, width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44, flexShrink: 0,
      }}>
        {pet.avatar_emoji}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontWeight: 700, fontSize: 15, lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 5,
        }}>
          {pet.name}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px',
            borderRadius: 'var(--r-pill)', background: colors.bg, color: colors.text,
          }}>
            {speciesLabel(pet.species)}
          </span>
          {age && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              {age}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
// PetCard — detail view
// ═══════════════════════════════════════════════════════════════
function PetCard({ pet, onBack, onEdit }: { pet: Pet; onBack: () => void; onEdit: () => void }) {
  const ext = loadExt(pet.id)
  const colors = sc(pet.species)
  const age = calcAge(pet.birth_date)
  const sex = normSex(pet.sex)
  const uz = getLang() === 'uz'

  const sterilLabel = () => {
    if (ext.sterilized === 'yes') return t('pets.steril_yes')
    if (ext.sterilized === 'no')  return t('pets.steril_no')
    return null
  }

  // Only render rows that have a value
  const basicRows = [
    { label: t('pets.breed'),     value: pet.breed ?? null },
    { label: t('pets.birthday'),  value: fmtDate(pet.birth_date) },
    { label: t('pets.gender'),    value: sex !== 'unknown' ? sexLabel(pet.sex) : null },
    { label: t('pets.sterilized'), value: sterilLabel() },
  ].filter(r => r.value !== null)

  const bodyRows = [
    { label: t('pets.weight_label'), value: pet.weight_kg ? `${pet.weight_kg} кг` : null },
    { label: t('pets.microchip'),    value: ext.microchip || null },
  ].filter(r => r.value !== null)

  const healthRows = [
    { label: t('pets.allergies'), value: ext.allergies || null },
  ].filter(r => r.value !== null)

  const vetRows = [
    { label: t('pets.vet_name'),    value: ext.vet_name || null },
    { label: t('pets.vet_phone'),   value: ext.vet_phone || null },
    { label: t('pets.vet_website'), value: ext.vet_website || null },
  ].filter(r => r.value !== null)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      paddingBottom: 72, background: 'var(--bg)',
      animation: 'slide-in 180ms ease-out',
    }}>
      {/* Sticky header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} aria-label={t('back')} style={iconBtn}>
          <IconArrowLeft size={18} />
        </button>
        <span style={{
          fontWeight: 700, fontSize: 16, flex: 1, textAlign: 'center',
          margin: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {pet.name}
        </span>
        <button onClick={onEdit} aria-label={t('pets.edit_profile')} style={{ ...iconBtn, background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}>
          <IconEdit size={16} />
        </button>
      </header>

      {/* Species-colored hero */}
      <div style={{
        background: colors.bg,
        padding: '28px 20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 82, height: 82, borderRadius: 'var(--r-xl)',
          background: 'rgba(255,255,255,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 46,
        }}>
          {pet.avatar_emoji}
        </div>
        <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>{pet.name}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px',
            borderRadius: 'var(--r-pill)',
            background: 'rgba(255,255,255,0.65)', color: colors.text,
          }}>
            {speciesEmoji(pet.species)} {speciesLabel(pet.species)}
          </span>
          {age && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px',
              borderRadius: 'var(--r-pill)',
              background: 'rgba(255,255,255,0.65)', color: 'var(--text-muted)',
            }}>
              🎂 {age}
            </span>
          )}
          {pet.breed && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px',
              borderRadius: 'var(--r-pill)',
              background: 'rgba(255,255,255,0.65)', color: 'var(--text-muted)',
            }}>
              {pet.breed}
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {basicRows.length > 0 && (
          <InfoSection title={uz ? 'Asosiy' : 'Основное'} rows={basicRows} />
        )}

        {bodyRows.length > 0 && (
          <InfoSection title={uz ? 'Tana' : 'Тело'} rows={bodyRows} />
        )}

        {healthRows.length > 0 && (
          <InfoSection title={uz ? 'Salomatlik' : 'Здоровье'} rows={healthRows} />
        )}

        {vetRows.length > 0 && (
          <InfoSection title={uz ? 'Veterinar' : 'Ветеринар'} rows={vetRows} />
        )}

        {pet.notes && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '14px 16px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              {t('pets.notes_label')}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65 }}>{pet.notes}</div>
          </div>
        )}

        {/* Consultation history */}
        <PetConsultHistory petId={pet.id} />
      </div>
    </div>
  )
}

// ─── InfoSection ──────────────────────────────────────────────
function InfoSection({ title, rows }: { title: string; rows: { label: string; value: string | null }[] }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '9px 16px', borderBottom: '1px solid var(--border)',
        fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
      }}>
        {title}
      </div>
      {rows.map((r, i) => (
        <div key={r.label} style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '11px 16px', gap: 12,
          borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}>{r.label}</span>
          <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PetEditForm
// ═══════════════════════════════════════════════════════════════
function PetEditForm({ pet, onBack, onSaved, onDeleted }: {
  pet: Pet
  onBack: () => void
  onSaved: (p: Pet) => void
  onDeleted: (id: string) => void
}) {
  const ext0 = loadExt(pet.id)
  const [f, setF] = useState({
    name:        pet.name,
    species:     pet.species,
    sex:         normSex(pet.sex),
    birth_date:  pet.birth_date ?? '',
    breed:       pet.breed ?? '',
    weight_kg:   pet.weight_kg != null ? String(pet.weight_kg) : '',
    notes:       pet.notes ?? '',
    avatar_emoji: pet.avatar_emoji,
    microchip:   ext0.microchip,
    allergies:   ext0.allergies,
    vet_name:    ext0.vet_name,
    vet_phone:   ext0.vet_phone,
    vet_website: ext0.vet_website,
    sterilized:  ext0.sterilized,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const upd = (key: string, val: string) => setF(p => ({ ...p, [key]: val }))

  const save = async () => {
    if (!f.name.trim()) { setErr(t('book.pet_empty')); return }
    setSaving(true); setErr('')
    try {
      const updated = await api.updatePet(pet.id, {
        name:         f.name.trim(),
        species:      f.species,
        sex:          f.sex,
        avatar_emoji: f.avatar_emoji,
        breed:        f.breed.trim() || null,
        birth_date:   f.birth_date || null,
        weight_kg:    f.weight_kg ? parseFloat(f.weight_kg) : null,
        notes:        f.notes.trim() || null,
      })
      saveExt(pet.id, {
        microchip:   f.microchip.trim(),
        allergies:   f.allergies.trim(),
        vet_name:    f.vet_name.trim(),
        vet_phone:   f.vet_phone.trim(),
        vet_website: f.vet_website.trim(),
        sterilized:  f.sterilized,
      })
      onSaved(updated)
    } catch { setErr(t('error')) }
    finally { setSaving(false) }
  }

  const deletePet = async () => {
    setDeleting(true)
    try { await api.deletePet(pet.id); onDeleted(pet.id) }
    catch { setErr(t('error')); setDeleting(false); setConfirmDelete(false) }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72,
      animation: 'slide-in 180ms ease-out',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} aria-label={t('back')} style={iconBtn}><IconArrowLeft size={18} /></button>
        <span style={{ fontWeight: 700, fontSize: 16, flex: 1, textAlign: 'center', margin: '0 8px' }}>
          {t('pets.edit_profile')}
        </span>
        <button onClick={save} disabled={saving}
          style={{
            padding: '8px 18px', borderRadius: 'var(--r-pill)',
            background: 'var(--primary)', color: '#fff', border: 'none',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            minHeight: 36, opacity: saving ? 0.6 : 1,
          }}
        >{saving ? '…' : t('pets.save')}</button>
      </header>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Avatar picker */}
        <div style={{ padding: '20px 0 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 'var(--r-xl)',
            background: sc(f.species).bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
          }}>
            {f.avatar_emoji}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SPECIES.map(s => (
              <button key={s.key} onClick={() => { upd('species', s.key); upd('avatar_emoji', s.emoji) }}
                style={{
                  width: 40, height: 40, borderRadius: 'var(--r-md)',
                  border: `2px solid ${f.species === s.key ? sc(s.key).text : 'var(--border)'}`,
                  background: f.species === s.key ? sc(s.key).bg : 'transparent',
                  fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .12s',
                }}
              >{s.emoji}</button>
            ))}
          </div>
        </div>

        <FormCard>
          <FormRow label={t('pets.add_name')} count={`${f.name.length}/50`}>
            <input value={f.name} onChange={e => upd('name', e.target.value)} maxLength={50} style={inputStyle} />
          </FormRow>
          <FormRow label={t('pets.breed')}>
            <input value={f.breed} onChange={e => upd('breed', e.target.value)} style={inputStyle} />
          </FormRow>
          <FormRow label={t('pets.birthday')}>
            <input type="date" value={f.birth_date} onChange={e => upd('birth_date', e.target.value)} style={inputStyle} />
          </FormRow>
        </FormCard>

        <FormCard>
          <FormRow label={t('pets.gender')}>
            <SegmentToggle
              options={[{ k: 'male', l: t('pets.male') }, { k: 'female', l: t('pets.female') }, { k: 'unknown', l: t('pets.unknown') }]}
              value={f.sex} onChange={v => upd('sex', v)}
            />
          </FormRow>
          <FormRow label={t('pets.sterilized')}>
            <SegmentToggle
              options={[{ k: 'yes', l: t('pets.steril_yes') }, { k: 'no', l: t('pets.steril_no') }, { k: 'unknown', l: t('pets.unknown') }]}
              value={f.sterilized} onChange={v => upd('sterilized', v)}
            />
          </FormRow>
        </FormCard>

        <FormCard>
          <FormRow label={t('pets.weight_label')}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="number" value={f.weight_kg} onChange={e => upd('weight_kg', e.target.value)} min={0} max={200} step={0.1} style={{ ...inputStyle, flex: 1 }} />
              <span style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }}>кг</span>
            </div>
          </FormRow>
          <FormRow label={t('pets.microchip')} count={`${f.microchip.length}/15`}>
            <input value={f.microchip} onChange={e => upd('microchip', e.target.value)} maxLength={15} style={inputStyle} />
          </FormRow>
          <FormRow label={t('pets.allergies')}>
            <input value={f.allergies} onChange={e => upd('allergies', e.target.value)} maxLength={200} style={inputStyle} />
          </FormRow>
        </FormCard>

        <FormCard>
          <FormRow label={t('pets.vet_name')} count={`${f.vet_name.length}/50`}>
            <input value={f.vet_name} onChange={e => upd('vet_name', e.target.value)} maxLength={50} style={inputStyle} />
          </FormRow>
          <FormRow label={t('pets.vet_phone')} count={`${f.vet_phone.length}/20`}>
            <input type="tel" value={f.vet_phone} onChange={e => upd('vet_phone', e.target.value)} maxLength={20} style={inputStyle} />
          </FormRow>
          <FormRow label={t('pets.vet_website')} count={`${f.vet_website.length}/100`}>
            <input value={f.vet_website} onChange={e => upd('vet_website', e.target.value)} maxLength={100} style={inputStyle} />
          </FormRow>
        </FormCard>

        <FormCard>
          <FormRow label={t('pets.notes_label')} count={`${f.notes.length}/500`}>
            <textarea
              value={f.notes}
              onChange={e => upd('notes', e.target.value)}
              maxLength={500}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', height: 'auto' }}
            />
          </FormRow>
        </FormCard>

        {err && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>{err}</div>}

        {/* Delete */}
        <div style={{ marginTop: 20, paddingBottom: 8 }}>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              style={{
                width: '100%', padding: '14px', borderRadius: 'var(--r-pill)',
                background: 'transparent', border: '1.5px solid var(--danger)', color: 'var(--danger)',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <IconTrash size={16} /> {t('pets.delete')}
            </button>
          ) : (
            <div style={{
              background: 'var(--surface)', border: '1.5px solid var(--danger)',
              borderRadius: 'var(--r-lg)', padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>
                {t('pets.confirm_delete')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--border)', background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48 }}
                >{t('back')}</button>
                <button onClick={deletePet} disabled={deleting}
                  style={{ flex: 2, padding: '12px', borderRadius: 'var(--r-pill)', background: 'var(--danger)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48, opacity: deleting ? 0.6 : 1 }}
                >{deleting ? '…' : t('pets.delete')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PetConsultHistory
// ═══════════════════════════════════════════════════════════════
function PetConsultHistory({ petId }: { petId: string }) {
  const [consults, setConsults] = useState<PetConsultation[] | null>(null)
  const uz = getLang() === 'uz'

  useEffect(() => {
    api.petConsultations(petId).then(setConsults).catch(() => setConsults([]))
  }, [petId])

  if (!consults || consults.length === 0) return null

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '9px 16px', borderBottom: '1px solid var(--border)',
        fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
      }}>
        {uz ? 'Maslahatlar tarixi' : 'История консультаций'}
      </div>

      {consults.map((c, i) => (
        <div key={c.id} style={{
          padding: '14px 16px',
          borderBottom: i < consults.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          {/* Vet row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: c.report ? 10 : 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {c.avatar_emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{c.vet_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{c.specialty}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
              {fmtDate(c.created_at)}
            </div>
          </div>

          {/* Diagnosis block */}
          {c.report && (
            <div style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.18)',
              borderRadius: 'var(--r-md)', padding: '10px 12px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>
                {uz ? 'Tashxis' : 'Диагноз'}: {c.report.diagnosis}
              </div>
              {c.report.steps.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
                  {c.report.steps.slice(0, 3).map((s, j) => <li key={j}>{s}</li>)}
                  {c.report.steps.length > 3 && (
                    <li style={{ listStyle: 'none', color: 'var(--primary)', fontWeight: 600 }}>
                      +{c.report.steps.length - 3} {uz ? "ko'proq" : 'ещё'}
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Primitives
// ═══════════════════════════════════════════════════════════════

const iconBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 'var(--r-md)',
  border: '1.5px solid var(--border)', background: 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)',
  border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'inherit',
  minHeight: 44, boxSizing: 'border-box', background: 'var(--bg)', color: 'var(--text)',
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

function FormRow({ label, count, children }: { label: string; count?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
        {count && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count}</span>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function SegmentToggle({ options, value, onChange }: {
  options: { k: string; l: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{
      display: 'flex', borderRadius: 'var(--r-md)',
      border: '1.5px solid var(--border)', overflow: 'hidden',
      background: 'var(--surface-2)',
    }}>
      {options.map((o, i) => (
        <button key={o.k} onClick={() => onChange(o.k)}
          style={{
            flex: 1, padding: '10px 6px', border: 'none',
            borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
            background: value === o.k ? 'var(--primary)' : 'transparent',
            color: value === o.k ? '#fff' : 'var(--text-muted)',
            fontSize: 13, fontWeight: value === o.k ? 700 : 500,
            cursor: 'pointer', fontFamily: 'inherit', minHeight: 44, transition: 'all .15s',
          }}
        >{o.l}</button>
      ))}
    </div>
  )
}
