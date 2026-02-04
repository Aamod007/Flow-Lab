'use client'

import React, { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Eye,
    EyeOff,
    Check,
    X,
    Loader2,
    Sparkles,
    Zap,
    Brain,
    Bot,
    Server
} from 'lucide-react'
import { toast } from 'sonner'
import { saveAPIKey } from '../_actions/settings-actions'

// Provider configurations
const AI_PROVIDERS = [
    {
        id: 'gemini',
        name: 'Google Gemini',
        description: 'Google\'s advanced multimodal AI models',
        icon: Sparkles,
        color: '',
        bgColor: 'bg-primary/10',
        borderColor: 'border-muted',
        models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
        pricing: 'Free tier: 60 req/min',
        keyPrefix: 'AIza',
        placeholder: 'AIzaSy...',
    },
    {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4 and GPT-3.5 models',
        icon: Brain,
        color: '',
        bgColor: 'bg-primary/10',
        borderColor: 'border-muted',
        models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        pricing: 'Pay per token',
        keyPrefix: 'sk-',
        placeholder: 'sk-...',
    },
    {
        id: 'groq',
        name: 'Groq',
        description: 'Ultra-fast inference for Llama models',
        icon: Zap,
        color: '',
        bgColor: 'bg-primary/10',
        borderColor: 'border-muted',
        models: ['llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
        pricing: 'Free tier available',
        keyPrefix: 'gsk_',
        placeholder: 'gsk_...',
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude AI models for analysis and safety',
        icon: Bot,
        color: '',
        bgColor: 'bg-primary/10',
        borderColor: 'border-muted',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        pricing: 'Pay per token',
        keyPrefix: 'sk-ant-',
        placeholder: 'sk-ant-...',
    },
    {
        id: 'ollama',
        name: 'Ollama (Local)',
        description: 'Run open-source models locally - FREE',
        icon: Server,
        color: '',
        bgColor: 'bg-primary/10',
        borderColor: 'border-muted',
        models: ['llama3:8b', 'mistral:7b', 'codellama:13b'],
        pricing: '100% FREE (Local)',
        keyPrefix: '',
        placeholder: 'http://localhost:11434',
        isLocal: true,
    },
]

interface ApiKeyState {
    value: string
    isVisible: boolean
    status: 'idle' | 'testing' | 'success' | 'error'
    lastTested?: Date
}

const AiKeysForm = () => {
    const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyState>>({})
    const [defaultModel, setDefaultModel] = useState<Record<string, string>>({})

    // Load saved API keys from localStorage on mount
    useEffect(() => {
        const savedKeys = localStorage.getItem('flowlab_api_keys')
        const savedModels = localStorage.getItem('flowlab_default_models')

        if (savedKeys) {
            try {
                const parsed = JSON.parse(savedKeys)
                // Initialize with saved values but keep visibility off
                const initialState: Record<string, ApiKeyState> = {}
                Object.entries(parsed).forEach(([key, value]) => {
                    initialState[key] = {
                        value: value as string,
                        isVisible: false,
                        status: 'idle'
                    }
                })
                setApiKeys(initialState)
            } catch (e) {
                console.error('Failed to parse saved API keys')
            }
        }

        if (savedModels) {
            try {
                setDefaultModel(JSON.parse(savedModels))
            } catch (e) {
                console.error('Failed to parse saved default models')
            }
        }
    }, [])

    const handleKeyChange = (providerId: string, value: string) => {
        setApiKeys(prev => ({
            ...prev,
            [providerId]: {
                ...prev[providerId],
                value,
                status: 'idle'
            }
        }))
    }

    const toggleVisibility = (providerId: string) => {
        setApiKeys(prev => ({
            ...prev,
            [providerId]: {
                ...prev[providerId],
                isVisible: !prev[providerId]?.isVisible
            }
        }))
    }

    const testConnection = async (providerId: string) => {
        const provider = AI_PROVIDERS.find(p => p.id === providerId)
        if (!provider) return

        const key = apiKeys[providerId]?.value
        if (!key && !provider.isLocal) {
            toast.error('Please enter an API key first')
            return
        }

        setApiKeys(prev => ({
            ...prev,
            [providerId]: {
                ...prev[providerId],
                status: 'testing'
            }
        }))

        try {
            // For local Ollama, check if it's running
            if (provider.isLocal) {
                const ollamaUrl = key || 'http://localhost:11434'
                try {
                    const response = await fetch(`${ollamaUrl}/api/tags`, {
                        method: 'GET',
                    })
                    if (!response.ok) throw new Error('Ollama not responding')
                } catch (e) {
                    throw new Error('Cannot connect to Ollama. Make sure it is running.')
                }
            }

            // Key format validation (instant)
            if (!provider.isLocal && provider.keyPrefix && !key.startsWith(provider.keyPrefix)) {
                throw new Error(`Invalid key format. Expected key to start with "${provider.keyPrefix}"`)
            }

            setApiKeys(prev => ({
                ...prev,
                [providerId]: {
                    ...prev[providerId],
                    status: 'success',
                    lastTested: new Date()
                }
            }))

            toast.success(`${provider.name} connection successful!`)

            // Save to localStorage
            saveApiKeys(providerId, key)

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : `Failed to connect to ${provider.name}`
            setApiKeys(prev => ({
                ...prev,
                [providerId]: {
                    ...prev[providerId],
                    status: 'error'
                }
            }))
            toast.error(errorMessage)
        }
    }

    const saveApiKeys = async (providerId: string, value: string) => {
        // Save to LocalStorage
        const savedKeys = localStorage.getItem('flowlab_api_keys')
        const keys = savedKeys ? JSON.parse(savedKeys) : {}
        keys[providerId] = value
        localStorage.setItem('flowlab_api_keys', JSON.stringify(keys))

        // Save to Server (api-keys.json)
        // Map provider IDs to the keys expected by ai-actions.ts (e.g. GOOGLE_API_KEY)
        let backendKey = ''
        switch (providerId) {
            case 'gemini': backendKey = 'GOOGLE_API_KEY'; break;
            case 'openai': backendKey = 'OPENAI_API_KEY'; break;
            case 'groq': backendKey = 'GROQ_API_KEY'; break;
            case 'anthropic': backendKey = 'ANTHROPIC_API_KEY'; break;
            default: backendKey = `${providerId.toUpperCase()}_API_KEY`;
        }

        try {
            await saveAPIKey(backendKey, value)
        } catch (err) {
            console.error('Failed to sync key to server', err)
        }
    }

    const handleModelChange = (providerId: string, model: string) => {
        setDefaultModel(prev => {
            const updated = { ...prev, [providerId]: model }
            localStorage.setItem('flowlab_default_models', JSON.stringify(updated))
            return updated
        })
        toast.success(`Default model set to ${model}`)
    }

    const getStatusIcon = (status: ApiKeyState['status']) => {
        switch (status) {
            case 'testing':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            case 'success':
                return <Check className="h-4 w-4 text-green-500" />
            case 'error':
                return <X className="h-4 w-4 text-red-500" />
            default:
                return null
        }
    }

    const getMaskedKey = (key: string) => {
        if (!key) return ''
        if (key.length <= 8) return '••••••••'
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4)
    }

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                    Connect your AI providers to use them in your workflows. Your API keys are stored securely in your browser.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {AI_PROVIDERS.map((provider) => {
                    const keyState = apiKeys[provider.id] || { value: '', isVisible: false, status: 'idle' }
                    const Icon = provider.icon

                    return (
                        <Card
                            key={provider.id}
                            className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${provider.borderColor} border`}
                        >

                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${provider.bgColor}`}>
                                            <Icon className={`h-5 w-5`} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{provider.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {provider.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={keyState.status === 'success' ? 'default' : 'secondary'} className="text-xs">
                                        {keyState.status === 'success' ? 'Connected' : 'Not Connected'}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">
                                        {provider.isLocal ? 'Ollama URL' : 'API Key'}
                                    </Label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                type={keyState.isVisible ? 'text' : 'password'}
                                                placeholder={provider.placeholder}
                                                value={keyState.value}
                                                onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => toggleVisibility(provider.id)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {keyState.isVisible ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {getStatusIcon(keyState.status)}
                                    </div>
                                </div>

                                {/* Default Model Selection */}
                                {provider.models.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Default Model</Label>
                                        <select
                                            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            value={defaultModel[provider.id] || provider.models[0]}
                                            onChange={(e) => handleModelChange(provider.id, e.target.value)}
                                        >
                                            {provider.models.map((model) => (
                                                <option key={model} value={model}>
                                                    {model}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{provider.pricing}</span>
                                    {keyState.lastTested && (
                                        <span>Tested: {keyState.lastTested.toLocaleDateString()}</span>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter className="pt-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => testConnection(provider.id)}
                                    disabled={keyState.status === 'testing'}
                                >
                                    {keyState.status === 'testing' ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Testing Connection...
                                        </>
                                    ) : (
                                        'Test Connection'
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            <Card className="mt-6 border-dashed">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Need API Keys?</h4>
                            <p className="text-sm text-muted-foreground">
                                Get started with free tiers from these providers
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" size="sm">Get Gemini Key</Button>
                            </a>
                            <a
                                href="https://console.groq.com/keys"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" size="sm">Get Groq Key</Button>
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default AiKeysForm
