import { ClerkWebhookSchema, validateRequest } from '@/lib/validation-schemas'
import { ApiErrorHandler, createSuccessResponse, logError } from '@/lib/api-response'

// Mock Clerk webhook handler - no database required for demo mode

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

    const { id, email_addresses, first_name } = validation.data.data
    const email = email_addresses?.[0]?.email_address

    console.log('✅ Clerk webhook received:', { id, email, first_name })

    // Mock response - no database update in demo mode
    return createSuccessResponse({ received: true, userId: id })
  } catch (error) {
    logError('Clerk Webhook', error)
    return ApiErrorHandler.internalError('Error processing webhook')
  }
}
