/**
 * GET /api/test/slack-channels
 * 
 * Get list of Slack channels the bot has access to
 */

import { NextResponse } from 'next/server'
import { listBotChannels } from '@/app/(main)/(pages)/connections/_actions/slack-connection'

export async function GET() {
  try {
    const channels = await listBotChannels()
    
    return NextResponse.json({
      success: true,
      channels,
      count: channels.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list channels',
      channels: []
    }, { status: 500 })
  }
}
