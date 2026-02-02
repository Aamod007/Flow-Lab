'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Bot,
  ArrowRight,
  MessageSquare,
  Zap,
  Clock,
  DollarSign,
  Activity,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Agent, AgentRole, AGENT_TEMPLATES, getAgentColor, getAgentIcon } from '@/lib/agents/agent-types'
import { WorkflowUpdate, executeAgentWorkflow } from '@/lib/agents/agent-executor'
import { toast } from 'sonner'

interface AgentCommunicationPanelProps {
  agents: Agent[]
  onComplete?: (result: any) => void
}

interface CommunicationLine {
  id: string
  fromAgent: string
  toAgent: string
  type: 'data' | 'handoff' | 'feedback'
  active: boolean
}

export function AgentCommunicationPanel({ agents, onComplete }: AgentCommunicationPanelProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1)
  const [updates, setUpdates] = useState<WorkflowUpdate[]>([])
  const [metrics, setMetrics] = useState({
    totalTokens: 0,
    totalCost: 0,
    duration: 0
  })
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'idle' | 'running' | 'completed' | 'failed'>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize agent statuses
    const statuses: Record<string, 'idle' | 'running' | 'completed' | 'failed'> = {}
    agents.forEach(a => { statuses[a.id] = 'idle' })
    setAgentStatuses(statuses)
  }, [agents])

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [updates])

  const handleRun = async () => {
    if (agents.length === 0) {
      toast.error('Add agents to your workflow first')
      return
    }

    setIsRunning(true)
    setUpdates([])
    setCurrentAgentIndex(0)
    setMetrics({ totalTokens: 0, totalCost: 0, duration: 0 })

    // Reset statuses
    const statuses: Record<string, 'idle' | 'running' | 'completed' | 'failed'> = {}
    agents.forEach(a => { statuses[a.id] = 'idle' })
    setAgentStatuses(statuses)

    const startTime = Date.now()

    try {
      const result = await executeAgentWorkflow(
        agents,
        'Process this workflow task',
        (update) => {
          setUpdates(prev => [...prev, update])

          // Update agent statuses
          if (update.agentId) {
            setAgentStatuses(prev => ({
              ...prev,
              [update.agentId!]: update.type === 'agent-complete' ? 'completed' : 
                                 update.type === 'agent-start' || update.type === 'agent-working' ? 'running' : 
                                 prev[update.agentId!]
            }))
          }

          // Update current agent index
          if (update.type === 'agent-start') {
            const idx = agents.findIndex(a => a.id === update.agentId)
            setCurrentAgentIndex(idx)
          }

          // Update metrics
          if (update.tokens) {
            setMetrics(prev => ({
              ...prev,
              totalTokens: prev.totalTokens + update.tokens!,
              totalCost: prev.totalCost + (update.cost || 0)
            }))
          }
        }
      )

      setMetrics(prev => ({
        ...prev,
        duration: Date.now() - startTime
      }))

      onComplete?.(result)
      toast.success('Workflow completed!')
    } catch (error) {
      toast.error('Workflow failed')
      setUpdates(prev => [...prev, {
        type: 'error',
        message: '❌ Workflow execution failed',
        timestamp: new Date(),
        error: String(error)
      }])
    } finally {
      setIsRunning(false)
      setCurrentAgentIndex(-1)
    }
  }

  const handleReset = () => {
    setUpdates([])
    setCurrentAgentIndex(-1)
    setMetrics({ totalTokens: 0, totalCost: 0, duration: 0 })
    const statuses: Record<string, 'idle' | 'running' | 'completed' | 'failed'> = {}
    agents.forEach(a => { statuses[a.id] = 'idle' })
    setAgentStatuses(statuses)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="h-3 w-3 animate-spin" />
      case 'completed': return <CheckCircle2 className="h-3 w-3 text-green-500" />
      case 'failed': return <AlertCircle className="h-3 w-3 text-red-500" />
      default: return <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Agent Communication</h3>
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <Button size="sm" onClick={handleRun} className="gap-1 bg-green-600 hover:bg-green-700">
                <Play className="h-3 w-3" />
                Run Agents
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Running...
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleReset} disabled={isRunning}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>{metrics.totalTokens.toLocaleString()} tokens</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>${metrics.totalCost.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{(metrics.duration / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      {/* Agent Flow Visualization */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
          {agents.map((agent, idx) => {
            const color = getAgentColor(agent.role)
            const icon = getAgentIcon(agent.role)
            const status = agentStatuses[agent.id] || 'idle'
            const isCurrent = idx === currentAgentIndex

            return (
              <React.Fragment key={agent.id}>
                {/* Agent Node */}
                <div
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300",
                    isCurrent && "ring-2 ring-primary ring-offset-2 scale-110",
                    status === 'completed' && "opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-xl relative",
                      isCurrent && "animate-pulse"
                    )}
                    style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
                  >
                    {icon}
                    {/* Status indicator */}
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      {getStatusIcon(status)}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-center max-w-[60px] truncate">
                    {agent.name}
                  </span>
                </div>

                {/* Arrow */}
                {idx < agents.length - 1 && (
                  <div className={cn(
                    "flex items-center transition-all duration-300",
                    currentAgentIndex > idx ? "text-green-500" : "text-muted-foreground/30"
                  )}>
                    <div className={cn(
                      "w-8 h-0.5 rounded",
                      currentAgentIndex > idx ? "bg-green-500" : "bg-muted-foreground/30"
                    )} />
                    <ArrowRight className="h-4 w-4 -ml-1" />
                  </div>
                )}
              </React.Fragment>
            )
          })}

          {agents.length === 0 && (
            <div className="text-sm text-muted-foreground py-4">
              No agents in workflow. Drag agents from the palette.
            </div>
          )}
        </div>
      </div>

      {/* Communication Log */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-3 space-y-2">
            {updates.length === 0 && !isRunning && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>Agent communication will appear here</p>
                <p className="text-xs mt-1">Click "Run Agents" to start execution</p>
              </div>
            )}

            {updates.map((update, idx) => {
              const agent = agents.find(a => a.id === update.agentId)
              const color = agent ? getAgentColor(agent.role) : '#6B7280'

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3 p-2 rounded-lg transition-all",
                    update.type === 'agent-complete' && "bg-green-500/5",
                    update.type === 'error' && "bg-red-500/10",
                    update.type === 'handoff' && "bg-purple-500/5"
                  )}
                >
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {update.type === 'start' && '🚀'}
                    {update.type === 'complete' && '🎉'}
                    {update.type === 'error' && '❌'}
                    {update.type === 'handoff' && '📤'}
                    {update.type === 'agent-start' && agent && getAgentIcon(agent.role)}
                    {update.type === 'agent-working' && agent && getAgentIcon(agent.role)}
                    {update.type === 'agent-complete' && '✅'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{update.message}</span>
                      {update.tokens && (
                        <Badge variant="secondary" className="text-[10px]">
                          {update.tokens} tokens
                        </Badge>
                      )}
                    </div>
                    {update.output && (
                      <div className="mt-1 p-2 bg-muted/50 rounded text-xs text-muted-foreground font-mono">
                        {update.output}
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {update.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )
            })}

            {isRunning && (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

export default AgentCommunicationPanel
