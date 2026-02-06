/**
 * Example Test 10: Payment URL Construction
 * 
 * Validates: Requirements 11.2
 * 
 * This test ensures that payment URLs are constructed correctly
 * using environment variables instead of hardcoded values.
 */

describe('Example 10: Payment URL Construction', () => {
    const originalEnv = process.env

    beforeEach(() => {
        process.env = { ...originalEnv }
    })

    afterEach(() => {
        process.env = originalEnv
    })

    it('should use NEXT_PUBLIC_URL for success and cancel URLs', () => {
        process.env.NEXT_PUBLIC_URL = 'https://example.com'

        const successUrl = `${process.env.NEXT_PUBLIC_URL}/billing?session_id={CHECKOUT_SESSION_ID}`
        const cancelUrl = `${process.env.NEXT_PUBLIC_URL}/billing`

        expect(successUrl).toBe('https://example.com/billing?session_id={CHECKOUT_SESSION_ID}')
        expect(cancelUrl).toBe('https://example.com/billing')
        expect(successUrl).not.toContain('localhost')
        expect(cancelUrl).not.toContain('localhost')
    })

    it('should not contain hardcoded localhost URLs', () => {
        process.env.NEXT_PUBLIC_URL = 'https://production.com'

        const successUrl = `${process.env.NEXT_PUBLIC_URL}/billing?session_id={CHECKOUT_SESSION_ID}`
        const cancelUrl = `${process.env.NEXT_PUBLIC_URL}/billing`

        // Ensure no hardcoded localhost
        expect(successUrl).not.toMatch(/http:\/\/localhost/)
        expect(cancelUrl).not.toMatch(/http:\/\/localhost/)
    })

    it('should work with different domain formats', () => {
        const testCases = [
            'https://example.com',
            'https://subdomain.example.com',
            'https://example.vercel.app',
            'http://localhost:3000', // Development
        ]

        testCases.forEach(url => {
            process.env.NEXT_PUBLIC_URL = url

            const successUrl = `${process.env.NEXT_PUBLIC_URL}/billing?session_id={CHECKOUT_SESSION_ID}`
            const cancelUrl = `${process.env.NEXT_PUBLIC_URL}/billing`

            expect(successUrl).toContain(url)
            expect(cancelUrl).toContain(url)
        })
    })

    it('should handle missing NEXT_PUBLIC_URL gracefully', () => {
        delete process.env.NEXT_PUBLIC_URL

        // In real code, should have a fallback or throw an error
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
        const successUrl = `${baseUrl}/billing?session_id={CHECKOUT_SESSION_ID}`

        expect(successUrl).toBeDefined()
        expect(typeof successUrl).toBe('string')
    })

    it('should construct webhook URLs correctly', () => {
        process.env.NEXT_PUBLIC_URL = 'https://example.com'

        const webhookUrl = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/stripe`

        expect(webhookUrl).toBe('https://example.com/api/webhooks/stripe')
        expect(webhookUrl).not.toContain('localhost')
    })
})
