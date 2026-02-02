/**
 * GET/POST /api/analytics/budget
 * Manage user budget settings for AI cost control
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    const currentUsage = costTracking?.totalCost || 0
    const percentUsed = (currentUsage / budgetSettings.monthlyLimit) * 100

    return NextResponse.json({
      settings: budgetSettings,
      usage: {
        currentMonth,
        currentUsage,
        monthlyLimit: budgetSettings.monthlyLimit,
        percentUsed: Math.min(percentUsed, 100),
        remaining: Math.max(budgetSettings.monthlyLimit - currentUsage, 0),
        isOverLimit: currentUsage >= budgetSettings.monthlyLimit,
        isNearLimit: percentUsed >= 80
      }
    })
  } catch (error) {
    console.error('[Budget GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      monthlyLimit,
      alertAt80,
      alertAt100,
      actionOnLimit,
      gracePeriodDays,
      emailAlerts,
      slackAlerts
    } = body

    // Validate inputs
    if (monthlyLimit !== undefined && (typeof monthlyLimit !== 'number' || monthlyLimit < 0)) {
      return NextResponse.json(
        { error: 'Invalid monthly limit' },
        { status: 400 }
      )
    }

    if (actionOnLimit && !['NOTIFY', 'PAUSE_ALL', 'PAUSE_PAID'].includes(actionOnLimit)) {
      return NextResponse.json(
        { error: 'Invalid action on limit' },
        { status: 400 }
      )
    }

    // Update or create budget settings
    const budgetSettings = await db.budgetSettings.upsert({
      where: { userId },
      update: {
        ...(monthlyLimit !== undefined && { monthlyLimit }),
        ...(alertAt80 !== undefined && { alertAt80 }),
        ...(alertAt100 !== undefined && { alertAt100 }),
        ...(actionOnLimit && { actionOnLimit }),
        ...(gracePeriodDays !== undefined && { gracePeriodDays }),
        ...(emailAlerts !== undefined && { emailAlerts }),
        ...(slackAlerts !== undefined && { slackAlerts })
      },
      create: {
        userId,
        monthlyLimit: monthlyLimit || 50.0,
        alertAt80: alertAt80 ?? true,
        alertAt100: alertAt100 ?? true,
        actionOnLimit: actionOnLimit || 'NOTIFY',
        gracePeriodDays: gracePeriodDays || 1,
        emailAlerts: emailAlerts ?? true,
        slackAlerts: slackAlerts ?? false
      }
    })

    return NextResponse.json({
      success: true,
      settings: budgetSettings
    })
  } catch (error) {
    console.error('[Budget POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update budget settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  // Alias for POST
  return POST(request)
}
