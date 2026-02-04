/**
 * @jest-environment jsdom
 */

import {
  getWorkflowsFromStorage,
  saveWorkflowToStorage,
  getWorkflowNodesEdges,
  saveWorkflowNodesEdges,
  updateWorkflowPublish,
  WorkflowData,
  WorkflowNodesEdgesData,
} from '@/lib/workflow-storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('workflow-storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    // Suppress console.error for expected validation errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getWorkflowsFromStorage', () => {
    it('should return empty array when no workflows are stored', () => {
      localStorageMock.clear();
      const workflows = getWorkflowsFromStorage();
      expect(Array.isArray(workflows)).toBe(true);
    });

    it('should return valid workflow data from storage', () => {
      const validWorkflows: WorkflowData[] = [
        {
          id: 'workflow-1',
          name: 'Test Workflow',
          description: 'Test Description',
          publish: false,
          userId: 'user-123',
        },
      ];
      localStorageMock.setItem('flowlab_workflows', JSON.stringify(validWorkflows));

      const workflows = getWorkflowsFromStorage();
      expect(workflows).toEqual(validWorkflows);
    });

    it('should return empty array when stored data is invalid JSON', () => {
      localStorageMock.setItem('flowlab_workflows', 'invalid json{');
      
      const workflows = getWorkflowsFromStorage();
      expect(workflows).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to parse workflow data:', expect.any(Error));
    });

    it('should return empty array when stored data has invalid structure', () => {
      const invalidData = [
        {
          id: 'workflow-1',
          name: 'Test',
          // missing required fields
        },
      ];
      localStorageMock.setItem('flowlab_workflows', JSON.stringify(invalidData));

      const workflows = getWorkflowsFromStorage();
      expect(workflows).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Invalid workflow data structure in storage');
    });

    it('should validate all required fields in workflow data', () => {
      const invalidWorkflows = [
        {
          id: 123, // should be string
          name: 'Test',
          description: 'Test',
          publish: false,
          userId: 'user-123',
        },
      ];
      localStorageMock.setItem('flowlab_workflows', JSON.stringify(invalidWorkflows));

      const workflows = getWorkflowsFromStorage();
      expect(workflows).toEqual([]);
    });
  });

  describe('saveWorkflowToStorage', () => {
    it('should save a new workflow with proper type structure', () => {
      const workflow = saveWorkflowToStorage('Test Workflow', 'Test Description');

      expect(workflow).not.toBeNull();
      expect(workflow?.name).toBe('Test Workflow');
      expect(workflow?.description).toBe('Test Description');
      expect(workflow?.publish).toBe(false);
      expect(workflow?.userId).toBe('demo-user-123');
      expect(workflow?.id).toMatch(/^workflow-\d+$/);
      expect(workflow?.createdAt).toBeDefined();
    });

    it('should append to existing workflows', () => {
      const existingWorkflows: WorkflowData[] = [
        {
          id: 'workflow-1',
          name: 'Existing',
          description: 'Existing',
          publish: false,
          userId: 'user-123',
        },
      ];
      localStorageMock.setItem('flowlab_workflows', JSON.stringify(existingWorkflows));

      saveWorkflowToStorage('New Workflow', 'New Description');

      const stored = localStorageMock.getItem('flowlab_workflows');
      const workflows = JSON.parse(stored!);
      expect(workflows).toHaveLength(2);
      expect(workflows[0].name).toBe('Existing');
      expect(workflows[1].name).toBe('New Workflow');
    });

    it('should handle invalid existing data gracefully', () => {
      localStorageMock.setItem('flowlab_workflows', 'invalid json');

      const workflow = saveWorkflowToStorage('Test', 'Test');

      expect(workflow).not.toBeNull();
      const stored = localStorageMock.getItem('flowlab_workflows');
      const workflows = JSON.parse(stored!);
      expect(workflows).toHaveLength(1);
    });

    it('should save initial nodes and edges when provided', () => {
      const workflow = saveWorkflowToStorage(
        'Test',
        'Test',
        '[{"id":"1"}]',
        '[{"id":"e1"}]'
      );

      expect(workflow).not.toBeNull();
      const nodesEdges = localStorageMock.getItem(`workflow_${workflow!.id}`);
      expect(nodesEdges).toBeDefined();
      const parsed = JSON.parse(nodesEdges!);
      expect(parsed.nodes).toBe('[{"id":"1"}]');
      expect(parsed.edges).toBe('[{"id":"e1"}]');
    });
  });

  describe('getWorkflowNodesEdges', () => {
    it('should return default empty nodes and edges when not found', () => {
      const result = getWorkflowNodesEdges('nonexistent-id');

      expect(result).toEqual({
        nodes: '[]',
        edges: '[]',
      });
    });

    it('should return stored nodes and edges data', () => {
      const data: WorkflowNodesEdgesData = {
        nodes: '[{"id":"1"}]',
        edges: '[{"id":"e1"}]',
        flowPath: '[]',
        updatedAt: new Date().toISOString(),
      };
      localStorageMock.setItem('workflow_test-id', JSON.stringify(data));

      const result = getWorkflowNodesEdges('test-id');

      expect(result).toEqual(data);
    });

    it('should return default when stored data is invalid JSON', () => {
      localStorageMock.setItem('workflow_test-id', 'invalid json');

      const result = getWorkflowNodesEdges('test-id');

      expect(result).toEqual({
        nodes: '[]',
        edges: '[]',
      });
      expect(console.error).toHaveBeenCalledWith('Failed to parse workflow nodes/edges:', expect.any(Error));
    });

    it('should return default when stored data has invalid structure', () => {
      const invalidData = {
        nodes: 123, // should be string
        edges: '[{"id":"e1"}]',
      };
      localStorageMock.setItem('workflow_test-id', JSON.stringify(invalidData));

      const result = getWorkflowNodesEdges('test-id');

      expect(result).toEqual({
        nodes: '[]',
        edges: '[]',
      });
      expect(console.error).toHaveBeenCalledWith('Invalid workflow nodes/edges data structure');
    });
  });

  describe('saveWorkflowNodesEdges', () => {
    it('should save nodes and edges with proper type structure', () => {
      const result = saveWorkflowNodesEdges(
        'test-id',
        '[{"id":"1"}]',
        '[{"id":"e1"}]'
      );

      expect(result).toBe(true);
      const stored = localStorageMock.getItem('workflow_test-id');
      const data = JSON.parse(stored!);
      expect(data.nodes).toBe('[{"id":"1"}]');
      expect(data.edges).toBe('[{"id":"e1"}]');
      expect(data.flowPath).toBe('[]');
      expect(data.updatedAt).toBeDefined();
    });

    it('should save with custom flowPath', () => {
      const result = saveWorkflowNodesEdges(
        'test-id',
        '[{"id":"1"}]',
        '[{"id":"e1"}]',
        '[{"step":1}]'
      );

      expect(result).toBe(true);
      const stored = localStorageMock.getItem('workflow_test-id');
      const data = JSON.parse(stored!);
      expect(data.flowPath).toBe('[{"step":1}]');
    });
  });

  describe('updateWorkflowPublish', () => {
    it('should update publish status of existing workflow', () => {
      const workflows: WorkflowData[] = [
        {
          id: 'workflow-1',
          name: 'Test',
          description: 'Test',
          publish: false,
          userId: 'user-123',
        },
      ];
      localStorageMock.setItem('flowlab_workflows', JSON.stringify(workflows));

      const result = updateWorkflowPublish('workflow-1', true);

      expect(result).toBe(true);
      const stored = localStorageMock.getItem('flowlab_workflows');
      const updated = JSON.parse(stored!);
      expect(updated[0].publish).toBe(true);
    });

    it('should return false when no workflows are stored', () => {
      const result = updateWorkflowPublish('workflow-1', true);

      expect(result).toBe(false);
    });

    it('should handle invalid stored data gracefully', () => {
      localStorageMock.setItem('flowlab_workflows', 'invalid json');

      const result = updateWorkflowPublish('workflow-1', true);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to update workflow publish status:', expect.any(Error));
    });

    it('should return false when stored data has invalid structure', () => {
      const invalidData = [{ id: 123 }]; // invalid structure
      localStorageMock.setItem('flowlab_workflows', JSON.stringify(invalidData));

      const result = updateWorkflowPublish('workflow-1', true);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Invalid workflow data structure in storage');
    });

    it('should not modify other workflows', () => {
      const workflows: WorkflowData[] = [
        {
          id: 'workflow-1',
          name: 'Test 1',
          description: 'Test 1',
          publish: false,
          userId: 'user-123',
        },
        {
          id: 'workflow-2',
          name: 'Test 2',
          description: 'Test 2',
          publish: false,
          userId: 'user-123',
        },
      ];
      localStorageMock.setItem('flowlab_workflows', JSON.stringify(workflows));

      updateWorkflowPublish('workflow-1', true);

      const stored = localStorageMock.getItem('flowlab_workflows');
      const updated = JSON.parse(stored!);
      expect(updated[0].publish).toBe(true);
      expect(updated[1].publish).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should export proper TypeScript interfaces', () => {
      // This test verifies that the types are properly exported and can be used
      const workflow: WorkflowData = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        publish: false,
        userId: 'user-123',
      };

      const nodesEdges: WorkflowNodesEdgesData = {
        nodes: '[]',
        edges: '[]',
      };

      expect(workflow).toBeDefined();
      expect(nodesEdges).toBeDefined();
    });
  });
});
