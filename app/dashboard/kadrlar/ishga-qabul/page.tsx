'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '../../context'
import { fetchAi } from '@/lib/fetchAi'
import {
  tplMehnatShartnoma, tplBuyruqQabul, tplMehnatDaftarcha, tplMaxfiylik, fmtD
} from '../templates'

// ── Hujjat turlari ──────────────────────────────────────────────────────────
const DOC_TYPES = [
  { key: 'buyruq',      icon: '📥', title: "Ishga qabul buyrug'i",    desc: 'Rasmiy qabul buyrug\'i (MK 76-m.)',          required: true },
  { key: 'shartnoma',   icon: '📋', title: 'Mehnat shartnomasi',       desc: 'To\'liq mehnat shartnomasi (MK 75-80-m.)',   required: true },
  { key: 'yoriqnoma',   icon: '📑', title: "Lavozim yo'riqnomasi",     desc: 'AI yordamida avtomatik tuziladi',           required: false },
  { key: 'nda',         icon: '🔒', title: 'Maxfiylik (NDA)',          desc: 'Tijorat sirini muhofaza shartnomasi',       required: false },
  { key: 'daftarcha',   icon: '📒', title: "Mehnat daftarchasi yozuvi", desc: 'Daftarchaga kiritish uchun andoza',        required: false },
]

type DocKey = 'buyruq' | 'shartnoma' | 'yoriqnoma' | 'nda' | 'daftarcha'

interface GenDoc { key: DocKey; title: string; icon: string; content: string }

const TODAY = new Date().toISOString().split('T')[0]

