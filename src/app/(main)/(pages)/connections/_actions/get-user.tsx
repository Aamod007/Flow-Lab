'use server'

// Mock user data for demo mode - no database required

export const getUserData = async (id: string) => {
  // Return mock user data for demo
  return {
    id: 1,
    clerkId: id || 'demo-user-123',
    name: 'Demo User',
    email: 'demo@example.com',
    profileImage: null,
    tier: 'Free',
    credits: '10',
    connections: []
  }
}
