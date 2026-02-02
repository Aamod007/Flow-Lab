/**
 * POST /api/ai-providers/keys/[provider]/test
 * Test API key connection
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

type RouteParams = { params: Promise<{ provider: string }> }

// Test endpoints for each provider
const TEST_ENDPOINTS: Record<string, { url: string; headers: (key: string) => Record<string, string>; body?: any }> = {
  openai: {
    url: 'https://api.openai.com/v1/models',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` })
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1/models',
    headers: (key) => ({}),
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    headers: (key) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    }),
    body: {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }]
    }
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/models',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` })
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider } = await context.params
    const providerLower = provider.toLowerCase()

    // Get API key from database
    const apiKey = await db.apiKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: providerLower
        }
      }
    })

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: `No API key found for ${provider}`
      }, { status: 404 })
    }

    // Get test config for provider
    const testConfig = TEST_ENDPOINTS[providerLower]
    if (!testConfig) {
      return NextResponse.json({
        success: false,
        error: `Unknown provider: ${provider}`
      }, { status: 400 })
    }

    // Make test request
    const startTime = Date.now()
    try {
      let url = testConfig.url
      if (providerLower === 'gemini') {
        url = `${testConfig.url}?key=${apiKey.key}`
      }

      const response = await fetch(url, {
        method: testConfig.body ? 'POST' : 'GET',
        headers: testConfig.headers(apiKey.key),
        body: testConfig.body ? JSON.stringify(testConfig.body) : undefined,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const latency = Date.now() - startTime

      if (response.ok || response.status === 200) {
        return NextResponse.json({
          success: true,
          provider,
          latency,
          message: `${provider} API key is valid`
        })
      }

      // Check for specific error messages
      const errorBody = await response.text()
      let errorMessage = `API returned status ${response.status}`
      
      try {
        const errorJson = JSON.parse(errorBody)
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage
      } catch {
        // Use text error
      }

      return NextResponse.json({
        success: false,
        provider,
        error: errorMessage,
        status: response.status
      })
    } catch (fetchError) {
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return NextResponse.json({
            success: false,
            provider,
            error: 'Connection timed out'
          })
        }
        return NextResponse.json({
          success: false,
          provider,
          error: fetchError.message
        })
      }
      throw fetchError
    }
  } catch (error) {
    console.error('[API Key Test] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test API key'
    }, { status: 500 })
  }
}
