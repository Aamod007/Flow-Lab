'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowRight,
    Copy,
    Check,
    Search,
    Zap,
    Mail,
    MessageSquare,
    Database,
    Bot,
    Clock,
    LayoutTemplate,
    Sparkles,
    Cpu,
    DollarSign
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { saveWorkflowToStorage } from '@/lib/workflow-storage'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// Enhanced Template Data with detailed steps
// Helper component to render icons with fallbacks
const TemplateIcon = ({ icon, className }: { icon: string, className?: string }) => {
    // Map known missing icons to Lucide equivalents
    if (icon.includes('gmail')) return <Mail className={cn("text-red-500", className)} />;
    if (icon.includes('openai')) return <Bot className={cn("text-green-500", className)} />;
    if (icon.includes('twitter')) return <MessageSquare className={cn("text-blue-400", className)} />;
    if (icon.includes('salesforce')) return <Database className={cn("text-blue-600", className)} />;
    if (icon.includes('webhook')) return <Zap className={cn("text-yellow-500", className)} />;
    if (icon.includes('http')) return <Zap className={cn("text-purple-500", className)} />;
    if (icon.includes('twilio')) return <MessageSquare className={cn("text-red-400", className)} />;
    if (icon.includes('Calendar') || icon.includes('calendar')) return <Clock className={cn("text-blue-500", className)} />;
    if (icon.includes('Sheets') || icon.includes('sheets')) return <Database className={cn("text-green-600", className)} />;
    if (icon.includes('linkedin')) return <MessageSquare className={cn("text-blue-700", className)} />;
    if (icon.includes('asana')) return <LayoutTemplate className={cn("text-pink-500", className)} />;
    if (icon.includes('jira')) return <LayoutTemplate className={cn("text-blue-500", className)} />;
    if (icon.includes('placeholder')) return <LayoutTemplate className={cn("text-muted-foreground", className)} />;

    // For existing images (discord, slack, notion, googleDrive)
    return (
        <Image
            src={icon}
            alt="icon"
            width={24}
            height={24}
            className={cn("object-contain", className)}
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('fallback-icon');
            }}
        />
    );
}

