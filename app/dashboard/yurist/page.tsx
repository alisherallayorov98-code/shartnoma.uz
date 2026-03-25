'use client'

import { useState } from 'react'
import { useLang } from '@/lib/LanguageContext'
import { useDashboard } from '../context'
import { downloadTextAsPDF, downloadTextAsWord, saveAiResult } from '@/lib/downloadUtils'
import { fetchAi } from '@/lib/fetchAi'
import { useToast } from '@/lib/toast'

const CONTRACT_TYPES_I18N: Record<string, Record<'uz' | 'oz' | 'ru', string>> = {
  oldi_sotdi: { uz: 'Oldi-sotdi', oz: 'Олди-сотди', ru: 'Купля-продажа' },
  xizmat: { uz: 'Xizmat', oz: 'Хизмат', ru: 'Услуги' },
  ijara: { uz: 'Ijara', oz: 'Ижара', ru: 'Аренда' },
  pudrat: { uz: 'Pudrat', oz: 'Пудрат', ru: 'Подряд' },
  qoshimcha: { uz: "Qo'shimcha", oz: 'Қўшимча', ru: 'Дополнительный' },
  moliyaviy: { uz: 'Moliyaviy yordam', oz: 'Молиявий ёрдам', ru: 'Финансовая помощь' },
  daval: { uz: 'Daval', oz: 'Давал', ru: 'Давальческий' },
  xalqaro: { uz: 'Xalqaro', oz: 'Халқаро', ru: 'Международный' },
  boshqa: { uz: 'Boshqa', oz: 'Бошқа', ru: 'Другой' },
}

type HubFeature = 'xulosa' | 'tarjima' | 'grammatika' | 'tahlil' | 'qa' | 'clause' | 'recommend' | 'write'

const FEATURES: { key: HubFeature; icon: string; name: string; desc: string; needsContract: boolean; premiumOnly: boolean }[] = [
  { key: 'xulosa',     icon: '📝', name: 'Xulosa',          desc: "Shartnomaning asosiy shartlarini qisqacha bayon qiladi",        needsContract: true,  premiumOnly: false },
  { key: 'tarjima',    icon: '🌐', name: 'Tarjima',          desc: "Shartnomani boshqa tilga professional tarjima qiladi",          needsContract: true,  premiumOnly: false },
  { key: 'grammatika', icon: '✏️', name: 'Grammatika',       desc: "Matnidagi imlo, grammatika va uslub xatolarini topadi",        needsContract: true,  premiumOnly: false },
  { key: 'tahlil',     icon: '📊', name: 'Chuqur tahlil',    desc: "Yuridik xatarlar, zaif tomonlar va baho (A-D)",                needsContract: true,  premiumOnly: true  },
  { key: 'qa',         icon: '💬', name: 'Savol-Javob',      desc: "Shartnoma haqida istalgan savolga javob beradi",               needsContract: true,  premiumOnly: true  },
  { key: 'clause',     icon: '➕', name: "Band qo'shish",    desc: "Ko'rsatma asosida yangi band yozib beradi",                    needsContract: false, premiumOnly: true  },
  { key: 'recommend',  icon: '🎯', name: 'Tur tavsiyasi',    desc: "Vaziyatni ta'riflang — qaysi shartnoma turi mos ekanini aytadi", needsContract: false, premiumOnly: false },
  { key: 'write',      icon: '✍️', name: 'Shartnoma yoz',   desc: "Ma'lumotlar asosida to'liq shartnoma matnini yozadi",          needsContract: false, premiumOnly: true  },
]

