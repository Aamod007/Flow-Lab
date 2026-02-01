'use client'

import { ConnectionTypes } from '@/lib/types'
import React, { useState, useEffect } from 'react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Unlink
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
import { useRouter } from 'next/navigation'

type ConnectionStatus = {
  connected: boolean
  connectedAt?: string
  accountName?: string
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
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)
  const router = useRouter()

  const isConnected = connectionStatus?.connected || false

  const handleConnect = async () => {
    setIsConnecting(true)

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

    // Poll to see if popup is closed (fallback if message passing fails)
    const checkTimer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkTimer)
        setIsConnecting(false)
        // We'll let the message listener handle the actual success state
        // But if they just closed it without logging in, we stop the spinner
      }
    }, 1000)

    // Listen for success message from popup
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS' && event.data?.provider === providerSlug) {
        clearInterval(checkTimer)
        setIsConnecting(false)
        onConnect() // Update parent state
        toast.success(`Successfully connected to ${title}`)
      }
    }

    window.addEventListener('message', messageHandler)

    // Clean up listener after 5 minutes (timeout)
    setTimeout(() => {
      window.removeEventListener('message', messageHandler)
      clearInterval(checkTimer)
      setIsConnecting(false)
    }, 300000)
  }

  const handleDisconnect = () => {
    setShowDisconnectDialog(false)
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              <Image
                src={icon}
                alt={title}
                height={28}
                width={28}
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
              </div>
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            </div>
          </div>

          {/* Actions Row */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setShowDisconnectDialog(true)}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
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
