/**
 * Vector Store
 * 
 * In-memory and persistent vector storage for embeddings
 * Supports semantic search and similarity queries
 */

import { EmbeddingService } from './embedding-service'

export interface VectorDocument {
  id: string
  text: string
  embedding: number[]
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface SearchOptions {
  topK?: number
  minScore?: number
  filter?: (doc: VectorDocument) => boolean
}

export interface SearchResult {
  document: VectorDocument
  score: number
}

/**
 * In-Memory Vector Store
 */
export class InMemoryVectorStore {
  private documents: Map<string, VectorDocument> = new Map()

  /**
   * Add a document to the store
   */
  async add(document: VectorDocument): Promise<void> {
    this.documents.set(document.id, {
      ...document,
      updatedAt: new Date(),
    })
  }

  /**
   * Add multiple documents in batch
   */
  async addBatch(documents: VectorDocument[]): Promise<void> {
    for (const doc of documents) {
      await this.add(doc)
    }
  }

  /**
   * Get a document by ID
   */
  async get(id: string): Promise<VectorDocument | null> {
    return this.documents.get(id) || null
  }

  /**
   * Delete a document by ID
   */
  async delete(id: string): Promise<boolean> {
    return this.documents.delete(id)
  }

  /**
   * Search for similar documents
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const { topK = 5, minScore = 0, filter } = options

    let documents = Array.from(this.documents.values())

    // Apply filter if provided
    if (filter) {
      documents = documents.filter(filter)
    }

    // Calculate similarities
    const results = documents.map(doc => ({
      document: doc,
      score: EmbeddingService.cosineSimilarity(queryEmbedding, doc.embedding),
    }))

    // Filter by minimum score
    const filtered = results.filter(r => r.score >= minScore)

    // Sort by score (descending)
    filtered.sort((a, b) => b.score - a.score)

    return filtered.slice(0, topK)
  }

  /**
   * Get all documents
   */
  async getAll(): Promise<VectorDocument[]> {
    return Array.from(this.documents.values())
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    this.documents.clear()
  }

  /**
   * Get store size
   */
  size(): number {
    return this.documents.size
  }

  /**
   * Export store to JSON
   */
  toJSON(): string {
    return JSON.stringify(Array.from(this.documents.values()))
  }

  /**
   * Import store from JSON
   */
  fromJSON(json: string): void {
    const documents = JSON.parse(json) as VectorDocument[]
    this.documents.clear()
    documents.forEach(doc => {
      this.documents.set(doc.id, {
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      })
    })
  }
}

/**
 * Database-backed Vector Store (using Prisma)
 */
export class DatabaseVectorStore {
  private tableName: string

  constructor(tableName: string = 'embeddings') {
    this.tableName = tableName
  }

  /**
   * Add a document to the database
   * Note: Requires a database table with vector support (e.g., pgvector for PostgreSQL)
   */
  async add(document: VectorDocument): Promise<void> {
    // This is a placeholder - implement based on your database setup
    // For PostgreSQL with pgvector:
    // await db.$executeRaw`
    //   INSERT INTO ${this.tableName} (id, text, embedding, metadata, created_at, updated_at)
    //   VALUES (${document.id}, ${document.text}, ${document.embedding}::vector, ${document.metadata}, NOW(), NOW())
    //   ON CONFLICT (id) DO UPDATE SET
    //     text = EXCLUDED.text,
    //     embedding = EXCLUDED.embedding,
    //     metadata = EXCLUDED.metadata,
    //     updated_at = NOW()
    // `
    throw new Error('DatabaseVectorStore.add() not implemented - requires database with vector support')
  }

  /**
   * Search for similar documents using database vector search
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const { topK = 5, minScore = 0 } = options

    // This is a placeholder - implement based on your database setup
    // For PostgreSQL with pgvector:
    // const results = await db.$queryRaw`
    //   SELECT id, text, embedding, metadata, created_at, updated_at,
    //          1 - (embedding <=> ${queryEmbedding}::vector) as score
    //   FROM ${this.tableName}
    //   WHERE 1 - (embedding <=> ${queryEmbedding}::vector) >= ${minScore}
    //   ORDER BY embedding <=> ${queryEmbedding}::vector
    //   LIMIT ${topK}
    // `
    throw new Error('DatabaseVectorStore.search() not implemented - requires database with vector support')
  }
}

/**
 * Semantic Search Helper
 */
export class SemanticSearch {
  private embeddingService: EmbeddingService
  private vectorStore: InMemoryVectorStore

  constructor(embeddingService: EmbeddingService, vectorStore?: InMemoryVectorStore) {
    this.embeddingService = embeddingService
    this.vectorStore = vectorStore || new InMemoryVectorStore()
  }

  /**
   * Index a document for semantic search
   */
  async indexDocument(
    id: string,
    text: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const result = await this.embeddingService.embed(text)

    await this.vectorStore.add({
      id,
      text,
      embedding: result.embedding,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * Index multiple documents in batch
   */
  async indexDocuments(
    documents: Array<{ id: string; text: string; metadata?: Record<string, unknown> }>
  ): Promise<void> {
    const texts = documents.map(d => d.text)
    const embeddings = await this.embeddingService.embedBatch(texts)

    const vectorDocs = documents.map((doc, i) => ({
      id: doc.id,
      text: doc.text,
      embedding: embeddings[i].embedding,
      metadata: doc.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    await this.vectorStore.addBatch(vectorDocs)
  }

  /**
   * Search for similar documents using natural language query
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const queryResult = await this.embeddingService.embed(query)
    return this.vectorStore.search(queryResult.embedding, options)
  }

  /**
   * Get the vector store
   */
  getStore(): InMemoryVectorStore {
    return this.vectorStore
  }
}

/**
 * Utility: Create a semantic search instance from environment
 */
export async function createSemanticSearch(): Promise<SemanticSearch> {
  const { createEmbeddingService } = await import('./embedding-service')
  const embeddingService = await createEmbeddingService()
  return new SemanticSearch(embeddingService)
}
