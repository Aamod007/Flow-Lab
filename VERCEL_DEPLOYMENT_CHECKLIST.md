# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

### Code Preparation
- [ ] All changes committed to Git
- [ ] `.env` files not committed (check `.gitignore`)
- [ ] `vercel.json` configuration file present
- [ ] Build succeeds locally: `npm run build`
- [ ] No TypeScript errors: `npm run lint`
- [ ] Health check endpoint works locally: `curl http://localhost:3000/api/health`

### Database Setup
- [ ] PostgreSQL database created (Vercel Postgres, Supabase, or other)
- [ ] Database connection string obtained
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Migrations ready: `npx prisma migrate dev`
- [ ] Test database connection locally

### API Keys & Credentials
- [ ] Clerk account created and configured
- [ ] Stripe account set up with API keys
- [ ] Google OAuth credentials (if using Drive integration)
- [ ] Discord app created (if using Discord integration)
- [ ] Notion integration created (if using Notion)
- [ ] Slack app created (if using Slack integration)

## Vercel Setup

### Project Configuration
- [ ] Vercel account created
- [ ] Repository connected to Vercel
- [ ] Project imported in Vercel dashboard
- [ ] Framework preset set to "Next.js"
- [ ] Build command: `prisma generate && next build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`

### Environment Variables (Required)
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- [ ] `CLERK_SECRET_KEY` - From Clerk dashboard
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `STRIPE_SECRET` - From Stripe dashboard
- [ ] `NEXT_PUBLIC_URL` - Your Vercel deployment URL (e.g., https://your-app.vercel.app)
- [ ] `NEXT_PUBLIC_DOMAIN` - Your domain without protocol (e.g., your-app.vercel.app)
- [ ] `NEXT_PUBLIC_SCHEME` - Set to `https`

### Environment Variables (Optional - Add if using)
- [ ] `GOOGLE_CLIENT_ID` - Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - Google Cloud Console
- [ ] `OAUTH2_REDIRECT_URI` - https://your-app.vercel.app/api/auth/callback/google
- [ ] `DISCORD_CLIENT_ID` - Discord Developer Portal
- [ ] `DISCORD_CLIENT_SECRET` - Discord Developer Portal
- [ ] `NOTION_API_SECRET` - Notion Integrations
- [ ] `NOTION_CLIENT_ID` - Notion Integrations
- [ ] `SLACK_CLIENT_ID` - Slack API Dashboard
- [ ] `SLACK_CLIENT_SECRET` - Slack API Dashboard
- [ ] `SLACK_SIGNING_SECRET` - Slack API Dashboard

### Environment Variable Settings
- [ ] All variables set for "Production"
- [ ] All variables set for "Preview" (optional)
- [ ] All variables set for "Development" (optional)
- [ ] No trailing spaces in variable values
- [ ] No quotes around variable values (Vercel adds them automatically)

## Deployment

### Initial Deploy
- [ ] Click "Deploy" in Vercel dashboard
- [ ] Wait for build to complete (usually 2-5 minutes)
- [ ] Check build logs for errors
- [ ] Deployment successful (green checkmark)
- [ ] Deployment URL generated

### Post-Deployment Verification
- [ ] Visit deployment URL
- [ ] Homepage loads correctly
- [ ] Health check works: `https://your-app.vercel.app/api/health`
- [ ] Expected response:
  ```json
  {
    "data": {
      "status": "healthy",
      "environment": "configured",
      "database": "connected",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### Database Migration
- [ ] Connect to production database
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify tables created
- [ ] Test database connectivity from app

## Integration Configuration

### Clerk Setup
- [ ] Go to Clerk Dashboard → Webhooks
- [ ] Add webhook endpoint: `https://your-app.vercel.app/api/clerk-webhook`
- [ ] Subscribe to events: `user.created`, `user.updated`, `user.deleted`
- [ ] Test webhook delivery
- [ ] Update allowed redirect URLs to include production domain

### Stripe Setup
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Add endpoint: `https://your-app.vercel.app/api/stripe-webhook`
- [ ] Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`
- [ ] Copy webhook signing secret
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Vercel environment variables
- [ ] Test webhook delivery

### Google OAuth (if using)
- [ ] Go to Google Cloud Console → APIs & Services → Credentials
- [ ] Update OAuth 2.0 Client
- [ ] Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
- [ ] Add authorized JavaScript origins: `https://your-app.vercel.app`
- [ ] Test Google sign-in flow

### Discord (if using)
- [ ] Go to Discord Developer Portal → Your App → OAuth2
- [ ] Add redirect: `https://your-app.vercel.app/api/auth/callback/discord`
- [ ] Test Discord connection

### Notion (if using)
- [ ] Go to Notion Integrations
- [ ] Update redirect URI: `https://your-app.vercel.app/api/auth/callback/notion`
- [ ] Test Notion connection

### Slack (if using)
- [ ] Go to Slack API Dashboard → Your App → OAuth & Permissions
- [ ] Add redirect URL: `https://your-app.vercel.app/api/auth/callback/slack`
- [ ] Update event subscriptions URL: `https://your-app.vercel.app/api/slack-webhook`
- [ ] Test Slack connection

## Testing

### API Endpoints
- [ ] Test payment route: `GET https://your-app.vercel.app/api/payment`
- [ ] Test drive route: `GET https://your-app.vercel.app/api/drive`
- [ ] Test connections: `GET https://your-app.vercel.app/api/connections/test?provider=notion&action=test`
- [ ] All endpoints return expected responses
- [ ] No 500 errors in logs

### User Flows
- [ ] User can sign up/sign in
- [ ] User can create workflow
- [ ] User can save workflow
- [ ] User can execute workflow
- [ ] User can view execution logs
- [ ] User can manage connections
- [ ] Payment flow works (if applicable)

### Error Handling
- [ ] Test with invalid inputs
- [ ] Test with missing authentication
- [ ] Test with expired tokens
- [ ] Errors return proper status codes
- [ ] Error messages are user-friendly
- [ ] No stack traces exposed

## Monitoring

### Vercel Dashboard
- [ ] Check deployment status
- [ ] Review build logs
- [ ] Monitor function execution
- [ ] Check for errors in logs
- [ ] Set up log drains (optional)

### Performance
- [ ] Check page load times
- [ ] Monitor API response times
- [ ] Review function execution duration
- [ ] Check for timeout errors

### Alerts (Optional)
- [ ] Set up Vercel monitoring alerts
- [ ] Configure error notifications
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure Slack/email notifications

## Custom Domain (Optional)

### Domain Setup
- [ ] Purchase domain or use existing
- [ ] Go to Vercel → Project → Settings → Domains
- [ ] Add custom domain
- [ ] Update DNS records as instructed
- [ ] Wait for DNS propagation (up to 48 hours)
- [ ] Verify SSL certificate issued

### Update Configurations
- [ ] Update `NEXT_PUBLIC_URL` to custom domain
- [ ] Update `NEXT_PUBLIC_DOMAIN` to custom domain
- [ ] Update all webhook URLs to use custom domain
- [ ] Update all OAuth redirect URIs to use custom domain
- [ ] Redeploy application

## Security

### Final Security Checks
- [ ] All environment variables use production keys (not test keys)
- [ ] No sensitive data in code or logs
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (if applicable)
- [ ] Webhook signatures verified
- [ ] HTTPS enforced (automatic with Vercel)

## Documentation

### Team Documentation
- [ ] Document deployment process
- [ ] Share environment variable values securely (use password manager)
- [ ] Document rollback procedure
- [ ] Create runbook for common issues
- [ ] Update README with production URL

## Rollback Plan

### If Deployment Fails
- [ ] Check build logs for errors
- [ ] Verify environment variables
- [ ] Test database connection
- [ ] Roll back to previous deployment: `vercel rollback`
- [ ] Fix issues locally
- [ ] Redeploy

## Success Criteria

### Deployment is Successful When:
- ✅ Build completes without errors
- ✅ Health check returns 200 status
- ✅ Database is connected
- ✅ All environment variables configured
- ✅ Webhooks receiving events
- ✅ User authentication works
- ✅ Core features functional
- ✅ No critical errors in logs
- ✅ Performance is acceptable
- ✅ Team can access and use the application

---

## Quick Commands

```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs --follow

# Rollback deployment
vercel rollback [deployment-url]

# Pull environment variables
vercel env pull

# Run migrations on production
npx prisma migrate deploy
```

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Deployment URL**: _____________

**Notes**: _____________

---

✅ **Deployment Complete!** Your application is now live on Vercel.
