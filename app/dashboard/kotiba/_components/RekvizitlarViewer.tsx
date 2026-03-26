'use client'

import { useState, useRef } from 'react'
import { downloadRekvizitlarWord, downloadRekvizitlarPDF } from '@/lib/downloadUtils'

interface Org {
  name: string
  inn?: string
  director_name?: string
  bank_name?: string
  bank_account?: string
  mfo?: string
  address?: string
  phone?: string
}

const FIELDS = [
  { key: 'name',         label: 'Tashkilot nomi' },
  { key: 'inn',          label: 'STIR' },
  { key: 'director_name',label: 'Rahbar' },
  { key: 'address',      label: 'Yuridik manzil' },
  { key: 'bank_name',    label: 'Bank' },
  { key: 'bank_account', label: 'Hisob raqami (X/R)' },
  { key: 'mfo',          label: 'MFO' },
  { key: 'phone',        label: 'Telefon' },
] as const

export default function RekvizitlarViewer({ org }: { org: Org }) {
  const [copied, setCopied] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const rows = FIELDS.map(f => ({ label: f.label, value: (org as unknown as Record<string, string>)[f.key] || '' })).filter(r => r.value)

  function copyText() {
    const text = rows.map(r => `${r.label}: ${r.value}`).join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied('text'); setTimeout(() => setCopied(null), 2000)
    })
  }

  async function downloadImage() {
    const W = 740, PAD = 36, LINE = 34, TITLE_H = 64
    const H = TITLE_H + 20 + rows.length * LINE + PAD * 2
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = W * scale
    canvas.height = H * scale
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)

    // Background + border
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, W - 1, H - 1)

    // Title background
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, W, TITLE_H)

    // Title
    ctx.fillStyle = '#111827'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('TASHKILOT REKVIZITLARI', W / 2, PAD + 20)

    // Line under title
    ctx.beginPath()
    ctx.moveTo(0, TITLE_H)
    ctx.lineTo(W, TITLE_H)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ctx.stroke()

    // Rows
    let y = TITLE_H + 28
    ctx.textAlign = 'left'
    for (const row of rows) {
      ctx.font = '12px Arial'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(row.label, PAD, y)
      ctx.font = '13px Arial'
      ctx.fillStyle = '#111827'
      ctx.fillText(row.value, 200, y)
      // divider
      ctx.beginPath()
      ctx.moveTo(PAD, y + 10)
      ctx.lineTo(W - PAD, y + 10)
      ctx.strokeStyle = '#f1f5f9'
      ctx.lineWidth = 0.5
      ctx.stroke()
      y += LINE
    }

    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${org.name}_rekvizitlar.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  function downloadPdf() {
    downloadRekvizitlarPDF(rows, org.name)
  }

  return (
    <div className="space-y-4">
      {/* Preview card */}
      <div ref={cardRef} className="bg-white rounded-xl border border-[#1E293B] overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 text-center">
          <h3 className="font-bold text-gray-900 text-sm tracking-widest">TASHKILOT REKVIZITLARI</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {rows.map(row => (
            <div key={row.label} className="flex items-start px-5 py-2.5 gap-4">
              <div className="text-xs text-gray-500 w-36 shrink-0 pt-0.5">{row.label}</div>
              <div className="text-sm text-gray-900 font-medium flex-1">{row.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => downloadRekvizitlarWord({
            orgName: org.name, orgInn: org.inn, orgDirector: org.director_name,
            orgBankName: org.bank_name, orgBankAccount: org.bank_account,
            orgMfo: org.mfo, orgAddress: org.address, orgPhone: org.phone,
          })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          📝 Word
        </button>
        <button
          onClick={downloadPdf}
          className="flex items-center gap-2 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          📄 PDF
        </button>
        <button
          onClick={downloadImage}
          className="flex items-center gap-2 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          🖼 Rasm
        </button>
        <button
          onClick={copyText}
          className="flex items-center gap-2 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          {copied === 'text' ? '✓ Nusxalandi' : '📋 Matn'}
        </button>
      </div>
    </div>
  )
}
