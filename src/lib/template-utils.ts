/**
 * Template Utilities for AgentFlow
 * 
 * Provides functionality for applying, customizing, and validating
 * AI workflow templates.
 */

import { v4 as uuidv4 } from 'uuid'
import { db } from './db'
import { AI_TEMPLATES, type AIWorkflowTemplate, type AIWorkflowAgent } from './ai-templates'

// ============================================================================
// Types
// ============================================================================

export interface TemplateApplicationResult {
  success: boolean
  workflowId?: string
  workflowName?: string
  error?: string
  nodesCreated?: number
  edgesCreated?: number
}

export interface TemplateCustomization {
  name?: string
  description?: string
  modelOverrides?: Record<string, { provider: string; model: string }>
  promptOverrides?: Record<string, string>
  removeAgents?: string[]
  addAgents?: AIWorkflowAgent[]
}

export interface TemplateValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  missingConnections: string[]
  estimatedCost: number
}

// ============================================================================
// Template Application
// ============================================================================

/**
 * Apply a template to create a new workflow
 */
export async function applyTemplate(
  templateId: string,
  userId: string,
  customization?: TemplateCustomization
): Promise<TemplateApplicationResult> {
  try {
    // Find template
    const template = AI_TEMPLATES.find(t => t.id === templateId)
    if (!template) {
      return { success: false, error: `Template "${templateId}" not found` }
    }

    // Apply customizations
    const finalTemplate = customization
      ? applyCustomization(template, customization)
      : template

    // Generate nodes from template agents
    const nodes = generateNodesFromAgents(finalTemplate.agents)

    // Generate edges from template connections
    const edges = generateEdgesFromConnections(finalTemplate.connections, finalTemplate.agents)

    // Create workflow name
    const workflowName = customization?.name || `${template.name} - ${new Date().toLocaleDateString()}`
    const workflowDescription = customization?.description || template.description

    // Create workflow in database
    const workflow = await db.workflows.create({
      data: {
        name: workflowName,
        description: workflowDescription,
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        userId,
        publish: false
      }
    })

    return {
      success: true,
      workflowId: workflow.id,
      workflowName: workflow.name,
      nodesCreated: nodes.length,
      edgesCreated: edges.length
    }
  } catch (error) {
    console.error('Error applying template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to apply template'
    }
  }
}

/**
 * Generate ReactFlow nodes from template agents
 */
function generateNodesFromAgents(agents: AIWorkflowAgent[]): any[] {
  return agents.map((agent, index) => {
    // Determine node type based on agent type
    let nodeType = agent.type
    if (['gemini', 'openai', 'ollama', 'groq', 'anthropic'].includes(agent.provider.toLowerCase())) {
      nodeType = 'AI'
    } else if (agent.provider.toLowerCase() === 'slack') {
      nodeType = 'Slack'
    } else if (agent.provider.toLowerCase() === 'discord') {
      nodeType = 'Discord'
    } else if (agent.provider.toLowerCase() === 'notion') {
      nodeType = 'Notion'
    } else if (agent.provider.toLowerCase() === 'gmail') {
      nodeType = 'Email'
    }

    return {
      id: agent.id,
      type: nodeType,
      position: agent.position || { x: 100 + (index * 300), y: 200 },
      data: {
        title: agent.name,
        description: agent.role,
        completed: false,
        current: false,
        metadata: {
          provider: capitalizeProvider(agent.provider),
          model: agent.model,
          systemPrompt: agent.systemPrompt,
          temperature: 0.7,
          maxTokens: 1000,
          enableReasoning: true
        },
        type: nodeType
      }
    }
  })
}

/**
 * Generate ReactFlow edges from template connections
 */
function generateEdgesFromConnections(
  connections: { from: string; to: string }[],
  agents: AIWorkflowAgent[]
): any[] {
  return connections.map((conn, index) => ({
    id: `edge-${index}-${conn.from}-${conn.to}`,
    source: conn.from,
    target: conn.to,
    animated: true,
    style: { stroke: '#6366f1' }
  }))
}

/**
 * Apply customizations to a template
 */
