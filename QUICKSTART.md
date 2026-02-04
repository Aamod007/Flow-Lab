# Quick Start Guide

Get your workflow automation app running locally in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Git

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd <your-repo-name>

# Install dependencies
npm install
```

## Step 2: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your actual values
# At minimum, you need:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - DATABASE_URL
# - STRIPE_SECRET
# - NEXT_PUBLIC_URL
```

## Step 3: Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed database with sample data
npx prisma db seed
```

## Step 4: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to see your app!

## Step 5: Test the Application

### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
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

### Test Payment Route
```bash
curl http://localhost:3000/api/payment
```

## Common Issues

### Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env.local`
3. Verify database exists: `psql -U postgres -c "CREATE DATABASE flowlab;"`

### Missing Environment Variables

**Error**: `Missing required environment variable: CLERK_SECRET_KEY`

**Solution**:
1. Check `.env.local` exists
2. Verify all required variables are set
3. Restart development server after changes

### Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npx prisma generate
```

## Next Steps

1. **Set up integrations**: Configure Google, Slack, Notion, Discord in their respective dashboards
2. **Create workflows**: Visit `/workflows` to create your first automation
3. **Test webhooks**: Use tools like ngrok for local webhook testing
4. **Deploy**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to Vercel

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm test

# Database commands
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create and apply migration
npx prisma migrate reset   # Reset database
npx prisma db push         # Push schema without migration
```

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/          # API routes
│   │   └── (main)/       # Main application pages
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   │   ├── env-validator.ts      # Environment validation
│   │   ├── api-response.ts       # API error handling
│   │   └── validation-schemas.ts # Input validation
│   ├── hooks/            # Custom React hooks
│   └── providers/        # Context providers
├── prisma/
│   └── schema.prisma     # Database schema
├── .env.example          # Environment template
├── DEPLOYMENT.md         # Deployment guide
└── package.json          # Dependencies
```

## Getting Help

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Review API documentation in `/docs`
- Open an issue on GitHub
- Check application logs: `npm run dev` shows real-time logs

## Security Notes

- Never commit `.env` files
- Use different API keys for development and production
- Rotate secrets regularly
- Enable 2FA on all service accounts

---

Happy coding! 🚀
