// Cost Optimizer for AgentFlow
// Analyzes AI usage and provides optimization recommendations

import { AI_PRICING, AIUsageRecord, getAIStats, getUsageHistory } from './ai-cost-tracking'

export interface OptimizationRecommendation {
    id: string
    type: 'MODEL_SWITCH' | 'TOKEN_REDUCTION' | 'FREE_ALTERNATIVE' | 'BATCH_OPTIMIZATION'
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    title: string
    description: string
    currentCost: number
    projectedCost: number
    monthlySavings: number
    tradeoffs?: string[]
    action: {
        type: 'SWITCH_MODEL' | 'UPDATE_SETTING' | 'BATCH_PROCESS'
        payload: any
    }
}

export interface CostBreakdown {
    provider: string
    model: string
    runs: number
    inputTokens: number
    outputTokens: number
    cost: number
    percentage: number
}

export interface WorkflowCostAnalysis {
    workflowId: string
    workflowName: string
    totalRuns: number
    totalCost: number
    avgCostPerRun: number
    agents: {
        name: string
        model: string
        avgTokens: number
        avgCost: number
    }[]
}

// Model alternatives for cost optimization
const MODEL_ALTERNATIVES: Record<string, { free: string[]; cheap: string[] }> = {
    'gpt-4-turbo': {
        free: ['llama3:8b', 'gemini-1.5-flash', 'llama-3.1-70b-versatile'],
        cheap: ['gpt-3.5-turbo', 'gemini-1.5-pro', 'claude-3-haiku']
    },
    'gpt-4': {
        free: ['llama3:8b', 'gemini-1.5-flash', 'mixtral-8x7b-32768'],
        cheap: ['gpt-3.5-turbo', 'gemini-1.5-pro', 'claude-3-sonnet']
    },
    'gpt-3.5-turbo': {
        free: ['llama3:8b', 'gemini-1.5-flash', 'phi3:mini'],
        cheap: ['gemini-1.5-pro', 'claude-3-haiku']
    },
    'claude-3-opus': {
        free: ['llama3:8b', 'gemini-1.5-flash', 'llama-3.1-70b-versatile'],
        cheap: ['claude-3-sonnet', 'gpt-4-turbo', 'gemini-1.5-pro']
    },
    'claude-3-sonnet': {
        free: ['llama3:8b', 'gemini-1.5-flash', 'mixtral-8x7b-32768'],
        cheap: ['claude-3-haiku', 'gpt-3.5-turbo']
    },
    'gemini-1.5-pro': {
        free: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'llama3:8b'],
        cheap: ['gpt-3.5-turbo', 'claude-3-haiku']
    }
}

// Task complexity indicators
const SIMPLE_TASKS = [
    'filter', 'classify', 'extract', 'format', 'validate',
    'parse', 'summarize', 'translate', 'label'
]

const COMPLEX_TASKS = [
    'analyze', 'synthesize', 'reason', 'create', 'generate',
    'write', 'code', 'debug', 'design', 'strategize'
]

/**
 * Analyze cost breakdown by provider and model
 */
export function analyzeCostBreakdown(): CostBreakdown[] {
    const history = getUsageHistory()
    const breakdown: Record<string, CostBreakdown> = {}

    let totalCost = 0

    for (const record of history) {
        const key = `${record.provider}-${record.model}`
        totalCost += record.cost

        if (!breakdown[key]) {
            breakdown[key] = {
                provider: record.provider,
                model: record.model,
                runs: 0,
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
                percentage: 0
            }
        }

        breakdown[key].runs += 1
        breakdown[key].inputTokens += record.inputTokens
        breakdown[key].outputTokens += record.outputTokens
        breakdown[key].cost += record.cost
    }

    // Calculate percentages
    return Object.values(breakdown)
        .map(item => ({
            ...item,
            percentage: totalCost > 0 ? (item.cost / totalCost) * 100 : 0
        }))
        .sort((a, b) => b.cost - a.cost)
}

/**
 * Analyze costs per workflow
 */
