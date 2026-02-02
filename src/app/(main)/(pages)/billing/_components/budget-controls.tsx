'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DollarSign, 
  Bell, 
  AlertTriangle, 
  Save, 
  Loader2,
  Shield,
  Pause,
  Play
} from 'lucide-react'
import { toast } from 'sonner'

interface BudgetSettings {
  monthlyLimit: number
  alertAt80: boolean
  alertAt100: boolean
  actionOnLimit: 'NOTIFY' | 'PAUSE_ALL' | 'PAUSE_PAID'
  gracePeriodDays: number
  emailAlerts: boolean
  slackAlerts: boolean
}

export function BudgetControls() {
  const [settings, setSettings] = useState<BudgetSettings>({
    monthlyLimit: 50,
    alertAt80: true,
    alertAt100: true,
    actionOnLimit: 'NOTIFY',
    gracePeriodDays: 1,
    emailAlerts: true,
    slackAlerts: false
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentUsage, setCurrentUsage] = useState(0)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/budget')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings({
            monthlyLimit: data.settings.monthlyLimit ?? 50,
            alertAt80: data.settings.alertAt80 ?? true,
            alertAt100: data.settings.alertAt100 ?? true,
            actionOnLimit: data.settings.actionOnLimit ?? 'NOTIFY',
            gracePeriodDays: data.settings.gracePeriodDays ?? 1,
            emailAlerts: data.settings.emailAlerts ?? true,
            slackAlerts: data.settings.slackAlerts ?? false
          })
        }
        if (data.usage) {
          setCurrentUsage(data.usage.currentUsage)
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/analytics/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save')
      }
      
      toast.success('Budget settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const usagePercentage = (currentUsage / settings.monthlyLimit) * 100
  const isNearLimit = usagePercentage >= 80
  const isAtLimit = usagePercentage >= 100

  if (loading) {
    return (
      <Card className="border-neutral-800 bg-neutral-900/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-neutral-800 bg-neutral-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-500" />
          Budget Controls
        </CardTitle>
        <CardDescription>
          Set spending limits and alerts to control your AI costs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Usage Indicator */}
        <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Current Month Usage</span>
            <span className={`font-semibold ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-green-500'}`}>
              ${currentUsage.toFixed(2)} / ${settings.monthlyLimit.toFixed(2)}
            </span>
          </div>
          <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isAtLimit 
              ? '⚠️ Budget limit reached!' 
              : isNearLimit 
                ? '⚠️ Approaching budget limit' 
                : `${(settings.monthlyLimit - currentUsage).toFixed(2)} remaining`
            }
          </p>
        </div>

        {/* Monthly Limit */}
        <div className="space-y-3">
          <Label htmlFor="monthlyLimit" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Monthly Budget Limit
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="monthlyLimit"
              type="number"
              min={1}
              max={1000}
              step={5}
              value={settings.monthlyLimit}
              onChange={(e) => setSettings({ ...settings, monthlyLimit: Number(e.target.value) })}
              className="w-32 bg-neutral-800 border-neutral-700"
            />
            <Slider
              value={[settings.monthlyLimit]}
              onValueChange={([value]) => setSettings({ ...settings, monthlyLimit: value })}
              min={5}
              max={500}
              step={5}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Set your maximum monthly AI spending limit
          </p>
        </div>

        {/* Alert Thresholds */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            Alert Notifications
          </Label>
          
          <div className="space-y-3 pl-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.alertAt80}
                  onCheckedChange={(checked) => setSettings({ ...settings, alertAt80: checked })}
                />
                <div>
                  <p className="text-sm">Alert at 80%</p>
                  <p className="text-xs text-muted-foreground">
                    Notify when spending reaches ${(settings.monthlyLimit * 0.8).toFixed(2)}
                  </p>
                </div>
              </div>
              <span className="text-yellow-500 text-sm">Warning</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.alertAt100}
                  onCheckedChange={(checked) => setSettings({ ...settings, alertAt100: checked })}
                />
                <div>
                  <p className="text-sm">Alert at 100%</p>
                  <p className="text-xs text-muted-foreground">
                    Notify when limit is reached
                  </p>
                </div>
              </div>
              <span className="text-red-500 text-sm">Critical</span>
            </div>
          </div>
        </div>

        {/* Action on Limit */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            When Budget Limit Reached
          </Label>
          <Select
            value={settings.actionOnLimit}
            onValueChange={(value: BudgetSettings['actionOnLimit']) => 
              setSettings({ ...settings, actionOnLimit: value })
            }
          >
            <SelectTrigger className="bg-neutral-800 border-neutral-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOTIFY">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span>Notify only (continue running)</span>
                </div>
              </SelectItem>
              <SelectItem value="PAUSE_ALL">
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  <span>Pause all workflows</span>
                </div>
              </SelectItem>
              <SelectItem value="PAUSE_PAID">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span>Pause paid AI only (Ollama continues)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {settings.actionOnLimit === 'NOTIFY' && 'Workflows will continue running, you\'ll receive notifications'}
            {settings.actionOnLimit === 'PAUSE_ALL' && 'All workflow executions will be paused until next billing cycle'}
            {settings.actionOnLimit === 'PAUSE_PAID' && 'Only workflows using free providers (Ollama, Groq) will continue'}
          </p>
        </div>

        {/* Grace Period */}
        <div className="space-y-3">
          <Label>Grace Period</Label>
          <Select
            value={String(settings.gracePeriodDays)}
            onValueChange={(value) => setSettings({ ...settings, gracePeriodDays: Number(value) })}
          >
            <SelectTrigger className="bg-neutral-800 border-neutral-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No grace period</SelectItem>
              <SelectItem value="1">1 day</SelectItem>
              <SelectItem value="3">3 days</SelectItem>
              <SelectItem value="7">7 days</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Time before enforcement action takes effect after limit is reached
          </p>
        </div>

        {/* Notification Channels */}
        <div className="space-y-3">
          <Label>Notification Channels</Label>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.emailAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, emailAlerts: checked })}
              />
              <span className="text-sm">Email</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.slackAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, slackAlerts: checked })}
              />
              <span className="text-sm">Slack</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Budget Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default BudgetControls
