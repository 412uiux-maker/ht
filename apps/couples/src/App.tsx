import { useState, useEffect } from 'react'
import type { Vet, Consultation } from './api'
import { api, setJwt, getJwt } from './api'
import { setLang } from './i18n'
import { WebApp } from './twa'
import BottomNav, { type Tab } from './components/BottomNav'
import Onboarding from './screens/Onboarding'
import Dashboard from './screens/Dashboard'
import Deeds from './screens/Deeds'
import Home from './screens/Home'          // vet list — used as Consult tab
import Booking from './screens/Booking'
import Payment from './screens/Payment'
import Chat from './screens/Chat'
import Family from './screens/Family'
import LearnHub from './screens/LearnHub'
import Profile from './screens/Profile'
import Insurance from './screens/Insurance'
import InsuranceCheckout from './screens/InsuranceCheckout'
import InsuranceSuccess from './screens/InsuranceSuccess'
import Orders from './screens/Orders'
import FoodWizard from './screens/FoodWizard'
import ClinicServicePicker, { type ClinicService } from './screens/ClinicServicePicker'
import ClinicList, { type Clinic } from './screens/ClinicList'
import ClinicDetail from './screens/ClinicDetail'
import Places from './screens/Places'
import SymptomChecker from './screens/SymptomChecker'
import VideoCall from './screens/VideoCall'

// Flows that cover the full screen (no bottom nav)
type Flow =
  | { name: 'booking'; vet: Vet; petId?: string; reasonEventId?: string }
  | { name: 'payment'; consultation: Consultation; vet: Vet }
  | { name: 'chat'; consultationId: string; vet: Vet }
  | { name: 'insurance' }
  | { name: 'insurance-checkout' }
  | { name: 'insurance-success' }
  | { name: 'orders' }
  | { name: 'food' }
  | { name: 'clinic-services' }
  | { name: 'clinic-list'; service: ClinicService }
  | { name: 'clinic-detail'; clinic: Clinic; service: ClinicService }
  | { name: 'places' }
  | { name: 'deeds' }
  | { name: 'symptoms' }
  | { name: 'video'; consultationId: string; vet: Vet }

const STUB_VET: Vet = {
  id: 1, name: 'Азиз Каримов', specialty: 'Терапевт (кошки, собаки)',
  avatar_emoji: '🐕', rating: 4.9, experience_yr: 8, price_uzs: 120000,
  is_available: true, bio: '', review_count: 0,
}

function devInitialFlow(): Flow | null {
  const p = new URLSearchParams(location.search)
  const chatId = p.get('chat')
  if (chatId) return { name: 'chat', consultationId: chatId, vet: STUB_VET }
  return null
}

function devInitialTab(): Tab {
  const p = new URLSearchParams(location.search)
  if (p.has('booking')) return 'consult'
  const t = p.get('tab')
  if (t === 'family' || t === 'learn' || t === 'consult' || t === 'profile') return t as Tab
  return 'home'
}

