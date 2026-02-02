'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    className?: string
    iconClassName?: string
}

const StatsCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
    iconClassName,
}: Props) => {
    return (
        <Card className={cn(
            'relative overflow-hidden border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30',
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                        {trend && (
                            <div className="flex items-center gap-1 mt-2">
                                <span className={cn(
                                    'text-xs font-medium',
                                    trend.isPositive ? 'text-green-500' : 'text-red-500'
                                )}>
                                    {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                                </span>
                                <span className="text-xs text-muted-foreground">from last month</span>
                            </div>
                        )}
                    </div>
                    <div className={cn(
                        'p-3 rounded-xl bg-primary/10',
                        iconClassName
                    )}>
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                </div>
                {/* Decorative gradient */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl" />
            </CardContent>
        </Card>
    )
}

export default StatsCard
