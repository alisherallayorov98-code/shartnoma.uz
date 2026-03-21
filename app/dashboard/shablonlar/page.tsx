'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { DEFAULT_TEMPLATES, getTplField, type AppTemplate } from '@/lib/defaultTemplates'
import { Modal, ModalActions } from '../_components/Modal'

const CONTRACT_TYPES_I18N: Record<string, Record<'uz' | 'oz' | 'ru', string>> = {
  oldi_sotdi: { uz: 'Oldi-sotdi', oz: 'Олди-сотди', ru: 'Купля-продажа' },
  xizmat:    { uz: 'Xizmat',     oz: 'Хизмат',       ru: 'Услуги' },
  ijara:     { uz: 'Ijara',      oz: 'Ижара',         ru: 'Аренда' },
  pudrat:    { uz: 'Pudrat',     oz: 'Пудрат',        ru: 'Подряд' },
  qoshimcha: { uz: "Qo'shimcha", oz: 'Қўшимча',       ru: 'Дополнительный' },
  moliyaviy: { uz: 'Moliyaviy yordam', oz: 'Молиявий ёрдам', ru: 'Финансовая помощь' },
  daval:     { uz: 'Daval',      oz: 'Давал',          ru: 'Давальческий' },
  xalqaro:   { uz: 'Xalqaro',   oz: 'Халқаро',        ru: 'Международный' },
  boshqa:    { uz: 'Boshqa',    oz: 'Бошқа',           ru: 'Другой' },
}

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
  ijara:      'bg-purple-900/60 text-purple-300',
  pudrat:     'bg-orange-900/60 text-orange-300',
  qoshimcha:  'bg-gray-700 text-gray-300',
  moliyaviy:  'bg-yellow-900/60 text-yellow-300',
  daval:      'bg-cyan-900/60 text-cyan-300',
  xalqaro:    'bg-indigo-900/60 text-indigo-300',
  boshqa:     'bg-pink-900/60 text-pink-300',
}

const emptyCustomTpl = { type: 'oldi_sotdi', name: '', description: '', content: '' }

