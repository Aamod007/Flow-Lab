/**
 * Event Stream Utilities for AgentFlow
 * 
 * Provides Server-Sent Events (SSE) functionality for real-time
 * workflow execution updates, agent reasoning visibility, and
 * cost tracking notifications.
 */

// ============================================================================
// Event Type Definitions
// ============================================================================

export type ExecutionEventType =
  | 'execution:started'
  | 'execution:completed'
  | 'execution:failed'
  | 'execution:paused'
  | 'agent:started'
  | 'agent:progress'
  | 'agent:reasoning'
  | 'agent:completed'
  | 'agent:failed'
  | 'cost:updated'
  | 'cost:limit_warning'
  | 'cost:limit_reached'

export interface BaseExecutionEvent {
  id: string
  type: ExecutionEventType
  timestamp: string
  executionId: string
}

export interface ExecutionStartedEvent extends BaseExecutionEvent {
  type: 'execution:started'
  data: {
    workflowId: string
    workflowName: string
    totalAgents: number
    estimatedCost?: number
    estimatedDuration?: number
  }
}

export interface ExecutionCompletedEvent extends BaseExecutionEvent {
  type: 'execution:completed'
  data: {
    duration: number
    totalCost: number
    totalTokens: number
    agentsCompleted: number
    output?: any
  }
}

export interface ExecutionFailedEvent extends BaseExecutionEvent {
  type: 'execution:failed'
  data: {
    error: string
    failedAgentId?: string
    failedAgentName?: string
    partialOutput?: any
    retryable: boolean
  }
}

export interface AgentStartedEvent extends BaseExecutionEvent {
  type: 'agent:started'
  data: {
    agentId: string
    agentName: string
    agentType: string
    provider: string
    model: string
    position: number
    totalAgents: number
  }
}

export interface AgentProgressEvent extends BaseExecutionEvent {
  type: 'agent:progress'
  data: {
    agentId: string
    agentName: string
    progress: number
    message: string
    tokensUsed?: number
    partialOutput?: string
  }
}

export interface AgentReasoningEvent extends BaseExecutionEvent {
  type: 'agent:reasoning'
  data: {
    agentId: string
    agentName: string
    reasoning: string
    confidence?: number
    decision?: string
    alternatives?: string[]
    keywords?: string[]
  }
}

export interface AgentCompletedEvent extends BaseExecutionEvent {
  type: 'agent:completed'
  data: {
    agentId: string
    agentName: string
    duration: number
    inputTokens: number
    outputTokens: number
    cost: number
    output: any
    reasoning?: string
  }
}

export interface AgentFailedEvent extends BaseExecutionEvent {
  type: 'agent:failed'
  data: {
    agentId: string
    agentName: string
    error: string
    retryable: boolean
    retryCount?: number
  }
}

export interface CostUpdatedEvent extends BaseExecutionEvent {
  type: 'cost:updated'
  data: {
    currentCost: number
    budgetLimit: number
    percentUsed: number
    projectedCost: number
  }
}

export interface CostLimitWarningEvent extends BaseExecutionEvent {
  type: 'cost:limit_warning'
  data: {
    currentCost: number
    budgetLimit: number
    percentUsed: number
    threshold: number
  }
}

export interface CostLimitReachedEvent extends BaseExecutionEvent {
  type: 'cost:limit_reached'
  data: {
    currentCost: number
    budgetLimit: number
    action: 'NOTIFY' | 'PAUSE_ALL' | 'PAUSE_PAID'
    affectedWorkflows?: string[]
  }
}

export type ExecutionEvent =
  | ExecutionStartedEvent
  | ExecutionCompletedEvent
  | ExecutionFailedEvent
  | AgentStartedEvent
  | AgentProgressEvent
  | AgentReasoningEvent
  | AgentCompletedEvent
  | AgentFailedEvent
  | CostUpdatedEvent
  | CostLimitWarningEvent
  | CostLimitReachedEvent

// ============================================================================
// Event Creation Helpers
// ============================================================================

let eventCounter = 0

function generateEventId(): string {
  return `evt_${Date.now()}_${++eventCounter}`
}

export function createEvent<T extends ExecutionEvent>(
  type: T['type'],
  executionId: string,
  data: T['data']
): T {
  return {
    id: generateEventId(),
    type,
    timestamp: new Date().toISOString(),
    executionId,
    data
  } as T
}

export function createExecutionStartedEvent(
  executionId: string,
  workflowId: string,
  workflowName: string,
  totalAgents: number,
  estimatedCost?: number
): ExecutionStartedEvent {
  return createEvent<ExecutionStartedEvent>('execution:started', executionId, {
    workflowId,
    workflowName,
    totalAgents,
    estimatedCost
  })
}

export function createAgentStartedEvent(
  executionId: string,
  agentId: string,
  agentName: string,
  agentType: string,
  provider: string,
  model: string,
  position: number,
  totalAgents: number
): AgentStartedEvent {
  return createEvent<AgentStartedEvent>('agent:started', executionId, {
    agentId,
    agentName,
    agentType,
    provider,
    model,
    position,
    totalAgents
  })
}

export function createAgentProgressEvent(
  executionId: string,
  agentId: string,
  agentName: string,
  progress: number,
  message: string,
  tokensUsed?: number
): AgentProgressEvent {
  return createEvent<AgentProgressEvent>('agent:progress', executionId, {
    agentId,
    agentName,
    progress,
    message,
    tokensUsed
  })
}

