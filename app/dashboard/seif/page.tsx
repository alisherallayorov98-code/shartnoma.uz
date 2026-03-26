'use client'

import { useState, useEffect, useRef } from 'react'
import { useDashboard } from '../context'
import { supabase } from '@/lib/supabase'

type OrgDoc = {
  id: string
  name: string
  category: string
  file_path: string
  file_size: number
  created_at: string
}

const CATEGORIES = [
  { key: 'barchasi',   label: 'Barchasi',                icon: '📂' },
  { key: 'guvohnoma', label: "Ro'yxat guvohnomalari",   icon: '🏛️' },
  { key: 'ustav',     label: 'Ustav / Nizom',            icon: '📜' },
  { key: 'litsenziya',label: 'Litsenziyalar',            icon: '✅' },
  { key: 'bank',      label: 'Bank hujjatlari',          icon: '🏦' },
  { key: 'soliq',     label: 'Soliq hujjatlari',         icon: '🧾' },
  { key: 'boshqa',    label: 'Boshqa',                   icon: '📁' },
]

const MAX_DOCS = 20
const MAX_FILE_MB = 20

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function compressImageToPdf(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = async () => {
      URL.revokeObjectURL(url)
      const MAX_W = 1240
      const MAX_H = 1754
      let w = img.width
      let h = img.height
      const ratio = Math.min(MAX_W / w, MAX_H / h, 1)
      w = Math.round(w * ratio)
      h = Math.round(h * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      const imgData = canvas.toDataURL('image/jpeg', 0.78)
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit: 'px', format: [w, h] })
      doc.addImage(imgData, 'JPEG', 0, 0, w, h)
      resolve(doc.output('blob'))
    }
    img.onerror = reject
    img.src = url
  })
}

