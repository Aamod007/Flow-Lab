// AgentFlow - Dedicated Agent Types
// Simple, focused agent architecture for multi-agent workflows

export type AgentRole = 'researcher' | 'coder' | 'analyst' | 'writer' | 'reviewer' | 'coordinator'

export interface Agent {
  id: string
  name: string
  role: AgentRole
  description: string
  icon: string
  color: string
  capabilities: string[]
  systemPrompt: string
  model: string
  temperature: number
}

export interface AgentMessage {
  id: string
  fromAgentId: string
  toAgentId: string | 'broadcast'
  content: string
  type: 'task' | 'result' | 'question' | 'feedback' | 'handoff'
  timestamp: Date
  metadata?: Record<string, any>
}

export interface AgentTask {
  id: string
  agentId: string
  input: string
  output?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
  tokens?: number
  cost?: number
}

export interface AgentCollaboration {
  id: string
  agents: string[]
  messages: AgentMessage[]
  tasks: AgentTask[]
  status: 'idle' | 'running' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
}

// Pre-built Agent Templates
export const AGENT_TEMPLATES: Record<AgentRole, Omit<Agent, 'id'>> = {
  researcher: {
    name: 'Research Agent',
    role: 'researcher',
    description: 'Searches the web, gathers information, and compiles findings',
    icon: '🔍',
    color: '#3B82F6', // blue
    capabilities: [
      'Web search',
      'Data gathering',
      'Source verification',
      'Information synthesis',
      'Citation tracking'
    ],
    systemPrompt: `You are a Research Agent. Your role is to:
- Search for and gather relevant information
- Verify sources and fact-check claims
- Synthesize findings into clear summaries
- Provide citations and references
- Flag any conflicting or uncertain information

Always be thorough but concise. Prioritize authoritative sources.`,
    model: 'gemini-2.5-flash',
    temperature: 0.3
  },

  coder: {
    name: 'Coder Agent',
    role: 'coder',
    description: 'Writes, reviews, and debugs code across multiple languages',
    icon: '💻',
    color: '#10B981', // green
    capabilities: [
      'Code generation',
      'Bug fixing',
      'Code review',
      'Refactoring',
      'Documentation'
    ],
    systemPrompt: `You are a Coder Agent. Your role is to:
- Write clean, efficient, and well-documented code
- Debug and fix issues in existing code
- Review code for best practices and security
- Refactor code for better performance
- Generate tests and documentation

Always follow best practices and explain your code decisions.`,
    model: 'gemini-2.5-flash',
    temperature: 0.2
  },

  analyst: {
    name: 'Analyst Agent',
    role: 'analyst',
    description: 'Analyzes data, identifies patterns, and generates insights',
    icon: '📊',
    color: '#8B5CF6', // purple
    capabilities: [
      'Data analysis',
      'Pattern recognition',
      'Statistical analysis',
      'Visualization suggestions',
      'Trend identification'
    ],
    systemPrompt: `You are an Analyst Agent. Your role is to:
- Analyze data and identify meaningful patterns
- Perform statistical analysis when needed
- Generate actionable insights
- Suggest appropriate visualizations
- Identify trends and anomalies

Be data-driven and support conclusions with evidence.`,
    model: 'gemini-2.5-flash',
    temperature: 0.3
  },

  writer: {
    name: 'Writer Agent',
    role: 'writer',
    description: 'Creates content, reports, and documentation',
    icon: '✍️',
    color: '#F59E0B', // amber
    capabilities: [
      'Content creation',
      'Report writing',
      'Summarization',
      'Tone adaptation',
      'Formatting'
    ],
    systemPrompt: `You are a Writer Agent. Your role is to:
- Create clear, engaging content
- Write professional reports and documentation
- Summarize complex information
- Adapt tone for different audiences
- Format content appropriately

Focus on clarity, accuracy, and readability.`,
    model: 'gemini-2.5-flash',
    temperature: 0.7
  },

  reviewer: {
    name: 'Reviewer Agent',
    role: 'reviewer',
    description: 'Reviews work, provides feedback, and ensures quality',
    icon: '✅',
    color: '#EF4444', // red
    capabilities: [
      'Quality assurance',
      'Feedback generation',
      'Error detection',
      'Improvement suggestions',
      'Compliance checking'
    ],
    systemPrompt: `You are a Reviewer Agent. Your role is to:
- Review work for quality and accuracy
- Provide constructive feedback
- Identify errors and inconsistencies
- Suggest improvements
- Ensure compliance with requirements

Be thorough but constructive in your feedback.`,
    model: 'gemini-2.5-flash',
    temperature: 0.4
  },

  coordinator: {
    name: 'Coordinator Agent',
    role: 'coordinator',
    description: 'Orchestrates other agents and manages workflow execution',
    icon: '🎯',
    color: '#EC4899', // pink
    capabilities: [
      'Task delegation',
      'Progress tracking',
      'Conflict resolution',
      'Resource allocation',
      'Timeline management'
    ],
    systemPrompt: `You are a Coordinator Agent. Your role is to:
- Break down complex tasks into subtasks
- Delegate work to appropriate agents
- Track progress and manage timelines
- Resolve conflicts between agents
- Ensure smooth workflow execution

Be organized and keep all agents aligned on goals.`,
    model: 'gemini-2.5-flash',
    temperature: 0.5
  }
}

// Agent Node Type for React Flow
export interface AgentNode {
  id: string
  type: 'agent'
  position: { x: number; y: number }
  data: {
    agent: Agent
    status: 'idle' | 'running' | 'completed' | 'failed'
    currentTask?: string
    output?: string
    metrics?: {
      tokens: number
      cost: number
      duration: number
    }
  }
}

// Create a new agent from template
export function createAgent(role: AgentRole, customName?: string): Agent {
  const template = AGENT_TEMPLATES[role]
  return {
    id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...template,
    name: customName || template.name
  }
}

// Get agent color by role
export function getAgentColor(role: AgentRole): string {
  return AGENT_TEMPLATES[role]?.color || '#6B7280'
}

// Get agent icon by role
export function getAgentIcon(role: AgentRole): string {
  return AGENT_TEMPLATES[role]?.icon || '🤖'
}