function applyCustomization(
  template: AIWorkflowTemplate,
  customization: TemplateCustomization
): AIWorkflowTemplate {
  const clonedTemplate = JSON.parse(JSON.stringify(template)) as AIWorkflowTemplate

  // Apply model overrides
  if (customization.modelOverrides) {
    for (const [agentId, override] of Object.entries(customization.modelOverrides)) {
      const agent = clonedTemplate.agents.find(a => a.id === agentId)
      if (agent) {
        agent.provider = override.provider as any
        agent.model = override.model
      }
    }
  }

  // Apply prompt overrides
  if (customization.promptOverrides) {
    for (const [agentId, prompt] of Object.entries(customization.promptOverrides)) {
      const agent = clonedTemplate.agents.find(a => a.id === agentId)
      if (agent) {
        agent.systemPrompt = prompt
      }
    }
  }

  // Remove agents
  if (customization.removeAgents && customization.removeAgents.length > 0) {
    clonedTemplate.agents = clonedTemplate.agents.filter(
      a => !customization.removeAgents!.includes(a.id)
    )
    // Also remove connections involving removed agents
    clonedTemplate.connections = clonedTemplate.connections.filter(
      c => !customization.removeAgents!.includes(c.from) &&
           !customization.removeAgents!.includes(c.to)
    )
  }

  // Add agents
  if (customization.addAgents && customization.addAgents.length > 0) {
    clonedTemplate.agents.push(...customization.addAgents)
  }

  return clonedTemplate
}

function capitalizeProvider(provider: string): string {
  const mapping: Record<string, string> = {
    gemini: 'Google Gemini',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    ollama: 'Ollama',
    groq: 'Groq',
    slack: 'Slack',
    discord: 'Discord',
    notion: 'Notion',
    gmail: 'Gmail'
  }
  return mapping[provider.toLowerCase()] || provider
}

// ============================================================================
// Template Validation
// ============================================================================

/**
 * Validate a template before application
 */
export async function validateTemplate(
  templateId: string,
  userId: string
): Promise<TemplateValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const missingConnections: string[] = []

  // Find template
  const template = AI_TEMPLATES.find(t => t.id === templateId)
  if (!template) {
    return {
      valid: false,
      errors: [`Template "${templateId}" not found`],
      warnings: [],
      missingConnections: [],
      estimatedCost: 0
    }
  }

  // Check required connections
  if (template.requiredConnections.length > 0) {
    try {
      const userConnections = await db.connections.findMany({
        where: { userId },
        select: { type: true }
      })
      const userConnectionTypes = userConnections.map(c => c.type.toLowerCase())

      for (const required of template.requiredConnections) {
        if (!userConnectionTypes.includes(required.toLowerCase())) {
          missingConnections.push(required)
        }
      }

      if (missingConnections.length > 0) {
        warnings.push(`Missing connections: ${missingConnections.join(', ')}`)
      }
    } catch (error) {
      warnings.push('Could not verify user connections')
    }
  }

  // Validate agents
  for (const agent of template.agents) {
    if (!agent.id) errors.push(`Agent missing ID`)
    if (!agent.name) errors.push(`Agent "${agent.id}" missing name`)
    if (!agent.provider) errors.push(`Agent "${agent.name}" missing provider`)
  }

  // Validate connections
  const agentIds = new Set(template.agents.map(a => a.id))
  for (const conn of template.connections) {
    if (!agentIds.has(conn.from)) {
      errors.push(`Connection references non-existent agent: ${conn.from}`)
    }
    if (!agentIds.has(conn.to)) {
      errors.push(`Connection references non-existent agent: ${conn.to}`)
    }
  }

  // Calculate estimated cost
  const estimatedCost = calculateTemplateEstimatedCost(template)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingConnections,
    estimatedCost
  }
}

/**
 * Calculate estimated cost for a template execution
 */
