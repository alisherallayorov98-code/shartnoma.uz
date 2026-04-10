'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../../context'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'
import { useToast } from '@/lib/toast'

const CONTRACT_TYPE_LIST = Object.entries(CONTRACT_TYPES_I18N)
const VARS = ['{{BUYURTMACHI_NOMI}}', '{{IJROCHI_NOMI}}', '{{SUMMA}}', '{{SANA}}', '{{RAQAM}}', '{{SHAHAR}}']

type Bolim = { sarlavha: string; bandlar: string[] }

function bolimlarToText(bolimlar: Bolim[]): string {
  return bolimlar.filter(b => b.sarlavha.trim() || b.bandlar.some(x => x.trim())).map((sec, si) => {
    const header = `${si + 1}. ${sec.sarlavha.trim().toUpperCase()}`
    const bands = sec.bandlar.filter(b => b.trim()).map((band, bi) => `${si + 1}.${bi + 1}. ${band.trim()}`).join('\n')
    return bands ? `${header}\n\n${bands}` : header
  }).join('\n\n')
}

export default function YangiShablon() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang } = useLang()
  const { activeOrg } = useDashboard()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [meta, setMeta] = useState({ name: '', type: 'oldi_sotdi', description: '' })
  const [bolimlar, setBolimlar] = useState<Bolim[]>([{ sarlavha: '', bandlar: [''] }])

  // Word importdan kelgan ma'lumotni yuklab olish
  useEffect(() => {
    if (searchParams.get('from_word') !== '1') return
    const raw = localStorage.getItem('word_import_draft')
    if (!raw) return
    try {
      const { name, content } = JSON.parse(raw) as { name: string; content: string }
      localStorage.removeItem('word_import_draft')
      setMeta(m => ({ ...m, name }))
      setBolimlar([{ sarlavha: 'Asosiy matn', bandlar: [content] }])
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Section helpers ────────────────────────────────────────────────────────
  function addBolim() {
    setBolimlar(prev => [...prev, { sarlavha: '', bandlar: [''] }])
  }
  function removeBolim(bi: number) {
    setBolimlar(prev => prev.filter((_, i) => i !== bi))
  }
  function updateSarlavha(bi: number, val: string) {
    setBolimlar(prev => prev.map((b, i) => i === bi ? { ...b, sarlavha: val } : b))
  }
  function addBand(bi: number) {
    setBolimlar(prev => prev.map((b, i) => i === bi ? { ...b, bandlar: [...b.bandlar, ''] } : b))
  }
  function removeBand(bi: number, bdi: number) {
    setBolimlar(prev => prev.map((b, i) => i === bi ? { ...b, bandlar: b.bandlar.filter((_, j) => j !== bdi) } : b))
  }
  function updateBand(bi: number, bdi: number, val: string) {
    setBolimlar(prev => prev.map((b, i) => i === bi ? { ...b, bandlar: b.bandlar.map((x, j) => j === bdi ? val : x) } : b))
  }

  // ── Variable insert into focused textarea ─────────────────────────────────
  function insertVar(v: string) {
    const el = document.activeElement as HTMLTextAreaElement | null
    if (!el || el.tagName !== 'TEXTAREA') { toast(`${v} nusxalandi`, 'info'); navigator.clipboard.writeText(v); return }
    const start = el.selectionStart; const end = el.selectionEnd
    const bi = parseInt(el.dataset.bi || '-1'); const bdi = parseInt(el.dataset.bdi || '-1')
    if (bi < 0 || bdi < 0) return
    const newVal = el.value.slice(0, start) + v + el.value.slice(end)
    updateBand(bi, bdi, newVal)
    setTimeout(() => { el.focus(); el.setSelectionRange(start + v.length, start + v.length) }, 0)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!meta.name.trim()) { toast("Shablon nomi kiritilmadi", 'error'); return }
    const content = bolimlarToText(bolimlar)
    if (!content.trim()) { toast("Kamida bitta bo'lim va band kiriting", 'error'); return }
    if (!activeOrg) { toast("Tashkilot tanlanmagan", 'error'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('custom_templates').insert({
        organization_id: activeOrg.id,
        type: meta.type,
        name: meta.name.trim(),
        description: meta.description.trim(),
        content,
      })
      if (error) { toast("Saqlashda xato: " + error.message, 'error'); return }
      toast("Shablon saqlandi", 'success')
      router.push('/dashboard/shablonlar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Back */}
      <Link href="/dashboard/shablonlar"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Shablonlar
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Yangi shablon</h1>
          <p className="text-xs text-gray-500 mt-0.5">Bo'lim va bandlarga bo'lib yozing — avtomatik formatlashtiriladi</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* Meta */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Asosiy ma'lumotlar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Shablon nomi *</label>
              <input required value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-600 transition"
                placeholder="Masalan: Tovar sotib olish shartnomasi"/>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Shartnoma turi</label>
              <select value={meta.type} onChange={e => setMeta(m => ({ ...m, type: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 cursor-pointer transition">
                {CONTRACT_TYPE_LIST.map(([k, v]) => <option key={k} value={k}>{v[lang as 'uz'|'oz'|'ru'] || k}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Tavsif</label>
            <input value={meta.description} onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
              className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-600 transition"
              placeholder="Ushbu shablon haqida qisqacha tavsif..."/>
          </div>
        </div>

        {/* Variables hint */}
        <div className="flex items-center gap-2 flex-wrap px-1">
          <span className="text-xs text-gray-500">O'zgaruvchilar:</span>
          {VARS.map(v => (
            <button key={v} type="button" onClick={() => insertVar(v)}
              className="text-xs bg-[#111827] hover:bg-[#1F2937] border border-[#1E293B] hover:border-blue-600/40 text-blue-400 hover:text-blue-300 px-2 py-1 rounded font-mono transition">
              {v}
            </button>
          ))}
        </div>

        {/* Sections editor */}
        <div className="space-y-3">
          {bolimlar.map((bolim, bi) => (
            <div key={bi} className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">

              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0F172A] border-b border-[#1E293B]">
                <span className="text-xs font-bold text-blue-400 flex-shrink-0 w-5">{bi + 1}.</span>
                <input
                  value={bolim.sarlavha}
                  onChange={e => updateSarlavha(bi, e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm font-bold uppercase tracking-wide focus:outline-none placeholder-gray-600"
                  placeholder="BO'LIM NOMI (masalan: SHARTNOMA PREDMETI)"
                />
                {bolimlar.length > 1 && (
                  <button type="button" onClick={() => removeBolim(bi)}
                    className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-400 rounded transition flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Bands */}
              <div className="divide-y divide-[#1E293B]">
                {bolim.bandlar.map((band, bdi) => (
                  <div key={bdi} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-xs font-mono text-blue-400/70 flex-shrink-0 pt-2.5 min-w-[40px]">{bi + 1}.{bdi + 1}.</span>
                    <textarea
                      value={band}
                      onChange={e => updateBand(bi, bdi, e.target.value)}
                      data-bi={bi} data-bdi={bdi}
                      rows={2}
                      className="flex-1 bg-[#0B1220] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/10 placeholder-gray-600 resize-none transition"
                      placeholder={`${bi + 1}.${bdi + 1}. band matni...`}
                    />
                    {bolim.bandlar.length > 1 && (
                      <button type="button" onClick={() => removeBand(bi, bdi)}
                        className="mt-2 w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-400 rounded transition flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add band */}
              <div className="px-4 py-2.5 border-t border-[#1E293B]">
                <button type="button" onClick={() => addBand(bi)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition">
                  + Band qo'shish
                </button>
              </div>
            </div>
          ))}

          {/* Add section */}
          <button type="button" onClick={addBolim}
            className="w-full py-3 border-2 border-dashed border-[#1E293B] hover:border-blue-600/40 text-gray-500 hover:text-blue-400 rounded-xl text-sm transition flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Bo'lim qo'shish
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Link href="/dashboard/shablonlar"
            className="px-4 py-2.5 bg-[#1F2937] hover:bg-[#2D3748] border border-[#1E293B] text-gray-300 hover:text-white rounded-xl text-sm transition">
            Bekor qilish
          </Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition">
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
            Saqlash
          </button>
        </div>

      </form>
    </div>
  )
}
