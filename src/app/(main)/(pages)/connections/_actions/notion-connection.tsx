'use server'

import { Client } from '@notionhq/client'

// Mock Notion connection for demo mode - no database required

export const onNotionConnect = async (
  access_token: string,
  workspace_id: string,
  workspace_icon: string,
  workspace_name: string,
  database_id: string,
  id: string
) => {
  // Mock connection - just log and return success
  console.log('Notion connection requested for:', workspace_name)
  return { success: true }
}

export const getNotionConnection = async (): Promise<{
  accessToken: string
  databaseId: string
  workspaceName: string
} | null> => {
  // Return null for demo - no database required
  return null
}

export const getNotionDatabase = async (
  databaseId: string,
  accessToken: string
) => {
  const notion = new Client({
    auth: accessToken,
  })
  const response = await notion.databases.retrieve({ database_id: databaseId })
  return response
}

export const onCreateNewPageInDatabase = async (
  databaseId: string,
  accessToken: string,
  content: string
) => {
  const notion = new Client({
    auth: accessToken,
  })

  console.log(databaseId)
  const response = await notion.pages.create({
    parent: {
      type: 'database_id',
      database_id: databaseId,
    },
    properties: {
      name: [
        {
          text: {
            content: content,
          },
        },
      ],
    },
  })
  if (response) {
    return response
  }
}
