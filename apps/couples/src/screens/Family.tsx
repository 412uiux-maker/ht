import { useState, useEffect } from 'react'
import type { Pet } from '../api'
import { api, getOwnerId } from '../api'
import { t, getLang } from '../i18n'
import { SPECIES, SPECIES_COLORS, speciesEmoji, PetTile, PetCard, PetEditForm } from './Pets'
import PersonCard from './PersonCard'
import PetHealthCard from './PetHealthCard'
import PetPassport from './PetPassport'

// ── Person type ───────────────────────────────────────────────
export type Person = {
  id: string
  name: string
  role: 'adult' | 'child'
  birth_date?: string
  avatar_emoji: string
}

const PERSON_KEY = 'ht_persons'
const loadPersons = (): Person[] => {
  try { return JSON.parse(localStorage.getItem(PERSON_KEY) ?? '[]') } catch { return [] }
}
const savePersons = (p: Person[]) => localStorage.setItem(PERSON_KEY, JSON.stringify(p))

// ── Age calc ──────────────────────────────────────────────────
const calcPersonAge = (d?: string) => {
  if (!d) return null
  try {
    const months = (new Date().getFullYear() - new Date(d).getFullYear()) * 12
      + (new Date().getMonth() - new Date(d).getMonth())
    if (months < 1) return null
    if (months < 12) return getLang() === 'uz' ? `${months} oy` : `${months} мес.`
    const y = Math.floor(months / 12)
    return getLang() === 'uz' ? `${y} yil` : `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'}`
  } catch { return null }
}

// ── Types ─────────────────────────────────────────────────────
type Section = 'pets' | 'people'
type PetView = { t: 'list' } | { t: 'card'; pet: Pet } | { t: 'edit'; pet: Pet } | { t: 'health'; pet: Pet } | { t: 'passport'; pet: Pet }
type PersonView = { t: 'list' } | { t: 'card'; person: Person }

