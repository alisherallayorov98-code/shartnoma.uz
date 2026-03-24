'use client'

import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'

export function Modal({ title, onClose, children, wide, xl }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; xl?: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-[#111827] border border-[#1E293B] rounded-2xl w-full ${xl ? 'max-w-4xl' : wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition text-xl">×</button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export function ModalActions({ onClose, saving }: { onClose: () => void; saving: boolean }) {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="flex-1 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 py-2.5 rounded-lg text-sm transition">
        {T(t.btn.cancel)}
      </button>
      <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
        {saving ? T(t.btn.saving) : T(t.btn.save)}
      </button>
    </div>
  )
}
