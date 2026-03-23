'use client'

import { useState } from 'react'
import { useDashboard } from '../context'
import { fetchAi } from '@/lib/fetchAi'
import { downloadTextAsPDF, downloadTextAsWord } from '@/lib/downloadUtils'
import { saveAiDocument } from '@/lib/aiDocuments'
import SavedDocumentsPanel from '../_components/SavedDocumentsPanel'
import {
  tplMehnatShartnoma, tplOrindoshlik, tplFuqaroviy, tplMaxfiylik,
  tplBuyruqQabul, tplBuyruqBoshtash, tplTatilBuyruq,
  tplBuyruqLavozim, tplBuyruqMukofot, tplBuyruqJazo,
} from './templates'

// ── Types ──────────────────────────────────────────────────────────────────────
type KadrFeature =
  | 'mehnat_shartnoma' | 'orindoshlik_shartnoma' | 'fuqaroviy_shartnoma' | 'maxfiylik_shartnoma'
  | 'buyruq_qabul' | 'buyruq_boshtash' | 'tatil_buyruq' | 'buyruq_lavozim'
  | 'buyruq_mukofot' | 'buyruq_jazo'
  | 'ishonchnoma' | 'lavozim_yoriqnoma'

type Category = 'shartnoma' | 'buyruq' | 'boshqa'

type FieldDef = { key: string; label: string; placeholder: string; type?: string; textarea?: boolean; optional?: boolean }

type FeatureConfig = {
  key: KadrFeature
  category: Category
  icon: string
  title: string
  description: string
  fields: FieldDef[]
  useAI?: boolean
  apiType?: string
  resultField?: string
}

// ── Mehnat shartnomasi subtypes ──────────────────────────────────────────────
const MEHNAT_TURLARI = [
  { key: 'belgilanmagan_muddatli', label: 'Belgilanmagan muddatli (doimiy)' },
  { key: 'belgilangan_muddatli',   label: 'Belgilangan muddatli (muddatli)' },
  { key: 'yarim_stavkada',         label: 'Yarim stavkada (0,5 stavka)' },
  { key: 'masofaviy',              label: 'Masofaviy ish (remote)' },
  { key: 'amaliyot',               label: 'Amaliyot / Stajyor' },
]

