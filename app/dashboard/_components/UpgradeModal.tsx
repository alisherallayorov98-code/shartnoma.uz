'use client'

import { useDashboard } from '../context'

export default function UpgradeModal() {
  const { upgradeModalOpen, closeUpgradeModal, activeOrg } = useDashboard()

  if (!upgradeModalOpen) return null

  // planKey format: "standard_1m" | "standard_3m" | "pro_1m" etc.
  const payWithClick = (planKey: string) => {
    if (!activeOrg) return
    const merchantTransId = `${activeOrg.id}:${planKey}`
    const CLICK_SERVICE_ID = process.env.NEXT_PUBLIC_CLICK_SERVICE_ID || ''
    const url = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_SERVICE_ID}&amount=50000&transaction_param=${encodeURIComponent(merchantTransId)}`
    window.open(url, '_blank')
  }

  const payWithPayme = (planKey: string) => {
    if (!activeOrg) return
    const accountBase64 = btoa(JSON.stringify({ account: `${activeOrg.id}:${planKey}` }))
    const PAYME_MERCHANT_ID = process.env.NEXT_PUBLIC_PAYME_MERCHANT_ID || ''
    const url = `https://checkout.paycom.uz/${PAYME_MERCHANT_ID}?ac.account=${encodeURIComponent(`${activeOrg.id}:${planKey}`)}&a=5000000`
    window.open(url, '_blank')
  }

  const contactTelegram = (plan: string) => {
    const msg = encodeURIComponent(
      `Salom! "${activeOrg?.name || 'Tashkilot'}" uchun ${plan} tarifiga o'tmoqchiman.`
    )
    window.open(`https://t.me/shartnoma_uz?text=${msg}`, '_blank')
  }

  void payWithPayme // used conditionally below

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">Tarifni yaxshilash</h2>
            <p className="text-gray-400 text-sm mt-1">Cheklovsiz ishlash uchun Premium tarifni tanlang</p>
          </div>
          <button
            onClick={closeUpgradeModal}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Plans */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Standard */}
          <div className="bg-gradient-to-b from-blue-600/20 to-blue-900/10 border border-blue-500/40 rounded-xl p-5">
            <div className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full mb-4">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              STANDARD
            </div>
            <div className="text-3xl font-black text-white mb-1">50,000</div>
            <div className="text-blue-300 text-sm mb-4">so'm / oy</div>
            <ul className="space-y-2 mb-5">
              {[
                'Cheksiz shartnomalar',
                'Barcha shablon turlari',
                'AI bilan shartnoma tahlili',
                'PDF va Word eksport',
                'Kontragentlar baza',
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
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition"
              >
                Click
              </button>
              <button
                onClick={() => contactTelegram('Standard (50,000 so\'m/oy)')}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm rounded-lg transition"
              >
                Telegram
              </button>
            </div>
          </div>

          {/* AI Pro */}
          <div className="bg-gradient-to-b from-purple-600/20 to-purple-900/10 border border-purple-500/40 rounded-xl p-5">
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2.5 py-1 rounded-full mb-4">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              AI PRO
            </div>
            <div className="text-3xl font-black text-white mb-1">199,000</div>
            <div className="text-purple-300 text-sm mb-4">so'm / oy</div>
            <ul className="space-y-2 mb-5">
              {[
                'Standard tarif imkoniyatlari',
                'Korporativ AI asistenti',
                'Buxgalter hujjatlari AI',
                'Kadrlar va kotiba AI',
                'Yurist AI maslahatchi',
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => payWithClick('pro_1m')}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm rounded-lg transition"
              >
                Click
              </button>
              <button
                onClick={() => contactTelegram('AI Pro (199,000 so\'m/oy)')}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm rounded-lg transition"
              >
                Telegram
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs pb-5 px-6">
          To'lov Telegram orqali amalga oshiriladi. Savollar uchun: @shartnoma_uz
        </p>
      </div>
    </div>
  )
}
