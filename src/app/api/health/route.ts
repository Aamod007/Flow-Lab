/**
 * Health Check Endpoint
 * Used for monitoring and deployment verification
 */

import { createSuccessResponse, ApiErrorHandler } from '@/lib/api-response'
import { validateEnvironment } from '@/lib/env-validator'

export async function GET() {
  try {
    // Check environment variables
    const envValidation = validateEnvironment()
    
    if (!envValidation.valid) {
      return ApiErrorHandler.missingConfig(
        `Missing environment variables: ${envValidation.missing.join(', ')}`
      )
    }

    // Check database connection (basic check)
    let databaseStatus = 'unknown'
    try {
      // Import Prisma client dynamically to avoid issues if DB is not configured
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      await prisma.$connect()
      await prisma.$disconnect()
      databaseStatus = 'connected'
    } catch (dbError) {
      databaseStatus = 'disconnected'
      console.error('Database health check failed:', dbError)
    }

    return createSuccessResponse({
      status: 'healthy',
      environment: envValidation.valid ? 'configured' : 'misconfigured',
      database: databaseStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
    })
  } catch (error) {
    return ApiErrorHandler.internalError('Health check failed')
  }
}
