'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../../../context'
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
import CityPicker from '../../_components/CityPicker'
import { BirlikPicker } from '../../../_components/BirlikPicker'

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

const CONTRACT_TYPES = [
  { key: 'oldi_sotdi', color: '#3B82F6' }, { key: 'xizmat', color: '#10B981' },
  { key: 'ijara', color: '#F59E0B' },      { key: 'pudrat', color: '#F97316' },
  { key: 'moliyaviy', color: '#8B5CF6' },  { key: 'daval', color: '#06B6D4' },
  { key: 'xalqaro', color: '#6366F1' },    { key: 'agentlik', color: '#EC4899' },
  { key: 'transport', color: '#14B8A6' },  { key: 'lizing', color: '#64748B' },
  { key: 'qoshimcha', color: '#6B7280' },  { key: 'boshqa', color: '#4B5563' },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EditShartnoma() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const contractId = params.id as string

  const { orgs, cps, activeOrg, bankAccounts, reloadContracts, userId } = useDashboard()

  const [form, setForm] = useState<ContractForm>({
    contract_number: '', contract_date: new Date().toISOString().split('T')[0],
    contract_type: 'oldi_sotdi', amount: '', organization_id: activeOrg?.id || '',
    counterparty_id: '', status: 'active', content: '',
    city: orgCityDefault(activeOrg), product_name: '',
    spec_items: [], qqs_enabled: false, qqs_rate: 12,
  })
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
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

  // Inline edits
  const [orgEdits, setOrgEdits] = useState<Record<string, string>>({})
  const [cpEdits, setCpEdits] = useState<Record<string, string>>({})

  // ── Load existing contract ──────────────────────────────────────────────────

  useEffect(() => {
    if (!contractId) return
    loadContract()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId])

  async function loadContract() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()
    if (error || !data) {
      toast(T(t.yangiPage.contractNotFound), 'error')
      router.push('/dashboard/shartnomalar')
      return
    }
    const extra = data.extra_data || {}
    setForm({
      contract_number: data.contract_number || '',
      contract_date: data.contract_date || new Date().toISOString().split('T')[0],
      contract_type: data.contract_type || 'oldi_sotdi',
      amount: String(data.amount || ''),
      organization_id: data.organization_id || '',
      counterparty_id: data.counterparty_id || '',
      status: data.status || 'active',
      content: data.content || '',
      city: data.city || '',
      product_name: data.product_name || '',
      spec_items: data.spec_items || [],
      qqs_enabled: data.qqs_enabled || false,
      qqs_rate: data.qqs_rate || 12,
      ...extra,
    })
    // CP search input ni to'ldirish
    if (data.counterparty_id) {
      const cp = cps.find(c => c.id === data.counterparty_id)
      if (cp) setCpSearch(cp.name)
    }
    if (data.organization_id) {
      loadCustomTemplates(data.organization_id)
    }
    setLoading(false)
  }

  async function loadCustomTemplates(orgId: string) {
    const { data } = await supabase.from('contract_templates').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
    if (data) setCustomTemplates(data.map((d: Record<string, unknown>) => ({
      id: d.id as string, type: d.type as string, name: d.name as string,
      description: (d.description as string) || '', content: d.content as string,
      isDefault: false, icon: '📄', tags: [],
    })))
  }

  useEffect(() => { setLocalCps(cps) }, [cps])
  useEffect(() => { setOrgEdits({}) }, [form.organization_id])
  useEffect(() => { setCpEdits({}) }, [form.counterparty_id])

  // Close CP dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cpDropRef.current && !cpDropRef.current.contains(e.target as Node)) setCpDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
    const org = mergedOrg
    const cp = mergedCp
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
      amount, amount_text: amount > 0 ? numberToWords(amount, lang) + " so'm" : '___', extra,
    }, lang)
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

  // ── CP search ─────────────────────────────────────────────────────────────────

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
              toast(`${T(t.yangiPage.foundInBase)}: ${(found as Counterparty).name}`, 'success')
              return
            }
          }
          toast(`${T(t.msg.errorPrefix)}: ` + saveErr.message, 'error'); return
        }
        setLocalCps(prev => [...prev, saved as Counterparty])
        setForm(f => ({ ...f, counterparty_id: (saved as Counterparty).id }))
        setCpSearch((saved as Counterparty).name)
        setCpDropOpen(false)
        toast(`${apiData.source === 'global_db' ? T(t.yangiPage.foundInBase) : T(t.yangiPage.fromSoliqApi)}: ${co.name}`, 'success')
      } catch { toast(T(t.yangiPage.requestError), 'error') }
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

  async function lookupStirNewCp() {
    const inn = newCp.inn.trim()
    if (!inn || !/^\d{9}$/.test(inn)) { toast(T(t.yangiPage.stirFormat), 'error'); return }
    setCpStirLoading(true)
    try {
      const res = await fetch(`/api/stir?stir=${inn}`)
      const data = await res.json()
      if (!res.ok) { toast(data.error || T(t.yangiPage.stirNotFound2), 'error'); return }
      const co = data.company
      setNewCp(p => ({ ...p, name: co.name || p.name, director_name: co.director_name || p.director_name, address: co.address || p.address, qqsreg: co.qqsreg || p.qqsreg, oked: co.oked || p.oked }))
      toast(co.status === 'active' ? T(t.yangiPage.dataFilled) : T(t.yangiPage.orgInactive), co.status === 'inactive' ? 'error' : 'success')
    } catch { toast(T(t.yangiPage.stirRequestError), 'error') }
    finally { setCpStirLoading(false) }
  }

  async function handleQuickAddCp() {
    if (!newCp.name.trim()) { toast(T(t.yangiPage.cpNameRequired), 'error'); return }
    setSavingCp(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.from('counterparties').insert({
      name: newCp.name.trim(), inn: newCp.inn.trim(), director_name: newCp.director_name.trim(),
      address: newCp.address.trim(), phone: newCp.phone.trim(), bank_name: newCp.bank_name.trim(),
      bank_account: newCp.bank_account.trim(), mfo: newCp.mfo.trim(), qqsreg: newCp.qqsreg.trim(),
      oked: newCp.oked.trim(), user_id: session!.user.id,
    }).select().single()
    setSavingCp(false)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ` + error.message, 'error'); return }
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
    if (!form.organization_id) { toast(T(t.yangiPage.selectOrgErr), 'error'); return false }
    if (!form.counterparty_id) { toast(T(t.yangiPage.selectCpErr), 'error'); return false }
    return true
  }

  function goNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2) initStructureEdit()
    setStep(s => Math.min(s + 1, 4))
  }

  // ── Save (UPDATE) ─────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.organization_id) { toast(T(t.msg.selectOrg), 'error'); return }
    setSaving(true)

    const org = mergedOrg
    const cp = mergedCp
    const amount = parseFloat(form.amount) || 0

    if (cp && Object.keys(cpEdits).length > 0) {
      await supabase.from('counterparties').update(cpEdits).eq('id', cp.id)
    }

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
    let content = structureToText(structure, {
      type_name: (CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type] || form.contract_type,
      number: form.contract_number, date: form.contract_date, city: form.city, org, cp,
      contract_type: form.contract_type,
      spec_items: form.spec_items.length > 0 ? form.spec_items : undefined,
    })
    if (lang === 'oz') content = latinToCyrillic(content)

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
      qqs_rate: form.qqs_rate, extra_data,
    }

    const { error } = await supabase.from('contracts').update(payload).eq('id', contractId)
    setSaving(false)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    logAudit('update', 'contracts', contractId, { contract_number: payload.contract_number, contract_type: payload.contract_type })
    await reloadContracts()
    toast(T(t.yangiPage.contractSaved), 'success')
    router.push('/dashboard/shartnomalar')
  }

  // ── Preview ───────────────────────────────────────────────────────────────────

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState('')

  function buildPreviewContent(): string {
    const org = mergedOrg
    const cp = mergedCp
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
  const mergedOrg = selectedOrg ? { ...selectedOrg, ...orgEdits } : null
  const mergedCp = selectedCp ? { ...selectedCp, ...cpEdits } : null
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0B1220]">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          {T(t.msg.loading)}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#0B1220]">

      {/* ── Page Header ── */}
      <div className="sticky top-0 z-40 bg-[#0B1220]/95 backdrop-blur border-b border-[#1E293B]">
        <div className="px-5 pt-3 pb-0 flex items-center gap-2">
          <button type="button" onClick={() => router.push('/dashboard/shartnomalar')}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            {T(t.nav.contracts)}
          </button>
          <span className="text-gray-600 text-xs">/</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedTypeMeta?.color || '#3B82F6' }}/>
            <span className="text-xs text-white font-medium">{T(t.modal.editContract)}</span>
            <span className="text-xs text-gray-500">— {(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type]}</span>
          </div>
        </div>
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

      <div>
        <div className="px-5 py-5">

          {/* ══ STEP 1 ══ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div>
                    <label className={lbl}>{T(t.yangiPage.numLabel)} <span className="text-red-400">*</span></label>
                    <input value={form.contract_number} onChange={e => setForm(f => ({ ...f, contract_number: e.target.value }))}
                      className={inp} placeholder="2024/001" />
                  </div>
                  <div>
                    <label className={lbl}>{T(t.yangiPage.dateLabel)}</label>
                    <input type="date" value={form.contract_date} onChange={e => setForm(f => ({ ...f, contract_date: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>{T(t.yangiPage.cityLabel)}</label>
                    <CityPicker value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} />
                  </div>
                  <div>
                    <label className={lbl}>{T(t.yangiPage.amountLabel)}</label>
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
                      <p className="text-[10px] text-gray-500 mt-1 truncate">{numberToWords(parseFloat(form.amount), lang)} so&apos;m</p>
                    )}
                  </div>
                </div>
                <div className="border-t border-[#1E293B] pt-3">
                  <label className={lbl + ' mb-2'}>{T(t.yangiPage.typeLabel)}</label>
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

              {/* Org | CP */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">{T(t.yangiPage.yourInfo)}</h3>
                    <select value={form.organization_id} onChange={e => setForm(f => ({ ...f, organization_id: e.target.value }))}
                      className="bg-[#0F172A] border border-[#1E293B] text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-600 max-w-[180px]">
                      <option value="">{T(t.yangiPage.selectOrgOption)}...</option>
                      {orgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                    </select>
                  </div>
                  {selectedOrg ? (
                    <div className="p-4 divide-y divide-[#1E293B]">
                      {([
                        ['STIR/ЖШШИР', 'inn'], [T(t.orgs.name), 'name'], [`${T(t.orgs.director)} (FIO)`, 'director_name'],
                        [T(t.orgs.mfo), 'mfo'], [T(t.orgs.bank), 'bank_name'], [T(t.orgs.account), 'bank_account'],
                        ['OKED', 'oked'], [T(t.orgs.address), 'address'], [T(t.yangiPage.cpPhoneLabel), 'phone'],
                      ] as [string, string][]).map(([label, field]) => (
                        <div key={field} className="flex items-center gap-2 py-1.5">
                          <span className="text-[11px] text-gray-500 w-28 flex-shrink-0">{label}</span>
                          <input
                            value={orgEdits[field] ?? (selectedOrg as unknown as Record<string,string>)[field] ?? ''}
                            onChange={e => setOrgEdits(p => ({ ...p, [field]: e.target.value }))}
                            className="text-xs text-gray-200 flex-1 bg-transparent border-b border-transparent hover:border-[#374151] focus:border-blue-600 focus:outline-none px-0.5 transition min-w-0"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">{T(t.yangiPage.selectOrgEmpty)}</div>
                  )}
                </div>

                <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1E293B]">
                    <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">{T(t.yangiPage.cpInfoTitle)}</h3>
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
                        placeholder={T(t.yangiPage.cpSearchPlh)}
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
                        <span>⚠</span><span>{T(t.yangiPage.cpInactive)}</span>
                      </div>
                    )}
                    {selectedCp && (([
                      ['STIR', 'inn'], [T(t.orgs.name), 'name'], [`${T(t.orgs.director)} (FIO)`, 'director_name'],
                      [T(t.orgs.mfo), 'mfo'], [T(t.orgs.bank), 'bank_name'], [T(t.orgs.account), 'bank_account'],
                      ['OKED', 'oked'], [T(t.orgs.address), 'address'], [T(t.yangiPage.cpPhoneLabel), 'phone'],
                    ] as [string, string][]).map(([label, field]) => (
                      <div key={field} className="flex items-center gap-2 px-4 py-1.5">
                        <span className="text-[11px] text-gray-500 w-28 flex-shrink-0">{label}</span>
                        <input
                          value={cpEdits[field] ?? (selectedCp as unknown as Record<string,string>)[field] ?? ''}
                          onChange={e => setCpEdits(p => ({ ...p, [field]: e.target.value }))}
                          className="text-xs text-gray-200 flex-1 bg-transparent border-b border-transparent hover:border-[#374151] focus:border-blue-600 focus:outline-none px-0.5 transition min-w-0"
                        />
                      </div>
                    )))}
                  </div>
                </div>
              </div>

              {/* Product + Template */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {(form.contract_type === 'oldi_sotdi' || form.contract_type === 'daval') && (
                  <div className="bg-[#111827] border border-amber-600/40 rounded-xl p-4">
                    <label className="block text-xs text-amber-400 mb-1.5 font-semibold">
                      {T(t.yangiPage.productLabel)} <span className="text-red-400">*</span>
                    </label>
                    <input value={form.product_name} onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                      className={`${inp} ${!form.product_name ? 'border-amber-600/50 focus:border-amber-500' : ''}`}
                      placeholder={T(t.yangiPage.productPlh)} />
                  </div>
                )}
                <div className={`bg-[#111827] border border-[#1E293B] rounded-xl p-4 ${!(form.contract_type === 'oldi_sotdi' || form.contract_type === 'daval') ? 'lg:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className={lbl + ' mb-0'}>{T(t.yangiPage.templateLabel)}</label>
                    <div className="flex rounded-lg overflow-hidden border border-[#1E293B]">
                      <button type="button" onClick={() => setUseTemplate(true)}
                        className={`px-3 py-1 text-xs transition ${useTemplate ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>{T(t.yangiPage.templateLabel)}</button>
                      <button type="button" onClick={() => setUseTemplate(false)}
                        className={`px-3 py-1 text-xs transition ${!useTemplate ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>{T(t.yangiPage.manualLabel)}</button>
                    </div>
                  </div>
                  {useTemplate ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setSelectedTemplate('auto'); setForm(f => ({ ...f, content: '' })) }}
                        className={`px-3 py-2 rounded-lg text-xs border transition ${selectedTemplate === 'auto' ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-[#1E293B] text-gray-300 hover:border-blue-600/50'}`}>
                        {T(t.yangiPage.autoPrefix)} ({(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type]})
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
                      className={inp} rows={5} placeholder={T(t.yangiPage.contentPlh)} />
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
                    <h2 className="text-sm font-semibold text-white">{T(t.yangiPage.additionalTitle)}</h2>
                    <p className="text-xs text-gray-500">{(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type]} {T(t.yangiPage.additionalSuffix)}</p>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                <div className="space-y-4">
                  {form.contract_type === 'ijara' && (<>
                    <div><label className={lbl}>{T(t.yangiPage.ijaraAddress)}</label>
                      <input value={form.ijara_manzil || ''} onChange={e => setForm(f => ({ ...f, ijara_manzil: e.target.value }))} className={inp} placeholder="Toshkent sh., Yunusobod t., ..."/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>{T(t.yangiPage.area)}</label>
                        <input value={form.ijara_maydon || ''} onChange={e => setForm(f => ({ ...f, ijara_maydon: e.target.value }))} className={inp} placeholder="50"/></div>
                      <div><label className={lbl}>{T(t.yangiPage.monthlyPayment)}</label>
                        <input type="number" value={form.oylik_tolov || ''} onChange={e => setForm(f => ({ ...f, oylik_tolov: e.target.value }))} className={inp} placeholder="0"/></div>
                    </div>
                    <div><label className={lbl}>{T(t.yangiPage.ijaraDuration)}</label>
                      <input value={form.ijara_muddat || ''} onChange={e => setForm(f => ({ ...f, ijara_muddat: e.target.value }))} className={inp} placeholder="12 oy"/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>{T(t.yangiPage.startDate)}</label>
                        <input type="date" value={form.ijara_boshlanish || ''} onChange={e => setForm(f => ({ ...f, ijara_boshlanish: e.target.value }))} className={inp}/></div>
                      <div><label className={lbl}>{T(t.yangiPage.endDate)}</label>
                        <input type="date" value={form.ijara_tugash || ''} onChange={e => setForm(f => ({ ...f, ijara_tugash: e.target.value }))} className={inp}/></div>
                    </div>
                  </>)}
                  {form.contract_type === 'xizmat' && (<>
                    <div><label className={lbl}>{T(t.yangiPage.serviceDesc)}</label>
                      <textarea value={form.xizmat_tavsif || ''} onChange={e => setForm(f => ({ ...f, xizmat_tavsif: e.target.value }))} className={inp} rows={3} placeholder={T(t.yangiPage.serviceDescPlh)}/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>{T(t.yangiPage.startDate)}</label>
                        <input type="date" value={form.xizmat_boshlanish || ''} onChange={e => setForm(f => ({ ...f, xizmat_boshlanish: e.target.value }))} className={inp}/></div>
                      <div><label className={lbl}>{T(t.yangiPage.endDate)}</label>
                        <input type="date" value={form.xizmat_tugash || ''} onChange={e => setForm(f => ({ ...f, xizmat_tugash: e.target.value }))} className={inp}/></div>
                    </div>
                    <div><label className={lbl}>{T(t.yangiPage.paymentOrder)}</label>
                      <input value={form.xizmat_tolov || ''} onChange={e => setForm(f => ({ ...f, xizmat_tolov: e.target.value }))} className={inp} placeholder={T(t.yangiPage.paymentOrderPlh)}/></div>
                  </>)}
                  {form.contract_type === 'pudrat' && (<>
                    <div><label className={lbl}>{T(t.yangiPage.workPlace)}</label>
                      <input value={form.pudrat_obekt || ''} onChange={e => setForm(f => ({ ...f, pudrat_obekt: e.target.value }))} className={inp} placeholder="Toshkent sh., ..."/></div>
                    <div><label className={lbl}>{T(t.yangiPage.worksDesc)}</label>
                      <textarea value={form.pudrat_tavsif || ''} onChange={e => setForm(f => ({ ...f, pudrat_tavsif: e.target.value }))} className={inp} rows={3} placeholder={T(t.yangiPage.worksDescPlh)}/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>{T(t.yangiPage.startDate)}</label>
                        <input type="date" value={form.pudrat_boshlanish || ''} onChange={e => setForm(f => ({ ...f, pudrat_boshlanish: e.target.value }))} className={inp}/></div>
                      <div><label className={lbl}>{T(t.yangiPage.endDate)}</label>
                        <input type="date" value={form.pudrat_tugash || ''} onChange={e => setForm(f => ({ ...f, pudrat_tugash: e.target.value }))} className={inp}/></div>
                    </div>
                  </>)}
                  {form.contract_type === 'moliyaviy' && (<>
                    <div><label className={lbl}>{T(t.yangiPage.loanPurpose)}</label>
                      <input value={form.qarz_maqsad || ''} onChange={e => setForm(f => ({ ...f, qarz_maqsad: e.target.value }))} className={inp} placeholder={T(t.yangiPage.loanPurposePlh)}/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>{T(t.yangiPage.interestRate)}</label>
                        <input value={form.qarz_foiz || ''} onChange={e => setForm(f => ({ ...f, qarz_foiz: e.target.value }))} className={inp} placeholder={T(t.yangiPage.interestRatePlh)}/></div>
                      <div><label className={lbl}>{T(t.yangiPage.returnPeriod)}</label>
                        <input value={form.qarz_muddat || ''} onChange={e => setForm(f => ({ ...f, qarz_muddat: e.target.value }))} className={inp} placeholder="12 oy"/></div>
                    </div>
                  </>)}
                  {form.contract_type === 'daval' && (<>
                    <div><label className={lbl}>{T(t.yangiPage.davalMaterial)}</label>
                      <input value={form.daval_material || ''} onChange={e => setForm(f => ({ ...f, daval_material: e.target.value }))} className={inp} placeholder={T(t.yangiPage.davalMaterialPlh)}/></div>
                    <div><label className={lbl}>{T(t.yangiPage.readyProduct)}</label>
                      <input value={form.daval_mahsulot || ''} onChange={e => setForm(f => ({ ...f, daval_mahsulot: e.target.value }))} className={inp} placeholder={T(t.yangiPage.readyProductPlh)}/></div>
                  </>)}
                  {form.contract_type === 'xalqaro' && (<>
                    <div><label className={lbl}>{T(t.yangiPage.incotermsLabel)}</label>
                      <input value={form.incoterms || ''} onChange={e => setForm(f => ({ ...f, incoterms: e.target.value }))} className={inp} placeholder="FOB, CIF, DAP, ..."/></div>
                    <div><label className={lbl}>{T(t.yangiPage.deliveryPlace)}</label>
                      <input value={form.yetkazish_joy || ''} onChange={e => setForm(f => ({ ...f, yetkazish_joy: e.target.value }))} className={inp} placeholder="Port / shahar"/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>{T(t.yangiPage.paymentMethod)}</label>
                        <input value={form.tolov_usuli || ''} onChange={e => setForm(f => ({ ...f, tolov_usuli: e.target.value }))} className={inp} placeholder="Bank o'tkazma / Akkreditiv"/></div>
                      <div><label className={lbl}>{T(t.yangiPage.currency)}</label>
                        <input value={form.valyuta || ''} onChange={e => setForm(f => ({ ...f, valyuta: e.target.value }))} className={inp} placeholder="USD / EUR / UZS"/></div>
                    </div>
                  </>)}
                  {form.contract_type === 'qoshimcha' && (<>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>{T(t.yangiPage.mainContractNum)}</label>
                        <input value={form.asosiy_raqam || ''} onChange={e => setForm(f => ({ ...f, asosiy_raqam: e.target.value }))} className={inp} placeholder="2024/001"/></div>
                      <div><label className={lbl}>{T(t.yangiPage.mainContractDate)}</label>
                        <input type="date" value={form.asosiy_sana || ''} onChange={e => setForm(f => ({ ...f, asosiy_sana: e.target.value }))} className={inp}/></div>
                    </div>
                    <div><label className={lbl}>{T(t.yangiPage.newEndDate)}</label>
                      <input type="date" value={form.yangi_muddat || ''} onChange={e => setForm(f => ({ ...f, yangi_muddat: e.target.value }))} className={inp}/></div>
                    <div><label className={lbl}>{T(t.yangiPage.otherChanges)}</label>
                      <textarea value={form.ozgartirish || ''} onChange={e => setForm(f => ({ ...f, ozgartirish: e.target.value }))} className={inp} rows={3} placeholder={T(t.yangiPage.otherChangesPlh)}/></div>
                  </>)}
                  {form.contract_type === 'oldi_sotdi' && (
                    <div><label className={lbl}>{T(t.yangiPage.deliveryDuration)}</label>
                      <input value={form.yetkazish_muddat || ''} onChange={e => setForm(f => ({ ...f, yetkazish_muddat: e.target.value }))} className={inp} placeholder={T(t.yangiPage.deliveryDurationPlh)}/></div>
                  )}
                  {form.contract_type === 'agentlik' && (<>
                    <div><label className={lbl}>{T(t.yangiPage.agentTask)}</label>
                      <textarea value={form.xizmat_tavsif || ''} onChange={e => setForm(f => ({ ...f, xizmat_tavsif: e.target.value }))} className={inp} rows={2} placeholder={T(t.yangiPage.agentTaskPlh)}/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>{T(t.yangiPage.agentFee)}</label>
                        <input value={form.qarz_foiz || ''} onChange={e => setForm(f => ({ ...f, qarz_foiz: e.target.value }))} className={inp} placeholder="Masalan: 5"/></div>
                      <div><label className={lbl}>{T(t.yangiPage.region)}</label>
                        <input value={form.yetkazish_joy || ''} onChange={e => setForm(f => ({ ...f, yetkazish_joy: e.target.value }))} className={inp} placeholder="Masalan: Toshkent viloyati"/></div>
                    </div>
                  </>)}
                  {form.contract_type === 'transport' && (<>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>{T(t.yangiPage.loadAddress)}</label>
                        <input value={form.ijara_manzil || ''} onChange={e => setForm(f => ({ ...f, ijara_manzil: e.target.value }))} className={inp} placeholder={T(t.yangiPage.addressPlh)}/></div>
                      <div><label className={lbl}>{T(t.yangiPage.deliveryAddress)}</label>
                        <input value={form.yetkazish_joy || ''} onChange={e => setForm(f => ({ ...f, yetkazish_joy: e.target.value }))} className={inp} placeholder={T(t.yangiPage.addressPlh)}/></div>
                    </div>
                    <div><label className={lbl}>{T(t.yangiPage.cargoType)}</label>
                      <input value={form.xizmat_tavsif || ''} onChange={e => setForm(f => ({ ...f, xizmat_tavsif: e.target.value }))} className={inp} placeholder="Masalan: qurilish materiallari..."/></div>
                  </>)}
                  {form.contract_type === 'lizing' && (<>
                    <div><label className={lbl}>{T(t.yangiPage.lizingObject)}</label>
                      <input value={form.pudrat_obekt || ''} onChange={e => setForm(f => ({ ...f, pudrat_obekt: e.target.value }))} className={inp} placeholder="Masalan: Nexia 3 avtomobili..."/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={lbl}>{T(t.yangiPage.lizingDuration)}</label>
                        <input value={form.ijara_muddat || ''} onChange={e => setForm(f => ({ ...f, ijara_muddat: e.target.value }))} className={inp} placeholder="Masalan: 36 oy"/></div>
                      <div><label className={lbl}>{T(t.yangiPage.initialPayment)}</label>
                        <input value={form.qarz_foiz || ''} onChange={e => setForm(f => ({ ...f, qarz_foiz: e.target.value }))} className={inp} placeholder="Masalan: 20"/></div>
                    </div>
                    <div><label className={lbl}>{T(t.yangiPage.annualRate)}</label>
                      <input value={form.oylik_tolov || ''} onChange={e => setForm(f => ({ ...f, oylik_tolov: e.target.value }))} className={inp} placeholder="Masalan: 18"/></div>
                  </>)}
                  {form.contract_type === 'boshqa' && (
                    <div><label className={lbl}>{T(t.yangiPage.contractText)}</label>
                      <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className={inp} rows={10} placeholder={T(t.yangiPage.contentPlh)}/></div>
                  )}
                  {/* QQS */}
                  <div className="pt-4 border-t border-[#1E293B]">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer"
                        onClick={() => setForm(f => ({ ...f, qqs_enabled: !f.qqs_enabled }))}>
                        <div className={`relative w-10 h-5 rounded-full transition ${form.qqs_enabled ? 'bg-blue-600' : 'bg-[#1F2937]'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.qqs_enabled ? 'translate-x-5' : ''}`}/>
                        </div>
                        <span className="text-sm text-gray-300 font-medium">QQS</span>
                        {form.qqs_enabled
                          ? <span className="text-xs text-green-400 bg-green-900/20 border border-green-700/30 px-2 py-0.5 rounded-full">{T(t.yangiPage.qqsEnabled)}</span>
                          : <span className="text-xs text-gray-500 bg-[#1F2937] border border-[#1E293B] px-2 py-0.5 rounded-full">{T(t.yangiPage.qqsDisabled)}</span>
                        }
                      </label>
                      {form.qqs_enabled && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{T(t.yangiPage.qqsRate)}</span>
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

          {/* ══ STEP 3 ══ */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">{T(t.yangiPage.sectionsTitle)}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{T(t.yangiPage.sectionsSubtitle)}</p>
                </div>
                <button type="button" onClick={addBolim} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-600/30 px-3 py-1.5 rounded-lg transition">
                  {T(t.yangiPage.addSection)}
                </button>
              </div>
              {getStructureForEdit().bolimlar.map((bolim, bi) => (
                <div key={bi} className="bg-[#111827] rounded-xl p-4 space-y-3 border border-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <input value={bolim.sarlavha} onChange={e => updateBolim(bi, e.target.value)}
                      className="flex-1 bg-[#0B1220] border border-[#1E293B] text-white font-semibold text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                      placeholder={`${bi + 1}. ${T(t.yangiPage.sectionPlh)}`}/>
                    <button type="button" onClick={() => removeBolim(bi)} className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:bg-red-400/10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  {bolim.bandlar.map((band, bdi) => (
                    <div key={bdi} className="flex gap-2">
                      <span className="text-xs text-gray-500 pt-2.5 min-w-[36px] flex-shrink-0 font-mono">{bi + 1}.{bdi + 1}</span>
                      <textarea value={band.matn} onChange={e => updateBand(bi, bdi, e.target.value)}
                        className="flex-1 bg-[#0F172A] border border-[#1E293B] text-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-600 resize-y leading-relaxed"
                        rows={3} placeholder={T(t.yangiPage.bandPlh)}/>
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
                  <p>{T(t.yangiPage.noSections)}</p>
                  <button type="button" onClick={addBolim} className="mt-2 text-blue-400 hover:text-blue-300 text-xs">{T(t.yangiPage.addSection)}</button>
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 4 ══ */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">{T(t.yangiPage.specTitle)}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{T(t.yangiPage.specSubtitle)}</p>
                </div>
                <button type="button" onClick={addSpecItem} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-600/30 px-3 py-1.5 rounded-lg transition">
                  {T(t.yangiPage.addRow)}
                </button>
              </div>
              {form.spec_items.length > 0 ? (
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#0B1220] text-gray-400 border-b border-[#1E293B]">
                          <th className="text-center py-3 px-3 w-8">№</th>
                          <th className="text-left py-3 px-3 min-w-[180px]">{T(t.yangiPage.specNameHeader)}</th>
                          <th className="text-center py-3 px-3 w-24">{T(t.yangiPage.specUnitHeader)}</th>
                          <th className="text-right py-3 px-3 w-20">{T(t.yangiPage.specQtyHeader)}</th>
                          <th className="text-right py-3 px-3 w-32">{T(t.yangiPage.specPriceHeader)}</th>
                          <th className="text-right py-3 px-3 w-32">{T(t.yangiPage.specValueHeader)}</th>
                          <th className="text-center py-3 px-3 w-24">{T(t.yangiPage.specQqsRateHeader)}</th>
                          <th className="text-right py-3 px-3 w-32">{T(t.yangiPage.specQqsSumHeader)}</th>
                          <th className="text-right py-3 px-3 w-36">{T(t.yangiPage.specTotalHeader)}</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.spec_items.map((item, i) => {
                          const base = (item.miqdori || 0) * (item.narxi || 0)
                          return (
                            <tr key={i} className="border-b border-[#1E293B] hover:bg-[#1F2937] transition">
                              <td className="py-2 px-3 text-center text-gray-500">{i + 1}</td>
                              <td className="py-2 px-3"><input value={item.nomi} onChange={e => updateSpecItem(i, 'nomi', e.target.value)} className={inp2} placeholder={T(t.yangiPage.specItemPlh)}/></td>
                              <td className="py-2 px-3"><BirlikPicker value={item.birlik} onChange={v => updateSpecItem(i, 'birlik', v)}/></td>
                              <td className="py-2 px-3"><input type="number" value={item.miqdori} onChange={e => updateSpecItem(i, 'miqdori', parseFloat(e.target.value) || 0)} className={inp2 + ' text-right'} min={0}/></td>
                              <td className="py-2 px-3"><input type="number" value={item.narxi} onChange={e => updateSpecItem(i, 'narxi', parseFloat(e.target.value) || 0)} className={inp2 + ' text-right'} min={0}/></td>
                              <td className="py-2 px-3 text-right text-gray-300 font-medium">{base.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-2 px-3">
                                <select value={item.qqs_foiz} onChange={e => updateSpecItem(i, 'qqs_foiz', e.target.value)} className={inp2 + ' text-center'}>
                                  <option value="siz">{T(t.yangiPage.qqsSiz)}</option><option value="0">0%</option>
                                  <option value="12">12%</option><option value="15">15%</option>
                                  <option value="all">{T(t.yangiPage.qqsAll)}</option>
                                </select>
                              </td>
                              <td className="py-2 px-3 text-right text-gray-300">{item.qqs_summa.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-2 px-3 text-right font-semibold text-white">{item.summa.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-2 px-2">
                                <button type="button" onClick={() => removeSpecItem(i)} className="text-red-400 hover:text-red-300 w-5 h-5 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        <tr className="bg-[#0B1220] font-semibold text-gray-200 border-t border-[#1E293B]">
                          <td colSpan={5} className="py-2.5 px-3 text-right text-xs text-gray-400">{T(t.yangiPage.totalLabel)}</td>
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
                  <p>{T(t.yangiPage.specEmpty)}</p>
                  <button type="button" onClick={addSpecItem} className="mt-2 text-blue-400 hover:text-blue-300 text-xs">{T(t.yangiPage.addRow)}</button>
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
                  {T(t.yangiPage.backBtn)}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => router.push('/dashboard/shartnomalar')}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition rounded-lg hover:bg-[#1E293B]">
                {T(t.yangiPage.cancelBtn)}
              </button>
              {step < 4 ? (
                <button type="button" onClick={goNext}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition">
                  {T(t.yangiPage.nextBtn)}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              ) : (
                <>
                  <button type="button" onClick={openPreview}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#1E293B] hover:bg-[#273549] text-gray-300 hover:text-white rounded-lg transition border border-[#273549]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    {T(t.yangiPage.previewBtn)}
                  </button>
                  <button type="button" disabled={saving} onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition">
                    {saving
                      ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{T(t.yangiPage.savingBtn)}</>
                      : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>{T(t.yangiPage.saveBtn)}</>}
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
              <h3 className="text-base font-semibold text-white">{T(t.yangiPage.newCpTitle)}</h3>
              <button type="button" onClick={() => setQuickAddCp(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition text-xl">×</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">{T(t.yangiPage.cpNameLabel)} <span className="text-red-400">*</span></label>
                  <input value={newCp.name} onChange={e => setNewCp(p => ({ ...p, name: e.target.value }))} placeholder={T(t.yangiPage.cpNamePlh)}
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{T(t.orgs.inn)}</label>
                  <div className="flex gap-2">
                    <input value={newCp.inn} onChange={e => setNewCp(p => ({ ...p, inn: e.target.value }))} placeholder="123456789" maxLength={9}
                      className="flex-1 bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                    <button type="button" disabled={cpStirLoading || !newCp.inn} onClick={lookupStirNewCp}
                      className="px-2.5 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-400 rounded-lg text-xs disabled:opacity-40 transition flex-shrink-0">
                      {cpStirLoading ? '...' : '🔍'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{T(t.yangiPage.cpDirectorLabel)}</label>
                  <input value={newCp.director_name} onChange={e => setNewCp(p => ({ ...p, director_name: e.target.value }))} placeholder={T(t.yangiPage.cpDirectorPlh)}
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">{T(t.yangiPage.cpAddressLabel)}</label>
                  <input value={newCp.address} onChange={e => setNewCp(p => ({ ...p, address: e.target.value }))} placeholder={T(t.yangiPage.cpAddressPlh)}
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{T(t.yangiPage.cpPhoneLabel)}</label>
                  <input value={newCp.phone} onChange={e => setNewCp(p => ({ ...p, phone: formatPhoneUz(e.target.value) }))} placeholder="+998 90 123-45-67"
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{T(t.yangiPage.cpBankLabel)}</label>
                  <input value={newCp.bank_name} onChange={e => setNewCp(p => ({ ...p, bank_name: e.target.value }))} placeholder={T(t.yangiPage.cpBankPlh)}
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{T(t.orgs.mfo)}</label>
                  <input value={newCp.mfo} onChange={e => {
                    const mfo = e.target.value
                    const bankName = mfo.length === 5 ? getBankByMfo(mfo) : null
                    setNewCp(p => ({ ...p, mfo, ...(bankName ? { bank_name: bankName } : {}) }))
                  }} placeholder="01234"
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">{T(t.yangiPage.cpAccountLabel)}</label>
                  <input value={newCp.bank_account} onChange={e => setNewCp(p => ({ ...p, bank_account: e.target.value }))} placeholder="20208000000000000000"
                    className="w-full bg-[#0F172A] border border-[#1E293B] focus:border-blue-600 text-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none placeholder-gray-600"/>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-[#1E293B]">
              <button type="button" onClick={handleQuickAddCp} disabled={savingCp}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm py-2.5 rounded-lg font-semibold transition">
                {savingCp ? T(t.yangiPage.cpSaving) : T(t.yangiPage.cpSaveBtn)}
              </button>
              <button type="button" onClick={() => setQuickAddCp(false)}
                className="px-5 bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 text-sm py-2.5 rounded-lg transition">
                {T(t.yangiPage.cpCancelBtn)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-4xl max-h-[95vh] flex flex-col rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3 bg-gray-100 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {(CONTRACT_TYPE_NAMES as Record<string, string>)[form.contract_type]} — {T(t.yangiPage.previewTitle)}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">No {form.contract_number} · {form.contract_date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition">
                  {T(t.yangiPage.printBtn)}
                </button>
                <button type="button" onClick={() => setPreviewOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition text-xl">
                  ×
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 bg-white">
              <div className="max-w-[210mm] mx-auto px-[20mm] py-[15mm]" style={{ fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: '1.6', color: '#000' }}>
                <div className="flex justify-between mb-6 text-sm">
                  <div>
                    <div className="font-semibold">{form.city}</div>
                    <div className="text-[10px] text-gray-500">{T(t.yangiPage.previewCityLabel)}</div>
                  </div>
                  <div className="text-right">
                    <div>{form.contract_date}</div>
                    <div className="text-[10px] text-gray-500">{T(t.yangiPage.previewDateLabel)}</div>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-black">
                  {previewContent}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
