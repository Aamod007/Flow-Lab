'use client'

import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ConnectionsLoading() {
    return (
        <div className="relative flex flex-col gap-4">
            {/* Header Skeleton */}
            <div className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg">
                <div className="h-10 w-48 bg-muted rounded animate-pulse" />
                <div className="h-9 w-28 bg-muted rounded animate-pulse" />
            </div>

            <div className="p-6 flex flex-col gap-6">
                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="border-muted-foreground/20">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 bg-muted rounded-lg animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Info Banner Skeleton */}
                <Card className="border-muted-foreground/20">
                    <CardContent className="p-4">
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-2" />
                    </CardContent>
                </Card>

                {/* Loading Indicator */}
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>

                {/* Connection Cards Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-muted rounded w-1/3 animate-pulse" />
                                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
