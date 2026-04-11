'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useDashboard } from './context'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'

const OVERVIEW_CSS = `
@keyframes ovFadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ovPulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.15); }
}
@keyframes ovBarGrow {
  from { height: 0; }
  to   { height: var(--bar-h); }
}
@keyframes ovGlow {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}
@keyframes ovShimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
.ov-card { animation: ovFadeUp 0.5s ease-out both; }
.ov-card:nth-child(1) { animation-delay: 0.05s; }
.ov-card:nth-child(2) { animation-delay: 0.10s; }
.ov-card:nth-child(3) { animation-delay: 0.15s; }
.ov-card:nth-child(4) { animation-delay: 0.20s; }
.ov-bar { animation: ovBarGrow 0.8s cubic-bezier(.22,.61,.36,1) both; }
.ov-shimmer {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: ovShimmer 2.5s infinite;
}
`

const STATUSES = {
  draft:     { bg: 'bg-[#1F2937]',    text: 'text-gray-300',    dot: 'bg-gray-400',    label: { uz: 'Qoralama', oz: 'Қоралама', ru: 'Черновик' } },
  active:    { bg: 'bg-emerald-900/60', text: 'text-emerald-300', dot: 'bg-emerald-400', label: { uz: 'Faol', oz: 'Фаол', ru: 'Активный' } },
  completed: { bg: 'bg-blue-900/60',  text: 'text-blue-300',    dot: 'bg-blue-400',    label: { uz: 'Tugagan', oz: 'Тугаган', ru: 'Завершён' } },
  cancelled: { bg: 'bg-red-900/60',   text: 'text-red-300',     dot: 'bg-red-400',     label: { uz: 'Bekor', oz: 'Бекор', ru: 'Отменён' } },
}

