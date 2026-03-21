'use client'

export const dynamic = 'force-dynamic'

import { ReactNode } from 'react'
import { DashboardProvider, useDashboard } from './context'
import { DashboardSidebar } from './_components/Sidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProvider>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 p-8 overflow-auto">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-7 w-48 bg-gray-800 rounded-lg animate-pulse"/>
        <div className="h-9 w-32 bg-gray-800 rounded-lg animate-pulse"/>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="h-4 w-24 bg-gray-800 rounded mb-3"/>
            <div className="h-7 w-16 bg-gray-700 rounded"/>
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
          <div className="h-5 w-32 bg-gray-800 rounded animate-pulse"/>
          <div className="ml-auto h-8 w-48 bg-gray-800 rounded-lg animate-pulse"/>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-800/50 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-4 w-28 bg-gray-800 rounded"/>
            <div className="h-4 w-20 bg-gray-800 rounded"/>
            <div className="h-4 w-32 bg-gray-800 rounded"/>
            <div className="ml-auto h-6 w-16 bg-gray-700 rounded-full"/>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const { initialLoading } = useDashboard()

  return (
    <div className="min-h-screen bg-gray-950 flex text-white">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto min-h-screen">
        {initialLoading ? <LoadingSkeleton /> : children}
      </div>
    </div>
  )
}
