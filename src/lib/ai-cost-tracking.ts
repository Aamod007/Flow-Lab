// AI Cost Tracking Utilities

export interface AIUsageRecord {
    id: string
    timestamp: string
    provider: string
    model: string
    inputTokens: number
    outputTokens: number
    cost: number
    workflowId?: string
    workflowName?: string
}

export interface AIStats {
    totalExecutions: number
    estimatedCost: number
    tokensUsed: number
    savedByLocal: number
    executionsByProvider: Record<string, number>
    costByProvider: Record<string, number>
}

// Pricing per 1000 tokens (input/output)
export const AI_PRICING: Record<string, { input: number; output: number }> = {
    // OpenAI
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },

    // Google Gemini (mostly free, but has limits)
    'gemini-2.5-flash': { input: 0, output: 0 },
    'gemini-2.0-flash': { input: 0, output: 0 },
    'gemini-1.5-flash': { input: 0, output: 0 },
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 },

    // Anthropic Claude
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },

    // Groq (free tier)
    'llama-3.1-70b-versatile': { input: 0, output: 0 },
    'mixtral-8x7b-32768': { input: 0, output: 0 },

    // Ollama (always free - local)
    'llama3:8b': { input: 0, output: 0 },
    'mistral:7b': { input: 0, output: 0 },
    'codellama:13b': { input: 0, output: 0 },
    'phi3:mini': { input: 0, output: 0 },
}

// Calculate cost for a single AI call
export const calculateCost = (
    model: string,
    inputTokens: number,
    outputTokens: number
): number => {
    const pricing = AI_PRICING[model] || { input: 0.001, output: 0.002 }
    return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output
}

// Estimate "saved" cost if using local Ollama instead of cloud
export const calculateSavedCost = (
    model: string,
    inputTokens: number,
    outputTokens: number
): number => {
    // Assume GPT-4 pricing as baseline for what user would have paid
    const baselinePricing = AI_PRICING['gpt-4-turbo']
    const actualPricing = AI_PRICING[model] || { input: 0, output: 0 }

    const baselineCost = (inputTokens / 1000) * baselinePricing.input +
        (outputTokens / 1000) * baselinePricing.output
    const actualCost = (inputTokens / 1000) * actualPricing.input +
        (outputTokens / 1000) * actualPricing.output

    return Math.max(0, baselineCost - actualCost)
}

// Record an AI usage event
export const recordAIUsage = (
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    workflowId?: string,
    workflowName?: string
): AIUsageRecord => {
    if (typeof window === 'undefined') {
        return {} as AIUsageRecord
    }

    const cost = calculateCost(model, inputTokens, outputTokens)
    const saved = calculateSavedCost(model, inputTokens, outputTokens)

    const record: AIUsageRecord = {
        id: `usage-${Date.now()}`,
        timestamp: new Date().toISOString(),
        provider,
        model,
        inputTokens,
        outputTokens,
        cost,
        workflowId,
        workflowName
    }

    // Save to usage history
    const historyKey = 'flowlab_ai_usage_history'
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
    history.push(record)

    // Keep only last 1000 records
    if (history.length > 1000) {
        history.splice(0, history.length - 1000)
    }
    localStorage.setItem(historyKey, JSON.stringify(history))

    // Update aggregate stats
    updateAIStats(provider, model, inputTokens + outputTokens, cost, saved)

    return record
}

// Update aggregate AI stats
const updateAIStats = (
    provider: string,
    model: string,
    tokens: number,
    cost: number,
    saved: number
) => {
    const statsKey = 'flowlab_ai_stats'
    const stats: AIStats = JSON.parse(localStorage.getItem(statsKey) || JSON.stringify({
        totalExecutions: 0,
        estimatedCost: 0,
        tokensUsed: 0,
        savedByLocal: 0,
        executionsByProvider: {},
        costByProvider: {}
    }))

    stats.totalExecutions += 1
    stats.estimatedCost += cost
    stats.tokensUsed += tokens
    stats.savedByLocal += saved
    stats.executionsByProvider[provider] = (stats.executionsByProvider[provider] || 0) + 1
    stats.costByProvider[provider] = (stats.costByProvider[provider] || 0) + cost

    localStorage.setItem(statsKey, JSON.stringify(stats))
}

// Get AI stats
export const getAIStats = (): AIStats => {
    if (typeof window === 'undefined') {
        return {
            totalExecutions: 0,
            estimatedCost: 0,
            tokensUsed: 0,
            savedByLocal: 0,
            executionsByProvider: {},
            costByProvider: {}
        }
    }

    const statsKey = 'flowlab_ai_stats'
    return JSON.parse(localStorage.getItem(statsKey) || JSON.stringify({
        totalExecutions: 0,
        estimatedCost: 0,
        tokensUsed: 0,
        savedByLocal: 0,
        executionsByProvider: {},
        costByProvider: {}
    }))
}

// Get usage history
export const getAIUsageHistory = (limit: number = 50): AIUsageRecord[] => {
    if (typeof window === 'undefined') return []

    const historyKey = 'flowlab_ai_usage_history'
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]')
    return history.slice(-limit).reverse()
}

// Alias for cost-optimizer compatibility
export const getUsageHistory = (): AIUsageRecord[] => {
    if (typeof window === 'undefined') return []

    const historyKey = 'flowlab_ai_usage_history'
    return JSON.parse(localStorage.getItem(historyKey) || '[]')
}

// Reset stats (for testing/debugging)
export const resetAIStats = () => {
    if (typeof window === 'undefined') return

    localStorage.removeItem('flowlab_ai_stats')
    localStorage.removeItem('flowlab_ai_usage_history')
}

// Format cost for display
export const formatCost = (cost: number): string => {
    if (cost === 0) return '$0.00'
    if (cost < 0.01) return `$${cost.toFixed(4)}`
    return `$${cost.toFixed(2)}`
}

// Format tokens for display
export const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`
    return tokens.toString()
}
