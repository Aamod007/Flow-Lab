'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    AlertTriangle,
    Bell,
    BellOff,
    DollarSign,
    Settings,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface BudgetAlert {
    id: string
    type: 'warning' | 'critical' | 'info'
    title: string
    message: string
    timestamp: Date
    acknowledged: boolean
}

interface BudgetSettings {
    monthlyBudget: number
    warningThreshold: number // percentage
    criticalThreshold: number // percentage
    alertsEnabled: boolean
    emailAlerts: boolean
    slackAlerts: boolean
}

const DEFAULT_SETTINGS: BudgetSettings = {
    monthlyBudget: 50,
    warningThreshold: 70,
    criticalThreshold: 90,
    alertsEnabled: true,
    emailAlerts: true,
    slackAlerts: false,
}

export const BudgetAlerts = () => {
    const [settings, setSettings] = useState<BudgetSettings>(DEFAULT_SETTINGS)
    const [alerts, setAlerts] = useState<BudgetAlert[]>([])
    const [currentSpend, setCurrentSpend] = useState(0)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    // Fetch budget data from API
    useEffect(() => {
        const fetchBudgetData = async () => {
            try {
                const response = await fetch('/api/billing/budget')
                if (response.ok) {
                    const data = await response.json()
                    setCurrentSpend(data.currentSpend || 0)
                    if (data.settings) {
                        setSettings(prev => ({
                            ...prev,
                            ...data.settings
                        }))
                    }
                } else {
                    // If API not ready, start with 0
                    setCurrentSpend(0)
                }
            } catch (error) {
                console.error('Error fetching budget data:', error)
                setCurrentSpend(0)
            } finally {
                setLoading(false)
            }
        }

        fetchBudgetData()
    }, [])

    // Generate alerts based on current spend
    useEffect(() => {
        if (loading) return
        
        const newAlerts: BudgetAlert[] = []
        const percentUsed = settings.monthlyBudget > 0 
            ? (currentSpend / settings.monthlyBudget) * 100 
            : 0

        if (percentUsed >= settings.criticalThreshold) {
            newAlerts.push({
                id: '1',
                type: 'critical',
                title: 'Budget Critical',
                message: `You've used ${percentUsed.toFixed(1)}% of your monthly budget`,
                timestamp: new Date(),
                acknowledged: false
            })
        } else if (percentUsed >= settings.warningThreshold) {
            newAlerts.push({
                id: '2',
                type: 'warning',
                title: 'Budget Warning',
                message: `You've used ${percentUsed.toFixed(1)}% of your monthly budget`,
                timestamp: new Date(),
                acknowledged: false
            })
        }

        setAlerts(newAlerts)
    }, [settings, currentSpend, loading])

    const percentUsed = (currentSpend / settings.monthlyBudget) * 100
    const remaining = settings.monthlyBudget - currentSpend
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const dayOfMonth = new Date().getDate()
    const projectedSpend = (currentSpend / dayOfMonth) * daysInMonth

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
            case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
            default: return <TrendingUp className="h-4 w-4 text-blue-500" />
        }
    }

    const getAlertColor = (type: string) => {
        switch (type) {
            case 'critical': return 'border-red-500/50 bg-red-500/10'
            case 'warning': return 'border-yellow-500/50 bg-yellow-500/10'
            default: return 'border-blue-500/50 bg-blue-500/10'
        }
    }

    const acknowledgeAlert = (id: string) => {
        setAlerts(alerts.map(a => 
            a.id === id ? { ...a, acknowledged: true } : a
        ))
    }

    const dismissAlert = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id))
    }

    const saveSettings = () => {
        // In real app, save to API
        toast.success('Budget settings saved')
        setIsSettingsOpen(false)
    }

    const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length

    return (
        <div className="space-y-4">
            {/* Budget Overview Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Budget Overview
                            </CardTitle>
                            <CardDescription>
                                Track your AI spending against your budget
                            </CardDescription>
                        </div>
                        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configure
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Budget Settings</DialogTitle>
                                    <DialogDescription>
                                        Configure your budget limits and alert thresholds
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                        <Label>Monthly Budget ($)</Label>
                                        <Input
                                            type="number"
                                            value={settings.monthlyBudget}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                monthlyBudget: parseFloat(e.target.value) || 0
                                            })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Warning Threshold ({settings.warningThreshold}%)</Label>
                                        <Input
                                            type="range"
                                            min={50}
                                            max={95}
                                            value={settings.warningThreshold}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                warningThreshold: parseInt(e.target.value)
                                            })}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Critical Threshold ({settings.criticalThreshold}%)</Label>
                                        <Input
                                            type="range"
                                            min={60}
                                            max={100}
                                            value={settings.criticalThreshold}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                criticalThreshold: parseInt(e.target.value)
                                            })}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Enable Alerts</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Receive notifications when thresholds are reached
                                                </p>
                                            </div>
                                            <Switch
                                                checked={settings.alertsEnabled}
                                                onCheckedChange={(checked) => setSettings({
                                                    ...settings,
                                                    alertsEnabled: checked
                                                })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Email Alerts</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Send alerts via email
                                                </p>
                                            </div>
                                            <Switch
                                                checked={settings.emailAlerts}
                                                disabled={!settings.alertsEnabled}
                                                onCheckedChange={(checked) => setSettings({
                                                    ...settings,
                                                    emailAlerts: checked
                                                })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label>Slack Alerts</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    Send alerts to Slack
                                                </p>
                                            </div>
                                            <Switch
                                                checked={settings.slackAlerts}
                                                disabled={!settings.alertsEnabled}
                                                onCheckedChange={(checked) => setSettings({
                                                    ...settings,
                                                    slackAlerts: checked
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={saveSettings}>
                                        Save Settings
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Current Spend */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-baseline">
                            <div>
                                <span className="text-3xl font-bold">${currentSpend.toFixed(2)}</span>
                                <span className="text-muted-foreground"> / ${settings.monthlyBudget.toFixed(2)}</span>
                            </div>
                            <Badge
                                variant="outline"
                                className={cn(
                                    percentUsed >= settings.criticalThreshold && "border-red-500 text-red-500",
                                    percentUsed >= settings.warningThreshold && percentUsed < settings.criticalThreshold && "border-yellow-500 text-yellow-500",
                                    percentUsed < settings.warningThreshold && "border-green-500 text-green-500"
                                )}
                            >
                                {percentUsed.toFixed(1)}% used
                            </Badge>
                        </div>

                        {/* Progress Bar with Thresholds */}
                        <div className="relative">
                            <Progress
                                value={percentUsed}
                                className={cn(
                                    "h-3",
                                    percentUsed >= settings.criticalThreshold && "[&>div]:bg-red-500",
                                    percentUsed >= settings.warningThreshold && percentUsed < settings.criticalThreshold && "[&>div]:bg-yellow-500"
                                )}
                            />
                            {/* Threshold markers */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-yellow-500"
                                style={{ left: `${settings.warningThreshold}%` }}
                                title={`Warning: ${settings.warningThreshold}%`}
                            />
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                                style={{ left: `${settings.criticalThreshold}%` }}
                                title={`Critical: ${settings.criticalThreshold}%`}
                            />
                        </div>

                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                ${remaining.toFixed(2)} remaining
                            </span>
                            <span className={cn(
                                projectedSpend > settings.monthlyBudget 
                                    ? "text-red-500" 
                                    : "text-muted-foreground"
                            )}>
                                Projected: ${projectedSpend.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Daily Budget */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                            <p className="text-2xl font-semibold">
                                ${(settings.monthlyBudget / daysInMonth).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">Daily Budget</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-semibold">
                                ${(currentSpend / dayOfMonth).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">Daily Average</p>
                        </div>
                        <div className="text-center">
                            <p className={cn(
                                "text-2xl font-semibold",
                                remaining / (daysInMonth - dayOfMonth) < (settings.monthlyBudget / daysInMonth)
                                    ? "text-red-500"
                                    : "text-green-500"
                            )}>
                                ${(remaining / (daysInMonth - dayOfMonth)).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">Daily Allowance</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            {settings.alertsEnabled ? (
                                <Bell className="h-5 w-5" />
                            ) : (
                                <BellOff className="h-5 w-5 text-muted-foreground" />
                            )}
                            Budget Alerts
                            {unacknowledgedCount > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {unacknowledgedCount}
                                </Badge>
                            )}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {alerts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                            <p className="font-medium">No alerts</p>
                            <p className="text-sm">You're within your budget limits</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        "p-4 rounded-lg border transition-all",
                                        getAlertColor(alert.type),
                                        alert.acknowledged && "opacity-60"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            {getAlertIcon(alert.type)}
                                            <div>
                                                <h4 className="font-medium">{alert.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {alert.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {alert.timestamp.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!alert.acknowledged && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => acknowledgeAlert(alert.id)}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => dismissAlert(alert.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default BudgetAlerts
