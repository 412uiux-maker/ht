import { useState, useEffect } from 'react'
import type { AdminSession } from './types'
import { setApiSession } from './api'
import Login from './screens/Login'
import Layout from './components/Layout'
import Dashboard from './screens/Dashboard'
import Verification from './screens/Verification'
import Consultations from './screens/Consultations'
import Orders from './screens/Orders'
import Promos from './screens/Promos'
import Audit from './screens/Audit'
import Finances from './screens/Finances'
import Content from './screens/Content'
import Users from './screens/Users'
import Settings from './screens/Settings'
import Learning from './screens/Learning'
import Reviews from './screens/Reviews'
import Deeds from './screens/Deeds'

type Screen = 'dashboard' | 'verification' | 'consultations' | 'orders' | 'promos' | 'audit' | 'finances' | 'content' | 'learning' | 'users' | 'settings' | 'reviews' | 'deeds'

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(() => {
    const s = localStorage.getItem('ht_admin')
    return s ? JSON.parse(s) : null
  })
  const [screen, setScreen] = useState<Screen>('dashboard')

  useEffect(() => { setApiSession(session) }, [session])

  const handleLogin = (s: AdminSession) => {
    localStorage.setItem('ht_admin', JSON.stringify(s))
    setApiSession(s)
    setSession(s)
  }

  const handleLogout = () => {
    localStorage.removeItem('ht_admin')
    setApiSession(null)
    setSession(null)
  }

  if (!session) return <Login onLogin={handleLogin} />

  return (
    <Layout session={session} activeScreen={screen} onNavigate={s => setScreen(s as Screen)} onLogout={handleLogout}>
      {screen === 'dashboard'      && <Dashboard />}
      {screen === 'verification'   && <Verification />}
      {screen === 'consultations'  && <Consultations />}
      {screen === 'orders'         && <Orders session={session} />}
      {screen === 'finances'       && <Finances />}
      {screen === 'users'          && <Users sessionRole={session.role} />}
      {screen === 'content'        && <Content />}
      {screen === 'learning'       && <Learning />}
      {screen === 'reviews'        && <Reviews />}
      {screen === 'deeds'          && <Deeds />}
      {screen === 'promos'         && <Promos session={session} />}
      {screen === 'settings'       && <Settings />}
      {screen === 'audit'          && <Audit />}
    </Layout>
  )
}
