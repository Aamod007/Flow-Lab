'use server'

import { Option } from '@/components/ui/multiple-selector'
import axios from 'axios'

// Mock Slack connection for demo mode - no database required

export const onSlackConnect = async (
  app_id: string,
  authed_user_id: string,
  authed_user_token: string,
  slack_access_token: string,
  bot_user_id: string,
  team_id: string,
  team_name: string,
  user_id: string
): Promise<void> => {
  // Mock connection - just log and return
  console.log('Slack connection requested for team:', team_name)
}

export const getSlackConnection = async (): Promise<{
  appId: string
  authedUserId: string
  authedUserToken: string
  slackAccessToken: string
  botUserId: string
  teamId: string
  teamName: string
  userId: string
} | null> => {
  // Return null for demo - no database required
  return null
}

export async function listBotChannels(
  slackAccessToken: string
): Promise<Option[]> {
  const url = `https://slack.com/api/conversations.list?${new URLSearchParams({
    types: 'public_channel,private_channel',
    limit: '200',
  })}`

  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${slackAccessToken}` },
    })

    console.log(data)

    if (!data.ok) throw new Error(data.error)

    if (!data?.channels?.length) return []

    return data.channels
      .filter((ch: any) => ch.is_member)
      .map((ch: any) => {
        return { label: ch.name, value: ch.id }
      })
  } catch (error: any) {
    console.error('Error listing bot channels:', error.message)
    throw error
  }
}

const postMessageInSlackChannel = async (
  slackAccessToken: string,
  slackChannel: string,
  content: string
): Promise<void> => {
  try {
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      { channel: slackChannel, text: content },
      {
        headers: {
          Authorization: `Bearer ${slackAccessToken}`,
          'Content-Type': 'application/json;charset=utf-8',
        },
      }
    )
    console.log(`Message posted successfully to channel ID: ${slackChannel}`)
  } catch (error: any) {
    console.error(
      `Error posting message to Slack channel ${slackChannel}:`,
      error?.response?.data || error.message
    )
  }
}

// Wrapper function to post messages to multiple Slack channels
export const postMessageToSlack = async (
  slackAccessToken: string,
  selectedSlackChannels: Option[],
  content: string
): Promise<{ message: string }> => {
  if (!content) return { message: 'Content is empty' }
  if (!selectedSlackChannels?.length) return { message: 'Channel not selected' }

  try {
    selectedSlackChannels
      .map((channel) => channel?.value)
      .forEach((channel) => {
        postMessageInSlackChannel(slackAccessToken, channel, content)
      })
  } catch (error) {
    return { message: 'Message could not be sent to Slack' }
  }

  return { message: 'Success' }
}
