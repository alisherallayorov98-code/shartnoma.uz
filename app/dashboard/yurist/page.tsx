'use client'

import { useState } from 'react'
import { useLang } from '@/lib/LanguageContext'
import { useDashboard } from '../context'
import { downloadTextAsWord, saveAiResult } from '@/lib/downloadUtils'
import { fetchAi } from '@/lib/fetchAi'
import { useToast } from '@/lib/toast'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

type HubFeature = 'xulosa' | 'tarjima' | 'grammatika' | 'tahlil' | 'qa' | 'clause' | 'recommend' | 'write'

// ─── Typed results per feature ────────────────────────────────────────────────
type XulosaResult    = { xulosa: string; asosiy_shartlar?: string[]; muddat?: string; summa?: string; muhim_bandlar?: string[] }
type TarjimaResult   = { tarjima: string }
type GrammatikResult = { xatolar_soni?: number; umumiy_baho?: string; xatolar: { xato: string; togri: string; izoh: string }[] }
type TahlilResult    = { baho: string; umumiy: string; kuchli_tomonlar?: string[]; zaif_tomonlar?: string[]; yuridik_xatarlar?: { daraja: string; tavsif: string }[]; tavsiyalar?: string[] }
type QaResult        = { javob: string; havola?: string }
type ClauseResult    = { band: string; band_nomi?: string }
type RecommendResult = { tur?: string; tur_nomi?: string; tavsiya: string; sabab?: string; qoshimcha_maslahat?: string }
type WriteResult     = { shartnoma: string; bandlar_soni?: number }

type HubResult =
  | ({ _type: 'xulosa' }    & XulosaResult)
  | ({ _type: 'tarjima' }   & TarjimaResult)
  | ({ _type: 'grammatika'} & GrammatikResult)
  | ({ _type: 'tahlil' }    & TahlilResult)
  | ({ _type: 'qa' }        & QaResult)
  | ({ _type: 'clause' }    & ClauseResult)
  | ({ _type: 'recommend' } & RecommendResult)
  | ({ _type: 'write' }     & WriteResult)

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


// ─── ResultActions: download/copy/save tugmalari ─────────────────────────────
function ResultActions({
  text, label, saveName, onPreview, toast,
}: {
  text: string; label: string; saveName: string
  onPreview: (t: string) => void
  toast: (msg: string, type: 'success' | 'error') => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => onPreview(text)}
        className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">
        👁 Ko&apos;rish
      </button>
      <button onClick={() => downloadTextAsWord(text, label)}
        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">
        📝 Word
      </button>
      <a href="https://www.ilovepdf.com/ru/word_to_pdf" target="_blank" rel="noopener noreferrer"
        className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">
        📄 Word→PDF
      </a>
      <button onClick={() => navigator.clipboard.writeText(text)}
        className="text-xs text-gray-500 hover:text-gray-300 transition">
        📋 Nusxa
      </button>
      <button onClick={() => { saveAiResult(saveName, text); toast('Saqlandi!', 'success') }}
        className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">
        💾 Saqlash
      </button>
    </div>
  )
}

