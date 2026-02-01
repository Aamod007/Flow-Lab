import { NextRequest, NextResponse } from 'next/server'

// Types for execution events
export interface ExecutionEvent {
    type: 'node_start' | 'node_progress' | 'node_complete' | 'node_error' | 
          'reasoning_start' | 'reasoning_update' | 'reasoning_complete' |
          'token_update' | 'workflow_complete' | 'workflow_error'
    timestamp: string
    nodeId?: string
    nodeName?: string
    data: Record<string, any>
}

// Store for active execution streams (in production, use Redis or similar)
const executionStreams = new Map<string, ReadableStreamDefaultController<Uint8Array>>()

// Helper to format SSE message
function formatSSE(event: ExecutionEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`
}

// GET endpoint for SSE stream
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const executionId = searchParams.get('executionId')
    const workflowId = searchParams.get('workflowId')

    if (!executionId && !workflowId) {
        return NextResponse.json(
            { error: 'executionId or workflowId is required' },
            { status: 400 }
        )
    }

    const streamId = executionId || workflowId || ''

    // Create a new readable stream for SSE
    const stream = new ReadableStream({
        start(controller) {
            // Store controller for this execution
            executionStreams.set(streamId, controller)

            // Send initial connection event
            const connectEvent: ExecutionEvent = {
                type: 'node_start',
                timestamp: new Date().toISOString(),
                data: {
                    message: 'Connected to execution stream',
                    executionId,
                    workflowId
                }
            }
            controller.enqueue(new TextEncoder().encode(formatSSE(connectEvent)))

            // Heartbeat to keep connection alive
            const heartbeatInterval = setInterval(() => {
                try {
                    controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'))
                } catch (error) {
                    clearInterval(heartbeatInterval)
                }
            }, 30000) // Every 30 seconds

            // Cleanup on close
            request.signal.addEventListener('abort', () => {
                clearInterval(heartbeatInterval)
                executionStreams.delete(streamId)
                controller.close()
            })
        },
        cancel() {
            executionStreams.delete(streamId)
        }
    })

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no', // For nginx
        },
    })
}

// POST endpoint to send events to a stream
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { streamId, event } = body as { streamId: string; event: ExecutionEvent }

        if (!streamId || !event) {
            return NextResponse.json(
                { error: 'streamId and event are required' },
                { status: 400 }
            )
        }

        const controller = executionStreams.get(streamId)
        if (!controller) {
            return NextResponse.json(
                { error: 'No active stream for this execution' },
                { status: 404 }
            )
        }

        // Add timestamp if not present
        if (!event.timestamp) {
            event.timestamp = new Date().toISOString()
        }

        // Send event to stream
        controller.enqueue(new TextEncoder().encode(formatSSE(event)))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error sending execution event:', error)
        return NextResponse.json(
            { error: 'Failed to send event' },
            { status: 500 }
        )
    }
}

// Helper function to send events programmatically (for use in other API routes)
export function sendExecutionEvent(streamId: string, event: ExecutionEvent): boolean {
    const controller = executionStreams.get(streamId)
    if (!controller) {
        return false
    }

    if (!event.timestamp) {
        event.timestamp = new Date().toISOString()
    }

    try {
        controller.enqueue(new TextEncoder().encode(formatSSE(event)))
        return true
    } catch (error) {
        console.error('Error sending execution event:', error)
        return false
    }
}

// Helper function to close a stream
export function closeExecutionStream(streamId: string): boolean {
    const controller = executionStreams.get(streamId)
    if (!controller) {
        return false
    }

    try {
        // Send completion event
        const completeEvent: ExecutionEvent = {
            type: 'workflow_complete',
            timestamp: new Date().toISOString(),
            data: { message: 'Execution stream closed' }
        }
        controller.enqueue(new TextEncoder().encode(formatSSE(completeEvent)))
        controller.close()
        executionStreams.delete(streamId)
        return true
    } catch (error) {
        console.error('Error closing execution stream:', error)
        executionStreams.delete(streamId)
        return false
    }
}
