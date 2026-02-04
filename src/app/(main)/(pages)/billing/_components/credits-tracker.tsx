import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Tier } from '@prisma/client'

type Props = {
    credits: number
    tier: Tier
}

const CreditTracker = ({ credits, tier }: Props) => {
    // Calculate max credits based on tier
    const maxCredits = tier === Tier.Free ? 10 : tier === Tier.Pro ? 100 : 0
    const progressValue = tier === Tier.Unlimited ? 100 : maxCredits > 0 ? (credits / maxCredits) * 100 : 0

    return (
        <div className="p-6">
            <Card className="p-6">
                <CardContent className="flex flex-col gap-6">
                    <CardTitle className="font-light">Credit Tracker</CardTitle>
                    <Progress
                        value={progressValue}
                        className="w-full"
                    />
                    <div className="flex justify-end">
                        <p>
                            {tier === Tier.Unlimited ? 'Unlimited' : `${credits}/${maxCredits}`}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default CreditTracker