export default function YuristPage() {
  const { lang } = useLang()
  const { toast } = useToast()
  const { contracts, activeOrg, cps, hasAiAccess, subscription, openUpgradeModal, reloadContracts } = useDashboard()

  const [hubFeature, setHubFeature] = useState<HubFeature>('xulosa')
  const [hubContract, setHubContract] = useState('')
  const [hubTargetLang, setHubTargetLang] = useState('ru')
  const [hubQuestion, setHubQuestion] = useState('')
  const [hubInstruction, setHubInstruction] = useState('')
  const [hubDescription, setHubDescription] = useState('')
  const [hubWriteDetails, setHubWriteDetails] = useState({ tur: 'oldi_sotdi', summa: '', org: '', cp: '', extra: '', shartnoma_raqam: '', sana: '' })
  const [writeCpSearch, setWriteCpSearch] = useState('')
  const [writeCpOpen, setWriteCpOpen] = useState(false)
  const [hubCp, setHubCp] = useState('')
  const [hubLoading, setHubLoading] = useState(false)
  const [hubResult, setHubResult] = useState<HubResult | null>(null)
  const [hubError, setHubError] = useState('')
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [addingClause, setAddingClause] = useState(false)

  const contractList = contracts.filter(c => c.organization_id === activeOrg?.id)

  async function addClauseToContract(clauseText: string) {
    if (!hubContract) return
    const contract = contracts.find(c => c.id === hubContract)
    if (!contract) return
    setAddingClause(true)
    try {
      const newContent = (contract.content || '') + '\n\n' + clauseText
      const { error } = await supabase.from('contracts').update({ content: newContent }).eq('id', hubContract)
      if (error) { toast(error.message, 'error'); return }
      toast("Band shartnomaga qo'shildi!", 'success')
      reloadContracts()
    } finally {
      setAddingClause(false)
    }
  }

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
      if (hubFeature === 'write') {
        const selectedCp = cps.find(c => c.name === hubWriteDetails.cp)
        body.details = {
          ...hubWriteDetails,
          org_inn: activeOrg?.inn || '',
          org_director: activeOrg?.director_name || '',
          org_bank: activeOrg?.bank_name || '',
          org_mfo: activeOrg?.mfo || '',
          org_address: activeOrg?.address || '',
          cp_inn: selectedCp?.inn || '',
          cp_director: selectedCp?.director_name || '',
          cp_bank: selectedCp?.bank_name || '',
          cp_mfo: selectedCp?.mfo || '',
          cp_address: selectedCp?.address || '',
        }
        delete body.content
      }
      const res  = await fetchAi(body)
      const data = await res.json()
      if (data.error === 'premium_required') { openUpgradeModal(); return }
      if (!res.ok || data.error) { setHubError(data.error || 'Xatolik'); return }
      const result = data.result
      if (!result || typeof result !== 'object' || Object.keys(result).length === 0) {
        setHubError("AI bo'sh natija qaytardi. Qayta urinib ko'ring.")
        return
      }
      setHubResult({ _type: hubFeature, ...result } as HubResult)
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
              onClick={() => {
                if (locked) { openUpgradeModal(); return }
                setHubFeature(f.key); setHubResult(null); setHubError(''); setHubLoading(false)
                if (!f.needsContract) { setHubContract(''); setHubCp('') }
                if (f.key === 'write') {
                  setHubWriteDetails(d => ({ ...d, org: activeOrg?.name || '' }))
                  setWriteCpSearch(''); setWriteCpOpen(false)
                }
              }}
              className={`relative text-left p-4 rounded-xl border transition ${
                hubFeature === f.key
                  ? 'bg-blue-600/10 border-blue-600/50 shadow-lg shadow-blue-900/20'
                  : locked
                  ? 'bg-[#111827] border-[#1E293B] opacity-60 hover:border-blue-600/40 cursor-pointer'
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
              {cpOptions.length > 0 && (
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
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Kontragent (ixtiyoriy)</label>
              <select value={hubCp} onChange={e => { setHubCp(e.target.value); setHubContract(''); setHubResult(null) }}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer">
                <option value="">— Barcha kontragentlar —</option>
                {cpOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Shartnoma (ixtiyoriy — band shu shartnomaga qo'shiladi)</label>
              <select value={hubContract} onChange={e => { setHubContract(e.target.value); setHubResult(null) }}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer">
                <option value="">— Shartnoma tanlanmagan —</option>
                {filteredBycp.map(c => (
                  <option key={c.id} value={c.id}>
                    #{c.contract_number} · {CONTRACT_TYPES_I18N[c.contract_type]?.[lang]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ko'rsatma</label>
              <input value={hubInstruction} onChange={e => setHubInstruction(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !hubLoading) { e.preventDefault(); setHubResult(null); runHubFeature() } }}
                placeholder="Masalan: Kechikish uchun 0.1% kunlik jarima bandi qo'sh (Enter → yuborish)"
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
            </div>
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
              <label className="block text-xs text-gray-400 mb-1">Shartnoma raqami</label>
              <input value={hubWriteDetails.shartnoma_raqam} onChange={e => setHubWriteDetails({ ...hubWriteDetails, shartnoma_raqam: e.target.value })}
                placeholder="2025/01" className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sana</label>
              <input type="date" value={hubWriteDetails.sana} onChange={e => setHubWriteDetails({ ...hubWriteDetails, sana: e.target.value })}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"/>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Birinchi tomon</label>
              <div className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-white flex items-center gap-2">
                <span className="text-green-400 text-xs">✓</span>
                <span>{activeOrg?.name || '—'}</span>
                {activeOrg?.inn && <span className="text-gray-500 text-xs ml-auto">INN: {activeOrg.inn}</span>}
              </div>
            </div>
            <div className="relative">
              <label className="block text-xs text-gray-400 mb-1">Ikkinchi tomon (kontragent)</label>
              <input
                type="text"
                value={writeCpSearch}
                onFocus={() => setWriteCpOpen(true)}
                onChange={e => { setWriteCpSearch(e.target.value); setWriteCpOpen(true); setHubWriteDetails({ ...hubWriteDetails, cp: e.target.value }) }}
                onBlur={() => setTimeout(() => setWriteCpOpen(false), 150)}
                placeholder="Kontragent nomi yoki tanlang…"
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"
                autoComplete="off"
              />
              {writeCpOpen && (() => {
                const filtered = cps.filter(c =>
                  !writeCpSearch || c.name.toLowerCase().includes(writeCpSearch.toLowerCase())
                ).slice(0, 8)
                return filtered.length > 0 ? (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {filtered.map(cp => (
                      <button key={cp.id} type="button"
                        onMouseDown={() => {
                          setWriteCpSearch(cp.name)
                          setHubWriteDetails({ ...hubWriteDetails, cp: cp.name })
                          setWriteCpOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#1F2937] transition border-b border-[#1E293B]/50 last:border-0">
                        <div className="text-sm text-white">{cp.name}</div>
                        {cp.inn && <div className="text-xs text-gray-500">INN: {cp.inn}</div>}
                      </button>
                    ))}
                  </div>
                ) : null
              })()}
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
                <a href="https://www.ilovepdf.com/ru/word_to_pdf" target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 py-2.5 rounded-xl text-sm font-semibold transition text-center">
                  📄 Word→PDF
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {hubResult && !hubLoading && (
          <div className="space-y-3">
            <div className="h-px bg-[#1E293B]"/>

            {hubResult._type === 'xulosa' && (
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
                <ResultActions text={hubResult.xulosa} label="xulosa" saveName="Yurist xulosa" onPreview={setPreviewText} toast={toast} />
              </div>
            )}

            {hubResult?._type === 'tarjima' && (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="text-xs text-gray-500">Tarjima</div>
                  <ResultActions text={hubResult.tarjima} label="tarjima" saveName="Tarjima" onPreview={setPreviewText} toast={toast} />
                </div>
                <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{String(hubResult.tarjima || '')}</pre>
              </div>
            )}

            {hubResult._type === 'grammatika' && (
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
                <ResultActions
                  text={[
                    `Grammatika tekshiruvi: ${Number(hubResult.xatolar_soni ?? (hubResult.xatolar as unknown[])?.length ?? 0)} ta xato`,
                    hubResult.umumiy_baho ? `Umumiy baho: ${hubResult.umumiy_baho}` : '',
                    (hubResult.xatolar as { xato: string; togri: string; izoh: string }[])?.length
                      ? `\nXatolar:\n${(hubResult.xatolar as { xato: string; togri: string; izoh: string }[]).map(x => `❌ ${x.xato} → ✅ ${x.togri}\n   ${x.izoh}`).join('\n')}`
                      : '',
                  ].filter(Boolean).join('\n')}
                  label="grammatika" saveName="Grammatika tekshiruvi" onPreview={setPreviewText} toast={toast}
                />
              </div>
            )}

            {hubResult._type === 'tahlil' && (
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
                <ResultActions
                  text={[
                    `Baho: ${hubResult.baho}`,
                    hubResult.umumiy,
                    (hubResult.kuchli_tomonlar as string[])?.length ? `\nKuchli tomonlar:\n${(hubResult.kuchli_tomonlar as string[]).map(s => '• ' + s).join('\n')}` : '',
                    (hubResult.zaif_tomonlar as string[])?.length ? `\nZaif tomonlar:\n${(hubResult.zaif_tomonlar as string[]).map(s => '• ' + s).join('\n')}` : '',
                    (hubResult.yuridik_xatarlar as { daraja: string; tavsif: string }[])?.length ? `\nYuridik xatarlar:\n${(hubResult.yuridik_xatarlar as { daraja: string; tavsif: string }[]).map(x => `[${x.daraja}] ${x.tavsif}`).join('\n')}` : '',
                    (hubResult.tavsiyalar as string[])?.length ? `\nTavsiyalar:\n${(hubResult.tavsiyalar as string[]).map(s => '• ' + s).join('\n')}` : '',
                  ].filter(Boolean).join('\n')}
                  label="tahlil" saveName="Yurist tahlil" onPreview={setPreviewText} toast={toast}
                />
              </div>
            )}

            {hubResult?._type === 'qa' && (
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
                <ResultActions
                  text={[
                    `Savol: ${hubQuestion}`,
                    `Javob: ${String(hubResult.javob || '')}`,
                    hubResult.havola && String(hubResult.havola) !== 'shartnomaning qaysi bandiga tegishli' ? `📍 ${String(hubResult.havola)}` : '',
                  ].filter(Boolean).join('\n')}
                  label="savol-javob" saveName="Yurist javob" onPreview={setPreviewText} toast={toast}
                />
              </div>
            )}

            {hubResult?._type === 'clause' && (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-3">
                {Boolean(hubResult.band_nomi) && <div className="text-blue-400 text-xs font-semibold">{String(hubResult.band_nomi)}</div>}
                <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{String(hubResult.band || '')}</pre>
                <div className="flex items-center gap-3 flex-wrap">
                  <ResultActions text={hubResult.band} label="band" saveName="Yuridik band" onPreview={setPreviewText} toast={toast} />
                  {hubContract && (
                    <button onClick={() => addClauseToContract(String(hubResult.band || ''))} disabled={addingClause}
                      className="text-xs bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold transition">
                      {addingClause ? "⏳ Qo'shilmoqda…" : "➕ Shartnomaga qo'shish"}
                    </button>
                  )}
                </div>
                {!hubContract && (
                  <div className="text-xs text-gray-500">💡 Bandni shartnomaga qo'shish uchun yuqorida shartnoma tanlang</div>
                )}
              </div>
            )}

            {hubResult?._type === 'recommend' && (
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
                <button onClick={() => { setHubFeature('write'); setHubWriteDetails({ ...hubWriteDetails, tur: String(hubResult.tur || 'oldi_sotdi'), org: activeOrg?.name || '' }); setHubResult(null) }}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-xl transition">
                  ✍️ Shu tur bo'yicha shartnoma yoz →
                </button>
              </div>
            )}

            {hubResult?._type === 'write' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-gray-500">{Number(hubResult.bandlar_soni || 0)} ta band</div>
                  <ResultActions text={hubResult.shartnoma} label="shartnoma" saveName="AI shartnoma" onPreview={setPreviewText} toast={toast} />
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
