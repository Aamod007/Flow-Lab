'use client'
import { EditorCanvasCardType, EditorNodeType } from '@/lib/types'
import { useEditor } from '@/providers/editor-provider'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MiniMap,
  NodeChange,
  ReactFlowInstance,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import EditorCanvasCardSingle from './editor-canvas-card-single'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { toast } from 'sonner'
import { usePathname } from 'next/navigation'
import { v4 } from 'uuid'
import { EditorCanvasDefaultCardTypes } from '@/lib/constant'
import FlowInstance from './flow-instance'
import EditorCanvasSidebar from './editor-canvas-sidebar'
import { onGetNodesEdges } from '../../../_actions/workflow-connections'
import { onExecuteWorkflow } from '../../../_actions/execute-workflow'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus, Maximize, Undo, Redo, Play, Save, FileText, LayoutDashboard } from 'lucide-react'
import ExecutionDashboard from './execution-dashboard'
import clsx from 'clsx'
import { useFlowLabStore } from '@/store'

type Props = {}

const initialNodes: EditorNodeType[] = []

const initialEdges: { id: string; source: string; target: string }[] = []

const nodeTypes = {
  Action: EditorCanvasCardSingle,
  Trigger: EditorCanvasCardSingle,
  Email: EditorCanvasCardSingle,
  Condition: EditorCanvasCardSingle,
  AI: EditorCanvasCardSingle,
  Slack: EditorCanvasCardSingle,
  'Google Drive': EditorCanvasCardSingle,
  Notion: EditorCanvasCardSingle,
  Discord: EditorCanvasCardSingle,
  'Custom Webhook': EditorCanvasCardSingle,
  'Google Calendar': EditorCanvasCardSingle,
  Wait: EditorCanvasCardSingle,
  Agent: EditorCanvasCardSingle,
  'Research Agent': EditorCanvasCardSingle,
  'Coder Agent': EditorCanvasCardSingle,
  'Analyst Agent': EditorCanvasCardSingle,
  'Writer Agent': EditorCanvasCardSingle,
  'Reviewer Agent': EditorCanvasCardSingle,
  'Coordinator Agent': EditorCanvasCardSingle,
}

