'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Props for error fallback components
 */
export interface ErrorFallbackProps {
  error: Error
  reset: () => void
}

/**
 * ErrorBoundary class component that catches React component errors
 * and displays a fallback UI instead of crashing the entire application.
 * 
 * Features:
 * - Catches errors in child components
 * - Displays customizable fallback UI
 * - Provides reset functionality to recover without page reload
 * - Logs errors for debugging
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 * 
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorFallback}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  /**
   * Update state when an error is caught
   * This lifecycle method is called during the "render" phase
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Log error details when an error is caught
   * This lifecycle method is called during the "commit" phase
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error for debugging (in production, this could send to a monitoring service)
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Call optional error handler prop
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  /**
   * Reset the error boundary state to recover from the error
   * This allows the component to try rendering again without a full page reload
   */
  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided, otherwise use default
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error}
          reset={this.reset}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Default error fallback component that displays a user-friendly error message
 * with a reset button to recover from the error.
 * 
 * Features:
 * - User-friendly error message (no technical jargon)
 * - Reset button to recover without page reload
 * - Maintains application's visual design
 * - Does NOT expose stack traces or sensitive information
 * 
 * @param props - Error fallback props containing error and reset function
 */
export function DefaultErrorFallback({
  error,
  reset,
}: ErrorFallbackProps): JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">
            Something went wrong
          </CardTitle>
          <CardDescription>
            We encountered an unexpected error. Don&apos;t worry, your data is safe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={reset}
            variant="default"
            className="flex-1"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex-1"
          >
            Reload page
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Export default for convenience
 */
export default ErrorBoundary