export function analyzeWorkflowCosts(): WorkflowCostAnalysis[] {
    const history = getUsageHistory()
    const workflows: Record<string, WorkflowCostAnalysis> = {}

    for (const record of history) {
        const wfId = record.workflowId || 'unknown'
        const wfName = record.workflowName || 'Unknown Workflow'

        if (!workflows[wfId]) {
            workflows[wfId] = {
                workflowId: wfId,
                workflowName: wfName,
                totalRuns: 0,
                totalCost: 0,
                avgCostPerRun: 0,
                agents: []
            }
        }

        workflows[wfId].totalRuns += 1
        workflows[wfId].totalCost += record.cost

        // Track agent costs
        const agentIndex = workflows[wfId].agents.findIndex(a => a.model === record.model)
        if (agentIndex >= 0) {
            workflows[wfId].agents[agentIndex].avgTokens =
                (workflows[wfId].agents[agentIndex].avgTokens + record.inputTokens + record.outputTokens) / 2
            workflows[wfId].agents[agentIndex].avgCost =
                (workflows[wfId].agents[agentIndex].avgCost + record.cost) / 2
        } else {
            workflows[wfId].agents.push({
                name: `${record.provider} Agent`,
                model: record.model,
                avgTokens: record.inputTokens + record.outputTokens,
                avgCost: record.cost
            })
        }
    }

    // Calculate averages
    return Object.values(workflows)
        .map(wf => ({
            ...wf,
            avgCostPerRun: wf.totalRuns > 0 ? wf.totalCost / wf.totalRuns : 0
        }))
        .sort((a, b) => b.totalCost - a.totalCost)
}

/**
 * Generate optimization recommendations based on usage patterns
 */
