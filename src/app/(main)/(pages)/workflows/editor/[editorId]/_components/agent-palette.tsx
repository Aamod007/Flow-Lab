'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AGENT_TEMPLATES, AgentRole, getAgentColor, getAgentIcon } from '@/lib/agents/agent-types'
import { cn } from '@/lib/utils'
import { Bot, Sparkles, GripVertical, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AgentPaletteProps {
  onDragStart?: (role: AgentRole) => void
}

export function AgentPalette({ onDragStart }: AgentPaletteProps) {
  const agentRoles = Object.keys(AGENT_TEMPLATES) as AgentRole[]

  const handleDragStart = (e: React.DragEvent, role: AgentRole) => {
    e.dataTransfer.setData('application/agentflow-agent', role)
    e.dataTransfer.effectAllowed = 'copy'
    onDragStart?.(role)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold">Agent Palette</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Drag agents onto the canvas to build your workflow
        </p>
      </div>

      {/* Agent List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Sparkles className="h-3 w-3" />
            <span>Pre-built AI Agents</span>
          </div>

          {agentRoles.map((role) => {
            const template = AGENT_TEMPLATES[role]
            const color = getAgentColor(role)
            const icon = getAgentIcon(role)

            return (
              <TooltipProvider key={role}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, role)}
                      className={cn(
                        "group relative p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing",
                        "bg-card hover:bg-muted/50 transition-all duration-200",
                        "hover:shadow-md hover:scale-[1.02]",
                        "border-transparent hover:border-primary/30"
                      )}
                      style={{
                        '--agent-color': color,
                      } as React.CSSProperties}
                    >
                      {/* Drag Handle */}
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="flex items-start gap-3 pl-3">
                        {/* Agent Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                          style={{ backgroundColor: `${color}20`, border: `2px solid ${color}40` }}
                        >
                          {icon}
                        </div>

                        {/* Agent Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{template.name}</h4>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 shrink-0"
                              style={{ backgroundColor: `${color}20`, color: color }}
                            >
                              {role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {template.description}
                          </p>
                        </div>
                      </div>

                      {/* Capabilities Preview */}
                      <div className="flex flex-wrap gap-1 mt-2 pl-3">
                        {template.capabilities.slice(0, 3).map((cap, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                          >
                            {cap}
                          </span>
                        ))}
                        {template.capabilities.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                            +{template.capabilities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <span className="font-semibold">{template.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                      <Separator />
                      <div>
                        <p className="text-xs font-medium mb-1">Capabilities:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {template.capabilities.map((cap, i) => (
                            <li key={i}>• {cap}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                        <span>Model: {template.model}</span>
                        <span>•</span>
                        <span>Temp: {template.temperature}</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}

          <Separator className="my-3" />

          {/* Hint */}
          <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Multi-Agent Collaboration</p>
              <p className="mt-0.5">
                Connect agents together to create powerful AI workflows. Each agent specializes in specific tasks.
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default AgentPalette
