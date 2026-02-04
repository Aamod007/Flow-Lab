/**
 * Property-Based Test: JSON Parsing Error Handling
 * 
 * Feature: bug-fixes-and-deployment
 * Property 2: JSON Parsing Error Handling
 * 
 * **Validates: Requirements 2.2, 12.2**
 * 
 * This test verifies that for ANY invalid JSON string sent to a webhook or API route,
 * the application should:
 * - Catch the JSON parsing error
 * - Return a 400 status code
 * - Include an error message indicating invalid JSON
 * - NOT crash or expose internal errors
 */

import fc from 'fast-check';
import { POST as clerkWebhookPOST } from '@/app/api/clerk-webhook/route';
import { POST as connectionTestPOST } from '@/app/api/connections/test/route';
import { ErrorCodes } from '@/lib/api-response';

describe('Property 2: JSON Parsing Error Handling', () => {
  describe('Invalid JSON handling in webhook routes', () => {
    it('should catch JSON parsing errors and return 400 status for any invalid JSON', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Generate various types of invalid JSON strings
            fc.string().filter(s => {
              try {
                JSON.parse(s);
                return false; // Valid JSON, skip
              } catch {
                return true; // Invalid JSON, use it
              }
            }),
            // Specific invalid JSON patterns
            fc.constantFrom(
              '{invalid}',
              '{"key": undefined}',
              "{'single': 'quotes'}",
              '{trailing: comma,}',
              '{unquoted: key}',
              '{"unclosed": "string',
              '{"missing": }',
              '{,}',
              '}{',
              'null,',
              '[1, 2, 3,]',
              '{"a": NaN}',
              '{"a": Infinity}',
              ''
            ),
            // Truncated JSON
            fc.string({ minLength: 1, maxLength: 50 }).map(s => '{"data":' + s),
            // Random bytes that aren't valid JSON
            fc.uint8Array({ minLength: 1, maxLength: 100 }).map(arr => 
              String.fromCharCode(...Array.from(arr))
            )
          ),
          async (invalidJson) => {
            // Create a mock Request with invalid JSON body
            const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: invalidJson,
            });

            // Call the webhook handler
            const response = await clerkWebhookPOST(mockRequest);

            // Should return 400 status code
            expect(response.status).toBe(400);

            // Should return valid JSON response (not crash)
            const body = await response.json();
            expect(body).toBeDefined();
            expect(body).toHaveProperty('error');

            // Should indicate invalid JSON
            expect(body.error).toHaveProperty('code');
            expect(body.error.code).toBe(ErrorCodes.INVALID_JSON);

            // Should have a descriptive error message
            expect(body.error).toHaveProperty('message');
            expect(typeof body.error.message).toBe('string');
            expect(body.error.message.length).toBeGreaterThan(0);

            // Should NOT expose internal errors or stack traces
            expect(JSON.stringify(body)).not.toMatch(/stack/i);
            expect(JSON.stringify(body)).not.toMatch(/at Object\./);
            expect(JSON.stringify(body)).not.toMatch(/\.ts:\d+/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle invalid JSON in POST routes with request body', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Malformed JSON strings
            fc.constantFrom(
              'not json at all',
              '{"incomplete":',
              '}{backwards}{',
              '{"nested": {"broken":}',
              '[1, 2, 3, 4, 5,',
              '{"key": "value"}}', // Extra closing brace
              '{{nested}}',
              '["array", "with", "trailing",]'
            ),
            // Random non-JSON strings
            fc.string({ minLength: 1, maxLength: 200 }).filter(s => {
              try {
                JSON.parse(s);
                return false;
              } catch {
                return true;
              }
            })
          ),
          async (invalidJson) => {
            // Create a mock Request with invalid JSON body
            const mockRequest = new Request(
              'http://localhost:3000/api/connections/test?provider=slack&action=send',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: invalidJson,
              }
            );

            // Call the API handler
            const response = await connectionTestPOST(mockRequest);

            // Should return 400 status code
            expect(response.status).toBe(400);

            // Should return valid JSON response
            const body = await response.json();
            expect(body).toBeDefined();
            expect(body).toHaveProperty('error');

            // Should indicate invalid JSON
            expect(body.error.code).toBe(ErrorCodes.INVALID_JSON);

            // Should NOT crash or expose internal errors
            expect(body.error.message).toBeDefined();
            expect(typeof body.error.message).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error response consistency', () => {
    it('should return consistent error structure for all invalid JSON inputs', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(
              '{',
              '}',
              '[',
              ']',
              '{"a":',
              'undefined',
              'NaN',
              '{key: value}',
              "{'key': 'value'}",
              '{"a": undefined}',
              '{"a": NaN}',
              '{"a": Infinity}',
              '{"a": -Infinity}'
            ),
            { minLength: 1, maxLength: 5 }
          ),
          async (invalidJsonArray) => {
            const responses = await Promise.all(
              invalidJsonArray.map(async (invalidJson) => {
                const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: invalidJson,
                });

                const response = await clerkWebhookPOST(mockRequest);
                const body = await response.json();
                return { status: response.status, body };
              })
            );

            // All responses should have the same structure
            responses.forEach(({ status, body }) => {
              // All should return 400
              expect(status).toBe(400);

              // All should have error object with code and message
              expect(body).toHaveProperty('error');
              expect(body.error).toHaveProperty('code');
              expect(body.error).toHaveProperty('message');
              expect(body.error.code).toBe(ErrorCodes.INVALID_JSON);

              // All should have string messages
              expect(typeof body.error.message).toBe('string');
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never expose stack traces or internal error details', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Various types of malformed JSON
            fc.string({ minLength: 1, maxLength: 1000 }).filter(s => {
              try {
                JSON.parse(s);
                return false;
              } catch {
                return true;
              }
            }),
            // Binary data
            fc.uint8Array({ minLength: 10, maxLength: 100 }).map(arr =>
              Buffer.from(Array.from(arr)).toString('utf-8')
            ),
            // Control characters
            fc.array(fc.integer({ min: 0, max: 31 }), { minLength: 5, maxLength: 20 }).map(
              codes => String.fromCharCode(...codes)
            )
          ),
          async (invalidJson) => {
            const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: invalidJson,
            });

            const response = await clerkWebhookPOST(mockRequest);
            const body = await response.json();
            const responseText = JSON.stringify(body);

            // Should NOT contain stack trace indicators
            expect(responseText).not.toMatch(/\bat\s+/); // "at " in stack traces
            expect(responseText).not.toMatch(/\.ts:\d+:\d+/); // File:line:column
            expect(responseText).not.toMatch(/Error:\s+/); // Error: prefix
            expect(responseText).not.toMatch(/stack/i); // "stack" property
            expect(responseText).not.toMatch(/SyntaxError/); // SyntaxError type
            expect(responseText).not.toMatch(/JSON\.parse/); // Internal method names
            expect(responseText).not.toMatch(/node_modules/); // Module paths
            expect(responseText).not.toMatch(/\/src\//); // Source paths
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Application stability', () => {
    it('should not crash when processing invalid JSON', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.string({ minLength: 1, maxLength: 500 }),
              fc.uint8Array({ minLength: 1, maxLength: 100 }).map(arr =>
                String.fromCharCode(...Array.from(arr))
              )
            ).filter(s => {
              try {
                JSON.parse(s);
                return false;
              } catch {
                return true;
              }
            }),
            { minLength: 5, maxLength: 20 }
          ),
          async (invalidJsonArray) => {
            // Process multiple invalid JSON requests in sequence
            for (const invalidJson of invalidJsonArray) {
              const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: invalidJson,
              });

              // Should not throw an error
              let response;
              try {
                response = await clerkWebhookPOST(mockRequest);
              } catch (error) {
                // If an error is thrown, the test should fail
                throw new Error(
                  `Handler crashed with invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
              }

              // Should return a valid response
              expect(response).toBeDefined();
              expect(response.status).toBe(400);

              // Should be able to parse the response
              const body = await response.json();
              expect(body).toBeDefined();
              expect(body.error).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle concurrent invalid JSON requests without crashing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom(
              '{invalid}',
              '{"broken":',
              'not json',
              '}{',
              '{"a": undefined}',
              '[1,2,3,]'
            ),
            { minLength: 3, maxLength: 10 }
          ),
          async (invalidJsonArray) => {
            // Process multiple invalid JSON requests concurrently
            const promises = invalidJsonArray.map(async (invalidJson) => {
              const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: invalidJson,
              });

              return clerkWebhookPOST(mockRequest);
            });

            // All requests should complete without throwing
            const responses = await Promise.all(promises);

            // All responses should be valid
            responses.forEach((response) => {
              expect(response).toBeDefined();
              expect(response.status).toBe(400);
            });

            // All response bodies should be parseable
            const bodies = await Promise.all(responses.map((r) => r.json()));
            bodies.forEach((body) => {
              expect(body).toBeDefined();
              expect(body.error).toBeDefined();
              expect(body.error.code).toBe(ErrorCodes.INVALID_JSON);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error message quality', () => {
    it('should provide clear, user-friendly error messages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            '{invalid json}',
            '{"missing": }',
            'not json at all',
            '{"unclosed": "string',
            '[1, 2, 3,]'
          ),
          async (invalidJson) => {
            const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: invalidJson,
            });

            const response = await clerkWebhookPOST(mockRequest);
            const body = await response.json();

            // Error message should be clear and descriptive
            expect(body.error.message).toBeDefined();
            expect(body.error.message.length).toBeGreaterThan(0);

            // Should mention JSON or payload
            const message = body.error.message.toLowerCase();
            expect(
              message.includes('json') || 
              message.includes('payload') || 
              message.includes('invalid')
            ).toBe(true);

            // Should not contain technical jargon
            expect(message).not.toMatch(/syntaxerror/i);
            expect(message).not.toMatch(/parse error/i);
            expect(message).not.toMatch(/unexpected token/i);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return the same error code for all JSON parsing failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.string({ minLength: 1, maxLength: 100 }).filter(s => {
              try {
                JSON.parse(s);
                return false;
              } catch {
                return true;
              }
            }),
            { minLength: 5, maxLength: 15 }
          ),
          async (invalidJsonArray) => {
            const errorCodes = await Promise.all(
              invalidJsonArray.map(async (invalidJson) => {
                const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: invalidJson,
                });

                const response = await clerkWebhookPOST(mockRequest);
                const body = await response.json();
                return body.error.code;
              })
            );

            // All error codes should be the same
            const uniqueCodes = new Set(errorCodes);
            expect(uniqueCodes.size).toBe(1);
            expect(uniqueCodes.has(ErrorCodes.INVALID_JSON)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty request body', async () => {
      const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '',
      });

      const response = await clerkWebhookPOST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe(ErrorCodes.INVALID_JSON);
    });

    it('should handle whitespace-only request body', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('   ', '\n\n', '\t\t', '  \n  \t  '),
          async (whitespace) => {
            const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: whitespace,
            });

            const response = await clerkWebhookPOST(mockRequest);
            const body = await response.json();

            expect(response.status).toBe(400);
            expect(body.error.code).toBe(ErrorCodes.INVALID_JSON);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle very large invalid JSON strings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1000, maxLength: 5000 }).filter(s => {
            try {
              JSON.parse(s);
              return false;
            } catch {
              return true;
            }
          }),
          async (largeInvalidJson) => {
            const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: largeInvalidJson,
            });

            const response = await clerkWebhookPOST(mockRequest);
            const body = await response.json();

            expect(response.status).toBe(400);
            expect(body.error.code).toBe(ErrorCodes.INVALID_JSON);
            expect(body.error.message).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle JSON with special characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            '{"key": "\u0000"}', // Null character
            '{"key": "\u001F"}', // Control character
            '{"key": "\\"}', // Backslash
            '{"key": """}', // Smart quotes
            '{"key": "emoji 🚀"}' // Emoji (this is valid, but testing handling)
          ),
          async (jsonWithSpecialChars) => {
            const mockRequest = new Request('http://localhost:3000/api/clerk-webhook', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: jsonWithSpecialChars,
            });

            const response = await clerkWebhookPOST(mockRequest);
            
            // Should either parse successfully or return 400 for invalid JSON
            expect([200, 400]).toContain(response.status);
            
            if (response.status === 400) {
              const body = await response.json();
              expect(body.error).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
