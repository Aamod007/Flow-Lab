/**
 * GET /api/billing/products
 * Get available Stripe products/pricing
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import Stripe from 'stripe'
import { safeParseJson, StripeProductFeaturesSchema } from '@/lib/validation-schemas'

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null

export async function GET() {
  try {
    const { userId } = auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // If Stripe is not configured, return default products
    if (!stripe) {
      return NextResponse.json({
        products: [
          {
            id: 'free',
            name: 'Free',
            description: 'Get started with basic features',
            price: 0,
            interval: 'month',
            features: [
              '5 Workflows',
              '100 Executions/month',
              'Basic AI Models',
              'Community Support'
            ]
          },
          {
            id: 'pro',
            name: 'Pro',
            description: 'For professionals and small teams',
            price: 29,
            interval: 'month',
            features: [
              'Unlimited Workflows',
              '10,000 Executions/month',
              'All AI Models',
              'Priority Support',
              'Advanced Analytics'
            ]
          },
          {
            id: 'enterprise',
            name: 'Enterprise',
            description: 'For large organizations',
            price: 99,
            interval: 'month',
            features: [
              'Everything in Pro',
              'Unlimited Executions',
              'Custom AI Models',
              'Dedicated Support',
              'SLA Guarantee',
              'Custom Integrations'
            ]
          }
        ]
      })
    }

    // Fetch actual Stripe products
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    })

    const formattedProducts = products.data.map(product => {
      const price = product.default_price as Stripe.Price | null
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: price?.unit_amount ? price.unit_amount / 100 : 0,
        interval: price?.recurring?.interval || 'month',
        priceId: price?.id,
        features: safeParseJson(StripeProductFeaturesSchema, product.metadata?.features) || []
      }
    })

    return NextResponse.json({ products: formattedProducts })
  } catch (error) {
    console.error('[Billing Products GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