export default function YuristPage() {
  const { lang } = useLang()
  const { toast } = useToast()
  const { contracts, activeOrg, hasAiAccess, subscription, openUpgradeModal } = useDashboard()

  const [hubFeature, setHubFeature] = useState<HubFeature>('xulosa')
  const [hubContract, setHubContract] = useState('')
  const [hubTargetLang, setHubTargetLang] = useState('ru')
  const [hubQuestion, setHubQuestion] = useState('')
  const [hubInstruction, setHubInstruction] = useState('')
  const [hubDescription, setHubDescription] = useState('')
  const [hubWriteDetails, setHubWriteDetails] = useState({ tur: 'oldi_sotdi', summa: '', org: '', cp: '', extra: '' })
  const [hubCp, setHubCp] = useState('')
  const [hubLoading, setHubLoading] = useState(false)
  const [hubResult, setHubResult] = useState<Record<string, unknown> | null>(null)
  const [hubError, setHubError] = useState('')
  const [previewText, setPreviewText] = useState<string | null>(null)

  const contractList = contracts.filter(c => c.organization_id === activeOrg?.id)

  // Unique counterparties from contractList
  const cpOptions = Array.from(
    new Map(contractList.map(c => [c.counterparty_id, c.counterparties?.name || '—'])).entries()
  ).filter(([id]) => id)

  const filteredBycp = hubCp ? contractList.filter(c => c.counterparty_id === hubCp) : contractList

  const sel = FEATURES.find(f => f.key === hubFeature)!
  const canUse = hasAiAccess()

  async function runHubFeature() {
    if (!hasAiAccess()) { openUpgradeModal(); return }
    const selectedContract = contracts.find(c => c.id === hubContract)
    const content = selectedContract?.content || ''
    const needsContract = ['tahlil', 'grammatika', 'xulosa', 'tarjima', 'qa'].includes(hubFeature)
    if (needsContract && !content.trim()) {
      setHubError("Shartnomani tanlang yoki uning matni bo'sh. Avval shartnoma yaratib, matn kiriting.")
      return
    }
    if (hubFeature === 'qa' && !hubQuestion.trim()) { setHubError("Iltimos, savolingizni kiriting."); return }
    if (hubFeature === 'clause' && !hubInstruction.trim()) { setHubError("Iltimos, band uchun ko'rsatma kiriting."); return }
    if (hubFeature === 'recommend' && !hubDescription.trim()) { setHubError("Iltimos, vaziyatni ta'riflang."); return }

    setHubLoading(true); setHubError(''); setHubResult(null)
    try {
      const typeMap: Record<HubFeature, string> = {
        tahlil: 'analysis', grammatika: 'grammar', xulosa: 'summary',
        tarjima: 'translate', qa: 'qa', clause: 'clause', recommend: 'recommend', write: 'write',
      }
      const body: Record<string, unknown> = { type: typeMap[hubFeature], lang, content }
      if (hubFeature === 'qa')        body.question    = hubQuestion
      if (hubFeature === 'clause')    body.instruction = hubInstruction
      if (hubFeature === 'tarjima')   body.target_lang = hubTargetLang
      if (hubFeature === 'recommend') { body.description = hubDescription; delete body.content }
      if (hubFeature === 'write')     { body.details = hubWriteDetails; delete body.content }
      const res  = await fetchAi(body)
      const data = await res.json()
      if (data.error === 'premium_required') { openUpgradeModal(); return }
      if (!res.ok || data.error) { setHubError(data.error || 'Xatolik'); return }
      const result = data.result
      if (!result || typeof result !== 'object' || Object.keys(result).length === 0) {
        setHubError("AI bo'sh natija qaytardi. Qayta urinib ko'ring.")
        return
      }
      setHubResult(result)
    } catch {
      setHubError('Serverga ulanishda xatolik')
    } finally {
      setHubLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">⚖️ Yurist AI</h1>
          <p className="text-gray-400 text-sm mt-0.5">Claude AI yordamida shartnomalaringizni tahlil qiling, tarjima qiling va takomillashtiring</p>
        </div>
        {!hasAiAccess() ? (
          <button onClick={openUpgradeModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
            ✦ Pro versiyani olish →
          </button>
        ) : (
          <span className="text-xs bg-blue-600/10 border border-blue-600/30 text-blue-400 px-3 py-1.5 rounded-xl font-medium">
            ⭐ {subscription?.plan === 'ai_pro' ? 'AI Pro' : subscription?.plan === 'standard' ? 'Standart' : 'Premium'} — Cheksiz foydalanish
          </span>
        )}
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FEATURES.map(f => {
          const locked = !hasAiAccess()
          return (
            <button key={f.key}
              onClick={() => { setHubFeature(f.key); setHubResult(null); setHubError(''); setHubLoading(false); if (!f.needsContract) { setHubContract(''); setHubCp('') } }}
              className={`relative text-left p-4 rounded-xl border transition ${
                hubFeature === f.key
                  ? 'bg-blue-600/10 border-blue-600/50 shadow-lg shadow-blue-900/20'
                  : locked
                  ? 'bg-[#111827] border-[#1E293B] opacity-60 cursor-default'
                  : 'bg-[#111827] border-[#1E293B] hover:border-blue-600/40'
              }`}>
              {locked && (
                <span className="absolute top-2 right-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">PRO</span>
              )}
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className={`text-sm font-semibold mb-1 ${hubFeature === f.key ? 'text-white' : 'text-gray-200'}`}>{f.name}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Feature panel */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{sel.icon}</span>
          <h3 className="font-semibold text-white">{sel.name}</h3>
          {!hasAiAccess() && (
            <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Pro versiya</span>
          )}
        </div>

        {/* Contract selector */}
        {sel.needsContract && (() => {
          const contractsWithContent = filteredBycp.filter(c => c.content?.trim())
          const selectedHasContent = filteredBycp.find(c => c.id === hubContract)?.content?.trim()
          return (
            <div className="space-y-3">
              {/* Counterparty filter */}
              {cpOptions.length > 1 && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Kontragent</label>
                  <select value={hubCp} onChange={e => { setHubCp(e.target.value); setHubContract(''); setHubResult(null); setHubError('') }}
                    className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer">
                    <option value="">— Barcha kontragentlar —</option>
                    {cpOptions.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Contract filter */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Shartnoma tanlang
                  {contractsWithContent.length === 0 && filteredBycp.length > 0 && (
                    <span className="ml-2 text-amber-400">⚠ Hech bir shartnomada matn yo'q</span>
                  )}
                </label>
                <select value={hubContract} onChange={e => { setHubContract(e.target.value); setHubResult(null); setHubError('') }}
                  className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer">
                  <option value="">— Shartnomani tanlang —</option>
                  {filteredBycp.map(c => {
                    const hasContent = Boolean(c.content?.trim())
                    return (
                      <option key={c.id} value={c.id} disabled={!hasContent}>
                        {hasContent ? '✓' : '✗'} #{c.contract_number} · {CONTRACT_TYPES_I18N[c.contract_type]?.[lang]}{!hubCp ? ` · ${c.counterparties?.name || '—'}` : ''}{!hasContent ? " (matn yo'q)" : ''}
                      </option>
                    )
                  })}
                </select>
                {hubContract && !selectedHasContent && (
                  <p className="text-amber-400 text-xs mt-1">⚠ Bu shartnomada matn yo'q. Shartnomani oching va bandlar qo'shing.</p>
                )}
              </div>
            </div>
          )
        })()}

        {/* Tarjima - til tanlash */}
        {hubFeature === 'tarjima' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tarjima tili</label>
            <div className="flex gap-2">
              {[['ru', 'Ruscha'], ['oz', "O'zbek (Kirill)"], ['en', 'English']].map(([v, l]) => (
                <button key={v} onClick={() => setHubTargetLang(v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${hubTargetLang === v ? 'bg-blue-600 text-white' : 'bg-[#1F2937] border border-[#1E293B] text-gray-400 hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Savol-javob */}
        {hubFeature === 'qa' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Savolingiz</label>
            <div className="flex gap-2">
              <input value={hubQuestion} onChange={e => setHubQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !hubLoading) { e.preventDefault(); setHubResult(null); runHubFeature() } }}
                placeholder="Masalan: Bu shartnomada jarima bandi bormi? (Enter → yuborish)"
                className="flex-1 bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
              {hubResult && !hubLoading && (
                <button onClick={() => { setHubResult(null); setHubError(''); runHubFeature() }}
                  className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  ↩ Yuborish
                </button>
              )}
            </div>
          </div>
        )}

        {/* Band qo'shish */}
        {hubFeature === 'clause' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ko'rsatma</label>
            <input value={hubInstruction} onChange={e => setHubInstruction(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !hubLoading) { e.preventDefault(); setHubResult(null); runHubFeature() } }}
              placeholder="Masalan: Kechikish uchun 0.1% kunlik jarima bandi qo'sh (Enter → yuborish)"
              className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
          </div>
        )}

        {/* Tur tavsiyasi */}
        {hubFeature === 'recommend' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Vaziyatni ta'riflang</label>
            <textarea value={hubDescription} onChange={e => setHubDescription(e.target.value)} rows={3}
              placeholder="Masalan: Kompaniyam boshqa firmaga 3 oy davomida ofis ijaraga bermoqchi..."
              className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500 resize-none"/>
          </div>
        )}

        {/* Shartnoma yozish */}
        {hubFeature === 'write' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Shartnoma turi</label>
              <select value={hubWriteDetails.tur} onChange={e => setHubWriteDetails({ ...hubWriteDetails, tur: e.target.value })}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer">
                {Object.entries(CONTRACT_TYPES_I18N).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Summa</label>
              <input value={hubWriteDetails.summa} onChange={e => setHubWriteDetails({ ...hubWriteDetails, summa: e.target.value })}
                placeholder="10 000 000 so'm" className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Birinchi tomon</label>
              <input value={hubWriteDetails.org} onChange={e => setHubWriteDetails({ ...hubWriteDetails, org: e.target.value })}
                placeholder="Tashkilot nomi" className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ikkinchi tomon</label>
              <input value={hubWriteDetails.cp} onChange={e => setHubWriteDetails({ ...hubWriteDetails, cp: e.target.value })}
                placeholder="Kontragent nomi" className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Qo'shimcha shartlar (ixtiyoriy)</label>
              <textarea value={hubWriteDetails.extra} onChange={e => setHubWriteDetails({ ...hubWriteDetails, extra: e.target.value })} rows={2}
                placeholder="Masalan: To'lov muddati 30 kun, yetkazib berish Toshkentda..."
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500 resize-none"/>
            </div>
          </div>
        )}

        {/* Error */}
        {hubError && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <span>⚠️</span>
            <div>
              {hubError}
              {hubError.includes('premium') && (
                <button onClick={openUpgradeModal}
                  className="block mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg">
                  Pro versiyani olish →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Premium lock */}
        {!canUse && (
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <div className="text-white font-semibold mb-1">Pro versiyada ishlaydi</div>
            <div className="text-gray-400 text-sm mb-4">Yurist AI faqat Standart yoki AI Pro tarifida ishlaydi. Hoziroq ulaning va shartnomalaringizni AI bilan tahlil qiling.</div>
            <button onClick={openUpgradeModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition">
              ✦ Pro versiyani olish →
            </button>
          </div>
        )}

        {/* Action button */}
        {canUse && !hubLoading && !hubResult && (
          <button onClick={runHubFeature}
            className="w-full py-3 rounded-xl text-sm font-semibold transition bg-orange-500 hover:bg-orange-600 text-white">
            {sel.icon} {sel.name} boshlash
          </button>
        )}

        {/* Loading */}
        {hubLoading && (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
            <div className="text-gray-400 text-sm">Claude AI ishlamoqda...</div>
            <div className="text-gray-500 text-xs mt-1">~10-20 soniya</div>
          </div>
        )}

        {/* Preview modal */}
        {previewText !== null && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewText(null)}>
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
                <h3 className="font-semibold text-white">👁 Ko&apos;rish: {sel.name}</h3>
                <button onClick={() => setPreviewText(null)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white text-gray-900 rounded-xl p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                  {previewText}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-[#1E293B] flex gap-3">
                <button onClick={() => { downloadTextAsWord(previewText, sel.name); setPreviewText(null) }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                  📝 Word yuklash
                </button>
                <button onClick={() => { downloadTextAsPDF(previewText, sel.name); setPreviewText(null) }}
                  className="flex-1 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 py-2.5 rounded-xl text-sm font-semibold transition">
                  📄 PDF yuklash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {hubResult && !hubLoading && (
          <div className="space-y-3">
            <div className="h-px bg-[#1E293B]"/>

            {hubFeature === 'xulosa' && (
              <div className="space-y-3">
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Xulosa</div>
                  <div className="text-white text-sm leading-relaxed">{String(hubResult.xulosa || '')}</div>
                </div>
                {(hubResult.asosiy_shartlar as string[])?.length > 0 && (
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-2">Asosiy shartlar</div>
                    {(hubResult.asosiy_shartlar as string[]).map((s, i) => <div key={i} className="text-sm text-gray-200">• {s}</div>)}
                  </div>
                )}
                <div className="flex gap-3">
                  {Boolean(hubResult.muddat) && <div className="bg-blue-900/40 border border-blue-800/40 rounded-xl px-4 py-3 flex-1"><div className="text-xs text-gray-500">Muddat</div><div className="text-white text-sm">{String(hubResult.muddat)}</div></div>}
                  {Boolean(hubResult.summa)  && <div className="bg-emerald-900/40 border border-emerald-800/40 rounded-xl px-4 py-3 flex-1"><div className="text-xs text-gray-500">Summa</div><div className="text-white text-sm">{String(hubResult.summa)}</div></div>}
                </div>
                {(hubResult.muhim_bandlar as string[])?.length > 0 && (
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-2">📌 Muhim bandlar</div>
                    {(hubResult.muhim_bandlar as string[]).map((s, i) => <div key={i} className="text-sm text-gray-200">• {s}</div>)}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setPreviewText(String(hubResult.xulosa || ''))}
                    className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">👁 Ko&apos;rish</button>
                  <button onClick={() => downloadTextAsWord(String(hubResult.xulosa || ''), 'xulosa')}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">📝 Word</button>
                  <button onClick={() => downloadTextAsPDF(String(hubResult.xulosa || ''), 'xulosa')}
                    className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">📄 PDF</button>
                  <button onClick={() => navigator.clipboard.writeText(String(hubResult.xulosa || ''))}
                    className="text-xs text-gray-500 hover:text-gray-300 transition">📋 Nusxa</button>
                  <button onClick={() => { saveAiResult('Yurist xulosa', String(hubResult.xulosa || '')); toast('Saqlandi!', 'success') }}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">💾 Saqlash</button>
                </div>
              </div>
            )}

            {hubFeature === 'tarjima' && (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="text-xs text-gray-500">Tarjima</div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setPreviewText(String(hubResult.tarjima || ''))}
                      className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">👁 Ko&apos;rish</button>
                    <button onClick={() => downloadTextAsWord(String(hubResult.tarjima || ''), 'tarjima')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">📝 Word</button>
                    <button onClick={() => downloadTextAsPDF(String(hubResult.tarjima || ''), 'tarjima')}
                      className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">📄 PDF</button>
                    <button onClick={() => navigator.clipboard.writeText(String(hubResult.tarjima || ''))}
                      className="text-xs text-gray-500 hover:text-gray-300 transition">📋 Nusxa</button>
                    <button onClick={() => { saveAiResult('Tarjima', String(hubResult.tarjima || '')); toast('Saqlandi!', 'success') }}
                      className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">💾 Saqlash</button>
                  </div>
                </div>
                <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{String(hubResult.tarjima || '')}</pre>
              </div>
            )}

            {hubFeature === 'grammatika' && (
              <div className="space-y-3">
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <div className="text-white font-semibold">{Number(hubResult.xatolar_soni ?? (hubResult.xatolar as unknown[])?.length ?? 0)} ta xato</div>
                    <div className="text-gray-400 text-xs">{String(hubResult.umumiy_baho || '')}</div>
                  </div>
                </div>
                {(hubResult.xatolar as { xato: string; togri: string; izoh: string }[])?.map((x, i) => (
                  <div key={i} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-red-400 text-sm line-through">{x.xato}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-emerald-400 text-sm font-medium">{x.togri}</span>
                    </div>
                    <div className="text-gray-500 text-xs">{x.izoh}</div>
                  </div>
                ))}
              </div>
            )}

            {hubFeature === 'tahlil' && (
              <div className="space-y-3">
                <div className={`rounded-xl p-4 border flex items-center gap-3 ${
                  String(hubResult.baho) === 'A' ? 'bg-emerald-900/40 border-emerald-700' :
                  String(hubResult.baho) === 'B' ? 'bg-blue-900/40 border-blue-700' :
                  String(hubResult.baho) === 'C' ? 'bg-yellow-900/40 border-yellow-700' : 'bg-red-900/40 border-red-700'
                }`}>
                  <span className={`text-4xl font-black ${
                    String(hubResult.baho) === 'A' ? 'text-emerald-400' :
                    String(hubResult.baho) === 'B' ? 'text-blue-400' :
                    String(hubResult.baho) === 'C' ? 'text-yellow-400' : 'text-red-400'
                  }`}>{String(hubResult.baho)}</span>
                  <div className="text-gray-200 text-sm">{String(hubResult.umumiy || '')}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(hubResult.kuchli_tomonlar as string[])?.length > 0 && (
                    <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-3">
                      <div className="text-xs text-emerald-400 mb-1.5">✅ Kuchli tomonlar</div>
                      {(hubResult.kuchli_tomonlar as string[]).map((s, i) => <div key={i} className="text-xs text-gray-200">• {s}</div>)}
                    </div>
                  )}
                  {(hubResult.zaif_tomonlar as string[])?.length > 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-3">
                      <div className="text-xs text-yellow-400 mb-1.5">⚠️ Zaif tomonlar</div>
                      {(hubResult.zaif_tomonlar as string[]).map((s, i) => <div key={i} className="text-xs text-gray-200">• {s}</div>)}
                    </div>
                  )}
                </div>
                {(hubResult.yuridik_xatarlar as { daraja: string; tavsif: string }[])?.map((x, i) => (
                  <div key={i} className="flex items-start gap-2 bg-[#0F172A] border border-[#1E293B] rounded-xl p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${x.daraja.match(/yuqori|высок|юқори/i) ? 'bg-red-900 text-red-300' : x.daraja.match(/rta|редний|ўрта/i) ? 'bg-yellow-900 text-yellow-300' : 'bg-[#1F2937] text-gray-200'}`}>{x.daraja}</span>
                    <span className="text-gray-200 text-sm">{x.tavsif}</span>
                  </div>
                ))}
                {(hubResult.tavsiyalar as string[])?.map((s, i) => <div key={i} className="text-gray-200 text-sm">• {s}</div>)}
              </div>
            )}

            {hubFeature === 'qa' && (
              <div className="space-y-2">
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
                  <div className="text-xs text-blue-400 mb-2 flex items-center justify-between">
                    <span>💬 Javob</span>
                    <span className="text-gray-500 text-xs">{hubQuestion}</span>
                  </div>
                  {hubResult.javob
                    ? <div className="text-white text-sm leading-relaxed">{String(hubResult.javob)}</div>
                    : <div className="text-gray-500 text-sm italic">AI javob qaytarmadi. Yana urinib ko'ring.</div>
                  }
                </div>
                {Boolean(hubResult.havola) && String(hubResult.havola) !== 'shartnomaning qaysi bandiga tegishli' && (
                  <div className="text-gray-500 text-xs">📍 {String(hubResult.havola)}</div>
                )}
              </div>
            )}

            {hubFeature === 'clause' && (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                {Boolean(hubResult.band_nomi) && <div className="text-blue-400 text-xs font-semibold mb-2">{String(hubResult.band_nomi)}</div>}
                <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{String(hubResult.band || '')}</pre>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button onClick={() => setPreviewText(String(hubResult.band || ''))}
                    className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">👁 Ko&apos;rish</button>
                  <button onClick={() => downloadTextAsWord(String(hubResult.band || ''), 'band')}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">📝 Word</button>
                  <button onClick={() => downloadTextAsPDF(String(hubResult.band || ''), 'band')}
                    className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">📄 PDF</button>
                  <button onClick={() => navigator.clipboard.writeText(String(hubResult.band || ''))}
                    className="text-xs text-gray-500 hover:text-gray-300 transition">📋 Nusxa</button>
                  <button onClick={() => { saveAiResult('Yuridik band', String(hubResult.band || '')); toast('Saqlandi!', 'success') }}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">💾 Saqlash</button>
                </div>
              </div>
            )}

            {hubFeature === 'recommend' && (
              <div className="space-y-3">
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-3xl">🎯</span>
                  <div>
                    <div className="text-xs text-gray-500">Tavsiya etilgan tur</div>
                    <div className="text-white font-bold">{String(hubResult.tur_nomi || hubResult.tur || '')}</div>
                  </div>
                </div>
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 text-sm text-gray-200 leading-relaxed">{String(hubResult.tavsiya || '')}</div>
                {Boolean(hubResult.sabab) && <div className="text-gray-500 text-xs">💡 {String(hubResult.sabab)}</div>}
                {Boolean(hubResult.qoshimcha_maslahat) && <div className="text-gray-500 text-xs">📌 {String(hubResult.qoshimcha_maslahat)}</div>}
                <button onClick={() => { setHubFeature('write'); setHubWriteDetails({ ...hubWriteDetails, tur: String(hubResult.tur || 'oldi_sotdi') }); setHubResult(null) }}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-xl transition">
                  ✍️ Shu tur bo'yicha shartnoma yoz →
                </button>
              </div>
            )}

            {hubFeature === 'write' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-gray-500">{Number(hubResult.bandlar_soni || 0)} ta band</div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setPreviewText(String(hubResult.shartnoma || ''))}
                      className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">👁 Ko&apos;rish</button>
                    <button onClick={() => downloadTextAsWord(String(hubResult.shartnoma || ''), 'shartnoma')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">📝 Word</button>
                    <button onClick={() => downloadTextAsPDF(String(hubResult.shartnoma || ''), 'shartnoma')}
                      className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">📄 PDF</button>
                    <button onClick={() => navigator.clipboard.writeText(String(hubResult.shartnoma || ''))}
                      className="text-xs text-gray-400 hover:text-gray-200">📋 Nusxa</button>
                    <button onClick={() => { saveAiResult('AI shartnoma', String(hubResult.shartnoma || '')); toast('Saqlandi!', 'success') }}
                      className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">💾 Saqlash</button>
                  </div>
                </div>
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 max-h-96 overflow-y-auto">
                  <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{String(hubResult.shartnoma || '')}</pre>
                </div>
              </div>
            )}

            <button onClick={() => { setHubResult(null); setHubError('') }}
              className="text-xs text-gray-500 hover:text-gray-400 transition">🔄 Qayta bajarish</button>
          </div>
        )}
      </div>

      {/* Upgrade banner for free users */}
      {!hasAiAccess() && (
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-semibold text-sm mb-1">✦ Pro versiyada ishlaydi</div>
            <div className="text-gray-400 text-xs">Shartnoma tahlili, tarjima, grammatika, yuridik maslahat — barchasi AI bilan</div>
          </div>
          <button onClick={openUpgradeModal}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
            Pro versiyani olish →
          </button>
        </div>
      )}
    </div>
  )
}
