import { useState } from 'react'
import { IconArrowLeft, IconCheck, IconPaw } from '@ht/shared'
import { api, getOwnerId } from '../api'
import { t, setLang, getLang } from '../i18n'

interface Props {
  onDone: () => void
}

type Step = 'lang' | 'welcome' | 'pet'

const SPECIES = [
  { value: 'cat',    emoji: '🐱', ru: 'Кошка',   uz: 'Mushuk' },
  { value: 'dog',    emoji: '🐶', ru: 'Собака',   uz: 'It' },
  { value: 'rabbit', emoji: '🐰', ru: 'Кролик',   uz: 'Quyon' },
  { value: 'parrot', emoji: '🦜', ru: 'Попугай',  uz: "To'ti" },
  { value: 'hamster',emoji: '🐹', ru: 'Хомяк',    uz: 'Hamster' },
  { value: 'other',  emoji: '🐾', ru: 'Другое',   uz: 'Boshqa' },
]

export default function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState<Step>('lang')
  const [lang, setLangState] = useState(getLang())
  const [petName, setPetName] = useState('')
  const [species, setSpecies] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const chooseLang = (l: string) => {
    setLang(l)
    setLangState(l)
    setStep('welcome')
  }

  const finish = async (skipPet = false) => {
    if (!skipPet) {
      if (!petName.trim()) { setError(t('book.pet_empty')); return }
      if (!species) { setError(lang === 'ru' ? 'Выберите вид питомца' : 'Hayvon turini tanlang'); return }
      setSaving(true)
      try {
        const sp = SPECIES.find(s => s.value === species)
        await api.createPet({
          owner_id: getOwnerId(),
          name: petName.trim(),
          species,
          sex,
          avatar_emoji: sp?.emoji ?? '🐾',
        })
      } catch {
        // non-blocking
      } finally {
        setSaving(false)
      }
    }
    localStorage.setItem('ht_onboarded', '1')
    onDone()
  }

  if (step === 'lang') return <LangStep onChoose={chooseLang} />
  if (step === 'welcome') return <WelcomeStep lang={lang} onNext={() => setStep('pet')} />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 12 }}>
        <button
          onClick={() => setStep('welcome')}
          style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--border)', background: 'transparent',
            fontSize: 16, cursor: 'pointer',
          }}
        ><IconArrowLeft size={16} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['lang', 'welcome', 'pet'].map((s, i) => (
              <div key={s} style={{
                height: 4, flex: 1, borderRadius: 99,
                background: i <= 2 ? 'var(--primary)' : 'var(--border)',
                opacity: i <= ['lang','welcome','pet'].indexOf(step) ? 1 : 0.25,
                transition: 'opacity .2s',
              }} />
            ))}
          </div>
        </div>
        <button
          onClick={() => finish(true)}
          style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {lang === 'ru' ? 'Пропустить' : 'O\'tkazib yuborish'}
        </button>
      </div>

      <div style={{ flex: 1, padding: '8px 24px 32px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconPaw size={22} color="var(--primary)" />
          {lang === 'ru' ? 'Расскажите о питомце' : 'Hayvon haqida aytib bering'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
          {lang === 'ru' ? 'Мы подберём персональные рекомендации' : 'Shaxsiy tavsiyalar tanlaymiz'}
        </div>

        {/* Pet name */}
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
          {lang === 'ru' ? 'Кличка' : 'Laqab'}
        </label>
        <input
          value={petName}
          onChange={e => { setPetName(e.target.value); setError('') }}
          placeholder={lang === 'ru' ? 'Например: Мурка' : 'Masalan: Murka'}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 'var(--r-lg)',
            border: `1.5px solid ${error && !petName ? '#EF4444' : 'var(--border)'}`,
            fontSize: 15, fontFamily: 'inherit', background: 'var(--surface)',
            marginBottom: 20, boxSizing: 'border-box',
          }}
        />

        {/* Species grid */}
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, display: 'block' }}>
          {lang === 'ru' ? 'Вид животного' : 'Hayvon turi'}
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {SPECIES.map(sp => {
            const sel = species === sp.value
            return (
              <button
                key={sp.value}
                onClick={() => { setSpecies(sp.value); setError('') }}
                style={{
                  padding: '14px 8px', borderRadius: 'var(--r-lg)',
                  border: `2px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                  background: sel ? '#FFF4F0' : 'var(--surface)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all .15s',
                }}
              >
                <span style={{ fontSize: 28 }}>{sp.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: sel ? 'var(--primary)' : 'var(--text)' }}>
                  {lang === 'ru' ? sp.ru : sp.uz}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sex toggle */}
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, display: 'block' }}>
          {t('pets.add_sex')}
        </label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {(['male', 'female'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSex(s)}
              style={{
                flex: 1, padding: '11px', borderRadius: 'var(--r-lg)',
                border: `2px solid ${sex === s ? 'var(--primary)' : 'var(--border)'}`,
                background: sex === s ? '#FFF4F0' : 'var(--surface)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                color: sex === s ? 'var(--primary)' : 'var(--text)',
                transition: 'all .15s',
              }}
            >
              {s === 'male' ? `♂ ${t('pets.male')}` : `♀ ${t('pets.female')}`}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}

        <button
          onClick={() => finish(false)}
          disabled={saving}
          style={{
            width: '100%', padding: '15px', borderRadius: 'var(--r-pill)',
            background: 'var(--primary)', color: '#fff', border: 'none',
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            opacity: saving ? 0.7 : 1, minHeight: 52,
          }}
        >
          {saving ? '...' : (lang === 'ru' ? 'Поехали! 🚀' : 'Boshlaylik! 🚀')}
        </button>
      </div>
    </div>
  )
}

function LangStep({ onChoose }: { onChoose: (l: string) => void }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 12 }}><IconPaw size={52} color="var(--primary)" /></div>
      <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>HappyTails</div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 52, textAlign: 'center' }}>
        Маркетплейс для питомцев · Uy hayvonlari marketi
      </div>

      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 4 }}>
          Выберите язык · Tilni tanlang
        </div>

        <button
          onClick={() => onChoose('ru')}
          style={{
            padding: '18px 24px', borderRadius: 'var(--r-xl)',
            background: 'var(--surface)', border: '2px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <span style={{ fontSize: 32 }}>🇷🇺</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Русский</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Продолжить на русском</div>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>›</span>
        </button>

        <button
          onClick={() => onChoose('uz')}
          style={{
            padding: '18px 24px', borderRadius: 'var(--r-xl)',
            background: 'var(--surface)', border: '2px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <span style={{ fontSize: 32 }}>🇺🇿</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>O'zbekcha</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>O'zbek tilida davom etish</div>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>›</span>
        </button>
      </div>
    </div>
  )
}

function WelcomeStep({ lang, onNext }: { lang: string; onNext: () => void }) {
  const isRu = lang === 'ru'

  const features = isRu
    ? [
        { emoji: '🩺', title: 'Ветеринар онлайн', sub: 'Консультация за 5 минут' },
        { emoji: '🥗', title: 'Подбор корма', sub: 'Персональные рекомендации' },
        { emoji: '📚', title: 'Обучение', sub: 'Гайды и чек-листы' },
        { emoji: '❤️', title: 'Добрые дела', sub: 'Помочь животным' },
      ]
    : [
        { emoji: '🩺', title: 'Online veterinar', sub: '5 daqiqada maslahat' },
        { emoji: '🥗', title: 'Yem tanlash', sub: 'Shaxsiy tavsiya' },
        { emoji: '📚', title: "O'rganish", sub: "Qo'llanmalar" },
        { emoji: '❤️', title: 'Yaxshi ishlar', sub: "Hayvonlarga yordam" },
      ]

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Hero */}
      <div style={{
        background: 'var(--grad-warm)', padding: '48px 24px 36px',
        textAlign: 'center', color: '#fff',
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🐶🐱</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>
          {isRu ? 'Добро пожаловать\nв HappyTails!' : 'HappyTails\'ga\nxush kelibsiz!'}
        </h1>
        <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.5 }}>
          {isRu
            ? 'Всё для здоровья и счастья\nвашего питомца'
            : "Uy hayvonlaringizning sog'ligi\nva baxtliligi uchun hamma narsa"}
        </p>
      </div>

      {/* Features */}
      <div style={{ flex: 1, padding: '24px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {features.map(f => (
            <div key={f.emoji} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: 'var(--surface)', borderRadius: 'var(--r-lg)',
              padding: '14px 16px', border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>{f.emoji}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.sub}</div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'var(--primary)' }}><IconCheck size={16} /></div>
            </div>
          ))}
        </div>

        <button
          onClick={onNext}
          style={{
            width: '100%', padding: '15px', borderRadius: 'var(--r-pill)',
            background: 'var(--primary)', color: '#fff', border: 'none',
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            minHeight: 52,
          }}
        >
          {isRu ? 'Начать →' : 'Boshlash →'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
          {isRu
            ? 'Нажимая «Начать», вы соглашаетесь с условиями использования'
            : '«Boshlash» ni bosish orqali foydalanish shartlariga rozilik bildirasiz'}
        </div>
      </div>
    </div>
  )
}
