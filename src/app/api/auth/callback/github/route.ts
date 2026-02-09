import { NextRequest, NextResponse } from 'next/server'

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
    } catch (error: any) {
        console.error('GitHub OAuth exception:', error)
        return new NextResponse(generateErrorHtml('Internal server error during GitHub OAuth'), {
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
