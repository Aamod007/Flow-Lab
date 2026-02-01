'use client'

import { useBilling } from '@/providers/billing-provider'
import React, { useEffect, useState } from 'react'
import { SubscriptionCard } from './subscription-card'
import CreditTracker from './credits-tracker'

type Props = {}

const BillingDashboard = (props: Props) => {
  const { credits, tier } = useBilling()
  const [stripeProducts, setStripeProducts] = useState<any>([])
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    // Mock Stripe products for demo - order: Unlimited, Pro, Free
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
  }, [])

  const onPayment = async (id: string) => {
    console.log('Payment initiated for:', id)
    alert('Payment feature requires Stripe integration')
  }

  return (
    <>
      <div className="flex gap-5 p-6">
        <SubscriptionCard
          onPayment={onPayment}
          tier={tier}
          products={stripeProducts}
        />
      </div>
      <CreditTracker
        tier={tier}
        credits={parseInt(credits)}
      />
    </>
  )
}

export default BillingDashboard
