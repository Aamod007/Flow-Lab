import { postContentToWebHook } from '@/app/(main)/(pages)/connections/_actions/discord-connection'
import { onCreateNewPageInDatabase } from '@/app/(main)/(pages)/connections/_actions/notion-connection'
import { postMessageToSlack } from '@/app/(main)/(pages)/connections/_actions/slack-connection'
import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

// Google Drive notification webhook - demo mode without database

export async function POST(req: NextRequest) {
  const headersList = headers()
  let channelResourceId: string | undefined

  headersList.forEach((value, key) => {
    if (key == 'x-goog-resource-id') {
      channelResourceId = value
    }
  })

  if (channelResourceId) {
    // Process the notification
    // In demo mode, we just log the notification
    // A real implementation would fetch workflows from database
    return Response.json(
      {
        message: 'Notification received (demo mode)',
      },
      {
        status: 200,
      }
    )
  }

  return Response.json(
    {
      message: 'success',
    },
    {
      status: 200,
    }
  )
}
