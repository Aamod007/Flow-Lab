// Ollama Client Library for AgentFlow
// Manages local AI model operations via Ollama API

export interface OllamaModel {
    name: string
    size: string
    digest: string
    modified_at: string
    details?: {
        format: string
        family: string
        parameter_size: string
        quantization_level: string
    }
}

export interface OllamaModelInfo {
    name: string
    description: string
    size: string
    capabilities: string[]
    recommended_for: string[]
    performance: {
        tokensPerSec: number
        avgLatency: number
    }
}

export interface OllamaGenerateRequest {
    model: string
    prompt: string
    system?: string
    temperature?: number
    max_tokens?: number
    stream?: boolean
}

export interface OllamaGenerateResponse {
    model: string
    response: string
    done: boolean
    context?: number[]
    total_duration?: number
    load_duration?: number
    prompt_eval_count?: number
    eval_count?: number
    eval_duration?: number
}

export interface PullProgress {
    status: string
    digest?: string
    total?: number
    completed?: number
    percent?: number
}

// Popular models available for download
export const OLLAMA_AVAILABLE_MODELS: OllamaModelInfo[] = [
    {
        name: 'llama3:8b',
        description: 'Meta\'s Llama 3 8B - Excellent for general tasks',
        size: '4.7GB',
        capabilities: ['General', 'Reasoning', 'Coding', 'Creative'],
        recommended_for: ['General tasks', 'Code generation', 'Creative writing'],
        performance: { tokensPerSec: 25, avgLatency: 200 }
    },
    {
        name: 'llama3.1:8b',
        description: 'Latest Llama 3.1 with improved capabilities',
        size: '4.7GB',
        capabilities: ['General', 'Reasoning', 'Coding', 'Analysis'],
        recommended_for: ['Complex reasoning', 'Analysis', 'Code review'],
        performance: { tokensPerSec: 23, avgLatency: 220 }
    },
    {
        name: 'mistral:7b',
        description: 'Fast and efficient model from Mistral AI',
        size: '4.1GB',
        capabilities: ['General', 'Coding', 'Fast'],
        recommended_for: ['Quick tasks', 'Code completion', 'Summaries'],
        performance: { tokensPerSec: 35, avgLatency: 150 }
    },
    {
        name: 'codellama:13b',
        description: 'Specialized for code generation and understanding',
        size: '7.4GB',
        capabilities: ['Coding', 'Debugging', 'Code Explanation'],
        recommended_for: ['Code generation', 'Bug fixing', 'Code review'],
        performance: { tokensPerSec: 18, avgLatency: 300 }
    },
    {
        name: 'phi3:mini',
        description: 'Microsoft\'s small but capable model',
        size: '2.2GB',
        capabilities: ['General', 'Fast', 'Lightweight'],
        recommended_for: ['Quick responses', 'Simple tasks', 'Testing'],
        performance: { tokensPerSec: 50, avgLatency: 100 }
    },
    {
        name: 'gemma:7b',
        description: 'Google\'s open model for general use',
        size: '5.0GB',
        capabilities: ['General', 'Reasoning', 'QA'],
        recommended_for: ['Question answering', 'Summarization', 'General chat'],
        performance: { tokensPerSec: 28, avgLatency: 180 }
    },
    {
        name: 'mixtral:8x7b',
        description: 'Mixture of Experts model with strong performance',
        size: '26GB',
        capabilities: ['Advanced', 'Reasoning', 'Multi-task'],
        recommended_for: ['Complex tasks', 'Multi-step reasoning', 'Analysis'],
        performance: { tokensPerSec: 15, avgLatency: 400 }
    },
    {
        name: 'deepseek-coder:6.7b',
        description: 'Specialized coding model from DeepSeek',
        size: '3.8GB',
        capabilities: ['Coding', 'Fast', 'Multi-language'],
        recommended_for: ['Code generation', 'Multiple languages', 'Refactoring'],
        performance: { tokensPerSec: 40, avgLatency: 130 }
    }
]

const DEFAULT_OLLAMA_URL = 'http://localhost:11434'

export class OllamaClient {
    private baseUrl: string

    constructor(baseUrl: string = DEFAULT_OLLAMA_URL) {
        this.baseUrl = baseUrl
    }

