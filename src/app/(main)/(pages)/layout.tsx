import React from 'react'
import { ErrorBoundary } from '@/components/error-boundary'

type Props = { children: React.ReactNode }

const Layout = ({ children }: Props) => {
  return (
    <div className="border-l-[1px] border-t-[1px] h-full rounded-l-3xl border-muted-foreground/20 overflow-scroll ">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  )
}

export default Layout
