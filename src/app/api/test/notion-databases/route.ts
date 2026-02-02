/**
 * GET /api/test/notion-databases
 * 
 * Get list of Notion databases the bot has access to
 */

import { NextResponse } from 'next/server'
import { listNotionDatabases } from '@/app/(main)/(pages)/connections/_actions/notion-connection'

export async function GET() {
  try {
    const result = await listNotionDatabases()
    
    return NextResponse.json({
      success: result.success,
      databases: result.databases,
      count: result.databases.length,
      message: result.message,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list databases',
      databases: []
    }, { status: 500 })
  }
}
