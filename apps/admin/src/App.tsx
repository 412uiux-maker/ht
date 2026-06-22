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

type Screen = 'dashboard' | 'verification' | 'consultations' | 'orders' | 'promos' | 'audit'

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(() => {
    const s = localStorage.getItem('ht_admin')
    return s ? JSON.parse(s) : null
  })
  const [screen, setScreen] = useState<Screen>('dashboard')

  useEffect(() => { setApiSession(session) }, [session])

  const handleLogin = (s: AdminSession, pwd: string) => {
    localStorage.setItem('ht_admin', JSON.stringify(s))
    localStorage.setItem('ht_admin_pwd', pwd)
    setApiSession(s)
    setSession(s)
  }

  const handleLogout = () => {
    localStorage.removeItem('ht_admin')
    localStorage.removeItem('ht_admin_pwd')
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
      {screen === 'promos'         && <Promos session={session} />}
      {screen === 'audit'          && <Audit />}
    </Layout>
  )
}
