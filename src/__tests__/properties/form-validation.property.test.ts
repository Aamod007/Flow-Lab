/**
 * @jest-environment jsdom
 */

/**
 * Property-Based Test: Form Data Validation
 * 
 * Feature: bug-fixes-and-deployment
 * Property 6: Form Data Validation
 * 
 * **Validates: Requirements 16.5**
 * 
 * This test verifies that for ANY form submission, the application should:
 * - Validate the form data using the defined Zod schema before submission
 * - Prevent submission of invalid data
 * - Display validation errors to the user
 * - Only submit data that passes validation
 */

import fc from 'fast-check';
import { WorkflowFormSchema, EditUserProfileSchema } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

describe('Property 6: Form Data Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('WorkflowForm validation', () => {
    it('should reject invalid workflow form data and prevent submission', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Empty name
            fc.record({
              name: fc.constant(''),
              description: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            // Empty description
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              description: fc.constant(''),
            }),
            // Both empty
            fc.record({
              name: fc.constant(''),
              description: fc.constant(''),
            })
          ),
          (invalidData) => {
            // Validate using Zod schema
            const result = WorkflowFormSchema.safeParse(invalidData);

            // Should reject invalid data (empty strings)
            expect(result.success).toBe(false);

            if (!result.success) {
              // Should provide validation errors
              expect(result.error.errors.length).toBeGreaterThan(0);

              // Each error should have a path and message
              result.error.errors.forEach((error) => {
                expect(error.path).toBeDefined();
                expect(error.message).toBeDefined();
                expect(typeof error.message).toBe('string');
                expect(error.message.length).toBeGreaterThan(0);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid workflow form data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          }),
          (validData) => {
            // Validate using Zod schema
            const result = WorkflowFormSchema.safeParse(validData);

            // Should accept valid data
            expect(result.success).toBe(true);

            if (result.success) {
              // Should return the validated data
              expect(result.data).toEqual(validData);
              expect(result.data.name).toBe(validData.name);
              expect(result.data.description).toBe(validData.description);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate all required fields are present', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('name', 'description'),
          (missingField) => {
            // Create form data with one field missing
            const formData: Record<string, unknown> = {
              name: 'Test Workflow',
              description: 'Test Description',
            };

            // Remove one required field
            delete formData[missingField];

            // Validate using Zod schema
            const result = WorkflowFormSchema.safeParse(formData);

            // Should reject data with missing required fields
            expect(result.success).toBe(false);

            if (!result.success) {
              // Should include error for the missing field
              const fieldErrors = result.error.errors.filter(
                (err) => err.path.includes(missingField)
              );
              expect(fieldErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate field types are correct', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { field: 'name', wrongValue: 123 },
            { field: 'name', wrongValue: true },
            { field: 'name', wrongValue: null },
            { field: 'name', wrongValue: [] },
            { field: 'description', wrongValue: 456 },
            { field: 'description', wrongValue: false },
            { field: 'description', wrongValue: {} }
          ),
          (testCase) => {
            // Create form data with wrong type for one field
            const formData: Record<string, unknown> = {
              name: 'Test Workflow',
              description: 'Test Description',
            };

            // Set wrong type for the field
            formData[testCase.field] = testCase.wrongValue;

            // Validate using Zod schema
            const result = WorkflowFormSchema.safeParse(formData);

            // Should reject data with wrong types
            expect(result.success).toBe(false);

            if (!result.success) {
              // Should include error for the field with wrong type
              expect(result.error.errors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('ProfileForm validation', () => {
    it('should reject invalid profile form data', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Invalid email format
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              email: fc.string({ minLength: 1 }).filter(s => !s.includes('@')),
            }),
            // Empty name
            fc.record({
              name: fc.constant(''),
              email: fc.emailAddress(),
            }),
            // Empty email
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              email: fc.constant(''),
            }),
            // Both empty
            fc.record({
              name: fc.constant(''),
              email: fc.constant(''),
            }),
            // Invalid email with spaces
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 100 }),
              email: fc.constant('invalid email@test.com'),
            })
          ),
          (invalidData) => {
            // Validate using Zod schema
            const result = EditUserProfileSchema.safeParse(invalidData);

            // Should reject invalid data
            expect(result.success).toBe(false);

            if (!result.success) {
              // Should provide validation errors
              expect(result.error.errors.length).toBeGreaterThan(0);

              // Each error should have a path and message
              result.error.errors.forEach((error) => {
                expect(error.path).toBeDefined();
                expect(error.message).toBeDefined();
                expect(typeof error.message).toBe('string');
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid profile form data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            // Use a more conservative email generator that matches Zod's validation
            email: fc.emailAddress().filter(email => {
              // Test if Zod accepts this email
              const testResult = z.string().email().safeParse(email);
              return testResult.success;
            }),
          }),
          (validData) => {
            // Validate using Zod schema
            const result = EditUserProfileSchema.safeParse(validData);

            // Should accept valid data
            expect(result.success).toBe(true);

            if (result.success) {
              // Should return the validated data
              expect(result.data).toEqual(validData);
              expect(result.data.name).toBe(validData.name);
              expect(result.data.email).toBe(validData.email);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate email format strictly', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('notanemail'),
            fc.constant('missing@domain'),
            fc.constant('@nodomain.com'),
            fc.constant('spaces in@email.com'),
            fc.constant('double@@email.com'),
            fc.constant('email@'),
            fc.constant('@email'),
            fc.string({ minLength: 1 }).filter(s => !s.includes('@') && !s.includes('.'))
          ),
          (invalidEmail) => {
            const formData = {
              name: 'Test User',
              email: invalidEmail,
            };

            // Validate using Zod schema
            const result = EditUserProfileSchema.safeParse(formData);

            // Should reject invalid email formats
            expect(result.success).toBe(false);

            if (!result.success) {
              // Should include error for email field
              const emailErrors = result.error.errors.filter(
                (err) => err.path.includes('email')
              );
              expect(emailErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Form submission prevention with invalid data', () => {
    it('should prevent submission when validation fails', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({ name: fc.constant(''), description: fc.string() }),
            fc.record({ name: fc.string(), description: fc.constant('') }),
            fc.record({ name: fc.constant(''), description: fc.constant('') })
          ),
          (invalidData) => {
            // Validate using Zod schema
            const result = WorkflowFormSchema.safeParse(invalidData);

            // Should fail validation
            expect(result.success).toBe(false);

            // When validation fails, form should not submit
            // This is enforced by zodResolver in react-hook-form
            if (!result.success) {
              // Validation errors prevent submission
              expect(result.error.errors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use zodResolver to integrate validation with form submission', async () => {
      // Test that zodResolver properly integrates Zod validation
      const resolver = zodResolver(WorkflowFormSchema);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.constant(''),
            description: fc.constant(''),
          }),
          async (invalidData) => {
            // Simulate form submission with invalid data
            const result = await resolver(invalidData, undefined as any, { shouldUseNativeValidation: false, fields: {} });

            // Should return errors
            expect(result.errors).toBeDefined();
            expect(Object.keys(result.errors).length).toBeGreaterThan(0);

            // Should not return values when validation fails
            expect(result.values).toEqual({});
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Only validated data is submitted', () => {
    it('should only allow submission of data that passes validation', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          (validData) => {
            // Validate using Zod schema
            const result = WorkflowFormSchema.safeParse(validData);

            // Should pass validation
            expect(result.success).toBe(true);

            if (result.success) {
              // Only validated data is available for submission
              expect(result.data).toEqual(validData);
              expect(result.data.name).toBe(validData.name);
              expect(result.data.description).toBe(validData.description);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use zodResolver to ensure only validated data is submitted', async () => {
      const resolver = zodResolver(WorkflowFormSchema);

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
          }),
          async (validData) => {
            // Simulate form submission with valid data
            const result = await resolver(validData, undefined as any, { shouldUseNativeValidation: false, fields: {} });

            // Should not return errors
            expect(Object.keys(result.errors).length).toBe(0);

            // Should return validated values
            expect(result.values).toEqual(validData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should transform and validate data before submission', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 1, maxLength: 500 }),
            extraField: fc.string(), // Extra field not in schema
          }),
          (dataWithExtra) => {
            // Validate using Zod schema
            const result = WorkflowFormSchema.safeParse(dataWithExtra);

            if (result.success) {
              // Should only include fields defined in schema
              expect(result.data).toHaveProperty('name');
              expect(result.data).toHaveProperty('description');
              expect(result.data).not.toHaveProperty('extraField');

              // Should only have the expected fields
              const keys = Object.keys(result.data);
              expect(keys).toEqual(['name', 'description']);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation error messages are user-friendly', () => {
    it('should provide clear error messages for validation failures', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.record({ name: fc.constant(''), description: fc.string() }),
            fc.record({ name: fc.string(), description: fc.constant('') }),
            fc.record({ name: fc.constant(''), description: fc.constant('') })
          ),
          (invalidData) => {
            // Validate using Zod schema
            const result = WorkflowFormSchema.safeParse(invalidData);

            if (!result.success) {
              // Should have clear error messages
              result.error.errors.forEach((error) => {
                expect(error.message).toBeDefined();
                expect(typeof error.message).toBe('string');
                expect(error.message.length).toBeGreaterThan(0);

                // Error message should be user-friendly
                expect(error.message).toMatch(/required/i);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide specific error messages for email validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !s.includes('@')),
          (invalidEmail) => {
            const formData = {
              name: 'Test User',
              email: invalidEmail,
            };

            // Validate using Zod schema
            const result = EditUserProfileSchema.safeParse(formData);

            if (!result.success) {
              // Should have error for email field
              const emailErrors = result.error.errors.filter(
                (err) => err.path.includes('email')
              );

              expect(emailErrors.length).toBeGreaterThan(0);

              // Error message should be clear
              emailErrors.forEach((error) => {
                expect(error.message).toBeDefined();
                expect(typeof error.message).toBe('string');
                expect(error.message.length).toBeGreaterThan(0);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Schema validation consistency', () => {
    it('should consistently validate the same data', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 0, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
          }),
          (data) => {
            // Validate multiple times
            const result1 = WorkflowFormSchema.safeParse(data);
            const result2 = WorkflowFormSchema.safeParse(data);
            const result3 = WorkflowFormSchema.safeParse(data);

            // Should produce consistent results
            expect(result1.success).toBe(result2.success);
            expect(result2.success).toBe(result3.success);

            if (result1.success && result2.success && result3.success) {
              expect(result1.data).toEqual(result2.data);
              expect(result2.data).toEqual(result3.data);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate independently of field order', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
          (name, description) => {
            // Create data in different orders
            const data1 = { name, description };
            const data2 = { description, name };

            // Validate both
            const result1 = WorkflowFormSchema.safeParse(data1);
            const result2 = WorkflowFormSchema.safeParse(data2);

            // Should produce same validation result
            expect(result1.success).toBe(result2.success);

            if (result1.success && result2.success) {
              expect(result1.data.name).toBe(result2.data.name);
              expect(result1.data.description).toBe(result2.data.description);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
