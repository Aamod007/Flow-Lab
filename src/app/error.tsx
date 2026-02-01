'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Application error:', error)
    }, [error])

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
            <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
                <p className="text-muted-foreground max-w-md">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </p>
                {error.digest && (
                    <p className="text-xs text-muted-foreground/60">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
            <div className="flex gap-2">
                <Button
                    onClick={() => reset()}
                    variant="default"
                >
                    Try again
                </Button>
                <Button
                    onClick={() => window.location.href = '/dashboard'}
                    variant="outline"
                >
                    Go to Dashboard
                </Button>
            </div>
        </div>
    )
}
