/**
 * Example Test 19: Health Check Endpoint
 * 
 * Validates: Requirements 18.1, 18.2, 18.5
 * 
 * This test ensures that the health check endpoint returns
 * correct status information for monitoring and deployment verification.
 */

import { GET } from '@/app/api/health/route'

describe('Example 19: Health Check Endpoint', () => {
    it('should return 200 status code when healthy', async () => {
        const response = await GET()

        expect(response.status).toBe(200)
    })

    it('should return JSON response with health status', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data).toHaveProperty('status')
        expect(data).toHaveProperty('timestamp')
    })

    it('should include environment configuration status', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data).toHaveProperty('environment')
        expect(['configured', 'misconfigured']).toContain(data.environment)
    })

    it('should include database connection status', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data).toHaveProperty('database')
        expect(['connected', 'disconnected', 'unknown']).toContain(data.database)
    })

    it('should include timestamp in ISO format', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data.timestamp).toBeDefined()

        // Verify it's a valid ISO timestamp
        const timestamp = new Date(data.timestamp)
        expect(timestamp.toISOString()).toBe(data.timestamp)
    })

    it('should include version information', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data).toHaveProperty('version')
        expect(typeof data.version).toBe('string')
    })

    it('should return error status when environment is misconfigured', async () => {
        // Save original env vars
        const originalClerkKey = process.env.CLERK_SECRET_KEY
        const originalDbUrl = process.env.DATABASE_URL

        try {
            // Remove critical env vars
            delete process.env.CLERK_SECRET_KEY
            delete process.env.DATABASE_URL

            const response = await GET()

            // Should still return a response, not crash
            expect(response).toBeDefined()
            expect(response.status).toBeGreaterThanOrEqual(400)
        } finally {
            // Restore env vars
            if (originalClerkKey) process.env.CLERK_SECRET_KEY = originalClerkKey
            if (originalDbUrl) process.env.DATABASE_URL = originalDbUrl
        }
    })

    it('should handle database connection failures gracefully', async () => {
        const originalDbUrl = process.env.DATABASE_URL

        try {
            // Set invalid database URL
            process.env.DATABASE_URL = 'postgresql://invalid:invalid@localhost:5432/invalid'

            const response = await GET()
            const data = await response.json()

            // Should return response with database status
            expect(data).toHaveProperty('database')
            // Database should be disconnected or unknown
            expect(['disconnected', 'unknown']).toContain(data.database)
        } finally {
            if (originalDbUrl) process.env.DATABASE_URL = originalDbUrl
        }
    })
})
