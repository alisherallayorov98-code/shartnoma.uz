'use client'

export const dynamic = 'force-dynamic'

import { ReactNode } from 'react'
import { DashboardProvider, useDashboard } from './context'
import { DashboardSidebar } from './_components/Sidebar'
import ErrorBoundary from './_components/ErrorBoundary'
import UpgradeModal from './_components/UpgradeModal'
import { ToastProvider } from '@/lib/toast'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DashboardProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </DashboardProvider>
    </ToastProvider>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="h-7 w-48 bg-[#1F2937] rounded-lg animate-pulse"/>
        <div className="h-9 w-32 bg-[#1F2937] rounded-lg animate-pulse"/>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="h-4 w-24 bg-[#1F2937] rounded mb-3"/>
            <div className="h-7 w-16 bg-[#1F2937] rounded"/>
          </div>
        ))}
      </div>
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1E293B] flex items-center gap-3">
          <div className="h-5 w-32 bg-[#1F2937] rounded animate-pulse"/>
          <div className="ml-auto h-8 w-48 bg-[#1F2937] rounded-lg animate-pulse"/>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[#1E293B]/50 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-4 w-28 bg-[#1F2937] rounded"/>
            <div className="h-4 w-20 bg-[#1F2937] rounded"/>
            <div className="h-4 w-32 bg-[#1F2937] rounded"/>
            <div className="ml-auto h-6 w-16 bg-[#1F2937] rounded-full"/>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const { initialLoading, sidebarOpen, setSidebarOpen } = useDashboard()

  return (
    <div className="h-screen bg-[#0B1220] flex text-white overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 min-w-0 overflow-auto h-screen">
        {/* Mobile top bar */}
        <div className="sm:hidden flex items-center gap-3 px-4 h-14 border-b border-[#1E293B] bg-[#0F172A] sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1F2937] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">S</div>
          <span className="font-semibold text-sm">Shartnoma.uz</span>
        </div>
        {initialLoading ? <LoadingSkeleton /> : <ErrorBoundary>{children}</ErrorBoundary>}
        <UpgradeModal />
      </div>
    </div>
  )
}
