import { CONNECTIONS } from '@/lib/constant'
import React from 'react'
import ConnectionCard from './_components/connection-card'
import { currentUser } from '@clerk/nextjs'
import { onDiscordConnect } from './_actions/discord-connection'
import { onNotionConnect } from './_actions/notion-connection'
import { onSlackConnect } from './_actions/slack-connection'
import { getUserData } from './_actions/get-user'
import { OAuthHandler } from './_components/oauth-handler'

type Props = {
  searchParams?: { [key: string]: string | undefined }
}

const Connections = async (props: Props) => {
  const {
    webhook_id,
    webhook_name,
    webhook_url,
    guild_id,
    guild_name,
    channel_id,
    access_token,
    workspace_name,
    workspace_icon,
    workspace_id,
    database_id,
    app_id,
    authed_user_id,
    authed_user_token,
    slack_access_token,
    bot_user_id,
    team_id,
    team_name,
    error,
  } = props.searchParams ?? {
    webhook_id: '',
    webhook_name: '',
    webhook_url: '',
    guild_id: '',
    guild_name: '',
    channel_id: '',
    access_token: '',
    workspace_name: '',
    workspace_icon: '',
    workspace_id: '',
    database_id: '',
    app_id: '',
    authed_user_id: '',
    authed_user_token: '',
    slack_access_token: '',
    bot_user_id: '',
    team_id: '',
    team_name: '',
    error: '',
  }

  let user
  try {
    user = await currentUser()
  } catch (error) {
    console.error('Clerk error:', error)
    // Return a fallback UI when Clerk fails
    return (
      <div className="relative flex flex-col gap-4">
        <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
          Connections
        </h1>
        <div className="mx-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-500">
          <p className="font-semibold">Authentication Service Unavailable</p>
          <p className="text-sm">Unable to connect to authentication service. Please refresh the page or try again later.</p>
        </div>
      </div>
    )
  }
  if (!user) return null

  const onUserConnections = async () => {
    console.log(database_id)

    try {
      await onDiscordConnect(
        channel_id!,
        webhook_id!,
        webhook_name!,
        webhook_url!,
        user.id,
        guild_name!,
        guild_id!
      )
      await onNotionConnect(
        access_token!,
        workspace_id!,
        workspace_icon!,
        workspace_name!,
        database_id!,
        user.id
      )
      await onSlackConnect(
        app_id!,
        authed_user_id!,
        authed_user_token!,
        slack_access_token!,
        bot_user_id!,
        team_id!,
        team_name!,
        user.id
      )
    } catch (error) {
      console.warn('Connection actions failed (migrations may not be applied):', error)
    }

    const connections: Record<string, boolean> = {}

    try {
      const user_info = await getUserData(user.id)

      //get user info with all connections
      user_info?.connections.forEach((connection) => {
        connections[connection.type] = true
      })
    } catch (error) {
      console.warn('Failed to get user connections (database may not have clerkId column):', error)
      // Return empty connections - user can still click Connect buttons
    }

    // Google Drive connection will always be true
    // as it is given access during the login process
    return { ...connections, 'Google Drive': true }
  }

  const connections = await onUserConnections()

  return (
    <div className="relative flex flex-col gap-4">
      <OAuthHandler />
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        Connections
      </h1>
      {error && (
        <div className="mx-6 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-500">
          <p className="font-semibold">Connection Error</p>
          <p className="text-sm">{decodeURIComponent(error)}</p>
        </div>
      )}
      <div className="relative flex flex-col gap-4">
        <section className="flex flex-col gap-4 p-6 text-muted-foreground">
          Connect all your apps directly from here. You may need to connect
          these apps regularly to refresh verification
          {CONNECTIONS.map((connection) => (
            <ConnectionCard
              key={connection.title}
              description={connection.description}
              title={connection.title}
              icon={connection.image}
              type={connection.title}
              connected={connections}
            />
          ))}
        </section>
      </div>
    </div>
  )
}

export default Connections
