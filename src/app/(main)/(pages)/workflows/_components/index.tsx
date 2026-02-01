'use client'
import React, { useEffect, useState } from 'react'
import Workflow from './workflow'
import { getWorkflowsFromStorage } from '@/lib/workflow-storage'
import MoreCredits from './more-credits'

type Props = {}

const Workflows = (props: Props) => {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadWorkflows = () => {
    const data = getWorkflowsFromStorage()
    setWorkflows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadWorkflows()

    // Listen for custom event when workflow is created
    const handleWorkflowCreated = () => {
      loadWorkflows()
    }

    window.addEventListener('workflowCreated', handleWorkflowCreated)

    return () => {
      window.removeEventListener('workflowCreated', handleWorkflowCreated)
    }
  }, [])

  if (loading) {
    return (
      <div className="relative flex flex-col gap-4">
        <section className="flex flex-col m-2">
          <MoreCredits />
          <div className="mt-28 flex text-muted-foreground items-center justify-center">
            Loading...
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col gap-4">
      <section className="flex flex-col m-2">
        <MoreCredits />
        {workflows?.length ? (
          workflows.map((flow) => (
            <Workflow
              key={flow.id}
              {...flow}
            />
          ))
        ) : (
          <div className="mt-28 flex text-muted-foreground items-center justify-center">
            No Workflows
          </div>
        )}
      </section>
    </div>
  )
}

export default Workflows
