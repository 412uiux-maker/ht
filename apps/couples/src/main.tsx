import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Telegram Mini App initialization
const tg = (window as any).Telegram?.WebApp
if (tg) {
  tg.ready()
  tg.expand()
  document.documentElement.dataset.theme = tg.colorScheme === 'dark' ? 'dark' : 'light'
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
