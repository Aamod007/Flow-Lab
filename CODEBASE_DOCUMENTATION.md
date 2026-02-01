# FlowLab (Fuzzie Production) - Codebase Documentation

## 📋 Executive Summary

**FlowLab** is a comprehensive **AI-powered workflow automation SaaS platform** built with Next.js 14. It enables users to create, manage, and execute automated workflows by connecting various applications and AI agents through a visual node-based editor. The platform is designed to evolve into **AgentFlow** - an AI-first workflow orchestrator where intelligent agents collaborate to complete complex tasks.

---

## 🏗️ Architecture Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, Framer Motion |
| **State Management** | Zustand, React Context |
| **Database** | PostgreSQL with Prisma ORM |
| **Authentication** | Clerk |
| **Payments** | Stripe |
| **Visual Editor** | ReactFlow |
| **File Upload** | Uploadcare |

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (main)/            # Authenticated dashboard routes
│   │   └── (pages)/       # Main application pages
│   │       ├── billing/   # Subscription & cost management
│   │       ├── connections/# OAuth integrations
│   │       ├── dashboard/ # Home dashboard
│   │       ├── logs/      # Execution logs & monitoring
│   │       ├── settings/  # User preferences
│   │       ├── templates/ # Pre-built workflow templates
│   │       └── workflows/ # Workflow management & editor
│   ├── api/               # API routes
│   │   ├── auth/          # OAuth callbacks
│   │   ├── clerk-webhook/ # User sync webhook
│   │   ├── drive-activity/# Google Drive listeners
│   │   └── payment/       # Stripe integration
│   └── auth/              # Authentication pages
├── components/
│   ├── forms/             # Form components
│   ├── global/            # Shared UI (navbar, modals, animations)
│   ├── icons/             # Custom icon components
│   ├── infobar/           # Top information bar
│   ├── sidebar/           # Navigation sidebar
│   └── ui/                # Shadcn/UI component library
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
├── providers/             # React Context providers
└── store.tsx              # Zustand global store
```

---

## 🔑 Core Features

### 1. Visual Workflow Editor (ReactFlow)

The heart of FlowLab is a **drag-and-drop workflow editor** powered by ReactFlow:

- **Node Types**: Trigger, Action, Email, Condition, AI, Slack, Google Drive, Notion, Discord, Custom Webhook, Google Calendar, Wait
- **Features**:
  - Drag nodes from sidebar to canvas
  - Connect nodes with edges
  - Undo/Redo support
  - Zoom controls & minimap
  - Auto-save to localStorage
  - Real-time execution visualization

**Key Files**:
- [editor-canvas.tsx](src/app/(main)/(pages)/workflows/editor/[editorId]/_components/editor-canvas.tsx) - Main editor component
- [editor-provider.tsx](src/providers/editor-provider.tsx) - Editor state management
- [editor-utils.ts](src/lib/editor-utils.ts) - Drag/drop and node utilities

### 2. AI Agent Integration

Multi-provider AI support for intelligent workflow automation:

| Provider | Models | Pricing |
|----------|--------|---------|
| **OpenAI** | GPT-4 Turbo, GPT-4, GPT-3.5 Turbo | $0.0015-0.03/1K tokens |
| **Google Gemini** | Gemini 2.0 Flash, 1.5 Pro/Flash | Free tier + $0.00125/1K |
| **Anthropic** | Claude 3 Opus/Sonnet/Haiku | $0.00025-0.015/1K |
| **Groq** | Llama 3.1 70B, Mixtral 8x7b | Free tier |
| **Ollama** | Llama3, Mistral, CodeLlama, Phi3 | Free (local) |

**Key Files**:
- [ai-configuration-form.tsx](src/app/(main)/(pages)/workflows/editor/[editorId]/_components/ai-configuration-form.tsx) - AI node settings
- [ai-cost-tracking.ts](src/lib/ai-cost-tracking.ts) - Token usage and cost calculations

### 3. Third-Party Integrations (Connections)

OAuth-based integrations for app-to-app automation:

| Integration | Capability |
|-------------|------------|
| **Slack** | Send messages, channel notifications |
| **Discord** | Webhook-based messaging |
| **Notion** | Create database entries |
| **Google Drive** | File change triggers, folder monitoring |
| **Gmail** | Email triggers (planned) |
| **Google Calendar** | Event creation |

**Key Files**:
- [connections/page.tsx](src/app/(main)/(pages)/connections/page.tsx) - Connections dashboard
- [connections-provider.tsx](src/providers/connections-provider.tsx) - Connection state

### 4. Workflow Templates

Pre-built workflow templates for common automation scenarios:

- **Slack Message to Notion Log** - Capture messages to Notion
- **Email Listener to Slack Alert** - Forward important emails
- **AI-powered content generation pipelines**
- **Customer support automation**

**Key Files**:
- [templates/page.tsx](src/app/(main)/(pages)/templates/page.tsx) - Template marketplace

### 5. Billing & Subscription System

Stripe-powered subscription management with three tiers:

| Tier | Price | Features |
|------|-------|----------|
| **Hobby** | Free | 3 automations, 100 tasks/month |
| **Pro** | Paid | Unlimited automations |
| **Unlimited** | Paid | Premium support, advanced AI |

Includes AI cost tracking and usage monitoring.

**Key Files**:
- [billing/page.tsx](src/app/(main)/(pages)/billing/page.tsx) - Billing dashboard
- [billing-provider.tsx](src/providers/billing-provider.tsx) - Credits/tier state
- [payment/route.ts](src/app/api/payment/route.ts) - Stripe checkout

### 6. Execution Logs & Monitoring

Real-time workflow execution monitoring:

- Execution status (Running, Completed, Failed, Pending)
- Duration tracking
- AI token usage per execution
- Cost calculation
- Filter by status, workflow, date

**Key Files**:
- [logs/page.tsx](src/app/(main)/(pages)/logs/page.tsx) - Logs dashboard
- [execution-dashboard.tsx](src/app/(main)/(pages)/workflows/editor/[editorId]/_components/execution-dashboard.tsx) - In-editor monitoring

---

## 🗄️ Database Schema (Prisma)

### Core Models

```prisma
model User {
  id               Int       @id @default(autoincrement())
  clerkId          String    @unique
  name             String?
  email            String    @unique
  tier             String?   @default("Free")
  credits          String?   @default("10")
  workflows        Workflows[]
  connections      Connections[]
  apiKeys          ApiKey[]
  costTracking     CostTracking[]
  executionLogs    ExecutionLog[]
}

