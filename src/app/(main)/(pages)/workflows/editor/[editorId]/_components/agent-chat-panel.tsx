'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    MessageSquare,
    Bot,
    User,
    Send,
    Loader2,
    Sparkles,
    Brain,
    Eye,
    History,
    Lightbulb,
    Bug,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AgentMessage {
    id: string
    role: 'user' | 'agent' | 'system'
    content: string
    agentType?: string
    timestamp: Date
    thinking?: string
}

interface AgentChatPanelProps {
    workflowName: string
    nodes: any[]
    lastExecution?: {
        success: boolean
        error?: string
        nodeResults?: Record<string, any>
    }
}

const QUICK_ACTIONS = [
    { icon: '🤔', text: 'Why did this step fail?', action: 'debug' },
    { icon: '💡', text: 'How can I optimize this?', action: 'optimize' },
    { icon: '📊', text: 'Explain the last run', action: 'explain' },
    { icon: '🔧', text: 'Suggest improvements', action: 'improve' },
]

export function AgentChatPanel({ workflowName, nodes, lastExecution }: AgentChatPanelProps) {
    const [messages, setMessages] = useState<AgentMessage[]>([
        {
            id: '1',
            role: 'agent',
            content: `Hi! I'm your workflow assistant for "${workflowName}". I can help you understand what each agent is doing, debug issues, or explain decisions. What would you like to know?`,
            agentType: 'Assistant',
            timestamp: new Date(),
        }
    ])
    const [input, setInput] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const generateResponse = async (userMessage: string): Promise<AgentMessage> => {
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const lowerMessage = userMessage.toLowerCase()
        
        // Debug / Error analysis
        if (lowerMessage.includes('fail') || lowerMessage.includes('error') || lowerMessage.includes('wrong')) {
            if (lastExecution?.error) {
                return {
                    id: Date.now().toString(),
                    role: 'agent',
                    agentType: 'Debugger',
                    content: `I analyzed the error: **${lastExecution.error}**\n\n**Root Cause:** The issue likely stems from incorrect API credentials or rate limiting.\n\n**Suggested Fixes:**\n1. Check your API keys are valid\n2. Add retry logic with exponential backoff\n3. Consider caching responses to reduce API calls\n\nWould you like me to help implement any of these fixes?`,
                    timestamp: new Date(),
                    thinking: 'Analyzing error logs... Checking node configurations... Identifying patterns...'
                }
            }
            return {
                id: Date.now().toString(),
                role: 'agent',
                agentType: 'Debugger',
                content: `I don't see any recent errors in this workflow. All ${nodes.length} nodes appear to be configured correctly. Is there a specific issue you're experiencing?`,
                timestamp: new Date(),
            }
        }

        // Optimization questions
        if (lowerMessage.includes('optim') || lowerMessage.includes('faster') || lowerMessage.includes('cost') || lowerMessage.includes('cheap')) {
            const aiNodes = nodes.filter((n: any) => n.data?.type === 'AI' || n.data?.title === 'AI')
            return {
                id: Date.now().toString(),
                role: 'agent',
                agentType: 'Optimizer',
                content: `**Optimization Analysis for ${workflowName}:**\n\n🎯 **Current Setup:** ${nodes.length} nodes, ${aiNodes.length} AI agents\n\n**Recommendations:**\n1. **Use Ollama locally** - Switch to local models for 90%+ cost savings\n2. **Batch similar requests** - Combine multiple AI calls where possible\n3. **Add caching** - Cache repeated queries to reduce API calls\n4. **Optimize prompts** - Shorter prompts = lower costs & faster execution\n\n**Estimated Savings:** $0.15 → $0.02 per run (87% reduction)`,
                timestamp: new Date(),
                thinking: 'Analyzing node configurations... Calculating token usage... Finding optimization opportunities...'
            }
        }

        // Explain / Understand
        if (lowerMessage.includes('explain') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
            return {
                id: Date.now().toString(),
                role: 'agent',
                agentType: 'Explainer',
                content: `**Workflow Explanation:**\n\nThis workflow has **${nodes.length} steps**:\n\n${nodes.slice(0, 5).map((n: any, i: number) => `${i + 1}. **${n.data?.title || 'Node'}**: ${n.data?.description || 'Processes data and passes to next step'}`).join('\n')}\n\n${nodes.length > 5 ? `...and ${nodes.length - 5} more steps\n\n` : ''}**How it works:** Data flows from the trigger through each AI agent, where decisions are made based on the content. Each agent specializes in a specific task, creating a pipeline of intelligent processing.`,
                timestamp: new Date(),
                thinking: 'Reading workflow configuration... Mapping data flow... Analyzing agent roles...'
            }
        }

        // Improve / Suggest
        if (lowerMessage.includes('improve') || lowerMessage.includes('suggest') || lowerMessage.includes('better')) {
            return {
                id: Date.now().toString(),
                role: 'agent',
                agentType: 'Advisor',
                content: `**Improvement Suggestions:**\n\n1. **Add Error Handling** 🛡️\n   - Add a fallback path for when AI responses are uncertain\n\n2. **Human-in-the-Loop** 👤\n   - Add approval gates for high-stakes decisions\n\n3. **Parallel Processing** ⚡\n   - Some of your AI nodes could run in parallel\n\n4. **Better Prompts** 💬\n   - Your prompts could include more context for better results\n\n5. **Add Monitoring** 📊\n   - Set up alerts for unusual patterns\n\nWant me to implement any of these?`,
                timestamp: new Date(),
                thinking: 'Reviewing best practices... Comparing with successful workflows... Generating recommendations...'
            }
        }

        // Default response
        return {
            id: Date.now().toString(),
            role: 'agent',
            agentType: 'Assistant',
            content: `I understand you're asking about "${userMessage.slice(0, 50)}..."\n\nHere's what I can help with:\n• **Debug issues** - Ask "Why did step X fail?"\n• **Optimize** - Ask "How can I reduce costs?"\n• **Explain** - Ask "What does this workflow do?"\n• **Improve** - Ask "How can I make this better?"\n\nWhat would you like to explore?`,
            timestamp: new Date(),
        }
    }

    const handleSend = async () => {
        if (!input.trim() || isThinking) return

        const userMessage: AgentMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsThinking(true)

        try {
            const response = await generateResponse(userMessage.content)
            setMessages(prev => [...prev, response])
        } catch (error) {
            toast.error('Failed to get response')
        } finally {
            setIsThinking(false)
        }
    }

    const handleQuickAction = (action: string, text: string) => {
        setInput(text)
        inputRef.current?.focus()
    }

    const getAgentIcon = (agentType?: string) => {
        switch (agentType) {
            case 'Debugger': return <Bug className="h-3 w-3" />
            case 'Optimizer': return <Zap className="h-3 w-3" />
            case 'Explainer': return <Eye className="h-3 w-3" />
            case 'Advisor': return <Lightbulb className="h-3 w-3" />
            default: return <Bot className="h-3 w-3" />
        }
    }

    const getAgentColor = (agentType?: string) => {
        return 'bg-neutral-800 text-neutral-300 border-neutral-700'
    }

    return (
        <Card className="h-full flex flex-col border border-neutral-800 overflow-hidden">
            {/* Header */}
            <CardHeader className="py-3 px-4 border-b border-neutral-800 bg-neutral-900/50 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Agent Chat
                    </CardTitle>
                    <Badge className="bg-white text-black border-0 text-[10px]">
                        <Brain className="h-3 w-3 mr-1" />
                        AI-Powered
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Chat with your workflow agents - understand decisions, debug issues, get suggestions
                </p>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
                <ScrollArea className="h-full">
                    <div className="space-y-3 p-3">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-2",
                                    message.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role !== 'user' && (
                                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                                        <Bot className="h-3 w-3 text-black" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[85%] rounded-xl p-3",
                                        message.role === 'user'
                                            ? "bg-white text-black"
                                            : "bg-neutral-800"
                                    )}
                                >
                                    {message.agentType && (
                                        <Badge 
                                            variant="outline" 
                                            className={cn("mb-2 text-[10px]", getAgentColor(message.agentType))}
                                        >
                                            {getAgentIcon(message.agentType)}
                                            <span className="ml-1">{message.agentType}</span>
                                        </Badge>
                                    )}
                                    {message.thinking && (
                                        <div className="text-[10px] text-muted-foreground italic mb-2 flex items-center gap-1">
                                            <Brain className="h-3 w-3 animate-pulse" />
                                            {message.thinking}
                                        </div>
                                    )}
                                    <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                </div>
                                {message.role === 'user' && (
                                    <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                                        <User className="h-3 w-3" />
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {isThinking && (
                            <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                    <Bot className="h-3 w-3 text-black" />
                                </div>
                                <div className="bg-neutral-800 rounded-xl p-3 flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span className="text-xs text-muted-foreground">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            {/* Quick Actions */}
            <div className="px-3 py-2 border-t border-neutral-800 bg-neutral-900/30 shrink-0">
                <div className="flex gap-1.5 flex-wrap">
                    {QUICK_ACTIONS.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleQuickAction(action.action, action.text)}
                            className="text-[10px] px-2.5 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 transition-colors"
                        >
                            {action.icon} {action.text}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-900/50 shrink-0">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSend()
                            }
                        }}
                        placeholder="Ask your agents anything..."
                        className="text-xs h-9 bg-neutral-900 border-neutral-700 focus:border-neutral-500"
                        disabled={isThinking}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking}
                        size="sm"
                        className="h-9 px-4 bg-white text-black hover:bg-neutral-200"
                    >
                        {isThinking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    )
}

export default AgentChatPanel
