'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DollarSign, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'

interface CostDataItem {
    provider: string
    model: string
    calls: number
    tokens: string
    cost: number
}

export const CostDashboard = () => {
    const [costData, setCostData] = useState<CostDataItem[]>([])
    const [loading, setLoading] = useState(true)
    const budget = 50.00

    useEffect(() => {
        fetchCostData()
    }, [])

    const fetchCostData = async () => {
        try {
            const response = await fetch('/api/analytics/cost')
            if (response.ok) {
                const data = await response.json()
                setCostData(data.breakdown || [])
            } else {
                // If API doesn't exist yet, show empty state
                setCostData([])
            }
        } catch (error) {
            console.error('Error fetching cost data:', error)
            setCostData([])
        } finally {
            setLoading(false)
        }
    }

    const totalCost = costData.reduce((acc, curr) => acc + curr.cost, 0)
    const percentage = (totalCost / budget) * 100

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost (MTD)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Current month spending</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Projected Cost</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(totalCost * 1.5).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Based on current usage</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{percentage.toFixed(1)}%</div>
                        <Progress value={Math.min(percentage, 100)} className="h-2 mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">${Math.max(budget - totalCost, 0).toFixed(2)} remaining</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cost Breakdown</CardTitle>
                    <CardDescription>Usage by provider and model for the current month.</CardDescription>
                </CardHeader>
                <CardContent>
                    {costData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No usage data yet. Start using AI providers to see cost breakdown.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead className="text-right">Calls</TableHead>
                                    <TableHead className="text-right">Tokens</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {costData.map((item, index) => (
                                    <TableRow key={`${item.model}-${index}`}>
                                        <TableCell className="font-medium">{item.provider}</TableCell>
                                        <TableCell>{item.model}</TableCell>
                                        <TableCell className="text-right">{item.calls}</TableCell>
                                        <TableCell className="text-right">{item.tokens}</TableCell>
                                        <TableCell className="text-right">${item.cost.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default CostDashboard