const templates = [
    {
        id: 'template-slack-notion',
        name: 'Slack Message to Notion Log',
        description: 'Capture important Slack messages and automatically save them to a Notion database for future reference.',
        category: 'Communication',
        icon: '/slack.png',
        popular: true,
        complexity: 'Simple',
        steps: [
            { type: 'Slack', label: 'New Message in Channel', icon: '/slack.png', desc: 'Triggers on messages with #save hashtag' },
            { type: 'AI', label: 'Extract Key Info', icon: '/openai.png', desc: 'Parse message for title and content' },
            { type: 'Notion', label: 'Create Database Entry', icon: '/notion.png', desc: 'Save to Message Log database' }
        ]
    },
    {
        id: 'template-1',
        name: 'Email Listener to Slack Alert',
        description: 'Monitor your Gmail inbox for specific keywords and instantly forward high-priority emails to a Slack channel.',
        category: 'Communication',
        icon: '/gmail.png',
        popular: true,
        complexity: 'Simple',
        steps: [
            { type: 'Gmail', label: 'New Email Received', icon: '/gmail.png', desc: 'Triggers when a new email matches criteria' },
            { type: 'AI', label: 'Analyze Sentiment', icon: '/openai.png', desc: 'Check if email is urgent or positive' },
            { type: 'Slack', label: 'Send Channel Message', icon: '/slack.png', desc: 'Post alert to #notifications' }
        ]
    },
    {
        id: 'template-2',
        name: 'Weekly Notion Report Generator',
        description: 'Aggregate tasks completed in Asana and Jira over the week and generate a summary report in Notion every Friday.',
        category: 'Productivity',
        icon: '/notion.png',
        popular: true,
        complexity: 'Medium',
        steps: [
            { type: 'Schedule', label: 'Every Friday at 5PM', icon: '/googleCalendar.png', desc: 'Time-based trigger' },
            { type: 'Asana', label: 'Get Completed Tasks', icon: '/asana.png', desc: 'Fetch tasks from Asana' },
            { type: 'Jira', label: 'Get Closed Issues', icon: '/jira.png', desc: 'Fetch issues from Jira' },
            { type: 'AI', label: 'Generate Summary', icon: '/openai.png', desc: 'Create a bullet-point summary' },
            { type: 'Notion', label: 'Create Page', icon: '/notion.png', desc: 'Save report to Notion database' }
        ]
    },
    {
        id: 'template-3',
        name: 'Customer Support Auto-Responder',
        description: 'Automatically draft and send replies to customer support tickets based on FAQ knowledge base using AI.',
        category: 'AI',
        icon: '/openai.png',
        popular: false,
        complexity: 'Advanced',
        steps: [
            { type: 'Webhook', label: 'New Ticket Webhook', icon: '/webhook.png', desc: 'Incoming ticket data' },
            { type: 'AI', label: 'Classify Issue', icon: '/openai.png', desc: 'Determine ticket category' },
            { type: 'AI', label: 'Draft Response', icon: '/openai.png', desc: 'Generate helpful response' },
            { type: 'Slack', label: 'Ask Human Review', icon: '/slack.png', desc: 'Request approval in Slack' },
            { type: 'Wait', label: 'Wait for Approval', icon: '/googleCalendar.png', desc: 'Pause until approved' },
            { type: 'Gmail', label: 'Send Email', icon: '/gmail.png', desc: 'Send final response to user' }
        ]
    },
    {
        id: 'template-4',
        name: 'Google Drive Asset Organizer',
        description: 'When a file is uploaded, automatically categorize it and move it to the correct folder based on file type.',
        category: 'Organization',
        icon: '/googleDrive.png',
        popular: false,
        complexity: 'Simple',
        steps: [
            { type: 'Google Drive', label: 'New File Uploaded', icon: '/googleDrive.png', desc: 'Watch root folder' },
            { type: 'Condition', label: 'Check File Type', icon: '/notion.png', desc: 'If Image, PDF, or Doc' },
            { type: 'Google Drive', label: 'Move File', icon: '/googleDrive.png', desc: 'Move to corresponding folder' },
            { type: 'Discord', label: 'Log Activity', icon: '/discord.png', desc: 'Post log to Discord' }
        ]
    },
    {
        id: 'template-5',
        name: 'Social Media Cross-Poster',
        description: 'Post once and automatically distribute content to Twitter, LinkedIn, and Facebook with AI-adjusted captions.',
        category: 'Marketing',
        icon: '/twitter.png',
        popular: true,
        complexity: 'Medium',
        steps: [
            { type: 'Notion', label: 'New Content Item', icon: '/notion.png', desc: 'Trigger on "Ready to Post"' },
            { type: 'AI', label: 'Optimize for Twitter', icon: '/openai.png', desc: 'Shorten text, add hashtags' },
            { type: 'AI', label: 'Optimize for LinkedIn', icon: '/openai.png', desc: 'Professional tone readjustment' },
            { type: 'Twitter', label: 'Post Tweet', icon: '/twitter.png', desc: 'Publish to X/Twitter' },
            { type: 'LinkedIn', label: 'Post Update', icon: '/linkedin.png', desc: 'Publish to LinkedIn' }
        ]
    },
    {
        id: 'template-6',
        name: 'Lead Enrichment Pipeline',
        description: 'When a new lead signs up, enrich their data using external APIs and score them before adding to Salesforce.',
        category: 'Sales',
        icon: '/salesforce.png',
        popular: false,
        complexity: 'Advanced',
        steps: [
            { type: 'Webhook', label: 'New Signup', icon: '/webhook.png', desc: 'Receive lead email' },
            { type: 'HTTP', label: 'Enrich Data', icon: '/http.png', desc: 'Call Clearbit/Apollo API' },
            { type: 'AI', label: 'Score Lead', icon: '/openai.png', desc: 'Analyze fit 1-100' },
            { type: 'Salesforce', label: 'Create Contact', icon: '/salesforce.png', desc: 'Add enriched lead to CRM' },
            { type: 'Slack', label: 'Notify Sales Team', icon: '/slack.png', desc: 'Alert if score > 80' }
        ]
    },
    {
        id: 'template-7',
        name: 'AI Content Summarizer',
        description: 'Automatically summarize long documents, articles, or emails using AI and save key points to Notion.',
        category: 'AI',
        icon: '/openai.png',
        popular: true,
        complexity: 'Simple',
        steps: [
            { type: 'Google Drive', label: 'New Document', icon: '/googleDrive.png', desc: 'Watch for new PDFs or Docs' },
            { type: 'AI', label: 'Extract Text', icon: '/openai.png', desc: 'Parse document content' },
            { type: 'AI', label: 'Generate Summary', icon: '/openai.png', desc: 'Create bullet-point summary' },
            { type: 'Notion', label: 'Save Summary', icon: '/notion.png', desc: 'Add to summaries database' }
        ]
    },
    {
        id: 'template-8',
        name: 'Code Review Assistant',
        description: 'Automatically review pull requests with AI, suggest improvements, and post feedback to GitHub.',
        category: 'AI',
        icon: '/openai.png',
        popular: true,
        complexity: 'Medium',
        steps: [
            { type: 'Webhook', label: 'New PR Webhook', icon: '/webhook.png', desc: 'GitHub PR created' },
            { type: 'HTTP', label: 'Fetch PR Diff', icon: '/http.png', desc: 'Get changed files' },
            { type: 'AI', label: 'Analyze Code', icon: '/openai.png', desc: 'Review for bugs and style' },
            { type: 'AI', label: 'Generate Suggestions', icon: '/openai.png', desc: 'Create improvement list' },
            { type: 'HTTP', label: 'Post Comment', icon: '/http.png', desc: 'Add review to PR' }
        ]
    },
    {
        id: 'template-9',
        name: 'Meeting Notes Processor',
        description: 'Transcribe meeting recordings, extract action items with AI, and distribute via Slack and email.',
        category: 'AI',
        icon: '/openai.png',
        popular: false,
        complexity: 'Advanced',
        steps: [
            { type: 'Google Drive', label: 'New Recording', icon: '/googleDrive.png', desc: 'Audio file uploaded' },
            { type: 'AI', label: 'Transcribe Audio', icon: '/openai.png', desc: 'Convert speech to text' },
            { type: 'AI', label: 'Extract Actions', icon: '/openai.png', desc: 'Identify action items & owners' },
            { type: 'Notion', label: 'Save Notes', icon: '/notion.png', desc: 'Store meeting notes' },
            { type: 'Slack', label: 'Share Summary', icon: '/slack.png', desc: 'Post to team channel' },
            { type: 'Gmail', label: 'Email Attendees', icon: '/gmail.png', desc: 'Send action items' }
        ]
    },
    {
        id: 'template-10',
        name: 'Data Analysis Pipeline',
        description: 'Analyze spreadsheet data with AI to find trends, anomalies, and generate insights reports.',
        category: 'AI',
        icon: '/openai.png',
        popular: false,
        complexity: 'Medium',
        steps: [
            { type: 'Google Sheets', label: 'Data Updated', icon: '/googleSheets.png', desc: 'Spreadsheet row added' },
            { type: 'AI', label: 'Analyze Data', icon: '/openai.png', desc: 'Find patterns and anomalies' },
            { type: 'AI', label: 'Generate Report', icon: '/openai.png', desc: 'Create insights summary' },
            { type: 'Notion', label: 'Save Report', icon: '/notion.png', desc: 'Store in reports database' },
            { type: 'Slack', label: 'Alert Team', icon: '/slack.png', desc: 'Notify if anomalies found' }
        ]
    },
    // ===== AI-First Agent Templates (AgentFlow) =====
    {
        id: 'template-ai-news-intelligence',
        name: 'Daily News Intelligence Agent',
        description: 'Autonomous AI agent that monitors news sources, analyzes sentiment, extracts key topics, and delivers personalized briefings.',
        category: 'AI',
        icon: '/openai.png',
        popular: true,
        complexity: 'Advanced',
        aiFirst: true,
        estimatedCost: '$0.02/run',
        steps: [
            { type: 'Schedule', label: 'Daily at 6 AM', icon: '/googleCalendar.png', desc: 'Time-based trigger' },
            { type: 'HTTP', label: 'Fetch News APIs', icon: '/http.png', desc: 'NewsAPI, RSS feeds, Google News' },
            { type: 'AI', label: 'Extract Topics', icon: '/openai.png', desc: 'NER & topic modeling', provider: 'Groq', model: 'llama-3.3-70b-versatile' },
            { type: 'AI', label: 'Sentiment Analysis', icon: '/openai.png', desc: 'Score articles -1 to +1', provider: 'Ollama', model: 'llama3.2' },
            { type: 'AI', label: 'Generate Briefing', icon: '/openai.png', desc: 'Personalized summary', provider: 'OpenAI', model: 'gpt-4o-mini' },
            { type: 'Notion', label: 'Save to Database', icon: '/notion.png', desc: 'Archive with metadata' },
            { type: 'Gmail', label: 'Send Briefing', icon: '/gmail.png', desc: 'Email daily digest' }
        ]
    },
    {
        id: 'template-ai-content-pipeline',
        name: 'AI Content Generation Pipeline',
        description: 'Multi-agent content factory that researches, writes, edits, and optimizes content with human approval checkpoints.',
        category: 'AI',
        icon: '/openai.png',
        popular: true,
        complexity: 'Advanced',
        aiFirst: true,
        estimatedCost: '$0.05/run',
        steps: [
            { type: 'Notion', label: 'Content Brief', icon: '/notion.png', desc: 'New item in content queue' },
            { type: 'AI', label: 'Research Agent', icon: '/openai.png', desc: 'Web search & fact gathering', provider: 'Groq', model: 'llama-3.3-70b-versatile' },
            { type: 'AI', label: 'Writer Agent', icon: '/openai.png', desc: 'Draft generation', provider: 'OpenAI', model: 'gpt-4o' },
            { type: 'AI', label: 'Editor Agent', icon: '/openai.png', desc: 'Grammar, style, tone', provider: 'Anthropic', model: 'claude-3-5-haiku-latest' },
            { type: 'AI', label: 'SEO Agent', icon: '/openai.png', desc: 'Keyword optimization', provider: 'Ollama', model: 'llama3.2' },
            { type: 'Slack', label: 'Human Review', icon: '/slack.png', desc: 'Request approval' },
            { type: 'Wait', label: 'Approval Gate', icon: '/googleCalendar.png', desc: 'Wait for human OK' },
            { type: 'HTTP', label: 'Publish', icon: '/http.png', desc: 'Post to CMS via API' }
        ]
    },
    {
        id: 'template-ai-support-bot',
        name: 'Intelligent Customer Support Bot',
        description: 'RAG-powered support agent with knowledge base integration, sentiment detection, and smart escalation.',
        category: 'AI',
        icon: '/openai.png',
        popular: true,
        complexity: 'Advanced',
        aiFirst: true,
        estimatedCost: '$0.01/conversation',
        steps: [
            { type: 'Webhook', label: 'Customer Message', icon: '/webhook.png', desc: 'Chat widget/email trigger' },
            { type: 'AI', label: 'Intent Classifier', icon: '/openai.png', desc: 'Categorize query type', provider: 'Groq', model: 'llama-3.1-8b-instant' },
            { type: 'AI', label: 'Sentiment Check', icon: '/openai.png', desc: 'Detect frustration level', provider: 'Ollama', model: 'llama3.2' },
            { type: 'Condition', label: 'Check Sentiment', icon: '/notion.png', desc: 'If frustrated, escalate' },
            { type: 'AI', label: 'RAG Response', icon: '/openai.png', desc: 'Search KB & generate answer', provider: 'OpenAI', model: 'gpt-4o-mini' },
            { type: 'AI', label: 'Response Polish', icon: '/openai.png', desc: 'Ensure brand voice', provider: 'Anthropic', model: 'claude-3-5-haiku-latest' },
            { type: 'HTTP', label: 'Send Reply', icon: '/http.png', desc: 'Post to chat/email' },
            { type: 'Slack', label: 'Escalate if Needed', icon: '/slack.png', desc: 'Alert human team' }
        ]
    },
    {
        id: 'template-ai-research-analyzer',
        name: 'Research Paper Analyzer',
        description: 'Academic research assistant that summarizes papers, extracts citations, identifies key findings, and builds knowledge graphs.',
        category: 'AI',
        icon: '/openai.png',
        popular: false,
        complexity: 'Advanced',
        aiFirst: true,
        estimatedCost: '$0.03/paper',
        steps: [
            { type: 'Google Drive', label: 'PDF Uploaded', icon: '/googleDrive.png', desc: 'New paper in Research folder' },
            { type: 'AI', label: 'Extract Text', icon: '/openai.png', desc: 'OCR & text extraction', provider: 'Ollama', model: 'llama3.2' },
            { type: 'AI', label: 'Section Parser', icon: '/openai.png', desc: 'Identify abstract, methods, etc.', provider: 'Groq', model: 'llama-3.1-8b-instant' },
            { type: 'AI', label: 'Key Findings', icon: '/openai.png', desc: 'Extract main contributions', provider: 'OpenAI', model: 'gpt-4o' },
            { type: 'AI', label: 'Citation Extractor', icon: '/openai.png', desc: 'Parse references list', provider: 'Groq', model: 'llama-3.3-70b-versatile' },
            { type: 'AI', label: 'Generate Summary', icon: '/openai.png', desc: 'ELI5 + technical summary', provider: 'Anthropic', model: 'claude-3-5-haiku-latest' },
            { type: 'Notion', label: 'Knowledge Base', icon: '/notion.png', desc: 'Save structured notes' }
        ]
    },
    {
        id: 'template-ai-social-manager',
        name: 'AI Social Media Manager',
        description: 'Autonomous social agent that creates content, schedules posts, responds to comments, and tracks engagement metrics.',
        category: 'Marketing',
        icon: '/openai.png',
        popular: true,
        complexity: 'Advanced',
        aiFirst: true,
        estimatedCost: '$0.01/post',
        steps: [
            { type: 'Schedule', label: 'Content Schedule', icon: '/googleCalendar.png', desc: 'Daily at optimal times' },
            { type: 'Notion', label: 'Fetch Content Queue', icon: '/notion.png', desc: 'Get pending posts' },
            { type: 'AI', label: 'Generate Variants', icon: '/openai.png', desc: 'Platform-specific versions', provider: 'OpenAI', model: 'gpt-4o-mini' },
            { type: 'AI', label: 'Image Prompts', icon: '/openai.png', desc: 'Create DALL-E prompts', provider: 'Groq', model: 'llama-3.1-8b-instant' },
            { type: 'AI', label: 'Hashtag Generator', icon: '/openai.png', desc: 'Trending + niche tags', provider: 'Ollama', model: 'llama3.2' },
            { type: 'HTTP', label: 'Post to Platforms', icon: '/http.png', desc: 'Twitter, LinkedIn, Instagram APIs' },
            { type: 'AI', label: 'Comment Monitor', icon: '/openai.png', desc: 'Auto-reply to mentions', provider: 'Groq', model: 'llama-3.1-8b-instant' },
            { type: 'Google Sheets', label: 'Track Metrics', icon: '/googleSheets.png', desc: 'Log engagement data' }
        ]
    },
    {
        id: 'template-ai-email-assistant',
        name: 'AI Email Assistant',
        description: 'Smart email agent that triages inbox, drafts responses, schedules meetings, and extracts action items automatically.',
        category: 'AI',
        icon: '/openai.png',
        popular: true,
        complexity: 'Medium',
        aiFirst: true,
        estimatedCost: 'FREE (Ollama)',
        steps: [
            { type: 'Gmail', label: 'New Email', icon: '/gmail.png', desc: 'Incoming email trigger' },
            { type: 'AI', label: 'Priority Score', icon: '/openai.png', desc: 'Urgency 1-10', provider: 'Ollama', model: 'llama3.2' },
            { type: 'AI', label: 'Extract Actions', icon: '/openai.png', desc: 'Find todos & deadlines', provider: 'Ollama', model: 'llama3.2' },
            { type: 'AI', label: 'Draft Response', icon: '/openai.png', desc: 'Context-aware reply', provider: 'Ollama', model: 'llama3.2' },
            { type: 'Notion', label: 'Save Actions', icon: '/notion.png', desc: 'Add to task database' },
            { type: 'Slack', label: 'High Priority Alert', icon: '/slack.png', desc: 'Notify if urgent' }
        ]
    },
    {
        id: 'template-ai-competitor-intel',
        name: 'Competitor Intelligence Agent',
        description: 'Monitors competitor websites, social media, and news for changes, then generates strategic insights reports.',
        category: 'AI',
        icon: '/openai.png',
        popular: false,
        complexity: 'Advanced',
        aiFirst: true,
        estimatedCost: '$0.02/report',
        steps: [
            { type: 'Schedule', label: 'Weekly Monitor', icon: '/googleCalendar.png', desc: 'Every Monday 9 AM' },
            { type: 'HTTP', label: 'Scrape Websites', icon: '/http.png', desc: 'Competitor pages' },
            { type: 'HTTP', label: 'Social Feeds', icon: '/http.png', desc: 'Twitter, LinkedIn APIs' },
            { type: 'AI', label: 'Change Detection', icon: '/openai.png', desc: 'Diff analysis', provider: 'Groq', model: 'llama-3.1-8b-instant' },
            { type: 'AI', label: 'Sentiment Analysis', icon: '/openai.png', desc: 'Market perception', provider: 'Ollama', model: 'llama3.2' },
            { type: 'AI', label: 'Strategic Insights', icon: '/openai.png', desc: 'SWOT & recommendations', provider: 'OpenAI', model: 'gpt-4o' },
            { type: 'Notion', label: 'Intel Database', icon: '/notion.png', desc: 'Archive findings' },
            { type: 'Slack', label: 'Weekly Brief', icon: '/slack.png', desc: 'Share with team' }
        ]
    }
]

