import { useEffect, useState } from 'react'
import { IconArrowLeft, IconPaw, IconOrders, IconStethoscope, IconFood, IconCheckCircle, IconCheck, IconMoney, IconPlus, IconRefresh } from '@ht/shared'
import type { Pet, FoodResult } from '../api'
import { api, getOwnerId } from '../api'
import { t } from '../i18n'

type Step = 1 | 2 | 3 | 4
type AgeGroup = 'baby' | 'adult' | 'senior'
type Concern = 'allergy' | 'digest' | 'overweight' | 'joints' | 'dental'

const SPECIES_DATA = [
  { k: 'cat',     emoji: '🐱', ru: 'Кошка',   uz: 'Mushuk' },
  { k: 'dog',     emoji: '🐶', ru: 'Собака',  uz: 'It' },
  { k: 'rabbit',  emoji: '🐰', ru: 'Кролик',  uz: 'Quyon' },
  { k: 'parrot',  emoji: '🦜', ru: 'Попугай', uz: "To'ti" },
  { k: 'hamster', emoji: '🐹', ru: 'Хомяк',   uz: 'Hamster' },
  { k: 'other',   emoji: '🐾', ru: 'Другое',  uz: 'Boshqa' },
]

const CONCERN_DATA: { k: Concern; icon: string; ru: string; uz: string }[] = [
  { k: 'allergy',    icon: '🌾', ru: 'Аллергия / чувствительное питание', uz: 'Allergiya / sezgir ovqat' },
  { k: 'digest',     icon: '🍃', ru: 'Проблемы с пищеварением',           uz: 'Hazm muammolari' },
  { k: 'overweight', icon: '⚖️', ru: 'Лишний вес',                        uz: "Ortiqcha og'irlik" },
  { k: 'joints',     icon: '🦴', ru: 'Проблемы с суставами',              uz: "Bo'g'im muammolari" },
  { k: 'dental',     icon: '🦷', ru: 'Зубной камень',                     uz: 'Tish toshi' },
]

function buildWhy(species: string, ageGroup: AgeGroup, sterilized: string, concerns: Set<Concern>): string {
  const parts: string[] = []
  if (ageGroup === 'baby')
    parts.push(species === 'cat'
      ? 'Котятам нужно много белка и DHA для развития мозга и формирования иммунитета.'
      : 'Щенкам необходим высокий белок, DHA и кальций для активного роста и здоровья костей.')
  else if (ageGroup === 'senior')
    parts.push('Пожилым питомцам нужно меньше калорий и больше поддержки суставов и когнитивной функции.')
  else
    parts.push('Взрослым нужен сбалансированный корм с оптимальным соотношением белков, жиров и микроэлементов.')
  if (sterilized === 'yes') parts.push('После стерилизации снижается потребность в калориях — добавили формулы с контролем веса.')
  if (concerns.has('allergy'))    parts.push('При аллергиях подходит ограниченный состав или гидролизованный белок.')
  if (concerns.has('digest'))     parts.push('Для ЖКТ — легкоусваиваемые источники белка с пребиотиками и клетчаткой.')
  if (concerns.has('overweight')) parts.push('L-карнитин и сниженная калорийность помогут достичь здорового веса.')
  if (concerns.has('joints'))     parts.push('Глюкозамин и хондроитин в составе поддержат подвижность суставов.')
  if (concerns.has('dental'))     parts.push('Гранулы с особой текстурой механически очищают зубной налёт.')
  return parts.join(' ')
}

interface Props {
  onBack: () => void
  onConsult: () => void
}

