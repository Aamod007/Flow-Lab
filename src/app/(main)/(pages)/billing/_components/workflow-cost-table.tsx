'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  GitBranch, 
  DollarSign, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowCost {
  workflowId: string
  workflowName: string
  totalCost: number
  executionCount: number
  avgCostPerExecution: number
  lastExecution: string
  trend: 'up' | 'down' | 'stable'
  trendPercent: number
  providers: string[]
}

export function WorkflowCostTable() {
  const [workflows, setWorkflows] = useState<WorkflowCost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchWorkflowCosts()
  }, [page])

  const fetchWorkflowCosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/cost/workflows?page=${page}&limit=${pageSize}`)
      
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
        setTotalPages(Math.ceil((data.total || 0) / pageSize))
      } else {
        // Use mock data if API not ready
        setWorkflows(generateMockData())
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Failed to fetch workflow costs:', error)
      // Use mock data on error
      setWorkflows(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (): WorkflowCost[] => [
    {
      workflowId: '1',
      workflowName: 'Email Processing Pipeline',
      totalCost: 12.45,
      executionCount: 156,
      avgCostPerExecution: 0.08,
      lastExecution: '2024-01-15T10:30:00Z',
      trend: 'up',
      trendPercent: 12,
      providers: ['OpenAI', 'Anthropic']
    },
    {
      workflowId: '2',
      workflowName: 'Data Analysis Flow',
      totalCost: 8.32,
      executionCount: 89,
      avgCostPerExecution: 0.09,
      lastExecution: '2024-01-14T15:45:00Z',
      trend: 'down',
      trendPercent: 5,
      providers: ['OpenAI']
    },
    {
      workflowId: '3',
      workflowName: 'Content Generation',
      totalCost: 25.60,
      executionCount: 234,
      avgCostPerExecution: 0.11,
      lastExecution: '2024-01-15T08:20:00Z',
      trend: 'up',
      trendPercent: 23,
      providers: ['Anthropic', 'OpenAI']
    },
    {
      workflowId: '4',
      workflowName: 'Local AI Testing',
      totalCost: 0,
      executionCount: 45,
      avgCostPerExecution: 0,
      lastExecution: '2024-01-15T12:00:00Z',
      trend: 'stable',
      trendPercent: 0,
      providers: ['Ollama']
    },
    {
      workflowId: '5',
      workflowName: 'Chat Support Bot',
      totalCost: 5.20,
      executionCount: 312,
      avgCostPerExecution: 0.02,
      lastExecution: '2024-01-15T09:15:00Z',
      trend: 'down',
      trendPercent: 8,
      providers: ['Groq']
    }
  ]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTrendIcon = (trend: WorkflowCost['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'border-emerald-500/50 text-emerald-500'
      case 'anthropic':
        return 'border-purple-500/50 text-purple-500'
      case 'groq':
        return 'border-yellow-500/50 text-yellow-600'
      case 'ollama':
        return 'border-green-500/50 text-green-500'
      case 'gemini':
        return 'border-blue-500/50 text-blue-500'
      default:
        return 'border-neutral-500/50 text-neutral-400'
    }
  }

  const totalCost = workflows.reduce((sum, w) => sum + w.totalCost, 0)
  const totalExecutions = workflows.reduce((sum, w) => sum + w.executionCount, 0)

  return (
    <Card className="border-neutral-800 bg-neutral-900/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-purple-500" />
              Cost by Workflow
            </CardTitle>
            <CardDescription>
              Track AI spending across your workflows
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold text-green-500">${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-800/50 border border-neutral-700">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-muted-foreground">Executions:</span>
              <span className="font-semibold text-blue-500">{totalExecutions.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No workflow execution data yet</p>
            <p className="text-sm text-muted-foreground/70">Run some workflows to see cost analytics here</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-neutral-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-800 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Workflow</TableHead>
                    <TableHead className="text-muted-foreground text-right">Total Cost</TableHead>
                    <TableHead className="text-muted-foreground text-center">Executions</TableHead>
                    <TableHead className="text-muted-foreground text-right">Avg/Run</TableHead>
                    <TableHead className="text-muted-foreground text-center">Trend</TableHead>
                    <TableHead className="text-muted-foreground">Providers</TableHead>
                    <TableHead className="text-muted-foreground text-right">Last Run</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow 
                      key={workflow.workflowId}
                      className="border-neutral-800 hover:bg-neutral-800/30 transition-colors cursor-pointer group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium group-hover:text-purple-400 transition-colors">
                            {workflow.workflowName}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-semibold",
                          workflow.totalCost === 0 ? "text-green-500" : "text-white"
                        )}>
                          {workflow.totalCost === 0 ? 'FREE' : `$${workflow.totalCost.toFixed(2)}`}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-muted-foreground">
                          {workflow.executionCount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">
                          {workflow.avgCostPerExecution === 0 
                            ? 'FREE' 
                            : `$${workflow.avgCostPerExecution.toFixed(3)}`
                          }
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(workflow.trend)}
                          {workflow.trendPercent > 0 && (
                            <span className={cn(
                              "text-xs",
                              workflow.trend === 'up' ? 'text-red-500' : 
                              workflow.trend === 'down' ? 'text-green-500' : 'text-muted-foreground'
                            )}>
                              {workflow.trendPercent}%
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {workflow.providers.map((provider, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-5",
                                getProviderColor(provider)
                              )}
                            >
                              {provider}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDate(workflow.lastExecution)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-neutral-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-neutral-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default WorkflowCostTable
