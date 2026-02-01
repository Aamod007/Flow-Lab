'use client'

import React from 'react'
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
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

const MOCK_COST_DATA = [
    { provider: 'OpenAI', model: 'GPT-4', calls: 142, tokens: '142k', cost: 4.26 },
    { provider: 'Anthropic', model: 'Claude 3 Sonnet', calls: 89, tokens: '890k', cost: 2.67 },
    { provider: 'Google', model: 'Gemini Pro', calls: 350, tokens: '3.5M', cost: 0.00 }, // Free tier assumption
    { provider: 'Ollama', model: 'Llama 3', calls: 1200, tokens: '12M', cost: 0.00 },
]

export const CostDashboard = () => {
    const totalCost = MOCK_COST_DATA.reduce((acc, curr) => acc + curr.cost, 0)
    const budget = 50.00
    const percentage = (totalCost / budget) * 100

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
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
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
                        <Progress value={percentage} className="h-2 mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">${(budget - totalCost).toFixed(2)} remaining</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cost Breakdown</CardTitle>
                    <CardDescription>Usage by provider and model for the current month.</CardDescription>
                </CardHeader>
                <CardContent>
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
                            {MOCK_COST_DATA.map((item) => (
                                <TableRow key={item.model}>
                                    <TableCell className="font-medium">{item.provider}</TableCell>
                                    <TableCell>{item.model}</TableCell>
                                    <TableCell className="text-right">{item.calls}</TableCell>
                                    <TableCell className="text-right">{item.tokens}</TableCell>
                                    <TableCell className="text-right">${item.cost.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

export default CostDashboard
