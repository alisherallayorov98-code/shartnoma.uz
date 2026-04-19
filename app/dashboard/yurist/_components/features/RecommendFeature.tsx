'use client'

import ResultActions from '../ResultActions'

export function RecommendInput({
  hubDescription, setHubDescription,
}: {
  hubDescription: string
  setHubDescription: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">Vaziyatni ta&apos;riflang</label>
      <textarea value={hubDescription} onChange={e => setHubDescription(e.target.value)} rows={3}
        placeholder="Masalan: Kompaniyam boshqa firmaga 3 oy davomida ofis ijaraga bermoqchi..."
        className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500 resize-none"/>
    </div>
  )
}

export function RecommendResult({
  tur, tur_nomi, tavsiya, sabab, qoshimcha_maslahat,
  onWriteWithTur, setPreviewText, onSave,
}: {
  tur?: string; tur_nomi?: string; tavsiya: string
  sabab?: string; qoshimcha_maslahat?: string
  onWriteWithTur: (tur: string) => void
  setPreviewText: (v: string) => void
  onSave: (t: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 flex items-center gap-3">
        <span className="text-3xl">🎯</span>
        <div>
          <div className="text-xs text-gray-500">Tavsiya etilgan tur</div>
          <div className="text-white font-bold">{tur_nomi || tur}</div>
        </div>
      </div>
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 text-sm text-gray-200 leading-relaxed">{tavsiya}</div>
      {Boolean(sabab) && <div className="text-gray-500 text-xs">💡 {sabab}</div>}
      {Boolean(qoshimcha_maslahat) && <div className="text-gray-500 text-xs">📌 {qoshimcha_maslahat}</div>}
      <button onClick={() => onWriteWithTur(tur || 'oldi_sotdi')}
        className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-xl transition">
        ✍️ Shu tur bo&apos;yicha shartnoma yoz →
      </button>
      <ResultActions text={[`Tavsiya: ${tur_nomi || tur}`, tavsiya, sabab ? `💡 ${sabab}` : ''].filter(Boolean).join('\n')}
        label="tavsiya" onPreview={setPreviewText} onSave={onSave} />
    </div>
  )
}
