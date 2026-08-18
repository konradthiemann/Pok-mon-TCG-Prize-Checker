import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, sans-serif',
          background: '#f1faf2',
          color: '#0e2a32',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
          Etwas ist schiefgelaufen
        </h1>
        <p style={{ fontSize: 14, color: '#64837b', margin: '0 0 20px', maxWidth: 320 }}>
          Die App ist auf einen unerwarteten Fehler gestoßen. Bitte lade die Seite neu.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: 12,
            background: '#4fc3f7',
            color: '#06323f',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Neu laden
        </button>
      </div>
    )
  }
}
