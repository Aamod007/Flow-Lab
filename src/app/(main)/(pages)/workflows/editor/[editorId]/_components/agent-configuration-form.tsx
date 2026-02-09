'use client'
import React, { useState, useEffect } from 'react'
import { useEditor } from '@/providers/editor-provider'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bot, Sparkles, Settings, Brain, Zap } from 'lucide-react'

const AGENT_PRESETS: Record<string, {
  systemPrompt: string
  capabilities: string[]
  temperature: number
  model: string
}> = {
  'Research Agent': {
    systemPrompt: 'You are a research specialist. Your task is to search for information, gather data from multiple sources, and compile comprehensive research reports. Be thorough, cite sources when possible, and provide well-organized findings.',
    capabilities: ['Web Search', 'Data Gathering', 'Report Writing', 'Source Analysis'],
    temperature: 0.3,
    model: 'gemini-2.5-flash'
  },
  'Coder Agent': {
    systemPrompt: 'You are an expert software developer. Write clean, efficient, and well-documented code. Review code for bugs and security issues. Explain your implementation decisions clearly.',
    capabilities: ['Code Writing', 'Code Review', 'Debugging', 'Documentation'],
    temperature: 0.2,
    model: 'gemini-2.5-flash'
  },
  'Analyst Agent': {
    systemPrompt: 'You are a data analyst expert. Analyze data sets, identify patterns and trends, create insights, and present findings in a clear and actionable manner.',
    capabilities: ['Data Analysis', 'Pattern Recognition', 'Statistical Analysis', 'Visualization'],
    temperature: 0.3,
    model: 'gemini-2.5-flash'
  },
  'Writer Agent': {
    systemPrompt: 'You are a professional content writer. Create engaging, well-structured content that is tailored to the target audience. Focus on clarity, creativity, and proper formatting.',
    capabilities: ['Content Creation', 'Editing', 'SEO Writing', 'Storytelling'],
    temperature: 0.7,
    model: 'gemini-2.5-flash'
  },
  'Reviewer Agent': {
    systemPrompt: 'You are a quality assurance specialist. Review work for accuracy, completeness, and quality. Provide constructive feedback and suggestions for improvement.',
    capabilities: ['Quality Review', 'Feedback', 'Error Detection', 'Improvement Suggestions'],
    temperature: 0.2,
    model: 'gemini-2.5-flash'
  },
  'Coordinator Agent': {
    systemPrompt: 'You are a workflow coordinator. Manage task distribution, monitor progress, ensure smooth handoffs between agents, and synthesize outputs from multiple agents.',
    capabilities: ['Task Management', 'Coordination', 'Progress Tracking', 'Output Synthesis'],
    temperature: 0.4,
    model: 'gemini-2.5-flash'
  },
  'Agent': {
    systemPrompt: 'You are a helpful AI assistant. Complete the assigned task to the best of your abilities.',
    capabilities: ['General Tasks', 'Problem Solving', 'Analysis', 'Communication'],
    temperature: 0.5,
    model: 'gemini-2.5-flash'
  },
}

const AVAILABLE_MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
]

type Props = {}

const AgentConfigurationForm = ({ }: Props) => {
  const { state, dispatch } = useEditor()
  const nodeType = state.editor.selectedNode.data.title as string
  const preset = AGENT_PRESETS[nodeType] || AGENT_PRESETS['Agent']

  const [agentConfig, setAgentConfig] = useState({
    systemPrompt: state.editor.selectedNode.data.metadata?.systemPrompt || preset.systemPrompt,
    model: state.editor.selectedNode.data.metadata?.model || preset.model,
    temperature: state.editor.selectedNode.data.metadata?.temperature || preset.temperature,
    maxTokens: state.editor.selectedNode.data.metadata?.maxTokens || 4096,
    customTask: state.editor.selectedNode.data.metadata?.customTask || '',
  })

  // Update node metadata when config changes
  useEffect(() => {
    const updatedNode = {
      ...state.editor.selectedNode,
      data: {
        ...state.editor.selectedNode.data,
        metadata: {
          ...state.editor.selectedNode.data.metadata,
          ...agentConfig,
          agentType: nodeType,
          capabilities: preset.capabilities,
        }
      }
    }

    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        elements: state.editor.elements.map((el) =>
          el.id === state.editor.selectedNode.id ? updatedNode : el
        ),
      },
    })
  }, [agentConfig])

  return (
    <div className="space-y-5">
      {/* Agent Type Badge */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
        <Bot className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">{nodeType}</p>
          <p className="text-[10px] text-muted-foreground">Specialized AI Agent</p>
        </div>
      </div>

      {/* Capabilities */}
      <div>
        <Label className="text-xs flex items-center gap-1.5 mb-2">
          <Sparkles className="h-3 w-3" />
          Capabilities
        </Label>
        <div className="flex flex-wrap gap-1">
          {preset.capabilities.map((cap, idx) => (
            <Badge key={idx} variant="secondary" className="text-[10px] bg-neutral-800">
              {cap}
            </Badge>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <Label className="text-xs flex items-center gap-1.5 mb-2">
          <Brain className="h-3 w-3" />
          AI Model
        </Label>
        <Select
          value={agentConfig.model}
          onValueChange={(value) => setAgentConfig(prev => ({ ...prev, model: value }))}
        >
          <SelectTrigger className="bg-neutral-900 border-neutral-700">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Temperature */}
      <div>
        <Label className="text-xs flex items-center gap-1.5 mb-2">
          <Settings className="h-3 w-3" />
          Temperature: {agentConfig.temperature.toFixed(2)}
        </Label>
        <Slider
          value={[agentConfig.temperature]}
          onValueChange={([value]) => setAgentConfig(prev => ({ ...prev, temperature: value }))}
          max={1}
          min={0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Precise</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div>
        <Label className="text-xs flex items-center gap-1.5 mb-2">
          <Zap className="h-3 w-3" />
          Max Tokens
        </Label>
        <Input
          type="number"
          value={agentConfig.maxTokens}
          onChange={(e) => setAgentConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 4096 }))}
          className="bg-neutral-900 border-neutral-700"
          min={256}
          max={32000}
        />
      </div>

      {/* Custom Task */}
      <div>
        <Label className="text-xs mb-2 block">Custom Task Instructions</Label>
        <Textarea
          value={agentConfig.customTask}
          onChange={(e) => setAgentConfig(prev => ({ ...prev, customTask: e.target.value }))}
          placeholder="Add specific instructions for this agent..."
          className="bg-neutral-900 border-neutral-700 min-h-[80px] text-xs resize-none"
        />
      </div>

      {/* System Prompt (Collapsible) */}
      <div>
        <Label className="text-xs mb-2 block">System Prompt</Label>
        <Textarea
          value={agentConfig.systemPrompt}
          onChange={(e) => setAgentConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
          className="bg-neutral-900 border-neutral-700 min-h-[120px] text-xs font-mono resize-none"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Defines the agent&apos;s behavior and expertise
        </p>
      </div>
    </div>
  )
}

export default AgentConfigurationForm
