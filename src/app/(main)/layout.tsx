import React from 'react'
import Sidebar from '@/components/sidebar'
import InfoBar from '@/components/infobar'
import { ErrorBoundary } from '@/components/error-boundary'

type Props = { children: React.ReactNode }

const Layout = (props: Props) => {
  return (
    <div className="flex overflow-hidden h-screen">
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <div className="w-full flex flex-col h-screen">
        <ErrorBoundary>
          <InfoBar />
        </ErrorBoundary>
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary>
            {props.children}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

export default Layout
