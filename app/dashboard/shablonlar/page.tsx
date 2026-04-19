'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { DEFAULT_TEMPLATES, getTplField, type AppTemplate } from '@/lib/defaultTemplates'
import ConfirmModal from '../_components/ConfirmModal'
import { useToast } from '@/lib/toast'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'

const TYPE_TABS = [
  { key: 'barchasi', label: 'Barchasi' },
  { key: 'oldi_sotdi', label: 'Oldi-sotdi' },
  { key: 'xizmat', label: "Xizmat ko'rsatish" },
  { key: 'ijara', label: 'Ijara' },
  { key: 'pudrat', label: 'Pudrat' },
  { key: 'qoshimcha', label: "Qo'shimcha" },
  { key: 'moliyaviy', label: 'Moliyaviy yordam' },
  { key: 'daval', label: 'Daval' },
  { key: 'xalqaro', label: 'Xalqaro' },
  { key: 'boshqa', label: 'Boshqa' },
]

const typeColors: Record<string, string> = {
  oldi_sotdi: 'bg-blue-900/60 text-blue-300',
  xizmat:     'bg-emerald-900/60 text-emerald-300',
  ijara:      'bg-blue-600/10 text-blue-400',
  pudrat:     'bg-orange-900/60 text-orange-300',
  qoshimcha:  'bg-[#1F2937] text-gray-300',
  moliyaviy:  'bg-yellow-900/60 text-yellow-300',
  daval:      'bg-cyan-900/60 text-cyan-300',
  xalqaro:    'bg-indigo-900/60 text-indigo-300',
  boshqa:     'bg-pink-900/60 text-pink-300',
}

type DbCustomTemplate = {
  id: string; type: string; name: string
  description: string | null; content: string
}

