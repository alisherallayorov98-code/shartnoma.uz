'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../../context'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'
import { useToast } from '@/lib/toast'

const CONTRACT_TYPE_LIST = Object.entries(CONTRACT_TYPES_I18N)
const VARS = ['{{BUYURTMACHI_NOMI}}', '{{IJROCHI_NOMI}}', '{{SUMMA}}', '{{SANA}}', '{{RAQAM}}', '{{SHAHAR}}']

export default function YangiShablon() {
  const router = useRouter()
  const { lang } = useLang()
  const { activeOrg } = useDashboard()
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'oldi_sotdi', description: '', content: '' })
  const [textareaEl, setTextareaEl] = useState<HTMLTextAreaElement | null>(null)

  function insertVar(v: string) {
    if (!textareaEl) {
      setForm(f => ({ ...f, content: f.content + v }))
      return
    }
    const start = textareaEl.selectionStart
    const end = textareaEl.selectionEnd
    const newContent = form.content.slice(0, start) + v + form.content.slice(end)
    setForm(f => ({ ...f, content: newContent }))
    setTimeout(() => {
      textareaEl.focus()
      textareaEl.setSelectionRange(start + v.length, start + v.length)
    }, 0)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast("Shablon nomi kiritilmadi", 'error'); return }
    if (!form.content.trim()) { toast("Shablon matni kiritilmadi", 'error'); return }
    if (!activeOrg) { toast("Tashkilot tanlanmagan", 'error'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('custom_templates').insert({
        organization_id: activeOrg.id,
        type: form.type,
        name: form.name.trim(),
        description: form.description.trim(),
        content: form.content,
      })
      if (error) { toast("Saqlashda xato: " + error.message, 'error'); return }
      toast("Shablon muvaffaqiyatli saqlandi", 'success')
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
          <p className="text-xs text-gray-500 mt-0.5">O'zingizning shartnoma shablonini yarating</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* Meta fields */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-white">Asosiy ma'lumotlar</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Shablon nomi *</label>
              <input required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-600 transition"
                placeholder="Masalan: Tovar sotib olish shartnomasi"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Shartnoma turi</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 cursor-pointer transition"
              >
                {CONTRACT_TYPE_LIST.map(([k, v]) => (
                  <option key={k} value={k}>{v[lang as 'uz' | 'oz' | 'ru'] || k}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Tavsif</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-600 transition"
              placeholder="Ushbu shablon haqida qisqacha tavsif..."
            />
          </div>
        </div>

        {/* Content editor */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 bg-[#0F172A] border-b border-[#1E293B]">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-white">Shablon matni</h2>
                <p className="text-xs text-gray-500 mt-0.5">O'zgaruvchilar uchun &#123;&#123;NOMI&#125;&#125; ko'rinishini ishlating</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {VARS.map(v => (
                  <button key={v} type="button" onClick={() => insertVar(v)}
                    className="text-xs bg-[#1F2937] hover:bg-[#2D3748] border border-[#1E293B] hover:border-blue-600/40 text-blue-400 hover:text-blue-300 px-2 py-1 rounded font-mono transition">
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <textarea
            required
            ref={el => setTextareaEl(el)}
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            className="w-full bg-[#0B1220] text-gray-200 px-5 py-4 text-sm font-mono leading-relaxed focus:outline-none resize-none"
            rows={24}
            placeholder="Shartnoma matni..."
            spellCheck={false}
          />
          <div className="px-5 py-2.5 bg-[#0F172A] border-t border-[#1E293B] flex items-center justify-between">
            <span className="text-xs text-gray-600">{form.content.length} belgi</span>
            <span className="text-xs text-gray-600">{form.content.split('\n').length} qator</span>
          </div>
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