const QUICK_ACTIONS = [
  { labelKey: 'qaNewContract', icon: '📄', href: '/dashboard/shartnomalar',   grad: 'from-blue-600/30 to-blue-800/20',    border: 'border-blue-700/30',   hover: 'hover:border-blue-500/60 hover:from-blue-600/40',   glow: 'rgba(37,99,235,0.3)' },
  { labelKey: 'qaAddCp',       icon: '🤝', href: '/dashboard/kontragentlar',  grad: 'from-orange-600/30 to-orange-800/20', border: 'border-orange-700/30', hover: 'hover:border-orange-500/60 hover:from-orange-600/40', glow: 'rgba(234,88,12,0.3)' },
  { labelKey: 'qaAddOrg',      icon: '🏢', href: '/dashboard/tashkilotlar',   grad: 'from-purple-600/30 to-purple-800/20', border: 'border-purple-700/30', hover: 'hover:border-purple-500/60 hover:from-purple-600/40', glow: 'rgba(124,58,237,0.3)' },
  { labelKey: 'yurist_ai',     icon: '⚖️', href: '/dashboard/yurist',         grad: 'from-emerald-600/30 to-emerald-800/20', border: 'border-emerald-700/30', hover: 'hover:border-emerald-500/60 hover:from-emerald-600/40', glow: 'rgba(16,185,129,0.3)' },
  { labelKey: 'qaKadrlar',     icon: '👥', href: '/dashboard/kadrlar',        grad: 'from-cyan-600/30 to-cyan-800/20',    border: 'border-cyan-700/30',   hover: 'hover:border-cyan-500/60 hover:from-cyan-600/40',    glow: 'rgba(6,182,212,0.3)' },
  { labelKey: 'qaBuxgalter',   icon: '💼', href: '/dashboard/buxgalter',      grad: 'from-indigo-600/30 to-indigo-800/20', border: 'border-indigo-700/30', hover: 'hover:border-indigo-500/60 hover:from-indigo-600/40', glow: 'rgba(79,70,229,0.3)' },
]

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) return
    let start = 0
    const step = Math.ceil(value / 30)
    const timer = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(start)
    }, 30)
    return () => clearInterval(timer)
  }, [value])
  return <>{display.toLocaleString()}</>
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
  const [copiedField, setCopiedField] = useState<string | null>(null)

  function copyField(key: string, value: string) {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(key)
      setTimeout(() => setCopiedField(null), 1500)
    })
  }

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

  const monthlyData = useMemo(() => {
    const result: { label: string; count: number; amount: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      const y = d.getFullYear(); const m = d.getMonth()
      const label = d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { month: 'short' })
      const mc = contracts.filter(c => { const cd = new Date(c.created_at); return cd.getFullYear() === y && cd.getMonth() === m })
      result.push({ label, count: mc.length, amount: mc.reduce((s, c) => s + (c.amount || 0), 0) })
    }
    return result
  }, [contracts, lang])
  const maxCount = Math.max(...monthlyData.map(m => m.count), 1)

  const showSubWarning = !isAdmin && isSubValid && subDaysLeft !== null && subDaysLeft <= 5

  const expiringContracts = useMemo(() => {
    const now = Date.now()
    return contracts.filter(c => {
      if (c.status !== 'active') return false
      const endDateStr = c.extra_data?.end_date
      if (endDateStr) { const daysLeft = (new Date(endDateStr).getTime() - now) / (1000 * 60 * 60 * 24); return daysLeft >= 0 && daysLeft <= 30 }
      const baseDate = c.contract_date || c.created_at
      return (now - new Date(baseDate).getTime()) / (1000 * 60 * 60 * 24) >= 330
    })
  }, [contracts])

  // ── Onboarding ──────────────────────────────────────────────────────────────
  if (orgs.length === 0) {
    return (
      <main className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0B1220] flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full text-center space-y-6" style={{ animation: 'ovFadeUp 0.5s ease-out' }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #4f46e5)', boxShadow: '0 0 40px rgba(79,70,229,0.4)' }}>
            🏢
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{T({ uz: 'Xush kelibsiz!', oz: 'Хуш келибсиз!', ru: 'Добро пожаловать!' })}</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              {T({ uz: "Kabinetim.uz dan foydalanish uchun avval tashkilotingizni qo'shing.", oz: "Kabinetim.uz dan foydalanish uchun avval tashkilotingizni qo'shing.", ru: 'Для начала работы добавьте вашу организацию.' })}
            </p>
          </div>
          <div className="rounded-2xl p-5 text-left space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              T({ uz: "Tashkilot nomini va INN raqamini kiriting", oz: "Tashkilot nomini va INN raqamini kiriting", ru: "Введите название и ИНН организации" }),
              T({ uz: "Direktor va bank rekvizitlarini to'ldiring", oz: "Direktor va bank rekvizitlarini to'ldiring", ru: "Заполните реквизиты директора и банка" }),
              T({ uz: "Shartnoma, kadrlar va hujjatlaringizni boshqaring", oz: "Shartnoma, kadrlar va hujjatlaringizni boshqaring", ru: "Управляйте документами, кадрами и договорами" }),
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-200">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-blue-300"
                  style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>{i + 1}</span>
                {step}
              </div>
            ))}
          </div>
          <Link href="/dashboard/tashkilotlar"
            className="block w-full text-white font-semibold py-3 px-6 rounded-xl text-sm"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 20px rgba(249,115,22,0.3)' }}>
            + {T({ uz: "Tashkilot qo'shish", oz: "Tashkilot qo'shish", ru: 'Добавить организацию' })}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: OVERVIEW_CSS }} />
      <main className="flex-1 overflow-auto bg-[#080F1E]" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(37,99,235,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(124,58,237,0.04) 0%, transparent 50%)'
      }}>
        <div className="p-4 sm:p-6 space-y-5">

          {/* ── Alerts ──────────────────────────────────────────────────── */}
          {showSubWarning && subDaysLeft !== null && (
            <div className={`rounded-2xl p-4 flex items-center gap-4 border ${subDaysLeft === 1 ? 'bg-red-950/40 border-red-700/40' : subDaysLeft <= 3 ? 'bg-orange-950/40 border-orange-700/40' : 'bg-yellow-950/30 border-yellow-700/40'}`}>
              <span className="text-2xl shrink-0">{subDaysLeft === 1 ? '🔴' : subDaysLeft <= 3 ? '🟠' : '🟡'}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-sm ${subDaysLeft === 1 ? 'text-red-300' : subDaysLeft <= 3 ? 'text-orange-300' : 'text-yellow-300'}`}>
                  {subDaysLeft === 1 ? T(t.dash.subEndsToday) : `${T(t.dash.subEndsPrefix)} ${subDaysLeft} ${T(t.dash.subEndsInDays)}`}
                </div>
                <div className="text-gray-500 text-xs mt-0.5">{subscription?.period_end && new Date(subscription.period_end).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })} — {T(t.dash.subRenewNote)}</div>
              </div>
              <a href="mailto:info@kabinetim.uz?subject=Obunani uzaytirish"
                className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition whitespace-nowrap ${subDaysLeft === 1 ? 'bg-red-600 hover:bg-red-500 text-white' : subDaysLeft <= 3 ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}>
                {T(t.dash.contactBtn)}
              </a>
            </div>
          )}
          {expiringContracts.length > 0 && (
            <div className="rounded-2xl p-4 flex items-center gap-4 border bg-orange-950/30 border-orange-700/40">
              <span className="text-2xl shrink-0">⏰</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-orange-300">{expiringContracts.length} {T(t.dash.expiringMsg)}</div>
                <div className="text-gray-500 text-xs mt-0.5 truncate">{expiringContracts.slice(0, 3).map(c => c.contract_number).join(', ')}{expiringContracts.length > 3 ? ` +${expiringContracts.length - 3}` : ''}</div>
              </div>
              <Link href="/dashboard/shartnomalar" className="shrink-0 text-xs font-semibold px-4 py-2 rounded-xl bg-orange-700 hover:bg-orange-600 text-white transition whitespace-nowrap">{T(t.dash.viewBtn)}</Link>
            </div>
          )}

          {/* ── HERO BANNER ─────────────────────────────────────────────── */}
          <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1f4e 0%, #0f1535 40%, #130d2e 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
            {/* Glow blobs */}
            <div className="absolute w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', top: '-80px', left: '-40px', animation: 'ovGlow 4s ease-in-out infinite' }}/>
            <div className="absolute w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 70%)', bottom: '-60px', right: '15%', animation: 'ovGlow 6s ease-in-out infinite reverse' }}/>
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '32px 32px' }}/>

            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full"
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" style={{ animation: 'ovPulse 2s infinite' }}/>
                      {T(t.dash.controlPanel)}
                    </span>
                    {quota && (
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isFree ? 'text-gray-400' : 'text-emerald-300'}`}
                        style={isFree ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' } : { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        {isFree ? T(t.dash.freePlan) : `⭐ ${quota.plan}`}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-tight">{activeOrg?.name || '—'}</h1>
                  <div className="text-sm text-gray-400">INN: <span className="text-gray-300 font-mono">{activeOrg?.inn || '—'}</span>{activeOrg?.director_name ? <> · <span className="text-gray-300">{activeOrg.director_name}</span></> : null}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { val: cntTotal,  label: T({ uz: 'Jami', oz: 'Жами', ru: 'Всего' }),   color: '#60a5fa' },
                    { val: cntActive, label: T({ uz: 'Faol', oz: 'Фаол', ru: 'Активных' }), color: '#34d399' },
                    { val: cps.length,label: T({ uz: 'Kontragent', oz: 'Контрагент', ru: 'Контрагентов' }), color: '#fb923c' },
                  ].map((s, i) => (
                    <div key={i} className="text-center px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="text-2xl font-bold" style={{ color: s.color }}>{s.val}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs text-gray-500">📅 {today}</span>
                <div className="flex gap-2">
                  <Link href="/dashboard/shartnomalar"
                    className="text-xs font-semibold px-4 py-2 rounded-xl text-white transition"
                    style={{ background: 'rgba(37,99,235,0.4)', border: '1px solid rgba(37,99,235,0.4)' }}>
                    + {T({ uz: 'Yangi shartnoma', oz: 'Янги шартнома', ru: 'Новый договор' })}
                  </Link>
                  <Link href="/dashboard/yurist"
                    className="text-xs font-semibold px-4 py-2 rounded-xl text-white transition"
                    style={{ background: 'rgba(124,58,237,0.3)', border: '1px solid rgba(124,58,237,0.3)' }}>
                    🤖 AI {T({ uz: 'Yurist', oz: 'Юрист', ru: 'Юрист' })}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4 STAT CARDS ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { href: '/dashboard/shartnomalar', val: cntTotal, label: T(t.overviewTab.totalContracts), sub: `${cntDraft} ${T(t.dash.draftAnd)} · ${cntDone} ${T(t.dash.done)}`, icon: '📄', grad: ['#1d4ed8','#3b82f6'], glow: 'rgba(59,130,246,0.3)', textColor: '#93c5fd' },
              { href: '/dashboard/shartnomalar', val: cntActive, label: T(t.overview.activeContracts), sub: totalActive > 0 ? `${totalActive.toLocaleString()} so'm` : T(t.dash.noContracts), icon: '✅', grad: ['#065f46','#059669'], glow: 'rgba(16,185,129,0.3)', textColor: '#6ee7b7' },
              { href: '/dashboard/tashkilotlar', val: orgs.length, label: T(t.orgs.title), sub: activeOrg ? `${T(t.dash.activeOrg)}: ${activeOrg.name}` : '—', icon: '🏢', grad: ['#4c1d95','#7c3aed'], glow: 'rgba(124,58,237,0.3)', textColor: '#c4b5fd' },
              { href: '/dashboard/kontragentlar', val: cps.length, label: T(t.cp.title), sub: T({ uz: 'Barcha kontragentlar', oz: 'Барча контрагентлар', ru: 'Все контрагенты' }), icon: '🤝', grad: ['#92400e','#d97706'], glow: 'rgba(245,158,11,0.3)', textColor: '#fcd34d' },
            ].map((card, i) => (
              <Link key={i} href={card.href}
                className="ov-card group relative rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 block"
                style={{ background: `linear-gradient(145deg, rgba(${i===0?'15,26,60':i===1?'5,46,37':i===2?'30,10,60':i===3?'45,25,10':''}, 1) 0%, rgba(${i===0?'11,18,42':i===1?'5,30,25':i===2?'20,8,40':i===3?'35,18,8':''}, 1) 100%)`, border: `1px solid rgba(${i===0?'59,130,246':i===1?'16,185,129':i===2?'124,58,237':i===3?'245,158,11':''}, 0.15)`, boxShadow: `0 0 0 0 ${card.glow}` }}>
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${card.grad[0]}, ${card.grad[1]})` }}/>
                {/* Glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" style={{ background: `radial-gradient(circle at 50% 0%, ${card.glow.replace('0.3','0.08')} 0%, transparent 70%)` }}/>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: `linear-gradient(135deg, ${card.grad[0]}44, ${card.grad[1]}22)`, border: `1px solid ${card.grad[1]}33` }}>
                      {card.icon}
                    </div>
                    <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  <div className="text-3xl font-bold mb-1" style={{ color: card.textColor }}>
                    <AnimatedNumber value={card.val} />
                  </div>
                  <div className="text-xs font-medium text-gray-300 mb-1">{card.label}</div>
                  <div className="text-xs text-gray-600 truncate">{card.sub}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── MIDDLE ROW: Financial + Status + Quota ──────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Moliyaviy ko'rsatkichlar */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' }}>💰</div>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{T(t.dash.financialTitle)}</span>
              </div>
              <div className="space-y-3.5">
                {[
                  { label: T(t.dash.activeContracts), val: totalActive, color: '#34d399', dot: 'bg-emerald-400' },
                  { label: T(t.dash.completedLbl),    val: totalDone,   color: '#60a5fa', dot: 'bg-blue-400' },
                  { label: T(t.dash.draftLbl),        val: totalDraft,  color: '#9ca3af', dot: 'bg-gray-400' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.dot}`}/>
                      <span className="text-xs text-gray-400 truncate">{row.label}</span>
                    </div>
                    <span className="text-sm font-semibold shrink-0 tabular-nums" style={{ color: row.color }}>{row.val.toLocaleString()} <span className="text-xs text-gray-600">so&apos;m</span></span>
                  </div>
                ))}
                <div className="pt-3 mt-1 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs text-gray-500">{T(t.dash.totalLbl)}</span>
                  <span className="text-base font-bold text-white tabular-nums">{totalAll.toLocaleString()} <span className="text-xs text-gray-500">so&apos;m</span></span>
                </div>
              </div>
            </div>

            {/* Shartnomalar holati */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>📊</div>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{T(t.dash.statusTitle)}</span>
              </div>
              {cntTotal === 0 ? (
                <div className="text-center text-gray-600 text-sm py-6">
                  <div className="text-3xl mb-2">📋</div>
                  {T(t.dash.noContracts)}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: T(t.dash.activeLbl),    cnt: cntActive,    bar: 'from-emerald-500 to-emerald-400' },
                    { label: T(t.dash.draftLbl),     cnt: cntDraft,     bar: 'from-gray-500 to-gray-400' },
                    { label: T(t.dash.completedLbl), cnt: cntDone,      bar: 'from-blue-500 to-blue-400' },
                    { label: T(t.dash.cancelledLbl), cnt: cntCancelled, bar: 'from-red-500 to-red-400' },
                  ].map(({ label, cnt, bar }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400">{label}</span>
                        <span className="text-gray-500 tabular-nums">{cnt} · {cntTotal > 0 ? Math.round(cnt / cntTotal * 100) : 0}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className={`h-full bg-gradient-to-r ${bar} rounded-full transition-all duration-700`}
                          style={{ width: `${cntTotal > 0 ? cnt / cntTotal * 100 : 0}%` }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Oylik kvota */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)' }}>⚡</div>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{T(t.dash.quotaTitle)}</span>
              </div>
              {quota ? (
                <div>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-bold text-white">{quota.used ?? '∞'}</span>
                    <span className="text-lg text-gray-600 mb-1">/ {quota.limit ?? T(t.dash.unlimited)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-4">{T(t.dash.createdContracts)} · <span className="text-gray-300 font-medium">{quota.plan}</span></div>
                  {quota.limit && (
                    <>
                      <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className={`h-full rounded-full transition-all duration-700 ${quota.percent! >= 100 ? 'bg-gradient-to-r from-red-600 to-red-400' : quota.percent! >= 80 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                          style={{ width: `${Math.min(quota.percent!, 100)}%` }}/>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{(quota.limit - (quota.used ?? 0))} {T(t.dash.remaining)}</span>
                        <span className={quota.percent! >= 80 ? 'text-yellow-500' : 'text-gray-600'}>{quota.percent}%</span>
                      </div>
                    </>
                  )}
                  {isFree && (
                    <button onClick={openUpgradeModal}
                      className="mt-4 w-full py-2.5 rounded-xl text-xs font-semibold transition relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(249,115,22,0.2))', border: '1px solid rgba(234,179,8,0.3)', color: '#fde68a' }}>
                      <span className="ov-shimmer absolute inset-0 rounded-xl"/>
                      <span className="relative">⭐ {T(t.dash.goToPremium)}</span>
                    </button>
                  )}
                </div>
              ) : <div className="text-gray-600 text-sm">{T(t.dash.noData)}</div>}
            </div>
          </div>

          {/* ── OYLIK GRAFIK ────────────────────────────────────────────── */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.2)' }}>📈</div>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{T(t.dash.monthlyStats)}</span>
              </div>
              <span className="text-xs text-gray-600">{T({ uz: 'Oxirgi 6 oy', oz: 'Охирги 6 ой', ru: 'Последние 6 месяцев' })}</span>
            </div>
            <div className="flex items-end gap-2 sm:gap-3" style={{ height: '120px' }}>
              {monthlyData.map((m, i) => {
                const pct = Math.round((m.count / maxCount) * 100)
                const h = Math.max(Math.round(pct * 90 / 100), m.count > 0 ? 6 : 0)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip */}
                    {m.count > 0 && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1E293B] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <div className="text-white font-semibold">{m.count} ta</div>
                        <div className="text-gray-400">{m.amount.toLocaleString()} so&apos;m</div>
                      </div>
                    )}
                    <span className="text-[10px] text-gray-600 transition-colors group-hover:text-gray-400">{m.count > 0 ? m.count : ''}</span>
                    <div className="w-full flex items-end justify-center" style={{ height: '90px' }}>
                      {m.count > 0 ? (
                        <div className="ov-bar w-full rounded-t-lg relative overflow-hidden"
                          style={{ height: `${h}px`, background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)', '--bar-h': `${h}px` } as React.CSSProperties}>
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)' }}/>
                          {/* Glow */}
                          <div className="absolute bottom-0 left-0 right-0 h-4 opacity-40" style={{ background: 'rgba(59,130,246,0.6)', filter: 'blur(6px)' }}/>
                        </div>
                      ) : (
                        <div className="w-full rounded-t-sm" style={{ height: '3px', background: 'rgba(255,255,255,0.05)' }}/>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 capitalize">{m.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── SO'NGGI SHARTNOMALAR + TEZKOR HARAKATLAR ─────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* Recent contracts (2/3 width) */}
            <div className="xl:col-span-2 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>🕐</div>
                  <h2 className="text-sm font-semibold text-gray-200">{T(t.overviewTab.recent)}</h2>
                </div>
                <Link href="/dashboard/shartnomalar" className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                  {T(t.overviewTab.viewAll)} →
                </Link>
              </div>

              {recentContracts.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-4xl mb-3 opacity-40">📋</div>
                  <div className="text-gray-600 text-sm mb-4">{T(t.overviewTab.noContracts)}</div>
                  <Link href="/dashboard/shartnomalar"
                    className="px-5 py-2.5 text-sm text-white font-medium rounded-xl inline-block transition"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 15px rgba(249,115,22,0.25)' }}>
                    {T(t.dash.newContractBtn)}
                  </Link>
                </div>
              ) : (
                <div>
                  {recentContracts.map((c, idx) => {
                    const st = STATUSES[c.status as keyof typeof STATUSES]
                    const typeName = CONTRACT_TYPES_I18N[c.contract_type]?.[lang] || c.contract_type
                    const initials = (c.contract_number || '?').slice(0, 2).toUpperCase()
                    const colors = ['#1d4ed8','#7c3aed','#059669','#b45309','#0891b2']
                    return (
                      <Link key={c.id} href="/dashboard/shartnomalar"
                        className="flex items-center gap-3 px-5 py-3.5 transition group"
                        style={{ borderBottom: idx < recentContracts.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: `linear-gradient(135deg, ${colors[idx % colors.length]}88, ${colors[idx % colors.length]}44)`, border: `1px solid ${colors[idx % colors.length]}44` }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white">#{c.contract_number}</span>
                            <span className="text-gray-600 text-xs">·</span>
                            <span className="text-xs text-gray-500 truncate">{typeName}</span>
                          </div>
                          <div className="text-xs text-gray-600 truncate mt-0.5">{c.counterparties?.name || '—'} · {c.contract_date}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-gray-200 tabular-nums">{(c.amount || 0).toLocaleString()} <span className="text-gray-600 text-xs">so&apos;m</span></div>
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

            {/* Quick actions (1/3 width) */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' }}>⚡</div>
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">{T(t.dash.quickActions)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((a, i) => (
                  <Link key={i} href={a.href}
                    className={`group relative rounded-xl p-3 text-center transition-all duration-200 hover:-translate-y-0.5 bg-gradient-to-br ${a.grad} ${a.hover} border ${a.border} block overflow-hidden`}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 50%, ${a.glow.replace('0.3','0.12')} 0%, transparent 70%)` }}/>
                    <div className="relative">
                      <div className="text-2xl mb-1.5">{a.icon}</div>
                      <div className="text-xs font-medium text-gray-300 group-hover:text-white transition leading-tight">
                        {T(t.dash[a.labelKey as keyof typeof t.dash] as Record<Lang, string> || t.nav[a.labelKey as keyof typeof t.nav] as Record<Lang, string>)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── REKVIZITLAR ─────────────────────────────────────────────── */}
          {activeOrg && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.2)' }}>🏦</div>
                  <h2 className="text-sm font-semibold text-gray-200">{T(t.dash.rekvTitle)}</h2>
                </div>
                <button
                  onClick={() => copyField('all', [activeOrg.name, activeOrg.inn, activeOrg.director_name, activeOrg.bank_name, activeOrg.bank_account, activeOrg.mfo, activeOrg.address].filter(Boolean).join('\n'))}
                  className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1.5">
                  {copiedField === 'all' ? <><span className="text-emerald-400">✓</span> {T(t.dash.copied)}</> : <>{T(t.dash.copyAll)}</>}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { key: 'name',         label: T(t.dash.rekvName),     value: activeOrg.name },
                  { key: 'inn',          label: T(t.dash.rekvInn),      value: activeOrg.inn },
                  { key: 'director',     label: T(t.dash.rekvDirector), value: activeOrg.director_name },
                  { key: 'bank_name',    label: T(t.dash.rekvBank),     value: activeOrg.bank_name },
                  { key: 'bank_account', label: T(t.dash.rekvAccount),  value: activeOrg.bank_account },
                  { key: 'mfo',          label: T(t.dash.rekvMfo),      value: activeOrg.mfo },
                  { key: 'address',      label: T(t.dash.rekvAddress),  value: activeOrg.address },
                ].filter(r => r.value).map(row => (
                  <div key={row.key}
                    className="flex items-center justify-between px-5 py-3.5 group transition-all cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onClick={() => copyField(row.key, row.value!)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-600 mb-0.5">{row.label}</div>
                      <div className="text-sm text-gray-200 font-mono truncate">{row.value}</div>
                    </div>
                    <div className={`ml-3 shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${copiedField === row.key ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.04] text-gray-600 group-hover:text-gray-300 group-hover:bg-white/[0.07]'}`}>
                      {copiedField === row.key ? '✓' : '📋'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ADMIN ───────────────────────────────────────────────────── */}
          {isAdmin && (
            <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <span className="text-2xl">⚙️</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-300">{T(t.dash.adminTitle)}</div>
                <div className="text-xs text-gray-500">{T(t.dash.adminDesc)}</div>
              </div>
              <a href="/admin" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 text-white text-xs font-semibold rounded-xl transition"
                style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.3)' }}>
                {T(t.dash.adminOpen)} ↗
              </a>
            </div>
          )}

        </div>
      </main>
    </>
  )
}
