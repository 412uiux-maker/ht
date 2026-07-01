import { useState } from 'react'
import { IconArrowLeft } from '@ht/shared'
import type { Pet } from '../api'
import { getLang } from '../i18n'
import { speciesEmoji } from './Pets'

// ── Types (shared with PetHealthCard) ────────────────────────
type PetVaxEntry   = { id: string; name: string; date: string; next_date?: string; batch?: string; clinic?: string }
type PetTreatEntry = { id: string; type: string; date: string; next_date?: string; drug?: string }
type PetHealthData = { chronic?: string; notes?: string; vaccinations?: PetVaxEntry[]; treatments?: PetTreatEntry[] }
type PetExt        = { microchip: string; allergies: string; vet_name: string; vet_phone: string; sterilized: string }

// ── Storage ───────────────────────────────────────────────────
const EXT0: PetExt = { microchip: '', allergies: '', vet_name: '', vet_phone: '', sterilized: 'unknown' }
const loadExt    = (id: string): PetExt        => { try { return { ...EXT0, ...JSON.parse(localStorage.getItem(`ht_pet_ext_${id}`) ?? '{}') } } catch { return { ...EXT0 } } }
const loadHealth = (id: string): PetHealthData => { try { return JSON.parse(localStorage.getItem(`ht_pet_health_${id}`) ?? '{}') }              catch { return {} } }

