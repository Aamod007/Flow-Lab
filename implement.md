# Product Requirements Document: AgentFlow
## Multi-Agent AI Workflow Orchestrator

**Version:** 2.0  
**Date:** January 31, 2026  
**Status:** Enhancement of FlowLab  
**Document Owner:** Product Team

---

## 1. Executive Summary

### 1.1 Vision
Transform FlowLab from a traditional automation platform into **AgentFlow** - an AI-first workflow orchestrator where intelligent agents collaborate to complete complex tasks.

### 1.2 Product Goal
Enable users to build workflows where AI agents (powered by Gemini, OpenAI, Ollama, Groq) work together autonomously, making intelligent decisions and handling complex tasks that traditional automation cannot.

### 1.3 Success Metrics
- **Adoption:** 60% of FlowLab users create at least one AI workflow within 30 days
- **Engagement:** Average 10 AI agent nodes per workflow
- **Cost Efficiency:** 40% of users choose free local models (Ollama)
- **Retention:** 70% of AI workflow users remain active after 90 days
- **Template Usage:** 50% of new AI workflows start from templates

---

## 2. Current State (FlowLab)

### 2.1 What We Have
✅ Visual workflow editor (ReactFlow)  
✅ Node-based automation (Trigger → Action → Condition)  
✅ 15+ app integrations (Slack, Gmail, Notion, Discord, etc.)  
✅ OAuth connection management  
✅ Template marketplace  
✅ Billing system (Free/Pro/Unlimited tiers)  
✅ Auto-save with local storage fallback  
✅ User authentication (Clerk)  
✅ PostgreSQL database (Prisma)  

