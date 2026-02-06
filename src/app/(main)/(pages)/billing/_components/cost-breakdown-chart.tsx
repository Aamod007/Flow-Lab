'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Zap, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { safeParseApiResponse, CostDataSchema, type CostData } from '@/lib/validation-schemas'

// Provider colors for consistent theming
const PROVIDER_COLORS: Record<string, string> = {
  gemini: 'bg-blue-500',
  openai: 'bg-purple-500',
  anthropic: 'bg-orange-500',
  groq: 'bg-yellow-500',
  ollama: 'bg-green-500',
  unknown: 'bg-gray-500'
}

const PROVIDER_TEXT_COLORS: Record<string, string> = {
  gemini: 'text-blue-500',
  openai: 'text-purple-500',
  anthropic: 'text-orange-500',
  groq: 'text-yellow-500',
  ollama: 'text-green-500',
  unknown: 'text-gray-500'
}

export function CostBreakdownChart() {
  const [data, setData] = useState<CostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCostData()
  }, [period])

  const fetchCostData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/analytics/cost?period=${period}`)
      
      const result = await safeParseApiResponse(CostDataSchema, response)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cost data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-neutral-800 bg-neutral-900/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-neutral-800 bg-neutral-900/50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Activity className="h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const maxTrendCost = Math.max(...data.trend.map(d => d.cost), 0.01)

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Cost Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track your AI spending across providers
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList className="bg-neutral-800">
            <TabsTrigger value="week">7 Days</TabsTrigger>
            <TabsTrigger value="month">30 Days</TabsTrigger>
            <TabsTrigger value="year">1 Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Spent</span>
            </div>
            <p className="text-2xl font-bold">${data.total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">This {period}</p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Executions</span>
            </div>
            <p className="text-2xl font-bold">{data.executions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              ${data.executions > 0 ? (data.total / data.executions).toFixed(4) : '0'} avg/run
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Budget Used</span>
            </div>
            <p className="text-2xl font-bold">{data.budget.percentage.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">
              ${data.budget.remaining.toFixed(2)} remaining
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Providers</span>
            </div>
            <p className="text-2xl font-bold">{data.breakdown.length}</p>
            <p className="text-xs text-muted-foreground">Active AI providers</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Breakdown */}
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-500" />
              Cost by Provider
            </CardTitle>
            <CardDescription>Distribution across AI providers</CardDescription>
          </CardHeader>
          <CardContent>
            {data.breakdown.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>No cost data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Simple bar chart */}
                {data.breakdown.map((item) => (
                  <div key={item.provider} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          PROVIDER_COLORS[item.provider.toLowerCase()] || PROVIDER_COLORS.unknown
                        )} />
                        <span className="capitalize">{item.provider}</span>
                        {item.provider.toLowerCase() === 'ollama' && (
                          <Badge variant="secondary" className="text-xs">FREE</Badge>
                        )}
                      </div>
                      <span className="font-medium">${item.cost.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          PROVIDER_COLORS[item.provider.toLowerCase()] || PROVIDER_COLORS.unknown
                        )}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.executions} executions ({item.percentage}%)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Daily Spending
            </CardTitle>
            <CardDescription>Cost trend over time</CardDescription>
          </CardHeader>
          <CardContent>
            {data.trend.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>No trend data available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Simple line chart representation */}
                <div className="flex items-end gap-1 h-32">
                  {data.trend.slice(-14).map((day, i) => (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full bg-purple-500/80 rounded-t hover:bg-purple-500 transition-colors cursor-pointer"
                        style={{ 
                          height: `${Math.max((day.cost / maxTrendCost) * 100, 2)}%`,
                          minHeight: '4px'
                        }}
                        title={`${day.date}: $${day.cost.toFixed(3)} (${day.executions} runs)`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>{data.trend.length > 0 && data.trend[0]?.date ? data.trend[0].date.split('-').slice(1).join('/') : ''}</span>
                  <span>{data.trend.length > 0 && data.trend[data.trend.length - 1]?.date ? data.trend[data.trend.length - 1].date.split('-').slice(1).join('/') : ''}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Workflows Table */}
      <Card className="border-neutral-800 bg-neutral-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Most Expensive Workflows</CardTitle>
          <CardDescription>Workflows ranked by total cost</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topWorkflows.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <p>No workflow data available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.topWorkflows.slice(0, 5).map((workflow, index) => (
                <div
                  key={workflow.workflowId}
                  className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{workflow.workflowName}</p>
                      <p className="text-xs text-muted-foreground">
                        {workflow.executions} executions • ${workflow.avgCostPerRun.toFixed(4)} avg
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${workflow.totalCost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CostBreakdownChart
