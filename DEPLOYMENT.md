# Vercel Deployment Guide

This guide will walk you through deploying your Next.js workflow automation application to Vercel.

## Prerequisites

- Vercel account (sign up at https://vercel.com)
- GitHub/GitLab/Bitbucket repository with your code
- PostgreSQL database (Vercel Postgres, Supabase, or other provider)
- All required API keys and credentials

## Step 1: Prepare Your Environment Variables

Create a `.env.production` file or prepare these variables for Vercel:

### Required Variables

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Stripe Payments
STRIPE_SECRET=sk_live_xxxxx

# Application URLs
NEXT_PUBLIC_URL=https://your-domain.vercel.app
NEXT_PUBLIC_DOMAIN=your-domain.vercel.app
NEXT_PUBLIC_SCHEME=https
```

### Optional Variables (for integrations)

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
OAUTH2_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback/google

# Discord
DISCORD_CLIENT_ID=xxxxx
DISCORD_CLIENT_SECRET=xxxxx

# Notion
NOTION_API_SECRET=secret_xxxxx
NOTION_CLIENT_ID=xxxxx

# Slack
SLACK_CLIENT_ID=xxxxx
SLACK_CLIENT_SECRET=xxxxx
SLACK_SIGNING_SECRET=xxxxx
```

## Step 2: Set Up Database

### Option A: Vercel Postgres

1. Go to your Vercel project dashboard
2. Navigate to Storage tab
3. Create a new Postgres database
4. Copy the `DATABASE_URL` connection string

### Option B: External Provider (Supabase, Railway, etc.)

1. Create a PostgreSQL database with your provider
2. Get the connection string
3. Ensure the database is accessible from Vercel's IP ranges

### Run Migrations

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

## Step 3: Deploy to Vercel

### Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Build Command**: `prisma generate && next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. Add environment variables:
   - Click "Environment Variables"
   - Add all required variables from Step 1
   - Set them for Production, Preview, and Development

5. Click "Deploy"

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 4: Configure Webhooks

After deployment, update webhook URLs in your integrations:

### Clerk Webhooks

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/clerk-webhook`
3. Subscribe to events: `user.created`, `user.updated`

### Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe-webhook`
3. Subscribe to events: `checkout.session.completed`, `customer.subscription.updated`

### Google Drive (if using)

1. Update OAuth redirect URI in Google Cloud Console
2. Set to: `https://your-domain.vercel.app/api/auth/callback/google`

## Step 5: Verify Deployment

### Health Check

Visit: `https://your-domain.vercel.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test API Routes

1. **Payment Route**: `GET https://your-domain.vercel.app/api/payment`
2. **Drive Route**: `GET https://your-domain.vercel.app/api/drive`
3. **Connections**: `GET https://your-domain.vercel.app/api/connections/test?provider=notion&action=test`

## Step 6: Monitor and Debug

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Recent logs
vercel logs
```

### Common Issues

#### Build Fails

**Error**: `Prisma Client not generated`

**Solution**:
```bash
# Ensure build command includes Prisma generation
Build Command: prisma generate && next build
```

#### Database Connection Fails

**Error**: `Can't reach database server`

**Solution**:
- Check `DATABASE_URL` is correct
- Ensure database allows connections from Vercel IPs
- For Vercel Postgres, use the connection pooling URL

#### Environment Variables Not Working

**Error**: `Missing required environment variable`

**Solution**:
- Verify all variables are set in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

#### Stripe Webhooks Failing

**Error**: `Webhook signature verification failed`

**Solution**:
- Get webhook signing secret from Stripe dashboard
- Add `STRIPE_WEBHOOK_SECRET` to environment variables
- Ensure webhook URL is correct

## Deployment Checklist

- [ ] All environment variables configured in Vercel
- [ ] Database created and accessible
- [ ] Prisma migrations run successfully
- [ ] Build completes without errors
- [ ] Health check endpoint returns 200
- [ ] Webhook URLs updated in third-party services
- [ ] OAuth redirect URIs updated
- [ ] Test all major features in production
- [ ] Set up monitoring/alerts
- [ ] Configure custom domain (optional)

## Performance Optimization

### Enable Edge Runtime (Optional)

For faster response times, enable Edge Runtime for API routes:

```typescript
// src/app/api/your-route/route.ts
export const runtime = 'edge'
```

### Configure Caching

Add caching headers to static responses:

```typescript
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  })
}
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.gitignore`
2. **Rotate secrets regularly** - Update API keys periodically
3. **Use environment-specific keys** - Different keys for dev/prod
4. **Enable CORS properly** - Restrict to your domains only
5. **Monitor logs** - Watch for suspicious activity

## Rollback Procedure

If deployment fails:

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

## Support

- Vercel Documentation: https://vercel.com/docs
- Prisma Documentation: https://www.prisma.io/docs
- Next.js Documentation: https://nextjs.org/docs

## Troubleshooting Commands

```bash
# Check deployment status
vercel inspect [deployment-url]

# View environment variables
vercel env ls

# Pull environment variables locally
vercel env pull

# Test build locally
npm run build
```

---

**Last Updated**: February 2026
**Maintained By**: Development Team
