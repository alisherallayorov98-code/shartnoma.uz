'use client'

import { useState } from 'react'
import { useDashboard } from '../context'
import { fetchAi } from '@/lib/fetchAi'
import { downloadTextAsPDF, downloadTextAsWord } from '@/lib/downloadUtils'
import { saveAiDocument } from '@/lib/aiDocuments'
import SavedDocumentsPanel from '../_components/SavedDocumentsPanel'
import BayonnomaMaker from './_components/BayonnomaMaker'
import BuyruqMaker from './_components/BuyruqMaker'

type KotibaFeature =
  | 'bayonnoma' | 'rasmiy_xat' | 'taklifnoma'
  | 'hisobot' | 'eslatma' | 'murojaatnoma' | 'tushuntirish_xati'
  | 'ishonchnoma' | 'dalolatnoma' | 'kafolat_xat' | 'tabriklash_xat' | 'rekvizitlar_xat'
  | 'buyruq'

type FeatureConfig = {
  key: KotibaFeature
  icon: string
  title: string
  description: string
  fields: { key: string; label: string; placeholder: string; type?: string; textarea?: boolean }[]
  apiType: string
  resultField: string
  isCustomComponent?: boolean
}

const FEATURES: FeatureConfig[] = [
  {
    key: 'bayonnoma', icon: '📝', title: "Yig'ilish bayonnomasi",
    description: "Kredit, dividend, xarid, ta'sischi va boshqa turlari",
    apiType: '', resultField: '', fields: [], isCustomComponent: true,
  },
  {
    key: 'rasmiy_xat', icon: '✉️', title: 'Rasmiy xat',
    description: "Hamkorlar, davlat organlari yoki kontragentlarga rasmiy xat",
    apiType: 'rasmiy_xat', resultField: 'xat',
    fields: [
      { key: 'kim_uchun', label: "Kimga", placeholder: "Soliq inspeksiyasi boshlig'iga" },
      { key: 'mavzu', label: 'Mavzu', placeholder: "Ma'lumot so'rash haqida" },
      { key: 'asosiy_mazmun', label: "Mazmun", placeholder: "2024-yil 3-kvartal hisoboti bo'yicha...", textarea: true },
      { key: 'muddati', label: 'Javob muddati (ixtiyoriy)', placeholder: '10 ish kuni ichida' },
    ],
  },
  {
    key: 'taklifnoma', icon: '📨', title: 'Taklifnoma',
    description: "Tadbir, seminar yoki uchrashuvga rasmiy taklifnoma",
    apiType: 'taklifnoma', resultField: 'taklifnoma',
    fields: [
      { key: 'tadbir_nomi', label: 'Tadbir nomi', placeholder: "Yillik sheriklar konferensiyasi" },
      { key: 'tadbir_sana', label: 'Sana va vaqt', placeholder: '15-aprel 2025, soat 10:00' },
      { key: 'tadbir_joyi', label: 'Joyi', placeholder: "Toshkent, Hyatt Regency" },
      { key: 'mehmonga', label: "Kimga", placeholder: 'Alfa Texnologiya MChJ direktori' },
      { key: 'dastur', label: 'Dastur', placeholder: "Ochilish, ma'ruzalar, tushlik, muhokama", textarea: true },
    ],
  },
  {
    key: 'hisobot', icon: '📊', title: 'Hisobot',
    description: "Oylik, kvartallik yoki loyiha bo'yicha rasmiy hisobot",
    apiType: 'hisobot', resultField: 'hisobot',
    fields: [
      { key: 'hisobot_turi', label: 'Hisobot turi', placeholder: 'Oylik faoliyat hisoboti' },
      { key: 'davr', label: 'Davr', placeholder: '2025-yil mart oyi' },
      { key: 'bajarilgan_ishlar', label: 'Bajarilgan ishlar', placeholder: "- 3 ta yangi shartnoma imzolandi", textarea: true },
      { key: 'muammolar', label: "Muammolar (ixtiyoriy)", placeholder: "Etkazib berish kechikdi..." },
      { key: 'rejalar', label: "Keyingi davr rejalari", placeholder: "- Yangi bozorga chiqish", textarea: true },
    ],
  },
  {
    key: 'eslatma', icon: '📌', title: 'Ichki eslatma (memo)',
    description: "Xodimlarga yoki bo'limlarga rasmiy ichki eslatma",
    apiType: 'eslatma', resultField: 'eslatma',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "Barcha bo'lim boshliqlari" },
      { key: 'mavzu', label: 'Mavzu', placeholder: "Ish vaqti tartibiga rioya qilish haqida" },
      { key: 'mazmun', label: 'Mazmun', placeholder: "Quyidagilarga e'tiboringizni qaratishingizni so'raymiz...", textarea: true },
      { key: 'muddat', label: "Muddat (ixtiyoriy)", placeholder: '20-aprelgacha' },
    ],
  },
  {
    key: 'murojaatnoma', icon: '📋', title: "Murojaatnoma / ariza",
    description: "Davlat organlari yoki rahbariyatga rasmiy murojaatnoma",
    apiType: 'murojaatnoma', resultField: 'murojaatnoma',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "Toshkent shahar hokimligiga" },
      { key: 'maqsad', label: "Maqsad", placeholder: "Ruxsatnoma berish so'rash" },
      { key: 'asosiy_mazmun', label: 'Mazmun', placeholder: "Biz O'zbekiston Respublikasining ...", textarea: true },
      { key: 'kutilgan_natija', label: "Kutilayotgan natija", placeholder: "30 kunlik ruxsatnoma berish" },
    ],
  },
  {
    key: 'tushuntirish_xati', icon: '📄', title: "Tushuntirish xati",
    description: "Xodimdan yoki tashkilotdan rasmiy tushuntirish xati",
    apiType: 'tushuntirish_xati', resultField: 'tushuntirish',
    fields: [
      { key: 'xodim_ism', label: "Xodim ismi", placeholder: "Rahimov Bobur Aliyevich" },
      { key: 'lavozim', label: "Lavozim", placeholder: "Bosh muhandis" },
      { key: 'hodisa', label: "Voqea", placeholder: "3-aprel kuni kechikib kelgan" },
      { key: 'sabab', label: "Sabab", placeholder: "Transport muammosi tufayli...", textarea: true },
      { key: 'qayta_takrorlanmasligi', label: "Takrorlanmaslik choralari (ixtiyoriy)", placeholder: "Bundan buyon erta chiqishga harakat qilaman..." },
    ],
  },
  {
    key: 'ishonchnoma', icon: '📜', title: 'Ishonchnoma',
    description: "Kompaniya nomidan vakil tayinlash — bank, hujjat, tender",
    apiType: 'ishonchnoma', resultField: 'ishonchnoma',
    fields: [
      { key: 'vakil_ism', label: "Vakil F.I.Sh.", placeholder: "Rahimov Bobur Aliyevich" },
      { key: 'vakil_lavozim', label: "Lavozim", placeholder: "Bosh buxgalter" },
      { key: 'vakil_passport', label: "Pasport", placeholder: "AB1234567" },
      { key: 'vakolat_maqsad', label: "Vakolat maqsadi", placeholder: "Soliq inspeksiyasidan hujjat olish...", textarea: true },
      { key: 'amal_muddati', label: "Muddat", placeholder: "6 oy / 1 yil / 2026 yil 31 dekabrgacha" },
    ],
  },
  {
    key: 'dalolatnoma', icon: '📑', title: 'Dalolatnoma',
    description: "Qabul-topshirish, yo'qotish, inventarizatsiya dalolatnomasi",
    apiType: 'dalolatnoma', resultField: 'dalolatnoma',
    fields: [
      { key: 'dalolatnoma_turi', label: "Tur", placeholder: "Qabul-topshirish / Yo'qotish / Inventarizatsiya" },
      { key: 'sana', label: "Sana", placeholder: "2026-03-23", type: 'date' },
      { key: 'joy', label: "Joy", placeholder: "Tashkilot omborxonasi, Toshkent" },
      { key: 'ishtirokchilar', label: "Ishtirokchilar", placeholder: "Ombor mudiri Karimov A., Buxgalter Rahimova N." },
      { key: 'predmet', label: "Predmet", placeholder: "Nima topshirildi / tekshirildi / yo'qoldi", textarea: true },
      { key: 'xulosa', label: "Xulosa", placeholder: "Hujjatlar to'liq topshirildi...", textarea: true },
    ],
  },
  {
    key: 'kafolat_xat', icon: '🔒', title: 'Kafolat xati',
    description: "Hamkor, bank yoki davlat organiga kafolat xati",
    apiType: 'kafolat_xat', resultField: 'kafolat_xat',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "Ipoteka-bank bosh ofisi" },
      { key: 'kafolat_maqsad', label: "Maqsad", placeholder: "Kredit to'lovlari / Shartnoma bajarish" },
      { key: 'kafolat_miqdori', label: "Summa (ixtiyoriy)", placeholder: "500 000 000 so'm" },
      { key: 'kafolat_muddati', label: "Muddat", placeholder: "2026 yil 31 dekabrgacha" },
      { key: 'qoshimcha', label: "Qo'shimcha (ixtiyoriy)", placeholder: "Shartnoma bajarilmagan taqdirda...", textarea: true },
    ],
  },
  {
    key: 'tabriklash_xat', icon: '🎉', title: 'Tabriklash xati',
    description: "Sherik, mijoz yoki tashkilotga rasmiy tabrik xati",
    apiType: 'tabriklash_xat', resultField: 'tabriklash_xat',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "\"Alfa\" MChJ direktori Karimov Alisher" },
      { key: 'bayram', label: "Bayram", placeholder: "Yangi yil / Navro'z / Tashkilot yubileyi" },
      { key: 'asosiy_mazmun', label: "Mazmun (ixtiyoriy)", placeholder: "Hamkorlik uchun minnatdorchilik...", textarea: true },
    ],
  },
  {
    key: 'rekvizitlar_xat', icon: '📨', title: 'Rekvizitlar xati',
    description: "Hamkordan bank rekvizitlari yoki hujjat so'rash",
    apiType: 'rekvizitlar_xat', resultField: 'rekvizitlar_xat',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "\"Beta Savdo\" MChJ" },
      { key: 'sorov_turi', label: "So'rov turi", placeholder: "Bank rekvizitlari / Ustav nusxasi" },
      { key: 'maqsad', label: "Maqsad", placeholder: "Shartnoma tuzish uchun" },
      { key: 'muddat', label: "Javob muddati", placeholder: "2 ish kuni ichida" },
    ],
  },
  {
    key: 'buyruq', icon: '📜', title: 'Tashkiliy buyruqlar',
    description: "Asosiy vosita, komissiya, safari, vazifa va boshqa buyruqlar",
    apiType: '', resultField: '', fields: [], isCustomComponent: true,
  },
]

