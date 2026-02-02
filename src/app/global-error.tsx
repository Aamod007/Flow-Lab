'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global error:', error)
    }, [error])

    return (
        <html>
            <body>
                <div style={{
                    display: 'flex',
                    height: '100vh',
                    width: '100%',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    backgroundColor: '#0a0a0a',
                    color: '#fafafa'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        Something went wrong!
                    </h2>
                    <p style={{ color: '#a1a1aa' }}>
                        A critical error occurred. Please refresh the page.
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    )
}
