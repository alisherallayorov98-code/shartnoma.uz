'use client'

import { useEffect } from 'react'

type Props = {
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
}

export default function ConfirmModal({ message, onConfirm, onCancel, confirmLabel = "Ha, o'chirish", danger = true }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onConfirm, onCancel])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
      onClick={onCancel}>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${danger ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
            {danger ? '🗑' : '⚠'}
          </div>
          <p className="text-white text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg text-sm font-medium transition">
            Bekor qilish
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${danger ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-yellow-700 hover:bg-yellow-600 text-white'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
