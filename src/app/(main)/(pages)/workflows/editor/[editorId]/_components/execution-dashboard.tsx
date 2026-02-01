'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Play, Pause, Square, SkipForward, RefreshCw, Download, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/providers/editor-provider'
import { clsx } from 'clsx'

type LogEntry = {
    id: string
    timestamp: string
    agentName: string
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
    message: string
    details?: string
}

type AgentStatus = {
    id: string
    name: string
    status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING'
    duration?: string
    cost?: string
    model?: string
}

const MOCK_LOGS: LogEntry[] = [
    { id: '1', timestamp: '10:34:12', agentName: 'Web Scraper', type: 'INFO', message: 'Started scraping HackerNews', details: 'Target: https://news.ycombinator.com' },
    { id: '2', timestamp: '10:34:15', agentName: 'Web Scraper', type: 'SUCCESS', message: 'Scraped 47 articles', details: 'Found 47 items. Cost: $0.00 (Ollama)' },
    { id: '3', timestamp: '10:34:24', agentName: 'Filter', type: 'INFO', message: 'Filtering for AI related content', details: 'Model: Gemini 1.5 Flash' },
    { id: '4', timestamp: '10:34:28', agentName: 'Filter', type: 'SUCCESS', message: 'Found 12 relevant articles' },
]

const MOCK_AGENTS: AgentStatus[] = [
    { id: '1', name: 'Web Scraper', status: 'COMPLETED', duration: '12s', cost: '$0.00', model: 'Ollama' },
    { id: '2', name: 'Filter', status: 'RUNNING', duration: '4s', cost: '$0.002', model: 'Gemini 1.5' },
    { id: '3', name: 'Summarizer', status: 'WAITING', model: 'Groq' },
    { id: '4', name: 'Email Sender', status: 'IDLE', model: 'Gmail' },
]

const ExecutionDashboard = () => {
    const { state } = useEditor()
    const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS)
    const [agents, setAgents] = useState<AgentStatus[]>(MOCK_AGENTS)
    const [isRunning, setIsRunning] = useState(false)

    // In a real implementation, this would subscribe to a WebSocket or poll an API

    return (
        <div className="flex h-full flex-col bg-background border-l border-border">
            {/* Header / Controls */}
            <div className="p-4 border-b border-border flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Live Monitor</h2>
                    <p className="text-xs text-muted-foreground">Execution ID: #exec-1234</p>
                </div>
                <div className="flex gap-2">
                    {!isRunning ? (
                        <Button size="sm" variant="default" onClick={() => setIsRunning(true)}>
                            <Play className="h-4 w-4 mr-1" /> Run
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" onClick={() => setIsRunning(false)}>
                            <Pause className="h-4 w-4 mr-1" /> Pause
                        </Button>
                    )}
                    <Button size="sm" variant="destructive" disabled={!isRunning}>
                        <Square className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Metrics Banner */}
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-border bg-muted/20">
                <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase">Progress</div>
                    <div className="text-xl font-bold text-primary">45%</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase">Tokens</div>
                    <div className="text-xl font-bold">3,456</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase">Total Cost</div>
                    <div className="text-xl font-bold text-green-500">$0.012</div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="timeline" className="h-full flex flex-col">
                    <TabsList className="mx-4 mt-4 grid w-[90%] grid-cols-2">
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger value="logs">Console Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline" className="flex-1 overflow-hidden p-4">
                        <ScrollArea className="h-full pr-4">
                            <div className="flex flex-col gap-3">
                                {agents.map((agent) => (
                                    <Card key={agent.id} className={clsx("transition-all duration-300", {
                                        'border-primary shadow-md': agent.status === 'RUNNING',
                                        'opacity-70': agent.status === 'IDLE'
                                    })}>
                                        <CardContent className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={clsx("w-3 h-3 rounded-full", {
                                                    'bg-green-500': agent.status === 'COMPLETED',
                                                    'bg-purple-500 animate-pulse': agent.status === 'RUNNING',
                                                    'bg-red-500': agent.status === 'FAILED',
                                                    'bg-orange-500': agent.status === 'WAITING',
                                                    'bg-slate-300': agent.status === 'IDLE'
                                                })} />
                                                <div>
                                                    <div className="font-medium text-sm">{agent.name}</div>
                                                    <div className="text-xs text-muted-foreground">{agent.model}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-mono">{agent.duration || '--'}</div>
                                                <div className="text-xs text-green-600 font-mono">{agent.cost || '$0.00'}</div>
                                            </div>
                                        </CardContent>
                                        {agent.status === 'RUNNING' && (
                                            <div className="h-1 w-full bg-muted overflow-hidden">
                                                <div className="h-full bg-primary animate-progress origin-left"></div>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="logs" className="flex-1 overflow-hidden p-4">
                        <ScrollArea className="h-full rounded-md border bg-slate-950 p-4 font-mono text-xs">
                            <div className="flex flex-col gap-2">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex gap-2">
                                        <span className="text-slate-500">[{log.timestamp}]</span>
                                        <span className={clsx("font-bold", {
                                            'text-blue-400': log.agentName === 'Web Scraper',
                                            'text-purple-400': log.agentName === 'Filter'
                                        })}>
                                            [{log.agentName}]
                                        </span>
                                        <span className={clsx({
                                            'text-green-400': log.type === 'SUCCESS',
                                            'text-yellow-400': log.type === 'WARNING',
                                            'text-red-400': log.type === 'ERROR',
                                            'text-slate-300': log.type === 'INFO'
                                        })}>
                                            {log.message}
                                        </span>
                                    </div>
                                ))}
                                {isRunning && (
                                    <div className="text-slate-500 animate-pulse">_</div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="p-4 border-t border-border flex justify-between">
                <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Logs
                </Button>
                <div className="text-xs text-muted-foreground self-center">
                    Last updated: Just now
                </div>
            </div>
        </div>
    )
}

export default ExecutionDashboard
