'use client'

import { useDashboard } from '../context'
import { useLang } from '@/lib/LanguageContext'
import { LANG_LABELS, type Lang } from '@/lib/i18n'
import { useTheme } from '@/lib/ThemeContext'

export function TopBar() {
  const { userEmail, isAdmin } = useDashboard()
  const { lang, setLang } = useLang()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="hidden sm:flex items-center justify-end gap-2 px-6 h-12 border-b border-[#1E293B] bg-[#0F172A] flex-shrink-0">
      {/* Language */}
      <div className="flex gap-0.5">
        {(['uz', 'oz', 'ru'] as Lang[]).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              lang === l ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-[#1F2937]'
            }`}>
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme} title={theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition">
        {theme === 'dark' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
          </svg>
        )}
      </button>

      {/* User */}
      <div className="flex items-center gap-2 pl-2 border-l border-[#1E293B]">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold uppercase">
          {userEmail?.[0] || 'U'}
        </div>
        <span className="text-sm text-gray-300 max-w-[160px] truncate hidden lg:block">{userEmail}</span>
        {isAdmin && <span className="text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded">Admin</span>}
      </div>
    </div>
  )
}
