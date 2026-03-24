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
    <div className="flex-1 p-8 overflow-auto bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse"/>
        <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse"/>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse shadow-sm" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="h-4 w-24 bg-slate-200 rounded mb-3"/>
            <div className="h-7 w-16 bg-slate-100 rounded"/>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse"/>
          <div className="ml-auto h-8 w-48 bg-slate-200 rounded-lg animate-pulse"/>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-slate-100 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-4 w-28 bg-slate-200 rounded"/>
            <div className="h-4 w-20 bg-slate-200 rounded"/>
            <div className="h-4 w-32 bg-slate-200 rounded"/>
            <div className="ml-auto h-6 w-16 bg-slate-100 rounded-full"/>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const { initialLoading, sidebarOpen, setSidebarOpen } = useDashboard()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto min-h-screen">
        {/* Mobile top bar */}
        <div className="sm:hidden flex items-center gap-3 px-4 h-14 border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">S</div>
          <span className="font-semibold text-sm text-gray-900">Shartnoma.uz</span>
        </div>
        {initialLoading ? <LoadingSkeleton /> : <ErrorBoundary>{children}</ErrorBoundary>}
        <UpgradeModal />
      </div>
    </div>
  )
}
