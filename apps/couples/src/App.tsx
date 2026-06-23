import { useState } from 'react'
import type { Vet, Consultation } from './api'
import { setLang } from './i18n'
import BottomNav, { type Tab } from './components/BottomNav'
import Onboarding from './screens/Onboarding'
import Dashboard from './screens/Dashboard'
import Home from './screens/Home'          // vet list — used as Consult tab
import Booking from './screens/Booking'
import Payment from './screens/Payment'
import Chat from './screens/Chat'
import Pets from './screens/Pets'
import LearnHub from './screens/LearnHub'
import Profile from './screens/Profile'
import Insurance from './screens/Insurance'
import InsuranceCheckout from './screens/InsuranceCheckout'
import InsuranceSuccess from './screens/InsuranceSuccess'

// Flows that cover the full screen (no bottom nav)
type Flow =
  | { name: 'booking'; vet: Vet }
  | { name: 'payment'; consultation: Consultation; vet: Vet }
  | { name: 'chat'; consultationId: string; vet: Vet }
  | { name: 'insurance' }
  | { name: 'insurance-checkout' }
  | { name: 'insurance-success' }

const STUB_VET: Vet = {
  id: 1, name: 'Азиз Каримов', specialty: 'Терапевт (кошки, собаки)',
  avatar_emoji: '🐕', rating: 4.9, experience_yr: 8, price_uzs: 120000,
  is_available: true, bio: '',
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
  return 'home'
}

export default function App() {
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
      {tab === 'pets'    && <Pets    lang={lang} />}
      {tab === 'learn'   && <LearnHub lang={lang} />}
      {tab === 'profile' && (
        <Profile lang={lang} onSwitchLang={switchLang} onNavigate={setTab} />
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
