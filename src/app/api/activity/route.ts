/**
 * GET /api/activity
 * Get recent activity feed for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

interface Activity {
  id: string
  type: 'workflow_run' | 'workflow_created' | 'workflow_updated' | 'connection_added' | 'cost_alert'
  title: string
  description: string
  timestamp: Date
  metadata?: Record<string, unknown>
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
    const limit = parseInt(searchParams.get('limit') || '20')

    const activities: Activity[] = []

    // Get recent workflow executions
    const recentExecutions = await db.executionLog.findMany({
      where: { userId },
      include: {
        workflow: {
          select: {
            name: true
          }
        }
      },
      orderBy: { startTime: 'desc' },
      take: limit
    })

    for (const exec of recentExecutions) {
      activities.push({
        id: `exec-${exec.id}`,
        type: 'workflow_run',
        title: `Workflow ${exec.status === 'completed' ? 'completed' : exec.status === 'failed' ? 'failed' : 'ran'}`,
        description: `${exec.workflow?.name || 'Unknown workflow'} - ${exec.duration ? `${(exec.duration / 1000).toFixed(1)}s` : 'N/A'}`,
        timestamp: exec.startTime,
        metadata: {
          workflowId: exec.workflowId,
          status: exec.status,
          cost: exec.totalCost
        }
      })
    }

    // Get recently created/updated workflows (use id as a proxy for creation order)
    const recentWorkflows = await db.workflows.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: Math.ceil(limit / 2)
    })

    for (const workflow of recentWorkflows) {
      activities.push({
        id: `wf-${workflow.id}`,
        type: 'workflow_created',
        title: 'Workflow activity',
        description: workflow.name,
        timestamp: new Date(), // Use current time as proxy
        metadata: {
          workflowId: workflow.id,
          publish: workflow.publish
        }
      })
    }

    // Get recent connections (use id as a proxy for creation order)
    const recentConnections = await db.connections.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: Math.ceil(limit / 3)
    })

    for (const conn of recentConnections) {
      activities.push({
        id: `conn-${conn.id}`,
        type: 'connection_added',
        title: 'Connection added',
        description: `Connected ${conn.type}`,
        timestamp: new Date(), // Use current time as proxy
        metadata: {
          connectionId: conn.id,
          type: conn.type
        }
      })
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Return limited activities
    return NextResponse.json({
      activities: activities.slice(0, limit)
    })
  } catch (error) {
    console.error('[Activity GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}
