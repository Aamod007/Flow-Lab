/**
 * GET /api/ollama/models
 * List all installed Ollama models
 * 
 * POST /api/ollama/models
 * Pull (download) a new model
 */

import { NextRequest, NextResponse } from 'next/server'
import { OllamaClient, OLLAMA_AVAILABLE_MODELS } from '@/lib/ollama-client'

export async function GET() {
  try {
    const client = new OllamaClient()
    
    // First check if Ollama is connected
    const status = await client.checkConnection()
    if (!status.connected) {
      return NextResponse.json({
        models: [],
        available: OLLAMA_AVAILABLE_MODELS,
        error: 'Ollama is not running. Please start Ollama first.',
        connected: false
      })
    }

    // Get installed models
    const models = await client.listModels()

    return NextResponse.json({
      models,
      available: OLLAMA_AVAILABLE_MODELS,
      connected: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Ollama Models] Error:', error)
    return NextResponse.json({
      models: [],
      available: OLLAMA_AVAILABLE_MODELS,
      error: error instanceof Error ? error.message : 'Failed to fetch models',
      connected: false
    }, { status: 500 })
  }
}

// Pull (download) a new model
export async function POST(request: NextRequest) {
  try {
    const { model } = await request.json()

    if (!model) {
      return NextResponse.json(
        { error: 'Model name is required' },
        { status: 400 }
      )
    }

    const client = new OllamaClient()
    
    // Check connection first
    const status = await client.checkConnection()
    if (!status.connected) {
      return NextResponse.json(
        { error: 'Ollama is not running. Please start Ollama first.' },
        { status: 503 }
      )
    }

    // Return a streaming response for progress updates
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await client.pullModel(model, (progress) => {
            const data = JSON.stringify({
              model,
              progress: progress.percent || 0,
              status: progress.status,
              timestamp: new Date().toISOString()
            })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          })

          // Send completion event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            model,
            progress: 100,
            status: 'completed',
            completed: true,
            timestamp: new Date().toISOString()
          })}\n\n`))
          
          controller.close()
        } catch (error) {
          const errorData = JSON.stringify({
            model,
            error: error instanceof Error ? error.message : 'Pull failed',
            status: 'failed'
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (error) {
    console.error('[Ollama Pull] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to pull model' },
      { status: 500 }
    )
  }
}
