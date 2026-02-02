import { EditorCanvasCardType } from '@/lib/types'
import { useEditor } from '@/providers/editor-provider'
import React, { useMemo } from 'react'
import { Position, useNodeId } from 'reactflow'
import EditorCanvasIconHelper from './editor-canvas-card-icon-hepler'
import CustomHandle from './custom-handle'
import { Badge } from '@/components/ui/badge'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import clsx from 'clsx'
import { Loader2, CheckCircle2, XCircle, PauseCircle, Sparkles, Clock } from 'lucide-react'

type Props = {}

const EditorCanvasCardSingle = ({ data }: { data: EditorCanvasCardType }) => {
  const { dispatch, state } = useEditor()
  const nodeId = useNodeId()
  const logo = useMemo(() => {
    return <EditorCanvasIconHelper type={data.type} />
  }, [data])

  // Determine execution status
  const status = data.metadata?.status || (data.completed ? 'completed' : data.current ? 'running' : 'idle')
  const isRunning = status === 'running' || status === 'thinking'
  const isCompleted = status === 'completed' || data.completed
  const isFailed = status === 'failed'
  const isPaused = status === 'paused'
  const isAI = data.type === 'AI' || data.type?.includes('Agent')

  // Get status indicator
  const getStatusIndicator = () => {
    if (isRunning) {
      return (
        <div className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
          <span className="text-[10px] text-purple-400">Running</span>
        </div>
      )
    }
    if (isCompleted) {
      return (
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          {data.metadata?.duration && (
            <span className="text-[10px] text-green-400">{data.metadata.duration}ms</span>
          )}
        </div>
      )
    }
    if (isFailed) {
      return (
        <div className="flex items-center gap-1">
          <XCircle className="w-3 h-3 text-red-500" />
          <span className="text-[10px] text-red-400">Failed</span>
        </div>
      )
    }
    if (isPaused) {
      return (
        <div className="flex items-center gap-1">
          <PauseCircle className="w-3 h-3 text-orange-500" />
          <span className="text-[10px] text-orange-400">Paused</span>
        </div>
      )
    }
    return null
  }

  return (
    <>
      {data.type !== 'Trigger' && data.type !== 'Google Drive' && (
        <CustomHandle
          type="target"
          position={Position.Top}
          style={{ zIndex: 100 }}
        />
      )}
      <Card
        onClick={(e) => {
          e.stopPropagation()
          const val = state.editor.elements.find((n) => n.id === nodeId)
          if (val)
            dispatch({
              type: 'SELECTED_ELEMENT',
              payload: {
                element: val,
              },
            })
        }}
        className={clsx(
          "relative max-w-[400px] dark:border-muted-foreground/70 transition-all duration-300",
          {
            'ring-2 ring-purple-500 ring-opacity-50 shadow-lg shadow-purple-500/20 border-purple-500': isRunning,
            'ring-2 ring-green-500 ring-opacity-30 border-green-500/50': isCompleted,
            'ring-2 ring-red-500 ring-opacity-50 border-red-500': isFailed,
            'ring-2 ring-orange-500 ring-opacity-30 border-orange-500/50': isPaused,
          }
        )}
      >
        <CardHeader className="flex flex-row items-center gap-4">
          <div className={clsx(
            "transition-transform duration-300",
            isRunning && "animate-pulse"
          )}>{logo}</div>
          <div>
            <CardTitle className="text-md">{data.title}</CardTitle>
            <CardDescription>
              <span className="text-xs text-muted-foreground/50 block">
                <b className="text-muted-foreground/80">ID: </b>
                {nodeId}
              </span>
              <span className="mt-1 block">{data.description}</span>
            </CardDescription>
          </div>
        </CardHeader>
        
        {/* Type Badge */}
        <Badge
          variant="secondary"
          className={clsx(
            "absolute right-2 top-2",
            isAI && "bg-purple-500/10 text-purple-400 border-purple-500/30"
          )}
        >
          {isAI && <Sparkles className="w-3 h-3 mr-1" />}
          {data.type}
        </Badge>
        
        {/* Status Dot */}
        <div
          className={clsx('absolute left-3 top-4 h-2 w-2 rounded-full transition-colors duration-300', {
            'bg-green-500': isCompleted,
            'bg-orange-500': isPaused,
            'bg-purple-500 animate-pulse': isRunning,
            'bg-red-500': isFailed,
            'bg-gray-500': status === 'idle',
          })}
        />
        
        {/* Bottom Status Bar */}
        <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between">
          {/* Status Indicator */}
          {getStatusIndicator()}
          
          {/* Cost Display for AI nodes */}
          {isAI && data.metadata?.cost !== undefined && (
            <div className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded hover:bg-secondary flex items-center gap-1">
              <span className="text-green-500">$</span>
              {Number(data.metadata.cost).toFixed(4)}
            </div>
          )}
          
          {/* Token count for AI nodes */}
          {isAI && data.metadata?.tokensUsed !== undefined && (
            <div className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {data.metadata.tokensUsed.toLocaleString()} tok
            </div>
          )}
        </div>
      </Card>
      <CustomHandle
        type="source"
        position={Position.Bottom}
        id="a"
      />
    </>
  )
}

export default EditorCanvasCardSingle
