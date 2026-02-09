/**
 * OAuth Utilities
 * Shared HTML generation functions for OAuth callback routes
 */

export interface OAuthSuccessData {
    [key: string]: string | undefined
}

/**
 * Generate success HTML page for OAuth callbacks
 * Handles both popup (postMessage) and redirect flows
 */
export function generateSuccessHtml(
    provider: string,
    data: OAuthSuccessData,
    baseUrl: string
): string {
    const params = new URLSearchParams(
        Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined) as [string, string][]
        )
    ).toString()

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

/**
 * Generate error HTML page for OAuth callbacks
 * Handles both popup (postMessage) and redirect flows
 */
export function generateErrorHtml(error: string): string {
    // Escape the error message to prevent XSS
    const escapedError = error
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

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
      <p class="error">${escapedError}</p>
      <script>
        setTimeout(function() {
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${escapedError}' }, '*');
            window.close();
          } else {
            window.location.href = '/connections?error=' + encodeURIComponent('${escapedError}');
          }
        }, 2000);
      </script>
    </div>
  </body>
</html>
`
}
