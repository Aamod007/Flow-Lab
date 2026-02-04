'use client'

import { useBilling } from '@/providers/billing-provider'
import React, { useEffect, useState } from 'react'
import { SubscriptionCard } from './subscription-card'
import CreditTracker from './credits-tracker'

type Props = {}

const BillingDashboard = (props: Props) => {
  const { credits, tier } = useBilling()
  const [stripeProducts, setStripeProducts] = useState<any>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/billing/products')
        if (response.ok) {
          const data = await response.json()
          setStripeProducts(data.products || [])
        } else {
          // Fallback products if API not configured
          setStripeProducts([
            {
              id: 'price_unlimited',
              nickname: 'Unlimited',
              unit_amount: 9999,
              metadata: { credits: 'Unlimited' }
            },
            {
              id: 'price_pro',
              nickname: 'Pro',
              unit_amount: 2999,
              metadata: { credits: '100' }
            },
            {
              id: 'price_free',
              nickname: 'Free',
              unit_amount: 0,
              metadata: { credits: '10' }
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        // Fallback products
        setStripeProducts([
          {
            id: 'price_unlimited',
            nickname: 'Unlimited',
            unit_amount: 9999,
            metadata: { credits: 'Unlimited' }
          },
          {
            id: 'price_pro',
            nickname: 'Pro',
            unit_amount: 2999,
            metadata: { credits: '100' }
          },
          {
            id: 'price_free',
            nickname: 'Free',
            unit_amount: 0,
            metadata: { credits: '10' }
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const onPayment = async (id: string) => {
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: id })
      })
      
      if (response.ok) {
        const { url } = await response.json()
        if (url) {
          window.location.href = url
        }
      } else {
        console.error('Payment initiation failed')
        alert('Payment feature requires Stripe configuration')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment feature requires Stripe configuration')
    }
  }

  return (
    <>
      <div className="flex gap-5 p-6">
        <SubscriptionCard
          onPayment={onPayment}
          tier={tier as string}
          products={stripeProducts}
        />
      </div>
      <CreditTracker
        tier={tier}
        credits={credits}
      />
    </>
  )
}

export default BillingDashboard
