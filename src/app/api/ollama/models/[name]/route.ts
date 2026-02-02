/**
 * DELETE /api/ollama/models/[name]
 * Delete an installed Ollama model
 * 
 * GET /api/ollama/models/[name]
 * Get detailed information about a specific model
 */

import { NextRequest, NextResponse } from 'next/server'
import { OllamaClient } from '@/lib/ollama-client'

type RouteParams = { params: Promise<{ name: string }> }

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { name } = await context.params
    const modelName = decodeURIComponent(name)

    if (!modelName) {
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

    // Delete the model
    await client.deleteModel(modelName)

    return NextResponse.json({
      success: true,
      model: modelName,
      message: `Model ${modelName} deleted successfully`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Ollama Delete] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete model',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { name } = await context.params
    const modelName = decodeURIComponent(name)

    if (!modelName) {
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

    // Get model info
    const modelInfo = await client.getModelInfo(modelName)

    return NextResponse.json({
      model: modelName,
      info: modelInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Ollama Model Info] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get model info' },
      { status: 500 }
    )
  }
}
