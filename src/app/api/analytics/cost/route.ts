/**
 * GET /api/analytics/cost
 * Get cost analytics for current user
 * 
 * Query params:
 * - period: "week" | "month" | "year"
 * - startDate: ISO date string
 * - endDate: ISO date string
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { safeParseJson, ExecutionMetricsSchema } from '@/lib/validation-schemas'

interface CostBreakdown {
  provider: string
  cost: number
  percentage: number
  executions: number
}

interface DailyTrend {
  date: string
  cost: number
  executions: number
}

interface WorkflowCost {
  workflowId: string
  workflowName: string
  totalCost: number
  executions: number
  avgCostPerRun: number
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Calculate date range
    let startDate: Date
    let endDate = new Date()

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      switch (period) {
        case 'week':
          startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'year':
          startDate = new Date()
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
        case 'month':
        default:
          startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 1)
          break
      }
    }

    // Get execution logs for the period
    const executionLogs = await db.executionLog.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    // Calculate total cost
    const totalCost = executionLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0)

    // Calculate cost breakdown by provider (from metrics JSON)
    const providerCosts: Record<string, { cost: number; executions: number }> = {}
    
    executionLogs.forEach(log => {
      const logWithMetrics = log as typeof log & { metrics?: string }
      const metrics = safeParseJson(ExecutionMetricsSchema, logWithMetrics.metrics)
      
      if (metrics?.costByProvider) {
        Object.entries(metrics.costByProvider).forEach(([provider, cost]) => {
          if (!providerCosts[provider]) {
            providerCosts[provider] = { cost: 0, executions: 0 }
          }
          providerCosts[provider].cost += cost as number
          providerCosts[provider].executions += 1
        })
      }
    })

    // If no provider breakdown, estimate based on total
    if (Object.keys(providerCosts).length === 0 && totalCost > 0) {
      providerCosts['unknown'] = { cost: totalCost, executions: executionLogs.length }
    }

    const breakdown: CostBreakdown[] = Object.entries(providerCosts).map(([provider, data]) => ({
      provider,
      cost: Math.round(data.cost * 1000) / 1000,
      percentage: totalCost > 0 ? Math.round((data.cost / totalCost) * 100) : 0,
      executions: data.executions
    })).sort((a, b) => b.cost - a.cost)

    // Calculate daily trend
    const dailyCosts: Record<string, { cost: number; executions: number }> = {}
    
    executionLogs.forEach(log => {
      const dateKey = log.startTime.toISOString().split('T')[0]
      if (!dailyCosts[dateKey]) {
        dailyCosts[dateKey] = { cost: 0, executions: 0 }
      }
      dailyCosts[dateKey].cost += log.totalCost || 0
      dailyCosts[dateKey].executions += 1
    })

    const trend: DailyTrend[] = Object.entries(dailyCosts)
      .map(([date, data]) => ({
        date,
        cost: Math.round(data.cost * 1000) / 1000,
        executions: data.executions
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Calculate workflow costs
    const workflowCosts: Record<string, { name: string; cost: number; executions: number }> = {}
    
    executionLogs.forEach(log => {
      if (!workflowCosts[log.workflowId]) {
        workflowCosts[log.workflowId] = {
          name: log.workflow.name,
          cost: 0,
          executions: 0
        }
      }
      workflowCosts[log.workflowId].cost += log.totalCost || 0
      workflowCosts[log.workflowId].executions += 1
    })

    const topWorkflows: WorkflowCost[] = Object.entries(workflowCosts)
      .map(([workflowId, data]) => ({
        workflowId,
        workflowName: data.name,
        totalCost: Math.round(data.cost * 1000) / 1000,
        executions: data.executions,
        avgCostPerRun: data.executions > 0 
          ? Math.round((data.cost / data.executions) * 10000) / 10000 
          : 0
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10)

    // Get current month's cost tracking
    const currentMonth = new Date().toISOString().slice(0, 7)
    const costTracking = await db.costTracking.findUnique({
      where: {
        userId_month: {
          userId,
          month: currentMonth
        }
      }
    })

    return NextResponse.json({
      total: Math.round(totalCost * 1000) / 1000,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      breakdown,
      trend,
      topWorkflows,
      executions: executionLogs.length,
      budget: {
        limit: costTracking?.limit || 50,
        used: costTracking?.totalCost || totalCost,
        remaining: (costTracking?.limit || 50) - (costTracking?.totalCost || totalCost),
        percentage: ((costTracking?.totalCost || totalCost) / (costTracking?.limit || 50)) * 100
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Analytics Cost] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch cost analytics' },
      { status: 500 }
    )
  }
}
