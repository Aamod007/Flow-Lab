import React from 'react'
import Sidebar from '@/components/sidebar'
import InfoBar from '@/components/infobar'

type Props = { children: React.ReactNode }

const Layout = (props: Props) => {
  return (
    <div className="flex overflow-hidden h-screen">
      <Sidebar />
      <div className="w-full flex flex-col h-screen">
        <InfoBar />
        <div className="flex-1 overflow-hidden">
          {props.children}
        </div>
      </div>
    </div>
  )
}

export default Layout
