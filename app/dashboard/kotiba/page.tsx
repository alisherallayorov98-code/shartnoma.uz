'use client'

import { useState } from 'react'
import { useDashboard } from '../context'
import { downloadTextAsPDF, downloadTextAsWord } from '@/lib/downloadUtils'

type KotibaFeature =
  | 'bayonnoma'
  | 'rasmiy_xat'
  | 'taklifnoma'
  | 'hisobot'
  | 'eslatma'
  | 'murojaatnoma'
  | 'tushuntirish_xati'

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
    description: "Yig'ilish yoki kengash bayonnomasini avtomatik tayyorlang",
    apiType: 'bayonnoma',
    resultField: 'bayonnoma',
    fields: [
      { key: 'sana', label: "Yig'ilish sanasi", placeholder: '2025-04-15', type: 'date' },
      { key: 'joyi', label: "O'tkazilgan joy", placeholder: 'Bosh ofis, majlis xonasi' },
      { key: 'raislik_qilgan', label: 'Raislik qilgan', placeholder: 'Karimov Alisher Raximovich' },
      { key: 'ishtirokchilar', label: 'Ishtirokchilar (vergul bilan)', placeholder: 'Rahimov B., Usmonov S., Toshmatov D.' },
      { key: 'kun_tartibi', label: "Kun tartibi (masalalar)", placeholder: "1. Moliyaviy hisobot\n2. Yangi loyiha muhokamasi", textarea: true },
      { key: 'qarorlar', label: "Qabul qilingan qarorlar", placeholder: "1. Hisobotni tasdiqlash\n2. Loyihani boshlash", textarea: true },
    ],
  },
  {
    key: 'rasmiy_xat',
    icon: '✉️',
    title: 'Rasmiy xat',
    description: "Hamkorlar, davlat organlari yoki kontragentlarga rasmiy xat yozing",
    apiType: 'rasmiy_xat',
    resultField: 'xat',
    fields: [
      { key: 'kim_uchun', label: "Kimga (tashkilot/shaxs)", placeholder: 'Soliq inspeksiyasi boshlig\'iga' },
      { key: 'mavzu', label: 'Xat mavzusi', placeholder: "Ma'lumot so'rash haqida" },
      { key: 'asosiy_mazmun', label: 'Asosiy mazmun/so\'rov', placeholder: "2024-yil 3-kvartal hisoboti bo'yicha ma'lumot so'rash...", textarea: true },
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
]

export default function KotibaPage() {
  const { activeOrg, isFree } = useDashboard()
  const [selected, setSelected] = useState<KotibaFeature | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const currentFeature = FEATURES.find(f => f.key === selected)

  function selectFeature(key: KotibaFeature) {
    setSelected(key)
    setFormData({})
    setResult(null)
    setError('')
  }

  async function handleGenerate() {
    if (!currentFeature) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: currentFeature.apiType,
          data: {
            ...formData,
            tashkilot: activeOrg?.name || '',
            tashkilot_inn: activeOrg?.inn || '',
            direktor: activeOrg?.director_name || '',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setError(data.error || 'Xatolik yuz berdi'); return }
      const text = data.result?.[currentFeature.resultField]
        || data.result?.bayonnoma
        || data.result?.xat
        || data.result?.taklifnoma
        || data.result?.hisobot
        || data.result?.eslatma
        || data.result?.murojaatnoma
        || data.result?.tushuntirish
        || JSON.stringify(data.result, null, 2)
      setResult(text)
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
    <main className="flex-1 overflow-auto p-6 bg-gray-950">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 bg-violet-900/50 rounded-xl flex items-center justify-center text-xl">🗂️</span>
            Kotiba AI
          </h1>
          <p className="text-gray-400 text-sm mt-1">AI yordamida rasmiy hujjatlar, xatlar va bayonnomalar tayyorlang</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentFeature.fields.map(field => (
                <div key={field.key} className={field.textarea ? 'col-span-full' : ''}>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{field.label}</label>
                  {field.textarea ? (
                    <textarea
                      rows={3}
                      value={formData[field.key] || ''}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className={inp + ' resize-none'}
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

            {/* Org info */}
            {activeOrg && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-400">
                Tashkilot: <span className="text-white font-medium">{activeOrg.name}</span>
                {activeOrg.inn && <> · INN: {activeOrg.inn}</>}
                {activeOrg.director_name && <> · Direktor: {activeOrg.director_name}</>}
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
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
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
                    <button onClick={() => downloadTextAsPDF(result, currentFeature.title)}
                      className="flex items-center gap-1.5 text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition">
                      📄 PDF
                    </button>
                    <button onClick={() => downloadTextAsWord(result, currentFeature.title)}
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
