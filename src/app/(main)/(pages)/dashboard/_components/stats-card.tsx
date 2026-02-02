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
            'relative overflow-hidden border-neutral-800 bg-neutral-900/50 transition-all duration-300 hover:bg-neutral-800/50 hover:border-neutral-700 group cursor-default',
            className
        )}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold tracking-tight group-hover:scale-105 transition-transform origin-left">{value}</p>
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                        {trend && (
                            <div className="flex items-center gap-1 mt-2">
                                <span className={cn(
                                    'text-xs font-medium',
                                    trend.isPositive ? 'text-white' : 'text-neutral-400'
                                )}>
                                    {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                                </span>
                                <span className="text-xs text-muted-foreground">from last month</span>
                            </div>
                        )}
                    </div>
                    <div className={cn(
                        'p-3 rounded-xl bg-white transition-transform group-hover:scale-110',
                        iconClassName
                    )}>
                        <Icon className="h-6 w-6 text-black" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default StatsCard
