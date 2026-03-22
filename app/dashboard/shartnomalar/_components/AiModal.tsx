'use client'

import { t, tr, type Lang } from '@/lib/i18n'
import type { Contract } from '@/lib/types'

interface AiModalProps {
  aiContract: Contract | null
  aiLoading: boolean
  aiError: string
  aiResult: string
  aiTab: 'tahlil' | 'grammatika'
  onTabChange: (tab: 'tahlil' | 'grammatika') => void
  onClose: () => void
  onRunAiAnalysis: (c: Contract, type: 'tahlil' | 'grammatika') => void
  lang: Lang
}

export default function AiModal({
  aiContract, aiLoading, aiError, aiResult,
  aiTab, onTabChange, onClose, onRunAiAnalysis, lang,
}: AiModalProps) {
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

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
            <div className="prose prose-invert max-w-none">
              <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                {aiResult}
              </pre>
            </div>
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
