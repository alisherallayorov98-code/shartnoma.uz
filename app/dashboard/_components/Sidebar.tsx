'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDashboard } from '../context'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, LANG_LABELS, type Lang } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import { useTheme } from '@/lib/ThemeContext'

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
  const { toast } = useToast()
  const { theme, toggleTheme } = useTheme()

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

  // Feedback modal
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [fbForm, setFbForm] = useState({ category: 'taklif', title: '', message: '' })
  const [fbSaving, setFbSaving] = useState(false)

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!fbForm.title.trim() || !fbForm.message.trim()) return
    setFbSaving(true)
    const { error } = await supabase.from('feedback').insert({
      user_id: userId,
      organization_id: activeOrg?.id || null,
      user_email: userEmail,
      category: fbForm.category,
      title: fbForm.title.trim(),
      message: fbForm.message.trim(),
    })
    setFbSaving(false)
    if (error) { toast('Yuborishda xato: ' + error.message, 'error'); return }
    toast('Fikr-mulohazangiz yuborildi. Rahmat!', 'success')
    setFeedbackOpen(false)
    setFbForm({ category: 'taklif', title: '', message: '' })
  }

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
      bg-[#0F172A] border-r border-[#1E293B] flex flex-col flex-shrink-0 transition-all duration-300
      h-full sm:h-auto min-h-screen
    `}>

      {/* Logo + hamburger */}
      <div className="h-16 flex items-center px-4 border-b border-[#1E293B] gap-3">
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
        <div className="px-3 pt-3 relative">
          <button
            onClick={() => setOrgDropdown(!orgDropdown)}
            className="w-full flex items-center gap-2 bg-[#1F2937] hover:bg-[#1F2937] border border-[#1E293B] rounded-lg px-3 py-2.5 transition text-left"
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
        <div className="px-3 pt-3">
          <div className="bg-[#1F2937] rounded-lg px-3 py-2.5">
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
      <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(item => (
          <Link key={item.key} href={item.href}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              isActive(item.href)
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-[#1F2937] hover:text-white'
            }`}>
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {sidebarOpen && <span className="flex-1 text-left font-medium">{T(item.label)}</span>}
            {sidebarOpen && item.key === 'contracts' && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive(item.href) ? 'bg-blue-500' : 'bg-[#1E293B] text-gray-400'}`}>
                {contracts.length}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Language switcher + Theme toggle */}
      {sidebarOpen && (
        <div className="px-3 pb-1 space-y-1.5">
          <div className="flex gap-1">
            {(['uz', 'oz', 'ru'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${lang === l ? 'bg-blue-600 text-white' : 'bg-[#1F2937] text-gray-400 hover:bg-[#111827]'}`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
          <button onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#1F2937] hover:bg-[#0F172A] transition text-xs text-gray-400 hover:text-white">
            <span className="flex items-center gap-2">
              {theme === 'dark' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
                </svg>
              )}
              {theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}
            </span>
            <span className="text-gray-600 text-[10px]">{theme === 'dark' ? 'Hozir: Tun' : 'Hozir: Kun'}</span>
          </button>
        </div>
      )}
      {!sidebarOpen && (
        <div className="px-2 pb-1">
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}
            className="w-full flex items-center justify-center py-2 rounded-lg bg-[#1F2937] hover:bg-[#0F172A] transition text-gray-400 hover:text-white">
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
        </div>
      )}

      {/* User / Admin / Logout */}
      <div className="p-3 border-t border-[#1E293B] space-y-2">
        {sidebarOpen && (
          <div className="px-3 py-2 rounded-lg bg-[#1F2937]">
            <div className="text-xs text-gray-500">{T(t.profile.account)}</div>
            <div className="text-sm text-white truncate font-medium mt-0.5">{userEmail}</div>
          </div>
        )}
        {isAdmin && (
          <a href="/admin" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-900/30 transition">
            <span className="flex-shrink-0">⚙️</span>
            {sidebarOpen && <span>Admin panel ↗</span>}
          </a>
        )}
        <button onClick={() => setFeedbackOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-[#1F2937] hover:text-yellow-400 transition">
          <span className="flex-shrink-0">💬</span>
          {sidebarOpen && <span>Taklif / Xato bildirish</span>}
        </button>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition">
          <span className="flex-shrink-0">🚪</span>
          {sidebarOpen && <span>{T(t.nav.logout)}</span>}
        </button>
      </div>
    </aside>

    {/* Feedback modal */}
    {feedbackOpen && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
            <h2 className="text-base font-semibold text-white">💬 Taklif yoki xato bildirish</h2>
            <button onClick={() => setFeedbackOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] text-xl">×</button>
          </div>
          <form onSubmit={submitFeedback} className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Turi</label>
              <div className="flex gap-2">
                {[
                  { value: 'taklif', label: '💡 Taklif' },
                  { value: 'bug',    label: '🐛 Xato' },
                  { value: 'savol',  label: '❓ Savol' },
                  { value: 'boshqa', label: '📝 Boshqa' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setFbForm(f => ({ ...f, category: opt.value }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition border ${
                      fbForm.category === opt.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-[#0F172A] border-[#1E293B] text-gray-400 hover:border-blue-600/50'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sarlavha *</label>
              <input
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-500"
                placeholder="Qisqacha ta'rif..."
                required
                value={fbForm.title}
                onChange={e => setFbForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Batafsil *</label>
              <textarea
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-500 resize-none"
                rows={4}
                placeholder="Muammo yoki taklifingizni batafsil yozing..."
                required
                value={fbForm.message}
                onChange={e => setFbForm(f => ({ ...f, message: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setFeedbackOpen(false)}
                className="flex-1 py-2.5 rounded-lg text-sm text-gray-400 bg-[#1F2937] hover:bg-[#334155] transition">
                Bekor qilish
              </button>
              <button type="submit" disabled={fbSaving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition">
                {fbSaving ? 'Yuborilmoqda...' : 'Yuborish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  )
}
