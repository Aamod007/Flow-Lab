/**
 * GET /api/ollama/status
 * Check if Ollama is running and return connection info
 */

import { NextResponse } from 'next/server'
import { OllamaClient } from '@/lib/ollama-client'

export async function GET() {
  try {
    const client = new OllamaClient()
    const connectionStatus = await client.checkConnection()

    return NextResponse.json({
      connected: connectionStatus.connected,
      version: connectionStatus.version || null,
      url: 'http://localhost:11434',
      error: connectionStatus.error || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Ollama Status] Error:', error)
    return NextResponse.json({
      connected: false,
      version: null,
      url: 'http://localhost:11434',
      error: error instanceof Error ? error.message : 'Failed to check Ollama status',
      timestamp: new Date().toISOString()
    })
  }
}
