/**
 * GET /api/billing/budget
 * Get billing budget information (redirects to analytics budget)
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get budget settings
    let budgetSettings = await db.budgetSettings.findUnique({
      where: { userId }
    })

    // Create default settings if not exists
    if (!budgetSettings) {
      budgetSettings = await db.budgetSettings.create({
        data: {
          userId,
          monthlyLimit: 50.0,
          alertAt80: true,
          alertAt100: true,
          actionOnLimit: 'NOTIFY',
          gracePeriodDays: 1,
          emailAlerts: true,
          slackAlerts: false
        }
      })
    }

    // Get current month's usage
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    const costTracking = await db.costTracking.findUnique({
      where: {
        userId_month: {
          userId,
          month: currentMonth
        }
      }
    })

    const currentSpend = costTracking?.totalCost || 0
    const percentUsed = (currentSpend / budgetSettings.monthlyLimit) * 100

    return NextResponse.json({
      budgetLimit: budgetSettings.monthlyLimit,
      currentSpend,
      percentUsed: Math.min(percentUsed, 100),
      remaining: Math.max(budgetSettings.monthlyLimit - currentSpend, 0),
      isOverBudget: currentSpend >= budgetSettings.monthlyLimit,
      isNearLimit: percentUsed >= 80,
      settings: {
        alertAt80: budgetSettings.alertAt80,
        alertAt100: budgetSettings.alertAt100,
        actionOnLimit: budgetSettings.actionOnLimit,
        emailAlerts: budgetSettings.emailAlerts
      }
    })
  } catch (error) {
    console.error('[Billing Budget GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    )
  }
}
