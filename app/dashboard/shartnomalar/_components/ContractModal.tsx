'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import type { Org, Counterparty } from '@/lib/types'
import type { ContractStructure } from '@/lib/contractStructures'
import { getStructure, structureToText, numberToWords } from '@/lib/contractStructures'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import { getBankByMfo } from '@/lib/bankMfo'
import { formatPhoneUz } from '@/lib/inputMasks'
import { DEFAULT_TEMPLATES, type AppTemplate } from '@/lib/defaultTemplates'
import { useToast } from '@/lib/toast'
import CityPicker from './CityPicker'

function orgCityDefault(org: { viloyat?: string; tuman?: string } | null | undefined): string {
  if (!org) return 'Toshkent shahri'
  if (org.tuman?.trim()) return org.tuman.trim()
  const v = org.viloyat?.trim() || ''
  const MAP: Record<string, string> = {
    'Toshkent shahri': 'Toshkent shahri', 'Toshkent viloyati': 'Toshkent shahri',
    'Samarqand': 'Samarqand shahri', 'Buxoro': 'Buxoro shahri',
    "Farg'ona": "Farg'ona shahri", 'Andijon': 'Andijon shahri',
    'Namangan': 'Namangan shahri', 'Qashqadaryo': 'Qarshi shahri',
    'Surxondaryo': 'Termiz shahri', 'Navoiy': 'Navoiy shahri',
    'Jizzax': 'Jizzax shahri', 'Sirdaryo': 'Guliston shahri',
    'Xorazm': 'Urganch shahri', "Qoraqalpog'iston": 'Nukus shahri',
  }
  return MAP[v] || 'Toshkent shahri'
}

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
  yangi_muddat?: string
  yetkazish_muddat?: string
  yetkazish_place?: string
}

