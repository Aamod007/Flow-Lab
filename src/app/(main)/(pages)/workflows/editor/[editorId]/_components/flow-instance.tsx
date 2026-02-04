'use client'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  onCreateNodesEdges,
  onFlowPublish,
  getWorkflowStatus
} from '../_actions/workflow-connections'
import { Save, Rocket, Loader2, CheckCircle, Cloud, CloudOff } from 'lucide-react'

type Props = {
  children: React.ReactNode
  edges: any[]
  nodes: any[]
}

// Constants for auto-save
const AUTO_SAVE_DELAY = 30000 // 30 seconds
const LOCAL_STORAGE_PREFIX = 'workflow_backup_'

const FlowInstance = ({ children, edges, nodes }: Props) => {
  const pathname = usePathname()
  const [isFlow, setIsFlow] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const previousNodesRef = useRef<string>('')
  const previousEdgesRef = useRef<string>('')

  const workflowId = pathname.split('/').pop()!

  // Check online status
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load workflow status on mount
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await getWorkflowStatus(workflowId)
        if (status) {
          setIsPublished(status.publish ?? false)
        }
      } catch (error) {
        console.error('Failed to load workflow status:', error)
      }
    }
    loadStatus()
  }, [workflowId])

  // Detect changes for auto-save
  useEffect(() => {
    const currentNodes = JSON.stringify(nodes)
    const currentEdges = JSON.stringify(edges)

    if (
      previousNodesRef.current &&
      previousEdgesRef.current &&
      (currentNodes !== previousNodesRef.current || currentEdges !== previousEdgesRef.current)
    ) {
      setHasUnsavedChanges(true)
    }

    previousNodesRef.current = currentNodes
    previousEdgesRef.current = currentEdges
  }, [nodes, edges])

  // Save to localStorage as backup
  const saveToLocalStorage = useCallback(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    try {
      const backup = {
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        flowPath: JSON.stringify(isFlow),
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${workflowId}`, JSON.stringify(backup))
    } catch (error) {
      console.error('Failed to save backup to localStorage:', error)
    }
  }, [nodes, edges, isFlow, workflowId])

  // Clear localStorage backup after successful save
  const clearLocalStorageBackup = useCallback(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${workflowId}`)
    } catch (error) {
      console.error('Failed to clear localStorage backup:', error)
    }
  }, [workflowId])

  const onFlowAutomation = useCallback(async (isAutoSave = false) => {
    if (nodes.length === 0) {
      if (!isAutoSave) {
        toast.error('Add at least one node before saving')
      }
      return { success: false }
    }

    // Save to localStorage first as backup
    saveToLocalStorage()

    if (!isOnline) {
      toast.warning('You are offline. Changes saved locally and will sync when online.')
      return { success: false }
    }

    setIsSaving(true)
    try {
      const response = await onCreateNodesEdges(
        workflowId,
        JSON.stringify(nodes),
        JSON.stringify(edges),
        JSON.stringify(isFlow)
      )

      // Handle case where response might be undefined
      if (!response) {
        toast.error('Failed to save workflow - no response received')
        return { success: false }
      }

      if (response.success) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        clearLocalStorageBackup()

        if (!isAutoSave) {
          toast.success('Workflow saved successfully!', {
            description: `Last saved at ${new Date().toLocaleTimeString()}`
          })
        } else {
          // Subtle notification for auto-save
          toast.info('Auto-saved', { duration: 2000 })
        }
        return { success: true }
      } else {
        toast.error(response.message || 'Failed to save workflow')
        return { success: false }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Save error:', error)
      toast.error('Failed to save workflow', {
        description: 'Your changes are saved locally and will sync later'
      })
      return { success: false }
    } finally {
      setIsSaving(false)
    }
  }, [workflowId, nodes, edges, isFlow, isOnline, saveToLocalStorage, clearLocalStorageBackup])

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges && nodes.length > 0) {
      // Clear existing timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }

      // Set new timer
      autoSaveTimer.current = setTimeout(() => {
        onFlowAutomation(true)
      }, AUTO_SAVE_DELAY)
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current)
      }
    }
  }, [hasUnsavedChanges, nodes.length, onFlowAutomation])

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const onPublishWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      toast.error('Add at least one node before publishing')
      return
    }

    setIsPublishing(true)
    try {
      // First save the workflow
      const saveResult = await onFlowAutomation(false)

      if (!saveResult?.success) {
        toast.error('Please save the workflow first before publishing')
        setIsPublishing(false)
        return
      }

      // Then publish it
      const response = await onFlowPublish(workflowId, !isPublished)

      if (!response) {
        toast.error('Failed to update publish status - no response received')
        return
      }

      if (response.success) {
        setIsPublished(response.published ?? false)
        toast.success(response.message, {
          description: response.published
            ? 'Your workflow is now live and can be triggered'
            : 'Your workflow has been unpublished'
        })
      } else {
        toast.error(response.message || 'Failed to update publish status')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Publish error:', error)
      toast.error('Failed to update publish status', {
        description: errorMessage
      })
    } finally {
      setIsPublishing(false)
    }
  }, [workflowId, nodes, isPublished, onFlowAutomation])

  const onAutomateFlow = useCallback(() => {
    const flows: string[] = []
    const connectedEdges = edges.map((edge) => edge.target)
    connectedEdges.forEach((target) => {
      nodes.forEach((node) => {
        if (node.id === target) {
          flows.push(node.type)
        }
      })
    })

    setIsFlow(flows)
  }, [edges, nodes])

  useEffect(() => {
    onAutomateFlow()
  }, [onAutomateFlow])

  const hasNodes = nodes.length > 0

  // Format last saved time
  const getLastSavedText = () => {
    if (!lastSaved) return null
    const now = new Date()
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000)

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return lastSaved.toLocaleTimeString()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isOnline ? (
            <Cloud className="h-3 w-3 text-green-500" />
          ) : (
            <CloudOff className="h-3 w-3 text-yellow-500" />
          )}
          <span>{isOnline ? 'Connected' : 'Offline'}</span>
          {lastSaved && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span>Saved {getLastSavedText()}</span>
            </>
          )}
          {hasUnsavedChanges && (
            <span className="text-yellow-500 ml-2">• Unsaved changes</span>
          )}
        </div>
        {isPublished && (
          <div className="flex items-center gap-1 text-xs text-green-500">
            <CheckCircle className="h-3 w-3" />
            <span>Published</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 p-4">
        <Button
          onClick={() => onFlowAutomation(false)}
          disabled={!hasNodes || isSaving}
          variant="outline"
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save*' : 'Save'}
        </Button>
        <Button
          disabled={!hasNodes || isPublishing || isSaving}
          onClick={onPublishWorkflow}
          className={`gap-2 ${isPublished ? 'bg-green-600 hover:bg-green-700' : ''}`}
          variant={isPublished ? 'default' : 'default'}
        >
          {isPublishing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPublished ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          {isPublishing ? 'Updating...' : isPublished ? 'Published' : 'Publish'}
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

export default FlowInstance
