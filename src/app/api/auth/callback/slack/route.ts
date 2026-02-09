import { NextRequest, NextResponse } from 'next/server'
import { generateSuccessHtml, generateErrorHtml } from '@/lib/oauth-utils'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

  if (!code) {
    return new NextResponse(generateErrorHtml('No code provided'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  try {
    console.log('Slack OAuth: Exchanging code for token...')
    console.log('SLACK_CLIENT_ID:', process.env.SLACK_CLIENT_ID ? 'SET' : 'MISSING')
    console.log('SLACK_CLIENT_SECRET:', process.env.SLACK_CLIENT_SECRET ? 'SET' : 'MISSING')
    console.log('SLACK_REDIRECT_URI:', process.env.SLACK_REDIRECT_URI)
    console.log('NEXT_PUBLIC_URL:', process.env.NEXT_PUBLIC_URL)

    // Make a POST request to Slack's OAuth endpoint
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
      }),
    })

    const data = await response.json()
    console.log('Slack OAuth response:', JSON.stringify(data, null, 2))

    if (!data.ok) {
      console.error('Slack OAuth error:', data.error)
      return new NextResponse(generateErrorHtml(data.error || 'OAuth failed'), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    console.log('Slack OAuth success!')

    const html = generateSuccessHtml('Slack', {
      app_id: data?.app_id,
      authed_user_id: data?.authed_user?.id,
      authed_user_token: data?.authed_user?.access_token,
      slack_access_token: data?.access_token,
      bot_user_id: data?.bot_user_id,
      team_id: data?.team?.id,
      team_name: data?.team?.name
    }, baseUrl)

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error: unknown) {
    console.error('Slack OAuth exception:', error)
    return new NextResponse(generateErrorHtml('Internal server error during Slack OAuth'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
