// Client-side workflow storage utilities

// Type definitions
export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface WorkflowData {
  id: string;
  name: string;
  description: string;
  publish: boolean;
  userId: string;
  createdAt?: string;
}

export interface WorkflowNodesEdgesData {
  nodes: string;
  edges: string;
  flowPath?: string;
  updatedAt?: string;
}

// Validation functions
function isWorkflowData(data: unknown): data is WorkflowData {
  if (typeof data !== 'object' || data === null) return false;
  
  const workflow = data as Record<string, unknown>;
  return (
    typeof workflow.id === 'string' &&
    typeof workflow.name === 'string' &&
    typeof workflow.description === 'string' &&
    typeof workflow.publish === 'boolean' &&
    typeof workflow.userId === 'string'
  );
}

function isWorkflowDataArray(data: unknown): data is WorkflowData[] {
  return Array.isArray(data) && data.every(isWorkflowData);
}

function isWorkflowNodesEdgesData(data: unknown): data is WorkflowNodesEdgesData {
  if (typeof data !== 'object' || data === null) return false;
  
  const nodesEdges = data as Record<string, unknown>;
  return (
    typeof nodesEdges.nodes === 'string' &&
    typeof nodesEdges.edges === 'string'
  );
}

export const getWorkflowsFromStorage = (): WorkflowData[] => {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem('flowlab_workflows');
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isWorkflowDataArray(parsed)) {
        return parsed;
      }
      console.error('Invalid workflow data structure in storage');
      return [];
    } catch (error) {
      console.error('Failed to parse workflow data:', error);
      return [];
    }
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
  ];
}

export const saveWorkflowToStorage = (
  name: string,
  description: string,
  initialNodes?: string,
  initialEdges?: string
): WorkflowData | null => {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('flowlab_workflows');
  let workflows: WorkflowData[] = [];
  
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isWorkflowDataArray(parsed)) {
        workflows = parsed;
      } else {
        console.error('Invalid workflow data structure in storage');
      }
    } catch (error) {
      console.error('Failed to parse workflow data:', error);
    }
  }

  const newWorkflow: WorkflowData = {
    id: `workflow-${Date.now()}`,
    name,
    description,
    publish: false,
    userId: 'demo-user-123',
    createdAt: new Date().toISOString(),
  };

  workflows.push(newWorkflow);
  localStorage.setItem('flowlab_workflows', JSON.stringify(workflows));

  // If initial content is provided (e.g. from a template), save it immediately
  if (initialNodes && initialEdges) {
    saveWorkflowNodesEdges(newWorkflow.id, initialNodes, initialEdges);
  }

  return newWorkflow;
}

export const getWorkflowNodesEdges = (flowId: string): WorkflowNodesEdgesData => {
  if (typeof window === 'undefined') {
    return { nodes: '[]', edges: '[]' };
  }

  const stored = localStorage.getItem(`workflow_${flowId}`);
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isWorkflowNodesEdgesData(parsed)) {
        return parsed;
      }
      console.error('Invalid workflow nodes/edges data structure');
    } catch (error) {
      console.error('Failed to parse workflow nodes/edges:', error);
    }
  }

  return {
    nodes: '[]',
    edges: '[]',
  };
}

export const saveWorkflowNodesEdges = (
  flowId: string,
  nodes: string,
  edges: string,
  flowPath?: string
): boolean => {
  if (typeof window === 'undefined') return false;

  const data: WorkflowNodesEdgesData = {
    nodes,
    edges,
    flowPath: flowPath || '[]',
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`workflow_${flowId}`, JSON.stringify(data));
  return true;
}

export const updateWorkflowPublish = (workflowId: string, publish: boolean): boolean => {
  if (typeof window === 'undefined') return false;

  const stored = localStorage.getItem('flowlab_workflows');
  if (!stored) return false;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isWorkflowDataArray(parsed)) {
      console.error('Invalid workflow data structure in storage');
      return false;
    }

    const workflows = parsed;
    const updatedWorkflows = workflows.map((w: WorkflowData) =>
      w.id === workflowId ? { ...w, publish } : w
    );

    localStorage.setItem('flowlab_workflows', JSON.stringify(updatedWorkflows));
    return true;
  } catch (error) {
    console.error('Failed to update workflow publish status:', error);
    return false;
  }
}
