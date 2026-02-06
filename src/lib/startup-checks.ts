/**
 * Startup Validation Script
 * 
 * This module provides utilities for validating the application's
 * startup configuration, including environment variables and database connectivity.
 */

import { validateEnvironment } from './env-validator'

export interface StartupCheckResult {
    success: boolean
    checks: {
        environment: {
            valid: boolean
            missing?: string[]
        }
        database: {
            connected: boolean
            error?: string
        }
    }
    errors: string[]
}

/**
 * Performs comprehensive startup checks
 * @returns StartupCheckResult with detailed status of all checks
 */
export async function performStartupChecks(): Promise<StartupCheckResult> {
    const errors: string[] = []
    const result: StartupCheckResult = {
        success: true,
        checks: {
            environment: {
                valid: true,
            },
            database: {
                connected: false,
            },
        },
        errors: [],
    }

    // Check 1: Environment Variables
    const envValidation = validateEnvironment()
    result.checks.environment = {
        valid: envValidation.valid,
        missing: envValidation.missing,
    }

    if (!envValidation.valid) {
        errors.push(`Missing environment variables: ${envValidation.missing.join(', ')}`)
        result.success = false
    }

    // Check 2: Database Connection
    try {
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()

        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1`
        await prisma.$disconnect()

        result.checks.database.connected = true
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown database error'
        result.checks.database.connected = false
        result.checks.database.error = errorMessage
        errors.push(`Database connection failed: ${errorMessage}`)
        result.success = false
    }

    result.errors = errors
    return result
}

/**
 * Validates that all critical environment variables are set
 * @returns true if all critical variables are present
 */
export function validateCriticalEnvVars(): boolean {
    const critical = [
        'DATABASE_URL',
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'CLERK_SECRET_KEY',
    ]

    return critical.every(varName => {
        const value = process.env[varName]
        return value !== undefined && value !== ''
    })
}

/**
 * Checks database connectivity
 * @returns Promise<boolean> true if database is accessible
 */
export async function checkDatabaseConnection(): Promise<boolean> {
    try {
        const { PrismaClient } = await import('@prisma/client')
        const prisma = new PrismaClient()

        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1`
        await prisma.$disconnect()

        return true
    } catch (error) {
        console.error('Database connection check failed:', error)
        return false
    }
}

/**
 * Logs startup check results to console
 * @param result StartupCheckResult to log
 */
export function logStartupChecks(result: StartupCheckResult): void {
    console.log('=== Startup Checks ===')
    console.log(`Environment: ${result.checks.environment.valid ? '✓' : '✗'}`)
    console.log(`Database: ${result.checks.database.connected ? '✓' : '✗'}`)

    if (result.errors.length > 0) {
        console.error('Errors:')
        result.errors.forEach(error => console.error(`  - ${error}`))
    }

    console.log(`Overall Status: ${result.success ? 'READY' : 'NOT READY'}`)
    console.log('====================')
}
