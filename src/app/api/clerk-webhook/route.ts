import { NextResponse } from 'next/server'

// Mock Clerk webhook handler - no database required for demo mode

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, email_addresses, first_name, image_url } = body?.data

    const email = email_addresses[0]?.email_address
    console.log('✅ Clerk webhook received:', { id, email, first_name })

    // Mock response - no database update in demo mode
    return new NextResponse('User webhook processed successfully', {
      status: 200,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new NextResponse('Error processing webhook', { status: 500 })
  }
}
