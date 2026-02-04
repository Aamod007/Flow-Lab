'use server'

import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'

// Type for workflow save response
type SaveResponse = {
  success: boolean
  message: string
  data?: {
    id: string
    nodes: string | null
    edges: string | null
    flowPath: string | null
  }
}

// Type for publish response
type PublishResponse = {
  success: boolean
  message: string
  published?: boolean
}

export const onCreateNodesEdges = async (
  flowId: string,
  nodes: string,
  edges: string,
  flowPath: string
): Promise<SaveResponse> => {
  const { userId } = auth()
  
  try {
    // Validate inputs
    if (!flowId) {
      return { success: false, message: 'Workflow ID is required' }
    }

    if (!userId) {
      return { success: false, message: 'User not authenticated' }
    }

    // Validate JSON format
    try {
      JSON.parse(nodes)
      JSON.parse(edges)
    } catch {
      return { success: false, message: 'Invalid node or edge data format' }
    }

    // Create or update workflow in database
    const workflow = await db.workflows.upsert({
      where: { id: flowId },
      update: {
        nodes,
        edges,
        flowPath,
      },
      create: {
        id: flowId,
        name: 'Workflow',
        description: '',
        nodes,
        edges,
        flowPath,
        userId: userId,
        publish: false,
      }
    })

    return {
      success: true,
      message: 'flow saved',
      data: {
        id: workflow.id,
        nodes: workflow.nodes,
        edges: workflow.edges,
        flowPath: workflow.flowPath,
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error saving workflow:', error)
    return { success: false, message: `Failed to save workflow: ${errorMessage}` }
  }
}

export const onFlowPublish = async (
  workflowId: string,
  state: boolean
): Promise<PublishResponse> => {
  const { userId } = auth()
  
  try {
    if (!workflowId) {
      return { success: false, message: 'Workflow ID is required' }
    }

    if (!userId) {
      return { success: false, message: 'User not authenticated' }
    }

    // Get workflow to validate
    const workflow = await db.workflows.findUnique({
      where: { id: workflowId }
    })

    if (!workflow) {
      return { success: false, message: 'Workflow not found' }
    }

    // Validate that workflow has content before publishing
    if (state) {
      const nodes = workflow.nodes ? JSON.parse(workflow.nodes) : []
      if (nodes.length === 0) {
        return {
          success: false,
          message: 'Cannot publish empty workflow - add at least one node first'
        }
      }
    }

    // Update publish state
    await db.workflows.update({
      where: { id: workflowId },
      data: { publish: state }
    })

    if (state) {
      return {
        success: true,
        message: 'Workflow published successfully!',
        published: true
      }
    }

    return {
      success: true,
      message: 'Workflow unpublished',
      published: false
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error publishing workflow:', error)
    return { success: false, message: `Failed to publish workflow: ${errorMessage}` }
  }
}

// Get workflow status (for checking if published)
export const getWorkflowStatus = async (workflowId: string) => {
  try {
    const workflow = await db.workflows.findUnique({
      where: { id: workflowId },
      select: {
        id: true,
        name: true,
        publish: true,
        nodes: true,
        edges: true,
      }
    })

    if (workflow) {
      return {
        id: workflow.id,
        name: workflow.name || 'Workflow',
        publish: workflow.publish || false,
        nodes: workflow.nodes || '[]',
        edges: workflow.edges || '[]',
      }
    }

    // Return default for unknown workflows
    return {
      id: workflowId,
      name: 'New Workflow',
      publish: false,
      nodes: '[]',
      edges: '[]',
    }
  } catch (error) {
    console.error('Error getting workflow status:', error)
    return null
  }
}