export function generateOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = []
    const breakdown = analyzeCostBreakdown()
    const stats = getAIStats()

    // 1. Find expensive models that could be replaced with free alternatives
    for (const item of breakdown) {
        const alternatives = MODEL_ALTERNATIVES[item.model]
        if (!alternatives) continue

        if (item.cost > 1 && alternatives.free.length > 0) {
            const freeModel = alternatives.free[0]
            const monthlySavings = item.cost * 30 / (stats.totalExecutions || 1)

            recommendations.push({
                id: `switch-${item.model}-free`,
                type: 'FREE_ALTERNATIVE',
                priority: monthlySavings > 10 ? 'HIGH' : monthlySavings > 5 ? 'MEDIUM' : 'LOW',
                title: `Switch ${item.model} to ${freeModel}`,
                description: `You've spent $${item.cost.toFixed(2)} on ${item.model}. Consider switching to ${freeModel} which is FREE.`,
                currentCost: item.cost,
                projectedCost: 0,
                monthlySavings,
                tradeoffs: [
                    'Slightly slower response time',
                    'May need prompt adjustments',
                    'Quality might vary for complex tasks'
                ],
                action: {
                    type: 'SWITCH_MODEL',
                    payload: {
                        fromModel: item.model,
                        toModel: freeModel,
                        provider: freeModel.includes(':') ? 'Ollama' : 'Groq'
                    }
                }
            })
        }

        // Suggest cheaper paid alternatives
        if (item.cost > 5 && alternatives.cheap.length > 0) {
            const cheapModel = alternatives.cheap[0]
            const cheapPricing = AI_PRICING[cheapModel] || { input: 0.001, output: 0.002 }
            const currentPricing = AI_PRICING[item.model] || { input: 0.01, output: 0.02 }

            const savingsPercent = 1 - ((cheapPricing.input + cheapPricing.output) / (currentPricing.input + currentPricing.output))
            const projectedCost = item.cost * (1 - savingsPercent)
            const monthlySavings = (item.cost - projectedCost) * 30 / (stats.totalExecutions || 1)

            if (savingsPercent > 0.3) {
                recommendations.push({
                    id: `switch-${item.model}-cheap`,
                    type: 'MODEL_SWITCH',
                    priority: monthlySavings > 20 ? 'HIGH' : 'MEDIUM',
                    title: `Optimize with ${cheapModel}`,
                    description: `Switch from ${item.model} to ${cheapModel} to save ${Math.round(savingsPercent * 100)}% on AI costs.`,
                    currentCost: item.cost,
                    projectedCost,
                    monthlySavings,
                    tradeoffs: [
                        'Similar quality for most tasks',
                        'Faster response time',
                        'Better cost/performance ratio'
                    ],
                    action: {
                        type: 'SWITCH_MODEL',
                        payload: {
                            fromModel: item.model,
                            toModel: cheapModel
                        }
                    }
                })
            }
        }
    }

    // 2. Token reduction recommendations
    for (const item of breakdown) {
        const avgTokensPerRun = (item.inputTokens + item.outputTokens) / item.runs
        if (avgTokensPerRun > 2000 && item.runs > 5) {
            const potentialSavings = item.cost * 0.3 // Assume 30% reduction possible

            recommendations.push({
                id: `reduce-tokens-${item.model}`,
                type: 'TOKEN_REDUCTION',
                priority: potentialSavings > 5 ? 'HIGH' : 'MEDIUM',
                title: `Reduce token usage for ${item.model}`,
                description: `Average ${Math.round(avgTokensPerRun)} tokens per run. Consider reducing max_tokens setting or optimizing prompts.`,
                currentCost: item.cost,
                projectedCost: item.cost * 0.7,
                monthlySavings: potentialSavings,
                tradeoffs: [
                    'Shorter responses',
                    'May need multiple calls for long content'
                ],
                action: {
                    type: 'UPDATE_SETTING',
                    payload: {
                        model: item.model,
                        setting: 'max_tokens',
                        suggestedValue: Math.round(avgTokensPerRun * 0.7)
                    }
                }
            })
        }
    }

    // 3. Ollama adoption recommendation
    if (stats.estimatedCost > 10 && stats.savedByLocal < stats.estimatedCost * 0.5) {
        recommendations.push({
            id: 'adopt-ollama',
            type: 'FREE_ALTERNATIVE',
            priority: 'HIGH',
            title: 'Use Ollama for local AI processing',
            description: `You're spending $${stats.estimatedCost.toFixed(2)} on cloud AI. Run models locally with Ollama for FREE.`,
            currentCost: stats.estimatedCost,
            projectedCost: 0,
            monthlySavings: stats.estimatedCost,
            tradeoffs: [
                'Requires local hardware (8GB+ RAM)',
                'Initial model download (4-8GB)',
                'Slightly slower than cloud APIs'
            ],
            action: {
                type: 'SWITCH_MODEL',
                payload: {
                    provider: 'Ollama',
                    suggestedModels: ['llama3:8b', 'mistral:7b', 'phi3:mini']
                }
            }
        })
    }

    // Sort by monthly savings
    return recommendations.sort((a, b) => b.monthlySavings - a.monthlySavings)
}

/**
 * Calculate potential savings from optimization
 */
export function calculatePotentialSavings(): {
    totalCurrentSpend: number
    totalPotentialSavings: number
    savingsPercent: number
    recommendations: number
} {
    const recommendations = generateOptimizationRecommendations()
    const stats = getAIStats()

    const totalPotentialSavings = recommendations.reduce(
        (sum, rec) => sum + rec.monthlySavings,
        0
    )

    return {
        totalCurrentSpend: stats.estimatedCost,
        totalPotentialSavings,
        savingsPercent: stats.estimatedCost > 0
            ? (totalPotentialSavings / stats.estimatedCost) * 100
            : 0,
        recommendations: recommendations.length
    }
}

/**
 * Get smart model suggestion based on task type
 */
