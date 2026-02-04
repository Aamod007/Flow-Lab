import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { getRequiredEnvVar } from '@/lib/env-validator'
import { ApiErrorHandler, createSuccessResponse, logError } from '@/lib/api-response'
import { PaymentRequestSchema, validateRequest } from '@/lib/validation-schemas'

export async function GET(req: NextRequest) {
  try {
    // Validate environment variables
    const stripeSecret = getRequiredEnvVar('STRIPE_SECRET')
    
    const stripe = new Stripe(stripeSecret, {
      typescript: true,
      apiVersion: '2023-10-16',
    })

    const products = await stripe.prices.list({
      limit: 3,
    })

    return createSuccessResponse(products.data)
  } catch (error) {
    logError('Payment GET', error)
    
    if (error instanceof Error && error.message.includes('Missing required environment variable')) {
      return ApiErrorHandler.missingConfig(error.message)
    }
    
    return ApiErrorHandler.internalError('Failed to fetch payment plans')
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    const stripeSecret = getRequiredEnvVar('STRIPE_SECRET')
    const baseUrl = getRequiredEnvVar('NEXT_PUBLIC_URL')
    
    // Parse and validate request body
    const body = await req.json()
    const validation = validateRequest(PaymentRequestSchema, body)
    
    if (!validation.success) {
      return ApiErrorHandler.validationError(validation.error)
    }
    
    const stripe = new Stripe(stripeSecret, {
      typescript: true,
      apiVersion: '2023-10-16',
    })
    
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: validation.data.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/billing`,
    })
    
    return createSuccessResponse({ url: session.url })
  } catch (error) {
    logError('Payment POST', error, { body: await req.text() })
    
    if (error instanceof Error && error.message.includes('Missing required environment variable')) {
      return ApiErrorHandler.missingConfig(error.message)
    }
    
    if (error instanceof Stripe.errors.StripeError) {
      return ApiErrorHandler.badRequest('Payment processing failed', {
        type: error.type,
        message: error.message,
      })
    }
    
    return ApiErrorHandler.internalError('Failed to create checkout session')
  }
}
