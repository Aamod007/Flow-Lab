'use client'

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
    CheckCircle2,
    XCircle,
    Loader2,
    PlayCircle,
    Brain,
    Clock,
    ChevronRight,
    Zap,
    MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExecutionEvent } from './live-execution-panel'

interface ExecutionTimelineProps {
    events: ExecutionEvent[]
    currentAgentId?: string
    onEventClick?: (event: ExecutionEvent) => void
    selectedEventId?: string
}

const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
    events,
    currentAgentId,
    onEventClick,
    selectedEventId
}) => {
    const getEventIcon = (event: ExecutionEvent) => {
        switch (event.type) {
            case 'STARTED':
                if (event.agentId === 'system') {
                    return <PlayCircle className="h-4 w-4 text-blue-500" />
                }
                return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            case 'PROGRESS':
                return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            case 'COMPLETED':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'FAILED':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'REASONING':
                return <Brain className="h-4 w-4 text-purple-500" />
            default:
                return <Zap className="h-4 w-4 text-muted-foreground" />
        }
    }

    const getEventColor = (event: ExecutionEvent) => {
        switch (event.type) {
            case 'STARTED':
                return 'border-blue-500/50 bg-blue-500/5'
            case 'PROGRESS':
                return 'border-blue-400/50 bg-blue-400/5'
            case 'COMPLETED':
                return 'border-green-500/50 bg-green-500/5'
            case 'FAILED':
                return 'border-red-500/50 bg-red-500/5'
            case 'REASONING':
                return 'border-purple-500/50 bg-purple-500/5 cursor-pointer hover:bg-purple-500/10'
            default:
                return 'border-border bg-background'
        }
    }

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const getEventMessage = (event: ExecutionEvent) => {
        if (event.data.message) return event.data.message

        switch (event.type) {
            case 'STARTED':
                return event.agentId === 'system'
                    ? 'Workflow execution started'
                    : `${event.agentName} started processing`
            case 'PROGRESS':
                return event.data.progress
                    ? `Progress: ${event.data.progress}%`
                    : 'Processing...'
            case 'COMPLETED':
                return event.agentId === 'system'
                    ? 'Workflow completed successfully'
                    : `${event.agentName} completed`
            case 'FAILED':
                return `${event.agentName} failed`
            case 'REASONING':
                return 'Click to view reasoning'
            default:
                return 'Event'
        }
    }

    if (events.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="space-y-3">
                    <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
                        <Clock className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                        Ready to Execute
                    </p>
                    <p className="text-xs text-muted-foreground/70 max-w-[200px]">
                        Click &quot;Start Execution&quot; to run your workflow and see live updates
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</span>
                <Badge variant="secondary" className="text-xs font-mono">
                    {events.length}
                </Badge>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-1.5">
                    {events.map((event, index) => (
                        <div
                            key={event.id}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-all duration-200",
                                getEventColor(event),
                                selectedEventId === event.id && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                                event.type === 'REASONING' && "cursor-pointer hover:scale-[1.01]",
                                "hover:shadow-sm"
                            )}
                            onClick={() => event.type === 'REASONING' && onEventClick?.(event)}
                        >
                            {/* Timeline Line */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border">
                                    {getEventIcon(event)}
                                </div>
                                {index < events.length - 1 && (
                                    <div className="w-px h-full min-h-[20px] bg-border mt-2" />
                                )}
                            </div>

                            {/* Event Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                        {event.agentName}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-xs",
                                            event.type === 'COMPLETED' && "text-green-500",
                                            event.type === 'FAILED' && "text-red-500",
                                            event.type === 'REASONING' && "text-purple-500"
                                        )}
                                    >
                                        {event.type}
                                    </Badge>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {getEventMessage(event)}
                                </p>

                                {/* Metrics for completed events */}
                                {event.type === 'COMPLETED' && event.agentId !== 'system' && (
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                        {event.data.tokensUsed !== undefined && event.data.tokensUsed > 0 && (
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="h-3 w-3" />
                                                {event.data.tokensUsed} tokens
                                            </span>
                                        )}
                                        {event.data.cost !== undefined && event.data.cost > 0 && (
                                            <span className="flex items-center gap-1">
                                                ${event.data.cost.toFixed(4)}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Reasoning preview */}
                                {event.type === 'REASONING' && event.data.reasoning && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-purple-500">
                                        <Brain className="h-3 w-3" />
                                        <span className="truncate">
                                            {event.data.reasoning.slice(0, 50)}...
                                        </span>
                                        <ChevronRight className="h-3 w-3" />
                                    </div>
                                )}

                                {/* Timestamp */}
                                <div className="mt-2 text-xs text-muted-foreground/70">
                                    {formatTime(event.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

export default ExecutionTimeline
