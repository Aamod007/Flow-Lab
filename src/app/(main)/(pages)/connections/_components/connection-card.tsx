'use client'

import { ConnectionTypes } from '@/lib/types'
import React, { useState } from 'react'
import {
  Card,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Zap,
  TestTube,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type ConnectionStatus = {
  connected: boolean
  connectedAt?: string
  accountName?: string
  testData?: any
}

type Props = {
  type: ConnectionTypes
  icon: string
  title: ConnectionTypes
  description: string
  connectionStatus?: ConnectionStatus
  onConnect: () => void
  onDisconnect: () => void
  isLoading?: boolean
}

const ConnectionCard = ({
  description,
  type,
  icon,
  title,
  connectionStatus,
  onConnect,
  onDisconnect,
  isLoading = false,
}: Props) => {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)

  const isConnected = connectionStatus?.connected || false

  // Test connection using API for Notion and Slack
  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      let provider = ''
      if (title === 'Notion') provider = 'notion'
      else if (title === 'Slack') provider = 'slack'
      else {
        // For other providers, just mock success
        setTestResult({ success: true, message: `${title} connection simulated` })
        setIsTesting(false)
        onConnect()
        toast.success(`${title} connected successfully!`)
        return
      }

      const response = await fetch(`/api/connections/test?provider=${provider}&action=test`)
      const result = await response.json()

      setTestResult(result)

      if (result.success) {
        onConnect()
        toast.success(result.message, {
          description: result.data?.teamName || result.data?.workspace || undefined,
        })
      } else {
        toast.error('Connection failed', {
          description: result.message,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test failed'
      setTestResult({ success: false, message: errorMessage })
      toast.error('Test failed', { description: errorMessage })
    } finally {
      setIsTesting(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)

    // For Notion and Slack, use direct API test instead of OAuth popup
    if (title === 'Notion' || title === 'Slack') {
      await handleTestConnection()
      setIsConnecting(false)
      return
    }

    // Determine correct provider slug for the API route
    const providerSlug = title.toLowerCase().replace(/\s+/g, '-')
    const authUrl = `/api/auth/${providerSlug}`

    // Open OAuth popup
    const width = 600
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      authUrl,
      `Connect ${title}`,
      `width=${width},height=${height},left=${left},top=${top}`
    )

    // Poll to see if popup is closed
    const checkTimer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkTimer)
        setIsConnecting(false)
      }
    }, 1000)

    // Listen for success message from popup
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS' && event.data?.provider === providerSlug) {
        clearInterval(checkTimer)
        clearTimeout(timeoutId)
        window.removeEventListener('message', messageHandler)
        setIsConnecting(false)
        onConnect()
        toast.success(`Successfully connected to ${title}`)
      }
    }

    window.addEventListener('message', messageHandler)

    // Clean up listener after 5 minutes (timeout)
    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', messageHandler)
      clearInterval(checkTimer)
      setIsConnecting(false)
    }, 300000)
    
    // Return cleanup function
    return () => {
      clearInterval(checkTimer)
      clearTimeout(timeoutId)
      window.removeEventListener('message', messageHandler)
    }
  }

  const handleDisconnect = () => {
    setShowDisconnectDialog(false)
    setTestResult(null)
    onDisconnect()
  }

  // Get connection-specific docs URL
  const getDocsUrl = () => {
    switch (title) {
      case 'Google Drive': return 'https://developers.google.com/drive/api'
      case 'Discord': return 'https://discord.com/developers/docs'
      case 'Notion': return 'https://developers.notion.com/'
      case 'Slack': return 'https://api.slack.com/docs'
      default: return '#'
    }
  }

  // Check if this is a testable connection (has API keys in env)
  const isTestable = title === 'Notion' || title === 'Slack'

  if (isLoading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        isConnected
          ? "border-green-500/30 bg-green-500/5"
          : "border-muted-foreground/20 hover:border-primary/30"
      )}>
        <div className="p-4">
          {/* Header Row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              <Image
                src={icon}
                alt={title}
                height={32}
                width={32}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="absolute text-xs font-bold text-muted-foreground">
                {title.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{title}</span>
                {isConnected && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                )}
                {/* API Ready Badge removed */}
              </div>
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={cn(
              "text-xs p-2 rounded mb-3",
              testResult.success ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
            )}>
              {testResult.success ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{testResult.message}</span>
                  {testResult.data && (
                    <span className="text-muted-foreground ml-1">
                      ({testResult.data.teamName || testResult.data.workspace || testResult.data.botName})
                    </span>
                  )}
                </div>
              ) : (
                <span>{testResult.message}</span>
              )}
            </div>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                {/* Re-test button removed */}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => setShowDisconnectDialog(true)}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={isTestable ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-1 h-8 text-xs gap-1",
                    isTestable && "bg-primary hover:bg-primary/90"
                  )}
                  onClick={handleConnect}
                  disabled={isConnecting || isTesting}
                >
                  {isConnecting || isTesting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {isTestable ? 'Testing...' : 'Connecting...'}
                    </>
                  ) : (
                    <>
                      {isTestable ? <Zap className="h-3 w-3" /> : null}
                      Connect
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => window.open(getDocsUrl(), '_blank')}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {title}?</DialogTitle>
            <DialogDescription>
              Workflows using this connection will stop working until you reconnect.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ConnectionCard
