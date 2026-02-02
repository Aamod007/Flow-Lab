'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import {
  Bot,
  Play,
  Plus,
  Trash2,
  Settings,
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  DollarSign,
  MessageSquare,
  GripVertical,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Download,
  Users,
  Brain,
  Target,
  CheckCircle2,
  Circle,
  Save,
  Maximize,
  ZoomIn,
  ZoomOut,
  Hand
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Agent,
  AgentRole,
  AGENT_TEMPLATES,
  createAgent,
  getAgentColor,
  getAgentIcon
} from '@/lib/agents/agent-types'
import { executeAgentWorkflow, WorkflowUpdate, WorkflowResult } from '@/lib/agents/agent-executor'

interface CanvasAgent extends Agent {
  position: { x: number; y: number }
}

export default function AgentsPage() {
  const [canvasAgents, setCanvasAgents] = useState<CanvasAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<CanvasAgent | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [updates, setUpdates] = useState<WorkflowUpdate[]>([])
  const [result, setResult] = useState<WorkflowResult | null>(null)
  const [inputPrompt, setInputPrompt] = useState('')
  const [currentAgentIndex, setCurrentAgentIndex] = useState(-1)
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'idle' | 'running' | 'completed'>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)

  const addAgentToCanvas = (role: AgentRole, e?: React.MouseEvent) => {
    const newAgent = createAgent(role)
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    
    // Position in center of canvas or where dropped
    const position = {
      x: canvasRect ? (canvasRect.width / 2 - 60) / zoom : 200,
      y: canvasRect ? (100 + canvasAgents.length * 120) / zoom : 100 + canvasAgents.length * 120
    }

    const canvasAgent: CanvasAgent = {
      ...newAgent,
      position
    }

    setCanvasAgents(prev => [...prev, canvasAgent])
    setAgentStatuses(prev => ({ ...prev, [newAgent.id]: 'idle' }))
    toast.success(`Added ${AGENT_TEMPLATES[role].name}`)
  }

  const removeAgent = (agentId: string) => {
    setCanvasAgents(prev => prev.filter(a => a.id !== agentId))
    if (selectedAgent?.id === agentId) {
      setSelectedAgent(null)
    }
  }

  const handleAgentDrag = (agentId: string, e: React.MouseEvent) => {
    if (!canvasRef.current) return
    
    const agent = canvasAgents.find(a => a.id === agentId)
    if (!agent) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const startX = e.clientX - canvasRect.left - agent.position.x * zoom
    const startY = e.clientY - canvasRect.top - agent.position.y * zoom

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newX = (moveEvent.clientX - canvasRect.left - startX) / zoom
      const newY = (moveEvent.clientY - canvasRect.top - startY) / zoom

      setCanvasAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, position: { x: Math.max(0, newX), y: Math.max(0, newY) } } : a
      ))
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const role = e.dataTransfer.getData('agentRole') as AgentRole
    if (!role || !AGENT_TEMPLATES[role]) return

    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (!canvasRect) return

    const position = {
      x: (e.clientX - canvasRect.left) / zoom - 60,
      y: (e.clientY - canvasRect.top) / zoom - 40
    }

    const newAgent = createAgent(role)
    const canvasAgent: CanvasAgent = { ...newAgent, position }

    setCanvasAgents(prev => [...prev, canvasAgent])
    setAgentStatuses(prev => ({ ...prev, [newAgent.id]: 'idle' }))
    toast.success(`Added ${AGENT_TEMPLATES[role].name}`)
  }

  const runWorkflow = async () => {
    if (canvasAgents.length === 0) {
      toast.error('Add at least one agent to run')
      return
    }

    if (!inputPrompt.trim()) {
      toast.error('Enter a task description')
      return
    }

    setIsRunning(true)
    setUpdates([])
    setResult(null)
    setCurrentAgentIndex(0)

    const statuses: Record<string, 'idle' | 'running' | 'completed'> = {}
    canvasAgents.forEach(a => { statuses[a.id] = 'idle' })
    setAgentStatuses(statuses)

    try {
      const workflowResult = await executeAgentWorkflow(
        canvasAgents,
        inputPrompt,
        (update) => {
          setUpdates(prev => [...prev, update])

          if (update.agentId) {
            if (update.type === 'agent-start' || update.type === 'agent-working') {
              setAgentStatuses(prev => ({ ...prev, [update.agentId!]: 'running' }))
              const idx = canvasAgents.findIndex(a => a.id === update.agentId)
              setCurrentAgentIndex(idx)
            } else if (update.type === 'agent-complete') {
              setAgentStatuses(prev => ({ ...prev, [update.agentId!]: 'completed' }))
            }
          }
        }
      )

      setResult(workflowResult)
      toast.success('Workflow completed!')
    } catch (error) {
      toast.error('Workflow failed')
    } finally {
      setIsRunning(false)
      setCurrentAgentIndex(-1)
    }
  }

  const resetWorkflow = () => {
    setUpdates([])
    setResult(null)
    setCurrentAgentIndex(-1)
    const statuses: Record<string, 'idle' | 'running' | 'completed'> = {}
    canvasAgents.forEach(a => { statuses[a.id] = 'idle' })
    setAgentStatuses(statuses)
  }

  // Draw connections between agents
  const renderConnections = () => {
    if (canvasAgents.length < 2) return null

    return canvasAgents.slice(0, -1).map((agent, idx) => {
      const nextAgent = canvasAgents[idx + 1]
      const startX = agent.position.x + 60
      const startY = agent.position.y + 40
      const endX = nextAgent.position.x + 60
      const endY = nextAgent.position.y + 40

      const status = agentStatuses[agent.id]
      const isCompleted = status === 'completed'

      return (
        <svg
          key={`connection-${agent.id}-${nextAgent.id}`}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <marker
              id={`arrowhead-${idx}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={isCompleted ? '#22c55e' : '#5B5966'}
              />
            </marker>
          </defs>
          <line
            x1={startX * zoom}
            y1={startY * zoom}
            x2={endX * zoom}
            y2={endY * zoom}
            stroke={isCompleted ? '#22c55e' : '#5B5966'}
            strokeWidth="2"
            strokeDasharray={isCompleted ? '0' : '5,5'}
            markerEnd={`url(#arrowhead-${idx})`}
            className="transition-all duration-300"
          />
        </svg>
      )
    })
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Sidebar - Agent Palette */}
        <ResizablePanel defaultSize={18} minSize={15} maxSize={25} className="dark:bg-[#1a1a1a] border-r border-neutral-800">
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#2F006B]">
                  <Brain className="h-4 w-4 text-[#C8C7FF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Agent Types</h3>
                  <p className="text-[10px] text-neutral-500">Drag to canvas</p>
                </div>
              </div>
            </div>

            {/* Agent List */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-2">
                {(Object.keys(AGENT_TEMPLATES) as AgentRole[]).map((role) => {
                  const template = AGENT_TEMPLATES[role]
                  const icon = getAgentIcon(role)
                  const color = getAgentColor(role)

                  return (
                    <div
                      key={role}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('agentRole', role)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onClick={() => addAgentToCanvas(role)}
                      className={cn(
                        "p-3 rounded-lg border border-neutral-800 cursor-grab active:cursor-grabbing transition-all",
                        "hover:border-[#7540A9]/50 hover:bg-neutral-800/30 active:scale-[0.98]",
                        "bg-neutral-900/50 group"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                        >
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{template.name}</h4>
                          <p className="text-[10px] text-neutral-500 truncate">{template.description}</p>
                        </div>
                        <GripVertical className="h-4 w-4 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Task Input at Bottom */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-900/50">
              <label className="text-xs font-medium text-neutral-400 mb-2 block">Task Prompt</label>
              <Textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="What should the agents accomplish..."
                className="min-h-[60px] text-xs bg-neutral-900 border-neutral-800 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={runWorkflow}
                  disabled={isRunning || canvasAgents.length === 0}
                  size="sm"
                  className="flex-1 bg-[#7540A9] hover:bg-[#8B5CF6]"
                >
                  {isRunning ? (
                    <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={resetWorkflow} disabled={isRunning} className="border-neutral-700">
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-[2px] bg-neutral-800" />

        {/* Main Canvas */}
        <ResizablePanel defaultSize={55}>
          <div className="h-full flex flex-col bg-[#111111]">
            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-[#C8C7FF]" />
                  <span className="font-medium">Agent Canvas</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-neutral-700">
                  {canvasAgents.length} agents
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-neutral-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-2 bg-neutral-700" />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(1)}>
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Canvas Area */}
            <div
              ref={canvasRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="flex-1 relative overflow-hidden"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 1px 1px, #333 1px, transparent 0)
                `,
                backgroundSize: `${24 * zoom}px ${24 * zoom}px`
              }}
            >
              {/* Connection Lines */}
              {renderConnections()}

              {/* Agent Nodes */}
              {canvasAgents.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-neutral-500">
                    <Bot className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Drag agents here</p>
                    <p className="text-sm">Build your multi-agent workflow</p>
                  </div>
                </div>
              ) : (
                canvasAgents.map((agent, idx) => {
                  const icon = getAgentIcon(agent.role)
                  const color = getAgentColor(agent.role)
                  const status = agentStatuses[agent.id] || 'idle'
                  const isCurrent = idx === currentAgentIndex
                  const isSelected = selectedAgent?.id === agent.id

                  return (
                    <div
                      key={agent.id}
                      className={cn(
                        "absolute transition-shadow cursor-move select-none",
                        isCurrent && "z-20",
                        isSelected && "z-10"
                      )}
                      style={{
                        left: agent.position.x * zoom,
                        top: agent.position.y * zoom,
                        transform: `scale(${zoom})`
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setSelectedAgent(agent)
                        handleAgentDrag(agent.id, e)
                      }}
                    >
                      <div
                        className={cn(
                          "w-[120px] rounded-xl border-2 transition-all bg-neutral-900",
                          isSelected ? "border-[#7540A9] shadow-lg shadow-[#7540A9]/20" : "border-neutral-700",
                          isCurrent && "ring-2 ring-[#C8C7FF] ring-offset-2 ring-offset-[#111111]",
                          status === 'running' && "animate-pulse"
                        )}
                      >
                        {/* Agent Header */}
                        <div
                          className="p-2 rounded-t-lg flex items-center gap-2"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                            style={{ backgroundColor: `${color}25`, border: `1px solid ${color}50` }}
                          >
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate">{agent.name.replace(' Agent', '')}</p>
                            <p className="text-[9px] text-neutral-500 capitalize">{agent.role}</p>
                          </div>
                        </div>

                        {/* Status Footer */}
                        <div className="px-2 py-1.5 flex items-center justify-between border-t border-neutral-800">
                          <div className="flex items-center gap-1">
                            {status === 'idle' && <Circle className="h-2.5 w-2.5 text-neutral-500" />}
                            {status === 'running' && <div className="h-2.5 w-2.5 rounded-full bg-[#C8C7FF] animate-pulse" />}
                            {status === 'completed' && <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />}
                            <span className="text-[9px] text-neutral-500 capitalize">{status}</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeAgent(agent.id) }}
                            className="p-0.5 hover:bg-red-500/20 hover:text-red-400 rounded text-neutral-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-[2px] bg-neutral-800" />

        {/* Right Sidebar - Details & Output */}
        <ResizablePanel defaultSize={27} minSize={20} maxSize={40} className="dark:bg-[#1a1a1a] border-l border-neutral-800">
          <div className="h-full flex flex-col">
            {selectedAgent ? (
              <>
                {/* Agent Details Header */}
                <div className="p-4 border-b border-neutral-800" style={{ backgroundColor: `${getAgentColor(selectedAgent.role)}08` }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${getAgentColor(selectedAgent.role)}20`, border: `2px solid ${getAgentColor(selectedAgent.role)}40` }}
                    >
                      {getAgentIcon(selectedAgent.role)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedAgent.name}</h3>
                      <Badge variant="outline" className="text-[10px] mt-0.5" style={{ borderColor: `${getAgentColor(selectedAgent.role)}50`, color: getAgentColor(selectedAgent.role) }}>
                        {selectedAgent.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-neutral-400 mb-1">Description</h4>
                      <p className="text-sm text-neutral-300">{selectedAgent.description}</p>
                    </div>
                    <Separator className="bg-neutral-800" />
                    <div>
                      <h4 className="text-xs font-medium text-neutral-400 mb-2">Capabilities</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedAgent.capabilities.map((cap, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] bg-neutral-800/80">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator className="bg-neutral-800" />
                    <div>
                      <h4 className="text-xs font-medium text-neutral-400 mb-1">System Prompt</h4>
                      <div className="p-2 bg-neutral-800/50 rounded text-[11px] font-mono text-neutral-400 max-h-[120px] overflow-y-auto">
                        {selectedAgent.systemPrompt}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-neutral-500">Model</span>
                        <p className="font-medium text-neutral-300">{selectedAgent.model}</p>
                      </div>
                      <div>
                        <span className="text-neutral-500">Temperature</span>
                        <p className="font-medium text-neutral-300">{selectedAgent.temperature}</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : result ? (
              <>
                <div className="p-4 border-b border-neutral-800 bg-green-500/5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Workflow Output</h3>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {result.metrics.totalTokens.toLocaleString()} tokens
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${result.metrics.totalCost.toFixed(4)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(result.metrics.duration / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="prose prose-sm prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-sm text-neutral-300">{result.output}</div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <>
                {/* Execution Log when no agent selected */}
                <div className="p-4 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-neutral-500" />
                    <h3 className="font-medium text-sm">Execution Log</h3>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-3">
                  {updates.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Activity will appear here</p>
                      <p className="text-xs mt-1">Select an agent or run the workflow</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {updates.map((update, idx) => {
                        const agent = canvasAgents.find(a => a.id === update.agentId)
                        const icon = agent ? getAgentIcon(agent.role) : '🚀'

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex gap-2 p-2 rounded-lg text-sm",
                              update.type === 'agent-complete' && "bg-green-500/5",
                              update.type === 'complete' && "bg-[#7540A9]/5",
                              update.type === 'error' && "bg-red-500/10"
                            )}
                          >
                            <span className="text-sm shrink-0">{icon}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs text-neutral-300">{update.message}</span>
                              {update.output && (
                                <div className="mt-1 p-1.5 bg-neutral-800/50 rounded text-[10px] font-mono text-neutral-400 truncate">
                                  {update.output}
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] text-neutral-600 shrink-0">
                              {update.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
