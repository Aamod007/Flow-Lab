'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Play, Pause, Square, SkipForward, RefreshCw, Download, ChevronRight, ChevronDown, MessageSquare, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditor } from '@/providers/editor-provider'
import { clsx } from 'clsx'
import AgentChatPanel from './agent-chat-panel'
import { useFlowLabStore } from '@/store'

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

const ExecutionDashboard = () => {
    const { state } = useEditor()
    // @ts-ignore
    const { logs: storeLogs } = useFlowLabStore()
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [agents, setAgents] = useState<AgentStatus[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [progress, setProgress] = useState(0)
    const [tokens, setTokens] = useState(0)
    const [totalCost, setTotalCost] = useState(0)

    // Sync logs from store
    useEffect(() => {
        if (!storeLogs || storeLogs.length === 0) return

        // Convert string logs to structured logs
        const formattedLogs: LogEntry[] = storeLogs.map((log: string, index: number) => ({
            id: index.toString(),
            timestamp: new Date().toLocaleTimeString(),
            agentName: log.includes('AI') ? 'AI' : (log.includes('Slack') ? 'Slack' : (log.includes('Notion') ? 'Notion' : 'System')),
            type: 'INFO',
            message: log.replace(/^- /, '')
        }))

        setLogs(formattedLogs)

        // Disable simulation if we have real logs
        setIsRunning(false)
    }, [storeLogs])

    // Sync agents with editor nodes
    useEffect(() => {
        if (!state.editor.elements) return

        // Map editor nodes to agents only if not running to avoid overwriting simulation state
        if (!isRunning) {
            const workflowAgents: AgentStatus[] = state.editor.elements
                .filter(node => node.type !== 'Trigger') // Optional: only show actionable nodes
                .map(node => ({
                    id: node.id,
                    name: node.data.title || node.type,
                    status: 'IDLE',
                    model: node.data.metadata?.model || node.type // Assuming model info might be in metadata
                }))
            setAgents(workflowAgents)
        }
    }, [state.editor.elements, isRunning])

    // Generate contextual log messages based on node type
    const getContextualLogs = (agentName: string, nodeType: string, phase: 'start' | 'progress' | 'complete' | 'error') => {
        const logs: Record<string, Record<string, string[]>> = {
            'Trigger': {
                start: ['🚀 Workflow triggered', '⚡ Initializing execution pipeline', '🔄 Starting workflow execution'],
                progress: ['📥 Receiving trigger data...', '🔍 Validating trigger conditions...', '✅ Trigger conditions met'],
                complete: ['✅ Trigger executed successfully', '📤 Passing data to next node', '🎯 Workflow initiated'],
            },
            'AI': {
                start: ['🤖 AI Agent starting...', '🧠 Loading AI model...', '💭 Preparing prompt context'],
                progress: ['📝 Processing input data...', '🔄 Generating AI response...', '💡 Analyzing context...', '🎯 Reasoning through task...', '📊 Evaluating options...'],
                complete: ['✅ AI response generated', '📤 Output ready for next step', '💰 Tokens used: ~150'],
            },
            'Slack': {
                start: ['💬 Connecting to Slack...', '🔗 Authenticating with Slack API'],
                progress: ['📨 Preparing message...', '🎨 Formatting content...', '📝 Building Slack blocks...'],
                complete: ['✅ Message sent to Slack', '📤 Notification delivered', '👥 Channel updated'],
            },
            'Notion': {
                start: ['📓 Connecting to Notion...', '🔗 Authenticating with Notion API'],
                progress: ['📝 Preparing page content...', '🔍 Finding target database...', '📊 Formatting properties...'],
                complete: ['✅ Notion page created', '📤 Data saved to database', '🔗 Page link generated'],
            },
            'Discord': {
                start: ['🎮 Connecting to Discord...', '🔗 Establishing webhook connection'],
                progress: ['📨 Preparing message...', '🎨 Adding embeds...', '📎 Attaching files...'],
                complete: ['✅ Message sent to Discord', '📤 Webhook delivered', '✨ Embed rendered'],
            },
            'Email': {
                start: ['📧 Initializing email service...', '🔗 Connecting to SMTP server'],
                progress: ['📝 Composing email...', '🎨 Formatting HTML content...', '📎 Processing attachments...'],
                complete: ['✅ Email sent successfully', '📤 Delivery confirmed', '📬 Recipient notified'],
            },
            'Condition': {
                start: ['🔀 Evaluating condition...', '🧮 Processing logic gate'],
                progress: ['🔍 Checking condition value...', '📊 Comparing variables...', '🎯 Determining branch path...'],
                complete: ['✅ Condition evaluated', '➡️ Taking TRUE branch', '🔀 Routing complete'],
            },
            'Action': {
                start: ['⚡ Executing action...', '🔧 Initializing action handler'],
                progress: ['🔄 Processing data...', '📊 Transforming output...', '🎯 Applying changes...'],
                complete: ['✅ Action completed', '📤 Output ready', '🎉 Step finished'],
            },
            'Wait': {
                start: ['⏳ Wait timer started...', '⏰ Delay initiated'],
                progress: ['⏳ Waiting...', '🕐 Time remaining...', '💤 Paused execution...'],
                complete: ['✅ Wait completed', '⏰ Timer finished', '▶️ Resuming workflow'],
            },
            'Google Drive': {
                start: ['📁 Connecting to Google Drive...', '🔗 Authenticating with Google API'],
                progress: ['📂 Accessing files...', '🔍 Searching folders...', '📥 Downloading content...'],
                complete: ['✅ Drive operation complete', '📤 File processed', '🗂️ Content retrieved'],
            },
        }

        const defaultLogs = {
            start: [`🔄 Starting ${agentName}...`, `⚡ Initializing ${agentName}`],
            progress: [`🔄 ${agentName} processing...`, `📊 Working on task...`],
            complete: [`✅ ${agentName} completed`, `📤 Output ready`],
            error: [`❌ ${agentName} failed`, `⚠️ Error in ${agentName}`],
        }

        const nodeTypeLogs = logs[nodeType] || defaultLogs
        const phaseLogs = nodeTypeLogs[phase] || defaultLogs[phase]
        return phaseLogs[Math.floor(Math.random() * phaseLogs.length)]
    }

    // Simulation logic
    useEffect(() => {
        if (!isRunning || agents.length === 0) return

        let currentAgentIndex = 0
        let stepCount = 0
        let hasLoggedStart = false

        // Add initial workflow start log
        const startLog: LogEntry = {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString(),
            agentName: 'System',
            type: 'INFO',
            message: '🚀 Workflow execution started',
        }
        setLogs(prev => [...prev, startLog])

        const interval = setInterval(() => {
            stepCount++

            // update metrics
            setTokens(prev => prev + Math.floor(Math.random() * 50))
            setTotalCost(prev => prev + 0.0001)
            setProgress(Math.min(100, (currentAgentIndex / agents.length) * 100 + (stepCount % 20)))

            setAgents(prevAgents => {
                const newAgents = [...prevAgents]
                if (currentAgentIndex >= newAgents.length) return newAgents

                const currentAgent = newAgents[currentAgentIndex]

                // Log when starting a new agent
                if (currentAgent && currentAgent.status !== 'RUNNING' && !hasLoggedStart) {
                    hasLoggedStart = true
                    newAgents[currentAgentIndex] = { ...currentAgent, status: 'RUNNING' }

                    // Add start log
                    const startMsg = getContextualLogs(currentAgent.name, currentAgent.name, 'start')
                    const newLog: LogEntry = {
                        id: Math.random().toString(),
                        timestamp: new Date().toLocaleTimeString(),
                        agentName: currentAgent.name,
                        type: 'INFO',
                        message: startMsg,
                    }
                    setLogs(prev => [...prev, newLog])
                }

                // Simulate completion of agent every ~3 seconds (30 steps * 100ms)
                if (stepCount > 30) {
                    if (currentAgent) {
                        newAgents[currentAgentIndex] = {
                            ...currentAgent,
                            status: 'COMPLETED',
                            duration: `${(Math.random() * 2 + 1).toFixed(1)}s`,
                            cost: `$${(Math.random() * 0.005).toFixed(4)}`
                        }

                        // Add completion log
                        const completeMsg = getContextualLogs(currentAgent.name, currentAgent.name, 'complete')
                        const completeLog: LogEntry = {
                            id: Math.random().toString(),
                            timestamp: new Date().toLocaleTimeString(),
                            agentName: currentAgent.name,
                            type: 'SUCCESS',
                            message: completeMsg,
                        }
                        setLogs(prev => [...prev, completeLog])
                    }
                    currentAgentIndex++
                    stepCount = 0
                    hasLoggedStart = false
                }

                if (currentAgentIndex >= newAgents.length) {
                    setIsRunning(false)
                    setProgress(100)

                    // Add workflow complete log
                    const endLog: LogEntry = {
                        id: Math.random().toString(),
                        timestamp: new Date().toLocaleTimeString(),
                        agentName: 'System',
                        type: 'SUCCESS',
                        message: '🎉 Workflow completed successfully!',
                    }
                    setLogs(prev => [...prev, endLog])
                }

                return newAgents
            })

            // Add contextual progress logs occasionally
            if (Math.random() > 0.75 && currentAgentIndex < agents.length) {
                const currentAgent = agents[currentAgentIndex]
                if (currentAgent) {
                    const progressMsg = getContextualLogs(currentAgent.name, currentAgent.name, 'progress')
                    const newLog: LogEntry = {
                        id: Math.random().toString(),
                        timestamp: new Date().toLocaleTimeString(),
                        agentName: currentAgent.name,
                        type: 'INFO',
                        message: progressMsg,
                    }
                    setLogs(prev => [...prev, newLog])
                }
            }

        }, 100)

        return () => clearInterval(interval)
    }, [isRunning, agents.length])

    const handleRunObj = () => {
        // Reset state on run - reload agents from state to reset statuses
        const initialAgents: AgentStatus[] = state.editor.elements
            .filter(node => node.type !== 'Trigger')
            .map(node => ({
                id: node.id,
                name: node.data.title || node.type,
                status: 'IDLE',
                model: node.data.metadata?.model || node.type
            }))

        setAgents(initialAgents)
        setLogs([])
        setProgress(0)
        setTokens(0)
        setTotalCost(0)

        if (initialAgents.length > 0) {
            setIsRunning(true)
        }
    }

    // ... inside return (updating metrics display) ...

    return (
        <div className="flex h-full flex-col bg-background/95 backdrop-blur-sm border-l border-border/50 shadow-xl">
            {/* Header / Controls */}
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        <h2 className="text-lg font-semibold tracking-tight">Live Monitor</h2>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">Ref: #exec-{Math.floor(Math.random() * 1000)}</p>
                </div>
                <div className="flex gap-2">
                    {!isRunning ? (
                        <Button size="sm" className="bg-white hover:bg-neutral-200 text-black shadow-lg" onClick={handleRunObj}>
                            <Play className="h-4 w-4 mr-1 fill-current" /> Run
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" className="border-neutral-600 hover:bg-neutral-800" onClick={() => setIsRunning(false)}>
                            <Pause className="h-4 w-4 mr-1 fill-current" /> Pause
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" className="hover:bg-neutral-800" disabled={!isRunning} onClick={() => setIsRunning(false)}>
                        <Square className="h-4 w-4 fill-current" />
                    </Button>
                </div>
            </div>

            {/* Metrics Banner */}
            <div className="grid grid-cols-3 gap-px bg-neutral-800">
                <div className="bg-neutral-900 p-4 flex flex-col items-center justify-center group hover:bg-neutral-800 transition-colors cursor-help">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Progress</div>
                    <div className="text-2xl font-bold group-hover:scale-105 transition-transform">{Math.round(progress)}%</div>
                    <div className="h-1 w-12 bg-neutral-800 mt-2 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
                <div className="bg-neutral-900 p-4 flex flex-col items-center justify-center group hover:bg-neutral-800 transition-colors cursor-help">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Tokens</div>
                    <div className="text-2xl font-bold group-hover:scale-105 transition-transform font-mono">{tokens.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">ctx window</div>
                </div>
                <div className="bg-neutral-900 p-4 flex flex-col items-center justify-center group hover:bg-neutral-800 transition-colors cursor-help">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total Cost</div>
                    <div className="text-2xl font-bold group-hover:scale-105 transition-transform font-mono">${totalCost.toFixed(4)}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">est. usd</div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs defaultValue="timeline" className="h-full flex flex-col">
                    <div className="border-b border-neutral-800 px-4 bg-neutral-900/30">
                        <TabsList className="bg-transparent w-full justify-start h-12 p-0 gap-6">
                            <TabsTrigger
                                value="timeline"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none h-full px-0 font-medium"
                            >
                                Automation Steps
                            </TabsTrigger>
                            <TabsTrigger
                                value="chat"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none h-full px-0 font-medium flex items-center gap-2"
                            >
                                <MessageSquare className="h-3 w-3" />
                                Agent Chat
                                <Badge className="text-[9px] px-1.5 py-0 h-4 bg-white text-black border-0">
                                    AI
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="logs"
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-white rounded-none h-full px-0 font-medium"
                            >
                                System Logs
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="timeline" className="flex-1 overflow-hidden p-0 m-0 bg-neutral-900/30">
                        <ScrollArea className="h-full">
                            <div className="p-4 flex flex-col gap-3">
                                {agents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground py-20 px-4 text-center">
                                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                                            <Square className="h-6 w-6 opacity-20" />
                                        </div>
                                        <p className="font-medium">No agents active</p>
                                        <p className="text-sm opacity-50 mt-1">Add nodes to your workflow to see them here.</p>
                                    </div>
                                ) : (
                                    agents.map((agent, idx) => (
                                        <div key={agent.id} className="relative pl-6 pb-2 last:pb-0">
                                            {/* Connector Line */}
                                            {idx !== agents.length - 1 && (
                                                <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border group-hover:bg-primary/50 transition-colors" />
                                            )}

                                            <div className="absolute left-0 top-2 z-10">
                                                <div className={clsx("w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center bg-background transition-colors duration-300", {
                                                    'border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]': agent.status === 'COMPLETED',
                                                    'border-neutral-400 shadow-[0_0_10px_rgba(255,255,255,0.1)]': agent.status === 'RUNNING',
                                                    'border-neutral-600': agent.status === 'FAILED',
                                                    'border-neutral-700': agent.status === 'IDLE' || agent.status === 'WAITING'
                                                })}>
                                                    {agent.status === 'COMPLETED' && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    {agent.status === 'RUNNING' && <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" />}
                                                </div>
                                            </div>

                                            <Card className={clsx("transition-all duration-300 border bg-neutral-900/50 hover:bg-neutral-800/50 hover:shadow-md", {
                                                'border-neutral-600 shadow-sm ring-1 ring-neutral-600/20': agent.status === 'RUNNING',
                                                'border-neutral-800': agent.status !== 'RUNNING'
                                            })}>
                                                <CardContent className="p-3">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex flex-col">
                                                            <div className="font-semibold text-sm flex items-center gap-2">
                                                                {agent.name}
                                                                {agent.status === 'RUNNING' && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-neutral-600 bg-neutral-800">Active</Badge>}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground font-mono">{agent.model}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[10px] font-mono text-muted-foreground">Duration</div>
                                                            <div className="text-xs font-mono font-medium">{agent.duration || '--'}</div>
                                                        </div>
                                                    </div>

                                                    {agent.status === 'RUNNING' && (
                                                        <div className="h-1 w-full bg-neutral-800 overflow-hidden rounded-full mt-2">
                                                            <div className="h-full bg-white animate-progress origin-left"></div>
                                                        </div>
                                                    )}

                                                    {agent.cost && <div className="mt-2 pt-2 border-t border-neutral-700 flex justify-between items-center">
                                                        <span className="text-[10px] text-muted-foreground">Step Cost</span>
                                                        <span className="text-[10px] font-mono font-medium">{agent.cost}</span>
                                                    </div>}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="chat" className="flex-1 overflow-hidden p-0 m-0">
                        <div className="h-full p-3">
                            <AgentChatPanel
                                workflowName="Current Workflow"
                                nodes={state.editor.elements}
                                lastExecution={isRunning ? undefined : {
                                    success: agents.every(a => a.status === 'COMPLETED' || a.status === 'IDLE'),
                                    error: agents.find(a => a.status === 'FAILED') ? 'Agent execution failed' : undefined,
                                    nodeResults: {}
                                }}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="logs" className="flex-1 overflow-hidden p-0 m-0">
                        <ScrollArea className="h-full bg-[#0d1117] p-4 font-mono text-xs">
                            <div className="flex flex-col gap-1">
                                {logs.length === 0 && !isRunning && (
                                    <div className="text-slate-500 select-none py-10 space-y-2">
                                        <p className="text-slate-400">// AgentFlow Execution Console</p>
                                        <p>// Ready to execute workflow</p>
                                        <p>// Click "Run" to start execution</p>
                                        <p className="text-slate-600 mt-4">// Logs will appear here showing:</p>
                                        <p className="text-slate-600">//   • Node execution status</p>
                                        <p className="text-slate-600">//   • AI agent reasoning</p>
                                        <p className="text-slate-600">//   • Data transformations</p>
                                        <p className="text-slate-600">//   • Errors and warnings</p>
                                    </div>
                                )}
                                {logs.map((log, index) => {
                                    // Get color based on agent/node type
                                    const getAgentColor = (name: string) => {
                                        if (name === 'System') return 'text-cyan-400'
                                        if (name === 'Trigger') return 'text-yellow-400'
                                        if (name === 'AI') return 'text-purple-400'
                                        if (name === 'Slack') return 'text-pink-400'
                                        if (name === 'Notion') return 'text-orange-400'
                                        if (name === 'Discord') return 'text-indigo-400'
                                        if (name === 'Email') return 'text-red-400'
                                        if (name === 'Condition') return 'text-amber-400'
                                        if (name === 'Action') return 'text-blue-400'
                                        if (name === 'Wait') return 'text-gray-400'
                                        if (name === 'Google Drive') return 'text-green-400'
                                        return 'text-slate-400'
                                    }

                                    return (
                                        <div
                                            key={log.id}
                                            className={clsx(
                                                "flex gap-2 py-1 px-2 rounded transition-colors",
                                                log.type === 'SUCCESS' && "bg-green-500/5",
                                                log.type === 'ERROR' && "bg-red-500/10",
                                                log.type === 'WARNING' && "bg-yellow-500/5",
                                                "hover:bg-white/5"
                                            )}
                                        >
                                            {/* Timestamp */}
                                            <span className="text-slate-600 shrink-0 select-none w-[85px]">
                                                {log.timestamp}
                                            </span>

                                            {/* Status indicator */}
                                            <span className={clsx("shrink-0 w-[70px]", {
                                                'text-green-400': log.type === 'SUCCESS',
                                                'text-red-400': log.type === 'ERROR',
                                                'text-yellow-400': log.type === 'WARNING',
                                                'text-slate-500': log.type === 'INFO'
                                            })}>
                                                {log.type === 'SUCCESS' && '✓ SUCCESS'}
                                                {log.type === 'ERROR' && '✗ ERROR'}
                                                {log.type === 'WARNING' && '⚠ WARN'}
                                                {log.type === 'INFO' && '• INFO'}
                                            </span>

                                            {/* Agent name */}
                                            <span className={clsx("font-semibold shrink-0 w-[90px] truncate", getAgentColor(log.agentName || 'System'))}>
                                                {log.agentName || 'System'}
                                            </span>

                                            {/* Message */}
                                            <span className={clsx("flex-1", {
                                                'text-green-300': log.type === 'SUCCESS',
                                                'text-red-300': log.type === 'ERROR',
                                                'text-yellow-300': log.type === 'WARNING',
                                                'text-slate-300': log.type === 'INFO'
                                            })}>
                                                {log.message}
                                            </span>
                                        </div>
                                    )
                                })}
                                {isRunning && (
                                    <div className="flex items-center gap-2 py-2 text-green-400">
                                        <span className="animate-pulse">▍</span>
                                        <span className="text-slate-500 text-[10px]">Executing...</span>
                                    </div>
                                )}
                                {!isRunning && logs.length > 0 && (
                                    <div className="border-t border-slate-800 mt-2 pt-2 text-slate-500">
                                        <p>// Execution complete - {logs.filter(l => l.type === 'SUCCESS').length} successful, {logs.filter(l => l.type === 'ERROR').length} errors</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="p-2 border-t border-neutral-800 flex justify-between bg-neutral-900/50 text-[10px] text-muted-foreground">
                <span>AgentFlow Runtime v2.4.0</span>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-white"></div> System Online</span>
                    <span>Latency: 24ms</span>
                </div>
            </div>
        </div>
    )
}

export default ExecutionDashboard
