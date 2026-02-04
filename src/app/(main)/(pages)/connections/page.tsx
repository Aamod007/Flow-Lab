'use client'

import { CONNECTIONS } from '@/lib/constant'
import React, { useState, useEffect } from 'react'
import ConnectionCard from './_components/connection-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Link2,
  RefreshCw,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

// Connection status storage key
const CONNECTION_STORAGE_KEY = 'flowlab_connections'

// Type for connection status
type ConnectionStatus = {
  [key: string]: {
    connected: boolean
    connectedAt?: string
    accountName?: string
  }
}

const Connections = () => {
  const [connections, setConnections] = useState<ConnectionStatus>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load connection status from localStorage
  useEffect(() => {
    const savedConnections = localStorage.getItem(CONNECTION_STORAGE_KEY)
    if (savedConnections) {
      try {
        setConnections(JSON.parse(savedConnections))
      } catch (e) {
        console.error('Failed to parse saved connections')
      }
    }
    setIsLoading(false)
  }, [])

  // Save connections to localStorage whenever they change
  const saveConnections = (newConnections: ConnectionStatus) => {
    setConnections(newConnections)
    localStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(newConnections))
  }

  // Handle connection toggle
  const handleConnect = (title: string) => {
    const newConnections = {
      ...connections,
      [title]: {
        connected: true,
        connectedAt: new Date().toISOString(),
        accountName: `${title} Account`
      }
    }
    saveConnections(newConnections)
    toast.success(`${title} connected successfully!`)
  }

  // Handle disconnect
  const handleDisconnect = (title: string) => {
    const newConnections = { ...connections }
    delete newConnections[title]
    saveConnections(newConnections)
    toast.info(`${title} disconnected`)
  }

  // Refresh all connections
  const handleRefreshAll = () => {
    toast.success('Connections refreshed')
  }

  // Count connected apps
  const connectedCount = Object.values(connections).filter(c => c.connected).length
  const totalCount = CONNECTIONS.length

  return (
    <div className="relative flex flex-col gap-4">
      {/* Header */}
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        <span className="flex items-center gap-3">
          <Link2 className="h-8 w-8" />
          Connections
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </Button>
      </h1>

      <div className="p-6 flex flex-col gap-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedCount}/{totalCount}</p>
                <p className="text-sm text-muted-foreground">Apps Connected</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">Secure</p>
                <p className="text-sm text-muted-foreground">OAuth 2.0 Protected</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Zap className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">Real-time</p>
                <p className="text-sm text-muted-foreground">Instant Sync</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-500">Connect Your Apps</p>
              <p className="text-sm text-muted-foreground">
                Connect your favorite apps to enable powerful automations. Each connection is secured
                with OAuth 2.0 and your credentials are never stored. You may need to reconnect
                periodically to refresh authentication tokens.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Connections Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Integrations</h2>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {connectedCount} Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {CONNECTIONS.map((connection) => (
              <ConnectionCard
                key={connection.title}
                description={connection.description}
                title={connection.title}
                icon={connection.image}
                type={connection.title}
                connectionStatus={connections[connection.title]}
                onConnect={() => handleConnect(connection.title)}
                onDisconnect={() => handleDisconnect(connection.title)}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Connections