export default function FoodWizard({ onBack, onConsult }: Props) {
  const lang = t('lang_code')
  const [step, setStep] = useState<Step>(1)
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [species, setSpecies] = useState('cat')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('adult')
  const [sterilized, setSterilized] = useState('unknown')
  const [concerns, setConcerns] = useState<Set<Concern>>(new Set())

  const [apiRecs, setApiRecs] = useState<FoodResult[]>([])
  const [recsLoading, setRecsLoading] = useState(false)
  const [recsError, setRecsError] = useState('')

  useEffect(() => {
    api.pets(getOwnerId()).then(list => { setPets(list); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const isExotic = !['cat', 'dog'].includes(species)
    if (step !== 4 || isExotic) return
    setRecsLoading(true)
    setRecsError('')
    const lifeStage = ageGroup === 'baby' ? 'kitten' : ageGroup
    const healthTags: string[] = []
    if (concerns.has('allergy'))    healthTags.push('skin')
    if (concerns.has('digest'))     healthTags.push('digestion')
    if (concerns.has('overweight')) healthTags.push('weight_control')
    if (concerns.has('joints'))     healthTags.push('joints')
    if (concerns.has('dental'))     healthTags.push('dental')
    if (sterilized === 'yes' && !healthTags.includes('weight_control')) healthTags.push('weight_control')
    api.foodsQuiz(species, lifeStage, healthTags)
      .then(r => { setApiRecs(r); setRecsLoading(false) })
      .catch(e => { setRecsError(e.message); setRecsLoading(false) })
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => setStep(s => Math.min(4, s + 1) as Step)
  const goPrev = () => setStep(s => Math.max(1, s - 1) as Step)

  const pickPet = (pet: Pet) => {
    setSelectedPet(pet)
    setSpecies(pet.species)
    if (pet.birth_date) {
      const months = (Date.now() - new Date(pet.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      setAgeGroup(months < 12 ? 'baby' : months > 84 ? 'senior' : 'adult')
    }
    goNext()
  }

  const toggleConcern = (c: Concern) => setConcerns(prev => {
    const next = new Set(prev)
    next.has(c) ? next.delete(c) : next.add(c)
    return next
  })

  const isExotic = !['cat', 'dog'].includes(species)
  const whyText = buildWhy(species, ageGroup, sterilized, concerns)

  const speciesLabel = (k: string) => {
    const s = SPECIES_DATA.find(x => x.k === k)
    if (!s) return k
    return `${s.emoji} ${lang === 'uz' ? s.uz : s.ru}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={step === 1 ? onBack : goPrev} style={iconBtn}><IconArrowLeft size={18} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{t('food.title')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('food.step_label')} {step} / 4</div>
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--border)' }}>
        <div style={{ height: '100%', background: 'var(--primary)', width: `${(step / 4) * 100}%`, transition: 'width .3s ease' }} />
      </div>

      <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingBottom: step === 4 ? 32 : 100 }}>

        {/* ── Step 1: Pet selection ────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <WizStep icon={<IconPaw size={36} color="var(--primary)" />} title={t('food.step_pet')} sub={t('food.step_pet_sub')} />

            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{t('loading')}</div>
            ) : (
              <>
                {pets.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pets.map(pet => (
                      <button key={pet.id} onClick={() => pickPet(pet)} style={petRowStyle}>
                        <span style={{ fontSize: 28 }}>{pet.avatar_emoji}</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{pet.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{speciesLabel(pet.species)}</div>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
                      </button>
                    ))}
                  </div>
                )}

                <button onClick={() => { setSelectedPet(null); goNext() }} style={{ ...outlineBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <IconPlus size={14} /> {t('food.no_pet')}
                </button>
              </>
            )}
          </>
        )}

        {/* ── Step 2: Pet profile ──────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <WizStep icon={<IconOrders size={36} color="var(--primary)" />} title={t('food.step_profile')} sub={selectedPet?.name ?? ''} />

            {/* Species */}
            <FieldBlock label={t('food.species')}>
              {selectedPet ? (
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', padding: '10px 0' }}>
                  {speciesLabel(selectedPet.species)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SPECIES_DATA.map(s => (
                    <button key={s.k} onClick={() => setSpecies(s.k)} style={{
                      padding: '8px 14px', borderRadius: 'var(--r-pill)',
                      border: `2px solid ${species === s.k ? 'var(--primary)' : 'var(--border)'}`,
                      background: species === s.k ? 'rgba(242,120,75,.1)' : 'transparent',
                      fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
                      color: species === s.k ? 'var(--primary)' : 'var(--text)',
                      fontWeight: species === s.k ? 700 : 500, transition: 'all .15s',
                    }}>
                      {s.emoji} {lang === 'uz' ? s.uz : s.ru}
                    </button>
                  ))}
                </div>
              )}
            </FieldBlock>

            {/* Age group */}
            <FieldBlock label={t('food.age_group')}>
              <SegThree
                options={[
                  { k: 'baby',   l: t('food.age_baby') },
                  { k: 'adult',  l: t('food.age_adult') },
                  { k: 'senior', l: t('food.age_senior') },
                ]}
                value={ageGroup}
                onChange={v => setAgeGroup(v as AgeGroup)}
              />
            </FieldBlock>

            {/* Sterilized */}
            <FieldBlock label={t('food.sterilized')}>
              <SegThree
                options={[
                  { k: 'yes',     l: t('pets.steril_yes') },
                  { k: 'no',      l: t('pets.steril_no') },
                  { k: 'unknown', l: t('pets.unknown') },
                ]}
                value={sterilized}
                onChange={setSterilized}
              />
            </FieldBlock>
          </>
        )}

        {/* ── Step 3: Health concerns ─────────────────────────────────────── */}
        {step === 3 && (
          <>
            <WizStep icon={<IconStethoscope size={36} color="var(--primary)" />} title={t('food.step_health')} sub={t('food.health_sub')} />

            {/* "All good" option */}
            <button onClick={() => setConcerns(new Set())} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 'var(--r-lg)', width: '100%',
              border: `2px solid ${concerns.size === 0 ? 'var(--primary)' : 'var(--border)'}`,
              background: concerns.size === 0 ? 'rgba(242,120,75,.08)' : 'var(--surface)',
              fontFamily: 'inherit', cursor: 'pointer', transition: 'all .15s',
            }}>
              <IconCheckCircle size={22} color={concerns.size === 0 ? 'var(--primary)' : 'var(--text-muted)'} />
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: 14, color: concerns.size === 0 ? 'var(--primary)' : 'var(--text)' }}>
                {t('food.health_none')}
              </span>
              {concerns.size === 0 && <IconCheck size={16} color="var(--primary)" />}
            </button>

            {CONCERN_DATA.map(c => {
              const on = concerns.has(c.k)
              return (
                <button key={c.k} onClick={() => toggleConcern(c.k)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 'var(--r-lg)', width: '100%',
                  border: `2px solid ${on ? 'var(--primary)' : 'var(--border)'}`,
                  background: on ? 'rgba(242,120,75,.08)' : 'var(--surface)',
                  fontFamily: 'inherit', cursor: 'pointer', transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 22 }}>{c.icon}</span>
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, fontSize: 14, color: on ? 'var(--primary)' : 'var(--text)' }}>
                    {lang === 'uz' ? c.uz : c.ru}
                  </span>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${on ? 'var(--primary)' : 'var(--border)'}`,
                    background: on ? 'var(--primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12,
                  }}>{on ? <IconCheck size={12} color="#fff" /> : null}</span>
                </button>
              )
            })}
          </>
        )}

        {/* ── Step 4: Results ─────────────────────────────────────────────── */}
        {step === 4 && (
          <>
            <WizStep icon={<IconFood size={36} color="var(--primary)" />} title={t('food.result_title')} sub="" />

            {isExotic ? (
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-xl)', padding: '28px 20px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              }}>
                <IconStethoscope size={56} color="var(--primary)" />
                <div style={{ fontWeight: 700, fontSize: 18 }}>{t('food.other_species')}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.6 }}>
                  {lang === 'uz'
                    ? "Bu turdagi hayvonlar uchun veterinar-dietolog bilan shaxsiy maslahat o'tkazish tavsiya etiladi"
                    : 'Для грызунов, птиц и экзотических животных рекомендуем персональную консультацию ветеринара-диетолога'}
                </div>
                <button onClick={onConsult} style={{ ...primaryBtn, maxWidth: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <IconStethoscope size={16} color="#fff" /> {t('food.consult_cta')}
                </button>
              </div>
            ) : (
              <>
                {/* Why card */}
                <div style={{
                  background: 'rgba(242,120,75,.09)', border: '1px solid rgba(242,120,75,.22)',
                  borderRadius: 'var(--r-lg)', padding: '16px',
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)', marginBottom: 8 }}>
                    {t('food.result_why')}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65 }}>{whyText}</div>
                </div>

                {/* Products */}
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{t('food.result_products')}</div>
                {recsLoading && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>{t('loading')}</div>
                )}
                {!recsLoading && recsError && (
                  <div style={{ textAlign: 'center', color: 'var(--danger, #C62828)', padding: 16, fontSize: 13 }}>{recsError}</div>
                )}
                {!recsLoading && !recsError && apiRecs.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16, fontSize: 13 }}>
                    {lang === 'uz' ? "Mos mahsulotlar topilmadi" : 'Подходящие продукты не найдены'}
                  </div>
                )}
                {!recsLoading && apiRecs.map((p, i) => (
                  <div key={p.id} style={{
                    background: 'var(--surface)', border: `1px solid ${i === 0 ? 'rgba(242,120,75,.3)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-lg)', padding: '14px 16px', display: 'flex', gap: 12,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r-md)', flexShrink: 0,
                      background: i === 0 ? 'var(--grad-warm)' : 'var(--surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: i === 0 ? 17 : 14,
                      color: i === 0 ? '#fff' : 'var(--text-muted)',
                    }}>
                      {i === 0 ? '★' : i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{p.brand}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{p.name}</div>
                        </div>
                        {i === 0 && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--r-pill)',
                            background: 'var(--grad-warm)', color: '#fff', flexShrink: 0,
                          }}>
                            {lang === 'uz' ? 'Top' : 'Топ'}
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '6px 0' }}>{p.description}</div>
                      )}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '4px 10px', borderRadius: 'var(--r-pill)',
                        background: 'var(--surface-2)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                      }}>
                        <IconMoney size={12} color="var(--text-muted)" style={{ verticalAlign: 'middle' }} /> {Math.round(p.price_uzs / 1000)} тыс. сум
                      </div>
                    </div>
                  </div>
                ))}

                {/* Consult CTA */}
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--r-md)', flexShrink: 0,
                    background: 'linear-gradient(135deg,#F8915A,#F26B47)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><IconStethoscope size={22} color="#fff" /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{t('food.consult_cta')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t('food.consult_sub')}</div>
                  </div>
                  <button onClick={onConsult} style={{
                    width: 36, height: 36, borderRadius: 'var(--r-md)', flexShrink: 0,
                    background: 'var(--primary)', color: '#fff', border: 'none',
                    fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
                  }}>→</button>
                </div>

                {/* Restart */}
                <button
                  onClick={() => { setStep(1); setSelectedPet(null); setConcerns(new Set()) }}
                  style={outlineBtn}
                >
                  <IconRefresh size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {t('food.restart')}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom CTA for steps 2 & 3 */}
      {(step === 2 || step === 3) && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '12px 16px 28px',
          background: 'var(--surface)', borderTop: '1px solid var(--border)',
        }}>
          <button onClick={goNext} style={primaryBtn}>
            {t('food.next')} →
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function WizStep({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text)', marginBottom: sub ? 4 : 0 }}>{title}</div>
      {sub && <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{label}</div>
      {children}
    </div>
  )
}

function SegThree({ options, value, onChange }: { options: { k: string; l: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', overflow: 'hidden', background: 'var(--surface-2)' }}>
      {options.map((o, i) => (
        <button key={o.k} onClick={() => onChange(o.k)} style={{
          flex: 1, padding: '10px 4px', border: 'none',
          borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
          background: value === o.k ? 'var(--primary)' : 'transparent',
          color: value === o.k ? '#fff' : 'var(--text-muted)',
          fontSize: 12, fontWeight: value === o.k ? 700 : 500,
          cursor: 'pointer', fontFamily: 'inherit', minHeight: 44, transition: 'all .15s',
        }}>{o.l}</button>
      ))}
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 'var(--r-md)',
  border: '1.5px solid var(--border)', background: 'transparent',
  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '14px', borderRadius: 'var(--r-pill)',
  background: 'var(--primary)', color: '#fff', border: 'none',
  fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', minHeight: 52,
}

const outlineBtn: React.CSSProperties = {
  width: '100%', padding: '13px', borderRadius: 'var(--r-pill)',
  border: '1.5px solid var(--border)', background: 'transparent',
  fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
  color: 'var(--text-muted)', minHeight: 48,
}

const petRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '14px 16px', borderRadius: 'var(--r-lg)',
  border: '1px solid var(--border)', background: 'var(--surface)',
  fontFamily: 'inherit', cursor: 'pointer', width: '100%',
  transition: 'background .1s',
}
