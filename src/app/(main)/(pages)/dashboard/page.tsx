'use client'

import React, { useEffect, useState } from 'react'
import { useBilling } from '@/providers/billing-provider'
import { getWorkflowsFromStorage } from '@/lib/workflow-storage'
import {
  GitBranch,
  Zap,
  CreditCard,
  Plug,
  Bot,
  DollarSign,
  TrendingUp,
  Sparkles
} from 'lucide-react'

import StatsCard from './_components/stats-card'
import RecentWorkflows from './_components/recent-workflows'
import QuickActions from './_components/quick-actions'
import ActivityFeed from './_components/activity-feed'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const DashboardPage = () => {
  const { credits, tier } = useBilling()
  const [workflows, setWorkflows] = useState<any[]>([])
  const [aiStats, setAiStats] = useState({
    totalExecutions: 0,
    estimatedCost: 0,
    tokensUsed: 0,
    savedByLocal: 0
  })

  useEffect(() => {
    const stored = getWorkflowsFromStorage()
    setWorkflows(stored)

    // Load AI stats from localStorage  
    const savedStats = localStorage.getItem('flowlab_ai_stats')
    if (savedStats) {
      try {
        setAiStats(JSON.parse(savedStats))
      } catch (e) {
        // Use default stats for demo
        setAiStats({
          totalExecutions: 47,
          estimatedCost: 2.34,
          tokensUsed: 125000,
          savedByLocal: 18.50
        })
      }
    } else {
      // Demo stats
      setAiStats({
        totalExecutions: 47,
        estimatedCost: 2.34,
        tokensUsed: 125000,
        savedByLocal: 18.50
      })
    }
  }, [])

  const publishedCount = workflows.filter(w => w.publish).length
  const draftCount = workflows.length - publishedCount

  const maxCredits = tier === 'Free' ? 10 : tier === 'Pro' ? 100 : Infinity
  const creditsDisplay = tier === 'Unlimited'
    ? '∞'
    : `${credits}/${maxCredits}`

  return (
    <div className="flex flex-col gap-6 relative">
      <h1 className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center border-b">
        Dashboard
        <Badge variant="secondary" className="ml-3 text-xs font-normal">
          <Sparkles className="h-3 w-3 mr-1" />
          FlowLab AI
        </Badge>
      </h1>

      <div className="flex flex-col gap-6 p-6 pt-0">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Workflows"
            value={workflows.length}
            description="Automations created"
            icon={GitBranch}
          />
          <StatsCard
            title="Active Workflows"
            value={publishedCount}
            description={`${draftCount} drafts`}
            icon={Zap}
            iconClassName="bg-green-500/10"
          />
          <StatsCard
            title="AI Executions"
            value={aiStats.totalExecutions}
            description="This month"
            icon={Bot}
            iconClassName="bg-blue-500/10"
          />
          <StatsCard
            title="Connections"
            value={4}
            description="Integrations available"
            icon={Plug}
            iconClassName="bg-orange-500/10"
          />
        </div>

        {/* AI Cost Tracking Card */}
        <Card className="bg-gradient-to-br from-primary/5 via-background to-blue-500/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              AI Cost Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-2xl font-bold text-green-500">
                  ${aiStats.estimatedCost.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Total Spent (Month)</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-2xl font-bold text-blue-500">
                  {(aiStats.tokensUsed / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-muted-foreground">Tokens Used</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-2xl font-bold text-purple-500">
                  ${aiStats.savedByLocal.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Saved with Ollama</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <p className="text-2xl font-bold">
                    {((aiStats.savedByLocal / (aiStats.estimatedCost + aiStats.savedByLocal || 1)) * 100).toFixed(0)}%
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Cost Savings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentWorkflows />
          </div>

          <div className="flex flex-col gap-6">
            <QuickActions />
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

