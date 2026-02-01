'use client'

import { testAIAgent } from '../../../_actions/ai-actions'
import { ConnectionProviderProps } from '@/providers/connections-provider'
import React, { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    DollarSign,
    Zap,
    Clock,
    Cpu,
    Cloud,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Brain,
    TrendingDown
} from 'lucide-react'
import { AI_PRICING, calculateCost } from '@/lib/ai-cost-tracking'
import { suggestModelForTask } from '@/lib/cost-optimizer'
import { getOllamaClient, getOllamaSettings, OLLAMA_AVAILABLE_MODELS } from '@/lib/ollama-client'

type Props = {
    nodeConnection: ConnectionProviderProps
}

import { useEditor } from '@/providers/editor-provider'

// Model metadata for UI
const MODEL_INFO: Record<string, {
    description: string;
    speed: 'fast' | 'medium' | 'slow';
    quality: 1 | 2 | 3 | 4 | 5;
    costTier: 'free' | 'cheap' | 'moderate' | 'expensive';
    bestFor: string[];
}> = {
    // OpenAI
    'gpt-4-turbo': {
        description: 'Most capable GPT-4 model',
        speed: 'medium',
        quality: 5,
        costTier: 'expensive',
        bestFor: ['Complex reasoning', 'Creative writing', 'Code generation']
    },
    'gpt-4': {
        description: 'Highly capable reasoning',
        speed: 'slow',
        quality: 5,
        costTier: 'expensive',
        bestFor: ['Complex analysis', 'Nuanced tasks']
    },
    'gpt-3.5-turbo': {
        description: 'Fast and cost-effective',
        speed: 'fast',
        quality: 3,
        costTier: 'cheap',
        bestFor: ['Quick tasks', 'Simple generation', 'Chat']
    },
    // Gemini
    'gemini-2.5-flash': {
        description: 'Latest Gemini 2.5, fastest & smartest',
        speed: 'fast',
        quality: 5,
        costTier: 'free',
        bestFor: ['Complex tasks', 'Reasoning', 'Fast responses']
    },
    'gemini-2.0-flash': {
        description: 'Gemini 2.0, very fast',
        speed: 'fast',
        quality: 4,
        costTier: 'free',
        bestFor: ['General tasks', 'Fast responses']
    },
    'gemini-1.5-pro': {
        description: 'Long context, great reasoning',
        speed: 'medium',
        quality: 5,
        costTier: 'cheap',
        bestFor: ['Long documents', 'Complex analysis']
    },
    'gemini-1.5-flash': {
        description: 'Fast with free tier',
        speed: 'fast',
        quality: 4,
        costTier: 'free',
        bestFor: ['Quick tasks', 'High volume']
    },
    // Anthropic
    'claude-3-opus': {
        description: 'Most intelligent Claude',
        speed: 'slow',
        quality: 5,
        costTier: 'expensive',
        bestFor: ['Research', 'Complex writing', 'Analysis']
    },
    'claude-3-sonnet': {
        description: 'Balanced performance',
        speed: 'medium',
        quality: 4,
        costTier: 'moderate',
        bestFor: ['General tasks', 'Coding', 'Writing']
    },
    'claude-3-haiku': {
        description: 'Fast and affordable',
        speed: 'fast',
        quality: 3,
        costTier: 'cheap',
        bestFor: ['Quick responses', 'Simple tasks']
    },
    // Groq
    'llama-3.1-70b-versatile': {
        description: 'Llama 3.1 on Groq (FREE)',
        speed: 'fast',
        quality: 4,
        costTier: 'free',
        bestFor: ['Fast inference', 'General tasks']
    },
    'mixtral-8x7b-32768': {
        description: 'Mixtral on Groq (FREE)',
        speed: 'fast',
        quality: 4,
        costTier: 'free',
        bestFor: ['Multi-task', 'Reasoning']
    },
    // Ollama
    'llama3:8b': {
        description: 'Local Llama 3 (FREE)',
        speed: 'medium',
        quality: 4,
        costTier: 'free',
        bestFor: ['Privacy', 'No API costs', 'General tasks']
    },
    'mistral:7b': {
        description: 'Local Mistral (FREE)',
        speed: 'fast',
        quality: 3,
        costTier: 'free',
        bestFor: ['Fast local inference', 'Simple tasks']
    },
    'codellama:13b': {
        description: 'Local code specialist (FREE)',
        speed: 'medium',
        quality: 4,
        costTier: 'free',
        bestFor: ['Code generation', 'Debugging']
    },
    'phi3:mini': {
        description: 'Tiny but capable (FREE)',
        speed: 'fast',
        quality: 2,
        costTier: 'free',
        bestFor: ['Quick tests', 'Simple tasks']
    }
}

