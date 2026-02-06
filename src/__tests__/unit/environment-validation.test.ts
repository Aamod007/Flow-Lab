/**
 * Example Test 9: Environment Validation
 * 
 * Validates: Requirements 10.2, 10.3, 18.1
 * 
 * This test ensures that environment variable validation works correctly
 * and identifies missing required variables.
 */

import { validateCriticalEnvVars } from '@/lib/startup-checks'
import { validateEnvironment } from '@/lib/env-validator'

describe('Example 9: Environment Validation', () => {
    const originalEnv = process.env

    beforeEach(() => {
        // Create a fresh copy of process.env for each test
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv
    })

    it('should validate critical environment variables are present', () => {
        // Set all critical variables
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_xxxxx'
        process.env.CLERK_SECRET_KEY = 'sk_test_xxxxx'

        const isValid = validateCriticalEnvVars()
        expect(isValid).toBe(true)
    })

    it('should return false when critical variables are missing', () => {
        // Remove a critical variable
        delete process.env.DATABASE_URL

        const isValid = validateCriticalEnvVars()
        expect(isValid).toBe(false)
    })

    it('should identify all missing environment variables', () => {
        // Remove multiple variables
        delete process.env.DATABASE_URL
        delete process.env.CLERK_SECRET_KEY

        const validation = validateEnvironment()

        expect(validation.valid).toBe(false)
        expect(validation.missing).toContain('DATABASE_URL')
        expect(validation.missing).toContain('CLERK_SECRET_KEY')
    })

    it('should return valid when all required variables are set', () => {
        // Ensure all required variables are set
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_xxxxx'
        process.env.CLERK_SECRET_KEY = 'sk_test_xxxxx'
        process.env.STRIPE_SECRET = 'sk_test_xxxxx'
        process.env.NEXT_PUBLIC_URL = 'http://localhost:3000'

        const validation = validateEnvironment()

        expect(validation.valid).toBe(true)
        expect(validation.missing).toHaveLength(0)
    })

    it('should treat empty strings as missing variables', () => {
        process.env.DATABASE_URL = ''
        process.env.CLERK_SECRET_KEY = ''

        const isValid = validateCriticalEnvVars()
        expect(isValid).toBe(false)
    })
})
