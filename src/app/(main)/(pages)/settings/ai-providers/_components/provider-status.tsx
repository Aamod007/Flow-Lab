'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Cloud,
    Cpu,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw,
    TrendingUp,
    DollarSign,
    Zap,
    AlertCircle,
    ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getOllamaClient, getOllamaSettings } from '@/lib/ollama-client'
import { getAIStats, formatCost, formatTokens } from '@/lib/ai-cost-tracking'
import Link from 'next/link'

interface ProviderStatus {
    name: string
    key: string
    icon: string
    status: 'connected' | 'disconnected' | 'checking' | 'not_configured'
    models?: string[]
    isFree?: boolean
    isLocal?: boolean
}

const ProviderStatus: React.FC = () => {
    const [providers, setProviders] = useState<ProviderStatus[]>([
        { name: 'Ollama', key: 'ollama', icon: '🦙', status: 'checking', isLocal: true, isFree: true },
        { name: 'OpenAI', key: 'openai', icon: '🤖', status: 'checking' },
        { name: 'Google Gemini', key: 'gemini', icon: '✨', status: 'checking', isFree: true },
        { name: 'Anthropic', key: 'anthropic', icon: '🧠', status: 'checking' },
        { name: 'Groq', key: 'groq', icon: '⚡', status: 'checking', isFree: true }
    ])
    const [stats, setStats] = useState(getAIStats())
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Check provider statuses
    const checkProviders = async () => {
        setIsRefreshing(true)
        const updated = [...providers]

        // Check Ollama
        const ollamaSettings = getOllamaSettings()
        const ollamaClient = getOllamaClient(ollamaSettings.baseUrl)
        const ollamaResult = await ollamaClient.checkConnection()

        const ollamaIndex = updated.findIndex(p => p.key === 'ollama')
        if (ollamaIndex >= 0) {
            if (ollamaResult.connected) {
                const models = await ollamaClient.listModels()
                updated[ollamaIndex] = {
                    ...updated[ollamaIndex],
                    status: 'connected',
                    models: models.map(m => m.name)
                }
            } else {
                updated[ollamaIndex].status = 'disconnected'
            }
        }

        // Check API key providers
        const apiKeys = JSON.parse(localStorage.getItem('agentflow_api_keys') || '[]')

        for (const provider of updated) {
            if (provider.key === 'ollama') continue

            const hasKey = apiKeys.some((k: any) => k.provider === provider.key && k.isActive)
            provider.status = hasKey ? 'connected' : 'not_configured'
        }

        setProviders(updated)
        setStats(getAIStats())
        setIsRefreshing(false)
    }

    useEffect(() => {
        checkProviders()
    }, [])

    const getStatusBadge = (status: ProviderStatus['status']) => {
        switch (status) {
            case 'connected':
                return (
                    <Badge className="bg-green-500/10 text-green-500 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                    </Badge>
                )
            case 'disconnected':
                return (
                    <Badge className="bg-red-500/10 text-red-500 gap-1">
                        <XCircle className="h-3 w-3" />
                        Disconnected
                    </Badge>
                )
            case 'checking':
                return (
                    <Badge className="bg-blue-500/10 text-blue-500 gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Checking
                    </Badge>
                )
            case 'not_configured':
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-500 gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Not Configured
                    </Badge>
                )
        }
    }

    const connectedCount = providers.filter(p => p.status === 'connected').length
    const freeProviders = providers.filter(p => p.isFree && p.status === 'connected')

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Cloud className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Providers</p>
                            <p className="text-2xl font-bold">{connectedCount}/{providers.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <DollarSign className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Spent</p>
                            <p className="text-2xl font-bold">{formatCost(stats.estimatedCost)}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <Zap className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tokens Used</p>
                            <p className="text-2xl font-bold">{formatTokens(stats.tokensUsed)}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/10">
                            <TrendingUp className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Saved (Local)</p>
                            <p className="text-2xl font-bold text-green-500">
                                {formatCost(stats.savedByLocal)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Free Providers Highlight */}
            {freeProviders.length > 0 && (
                <Card className="border-green-500/50 bg-green-500/5">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="font-medium">
                                    {freeProviders.length} free provider{freeProviders.length > 1 ? 's' : ''} available
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {freeProviders.map(p => p.name).join(', ')}
                                </p>
                            </div>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500">
                            $0.00/request
                        </Badge>
                    </CardContent>
                </Card>
            )}

            {/* Provider List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>AI Providers</CardTitle>
                        <CardDescription>
                            Status of your configured AI providers
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={checkProviders}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {providers.map((provider) => (
                            <div
                                key={provider.key}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-lg border",
                                    provider.status === 'connected' && "border-green-500/30 bg-green-500/5",
                                    provider.status === 'disconnected' && "border-red-500/30 bg-red-500/5"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">{provider.icon}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{provider.name}</p>
                                            {provider.isLocal && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Cpu className="h-3 w-3 mr-1" />
                                                    Local
                                                </Badge>
                                            )}
                                            {provider.isFree && (
                                                <Badge variant="outline" className="text-xs text-green-500">
                                                    FREE
                                                </Badge>
                                            )}
                                        </div>
                                        {provider.models && provider.models.length > 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                {provider.models.length} model{provider.models.length > 1 ? 's' : ''} available
                                            </p>
                                        )}
                                        {stats.executionsByProvider[provider.name] && (
                                            <p className="text-xs text-muted-foreground">
                                                {stats.executionsByProvider[provider.name]} executions
                                                {stats.costByProvider[provider.name] > 0 && (
                                                    <> • {formatCost(stats.costByProvider[provider.name])}</>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(provider.status)}
                                    {provider.status !== 'connected' && (
                                        <Link href={`/settings/ai-providers?tab=${provider.isLocal ? 'ollama' : 'api-keys'}`}>
                                            <Button variant="outline" size="sm" className="gap-1">
                                                Configure
                                                <ArrowRight className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Cpu className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="font-medium">Run AI Locally</p>
                                    <p className="text-sm text-muted-foreground">
                                        Set up Ollama for free local AI
                                    </p>
                                </div>
                            </div>
                            <Link href="/settings/ai-providers?tab=ollama">
                                <Button variant="outline" className="gap-2">
                                    <ArrowRight className="h-4 w-4" />
                                    Setup
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-8 w-8 text-green-500" />
                                <div>
                                    <p className="font-medium">Optimize Costs</p>
                                    <p className="text-sm text-muted-foreground">
                                        Get recommendations to save money
                                    </p>
                                </div>
                            </div>
                            <Link href="/billing">
                                <Button variant="outline" className="gap-2">
                                    <ArrowRight className="h-4 w-4" />
                                    View
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ProviderStatus
