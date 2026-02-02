import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

type Props = {
    credits: number
    tier: string
}

const CreditTracker = ({ credits, tier }: Props) => {
    // Calculate max credits based on tier
    const maxCredits = tier === 'Free' ? 10 : tier === 'Pro' ? 100 : 0
    const progressValue = tier === 'Unlimited' ? 100 : maxCredits > 0 ? (credits / maxCredits) * 100 : 0

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
                            {tier === 'Unlimited' ? 'Unlimited' : `${credits}/${maxCredits}`}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default CreditTracker
