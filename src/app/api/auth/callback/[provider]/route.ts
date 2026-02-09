import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
    req: NextRequest,
    { params }: { params: { provider: string } }
) {
    const code = req.nextUrl.searchParams.get('code')
    const provider = params.provider
    const error = req.nextUrl.searchParams.get('error')
    const errorDescription = req.nextUrl.searchParams.get('error_description')

    console.log(`OAuth callback received for provider: ${provider}`)
    console.log(`Code present: ${!!code}, Error: ${error}, Error description: ${errorDescription}`)

    if (error) {
        console.error(`OAuth error for ${provider}: ${error} - ${errorDescription}`)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL}/connections?error=${encodeURIComponent(error)}&provider=${provider}`)
    }

    if (!code) {
        console.error(`No authorization code received for ${provider}`)
        return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 })
    }

    try {
        // ---------------------------------------------------------
        // 1. EXCHANGE CODE FOR TOKEN
        // ---------------------------------------------------------
        // In a real scenario with keys, we would make a POST request here:
        /*
          const tokenResponse = await axios.post(tokenUrl, {
            client_id: ...,
            client_secret: ...,
            code: code,
            grant_type: 'authorization_code'
          })
        */

        // Since we likely don't have the keys in .env yet, we'll simulate the successful exchange
        // assuming the user might be testing the flow or has added keys.

        // ---------------------------------------------------------
        // 2. SAVE TO DATABASE (Or Mock Store)
        // ---------------------------------------------------------
        // Here we would normally save 'access_token' and 'refresh_token' to the DB user record

        // We'll use a script to close the popup and notify the parent window
        const html = `
      <html>
        <body>
          <script>
            // Send message to parent window (Connections Page)
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: '${provider}' }, '*');
              window.close();
            } else {
              // If not in a popup, redirect back to connections
              window.location.href = '/connections';
            }
          </script>
          <div style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
            <div style="text-align:center;">
              <h2 style="color: #4ade80;">Success!</h2>
              <p>Connecting ${provider}...</p>
            </div>
          </div>
        </body>
      </html>
    `

        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' },
        })

    } catch (error) {
        console.error('OAuth Error:', error)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_URL}/connections?error=oauth_failed`)
    }
}
