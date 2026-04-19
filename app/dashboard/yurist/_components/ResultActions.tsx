'use client'

import { downloadTextAsWord } from '@/lib/downloadUtils'

export default function ResultActions({
  text, label, onPreview, onSave,
}: {
  text: string; label: string
  onPreview: (t: string) => void
  onSave: (t: string) => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => onPreview(text)}
        className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">
        👁 Ko&apos;rish
      </button>
      <button onClick={() => downloadTextAsWord(text, label)}
        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">
        📝 Word
      </button>
      <a href="https://www.ilovepdf.com/ru/word_to_pdf" target="_blank" rel="noopener noreferrer"
        className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">
        📄 Word→PDF
      </a>
      <button onClick={() => navigator.clipboard.writeText(text).catch(() => {})}
        className="text-xs text-gray-500 hover:text-gray-300 transition">
        📋 Nusxa
      </button>
      <button onClick={() => onSave(text)}
        className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">
        💾 Saqlash
      </button>
    </div>
  )
}
