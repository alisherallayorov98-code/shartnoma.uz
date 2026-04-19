'use client'

import ResultActions from '../ResultActions'

export function TarjimaInput({
  hubTargetLang, setHubTargetLang,
}: {
  hubTargetLang: string
  setHubTargetLang: (v: string) => void
}) {
  return (
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
  )
}

export function TarjimaResult({
  tarjima, setPreviewText, onSave,
}: {
  tarjima: string
  setPreviewText: (v: string) => void
  onSave: (t: string) => void
}) {
  return (
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="text-xs text-gray-500">Tarjima</div>
        <ResultActions text={tarjima} label="tarjima" onPreview={setPreviewText} onSave={onSave} />
      </div>
      <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{tarjima}</pre>
    </div>
  )
}
