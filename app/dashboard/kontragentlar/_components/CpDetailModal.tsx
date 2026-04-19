'use client'

import { useRouter } from 'next/navigation'
import type { Counterparty } from '@/lib/types'

interface Props {
  cp: Counterparty
  onClose: () => void
  onEdit: (cp: Counterparty) => void
  onDelete: (id: string) => void
}

export default function CpDetailModal({ cp, onClose, onEdit, onDelete }: Props) {
  const router = useRouter()

  function copyRekvizit() {
    const lines = [
      cp.name,
      cp.inn ? `STIR: ${cp.inn}` : null,
      cp.director_name ? `Rahbar: ${cp.director_name}` : null,
      cp.address ? `Manzil: ${cp.address}` : null,
      cp.bank_name ? `Bank: ${cp.bank_name}` : null,
      cp.bank_account ? `H/r: ${cp.bank_account}` : null,
      cp.mfo ? `MFO: ${cp.mfo}` : null,
      cp.phone ? `Tel: ${cp.phone}` : null,
      cp.qqsreg ? `QQS: ${cp.qqsreg}` : null,
    ].filter(Boolean)
    navigator.clipboard.writeText(lines.join('\n'))
  }

  const fields: [string, string | null | undefined][] = [
    ['Rahbar', cp.director_name],
    ['Manzil', cp.address],
    ['Bank', cp.bank_name],
    ['Hisob raqami', cp.bank_account],
    ['MFO', cp.mfo],
    ['Telefon', cp.phone],
    ['QQS raqami', cp.qqsreg],
  ]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-4 p-6 pb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0"
            style={{ backgroundColor: stringToColor(cp.name, 0.2), color: stringToColor(cp.name, 0.7) }}>
            {cp.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight">{cp.name}</h2>
            {cp.inn && <p className="text-xs text-gray-500 mt-0.5 font-mono">STIR: {cp.inn}</p>}
            {cp.stir_status === 'active' && (
              <span className="inline-block text-[10px] bg-green-900/40 text-green-400 border border-green-700/30 px-1.5 py-0.5 rounded-full mt-1">✓ Faol</span>
            )}
            {cp.stir_status === 'inactive' && (
              <span className="inline-block text-[10px] bg-red-900/40 text-red-400 border border-red-700/30 px-1.5 py-0.5 rounded-full mt-1">⚠ Faol emas</span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-[#1F2937] text-xl flex-shrink-0">×</button>
        </div>

        {/* Fields */}
        <div className="px-6 pb-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          {fields.map(([label, val]) => (
            <div key={label}>
              <span className="text-gray-500 text-xs block">{label}</span>
              <span className={val ? 'text-gray-200' : 'text-gray-600 italic'}>
                {val || '—'}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-6 py-4 border-t border-[#1E293B] flex-wrap">
          <button
            onClick={() => { onClose(); router.push(`/dashboard/shartnomalar/yangi?cp_id=${cp.id}`) }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-semibold transition">
            ✍️ Shartnoma yarat
          </button>
          <button onClick={copyRekvizit}
            className="flex items-center gap-1.5 bg-[#1F2937] hover:bg-[#2D3748] border border-[#1E293B] text-gray-300 hover:text-white px-3 py-2 rounded-lg text-xs transition"
            title="Rekvizitlarni clipboard'ga nusxalash">
            📋 Rekvizit nusxalash
          </button>
          <button onClick={() => onEdit(cp)}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium transition">
            Tahrirlash
          </button>
          <button onClick={() => onDelete(cp.id)}
            className="bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg text-xs transition">
            O&apos;chirish
          </button>
        </div>
      </div>
    </div>
  )
}

function stringToColor(str: string, lightness: number): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 60%, ${Math.round(lightness * 100)}%)`
}
