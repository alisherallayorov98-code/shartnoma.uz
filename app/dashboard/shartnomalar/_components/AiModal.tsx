'use client'

import { t, tr, type Lang } from '@/lib/i18n'
import type { Contract } from '@/lib/types'

interface AiModalProps {
  aiContract: Contract | null
  aiLoading: boolean
  aiError: string
  aiResult: unknown
  aiTab: 'tahlil' | 'grammatika'
  onTabChange: (tab: 'tahlil' | 'grammatika') => void
  onClose: () => void
  onRunAiAnalysis: (c: Contract, type: 'tahlil' | 'grammatika') => void
  lang: Lang
}

type AnalysisResult = {
  baho?: string
  umumiy?: string
  kuchli_tomonlar?: string[]
  zaif_tomonlar?: string[]
  yuridik_xatarlar?: { daraja: string; tavsif: string }[]
  tavsiyalar?: string[]
  grammatika_xatolari?: string[]
}

type GrammarResult = {
  xatolar_soni?: number
  xatolar?: { xato: string; togri: string; izoh: string }[]
  umumiy_baho?: string
}

const BAHO_COLOR: Record<string, string> = {
  A: 'text-emerald-400 bg-emerald-900/40 border-emerald-700/50',
  B: 'text-blue-400 bg-blue-900/40 border-blue-700/50',
  C: 'text-yellow-400 bg-yellow-900/40 border-yellow-700/50',
  D: 'text-red-400 bg-red-900/40 border-red-700/50',
}
const DARAJA_COLOR: Record<string, string> = {
  yuqori: 'text-red-300',  высокий: 'text-red-300',
  "o'rta": 'text-yellow-300', средний: 'text-yellow-300',
  past: 'text-green-300', низкий: 'text-green-300',
}

function AnalysisView({ result }: { result: AnalysisResult }) {
  const baho = result.baho || ''
  return (
    <div className="space-y-4">
      {baho && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold ${BAHO_COLOR[baho] || 'text-gray-300 bg-gray-800 border-gray-700'}`}>
          Baho: {baho}
        </div>
      )}
      {result.umumiy && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Umumiy baho</p>
          <p className="text-gray-200 text-sm leading-relaxed">{result.umumiy}</p>
        </div>
      )}
      {!!result.kuchli_tomonlar?.length && (
        <div>
          <p className="text-xs text-emerald-400 mb-2 font-medium">✓ Kuchli tomonlar</p>
          <ul className="space-y-1">
            {result.kuchli_tomonlar.map((item, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-emerald-500 flex-shrink-0">•</span>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {!!result.zaif_tomonlar?.length && (
        <div>
          <p className="text-xs text-yellow-400 mb-2 font-medium">⚠ Zaif tomonlar</p>
          <ul className="space-y-1">
            {result.zaif_tomonlar.map((item, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-yellow-500 flex-shrink-0">•</span>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {!!result.yuridik_xatarlar?.length && (
        <div>
          <p className="text-xs text-red-400 mb-2 font-medium">⚡ Yuridik xatarlar</p>
          <div className="space-y-2">
            {result.yuridik_xatarlar.map((x, i) => (
              <div key={i} className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/30">
                <span className={`text-xs font-medium capitalize ${DARAJA_COLOR[x.daraja] || 'text-gray-400'}`}>[{x.daraja}] </span>
                <span className="text-sm text-gray-300">{x.tavsif}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!!result.tavsiyalar?.length && (
        <div>
          <p className="text-xs text-blue-400 mb-2 font-medium">💡 Tavsiyalar</p>
          <ul className="space-y-1">
            {result.tavsiyalar.map((item, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-blue-500 flex-shrink-0">{i + 1}.</span>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {!!result.grammatika_xatolari?.length && (
        <div>
          <p className="text-xs text-purple-400 mb-2 font-medium">✏ Grammatika xatolari</p>
          <ul className="space-y-1">
            {result.grammatika_xatolari.map((item, i) => (
              <li key={i} className="text-sm text-gray-400 flex gap-2"><span className="flex-shrink-0">•</span>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function GrammarView({ result }: { result: GrammarResult }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
          <span className="text-gray-500">Xatolar soni: </span>
          <span className={`font-bold ${(result.xatolar_soni || 0) === 0 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {result.xatolar_soni ?? 0}
          </span>
        </div>
        {result.umumiy_baho && (
          <div className="text-sm text-gray-300 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5">
            {result.umumiy_baho}
          </div>
        )}
      </div>
      {result.xatolar && result.xatolar.length > 0 ? (
        <div className="space-y-2">
          {result.xatolar.map((x, i) => (
            <div key={i} className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/30">
              <div className="flex items-start gap-2 flex-wrap mb-1">
                <span className="text-red-400 text-sm line-through">{x.xato}</span>
                <span className="text-gray-500">→</span>
                <span className="text-emerald-400 text-sm font-medium">{x.togri}</span>
              </div>
              {x.izoh && <p className="text-xs text-gray-500">{x.izoh}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 text-center">
          <p className="text-emerald-400 text-sm">✓ Grammatika xatolari topilmadi</p>
        </div>
      )}
    </div>
  )
}

export default function AiModal({
  aiContract, aiLoading, aiError, aiResult,
  aiTab, onTabChange, onClose, onRunAiAnalysis, lang,
}: AiModalProps) {
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  function renderResult() {
    if (!aiResult || typeof aiResult !== 'object') return null
    const r = aiResult as Record<string, unknown>
    if (aiTab === 'grammatika' || 'xatolar' in r || 'xatolar_soni' in r) {
      return <GrammarView result={r as GrammarResult} />
    }
    return <AnalysisView result={r as AnalysisResult} />
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="text-purple-400">✦</span> AI Tahlil
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-xl">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 flex-shrink-0">
          <button
            onClick={() => { onTabChange('tahlil'); if (aiContract) onRunAiAnalysis(aiContract, 'tahlil') }}
            className={`flex-1 py-2.5 text-sm font-medium transition ${aiTab === 'tahlil' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Shartnoma tahlili
          </button>
          <button
            onClick={() => { onTabChange('grammatika'); if (aiContract) onRunAiAnalysis(aiContract, 'grammatika') }}
            className={`flex-1 py-2.5 text-sm font-medium transition ${aiTab === 'grammatika' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Grammatika tekshirish
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <p className="text-gray-400 text-sm">AI tahlil qilmoqda...</p>
            </div>
          ) : aiError ? (
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
              <p className="text-red-300 text-sm">{aiError}</p>
            </div>
          ) : aiResult ? (
            renderResult()
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Natija kutilmoqda...</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full border border-gray-700 text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-800 transition"
          >
            {T(t.btn.close)}
          </button>
        </div>
      </div>
    </div>
  )
}
