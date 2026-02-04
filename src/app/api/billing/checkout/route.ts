/**
 * POST /api/billing/checkout
 * Create Stripe checkout session
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { priceId, productId } = body

    if (!priceId && !productId) {
      return NextResponse.json(
        { error: 'Price ID or Product ID is required' },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get price ID if only product ID provided
    let checkoutPriceId = priceId
    if (!checkoutPriceId && productId) {
      const product = await stripe.products.retrieve(productId, {
        expand: ['default_price']
      })
      const defaultPrice = product.default_price as Stripe.Price | null
      checkoutPriceId = defaultPrice?.id
    }

    if (!checkoutPriceId) {
      return NextResponse.json(
        { error: 'Could not determine price' },
        { status: 400 }
      )
    }

    // For now, we create a new Stripe customer each time since stripeId isn't stored
    // In production, you should add a stripeId field to the User model
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: {
        userId: String(user.id),
        clerkId: userId
      }
    })
    const customerId = customer.id

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: checkoutPriceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        clerkId: userId
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[Billing Checkout POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
