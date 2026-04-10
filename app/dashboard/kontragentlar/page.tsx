'use client'

import { useState, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { Modal, ModalActions } from '../_components/Modal'
import ConfirmModal from '../_components/ConfirmModal'
import { useToast } from '@/lib/toast'
import type { Counterparty } from '@/lib/types'
import { getBankByMfo } from '@/lib/bankMfo'
import { formatPhoneUz, filterDigits } from '@/lib/inputMasks'
import CpDetailModal from './_components/CpDetailModal'
import { logAudit } from '@/lib/audit'

const emptyCp = { name: '', inn: '', director_name: '', bank_name: '', bank_account: '', mfo: '', address: '', phone: '', qqsreg: '', oked: '', stir_status: '', stir_checked_at: '' }

function cpCompleteness(cp: { name: string; inn: string; director_name: string; bank_name: string; bank_account: string; mfo: string; address: string; phone?: string; qqsreg?: string }) {
  const checks = [cp.name, cp.inn, cp.director_name, cp.bank_name, cp.bank_account, cp.mfo, cp.address, cp.phone, cp.qqsreg]
  const filled = checks.filter(Boolean).length
  return { filled, total: checks.length, pct: Math.round(filled / checks.length * 100) }
}

const CSV_HEADERS = ['name', 'inn', 'director_name', 'bank_name', 'bank_account', 'mfo', 'address', 'phone', 'qqsreg']
const CSV_LABELS  = ['Tashkilot nomi *', 'INN (9 raqam)', 'Rahbar F.I.O', 'Bank nomi', 'Hisob raqami (20 raqam)', 'MFO (5 raqam)', 'Manzil', 'Telefon', 'QQS raqami']

function downloadTemplate() {
  const header = CSV_LABELS.join(';')
  const sample = ['"ALFA SAVDO" MCHJ', '123456789', 'Rahimov Jasur Aliyevich', 'Xalq banki', '20208000000000000000', '00873', 'Toshkent sh., Chilonzor tumani', '+998901234567', ''].join(';')
  const bom = '\uFEFF'
  const csv = bom + header + '\n' + sample
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'kontragentlar_shablon.csv'; a.click()
  URL.revokeObjectURL(url)
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  // skip header row
  return lines.slice(1).map(line => {
    const cells = line.split(';').map(c => c.trim().replace(/^"|"$/g, ''))
    const obj: Record<string, string> = {}
    CSV_HEADERS.forEach((h, i) => { obj[h] = cells[i] || '' })
    return obj
  }).filter(r => r.name?.trim())
}

export default function KontragentlarPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { cps, contracts, reloadCps, activeOrg } = useDashboard()
  const { toast } = useToast()

  const [cpSearch, setCpSearch] = useState('')
  const [editingCp, setEditingCp] = useState<Counterparty | null>(null)
  const [cpForm, setCpForm] = useState(emptyCp)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [cpDetail, setCpDetail] = useState<Counterparty | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [importRows, setImportRows] = useState<Record<string, string>[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [stirLoading, setStirLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── STR Bulk lookup ────────────────────────────────────────────────────────
  type StirResult = { inn: string; status: 'pending' | 'loading' | 'found' | 'error' | 'duplicate'; name?: string; data?: Record<string, string> }
  const [stirBulkModal, setStirBulkModal] = useState(false)
  const [stirInput, setStirInput] = useState('')
  const [stirResults, setStirResults] = useState<StirResult[]>([])
  const [stirBulkRunning, setStirBulkRunning] = useState(false)
  const [stirBulkDone, setStirBulkDone] = useState(false)

  const filteredCps = cps.filter(cp =>
    cp.name.toLowerCase().includes(cpSearch.toLowerCase()) ||
    (cp.inn || '').includes(cpSearch) ||
    (cp.director_name || '').toLowerCase().includes(cpSearch.toLowerCase())
  )

  const cpContractCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of contracts) {
      map.set(c.counterparty_id, (map.get(c.counterparty_id) ?? 0) + 1)
    }
    return map
  }, [contracts])

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

  async function saveCp(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!cpForm.name.trim()) { toast(T(t.msg.nameRequired), 'error'); setSaving(false); return }
    if (cpForm.inn && !/^\d{9}$/.test(cpForm.inn)) { toast(T(t.msg.innInvalid), 'error'); setSaving(false); return }
    if (cpForm.mfo && !/^\d{5}$/.test(cpForm.mfo)) { toast(T(t.msg.mfoInvalid), 'error'); setSaving(false); return }
    if (cpForm.bank_account && !/^\d{20}$/.test(cpForm.bank_account)) { toast(T(t.msg.accountInvalid), 'error'); setSaving(false); return }
    // Duplicate STIR check (only on new counterparty)
    if (!editingCp && cpForm.inn) {
      const duplicate = cps.find(cp => cp.inn && cp.inn === cpForm.inn)
      if (duplicate) {
        toast(`Bu STIR (${cpForm.inn}) allaqachon mavjud: "${duplicate.name}"`, 'error')
        setSaving(false); return
      }
    }
    const { data: { session } } = await supabase.auth.getSession()
    let cpErr = null
    if (editingCp) {
      const { error } = await supabase.from('counterparties').update(cpForm).eq('id', editingCp.id)
      cpErr = error
      if (!error) logAudit('update', 'counterparties', editingCp.id, { name: cpForm.name, inn: cpForm.inn })
      setEditingCp(null)
    } else {
      const { data: inserted, error } = await supabase.from('counterparties').insert({ ...cpForm, user_id: session!.user.id }).select('id').single()
      cpErr = error
      if (!error && inserted) logAudit('create', 'counterparties', inserted.id, { name: cpForm.name, inn: cpForm.inn })
    }
    setSaving(false)
    if (cpErr) { toast(`${T(t.msg.errorPrefix)}: ${cpErr.message}`, 'error'); return }
    setModal(false); setCpForm(emptyCp); reloadCps()
  }

  async function lookupStirCp(inn: string) {
    if (!inn || !/^\d{9}$/.test(inn)) { toast('STIR 9 raqamdan iborat bo\'lishi kerak', 'error'); return }
    setStirLoading(true)
    try {
      const res = await fetch(`/api/stir?stir=${inn}`)
      const data = await res.json()
      if (!res.ok) { toast(data.error || 'STIR ma\'lumot topilmadi', 'error'); return }
      const co = data.company
      setCpForm(prev => ({
        ...prev,
        name: co.name || prev.name,
        director_name: co.director_name || prev.director_name,
        address: co.address || prev.address,
        qqsreg: co.qqsreg || prev.qqsreg,
        oked: co.oked || prev.oked,
        stir_status: co.status || 'unknown',
        stir_checked_at: new Date().toISOString(),
      }))
      // Batafsil xabar
      const infoParts: string[] = []
      if (co.status === 'active') infoParts.push('✓ Faol')
      else if (co.status === 'inactive') infoParts.push('⚠ Faol emas!')
      if (co.oked_name) infoParts.push(co.oked_name)
      if (co.opf_name) infoParts.push(co.opf_name)
      if (co.reg_date) infoParts.push(`Ro'yxatdan: ${co.reg_date}`)
      if (co.ustav_capital) infoParts.push(`Ustav kapitali: ${Number(co.ustav_capital).toLocaleString()} so'm`)
      if (co.accountant_name && co.accountant_name !== co.director_name) infoParts.push(`Hisobchi: ${co.accountant_name}`)
      toast(infoParts.length ? infoParts.join(' | ') : 'Ma\'lumotlar to\'ldirildi', co.status === 'inactive' ? 'error' : 'success')
    } catch {
      toast('STIR so\'rovida xatolik', 'error')
    } finally {
      setStirLoading(false)
    }
  }

  async function deleteCp(id: string) {
    setConfirmDeleteId(id)
  }

  async function doDeleteCp(id: string) {
    const cp = cps.find(c => c.id === id)
    const { error } = await supabase.from('counterparties').delete().eq('id', id).eq('organization_id', activeOrg!.id)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    if (cp) logAudit('delete', 'counterparties', id, { name: cp.name, inn: cp.inn })
    setCpDetail(null); reloadCps(); setEditingCp(null)
  }

  async function runStirBulk() {
    const inns = stirInput.split(/[\n,;\s]+/).map(s => s.replace(/\D/g, '')).filter(s => s.length === 9)
    const unique = [...new Set(inns)]
    if (unique.length === 0) { toast("Hech qanday 9 raqamli STIR topilmadi", 'error'); return }
    const existingInns = new Set(cps.map(cp => cp.inn).filter(Boolean))
    const initial: StirResult[] = unique.map(inn => ({
      inn,
      status: existingInns.has(inn) ? 'duplicate' : 'pending',
    }))
    setStirResults(initial)
    setStirBulkRunning(true)
    setStirBulkDone(false)
    const { data: { session } } = await supabase.auth.getSession()
    const updated = [...initial]
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'duplicate') continue
      updated[i] = { ...updated[i], status: 'loading' }
      setStirResults([...updated])
      try {
        const res = await fetch(`/api/company-lookup?inn=${updated[i].inn}`)
        const json = await res.json()
        if (!res.ok || !json.company) {
          updated[i] = { ...updated[i], status: 'error' }
        } else {
          const co = json.company
          updated[i] = {
            ...updated[i], status: 'found', name: co.name,
            data: {
              name: co.name, inn: updated[i].inn,
              director_name: co.director || '', address: co.address || '',
              phone: co.phone || '', bank_name: co.bank_name || '',
              bank_account: co.account || '', mfo: co.mfo || '',
              user_id: session!.user.id,
            },
          }
        }
      } catch {
        updated[i] = { ...updated[i], status: 'error' }
      }
      setStirResults([...updated])
    }
    setStirBulkRunning(false)
    setStirBulkDone(true)
  }

  async function saveStirBulk() {
    const toSave = stirResults.filter(r => r.status === 'found' && r.data)
    if (toSave.length === 0) { toast("Saqlash uchun natija yo'q", 'error'); return }
    setImporting(true)
    const rows = toSave.map(r => r.data!)
    const { error } = await supabase.from('counterparties').insert(rows)
    setImporting(false)
    if (error) {
      if (error.code === '23505') {
        const { error: e2 } = await supabase.from('counterparties').upsert(rows, { onConflict: 'inn' })
        if (e2) { toast("Xato: " + e2.message, 'error'); return }
      } else { toast("Xato: " + error.message, 'error'); return }
    }
    toast(`${toSave.length} ta kontragent saqlandi`, 'success')
    setStirBulkModal(false)
    setStirInput('')
    setStirResults([])
    setStirBulkDone(false)
    reloadCps()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const rows = parseCsv(text)
      if (rows.length === 0) { toast("Fayl bo'sh yoki noto'g'ri format", 'error'); return }
      setImportRows(rows)
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  async function doImport() {
    if (!importRows || importRows.length === 0) return
    setImporting(true)
    const { data: { session } } = await supabase.auth.getSession()
    // Filter out duplicates by INN (against existing cps + within import rows)
    const existingInns = new Set(cps.map(cp => cp.inn).filter(Boolean))
    const seenInns = new Set<string>()
    const newRows: Record<string, string>[] = []
    let skipped = 0
    for (const r of importRows) {
      if (r.inn && (existingInns.has(r.inn) || seenInns.has(r.inn))) {
        skipped++; continue
      }
      if (r.inn) seenInns.add(r.inn)
      newRows.push(r)
    }
    if (newRows.length === 0) {
      setImporting(false)
      toast(`Barcha ${skipped} ta kontragent allaqachon mavjud (STIR bo'yicha)`, 'error')
      return
    }
    const rows = newRows.map(r => ({ ...r, user_id: session!.user.id }))
    const { error } = await supabase.from('counterparties').insert(rows)
    setImporting(false)
    if (error) { toast('Xato: ' + error.message, 'error'); return }
    const msg = skipped > 0
      ? `${newRows.length} ta yuklandi, ${skipped} ta dublikat o'tkazib yuborildi`
      : `${newRows.length} ta kontragent muvaffaqiyatli yuklandi`
    toast(msg, 'success')
    setImportRows(null)
    reloadCps()
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🤝 {T(t.cp.title)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{cps.length} ta kontragent</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate}
            className="flex items-center gap-1.5 bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 px-3 py-2.5 rounded-lg text-sm transition"
            title="Excel shablon yuklab olish">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            Shablon
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <button onClick={() => { setStirBulkModal(true); setStirResults([]); setStirInput(''); setStirBulkDone(false) }}
            className="flex items-center gap-1.5 bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 px-3 py-2.5 rounded-lg text-sm transition">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Ommaviy yuklash
          </button>
          <button onClick={() => { setEditingCp(null); setCpForm(emptyCp); setModal(true) }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
            + {T(t.cpTab.addBtn)}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input value={cpSearch} onChange={e => setCpSearch(e.target.value)}
          placeholder={T(t.cpTab.searchPlaceholder)}
          className="w-full bg-[#111827] border border-[#1E293B] text-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
      </div>

      {/* Table or empty */}
      {filteredCps.length === 0 ? (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <p className="text-gray-400 font-medium">{cpSearch ? T(t.cpTab.noFound) : T(t.cpTab.noAdded)}</p>
          {!cpSearch && (
            <button onClick={() => { setEditingCp(null); setCpForm(emptyCp); setModal(true) }}
              className="mt-3 text-blue-400 text-sm hover:text-blue-300">
              {T(t.cpTab.addBtn)}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-8">№</th>
                <th className="px-4 py-3 text-left">{T(t.cpTab.colName)}</th>
                <th className="px-4 py-3 text-left">{T(t.cpTab.colInn)}</th>
                <th className="px-4 py-3 text-left">{T(t.cpTab.colDirector)}</th>
                <th className="px-4 py-3 text-left">{T(t.cpTab.colBank)}</th>
                <th className="px-4 py-3 text-left">{T(t.cpTab.colMfo)}</th>
                <th className="px-4 py-3 text-center">{T(t.cpTab.colContracts)}</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCps.map((cp, idx) => {
                const cpContracts = cpContractCount.get(cp.id) ?? 0
                return (
                  <tr key={cp.id}
                    className="border-t border-[#1E293B] hover:bg-[#1F2937] cursor-pointer transition group"
                    onClick={() => setCpDetail(cp)}>
                    <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-900/60 rounded-lg flex items-center justify-center text-orange-300 font-bold text-sm flex-shrink-0">
                          {cp.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white">{cp.name}</span>
                            {cp.stir_status === 'active' && (
                              <span className="text-[10px] bg-green-900/40 text-green-400 border border-green-700/30 px-1.5 py-0.5 rounded-full whitespace-nowrap">✓ Faol</span>
                            )}
                            {cp.stir_status === 'inactive' && (
                              <span className="text-[10px] bg-red-900/40 text-red-400 border border-red-700/30 px-1.5 py-0.5 rounded-full whitespace-nowrap">⚠ Faol emas</span>
                            )}
                          </div>
                          {cp.stir_checked_at && (() => {
                            const { filled, total, pct } = cpCompleteness(cp)
                            const days = Math.floor((Date.now() - new Date(cp.stir_checked_at).getTime()) / 86400000)
                            return (
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-16 h-1 bg-[#1E293B] rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }}/>
                                </div>
                                <span className="text-[10px] text-gray-600">{filled}/{total} • {days === 0 ? 'bugun' : `${days}k`}</span>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cp.inn || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{cp.director_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{cp.bank_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{cp.mfo || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {cpContracts > 0
                        ? <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded-full">{cpContracts}</span>
                        : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => {
                          setEditingCp(cp)
                          setCpForm({ name: cp.name, inn: cp.inn, director_name: cp.director_name, bank_name: cp.bank_name, bank_account: cp.bank_account, mfo: cp.mfo, address: cp.address, phone: cp.phone || '', qqsreg: cp.qqsreg || '', oked: cp.oked || '', stir_status: cp.stir_status || '', stir_checked_at: cp.stir_checked_at || '' })
                          setModal(true)
                        }} className="p-1.5 bg-[#1F2937] hover:bg-blue-700 rounded text-xs text-gray-300" title="Tahrirlash">✎</button>
                        <button onClick={() => deleteCp(cp.id)}
                          className="p-1.5 bg-[#1F2937] hover:bg-red-800 rounded text-xs text-gray-300" title="O'chirish">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#1E293B] text-xs text-gray-500">
            {T(t.cpTab.total)}: {filteredCps.length} {T(t.cpTab.contacts)}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {cpDetail && (
        <CpDetailModal
          cp={cpDetail}
          onClose={() => setCpDetail(null)}
          onEdit={cp => {
            setEditingCp(cp)
            setCpForm({ name: cp.name, inn: cp.inn, director_name: cp.director_name, bank_name: cp.bank_name, bank_account: cp.bank_account, mfo: cp.mfo, address: cp.address, phone: cp.phone || '', qqsreg: cp.qqsreg || '', oked: cp.oked || '', stir_status: cp.stir_status || '', stir_checked_at: cp.stir_checked_at || '' })
            setCpDetail(null); setModal(true)
          }}
          onDelete={id => { setCpDetail(null); deleteCp(id) }}
        />
      )}

      {/* Add/Edit modal */}
      {modal && (
        <Modal title={editingCp ? "Kontragentni tahrirlash" : T(t.cp.new)} onClose={() => { setModal(false); setEditingCp(null); setCpForm(emptyCp) }}>
          <form onSubmit={saveCp} className="space-y-4">
            <div>
              <label className={lbl}>Kontragent nomi *</label>
              <input className={inp} required placeholder="Beta Savdo MChJ" value={cpForm.name} onChange={e => setCpForm({ ...cpForm, name: e.target.value })}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>STIR (INN)</label>
                <div className="flex gap-2">
                  <input className={inp} placeholder="123456789" maxLength={9} value={cpForm.inn} onChange={e => setCpForm({ ...cpForm, inn: filterDigits(e.target.value, 9) })}/>
                  <button type="button" disabled={stirLoading || !cpForm.inn}
                    onClick={() => lookupStirCp(cpForm.inn)}
                    className="px-2.5 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-400 rounded-lg text-xs disabled:opacity-40 transition flex-shrink-0"
                    title="Soliqdan ma'lumot olish">
                    {stirLoading ? '...' : '🔍'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">9 raqam kiriting va 🔍 bosing</p>
              </div>
              <div>
                <label className={lbl}>Direktor F.I.Sh</label>
                <input className={inp} placeholder="Rahimov Jasur" value={cpForm.director_name} onChange={e => setCpForm({ ...cpForm, director_name: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Bank nomi</label>
                <input className={inp} placeholder="Xalq banki" value={cpForm.bank_name} onChange={e => { setCpForm({ ...cpForm, bank_name: e.target.value }) }}/>
              </div>
              <div>
                <label className={lbl}>Hisob raqami</label>
                <input className={inp} placeholder="20208000000000000000" maxLength={20} value={cpForm.bank_account} onChange={e => setCpForm({ ...cpForm, bank_account: filterDigits(e.target.value, 20) })}/>
              </div>
              <div>
                <label className={lbl}>MFO</label>
                <input className={inp} placeholder="00873" maxLength={5} value={cpForm.mfo} onChange={e => {
                  const mfo = filterDigits(e.target.value, 5)
                  const bankName = mfo.length === 5 ? getBankByMfo(mfo) : null
                  setCpForm({ ...cpForm, mfo, ...(bankName ? { bank_name: bankName } : {}) })
                }}/>
              </div>
              <div>
                <label className={lbl}>Telefon</label>
                <input className={inp} placeholder="+998 90 123-45-67" value={cpForm.phone} onChange={e => setCpForm({ ...cpForm, phone: formatPhoneUz(e.target.value) })}/>
              </div>
              <div>
                <label className={lbl}>QQS ro'yxat raqami</label>
                <input className={inp} placeholder="318060007067" value={cpForm.qqsreg} onChange={e => setCpForm({ ...cpForm, qqsreg: filterDigits(e.target.value) })}/>
              </div>
            </div>
            <div>
              <label className={lbl}>Manzil</label>
              <input className={inp} placeholder="Toshkent shahri, ..." value={cpForm.address} onChange={e => setCpForm({ ...cpForm, address: e.target.value })}/>
            </div>
            <ModalActions onClose={() => { setModal(false); setEditingCp(null); setCpForm(emptyCp) }} saving={saving}/>
          </form>
        </Modal>
      )}

      {/* Import preview modal */}
      {importRows && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-white">Yuklashni tasdiqlang</h3>
                <p className="text-xs text-gray-500 mt-0.5">{importRows.length} ta kontragent topildi</p>
              </div>
              <button onClick={() => setImportRows(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] text-xl">×</button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {(() => {
                const existingInns = new Set(cps.map(cp => cp.inn).filter(Boolean))
                const seenInns = new Set<string>()
                const dupCount = importRows.filter(r => {
                  if (!r.inn) return false
                  if (existingInns.has(r.inn) || seenInns.has(r.inn)) return true
                  seenInns.add(r.inn); return false
                }).length
                return dupCount > 0 ? (
                  <div className="mb-3 bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 text-xs rounded-lg px-3 py-2">
                    ⚠ {dupCount} ta kontragent dublikat (STIR bo'yicha) — yuklanishda o'tkazib yuboriladi
                  </div>
                ) : null
              })()}
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-[#1E293B]">
                    <th className="text-left pb-2 pr-3">№</th>
                    <th className="text-left pb-2 pr-3">Tashkilot nomi</th>
                    <th className="text-left pb-2 pr-3">INN</th>
                    <th className="text-left pb-2 pr-3">Rahbar</th>
                    <th className="text-left pb-2">Bank</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const existingInns = new Set(cps.map(cp => cp.inn).filter(Boolean))
                    const seenInns = new Set<string>()
                    return importRows.map((row, i) => {
                      const isDup = Boolean(row.inn && (existingInns.has(row.inn) || seenInns.has(row.inn)))
                      if (row.inn && !isDup) seenInns.add(row.inn)
                      return (
                        <tr key={i} className={`border-b border-[#1E293B]/50 ${isDup ? 'opacity-40' : ''}`}>
                          <td className="py-1.5 pr-3 text-gray-500">{i + 1}</td>
                          <td className="py-1.5 pr-3 font-medium">
                            <span className={isDup ? 'text-gray-500 line-through' : 'text-white'}>{row.name || <span className="text-red-400">Bo'sh!</span>}</span>
                            {isDup && <span className="ml-2 text-yellow-500 text-xs">dublikat</span>}
                          </td>
                          <td className="py-1.5 pr-3 text-gray-400 font-mono">{row.inn || '—'}</td>
                          <td className="py-1.5 pr-3 text-gray-400">{row.director_name || '—'}</td>
                          <td className="py-1.5 text-gray-500">{row.bank_name || '—'}</td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#1E293B] flex-shrink-0">
              <button onClick={doImport} disabled={importing}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm py-2.5 rounded-lg font-semibold transition">
                {importing ? 'Yuklanmoqda...' : `${importRows.length} ta kontragentni yuklash`}
              </button>
              <button onClick={() => setImportRows(null)}
                className="px-5 bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 text-sm py-2.5 rounded-lg transition">
                Bekor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STR Bulk Lookup Modal */}
      {stirBulkModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-white">Ommaviy STIR yuklash</h3>
                <p className="text-xs text-gray-500 mt-0.5">STIR raqamlarini kiriting — ma'lumotlar Soliq API orqali avtomatik to'ldiriladi</p>
              </div>
              <button onClick={() => { if (!stirBulkRunning) { setStirBulkModal(false); setStirResults([]); setStirInput(''); setStirBulkDone(false) } }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] text-xl">×</button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Input */}
              {!stirBulkRunning && !stirBulkDone && (
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    STIR raqamlari (har bir qatorda bitta, yoki vergul bilan ajrating)
                  </label>
                  <textarea
                    value={stirInput}
                    onChange={e => setStirInput(e.target.value)}
                    rows={8}
                    className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-600 resize-none"
                    placeholder={"302857743\n305107783\n207560007\n..."}
                  />
                  {(() => {
                    const count = [...new Set(stirInput.split(/[\n,;\s]+/).map(s => s.replace(/\D/g, '')).filter(s => s.length === 9))].length
                    return count > 0 ? <p className="text-xs text-blue-400 mt-1.5">{count} ta to'g'ri STIR aniqlandi</p> : null
                  })()}
                </div>
              )}

              {/* Results */}
              {stirResults.length > 0 && (
                <div className="space-y-2">
                  {stirBulkRunning && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"/>
                      {stirResults.filter(r => r.status === 'found' || r.status === 'error' || r.status === 'duplicate').length} / {stirResults.length} ta bajarildi
                    </div>
                  )}
                  {stirBulkDone && (
                    <div className="flex gap-4 text-xs mb-3 flex-wrap">
                      <span className="text-emerald-400">✓ {stirResults.filter(r => r.status === 'found').length} ta topildi</span>
                      <span className="text-red-400">✗ {stirResults.filter(r => r.status === 'error').length} ta topilmadi</span>
                      {stirResults.filter(r => r.status === 'duplicate').length > 0 && (
                        <span className="text-yellow-400">⚠ {stirResults.filter(r => r.status === 'duplicate').length} ta allaqachon mavjud</span>
                      )}
                    </div>
                  )}
                  {stirResults.map((r, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm ${
                      r.status === 'found' ? 'bg-emerald-900/15 border-emerald-700/30' :
                      r.status === 'error' ? 'bg-red-900/15 border-red-700/30' :
                      r.status === 'duplicate' ? 'bg-yellow-900/15 border-yellow-700/30' :
                      r.status === 'loading' ? 'bg-blue-900/15 border-blue-700/30' :
                      'bg-[#0F172A] border-[#1E293B]'
                    }`}>
                      <div className="flex-shrink-0 w-5 text-center">
                        {r.status === 'loading' && <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block"/>}
                        {r.status === 'found' && <span className="text-emerald-400">✓</span>}
                        {r.status === 'error' && <span className="text-red-400">✗</span>}
                        {r.status === 'duplicate' && <span className="text-yellow-400">⚠</span>}
                        {r.status === 'pending' && <span className="text-gray-600">·</span>}
                      </div>
                      <span className="font-mono text-xs text-gray-400 flex-shrink-0">{r.inn}</span>
                      <span className={`flex-1 text-xs truncate ${
                        r.status === 'found' ? 'text-white font-medium' :
                        r.status === 'error' ? 'text-red-400' :
                        r.status === 'duplicate' ? 'text-yellow-400' : 'text-gray-600'
                      }`}>
                        {r.status === 'found' ? r.name :
                         r.status === 'error' ? "Topilmadi" :
                         r.status === 'duplicate' ? "Allaqachon mavjud" :
                         r.status === 'loading' ? "Qidirilmoqda..." : "Kutmoqda"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-4 border-t border-[#1E293B] flex-shrink-0">
              {!stirBulkRunning && !stirBulkDone && (
                <>
                  <button onClick={runStirBulk}
                    disabled={!stirInput.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm py-2.5 rounded-lg font-semibold transition">
                    Yuklash
                  </button>
                  <button onClick={() => { setStirBulkModal(false); setStirInput('') }}
                    className="px-5 bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 text-sm py-2.5 rounded-lg transition">
                    Bekor
                  </button>
                </>
              )}
              {stirBulkDone && (
                <>
                  <button onClick={saveStirBulk} disabled={importing || stirResults.filter(r => r.status === 'found').length === 0}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm py-2.5 rounded-lg font-semibold transition">
                    {importing ? 'Saqlanmoqda...' : `${stirResults.filter(r => r.status === 'found').length} ta saqlash`}
                  </button>
                  <button onClick={() => { setStirResults([]); setStirBulkDone(false); setStirInput('') }}
                    className="px-4 bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 text-sm py-2.5 rounded-lg transition">
                    Qayta
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message={T(t.msg.deleteCpConfirm)}
          onConfirm={() => { const id = confirmDeleteId; setConfirmDeleteId(null); doDeleteCp(id) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
