'use client'

import { useState, useRef, useEffect } from 'react'
import { useDashboard } from '../context'
import { fetchAi } from '@/lib/fetchAi'
import { saveAiDocument } from '@/lib/aiDocuments'
import SavedDocumentsPanel from '../_components/SavedDocumentsPanel'
import HujjatResult from '../_components/HujjatResult'

type BuxFeature = 'dalolatnoma' | 'talabnoma' | 'tolov_grafigi' | 'debitor_undirish'

type FeatureConfig = {
  key: BuxFeature
  icon: string
  title: string
  description: string
  fields: { key: string; label: string; placeholder: string; type?: string; isCpField?: boolean }[]
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
      { key: 'kontragentar_ism', label: "Kontragent nomi", placeholder: "Raqamli Texnologiyalar MChJ", isCpField: true },
      { key: 'xizmat_turi', label: "Bajarilgan xizmat/ish turi", placeholder: "Dasturiy ta'minot ishlab chiqish" },
      { key: 'shartnoma_raqam', label: "Shartnoma raqami", placeholder: "2025/03-15" },
      { key: 'summa', label: "Summa (so'm)", placeholder: "15 000 000" },
      { key: 'sana', label: "Dalolatnoma sanasi", placeholder: "2025-03-20", type: 'date' },
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
      { key: 'qarzdor', label: "Qarzdor nomi", placeholder: "ABC Savdo MChJ", isCpField: true },
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
    apiType: 'tolov_grafigi',
    resultField: 'tolov_grafigi',
    fields: [
      { key: 'kontragent', label: "Kontragent", placeholder: "Global Solutions LLC", isCpField: true },
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
      { key: 'qarzdor', label: "Qarzdor korxona", placeholder: "Yulduz Savdo AJ", isCpField: true },
      { key: 'qarz_summasi', label: "Qarz summasi (so'm)", placeholder: "80 000 000" },
      { key: 'qarz_sababi', label: "Qarz sababi", placeholder: "Tovarlar yetkazib berilgan, to'lov amalga oshirilmagan" },
      { key: 'oxirgi_muhlat', label: "To'lov oxirgi muhlati", placeholder: "2025-04-10", type: 'date' },
      { key: 'sudga_murojaat', label: "Sud murojaat ogohlantirishmi?", placeholder: "Ha / Yo'q" },
    ],
  },
]