export function createAgentReasoningEvent(
  executionId: string,
  agentId: string,
  agentName: string,
  reasoning: string,
  confidence?: number,
  decision?: string
): AgentReasoningEvent {
  return createEvent<AgentReasoningEvent>('agent:reasoning', executionId, {
    agentId,
    agentName,
    reasoning,
    confidence,
    decision
  })
}

export function createAgentCompletedEvent(
  executionId: string,
  agentId: string,
  agentName: string,
  duration: number,
  inputTokens: number,
  outputTokens: number,
  cost: number,
  output: any,
  reasoning?: string
): AgentCompletedEvent {
  return createEvent<AgentCompletedEvent>('agent:completed', executionId, {
    agentId,
    agentName,
    duration,
    inputTokens,
    outputTokens,
    cost,
    output,
    reasoning
  })
}

export function createAgentFailedEvent(
  executionId: string,
  agentId: string,
  agentName: string,
  error: string,
  retryable: boolean = false
): AgentFailedEvent {
  return createEvent<AgentFailedEvent>('agent:failed', executionId, {
    agentId,
    agentName,
    error,
    retryable
  })
}

export function createExecutionCompletedEvent(
  executionId: string,
  duration: number,
  totalCost: number,
  totalTokens: number,
  agentsCompleted: number,
  output?: any
): ExecutionCompletedEvent {
  return createEvent<ExecutionCompletedEvent>('execution:completed', executionId, {
    duration,
    totalCost,
    totalTokens,
    agentsCompleted,
    output
  })
}

export function createExecutionFailedEvent(
  executionId: string,
  error: string,
  failedAgentId?: string,
  failedAgentName?: string,
  retryable: boolean = false
): ExecutionFailedEvent {
  return createEvent<ExecutionFailedEvent>('execution:failed', executionId, {
    error,
    failedAgentId,
    failedAgentName,
    retryable
  })
}

// ============================================================================
// SSE Formatting Utilities
// ============================================================================

/**
 * Format an event as a Server-Sent Event string
 */
export function formatSSEEvent(event: ExecutionEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}

/**
 * Format a comment (for keepalive)
 */
export function formatSSEComment(comment: string): string {
  return `: ${comment}\n\n`
}

/**
 * Parse a raw SSE event string back into an ExecutionEvent
 */
export function parseSSEEvent(raw: string): ExecutionEvent | null {
  try {
    const lines = raw.split('\n')
    let eventType = ''
    let data = ''

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7)
      } else if (line.startsWith('data: ')) {
        data = line.slice(6)
      }
    }

    if (data) {
      return JSON.parse(data) as ExecutionEvent
    }

    return null
  } catch {
    return null
  }
}

// ============================================================================
// Event Stream Headers
// ============================================================================

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  'X-Accel-Buffering': 'no'
}

// ============================================================================
// Event Emitter (in-memory, for server-side use)
// ============================================================================

type EventHandler = (event: ExecutionEvent) => void

class EventEmitter {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  subscribe(executionId: string, handler: EventHandler): () => void {
    if (!this.handlers.has(executionId)) {
      this.handlers.set(executionId, new Set())
    }
    this.handlers.get(executionId)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(executionId)?.delete(handler)
      if (this.handlers.get(executionId)?.size === 0) {
        this.handlers.delete(executionId)
      }
    }
  }

  emit(event: ExecutionEvent): void {
    const handlers = this.handlers.get(event.executionId)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
  }

  hasSubscribers(executionId: string): boolean {
    return (this.handlers.get(executionId)?.size ?? 0) > 0
  }
}

// Global event emitter instance
export const executionEventEmitter = new EventEmitter()

// ============================================================================
// Execution State Manager
// ============================================================================

interface ExecutionState {
  id: string
  workflowId: string
  workflowName: string
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED'
  startTime: Date
  endTime?: Date
  currentAgentIndex: number
  totalAgents: number
  events: ExecutionEvent[]
  metrics: {
    totalTokens: number
    totalCost: number
    agentsCompleted: number
  }
}

const executionStates = new Map<string, ExecutionState>()

export function initExecutionState(
  executionId: string,
  workflowId: string,
  workflowName: string,
  totalAgents: number
): ExecutionState {
  const state: ExecutionState = {
    id: executionId,
    workflowId,
    workflowName,
    status: 'RUNNING',
    startTime: new Date(),
    currentAgentIndex: 0,
    totalAgents,
    events: [],
    metrics: {
      totalTokens: 0,
      totalCost: 0,
      agentsCompleted: 0
    }
  }
  executionStates.set(executionId, state)
  return state
}

export function getExecutionState(executionId: string): ExecutionState | undefined {
  return executionStates.get(executionId)
}

export function updateExecutionState(
  executionId: string,
  event: ExecutionEvent
): ExecutionState | undefined {
  const state = executionStates.get(executionId)
  if (!state) return undefined

  state.events.push(event)

  switch (event.type) {
    case 'agent:completed':
      const completedData = (event as AgentCompletedEvent).data
      state.metrics.totalTokens += completedData.inputTokens + completedData.outputTokens
      state.metrics.totalCost += completedData.cost
      state.metrics.agentsCompleted++
      state.currentAgentIndex++
      break
    case 'execution:completed':
      state.status = 'COMPLETED'
      state.endTime = new Date()
      break
    case 'execution:failed':
      state.status = 'FAILED'
      state.endTime = new Date()
      break
    case 'execution:paused':
      state.status = 'PAUSED'
      break
  }

  return state
}

export function clearExecutionState(executionId: string): void {
  executionStates.delete(executionId)
}
