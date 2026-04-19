'use client'

import ResultActions from '../ResultActions'

export function QaInput({
  hubQuestion, setHubQuestion, hubResult, hubLoading, runHubFeature, setHubResult,
}: {
  hubQuestion: string
  setHubQuestion: (v: string) => void
  hubResult: boolean
  hubLoading: boolean
  runHubFeature: () => void
  setHubResult: (v: null) => void
}) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">Savolingiz</label>
      <div className="flex gap-2">
        <input value={hubQuestion} onChange={e => setHubQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !hubLoading) { e.preventDefault(); setHubResult(null); runHubFeature() } }}
          placeholder="Masalan: Bu shartnomada jarima bandi bormi? (Enter → yuborish)"
          className="flex-1 bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
        {hubResult && !hubLoading && (
          <button onClick={() => { setHubResult(null); runHubFeature() }}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            ↩ Yuborish
          </button>
        )}
      </div>
    </div>
  )
}

export function QaResult({
  javob, havola, hubQuestion, setPreviewText, onSave,
}: {
  javob: string
  havola?: string
  hubQuestion: string
  setPreviewText: (v: string) => void
  onSave: (t: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
        <div className="text-xs text-blue-400 mb-2 flex items-center justify-between">
          <span>💬 Javob</span>
          <span className="text-gray-500 text-xs">{hubQuestion}</span>
        </div>
        {javob
          ? <div className="text-white text-sm leading-relaxed">{javob}</div>
          : <div className="text-gray-500 text-sm italic">AI javob qaytarmadi. Yana urinib ko'ring.</div>
        }
      </div>
      {Boolean(havola) && havola !== 'shartnomaning qaysi bandiga tegishli' && (
        <div className="text-gray-500 text-xs">📍 {havola}</div>
      )}
      <ResultActions
        text={[`Savol: ${hubQuestion}`, `Javob: ${javob}`, havola && havola !== 'shartnomaning qaysi bandiga tegishli' ? `📍 ${havola}` : ''].filter(Boolean).join('\n')}
        label="savol-javob" onPreview={setPreviewText} onSave={onSave}
      />
    </div>
  )
}
