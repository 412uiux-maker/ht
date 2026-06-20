import { useState } from 'react'
import type { Vet } from './api'
import { setLang } from './i18n'
import Home from './screens/Home'
import Booking from './screens/Booking'
import Chat from './screens/Chat'

type Screen =
  | { name: 'home' }
  | { name: 'booking'; vet: Vet }
  | { name: 'chat'; consultationId: string; vet: Vet }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
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
          onBooked={(id) => setScreen({ name: 'chat', consultationId: id, vet: screen.vet })}
        />
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
