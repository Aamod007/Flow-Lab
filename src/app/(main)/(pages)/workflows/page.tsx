'use client'
import React, { useState } from 'react'
import WorkflowButton from './_components/workflow-button'
import Workflows from './_components'
import AIWorkflowBuilder from './_components/ai-workflow-builder'
import { Button } from '@/components/ui/button'
import { Wand2, List, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

type Props = {}

const Page = (props: Props) => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'ai-builder'>('workflows')

  return (
    <div className="flex flex-col relative h-full">
      <div className="sticky top-0 z-[10] bg-background/50 backdrop-blur-lg border-b">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold">Workflows</h1>
            
            {/* Tab Switcher */}
            <div className="flex items-center bg-muted rounded-lg p-1 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('workflows')}
                className={cn(
                  "gap-2 rounded-md transition-all",
                  activeTab === 'workflows' 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-4 w-4" />
                My Workflows
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('ai-builder')}
                className={cn(
                  "gap-2 rounded-md transition-all",
                  activeTab === 'ai-builder' 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Wand2 className="h-4 w-4" />
                AI Builder
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-400 border-0">
                  NEW
                </Badge>
              </Button>
            </div>
          </div>
          
          {activeTab === 'workflows' && <WorkflowButton />}
        </div>
        
        {activeTab === 'ai-builder' && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>n8n can't do this! Describe your workflow in plain English and let AI build it.</span>
            </div>
          </div>
        )}
      </div>
      
      {activeTab === 'workflows' ? (
        <Workflows />
      ) : (
        <div className="flex-1 h-[calc(100vh-180px)]">
          <AIWorkflowBuilder />
        </div>
      )}
    </div>
  )
}

export default Page
