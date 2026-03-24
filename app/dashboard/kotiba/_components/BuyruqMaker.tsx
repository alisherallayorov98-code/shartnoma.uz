'use client'

import { useState } from 'react'
import { downloadTextAsPDF, downloadTextAsWord } from '@/lib/downloadUtils'
import {
  BUYRUQ_TYPES, BuyruqType, BuyruqFields, generateBuyruq
} from '../buyruqTemplates'

const FIELDS: Record<BuyruqType, { key: string; label: string; placeholder: string; textarea?: boolean; type?: string }[]> = {
  av_sotib_olish: [
    { key: 'raqam',       label: 'Buyruq raqami',       placeholder: '12' },
    { key: 'sana',        label: 'Sana',                 placeholder: '', type: 'date' },
    { key: 'shahar',      label: 'Shahar',               placeholder: 'Toshkent' },
    { key: 'vosita_nomi', label: 'Asosiy vosita nomi',   placeholder: 'Toyota Camry 2024, Yuk avtomobili, Kompressor' },
    { key: 'model',       label: 'Markasi/modeli',       placeholder: 'Toyota Camry 3.5' },
    { key: 'miqdor',      label: 'Miqdori',              placeholder: '1 dona' },
    { key: 'narxi',       label: 'Taxminiy qiymati (so\'m)', placeholder: '250 000 000' },
    { key: 'manbaa',      label: 'Moliyalashtirish manbai', placeholder: 'tashkilot aylanma mablag\'laridan' },
    { key: 'mas_ul',      label: 'Mas\'ul shaxs (ism, lavozim)', placeholder: 'Karimov A. — xo\'jalik bo\'limi boshlig\'i' },
    { key: 'buxgalter',   label: 'Buxgalter (ixtiyoriy)', placeholder: 'bosh buxgalter' },
    { key: 'nazoratchi',  label: 'Nazoratchi (ixtiyoriy)', placeholder: 'Direktor o\'rinbosari' },
    { key: 'asos',        label: 'Buyruq asosi',         placeholder: 'tashkilot ishlab chiqarish ehtiyojlaridan kelib chiqib' },
    { key: 'direktor_lavozim', label: 'Rahbar lavozimi', placeholder: 'Direktor' },
  ],
  av_sotish: [
    { key: 'raqam',          label: 'Buyruq raqami',     placeholder: '13' },
    { key: 'sana',           label: 'Sana',              placeholder: '', type: 'date' },
    { key: 'shahar',         label: 'Shahar',            placeholder: 'Toshkent' },
    { key: 'vosita_nomi',    label: 'Asosiy vosita nomi', placeholder: 'GAZ 3302 yuk avtomobili' },
    { key: 'inventar_raqam', label: 'Inventar raqami',   placeholder: 'OA-00245' },
    { key: 'balans_qiymati', label: 'Balans qiymati (so\'m)', placeholder: '45 000 000' },
    { key: 'sotish_narxi',   label: 'Sotish narxi (so\'m)', placeholder: '38 000 000' },
    { key: 'xaridor',        label: 'Xaridor',           placeholder: '"Alpha Savdo" MChJ' },
    { key: 'buxgalter',      label: 'Buxgalter (ixtiyoriy)', placeholder: 'bosh buxgalter' },
    { key: 'nazoratchi',     label: 'Nazoratchi (ixtiyoriy)', placeholder: 'Direktor o\'rinbosari' },
    { key: 'asos',           label: 'Buyruq asosi',      placeholder: 'texnik holat xulosasi va tashkilot zaruriyatidan kelib chiqib' },
    { key: 'direktor_lavozim', label: 'Rahbar lavozimi', placeholder: 'Direktor' },
  ],
  av_hisobdan_chiqarish: [
    { key: 'raqam',           label: 'Buyruq raqami',     placeholder: '14' },
    { key: 'sana',            label: 'Sana',              placeholder: '', type: 'date' },
    { key: 'shahar',          label: 'Shahar',            placeholder: 'Toshkent' },
    { key: 'vosita_nomi',     label: 'Asosiy vosita nomi', placeholder: 'Kompressor "Abac B7000"' },
    { key: 'inventar_raqam',  label: 'Inventar raqami',   placeholder: 'OA-00112' },
    { key: 'dastlabki_qiymat',label: 'Dastlabki qiymati (so\'m)', placeholder: '18 000 000' },
    { key: 'eskirish',        label: 'Eskirish foizi (%)', placeholder: '100' },
    { key: 'qoldiq_qiymat',   label: 'Qoldiq qiymati (so\'m)', placeholder: '0' },
    { key: 'sabab',           label: 'Hisobdan chiqarish sababi', placeholder: 'to\'la jismoniy va ma\'naviy eskirishi, ta\'mirlanishi mumkin emas' },
    { key: 'komissiya_xulosa',label: 'Komissiya xulosasi', placeholder: 'komissiya xulosasi va texnik ekspertiza dalolatnomasi' },
    { key: 'buxgalter',       label: 'Buxgalter (ixtiyoriy)', placeholder: 'bosh buxgalter' },
    { key: 'nazoratchi',      label: 'Nazoratchi (ixtiyoriy)', placeholder: 'Direktor o\'rinbosari' },
    { key: 'direktor_lavozim',label: 'Rahbar lavozimi', placeholder: 'Direktor' },
  ],
  komissiya_tuzish: [
    { key: 'raqam',    label: 'Buyruq raqami',   placeholder: '15' },
    { key: 'sana',     label: 'Sana',            placeholder: '', type: 'date' },
    { key: 'shahar',   label: 'Shahar',          placeholder: 'Toshkent' },
    { key: 'maqsad',   label: 'Komissiya maqsadi', placeholder: 'Asosiy vositalarni qabul-topshirish / Texnik holat tekshiruvi / Inventarizatsiya' },
    { key: 'rais',     label: 'Komissiya raisi', placeholder: 'Rahimov B. — texnik direktor' },
    { key: 'azolar',   label: 'A\'zolar (har bir qatorga bitta)', placeholder: 'Karimova N. — bosh buxgalter\nUsmonov J. — yurist\nToshmatov A. — muhandis', textarea: true },
    { key: 'vazifalar',label: 'Komissiya vazifalari', placeholder: '– Mol-mulkni ko\'zdan kechirish va baholash;\n– Texnik holat xulosasini tuzish;\n– Dalolatnoma tayyorlash.', textarea: true },
    { key: 'muddat',   label: 'Yakunlash muddati', placeholder: '2026 yil 15 aprelgacha' },
    { key: 'asos',     label: 'Buyruq asosi',    placeholder: 'tashkilot ehtiyojlaridan kelib chiqib' },
    { key: 'direktor_lavozim', label: 'Rahbar lavozimi', placeholder: 'Direktor' },
  ],
  inventarizatsiya: [
    { key: 'raqam',          label: 'Buyruq raqami',       placeholder: '16' },
    { key: 'sana',           label: 'Sana',                placeholder: '', type: 'date' },
    { key: 'shahar',         label: 'Shahar',              placeholder: 'Toshkent' },
    { key: 'inventar_turi',  label: 'Inventarizatsiya turi', placeholder: 'Mol-mulk va tovar-moddiy qiymatliklar / Kassa / Asosiy vositalar' },
    { key: 'boshlanish',     label: 'Boshlanish sanasi',   placeholder: '2026-04-01', type: 'date' },
    { key: 'tugash',         label: 'Tugash sanasi',       placeholder: '2026-04-05', type: 'date' },
    { key: 'rais',           label: 'Komissiya raisi',     placeholder: 'Karimova N. — bosh buxgalter' },
    { key: 'azolar',         label: 'Komissiya a\'zolari', placeholder: 'Rahimov B. — ombor mudiri\nUsmonov J. — yurist' },
    { key: 'qamrov',         label: 'Inventarizatsiya qamrovi', placeholder: 'barcha asosiy vositalar, tovar-moddiy qiymatliklar va kassa' },
    { key: 'hisobot_muddati',label: 'Hisobot taqdim etish muddati', placeholder: '2026 yil 7 aprelgacha' },
    { key: 'nazoratchi',     label: 'Nazoratchi',          placeholder: 'bosh buxgalter' },
    { key: 'asos',           label: 'Buyruq asosi',        placeholder: 'yillik inventarizatsiya rejasiga muvofiq' },
    { key: 'direktor_lavozim', label: 'Rahbar lavozimi',   placeholder: 'Direktor' },
  ],
  xizmat_safari: [
    { key: 'raqam',          label: 'Buyruq raqami',    placeholder: '17' },
    { key: 'sana',           label: 'Sana',             placeholder: '', type: 'date' },
    { key: 'shahar',         label: 'Shahar',           placeholder: 'Toshkent' },
    { key: 'xodim_ism',      label: 'Xodim F.I.Sh.',   placeholder: 'Toshmatov Alisher Baxtiyor o\'g\'li' },
    { key: 'xodim_lavozim',  label: 'Xodim lavozimi',  placeholder: 'Savdo bo\'limi boshlig\'i' },
    { key: 'manzil',         label: 'Safari manzili',  placeholder: 'Samarqand shahri / Dubay, BAA' },
    { key: 'maqsad',         label: 'Safari maqsadi',  placeholder: 'Sherik tashkilot bilan muzokaralar olib borish va shartnoma imzolash' },
    { key: 'boshlanish',     label: 'Boshlanish sanasi', placeholder: '', type: 'date' },
    { key: 'tugash',         label: 'Tugash sanasi',   placeholder: '', type: 'date' },
    { key: 'kun_soni',       label: 'Kun soni',        placeholder: '3' },
    { key: 'yol_xarajat',    label: 'Yo\'l xarajati',  placeholder: 'haqiqiy miqdorda / 500 000 so\'mgacha' },
    { key: 'kunlik',         label: 'Kunlik xarajat',  placeholder: 'belgilangan me\'yor bo\'yicha (150 000 so\'m)' },
    { key: 'turar_joy',      label: 'Turar joy xarajati', placeholder: 'haqiqiy miqdorda hujjat asosida' },
    { key: 'hisobot_muddat', label: 'Hisobot muddati', placeholder: 'qaytgandan keyin 3 ish kuni ichida' },
    { key: 'asos',           label: 'Buyruq asosi',    placeholder: 'tashkilot ishlab chiqarish ehtiyojlaridan kelib chiqib' },
    { key: 'direktor_lavozim', label: 'Rahbar lavozimi', placeholder: 'Direktor' },
  ],
  moddiy_javobgar: [
    { key: 'raqam',              label: 'Buyruq raqami',        placeholder: '18' },
    { key: 'sana',               label: 'Sana',                 placeholder: '', type: 'date' },
    { key: 'shahar',             label: 'Shahar',               placeholder: 'Toshkent' },
    { key: 'xodim_ism',          label: 'Xodim F.I.Sh.',        placeholder: 'Usmonov Jasur Hamidovich' },
    { key: 'xodim_lavozim',      label: 'Xodim lavozimi',       placeholder: 'Ombor mudiri' },
    { key: 'javobgarlik_predmeti', label: 'Javobgarlik predmeti', placeholder: 'omborxona mol-mulki, tovar-moddiy qiymatliklar va inventar' },
    { key: 'oldingi_javobgar',   label: 'Oldingi javobgar (ixtiyoriy)', placeholder: 'Rahimov A. — sobiq ombor mudiri' },
    { key: 'nazoratchi',         label: 'Nazoratchi',           placeholder: 'bosh buxgalter' },
    { key: 'asos',               label: 'Buyruq asosi',         placeholder: 'tashkilot ichki tartib-qoidalariga muvofiq' },
    { key: 'direktor_lavozim',   label: 'Rahbar lavozimi',      placeholder: 'Direktor' },
  ],
  vazifa_yuklatish: [
    { key: 'raqam',           label: 'Buyruq raqami',         placeholder: '19' },
    { key: 'sana',            label: 'Sana',                  placeholder: '', type: 'date' },
    { key: 'shahar',          label: 'Shahar',                placeholder: 'Toshkent' },
    { key: 'ijrochi_ism',     label: 'Ijrochi F.I.Sh.',       placeholder: 'Karimov Bobur Aliyevich' },
    { key: 'ijrochi_lavozim', label: 'Ijrochi lavozimi',      placeholder: 'Bosh muhandis' },
    { key: 'vazifa_mazmuni',  label: 'Vazifa mazmuni',        placeholder: '– Yangi omborxona loyihasini ishlab chiqish;\n– Qurilish smetasini tayyorlash;\n– Pudratchi tashkilotlar bilan kelishish.', textarea: true },
    { key: 'muddat',          label: 'Bajarish muddati',      placeholder: '2026 yil 30 aprelgacha' },
    { key: 'hisobot_shakli',  label: 'Hisobot shakli',        placeholder: 'yozma hisobot va tegishli hujjatlar to\'plami shaklida' },
    { key: 'nazoratchi',      label: 'Nazoratchi',            placeholder: 'to\'g\'ridan-to\'g\'ri rahbar / direktor o\'rinbosari' },
    { key: 'asos',            label: 'Buyruq asosi',          placeholder: 'tashkilot strategik rivojlanish rejasidan kelib chiqib' },
    { key: 'direktor_lavozim',label: 'Rahbar lavozimi',       placeholder: 'Direktor' },
  ],
}