// ── Utils ─────────────────────────────────────────────────────
const fmtDate = (s: string) => {
  try { return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return s }
}
function ageStr(bd: string | null, isRu: boolean): string {
  if (!bd) return ''
  const ms = Date.now() - new Date(bd).getTime()
  const months = Math.floor(ms / (30.44 * 24 * 3600 * 1000))
  const years  = Math.floor(months / 12)
  if (isRu) {
    if (years >= 1) return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`
    if (months >= 1) return `${months} мес.`
    return '< 1 мес.'
  } else {
    if (years >= 1) return `${years} yil`
    if (months >= 1) return `${months} oy`
    return '< 1 oy'
  }
}
const passportNo = (id: string) => `HT-${id.slice(0, 4).toUpperCase()}-${id.slice(4, 8).toUpperCase()}`

const SEX_LABEL: Record<string, [string, string]> = {
  male:    ['Самец', 'Erkak'],
  female:  ['Самка', 'Urg\'ochi'],
  unknown: ['Не указан', 'Noma\'lum'],
}
const STERIL_LABEL: Record<string, [string, string]> = {
  yes:     ['Стерилизован/кастрирован', 'Sterilizatsiya qilingan'],
  no:      ['Не стерилизован', 'Sterilizatsiya qilinmagan'],
  unknown: ['—', '—'],
}
const SPECIES_LABEL: Record<string, [string, string]> = {
  dog:     ['Собака', 'It'],
  cat:     ['Кошка', 'Mushuk'],
  rabbit:  ['Кролик', 'Quyon'],
  parrot:  ['Попугай', "To'ti"],
  hamster: ['Хомяк', 'Hamster'],
  other:   ['Животное', 'Hayvon'],
}

// ── Palette (passport burgundy/navy theme) ────────────────────
const P = {
  cover:    '#6B1F3B',
  coverDark:'#4A1228',
  gold:     '#D4A843',
  goldLight:'#F0C96A',
  navy:     '#1A2B4A',
  pageAlt:  '#FBF8F3',
  stamp:    'rgba(107,31,59,0.12)',
  stampBdr: 'rgba(107,31,59,0.3)',
  section:  '#F5F0EB',
}

interface Props {
  pet: Pet
  onBack: () => void
  onGoToHealthCard?: () => void
}

export default function PetPassport({ pet, onBack, onGoToHealthCard }: Props) {
  const isRu  = getLang() !== 'uz'
  const ext    = loadExt(pet.id)
  const health = loadHealth(pet.id)
  const vaxes  = health.vaccinations ?? []
  const treats = health.treatments   ?? []

  const [tab, setTab] = useState<'id' | 'vax' | 'treat' | 'info'>('id')
  const [shared, setShared] = useState(false)

  const sharePassport = async () => {
    const text = [
      `📖 ${isRu ? 'Ветпаспорт' : 'Vet pasporti'}: ${pet.name}`,
      `${isRu ? 'Вид' : 'Tur'}: ${SPECIES_LABEL[pet.species]?.[isRu ? 0 : 1] ?? pet.species}`,
      pet.breed ? `${isRu ? 'Порода' : 'Zot'}: ${pet.breed}` : null,
      ext.microchip ? `${isRu ? 'Чип' : 'Chip'}: ${ext.microchip}` : null,
      vaxes.length ? `💉 ${isRu ? 'Прививок' : 'Emlashlar'}: ${vaxes.length}` : null,
      `\n${isRu ? 'Создано в HappyTails' : 'HappyTails ilovasi orqali yaratilgan'}`,
    ].filter(Boolean).join('\n')

    if (navigator.share) {
      await navigator.share({ title: `${isRu ? 'Ветпаспорт' : 'Vet pasporti'} ${pet.name}`, text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text).catch(() => {})
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  const TABS = [
    { key: 'id'    as const, label: isRu ? 'Личные данные' : 'Shaxsiy ma\'lumot', icon: '🪪' },
    { key: 'vax'   as const, label: isRu ? 'Прививки'      : 'Emlashlar',         icon: '💉' },
    { key: 'treat' as const, label: isRu ? 'Обработки'     : 'Davolash',          icon: '🪱' },
    { key: 'info'  as const, label: isRu ? 'Ветеринар'     : 'Veterinar',         icon: '🏥' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F0EBE3' }}>

      {/* ── Passport cover header ─────────────────────────────── */}
      <div style={{
        background: `linear-gradient(160deg, ${P.cover} 0%, ${P.coverDark} 100%)`,
        padding: '0 0 20px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(212,168,67,.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 20, right: 20,  width: 80,  height: 80,  borderRadius: '50%', background: 'rgba(212,168,67,.06)', pointerEvents: 'none' }} />

        {/* nav row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 20px' }}>
          <button
            onClick={onBack}
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <IconArrowLeft size={18} color="#fff" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: P.goldLight, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
              {isRu ? 'Международный' : 'Xalqaro'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
              {isRu ? 'Ветеринарный паспорт' : 'Veterinariya pasporti'}
            </div>
          </div>
          <button
            onClick={sharePassport}
            title={isRu ? 'Поделиться' : 'Ulashish'}
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: shared ? 'rgba(212,168,67,.4)' : 'rgba(255,255,255,.15)',
              border: `1px solid ${shared ? P.gold : 'rgba(255,255,255,.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 18, transition: 'all .2s',
            }}
          >
            {shared ? '✓' : '📤'}
          </button>
        </div>

        {/* identity strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: 'rgba(255,255,255,.15)', border: `2px solid ${P.gold}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, flexShrink: 0,
          }}>
            {pet.avatar_emoji || speciesEmoji(pet.species)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 4 }}>
              {pet.name}
            </div>
            <div style={{ fontSize: 13, color: P.goldLight, marginBottom: 2 }}>
              {SPECIES_LABEL[pet.species]?.[isRu ? 0 : 1] ?? pet.species}
              {pet.breed && ` · ${pet.breed}`}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', letterSpacing: 1 }}>
              {passportNo(pet.id)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', background: P.coverDark,
        borderBottom: `2px solid ${P.gold}`,
        overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, minWidth: 0, padding: '10px 8px',
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              borderBottom: tab === t.key ? `3px solid ${P.gold}` : '3px solid transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              transition: 'all .12s',
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: tab === t.key ? P.goldLight : 'rgba(255,255,255,.45)', letterSpacing: 0.5, textTransform: 'uppercase', lineHeight: 1.2, textAlign: 'center' }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Page content ─────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── TAB: ID ───────────────────────────────────────── */}
        {tab === 'id' && (
          <>
            <PassportSection title={isRu ? 'Идентификация' : 'Identifikatsiya'}>
              <PassportRow label={isRu ? 'Кличка'        : 'Ism'}          value={pet.name} bold />
              <PassportRow label={isRu ? 'Вид'           : 'Tur'}          value={SPECIES_LABEL[pet.species]?.[isRu ? 0 : 1] ?? pet.species} />
              <PassportRow label={isRu ? 'Порода'        : 'Zot'}          value={pet.breed ?? '—'} />
              <PassportRow label={isRu ? 'Пол'           : 'Jins'}         value={SEX_LABEL[pet.sex]?.[isRu ? 0 : 1] ?? '—'} />
              <PassportRow label={isRu ? 'Дата рождения' : 'Tug\'ilgan kun'} value={pet.birth_date ? fmtDate(pet.birth_date) : '—'} />
              {pet.birth_date && (
                <PassportRow label={isRu ? 'Возраст' : 'Yosh'} value={ageStr(pet.birth_date, isRu)} />
              )}
              <PassportRow label={isRu ? 'Вес'           : 'Og\'irligi'}   value={pet.weight_kg ? `${pet.weight_kg} кг` : '—'} />
            </PassportSection>

            <PassportSection title={isRu ? 'Чипирование' : 'Chipizatsiya'}>
              {ext.microchip ? (
                <>
                  <PassportRow label={isRu ? 'Номер чипа' : 'Chip raqami'} value={ext.microchip} mono />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: '#15803D', fontWeight: 700, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '3px 8px' }}>
                      ✓ {isRu ? 'Чипирован' : 'Chipizatsiya qilingan'}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {isRu ? 'Чип не зарегистрирован' : 'Chip ro\'yxatga olinmagan'}
                </div>
              )}
            </PassportSection>

            <PassportSection title={isRu ? 'Стерилизация' : 'Sterilizatsiya'}>
              <PassportRow
                label={isRu ? 'Статус' : 'Holat'}
                value={STERIL_LABEL[ext.sterilized]?.[isRu ? 0 : 1] ?? '—'}
              />
            </PassportSection>

            {ext.allergies && (
              <div style={{
                background: '#FFF3CD', border: '1.5px solid #F0A500',
                borderRadius: 12, padding: '12px 14px',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 3 }}>
                    {isRu ? 'Аллергии / противопоказания' : 'Allergiyalar / qarshi ko\'rsatmalar'}
                  </div>
                  <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.5 }}>
                    {ext.allergies}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB: VACCINATIONS ─────────────────────────────── */}
        {tab === 'vax' && (
          <>
            {vaxes.length === 0 ? (
              <EmptyPassportPage
                icon="💉"
                title={isRu ? 'Нет записей о прививках' : 'Emlashlar yozuvi yo\'q'}
                hint={isRu ? 'Добавьте прививки в Медкарте питомца' : 'Emlashlarni hayvon tibbiy kartasiga qo\'shing'}
                onAction={onGoToHealthCard}
                actionLabel={isRu ? '🩺 Открыть Медкарту' : '🩺 Tibbiy kartani ochish'}
              />
            ) : vaxes.map((v, i) => (
              <VaxPage key={v.id} v={v} idx={i + 1} isRu={isRu} />
            ))}

            {/* Summary table */}
            {vaxes.length > 0 && (
              <PassportSection title={isRu ? 'Сводная таблица' : 'Umumiy jadval'}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: P.section }}>
                      <Th>#</Th>
                      <Th>{isRu ? 'Вакцина' : 'Vaksina'}</Th>
                      <Th>{isRu ? 'Серия' : 'Seriya'}</Th>
                      <Th>{isRu ? 'Дата' : 'Sana'}</Th>
                      <Th>{isRu ? 'Действ. до' : 'Amal qiladi'}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaxes.map((v, i) => {
                      const expired = v.next_date ? new Date(v.next_date) < new Date() : false
                      const soon    = v.next_date ? (new Date(v.next_date).getTime() - Date.now()) / 86400000 < 30 : false
                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid #E8E0D6' }}>
                          <Td>{i + 1}</Td>
                          <Td bold>{v.name}</Td>
                          <Td><span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v.batch ?? '—'}</span></Td>
                          <Td>{fmtDate(v.date)}</Td>
                          <Td>
                            {v.next_date ? (
                              <span style={{ color: expired ? '#DC2626' : soon ? '#D97706' : '#166534', fontWeight: 600 }}>
                                {fmtDate(v.next_date)}
                              </span>
                            ) : '—'}
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </PassportSection>
            )}

            {vaxes.length > 0 && onGoToHealthCard && (
              <button
                onClick={onGoToHealthCard}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12,
                  border: '1.5px dashed rgba(107,31,59,.35)', background: 'rgba(107,31,59,.04)',
                  color: P.cover, fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                + {isRu ? 'Добавить прививку в Медкарте' : 'Tibbiy kartada emlash qo\'shish'}
              </button>
            )}
          </>
        )}

        {/* ── TAB: TREATMENTS ───────────────────────────────── */}
        {tab === 'treat' && (
          <>
            {treats.length === 0 ? (
              <EmptyPassportPage
                icon="🪱"
                title={isRu ? 'Нет записей об обработках' : 'Davolash yozuvlari yo\'q'}
                hint={isRu ? 'Добавьте обработки в Медкарте' : 'Davolashlarni tibbiy kartaga qo\'shing'}
                onAction={onGoToHealthCard}
                actionLabel={isRu ? '🩺 Открыть Медкарту' : '🩺 Tibbiy kartani ochish'}
              />
            ) : (
              <PassportSection title={isRu ? 'Противопаразитарные обработки' : 'Parazitlarga qarshi davolash'}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: P.section }}>
                      <Th>#</Th>
                      <Th>{isRu ? 'Тип' : 'Tur'}</Th>
                      <Th>{isRu ? 'Препарат' : 'Dori'}</Th>
                      <Th>{isRu ? 'Дата' : 'Sana'}</Th>
                      <Th>{isRu ? 'Следующий' : 'Keyingisi'}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {treats.map((tr, i) => {
                      const expired = tr.next_date ? new Date(tr.next_date) < new Date() : false
                      const soon    = tr.next_date ? (new Date(tr.next_date).getTime() - Date.now()) / 86400000 < 30 : false
                      return (
                        <tr key={tr.id} style={{ borderBottom: '1px solid #E8E0D6' }}>
                          <Td>{i + 1}</Td>
                          <Td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{TREAT_EMOJI[tr.type] ?? '💊'}</span>
                              <span style={{ fontWeight: 600 }}>{tr.type}</span>
                            </span>
                          </Td>
                          <Td>{tr.drug ?? '—'}</Td>
                          <Td>{fmtDate(tr.date)}</Td>
                          <Td>
                            {tr.next_date ? (
                              <span style={{ color: expired ? '#DC2626' : soon ? '#D97706' : '#166534', fontWeight: 600 }}>
                                {fmtDate(tr.next_date)}
                              </span>
                            ) : '—'}
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </PassportSection>
            )}

            {treats.length > 0 && onGoToHealthCard && (
              <button
                onClick={onGoToHealthCard}
                style={{
                  width: '100%', padding: '13px', borderRadius: 12,
                  border: '1.5px dashed rgba(107,31,59,.35)', background: 'rgba(107,31,59,.04)',
                  color: P.cover, fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                + {isRu ? 'Добавить обработку в Медкарте' : 'Tibbiy kartada davolash qo\'shish'}
              </button>
            )}
          </>
        )}

        {/* ── TAB: VET INFO ─────────────────────────────────── */}
        {tab === 'info' && (
          <>
            <PassportSection title={isRu ? 'Ветеринарный врач' : 'Veterinar shifokor'}>
              {ext.vet_name || ext.vet_phone ? (
                <>
                  {ext.vet_name  && <PassportRow label={isRu ? 'Клиника / врач' : 'Klinika / shifokor'} value={ext.vet_name} bold />}
                  {ext.vet_phone && <PassportRow label={isRu ? 'Телефон'        : 'Telefon'}            value={ext.vet_phone} mono />}
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {isRu ? 'Ветеринар не указан' : 'Veterinar ko\'rsatilmagan'}
                </div>
              )}
            </PassportSection>

            {health.chronic && (
              <PassportSection title={isRu ? 'Хронические заболевания' : 'Surunkali kasalliklar'}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
                  {health.chronic}
                </p>
              </PassportSection>
            )}

            {health.notes && (
              <PassportSection title={isRu ? 'Примечания врача' : 'Shifokor izohlari'}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
                  {health.notes}
                </p>
              </PassportSection>
            )}

            {/* Stamp area */}
            <div style={{
              marginTop: 8, border: `2px dashed ${P.stampBdr}`,
              borderRadius: 16, padding: '20px', textAlign: 'center',
              background: P.stamp, minHeight: 100,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <div style={{ fontSize: 28 }}>🔏</div>
              <div style={{ fontSize: 12, color: P.cover, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                {isRu ? 'Место для печати ветеринара' : 'Veterinar muhr joyi'}
              </div>
            </div>
          </>
        )}

        {/* ── Passport footer ───────────────────────────────── */}
        <div style={{
          marginTop: 12, padding: '12px 0',
          borderTop: `1px solid #D6CEC4`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 10, color: '#A09080', letterSpacing: 0.5 }}>
            HappyTails · {isRu ? 'Электронный паспорт' : 'Elektron pasport'}
          </div>
          <div style={{ fontSize: 10, color: '#A09080', fontFamily: 'monospace' }}>
            {passportNo(pet.id)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────
function PassportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
      <div style={{
        padding: '10px 14px', fontSize: 11, fontWeight: 800, letterSpacing: 1.2,
        textTransform: 'uppercase', color: '#6B1F3B',
        background: '#FBF5F0', borderBottom: '1px solid #EDE3DA',
      }}>
        {title}
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}

function PassportRow({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', minHeight: 22 }}>
      <span style={{ fontSize: 12, color: '#8A7A6A', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: bold ? 700 : 500, color: '#1A1A1A', textAlign: 'right',
        fontFamily: mono ? 'monospace' : 'inherit', letterSpacing: mono ? 1 : 0,
      }}>
        {value}
      </span>
    </div>
  )
}

function VaxPage({ v, idx, isRu }: { v: PetVaxEntry; idx: number; isRu: boolean }) {
  const expired = v.next_date ? new Date(v.next_date) < new Date() : false
  const daysUntil = v.next_date ? Math.ceil((new Date(v.next_date).getTime() - Date.now()) / 86400000) : null
  const soon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 30

  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      border: expired ? '1.5px solid #FCA5A5' : soon ? '1.5px solid #FCD34D' : '1.5px solid #BBF7D0',
    }}>
      {/* header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', background: '#FBF5F0', borderBottom: '1px solid #EDE3DA',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: '#6B1F3B',
            color: '#fff', fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{idx}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{v.name}</span>
        </div>
        <StatusBadge expired={expired} soon={soon} isRu={isRu} />
      </div>
      {/* body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <PassportRow label={isRu ? 'Дата введения'     : 'Emlash sanasi'}  value={fmtDate(v.date)} />
        {v.next_date && (
          <PassportRow
            label={isRu ? 'Следующая ревакцинация' : 'Keyingi revaksinatsiya'}
            value={fmtDate(v.next_date)}
          />
        )}
        {v.batch && (
          <PassportRow label={isRu ? 'Серия / партия' : 'Seriya'} value={v.batch} mono />
        )}
        {v.clinic && (
          <PassportRow label={isRu ? 'Клиника' : 'Klinika'} value={v.clinic} />
        )}
        {daysUntil !== null && !expired && (
          <div style={{ fontSize: 11, color: soon ? '#D97706' : '#166534', fontWeight: 600, marginTop: 2 }}>
            {soon
              ? (isRu ? `Через ${daysUntil} дн.` : `${daysUntil} kundan keyin`)
              : (isRu ? `${daysUntil} дн. до ревакцинации` : `Revaksinatsiyaga ${daysUntil} kun`)}
          </div>
        )}
        {expired && (
          <div style={{ fontSize: 11, color: '#DC2626', fontWeight: 600, marginTop: 2 }}>
            {isRu ? `Просрочено ${Math.abs(daysUntil!)} дн. назад` : `${Math.abs(daysUntil!)} kun oldin muddati o'tgan`}
          </div>
        )}
      </div>
      {/* stamp row */}
      <div style={{
        margin: '0 14px 12px', padding: '8px 12px',
        border: `1.5px dashed rgba(107,31,59,.25)`, borderRadius: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(107,31,59,.03)',
      }}>
        <span style={{ fontSize: 10, color: '#8A7A6A', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {isRu ? 'Подпись / печать' : 'Imzo / muhr'}
        </span>
        <span style={{ fontSize: 18 }}>🔏</span>
      </div>
    </div>
  )
}

function StatusBadge({ expired, soon, isRu }: { expired: boolean; soon: boolean; isRu: boolean }) {
  const cfg = expired
    ? { bg: '#FEE2E2', color: '#DC2626', text: isRu ? 'Просрочена' : 'Muddati o\'tgan' }
    : soon
      ? { bg: '#FEF9C3', color: '#D97706', text: isRu ? 'Скоро'    : 'Tez orada' }
      : { bg: '#DCFCE7', color: '#166534', text: isRu ? 'Действует' : 'Amal qiladi' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, borderRadius: 6,
      padding: '3px 8px', background: cfg.bg, color: cfg.color,
    }}>
      {cfg.text}
    </span>
  )
}

function EmptyPassportPage({ icon, title, hint, onAction, actionLabel }: {
  icon: string; title: string; hint: string
  onAction?: () => void; actionLabel?: string
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, padding: '48px 24px', textAlign: 'center',
      background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    }}>
      <span style={{ fontSize: 44 }}>{icon}</span>
      <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A1A' }}>{title}</div>
      <div style={{ fontSize: 13, color: '#8A7A6A', lineHeight: 1.5 }}>{hint}</div>
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          style={{
            marginTop: 4, padding: '11px 22px', borderRadius: 10,
            background: '#6B1F3B', color: '#fff', border: 'none',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B1F3B', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )
}
function Td({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return (
    <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: bold ? 700 : 400, color: '#1A1A1A', verticalAlign: 'middle' }}>
      {children}
    </td>
  )
}

const TREAT_EMOJI: Record<string, string> = {
  'Дегельминтизация':    '🪱',
  'Противопаразитарная': '🦟',
  'Витамины':            '💊',
  'Другое':              '🩺',
}
