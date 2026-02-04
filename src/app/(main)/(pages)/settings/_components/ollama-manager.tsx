'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
    Server,
    Download,
    Trash2,
    RefreshCw,
    CheckCircle,
    XCircle,
    HardDrive,
    Cpu,
    Clock,
    Search,
    ExternalLink,
    Loader2,
    AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface OllamaModel {
    name: string
    size: string
    sizeBytes: number
    modified: string
    digest: string
    details?: {
        family: string
        parameter_size: string
        quantization_level: string
    }
}

interface PopularModel {
    name: string
    description: string
    size: string
    stars: number
    tags: string[]
}

const POPULAR_MODELS: PopularModel[] = [
    {
        name: 'llama3:8b',
        description: 'Meta\'s most capable openly available LLM',
        size: '4.7 GB',
        stars: 5,
        tags: ['General', 'Fast']
    },
    {
        name: 'llama3:70b',
        description: 'Meta\'s most powerful Llama 3 model',
        size: '40 GB',
        stars: 5,
        tags: ['Best Quality', 'Heavy']
    },
    {
        name: 'mistral:7b',
        description: 'Excellent for analysis and creative tasks',
        size: '4.1 GB',
        stars: 5,
        tags: ['Analysis', 'Creative']
    },
    {
        name: 'codellama:13b',
        description: 'Specialized for code generation',
        size: '7.4 GB',
        stars: 4,
        tags: ['Code', 'Programming']
    },
    {
        name: 'phi3:mini',
        description: 'Microsoft\'s compact but capable model',
        size: '2.3 GB',
        stars: 4,
        tags: ['Fast', 'Lightweight']
    },
    {
        name: 'gemma:7b',
        description: 'Google\'s open model for text tasks',
        size: '5.0 GB',
        stars: 4,
        tags: ['Google', 'General']
    },
    {
        name: 'qwen2:7b',
        description: 'Alibaba\'s multilingual model',
        size: '4.4 GB',
        stars: 4,
        tags: ['Multilingual', 'General']
    },
    {
        name: 'deepseek-coder:6.7b',
        description: 'Excellent for code completion and generation',
        size: '3.8 GB',
        stars: 4,
        tags: ['Code', 'Fast']
    }
]

