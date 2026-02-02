'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Play,
    Pause,
    Square,
    RefreshCw,
    Clock,
    DollarSign,
    Zap,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    ChevronRight,
    Brain,
    Activity,
    TrendingUp,
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ExecutionTimeline from './execution-timeline'
import LiveMetricsCards from './live-metrics-cards'
import AgentReasoningViewer from './agent-reasoning-viewer'

export interface ExecutionEvent {
    id: string
    timestamp: Date
    agentId: string
    agentName: string
    type: 'STARTED' | 'PROGRESS' | 'COMPLETED' | 'FAILED' | 'REASONING'
    data: {
        reasoning?: string
        tokensUsed?: number
        cost?: number
        output?: any
        progress?: number
        message?: string
        confidence?: number
        decision?: string
    }
}

export interface ExecutionState {
    id: string
    workflowId: string
    workflowName: string
    status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED'
    startTime?: Date
    endTime?: Date
    currentAgentId?: string
    completedAgents: string[]
    totalAgents: number
    events: ExecutionEvent[]
    metrics: {
        totalTokens: number
        totalCost: number
        elapsedTime: number
    }
}

interface LiveExecutionPanelProps {
    workflowId: string
    workflowName: string
    nodes: any[]
    onClose?: () => void
    isOpen: boolean
}

