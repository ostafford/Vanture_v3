/**
 * Phase 5: Top-level Error Boundary for unhandled render/effect errors.
 * Shows a friendly message and recovery options; logs error for debugging.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error', error, errorInfo)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 24,
            backgroundColor: 'var(--vantura-background, #f7f7f7)',
            color: 'var(--vantura-text, #1a1a1a)',
          }}
        >
          <h2 className="mb-3">Something went wrong</h2>
          <p className="text-muted mb-4 text-center">
            An unexpected error occurred. You can try reloading the app or going back to the dashboard.
          </p>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleReload}
            >
              Reload app
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={this.handleReset}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