export default function SeifPage() {
  const { activeOrg } = useDashboard()
  const [docs, setDocs] = useState<OrgDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [activeCategory, setActiveCategory] = useState('barchasi')
  const [dragOver, setDragOver] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('boshqa')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadDocs() {
    if (!activeOrg) return
    setLoading(true)
    const { data } = await supabase
      .from('org_documents')
      .select('*')
      .eq('organization_id', activeOrg.id)
      .order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  useEffect(() => { loadDocs() }, [activeOrg?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFiles(files: FileList | null) {
    if (!files || !activeOrg) return
    const file = files[0]
    if (!file) return

    setUploadError('')

    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'

    if (!isImage && !isPdf) {
      setUploadError('Faqat PDF yoki rasm (JPG, PNG) yuklash mumkin')
      return
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(`Fayl hajmi ${MAX_FILE_MB}MB dan oshmasligi kerak`)
      return
    }
    if (docs.length >= MAX_DOCS) {
      setUploadError(`Maksimal ${MAX_DOCS} ta hujjat saqlash mumkin`)
      return
    }

    setUploading(true)
    try {
      let uploadBlob: Blob
      let finalName: string

      if (isImage) {
        setUploadProgress('Rasm siqilmoqda...')
        uploadBlob = await compressImageToPdf(file)
        finalName = file.name.replace(/\.[^.]+$/, '') + '.pdf'
      } else {
        uploadBlob = file
        finalName = file.name
      }

      setUploadProgress("Supabase ga yuklanmoqda...")
      const filePath = `${activeOrg.id}/${Date.now()}-${finalName}`

      const { error: storageError } = await supabase.storage
        .from('org-documents')
        .upload(filePath, uploadBlob, { contentType: 'application/pdf' })

      if (storageError) { setUploadError(storageError.message); return }

      const { error: dbError } = await supabase.from('org_documents').insert({
        organization_id: activeOrg.id,
        name: finalName,
        category: uploadCategory,
        file_path: filePath,
        file_size: uploadBlob.size,
      })

      if (dbError) {
        await supabase.storage.from('org-documents').remove([filePath])
        setUploadError(dbError.message)
        return
      }

      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadDocs()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Xatolik yuz berdi')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  async function handleDownload(doc: OrgDoc) {
    const { data, error } = await supabase.storage
      .from('org-documents')
      .createSignedUrl(doc.file_path, 120)
    if (error || !data) return
    const a = document.createElement('a')
    a.href = data.signedUrl
    a.download = doc.name
    a.target = '_blank'
    a.click()
  }

  async function handleDelete(doc: OrgDoc) {
    if (!confirm(`"${doc.name}" o'chirilsinmi?`)) return
    setDeleting(prev => new Set(prev).add(doc.id))
    try {
      await supabase.storage.from('org-documents').remove([doc.file_path])
      await supabase.from('org_documents').delete().eq('id', doc.id)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
    } finally {
      setDeleting(prev => { const s = new Set(prev); s.delete(doc.id); return s })
    }
  }

  const filtered = activeCategory === 'barchasi'
    ? docs
    : docs.filter(d => d.category === activeCategory)

  const totalSize = docs.reduce((s, d) => s + d.file_size, 0)
  const usedPercent = Math.min((docs.length / MAX_DOCS) * 100, 100)

  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0B1220]">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-xl">🔒</span>
            Seif
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Korporativ hujjatlarni xavfsiz saqlang — istalgan qurilmadan kirish
          </p>
        </div>

        {/* Ogohlantirish */}
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-3 text-xs text-amber-300 flex items-start gap-2">
          <span className="mt-0.5 shrink-0">⚠️</span>
          <span>
            Shaxsiy ma&apos;lumotlar (pasport, ID nusxalari, xodimlar ma&apos;lumotlari) <strong>yuklamang</strong>.
            Faqat korporativ hujjatlar saqlang.
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{docs.length}</div>
            <div className="text-xs text-gray-500 mt-1">Hujjatlar</div>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{MAX_DOCS - docs.length}</div>
            <div className="text-xs text-gray-500 mt-1">Bo&apos;sh joy</div>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">{formatSize(totalSize)}</div>
            <div className="text-xs text-gray-500 mt-1">Jami hajm</div>
          </div>
        </div>

        {/* Progress bar */}
        {docs.length > 0 && (
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl px-4 py-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Saqlash joyi</span>
              <span>{docs.length} / {MAX_DOCS} hujjat</span>
            </div>
            <div className="h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usedPercent >= 90 ? 'bg-red-500' : usedPercent >= 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs text-gray-400">Kategoriya:</label>
            <select
              value={uploadCategory}
              onChange={e => setUploadCategory(e.target.value)}
              className="bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              {CATEGORIES.filter(c => c.key !== 'barchasi').map(c => (
                <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer ${
              dragOver
                ? 'border-blue-500 bg-blue-900/10'
                : 'border-[#1E293B] hover:border-blue-600/50 hover:bg-[#1F2937]/30'
            }`}
          >
            {uploading ? (
              <div>
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <div className="text-sm text-gray-300 font-medium">{uploadProgress || 'Yuklanmoqda...'}</div>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">📂</div>
                <div className="text-sm text-gray-300 font-medium mb-1">
                  Fayl tashlang yoki bosib tanlang
                </div>
                <div className="text-xs text-gray-500">
                  PDF, JPG, PNG · max {MAX_FILE_MB}MB
                </div>
                <div className="text-xs text-blue-400 mt-1">
                  Rasm yuklasangiz avtomatik PDF ga o&apos;tkaziladi va siqiladi
                </div>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />

          {uploadError && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-sm text-red-300">
              ⚠ {uploadError}
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => {
            const count = c.key === 'barchasi' ? docs.length : docs.filter(d => d.category === c.key).length
            if (c.key !== 'barchasi' && count === 0) return null
            return (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                  activeCategory === c.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#111827] border border-[#1E293B] text-gray-400 hover:text-white'
                }`}
              >
                {c.icon} {c.label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeCategory === c.key ? 'bg-blue-500' : 'bg-[#1E293B]'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Document list */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-3">🔒</div>
              <div className="text-gray-500 text-sm">
                {activeCategory === 'barchasi'
                  ? "Hujjatlar yo'q. Yuqoridan fayl yuklang."
                  : "Bu kategoriyada hujjat yo'q."}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#1E293B]/60">
              {filtered.map(doc => {
                const cat = CATEGORIES.find(c => c.key === doc.category)
                const isDeleting = deleting.has(doc.id)
                return (
                  <div key={doc.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-[#1F2937] transition ${isDeleting ? 'opacity-50' : ''}`}>
                    <div className="w-10 h-10 bg-red-900/30 border border-red-800/30 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{doc.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="bg-[#1F2937] px-1.5 py-0.5 rounded text-gray-400">
                          {cat?.icon} {cat?.label || doc.category}
                        </span>
                        <span>{formatSize(doc.file_size)}</span>
                        <span>{new Date(doc.created_at).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition font-medium"
                      >
                        ↓ Yuklab olish
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={isDeleting}
                        className="text-xs bg-[#1F2937] hover:bg-red-900/40 border border-[#1E293B] hover:border-red-700/50 text-gray-400 hover:text-red-400 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {isDeleting ? '...' : '🗑'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
