'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface ExecutionEvent {
    type: 'node_start' | 'node_progress' | 'node_complete' | 'node_error' | 
          'reasoning_start' | 'reasoning_update' | 'reasoning_complete' |
          'token_update' | 'workflow_complete' | 'workflow_error'
    timestamp: string
    nodeId?: string
    nodeName?: string
    data: Record<string, any>
}

interface UseExecutionStreamOptions {
    executionId?: string
    workflowId?: string
    onEvent?: (event: ExecutionEvent) => void
    onError?: (error: Error) => void
    onConnect?: () => void
    onDisconnect?: () => void
    autoReconnect?: boolean
    maxReconnectAttempts?: number
}

interface UseExecutionStreamReturn {
    events: ExecutionEvent[]
    isConnected: boolean
    error: Error | null
    connect: () => void
    disconnect: () => void
    clearEvents: () => void
}

export function useExecutionStream({
    executionId,
    workflowId,
    onEvent,
    onError,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    maxReconnectAttempts = 3
}: UseExecutionStreamOptions): UseExecutionStreamReturn {
    const [events, setEvents] = useState<ExecutionEvent[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectAttemptsRef = useRef(0)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    
    // Store callbacks in refs to avoid recreating connect/disconnect functions
    const onEventRef = useRef(onEvent)
    const onErrorRef = useRef(onError)
    const onConnectRef = useRef(onConnect)
    const onDisconnectRef = useRef(onDisconnect)
    
    // Keep refs up to date
    useEffect(() => {
        onEventRef.current = onEvent
        onErrorRef.current = onError
        onConnectRef.current = onConnect
        onDisconnectRef.current = onDisconnect
    }, [onEvent, onError, onConnect, onDisconnect])

    const clearEvents = useCallback(() => {
        setEvents([])
    }, [])

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
        
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }
        
        setIsConnected(false)
        onDisconnectRef.current?.()
    }, [])

    const connect = useCallback(() => {
        // Build URL with query params
        const params = new URLSearchParams()
        if (executionId) params.set('executionId', executionId)
        if (workflowId) params.set('workflowId', workflowId)
        
        if (!executionId && !workflowId) {
            setError(new Error('executionId or workflowId is required'))
            return
        }

        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
        }

        try {
            const url = `/api/execution/events?${params.toString()}`
            const eventSource = new EventSource(url)
            eventSourceRef.current = eventSource

            eventSource.onopen = () => {
                setIsConnected(true)
                setError(null)
                reconnectAttemptsRef.current = 0
                onConnectRef.current?.()
            }

            eventSource.onmessage = (e) => {
                try {
                    const event: ExecutionEvent = JSON.parse(e.data)
                    setEvents(prev => [...prev, event])
                    onEventRef.current?.(event)
                } catch (parseError) {
                    console.error('Failed to parse SSE event:', parseError)
                }
            }

            eventSource.onerror = (e) => {
                console.error('SSE error:', e)
                setIsConnected(false)
                
                // Close the errored connection
                eventSource.close()
                eventSourceRef.current = null

                // Attempt reconnection
                if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current++
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect()
                    }, delay)
                } else {
                    const error = new Error('Connection failed')
                    setError(error)
                    onErrorRef.current?.(error)
                }
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to connect')
            setError(error)
            onErrorRef.current?.(error)
        }
    }, [executionId, workflowId, autoReconnect, maxReconnectAttempts])

    // Auto-connect when IDs are provided
    useEffect(() => {
        if (executionId || workflowId) {
            connect()
        }

        return () => {
            disconnect()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [executionId, workflowId])

    return {
        events,
        isConnected,
        error,
        connect,
        disconnect,
        clearEvents
    }
}

// Helper hook for specific event types
export function useExecutionEventFilter(
    events: ExecutionEvent[],
    types: ExecutionEvent['type'][]
): ExecutionEvent[] {
    return events.filter(event => types.includes(event.type))
}

// Helper to get latest event by node
export function useLatestNodeEvents(events: ExecutionEvent[]): Map<string, ExecutionEvent> {
    const nodeEvents = new Map<string, ExecutionEvent>()
    
    events.forEach(event => {
        if (event.nodeId) {
            const existing = nodeEvents.get(event.nodeId)
            if (!existing || new Date(event.timestamp) > new Date(existing.timestamp)) {
                nodeEvents.set(event.nodeId, event)
            }
        }
    })
    
    return nodeEvents
}

// Helper to calculate execution metrics from events
export function calculateExecutionMetrics(events: ExecutionEvent[]) {
    let totalTokens = 0
    let totalCost = 0
    let completedNodes = 0
    let errorNodes = 0

    events.forEach(event => {
        if (event.type === 'token_update') {
            totalTokens += event.data.tokens || 0
            totalCost += event.data.cost || 0
        } else if (event.type === 'node_complete') {
            completedNodes++
        } else if (event.type === 'node_error') {
            errorNodes++
        }
    })

    const startEvent = events.find(e => e.type === 'node_start')
    const endEvent = events.find(e => 
        e.type === 'workflow_complete' || e.type === 'workflow_error'
    )

    const duration = startEvent && endEvent
        ? new Date(endEvent.timestamp).getTime() - new Date(startEvent.timestamp).getTime()
        : null

    return {
        totalTokens,
        totalCost,
        completedNodes,
        errorNodes,
        duration,
        averageTokensPerNode: completedNodes > 0 ? totalTokens / completedNodes : 0,
        averageCostPerNode: completedNodes > 0 ? totalCost / completedNodes : 0
    }
}

export default useExecutionStream
