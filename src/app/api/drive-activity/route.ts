import { google } from 'googleapis'
import { auth, clerkClient } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Google Drive Activity route - works without database

export async function GET() {
  // Validate environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.OAUTH2_REDIRECT_URI) {
    return NextResponse.json({ message: 'Missing Google OAuth configuration' }, { status: 500 })
  }

  if (!process.env.NGROK_URI) {
    return NextResponse.json({ message: 'Missing NGROK_URI configuration' }, { status: 500 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH2_REDIRECT_URI
  )

  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ message: 'User not found' }, { status: 401 })
  }

  try {
    const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
      userId,
      'oauth_google'
    )

    const accessToken = clerkResponse[0].token
    oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const drive = google.drive({
      version: 'v3',
      auth: oauth2Client,
    })

    const channelId = uuidv4()

    const startPageTokenRes = await drive.changes.getStartPageToken({})
    const startPageToken = startPageTokenRes.data.startPageToken

    if (startPageToken === null || startPageToken === undefined) {
      return NextResponse.json({ message: 'Failed to get start page token from Google Drive' }, { status: 500 })
    }

    const listener = await drive.changes.watch({
      pageToken: startPageToken,
      supportsAllDrives: true,
      supportsTeamDrives: true,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: `${process.env.NGROK_URI}/api/drive-activity/notification`,
        kind: 'api#channel',
      },
    })

    if (listener.status === 200) {
      return new NextResponse('Listening to changes...')
    }

    return NextResponse.json({ message: 'Failed to create listener' }, { status: 500 })
  } catch (error) {
    console.error('Error setting up Google Drive activity listener:', error)
    return NextResponse.json({
      message: 'Failed to set up Google Drive listener',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
