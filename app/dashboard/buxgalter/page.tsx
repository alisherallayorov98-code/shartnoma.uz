'use client'

import { useState } from 'react'
import { useDashboard } from '../context'

type BuxFeature = 'dalolatnoma' | 'schet_faktura' | 'talabnoma' | 'tolov_grafigi' | 'debitor_undirish'

type FeatureConfig = {
  key: BuxFeature
  icon: string
  title: string
  description: string
  fields: { key: string; label: string; placeholder: string; type?: string }[]
  apiType: string
  resultField: string
}

const FEATURES: FeatureConfig[] = [
  {
    key: 'dalolatnoma',
    icon: '✅',
    title: 'Dalolatnoma',
    description: "Ish bajarilganligi to'g'risidagi dalolatnomani tayyorlang",
    apiType: 'dalolatnoma',
    resultField: 'dalolatnoma',
    fields: [
      { key: 'kontragentar_ism', label: "Kontragent nomi", placeholder: "Raqamli Texnologiyalar MChJ" },
      { key: 'xizmat_turi', label: "Bajarilgan xizmat/ish turi", placeholder: "Dasturiy ta'minot ishlab chiqish" },
      { key: 'shartnoma_raqam', label: "Shartnoma raqami", placeholder: "2025/03-15" },
      { key: 'summa', label: "Summa (so'm)", placeholder: "15 000 000" },
      { key: 'sana', label: "Dalolatnoma sanasi", placeholder: "2025-03-20", type: 'date' },
    ],
  },
  {
    key: 'schet_faktura',
    icon: '🧾',
    title: 'Schyot-faktura',
    description: "To'lov uchun schyot-faktura hujjatini tayyorlang",
    apiType: 'schet_faktura',
    resultField: 'faktura',
    fields: [
      { key: 'xaridor', label: "Xaridor nomi", placeholder: "Innovatsiya Markazi AJ" },
      { key: 'mahsulot_xizmat', label: "Mahsulot/xizmat nomi", placeholder: "Veb-sayt ishlab chiqish" },
      { key: 'miqdor', label: "Miqdor", placeholder: "1" },
      { key: 'narx', label: "Narx (so'm)", placeholder: "25 000 000" },
      { key: 'qqs', label: "QQS foizi (%)", placeholder: "12" },
      { key: 'sana', label: "Sana", placeholder: "2025-03-20", type: 'date' },
    ],
  },
  {
    key: 'talabnoma',
    icon: '📨',
    title: 'Qarz talabnomasi',
    description: "Qarzdorga rasmiy qarz talab xatini tayyorlang",
    apiType: 'talabnoma',
    resultField: 'talabnoma',
    fields: [
      { key: 'qarzdor', label: "Qarzdor nomi", placeholder: "ABC Savdo MChJ" },
      { key: 'qarz_summasi', label: "Qarz summasi (so'm)", placeholder: "50 000 000" },
      { key: 'shartnoma_raqam', label: "Shartnoma raqami", placeholder: "2024/08-01" },
      { key: 'muddat_utgan', label: "Muddati o'tgan kun soni", placeholder: "45" },
      { key: 'jarima_foiz', label: "Kunlik jarima foizi (%)", placeholder: "0.1" },
    ],
  },
  {
    key: 'tolov_grafigi',
    icon: '📅',
    title: "To'lov grafigi",
    description: "Shartnoma bo'yicha to'lov grafigini tuzing",
    apiType: 'dalolatnoma',
    resultField: 'dalolatnoma',
    fields: [
      { key: 'kontragent', label: "Kontragent", placeholder: "Global Solutions LLC" },
      { key: 'jami_summa', label: "Jami summa (so'm)", placeholder: "120 000 000" },
      { key: 'tolov_soni', label: "To'lovlar soni", placeholder: "12" },
      { key: 'boshlanish_sana', label: "Birinchi to'lov sanasi", placeholder: "2025-04-01", type: 'date' },
      { key: 'tolov_turi', label: "To'lov turi", placeholder: "Oylik teng to'lovlar" },
    ],
  },
  {
    key: 'debitor_undirish',
    icon: '⚖️',
    title: 'Debitor undirish',
    description: "Debitor qarzni undirish uchun rasmiy xat tayyorlang",
    apiType: 'talabnoma',
    resultField: 'talabnoma',
    fields: [
      { key: 'qarzdor', label: "Qarzdor korxona", placeholder: "Yulduz Savdo AJ" },
      { key: 'qarz_summasi', label: "Qarz summasi (so'm)", placeholder: "80 000 000" },
      { key: 'qarz_sababi', label: "Qarz sababi", placeholder: "Tovarlar yetkazib berilgan, to'lov amalga oshirilmagan" },
      { key: 'oxirgi_muhlat', label: "To'lov oxirgi muhlati", placeholder: "2025-04-10", type: 'date' },
      { key: 'sudga_murojaat', label: "Sud murojaat ogohlantirishmi?", placeholder: "Ha / Yo'q" },
    ],
  },
]

