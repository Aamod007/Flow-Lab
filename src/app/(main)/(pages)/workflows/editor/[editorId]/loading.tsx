'use client'

import { Loader2 } from 'lucide-react'

export default function WorkflowEditorLoading() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 blur-xl opacity-50 animate-pulse" />
                    <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
                </div>
                <div className="space-y-2 text-center">
                    <h2 className="text-lg font-medium text-foreground">
                        Loading Workflow Editor
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Please wait while we prepare your workflow...
                    </p>
                </div>
            </div>
        </div>
    )
}
