import { AccordionContent } from '@/components/ui/accordion'
import { ConnectionProviderProps } from '@/providers/connections-provider'
import { EditorState } from '@/providers/editor-provider'
import { nodeMapper } from '@/lib/types'
import React, { useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { onContentChange } from '@/lib/editor-utils'
import GoogleFileDetails from './google-file-details'
import GoogleDriveFiles from './google-drive-files'
import ActionButton from './action-button'
import { getFileMetaData } from '@/app/(main)/(pages)/connections/_actions/google-connection'
import axios from 'axios'
import { toast } from 'sonner'
import AIConfigurationForm from './ai-configuration-form'

export interface Option {
  value: string
  label: string
  disable?: boolean
  /** fixed option that can't be removed. */
  fixed?: boolean
  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined
}
interface GroupOption {
  [key: string]: Option[]
}

type Props = {
  nodeConnection: ConnectionProviderProps
  newState: EditorState
  file: any
  setFile: (file: any) => void
  selectedSlackChannels: Option[]
  setSelectedSlackChannels: (value: Option[]) => void
}

const ContentBasedOnTitle = ({
  nodeConnection,
  newState,
  file,
  setFile,
  selectedSlackChannels,
  setSelectedSlackChannels,
}: Props) => {
  const { selectedNode } = newState.editor
  const title = selectedNode.data.title

  useEffect(() => {
    if (title === 'Google Drive') {
      const reqGoogle = async () => {
        try {
          const response: { data: { message: { files: any } } } = await axios.get(
            '/api/drive'
          )
          if (response && response.data?.message?.files?.length > 0) {
            toast.message("Fetched File")
            setFile(response.data.message.files[0])
          }
        } catch (error) {
          console.error(error)
          // toast.error('Failed to fetch Drive files')
        }
      }
      reqGoogle()
    }
  }, [title, setFile])

  // Handle nodes that don't require connections (Trigger, Action, Wait, Condition)
  const genericNodeTypes = ['Trigger', 'Action', 'Wait', 'Condition', 'Email']
  const isGenericNode = genericNodeTypes.includes(title)

  // @ts-ignore
  const nodeConnectionType: any = nodeConnection[nodeMapper[title]]

  // For generic nodes, show their configuration without connection check
  if (isGenericNode) {
    return (
      <AccordionContent>
        <Card>
          <div className="flex flex-col gap-3 px-6 py-3 pb-20">
            {title === 'Trigger' && (
              <>
                <h4 className="text-sm font-medium">Trigger Configuration</h4>
                <p className="text-xs text-muted-foreground">
                  This node starts your workflow. Configure when it should trigger.
                </p>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Trigger Type</label>
                      <select className="w-full px-3 py-2 text-sm border rounded-md bg-background">
                        <option>Manual</option>
                        <option>Schedule (Cron)</option>
                        <option>Webhook</option>
                        <option>Event</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Description</label>
                      <Input placeholder="Describe what triggers this workflow..." />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {title === 'Action' && (
              <>
                <h4 className="text-sm font-medium">Action Configuration</h4>
                <p className="text-xs text-muted-foreground">
                  Configure what this action node does.
                </p>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Action Type</label>
                      <select className="w-full px-3 py-2 text-sm border rounded-md bg-background">
                        <option>HTTP Request</option>
                        <option>Transform Data</option>
                        <option>Filter</option>
                        <option>Aggregate</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Input</label>
                      <Input placeholder="{{previous.output}}" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {title === 'Condition' && (
              <>
                <h4 className="text-sm font-medium">Condition Configuration</h4>
                <p className="text-xs text-muted-foreground">
                  Define conditions to branch your workflow.
                </p>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">If</label>
                      <Input placeholder="{{ai.response}}" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Operator</label>
                      <select className="w-full px-3 py-2 text-sm border rounded-md bg-background">
                        <option>Contains</option>
                        <option>Equals</option>
                        <option>Greater Than</option>
                        <option>Less Than</option>
                        <option>Is Empty</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Value</label>
                      <Input placeholder="Enter comparison value..." />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {title === 'Wait' && (
              <>
                <h4 className="text-sm font-medium">Wait Configuration</h4>
                <p className="text-xs text-muted-foreground">
                  Pause workflow execution for a specified time.
                </p>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Duration</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="5" className="w-20" />
                        <select className="px-3 py-2 text-sm border rounded-md bg-background">
                          <option>Seconds</option>
                          <option>Minutes</option>
                          <option>Hours</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {title === 'Email' && (
              <>
                <h4 className="text-sm font-medium">Email Configuration</h4>
                <p className="text-xs text-muted-foreground">
                  Configure email sending or receiving.
                </p>
                <Card className="bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">To</label>
                      <Input placeholder="recipient@example.com" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Subject</label>
                      <Input placeholder="Email subject..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Body</label>
                      <Input placeholder="{{ai.response}}" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </Card>
      </AccordionContent>
    )
  }

  if (!nodeConnectionType) return <p>Not connected</p>

  const isConnected =
    title === 'Google Drive'
      ? !nodeConnection.isLoading
      : title === 'AI'
        ? true
        : !!nodeConnectionType[
        `${title === 'Slack'
          ? 'slackAccessToken'
          : title === 'Discord'
            ? 'webhookURL'
            : title === 'Notion'
              ? 'accessToken'
              : ''
        }`
        ]

  if (!isConnected) return <p>Not connected</p>

  return (
    <AccordionContent>
      <Card>
        {title === 'Discord' && (
          <CardHeader>
            <CardTitle>{nodeConnectionType.webhookName}</CardTitle>
            <CardDescription>{nodeConnectionType.guildName}</CardDescription>
          </CardHeader>
        )}

        {/* AI Agent Output - Shows test results and output preview */}
        {title === 'AI' && (
          <div className="px-6 py-3 pb-20 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Output Preview</h4>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">The AI agent will output its response here when executed.</p>
                  <div className="p-3 rounded-md bg-background border border-dashed border-border">
                    <p className="text-sm text-muted-foreground italic">Run the workflow to see agent output...</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Output Variables</h4>
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <code className="px-2 py-1 bg-background rounded">{'{{ai.response}}'}</code>
                    <span className="text-muted-foreground">Full AI response text</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <code className="px-2 py-1 bg-background rounded">{'{{ai.tokens}}'}</code>
                    <span className="text-muted-foreground">Tokens used</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <code className="px-2 py-1 bg-background rounded">{'{{ai.cost}}'}</code>
                    <span className="text-muted-foreground">Cost incurred</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Pass to Next Node</h4>
              <p className="text-xs text-muted-foreground">Connect this AI node&apos;s output to other nodes in your workflow.</p>
            </div>
          </div>
        )}

        {/* Standard Node Configuration */}
        {title !== 'AI' && (
          <div className="flex flex-col gap-3 px-6 py-3 pb-20">
            <p>{title === 'Notion' ? 'Values to be stored' : 'Message'}</p>

            <Input
              type="text"
              value={nodeConnectionType.content}
              onChange={(event) => onContentChange(nodeConnection, title, event)}
            />

            {JSON.stringify(file) !== '{}' && title !== 'Google Drive' && (
              <Card className="w-full">
                <CardContent className="px-2 py-3">
                  <div className="flex flex-col gap-4">
                    <CardDescription>Drive File</CardDescription>
                    <div className="flex flex-wrap gap-2">
                      <GoogleFileDetails
                        nodeConnection={nodeConnection}
                        title={title}
                        gFile={file}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            {title === 'Google Drive' && <GoogleDriveFiles />}
            <ActionButton
              currentService={title}
              nodeConnection={nodeConnection}
              channels={selectedSlackChannels}
              setChannels={setSelectedSlackChannels}
            />
          </div>
        )}
      </Card>
    </AccordionContent>
  )
}

export default ContentBasedOnTitle