const EditorCanvas = (props: Props) => {
  const { dispatch, state } = useEditor()
  const [nodes, setNodes] = useState(initialNodes)
  const [edges, setEdges] = useState(initialEdges)
  const [isWorkFlowLoading, setIsWorkFlowLoading] = useState<boolean>(false)
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance>()
  const pathname = usePathname()

  const onDragOver = useCallback((event: any) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      //@ts-ignore
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setNodes]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      //@ts-ignore
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  )

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  )

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault()

      const type: EditorCanvasCardType['type'] = event.dataTransfer.getData(
        'application/reactflow'
      )

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return
      }

      const triggerAlreadyExists = state.editor.elements.find(
        (node) => node.type === 'Trigger'
      )

      if (type === 'Trigger' && triggerAlreadyExists) {
        toast('Only one trigger can be added to automations at the moment')
        return
      }

      // reactFlowInstance.project was renamed to reactFlowInstance.screenToFlowPosition
      // and you don't need to subtract the reactFlowBounds.left/top anymore
      // details: https://reactflow.dev/whats-new/2023-11-10
      if (!reactFlowInstance) return
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      // Initialize metadata with sensible defaults based on node type
      let initialMetadata: Record<string, any> = {}

      // AI nodes and Agent nodes get default AI configuration
      if (type === 'AI' || type.includes('Agent')) {
        initialMetadata = {
          provider: 'Groq',                        // Free provider
          model: 'llama-3.1-70b-versatile',       // Free, high-quality model
          prompt: '',
          systemPrompt: 'You are a helpful assistant.',
          temperature: 0.7,
          maxTokens: 1000,
        }
      }

      const newNode = {
        id: v4(),
        type,
        position,
        data: {
          title: type,
          description: EditorCanvasDefaultCardTypes[type].description,
          completed: false,
          current: false,
          metadata: initialMetadata,
          type: type,
        },
      }
      //@ts-ignore
      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, state]
  )

  const handleClickCanvas = () => {
    dispatch({
      type: 'SELECTED_ELEMENT',
      payload: {
        element: {
          data: {
            completed: false,
            current: false,
            description: '',
            metadata: {},
            title: '',
            type: 'Trigger',
          },
          id: '',
          position: { x: 0, y: 0 },
          type: 'Trigger',
        },
      },
    })
  }

  useEffect(() => {
    dispatch({ type: 'LOAD_DATA', payload: { edges, elements: nodes } })
  }, [nodes, edges, dispatch])



  const LOCAL_STORAGE_PREFIX = 'workflow_backup_'
  const workflowId = pathname.split('/').pop()!

  // Try to recover from localStorage backup (client-side only)
  const tryRecoverFromLocalStorage = useCallback(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return false

    try {
      // Check for template/initial data first (workflow_{id})
      let stored = localStorage.getItem(`workflow_${workflowId}`)

      // If not found, check for auto-save backup (workflow_backup_{id})
      if (!stored) {
        stored = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${workflowId}`)
      }

      if (stored) {
        const parsed = JSON.parse(stored)
        const parsedNodes = typeof parsed.nodes === 'string' ? JSON.parse(parsed.nodes) : (parsed.nodes || [])
        const parsedEdges = typeof parsed.edges === 'string' ? JSON.parse(parsed.edges) : (parsed.edges || [])

        if (parsedNodes.length > 0 || parsedEdges.length > 0) {
          setNodes(parsedNodes)
          setEdges(parsedEdges)
          // If we loaded from the main source (from template), don't show "recovered from backup" toast
          // unless it was actually a backup file
          if (!stored.includes('updatedAt') || stored === localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${workflowId}`)) {
            toast.info('Loaded workflow layout')
          }
          return true
        }
      }
    } catch (e) {
      console.error('Failed to recover from localStorage:', e)
    }
    return false
  }, [workflowId])

  const onGetWorkFlow = async () => {
    setIsWorkFlowLoading(true)
    try {
      const response = await onGetNodesEdges(workflowId)

      // Check if there was an error from the server
      if (response && 'error' in response && response.error) {
        console.error('Server error:', response.error)
        toast.error('Failed to load workflow from server', {
          description: 'Attempting to recover from local backup...'
        })

        // Try to recover from localStorage
        if (!tryRecoverFromLocalStorage()) {
          toast.info('Starting with empty workflow')
        }
        setIsWorkFlowLoading(false)
        return
      }

      if (response) {
        try {
          const parsedNodes = JSON.parse(response.nodes || '[]')
          const parsedEdges = JSON.parse(response.edges || '[]')

          if (parsedNodes.length > 0) {
            setNodes(parsedNodes)
            setEdges(parsedEdges) // If nodes exist, trust server edges too

            // Clear any old backup since we loaded successfully from server
            if (typeof window !== 'undefined') {
              localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${workflowId}`)
            }
          } else {
            // Server returned empty workflow.
            // Check if we have a local template/backup waiting to be used!
            const recovered = tryRecoverFromLocalStorage()
            if (!recovered) {
              // Only if NO local data found, do we stick with empty state
              console.log('No saved workflow found anywhere, starting fresh')
            }
          }

        } catch (e) {
          console.log('Error parsing server response:', e)
          if (!tryRecoverFromLocalStorage()) {
            toast.info('Starting with empty workflow')
          }
        }
      }
    } catch (error) {
      console.error('Error loading workflow:', error)
      toast.error('Unable to connect to server', {
        description: 'Looking for local backup...'
      })

      if (!tryRecoverFromLocalStorage()) {
        toast.info('Starting with empty workflow')
      }
    }
    setIsWorkFlowLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    onGetWorkFlow()
  }, [])

  const [isDashboardOpen, setIsDashboardOpen] = useState(false)

  // ... (existing code)

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={70}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={isDashboardOpen ? 60 : 100}>
            <div className="flex h-full items-center justify-center">
              <div
                style={{ width: '100%', height: '100%' }}
                className="relative"
              >
                {isWorkFlowLoading ? (
                  <div className="absolute flex h-full w-full items-center justify-center">
                    <svg
                      aria-hidden="true"
                      className="inline h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                      />
                      <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                      />
                    </svg>
                  </div>
                ) : (
                  <ReactFlow
                    className="w-[300px]"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodes={state.editor.elements}
                    onNodesChange={onNodesChange}
                    edges={edges}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    fitView
                    onClick={handleClickCanvas}
                    nodeTypes={nodeTypes}
                  >

                    <Background
                      //@ts-ignore
                      variant="dots"
                      gap={12}
                      size={1}
                    />

                    {/* Workflow Toolbar (Top Right) */}
                    <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
                      {/* Status Toggle */}
                      <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md p-2 rounded-full border shadow-sm">
                        <span className="text-xs font-semibold pl-2 text-muted-foreground">Draft</span>
                        <div className="h-4 w-[1px] bg-border"></div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs rounded-full bg-muted/50 hover:bg-green-500/10 hover:text-green-600 transition-colors"
                          onClick={() => toast.success('Workflow Published!')}
                        >
                          Publish
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 p-1.5 bg-background/80 backdrop-blur-md border rounded-full shadow-lg">
                        {/* Test Run */}
                        <Button
                          size="sm"
                          className="h-8 rounded-full bg-green-600 hover:bg-green-700 text-white gap-2 px-4 shadow-green-500/20 shadow-lg"
                          onClick={async () => {
                            setIsDashboardOpen(true)
                            toast.loading('Executing workflow...')
                            try {
                              // @ts-ignore
                              const { selectedSlackChannels } = useFlowLabStore.getState()
                              const result = await onExecuteWorkflow(JSON.stringify(state.editor.elements), JSON.stringify(edges), selectedSlackChannels)
                              if (result.success) {
                                toast.dismiss()
                                toast.success('Workflow executed successfully!')
                                // Optional: Show logs
                                console.log(result.logs)
                              } else {
                                toast.dismiss()
                                toast.error('Execution Failed: ' + result.message)
                              }
                            } catch (e: any) {
                              toast.dismiss()
                              toast.error('Error: ' + e.message)
                            }
                          }}
                        >
                          <Play className="w-4 h-4 fill-current" />
                          Test Run
                        </Button>

                        <div className="w-[1px] h-5 bg-border mx-1" />

                        {/* Monitor Toggle */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={clsx("h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground", {
                            "bg-muted text-primary": isDashboardOpen
                          })}
                          title="Toggle Live Monitor"
                          onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                        >
                          <LayoutDashboard className="w-4 h-4" />
                        </Button>

                        {/* Save */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Save Workflow"
                          onClick={() => toast.success('Workflow saved')}
                        >
                          <Save className="w-4 h-4" />
                        </Button>

                        {/* Logs */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Execution Logs"
                          onClick={() => toast.info('No execution logs found')}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Premium Floating Control Panel */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                      <div className="flex items-center gap-1 p-2 bg-background/80 backdrop-blur-md border rounded-full shadow-2xl hover:shadow-primary/20 transition-all duration-300">

                        {/* Zoom Out */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reactFlowInstance?.zoomOut()}
                          className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full w-9 h-9"
                          title="Zoom Out"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>

                        {/* Zoom In */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reactFlowInstance?.zoomIn()}
                          className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full w-9 h-9"
                          title="Zoom In"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>

                        {/* Fit View */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reactFlowInstance?.fitView()}
                          className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full w-9 h-9"
                          title="Fit View"
                        >
                          <Maximize className="w-4 h-4" />
                        </Button>

                        <div className="w-[1px] h-6 bg-border mx-1" />

                        {/* Undo (Visual Only for now) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full w-9 h-9 opacity-50 cursor-not-allowed"
                          title="Undo (Coming Soon)"
                        >
                          <Undo className="w-4 h-4" />
                        </Button>

                        {/* Redo (Visual Only for now) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full w-9 h-9 opacity-50 cursor-not-allowed"
                          title="Redo (Coming Soon)"
                        >
                          <Redo className="w-4 h-4" />
                        </Button>

                        <div className="w-[1px] h-6 bg-border mx-1" />

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const selectedNodes = nodes.filter((n: any) => n.selected)
                            const selectedEdges = edges.filter((e: any) => e.selected)
                            if (selectedNodes.length > 0 || selectedEdges.length > 0) {
                              setNodes((nds) => nds.filter((n: any) => !n.selected))
                              setEdges((eds) => eds.filter((e: any) => !e.selected))
                              toast.success('Elements removed')
                            } else {
                              toast.info('Select elements to delete')
                            }
                          }}
                          className="hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-full w-9 h-9 transition-colors"
                          title="Delete Selected"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>


                  </ReactFlow>
                )}
              </div>
            </div>
          </ResizablePanel>

          {isDashboardOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={40}>
                <ExecutionDashboard />
              </ResizablePanel>
            </>
          )}

        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        defaultSize={30}
        className="relative sm:block"
      >
        {isWorkFlowLoading ? (
          <div className="absolute flex h-full w-full items-center justify-center">
            <svg
              aria-hidden="true"
              className="inline h-8 w-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Reuse svgs... */}
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          </div>
        ) : (
          <FlowInstance
            edges={edges}
            nodes={nodes}
          >
            <EditorCanvasSidebar nodes={nodes} />
          </FlowInstance>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default EditorCanvas