// ── Shared mini-components ────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
  borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
  fontSize: 15, fontFamily: 'inherit', minHeight: 44,
  background: 'var(--bg)', color: 'var(--text)',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
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
    <div style={{ display: 'flex', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', overflow: 'hidden', background: 'var(--surface-2)' }}>
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

// ── Person tile ───────────────────────────────────────────────
const PERSON_COLORS: Record<'adult' | 'child', { bg: string; text: string }> = {
  adult: { bg: 'rgba(59,130,246,0.09)', text: '#1D4ED8' },
  child: { bg: 'rgba(234,88,12,0.09)',  text: '#9A3412' },
}

function PersonTile({ person, onOpen, onDelete }: { person: Person; onOpen: () => void; onDelete: (id: string) => void }) {
  const age = calcPersonAge(person.birth_date)
  const colors = PERSON_COLORS[person.role]
  const emoji = person.role === 'child' ? '🧒' : '👤'
  const roleLabel = person.role === 'adult'
    ? (getLang() === 'uz' ? 'Katta' : 'Взрослый')
    : (getLang() === 'uz' ? 'Bola' : 'Ребёнок')

  return (
    <button
      onClick={onOpen}
      style={{
        borderRadius: 'var(--r-lg)', background: 'var(--surface)',
        border: '1px solid var(--border)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', position: 'relative',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: 0,
        transition: 'border-color .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = colors.text)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{
        background: colors.bg, height: 88, width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44,
      }}>{emoji}</div>

      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.name}</div>
        {age && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{age}</div>}
        <div style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>{roleLabel}</div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete(person.id) }}
        aria-label="Удалить"
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(0,0,0,0.15)', border: 'none',
          color: '#fff', fontSize: 16, lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      >×</button>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════
export default function Family({ lang, onAskVet, initialHealthPetId }: {
  lang: string
  onAskVet?: (petId: string, reasonEventId?: string) => void
  initialHealthPetId?: string
}) {
  void lang
  const [section, setSection] = useState<Section>('pets')
  const [petView, setPetView] = useState<PetView>({ t: 'list' })
  const [personView, setPersonView] = useState<PersonView>({ t: 'list' })

  // ── Pets state ────────────────────────────────────────────────
  const [pets, setPets] = useState<Pet[]>([])
  const [petsLoading, setPetsLoading] = useState(true)
  const [showAddPet, setShowAddPet] = useState(false)
  const [addPetForm, setAddPetForm] = useState({ name: '', species: 'cat', sex: 'male' })
  const [addPetErr, setAddPetErr] = useState('')
  const [addPetSaving, setAddPetSaving] = useState(false)

  // ── People state ──────────────────────────────────────────────
  const [persons, setPersons] = useState<Person[]>(loadPersons)
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [addPersonForm, setAddPersonForm] = useState({ name: '', role: 'adult' as 'adult' | 'child', birth_date: '' })
  const [addPersonErr, setAddPersonErr] = useState('')

  const loadPets = () => {
    setPetsLoading(true)
    api.pets(getOwnerId())
      .then(list => {
        setPets(list)
        setPetsLoading(false)
        // Deep-link: open health card of the specified pet after pets are loaded
        if (initialHealthPetId) {
          const target = list.find(p => p.id === initialHealthPetId)
          if (target) setPetView({ t: 'health', pet: target })
        }
      })
      .catch(() => setPetsLoading(false))
  }
  useEffect(() => { loadPets() }, [])

  const addPet = async () => {
    if (!addPetForm.name.trim()) { setAddPetErr(t('book.pet_empty')); return }
    setAddPetSaving(true); setAddPetErr('')
    try {
      const pet = await api.createPet({
        owner_id: getOwnerId(),
        name: addPetForm.name.trim(),
        species: addPetForm.species,
        sex: addPetForm.sex,
        avatar_emoji: speciesEmoji(addPetForm.species),
      })
      setPets(p => [...p, pet])
      setShowAddPet(false)
      setAddPetForm({ name: '', species: 'cat', sex: 'male' })
    } catch { setAddPetErr(t('error')) }
    finally { setAddPetSaving(false) }
  }

  const addPerson = () => {
    if (!addPersonForm.name.trim()) {
      setAddPersonErr(getLang() === 'uz' ? 'Ism kiriting' : 'Введите имя')
      return
    }
    const person: Person = {
      id: Date.now().toString(),
      name: addPersonForm.name.trim(),
      role: addPersonForm.role,
      birth_date: addPersonForm.birth_date || undefined,
      avatar_emoji: addPersonForm.role === 'child' ? '🧒' : '👤',
    }
    const updated = [...persons, person]
    setPersons(updated)
    savePersons(updated)
    setShowAddPerson(false)
    setAddPersonForm({ name: '', role: 'adult', birth_date: '' })
    setAddPersonErr('')
  }

  const deletePerson = (id: string) => {
    const updated = persons.filter(p => p.id !== id)
    setPersons(updated)
    savePersons(updated)
  }

  // ── Full-screen detail views ──────────────────────────────────
  if (personView.t === 'card') return (
    <PersonCard
      person={personView.person}
      onBack={() => setPersonView({ t: 'list' })}
    />
  )

  if (petView.t === 'passport') return (
    <PetPassport
      pet={petView.pet}
      onBack={() => setPetView({ t: 'card', pet: petView.pet })}
      onGoToHealthCard={() => setPetView({ t: 'health', pet: petView.pet })}
    />
  )

  if (petView.t === 'health') return (
    <PetHealthCard
      pet={petView.pet}
      onBack={() => setPetView({ t: 'card', pet: petView.pet })}
      onAskVet={onAskVet ? (reasonEventId) => onAskVet(petView.pet.id, reasonEventId) : undefined}
    />
  )

  if (petView.t === 'card') return (
    <PetCard
      pet={petView.pet}
      onBack={() => setPetView({ t: 'list' })}
      onEdit={() => setPetView({ t: 'edit', pet: petView.pet })}
      onHealth={() => setPetView({ t: 'health', pet: petView.pet })}
      onPassport={() => setPetView({ t: 'passport', pet: petView.pet })}
    />
  )
  if (petView.t === 'edit') return (
    <PetEditForm
      pet={petView.pet}
      onBack={() => setPetView({ t: 'card', pet: petView.pet })}
      onSaved={updated => {
        setPets(p => p.map(x => x.id === updated.id ? updated : x))
        setPetView({ t: 'card', pet: updated })
      }}
      onDeleted={id => {
        setPets(p => p.filter(x => x.id !== id))
        setPetView({ t: 'list' })
      }}
    />
  )

  const isRu = getLang() !== 'uz'

  // ── Main family screen ────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>

      {/* Sticky header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 8px' }}>
          <span style={{ fontWeight: 700, fontSize: 17 }}>
            {isRu ? 'Моя семья' : 'Mening oilam'}
          </span>
          {section === 'pets' && !showAddPet && (
            <button
              onClick={() => setShowAddPet(true)}
              aria-label={t('pets.add')}
              style={{
                width: 44, height: 44, borderRadius: 'var(--r-md)',
                background: 'var(--primary)', color: '#fff', border: 'none',
                fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >+</button>
          )}
          {section === 'people' && !showAddPerson && (
            <button
              onClick={() => setShowAddPerson(true)}
              aria-label={isRu ? 'Добавить члена семьи' : 'Oila a\'zosini qo\'shish'}
              style={{
                width: 44, height: 44, borderRadius: 'var(--r-md)',
                background: 'var(--primary)', color: '#fff', border: 'none',
                fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >+</button>
          )}
        </div>

        {/* Section switcher */}
        <div style={{ display: 'flex', padding: '0 20px 12px', gap: 8 }}>
          {(['pets', 'people'] as const).map(s => {
            const isActive = section === s
            return (
              <button
                key={s}
                onClick={() => { setSection(s); setShowAddPet(false); setShowAddPerson(false) }}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 'var(--r-pill)',
                  border: `1.5px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                  background: isActive ? 'rgba(242,120,75,0.10)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all .15s',
                }}
              >
                {s === 'pets'
                  ? <>🐾 {isRu ? 'Питомцы' : 'Hayvonlar'}</>
                  : <>👤 {isRu ? 'Люди' : 'Odamlar'}</>}
              </button>
            )
          })}
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── PETS SECTION ──────────────────────────────────────── */}
        {section === 'pets' && (
          <>
            {petsLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    height: 146, borderRadius: 'var(--r-lg)',
                    background: 'linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`,
                  }} />
                ))}
              </div>
            )}

            {!petsLoading && pets.length === 0 && !showAddPet && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 16, textAlign: 'center' }}>
                <span style={{ fontSize: 56 }}>🐾</span>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{t('pets.empty')}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 260 }}>{t('pets.empty_sub')}</div>
                <button
                  onClick={() => setShowAddPet(true)}
                  style={{
                    padding: '12px 28px', borderRadius: 'var(--r-pill)',
                    background: 'var(--primary)', color: '#fff', border: 'none',
                    fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{t('pets.add')}</button>
              </div>
            )}

            {!petsLoading && pets.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {pets.map(pet => (
                  <PetTile key={pet.id} pet={pet} onOpen={() => setPetView({ t: 'card', pet })} />
                ))}
              </div>
            )}

            {showAddPet && (
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
                    value={addPetForm.name}
                    onChange={e => setAddPetForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addPet()}
                    placeholder={isRu ? 'Барсик' : 'Mushuk'}
                    maxLength={50}
                    style={inputStyle}
                  />
                </Field>

                <Field label={t('pets.add_species')}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {SPECIES.map(s => {
                      const colors = SPECIES_COLORS[s.key] ?? SPECIES_COLORS.other
                      const active = addPetForm.species === s.key
                      return (
                        <button key={s.key} onClick={() => setAddPetForm(f => ({ ...f, species: s.key }))}
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
                    value={addPetForm.sex}
                    onChange={v => setAddPetForm(f => ({ ...f, sex: v }))}
                  />
                </Field>

                {addPetErr && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{addPetErr}</div>}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowAddPet(false); setAddPetErr('') }}
                    style={{ flex: 1, padding: '12px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--border)', background: 'transparent', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48 }}
                  >{t('back')}</button>
                  <button onClick={addPet} disabled={addPetSaving}
                    style={{ flex: 2, padding: '12px', borderRadius: 'var(--r-pill)', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48, opacity: addPetSaving ? 0.6 : 1 }}
                  >{addPetSaving ? '…' : t('pets.add_save')}</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PEOPLE SECTION ────────────────────────────────────── */}
        {section === 'people' && (
          <>
            {persons.length === 0 && !showAddPerson && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 16, textAlign: 'center' }}>
                <span style={{ fontSize: 56 }}>👨‍👩‍👧‍👦</span>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {isRu ? 'Добавьте членов семьи' : 'Oila a\'zolarini qo\'shing'}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 260 }}>
                  {isRu
                    ? 'Отслеживайте здоровье всей семьи в одном месте'
                    : 'Butun oila salomatligini bir joyda kuzating'}
                </div>
                <button
                  onClick={() => setShowAddPerson(true)}
                  style={{
                    padding: '12px 28px', borderRadius: 'var(--r-pill)',
                    background: 'var(--primary)', color: '#fff', border: 'none',
                    fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >{isRu ? 'Добавить' : 'Qo\'shish'}</button>
              </div>
            )}

            {persons.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {persons.map(person => (
                  <PersonTile key={person.id} person={person} onOpen={() => setPersonView({ t: 'card', person })} onDelete={deletePerson} />
                ))}
              </div>
            )}

            {showAddPerson && (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: '18px 16px',
                display: 'flex', flexDirection: 'column', gap: 14,
                animation: 'scale-in 160ms ease-out',
              }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {isRu ? 'Добавить члена семьи' : 'Oila a\'zosini qo\'shish'}
                </div>

                <Field label={isRu ? 'Имя' : 'Ism'}>
                  <input
                    autoFocus
                    value={addPersonForm.name}
                    onChange={e => setAddPersonForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addPerson()}
                    placeholder={isRu ? 'Алишер' : 'Alisher'}
                    maxLength={60}
                    style={inputStyle}
                  />
                </Field>

                <Field label={isRu ? 'Кто это?' : 'Kim bu?'}>
                  <SegmentToggle
                    options={[
                      { k: 'adult', l: isRu ? 'Взрослый' : 'Katta' },
                      { k: 'child', l: isRu ? 'Ребёнок' : 'Bola' },
                    ]}
                    value={addPersonForm.role}
                    onChange={v => setAddPersonForm(f => ({ ...f, role: v as 'adult' | 'child' }))}
                  />
                </Field>

                <Field label={isRu ? 'Дата рождения (необязательно)' : 'Tug\'ilgan sana (ixtiyoriy)'}>
                  <input
                    type="date"
                    value={addPersonForm.birth_date}
                    onChange={e => setAddPersonForm(f => ({ ...f, birth_date: e.target.value }))}
                    style={inputStyle}
                  />
                </Field>

                {addPersonErr && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{addPersonErr}</div>}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowAddPerson(false); setAddPersonErr('') }}
                    style={{ flex: 1, padding: '12px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--border)', background: 'transparent', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48 }}
                  >{t('back')}</button>
                  <button onClick={addPerson}
                    style={{ flex: 2, padding: '12px', borderRadius: 'var(--r-pill)', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48 }}
                  >{isRu ? 'Добавить' : 'Qo\'shish'}</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
