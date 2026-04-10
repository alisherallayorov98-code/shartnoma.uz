'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../../context'
import type { Counterparty } from '@/lib/types'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import { getStructure, structureToText, numberToWords, type ContractStructure } from '@/lib/contractStructures'
import { DEFAULT_TEMPLATES, type AppTemplate } from '@/lib/defaultTemplates'
import { getBankByMfo } from '@/lib/bankMfo'
import { formatPhoneUz } from '@/lib/inputMasks'
import { fillPlaceholders } from '@/lib/contractUtils'
import { latinToCyrillic } from '@/lib/scriptNorm'
import { logAudit } from '@/lib/audit'
import { useToast } from '@/lib/toast'
import CityPicker from '../_components/CityPicker'
import { BirlikPicker } from '../../_components/BirlikPicker'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────────────────

type SpecItem = {
  nomi: string; birlik: string; miqdori: number
  narxi: number; qqs_foiz: string; qqs_summa: number; summa: number
}

type ContractForm = {
  contract_number: string; contract_date: string; contract_type: string
  amount: string; organization_id: string; counterparty_id: string
  status: string; content: string; city: string; product_name: string
  spec_items: SpecItem[]; qqs_enabled: boolean; qqs_rate: number
  ijara_manzil?: string; ijara_maydon?: string; oylik_tolov?: string
  ijara_muddat?: string; ijara_boshlanish?: string; ijara_tugash?: string
  xizmat_tavsif?: string; xizmat_boshlanish?: string; xizmat_tugash?: string
  xizmat_tolov?: string; pudrat_obekt?: string; pudrat_tavsif?: string
  pudrat_boshlanish?: string; pudrat_tugash?: string; qarz_maqsad?: string
  qarz_foiz?: string; qarz_muddat?: string; daval_material?: string
  daval_mahsulot?: string; incoterms?: string; yetkazish_joy?: string
  tolov_usuli?: string; valyuta?: string; asosiy_raqam?: string
  asosiy_sana?: string; ozgartirish?: string; yangi_muddat?: string
  yetkazish_muddat?: string; yetkazish_place?: string
}

// ─── Contract types ──────────────────────────────────────────────────────────

