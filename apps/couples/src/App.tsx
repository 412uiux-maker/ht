import { useState } from 'react'
import type { Vet, Consultation } from './api'
import { setLang } from './i18n'
import Home from './screens/Home'
import Booking from './screens/Booking'
import Payment from './screens/Payment'
import Chat from './screens/Chat'
import Insurance from './screens/Insurance'
import InsuranceCheckout from './screens/InsuranceCheckout'
import InsuranceSuccess from './screens/InsuranceSuccess'

type Screen =
  | { name: 'home' }
  | { name: 'booking'; vet: Vet }
  | { name: 'payment'; consultation: Consultation; vet: Vet }
  | { name: 'chat'; consultationId: string; vet: Vet }
  | { name: 'insurance' }
  | { name: 'insurance-checkout' }
  | { name: 'insurance-success' }

// Dev shortcut: ?chat=<id> opens chat with first vet for quick testing
const STUB_VET: Vet = { id: 1, name: 'Азиз Каримов', specialty: 'Терапевт (кошки, собаки)', avatar_emoji: '🐕', rating: 4.9, experience_yr: 8, price_uzs: 120000, is_available: true, bio: '' }

function devInitialScreen(): Screen {
  const p = new URLSearchParams(location.search)
  const chatId = p.get('chat')
  if (chatId) return { name: 'chat', consultationId: chatId, vet: STUB_VET }
  if (p.has('booking')) return { name: 'booking', vet: STUB_VET }
  return { name: 'home' }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(devInitialScreen)
  const [lang, setLangState] = useState(localStorage.getItem('ht_lang') || 'ru')

  const switchLang = () => {
    const next = lang === 'ru' ? 'uz' : 'ru'
    setLang(next)
    setLangState(next)
  }

  if (screen.name === 'home') {
    return (
      <Wrap>
        <Home
          lang={lang}
          onSwitchLang={switchLang}
          onSelectVet={(vet) => setScreen({ name: 'booking', vet })}
          onInsurance={() => setScreen({ name: 'insurance' })}
        />
      </Wrap>
    )
  }

  if (screen.name === 'booking') {
    return (
      <Wrap>
        <Booking
          lang={lang}
          vet={screen.vet}
          onBack={() => setScreen({ name: 'home' })}
          onBooked={(consultation) =>
            setScreen({ name: 'payment', consultation, vet: screen.vet })
          }
        />
      </Wrap>
    )
  }

  if (screen.name === 'payment') {
    return (
      <Wrap>
        <Payment
          lang={lang}
          consultation={screen.consultation}
          vet={screen.vet}
          onBack={() => setScreen({ name: 'booking', vet: screen.vet })}
          onPaid={() =>
            setScreen({ name: 'chat', consultationId: screen.consultation.id, vet: screen.vet })
          }
        />
      </Wrap>
    )
  }

  if (screen.name === 'insurance') {
    return (
      <Wrap>
        <Insurance
          lang={lang}
          onBack={() => setScreen({ name: 'home' })}
          onStart={() => setScreen({ name: 'insurance-checkout' })}
        />
      </Wrap>
    )
  }

  if (screen.name === 'insurance-checkout') {
    return (
      <Wrap>
        <InsuranceCheckout
          lang={lang}
          onBack={() => setScreen({ name: 'insurance' })}
          onSuccess={() => setScreen({ name: 'insurance-success' })}
        />
      </Wrap>
    )
  }

  if (screen.name === 'insurance-success') {
    return (
      <Wrap>
        <InsuranceSuccess onHome={() => setScreen({ name: 'home' })} />
      </Wrap>
    )
  }

  return (
    <Wrap>
      <Chat
        lang={lang}
        consultationId={screen.consultationId}
        vet={screen.vet}
        onBack={() => setScreen({ name: 'home' })}
      />
    </Wrap>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative', background: 'var(--bg)' }}>
      {children}
    </div>
  )
}
