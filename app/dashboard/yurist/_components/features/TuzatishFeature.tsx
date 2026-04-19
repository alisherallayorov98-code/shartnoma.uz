'use client'

import ResultActions from '../ResultActions'

type OzgarishItem = { original: string; fixed: string; izoh: string }

// ── INPUT ────────────────────────────────────────────────────────────────────
export function TuzatishInput({
  fixContent, setFixContent, fixFileName, fixFileLoading, handleFileUpload,
}: {
  fixContent: string
  setFixContent: (v: string) => void
  fixFileName: string
  fixFileLoading: boolean
  handleFileUpload: (file: File) => void
}) {
  return (
    <div className="space-y-4">
      {/* File upload zone */}
      <div>
        <label className="block text-xs text-gray-400 mb-2 font-medium">Fayl yuklang</label>
        <label className={`flex flex-col items-center justify-center w-full rounded-2xl cursor-pointer transition-all border-2 border-dashed
          ${fixFileName
            ? 'border-blue-600/50 bg-blue-600/5 py-5'
            : 'border-[#1E293B] hover:border-blue-600/40 bg-[#0A1628] py-8'
          }`}>
          <input type="file" accept=".txt,.docx" className="hidden"
            onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]) }}/>
          {fixFileName ? (
            <div className="flex items-center gap-3 px-5">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-xl">📄</span>
              </div>
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">{fixFileName}</div>
                {fixFileLoading && <div className="text-blue-400 text-xs mt-0.5 flex items-center gap-1"><span className="inline-block w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"/>O&apos;qilmoqda...</div>}
                {fixContent && !fixFileLoading && <div className="text-emerald-400 text-xs mt-0.5">✓ {fixContent.length.toLocaleString()} belgi o&apos;qildi</div>}
              </div>
              <div className="ml-auto shrink-0">
                <span className="text-xs text-blue-400 border border-blue-600/30 bg-blue-600/10 px-2 py-0.5 rounded-lg">O&apos;zgartirish</span>
              </div>
            </div>
          ) : (
            <div className="text-center px-6">
              <div className="w-12 h-12 bg-[#1E293B] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📎</span>
              </div>
              <div className="text-gray-300 text-sm font-medium mb-1">Faylni bu yerga tashlang yoki bosing</div>
              <div className="text-gray-600 text-xs">.docx yoki .txt format qabul qilinadi</div>
            </div>
          )}
        </label>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#1E293B]"/>
        <span className="text-xs text-gray-600 font-medium">yoki matnni yapishtirib qo&apos;ying</span>
        <div className="flex-1 h-px bg-[#1E293B]"/>
      </div>

      {/* Paste area */}
      <div className="relative">
        <textarea
          value={fixContent}
          onChange={e => setFixContent(e.target.value)}
          rows={6}
          placeholder="Shartnoma matnini bu yerga yapishtirib qo'ying..."
          className="w-full bg-[#0A1628] border border-[#1E293B] text-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-600 resize-none leading-relaxed"
        />
        {fixContent && (
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-gray-600">{fixContent.length.toLocaleString()} belgi</span>
            <button onClick={() => setFixContent('')}
              className="text-xs text-gray-600 hover:text-red-400 transition px-1.5 py-0.5 rounded hover:bg-red-900/20">
              ✕ Tozalash
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── RESULT ───────────────────────────────────────────────────────────────────
export function TuzatishResult({
  ozgartirishlar_soni, umumiy_baho, ozgartirishlar,
  fixEditedText, setFixEditedText, fixEditMode, setFixEditMode,
  setPreviewText, onSave, onSaveToSystem,
}: {
  ozgartirishlar_soni?: number
  umumiy_baho?: string
  ozgartirishlar: OzgarishItem[]
  fixEditedText: string; setFixEditedText: (v: string) => void
  fixEditMode: boolean; setFixEditMode: (v: boolean) => void
  setPreviewText: (v: string) => void
  onSave: (t: string) => void
  onSaveToSystem: () => void
}) {
  const count = ozgartirishlar_soni ?? ozgartirishlar?.length ?? 0
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-xl">✅</span>
        </div>
        <div>
          <div className="text-white font-semibold">{count} ta o&apos;zgarish kiritildi</div>
          {Boolean(umumiy_baho) && <div className="text-gray-400 text-xs mt-0.5">{umumiy_baho}</div>}
        </div>
      </div>

      {/* Changes list */}
      {ozgartirishlar?.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">O&apos;zgartirishlar ro&apos;yxati</div>
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {ozgartirishlar.map((o, i) => (
              <div key={i} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 space-y-1">
                {Boolean(o.original) && <div className="text-xs text-red-400 line-through leading-relaxed">{o.original}</div>}
                <div className="text-xs text-emerald-400 leading-relaxed">→ {o.fixed}</div>
                {Boolean(o.izoh) && <div className="text-xs text-gray-500 leading-relaxed">{o.izoh}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corrected contract */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-400 font-semibold">Tuzatilgan shartnoma</div>
          <button onClick={() => setFixEditMode(!fixEditMode)}
            className="text-xs text-blue-400 hover:text-blue-300 transition px-2.5 py-1 rounded-lg bg-blue-600/10 border border-blue-600/20">
            {fixEditMode ? '👁 Ko\'rish rejimi' : '✏️ Tahrirlash'}
          </button>
        </div>
        {fixEditMode ? (
          <textarea value={fixEditedText} onChange={e => setFixEditedText(e.target.value)} rows={16}
            className="w-full bg-white text-gray-900 rounded-xl px-5 py-4 text-sm font-serif leading-relaxed resize-y border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        ) : (
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 max-h-96 overflow-y-auto">
            <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{fixEditedText}</pre>
          </div>
        )}
      </div>

      <ResultActions text={fixEditedText} label="tuzatilgan_shartnoma" onPreview={setPreviewText} onSave={onSave} />

      <button onClick={onSaveToSystem}
        className="w-full py-2.5 rounded-xl text-sm font-semibold border border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/30 transition">
        📂 Tizimga shartnoma sifatida saqlash →
      </button>
    </div>
  )
}
