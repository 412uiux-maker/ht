import { useState } from 'react'
import { getSession, setSession, clearSession } from './types'
import type { VendorSession } from './types'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Chat from './screens/Chat'

type Screen =
  | { name: 'login' }
  | { name: 'dashboard' }
  | { name: 'chat'; consultId: string }

function devInitialScreen(session: VendorSession | null): Screen {
  const p = new URLSearchParams(location.search)
  const chatId = p.get('chat')
  if (session && chatId) return { name: 'chat', consultId: chatId }
  return session ? { name: 'dashboard' } : { name: 'login' }
}

export default function App() {
  const [session, setSessionState] = useState<VendorSession | null>(() => getSession())
  const [screen, setScreen] = useState<Screen>(() => devInitialScreen(getSession()))

  const handleLogin = (s: VendorSession) => {
    setSession(s)
    setSessionState(s)
    setScreen({ name: 'dashboard' })
  }

  const handleLogout = () => {
    clearSession()
    setSessionState(null)
    setScreen({ name: 'login' })
  }

  if (screen.name === 'login' || !session) {
    return <Login onLogin={handleLogin} />
  }

  if (screen.name === 'chat') {
    return (
      <Chat
        consultId={screen.consultId}
        session={session}
        onBack={() => setScreen({ name: 'dashboard' })}
      />
    )
  }

  return (
    <Dashboard
      session={session}
      onLogout={handleLogout}
      onOpenChat={(id) => setScreen({ name: 'chat', consultId: id })}
    />
  )
}