export default function BuxgalterPage() {
  const { activeOrg, isFree, contracts } = useDashboard()
  const [selected, setSelected] = useState<BuxFeature | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const currentFeature = FEATURES.find(f => f.key === selected)

  function selectFeature(key: BuxFeature) {
    setSelected(key)
    setFormData({})
    setResult(null)
    setError('')
    setCopied(false)
  }

  async function handleGenerate() {
    if (!currentFeature) return
    if (!activeOrg) { setError("Avval tashkilot tanlang!"); return }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: currentFeature.apiType,
          lang: 'uz',
          details: {
            ...formData,
            tashkilot: activeOrg.name,
            tashkilot_inn: activeOrg.inn,
            direktor: activeOrg.director_name,
            bank_name: activeOrg.bank_name,
            bank_account: activeOrg.bank_account,
            mfo: activeOrg.mfo,
          },
        }),
      })

      const data = await res.json()
      if (data.error) { setError(data.error); return }

      const text = data.result?.[currentFeature.resultField]
        || data.result?.dalolatnoma
        || data.result?.faktura
        || data.result?.talabnoma
        || JSON.stringify(data.result, null, 2)
      setResult(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main className="flex-1 overflow-auto p-6 bg-gray-950">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 bg-indigo-900/50 rounded-xl flex items-center justify-center text-xl">💼</span>
            Buxgalter hujjatlari
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI yordamida moliyaviy hujjatlarni avtomatik tayyorlang</p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{contracts.length}</div>
            <div className="text-xs text-gray-500 mt-1">Jami shartnomalar</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{contracts.filter(c => c.status === 'active').length}</div>
            <div className="text-xs text-gray-500 mt-1">Faol shartnomalar</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {(contracts.filter(c => c.status === 'active').reduce((s, c) => s + (c.amount || 0), 0) / 1_000_000).toFixed(1)}M
            </div>
            <div className="text-xs text-gray-500 mt-1">Faol summa</div>
          </div>
        </div>

        {isFree && (
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">⭐</span>
            <div className="flex-1 text-sm text-yellow-300">Bu funksiyalar Premium tarifda to&apos;liq ishlaydi. Bepul tarifda cheklangan miqdorda foydalanish mumkin.</div>
          </div>
        )}

        {/* Feature cards */}
        {!selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(feature => (
              <button key={feature.key} onClick={() => selectFeature(feature.key)}
                className="bg-gray-900 border border-gray-800 hover:border-indigo-700/60 hover:bg-gray-800/80 rounded-xl p-5 text-left transition group">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <div className="font-semibold text-white text-sm mb-1 group-hover:text-indigo-300 transition">{feature.title}</div>
                <div className="text-xs text-gray-500">{feature.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        {selected && currentFeature && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelected(null); setResult(null); setError('') }}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
                ← Orqaga
              </button>
              <div className="w-px h-4 bg-gray-700"/>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentFeature.icon}</span>
                <h2 className="font-semibold text-white">{currentFeature.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentFeature.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{field.label}</label>
                  <input
                    type={field.type || 'text'}
                    value={formData[field.key] || ''}
                    onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
                  />
                </div>
              ))}
            </div>

            {/* Org info display */}
            {activeOrg && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-400">
                Tashkilot: <span className="text-white font-medium">{activeOrg.name}</span>
                {activeOrg.bank_name && <> · Bank: {activeOrg.bank_name}</>}
                {activeOrg.bank_account && <> · H/R: {activeOrg.bank_account}</>}
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-sm text-red-300">
                ⚠ {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  AI ishlamoqda…
                </>
              ) : (
                <>🤖 AI bilan tayyorlash</>
              )}
            </button>

            {/* Result */}
            {result && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Natija:</h3>
                  <button onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition">
                    {copied ? '✓ Nusxalandi' : '📋 Nusxalash'}
                  </button>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto font-mono">
                  {result}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
