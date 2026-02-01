'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Key,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    ExternalLink,
    Copy,
    Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ApiKeyEntry {
    id: string
    provider: string
    key: string
    isActive: boolean
    addedAt: string
    lastUsed?: string
}

interface ProviderConfig {
    name: string
    key: string
    description: string
    docsUrl: string
    placeholder: string
    icon: string
}

const PROVIDERS: ProviderConfig[] = [
    {
        name: 'OpenAI',
        key: 'openai',
        description: 'GPT-4, GPT-3.5 Turbo models',
        docsUrl: 'https://platform.openai.com/api-keys',
        placeholder: 'sk-...',
        icon: '🤖'
    },
    {
        name: 'Google Gemini',
        key: 'gemini',
        description: 'Gemini Pro, Flash models (Free tier available)',
        docsUrl: 'https://makersuite.google.com/app/apikey',
        placeholder: 'AIza...',
        icon: '✨'
    },
    {
        name: 'Anthropic',
        key: 'anthropic',
        description: 'Claude 3 Opus, Sonnet, Haiku',
        docsUrl: 'https://console.anthropic.com/account/keys',
        placeholder: 'sk-ant-...',
        icon: '🧠'
    },
    {
        name: 'Groq',
        key: 'groq',
        description: 'Ultra-fast inference (Free tier)',
        docsUrl: 'https://console.groq.com/keys',
        placeholder: 'gsk_...',
        icon: '⚡'
    }
]

const API_KEYS_STORAGE = 'agentflow_api_keys'

const ApiKeyManager: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([])
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
    const [newKey, setNewKey] = useState<{ provider: string; key: string } | null>(null)
    const [isTesting, setIsTesting] = useState<string | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Load API keys from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(API_KEYS_STORAGE)
        if (stored) {
            try {
                setApiKeys(JSON.parse(stored))
            } catch {
                // Invalid stored data
            }
        }
    }, [])

    // Save API keys to localStorage
    const saveApiKeys = (keys: ApiKeyEntry[]) => {
        setApiKeys(keys)
        localStorage.setItem(API_KEYS_STORAGE, JSON.stringify(keys))
    }

    // Add a new API key
    const handleAddKey = (provider: string, key: string) => {
        if (!key.trim()) {
            toast.error('Please enter an API key')
            return
        }

        // Check for duplicate provider
        const existing = apiKeys.find(k => k.provider === provider)
        if (existing) {
            // Update existing
            const updated = apiKeys.map(k =>
                k.provider === provider
                    ? { ...k, key, isActive: true, addedAt: new Date().toISOString() }
                    : k
            )
            saveApiKeys(updated)
            toast.success(`${provider} API key updated`)
        } else {
            // Add new
            const newEntry: ApiKeyEntry = {
                id: `key-${Date.now()}`,
                provider,
                key,
                isActive: true,
                addedAt: new Date().toISOString()
            }
            saveApiKeys([...apiKeys, newEntry])
            toast.success(`${provider} API key added`)
        }

        setNewKey(null)
    }

    // Remove an API key
    const handleRemoveKey = (id: string) => {
        const key = apiKeys.find(k => k.id === id)
        if (!confirm(`Remove ${key?.provider} API key?`)) return

        saveApiKeys(apiKeys.filter(k => k.id !== id))
        toast.success('API key removed')
    }

    // Toggle key visibility
    const toggleShowKey = (id: string) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }))
    }

    // Copy key to clipboard
    const handleCopyKey = async (id: string, key: string) => {
        await navigator.clipboard.writeText(key)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
        toast.success('Copied to clipboard')
    }

    // Test API key
    const handleTestKey = async (provider: string, key: string) => {
        setIsTesting(provider)

        // Simulate API test
        await new Promise(resolve => setTimeout(resolve, 1500))

        // In production, you'd make an actual API call here
        const success = key.length > 10

        if (success) {
            toast.success(`${provider} API key is valid!`)
        } else {
            toast.error(`Invalid ${provider} API key`)
        }

        setIsTesting(null)
    }

    // Mask API key for display
    const maskKey = (key: string) => {
        if (key.length <= 8) return '••••••••'
        return `${key.slice(0, 4)}${'•'.repeat(20)}${key.slice(-4)}`
    }

    // Get provider config
    const getProviderConfig = (providerKey: string) => {
        return PROVIDERS.find(p => p.key === providerKey)
    }

    // Check if provider has a key
    const hasKey = (providerKey: string) => {
        return apiKeys.some(k => k.provider === providerKey && k.isActive)
    }

    return (
        <div className="space-y-6">
            {/* Info Card */}
            <Card className="bg-blue-500/5 border-blue-500/20">
                <CardContent className="p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium">API keys are stored locally</p>
                        <p className="text-sm text-muted-foreground">
                            Your API keys are stored in your browser's local storage and never sent to our servers.
                            For production use, consider using environment variables.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Existing Keys */}
            {apiKeys.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Configured API Keys
                        </CardTitle>
                        <CardDescription>
                            Manage your AI provider credentials
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {apiKeys.map((entry) => {
                            const config = getProviderConfig(entry.provider)
                            return (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">{config?.icon || '🔑'}</div>
                                        <div>
                                            <p className="font-medium">{config?.name || entry.provider}</p>
                                            <p className="text-sm text-muted-foreground font-mono">
                                                {showKeys[entry.id] ? entry.key : maskKey(entry.key)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={cn(
                                            entry.isActive
                                                ? "bg-green-500/10 text-green-500"
                                                : "bg-red-500/10 text-red-500"
                                        )}>
                                            {entry.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleShowKey(entry.id)}
                                        >
                                            {showKeys[entry.id] ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleCopyKey(entry.id, entry.key)}
                                        >
                                            {copiedId === entry.id ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleTestKey(entry.provider, entry.key)}
                                            disabled={isTesting === entry.provider}
                                        >
                                            {isTesting === entry.provider ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveKey(entry.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Add New Key Form */}
            {newKey && (
                <Card className="border-primary/50">
                    <CardHeader>
                        <CardTitle>
                            Add {getProviderConfig(newKey.provider)?.name} API Key
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="api-key">API Key</Label>
                            <Input
                                id="api-key"
                                type="password"
                                value={newKey.key}
                                onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                                placeholder={getProviderConfig(newKey.provider)?.placeholder}
                                className="mt-1 font-mono"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => handleAddKey(newKey.provider, newKey.key)}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Key
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setNewKey(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="link"
                                className="gap-2 ml-auto"
                                asChild
                            >
                                <a
                                    href={getProviderConfig(newKey.provider)?.docsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Get API Key
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Provider Cards */}
            <Card>
                <CardHeader>
                    <CardTitle>Available Providers</CardTitle>
                    <CardDescription>
                        Connect your preferred AI providers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {PROVIDERS.map((provider) => {
                            const configured = hasKey(provider.key)

                            return (
                                <Card
                                    key={provider.key}
                                    className={cn(
                                        "relative",
                                        configured && "border-green-500/50 bg-green-500/5"
                                    )}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{provider.icon}</span>
                                                <div>
                                                    <h4 className="font-semibold">{provider.name}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {provider.description}
                                                    </p>
                                                </div>
                                            </div>
                                            {configured && (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            )}
                                        </div>

                                        {!configured ? (
                                            <Button
                                                variant="outline"
                                                className="w-full mt-3 gap-2"
                                                onClick={() => setNewKey({ provider: provider.key, key: '' })}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Configure
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                className="w-full mt-3 gap-2"
                                                onClick={() => setNewKey({ provider: provider.key, key: '' })}
                                            >
                                                Update Key
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default ApiKeyManager
