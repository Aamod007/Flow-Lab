'use server'

import axios from 'axios'

// Mock Discord connection for demo mode - no database required

export const onDiscordConnect = async (
  channel_id: string,
  webhook_id: string,
  webhook_name: string,
  webhook_url: string,
  id: string,
  guild_name: string,
  guild_id: string
) => {
  // Mock connection - just log and return success
  console.log('Discord connection requested for guild:', guild_name)
  return { success: true }
}

export const getDiscordConnectionUrl = async (): Promise<{
  url: string
  name: string
  guildName: string
} | null> => {
  // Return null for demo - no database required
  return null
}

export const postContentToWebHook = async (content: string, url: string) => {
  console.log(content)
  if (content != '') {
    const posted = await axios.post(url, { content })
    if (posted) {
      return { message: 'success' }
    }
    return { message: 'failed request' }
  }
  return { message: 'String empty' }
}