const OllamaManager = () => {
    const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
    const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
    const [installedModels, setInstalledModels] = useState<OllamaModel[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [downloadingModel, setDownloadingModel] = useState<string | null>(null)
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')

    // Check Ollama connection
    const checkOllamaConnection = useCallback(async () => {
        setOllamaStatus('checking')
        try {
            const response = await fetch(`${ollamaUrl}/api/tags`, {
                method: 'GET',
            })

            if (response.ok) {
                const data = await response.json()
                setOllamaStatus('connected')
                if (data.models) {
                    setInstalledModels(data.models.map((m: any) => ({
                        name: m.name,
                        size: formatBytes(m.size),
                        sizeBytes: m.size,
                        modified: new Date(m.modified_at).toLocaleDateString(),
                        digest: m.digest,
                        details: m.details
                    })))
                }
                return true
            } else {
                setOllamaStatus('disconnected')
                return false
            }
        } catch (error) {
            setOllamaStatus('disconnected')
            return false
        }
    }, [ollamaUrl])

    useEffect(() => {
        // Load saved URL
        const savedUrl = localStorage.getItem('flowlab_ollama_url')
        if (savedUrl) {
            setOllamaUrl(savedUrl)
        }
        checkOllamaConnection()
    }, [checkOllamaConnection])

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const downloadModel = async (modelName: string) => {
        if (ollamaStatus !== 'connected') {
            toast.error('Ollama is not connected')
            return
        }

        setDownloadingModel(modelName)
        setDownloadProgress(0)

        try {
            const response = await fetch(`${ollamaUrl}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName, stream: false })
            })

            if (!response.ok) {
                throw new Error('Failed to start download')
            }

            // Simulate progress for non-streaming response
            // In production, you'd use streaming to track actual progress
            const progressInterval = setInterval(() => {
                setDownloadProgress(prev => {
                    if (prev >= 95) {
                        clearInterval(progressInterval)
                        return prev
                    }
                    return prev + Math.random() * 10
                })
            }, 500)

            await response.json()
            clearInterval(progressInterval)
            setDownloadProgress(100)

            toast.success(`${modelName} downloaded successfully!`)
            await checkOllamaConnection() // Refresh model list

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to download model'
            toast.error(errorMessage)
        } finally {
            setDownloadingModel(null)
            setDownloadProgress(0)
        }
    }

    const deleteModel = async (modelName: string) => {
        if (ollamaStatus !== 'connected') {
            toast.error('Ollama is not connected')
            return
        }

        try {
            const response = await fetch(`${ollamaUrl}/api/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
            })

            if (!response.ok) {
                throw new Error('Failed to delete model')
            }

            toast.success(`${modelName} deleted successfully!`)
            await checkOllamaConnection() // Refresh model list

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete model'
            toast.error(errorMessage)
        }
    }

    const saveOllamaUrl = () => {
        localStorage.setItem('flowlab_ollama_url', ollamaUrl)
        toast.success('Ollama URL saved')
        checkOllamaConnection()
    }

    const filteredPopularModels = POPULAR_MODELS.filter(
        model =>
            model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const isModelInstalled = (modelName: string) => {
        return installedModels.some(m => m.name === modelName || m.name.startsWith(modelName.split(':')[0]))
    }

    const totalStorageUsed = installedModels.reduce((acc, model) => acc + model.sizeBytes, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Ollama Local Models</h2>
                    <p className="text-muted-foreground">
                        Run AI models locally on your machine - 100% FREE
                    </p>
                </div>
                <Badge
                    variant={ollamaStatus === 'connected' ? 'default' : 'destructive'}
                    className="flex items-center gap-1"
                >
                    {ollamaStatus === 'checking' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : ollamaStatus === 'connected' ? (
                        <CheckCircle className="h-3 w-3" />
                    ) : (
                        <XCircle className="h-3 w-3" />
                    )}
                    {ollamaStatus === 'checking'
                        ? 'Checking...'
                        : ollamaStatus === 'connected'
                            ? 'Connected'
                            : 'Disconnected'}
                </Badge>
            </div>

            {/* Connection Settings */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Connection Settings
                    </CardTitle>
                    <CardDescription>
                        Configure your local Ollama server connection
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            value={ollamaUrl}
                            onChange={(e) => setOllamaUrl(e.target.value)}
                            placeholder="http://localhost:11434"
                            className="flex-1"
                        />
                        <Button variant="outline" onClick={saveOllamaUrl}>
                            Save
                        </Button>
                        <Button variant="outline" onClick={checkOllamaConnection}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                    {ollamaStatus === 'disconnected' && (
                        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-destructive">Ollama Not Detected</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Make sure Ollama is installed and running. Ollama lets you run AI models locally for free.
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <a
                                            href="https://ollama.ai/download"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button size="sm" variant="outline">
                                                <Download className="h-4 w-4 mr-2" />
                                                Download Ollama
                                            </Button>
                                        </a>
                                        <a
                                            href="https://ollama.ai"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button size="sm" variant="ghost">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Learn More
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {ollamaStatus === 'connected' && (
                <>
                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Cpu className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{installedModels.length}</p>
                                    <p className="text-xs text-muted-foreground">Models Installed</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <HardDrive className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{formatBytes(totalStorageUsed)}</p>
                                    <p className="text-xs text-muted-foreground">Storage Used</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Clock className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">$0.00</p>
                                    <p className="text-xs text-muted-foreground">Cost (Always Free)</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Installed Models */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Your Models</CardTitle>
                            <CardDescription>
                                Models currently installed on your machine
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {installedModels.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No models installed yet</p>
                                    <p className="text-sm">Download a model below to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {installedModels.map((model) => (
                                        <div
                                            key={model.name}
                                            className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <Cpu className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{model.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {model.size} • Modified {model.modified}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {model.details?.parameter_size || 'Unknown'}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteModel(model.name)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Download Models */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Download Models</CardTitle>
                            <CardDescription>
                                Choose from popular open-source models
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search models..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {downloadingModel && (
                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Downloading {downloadingModel}...</span>
                                        <span className="text-sm text-muted-foreground">
                                            {Math.round(downloadProgress)}%
                                        </span>
                                    </div>
                                    <Progress value={downloadProgress} className="h-2" />
                                </div>
                            )}

                            <div className="grid gap-3 md:grid-cols-2">
                                {filteredPopularModels.map((model) => {
                                    const installed = isModelInstalled(model.name)
                                    const isDownloading = downloadingModel === model.name

                                    return (
                                        <div
                                            key={model.name}
                                            className={`p-4 rounded-lg border transition-all ${installed
                                                ? 'bg-green-500/5 border-green-500/30'
                                                : 'bg-secondary/30 border-transparent hover:border-primary/30'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">{model.name}</h4>
                                                        {installed && (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {model.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {model.size}
                                                        </Badge>
                                                        {model.tags.map((tag) => (
                                                            <Badge
                                                                key={tag}
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant={installed ? 'ghost' : 'outline'}
                                                    disabled={installed || isDownloading}
                                                    onClick={() => downloadModel(model.name)}
                                                >
                                                    {isDownloading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : installed ? (
                                                        'Installed'
                                                    ) : (
                                                        <>
                                                            <Download className="h-4 w-4 mr-1" />
                                                            Download
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                        <CardFooter className="text-xs text-muted-foreground">
                            Tip: Models run entirely on your machine. Larger models require more RAM and may be slower on CPU-only systems.
                        </CardFooter>
                    </Card>
                </>
            )}


        </div>
    )
}

export default OllamaManager
