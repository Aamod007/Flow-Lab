'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Sparkles,
    Wand2,
    MessageSquare,
    ArrowRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Lightbulb,
    Zap,
    Bot,
    Send,
    RefreshCw,
    Copy,
    Play
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { saveWorkflowToStorage } from '@/lib/workflow-storage'

interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    workflowPreview?: GeneratedWorkflow
}

interface GeneratedWorkflow {
    name: string
    description: string
    nodes: WorkflowNode[]
    estimatedCost: string
    estimatedTime: string
}

interface WorkflowNode {
    id: string
    type: string
    name: string
    description: string
    config?: Record<string, any>
}

const EXAMPLE_PROMPTS = [
    "Create a workflow that monitors my Gmail for invoices and saves them to Google Drive organized by month",
    "Build an AI agent that summarizes my Slack messages daily and posts a digest to Notion",
    "I want to automatically respond to customer support emails using AI with human approval",
    "Set up a workflow that tracks competitor pricing and alerts me on Slack when prices change",
    "Create an AI research assistant that finds relevant papers on arXiv and summarizes them"
]

const AI_SUGGESTIONS = [
    { icon: '📧', text: 'Email automation with AI triage' },
    { icon: '📊', text: 'Data analysis pipeline' },
    { icon: '🤖', text: 'Customer support bot' },
    { icon: '📰', text: 'News monitoring agent' },
    { icon: '✍️', text: 'Content generation workflow' },
]

