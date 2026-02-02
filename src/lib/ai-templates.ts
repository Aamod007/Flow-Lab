/**
 * AI Workflow Template Definitions
 * 
 * Each template includes:
 * - Metadata (name, description, category)
 * - Workflow structure (nodes, edges)
 * - Agent configurations (provider, model, prompts)
 * - Cost estimates
 * - Execution time estimates
 * - Required connections
 */

export interface AIWorkflowAgent {
  id: string
  name: string
  type: string
  role: string
  provider: 'gemini' | 'openai' | 'ollama' | 'groq' | 'anthropic' | 'slack' | 'discord' | 'notion' | 'gmail'
  model: string
  systemPrompt: string
  position: { x: number; y: number }
}

export interface AIWorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'research' | 'content' | 'analysis' | 'automation' | 'communication'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedCost: string
  executionTime: string
  requiredConnections: string[]
  agents: AIWorkflowAgent[]
  connections: {
    from: string
    to: string
  }[]
  icon: string
  tags: string[]
}

export const AI_TEMPLATES: AIWorkflowTemplate[] = [
  {
    id: 'daily-news-intelligence',
    name: 'Daily News Intelligence',
    description: 'Automatically scrape news, filter for topics you care about, summarize, and get a daily digest. Perfect for staying updated on industry trends.',
    category: 'research',
    difficulty: 'beginner',
    estimatedCost: '$0.01 - $0.02',
    executionTime: '2-3 minutes',
    requiredConnections: [],
    icon: '📰',
    tags: ['news', 'automation', 'daily', 'research'],
    agents: [
      {
        id: 'scraper',
        name: 'News Scraper',
        type: 'AI',
        role: 'Scrape news from HackerNews and TechCrunch',
        provider: 'ollama',
        model: 'llama3:8b',
        systemPrompt: 'You are a web scraper assistant. Extract article titles, URLs, and brief summaries from news websites. Return as a JSON array with objects containing: title, url, summary, source, publishedDate. Focus on the most recent and relevant articles.',
        position: { x: 100, y: 200 }
      },
      {
        id: 'filter',
        name: 'Topic Filter',
        type: 'AI',
        role: 'Filter articles for AI/ML topics',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'Analyze the provided articles and keep only those related to AI, machine learning, automation, or technology innovation. Score each article 0-100 on relevance. Return filtered array with relevanceScore added to each article.',
        position: { x: 400, y: 200 }
      },
      {
        id: 'summarizer',
        name: 'Summarizer',
        type: 'AI',
        role: 'Summarize each article in 2 sentences',
        provider: 'groq',
        model: 'llama-3.1-70b-versatile',
        systemPrompt: 'For each article in the array, create a concise 2-sentence summary that captures the key insight and why it matters. Add a "tldr" field to each article object.',
        position: { x: 700, y: 200 }
      },
      {
        id: 'writer',
        name: 'Digest Writer',
        type: 'AI',
        role: 'Create daily digest report',
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        systemPrompt: 'Create an engaging daily news digest from the summarized articles. Format in markdown with sections: Top Stories, Emerging Trends, Worth Watching. Include a brief intro and conclude with key takeaways. Make it scannable and insightful.',
        position: { x: 1000, y: 200 }
      }
    ],
    connections: [
      { from: 'scraper', to: 'filter' },
      { from: 'filter', to: 'summarizer' },
      { from: 'summarizer', to: 'writer' }
    ]
  },

  {
    id: 'content-generation-pipeline',
    name: 'Content Generation Pipeline',
    description: 'Generate high-quality blog posts with AI: topic research, outline creation, writing, editing, and SEO optimization. Complete content workflow.',
    category: 'content',
    difficulty: 'intermediate',
    estimatedCost: '$0.10 - $0.20',
    executionTime: '3-5 minutes',
    requiredConnections: [],
    icon: '✍️',
    tags: ['content', 'blog', 'seo', 'writing'],
    agents: [
      {
        id: 'topic-gen',
        name: 'Topic Generator',
        type: 'AI',
        role: 'Generate trending blog topics',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'Generate 5 engaging blog post topics for the given niche. Consider SEO potential, user intent, and trending themes. Return JSON array with: title, targetKeyword, searchIntent, estimatedDifficulty.',
        position: { x: 100, y: 200 }
      },
      {
        id: 'outliner',
        name: 'Outline Creator',
        type: 'AI',
        role: 'Create detailed outline',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'Create a comprehensive blog post outline for the selected topic. Include H2 and H3 headings, key points for each section, suggested word count per section. Structure for readability and SEO.',
        position: { x: 400, y: 200 }
      },
      {
        id: 'writer',
        name: 'Content Writer',
        type: 'AI',
        role: 'Write full blog post',
        provider: 'openai',
        model: 'gpt-4',
        systemPrompt: 'Write an engaging, well-researched blog post following the provided outline. Use conversational tone, include examples and data points. Target 1500-2000 words. Add transition sentences between sections.',
        position: { x: 700, y: 200 }
      },
      {
        id: 'editor',
        name: 'Editor',
        type: 'AI',
        role: 'Edit and improve content',
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        systemPrompt: 'Review and edit the blog post for: grammar, clarity, flow, engagement, and factual accuracy. Maintain original voice. Suggest improvements for weak sections. Return edited version with tracked changes noted.',
        position: { x: 1000, y: 200 }
      },
      {
        id: 'seo',
        name: 'SEO Optimizer',
        type: 'AI',
        role: 'Optimize for search engines',
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        systemPrompt: 'Optimize the blog post for SEO. Add: meta description (155 chars), focus keyword placement, internal linking suggestions, image alt text suggestions, schema markup recommendations. Return as markdown with YAML frontmatter.',
        position: { x: 1300, y: 200 }
      }
    ],
    connections: [
      { from: 'topic-gen', to: 'outliner' },
      { from: 'outliner', to: 'writer' },
      { from: 'writer', to: 'editor' },
      { from: 'editor', to: 'seo' }
    ]
  },

  {
    id: 'customer-support-automation',
    name: 'Customer Support Automation',
    description: 'Classify support tickets by urgency and category, generate helpful responses, verify quality, and route to the right team via Slack.',
    category: 'automation',
    difficulty: 'intermediate',
    estimatedCost: '$0.03 - $0.08',
    executionTime: '30-60 seconds',
    requiredConnections: ['slack'],
    icon: '🎧',
    tags: ['support', 'automation', 'slack', 'customer-service'],
    agents: [
      {
        id: 'classifier',
        name: 'Ticket Classifier',
        type: 'AI',
        role: 'Classify ticket urgency and category',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'Classify the support ticket. Return JSON: { urgency: "low"|"medium"|"high"|"critical", category: "technical"|"billing"|"general"|"feature-request"|"bug", sentiment: "positive"|"neutral"|"negative", confidence: 0-100 }',
        position: { x: 100, y: 200 }
      },
      {
        id: 'responder',
        name: 'Response Generator',
        type: 'AI',
        role: 'Generate helpful response',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        systemPrompt: 'Generate a helpful, empathetic customer support response. Address their concern directly, provide actionable steps, and offer further assistance. Be professional but warm. Max 200 words.',
        position: { x: 400, y: 200 }
      },
      {
        id: 'quality-check',
        name: 'Quality Checker',
        type: 'AI',
        role: 'Verify response quality',
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        systemPrompt: 'Review the support response for: accuracy, tone appropriateness, completeness, and brand alignment. Return: { approved: boolean, score: 0-100, suggestions: string[], needsHumanReview: boolean, reason: string }',
        position: { x: 700, y: 200 }
      },
      {
        id: 'slack-sender',
        name: 'Slack Router',
        type: 'Slack',
        role: 'Route to support channel',
        provider: 'slack',
        model: '',
        systemPrompt: '',
        position: { x: 1000, y: 200 }
      }
    ],
    connections: [
      { from: 'classifier', to: 'responder' },
      { from: 'responder', to: 'quality-check' },
      { from: 'quality-check', to: 'slack-sender' }
    ]
  },

  {
    id: 'research-paper-analyzer',
    name: 'Research Paper Analyzer',
    description: 'Upload a research paper and get: key findings extraction, methodology analysis, limitations identification, and a plain-English summary.',
    category: 'research',
    difficulty: 'advanced',
    estimatedCost: '$0.08 - $0.15',
    executionTime: '2-4 minutes',
    requiredConnections: [],
    icon: '🔬',
    tags: ['research', 'academic', 'analysis', 'summary'],
    agents: [
      {
        id: 'extractor',
        name: 'Content Extractor',
        type: 'AI',
        role: 'Extract key sections from paper',
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        systemPrompt: 'Extract and structure the key sections from this research paper: Abstract, Introduction (problem statement), Methodology, Key Findings, Limitations, Future Work. Return as structured JSON.',
        position: { x: 100, y: 200 }
      },
      {
        id: 'methodology-analyzer',
        name: 'Methodology Analyzer',
        type: 'AI',
        role: 'Analyze research methodology',
        provider: 'openai',
        model: 'gpt-4',
        systemPrompt: 'Analyze the research methodology. Evaluate: sample size adequacy, control group presence, statistical methods used, potential biases, replicability. Return structured assessment with strengths and weaknesses.',
        position: { x: 400, y: 200 }
      },
      {
        id: 'findings-synthesizer',
        name: 'Findings Synthesizer',
        type: 'AI',
        role: 'Synthesize and validate findings',
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        systemPrompt: 'Synthesize the key findings. For each finding: state the claim, evidence strength (1-5), practical implications, and how it relates to existing research. Identify any contradictions or gaps.',
        position: { x: 700, y: 200 }
      },
      {
        id: 'plain-english-writer',
        name: 'Plain English Writer',
        type: 'AI',
        role: 'Create accessible summary',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'Transform the research analysis into a plain-English summary suitable for non-experts. Structure: What was studied, Why it matters, What they found, What it means for you. Avoid jargon. Max 500 words.',
        position: { x: 1000, y: 200 }
      }
    ],
    connections: [
      { from: 'extractor', to: 'methodology-analyzer' },
      { from: 'methodology-analyzer', to: 'findings-synthesizer' },
      { from: 'findings-synthesizer', to: 'plain-english-writer' }
    ]
  },

  {
    id: 'social-media-manager',
    name: 'Social Media Content Manager',
    description: 'Generate a week\'s worth of social media content: posts, hashtags, optimal posting times, and engagement predictions. Multi-platform support.',
    category: 'content',
    difficulty: 'intermediate',
    estimatedCost: '$0.05 - $0.12',
    executionTime: '2-3 minutes',
    requiredConnections: [],
    icon: '📱',
    tags: ['social-media', 'content', 'marketing', 'automation'],
    agents: [
      {
        id: 'trend-analyzer',
        name: 'Trend Analyzer',
        type: 'AI',
        role: 'Analyze current trends',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'Analyze current social media trends for the given niche. Identify: trending hashtags, popular content formats, viral topics, and engagement patterns. Return JSON with trend data and recommendations.',
        position: { x: 100, y: 200 }
      },
      {
        id: 'content-ideator',
        name: 'Content Ideator',
        type: 'AI',
        role: 'Generate content ideas',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        systemPrompt: 'Based on the trend analysis, generate 7 unique social media content ideas (one per day). For each: hook, main message, call-to-action, and best platform. Mix educational, entertaining, and promotional content.',
        position: { x: 400, y: 200 }
      },
      {
        id: 'post-writer',
        name: 'Post Writer',
        type: 'AI',
        role: 'Write platform-specific posts',
        provider: 'anthropic',
        model: 'claude-3-sonnet',
        systemPrompt: 'Transform each content idea into platform-specific posts. Write versions for Twitter/X (280 chars), LinkedIn (professional tone), and Instagram (engaging + emoji). Include relevant hashtags for each platform.',
        position: { x: 700, y: 200 }
      },
      {
        id: 'scheduler',
        name: 'Posting Scheduler',
        type: 'AI',
        role: 'Optimize posting schedule',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'Create an optimal posting schedule for the content. Consider: platform best practices, timezone optimization, and engagement patterns. Return a calendar view with date, time, platform, and content for each post.',
        position: { x: 1000, y: 200 }
      }
    ],
    connections: [
      { from: 'trend-analyzer', to: 'content-ideator' },
      { from: 'content-ideator', to: 'post-writer' },
      { from: 'post-writer', to: 'scheduler' }
    ]
  },

  {
    id: 'code-review-assistant',
    name: 'AI Code Review Assistant',
    description: 'Automated code review pipeline: security scanning, performance analysis, best practices check, and improvement suggestions with priority ranking.',
    category: 'analysis',
    difficulty: 'advanced',
    estimatedCost: '$0.02 - $0.06',
    executionTime: '1-2 minutes',
    requiredConnections: [],
    icon: '🔍',
    tags: ['code', 'review', 'security', 'development'],
    agents: [
      {
        id: 'security-scanner',
        name: 'Security Scanner',
        type: 'AI',
        role: 'Scan for security vulnerabilities',
        provider: 'openai',
        model: 'gpt-4',
        systemPrompt: 'Analyze the code for security vulnerabilities. Check for: SQL injection, XSS, CSRF, insecure dependencies, hardcoded secrets, improper authentication. Return JSON: { vulnerabilities: [{ severity, location, description, fix }] }',
        position: { x: 100, y: 150 }
      },
      {
        id: 'performance-analyzer',
        name: 'Performance Analyzer',
        type: 'AI',
        role: 'Analyze performance issues',
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        systemPrompt: 'Analyze code for performance issues. Check: algorithmic complexity, memory leaks, unnecessary computations, database query optimization, caching opportunities. Return prioritized list with impact scores.',
        position: { x: 100, y: 300 }
      },
      {
        id: 'best-practices',
        name: 'Best Practices Checker',
        type: 'AI',
        role: 'Check coding standards',
        provider: 'ollama',
        model: 'codellama:13b',
        systemPrompt: 'Review code against best practices. Check: naming conventions, code organization, DRY principles, SOLID principles, documentation, error handling. Suggest improvements with examples.',
        position: { x: 400, y: 225 }
      },
      {
        id: 'report-generator',
        name: 'Report Generator',
        type: 'AI',
        role: 'Generate comprehensive review',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'Compile all analysis into a comprehensive code review report. Structure: Executive Summary, Critical Issues, Recommendations (prioritized), Code Quality Score (0-100), and Action Items. Format as markdown.',
        position: { x: 700, y: 225 }
      }
    ],
    connections: [
      { from: 'security-scanner', to: 'best-practices' },
      { from: 'performance-analyzer', to: 'best-practices' },
      { from: 'best-practices', to: 'report-generator' }
    ]
  },

  {
    id: 'meeting-notes-processor',
    name: 'Meeting Notes Processor',
    description: 'Transform meeting transcripts into: structured notes, action items with owners, key decisions log, and follow-up reminders. Sends summary to Slack.',
    category: 'communication',
    difficulty: 'beginner',
    estimatedCost: '$0.02 - $0.05',
    executionTime: '1-2 minutes',
    requiredConnections: ['slack', 'notion'],
    icon: '📝',
    tags: ['meetings', 'productivity', 'slack', 'notion'],
    agents: [
      {
        id: 'transcript-parser',
        name: 'Transcript Parser',
        type: 'AI',
        role: 'Parse and structure transcript',
        provider: 'groq',
        model: 'llama-3.1-70b-versatile',
        systemPrompt: 'Parse the meeting transcript. Identify: speakers, topics discussed (with timestamps if available), questions raised, and any context cues. Return structured JSON format.',
        position: { x: 100, y: 200 }
      },
      {
        id: 'action-extractor',
        name: 'Action Item Extractor',
        type: 'AI',
        role: 'Extract action items',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'Extract all action items from the parsed meeting. For each: task description, assignee (if mentioned), deadline (if mentioned), priority (inferred), and dependencies. Return as actionable checklist.',
        position: { x: 400, y: 150 }
      },
      {
        id: 'decision-logger',
        name: 'Decision Logger',
        type: 'AI',
        role: 'Log key decisions',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        systemPrompt: 'Identify and log all decisions made during the meeting. For each decision: what was decided, who made it, context/reasoning, and any dissenting opinions noted. Format for easy reference.',
        position: { x: 400, y: 300 }
      },
      {
        id: 'summary-writer',
        name: 'Summary Writer',
        type: 'AI',
        role: 'Write meeting summary',
        provider: 'ollama',
        model: 'llama3:8b',
        systemPrompt: 'Create a concise meeting summary. Include: meeting purpose, attendees, key discussion points, decisions made, action items, and next steps. Keep it scannable (bullet points). Max 300 words.',
        position: { x: 700, y: 200 }
      },
      {
        id: 'slack-notifier',
        name: 'Slack Notifier',
        type: 'Slack',
        role: 'Send summary to channel',
        provider: 'slack',
        model: '',
        systemPrompt: '',
        position: { x: 1000, y: 150 }
      },
      {
        id: 'notion-logger',
        name: 'Notion Logger',
        type: 'Notion',
        role: 'Save to Notion database',
        provider: 'notion',
        model: '',
        systemPrompt: '',
        position: { x: 1000, y: 300 }
      }
    ],
    connections: [
      { from: 'transcript-parser', to: 'action-extractor' },
      { from: 'transcript-parser', to: 'decision-logger' },
      { from: 'action-extractor', to: 'summary-writer' },
      { from: 'decision-logger', to: 'summary-writer' },
      { from: 'summary-writer', to: 'slack-notifier' },
      { from: 'summary-writer', to: 'notion-logger' }
    ]
  },
  {
    id: 'ai-to-slack-messenger',
    name: 'AI to Slack Messenger',
    description: 'Process input with AI and send the response directly to a Slack channel. Perfect for automated notifications, summaries, or AI-generated updates.',
    category: 'communication',
    difficulty: 'beginner',
    estimatedCost: 'FREE (with Groq/Ollama)',
    executionTime: '10-30 seconds',
    requiredConnections: ['slack'],
    icon: '💬',
    tags: ['slack', 'messaging', 'ai', 'automation', 'notifications'],
    agents: [
      {
        id: 'trigger',
        name: 'Trigger',
        type: 'Trigger',
        role: 'Start the workflow with input',
        provider: 'groq',
        model: '',
        systemPrompt: '',
        position: { x: 100, y: 200 }
      },
      {
        id: 'ai-processor',
        name: 'AI Processor',
        type: 'AI',
        role: 'Process and enhance the message',
        provider: 'groq',
        model: 'llama-3.1-70b-versatile',
        systemPrompt: 'You are a helpful assistant that processes messages and creates well-formatted responses for Slack. Format your responses to be clear, concise, and use Slack markdown when appropriate (bold with *text*, code with `text`). Keep responses under 500 characters unless more detail is needed.',
        position: { x: 400, y: 200 }
      },
      {
        id: 'slack-sender',
        name: 'Slack Sender',
        type: 'Slack',
        role: 'Send message to Slack channel',
        provider: 'slack',
        model: '',
        systemPrompt: '',
        position: { x: 700, y: 200 }
      }
    ],
    connections: [
      { from: 'trigger', to: 'ai-processor' },
      { from: 'ai-processor', to: 'slack-sender' }
    ]
  },
  {
    id: 'slack-ai-responder',
    name: 'Slack AI Auto-Responder',
    description: 'Receive a message (simulated), process it with AI for intelligent analysis or response, and send the AI response back to Slack. Great for support bots or automated replies.',
    category: 'communication',
    difficulty: 'beginner',
    estimatedCost: 'FREE (with Groq)',
    executionTime: '15-45 seconds',
    requiredConnections: ['slack'],
    icon: '🤖',
    tags: ['slack', 'bot', 'ai', 'automation', 'support', 'responder'],
    agents: [
      {
        id: 'slack-trigger',
        name: 'Message Input',
        type: 'Trigger',
        role: 'Receive incoming message',
        provider: 'slack',
        model: '',
        systemPrompt: '',
        position: { x: 100, y: 200 }
      },
      {
        id: 'ai-analyzer',
        name: 'AI Analyzer',
        type: 'AI',
        role: 'Analyze and respond intelligently',
        provider: 'groq',
        model: 'llama-3.1-70b-versatile',
        systemPrompt: 'You are a helpful AI assistant responding to Slack messages. Analyze the incoming message and provide a helpful, friendly response. Be concise but thorough. If it\'s a question, answer it. If it\'s a request, acknowledge and assist. Use Slack formatting: *bold*, _italic_, `code`. Keep responses professional and helpful.',
        position: { x: 400, y: 200 }
      },
      {
        id: 'slack-responder',
        name: 'Slack Response',
        type: 'Slack',
        role: 'Send AI response to channel',
        provider: 'slack',
        model: '',
        systemPrompt: '',
        position: { x: 700, y: 200 }
      }
    ],
    connections: [
      { from: 'slack-trigger', to: 'ai-analyzer' },
      { from: 'ai-analyzer', to: 'slack-responder' }
    ]
  }
]