const LiveExecutionPanel: React.FC<LiveExecutionPanelProps> = ({
    workflowId,
    workflowName,
    nodes,
    onClose,
    isOpen
}) => {
    const [executionState, setExecutionState] = useState<ExecutionState>({
        id: '',
        workflowId,
        workflowName,
        status: 'IDLE',
        completedAgents: [],
        totalAgents: nodes.filter(n => n.type === 'AI').length || nodes.length,
        events: [],
        metrics: {
            totalTokens: 0,
            totalCost: 0,
            elapsedTime: 0
        }
    })

    const [selectedEvent, setSelectedEvent] = useState<ExecutionEvent | null>(null)
    const [autoScroll, setAutoScroll] = useState(true)

    // Timer for elapsed time
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null

        if (executionState.status === 'RUNNING' && executionState.startTime) {
            interval = setInterval(() => {
                setExecutionState(prev => ({
                    ...prev,
                    metrics: {
                        ...prev.metrics,
                        elapsedTime: Math.floor((Date.now() - new Date(prev.startTime!).getTime()) / 1000)
                    }
                }))
            }, 1000)
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [executionState.status, executionState.startTime])

    // Simulate execution for demo
    const startExecution = useCallback(() => {
        const executionId = `exec-${Date.now()}`
        const aiNodes = nodes.filter(n => ['AI', 'Slack', 'Discord', 'Notion', 'Google Drive'].includes(n.type))
        const totalAgents = aiNodes.length || 3

        setExecutionState({
            id: executionId,
            workflowId,
            workflowName,
            status: 'RUNNING',
            startTime: new Date(),
            completedAgents: [],
            totalAgents,
            events: [{
                id: `evt-${Date.now()}`,
                timestamp: new Date(),
                agentId: 'system',
                agentName: 'System',
                type: 'STARTED',
                data: { message: 'Workflow execution started' }
            }],
            metrics: {
                totalTokens: 0,
                totalCost: 0,
                elapsedTime: 0
            }
        })

        // Simulate agent executions
        simulateAgentExecution(aiNodes, executionId, 0)
    }, [nodes, workflowId, workflowName])

    const simulateAgentExecution = (agents: any[], executionId: string, index: number) => {
        if (index >= agents.length) {
            // Execution complete
            setTimeout(() => {
                setExecutionState(prev => ({
                    ...prev,
                    status: 'COMPLETED',
                    endTime: new Date(),
                    events: [...prev.events, {
                        id: `evt-${Date.now()}`,
                        timestamp: new Date(),
                        agentId: 'system',
                        agentName: 'System',
                        type: 'COMPLETED',
                        data: { message: 'Workflow completed successfully' }
                    }]
                }))
            }, 500)
            return
        }

        const agent = agents[index]
        const agentId = agent.id
        const agentName = agent.data?.title || agent.type || `Agent ${index + 1}`
        const isAI = agent.type === 'AI'

        // Agent started
        setExecutionState(prev => ({
            ...prev,
            currentAgentId: agentId,
            events: [...prev.events, {
                id: `evt-${Date.now()}`,
                timestamp: new Date(),
                agentId,
                agentName,
                type: 'STARTED',
                data: { message: `${agentName} started processing` }
            }]
        }))

        // Simulate AI reasoning (only for AI nodes)
        if (isAI) {
            setTimeout(() => {
                const reasoning = generateMockReasoning(agentName)
                setExecutionState(prev => ({
                    ...prev,
                    events: [...prev.events, {
                        id: `evt-${Date.now()}`,
                        timestamp: new Date(),
                        agentId,
                        agentName,
                        type: 'REASONING',
                        data: reasoning
                    }]
                }))
            }, 800)
        }

        // Agent completed
        const completionTime = isAI ? 2500 + Math.random() * 1500 : 1000 + Math.random() * 500
        setTimeout(() => {
            const tokens = isAI ? Math.floor(100 + Math.random() * 400) : 0
            const cost = isAI ? tokens * 0.00002 : 0

            setExecutionState(prev => ({
                ...prev,
                completedAgents: [...prev.completedAgents, agentId],
                events: [...prev.events, {
                    id: `evt-${Date.now()}`,
                    timestamp: new Date(),
                    agentId,
                    agentName,
                    type: 'COMPLETED',
                    data: {
                        message: `${agentName} completed`,
                        tokensUsed: tokens,
                        cost
                    }
                }],
                metrics: {
                    ...prev.metrics,
                    totalTokens: prev.metrics.totalTokens + tokens,
                    totalCost: prev.metrics.totalCost + cost
                }
            }))

            // Process next agent
            simulateAgentExecution(agents, executionId, index + 1)
        }, completionTime)
    }

    const generateMockReasoning = (agentName: string) => {
        const reasonings = [
            {
                reasoning: `Analyzing input data for relevance and quality. Found 5 key entities that match criteria. Proceeding with extraction.`,
                confidence: 0.87,
                decision: 'PROCEED'
            },
            {
                reasoning: `Evaluating content quality. Detected sentiment: positive. Keywords: AI, automation, workflow. Relevance score calculated.`,
                confidence: 0.92,
                decision: 'INCLUDE'
            },
            {
                reasoning: `Processing request. Generating structured response based on input parameters. Applying format constraints.`,
                confidence: 0.85,
                decision: 'GENERATE'
            },
            {
                reasoning: `Synthesizing information from previous agents. Combining data points to create coherent output.`,
                confidence: 0.89,
                decision: 'SYNTHESIZE'
            }
        ]
        return reasonings[Math.floor(Math.random() * reasonings.length)]
    }

    const pauseExecution = () => {
        setExecutionState(prev => ({
            ...prev,
            status: 'PAUSED'
        }))
    }

    const stopExecution = () => {
        setExecutionState(prev => ({
            ...prev,
            status: 'FAILED',
            endTime: new Date(),
            events: [...prev.events, {
                id: `evt-${Date.now()}`,
                timestamp: new Date(),
                agentId: 'system',
                agentName: 'System',
                type: 'FAILED',
                data: { message: 'Workflow stopped by user' }
            }]
        }))
    }

    const resetExecution = () => {
        setExecutionState({
            id: '',
            workflowId,
            workflowName,
            status: 'IDLE',
            completedAgents: [],
            totalAgents: nodes.filter(n => n.type === 'AI').length || nodes.length,
            events: [],
            metrics: {
                totalTokens: 0,
                totalCost: 0,
                elapsedTime: 0
            }
        })
        setSelectedEvent(null)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getStatusColor = (status: ExecutionState['status']) => {
        switch (status) {
            case 'RUNNING': return 'text-blue-500 bg-blue-500/10'
            case 'COMPLETED': return 'text-green-500 bg-green-500/10'
            case 'FAILED': return 'text-red-500 bg-red-500/10'
            case 'PAUSED': return 'text-yellow-500 bg-yellow-500/10'
            default: return 'text-muted-foreground bg-muted'
        }
    }

    const getStatusIcon = (status: ExecutionState['status']) => {
        switch (status) {
            case 'RUNNING': return <Loader2 className="h-4 w-4 animate-spin" />
            case 'COMPLETED': return <CheckCircle2 className="h-4 w-4" />
            case 'FAILED': return <XCircle className="h-4 w-4" />
            case 'PAUSED': return <Pause className="h-4 w-4" />
            default: return <Activity className="h-4 w-4" />
        }
    }

    if (!isOpen) return null

    return (
        <div className="h-full flex flex-col border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Live Execution</h3>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{workflowName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={cn("gap-1.5 px-3 py-1", getStatusColor(executionState.status))}>
                        {getStatusIcon(executionState.status)}
                        <span className="text-xs font-medium">{executionState.status}</span>
                    </Badge>
                    {onClose && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 p-3 border-b bg-muted/30">
                {executionState.status === 'IDLE' && (
                    <Button onClick={startExecution} size="sm" className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20">
                        <Play className="h-4 w-4" />
                        Start Execution
                    </Button>
                )}
                {executionState.status === 'RUNNING' && (
                    <>
                        <Button variant="outline" size="sm" onClick={pauseExecution} className="gap-2">
                            <Pause className="h-4 w-4" />
                            Pause
                        </Button>
                        <Button variant="destructive" size="sm" onClick={stopExecution} className="gap-2">
                            <Square className="h-4 w-4" />
                            Stop
                        </Button>
                    </>
                )}
                {(executionState.status === 'COMPLETED' || executionState.status === 'FAILED') && (
                    <Button variant="outline" size="sm" onClick={resetExecution} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Run Again
                    </Button>
                )}
                {executionState.status === 'PAUSED' && (
                    <>
                        <Button size="sm" onClick={startExecution} className="gap-2 bg-green-600 hover:bg-green-700">
                            <Play className="h-4 w-4" />
                            Resume
                        </Button>
                        <Button variant="destructive" size="sm" onClick={stopExecution} className="gap-2">
                            <Square className="h-4 w-4" />
                            Stop
                        </Button>
                    </>
                )}
            </div>

            {/* Live Metrics */}
            <LiveMetricsCards
                elapsedTime={formatTime(executionState.metrics.elapsedTime)}
                totalCost={executionState.metrics.totalCost}
                totalTokens={executionState.metrics.totalTokens}
                completedAgents={executionState.completedAgents.length}
                totalAgents={executionState.totalAgents}
                status={executionState.status}
            />

            <Separator />

            {/* Timeline & Reasoning */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <ExecutionTimeline
                    events={executionState.events}
                    currentAgentId={executionState.currentAgentId}
                    onEventClick={setSelectedEvent}
                    selectedEventId={selectedEvent?.id}
                />

                {selectedEvent && selectedEvent.type === 'REASONING' && (
                    <>
                        <Separator />
                        <AgentReasoningViewer
                            event={selectedEvent}
                            onClose={() => setSelectedEvent(null)}
                        />
                    </>
                )}
            </div>
        </div>
    )
}

export default LiveExecutionPanel
