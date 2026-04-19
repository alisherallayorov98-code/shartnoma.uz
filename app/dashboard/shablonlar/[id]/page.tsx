'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../../context'
import { DEFAULT_TEMPLATES, getTplField, type AppTemplate } from '@/lib/defaultTemplates'
import { downloadTextAsWord } from '@/lib/downloadUtils'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'
import { useToast } from '@/lib/toast'

// ── Content parser ────────────────────────────────────────────────────────────

type Section = { title: string; paragraphs: string[] }

function parseContent(content: string): Section[] {
  const lines = content.split('\n')

  // Skip header: everything before the first numbered section "1. XXXX"
  const firstSectionIdx = lines.findIndex(l => /^\d+\.\s+[A-ZА-ЯЎҚҒҲ]/.test(l.trim()) && !/^\d+\.\d+/.test(l.trim()))
  if (firstSectionIdx < 0) return [{ title: 'Matn', paragraphs: lines.filter(l => l.trim()) }]

  // Stop before TOMONLARNING REKVIZITLARI
  const rekvizitIdx = lines.findIndex((l, i) => i >= firstSectionIdx && /TOMONLARNING REKVIZITLARI|РЕКВИЗИТЫ СТОРОН|TOMON(LAR)?NI(NG)? REKVIZIT/i.test(l))
  const end = rekvizitIdx > 0 ? rekvizitIdx : lines.length

  const sections: Section[] = []
  let cur: Section | null = null
  let paraBuffer: string[] = []

  const flushPara = () => {
    const text = paraBuffer.join(' ').trim()
    if (text && cur) cur.paragraphs.push(text)
    paraBuffer = []
  }

  for (let i = firstSectionIdx; i < end; i++) {
    const raw = lines[i]
    const trimmed = raw.trim()
    if (!trimmed) { flushPara(); continue }

    // Section heading: "1. SOMETHING" but NOT "1.1. ..."
    if (/^\d+\.\s+[A-ZА-ЯЎҚҒҲ]/.test(trimmed) && !/^\d+\.\d+/.test(trimmed)) {
      flushPara()
      if (cur) sections.push(cur)
      cur = { title: trimmed, paragraphs: [] }
      continue
    }

    // Paragraph start: "1.1." or "a)" or "–" bullet
    if (/^\d+\.\d+\./.test(trimmed) || /^[а-яa-z]\)/.test(trimmed) || trimmed.startsWith('–') || trimmed.startsWith('-')) {
      flushPara()
      paraBuffer = [trimmed]
      continue
    }

    // Continuation of current paragraph
    paraBuffer.push(trimmed)
  }

  flushPara()
  if (cur) sections.push(cur)
  return sections
}

