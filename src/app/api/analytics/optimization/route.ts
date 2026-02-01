/**
 * GET /api/analytics/optimization
 * Get AI-powered cost optimization suggestions
 * 
 * Analyzes user's workflow executions and suggests:
 * - Switch expensive agents to free alternatives
 * - Reduce max tokens where actual usage is lower
 * - Use Ollama for simple tasks
 * - Batch similar requests
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

interface OptimizationSuggestion {
  id: string
  type: 'SWITCH_MODEL' | 'REDUCE_TOKENS' | 'USE_OLLAMA' | 'BATCH_REQUESTS' | 'CACHE_RESULTS'
  priority: 'high' | 'medium' | 'low'
  workflowId?: string
  workflowName?: string
  agentName?: string
  current: {
    provider: string
    model?: string
    cost: number
    description: string
  }
  suggested: {
    provider: string
    model?: string
    cost: number
    description: string
  }
  monthlySavings: number
  impact: string
  howToApply: string
}

// Cost per 1K tokens for different providers (approximate)
const MODEL_COSTS: Record<string, number> = {
  'gpt-4': 0.03,
  'gpt-4-turbo': 0.01,
  'gpt-3.5-turbo': 0.0015,
  'claude-3-opus': 0.015,
  'claude-3-sonnet': 0.003,
  'claude-3-haiku': 0.00025,
  'gemini-1.5-pro': 0.00125,
  'gemini-1.5-flash': 0.000075,
  'llama-3.1-70b-versatile': 0, // Groq free tier
  'llama3:8b': 0, // Ollama local
  'mistral:7b': 0, // Ollama local
}

// Free alternatives for expensive models
const FREE_ALTERNATIVES: Record<string, { provider: string; model: string; quality: string }> = {
  'gpt-4': { provider: 'groq', model: 'llama-3.1-70b-versatile', quality: '85%' },
  'gpt-4-turbo': { provider: 'groq', model: 'llama-3.1-70b-versatile', quality: '85%' },
  'gpt-3.5-turbo': { provider: 'ollama', model: 'llama3:8b', quality: '90%' },
  'claude-3-opus': { provider: 'groq', model: 'llama-3.1-70b-versatile', quality: '80%' },
  'claude-3-sonnet': { provider: 'gemini', model: 'gemini-1.5-flash', quality: '90%' },
  'gemini-1.5-pro': { provider: 'gemini', model: 'gemini-1.5-flash', quality: '95%' },
}

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get execution logs from past month
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)

    const executionLogs = await db.executionLog.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate
        }
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            nodes: true
          }
        }
      }
    })

    const suggestions: OptimizationSuggestion[] = []
    let potentialSavings = 0

    // Analyze model usage patterns
    const modelUsage: Record<string, {
      provider: string
      model: string
      totalCost: number
      executions: number
      workflows: Set<string>
      avgTokens: number
    }> = {}

    executionLogs.forEach(log => {
      const logWithMetrics = log as typeof log & { metrics?: string }
      if (logWithMetrics.metrics) {
        try {
          const metrics = JSON.parse(logWithMetrics.metrics)
          if (metrics.modelUsage) {
            Object.entries(metrics.modelUsage).forEach(([model, data]: [string, any]) => {
              if (!modelUsage[model]) {
                modelUsage[model] = {
                  provider: data.provider || 'unknown',
                  model,
                  totalCost: 0,
                  executions: 0,
                  workflows: new Set(),
                  avgTokens: 0
                }
              }
              modelUsage[model].totalCost += data.cost || 0
              modelUsage[model].executions += 1
              modelUsage[model].workflows.add(log.workflowId)
              modelUsage[model].avgTokens = 
                (modelUsage[model].avgTokens * (modelUsage[model].executions - 1) + (data.tokens || 0)) 
                / modelUsage[model].executions
            })
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    })

    // Generate suggestions based on analysis
    Object.entries(modelUsage).forEach(([model, usage]) => {
      const alternative = FREE_ALTERNATIVES[model]
      
      if (alternative && usage.totalCost > 1) { // Only suggest if spending > $1/month
        const estimatedSavings = usage.totalCost * 0.9 // Assume 90% savings with free tier
        
        suggestions.push({
          id: `switch-${model}-${Date.now()}`,
          type: 'SWITCH_MODEL',
          priority: usage.totalCost > 10 ? 'high' : usage.totalCost > 5 ? 'medium' : 'low',
          current: {
            provider: usage.provider,
            model,
            cost: Math.round(usage.totalCost * 100) / 100,
            description: `${usage.executions} executions this month`
          },
          suggested: {
            provider: alternative.provider,
            model: alternative.model,
            cost: 0,
            description: `${alternative.quality} quality compared to ${model}`
          },
          monthlySavings: Math.round(estimatedSavings * 100) / 100,
          impact: `Save ~$${Math.round(estimatedSavings * 100) / 100}/month`,
          howToApply: `Open workflow settings and change the model from ${model} to ${alternative.model} (${alternative.provider})`
        })

        potentialSavings += estimatedSavings
      }
    })

    // Suggest Ollama for simple tasks
    const simpleTaskWorkflows = executionLogs.filter(log => {
      const logWithMetrics = log as typeof log & { metrics?: string }
      if (!logWithMetrics.metrics) return false
      try {
        const metrics = JSON.parse(logWithMetrics.metrics)
        return metrics.avgTokens && metrics.avgTokens < 500 && metrics.totalCost > 0.01
      } catch {
        return false
      }
    })

    if (simpleTaskWorkflows.length > 10) {
      const estimatedSavings = simpleTaskWorkflows.reduce((sum, log) => sum + (log.totalCost || 0), 0)
      
      suggestions.push({
        id: `use-ollama-${Date.now()}`,
        type: 'USE_OLLAMA',
        priority: estimatedSavings > 5 ? 'high' : 'medium',
        current: {
          provider: 'cloud',
          cost: Math.round(estimatedSavings * 100) / 100,
          description: `${simpleTaskWorkflows.length} simple tasks using cloud AI`
        },
        suggested: {
          provider: 'ollama',
          model: 'llama3:8b',
          cost: 0,
          description: 'Run locally for free with similar quality'
        },
        monthlySavings: Math.round(estimatedSavings * 100) / 100,
        impact: 'Reduce cloud costs to $0 for simple tasks',
        howToApply: '1. Install Ollama\n2. Download llama3:8b\n3. Update workflow agents to use Ollama'
      })

      potentialSavings += estimatedSavings
    }

    // Sort suggestions by savings
    suggestions.sort((a, b) => b.monthlySavings - a.monthlySavings)

    return NextResponse.json({
      potentialSavings: Math.round(potentialSavings * 100) / 100,
      suggestions: suggestions.slice(0, 10), // Top 10 suggestions
      analyzed: {
        workflows: executionLogs.length,
        period: 'Last 30 days',
        modelsTracked: Object.keys(modelUsage).length
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Analytics Optimization] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate optimization suggestions' },
      { status: 500 }
    )
  }
}
