'use server'

import axios from 'axios'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'

export const onDiscordConnect = async (
  channel_id: string,
  webhook_id: string,
  webhook_name: string,
  webhook_url: string,
  id: string,
  guild_name: string,
  guild_id: string
) => {
  const { userId } = auth()
  if (!userId) {
    return { success: false, message: 'User not authenticated' }
  }

  try {
    // Create Discord webhook connection in database
    const webhook = await db.discordWebhook.upsert({
      where: { webhookId: webhook_id },
      update: {
        url: webhook_url,
        name: webhook_name,
        guildName: guild_name,
        guildId: guild_id,
        channelId: channel_id,
      },
      create: {
        webhookId: webhook_id,
        url: webhook_url,
        name: webhook_name,
        guildName: guild_name,
        guildId: guild_id,
        channelId: channel_id,
        userId: userId,
      }
    })

    // Create connection record
    await db.connections.create({
      data: {
        type: 'Discord',
        discordWebhookId: webhook.id,
        userId: userId,
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error saving Discord connection:', error)
    return { success: false, message: 'Failed to save Discord connection' }
  }
}

export const getDiscordConnectionUrl = async (): Promise<{
  url: string
  name: string
  guildName: string
} | null> => {
  const { userId } = auth()
  if (!userId) return null

  try {
    const webhook = await db.discordWebhook.findFirst({
      where: { userId: userId },
      select: {
        url: true,
        name: true,
        guildName: true,
      }
    })

    return webhook
  } catch (error) {
    console.error('Error fetching Discord connection:', error)
    return null
  }
}

export const postContentToWebHook = async (content: string, url: string) => {
  if (content != '') {
    const posted = await axios.post(url, { content })
    if (posted) {
      return { message: 'success' }
    }
    return { message: 'failed request' }
  }
  return { message: 'String empty' }
}
