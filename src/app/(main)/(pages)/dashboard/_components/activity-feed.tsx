'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, CheckCircle2, Clock, GitBranch, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock activity data - in a real app this would come from a database
const activities = [
    {
        id: 1,
        type: 'workflow_created',
        title: 'Workflow Created',
        description: 'New automation was set up',
        timestamp: '2 hours ago',
        icon: GitBranch,
        color: 'text-blue-500 bg-blue-500/10',
    },
    {
        id: 2,
        type: 'workflow_published',
        title: 'Workflow Published',
        description: 'Automation is now active',
        timestamp: '5 hours ago',
        icon: CheckCircle2,
        color: 'text-green-500 bg-green-500/10',
    },
    {
        id: 3,
        type: 'workflow_executed',
        title: 'Workflow Executed',
        description: 'Automation ran successfully',
        timestamp: '1 day ago',
        icon: Zap,
        color: 'text-purple-500 bg-purple-500/10',
    },
    {
        id: 4,
        type: 'pending',
        title: 'Waiting for trigger',
        description: 'Monitoring Google Drive for changes',
        timestamp: 'Ongoing',
        icon: Clock,
        color: 'text-orange-500 bg-orange-500/10',
    },
]

const ActivityFeed = () => {
    return (
        <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-muted-foreground/20 to-transparent" />

                    <div className="space-y-4">
                        {activities.map((activity, index) => (
                            <div
                                key={activity.id}
                                className={cn(
                                    'relative flex items-start gap-4 pl-2',
                                    'animate-in fade-in slide-in-from-left-2',
                                )}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className={cn(
                                    'relative z-10 flex items-center justify-center w-8 h-8 rounded-full',
                                    activity.color
                                )}>
                                    <activity.icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-sm">{activity.title}</p>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {activity.timestamp}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {activity.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default ActivityFeed
