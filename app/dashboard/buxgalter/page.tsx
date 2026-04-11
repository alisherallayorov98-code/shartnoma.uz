'use client'

import { useState, useRef, useEffect } from 'react'
import { useDashboard } from '../context'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { fetchAi } from '@/lib/fetchAi'
import { saveAiDocument } from '@/lib/aiDocuments'
import dynamic from 'next/dynamic'
import SavedDocumentsPanel from '../_components/SavedDocumentsPanel'
import HujjatResult from '../_components/HujjatResult'
const TolovGrafigi   = dynamic(() => import('./_components/TolovGrafigi'),   { ssr: false })
const FakturaBuilder = dynamic(() => import('./_components/FakturaBuilder'), { ssr: false })
const AktSverki      = dynamic(() => import('./_components/AktSverki'),      { ssr: false })

type BuxFeature =
  | 'dalolatnoma' | 'talabnoma' | 'debitor_undirish'
  | 'akt_sverki' | 'avans_hisobot' | 'xarajat_hisobot' | 'jarima_hisobi'
  | 'tolov_grafigi_calc' | 'faktura_builder'

type FieldDef = { key: string; label: string; placeholder: string; type?: string; isCpField?: boolean; isContractField?: boolean; isSelect?: boolean; options?: { value: string; label: string }[]; hint?: string }

type FeatureConfig = {
  key: BuxFeature
  icon: string
  title: string
  description: string
  isCustom?: true
  fields?: FieldDef[]
  apiType?: string
  resultField?: string
}

