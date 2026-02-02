// Client-side workflow storage utilities
export const getWorkflowsFromStorage = () => {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem('flowlab_workflows')
  if (stored) {
    return JSON.parse(stored)
  }

  // Return some sample workflows for demo
  return [
    {
      id: 'demo-workflow-1',
      name: 'Sample Workflow',
      description: 'This is a sample workflow for demonstration',
      publish: false,
      userId: 'demo-user-123',
    }
  ]
}

export const saveWorkflowToStorage = (
  name: string,
  description: string,
  initialNodes?: string,
  initialEdges?: string
) => {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem('flowlab_workflows')
  const workflows = stored ? JSON.parse(stored) : []

  const newWorkflow = {
    id: `workflow-${Date.now()}`,
    name,
    description,
    publish: false,
    userId: 'demo-user-123',
    createdAt: new Date().toISOString(),
  }

  workflows.push(newWorkflow)
  localStorage.setItem('flowlab_workflows', JSON.stringify(workflows))

  // If initial content is provided (e.g. from a template), save it immediately
  if (initialNodes && initialEdges) {
    saveWorkflowNodesEdges(newWorkflow.id, initialNodes, initialEdges)
  }

  return newWorkflow
}

export const getWorkflowNodesEdges = (flowId: string) => {
  if (typeof window === 'undefined') {
    return { nodes: '[]', edges: '[]' }
  }

  const stored = localStorage.getItem(`workflow_${flowId}`)
  if (stored) {
    return JSON.parse(stored)
  }

  return {
    nodes: '[]',
    edges: '[]',
  }
}

export const saveWorkflowNodesEdges = (
  flowId: string,
  nodes: string,
  edges: string,
  flowPath?: string
) => {
  if (typeof window === 'undefined') return false

  const data = {
    nodes,
    edges,
    flowPath: flowPath || '[]',
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(`workflow_${flowId}`, JSON.stringify(data))
  return true
}

export const updateWorkflowPublish = (workflowId: string, publish: boolean) => {
  if (typeof window === 'undefined') return false

  const stored = localStorage.getItem('flowlab_workflows')
  if (!stored) return false

  const workflows = JSON.parse(stored)
  const updatedWorkflows = workflows.map((w: any) =>
    w.id === workflowId ? { ...w, publish } : w
  )

  localStorage.setItem('flowlab_workflows', JSON.stringify(updatedWorkflows))
  return true
}
