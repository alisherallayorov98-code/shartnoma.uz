'use client'

import React, { useRef, useEffect } from 'react'
import { type FeatureConfig } from '../_config/features'

const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

type Cp = { id: string; name: string; inn?: string }

export default function DocFormFields({
  feature, formData, setFormData,
  cpSearch, setCpSearch, cpOpen, setCpOpen,
  cps,
}: {
  feature: FeatureConfig
  formData: Record<string, string>
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>
  cpSearch: Record<string, string>
  setCpSearch: React.Dispatch<React.SetStateAction<Record<string, string>>>
  cpOpen: string | null
  setCpOpen: (v: string | null) => void
  cps: Cp[]
}) {
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setCpOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [setCpOpen])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" ref={dropRef}>
      {feature.fields.map(field => {
        if (field.isCpField) {
          const search = cpSearch[field.key] ?? formData[field.key] ?? ''
          const filtered = cps.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
          return (
            <div key={field.key} className="relative">
              <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
              <input
                type="text"
                value={cpOpen === field.key ? search : (formData[field.key] || '')}
                onFocus={() => { setCpOpen(field.key); setCpSearch(p => ({ ...p, [field.key]: formData[field.key] || '' })) }}
                onChange={e => { setCpSearch(p => ({ ...p, [field.key]: e.target.value })); setCpOpen(field.key) }}
                placeholder={field.placeholder}
                className={inp}
                autoComplete="off"
              />
              {cpOpen === field.key && filtered.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {filtered.map(cp => (
                    <button key={cp.id} type="button"
                      onMouseDown={() => { setFormData(p => ({ ...p, [field.key]: cp.name })); setCpOpen(null) }}
                      className="w-full text-left px-3 py-2 hover:bg-[#1F2937] transition">
                      <div className="text-sm text-white">{cp.name}</div>
                      {cp.inn && <div className="text-xs text-gray-500">INN: {cp.inn}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        }
        return (
          <div key={field.key} className={field.textarea ? 'sm:col-span-2' : ''}>
            <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
            {field.textarea ? (
              <textarea value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder} rows={3} className={`${inp} resize-y`}/>
            ) : (
              <input type={field.type || 'text'} value={formData[field.key] || ''} onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder} className={inp}/>
            )}
          </div>
        )
      })}
    </div>
  )
}
