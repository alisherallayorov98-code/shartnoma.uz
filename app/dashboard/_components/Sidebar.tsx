'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDashboard } from '../context'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'

const NAV_ITEMS = [
  { key: 'overview',        href: '/dashboard',                icon: '▣',  label: t.nav.overview },
  { key: 'contracts',       href: '/dashboard/shartnomalar',   icon: '📄', label: t.nav.contracts },
  { key: 'specifications',  href: '/dashboard/spesifikatsiyalar', icon: '📋', label: t.nav.specifications },
  { key: 'shablonlar',      href: '/dashboard/shablonlar',    icon: '📑', label: t.nav.shablonlar },
  { key: 'counterparties',  href: '/dashboard/kontragentlar', icon: '🤝', label: t.nav.counterparties },
  { key: 'yurist_ai',       href: '/dashboard/yurist',        icon: '⚖️', label: t.nav.yurist_ai },
  { key: 'kadrlar',         href: '/dashboard/kadrlar',       icon: '👥', label: t.nav.kadrlar },
  { key: 'xodimlar',        href: '/dashboard/xodimlar',      icon: '🧑‍💼', label: t.nav.xodimlar },
  { key: 'buxgalter',       href: '/dashboard/buxgalter',     icon: '💼', label: t.nav.buxgalter },
  { key: 'kotiba',          href: '/dashboard/kotiba',        icon: '🗂️', label: t.nav.kotiba },
  { key: 'seif',            href: '/dashboard/seif',          icon: '🔒', label: t.nav.seif },
  { key: 'profile',         href: '/dashboard/profil',        icon: '👤', label: t.nav.profile },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { lang, setLang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const {
    sidebarOpen, setSidebarOpen,
    orgDropdown, setOrgDropdown,
    orgs, activeOrg, contracts,
    switchOrg, logout,
    isAdmin, userEmail, userId,
    subscription, isSubValid, subDaysLeft,
    getQuotaInfo,
    openUpgradeModal,
  } = useDashboard()

  const quota = getQuotaInfo()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    <aside className={`
      ${sidebarOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full sm:translate-x-0'}
      fixed sm:relative inset-y-0 left-0 z-50 sm:z-auto
      bg-[#0A1628] border-r border-[#1E293B] flex flex-col flex-shrink-0 transition-all duration-300
      h-full
    `}>

      {/* Logo + hamburger */}
      <div className="h-12 flex items-center px-3 border-b border-[#1E293B] gap-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1F2937] transition flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-lg">S</div>
        {sidebarOpen && <span className="text-lg font-bold">Shartnoma.uz</span>}
      </div>

      {/* Org Switcher */}
      {sidebarOpen && orgs.length > 0 && (
        <div className="px-2 pt-2 relative">
          <button
            onClick={() => setOrgDropdown(!orgDropdown)}
            className="w-full flex items-center gap-2 bg-[#1F2937] hover:bg-[#1F2937] border border-[#1E293B] rounded-lg px-2.5 py-1.5 transition text-left"
          >
            <div className="w-7 h-7 bg-blue-900 rounded-md flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
              {activeOrg?.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{activeOrg?.name}</div>
              <div className="text-xs text-gray-500">INN: {activeOrg?.inn || '—'}</div>
            </div>
            <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${orgDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          {orgDropdown && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-xl shadow-xl z-50 overflow-hidden">
              {orgs.map(org => (
                <button key={org.id} onClick={() => switchOrg(org)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#1F2937] transition text-sm ${activeOrg?.id === org.id ? 'bg-blue-900/30 text-blue-300' : 'text-gray-300'}`}>
                  <div className="w-6 h-6 bg-[#1F2937] rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {org.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{org.name}</div>
                    <div className="text-xs text-gray-500">{org.inn}</div>
                  </div>
                  {activeOrg?.id === org.id && <span className="ml-auto text-blue-400 text-xs">●</span>}
                </button>
              ))}
              <div className="border-t border-[#1E293B]">
                <Link href="/dashboard/tashkilotlar"
                  onClick={() => setOrgDropdown(false)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[#1F2937] transition text-sm text-gray-300">
                  <span>🏢</span> Tashkilotlarni boshqarish
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quota bar + subscription info */}
      {sidebarOpen && quota && (
        <div className="px-2 pt-1.5">
          <div className="bg-[#1F2937] rounded-lg px-2.5 py-1.5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-400">Tarif: <span className="text-white font-medium">{quota.plan}</span></span>
              {quota.limit && <span className="text-gray-400">{quota.used}/{quota.limit}</span>}
            </div>
            {quota.limit && (
              <>
                <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${quota.percent! >= 100 ? 'bg-red-500' : quota.percent! >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                    style={{ width: `${quota.percent}%` }}/>
                </div>
                {quota.percent! >= 80 && (
                  <button onClick={openUpgradeModal} className="text-xs text-yellow-400 mt-1.5 hover:text-yellow-300">
                    ⚡ Tarifni yaxshilash →
                  </button>
                )}
              </>
            )}
            {/* Subscription end date */}
            {isSubValid && subscription?.period_end && (
              <div className={`mt-1.5 text-xs flex items-center gap-1 ${subDaysLeft !== null && subDaysLeft <= 5 ? 'text-red-400' : subDaysLeft !== null && subDaysLeft <= 15 ? 'text-yellow-400' : 'text-gray-500'}`}>
                <span>{subDaysLeft !== null && subDaysLeft <= 5 ? '🔴' : subDaysLeft !== null && subDaysLeft <= 15 ? '🟡' : '📅'}</span>
                <span>
                  {new Date(subscription.period_end).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })} gacha
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-1.5 space-y-0.5 overflow-hidden">
        {NAV_ITEMS.map(item => (
          <Link key={item.key} href={item.href}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
              isActive(item.href)
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}>
            <span className="text-sm flex-shrink-0">{item.icon}</span>
            {sidebarOpen && <span className="flex-1 text-left font-medium">{T(item.label)}</span>}
            {sidebarOpen && item.key === 'contracts' && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive(item.href) ? 'bg-blue-500' : 'bg-[#1E293B] text-gray-400'}`}>
                {contracts.length}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User / Admin / Logout */}
      <div className="px-2 pb-2 pt-1 border-t border-[#1E293B] space-y-0.5">
        {isAdmin && (
          <a href="/admin" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-900/30 hover:text-red-300 transition">
            <span className="flex-shrink-0">⚙️</span>
            {sidebarOpen && <span>Admin panel ↗</span>}
          </a>
        )}
        <button onClick={logout}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-white/80 hover:bg-red-900/30 hover:text-red-400 transition">
          <span className="flex-shrink-0">🚪</span>
          {sidebarOpen && <span>{T(t.nav.logout)}</span>}
        </button>
      </div>
    </aside>

    </>
  )
}
