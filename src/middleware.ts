import { authMiddleware } from '@clerk/nextjs'

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
    publicRoutes: [
        '/',
        '/auth/sign-in',
        '/auth/sign-up',
        '/api/clerk-webhook',
        '/api/drive-activity/notification',
        '/api/payment/success',
        '/api/connections/test',
        '/api/ollama/(.*)',
        '/api/analytics/(.*)',
        '/api/execution/(.*)',
        '/api/test/(.*)',
        '/workflows/editor(.*)',
    ],
    ignoredRoutes: [
        '/api/auth/callback/discord',
        '/api/auth/callback/notion',
        '/api/auth/callback/slack',
        '/api/flow',
        '/api/cron/wait',
        '/api/connections/test',
        '/api/ollama/(.*)',
        '/api/analytics/(.*)',
        '/api/execution/(.*)',
        '/api/test/(.*)',
    ],
})

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
