'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  Clock,
  DollarSign,
  Bot,
  CheckCircle2,
  AlertCircle,
  Zap,
  Copy,
  Loader2,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { AIWorkflowTemplate, AIWorkflowAgent } from '@/lib/ai-templates'
import { getProviderColor, getProviderBadgeVariant } from '@/lib/ai-templates'

interface TemplatePreviewModalProps {
  template: AIWorkflowTemplate
  isOpen: boolean
  onClose: () => void
  userConnections?: string[]
}

// Provider icons/colors mapping
const PROVIDER_ICONS: Record<string, { icon: string; bgColor: string }> = {
  ollama: { icon: '🦙', bgColor: 'bg-green-500/10 border-green-500/30' },
  gemini: { icon: '✨', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  openai: { icon: '🤖', bgColor: 'bg-purple-500/10 border-purple-500/30' },
  anthropic: { icon: '🧠', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  groq: { icon: '⚡', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  slack: { icon: '💬', bgColor: 'bg-pink-500/10 border-pink-500/30' },
  discord: { icon: '🎮', bgColor: 'bg-indigo-500/10 border-indigo-500/30' },
  notion: { icon: '📝', bgColor: 'bg-gray-500/10 border-gray-500/30' },
  gmail: { icon: '📧', bgColor: 'bg-red-500/10 border-red-500/30' }
}

const isFreeProvider = (provider: string) => {
  return ['ollama', 'groq'].includes(provider.toLowerCase())
}

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  userConnections = []
}: TemplatePreviewModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Check which connections are missing
  const missingConnections = template.requiredConnections.filter(
    conn => !userConnections.map(c => c.toLowerCase()).includes(conn.toLowerCase())
  )
  const canUseTemplate = missingConnections.length === 0

  // Calculate cost breakdown
  const costBreakdown = template.agents.reduce((acc, agent) => {
    const provider = agent.provider.toLowerCase()
    if (!acc[provider]) {
      acc[provider] = { count: 0, isFree: isFreeProvider(provider) }
    }
    acc[provider].count++
    return acc
  }, {} as Record<string, { count: number; isFree: boolean }>)

  const freeAgents = template.agents.filter(a => isFreeProvider(a.provider)).length
  const paidAgents = template.agents.length - freeAgents

  const handleUseTemplate = async () => {
    try {
      setLoading(true)
      
      // In a real implementation, this would:
      // 1. Create a new workflow from the template
      // 2. Navigate to the editor
      // For now, we'll just simulate and show a toast
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success('Template applied! Redirecting to editor...', {
        description: `Creating "${template.name}" workflow`
      })
      
      // Navigate to workflows page (would go to specific editor in real implementation)
      router.push('/workflows')
      onClose()
    } catch (error) {
      toast.error('Failed to apply template')
    } finally {
      setLoading(false)
    }
  }

  const copyTemplateJson = () => {
    navigator.clipboard.writeText(JSON.stringify(template, null, 2))
    toast.success('Template JSON copied to clipboard')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{template.icon}</span>
            <div>
              <DialogTitle className="text-xl">{template.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {template.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700 text-center">
                <Bot className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <p className="text-lg font-semibold">{template.agents.length}</p>
                <p className="text-xs text-muted-foreground">Agents</p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700 text-center">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <p className="text-lg font-semibold">{template.estimatedCost}</p>
                <p className="text-xs text-muted-foreground">Est. Cost</p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-lg font-semibold">{template.executionTime}</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700 text-center">
                <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-lg font-semibold capitalize">{template.difficulty}</p>
                <p className="text-xs text-muted-foreground">Difficulty</p>
              </div>
            </div>

            {/* Workflow Visualization - Vertical Layout */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-purple-500 rotate-90" />
                Workflow Flow
              </h3>
              <div className="p-4 rounded-lg bg-neutral-800/30 border border-neutral-700">
                <div className="flex flex-col items-center gap-2">
                  {template.agents.map((agent, index) => (
                    <React.Fragment key={agent.id}>
                      <div
                        className={cn(
                          "p-4 rounded-lg border w-full max-w-[280px] transition-all hover:scale-[1.02]",
                          PROVIDER_ICONS[agent.provider.toLowerCase()]?.bgColor || 'bg-neutral-800 border-neutral-700'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {PROVIDER_ICONS[agent.provider.toLowerCase()]?.icon || '🔧'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{agent.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge 
                              variant={getProviderBadgeVariant(agent.provider)}
                              className="text-xs"
                            >
                              {agent.provider}
                            </Badge>
                            {isFreeProvider(agent.provider) && (
                              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                                FREE
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {index < template.agents.length - 1 && (
                        <div className="flex flex-col items-center py-1">
                          <div className="w-px h-4 bg-gradient-to-b from-purple-500/50 to-purple-500/20" />
                          <ChevronDown className="h-4 w-4 text-purple-500/70 -my-1" />
                          <div className="w-px h-4 bg-gradient-to-b from-purple-500/20 to-purple-500/50" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Agent Details */}
            <div className="space-y-3">
              <h3 className="font-semibold">Agent Details ({template.agents.length})</h3>
              <div className="space-y-2">
                {template.agents.map((agent, index) => (
                  <div
                    key={agent.id}
                    className="p-3 rounded-lg bg-neutral-800/30 border border-neutral-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {PROVIDER_ICONS[agent.provider.toLowerCase()]?.icon || '🔧'}
                        </span>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">{agent.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {agent.model || 'N/A'}
                        </Badge>
                        {isFreeProvider(agent.provider) ? (
                          <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                            FREE
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">
                            Paid
                          </Badge>
                        )}
                      </div>
                    </div>
                    {agent.systemPrompt && (
                      <div className="mt-2 p-2 rounded bg-neutral-900/50 text-xs text-muted-foreground">
                        <span className="text-purple-400">System:</span> {agent.systemPrompt.slice(0, 150)}
                        {agent.systemPrompt.length > 150 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3">
              <h3 className="font-semibold">Cost Breakdown</h3>
              <div className="p-4 rounded-lg bg-neutral-800/30 border border-neutral-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Free agents (Ollama/Groq)</span>
                  <span className="font-medium text-green-400">{freeAgents} agents - $0.00</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Paid agents</span>
                  <span className="font-medium">{paidAgents} agents</span>
                </div>
                <Separator className="my-3 bg-neutral-700" />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Estimated per run</span>
                  <span className="font-bold text-lg">{template.estimatedCost}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: Switch to Ollama or Groq to reduce costs to $0
                </p>
              </div>
            </div>

            {/* Required Connections */}
            {template.requiredConnections.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Required Connections</h3>
                <div className="space-y-2">
                  {template.requiredConnections.map((conn) => {
                    const isConnected = userConnections.map(c => c.toLowerCase()).includes(conn.toLowerCase())
                    return (
                      <div
                        key={conn}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          isConnected 
                            ? "bg-green-500/10 border-green-500/30" 
                            : "bg-red-500/10 border-red-500/30"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isConnected ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="capitalize">{conn}</span>
                        </div>
                        {isConnected ? (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                            Connected
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push('/connections')}
                          >
                            Connect
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {template.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={copyTemplateJson}>
            <Copy className="h-4 w-4 mr-2" />
            Copy JSON
          </Button>
          <div className="flex gap-2 sm:ml-auto">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUseTemplate}
              disabled={loading || !canUseTemplate}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : !canUseTemplate ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Connect {missingConnections.length > 0 ? missingConnections[0] : 'Required Services'} First
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Use Template
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TemplatePreviewModal
