'use client'

import { ConnectionTypes } from '@/lib/types'
import React from 'react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Image from 'next/image'

interface Props {
  type: ConnectionTypes
  icon: string
  title: ConnectionTypes
  description: string
  callback?: () => void
  connected: {} & any
}

const ConnectionCard = ({
  description,
  type,
  icon,
  title,
  connected,
}: Props) => {
  // Handle undefined or null connected object
  const isConnected = connected && connected[type] === true

  const handleConnect = () => {
    const authUrl = `/api/auth/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}`
    const width = 600
    const height = 700
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2

    // Open OAuth in popup window
    window.open(
      authUrl,
      `${title} OAuth`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )
  }

  return (
    <Card className="flex w-full items-center justify-between">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row gap-2">
          <Image
            src={icon}
            alt={title}
            height={30}
            width={30}
            className="object-contain"
          />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <div className="flex flex-col items-center gap-2 p-4">
        {isConnected ? (
          <div className="border-bg-primary rounded-lg border-2 px-3 py-2 font-bold text-white">
            Connected
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="rounded-lg bg-primary p-2 font-bold text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            Connect
          </button>
        )}
      </div>
    </Card>
  )
}

export default ConnectionCard
