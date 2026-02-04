# Flow-Lab

An AI-powered workflow automation platform built with Next.js, enabling users to create, manage, and execute automated workflows with integrations to popular services like Discord, Slack, Notion, and Google Drive.

## Features

- 🔄 **Visual Workflow Editor** - Drag-and-drop interface for building automation workflows
- 🤖 **AI Integration** - Connect to OpenAI, Anthropic, Google AI, and local Ollama models
- 🔗 **Service Connections** - Discord, Slack, Notion, Google Drive integrations
- 📊 **Cost Tracking** - Monitor AI usage and set budget alerts
- 📝 **Execution Logs** - Track workflow runs with detailed logs
- 🔐 **Authentication** - Secure user authentication with Clerk
- 💳 **Billing** - Stripe integration for subscription management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Payments**: Stripe
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Clerk account
- (Optional) Stripe account for billing

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/flow-lab.git
cd flow-lab
```

### 2. Install dependencies

```bash
npm install
# or
bun install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure the required variables:

```env
# Required: Clerk Authentication
# Get from: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Required: Database Connection
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/flowlab
DIRECT_DATABASE_URL=postgresql://user:password@localhost:5432/flowlab

# Optional: Stripe (for billing features)
STRIPE_SECRET=sk_test_xxxxx
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 5. Run the development server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_DATABASE_URL` | Yes | Direct PostgreSQL connection (same as DATABASE_URL for local dev) |
| `STRIPE_SECRET` | No | Stripe secret key for billing |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `DISCORD_CLIENT_ID` | No | Discord OAuth client ID |
| `DISCORD_CLIENT_SECRET` | No | Discord OAuth client secret |
| `SLACK_BOT_TOKEN` | No | Slack bot token |
| `NOTION_API_SECRET` | No | Notion integration secret |
| `OPENAI_API_KEY` | No | OpenAI API key for AI features |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for Claude |
| `GOOGLE_API_KEY` | No | Google AI (Gemini) API key |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (main)/            # Main app layout
│   │   └── (pages)/       # Dashboard pages
│   │       ├── billing/   # Billing & subscription
│   │       ├── connections/ # Service connections
│   │       ├── dashboard/ # Main dashboard
│   │       ├── logs/      # Execution logs
│   │       ├── settings/  # User settings
│   │       └── workflows/ # Workflow editor
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── global/            # Global components
│   ├── ui/                # shadcn/ui components
│   └── ...
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── providers/             # React context providers
└── store.tsx              # Zustand store
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npx prisma studio    # Open Prisma database viewer
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project to [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy

### Other Platforms

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## License

MIT
