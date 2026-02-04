/**
 * Property-Based Test: Error Response Safety and Consistency
 * 
 * Feature: bug-fixes-and-deployment
 * Property 1: Error Response Safety and Consistency
 * 
 * **Validates: Requirements 1.3, 2.3, 2.4, 19.1, 19.2, 19.5**
 * 
 * This test verifies that for ANY error that occurs in an API route,
 * the error response should:
 * - Return an appropriate HTTP status code (400, 401, 403, 404, or 500)
 * - Include a consistent JSON structure with "error" object containing "code" and "message" fields
 * - NOT expose stack traces or sensitive information in the response body
 * - Include descriptive error messages without implementation details
 */

import fc from 'fast-check';
import { ApiErrorHandler, createErrorResponse, ErrorCodes } from '@/lib/api-response';
import { ZodError, z } from 'zod';

describe('Property 1: Error Response Safety and Consistency', () => {
  describe('ApiErrorHandler methods', () => {
    it('should return appropriate HTTP status codes for all error types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { method: 'badRequest', expectedStatus: 400 },
            { method: 'unauthorized', expectedStatus: 401 },
            { method: 'forbidden', expectedStatus: 403 },
            { method: 'notFound', expectedStatus: 404 },
            { method: 'internalError', expectedStatus: 500 }
          ),
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorType, message) => {
            const method = errorType.method as keyof typeof ApiErrorHandler;
            const response = ApiErrorHandler[method](message);
            
            // Verify status code
            expect(response.status).toBe(errorType.expectedStatus);
            expect([400, 401, 403, 404, 500]).toContain(response.status);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include consistent JSON structure with error object containing code and message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            { method: 'badRequest', code: ErrorCodes.BAD_REQUEST },
            { method: 'unauthorized', code: ErrorCodes.UNAUTHORIZED },
            { method: 'forbidden', code: ErrorCodes.FORBIDDEN },
            { method: 'notFound', code: ErrorCodes.NOT_FOUND },
            { method: 'internalError', code: ErrorCodes.INTERNAL_ERROR }
          ),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (errorType, message) => {
            const method = errorType.method as keyof typeof ApiErrorHandler;
            const response = ApiErrorHandler[method](message);
            
            // Parse the response body
            const body = await response.json();
            
            // Verify structure
            expect(body).toHaveProperty('error');
            expect(body.error).toHaveProperty('code');
            expect(body.error).toHaveProperty('message');
            
            // Verify types
            expect(typeof body.error.code).toBe('string');
            expect(typeof body.error.message).toBe('string');
            
            // Verify code matches expected
            expect(body.error.code).toBe(errorType.code);
            
            // Verify message is present
            expect(body.error.message.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT expose stack traces or sensitive information in response body', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'badRequest',
            'unauthorized',
            'forbidden',
            'notFound',
            'internalError'
          ),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.option(
            fc.record({
              sensitiveData: fc.string(),
              password: fc.string(),
              apiKey: fc.string(),
              token: fc.string(),
            }),
            { nil: undefined }
          ),
          async (method, message, details) => {
            const methodName = method as keyof typeof ApiErrorHandler;
            const response = ApiErrorHandler[methodName](message, details);
            
            // Parse the response body
            const body = await response.json();
            const bodyString = JSON.stringify(body);
            
            // Verify no stack traces
            expect(bodyString).not.toMatch(/at\s+\w+\s+\(/); // Stack trace pattern
            expect(bodyString).not.toMatch(/\.js:\d+:\d+/); // File location pattern
            expect(bodyString).not.toMatch(/Error:\s+at/); // Error stack pattern
            
            // Verify no common sensitive keywords in error object
            expect(body.error.message).not.toMatch(/password/i);
            expect(body.error.message).not.toMatch(/secret/i);
            expect(body.error.message).not.toMatch(/token/i);
            expect(body.error.message).not.toMatch(/api[_-]?key/i);
            
            // Verify no implementation details
            expect(body.error.message).not.toMatch(/node_modules/);
            expect(body.error.message).not.toMatch(/src\//);
            expect(body.error.message).not.toMatch(/\.ts/);
            expect(body.error.message).not.toMatch(/\.js/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include descriptive error messages without implementation details', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'badRequest',
            'unauthorized',
            'forbidden',
            'notFound',
            'internalError'
          ),
          fc.string({ minLength: 1, maxLength: 200 }),
          async (method, message) => {
            const methodName = method as keyof typeof ApiErrorHandler;
            const response = ApiErrorHandler[methodName](message);
            
            // Parse the response body
            const body = await response.json();
            
            // Verify message is descriptive (not empty)
            expect(body.error.message.length).toBeGreaterThan(0);
            
            // Verify no file paths
            expect(body.error.message).not.toMatch(/[A-Z]:\\/); // Windows paths
            expect(body.error.message).not.toMatch(/\/home\//); // Unix paths
            expect(body.error.message).not.toMatch(/\/usr\//); // Unix system paths
            
            // Verify no function names with parentheses (implementation details)
            expect(body.error.message).not.toMatch(/\w+\(\)/);
            
            // Verify no line numbers
            expect(body.error.message).not.toMatch(/line\s+\d+/i);
            expect(body.error.message).not.toMatch(/:\d+:\d+/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validationError method', () => {
    it('should handle Zod validation errors with consistent structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              fieldName: fc.string({ minLength: 1, maxLength: 50 }),
              value: fc.oneof(
                fc.string(),
                fc.integer(),
                fc.boolean(),
                fc.constant(null),
                fc.constant(undefined)
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (testCases) => {
            // Create a schema that will fail validation
            const schema = z.object(
              testCases.reduce((acc, tc) => {
                acc[tc.fieldName] = z.string().min(10); // Will fail for most inputs
                return acc;
              }, {} as Record<string, z.ZodString>)
            );

            try {
              // This should throw a ZodError
              schema.parse(
                testCases.reduce((acc, tc) => {
                  acc[tc.fieldName] = tc.value;
                  return acc;
                }, {} as Record<string, unknown>)
              );
            } catch (error) {
              if (error instanceof ZodError) {
                const response = ApiErrorHandler.validationError(error);
                const body = await response.json();

                // Verify status code
                expect(response.status).toBe(400);

                // Verify structure
                expect(body).toHaveProperty('error');
                expect(body.error).toHaveProperty('code');
                expect(body.error).toHaveProperty('message');
                expect(body.error.code).toBe(ErrorCodes.VALIDATION_ERROR);

                // Verify no stack traces
                const bodyString = JSON.stringify(body);
                expect(bodyString).not.toMatch(/at\s+\w+\s+\(/);
                expect(bodyString).not.toMatch(/\.js:\d+:\d+/);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('createErrorResponse function', () => {
    it('should create consistent error responses for any status code and message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(400, 401, 403, 404, 500),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.option(
            fc.record({
              field: fc.string(),
              value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
            }),
            { nil: undefined }
          ),
          async (status, code, message, details) => {
            const response = createErrorResponse(status, code, message, details);
            const body = await response.json();

            // Verify status code
            expect(response.status).toBe(status);
            expect([400, 401, 403, 404, 500]).toContain(response.status);

            // Verify structure
            expect(body).toHaveProperty('error');
            expect(body.error).toHaveProperty('code');
            expect(body.error).toHaveProperty('message');
            expect(body.error.code).toBe(code);
            expect(body.error.message).toBe(message);

            // Verify details if provided
            if (details) {
              expect(body.error).toHaveProperty('details');
            }

            // Verify no stack traces
            const bodyString = JSON.stringify(body);
            expect(bodyString).not.toMatch(/at\s+\w+\s+\(/);
            expect(bodyString).not.toMatch(/Error:\s+at/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Special error methods', () => {
    it('should handle invalidJson errors consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
          async (message) => {
            const response = message
              ? ApiErrorHandler.invalidJson(message)
              : ApiErrorHandler.invalidJson();
            
            const body = await response.json();

            // Verify status and structure
            expect(response.status).toBe(400);
            expect(body.error.code).toBe(ErrorCodes.INVALID_JSON);
            expect(body.error.message.length).toBeGreaterThan(0);

            // Verify no sensitive information
            const bodyString = JSON.stringify(body);
            expect(bodyString).not.toMatch(/at\s+\w+\s+\(/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle missingConfig errors consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (message) => {
            const response = ApiErrorHandler.missingConfig(message);
            const body = await response.json();

            // Verify status and structure
            expect(response.status).toBe(500);
            expect(body.error.code).toBe(ErrorCodes.MISSING_CONFIG);
            expect(body.error.message).toBe(message);

            // Verify no sensitive information
            const bodyString = JSON.stringify(body);
            expect(bodyString).not.toMatch(/at\s+\w+\s+\(/);
            expect(bodyString).not.toMatch(/\.js:\d+:\d+/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