const FEATURES: FeatureConfig[] = [
  {
    key: 'dalolatnoma',
    icon: '✅',
    title: 'Dalolatnoma',
    description: "Ish/xizmat bajarilganligi to'g'risida rasmiy dalolatnoma",
    apiType: 'dalolatnoma',
    resultField: 'dalolatnoma',
    fields: [
      { key: 'kontragentar_ism', label: "Buyurtmachi (kontragent)", placeholder: "Raqamli Texnologiyalar MChJ", isCpField: true },
      { key: 'shartnoma_raqam', label: "Shartnoma tanlash / raqami", placeholder: "2025/03-15", isContractField: true },
      { key: 'xizmat_turi', label: "Bajarilgan xizmat/ish turi", placeholder: "Dasturiy ta'minot ishlab chiqish xizmati" },
      { key: 'summa', label: "Summa (so'm)", placeholder: "15 000 000" },
      { key: 'sana', label: "Dalolatnoma sanasi", placeholder: "2025-03-20", type: 'date' },
    ],
  },
  {
    key: 'talabnoma',
    icon: '📨',
    title: 'Qarz talabnomasi',
    description: "Qarzdorga O'zR FK 327-328-moddalari asosida rasmiy pretenziya",
    apiType: 'talabnoma',
    resultField: 'talabnoma',
    fields: [
      { key: 'qarzdor', label: "Qarzdor tashkilot", placeholder: "ABC Savdo MChJ", isCpField: true },
      { key: 'shartnoma_raqam', label: "Shartnoma tanlash / raqami", placeholder: "2024/08-01", isContractField: true },
      { key: 'qarz_summasi', label: "Qarz summasi (so'm)", placeholder: "50 000 000" },
      { key: 'muddat_utgan', label: "Muddati o'tgan kunlar soni", placeholder: "45" },
      { key: 'jarima_foiz', label: "Kunlik jarima foizi (%)", placeholder: "0.1", hint: "FK 350-mod.: 0.05%–0.5% oralig'ida" },
      { key: 'oxirgi_muhlat', label: "Javob berish muhlati (ish kuni)", placeholder: "10" },
    ],
  },
  {
    key: 'debitor_undirish',
    icon: '⚖️',
    title: 'Debitor undirish xati',
    description: "Debitor qarzni sudgacha undirish uchun rasmiy ogohlantirish xati",
    apiType: 'talabnoma',
    resultField: 'talabnoma',
    fields: [
      { key: 'qarzdor', label: "Qarzdor korxona", placeholder: "Yulduz Savdo AJ", isCpField: true },
      { key: 'shartnoma_raqam', label: "Shartnoma tanlash / raqami", placeholder: "2025/01-05", isContractField: true },
      { key: 'qarz_summasi', label: "Qarz summasi (so'm)", placeholder: "80 000 000" },
      { key: 'qarz_sababi', label: "Qarz sababi/asosi", placeholder: "Tovarlar yetkazib berilgan, shartnoma 2025/01-05 bo'yicha to'lov kechiktirilgan" },
      { key: 'oxirgi_muhlat', label: "Oxirgi to'lov muhlati", placeholder: "2025-05-01", type: 'date' },
      { key: 'sudga_murojaat', label: "Sud ogohlantirish", placeholder: "Ha", isSelect: true, options: [{ value: 'Ha', label: "Ha — sud ogohlantirishini kiritish" }, { value: "Yo'q", label: "Yo'q — oddiy talab xati" }] },
    ],
  },
  {
    key: 'akt_sverki',
    icon: '🔄',
    title: 'Akt sverki',
    description: "Kontragent bilan o'zaro hisob-kitoblarni tekshirish akti (BHMS asosida)",
    isCustom: true,
  },
  {
    key: 'avans_hisobot',
    icon: '🧾',
    title: 'Avans hisoboti',
    description: "Xodim avans sarfini rasmiylashtirish (AV-3 shakl asosida)",
    apiType: 'avans_hisobot',
    resultField: 'avans_hisobot',
    fields: [
      { key: 'xodim_ism', label: "Xodim ismi", placeholder: "Aliyev Bobur Xasanovich" },
      { key: 'lavozim', label: "Lavozimi", placeholder: "Menejer" },
      { key: 'bolim', label: "Bo'limi", placeholder: "Savdo bo'limi" },
      { key: 'avans_maqsad', label: "Avans maqsadi", placeholder: "Xizmat safariga, mahsulot sotib olishga" },
      { key: 'avans_miqdori', label: "Berilgan avans (so'm)", placeholder: "2 000 000" },
      { key: 'avans_sana', label: "Avans berilgan sana", placeholder: "2025-04-01", type: 'date' },
      { key: 'sarflangan', label: "Haqiqatda sarflangan (so'm)", placeholder: "1 750 000" },
      { key: 'hisobot_sana', label: "Hisobot sanasi", placeholder: "2025-04-15", type: 'date' },
      { key: 'xarajatlar', label: "Xarajatlar tafsiloti", placeholder: "Transport: 300 000, mehmonxona: 900 000, ovqat: 550 000" },
    ],
  },
  {
    key: 'xarajat_hisobot',
    icon: '📊',
    title: 'Xarajat hisoboti',
    description: "Davr xarajatlarini rasmiylashtirish va soliq tasnifi (Soliq kodeksi 305-321-mod.)",
    apiType: 'xarajat_hisobot',
    resultField: 'xarajat_hisobot',
    fields: [
      { key: 'davr', label: "Hisobot davri", placeholder: "2025-yil I chorak (01.01–31.03)" },
      { key: 'xarajat_turi', label: "Xarajat turi", placeholder: "Operatsion xarajatlar / Kapital xarajatlar" },
      { key: 'jami_xarajat', label: "Jami xarajat (so'm)", placeholder: "85 000 000" },
      { key: 'xarajat_tafsilot', label: "Xarajatlar tafsiloti", placeholder: "Ijara: 10M, ish haqi: 45M, kommunal: 8M, material: 22M" },
      { key: 'mas_ul', label: "Mas'ul xodim", placeholder: "Bosh buxgalter Toshmatova G." },
      { key: 'maqsad', label: "Hisobot maqsadi", placeholder: "Choraklik moliyaviy hisobot uchun" },
    ],
  },
  {
    key: 'jarima_hisobi',
    icon: '⚠️',
    title: 'Jarima/peni hisobi',
    description: "Kechiktirilgan to'lov uchun peni hisob-kitob varaqasi (FK 350-mod.)",
    apiType: 'jarima_hisobi',
    resultField: 'jarima_hisobi',
    fields: [
      { key: 'qarzdor', label: "Qarzdor tashkilot", placeholder: "Beta Qurilish MChJ", isCpField: true },
      { key: 'shartnoma_raqam', label: "Shartnoma tanlash / raqami", placeholder: "2024/11-22", isContractField: true },
      { key: 'shartnoma_sana', label: "Shartnoma sanasi", placeholder: "2024-11-22", type: 'date' },
      { key: 'shartnoma_band', label: "Jarima belgilangan band", placeholder: "6.3" },
      { key: 'qarz_summasi', label: "Asosiy qarz (so'm)", placeholder: "35 000 000" },
      { key: 'tolov_muddat', label: "To'lov muddati (shartnoma bo'yicha)", placeholder: "2025-01-15" },
      { key: 'hisoblash_sana', label: "Peni hisoblash sanasi (bugun)", placeholder: "2025-04-10", type: 'date' },
      { key: 'kechikish_kun', label: "Kechikish kunlari (avtomatik hisoblanadi)", placeholder: "84", hint: "To'lov muddati bilan hisoblash sanasi orasidagi kunlar" },
      { key: 'jarima_foiz', label: "Kunlik jarima foizi (%)", placeholder: "0.1" },
      { key: 'oxirgi_muddat', label: "Javob berish muhlati (ish kuni)", placeholder: "10" },
    ],
  },
  {
    key: 'tolov_grafigi_calc',
    icon: '📅',
    title: "To'lov grafigi",
    description: "Foiz/foizsiz, annuitet/kamayuvchi — aniq jadval va Word yuklab olish",
    isCustom: true,
  },
  {
    key: 'faktura_builder',
    icon: '🧾',
    title: 'Faktura tuzish',
    description: "Ko'p qatorli schyot-faktura, QQS hisob-kitob, Word yuklab olish",
    isCustom: true,
  },
]

