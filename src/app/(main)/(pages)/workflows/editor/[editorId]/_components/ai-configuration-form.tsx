'use client'

import { testAIAgent } from '../../../_actions/ai-actions'
import { ConnectionProviderProps } from '@/providers/connections-provider'
import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
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
import { toast } from 'sonner'

type Props = {
    nodeConnection: ConnectionProviderProps
}

import { useEditor } from '@/providers/editor-provider'

// ...

const AIConfigurationForm = ({ nodeConnection }: Props) => {
    // @ts-ignore
    const { aiNode, setAiNode } = nodeConnection
    const { dispatch, state } = useEditor()

    const handleChange = (key: string, value: any) => {
        setAiNode((prev: any) => ({
            ...prev,
            [key]: value,
        }))

        // Sync with node metadata for visual indicators and persistence
        const selectedNode = state.editor.selectedNode
        if (selectedNode.id) { // Ensure a node is selected
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

            // Dispatch update to ReactFlow nodes
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

    // Pre-defined models based on PRD
    const models: Record<string, string[]> = {
        OpenAI: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        'Google Gemini': ['gemini-1.5-pro', 'gemini-1.5-flash'],
        Anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        Groq: ['llama-3.1-70b', 'mixtral-8x7b'],
        Ollama: ['llama3', 'mistral', 'codellama', 'phi3'] // Local detection placeholder
    }

    return (
        <Card className="w-full border-none shadow-none">
            <CardHeader className="px-0">
                <CardTitle>AI Agent Configuration</CardTitle>
                <CardDescription>Configure your intelligent agent.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 flex flex-col gap-4">

                {/* Provider Selection */}
                <div className="flex flex-col gap-2">
                    <Label>AI Provider</Label>
                    <Select
                        value={aiNode.provider}
                        onValueChange={(val) => handleChange('provider', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(models).map((provider) => (
                                <SelectItem key={provider} value={provider}>
                                    {provider}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Model Selection */}
                <div className="flex flex-col gap-2">
                    <Label>Model</Label>
                    <Select
                        value={aiNode.model}
                        onValueChange={(val) => handleChange('model', val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent>
                            {models[aiNode.provider]?.map((model) => (
                                <SelectItem key={model} value={model}>
                                    {model}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* System Prompt */}
                <div className="flex flex-col gap-2">
                    <Label>System Prompt</Label>
                    <Textarea
                        placeholder="Define the agent's persona and rules..."
                        value={aiNode.systemPrompt}
                        onChange={(e) => handleChange('systemPrompt', e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>

                {/* User Prompt */}
                <div className="flex flex-col gap-2">
                    <Label>User Prompt Template</Label>
                    <Textarea
                        placeholder="Task or question for the agent. Use {{variable}} for dynamic inputs."
                        value={aiNode.prompt}
                        onChange={(e) => handleChange('prompt', e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>

                {/* Temperature */}
                <div className="flex flex-col gap-3 pt-2">
                    <div className="flex justify-between">
                        <Label>Temperature (Creativity)</Label>
                        <span className="text-xs text-muted-foreground">{aiNode.temperature}</span>
                    </div>
                    <Slider
                        defaultValue={[aiNode.temperature]}
                        max={1}
                        step={0.1}
                        onValueChange={(val) => handleChange('temperature', val[0])}
                    />
                </div>

                {/* Max Tokens */}
                <div className="flex flex-col gap-2">
                    <Label>Max Tokens</Label>
                    <Input
                        type="number"
                        value={aiNode.maxTokens}
                        onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                    />
                </div>

                <div className="flex flex-col gap-2 pt-4">
                    <Button
                        onClick={async () => {
                            const toastId = toast.loading('Testing Agent...');
                            try {
                                const response = await testAIAgent(aiNode);
                                if (response.success) {
                                    toast.success('Agent Test Successful', { id: toastId });
                                    handleChange('testResult', response.data);
                                } else {
                                    throw new Error('Test failed');
                                }
                            } catch (e) {
                                toast.error('Test Failed', { id: toastId });
                            }
                        }}
                    >
                        Test Agent
                    </Button>

                    {aiNode.testResult && (
                        <div className="mt-2">
                            <Label>Last Test Result</Label>
                            <Textarea
                                readOnly
                                value={aiNode.testResult}
                                className="min-h-[100px] bg-muted"
                            />
                        </div>
                    )}
                </div>

            </CardContent>
        </Card>
    )
}

export default AIConfigurationForm
