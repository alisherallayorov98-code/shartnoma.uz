'use client'

import ResultActions from '../ResultActions'

type XatoItem = { xato: string; togri: string; izoh: string }

export function GrammatikResult({
  xatolar_soni, umumiy_baho, xatolar, setPreviewText, onSave,
}: {
  xatolar_soni?: number
  umumiy_baho?: string
  xatolar: XatoItem[]
  setPreviewText: (v: string) => void
  onSave: (t: string) => void
}) {
  const count = xatolar_soni ?? xatolar?.length ?? 0
  return (
    <div className="space-y-3">
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">✏️</span>
        <div>
          <div className="text-white font-semibold">{count} ta xato</div>
          <div className="text-gray-400 text-xs">{umumiy_baho}</div>
        </div>
      </div>
      {xatolar?.map((x, i) => (
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
          `Grammatika tekshiruvi: ${count} ta xato`,
          umumiy_baho ? `Umumiy baho: ${umumiy_baho}` : '',
          xatolar?.length ? `\nXatolar:\n${xatolar.map(x => `❌ ${x.xato} → ✅ ${x.togri}\n   ${x.izoh}`).join('\n')}` : '',
        ].filter(Boolean).join('\n')}
        label="grammatika" onPreview={setPreviewText} onSave={onSave}
      />
    </div>
  )
}