// ── Type badge colors ─────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  oldi_sotdi: { bg: 'bg-blue-900/40',    text: 'text-blue-300',    border: 'border-blue-700/40' },
  xizmat:     { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-700/40' },
  ijara:      { bg: 'bg-sky-900/40',     text: 'text-sky-300',     border: 'border-sky-700/40' },
  pudrat:     { bg: 'bg-orange-900/40',  text: 'text-orange-300',  border: 'border-orange-700/40' },
  moliyaviy:  { bg: 'bg-yellow-900/40',  text: 'text-yellow-300',  border: 'border-yellow-700/40' },
  daval:      { bg: 'bg-cyan-900/40',    text: 'text-cyan-300',    border: 'border-cyan-700/40' },
  xalqaro:    { bg: 'bg-indigo-900/40',  text: 'text-indigo-300',  border: 'border-indigo-700/40' },
  boshqa:     { bg: 'bg-pink-900/40',    text: 'text-pink-300',    border: 'border-pink-700/40' },
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { activeOrg } = useDashboard()
  const { toast } = useToast()

  const id = params.id as string

  const [template, setTemplate] = useState<AppTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  // Load template: default first, then DB
  useEffect(() => {
    const def = DEFAULT_TEMPLATES.find(t => t.id === id)
    if (def) { setTemplate(def); setLoading(false); return }

    // Try DB
    supabase.from('custom_templates').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setTemplate({
            id: data.id, type: data.type, name: data.name,
            description: data.description || '', content: data.content,
            isDefault: false, icon: '📄', tags: [],
          })
        }
        setLoading(false)
      })
  }, [id])

  const content = template ? getTplField(template, 'content', lang) : ''
  const sections = useMemo(() => parseContent(content), [content])
  const typeColor = TYPE_COLORS[template?.type || ''] || { bg: 'bg-[#1F2937]', text: 'text-gray-300', border: 'border-[#1E293B]' }
  const typeName = template ? (CONTRACT_TYPES_I18N[template.type]?.[lang as 'uz' | 'oz' | 'ru'] || template.type) : ''

  function useAsContract() {
    if (!template) return
    try {
      localStorage.setItem('tpl_to_contract', JSON.stringify({
        type: template.type,
        content: getTplField(template, 'content', lang),
      }))
    } catch { /* */ }
    router.push('/dashboard/shartnomalar/yangi?from_tpl=1')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 text-lg mb-4">Shablon topilmadi</p>
        <Link href="/dashboard/shablonlar" className="text-blue-400 hover:text-blue-300 text-sm">← Shablonlarga qaytish</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Back */}
      <Link href="/dashboard/shablonlar"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        {T({ uz: 'Shablonlar', oz: 'Шаблонлар', ru: 'Шаблоны' })}
      </Link>

      {/* Header card */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
        <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#1F2937] border border-[#1E293B] flex items-center justify-center text-2xl flex-shrink-0">
              {template.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}>
                  {typeName}
                </span>
                {!template.isDefault && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/15 text-blue-400 border border-blue-600/30">
                    {T({ uz: 'Mening shablonlarim', oz: 'Менинг шаблонларим', ru: 'Мои шаблоны' })}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold text-white leading-tight">{getTplField(template, 'name', lang)}</h1>
              <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{getTplField(template, 'description', lang)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <button
              onClick={() => downloadTextAsWord(content, getTplField(template, 'name', lang))}
              title="Namuna — barcha joy-belgilar {{}} saqlanadi"
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600/15 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 hover:text-blue-300 rounded-lg text-sm transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Word (namuna)
            </button>
            {activeOrg && (
              <button
                onClick={() => {
                  const filled = content
                    .replace(/\{\{BUYURTMACHI\}\}/g, activeOrg.name || '')
                    .replace(/\{\{BUYURTMACHI_INN\}\}/g, activeOrg.inn || '')
                    .replace(/\{\{BUYURTMACHI_RAHBAR\}\}/g, activeOrg.director_name || '')
                  downloadTextAsWord(filled, getTplField(template, 'name', lang))
                }}
                title={`Tashkilot ma'lumotlari bilan to'ldirilgan holda yuklab olish (${activeOrg.name})`}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-600/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-sm transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                O'zim uchun
              </button>
            )}
            <button
              onClick={() => { navigator.clipboard.writeText(content); toast('Matn nusxalandi', 'success') }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1F2937] hover:bg-[#2D3748] border border-[#1E293B] text-gray-300 hover:text-white rounded-lg text-sm transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              {T({ uz: 'Nusxa', oz: 'Нусха', ru: 'Копировать' })}
            </button>
            <button
              onClick={useAsContract}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              {T({ uz: 'Shartnoma yarat', oz: 'Шартнома ярат', ru: 'Создать договор' })}
            </button>
          </div>
        </div>

        {/* Tags */}
        {(template.tags?.length ?? 0) > 0 && (
          <div className="px-6 pb-4 flex flex-wrap gap-1.5">
            {template.tags.map(tag => (
              <span key={tag} className="text-xs bg-[#1F2937] text-gray-500 border border-[#1E293B] px-2.5 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((sec, si) => (
          <div key={si} className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            {/* Section header */}
            <div className="px-5 py-3 bg-[#0F172A] border-b border-[#1E293B] flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-400">{si + 1}</span>
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide leading-tight">
                {sec.title.replace(/^\d+\.\s*/, '')}
              </h2>
            </div>

            {/* Paragraphs */}
            <div className="divide-y divide-[#1E293B]/60">
              {sec.paragraphs.map((para, pi) => {
                // Extract paragraph number if present
                const numMatch = para.match(/^(\d+\.\d+\.)\s*(.*)/)
                const bullet = numMatch?.[1]
                const text = numMatch?.[2] ?? para

                return (
                  <div key={pi} className="flex gap-3 px-5 py-3.5 hover:bg-[#1F2937]/40 transition">
                    {bullet && (
                      <span className="text-xs font-mono text-blue-400/70 flex-shrink-0 pt-0.5 w-10">{bullet}</span>
                    )}
                    <p className="text-sm text-gray-300 leading-relaxed flex-1">{text}</p>
                  </div>
                )
              })}
              {sec.paragraphs.length === 0 && (
                <div className="px-5 py-3 text-sm text-gray-600 italic">—</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={useAsContract}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition">
          ✍️ {T({ uz: 'Shartnoma yarat', oz: 'Шартнома ярат', ru: 'Создать договор' })}
        </button>
      </div>
    </div>
  )
}
