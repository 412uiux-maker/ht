import { useState } from 'react'
import { getSession, setSession as persistSession, clearSession } from './types'
import type { VendorSession } from './types'
import Login from './screens/Login'
import Dashboard from './screens/Dashboard'
import Chat from './screens/Chat'
import Services from './screens/Services'
import Finances from './screens/Finances'
import Reviews from './screens/Reviews'
import VendorProfile from './screens/VendorProfile'
import Layout from './components/Layout'

type Screen =
  | 'login'
  | 'dashboard'
  | 'services'
  | 'finances'
  | 'reviews'
  | 'profile'

function devInitialScreen(session: VendorSession | null): Screen | { name: 'chat'; consultId: string } {
  const p = new URLSearchParams(location.search)
  const chatId = p.get('chat')
  if (session && chatId) return { name: 'chat', consultId: chatId }
  return session ? 'dashboard' : 'login'
}

export default function App() {
  const [session, setSessionState] = useState<VendorSession | null>(() => getSession())
  const [screen, setScreen] = useState<Screen | { name: 'chat'; consultId: string }>(
    () => devInitialScreen(getSession())
  )

  const handleLogin = (s: VendorSession) => {
    persistSession(s)
    setSessionState(s)
    setScreen('dashboard')
  }

  const handleLogout = () => {
    clearSession()
    setSessionState(null)
    setScreen('login')
  }

  const handleSessionUpdate = (s: VendorSession) => {
    setSessionState(s)
  }

  if (screen === 'login' || !session) {
    return <Login onLogin={handleLogin} />
  }

  if (typeof screen === 'object' && screen.name === 'chat') {
    return (
      <Chat
        consultId={screen.consultId}
        session={session}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  const activeScreen = typeof screen === 'string' ? screen : 'dashboard'

  return (
    <Layout
      session={session}
      activeScreen={activeScreen}
      onNavigate={s => setScreen(s as Screen)}
      onLogout={handleLogout}
    >
      {activeScreen === 'dashboard' && (
        <Dashboard
          session={session}
          onLogout={handleLogout}
          onOpenChat={(id) => setScreen({ name: 'chat', consultId: id })}
        />
      )}
      {activeScreen === 'services' && <Services />}
      {activeScreen === 'finances' && <Finances />}
      {activeScreen === 'reviews'  && <Reviews />}
      {activeScreen === 'profile'  && (
        <VendorProfile session={session} onSessionUpdate={handleSessionUpdate} />
      )}
    </Layout>
  )
}
