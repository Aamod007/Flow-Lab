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
        // Default to zero stats if parsing fails
        setAiStats({
          totalExecutions: 0,
          estimatedCost: 0,
          tokensUsed: 0,
          savedByLocal: 0
        })
      }
    }
    
    // Also try to fetch stats from API
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics/stats')
        if (response.ok) {
          const data = await response.json()
          setAiStats(prev => ({
            ...prev,
            ...data
          }))
        }
      } catch (error) {
        console.error('Error fetching AI stats:', error)
      }
    }
    
    fetchStats()
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
      </h1>

      <div className="flex flex-col gap-6 p-6 pt-0">
        {/* Top Row - Stats + Quick Actions side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Left: 2x2 Stats Grid */}
          <div className="xl:col-span-3 grid grid-cols-2 gap-4">
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
            />
            <StatsCard
              title="AI Executions"
              value={aiStats.totalExecutions}
              description="This month"
              icon={Bot}
            />
            <StatsCard
              title="Connections"
              value={4}
              description="Integrations available"
              icon={Plug}
            />
          </div>

          {/* Right: Quick Actions */}
          <div className="xl:col-span-2">
            <QuickActions />
          </div>
        </div>

        {/* Middle Row - AI Cost Tracker (compact horizontal bar) */}
        <div className="grid grid-cols-4 gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/60 transition-colors group cursor-default">
            <div className="p-2 rounded-lg bg-white">
              <DollarSign className="h-5 w-5 text-black" />
            </div>
            <div>
              <p className="text-xl font-bold group-hover:scale-105 transition-transform origin-left">
                ${aiStats.estimatedCost.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Spent this month</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/60 transition-colors group cursor-default">
            <div className="p-2 rounded-lg bg-neutral-800">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold group-hover:scale-105 transition-transform origin-left">
                {(aiStats.tokensUsed / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-muted-foreground">Tokens used</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/60 transition-colors group cursor-default">
            <div className="p-2 rounded-lg bg-neutral-800">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold group-hover:scale-105 transition-transform origin-left">
                ${aiStats.savedByLocal.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Saved with Ollama</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/60 transition-colors group cursor-default">
            <div className="p-2 rounded-lg bg-neutral-800">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold group-hover:scale-105 transition-transform origin-left">
                {((aiStats.savedByLocal / (aiStats.estimatedCost + aiStats.savedByLocal || 1)) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">Cost savings</p>
            </div>
          </div>
        </div>

        {/* Bottom Row - Recent Workflows + Activity Feed */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RecentWorkflows />
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

