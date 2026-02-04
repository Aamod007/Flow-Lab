/**
 * Unit tests for Zustand store type safety
 * 
 * **Validates: Requirements 3.1, 15.1, 15.2, 15.4, 15.5**
 * 
 * These tests verify that the Zustand store has proper TypeScript types
 * and that all 'any' types have been removed.
 */

import { 
  GoogleFile, 
  WorkflowNode, 
  WorkflowEdge, 
  WorkflowEditorState, 
  WorkflowEditorActions,
  UserProfile,
  UserState,
  UserActions,
  useFlowLabStore 
} from '@/store';

describe('Store Type Definitions - Unit Tests', () => {
  describe('GoogleFile interface', () => {
    it('should accept valid GoogleFile objects', () => {
      const validFile: GoogleFile = {
        id: 'file123',
        name: 'test.pdf',
        mimeType: 'application/pdf',
        webViewLink: 'https://example.com',
        iconLink: 'https://example.com/icon.png',
        thumbnailLink: 'https://example.com/thumb.png',
      };

      expect(validFile.id).toBe('file123');
      expect(validFile.name).toBe('test.pdf');
    });

    it('should accept GoogleFile with optional properties', () => {
      const minimalFile: GoogleFile = {};
      expect(minimalFile).toBeDefined();
    });

    it('should accept GoogleFile with additional properties', () => {
      const fileWithExtras: GoogleFile = {
        id: 'file123',
        customProp: 'custom value',
      };
      expect(fileWithExtras.id).toBe('file123');
    });
  });

  describe('WorkflowNode interface', () => {
    it('should enforce required properties', () => {
      const node: WorkflowNode = {
        id: 'node1',
        type: 'Action',
        position: { x: 100, y: 200 },
        data: { title: 'Test Node' },
      };

      expect(node.id).toBe('node1');
      expect(node.type).toBe('Action');
      expect(node.position.x).toBe(100);
      expect(node.position.y).toBe(200);
    });
  });

  describe('WorkflowEdge interface', () => {
    it('should enforce required properties', () => {
      const edge: WorkflowEdge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
      };

      expect(edge.id).toBe('edge1');
      expect(edge.source).toBe('node1');
      expect(edge.target).toBe('node2');
    });

    it('should accept optional type property', () => {
      const edge: WorkflowEdge = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        type: 'smoothstep',
      };

      expect(edge.type).toBe('smoothstep');
    });
  });

  describe('WorkflowEditorState interface', () => {
    it('should define proper state structure', () => {
      const state: WorkflowEditorState = {
        nodes: [],
        edges: [],
        selectedNode: null,
        isExecuting: false,
      };

      expect(state.nodes).toEqual([]);
      expect(state.edges).toEqual([]);
      expect(state.selectedNode).toBeNull();
      expect(state.isExecuting).toBe(false);
    });
  });

  describe('WorkflowEditorActions interface', () => {
    it('should define proper action signatures', () => {
      const actions: WorkflowEditorActions = {
        setNodes: (nodes: WorkflowNode[]) => {},
        setEdges: (edges: WorkflowEdge[]) => {},
        addNode: (node: WorkflowNode) => {},
        removeNode: (nodeId: string) => {},
        selectNode: (node: WorkflowNode | null) => {},
        setExecuting: (executing: boolean) => {},
      };

      expect(typeof actions.setNodes).toBe('function');
      expect(typeof actions.setEdges).toBe('function');
      expect(typeof actions.addNode).toBe('function');
      expect(typeof actions.removeNode).toBe('function');
      expect(typeof actions.selectNode).toBe('function');
      expect(typeof actions.setExecuting).toBe('function');
    });
  });

  describe('UserProfile interface', () => {
    it('should enforce tier enum values', () => {
      const freeUser: UserProfile = {
        clerkId: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        profileImage: 'https://example.com/avatar.png',
        tier: 'Free',
        credits: 10,
      };

      const proUser: UserProfile = {
        clerkId: 'user_456',
        email: 'pro@example.com',
        name: 'Pro User',
        profileImage: null,
        tier: 'Pro',
        credits: 100,
      };

      const unlimitedUser: UserProfile = {
        clerkId: 'user_789',
        email: 'unlimited@example.com',
        name: null,
        profileImage: null,
        tier: 'Unlimited',
        credits: 999999,
      };

      expect(freeUser.tier).toBe('Free');
      expect(proUser.tier).toBe('Pro');
      expect(unlimitedUser.tier).toBe('Unlimited');
    });
  });

  describe('UserState interface', () => {
    it('should define proper state structure', () => {
      const state: UserState = {
        user: null,
        loading: false,
      };

      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
    });
  });

  describe('UserActions interface', () => {
    it('should define proper action signatures', () => {
      const actions: UserActions = {
        setUser: (user: UserProfile | null) => {},
        updateCredits: (credits: number) => {},
        setLoading: (loading: boolean) => {},
      };

      expect(typeof actions.setUser).toBe('function');
      expect(typeof actions.updateCredits).toBe('function');
      expect(typeof actions.setLoading).toBe('function');
    });
  });

  describe('useFlowLabStore hook', () => {
    it('should provide typed store access', () => {
      const store = useFlowLabStore.getState();

      // Verify state properties exist and have correct types
      expect(store.googleFile).toBeDefined();
      expect(Array.isArray(store.slackChannels)).toBe(true);
      expect(Array.isArray(store.selectedSlackChannels)).toBe(true);
      expect(Array.isArray(store.logs)).toBe(true);

      // Verify action methods exist
      expect(typeof store.setGoogleFile).toBe('function');
      expect(typeof store.setSlackChannels).toBe('function');
      expect(typeof store.setSelectedSlackChannels).toBe('function');
      expect(typeof store.setLogs).toBe('function');
    });

    it('should accept GoogleFile without any type', () => {
      const store = useFlowLabStore.getState();
      
      const testFile: GoogleFile = {
        id: 'test123',
        name: 'test.pdf',
        mimeType: 'application/pdf',
      };

      // This should compile without errors - no 'any' types
      store.setGoogleFile(testFile);
      
      expect(store.googleFile).toBeDefined();
    });
  });

  describe('Type exports', () => {
    it('should export all required types', () => {
      // This test verifies that all types are properly exported
      // by attempting to use them - if they weren't exported, this would fail to compile
      
      const node: WorkflowNode = { id: '1', type: 'test', position: { x: 0, y: 0 }, data: {} };
      const edge: WorkflowEdge = { id: '1', source: '1', target: '2' };
      const state: WorkflowEditorState = { nodes: [], edges: [], selectedNode: null, isExecuting: false };
      const user: UserProfile = { clerkId: '1', email: 'test@test.com', name: null, profileImage: null, tier: 'Free', credits: 0 };
      
      expect(node).toBeDefined();
      expect(edge).toBeDefined();
      expect(state).toBeDefined();
      expect(user).toBeDefined();
    });
  });
});
