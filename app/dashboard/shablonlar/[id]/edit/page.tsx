'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../../../context'
import { DEFAULT_TEMPLATES, getTplField, type AppTemplate } from '@/lib/defaultTemplates'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'
import { useToast } from '@/lib/toast'

const CONTRACT_TYPE_LIST = Object.entries(CONTRACT_TYPES_I18N)
const VARS = ['{{BUYURTMACHI_NOMI}}', '{{IJROCHI_NOMI}}', '{{SUMMA}}', '{{SANA}}', '{{RAQAM}}', '{{SHAHAR}}']

type Bolim = { sarlavha: string; bandlar: string[] }

// Parse text → bolimlar structure
function textToBolimlar(content: string): Bolim[] {
  const lines = content.split('\n')
  // Find start: first numbered section heading
  const firstIdx = lines.findIndex(l => /^\d+\.\s+\S/.test(l.trim()) && !/^\d+\.\d+/.test(l.trim()))
  if (firstIdx < 0) return [{ sarlavha: '', bandlar: [content.trim()] }]
  // Find end: TOMONLARNING REKVIZITLARI
  const rekvizitIdx = lines.findIndex((l, i) => i >= firstIdx && /TOMONLARNING REKVIZITLARI|РЕКВИЗИТЫ СТОРОН/i.test(l))
  const end = rekvizitIdx > 0 ? rekvizitIdx : lines.length
  const body = lines.slice(firstIdx, end)

  const bolimlar: Bolim[] = []
  let cur: Bolim | null = null
  let bandBuf: string[] = []

  const flushBand = () => {
    const t = bandBuf.join(' ').trim()
    if (t && cur) cur.bandlar.push(t)
    bandBuf = []
  }

  for (const raw of body) {
    const t = raw.trim()
    if (!t) { flushBand(); continue }
    // Section heading: "1. TITLE"
    if (/^\d+\.\s+\S/.test(t) && !/^\d+\.\d+/.test(t)) {
      flushBand()
      if (cur) bolimlar.push(cur)
      cur = { sarlavha: t.replace(/^\d+\.\s*/, ''), bandlar: [] }
      continue
    }
    // Band: "1.1. text" or "— text" or "- text"
    if (/^\d+\.\d+\./.test(t) || t.startsWith('–') || t.startsWith('-') || /^[а-яa-z]\)/.test(t)) {
      flushBand()
      bandBuf = [t.replace(/^\d+\.\d+\.\s*/, '')]
      continue
    }
    bandBuf.push(t)
  }
  flushBand()
  if (cur) bolimlar.push(cur)

  return bolimlar.length > 0
    ? bolimlar.map(b => ({ ...b, bandlar: b.bandlar.length > 0 ? b.bandlar : [''] }))
    : [{ sarlavha: '', bandlar: [''] }]
}

