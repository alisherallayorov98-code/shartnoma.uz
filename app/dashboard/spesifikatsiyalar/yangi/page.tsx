'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../../context'
import { useToast } from '@/lib/toast'
import type { SpecItem, Specification } from '@/lib/types'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'
import { BirlikPicker } from '../../_components/BirlikPicker'
import { FileText, Plus, Trash2, ChevronDown, Save, X } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcItem(item: SpecItem): SpecItem {
  const asosiy = item.miqdori * item.narxi
  const foiz = item.qqs_foiz === 'siz' ? 0 : parseFloat(item.qqs_foiz || '0')
  const qqs_summa = Math.round(asosiy * foiz / 100)
  return { ...item, qqs_summa, summa: asosiy + qqs_summa }
}

// Teskari hisob: Jami kiritilsa → Narx hisoblanadi
function calcItemFromJami(item: SpecItem, jami: number): SpecItem {
  const foiz = item.qqs_foiz === 'siz' ? 0 : parseFloat(item.qqs_foiz || '0')
  const miqdori = item.miqdori || 1
  const narxi = Math.round(jami / (miqdori * (1 + foiz / 100)))
  return calcItem({ ...item, narxi })
}

const emptyItem = (): SpecItem => calcItem({
  nomi: '', birlik: 'dona', miqdori: 1, narxi: 0, qqs_foiz: 'siz', qqs_summa: 0, summa: 0,
})

const QQS_OPTIONS = [
  { val: 'siz', label: 'QQSsiz' },
  { val: '0',   label: '0%' },
  { val: '12',  label: '12%' },
  { val: '15',  label: '15%' },
]

const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder-gray-500 transition'
const lbl = 'block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide'

// ─────────────────────────────────────────────────────────────────────────────

export default function YangiSpesifikatsiyaPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const editId       = searchParams.get('id')
  const { lang }     = useLang()
  const T            = (obj: Record<Lang, string>) => tr(obj, lang)
  const { activeOrg, contracts, cps } = useDashboard()
  const { toast } = useToast()

  const [specNumber, setSpecNumber] = useState('')
  const [notes, setNotes]           = useState('')
  const [contractId, setContractId] = useState('')
  const [cpId, setCpId]             = useState('')
  const [items, setItems]           = useState<SpecItem[]>([emptyItem()])
  const [saving, setSaving]         = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(!!editId)

  // ── Load for edit ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!editId) return
    async function load() {
      const { data, error } = await supabase
        .from('specifications')
        .select('*, contracts(counterparty_id)')
        .eq('id', editId)
        .single()
      if (error || !data) { toast("Spesifikatsiya topilmadi", 'error'); router.replace('/dashboard/spesifikatsiyalar'); return }
      const spec = data as Specification & { contracts?: { counterparty_id?: string } }
      setSpecNumber(spec.spec_number)
      setNotes(spec.notes || '')
      setContractId(spec.contract_id || '')
      setCpId(spec.contracts?.counterparty_id || '')
      setItems(spec.items.length > 0 ? spec.items : [emptyItem()])
      setLoadingEdit(false)
    }
    load()
  }, [editId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto spec number ──────────────────────────────────────────────────────
  useEffect(() => {
    if (editId || !activeOrg) return
    async function loadNext() {
      const { data } = await supabase.from('specifications')
        .select('spec_number').eq('organization_id', activeOrg!.id)
      const max = (data || []).reduce((m, s) => {
        const n = parseInt(s.spec_number.replace(/\D/g, ''), 10)
        return isNaN(n) ? m : Math.max(m, n)
      }, 0)
      setSpecNumber(`SPEC-${String(max + 1).padStart(3, '0')}`)
    }
    loadNext()
  }, [editId, activeOrg?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────
  const orgContracts = useMemo(
    () => cpId
      ? contracts.filter(c => c.organization_id === activeOrg?.id && c.counterparty_id === cpId)
      : [],
    [contracts, activeOrg?.id, cpId]
  )

  const cpsWithContracts = useMemo(
    () => cps.filter(cp => contracts.some(c => c.organization_id === activeOrg?.id && c.counterparty_id === cp.id)),
    [cps, contracts, activeOrg?.id]
  )

  const selectedContract = contracts.find(c => c.id === contractId)
  const selectedCp = cps.find(cp => cp.id === (cpId || selectedContract?.counterparty_id))

  const asosiy  = items.reduce((s, it) => s + it.miqdori * it.narxi, 0)
  const qqsJami = items.reduce((s, it) => s + it.qqs_summa, 0)
  const grand   = items.reduce((s, it) => s + it.summa, 0)

  // ── Item helpers ──────────────────────────────────────────────────────────
  function updateItem(i: number, field: keyof SpecItem, value: string | number) {
    setItems(prev => prev.map((item, idx) => idx !== i ? item : calcItem({ ...item, [field]: value })))
  }

  function updateItemFromJami(i: number, jami: number) {
    setItems(prev => prev.map((item, idx) => idx !== i ? item : calcItemFromJami(item, jami)))
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function setAllQqs(val: string) {
    setItems(prev => prev.map(item => calcItem({ ...item, qqs_foiz: val })))
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!activeOrg) return
    if (!specNumber.trim()) { toast("Spesifikatsiya raqamini kiriting!", 'error'); return }
    if (items.length === 0) { toast(T(t.msg.addItem), 'error'); return }
    if (items.some(it => !it.nomi.trim())) { toast("Barcha mahsulot nomlarini to'ldiring!", 'error'); return }

    setSaving(true)
    const payload = {
      organization_id: activeOrg.id,
      contract_id: contractId || null,
      spec_number: specNumber.trim(),
      items,
      notes: notes.trim(),
    }

    const { error } = editId
      ? await supabase.from('specifications').update(payload).eq('id', editId)
      : await supabase.from('specifications').insert(payload)

    setSaving(false)
    if (error) { toast(`Xato: ${error.message}`, 'error'); return }
    toast(editId ? "Spesifikatsiya yangilandi" : "Spesifikatsiya saqlandi", 'success')
    router.push('/dashboard/spesifikatsiyalar')
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"/>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0B1220]">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-[#0B1220]/95 backdrop-blur border-b border-[#1E293B] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard/spesifikatsiyalar" className="text-gray-500 hover:text-gray-300 transition flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5"/>
              Spesifikatsiyalar
            </Link>
            <ChevronDown className="w-3.5 h-3.5 text-gray-600 -rotate-90"/>
            <span className="text-white font-medium">
              {editId ? `#${specNumber} — tahrirlash` : 'Yangi spesifikatsiya'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/spesifikatsiyalar"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F2937] border border-[#1E293B] text-gray-300 hover:text-white text-sm transition">
              <X className="w-3.5 h-3.5"/> Bekor
            </Link>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition">
              {saving
                ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"/>
                : <Save className="w-3.5 h-3.5"/>}
              {saving ? 'Saqlanmoqda…' : editId ? 'Yangilash' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── Top fields row ── */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={lbl}>Spesifikatsiya raqami <span className="text-red-400">*</span></label>
              <input className={inp} value={specNumber}
                onChange={e => setSpecNumber(e.target.value)}
                placeholder="SPEC-001"/>
            </div>
            <div>
              <label className={lbl}>Izoh</label>
              <input className={inp} value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ixtiyoriy izoh…"/>
            </div>
            <div>
              <label className={lbl}>Kontragent</label>
              <select className={inp} value={cpId}
                onChange={e => { setCpId(e.target.value); setContractId('') }}>
                <option value="">— Tanlang —</option>
                {cpsWithContracts.map(cp => (
                  <option key={cp.id} value={cp.id}>{cp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Shartnoma raqami</label>
              <select className={inp} value={contractId}
                onChange={e => setContractId(e.target.value)}>
                <option value="">— Tanlang —</option>
                {orgContracts.map(c => (
                  <option key={c.id} value={c.id}>
                    №{c.contract_number} · {CONTRACT_TYPES_I18N[c.contract_type]?.[lang] || c.contract_type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Org + Counterparty panels ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Chap: Sizning tashkilotingiz */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Sizning tashkilotingiz</p>
            {activeOrg ? (
              <div className="space-y-0">
                {[
                  { label: 'STIR/ЖШШИР', value: activeOrg.inn },
                  { label: 'Nomi',       value: activeOrg.name },
                  { label: 'Rahbar (FIO)', value: activeOrg.director_name },
                  { label: 'MFO',        value: activeOrg.mfo },
                  { label: 'Bank nomi',  value: activeOrg.bank_name },
                  { label: 'Hisob raqami', value: activeOrg.bank_account },
                  { label: 'OKED',       value: (activeOrg as any).oked },
                  { label: 'Manzil',     value: activeOrg.address },
                  { label: 'Telefon',    value: activeOrg.phone },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex items-start border-b border-[#1E293B]/60 py-2 gap-3">
                    <span className="text-[11px] text-blue-400/80 w-28 flex-shrink-0 pt-0.5">{row.label}</span>
                    <span className="text-xs text-gray-200 leading-relaxed break-all">{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Tashkilot tanlanmagan</p>
            )}
          </div>

          {/* O'ng: Kontragent ma'lumotlari */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Kontragent ma'lumotlari</p>
            {selectedCp ? (
              <div className="space-y-0">
                {[
                  { label: 'STIR/ЖШШИР', value: selectedCp.inn },
                  { label: 'Nomi',       value: selectedCp.name },
                  { label: 'Rahbar (FIO)', value: selectedCp.director_name },
                  { label: 'MFO',        value: selectedCp.mfo },
                  { label: 'Bank nomi',  value: selectedCp.bank_name },
                  { label: 'Hisob raqami', value: selectedCp.bank_account },
                  { label: 'OKED',       value: (selectedCp as any).oked },
                  { label: 'Manzil',     value: selectedCp.address },
                  { label: 'Telefon',    value: selectedCp.phone },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex items-start border-b border-[#1E293B]/60 py-2 gap-3">
                    <span className="text-[11px] text-blue-400/80 w-28 flex-shrink-0 pt-0.5">{row.label}</span>
                    <span className="text-xs text-gray-200 leading-relaxed break-all">{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 bg-[#1F2937] border border-[#1E293B] rounded-xl flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-gray-600"/>
                </div>
                <p className="text-sm text-gray-500">Kontragentni tanlang</p>
                <p className="text-xs text-gray-600 mt-1">Ma'lumotlar avtomatik chiqadi</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Items table ── */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">

          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E293B]">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-white">Mahsulotlar ro'yxati</h2>
              <span className="text-xs bg-[#1F2937] border border-[#1E293B] text-gray-400 px-2 py-0.5 rounded-full">{items.length} ta</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Barchasi uchun QQS:</span>
              <div className="flex gap-0.5 bg-[#0F172A] border border-[#1E293B] rounded-lg p-0.5">
                {QQS_OPTIONS.map(opt => (
                  <button key={opt.val} type="button"
                    onClick={() => setAllQqs(opt.val)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium text-gray-400 hover:text-white hover:bg-[#1F2937] transition">
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse" style={{ minWidth: '960px', width: '100%' }}>
              <colgroup>
                <col style={{ width: '40px' }}/>   {/* № */}
                <col/>                              {/* Nomi — flexible */}
                <col style={{ width: '100px' }}/>  {/* O'lchov */}
                <col style={{ width: '100px' }}/>  {/* Soni */}
                <col style={{ width: '130px' }}/>  {/* Narx */}
                <col style={{ width: '120px' }}/>  {/* Asosiy */}
                <col style={{ width: '90px' }}/>   {/* QQS % */}
                <col style={{ width: '100px' }}/>  {/* QQS summa */}
                <col style={{ width: '130px' }}/>  {/* Jami */}
                <col style={{ width: '32px' }}/>   {/* × */}
              </colgroup>
              <thead>
                <tr className="bg-[#0F172A] text-gray-400 border-b border-[#1E293B]">
                  <th className="px-2 py-2.5 text-center font-medium whitespace-nowrap">№</th>
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">Nomi</th>
                  <th className="px-2 py-2.5 text-center font-medium whitespace-nowrap">O'lchov</th>
                  <th className="px-2 py-2.5 text-right font-medium whitespace-nowrap">Soni</th>
                  <th className="px-2 py-2.5 text-right font-medium whitespace-nowrap">Narx</th>
                  <th className="px-2 py-2.5 text-right font-medium whitespace-nowrap">Asosiy</th>
                  <th className="px-2 py-2.5 text-center font-medium whitespace-nowrap">QQS,%</th>
                  <th className="px-2 py-2.5 text-right font-medium whitespace-nowrap">QQS summa</th>
                  <th className="px-2 py-2.5 text-right font-medium whitespace-nowrap">Jami</th>
                  <th/>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-t border-[#1E293B] hover:bg-[#1F2937]/50 transition group">
                    <td className="px-2 py-2 text-gray-500 text-center whitespace-nowrap">{i + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        className="w-full bg-transparent border-b border-transparent group-hover:border-[#1E293B] focus:border-blue-500 text-gray-200 py-0.5 focus:outline-none text-xs placeholder-gray-600 transition"
                        value={item.nomi} placeholder="Mahsulot yoki xizmat nomi"
                        onChange={e => updateItem(i, 'nomi', e.target.value)}/>
                    </td>
                    <td className="px-2 py-2">
                      <BirlikPicker value={item.birlik} onChange={v => updateItem(i, 'birlik', v)}/>
                    </td>
                    <td className="px-2 py-2">
                      <input type="number"
                        className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-1.5 py-1 text-gray-200 focus:outline-none focus:border-blue-500 text-xs text-right"
                        value={item.miqdori} min={0}
                        onChange={e => updateItem(i, 'miqdori', parseFloat(e.target.value) || 0)}/>
                    </td>
                    <td className="px-2 py-2">
                      <input type="number"
                        className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-1.5 py-1 text-gray-200 focus:outline-none focus:border-blue-500 text-xs text-right"
                        value={item.narxi} min={0}
                        onChange={e => updateItem(i, 'narxi', parseFloat(e.target.value) || 0)}/>
                    </td>
                    <td className="px-2 py-2 text-right text-gray-300 whitespace-nowrap">
                      {(item.miqdori * item.narxi).toLocaleString()}
                    </td>
                    <td className="px-2 py-2">
                      <select
                        className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-1 py-1 text-gray-200 focus:outline-none focus:border-blue-500 text-xs cursor-pointer"
                        value={item.qqs_foiz}
                        onChange={e => updateItem(i, 'qqs_foiz', e.target.value)}>
                        {QQS_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2 text-right text-amber-400 whitespace-nowrap">
                      {item.qqs_summa > 0 ? item.qqs_summa.toLocaleString() : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-2 py-2">
                      <input type="number"
                        title="Jami summani kiritib narxni avtomatik hisoblang"
                        className="w-full bg-[#0F172A] border border-blue-600/30 rounded px-1.5 py-1 text-white font-semibold focus:outline-none focus:border-blue-500 text-xs text-right"
                        value={item.summa} min={0}
                        onChange={e => updateItemFromJami(i, parseFloat(e.target.value) || 0)}/>
                    </td>
                    <td className="px-1 py-2">
                      <button type="button" onClick={() => removeItem(i)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-400 rounded transition opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3 h-3"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[#1E293B] bg-[#0A1628]">
                  <td colSpan={5} className="px-3 py-2.5 text-right text-gray-400 font-semibold whitespace-nowrap">Jami:</td>
                  <td className="px-2 py-2.5 text-right text-white font-semibold whitespace-nowrap">{asosiy.toLocaleString()}</td>
                  <td/>
                  <td className="px-2 py-2.5 text-right whitespace-nowrap">
                    {qqsJami > 0 ? <span className="text-amber-400 font-semibold">{qqsJami.toLocaleString()}</span> : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-2 py-2.5 text-right font-bold text-white whitespace-nowrap">{grand.toLocaleString()}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add row button */}
          <div className="px-5 py-3 border-t border-[#1E293B]">
            <button type="button"
              onClick={() => setItems(prev => [...prev, emptyItem()])}
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition">
              <Plus className="w-4 h-4"/>
              Qator qo'shish
            </button>
          </div>
        </div>

        {/* ── Summary ── */}
        {grand > 0 && (
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-[#1E293B]">
              <div className="px-6 py-4 text-center">
                <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Asosiy summa</p>
                <p className="text-2xl font-bold text-white">{asosiy.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">so'm</p>
              </div>
              <div className="px-6 py-4 text-center">
                <p className="text-xs text-gray-500 mb-1.5 uppercase tracking-wide">QQS</p>
                <p className="text-2xl font-bold text-amber-400">{qqsJami > 0 ? qqsJami.toLocaleString() : '—'}</p>
                {qqsJami > 0 && <p className="text-xs text-gray-500 mt-0.5">so'm</p>}
              </div>
              <div className="px-6 py-4 text-center bg-blue-600/5">
                <p className="text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Jami summa</p>
                <p className="text-2xl font-bold text-white">{grand.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">so'm</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom actions ── */}
        <div className="flex justify-end gap-3 pb-8">
          <Link href="/dashboard/spesifikatsiyalar"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-[#1F2937] border border-[#1E293B] text-gray-300 hover:text-white text-sm transition">
            <X className="w-4 h-4"/> Bekor qilish
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition">
            {saving
              ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>
              : <Save className="w-4 h-4"/>}
            {saving ? 'Saqlanmoqda…' : editId ? 'Yangilash' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  )
}
