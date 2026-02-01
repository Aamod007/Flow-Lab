'use client'

import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

export default function WorkflowNotFound() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-8">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-full bg-muted p-4">
                    <FileQuestion className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">
                        Workflow Not Found
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md">
                        The workflow you&apos;re looking for doesn&apos;t exist or may have been deleted.
                    </p>
                </div>
            </div>
            <div className="flex gap-3">
                <Button asChild variant="default">
                    <Link href="/workflows">
                        View All Workflows
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/dashboard">
                        Go to Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    )
}