// Convert bolimlar → text
function bolimlarToText(bolimlar: Bolim[]): string {
  return bolimlar
    .filter(b => b.sarlavha.trim() || b.bandlar.some(x => x.trim()))
    .map((sec, si) => {
      const header = `${si + 1}. ${sec.sarlavha.trim().toUpperCase()}`
      const bands = sec.bandlar.filter(b => b.trim()).map((band, bi) => `${si + 1}.${bi + 1}. ${band.trim()}`).join('\n')
      return bands ? `${header}\n\n${bands}` : header
    }).join('\n\n')
}

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const { lang } = useLang()
  const { activeOrg } = useDashboard()
  const { toast } = useToast()

  const id = params.id as string

  const [original, setOriginal] = useState<AppTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [meta, setMeta] = useState({ name: '', type: 'oldi_sotdi', description: '' })
  const [bolimlar, setBolimlar] = useState<Bolim[]>([{ sarlavha: '', bandlar: [''] }])

  useEffect(() => {
    const def = DEFAULT_TEMPLATES.find(t => t.id === id)
    if (def) {
      setOriginal(def)
      setMeta({ name: getTplField(def, 'name', lang), type: def.type, description: getTplField(def, 'description', lang) })
      setBolimlar(textToBolimlar(getTplField(def, 'content', lang)))
      setLoading(false)
      return
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (!isUuid) { setLoading(false); return }
    supabase.from('custom_templates').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setOriginal({ id: data.id, type: data.type, name: data.name, description: data.description || '', content: data.content, isDefault: false, icon: '📄', tags: [] })
          setMeta({ name: data.name, type: data.type, description: data.description || '' })
          setBolimlar(textToBolimlar(data.content))
        }
        setLoading(false)
      })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const isDefault = original?.isDefault ?? false

  // ── Section helpers ──────────────────────────────────────────────────────
  const addBolim = () => setBolimlar(prev => [...prev, { sarlavha: '', bandlar: [''] }])
  const removeBolim = (bi: number) => setBolimlar(prev => prev.filter((_, i) => i !== bi))
  const updateSarlavha = (bi: number, val: string) => setBolimlar(prev => prev.map((b, i) => i === bi ? { ...b, sarlavha: val } : b))
  const addBand = (bi: number) => setBolimlar(prev => prev.map((b, i) => i === bi ? { ...b, bandlar: [...b.bandlar, ''] } : b))
  const removeBand = (bi: number, bdi: number) => setBolimlar(prev => prev.map((b, i) => i === bi ? { ...b, bandlar: b.bandlar.filter((_, j) => j !== bdi) } : b))
  const updateBand = (bi: number, bdi: number, val: string) => setBolimlar(prev => prev.map((b, i) => i === bi ? { ...b, bandlar: b.bandlar.map((x, j) => j === bdi ? val : x) } : b))

  function insertVar(v: string) {
    const el = document.activeElement as HTMLTextAreaElement | null
    if (!el || el.tagName !== 'TEXTAREA') { navigator.clipboard.writeText(v); toast(`${v} nusxalandi`, 'info'); return }
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
    if (!content.trim()) { toast("Kamida bitta bo'lim kiriting", 'error'); return }
    if (!activeOrg) { toast("Tashkilot tanlanmagan", 'error'); return }
    setSaving(true)
    try {
      const payload = { organization_id: activeOrg.id, type: meta.type, name: meta.name.trim(), description: meta.description.trim(), content }
      if (isDefault) {
        const { error } = await supabase.from('custom_templates').insert(payload)
        if (error) { toast("Saqlashda xato: " + error.message, 'error'); return }
        toast("Nusxa saqlandi", 'success')
        router.push('/dashboard/shablonlar')
      } else {
        const { error } = await supabase.from('custom_templates').update(payload).eq('id', id)
        if (error) { toast("Saqlashda xato: " + error.message, 'error'); return }
        toast("Shablon yangilandi", 'success')
        router.push(`/dashboard/shablonlar/${id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!original) return (
    <div className="p-8 text-center">
      <p className="text-gray-400 text-lg mb-4">Shablon topilmadi</p>
      <Link href="/dashboard/shablonlar" className="text-blue-400 hover:text-blue-300 text-sm">← Shablonlarga qaytish</Link>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* Back */}
      <Link href={`/dashboard/shablonlar/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Shablonga qaytish
      </Link>

      {/* Default notice */}
      {isDefault && (
        <div className="flex items-start gap-3 bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-3">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-300">Standart shablon — nusxa sifatida saqlanadi</p>
            <p className="text-xs text-amber-400/80 mt-0.5 leading-relaxed">Saqlaganda bu shablon "Mening shablonlarim" bo'limiga yangi nusxa sifatida qo'shiladi.</p>
          </div>
        </div>
      )}

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

        {/* Variables */}
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
          <Link href={`/dashboard/shablonlar/${id}`}
            className="px-4 py-2.5 bg-[#1F2937] hover:bg-[#2D3748] border border-[#1E293B] text-gray-300 hover:text-white rounded-xl text-sm transition">
            Bekor qilish
          </Link>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition">
            {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>}
            {isDefault ? 'Nusxa sifatida saqlash' : 'Saqlash'}
          </button>
        </div>

      </form>
    </div>
  )
}
