'use server'

import { Option } from '@/components/ui/multiple-selector'
import axios from 'axios'

// Test Slack connection using the bot token from env
export const testSlackConnection = async (): Promise<{
  success: boolean
  message: string
  data?: {
    teamName?: string
    botName?: string
    botId?: string
    channels?: number
  }
}> => {
  const slackBotToken = process.env.SLACK_BOT_TOKEN

  if (!slackBotToken) {
    return {
      success: false,
      message: 'SLACK_BOT_TOKEN not configured in .env file',
    }
  }

  try {
    // Test auth
    const authResponse = await axios.get('https://slack.com/api/auth.test', {
      headers: { Authorization: `Bearer ${slackBotToken}` },
    })

    if (!authResponse.data.ok) {
      throw new Error(authResponse.data.error || 'Auth test failed')
    }

    // Get bot info
    const botInfo = authResponse.data

    // Get channel count
    const channelsResponse = await axios.get(
      'https://slack.com/api/conversations.list',
      {
        headers: { Authorization: `Bearer ${slackBotToken}` },
        params: { types: 'public_channel,private_channel', limit: 100 },
      }
    )

    const channelCount = channelsResponse.data.ok
      ? channelsResponse.data.channels?.length || 0
      : 0

    return {
      success: true,
      message: 'Successfully connected to Slack!',
      data: {
        teamName: botInfo.team,
        botName: botInfo.user,
        botId: botInfo.user_id,
        channels: channelCount,
      },
    }
  } catch (error: any) {
    console.error('Slack connection test failed:', error)
    return {
      success: false,
      message: error.response?.data?.error || error.message || 'Failed to connect to Slack',
    }
  }
}

// Get Slack channels using env bot token
export const listSlackChannels = async (): Promise<{
  success: boolean
  channels: Option[]
  message?: string
}> => {
  const slackBotToken = process.env.SLACK_BOT_TOKEN

  if (!slackBotToken) {
    return {
      success: false,
      channels: [],
      message: 'SLACK_BOT_TOKEN not configured',
    }
  }

  try {
    const { data } = await axios.get('https://slack.com/api/conversations.list', {
      headers: { Authorization: `Bearer ${slackBotToken}` },
      params: {
        types: 'public_channel,private_channel',
        limit: 200,
      },
    })

    if (!data.ok) {
      throw new Error(data.error)
    }

    const channels = (data.channels || []).map((ch: any) => ({
      label: `#${ch.name}`,
      value: ch.id,
    }))

    return {
      success: true,
      channels,
    }
  } catch (error: any) {
    return {
      success: false,
      channels: [],
      message: error.message || 'Failed to list channels',
    }
  }
}

// Send a test message to a Slack channel
export const sendTestSlackMessage = async (
  channelId: string,
  message?: string
): Promise<{ success: boolean; message: string }> => {
  const slackBotToken = process.env.SLACK_BOT_TOKEN

  if (!slackBotToken) {
    return {
      success: false,
      message: 'SLACK_BOT_TOKEN not configured',
    }
  }

  try {
    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: channelId,
        text: message || '🚀 *FlowLab Connection Test*\n\nYour Slack integration is working correctly!',
        mrkdwn: true,
      },
      {
        headers: {
          Authorization: `Bearer ${slackBotToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.data.ok) {
      throw new Error(response.data.error)
    }

    return {
      success: true,
      message: 'Test message sent successfully!',
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.error || error.message || 'Failed to send message',
    }
  }
}

// Store connection (called after OAuth)
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
  console.log('Slack connection stored for team:', team_name)
}

// Get stored connection (uses env tokens for now)
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
  const slackBotToken = process.env.SLACK_BOT_TOKEN

  if (!slackBotToken) {
    return null
  }

  // Return the env-configured connection
  return {
    appId: process.env.SLACK_CLIENT_ID || '',
    authedUserId: '',
    authedUserToken: '',
    slackAccessToken: slackBotToken,
    botUserId: '',
    teamId: '',
    teamName: 'FlowLab Workspace',
    userId: '',
  }
}

// List channels for a given token (for workflow execution)
export async function listBotChannels(
  slackAccessToken?: string
): Promise<Option[]> {
  const token = slackAccessToken || process.env.SLACK_BOT_TOKEN

  if (!token) {
    return []
  }

  const url = `https://slack.com/api/conversations.list?${new URLSearchParams({
    types: 'public_channel,private_channel',
    limit: '200',
  })}`

  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!data.ok) throw new Error(data.error)

    if (!data?.channels?.length) return []

    return data.channels
      .filter((ch: any) => ch.is_member)
      .map((ch: any) => ({
        label: ch.name,
        value: ch.id,
      }))
  } catch (error: any) {
    console.warn('Error listing bot channels:', error.message)
    return []
  }
}

// Post message to Slack channels
export const postMessageToSlack = async (
  slackAccessToken: string | undefined,
  selectedSlackChannels: Option[],
  content: string
): Promise<{ message: string }> => {
  const token = slackAccessToken || process.env.SLACK_BOT_TOKEN

  if (!token) {
    return { message: 'No Slack token configured' }
  }

  if (!content) return { message: 'Content is empty' }
  if (!selectedSlackChannels?.length) return { message: 'Channel not selected' }

  try {
    for (const channel of selectedSlackChannels) {
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        { channel: channel.value, text: content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json;charset=utf-8',
          },
        }
      )
    }
    return { message: 'Success' }
  } catch (error) {
    return { message: 'Message could not be sent to Slack' }
  }
}
