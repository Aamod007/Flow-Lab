import React from 'react'
import BillingDashboard from './_components/billing-dashboard'
import CostDashboard from './_components/cost-dashboard'
import CostBreakdownChart from './_components/cost-breakdown-chart'
import { OptimizationSuggestions } from './_components/optimization-suggestions'
import BudgetControls from './_components/budget-controls'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Props = {
  searchParams?: { [key: string]: string | undefined }
}

const Billing = async (props: Props) => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        <span>Billing</span>
      </h1>
      <BillingDashboard />
      <div className="p-6 pt-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-neutral-800/50 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">AI Cost Analytics</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="budget">Budget Controls</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            <CostDashboard />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-0">
            <CostBreakdownChart />
          </TabsContent>
          
          <TabsContent value="optimization" className="mt-0">
            <OptimizationSuggestions />
          </TabsContent>
          
          <TabsContent value="budget" className="mt-0">
            <div className="max-w-2xl">
              <BudgetControls />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Billing