model Workflows {
  id                String    @id @default(uuid())
  nodes             String?   // JSON string of ReactFlow nodes
  edges             String?   // JSON string of ReactFlow edges
  name              String
  description       String
  publish           Boolean?  @default(false)
  discordTemplate   String?
  notionTemplate    String?
  slackTemplate     String?
  schedules         Schedule[]
  executionLogs     ExecutionLog[]
}

model Connections {
  id               String    @id @default(uuid())
  type             String    // "slack", "discord", "notion", etc.
  discordWebhookId String?
  notionId         String?
  slackId          String?
}

model ExecutionLog {
  id          String    @id @default(uuid())
  workflowId  String
  status      String    // "RUNNING", "COMPLETED", "FAILED"
  startTime   DateTime  @default(now())
  duration    Int?      // milliseconds
  totalCost   Float?    @default(0.0)
  creditsUsed Int?
  logs        String?   // JSON detailed logs
}

model CostTracking {
  id          String    @id @default(uuid())
  userId      String
  month       String    // "YYYY-MM"
  totalCost   Float     @default(0.0)
  breakdown   String?   // JSON by provider
}

model ApiKey {
  id        String    @id @default(uuid())
  provider  String    // "openai", "anthropic", etc.
  key       String
  isActive  Boolean   @default(true)
}
```

---

## 🔐 Authentication Flow

1. **Clerk Integration**: Handles sign-up/sign-in with email, OAuth providers
2. **Middleware Protection**: All routes except landing page require authentication
3. **Webhook Sync**: Clerk webhooks sync user data to database
4. **OAuth Callbacks**: Handle third-party app authorizations

**Key Files**:
- [middleware.ts](src/middleware.ts) - Route protection
- [clerk-webhook/route.ts](src/app/api/clerk-webhook/route.ts) - User sync

---

## 💾 State Management

### 1. Zustand Store (`store.tsx`)
Global state for:
- Google Drive file selection
- Slack channel selection

### 2. React Context Providers

| Provider | Purpose |
|----------|---------|
| `EditorProvider` | Workflow editor state, undo/redo |
| `ConnectionsProvider` | Integration connection data |
| `BillingProvider` | User credits and tier |
| `ModalProvider` | Global modal management |
| `ThemeProvider` | Dark/light mode |

### 3. Local Storage
- Workflow auto-save backups
- Connection status persistence
- AI usage records

---

## 🛠️ Key Utilities

### workflow-storage.ts
Client-side workflow persistence:
- `getWorkflowsFromStorage()` - Load workflows
- `saveWorkflowToStorage()` - Create new workflow
- `getWorkflowNodesEdges()` - Load canvas state
- `saveWorkflowNodesEdges()` - Save canvas state

### ai-cost-tracking.ts
AI usage and cost utilities:
- `AI_PRICING` - Cost per 1K tokens by model
- `calculateCost()` - Compute execution cost
- `recordAIUsage()` - Log AI API calls
- `getAIStats()` - Aggregate usage statistics

### editor-utils.ts
Workflow editor helpers:
- `onDragStart()` - Handle node drag
- `onContentChange()` - Update node content
- `onConnections()` - Load connection data

---

## 🎨 UI Components

Built on **Shadcn/UI** with custom additions:

| Component | Description |
|-----------|-------------|
| `3d-card.tsx` | Interactive 3D card effect |
| `connect-parallax.tsx` | Parallax scroll animation |
| `container-scroll-animation.tsx` | Scroll-based animations |
| `infinite-moving-cards.tsx` | Testimonial carousel |
| `lamp.tsx` | Animated lamp effect |
| `sparkles.tsx` | Particle sparkle effects |

---

## 📡 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/payment` | GET/POST | Stripe products & checkout |
| `/api/clerk-webhook` | POST | User sync from Clerk |
| `/api/drive-activity` | GET | Google Drive listener setup |
| `/api/drive-activity/notification` | POST | Drive change webhooks |
| `/api/auth/callback/*` | GET | OAuth callbacks |

