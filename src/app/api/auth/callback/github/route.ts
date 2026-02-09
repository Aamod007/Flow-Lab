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
    console.log('GitHub OAuth: Exchanging code for token...')
    console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID ? 'SET' : 'MISSING')
    console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET ? 'SET' : 'MISSING')

    const redirectUri = `${baseUrl}/api/auth/callback/github`

    // Exchange code for tokens
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        redirect_uri: redirectUri,
      }),
    })

    const data = await response.json()
    console.log('GitHub OAuth response received')

    if (data.error) {
      console.error('GitHub OAuth error:', data.error)
      return new NextResponse(generateErrorHtml(data.error_description || data.error), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    const userInfo = await userResponse.json()

    console.log('GitHub OAuth success!')

    const html = generateSuccessHtml('GitHub', {
      access_token: data.access_token,
      username: userInfo.login,
      name: userInfo.name,
      avatar_url: userInfo.avatar_url,
      repos_url: userInfo.repos_url
    }, baseUrl)

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error: unknown) {
    console.error('GitHub OAuth exception:', error)
    return new NextResponse(generateErrorHtml('Internal server error during GitHub OAuth'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
