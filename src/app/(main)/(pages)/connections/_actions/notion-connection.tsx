'use server'

import { Client } from '@notionhq/client'

// Storage key for localStorage (client-side only)
const NOTION_STORAGE_KEY = 'flowlab_notion_connection'

// Test Notion connection using the API secret from env
export const testNotionConnection = async (): Promise<{
  success: boolean
  message: string
  data?: {
    user?: string
    workspace?: string
    botId?: string
  }
}> => {
  const notionSecret = process.env.NOTION_API_SECRET

  if (!notionSecret) {
    return {
      success: false,
      message: 'NOTION_API_SECRET not configured in .env file',
    }
  }

  try {
    const notion = new Client({ auth: notionSecret })

    // Test the connection by getting the current user (bot info)
    const response = await notion.users.me({})

    return {
      success: true,
      message: 'Successfully connected to Notion!',
      data: {
        user: response.name || 'Notion Bot',
        botId: response.id,
        workspace: response.type === 'bot' ? (response as any).bot?.workspace_name : 'Connected',
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Notion'
    console.error('Notion connection test failed:', error)
    return {
      success: false,
      message: errorMessage,
    }
  }
}

// Get list of databases the bot has access to
export const listNotionDatabases = async (): Promise<{
  success: boolean
  databases: Array<{ id: string; title: string }>
  message?: string
}> => {
  const notionSecret = process.env.NOTION_API_SECRET

  if (!notionSecret) {
    return {
      success: false,
      databases: [],
      message: 'NOTION_API_SECRET not configured',
    }
  }

  try {
    const notion = new Client({ auth: notionSecret })

    const response = await notion.search({
      filter: { property: 'object', value: 'database' },
      page_size: 50,
    })

    const databases = response.results
      .filter((result): result is any => result.object === 'database')
      .map((db) => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled Database',
      }))

    return {
      success: true,
      databases,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to list databases'
    return {
      success: false,
      databases: [],
      message: errorMessage,
    }
  }
}

// Store connection in memory/localStorage (called from client after OAuth)
export const onNotionConnect = async (
  access_token: string,
  workspace_id: string,
  workspace_icon: string,
  workspace_name: string,
  database_id: string,
  id: string
) => {
  return { success: true }
}

// Get stored connection (uses env API key for now)
export const getNotionConnection = async (): Promise<{
  accessToken: string
  databaseId: string
  workspaceName: string
} | null> => {
  const notionSecret = process.env.NOTION_API_SECRET

  if (!notionSecret) {
    return null
  }

  // Return the env-configured connection
  return {
    accessToken: notionSecret,
    databaseId: '', // Will be selected by user
    workspaceName: 'FlowLab Workspace',
  }
}

// Get database details
export const getNotionDatabase = async (
  databaseId: string,
  accessToken?: string
) => {
  const token = accessToken || process.env.NOTION_API_SECRET

  if (!token) {
    throw new Error('No Notion access token')
  }

  const notion = new Client({ auth: token })
  const response = await notion.databases.retrieve({ database_id: databaseId })
  return response
}

// Create a new page in a database
export const onCreateNewPageInDatabase = async (
  databaseId: string,
  accessToken: string | undefined,
  content: string
) => {
  const token = accessToken || process.env.NOTION_API_SECRET

  if (!token) {
    throw new Error('No Notion access token')
  }

  const notion = new Client({ auth: token })

  // First get the database to understand its properties
  const database = await notion.databases.retrieve({ database_id: databaseId })

  // Find the title property
  const titleProperty = Object.entries(database.properties).find(
    ([, value]) => value.type === 'title'
  )

  if (!titleProperty) {
    throw new Error('Database has no title property')
  }

  const response = await notion.pages.create({
    parent: {
      type: 'database_id',
      database_id: databaseId,
    },
    properties: {
      [titleProperty[0]]: {
        title: [
          {
            text: {
              content: content,
            },
          },
        ],
      },
    },
  })

  return response
}
