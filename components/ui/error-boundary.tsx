// components/ui/error-boundary.tsx

'use client'

import { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    Sentry.withScope((scope) => {
      scope.setExtras({ componentStack: errorInfo.componentStack })
      Sentry.captureException(error)
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-5xl mb-4">😅</div>
            <h2 className="text-xl font-semibold text-[#1B4332] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 mb-4 max-w-md">
              An unexpected error occurred. Please try again.
            </p>
            <Button
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
