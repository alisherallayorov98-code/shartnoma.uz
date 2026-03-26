'use client'

import { useState } from 'react'
import { downloadTextAsPDF, downloadTextAsWord } from '@/lib/downloadUtils'

interface Props {
  result: string
  title: string
  copied: boolean
  onCopy: () => void
}

export default function HujjatResult({ result, title, copied, onCopy }: Props) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Natija:</h3>
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">✓ Saqlandi</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg transition">
              👁 Ko&apos;rish
            </button>
            <button onClick={() => downloadTextAsWord(result, title)}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-semibold transition">
              📝 Word
            </button>
            <button onClick={() => downloadTextAsPDF(result, title)}
              className="flex items-center gap-1.5 text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg transition">
              📄 PDF
            </button>
            <button onClick={onCopy}
              className="flex items-center gap-1.5 text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg transition">
              {copied ? '✓ Nusxalandi' : '📋 Nusxalash'}
            </button>
          </div>
        </div>
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto font-mono">
          {result}
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
              <h3 className="font-semibold text-white">👁 Ko&apos;rish: {title}</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white text-xl leading-none transition">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white text-gray-900 rounded-xl p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-inner">{result}</div>
            </div>
            <div className="px-5 py-4 border-t border-[#1E293B] flex gap-3">
              <button onClick={() => { downloadTextAsWord(result, title); setShowPreview(false) }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">📝 Word</button>
              <button onClick={() => { downloadTextAsPDF(result, title); setShowPreview(false) }}
                className="flex-1 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 py-2.5 rounded-xl text-sm transition">📄 PDF</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
