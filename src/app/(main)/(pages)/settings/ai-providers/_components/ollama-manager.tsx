'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    Cpu,
    Download,
    Trash2,
    Play,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Loader2,
    HardDrive,
    Clock,
    Zap,
    Settings,
    ExternalLink,
    AlertCircle,
    Pause
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    getOllamaClient,
    OllamaModel,
    OLLAMA_AVAILABLE_MODELS,
    OllamaModelInfo,
    PullProgress,
    getOllamaSettings,
    saveOllamaSettings,
    getModelUsage
} from '@/lib/ollama-client'

interface DownloadState {
    modelName: string
    progress: number
    status: string
    speed?: string
}

const OllamaManager: React.FC = () => {
    const [isConnected, setIsConnected] = useState<boolean | null>(null)
    const [version, setVersion] = useState<string>('')
    const [installedModels, setInstalledModels] = useState<OllamaModel[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [downloadState, setDownloadState] = useState<DownloadState | null>(null)
    const [settings, setSettings] = useState(getOllamaSettings())
    const [modelUsage, setModelUsage] = useState<Record<string, any>>({})

    const ollamaClient = getOllamaClient(settings.baseUrl)

    // Check connection and load models
    const checkConnection = useCallback(async () => {
        setIsLoading(true)
        const result = await ollamaClient.checkConnection()
        setIsConnected(result.connected)
        setVersion(result.version || '')

        if (result.connected) {
            const models = await ollamaClient.listModels()
            setInstalledModels(models)
        }

        setIsLoading(false)
    }, [ollamaClient])

    useEffect(() => {
        checkConnection()
        setModelUsage(getModelUsage())
    }, [checkConnection])

    // Download a model
    const handleDownload = async (modelName: string) => {
        setDownloadState({
            modelName,
            progress: 0,
            status: 'Starting download...'
        })

        try {
            await ollamaClient.pullModel(modelName, (progress) => {
                setDownloadState({
                    modelName,
                    progress: progress.percent || 0,
                    status: progress.status,
                    speed: progress.completed && progress.total
                        ? `${((progress.completed / progress.total) * 100).toFixed(0)}%`
                        : undefined
                })
            })

            toast.success(`${modelName} downloaded successfully!`)
            checkConnection() // Refresh model list
        } catch (error) {
            toast.error(`Failed to download ${modelName}`)
        } finally {
            setDownloadState(null)
        }
    }

    // Delete a model
    const handleDelete = async (modelName: string) => {
        if (!confirm(`Are you sure you want to delete ${modelName}?`)) return

        const success = await ollamaClient.deleteModel(modelName)
        if (success) {
            toast.success(`${modelName} deleted`)
            checkConnection()
        } else {
            toast.error(`Failed to delete ${modelName}`)
        }
    }

    // Update Ollama URL
    const handleUpdateUrl = (url: string) => {
        const newSettings = { ...settings, baseUrl: url }
        setSettings(newSettings)
        saveOllamaSettings(newSettings)
    }

    // Get model info from our predefined list
    const getModelInfo = (name: string): OllamaModelInfo | undefined => {
        return OLLAMA_AVAILABLE_MODELS.find(m =>
            name.startsWith(m.name.split(':')[0])
        )
    }

    // Format file size
    const formatSize = (bytes: number): string => {
        const gb = bytes / (1024 * 1024 * 1024)
        if (gb >= 1) return `${gb.toFixed(1)} GB`
        const mb = bytes / (1024 * 1024)
        return `${mb.toFixed(0)} MB`
    }

    // Get usage info for a model
    const getUsageInfo = (modelName: string) => {
        const usage = modelUsage[modelName]
        if (!usage) return null
        return {
            lastUsed: new Date(usage.lastUsed).toLocaleDateString(),
            totalRuns: usage.totalRuns
        }
    }

    return (
        <div className="space-y-6">
            {/* Connection Status Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-lg",
                                isConnected ? "bg-green-500/10" : "bg-red-500/10"
                            )}>
                                <Cpu className={cn(
                                    "h-5 w-5",
                                    isConnected ? "text-green-500" : "text-red-500"
                                )} />
                            </div>
                            <div>
                                <CardTitle>Ollama Local Server</CardTitle>
                                <CardDescription>
                                    Run AI models locally on your machine
                                </CardDescription>
                            </div>
                        </div>
                        <Badge className={cn(
                            "gap-1",
                            isConnected
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                        )}>
                            {isLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isConnected ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <XCircle className="h-3 w-3" />
                            )}
                            {isConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isConnected && (
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">Version:</span>
                            <Badge variant="outline">{version || 'Unknown'}</Badge>
                            <span className="text-muted-foreground">Models:</span>
                            <Badge variant="outline">{installedModels.length}</Badge>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Label htmlFor="ollama-url">Server URL</Label>
                            <Input
                                id="ollama-url"
                                value={settings.baseUrl}
                                onChange={(e) => handleUpdateUrl(e.target.value)}
                                placeholder="http://localhost:11434"
                                className="mt-1"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={checkConnection}
                            disabled={isLoading}
                            className="mt-6 gap-2"
                        >
                            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                            Test
                        </Button>
                    </div>

                    {!isConnected && !isLoading && (
                        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Ollama not detected</p>
                                <p className="text-sm text-muted-foreground">
                                    Install Ollama to run AI models locally for FREE.
                                </p>
                                <Button variant="outline" size="sm" className="gap-2" asChild>
                                    <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                        Download Ollama
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Download Progress */}
            {downloadState && (
                <Card className="border-blue-500/50 bg-blue-500/5">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                <span className="font-medium">Downloading {downloadState.modelName}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {downloadState.progress}%
                            </span>
                        </div>
                        <Progress value={downloadState.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {downloadState.status}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Installed Models */}
            {isConnected && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5" />
                            Installed Models ({installedModels.length})
                        </CardTitle>
                        <CardDescription>
                            Models ready to use in your workflows
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {installedModels.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Cpu className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>No models installed yet</p>
                                <p className="text-sm">Download a model below to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {installedModels.map((model) => {
                                    const info = getModelInfo(model.name)
                                    const usage = getUsageInfo(model.name)

                                    return (
                                        <div
                                            key={model.name}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-lg bg-primary/10">
                                                    <Cpu className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{model.name}</p>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                        <span>{formatSize(parseInt(model.size) || 0)}</span>
                                                        {usage && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {usage.lastUsed}
                                                                </span>
                                                            </>
                                                        )}
                                                        {info && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Zap className="h-3 w-3" />
                                                                    ~{info.performance.tokensPerSec} tok/s
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-green-500">
                                                    FREE
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(model.name)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Available Models */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Available Models
                    </CardTitle>
                    <CardDescription>
                        Popular models you can download and run locally
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {OLLAMA_AVAILABLE_MODELS.map((model) => {
                            const isInstalled = installedModels.some(m =>
                                m.name.startsWith(model.name.split(':')[0])
                            )
                            const isDownloading = downloadState?.modelName === model.name

                            return (
                                <Card
                                    key={model.name}
                                    className={cn(
                                        "relative overflow-hidden",
                                        isInstalled && "border-green-500/50 bg-green-500/5"
                                    )}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-semibold">{model.name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {model.description}
                                                </p>
                                            </div>
                                            {isInstalled && (
                                                <Badge className="bg-green-500/10 text-green-500">
                                                    Installed
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {model.capabilities.map((cap) => (
                                                <Badge
                                                    key={cap}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {cap}
                                                </Badge>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                                            <span className="flex items-center gap-1">
                                                <HardDrive className="h-3 w-3" />
                                                {model.size}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Zap className="h-3 w-3" />
                                                ~{model.performance.tokensPerSec} tok/s
                                            </span>
                                        </div>

                                        {!isInstalled && (
                                            <Button
                                                className="w-full gap-2"
                                                onClick={() => handleDownload(model.name)}
                                                disabled={!isConnected || isDownloading || !!downloadState}
                                            >
                                                {isDownloading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Downloading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-4 w-4" />
                                                        Download
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        {isInstalled && (
                                            <Button
                                                variant="outline"
                                                className="w-full gap-2"
                                                disabled
                                            >
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                Ready to Use
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

export default OllamaManager
