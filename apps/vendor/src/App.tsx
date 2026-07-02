import { useState } from 'react'
import { getSession, setSession as persistSession, clearSession } from './types'
import type { VendorSession } from './types'
import Login from './screens/Login'
import Register from './screens/Register'
import VerificationPending from './screens/VerificationPending'
import Dashboard from './screens/Dashboard'
import Chat from './screens/Chat'
import Services from './screens/Services'
import Finances from './screens/Finances'
import Reviews from './screens/Reviews'
import VendorProfile from './screens/VendorProfile'
import Schedule from './screens/Schedule'
import Clients from './screens/Clients'
import Orders from './screens/Orders'
import Layout from './components/Layout'
import IncomingCall, { type IncomingCallInfo } from './components/IncomingCall'
import VideoCall from './screens/VideoCall'

type Screen =
  | 'login'
  | 'register'
  | 'verification_pending'
  | 'dashboard'
  | 'orders'
  | 'clients'
  | 'services'
  | 'schedule'
  | 'finances'
  | 'reviews'
  | 'profile'

type AppScreen =
  | Screen
  | { name: 'chat'; consultId: string; clientName?: string; petName?: string; petSpecies?: string }
  | { name: 'video'; consultId: string; clientName: string; petName: string; petSpecies: string }

function devInitialScreen(session: VendorSession | null): AppScreen {
  const p = new URLSearchParams(location.search)
  const chatId = p.get('chat')
  if (session && chatId) return { name: 'chat', consultId: chatId }
  return session ? 'dashboard' : 'login'
}

export default function App() {
  const [session, setSessionState] = useState<VendorSession | null>(() => getSession())
  const [screen, setScreen] = useState<AppScreen>(() => devInitialScreen(getSession()))

  const handleLogin = (s: VendorSession) => {
    persistSession(s)
    setSessionState(s)
    if (s.verification_status === 'pending' || s.verification_status === 'rejected') {
      setScreen('verification_pending')
    } else {
      setScreen('dashboard')
    }
  }

  const handleRegister = (s: VendorSession) => {
    persistSession(s)
    setSessionState(s)
    setScreen('verification_pending')
  }

  const handleLogout = () => {
    clearSession()
    setSessionState(null)
    setScreen('login')
  }

  const handleSessionUpdate = (s: VendorSession) => {
    setSessionState(s)
  }

  if (screen === 'register') {
    return <Register onRegister={handleRegister} onBack={() => setScreen('login')} />
  }

  if (screen === 'login' || !session) {
    return <Login onLogin={handleLogin} onRegister={() => setScreen('register')} />
  }

  if (screen === 'verification_pending') {
    return (
      <VerificationPending
        session={session}
        onApproved={(s) => {
          persistSession(s)
          setSessionState(s)
          setScreen('dashboard')
        }}
        onLogout={handleLogout}
      />
    )
  }

  const handleIncomingCall = (info: IncomingCallInfo) => {
    setScreen({
      name: 'video',
      consultId: info.room,
      clientName: info.client_name,
      petName: info.pet_name,
      petSpecies: info.pet_species,
    })
  }

  if (typeof screen === 'object' && screen.name === 'video') {
    return (
      <VideoCall
        consultationId={screen.consultId}
        clientName={screen.clientName}
        petName={screen.petName}
        petSpecies={screen.petSpecies}
        onBack={() => setScreen({ name: 'chat', consultId: screen.consultId, clientName: screen.clientName, petName: screen.petName, petSpecies: screen.petSpecies })}
      />
    )
  }

  if (typeof screen === 'object' && screen.name === 'chat') {
    return (
      <>
        <IncomingCall vetId={session.vet_id} onAccept={handleIncomingCall} />
        <Chat
          consultId={screen.consultId}
          session={session}
          onBack={() => setScreen('dashboard')}
          onVideoCall={(info) => setScreen({
            name: 'video',
            consultId: screen.consultId,
            clientName: info.clientName,
            petName: info.petName,
            petSpecies: info.petSpecies,
          })}
        />
      </>
    )
  }

  const activeScreen = typeof screen === 'string' ? screen : 'dashboard'

  return (
    <>
    <IncomingCall vetId={session.vet_id} onAccept={handleIncomingCall} />
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
      {activeScreen === 'orders'    && (
        <Orders onOpenChat={(id) => setScreen({ name: 'chat', consultId: id })} />
      )}
      {activeScreen === 'clients'   && <Clients />}
      {activeScreen === 'services'  && <Services />}
      {activeScreen === 'schedule'  && <Schedule />}
      {activeScreen === 'finances'  && <Finances />}
      {activeScreen === 'reviews'  && <Reviews />}
      {activeScreen === 'profile'  && (
        <VendorProfile session={session} onSessionUpdate={handleSessionUpdate} />
      )}
    </Layout>
    </>
  )
}
