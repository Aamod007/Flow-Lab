'use client'

import { testAIAgent } from '../../../_actions/ai-actions'
import { ConnectionProviderProps } from '@/providers/connections-provider'
import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { calculateCost } from '@/lib/ai-cost-tracking'
import { getOllamaClient, getOllamaSettings } from '@/lib/ollama-client'
import { useEditor } from '@/providers/editor-provider'

type Props = {
    nodeConnection: ConnectionProviderProps
}

const AIConfigurationForm = ({ nodeConnection }: Props) => {
    // @ts-ignore
    const { aiNode, setAiNode } = nodeConnection
    const { dispatch, state } = useEditor()
    const [ollamaModels, setOllamaModels] = useState<string[]>(['llama3:8b', 'mistral:7b', 'codellama:13b', 'phi3:mini'])

    // Load Ollama models
    useEffect(() => {
        const loadOllamaModels = async () => {
            const settings = getOllamaSettings()
            const client = getOllamaClient(settings.baseUrl)
            const result = await client.checkConnection()
            if (result.connected) {
                const models = await client.listModels()
                if (models.length > 0) {
                    setOllamaModels(models.map(m => m.name))
                }
            }
        }
        loadOllamaModels()
    }, [])

    const handleChange = (key: string, value: any) => {
        setAiNode((prev: any) => ({
            ...prev,
            [key]: value,
        }))

        const selectedNode = state.editor.selectedNode
        if (selectedNode.id) {
            const newNode = {
                ...selectedNode,
                data: {
                    ...selectedNode.data,
                    metadata: {
                        ...selectedNode.data.metadata,
                        [key]: value
                    }
                }
            }

            dispatch({
                type: 'UPDATE_NODE',
                payload: {
                    elements: state.editor.elements.map((node) => {
                        if (node.id === selectedNode.id) {
                            return newNode
                        }
                        return node
                    }),
                },
            })
        }
    }

    // Models by provider
    const models: Record<string, string[]> = {
        OpenAI: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        'Google Gemini': ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        Anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        Groq: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
        Ollama: ollamaModels
    }

    // Calculate estimated cost
    const estimatedInputTokens = 500
    const estimatedOutputTokens = aiNode.maxTokens || 500
    const estimatedCost = calculateCost(aiNode.model, estimatedInputTokens, estimatedOutputTokens)

    return (
        <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-semibold text-white">AI Configuration</h3>
                <p className="text-xs text-neutral-500 mt-1">Configure the AI model and prompts</p>
            </div>

            {/* Provider - Required */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-neutral-300">Provider</Label>
                    <span className="text-[10px] px-1.5 py-0.5 bg-white text-black rounded font-medium">Required</span>
                </div>
                <Select
                    value={aiNode.provider}
                    onValueChange={(val) => {
                        handleChange('provider', val)
                        if (models[val]?.length > 0) {
                            handleChange('model', models[val][0])
                        }
                    }}
                >
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white text-sm h-9">
                        <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                        <SelectItem value="Groq" className="text-white text-sm">Groq (Free)</SelectItem>
                        <SelectItem value="Ollama" className="text-white text-sm">Ollama (Local)</SelectItem>
                        <SelectItem value="Google Gemini" className="text-white text-sm">Google Gemini</SelectItem>
                        <SelectItem value="OpenAI" className="text-white text-sm">OpenAI</SelectItem>
                        <SelectItem value="Anthropic" className="text-white text-sm">Anthropic</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Model - Required */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-neutral-300">Model</Label>
                    <span className="text-[10px] px-1.5 py-0.5 bg-white text-black rounded font-medium">Required</span>
                </div>
                <Select
                    value={aiNode.model}
                    onValueChange={(val) => handleChange('model', val)}
                >
                    <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white text-sm h-9">
                        <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                        {models[aiNode.provider]?.map((model) => (
                            <SelectItem key={model} value={model} className="text-white text-sm">
                                {model}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Separator className="bg-neutral-800" />

            {/* System Prompt - Optional */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-neutral-300">System Prompt</Label>
                    <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">Optional</span>
                </div>
                <Textarea
                    placeholder="You are a helpful assistant..."
                    value={aiNode.systemPrompt}
                    onChange={(e) => handleChange('systemPrompt', e.target.value)}
                    className="min-h-[70px] bg-neutral-900 border-neutral-800 text-white text-sm placeholder:text-neutral-600 resize-none"
                />
                <div className="flex flex-wrap gap-1">
                    {['Helpful assistant', 'Professional writer', 'Code expert'].map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            className="text-[10px] px-2 py-1 rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-400 transition-colors"
                            onClick={() => handleChange('systemPrompt', preset === 'Helpful assistant' 
                                ? 'You are a helpful assistant. Be concise and clear.'
                                : preset === 'Professional writer'
                                ? 'You are a professional writer. Use formal language.'
                                : 'You are a code expert. Provide clear explanations and examples.'
                            )}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prompt - Required */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-neutral-300">Prompt</Label>
                    <span className="text-[10px] px-1.5 py-0.5 bg-white text-black rounded font-medium">Required</span>
                </div>
                <p className="text-[10px] text-neutral-500">
                    Use <code className="bg-neutral-800 px-1 rounded text-white font-mono">{'{{content}}'}</code> to include input data
                </p>
                <Textarea
                    placeholder="Summarize the following:&#10;&#10;{{content}}"
                    value={aiNode.prompt}
                    onChange={(e) => handleChange('prompt', e.target.value)}
                    className="min-h-[100px] bg-neutral-900 border-neutral-800 text-white text-sm placeholder:text-neutral-600 resize-none font-mono"
                />
                <div className="flex flex-wrap gap-1">
                    {[
                        { label: 'Summarize', value: 'Summarize the following:\n\n{{content}}' },
                        { label: 'Reply', value: 'Write a professional reply to:\n\n{{content}}' },
                        { label: 'Extract', value: 'Extract key points from:\n\n{{content}}' },
                    ].map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            className="text-[10px] px-2 py-1 rounded bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-400 transition-colors"
                            onClick={() => handleChange('prompt', preset.value)}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            <Separator className="bg-neutral-800" />

            {/* Temperature */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-neutral-300">Temperature</Label>
                    <span className="text-xs text-neutral-500 font-mono">{aiNode.temperature}</span>
                </div>
                <Slider
                    defaultValue={[aiNode.temperature]}
                    max={1}
                    step={0.1}
                    onValueChange={(val) => handleChange('temperature', val[0])}
                    className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-white"
                />
                <p className="text-[10px] text-neutral-500">0 = deterministic, 1 = creative</p>
            </div>

            {/* Max Tokens */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-neutral-300">Max Tokens</Label>
                    <span className="text-xs text-neutral-500">~{Math.round(aiNode.maxTokens * 0.75)} words</span>
                </div>
                <Input
                    type="number"
                    value={aiNode.maxTokens}
                    onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                    className="bg-neutral-900 border-neutral-800 text-white text-sm h-9"
                />
            </div>

            <Separator className="bg-neutral-800" />

            {/* Cost Estimate */}
            <div className="flex items-center justify-between py-2 px-3 bg-neutral-900 border border-neutral-800 rounded">
                <span className="text-xs text-neutral-400">Est. cost per run</span>
                <span className="text-sm font-mono text-white">
                    {estimatedCost === 0 ? 'FREE' : `$${estimatedCost.toFixed(4)}`}
                </span>
            </div>

            {/* Test Button */}
            <Button
                onClick={async () => {
                    const toastId = toast.loading('Testing...')
                    try {
                        const response = await testAIAgent(aiNode)
                        if (response.success) {
                            toast.success('Test successful', { id: toastId })
                            handleChange('testResult', response.data)
                        } else {
                            toast.error(response.data || 'Test failed', { id: toastId })
                            handleChange('testResult', `Error: ${response.data}`)
                        }
                    } catch (e: any) {
                        toast.error(e.message || 'Test failed', { id: toastId })
                        handleChange('testResult', `Error: ${e.message}`)
                    }
                }}
                className="w-full bg-white text-black hover:bg-neutral-200 text-sm h-9 font-medium"
            >
                Test
            </Button>

            {/* Test Result */}
            {aiNode.testResult && (
                <div className="flex flex-col gap-2">
                    <Label className="text-xs font-medium text-neutral-300">Test Result</Label>
                    <Textarea
                        readOnly
                        value={aiNode.testResult}
                        className="min-h-[80px] bg-neutral-900 border-neutral-800 text-white text-sm resize-none"
                    />
                </div>
            )}
        </div>
    )
}

export default AIConfigurationForm
