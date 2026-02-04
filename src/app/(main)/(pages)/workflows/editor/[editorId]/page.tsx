import { ConnectionsProvider } from '@/providers/connections-provider'
import EditorProvider from '@/providers/editor-provider'
import React from 'react'
import EditorCanvas from './_components/editor-canvas'
import { ErrorBoundary } from '@/components/error-boundary'

type Props = {}

const Page = (props: Props) => {
  return (
    <div className="h-full">
      <ErrorBoundary>
        <EditorProvider>
          <ConnectionsProvider>
            <EditorCanvas />
          </ConnectionsProvider>
        </EditorProvider>
      </ErrorBoundary>
    </div>
  )
}

export default Page
