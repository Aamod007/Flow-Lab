'use client'

import { useCallback, useState, useRef, useEffect } from 'react'

const LOCAL_STORAGE_PREFIX = 'workflow_backup_'

type WorkflowBackup = {
    nodes: string
    edges: string
    flowPath: string
    timestamp: string
}

type UseWorkflowPersistenceProps = {
    workflowId: string
    onRecover?: (nodes: any[], edges: any[]) => void
}

/**
 * Custom hook for managing workflow persistence with localStorage backup
 */
export function useWorkflowPersistence({ workflowId, onRecover }: UseWorkflowPersistenceProps) {
    const [lastBackup, setLastBackup] = useState<Date | null>(null)
    const [hasBackup, setHasBackup] = useState(false)

    // Check for existing backup on mount
    useEffect(() => {
        const backup = getBackup()
        setHasBackup(!!backup)
        if (backup) {
            setLastBackup(new Date(backup.timestamp))
        }
    }, [workflowId])

    // Save to localStorage
    const saveBackup = useCallback((nodes: any[], edges: any[], flowPath: string[]) => {
        try {
            const backup: WorkflowBackup = {
                nodes: JSON.stringify(nodes),
                edges: JSON.stringify(edges),
                flowPath: JSON.stringify(flowPath),
                timestamp: new Date().toISOString()
            }
            localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${workflowId}`, JSON.stringify(backup))
            setLastBackup(new Date())
            setHasBackup(true)
            return true
        } catch (error) {
            console.error('Failed to save backup:', error)
            return false
        }
    }, [workflowId])

    // Get backup from localStorage
    const getBackup = useCallback((): WorkflowBackup | null => {
        try {
            const data = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${workflowId}`)
            if (data) {
                return JSON.parse(data)
            }
        } catch (error) {
            console.error('Failed to get backup:', error)
        }
        return null
    }, [workflowId])

    // Recover from backup
    const recoverFromBackup = useCallback((): boolean => {
        const backup = getBackup()
        if (backup && onRecover) {
            try {
                const nodes = JSON.parse(backup.nodes)
                const edges = JSON.parse(backup.edges)
                onRecover(nodes, edges)
                return true
            } catch (error) {
                console.error('Failed to recover from backup:', error)
            }
        }
        return false
    }, [getBackup, onRecover])

    // Clear backup
    const clearBackup = useCallback(() => {
        try {
            localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${workflowId}`)
            setHasBackup(false)
            setLastBackup(null)
            return true
        } catch (error) {
            console.error('Failed to clear backup:', error)
            return false
        }
    }, [workflowId])

    // Get all workflow backups
    const getAllBackups = useCallback((): Record<string, WorkflowBackup> => {
        const backups: Record<string, WorkflowBackup> = {}
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key?.startsWith(LOCAL_STORAGE_PREFIX)) {
                    const id = key.replace(LOCAL_STORAGE_PREFIX, '')
                    const data = localStorage.getItem(key)
                    if (data) {
                        backups[id] = JSON.parse(data)
                    }
                }
            }
        } catch (error) {
            console.error('Failed to get all backups:', error)
        }
        return backups
    }, [])

    // Clear old backups (older than 7 days)
    const clearOldBackups = useCallback((maxAgeDays = 7) => {
        const maxAge = maxAgeDays * 24 * 60 * 60 * 1000
        const now = new Date().getTime()

        const backups = getAllBackups()
        Object.entries(backups).forEach(([id, backup]) => {
            const backupAge = now - new Date(backup.timestamp).getTime()
            if (backupAge > maxAge) {
                try {
                    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${id}`)
                } catch { }
            }
        })
    }, [getAllBackups])

    return {
        saveBackup,
        getBackup,
        recoverFromBackup,
        clearBackup,
        getAllBackups,
        clearOldBackups,
        lastBackup,
        hasBackup
    }
}

/**
 * Hook for detecting online/offline status
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        // Check initial status
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

    return isOnline
}

/**
 * Hook for auto-save functionality
 */
export function useAutoSave(
    onSave: () => Promise<{ success: boolean }>,
    hasChanges: boolean,
    delay = 30000
) {
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const [isAutoSaving, setIsAutoSaving] = useState(false)

    useEffect(() => {
        if (hasChanges) {
            // Clear existing timer
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }

            // Set new timer
            timerRef.current = setTimeout(async () => {
                setIsAutoSaving(true)
                await onSave()
                setIsAutoSaving(false)
            }, delay)
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [hasChanges, onSave, delay])

    return { isAutoSaving }
}
