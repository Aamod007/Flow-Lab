'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Brain,
    Lightbulb,
    Target,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    X,
    Sparkles,
    ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExecutionEvent } from './live-execution-panel'

interface AgentReasoningViewerProps {
    event: ExecutionEvent
    onClose?: () => void
}

const AgentReasoningViewer: React.FC<AgentReasoningViewerProps> = ({
    event,
    onClose
}) => {
    const { data, agentName, timestamp } = event

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.9) return 'text-green-500 bg-green-500/10'
        if (confidence >= 0.7) return 'text-yellow-500 bg-yellow-500/10'
        return 'text-red-500 bg-red-500/10'
    }

    const getDecisionIcon = (decision?: string) => {
        switch (decision?.toUpperCase()) {
            case 'INCLUDE':
            case 'PROCEED':
            case 'APPROVE':
            case 'GENERATE':
            case 'SYNTHESIZE':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'EXCLUDE':
            case 'REJECT':
            case 'SKIP':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'REVIEW':
            case 'PENDING':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />
            default:
                return <ArrowRight className="h-4 w-4 text-blue-500" />
        }
    }

    return (
        <div className="p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-sm">Agent Reasoning</span>
                    <Badge variant="outline" className="text-xs">
                        {agentName}
                    </Badge>
                </div>
                {onClose && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="p-4 space-y-4">
                    {/* Reasoning Text */}
                    {data.reasoning && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Lightbulb className="h-3 w-3" />
                                Thought Process
                            </div>
                            <p className="text-sm leading-relaxed bg-background/50 p-3 rounded-md border">
                                {data.reasoning}
                            </p>
                        </div>
                    )}

                    {/* Decision & Confidence */}
                    <div className="flex items-center gap-4">
                        {data.decision && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Target className="h-3 w-3" />
                                    Decision:
                                </div>
                                <Badge variant="outline" className="gap-1">
                                    {getDecisionIcon(data.decision)}
                                    {data.decision}
                                </Badge>
                            </div>
                        )}

                        {data.confidence !== undefined && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Sparkles className="h-3 w-3" />
                                    Confidence:
                                </div>
                                <Badge className={cn("gap-1", getConfidenceColor(data.confidence))}>
                                    {Math.round(data.confidence * 100)}%
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Additional Output */}
                    {data.output && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                Output Preview
                            </div>
                            <pre className="text-xs bg-background/50 p-3 rounded-md border overflow-x-auto">
                                {typeof data.output === 'string'
                                    ? data.output.slice(0, 200) + (data.output.length > 200 ? '...' : '')
                                    : JSON.stringify(data.output, null, 2).slice(0, 200)}
                            </pre>
                        </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                        Recorded at {new Date(timestamp).toLocaleTimeString()}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default AgentReasoningViewer