const CONTRACT_TYPES = [
  { key: 'oldi_sotdi', color: '#3B82F6' }, { key: 'xizmat', color: '#10B981' },
  { key: 'ijara', color: '#F59E0B' },      { key: 'pudrat', color: '#F97316' },
  { key: 'moliyaviy', color: '#8B5CF6' },  { key: 'daval', color: '#06B6D4' },
  { key: 'xalqaro', color: '#6366F1' },    { key: 'agentlik', color: '#EC4899' },
  { key: 'transport', color: '#14B8A6' },  { key: 'lizing', color: '#64748B' },
  { key: 'qoshimcha', color: '#6B7280' },  { key: 'boshqa', color: '#4B5563' },
]


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function YangiShartnoma() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    orgs, cps, activeOrg, subscription, bankAccounts,
    canCreateContract, openUpgradeModal, reloadContracts, userId,
  } = useDashboard()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<ContractForm>({
    contract_number: '', contract_date: new Date().toISOString().split('T')[0],
    contract_type: 'oldi_sotdi', amount: '', organization_id: activeOrg?.id || '',
    counterparty_id: '', status: 'active', content: '',
    city: orgCityDefault(activeOrg), product_name: '',
    spec_items: [], qqs_enabled: false, qqs_rate: 12,
  })
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<AppTemplate[]>([])
  const [useTemplate, setUseTemplate] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState('auto')

  // CP state
  const [localCps, setLocalCps] = useState<Counterparty[]>(cps)
  const [cpSearch, setCpSearch] = useState('')
  const [cpDropOpen, setCpDropOpen] = useState(false)
  const [quickAddCp, setQuickAddCp] = useState(false)
  const [newCp, setNewCp] = useState({ name: '', inn: '', director_name: '', address: '', phone: '', bank_name: '', bank_account: '', mfo: '', qqsreg: '', oked: '' })
  const [savingCp, setSavingCp] = useState(false)
  const [cpStirLoading, setCpStirLoading] = useState(false)
  const cpDropRef = useRef<HTMLDivElement>(null)

  // Structure editor
  const [editStructure, setEditStructure] = useState<ContractStructure | null>(null)
  const [structureUserEdited, setStructureUserEdited] = useState(false)

  // City setup modal
  const [cityModalOpen, setCityModalOpen] = useState(false)
  const [cityInput, setCityInput] = useState('')

  // ── Init ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!canCreateContract()) { openUpgradeModal(); router.push('/dashboard/shartnomalar'); return }
    if (!activeOrg) { toast(T(t.msg.noOrgs), 'error'); router.push('/dashboard/shartnomalar'); return }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-fill contract number and org
  useEffect(() => {
    if (!activeOrg) return
    const savedCity = localStorage.getItem(`contract_city_${activeOrg.id}`)
    if (savedCity) {
      setForm(f => ({ ...f, organization_id: f.organization_id || activeOrg.id, city: savedCity }))
    } else {
      const defaultCity = orgCityDefault(activeOrg)
      setCityInput(defaultCity)
      setCityModalOpen(true)
      setForm(f => ({ ...f, organization_id: f.organization_id || activeOrg.id, city: defaultCity }))
    }
    loadCustomTemplates(activeOrg.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg?.id])

  // Tashkilot QQS to'lovchi bo'lsa avtomatik yoqish
  useEffect(() => {
    const org = orgs.find(o => o.id === form.organization_id)
    if (!org) return
    const isQqs = !!(org.qqsreg?.trim())
    const rate = org.qqs_stavka ? parseInt(org.qqs_stavka) : 12
    setForm(f => ({ ...f, qqs_enabled: isQqs, qqs_rate: isNaN(rate) ? 12 : rate }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.organization_id])

  // Handle from_tpl (template → contract)
  useEffect(() => {
    if (searchParams.get('from_tpl') !== '1') return
    const raw = localStorage.getItem('tpl_to_contract')
    if (!raw || !activeOrg) return
    try {
      const { type, content } = JSON.parse(raw) as { type: string; content: string }
      localStorage.removeItem('tpl_to_contract')
      setForm(f => ({
        ...f,
        contract_type: type || 'oldi_sotdi',
        content: content || '',
        organization_id: activeOrg.id,
        city: orgCityDefault(activeOrg),
      }))
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeOrg])

  useEffect(() => { setLocalCps(cps) }, [cps])

  // Auto-fill city when org changes
  useEffect(() => {
    const org = orgs.find(o => o.id === form.organization_id)
    if (org) setForm(f => ({ ...f, city: orgCityDefault(org) }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.organization_id])

  // Close CP dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cpDropRef.current && !cpDropRef.current.contains(e.target as Node)) setCpDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function loadCustomTemplates(orgId: string) {
    const { data } = await supabase.from('contract_templates').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
    if (data) setCustomTemplates(data.map((d: Record<string, unknown>) => ({
      id: d.id as string, type: d.type as string, name: d.name as string,
      description: (d.description as string) || '', content: d.content as string,
      isDefault: false, icon: '📄', tags: [],
    })))
  }

  function autoContractNum(): string {
    // Use current year and pad to 3 digits
    const year = new Date().getFullYear()
    return `${year}/001`
  }

  // ── Spec helpers ─────────────────────────────────────────────────────────────

  function addSpecItem() {
    const lastQqs = form.spec_items.at(-1)?.qqs_foiz ?? 'siz'
    setForm(f => ({ ...f, spec_items: [...f.spec_items, { nomi: '', birlik: 'dona', miqdori: 1, narxi: 0, qqs_foiz: lastQqs, qqs_summa: 0, summa: 0 }] }))
  }

  function removeSpecItem(i: number) {
    setForm(f => ({ ...f, spec_items: f.spec_items.filter((_, idx) => idx !== i) }))
  }

  function calcItem(item: SpecItem): SpecItem {
    const base = (item.miqdori || 0) * (item.narxi || 0)
    let qqs = 0
    if (item.qqs_foiz === '12') qqs = base * 0.12
    else if (item.qqs_foiz === '15') qqs = base * 0.15
    return { ...item, qqs_summa: Math.round(qqs), summa: Math.round(base + qqs) }
  }

  function updateSpecItem(i: number, key: keyof SpecItem, val: string | number) {
    setForm(f => {
      let items = [...f.spec_items]
      if (key === 'qqs_foiz' && val === 'all') {
        items = items.map(it => calcItem({ ...it, qqs_foiz: items[i].qqs_foiz }))
        return { ...f, spec_items: items, amount: String(items.reduce((s, it) => s + it.summa, 0)) }
      }
      items[i] = calcItem({ ...items[i], [key]: val })
      return { ...f, spec_items: items, amount: String(items.reduce((s, it) => s + it.summa, 0)) }
    })
  }

  const specTotal = form.spec_items.reduce((s, i) => s + i.summa, 0)
  const specBase = form.spec_items.reduce((s, i) => s + i.miqdori * i.narxi, 0)
  const specQqs = form.spec_items.reduce((s, i) => s + i.qqs_summa, 0)

  // ── Structure editor ──────────────────────────────────────────────────────────

  function getStructureForEdit(): ContractStructure {
    const org = orgs.find(o => o.id === form.organization_id)
    const cp = localCps.find(c => c.id === form.counterparty_id)
    if (editStructure && structureUserEdited) return editStructure
    const amount = parseFloat(form.amount) || 0
    const extra: Record<string, string> = {}
    if (form.product_name) extra.TOVAR_NOMI = form.product_name
    if (form.yetkazish_muddat) extra.YETKAZISH_MUDDAT = form.yetkazish_muddat
    else extra.YETKAZISH_MUDDAT = '20 (yigirma) ish kuni'
    extra.QOLDIQ_QIYMAT = '___'
    if (form.xizmat_tavsif) extra.AGENT_VAZIFA = form.xizmat_tavsif
    if (form.qarz_foiz) extra.AGENT_FOZ = form.qarz_foiz
    if (form.yetkazish_joy) extra.AGENT_HUDUD = form.yetkazish_joy
    if (form.ijara_manzil) { extra.YETKAZISH_JOY = form.ijara_manzil; extra.QABUL_JOY = form.yetkazish_joy || '___' }
    if (form.pudrat_obekt) extra.LIZING_OBEKT = form.pudrat_obekt
    if (form.ijara_muddat) extra.LIZING_MUDDAT = form.ijara_muddat
    if (form.oylik_tolov) extra.LIZING_FOIZ = form.oylik_tolov
    if (form.asosiy_raqam) extra.ASOSIY_RAQAM = form.asosiy_raqam
    if (form.asosiy_sana) extra.ASOSIY_SANA = form.asosiy_sana.split('-').reverse().join('.') + '-yil'
    const parts: string[] = []
    if (form.yangi_muddat) parts.push(`Asosiy shartnomaning amal qilish muddati ${form.yangi_muddat.split('-').reverse().join('.')}-yil gacha uzaytirilsin`)
    if (form.ozgartirish) parts.push(form.ozgartirish)
    if (parts.length) extra.OZGARTIRISH = parts.join('. ')
    return getStructure(form.contract_type, {
      contract_number: form.contract_number, contract_date: form.contract_date,
      city: form.city, org_name: org?.name || '', org_inn: org?.inn || '',
      org_director: org?.director_name || '', cp_name: cp?.name || '',
      cp_inn: cp?.inn || '', cp_director: cp?.director_name || '',
      amount, amount_text: amount > 0 ? numberToWords(amount, 'uz') + " so'm" : '___', extra,
    })
  }

  function initStructureEdit() {
    if (!editStructure) setEditStructure(getStructureForEdit())
  }

  function updateBolim(bi: number, val: string) {
    setEditStructure(s => {
      if (!s) return s
      setStructureUserEdited(true)
      return { bolimlar: s.bolimlar.map((b, i) => i === bi ? { ...b, sarlavha: val } : b) }
    })
  }

  function updateBand(bi: number, bdi: number, val: string) {
    setEditStructure(s => {
      if (!s) return s
      setStructureUserEdited(true)
      return { bolimlar: s.bolimlar.map((b, i) => i === bi ? { ...b, bandlar: b.bandlar.map((bd, j) => j === bdi ? { ...bd, matn: val } : bd) } : b) }
    })
  }

  function addBolim() {
    setStructureUserEdited(true)
    setEditStructure(s => s ? { bolimlar: [...s.bolimlar, { sarlavha: `${s.bolimlar.length + 1}. Yangi bo'lim`, bandlar: [{ matn: '' }] }] } : s)
  }

  function addBand(bi: number) {
    setStructureUserEdited(true)
    setEditStructure(s => s ? { bolimlar: s.bolimlar.map((b, i) => i === bi ? { ...b, bandlar: [...b.bandlar, { matn: '' }] } : b) } : s)
  }

  function removeBolim(bi: number) {
    setStructureUserEdited(true)
    setEditStructure(s => s ? { bolimlar: s.bolimlar.filter((_, i) => i !== bi) } : s)
  }

  function removeBand(bi: number, bdi: number) {
    setStructureUserEdited(true)
    setEditStructure(s => s ? { bolimlar: s.bolimlar.map((b, i) => i === bi ? { ...b, bandlar: b.bandlar.filter((_, j) => j !== bdi) } : b) } : s)
  }

  // ── Enter: STIR qidirish → API → saqlash ─────────────────────────────────────

  async function handleCpEnter() {
    const q = cpSearch.trim()
    if (!q) return
    const digits = q.replace(/\D/g, '')

    if (digits.length === 9) {
      const existing = localCps.find(c => (c.inn || '').replace(/\D/g, '') === digits)
      if (existing) {
        setForm(f => ({ ...f, counterparty_id: existing.id }))
        setCpSearch(existing.name)
        setCpDropOpen(false)
        return
      }
      setCpStirLoading(true)
      try {
        const res = await fetch(`/api/company-lookup?inn=${digits}`)
        const apiData = await res.json()
        if (!res.ok) { toast(apiData.error || "Bu STIR bo'yicha ma'lumot topilmadi", 'error'); return }
        const co = apiData.company
        const { data: { session } } = await supabase.auth.getSession()
        const { data: saved, error: saveErr } = await supabase.from('counterparties').insert({
          name: co.name, inn: digits,
          director_name: co.director || '', address: co.address || '',
          phone: co.phone || '', bank_name: co.bank_name || '',
          bank_account: co.account || '', mfo: co.mfo || '',
          user_id: session!.user.id,
        }).select().single()
        if (saveErr) {
          if (saveErr.code === '23505') {
            const { data: found } = await supabase.from('counterparties').select('*').eq('inn', digits).maybeSingle()
            if (found) {
              setLocalCps(prev => [...prev, found as Counterparty])
              setForm(f => ({ ...f, counterparty_id: (found as Counterparty).id }))
              setCpSearch((found as Counterparty).name)
              setCpDropOpen(false)
              toast(`Bazadan topildi: ${(found as Counterparty).name}`, 'success')
              return
            }
          }
          toast('Saqlashda xato: ' + saveErr.message, 'error'); return
        }
        setLocalCps(prev => [...prev, saved as Counterparty])
        setForm(f => ({ ...f, counterparty_id: (saved as Counterparty).id }))
        setCpSearch((saved as Counterparty).name)
        setCpDropOpen(false)
        const src = apiData.source === 'global_db' ? 'Bazadan topildi' : 'Soliq API dan olindi'
        toast(`${src}: ${co.name}`, 'success')
      } catch { toast("So'rovda xatolik", 'error') }
      finally { setCpStirLoading(false) }
      return
    }

    if (filteredCps.length > 0) {
      const cp = filteredCps[0]
      setForm(f => ({ ...f, counterparty_id: cp.id }))
      setCpSearch(cp.name)
      setCpDropOpen(false)
    }
  }

  // ── Quick add CP ─────────────────────────────────────────────────────────────

  async function lookupStirNewCp() {
    const inn = newCp.inn.trim()
    if (!inn || !/^\d{9}$/.test(inn)) { toast("STIR 9 raqamdan iborat bo'lishi kerak", 'error'); return }
    setCpStirLoading(true)
    try {
      const res = await fetch(`/api/stir?stir=${inn}`)
      const data = await res.json()
      if (!res.ok) { toast(data.error || "STIR ma'lumot topilmadi", 'error'); return }
      const co = data.company
      setNewCp(p => ({ ...p, name: co.name || p.name, director_name: co.director_name || p.director_name, address: co.address || p.address, qqsreg: co.qqsreg || p.qqsreg, oked: co.oked || p.oked }))
      toast(co.status === 'active' ? "Ma'lumotlar to'ldirildi" : "⚠ Tashkilot faol emas!", co.status === 'inactive' ? 'error' : 'success')
    } catch { toast("STIR so'rovida xatolik", 'error') }
    finally { setCpStirLoading(false) }
  }

  async function handleQuickAddCp() {
    if (!newCp.name.trim()) { toast('Tashkilot nomi kiritilishi shart', 'error'); return }
    setSavingCp(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.from('counterparties').insert({
      name: newCp.name.trim(), inn: newCp.inn.trim(), director_name: newCp.director_name.trim(),
      address: newCp.address.trim(), phone: newCp.phone.trim(), bank_name: newCp.bank_name.trim(),
      bank_account: newCp.bank_account.trim(), mfo: newCp.mfo.trim(), qqsreg: newCp.qqsreg.trim(),
      oked: newCp.oked.trim(), user_id: session!.user.id,
    }).select().single()
    setSavingCp(false)
    if (error) { toast('Xato: ' + error.message, 'error'); return }
    if (data) {
      setLocalCps(prev => [...prev, data as Counterparty])
      setForm(f => ({ ...f, counterparty_id: data.id }))
    }
    setQuickAddCp(false)
    setNewCp({ name: '', inn: '', director_name: '', address: '', phone: '', bank_name: '', bank_account: '', mfo: '', qqsreg: '', oked: '' })
    setCpDropOpen(false)
  }

  // ── Validation ────────────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    if (!form.contract_number.trim()) { toast("Shartnoma raqami kiritilishi shart", 'error'); return false }
    if (!form.organization_id) { toast("Tashkilotni tanlang", 'error'); return false }
    if (!form.counterparty_id) { toast("Kontragentni tanlang", 'error'); return false }
    return true
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2) initStructureEdit()
    setStep(s => Math.min(s + 1, 4))
  }

  // ── Save ──────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.organization_id) { toast(T(t.msg.selectOrg), 'error'); return }
    if (!form.contract_number.trim()) { toast("Shartnoma raqami kiritilishi shart", 'error'); return }
    setSaving(true)

    const org = orgs.find(o => o.id === form.organization_id)
    const cp = localCps.find(c => c.id === form.counterparty_id)
    const amount = parseFloat(form.amount) || 0
    let content = form.content

    if (!content) {
      const extra: Record<string, string> = {}
      if (form.product_name) extra.TOVAR_NOMI = form.product_name
      extra.YETKAZISH_MUDDAT = form.yetkazish_muddat || '20 (yigirma) ish kuni'
      extra.QOLDIQ_QIYMAT = '___'
      if (form.xizmat_tavsif) extra.AGENT_VAZIFA = form.xizmat_tavsif
      if (form.qarz_foiz) extra.AGENT_FOZ = form.qarz_foiz
      if (form.yetkazish_joy) extra.AGENT_HUDUD = form.yetkazish_joy
      if (form.ijara_manzil) { extra.YETKAZISH_JOY = form.ijara_manzil; extra.QABUL_JOY = form.yetkazish_joy || '___' }
      if (form.pudrat_obekt) extra.LIZING_OBEKT = form.pudrat_obekt
      if (form.ijara_muddat) extra.LIZING_MUDDAT = form.ijara_muddat
      if (form.oylik_tolov) extra.LIZING_FOIZ = form.oylik_tolov
      if (form.qarz_foiz) extra.BOSHLANGICH_BADAL = form.qarz_foiz
      if (form.asosiy_raqam) extra.ASOSIY_RAQAM = form.asosiy_raqam
      if (form.asosiy_sana) extra.ASOSIY_SANA = form.asosiy_sana.split('-').reverse().join('.') + '-yil'
      const parts: string[] = []
      if (form.yangi_muddat) parts.push(`Asosiy shartnomaning amal qilish muddati ${form.yangi_muddat.split('-').reverse().join('.')}-yil gacha uzaytirilsin`)
      if (form.ozgartirish) parts.push(form.ozgartirish)
      if (parts.length) extra.OZGARTIRISH = parts.join('. ')

      const structure = editStructure && structureUserEdited
        ? editStructure
        : getStructure(form.contract_type, {
            contract_number: form.contract_number, contract_date: form.contract_date,
            city: form.city, org_name: org?.name || '', org_inn: org?.inn || '',
            org_director: org?.director_name || '', cp_name: cp?.name || '',
            cp_inn: cp?.inn || '', cp_director: cp?.director_name || '',
            amount, amount_text: amount > 0 ? numberToWords(amount, 'uz') + " so'm" : '___', extra,
          })
      content = structureToText(structure, {
        type_name: (CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type] || form.contract_type,
        number: form.contract_number, date: form.contract_date, city: form.city, org, cp,
        contract_type: form.contract_type,
        spec_items: form.spec_items.length > 0 ? form.spec_items : undefined,
      })
      if (lang === 'oz') content = latinToCyrillic(content)
    } else {
      const defaultBank = bankAccounts.find(b => b.is_default) || bankAccounts[0]
      content = fillPlaceholders(content, {
        ...form, contract_number: form.contract_number, contract_date: form.contract_date,
        city: form.city, amount, organizations: org, counterparties: cp,
        org_bank: defaultBank ? { bank_name: defaultBank.bank_name, account_number: defaultBank.account_number, mfo: defaultBank.mfo } : null,
      })
    }

    const extra_data: Record<string, string> = {}
    const extraKeys: (keyof ContractForm)[] = [
      'ijara_manzil','ijara_maydon','oylik_tolov','ijara_muddat','ijara_boshlanish','ijara_tugash',
      'xizmat_tavsif','xizmat_boshlanish','xizmat_tugash','xizmat_tolov',
      'pudrat_obekt','pudrat_tavsif','pudrat_boshlanish','pudrat_tugash',
      'qarz_maqsad','qarz_foiz','qarz_muddat','daval_material','daval_mahsulot',
      'incoterms','yetkazish_joy','tolov_usuli','valyuta','asosiy_raqam','asosiy_sana',
      'ozgartirish','yangi_muddat','yetkazish_muddat','yetkazish_place',
    ]
    for (const k of extraKeys) { const v = form[k]; if (v) extra_data[k] = v as string }

    const payload = {
      contract_number: form.contract_number, contract_date: form.contract_date,
      contract_type: form.contract_type, amount, organization_id: form.organization_id,
      counterparty_id: form.counterparty_id || null, status: form.status || 'active',
      content, city: form.city, product_name: form.product_name,
      spec_items: form.spec_items, qqs_enabled: form.qqs_enabled,
      qqs_rate: form.qqs_rate, extra_data, user_id: userId,
    }

    const { data: inserted, error } = await supabase.from('contracts').insert(payload).select('id').single()
    setSaving(false)
    if (error) { toast(`Xato: ${error.message}`, 'error'); return }
    if (inserted) logAudit('create', 'contracts', inserted.id, { contract_number: payload.contract_number, contract_type: payload.contract_type })
    if (subscription) {
      await supabase.from('subscriptions').update({ contracts_used: (subscription.contracts_used || 0) + 1 }).eq('id', subscription.id)
    }
    await reloadContracts()
    toast("Shartnoma muvaffaqiyatli saqlandi", 'success')
    router.push('/dashboard/shartnomalar')
  }

  // ── Preview ───────────────────────────────────────────────────────────────────

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState('')

  function buildPreviewContent(): string {
    const org = orgs.find(o => o.id === form.organization_id)
    const cp = localCps.find(c => c.id === form.counterparty_id)
    const amount = parseFloat(form.amount) || 0
    if (form.content) return form.content
    const extra: Record<string, string> = {}
    if (form.product_name) extra.TOVAR_NOMI = form.product_name
    extra.YETKAZISH_MUDDAT = form.yetkazish_muddat || '20 (yigirma) ish kuni'
    extra.QOLDIQ_QIYMAT = '___'
    if (form.xizmat_tavsif) extra.AGENT_VAZIFA = form.xizmat_tavsif
    if (form.yetkazish_joy) extra.AGENT_HUDUD = form.yetkazish_joy
    if (form.qarz_foiz) extra.AGENT_FOZ = form.qarz_foiz
    const structure = editStructure && structureUserEdited
      ? editStructure
      : getStructure(form.contract_type, {
          contract_number: form.contract_number, contract_date: form.contract_date,
          city: form.city, org_name: org?.name || '', org_inn: org?.inn || '',
          org_director: org?.director_name || '', cp_name: cp?.name || '',
          cp_inn: cp?.inn || '', cp_director: cp?.director_name || '',
          amount, amount_text: amount > 0 ? numberToWords(amount, 'uz') + " so'm" : '___', extra,
        })
    return structureToText(structure, {
      type_name: (CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type] || form.contract_type,
      number: form.contract_number, date: form.contract_date, city: form.city, org, cp,
      contract_type: form.contract_type,
      spec_items: form.spec_items.length > 0 ? form.spec_items : undefined,
    })
  }

  function openPreview() {
    setPreviewContent(buildPreviewContent())
    setPreviewOpen(true)
  }

  // ── Computed ──────────────────────────────────────────────────────────────────

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
  const allTemplates: AppTemplate[] = [
    ...(DEFAULT_TEMPLATES || []).filter((tpl: AppTemplate) => tpl.type === form.contract_type),
    ...customTemplates.filter(tpl => tpl.type === form.contract_type),
  ]
  const selectedTypeMeta = CONTRACT_TYPES.find(c => c.key === form.contract_type)

  const STEPS = [T(t.modal.step1), T(t.modal.step2), T(t.modal.step3), T(t.modal.step4)]

  const lbl = 'block text-xs text-gray-400 mb-1.5 font-medium'
  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500 transition'
  const inp2 = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-500'

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-[#0B1220]">

      {/* ── Page Header ── */}
      <div className="sticky top-0 z-40 bg-[#0B1220]/95 backdrop-blur border-b border-[#1E293B]">
        {/* Breadcrumb row */}
        <div className="px-5 pt-3 pb-0 flex items-center gap-2">
          <button type="button" onClick={() => router.push('/dashboard/shartnomalar')}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Shartnomalar
          </button>
          <span className="text-gray-600 text-xs">/</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedTypeMeta?.color || '#3B82F6' }}/>
            <span className="text-xs text-white font-medium">Yangi shartnoma</span>
            <span className="text-xs text-gray-500">— {(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type]}</span>
          </div>
        </div>

        {/* Step indicator row */}
        <div className="px-5 py-2.5 flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button type="button"
                onClick={() => { if (i + 1 === 3) initStructureEdit(); setStep(i + 1) }}
                className={`flex items-center gap-2 py-1 px-2 rounded-lg transition ${step === i + 1 ? 'bg-[#1E293B]' : 'hover:bg-[#1E293B]/50'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition ${
                  step === i + 1 ? 'bg-blue-600 text-white' : step > i + 1 ? 'bg-blue-600/20 text-blue-400' : 'bg-[#1E293B] text-gray-500'
                }`}>
                  {step > i + 1
                    ? <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                    : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === i + 1 ? 'text-white' : step > i + 1 ? 'text-blue-400' : 'text-gray-500'}`}>{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1" style={{ backgroundColor: step > i + 1 ? '#2563eb40' : '#1E293B' }}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div>
        <div className="px-5 py-5">

          {/* ══ STEP 1 — Didox uslubida ══ */}
          {step === 1 && (
            <div className="space-y-4">

              {/* ── Top: Basic contract info ── */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className={lbl}>Shartnoma raqami <span className="text-red-400">*</span></label>
                    <input value={form.contract_number} onChange={e => setForm(f => ({ ...f, contract_number: e.target.value }))}
                      className={inp} placeholder="2024/001" />
                  </div>
                  <div>
                    <label className={lbl}>Tuzilish sanasi</label>
                    <input type="date" value={form.contract_date} onChange={e => setForm(f => ({ ...f, contract_date: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={lbl} style={{marginBottom:0}}>Tuzilgan joy</label>
                      <button type="button" onClick={() => { setCityInput(form.city); setCityModalOpen(true) }}
                        className="text-[10px] text-gray-500 hover:text-blue-400 transition flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        Standartni o'zgartirish
                      </button>
                    </div>
                    <CityPicker value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
                  </div>
                  <div>
                    <label className={lbl}>Shartnoma summasi</label>
                    <div className="flex gap-2">
                      <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        className={inp + ' flex-1'} placeholder="0" min="0" />
                      {form.contract_type === 'xalqaro' && (
                        <select value={form.valyuta || 'USD'} onChange={e => setForm(f => ({ ...f, valyuta: e.target.value }))}
                          className="bg-[#0F172A] border border-[#1E293B] text-white text-sm rounded-lg px-2 focus:outline-none min-w-[70px]">
                          <option value="USD">USD</option><option value="EUR">EUR</option>
                          <option value="CNY">CNY</option><option value="RUB">RUB</option>
                          <option value="UZS">UZS</option>
                        </select>
                      )}
                    </div>
                    {form.amount && parseFloat(form.amount) > 0 && (
                      <p className="text-[10px] text-gray-500 mt-1 truncate">{numberToWords(parseFloat(form.amount), 'uz')} so&apos;m</p>
                    )}
                  </div>
                </div>

                {/* Contract type - compact row */}
                <div className="border-t border-[#1E293B] pt-3">
                  <label className={lbl + ' mb-2'}>Shartnoma turi</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CONTRACT_TYPES.map(ct => {
                      const active = form.contract_type === ct.key
                      return (
                        <button key={ct.key} type="button"
                          onClick={() => setForm(f => ({ ...f, contract_type: ct.key }))}
                          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            active ? 'text-white bg-[#1E293B] border-transparent' : 'border-[#1E293B] text-gray-400 hover:text-gray-200 hover:bg-[#1E293B]/40'
                          }`}
                          style={active ? { boxShadow: `inset 0 0 0 1px ${ct.color}40`, borderLeft: `2px solid ${ct.color}` } : {}}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: active ? ct.color : '#4B5563' }}/>
                          {(CONTRACT_TYPE_NAMES as Record<string, string>)[ct.key]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── Two columns: Org | CP (Didox uslubida) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Left: Org rekvizitlar */}
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Sizning ma&apos;lumotlaringiz</h3>
                    <select value={form.organization_id} onChange={e => setForm(f => ({ ...f, organization_id: e.target.value }))}
                      className="bg-[#0F172A] border border-[#1E293B] text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-600 max-w-[180px]">
                      <option value="">Tanlang...</option>
                      {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                    </select>
                  </div>
                  {selectedOrg ? (
                    <div className="p-4 space-y-0 divide-y divide-[#1E293B]">
                      {[
                        ['STIR/ЖШШИР', selectedOrg.inn],
                        ['Nomi', selectedOrg.name],
                        ['Rahbar (FIO)', selectedOrg.director_name],
                        ['MFO', selectedOrg.mfo],
                        ['Bank nomi', selectedOrg.bank_name],
                        ['Hisob raqami', selectedOrg.bank_account],
                        ['OKED', selectedOrg.oked],
                        ['Manzil', selectedOrg.address],
                        ['Telefon', selectedOrg.phone],
                      ].map(([label, val]) => (
                        <div key={label} className="flex items-baseline gap-2 py-2">
                          <span className="text-[11px] text-gray-500 w-28 flex-shrink-0">{label}</span>
                          <span className="text-xs text-gray-200 flex-1 break-words">{val || <span className="text-gray-600 italic">—</span>}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      Tashkilotni tanlang
                    </div>
                  )}
                </div>

                {/* Right: CP rekvizitlar */}
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1E293B]">
                    <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Kontragent ma&apos;lumotlari</h3>
                    <div className="relative" ref={cpDropRef}>
                      <input
                        value={cpSearch}
                        onChange={e => {
                          const val = e.target.value
                          setCpSearch(val)
                          setForm(f => ({ ...f, counterparty_id: '' }))
                          setCpDropOpen(!!val.trim())
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); handleCpEnter() }
                          if (e.key === 'Escape') setCpDropOpen(false)
                        }}
                        onFocus={() => { if (!form.counterparty_id && cpSearch.trim()) setCpDropOpen(true) }}
                        placeholder="STIR yoki nomi — Enter bosing..."
                        disabled={cpStirLoading}
                        className={`w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 placeholder-gray-500 transition ${cpStirLoading ? 'opacity-60 cursor-wait' : ''}`}
                      />
                      {cpStirLoading && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <svg className="w-3.5 h-3.5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                        </div>
                      )}
                      {cpDropOpen && cpSearch.trim() && !form.counterparty_id && filteredCps.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#111827] border border-[#1E293B] rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                          {filteredCps.slice(0, 12).map(cp => (
                            <button key={cp.id} type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => { setForm(f => ({ ...f, counterparty_id: cp.id })); setCpSearch(cp.name); setCpDropOpen(false) }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-[#1F2937] transition text-gray-200">
                              <div className="font-medium">{cp.name}</div>
                              {cp.inn && <div className="text-gray-500">STIR: {cp.inn}</div>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-[#1E293B]">
                    {selectedCp?.stir_status === 'inactive' && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 px-4 py-2">
                        <span>⚠</span><span>Bu tashkilot Soliq&apos;da <strong>faol emas</strong></span>
                      </div>
                    )}
                    {[
                      ['STIR', selectedCp?.inn],
                      ['Nomi', selectedCp?.name],
                      ['Rahbar (FIO)', selectedCp?.director_name],
                      ['MFO', selectedCp?.mfo],
                      ['Bank nomi', selectedCp?.bank_name],
                      ['Hisob raqami', selectedCp?.bank_account],
                      ['OKED', selectedCp?.oked],
                      ['Manzil', selectedCp?.address],
                      ['Telefon', selectedCp?.phone],
                    ].map(([label, val]) => (
                      <div key={label} className="flex items-center gap-2 px-4 py-2">
                        <span className="text-[11px] text-gray-500 w-28 flex-shrink-0">{label}</span>
                        {val
                          ? <span className="text-xs text-gray-200 flex-1 break-all">{val}</span>
                          : <span className="text-xs text-gray-700 italic flex-1">—</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Bottom: Product name + Shablon ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(form.contract_type === 'oldi_sotdi' || form.contract_type === 'daval') && (
                  <div className="bg-[#111827] border border-amber-600/40 rounded-xl p-4">
                    <label className="block text-xs text-amber-400 mb-1.5 font-semibold">
                      Mahsulot / xizmat nomi <span className="text-red-400">*</span>
                    </label>
                    <input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                      className={`${inp} ${!form.product_name ? 'border-amber-600/50 focus:border-amber-500' : ''}`}
                      placeholder="Tovar yoki xizmat nomini kiriting" />
                    {!form.product_name && (
                      <p className="text-[11px] text-amber-600 mt-1">Bu maydon shartnoma matnida ishlatiladi</p>
                    )}
                  </div>
                )}
                <div className={`bg-[#111827] border border-[#1E293B] rounded-xl p-4 ${!(form.contract_type === 'oldi_sotdi' || form.contract_type === 'daval') ? 'lg:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className={lbl + ' mb-0'}>Shablon</label>
                    <div className="flex rounded-lg overflow-hidden border border-[#1E293B]">
                      <button type="button" onClick={() => setUseTemplate(true)}
                        className={`px-3 py-1 text-xs transition ${useTemplate ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Shablon</button>
                      <button type="button" onClick={() => setUseTemplate(false)}
                        className={`px-3 py-1 text-xs transition ${!useTemplate ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Qo&apos;lda</button>
                    </div>
                  </div>
                  {useTemplate ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setSelectedTemplate('auto')}
                        className={`px-3 py-2 rounded-lg text-xs border transition ${selectedTemplate === 'auto' ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-[#1E293B] text-gray-300 hover:border-blue-600/50'}`}>
                        Avtomatik ({(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type]})
                      </button>
                      {allTemplates.map(tpl => (
                        <button key={tpl.id} type="button" onClick={() => { setSelectedTemplate(tpl.id); setForm(f => ({ ...f, content: tpl.content })) }}
                          className={`px-3 py-2 rounded-lg text-xs border transition ${selectedTemplate === tpl.id ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-[#1E293B] text-gray-300 hover:border-blue-600/50'}`}>
                          {tpl.icon} {tpl.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      className={inp} rows={5} placeholder="Shartnoma matnini bu yerga kiriting..." />
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 2 && (
            <div className="max-w-xl mx-auto">
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 bg-[#0F172A] border-b border-[#1E293B] flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Qo&apos;shimcha ma&apos;lumotlar</h2>
                    <p className="text-xs text-gray-500">{(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type]} uchun maxsus shartlar</p>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                <div className="space-y-4">

                  {form.contract_type === 'ijara' && (<>
                    <div><label className={lbl}>Ijara ob&apos;ekti manzili</label>
                      <input value={form.ijara_manzil || ''} onChange={e => setForm(f => ({ ...f, ijara_manzil: e.target.value }))} className={inp} placeholder="Toshkent sh., Yunusobod t., ..."/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>Maydon (m²)</label>
                        <input value={form.ijara_maydon || ''} onChange={e => setForm(f => ({ ...f, ijara_maydon: e.target.value }))} className={inp} placeholder="50"/></div>
                      <div><label className={lbl}>Oylik to&apos;lov (so&apos;m)</label>
                        <input type="number" value={form.oylik_tolov || ''} onChange={e => setForm(f => ({ ...f, oylik_tolov: e.target.value }))} className={inp} placeholder="0"/></div>
                    </div>
                    <div><label className={lbl}>Ijara muddati</label>
                      <input value={form.ijara_muddat || ''} onChange={e => setForm(f => ({ ...f, ijara_muddat: e.target.value }))} className={inp} placeholder="12 oy"/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>Boshlanish sanasi</label>
                        <input type="date" value={form.ijara_boshlanish || ''} onChange={e => setForm(f => ({ ...f, ijara_boshlanish: e.target.value }))} className={inp}/></div>
                      <div><label className={lbl}>Tugash sanasi</label>
                        <input type="date" value={form.ijara_tugash || ''} onChange={e => setForm(f => ({ ...f, ijara_tugash: e.target.value }))} className={inp}/></div>
                    </div>
                  </>)}

                  {form.contract_type === 'xizmat' && (<>
                    <div><label className={lbl}>Xizmat tavsifi</label>
                      <textarea value={form.xizmat_tavsif || ''} onChange={e => setForm(f => ({ ...f, xizmat_tavsif: e.target.value }))} className={inp} rows={3} placeholder="Ko'rsatiladigan xizmat haqida..."/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>Boshlanish sanasi</label>
                        <input type="date" value={form.xizmat_boshlanish || ''} onChange={e => setForm(f => ({ ...f, xizmat_boshlanish: e.target.value }))} className={inp}/></div>
                      <div><label className={lbl}>Tugash sanasi</label>
                        <input type="date" value={form.xizmat_tugash || ''} onChange={e => setForm(f => ({ ...f, xizmat_tugash: e.target.value }))} className={inp}/></div>
                    </div>
                    <div><label className={lbl}>To&apos;lov tartibi</label>
                      <input value={form.xizmat_tolov || ''} onChange={e => setForm(f => ({ ...f, xizmat_tolov: e.target.value }))} className={inp} placeholder="Masalan: 50% avans, qolgan 50% bajarilgandan keyin"/></div>
                  </>)}

                  {form.contract_type === 'pudrat' && (<>
                    <div><label className={lbl}>Ish joyi (ob&apos;ekt)</label>
                      <input value={form.pudrat_obekt || ''} onChange={e => setForm(f => ({ ...f, pudrat_obekt: e.target.value }))} className={inp} placeholder="Toshkent sh., ..."/></div>
                    <div><label className={lbl}>Ishlar tavsifi</label>
                      <textarea value={form.pudrat_tavsif || ''} onChange={e => setForm(f => ({ ...f, pudrat_tavsif: e.target.value }))} className={inp} rows={3} placeholder="Bajarilishi kerak bo'lgan ishlar..."/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>Boshlanish sanasi</label>
                        <input type="date" value={form.pudrat_boshlanish || ''} onChange={e => setForm(f => ({ ...f, pudrat_boshlanish: e.target.value }))} className={inp}/></div>
                      <div><label className={lbl}>Tugash sanasi</label>
                        <input type="date" value={form.pudrat_tugash || ''} onChange={e => setForm(f => ({ ...f, pudrat_tugash: e.target.value }))} className={inp}/></div>
                    </div>
                  </>)}

                  {form.contract_type === 'moliyaviy' && (<>
                    <div><label className={lbl}>Qarz maqsadi</label>
                      <input value={form.qarz_maqsad || ''} onChange={e => setForm(f => ({ ...f, qarz_maqsad: e.target.value }))} className={inp} placeholder="Qarz olish maqsadi..."/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>Foiz stavkasi</label>
                        <input value={form.qarz_foiz || ''} onChange={e => setForm(f => ({ ...f, qarz_foiz: e.target.value }))} className={inp} placeholder="Foizsiz yoki yillik X%"/></div>
                      <div><label className={lbl}>Qaytarish muddati</label>
                        <input value={form.qarz_muddat || ''} onChange={e => setForm(f => ({ ...f, qarz_muddat: e.target.value }))} className={inp} placeholder="12 oy"/></div>
                    </div>
                  </>)}

                  {form.contract_type === 'daval' && (<>
                    <div><label className={lbl}>Daval material</label>
                      <input value={form.daval_material || ''} onChange={e => setForm(f => ({ ...f, daval_material: e.target.value }))} className={inp} placeholder="Xom ashyo turi va miqdori"/></div>
                    <div><label className={lbl}>Tayyor mahsulot</label>
                      <input value={form.daval_mahsulot || ''} onChange={e => setForm(f => ({ ...f, daval_mahsulot: e.target.value }))} className={inp} placeholder="Tayyor mahsulot turi"/></div>
                  </>)}

                  {form.contract_type === 'xalqaro' && (<>
                    <div><label className={lbl}>Incoterms 2020</label>
                      <input value={form.incoterms || ''} onChange={e => setForm(f => ({ ...f, incoterms: e.target.value }))} className={inp} placeholder="FOB, CIF, DAP, ..."/></div>
                    <div><label className={lbl}>Yetkazib berish joyi</label>
                      <input value={form.yetkazish_joy || ''} onChange={e => setForm(f => ({ ...f, yetkazish_joy: e.target.value }))} className={inp} placeholder="Port / shahar"/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>To&apos;lov usuli</label>
                        <input value={form.tolov_usuli || ''} onChange={e => setForm(f => ({ ...f, tolov_usuli: e.target.value }))} className={inp} placeholder="Bank o'tkazma / Akkreditiv"/></div>
                      <div><label className={lbl}>Valyuta</label>
                        <input value={form.valyuta || ''} onChange={e => setForm(f => ({ ...f, valyuta: e.target.value }))} className={inp} placeholder="USD / EUR / UZS"/></div>
                    </div>
                  </>)}

                  {form.contract_type === 'qoshimcha' && (<>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>Asosiy shartnoma raqami</label>
                        <input value={form.asosiy_raqam || ''} onChange={e => setForm(f => ({ ...f, asosiy_raqam: e.target.value }))} className={inp} placeholder="2024/001"/></div>
                      <div><label className={lbl}>Asosiy shartnoma sanasi</label>
                        <input type="date" value={form.asosiy_sana || ''} onChange={e => setForm(f => ({ ...f, asosiy_sana: e.target.value }))} className={inp}/></div>
                    </div>
                    <div><label className={lbl}>Yangi tugash sanasi</label>
                      <input type="date" value={form.yangi_muddat || ''} onChange={e => setForm(f => ({ ...f, yangi_muddat: e.target.value }))} className={inp}/>
                      <p className="text-xs text-gray-600 mt-1">To&apos;ldirilsa — muddat uzaytirish bandi avtomatik qo&apos;shiladi</p></div>
                    <div><label className={lbl}>Boshqa o&apos;zgartirishlar</label>
                      <textarea value={form.ozgartirish || ''} onChange={e => setForm(f => ({ ...f, ozgartirish: e.target.value }))} className={inp} rows={3} placeholder="Narx, miqdor yoki boshqa shartlar o'zgartirilsa..."/></div>
                  </>)}

                  {form.contract_type === 'oldi_sotdi' && (
                    <div><label className={lbl}>Yetkazib berish muddati</label>
                      <input value={form.yetkazish_muddat || ''} onChange={e => setForm(f => ({ ...f, yetkazish_muddat: e.target.value }))} className={inp} placeholder="Masalan: 20 ish kuni, 30 kalendar kun"/>
                      <p className="text-xs text-gray-600 mt-1">Bo&apos;sh qoldirilsa: "20 (yigirma) ish kuni" ishlatiladi</p></div>
                  )}

                  {form.contract_type === 'agentlik' && (<>
                    <div><label className={lbl}>Agent vazifasi</label>
                      <textarea value={form.xizmat_tavsif || ''} onChange={e => setForm(f => ({ ...f, xizmat_tavsif: e.target.value }))} className={inp} rows={2} placeholder="Masalan: tovarlarni sotish, mijozlar topish..."/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>Agentlik haqi (%)</label>
                        <input value={form.qarz_foiz || ''} onChange={e => setForm(f => ({ ...f, qarz_foiz: e.target.value }))} className={inp} placeholder="Masalan: 5"/></div>
                      <div><label className={lbl}>Hudud</label>
                        <input value={form.yetkazish_joy || ''} onChange={e => setForm(f => ({ ...f, yetkazish_joy: e.target.value }))} className={inp} placeholder="Masalan: Toshkent viloyati"/></div>
                    </div>
                  </>)}

                  {form.contract_type === 'transport' && (<>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>Yuklash manzili</label>
                        <input value={form.ijara_manzil || ''} onChange={e => setForm(f => ({ ...f, ijara_manzil: e.target.value }))} className={inp} placeholder="Shahar, ko'cha..."/></div>
                      <div><label className={lbl}>Yetkazish manzili</label>
                        <input value={form.yetkazish_joy || ''} onChange={e => setForm(f => ({ ...f, yetkazish_joy: e.target.value }))} className={inp} placeholder="Shahar, ko'cha..."/></div>
                    </div>
                    <div><label className={lbl}>Yuk turi / tavsifi</label>
                      <input value={form.xizmat_tavsif || ''} onChange={e => setForm(f => ({ ...f, xizmat_tavsif: e.target.value }))} className={inp} placeholder="Masalan: qurilish materiallari, oziq-ovqat..."/></div>
                  </>)}

                  {form.contract_type === 'lizing' && (<>
                    <div><label className={lbl}>Lizing ob&apos;ekti</label>
                      <input value={form.pudrat_obekt || ''} onChange={e => setForm(f => ({ ...f, pudrat_obekt: e.target.value }))} className={inp} placeholder="Masalan: Nexia 3 avtomobili, CNC stanogi..."/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>Lizing muddati</label>
                        <input value={form.ijara_muddat || ''} onChange={e => setForm(f => ({ ...f, ijara_muddat: e.target.value }))} className={inp} placeholder="Masalan: 36 oy"/></div>
                      <div><label className={lbl}>Boshlang&apos;ich badal (%)</label>
                        <input value={form.qarz_foiz || ''} onChange={e => setForm(f => ({ ...f, qarz_foiz: e.target.value }))} className={inp} placeholder="Masalan: 20"/></div>
                    </div>
                    <div><label className={lbl}>Yillik foiz stavkasi (%)</label>
                      <input value={form.oylik_tolov || ''} onChange={e => setForm(f => ({ ...f, oylik_tolov: e.target.value }))} className={inp} placeholder="Masalan: 18"/></div>
                  </>)}

                  {form.contract_type === 'boshqa' && (
                    <div><label className={lbl}>Shartnoma matni</label>
                      <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className={inp} rows={10} placeholder="Shartnoma matnini bu yerga kiriting..."/></div>
                  )}

                  {/* QQS */}
                  <div className="pt-4 border-t border-[#1E293B]">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="flex items-center gap-2.5 cursor-pointer"
                          onClick={() => setForm(f => ({ ...f, qqs_enabled: !f.qqs_enabled }))}>
                          <div className={`relative w-10 h-5 rounded-full transition ${form.qqs_enabled ? 'bg-blue-600' : 'bg-[#1F2937]'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.qqs_enabled ? 'translate-x-5' : ''}`}/>
                          </div>
                          <span className="text-sm text-gray-300 font-medium">QQS</span>
                          {form.qqs_enabled
                            ? <span className="text-xs text-green-400 bg-green-900/20 border border-green-700/30 px-2 py-0.5 rounded-full">Yoqilgan</span>
                            : <span className="text-xs text-gray-500 bg-[#1F2937] border border-[#1E293B] px-2 py-0.5 rounded-full">O'chirilgan</span>
                          }
                        </label>
                        {selectedOrg?.qqsreg && !form.qqs_enabled && (
                          <p className="text-[11px] text-amber-500 mt-1 ml-12">Tashkilot QQS to&apos;lovchi, lekin bu shartnomada o&apos;chirilgan</p>
                        )}
                      </div>
                      {form.qqs_enabled && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Stavka:</span>
                          <select value={form.qqs_rate} onChange={e => setForm(f => ({ ...f, qqs_rate: parseInt(e.target.value) }))}
                            className="bg-[#0B1220] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-blue-600 cursor-pointer">
                            <option value={12}>12%</option><option value={15}>15%</option><option value={0}>0%</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* ══ STEP 3: Sections editor ══ */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Bo&apos;limlar tahriri</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Shartnoma bo&apos;limlari va bandlarini tahrirlang</p>
                </div>
                <button type="button" onClick={addBolim} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-600/30 px-3 py-1.5 rounded-lg transition">
                  + Bo&apos;lim qo&apos;shish
                </button>
              </div>
              {getStructureForEdit().bolimlar.map((bolim, bi) => (
                <div key={bi} className="bg-[#111827] rounded-xl p-4 space-y-3 border border-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <input value={bolim.sarlavha} onChange={e => updateBolim(bi, e.target.value)}
                      className="flex-1 bg-[#0B1220] border border-[#1E293B] text-white font-semibold text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                      placeholder={`${bi + 1}. Bo'lim nomi`}/>
                    <button type="button" onClick={() => removeBolim(bi)} className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:bg-red-400/10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  {bolim.bandlar.map((band, bdi) => (
                    <div key={bdi} className="flex gap-2">
                      <span className="text-xs text-gray-500 pt-2.5 min-w-[36px] flex-shrink-0 font-mono">{bi + 1}.{bdi + 1}</span>
                      <textarea value={band.matn} onChange={e => updateBand(bi, bdi, e.target.value)}
                        className="flex-1 bg-[#0F172A] border border-[#1E293B] text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-600 resize-y leading-relaxed"
                        rows={3} placeholder="Band matni..."/>
                      <button type="button" onClick={() => removeBand(bi, bdi)} className="w-6 h-6 mt-1 flex-shrink-0 flex items-center justify-center rounded text-gray-500 hover:text-red-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addBand(bi)} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
                    {T(t.modal.addItem)}
                  </button>
                </div>
              ))}
              {getStructureForEdit().bolimlar.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-sm bg-[#111827] rounded-xl border border-[#1E293B]">
                  <p>Bo&apos;limlar yo&apos;q</p>
                  <button type="button" onClick={addBolim} className="mt-2 text-blue-400 hover:text-blue-300 text-xs">+ Bo&apos;lim qo&apos;shish</button>
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 4: Spec items ══ */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Spesifikatsiya</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Mahsulot / xizmat ro&apos;yxati</p>
                </div>
                <button type="button" onClick={addSpecItem} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-600/30 px-3 py-1.5 rounded-lg transition">
                  + Qator qo&apos;shish
                </button>
              </div>

              {form.spec_items.length > 0 ? (
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#0B1220] text-gray-400 border-b border-[#1E293B]">
                          <th className="text-center py-3 px-3 w-8">№</th>
                          <th className="text-left py-3 px-3 min-w-[180px]">Tovarlar (ish, xizmatlar) nomi</th>
                          <th className="text-center py-3 px-3 w-24">O&apos;lchov birligi</th>
                          <th className="text-right py-3 px-3 w-20">Miqdori</th>
                          <th className="text-right py-3 px-3 w-32">Narxi (so&apos;m)</th>
                          <th className="text-right py-3 px-3 w-32">Qiymati</th>
                          <th className="text-center py-3 px-3 w-24">QQS stavkasi</th>
                          <th className="text-right py-3 px-3 w-32">QQS summasi</th>
                          <th className="text-right py-3 px-3 w-36">Jami (QQS bilan)</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.spec_items.map((item, i) => {
                          const base = (item.miqdori || 0) * (item.narxi || 0)
                          return (
                            <tr key={i} className="border-b border-[#1E293B] hover:bg-[#1F2937] transition">
                              <td className="py-2 px-3 text-center text-gray-500">{i + 1}</td>
                              <td className="py-2 px-3">
                                <input value={item.nomi} onChange={e => updateSpecItem(i, 'nomi', e.target.value)} className={inp2} placeholder="Tovar nomi..."/>
                              </td>
                              <td className="py-2 px-3"><BirlikPicker value={item.birlik} onChange={v => updateSpecItem(i, 'birlik', v)}/></td>
                              <td className="py-2 px-3">
                                <input type="number" value={item.miqdori} onChange={e => updateSpecItem(i, 'miqdori', parseFloat(e.target.value) || 0)} className={inp2 + ' text-right'} min={0}/>
                              </td>
                              <td className="py-2 px-3">
                                <input type="number" value={item.narxi} onChange={e => updateSpecItem(i, 'narxi', parseFloat(e.target.value) || 0)} className={inp2 + ' text-right'} min={0}/>
                              </td>
                              <td className="py-2 px-3 text-right text-gray-300 font-medium">
                                {base.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3">
                                <select value={item.qqs_foiz} onChange={e => updateSpecItem(i, 'qqs_foiz', e.target.value)} className={inp2 + ' text-center'}>
                                  <option value="siz">QQSsiz</option><option value="0">0%</option>
                                  <option value="12">12%</option><option value="15">15%</option>
                                  <option value="all">Barchasi uchun</option>
                                </select>
                              </td>
                              <td className="py-2 px-3 text-right text-gray-300">
                                {item.qqs_summa.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-white">
                                {item.summa.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-2">
                                <button type="button" onClick={() => removeSpecItem(i)} className="text-red-400 hover:text-red-300 w-5 h-5 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        <tr className="bg-[#0B1220] font-semibold text-gray-200 border-t border-[#1E293B]">
                          <td colSpan={5} className="py-2.5 px-3 text-right text-xs text-gray-400">Jami:</td>
                          <td className="py-2.5 px-3 text-right text-white text-xs">{specBase.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td></td>
                          <td className="py-2.5 px-3 text-right text-yellow-400 text-xs">{specQqs.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold text-sm">{specTotal.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500 text-sm bg-[#111827] rounded-xl border border-[#1E293B]">
                  <p>Spesifikatsiya bo&apos;sh</p>
                  <button type="button" onClick={addSpecItem} className="mt-2 text-blue-400 hover:text-blue-300 text-xs">+ Qator qo&apos;shish</button>
                </div>
              )}

              {form.spec_items.length > 0 && (
                <div className="flex justify-end">
                  <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 min-w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Soliqsiz jami:</span>
                      <span className="text-white">{specBase.toLocaleString()} so&apos;m</span>
                    </div>
                    {specQqs > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">QQS jami:</span>
                        <span className="text-yellow-400">{specQqs.toLocaleString()} so&apos;m</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold border-t border-[#1E293B] pt-2">
                      <span className="text-gray-300">Jami:</span>
                      <span className="text-white text-base">{specTotal.toLocaleString()} so&apos;m</span>
                    </div>
                    <div className="text-xs text-gray-500">{numberToWords(specTotal, 'uz')} so&apos;m</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="sticky bottom-0 z-40 bg-[#0B1220]/95 backdrop-blur border-t border-[#1E293B]">
          <div className="px-5 py-3 flex items-center justify-between">
            <div>
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white bg-[#1E293B] hover:bg-[#273549] rounded-lg transition border border-[#273549]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                  Orqaga
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => router.push('/dashboard/shartnomalar')}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition rounded-lg hover:bg-[#1E293B]">
                Bekor qilish
              </button>
              {step < 4 ? (
                <button type="button" onClick={goNext}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
                  Keyingi
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              ) : (
                <>
                  <button type="button" onClick={openPreview}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#1E293B] hover:bg-[#273549] text-gray-300 hover:text-white rounded-lg transition border border-[#273549]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    Ko&apos;rish
                  </button>
                  <button type="button" disabled={saving} onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
                    {saving
                      ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saqlanmoqda...</>
                      : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Saqlash</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── New CP Modal ── */}
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
                  <input value={newCp.name} onChange={e => setNewCp(p => ({ ...p, name: e.target.value }))} placeholder="Masalan: ALFA MCHJ"
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">INN</label>
                  <div className="flex gap-2">
                    <input value={newCp.inn} onChange={e => setNewCp(p => ({ ...p, inn: e.target.value }))} placeholder="123456789" maxLength={9}
                      className="flex-1 bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                    <button type="button" disabled={cpStirLoading || !newCp.inn} onClick={lookupStirNewCp}
                      className="px-2.5 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-400 rounded-lg text-xs disabled:opacity-40 transition flex-shrink-0" title="Soliqdan ma'lumot olish">
                      {cpStirLoading ? '...' : '🔍'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">9 raqam kiriting va 🔍 bosing</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Rahbar F.I.O</label>
                  <input value={newCp.director_name} onChange={e => setNewCp(p => ({ ...p, director_name: e.target.value }))} placeholder="Rahbar ismi"
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Manzil</label>
                  <input value={newCp.address} onChange={e => setNewCp(p => ({ ...p, address: e.target.value }))} placeholder="Toshkent sh., ..."
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Telefon</label>
                  <input value={newCp.phone} onChange={e => setNewCp(p => ({ ...p, phone: formatPhoneUz(e.target.value) }))} placeholder="+998 90 123-45-67"
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Bank nomi</label>
                  <input value={newCp.bank_name} onChange={e => setNewCp(p => ({ ...p, bank_name: e.target.value }))} placeholder="Ipak yo'li bank"
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">MFO</label>
                  <input value={newCp.mfo} onChange={e => {
                    const mfo = e.target.value
                    const bankName = mfo.length === 5 ? getBankByMfo(mfo) : null
                    setNewCp(p => ({ ...p, mfo, ...(bankName ? { bank_name: bankName } : {}) }))
                  }} placeholder="01234"
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Hisob raqami</label>
                  <input value={newCp.bank_account} onChange={e => setNewCp(p => ({ ...p, bank_account: e.target.value }))} placeholder="20208000000000000000"
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#1E293B]">
              <button type="button" onClick={handleQuickAddCp} disabled={savingCp}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm py-2.5 rounded-lg font-semibold transition">
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

      {/* ── Preview Modal ── */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-4xl max-h-[95vh] flex flex-col rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-100 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type]} — Ko&apos;rinish
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">No {form.contract_number} · {form.contract_date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition">
                  Chop etish
                </button>
                <button type="button" onClick={() => setPreviewOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition text-xl">
                  ×
                </button>
              </div>
            </div>
            {/* Document body */}
            <div className="overflow-y-auto flex-1 bg-white">
              <div className="max-w-[210mm] mx-auto px-[20mm] py-[15mm]" style={{ fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: '1.6', color: '#000' }}>
                {/* Header row */}
                <div className="flex justify-between mb-6 text-sm">
                  <div>
                    <div className="font-semibold">{form.city}</div>
                    <div className="text-[10px] text-gray-500">(shartnoma tuzish joyi)</div>
                  </div>
                  <div className="text-right">
                    <div>{form.contract_date}</div>
                    <div className="text-[10px] text-gray-500">(shartnoma tuzish sanasi)</div>
                  </div>
                </div>
                {/* Content */}
                <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-black">
                  {previewContent}
                </pre>
                {/* Spec items */}
                {form.spec_items.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-sm mb-3 text-center">Spesifikatsiya (1-ilova)</h4>
                    <table className="w-full border-collapse text-xs border border-gray-400">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-400 px-2 py-1 text-center">№</th>
                          <th className="border border-gray-400 px-2 py-1 text-left">Nomi</th>
                          <th className="border border-gray-400 px-2 py-1 text-center">O&apos;lchov</th>
                          <th className="border border-gray-400 px-2 py-1 text-right">Miqdor</th>
                          <th className="border border-gray-400 px-2 py-1 text-right">Narxi</th>
                          <th className="border border-gray-400 px-2 py-1 text-center">QQS</th>
                          <th className="border border-gray-400 px-2 py-1 text-right">QQS summasi</th>
                          <th className="border border-gray-400 px-2 py-1 text-right">Jami</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.spec_items.map((it, i) => (
                          <tr key={i}>
                            <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
                            <td className="border border-gray-400 px-2 py-1">{it.nomi}</td>
                            <td className="border border-gray-400 px-2 py-1 text-center">{it.birlik}</td>
                            <td className="border border-gray-400 px-2 py-1 text-right">{it.miqdori}</td>
                            <td className="border border-gray-400 px-2 py-1 text-right">{it.narxi?.toLocaleString()}</td>
                            <td className="border border-gray-400 px-2 py-1 text-center">{it.qqs_foiz === 'siz' ? 'QQSsiz' : it.qqs_foiz + '%'}</td>
                            <td className="border border-gray-400 px-2 py-1 text-right">{it.qqs_summa?.toLocaleString()}</td>
                            <td className="border border-gray-400 px-2 py-1 text-right font-semibold">{it.summa?.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                          <td colSpan={7} className="border border-gray-400 px-2 py-1.5 text-right">Jami:</td>
                          <td className="border border-gray-400 px-2 py-1.5 text-right">
                            {form.spec_items.reduce((s, i) => s + i.summa, 0).toLocaleString()} so&apos;m
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Rekvizitlar */}
                {(selectedOrg || selectedCp) && (
                  <div className="mt-8 pt-4 border-t border-gray-300">
                    <h4 className="font-semibold text-sm mb-4 text-center uppercase tracking-wide">Tomonlarning yuridik manzillari va rekvizitlari</h4>
                    <div className="grid grid-cols-2 gap-8 text-xs">
                      <div>
                        <div className="font-semibold mb-2 text-sm">Ijrochi</div>
                        {selectedOrg && [
                          ['Nomi:', selectedOrg.name],
                          ['Manzil:', selectedOrg.address],
                          ['Telefon:', selectedOrg.phone],
                          ['STIR:', selectedOrg.inn],
                          ['OKED:', selectedOrg.oked],
                          ['X/R:', selectedOrg.bank_account],
                          ['Bank:', selectedOrg.bank_name],
                          ['MFO:', selectedOrg.mfo],
                        ].map(([l, v]) => v ? (
                          <div key={l} className="flex gap-1 mb-0.5">
                            <span className="font-medium w-16 flex-shrink-0">{l}</span>
                            <span>{v}</span>
                          </div>
                        ) : null)}
                        <div className="mt-6 pt-4 border-t border-gray-300">
                          <div className="font-medium mb-1">Rahbar: {selectedOrg?.director_name}</div>
                          <div className="border-b border-black w-40 mt-8 mb-1"/>
                          <div className="text-[10px] text-gray-500">Imzo / M.O.</div>
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold mb-2 text-sm">Buyurtmachi</div>
                        {selectedCp && [
                          ['Nomi:', selectedCp.name],
                          ['Manzil:', selectedCp.address],
                          ['Telefon:', selectedCp.phone],
                          ['STIR:', selectedCp.inn],
                          ['OKED:', selectedCp.oked],
                          ['X/R:', selectedCp.bank_account],
                          ['Bank:', selectedCp.bank_name],
                          ['MFO:', selectedCp.mfo],
                        ].map(([l, v]) => v ? (
                          <div key={l} className="flex gap-1 mb-0.5">
                            <span className="font-medium w-16 flex-shrink-0">{l}</span>
                            <span>{v}</span>
                          </div>
                        ) : null)}
                        <div className="mt-6 pt-4 border-t border-gray-300">
                          <div className="font-medium mb-1">Rahbar: {selectedCp?.director_name}</div>
                          <div className="border-b border-black w-40 mt-8 mb-1"/>
                          <div className="text-[10px] text-gray-500">Imzo / M.O.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── City Setup Modal ── */}
      {cityModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-5 border-b border-[#1E293B]">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Shartnoma tuzish joyi</h3>
                  <p className="text-xs text-gray-500">Bir marta kiriting — keyingi barchaga avtomatik qo'yiladi</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Shahar / tuman</label>
                <input
                  autoFocus
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const city = cityInput.trim() || orgCityDefault(activeOrg)
                      localStorage.setItem(`contract_city_${activeOrg?.id}`, city)
                      setForm(f => ({ ...f, city }))
                      setCityModalOpen(false)
                    }
                  }}
                  className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 text-gray-200 text-sm px-3 py-2.5 rounded-lg focus:outline-none placeholder-gray-600"
                  placeholder="Masalan: Toshkent shahri"
                />
                <p className="text-xs text-gray-600 mt-1.5">Bu sozlama faqat sizning qurilmangizda saqlanadi. Keyinchalik "Tuzilgan joy" yonidagi ⚙ orqali o'zgartirishingiz mumkin.</p>
              </div>
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => {
                    const city = cityInput.trim() || orgCityDefault(activeOrg)
                    localStorage.setItem(`contract_city_${activeOrg?.id}`, city)
                    setForm(f => ({ ...f, city }))
                    setCityModalOpen(false)
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-lg font-semibold transition">
                  Saqlash
                </button>
                <button type="button" onClick={() => setCityModalOpen(false)}
                  className="px-4 bg-[#1F2937] hover:bg-[#2D3748] border border-[#1E293B] text-gray-300 text-sm py-2.5 rounded-lg transition">
                  O'tkazib yuborish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
