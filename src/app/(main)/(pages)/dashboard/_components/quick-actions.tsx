'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Plus,
    Settings,
    Plug,
    CreditCard,
    ArrowUpRight,
    Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const actions = [
    {
        title: 'New Workflow',
        description: 'Create a new automation',
        icon: Plus,
        href: '/workflows',
        primary: true,
    },
    {
        title: 'Connections',
        description: 'Manage your integrations',
        icon: Plug,
        href: '/connections',
    },
    {
        title: 'Billing',
        description: 'View credits & plans',
        icon: CreditCard,
        href: '/billing',
    },
    {
        title: 'Settings',
        description: 'Configure your account',
        icon: Settings,
        href: '/settings',
    },
]

const QuickActions = () => {
    return (
        <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5" />
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
                {actions.map((action) => (
                    <Link key={action.title} href={action.href}>
                        <div className={cn(
                            'flex flex-col gap-2 p-4 rounded-lg transition-all duration-200',
                            'border border-neutral-800 hover:border-neutral-600',
                            'group cursor-pointer hover:bg-neutral-800/50',
                            action.primary && 'bg-neutral-800/30'
                        )}>
                            <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                                action.primary 
                                    ? 'bg-white group-hover:scale-110' 
                                    : 'bg-neutral-800 group-hover:bg-white group-hover:scale-110'
                            )}>
                                <action.icon className={cn(
                                    'h-5 w-5 transition-colors',
                                    action.primary 
                                        ? 'text-black' 
                                        : 'text-white group-hover:text-black'
                                )} />
                            </div>
                            <div>
                                <p className="font-medium flex items-center gap-1">
                                    {action.title}
                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {action.description}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}

export default QuickActions
