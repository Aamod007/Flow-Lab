import { NextResponse } from 'next/server'
import { testNotionConnection, listNotionDatabases } from '@/app/(main)/(pages)/connections/_actions/notion-connection'
import { testSlackConnection, listSlackChannels, sendTestSlackMessage } from '@/app/(main)/(pages)/connections/_actions/slack-connection'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const action = searchParams.get('action') || 'test'

    console.log(`[Connection Test] Provider: ${provider}, Action: ${action}`)

    try {
        if (provider === 'notion') {
            if (action === 'test') {
                console.log('[Notion] Testing connection...')
                const result = await testNotionConnection()
                console.log('[Notion] Test result:', result)
                return NextResponse.json(result)
            } else if (action === 'databases') {
                const result = await listNotionDatabases()
                return NextResponse.json(result)
            }
        }

        if (provider === 'slack') {
            if (action === 'test') {
                console.log('[Slack] Testing connection...')
                const result = await testSlackConnection()
                console.log('[Slack] Test result:', result)
                return NextResponse.json(result)
            } else if (action === 'channels') {
                const result = await listSlackChannels()
                return NextResponse.json(result)
            }
        }

        return NextResponse.json({ success: false, message: 'Unknown provider or action' }, { status: 400 })
    } catch (error: any) {
        console.error('[Connection Test] Error:', error)
        return NextResponse.json({ 
            success: false, 
            message: error.message || 'Unknown error occurred',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const action = searchParams.get('action')

    try {
        const body = await request.json()

        if (provider === 'slack' && action === 'send') {
            const result = await sendTestSlackMessage(body.channelId, body.message)
            return NextResponse.json(result)
        }

        return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
}
