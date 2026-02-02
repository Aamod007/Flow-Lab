'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getWorkflowsFromStorage } from '@/lib/workflow-storage'
import { GitBranch, ArrowRight, Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Workflow = {
    id: string
    name: string
    description: string
    publish: boolean
    createdAt?: string
}

const RecentWorkflows = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([])

    useEffect(() => {
        const stored = getWorkflowsFromStorage()
        // Get the 5 most recent workflows
        setWorkflows(stored.slice(0, 5))
    }, [])

    if (workflows.length === 0) {
        return (
            <Card className="border-neutral-800 bg-neutral-900/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <GitBranch className="h-5 w-5" />
                        Recent Workflows
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="p-4 rounded-full bg-neutral-800 mb-4">
                            <Zap className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-4">No workflows yet</p>
                        <Link href="/workflows">
                            <Button variant="outline" className="gap-2 border-neutral-700 hover:bg-neutral-800 hover:border-neutral-600">
                                Create your first workflow
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <GitBranch className="h-5 w-5" />
                    Recent Workflows
                </CardTitle>
                <Link href="/workflows">
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-white">
                        View all
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="space-y-3">
                {workflows.map((workflow, index) => (
                    <Link
                        key={workflow.id}
                        href={`/workflows/editor/${workflow.id}`}
                        className="block"
                    >
                        <div className={cn(
                            'flex items-center justify-between p-4 rounded-lg transition-all duration-200',
                            'bg-neutral-800/30 hover:bg-neutral-800/70 border border-neutral-800 hover:border-neutral-700',
                            'group cursor-pointer'
                        )}>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neutral-800 text-white font-medium group-hover:bg-white group-hover:text-black transition-all duration-200">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-medium group-hover:text-white transition-colors">
                                        {workflow.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {workflow.description || 'No description'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge
                                    variant="secondary"
                                    className="bg-neutral-800 text-neutral-300 border border-neutral-700"
                                >
                                    {workflow.publish ? 'Published' : 'Draft'}
                                </Badge>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}

export default RecentWorkflows
