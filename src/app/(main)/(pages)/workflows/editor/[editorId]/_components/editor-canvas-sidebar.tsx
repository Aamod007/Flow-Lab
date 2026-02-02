'use client'
import { EditorCanvasTypes, EditorNodeType } from '@/lib/types'
import { useNodeConnections } from '@/providers/connections-provider'
import { useEditor } from '@/providers/editor-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import React, { useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { CONNECTIONS, EditorCanvasDefaultCardTypes } from '@/lib/constant'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  fetchBotSlackChannels,
  onConnections,
  onDragStart,
} from '@/lib/editor-utils'
import EditorCanvasIconHelper from './editor-canvas-card-icon-hepler'
import AIConfigurationForm from './ai-configuration-form'
import AgentConfigurationForm from './agent-configuration-form'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import RenderConnectionAccordion from './render-connection-accordion'
import RenderOutputAccordion from './render-output-accordion'
import { useFlowLabStore } from '@/store'

type Props = {
  nodes: EditorNodeType[]
}

const EditorCanvasSidebar = ({ nodes }: Props) => {
  const { state } = useEditor()
  const { nodeConnection } = useNodeConnections()
  const { googleFile, setSlackChannels } = useFlowLabStore()
  useEffect(() => {
    if (state) {
      onConnections(nodeConnection, state, googleFile)
    }
  }, [state, googleFile, nodeConnection])

  useEffect(() => {
    if (nodeConnection.slackNode.slackAccessToken) {
      fetchBotSlackChannels(
        nodeConnection.slackNode.slackAccessToken,
        setSlackChannels
      )
    }
  }, [nodeConnection.slackNode.slackAccessToken, setSlackChannels])

  return (
    <aside className="h-full overflow-y-auto">
      <Tabs
        defaultValue="actions"
        className="h-full"
      >
        <div className="sticky top-0 z-10 bg-background">
          <TabsList className="bg-transparent">
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <Separator />
        </div>
        <TabsContent
          value="actions"
          className="flex flex-col gap-4 p-4"
        >
          {Object.entries(EditorCanvasDefaultCardTypes)
            .filter(
              ([cardKey, cardType]) =>
                !cardKey.includes('Agent') && (
                  (!nodes.length && cardType.type === 'Trigger') ||
                  (nodes.length && cardType.type === 'Action')
                )
            )
            .map(([cardKey, cardValue]) => (
              <Card
                key={cardKey}
                draggable
                className="w-full cursor-grab border-black bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
                onDragStart={(event) =>
                  onDragStart(event, cardKey as EditorCanvasTypes)
                }
              >
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <EditorCanvasIconHelper type={cardKey as EditorCanvasTypes} />
                  <CardTitle className="text-md">
                    {cardKey}
                    <CardDescription>{cardValue.description}</CardDescription>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
        </TabsContent>
        <TabsContent
          value="agents"
          className="flex flex-col gap-4 p-4"
        >
          {Object.entries(EditorCanvasDefaultCardTypes)
            .filter(([cardKey]) => cardKey.includes('Agent'))
            .map(([cardKey, cardValue]) => (
              <Card
                key={cardKey}
                draggable
                className="w-full cursor-grab border-black bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900"
                onDragStart={(event) =>
                  onDragStart(event, cardKey as EditorCanvasTypes)
                }
              >
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <EditorCanvasIconHelper type={cardKey as EditorCanvasTypes} />
                  <CardTitle className="text-md">
                    {cardKey}
                    <CardDescription>{cardValue.description}</CardDescription>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
        </TabsContent>
        <TabsContent
          value="settings"
          className="-mt-6 pb-24"
        >
          <div className="px-4 py-6 text-center mb-2">
            <div className="flex items-center justify-center h-16 w-16 bg-muted rounded-2xl mx-auto mb-3 shadow-inner">
              <EditorCanvasIconHelper type={state.editor.selectedNode.data.type as EditorCanvasTypes} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {state.editor.selectedNode.data.title}
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-1 opacity-70">ID: {state.editor.selectedNode.id}</p>
          </div>

          <Accordion type="multiple" className="w-full px-4" defaultValue={["Options"]}>
            <AccordionItem
              value="Options"
              className="border border-border rounded-lg mb-3 overflow-hidden shadow-sm bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 transition-colors !no-underline group">
                <span className="font-semibold text-sm">Configuration</span>
              </AccordionTrigger>
              <AccordionContent className="p-0 border-t border-border/50">
                {state.editor.selectedNode.data.title === 'AI' && (
                  <div className="p-4 bg-muted/10">
                    <AIConfigurationForm nodeConnection={nodeConnection} />
                  </div>
                )}
                {state.editor.selectedNode.data.title?.includes('Agent') && (
                  <div className="p-4 bg-muted/10">
                    <AgentConfigurationForm />
                  </div>
                )}
                <div className="p-2 flex flex-col gap-2">
                  {CONNECTIONS.map((connection) => (
                    <RenderConnectionAccordion
                      key={connection.title}
                      state={state}
                      connection={connection}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="Expected Output"
              className="border border-border rounded-lg mb-3 overflow-hidden shadow-sm bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 transition-colors !no-underline">
                <span className="font-semibold text-sm">Action Outputs</span>
              </AccordionTrigger>
              <AccordionContent className="p-4 border-t border-border/50 bg-muted/10">
                <RenderOutputAccordion
                  state={state}
                  nodeConnection={nodeConnection}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </aside >
  )
}

export default EditorCanvasSidebar
