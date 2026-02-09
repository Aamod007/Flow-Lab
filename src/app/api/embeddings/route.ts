import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { EmbeddingService, EmbeddingProvider } from '@/lib/embedding-service'
import { db } from '@/lib/db'

/**
 * POST /api/embeddings
 * Generate embeddings for text
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { text, texts, provider, model } = body

    // Validate input
    if (!text && !texts) {
      return NextResponse.json(
        { error: 'Either "text" or "texts" is required' },
        { status: 400 }
      )
    }

    if (text && texts) {
      return NextResponse.json(
        { error: 'Provide either "text" or "texts", not both' },
        { status: 400 }
      )
    }

    // Get API key from database
    const apiKey = await getApiKeyForProvider(userId, provider || 'openai')

    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not found for provider: ${provider || 'openai'}` },
        { status: 400 }
      )
    }

    // Create embedding service
    const embeddingService = new EmbeddingService({
      provider: (provider as EmbeddingProvider) || 'openai',
      apiKey,
      model,
    })

    // Generate embeddings
    if (text) {
      const result = await embeddingService.embed(text)
      return NextResponse.json({
        embedding: result.embedding,
        dimensions: result.dimensions,
        provider: result.provider,
        model: result.model,
        tokens: result.tokens,
      })
    } else {
      const results = await embeddingService.embedBatch(texts)
      return NextResponse.json({
        embeddings: results.map(r => r.embedding),
        dimensions: results[0]?.dimensions,
        provider: results[0]?.provider,
        model: results[0]?.model,
        count: results.length,
      })
    }
  } catch (error) {
    console.error('Embedding API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate embeddings',
      },
      { status: 500 }
    )
  }
}

/**
 * Helper: Get API key for a provider from database
 */
async function getApiKeyForProvider(
  userId: string,
  provider: string
): Promise<string | null> {
  try {
    const apiKey = await db.apiKey.findFirst({
      where: {
        userId,
        provider,
      },
      select: {
        key: true,
      },
    })

    return apiKey?.key || null
  } catch (error) {
    console.error('Error fetching API key:', error)
    return null
  }
}