### 2.2 What's Missing
❌ AI agent capabilities  
❌ Multi-model support (can't switch between AI providers)  
❌ Intelligent decision-making in workflows  
❌ Real-time execution monitoring  
❌ Agent reasoning visibility  
❌ Cost optimization for AI usage  
❌ AI-specific templates  
❌ Local model support (Ollama)  

---

## 3. Target Users

### 3.1 Primary Personas

**Persona 1: AI Developer (Sarah)**
- **Background:** Full-stack developer, 3 years experience
- **Goal:** Build production AI automation without managing infrastructure
- **Pain Points:** 
  - Expensive to run AI models for testing
  - Hard to chain multiple AI calls together
  - No visibility into what AI is "thinking"
- **Use Cases:**
  - Content generation pipelines
  - Data analysis workflows
  - Customer support automation

**Persona 2: Researcher (Dr. Marcus)**
- **Background:** PhD in Machine Learning, academic setting
- **Goal:** Prototype multi-agent systems quickly
- **Pain Points:**
  - Too much time on infrastructure, not enough on research
  - Need to test different models easily
  - Want reproducible experiments
- **Use Cases:**
  - Research paper analysis
  - Literature review automation
  - Experiment result processing

**Persona 3: Product Manager (Alex)**
- **Background:** Non-technical, leads digital initiatives
- **Goal:** Automate business intelligence tasks
- **Pain Points:**
  - Dependent on engineering for AI projects
  - Can't iterate quickly on ideas
  - Expensive AI costs eating budget
- **Use Cases:**
  - Market research automation
  - Competitive analysis
  - Automated reporting

**Persona 4: Indie Hacker (Jamie)**
- **Background:** Solo entrepreneur building SaaS products
- **Goal:** Add AI features without breaking the bank
- **Pain Points:**
  - Limited budget for AI APIs
  - Need to ship fast
  - Want to experiment with different models
- **Use Cases:**
  - Email newsletter generation
  - Social media content creation
  - SEO optimization workflows

---

## 4. Core Features to Implement

### 4.1 AI Agent Node System

**Description:** New node type that represents an intelligent AI agent

**Key Components:**

**4.1.1 AI Agent Node**
- Visual representation on canvas
- Shows AI provider icon (Gemini, OpenAI, Ollama, Groq)
- Displays current status (idle, thinking, completed, error)
- Color-coded by provider
- Animated when running (pulse effect)
- Preview of output in collapsed state

**4.1.2 Node Configuration Panel**
- **Basic Settings:**
  - Agent name (user-defined)
  - Description (optional)
  
- **Model Selection:**
  - Provider dropdown (Gemini, OpenAI, Anthropic, Groq, Ollama)
  - Model dropdown (filtered by provider)
  - Display: cost per 1K tokens, speed indicator
  
- **Prompt Configuration:**
  - System prompt (textarea)
  - User prompt template (supports variables)
  - Example inputs/outputs
  
- **Advanced Settings:**
  - Temperature slider (0-1)
  - Max tokens input
  - Top-p, frequency penalty (collapsed by default)
  - Stop sequences (optional)
  
- **Tools & Capabilities:**
  - Enable web search
  - Enable code execution
  - Enable image generation
  - Custom function calling
  
- **Fallback & Retry:**
  - Fallback model if primary fails
  - Max retry attempts
  - Timeout duration

**4.1.3 Visual Indicators**
- **Status Badge:**
  - 🟢 Ready (configured, not running)
  - 🟣 Thinking (executing)
  - ✅ Completed (success)
  - ❌ Failed (error)
  - ⏸️ Paused (waiting for input)
  
- **Cost Indicator:**
  - Show estimated cost below node
  - Update in real-time during execution
  - Color-coded: Green (free), Yellow (cheap), Red (expensive)

**User Stories:**
- As a user, I can drag an "AI Agent" node onto the canvas
- As a user, I can configure which AI model the agent uses
- As a user, I can switch between free local models and cloud models
- As a user, I can see the agent's status in real-time
- As a user, I can preview the agent's output without re-running

---

### 4.2 Multi-Model Support

**Description:** Support multiple AI model providers with seamless switching

**4.2.1 Supported Providers**

**Cloud Providers:**
1. **Google Gemini**
   - Models: Gemini 1.5 Flash, Gemini 1.5 Pro
   - Free tier: 60 requests/min, 1500 requests/day
   - Pricing: Flash $0.00035/1K tokens, Pro $0.00125/1K tokens
   - Best for: General tasks, reasoning, vision

2. **OpenAI**
   - Models: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
   - Pricing: GPT-4 $0.03/1K tokens, GPT-3.5 $0.0005/1K tokens
   - Best for: Complex reasoning, creative writing

3. **Anthropic**
   - Models: Claude 3 Opus, Sonnet, Haiku
   - Pricing: Opus $0.015/1K tokens, Haiku $0.00025/1K tokens
   - Best for: Long context, analysis, safety

4. **Groq**
   - Models: Llama 3.1 70B, Mixtral 8x7B
   - Free tier: 14,400 requests/day
   - Pricing: Free (for now)
   - Best for: Fast inference, batch processing

**Local Provider:**
5. **Ollama**
   - Models: 70+ open-source models (Llama 3, Mistral, CodeLlama, Phi-3, etc.)
   - Pricing: FREE (runs locally)
   - Best for: Privacy, cost savings, offline work
   - Requires: Ollama installed on user's machine

**4.2.2 Model Selection UX**

**Provider Selector:**
```
[Dropdown: Select Provider]
├─ 🧠 Gemini (Free tier available)
├─ 🤖 OpenAI
├─ 🎭 Anthropic (Claude)
├─ ⚡ Groq (Fast & Free)
└─ 🦙 Ollama (Local - FREE) [✓ Connected / ✗ Not Detected]
```

**When Ollama Selected:**
- Auto-detect if Ollama is running (check localhost:11434)
- Show connection status indicator
- Display available models from Ollama
- Provide "Download Model" button for new models
- Show model size (2B, 7B, 13B, 70B)
- Link to Ollama installation guide if not detected

**Model Information Display:**
- Model name and size
- Input/output token pricing
- Average speed (tokens/second)
- Context window size
- Capabilities (vision, function calling, etc.)

**4.2.3 API Key Management**

**Settings Page: AI Providers**
- List of all providers
- Status: Connected / Not Connected
- Add/Edit API keys
- Test connection button
- Usage statistics (requests this month)
- Cost tracking per provider

**Security:**
- API keys encrypted in database
- Never displayed in full (show last 4 chars only)
- Stored separately from workflow definitions
- Can be revoked/rotated

**User Stories:**
- As a user, I can add my Gemini API key in settings
- As a user, I can switch an agent's model provider without reconfiguring
- As a user, I can use Ollama without any API keys
- As a user, I see a warning if I select a model but haven't added API key
- As a user, I can test my API connection before using it

---

### 4.3 Real-Time Execution Monitoring

**Description:** Live visibility into workflow execution with agent-by-agent updates

**4.3.1 Execution Dashboard**

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [Canvas View] 50%  │  [Live Monitor] 50%                │
│                    │                                     │
│ Nodes show status  │  Real-time event stream            │
│ Connections animate│  Agent reasoning logs              │
│ Progress bar       │  Cost tracking                     │
└─────────────────────────────────────────────────────────┘
```

**4.3.2 Canvas Updates During Execution**

**Visual Changes:**
- **Before Run:** All nodes gray/idle
- **Agent Starts:** Node border glows, pulse animation
- **Agent Thinking:** 
  - Animated dots "..."
  - Token counter incrementing
  - Cost ticker updating
- **Agent Completes:** 
  - Green checkmark appears
  - Output preview shown (first 100 chars)
  - Duration displayed
- **Connection Animation:**
  - Data flows along edges (animated dots)
  - Shows what data is being passed
- **Overall Progress:**
  - Progress bar at top: "3/5 agents completed"
  - Time elapsed counter
  - Total cost accumulator

**4.3.3 Live Monitor Panel**

**Sections:**

**A. Execution Timeline**
```
Agent 1: Web Scraper     ████████████▶ Completed (12s)
Agent 2: Filter          ████▶ Running... (4s)
Agent 3: Summarizer      [Waiting]
Agent 4: Writer          [Waiting]
Agent 5: Email Sender    [Waiting]
```

**B. Message Stream**
- Chronological log of all events
- Filter by: All / Info / Warnings / Errors
- Each entry shows:
  - Timestamp
  - Agent name
  - Event type (started, completed, error)
  - Message/output preview
  - Expand to see full details

**Example:**
```
10:34:12  [Web Scraper] Started
          Model: Ollama (llama3:8b)
          
10:34:15  [Web Scraper] Progress
          Scraped 47 articles from HackerNews
          
10:34:24  [Web Scraper] ✓ Completed (12s)
          Output: Array(47) → Filter
          Cost: $0.00 (Ollama)
          
10:34:24  [Filter] Started
          Model: Gemini 1.5 Flash
          Input: 47 articles
          
10:34:28  [Filter] Reasoning
          "Analyzing article #5: Contains keywords 'AI', 
          'machine learning'. Relevance score: 0.87. 
          Decision: INCLUDE"
```

**C. Metrics Dashboard**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Progress     │ │ Tokens Used  │ │ Total Cost   │
│   60%        │ │   3,456      │ │   $0.012     │
└──────────────┘ └──────────────┘ └──────────────┘

Breakdown by Agent:
• Web Scraper:  $0.000 (Ollama)
• Filter:       $0.002 (Gemini)
• Summarizer:   $0.000 (Groq)
• Writer:       $0.008 (Gemini Pro)
• Email:        $0.000 (Gmail API)
```

**4.3.4 Agent Reasoning Visibility**

**What to Show:**
- Why agent made a decision
- Confidence scores
- Alternative options considered
- Data extracted/analyzed
- Tools used (web search, code execution)

**Example for Filter Agent:**
```
Agent: Filter
Input: 47 articles
Task: Keep only AI-related

Reasoning Process:
✓ Article 1: "GPT-5 Released"
  Keywords: GPT, AI, model, release
  Confidence: 0.95
  Decision: INCLUDE

✗ Article 2: "New iPhone Features"  
  Keywords: mobile, smartphone, tech
  Confidence: 0.12
  Decision: EXCLUDE (not AI-related)

✓ Article 3: "Neural Networks Breakthrough"
  Keywords: neural, networks, ML, research
  Confidence: 0.89
  Decision: INCLUDE

Summary: 12/47 articles match criteria
```

**4.3.5 Execution Controls**

**Available Actions:**
- ▶️ Run Workflow
- ⏸️ Pause (checkpoint current state)
- ⏹️ Stop (cancel execution)
- ⏭️ Skip Agent (move to next)
- 🔄 Retry Failed Agent
- 📊 Download Logs

**User Stories:**
- As a user, I can watch my workflow execute in real-time
- As a user, I can see what each agent is thinking
- As a user, I can pause execution to review intermediate results
- As a user, I can see exactly how much each agent cost
- As a user, I can export execution logs for debugging

---

### 4.4 AI-Specific Workflow Templates

**Description:** Pre-built workflows showcasing AI agent collaboration

**4.4.1 Template Categories**

**Research & Analysis**
1. **Academic Research Pipeline**
   - Agents: Scholar Search → Summarizer → Fact Checker → Report Writer
   - Use Case: Literature review automation
   - Models: Groq (search) + Gemini Pro (analysis)
   
2. **Market Intelligence**
   - Agents: News Scraper → Trend Analyzer → Competitor Analyzer → Strategy Generator
   - Use Case: Daily market insights
   - Models: Ollama (scraping) + Gemini (analysis)
   
3. **Reddit Sentiment Analysis**
   - Agents: Reddit Scraper → Sentiment Analyzer → Trend Detector → Visualizer
   - Use Case: Track product mentions
   - Models: Groq (fast processing) + Gemini (sentiment)

**Content Generation**
4. **Blog Post Factory**
   - Agents: Topic Generator → Outline Creator → Writer → Editor → SEO Optimizer
   - Use Case: Automated content creation
   - Models: Gemini Flash (outline) + GPT-4 (writing)
   
5. **Social Media Manager**
   - Agents: Content Analyzer → Post Generator → Hashtag Generator → Scheduler
   - Use Case: Automated social posts
   - Models: Ollama (cheap) + Gemini (quality)
   
6. **Email Newsletter**
   - Agents: News Aggregator → Summarizer → Copywriter → Formatter
   - Use Case: Weekly newsletter automation
   - Models: Mix of free models

**Business Automation**
7. **Customer Support Bot**
   - Agents: Ticket Classifier → Response Generator → Quality Checker → Sender
   - Use Case: Handle support emails
   - Models: Gemini Flash (fast response)
   
8. **Meeting Summarizer**
   - Agents: Transcriber → Summarizer → Action Item Extractor → Task Creator
   - Use Case: Post-meeting automation
   - Models: Groq (transcription) + Gemini (summary)

**Data Processing**
9. **Invoice Processor**
   - Agents: OCR → Data Extractor → Validator → Database Writer
   - Use Case: Automate invoice entry
   - Models: Gemini Pro (vision)
   
10. **Report Generator**
    - Agents: Data Fetcher → Analyzer → Visualizer → Report Writer → Emailer
    - Use Case: Automated business reporting
    - Models: Cost-optimized mix

**4.4.2 Template Structure**

**Each Template Includes:**
- **Name & Description:** Clear use case explanation
- **Category Tags:** Research, Content, Business, etc.
- **Difficulty Level:** Beginner, Intermediate, Advanced
- **Estimated Cost:** Per execution (e.g., "$0.05 - $0.15")
- **Execution Time:** Average duration (e.g., "2-3 minutes")
- **Agent Breakdown:**
  - List of all agents
  - Model assignments
  - Brief role description
- **Visual Preview:** 
  - Horizontal workflow diagram
  - Color-coded by agent type
- **Setup Instructions:**
  - Required API keys
  - Configuration steps
  - Test data examples
- **Customization Options:**
  - Which parts can be modified
  - Common variations

**4.4.3 Template Application Flow**

**User Journey:**
1. User browses template marketplace
2. Clicks on "Market Intelligence" template
3. Sees preview modal:
   - Workflow diagram
   - Agent descriptions
   - Cost estimate
   - Required connections
4. Clicks "Use This Template"
5. Modal appears: "Customize Before Importing?"
   - Option A: Use as-is (creates workflow immediately)
   - Option B: Review and customize (opens config wizard)
6. If customizing:
   - Step 1: Name your workflow
   - Step 2: Configure each agent (model selection)
   - Step 3: Review settings
   - Step 4: Create
7. Workflow created and opened in editor
8. User can test immediately or customize further

**Smart Defaults:**
- Template suggests cost-optimized models
- Uses user's existing connections
- Prompts to add missing API keys
- Validates all agents are configured

**User Stories:**
- As a user, I can browse AI-specific templates
- As a user, I can see estimated cost before using a template
- As a user, I can customize agent models when applying template
- As a user, I can test a template with sample data
- As a user, I can publish my own AI workflow as a template

---

### 4.5 Cost Tracking & Optimization

**Description:** Help users understand and minimize AI costs

**4.5.1 Cost Dashboard**

**Overview Metrics:**
```
┌─────────────────────────────────────────────────┐
│ This Month: $12.45        Budget: $50.00        │
│ ████████░░░░░░░░ 24.9%                          │
│                                                 │
│ Last Month: $8.32 (+49% ↑)                      │
└─────────────────────────────────────────────────┘

Cost by Provider:
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Gemini       │ │ OpenAI       │ │ Ollama       │
│ $8.20 (66%)  │ │ $3.15 (25%)  │ │ $0.00 (0%)   │
└──────────────┘ └──────────────┘ └──────────────┘

Most Expensive Workflows:
1. Daily Market Report        $0.45 per run (30 runs = $13.50)
2. Content Generation         $0.18 per run (45 runs = $8.10)
3. Customer Support          $0.08 per run (100 runs = $8.00)
```

**4.5.2 Optimization Suggestions**

**AI-Powered Recommendations:**
```
💡 Optimization Opportunities

1. Switch Filter Agent to Groq
   Current: Gemini Flash ($0.002/run)
   Recommended: Groq (FREE)
   Savings: $2.50/month
   Impact: None (same quality)
   [Apply Change]

2. Use Ollama for Web Scraping
   Current: Gemini Flash ($0.001/run)
   Recommended: Ollama Llama 3 (FREE)
   Savings: $4.00/month
   Impact: Minimal (2% slower)
   [Apply Change]

3. Reduce Max Tokens on Summarizer
   Current: 2048 tokens
   Actual Usage: Average 450 tokens
   Recommended: 1024 tokens
   Savings: 15% cost reduction
   [Apply Change]
```

**4.5.3 Budget Alerts**

**Alert Types:**
- **Warning:** 80% of budget used
- **Critical:** 100% of budget reached
- **Anomaly:** Unusual spending spike detected

**Alert Delivery:**
- In-app notification
- Email alert
- Workflow auto-pause option (if budget exceeded)

**Budget Settings:**
- Set monthly budget limit
- Per-workflow budget caps
- Auto-pause on limit reached
- Grace period options

**4.5.4 Cost Estimation (Pre-Execution)**

**Before Running Workflow:**
```
Execute Workflow?

Estimated Cost: $0.08 - $0.12
Based on average input size

Breakdown:
• Web Scraper:  $0.00 (Ollama)
• Filter:       $0.01 (Gemini)
• Summarizer:   $0.00 (Groq)
• Writer:       $0.07 (Gemini Pro)
• Email:        $0.00 (Gmail)

[Cancel]  [Execute Anyway]
```

**User Stories:**
- As a user, I can see my total AI spending this month
- As a user, I receive suggestions to reduce costs
- As a user, I can set a monthly budget and get alerts
- As a user, I can see cost breakdown by workflow
- As a user, I know estimated cost before running a workflow

---

### 4.6 Ollama Local Model Integration

**Description:** Support running AI models locally for privacy and cost savings

**4.6.1 Ollama Detection & Setup**

**First-Time Experience:**

**Step 1: Detection**
```
Checking for Ollama...
├─ ✓ Ollama detected at localhost:11434
├─ ✓ Version: 0.1.25
└─ ✓ 3 models installed
```

**If Not Detected:**
```
Ollama Not Found

Ollama lets you run AI models locally:
✓ 100% FREE - No API costs
✓ Privacy - Data never leaves your machine
✓ Offline - Works without internet
✓ 70+ models available

[Download Ollama]  [Learn More]
```

**Step 2: Model Management**

**Installed Models View:**
```
Your Ollama Models:

┌────────────────────────────────────────┐
│ 🦙 llama3:8b                    8.0GB  │
│    General purpose, fast               │
│    [Select] [Delete]                   │
├────────────────────────────────────────┤
│ 🔬 mistral:7b                   7.2GB  │
│    Excellent for analysis              │
│    [Select] [Delete]                   │
├────────────────────────────────────────┤
│ 💻 codellama:13b                13.0GB │
│    Specialized for code                │
│    [Select] [Delete]                   │
└────────────────────────────────────────┘

[+ Download More Models]
```

**Download Model Flow:**
```
Download Ollama Model

Search: [llama3________]  [🔍]

Popular Models:
┌────────────────────────────────────────┐
│ 🦙 Llama 3 (8B)              4.7GB     │
│    ⭐⭐⭐⭐⭐ Most popular               │
│    Best for: General tasks, reasoning  │
│    [Download]                          │
├────────────────────────────────────────┤
│ 🔬 Mistral (7B)              4.1GB     │
│    ⭐⭐⭐⭐⭐ Excellent quality          │
│    Best for: Analysis, creative tasks  │
│    [Download]                          │
├────────────────────────────────────────┤
│ 💻 CodeLlama (13B)           7.4GB     │
│    ⭐⭐⭐⭐ Code specialist            │
│    Best for: Programming tasks         │
│    [Download]                          │
└────────────────────────────────────────┘

Downloading llama3:8b...
████████████░░░░░░░░ 58% (2.7GB / 4.7GB)
Estimated time: 3 minutes

[Pause] [Cancel]
```

**4.6.2 Ollama-Specific Features**

**Model Info Display:**
- Model name and size
- Download status
- Last used timestamp
- Performance stats (tokens/second)
- Disk space used

**Usage Benefits:**
```
Using Ollama:
✓ Cost: $0.00
✓ Privacy: Your data stays local
✓ Speed: ~25 tokens/second
✗ Requires: 8GB+ disk space
✗ GPU: Recommended but not required
```

**Performance Tuning:**
- GPU acceleration (if available)
- Context window size
- Number of threads
- Keep-alive duration

**4.6.3 Hybrid Workflows**

**Use Case: Cost Optimization**
```
Smart Workflow Example:

Step 1: Web Scraping → Ollama (FREE)
  └─ Simple extraction doesn't need cloud AI

Step 2: Data Filtering → Groq (FREE)
  └─ Fast batch processing

Step 3: Analysis → Gemini Flash ($0.002)
  └─ Complex reasoning worth small cost

Step 4: Report Writing → Gemini Pro ($0.008)
  └─ High quality output needed

Total Cost: $0.01 (vs $0.15 with all cloud)
Savings: 93%
```

**User Stories:**
- As a user, I can install Ollama and use it immediately
- As a user, I can download models from within AgentFlow
- As a user, I can see which models are installed
- As a user, I can mix Ollama and cloud models in one workflow
- As a user, I can see performance comparison (local vs cloud)

---

### 4.7 Workflow Scheduling & Automation

**Description:** Run workflows automatically on a schedule

**4.7.1 Schedule Configuration**

**Trigger Types:**
1. **Cron-based Schedule**
   ```
   Run Frequency: [Daily ▼]
   
   Time: [09:00 AM] [UTC ▼]
   
   Days:
   [✓] Mon  [✓] Tue  [✓] Wed  [✓] Thu  [✓] Fri  
   [ ] Sat  [ ] Sun
   
   Advanced: [0 9 * * 1-5] (Cron expression)
   
   Next Run: Tomorrow at 9:00 AM UTC
   ```

2. **Interval-based**
   ```
   Run every: [2] [Hours ▼]
   
   Start: [Now / Specific Time]
   End: [Never / After N runs / Specific Date]
   
   Next Run: In 2 hours
   ```

3. **Event-driven**
   ```
   Trigger when:
   ○ New email received (Gmail)
   ○ File uploaded (Google Drive)
   ○ Slack message in #channel
   ○ Webhook received
   ○ Database row added
   
   Debounce: [5] minutes (prevent duplicate runs)
   ```

**4.7.2 Schedule Management**

**Active Schedules List:**
```
┌──────────────────────────────────────────────┐
│ Daily Market Report                          │
│ ⏰ Every day at 9:00 AM                      │
│ 🟢 Active • Next: Tomorrow 9:00 AM          │
│ Last run: Success (2 hours ago)             │
│ [Edit] [Pause] [Delete]                     │
├──────────────────────────────────────────────┤
│ Content Generator                            │
│ ⏰ Every 3 hours                             │
│ ⏸️ Paused                                     │
│ Last run: Success (1 day ago)               │
│ [Edit] [Resume] [Delete]                    │
└──────────────────────────────────────────────┘
```

**4.7.3 Execution History**

**Per Schedule:**
```
Execution History (Last 30 days):

Jan 30  09:00  ✓ Success  2.3s  $0.08
Jan 29  09:00  ✓ Success  2.1s  $0.07
Jan 28  09:00  ✗ Failed   1.5s  $0.02 [View Error]
Jan 27  09:00  ✓ Success  2.4s  $0.09

Success Rate: 96% (28/30)
Avg Duration: 2.2s
Total Cost: $2.34
```

**4.7.4 Error Handling for Scheduled Runs**

**Retry Logic:**
```
If scheduled run fails:
├─ Retry after: [5] minutes
├─ Max retries: [3]
├─ Exponential backoff: [✓]
└─ Notify on failure: [✓] Email  [✓] Slack
```

**Failure Actions:**
- Continue schedule (ignore failure)
- Pause schedule (manual intervention needed)
- Run error workflow (trigger another workflow)
- Send notification

**User Stories:**
- As a user, I can schedule a workflow to run daily at 9 AM
- As a user, I can pause/resume schedules without deleting them
- As a user, I can see history of all scheduled executions
- As a user, I get notified if a scheduled run fails
- As a user, I can set retry logic for failed runs

---

### 4.8 Collaboration & Sharing

**Description:** Work with teams on AI workflows

**4.8.1 Workspace Sharing**

**Share Modal:**
```
Share Workflow: "Market Research Bot"

┌────────────────────────────────────────┐
│ Share Link:                            │
│ https://agentflow.app/w/abc123        │
│ [📋 Copy Link]                         │
│                                        │
│ Permissions:                           │
│ ○ View Only                            │
│ ○ Can Edit                             │
│ ● Can Execute                          │
│                                        │
│ Public Access:                         │
│ [✓] Anyone with link can access        │
│ [ ] Require login                      │
└────────────────────────────────────────┘

Invite Team Members:
┌────────────────────────────────────────┐
│ Email: [sarah@company.com______] [Add] │
└────────────────────────────────────────┘

Current Team:
• john@company.com (Owner) - Full Access
• sarah@company.com (Editor) - Can Edit
• bob@company.com (Viewer) - View Only
```

**4.8.2 Permissions System**

**Permission Levels:**
1. **Owner**
   - Full access
   - Can delete workflow
   - Can manage team
   - Can change permissions

2. **Editor**
   - Can edit workflow
   - Can execute
   - Can view logs
   - Cannot delete
   - Cannot change permissions

3. **Executor**
   - Can execute workflow
   - Can view logs
   - Cannot edit
   - Cannot share

4. **Viewer**
   - Can view workflow
   - Can view logs (read-only)
   - Cannot execute
   - Cannot edit

**4.8.3 Collaborative Editing (Optional)**

**Real-time Features:**
- See who's viewing workflow (avatars in top-right)
- Live cursor positions (when multiple editors)
- Changes highlighted in real-time
- Auto-merge conflicts
- Activity feed: "Sarah added Filter Agent (2 min ago)"

**4.8.4 Comments & Discussions**

**Node Comments:**
- Right-click node → Add Comment
- Comment bubble appears on canvas
- Threaded discussions
- @mention team members
- Mark as resolved

**Example:**
```
💬 Sarah: "This agent is using GPT-4, should we 
         switch to Gemini to save costs?"
    └─ 💬 John: "Good idea! Changed to Gemini Pro"
    └─ 💬 Sarah: "Perfect, marked as resolved ✓"
```

**4.8.5 Team Templates**

**Publishing to Team:**
```
Publish as Team Template?

Template Name: Market Research v2.0
Category: Research & Analysis
Visibility:
  ○ Private (Only me)
  ● Team Only
  ○ Public (Template marketplace)

Description:
[Automated market research with competitor analysis]

[Cancel] [Publish Template]
```

**User Stories:**
- As a user, I can share a workflow with my team via link
- As a user, I can set different permission levels for teammates
- As a user, I can see who else is viewing/editing the workflow
- As a user, I can comment on specific nodes
- As a user, I can publish workflows as team templates

---

## 5. User Workflows

### 5.1 First-Time User Journey: Creating First AI Workflow

**Step 1: Welcome & Onboarding**
```
User lands on dashboard after signup

Welcome Banner:
┌──────────────────────────────────────────┐
│ 🎉 Welcome to AgentFlow!                 │
│                                          │
│ Get started in 3 easy steps:             │
│ 1. Connect an AI provider                │
│ 2. Create your first AI workflow         │
│ 3. Watch agents collaborate              │
│                                          │
│ [Start Tutorial] [Browse Templates]      │
└──────────────────────────────────────────┘
```

**Step 2: Add API Keys (if starting fresh)**
```
User clicks: Settings → AI Providers

Guided Setup:
┌──────────────────────────────────────────┐
│ Let's connect your first AI provider     │
│                                          │
│ We recommend starting with:              │
│ 🧠 Gemini (Free tier: 60 requests/min)   │
│                                          │
│ [Add Gemini API Key] [Use Ollama Instead]│
└──────────────────────────────────────────┘

Enter API Key:
┌──────────────────────────────────────────┐
│ Gemini API Key:                          │
│ [AIzaSy... (hidden) _______________]     │
│                                          │
│ Don't have one?                          │
│ [Get Free API Key] (links to Google AI)  │
│                                          │
│ [Test Connection] [Save]                 │
└──────────────────────────────────────────┘

✓ Connection successful!
Next: Create your first workflow
```

**Step 3: Choose Starting Point**
```
Create New Workflow:

┌──────────────────────────────────────────┐
│ ○ Start from scratch                     │
│   Build your workflow step-by-step       │
│                                          │
│ ● Use a template (Recommended)           │
│   Start with a pre-built AI workflow     │
│                                          │
│ ○ Import from file                       │
│   Upload a workflow JSON file            │
└──────────────────────────────────────────┘

[Continue]
```

**Step 4: Select Template**
```
Choose a Template:

[Search templates...____________]

Beginner-Friendly:
┌─────────────────────────────────┐
│ 📰 News Summarizer              │
│ Scrape news → Summarize → Email │
│ ⭐⭐⭐⭐⭐ (1,234 uses)           │
│ Est. Cost: $0.01 per run        │
│ [Preview] [Use This]            │
└─────────────────────────────────┘

User clicks: [Preview]
```

**Step 5: Template Preview**
```
News Summarizer Preview:

Workflow Steps:
[Web Scraper] → [Filter] → [Summarizer] → [Email]
   (Ollama)     (Gemini)     (Groq)        (Gmail)

What it does:
1. Scrapes news from your favorite sites
2. Filters for topics you care about
3. Summarizes each article
4. Emails you a daily digest

Cost: ~$0.01 per run (mostly free models!)
Time: ~2-3 minutes

Required:
✓ Gemini API key (you have this)
✗ Gmail connection (click to add)

[Add Gmail] [Use Template Anyway]
```

**Step 6: Customize Template**
```
Customize Your Workflow:

Workflow Name:
[My Daily Tech News_________________]

Which topics interest you?
[AI, Machine Learning, Startups______]

Email time:
[09:00 AM] [Daily ▼]

Review agents:
✓ Web Scraper (Ollama llama3) - FREE
✓ Filter (Gemini Flash) - $0.001
✓ Summarizer (Groq) - FREE  
✓ Email Sender (Gmail) - FREE

Total Est. Cost: $0.001 per run

[Create Workflow]
```

**Step 7: Workflow Created**
```
✓ Workflow Created Successfully!

"My Daily Tech News" is ready to go.

What would you like to do?
┌──────────────────────────────────────────┐
│ [▶️ Test Run Now]                        │
│   See it in action with sample data      │
│                                          │
│ [⏰ Schedule Daily]                      │
│   Set it to run automatically            │
│                                          │
│ [✏️ Customize More]                      │
│   Edit agents and connections            │
└──────────────────────────────────────────┘
```

**Step 8: First Execution**
```
User clicks: [▶️ Test Run Now]

Executing "My Daily Tech News"...

[Live view of canvas with agents lighting up]
[Real-time log on the side]

Progress: 3/4 agents completed
Time: 1m 32s
Cost so far: $0.001

[Monitor shows:]
✓ Web Scraper: Found 47 articles (12s, $0.00)
✓ Filter: 12 AI-related articles (8s, $0.001)
✓ Summarizer: Running... (18s so far)
⏳ Email Sender: Waiting...
```

**Step 9: Completion & Results**
```
✓ Workflow Completed!

Duration: 2m 15s
Total Cost: $0.001
Status: Success

Results:
📧 Email sent with 12 article summaries

[View Full Logs] [Run Again] [Schedule]

💡 Pro Tip: 
You can save 100% on costs by switching 
all agents to Ollama (local models).
Want to try? [Switch to Ollama]
```

**Step 10: Schedule for Daily Use**
```
User clicks: [Schedule]

Schedule Workflow:

Frequency: [Daily ▼]
Time: [09:00 AM] [Your Timezone ▼]
Days: [✓] All weekdays

Start: [Tomorrow]
End: [Never ▼]

Budget Protection:
Pause if cost exceeds: [$10] per month

[Cancel] [Create Schedule]

✓ Schedule Created!
Your workflow will run every weekday at 9 AM.
Next run: Tomorrow at 9:00 AM
```

---

### 5.2 Power User Journey: Building Complex Multi-Agent Workflow

**Scenario:** User wants to build "Competitor Analysis Bot"

**Step 1: Create from Scratch**
```
User clicks: New Workflow → Start from Scratch

Canvas opens (empty)

Sidebar shows:
┌──────────────────────────────────┐
│ Add Nodes:                       │
│                                  │
│ 🤖 AI Agents                     │
│   [AI Agent]                     │
│                                  │
│ ⚡ Triggers                       │
│   [Manual] [Schedule] [Webhook]  │
│                                  │
│ 🔗 Actions                       │
│   [HTTP] [Database] [Email]      │
│                                  │
│ 🔀 Logic                         │
│   [Condition] [Loop] [Merge]     │
└──────────────────────────────────┘
```

**Step 2: Add Trigger**
```
User drags [Schedule] trigger to canvas

Configure Schedule Trigger:
┌──────────────────────────────────┐
│ Name: Daily Trigger              │
│ Frequency: Daily at 9 AM         │
│ [Save]                           │
└──────────────────────────────────┘
```

**Step 3: Add First AI Agent**
```
User drags [AI Agent] to canvas
Connects Schedule → AI Agent

Configure AI Agent:
┌──────────────────────────────────┐
│ Agent Name: News Scraper         │
│                                  │
│ Provider: [Ollama ▼]             │
│ Model: [llama3:8b ▼]             │
│                                  │
│ System Prompt:                   │
│ You are a web scraper. Extract  │
│ news about {company} from:       │
│ - TechCrunch                     │
│ - HackerNews                     │
│ - Reddit r/technology            │
│                                  │
│ Variables:                       │
│ company: [competitor-name______] │
│                                  │
│ Tools: [✓] Web Search            │
│                                  │
│ Temperature: [0.3] (Precise)     │
│ Max Tokens: [2048]               │
│                                  │
│ [Test Agent] [Save]              │
└──────────────────────────────────┘
```

**Step 4: Test Individual Agent**
```
User clicks: [Test Agent]

Testing News Scraper...

Input Variables:
company: "OpenAI"

Result:
┌──────────────────────────────────┐
│ Found 23 articles about OpenAI:  │
│                                  │
│ 1. "GPT-5 Release Date Leaked"   │
│    Source: TechCrunch            │
│    URL: https://...              │
│                                  │
│ 2. "OpenAI Raises $10B"          │
│    Source: HackerNews            │
│    URL: https://...              │
│                                  │
│ ... (21 more)                    │
│                                  │
│ Duration: 15s                    │
│ Cost: $0.00 (Ollama)             │
│ Tokens: 1,234                    │
└──────────────────────────────────┘

✓ Test Successful!
[Use This Output] [Adjust & Retest]
```

**Step 5: Add More Agents**
```
User adds more AI agents:

[Schedule] → [News Scraper] → [Sentiment Analyzer] → [Trend Detector] → [Report Writer] → [Email Sender]

User configures each:

Sentiment Analyzer:
- Provider: Gemini Flash (cheap, fast)
- Task: Analyze sentiment of each article
- Output: Positive/Negative/Neutral + score

Trend Detector:
- Provider: Gemini Pro (better reasoning)
- Task: Identify patterns across articles
- Output: List of trends

Report Writer:
- Provider: GPT-4 (best quality)
- Task: Create executive summary
- Output: Formatted markdown report
```

**Step 6: Add Conditional Logic**
```
User wants: "Only send email if 5+ articles found"

User adds [Condition] node between Trend Detector and Report Writer

Configure Condition:
┌──────────────────────────────────┐
│ Condition:                       │
│ If: {{newsCount}} >= 5           │
│                                  │
│ Then: → Report Writer            │
│ Else: → [End Workflow]           │
│                                  │
│ Variables:                       │
│ newsCount = News Scraper.output.length │
└──────────────────────────────────┘
```

**Step 7: Cost Optimization**
```
User views workflow summary:
┌──────────────────────────────────┐
│ Workflow Cost Estimate:          │
│                                  │
│ News Scraper:    $0.00 (Ollama)  │
│ Sentiment:       $0.003 (Gemini) │
│ Trend Detector:  $0.012 (Gemini) │
│ Report Writer:   $0.080 (GPT-4)  │
│ Email:           $0.00 (Gmail)   │
│                                  │
│ Total: ~$0.095 per run           │
│                                  │
│ 💡 Optimization Available:       │
│ Switch Report Writer to Gemini Pro│
│ Save: $0.065 per run (68% less)  │
│ Trade-off: Slightly lower quality│
│                                  │
│ [Apply Optimization] [Keep GPT-4]│
└──────────────────────────────────┘
```

**Step 8: Save & Version**
```
User clicks: Save

Save Workflow:
┌──────────────────────────────────┐
│ Name: Competitor Analysis Bot    │
│ Description: Daily competitor    │
│ monitoring with sentiment        │
│                                  │
│ Version: 1.0                     │
│ Changelog: Initial version       │
│                                  │
│ [Save as Draft] [Save & Publish] │
└──────────────────────────────────┘

✓ Workflow Saved!
Version 1.0 created
```

**Step 9: Schedule & Monitor**
```
User clicks: Schedule

Schedule created for daily 9 AM

First Run (Next Day):
User receives dashboard notification:
"Competitor Analysis Bot completed (2m 34s, $0.095)"

User clicks notification → Execution Details:
┌──────────────────────────────────┐
│ Execution #1 - Jan 30, 9:00 AM   │
│                                  │
│ Status: ✓ Success                │
│ Duration: 2m 34s                 │
│ Cost: $0.095                     │
│                                  │
│ Agent Breakdown:                 │
│ ✓ News Scraper: 18s, $0.00       │
│ ✓ Sentiment: 12s, $0.003         │
│ ✓ Trend Detector: 45s, $0.012    │
│ ✓ Report Writer: 38s, $0.080     │
│ ✓ Email Sent: 1s, $0.00          │
│                                  │
│ [View Full Logs] [Download Report]│
└──────────────────────────────────┘
```

**Step 10: Iterate & Improve**
```
After a week, user reviews:

Analytics Dashboard:
┌──────────────────────────────────┐
│ Past 7 Days:                     │
│                                  │
│ Executions: 7                    │
│ Success Rate: 100%               │
│ Avg Duration: 2m 28s             │
│ Total Cost: $0.665               │
│                                  │
│ Insights:                        │
│ • Peak tokens: Report Writer     │
│ • Bottleneck: Trend Detector     │
│                                  │
│ Suggestions:                     │
│ 💡 Add caching for repeated news │
│ 💡 Switch to Groq for speed      │
└──────────────────────────────────┘

User makes improvements:
- Adds caching node
- Switches Sentiment to Groq (free + fast)
- Saves as Version 1.1
```

---

### 5.3 Researcher Journey: Testing Multiple Models

**Scenario:** Academic researcher comparing AI models for paper

**Step 1: Create Experiment Workflow**
```
User creates: "Model Comparison Experiment"

Goal: Test Llama 3, Mistral, Gemini, GPT-4 on same task
```

**Step 2: Parallel Agent Setup**
```
Canvas layout:

[Input Data] ─┬─→ [Llama 3 Agent] ─┐
              ├─→ [Mistral Agent] ─┤
              ├─→ [Gemini Agent] ──┼─→ [Compare Results]
              └─→ [GPT-4 Agent] ───┘

Each agent configured identically:
- Same system prompt
- Same temperature (0.7)
- Same max tokens (1000)
- Same test input
```

**Step 3: Run Comparison**
```
Execution Results:

┌─────────────────────────────────────────────┐
│ Model        │ Time  │ Cost  │ Quality Score│
├─────────────────────────────────────────────┤
│ Llama 3 (8B) │ 12s   │ $0.00 │ 7.5/10       │
│ Mistral (7B) │ 15s   │ $0.00 │ 8.0/10       │
│ Gemini Flash │ 3s    │ $0.001│ 8.5/10       │
│ GPT-4        │ 8s    │ $0.03 │ 9.0/10       │
└─────────────────────────────────────────────┘

Insights:
• Best Value: Gemini Flash (fast + cheap + good)
• Best Quality: GPT-4 (but 30x more expensive)
• Best Free: Mistral (quality vs Llama 3)

[Export Data] [Run Again] [Save Results]
```

**Step 4: Export for Paper**
```
User clicks: [Export Data]

Export Format:
○ CSV (for graphs)
● JSON (full data)
○ Markdown (table)

Downloaded: model_comparison_jan30.json

Includes:
- Full responses
- Token counts
- Timing data
- Cost data
- Quality scores
```

---

## 6. Technical Requirements

### 6.1 Performance Requirements

**Response Times:**
- Canvas load: < 1 second
- Node drag/drop: < 50ms lag
- Save workflow: < 500ms
- API key validation: < 2 seconds
- Ollama detection: < 3 seconds
- Model download start: < 1 second

**Execution:**
- Workflow start latency: < 500ms
- Real-time update delay: < 200ms
- WebSocket message latency: < 100ms
- Log query response: < 1 second

**Scalability:**
- Support 100+ nodes per workflow
- Handle 50 concurrent executions per user
- Process 1000+ workflows/minute (platform-wide)

### 6.2 Data Storage

**Database Schema Additions:**

**API Keys Table:**
- User ID (foreign key)
- Provider (gemini, openai, ollama, etc.)
- Encrypted API key
- Status (active, revoked)
- Created/Updated timestamps
- Last used timestamp

**Execution Logs Table:**
- Execution ID
- Workflow ID
- Agent ID
- Status (running, completed, failed)
- Input data (JSON)
- Output data (JSON)
- Reasoning/thoughts (text)
- Start/end timestamps
- Duration (milliseconds)
- Token usage (input/output)
- Cost (decimal)
- Error message (if failed)

**Cost Tracking Table:**
- User ID
- Month/Year
- Provider breakdown (JSON)
- Total cost
- Budget limit
- Alerts sent

**Ollama Models Table:**
- Model name
- Size (GB)
- Downloaded (boolean)
- Last used timestamp
- Performance stats (JSON)

### 6.3 Security Requirements

**API Key Storage:**
- Encrypt all API keys at rest (AES-256)
- Never log API keys
- Never send to frontend
- Rotate encryption keys quarterly

**Data Privacy:**
- User workflow data isolated (row-level security)
- Execution logs purged after 90 days (configurable)
- PII detection in logs (blur sensitive data)
- GDPR compliance (right to delete)

**Rate Limiting:**
- Per user: 100 requests/minute
- Per API key: Provider-specific limits
- Workflow execution: 50 concurrent/user

**Access Control:**
- Workspace-level permissions
- Read/Write/Execute/Admin roles
- Audit log for all permission changes

### 6.4 Integration Requirements

**AI Provider SDKs:**
- Google Generative AI SDK (Gemini)
- OpenAI SDK
- Anthropic SDK
- Groq SDK
- Ollama REST API (fetch)

**Monitoring:**
- WebSocket server (Socket.io or Pusher)
- Real-time event streaming
- Heartbeat checks every 30s

**Error Handling:**
- Retry logic with exponential backoff
- Circuit breaker for failing providers
- Graceful degradation (fallback models)
- User-friendly error messages

### 6.5 Browser Requirements

**Supported Browsers:**
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

**Features Used:**
- WebSocket support
- LocalStorage (10MB+)
- Modern JavaScript (ES2020)
- CSS Grid & Flexbox

---

## 7. Success Criteria

### 7.1 MVP Definition (Week 1-2)

**Must Have:**
- ✅ AI Agent node type working
- ✅ Gemini integration (free tier)
- ✅ Ollama integration (local)
- ✅ Basic real-time monitoring
- ✅ 5 AI workflow templates
- ✅ Cost tracking dashboard
- ✅ API key management page

**Nice to Have:**
- OpenAI integration
- Advanced reasoning display
- Collaborative editing
- Budget alerts

### 7.2 Launch Metrics (Month 1)

**User Metrics:**
- 100 AI workflows created
- 60% of users add API key
- 30% use Ollama
- 50% use templates

**Technical Metrics:**
- 95% workflow success rate
- < 2s average execution start time
- < 5% error rate
- 99% uptime

**Business Metrics:**
- Average $0.05 cost per workflow (user spending)
- 40% use free models only
- 70% user retention (Day 7)

### 7.3 Quality Gates

**Before Launch:**
- [ ] All AI providers tested
- [ ] Error handling verified
- [ ] Cost calculations accurate
- [ ] Templates work end-to-end
- [ ] Real-time monitoring stable
- [ ] Ollama installation documented
- [ ] Demo video created
- [ ] User documentation complete

---

## 8. Risks & Mitigations

### 8.1 Technical Risks

**Risk:** AI provider API changes break integrations  
**Mitigation:** Abstract provider logic, version SDK dependencies, monitor changelogs

**Risk:** WebSocket connection unstable  
**Mitigation:** Auto-reconnect logic, fallback to polling, connection status indicator

**Risk:** Ollama not installed on user's machine  
**Mitigation:** Clear installation guide, detect automatically, suggest alternatives

**Risk:** High execution costs surprise users  
**Mitigation:** Pre-execution cost estimates, budget alerts, default to free models

### 8.2 Product Risks

**Risk:** Users don't understand AI agents vs automation  
**Mitigation:** Clear onboarding, tooltips, video tutorials, template showcase

**Risk:** Too complex for non-technical users  
**Mitigation:** Simple templates, smart defaults, guided wizard, hide advanced options

**Risk:** Competition from established tools (n8n, Zapier)  
**Mitigation:** Focus on AI-first features, better UX, free local models, cost transparency

### 8.3 Business Risks

**Risk:** Free tier users never upgrade  
**Mitigation:** Usage limits on free tier, premium templates, advanced features (collaboration) paid-only

**Risk:** High infrastructure costs for free users  
**Mitigation:** Encourage Ollama use, execution limits, require API keys (users pay providers directly)

---

## 9. Future Enhancements (Post-MVP)

### Phase 2 (Month 2-3)
- Agent marketplace (users publish custom agents)
- Advanced debugging tools
- Workflow versioning with visual diff
- Team collaboration features
- Mobile app (view/execute only)

### Phase 3 (Month 4-6)
- Voice-to-workflow (describe workflow, AI builds it)
- Auto-optimization (AI suggests improvements)
- Integration with 50+ more apps
- Enterprise SSO/SAML
- On-premise deployment option

### Phase 4 (Month 7-12)
- Multi-agent orchestration (agents coordinate themselves)
- Training custom models (fine-tuning)
- Workflow analytics & insights
- Compliance certifications (SOC 2, HIPAA)
- White-label option

---

## 10. Appendix

### 10.1 Glossary

**Agent:** An AI-powered node that performs intelligent tasks
**Provider:** AI model service (Gemini, OpenAI, Ollama, etc.)
**Model:** Specific AI model (GPT-4, Llama 3, etc.)
**Temperature:** Creativity setting (0=precise, 1=creative)
**Tokens:** Units of text processed by AI (≈4 chars/token)
**Context Window:** Maximum input size for model
**Ollama:** Tool to run AI models locally
**Prompt:** Instructions given to AI agent
**System Prompt:** Background instructions for agent behavior
**User Prompt:** Specific task/question for agent
**Reasoning:** Agent's thought process (visible in logs)
**Fallback:** Backup model if primary fails
**Cost Optimization:** Reducing AI API expenses
**Template:** Pre-built workflow users can copy

### 10.2 Competitor Comparison

| Feature | AgentFlow | n8n | Zapier | Make |
|---------|-----------|-----|--------|------|
| AI Agents | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Local Models | ✅ Ollama | ❌ No | ❌ No | ❌ No |
| Multi-Model | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Cost Tracking | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Real-time Monitor | ✅ Yes | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic |
| Reasoning Logs | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Free Tier | ✅ Generous | ✅ Limited | ❌ Trial | ❌ Trial |

### 10.3 User Research Insights

**Pain Points (from FlowLab users):**
- "Wish I could use AI in my workflows"
- "Too expensive to call OpenAI every time"
- "Want to see what the AI is thinking"
- "Hard to debug when AI gives wrong output"
- "Need to test multiple models easily"

**Feature Requests:**
- AI-powered nodes (85% of users)
- Cost optimization tools (72%)
- Local model support (68%)
- Template marketplace (91%)
- Better execution visibility (79%)

---

**Document Status:** Ready for Implementation  
**Next Steps:** Begin Phase 1 development  
**Estimated Timeline:** 2-3 weeks to MVP  
**Team:** Full-stack developer(s), Designer, Product Manager

---


