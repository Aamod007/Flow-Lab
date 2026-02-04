'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, CheckCircle2, Clock, GitBranch, Zap, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityItem {
    id: number
    type: string
    title: string
    description: string
    timestamp: string
    icon: any
    color: string
}

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'workflow_created':
            return { icon: GitBranch, color: 'text-blue-500 bg-blue-500/10' }
        case 'workflow_published':
            return { icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' }
        case 'workflow_executed':
            return { icon: Zap, color: 'text-purple-500 bg-purple-500/10' }
        default:
            return { icon: Clock, color: 'text-orange-500 bg-orange-500/10' }
    }
}

const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
}

const ActivityFeed = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await fetch('/api/activity')
                if (response.ok) {
                    const data = await response.json()
                    setActivities(data.activities || [])
                } else {
                    // If API not ready, show empty state
                    setActivities([])
                }
            } catch (error) {
                console.error('Error fetching activities:', error)
                setActivities([])
            } finally {
                setLoading(false)
            }
        }

        fetchActivities()
    }, [])

    if (loading) {
        return (
            <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5 text-primary" />
                        Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No recent activity</p>
                        <p className="text-sm mt-1">Create and run workflows to see activity here</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-muted-foreground/20 to-transparent" />

                        <div className="space-y-4">
                            {activities.map((activity, index) => {
                                const { icon: Icon, color } = getActivityIcon(activity.type)
                                return (
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
                                            color
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-medium text-sm">{activity.title}</p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatTimestamp(activity.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {activity.description}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default ActivityFeed
