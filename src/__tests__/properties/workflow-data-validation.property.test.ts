/**
 * @jest-environment jsdom
 */

/**
 * Property-Based Test: Workflow Data Validation
 * 
 * Feature: bug-fixes-and-deployment
 * Property 5: Workflow Data Validation
 * 
 * **Validates: Requirements 14.2**
 * 
 * This test verifies that for ANY workflow data parsed from storage,
 * the application should:
 * - Validate the data structure matches the expected WorkflowNode and WorkflowEdge interfaces
 * - Reject invalid workflow data
 * - Provide clear error messages for validation failures
 * - NOT attempt to process invalid workflow structures
 */

import fc from 'fast-check';
import {
  getWorkflowsFromStorage,
  getWorkflowNodesEdges,
  saveWorkflowToStorage,
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

describe('Property 5: Workflow Data Validation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    // Suppress console.error for expected validation errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('WorkflowData validation', () => {
    it('should reject invalid workflow data structures', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Missing required fields
            fc.record({
              id: fc.string(),
              name: fc.string(),
              // missing description, publish, userId
            }),
            // Wrong types
            fc.record({
              id: fc.integer(),
              name: fc.string(),
              description: fc.string(),
              publish: fc.boolean(),
              userId: fc.string(),
            }),
            // Null values for required fields
            fc.record({
              id: fc.constant(null),
              name: fc.string(),
              description: fc.string(),
              publish: fc.boolean(),
              userId: fc.string(),
            }),
            // Boolean instead of string
            fc.record({
              id: fc.string(),
              name: fc.boolean(),
              description: fc.string(),
              publish: fc.boolean(),
              userId: fc.string(),
            }),
            // String instead of boolean
            fc.record({
              id: fc.string(),
              name: fc.string(),
              description: fc.string(),
              publish: fc.string(),
              userId: fc.string(),
            }),
            // Empty object
            fc.constant({}),
            // Array instead of object
            fc.constant([]),
            // Primitive values
            fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.constant(null),
              fc.constant(undefined)
            )
          ),
          (invalidData) => {
            // Store invalid data
            localStorageMock.setItem('flowlab_workflows', JSON.stringify([invalidData]));

            // Attempt to retrieve workflows
            const workflows = getWorkflowsFromStorage();

            // Should reject invalid data and return empty array
            expect(workflows).toEqual([]);

            // Should log error message
            expect(console.error).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid workflow data structures', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 100 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            publish: fc.boolean(),
            userId: fc.string({ minLength: 1, maxLength: 100 }),
            createdAt: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined }),
          }),
          (validWorkflow) => {
            // Store valid data
            localStorageMock.setItem('flowlab_workflows', JSON.stringify([validWorkflow]));

            // Retrieve workflows
            const workflows = getWorkflowsFromStorage();

            // Should accept valid data
            expect(workflows).toHaveLength(1);
            expect(workflows[0]).toMatchObject({
              id: validWorkflow.id,
              name: validWorkflow.name,
              description: validWorkflow.description,
              publish: validWorkflow.publish,
              userId: validWorkflow.userId,
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate all required fields are present', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'id',
            'name',
            'description',
            'publish',
            'userId'
          ),
          (missingField) => {
            // Create workflow data with one field missing
            const workflowData: Record<string, unknown> = {
              id: 'test-id',
              name: 'Test Workflow',
              description: 'Test Description',
              publish: false,
              userId: 'user-123',
            };

            // Remove one required field
            delete workflowData[missingField];

            // Store incomplete data
            localStorageMock.setItem('flowlab_workflows', JSON.stringify([workflowData]));

            // Attempt to retrieve workflows
            const workflows = getWorkflowsFromStorage();

            // Should reject data with missing required fields
            expect(workflows).toEqual([]);
            expect(console.error).toHaveBeenCalledWith('Invalid workflow data structure in storage');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate field types are correct', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { field: 'id', wrongValue: 123 },
            { field: 'name', wrongValue: true },
            { field: 'description', wrongValue: [] },
            { field: 'publish', wrongValue: 'true' },
            { field: 'userId', wrongValue: null }
          ),
          (testCase) => {
            // Create workflow data with wrong type for one field
            const workflowData: Record<string, unknown> = {
              id: 'test-id',
              name: 'Test Workflow',
              description: 'Test Description',
              publish: false,
              userId: 'user-123',
            };

            // Set wrong type for the field
            workflowData[testCase.field] = testCase.wrongValue;

            // Store data with wrong type
            localStorageMock.setItem('flowlab_workflows', JSON.stringify([workflowData]));

            // Attempt to retrieve workflows
            const workflows = getWorkflowsFromStorage();

            // Should reject data with wrong types
            expect(workflows).toEqual([]);
            expect(console.error).toHaveBeenCalledWith('Invalid workflow data structure in storage');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('WorkflowNodesEdgesData validation', () => {
    it('should reject invalid workflow nodes/edges data structures', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(
            // Missing required fields
            fc.record({
              nodes: fc.string(),
              // missing edges
            }),
            // Wrong types
            fc.record({
              nodes: fc.integer(),
              edges: fc.string(),
            }),
            // Null values
            fc.record({
              nodes: fc.constant(null),
              edges: fc.string(),
            }),
            // Boolean instead of string
            fc.record({
              nodes: fc.string(),
              edges: fc.boolean(),
            }),
            // Empty object
            fc.constant({}),
            // Array instead of object
            fc.constant([]),
            // Primitive values
            fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.constant(null)
            )
          ),
          (flowId, invalidData) => {
            // Store invalid nodes/edges data
            localStorageMock.setItem(`workflow_${flowId}`, JSON.stringify(invalidData));

            // Attempt to retrieve nodes/edges
            const result = getWorkflowNodesEdges(flowId);

            // Should reject invalid data and return default
            expect(result).toEqual({
              nodes: '[]',
              edges: '[]',
            });

            // Should log error message
            expect(console.error).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid workflow nodes/edges data structures', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.record({
            nodes: fc.string({ minLength: 1, maxLength: 1000 }),
            edges: fc.string({ minLength: 1, maxLength: 1000 }),
            flowPath: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined }),
            updatedAt: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined }),
          }),
          (flowId, validData) => {
            // Store valid nodes/edges data
            localStorageMock.setItem(`workflow_${flowId}`, JSON.stringify(validData));

            // Retrieve nodes/edges
            const result = getWorkflowNodesEdges(flowId);

            // Should accept valid data
            expect(result.nodes).toBe(validData.nodes);
            expect(result.edges).toBe(validData.edges);
            if (validData.flowPath !== undefined) {
              expect(result.flowPath).toBe(validData.flowPath);
            }
            if (validData.updatedAt !== undefined) {
              expect(result.updatedAt).toBe(validData.updatedAt);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate nodes and edges are strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom(
            { field: 'nodes', wrongValue: 123 },
            { field: 'nodes', wrongValue: true },
            { field: 'nodes', wrongValue: [] },
            { field: 'nodes', wrongValue: {} },
            { field: 'edges', wrongValue: 456 },
            { field: 'edges', wrongValue: false },
            { field: 'edges', wrongValue: null }
          ),
          (flowId, testCase) => {
            // Create data with wrong type
            const data: Record<string, unknown> = {
              nodes: '[{"id":"1"}]',
              edges: '[{"id":"e1"}]',
            };

            // Set wrong type for the field
            data[testCase.field] = testCase.wrongValue;

            // Store data with wrong type
            localStorageMock.setItem(`workflow_${flowId}`, JSON.stringify(data));

            // Attempt to retrieve nodes/edges
            const result = getWorkflowNodesEdges(flowId);

            // Should reject data with wrong types and return default
            expect(result).toEqual({
              nodes: '[]',
              edges: '[]',
            });
            expect(console.error).toHaveBeenCalledWith('Invalid workflow nodes/edges data structure');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('JSON parsing error handling', () => {
    it('should handle invalid JSON gracefully for workflow data', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('invalid json{'),
            fc.constant('{incomplete'),
            fc.constant('{"unclosed": "string'),
            fc.constant('[1, 2, 3,]'),
            fc.constant('undefined'),
            fc.constant('NaN'),
            fc.string({ minLength: 1 }).filter(s => {
              // Filter to only truly invalid JSON strings
              if (s.trim() === '') return false; // Empty strings parse as strings
              try {
                JSON.parse(s);
                return false;
              } catch {
                return true;
              }
            })
          ),
          (invalidJson) => {
            // Store invalid JSON
            localStorageMock.setItem('flowlab_workflows', invalidJson);

            // Attempt to retrieve workflows
            const workflows = getWorkflowsFromStorage();

            // Should handle parsing error gracefully - returns demo workflows or empty array
            expect(Array.isArray(workflows)).toBe(true);

            // Should log clear error message
            expect(console.error).toHaveBeenCalledWith(
              'Failed to parse workflow data:',
              expect.any(Error)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle invalid JSON gracefully for nodes/edges data', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(
            fc.constant('invalid json{'),
            fc.constant('{incomplete'),
            fc.constant('{"unclosed": "string'),
            fc.constant('[1, 2, 3,]'),
            fc.string().filter(s => {
              try {
                JSON.parse(s);
                return false;
              } catch {
                return true;
              }
            })
          ),
          (flowId, invalidJson) => {
            // Store invalid JSON
            localStorageMock.setItem(`workflow_${flowId}`, invalidJson);

            // Attempt to retrieve nodes/edges
            const result = getWorkflowNodesEdges(flowId);

            // Should handle parsing error gracefully
            expect(result).toEqual({
              nodes: '[]',
              edges: '[]',
            });

            // Should log clear error message
            expect(console.error).toHaveBeenCalledWith(
              'Failed to parse workflow nodes/edges:',
              expect.any(Error)
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error message clarity', () => {
    it('should provide clear error messages for validation failures', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({ id: fc.integer() }), // Wrong type
            fc.record({ name: fc.constant(null) }), // Null value
            fc.constant({}), // Missing fields
            fc.constant([]) // Wrong structure
          ),
          (invalidData) => {
            // Store invalid data
            localStorageMock.setItem('flowlab_workflows', JSON.stringify([invalidData]));

            // Clear previous console.error calls
            (console.error as jest.Mock).mockClear();

            // Attempt to retrieve workflows
            getWorkflowsFromStorage();

            // Should log a clear error message
            expect(console.error).toHaveBeenCalled();
            const errorCall = (console.error as jest.Mock).mock.calls[0];
            expect(errorCall).toBeDefined();
            expect(errorCall[0]).toBeDefined();
            expect(typeof errorCall[0]).toBe('string');

            // Error message should be descriptive
            const errorMessage = errorCall[0] as string;
            expect(errorMessage.length).toBeGreaterThan(0);
            expect(errorMessage).toMatch(/invalid|workflow|data|structure|parse|failed/i);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not expose internal implementation details in error messages', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('invalid json'),
            fc.record({ wrongField: fc.string() })
          ),
          (invalidData) => {
            // Store invalid data
            const dataStr = typeof invalidData === 'string' 
              ? invalidData 
              : JSON.stringify([invalidData]);
            localStorageMock.setItem('flowlab_workflows', dataStr);

            // Clear previous console.error calls
            (console.error as jest.Mock).mockClear();

            // Attempt to retrieve workflows
            getWorkflowsFromStorage();

            // Should log error without exposing internals
            expect(console.error).toHaveBeenCalled();
            const errorCalls = (console.error as jest.Mock).mock.calls;

            errorCalls.forEach((call) => {
              const message = call[0];
              if (typeof message === 'string') {
                // Should not contain file paths or line numbers
                expect(message).not.toMatch(/\.ts:\d+/);
                expect(message).not.toMatch(/src\//);
                expect(message).not.toMatch(/node_modules/);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Invalid workflow structures are not processed', () => {
    it('should not process workflows with invalid structure', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.record({ id: fc.integer() }), // Invalid type
              fc.record({ name: fc.constant(null) }), // Null value
              fc.constant({}) // Missing fields
            ),
            { minLength: 1, maxLength: 5 }
          ),
          (invalidWorkflows) => {
            // Store array of invalid workflows
            localStorageMock.setItem('flowlab_workflows', JSON.stringify(invalidWorkflows));

            // Attempt to retrieve workflows
            const workflows = getWorkflowsFromStorage();

            // Should not process any invalid workflows
            expect(workflows).toEqual([]);

            // Should not attempt to use invalid data
            expect(console.error).toHaveBeenCalledWith('Invalid workflow data structure in storage');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not process nodes/edges with invalid structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(
            fc.record({ nodes: fc.integer() }), // Invalid type
            fc.record({ edges: fc.constant(null) }), // Null value
            fc.constant({}) // Missing fields
          ),
          (flowId, invalidData) => {
            // Store invalid nodes/edges data
            localStorageMock.setItem(`workflow_${flowId}`, JSON.stringify(invalidData));

            // Attempt to retrieve nodes/edges
            const result = getWorkflowNodesEdges(flowId);

            // Should not process invalid data, return safe default
            expect(result).toEqual({
              nodes: '[]',
              edges: '[]',
            });

            // Should log error
            expect(console.error).toHaveBeenCalledWith('Invalid workflow nodes/edges data structure');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Update operations with validation', () => {
    it('should validate workflow data before updating publish status', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.boolean(),
          fc.oneof(
            fc.constant('invalid json{'),
            fc.constant('[{invalid}]'),
            fc.array(fc.record({ wrongField: fc.string() }), { minLength: 1 })
          ),
          (workflowId, publishStatus, invalidData) => {
            // Store invalid data
            const dataStr = typeof invalidData === 'string' 
              ? invalidData 
              : JSON.stringify(invalidData);
            localStorageMock.setItem('flowlab_workflows', dataStr);

            // Clear previous console.error calls
            (console.error as jest.Mock).mockClear();

            // Attempt to update publish status
            const result = updateWorkflowPublish(workflowId, publishStatus);

            // Should fail to update invalid data
            expect(result).toBe(false);

            // Should log error (either parse error or validation error)
            expect(console.error).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should successfully update valid workflow data', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 50 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            publish: fc.boolean(),
            userId: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          fc.boolean(),
          (validWorkflow, newPublishStatus) => {
            // Store valid workflow
            localStorageMock.setItem('flowlab_workflows', JSON.stringify([validWorkflow]));

            // Update publish status
            const result = updateWorkflowPublish(validWorkflow.id, newPublishStatus);

            // Should successfully update
            expect(result).toBe(true);

            // Verify the update
            const workflows = getWorkflowsFromStorage();
            expect(workflows).toHaveLength(1);
            expect(workflows[0].publish).toBe(newPublishStatus);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Save operations with validation', () => {
    it('should create valid workflow data when saving', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 500 }),
          (name, description) => {
            // Save new workflow
            const workflow = saveWorkflowToStorage(name, description);

            // Should create valid workflow
            expect(workflow).not.toBeNull();
            expect(workflow?.id).toBeDefined();
            expect(typeof workflow?.id).toBe('string');
            expect(workflow?.name).toBe(name);
            expect(workflow?.description).toBe(description);
            expect(typeof workflow?.publish).toBe('boolean');
            expect(typeof workflow?.userId).toBe('string');

            // Verify it can be retrieved and validated
            const workflows = getWorkflowsFromStorage();
            expect(workflows.length).toBeGreaterThan(0);
            const savedWorkflow = workflows.find(w => w.id === workflow?.id);
            expect(savedWorkflow).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create valid nodes/edges data when saving', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 1000 }),
          fc.string({ minLength: 1, maxLength: 1000 }),
          (flowId, nodes, edges) => {
            // Save nodes/edges
            const result = saveWorkflowNodesEdges(flowId, nodes, edges);

            // Should successfully save
            expect(result).toBe(true);

            // Verify it can be retrieved and validated
            const retrieved = getWorkflowNodesEdges(flowId);
            expect(retrieved.nodes).toBe(nodes);
            expect(retrieved.edges).toBe(edges);
            expect(retrieved.updatedAt).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