export default function BuxgalterPage() {
  const { activeOrg, hasAiAccess, contracts, cps, openUpgradeModal } = useDashboard()
  const [selected, setSelected] = useState<BuxFeature | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedKey, setSavedKey] = useState(0)
  const [cpSearch, setCpSearch] = useState<Record<string, string>>({})
  const [cpOpen, setCpOpen] = useState<string | null>(null)
  const cpDropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cpDropRef.current && !cpDropRef.current.contains(e.target as Node)) {
        setCpOpen(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
    if (!hasAiAccess()) { openUpgradeModal(); return }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetchAi({
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
      })

      const data = await res.json()
      if (data.error === 'premium_required') { openUpgradeModal(); return }
      if (data.error) { setError(data.error); return }

      const text = data.result?.[currentFeature.resultField]
        || data.result?.dalolatnoma || data.result?.faktura || data.result?.talabnoma
        || JSON.stringify(data.result, null, 2)
      setResult(text)

      // Auto-save to Supabase
      if (text && activeOrg) {
        saveAiDocument({
          organization_id: activeOrg.id,
          section: 'buxgalter',
          feature_key: selected!,
          title: currentFeature.title,
          content: text,
          meta: {},
        }).then(() => setSavedKey(k => k + 1)).catch(console.error)
      }
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

  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0B1220]">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-xl">💼</span>
            Buxgalter hujjatlari
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI yordamida moliyaviy hujjatlarni avtomatik tayyorlang</p>
        </div>

        {/* Stats bar */}
        {(() => {
          const orgContracts = contracts.filter(c => c.organization_id === activeOrg?.id)
          const activeContracts = orgContracts.filter(c => c.status === 'active')
          const activeSum = activeContracts.reduce((s, c) => s + (Number(c.amount) || 0), 0)
          return (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{orgContracts.length}</div>
                <div className="text-xs text-gray-500 mt-1">Jami shartnomalar</div>
              </div>
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{activeContracts.length}</div>
                <div className="text-xs text-gray-500 mt-1">Faol shartnomalar</div>
              </div>
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{(activeSum / 1_000_000).toFixed(1)}M</div>
                <div className="text-xs text-gray-500 mt-1">Faol summa</div>
              </div>
            </div>
          )
        })()}

        {!hasAiAccess() && (
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-white text-sm font-semibold mb-0.5">✦ Pro versiyada ishlaydi</div>
              <div className="text-gray-400 text-xs">Buxgalteriya hujjatlari faqat Standart yoki AI Pro tarifida ishlaydi</div>
            </div>
            <button onClick={openUpgradeModal}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
              Pro versiyani olish →
            </button>
          </div>
        )}

        {/* Feature cards */}
        {!selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(feature => (
              <button key={feature.key} onClick={() => selectFeature(feature.key)}
                className="bg-[#111827] border border-[#1E293B] hover:border-blue-600/50 hover:bg-[#1F2937] rounded-xl p-5 text-left transition group">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <div className="font-semibold text-white text-sm mb-1 group-hover:text-blue-400 transition">{feature.title}</div>
                <div className="text-xs text-gray-500">{feature.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        {selected && currentFeature && (
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelected(null); setResult(null); setError('') }}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
                ← Orqaga
              </button>
              <div className="w-px h-4 bg-[#1E293B]"/>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentFeature.icon}</span>
                <h2 className="font-semibold text-white">{currentFeature.title}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" ref={cpDropRef}>
              {currentFeature.fields.map(field => {
                if (field.isCpField) {
                  const search = cpSearch[field.key] ?? formData[field.key] ?? ''
                  const filtered = cps.filter(c =>
                    c.name.toLowerCase().includes(search.toLowerCase())
                  ).slice(0, 8)
                  return (
                    <div key={field.key} className="relative">
                      <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                      <input
                        type="text"
                        value={cpOpen === field.key ? search : (formData[field.key] || '')}
                        onFocus={() => { setCpOpen(field.key); setCpSearch(p => ({ ...p, [field.key]: formData[field.key] || '' })) }}
                        onChange={e => { setCpSearch(p => ({ ...p, [field.key]: e.target.value })); setCpOpen(field.key) }}
                        placeholder={field.placeholder}
                        className={inp}
                        autoComplete="off"
                      />
                      {cpOpen === field.key && filtered.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                          {filtered.map(cp => (
                            <button key={cp.id} type="button"
                              onMouseDown={() => {
                                setFormData(prev => ({ ...prev, [field.key]: cp.name }))
                                setCpOpen(null)
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-[#1F2937] transition">
                              <div className="text-sm text-white">{cp.name}</div>
                              {cp.inn && <div className="text-xs text-gray-500">INN: {cp.inn}</div>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
                return (
                  <div key={field.key}>
                    <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      value={formData[field.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className={inp}
                    />
                  </div>
                )
              })}
            </div>

            {activeOrg && (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-gray-400">
                Tashkilot: <span className="text-white font-medium">{activeOrg.name}</span>
                {activeOrg.bank_name && <> · Bank: {activeOrg.bank_name}</>}
                {activeOrg.bank_account && <> · H/R: {activeOrg.bank_account}</>}
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-sm text-red-300">⚠ {error}</div>
            )}

            <button onClick={handleGenerate} disabled={loading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-[#1F2937] disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>AI ishlamoqda…</>
              ) : <>🤖 AI bilan tayyorlash</>}
            </button>

            {result && (
              <HujjatResult
                result={result}
                title={currentFeature?.title || 'hujjat'}
                copied={copied}
                onCopy={handleCopy}
              />
            )}
          </div>
        )}

        {/* Saved Documents */}
        {activeOrg && (
          <SavedDocumentsPanel orgId={activeOrg.id} section="buxgalter" accentColor="blue" refreshKey={savedKey} />
        )}
      </div>
    </main>
  )
}