// Helper function to get templates by category
export function getTemplatesByCategory(category: AIWorkflowTemplate['category']): AIWorkflowTemplate[] {
  return AI_TEMPLATES.filter(t => t.category === category)
}

// Helper function to get templates by difficulty
export function getTemplatesByDifficulty(difficulty: AIWorkflowTemplate['difficulty']): AIWorkflowTemplate[] {
  return AI_TEMPLATES.filter(t => t.difficulty === difficulty)
}

// Helper function to calculate total estimated cost range
export function parseEstimatedCost(cost: string): { min: number; max: number } {
  const match = cost.match(/\$([\d.]+)\s*-?\s*\$?([\d.]+)?/)
  if (match) {
    return {
      min: parseFloat(match[1]),
      max: parseFloat(match[2] || match[1])
    }
  }
  return { min: 0, max: 0 }
}

// Helper to check if user has required connections
export function checkRequiredConnections(
  template: AIWorkflowTemplate,
  userConnections: string[]
): { ready: boolean; missing: string[] } {
  const missing = template.requiredConnections.filter(
    conn => !userConnections.includes(conn.toLowerCase())
  )
  return {
    ready: missing.length === 0,
    missing
  }
}

// Get provider color for UI
export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    ollama: 'text-green-500',
    gemini: 'text-blue-500',
    openai: 'text-purple-500',
    anthropic: 'text-orange-500',
    groq: 'text-yellow-500',
    slack: 'text-pink-500',
    discord: 'text-indigo-500',
    notion: 'text-gray-500',
    gmail: 'text-red-500'
  }
  return colors[provider.toLowerCase()] || 'text-muted-foreground'
}

// Get provider badge variant
export function getProviderBadgeVariant(provider: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (provider === 'ollama' || provider === 'groq') return 'secondary' // Free
  if (provider === 'openai' || provider === 'anthropic') return 'default' // Paid
  return 'outline'
}
