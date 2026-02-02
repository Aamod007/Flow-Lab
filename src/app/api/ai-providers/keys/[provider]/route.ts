/**
 * GET/PUT/DELETE /api/ai-providers/keys/[provider]
 * Manage specific provider API key
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

type RouteParams = { params: Promise<{ provider: string }> }

// Mask API key for display
function maskApiKey(key: string): string {
  if (key.length <= 12) return '•'.repeat(key.length)
  return `${key.slice(0, 4)}${'•'.repeat(20)}${key.slice(-4)}`
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider } = await context.params

    const apiKey = await db.apiKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: provider.toLowerCase()
        }
      }
    })

    if (!apiKey) {
      return NextResponse.json({ hasKey: false, provider })
    }

    return NextResponse.json({
      id: apiKey.id,
      provider: apiKey.provider,
      maskedKey: maskApiKey(apiKey.key),
      isActive: apiKey.isActive,
      hasKey: true
    })
  } catch (error) {
    console.error('[API Key GET] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch API key' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider } = await context.params
    const { key, isActive } = await request.json()

    const updateData: any = {}
    if (key) updateData.key = key
    if (isActive !== undefined) updateData.isActive = isActive

    const apiKey = await db.apiKey.update({
      where: {
        userId_provider: {
          userId,
          provider: provider.toLowerCase()
        }
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      id: apiKey.id,
      provider: apiKey.provider,
      maskedKey: maskApiKey(apiKey.key),
      isActive: apiKey.isActive
    })
  } catch (error) {
    console.error('[API Key PUT] Error:', error)
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider } = await context.params

    await db.apiKey.delete({
      where: {
        userId_provider: {
          userId,
          provider: provider.toLowerCase()
        }
      }
    })

    return NextResponse.json({ success: true, provider })
  } catch (error) {
    console.error('[API Key DELETE] Error:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}
