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

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcItem(item: SpecItem): SpecItem {
  const asosiy = item.miqdori * item.narxi
  const foiz = item.qqs_foiz === 'siz' ? 0 : parseFloat(item.qqs_foiz || '0')
  const qqs_summa = Math.round(asosiy * foiz / 100)
  return { ...item, qqs_summa, summa: asosiy + qqs_summa }
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

const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'
const lbl = 'block text-xs text-gray-400 mb-1.5 font-medium'

// ─────────────────────────────────────────────────────────────────────────────

export default function YangiSpesifikatsiyaPage() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const editId      = searchParams.get('id')          // edit mode
  const { lang }    = useLang()
  const T           = (obj: Record<Lang, string>) => tr(obj, lang)
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

  // ── Auto spec number (new only) ───────────────────────────────────────────
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
    () => contracts.filter(c => c.organization_id === activeOrg?.id && (!cpId || c.counterparty_id === cpId)),
    [contracts, activeOrg?.id, cpId]
  )

  const cpsWithContracts = useMemo(
    () => cps.filter(cp => contracts.some(c => c.organization_id === activeOrg?.id && c.counterparty_id === cp.id)),
    [cps, contracts, activeOrg?.id]
  )

  const asosiy   = items.reduce((s, it) => s + it.miqdori * it.narxi, 0)
  const qqsJami  = items.reduce((s, it) => s + it.qqs_summa, 0)
  const grand    = items.reduce((s, it) => s + it.summa, 0)

  // ── Item helpers ──────────────────────────────────────────────────────────
  function updateItem(i: number, field: keyof SpecItem, value: string | number) {
    setItems(prev => prev.map((item, idx) => idx !== i ? item : calcItem({ ...item, [field]: value })))
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
    toast(editId ? "Spesifikatsiya yangilandi ✓" : "Spesifikatsiya saqlandi ✓", 'success')
    router.push('/dashboard/spesifikatsiyalar')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"/>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0B1220]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-[#0B1220]/95 backdrop-blur border-b border-[#1E293B] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/dashboard/spesifikatsiyalar" className="text-gray-500 hover:text-gray-300 transition">
            Spesifikatsiyalar
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">
            {editId ? `#${specNumber} — tahrirlash` : 'Yangi spesifikatsiya'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/spesifikatsiyalar"
            className="px-4 py-2 rounded-lg bg-[#1F2937] border border-[#1E293B] text-gray-300 hover:text-white text-sm transition">
            Bekor qilish
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-[#1F2937] disabled:text-gray-500 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
          >
            {saving && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>}
            {saving ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Basic info */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Asosiy ma'lumotlar</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Spesifikatsiya raqami *</label>
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
              <label className={lbl}>Kontragent (ixtiyoriy)</label>
              <select className={inp} value={cpId}
                onChange={e => { setCpId(e.target.value); setContractId('') }}>
                <option value="">— Kontragentni tanlang —</option>
                {cpsWithContracts.map(cp => (
                  <option key={cp.id} value={cp.id}>{cp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Shartnoma (ixtiyoriy)</label>
              <select className={inp} value={contractId}
                onChange={e => setContractId(e.target.value)}>
                <option value="">— Shartnomani tanlang —</option>
                {orgContracts.map(c => (
                  <option key={c.id} value={c.id}>
                    #{c.contract_number} · {CONTRACT_TYPES_I18N[c.contract_type]?.[lang] || c.contract_type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Mahsulotlar ro'yxati *</h2>
            <div className="flex items-center gap-2">
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

          <div className="rounded-xl border border-[#1E293B] overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[600px]">
                <thead>
                  <tr className="bg-[#0F172A] text-gray-400 text-left border-b border-[#1E293B]">
                    <th className="px-3 py-2.5 w-8 text-center">№</th>
                    <th className="px-2 py-2.5">Nomi</th>
                    <th className="px-2 py-2.5 w-20">O'lchov</th>
                    <th className="px-2 py-2.5 w-20 text-right">Soni</th>
                    <th className="px-2 py-2.5 w-28 text-right">Narx</th>
                    <th className="px-2 py-2.5 w-20 text-center">QQS</th>
                    <th className="px-2 py-2.5 w-28 text-right">Jami</th>
                    <th className="px-1 py-2.5 w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t border-[#1E293B] hover:bg-[#1F2937]">
                      <td className="px-3 py-2 text-gray-500 text-center">{i + 1}</td>
                      <td className="px-2 py-2">
                        <input
                          className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-blue-600 text-xs placeholder-gray-500"
                          value={item.nomi} placeholder="Mahsulot nomi"
                          onChange={e => updateItem(i, 'nomi', e.target.value)}/>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-blue-600 text-xs text-center"
                          value={item.birlik}
                          onChange={e => updateItem(i, 'birlik', e.target.value)}/>
                      </td>
                      <td className="px-2 py-2">
                        <input type="number"
                          className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-blue-600 text-xs text-right"
                          value={item.miqdori} min={0}
                          onChange={e => updateItem(i, 'miqdori', parseFloat(e.target.value) || 0)}/>
                      </td>
                      <td className="px-2 py-2">
                        <input type="number"
                          className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-2 py-1.5 text-gray-200 focus:outline-none focus:border-blue-600 text-xs text-right"
                          value={item.narxi} min={0}
                          onChange={e => updateItem(i, 'narxi', parseFloat(e.target.value) || 0)}/>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-1 py-1.5 text-gray-200 focus:outline-none focus:border-blue-600 text-xs cursor-pointer"
                          value={item.qqs_foiz}
                          onChange={e => updateItem(i, 'qqs_foiz', e.target.value)}>
                          {QQS_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2 text-right text-white font-semibold">
                        {item.summa.toLocaleString()}
                      </td>
                      <td className="px-1 py-2">
                        <button type="button" onClick={() => removeItem(i)}
                          className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-400 rounded transition text-base">
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#1E293B] bg-[#0F172A]">
                    <td colSpan={4} className="px-3 py-2.5 text-right text-gray-400 text-xs font-semibold">Jami:</td>
                    <td className="px-2 py-2.5 text-right text-white text-xs font-semibold">{asosiy.toLocaleString()}</td>
                    <td className="px-2 py-2.5 text-center text-orange-400 text-xs">{qqsJami > 0 ? qqsJami.toLocaleString() : '—'}</td>
                    <td className="px-2 py-2.5 text-right text-white font-bold text-sm">{grand.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <button type="button" onClick={() => setItems(prev => [...prev, emptyItem()])}
            className="w-full border-2 border-dashed border-[#1E293B] hover:border-orange-500 text-gray-500 hover:text-orange-400 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
            + Mahsulot qo'shish
          </button>
        </div>

        {/* Summary */}
        {items.length > 0 && grand > 0 && (
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">Asosiy summa</p>
                <p className="text-lg font-bold text-white">{asosiy.toLocaleString()} <span className="text-xs text-gray-500">so'm</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">QQS</p>
                <p className="text-lg font-bold text-orange-400">{qqsJami > 0 ? qqsJami.toLocaleString() : '—'} {qqsJami > 0 && <span className="text-xs text-gray-500">so'm</span>}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Jami summa</p>
                <p className="text-xl font-bold text-white">{grand.toLocaleString()} <span className="text-xs text-gray-500">so'm</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="flex justify-end gap-3 pb-8">
          <Link href="/dashboard/spesifikatsiyalar"
            className="px-6 py-2.5 rounded-lg bg-[#1F2937] border border-[#1E293B] text-gray-300 hover:text-white text-sm transition">
            Bekor qilish
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-[#1F2937] disabled:text-gray-500 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
          >
            {saving && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>}
            {saving ? 'Saqlanmoqda…' : editId ? 'Yangilash' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  )
}
