'use server'

import { db } from '@/lib/db'

export const getUserData = async (clerkId: string) => {
  if (!clerkId) {
    return null
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId },
      include: {
        connections: true,
      },
    })

    if (!user) {
      return null
    }

    return {
      id: user.id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      tier: user.tier,
      credits: String(user.credits),
      connections: user.connections,
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}
