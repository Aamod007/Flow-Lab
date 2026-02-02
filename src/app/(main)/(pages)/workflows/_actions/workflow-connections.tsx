'use server'
import { Option } from '@/components/ui/multiple-selector'

// Local storage keys - these actions run on server, but we'll use a mock in-memory store
// For demo purposes, we'll return mock data since server actions can't access localStorage

// Mock workflow store for demo purposes (in production, this would be database calls)
const MOCK_WORKFLOWS: Record<string, any> = {
  'demo-workflow-1': {
    id: 'demo-workflow-1',
    name: 'Demo Workflow',
    description: 'A demo workflow for testing',
    nodes: '[]',
    edges: '[]',
    publish: false,
    discordTemplate: '',
    slackTemplate: '',
    slackAccessToken: '',
    slackChannels: [],
    notionTemplate: '',
    notionAccessToken: '',
    notionDbId: '',
  }
}

export const getGoogleListener = async (): Promise<{
  googleResourceId: string | null
} | null> => {
  // Return null for demo - no database required for this
  return null
}

export const onFlowPublish = async (workflowId: string, state: boolean) => {
  console.log('Publishing workflow:', workflowId, 'State:', state)

  // Mock publish toggle
  if (MOCK_WORKFLOWS[workflowId]) {
    MOCK_WORKFLOWS[workflowId].publish = state
    return state ? 'Workflow published' : 'Workflow unpublished'
  }

  // For any workflow, just return success
  return state ? 'Workflow published' : 'Workflow unpublished'
}

export const onCreateNodeTemplate = async (
  content: string,
  type: string,
  workflowId: string,
  channels?: Option[],
  accessToken?: string,
  notionDbId?: string
) => {
  console.log('Creating node template:', { type, workflowId, content: content.substring(0, 50) })

  // Mock template creation
  const workflow = MOCK_WORKFLOWS[workflowId] || {}

  if (type === 'Discord') {
    workflow.discordTemplate = content
    MOCK_WORKFLOWS[workflowId] = workflow
    return 'Discord template saved'
  }

  if (type === 'Slack') {
    workflow.slackTemplate = content
    workflow.slackAccessToken = accessToken || ''
    if (channels && channels.length > 0) {
      workflow.slackChannels = [...(workflow.slackChannels || []), ...channels.map(c => c.value)]
    }
    MOCK_WORKFLOWS[workflowId] = workflow
    return 'Slack template saved'
  }

  if (type === 'Notion') {
    workflow.notionTemplate = content
    workflow.notionAccessToken = accessToken || ''
    workflow.notionDbId = notionDbId || ''
    MOCK_WORKFLOWS[workflowId] = workflow
    return 'Notion template saved'
  }

  return 'Template saved'
}

export const onGetWorkflows = async () => {
  // Return mock workflows list
  return Object.values(MOCK_WORKFLOWS).map(w => ({
    id: w.id,
    name: w.name,
    description: w.description,
    publish: w.publish,
  }))
}

export const onCreateWorkflow = async (name: string, description: string) => {
  const id = `workflow-${Date.now()}`
  MOCK_WORKFLOWS[id] = {
    id,
    name,
    description,
    nodes: '[]',
    edges: '[]',
    publish: false,
    discordTemplate: '',
    slackTemplate: '',
    slackAccessToken: '',
    slackChannels: [],
    notionTemplate: '',
    notionAccessToken: '',
    notionDbId: '',
  }
  return { message: 'workflow created', id }
}

export const onGetNodesEdges = async (flowId: string) => {
  try {
    if (!flowId) {
      console.error('onGetNodesEdges: No flowId provided')
      return { nodes: '[]', edges: '[]', error: 'No workflow ID provided' }
    }

    console.log('Loading workflow:', flowId)

    // Return mock data - in real app this would come from database
    const workflow = MOCK_WORKFLOWS[flowId]

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
  } catch (error: any) {
    console.error('Error fetching workflow nodes/edges:', error)
    return {
      nodes: '[]',
      edges: '[]',
      error: error?.message || 'Failed to load workflow'
    }
  }
}

export const onSaveWorkflow = async (
  workflowId: string,
  nodes: string,
  edges: string
) => {
  try {
    console.log('Saving workflow:', workflowId)

    // Update mock store
    if (!MOCK_WORKFLOWS[workflowId]) {
      MOCK_WORKFLOWS[workflowId] = {
        id: workflowId,
        name: 'Workflow',
        description: '',
        publish: false,
      }
    }

    MOCK_WORKFLOWS[workflowId].nodes = nodes
    MOCK_WORKFLOWS[workflowId].edges = edges

    return { success: true, message: 'Workflow saved' }
  } catch (error: any) {
    console.error('Error saving workflow:', error)
    return { success: false, error: error?.message || 'Failed to save workflow' }
  }
}