// ── Feature definitions ──────────────────────────────────────────────────────
const FEATURES: FeatureConfig[] = [
  // ── Shartnomalar ──
  {
    key: 'mehnat_shartnoma',
    category: 'shartnoma',
    icon: '📋',
    title: 'Mehnat shartnomasi',
    description: "Doimiy, muddatli, yarim stavkali, masofaviy yoki amaliyot — to'liq matn avtomatik",
    fields: [
      { key: 'xodim_ism',     label: 'Xodim F.I.O.',       placeholder: 'Rahimov Bobur Aliyevich' },
      { key: 'passport',      label: 'Pasport seriya/raqam', placeholder: 'AB 1234567', optional: true },
      { key: 'lavozim',       label: 'Lavozim',              placeholder: 'Dasturchi' },
      { key: 'bolim',         label: "Bo'lim",               placeholder: 'IT bo\'limi', optional: true },
      { key: 'maosh',         label: "Maosh (so'm)",         placeholder: '5 000 000' },
      { key: 'boshlanish_sana', label: 'Boshlanish sanasi', placeholder: '', type: 'date' },
      { key: 'tugash_sana',   label: 'Tugash sanasi (muddatli uchun)', placeholder: '', type: 'date', optional: true },
      { key: 'ish_vaqti',     label: 'Ish vaqti (ixtiyoriy)', placeholder: "Kuniga 8 soat, dushanba–juma", optional: true },
      { key: 'xodim_tel',     label: 'Xodim telefoni (ixtiyoriy)', placeholder: '+998901234567', optional: true },
    ],
  },
  {
    key: 'orindoshlik_shartnoma',
    category: 'shartnoma',
    icon: '👥',
    title: "Tashqi o'rindoshlik shartnomasi",
    description: "Asosiy ish joyini saqlab, qo'shimcha ravishda ishlash uchun mehnat shartnomasi",
    fields: [
      { key: 'xodim_ism',  label: 'Xodim F.I.O.',       placeholder: 'Karimov Jasur Hamidovich' },
      { key: 'passport',   label: 'Pasport seriya/raqam', placeholder: 'AB 1234567' },
      { key: 'lavozim',    label: 'Lavozim',              placeholder: 'Konsultant' },
      { key: 'maosh',      label: "Ish haqi (so'm)",      placeholder: '2 000 000' },
      { key: 'kunlar',     label: 'Ish kunlari',           placeholder: 'dushanba, chorshanba, juma' },
      { key: 'soat_soni',  label: 'Kunlik soat soni',      placeholder: '4' },
      { key: 'boshlanish_sana', label: 'Boshlanish sanasi', placeholder: '', type: 'date' },
      { key: 'tugash_sana', label: 'Tugash sanasi (ixtiyoriy)', placeholder: '', type: 'date', optional: true },
    ],
  },
  {
    key: 'fuqaroviy_shartnoma',
    category: 'shartnoma',
    icon: '📑',
    title: "Fuqaroviy-huquqiy yollanma shartnomasi",
    description: "Mehnat shartnomasi emas — bir martalik yoki vaqtinchalik xizmat uchun podryad shartnomasi",
    fields: [
      { key: 'ijrochi_ism',    label: 'Ijrochi F.I.O.',         placeholder: 'Toshmatov Alisher Baxtiyorovich' },
      { key: 'passport',       label: 'Pasport seriya/raqam',    placeholder: 'AB 1234567' },
      { key: 'ijrochi_stir',   label: "Ijrochi STIR (ixtiyoriy)", placeholder: '123456789', optional: true },
      { key: 'xizmat_nomi',    label: 'Xizmat/ish tavsifi',      placeholder: "Veb-sayt dizayni, mobil ilova ishlab chiqish...", textarea: true },
      { key: 'narx',           label: "Shartnoma narxi (so'm)",  placeholder: '3 000 000' },
      { key: 'boshlanish_sana', label: 'Boshlanish sanasi',      placeholder: '', type: 'date' },
      { key: 'tugash_sana',    label: 'Tugash sanasi',           placeholder: '', type: 'date' },
      { key: 'tolov_tartibi',  label: "To'lov tartibi (ixtiyoriy)", placeholder: "Ish tugagach 5 kun ichida", optional: true },
    ],
  },
  {
    key: 'maxfiylik_shartnoma',
    category: 'shartnoma',
    icon: '🔒',
    title: 'Maxfiylik (NDA) shartnomasi',
    description: "Tijorat siri va maxfiy ma'lumotlarni muhofaza qilish uchun konfidensiallik shartnomasi",
    fields: [
      { key: 'xodim_ism', label: 'Xodim F.I.O.',        placeholder: 'Nazarov Dilshod Karimovich' },
      { key: 'passport',  label: 'Pasport seriya/raqam', placeholder: 'AB 1234567', optional: true },
      { key: 'lavozim',   label: 'Lavozim',              placeholder: 'Dasturchi' },
      { key: 'muddat',    label: 'Maxfiylik muddati',    placeholder: '3 yil' },
    ],
  },

  // ── Buyruqlar ──
  {
    key: 'buyruq_qabul',
    category: 'buyruq',
    icon: '📥',
    title: "Ishga qabul buyrug'i",
    description: "Xodimni ishga qabul qilish bo'yicha rasmiy buyruq",
    fields: [
      { key: 'xodim_ism',    label: 'Xodim F.I.O.',       placeholder: 'Umarov Sardor Bekovich' },
      { key: 'lavozim',      label: 'Lavozim',              placeholder: 'Bosh muhandis' },
      { key: 'bolim',        label: "Bo'lim (ixtiyoriy)",   placeholder: 'Ishlab chiqarish bo\'limi', optional: true },
      { key: 'maosh',        label: "Ish haqi (so'm)",      placeholder: '7 000 000' },
      { key: 'sana',         label: 'Qabul sanasi',         placeholder: '', type: 'date' },
      { key: 'sinov',        label: 'Sinov muddati (ixtiyoriy)', placeholder: '3 oylik', optional: true },
      { key: 'buyruq_raqam', label: "Buyruq raqami (ixtiyoriy)", placeholder: '14-k', optional: true },
    ],
  },
  {
    key: 'buyruq_boshtash',
    category: 'buyruq',
    icon: '📤',
    title: "Ishdan bo'shatish buyrug'i",
    description: "Xodimni ishdan bo'shatish bo'yicha rasmiy buyruq",
    fields: [
      { key: 'xodim_ism',    label: 'Xodim F.I.O.',         placeholder: 'Karimov Jasur Hamidovich' },
      { key: 'lavozim',      label: 'Lavozim',               placeholder: 'Menejer' },
      { key: 'bolim',        label: "Bo'lim (ixtiyoriy)",    placeholder: '', optional: true },
      { key: 'sana',         label: "Bo'shatish sanasi",     placeholder: '', type: 'date' },
      { key: 'sabab',        label: "Bo'shatish sababi",     placeholder: "O'z ixtiyori bilan (MK 99-moddasi)" },
      { key: 'mk_modda',     label: "MK moddasi (ixtiyoriy)", placeholder: '99', optional: true },
      { key: 'buyruq_raqam', label: "Buyruq raqami (ixtiyoriy)", placeholder: '23-k', optional: true },
    ],
  },
  {
    key: 'tatil_buyruq',
    category: 'buyruq',
    icon: '🏖️',
    title: "Ta'til buyrug'i",
    description: "Xodimga yillik asosiy yoki qo'shimcha ta'til berish buyrug'i",
    fields: [
      { key: 'xodim_ism',        label: 'Xodim F.I.O.',       placeholder: 'Usmonov Qodir Rustamovich' },
      { key: 'lavozim',          label: 'Lavozim',              placeholder: 'Buxgalter' },
      { key: 'bolim',            label: "Bo'lim (ixtiyoriy)",   placeholder: '', optional: true },
      { key: 'tatil_boshlanish', label: "Ta'til boshlanishi",  placeholder: '', type: 'date' },
      { key: 'tatil_tugash',     label: "Ta'til tugashi",      placeholder: '', type: 'date' },
      { key: 'kunlar_soni',      label: 'Ish kunlari soni',     placeholder: '15' },
      { key: 'tatil_turi',       label: "Ta'til turi (ixtiyoriy)", placeholder: "Asosiy yillik mehnat ta'tili", optional: true },
      { key: 'tatil_yil',        label: 'Hisobot yili (ixtiyoriy)', placeholder: String(new Date().getFullYear()), optional: true },
      { key: 'buyruq_raqam',     label: "Buyruq raqami (ixtiyoriy)", placeholder: '31-k', optional: true },
    ],
  },
  {
    key: 'buyruq_lavozim',
    category: 'buyruq',
    icon: '↕️',
    title: "Lavozim o'zgartirish buyrug'i",
    description: "Xodimni boshqa lavozimga yoki bo'limga o'tkazish buyrug'i",
    fields: [
      { key: 'xodim_ism',    label: 'Xodim F.I.O.',           placeholder: 'Mirzayev Bobur Aliyevich' },
      { key: 'eski_lavozim', label: 'Hozirgi lavozim',         placeholder: 'Kichik menejer' },
      { key: 'yangi_lavozim', label: 'Yangi lavozim',          placeholder: 'Katta menejer' },
      { key: 'yangi_bolim',  label: "Yangi bo'lim (ixtiyoriy)", placeholder: 'Savdo bo\'limi', optional: true },
      { key: 'yangi_maosh',  label: "Yangi ish haqi (so'm)",   placeholder: '8 000 000' },
      { key: 'sana',         label: "O'tkazish sanasi",        placeholder: '', type: 'date' },
      { key: 'sabab',        label: "O'tkazish sababi",        placeholder: "Xizmat ko'rsatganligi uchun ko'tarish" },
      { key: 'buyruq_raqam', label: "Buyruq raqami (ixtiyoriy)", placeholder: '18-k', optional: true },
    ],
  },
  {
    key: 'buyruq_mukofot',
    category: 'buyruq',
    icon: '🏆',
    title: "Mukofot berish buyrug'i",
    description: "Xodimga pul mukofoti yoki rag'bat berish buyrug'i",
    fields: [
      { key: 'xodim_ism',        label: 'Xodim F.I.O.',          placeholder: 'Qodirov Anvar Sobirovich' },
      { key: 'lavozim',          label: 'Lavozim',                placeholder: 'Savdo menejeri' },
      { key: 'mukofot_miqdori',  label: "Mukofot miqdori (so'm)", placeholder: '1 500 000' },
      { key: 'mukofot_turi',     label: "Mukofot turi (ixtiyoriy)", placeholder: 'Bir martalik pul mukofoti', optional: true },
      { key: 'sabab',            label: 'Mukofot sababi',         placeholder: "Rejani 150% bajaргani uchun" },
      { key: 'sana',             label: 'Buyruq sanasi',          placeholder: '', type: 'date' },
      { key: 'buyruq_raqam',     label: "Buyruq raqami (ixtiyoriy)", placeholder: '27-k', optional: true },
    ],
  },
  {
    key: 'buyruq_jazo',
    category: 'buyruq',
    icon: '⚠️',
    title: "Intizomiy jazo buyrug'i",
    description: "Xodimga hayfsan, qattiq hayfsan yoki boshqa intizomiy jazo qo'llash buyrug'i",
    fields: [
      { key: 'xodim_ism',            label: 'Xodim F.I.O.',          placeholder: 'Ergashev Timur Navruzovich' },
      { key: 'lavozim',              label: 'Lavozim',                placeholder: 'Ombor mudiri' },
      { key: 'bolim',                label: "Bo'lim (ixtiyoriy)",     placeholder: '', optional: true },
      { key: 'jazo_turi',            label: 'Jazo turi',              placeholder: "Hayfsan (ogoh qilish)" },
      { key: 'holat',                label: 'Qoidabuzarlik mohiyati', placeholder: "Ish joyida kech qolish — 2 marta, sana: ...", textarea: true },
      { key: 'qoidabuzarlik_sana',   label: "Qoidabuzarlik sanasi",  placeholder: '', type: 'date', optional: true },
      { key: 'tushuntirish_sana',    label: 'Tushuntirish xati sanasi', placeholder: '', type: 'date', optional: true },
      { key: 'sana',                 label: 'Buyruq sanasi',          placeholder: '', type: 'date' },
      { key: 'buyruq_raqam',         label: "Buyruq raqami (ixtiyoriy)", placeholder: '11-k', optional: true },
    ],
  },

  // ── Boshqa hujjatlar (AI) ──
  {
    key: 'ishonchnoma',
    category: 'boshqa',
    icon: '📜',
    title: 'Ishonchnoma',
    description: "Vakillik yoki maxsus huquq berish uchun ishonchnoma hujjati",
    useAI: true,
    apiType: 'ishonchnoma',
    resultField: 'ishonchnoma',
    fields: [
      { key: 'beruvchi_ism',    label: 'Ishonchnoma beruvchi',  placeholder: 'Toshmatov Alisher Baxtiyorovich' },
      { key: 'oluvchi_ism',     label: 'Ishonchnoma oluvchi',   placeholder: 'Nazarov Dilshod Karimovich' },
      { key: 'oluvchi_passport', label: "Oluvchi pasporti",     placeholder: 'AB 1234567' },
      { key: 'vakolat',         label: 'Vakolat mazmuni',       placeholder: "Bank hisobidan pul olish, shartnoma imzolash...", textarea: true },
      { key: 'muddat',          label: 'Amal qilish muddati',   placeholder: '1 yil' },
    ],
  },
  {
    key: 'lavozim_yoriqnoma',
    category: 'boshqa',
    icon: '📚',
    title: "Lavozim yo'riqnomasi",
    description: "Xodim lavozimi uchun to'liq huquq va majburiyatlar yo'riqnomasi",
    useAI: true,
    apiType: 'mehnat_shartnoma',
    resultField: 'shartnoma',
    fields: [
      { key: 'lavozim',          label: 'Lavozim nomi',           placeholder: 'Bosh muhasib' },
      { key: 'bolim',            label: "Bo'lim",                 placeholder: "Moliya bo'limi" },
      { key: 'asosiy_vazifalar', label: 'Asosiy vazifalar',       placeholder: "Hisobot tuzish, soliq hisobotlari, bank operatsiyalari...", textarea: true },
      { key: 'talablar',         label: "Talablar (ta'lim, tajriba)", placeholder: "Oliy iqtisodiy ta'lim, 3 yil tajriba...", textarea: true },
    ],
  },
]

