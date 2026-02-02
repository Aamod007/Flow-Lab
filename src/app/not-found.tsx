'use client'

import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <div className="flex flex-col items-center gap-6 text-center max-w-md">
                <div className="space-y-2">
                    <h1 className="text-8xl font-bold text-primary/20">404</h1>
                    <h2 className="text-2xl font-semibold text-foreground">
                        Page Not Found
                    </h2>
                    <p className="text-muted-foreground">
                        Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button asChild variant="default">
                        <Link href="/dashboard">
                            <Home className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="javascript:history.back()">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
