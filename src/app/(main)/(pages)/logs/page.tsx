'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Activity,
    CheckCircle2,
    XCircle,
    Clock,
    GitBranch,
    RefreshCw,
    Filter,
    Download,
    Trash2,
    AlertCircle,
    Zap,
    ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWorkflowsFromStorage } from '@/lib/workflow-storage'
import Link from 'next/link'
import { toast } from 'sonner'

type LogEntry = {
    id: string
    workflowId: string
    workflowName: string
    status: 'success' | 'failed' | 'running' | 'pending'
    message: string
    timestamp: Date
    duration?: number
    triggeredBy: string
    tokens?: number
    cost?: string
}

type LogFilter = 'all' | 'success' | 'failed' | 'running'

// Generate mock log data based on stored workflows
const generateMockLogs = (workflows: any[]): LogEntry[] => {
    const statuses: LogEntry['status'][] = ['success', 'failed', 'running', 'pending']
    const triggers = ['Manual', 'Google Drive', 'Schedule', 'Webhook', 'AI Agent']
    const messages = {
        success: ['Workflow completed successfully', 'All nodes executed', 'Notification sent', 'AI generated response'],
        failed: ['Connection timeout', 'API rate limit exceeded', 'Invalid credentials', 'Context length exceeded'],
        running: ['Processing nodes...', 'Waiting for response...', 'Executing actions...', 'Generating tokens...'],
        pending: ['Waiting for trigger', 'Scheduled for execution', 'Queued'],
    }

    const logs: LogEntry[] = []
    const now = new Date()

    // Generate logs for each workflow
    workflows.forEach((workflow, wIndex) => {
        // Generate 1-5 logs per workflow
        const logCount = Math.floor(Math.random() * 5) + 1
        for (let i = 0; i < logCount; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)]
            const hoursAgo = Math.floor(Math.random() * 48)
            const isAI = Math.random() > 0.5
            const triggeredBy = isAI ? 'AI Agent' : triggers[Math.floor(Math.random() * triggers.length)]

            const tokens = status === 'success' && (triggeredBy === 'AI Agent' || Math.random() > 0.7)
                ? Math.floor(Math.random() * 2000) + 100
                : undefined

            // Mock cost calculation ($0.002 per 1k tokens avg)
            const cost = tokens && tokens > 0 ? `$${((tokens / 1000) * 0.002).toFixed(4)}` : undefined

            logs.push({
                id: `log-${workflow.id}-${i}`,
                workflowId: workflow.id,
                workflowName: workflow.name,
                status,
                message: messages[status][Math.floor(Math.random() * messages[status].length)],
                timestamp: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
                duration: status === 'success' ? Math.floor(Math.random() * 5000) + 500 : undefined,
                triggeredBy,
                tokens,
                cost
            })
        }
    })

    // Sort by timestamp descending (most recent first)
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

const getStatusConfig = (status: LogEntry['status']) => {
    switch (status) {
        case 'success':
            return {
                icon: CheckCircle2,
                color: 'text-green-500',
                bg: 'bg-green-500/10',
                label: 'Success',
            }
        case 'failed':
            return {
                icon: XCircle,
                color: 'text-red-500',
                bg: 'bg-red-500/10',
                label: 'Failed',
            }
        case 'running':
            return {
                icon: RefreshCw,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
                label: 'Running',
            }
        case 'pending':
            return {
                icon: Clock,
                color: 'text-orange-500',
                bg: 'bg-orange-500/10',
                label: 'Pending',
            }
    }
}

const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
}

const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
}

const LogsPage = () => {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [filter, setFilter] = useState<LogFilter>('all')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Load workflows and generate mock logs
        const workflows = getWorkflowsFromStorage()
        const generatedLogs = generateMockLogs(workflows)
        setLogs(generatedLogs)
        setIsLoading(false)
    }, [])

    const filteredLogs = filter === 'all'
        ? logs
        : logs.filter(log => log.status === filter)

    const stats = {
        total: logs.length,
        success: logs.filter(l => l.status === 'success').length,
        failed: logs.filter(l => l.status === 'failed').length,
        running: logs.filter(l => l.status === 'running').length,
    }

    const handleRefresh = () => {
        setIsLoading(true)
        const workflows = getWorkflowsFromStorage()
        const generatedLogs = generateMockLogs(workflows)
        setLogs(generatedLogs)
        setIsLoading(false)
        toast.success('Logs refreshed')
    }

    const handleClearLogs = () => {
        setLogs([])
        toast.success('Logs cleared')
    }

    const handleExport = () => {
        const data = JSON.stringify(logs, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `flowlab-logs-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Logs exported')
    }

    return (
        <div className="flex flex-col gap-4 relative">
            {/* Header */}
            <h1 className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center border-b">
                Logs
            </h1>

            <div className="p-6 flex flex-col gap-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Activity className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total Logs</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.success}</p>
                                <p className="text-xs text-muted-foreground">Successful</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10">
                                <XCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.failed}</p>
                                <p className="text-xs text-muted-foreground">Failed</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <RefreshCw className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.running}</p>
                                <p className="text-xs text-muted-foreground">Running</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === 'success' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('success')}
                            className={filter === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Success
                        </Button>
                        <Button
                            variant={filter === 'failed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('failed')}
                            className={filter === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            Failed
                        </Button>
                        <Button
                            variant={filter === 'running' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('running')}
                            className={filter === 'running' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Running
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-1" />
                            Export
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleClearLogs}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    </div>
                </div>

                {/* Logs List */}
                <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-primary" />
                            Execution Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredLogs.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground mb-4">No logs found</p>
                                <Link href="/workflows">
                                    <Button variant="outline" className="gap-2">
                                        Create a workflow
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredLogs.map((log) => {
                                    const config = getStatusConfig(log.status)
                                    const Icon = config.icon

                                    return (
                                        <div
                                            key={log.id}
                                            className={cn(
                                                'flex items-center gap-4 p-4 rounded-lg transition-all duration-200',
                                                'bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-muted-foreground/20'
                                            )}
                                        >
                                            {/* Status Icon */}
                                            <div className={cn('p-2 rounded-lg', config.bg)}>
                                                <Icon className={cn('h-5 w-5', config.color, log.status === 'running' && 'animate-spin')} />
                                            </div>

                                            {/* Log Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Link
                                                        href={`/workflows/editor/${log.workflowId}`}
                                                        className="font-medium hover:text-primary transition-colors"
                                                    >
                                                        {log.workflowName}
                                                    </Link>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {log.triggeredBy}
                                                    </Badge>
                                                    {log.tokens ? (
                                                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-600 bg-blue-50">
                                                            <Zap className="h-3 w-3 mr-1 fill-blue-600" />
                                                            {log.tokens} toks
                                                        </Badge>
                                                    ) : null}
                                                    {log.cost && (
                                                        <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                                                            {log.cost}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    {log.message}
                                                </p>
                                            </div>

                                            {/* Duration & Time */}
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm text-muted-foreground">
                                                    {formatTimeAgo(log.timestamp)}
                                                </p>
                                                {log.duration && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDuration(log.duration)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Status Badge */}
                                            <Badge
                                                variant="secondary"
                                                className={cn(config.bg, config.color, 'border-0')}
                                            >
                                                {config.label}
                                            </Badge>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default LogsPage