export default function IshgaQabulPage() {
  const router = useRouter()
  const { activeOrg } = useDashboard()

  // Tanlangan hujjatlar
  const [selected, setSelected] = useState<Set<DocKey>>(new Set(['buyruq', 'shartnoma']))

  // Form maydonlari
  const [f, setF] = useState({
    xodim_ism:       '',
    lavozim:         '',
    bolim:           '',
    maosh:           '',
    boshlanish_sana: TODAY,
    tugash_sana:     '',
    jshshir:         '',
    passport:        '',
    xodim_manzil:    '',
    buyruq_raqam:    '',
    shartnoma_raqam: '',
    sinov:           '',
    mehnat_tur:      'belgilanmagan_muddatli',
  })

  const [step, setStep] = useState<'form' | 'result'>('form')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [docs, setDocs] = useState<GenDoc[]>([])
  const [activeDoc, setActiveDoc] = useState<DocKey | null>(null)
  const [error, setError] = useState('')

  const org = activeOrg
    ? { name: activeOrg.name, inn: activeOrg.inn || '', director_name: activeOrg.director_name || activeOrg.name }
    : { name: '________________', inn: '___', director_name: '________________' }

  function toggle(key: DocKey) {
    const s = new Set(selected)
    if (s.has(key)) s.delete(key)
    else s.add(key)
    setSelected(s)
  }

  function set(key: string, val: string) {
    setF(prev => ({ ...prev, [key]: val }))
  }

  async function generate() {
    if (!f.xodim_ism.trim() || !f.lavozim.trim()) {
      setError("F.I.O. va lavozim majburiy maydonlar")
      return
    }
    if (selected.size === 0) {
      setError("Kamida bitta hujjat tanlang")
      return
    }
    setError('')
    setLoading(true)
    setStep('result')
    setDocs([])
    setProgress([])

    const result: GenDoc[] = []
    const fields = { ...f, sana: f.boshlanish_sana, yozuv_sana: f.boshlanish_sana, buyruq_sana: f.boshlanish_sana }

    const addProgress = (msg: string) => setProgress(p => [...p, msg])

    for (const docType of DOC_TYPES) {
      if (!selected.has(docType.key as DocKey)) continue
      addProgress(`${docType.icon} ${docType.title} tayyorlanmoqda...`)

      let content = ''
      try {
        if (docType.key === 'buyruq') {
          content = tplBuyruqQabul(fields, org)
        } else if (docType.key === 'shartnoma') {
          content = tplMehnatShartnoma(fields, org, f.mehnat_tur)
        } else if (docType.key === 'nda') {
          content = tplMaxfiylik({ ...fields, muddat: '3 yil' }, org)
        } else if (docType.key === 'daftarcha') {
          content = tplMehnatDaftarcha(fields, org)
        } else if (docType.key === 'yoriqnoma') {
          const aiRes = await fetchAi({
            type: 'mehnat_shartnoma',
            lang: 'uz',
            details: {
              tashkilot: org.name,
              tashkilot_inn: org.inn,
              direktor: org.director_name,
              lavozim: f.lavozim,
              bolim: f.bolim || '',
              asosiy_vazifalar: `${f.lavozim} lavozimiga xos asosiy vazifalar`,
              talablar: `${f.lavozim} lavozimi uchun standart talablar`,
            },
          })
          if (aiRes.ok) {
            const reader = aiRes.body!.getReader()
            const decoder = new TextDecoder()
            let text = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              text += decoder.decode(value, { stream: true })
            }
            // API JSON qaytarsa, ichidagi matni ol
            try {
              const parsed = JSON.parse(text)
              content = parsed.yoriqnoma || parsed.content || parsed.shartnoma || text
            } catch {
              content = text
            }
          }
        }
        result.push({ key: docType.key as DocKey, title: docType.title, icon: docType.icon, content })
        addProgress(`✅ ${docType.title} tayyor`)
      } catch {
        addProgress(`❌ ${docType.title} — xatolik`)
      }
    }

    setDocs(result)
    setActiveDoc(result[0]?.key || null)
    setLoading(false)
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
  }

  function print(text: string) {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<html><head><title>Hujjat</title><style>
      body{font-family:'Courier New',monospace;font-size:12px;padding:40px;white-space:pre-wrap;line-height:1.6}
    </style></head><body>${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</body></html>`)
    w.document.close()
    w.print()
  }

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step === 'result' ? setStep('form') : router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1F2937] hover:bg-[#374151] text-gray-400 hover:text-white transition text-lg">
          ←
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Ishga qabul — bittada hammasi</h1>
          <p className="text-xs text-gray-500">Ma'lumotni bir marta to'ldiring — barcha hujjatlar avtomatik shakllanadi</p>
        </div>
      </div>

      {step === 'form' && (
        <div className="space-y-5">

          {/* Hujjatlarni tanlash */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3">Qaysi hujjatlar kerak?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DOC_TYPES.map(doc => {
                const checked = selected.has(doc.key as DocKey)
                return (
                  <button key={doc.key}
                    onClick={() => !doc.required && toggle(doc.key as DocKey)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                      checked
                        ? 'bg-blue-600/15 border-blue-500/40 text-white'
                        : 'bg-[#0F172A] border-[#1E293B] text-gray-400 hover:border-[#374151]'
                    } ${doc.required ? 'cursor-default opacity-90' : 'cursor-pointer'}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                      checked ? 'bg-blue-600 border-blue-500' : 'border-gray-600'
                    }`}>
                      {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{doc.icon}</span>
                        <span className={`text-xs font-semibold ${checked ? 'text-white' : 'text-gray-300'}`}>{doc.title}</span>
                        {doc.required && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400 font-bold">MAJBURIY</span>}
                        {doc.key === 'yoriqnoma' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-400 font-bold">AI</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{doc.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Xodim ma'lumotlari */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Xodim ma'lumotlari</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">F.I.O. <span className="text-red-400">*</span></label>
                <input value={f.xodim_ism} onChange={e => set('xodim_ism', e.target.value)}
                  placeholder="Rahimov Bobur Aliyevich"
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Lavozim <span className="text-red-400">*</span></label>
                <input value={f.lavozim} onChange={e => set('lavozim', e.target.value)}
                  placeholder="Dasturchi"
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Bo'lim (ixtiyoriy)</label>
                <input value={f.bolim} onChange={e => set('bolim', e.target.value)}
                  placeholder="IT bo'limi"
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Maosh (so'm) <span className="text-red-400">*</span></label>
                <input value={f.maosh} onChange={e => set('maosh', e.target.value)}
                  placeholder="5 000 000"
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Ish boshlash sanasi</label>
                <input type="date" value={f.boshlanish_sana} onChange={e => set('boshlanish_sana', e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">JSHSHIR (ixtiyoriy)</label>
                <input value={f.jshshir} onChange={e => set('jshshir', e.target.value)}
                  placeholder="12345678901234" maxLength={14}
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Pasport (ixtiyoriy)</label>
                <input value={f.passport} onChange={e => set('passport', e.target.value)}
                  placeholder="AB 1234567"
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"/>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Sinov muddati (ixtiyoriy)</label>
                <input value={f.sinov} onChange={e => set('sinov', e.target.value)}
                  placeholder="3 oy"
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"/>
              </div>

              {selected.has('shartnoma') && (
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Mehnat shartnomasi turi</label>
                  <select value={f.mehnat_tur} onChange={e => set('mehnat_tur', e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50">
                    <option value="belgilanmagan_muddatli">Belgilanmagan muddatli (doimiy)</option>
                    <option value="belgilangan_muddatli">Belgilangan muddatli (muddatli)</option>
                    <option value="yarim_stavkada">Yarim stavkada (0.5 stavka)</option>
                    <option value="masofaviy">Masofaviy (remote)</option>
                    <option value="amaliyot">Amaliyot / Stajyor</option>
                  </select>
                </div>
              )}

              {selected.has('shartnoma') && f.mehnat_tur === 'belgilangan_muddatli' && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Tugash sanasi</label>
                  <input type="date" value={f.tugash_sana} onChange={e => set('tugash_sana', e.target.value)}
                    className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"/>
                </div>
              )}

            </div>

            {/* Raqamlar (ixtiyoriy, collapsible) */}
            <details className="mt-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition select-none">
                + Hujjat raqamlarini ko'rsatish (ixtiyoriy)
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Buyruq raqami</label>
                  <input value={f.buyruq_raqam} onChange={e => set('buyruq_raqam', e.target.value)}
                    placeholder="01-K"
                    className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"/>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Shartnoma raqami</label>
                  <input value={f.shartnoma_raqam} onChange={e => set('shartnoma_raqam', e.target.value)}
                    placeholder="01/2026-MS"
                    className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"/>
                </div>
              </div>
            </details>
          </div>

          {error && <p className="text-red-400 text-sm px-1">{error}</p>}

          <button onClick={generate}
            className="w-full py-3 rounded-2xl font-semibold text-sm text-white transition"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            Barcha hujjatlarni yaratish ({selected.size} ta) →
          </button>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-4">

          {/* Progress */}
          {loading && (
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"/>
                <span className="text-sm text-white font-medium">Hujjatlar tayyorlanmoqda...</span>
              </div>
              <div className="space-y-1.5">
                {progress.map((p, i) => (
                  <p key={i} className={`text-xs ${p.startsWith('✅') ? 'text-emerald-400' : p.startsWith('❌') ? 'text-red-400' : 'text-gray-400'}`}>{p}</p>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {!loading && docs.length > 0 && (
            <>
              {/* Tabs */}
              <div className="flex gap-2 flex-wrap">
                {docs.map(doc => (
                  <button key={doc.key} onClick={() => setActiveDoc(doc.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                      activeDoc === doc.key
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-[#111827] border-[#1E293B] text-gray-400 hover:text-white hover:border-gray-600'
                    }`}>
                    <span>{doc.icon}</span>
                    <span>{doc.title}</span>
                  </button>
                ))}
                <button onClick={() => setStep('form')}
                  className="ml-auto px-3 py-1.5 rounded-xl text-xs border border-[#1E293B] text-gray-500 hover:text-white transition">
                  ← Orqaga
                </button>
              </div>

              {/* Active doc */}
              {docs.filter(d => d.key === activeDoc).map(doc => (
                <div key={doc.key} className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E293B]">
                    <div className="flex items-center gap-2">
                      <span>{doc.icon}</span>
                      <span className="text-sm font-semibold text-white">{doc.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => copy(doc.content)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-gray-300 transition flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        Nusxa
                      </button>
                      <button onClick={() => print(doc.content)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 transition flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                        </svg>
                        Chop etish
                      </button>
                    </div>
                  </div>
                  <pre className="p-4 text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto">
                    {doc.content}
                  </pre>
                </div>
              ))}

              {/* All docs summary */}
              <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-emerald-400 text-lg">✅</span>
                <div>
                  <p className="text-sm text-emerald-300 font-medium">{docs.length} ta hujjat muvaffaqiyatli yaratildi</p>
                  <p className="text-xs text-emerald-600">{f.xodim_ism} — {f.lavozim} · {fmtD(f.boshlanish_sana)}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
