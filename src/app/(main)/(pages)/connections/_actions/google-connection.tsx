'use server'
import clerk from '@clerk/clerk-sdk-node'
import { auth } from '@clerk/nextjs'
import { google } from 'googleapis'

export const getFileMetaData = async () => {
  'use server'
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH2_REDIRECT_URI
  )

  const { userId } = auth()

  if (!userId) {
    return { message: 'User not found' }
  }

  const clerkResponse = await clerk.users.getUserOauthAccessToken(
    userId,
    'oauth_google'
  )

  if (!clerkResponse || clerkResponse.length === 0) {
    return { message: 'Google OAuth token not found' }
  }

  const accessToken = clerkResponse[0]?.token
  if (!accessToken) {
    return { message: 'Google OAuth token not found' }
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
  })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  const response = await drive.files.list()

  if (response) {
    return response.data
  }
}