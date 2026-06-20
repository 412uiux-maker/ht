import { useState } from 'react'
import { Vet } from './api'
import Home from './screens/Home'
import Booking from './screens/Booking'
import Chat from './screens/Chat'

type Screen =
  | { name: 'home' }
  | { name: 'booking'; vet: Vet }
  | { name: 'chat'; consultationId: string; vetName: string }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const [lang, setLangState] = useState(localStorage.getItem('ht_lang') || 'ru')

  const switchLang = () => {
    const next = lang === 'ru' ? 'uz' : 'ru'
    localStorage.setItem('ht_lang', next)
    setLangState(next)
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
      {screen.name === 'home' && (
        <Home
          lang={lang}
          onSwitchLang={switchLang}
          onSelectVet={(vet) => setScreen({ name: 'booking', vet })}
        />
      )}
      {screen.name === 'booking' && (
        <Booking
          lang={lang}
          vet={(screen as { name: 'booking'; vet: Vet }).vet}
          onBack={() => setScreen({ name: 'home' })}
          onBooked={(id) =>
            setScreen({
              name: 'chat',
              consultationId: id,
              vetName: (screen as { name: 'booking'; vet: Vet }).vet.name,
            })
          }
        />
      )}
      {screen.name === 'chat' && (
        <Chat
          lang={lang}
          consultationId={(screen as { name: 'chat'; consultationId: string; vetName: string }).consultationId}
          vetName={(screen as { name: 'chat'; consultationId: string; vetName: string }).vetName}
          onBack={() => setScreen({ name: 'home' })}
        />
      )}
    </div>
  )
}
