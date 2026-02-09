/**
 * Embedding Service
 * 
 * Provides text embedding functionality using multiple AI providers
 * Supports: OpenAI, Google Gemini, and local models via Ollama
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export type EmbeddingProvider = 'openai' | 'gemini' | 'ollama'

export interface EmbeddingConfig {
  provider: EmbeddingProvider
  apiKey?: string
  model?: string
  dimensions?: number
}

export interface EmbeddingResult {
  embedding: number[]
  dimensions: number
  provider: EmbeddingProvider
  model: string
  tokens?: number
}

export interface SimilarityResult {
  text: string
  score: number
  metadata?: Record<string, unknown>
}

/**
 * Main Embedding Service Class
 */
export class EmbeddingService {
  private config: EmbeddingConfig

  constructor(config: EmbeddingConfig) {
    this.config = config
  }

  /**
   * Generate embeddings for a single text
   */
  async embed(text: string): Promise<EmbeddingResult> {
    switch (this.config.provider) {
      case 'openai':
        return this.embedWithOpenAI(text)
      case 'gemini':
        return this.embedWithGemini(text)
      case 'ollama':
        return this.embedWithOllama(text)
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`)
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    // Process in parallel for better performance
    return Promise.all(texts.map(text => this.embed(text)))
  }

  /**
   * OpenAI Embeddings
   */
  private async embedWithOpenAI(text: string): Promise<EmbeddingResult> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is required')
    }

    const model = this.config.model || 'text-embedding-3-small'
    const dimensions = this.config.dimensions || 1536

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model,
        dimensions: model === 'text-embedding-3-small' || model === 'text-embedding-3-large' 
          ? dimensions 
          : undefined,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()

    return {
      embedding: data.data[0].embedding,
      dimensions: data.data[0].embedding.length,
      provider: 'openai',
      model,
      tokens: data.usage?.total_tokens,
    }
  }

  /**
   * Google Gemini Embeddings
   */
  private async embedWithGemini(text: string): Promise<EmbeddingResult> {
    if (!this.config.apiKey) {
      throw new Error('Gemini API key is required')
    }

    const genAI = new GoogleGenerativeAI(this.config.apiKey)
    const model = this.config.model || 'text-embedding-004'

    try {
      const embeddingModel = genAI.getGenerativeModel({ model })
      const result = await embeddingModel.embedContent(text)

      return {
        embedding: result.embedding.values,
        dimensions: result.embedding.values.length,
        provider: 'gemini',
        model,
      }
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Ollama Local Embeddings
   */
  private async embedWithOllama(text: string): Promise<EmbeddingResult> {
    const model = this.config.model || 'nomic-embed-text'
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

    const response = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      embedding: data.embedding,
      dimensions: data.embedding.length,
      provider: 'ollama',
      model,
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimensions')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Find most similar texts from a collection
   */
  static findMostSimilar(
    queryEmbedding: number[],
    documents: Array<{ text: string; embedding: number[]; metadata?: Record<string, unknown> }>,
    topK: number = 5
  ): SimilarityResult[] {
    const similarities = documents.map(doc => ({
      text: doc.text,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding),
      metadata: doc.metadata,
    }))

    // Sort by similarity score (descending)
    similarities.sort((a, b) => b.score - a.score)

    return similarities.slice(0, topK)
  }
}

/**
 * Utility function to chunk text for embedding
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 512,
  overlap: number = 50
): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += maxChunkSize - overlap) {
    const chunk = words.slice(i, i + maxChunkSize).join(' ')
    chunks.push(chunk)
  }

  return chunks
}

/**
 * Factory function to create embedding service from environment
 */
export async function createEmbeddingService(
  provider?: EmbeddingProvider
): Promise<EmbeddingService> {
  const selectedProvider = provider || (process.env.EMBEDDING_PROVIDER as EmbeddingProvider) || 'openai'

  let apiKey: string | undefined

  switch (selectedProvider) {
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY
      break
    case 'gemini':
      apiKey = process.env.GEMINI_API_KEY
      break
    case 'ollama':
      // Ollama doesn't need an API key
      break
    default:
      throw new Error(`Unknown provider: ${selectedProvider}`)
  }

  return new EmbeddingService({
    provider: selectedProvider,
    apiKey,
  })
}
