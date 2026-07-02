import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', padding: 32, gap: 16,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48 }}>🐾</div>
        <div style={{ fontWeight: 700, fontSize: 20 }}>Что-то пошло не так</div>
        <div style={{ fontSize: 14, color: '#6C7480', maxWidth: 320, lineHeight: 1.6 }}>
          Произошла неожиданная ошибка. Обновите страницу или обратитесь в поддержку.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 28px', borderRadius: 999,
            background: '#F2784B', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Обновить страницу
        </button>
      </div>
    )
  }
}
