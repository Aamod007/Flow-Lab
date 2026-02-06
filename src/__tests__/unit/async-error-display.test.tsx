/**
 * Example Test 7: Error Display
 * 
 * Validates: Requirements 8.3, 8.5
 * 
 * This test ensures that async operations properly display error messages
 * to users when operations fail.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import React from 'react'

// Mock component that demonstrates error display pattern
const AsyncFormWithError = ({ onSubmit }: { onSubmit: (value: string) => Promise<void> }) => {
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [value, setValue] = React.useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        try {
            setIsLoading(true)
            await onSubmit(value)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred'
            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value"
            />
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit'}
            </button>
            {error && (
                <div role="alert" data-testid="error-message">
                    {error}
                </div>
            )}
        </form>
    )
}

describe('Example 7: Error Display', () => {
    it('should display error message when async operation fails', async () => {
        const mockSubmit = jest.fn(() => Promise.reject(new Error('Network error')))
        const user = userEvent.setup()

        render(<AsyncFormWithError onSubmit={mockSubmit} />)

        const input = screen.getByPlaceholderText('Enter value')
        const button = screen.getByRole('button')

        await user.type(input, 'test value')
        await user.click(button)

        // Wait for error to appear
        await waitFor(() => {
            const errorMessage = screen.getByTestId('error-message')
            expect(errorMessage).toHaveTextContent('Network error')
        })

        expect(mockSubmit).toHaveBeenCalledWith('test value')
    })

    it('should clear previous error on new submission', async () => {
        let shouldFail = true
        const mockSubmit = jest.fn(() => {
            if (shouldFail) {
                return Promise.reject(new Error('First error'))
            }
            return Promise.resolve()
        })
        const user = userEvent.setup()

        render(<AsyncFormWithError onSubmit={mockSubmit} />)

        const input = screen.getByPlaceholderText('Enter value')
        const button = screen.getByRole('button')

        // First submission - fails
        await user.type(input, 'test')
        await user.click(button)

        await waitFor(() => {
            expect(screen.getByTestId('error-message')).toHaveTextContent('First error')
        })

        // Second submission - succeeds
        shouldFail = false
        await user.click(button)

        await waitFor(() => {
            expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
        })
    })

    it('should handle non-Error objects gracefully', async () => {
        const mockSubmit = jest.fn(() => Promise.reject('String error'))
        const user = userEvent.setup()

        render(<AsyncFormWithError onSubmit={mockSubmit} />)

        const button = screen.getByRole('button')
        await user.click(button)

        await waitFor(() => {
            const errorMessage = screen.getByTestId('error-message')
            expect(errorMessage).toHaveTextContent('An error occurred')
        })
    })

    it('should display user-friendly error messages', async () => {
        const mockSubmit = jest.fn(() =>
            Promise.reject(new Error('Failed to update profile'))
        )
        const user = userEvent.setup()

        render(<AsyncFormWithError onSubmit={mockSubmit} />)

        const button = screen.getByRole('button')
        await user.click(button)

        await waitFor(() => {
            const errorMessage = screen.getByTestId('error-message')
            expect(errorMessage).toHaveTextContent('Failed to update profile')
            // Ensure error message is user-friendly (no stack traces, no technical jargon)
            expect(errorMessage.textContent).not.toContain('at Object')
            expect(errorMessage.textContent).not.toContain('stack')
        })
    })
})
