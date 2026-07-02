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
        background: 'var(--bg)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48 }}>🐾</div>
        <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>
          Что-то пошло не так
        </div>
        {process.env.NODE_ENV !== 'production' && (
          <pre style={{
            fontSize: 12, color: 'var(--danger)', background: 'var(--surface)',
            padding: '10px 14px', borderRadius: 8, maxWidth: 600,
            overflow: 'auto', textAlign: 'left', whiteSpace: 'pre-wrap',
          }}>
            {this.state.error.message}
          </pre>
        )}
        <button
          onClick={() => { this.setState({ error: null }); window.location.reload() }}
          style={{
            padding: '12px 28px', borderRadius: 999,
            background: 'var(--primary)', color: '#fff',
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