export function suggestModelForTask(
    taskDescription: string,
    budget: 'free' | 'cheap' | 'any' = 'free'
): {
    model: string
    provider: string
    reason: string
} {
    const descLower = taskDescription.toLowerCase()

    // Check if it's a simple task
    const isSimpleTask = SIMPLE_TASKS.some(task => descLower.includes(task))
    const isComplexTask = COMPLEX_TASKS.some(task => descLower.includes(task))
    const isCodeTask = descLower.includes('code') || descLower.includes('program') || descLower.includes('function')

    if (budget === 'free') {
        if (isCodeTask) {
            return {
                model: 'deepseek-coder:6.7b',
                provider: 'Ollama',
                reason: 'Specialized for code generation, runs locally for free'
            }
        }

        if (isSimpleTask) {
            return {
                model: 'phi3:mini',
                provider: 'Ollama',
                reason: 'Fast and efficient for simple tasks, runs locally'
            }
        }

        return {
            model: 'llama3:8b',
            provider: 'Ollama',
            reason: 'Excellent general-purpose model, runs locally for free'
        }
    }

    if (budget === 'cheap') {
        if (isCodeTask) {
            return {
                model: 'gpt-3.5-turbo',
                provider: 'OpenAI',
                reason: 'Good code capabilities at low cost'
            }
        }

        if (isComplexTask) {
            return {
                model: 'gemini-1.5-pro',
                provider: 'Google Gemini',
                reason: 'Strong reasoning at competitive pricing'
            }
        }

        return {
            model: 'gemini-1.5-flash',
            provider: 'Google Gemini',
            reason: 'Free tier available, fast and capable'
        }
    }

    // budget === 'any'
    if (isComplexTask) {
        return {
            model: 'gpt-4-turbo',
            provider: 'OpenAI',
            reason: 'Best-in-class for complex reasoning and generation'
        }
    }

    return {
        model: 'claude-3-sonnet',
        provider: 'Anthropic',
        reason: 'Excellent balance of quality and cost'
    }
}

// Budget alert types
export interface BudgetAlert {
    id: string
    type: 'WARNING' | 'LIMIT_REACHED' | 'OVERSPEND'
    threshold: number
    currentSpend: number
    message: string
    timestamp: Date
}

// Budget settings storage
const BUDGET_SETTINGS_KEY = 'agentflow_budget_settings'

export interface BudgetSettings {
    monthlyLimit: number
    alertThresholds: number[] // percentages, e.g., [50, 80, 100]
    actionOnLimit: 'notify' | 'pause_all' | 'pause_paid'
    gracePeriodDays: number
}

export const getDefaultBudgetSettings = (): BudgetSettings => ({
    monthlyLimit: 50,
    alertThresholds: [50, 80, 100],
    actionOnLimit: 'notify',
    gracePeriodDays: 1
})

export const getBudgetSettings = (): BudgetSettings => {
    if (typeof window === 'undefined') return getDefaultBudgetSettings()

    const stored = localStorage.getItem(BUDGET_SETTINGS_KEY)
    if (stored) {
        try {
            return { ...getDefaultBudgetSettings(), ...JSON.parse(stored) }
        } catch {
            return getDefaultBudgetSettings()
        }
    }
    return getDefaultBudgetSettings()
}

export const saveBudgetSettings = (settings: BudgetSettings): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(BUDGET_SETTINGS_KEY, JSON.stringify(settings))
}

export const checkBudgetAlerts = (): BudgetAlert[] => {
    const settings = getBudgetSettings()
    const stats = getAIStats()
    const alerts: BudgetAlert[] = []

    const spendPercent = (stats.estimatedCost / settings.monthlyLimit) * 100

    for (const threshold of settings.alertThresholds) {
        if (spendPercent >= threshold) {
            alerts.push({
                id: `budget-alert-${threshold}`,
                type: threshold >= 100 ? 'LIMIT_REACHED' : 'WARNING',
                threshold,
                currentSpend: stats.estimatedCost,
                message: threshold >= 100
                    ? `Budget limit of $${settings.monthlyLimit} reached!`
                    : `You've used ${Math.round(spendPercent)}% of your $${settings.monthlyLimit} monthly budget`,
                timestamp: new Date()
            })
        }
    }

    return alerts
}
