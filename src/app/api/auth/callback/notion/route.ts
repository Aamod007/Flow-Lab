import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  if (!code) {
    return new NextResponse(generateErrorHtml('No code provided'), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    console.log('Notion OAuth: Exchanging code for token...');
    console.log('NOTION_CLIENT_ID:', process.env.NOTION_CLIENT_ID ? 'SET' : 'MISSING');
    console.log('NOTION_API_SECRET:', process.env.NOTION_API_SECRET ? 'SET' : 'MISSING');
    console.log('NOTION_REDIRECT_URI:', process.env.NOTION_REDIRECT_URI);
    console.log('NEXT_PUBLIC_URL:', baseUrl);

    const encoded = Buffer.from(
      `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_API_SECRET}`
    ).toString('base64');

    const response = await axios('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        Authorization: `Basic ${encoded}`,
        'Notion-Version': '2022-06-28',
      },
      data: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.NOTION_REDIRECT_URI!,
      }),
    });

    console.log('Notion OAuth response received');

    if (response.data) {
      const notion = new Client({
        auth: response.data.access_token,
      });

      const databasesPages = await notion.search({
        filter: {
          value: 'database',
          property: 'object',
        },
        sort: {
          direction: 'ascending',
          timestamp: 'last_edited_time',
        },
      });

      const databaseId = databasesPages?.results?.length && databasesPages.results[0]
        ? databasesPages.results[0].id
        : '';

      console.log('Notion OAuth success!');

      const html = generateSuccessHtml('Notion', {
        access_token: response.data.access_token,
        workspace_name: response.data.workspace_name,
        workspace_icon: response.data.workspace_icon,
        workspace_id: response.data.workspace_id,
        database_id: databaseId
      }, baseUrl);

      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } catch (error: any) {
    console.error('Notion OAuth error:', error?.response?.data || error.message);
    const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'OAuth failed';
    return new NextResponse(generateErrorHtml(errorMessage), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new NextResponse(generateErrorHtml('Unknown error'), {
    headers: { 'Content-Type': 'text/html' },
  });
}

function generateSuccessHtml(provider: string, data: Record<string, any>, baseUrl: string) {
  const params = new URLSearchParams(data).toString();
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
`;
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
`;
}
