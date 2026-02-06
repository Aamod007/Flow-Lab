import axios from 'axios'
import { NextResponse, NextRequest } from 'next/server'
import url from 'url'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/connections?error=${encodeURIComponent('No code provided')}`)
  }

  try {
    console.log('Discord OAuth: Exchanging code for token...')
    console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? 'SET' : 'MISSING')
    console.log('DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET ? 'SET' : 'MISSING')
    console.log('NEXT_PUBLIC_URL:', baseUrl)

    const data = new url.URLSearchParams()
    data.append('client_id', process.env.DISCORD_CLIENT_ID!)
    data.append('client_secret', process.env.DISCORD_CLIENT_SECRET!)
    data.append('grant_type', 'authorization_code')
    data.append('redirect_uri', `${baseUrl}/api/auth/callback/discord`)
    data.append('code', code.toString())

    const output = await axios.post(
      'https://discord.com/api/oauth2/token',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    console.log('Discord OAuth response received')

    if (output.data) {
      const access = output.data.access_token
      const UserGuilds: any = await axios.get(
        `https://discord.com/api/users/@me/guilds`,
        {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        }
      )

      const UserGuild = UserGuilds.data.filter(
        (guild: any) => guild.id == output.data.webhook?.guild_id
      )

      const guildName = UserGuild[0]?.name || 'Unknown Guild'

      console.log('Discord OAuth success! Redirecting to connections page...')

      return NextResponse.redirect(
        `${baseUrl}/connections?webhook_id=${output.data.webhook?.id}&webhook_url=${output.data.webhook?.url}&webhook_name=${output.data.webhook?.name}&guild_id=${output.data.webhook?.guild_id}&guild_name=${guildName}&channel_id=${output.data.webhook?.channel_id}`
      )
    }

    return NextResponse.redirect(`${baseUrl}/connections`)
  } catch (error: any) {
    console.error('Discord OAuth error:', error?.response?.data || error.message)
    const errorMessage = error?.response?.data?.error_description || error?.response?.data?.error || 'OAuth failed'
    return NextResponse.redirect(
      `${baseUrl}/connections?error=${encodeURIComponent(errorMessage)}`
    )
  }
}
