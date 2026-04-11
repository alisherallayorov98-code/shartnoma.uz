'use client'

import { useDashboard } from '../context'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'

export default function UpgradeModal() {
  const { upgradeModalOpen, closeUpgradeModal, activeOrg } = useDashboard()
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  if (!upgradeModalOpen) return null

  // planKey format: "standard_1m" | "standard_3m" | "pro_1m" etc.
  const payWithClick = (planKey: string) => {
    if (!activeOrg) return
    const merchantTransId = `${activeOrg.id}:${planKey}`
    const CLICK_SERVICE_ID = process.env.NEXT_PUBLIC_CLICK_SERVICE_ID || ''
    const url = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_SERVICE_ID}&amount=50000&transaction_param=${encodeURIComponent(merchantTransId)}`
    window.open(url, '_blank')
  }

  const contactTelegram = (plan: string) => {
    const greet = lang === 'ru' ? 'Здравствуйте' : 'Salom'
    const forOrg = lang === 'ru' ? 'для' : 'uchun'
    const wantPlan = lang === 'ru' ? `хочу перейти на тариф ${plan}.` : `${plan} tarifiga o'tmoqchiman.`
    const msg = encodeURIComponent(
      `${greet}! "${activeOrg?.name || 'Tashkilot'}" ${forOrg} ${wantPlan}`
    )
    window.open(`https://t.me/shartnoma_uz?text=${msg}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1E293B]">
          <div>
            <h2 className="text-xl font-bold text-white">{T(t.upgrade.title)}</h2>
            <p className="text-gray-400 text-sm mt-1">{T(t.upgrade.subtitle)}</p>
          </div>
          <button
            onClick={closeUpgradeModal}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#1F2937] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Plans */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Standard */}
          <div className="bg-blue-600/10 border border-blue-600/50 rounded-xl p-5">
            <div className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full mb-4">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              STANDARD
            </div>
            <div className="text-3xl font-black text-white mb-1">50,000</div>
            <div className="text-blue-300 text-sm mb-4">{T(t.upgrade.somPerMonth)}</div>
            <ul className="space-y-2 mb-5">
              {[
                T(t.upgrade.stdFeature1),
                T(t.upgrade.stdFeature2),
                T(t.upgrade.stdFeature3),
                T(t.upgrade.stdFeature4),
                T(t.upgrade.stdFeature5),
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => payWithClick('standard_1m')}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition"
              >
                Click
              </button>
              <button
                onClick={() => contactTelegram('Standard (50,000 so\'m/oy)')}
                className="flex-1 py-2.5 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 font-semibold text-sm rounded-lg transition"
              >
                Telegram
              </button>
            </div>
          </div>

          {/* AI Pro */}
          <div className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-5">
            <div className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full mb-4">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              AI PRO
            </div>
            <div className="text-3xl font-black text-white mb-1">199,000</div>
            <div className="text-orange-300 text-sm mb-4">{T(t.upgrade.somPerMonth)}</div>
            <ul className="space-y-2 mb-5">
              {[
                T(t.upgrade.proFeature1),
                T(t.upgrade.proFeature2),
                T(t.upgrade.proFeature3),
                T(t.upgrade.proFeature4),
                T(t.upgrade.proFeature5),
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => payWithClick('pro_1m')}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-lg transition"
              >
                Click
              </button>
              <button
                onClick={() => contactTelegram('AI Pro (199,000 so\'m/oy)')}
                className="flex-1 py-2.5 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 font-semibold text-sm rounded-lg transition"
              >
                Telegram
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs pb-5 px-6">
          {T(t.upgrade.payNote)}
        </p>
      </div>
    </div>
  )
}
