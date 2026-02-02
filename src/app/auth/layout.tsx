import { SparklesCore } from '@/components/global/sparkles'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import React from 'react'

type Props = { children: React.ReactNode }

const Layout = ({ children }: Props) => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-[#111] relative overflow-hidden">
      <div className="absolute inset-0 z-0 h-full w-full [background:radial-gradient(125%_125%_at_50%_10%,#000_35%,#223_100%)]" />
      <div className="absolute inset-0 w-full h-full z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>
      <div className="absolute top-10 left-10 z-[20] flex items-center gap-2">
        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
          Flowlab
        </div>
      </div>
      <div className="relative z-10 w-full flex items-center justify-center">
        {/* Glassmorphism Container */}
        <div className="relative p-1 rounded-xl bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-800/50 backdrop-blur-md shadow-2xl">
          <div className="bg-black/40 rounded-lg p-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout

