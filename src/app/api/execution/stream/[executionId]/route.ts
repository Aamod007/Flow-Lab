/**
 * GET /api/execution/stream/[executionId]
 * Server-Sent Events endpoint for real-time execution updates
 * 
 * Event Types:
 * - execution:started
 * - agent:started
 * - agent:progress (for reasoning updates)
 * - agent:completed
 * - agent:failed
 * - execution:completed
 * - execution:failed
 */

import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { safeParseJson, ExecutionEventsArraySchema, ExecutionMetricsSchema } from '@/lib/validation-schemas'

type RouteParams = { params: Promise<{ executionId: string }> }

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  const { userId } = auth()
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { executionId } = await context.params

  // Verify execution exists and belongs to user
  const execution = await db.executionLog.findFirst({
    where: {
      id: executionId,
      userId
    },
    include: {
      workflow: {
        select: {
          name: true,
          nodes: true
        }
      }
    }
  })

  if (!execution) {
    return new Response('Execution not found', { status: 404 })
  }

  const encoder = new TextEncoder()
  
  // Type assertion for optional fields from schema
  const executionWithExtras = execution as typeof execution & { events?: string; metrics?: string }
  
  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial state
      const initialEvent = {
        type: 'execution:init',
        executionId,
        workflowName: execution.workflow.name,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        events: safeParseJson(ExecutionEventsArraySchema, executionWithExtras.events) || [],
        metrics: safeParseJson(ExecutionMetricsSchema, executionWithExtras.metrics) || {},
        timestamp: new Date().toISOString()
      }
      
      controller.enqueue(encoder.encode(`event: init\ndata: ${JSON.stringify(initialEvent)}\n\n`))

      // If execution is already completed, send final state and close
      if (execution.status === 'COMPLETED' || execution.status === 'FAILED') {
        const finalEvent = {
          type: execution.status === 'COMPLETED' ? 'execution:completed' : 'execution:failed',
          executionId,
          status: execution.status,
          endTime: execution.endTime,
          duration: execution.duration,
          totalCost: execution.totalCost,
          error: execution.error,
          timestamp: new Date().toISOString()
        }
        
        controller.enqueue(encoder.encode(`event: ${execution.status.toLowerCase()}\ndata: ${JSON.stringify(finalEvent)}\n\n`))
        controller.close()
        return
      }

      // For running executions, poll for updates
      let lastEventCount = 0
      let pollCount = 0
      const maxPolls = 300 // 5 minutes max (at 1 poll/second)
      
      const pollInterval = setInterval(async () => {
        try {
          pollCount++
          
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval)
            controller.enqueue(encoder.encode(`event: timeout\ndata: ${JSON.stringify({ message: 'Stream timeout' })}\n\n`))
            controller.close()
            return
          }

          // Fetch latest execution state
          const updated = await db.executionLog.findUnique({
            where: { id: executionId }
          })

          if (!updated) {
            clearInterval(pollInterval)
            controller.close()
            return
          }

          // Type assertion for optional fields
          const updatedWithExtras = updated as typeof updated & { events?: string; metrics?: string }

          // Parse events with validation
          const events = safeParseJson(ExecutionEventsArraySchema, updatedWithExtras.events) || []
          
          // Send new events
          if (events.length > lastEventCount) {
            const newEvents = events.slice(lastEventCount)
            
            for (const event of newEvents) {
              const eventData = {
                ...event,
                executionId,
                timestamp: event.timestamp || new Date().toISOString()
              }
              
              const eventType = event.type?.toLowerCase().replace(':', '-') || 'update'
              controller.enqueue(encoder.encode(`event: ${eventType}\ndata: ${JSON.stringify(eventData)}\n\n`))
            }
            
            lastEventCount = events.length
          }

          // Check if execution completed
          if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
            clearInterval(pollInterval)
            
            const metrics = safeParseJson(ExecutionMetricsSchema, updatedWithExtras.metrics) || {}
            const finalEvent = {
              type: updated.status === 'COMPLETED' ? 'execution:completed' : 'execution:failed',
              executionId,
              status: updated.status,
              endTime: updated.endTime,
              duration: updated.duration,
              totalCost: updated.totalCost,
              metrics,
              error: updated.error,
              timestamp: new Date().toISOString()
            }
            
            controller.enqueue(encoder.encode(`event: ${updated.status.toLowerCase()}\ndata: ${JSON.stringify(finalEvent)}\n\n`))
            controller.close()
          } else {
            // Send heartbeat
            controller.enqueue(encoder.encode(`: heartbeat\n\n`))
          }
        } catch (error) {
          console.error('[SSE Stream] Poll error:', error)
          // Don't close on poll error, try again next interval
        }
      }, 1000)

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval)
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
