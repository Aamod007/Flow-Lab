import { ClerkWebhookSchema, validateRequest } from '@/lib/validation-schemas'
import { ApiErrorHandler, createSuccessResponse, logError } from '@/lib/api-response'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    // Parse JSON with error handling
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      logError('Clerk Webhook', parseError, { context: 'JSON parsing failed' })
      return ApiErrorHandler.invalidJson('Invalid JSON payload')
    }

    // Validate webhook payload
    const validation = validateRequest(ClerkWebhookSchema, body)
    
    if (!validation.success) {
      logError('Clerk Webhook', validation.error, { body })
      return ApiErrorHandler.validationError(validation.error)
    }

    const { id, email_addresses, first_name, image_url } = validation.data.data
    const email = email_addresses?.[0]?.email_address

    if (!email) {
      return ApiErrorHandler.badRequest('Email address is required')
    }

    // Create or update user in database
    const user = await db.user.upsert({
      where: { clerkId: id },
      update: {
        name: first_name || undefined,
        email: email,
        profileImage: image_url || undefined,
      },
      create: {
        clerkId: id,
        name: first_name || null,
        email: email,
        profileImage: image_url || null,
        tier: 'Free',
        credits: 10,
      }
    })

    return createSuccessResponse({ received: true, userId: id, dbUserId: user.id })
  } catch (error) {
    logError('Clerk Webhook', error)
    return ApiErrorHandler.internalError('Error processing webhook')
  }
}
