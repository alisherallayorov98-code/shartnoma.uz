'use client'

import { useState } from 'react'
import { useDashboard } from '../context'
import { downloadTextAsPDF, downloadTextAsWord } from '@/lib/downloadUtils'

type KadrFeature = 'mehnat_shartnoma' | 'buyruq_qabul' | 'buyruq_boshtash' | 'tatil_buyruq' | 'ishonchnoma' | 'lavozim_yoriqnoma'

type FeatureConfig = {
  key: KadrFeature
  icon: string
  title: string
  description: string
  fields: { key: string; label: string; placeholder: string; type?: string }[]
  apiType: string
  resultField: string
}

const FEATURES: FeatureConfig[] = [
  {
    key: 'mehnat_shartnoma',
    icon: '📋',
    title: 'Mehnat shartnomasi',
    description: 'Xodim bilan mehnat shartnomasini AI yordamida tayyorlang',
    apiType: 'mehnat_shartnoma',
    resultField: 'shartnoma',
    fields: [
      { key: 'xodim_ism', label: "Xodim ismi", placeholder: "Rahimov Bobur Aliyevich" },
      { key: 'lavozim', label: "Lavozim", placeholder: "Dasturchi" },
      { key: 'maosh', label: "Maosh (so'm)", placeholder: "5 000 000" },
      { key: 'boshlanish_sana', label: "Boshlanish sanasi", placeholder: "2025-01-01", type: 'date' },
      { key: 'ish_vaqti', label: "Ish vaqti", placeholder: "To'liq kunlik, dushanba-juma" },
    ],
  },
  {
    key: 'buyruq_qabul',
    icon: '📥',
    title: 'Buyruq: Qabul qilish',
    description: "Xodimni ishga qabul qilish buyrug'ini tayyorlang",
    apiType: 'buyruq',
    resultField: 'buyruq',
    fields: [
      { key: 'xodim_ism', label: "Xodim ismi", placeholder: "Rahimov Bobur Aliyevich" },
      { key: 'lavozim', label: "Lavozim", placeholder: "Bosh muhandis" },
      { key: 'bo\'lim', label: "Bo'lim/Sektor", placeholder: "IT bo'limi" },
      { key: 'maosh', label: "Maosh (so'm)", placeholder: "7 000 000" },
      { key: 'sana', label: "Qabul sanasi", placeholder: "2025-01-15", type: 'date' },
    ],
  },
  {
    key: 'buyruq_boshtash',
    icon: '📤',
    title: "Buyruq: Ishdan bo'shatish",
    description: "Xodimni ishdan bo'shatish buyrug'ini tayyorlang",
    apiType: 'buyruq',
    resultField: 'buyruq',
    fields: [
      { key: 'xodim_ism', label: "Xodim ismi", placeholder: "Karimov Jasur Hamidovich" },
      { key: 'lavozim', label: "Lavozim", placeholder: "Menejeri" },
      { key: 'sabab', label: "Sabab", placeholder: "O'z ixtiyori bilan" },
      { key: 'sana', label: "Ishdan ketish sanasi", placeholder: "2025-03-31", type: 'date' },
    ],
  },
  {
    key: 'tatil_buyruq',
    icon: '🏖️',
    title: "Ta'til buyrug'i",
    description: "Xodimga ta'til berish buyrug'ini tayyorlang",
    apiType: 'buyruq',
    resultField: 'buyruq',
    fields: [
      { key: 'xodim_ism', label: "Xodim ismi", placeholder: "Usmonov Sardor Bekovich" },
      { key: 'lavozim', label: "Lavozim", placeholder: "Buxgalter" },
      { key: 'tatil_boshlanish', label: "Ta'til boshlanishi", placeholder: "2025-06-01", type: 'date' },
      { key: 'tatil_tugash', label: "Ta'til tugashi", placeholder: "2025-06-28", type: 'date' },
      { key: 'kunlar_soni', label: "Kunlar soni", placeholder: "28" },
    ],
  },
  {
    key: 'ishonchnoma',
    icon: '📜',
    title: 'Ishonchnoma',
    description: "Vakillik uchun ishonchnoma hujjatini tayyorlang",
    apiType: 'ishonchnoma',
    resultField: 'ishonchnoma',
    fields: [
      { key: 'beruvchi_ism', label: "Ishonchnoma beruvchi", placeholder: "Toshmatov Alisher Baxtiyorovich" },
      { key: 'oluvchi_ism', label: "Ishonchnoma oluvchi", placeholder: "Nazarov Dilshod Karimovich" },
      { key: 'oluvchi_passport', label: "Oluvchi pasporti", placeholder: "AB 1234567" },
      { key: 'vakolat', label: "Vakolat mazmuni", placeholder: "Bank hisob raqamidan pul olish uchun..." },
      { key: 'muddat', label: "Amal qilish muddati", placeholder: "1 yil" },
    ],
  },
  {
    key: 'lavozim_yoriqnoma',
    icon: '📚',
    title: "Lavozim yo'riqnomasi",
    description: "Xodim lavozimi uchun yo'riqnoma tayyorlang",
    apiType: 'mehnat_shartnoma',
    resultField: 'shartnoma',
    fields: [
      { key: 'lavozim', label: "Lavozim nomi", placeholder: "Bosh muhasib" },
      { key: 'bo\'lim', label: "Bo'lim", placeholder: "Moliya bo'limi" },
      { key: 'asosiy_vazifalar', label: "Asosiy vazifalar", placeholder: "Hisobot tuzish, soliq hisobotlari..." },
      { key: 'talablar', label: "Talablar (ma'lumot, tajriba)", placeholder: "Oliy ma'lumot, 3 yil tajriba..." },
    ],
  },
]