const categories = ['All', 'Productivity', 'Communication', 'Organization', 'AI', 'Marketing', 'Sales', 'Research']


const TemplatesPage = () => {
    const router = useRouter()
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null)

    const filteredTemplates = templates.filter(t => {
        const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const handleUseTemplate = (template: typeof templates[0]) => {
        try {
            // Generate Nodes based on template steps
            const generatedNodes = template.steps.map((step, index) => {
                return {
                    id: `node-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
                    type: index === 0 ? 'Trigger' : 'Action', // First is always trigger
                    position: { x: 200 + (index * 300), y: 300 }, // Horizontal layout with ample spacing
                    data: {
                        title: step.type,
                        description: step.desc,
                        completed: false,
                        current: false,
                        metadata: {},
                        type: step.type, // Pass the specific type (e.g., 'Slack', 'AI')
                    }
                }
            })

            // Generate Edges to connect them linearly
            const generatedEdges = generatedNodes.slice(0, -1).map((node, index) => {
                return {
                    id: `edge-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    source: node.id,
                    target: generatedNodes[index + 1].id,
                    type: 'default',
                }
            })

            const workflow = saveWorkflowToStorage(
                template.name + ' (Copy)',
                template.description,
                JSON.stringify(generatedNodes),
                JSON.stringify(generatedEdges)
            )

            if (workflow) {
                setSelectedTemplate(null) // Close modal first
                toast.success('Template applied! Redirecting to editor...')
                setTimeout(() => {
                    router.push(`/workflows/editor/${workflow.id}`)
                }, 300)
            } else {
                toast.error('Failed to create workflow from template')
            }
        } catch (error) {
            console.error('Error using template:', error)
            toast.error('Failed to apply template. Please try again.')
        }
    }

    const handleCopyTemplate = (e: React.MouseEvent, template: typeof templates[0]) => {
        e.stopPropagation() // Prevent opening modal
        navigator.clipboard.writeText(JSON.stringify(template, null, 2))
        setCopiedId(template.id)
        toast.success('Template copied to clipboard!')
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className="flex flex-col gap-4 relative min-h-screen">
            <h1 className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center justify-between border-b">
                <span className="flex items-center gap-3">
                    <LayoutTemplate className="h-8 w-8 text-muted-foreground" />
                    Templates
                </span>
                <div className="relative w-full max-w-sm hidden md:block">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        className="pl-8 bg-muted/50 border-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </h1>

            <div className="p-6 flex flex-col gap-6">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className={cn(
                                "rounded-full px-4 transition-all duration-300",
                                selectedCategory === category
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : 'hover:bg-muted text-muted-foreground'
                            )}
                        >
                            {category}
                        </Button>
                    ))}
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                        <Card
                            key={template.id}
                            className={cn(
                                "relative overflow-hidden group cursor-pointer border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                                (template as any).aiFirst && "border-purple-500/30 hover:border-purple-500/60"
                            )}
                            onClick={() => setSelectedTemplate(template)}
                        >
                            {/* Badges Container */}
                            <div className="absolute top-0 right-0 z-10 flex flex-col items-end gap-1">
                                {template.popular && (
                                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                                        POPULAR
                                    </div>
                                )}
                                {(template as any).aiFirst && (
                                    <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        AI-FIRST
                                    </div>
                                )}
                            </div>

                            <CardHeader className="pb-3 pt-6">
                                <div className="flex flex-row items-center gap-4">
                                    <div className={cn(
                                        "flex-shrink-0 h-12 w-12 p-2.5 rounded-xl bg-background border shadow-sm group-hover:scale-110 transition-transform duration-300 flex items-center justify-center",
                                        (template as any).aiFirst && "border-purple-500/50"
                                    )}>
                                        <TemplateIcon icon={template.icon} className="w-full h-full" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <CardTitle className="text-lg leading-tight mb-1 truncate group-hover:text-primary transition-colors pr-8">
                                            {template.name}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-normal">
                                                {template.category}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {template.steps.length} Steps
                                            </span>
                                            {(template as any).estimatedCost && (
                                                <span className={cn(
                                                    "text-[10px] flex items-center gap-1",
                                                    (template as any).estimatedCost.includes('FREE') ? "text-green-500" : "text-muted-foreground"
                                                )}>
                                                    <DollarSign className="w-3 h-3" />
                                                    {(template as any).estimatedCost}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <CardDescription className="line-clamp-2 text-sm">
                                    {template.description}
                                </CardDescription>

                                {/* AI Provider Preview for AI-First Templates */}
                                {(template as any).aiFirst && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {template.steps
                                            .filter((step: any) => step.provider)
                                            .reduce((unique: any[], step: any) => {
                                                if (!unique.find(s => s.provider === step.provider)) {
                                                    unique.push(step)
                                                }
                                                return unique
                                            }, [])
                                            .slice(0, 3)
                                            .map((step: any, idx: number) => (
                                                <Badge
                                                    key={idx}
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[9px] px-1.5 py-0 h-4",
                                                        step.provider === 'Ollama' && "border-green-500/50 text-green-500",
                                                        step.provider === 'Groq' && "border-yellow-500/50 text-yellow-600",
                                                        step.provider === 'OpenAI' && "border-emerald-500/50 text-emerald-600",
                                                        step.provider === 'Anthropic' && "border-purple-500/50 text-purple-500"
                                                    )}
                                                >
                                                    {step.provider === 'Ollama' && <Cpu className="w-2.5 h-2.5 mr-0.5" />}
                                                    {step.provider}
                                                </Badge>
                                            ))
                                        }
                                    </div>
                                )}

                                {/* Preview of Flow */}
                                <div className="flex items-center gap-1 opacity-60">
                                    {template.steps.slice(0, 4).map((step, idx) => (
                                        <React.Fragment key={idx}>
                                            <div
                                                className="w-7 h-7 rounded-full bg-muted border flex items-center justify-center min-w-7 min-h-7"
                                                title={step.label}
                                            >
                                                <TemplateIcon icon={step.icon} className="w-3.5 h-3.5 opacity-70" />
                                            </div>
                                            {idx < Math.min(template.steps.length, 4) - 1 && (
                                                <div className="h-[2px] w-2 bg-muted-foreground/30" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                    {template.steps.length > 4 && (
                                        <span className="text-[10px] text-muted-foreground ml-1">+{template.steps.length - 4}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredTemplates.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <Search className="h-12 w-12 mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-semibold">No templates found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
                    </div>
                )}
            </div>

            {/* Template Preview Dialog */}
            <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
                <DialogContent className="max-w-2xl h-[600px] flex flex-col">
                    <DialogHeader className="shrink-0">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-xl bg-muted/50 border">
                                <TemplateIcon
                                    icon={selectedTemplate?.icon || '/placeholder.png'}
                                    className="w-8 h-8"
                                />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl">{selectedTemplate?.name}</DialogTitle>
                                <DialogDescription className="mt-1">
                                    {selectedTemplate?.description}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden py-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            Workflow Preview ({selectedTemplate?.steps.length || 0} steps)
                        </h4>
                        <div className="relative border rounded-xl bg-gradient-to-br from-muted/20 to-muted/5 h-[calc(100%-2rem)] overflow-hidden">
                            {/* Scrollable Vertical Flow Visualizer */}
                            <div className="h-full overflow-y-auto p-4">
                                <div className="flex flex-col items-center gap-2 py-2">
                                    {selectedTemplate?.steps.map((step, idx) => (
                                        <React.Fragment key={idx}>
                                            {/* Step Card - Vertical */}
                                            <div className="flex items-center gap-4 w-full max-w-md p-3 rounded-lg bg-background border hover:border-primary/50 transition-all group">
                                                <div className="w-12 h-12 rounded-lg bg-muted/50 border shadow-sm flex items-center justify-center shrink-0 group-hover:border-primary/30">
                                                    <TemplateIcon icon={step.icon} className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">{step.label}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{step.desc}</p>
                                                </div>
                                                <Badge variant="outline" className="text-xs shrink-0">
                                                    {step.type}
                                                </Badge>
                                            </div>

                                            {/* Arrow Down */}
                                            {idx < selectedTemplate.steps.length - 1 && (
                                                <div className="flex flex-col items-center py-1">
                                                    <div className="w-0.5 h-3 bg-gradient-to-b from-primary/50 to-primary/20 rounded-full" />
                                                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-primary/50" />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="shrink-0 gap-2 sm:gap-0 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedTemplate(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => selectedTemplate && handleUseTemplate(selectedTemplate)}
                            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        >
                            Use This Template
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default TemplatesPage
