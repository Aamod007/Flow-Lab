import { google } from 'googleapis'
import { auth, clerkClient } from '@clerk/nextjs'
import { getRequiredEnvVar } from '@/lib/env-validator'
import { ApiErrorHandler, createSuccessResponse, logError } from '@/lib/api-response'

// Google Drive API route - works without database

export async function GET() {
  try {
    // Validate environment variables
    const googleClientId = getRequiredEnvVar('GOOGLE_CLIENT_ID')
    const googleClientSecret = getRequiredEnvVar('GOOGLE_CLIENT_SECRET')
    const redirectUri = getRequiredEnvVar('OAUTH2_REDIRECT_URI')

    const oauth2Client = new google.auth.OAuth2(
      googleClientId,
      googleClientSecret,
      redirectUri
    )

    const { userId } = auth()
    if (!userId) {
      return ApiErrorHandler.unauthorized('User not found')
    }

    const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
      userId,
      'oauth_google'
    )

    if (!clerkResponse || clerkResponse.length === 0) {
      return ApiErrorHandler.unauthorized('Google OAuth token not found')
    }

    const accessToken = clerkResponse[0].token
    oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const drive = google.drive({
      version: 'v3',
      auth: oauth2Client,
    })

    const response = await drive.files.list()

    if (response && response.data) {
      return createSuccessResponse({
        message: response.data,
      })
    }

    return createSuccessResponse({
      message: 'No files found',
    })
  } catch (error) {
    logError('Google Drive GET', error)
    
    if (error instanceof Error && error.message.includes('Missing required environment variable')) {
      return ApiErrorHandler.missingConfig(error.message)
    }
    
    return ApiErrorHandler.internalError('Failed to fetch Google Drive files')
  }
}
