'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadAiDocuments, updateAiDocument, deleteAiDocument } from '@/lib/aiDocuments'
import { downloadTextAsPDF, downloadTextAsWord } from '@/lib/downloadUtils'
import type { AiDocument } from '@/lib/types'

type AccentColor = 'cyan' | 'indigo' | 'violet'

interface Props {
  orgId: string
  section: 'kadrlar' | 'buxgalter' | 'kotiba'
  accentColor?: AccentColor
  refreshKey?: number   // increment from parent to force reload after save
}

const ACCENT: Record<AccentColor, { border: string; text: string; btn: string; badge: string }> = {
  cyan:   { border: 'border-cyan-700/40',   text: 'text-cyan-400',   btn: 'bg-cyan-700 hover:bg-cyan-600',   badge: 'bg-cyan-900/50 text-cyan-300' },
  indigo: { border: 'border-indigo-700/40', text: 'text-indigo-400', btn: 'bg-indigo-700 hover:bg-indigo-600', badge: 'bg-indigo-900/50 text-indigo-300' },
  violet: { border: 'border-violet-700/40', text: 'text-violet-400', btn: 'bg-violet-700 hover:bg-violet-600', badge: 'bg-violet-900/50 text-violet-300' },
}

const FEATURE_LABELS: Record<string, string> = {
  // Kadrlar — shartnomalar
  mehnat_shartnoma: 'Mehnat shartnomasi',
  orindoshlik_shartnoma: "Tashqi o'rindoshlik shartnomasi",
  fuqaroviy_shartnoma: 'Fuqaroviy-huquqiy yollanma',
  maxfiylik_shartnoma: 'Maxfiylik (NDA) shartnomasi',
  // Kadrlar — buyruqlar
  buyruq_qabul: 'Buyruq: Ishga qabul',
  buyruq_boshtash: "Buyruq: Ishdan bo'shatish",
  tatil_buyruq: "Buyruq: Ta'til",
  buyruq_lavozim: "Buyruq: Lavozim o'zgartirish",
  buyruq_mukofot: 'Buyruq: Mukofot',
  buyruq_jazo: "Buyruq: Intizomiy jazo",
  // Kadrlar — boshqa
  ishonchnoma: 'Ishonchnoma',
  lavozim_yoriqnoma: "Lavozim yo'riqnomasi",
  // Buxgalter
  dalolatnoma: 'Dalolatnoma',
  talabnoma: 'Talabnoma', tolov_grafigi: "To'lov grafigi", debitor_undirish: 'Debitor undirish',
  // Kotiba
  bayonnoma: "Bayonnoma", rasmiy_xat: 'Rasmiy xat', taklifnoma: 'Taklifnoma',
  hisobot: 'Hisobot', eslatma: 'Eslatma', murojaatnoma: 'Murojaatnoma',
  tushuntirish_xati: 'Tushuntirish xati', kafolat_xat: 'Kafolat xati',
  tabriklash_xat: 'Tabriklash xati', rekvizitlar_xat: 'Rekvizitlar xati',
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  belgilanmagan_muddatli: 'Belgilanmagan muddatli',
  belgilangan_muddatli: 'Belgilangan muddatli',
  yarim_stavkada: 'Yarim stavkada',
  masofaviy: 'Masofaviy',
  amaliyot: 'Amaliyot',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

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

  const reload = useCallback(async () => {
    setLoading(true)
    const list = await loadAiDocuments(orgId, section)
    setDocs(list)
    setLoading(false)
  }, [orgId, section])

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

  function openEdit(doc: AiDocument) {
    setViewDoc(doc)
    setEditContent(doc.content)
    setEditMode(true)
  }

  const inp = 'bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-500'

  return (
    <div className={`bg-gray-900 border ${ac.border} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-sm font-semibold ${ac.text} flex items-center gap-2`}>
          💾 Saqlangan hujjatlar
          <span className="bg-gray-800 text-gray-400 text-xs rounded-full px-2 py-0.5">
            {docs.length}
          </span>
        </h2>
        <button onClick={reload} className="text-gray-500 hover:text-gray-300 text-xs transition" title="Yangilash">
          ↺ Yangilash
        </button>
      </div>

      {!loading && docs.length > 0 && (() => {
        const keys = [...new Set(docs.map(d => d.feature_key))]
        if (keys.length <= 1) return null
        return (
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs transition ${activeFilter === 'all' ? `${ac.btn} text-white` : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              Barchasi <span className="text-gray-500 ml-0.5">{docs.length}</span>
            </button>
            {keys.map(k => (
              <button key={k} onClick={() => setActiveFilter(k)}
                className={`px-2.5 py-1 rounded-lg text-xs transition ${activeFilter === k ? `${ac.btn} text-white` : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {FEATURE_LABELS[k] || k} <span className="text-gray-500 ml-0.5">{docs.filter(d => d.feature_key === k).length}</span>
              </button>
            ))}
          </div>
        )
      })()}

      {loading ? (
        <div className="text-center py-8 text-gray-600 text-sm">Yuklanmoqda…</div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-sm">
          Hali hujjat saqlanmagan. Hujjat yaratsangiz, u shu yerda ko&apos;rinadi.
        </div>
      ) : (
        <div className="space-y-2">
          {docs.filter(d => activeFilter === 'all' || d.feature_key === activeFilter).map(doc => (
            <div key={doc.id}
              className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-3 flex items-center gap-3 group hover:border-gray-600 transition">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-medium truncate">{doc.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ac.badge}`}>
                    {FEATURE_LABELS[doc.feature_key] || doc.feature_key}
                  </span>
                  {doc.meta?.contract_type && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                      {CONTRACT_TYPE_LABELS[doc.meta.contract_type] || doc.meta.contract_type}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{formatDate(doc.created_at)}</div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openView(doc)} title="Ko'rish"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition text-sm">
                  👁
                </button>
                <button onClick={() => openEdit(doc)} title="Tahrirlash"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition text-sm">
                  ✏️
                </button>
                <button onClick={() => downloadTextAsWord(doc.content, doc.title)} title="Word"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-300 hover:bg-blue-900/30 transition text-sm">
                  📝
                </button>
                <button onClick={() => downloadTextAsPDF(doc.content, doc.title)} title="PDF"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-300 hover:bg-red-900/30 transition text-sm">
                  📄
                </button>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className={`h-8 flex items-center justify-center rounded-lg transition text-xs px-2 ${
                    confirmDelete === doc.id
                      ? 'bg-red-700 hover:bg-red-600 text-white'
                      : 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                  }`}
                >
                  {deletingId === doc.id ? '…' : confirmDelete === doc.id ? "Ha, o'chirish" : '🗑'}
                </button>
                {confirmDelete === doc.id && (
                  <button onClick={() => setConfirmDelete(null)}
                    className="h-8 px-2 text-xs text-gray-400 hover:text-white transition">
                    Bekor
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View / Edit Modal */}
      {viewDoc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => { setViewDoc(null); setEditMode(false) }}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h3 className="font-semibold text-white text-sm">{viewDoc.title}</h3>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                  <span>{formatDate(viewDoc.created_at)}</span>
                  {viewDoc.meta?.contract_type && (
                    <span className={`px-1.5 py-0.5 rounded ${ac.badge}`}>
                      {CONTRACT_TYPE_LABELS[viewDoc.meta.contract_type] || viewDoc.meta.contract_type}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <button onClick={() => setEditMode(true)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition">
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
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  className={`${inp} w-full min-h-[400px] resize-y font-mono text-xs`}
                />
              ) : (
                <div className="bg-white text-gray-900 rounded-xl p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                  {viewDoc.content}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-800 flex gap-2 flex-wrap">
              {editMode ? (
                <>
                  <button onClick={handleSaveEdit} disabled={saving}
                    className={`flex-1 ${ac.btn} disabled:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-semibold transition`}>
                    {saving ? 'Saqlanmoqda…' : '✓ Saqlash'}
                  </button>
                  <button onClick={() => { setEditMode(false); setEditContent(viewDoc.content) }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl text-sm transition">
                    Bekor
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => downloadTextAsWord(viewDoc.content, viewDoc.title)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                    📝 Word
                  </button>
                  <button onClick={() => downloadTextAsPDF(viewDoc.content, viewDoc.title)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl text-sm transition">
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