interface ContractModalProps {
  orgs: Org[]
  cps: Counterparty[]
  form: ContractForm
  setForm: React.Dispatch<React.SetStateAction<ContractForm>>
  onSave: (contentOverride?: string) => Promise<void>
  onClose: () => void
  saving: boolean
  customTemplates: AppTemplate[]
  onCpAdded?: (cp: Counterparty) => void
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
        className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded px-2 py-1.5 text-xs text-left flex items-center justify-between focus:outline-none focus:border-blue-600 cursor-pointer"
      >
        <span>{value || 'dona'}</span>
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl w-40 max-h-48 flex flex-col">
          <div className="p-1.5 border-b border-[#1E293B]">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full bg-[#0F172A] text-gray-200 text-xs px-2 py-1 rounded focus:outline-none border border-[#1E293B] placeholder-gray-500"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => { onChange(b); setOpen(false); setSearch('') }}
                className={`w-full text-left px-2 py-1 text-xs hover:bg-[#1F2937] transition ${value === b ? 'text-blue-400' : 'text-gray-200'}`}
              >
                {b}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-2 py-2 text-xs text-gray-500">Topilmadi</div>
            )}
          </div>
          {search && !BIRLIKLAR.includes(search) && (
            <div className="p-1.5 border-t border-[#1E293B]">
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

const CONTRACT_TYPES: { key: string; color: string }[] = [
  { key: 'oldi_sotdi', color: '#3B82F6' },
  { key: 'xizmat',     color: '#10B981' },
  { key: 'ijara',      color: '#F59E0B' },
  { key: 'pudrat',     color: '#F97316' },
  { key: 'moliyaviy',  color: '#8B5CF6' },
  { key: 'daval',      color: '#06B6D4' },
  { key: 'xalqaro',   color: '#6366F1' },
  { key: 'agentlik',  color: '#EC4899' },
  { key: 'transport', color: '#14B8A6' },
  { key: 'lizing',    color: '#64748B' },
  { key: 'qoshimcha', color: '#6B7280' },
  { key: 'boshqa',    color: '#4B5563' },
]

// ─── Main Modal Component ─────────────────────────────────────────────────────

export default function ContractModal({
  orgs, cps, form, setForm, onSave, onClose, saving, customTemplates, onCpAdded
}: ContractModalProps) {
  const { lang } = useLang()
  const { toast } = useToast()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const [step, setStep] = useState(1)
  const [cpSearch, setCpSearch] = useState('')
  const [cpDropOpen, setCpDropOpen] = useState(false)
  const [useTemplate, setUseTemplate] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('auto')
  const [quickAddCp, setQuickAddCp] = useState(false)
  const [newCp, setNewCp] = useState({ name: '', inn: '', director_name: '', address: '', phone: '', bank_name: '', bank_account: '', mfo: '', qqsreg: '', oked: '' })
  const [savingCp, setSavingCp] = useState(false)
  const [localCps, setLocalCps] = useState<Counterparty[]>(cps)

  // cps prop yangilanganda localCps ni ham yangilash
  useEffect(() => { setLocalCps(cps) }, [cps])

  // Tahrirlashda tanlangan kontragentni inputda ko'rsatish
  useEffect(() => {
    if (form.counterparty_id) {
      const cp = cps.find(c => c.id === form.counterparty_id)
      if (cp) setCpSearch(cp.name)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [cpStirLoading, setCpStirLoading] = useState(false)
  const [cpLookupSource, setCpLookupSource] = useState<'global_db' | 'soliq_api' | null>(null)
  const cpDropRef = useRef<HTMLDivElement>(null)

  const isEdit = !!form.id

  // Tashkilot o'zgarganda shahni avtomatik to'ldirish (yangi shartnoma uchun)
  useEffect(() => {
    if (isEdit) return
    const org = orgs.find(o => o.id === form.organization_id)
    if (org) {
      const city = orgCityDefault(org)
      setForm(f => ({ ...f, city }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.organization_id])

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'
  const inp2 = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-500'

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
    const lastQqs = form.spec_items.at(-1)?.qqs_foiz ?? 'siz'
    const item: SpecItem = { nomi: '', birlik: 'dona', miqdori: 1, narxi: 0, qqs_foiz: lastQqs, qqs_summa: 0, summa: 0 }
    setForm(f => ({ ...f, spec_items: [...f.spec_items, item] }))
  }

  function removeSpecItem(i: number) {
    setForm(f => ({ ...f, spec_items: f.spec_items.filter((_, idx) => idx !== i) }))
  }

  function calcItem(item: SpecItem): SpecItem {
    const base = (item.miqdori || 0) * (item.narxi || 0)
    let qqs = 0
    if (item.qqs_foiz === '12') qqs = base * 0.12
    else if (item.qqs_foiz === '15') qqs = base * 0.15
    else if (item.qqs_foiz === '0') qqs = 0
    return { ...item, qqs_summa: Math.round(qqs), summa: Math.round(base + qqs) }
  }

  function updateSpecItem(i: number, key: keyof SpecItem, val: string | number) {
    setForm(f => {
      let items = [...f.spec_items]
      // "all" — apply QQS rate to every row
      if (key === 'qqs_foiz' && val === 'all') {
        items = items.map(it => calcItem({ ...it, qqs_foiz: items[i].qqs_foiz }))
        const total = items.reduce((s, it) => s + it.summa, 0)
        return { ...f, spec_items: items, amount: String(total) }
      }
      items[i] = calcItem({ ...items[i], [key]: val })
      const total = items.reduce((s, it) => s + it.summa, 0)
      return { ...f, spec_items: items, amount: String(total) }
    })
  }

  const specTotal = form.spec_items.reduce((s, i) => s + i.summa, 0)
  const specBase = form.spec_items.reduce((s, i) => s + i.miqdori * i.narxi, 0)
  const specQqs = form.spec_items.reduce((s, i) => s + i.qqs_summa, 0)

  const [editStructure, setEditStructure] = useState<ContractStructure | null>(null)
  const [structureUserEdited, setStructureUserEdited] = useState(false)

  function getStructureForEdit(): ContractStructure {
    const org = orgs.find(o => o.id === form.organization_id)
    const cp = cps.find(c => c.id === form.counterparty_id)
    const amount = parseFloat(form.amount) || 0
    const extra: Record<string, string> = {
      TOVAR_NOMI: form.product_name || '',
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
      YETKAZISH_MUDDAT: form.yetkazish_muddat || '20 (yigirma) ish kuni',
    }
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
      extra,
    })
  }

  function initStructureEdit() {
    // Regenerate unless user has manually edited the structure text
    if (!structureUserEdited) {
      setEditStructure(getStructureForEdit())
    }
  }

  function updateBolim(bi: number, sarlavha: string) {
    setStructureUserEdited(true)
    setEditStructure(s => {
      if (!s) return s
      const bolimlar = s.bolimlar.map((b, i) => i === bi ? { ...b, sarlavha } : b)
      return { bolimlar }
    })
  }

  function updateBand(bi: number, bdi: number, matn: string) {
    setStructureUserEdited(true)
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

  async function lookupStirNewCp() {
    const inn = newCp.inn.trim()
    if (!inn || !/^\d{9}$/.test(inn)) { toast("STIR 9 raqamdan iborat bo'lishi kerak", 'error'); return }
    setCpStirLoading(true)
    setCpLookupSource(null)
    try {
      // 1. Global baza + Soliq API (company-lookup avval global bazani tekshiradi)
      const res = await fetch(`/api/company-lookup?inn=${inn}`)
      const data = await res.json()
      if (!res.ok) { toast(data.error || "Ma'lumot topilmadi", 'error'); return }
      const co = data.company
      setCpLookupSource(data.source)
      setNewCp(p => ({
        ...p,
        name:          co.name          || p.name,
        director_name: co.director      || p.director_name,
        address:       co.address       || p.address,
        mfo:           co.mfo           || p.mfo,
        bank_name:     co.bank_name     || p.bank_name,
        bank_account:  co.account       || p.bank_account,
        phone:         co.phone         || p.phone,
      }))
      const src = data.source === 'global_db' ? "Bazadan topildi" : "Soliq API dan olindi"
      toast(src + (co.name ? `: ${co.name}` : ''), 'success')
    } catch {
      toast("So'rovda xatolik", 'error')
    } finally {
      setCpStirLoading(false)
    }
  }

  async function handleQuickAddCp() {
    if (!newCp.name.trim()) { toast('Tashkilot nomi kiritilishi shart', 'error'); return }
    setSavingCp(true)

    // INN bo'yicha duplikat tekshirish
    if (newCp.inn.trim()) {
      const { data: existing } = await supabase.from('counterparties')
        .select('id, name').eq('inn', newCp.inn.trim()).maybeSingle()
      if (existing) {
        setSavingCp(false)
        toast(`Bu STIR (${newCp.inn.trim()}) allaqachon bazada mavjud: "${existing.name}"`, 'error')
        return
      }
    }

    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.from('counterparties').insert({
      name: newCp.name.trim(),
      inn: newCp.inn.trim(),
      director_name: newCp.director_name.trim(),
      address: newCp.address.trim(),
      phone: newCp.phone.trim(),
      bank_name: newCp.bank_name.trim(),
      bank_account: newCp.bank_account.trim(),
      mfo: newCp.mfo.trim(),
      qqsreg: newCp.qqsreg.trim(),
      oked: newCp.oked.trim(),
      user_id: session!.user.id,
    }).select().single()

    // Global bazaga ham saqlash (MFO yoki hisob raqam bo'lsa)
    if (!error && newCp.inn.trim() && (newCp.mfo.trim() || newCp.bank_account.trim())) {
      fetch('/api/company-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session!.access_token}` },
        body: JSON.stringify({
          inn:       newCp.inn.trim(),
          name:      newCp.name.trim(),
          director:  newCp.director_name.trim(),
          address:   newCp.address.trim(),
          mfo:       newCp.mfo.trim(),
          bank_name: newCp.bank_name.trim(),
          account:   newCp.bank_account.trim(),
          phone:     newCp.phone.trim(),
        }),
      }).catch(() => {/* admin emas bo'lsa 403 — e'tiborsiz */})
    }

    setSavingCp(false)
    if (error) { toast('Xato: ' + error.message, 'error'); return }
    if (data) {
      setLocalCps(prev => [...prev, data as Counterparty])
      onCpAdded?.(data)
      setForm(f => ({ ...f, counterparty_id: data.id }))
    }
    setQuickAddCp(false)
    setCpLookupSource(null)
    setNewCp({ name: '', inn: '', director_name: '', address: '', phone: '', bank_name: '', bank_account: '', mfo: '', qqsreg: '', oked: '' })
    setCpDropOpen(false)
  }

  // ─── Step 1 validation ────────────────────────────────────────────────────

  function validateStep1(): boolean {
    if (!form.contract_number.trim()) { toast("Shartnoma raqami kiritilishi shart", 'error'); return false }
    if (!form.organization_id) { toast("Tashkilotni tanlang", 'error'); return false }
    if (!form.counterparty_id) { toast("Kontragentni tanlang", 'error'); return false }
    return true
  }

  // ─── Step navigation ──────────────────────────────────────────────────────

  function goToStep3() {
    initStructureEdit()
    setStep(3)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step < 4) return  // Enter tugmasi step 1-3 da formni submit qilmasin
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
        spec_items: form.spec_items.length > 0 ? form.spec_items : undefined,
      })
      onSave(text)
    } else {
      onSave()
    }
  }

  // ─── Selected org/cp ──────────────────────────────────────────────────────

  const selectedOrg = orgs.find(o => o.id === form.organization_id)
  const selectedCp = localCps.find(c => c.id === form.counterparty_id)
  const filteredCps = (() => {
    const q = cpSearch.toLowerCase().trim()
    if (!q) return localCps
    const inn_q = q.replace(/\D/g, '')
    return localCps
      .map(cp => {
        const inn = (cp.inn || '').replace(/\D/g, '')
        const name = cp.name.toLowerCase()
        let score = 0
        if (inn_q && inn.startsWith(inn_q))    score = 3
        else if (inn_q && inn.includes(inn_q)) score = 2
        else if (name.includes(q))             score = 1
        return { cp, score }
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.cp)
  })()

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

  const selectedTypeMeta = CONTRACT_TYPES.find(c => c.key === form.contract_type)

  return (
    <>
    <div className="fixed inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className={`bg-[#0F172A] border border-[#1E293B] rounded-xl w-full max-h-[95vh] flex flex-col shadow-2xl ${step === 4 ? 'max-w-6xl' : 'max-w-2xl'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E293B] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: selectedTypeMeta?.color || '#3B82F6' }}/>
            <div>
              <h2 className="text-sm font-semibold text-white leading-tight">
                {isEdit ? T(t.modal.editContract) : T(t.modal.newContract)}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type] || form.contract_type}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-[#1E293B] transition text-base leading-none">
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-5 py-3 border-b border-[#1E293B] flex-shrink-0">
          <div className="flex items-center">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <button type="button"
                  onClick={() => { if (i + 1 === 3) initStructureEdit(); setStep(i + 1) }}
                  className="flex items-center gap-2 group">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition flex-shrink-0 ${
                    step === i + 1
                      ? 'bg-blue-600 text-white'
                      : step > i + 1
                        ? 'bg-[#1E293B] text-blue-400'
                        : 'bg-[#1E293B] text-gray-500'
                  }`}>
                    {step > i + 1
                      ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                      : i + 1}
                  </div>
                  <span className={`text-[11px] font-medium hidden sm:block ${step === i + 1 ? 'text-white' : step > i + 1 ? 'text-gray-400' : 'text-gray-600'}`}>{s}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${step > i + 1 ? 'bg-blue-600/40' : 'bg-[#1E293B]'}`}/>
                )}
              </div>
            ))}
          </div>
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
                    <label className={lbl}>{T(t.modal.contractNum)} <span className="text-red-400">*</span></label>
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
                  <CityPicker
                    value={form.city}
                    onChange={v => setForm(f => ({ ...f, city: v }))}
                  />
                </div>

                {/* Contract type */}
                <div>
                  <label className={lbl}>{T(t.modal.contractType)}</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {CONTRACT_TYPES.map(ct => {
                      const active = form.contract_type === ct.key
                      return (
                        <button key={ct.key} type="button"
                          onClick={() => setForm(f => ({ ...f, contract_type: ct.key }))}
                          className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition overflow-hidden ${
                            active
                              ? 'border-transparent text-white bg-[#1E293B]'
                              : 'border-[#1E293B] text-gray-400 hover:text-gray-200 hover:bg-[#1E293B]/50'
                          }`}
                          style={active ? { boxShadow: `inset 0 0 0 1px ${ct.color}30` } : {}}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition"
                            style={{ backgroundColor: active ? ct.color : '#4B5563' }}/>
                          <span className="truncate leading-tight">{(CONTRACT_TYPE_NAMES as Record<string, string>)[ct.key]}</span>
                          {active && <span className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-lg" style={{ backgroundColor: ct.color }}/>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className={lbl}>{T(t.modal.amount)}</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      className={inp + ' flex-1'}
                      placeholder="0"
                      min="0"
                    />
                    {form.contract_type === 'xalqaro' && (
                      <select
                        value={form.valyuta || 'USD'}
                        onChange={e => setForm(f => ({ ...f, valyuta: e.target.value }))}
                        className="bg-[#0B1220] border border-[#1E293B] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 min-w-[90px]"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="CNY">CNY</option>
                        <option value="RUB">RUB</option>
                        <option value="GBP">GBP</option>
                        <option value="UZS">UZS</option>
                      </select>
                    )}
                  </div>
                  {form.amount && parseFloat(form.amount) > 0 ? (
                    <p className="text-[11px] text-gray-500 mt-1">
                      {form.contract_type === 'xalqaro'
                        ? `${parseFloat(form.amount).toLocaleString()} ${form.valyuta || 'USD'}`
                        : `${numberToWords(parseFloat(form.amount), 'uz')} so'm`}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-500/80 mt-1 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-500 inline-block"/>
                      Summa kiritilmagan
                    </p>
                  )}
                </div>

                {/* Organization */}
                <div>
                  <label className={lbl}>{T(t.modal.selectOrg)} <span className="text-red-400">*</span></label>
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
                    <p className="text-[11px] text-gray-600 mt-1">
                      {selectedOrg.inn && <span className="mr-2">INN: <span className="text-gray-400">{selectedOrg.inn}</span></span>}
                      {selectedOrg.director_name && <span>Rahbar: <span className="text-gray-400">{selectedOrg.director_name}</span></span>}
                    </p>
                  )}
                </div>

                {/* Counterparty — direct STIR/name search */}
                <div>
                  <label className={lbl}>{T(t.modal.selectCp)} <span className="text-red-400">*</span></label>
                  <div className="relative" ref={cpDropRef}>
                    <input
                      value={cpSearch}
                      onChange={e => {
                        const val = e.target.value
                        setCpSearch(val)
                        // Any edit clears selection (no freeze)
                        setForm(f => ({ ...f, counterparty_id: '' }))
                        if (!val.trim()) { setCpDropOpen(false); return }
                        // Auto-select on exact 9-digit STIR
                        const digits = val.replace(/\D/g, '')
                        if (digits.length === 9) {
                          const match = localCps.find(c => (c.inn || '').replace(/\D/g, '') === digits)
                          if (match) {
                            setForm(f => ({ ...f, counterparty_id: match.id }))
                            setCpSearch(match.name)
                            setCpDropOpen(false)
                            return
                          }
                        }
                        setCpDropOpen(true)
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (filteredCps.length > 0) {
                            const cp = filteredCps[0]
                            setForm(f => ({ ...f, counterparty_id: cp.id }))
                            setCpSearch(cp.name)
                            setCpDropOpen(false)
                          }
                        }
                        if (e.key === 'Escape') setCpDropOpen(false)
                      }}
                      onFocus={() => { if (!form.counterparty_id && cpSearch.trim()) setCpDropOpen(true) }}
                      placeholder="STIR yoki nomi bilan qidirish..."
                      className={inp}
                    />
                    {cpDropOpen && cpSearch.trim() && !form.counterparty_id && filteredCps.length > 0 && (
                      <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {filteredCps.slice(0, 12).map(cp => (
                          <button
                            key={cp.id}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setForm(f => ({ ...f, counterparty_id: cp.id }))
                              setCpSearch(cp.name)
                              setCpDropOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-[#1F2937] transition text-gray-200"
                          >
                            <div className="font-medium">{cp.name}</div>
                            {cp.inn && <div className="text-xs text-gray-500">STIR: {cp.inn}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedCp && (
                    <div className="mt-2 bg-[#0F172A] border border-[#1E293B] rounded-xl overflow-hidden">
                      {([
                        { label: 'STIR',         value: selectedCp.inn },
                        { label: 'Rahbar',        value: selectedCp.director_name },
                        { label: 'MFO',           value: selectedCp.mfo },
                        { label: 'Bank',          value: selectedCp.bank_name },
                        { label: 'Hisob raqami',  value: selectedCp.bank_account },
                        { label: 'Manzil',        value: selectedCp.address },
                        { label: 'Telefon',       value: selectedCp.phone },
                      ] as { label: string; value?: string | null }[])
                        .filter(r => r.value)
                        .map(row => (
                          <div key={row.label} className="flex items-start border-b border-[#1E293B]/60 px-3 py-1.5 gap-2 last:border-0">
                            <span className="text-[10px] text-blue-400/80 w-24 flex-shrink-0 pt-0.5">{row.label}</span>
                            <span className="text-[11px] text-gray-300 leading-relaxed break-all">{row.value}</span>
                          </div>
                        ))
                      }
                      {selectedCp.stir_status === 'inactive' && (
                        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 px-3 py-1.5">
                          <span>⚠</span><span>Soliqda <strong>faol emas</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                  <button type="button" onClick={() => { setCpDropOpen(false); setQuickAddCp(true) }}
                    className="mt-1.5 text-xs text-blue-400 hover:text-blue-300 transition">
                    + Yangi kontragent qo'shish
                  </button>
                </div>

                {/* Product name — only for oldi_sotdi and daval */}
                {(form.contract_type === 'oldi_sotdi' || form.contract_type === 'daval') && (
                  <div>
                    <label className={lbl}>{T(t.modal.productName)}</label>
                    <input
                      value={form.product_name}
                      onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                      className={inp}
                      placeholder="Tovar yoki xizmat nomi"
                    />
                  </div>
                )}

                {/* Template selection */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <label className={lbl + ' mb-0'}>{T(t.modal.template)}</label>
                    <div className="flex rounded-lg overflow-hidden border border-[#1E293B]">
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
                            ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                            : 'border-[#1E293B] text-gray-300 hover:border-blue-600/50'
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
                              ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                              : 'border-[#1E293B] text-gray-300 hover:border-blue-600/50'
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
                      <label className={lbl}>Yangi tugash sanasi <span className="text-gray-600 font-normal">(muddat uzaytirilsa)</span></label>
                      <input type="date" value={form.yangi_muddat || ''} onChange={e => setForm(f => ({ ...f, yangi_muddat: e.target.value }))} className={inp} />
                      <p className="text-xs text-gray-600 mt-1">To'ldirilsa — muddat uzaytirish bandi avtomatik qo'shiladi</p>
                    </div>
                    <div>
                      <label className={lbl}>Boshqa o'zgartirishlar <span className="text-gray-600 font-normal">(ixtiyoriy)</span></label>
                      <textarea value={form.ozgartirish || ''} onChange={e => setForm(f => ({ ...f, ozgartirish: e.target.value }))} className={inp} rows={3} placeholder="Narx, miqdor yoki boshqa shartlar o'zgartirilsa..." />
                    </div>
                  </>
                )}

                {/* Oldi-sotdi */}
                {form.contract_type === 'oldi_sotdi' && (
                  <div>
                    <label className={lbl}>Yetkazib berish muddati</label>
                    <input value={form.yetkazish_muddat || ''} onChange={e => setForm(f => ({ ...f, yetkazish_muddat: e.target.value }))} className={inp} placeholder="Masalan: 20 ish kuni, 30 kalendar kun" />
                    <p className="text-xs text-gray-600 mt-1">Bo'sh qoldirilsa: "20 (yigirma) ish kuni" ishlatiladi</p>
                  </div>
                )}

                {/* Agentlik */}
                {form.contract_type === 'agentlik' && (
                  <>
                    <div>
                      <label className={lbl}>Agent vazifasi</label>
                      <textarea value={form.xizmat_tavsif || ''} onChange={e => setForm(f => ({ ...f, xizmat_tavsif: e.target.value }))} className={inp} rows={2} placeholder="Masalan: tovarlarni sotish, mijozlar topish..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Agentlik haqi (%)</label>
                        <input value={form.qarz_foiz || ''} onChange={e => setForm(f => ({ ...f, qarz_foiz: e.target.value }))} className={inp} placeholder="Masalan: 5" />
                      </div>
                      <div>
                        <label className={lbl}>Hudud</label>
                        <input value={form.yetkazish_joy || ''} onChange={e => setForm(f => ({ ...f, yetkazish_joy: e.target.value }))} className={inp} placeholder="Masalan: Toshkent viloyati" />
                      </div>
                    </div>
                  </>
                )}

                {/* Transport */}
                {form.contract_type === 'transport' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Yuklash manzili</label>
                        <input value={form.ijara_manzil || ''} onChange={e => setForm(f => ({ ...f, ijara_manzil: e.target.value }))} className={inp} placeholder="Shahar, ko'cha..." />
                      </div>
                      <div>
                        <label className={lbl}>Yetkazish manzili</label>
                        <input value={form.yetkazish_joy || ''} onChange={e => setForm(f => ({ ...f, yetkazish_joy: e.target.value }))} className={inp} placeholder="Shahar, ko'cha..." />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Yuk turi / tavsifi</label>
                      <input value={form.xizmat_tavsif || ''} onChange={e => setForm(f => ({ ...f, xizmat_tavsif: e.target.value }))} className={inp} placeholder="Masalan: qurilish materiallari, oziq-ovqat..." />
                    </div>
                  </>
                )}

                {/* Lizing */}
                {form.contract_type === 'lizing' && (
                  <>
                    <div>
                      <label className={lbl}>Lizing ob'ekti</label>
                      <input value={form.pudrat_obekt || ''} onChange={e => setForm(f => ({ ...f, pudrat_obekt: e.target.value }))} className={inp} placeholder="Masalan: Nexia 3 avtomobili, CNC stanogi..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Lizing muddati</label>
                        <input value={form.ijara_muddat || ''} onChange={e => setForm(f => ({ ...f, ijara_muddat: e.target.value }))} className={inp} placeholder="Masalan: 36 oy" />
                      </div>
                      <div>
                        <label className={lbl}>Boshlang'ich badal (%)</label>
                        <input value={form.qarz_foiz || ''} onChange={e => setForm(f => ({ ...f, qarz_foiz: e.target.value }))} className={inp} placeholder="Masalan: 20" />
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Yillik foiz stavkasi (%)</label>
                      <input value={form.oylik_tolov || ''} onChange={e => setForm(f => ({ ...f, oylik_tolov: e.target.value }))} className={inp} placeholder="Masalan: 18" />
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
                <div className="pt-2 border-t border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setForm(f => ({ ...f, qqs_enabled: !f.qqs_enabled }))}
                        className={`relative w-10 h-5 rounded-full transition ${form.qqs_enabled ? 'bg-blue-600' : 'bg-[#1F2937]'}`}
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
                          className="bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded px-2 py-1 text-xs focus:outline-none cursor-pointer"
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
                  <div key={bi} className="bg-[#0F172A] rounded-xl p-4 space-y-3 border border-[#1E293B]">
                    <div className="flex items-center gap-2">
                      <input
                        value={bolim.sarlavha}
                        onChange={e => updateBolim(bi, e.target.value)}
                        className="flex-1 bg-[#0B1220] border border-[#1E293B] text-white font-semibold text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
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
                          className="flex-1 bg-[#0B1220] border border-[#1E293B] text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 resize-none"
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
                    <table className="w-full text-xs border border-[#1E293B] rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-[#0F172A] text-gray-400 border-b border-[#1E293B] text-xs">
                          <th className="text-center py-2 px-2 w-8">№</th>
                          <th className="text-left py-2 px-2 min-w-[160px]">Tovarlar (ish, xizmatlar) nomi</th>
                          <th className="text-center py-2 px-2 w-20">O'lchov birligi</th>
                          <th className="text-right py-2 px-2 w-16">Miqdori</th>
                          <th className="text-right py-2 px-2 w-28">Narxi (so'm)</th>
                          <th className="text-right py-2 px-2 w-28">Yetkazib berish qiymati</th>
                          <th className="text-center py-2 px-2 w-20">QQS stavkasi</th>
                          <th className="text-right py-2 px-2 w-28">QQS summasi</th>
                          <th className="text-right py-2 px-2 w-32">QQS bilan jami</th>
                          <th className="w-6"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.spec_items.map((item, i) => {
                          const base = (item.miqdori || 0) * (item.narxi || 0)
                          return (
                            <tr key={i} className="border-b border-[#1E293B] hover:bg-[#1F2937] text-xs">
                              <td className="py-1 px-2 text-center text-gray-500">{i + 1}</td>
                              <td className="py-1 px-2">
                                <input value={item.nomi} onChange={e => updateSpecItem(i, 'nomi', e.target.value)} className={inp2} placeholder="Tovar nomi..." />
                              </td>
                              <td className="py-1 px-2">
                                <BirlikPicker value={item.birlik} onChange={v => updateSpecItem(i, 'birlik', v)} />
                              </td>
                              <td className="py-1 px-2">
                                <input type="number" value={item.miqdori} onChange={e => updateSpecItem(i, 'miqdori', parseFloat(e.target.value) || 0)} className={inp2 + ' text-right'} min={0} />
                              </td>
                              <td className="py-1 px-2">
                                <input type="number" value={item.narxi} onChange={e => updateSpecItem(i, 'narxi', parseFloat(e.target.value) || 0)} className={inp2 + ' text-right'} min={0} />
                              </td>
                              <td className="py-1 px-2 text-right text-gray-300 font-medium">
                                {base.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-1 px-2">
                                <select value={item.qqs_foiz} onChange={e => updateSpecItem(i, 'qqs_foiz', e.target.value)} className={inp2 + ' text-center'}>
                                  <option value="siz">QQSsiz</option>
                                  <option value="0">0%</option>
                                  <option value="12">12%</option>
                                  <option value="15">15%</option>
                                  <option value="all">Barchasi uchun</option>
                                </select>
                              </td>
                              <td className="py-1 px-2 text-right text-gray-300">
                                {item.qqs_summa.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-1 px-2 text-right font-semibold text-white">
                                {item.summa.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-1 pl-1">
                                <button type="button" onClick={() => removeSpecItem(i)} className="text-red-400 hover:text-red-300 w-5 h-5 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        {/* Jami qatori */}
                        <tr className="bg-[#0F172A] font-semibold text-gray-200 text-xs border-t border-[#1E293B]">
                          <td colSpan={5} className="py-2 px-2 text-right">Jami:</td>
                          <td className="py-2 px-2 text-right text-white">{specBase.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td></td>
                          <td className="py-2 px-2 text-right text-yellow-400">{specQqs.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-2 px-2 text-right text-emerald-400 font-bold text-sm">{specTotal.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td></td>
                        </tr>
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
                  <div className="bg-[#0F172A] rounded-xl p-4 space-y-2 border border-[#1E293B]">
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
                    <div className="flex justify-between text-sm font-semibold border-t border-[#1E293B] pt-2">
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

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[#1E293B] flex-shrink-0 bg-[#0B1220]/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                {step > 1 && (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-gray-200 bg-[#1E293B] hover:bg-[#273549] rounded-lg transition border border-[#273549]">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                    {T(t.btn.prev)}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={onClose}
                  className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition rounded-lg hover:bg-[#1E293B]">
                  {T(t.btn.cancel)}
                </button>
                {step < 4 ? (
                  <button type="button"
                    onClick={() => { if (step === 1 && !validateStep1()) return; if (step === 2) goToStep3(); else setStep(s => s + 1) }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
                    {T(t.btn.next)}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </button>
                ) : (
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
                    {saving
                      ? <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{T(t.btn.saving)}</>
                      : <>{T(t.btn.save)}<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg></>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>

    {/* ── New Counterparty Modal ── */}
    {quickAddCp && (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-lg shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
            <h3 className="text-base font-semibold text-white">Yangi kontragent</h3>
            <button type="button" onClick={() => setQuickAddCp(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition text-xl">×</button>
          </div>
          <div className="p-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Tashkilot nomi <span className="text-red-400">*</span></label>
                <input value={newCp.name} onChange={e => setNewCp(p => ({ ...p, name: e.target.value }))}
                  placeholder="Masalan: ALFA MCHJ"
                  className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  INN / STIR
                  {cpLookupSource && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${cpLookupSource === 'global_db' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
                      {cpLookupSource === 'global_db' ? '✓ Bazadan' : '↓ Soliq API'}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    value={newCp.inn}
                    onChange={e => { setNewCp(p => ({ ...p, inn: e.target.value })); setCpLookupSource(null) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupStirNewCp() } }}
                    placeholder="123456789 — Enter bosing"
                    maxLength={9}
                    className="flex-1 bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600" />
                  <button type="button" disabled={cpStirLoading || !newCp.inn}
                    onClick={lookupStirNewCp}
                    className="px-2.5 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-400 rounded-lg text-xs disabled:opacity-40 transition flex-shrink-0"
                    title="Ma'lumot olish">
                    {cpStirLoading
                      ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>}
                  </button>
                </div>
                <p className="text-[11px] text-gray-600 mt-1">9 raqam yozing va Enter bosing — avtomatik to'ldiriladi</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Rahbar F.I.O</label>
                <input value={newCp.director_name} onChange={e => setNewCp(p => ({ ...p, director_name: e.target.value }))}
                  placeholder="Rahbar ismi"
                  className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Manzil</label>
                <input value={newCp.address} onChange={e => setNewCp(p => ({ ...p, address: e.target.value }))}
                  placeholder="Toshkent sh., ..."
                  className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Telefon</label>
                <input value={newCp.phone} onChange={e => setNewCp(p => ({ ...p, phone: formatPhoneUz(e.target.value) }))}
                  placeholder="+998 90 123-45-67"
                  className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">QQS ro'yxat raqami</label>
                <input value={newCp.qqsreg} onChange={e => setNewCp(p => ({ ...p, qqsreg: e.target.value }))}
                  placeholder="QQS raqami"
                  className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bank nomi</label>
                <input value={newCp.bank_name} onChange={e => setNewCp(p => ({ ...p, bank_name: e.target.value }))}
                  placeholder="Ipak yo'li bank"
                  className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">MFO</label>
                <input value={newCp.mfo} onChange={e => {
                    const mfo = e.target.value
                    const bankName = mfo.length === 5 ? getBankByMfo(mfo) : null
                    setNewCp(p => ({ ...p, mfo, ...(bankName ? { bank_name: bankName } : {}) }))
                  }}
                  placeholder="01234"
                  className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Hisob raqami</label>
                <input value={newCp.bank_account} onChange={e => setNewCp(p => ({ ...p, bank_account: e.target.value }))}
                  placeholder="20208000000000000000"
                  className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-[#1E293B]">
            <button type="button" onClick={handleQuickAddCp} disabled={savingCp}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm py-2.5 rounded-lg font-semibold transition">
              {savingCp ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button type="button" onClick={() => setQuickAddCp(false)}
              className="px-5 bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 text-sm py-2.5 rounded-lg transition">
              Bekor
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