function calculateTemplateEstimatedCost(template: AIWorkflowTemplate): number {
  // Cost per 1000 tokens (rough estimates)
  const costPerModel: Record<string, number> = {
    'gpt-4-turbo': 0.03,
    'gpt-4': 0.04,
    'gpt-3.5-turbo': 0.002,
    'claude-3-opus': 0.045,
    'claude-3-sonnet': 0.009,
    'claude-3-haiku': 0.0008,
    'gemini-1.5-pro': 0.003,
    'gemini-1.5-flash': 0.0,
    'gemini-2.5-flash': 0.0,
    'gemini-2.0-flash': 0.0,
    'llama-3.1-70b-versatile': 0.0,
    'mixtral-8x7b-32768': 0.0,
  }

  // Estimate ~500 tokens input + 500 tokens output per agent
  const tokensPerAgent = 1000

  let totalCost = 0
  for (const agent of template.agents) {
    const modelCost = costPerModel[agent.model] || 0.001
    totalCost += (tokensPerAgent / 1000) * modelCost
  }

  return Math.round(totalCost * 100) / 100
}

// ============================================================================
// Template Queries
// ============================================================================

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): AIWorkflowTemplate | undefined {
  return AI_TEMPLATES.find(t => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): AIWorkflowTemplate[] {
  if (category.toLowerCase() === 'all') {
    return AI_TEMPLATES
  }
  return AI_TEMPLATES.filter(
    t => t.category.toLowerCase() === category.toLowerCase()
  )
}

/**
 * Get templates by difficulty
 */
export function getTemplatesByDifficulty(difficulty: string): AIWorkflowTemplate[] {
  return AI_TEMPLATES.filter(
    t => t.difficulty.toLowerCase() === difficulty.toLowerCase()
  )
}

/**
 * Search templates by query
 */
export function searchTemplates(query: string): AIWorkflowTemplate[] {
  const lowerQuery = query.toLowerCase()
  return AI_TEMPLATES.filter(
    t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get templates with free execution (using only free providers)
 */
export function getFreeTemplates(): AIWorkflowTemplate[] {
  const freeProviders = ['ollama', 'groq', 'gemini']
  return AI_TEMPLATES.filter(
    t => t.agents.every(a => freeProviders.includes(a.provider.toLowerCase()))
  )
}

/**
 * Get popular templates (sorted by tag count as proxy for popularity)
 */
export function getPopularTemplates(limit: number = 5): AIWorkflowTemplate[] {
  return [...AI_TEMPLATES]
    .sort((a, b) => b.tags.length - a.tags.length)
    .slice(0, limit)
}

// ============================================================================
// Storage Utilities (for client-side template preview)
// ============================================================================

const TEMPLATE_PREVIEW_KEY = 'agentflow_template_preview'

/**
 * Save template to localStorage for preview in editor
 */
export function saveTemplateForPreview(template: AIWorkflowTemplate): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TEMPLATE_PREVIEW_KEY, JSON.stringify(template))
}

/**
 * Get template from localStorage for preview
 */
export function getTemplateForPreview(): AIWorkflowTemplate | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(TEMPLATE_PREVIEW_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as AIWorkflowTemplate
  } catch {
    return null
  }
}

/**
 * Clear template preview from localStorage
 */
export function clearTemplatePreview(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TEMPLATE_PREVIEW_KEY)
}

// ============================================================================
// Template Comparison
// ============================================================================

/**
 * Compare two templates for differences
 */
export function compareTemplates(
  templateA: AIWorkflowTemplate,
  templateB: AIWorkflowTemplate
): {
  addedAgents: string[]
  removedAgents: string[]
  modifiedAgents: string[]
  costDifference: number
} {
  const agentsA = new Set(templateA.agents.map(a => a.id))
  const agentsB = new Set(templateB.agents.map(a => a.id))

  const addedAgents = templateB.agents
    .filter(a => !agentsA.has(a.id))
    .map(a => a.name)

  const removedAgents = templateA.agents
    .filter(a => !agentsB.has(a.id))
    .map(a => a.name)

  const modifiedAgents = templateA.agents
    .filter(a => {
      const bAgent = templateB.agents.find(b => b.id === a.id)
      return bAgent && (
        bAgent.provider !== a.provider ||
        bAgent.model !== a.model ||
        bAgent.systemPrompt !== a.systemPrompt
      )
    })
    .map(a => a.name)

  const costA = calculateTemplateEstimatedCost(templateA)
  const costB = calculateTemplateEstimatedCost(templateB)

  return {
    addedAgents,
    removedAgents,
    modifiedAgents,
    costDifference: costB - costA
  }
}
