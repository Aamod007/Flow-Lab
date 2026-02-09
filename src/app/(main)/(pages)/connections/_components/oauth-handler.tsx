'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function OAuthHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      // Handle OAuth success
      if (event.data?.type === 'OAUTH_SUCCESS') {
        console.log(`OAuth success for provider: ${event.data.provider}`)
        console.log('OAuth data received:', event.data.data)

        // Show success toast
        toast.success(`${event.data.provider} connected successfully!`)

        // If we have OAuth data, reload the page with the params to trigger server-side connection save
        if (event.data.data) {
          const params = new URLSearchParams(event.data.data).toString()
          window.location.href = `/connections?${params}`
        } else {
          // Simple refresh if no data
          router.refresh()
        }
      }

      // Handle OAuth error
      if (event.data?.type === 'OAUTH_ERROR') {
        console.error(`OAuth error: ${event.data.error}`)
        toast.error(`Connection failed: ${event.data.error}`)
      }
    }

    // Listen for messages from OAuth popup
    window.addEventListener('message', handleOAuthMessage)

    return () => {
      window.removeEventListener('message', handleOAuthMessage)
    }
  }, [router])

  return null
}