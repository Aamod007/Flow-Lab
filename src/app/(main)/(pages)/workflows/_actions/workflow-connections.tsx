'use server'
import { Option } from '@/components/ui/multiple-selector'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'

export const getGoogleListener = async (): Promise<{
  googleResourceId: string | null
} | null> => {
  const { userId } = auth()
  if (!userId) return null

  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { googleResourceId: true }
    })
    return user ? { googleResourceId: user.googleResourceId } : null
  } catch (error) {
    console.error('Error fetching Google listener:', error)
    return null
  }
}

export const onFlowPublish = async (workflowId: string, state: boolean) => {
  const { userId } = auth()
  if (!userId) return 'User not authenticated'

  try {
    await db.workflows.update({
      where: { id: workflowId, userId: userId },
      data: { publish: state }
    })
    return state ? 'Workflow published' : 'Workflow unpublished'
  } catch (error) {
    console.error('Error publishing workflow:', error)
    return 'Failed to update workflow'
  }
}

export const onCreateNodeTemplate = async (
  content: string,
  type: string,
  workflowId: string,
  channels?: Option[],
  accessToken?: string,
  notionDbId?: string
) => {
  const { userId } = auth()
  if (!userId) return 'User not authenticated'

  try {
    if (type === 'Discord') {
      await db.workflows.update({
        where: { id: workflowId, userId: userId },
        data: { discordTemplate: content }
      })
      return 'Discord template saved'
    }

    if (type === 'Slack') {
      const slackChannels = channels?.map(c => c.value) || []
      await db.workflows.update({
        where: { id: workflowId, userId: userId },
        data: {
          slackTemplate: content,
          slackAccessToken: accessToken || undefined,
          slackChannels: slackChannels
        }
      })
      return 'Slack template saved'
    }

    if (type === 'Notion') {
      await db.workflows.update({
        where: { id: workflowId, userId: userId },
        data: {
          notionTemplate: content,
          notionAccessToken: accessToken || undefined,
          notionDbId: notionDbId || undefined
        }
      })
      return 'Notion template saved'
    }

    return 'Template saved'
  } catch (error) {
    console.error('Error saving template:', error)
    return 'Failed to save template'
  }
}

export const onGetWorkflows = async () => {
  const { userId } = auth()
  if (!userId) return []

  try {
    const workflows = await db.workflows.findMany({
      where: { userId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        publish: true,
      },
      orderBy: { id: 'desc' }
    })
    return workflows
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return []
  }
}

export const onCreateWorkflow = async (name: string, description: string) => {
  const { userId } = auth()
  if (!userId) return { message: 'User not authenticated', id: null }

  try {
    const workflow = await db.workflows.create({
      data: {
        name,
        description,
        userId: userId,
        nodes: '[]',
        edges: '[]',
        publish: false,
      }
    })
    return { message: 'workflow created', id: workflow.id }
  } catch (error) {
    console.error('Error creating workflow:', error)
    return { message: 'Failed to create workflow', id: null }
  }
}

export const onGetNodesEdges = async (flowId: string) => {
  const { userId } = auth()
  
  try {
    if (!flowId) {
      console.error('onGetNodesEdges: No flowId provided')
      return { nodes: '[]', edges: '[]', error: 'No workflow ID provided' }
    }

    if (!userId) {
      return { nodes: '[]', edges: '[]', error: 'User not authenticated' }
    }

    const workflow = await db.workflows.findUnique({
      where: { id: flowId },
      select: {
        nodes: true,
        edges: true,
        publish: true,
        name: true,
      }
    })

    if (workflow) {
      return {
        nodes: workflow.nodes || '[]',
        edges: workflow.edges || '[]',
        publish: workflow.publish,
        name: workflow.name,
      }
    }

    // For new/unknown workflows, return empty state
    return {
      nodes: '[]',
      edges: '[]',
      publish: false,
      name: 'New Workflow',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load workflow'
    console.error('Error fetching workflow nodes/edges:', error)
    return {
      nodes: '[]',
      edges: '[]',
      error: errorMessage
    }
  }
}

export const onSaveWorkflow = async (
  workflowId: string,
  nodes: string,
  edges: string
) => {
  const { userId } = auth()
  
  try {
    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    await db.workflows.upsert({
      where: { id: workflowId },
      update: {
        nodes,
        edges,
      },
      create: {
        id: workflowId,
        name: 'Workflow',
        description: '',
        nodes,
        edges,
        userId: userId,
        publish: false,
      }
    })

    return { success: true, message: 'Workflow saved' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to save workflow'
    console.error('Error saving workflow:', error)
    return { success: false, error: errorMessage }
  }
}