export default function BuxgalterPage() {
  const { activeOrg, hasAiAccess, isFree, contracts, cps, openUpgradeModal } = useDashboard()
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
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
  const [contractSearch, setContractSearch] = useState('')
  const [contractOpen, setContractOpen] = useState(false)
  const contractDropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cpDropRef.current && !cpDropRef.current.contains(e.target as Node)) setCpOpen(null)
      if (contractDropRef.current && !contractDropRef.current.contains(e.target as Node)) setContractOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const orgContracts = contracts.filter(c => c.organization_id === activeOrg?.id)

  function selectContract(c: typeof contracts[0]) {
    if (!currentFeature?.fields) return
    const fieldKeys = currentFeature.fields.map(f => f.key)
    const patch: Record<string, string> = { shartnoma_raqam: c.contract_number }
    if (c.contract_date) patch.shartnoma_sana = c.contract_date
    const cpName = c.counterparties?.name || ''
    if (cpName) {
      if (fieldKeys.includes('qarzdor')) patch.qarzdor = cpName
      if (fieldKeys.includes('kontragent')) patch.kontragent = cpName
      if (fieldKeys.includes('kontragentar_ism')) patch.kontragentar_ism = cpName
    }
    if (c.amount) {
      if (fieldKeys.includes('summa')) patch.summa = String(c.amount)
      if (fieldKeys.includes('qarz_summasi')) patch.qarz_summasi = String(c.amount)
    }
    setFormData(prev => ({ ...prev, ...patch }))
    setContractOpen(false)
    setContractSearch('')
  }

  const currentFeature = FEATURES.find(f => f.key === selected)

  function selectFeature(key: BuxFeature) {
    setSelected(key)
    setFormData({})
    setResult(null)
    setError('')
    setCopied(false)
  }

  function updateFormData(patch: Record<string, string>) {
    setFormData(prev => {
      const next = { ...prev, ...patch }
      // Auto-calc kechikish_kun for jarima_hisobi
      if (selected === 'jarima_hisobi') {
        const muddat = next.tolov_muddat || prev.tolov_muddat
        const hisob = next.hisoblash_sana || prev.hisoblash_sana
        if (muddat && hisob) {
          const d1 = new Date(muddat)
          const d2 = new Date(hisob)
          const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000)
          if (!isNaN(diff) && diff >= 0) next.kechikish_kun = String(diff)
        }
      }
      return next
    })
  }

  async function handleGenerate() {
    if (!currentFeature || currentFeature.isCustom) return
    if (!activeOrg) { setError("Avval tashkilot tanlang!"); return }
    if (isFree) { openUpgradeModal(); return }
    if (!hasAiAccess()) { openUpgradeModal(); return }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetchAi({
        type: currentFeature.apiType!,
        lang: 'uz',
        details: {
          ...formData,
          tashkilot: activeOrg.name,
          tashkilot_inn: activeOrg.inn,
          direktor: activeOrg.director_name,
          bank_name: activeOrg.bank_name,
          bank_account: activeOrg.bank_account,
          mfo: activeOrg.mfo,
          tashkilot_manzil: activeOrg.address || '',
        },
      })

      const data = await res.json()
      if (data.error === 'premium_required') { openUpgradeModal(); return }
      if (data.error) { setError(data.error); return }

      const text = data.result?.[currentFeature.resultField!]
        || data.result?.dalolatnoma || data.result?.talabnoma || data.result?.faktura
        || data.result?.akt_sverki || data.result?.avans_hisobot || data.result?.xarajat_hisobot || data.result?.jarima_hisobi
        || JSON.stringify(data.result, null, 2)
      setResult(text)

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
            {T(t.nav.buxgalter)}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{T({ uz: 'Bosh hisobchi darajasida moliyaviy hujjatlar — AI va avtomatik kalkulyator', oz: 'Бош ҳисобчи даражасида молиявий ҳужжатлар — AI ва автоматик калькулятор', ru: 'Финансовые документы на уровне главного бухгалтера — AI и автокалькулятор' })}</p>
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
                <div className="text-xs text-gray-500 mt-1">{T(t.overviewTab.totalContracts)}</div>
              </div>
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{activeContracts.length}</div>
                <div className="text-xs text-gray-500 mt-1">{T(t.overview.activeContracts)}</div>
              </div>
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{(activeSum / 1_000_000).toFixed(1)}M</div>
                <div className="text-xs text-gray-500 mt-1">{T(t.overviewTab.activeSum)}</div>
              </div>
            </div>
          )
        })()}

        {isFree && (
          <div className="bg-orange-600/10 border border-orange-600/30 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-white text-sm font-semibold mb-0.5">{T(t.aiPage.subRequired)}</div>
              <div className="text-gray-400 text-xs">{T({ uz: 'Buxgalteriya hujjatlarini yaratish Standart yoki AI Pro tarifida ishlaydi', oz: 'Бухгалтерия ҳужжатларини яратиш Стандарт ёки AI Pro тарифида ишлайди', ru: 'Создание бухгалтерских документов — тарифы Стандарт или AI Pro' })}</div>
            </div>
            <button onClick={openUpgradeModal}
              className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
              {T(t.aiPage.getSubBtn)}
            </button>
          </div>
        )}
        {!isFree && !hasAiAccess() && (
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-white text-sm font-semibold mb-0.5">{T(t.aiPage.aiProTitle)}</div>
              <div className="text-gray-400 text-xs">{T({ uz: 'Ba\'zi AI funksiyalar faqat AI Pro tarifida ishlaydi', oz: 'Баъзи AI функциялар фақат AI Pro тарифида ишлайди', ru: 'Некоторые AI функции работают только в тарифе AI Pro' })}</div>
            </div>
            <button onClick={openUpgradeModal}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
              {T(t.aiPage.getAiProBtn)}
            </button>
          </div>
        )}

        {/* Feature cards */}
        {!selected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(feature => (
              <button key={feature.key} onClick={() => selectFeature(feature.key)}
                className="bg-[#111827] border border-[#1E293B] hover:border-blue-600/50 hover:bg-[#1F2937] rounded-xl p-5 text-left transition group relative">
                {feature.isCustom && (
                  <span className="absolute top-3 right-3 text-[10px] bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded px-1.5 py-0.5">{T({ uz: 'Kalkulyator', oz: 'Калькулятор', ru: 'Калькулятор' })}</span>
                )}
                <div className="text-3xl mb-3">{feature.icon}</div>
                <div className="font-semibold text-white text-sm mb-1 group-hover:text-blue-400 transition">{feature.title}</div>
                <div className="text-xs text-gray-500">{feature.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Detail view */}
        {selected && currentFeature && (
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => { setSelected(null); setResult(null); setError('') }}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
                {T(t.aiPage.back)}
              </button>
              <div className="w-px h-4 bg-[#1E293B]"/>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentFeature.icon}</span>
                <h2 className="font-semibold text-white">{currentFeature.title}</h2>
              </div>
            </div>

            {/* Custom components */}
            {currentFeature.isCustom && selected === 'tolov_grafigi_calc' && (
              <TolovGrafigi org={activeOrg} cps={cps} />
            )}
            {currentFeature.isCustom && selected === 'faktura_builder' && (
              <FakturaBuilder org={activeOrg} cps={cps} contracts={contracts.filter(c => c.organization_id === activeOrg?.id)} />
            )}
            {currentFeature.isCustom && selected === 'akt_sverki' && (
              <AktSverki org={activeOrg} cps={cps} contracts={contracts.filter(c => c.organization_id === activeOrg?.id)} />
            )}

            {/* AI form */}
            {!currentFeature.isCustom && currentFeature.fields && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" ref={cpDropRef}>
                  {currentFeature.fields.map(field => {
                    if (field.isContractField) {
                      // Find selected counterparty value from any cp field in this feature
                      const cpFieldKeys = ['qarzdor', 'kontragent', 'kontragentar_ism']
                      const selectedCp = cpFieldKeys.map(k => formData[k]).find(v => v) || ''
                      const search = contractSearch.toLowerCase()
                      const filtered = orgContracts.filter(c => {
                        const cpName = (c.counterparties?.name || '').toLowerCase()
                        // Filter by selected counterparty if one is chosen
                        if (selectedCp && !cpName.includes(selectedCp.toLowerCase())) return false
                        // Then filter by search text
                        return !search || c.contract_number.toLowerCase().includes(search) || cpName.includes(search)
                      }).slice(0, 10)
                      const selected = formData['shartnoma_raqam']
                      return (
                        <div key={field.key} className="relative sm:col-span-2" ref={contractDropRef}>
                          <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                          <input
                            type="text"
                            value={contractOpen ? contractSearch : (selected || '')}
                            onFocus={() => { setContractOpen(true); setContractSearch(selected || '') }}
                            onChange={e => { setContractSearch(e.target.value); setFormData(p => ({ ...p, shartnoma_raqam: e.target.value })); setContractOpen(true) }}
                            placeholder={selectedCp && orgContracts.some(c => (c.counterparties?.name || '').toLowerCase().includes(selectedCp.toLowerCase())) ? `${selectedCp} ${T({ uz: 'shartnomalaridan tanlang...', oz: 'шартномаларидан танланг...', ru: 'из договоров выберите...' })}` : orgContracts.length ? T({ uz: "Shartnoma raqami kiriting yoki ro'yxatdan tanlang...", oz: "Шартнома рақами киритинг ёки рўйхатдан танланг...", ru: "Введите номер договора или выберите из списка..." }) : field.placeholder}
                            className={inp + ' pr-8'}
                            autoComplete="off"
                          />
                          {selected && !contractOpen && (
                            <button type="button" onClick={() => { setFormData(p => ({ ...p, shartnoma_raqam: '' })); setContractSearch('') }}
                              className="absolute right-2.5 top-[30px] text-gray-500 hover:text-gray-300 text-xs">✕</button>
                          )}
                          {contractOpen && filtered.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                              {filtered.map(c => (
                                <button key={c.id} type="button" onMouseDown={() => selectContract(c)}
                                  className="w-full text-left px-3 py-2.5 hover:bg-[#1F2937] transition border-b border-[#1E293B] last:border-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white">№ {c.contract_number}</span>
                                    <span className="text-xs text-gray-500">{c.contract_date}</span>
                                    {c.status === 'active' && <span className="text-[10px] bg-emerald-600/20 text-emerald-400 rounded px-1">{T({ uz: 'faol', oz: 'фаол', ru: 'активн.' })}</span>}
                                  </div>
                                  {c.counterparties?.name && <div className="text-xs text-gray-400 mt-0.5">{c.counterparties.name}</div>}
                                  {c.amount ? <div className="text-xs text-blue-400/70">{Number(c.amount).toLocaleString('uz-UZ')} {T({ uz: "so'm", oz: "сўм", ru: "сум" })}</div> : null}
                                </button>
                              ))}
                            </div>
                          )}
                          {contractOpen && filtered.length === 0 && contractSearch && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-gray-500">
                              {T({ uz: "Topilmadi — qo'lda kiriting", oz: 'Топилмади — қўлда киритинг', ru: 'Не найдено — введите вручную' })}
                            </div>
                          )}
                        </div>
                      )
                    }
                    if (field.isSelect) {
                      return (
                        <div key={field.key}>
                          <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                          <select value={formData[field.key] || (field.options?.[0]?.value || '')}
                            onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                            className={inp}>
                            {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      )
                    }
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
                          {field.hint && <div className="text-xs text-gray-600 mt-0.5">{field.hint}</div>}
                        </div>
                      )
                    }
                    return (
                      <div key={field.key}>
                        <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                        <input
                          type={field.type || 'text'}
                          value={formData[field.key] || ''}
                          onChange={e => updateFormData({ [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          className={inp}
                        />
                        {field.hint && <div className="text-xs text-gray-600 mt-0.5">{field.hint}</div>}
                      </div>
                    )
                  })}
                </div>

                {activeOrg && (
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-gray-400">
                    {T({ uz: 'Tashkilot', oz: 'Ташкилот', ru: 'Организация' })}: <span className="text-white font-medium">{activeOrg.name}</span>
                    {activeOrg.bank_name && <> · {T({ uz: 'Bank', oz: 'Банк', ru: 'Банк' })}: {activeOrg.bank_name}</>}
                    {activeOrg.bank_account && <> · {T({ uz: 'H/R', oz: 'Ҳ/Р', ru: 'Р/С' })}: {activeOrg.bank_account}</>}
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
                    </svg>{T(t.aiPage.preparing)}</>
                  ) : <>{T(t.aiPage.generateAi)}</>}
                </button>

                {result && (
                  <HujjatResult
                    result={result}
                    title={currentFeature?.title || 'hujjat'}
                    copied={copied}
                    onCopy={handleCopy}
                  />
                )}
              </>
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