    /**
     * Check if Ollama server is running and accessible
     */
    async checkConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/version`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            })

            if (response.ok) {
                const data = await response.json()
                return { connected: true, version: data.version }
            }

            return { connected: false, error: 'Server returned non-OK status' }
        } catch (error) {
            return {
                connected: false,
                error: error instanceof Error ? error.message : 'Connection failed'
            }
        }
    }

    /**
     * List all locally installed models
     */
    async listModels(): Promise<OllamaModel[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET'
            })

            if (!response.ok) {
                throw new Error(`Failed to list models: ${response.statusText}`)
            }

            const data = await response.json()
            return data.models || []
        } catch (error) {
            console.error('Error listing Ollama models:', error)
            return []
        }
    }

    /**
     * Get detailed information about a specific model
     */
    async getModelInfo(modelName: string): Promise<OllamaModelInfo | null> {
        try {
            const response = await fetch(`${this.baseUrl}/api/show`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
            })

            if (!response.ok) {
                return null
            }

            const data = await response.json()

            // Find matching model info from our predefined list
            const knownModel = OLLAMA_AVAILABLE_MODELS.find(m =>
                modelName.startsWith(m.name.split(':')[0])
            )

            return knownModel || {
                name: modelName,
                description: data.modelfile?.split('\n')[0] || 'Custom model',
                size: 'Unknown',
                capabilities: ['General'],
                recommended_for: ['General tasks'],
                performance: { tokensPerSec: 20, avgLatency: 250 }
            }
        } catch (error) {
            console.error('Error getting model info:', error)
            return null
        }
    }

    /**
     * Pull/download a model from Ollama registry
     */
    async pullModel(
        modelName: string,
        onProgress?: (progress: PullProgress) => void
    ): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName, stream: true })
            })

            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.statusText}`)
            }

            const reader = response.body?.getReader()
            if (!reader) {
                throw new Error('No response body')
            }

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()

                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const progress = JSON.parse(line) as PullProgress

                            // Calculate percentage if total and completed are provided
                            if (progress.total && progress.completed) {
                                progress.percent = Math.round((progress.completed / progress.total) * 100)
                            }

                            onProgress?.(progress)
                        } catch {
                            // Skip invalid JSON lines
                        }
                    }
                }
            }

            return true
        } catch (error) {
            console.error('Error pulling model:', error)
            return false
        }
    }

    /**
     * Delete a locally installed model
     */
    async deleteModel(modelName: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
            })

            return response.ok
        } catch (error) {
            console.error('Error deleting model:', error)
            return false
        }
    }

    /**
     * Generate a completion (non-streaming)
     */
    async generate(request: OllamaGenerateRequest): Promise<OllamaGenerateResponse | null> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...request,
                    stream: false,
                    options: {
                        temperature: request.temperature ?? 0.7,
                        num_predict: request.max_tokens ?? 1024
                    }
                })
            })

            if (!response.ok) {
                throw new Error(`Generation failed: ${response.statusText}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error generating:', error)
            return null
        }
    }

    /**
     * Generate a completion with streaming
     */
    async generateStream(
        request: OllamaGenerateRequest,
        onToken: (token: string) => void,
        onComplete?: (response: OllamaGenerateResponse) => void
    ): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...request,
                    stream: true,
                    options: {
                        temperature: request.temperature ?? 0.7,
                        num_predict: request.max_tokens ?? 1024
                    }
                })
            })

            if (!response.ok) {
                throw new Error(`Generation failed: ${response.statusText}`)
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response body')

            const decoder = new TextDecoder()
            let buffer = ''
            let fullResponse = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const chunk = JSON.parse(line) as OllamaGenerateResponse

                            if (chunk.response) {
                                fullResponse += chunk.response
                                onToken(chunk.response)
                            }

                            if (chunk.done) {
                                onComplete?.({
                                    ...chunk,
                                    response: fullResponse
                                })
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in stream generation:', error)
            throw error
        }
    }

    /**
     * Test model performance (simple benchmark)
     */
    async benchmarkModel(modelName: string): Promise<{
        tokensPerSec: number
        avgLatency: number
    } | null> {
        const testPrompt = 'Explain what a neural network is in 50 words.'

        const startTime = performance.now()
        const response = await this.generate({
            model: modelName,
            prompt: testPrompt,
            max_tokens: 100
        })
        const endTime = performance.now()

        if (!response) return null

        const totalTime = endTime - startTime
        const tokenCount = response.eval_count || 50 // Estimate if not provided
        const tokensPerSec = Math.round((tokenCount / totalTime) * 1000)

        return {
            tokensPerSec,
            avgLatency: Math.round(totalTime / tokenCount)
        }
    }
}

// Singleton instance
let ollamaClientInstance: OllamaClient | null = null

export const getOllamaClient = (baseUrl?: string): OllamaClient => {
    if (!ollamaClientInstance || baseUrl) {
        ollamaClientInstance = new OllamaClient(baseUrl)
    }
    return ollamaClientInstance
}

// Storage key for Ollama settings
const OLLAMA_SETTINGS_KEY = 'agentflow_ollama_settings'

export interface OllamaSettings {
    baseUrl: string
    autoConnect: boolean
    preferredModels: string[]
}

export const getOllamaSettings = (): OllamaSettings => {
    if (typeof window === 'undefined') {
        return { baseUrl: DEFAULT_OLLAMA_URL, autoConnect: true, preferredModels: [] }
    }

    const stored = localStorage.getItem(OLLAMA_SETTINGS_KEY)
    if (stored) {
        try {
            return JSON.parse(stored)
        } catch {
            // Return defaults
        }
    }

    return { baseUrl: DEFAULT_OLLAMA_URL, autoConnect: true, preferredModels: [] }
}

export const saveOllamaSettings = (settings: OllamaSettings): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem(OLLAMA_SETTINGS_KEY, JSON.stringify(settings))
}

// Track model usage
const MODEL_USAGE_KEY = 'agentflow_ollama_usage'

export interface ModelUsageRecord {
    modelName: string
    lastUsed: string
    totalRuns: number
    totalTokens: number
}

export const recordModelUsage = (
    modelName: string,
    tokens: number
): void => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(MODEL_USAGE_KEY)
    const usage: Record<string, ModelUsageRecord> = stored ? JSON.parse(stored) : {}

    if (usage[modelName]) {
        usage[modelName].lastUsed = new Date().toISOString()
        usage[modelName].totalRuns += 1
        usage[modelName].totalTokens += tokens
    } else {
        usage[modelName] = {
            modelName,
            lastUsed: new Date().toISOString(),
            totalRuns: 1,
            totalTokens: tokens
        }
    }

    localStorage.setItem(MODEL_USAGE_KEY, JSON.stringify(usage))
}

export const getModelUsage = (): Record<string, ModelUsageRecord> => {
    if (typeof window === 'undefined') return {}

    const stored = localStorage.getItem(MODEL_USAGE_KEY)
    return stored ? JSON.parse(stored) : {}
}
