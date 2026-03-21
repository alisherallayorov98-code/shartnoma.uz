'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import type { Org, Counterparty } from '@/lib/types'
import type { ContractStructure } from '@/lib/contractStructures'
import { getStructure, structureToText, numberToWords } from '@/lib/contractStructures'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import { DEFAULT_TEMPLATES, type AppTemplate } from '@/lib/defaultTemplates'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SpecItem = {
  nomi: string
  birlik: string
  miqdori: number
  narxi: number
  qqs_foiz: string
  qqs_summa: number
  summa: number
}

export type ContractForm = {
  id: string
  contract_number: string
  contract_date: string
  contract_type: string
  amount: string
  organization_id: string
  counterparty_id: string
  status: string
  content: string
  city: string
  product_name: string
  spec_items: SpecItem[]
  qqs_enabled: boolean
  qqs_rate: number
  // extra fields
  ijara_manzil?: string
  ijara_maydon?: string
  oylik_tolov?: string
  ijara_muddat?: string
  ijara_boshlanish?: string
  ijara_tugash?: string
  xizmat_tavsif?: string
  xizmat_boshlanish?: string
  xizmat_tugash?: string
  xizmat_tolov?: string
  pudrat_obekt?: string
  pudrat_tavsif?: string
  pudrat_boshlanish?: string
  pudrat_tugash?: string
  qarz_maqsad?: string
  qarz_foiz?: string
  qarz_muddat?: string
  daval_material?: string
  daval_mahsulot?: string
  incoterms?: string
  yetkazish_joy?: string
  tolov_usuli?: string
  valyuta?: string
  asosiy_raqam?: string
  asosiy_sana?: string
  ozgartirish?: string
  yetkazish_muddat?: string
  yetkazish_place?: string
}

interface ContractModalProps {
  orgs: Org[]
  cps: Counterparty[]
  form: ContractForm
  setForm: React.Dispatch<React.SetStateAction<ContractForm>>
  onSave: (e: React.FormEvent) => Promise<void>
  onClose: () => void
  saving: boolean
  customTemplates: AppTemplate[]
}

// ─── Units of measure ────────────────────────────────────────────────────────

const BIRLIKLAR = [
  'dona', 'kg', 'g', 'tonna', 'litr', 'ml', 'm', 'sm', 'mm',
  'm²', 'm³', 'km', 'juft', 'to\'plam', 'quti', 'paket', 'sumka',
  'metr', 'pogon metr', 'soat', 'kun', 'oy', 'yil', 'ish', 'xizmat',
]

// ─── BirlikPicker ─────────────────────────────────────────────────────────────

function BirlikPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = BIRLIKLAR.filter(b => b.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1.5 text-xs text-left flex items-center justify-between focus:outline-none focus:border-blue-500"
      >
        <span>{value || 'dona'}</span>
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-40 max-h-48 flex flex-col">
          <div className="p-1.5 border-b border-gray-700">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full bg-gray-800 text-white text-xs px-2 py-1 rounded focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => { onChange(b); setOpen(false); setSearch('') }}
                className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-700 transition ${value === b ? 'text-blue-400' : 'text-gray-200'}`}
              >
                {b}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-2 text-xs text-gray-500">Topilmadi</div>
            )}
          </div>
          {search && !BIRLIKLAR.includes(search) && (
            <div className="p-1.5 border-t border-gray-700">
              <button
                type="button"
                onClick={() => { onChange(search); setOpen(false); setSearch('') }}
                className="w-full text-left text-xs text-blue-400 hover:text-blue-300 px-1"
              >
                + "{search}" qo'shish
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Contract type list ───────────────────────────────────────────────────────

const CONTRACT_TYPES = [
  { key: 'oldi_sotdi', icon: '🛒' },
  { key: 'xizmat',     icon: '🔧' },
  { key: 'ijara',      icon: '🏠' },
  { key: 'pudrat',     icon: '🏗️' },
  { key: 'moliyaviy',  icon: '💰' },
  { key: 'daval',      icon: '🔄' },
  { key: 'xalqaro',   icon: '🌐' },
  { key: 'qoshimcha', icon: '📎' },
  { key: 'boshqa',    icon: '📄' },
]

// ─── Main Modal Component ─────────────────────────────────────────────────────

export default function ContractModal({
  orgs, cps, form, setForm, onSave, onClose, saving, customTemplates
}: ContractModalProps) {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const [step, setStep] = useState(1)
  const [cpSearch, setCpSearch] = useState('')
  const [cpDropOpen, setCpDropOpen] = useState(false)
  const [useTemplate, setUseTemplate] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('auto')
  const [quickAddCp, setQuickAddCp] = useState(false)
  const [newCpName, setNewCpName] = useState('')
  const [newCpInn, setNewCpInn] = useState('')
  const [newCpDir, setNewCpDir] = useState('')
  const [savingCp, setSavingCp] = useState(false)
  const cpDropRef = useRef<HTMLDivElement>(null)

  const isEdit = !!form.id

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'
  const inp2 = 'w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500'

  // Close CP dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cpDropRef.current && !cpDropRef.current.contains(e.target as Node)) {
        setCpDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ─── Spec helpers ──────────────────────────────────────────────────────────

  function addSpecItem() {
    const item: SpecItem = { nomi: '', birlik: 'dona', miqdori: 1, narxi: 0, qqs_foiz: 'siz', qqs_summa: 0, summa: 0 }
    setForm(f => ({ ...f, spec_items: [...f.spec_items, item] }))
  }

  function removeSpecItem(i: number) {
    setForm(f => ({ ...f, spec_items: f.spec_items.filter((_, idx) => idx !== i) }))
  }

  function updateSpecItem(i: number, key: keyof SpecItem, val: string | number) {
    setForm(f => {
      const items = [...f.spec_items]
      const item = { ...items[i], [key]: val }
      // recalculate
      const base = (item.miqdori || 0) * (item.narxi || 0)
      let qqs = 0
      if (item.qqs_foiz === '12') qqs = base * 0.12
      else if (item.qqs_foiz === '15') qqs = base * 0.15
      else if (item.qqs_foiz === '0') qqs = 0
      item.qqs_summa = Math.round(qqs)
      item.summa = base + item.qqs_summa
      items[i] = item
      // update total amount
      const total = items.reduce((s, it) => s + it.summa, 0)
      return { ...f, spec_items: items, amount: String(total) }
    })
  }

  const specTotal = form.spec_items.reduce((s, i) => s + i.summa, 0)
  const specBase = form.spec_items.reduce((s, i) => s + i.miqdori * i.narxi, 0)
  const specQqs = form.spec_items.reduce((s, i) => s + i.qqs_summa, 0)

  // ─── Sections helpers ──────────────────────────────────────────────────────

  function ensureSections() {
    if (!form.content) {
      // Auto-generate from structure
      const org = orgs.find(o => o.id === form.organization_id)
      const cp = cps.find(c => c.id === form.counterparty_id)
      const extra: Record<string, string> = {
        IJARA_MANZIL: form.ijara_manzil || '',
        IJARA_MAYDON: form.ijara_maydon || '',
        IJARA_MUDDAT: form.ijara_muddat || '',
        IJARA_BOSHLANISH: form.ijara_boshlanish || '',
        IJARA_TUGASH: form.ijara_tugash || '',
        OYLIK_TOLOV: form.oylik_tolov || '',
        XIZMAT_TAVSIF: form.xizmat_tavsif || '',
        XIZMAT_BOSHLANISH: form.xizmat_boshlanish || '',
        XIZMAT_TUGASH: form.xizmat_tugash || '',
        XIZMAT_TOLOV: form.xizmat_tolov || '',
        PUDRAT_OBEKT: form.pudrat_obekt || '',
        PUDRAT_TAVSIF: form.pudrat_tavsif || '',
        PUDRAT_BOSHLANISH: form.pudrat_boshlanish || '',
        PUDRAT_TUGASH: form.pudrat_tugash || '',
        QARZ_MAQSAD: form.qarz_maqsad || '',
        QARZ_FOIZ: form.qarz_foiz || '',
        QARZ_MUDDAT: form.qarz_muddat || '',
        DAVAL_MATERIAL: form.daval_material || '',
        DAVAL_MAHSULOT: form.daval_mahsulot || '',
        INCOTERMS: form.incoterms || '',
        YETKAZISH_JOY: form.yetkazish_joy || '',
        TOLOV_USULI: form.tolov_usuli || '',
        VALYUTA: form.valyuta || '',
        ASOSIY_RAQAM: form.asosiy_raqam || '',
        ASOSIY_SANA: form.asosiy_sana || '',
        OZGARTIRISH: form.ozgartirish || '',
        YETKAZISH_MUDDAT: form.yetkazish_muddat || '',
      }
      const amount = parseFloat(form.amount) || 0
      const structure = getStructure(form.contract_type, {
        contract_number: form.contract_number,
        contract_date: form.contract_date,
        city: form.city,
        org_name: org?.name || '',
        org_inn: org?.inn || '',
        org_director: org?.director_name || '',
        cp_name: cp?.name || '',
        cp_inn: cp?.inn || '',
        cp_director: cp?.director_name || '',
        amount,
        amount_text: numberToWords(amount, 'uz') + " so'm",
        extra,
      })
      const text = structureToText(structure, {
        type_name: (CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type] || form.contract_type,
        number: form.contract_number,
        date: form.contract_date,
        city: form.city,
        org,
        cp,
      })
      setForm(f => ({ ...f, content: text }))
    }
  }

  // Parse content into sections for editing
  function parseStructure(): ContractStructure {
    if (!form.content) {
      const org = orgs.find(o => o.id === form.organization_id)
      const cp = cps.find(c => c.id === form.counterparty_id)
      const amount = parseFloat(form.amount) || 0
      return getStructure(form.contract_type, {
        contract_number: form.contract_number,
        contract_date: form.contract_date,
        city: form.city,
        org_name: org?.name || '',
        org_inn: org?.inn || '',
        org_director: org?.director_name || '',
        cp_name: cp?.name || '',
        cp_inn: cp?.inn || '',
        cp_director: cp?.director_name || '',
        amount,
        amount_text: numberToWords(amount, 'uz') + " so'm",
      })
    }
    // Simple parse: try to split by numbered sections
    const lines = form.content.split('\n')
    const bolimlar: ContractStructure['bolimlar'] = []
    let current: { sarlavha: string; bandlar: { matn: string }[] } | null = null
    for (const line of lines) {
      const secMatch = line.match(/^(\d+)\.\s+([A-Z\s'УЁQWERTYZXCVBNMASDFGHJKLPOIÙÀÈÌÒÙÄÖÜ\-\/]+)$/)
      if (secMatch && line === line.toUpperCase() && line.trim().length > 2) {
        if (current) bolimlar.push(current)
        current = { sarlavha: line.trim(), bandlar: [] }
      } else if (current && line.match(/^\d+\.\d+\.\s+/) && line.trim()) {
        current.bandlar.push({ matn: line.replace(/^\d+\.\d+\.\s+/, '').trim() })
      }
    }
    if (current) bolimlar.push(current)
    if (bolimlar.length === 0) {
      return { bolimlar: [{ sarlavha: 'SHARTNOMA MATNI', bandlar: [{ matn: form.content }] }] }
    }
    return { bolimlar }
  }

  const [editStructure, setEditStructure] = useState<ContractStructure | null>(null)

  function getStructureForEdit(): ContractStructure {
    if (editStructure) return editStructure
    const org = orgs.find(o => o.id === form.organization_id)
    const cp = cps.find(c => c.id === form.counterparty_id)
    const amount = parseFloat(form.amount) || 0
    return getStructure(form.contract_type, {
      contract_number: form.contract_number,
      contract_date: form.contract_date,
      city: form.city,
      org_name: org?.name || '',
      org_inn: org?.inn || '',
      org_director: org?.director_name || '',
      cp_name: cp?.name || '',
      cp_inn: cp?.inn || '',
      cp_director: cp?.director_name || '',
      amount,
      amount_text: numberToWords(amount, 'uz') + " so'm",
    })
  }

  function initStructureEdit() {
    if (!editStructure) {
      setEditStructure(getStructureForEdit())
    }
  }

  function updateBolim(bi: number, sarlavha: string) {
    setEditStructure(s => {
      if (!s) return s
      const bolimlar = s.bolimlar.map((b, i) => i === bi ? { ...b, sarlavha } : b)
      return { bolimlar }
    })
  }

  function updateBand(bi: number, bdi: number, matn: string) {
    setEditStructure(s => {
      if (!s) return s
      const bolimlar = s.bolimlar.map((b, i) => {
        if (i !== bi) return b
        return { ...b, bandlar: b.bandlar.map((bd, j) => j === bdi ? { matn } : bd) }
      })
      return { bolimlar }
    })
  }

  function addBolim() {
    setEditStructure(s => {
      if (!s) return { bolimlar: [{ sarlavha: 'YANGI BO\'LIM', bandlar: [{ matn: '' }] }] }
      return { bolimlar: [...s.bolimlar, { sarlavha: 'YANGI BO\'LIM', bandlar: [{ matn: '' }] }] }
    })
  }

  function removeBolim(bi: number) {
    setEditStructure(s => {
      if (!s) return s
      return { bolimlar: s.bolimlar.filter((_, i) => i !== bi) }
    })
  }

  function addBand(bi: number) {
    setEditStructure(s => {
      if (!s) return s
      return {
        bolimlar: s.bolimlar.map((b, i) =>
          i === bi ? { ...b, bandlar: [...b.bandlar, { matn: '' }] } : b
        )
      }
    })
  }

  function removeBand(bi: number, bdi: number) {
    setEditStructure(s => {
      if (!s) return s
      return {
        bolimlar: s.bolimlar.map((b, i) =>
          i === bi ? { ...b, bandlar: b.bandlar.filter((_, j) => j !== bdi) } : b
        )
      }
    })
  }

  // ─── Quick add CP ─────────────────────────────────────────────────────────

  async function handleQuickAddCp() {
    if (!newCpName.trim()) return
    setSavingCp(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.from('counterparties').insert({
      name: newCpName.trim(),
      inn: newCpInn.trim(),
      director_name: newCpDir.trim(),
      bank_name: '', bank_account: '', mfo: '', address: '',
      user_id: session!.user.id,
    }).select().single()
    setSavingCp(false)
    if (error) { alert('Xato: ' + error.message); return }
    if (data) {
      setForm(f => ({ ...f, counterparty_id: data.id }))
    }
    setQuickAddCp(false)
    setNewCpName(''); setNewCpInn(''); setNewCpDir('')
    setCpDropOpen(false)
  }

  // ─── Step navigation ──────────────────────────────────────────────────────

  function goToStep3() {
    initStructureEdit()
    setStep(3)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // If using template mode and we have an editStructure, convert to text
    if (editStructure) {
      const org = orgs.find(o => o.id === form.organization_id)
      const cp = cps.find(c => c.id === form.counterparty_id)
      const text = structureToText(editStructure, {
        type_name: (CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type] || form.contract_type,
        number: form.contract_number,
        date: form.contract_date,
        city: form.city,
        org,
        cp,
      })
      setForm(f => ({ ...f, content: text }))
    }
    onSave(e)
  }

  // ─── Selected org/cp ──────────────────────────────────────────────────────

  const selectedOrg = orgs.find(o => o.id === form.organization_id)
  const selectedCp = cps.find(c => c.id === form.counterparty_id)
  const filteredCps = cps.filter(cp =>
    cp.name.toLowerCase().includes(cpSearch.toLowerCase()) ||
    (cp.inn || '').includes(cpSearch)
  )

  // ─── All templates (default + custom) ─────────────────────────────────────

  const allTemplates: AppTemplate[] = [
    ...(DEFAULT_TEMPLATES || []).filter((tpl: AppTemplate) => tpl.type === form.contract_type),
    ...customTemplates.filter(tpl => tpl.type === form.contract_type),
  ]

  // ─── Step indicators ──────────────────────────────────────────────────────

  const steps = [
    T(t.modal.step1),
    T(t.modal.step2),
    T(t.modal.step3),
    T(t.modal.step4),
  ]

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              {isEdit ? T(t.modal.editContract) : T(t.modal.newContract)}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type] || form.contract_type}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-xl">×</button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-gray-800 flex-shrink-0">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { if (i + 1 === 3) initStructureEdit(); setStep(i + 1) }}
              className={`flex-1 py-2.5 text-xs font-medium transition ${
                step === i + 1
                  ? 'text-blue-400 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-6">

            {/* ── STEP 1: Basic info ── */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Contract number + date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{T(t.modal.contractNum)}</label>
                    <input
                      value={form.contract_number}
                      onChange={e => setForm(f => ({ ...f, contract_number: e.target.value }))}
                      className={inp}
                      placeholder="2024/001"
                      required
                    />
                  </div>
                  <div>
                    <label className={lbl}>{T(t.modal.contractDate)}</label>
                    <input
                      type="date"
                      value={form.contract_date}
                      onChange={e => setForm(f => ({ ...f, contract_date: e.target.value }))}
                      className={inp}
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className={lbl}>{T(t.modal.city)}</label>
                  <input
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className={inp}
                    placeholder="Toshkent"
                  />
                </div>

                {/* Contract type */}
                <div>
                  <label className={lbl}>{T(t.modal.contractType)}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CONTRACT_TYPES.map(ct => (
                      <button
                        key={ct.key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, contract_type: ct.key }))}
                        className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition ${
                          form.contract_type === ct.key
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                        }`}
                      >
                        <span>{ct.icon}</span>
                        <span className="truncate">{(CONTRACT_TYPE_NAMES as Record<string, string>)[ct.key]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className={lbl}>{T(t.modal.amount)}</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className={inp}
                    placeholder="0"
                    min="0"
                  />
                  {form.amount && parseFloat(form.amount) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {numberToWords(parseFloat(form.amount), 'uz')} so'm
                    </p>
                  )}
                </div>

                {/* Organization */}
                <div>
                  <label className={lbl}>{T(t.modal.selectOrg)}</label>
                  <select
                    value={form.organization_id}
                    onChange={e => setForm(f => ({ ...f, organization_id: e.target.value }))}
                    className={inp}
                    required
                  >
                    <option value="">{T(t.modal.selectOrg)}</option>
                    {orgs.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  {selectedOrg && (
                    <p className="text-xs text-gray-500 mt-1">INN: {selectedOrg.inn} | Rahbar: {selectedOrg.director_name}</p>
                  )}
                </div>

                {/* Counterparty with search dropdown */}
                <div>
                  <label className={lbl}>{T(t.modal.selectCp)}</label>
                  <div className="relative" ref={cpDropRef}>
                    <div
                      className={`${inp} cursor-pointer flex items-center justify-between`}
                      onClick={() => setCpDropOpen(o => !o)}
                    >
                      <span className={selectedCp ? 'text-white' : 'text-gray-500'}>
                        {selectedCp ? selectedCp.name : T(t.modal.selectCp)}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {cpDropOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 flex flex-col">
                        <div className="p-2 border-b border-gray-700">
                          <input
                            autoFocus
                            value={cpSearch}
                            onChange={e => setCpSearch(e.target.value)}
                            placeholder="Qidirish..."
                            className="w-full bg-gray-800 text-white text-sm px-3 py-1.5 rounded focus:outline-none"
                          />
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {filteredCps.map(cp => (
                            <button
                              key={cp.id}
                              type="button"
                              onClick={() => { setForm(f => ({ ...f, counterparty_id: cp.id })); setCpDropOpen(false); setCpSearch('') }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition ${form.counterparty_id === cp.id ? 'text-blue-400 bg-gray-800' : 'text-gray-200'}`}
                            >
                              <div className="font-medium">{cp.name}</div>
                              {cp.inn && <div className="text-xs text-gray-500">INN: {cp.inn}</div>}
                            </button>
                          ))}
                          {filteredCps.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">Topilmadi</div>
                          )}
                        </div>
                        <div className="p-2 border-t border-gray-700">
                          {quickAddCp ? (
                            <div className="space-y-2">
                              <input value={newCpName} onChange={e => setNewCpName(e.target.value)} placeholder="Tashkilot nomi *" className="w-full bg-gray-800 text-white text-sm px-2 py-1.5 rounded focus:outline-none border border-gray-700" />
                              <input value={newCpInn} onChange={e => setNewCpInn(e.target.value)} placeholder="INN" className="w-full bg-gray-800 text-white text-sm px-2 py-1.5 rounded focus:outline-none border border-gray-700" />
                              <input value={newCpDir} onChange={e => setNewCpDir(e.target.value)} placeholder="Rahbar" className="w-full bg-gray-800 text-white text-sm px-2 py-1.5 rounded focus:outline-none border border-gray-700" />
                              <div className="flex gap-2">
                                <button type="button" onClick={handleQuickAddCp} disabled={savingCp} className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded hover:bg-blue-500 disabled:opacity-50">
                                  {savingCp ? 'Saqlanmoqda...' : 'Saqlash'}
                                </button>
                                <button type="button" onClick={() => setQuickAddCp(false)} className="flex-1 border border-gray-600 text-gray-300 text-xs py-1.5 rounded hover:bg-gray-700">
                                  Bekor
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setQuickAddCp(true)} className="w-full text-xs text-blue-400 hover:text-blue-300 text-left px-1">
                              + Yangi kontragent qo'shish
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedCp && (
                    <p className="text-xs text-gray-500 mt-1">INN: {selectedCp.inn} | Rahbar: {selectedCp.director_name}</p>
                  )}
                </div>

                {/* Product name */}
                <div>
                  <label className={lbl}>{T(t.modal.productName)}</label>
                  <input
                    value={form.product_name}
                    onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                    className={inp}
                    placeholder="Tovar yoki xizmat nomi"
                  />
                </div>

                {/* Template selection */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <label className={lbl + ' mb-0'}>{T(t.modal.template)}</label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-700">
                      <button
                        type="button"
                        onClick={() => setUseTemplate(true)}
                        className={`px-3 py-1 text-xs transition ${useTemplate ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                      >
                        {T(t.modal.useTemplate)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUseTemplate(false)}
                        className={`px-3 py-1 text-xs transition ${!useTemplate ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                      >
                        {T(t.modal.manual)}
                      </button>
                    </div>
                  </div>
                  {useTemplate && (
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTemplate('auto')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition ${
                          selectedTemplate === 'auto'
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        Avtomatik shablon ({(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type]})
                      </button>
                      {allTemplates.map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(tpl.id)
                            setForm(f => ({ ...f, content: tpl.content }))
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition ${
                            selectedTemplate === tpl.id
                              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                              : 'border-gray-700 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <div className="font-medium">{tpl.icon} {tpl.name}</div>
                          {tpl.description && <div className="text-xs text-gray-500 mt-0.5">{tpl.description}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: Extra fields per type ── */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  {(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type]} uchun qo'shimcha ma'lumotlar
                </p>

                {/* Ijara */}
                {form.contract_type === 'ijara' && (
                  <>
                    <div>
                      <label className={lbl}>Ijara ob'ekti manzili</label>
                      <input value={form.ijara_manzil || ''} onChange={e => setForm(f => ({ ...f, ijara_manzil: e.target.value }))} className={inp} placeholder="Toshkent sh., Yunusobod t., ..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Maydon (m²)</label>
                        <input value={form.ijara_maydon || ''} onChange={e => setForm(f => ({ ...f, ijara_maydon: e.target.value }))} className={inp} placeholder="50" />
                      </div>
                      <div>
                        <label className={lbl}>Oylik to'lov (so'm)</label>
                        <input type="number" value={form.oylik_tolov || ''} onChange={e => setForm(f => ({ ...f, oylik_tolov: e.target.value }))} className={inp} placeholder="0" />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Ijara muddati</label>
                      <input value={form.ijara_muddat || ''} onChange={e => setForm(f => ({ ...f, ijara_muddat: e.target.value }))} className={inp} placeholder="12 oy" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Boshlanish sanasi</label>
                        <input type="date" value={form.ijara_boshlanish || ''} onChange={e => setForm(f => ({ ...f, ijara_boshlanish: e.target.value }))} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Tugash sanasi</label>
                        <input type="date" value={form.ijara_tugash || ''} onChange={e => setForm(f => ({ ...f, ijara_tugash: e.target.value }))} className={inp} />
                      </div>
                    </div>
                  </>
                )}

                {/* Xizmat */}
                {form.contract_type === 'xizmat' && (
                  <>
                    <div>
                      <label className={lbl}>Xizmat tavsifi</label>
                      <textarea value={form.xizmat_tavsif || ''} onChange={e => setForm(f => ({ ...f, xizmat_tavsif: e.target.value }))} className={inp} rows={3} placeholder="Ko'rsatiladigan xizmat haqida..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Boshlanish sanasi</label>
                        <input type="date" value={form.xizmat_boshlanish || ''} onChange={e => setForm(f => ({ ...f, xizmat_boshlanish: e.target.value }))} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Tugash sanasi</label>
                        <input type="date" value={form.xizmat_tugash || ''} onChange={e => setForm(f => ({ ...f, xizmat_tugash: e.target.value }))} className={inp} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>To'lov tartibi</label>
                      <input value={form.xizmat_tolov || ''} onChange={e => setForm(f => ({ ...f, xizmat_tolov: e.target.value }))} className={inp} placeholder="Masalan: 50% avans, qolgan 50% bajarilgandan keyin" />
                    </div>
                  </>
                )}

                {/* Pudrat */}
                {form.contract_type === 'pudrat' && (
                  <>
                    <div>
                      <label className={lbl}>Ish joyi (ob'ekt)</label>
                      <input value={form.pudrat_obekt || ''} onChange={e => setForm(f => ({ ...f, pudrat_obekt: e.target.value }))} className={inp} placeholder="Toshkent sh., ..." />
                    </div>
                    <div>
                      <label className={lbl}>Ishlar tavsifi</label>
                      <textarea value={form.pudrat_tavsif || ''} onChange={e => setForm(f => ({ ...f, pudrat_tavsif: e.target.value }))} className={inp} rows={3} placeholder="Bajarilishi kerak bo'lgan ishlar..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Boshlanish sanasi</label>
                        <input type="date" value={form.pudrat_boshlanish || ''} onChange={e => setForm(f => ({ ...f, pudrat_boshlanish: e.target.value }))} className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Tugash sanasi</label>
                        <input type="date" value={form.pudrat_tugash || ''} onChange={e => setForm(f => ({ ...f, pudrat_tugash: e.target.value }))} className={inp} />
                      </div>
                    </div>
                  </>
                )}

                {/* Moliyaviy */}
                {form.contract_type === 'moliyaviy' && (
                  <>
                    <div>
                      <label className={lbl}>Qarz maqsadi</label>
                      <input value={form.qarz_maqsad || ''} onChange={e => setForm(f => ({ ...f, qarz_maqsad: e.target.value }))} className={inp} placeholder="Qarz olish maqsadi..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Foiz stavkasi</label>
                        <input value={form.qarz_foiz || ''} onChange={e => setForm(f => ({ ...f, qarz_foiz: e.target.value }))} className={inp} placeholder="Foizsiz yoki yillik X%" />
                      </div>
                      <div>
                        <label className={lbl}>Qaytarish muddati</label>
                        <input value={form.qarz_muddat || ''} onChange={e => setForm(f => ({ ...f, qarz_muddat: e.target.value }))} className={inp} placeholder="12 oy" />
                      </div>
                    </div>
                  </>
                )}

                {/* Daval */}
                {form.contract_type === 'daval' && (
                  <>
                    <div>
                      <label className={lbl}>Daval material</label>
                      <input value={form.daval_material || ''} onChange={e => setForm(f => ({ ...f, daval_material: e.target.value }))} className={inp} placeholder="Xom ashyo turi va miqdori" />
                    </div>
                    <div>
                      <label className={lbl}>Tayyor mahsulot</label>
                      <input value={form.daval_mahsulot || ''} onChange={e => setForm(f => ({ ...f, daval_mahsulot: e.target.value }))} className={inp} placeholder="Tayyor mahsulot turi" />
                    </div>
                  </>
                )}

                {/* Xalqaro */}
                {form.contract_type === 'xalqaro' && (
                  <>
                    <div>
                      <label className={lbl}>Incoterms 2020</label>
                      <input value={form.incoterms || ''} onChange={e => setForm(f => ({ ...f, incoterms: e.target.value }))} className={inp} placeholder="FOB, CIF, DAP, ..." />
                    </div>
                    <div>
                      <label className={lbl}>Yetkazib berish joyi</label>
                      <input value={form.yetkazish_joy || ''} onChange={e => setForm(f => ({ ...f, yetkazish_joy: e.target.value }))} className={inp} placeholder="Port / shahar" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>To'lov usuli</label>
                        <input value={form.tolov_usuli || ''} onChange={e => setForm(f => ({ ...f, tolov_usuli: e.target.value }))} className={inp} placeholder="Bank o'tkazma / Akkreditiv" />
                      </div>
                      <div>
                        <label className={lbl}>Valyuta</label>
                        <input value={form.valyuta || ''} onChange={e => setForm(f => ({ ...f, valyuta: e.target.value }))} className={inp} placeholder="USD / EUR / UZS" />
                      </div>
                    </div>
                  </>
                )}

                {/* Qoshimcha */}
                {form.contract_type === 'qoshimcha' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Asosiy shartnoma raqami</label>
                        <input value={form.asosiy_raqam || ''} onChange={e => setForm(f => ({ ...f, asosiy_raqam: e.target.value }))} className={inp} placeholder="2024/001" />
                      </div>
                      <div>
                        <label className={lbl}>Asosiy shartnoma sanasi</label>
                        <input type="date" value={form.asosiy_sana || ''} onChange={e => setForm(f => ({ ...f, asosiy_sana: e.target.value }))} className={inp} />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>O'zgartirishlar mazmuni</label>
                      <textarea value={form.ozgartirish || ''} onChange={e => setForm(f => ({ ...f, ozgartirish: e.target.value }))} className={inp} rows={4} placeholder="Qanday o'zgartirishlar kiritilmoqda..." />
                    </div>
                  </>
                )}

                {/* Oldi-sotdi */}
                {form.contract_type === 'oldi_sotdi' && (
                  <>
                    <div>
                      <label className={lbl}>Yetkazib berish muddati</label>
                      <input value={form.yetkazish_muddat || ''} onChange={e => setForm(f => ({ ...f, yetkazish_muddat: e.target.value }))} className={inp} placeholder="Masalan: 30 kalendar kun ichida" />
                    </div>
                    <div>
                      <label className={lbl}>Yetkazib berish joyi</label>
                      <input value={form.yetkazish_joy || ''} onChange={e => setForm(f => ({ ...f, yetkazish_joy: e.target.value }))} className={inp} placeholder="Xaridorning yuridik manzili" />
                    </div>
                  </>
                )}

                {/* Boshqa — free text */}
                {form.contract_type === 'boshqa' && (
                  <div>
                    <label className={lbl}>Shartnoma matni (ixtiyoriy)</label>
                    <textarea
                      value={form.content}
                      onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      className={inp}
                      rows={10}
                      placeholder="Shartnoma matnini bu yerga kiriting..."
                    />
                  </div>
                )}

                {/* QQS toggle */}
                <div className="pt-2 border-t border-gray-800">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setForm(f => ({ ...f, qqs_enabled: !f.qqs_enabled }))}
                        className={`relative w-10 h-5 rounded-full transition ${form.qqs_enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.qqs_enabled ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className="text-sm text-gray-300">{T(t.modal.qqs)}</span>
                    </label>
                    {form.qqs_enabled && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{T(t.modal.qqsRate)}:</span>
                        <select
                          value={form.qqs_rate}
                          onChange={e => setForm(f => ({ ...f, qqs_rate: parseInt(e.target.value) }))}
                          className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-xs focus:outline-none"
                        >
                          <option value={12}>12%</option>
                          <option value={15}>15%</option>
                          <option value={0}>0%</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Sections editor ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Bo'limlarni tahrirlang</p>
                  <button type="button" onClick={addBolim} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    {T(t.modal.addSection)}
                  </button>
                </div>

                {getStructureForEdit().bolimlar.map((bolim, bi) => (
                  <div key={bi} className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
                    <div className="flex items-center gap-2">
                      <input
                        value={bolim.sarlavha}
                        onChange={e => updateBolim(bi, e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-600 text-white font-semibold text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        placeholder={`${bi + 1}. Bo'lim nomi`}
                      />
                      <button type="button" onClick={() => removeBolim(bi)} className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:bg-red-400/10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    {bolim.bandlar.map((band, bdi) => (
                      <div key={bdi} className="flex gap-2">
                        <span className="text-xs text-gray-500 pt-2 min-w-[30px]">{bi + 1}.{bdi + 1}</span>
                        <textarea
                          value={band.matn}
                          onChange={e => updateBand(bi, bdi, e.target.value)}
                          className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                          rows={2}
                          placeholder="Band matni..."
                        />
                        <button type="button" onClick={() => removeBand(bi, bdi)} className="w-6 h-6 mt-1 flex-shrink-0 flex items-center justify-center rounded text-gray-500 hover:text-red-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addBand(bi)} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
                      {T(t.modal.addItem)}
                    </button>
                  </div>
                ))}

                {getStructureForEdit().bolimlar.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <p>Bo'limlar yo'q</p>
                    <button type="button" onClick={addBolim} className="mt-2 text-blue-400 hover:text-blue-300 text-xs">
                      + Bo'lim qo'shish
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: Spec items ── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">Mahsulot / xizmat ro'yxati</p>
                  <button type="button" onClick={addSpecItem} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    + Qator qo'shish
                  </button>
                </div>

                {form.spec_items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-700">
                          <th className="text-left pb-2 pr-2 min-w-[120px]">Nomi</th>
                          <th className="text-left pb-2 pr-2 w-24">Birlik</th>
                          <th className="text-right pb-2 pr-2 w-20">Miqdor</th>
                          <th className="text-right pb-2 pr-2 w-24">Narxi</th>
                          <th className="text-center pb-2 pr-2 w-20">QQS%</th>
                          <th className="text-right pb-2 pr-2 w-24">QQS summa</th>
                          <th className="text-right pb-2 w-28">Jami</th>
                          <th className="w-6"></th>
                        </tr>
                      </thead>
                      <tbody className="space-y-1">
                        {form.spec_items.map((item, i) => (
                          <tr key={i} className="border-b border-gray-800">
                            <td className="py-1 pr-2">
                              <input
                                value={item.nomi}
                                onChange={e => updateSpecItem(i, 'nomi', e.target.value)}
                                className={inp2}
                                placeholder="Nomi"
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <BirlikPicker value={item.birlik} onChange={v => updateSpecItem(i, 'birlik', v)} />
                            </td>
                            <td className="py-1 pr-2">
                              <input
                                type="number"
                                value={item.miqdori}
                                onChange={e => updateSpecItem(i, 'miqdori', parseFloat(e.target.value) || 0)}
                                className={inp2 + ' text-right'}
                                min={0}
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <input
                                type="number"
                                value={item.narxi}
                                onChange={e => updateSpecItem(i, 'narxi', parseFloat(e.target.value) || 0)}
                                className={inp2 + ' text-right'}
                                min={0}
                              />
                            </td>
                            <td className="py-1 pr-2">
                              <select
                                value={item.qqs_foiz}
                                onChange={e => updateSpecItem(i, 'qqs_foiz', e.target.value)}
                                className={inp2 + ' text-center'}
                              >
                                <option value="siz">QQSsiz</option>
                                <option value="0">0%</option>
                                <option value="12">12%</option>
                                <option value="15">15%</option>
                              </select>
                            </td>
                            <td className="py-1 pr-2 text-right text-gray-400">
                              {item.qqs_summa.toLocaleString()}
                            </td>
                            <td className="py-1 text-right font-medium text-white">
                              {item.summa.toLocaleString()}
                            </td>
                            <td className="py-1 pl-1">
                              <button type="button" onClick={() => removeSpecItem(i)} className="text-red-400 hover:text-red-300 w-5 h-5 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <p>Spesifikatsiya bo'sh</p>
                    <button type="button" onClick={addSpecItem} className="mt-2 text-blue-400 hover:text-blue-300 text-xs">
                      + Qator qo'shish
                    </button>
                  </div>
                )}

                {/* Totals */}
                {form.spec_items.length > 0 && (
                  <div className="bg-gray-800/50 rounded-xl p-4 space-y-2 border border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Soliqsiz jami:</span>
                      <span className="text-white">{specBase.toLocaleString()} so'm</span>
                    </div>
                    {specQqs > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">QQS jami:</span>
                        <span className="text-yellow-400">{specQqs.toLocaleString()} so'm</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold border-t border-gray-700 pt-2">
                      <span className="text-gray-300">Jami:</span>
                      <span className="text-white text-base">{specTotal.toLocaleString()} so'm</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      So'z bilan: {numberToWords(specTotal, 'uz')} so'm
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(s => s - 1)}
                    className="px-4 py-2 text-sm border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition"
                  >
                    ← {T(t.btn.prev)}
                  </button>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition"
                >
                  {T(t.btn.cancel)}
                </button>
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => { if (step === 2) goToStep3(); else setStep(s => s + 1) }}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition"
                  >
                    {T(t.btn.next)} →
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-semibold transition"
                  >
                    {saving ? T(t.btn.saving) : T(t.btn.save)}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