export default function App() {
  // SDK init — ready + expand run once, before auth
  useEffect(() => {
    WebApp.ready()
    WebApp.expand()
  }, [])

  // Telegram initData auth — runs once on mount when inside Telegram
  const [tgAuthDone, setTgAuthDone] = useState(() => {
    if (getJwt()) return true
    const tg = (window as any).Telegram?.WebApp
    return !tg?.initData
  })

  useEffect(() => {
    if (tgAuthDone) return
    const tg = (window as any).Telegram?.WebApp
    if (!tg?.initData) { setTgAuthDone(true); return }
    api.authTelegram(tg.initData)
      .then(({ token, user }) => {
        setJwt(token)
        // Use DB user.id as stable owner_id so pets/consultations are linked to the account
        localStorage.setItem('ht_owner_id', user.id)
        if (user.locale && (user.locale === 'uz' || user.locale === 'ru')) {
          setLang(user.locale)
          setLangState(user.locale)
        }
      })
      .catch(() => { /* dev mode without bot token — continue unauthenticated */ })
      .finally(() => setTgAuthDone(true))
  }, [tgAuthDone])

  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem('ht_onboarded'))
  const [tab, setTab] = useState<Tab>(devInitialTab)
  const [flow, setFlow] = useState<Flow | null>(devInitialFlow)
  const [lang, setLangState] = useState(localStorage.getItem('ht_lang') || 'ru')

  const switchLang = () => {
    const next = lang === 'ru' ? 'uz' : 'ru'
    setLang(next)
    setLangState(next)
  }

  const startFlow = (f: Flow) => setFlow(f)
  const endFlow = (returnTab?: Tab) => { setFlow(null); if (returnTab) setTab(returnTab) }

  // Telegram BackButton — show/hide based on active flow
  useEffect(() => {
    if (!flow) {
      WebApp.BackButton.hide()
      return
    }
    const handleBack = () => {
      if (flow.name === 'booking')          endFlow('consult')
      else if (flow.name === 'payment')     startFlow({ name: 'booking', vet: flow.vet })
      else if (flow.name === 'chat')        endFlow('consult')
      else if (flow.name === 'video')       startFlow({ name: 'chat', consultationId: flow.consultationId, vet: flow.vet })
      else if (flow.name === 'insurance-checkout') startFlow({ name: 'insurance' })
      else if (flow.name === 'insurance-success')  endFlow()
      else                                  endFlow()
    }
    WebApp.BackButton.show()
    WebApp.BackButton.onClick(handleBack)
    return () => { WebApp.BackButton.offClick(handleBack) }
  }, [flow])

  // ─── Wait for Telegram auth ──────────────────────────────────────────────────
  if (!tgAuthDone) return (
    <Wrap>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ fontSize: 32 }}>🐾</span>
      </div>
    </Wrap>
  )

  // ─── Onboarding ─────────────────────────────────────────────────────────────
  if (!onboarded) return (
    <Wrap>
      <Onboarding onDone={() => { setOnboarded(true); setLangState(localStorage.getItem('ht_lang') || 'ru') }} />
    </Wrap>
  )

  // ─── Active flow (no bottom nav) ────────────────────────────────────────────
  if (flow) {
    if (flow.name === 'booking') return (
      <Wrap>
        <Booking
          lang={lang} vet={flow.vet}
          prefillPetId={flow.petId}
          reasonEventId={flow.reasonEventId}
          onBack={() => endFlow('consult')}
          onBooked={consultation => startFlow({ name: 'payment', consultation, vet: flow.vet })}
        />
      </Wrap>
    )

    if (flow.name === 'payment') return (
      <Wrap>
        <Payment
          lang={lang} consultation={flow.consultation} vet={flow.vet}
          onBack={() => startFlow({ name: 'booking', vet: flow.vet })}
          onPaid={() => startFlow({ name: 'chat', consultationId: flow.consultation.id, vet: flow.vet })}
        />
      </Wrap>
    )

    if (flow.name === 'chat') return (
      <Wrap>
        <Chat
          lang={lang} consultationId={flow.consultationId} vet={flow.vet}
          onBack={() => endFlow('consult')}
          onVideoCall={() => startFlow({ name: 'video', consultationId: flow.consultationId, vet: flow.vet })}
        />
      </Wrap>
    )

    if (flow.name === 'video') return (
      <Wrap>
        <VideoCall
          consultationId={flow.consultationId} vet={flow.vet}
          onBack={() => startFlow({ name: 'chat', consultationId: flow.consultationId, vet: flow.vet })}
        />
      </Wrap>
    )

    if (flow.name === 'insurance') return (
      <Wrap>
        <Insurance
          lang={lang}
          onBack={() => endFlow()}
          onStart={() => startFlow({ name: 'insurance-checkout' })}
        />
      </Wrap>
    )

    if (flow.name === 'insurance-checkout') return (
      <Wrap>
        <InsuranceCheckout
          lang={lang}
          onBack={() => startFlow({ name: 'insurance' })}
          onSuccess={() => startFlow({ name: 'insurance-success' })}
        />
      </Wrap>
    )

    if (flow.name === 'insurance-success') return (
      <Wrap>
        <InsuranceSuccess onHome={() => endFlow()} />
      </Wrap>
    )

    if (flow.name === 'orders') return (
      <Wrap>
        <Orders
          onBack={() => endFlow('profile')}
          onOpenChat={(consultationId, vetInfo) => startFlow({
            name: 'chat',
            consultationId,
            vet: { ...STUB_VET, ...vetInfo },
          })}
          onRebook={(vet) => startFlow({ name: 'booking', vet: { ...STUB_VET, ...vet } })}
        />
      </Wrap>
    )

    if (flow.name === 'food') return (
      <Wrap>
        <FoodWizard
          onBack={() => endFlow('home')}
          onConsult={() => endFlow('consult')}
        />
      </Wrap>
    )

    if (flow.name === 'clinic-services') return (
      <Wrap>
        <ClinicServicePicker
          onBack={() => endFlow('home')}
          onSelectService={svc => startFlow({ name: 'clinic-list', service: svc })}
        />
      </Wrap>
    )

    if (flow.name === 'clinic-list') return (
      <Wrap>
        <ClinicList
          service={flow.service}
          onBack={() => startFlow({ name: 'clinic-services' })}
          onSelectClinic={clinic => startFlow({ name: 'clinic-detail', clinic, service: flow.service })}
        />
      </Wrap>
    )

    if (flow.name === 'clinic-detail') return (
      <Wrap>
        <ClinicDetail
          clinic={flow.clinic}
          service={flow.service}
          onBack={() => startFlow({ name: 'clinic-list', service: flow.service })}
          onViewOthers={() => startFlow({ name: 'clinic-list', service: flow.service })}
        />
      </Wrap>
    )

    if (flow.name === 'places') return (
      <Wrap>
        <Places onBack={() => endFlow('home')} />
      </Wrap>
    )

    if (flow.name === 'deeds') return (
      <Wrap>
        <Deeds lang={lang} onBack={() => endFlow('home')} />
      </Wrap>
    )

    if (flow.name === 'symptoms') return (
      <Wrap>
        <SymptomChecker
          lang={lang}
          onBookVet={() => endFlow('consult')}
          onBack={() => endFlow('home')}
        />
      </Wrap>
    )
  }

  // ─── Tab screens (with bottom nav) ──────────────────────────────────────────
  return (
    <Wrap>
      {tab === 'home' && (
        <Dashboard
          lang={lang}
          onSwitchLang={switchLang}
          onNavigate={setTab}
          onInsurance={() => startFlow({ name: 'insurance' })}
          onFood={() => startFlow({ name: 'food' })}
          onClinics={() => startFlow({ name: 'clinic-services' })}
          onPlaces={() => startFlow({ name: 'places' })}
          onDeeds={() => startFlow({ name: 'deeds' })}
          onSymptoms={() => startFlow({ name: 'symptoms' })}
        />
      )}
      {tab === 'consult' && (
        <Home
          lang={lang}
          onSwitchLang={switchLang}
          onSelectVet={vet => startFlow({ name: 'booking', vet })}
          onInsurance={() => startFlow({ name: 'insurance' })}
        />
      )}
      {tab === 'family'  && (
        <Family
          lang={lang}
          onAskVet={(petId, reasonEventId) => {
            setTab('consult')
            startFlow({ name: 'booking', vet: STUB_VET, petId, reasonEventId })
          }}
        />
      )}
      {tab === 'learn'   && <LearnHub lang={lang} />}
      {tab === 'profile' && (
        <Profile lang={lang} onSwitchLang={switchLang} onNavigate={setTab} onOrders={() => startFlow({ name: 'orders' })} />
      )}

      <BottomNav active={tab} onChange={setTab} />
    </Wrap>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      maxWidth: 480, margin: '0 auto', minHeight: '100vh',
      position: 'relative', background: 'var(--bg)',
    }}>
      {children}
    </div>
  )
}
