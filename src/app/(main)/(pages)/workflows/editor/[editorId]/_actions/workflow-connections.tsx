'use server'

// Mock workflow store for demo purposes (shared state would be in a real database)
// This is a simple in-memory store that persists during the server session
const MOCK_WORKFLOWS: Record<string, any> = {
  'demo-workflow-1': {
    id: 'demo-workflow-1',
    name: 'Demo Workflow',
    description: 'A demo workflow for testing',
    nodes: '[]',
    edges: '[]',
    flowPath: '',
    publish: false,
  }
}

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
  try {
    // Validate inputs
    if (!flowId) {
      return { success: false, message: 'Workflow ID is required' }
    }

    // Validate JSON format
    try {
      JSON.parse(nodes)
      JSON.parse(edges)
    } catch {
      return { success: false, message: 'Invalid node or edge data format' }
    }

    console.log('Saving workflow:', flowId, 'Nodes count:', JSON.parse(nodes).length)

    // Create or update workflow in mock store
    if (!MOCK_WORKFLOWS[flowId]) {
      MOCK_WORKFLOWS[flowId] = {
        id: flowId,
        name: 'Workflow',
        description: '',
        publish: false,
      }
    }

    MOCK_WORKFLOWS[flowId].nodes = nodes
    MOCK_WORKFLOWS[flowId].edges = edges
    MOCK_WORKFLOWS[flowId].flowPath = flowPath

    return {
      success: true,
      message: 'flow saved',
      data: {
        id: flowId,
        nodes: nodes,
        edges: edges,
        flowPath: flowPath,
      }
    }
  } catch (error: any) {
    console.error('Error saving workflow:', error)
    return { success: false, message: `Failed to save workflow: ${error?.message || 'Unknown error'}` }
  }
}

export const onFlowPublish = async (
  workflowId: string,
  state: boolean
): Promise<PublishResponse> => {
  try {
    if (!workflowId) {
      return { success: false, message: 'Workflow ID is required' }
    }

    console.log('Publishing workflow:', workflowId, 'State:', state)

    // Get or create workflow
    if (!MOCK_WORKFLOWS[workflowId]) {
      MOCK_WORKFLOWS[workflowId] = {
        id: workflowId,
        name: 'Workflow',
        nodes: '[]',
        edges: '[]',
        publish: false,
      }
    }

    const workflow = MOCK_WORKFLOWS[workflowId]

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
    MOCK_WORKFLOWS[workflowId].publish = state

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
  } catch (error: any) {
    console.error('Error publishing workflow:', error)
    return { success: false, message: `Failed to publish workflow: ${error?.message || 'Unknown error'}` }
  }
}

// Get workflow status (for checking if published)
export const getWorkflowStatus = async (workflowId: string) => {
  try {
    const workflow = MOCK_WORKFLOWS[workflowId]

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
