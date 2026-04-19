'use client'

import ResultActions from '../ResultActions'

export function XulosaResult({
  xulosa, asosiy_shartlar, muddat, summa, muhim_bandlar,
  setPreviewText, onSave,
}: {
  xulosa: string
  asosiy_shartlar?: string[]
  muddat?: string; summa?: string
  muhim_bandlar?: string[]
  setPreviewText: (v: string) => void
  onSave: (t: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
        <div className="text-xs text-gray-500 mb-1">Xulosa</div>
        <div className="text-white text-sm leading-relaxed">{xulosa}</div>
      </div>
      {(asosiy_shartlar?.length ?? 0) > 0 && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-2">Asosiy shartlar</div>
          {asosiy_shartlar!.map((s, i) => <div key={i} className="text-sm text-gray-200">• {s}</div>)}
        </div>
      )}
      <div className="flex gap-3">
        {Boolean(muddat) && <div className="bg-blue-900/40 border border-blue-800/40 rounded-xl px-4 py-3 flex-1"><div className="text-xs text-gray-500">Muddat</div><div className="text-white text-sm">{muddat}</div></div>}
        {Boolean(summa) && <div className="bg-emerald-900/40 border border-emerald-800/40 rounded-xl px-4 py-3 flex-1"><div className="text-xs text-gray-500">Summa</div><div className="text-white text-sm">{summa}</div></div>}
      </div>
      {(muhim_bandlar?.length ?? 0) > 0 && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-2">📌 Muhim bandlar</div>
          {muhim_bandlar!.map((s, i) => <div key={i} className="text-sm text-gray-200">• {s}</div>)}
        </div>
      )}
      <ResultActions text={xulosa} label="xulosa" onPreview={setPreviewText} onSave={onSave} />
    </div>
  )
}
