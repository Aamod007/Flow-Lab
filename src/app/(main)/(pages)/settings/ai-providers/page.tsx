'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Bot,
    Cpu,
    Cloud,
    Settings2,
    ArrowLeft,
    RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import OllamaManager from './_components/ollama-manager'
import ApiKeyManager from './_components/api-key-manager'
import ProviderStatus from './_components/provider-status'

const AIProvidersPage = () => {
    const [activeTab, setActiveTab] = useState('overview')

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 backdrop-blur-lg">
                <div className="flex items-center gap-4">
                    <Link href="/settings">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Bot className="h-6 w-6 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">AI Providers</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage your AI models and API keys
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="overview" className="gap-2">
                            <Cloud className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="ollama" className="gap-2">
                            <Cpu className="h-4 w-4" />
                            Ollama
                        </TabsTrigger>
                        <TabsTrigger value="api-keys" className="gap-2">
                            <Settings2 className="h-4 w-4" />
                            API Keys
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <ProviderStatus />
                    </TabsContent>

                    {/* Ollama Tab */}
                    <TabsContent value="ollama" className="space-y-6">
                        <OllamaManager />
                    </TabsContent>

                    {/* API Keys Tab */}
                    <TabsContent value="api-keys" className="space-y-6">
                        <ApiKeyManager />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export default AIProvidersPage
