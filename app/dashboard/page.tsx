'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useDashboard } from './context'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'

const STATUSES = {
  draft:     { bg: 'bg-[#1F2937]',    text: 'text-gray-300' },
  active:    { bg: 'bg-emerald-900', text: 'text-emerald-300' },
  completed: { bg: 'bg-blue-900',    text: 'text-blue-300' },
  cancelled: { bg: 'bg-red-900',     text: 'text-red-300' },
}

export default function DashboardOverviewPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const {
    contracts, orgs, cps, activeOrg,
    subscription, isAdmin,
    isFree, isSubValid, subDaysLeft,
    getQuotaInfo,
    openUpgradeModal,
  } = useDashboard()

  const quota = getQuotaInfo()

  const cntTotal     = contracts.length
  const cntActive    = contracts.filter(c => c.status === 'active').length
  const cntDraft     = contracts.filter(c => c.status === 'draft').length
  const cntDone      = contracts.filter(c => c.status === 'completed').length
  const cntCancelled = contracts.filter(c => c.status === 'cancelled').length
  const totalActive  = contracts.filter(c => c.status === 'active').reduce((s, c) => s + (c.amount || 0), 0)
  const totalDone    = contracts.filter(c => c.status === 'completed').reduce((s, c) => s + (c.amount || 0), 0)
  const totalDraft   = contracts.filter(c => c.status === 'draft').reduce((s, c) => s + (c.amount || 0), 0)
  const totalAll     = contracts.reduce((s, c) => s + (c.amount || 0), 0)

  const today = new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })

  const recentContracts = useMemo(() =>
    [...contracts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
  [contracts])

  // Monthly chart — last 6 months
  const monthlyData = useMemo(() => {
    const result: { label: string; count: number; amount: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const y = d.getFullYear()
      const m = d.getMonth()
      const label = d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { month: 'short' })
      const monthContracts = contracts.filter(c => {
        const cd = new Date(c.created_at)
        return cd.getFullYear() === y && cd.getMonth() === m
      })
      result.push({ label, count: monthContracts.length, amount: monthContracts.reduce((s, c) => s + (c.amount || 0), 0) })
    }
    return result
  }, [contracts, lang])
  const maxCount = Math.max(...monthlyData.map(m => m.count), 1)

  const showSubWarning = !isAdmin && isSubValid && subDaysLeft !== null && subDaysLeft <= 5

  // Faol shartnomalar muddati: extra_data.end_date yoki contract_date + 1 yil asosida
  const expiringContracts = useMemo(() => {
    const now = Date.now()
    return contracts.filter(c => {
      if (c.status !== 'active') return false
      const endDateStr = c.extra_data?.end_date
      if (endDateStr) {
        const daysLeft = (new Date(endDateStr).getTime() - now) / (1000 * 60 * 60 * 24)
        return daysLeft >= 0 && daysLeft <= 30
      }
      const baseDate = c.contract_date || c.created_at
      const daysOld = (now - new Date(baseDate).getTime()) / (1000 * 60 * 60 * 24)
      return daysOld >= 330
    })
  }, [contracts])

  // ── Onboarding: new user with no organization ────────────────────────────
  if (orgs.length === 0) {
    return (
      <main className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0B1220] flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-4xl mx-auto shadow-lg shadow-blue-900/40">
            🏢
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Xush kelibsiz!</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Shartnoma.uz dan foydalanish uchun avval tashkilotingizni qo&apos;shing.
              Bu bir necha soniya vaqt oladi.
            </p>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 text-left space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <span className="w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center text-blue-300 text-xs font-bold shrink-0">1</span>
              Tashkilot nomini va INN raqamini kiriting
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <span className="w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center text-blue-300 text-xs font-bold shrink-0">2</span>
              Direktor va bank rekvizitlarini to&apos;ldiring
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <span className="w-6 h-6 bg-blue-900 rounded-full flex items-center justify-center text-blue-300 text-xs font-bold shrink-0">3</span>
              Shartnoma, kadrlar va hujjatlaringizni boshqaring
            </div>
          </div>
          <Link href="/dashboard/tashkilotlar"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition text-sm">
            + Tashkilot qo&apos;shish
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0B1220]">

      {/* ── Subscription warning ── */}
      {showSubWarning && subDaysLeft !== null && (
        <div className={`mb-5 rounded-2xl p-4 flex items-center gap-4 border ${
          subDaysLeft === 1
            ? 'bg-red-900/30 border-red-700/60'
            : subDaysLeft <= 3
            ? 'bg-orange-900/30 border-orange-700/60'
            : 'bg-yellow-900/20 border-yellow-700/50'
        }`}>
          <div className="text-2xl shrink-0">
            {subDaysLeft === 1 ? '🔴' : subDaysLeft <= 3 ? '🟠' : '🟡'}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-sm ${subDaysLeft === 1 ? 'text-red-300' : subDaysLeft <= 3 ? 'text-orange-300' : 'text-yellow-300'}`}>
              {subDaysLeft === 1
                ? 'Obunangiz bugun tugaydi!'
                : `Obunangiz ${subDaysLeft} kun ichida tugaydi`}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">
              {subscription?.period_end && new Date(subscription.period_end).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })} — obuna muddatini uzaytirishni unutmang
            </div>
          </div>
          <a href="mailto:info@shartnoma.uz?subject=Obunani uzaytirish"
            className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition whitespace-nowrap ${
              subDaysLeft === 1
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : subDaysLeft <= 3
                ? 'bg-orange-600 hover:bg-orange-500 text-white'
                : 'bg-yellow-600 hover:bg-yellow-500 text-white'
            }`}>
            Murojaat qilish →
          </a>
        </div>
      )}

      {/* ── Expiring contracts warning ── */}
      {expiringContracts.length > 0 && (
        <div className="mb-5 rounded-2xl p-4 flex items-center gap-4 border bg-orange-900/20 border-orange-700/50">
          <div className="text-2xl shrink-0">⏰</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-orange-300">
              {expiringContracts.length} ta shartnoma muddati yaqinlashmoqda
            </div>
            <div className="text-gray-400 text-xs mt-0.5 truncate">
              {expiringContracts.slice(0, 3).map(c => c.contract_number).join(', ')}
              {expiringContracts.length > 3 ? ` va yana ${expiringContracts.length - 3} ta` : ''}
            </div>
          </div>
          <Link href="/dashboard/shartnomalar"
            className="shrink-0 text-xs font-semibold px-4 py-2 rounded-xl bg-orange-700 hover:bg-orange-600 text-white transition whitespace-nowrap">
            Ko'rish →
          </Link>
        </div>
      )}

      <div className="space-y-5">

        {/* ── Welcome banner ── */}
        <div className="relative bg-gradient-to-r from-blue-900/60 via-blue-800/40 to-blue-900/40 border border-blue-800/50 rounded-2xl p-6 overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #3b82f6 0%, transparent 60%)' }}/>
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs text-blue-400 mb-1 font-medium tracking-wide uppercase">Shartnoma.uz — Boshqaruv paneli</div>
              <h1 className="text-xl font-bold text-white">{activeOrg?.name || '—'}</h1>
              <div className="text-sm text-gray-400 mt-0.5">INN: {activeOrg?.inn || '—'} · {activeOrg?.director_name || ''}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{today}</div>
              {quota && (
                <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isFree ? 'bg-[#1F2937] text-gray-200' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'}`}>
                  {isFree ? '🔒 Bepul tarif' : `⭐ ${quota.plan} tarif`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 4 stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/shartnomalar"
            className="bg-[#111827] border border-[#1E293B] hover:border-blue-700/60 rounded-xl p-5 transition cursor-pointer group block">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center text-lg">📄</div>
              <span className="text-xs text-gray-600 group-hover:text-blue-400 transition">→</span>
            </div>
            <div className="text-3xl font-bold text-white">{cntTotal}</div>
            <div className="text-xs text-gray-400 mt-1">{T(t.overviewTab.totalContracts)}</div>
            {cntTotal > 0 && <div className="text-xs text-gray-500 mt-1">{cntDraft} qoralama · {cntDone} bajarildi</div>}
          </Link>

          <Link href="/dashboard/shartnomalar"
            className="bg-[#111827] border border-[#1E293B] hover:border-emerald-700/60 rounded-xl p-5 transition cursor-pointer group block">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-900/50 rounded-xl flex items-center justify-center text-lg">✅</div>
              <span className="text-xs text-gray-600 group-hover:text-emerald-400 transition">→</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">{cntActive}</div>
            <div className="text-xs text-gray-400 mt-1">{T(t.overview.activeContracts)}</div>
            {cntActive > 0 && <div className="text-xs text-emerald-700 mt-1">{totalActive.toLocaleString()} so&apos;m</div>}
          </Link>

          <Link href="/dashboard/tashkilotlar"
            className="bg-[#111827] border border-[#1E293B] hover:border-blue-700/60 rounded-xl p-5 transition cursor-pointer group block">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center text-lg">🏢</div>
              <span className="text-xs text-gray-600 group-hover:text-blue-400 transition">→</span>
            </div>
            <div className="text-3xl font-bold text-white">{orgs.length}</div>
            <div className="text-xs text-gray-400 mt-1">{T(t.orgs.title)}</div>
            {activeOrg && <div className="text-xs text-gray-500 mt-1 truncate">Faol: {activeOrg.name}</div>}
          </Link>

          <Link href="/dashboard/kontragentlar"
            className="bg-[#111827] border border-[#1E293B] hover:border-orange-700/60 rounded-xl p-5 transition cursor-pointer group block">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-orange-900/50 rounded-xl flex items-center justify-center text-lg">🤝</div>
              <span className="text-xs text-gray-600 group-hover:text-orange-400 transition">→</span>
            </div>
            <div className="text-3xl font-bold text-white">{cps.length}</div>
            <div className="text-xs text-gray-400 mt-1">{T(t.cp.title)}</div>
          </Link>
        </div>

        {/* ── Moliyaviy, holat, kvota ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Moliyaviy ko'rsatkichlar */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-4 font-medium">Moliyaviy ko&apos;rsatkichlar</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Faol shartnomalar</span>
                <span className="text-sm font-semibold text-emerald-400">{totalActive.toLocaleString()} so&apos;m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Bajarildi</span>
                <span className="text-sm font-semibold text-blue-400">{totalDone.toLocaleString()} so&apos;m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500 inline-block"/>Qoralama</span>
                <span className="text-sm font-semibold text-gray-400">{totalDraft.toLocaleString()} so&apos;m</span>
              </div>
              <div className="border-t border-[#1E293B] pt-3 flex justify-between items-center">
                <span className="text-xs text-gray-500">Jami</span>
                <span className="text-sm font-bold text-white">{totalAll.toLocaleString()} so&apos;m</span>
              </div>
            </div>
          </div>

          {/* Shartnomalar holati */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-4 font-medium">Shartnomalar holati</div>
            {cntTotal === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">Shartnomalar yo&apos;q</div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Faol',     cnt: cntActive,    color: 'bg-emerald-500' },
                  { label: 'Qoralama', cnt: cntDraft,     color: 'bg-gray-500' },
                  { label: 'Bajarildi',cnt: cntDone,      color: 'bg-blue-500' },
                  { label: 'Bekor',    cnt: cntCancelled, color: 'bg-red-500' },
                ].map(({ label, cnt, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-gray-500">{cnt} ta · {cntTotal > 0 ? Math.round(cnt / cntTotal * 100) : 0}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${cntTotal > 0 ? cnt / cntTotal * 100 : 0}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Oylik kvota */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-4 font-medium">Oylik kvota</div>
            {quota ? (
              <div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-4xl font-bold text-white">{quota.used ?? '∞'}</span>
                  <span className="text-xl text-gray-500 mb-1">/ {quota.limit ?? 'Cheksiz'}</span>
                </div>
                <div className="text-xs text-gray-500 mb-3">Yaratilgan shartnomalar · {quota.plan} tarif</div>
                {quota.limit && (
                  <>
                    <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full transition-all ${quota.percent! >= 100 ? 'bg-red-500' : quota.percent! >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(quota.percent!, 100)}%` }}/>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{quota.limit - (quota.used ?? 0)} ta qoldi</span>
                      <span>{quota.percent}%</span>
                    </div>
                  </>
                )}
                {isFree && (
                  <button onClick={openUpgradeModal}
                    className="mt-4 w-full py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border border-yellow-700/50 text-yellow-400 hover:from-yellow-600/50 hover:to-orange-600/50 transition">
                    ⭐ Premiumga o&apos;tish
                  </button>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Ma&apos;lumot yo&apos;q</div>
            )}
          </div>
        </div>

        {/* ── Oylik statistika grafigi ── */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-4 font-medium">Oylik statistika (so'nggi 6 oy)</div>
          <div className="flex items-end gap-3 h-28">
            {monthlyData.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-500">{m.count > 0 ? m.count : ''}</span>
                <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                  <div
                    className="w-full rounded-t-md bg-blue-600/70 hover:bg-blue-500/90 transition-all"
                    style={{ height: `${Math.round((m.count / maxCount) * 72)}px`, minHeight: m.count > 0 ? '4px' : '0' }}
                    title={`${m.count} ta · ${m.amount.toLocaleString()} so'm`}
                  />
                </div>
                <span className="text-[10px] text-gray-500 capitalize">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── So'nggi shartnomalar ── */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-[#1E293B]">
            <h2 className="font-semibold text-sm text-gray-200">{T(t.overviewTab.recent)}</h2>
            <Link href="/dashboard/shartnomalar" className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
              {T(t.overviewTab.viewAll)} →
            </Link>
          </div>
          {recentContracts.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="text-gray-500 text-sm mb-4">{T(t.overviewTab.noContracts)}</div>
              <Link href="/dashboard/shartnomalar"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm text-white transition inline-block">
                + Yangi shartnoma yaratish
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#1E293B]/60">
              {recentContracts.map(c => {
                const st = STATUSES[c.status as keyof typeof STATUSES]
                const typeName = CONTRACT_TYPES_I18N[c.contract_type]?.[lang] || c.contract_type
                return (
                  <Link key={c.id} href={`/dashboard/shartnomalar`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[#1F2937] transition cursor-pointer group">
                    <div className="w-10 h-10 bg-blue-900/40 border border-blue-800/40 rounded-xl flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0 group-hover:bg-blue-900/70 transition">
                      {(c.contract_number || '?').slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">#{c.contract_number}</span>
                        <span className="text-xs text-gray-500">·</span>
                        <span className="text-xs text-gray-500">{typeName}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">{c.counterparties?.name || '—'} · {c.contract_date}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-200">{(c.amount || 0).toLocaleString()} <span className="text-gray-500 text-xs">so&apos;m</span></div>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${st?.bg} ${st?.text}`}>
                        {T(t.status[c.status as keyof typeof t.status] || t.status.draft)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Tezkor harakatlar ── */}
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-3 font-medium">Tezkor harakatlar</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Yangi shartnoma',       icon: '📄', hoverBorder: 'hover:border-blue-700/60',   href: '/dashboard/shartnomalar' },
              { label: "Kontragent qo'shish",    icon: '🤝', hoverBorder: 'hover:border-orange-700/60', href: '/dashboard/kontragentlar' },
              { label: "Tashkilot qo'shish",     icon: '🏢', hoverBorder: 'hover:border-blue-700/60',   href: '/dashboard/tashkilotlar' },
              { label: 'Yurist AI',              icon: '⚖️', hoverBorder: 'hover:border-emerald-700/60',href: '/dashboard/yurist' },
              { label: 'Kadrlar hujjatlari',    icon: '👥', hoverBorder: 'hover:border-cyan-700/60',   href: '/dashboard/kadrlar' },
              { label: 'Buxgalter hujjatlari',  icon: '💼', hoverBorder: 'hover:border-blue-700/60',   href: '/dashboard/buxgalter' },
            ].map((a, i) => (
              <Link key={i} href={a.href}
                className={`bg-[#111827] border border-[#1E293B] ${a.hoverBorder} hover:bg-[#1F2937] rounded-xl p-4 text-left transition group block`}>
                <div className="text-2xl mb-2">{a.icon}</div>
                <div className="text-xs font-medium text-gray-400 group-hover:text-white transition leading-tight">{a.label}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Admin panel link ── */}
        {isAdmin && (
          <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4 flex items-center gap-4">
            <span className="text-2xl">⚙️</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-red-300">Admin panel</div>
              <div className="text-xs text-gray-500">Foydalanuvchilar va obunalarni boshqarish</div>
            </div>
            <a href="/admin" target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition">
              Ochish ↗
            </a>
          </div>
        )}

      </div>
    </main>
  )
}