const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

export default function KotibaPage() {
  const { activeOrg, hasAiAccess, openUpgradeModal } = useDashboard()
  const [selected, setSelected] = useState<KotibaFeature | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [savedKey, setSavedKey] = useState(0)

  const currentFeature = FEATURES.find(f => f.key === selected)

  function selectFeature(key: KotibaFeature) {
    setSelected(key); setFormData({}); setResult(null); setError(''); setShowPreview(false)
  }

  async function handleGenerate() {
    if (!currentFeature) return
    if (!hasAiAccess()) { openUpgradeModal(); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetchAi({
        type: currentFeature.apiType,
        data: { ...formData, tashkilot: activeOrg?.name || '', tashkilot_inn: activeOrg?.inn || '', direktor: activeOrg?.director_name || '' },
      })
      const data = await res.json()
      if (data.error === 'premium_required') { openUpgradeModal(); return }
      if (!res.ok || data.error) { setError(data.error || 'Xatolik yuz berdi'); return }
      const text = data.result?.[currentFeature.resultField]
        || data.result?.bayonnoma || data.result?.xat || data.result?.taklifnoma
        || data.result?.hisobot || data.result?.eslatma || data.result?.murojaatnoma
        || data.result?.tushuntirish || JSON.stringify(data.result, null, 2)
      setResult(text)
      if (text && activeOrg) {
        saveAiDocument({ organization_id: activeOrg.id, section: 'kotiba', feature_key: selected!, title: currentFeature.title, content: text, meta: {} })
          .then(() => setSavedKey(k => k + 1)).catch(console.error)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0B1220] min-h-screen">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 border border-blue-600/30 rounded-xl flex items-center justify-center text-xl">🤖</div>
            <div>
              <h1 className="text-xl font-bold text-white">Kotiba AI</h1>
              <p className="text-gray-500 text-sm">Rasmiy hujjatlarni AI yordamida bir zumda tayyorlang</p>
            </div>
          </div>
          {!hasAiAccess() && (
            <button onClick={openUpgradeModal}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
              ✦ AI Pro olish →
            </button>
          )}
        </div>

        {/* Pro banner */}
        {!hasAiAccess() && (
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-white font-semibold text-sm mb-0.5">✦ AI Pro tarifida ishlaydi</div>
              <div className="text-gray-400 text-xs">Barcha kotiba hujjatlari Claude AI yordamida bir zumda tayyorlanadi</div>
            </div>
            <button onClick={openUpgradeModal}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
              Pro versiyani olish →
            </button>
          </div>
        )}

        {/* Feature cards */}
        {!selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map(f => (
              <button key={f.key} onClick={() => selectFeature(f.key)}
                className="bg-[#111827] border border-[#1E293B] hover:border-blue-600/50 hover:bg-[#1F2937] rounded-xl p-5 text-left transition group">
                <div className="text-2xl mb-3">{f.icon}</div>
                <div className="font-semibold text-white text-sm mb-1 group-hover:text-blue-400 transition">{f.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{f.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        {selected && currentFeature && (
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
            {/* Form header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E293B] bg-[#111827]">
              <button onClick={() => { setSelected(null); setResult(null); setError('') }}
                className="text-gray-500 hover:text-white text-sm flex items-center gap-1.5 transition">
                ← Orqaga
              </button>
              <div className="w-px h-4 bg-[#1E293B]"/>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentFeature.icon}</span>
                <h2 className="font-semibold text-white text-sm">{currentFeature.title}</h2>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {selected === 'bayonnoma' ? (
                <BayonnomaMaker
                  orgName={activeOrg?.name || ''} orgInn={activeOrg?.inn || ''} direktorName={activeOrg?.director_name || ''}
                  onSaved={() => setSavedKey(k => k + 1)}
                />
              ) : selected === 'buyruq' ? (
                <BuyruqMaker
                  orgName={activeOrg?.name || ''} orgDirector={activeOrg?.director_name || ''}
                  onSaved={() => setSavedKey(k => k + 1)}
                />
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentFeature.fields.map(field => (
                      <div key={field.key} className={field.textarea ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                        {field.textarea ? (
                          <textarea value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder} rows={3} className={`${inp} resize-y`}/>
                        ) : (
                          <input type={field.type || 'text'} value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder} className={inp}/>
                        )}
                      </div>
                    ))}
                  </div>

                  {activeOrg && (
                    <div className="bg-[#111827] border border-[#1E293B] rounded-xl px-4 py-2.5 text-xs text-gray-400 flex items-center gap-2">
                      <span className="text-base">🏢</span>
                      <span className="text-white font-medium">{activeOrg.name}</span>
                      <span className="text-gray-600">·</span>
                      <span>{activeOrg.director_name}</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-2.5 text-sm text-red-300 flex items-center gap-2">
                      <span>⚠</span> {error}
                    </div>
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
                </>
              )}

              {/* Result */}
              {result && (
                <div className="space-y-3 border-t border-[#1E293B] pt-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">Natija</h3>
                      <span className="text-xs text-green-400 bg-green-500/20 border border-green-500/30 px-2 py-0.5 rounded-full">✓ Saqlandi</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setShowPreview(true)}
                        className="flex items-center gap-1.5 text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg transition">👁 Ko&apos;rish</button>
                      <button onClick={() => downloadTextAsWord(result, currentFeature?.title || 'hujjat')}
                        className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-semibold transition">📝 Word</button>
                      <button onClick={() => downloadTextAsPDF(result, currentFeature?.title || 'hujjat')}
                        className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition">📄 PDF</button>
                      <button onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg transition">
                        {copied ? '✓ Nusxalandi' : '📋 Nusxalash'}
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto font-mono text-xs">
                    {result}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview modal */}
        {showPreview && result && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
                <h3 className="font-semibold text-white">👁 Ko&apos;rish: {currentFeature?.title}</h3>
                <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white text-xl leading-none transition">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white text-gray-900 rounded-xl p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-inner">{result}</div>
              </div>
              <div className="px-5 py-4 border-t border-[#1E293B] flex gap-3">
                <button onClick={() => { downloadTextAsWord(result, currentFeature?.title || 'hujjat'); setShowPreview(false) }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">📝 Word</button>
                <button onClick={() => { downloadTextAsPDF(result, currentFeature?.title || 'hujjat'); setShowPreview(false) }}
                  className="flex-1 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 py-2.5 rounded-xl text-sm transition">📄 PDF</button>
              </div>
            </div>
          </div>
        )}

        {activeOrg && (
          <SavedDocumentsPanel orgId={activeOrg.id} section="kotiba" accentColor="blue" refreshKey={savedKey} />
        )}
      </div>
    </main>
  )
}