export function AIWorkflowBuilder() {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const generateWorkflowFromPrompt = async (prompt: string): Promise<GeneratedWorkflow> => {
        // Simulate AI processing - In production, this would call your AI API
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Analyze prompt and generate appropriate workflow
        const lowerPrompt = prompt.toLowerCase()
        
        let workflow: GeneratedWorkflow

        if (lowerPrompt.includes('email') || lowerPrompt.includes('gmail')) {
            workflow = {
                name: 'AI Email Processor',
                description: 'Intelligent email processing with AI categorization and automated responses',
                estimatedCost: 'FREE (using Ollama)',
                estimatedTime: '~30 seconds per email',
                nodes: [
                    { id: '1', type: 'Gmail', name: 'Email Trigger', description: 'Watch for new emails' },
                    { id: '2', type: 'AI', name: 'Smart Categorizer', description: 'AI classifies email type and urgency' },
                    { id: '3', type: 'AI', name: 'Response Generator', description: 'Draft contextual reply' },
                    { id: '4', type: 'Condition', name: 'Approval Check', description: 'Route based on confidence' },
                    { id: '5', type: 'Slack', name: 'Human Review', description: 'Request approval if needed' },
                    { id: '6', type: 'Gmail', name: 'Send Response', description: 'Send approved reply' },
                ]
            }
        } else if (lowerPrompt.includes('slack') && lowerPrompt.includes('notion')) {
            workflow = {
                name: 'Slack to Notion Intelligence',
                description: 'AI-powered Slack monitoring with smart Notion organization',
                estimatedCost: '$0.01 per day',
                estimatedTime: '~1 minute',
                nodes: [
                    { id: '1', type: 'Schedule', name: 'Daily Trigger', description: 'Run every day at 6 PM' },
                    { id: '2', type: 'Slack', name: 'Fetch Messages', description: 'Get all channel messages' },
                    { id: '3', type: 'AI', name: 'Topic Extractor', description: 'Identify key discussions' },
                    { id: '4', type: 'AI', name: 'Summarizer', description: 'Create concise digest' },
                    { id: '5', type: 'AI', name: 'Action Finder', description: 'Extract action items' },
                    { id: '6', type: 'Notion', name: 'Save Digest', description: 'Store in daily notes' },
                ]
            }
        } else if (lowerPrompt.includes('customer') || lowerPrompt.includes('support')) {
            workflow = {
                name: 'AI Customer Support Agent',
                description: 'Intelligent support system with RAG-powered responses',
                estimatedCost: '$0.005 per ticket',
                estimatedTime: '~10 seconds',
                nodes: [
                    { id: '1', type: 'Webhook', name: 'Ticket Received', description: 'New support request' },
                    { id: '2', type: 'AI', name: 'Intent Classifier', description: 'Understand customer need' },
                    { id: '3', type: 'AI', name: 'Sentiment Analyzer', description: 'Detect frustration level' },
                    { id: '4', type: 'AI', name: 'Knowledge Search', description: 'RAG over your docs' },
                    { id: '5', type: 'AI', name: 'Response Crafter', description: 'Generate helpful answer' },
                    { id: '6', type: 'Condition', name: 'Confidence Gate', description: 'Route low confidence to human' },
                    { id: '7', type: 'Slack', name: 'Escalation', description: 'Alert support team' },
                ]
            }
        } else if (lowerPrompt.includes('competitor') || lowerPrompt.includes('monitor') || lowerPrompt.includes('track')) {
            workflow = {
                name: 'Competitive Intelligence Agent',
                description: 'AI-powered competitor monitoring and analysis',
                estimatedCost: '$0.02 per scan',
                estimatedTime: '~2 minutes',
                nodes: [
                    { id: '1', type: 'Schedule', name: 'Weekly Scan', description: 'Every Monday 9 AM' },
                    { id: '2', type: 'HTTP', name: 'Web Scraper', description: 'Fetch competitor pages' },
                    { id: '3', type: 'AI', name: 'Change Detector', description: 'Find what\'s different' },
                    { id: '4', type: 'AI', name: 'Price Analyzer', description: 'Track pricing changes' },
                    { id: '5', type: 'AI', name: 'Insight Generator', description: 'Strategic recommendations' },
                    { id: '6', type: 'Notion', name: 'Intel Database', description: 'Archive findings' },
                    { id: '7', type: 'Slack', name: 'Alert Team', description: 'Share key insights' },
                ]
            }
        } else if (lowerPrompt.includes('research') || lowerPrompt.includes('paper') || lowerPrompt.includes('arxiv')) {
            workflow = {
                name: 'AI Research Assistant',
                description: 'Autonomous research paper discovery and analysis',
                estimatedCost: '$0.03 per paper',
                estimatedTime: '~1 minute per paper',
                nodes: [
                    { id: '1', type: 'Schedule', name: 'Daily Search', description: 'Check arXiv daily' },
                    { id: '2', type: 'HTTP', name: 'arXiv API', description: 'Fetch new papers' },
                    { id: '3', type: 'AI', name: 'Relevance Filter', description: 'Match to your interests' },
                    { id: '4', type: 'AI', name: 'Abstract Analyzer', description: 'Extract key findings' },
                    { id: '5', type: 'AI', name: 'Summarizer', description: 'ELI5 summary' },
                    { id: '6', type: 'Notion', name: 'Research DB', description: 'Organize by topic' },
                    { id: '7', type: 'Gmail', name: 'Weekly Digest', description: 'Email top papers' },
                ]
            }
        } else {
            // Generic AI workflow
            workflow = {
                name: 'Custom AI Workflow',
                description: `AI-powered automation for: ${prompt.slice(0, 100)}`,
                estimatedCost: '$0.01 per run',
                estimatedTime: '~30 seconds',
                nodes: [
                    { id: '1', type: 'Trigger', name: 'Start', description: 'Workflow trigger' },
                    { id: '2', type: 'AI', name: 'Data Processor', description: 'Analyze input data' },
                    { id: '3', type: 'AI', name: 'Decision Maker', description: 'Determine next action' },
                    { id: '4', type: 'Action', name: 'Execute', description: 'Perform action' },
                    { id: '5', type: 'Notification', name: 'Notify', description: 'Send notification' },
                ]
            }
        }

        return workflow
    }

    const handleSend = async () => {
        if (!input.trim() || isGenerating) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsGenerating(true)

        try {
            // Add thinking message
            const thinkingMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'system',
                content: '🤔 Analyzing your request and designing the optimal workflow...',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, thinkingMessage])

            const workflow = await generateWorkflowFromPrompt(userMessage.content)
            setGeneratedWorkflow(workflow)

            // Remove thinking message and add response
            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== thinkingMessage.id)
                return [...filtered, {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: `I've designed a workflow called **"${workflow.name}"** based on your requirements.\n\n${workflow.description}\n\n**Estimated Cost:** ${workflow.estimatedCost}\n**Execution Time:** ${workflow.estimatedTime}`,
                    timestamp: new Date(),
                    workflowPreview: workflow
                }]
            })
        } catch (error) {
            toast.error('Failed to generate workflow')
            setMessages(prev => prev.filter(m => m.role !== 'system'))
        } finally {
            setIsGenerating(false)
        }
    }

    // Map generated node types to valid editor node types
    const mapNodeType = (nodeType: string, isFirst: boolean): string => {
        const typeMap: Record<string, string> = {
            'Gmail': 'Email',
            'Email': 'Email',
            'Slack': 'Slack',
            'Notion': 'Notion',
            'Discord': 'Discord',
            'AI': 'AI',
            'Condition': 'Condition',
            'Schedule': 'Trigger',
            'Webhook': 'Trigger',
            'HTTP': 'Action',
            'Trigger': 'Trigger',
            'Action': 'Action',
            'Notification': 'Slack',
            'Google Drive': 'Google Drive',
            'Wait': 'Wait',
        }
        
        if (isFirst) return 'Trigger'
        return typeMap[nodeType] || 'AI'
    }

    const handleCreateWorkflow = () => {
        if (!generatedWorkflow) return

        // Convert to actual workflow format with proper node types
        const nodes = generatedWorkflow.nodes.map((node, index) => {
            const mappedType = mapNodeType(node.type, index === 0)
            return {
                id: `node-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: mappedType,
                position: { x: 200 + (index * 300), y: 300 },
                data: {
                    title: mappedType,
                    description: node.description || `${node.name}`,
                    completed: false,
                    current: false,
                    metadata: {
                        originalType: node.type,
                        nodeName: node.name,
                    },
                    type: mappedType,
                }
            }
        })

        const edges = nodes.slice(0, -1).map((node, index) => ({
            id: `edge-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: node.id,
            target: nodes[index + 1].id,
            type: 'default',
        }))

        const workflow = saveWorkflowToStorage(
            generatedWorkflow.name,
            generatedWorkflow.description,
            JSON.stringify(nodes),
            JSON.stringify(edges)
        )

        if (workflow) {
            toast.success('Workflow created! Opening editor...')
            router.push(`/workflows/editor/${workflow.id}`)
        } else {
            toast.error('Failed to create workflow')
        }
    }

    const handleExampleClick = (example: string) => {
        setInput(example)
        textareaRef.current?.focus()
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                        <Wand2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">AI Workflow Builder</h2>
                        <p className="text-sm text-muted-foreground">
                            Describe what you want in plain English - AI will build it for you
                        </p>
                    </div>
                </div>
                <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Powered by AI
                </Badge>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                        <div className="p-4 rounded-full bg-muted/50 mb-4">
                            <Bot className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">What would you like to automate?</h3>
                        <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                            Describe your workflow in natural language. I'll design the perfect AI-powered automation for you.
                        </p>

                        {/* Example Prompts */}
                        <div className="w-full max-w-2xl space-y-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" />
                                Try these examples:
                            </p>
                            {EXAMPLE_PROMPTS.map((example, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleExampleClick(example)}
                                    className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/50 transition-all text-sm group"
                                >
                                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                                        "{example}"
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Quick Suggestions */}
                        <div className="flex flex-wrap gap-2 mt-6">
                            {AI_SUGGESTIONS.map((suggestion, idx) => (
                                <Badge
                                    key={idx}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-all"
                                    onClick={() => handleExampleClick(`Create a workflow for ${suggestion.text}`)}
                                >
                                    {suggestion.icon} {suggestion.text}
                                </Badge>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-3",
                                    message.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role !== 'user' && (
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        message.role === 'system' ? "bg-yellow-500/20" : "bg-purple-500/20"
                                    )}>
                                        {message.role === 'system' ? (
                                            <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
                                        ) : (
                                            <Bot className="h-4 w-4 text-purple-500" />
                                        )}
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-2xl p-4",
                                        message.role === 'user'
                                            ? "bg-primary text-primary-foreground"
                                            : message.role === 'system'
                                                ? "bg-yellow-500/10 border border-yellow-500/30"
                                                : "bg-muted"
                                    )}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    
                                    {/* Workflow Preview */}
                                    {message.workflowPreview && (
                                        <div className="mt-4 p-4 rounded-xl bg-background/50 border space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-sm">{message.workflowPreview.name}</h4>
                                                <Badge variant="secondary" className="text-xs">
                                                    {message.workflowPreview.nodes.length} nodes
                                                </Badge>
                                            </div>
                                            
                                            {/* Node Preview */}
                                            <div className="flex flex-wrap gap-2">
                                                {message.workflowPreview.nodes.map((node, idx) => (
                                                    <React.Fragment key={node.id}>
                                                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs">
                                                            <span className="font-medium">{node.type}</span>
                                                        </div>
                                                        {idx < message.workflowPreview!.nodes.length - 1 && (
                                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={handleCreateWorkflow}
                                                    className="gap-1"
                                                >
                                                    <Play className="h-3 w-3" />
                                                    Create Workflow
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(JSON.stringify(message.workflowPreview, null, 2))
                                                        toast.success('Copied to clipboard')
                                                    }}
                                                    className="gap-1"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                    Copy JSON
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-background/80 backdrop-blur">
                <div className="flex gap-2">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="Describe the workflow you want to create..."
                        className="min-h-[60px] max-h-[200px] resize-none"
                        disabled={isGenerating}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isGenerating}
                        className="h-auto px-4"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    Press Enter to send • Shift+Enter for new line
                </p>
            </div>
        </div>
    )
}

export default AIWorkflowBuilder
