'use client'
import React from 'react'
import ConnectionCard from '@/app/(main)/(pages)/connections/_components/connection-card'
import { AccordionContent } from '@/components/ui/accordion'
import MultipleSelector from '@/components/ui/multiple-selector'
import { Connection } from '@/lib/types'
import { useNodeConnections } from '@/providers/connections-provider'
import { EditorState } from '@/providers/editor-provider'
import { useFlowLabStore } from '@/store'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'


const RenderConnectionAccordion = ({
  connection,
  state,
}: {
  connection: Connection
  state: EditorState
}) => {
  const {
    title,
    image,
    description,
    connectionKey,
    accessTokenKey,
    alwaysTrue,
    slackSpecial,
  } = connection

  const { nodeConnection } = useNodeConnections()
  const { slackChannels, selectedSlackChannels, setSelectedSlackChannels } =
    useFlowLabStore()

  const connectionData = (nodeConnection as any)[connectionKey]

  const isConnected =
    alwaysTrue ||
    (nodeConnection[connectionKey] &&
      accessTokenKey &&
      connectionData[accessTokenKey!])

  return (
    <AccordionContent key={title}>
      {state.editor.selectedNode.data.title === title && (
        <>
          <ConnectionCard
            title={title}
            icon={image}
            description={description}
            type={title}
            connectionStatus={{ connected: !!isConnected }}
            onConnect={() => { }}
            onDisconnect={() => { }}
          />
          {slackSpecial && isConnected && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-neutral-300">Channel</Label>
                <span className="text-[10px] px-1.5 py-0.5 bg-white text-black rounded font-medium">Required</span>
              </div>
              {slackChannels?.length ? (
                <MultipleSelector
                  value={selectedSlackChannels}
                  onChange={setSelectedSlackChannels}
                  defaultOptions={slackChannels}
                  placeholder="Select channels"
                  emptyIndicator={
                    <p className="text-center text-sm text-neutral-500">
                      No results found
                    </p>
                  }
                />
              ) : (
                <p className="text-xs text-neutral-500">
                  No Slack channels found. Add your Slack bot to a channel first.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </AccordionContent>
  )
}

export default RenderConnectionAccordion
