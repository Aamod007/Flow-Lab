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

    // Get user from database (with fallback for missing clerkId column)
    let dbUser
    try {
      dbUser = await db.user.findUnique({
        where: { clerkId: userId }
      })
    } catch (error) {
      // Database might not have clerkId column yet - return default stats
      console.warn('Database query failed, returning default stats:', error)
      return NextResponse.json({
        stats: {
          totalWorkflows: 0,
          activeWorkflows: 0,
          executionsThisMonth: 0,
          successfulExecutions: 0,
          successRate: 100,
          totalConnections: 0,
          totalCostThisMonth: 0,
          tier: 'Free',
          credits: 10
        }
      })
    }

    if (!dbUser) {
      // User not in database yet
      return NextResponse.json({
        stats: {
          totalWorkflows: 0,
          activeWorkflows: 0,
          executionsThisMonth: 0,
          successfulExecutions: 0,
          successRate: 100,
          totalConnections: 0,
          totalCostThisMonth: 0,
          tier: 'Free',
          credits: 10
        }
      })
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
        tier: dbUser?.tier || 'Free',
        credits: dbUser?.credits || 10
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