export default function KadrlarPage() {
  const { activeOrg, isFree } = useDashboard()
  const [selected, setSelected] = useState<KadrFeature | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const currentFeature = FEATURES.find(f => f.key === selected)

  function selectFeature(key: KadrFeature) {
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
      const buyruqTur = selected === 'buyruq_qabul' ? 'qabul' : selected === 'buyruq_boshtash' ? 'boshtash' : selected === 'tatil_buyruq' ? 'tatil' : undefined

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
            ...(buyruqTur ? { buyruq_tur: buyruqTur } : {}),
          },
        }),
      })

      const data = await res.json()
      if (data.error) { setError(data.error); return }

      const text = data.result?.[currentFeature.resultField] || data.result?.shartnoma || data.result?.buyruq || data.result?.ishonchnoma || JSON.stringify(data.result, null, 2)
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
            <span className="w-10 h-10 bg-cyan-900/50 rounded-xl flex items-center justify-center text-xl">👥</span>
            Kadrlar hujjatlari
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI yordamida kadrlar hujjatlarini avtomatik tayyorlang</p>
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
                className="bg-gray-900 border border-gray-800 hover:border-cyan-700/60 hover:bg-gray-800/80 rounded-xl p-5 text-left transition group">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <div className="font-semibold text-white text-sm mb-1 group-hover:text-cyan-300 transition">{feature.title}</div>
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
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-gray-500"
                  />
                </div>
              ))}
            </div>

            {/* Org info display */}
            {activeOrg && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-400">
                Tashkilot: <span className="text-white font-medium">{activeOrg.name}</span> · INN: {activeOrg.inn} · Direktor: {activeOrg.director_name}
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
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-semibold text-white">Natija:</h3>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition">
                      {copied ? '✓ Nusxalandi' : '📋 Nusxalash'}
                    </button>
                    <button onClick={() => downloadTextAsPDF(result, currentFeature?.title || 'hujjat')}
                      className="flex items-center gap-1.5 text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition">
                      📄 PDF
                    </button>
                    <button onClick={() => downloadTextAsWord(result, currentFeature?.title || 'hujjat')}
                      className="flex items-center gap-1.5 text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition">
                      📝 Word
                    </button>
                  </div>
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
