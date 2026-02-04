'use client'

import React from 'react'
import { Tier } from '@prisma/client'

type BillingProviderProps = {
  credits: number
  tier: Tier
  setCredits: React.Dispatch<React.SetStateAction<number>>
  setTier: React.Dispatch<React.SetStateAction<Tier>>
}

const initialValues: BillingProviderProps = {
  credits: 10,
  setCredits: () => undefined,
  tier: Tier.Free,
  setTier: () => undefined,
}

type WithChildProps = {
  children: React.ReactNode
}

const context = React.createContext(initialValues)
const { Provider } = context

export const BillingProvider = ({ children }: WithChildProps) => {
  const [credits, setCredits] = React.useState(initialValues.credits)
  const [tier, setTier] = React.useState(initialValues.tier)

  const values = {
    credits,
    setCredits,
    tier,
    setTier,
  }

  return <Provider value={values}>{children}</Provider>
}

export const useBilling = () => {
  const state = React.useContext(context)
  if (!state) {
    throw new Error('useBilling must be used within BillingProvider')
  }
  return state
}
