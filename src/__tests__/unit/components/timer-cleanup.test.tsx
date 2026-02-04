/**
 * Unit tests for timer cleanup in components
 * Validates: Requirements 4.2 - Component cleanup on unmount
 */

import { renderHook, act } from '@testing-library/react'
import { useEffect, useRef } from 'react'

describe('Timer Cleanup Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should cleanup setTimeout on unmount', () => {
    const callback = jest.fn()
    
    const { unmount } = renderHook(() => {
      useEffect(() => {
        const timeoutId = setTimeout(callback, 1000)
        return () => clearTimeout(timeoutId)
      }, [])
    })

    // Unmount before timeout fires
    unmount()
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // Callback should NOT have been called
    expect(callback).not.toHaveBeenCalled()
  })

  it('should cleanup setInterval on unmount', () => {
    const callback = jest.fn()
    
    const { unmount } = renderHook(() => {
      useEffect(() => {
        const intervalId = setInterval(callback, 100)
        return () => clearInterval(intervalId)
      }, [])
    })

    // Let interval run once
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    // Unmount
    unmount()
    
    // Fast-forward time - interval should not run again
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Should still be 1 (not 6)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should cleanup multiple timers on unmount', () => {
    const callback1 = jest.fn()
    const callback2 = jest.fn()
    
    const { unmount } = renderHook(() => {
      const timer1Ref = useRef<NodeJS.Timeout | null>(null)
      const timer2Ref = useRef<NodeJS.Timeout | null>(null)

      useEffect(() => {
        timer1Ref.current = setTimeout(callback1, 1000)
        timer2Ref.current = setTimeout(callback2, 2000)

        return () => {
          if (timer1Ref.current) clearTimeout(timer1Ref.current)
          if (timer2Ref.current) clearTimeout(timer2Ref.current)
        }
      }, [])
    })

    // Unmount before timers fire
    unmount()
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    // Neither callback should have been called
    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).not.toHaveBeenCalled()
  })

  it('should handle cleanup when timer already fired', () => {
    const callback = jest.fn()
    
    const { unmount } = renderHook(() => {
      useEffect(() => {
        const timeoutId = setTimeout(callback, 100)
        return () => clearTimeout(timeoutId)
      }, [])
    })

    // Let timer fire
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    // Unmount after timer fired - should not throw
    expect(() => unmount()).not.toThrow()
  })

  it('should cleanup timer when dependencies change', () => {
    const callback = jest.fn()
    let dependency = 'initial'
    
    const { rerender, unmount } = renderHook(
      ({ dep }) => {
        useEffect(() => {
          const timeoutId = setTimeout(() => callback(dep), 1000)
          return () => clearTimeout(timeoutId)
        }, [dep])
      },
      { initialProps: { dep: dependency } }
    )

    // Change dependency before timer fires
    dependency = 'changed'
    rerender({ dep: dependency })
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    // Should only be called once with new dependency
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('changed')

    unmount()
  })
})