// ── Category config ──────────────────────────────────────────────────────────
const CATS: { key: Category; label: string; icon: string }[] = [
  { key: 'shartnoma', label: 'Shartnomalar', icon: '📋' },
  { key: 'buyruq',    label: 'Buyruqlar',    icon: '📝' },
  { key: 'boshqa',    label: 'Boshqa hujjatlar', icon: '📁' },
]

// ── Main component ───────────────────────────────────────────────────────────
export default function KadrlarPage() {
  const { activeOrg, isFree } = useDashboard()
  const [activeCat, setActiveCat] = useState<Category>('shartnoma')
  const [selected, setSelected] = useState<KadrFeature | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [mehnatTur, setMehnatTur] = useState('belgilanmagan_muddatli')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [savedKey, setSavedKey] = useState(0)

  const currentFeature = FEATURES.find(f => f.key === selected)

  function selectFeature(key: KadrFeature) {
    setSelected(key)
    setFormData({})
    setResult(null)
    setError('')
    setCopied(false)
    setShowPreview(false)
    setMehnatTur('belgilanmagan_muddatli')
  }

  function goBack() {
    setSelected(null)
    setResult(null)
    setError('')
  }

  // ── Generate ──────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!currentFeature || !activeOrg) {
      setError(!activeOrg ? "Avval tashkilot tanlang!" : ""); return
    }
    setLoading(true); setError(''); setResult(null)

    try {
      let text = ''
      const org = { name: activeOrg.name, inn: activeOrg.inn, director_name: activeOrg.director_name }

      if (!currentFeature.useAI) {
        // ── Template-based (no AI) ──
        switch (selected) {
          case 'mehnat_shartnoma':      text = tplMehnatShartnoma(formData, org, mehnatTur); break
          case 'orindoshlik_shartnoma': text = tplOrindoshlik(formData, org); break
          case 'fuqaroviy_shartnoma':   text = tplFuqaroviy(formData, org); break
          case 'maxfiylik_shartnoma':   text = tplMaxfiylik(formData, org); break
          case 'buyruq_qabul':          text = tplBuyruqQabul(formData, org); break
          case 'buyruq_boshtash':       text = tplBuyruqBoshtash(formData, org); break
          case 'tatil_buyruq':          text = tplTatilBuyruq(formData, org); break
          case 'buyruq_lavozim':        text = tplBuyruqLavozim(formData, org); break
          case 'buyruq_mukofot':        text = tplBuyruqMukofot(formData, org); break
          case 'buyruq_jazo':           text = tplBuyruqJazo(formData, org); break
          default: text = ''
        }
      } else {
        // ── AI-based ──
        const buyruqTur = selected === 'buyruq_qabul' ? 'qabul'
          : selected === 'buyruq_boshtash' ? 'boshtash'
          : selected === 'tatil_buyruq' ? 'tatil'
          : undefined
        const res = await fetchAi({
          type: currentFeature.apiType!,
          lang: 'uz',
          details: {
            ...formData,
            tashkilot: activeOrg.name,
            tashkilot_inn: activeOrg.inn,
            direktor: activeOrg.director_name,
            ...(buyruqTur ? { buyruq_tur: buyruqTur } : {}),
          },
        })
        const data = await res.json()
        if (data.error) { setError(data.error); return }
        text = data.result?.[currentFeature.resultField!]
          || data.result?.shartnoma || data.result?.ishonchnoma
          || JSON.stringify(data.result, null, 2)
      }

      setResult(text)

      // Auto-save
      if (text && activeOrg) {
        const meta: Record<string, string> = {}
        if (selected === 'mehnat_shartnoma') meta.contract_type = mehnatTur
        const xodimNomi = formData.xodim_ism || formData.ijrochi_ism || ''
        const docTitle = xodimNomi
          ? `${currentFeature.title} — ${xodimNomi}`
          : currentFeature.title
        saveAiDocument({
          organization_id: activeOrg.id,
          section: 'kadrlar',
          feature_key: selected!,
          title: docTitle,
          content: text,
          meta,
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
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const inp = 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-gray-500'

  const catFeatures = FEATURES.filter(f => f.category === activeCat)

  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-950">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 bg-cyan-900/50 rounded-xl flex items-center justify-center text-xl">👥</span>
            Kadrlar hujjatlari
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Shartnomalar, buyruqlar va boshqa kadrlar hujjatlarini avtomatik tayyorlang
          </p>
        </div>

        {isFree && (
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4 flex items-center gap-3">
            <span className="text-xl">⭐</span>
            <div className="flex-1 text-sm text-yellow-300">Bu funksiyalar Premium tarifda to&apos;liq ishlaydi.</div>
          </div>
        )}

        {/* Feature selection */}
        {!selected && (
          <div className="space-y-4">
            {/* Category tabs */}
            <div className="flex gap-2">
              {CATS.map(cat => (
                <button key={cat.key} onClick={() => setActiveCat(cat.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeCat === cat.key
                      ? 'bg-cyan-700 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}>
                  {cat.icon} {cat.label}
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeCat === cat.key ? 'bg-cyan-600 text-cyan-100' : 'bg-gray-700 text-gray-500'}`}>
                    {FEATURES.filter(f => f.category === cat.key).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catFeatures.map(feature => (
                <button key={feature.key} onClick={() => selectFeature(feature.key)}
                  className="bg-gray-900 border border-gray-800 hover:border-cyan-700/60 hover:bg-gray-800/80 rounded-xl p-5 text-left transition group">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <div className="font-semibold text-white text-sm mb-1 group-hover:text-cyan-300 transition">
                    {feature.title}
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">{feature.description}</div>
                  {!feature.useAI && (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">
                      ⚡ Shablon asosida — tez
                    </div>
                  )}
                  {feature.useAI && (
                    <div className="mt-3 inline-flex items-center gap-1 text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full">
                      🤖 AI yordamida
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        {selected && currentFeature && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            {/* Back + title */}
            <div className="flex items-center gap-3">
              <button onClick={goBack}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
                ← Orqaga
              </button>
              <div className="w-px h-4 bg-gray-700"/>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentFeature.icon}</span>
                <h2 className="font-semibold text-white">{currentFeature.title}</h2>
              </div>
              {!currentFeature.useAI && (
                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">⚡ Shablon</span>
              )}
            </div>

            {/* Mehnat shartnomasi type selector */}
            {selected === 'mehnat_shartnoma' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Shartnoma turi</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {MEHNAT_TURLARI.map(t => (
                    <button key={t.key} onClick={() => setMehnatTur(t.key)}
                      className={`px-3 py-2.5 rounded-lg border text-sm text-left transition ${
                        mehnatTur === t.key
                          ? 'border-cyan-500 bg-cyan-900/30 text-cyan-300'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentFeature.fields
                .filter(field => {
                  // hide tugash_sana for mehnat if not muddatli
                  if (selected === 'mehnat_shartnoma' && field.key === 'tugash_sana' && mehnatTur !== 'belgilangan_muddatli') return false
                  return true
                })
                .map(field => (
                  <div key={field.key} className={field.textarea ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      {field.label}
                      {field.optional && <span className="text-gray-600 ml-1">(ixtiyoriy)</span>}
                    </label>
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

            {/* Org info */}
            {activeOrg && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-400">
                Tashkilot: <span className="text-white font-medium">{activeOrg.name}</span>
                {' '}· INN: {activeOrg.inn}
                {' '}· Direktor: {activeOrg.director_name}
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-sm text-red-300">
                ⚠ {error}
              </div>
            )}

            <button onClick={handleGenerate} disabled={loading}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>Tayyorlanmoqda…</>
              ) : currentFeature.useAI
                ? <>🤖 AI bilan tayyorlash</>
                : <>⚡ Hujjat tayyorlash</>
              }
            </button>

            {/* Preview modal */}
            {showPreview && result && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                onClick={() => setShowPreview(false)}>
                <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col"
                  onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                    <h3 className="font-semibold text-white">👁 {currentFeature?.title}</h3>
                    <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-white text-gray-900 rounded-xl p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                      {result}
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t border-gray-800 flex gap-3">
                    <button onClick={() => { downloadTextAsWord(result, currentFeature?.title || 'hujjat'); setShowPreview(false) }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                      📝 Word
                    </button>
                    <button onClick={() => { downloadTextAsPDF(result, currentFeature?.title || 'hujjat'); setShowPreview(false) }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl text-sm transition">
                      📄 PDF
                    </button>
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
                      className="flex items-center gap-1.5 text-xs bg-purple-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg transition">
                      👁 Ko&apos;rish
                    </button>
                    <button onClick={() => downloadTextAsWord(result, currentFeature?.title || 'hujjat')}
                      className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold transition">
                      📝 Word
                    </button>
                    <button onClick={() => downloadTextAsPDF(result, currentFeature?.title || 'hujjat')}
                      className="flex items-center gap-1.5 text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition">
                      📄 PDF
                    </button>
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

        {/* Saved documents */}
        {activeOrg && (
          <SavedDocumentsPanel orgId={activeOrg.id} section="kadrlar" accentColor="cyan" refreshKey={savedKey} />
        )}
      </div>
    </main>
  )
}
