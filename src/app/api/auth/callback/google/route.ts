import { NextRequest, NextResponse } from 'next/server'
import { generateSuccessHtml, generateErrorHtml } from '@/lib/oauth-utils'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://localhost:3000'

  if (!code) {
    return new NextResponse(generateErrorHtml('No code provided'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  try {
    console.log('Google OAuth: Exchanging code for token...')
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING')
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING')

    const redirectUri = `${baseUrl}/api/auth/callback/google`

    // Exchange code for tokens
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const data = await response.json()
    console.log('Google OAuth response received')

    if (data.error) {
      console.error('Google OAuth error:', data.error)
      return new NextResponse(generateErrorHtml(data.error_description || data.error), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    })
    const userInfo = await userResponse.json()

    console.log('Google OAuth success!')

    const html = generateSuccessHtml('Google', {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    }, baseUrl)

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error: unknown) {
    console.error('Google OAuth exception:', error)
    return new NextResponse(generateErrorHtml('Internal server error during Google OAuth'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
