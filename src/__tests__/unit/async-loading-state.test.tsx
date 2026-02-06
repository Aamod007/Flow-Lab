/**
 * Example Test 6: Loading State Display
 * 
 * Validates: Requirements 8.3
 * 
 * This test ensures that async operations properly display loading states
 * to users during execution and clear them upon completion.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock component that demonstrates loading state pattern
const AsyncButton = ({ onSubmit }: { onSubmit: () => Promise<void> }) => {
    const [isLoading, setIsLoading] = React.useState(false)

    const handleClick = async () => {
        try {
            setIsLoading(true)
            await onSubmit()
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button onClick={handleClick} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Submit'}
        </button>
    )
}

describe('Example 6: Loading State Display', () => {
    it('should display loading state during async operation', async () => {
        const mockSubmit = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
        const user = userEvent.setup()

        render(<AsyncButton onSubmit={mockSubmit} />)

        const button = screen.getByRole('button')

        // Initial state
        expect(button).toHaveTextContent('Submit')
        expect(button).not.toBeDisabled()

        // Click button
        await user.click(button)

        // Loading state
        expect(button).toHaveTextContent('Loading...')
        expect(button).toBeDisabled()

        // Wait for completion
        await waitFor(() => {
            expect(button).toHaveTextContent('Submit')
            expect(button).not.toBeDisabled()
        })

        expect(mockSubmit).toHaveBeenCalledTimes(1)
    })

    it('should clear loading state even if operation fails', async () => {
        const mockSubmit = jest.fn(() => Promise.reject(new Error('Failed')))
        const user = userEvent.setup()

        render(<AsyncButton onSubmit={mockSubmit} />)

        const button = screen.getByRole('button')

        await user.click(button)

        // Wait for completion
        await waitFor(() => {
            expect(button).toHaveTextContent('Submit')
            expect(button).not.toBeDisabled()
        })
    })

    it('should prevent multiple simultaneous submissions', async () => {
        let resolvePromise: () => void
        const mockSubmit = jest.fn(() => new Promise<void>(resolve => {
            resolvePromise = resolve
        }))
        const user = userEvent.setup()

        render(<AsyncButton onSubmit={mockSubmit} />)

        const button = screen.getByRole('button')

        // First click
        await user.click(button)
        expect(button).toBeDisabled()

        // Try to click again while loading
        await user.click(button)

        // Should only be called once
        expect(mockSubmit).toHaveBeenCalledTimes(1)

        // Resolve the promise
        resolvePromise!()

        await waitFor(() => {
            expect(button).not.toBeDisabled()
        })
    })
})
