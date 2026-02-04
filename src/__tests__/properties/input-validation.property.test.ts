/**
 * Property-Based Test: Input Validation Consistency
 * 
 * Feature: bug-fixes-and-deployment
 * Property 3: Input Validation Consistency
 * 
 * **Validates: Requirements 6.1, 6.2, 6.3, 19.3**
 * 
 * This test verifies that for ANY API route that receives query parameters or request body,
 * the application should:
 * - Validate the input using a Zod schema before processing
 * - Return a 400 status code when validation fails
 * - Include detailed validation errors in the response (field names and error messages)
 * - Only process data that has passed validation
 */

import fc from 'fast-check';
import { z, ZodError } from 'zod';
import {
  validateRequest,
  PaymentRequestSchema,
  DriveQuerySchema,
  ClerkWebhookSchema,
  ConnectionTestQuerySchema,
  ConnectionTestBodySchema,
  WorkflowNodeSchema,
  WorkflowEdgeSchema,
  WorkflowCreateSchema,
  ApiKeySchema,
} from '@/lib/validation-schemas';
import { ApiErrorHandler } from '@/lib/api-response';

describe('Property 3: Input Validation Consistency', () => {
  describe('validateRequest function', () => {
    it('should validate all inputs using Zod schemas before processing', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { schema: PaymentRequestSchema, name: 'PaymentRequest' },
            { schema: DriveQuerySchema, name: 'DriveQuery' },
            { schema: ConnectionTestQuerySchema, name: 'ConnectionTestQuery' },
            { schema: ConnectionTestBodySchema, name: 'ConnectionTestBody' },
            { schema: WorkflowNodeSchema, name: 'WorkflowNode' },
            { schema: WorkflowEdgeSchema, name: 'WorkflowEdge' },
            { schema: WorkflowCreateSchema, name: 'WorkflowCreate' },
            { schema: ApiKeySchema, name: 'ApiKey' }
          ),
          fc.record({
            randomField: fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.constant(null),
              fc.constant(undefined)
            ),
          }),
          (schemaInfo, invalidData) => {
            // Validate with invalid data
            const result = validateRequest(schemaInfo.schema, invalidData);

            // Should return a result object
            expect(result).toBeDefined();
            expect(result).toHaveProperty('success');

            // Result should be either success or failure
            if (result.success) {
              expect(result).toHaveProperty('data');
              expect(result.data).toBeDefined();
            } else {
              expect(result).toHaveProperty('error');
              expect(result.error).toBeInstanceOf(ZodError);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return success=true with validated data when input is valid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            {
              schema: PaymentRequestSchema,
              validData: { priceId: 'price_123' },
            },
            {
              schema: DriveQuerySchema,
              validData: { code: 'auth_code_123', state: 'state_456' },
            },
            {
              schema: ConnectionTestQuerySchema,
              validData: { provider: 'discord' as const, action: 'test' as const },
            },
            {
              schema: ConnectionTestBodySchema,
              validData: { channelId: 'channel_123', message: 'test message' },
            },
            {
              schema: ApiKeySchema,
              validData: { provider: 'openai' as const, key: 'sk-test123' },
            }
          ),
          (testCase) => {
            const result = validateRequest(testCase.schema, testCase.validData);

            // Should succeed with valid data
            expect(result.success).toBe(true);

            if (result.success) {
              expect(result.data).toBeDefined();
              expect(result.data).toMatchObject(testCase.validData);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return success=false with ZodError when input is invalid', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            {
              schema: PaymentRequestSchema,
              invalidData: { priceId: '' }, // Empty string should fail
            },
            {
              schema: PaymentRequestSchema,
              invalidData: { wrongField: 'value' }, // Missing required field
            },
            {
              schema: ConnectionTestQuerySchema,
              invalidData: { provider: 'invalid_provider' }, // Invalid enum value
            },
            {
              schema: ApiKeySchema,
              invalidData: { provider: 'openai', key: '' }, // Empty key
            },
            {
              schema: ClerkWebhookSchema,
              invalidData: { type: 'user.created' }, // Missing required data field
            }
          ),
          (testCase) => {
            const result = validateRequest(testCase.schema, testCase.invalidData);

            // Should fail with invalid data
            expect(result.success).toBe(false);

            if (!result.success) {
              expect(result.error).toBeInstanceOf(ZodError);
              expect(result.error.errors).toBeDefined();
              expect(result.error.errors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only process data that has passed validation', () => {
      fc.assert(
        fc.property(
          fc.record({
            priceId: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          fc.record({
            maliciousField: fc.string(),
            extraField: fc.integer(),
          }),
          (validData, extraFields) => {
            // Combine valid data with extra fields
            const inputData = { ...validData, ...extraFields };

            const result = validateRequest(PaymentRequestSchema, inputData);

            if (result.success) {
              // Validated data should only contain schema-defined fields
              expect(result.data).toHaveProperty('priceId');
              expect(result.data.priceId).toBe(validData.priceId);

              // Extra fields should not be in validated data
              expect(result.data).not.toHaveProperty('maliciousField');
              expect(result.data).not.toHaveProperty('extraField');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ApiErrorHandler.validationError', () => {
    it('should return 400 status code when validation fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            PaymentRequestSchema,
            ConnectionTestQuerySchema,
            ApiKeySchema,
            WorkflowCreateSchema
          ),
          fc.record({
            invalidField: fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.constant(null)
            ),
          }),
          async (schema, invalidData) => {
            const result = validateRequest(schema, invalidData);

            if (!result.success) {
              const response = ApiErrorHandler.validationError(result.error);

              // Should return 400 status
              expect(response.status).toBe(400);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include detailed validation errors in the response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            {
              schema: PaymentRequestSchema,
              invalidData: { priceId: '' },
            },
            {
              schema: ConnectionTestQuerySchema,
              invalidData: { provider: 'invalid' },
            },
            {
              schema: ApiKeySchema,
              invalidData: { provider: 'openai', key: '' },
            },
            {
              schema: WorkflowCreateSchema,
              invalidData: { name: '', description: '' },
            }
          ),
          async (testCase) => {
            const result = validateRequest(testCase.schema, testCase.invalidData);

            if (!result.success) {
              const response = ApiErrorHandler.validationError(result.error);
              const body = await response.json();

              // Should have error structure
              expect(body).toHaveProperty('error');
              expect(body.error).toHaveProperty('code');
              expect(body.error).toHaveProperty('message');
              expect(body.error.code).toBe('VALIDATION_ERROR');

              // Should include details with field-level errors
              expect(body.error).toHaveProperty('details');
              expect(Array.isArray(body.error.details)).toBe(true);

              if (Array.isArray(body.error.details) && body.error.details.length > 0) {
                // Each detail should have path and message
                body.error.details.forEach((detail: unknown) => {
                  expect(detail).toHaveProperty('path');
                  expect(detail).toHaveProperty('message');
                  expect(typeof (detail as { message: string }).message).toBe('string');
                });
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include field names in validation error details', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              fieldName: fc.constantFrom('priceId', 'provider', 'key', 'name', 'description'),
              value: fc.constant(''), // Empty string to trigger validation error
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (fields) => {
            // Create a schema with the specified fields
            const schemaFields: Record<string, z.ZodString> = {};
            const testData: Record<string, string> = {};

            fields.forEach((field) => {
              schemaFields[field.fieldName] = z.string().min(1);
              testData[field.fieldName] = field.value;
            });

            const testSchema = z.object(schemaFields);
            const result = validateRequest(testSchema, testData);

            if (!result.success) {
              const response = ApiErrorHandler.validationError(result.error);
              const body = await response.json();

              // Should include field names in details
              expect(body.error.details).toBeDefined();
              expect(Array.isArray(body.error.details)).toBe(true);

              if (Array.isArray(body.error.details)) {
                // Each field should have a corresponding error
                const errorPaths = body.error.details.map(
                  (detail: { path: string }) => detail.path
                );

                fields.forEach((field) => {
                  expect(errorPaths).toContain(field.fieldName);
                });
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation with various data types', () => {
    it('should validate string fields correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (priceId) => {
            const result = validateRequest(PaymentRequestSchema, { priceId });

            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.priceId).toBe(priceId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate enum fields correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('discord', 'notion', 'slack', 'google'),
          (provider) => {
            const result = validateRequest(ConnectionTestQuerySchema, { provider });

            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.provider).toBe(provider);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid enum values', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !['discord', 'notion', 'slack', 'google'].includes(s)),
          (invalidProvider) => {
            const result = validateRequest(ConnectionTestQuerySchema, {
              provider: invalidProvider,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error).toBeInstanceOf(ZodError);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate optional fields correctly', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (code, state) => {
            const data: { code?: string; state?: string } = {};
            if (code !== undefined) data.code = code;
            if (state !== undefined) data.state = state;

            const result = validateRequest(DriveQuerySchema, data);

            expect(result.success).toBe(true);
            if (result.success) {
              if (code !== undefined) {
                expect(result.data.code).toBe(code);
              }
              if (state !== undefined) {
                expect(result.data.state).toBe(state);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate nested object structures', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: -1000, max: 1000 }),
          fc.integer({ min: -1000, max: 1000 }),
          (id, type, x, y) => {
            const nodeData = {
              id,
              type,
              position: { x, y },
              data: { someField: 'value' },
            };

            const result = validateRequest(WorkflowNodeSchema, nodeData);

            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.id).toBe(id);
              expect(result.data.type).toBe(type);
              expect(result.data.position.x).toBe(x);
              expect(result.data.position.y).toBe(y);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject data with missing required fields', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            {}, // Empty object
            { wrongField: 'value' }, // Wrong field name
            { priceId: undefined }, // Undefined value
            { priceId: null } // Null value
          ),
          (invalidData) => {
            const result = validateRequest(PaymentRequestSchema, invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error).toBeInstanceOf(ZodError);
              expect(result.error.errors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject data with incorrect types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { priceId: 123 }, // Number instead of string
            { priceId: true }, // Boolean instead of string
            { priceId: [] }, // Array instead of string
            { priceId: {} } // Object instead of string
          ),
          (invalidData) => {
            const result = validateRequest(PaymentRequestSchema, invalidData);

            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error).toBeInstanceOf(ZodError);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation error message quality', () => {
    it('should provide clear error messages for validation failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            { schema: PaymentRequestSchema, data: {} },
            { schema: ApiKeySchema, data: { provider: 'openai' } },
            { schema: WorkflowCreateSchema, data: { name: '' } }
          ),
          async (testCase) => {
            const result = validateRequest(testCase.schema, testCase.data);

            if (!result.success) {
              const response = ApiErrorHandler.validationError(result.error);
              const body = await response.json();

              // Error message should be clear and descriptive
              expect(body.error.message).toBeDefined();
              expect(body.error.message.length).toBeGreaterThan(0);
              expect(typeof body.error.message).toBe('string');

              // Should not contain technical jargon
              expect(body.error.message).not.toMatch(/ZodError/);
              expect(body.error.message).not.toMatch(/safeParse/);
              expect(body.error.message).not.toMatch(/\.ts:\d+/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Integration with API error handling', () => {
    it('should integrate seamlessly with ApiErrorHandler', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            invalidField: fc.string(),
          }),
          async (invalidData) => {
            const result = validateRequest(PaymentRequestSchema, invalidData);

            if (!result.success) {
              // Should be able to pass error directly to ApiErrorHandler
              const response = ApiErrorHandler.validationError(result.error);

              // Response should be properly formatted
              expect(response).toBeDefined();
              expect(response.status).toBe(400);

              const body = await response.json();
              expect(body.error.code).toBe('VALIDATION_ERROR');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