interface Props {
  orgName: string
  orgDirector: string
  onSave: (text: string, title: string) => void
}

export default function BuyruqMaker({ orgName, orgDirector, onSave }: Props) {
  const [step, setStep] = useState<'select' | 'form' | 'result'>('select')
  const [selectedType, setSelectedType] = useState<BuyruqType | null>(null)
  const [formData, setFormData] = useState<BuyruqFields>({})
  const [result, setResult] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

  function selectType(key: BuyruqType) {
    setSelectedType(key)
    setFormData({})
    setResult('')
    setStep('form')
  }

  function generate() {
    if (!selectedType) return
    const text = generateBuyruq(selectedType, formData, { name: orgName, director_name: orgDirector })
    setResult(text)
    setStep('result')
    const typeInfo = BUYRUQ_TYPES.find(t => t.key === selectedType)
    onSave(text, typeInfo?.title || 'Buyruq')
  }

  function reset() {
    setStep('select')
    setSelectedType(null)
    setFormData({})
    setResult('')
  }

  const typeInfo = selectedType ? BUYRUQ_TYPES.find(t => t.key === selectedType) : null
  const fields = selectedType ? FIELDS[selectedType] : []

  if (step === 'select') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BUYRUQ_TYPES.map(bt => (
          <button key={bt.key} onClick={() => selectType(bt.key)}
            className="bg-[#111827] border border-[#1E293B] hover:border-blue-600/50 hover:bg-[#1F2937] rounded-xl p-4 text-left transition group">
            <div className="text-2xl mb-2">{bt.icon}</div>
            <div className="font-semibold text-white text-sm mb-0.5 group-hover:text-blue-400 transition">{bt.title}</div>
            <div className="text-xs text-gray-500">{bt.desc}</div>
          </button>
        ))}
      </div>
    )
  }

  if (step === 'form') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={reset} className="text-gray-400 hover:text-white text-xs transition font-medium">← Tur tanlash</button>
          <div className="text-sm font-semibold text-blue-400">{typeInfo?.icon} {typeInfo?.title}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
              <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
              {f.textarea ? (
                <textarea
                  value={formData[f.key] || ''}
                  onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={3}
                  className={`${inp} resize-y`}
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={formData[f.key] || ''}
                  onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className={inp}
                />
              )}
            </div>
          ))}
        </div>

        {(orgName || orgDirector) && (
          <div className="bg-[#111827] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
            <span>🏢</span>
            <span>Tashkilot: <span className="text-white font-medium">{orgName}</span></span>
            {orgDirector && <><span className="text-gray-600">·</span><span>Direktor: <span className="text-gray-300">{orgDirector}</span></span></>}
          </div>
        )}

        <button onClick={generate}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm">
          ⚡ Buyruq yaratish
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep('form')} className="text-gray-400 hover:text-white text-xs transition font-medium">← Formaga qaytish</button>
          <span className="text-xs text-green-400 bg-green-500/20 border border-green-500/30 px-2 py-0.5 rounded-full">✓ Saqlandi</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg transition">👁 Ko&apos;rish</button>
          <button onClick={() => downloadTextAsWord(result, typeInfo?.title || 'Buyruq')}
            className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-semibold transition">📝 Word</button>
          <button onClick={() => downloadTextAsPDF(result, typeInfo?.title || 'Buyruq')}
            className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition">📄 PDF</button>
          <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="flex items-center gap-1.5 text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-400 px-3 py-1.5 rounded-lg transition">
            {copied ? '✓ Nusxalandi' : '📋 Nusxalash'}
          </button>
          <button onClick={reset}
            className="flex items-center gap-1.5 text-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/30 px-3 py-1.5 rounded-lg transition">+ Yangi buyruq</button>
        </div>
      </div>

      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
        {result}
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
              <h3 className="font-semibold text-white">👁 {typeInfo?.title}</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white text-xl leading-none transition">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white text-gray-900 rounded-xl p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
            </div>
            <div className="px-5 py-4 border-t border-[#1E293B] flex gap-3">
              <button onClick={() => { downloadTextAsWord(result, typeInfo?.title || 'Buyruq'); setShowPreview(false) }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">📝 Word</button>
              <button onClick={() => { downloadTextAsPDF(result, typeInfo?.title || 'Buyruq'); setShowPreview(false) }}
                className="flex-1 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 py-2.5 rounded-xl text-sm transition">📄 PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
