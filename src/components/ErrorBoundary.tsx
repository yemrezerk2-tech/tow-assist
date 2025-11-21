'use client'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary caught:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="pro-card rounded-2xl p-8 border-4 border-red-500 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Etwas ist schiefgelaufen</h2>
            <p className="text-gray-600 mb-6">Bitte laden Sie die Seite neu.</p>
            <button 
              onClick={() => window.location.reload()}
              className="road-sign px-6 py-3 font-semibold"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}