const AIConfigurationForm = ({ nodeConnection }: Props) => {
    // @ts-ignore
    const { aiNode, setAiNode } = nodeConnection
    const { dispatch, state } = useEditor()
    const [ollamaModels, setOllamaModels] = useState<string[]>(['llama3:8b', 'mistral:7b', 'codellama:13b', 'phi3:mini'])
    const [showComparison, setShowComparison] = useState(false)

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

        // Sync with node metadata for visual indicators and persistence
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

    // Get current model info
    const currentModelInfo = MODEL_INFO[aiNode.model] || {
        description: 'Custom model',
        speed: 'medium',
        quality: 3,
        costTier: 'moderate',
        bestFor: ['General tasks']
    }

    // Calculate estimated cost
    const estimatedInputTokens = 500
    const estimatedOutputTokens = aiNode.maxTokens || 500
    const estimatedCost = calculateCost(aiNode.model, estimatedInputTokens, estimatedOutputTokens)

    // Get cost badge color
    const getCostColor = (tier: string) => {
        switch (tier) {
            case 'free': return 'bg-green-500/10 text-green-500'
            case 'cheap': return 'bg-blue-500/10 text-blue-500'
            case 'moderate': return 'bg-yellow-500/10 text-yellow-500'
            case 'expensive': return 'bg-red-500/10 text-red-500'
            default: return 'bg-muted text-muted-foreground'
        }
    }

    // Get speed indicator
    const getSpeedIndicator = (speed: string) => {
        switch (speed) {
            case 'fast': return '⚡⚡⚡'
            case 'medium': return '⚡⚡'
            case 'slow': return '⚡'
            default: return '⚡⚡'
        }
    }

    // Get quality stars
    const getQualityStars = (quality: number) => {
        return '★'.repeat(quality) + '☆'.repeat(5 - quality)
    }

    // Smart model suggestion
    const getSuggestion = () => {
        if (!aiNode.prompt) return null
        const suggestion = suggestModelForTask(aiNode.prompt, 'free')
        if (suggestion.model !== aiNode.model) {
            return suggestion
        }
        return null
    }

    const suggestion = getSuggestion()

    return (
        <Card className="w-full border-none shadow-none">
            <CardHeader className="px-0">
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Agent Configuration
                </CardTitle>
                <CardDescription>Configure your intelligent agent.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 flex flex-col gap-4">

                {/* Provider Selection */}
                <div className="flex flex-col gap-2">
                    <Label>AI Provider</Label>
                    <Select
                        value={aiNode.provider}
                        onValueChange={(val) => {
                            handleChange('provider', val)
                            // Auto-select first model of new provider
                            if (models[val]?.length > 0) {
                                handleChange('model', models[val][0])
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Ollama">
                                <div className="flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-green-500" />
                                    Ollama (Local - FREE)
                                </div>
                            </SelectItem>
                            <SelectItem value="Groq">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    Groq (Cloud - FREE)
                                </div>
                            </SelectItem>
                            <SelectItem value="Google Gemini">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-blue-500" />
                                    Google Gemini (Free Tier)
                                </div>
                            </SelectItem>
                            <SelectItem value="OpenAI">
                                <div className="flex items-center gap-2">
                                    <Cloud className="h-4 w-4" />
                                    OpenAI
                                </div>
                            </SelectItem>
                            <SelectItem value="Anthropic">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-purple-500" />
                                    Anthropic
                                </div>
                            </SelectItem>
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
                            {models[aiNode.provider]?.map((model) => {
                                const info = MODEL_INFO[model]
                                return (
                                    <SelectItem key={model} value={model}>
                                        <div className="flex items-center justify-between gap-4 w-full">
                                            <span>{model}</span>
                                            {info && (
                                                <Badge className={cn("text-xs", getCostColor(info.costTier))}>
                                                    {info.costTier === 'free' ? 'FREE' : info.costTier.toUpperCase()}
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Model Info Card */}
                <Card className="bg-muted/50">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{aiNode.model}</span>
                            <Badge className={cn(getCostColor(currentModelInfo.costTier))}>
                                {currentModelInfo.costTier === 'free' ? (
                                    <><CheckCircle2 className="h-3 w-3 mr-1" />FREE</>
                                ) : (
                                    currentModelInfo.costTier.toUpperCase()
                                )}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{currentModelInfo.description}</p>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex flex-col items-center p-2 bg-background rounded">
                                <span className="text-muted-foreground">Speed</span>
                                <span>{getSpeedIndicator(currentModelInfo.speed)}</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-background rounded">
                                <span className="text-muted-foreground">Quality</span>
                                <span className="text-yellow-500">{getQualityStars(currentModelInfo.quality)}</span>
                            </div>
                            <div className="flex flex-col items-center p-2 bg-background rounded">
                                <span className="text-muted-foreground">Est. Cost</span>
                                <span className={estimatedCost === 0 ? "text-green-500" : ""}>
                                    ${estimatedCost.toFixed(4)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                            {currentModelInfo.bestFor.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Smart Suggestion */}
                {suggestion && aiNode.prompt && (
                    <Card className="border-green-500/50 bg-green-500/5">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-green-500" />
                                <div>
                                    <p className="text-sm font-medium">Save money</p>
                                    <p className="text-xs text-muted-foreground">
                                        {suggestion.model} is FREE and works well for this task
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    handleChange('provider', suggestion.provider)
                                    handleChange('model', suggestion.model)
                                }}
                            >
                                Switch
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Separator />

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
                    <p className="text-xs text-muted-foreground">
                        Low = focused/deterministic, High = creative/varied
                    </p>
                </div>

                {/* Max Tokens */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                        <Label>Max Tokens</Label>
                        <span className="text-xs text-muted-foreground">
                            ~{Math.round(aiNode.maxTokens * 0.75)} words
                        </span>
                    </div>
                    <Input
                        type="number"
                        value={aiNode.maxTokens}
                        onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                    />
                </div>

                {/* Cost Estimator */}
                <Card className="bg-muted/30">
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Estimated cost per run</span>
                            </div>
                            <span className={cn(
                                "font-mono font-medium",
                                estimatedCost === 0 ? "text-green-500" : "text-foreground"
                            )}>
                                {estimatedCost === 0 ? 'FREE' : `$${estimatedCost.toFixed(4)}`}
                            </span>
                        </div>
                    </CardContent>
                </Card>

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
                                    const errorMessage = response.data || 'Test failed';
                                    toast.error(errorMessage, { id: toastId });
                                    handleChange('testResult', `Error: ${errorMessage}`);
                                }
                            } catch (e: any) {
                                toast.error(e.message || 'Test Failed', { id: toastId });
                                handleChange('testResult', `Exception: ${e.message || 'Unknown error'}`);
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
