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
    LayoutTemplate
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
    if (icon.includes('calendar')) return <Clock className={cn("text-blue-500", className)} />;
    if (icon.includes('linkedin')) return <MessageSquare className={cn("text-blue-700", className)} />;
    if (icon.includes('asana') || icon.includes('jira')) return <LayoutTemplate className={cn("text-pink-500", className)} />;
    if (icon.includes('http')) return <Zap className={cn("text-purple-500", className)} />;

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
    }
]

const categories = ['All', 'Productivity', 'Communication', 'Organization', 'AI', 'Marketing', 'Sales']


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
        // Generate Nodes based on template steps
        const generatedNodes = template.steps.map((step, index) => {
            return {
                id: `node-${index}-${Date.now()}`, // Unique ID
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
                id: `edge-${index}-${Date.now()}`,
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
            toast.success('Template applied! Redirecting to editor...')
            setTimeout(() => {
                router.push(`/workflows/editor/${workflow.id}`)
            }, 1000)
        } else {
            toast.error('Failed to create workflow from template')
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
                            className="relative overflow-hidden group cursor-pointer border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                            onClick={() => setSelectedTemplate(template)}
                        >
                            {template.popular && (
                                <div className="absolute top-0 right-0 z-10">
                                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                                        POPULAR
                                    </div>
                                </div>
                            )}

                            <CardHeader className="pb-3 pt-6">
                                <div className="flex flex-row items-center gap-4">
                                    <div className="flex-shrink-0 h-12 w-12 p-2.5 rounded-xl bg-background border shadow-sm group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                                        <TemplateIcon icon={template.icon} className="w-full h-full" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <CardTitle className="text-lg leading-tight mb-1 truncate group-hover:text-primary transition-colors pr-8">
                                            {template.name}
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-normal">
                                                {template.category}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {template.steps.length} Steps
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <CardDescription className="line-clamp-2 text-sm">
                                    {template.description}
                                </CardDescription>

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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
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

                    <div className="py-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            Workflow Preview
                        </h4>
                        <div className="relative border rounded-xl bg-gradient-to-br from-muted/20 to-muted/5 p-4 overflow-hidden">
                            {/* Horizontal Flow Visualizer with scroll */}
                            <div className="overflow-x-auto pb-2">
                                <div className="flex flex-row items-center justify-start gap-1 w-max">
                                    {selectedTemplate?.steps.map((step, idx) => (
                                        <React.Fragment key={idx}>
                                            {/* Step Card */}
                                            <div className="flex flex-col items-center gap-1 group shrink-0" style={{ width: '80px' }}>
                                                <div className="w-9 h-9 rounded-lg bg-background border shadow-sm flex items-center justify-center group-hover:border-primary/50 transition-all">
                                                    <TemplateIcon icon={step.icon} className="w-4 h-4" />
                                                </div>
                                                <div className="text-center w-full px-0.5">
                                                    <p className="font-medium text-[10px] truncate" title={step.label}>{step.label}</p>
                                                    <p className="text-[8px] text-muted-foreground truncate">{step.desc}</p>
                                                </div>
                                            </div>

                                            {/* Arrow Connector */}
                                            {idx < selectedTemplate.steps.length - 1 && (
                                                <div className="flex items-center shrink-0 -mx-1">
                                                    <div className="w-4 h-[1.5px] bg-border" />
                                                    <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-border" />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
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
