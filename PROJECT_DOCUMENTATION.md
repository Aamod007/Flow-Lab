# Fuzzie - SAAS Automation Platform Documentation

## 1. Project Overview
**Fuzzie** is a powerful SaaS automation platform (similar to n8n or Zapier) that enables users to connect various applications and automate workflows using a visual node-based editor.

### Key Capabilities
- **Visual Workflow Builder**: Drag-and-drop interface to create complex automation flows.
- **Integrations**: Connects with Discord, Slack, Notion, Google Drive, and more.
- **Templates**: Library of pre-built workflows to get started quickly.
- **Real-time Monitoring**: Execution logs and activity tracking.
- **Subscription Management**: Tiers (Free, Pro, Unlimited) with credit systems.

## 2. Technology Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI (Radix Primitives)
- **Animation**: Framer Motion
- **Visual Editor**: [ReactFlow](https://reactflow.dev/) (Canvas, Nodes, Edges)
- **State Management**: React Context (`providers/`) + Zustand
- **Components**: Reusable UI components in `src/components/`, icons via `lucide-react`.

### Backend
- **API**: Next.js Server Actions & API Routes (`src/app/api`)
- **Database**: PostgreSQL
- **ORM**: Prisma (`prisma/schema.prisma`)
- **Authentication**: [Clerk](https://clerk.com/)
- **Payments**: Stripe

## 3. Architecture & Directory Structure

The project follows the standard Next.js App Router structure with a focus on feature-based organization.

```
/
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets (images, icons)
├── src/
│   ├── app/                # Main application routes
│   │   ├── (auth)/         # Authentication pages (Login/Signup)
│   │   ├── (main)/         # Main authenticated application layout
│   │   │   ├── (pages)/    # Feature pages
│   │   │   │   ├── billing/        # Billing & Credits
│   │   │   │   ├── connections/    # 3rd Party Integrations
│   │   │   │   ├── dashboard/      # User Dashboard
│   │   │   │   ├── settings/       # User Profile Settings
│   │   │   │   ├── templates/      # Workflow Templates
│   │   │   │   └── workflows/      # Workflow Management & Editor
│   │   └── api/            # Backend API routes (Webhooks, Payments)
│   ├── components/         # Shared UI components (Sidebarters, Forms, etc.)
│   ├── lib/                # Utilities, Constants, DB helpers
│   └── providers/          # React Context Providers (State)
```

## 4. Database Schema (Prisma)

The application uses a relational data model with the following core entities:

- **User**: Stores user profile, tier, credits, and links to integrations.
- **Workflows**: The core automation unit. Contains `nodes`, `edges` (stored as JSON strings usually or detailed relations), and status (published/draft).
- **Connections**: Stores active connections to services (Slack, Discord, Notion).
- **Service Access Tokens**: Separate models for `Slack`, `Notion`, `DiscordWebhook`, and `LocalGoogleCredential` to manage OAuth tokens securely.

## 5. Core Features & Implementation Details

### 5.1 Authentication & User Management
- **Implementation**: Handled by Clerk. Middleware protects `/dashboard` and other main routes.
- **Synchronization**: Webhooks (`src/app/api/clerk-webhook`) sync Clerk user data to the local PostgreSQL `User` table.

### 5.2 Workflow Editor
Located in `src/app/(main)/(pages)/workflows/editor/[editorId]`.
- **Canvas**: Built with **ReactFlow**. It handles the visual representation of logic.
- **Node Types**:
  - **Trigger**: The starting point of a flow.
  - **Action**: Subsequent steps (e.g., "Send Slack Message").
  - **Condition**: Logic branching (if/else).
- **State Persistence**: 
  - Uses `EditorProvider` to manage the state of nodes and edges in memory.
  - **Auto-Save/Recovery**: Implements a robust fallback mechanism using `localStorage` (`workflow-storage.ts`). If the database connection fails or for local-first speed, workflows are saved to browser storage.
  - **Template Instantiation**: When a template is used, its structure is generated (horizontally or vertically laid out) and injected into the editor state.

### 5.3 Connections & Integrations
Located in `src/app/(main)/(pages)/connections`.
- **OAuth Flow**: Uses Next.js API routes (`src/app/api/auth/[provider]`) to handle OAuth handshakes with Google, Slack, Notion, etc.
- **Connection Cards**: UI components that show simple "Connect/Disconnect" status.

### 5.4 Templates System
Located in `src/app/(main)/(pages)/templates`.
- **Gallery**: Displays a grid of pre-defined automation templates.
- **Search/Filter**: Users can filter templates by category (e.g., "Communication", "Productivity").
- **Smart Icons**: A `TemplateIcon` component handles icon rendering, gracefully falling back to Lucide icons (e.g., `Mail`, `Bot`) if a specific service image is missing.
- **Preview**: A detailed modal provides a visual preview of the workflow steps (using a horizontal pipeline visualization) before applying it.

### 5.5 Billing & Credits
Located in `src/app/(main)/(pages)/billing`.
- **Stripe Integration**: Handles subscriptions.
- **Credits System**: Each workflow execution consumes credits. Free tier has limits; Pro/Unlimited have more. `BillingProvider` exposes credit status to the app.

## 6. Detailed Component Logic "Corners"

### Icon Handling & Fallbacks
The system typically expects icons in `/public`. However, robust handling exists to prevent broken images. If an icon path like `/gmail.png` is missing, the `TemplateIcon` component dynamically renders a `Mail` icon from `lucide-react` with specific styling (colors, backgrounds) to match the service brand.

### Local Storage Fallback
To ensure resilience (especially during development or connectivity issues), the Workflows engine can read/write to `localStorage`.
- `saveWorkflowToStorage`: Saves nodes/edges to a JSON string in local storage.
- `tryRecoverFromLocalStorage`: On editor load, if the server returns no data, it checks local storage for a matching workflow ID and hydrates the canvas, preventing data loss.

### Horizontal Layout Generation
When applying a template, the system programmatically calculates `(x, y)` positions for nodes to create a clean, horizontal "pipeline" layout (X increases by 300px per step), resolving the issue of messy or overlapping initial states.

### Premium UI Elements
- **Glassmorphism**: Extensive use of `backdrop-blur`, semi-transparent backgrounds, and subtle borders.
- **Floating Controls**: The Editor Canvas features a custom floating action bar for Zoom, Fit View, Undo/Redo, and Delete, replacing the default ReactFlow controls.
- **Interactive Previews**: The Template preview isn't just a static image but a rendered DOM structure mimicking the actual node graph.

---
**Maintained by**: WebProdigies Team
