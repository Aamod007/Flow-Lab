import { useEditor } from '@/providers/editor-provider'
import React, { CSSProperties } from 'react'
import { Handle, HandleProps, useStore } from 'reactflow'

type Props = HandleProps & { style?: CSSProperties }

const selector = (s: any) => ({
  nodeInternals: s.nodeInternals,
  edges: s.edges,
})

const CustomHandle = (props: Props) => {
  // Use React Flow's store directly - this is always up to date
  const { edges, nodeInternals } = useStore(selector)

  return (
    <Handle
      {...props}
      isValidConnection={(e) => {
        // Count existing connections using React Flow's edge state
        const sourcesFromHandle = edges.filter(
          (edge: any) => edge.source === e.source
        ).length

        const targetFromHandle = edges.filter(
          (edge: any) => edge.target === e.target
        ).length

        // Prevent connecting to a node that already has an incoming edge
        if (targetFromHandle >= 1) return false

        // Get source node from React Flow's store
        const sourceNodeData = nodeInternals.get(e.source)
        const sourceType = sourceNodeData?.type || sourceNodeData?.data?.type

        // Condition nodes can have multiple outputs
        if (sourceType === 'Condition') return true

        // Other nodes can only have one output
        if (sourcesFromHandle < 1) return true

        return false
      }}
      className="!-bottom-2 !h-4 !w-4 dark:bg-neutral-800"
    />
  )
}

export default CustomHandle
