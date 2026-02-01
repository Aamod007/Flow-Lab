'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function WorkflowEditorError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Workflow editor error:', error)
    }, [error])

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-8">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-destructive/10 p-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                        Error Loading Workflow Editor
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md">
                        {error.message || 'Failed to load the workflow editor. This may be due to a connection issue or invalid workflow ID.'}
                    </p>
                </div>
            </div>
            <div className="flex gap-3">
                <Button onClick={() => reset()} variant="default">
                    Retry
                </Button>
                <Button
                    onClick={() => window.location.href = '/workflows'}
                    variant="outline"
                >
                    Back to Workflows
                </Button>
            </div>
        </div>
    )
}
