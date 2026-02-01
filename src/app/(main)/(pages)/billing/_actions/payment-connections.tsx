'use server'

const DEMO_USER_ID = 'demo-user-123'

export const onPaymentDetails = async () => {
    // Return mock data for demo - no database required
    return {
        tier: 'Free',
        credits: '10',
    }
}
