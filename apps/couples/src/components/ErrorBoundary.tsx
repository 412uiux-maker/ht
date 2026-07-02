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
        justifyContent: 'center', minHeight: '100vh', padding: 24, gap: 16,
        background: 'var(--bg)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48 }}>🐾</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>
          Что-то пошло не так
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.6 }}>
          Произошла ошибка. Пожалуйста, перезапустите приложение.
        </div>
        <button
          onClick={() => { this.setState({ error: null }); window.location.reload() }}
          style={{
            padding: '12px 28px', borderRadius: 'var(--r-pill)',
            background: 'var(--primary)', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            fontFamily: 'inherit', minHeight: 48,
          }}
        >
          Обновить
        </button>
      </div>
    )
  }
}
