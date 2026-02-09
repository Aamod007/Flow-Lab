import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { createSemanticSearch } from '@/lib/vector-store'

// In-memory store for demo purposes
// In production, use a persistent vector database
const searchInstances = new Map<string, any>()

/**
 * POST /api/semantic-search/index
 * Index documents for semantic search
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
    const { documents, collectionId } = body

    // Validate input
    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: 'Documents array is required' },
        { status: 400 }
      )
    }

    const collection = collectionId || 'default'
    const storeKey = `${userId}:${collection}`

    // Get or create semantic search instance
    let semanticSearch = searchInstances.get(storeKey)
    if (!semanticSearch) {
      semanticSearch = await createSemanticSearch()
      searchInstances.set(storeKey, semanticSearch)
    }

    // Index documents
    await semanticSearch.indexDocuments(documents)

    return NextResponse.json({
      success: true,
      indexed: documents.length,
      collection,
    })
  } catch (error) {
    console.error('Semantic search indexing error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to index documents',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/semantic-search
 * Search indexed documents
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('query')
    const collectionId = searchParams.get('collection') || 'default'
    const topK = parseInt(searchParams.get('topK') || '5')
    const minScore = parseFloat(searchParams.get('minScore') || '0')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const storeKey = `${userId}:${collectionId}`
    const semanticSearch = searchInstances.get(storeKey)

    if (!semanticSearch) {
      return NextResponse.json(
        { error: 'Collection not found. Please index documents first.' },
        { status: 404 }
      )
    }

    // Perform search
    const results = await semanticSearch.search(query, { topK, minScore })

    return NextResponse.json({
      query,
      results: results.map((r: { document: { id: string; text: string; metadata?: Record<string, unknown> }; score: number }) => ({
        id: r.document.id,
        text: r.document.text,
        score: r.score,
        metadata: r.document.metadata,
      })),
      count: results.length,
    })
  } catch (error) {
    console.error('Semantic search error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 }
    )
  }
}
