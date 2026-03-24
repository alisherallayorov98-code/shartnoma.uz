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
}

const FEATURES: FeatureConfig[] = [
  {
    key: 'bayonnoma',
    icon: '📝',
    title: "Yig'ilish bayonnomasi",
    description: "Kredit, dividend, xarid, ta'sischi va boshqa turlari",
    apiType: 'bayonnoma',
    resultField: 'bayonnoma',
    fields: [],
  },
  {
    key: 'rasmiy_xat',
    icon: '✉️',
    title: 'Rasmiy xat',
    description: "Hamkorlar, davlat organlari yoki kontragentlarga rasmiy xat yozing",
    apiType: 'rasmiy_xat',
    resultField: 'xat',
    fields: [
      { key: 'kim_uchun', label: "Kimga (tashkilot/shaxs)", placeholder: "Soliq inspeksiyasi boshlig'iga" },
      { key: 'mavzu', label: 'Xat mavzusi', placeholder: "Ma'lumot so'rash haqida" },
      { key: 'asosiy_mazmun', label: "Asosiy mazmun/so'rov", placeholder: "2024-yil 3-kvartal hisoboti bo'yicha ma'lumot so'rash...", textarea: true },
      { key: 'muddati', label: 'Javob muddati (ixtiyoriy)', placeholder: '10 ish kuni ichida' },
    ],
  },
  {
    key: 'taklifnoma',
    icon: '📨',
    title: 'Taklifnoma',
    description: "Tadbir, seminar yoki uchrashuvga rasmiy taklifnoma tayyorlang",
    apiType: 'taklifnoma',
    resultField: 'taklifnoma',
    fields: [
      { key: 'tadbir_nomi', label: 'Tadbir nomi', placeholder: "Yillik sheriklar konferensiyasi" },
      { key: 'tadbir_sana', label: 'Sana va vaqt', placeholder: '15-aprel 2025, soat 10:00' },
      { key: 'tadbir_joyi', label: 'Joyi/manzili', placeholder: "Toshkent, Hyatt Regency mehmonxonasi" },
      { key: 'mehmonga', label: "Kimga yo'llangan", placeholder: 'Alfa Texnologiya MChJ direktori' },
      { key: 'dastur', label: 'Tadbir dasturi (qisqacha)', placeholder: "Ochilish, ma'ruzalar, tushlik, muhokama", textarea: true },
    ],
  },
  {
    key: 'hisobot',
    icon: '📊',
    title: 'Hisobot',
    description: "Oylik, kvartallik yoki loyiha bo'yicha rasmiy hisobot tayyorlang",
    apiType: 'hisobot',
    resultField: 'hisobot',
    fields: [
      { key: 'hisobot_turi', label: 'Hisobot turi', placeholder: 'Oylik faoliyat hisoboti / Kvartal moliyaviy hisoboti' },
      { key: 'davr', label: 'Davr', placeholder: '2025-yil mart oyi' },
      { key: 'bajarilgan_ishlar', label: 'Bajarilgan ishlar', placeholder: "- 3 ta yangi shartnoma imzolandi\n- Savdo hajmi 15% oshdi", textarea: true },
      { key: 'muammolar', label: "Muammolar / to'siqlar (ixtiyoriy)", placeholder: "Etkazib berish kechikdi..." },
      { key: 'rejalar', label: "Keyingi davr rejalari", placeholder: "- Yangi bozorga chiqish\n- Xodimlar sonini oshirish", textarea: true },
    ],
  },
  {
    key: 'eslatma',
    icon: '📌',
    title: 'Ichki eslatma (memo)',
    description: "Xodimlarga yoki bo'limlarga rasmiy ichki eslatma yozing",
    apiType: 'eslatma',
    resultField: 'eslatma',
    fields: [
      { key: 'kimga', label: "Kimga yo'llangan", placeholder: "Barcha bo'lim boshliqlari / IT bo'limi" },
      { key: 'mavzu', label: 'Eslatma mavzusi', placeholder: "Ish vaqti tartibiga rioya qilish haqida" },
      { key: 'mazmun', label: 'Eslatma mazmuni', placeholder: "Quyidagilarga e'tiboringizni qaratishingizni so'raymiz...", textarea: true },
      { key: 'muddat', label: "Bajarish muddati (ixtiyoriy)", placeholder: '20-aprelgacha' },
    ],
  },
  {
    key: 'murojaatnoma',
    icon: '📋',
    title: "Murojaatnoma / ariza",
    description: "Davlat organlari yoki rahbariyatga rasmiy murojaatnoma yozing",
    apiType: 'murojaatnoma',
    resultField: 'murojaatnoma',
    fields: [
      { key: 'kimga', label: "Kimga (lavozim, tashkilot)", placeholder: "Toshkent shahar hokimligiga" },
      { key: 'maqsad', label: "Murojaat maqsadi", placeholder: "Ruxsatnoma berish / Soliq imtiyozi so'rash" },
      { key: 'asosiy_mazmun', label: 'Murojaat mazmuni', placeholder: "Biz O'zbekiston Respublikasining ...", textarea: true },
      { key: 'kutilgan_natija', label: "Kutilayotgan natija", placeholder: "30 kunlik ruxsatnoma berish" },
    ],
  },
  {
    key: 'tushuntirish_xati',
    icon: '📄',
    title: "Tushuntirish xati",
    description: "Xodimdan yoki tashkilotdan rasmiy tushuntirish xati tayyorlang",
    apiType: 'tushuntirish_xati',
    resultField: 'tushuntirish',
    fields: [
      { key: 'xodim_ism', label: "Xodim / tashkilot ismi", placeholder: "Rahimov Bobur Aliyevich" },
      { key: 'lavozim', label: "Lavozim", placeholder: "Bosh muhandis" },
      { key: 'hodisa', label: "Voqea/holat", placeholder: "3-aprel kuni kechikib kelgan" },
      { key: 'sabab', label: "Sabab va izoh", placeholder: "Transport muammosi tufayli...", textarea: true },
      { key: 'qayta_takrorlanmasligi', label: "Takrorlanmaslik choralari (ixtiyoriy)", placeholder: "Bundan buyon erta chiqishga harakat qilaman..." },
    ],
  },
  {
    key: 'ishonchnoma',
    icon: '📜',
    title: 'Ishonchnoma',
    description: "Kompaniya nomidan vakil tayinlash — bank, hujjat, tender...",
    apiType: 'ishonchnoma',
    resultField: 'ishonchnoma',
    fields: [
      { key: 'vakil_ism', label: "Vakil F.I.Sh.", placeholder: "Rahimov Bobur Aliyevich" },
      { key: 'vakil_lavozim', label: "Vakil lavozimi", placeholder: "Bosh buxgalter" },
      { key: 'vakil_passport', label: "Pasport seriya/raqami", placeholder: "AB1234567" },
      { key: 'vakolat_maqsad', label: "Vakolat maqsadi", placeholder: "Soliq inspeksiyasidan hujjat olish, bank operatsiyalarini amalga oshirish...", textarea: true },
      { key: 'amal_muddati', label: "Amal qilish muddati", placeholder: "6 oy / 1 yil / 2026 yil 31 dekabrgacha" },
    ],
  },
  {
    key: 'dalolatnoma',
    icon: '📑',
    title: 'Dalolatnoma',
    description: "Qabul-topshirish, yo'qotish, inventarizatsiya dalolatnomasi",
    apiType: 'dalolatnoma',
    resultField: 'dalolatnoma',
    fields: [
      { key: 'dalolatnoma_turi', label: "Dalolatnoma turi", placeholder: "Qabul-topshirish / Yo'qotish / Inventarizatsiya / Tekshiruv" },
      { key: 'sana', label: "Sana", placeholder: "2026-03-23", type: 'date' },
      { key: 'joy', label: "O'tkazilgan joy", placeholder: "Tashkilot omborxonasi, Toshkent" },
      { key: 'ishtirokchilar', label: "Ishtirokchilar (lavozim, ism)", placeholder: "Ombor mudiri Karimov A., Buxgalter Rahimova N.", textarea: false },
      { key: 'predmet', label: "Dalolatnoma predmeti", placeholder: "Nima topshirildi / tekshirildi / yo'qoldi", textarea: true },
      { key: 'xulosa', label: "Xulosa va qaror", placeholder: "Hujjatlar to'liq topshirildi / Yo'qotish summasi aniqlandi...", textarea: true },
    ],
  },
  {
    key: 'kafolat_xat',
    icon: '🔒',
    title: 'Kafolat xati',
    description: "Hamkor, bank yoki davlat organiga kafolat xati",
    apiType: 'kafolat_xat',
    resultField: 'kafolat_xat',
    fields: [
      { key: 'kimga', label: "Kimga (tashkilot/organ)", placeholder: "Ipoteka-bank bosh ofisi / Tender komissiyasi" },
      { key: 'kafolat_maqsad', label: "Kafolat maqsadi", placeholder: "Kredit to'lovlari / Shartnoma bajarish / Tender ishtirokchisi" },
      { key: 'kafolat_miqdori', label: "Kafolat summasi (ixtiyoriy)", placeholder: "500 000 000 so'm" },
      { key: 'kafolat_muddati', label: "Kafolat muddati", placeholder: "2026 yil 31 dekabrgacha" },
      { key: 'qoshimcha', label: "Qo'shimcha shartlar (ixtiyoriy)", placeholder: "Shartnoma bajarilmagan taqdirda...", textarea: true },
    ],
  },
  {
    key: 'tabriklash_xat',
    icon: '🎉',
    title: 'Tabriklash xati',
    description: "Sherik, mijoz yoki tashkilotga rasmiy tabrik xati",
    apiType: 'tabriklash_xat',
    resultField: 'tabriklash_xat',
    fields: [
      { key: 'kimga', label: "Kimga (tashkilot/shaxs)", placeholder: "\"Alfa\" MChJ direktori Karimov Alisher" },
      { key: 'bayram', label: "Bayram/tadbir nomi", placeholder: "Yangi yil / Navro'z / Tashkilot yubileyi / Shartnoma imzolash" },
      { key: 'asosiy_mazmun', label: "Tabrik mazmuni (ixtiyoriy)", placeholder: "Hamkorlik uchun minnatdorchilik, kelajakda...", textarea: true },
    ],
  },
  {
    key: 'rekvizitlar_xat',
    icon: '📨',
    title: 'Rekvizitlar xati',
    description: "Hamkordan bank rekvizitlari yoki hujjat so'rash",
    apiType: 'rekvizitlar_xat',
    resultField: 'rekvizitlar_xat',
    fields: [
      { key: 'kimga', label: "Kimga (tashkilot)", placeholder: "\"Beta Savdo\" MChJ" },
      { key: 'sorov_turi', label: "So'rov turi", placeholder: "Bank rekvizitlari / Ustav nusxasi / Litsenziya / Sertifikat" },
      { key: 'maqsad', label: "So'rov maqsadi", placeholder: "Shartnoma tuzish / To'lov amalga oshirish uchun" },
      { key: 'muddat', label: "Javob muddati", placeholder: "2 ish kuni ichida" },
    ],
  },
  {
    key: 'buyruq',
    icon: '📜',
    title: 'Tashkiliy buyruqlar',
    description: "Asosiy vosita, komissiya, safari, vazifa yuklatish va boshqa tashkiliy buyruqlar",
    apiType: '',
    resultField: '',
    fields: [],
  },
]

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
    setSelected(key)
    setFormData({})
    setResult(null)
    setError('')
    setShowPreview(false)
  }

  async function handleGenerate() {
    if (!currentFeature) return
    if (!hasAiAccess()) { openUpgradeModal(); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetchAi({
        type: currentFeature.apiType,
        data: {
          ...formData,
          tashkilot: activeOrg?.name || '',
          tashkilot_inn: activeOrg?.inn || '',
          direktor: activeOrg?.director_name || '',
        },
      })
      const data = await res.json()
      if (data.error === 'premium_required') { openUpgradeModal(); return }
      if (!res.ok || data.error) { setError(data.error || 'Xatolik yuz berdi'); return }
      const text = data.result?.[currentFeature.resultField]
        || data.result?.bayonnoma || data.result?.xat || data.result?.taklifnoma
        || data.result?.hisobot || data.result?.eslatma || data.result?.murojaatnoma
        || data.result?.tushuntirish || JSON.stringify(data.result, null, 2)
      setResult(text)

      // Auto-save to Supabase
      if (text && activeOrg) {
        saveAiDocument({
          organization_id: activeOrg.id,
          section: 'kotiba',
          feature_key: selected!,
          title: currentFeature.title,
          content: text,
          meta: {},
        }).then(() => setSavedKey(k => k + 1)).catch(console.error)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik yuz berdi')
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

  const inp = 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-gray-500'

  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-950">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 bg-violet-900/50 rounded-xl flex items-center justify-center text-xl">🤖</span>
            Kotiba AI
          </h1>
          <p className="text-gray-400 text-sm mt-1">Rasmiy hujjatlarni AI yordamida bir zumda tayyorlang</p>
        </div>

        {!hasAiAccess() && (
          <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-purple-800/30 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-white text-sm font-semibold mb-0.5">✦ Pro versiyada ishlaydi</div>
              <div className="text-gray-400 text-xs">Kotiba AI hujjatlari faqat Standart yoki AI Pro tarifida ishlaydi</div>
            </div>
            <button onClick={openUpgradeModal}
              className="shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition hover:opacity-90">
              Pro versiyani olish →
            </button>
          </div>
        )}

        {/* Feature cards */}
        {!selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(feature => (
              <button key={feature.key} onClick={() => selectFeature(feature.key)}
                className="bg-gray-900 border border-gray-800 hover:border-violet-700/60 hover:bg-gray-800/80 rounded-xl p-5 text-left transition group">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <div className="font-semibold text-white text-sm mb-1 group-hover:text-violet-300 transition">{feature.title}</div>
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

            {selected === 'bayonnoma' ? (
              <BayonnomaMaker
                orgName={activeOrg?.name || ''}
                orgInn={activeOrg?.inn || ''}
                direktorName={activeOrg?.director_name || ''}
                onSave={text => {
                  if (activeOrg) {
                    saveAiDocument({
                      organization_id: activeOrg.id,
                      section: 'kotiba',
                      feature_key: 'bayonnoma',
                      title: "Yig'ilish bayonnomasi",
                      content: text,
                      meta: {},
                    }).then(() => setSavedKey(k => k + 1)).catch(console.error)
                  }
                }}
              />
            ) : selected === 'buyruq' ? (
              <BuyruqMaker
                orgName={activeOrg?.name || ''}
                orgDirector={activeOrg?.director_name || ''}
                onSave={(text, title) => {
                  if (activeOrg) {
                    saveAiDocument({
                      organization_id: activeOrg.id,
                      section: 'kotiba',
                      feature_key: 'buyruq',
                      title,
                      content: text,
                      meta: {},
                    }).then(() => setSavedKey(k => k + 1)).catch(console.error)
                  }
                }}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentFeature.fields.map(field => (
                    <div key={field.key} className={field.textarea ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">{field.label}</label>
                      {field.textarea ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          rows={3}
                          className={`${inp} resize-y`}
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={formData[field.key] || ''}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          className={inp}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {activeOrg && (
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-400">
                    Tashkilot: <span className="text-white font-medium">{activeOrg.name}</span> · Direktor: {activeOrg.director_name}
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-sm text-red-300">⚠ {error}</div>
                )}

                <button onClick={handleGenerate} disabled={loading}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
                  {loading ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>AI ishlamoqda…</>
                  ) : <>🤖 AI bilan tayyorlash</>}
                </button>
              </>
            )}

            {/* Preview modal */}
            {showPreview && result && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
                <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                    <h3 className="font-semibold text-white">👁 Ko&apos;rish: {currentFeature?.title}</h3>
                    <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-white text-gray-900 rounded-xl p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-inner">{result}</div>
                  </div>
                  <div className="px-5 py-4 border-t border-gray-800 flex gap-3">
                    <button onClick={() => { downloadTextAsWord(result, currentFeature?.title || 'hujjat'); setShowPreview(false) }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition">📝 Word</button>
                    <button onClick={() => { downloadTextAsPDF(result, currentFeature?.title || 'hujjat'); setShowPreview(false) }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl text-sm transition">📄 PDF</button>
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Natija:</h3>
                    <span className="text-xs text-green-400">✓ Saqlandi</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowPreview(true)}
                      className="flex items-center gap-1.5 text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition">👁 Ko&apos;rish</button>
                    <button onClick={() => downloadTextAsWord(result, currentFeature?.title || 'hujjat')}
                      className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold transition">📝 Word</button>
                    <button onClick={() => downloadTextAsPDF(result, currentFeature?.title || 'hujjat')}
                      className="flex items-center gap-1.5 text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition">📄 PDF</button>
                    <button onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition">
                      {copied ? '✓ Nusxalandi' : '📋 Nusxalash'}
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

        {/* Saved Documents */}
        {activeOrg && (
          <SavedDocumentsPanel orgId={activeOrg.id} section="kotiba" accentColor="violet" refreshKey={savedKey} />
        )}
      </div>
    </main>
  )
}