export default function ShablonlarPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { activeOrg, isFree } = useDashboard()

  const [customTemplates, setCustomTemplates] = useState<AppTemplate[]>([])
  const [templateFilter, setTemplateFilter] = useState('barchasi')
  const [templatePreview, setTemplatePreview] = useState<AppTemplate | null>(null)
  const [customTemplateModal, setCustomTemplateModal] = useState(false)
  const [editingCustomTemplate, setEditingCustomTemplate] = useState<AppTemplate | null>(null)
  const [customTplForm, setCustomTplForm] = useState(emptyCustomTpl)
  const [saving, setSaving] = useState(false)
  const [wordImporting, setWordImporting] = useState(false)
  const wordImportRef = useRef<HTMLInputElement>(null)

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'

  useEffect(() => {
    if (activeOrg) loadCustomTemplates(activeOrg.id)
  }, [activeOrg?.id])

  async function loadCustomTemplates(orgId: string) {
    const { data, error } = await supabase.from('custom_templates')
      .select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
    if (error) { console.error('loadCustomTemplates:', error.message); return }
    setCustomTemplates((data || []).map((tpl: Record<string, unknown>) => ({
      id: tpl.id as string,
      type: tpl.type as string,
      name: tpl.name as string,
      description: (tpl.description as string) || '',
      content: tpl.content as string,
      icon: '📄',
      isDefault: false,
      tags: [],
    })))
  }

  async function saveCustomTemplate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!activeOrg) return
    if (!customTplForm.name.trim()) { alert(T(t.msg.tplNameRequired)); setSaving(false); return }
    if (!customTplForm.content.trim()) { alert(T(t.msg.tplContentReq)); setSaving(false); return }
    const payload = {
      organization_id: activeOrg.id,
      type: customTplForm.type,
      name: customTplForm.name,
      description: customTplForm.description,
      content: customTplForm.content,
    }
    let dbErr = null
    if (editingCustomTemplate) {
      const { error } = await supabase.from('custom_templates').update(payload).eq('id', editingCustomTemplate.id)
      dbErr = error
    } else {
      const { error } = await supabase.from('custom_templates').insert(payload)
      dbErr = error
    }
    setSaving(false)
    if (dbErr) { alert(`${T(t.msg.errorPrefix)}: ${dbErr.message}`); return }
    setCustomTemplateModal(false); setEditingCustomTemplate(null); setCustomTplForm(emptyCustomTpl)
    loadCustomTemplates(activeOrg.id)
  }

  async function deleteCustomTemplate(id: string) {
    if (!confirm(T(t.msg.deleteTplConfirm))) return
    await supabase.from('custom_templates').delete().eq('id', id)
    if (activeOrg) loadCustomTemplates(activeOrg.id)
  }

  async function handleWordImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.docx')) { alert('Faqat .docx formatdagi fayllar qabul qilinadi'); return }
    setWordImporting(true)
    try {
      const { convertToHtml } = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await convertToHtml({ arrayBuffer })
      const div = document.createElement('div')
      div.innerHTML = result.value
      const text = div.innerText.trim()
      if (!text) { alert("Fayl bo'sh yoki o'qib bo'lmadi"); setWordImporting(false); return }
      const baseName = file.name.replace(/\.docx$/i, '')
      setEditingCustomTemplate(null)
      setCustomTplForm({ type: 'boshqa', name: baseName, description: `Word fayldan import: ${file.name}`, content: text })
      setCustomTemplateModal(true)
    } catch {
      alert("Faylni o'qishda xatolik yuz berdi")
    } finally {
      setWordImporting(false)
      if (wordImportRef.current) wordImportRef.current.value = ''
    }
  }

  const allTemplates = [...customTemplates, ...DEFAULT_TEMPLATES]
  const filtered = templateFilter === 'barchasi' ? allTemplates : allTemplates.filter(tpl => tpl.type === templateFilter)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">📑 Shablonlar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{allTemplates.length} ta shablon</p>
        </div>

        {!isFree && (
          <>
            <input ref={wordImportRef} type="file" accept=".docx" className="hidden" onChange={handleWordImport}/>
            <button onClick={() => wordImportRef.current?.click()} disabled={wordImporting}
              title="Word (.docx) fayldan shablon yaratish — Premium"
              className="ml-auto flex items-center gap-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              {wordImporting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/><span>O'qilmoqda...</span></>
              ) : (
                <><span>📄</span><span>Word import</span><span className="text-xs bg-purple-900/60 px-1.5 py-0.5 rounded-full">Premium</span></>
              )}
            </button>
          </>
        )}

        <button onClick={() => { setEditingCustomTemplate(null); setCustomTplForm(emptyCustomTpl); setCustomTemplateModal(true) }}
          className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition ${isFree ? 'ml-auto' : ''}`}>
          {T(t.tplTab.addBtn)}
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map(tab => (
          <button key={tab.key} onClick={() => setTemplateFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              templateFilter === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
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
          <div key={tpl.id} className={`bg-gray-900 border rounded-xl p-5 flex flex-col gap-3 hover:border-gray-600 transition ${tpl.isDefault ? 'border-gray-800' : 'border-blue-800/50'}`}>
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">{tpl.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[tpl.type] || 'bg-gray-700 text-gray-300'}`}>
                    {CONTRACT_TYPES_I18N[tpl.type]?.[lang] || tpl.type}
                  </span>
                  {!tpl.isDefault && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-900/70 text-blue-300">{T(t.tplTab.myTpls)}</span>
                  )}
                </div>
                <h3 className="font-semibold text-white text-sm leading-tight">{getTplField(tpl, 'name', lang)}</h3>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed flex-1">{getTplField(tpl, 'description', lang)}</p>
            {tpl.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tpl.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded">#{tag}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1 border-t border-gray-800 flex-wrap">
              <button onClick={() => setTemplatePreview(tpl)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition font-medium">
                {T(t.tplTab.view)}
              </button>
              <button onClick={() => {
                setEditingCustomTemplate(tpl.isDefault ? null : tpl)
                setCustomTplForm({ type: tpl.type, name: tpl.name, description: tpl.description, content: tpl.content })
                setCustomTemplateModal(true)
              }} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition font-medium">
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
      <div className="bg-blue-950/40 border border-blue-900/50 rounded-xl p-4 flex gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <div className="text-sm text-blue-300">
          <p className="font-medium mb-1">Shablonlar qanday ishlaydi?</p>
          <p className="text-blue-400 text-xs leading-relaxed">
            Standart shablonlar O'zbekiston Respublikasi qonunchiligiga muvofiq tayyorlangan. "Tahrirlash" orqali ularni nusxalab o'zingizga moslashtirishingiz mumkin. "+ Shablon qo'shish" bilan yangi shablon yarating.
          </p>
        </div>
      </div>

      {/* Template preview modal */}
      {templatePreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setTemplatePreview(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{templatePreview.icon}</span>
                <div>
                  <h2 className="text-base font-semibold text-white">{getTplField(templatePreview, 'name', lang)}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[templatePreview.type] || 'bg-gray-700 text-gray-300'}`}>
                    {CONTRACT_TYPES_I18N[templatePreview.type]?.[lang] || templatePreview.type}
                  </span>
                </div>
              </div>
              <button onClick={() => setTemplatePreview(null)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 text-xl">×</button>
            </div>
            <div className="overflow-y-auto p-6">
              <pre className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">{getTplField(templatePreview, 'content', lang)}</pre>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 flex gap-3">
              <button onClick={() => navigator.clipboard.writeText(getTplField(templatePreview, 'content', lang))}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition">
                📋 Nusxa olish
              </button>
              <button onClick={() => {
                setEditingCustomTemplate(templatePreview.isDefault ? null : templatePreview)
                setCustomTplForm({ type: templatePreview.type, name: getTplField(templatePreview, 'name', lang), description: getTplField(templatePreview, 'description', lang), content: getTplField(templatePreview, 'content', lang) })
                setTemplatePreview(null)
                setCustomTemplateModal(true)
              }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition">
                Tahrirlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit custom template modal */}
      {customTemplateModal && (
        <Modal title={editingCustomTemplate ? "Shablonni tahrirlash" : T(t.tplTab.addBtn)} onClose={() => { setCustomTemplateModal(false); setEditingCustomTemplate(null); setCustomTplForm(emptyCustomTpl) }} wide>
          <form onSubmit={saveCustomTemplate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Shablon nomi *</label>
                <input className={inp} required placeholder="Tovar sotib olish shartnomasi"
                  value={customTplForm.name} onChange={e => setCustomTplForm({ ...customTplForm, name: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Tur</label>
                <select className={inp} value={customTplForm.type} onChange={e => setCustomTplForm({ ...customTplForm, type: e.target.value })}>
                  {Object.entries(CONTRACT_TYPES_I18N).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={lbl}>Tavsif</label>
                <input className={inp} placeholder="Qisqacha tavsif..."
                  value={customTplForm.description} onChange={e => setCustomTplForm({ ...customTplForm, description: e.target.value })}/>
              </div>
            </div>
            <div>
              <label className={lbl}>Shablon matni *</label>
              <textarea
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-mono resize-none"
                rows={14} required
                placeholder="Shartnoma matni..."
                value={customTplForm.content} onChange={e => setCustomTplForm({ ...customTplForm, content: e.target.value })}/>
              <p className="text-xs text-gray-600 mt-1">Tip: O'zgaruvchilar uchun &#123;&#123;TASHKILOT_NOMI&#125;&#125; ko'rinishini ishlating</p>
            </div>
            <ModalActions onClose={() => { setCustomTemplateModal(false); setEditingCustomTemplate(null); setCustomTplForm(emptyCustomTpl) }} saving={saving}/>
          </form>
        </Modal>
      )}
    </div>
  )
}
