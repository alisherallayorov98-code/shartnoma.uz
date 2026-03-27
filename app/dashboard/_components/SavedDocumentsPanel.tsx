'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadAiDocuments, updateAiDocument, deleteAiDocument } from '@/lib/aiDocuments'
import { downloadTextAsPDF, downloadTextAsWord } from '@/lib/downloadUtils'
import type { AiDocument } from '@/lib/types'

type AccentColor = 'cyan' | 'indigo' | 'blue'

interface Props {
  orgId: string
  section: 'kadrlar' | 'buxgalter' | 'kotiba'
  accentColor?: AccentColor
  refreshKey?: number
}

const ACCENT: Record<AccentColor, { border: string; text: string; btn: string; badge: string; activeFilt: string }> = {
  cyan:   { border: 'border-cyan-700/40',   text: 'text-cyan-400',   btn: 'bg-cyan-700 hover:bg-cyan-600',   badge: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',   activeFilt: 'bg-cyan-700 text-white' },
  indigo: { border: 'border-indigo-700/40', text: 'text-indigo-400', btn: 'bg-indigo-700 hover:bg-indigo-600', badge: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/40', activeFilt: 'bg-indigo-700 text-white' },
  blue:   { border: 'border-blue-700/40',   text: 'text-blue-400',   btn: 'bg-blue-600 hover:bg-blue-700',   badge: 'bg-blue-900/40 text-blue-300 border-blue-700/40',   activeFilt: 'bg-blue-600 text-white' },
}

const FEATURE_META: Record<string, { label: string; icon: string; color: string }> = {
  // Kadrlar
  mehnat_shartnoma:       { label: 'Mehnat shartnomasi',       icon: '📋', color: 'bg-blue-900/40 text-blue-300' },
  orindoshlik_shartnoma:  { label: "Tashqi o'rindoshlik",      icon: '📋', color: 'bg-blue-900/40 text-blue-300' },
  fuqaroviy_shartnoma:    { label: 'Fuqaroviy-huquqiy',        icon: '📋', color: 'bg-blue-900/40 text-blue-300' },
  maxfiylik_shartnoma:    { label: 'Maxfiylik (NDA)',           icon: '🔒', color: 'bg-purple-900/40 text-purple-300' },
  buyruq_qabul:           { label: 'Buyruq: Ishga qabul',      icon: '✅', color: 'bg-emerald-900/40 text-emerald-300' },
  buyruq_boshtash:        { label: "Buyruq: Ishdan bo'sh.",    icon: '🚪', color: 'bg-red-900/40 text-red-300' },
  tatil_buyruq:           { label: "Buyruq: Ta'til",           icon: '🌴', color: 'bg-teal-900/40 text-teal-300' },
  buyruq_lavozim:         { label: "Buyruq: Lavozim",          icon: '⬆️', color: 'bg-indigo-900/40 text-indigo-300' },
  buyruq_mukofot:         { label: 'Buyruq: Mukofot',          icon: '🏆', color: 'bg-amber-900/40 text-amber-300' },
  buyruq_jazo:            { label: 'Buyruq: Jazo',             icon: '⚠️', color: 'bg-orange-900/40 text-orange-300' },
  ishonchnoma:            { label: 'Ishonchnoma',              icon: '🤝', color: 'bg-cyan-900/40 text-cyan-300' },
  lavozim_yoriqnoma:      { label: "Lavozim yo'riqnomasi",     icon: '📖', color: 'bg-slate-700/40 text-slate-300' },
  // Buxgalter
  dalolatnoma:            { label: 'Dalolatnoma',              icon: '✅', color: 'bg-emerald-900/40 text-emerald-300' },
  talabnoma:              { label: 'Talabnoma',                icon: '📨', color: 'bg-orange-900/40 text-orange-300' },
  debitor_undirish:       { label: 'Debitor undirish',         icon: '⚖️', color: 'bg-red-900/40 text-red-300' },
  akt_sverki:             { label: 'Akt sverki',               icon: '🔄', color: 'bg-blue-900/40 text-blue-300' },
  avans_hisobot:          { label: 'Avans hisoboti',           icon: '🧾', color: 'bg-amber-900/40 text-amber-300' },
  xarajat_hisobot:        { label: 'Xarajat hisoboti',         icon: '📊', color: 'bg-indigo-900/40 text-indigo-300' },
  jarima_hisobi:          { label: 'Jarima/peni hisobi',       icon: '⚠️', color: 'bg-red-900/40 text-red-300' },
  tolov_grafigi:          { label: "To'lov grafigi",           icon: '📅', color: 'bg-teal-900/40 text-teal-300' },
  // Kotiba
  buyruq:                 { label: 'Tashkiliy buyruq',         icon: '📜', color: 'bg-indigo-900/40 text-indigo-300' },
  bayonnoma:              { label: 'Bayonnoma',                icon: '📝', color: 'bg-blue-900/40 text-blue-300' },
  rasmiy_xat:             { label: 'Rasmiy xat',               icon: '✉️', color: 'bg-slate-700/40 text-slate-300' },
  taklifnoma:             { label: 'Taklifnoma',               icon: '💌', color: 'bg-pink-900/40 text-pink-300' },
  hisobot:                { label: 'Hisobot',                  icon: '📊', color: 'bg-purple-900/40 text-purple-300' },
  eslatma:                { label: 'Eslatma',                  icon: '📌', color: 'bg-yellow-900/40 text-yellow-300' },
  murojaatnoma:           { label: 'Murojaatnoma',             icon: '📬', color: 'bg-cyan-900/40 text-cyan-300' },
  tushuntirish_xati:      { label: 'Tushuntirish xati',        icon: '💬', color: 'bg-orange-900/40 text-orange-300' },
  kafolat_xat:            { label: 'Kafolat xati',             icon: '🔐', color: 'bg-emerald-900/40 text-emerald-300' },
  tabriklash_xat:         { label: 'Tabriklash xati',          icon: '🎉', color: 'bg-rose-900/40 text-rose-300' },
  rekvizitlar_xat:        { label: 'Rekvizitlar xati',         icon: '🏦', color: 'bg-sky-900/40 text-sky-300' },
}


function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getMeta(key: string) {
  return FEATURE_META[key] || { label: key, icon: '📄', color: 'bg-gray-700/40 text-gray-300' }
}

const PAGE_SIZE = 8

export default function SavedDocumentsPanel({ orgId, section, accentColor = 'cyan', refreshKey = 0 }: Props) {
  const ac = ACCENT[accentColor]
  const [docs, setDocs] = useState<AiDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDoc, setViewDoc] = useState<AiDocument | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [showAll, setShowAll] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const list = await loadAiDocuments(orgId, section)
    setDocs(list)
    setLoading(false)
  }, [orgId, section])

  // eslint-disable-next-line
  useEffect(() => { reload() }, [reload, refreshKey])

  async function handleDelete(id: string) {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    setDeletingId(id)
    await deleteAiDocument(id)
    setDocs(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
    setConfirmDelete(null)
    if (viewDoc?.id === id) setViewDoc(null)
  }

  async function handleSaveEdit() {
    if (!viewDoc) return
    setSaving(true)
    const updated = await updateAiDocument(viewDoc.id, editContent)
    if (updated) {
      setDocs(prev => prev.map(d => d.id === updated.id ? updated : d))
      setViewDoc(updated)
    }
    setEditMode(false)
    setSaving(false)
  }

  function openView(doc: AiDocument) {
    setViewDoc(doc)
    setEditMode(false)
    setEditContent(doc.content)
    setConfirmDelete(null)
  }

  const inp = 'bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

  const filteredDocs = docs.filter(d => activeFilter === 'all' || d.feature_key === activeFilter)
  const visibleDocs = showAll ? filteredDocs : filteredDocs.slice(0, PAGE_SIZE)
  const featureKeys = [...new Set(docs.map(d => d.feature_key))]

  return (
    <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-sm font-semibold ${ac.text} flex items-center gap-2`}>
          💾 Saqlangan hujjatlar
          <span className="bg-[#1F2937] text-gray-400 text-xs rounded-full px-2 py-0.5">{docs.length}</span>
        </h2>
        <button onClick={reload} className="text-gray-500 hover:text-gray-300 text-xs transition">↺ Yangilash</button>
      </div>

      {/* Filter tabs — only if multiple types */}
      {!loading && featureKeys.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${activeFilter === 'all' ? ac.activeFilt : 'bg-[#1F2937] text-gray-400 hover:text-white'}`}>
            Barchasi <span className="opacity-60 ml-0.5">{docs.length}</span>
          </button>
          {featureKeys.map(k => {
            const m = getMeta(k)
            return (
              <button key={k} onClick={() => setActiveFilter(k)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${activeFilter === k ? ac.activeFilt : 'bg-[#1F2937] text-gray-400 hover:text-white'}`}>
                <span>{m.icon}</span> {m.label} <span className="opacity-60 ml-0.5">{docs.filter(d => d.feature_key === k).length}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-10 text-gray-500 text-sm">Yuklanmoqda…</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3 opacity-30">📂</div>
          <div className="text-gray-500 text-sm">Hali hujjat saqlanmagan</div>
          <div className="text-gray-600 text-xs mt-1">Hujjat yaratsangiz, u shu yerda ko&apos;rinadi</div>
        </div>
      ) : (
        <>
          <div className="divide-y divide-[#1E293B]">
            {visibleDocs.map(doc => {
              const m = getMeta(doc.feature_key)
              return (
                <div key={doc.id}
                  className="flex items-center gap-3 py-2.5 hover:bg-[#0F172A] rounded-lg px-2 -mx-2 transition group">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${m.color}`}>
                    {m.icon}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">{doc.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ac.badge}`}>{m.label}</span>
                      <span className="text-[10px] text-gray-600">{formatDate(doc.created_at)}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openView(doc)} title="Ko'rish"
                      className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-[#1F2937] transition text-sm">👁</button>
                    <button onClick={() => downloadTextAsWord(doc.content, doc.title)} title="Word"
                      className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-blue-300 hover:bg-blue-900/20 transition text-sm">📝</button>
                    <button onClick={() => downloadTextAsPDF(doc.content, doc.title)} title="PDF"
                      className="w-7 h-7 flex items-center justify-center rounded text-gray-500 hover:text-red-300 hover:bg-red-900/20 transition text-sm">📄</button>
                    <button onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id}
                      className={`h-7 flex items-center justify-center rounded transition text-xs px-1.5 ${
                        confirmDelete === doc.id ? 'bg-red-600 text-white' : 'text-gray-600 hover:text-red-400 hover:bg-red-900/20'
                      }`}>
                      {deletingId === doc.id ? '…' : confirmDelete === doc.id ? 'Ha?' : '🗑'}
                    </button>
                    {confirmDelete === doc.id && (
                      <button onClick={() => setConfirmDelete(null)} className="h-7 px-1 text-xs text-gray-500 hover:text-white transition">✕</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {filteredDocs.length > PAGE_SIZE && (
            <button onClick={() => setShowAll(p => !p)}
              className="w-full mt-3 py-2 text-xs text-gray-500 hover:text-gray-300 border border-[#1E293B] rounded-lg transition">
              {showAll ? '▲ Kamroq' : `▼ Yana ${filteredDocs.length - PAGE_SIZE} ta ko'rish`}
            </button>
          )}
        </>
      )}

      {/* View / Edit Modal */}
      {viewDoc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => { setViewDoc(null); setEditMode(false) }}>
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${getMeta(viewDoc.feature_key).color}`}>
                  {getMeta(viewDoc.feature_key).icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">{viewDoc.title}</h3>
                  <div className="text-xs text-gray-500 mt-0.5">{formatDate(viewDoc.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!editMode && (
                  <button onClick={() => { setEditMode(true); setEditContent(viewDoc.content) }}
                    className="text-xs bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg transition">
                    ✏️ Tahrirlash
                  </button>
                )}
                <button onClick={() => { setViewDoc(null); setEditMode(false) }}
                  className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
              </div>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {editMode ? (
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                  className={`${inp} w-full min-h-[400px] resize-y font-mono text-xs`} />
              ) : (
                <div className="bg-white text-gray-900 rounded-xl p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                  {viewDoc.content}
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#1E293B] flex gap-2 flex-wrap">
              {editMode ? (
                <>
                  <button onClick={handleSaveEdit} disabled={saving}
                    className={`flex-1 ${ac.btn} disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition`}>
                    {saving ? 'Saqlanmoqda…' : '✓ Saqlash'}
                  </button>
                  <button onClick={() => { setEditMode(false); setEditContent(viewDoc.content) }}
                    className="flex-1 bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 py-2.5 rounded-xl text-sm transition">
                    Bekor
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => downloadTextAsWord(viewDoc.content, viewDoc.title)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                    📝 Word
                  </button>
                  <button onClick={() => downloadTextAsPDF(viewDoc.content, viewDoc.title)}
                    className="flex-1 bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 py-2.5 rounded-xl text-sm transition">
                    📄 PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
