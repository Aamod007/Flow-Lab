/**
 * GET/POST /api/ai-providers/keys
 * Manage AI provider API keys
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

// Mask API key for display (show first 4 and last 4 characters)
function maskApiKey(key: string): string {
  if (key.length <= 12) {
    return '•'.repeat(key.length)
  }
  return `${key.slice(0, 4)}${'•'.repeat(20)}${key.slice(-4)}`
}

// Validate API key format based on provider
function validateKeyFormat(provider: string, key: string): boolean {
  const patterns: Record<string, RegExp> = {
    openai: /^sk-[a-zA-Z0-9]{32,}$/,
    gemini: /^AIza[a-zA-Z0-9_-]{35,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9_-]{32,}$/,
    groq: /^gsk_[a-zA-Z0-9]{32,}$/
  }
  
  const pattern = patterns[provider.toLowerCase()]
  if (!pattern) return true // Allow unknown providers
  return pattern.test(key)
}

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const apiKeys = await db.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        key: true,
        isActive: true
      }
    })

    // Mask keys before sending
    const maskedKeys = apiKeys.map(key => ({
      id: key.id,
      provider: key.provider,
      maskedKey: maskApiKey(key.key),
      isActive: key.isActive,
      hasKey: true
    }))

    return NextResponse.json({ keys: maskedKeys })
  } catch (error) {
    console.error('[API Keys GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { provider, key } = await request.json()

    if (!provider || !key) {
      return NextResponse.json(
        { error: 'Provider and key are required' },
        { status: 400 }
      )
    }

    // Validate key format
    if (!validateKeyFormat(provider, key)) {
      return NextResponse.json(
        { error: `Invalid API key format for ${provider}` },
        { status: 400 }
      )
    }

    // Upsert API key (update if exists, create if not)
    const apiKey = await db.apiKey.upsert({
      where: {
        userId_provider: {
          userId,
          provider: provider.toLowerCase()
        }
      },
      update: {
        key,
        isActive: true
      },
      create: {
        userId,
        provider: provider.toLowerCase(),
        key,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      id: apiKey.id,
      provider: apiKey.provider,
      maskedKey: maskApiKey(apiKey.key),
      isActive: apiKey.isActive
    })
  } catch (error) {
    console.error('[API Keys POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save API key' },
      { status: 500 }
    )
  }
}
