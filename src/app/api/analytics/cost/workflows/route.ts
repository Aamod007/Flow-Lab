import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get user's workflows with cost data
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        workflows: {
          include: {
            executions: {
              select: {
                id: true,
                createdAt: true,
                status: true,
              },
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get cost tracking data grouped by workflow
    const costData = await db.costTracking.groupBy({
      by: ['workflowId'],
      _sum: {
        cost: true,
        tokensUsed: true
      },
      _count: {
        id: true
      },
      where: {
        userId: user.id
      }
    })

    // Create a map of workflow costs
    const costMap = new Map(
      costData.map(item => [
        item.workflowId,
        {
          totalCost: item._sum.cost || 0,
          totalTokens: item._sum.tokensUsed || 0,
          costEntries: item._count.id
        }
      ])
    )

    // Get cost tracking data for trend calculation (last 30 days vs previous 30 days)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const recentCosts = await db.costTracking.groupBy({
      by: ['workflowId'],
      _sum: { cost: true },
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    const previousCosts = await db.costTracking.groupBy({
      by: ['workflowId'],
      _sum: { cost: true },
      where: {
        userId: user.id,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      }
    })

    const recentCostMap = new Map(
      recentCosts.map(item => [item.workflowId, item._sum.cost || 0])
    )
    const previousCostMap = new Map(
      previousCosts.map(item => [item.workflowId, item._sum.cost || 0])
    )

    // Get unique providers per workflow from CostTracking
    const providerData = await db.costTracking.findMany({
      where: { userId: user.id },
      select: {
        workflowId: true,
        provider: true
      },
      distinct: ['workflowId', 'provider']
    })

    const providerMap = new Map<string, string[]>()
    providerData.forEach(item => {
      if (!item.workflowId) return
      const providers = providerMap.get(item.workflowId) || []
      if (!providers.includes(item.provider)) {
        providers.push(item.provider)
      }
      providerMap.set(item.workflowId, providers)
    })

    // Transform workflow data
    const workflows = user.workflows.map(workflow => {
      const costs = costMap.get(workflow.id) || { totalCost: 0, totalTokens: 0, costEntries: 0 }
      const executionCount = workflow.executions.length
      const lastExecution = workflow.executions.length > 0 && workflow.executions[0]?.createdAt 
        ? workflow.executions[0].createdAt 
        : workflow.updatedAt

      // Calculate trend
      const recent = recentCostMap.get(workflow.id) || 0
      const previous = previousCostMap.get(workflow.id) || 0
      
      let trend: 'up' | 'down' | 'stable' = 'stable'
      let trendPercent = 0
      
      if (previous > 0) {
        const change = ((recent - previous) / previous) * 100
        trendPercent = Math.abs(Math.round(change))
        if (change > 5) trend = 'up'
        else if (change < -5) trend = 'down'
      } else if (recent > 0) {
        trend = 'up'
        trendPercent = 100
      }

      const providers = providerMap.get(workflow.id) || []

      return {
        workflowId: workflow.id,
        workflowName: workflow.name,
        totalCost: costs.totalCost,
        executionCount,
        avgCostPerExecution: executionCount > 0 ? costs.totalCost / executionCount : 0,
        lastExecution: lastExecution.toISOString(),
        trend,
        trendPercent,
        providers: providers.length > 0 ? providers : ['None']
      }
    })

    // Sort by total cost descending and paginate
    workflows.sort((a, b) => b.totalCost - a.totalCost)
    const paginatedWorkflows = workflows.slice(offset, offset + limit)

    return NextResponse.json({
      workflows: paginatedWorkflows,
      total: workflows.length,
      page,
      limit
    })

  } catch (error) {
    console.error('Failed to fetch workflow costs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflow costs' },
      { status: 500 }
    )
  }
}
