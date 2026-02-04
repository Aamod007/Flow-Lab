'use server'

import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs'

export const onPaymentDetails = async () => {
    const { userId } = auth()
    
    if (!userId) {
        return {
            tier: 'Free',
            credits: '10',
        }
    }

    try {
        const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: {
                tier: true,
                credits: true,
            },
        })

        if (!user) {
            return {
                tier: 'Free',
                credits: '10',
            }
        }

        return {
            tier: user.tier,
            credits: String(user.credits),
        }
    } catch (error) {
        console.error('Error fetching payment details:', error)
        return {
            tier: 'Free',
            credits: '10',
        }
    }
}
