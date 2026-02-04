/**
 * GET /api/analytics/stats
 * Get dashboard statistics for the current user
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get workflow count
    const totalWorkflows = await db.workflows.count({
      where: { userId }
    })

    // Get active (published) workflow count
    const activeWorkflows = await db.workflows.count({
      where: { userId, publish: true }
    })

    // Get total executions this month
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const executionsThisMonth = await db.executionLog.count({
      where: {
        userId,
        startTime: {
          gte: firstOfMonth
        }
      }
    })

    // Get successful executions this month
    const successfulExecutions = await db.executionLog.count({
      where: {
        userId,
        status: 'completed',
        startTime: {
          gte: firstOfMonth
        }
      }
    })

    // Get connection count
    const totalConnections = await db.connections.count({
      where: { userId }
    })

    // Get total cost this month
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const costTracking = await db.costTracking.findUnique({
      where: {
        userId_month: {
          userId,
          month: currentMonth
        }
      }
    })

    // Get user tier info
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { tier: true, credits: true }
    })

    // Calculate success rate
    const successRate = executionsThisMonth > 0 
      ? Math.round((successfulExecutions / executionsThisMonth) * 100) 
      : 100

    return NextResponse.json({
      stats: {
        totalWorkflows,
        activeWorkflows,
        executionsThisMonth,
        successfulExecutions,
        successRate,
        totalConnections,
        totalCostThisMonth: costTracking?.totalCost || 0,
        tier: user?.tier || 'Free',
        credits: user?.credits || 0
      }
    })
  } catch (error) {
    console.error('[Analytics Stats GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
