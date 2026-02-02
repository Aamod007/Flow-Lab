/**
 * POST /api/test/greeting-workflow
 * 
 * Test endpoint to send a greeting to Slack and store in Notion
 * 
 * Body:
 * - message: string (optional, defaults to "Hello from AgentFlow!")
 * - slackChannel: string (Slack channel ID)
 * - notionDatabaseId: string (Notion database ID)
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTestSlackMessage } from '@/app/(main)/(pages)/connections/_actions/slack-connection'
import { onCreateNewPageInDatabase } from '@/app/(main)/(pages)/connections/_actions/notion-connection'

export async function POST(request: NextRequest) {
  const logs: string[] = []
  
  try {
    const body = await request.json()
    const {
      message = '👋 Hello from AgentFlow! This is a test greeting message.',
      slackChannel,
      notionDatabaseId
    } = body

    logs.push(`🚀 Starting Greeting Workflow Test`)
    logs.push(`📝 Message: "${message}"`)

    // Step 1: Send to Slack
    if (slackChannel) {
      logs.push(`📤 Sending to Slack channel: ${slackChannel}`)
      
      try {
        const slackResult = await sendTestSlackMessage(slackChannel, message)
        
        if (slackResult.success) {
          logs.push(`✅ Slack: Message sent successfully!`)
        } else {
          logs.push(`⚠️ Slack: ${slackResult.message}`)
        }
      } catch (error) {
        logs.push(`❌ Slack Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      logs.push(`⏭️ Slack: Skipped (no channel provided)`)
    }

    // Step 2: Store in Notion
    if (notionDatabaseId) {
      logs.push(`📤 Creating Notion page in database: ${notionDatabaseId}`)
      
      try {
        const timestamp = new Date().toLocaleString()
        const notionContent = `${message}\n\n📅 Sent at: ${timestamp}`
        
        await onCreateNewPageInDatabase(
          notionDatabaseId,
          undefined, // Will use NOTION_API_SECRET from env
          notionContent
        )
        
        logs.push(`✅ Notion: Page created successfully!`)
      } catch (error) {
        logs.push(`❌ Notion Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      logs.push(`⏭️ Notion: Skipped (no database ID provided)`)
    }

    logs.push(`🎉 Workflow completed!`)

    return NextResponse.json({
      success: true,
      message: 'Greeting workflow executed',
      logs,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logs.push(`❌ Fatal Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Workflow failed',
      logs,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// GET endpoint to show usage instructions
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/test/greeting-workflow',
    method: 'POST',
    description: 'Test workflow that sends a greeting to Slack and stores it in Notion',
    body: {
      message: '(optional) The greeting message to send',
      slackChannel: '(required for Slack) The Slack channel ID (e.g., C1234567890)',
      notionDatabaseId: '(required for Notion) The Notion database ID'
    },
    example: {
      message: 'Hello from AgentFlow! 🚀',
      slackChannel: 'C1234567890',
      notionDatabaseId: 'abc123def456'
    },
    envRequired: [
      'SLACK_BOT_TOKEN - Slack Bot OAuth token',
      'NOTION_API_SECRET - Notion API integration token'
    ]
  })
}
