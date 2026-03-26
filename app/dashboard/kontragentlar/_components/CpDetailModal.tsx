'use client'

import type { Counterparty } from '@/lib/types'

interface Props {
  cp: Counterparty
  onClose: () => void
  onEdit: (cp: Counterparty) => void
  onDelete: (id: string) => void
}

export default function CpDetailModal({ cp, onClose, onEdit, onDelete }: Props) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 bg-orange-900/60 rounded-2xl flex items-center justify-center text-orange-300 font-bold text-2xl">
            {cp.name[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{cp.name}</h2>
            {cp.inn && <p className="text-xs text-gray-500 mt-0.5">INN: {cp.inn}</p>}
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-[#1F2937] text-xl">×</button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Direktor', cp.director_name],
            ['Bank', cp.bank_name],
            ['Hisob raqami', cp.bank_account],
            ['MFO', cp.mfo],
            ['Manzil', cp.address],
            ['Telefon', cp.phone],
            ['QQS', cp.qqsreg],
          ].map(([label, val]) => val ? (
            <div key={label}>
              <span className="text-gray-500 text-xs">{label}: </span>
              <span className="text-gray-300">{val}</span>
            </div>
          ) : null)}
        </div>
        <div className="flex gap-3 mt-5 pt-4 border-t border-[#1E293B]">
          <button onClick={() => onEdit(cp)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition">
            Tahrirlash
          </button>
          <button onClick={() => onDelete(cp.id)}
            className="px-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm transition">
            O&apos;chirish
          </button>
        </div>
      </div>
    </div>
  )
}
