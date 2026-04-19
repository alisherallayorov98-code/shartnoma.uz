'use client'

import { type Lang } from '@/lib/i18n'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'
import ResultActions from '../ResultActions'

type Contract = { id: string; contract_number: string; contract_type: string }
type CpOption = [string, string]

export function ClauseInput({
  lang, hubCp, setHubCp, hubContract, setHubContract, setHubResult,
  hubInstruction, setHubInstruction, hubLoading, runHubFeature,
  cpOptions, filteredContracts,
}: {
  lang: Lang
  hubCp: string; setHubCp: (v: string) => void
  hubContract: string; setHubContract: (v: string) => void
  setHubResult: (v: null) => void
  hubInstruction: string; setHubInstruction: (v: string) => void
  hubLoading: boolean; runHubFeature: () => void
  cpOptions: CpOption[]
  filteredContracts: Contract[]
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Kontragent (ixtiyoriy)</label>
        <select value={hubCp} onChange={e => { setHubCp(e.target.value); setHubContract(''); setHubResult(null) }}
          className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer">
          <option value="">— Hammasi —</option>
          {cpOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Shartnoma (ixtiyoriy — band shu shartnomaga qo&apos;shiladi)</label>
        <select value={hubContract} onChange={e => { setHubContract(e.target.value); setHubResult(null) }}
          className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer">
          <option value="">— Shartnoma tanlanmagan —</option>
          {filteredContracts.map(c => (
            <option key={c.id} value={c.id}>
              #{c.contract_number} · {CONTRACT_TYPES_I18N[c.contract_type]?.[lang]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Ko&apos;rsatma</label>
        <input value={hubInstruction} onChange={e => setHubInstruction(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !hubLoading) { e.preventDefault(); setHubResult(null); runHubFeature() } }}
          placeholder="Masalan: Kechikish uchun 0.1% kunlik jarima bandi qo'sh (Enter → yuborish)"
          className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
      </div>
    </div>
  )
}

export function ClauseResult({
  band, band_nomi, hubContract, addingClause,
  addClauseToContract, setPreviewText, onSave,
}: {
  band: string; band_nomi?: string; hubContract: string
  addingClause: boolean
  addClauseToContract: (text: string) => void
  setPreviewText: (v: string) => void
  onSave: (t: string) => void
}) {
  return (
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-3">
      {Boolean(band_nomi) && <div className="text-blue-400 text-xs font-semibold">{band_nomi}</div>}
      <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{band}</pre>
      <div className="flex items-center gap-3 flex-wrap">
        <ResultActions text={band} label="band" onPreview={setPreviewText} onSave={onSave} />
        {hubContract && (
          <button onClick={() => addClauseToContract(band)} disabled={addingClause}
            className="text-xs bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold transition">
            {addingClause ? "⏳ Qo'shilmoqda…" : "➕ Shartnomaga qo'shish"}
          </button>
        )}
      </div>
      {!hubContract && (
        <div className="text-xs text-gray-500">💡 Bandni shartnomaga qo'shish uchun yuqorida shartnoma tanlang</div>
      )}
    </div>
  )
}
