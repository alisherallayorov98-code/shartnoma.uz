'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export const BIRLIKLAR = [
  'dona', 'kg', 'g', 'tonna', 'litr', 'ml',
  'm', 'sm', 'mm', 'm²', 'm³', 'km',
  'pogon metr', 'juft', "to'plam", 'quti', 'paket', 'sumka',
  'soat', 'kun', 'oy', 'yil', 'ish', 'xizmat',
]

interface BirlikPickerProps {
  value: string
  onChange: (v: string) => void
  className?: string
}

export function BirlikPicker({ value, onChange, className }: BirlikPickerProps) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const [pos, setPos]       = useState({ top: 0, left: 0, width: 0, openUp: false })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (
        btnRef.current && btnRef.current.contains(e.target as Node)
      ) return
      if (
        dropRef.current && dropRef.current.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const dropH = 220
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < dropH && rect.top > dropH
    setPos({
      top: openUp ? rect.top - dropH - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 160),
      openUp,
    })
    setSearch('')
    setOpen(o => !o)
  }

  const filtered = BIRLIKLAR.filter(b => b.toLowerCase().includes(search.toLowerCase()))
  const isCustom  = search && !BIRLIKLAR.includes(search)

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded px-2 py-1.5 text-xs text-left flex items-center justify-between gap-1 hover:border-blue-600/50 transition"
      >
        <span className="truncate">{value || 'dona'}</span>
        <svg className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropRef}
          className="fixed z-[9999] bg-[#111827] border border-[#1E293B] rounded-lg shadow-2xl flex flex-col"
          style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: 220 }}
        >
          <div className="p-1.5 border-b border-[#1E293B]">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish…"
              className="w-full bg-[#0F172A] text-gray-200 text-xs px-2 py-1.5 rounded border border-[#1E293B] focus:outline-none focus:border-blue-600 placeholder-gray-500"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(b => (
              <button key={b} type="button"
                onClick={() => { onChange(b); setOpen(false); setSearch('') }}
                className={`w-full text-left px-3 py-1.5 text-xs transition hover:bg-[#1F2937] ${value === b ? 'text-blue-400 bg-blue-900/20' : 'text-gray-200'}`}>
                {b}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500">Topilmadi</div>
            )}
          </div>
          {isCustom && (
            <div className="p-1.5 border-t border-[#1E293B]">
              <button type="button"
                onClick={() => { onChange(search); setOpen(false); setSearch('') }}
                className="w-full text-left text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-900/20 transition">
                + &quot;{search}&quot; — o&apos;zim yozaman
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