export default function ShablonlarPage() {
  const router = useRouter()
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { activeOrg, isFree } = useDashboard()
  const { toast } = useToast()

  const [customTemplates, setCustomTemplates] = useState<AppTemplate[]>([])
  const [templateFilter, setTemplateFilter] = useState('barchasi')
  const [wordImporting, setWordImporting] = useState(false)
  const wordImportRef = useRef<HTMLInputElement>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (activeOrg) loadCustomTemplates(activeOrg.id)
  }, [activeOrg?.id])

  async function loadCustomTemplates(orgId: string) {
    const { data, error } = await supabase.from('custom_templates')
      .select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
    if (error) { console.error('loadCustomTemplates:', error.message); return }
    setCustomTemplates((data as DbCustomTemplate[]).map(tpl => ({
      id: tpl.id,
      type: tpl.type,
      name: tpl.name,
      description: tpl.description || '',
      content: tpl.content,
      icon: '📄',
      isDefault: false,
      tags: [],
    })))
  }

  function deleteCustomTemplate(id: string) {
    setConfirmDeleteId(id)
  }

  async function doDeleteCustomTemplate(id: string) {
    const { error } = await supabase.from('custom_templates').delete().eq('id', id)
    if (error) { toast(`O'chirishda xato: ${error.message}`, 'error'); return }
    if (activeOrg) loadCustomTemplates(activeOrg.id)
  }

  async function handleWordImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.docx')) { toast('Faqat .docx formatdagi fayllar qabul qilinadi', 'error'); return }
    setWordImporting(true)
    try {
      const { convertToHtml } = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await convertToHtml({ arrayBuffer })
      const div = document.createElement('div')
      div.innerHTML = result.value
      const text = div.innerText.trim()
      if (!text) { toast("Fayl bo'sh yoki o'qib bo'lmadi", 'error'); setWordImporting(false); return }
      const baseName = file.name.replace(/\.docx$/i, '')
      localStorage.setItem('word_import_draft', JSON.stringify({ name: baseName, content: text }))
      router.push('/dashboard/shablonlar/yangi?from_word=1')
    } catch (err) {
      toast(err instanceof Error ? err.message : "Faylni o'qishda xatolik yuz berdi", 'error')
    } finally {
      setWordImporting(false)
      if (wordImportRef.current) wordImportRef.current.value = ''
    }
  }

  const allTemplates = useMemo(
    () => [...customTemplates, ...DEFAULT_TEMPLATES],
    [customTemplates]
  )

  const filtered = useMemo(
    () => templateFilter === 'barchasi' ? allTemplates : allTemplates.filter(tpl => tpl.type === templateFilter),
    [allTemplates, templateFilter]
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">📑 {T({ uz: 'Shablonlar', oz: 'Шаблонлар', ru: 'Шаблоны' })}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{allTemplates.length} {T({ uz: 'ta shablon', oz: 'та шаблон', ru: 'шаблонов' })}</p>
        </div>

        {!isFree && (
          <>
            <input ref={wordImportRef} type="file" accept=".docx" className="hidden" onChange={handleWordImport}/>
            <button onClick={() => wordImportRef.current?.click()} disabled={wordImporting}
              title="Word (.docx) fayldan shablon yaratish — Premium"
              className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              {wordImporting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/><span>O'qilmoqda...</span></>
              ) : (
                <><span>📄</span><span>Word import</span><span className="text-xs bg-blue-600/30 px-1.5 py-0.5 rounded-full">Premium</span></>
              )}
            </button>
          </>
        )}

        <button onClick={() => router.push('/dashboard/shablonlar/yangi')}
          className={`flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition ${isFree ? 'ml-auto' : ''}`}>
          {T(t.tplTab.addBtn)}
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map(tab => (
          <button key={tab.key} onClick={() => setTemplateFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              templateFilter === tab.key ? 'bg-blue-600 text-white' : 'bg-[#111827] border border-[#1E293B] text-gray-400 hover:text-white hover:bg-[#1F2937]'
            }`}>
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              {tab.key === 'barchasi' ? allTemplates.length : allTemplates.filter(x => x.type === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(tpl => (
          <div key={tpl.id} className={`bg-[#111827] border rounded-xl p-5 flex flex-col gap-3 hover:border-blue-600/50 transition ${tpl.isDefault ? 'border-[#1E293B]' : 'border-blue-600/30'}`}>
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">{tpl.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[tpl.type] || 'bg-[#1F2937] text-gray-300'}`}>
                    {CONTRACT_TYPES_I18N[tpl.type]?.[lang] || tpl.type}
                  </span>
                  {!tpl.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-600/10 text-blue-400">{T(t.tplTab.myTpls)}</span>
                  )}
                </div>
                <h3 className="font-semibold text-white text-sm leading-tight">{getTplField(tpl, 'name', lang)}</h3>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed flex-1">{getTplField(tpl, 'description', lang)}</p>
            {(tpl.tags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1">
                {tpl.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs bg-[#1F2937] text-gray-500 px-2 py-0.5 rounded">#{tag}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1 border-t border-[#1E293B] flex-wrap">
              <button onClick={() => router.push(`/dashboard/shablonlar/${tpl.id}`)}
                title="Shablonni ko'rish, Word yuklab olish va shartnoma yaratish"
                className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition font-medium">
                {T(t.tplTab.view)}
              </button>
              <button onClick={() => router.push(`/dashboard/shablonlar/${tpl.id}/edit`)}
                title="Shablonni nusxalab o'zingizga moslang"
                className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition font-medium">
                {T(t.btn.edit)}
              </button>
              {!tpl.isDefault && (
                <button onClick={() => deleteCustomTemplate(tpl.id)}
                  className="text-xs text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition font-medium">
                  {T(t.btn.delete)}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 flex gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <div className="text-sm text-blue-400">
          <p className="font-medium mb-1">{T({ uz: "Shablonlar qanday ishlaydi?", oz: "Шаблонлар қандай ишлайди?", ru: "Как работают шаблоны?" })}</p>
          <p className="text-blue-400 text-xs leading-relaxed">
            {T({ uz: "Standart shablonlar O'zbekiston Respublikasi qonunchiligiga muvofiq tayyorlangan. \"Tahrirlash\" orqali ularni nusxalab o'zingizga moslashtirishingiz mumkin.", oz: "Стандарт шаблонлар Ўзбекистон Республикаси қонунчилигига мувофиқ тайёрланган. \"Таҳрирлаш\" орқали уларни нусхалаб ўзингизга мослаштиришингиз мумкин.", ru: "Стандартные шаблоны подготовлены в соответствии с законодательством Республики Узбекистан. Через «Редактировать» вы можете скопировать и настроить их под себя." })}
          </p>
        </div>
      </div>

      {confirmDeleteId && (
        <ConfirmModal
          message={T(t.msg.deleteTplConfirm)}
          onConfirm={() => { const id = confirmDeleteId; setConfirmDeleteId(null); doDeleteCustomTemplate(id) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
