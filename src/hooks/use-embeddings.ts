import { useState } from 'react'

export interface EmbeddingOptions {
  provider?: 'openai' | 'gemini' | 'ollama'
  model?: string
}

export interface EmbeddingResult {
  embedding: number[]
  dimensions: number
  provider: string
  model: string
  tokens?: number
}

export interface SemanticSearchResult {
  id: string
  text: string
  score: number
  metadata?: Record<string, unknown>
}

/**
 * Hook for generating embeddings
 */
export function useEmbeddings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateEmbedding = async (
    text: string,
    options?: EmbeddingOptions
  ): Promise<EmbeddingResult | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          provider: options?.provider,
          model: options?.model,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate embedding')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const generateEmbeddings = async (
    texts: string[],
    options?: EmbeddingOptions
  ): Promise<{ embeddings: number[][]; dimensions: number } | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts,
          provider: options?.provider,
          model: options?.model,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate embeddings')
      }

      const data = await response.json()
      return {
        embeddings: data.embeddings,
        dimensions: data.dimensions,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    generateEmbedding,
    generateEmbeddings,
    loading,
    error,
  }
}

/**
 * Hook for semantic search
 */
export function useSemanticSearch() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const indexDocuments = async (
    documents: Array<{ id: string; text: string; metadata?: Record<string, unknown> }>,
    collectionId?: string
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documents,
          collectionId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to index documents')
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const search = async (
    query: string,
    options?: {
      collection?: string
      topK?: number
      minScore?: number
    }
  ): Promise<SemanticSearchResult[]> => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        query,
        ...(options?.collection && { collection: options.collection }),
        ...(options?.topK && { topK: options.topK.toString() }),
        ...(options?.minScore && { minScore: options.minScore.toString() }),
      })

      const response = await fetch(`/api/semantic-search?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const data = await response.json()
      return data.results
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    indexDocuments,
    search,
    loading,
    error,
  }
}
