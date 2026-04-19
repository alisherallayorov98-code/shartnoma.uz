'use client'

import { type Lang } from '@/lib/i18n'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'
import ResultActions from '../ResultActions'

type WriteDetails = { tur: string; summa: string; org: string; cp: string; extra: string; shartnoma_raqam: string; sana: string }
type Cp = { id: string; name: string; inn?: string }

export function WriteInput({
  lang, hubWriteDetails, setHubWriteDetails,
  writeCpSearch, setWriteCpSearch, writeCpOpen, setWriteCpOpen,
  activeOrgName, activeOrgInn, cps,
}: {
  lang: Lang
  hubWriteDetails: WriteDetails
  setHubWriteDetails: (d: WriteDetails) => void
  writeCpSearch: string; setWriteCpSearch: (v: string) => void
  writeCpOpen: boolean; setWriteCpOpen: (v: boolean) => void
  activeOrgName?: string; activeOrgInn?: string
  cps: Cp[]
}) {
  return (
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
          <span>{activeOrgName || '—'}</span>
          {activeOrgInn && <span className="text-gray-500 text-xs ml-auto">INN: {activeOrgInn}</span>}
        </div>
      </div>
      <div className="relative">
        <label className="block text-xs text-gray-400 mb-1">Ikkinchi tomon (kontragent)</label>
        <input type="text" value={writeCpSearch}
          onFocus={() => setWriteCpOpen(true)}
          onChange={e => { setWriteCpSearch(e.target.value); setWriteCpOpen(true); setHubWriteDetails({ ...hubWriteDetails, cp: e.target.value }) }}
          onBlur={() => setTimeout(() => setWriteCpOpen(false), 150)}
          placeholder="Kontragent nomi yoki tanlang…"
          className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"
          autoComplete="off"/>
        {writeCpOpen && (() => {
          const filtered = cps.filter(c => !writeCpSearch || c.name.toLowerCase().includes(writeCpSearch.toLowerCase())).slice(0, 8)
          return filtered.length > 0 ? (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              {filtered.map(cp => (
                <button key={cp.id} type="button"
                  onMouseDown={() => { setWriteCpSearch(cp.name); setHubWriteDetails({ ...hubWriteDetails, cp: cp.name }); setWriteCpOpen(false) }}
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
        <label className="block text-xs text-gray-400 mb-1">Qo&apos;shimcha shartlar (ixtiyoriy)</label>
        <textarea value={hubWriteDetails.extra} onChange={e => setHubWriteDetails({ ...hubWriteDetails, extra: e.target.value })} rows={2}
          placeholder="Masalan: To'lov muddati 30 kun, yetkazib berish Toshkentda..."
          className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500 resize-none"/>
      </div>
    </div>
  )
}

export function WriteResult({
  shartnoma, bandlar_soni, tur, shartnoma_raqam, sana,
  setPreviewText, onSave, onSaveToSystem,
}: {
  shartnoma: string; bandlar_soni?: number
  tur: string; shartnoma_raqam: string; sana: string
  setPreviewText: (v: string) => void
  onSave: (t: string) => void
  onSaveToSystem: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-gray-500">{bandlar_soni || 0} ta band</div>
        <ResultActions text={shartnoma} label="shartnoma" onPreview={setPreviewText} onSave={onSave} />
      </div>
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 max-h-96 overflow-y-auto">
        <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{shartnoma}</pre>
      </div>
      <button onClick={onSaveToSystem}
        className="w-full py-2.5 rounded-xl text-sm font-semibold border border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/30 transition">
        📂 Tizimga shartnoma sifatida saqlash →
      </button>
    </div>
  )
}
