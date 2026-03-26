'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { Modal, ModalActions } from '../_components/Modal'
import ConfirmModal from '../_components/ConfirmModal'
import { useToast } from '@/lib/toast'
import type { Specification, SpecItem } from '@/lib/types'
import { generateSpecWord, generateSpecPDF } from '@/lib/specExport'

const emptySpecForm = { contract_id: '', spec_number: '', items: [] as SpecItem[], notes: '' }

function calcItem(item: SpecItem): SpecItem {
  const asosiy = item.miqdori * item.narxi
  const foiz = item.qqs_foiz === 'siz' ? 0 : parseFloat(item.qqs_foiz || '0')
  const qqs_summa = Math.round(asosiy * foiz / 100)
  return { ...item, qqs_summa, summa: asosiy + qqs_summa }
}
const emptySpecItem = (): SpecItem => calcItem({ nomi: '', birlik: 'dona', miqdori: 1, narxi: 0, qqs_foiz: 'siz', qqs_summa: 0, summa: 0 })

export default function SpesifikatsiyalarPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { activeOrg, contracts, cps, isFree, openUpgradeModal } = useDashboard()
  const { toast } = useToast()

  const [specs, setSpecs] = useState<Specification[]>([])
  const [specModal, setSpecModal] = useState(false)
  const [editingSpec, setEditingSpec] = useState<Specification | null>(null)
  const [specForm, setSpecForm] = useState(emptySpecForm)
  const [specItems, setSpecItems] = useState<SpecItem[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [specCpId, setSpecCpId] = useState('')

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

  useEffect(() => {
    if (activeOrg) loadSpecs(activeOrg.id)
  }, [activeOrg?.id])

  async function loadSpecs(orgId: string) {
    const { data, error } = await supabase.from('specifications')
      .select('*, contracts(contract_number, contract_date, contract_type, counterparty_id, counterparties(name))')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
    if (error) { console.error('loadSpecs:', error.message); return }
    setSpecs(data || [])
  }

  async function saveSpec(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!activeOrg) return
    if (specItems.length === 0) { toast(T(t.msg.addItem), 'error'); setSaving(false); return }
    const payload = {
      organization_id: activeOrg.id,
      contract_id: specForm.contract_id || null,
      spec_number: specForm.spec_number,
      items: specItems,
      notes: specForm.notes,
    }
    let specErr = null
    if (editingSpec) {
      const { error } = await supabase.from('specifications').update(payload).eq('id', editingSpec.id)
      specErr = error
    } else {
      const { error } = await supabase.from('specifications').insert(payload)
      specErr = error
    }
    setSaving(false)
    if (specErr) { toast(`${T(t.msg.errorPrefix)}: ${specErr.message}`, 'error'); return }
    setSpecModal(false); setEditingSpec(null); setSpecForm(emptySpecForm); setSpecItems([]); setSpecCpId('')
    loadSpecs(activeOrg.id)
  }

  function deleteSpec(id: string) {
    setConfirmDeleteId(id)
  }

  async function doDeleteSpec(id: string) {
    const { error } = await supabase.from('specifications').delete().eq('id', id)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    if (activeOrg) loadSpecs(activeOrg.id)
  }


  function updateSpecItem(i: number, field: keyof SpecItem, value: string | number) {
    const updated = specItems.map((item, idx) => {
      if (idx !== i) return item
      return calcItem({ ...item, [field]: value })
    })
    setSpecItems(updated)
  }

  const CONTRACT_TYPES_I18N: Record<string, Record<'uz' | 'oz' | 'ru', string>> = {
    oldi_sotdi: { uz: 'Oldi-sotdi', oz: 'Олди-сотди', ru: 'Купля-продажа' },
    xizmat: { uz: 'Xizmat', oz: 'Хизмат', ru: 'Услуги' },
    ijara: { uz: 'Ijara', oz: 'Ижара', ru: 'Аренда' },
    pudrat: { uz: 'Pudrat', oz: 'Пудрат', ru: 'Подряд' },
    boshqa: { uz: 'Boshqa', oz: 'Бошқа', ru: 'Другой' },
  }

  const specAsosiy = specItems.reduce((s, it) => s + it.miqdori * it.narxi, 0)
  const specQqsJami = specItems.reduce((s, it) => s + it.qqs_summa, 0)
  const specGrand = specItems.reduce((s, it) => s + it.summa, 0)

  const QQS_OPTIONS = [
    { val: 'siz', label: 'QQSsiz' },
    { val: '0', label: '0%' },
    { val: '12', label: '12%' },
    { val: '15', label: '15%' },
  ]

  function nextSpecNumber() {
    const max = specs.reduce((m, s) => {
      const n = parseInt(s.spec_number.replace(/\D/g, ''), 10)
      return isNaN(n) ? m : Math.max(m, n)
    }, 0)
    return `SPEC-${String(max + 1).padStart(3, '0')}`
  }

  const cpsWithContracts = useMemo(
    () => cps.filter(cp => contracts.some(c => c.organization_id === activeOrg?.id && c.counterparty_id === cp.id)),
    [cps, contracts, activeOrg?.id]
  )

  const filteredContracts = useMemo(
    () => contracts.filter(c => c.organization_id === activeOrg?.id && (!specCpId || c.counterparty_id === specCpId)),
    [contracts, activeOrg?.id, specCpId]
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">📋 Spesifikatsiyalar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{specs.length} ta spesifikatsiya</p>
        </div>
        <button onClick={() => {
          if (isFree && specs.length >= 5) { openUpgradeModal(); return }
          setEditingSpec(null)
          setSpecForm({ ...emptySpecForm, spec_number: nextSpecNumber() })
          setSpecItems([emptySpecItem()])
          setSpecCpId('')
          setSpecModal(true)
        }} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          {T(t.specTab.newBtn)}
        </button>
      </div>

      {/* Empty state */}
      {specs.length === 0 ? (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-400 font-medium">{T(t.specTab.empty)}</p>
          <p className="text-gray-600 text-sm mt-1">{T(t.specTab.createNew)}</p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0F172A]">
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colNum)}</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colContract)}</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colCp)}</th>
                <th className="text-center px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colItems)}</th>
                <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colTotal)}</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colDate)}</th>
                <th className="px-4 py-2.5 text-xs text-gray-400 font-medium text-right">{T(t.specTab.colActions)}</th>
              </tr>
            </thead>
            <tbody>
              {specs.map(spec => {
                const total = spec.items.reduce((s, it) => s + (it.summa || 0), 0)
                const contract = spec.contracts
                return (
                  <tr key={spec.id} className="border-t border-[#1E293B] hover:bg-[#1F2937] transition">
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-semibold text-white">#{spec.spec_number}</span>
                      {spec.notes && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[120px]">{spec.notes}</div>}
                    </td>
                    <td className="px-4 py-2.5">
                      {contract
                        ? <span className="text-xs bg-[#1F2937] text-blue-300 border border-[#1E293B] px-2 py-0.5 rounded-full">№{contract.contract_number}</span>
                        : <span className="text-xs text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-300 max-w-[150px] truncate">
                      {contract?.counterparties?.name || <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-xs bg-[#1F2937] text-gray-400 border border-[#1E293B] px-2 py-0.5 rounded-full">{spec.items.length} {T(t.specTab.items)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-white font-semibold text-sm">
                      {total.toLocaleString()} <span className="text-xs text-gray-500">{T(t.overviewTab.som)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {new Date(spec.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => generateSpecWord(spec, activeOrg, cps)}
                          className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition font-semibold">
                          📝 Word
                        </button>
                        <button onClick={() => generateSpecPDF(spec, activeOrg, cps)}
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-900/20 transition font-medium">
                          📄 PDF
                        </button>
                        <button onClick={() => {
                          setEditingSpec(spec)
                          const cpId = spec.contracts?.counterparty_id || ''
                          setSpecCpId(cpId)
                          setSpecForm({
                            contract_id: spec.contract_id || '',
                            spec_number: spec.spec_number,
                            notes: spec.notes || '',
                            items: spec.items,
                          })
                          setSpecItems(spec.items)
                          setSpecModal(true)
                        }} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-900/20 transition">
                          {T(t.specTab.edit)}
                        </button>
                        <button onClick={() => deleteSpec(spec.id)}
                          className="text-xs text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-900/20 transition">
                          {T(t.btn.delete)}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Spec modal */}
      {specModal && (
        <Modal title={editingSpec ? "Spesifikatsiyani tahrirlash" : T(t.specTab.newBtn)} onClose={() => { setSpecModal(false); setEditingSpec(null); setSpecForm(emptySpecForm); setSpecItems([]); setSpecCpId('') }} xl>
          <form onSubmit={saveSpec} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Spesifikatsiya raqami *</label>
                <input className={inp} required value={specForm.spec_number}
                  onChange={e => setSpecForm({ ...specForm, spec_number: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Izoh</label>
                <input className={inp} placeholder="Ixtiyoriy izoh..."
                  value={specForm.notes} onChange={e => setSpecForm({ ...specForm, notes: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Kontragent (ixtiyoriy)</label>
                <select className={inp} value={specCpId}
                  onChange={e => { setSpecCpId(e.target.value); setSpecForm(f => ({ ...f, contract_id: '' })) }}>
                  <option value="">— Kontragentni tanlang —</option>
                  {cpsWithContracts.map(cp => (
                    <option key={cp.id} value={cp.id}>{cp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Shartnoma (ixtiyoriy)</label>
                <select className={inp} value={specForm.contract_id}
                  onChange={e => setSpecForm({ ...specForm, contract_id: e.target.value })}>
                  <option value="">— Shartnomani tanlang —</option>
                  {filteredContracts.map(c => (
                    <option key={c.id} value={c.id}>
                      #{c.contract_number} · {CONTRACT_TYPES_I18N[c.contract_type]?.[lang] || c.contract_type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Spec items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Mahsulotlar ro'yxati *</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Barchasi uchun QQS:</span>
                  <div className="flex gap-0.5 bg-[#0F172A] border border-[#1E293B] rounded-lg p-0.5">
                    {QQS_OPTIONS.map(opt => (
                      <button key={opt.val} type="button"
                        onClick={() => setSpecItems(specItems.map(item => calcItem({ ...item, qqs_foiz: opt.val })))}
                        className="px-2.5 py-1 rounded-md text-xs font-medium transition text-gray-400 hover:text-white hover:bg-[#1F2937]">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {specItems.length > 0 && (
                <div className="rounded-xl border border-[#1E293B] overflow-hidden mb-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[580px]">
                      <thead>
                        <tr className="bg-[#0F172A] text-gray-400 text-left border-b border-[#1E293B]">
                          <th className="px-3 py-2 w-7 text-center">№</th>
                          <th className="px-2 py-2">Nomi</th>
                          <th className="px-2 py-2 w-20">O'lchov</th>
                          <th className="px-2 py-2 w-20 text-right">Soni</th>
                          <th className="px-2 py-2 w-24 text-right">Narx</th>
                          <th className="px-2 py-2 w-20 text-center">QQS</th>
                          <th className="px-2 py-2 w-24 text-right">Jami</th>
                          <th className="px-1 py-2 w-6"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {specItems.map((item, i) => (
                          <tr key={i} className="border-t border-[#1E293B] hover:bg-[#1F2937]">
                            <td className="px-3 py-1.5 text-gray-500 text-center">{i + 1}</td>
                            <td className="px-2 py-1.5">
                              <input className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-blue-600 text-xs placeholder-gray-500"
                                value={item.nomi} placeholder="Mahsulot nomi"
                                onChange={e => updateSpecItem(i, 'nomi', e.target.value)}/>
                            </td>
                            <td className="px-2 py-1.5">
                              <input className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-blue-600 text-xs text-center"
                                value={item.birlik} placeholder="dona"
                                onChange={e => updateSpecItem(i, 'birlik', e.target.value)}/>
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-blue-600 text-xs text-right"
                                value={item.miqdori} min={0}
                                onChange={e => updateSpecItem(i, 'miqdori', parseFloat(e.target.value) || 0)}/>
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-blue-600 text-xs text-right"
                                value={item.narxi} min={0}
                                onChange={e => updateSpecItem(i, 'narxi', parseFloat(e.target.value) || 0)}/>
                            </td>
                            <td className="px-2 py-1.5">
                              <select className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-1 py-1 text-gray-200 focus:outline-none focus:border-blue-600 text-xs text-center cursor-pointer"
                                value={item.qqs_foiz}
                                onChange={e => updateSpecItem(i, 'qqs_foiz', e.target.value)}>
                                {QQS_OPTIONS.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-1.5 text-right text-white font-semibold">{item.summa.toLocaleString()}</td>
                            <td className="px-1 py-1.5">
                              <button type="button" onClick={() => setSpecItems(specItems.filter((_, idx) => idx !== i))}
                                className="w-5 h-5 flex items-center justify-center text-gray-600 hover:text-red-400 rounded transition">×</button>
                            </td>
                          </tr>
                        ))}
                        <tfoot>
                          <tr className="border-t-2 border-[#1E293B] bg-[#0F172A]">
                            <td colSpan={4} className="px-3 py-2 text-right text-gray-400 text-xs font-semibold">Jami:</td>
                            <td className="px-2 py-2 text-right text-white text-xs font-semibold">{specAsosiy.toLocaleString()}</td>
                            <td className="px-2 py-2 text-center text-orange-400 text-xs">{specQqsJami > 0 ? specQqsJami.toLocaleString() : '—'}</td>
                            <td className="px-2 py-2 text-right text-white font-bold">{specGrand.toLocaleString()}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button type="button" onClick={() => setSpecItems([...specItems, emptySpecItem()])}
                className="w-full border-2 border-dashed border-[#1E293B] hover:border-orange-500 text-gray-500 hover:text-orange-400 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
                + Mahsulot qo'shish
              </button>
            </div>

            <ModalActions onClose={() => { setSpecModal(false); setEditingSpec(null); setSpecForm(emptySpecForm); setSpecItems([]); setSpecCpId('') }} saving={saving}/>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message={T(t.msg.deleteSpecConfirm)}
          onConfirm={() => { const id = confirmDeleteId; setConfirmDeleteId(null); doDeleteSpec(id) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
