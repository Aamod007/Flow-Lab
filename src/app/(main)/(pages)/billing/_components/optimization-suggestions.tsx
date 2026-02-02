'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Lightbulb,
    TrendingDown,
    ArrowRight,
    CheckCircle2,
    Cpu,
    Zap,
    DollarSign,
    RefreshCw,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    generateOptimizationRecommendations,
    suggestModelForTask,
    type OptimizationRecommendation
} from '@/lib/cost-optimizer'

interface OptimizationSuggestionsProps {
    onApplySuggestion?: (suggestion: OptimizationRecommendation) => void
}

export const OptimizationSuggestions = ({ onApplySuggestion }: OptimizationSuggestionsProps) => {
    const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadRecommendations()
    }, [])

    const loadRecommendations = async () => {
        setIsLoading(true)
        try {
            const recs = await generateOptimizationRecommendations()
            setRecommendations(recs)
        } catch (error) {
            console.error('Failed to load recommendations:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20'
            case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
            case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20'
            default: return 'text-muted-foreground bg-muted'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'MODEL_SWITCH': return <RefreshCw className="h-4 w-4" />
            case 'FREE_ALTERNATIVE': return <Cpu className="h-4 w-4" />
            case 'BATCH_OPTIMIZATION': return <Zap className="h-4 w-4" />
            case 'TOKEN_REDUCTION': return <DollarSign className="h-4 w-4" />
            default: return <Lightbulb className="h-4 w-4" />
        }
    }

    const handleApply = (rec: OptimizationRecommendation) => {
        setAppliedIds(prev => {
            const newSet = new Set<string>()
            prev.forEach(id => newSet.add(id))
            newSet.add(rec.id)
            return newSet
        })
        onApplySuggestion?.(rec)
    }

    const totalPotentialSavings = recommendations.reduce((sum, r) => sum + r.monthlySavings, 0)

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                            Optimization Suggestions
                        </CardTitle>
                        <CardDescription>
                            AI-powered recommendations to reduce your costs
                        </CardDescription>
                    </div>
                    {totalPotentialSavings > 0 && (
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Potential Savings</p>
                            <p className="text-2xl font-bold text-green-500">
                                ${totalPotentialSavings.toFixed(2)}/mo
                            </p>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {recommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                        <p className="font-medium">All optimized!</p>
                        <p className="text-sm">Your workflow is already running efficiently.</p>
                    </div>
                ) : (
                    recommendations.map((rec) => {
                        const savingsPercent = rec.currentCost > 0 
                            ? Math.round(((rec.currentCost - rec.projectedCost) / rec.currentCost) * 100) 
                            : 0
                        
                        return (
                            <div
                                key={rec.id}
                                className={cn(
                                    "border rounded-lg p-4 transition-all",
                                    appliedIds.has(rec.id) && "opacity-50 bg-muted/50"
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg",
                                            getPriorityColor(rec.priority)
                                        )}>
                                            {getTypeIcon(rec.type)}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{rec.title}</h4>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-xs", getPriorityColor(rec.priority))}
                                                >
                                                    {rec.priority}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {rec.description}
                                            </p>
                                            
                                            {/* Savings indicator */}
                                            <div className="flex items-center gap-4 pt-2">
                                                <div className="flex items-center gap-1 text-green-500">
                                                    <TrendingDown className="h-4 w-4" />
                                                    <span className="text-sm font-medium">
                                                        Save ${rec.monthlySavings.toFixed(2)}/mo
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {savingsPercent}% cost reduction
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant={appliedIds.has(rec.id) ? "outline" : "default"}
                                        disabled={appliedIds.has(rec.id)}
                                        onClick={() => handleApply(rec)}
                                    >
                                        {appliedIds.has(rec.id) ? (
                                            <>
                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                Applied
                                            </>
                                        ) : (
                                            <>
                                                Apply
                                                <ArrowRight className="h-4 w-4 ml-1" />
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Expandable Details - Tradeoffs */}
                                {expandedId === rec.id && rec.tradeoffs && rec.tradeoffs.length > 0 && (
                                    <div className="mt-4 pt-4 border-t space-y-3">
                                        <h5 className="text-sm font-medium">Tradeoffs to consider:</h5>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            {rec.tradeoffs.map((tradeoff: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <span className="text-primary">•</span>
                                                    {tradeoff}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {rec.tradeoffs && rec.tradeoffs.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 w-full"
                                        onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                                    >
                                        {expandedId === rec.id ? (
                                            <>
                                                <ChevronUp className="h-4 w-4 mr-1" />
                                                Hide details
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="h-4 w-4 mr-1" />
                                                Show details
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        )
                    })
                )}

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={loadRecommendations}
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Recommendations
                </Button>
            </CardContent>
        </Card>
    )
}

// Quick suggestion component for inline use
export const QuickModelSuggestion = ({ 
    taskType, 
    currentModel,
    onSwitch 
}: { 
    taskType: string
    currentModel: string
    onSwitch?: (provider: string, model: string) => void 
}) => {
    const suggestion = suggestModelForTask(taskType)
    
    if (suggestion.model === currentModel) {
        return null
    }

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-500" />
                <div>
                    <p className="text-sm font-medium">
                        Switch to {suggestion.model}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {suggestion.reason}
                    </p>
                </div>
            </div>
            <Button
                size="sm"
                variant="outline"
                onClick={() => onSwitch?.(suggestion.provider, suggestion.model)}
            >
                Switch
            </Button>
        </div>
    )
}

export default OptimizationSuggestions
