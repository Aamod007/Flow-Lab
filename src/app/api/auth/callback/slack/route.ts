import { NextRequest, NextResponse } from 'next/server'

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

    // Make a POST request to Slack's OAuth endpoint to exchange the code for an access token
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

    // Check if the response indicates a failure
    if (!data.ok) {
      console.error('Slack OAuth error:', data.error)
      return new NextResponse(generateErrorHtml(data.error || 'OAuth failed'), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    const appId = data?.app_id
    const userId = data?.authed_user?.id
    const userToken = data?.authed_user?.access_token
    const accessToken = data?.access_token
    const botUserId = data?.bot_user_id
    const teamId = data?.team?.id
    const teamName = data?.team?.name

    console.log('Slack OAuth success!')

    // Return HTML that handles both popup and regular navigation
    const html = generateSuccessHtml('Slack', {
      app_id: appId,
      authed_user_id: userId,
      authed_user_token: userToken,
      slack_access_token: accessToken,
      bot_user_id: botUserId,
      team_id: teamId,
      team_name: teamName
    }, baseUrl)

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('Slack OAuth exception:', error)
    return new NextResponse(generateErrorHtml('Internal server error during Slack OAuth'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

function generateSuccessHtml(provider: string, data: Record<string, any>, baseUrl: string) {
  const params = new URLSearchParams(data).toString()
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>${provider} Connected</title>
    <style>
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: white;
      }
      .container {
        text-align: center;
        padding: 40px;
        background: rgba(255,255,255,0.1);
        border-radius: 16px;
        backdrop-filter: blur(10px);
      }
      h2 { color: #4ade80; margin-bottom: 16px; }
      p { color: #a0a0a0; }
      .spinner {
        border: 3px solid rgba(255,255,255,0.1);
        border-top: 3px solid #4ade80;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>✓ Success!</h2>
      <p>${provider} connected successfully!</p>
      <div class="spinner"></div>
      <p id="status">Completing connection...</p>
    </div>
    <script>
      (function() {
        const data = ${JSON.stringify(data)};
        
        // If opened in a popup, send message to parent and close
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'OAUTH_SUCCESS', 
            provider: '${provider}',
            data: data
          }, '*');
          document.getElementById('status').textContent = 'Closing window...';
          setTimeout(function() {
            window.close();
          }, 1000);
        } else {
          // If not in popup, redirect to connections page with params
          document.getElementById('status').textContent = 'Redirecting...';
          window.location.href = '${baseUrl}/connections?${params}';
        }
      })();
    </script>
  </body>
</html>
`
}

function generateErrorHtml(error: string) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>Connection Error</title>
    <style>
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: white;
      }
      .container {
        text-align: center;
        padding: 40px;
        background: rgba(255,255,255,0.1);
        border-radius: 16px;
        backdrop-filter: blur(10px);
      }
      h2 { color: #ef4444; margin-bottom: 16px; }
      p { color: #a0a0a0; }
      .error { color: #fca5a5; margin-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>✗ Error</h2>
      <p>Failed to connect</p>
      <p class="error">${error}</p>
      <script>
        setTimeout(function() {
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${error}' }, '*');
            window.close();
          } else {
            window.location.href = '/connections?error=' + encodeURIComponent('${error}');
          }
        }, 2000);
      </script>
    </div>
  </body>
</html>
`
}
