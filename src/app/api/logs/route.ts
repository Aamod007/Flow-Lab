/**
 * GET /api/logs
 * Get execution logs for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

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
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const workflowId = searchParams.get('workflowId')
    const status = searchParams.get('status')

    // Build where clause
    const where: Record<string, unknown> = { userId }
    
    if (workflowId) {
      where.workflowId = workflowId
    }
    
    if (status) {
      where.status = status
    }

    // Get execution logs
    const logs = await db.executionLog.findMany({
      where,
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
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const total = await db.executionLog.count({ where })

    // Transform logs for frontend
    const transformedLogs = logs.map(log => ({
      id: log.id,
      workflowId: log.workflowId,
      workflowName: log.workflow?.name || 'Unknown Workflow',
      status: log.status,
      duration: log.duration,
      totalCost: log.totalCost,
      creditsUsed: log.creditsUsed,
      error: log.error,
      logs: log.logs,
      startTime: log.startTime,
      endTime: log.endTime,
      metrics: log.metrics
    }))

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total
      }
    })
  } catch (error) {
    console.error('[Logs GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}