---

## 🚀 Future Roadmap (AgentFlow Vision)

Based on [implement.md](implement.md), the platform is evolving toward:

1. **Multi-Agent Collaboration** - AI agents working together autonomously
2. **Real-time Execution Monitoring** - Live agent reasoning visualization
3. **Agent Memory System** - Context persistence across executions
4. **Enhanced AI Providers** - Expanded model support
5. **Cost Optimization** - Smart model selection based on task complexity
6. **Template Marketplace** - Community-shared workflows

---

## 🏃 Running the Project

```bash
# Install dependencies
bun install

# Set up environment variables
# - DATABASE_URL (PostgreSQL)
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - STRIPE_SECRET
# - GOOGLE_CLIENT_ID/SECRET
# - NGROK_URI (for webhooks)

# Generate Prisma client
bunx prisma generate

# Run development server
bun dev
```

---

## 📊 Summary

FlowLab is a sophisticated workflow automation platform that combines:

- ✅ **Visual Programming** - Intuitive drag-and-drop interface
- ✅ **AI Integration** - Multi-provider LLM support with cost tracking
- ✅ **App Connectivity** - OAuth integrations with popular services
- ✅ **Scalable Architecture** - Modern Next.js 14 with PostgreSQL
- ✅ **Monetization Ready** - Stripe billing with tiered subscriptions
- ✅ **Enterprise Features** - Execution logs, monitoring, templates

The codebase is well-structured for continued development toward the AgentFlow vision of AI-first workflow orchestration.
