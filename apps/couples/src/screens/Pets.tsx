import { useEffect, useState } from 'react'
import type { Pet } from '../api'
import { api, getOwnerId } from '../api'
import { t } from '../i18n'

const SPECIES_OPTS = [
  { key: 'cat',    emoji: '🐱', label: 'Кошка / Mushuk' },
  { key: 'dog',    emoji: '🐶', label: 'Собака / It' },
  { key: 'rabbit', emoji: '🐰', label: 'Кролик / Quyon' },
  { key: 'parrot', emoji: '🦜', label: 'Попугай / To\'ti' },
  { key: 'hamster',emoji: '🐹', label: 'Хомяк / Hamster' },
  { key: 'other',  emoji: '🐾', label: 'Другое / Boshqa' },
]

const SPECIES_EMOJI: Record<string, string> = Object.fromEntries(SPECIES_OPTS.map(s => [s.key, s.emoji]))

type AddForm = { name: string; species: string; sex: string }

export default function Pets({ lang }: { lang: string }) {
  void lang
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>({ name: '', species: 'cat', sex: 'm' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const load = () => {
    setLoading(true)
    api.pets(getOwnerId()).then(list => { setPets(list); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name.trim()) { setErr(t('book.pet_empty')); return }
    setSaving(true); setErr('')
    try {
      const pet = await api.createPet({
        owner_id: getOwnerId(),
        name: form.name.trim(),
        species: form.species,
        sex: form.sex,
        avatar_emoji: SPECIES_EMOJI[form.species] ?? '🐾',
      })
      setPets(p => [...p, pet])
      setShowAdd(false)
      setForm({ name: '', species: 'cat', sex: 'm' })
    } catch {
      setErr(t('error'))
    } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    await api.deletePet(id).catch(() => {})
    setPets(p => p.filter(x => x.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 72 }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'var(--surface)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{t('pets.title')}</span>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            background: 'var(--primary)', color: '#fff', border: 'none',
            fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >+</button>
      </header>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>{t('loading')}</div>
        )}

        {!loading && pets.length === 0 && !showAdd && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '60px 24px', gap: 16, textAlign: 'center',
          }}>
            <span style={{ fontSize: 56 }}>🐾</span>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{t('pets.empty')}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 260 }}>{t('pets.empty_sub')}</div>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                padding: '12px 28px', borderRadius: 'var(--r-pill)',
                background: 'var(--primary)', color: '#fff',
                border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{t('pets.add')}</button>
          </div>
        )}

        {!loading && pets.map(pet => (
          <div key={pet.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, flexShrink: 0,
            }}>{pet.avatar_emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{pet.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                <span>{SPECIES_OPTS.find(s => s.key === pet.species)?.emoji} {pet.species}</span>
                <span>·</span>
                <span>{pet.sex === 'f' ? t('pets.female') : t('pets.male')}</span>
                {pet.weight_kg && <><span>·</span><span>{pet.weight_kg} кг</span></>}
              </div>
            </div>
            <button
              onClick={() => remove(pet.id)}
              style={{
                width: 32, height: 32, borderRadius: 'var(--r-md)',
                border: '1.5px solid var(--border)', background: 'transparent',
                color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        ))}

        {/* Add form */}
        {showAdd && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '18px 16px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{t('pets.add')}</div>

            <Field label={t('pets.add_name')}>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Барсик"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)',
                  border: '1.5px solid var(--border)', fontSize: 15, fontFamily: 'inherit', minHeight: 44,
                }}
              />
            </Field>

            <Field label={t('pets.add_species')}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SPECIES_OPTS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setForm(f => ({ ...f, species: s.key }))}
                    style={{
                      padding: '6px 12px', borderRadius: 'var(--r-pill)',
                      border: `1.5px solid ${form.species === s.key ? 'var(--primary)' : 'var(--border)'}`,
                      background: form.species === s.key ? 'var(--surface-2)' : 'transparent',
                      fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                      color: form.species === s.key ? 'var(--primary)' : 'var(--text)',
                      fontWeight: form.species === s.key ? 700 : 400,
                    }}
                  >{s.emoji} {s.key}</button>
                ))}
              </div>
            </Field>

            <Field label={t('pets.add_sex')}>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ k: 'm', l: t('pets.male') }, { k: 'f', l: t('pets.female') }].map(o => (
                  <button
                    key={o.k}
                    onClick={() => setForm(f => ({ ...f, sex: o.k }))}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 'var(--r-md)',
                      border: `1.5px solid ${form.sex === o.k ? 'var(--primary)' : 'var(--border)'}`,
                      background: form.sex === o.k ? 'var(--surface-2)' : 'transparent',
                      fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44,
                      color: form.sex === o.k ? 'var(--primary)' : 'var(--text)',
                      fontWeight: form.sex === o.k ? 700 : 400,
                    }}
                  >{o.l}</button>
                ))}
              </div>
            </Field>

            {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{err}</div>}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowAdd(false); setErr('') }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 'var(--r-pill)',
                  border: '1.5px solid var(--border)', background: 'transparent',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48,
                }}
              >{t('back')}</button>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  flex: 2, padding: '12px', borderRadius: 'var(--r-pill)',
                  background: 'var(--primary)', color: '#fff', border: 'none',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', minHeight: 48,
                  opacity: saving ? 0.6 : 1,
                }}
              >{saving ? '…' : t('pets.add_save')}</button>
            </div>
          </div>
        )}
      </div>
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
