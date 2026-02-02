'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
    Clock,
    DollarSign,
    Zap,
    CheckCircle2,
    TrendingUp,
    Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveMetricsCardsProps {
    elapsedTime: string
    totalCost: number
    totalTokens: number
    completedAgents: number
    totalAgents: number
    status: string
}

const LiveMetricsCards: React.FC<LiveMetricsCardsProps> = ({
    elapsedTime,
    totalCost,
    totalTokens,
    completedAgents,
    totalAgents,
    status
}) => {
    const progressPercent = totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0

    const getCostColor = (cost: number) => {
        if (cost === 0) return 'text-green-500'
        if (cost < 0.01) return 'text-green-500'
        if (cost < 0.10) return 'text-yellow-500'
        return 'text-red-500'
    }

    return (
        <div className="p-3 space-y-3 bg-muted/20">
            {/* Progress Bar */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Progress</span>
                    <span className="font-semibold text-foreground">
                        {completedAgents}/{totalAgents} agents
                    </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
                    <div
                        className={cn(
                            "h-full transition-all duration-500 rounded-full relative",
                            status === 'RUNNING' && "bg-gradient-to-r from-blue-600 to-blue-400",
                            status === 'COMPLETED' && "bg-gradient-to-r from-green-600 to-green-400",
                            status === 'FAILED' && "bg-gradient-to-r from-red-600 to-red-400",
                            status === 'PAUSED' && "bg-gradient-to-r from-yellow-600 to-yellow-400",
                            status === 'IDLE' && "bg-muted-foreground"
                        )}
                        style={{ width: `${progressPercent}%` }}
                    >
                        {status === 'RUNNING' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        )}
                    </div>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-2">
                {/* Elapsed Time */}
                <Card className="border-muted/50 bg-background/50 shadow-sm">
                    <CardContent className="p-2.5 flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Elapsed</p>
                            <p className="font-mono font-bold text-sm">{elapsedTime}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Cost */}
                <Card className="border-muted/50 bg-background/50 shadow-sm">
                    <CardContent className="p-2.5 flex items-center gap-2.5">
                        <div className={cn(
                            "p-1.5 rounded-md border",
                            totalCost === 0 ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"
                        )}>
                            <DollarSign className={cn(
                                "h-3.5 w-3.5",
                                getCostColor(totalCost)
                            )} />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cost</p>
                            <p className={cn("font-mono font-bold text-sm", getCostColor(totalCost))}>
                                {totalCost === 0 ? 'FREE' : `$${totalCost.toFixed(4)}`}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Tokens */}
                <Card className="border-muted/50 bg-background/50 shadow-sm">
                    <CardContent className="p-2.5 flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                            <Zap className="h-3.5 w-3.5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tokens</p>
                            <p className="font-mono font-bold text-sm">
                                {totalTokens.toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Completion Status */}
                <Card className="border-muted/50 bg-background/50 shadow-sm">
                    <CardContent className="p-2.5 flex items-center gap-2.5">
                        <div className={cn(
                            "p-1.5 rounded-md border",
                            status === 'COMPLETED' ? "bg-green-500/10 border-green-500/20" :
                                status === 'RUNNING' ? "bg-blue-500/10 border-blue-500/20" :
                                    status === 'FAILED' ? "bg-red-500/10 border-red-500/20" : "bg-muted border-muted"
                        )}>
                            {status === 'COMPLETED' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : status === 'RUNNING' ? (
                                <Activity className="h-3.5 w-3.5 text-blue-500" />
                            ) : (
                                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Complete</p>
                            <p className={cn(
                                "font-bold text-sm",
                                status === 'COMPLETED' && "text-green-500",
                                status === 'RUNNING' && "text-blue-500",
                                status === 'FAILED' && "text-red-500"
                            )}>
                                {Math.round(progressPercent)}%
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Breakdown Hint */}
            {totalCost > 0 && (
                <div className="text-xs text-muted-foreground flex items-center gap-2 px-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>
                        Avg cost per agent: ${(totalCost / Math.max(completedAgents, 1)).toFixed(4)}
                    </span>
                </div>
            )}

            {/* Free Model Indicator */}
            {totalCost === 0 && completedAgents > 0 && (
                <div className="text-xs text-green-500 flex items-center gap-2 px-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Running on free/local models</span>
                </div>
            )}
        </div>
    )
}

export default LiveMetricsCards
