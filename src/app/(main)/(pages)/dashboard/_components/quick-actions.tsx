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
        color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
        primary: true,
    },
    {
        title: 'Connections',
        description: 'Manage your integrations',
        icon: Plug,
        href: '/connections',
        color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
    },
    {
        title: 'Billing',
        description: 'View credits & plans',
        icon: CreditCard,
        href: '/billing',
        color: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
    },
    {
        title: 'Settings',
        description: 'Configure your account',
        icon: Settings,
        href: '/settings',
        color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
    },
]

const QuickActions = () => {
    return (
        <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
                {actions.map((action) => (
                    <Link key={action.title} href={action.href}>
                        <div className={cn(
                            'flex flex-col gap-2 p-4 rounded-lg transition-all duration-200',
                            'border border-transparent hover:border-primary/20',
                            'group cursor-pointer',
                            action.primary ? 'bg-primary/10 hover:bg-primary/20' : 'bg-muted/30 hover:bg-muted/50'
                        )}>
                            <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                                action.color
                            )}>
                                <action.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className={cn(
                                    'font-medium flex items-center gap-1',
                                    action.primary && 'text-primary'
                                )}>
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
