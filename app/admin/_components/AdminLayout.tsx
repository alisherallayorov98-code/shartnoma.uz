'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const NAV = [
  { key: 'clients',       icon: '👥', label: 'Mijozlar' },
  { key: 'payments',      icon: '💳', label: "To'lovlar" },
  { key: 'demo',          icon: '🎯', label: 'Demo' },
  { key: 'new',           icon: '🆕', label: 'Yangi' },
  { key: 'feedback',      icon: '💬', label: 'Takliflar' },
  { key: 'contracts',     icon: '📄', label: 'Shartnomalar' },
  { key: 'templates',     icon: '📑', label: 'Shablonlar' },
  { key: 'content',       icon: '🖼️', label: 'Kontent' },
  { key: 'settings',      icon: '⚙️', label: 'Sozlamalar' },
  { key: 'global_db',     icon: '🗄️', label: 'Global Baza' },
  { key: 'announcements', icon: '🔔', label: 'Yangiliklar' },
]

interface Props {
  tab: string
  setTab: (t: string) => void
  onTabChange?: (t: string) => void
  darkMode: boolean
  toggleDark: () => void
  onExcel: () => void
  msg: { text: string; ok: boolean }
  counts: Record<string, number>
  children: React.ReactNode
}

export default function AdminLayout({ tab, setTab, onTabChange, darkMode, toggleDark, onExcel, msg, counts, children }: Props) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const bg = darkMode ? 'bg-[#0a0f1e]' : 'bg-gray-50'
  const sidebar = darkMode ? 'bg-[#0d1424] border-[#1e293b]' : 'bg-white border-gray-200'
  const header = darkMode ? 'bg-[#0d1424] border-[#1e293b]' : 'bg-white border-gray-200'
  const text = darkMode ? 'text-white' : 'text-gray-900'
  const subtext = darkMode ? 'text-gray-400' : 'text-gray-500'
  const activeNav = darkMode ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'bg-blue-50 text-blue-600 border-blue-200'
  const idleNav = darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white border-transparent' : 'text-gray-600 hover:bg-gray-100 border-transparent'

  function handleTab(key: string) {
    setTab(key)
    onTabChange?.(key)
  }

  return (
    <div className={`min-h-screen ${bg} flex flex-col`}>
      {/* Top Header */}
      <header className={`${header} border-b h-14 flex items-center justify-between px-4 sticky top-0 z-20 flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <button onClick={() => setCollapsed(c => !c)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg ${subtext} hover:${text} transition`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xs text-white">K</div>
            <span className={`font-bold text-sm ${text}`}>Kabinetim Admin</span>
            <span className="text-red-400 text-[10px] bg-red-900/30 px-1.5 py-0.5 rounded-md font-bold">ADMIN</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button onClick={toggleDark} title={darkMode ? 'Kunduzgi' : 'Tungi'}
            className={`w-8 h-8 flex items-center justify-center rounded-lg ${subtext} hover:${text} transition`}>
            {darkMode ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
              </svg>
            )}
          </button>
          <button onClick={onExcel}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            Excel
          </button>
          <button onClick={() => router.push('/dashboard')}
            className={`text-xs px-3 py-1.5 rounded-lg border ${darkMode ? 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:text-gray-800'} transition`}>
            Dashboard →
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebar} border-r flex-shrink-0 transition-all duration-200 ${collapsed ? 'w-14' : 'w-52'} flex flex-col`}>
          <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
            {NAV.map(item => {
              const count = counts[item.key]
              return (
                <button key={item.key} onClick={() => handleTab(item.key)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-sm transition font-medium ${tab === item.key ? activeNav : idleNav}`}>
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {count !== undefined && count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === item.key ? 'bg-blue-500/30 text-blue-300' : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                          {count}
                        </span>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </nav>

          <div className={`px-2 py-3 border-t ${darkMode ? 'border-[#1e293b]' : 'border-gray-200'}`}>
            <button onClick={() => router.push('/dashboard')}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition ${idleNav}`}>
              <span className="text-base">🏠</span>
              {!collapsed && <span>Asosiy sayt</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {msg.text && (
            <div className={`mx-5 mt-4 px-4 py-2.5 rounded-xl text-sm font-medium ${msg.ok ? 'bg-emerald-900/50 border border-emerald-700 text-emerald-300' : 'bg-red-900/50 border border-red-700 text-red-300'}`}>
              {msg.text}
            </div>
          )}
          <div className="p-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
