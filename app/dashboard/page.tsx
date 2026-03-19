'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CONTRACT_TEMPLATES, CONTRACT_TYPE_NAMES, fillTemplate } from '@/lib/contractTemplates'
import { getStructure, structureToText, numberToWords, ContractStructure } from '@/lib/contractStructures'
import { DEFAULT_TEMPLATES, type AppTemplate } from '@/lib/defaultTemplates'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, LANG_LABELS, type Lang } from '@/lib/i18n'

// ─── Types ───────────────────────────────────────────────
type Org = {
  id: string; name: string; inn: string; director_name: string
  bank_name: string; bank_account: string; mfo: string; address: string
  stamp_url?: string; signature_url?: string
  // Kengaytirilgan maydonlar
  phone?: string; oked?: string; viloyat?: string; tuman?: string
  qqsreg?: string; qqs_stavka?: string
  director_pinfl?: string; chief_accountant?: string
  sender_pinfl?: string; sender_name?: string
}
type BankAccount = {
  id: string; organization_id: string; bank_name: string
  account_number: string; mfo: string; is_default: boolean
}
type Counterparty = {
  id: string; name: string; inn: string; director_name: string
  bank_name: string; bank_account: string; mfo: string; address: string
  phone?: string; qqsreg?: string
}
type Contract = {
  id: string; contract_number: string; contract_date: string
  contract_type: string; amount: number; status: string
  organization_id: string; counterparty_id: string
  organizations?: Org; counterparties?: Counterparty; created_at: string
  content?: string; city?: string; product_name?: string
  spec_items?: SpecItem[]; qqs_enabled?: boolean; qqs_rate?: number
}
type SpecItem = {
  nomi: string; birlik: string; miqdori: number; narxi: number
  qqs_foiz: string   // 'siz' | '0' | '12' | '15'
  qqs_summa: number
  summa: number      // narx*miqdor + qqs_summa
}
type Specification = {
  id: string
  organization_id: string
  contract_id: string | null
  spec_number: string
  items: SpecItem[]
  notes: string
  created_at: string
  contracts?: { contract_number: string; contract_date: string; counterparties?: { name: string } }
}
type Subscription = {
  id: string; organization_id: string; plan: string
  contracts_used: number; period_end: string; is_active: boolean
}

// ─── Constants ───────────────────────────────────────────
const STATUSES = {
  draft:     { bg: 'bg-gray-700',    text: 'text-gray-300' },
  active:    { bg: 'bg-emerald-900', text: 'text-emerald-300' },
  completed: { bg: 'bg-blue-900',    text: 'text-blue-300' },
  cancelled: { bg: 'bg-red-900',     text: 'text-red-300' },
}
const CONTRACT_TYPES_I18N: Record<string, Record<'uz'|'oz'|'ru', string>> = {
  oldi_sotdi: { uz: 'Oldi-sotdi',        oz: 'Олди-сотди',       ru: 'Купля-продажа' },
  xizmat:     { uz: 'Xizmat',            oz: 'Хизмат',           ru: 'Услуги' },
  ijara:      { uz: 'Ijara',             oz: 'Ижара',            ru: 'Аренда' },
  pudrat:     { uz: 'Pudrat',            oz: 'Пудрат',           ru: 'Подряд' },
  qoshimcha:  { uz: "Qo'shimcha",        oz: 'Қўшимча',          ru: 'Дополнительный' },
  moliyaviy:  { uz: 'Moliyaviy yordam',  oz: 'Молиявий ёрдам',   ru: 'Финансовая помощь' },
  daval:      { uz: 'Daval',             oz: 'Давал',            ru: 'Давальческий' },
  xalqaro:    { uz: 'Xalqaro',           oz: 'Халқаро',          ru: 'Международный' },
  boshqa:     { uz: 'Boshqa',            oz: 'Бошқа',            ru: 'Другой' },
}
const FREE_LIMIT = 5
const NAV_KEYS = [
  { key: 'overview',        icon: '▣'  },
  { key: 'contracts',       icon: '📄' },
  { key: 'specifications',  icon: '📋' },
  { key: 'shablonlar',      icon: '📑' },
  { key: 'counterparties',  icon: '🤝' },
  { key: 'yurist_ai',       icon: '⚖️' },
  { key: 'profile',         icon: '👤' },
]

// ─── Main Component ───────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const { lang, setLang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const [tab, setTab] = useState('overview')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [orgs, setOrgs] = useState<Org[]>([])
  const [activeOrg, setActiveOrg] = useState<Org | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [cps, setCps] = useState<Counterparty[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cpSearch, setCpSearch] = useState('')
  const [cpDetail, setCpDetail] = useState<Counterparty | null>(null)
  const [editingCp, setEditingCp] = useState<Counterparty | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [orgDropdown, setOrgDropdown] = useState(false)

  const [specs, setSpecs] = useState<Specification[]>([])
  const [specModal, setSpecModal] = useState(false)
  const [editingSpec, setEditingSpec] = useState<Specification | null>(null)
  const emptySpecForm = { contract_id: '', spec_number: '', items: [] as SpecItem[], notes: '' }
  const [specForm, setSpecForm] = useState(emptySpecForm)

  const [templateFilter, setTemplateFilter] = useState<string>('barchasi')
  const [templatePreview, setTemplatePreview] = useState<AppTemplate | null>(null)
  const [customTemplates, setCustomTemplates] = useState<AppTemplate[]>([])
  const [customTemplateModal, setCustomTemplateModal] = useState(false)
  const [editingCustomTemplate, setEditingCustomTemplate] = useState<AppTemplate | null>(null)
  const emptyCustomTpl = { type: 'oldi_sotdi', name: '', description: '', content: '' }
  const [customTplForm, setCustomTplForm] = useState(emptyCustomTpl)

  const [modal, setModal] = useState<null|'org'|'cp'|'contract'|'viewContract'|'bankAccount'|'upgrade'>(null)
  const [viewContract, setViewContract] = useState<Contract | null>(null)
  const [saving, setSaving] = useState(false)

  const emptyOrg = { name:'', inn:'', director_name:'', bank_name:'', bank_account:'', mfo:'', address:'' }
  const emptyCp  = { name:'', inn:'', director_name:'', bank_name:'', bank_account:'', mfo:'', address:'', phone:'', qqsreg:'' }
  const emptyContract = {
    id: '' as string,
    contract_number:'', contract_date: new Date().toISOString().split('T')[0],
    contract_type:'oldi_sotdi', amount:'', organization_id:'', counterparty_id:'',
    status:'draft', content:'', city:'Toshkent', product_name:'', spec_items: [] as SpecItem[],
    qqs_enabled: false, qqs_rate: 12
  }
  const emptyBank = { bank_name:'', account_number:'', mfo:'', is_default: false }

  const [orgForm, setOrgForm] = useState(emptyOrg)
  const [cpForm, setCpForm]   = useState(emptyCp)
  const [contractForm, setContractForm] = useState(emptyContract)
  const [bankForm, setBankForm] = useState(emptyBank)

  const [profile, setProfile] = useState({
    full_name:'', phone:'', lavozim:'', avatar_url:'',
    company_name:'', company_inn:'',
    company_director:'', company_bank:'', company_account:'', company_mfo:'', company_address:''
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [profileTab, setProfileTab] = useState<'account'|'company'>('account')
  const [orgExtForm, setOrgExtForm] = useState<Partial<Org>>({})
  const [orgExtSaving, setOrgExtSaving] = useState(false)
  const [orgExtMsg, setOrgExtMsg] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')

  const stampRef = useRef<HTMLInputElement>(null)
  const signatureRef = useRef<HTMLInputElement>(null)
  const avatarRef = useRef<HTMLInputElement>(null)
  const wordImportRef = useRef<HTMLInputElement>(null)
  const [wordImporting, setWordImporting] = useState(false)

  // ── Yurist AI Hub ──────────────────────────────────────
  const AI_FREE_DAILY = 5
  function localDateStr(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
  function getAiUsedToday(): number {
    if (typeof window === 'undefined') return 0
    try {
      const stored = localStorage.getItem('ai_usage')
      if (!stored) return 0
      const { date, count } = JSON.parse(stored)
      return date === localDateStr() ? count : 0
    } catch { return 0 }
  }
  function incrementAiUsage() {
    try {
      const cur = getAiUsedToday()
      localStorage.setItem('ai_usage', JSON.stringify({ date: localDateStr(), count: cur + 1 }))
    } catch { /* */ }
  }

  type HubFeature = 'tahlil'|'grammatika'|'xulosa'|'tarjima'|'qa'|'clause'|'recommend'|'write'
  const [hubFeature, setHubFeature] = useState<HubFeature>('xulosa')
  const [hubContract, setHubContract] = useState<string>('')
  const [hubResult, setHubResult] = useState<Record<string,unknown>|null>(null)
  const [hubLoading, setHubLoading] = useState(false)
  const [hubError, setHubError] = useState('')
  const [hubQuestion, setHubQuestion] = useState('')
  const [hubInstruction, setHubInstruction] = useState('')
  const [hubTargetLang, setHubTargetLang] = useState('ru')
  const [hubDescription, setHubDescription] = useState('')
  const [hubWriteDetails, setHubWriteDetails] = useState({ tur:'oldi_sotdi', org:'', cp:'', summa:'', extra:'' })
  const [aiUsedToday, setAiUsedToday] = useState(0)

  type AiAnalysis = {
    baho: string
    umumiy: string
    kuchli_tomonlar: string[]
    zaif_tomonlar: string[]
    yuridik_xatarlar: { daraja: string; tavsif: string }[]
    tavsiyalar: string[]
    grammatika_xatolari: string[]
  }
  const [aiModal, setAiModal] = useState(false)
  const [aiContract, setAiContract] = useState<Contract | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AiAnalysis | null>(null)
  const [aiError, setAiError] = useState('')
  const [aiTab, setAiTab] = useState<'tahlil'|'grammatika'>('tahlil')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [billingAnnual, setBillingAnnual] = useState(false)

  useEffect(() => { init(); setAiUsedToday(getAiUsedToday()) }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setUserEmail(session.user.email || '')
    setUserId(session.user.id)
    await Promise.all([loadOrgs(), loadCps(), loadProfile(session.user.id)])
    setLoading(false)
  }

  async function loadOrgs() {
    const { data, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadOrgs:', error.message); return }
    const list = data || []
    setOrgs(list)
    if (list.length > 0) {
      const current = list.find(o => o.id === (activeOrg?.id)) || list[0]
      setActiveOrg(current)
      setOrgExtForm(current)
    }
  }

  async function loadBankAccounts(orgId: string) {
    const { data, error } = await supabase.from('bank_accounts').select('*').eq('organization_id', orgId).order('is_default', { ascending: false })
    if (error) { console.error('loadBankAccounts:', error.message); return }
    setBankAccounts(data || [])
  }

  async function loadSubscription(orgId: string) {
    const { data } = await supabase.from('subscriptions').select('*')
      .eq('organization_id', orgId).eq('is_active', true).single()
    setSubscription(data || null)
  }

  async function loadCps() {
    const { data, error } = await supabase.from('counterparties').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadCps:', error.message); return }
    setCps(data || [])
  }

  async function loadContracts(orgId?: string) {
    const q = supabase.from('contracts').select('*, organizations(*), counterparties(*)').order('created_at', { ascending: false })
    const { data, error } = orgId ? await q.eq('organization_id', orgId) : await q
    if (error) { console.error('loadContracts:', error.message); return }
    setContracts(data || [])
  }

  async function loadSpecs(orgId: string) {
    const { data, error } = await supabase.from('specifications')
      .select('*, contracts(contract_number, contract_date, counterparties(name))')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
    if (error) { console.error('loadSpecs:', error.message); return }
    setSpecs(data || [])
  }

  async function loadCustomTemplates(orgId: string) {
    const { data, error } = await supabase.from('custom_templates')
      .select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
    if (error) { console.error('loadCustomTemplates:', error.message); return }
    setCustomTemplates((data || []).map((t: any) => ({
      id: t.id, type: t.type, name: t.name,
      description: t.description || '', content: t.content,
      icon: '📄', isDefault: false, tags: [],
    })))
  }

  async function saveCustomTemplate(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!activeOrg) return
    if (!customTplForm.name.trim()) { alert(T(t.msg.tplNameRequired)); setSaving(false); return }
    if (!customTplForm.content.trim()) { alert(T(t.msg.tplContentReq)); setSaving(false); return }
    const payload = {
      organization_id: activeOrg.id,
      type: customTplForm.type,
      name: customTplForm.name,
      description: customTplForm.description,
      content: customTplForm.content,
    }
    let dbErr = null
    if (editingCustomTemplate) {
      const { error } = await supabase.from('custom_templates').update(payload).eq('id', editingCustomTemplate.id)
      dbErr = error
    } else {
      const { error } = await supabase.from('custom_templates').insert(payload)
      dbErr = error
    }
    setSaving(false)
    if (dbErr) { alert(`${T(t.msg.errorPrefix)}: ${dbErr.message}`); return }
    setCustomTemplateModal(false); setEditingCustomTemplate(null); setCustomTplForm(emptyCustomTpl)
    loadCustomTemplates(activeOrg.id)
  }

  async function deleteCustomTemplate(id: string) {
    if (!confirm(T(t.msg.deleteTplConfirm))) return
    await supabase.from('custom_templates').delete().eq('id', id)
    if (activeOrg) loadCustomTemplates(activeOrg.id)
  }

  async function loadProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setProfile({
      full_name: data.full_name||'', phone: data.phone||'',
      lavozim: data.lavozim||'', avatar_url: data.avatar_url||'',
      company_name: data.company_name||'', company_inn: data.company_inn||'',
      company_director: data.company_director||'', company_bank: data.company_bank||'',
      company_account: data.company_account||'', company_mfo: data.company_mfo||'',
      company_address: data.company_address||''
    })
  }

  useEffect(() => {
    if (activeOrg) {
      loadBankAccounts(activeOrg.id)
      loadSubscription(activeOrg.id)
      loadSpecs(activeOrg.id)
      loadCustomTemplates(activeOrg.id)
      loadContracts(activeOrg.id)
      setHubContract('')
      setHubResult(null)
      setHubError('')
    }
  }, [activeOrg?.id])

  async function switchOrg(org: Org) {
    setActiveOrg(org)
    setOrgExtForm(org)
    setOrgDropdown(false)
  }

  async function saveOrgExt(e: React.FormEvent) {
    e.preventDefault()
    if (!activeOrg) return
    setOrgExtSaving(true); setOrgExtMsg('')
    const { error: orgErr } = await supabase.from('organizations').update(orgExtForm).eq('id', activeOrg.id)
    if (orgErr) { setOrgExtMsg(`${T(t.msg.errorPrefix)}: ${orgErr.message}`); setOrgExtSaving(false); return }
    setOrgExtMsg(T(t.msg.saved)); setOrgExtSaving(false)
    setTimeout(() => setOrgExtMsg(''), 3000)
    loadOrgs()
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ── Quota check ──
  function canCreateContract(): boolean {
    if (!subscription) return (contracts.filter(c => c.organization_id === activeOrg?.id).length < FREE_LIMIT)
    if (subscription.plan === 'free') return subscription.contracts_used < FREE_LIMIT
    return true
  }

  function getQuotaInfo() {
    if (!activeOrg) return null
    const orgContracts = contracts.filter(c => c.organization_id === activeOrg.id)
    if (!subscription || subscription.plan === 'free') {
      const used = subscription?.contracts_used ?? orgContracts.length
      return { plan: 'Bepul', used, limit: FREE_LIMIT, percent: Math.min((used / FREE_LIMIT) * 100, 100) }
    }
    return { plan: subscription.plan === 'standart' ? 'Standart' : 'AI Pro', used: null, limit: null, percent: null }
  }

  // ── Save org ──
  async function saveOrg(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!orgForm.name.trim()) { alert(T(t.msg.nameRequired)); setSaving(false); return }
    if (orgForm.inn && !/^\d{9}$/.test(orgForm.inn)) { alert(T(t.msg.innInvalid)); setSaving(false); return }
    if (orgForm.mfo && !/^\d{5}$/.test(orgForm.mfo)) { alert(T(t.msg.mfoInvalid)); setSaving(false); return }
    if (orgForm.bank_account && !/^\d{20}$/.test(orgForm.bank_account)) { alert(T(t.msg.accountInvalid)); setSaving(false); return }
    const { data: { session } } = await supabase.auth.getSession()
    const { data: newOrg } = await supabase.from('organizations').insert({ ...orgForm, user_id: session!.user.id }).select().single()
    if (newOrg) {
      // Create free subscription for new org
      await supabase.from('subscriptions').insert({
        organization_id: newOrg.id, user_id: session!.user.id,
        plan: 'free', contracts_used: 0,
        period_end: new Date(Date.now() + 30*24*60*60*1000).toISOString()
      })
    }
    setModal(null); setOrgForm(emptyOrg); setSaving(false); loadOrgs()
  }

  async function saveCp(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!cpForm.name.trim()) { alert(T(t.msg.nameRequired)); setSaving(false); return }
    if (cpForm.inn && !/^\d{9}$/.test(cpForm.inn)) { alert(T(t.msg.innInvalid)); setSaving(false); return }
    if (cpForm.mfo && !/^\d{5}$/.test(cpForm.mfo)) { alert(T(t.msg.mfoInvalid)); setSaving(false); return }
    if (cpForm.bank_account && !/^\d{20}$/.test(cpForm.bank_account)) { alert(T(t.msg.accountInvalid)); setSaving(false); return }
    const { data: { session } } = await supabase.auth.getSession()
    let cpErr = null
    if (editingCp) {
      const { error } = await supabase.from('counterparties').update(cpForm).eq('id', editingCp.id)
      cpErr = error; setEditingCp(null)
    } else {
      const { error } = await supabase.from('counterparties').insert({ ...cpForm, user_id: session!.user.id })
      cpErr = error
    }
    setSaving(false)
    if (cpErr) { alert(`${T(t.msg.errorPrefix)}: ${cpErr.message}`); return }
    setModal(null); setCpForm(emptyCp); loadCps()
  }

  async function deleteCp(id: string) {
    if (!confirm(T(t.msg.deleteCpConfirm))) return
    const { error } = await supabase.from('counterparties').delete().eq('id', id)
    if (error) { alert(`${T(t.msg.errorPrefix)}: ${error.message}`); return }
    setCpDetail(null); loadCps(); setEditingCp(null)
  }

  // ── Auto contract number ──
  function autoContractNum(): string {
    const year = new Date().getFullYear()
    const orgContracts = contracts.filter(c => c.organization_id === activeOrg?.id)
    const num = String(orgContracts.length + 1).padStart(3, '0')
    return `${year}/${num}`
  }

  // ── Auto spec number ──
  function nextSpecNumber(contractId: string) {
    const cnt = specs.filter(s => s.contract_id === contractId).length
    const contract = contracts.find(c => c.id === contractId)
    const base = contract ? contract.contract_number : '0'
    return `${base}-SPEC-${cnt + 1}`
  }

  // ── Save spec ──
  async function saveSpec(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!activeOrg) return
    if (specForm.items.length === 0) { alert(T(t.msg.addItem)); setSaving(false); return }
    const payload = {
      organization_id: activeOrg.id,
      contract_id: specForm.contract_id || null,
      spec_number: specForm.spec_number,
      items: specForm.items,
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
    if (specErr) { alert(`${T(t.msg.errorPrefix)}: ${specErr.message}`); return }
    setSpecModal(false); setEditingSpec(null); setSpecForm(emptySpecForm)
    loadSpecs(activeOrg.id)
  }

  async function generateSpecPDF(spec: Specification) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210, pageH = 297, mL = 15, mR = 15, mT = 15
    const cW = pageW - mL - mR
    const safe = (s: string) => (s||'').replace(/[ʻʼ\u02BC\u2018\u2019]/g,"'").replace(/[\u201C\u201D\u00AB\u00BB]/g,'"').replace(/[\u2013\u2014]/g,'-')

    // Manba ma'lumotlari
    const org = activeOrg
    const contract = spec.contracts
    const orgName    = safe(org?.name || '—')
    const orgDir     = safe(org?.director_name || '—')
    const orgInn     = safe(org?.inn || '—')
    const orgBank    = safe(org?.bank_name || '—')
    const orgAccount = safe(org?.bank_account || '—')
    const orgMfo     = safe(org?.mfo || '—')
    const orgAddr    = safe(org?.address || '—')

    // Kontragent ma'lumotlari — contractdan olamiz
    let cpFull: Counterparty | null = null
    if (spec.contract_id) {
      const found = contracts.find(c => c.id === spec.contract_id)
      if (found?.counterparty_id) {
        cpFull = cps.find(cp => cp.id === found.counterparty_id) || null
      }
    }
    const cpName    = safe(cpFull?.name || contract?.counterparties?.name || '—')
    const cpDir     = safe(cpFull?.director_name || '—')
    const cpInn     = safe(cpFull?.inn || '—')
    const cpBank    = safe(cpFull?.bank_name || '—')
    const cpAccount = safe(cpFull?.bank_account || '—')
    const cpMfo     = safe(cpFull?.mfo || '—')
    const cpAddr    = safe(cpFull?.address || '—')

    const specDate = new Date(spec.created_at)
    const dd = specDate.getDate(), mm = specDate.getMonth()+1, yy = specDate.getFullYear()
    const dateStr = `${String(dd).padStart(2,'0')}.${String(mm).padStart(2,'0')}.${yy}`
    const MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
    const dateLong = `"${dd}" ${MONTHS[mm-1]} ${yy} y.`

    let y = mT

    // ── SARLAVHA ──
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(0,0,0)
    doc.text(safe(`SPESIFIKATSIYA No${spec.spec_number}`), pageW/2, y, {align:'center'}); y += 7

    if (contract) {
      const cNum = contract.contract_number ? `No${contract.contract_number}` : ''
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(60,60,60)
      doc.text(safe(`Shartnoma ${cNum} ga ilova, sana: ${contract.contract_date}`), pageW/2, y, {align:'center'})
      y += 7
    }

    // ── SANA + SHAHAR ──
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(0,0,0)
    doc.text(dateLong, pageW/2, y, {align:'center'}); y += 8

    // ── KIRISH MATNI ──
    const intro = safe(`${orgName} (keyingi o'rinlarda "Sotuvchi") va ${cpName} (keyingi o'rinlarda "Xaridor") o'rtasida ushbu Spesifikatsiya tuzildi:`)
    const introLines = doc.splitTextToSize(intro, cW) as string[]
    for (const l of introLines) { doc.text(l, mL, y); y += 5.5 }
    y += 3

    // ── JADVAL ──
    // Ustunlar: №|Mahsulot nomi|Birlik|Soni|Narx|Stoimost|QQS%|QQS summa|Jami
    // cW = 180mm, ustunlar yig'indisi = 180
    const colW  = [7, 43, 13, 11, 22, 26, 10, 24, 24]
    const colX: number[] = []
    let cx = mL; colW.forEach(w => { colX.push(cx); cx += w })
    const hdrs  = ['No','Nomi','Birlik','Soni','Narx','Narx jami','QQS%','QQS summa','Jami']
    const rowH  = 7

    // Header
    const hdrH = 8
    doc.setFillColor(220,225,235); doc.setDrawColor(100,100,100)
    doc.rect(mL, y, cW, hdrH, 'FD')
    colX.slice(1).forEach(x => doc.line(x, y, x, y+hdrH))
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(0,0,0)
    hdrs.forEach((h, i) => {
      doc.text(h, colX[i] + colW[i]/2, y + 5.5, {align:'center'})
    })
    y += hdrH

    // Items
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(0,0,0)
    spec.items.forEach((it, idx) => {
      if (y > pageH - 50) { doc.addPage(); y = mT }
      const ql = it.qqs_foiz==='siz'?'0':it.qqs_foiz==='0'?'0':it.qqs_foiz
      const asosiyRow = it.miqdori * it.narxi
      const cells = [
        String(idx+1),
        safe(it.nomi),
        safe(it.birlik),
        String(it.miqdori),
        it.narxi.toLocaleString(),
        asosiyRow.toLocaleString(),
        ql+'%',
        it.qqs_summa > 0 ? it.qqs_summa.toLocaleString() : '—',
        it.summa.toLocaleString()
      ]
      // Row height based on name length
      const nameLines = doc.splitTextToSize(cells[1], colW[1]-2) as string[]
      const rH = Math.max(rowH, nameLines.length * 4.5 + 3)
      doc.setDrawColor(150,150,150)
      doc.rect(mL, y, cW, rH, 'S')
      colX.slice(1).forEach(x => doc.line(x, y, x, y+rH))
      cells.forEach((cell, i) => {
        if (i === 1) {
          // Mahsulot nomi — wrap
          const ls = doc.splitTextToSize(cell, colW[i]-2) as string[]
          ls.forEach((l,li) => doc.text(l, colX[i]+1, y+4+li*4.5))
        } else {
          doc.text(cell, colX[i]+colW[i]/2, y+rH/2+1.5, {align:'center'})
        }
      })
      y += rH
    })

    // ИТОГО qatori
    const asosiy = spec.items.reduce((s,it)=>s+it.miqdori*it.narxi,0)
    const qqsJ   = spec.items.reduce((s,it)=>s+(it.qqs_summa||0),0)
    const grand  = spec.items.reduce((s,it)=>s+it.summa,0)
    doc.setFillColor(245,245,245); doc.setDrawColor(100,100,100)
    doc.rect(mL, y, cW, 7, 'FD')
    colX.slice(1).forEach(x => doc.line(x, y, x, y+7))
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5)
    doc.text('Jami:', mL+3, y+5)
    doc.text(asosiy.toLocaleString(), colX[5]+colW[5]/2, y+5, {align:'center'})
    if (qqsJ>0) doc.text(qqsJ.toLocaleString(), colX[7]+colW[7]/2, y+5, {align:'center'})
    doc.text(grand.toLocaleString(), colX[8]+colW[8]/2, y+5, {align:'center'})
    y += 9

    // To'lash jami + so'z bilan
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(0,0,0)
    const grandWords = numberToWords(grand, lang)
    const grandText = safe(`${t.doc.jami[lang]} ${grand.toLocaleString()} ${t.doc.som[lang]} (${grandWords})`)
    const gLines = doc.splitTextToSize(grandText, cW) as string[]
    for (const l of gLines) { doc.text(l, mL, y); y += 5 }
    y += 5

    // ── REKVIZITLAR ──
    if (y > pageH - 60) { doc.addPage(); y = mT }
    const half = cW/2
    const xL = mL, xR = mL+half+5

    // Sotuvchi
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80,80,80)
    doc.text('SOTUVCHI:', xL, y)
    doc.text('XARIDOR:', xR, y); y += 5
    doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(0,0,0)
    const orgNameLines = doc.splitTextToSize(orgName, half-10) as string[]
    orgNameLines.forEach((l,i) => doc.text(l, xL, y+i*5))
    const cpNameLines = doc.splitTextToSize(cpName, half-10) as string[]
    cpNameLines.forEach((l,i) => doc.text(l, xR, y+i*5))
    y += Math.max(orgNameLines.length, cpNameLines.length)*5 + 3

    y = Math.max(y, y) + 5
    // Imzo chiziqlari
    doc.setDrawColor(0,0,0)
    doc.line(xL, y, xL+55, y)
    doc.line(xR, y, xR+55, y)
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(80,80,80)
    doc.text(`Rahbar: _____________ / ${orgDir}`, xL, y+5)
    doc.text(`Rahbar: _____________ / ${cpDir}`, xR, y+5)
    doc.text('M.O.', xL+20, y+11); doc.text('M.O.', xR+20, y+11)

    // Footer
    const n = doc.getNumberOfPages()
    for (let p=1; p<=n; p++) {
      doc.setPage(p); doc.setFontSize(8); doc.setTextColor(170,170,170)
      doc.text('Shartnoma.uz — Online shartnoma generatori', pageW/2, pageH-5, {align:'center'})
      doc.text(`${p} / ${n}`, pageW-mR, pageH-5, {align:'right'})
    }

    doc.save(`spec-${spec.spec_number}.pdf`)
  }

  async function deleteSpec(id: string) {
    if (!confirm(T(t.msg.deleteSpecConfirm))) return
    const { error } = await supabase.from('specifications').delete().eq('id', id)
    if (error) { alert(`${T(t.msg.errorPrefix)}: ${error.message}`); return }
    if (activeOrg) loadSpecs(activeOrg.id)
  }

  async function saveContract(e: React.FormEvent) {
    e.preventDefault()
    if (!canCreateContract()) { setModal('upgrade'); return }
    if (!contractForm.organization_id) { alert(T(t.msg.selectOrg)); return }
    if (!contractForm.contract_number.trim()) { alert("Shartnoma raqamini kiriting"); return }
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('contracts').insert({
      contract_number: contractForm.contract_number,
      contract_date: contractForm.contract_date,
      contract_type: contractForm.contract_type,
      amount: parseFloat(contractForm.amount)||0,
      organization_id: contractForm.organization_id || null,
      counterparty_id: contractForm.counterparty_id || null,
      status: contractForm.id ? contractForm.status : 'active',
      content: contractForm.content,
      city: contractForm.city,
      product_name: contractForm.product_name || null,
      spec_items: contractForm.spec_items?.length ? contractForm.spec_items : null,
      qqs_enabled: contractForm.qqs_enabled || false,
      qqs_rate: contractForm.qqs_rate || 12,
      user_id: session!.user.id
    })
    if (error) {
      alert(`${T(t.msg.errorPrefix)}: ${error.message}`)
      setSaving(false)
      return
    }
    if (subscription) {
      await supabase.from('subscriptions').update({ contracts_used: subscription.contracts_used + 1 }).eq('id', subscription.id)
    }
    setModal(null); setContractForm(emptyContract); setSaving(false)
    loadContracts(); if (activeOrg) loadSubscription(activeOrg.id)
  }

  async function saveBankAccount(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (bankForm.mfo && !/^\d{5}$/.test(bankForm.mfo)) { alert(T(t.msg.mfoInvalid)); setSaving(false); return }
    if (bankForm.account_number && !/^\d{20}$/.test(bankForm.account_number)) { alert(T(t.msg.accountInvalid)); setSaving(false); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (bankForm.is_default && activeOrg) {
      await supabase.from('bank_accounts').update({ is_default: false }).eq('organization_id', activeOrg.id)
    }
    const { error } = await supabase.from('bank_accounts').insert({ ...bankForm, organization_id: activeOrg!.id, user_id: session!.user.id })
    setSaving(false)
    if (error) { alert(`${T(t.msg.errorPrefix)}: ${error.message}`); return }
    setModal(null); setBankForm(emptyBank); loadBankAccounts(activeOrg!.id)
  }

  async function copyContract(c: Contract) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!canCreateContract()) { setModal('upgrade'); return }
    const newNum = c.contract_number + '-NUSXA'
    await supabase.from('contracts').insert({
      contract_number: newNum, contract_date: new Date().toISOString().split('T')[0],
      contract_type: c.contract_type, amount: c.amount, status: 'draft',
      organization_id: c.organization_id, counterparty_id: c.counterparty_id,
      user_id: session!.user.id
    })
    loadContracts()
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('contracts').update({ status }).eq('id', id)
    if (error) { console.error('updateStatus:', error.message); return }
    loadContracts()
  }

  async function deleteContract(id: string) {
    if (!confirm(T(t.contracts.deleteConfirm))) return
    const { error } = await supabase.from('contracts').delete().eq('id', id)
    if (error) { alert(`${T(t.msg.errorPrefix)}: ${error.message}`); return }
    loadContracts()
  }

  async function deleteBankAccount(id: string) {
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
    if (error) { alert(`${T(t.msg.errorPrefix)}: ${error.message}`); return }
    if (activeOrg) loadBankAccounts(activeOrg.id)
  }

  async function uploadAvatar(file: File) {
    setAvatarUploading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const ext = file.name.split('.').pop()
    const path = `avatars/${session!.user.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('org-assets').upload(path, file, { upsert: true })
    if (upErr) { alert(`${T(t.msg.uploadError)}: ${upErr.message}`); setAvatarUploading(false); return }
    const { data } = supabase.storage.from('org-assets').getPublicUrl(path)
    const updated = { ...profile, avatar_url: data.publicUrl }
    setProfile(updated)
    await supabase.from('profiles').upsert({ id: session!.user.id, ...updated, updated_at: new Date().toISOString() })
    setAvatarUploading(false)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setProfileSaving(true); setProfileMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    await supabase.from('profiles').upsert({ id: session!.user.id, ...profile, updated_at: new Date().toISOString() })
    setProfileMsg(T(t.msg.profileSaved)); setProfileSaving(false)
    setTimeout(() => setProfileMsg(''), 3000)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setPwdMsg('')
    if (newPassword.length < 8) { setPwdMsg(T(t.msg.pwdShort)); return }
    if (newPassword !== confirmPassword) { setPwdMsg(T(t.msg.pwdMismatch)); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwdMsg(`${T(t.msg.errorPrefix)}: ${error.message}`)
    else { setPwdMsg(T(t.msg.pwdChanged)); setNewPassword(''); setConfirmPassword('') }
    setTimeout(() => setPwdMsg(''), 4000)
  }

  async function uploadImage(file: File, field: 'stamp_url' | 'signature_url') {
    if (!activeOrg) return
    const ext = file.name.split('.').pop()
    const path = `${userId}/${activeOrg.id}/${field}.${ext}`
    const { error: upErr } = await supabase.storage.from('org-assets').upload(path, file, { upsert: true })
    if (upErr) { alert(`${T(t.msg.uploadError)}: ${upErr.message}`); return }
    const { data } = supabase.storage.from('org-assets').getPublicUrl(path)
    await supabase.from('organizations').update({ [field]: data.publicUrl }).eq('id', activeOrg.id)
    loadOrgs()
  }

  async function runAiAnalysis(c: Contract, type: 'tahlil' | 'grammatika') {
    const content = c.content || ''
    if (!content.trim()) { setAiError("Shartnoma matni bo'sh — tahlil qilib bo'lmaydi"); return }
    setAiLoading(true); setAiError(''); setAiResult(null)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type === 'tahlil' ? 'analysis' : 'grammar',
          content,
          lang,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setAiError(data.error || 'Xatolik'); return }
      setAiResult(data.result)
    } catch {
      setAiError("Serverga ulanishda xatolik")
    } finally {
      setAiLoading(false)
    }
  }

  async function runHubFeature() {
    const usedToday = getAiUsedToday()
    if (isFree && usedToday >= AI_FREE_DAILY) {
      setHubError(`Kunlik bepul limit (${AI_FREE_DAILY} ta) tugadi. Standart yoki AI Pro tarifiga o'ting.`)
      return
    }
    const selectedContract = contracts.find(c => c.id === hubContract)
    const content = selectedContract?.content || ''
    const needsContract = ['tahlil','grammatika','xulosa','tarjima','qa'].includes(hubFeature)
    if (needsContract && !content.trim()) {
      setHubError("Shartnomani tanlang yoki uning matni bo'sh. Avval shartnoma yaratib, matn kiriting.")
      return
    }
    if (hubFeature === 'qa' && !hubQuestion.trim()) {
      setHubError("Iltimos, savolingizni kiriting.")
      return
    }
    if (hubFeature === 'clause' && !hubInstruction.trim()) {
      setHubError("Iltimos, band uchun ko'rsatma kiriting.")
      return
    }
    if (hubFeature === 'recommend' && !hubDescription.trim()) {
      setHubError("Iltimos, vaziyatni ta'riflang.")
      return
    }
    setHubLoading(true); setHubError(''); setHubResult(null)
    try {
      const typeMap: Record<HubFeature, string> = {
        tahlil: 'analysis', grammatika: 'grammar', xulosa: 'summary',
        tarjima: 'translate', qa: 'qa', clause: 'clause', recommend: 'recommend', write: 'write',
      }
      const body: Record<string,unknown> = { type: typeMap[hubFeature], lang, content }
      if (hubFeature === 'qa')        body.question    = hubQuestion
      if (hubFeature === 'clause')    body.instruction = hubInstruction
      if (hubFeature === 'tarjima')   body.target_lang = hubTargetLang
      if (hubFeature === 'recommend') { body.description = hubDescription; delete body.content }
      if (hubFeature === 'write')     { body.details = hubWriteDetails; delete body.content }
      const res  = await fetch('/api/ai', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok || data.error) { setHubError(data.error || 'Xatolik'); return }
      const result = data.result
      if (!result || typeof result !== 'object' || Object.keys(result).length === 0) {
        setHubError("AI bo'sh natija qaytardi. Qayta urinib ko'ring.")
        return
      }
      setHubResult(result)
      if (isFree) { incrementAiUsage(); setAiUsedToday(getAiUsedToday()) }
    } catch { setHubError('Serverga ulanishda xatolik') }
    finally  { setHubLoading(false) }
  }

  async function handleWordImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.docx')) { alert('Faqat .docx formatdagi fayllar qabul qilinadi'); return }
    setWordImporting(true)
    try {
      const { convertToHtml } = await import('mammoth')
      const arrayBuffer = await file.arrayBuffer()
      const result = await convertToHtml({ arrayBuffer })
      // HTML dan toza matn ajratib olish
      const div = document.createElement('div')
      div.innerHTML = result.value
      const text = div.innerText.trim()
      if (!text) { alert("Fayl bo'sh yoki o'qib bo'lmadi"); setWordImporting(false); return }
      // Shablon modal ni ochish, kontent bilan to'ldirish
      const baseName = file.name.replace(/\.docx$/i, '')
      setEditingCustomTemplate(null)
      setCustomTplForm({
        type: 'boshqa',
        name: baseName,
        description: `Word fayldan import: ${file.name}`,
        content: text,
      })
      setCustomTemplateModal(true)
    } catch {
      alert("Faylni o'qishda xatolik yuz berdi")
    } finally {
      setWordImporting(false)
      if (wordImportRef.current) wordImportRef.current.value = ''
    }
  }

  async function loadImageAsBase64(url: string): Promise<string | null> {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      return await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch { return null }
  }

  async function generatePDF(c: Contract) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const mL = 20, mR = 20, mT = 20, mB = 20
    const pageW = 210, pageH = 297
    const cW = pageW - mL - mR

    const orgData = orgs.find(o => o.id === c.organization_id)
    const org = c.organizations || orgData
    const cp = c.counterparties
    const [stampB64, signB64] = await Promise.all([
      orgData?.stamp_url ? loadImageAsBase64(orgData.stamp_url) : Promise.resolve(null),
      orgData?.signature_url ? loadImageAsBase64(orgData.signature_url) : Promise.resolve(null),
    ])

    const MONTHS = lang === 'ru'
      ? ['yanvarya','fevralya','marta','aprelya','maya','iyunya','iyulya','avgusta','sentyabrya','oktyabrya','noyabrya','dekabrya']
      : lang === 'oz'
      ? ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
      : ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
    // jsPDF built-in fontlar faqat Latin-1 — Kirill → Lotin transliteratsiya
    const CYRL: Record<string,string> = {
      'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh','З':'Z','И':'I','Й':'Y',
      'К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F',
      'Х':'Kh','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Shch','Ъ':'"','Ы':'Y','Ь':"'",'Э':'E','Ю':'Yu','Я':'Ya',
      'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y',
      'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
      'х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'"','ы':'y','ь':"'",'э':'e','ю':'yu','я':'ya',
    }
    const safe = (s: string): string => (s || '')
      .replace(/[ʻʼ\u02BC\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D\u00AB\u00BB]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/O\u2018/g, "O'").replace(/G\u2018/g, "G'")
      .replace(/o\u2018/g, "o'").replace(/g\u2018/g, "g'")
      .replace(/[\u0400-\u04FF]/g, ch => CYRL[ch] || ch)

    // ── Justify (ikki tomonga tekislash) ─────────────────────────
    // jsPDF built-in justify yo'q — har bir so'zni alohida chizamiz
    const justifyLine = (line: string, x: number, yPos: number, maxW: number, isLast: boolean): void => {
      const words = line.split(' ').filter(w => w.length > 0)
      if (words.length <= 1 || isLast) { doc.text(line, x, yPos); return }
      const totalW = doc.getTextWidth(line)
      const spaceW = doc.getTextWidth(' ')
      const extra  = (maxW - totalW) / (words.length - 1) - spaceW
      if (extra > 5) { doc.text(line, x, yPos); return } // juda katta gap → chap
      let cx = x
      for (let i = 0; i < words.length; i++) {
        doc.text(words[i], cx, yPos)
        if (i < words.length - 1) cx += doc.getTextWidth(words[i]) + spaceW + extra
      }
    }
    // Paragraph matnini justify bilan chizish, y ni o'z ichida oshiradi
    const drawJustified = (text: string, x: number, maxW: number, lineH: number): void => {
      const lines = doc.splitTextToSize(text, maxW) as string[]
      for (let i = 0; i < lines.length; i++) {
        if (y > pageH - mB - 12) { doc.addPage(); y = mT }
        justifyLine(lines[i], x, y, maxW, i === lines.length - 1)
        y += lineH
      }
    }

    const fmtDate = (d: string) => {
      if (!d) return '___'
      const [yy,mm,dd] = d.split('-')
      if (!yy || !mm || !dd) return d
      const ySuffix = lang === 'ru' ? 'g.' : 'yil'
      return `${parseInt(dd)} ${MONTHS[parseInt(mm)-1]} ${yy} ${ySuffix}`
    }
    const ctName = safe(CONTRACT_TYPES_I18N[c.contract_type]?.[lang] || c.contract_type)

    // Shartnoma turiga qarab rol nomlari (til bo'yicha)
    const ROLES: Record<string, [string, string]> = {
      oldi_sotdi: [t.doc.sotuvchi[lang],      t.doc.xaridor[lang]],
      xizmat:     [t.doc.ijrochi[lang],       t.doc.buyurtmachi[lang]],
      ijara:      [t.doc.ijaraberuvchi[lang], t.doc.ijaraoluvchi[lang]],
      pudrat:     [t.doc.pudratchi[lang],     t.doc.buyurtmachi[lang]],
      qarz:       [t.doc.qarzberuvchi[lang],  t.doc.qarzoluvchi[lang]],
      xalqaro:    [t.doc.sotuvchi[lang],      t.doc.xaridor[lang]],
    }
    const [rol1, rol2] = ROLES[c.contract_type] || [
      lang === 'ru' ? 'ПЕРВАЯ СТОРОНА' : lang === 'oz' ? 'БИРИНЧИ ТОМОН' : 'BIRINCHI TOMON',
      lang === 'ru' ? 'ВТОРАЯ СТОРОНА' : lang === 'oz' ? 'ИККИНЧИ ТОМОН' : 'IKKINCHI TOMON',
    ]

    const addPageNums = () => {
      const n = doc.getNumberOfPages()
      for (let p = 1; p <= n; p++) {
        doc.setPage(p)
        // Bepul tarif: diagonal watermark
        if (isFree) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(42)
          doc.setTextColor(210, 210, 228)
          doc.text('Shartnoma.uz', pageW / 2, pageH / 2, { align: 'center', angle: 45 })
          doc.setFont('times', 'normal')
        }
        // Footer
        doc.setFontSize(8); doc.setTextColor(170,170,170)
        doc.text(safe(t.doc.footer[lang]), pageW/2, pageH-6, {align:'center'})
        doc.text(`${p} / ${n}`, pageW-mR, pageH-6, {align:'right'})
      }
    }

    // Spec table (inline)
    const drawSpecTable = (startY: number): number => {
      const items = c.spec_items || []
      if (!items.length) return startY
      const SF = 'times'
      let y = startY + 6
      doc.setFont(SF,'bold'); doc.setFontSize(12); doc.setTextColor(0,0,0)
      doc.text(safe(t.doc.specTitle[lang]), pageW/2, y, {align:'center'}); y += 8
      // Ustun kengliklari — Jami kengaytirildi, narx qisqartirildi
      const cols = [7, 54, 15, 13, 22, 12, 22, 25]
      const hdrs = ['№', safe(t.doc.productService[lang]), safe(t.spec.unit[lang]), safe(t.spec.qty[lang]), safe(t.spec.price[lang]), safe(t.doc.qqsCol[lang]), safe(t.doc.qqsSum[lang]), safe(t.spec.total[lang])]
      const anyQqs = items.some((it: SpecItem) => it.qqs_foiz && it.qqs_foiz !== 'siz')
      doc.setFillColor(230,233,240); doc.rect(mL,y-4,cW,7,'F')
      doc.setDrawColor(160,160,160); doc.rect(mL,y-4,cW,7,'S')
      doc.setFont(SF,'bold'); doc.setFontSize(8); doc.setTextColor(30,30,30)
      let cx = mL+1; hdrs.forEach((h,i)=>{ doc.text(h,cx,y); cx+=cols[i] }); y+=5
      doc.setFont(SF,'normal'); doc.setFontSize(9); doc.setTextColor(0,0,0)
      items.forEach((item: SpecItem, idx: number) => {
        if (y > pageH-mB-10) { doc.addPage(); y = mT+10 }
        doc.setDrawColor(200,200,200); doc.line(mL,y+2,mL+cW,y+2); cx=mL+1
        const ql = item.qqs_foiz==='siz'? safe(t.doc.qqssiz[lang]) :(item.qqs_foiz?item.qqs_foiz+'%':'—')
        const row=[String(idx+1),item.nomi,item.birlik,String(item.miqdori),
                   item.narxi.toLocaleString(),ql,
                   item.qqs_summa>0?item.qqs_summa.toLocaleString():'—',
                   item.summa.toLocaleString()]
        row.forEach((cell,i)=>{ doc.text(doc.splitTextToSize(safe(cell),cols[i]-1)[0] as string,cx,y); cx+=cols[i] }); y+=6
      })
      const asosiy = items.reduce((s:number,it:SpecItem)=>s+it.miqdori*it.narxi,0)
      const qqsJ   = items.reduce((s:number,it:SpecItem)=>s+(it.qqs_summa||0),0)
      const grand  = asosiy+qqsJ
      doc.setFont(SF,'bold'); doc.setFillColor(245,246,250)
      if (anyQqs) {
        doc.rect(mL,y-2,cW,20,'F')
        doc.setFont(SF,'normal'); doc.setFontSize(10); doc.setTextColor(60,60,60)
        doc.text(`${safe(t.doc.soliqsizJami[lang])} ${asosiy.toLocaleString()} ${t.doc.som[lang]}`,mL+cW-2,y+2,{align:'right'})
        doc.text(`${safe(t.doc.qqsJami[lang])} ${qqsJ.toLocaleString()} ${t.doc.som[lang]}`,mL+cW-2,y+7,{align:'right'})
        doc.setFont(SF,'bold'); doc.setTextColor(0,0,0)
        doc.text(`${safe(t.doc.qqsBilan[lang])} ${grand.toLocaleString()} ${t.doc.som[lang]}`,mL+cW-2,y+13,{align:'right'}); y+=20
      } else {
        doc.rect(mL,y-2,cW,8,'F')
        doc.setFont(SF,'bold'); doc.setFontSize(10); doc.setTextColor(0,0,0)
        doc.text(`${safe(t.doc.jami[lang])} ${grand.toLocaleString()} ${t.doc.som[lang]}`,mL+cW-2,y+3,{align:'right'}); y+=10
      }
      // So'z bilan
      doc.setFont(SF,'italic'); doc.setFontSize(10); doc.setTextColor(50,50,50)
      const grandWords = safe(numberToWords(grand, lang))
      const gwLines = doc.splitTextToSize(`${safe(t.doc.sozBilan[lang])} ${grandWords}`, cW) as string[]
      gwLines.forEach((l:string, i:number) => { justifyLine(l, mL, y, cW, i === gwLines.length-1); y += 5 })
      return y + 3
    }

    // ══════════════════════════════════════════════════════
    // ── XALQARO: ikki ustunli ikki tilli PDF ──
    // ══════════════════════════════════════════════════════
    if (c.contract_type === 'xalqaro') {
      const gap  = 5
      const hW   = (cW - gap) / 2
      const xL   = mL
      const xR   = mL + hW + gap
      const lH   = 4.5
      let   y    = mT

      const drawDivider = () => {
        doc.setDrawColor(200,200,200)
        doc.line(mL + hW + gap/2, mT - 2, mL + hW + gap/2, pageH - mB)
      }
      drawDivider()

      const biRow = (uzTxt: string, enTxt: string, bold = false, size = 8.5, after = 2): void => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(0,0,0)
        const uzW = doc.splitTextToSize(safe(uzTxt), hW - 2) as string[]
        const enW = doc.splitTextToSize(enTxt,       hW - 2) as string[]
        const need = Math.max(uzW.length, enW.length) * lH + after
        if (y + need > pageH - mB - 8) { doc.addPage(); y = mT; drawDivider() }
        uzW.forEach((l, i) => doc.text(l, xL, y + i * lH))
        enW.forEach((l, i) => doc.text(l, xR, y + i * lH))
        y += Math.max(uzW.length, enW.length) * lH + after
      }
      const biTitle = (uz: string, en: string) => biRow(uz, en, true, 9, 5)

      const orgN = safe(org?.name || '___'), cpN  = safe(cp?.name  || '___')
      const orgD = safe(org?.director_name || '___'), cpD  = safe(cp?.director_name  || '___')
      const orgI = safe(org?.inn || '___'), cpI  = safe(cp?.inn  || '___')
      const sumN = (c.amount||0).toLocaleString()
      const sumW = safe(numberToWords(c.amount||0, lang))
      const city = safe(c.city || 'Toshkent')

      // ── Sarlavha ──
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(0,0,0)
      const cNum = c.contract_number || '___'
      doc.text(safe(`XALQARO SAVDO SHARTNOMASI No ${cNum}`), xL+hW/2, y, {align:'center'})
      doc.text(`INTERNATIONAL TRADE CONTRACT No ${cNum}`,    xR+hW/2, y, {align:'center'})
      y += 7
      doc.setFont('helvetica','normal'); doc.setFontSize(9)
      doc.text(`${city} shahri`, xL, y); doc.text(safe(fmtDate(c.contract_date)), xL+hW, y, {align:'right'})
      doc.text(`${city} city`,   xR, y); doc.text(safe(fmtDate(c.contract_date)), xR+hW, y, {align:'right'})
      y += 9

      // ── Tomonlar taqdimoti ──
      biRow(
        `"${orgN}", keyingi o'rinlarda "Sotuvchi" deb yuritiladi, ${orgD} nomidan, bir tomondan, va "${cpN}", keyingi o'rinlarda "Xaridor" deb yuritiladi, ${cpD} nomidan, ikkinchi tomondan, quyidagilarni kelishib oldilar:`,
        `"${orgN}", hereinafter referred to as the "Seller", represented by ${orgD}, on the one hand, and "${cpN}", hereinafter referred to as the "Buyer", represented by ${cpD}, on the other hand, have agreed as follows:`,
        false, 8.5, 7)

      // ── 1. Shartnoma predmeti ──
      biTitle("1. SHARTNOMA PREDMETI", "1. SUBJECT OF THE CONTRACT")
      biRow("1.1. Sotuvchi Xaridorga tovarlarni sotish va yetkazib berish, Xaridor esa ushbu tovarlarni qabul qilib to'lash majburiyatini oladi.", "1.1. The Seller agrees to sell and deliver, and the Buyer agrees to accept and pay for the goods in accordance with the terms of this Contract.")
      biRow("1.2. Tovarlar tavsifi, miqdori va narxi ushbu shartnomaga ilova qilinadigan Spesifikatsiyada (1-ilova) belgilanadi.", "1.2. Goods description, quantity and price are specified in Annex No.1 (Specification), which is an integral part of this Contract.")
      biRow("1.3. Tovarlar sifati kelishilgan xalqaro standartlar va texnik shartlarga mos bo'lishi kerak.", "1.3. The goods shall comply with the agreed international quality standards and technical specifications.", false, 8.5, 6)

      // ── 2. Summa ──
      biTitle("2. SHARTNOMA SUMMASI", "2. CONTRACT VALUE")
      biRow(`2.1. Shartnoma bo'yicha tovarlarning umumiy qiymati ${sumN} (${sumW}) so'mni tashkil etadi.`, `2.1. The total value of this Contract is ${sumN} (${sumW}) UZS.`)
      biRow("2.2. Narxlar tomonlarning yozma kelishuvigacha o'zgartirilmaydi.", "2.2. Unit prices are fixed and shall not be amended without mutual written consent.")
      biRow("2.3. Sotuvchi mamlakatidagi bank xarajatlarini Sotuvchi, Xaridor mamlakatidagi xarajatlarni Xaridor to'laydi.", "2.3. Bank charges in the Seller's country are borne by the Seller; charges in the Buyer's country by the Buyer.", false, 8.5, 6)

      // ── 3. Yetkazib berish ──
      biTitle("3. YETKAZIB BERISH SHARTLARI", "3. DELIVERY TERMS")
      biRow("3.1. Yetkazib berish shartlari: _____________ (Incoterms 2020).", "3.1. Delivery terms: _____________ (Incoterms 2020).")
      biRow("3.2. Yetkazib berish joyi: _______________________", "3.2. Place of delivery: _______________________")
      biRow("3.3. Yetkazib berish muddati: shartnoma imzolanganidan / avans to'lovidan keyin _______ kun ichida.", "3.3. Delivery period: within _______ days from signing / receipt of advance payment.")
      biRow("3.4. Qisman yetkazib berish: [ ] Ruxsat etiladi  [ ] Ruxsat etilmaydi.", "3.4. Partial shipments: [ ] Allowed  [ ] Not allowed.", false, 8.5, 6)

      // ── 4. To'lov ──
      biTitle("4. TO'LOV SHARTLARI", "4. PAYMENT TERMS")
      biRow("4.1. To'lov usuli: [ ] Bank o'tkazma (T/T)  [ ] Akkreditiv (L/C)  [ ] Ochiq hisob.", "4.1. Payment method: [ ] Bank Transfer (T/T)  [ ] Letter of Credit (L/C)  [ ] Open Account.")
      biRow("4.2. To'lov valyutasi: USD / EUR / UZS (tomonlar kelishuviga ko'ra).", "4.2. Payment currency: USD / EUR / UZS (as agreed by the parties).")
      biRow("4.3. To'lov jadvali: shartnoma imzolanganida ___% avans _____ bank ish kuni ichida; qolgan qism yetkazib berish hujjatlari taqdim etilganidan keyin _____ bank ish kuni ichida.", "4.3. Payment schedule: ___% advance within _____ banking days from signing; balance within _____ banking days after shipping documents received.", false, 8.5, 6)

      // ── 5. Hujjatlar ──
      biTitle("5. YETKAZIB BERISH HUJJATLARI", "5. SHIPPING DOCUMENTS")
      biRow("5.1. Sotuvchi quyidagi hujjatlarni taqdim etadi: tijorat fakturasi; qadoqlash ro'yxati; konosament / CMR / havo yuk xati; kelib chiqish sertifikati; sifat sertifikati; boshqa kelishilgan hujjatlar.", "5.1. Seller shall provide: Commercial Invoice; Packing List; Bill of Lading / CMR / Airway Bill; Certificate of Origin; Quality Certificate; other documents as agreed.", false, 8.5, 6)

      // ── 6. Sifat ──
      biTitle("6. SIFAT VA TEKSHIRUV", "6. QUALITY AND INSPECTION")
      biRow("6.1. Tovarlar kelishilgan spesifikatsiya va sertifikatlarga mos bo'lishi kerak.", "6.1. The goods shall comply with the agreed specifications and certificates.")
      biRow("6.2. Yuklash portida tekshiruv: Sotuvchi hisobidan (tekshiruv sertifikati taqdim etiladi).", "6.2. Inspection at loading port: Seller's responsibility (inspection certificate to be provided).")
      biRow("6.3. Sifat va miqdor bo'yicha da'volar: yetkazib berilganidan keyin 30 kun ichida.", "6.3. Claims for quality and quantity: within 30 days after delivery.", false, 8.5, 6)

      // ── 7. Fors-major ──
      biTitle("7. FORS-MAJOR", "7. FORCE MAJEURE")
      biRow("7.1. Tabiiy ofat, urush, sanktsiyalar, hukumat taqiqlari, pandemiyadek fors-major holatlarda tomonlar javobgar emas.", "7.1. Neither party shall be liable for failure to perform due to force majeure (natural disasters, war, sanctions, government prohibitions, pandemic, etc.).")
      biRow("7.2. Ta'sirlangan tomon 7 kun ichida yozma xabar berishi va vakolatli organ sertifikatini taqdim etishi shart.", "7.2. The affected party must notify the other in writing within 7 days and provide a certificate from the competent authority.")
      biRow("7.3. Fors-major 60 kundan ko'proq davom etsa, tomonlardan biri jarimasisiz shartnomani bekor qilishi mumkin.", "7.3. If force majeure continues for more than 60 days, either party may terminate without penalty.", false, 8.5, 6)

      // ── 8. Nizolar ──
      biTitle("8. NIZOLARNI HAL ETISH", "8. DISPUTE RESOLUTION")
      biRow("8.1. Barcha nizolar avval 30 kun ichida muzokaralar orqali hal etiladi.", "8.1. All disputes shall first be resolved through negotiations within 30 days.")
      biRow("8.2. Hal bo'lmasa: [ ] ICC arbitraji (Parij)  [ ] UNCITRAL arbitraji  [ ] O'zbekiston Respublikasi Iqtisodiy sudi.", "8.2. If unresolved: [ ] ICC Arbitration (Paris)  [ ] UNCITRAL Arbitration  [ ] Courts of Uzbekistan.")
      biRow("8.3. Tatbiq etiladigan qonunchilik: O'zbekiston Respublikasi qonunchiligi / CISG (BMT Konventsiyasi).", "8.3. Governing law: Law of the Republic of Uzbekistan / CISG (UN Convention on Contracts for International Sale of Goods).", false, 8.5, 6)

      // ── 9. Muddati ──
      biTitle("9. AMAL QILISH MUDDATI", "9. VALIDITY")
      biRow("9.1. Shartnoma imzolangan kundan kuchga kiradi va majburiyatlar to'liq bajarilgunga qadar amal qiladi.", "9.1. This Contract enters into force upon signing and remains valid until obligations are fully performed.")
      biRow("9.2. Tomonlardan biri shartnomani 30 kun oldin yozma ogohlantirish bilan bekor qilishi mumkin.", "9.2. Either party may terminate by giving 30 days written notice.", false, 8.5, 8)

      // ── Spesifikatsiya ──
      if ((c.spec_items||[]).length > 0) {
        doc.addPage(); y = mT; drawDivider()
        y = drawSpecTable(y)
      }

      // ── Rekvizitlar ──
      if (y > pageH - mB - 70) { doc.addPage(); y = mT; drawDivider() }
      y += 4
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(0,0,0)
      doc.text("10. TOMONLARNING REKVIZITLARI / PARTIES' DETAILS", pageW/2, y, {align:'center'})
      y += 7
      const rW = cW / 2
      const rRows: {label:string; left:string; right:string; bold?:boolean}[] = [
        { label:'Nomi / Name:',        left: orgN, right: cpN, bold: true },
        { label:'INN / TIN:',          left: orgI, right: cpI },
        { label:'Rahbar / Director:',  left: orgD, right: cpD, bold: true },
        { label:'Manzil / Address:',   left: safe(org?.address||'-'),      right: safe(cp?.address||'-') },
        { label:'Bank:',               left: safe(org?.bank_name||'-'),    right: safe(cp?.bank_name||'-') },
        { label:'H/r / Account:',      left: safe(org?.bank_account||'-'), right: safe(cp?.bank_account||'-') },
        { label:'MFO:',                left: safe(org?.mfo||'-'),          right: safe(cp?.mfo||'-') },
      ]
      doc.setFillColor(235,238,245); doc.setDrawColor(170,170,170)
      doc.rect(mL,y,rW,7,'FD'); doc.rect(mL+rW,y,rW,7,'FD'); doc.line(mL+rW,y,mL+rW,y+7)
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5)
      doc.text('SOTUVCHI / SELLER', mL+rW/2,    y+4.5, {align:'center'})
      doc.text('XARIDOR / BUYER',   mL+rW+rW/2, y+4.5, {align:'center'})
      y += 7
      for (const row of rRows) {
        const rH = 8
        doc.setDrawColor(190,190,190); doc.rect(mL,y,rW,rH); doc.rect(mL+rW,y,rW,rH)
        doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(130,130,130)
        doc.text(row.label, mL+2, y+3); doc.text(row.label, mL+rW+2, y+3)
        doc.setFontSize(row.bold ? 8.5 : 8); doc.setFont('helvetica', row.bold ? 'bold' : 'normal'); doc.setTextColor(0,0,0)
        doc.text(doc.splitTextToSize(row.left,  rW-18)[0] as string, mL+18,    y+6.5)
        doc.text(doc.splitTextToSize(row.right, rW-18)[0] as string, mL+rW+18, y+6.5)
        y += rH
      }
      y += 6
      if (y > pageH - mB - 30) { doc.addPage(); y = mT; drawDivider() }
      const sigW2 = rW - 10
      doc.setDrawColor(80,80,80)
      doc.line(mL, y, mL+sigW2, y); doc.line(mL+rW+5, y, mL+rW+5+sigW2, y)
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(60,60,60)
      doc.text(`/ ${orgD}`, mL+sigW2+1,        y)
      doc.text(`/ ${cpD}`,  mL+rW+5+sigW2+1,  y)
      y += 5; doc.setTextColor(120,120,120)
      doc.text('M.O. / SEAL', mL+10, y); doc.text('M.O. / SEAL', mL+rW+15, y)
      try {
        if (signB64) doc.addImage(signB64,'PNG', mL,   y-15, 30, 15)
        if (stampB64) doc.addImage(stampB64,'PNG', mL+5, y-10, 25, 25)
      } catch { /* rasm yuklanmadi */ }

      addPageNums()
      doc.save(`shartnoma-${(c.contract_number||'draft').replace(/\//g,'-')}.pdf`)
      return
    }
    // ══════════════════════════════════════════════════════

    // ── 1. SARLAVHA ──
    let y = mT
    const F = 'times'
    doc.setFont(F,'bold'); doc.setFontSize(14); doc.setTextColor(0,0,0)
    doc.text(safe(`${ctName.toUpperCase()}`), pageW/2, y, {align:'center'}); y += 7
    doc.setFont(F,'bold'); doc.setFontSize(13)
    doc.text(safe(`No ${c.contract_number || '___'}`), pageW/2, y, {align:'center'}); y += 10

    // ── 2. SHAHAR + SANA ──
    doc.setFont(F,'normal'); doc.setFontSize(12)
    doc.text(safe(`${c.city || 'Toshkent'} ${t.doc.shahri[lang]}`), mL, y)
    doc.text(safe(fmtDate(c.contract_date)), mL + cW, y, {align:'right'})
    y += 3
    doc.setDrawColor(180,180,180); doc.line(mL, y, mL + cW, y); y += 6

    // ── 3. TOMONLAR KIRISH MATNI ──
    const orgName = safe(org?.name || '___')
    const cpName  = safe(cp?.name  || '___')
    const orgDir  = safe(org?.director_name || '___')
    const cpDir   = safe(cp?.director_name  || '___')
    const introFn = (t.doc.intro as Record<string, Record<string, (o:string,od:string,c:string,cd:string)=>string>>)[c.contract_type]?.[lang]
    const intro = safe(introFn ? introFn(orgName, orgDir, cpName, cpDir)
      : `"${orgName}", keyingi o'rinlarda "${rol1}" sifatida, Direktor ${orgDir} vakilligi asosida bir tomondan va "${cpName}", keyingi o'rinlarda "${rol2}" sifatida, Direktor ${cpDir} vakilligi asosida ikkinchi tomondan ushbu shartnomani tuzdilar:`)
    doc.setFont(F,'italic'); doc.setFontSize(11); doc.setTextColor(30,30,30)
    drawJustified(intro, mL, cW, 5.5)
    y += 5

    // ── 4. ASOSIY MATN ──
    const content = c.content || ''
    if (content) {
      const allLines = content.split('\n')
      const firstNumIdx = allLines.findIndex(l => /^1\.\s/.test(l.trim()))
      const rekvIdx = allLines.findIndex(l => /TOMONLARNING REKVIZIT|^BUYURTMACHI:|^IJROCHI:/.test(l.trim()))
      const start = firstNumIdx >= 0 ? firstNumIdx : 0
      const end   = rekvIdx    >= 0 ? rekvIdx    : allLines.length
      const bodyLines = allLines.slice(start, end)

      for (const rawLine of bodyLines) {
        const trimmed = safe(rawLine.trim())
        if (!trimmed) { y += 2; continue }
        const isSectionHead = /^[1-9]\d*\.\s+[A-Z']/.test(trimmed) && !/^\d+\.\d+/.test(trimmed)
        if (y > pageH-mB-12) { doc.addPage(); y = mT }
        if (isSectionHead) {
          y += 3
          doc.setFont(F,'bold'); doc.setFontSize(12); doc.setTextColor(0,0,0)
          doc.text(trimmed, pageW/2, y, {align:'center'})
          y += 7
        } else {
          const isSubItem = /^\d+\.\d+/.test(trimmed)
          const isDash = trimmed.startsWith('-') || trimmed.startsWith('—')
          const indent = isSubItem ? mL+6 : isDash ? mL+8 : mL
          const ww = cW - (isSubItem||isDash ? 8 : 0)
          doc.setFont(F,'normal'); doc.setFontSize(12); doc.setTextColor(0,0,0)
          drawJustified(trimmed, indent, ww, 5.5)
          y += 0.5
        }
      }
    }

    // ── 5. REKVIZITLAR — sig'masa yangi sahifa ──
    const rekvH = 20 + 8 + 7*9 + 30  // title+rule + header + 7 rows + signature
    if (y + rekvH > pageH - mB) { doc.addPage(); y = mT } else { y += 8 }
    const colW = cW / 2
    doc.setFont(F,'bold'); doc.setFontSize(13); doc.setTextColor(0,0,0)
    doc.text(safe(t.doc.rekvTitle[lang]), pageW/2, y, {align:'center'})
    y += 3; doc.setDrawColor(0,0,0); doc.line(mL, y, pageW-mR, y); y += 8

    const rekvizitlar = [
      { label: safe(t.doc.nomi[lang]),   left: orgName,                      right: cpName,                      bold: true  },
      { label: safe(t.doc.manzil[lang]), left: safe(org?.address||'-'),      right: safe(cp?.address||'-'),      bold: false },
      { label: safe(t.doc.hr[lang]),     left: safe(org?.bank_account||'-'), right: safe(cp?.bank_account||'-'), bold: false },
      { label: safe(t.doc.bank[lang]),   left: safe(org?.bank_name||'-'),    right: safe(cp?.bank_name||'-'),    bold: false },
      { label: safe(t.doc.mfo[lang]),    left: safe(org?.mfo||'-'),          right: safe(cp?.mfo||'-'),          bold: false },
      { label: safe(t.doc.inn[lang]),    left: safe(org?.inn||'-'),          right: safe(cp?.inn||'-'),          bold: false },
      { label: safe(t.doc.rahbar[lang]), left: orgDir,                       right: cpDir,                       bold: true  },
    ]
    // Header
    doc.setFillColor(230,233,240); doc.setDrawColor(120,120,120)
    doc.rect(mL, y, colW, 8, 'FD'); doc.rect(mL+colW, y, colW, 8, 'FD')
    doc.line(mL+colW, y, mL+colW, y+8)
    doc.setFont(F,'bold'); doc.setFontSize(11); doc.setTextColor(0,0,0)
    doc.text(rol1.toUpperCase(), mL+colW/2, y+5.5, {align:'center'})
    doc.text(rol2.toUpperCase(), mL+colW*1.5, y+5.5, {align:'center'})
    y += 8
    for (const row of rekvizitlar) {
      const cellH = 9
      doc.setDrawColor(160,160,160)
      doc.rect(mL, y, colW, cellH); doc.rect(mL+colW, y, colW, cellH)
      doc.setFont(F,'normal'); doc.setFontSize(8); doc.setTextColor(110,110,110)
      doc.text(row.label, mL+2, y+3.5); doc.text(row.label, mL+colW+2, y+3.5)
      doc.setFont(F, row.bold?'bold':'normal'); doc.setFontSize(row.bold?11:10); doc.setTextColor(0,0,0)
      const lv = doc.splitTextToSize(String(row.left),  colW-20)[0] as string
      const rv = doc.splitTextToSize(String(row.right), colW-20)[0] as string
      doc.text(lv, mL+20, y+7.5); doc.text(rv, mL+colW+20, y+7.5)
      y += cellH
    }
    // Imzo
    y += 10
    const sigW = colW - 15
    doc.setDrawColor(60,60,60)
    doc.line(mL, y, mL+sigW, y); doc.line(mL+colW+5, y, mL+colW+5+sigW, y)
    doc.setFont(F,'normal'); doc.setFontSize(10); doc.setTextColor(50,50,50)
    doc.text(`/ ${orgDir}`, mL+sigW+2, y); doc.text(`/ ${cpDir}`, mL+colW+5+sigW+2, y)
    y += 5
    doc.setFont(F,'normal'); doc.setFontSize(9); doc.setTextColor(120,120,120)
    doc.text(safe(t.doc.mo[lang]), mL+12, y); doc.text(safe(t.doc.mo[lang]), mL+colW+17, y)
    try {
      if (signB64) doc.addImage(signB64,'PNG', mL, y-15, 30, 15)
      if (stampB64) doc.addImage(stampB64,'PNG', mL+5, y-10, 25, 25)
    } catch { /* rasm yuklanmadi */ }

    // ── 6. SPESIFIKATSIYA — ALOHIDA SAHIFA ──
    if ((c.spec_items||[]).length > 0) {
      doc.addPage(); y = mT
      y = drawSpecTable(y)
    }

    addPageNums()
    doc.save(`shartnoma-${(c.contract_number||'draft').replace(/\//g,'-')}.pdf`)
  }

  async function generateDOCX(c: Contract) {
    const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
            AlignmentType, BorderStyle, Packer, convertInchesToTwip, Footer } = await import('docx')
    const { saveAs } = await import('file-saver')

    const orgData = orgs.find(o => o.id === c.organization_id)
    const org = c.organizations || orgData
    const cp  = c.counterparties

    const MONTHS = lang === 'ru'
      ? ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
      : lang === 'oz'
      ? ['январ','феврал','март','апрел','май','июн','июл','август','сентабр','октабр','ноябр','декабр']
      : ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
    const fmtDate = (d: string) => {
      if (!d) return '___'
      const [yy,mm,dd] = d.split('-')
      if (!yy || !mm || !dd) return d
      const ySuffix = lang === 'ru' ? 'g.' : 'yil'
      return `${parseInt(dd)} ${MONTHS[parseInt(mm)-1]} ${yy} ${ySuffix}`
    }
    const ctName = CONTRACT_TYPES_I18N[c.contract_type]?.[lang] || c.contract_type

    // Font o'lchamlari (half-points: 24=12pt, 26=13pt, 28=14pt)
    const SZ_TITLE = 28, SZ_BODY = 24, SZ_INTRO = 22, SZ_SMALL = 18
    const FONT = 'Times New Roman'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = []

    const p = (opts: { text?: string; bold?: boolean; italic?: boolean; size?: number; align?: string; before?: number; after?: number; indent?: number; color?: string; border?: boolean }) =>
      new Paragraph({
        alignment: (opts.align || 'left') as any,
        spacing: { before: opts.before ?? 0, after: opts.after ?? 80 },
        indent: opts.indent ? { left: opts.indent } : undefined,
        border: opts.border ? { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA' } } : undefined,
        children: opts.text !== undefined ? [new TextRun({ text: opts.text, bold: opts.bold, italics: opts.italic, font: FONT, size: opts.size ?? SZ_BODY, color: opts.color })] : [],
      })

    // ── 1. SARLAVHA ──
    children.push(p({ text: ctName.toUpperCase(), bold: true, size: SZ_TITLE, align: 'center', after: 40 }))
    children.push(p({ text: `No ${c.contract_number || '___'}`, bold: true, size: SZ_TITLE, align: 'center', after: 120 }))

    // ── 2. SHAHAR + SANA ──
    children.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA' } },
      children: [
        new TextRun({ text: `${c.city || 'Toshkent'} ${t.doc.shahri[lang]}`, font: FONT, size: SZ_BODY }),
        new TextRun({ text: '\t\t\t\t', font: FONT, size: SZ_BODY }),
        new TextRun({ text: fmtDate(c.contract_date), font: FONT, size: SZ_BODY }),
      ],
    }))

    // Shartnoma turiga qarab rol nomlari (til bo'yicha)
    const DOCX_ROLES: Record<string, [string, string]> = {
      oldi_sotdi: [t.doc.sotuvchi[lang],      t.doc.xaridor[lang]],
      xizmat:     [t.doc.ijrochi[lang],       t.doc.buyurtmachi[lang]],
      ijara:      [t.doc.ijaraberuvchi[lang], t.doc.ijaraoluvchi[lang]],
      pudrat:     [t.doc.pudratchi[lang],     t.doc.buyurtmachi[lang]],
      qarz:       [t.doc.qarzberuvchi[lang],  t.doc.qarzoluvchi[lang]],
      xalqaro:    [t.doc.sotuvchi[lang],      t.doc.xaridor[lang]],
    }
    const [dRol1, dRol2] = DOCX_ROLES[c.contract_type] || [
      lang === 'ru' ? 'ПЕРВАЯ СТОРОНА' : lang === 'oz' ? 'БИРИНЧИ ТОМОН' : 'BIRINCHI TOMON',
      lang === 'ru' ? 'ВТОРАЯ СТОРОНА' : lang === 'oz' ? 'ИККИНЧИ ТОМОН' : 'IKKINCHI TOMON',
    ]

    // ── 3. KIRISH MATNI ──
    const orgName = org?.name || '___'
    const cpName  = cp?.name  || '___'
    const orgDir  = org?.director_name || '___'
    const cpDir   = cp?.director_name  || '___'
    const introDocFn = (t.doc.intro as Record<string, Record<string, (o:string,od:string,c:string,cd:string)=>string>>)[c.contract_type]?.[lang]
    const introText = introDocFn ? introDocFn(orgName, orgDir, cpName, cpDir)
      : `"${orgName}", keyingi o'rinlarda "${dRol1}" sifatida, Direktor ${orgDir} vakilligi asosida bir tomondan va "${cpName}", keyingi o'rinlarda "${dRol2}" sifatida, Direktor ${cpDir} vakilligi asosida ikkinchi tomondan ushbu shartnomani tuzdilar:`
    children.push(p({ text: introText, italic: true, size: SZ_INTRO, align: 'both', after: 200 }))

    // ── 4. ASOSIY MATN ──
    const content = c.content || ''
    if (content) {
      const allLines = content.split('\n')
      const firstNumIdx = allLines.findIndex(l => /^1\.\s/.test(l.trim()))
      const rekvIdx = allLines.findIndex(l => /TOMONLARNING REKVIZIT|^BUYURTMACHI:|^IJROCHI:/.test(l.trim()))
      const start = firstNumIdx >= 0 ? firstNumIdx : 0
      const end   = rekvIdx    >= 0 ? rekvIdx    : allLines.length
      const bodyLines = allLines.slice(start, end)

      for (const rawLine of bodyLines) {
        const trimmed = rawLine.trim()
        if (!trimmed) continue
        const isSectionHead = /^[1-9]\d*\.\s+[A-Z'"]/.test(trimmed) && !/^\d+\.\d+/.test(trimmed)
        const isSubItem = /^\d+\.\d+/.test(trimmed)
        const isDash = trimmed.startsWith('-') || trimmed.startsWith('—')

        if (isSectionHead) {
          children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 80 },
            children: [new TextRun({ text: trimmed, bold: true, font: FONT, size: SZ_BODY })],
          }))
        } else {
          const indent = isSubItem ? convertInchesToTwip(0.25) : isDash ? convertInchesToTwip(0.35) : 0
          children.push(new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 60 },
            indent: { left: indent },
            children: [new TextRun({ text: trimmed, font: FONT, size: SZ_BODY })],
          }))
        }
      }
    }

    // ── 5. REKVIZITLAR JADVALI ──
    children.push(p({ text: t.doc.rekvTitle[lang], bold: true, align: 'center', before: 300, after: 120 }))

    const rekvRows = [
      { label: t.doc.nomi[lang],   left: orgName,                right: cpName,                bold: true  },
      { label: t.doc.manzil[lang], left: org?.address||'-',       right: cp?.address||'-',       bold: false },
      { label: t.doc.hr[lang],     left: org?.bank_account||'-',  right: cp?.bank_account||'-',  bold: false },
      { label: t.doc.bank[lang],   left: org?.bank_name||'-',     right: cp?.bank_name||'-',     bold: false },
      { label: t.doc.mfo[lang],    left: org?.mfo||'-',           right: cp?.mfo||'-',           bold: false },
      { label: t.doc.inn[lang],    left: org?.inn||'-',           right: cp?.inn||'-',           bold: false },
      { label: t.doc.rahbar[lang], left: orgDir,                  right: cpDir,                  bold: true  },
    ]

    const border = { style: BorderStyle.SINGLE, size: 4, color: '999999' }
    const cellBorders = { top: border, bottom: border, left: border, right: border }

    const headerRow = new TableRow({
      children: [
        new TableCell({ borders: cellBorders, shading: { fill: 'E6E9F0' }, width: { size: 50, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: dRol1.toUpperCase(), bold: true, font: FONT, size: SZ_BODY })] })] }),
        new TableCell({ borders: cellBorders, shading: { fill: 'E6E9F0' }, width: { size: 50, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: dRol2.toUpperCase(), bold: true, font: FONT, size: SZ_BODY })] })] }),
      ]
    })

    const dataRows = rekvRows.map(row => new TableRow({
      children: [
        new TableCell({ borders: cellBorders, width: { size: 50, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({ children: [new TextRun({ text: row.label, italics: true, color: '888888', font: FONT, size: SZ_SMALL })] }),
            new Paragraph({ children: [new TextRun({ text: String(row.left), bold: row.bold, font: FONT, size: SZ_BODY })] }),
          ] }),
        new TableCell({ borders: cellBorders, width: { size: 50, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({ children: [new TextRun({ text: row.label, italics: true, color: '888888', font: FONT, size: SZ_SMALL })] }),
            new Paragraph({ children: [new TextRun({ text: String(row.right), bold: row.bold, font: FONT, size: SZ_BODY })] }),
          ] }),
      ]
    }))

    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] }))

    // Imzo qismi
    children.push(new Paragraph({ spacing: { before: 400, after: 0 },
      children: [
        new TextRun({ text: '________________________', font: FONT, size: SZ_BODY }),
        new TextRun({ text: '                    ', font: FONT, size: SZ_BODY }),
        new TextRun({ text: '________________________', font: FONT, size: SZ_BODY }),
      ] }))
    children.push(new Paragraph({ spacing: { after: 80 },
      children: [
        new TextRun({ text: `/ ${orgDir}`, font: FONT, size: SZ_SMALL }),
        new TextRun({ text: '                              ', font: FONT, size: SZ_SMALL }),
        new TextRun({ text: `/ ${cpDir}`, font: FONT, size: SZ_SMALL }),
      ] }))
    children.push(new Paragraph({ spacing: { after: 200 },
      children: [
        new TextRun({ text: t.doc.mo[lang], color: '888888', font: FONT, size: SZ_SMALL }),
        new TextRun({ text: '                                          ', font: FONT, size: SZ_SMALL }),
        new TextRun({ text: t.doc.mo[lang], color: '888888', font: FONT, size: SZ_SMALL }),
      ] }))

    // ── 6. SPESIFIKATSIYA — yangi sahifa ──
    const specItems = c.spec_items || []
    if (specItems.length > 0) {
      children.push(new Paragraph({ pageBreakBefore: true, children: [] }))
      children.push(p({ text: t.doc.specTitle[lang], bold: true, align: 'center', after: 160 }))

      const specHdr = ['№', t.doc.productService[lang], t.spec.unit[lang], t.spec.qty[lang], t.spec.price[lang], t.doc.qqsCol[lang], t.doc.qqsSum[lang], t.spec.total[lang]]
      const specWidths = [5, 32, 9, 8, 12, 8, 13, 13]
      const specBorder = { style: BorderStyle.SINGLE, size: 3, color: 'BBBBBB' }
      const sB = { top: specBorder, bottom: specBorder, left: specBorder, right: specBorder }

      const specHeaderRow = new TableRow({
        children: specHdr.map((h, i) => new TableCell({
          borders: sB, shading: { fill: 'EEF0F7' },
          width: { size: specWidths[i], type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: h, bold: true, font: FONT, size: SZ_SMALL })] })]
        }))
      })

      const specDataRows = specItems.map((item: SpecItem, idx: number) => {
        const ql = item.qqs_foiz === 'siz' ? t.doc.qqssiz[lang] : (item.qqs_foiz ? item.qqs_foiz + '%' : '—')
        const row = [String(idx+1), item.nomi, item.birlik, String(item.miqdori),
                     item.narxi.toLocaleString(), ql,
                     item.qqs_summa > 0 ? item.qqs_summa.toLocaleString() : '—',
                     item.summa.toLocaleString()]
        return new TableRow({
          children: row.map((cell, i) => new TableCell({
            borders: sB,
            width: { size: specWidths[i], type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: i === 1 ? AlignmentType.LEFT : AlignmentType.CENTER,
              children: [new TextRun({ text: cell, font: FONT, size: SZ_SMALL })] })]
          }))
        })
      })

      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [specHeaderRow, ...specDataRows] }))

      const asosiy = specItems.reduce((s: number, it: SpecItem) => s + it.miqdori * it.narxi, 0)
      const qqsJ   = specItems.reduce((s: number, it: SpecItem) => s + (it.qqs_summa || 0), 0)
      const grand  = asosiy + qqsJ
      const anyQqs = specItems.some((it: SpecItem) => it.qqs_foiz && it.qqs_foiz !== 'siz')
      if (anyQqs) {
        children.push(p({ text: `${t.doc.soliqsizJami[lang]} ${asosiy.toLocaleString()} ${t.doc.som[lang]}`, align: 'right', after: 40 }))
        children.push(p({ text: `${t.doc.qqsJami[lang]} ${qqsJ.toLocaleString()} ${t.doc.som[lang]}`, align: 'right', after: 40 }))
        children.push(p({ text: `${t.doc.qqsBilan[lang]} ${grand.toLocaleString()} ${t.doc.som[lang]}`, bold: true, align: 'right', after: 40 }))
      } else {
        children.push(p({ text: `${t.doc.jami[lang]} ${grand.toLocaleString()} ${t.doc.som[lang]}`, bold: true, align: 'right', after: 40 }))
      }
      children.push(p({ text: `${t.doc.sozBilan[lang]} ${numberToWords(grand, lang)}`, italic: true, after: 40, align: 'both' }))
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: convertInchesToTwip(0.9), bottom: convertInchesToTwip(0.9),
                      left: convertInchesToTwip(1.18), right: convertInchesToTwip(0.79) },
          },
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: t.doc.footer[lang], color: 'AAAAAA', font: FONT, size: SZ_SMALL })],
            })],
          }),
        },
        children,
      }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `shartnoma-${(c.contract_number||'draft').replace(/\//g,'-')}.docx`)
  }

  // ── Plan check ──
  const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim())
  const isAdmin = ADMIN_EMAILS.includes(userEmail)
  const isFree = !isAdmin && (!subscription || subscription.plan === 'free')

  // ── Filters ──
  const filteredContracts = contracts.filter(c => {
    const s = search.toLowerCase()
    const matchSearch = !search || c.contract_number.toLowerCase().includes(s) ||
      c.organizations?.name.toLowerCase().includes(s) || c.counterparties?.name.toLowerCase().includes(s)
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const filteredCps = cps.filter(cp => {
    const s = cpSearch.toLowerCase()
    return !cpSearch || cp.name.toLowerCase().includes(s) || cp.inn?.toLowerCase().includes(s)
  })

  const totalActive = contracts.filter(c => c.status === 'active').reduce((s,c) => s+(c.amount||0), 0)
  const quota = getQuotaInfo()

  // ── Styles ──
  const inp = "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500"
  const lbl = "block text-xs font-medium text-gray-400 mb-1.5"

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex text-white">
      {/* Skeleton sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-4 gap-3 shrink-0">
        <div className="h-8 w-36 bg-gray-800 rounded-lg animate-pulse mb-4"/>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-800 rounded-lg animate-pulse" style={{ animationDelay: `${i * 60}ms` }}/>
        ))}
        <div className="mt-auto h-12 bg-gray-800 rounded-lg animate-pulse"/>
      </aside>

      {/* Skeleton main */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-7 w-48 bg-gray-800 rounded-lg animate-pulse"/>
          <div className="h-9 w-32 bg-gray-800 rounded-lg animate-pulse"/>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="h-4 w-24 bg-gray-800 rounded mb-3"/>
              <div className="h-7 w-16 bg-gray-700 rounded"/>
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex items-center gap-3">
            <div className="h-5 w-32 bg-gray-800 rounded animate-pulse"/>
            <div className="ml-auto h-8 w-48 bg-gray-800 rounded-lg animate-pulse"/>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-800/50 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="h-4 w-28 bg-gray-800 rounded"/>
              <div className="h-4 w-20 bg-gray-800 rounded"/>
              <div className="h-4 w-32 bg-gray-800 rounded"/>
              <div className="ml-auto h-6 w-16 bg-gray-700 rounded-full"/>
            </div>
          ))}
        </div>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex text-white">

      {/* ── SIDEBAR ── */}
      <aside className={`${sidebarOpen?'w-64':'w-16'} bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 transition-all duration-300`}>

        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-800 gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-lg shadow-blue-900/50">S</div>
          {sidebarOpen && <span className="text-lg font-bold">Shartnoma.uz</span>}
        </div>

        {/* Org Switcher */}
        {sidebarOpen && orgs.length > 0 && (
          <div className="px-3 pt-3 relative">
            <button
              onClick={() => setOrgDropdown(!orgDropdown)}
              className="w-full flex items-center gap-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg px-3 py-2.5 transition text-left"
            >
              <div className="w-7 h-7 bg-blue-900 rounded-md flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
                {activeOrg?.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{activeOrg?.name}</div>
                <div className="text-xs text-gray-500">INN: {activeOrg?.inn||'—'}</div>
              </div>
              <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${orgDropdown?'rotate-180':''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {orgDropdown && (
              <div className="absolute left-3 right-3 top-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {orgs.map(org => (
                  <button key={org.id} onClick={() => switchOrg(org)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-700 transition text-sm ${activeOrg?.id===org.id?'bg-blue-900/30 text-blue-300':'text-gray-300'}`}>
                    <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {org.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{org.name}</div>
                      <div className="text-xs text-gray-500">{org.inn}</div>
                    </div>
                    {activeOrg?.id===org.id && <span className="ml-auto text-blue-400 text-xs">●</span>}
                  </button>
                ))}
                <div className="border-t border-gray-700">
                  <button onClick={() => { setTab('organizations'); setOrgDropdown(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-700 transition text-sm text-gray-300">
                    <span>🏢</span> Tashkilotlarni boshqarish
                  </button>
                  <button onClick={() => { setModal('org'); setOrgDropdown(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-700 transition text-sm text-blue-400 border-t border-gray-700/50">
                    <span>+</span> Yangi tashkilot
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quota bar */}
        {sidebarOpen && quota && (
          <div className="px-3 pt-3">
            <div className="bg-gray-800 rounded-lg px-3 py-2.5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Tarif: <span className="text-white font-medium">{quota.plan}</span></span>
                {quota.limit && <span className="text-gray-400">{quota.used}/{quota.limit}</span>}
              </div>
              {quota.limit && (
                <>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${quota.percent! >= 100 ? 'bg-red-500' : quota.percent! >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                      style={{ width: `${quota.percent}%` }}/>
                  </div>
                  {quota.percent! >= 80 && (
                    <button onClick={() => setModal('upgrade')} className="text-xs text-yellow-400 mt-1.5 hover:text-yellow-300">
                      ⚡ Tarifni yaxshilash →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-hidden">
          {NAV_KEYS.map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                tab===item.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="flex-1 text-left font-medium">{T(t.nav[item.key as keyof typeof t.nav])}</span>}
              {sidebarOpen && item.key==='contracts' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab===item.key?'bg-blue-500':'bg-gray-700 text-gray-400'}`}>
                  {contracts.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Til tanlash */}
        {sidebarOpen && (
          <div className="px-3 pb-1 flex gap-1">
            {(['uz','oz','ru'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${lang===l ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        )}

        {/* User */}
        <div className="p-3 border-t border-gray-800 space-y-2">
          {sidebarOpen && (
            <div className="px-3 py-2 rounded-lg bg-gray-800">
              <div className="text-xs text-gray-500">{T(t.profile.account)}</div>
              <div className="text-sm text-white truncate font-medium mt-0.5">{userEmail}</div>
            </div>
          )}
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition">
            <span className="flex-shrink-0">🚪</span>
            {sidebarOpen && <span>{T(t.nav.logout)}</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-6 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <h1 className="text-base font-semibold flex-1">
            {tab==='organizations' ? T(t.orgs.title) : T(t.nav[tab as keyof typeof t.nav] || t.nav.overview)}
          </h1>
          {tab==='shablonlar' && (
            <button
              onClick={() => { setContractForm({...emptyContract, organization_id: activeOrg?.id||'', contract_number: autoContractNum()}); setModal('contract') }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              Shablon asosida shartnoma yaratish
            </button>
          )}
          {['contracts','organizations','counterparties'].includes(tab) && (
            <button
              onClick={() => {
                if (tab==='contracts') { if (!canCreateContract()) { setModal('upgrade'); return } setContractForm({...emptyContract, organization_id: activeOrg?.id||'', contract_number: autoContractNum()}); setModal('contract') }
                if (tab==='organizations') setModal('org')
                if (tab==='counterparties') setModal('cp')
              }}

              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              {T(t.btn.add)}
            </button>
          )}
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gray-950">

          {/* ─── OVERVIEW ─── */}
          {tab==='overview' && (() => {
            const cntTotal     = contracts.length
            const cntActive    = contracts.filter(c=>c.status==='active').length
            const cntDraft     = contracts.filter(c=>c.status==='draft').length
            const cntDone      = contracts.filter(c=>c.status==='completed').length
            const cntCancelled = contracts.filter(c=>c.status==='cancelled').length
            const totalDone    = contracts.filter(c=>c.status==='completed').reduce((s,c)=>s+(c.amount||0),0)
            const totalDraft   = contracts.filter(c=>c.status==='draft').reduce((s,c)=>s+(c.amount||0),0)
            const totalAll     = contracts.reduce((s,c)=>s+(c.amount||0),0)
            const today = new Date().toLocaleDateString(lang==='ru'?'ru-RU':'uz-UZ',{day:'numeric',month:'long',year:'numeric'})
            const recentContracts = [...contracts].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,5)
            return (
            <div className="space-y-5">

              {/* ── Welcome banner ── */}
              <div className="relative bg-gradient-to-r from-blue-900/60 via-blue-800/40 to-purple-900/40 border border-blue-800/50 rounded-2xl p-6 overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{backgroundImage:'radial-gradient(circle at 80% 50%, #3b82f6 0%, transparent 60%)'}}/>
                <div className="relative flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-xs text-blue-400 mb-1 font-medium tracking-wide uppercase">Shartnoma.uz — Boshqaruv paneli</div>
                    <h1 className="text-xl font-bold text-white">{activeOrg?.name || '—'}</h1>
                    <div className="text-sm text-gray-400 mt-0.5">INN: {activeOrg?.inn || '—'} · {activeOrg?.director_name || ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{today}</div>
                    {quota && (
                      <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isFree?'bg-gray-700 text-gray-300':'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'}`}>
                        {isFree ? '🔒 Bepul tarif' : '⭐ Premium tarif'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── 4 stat cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 border border-gray-800 hover:border-blue-700/60 rounded-xl p-5 transition cursor-pointer group" onClick={()=>setTab('contracts')}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-900/50 rounded-xl flex items-center justify-center text-lg">📄</div>
                    <span className="text-xs text-gray-600 group-hover:text-blue-400 transition">→</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{cntTotal}</div>
                  <div className="text-xs text-gray-400 mt-1">{T(t.overviewTab.totalContracts)}</div>
                  {cntTotal>0 && <div className="text-xs text-gray-600 mt-1">{cntDraft} qoralama · {cntDone} bajarildi</div>}
                </div>

                <div className="bg-gray-900 border border-gray-800 hover:border-emerald-700/60 rounded-xl p-5 transition cursor-pointer group" onClick={()=>{setTab('contracts');setStatusFilter('active')}}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-emerald-900/50 rounded-xl flex items-center justify-center text-lg">✅</div>
                    <span className="text-xs text-gray-600 group-hover:text-emerald-400 transition">→</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">{cntActive}</div>
                  <div className="text-xs text-gray-400 mt-1">{T(t.overview.activeContracts)}</div>
                  {cntActive>0 && <div className="text-xs text-emerald-700 mt-1">{totalActive.toLocaleString()} so'm</div>}
                </div>

                <div className="bg-gray-900 border border-gray-800 hover:border-purple-700/60 rounded-xl p-5 transition cursor-pointer group" onClick={()=>setTab('organizations')}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-900/50 rounded-xl flex items-center justify-center text-lg">🏢</div>
                    <span className="text-xs text-gray-600 group-hover:text-purple-400 transition">→</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{orgs.length}</div>
                  <div className="text-xs text-gray-400 mt-1">{T(t.orgs.title)}</div>
                  {activeOrg && <div className="text-xs text-gray-600 mt-1 truncate">Faol: {activeOrg.name}</div>}
                </div>

                <div className="bg-gray-900 border border-gray-800 hover:border-orange-700/60 rounded-xl p-5 transition cursor-pointer group" onClick={()=>setTab('counterparties')}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-900/50 rounded-xl flex items-center justify-center text-lg">🤝</div>
                    <span className="text-xs text-gray-600 group-hover:text-orange-400 transition">→</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{cps.length}</div>
                  <div className="text-xs text-gray-400 mt-1">{T(t.cp.title)}</div>
                  {specs.length>0 && <div className="text-xs text-gray-600 mt-1">{specs.length} spesifikatsiya</div>}
                </div>
              </div>

              {/* ── Moliyaviy va kvota ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Jami summa */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-medium">Moliyaviy ko'rsatkichlar</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Faol shartnomalar</span>
                      <span className="text-sm font-semibold text-emerald-400">{totalActive.toLocaleString()} so'm</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Bajarilgan</span>
                      <span className="text-sm font-semibold text-blue-400">{totalDone.toLocaleString()} so'm</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-500 inline-block"/>Qoralamalar</span>
                      <span className="text-sm font-semibold text-gray-400">{totalDraft.toLocaleString()} so'm</span>
                    </div>
                    <div className="border-t border-gray-800 pt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Jami</span>
                      <span className="text-sm font-bold text-white">{totalAll.toLocaleString()} so'm</span>
                    </div>
                  </div>
                </div>

                {/* Holat taqsimoti */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-medium">Shartnomalar holati</div>
                  {cntTotal===0 ? (
                    <div className="text-center text-gray-600 text-sm py-4">Shartnomalar yo'q</div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        {label:'Faol', cnt:cntActive, color:'bg-emerald-500', total:cntTotal},
                        {label:'Qoralama', cnt:cntDraft, color:'bg-gray-500', total:cntTotal},
                        {label:'Bajarildi', cnt:cntDone, color:'bg-blue-500', total:cntTotal},
                        {label:'Bekor', cnt:cntCancelled, color:'bg-red-500', total:cntTotal},
                      ].map(({label,cnt,color,total})=>(
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">{label}</span>
                            <span className="text-gray-500">{cnt} ta · {total>0?Math.round(cnt/total*100):0}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all`} style={{width:`${total>0?cnt/total*100:0}%`}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Kvota */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-medium">Oylik kvota</div>
                  {quota ? (
                    <div>
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-4xl font-bold text-white">{quota.used}</span>
                        <span className="text-xl text-gray-600 mb-1">/ {quota.limit ?? '∞'}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">Yaratilgan shartnomalar · {quota.plan} tarif</div>
                      {quota.limit && (
                        <>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                            <div className={`h-full rounded-full transition-all ${quota.percent!>=100?'bg-red-500':quota.percent!>=80?'bg-yellow-500':'bg-blue-500'}`}
                              style={{width:`${Math.min(quota.percent!,100)}%`}}/>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{quota.limit-quota.used} ta qoldi</span>
                            <span>{quota.percent}%</span>
                          </div>
                        </>
                      )}
                      {isFree && (
                        <button onClick={()=>setModal('upgrade')}
                          className="mt-4 w-full py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border border-yellow-700/50 text-yellow-400 hover:from-yellow-600/50 hover:to-orange-600/50 transition">
                          ⭐ Premiumga o'tish
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-600 text-sm">Ma'lumot yo'q</div>
                  )}
                </div>
              </div>

              {/* ── So'nggi shartnomalar ── */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
                  <h2 className="font-semibold text-sm">{T(t.overviewTab.recent)}</h2>
                  <button onClick={()=>setTab('contracts')} className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                    {T(t.overviewTab.viewAll)} →
                  </button>
                </div>
                {recentContracts.length===0 ? (
                  <div className="p-10 text-center">
                    <div className="text-4xl mb-3">📋</div>
                    <div className="text-gray-500 text-sm mb-4">{T(t.overviewTab.noContracts)}</div>
                    <button onClick={()=>{ if(!canCreateContract()){setModal('upgrade');return}; setContractForm({...emptyContract,organization_id:activeOrg?.id||'',contract_number:autoContractNum()}); setModal('contract') }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm text-white transition">
                      + Yangi shartnoma yaratish
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800/60">
                    {recentContracts.map(c => {
                      const st = STATUSES[c.status as keyof typeof STATUSES]
                      const typeName = CONTRACT_TYPES_I18N[c.contract_type]?.[lang] || c.contract_type
                      return (
                        <div key={c.id} onClick={()=>{setViewContract(c);setModal('viewContract')}}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-gray-800/50 transition cursor-pointer group">
                          <div className="w-10 h-10 bg-blue-900/40 border border-blue-800/40 rounded-xl flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0 group-hover:bg-blue-900/70 transition">
                            {(c.contract_number||'?').slice(0,3)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">#{c.contract_number}</span>
                              <span className="text-xs text-gray-600">·</span>
                              <span className="text-xs text-gray-500">{typeName}</span>
                            </div>
                            <div className="text-xs text-gray-500 truncate mt-0.5">{c.counterparties?.name || '—'} · {c.contract_date}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-white">{(c.amount||0).toLocaleString()} <span className="text-gray-600 text-xs">so'm</span></div>
                            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${st?.bg} ${st?.text}`}>
                              {T(t.status[c.status as keyof typeof t.status] || t.status.draft)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Tezkor harakatlar ── */}
              <div>
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-3 font-medium">Tezkor harakatlar</div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label:'Yangi shartnoma', icon:'📄', color:'blue', action:()=>{ if(!canCreateContract()){setModal('upgrade');return}; setContractForm({...emptyContract,organization_id:activeOrg?.id||'',contract_number:autoContractNum()}); setModal('contract') } },
                    { label:'Kontragent qo\'shish', icon:'🤝', color:'orange', action:()=>{ setTab('counterparties'); setModal('cp') } },
                    { label:'Tashkilot qo\'shish', icon:'🏢', color:'purple', action:()=>{ setTab('organizations'); setModal('org') } },
                    { label:'Yurist AI', icon:'⚖️', color:'emerald', action:()=>setTab('yurist_ai') },
                  ].map((a,i)=>(
                    <button key={i} onClick={a.action}
                      className={`bg-gray-900 border border-gray-800 hover:border-${a.color}-700/60 hover:bg-gray-800/80 rounded-xl p-4 text-left transition group`}>
                      <div className="text-2xl mb-2">{a.icon}</div>
                      <div className="text-xs font-medium text-gray-400 group-hover:text-white transition leading-tight">{a.label}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
            )
          })()}

          {/* ─── CONTRACTS ─── */}
          {tab==='contracts' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder={T(t.contracts.search)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                </div>
                <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                  className="bg-gray-900 border border-gray-800 text-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                  <option value="all">{T(t.status.all)}</option>
                  <option value="draft">{T(t.status.draft)}</option>
                  <option value="active">{T(t.status.active)}</option>
                  <option value="completed">{T(t.status.completed)}</option>
                  <option value="cancelled">{T(t.status.cancelled)}</option>
                </select>
              </div>

              {filteredContracts.length===0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-gray-400 font-medium">{T(t.contracts.empty)}</p>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-800/50">
                        {[T(t.contracts.number),T(t.contracts.date),T(t.contracts.type),T(t.contracts.org),T(t.contracts.counterparty),T(t.contracts.amount),T(t.contracts.status),T(t.contracts.actions)].map(h => (
                          <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredContracts.map(c => (
                        <tr key={c.id} className="hover:bg-gray-800/40 transition group">
                          <td className="px-4 py-3.5">
                            <span className="font-mono text-sm font-semibold text-blue-400">#{c.contract_number}</span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-400 whitespace-nowrap">{c.contract_date}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-400 max-w-[120px] truncate">{CONTRACT_TYPES_I18N[c.contract_type]?.[lang]||c.contract_type}</td>
                          <td className="px-4 py-3.5 text-sm text-white max-w-[120px] truncate">{c.organizations?.name||'—'}</td>
                          <td className="px-4 py-3.5 text-sm text-white max-w-[120px] truncate">{c.counterparties?.name||'—'}</td>
                          <td className="px-4 py-3.5 text-sm font-medium whitespace-nowrap">{c.amount?.toLocaleString()} {T(t.overviewTab.som)}</td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUSES[c.status as keyof typeof STATUSES]?.bg} ${STATUSES[c.status as keyof typeof STATUSES]?.text}`}>
                              {T(t.status[c.status as keyof typeof t.status] || t.status.draft)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={()=>{setViewContract(c);setModal('viewContract')}}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium text-gray-200 transition">
                                👁 <span>{T(t.btn.view)}</span>
                              </button>
                              <button onClick={()=>generatePDF(c)}
                                title={isFree ? 'Bepul tarif: PDF watermark bilan yuklanadi' : ''}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 rounded-lg text-xs font-medium text-white transition">
                                📥 <span>PDF{isFree && <span className="ml-0.5 text-yellow-300 opacity-80">★</span>}</span>
                              </button>
                              <button onClick={()=>generateDOCX(c)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-800 hover:bg-blue-700 rounded-lg text-xs font-medium text-white transition">
                                📄 <span>Word</span>
                              </button>
                              {!isFree && (
                                <button onClick={()=>{ setAiContract(c); setAiResult(null); setAiError(''); setAiTab('tahlil'); setAiModal(true) }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-800 hover:bg-purple-700 rounded-lg text-xs font-medium text-white transition"
                                  title="AI shartnoma tahlili">
                                  🤖 <span>AI</span>
                                </button>
                              )}
                              {c.status !== 'completed' && c.status !== 'cancelled' && (
                                <button onClick={()=>updateStatus(c.id,'completed')}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-800 hover:bg-blue-700 rounded-lg text-xs font-medium text-white transition">
                                  ✓ <span>{T(t.status.done)}</span>
                                </button>
                              )}
                              {c.status !== 'cancelled' && (
                                <button onClick={()=>updateStatus(c.id,'cancelled')}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-900 hover:bg-orange-700 rounded-lg text-xs font-medium text-white transition">
                                  ✕ <span>{T(t.status.cancel)}</span>
                                </button>
                              )}
                              <button onClick={()=>deleteContract(c.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-900 hover:bg-red-800 rounded-lg text-xs font-medium text-white transition">
                                🗑 <span>{T(t.btn.delete)}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-5 py-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
                    <span>{filteredContracts.length} {lang==='ru'?'договоров':lang==='oz'?'та шартнома':'ta shartnoma'}</span>
                    <span>{T(t.doc.jami)} {filteredContracts.reduce((s,c)=>s+(c.amount||0),0).toLocaleString()} {lang==='ru'?'сум':"so'm"}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── ORGANIZATIONS ─── */}
          {tab==='organizations' && (
            <div className="space-y-4">
              {orgs.length===0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
                  <div className="text-5xl mb-4">🏢</div>
                  <p className="text-gray-400 font-medium">{T(t.orgs.empty)}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orgs.map(org => (
                    <div key={org.id} className={`bg-gray-900 border rounded-xl p-5 transition cursor-pointer ${activeOrg?.id===org.id?'border-blue-600':'border-gray-800 hover:border-gray-700'}`}
                      onClick={()=>setActiveOrg(org)}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center text-purple-300 font-bold text-xl flex-shrink-0">
                          {org.name[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{org.name}</h3>
                            {activeOrg?.id===org.id && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">{T(t.orgTab.active)}</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">INN: {org.inn||'—'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-4">
                        {[[T(t.orgs.director),org.director_name],[T(t.orgs.bank),org.bank_name],[T(t.orgs.account),org.bank_account],[T(t.orgs.mfo),org.mfo]].map(([l,v])=>(
                          <div key={l}><span className="text-gray-500">{l}: </span><span className="text-gray-300">{v||'—'}</span></div>
                        ))}
                        <div className="col-span-2"><span className="text-gray-500">{T(t.orgs.address)}: </span><span className="text-gray-300">{org.address||'—'}</span></div>
                      </div>

                      {/* Bank accounts section */}
                      {activeOrg?.id===org.id && (
                        <div className="border-t border-gray-800 pt-4 mt-2">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{T(t.orgTab.bankAccounts)}</span>
                            <button onClick={e=>{e.stopPropagation();setModal('bankAccount')}}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                              {T(t.orgTab.addAccount)}
                            </button>
                          </div>
                          {bankAccounts.length===0 ? (
                            <p className="text-xs text-gray-600">{T(t.orgTab.noAccount)}</p>
                          ) : (
                            <div className="space-y-2">
                              {bankAccounts.map(ba => (
                                <div key={ba.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2.5" onClick={e=>e.stopPropagation()}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-white font-mono">{ba.account_number}</span>
                                      {ba.is_default && <span className="text-xs bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded">{T(t.orgTab.primary)}</span>}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">{ba.bank_name} | MFO: {ba.mfo||'—'}</div>
                                  </div>
                                  <button onClick={()=>deleteBankAccount(ba.id)}
                                    className="text-red-500 hover:text-red-400 text-xs p-1">🗑</button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Stamp & Signature */}
                          <div className="border-t border-gray-800 pt-4 mt-4">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{T(t.orgTab.stampSign)}</span>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-2">{T(t.orgTab.signImg)}</div>
                                {org.signature_url ? (
                                  <div className="relative group">
                                    <img src={org.signature_url} alt="Imzo" className="h-16 object-contain bg-white rounded-lg p-1"/>
                                    <button onClick={()=>signatureRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg text-xs text-white transition flex items-center justify-center">
                                      {T(t.orgTab.change)}
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={()=>signatureRef.current?.click()}
                                    className="w-full h-16 border-2 border-dashed border-gray-700 rounded-lg text-xs text-gray-500 hover:border-blue-600 hover:text-blue-400 transition flex items-center justify-center gap-2">
                                    {T(t.orgTab.upload)}
                                  </button>
                                )}
                                <input ref={signatureRef} type="file" accept="image/*" className="hidden"
                                  onChange={e=>{if(e.target.files?.[0]) uploadImage(e.target.files[0],'signature_url')}}/>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-2">{T(t.orgTab.stampImg)}</div>
                                {org.stamp_url ? (
                                  <div className="relative group">
                                    <img src={org.stamp_url} alt="Muhr" className="h-16 object-contain bg-white rounded-lg p-1"/>
                                    <button onClick={()=>stampRef.current?.click()} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg text-xs text-white transition flex items-center justify-center">
                                      {T(t.orgTab.change)}
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={()=>stampRef.current?.click()}
                                    className="w-full h-16 border-2 border-dashed border-gray-700 rounded-lg text-xs text-gray-500 hover:border-blue-600 hover:text-blue-400 transition flex items-center justify-center gap-2">
                                    {T(t.orgTab.upload)}
                                  </button>
                                )}
                                <input ref={stampRef} type="file" accept="image/*" className="hidden"
                                  onChange={e=>{if(e.target.files?.[0]) uploadImage(e.target.files[0],'stamp_url')}}/>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── SPESIFIKATSIYALAR ─── */}
          {tab==='specifications' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-400">{specs.length} {T(t.specTab.count)}</div>
                <button onClick={() => {
                  setEditingSpec(null)
                  setSpecForm(emptySpecForm)
                  setSpecModal(true)
                }} className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  {T(t.specTab.newBtn)}
                </button>
              </div>

              {specs.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-gray-400 font-medium">{T(t.specTab.empty)}</p>
                  <p className="text-gray-600 text-sm mt-1">{T(t.specTab.createNew)}</p>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-800/40">
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
                        const total = spec.items.reduce((s,it)=>s+it.summa,0)
                        const contract = spec.contracts
                        return (
                          <tr key={spec.id} className="border-t border-gray-800/50 hover:bg-gray-800/20 transition">
                            <td className="px-4 py-2.5">
                              <span className="text-sm font-semibold text-white">#{spec.spec_number}</span>
                              {spec.notes && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[120px]">{spec.notes}</div>}
                            </td>
                            <td className="px-4 py-2.5">
                              {contract
                                ? <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full">№{contract.contract_number}</span>
                                : <span className="text-xs text-gray-600">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-sm text-gray-300 max-w-[150px] truncate">
                              {contract?.counterparties?.name || <span className="text-gray-600">—</span>}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">{spec.items.length} {T(t.specTab.items)}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-white font-semibold text-sm">
                              {total.toLocaleString()} <span className="text-xs text-gray-500">{T(t.overviewTab.som)}</span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">
                              {new Date(spec.created_at).toLocaleDateString('uz-UZ')}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => generateSpecPDF(spec)}
                                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-900/20 transition font-medium">
                                  📥 PDF
                                </button>
                                <button onClick={() => {
                                  setEditingSpec(spec)
                                  setSpecForm({ contract_id: spec.contract_id||'', spec_number: spec.spec_number, items: spec.items, notes: spec.notes||'' })
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
            </div>
          )}

          {/* ─── SHABLONLAR ─── */}
          {tab==='shablonlar' && (() => {
            const TYPE_TABS = [
              { key: 'barchasi', label: 'Barchasi' },
              { key: 'oldi_sotdi', label: 'Oldi-sotdi' },
              { key: 'xizmat', label: "Xizmat ko'rsatish" },
              { key: 'ijara', label: 'Ijara' },
              { key: 'pudrat', label: 'Pudrat' },
              { key: 'qoshimcha', label: "Qo'shimcha" },
              { key: 'moliyaviy', label: 'Moliyaviy yordam' },
              { key: 'daval', label: 'Daval' },
              { key: 'xalqaro', label: 'Xalqaro' },
              { key: 'boshqa', label: 'Boshqa' },
            ]
            const allTemplates = [...customTemplates, ...DEFAULT_TEMPLATES]
            const filtered = templateFilter === 'barchasi'
              ? allTemplates
              : allTemplates.filter(t => t.type === templateFilter)
            const typeColors: Record<string,string> = {
              oldi_sotdi: 'bg-blue-900/60 text-blue-300',
              xizmat: 'bg-emerald-900/60 text-emerald-300',
              ijara: 'bg-purple-900/60 text-purple-300',
              pudrat: 'bg-orange-900/60 text-orange-300',
              qoshimcha: 'bg-gray-700 text-gray-300',
              moliyaviy: 'bg-yellow-900/60 text-yellow-300',
              daval: 'bg-cyan-900/60 text-cyan-300',
              xalqaro: 'bg-indigo-900/60 text-indigo-300',
              boshqa: 'bg-pink-900/60 text-pink-300',
            }
            return (
              <div className="space-y-5">
                {/* Header row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-sm text-gray-400">{allTemplates.length} {T(t.tplTab.count)}</div>

                  {/* Word import — faqat AI Pro */}
                  {!isFree && (
                    <>
                      <input
                        ref={wordImportRef}
                        type="file"
                        accept=".docx"
                        className="hidden"
                        onChange={handleWordImport}
                      />
                      <button
                        onClick={() => wordImportRef.current?.click()}
                        disabled={wordImporting}
                        title="Word (.docx) fayldan shablon yaratish — AI Pro"
                        className="ml-auto flex items-center gap-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        {wordImporting ? (
                          <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/><span>O'qilmoqda...</span></>
                        ) : (
                          <><span>📄</span><span>Word import</span><span className="text-xs bg-purple-900/60 px-1.5 py-0.5 rounded-full">AI Pro</span></>
                        )}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => { setEditingCustomTemplate(null); setCustomTplForm(emptyCustomTpl); setCustomTemplateModal(true) }}
                    className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition ${isFree ? 'ml-auto' : ''}`}>
                    {T(t.tplTab.addBtn)}
                  </button>
                </div>

                {/* Type filter tabs */}
                <div className="flex flex-wrap gap-2">
                  {TYPE_TABS.map(tab => (
                    <button key={tab.key}
                      onClick={() => setTemplateFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        templateFilter === tab.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}>
                      {tab.label}
                      <span className="ml-1.5 text-xs opacity-70">
                        {tab.key === 'barchasi' ? allTemplates.length : allTemplates.filter(x=>x.type===tab.key).length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Template grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(tpl => (
                    <div key={tpl.id} className={`bg-gray-900 border rounded-xl p-5 flex flex-col gap-3 hover:border-gray-600 transition ${tpl.isDefault ? 'border-gray-800' : 'border-blue-800/50'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-3xl flex-shrink-0">{tpl.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[tpl.type] || 'bg-gray-700 text-gray-300'}`}>
                              {CONTRACT_TYPES_I18N[tpl.type]?.[lang] || tpl.type}
                            </span>
                            {!tpl.isDefault && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-900/70 text-blue-300">{T(t.tplTab.myTpls)}</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-white text-sm leading-tight">{tpl.name}</h3>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed flex-1">{tpl.description}</p>
                      {tpl.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tpl.tags.slice(0,3).map(tag => (
                            <span key={tag} className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded">#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1 border-t border-gray-800 flex-wrap">
                        <button onClick={() => setTemplatePreview(tpl)}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition font-medium">
                          {T(t.tplTab.view)}
                        </button>
                        <button onClick={() => {
                          setEditingCustomTemplate(tpl.isDefault ? null : tpl)
                          setCustomTplForm({ type: tpl.type, name: tpl.name, description: tpl.description, content: tpl.content })
                          setCustomTemplateModal(true)
                        }} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition font-medium">
                          {T(t.btn.edit)}
                        </button>
                        {!tpl.isDefault && (
                          <button onClick={() => deleteCustomTemplate(tpl.id)}
                            className="text-xs text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-900/20 transition font-medium">
                            {T(t.btn.delete)}
                          </button>
                        )}
                        <button onClick={() => {
                          setContractForm({...emptyContract, contract_type: tpl.type, organization_id: activeOrg?.id||'', contract_number: autoContractNum()})
                          setModal('contract')
                          setTab('contracts')
                        }} className="ml-auto text-xs bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition font-medium">
                          {T(t.tplTab.createFrom)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Info box */}
                <div className="bg-blue-950/40 border border-blue-900/50 rounded-xl p-4 flex gap-3">
                  <span className="text-xl flex-shrink-0">💡</span>
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Shablonlar qanday ishlaydi?</p>
                    <p className="text-blue-400 text-xs leading-relaxed">
                      Standart shablonlar O'zbekiston Respublikasi qonunchiligiga muvofiq tayyorlangan. "Nusxa olish" orqali ularni o'zingizga moslashtirishingiz mumkin. "+ Shablon qo'shish" bilan yangi shablon yarating. "Shartnoma yaratish" tugmasi tanlangan tur bo'yicha shartnoma formini ochadi.
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ─── COUNTERPARTIES ─── */}
          {tab==='counterparties' && (
            <div className="space-y-4">
              {/* Qidiruv */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input value={cpSearch} onChange={e=>setCpSearch(e.target.value)}
                  placeholder={T(t.cpTab.searchPlaceholder)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
              </div>

              {filteredCps.length===0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
                  <div className="text-5xl mb-4">🤝</div>
                  <p className="text-gray-400 font-medium">{cpSearch ? T(t.cpTab.noFound) : T(t.cpTab.noAdded)}</p>
                  {!cpSearch && <button onClick={()=>setModal('cp')} className="mt-3 text-blue-400 text-sm hover:text-blue-300">{T(t.cpTab.addBtn)}</button>}
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
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
                        const cpContracts = contracts.filter(c => c.counterparty_id === cp.id).length
                        return (
                          <tr key={cp.id}
                            className="border-t border-gray-800 hover:bg-gray-800/40 cursor-pointer transition group"
                            onClick={() => setCpDetail(cp)}>
                            <td className="px-4 py-3 text-gray-600 text-xs">{idx+1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-900/60 rounded-lg flex items-center justify-center text-orange-300 font-bold text-sm flex-shrink-0">
                                  {cp.name[0]?.toUpperCase()}
                                </div>
                                <span className="font-medium text-white">{cp.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cp.inn||'—'}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{cp.director_name||'—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{cp.bank_name||'—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">{cp.mfo||'—'}</td>
                            <td className="px-4 py-3 text-center">
                              {cpContracts > 0
                                ? <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded-full">{cpContracts}</span>
                                : <span className="text-gray-700 text-xs">—</span>
                              }
                            </td>
                            <td className="px-4 py-3" onClick={e=>e.stopPropagation()}>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={()=>{ setEditingCp(cp); setCpForm({name:cp.name,inn:cp.inn,director_name:cp.director_name,bank_name:cp.bank_name,bank_account:cp.bank_account,mfo:cp.mfo,address:cp.address,phone:cp.phone||'',qqsreg:cp.qqsreg||''}); setModal('cp') }}
                                  className="p-1.5 bg-gray-700 hover:bg-blue-700 rounded text-xs" title="Tahrirlash">✎</button>
                                <button onClick={()=>deleteCp(cp.id)}
                                  className="p-1.5 bg-gray-700 hover:bg-red-800 rounded text-xs" title="O'chirish">🗑</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
                    {T(t.cpTab.total)}: {filteredCps.length} {T(t.cpTab.contacts)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── PROFILE ─── */}
          {/* ══════════════════════════════════════════════════ */}
          {/* ──────────── YURIST AI ──────────────────────── */}
          {/* ══════════════════════════════════════════════════ */}
          {tab==='yurist_ai' && (() => {
            const FEATURES: { key: HubFeature; icon: string; name: string; desc: string; needsContract: boolean; premiumOnly: boolean }[] = [
              { key:'xulosa',    icon:'📝', name:'Xulosa',         desc:"Shartnomaning asosiy shartlarini qisqacha bayon qiladi",        needsContract:true,  premiumOnly:false },
              { key:'tarjima',   icon:'🌐', name:'Tarjima',        desc:"Shartnomani boshqa tilga professional tarjima qiladi",           needsContract:true,  premiumOnly:false },
              { key:'grammatika',icon:'✏️', name:'Grammatika',     desc:"Matnidagi imlo, grammatika va uslub xatolarini topadi",          needsContract:true,  premiumOnly:false },
              { key:'tahlil',    icon:'📊', name:'Chuqur tahlil',  desc:"Yuridik xatarlar, zaif tomonlar va baho (A-D)",                 needsContract:true,  premiumOnly:true  },
              { key:'qa',        icon:'💬', name:'Savol-Javob',    desc:"Shartnoma haqida istalgan savolga javob beradi",                 needsContract:true,  premiumOnly:true  },
              { key:'clause',    icon:'➕', name:'Band qo\'shish', desc:"Ko'rsatma asosida yangi band yozib beradi",                      needsContract:false, premiumOnly:true  },
              { key:'recommend', icon:'🎯', name:'Tur tavsiyasi',  desc:"Vaziyatni ta'riflang — qaysi shartnoma turi mos ekanini aytadi", needsContract:false, premiumOnly:false },
              { key:'write',     icon:'✍️', name:'Shartnoma yoz',  desc:"Ma'lumotlar asosida to'liq shartnoma matnini yozadi",           needsContract:false, premiumOnly:true  },
            ]
            const sel = FEATURES.find(f => f.key === hubFeature)!
            const canUse = !sel.premiumOnly || !isFree
            const limitReached = isFree && aiUsedToday >= AI_FREE_DAILY
            const contractList = contracts.filter(c => c.organization_id === activeOrg?.id)

            return (
              <div className="space-y-6 max-w-4xl">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">⚖️ Yurist AI</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Claude AI yordamida shartnomalaringizni tahlil qiling, tarjima qiling va takomillashtiring</p>
                  </div>
                  {isFree ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Bugungi foydalanish</div>
                        <div className={`text-sm font-bold ${aiUsedToday >= AI_FREE_DAILY ? 'text-red-400' : 'text-white'}`}>
                          {aiUsedToday} / {AI_FREE_DAILY}
                        </div>
                        <div className="w-24 h-1.5 bg-gray-800 rounded-full mt-1">
                          <div className={`h-1.5 rounded-full transition-all ${aiUsedToday >= AI_FREE_DAILY ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(aiUsedToday/AI_FREE_DAILY*100,100)}%` }}/>
                        </div>
                      </div>
                      <button onClick={() => setModal('upgrade')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">
                        ✦ Cheksiz olish →
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs bg-purple-900/50 border border-purple-700 text-purple-300 px-3 py-1.5 rounded-xl font-medium">
                      ⭐ {subscription?.plan === 'ai_pro' ? 'AI Pro' : 'Standart'} — Cheksiz foydalanish
                    </span>
                  )}
                </div>

                {/* ── Feature cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FEATURES.map(f => {
                    const locked = f.premiumOnly && isFree
                    return (
                      <button key={f.key}
                        onClick={() => { setHubFeature(f.key); setHubResult(null); setHubError(''); setHubLoading(false); if (!f.needsContract) setHubContract('') }}
                        className={`relative text-left p-4 rounded-xl border transition ${
                          hubFeature === f.key
                            ? 'bg-purple-900/50 border-purple-600 shadow-lg shadow-purple-900/20'
                            : locked
                            ? 'bg-gray-900/50 border-gray-800 opacity-60 cursor-default'
                            : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                        }`}>
                        {locked && (
                          <span className="absolute top-2 right-2 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-1.5 py-0.5 rounded-full">PRO</span>
                        )}
                        <div className="text-2xl mb-2">{f.icon}</div>
                        <div className={`text-sm font-semibold mb-1 ${hubFeature===f.key ? 'text-purple-300' : 'text-white'}`}>{f.name}</div>
                        <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
                      </button>
                    )
                  })}
                </div>

                {/* ── Feature panel ── */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{sel.icon}</span>
                    <h3 className="font-semibold text-white">{sel.name}</h3>
                    {sel.premiumOnly && isFree && (
                      <span className="ml-auto text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-0.5 rounded-full">
                        Premium xizmat
                      </span>
                    )}
                  </div>

                  {/* Shartnoma tanlash */}
                  {sel.needsContract && (() => {
                    const contractsWithContent = contractList.filter(c => c.content?.trim())
                    const selectedHasContent = contracts.find(c => c.id === hubContract)?.content?.trim()
                    return (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">
                          Shartnoma tanlang
                          {contractsWithContent.length === 0 && contractList.length > 0 && (
                            <span className="ml-2 text-amber-400">⚠ Hech bir shartnomada matn yo'q</span>
                          )}
                        </label>
                        <select value={hubContract} onChange={e => { setHubContract(e.target.value); setHubResult(null); setHubError('') }}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
                          <option value="">— Shartnomani tanlang —</option>
                          {contractList.map(c => {
                            const hasContent = Boolean(c.content?.trim())
                            return (
                              <option key={c.id} value={c.id} disabled={!hasContent}>
                                {hasContent ? '✓' : '✗'} #{c.contract_number} · {CONTRACT_TYPES_I18N[c.contract_type]?.[lang]} · {c.counterparties?.name || '—'}{!hasContent ? ' (matn yo\'q)' : ''}
                              </option>
                            )
                          })}
                        </select>
                        {hubContract && !selectedHasContent && (
                          <p className="text-amber-400 text-xs mt-1">⚠ Bu shartnomada matn yo'q. Shartnomani oching va bandlar qo'shing.</p>
                        )}
                      </div>
                    )
                  })()}

                  {/* Tarjima — til tanlash */}
                  {hubFeature === 'tarjima' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Tarjima tili</label>
                      <div className="flex gap-2">
                        {[['ru','Ruscha'],["oz","O'zbek (Kirill)"],['en','English']].map(([v,l]) => (
                          <button key={v} onClick={() => setHubTargetLang(v)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${hubTargetLang===v ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Savol-Javob — savol */}
                  {hubFeature === 'qa' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Savolingiz</label>
                      <div className="flex gap-2">
                        <input value={hubQuestion} onChange={e => setHubQuestion(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !hubLoading) { e.preventDefault(); setHubResult(null); runHubFeature() } }}
                          placeholder="Masalan: Bu shartnomada jarima bandi bormi? (Enter → yuborish)"
                          className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600"/>
                        {hubResult && !hubLoading && (
                          <button onClick={() => { setHubResult(null); setHubError(''); runHubFeature() }}
                            className="shrink-0 bg-purple-700 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
                            ↩ Yuborish
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Band qo'shish — ko'rsatma */}
                  {hubFeature === 'clause' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Ko'rsatma</label>
                      <input value={hubInstruction} onChange={e => setHubInstruction(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !hubLoading) { e.preventDefault(); setHubResult(null); runHubFeature() } }}
                        placeholder="Masalan: Kechikish uchun 0.1% kunlik jarima bandi qo'sh (Enter → yuborish)"
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600"/>
                    </div>
                  )}

                  {/* Tur tavsiyasi — ta'rif */}
                  {hubFeature === 'recommend' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Vaziyatni ta'riflang</label>
                      <textarea value={hubDescription} onChange={e => setHubDescription(e.target.value)} rows={3}
                        placeholder="Masalan: Kompaniyam boshqa firmaga 3 oy davomida ofis ijaraga bermoqchi..."
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600 resize-none"/>
                    </div>
                  )}

                  {/* Shartnoma yozish — ma'lumotlar */}
                  {hubFeature === 'write' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Shartnoma turi</label>
                        <select value={hubWriteDetails.tur} onChange={e => setHubWriteDetails({...hubWriteDetails, tur:e.target.value})}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500">
                          {Object.entries(CONTRACT_TYPES_I18N).map(([k,v]) => <option key={k} value={k}>{v[lang]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Summa</label>
                        <input value={hubWriteDetails.summa} onChange={e => setHubWriteDetails({...hubWriteDetails, summa:e.target.value})}
                          placeholder="10 000 000 so'm" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600"/>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Birinchi tomon</label>
                        <input value={hubWriteDetails.org} onChange={e => setHubWriteDetails({...hubWriteDetails, org:e.target.value})}
                          placeholder="Tashkilot nomi" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600"/>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Ikkinchi tomon</label>
                        <input value={hubWriteDetails.cp} onChange={e => setHubWriteDetails({...hubWriteDetails, cp:e.target.value})}
                          placeholder="Kontragent nomi" className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600"/>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1.5">Qo'shimcha shartlar (ixtiyoriy)</label>
                        <textarea value={hubWriteDetails.extra} onChange={e => setHubWriteDetails({...hubWriteDetails, extra:e.target.value})} rows={2}
                          placeholder="Masalan: To'lov muddati 30 kun, yetkazib berish Toshkentda..."
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 placeholder-gray-600 resize-none"/>
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {hubError && (
                    <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                      <span>⚠️</span>
                      <div>
                        {hubError}
                        {hubError.includes('limit') && (
                          <button onClick={() => setModal('upgrade')}
                            className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-3 py-1.5 rounded-lg">
                            Premiumga o'tish →
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Premium lock */}
                  {!canUse && (
                    <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-purple-800/50 rounded-xl p-5 text-center">
                      <div className="text-3xl mb-2">🔒</div>
                      <div className="text-white font-semibold mb-1">Premium xizmat</div>
                      <div className="text-gray-400 text-sm mb-4">Bu funksiyadan foydalanish uchun Standart yoki AI Pro tarifiga o'ting</div>
                      <button onClick={() => setModal('upgrade')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition">
                        ✦ Tarifni yaxshilash →
                      </button>
                    </div>
                  )}

                  {/* Action button */}
                  {canUse && !hubLoading && !hubResult && (
                    <button onClick={runHubFeature}
                      disabled={limitReached}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
                        limitReached
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white'
                      }`}>
                      {limitReached ? `Kunlik limit tugadi (${AI_FREE_DAILY} ta)` : `${sel.icon} ${sel.name} boshlash`}
                    </button>
                  )}

                  {/* Loading */}
                  {hubLoading && (
                    <div className="text-center py-8">
                      <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
                      <div className="text-gray-400 text-sm">Claude AI ishlamoqda...</div>
                      <div className="text-gray-600 text-xs mt-1">~10-20 soniya</div>
                    </div>
                  )}

                  {/* Result */}
                  {hubResult && !hubLoading && (
                    <div className="space-y-3">
                      <div className="h-px bg-gray-800"/>

                      {/* XULOSA */}
                      {hubFeature==='xulosa' && (
                        <div className="space-y-3">
                          <div className="bg-gray-800/60 rounded-xl p-4">
                            <div className="text-xs text-gray-500 mb-1">Xulosa</div>
                            <div className="text-white text-sm leading-relaxed">{String(hubResult.xulosa || '')}</div>
                          </div>
                          {(hubResult.asosiy_shartlar as string[])?.length > 0 && (
                            <div className="bg-gray-800/60 rounded-xl p-4">
                              <div className="text-xs text-gray-500 mb-2">Asosiy shartlar</div>
                              {(hubResult.asosiy_shartlar as string[]).map((s,i) => <div key={i} className="text-sm text-gray-300">• {s}</div>)}
                            </div>
                          )}
                          <div className="flex gap-3">
                            {Boolean(hubResult.muddat) && <div className="bg-blue-900/40 border border-blue-800/40 rounded-xl px-4 py-3 flex-1"><div className="text-xs text-gray-500">Muddat</div><div className="text-white text-sm">{String(hubResult.muddat)}</div></div>}
                            {Boolean(hubResult.summa)  && <div className="bg-emerald-900/40 border border-emerald-800/40 rounded-xl px-4 py-3 flex-1"><div className="text-xs text-gray-500">Summa</div><div className="text-white text-sm">{String(hubResult.summa)}</div></div>}
                          </div>
                          {(hubResult.muhim_bandlar as string[])?.length > 0 && (
                            <div className="bg-gray-800/60 rounded-xl p-4">
                              <div className="text-xs text-gray-500 mb-2">📌 Muhim bandlar</div>
                              {(hubResult.muhim_bandlar as string[]).map((s,i) => <div key={i} className="text-sm text-gray-300">• {s}</div>)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* TARJIMA */}
                      {hubFeature==='tarjima' && (
                        <div className="bg-gray-800/60 rounded-xl p-4">
                          <div className="text-xs text-gray-500 mb-2">Tarjima</div>
                          <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{String(hubResult.tarjima || '')}</pre>
                        </div>
                      )}

                      {/* GRAMMATIKA */}
                      {hubFeature==='grammatika' && (
                        <div className="space-y-3">
                          <div className="bg-gray-800/60 rounded-xl p-4 flex items-center gap-3">
                            <span className="text-2xl">✏️</span>
                            <div>
                              <div className="text-white font-semibold">{Number(hubResult.xatolar_soni ?? (hubResult.xatolar as unknown[])?.length ?? 0)} ta xato</div>
                              <div className="text-gray-400 text-xs">{String(hubResult.umumiy_baho || '')}</div>
                            </div>
                          </div>
                          {(hubResult.xatolar as {xato:string;togri:string;izoh:string}[])?.map((x,i) => (
                            <div key={i} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-red-400 text-sm line-through">{x.xato}</span>
                                <span className="text-gray-600">→</span>
                                <span className="text-emerald-400 text-sm font-medium">{x.togri}</span>
                              </div>
                              <div className="text-gray-500 text-xs">{x.izoh}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* TAHLIL */}
                      {hubFeature==='tahlil' && (
                        <div className="space-y-3">
                          <div className={`rounded-xl p-4 border flex items-center gap-3 ${String(hubResult.baho)==='A'?'bg-emerald-900/40 border-emerald-700':String(hubResult.baho)==='B'?'bg-blue-900/40 border-blue-700':String(hubResult.baho)==='C'?'bg-yellow-900/40 border-yellow-700':'bg-red-900/40 border-red-700'}`}>
                            <span className={`text-4xl font-black ${String(hubResult.baho)==='A'?'text-emerald-400':String(hubResult.baho)==='B'?'text-blue-400':String(hubResult.baho)==='C'?'text-yellow-400':'text-red-400'}`}>{String(hubResult.baho)}</span>
                            <div className="text-gray-300 text-sm">{String(hubResult.umumiy || '')}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {(hubResult.kuchli_tomonlar as string[])?.length > 0 && (
                              <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-3">
                                <div className="text-xs text-emerald-400 mb-1.5">✅ Kuchli tomonlar</div>
                                {(hubResult.kuchli_tomonlar as string[]).map((s,i) => <div key={i} className="text-xs text-gray-300">• {s}</div>)}
                              </div>
                            )}
                            {(hubResult.zaif_tomonlar as string[])?.length > 0 && (
                              <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-3">
                                <div className="text-xs text-yellow-400 mb-1.5">⚠️ Zaif tomonlar</div>
                                {(hubResult.zaif_tomonlar as string[]).map((s,i) => <div key={i} className="text-xs text-gray-300">• {s}</div>)}
                              </div>
                            )}
                          </div>
                          {(hubResult.yuridik_xatarlar as {daraja:string;tavsif:string}[])?.map((x,i) => (
                            <div key={i} className="flex items-start gap-2 bg-gray-800/60 rounded-xl p-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${x.daraja.match(/yuqori|высок|юқори/i)?'bg-red-900 text-red-300':x.daraja.match(/rta|редний|ўрта/i)?'bg-yellow-900 text-yellow-300':'bg-gray-700 text-gray-300'}`}>{x.daraja}</span>
                              <span className="text-gray-300 text-sm">{x.tavsif}</span>
                            </div>
                          ))}
                          {(hubResult.tavsiyalar as string[])?.map((s,i) => <div key={i} className="text-gray-300 text-sm">• {s}</div>)}
                          {(hubResult.grammatika_xatolari as string[])?.length > 0 && (
                            <div className="bg-orange-900/20 border border-orange-800/40 rounded-xl p-3">
                              <div className="text-xs text-orange-400 mb-1.5">📝 Grammatika xatolari</div>
                              {(hubResult.grammatika_xatolari as string[]).map((s,i) => <div key={i} className="text-xs text-gray-300">• {s}</div>)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SAVOL-JAVOB */}
                      {hubFeature==='qa' && (
                        <div className="space-y-2">
                          <div className="bg-purple-900/30 border border-purple-800/40 rounded-xl p-4">
                            <div className="text-xs text-purple-400 mb-2 flex items-center justify-between">
                              <span>💬 Javob</span>
                              <span className="text-gray-600 text-xs">{hubQuestion}</span>
                            </div>
                            {hubResult.javob
                              ? <div className="text-white text-sm leading-relaxed">{String(hubResult.javob)}</div>
                              : <div className="text-gray-500 text-sm italic">AI javob qaytarmadi. Yana urinib ko'ring.</div>
                            }
                          </div>
                          {Boolean(hubResult.havola) && String(hubResult.havola) !== 'shartnomaning qaysi bandiga tegishli' && (
                            <div className="text-gray-500 text-xs">📍 {String(hubResult.havola)}</div>
                          )}
                        </div>
                      )}

                      {/* BAND */}
                      {hubFeature==='clause' && (
                        <div className="bg-gray-800/60 rounded-xl p-4">
                          {Boolean(hubResult.band_nomi) && <div className="text-purple-400 text-xs font-semibold mb-2">{String(hubResult.band_nomi)}</div>}
                          <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{String(hubResult.band || '')}</pre>
                          <button onClick={() => navigator.clipboard.writeText(String(hubResult.band || ''))}
                            className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition">📋 Nusxa olish</button>
                        </div>
                      )}

                      {/* TAVSIYA */}
                      {hubFeature==='recommend' && (
                        <div className="space-y-3">
                          <div className="bg-purple-900/40 border border-purple-700 rounded-xl p-4 flex items-center gap-3">
                            <span className="text-3xl">🎯</span>
                            <div>
                              <div className="text-xs text-gray-500">Tavsiya etilgan tur</div>
                              <div className="text-white font-bold">{String(hubResult.tur_nomi || hubResult.tur || '')}</div>
                            </div>
                          </div>
                          <div className="bg-gray-800/60 rounded-xl p-4 text-sm text-gray-300 leading-relaxed">{String(hubResult.tavsiya || '')}</div>
                          {Boolean(hubResult.sabab) && <div className="text-gray-500 text-xs">💡 {String(hubResult.sabab)}</div>}
                          {Boolean(hubResult.qoshimcha_maslahat) && <div className="text-gray-500 text-xs">📌 {String(hubResult.qoshimcha_maslahat)}</div>}
                          <button onClick={() => { setHubFeature('write'); setHubWriteDetails({...hubWriteDetails, tur: String(hubResult.tur||'oldi_sotdi')}); setHubResult(null) }}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 transition">
                            ✍️ Shu tur bo'yicha shartnoma yoz →
                          </button>
                        </div>
                      )}

                      {/* SHARTNOMA YOZISH */}
                      {hubFeature==='write' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">{Number(hubResult.bandlar_soni || 0)} ta band</div>
                            <button onClick={() => navigator.clipboard.writeText(String(hubResult.shartnoma || ''))}
                              className="text-xs text-purple-400 hover:text-purple-300">📋 Nusxa olish</button>
                          </div>
                          <div className="bg-gray-800/60 rounded-xl p-4 max-h-96 overflow-y-auto">
                            <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap font-sans">{String(hubResult.shartnoma || '')}</pre>
                          </div>
                        </div>
                      )}

                      <button onClick={() => { setHubResult(null); setHubError('') }}
                        className="text-xs text-gray-600 hover:text-gray-400 transition">🔄 Qayta bajarish</button>
                    </div>
                  )}
                </div>

                {/* ── Pastki reklama banner (bepul uchun) ── */}
                {isFree && (
                  <div className="bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-purple-800/30 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-white font-semibold text-sm mb-1">✦ Standart yoki AI Proga o'ting</div>
                      <div className="text-gray-400 text-xs">Cheksiz AI, 4 ta premium funksiya, imzo/muhr avtomatik va ko'proq</div>
                    </div>
                    <button onClick={() => setModal('upgrade')}
                      className="shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
                      Upgrade →
                    </button>
                  </div>
                )}

              </div>
            )
          })()}
          {/* ══════════════════════════════════════════════════ */}

          {tab==='profile' && (
            <div className="max-w-3xl space-y-5">

              {/* Sub-navigatsiya */}
              <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
                {[
                  { key: 'account', label: T(t.profileTab.accountTab) },
                  { key: 'company', label: T(t.profileTab.companyTab) },
                ].map(pt => (
                  <button key={pt.key} type="button"
                    onClick={() => setProfileTab(pt.key as 'account'|'company')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${profileTab===pt.key ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                    {pt.label}
                  </button>
                ))}
              </div>

              {/* ── AKKAUNT tab ── */}
              {profileTab === 'account' && <>

              {/* Avatar + info kartasi */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                      {profile.avatar_url
                        ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>
                        : userEmail[0]?.toUpperCase()
                      }
                    </div>
                    <button type="button" onClick={() => avatarRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white text-sm shadow-lg transition border-2 border-gray-900"
                      title="Rasmni o'zgartirish">
                      {avatarUploading ? '…' : '✎'}
                    </button>
                    <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }}/>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-bold text-white">{profile.full_name || 'Ism kiritilmagan'}</div>
                    {profile.lavozim && <div className="text-sm text-blue-400 mt-0.5">{profile.lavozim}</div>}
                    <div className="text-sm text-gray-400 mt-1">{userEmail}</div>
                    {profile.phone && <div className="text-sm text-gray-500 mt-0.5">📞 {profile.phone}</div>}
                  </div>

                  {/* Tarif badge */}
                  <div className="flex-shrink-0 text-right">
                    {subscription ? (
                      <div className={`inline-flex flex-col items-end gap-1`}>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          subscription.plan === 'ai_pro' ? 'bg-purple-900/50 text-purple-300 border border-purple-700' :
                          subscription.plan === 'standart' ? 'bg-blue-900/50 text-blue-300 border border-blue-700' :
                          'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {subscription.plan === 'ai_pro' ? '⭐ AI Pro' :
                           subscription.plan === 'standart' ? '✦ Standart' : 'Bepul'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {subscription.contracts_used}/{subscription.plan==='free'?'5':'∞'} shartnoma
                        </span>
                        {subscription.period_end && subscription.plan !== 'free' && (
                          <span className="text-xs text-gray-600">
                            {new Date(subscription.period_end).toLocaleDateString('uz-UZ')} gacha
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">Tarif yuklanmoqda...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistika */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: T(t.contracts.title), value: contracts.length, icon: '📄', color: 'blue' },
                  { label: T(t.cp.title), value: cps.length, icon: '🤝', color: 'emerald' },
                  { label: T(t.orgs.title), value: orgs.length, icon: '🏢', color: 'purple' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <div className="text-2xl font-bold text-white">{s.value}</div>
                      <div className="text-xs text-gray-500">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shaxsiy ma'lumotlar */}
              <form onSubmit={saveProfile} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{T(t.profileTab.personalInfo)}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>{T(t.profileTab.fullName)}</label>
                    <input className={inp} placeholder="Alisher Karimov"
                      value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})}/>
                  </div>
                  <div>
                    <label className={lbl}>{T(t.profileTab.position)}</label>
                    <input className={inp} placeholder="Direktor / Buxgalter / Menejer"
                      value={profile.lavozim} onChange={e=>setProfile({...profile,lavozim:e.target.value})}/>
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>{T(t.profileTab.phone)}</label>
                    <input className={inp} placeholder="+998 90 123 45 67"
                      value={profile.phone} onChange={e=>setProfile({...profile,phone:e.target.value})}/>
                  </div>
                </div>
                {profileMsg && (
                  <div className="bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-sm px-4 py-2.5 rounded-lg">
                    {profileMsg}
                  </div>
                )}
                <button type="submit" disabled={profileSaving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition">
                  {profileSaving ? T(t.btn.saving) : T(t.btn.save)}
                </button>
              </form>

              {/* Xavfsizlik */}
              <form onSubmit={changePassword} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{T(t.profileTab.security)}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>{T(t.profileTab.newPass)}</label>
                    <input type="password" className={inp} placeholder="Kamida 8 belgi"
                      value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
                  </div>
                  <div>
                    <label className={lbl}>{T(t.profileTab.confirmPass)}</label>
                    <input type="password" className={inp} placeholder="Qayta kiriting"
                      value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}/>
                  </div>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400">{T(t.profileTab.passMismatch)}</p>
                )}
                {pwdMsg && (
                  <div className={`text-sm px-4 py-2.5 rounded-lg ${pwdMsg.includes('✓') ? 'bg-emerald-900/40 border border-emerald-700 text-emerald-300' : 'bg-red-900/40 border border-red-700 text-red-300'}`}>
                    {pwdMsg}
                  </div>
                )}
                <button type="submit" disabled={!newPassword || newPassword !== confirmPassword}
                  className="border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 px-6 py-2.5 rounded-lg text-sm font-medium transition">
                  {T(t.profileTab.changePass)}
                </button>
              </form>

              {/* Chiqish */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{T(t.profileTab.logoutTitle)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{userEmail}</div>
                </div>
                <button type="button"
                  onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition">
                  {T(t.profileTab.logoutBtn)}
                </button>
              </div>

              </> /* end account tab */}

              {/* ── KORXONA tab ── */}
              {profileTab === 'company' && (
                activeOrg ? (
                  <form onSubmit={saveOrgExt} className="space-y-5">

                    {/* Asosiy ma'lumotlar */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between mb-1">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{T(t.profileTab.mainInfo)}</h2>
                        <span className="text-xs text-gray-600">{activeOrg.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Tashkilot nomi *</label>
                          <input className={inp} placeholder="Alfa MChJ"
                            value={orgExtForm.name||''} onChange={e=>setOrgExtForm({...orgExtForm,name:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>STIR (INN)</label>
                          <input className={inp} placeholder="123456789"
                            value={orgExtForm.inn||''} onChange={e=>setOrgExtForm({...orgExtForm,inn:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>Direktor (F.I.Sh)</label>
                          <input className={inp} placeholder="Karimov Alisher Baxtiyorovich"
                            value={orgExtForm.director_name||''} onChange={e=>setOrgExtForm({...orgExtForm,director_name:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>Rahbar JSHSHIR (PINFL)</label>
                          <input className={inp} placeholder="30405704070022"
                            value={orgExtForm.director_pinfl||''} onChange={e=>setOrgExtForm({...orgExtForm,director_pinfl:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>Bosh buxgalter</label>
                          <input className={inp} placeholder="Rahimova Dilnoza Sobirovna"
                            value={orgExtForm.chief_accountant||''} onChange={e=>setOrgExtForm({...orgExtForm,chief_accountant:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>Telefon</label>
                          <input className={inp} placeholder="+998901234567"
                            value={orgExtForm.phone||''} onChange={e=>setOrgExtForm({...orgExtForm,phone:e.target.value})}/>
                        </div>
                      </div>
                    </div>

                    {/* Bank va moliya */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{T(t.profileTab.bankInfo)}</h2>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>Bank nomi</label>
                          <input className={inp} placeholder="Xalq banki"
                            value={orgExtForm.bank_name||''} onChange={e=>setOrgExtForm({...orgExtForm,bank_name:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>Hisob raqami (X/R)</label>
                          <input className={inp} placeholder="20208000000000000000"
                            value={orgExtForm.bank_account||''} onChange={e=>setOrgExtForm({...orgExtForm,bank_account:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>MFO</label>
                          <input className={inp} placeholder="00873"
                            value={orgExtForm.mfo||''} onChange={e=>setOrgExtForm({...orgExtForm,mfo:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>OKED (faoliyat kodi)</label>
                          <input className={inp} placeholder="46130"
                            value={orgExtForm.oked||''} onChange={e=>setOrgExtForm({...orgExtForm,oked:e.target.value})}/>
                        </div>
                      </div>
                    </div>

                    {/* Soliq va manzil */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{T(t.profileTab.taxAddress)}</h2>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>QQS ro&apos;yxat raqami</label>
                          <input className={inp} placeholder="318060007067"
                            value={orgExtForm.qqsreg||''} onChange={e=>setOrgExtForm({...orgExtForm,qqsreg:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>QQS stavkasi</label>
                          <select className={inp} value={orgExtForm.qqs_stavka||'yoq'}
                            onChange={e=>setOrgExtForm({...orgExtForm,qqs_stavka:e.target.value})}>
                            <option value="yoq">QQS to&apos;lovchi emas</option>
                            <option value="0">0%</option>
                            <option value="12">12%</option>
                            <option value="15">15%</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className={lbl}>Yuridik manzil</label>
                          <input className={inp} placeholder="Toshkent shahri, Yunusobod tumani, ..."
                            value={orgExtForm.address||''} onChange={e=>setOrgExtForm({...orgExtForm,address:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>Viloyat</label>
                          <select className={inp} value={orgExtForm.viloyat||''}
                            onChange={e=>setOrgExtForm({...orgExtForm,viloyat:e.target.value})}>
                            <option value="">— Tanlang —</option>
                            {['Toshkent shahri','Toshkent viloyati','Samarqand','Buxoro','Farg\'ona','Andijon','Namangan','Qashqadaryo','Surxondaryo','Navoiy','Jizzax','Sirdaryo','Xorazm','Qoraqalpog\'iston'].map(v=>(
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Tuman/Shahar</label>
                          <input className={inp} placeholder="Yunusobod tumani"
                            value={orgExtForm.tuman||''} onChange={e=>setOrgExtForm({...orgExtForm,tuman:e.target.value})}/>
                        </div>
                      </div>
                    </div>

                    {/* Tovar jo'natuvchi */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{T(t.profileTab.sender)}</h2>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lbl}>F.I.Sh</label>
                          <input className={inp} placeholder="Karimov Alisher Baxtiyorovich"
                            value={orgExtForm.sender_name||''} onChange={e=>setOrgExtForm({...orgExtForm,sender_name:e.target.value})}/>
                        </div>
                        <div>
                          <label className={lbl}>JSHSHIR (PINFL)</label>
                          <input className={inp} placeholder="30405704070022"
                            value={orgExtForm.sender_pinfl||''} onChange={e=>setOrgExtForm({...orgExtForm,sender_pinfl:e.target.value})}/>
                        </div>
                      </div>
                    </div>

                    {orgExtMsg && (
                      <div className="bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-sm px-4 py-2.5 rounded-lg">
                        {orgExtMsg}
                      </div>
                    )}
                    <button type="submit" disabled={orgExtSaving}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition">
                      {orgExtSaving ? T(t.btn.saving) : T(t.profileTab.saveChanges)}
                    </button>
                  </form>
                ) : (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">
                    <p className="text-sm">{T(t.profileTab.noOrg)}</p>
                    <button onClick={() => setTab('organizations')}
                      className="mt-3 text-blue-400 text-sm hover:text-blue-300">{T(t.profileTab.orgsLink)}</button>
                  </div>
                )
              )}

              {/* ── Qo'llab-quvvatlash kartasi ── */}
              {(() => {
                const plan = !subscription || subscription.plan === 'free' ? 'free'
                  : subscription.plan === 'ai_pro' ? 'ai_pro' : 'standard'
                const isPaid = plan !== 'free'
                const isAiPro = plan === 'ai_pro'
                return (
                  <div className={`rounded-2xl border p-6 ${isAiPro ? 'bg-purple-950/40 border-purple-700/50' : isPaid ? 'bg-blue-950/40 border-blue-700/50' : 'bg-gray-900 border-gray-800'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💬</span>
                        <div>
                          <h3 className="font-semibold text-white text-sm">Qo'llab-quvvatlash</h3>
                          <p className={`text-xs mt-0.5 ${isAiPro ? 'text-purple-300' : isPaid ? 'text-blue-300' : 'text-gray-500'}`}>
                            {isAiPro ? '⚡ Premium — 4 soat ichida javob' : isPaid ? '✦ Ustunlik — 24 soat ichida javob' : 'Asosiy — 2–3 ish kuni'}
                          </p>
                        </div>
                      </div>
                      {isPaid && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isAiPro ? 'bg-purple-800 text-purple-200' : 'bg-blue-800 text-blue-200'}`}>
                          {isAiPro ? '⭐ AI Pro' : '✦ Standart'}
                        </span>
                      )}
                    </div>

                    {/* Aloqa tugmalari */}
                    <div className="flex flex-wrap gap-3 mb-5">
                      <a href="https://t.me/shartnoma_uz_support"
                        target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${isPaid ? 'bg-blue-500 hover:bg-blue-400 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                        </svg>
                        Telegram
                        {isPaid && <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">Ustunlik</span>}
                      </a>
                      <a href={`mailto:support@shartnoma.uz?subject=Murojaat [${userEmail}]&body=Muammo tavsifi:%0A%0A`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        Email
                      </a>
                    </div>

                    {/* Tezkor xabar (faqat to'lovli) */}
                    {isPaid ? (
                      <form onSubmit={e => {
                        e.preventDefault()
                        const form = e.currentTarget
                        const subj = (form.elements.namedItem('subj') as HTMLInputElement).value
                        const msg  = (form.elements.namedItem('msg')  as HTMLTextAreaElement).value
                        window.location.href = `mailto:support@shartnoma.uz?subject=${encodeURIComponent(subj + ' [' + userEmail + ']')}&body=${encodeURIComponent(msg)}`
                      }} className="space-y-3">
                        <input name="subj" required
                          placeholder="Mavzu: Muammo yoki savol..."
                          className="w-full bg-gray-800/60 border border-gray-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-500"/>
                        <textarea name="msg" required rows={3}
                          placeholder="Muammoingizni batafsil yozing..."
                          className="w-full bg-gray-800/60 border border-gray-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-gray-500 resize-none"/>
                        <button type="submit"
                          className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition ${isAiPro ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                          Yuborish →
                        </button>
                      </form>
                    ) : (
                      <div className="bg-gray-800/60 rounded-xl p-4 flex items-center justify-between gap-4">
                        <p className="text-gray-400 text-xs">Ustunlik qo'llab-quvvatlash uchun Standart yoki AI Pro tarifiga o'ting</p>
                        <button onClick={() => setModal('upgrade')}
                          className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                          Upgrade →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}

            </div>
          )}
        </main>
      </div>

      {/* ─── MODALS ─── */}

      {modal==='org' && (
        <Modal title="Tashkilot qo'shish" onClose={()=>setModal(null)}>
          <form onSubmit={saveOrg} className="space-y-4">
            <div><label className={lbl}>Tashkilot nomi *</label>
              <input className={inp} required placeholder="Alfa Texnologiya MChJ" value={orgForm.name} onChange={e=>setOrgForm({...orgForm,name:e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>STR (INN)</label>
                <input className={inp} placeholder="123456789" value={orgForm.inn} onChange={e=>setOrgForm({...orgForm,inn:e.target.value})}/></div>
              <div><label className={lbl}>Rahbar ismi</label>
                <input className={inp} placeholder="F.I.O" value={orgForm.director_name} onChange={e=>setOrgForm({...orgForm,director_name:e.target.value})}/></div>
              <div><label className={lbl}>Bank nomi</label>
                <input className={inp} placeholder="Xalq banki" value={orgForm.bank_name} onChange={e=>setOrgForm({...orgForm,bank_name:e.target.value})}/></div>
              <div><label className={lbl}>Hisob raqami</label>
                <input className={inp} placeholder="20208000..." value={orgForm.bank_account} onChange={e=>setOrgForm({...orgForm,bank_account:e.target.value})}/></div>
              <div><label className={lbl}>MFO</label>
                <input className={inp} placeholder="00873" value={orgForm.mfo} onChange={e=>setOrgForm({...orgForm,mfo:e.target.value})}/></div>
              <div><label className={lbl}>Manzil</label>
                <input className={inp} placeholder="Toshkent, ..." value={orgForm.address} onChange={e=>setOrgForm({...orgForm,address:e.target.value})}/></div>
            </div>
            <ModalActions onClose={()=>setModal(null)} saving={saving}/>
          </form>
        </Modal>
      )}

      {modal==='cp' && (
        <Modal title={editingCp ? "Kontragentni tahrirlash" : "Kontragent qo'shish"} onClose={()=>{ setModal(null); setEditingCp(null); setCpForm(emptyCp) }}>
          <form onSubmit={saveCp} className="space-y-4">
            <div><label className={lbl}>Tashkilot nomi *</label>
              <input className={inp} required placeholder="Beta Qurilish MChJ" value={cpForm.name} onChange={e=>setCpForm({...cpForm,name:e.target.value})}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>STR (INN)</label>
                <input className={inp} placeholder="123456789" value={cpForm.inn} onChange={e=>setCpForm({...cpForm,inn:e.target.value})}/></div>
              <div><label className={lbl}>Rahbar ismi</label>
                <input className={inp} placeholder="F.I.O" value={cpForm.director_name} onChange={e=>setCpForm({...cpForm,director_name:e.target.value})}/></div>
              <div><label className={lbl}>Bank nomi</label>
                <input className={inp} placeholder="Ipoteka banki" value={cpForm.bank_name} onChange={e=>setCpForm({...cpForm,bank_name:e.target.value})}/></div>
              <div><label className={lbl}>Hisob raqami</label>
                <input className={inp} placeholder="20208000..." value={cpForm.bank_account} onChange={e=>setCpForm({...cpForm,bank_account:e.target.value})}/></div>
              <div><label className={lbl}>MFO</label>
                <input className={inp} placeholder="00869" value={cpForm.mfo} onChange={e=>setCpForm({...cpForm,mfo:e.target.value})}/></div>
              <div><label className={lbl}>Manzil</label>
                <input className={inp} placeholder="Samarqand, ..." value={cpForm.address} onChange={e=>setCpForm({...cpForm,address:e.target.value})}/></div>
              <div><label className={lbl}>Telefon raqami</label>
                <input className={inp} placeholder="+998901234567" value={(cpForm as any).phone||''} onChange={e=>setCpForm({...cpForm,phone:e.target.value} as any)}/></div>
              <div><label className={lbl}>QQS kodi</label>
                <input className={inp} placeholder="318060007067" value={(cpForm as any).qqsreg||''} onChange={e=>setCpForm({...cpForm,qqsreg:e.target.value} as any)}/></div>
            </div>
            <ModalActions onClose={()=>{ setModal(null); setEditingCp(null); setCpForm(emptyCp) }} saving={saving}/>
          </form>
        </Modal>
      )}

      {/* ─── KONTRAGENT DETAIL MODAL ─── */}
      {cpDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-900/60 rounded-xl flex items-center justify-center text-orange-300 font-bold text-lg">
                  {cpDetail.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">{cpDetail.name}</h2>
                  {cpDetail.inn && <p className="text-xs text-gray-500 font-mono">STR: {cpDetail.inn}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{ setEditingCp(cpDetail); setCpForm({name:cpDetail.name,inn:cpDetail.inn,director_name:cpDetail.director_name,bank_name:cpDetail.bank_name,bank_account:cpDetail.bank_account,mfo:cpDetail.mfo,address:cpDetail.address,phone:cpDetail.phone||'',qqsreg:cpDetail.qqsreg||''}); setModal('cp'); setCpDetail(null) }}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition">✎ {T(t.btn.edit)}</button>
                <button onClick={()=>deleteCp(cpDetail.id)}
                  className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-400 hover:text-white rounded-lg text-xs font-medium transition border border-red-800/50">🗑 {T(t.btn.delete)}</button>
                <button onClick={()=>setCpDetail(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-xl">×</button>
              </div>
            </div>
            <div className="p-6 space-y-5">

              {/* Asosiy ma'lumotlar */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{T(t.cpTab.basicInfo)}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Tashkilot nomi', cpDetail.name, true],
                    ['STR / INN', cpDetail.inn, false],
                    ['Rahbar', cpDetail.director_name, false],
                    ['Telefon', cpDetail.phone, false],
                    ['QQS kodi', cpDetail.qqsreg, false],
                    ['Manzil', cpDetail.address, true],
                  ].map(([l,v,full]) => (
                    <div key={l as string} className={`bg-gray-800/50 rounded-lg px-3 py-2.5 ${full?'col-span-2':''}`}>
                      <div className="text-xs text-gray-500 mb-0.5">{l as string}</div>
                      <div className="text-sm text-white font-medium">{(v as string)||'—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bank */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{T(t.cpTab.bankDetails)}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Bank nomi', cpDetail.bank_name],
                    ['MFO', cpDetail.mfo],
                    ['Hisob raqami (X/R)', cpDetail.bank_account],
                  ].map(([l,v]) => (
                    <div key={l} className={`bg-gray-800/50 rounded-lg px-3 py-2.5 ${l==='Hisob raqami (X/R)'?'col-span-2':''}`}>
                      <div className="text-xs text-gray-500 mb-0.5">{l}</div>
                      <div className="text-sm text-white font-mono">{v||'—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shartnomalar */}
              {(() => {
                const cpContracts = contracts.filter(c => c.counterparty_id === cpDetail.id)
                return cpContracts.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {T(t.cpTab.contracts)} ({cpContracts.length})
                    </h3>
                    <div className="space-y-2">
                      {cpContracts.slice(0,5).map(c => (
                        <div key={c.id} className="bg-gray-800/50 rounded-lg px-3 py-2.5 flex items-center justify-between">
                          <div>
                            <span className="text-sm text-white font-medium">№ {c.contract_number}</span>
                            <span className="text-xs text-gray-500 ml-2">{c.contract_date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{c.amount?.toLocaleString()} so'm</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              c.status==='active'?'bg-emerald-900/40 text-emerald-400':
                              c.status==='completed'?'bg-blue-900/40 text-blue-400':
                              'bg-gray-800 text-gray-500'}`}>
                              {c.status==='active'?T(t.status.active):c.status==='completed'?T(t.status.completed):T(t.status.draft)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {cpContracts.length > 5 && (
                        <p className="text-xs text-gray-600 text-center">va yana {cpContracts.length-5} ta...</p>
                      )}
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </div>
        </div>
      )}

      {modal==='bankAccount' && (
        <Modal title={T(t.bankModal.title)} onClose={()=>setModal(null)}>
          <form onSubmit={saveBankAccount} className="space-y-4">
            <div><label className={lbl}>{T(t.bankModal.bankName)}</label>
              <input className={inp} required placeholder="Xalq banki" value={bankForm.bank_name} onChange={e=>setBankForm({...bankForm,bank_name:e.target.value})}/></div>
            <div><label className={lbl}>{T(t.bankModal.account)}</label>
              <input className={inp} required placeholder="20208000000000000000" value={bankForm.account_number} onChange={e=>setBankForm({...bankForm,account_number:e.target.value})}/></div>
            <div><label className={lbl}>{T(t.bankModal.mfo)}</label>
              <input className={inp} placeholder="00873" value={bankForm.mfo} onChange={e=>setBankForm({...bankForm,mfo:e.target.value})}/></div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={bankForm.is_default} onChange={e=>setBankForm({...bankForm,is_default:e.target.checked})}
                className="w-4 h-4 accent-blue-500"/>
              <span className="text-sm text-gray-300">{T(t.bankModal.setDefault)}</span>
            </label>
            <ModalActions onClose={()=>setModal(null)} saving={saving}/>
          </form>
        </Modal>
      )}

      {modal==='contract' && (
        <ContractModal
          orgs={orgs}
          cps={cps}
          form={contractForm}
          setForm={setContractForm}
          onSave={saveContract}
          onClose={()=>setModal(null)}
          saving={saving}
          inp={inp}
          lbl={lbl}
          onCpAdded={async (cp) => { await loadCps(); setContractForm((f: any) => ({...f, counterparty_id: cp.id})) }}
          customTemplates={customTemplates}
        />
      )}

      {modal==='viewContract' && viewContract && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={()=>setModal(null)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition text-lg">
                ←
              </button>
              <div>
                <div className="text-white font-semibold text-sm">
                  Shartnoma #{viewContract.contract_number}
                </div>
                <div className="text-xs text-gray-500">
                  {CONTRACT_TYPES_I18N[viewContract.contract_type]?.[lang] || viewContract.contract_type} · {viewContract.contract_date}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setModal(null)
                  setTimeout(() => {
                    setContractForm({
                      id: viewContract.id,
                      contract_number: viewContract.contract_number,
                      contract_date: viewContract.contract_date,
                      contract_type: viewContract.contract_type,
                      city: viewContract.city || 'Toshkent',
                      organization_id: viewContract.organization_id,
                      counterparty_id: viewContract.counterparty_id,
                      amount: viewContract.amount?.toString() || '',
                      status: viewContract.status,
                      product_name: viewContract.product_name || '',
                      content: viewContract.content || '',
                      spec_items: viewContract.spec_items || [],
                      qqs_enabled: viewContract.qqs_enabled || false,
                      qqs_rate: viewContract.qqs_rate || 12,
                    })
                    setModal('contract')
                  }, 100)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition">
                {T(t.viewModal.edit)}
              </button>
              <button onClick={()=>copyContract(viewContract)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition">
                {T(t.viewModal.copy)}
              </button>
              <button onClick={()=>generatePDF(viewContract)}
                title={isFree ? 'Bepul tarif: PDF watermark bilan yuklanadi' : ''}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition">
                📥 PDF{isFree && <span className="text-yellow-300 text-xs ml-0.5">★</span>}
              </button>
              <button onClick={()=>generateDOCX(viewContract)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition">
                📄 Word
              </button>
              {!isFree && (
                <button onClick={()=>{ setModal(null); setAiContract(viewContract); setAiResult(null); setAiError(''); setAiTab('tahlil'); setAiModal(true) }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition">
                  🤖 AI
                </button>
              )}
              <button onClick={()=>setModal(null)}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition text-xl leading-none">
                ×
              </button>
            </div>
          </div>

          {/* A4 preview area */}
          <div className="flex-1 overflow-y-auto bg-gray-900 py-8 px-4">
            <div className="mx-auto"
              style={{ width: '794px', maxWidth: '100%' }}>
              {/* A4 paper */}
              <div className="bg-white shadow-2xl mx-auto"
                style={{
                  width: '794px', minHeight: '1123px',
                  padding: '72px 80px',
                  fontFamily: '"Times New Roman", Times, serif',
                  fontSize: '13px', lineHeight: '1.7',
                  color: '#111', boxSizing: 'border-box',
                }}>
                {viewContract.content ? (
                  viewContract.content.split('\n').map((line, i) => {
                    const isSectionHeader = /^\d+\. [^\d]/.test(line) && !/^\d+\.\d+/.test(line)
                    const isBand = /^\d+\.\d+\. /.test(line)
                    const isTitle = i < 5 && line.trim() && !isSectionHeader && !isBand && line === line.toUpperCase()
                    const isDash = line.trim().startsWith('—')
                    if (!line.trim()) return <div key={i} style={{ height: '0.6em' }} />
                    if (isTitle) return (
                      <div key={i} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {line}
                      </div>
                    )
                    if (isSectionHeader) return (
                      <div key={i} style={{ fontWeight: 'bold', marginTop: '18px', marginBottom: '6px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {line}
                      </div>
                    )
                    if (isBand) return (
                      <div key={i} style={{ marginBottom: '4px', paddingLeft: '8px' }}>
                        {line}
                      </div>
                    )
                    if (isDash) return (
                      <div key={i} style={{ marginBottom: '2px', paddingLeft: '16px' }}>
                        {line}
                      </div>
                    )
                    return (
                      <div key={i} style={{ marginBottom: '4px' }}>
                        {line}
                      </div>
                    )
                  })
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', marginTop: '60px', fontSize: '14px' }}>
                    Shartnoma matni mavjud emas
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SPEC MODAL ─── */}
      {specModal && (() => {
        const [specCpSearch, setSpecCpSearch] = [
          (specForm as any)._cpSearch || '',
          (v: string) => setSpecForm(f => ({ ...f, _cpSearch: v } as any))
        ]
        const filteredCps = cps.filter(cp =>
          cp.name.toLowerCase().includes(specCpSearch.toLowerCase()) ||
          (cp.inn||'').includes(specCpSearch)
        )
        const selectedCpId = (specForm as any)._cpId || ''
        const cpContracts = contracts.filter(c =>
          c.organization_id === activeOrg?.id && c.counterparty_id === selectedCpId
        )
        const asosiy = specForm.items.reduce((s,it)=>s+it.miqdori*it.narxi,0)
        const qqsJ   = specForm.items.reduce((s,it)=>s+(it.qqs_summa||0),0)
        const grand  = specForm.items.reduce((s,it)=>s+it.summa,0)
        const [barchaQ, setBarchaQ] = [
          (specForm as any)._barchaQqs || '',
          (v: string) => {
            setSpecForm(f => {
              const items = f.items.map(it => {
                const foiz = v==='siz'||v==='0' ? 0 : Number(v)
                const qqs_summa = Math.round(it.miqdori * it.narxi * foiz / 100)
                return { ...it, qqs_foiz: v, qqs_summa, summa: it.miqdori*it.narxi + qqs_summa }
              })
              return { ...f, items, _barchaQqs: v } as any
            })
          }
        ]
        const updateItem = (idx: number, patch: Partial<SpecItem>) => {
          setSpecForm(f => {
            const items = [...f.items]
            const cur = { ...items[idx], ...patch }
            const foiz = cur.qqs_foiz==='siz'||cur.qqs_foiz==='0' ? 0 : Number(cur.qqs_foiz)
            cur.qqs_summa = Math.round(cur.miqdori * cur.narxi * foiz / 100)
            cur.summa = cur.miqdori * cur.narxi + cur.qqs_summa
            items[idx] = cur
            return { ...f, items }
          })
        }
        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-6xl h-[96vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
                <h2 className="text-lg font-semibold text-white">
                  {editingSpec ? 'Spesifikatsiyani tahrirlash' : 'Yangi spesifikatsiya'}
                </h2>
                <button onClick={() => { setSpecModal(false); setEditingSpec(null) }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-lg">✕</button>
              </div>

              <form onSubmit={saveSpec} className="flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto flex-1 p-6 space-y-5">

                  {/* 1. Kontragent qidirish (STR/INN) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Kontragent (STR/INN yoki nomi)</label>
                      <input value={specCpSearch}
                        onChange={e => {
                          setSpecCpSearch(e.target.value)
                          setSpecForm(f => ({ ...f, _cpId: '', contract_id: '', spec_number: '' } as any))
                        }}
                        placeholder="STR, INN yoki tashkilot nomi..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"/>
                      {specCpSearch && filteredCps.length > 0 && !selectedCpId && (
                        <div className="mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl max-h-40 overflow-y-auto">
                          {filteredCps.slice(0,8).map(cp => (
                            <button key={cp.id} type="button"
                              onClick={() => setSpecForm(f => ({ ...f, _cpId: cp.id, _cpSearch: cp.name, contract_id: '', spec_number: '' } as any))}
                              className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm text-gray-300 flex justify-between items-center">
                              <span className="font-medium">{cp.name}</span>
                              <span className="text-xs text-gray-500">{cp.inn}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedCpId && (
                        <div className="mt-1 flex items-center gap-2 bg-blue-900/20 border border-blue-700/40 rounded-lg px-3 py-1.5">
                          <span className="text-xs text-blue-300 flex-1">{specCpSearch}</span>
                          <button type="button" onClick={() => setSpecForm(f => ({ ...f, _cpId: '', _cpSearch: '', contract_id: '', spec_number: '' } as any))}
                            className="text-gray-500 hover:text-white text-xs">✕</button>
                        </div>
                      )}
                    </div>

                    {/* 2. Shartnoma tanlash */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">
                        Shartnoma {selectedCpId ? <span className="text-red-400">*</span> : <span className="text-gray-600">(avval kontragent tanlang)</span>}
                      </label>
                      <select disabled={!selectedCpId}
                        value={specForm.contract_id}
                        onChange={e => {
                          const cid = e.target.value
                          const autoNum = cid ? nextSpecNumber(cid) : ''
                          setSpecForm(f => ({ ...f, contract_id: cid, spec_number: editingSpec ? f.spec_number : autoNum } as any))
                        }}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed">
                        <option value="">— Shartnoma tanlang —</option>
                        {cpContracts.map(c => (
                          <option key={c.id} value={c.id}>
                            №{c.contract_number} ({c.contract_date})
                          </option>
                        ))}
                        {selectedCpId && cpContracts.length === 0 && (
                          <option disabled>Bu kontragent bilan shartnoma yo'q</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Spesifikatsiya raqami + izoh */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Spesifikatsiya raqami <span className="text-red-400">*</span></label>
                      <input required value={specForm.spec_number}
                        onChange={e => setSpecForm(f => ({ ...f, spec_number: e.target.value }))}
                        placeholder="Avtomatik yoki qo'lda kiriting"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"/>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Izoh <span className="text-gray-600">(ixtiyoriy)</span></label>
                      <input value={specForm.notes}
                        onChange={e => setSpecForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="Qo'shimcha izoh"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"/>
                    </div>
                  </div>

                  {/* Items jadvali — xuddi shartnoma modal step-3 ko'rinishi */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium">Mahsulot/xizmatlar ro&apos;yxati</p>
                        <p className="text-xs text-gray-500 mt-0.5">PDFga 1-ilova sifatida qo&apos;shiladi.</p>
                      </div>
                      {specForm.items.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{T(t.contractModal.forAll)}</span>
                          <div className="flex gap-0.5 bg-gray-800 rounded-lg p-0.5">
                            {QQS_OPTIONS_GLOBAL.map(opt => (
                              <button key={opt.val} type="button"
                                onClick={() => setBarchaQ(opt.val)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${barchaQ === opt.val ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {specForm.items.length > 0 && (
                      <div className="rounded-xl border border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs min-w-[640px]">
                            <thead>
                              <tr className="bg-gray-800 text-gray-400 text-left border-b border-gray-700">
                                <th className="px-3 py-2.5 w-7 text-center">№</th>
                                <th className="px-2 py-2.5">Nomi *</th>
                                <th className="px-2 py-2.5 w-20">O&apos;lchov *</th>
                                <th className="px-2 py-2.5 w-24 text-right">Soni *</th>
                                <th className="px-2 py-2.5 w-24 text-right">Narx *</th>
                                <th className="px-2 py-2.5 w-20 text-center">QQS, %</th>
                                <th className="px-2 py-2.5 w-24 text-right">QQS, miqdori</th>
                                <th className="px-2 py-2.5 w-24 text-right">Jami *</th>
                                <th className="px-1 py-2.5 w-7"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {specForm.items.map((item, i) => (
                                <tr key={i} className="border-t border-gray-700/50 hover:bg-gray-800/20">
                                  <td className="px-3 py-1.5 text-gray-500 text-center">{i+1}</td>
                                  <td className="px-2 py-1.5">
                                    <input className="w-full bg-gray-800/80 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs"
                                      value={item.nomi} placeholder="Mahsulot yoki xizmat nomi"
                                      onChange={e => updateItem(i, { nomi: e.target.value })} required/>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <BirlikPicker value={item.birlik} options={BIRLIKLAR_GLOBAL}
                                      onChange={v => updateItem(i, { birlik: v })}/>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input type="number" min={0} step="any"
                                      className="w-full bg-gray-800/80 border border-gray-700 rounded px-2 py-2 text-white focus:outline-none focus:border-blue-500 text-sm font-medium text-right"
                                      value={item.miqdori} onChange={e => updateItem(i, { miqdori: parseFloat(e.target.value)||0 })}/>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input type="number" min={0} step="any"
                                      className="w-full bg-gray-800/80 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs text-right"
                                      value={item.narxi} onChange={e => updateItem(i, { narxi: parseFloat(e.target.value)||0 })}/>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <select className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white focus:outline-none focus:border-orange-500 text-xs text-center cursor-pointer"
                                      value={item.qqs_foiz} onChange={e => updateItem(i, { qqs_foiz: e.target.value })}>
                                      {QQS_OPTIONS_GLOBAL.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
                                    </select>
                                  </td>
                                  <td className="px-2 py-1.5 text-right text-orange-400 font-medium">
                                    {item.qqs_summa > 0 ? item.qqs_summa.toLocaleString() : <span className="text-gray-600">—</span>}
                                  </td>
                                  <td className="px-2 py-1.5 text-right text-white font-semibold">
                                    {item.summa.toLocaleString()}
                                  </td>
                                  <td className="px-1 py-1.5">
                                    <button type="button" onClick={() => setSpecForm(f => ({ ...f, items: f.items.filter((_,j)=>j!==i) }))}
                                      className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition">×</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t-2 border-gray-600 bg-gray-800/60 text-xs font-semibold">
                                <td colSpan={4} className="px-3 py-2.5 text-right text-gray-400">{T(t.spec.total)}:</td>
                                <td className="px-2 py-2.5 text-right text-white">{asosiy.toLocaleString()}</td>
                                <td className="px-2 py-2.5 text-center text-gray-500">—</td>
                                <td className="px-2 py-2.5 text-right text-orange-400">{qqsJ > 0 ? qqsJ.toLocaleString() : '—'}</td>
                                <td className="px-2 py-2.5 text-right text-white font-bold text-sm">{grand.toLocaleString()}</td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    <button type="button"
                      onClick={() => setSpecForm(f => ({ ...f, items: [...f.items, { nomi:'', birlik:'dona', miqdori:1, narxi:0, qqs_foiz:'siz', qqs_summa:0, summa:0 }] }))}
                      className="w-full border-2 border-dashed border-gray-700 hover:border-emerald-600 text-gray-500 hover:text-emerald-400 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
                      {T(t.contractModal.addProduct)}
                    </button>
                    {specForm.items.length === 0 && (
                      <p className="text-center text-gray-600 text-xs py-1">Ixtiyoriy — qo&apos;shmasangiz PDFda jadval bo&apos;lmaydi.</p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-800 flex-shrink-0">
                  <button type="button" onClick={() => { setSpecModal(false); setEditingSpec(null) }}
                    className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-lg text-sm transition">
                    {T(t.btn.cancel)}
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                    {saving ? T(t.btn.saving) : <><span>💾</span>{editingSpec ? T(t.btn.save) : T(t.btn.create)}</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {/* ─── CUSTOM TEMPLATE MODAL ─── */}
      {customTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[96vh] flex flex-col shadow-2xl">
            <div className="flex items-center gap-3 p-5 border-b border-gray-800 flex-shrink-0">
              <h2 className="font-bold text-white text-base flex-1">
                {editingCustomTemplate ? 'Shablonni tahrirlash' : customTplForm.name ? "Shablonni moslashtirish" : "Yangi shablon qo'shish"}
              </h2>
              <button onClick={() => { setCustomTemplateModal(false); setEditingCustomTemplate(null); setCustomTplForm(emptyCustomTpl) }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={saveCustomTemplate} className="flex-1 overflow-auto flex flex-col">
              <div className="p-5 space-y-4 flex-1 overflow-auto">
                {/* Type + Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Shartnoma turi</label>
                    <select value={customTplForm.type} onChange={e=>setCustomTplForm({...customTplForm, type: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500">
                      {Object.entries(CONTRACT_TYPES_I18N).map(([k,v]) => (
                        <option key={k} value={k}>{v[lang]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Shablon nomi *</label>
                    <input value={customTplForm.name} onChange={e=>setCustomTplForm({...customTplForm, name: e.target.value})}
                      placeholder="Masalan: Yillik xizmat shartnomasi"
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                  </div>
                </div>
                {/* Description */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Tavsif (ixtiyoriy)</label>
                  <input value={customTplForm.description} onChange={e=>setCustomTplForm({...customTplForm, description: e.target.value})}
                    placeholder="Shablon haqida qisqacha ma'lumot"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                </div>
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-gray-400">Shablon matni *</label>
                    <span className="text-xs text-gray-500">Placeolderlar: {'{{RAQAM}}'} {'{{SANA}}'} {'{{BUYURTMACHI}}'} {'{{IJROCHI}}'} {'{{SUMMA}}'}</span>
                  </div>
                  <textarea value={customTplForm.content} onChange={e=>setCustomTplForm({...customTplForm, content: e.target.value})}
                    rows={22}
                    placeholder={"SHARTNOMA MATNI\nNo {{RAQAM}}\n\n{{SHAHAR}} shahri   \"{{SANA}}\"\n\n..."}
                    className="w-full bg-gray-950 border border-gray-700 text-gray-200 rounded-xl px-4 py-3 text-xs font-mono leading-relaxed focus:outline-none focus:border-blue-500 resize-none"/>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3 text-xs text-gray-500 leading-relaxed">
                  <span className="text-gray-400 font-medium">Barcha placeholderlar: </span>
                  {'{{RAQAM}}'} — raqam &nbsp;|&nbsp; {'{{SANA}}'} — sana &nbsp;|&nbsp; {'{{SHAHAR}}'} — shahar &nbsp;|&nbsp;
                  {'{{BUYURTMACHI}}'} — tashkilot nomi &nbsp;|&nbsp; {'{{BUYURTMACHI_INN}}'} — INN &nbsp;|&nbsp; {'{{BUYURTMACHI_RAHBAR}}'} — rahbar &nbsp;|&nbsp;
                  {'{{IJROCHI}}'} — kontragent nomi &nbsp;|&nbsp; {'{{IJROCHI_INN}}'} &nbsp;|&nbsp; {'{{IJROCHI_RAHBAR}}'} &nbsp;|&nbsp;
                  {'{{SUMMA}}'} — summa raqamda &nbsp;|&nbsp; {'{{SUMMA_MATN}}'} — summa so'zda
                </div>
              </div>
              <div className="flex gap-3 p-4 border-t border-gray-800 flex-shrink-0">
                <button type="button" onClick={() => { setCustomTemplateModal(false); setEditingCustomTemplate(null); setCustomTplForm(emptyCustomTpl) }}
                  className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm font-medium transition">
                  {T(t.btn.cancel)}
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition">
                  {saving ? T(t.btn.saving) : (editingCustomTemplate ? T(t.btn.save) : T(t.btn.add))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TEMPLATE PREVIEW MODAL ─── */}
      {templatePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={()=>setTemplatePreview(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start gap-3 p-5 border-b border-gray-800 flex-shrink-0">
              <span className="text-3xl">{templatePreview.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-white text-base leading-tight">{templatePreview.name}</h2>
                <p className="text-gray-400 text-xs mt-0.5">{templatePreview.description}</p>
              </div>
              <button onClick={()=>setTemplatePreview(null)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-5">
              <pre className="text-xs text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-words bg-gray-950 rounded-xl p-4 border border-gray-800">
                {templatePreview.content}
              </pre>
            </div>
            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-gray-800 flex-shrink-0">
              <button onClick={()=>setTemplatePreview(null)}
                className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm font-medium transition">
                Yopish
              </button>
              <button
                onClick={() => {
                  setContractForm({...emptyContract, contract_type: templatePreview.type, organization_id: activeOrg?.id||'', contract_number: autoContractNum()})
                  setModal('contract')
                  setTemplatePreview(null)
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium transition">
                Shu shablon asosida shartnoma yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── AI TAHLIL MODAL ─── */}
      {aiModal && aiContract && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-white font-semibold">🤖 AI Shartnoma Tahlili</h2>
                <p className="text-gray-500 text-xs mt-0.5">#{aiContract.contract_number} · {CONTRACT_TYPES_I18N[aiContract.contract_type]?.[lang]}</p>
              </div>
              <button onClick={()=>setAiModal(false)} className="text-gray-500 hover:text-white text-xl transition">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 py-3 border-b border-gray-800">
              {([['tahlil','📊 Tahlil + Xatarlar'],['grammatika','✏️ Grammatika']] as const).map(([key, label]) => (
                <button key={key} onClick={()=>{ setAiTab(key); setAiResult(null); setAiError(''); setAiLoading(false) }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${aiTab===key ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {!aiResult && !aiLoading && !aiError && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🤖</div>
                  <p className="text-gray-400 text-sm mb-6">
                    {aiTab === 'tahlil'
                      ? "Claude AI shartnomangizni tahlil qiladi: yuridik xatarlar, zaif tomonlar va tavsiyalar beradi"
                      : "Claude AI matnidagi grammatika, imlo va uslub xatolarini topadi"}
                  </p>
                  <button onClick={()=>runAiAnalysis(aiContract, aiTab)}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-semibold transition">
                    {aiTab === 'tahlil' ? '📊 Tahlil boshlash' : '✏️ Tekshirish boshlash'}
                  </button>
                </div>
              )}

              {aiLoading && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
                  <p className="text-gray-400 text-sm">Claude AI tahlil qilmoqda...</p>
                  <p className="text-gray-600 text-xs mt-1">~10-20 soniya</p>
                </div>
              )}

              {aiError && (
                <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm">
                  ⚠️ {aiError}
                  <button onClick={()=>runAiAnalysis(aiContract, aiTab)}
                    className="block mt-3 text-red-400 hover:text-red-300 underline text-xs">Qayta urinish</button>
                </div>
              )}

              {aiResult && aiTab === 'tahlil' && (
                <div className="space-y-4">
                  {/* Umumiy baho */}
                  <div className={`rounded-xl p-4 border ${
                    aiResult.baho === 'A' ? 'bg-emerald-900/40 border-emerald-700' :
                    aiResult.baho === 'B' ? 'bg-blue-900/40 border-blue-700' :
                    aiResult.baho === 'C' ? 'bg-yellow-900/40 border-yellow-700' :
                    'bg-red-900/40 border-red-700'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-3xl font-black ${
                        aiResult.baho==='A'?'text-emerald-400':aiResult.baho==='B'?'text-blue-400':aiResult.baho==='C'?'text-yellow-400':'text-red-400'}`}>
                        {aiResult.baho}
                      </span>
                      <div>
                        <div className="text-white text-sm font-semibold">Umumiy baho</div>
                        <div className="text-gray-400 text-xs">{aiResult.umumiy}</div>
                      </div>
                    </div>
                  </div>

                  {/* Yuridik xatarlar */}
                  {aiResult.yuridik_xatarlar?.length > 0 && (
                    <div className="bg-gray-800/60 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-red-400 mb-3">⚠️ Yuridik xatarlar</h4>
                      <div className="space-y-2">
                        {aiResult.yuridik_xatarlar.map((x, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                              x.daraja.includes('yuqori')||x.daraja.includes('высокий')||x.daraja.includes('юқори') ? 'bg-red-900 text-red-300' :
                              x.daraja.includes('rta')||x.daraja.includes('редний')||x.daraja.includes('ўрта') ? 'bg-yellow-900 text-yellow-300' :
                              'bg-gray-700 text-gray-300'}`}>{x.daraja}</span>
                            <span className="text-gray-300 text-sm">{x.tavsif}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kuchli/zaif tomonlar */}
                  <div className="grid grid-cols-2 gap-3">
                    {aiResult.kuchli_tomonlar?.length > 0 && (
                      <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-emerald-400 mb-2">✅ Kuchli tomonlar</h4>
                        <ul className="space-y-1">
                          {aiResult.kuchli_tomonlar.map((s, i) => <li key={i} className="text-gray-300 text-xs">• {s}</li>)}
                        </ul>
                      </div>
                    )}
                    {aiResult.zaif_tomonlar?.length > 0 && (
                      <div className="bg-orange-900/30 border border-orange-800/50 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-orange-400 mb-2">⚡ Zaif tomonlar</h4>
                        <ul className="space-y-1">
                          {aiResult.zaif_tomonlar.map((s, i) => <li key={i} className="text-gray-300 text-xs">• {s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Tavsiyalar */}
                  {aiResult.tavsiyalar?.length > 0 && (
                    <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-blue-400 mb-2">💡 Tavsiyalar</h4>
                      <ul className="space-y-1.5">
                        {aiResult.tavsiyalar.map((s, i) => <li key={i} className="text-gray-300 text-sm">• {s}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Grammatika (tahlildan) */}
                  {aiResult.grammatika_xatolari?.length > 0 && (
                    <div className="bg-gray-800/60 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-gray-400 mb-2">✏️ Grammatika xatolari</h4>
                      <ul className="space-y-1">
                        {aiResult.grammatika_xatolari.map((s, i) => <li key={i} className="text-gray-400 text-xs">• {s}</li>)}
                      </ul>
                    </div>
                  )}

                  <button onClick={()=>{ setAiResult(null); runAiAnalysis(aiContract, aiTab) }}
                    className="text-xs text-purple-400 hover:text-purple-300">🔄 Qayta tahlil</button>
                </div>
              )}

              {aiResult && aiTab === 'grammatika' && (
                <div className="space-y-4">
                  <div className="bg-gray-800/60 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-2xl">✏️</span>
                    <div>
                      <div className="text-white font-semibold">{(aiResult as any).xatolar_soni ?? (aiResult as any).xatolar?.length ?? 0} ta xato topildi</div>
                      <div className="text-gray-400 text-xs">{(aiResult as any).umumiy_baho || ''}</div>
                    </div>
                  </div>
                  {((aiResult as any).xatolar as {xato:string;togri:string;izoh:string}[])?.map((x, i) => (
                    <div key={i} className="bg-gray-800/60 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-red-400 text-sm line-through">{x.xato}</span>
                        <span className="text-gray-500">→</span>
                        <span className="text-emerald-400 text-sm font-medium">{x.togri}</span>
                      </div>
                      <p className="text-gray-500 text-xs">{x.izoh}</p>
                    </div>
                  ))}
                  <button onClick={()=>{ setAiResult(null); runAiAnalysis(aiContract, aiTab) }}
                    className="text-xs text-purple-400 hover:text-purple-300">🔄 Qayta tekshirish</button>
                </div>
              )}
            </div>

            {/* Footer */}
            {aiResult && (
              <div className="px-6 py-4 border-t border-gray-800 flex justify-between items-center">
                <span className="text-xs text-gray-600">Tahlil: Claude Sonnet AI</span>
                <button onClick={()=>setAiModal(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition">
                  Yopish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {modal==='upgrade' && (() => {
        const plans = [
          {
            key: 'standart',
            name: 'Standart',
            color: 'blue',
            monthlyPrice: 99000,
            annualPrice: 990000,
            annualMonthly: 82500,
            recommended: false,
            features: [
              'Oyiga 50 ta shartnoma',
              'Watermarksiz PDF',
              'Barcha shartnoma turlari',
              "Imzo va muhr qo'shish",
              'Spesifikatsiyalar',
              'AI: kuniga 20 ta so\'rov',
            ],
          },
          {
            key: 'premium',
            name: 'Premium',
            color: 'yellow',
            monthlyPrice: 199000,
            annualPrice: 1990000,
            annualMonthly: 165833,
            recommended: true,
            features: [
              'Cheksiz shartnomalar',
              'Watermarksiz PDF',
              'Barcha shartnoma turlari',
              "Imzo va muhr qo'shish",
              'Spesifikatsiyalar',
              'AI: cheksiz so\'rovlar',
              'Word import/export',
              'Ustuvor texnik yordam',
            ],
          },
        ]
        const fmt = (n: number) => n.toLocaleString('uz-UZ')
        return (
        <Modal title="Tarifni tanlang" onClose={()=>setModal(null)} wide>
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-4">Bepul tarif: oyiga <strong className="text-white">{FREE_LIMIT} ta</strong> shartnoma. Quyidagi tariflardan birini tanlang:</p>

              {/* Oylik / Yillik toggle */}
              <div className="inline-flex items-center bg-gray-800 rounded-xl p-1 gap-1">
                <button onClick={()=>setBillingAnnual(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!billingAnnual?'bg-gray-700 text-white shadow':'text-gray-400 hover:text-white'}`}>
                  Oylik
                </button>
                <button onClick={()=>setBillingAnnual(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${billingAnnual?'bg-gray-700 text-white shadow':'text-gray-400 hover:text-white'}`}>
                  Yillik
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-semibold">2 oy tekin</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map(plan => (
                <div key={plan.key}
                  className={`relative rounded-2xl p-5 transition ${
                    plan.recommended
                      ? 'bg-gradient-to-b from-yellow-900/30 to-gray-800/60 border border-yellow-700/60'
                      : 'bg-gray-800/60 border border-gray-700 hover:border-blue-600/60'
                  }`}>
                  {plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">🔥 TAVSIYA</span>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className={`text-xs uppercase tracking-wide mb-2 font-semibold ${plan.recommended?'text-yellow-500':'text-gray-500'}`}>{plan.name}</div>
                    {billingAnnual ? (
                      <>
                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-bold text-white">{fmt(plan.annualPrice)}</span>
                          <span className="text-gray-500 text-sm mb-1">so'm/yil</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">oyiga ≈ {fmt(plan.annualMonthly)} so'm</span>
                          <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">2 oy tekin!</span>
                        </div>
                        <div className="text-xs text-gray-600 line-through mt-0.5">{fmt(plan.monthlyPrice * 12)} so'm o'rniga</div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-end gap-1">
                          <span className="text-3xl font-bold text-white">{fmt(plan.monthlyPrice)}</span>
                          <span className="text-gray-500 text-sm mb-1">so'm/oy</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">yillik: {fmt(plan.annualPrice)} so'm (2 oy tekin)</div>
                      </>
                    )}
                  </div>

                  <ul className="space-y-2 mb-5 text-sm">
                    {plan.features.map(f => (
                      <li key={f} className={`flex items-start gap-2 ${plan.recommended?'text-gray-200':'text-gray-300'}`}>
                        <span className={`mt-0.5 flex-shrink-0 ${plan.recommended?'text-yellow-400':'text-blue-400'}`}>✓</span>{f}
                      </li>
                    ))}
                  </ul>

                  <a href={`https://t.me/shartnoma_uz_support?text=${encodeURIComponent(`${plan.name} tarif (${billingAnnual?'yillik':'oylik'}) — ${billingAnnual?fmt(plan.annualPrice):fmt(plan.monthlyPrice)} so'm`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className={`block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition ${
                      plan.recommended
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-lg shadow-yellow-900/30'
                        : 'bg-blue-700 hover:bg-blue-600 text-white'
                    }`}>
                    {plan.name} tanlash — {billingAnnual ? `${fmt(plan.annualPrice)} so'm/yil` : `${fmt(plan.monthlyPrice)} so'm/oy`}
                  </a>
                </div>
              ))}
            </div>

            {/* To'lov tartibi */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-sm text-gray-400">
              <p className="font-medium text-white mb-1.5">💳 To'lov tartibi:</p>
              <p>Telegram orqali murojaat qiling → to'lov rekvizitlari yuboriladi → 24 soat ichida tarif faollashtiriladi.</p>
              <a href="https://t.me/shartnoma_uz_support" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-blue-400 hover:text-blue-300 transition text-xs font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
                @shartnoma_uz_support
              </a>
            </div>

            <button onClick={()=>setModal(null)}
              className="w-full border border-gray-700 text-gray-400 hover:bg-gray-800 py-2.5 rounded-xl text-sm transition">
              Keyinroq
            </button>
          </div>
        </Modal>
        )
      })()}
    </div>
  )
}

function Modal({ title, onClose, children, wide }: {
  title: string; onClose: ()=>void; children: React.ReactNode; wide?: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-900 border border-gray-800 rounded-2xl w-full ${wide?'max-w-2xl':'max-w-lg'} max-h-[90vh] flex flex-col shadow-2xl`}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-xl">×</button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

function ModalActions({ onClose, saving }: { onClose: ()=>void; saving: boolean }) {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onClose} className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition">
        {T(t.btn.cancel)}
      </button>
      <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
        {saving ? T(t.btn.saving) : T(t.btn.save)}
      </button>
    </div>
  )
}

// ─── Birlik qidiruvli dropdown ────────────────────────────
function BirlikPicker({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = search.trim()
    ? options.filter(b => b.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <div ref={ref} className="relative">
      <input
        className="w-full bg-gray-800/80 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs text-center cursor-pointer"
        value={open ? search : value}
        placeholder={open ? 'Izlash...' : 'dona'}
        onFocus={() => { setOpen(true); setSearch('') }}
        onChange={e => setSearch(e.target.value)}
      />
      {open && (
        <div className="absolute z-50 top-full left-0 mt-0.5 bg-gray-850 border border-gray-600 rounded-lg shadow-2xl max-h-44 overflow-y-auto min-w-[130px]"
          style={{ background: '#1a2236' }}>
          {filtered.length > 0 ? filtered.map(b => (
            <button key={b} type="button"
              className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-blue-600 hover:text-white transition-colors"
              onMouseDown={() => { onChange(b); setOpen(false); setSearch('') }}>
              {b}
            </button>
          )) : (
            <div className="px-3 py-2 text-xs text-gray-500 text-center">Topilmadi</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Shared constants ─────────────────────────────────────
const BIRLIKLAR_GLOBAL = [
  'dona','juft','komplekt',"to'plam","o'ram",'rull','quti','xalta','paket',"bo'lak",'varaq',
  'kg','g','tonna','sentner',
  'litr','ml','dekalitr',
  'metr','sm','mm','km',
  'm²','m³','sm²','sm³',
  'gektar','sotix',
  'soat','kun','hafta','oy','yil',
  'ta','marta','xizmat','loyiha','bosqich','tur',
]
const QQS_OPTIONS_GLOBAL = [
  { val: 'siz', label: 'QQSsiz' },
  { val: '0',   label: '0%' },
  { val: '12',  label: '12%' },
  { val: '15',  label: '15%' },
]

// ─── Contract Modal ───────────────────────────────────────
function ContractModal({ orgs, cps, form, setForm, onSave, onClose, saving, inp, lbl, onCpAdded, customTemplates }: {
  orgs: Org[]; cps: Counterparty[]
  form: any; setForm: (f: any) => void
  onSave: (e: React.FormEvent) => void
  onClose: () => void; saving: boolean
  inp: string; lbl: string
  onCpAdded: (cp: Counterparty) => void
  customTemplates: AppTemplate[]
}) {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const [step, setStep] = useState<1|2|3|4>(1)
  const [useTemplate, setUseTemplate] = useState(true)
  const [selectedTplId, setSelectedTplId] = useState<string>('')
  const [structure, setStructure] = useState<ContractStructure>({ bolimlar: [] })
  const [specItems, setSpecItems] = useState<SpecItem[]>(form.spec_items || [])
  const [barchaQqs, setBarchaQqs] = useState('')
  const [extraFields, setExtraFields] = useState<Record<string, string>>({})
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({})

  // Kontragent qidiruv
  const [cpSearch, setCpSearch] = useState('')
  const [cpDropOpen, setCpDropOpen] = useState(false)
  const filteredCpsInModal = cpSearch.trim()
    ? cps.filter(c => c.name.toLowerCase().includes(cpSearch.toLowerCase()) || (c.inn||'').includes(cpSearch))
    : cps
  const selectedCp = cps.find(c => c.id === form.counterparty_id)

  // Tez kontragent qo'shish
  const [quickCpOpen, setQuickCpOpen] = useState(false)
  const [quickCpSaving, setQuickCpSaving] = useState(false)
  const emptyQCp = { name:'', inn:'', director_name:'', bank_name:'', bank_account:'', mfo:'', address:'', phone:'', qqsreg:'' }
  const [quickCpForm, setQuickCpForm] = useState(emptyQCp)

  async function saveQuickCp(e: React.FormEvent) {
    e.preventDefault()
    if (!quickCpForm.name.trim()) return
    setQuickCpSaving(true)
    const { data, error } = await supabase.from('counterparties').insert({
      name: quickCpForm.name,
      inn: quickCpForm.inn || null,
      director_name: quickCpForm.director_name || null,
      bank_name: quickCpForm.bank_name || null,
      bank_account: quickCpForm.bank_account || null,
      mfo: quickCpForm.mfo || null,
      address: quickCpForm.address || null,
      phone: quickCpForm.phone || null,
      qqsreg: quickCpForm.qqsreg || null,
    }).select().single()
    setQuickCpSaving(false)
    if (!error && data) {
      onCpAdded(data as Counterparty)
      setQuickCpOpen(false)
      setQuickCpForm(emptyQCp)
      setCpSearch(data.name)
    }
  }

  const BIRLIKLAR = [
    'dona','juft','komplekt',"to'plam","o'ram",'rull','quti','xalta','paket',"bo'lak",'varaq',
    'kg','g','tonna','sentner',
    'litr','ml','dekalitr',
    'metr','sm','mm','km',
    'm²','m³','sm²','sm³',
    'gektar','sotix',
    'soat','kun','hafta','oy','yil',
    'ta','marta','xizmat','loyiha','bosqich','tur',
  ]
  const QQS_OPTIONS = [
    { val: 'siz', label: 'QQSsiz' },
    { val: '0',   label: '0%' },
    { val: '12',  label: '12%' },
    { val: '15',  label: '15%' },
  ]

  type ExtraFieldCfg = { key: string; label: string; placeholder?: string; type?: 'text'|'number'|'date'|'textarea'; required?: boolean }
  const EXTRA_FIELDS_CONFIG: Record<string, ExtraFieldCfg[]> = {
    ijara: [
      { key: 'ijara_manzil', label: "Ijara ob'ekti manzili", placeholder: "Toshkent sh., Chilonzor t., 5-uy, 1-xona", type: 'text', required: true },
      { key: 'ijara_maydon', label: "Maydon (m²)", placeholder: "50", type: 'number' },
      { key: 'oylik_tolov', label: "Oylik ijara haqi (so'm)", placeholder: "2000000", type: 'number', required: true },
      { key: 'ijara_muddat', label: "Ijara muddati (oy soni)", placeholder: "12", type: 'number' },
      { key: 'ijara_boshlanish', label: "Ijara boshlanish sanasi", type: 'date' },
      { key: 'ijara_tugash', label: "Ijara tugash sanasi", type: 'date' },
    ],
    xizmat: [
      { key: 'xizmat_tavsif', label: "Ko'rsatiladigan xizmat tavsifi", placeholder: "Masalan: veb-sayt yaratish, buxgalteriya xizmati...", type: 'textarea', required: true },
      { key: 'xizmat_boshlanish', label: "Xizmat boshlanish sanasi", type: 'date' },
      { key: 'xizmat_tugash', label: "Xizmat tugash sanasi", type: 'date' },
      { key: 'xizmat_tolov', label: "To'lov tartibi", placeholder: "Oyiga bir marta, xizmat ko'rsatilgandan so'ng 5 kun ichida", type: 'textarea' },
    ],
    pudrat: [
      { key: 'pudrat_obekt', label: "Qurilish ob'ekti manzili", placeholder: "Toshkent sh., Yunusobod t., Amir Temur ko'ch., 45", type: 'text', required: true },
      { key: 'pudrat_tavsif', label: "Bajariladigan ishlar tavsifi", placeholder: "3-qavatli turar-joy binosi qurilishi, yer osti ishlari", type: 'textarea' },
      { key: 'pudrat_boshlanish', label: "Ishlar boshlanish sanasi", type: 'date' },
      { key: 'pudrat_tugash', label: "Ishlar tugash sanasi", type: 'date' },
    ],
    moliyaviy: [
      { key: 'qarz_maqsad', label: "Qarz maqsadi", placeholder: "Biznes faoliyatini kengaytirish uchun", type: 'textarea' },
      { key: 'qarz_foiz', label: "Foiz shartlari", placeholder: "Foizsiz beriladi / yillik 15% foiz bilan", type: 'text' },
      { key: 'qarz_muddat', label: "Qaytarish muddati", placeholder: "12 oy", type: 'text' },
      { key: 'qarz_tartib', label: "Qaytarish tartibi", placeholder: "Har oyning 25-sanasida teng qismlarda", type: 'textarea' },
    ],
    daval: [
      { key: 'daval_material', label: "Xom ashyo (material) nomi", placeholder: "G'o'za tolasi, jun, charm...", type: 'text', required: true },
      { key: 'daval_miqdor', label: "Material miqdori", placeholder: "100 kg", type: 'text' },
      { key: 'daval_mahsulot', label: "Tayyor mahsulot nomi", placeholder: "Ip gazlama, poyabzal...", type: 'text' },
      { key: 'daval_muddat', label: "Qayta ishlash muddati", placeholder: "30 kalendar kuni", type: 'text' },
    ],
    xalqaro: [
      { key: 'incoterms', label: "INCOTERMS sharti", placeholder: "FOB Toshkent 2020", type: 'text' },
      { key: 'yetkazish_joy', label: "Yetkazib berish joyi", placeholder: "Toshkent port, O'zbekiston", type: 'text' },
      { key: 'tolov_usuli', label: "To'lov usuli", placeholder: "Bank o'tkazmasi (SWIFT), akkreditiv", type: 'text' },
      { key: 'valyuta', label: "Hisob-kitob valyutasi", placeholder: "USD", type: 'text' },
    ],
    qoshimcha: [
      { key: 'asosiy_raqam', label: "Asosiy shartnoma raqami", placeholder: "2025/001", type: 'text', required: true },
      { key: 'asosiy_sana', label: "Asosiy shartnoma sanasi", type: 'date', required: true },
      { key: 'ozgartirish', label: "Kiritilayotgan o'zgarishlar", placeholder: "Shartnomaning 3.1-bandiga: to'lov muddati 10 kundan 15 kunga uzaytirilsin", type: 'textarea', required: true },
    ],
    oldi_sotdi: [
      { key: 'yetkazish_muddat', label: "Yetkazib berish muddati", placeholder: "Avans to'lovidan so'ng 10 ish kuni ichida", type: 'text' },
      { key: 'yetkazish_joy', label: "Yetkazib berish joyi", placeholder: "Buyurtmachi ombori, Toshkent sh.", type: 'text' },
    ],
  }
  const currentExtraFields = EXTRA_FIELDS_CONFIG[form.contract_type] || []
  const hasExtraFields = currentExtraFields.length > 0

  // Templates matching current contract type
  const allTpls = [...DEFAULT_TEMPLATES, ...customTemplates]
  const matchingTpls = allTpls.filter(t => t.type === form.contract_type)

  // Auto-select first template when type or list changes
  useEffect(() => {
    const first = allTpls.find(t => t.type === form.contract_type)
    setSelectedTplId(first?.id || '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.contract_type, customTemplates.length])

  // Ijara: umumiy summani oylik × muddat dan avtomatik hisoblash
  useEffect(() => {
    if (form.contract_type !== 'ijara') return
    const oylik = parseFloat(extraFields.oylik_tolov || '0') || 0
    if (!oylik) return
    let months = parseInt(extraFields.ijara_muddat || '0') || 0
    if (!months && extraFields.ijara_boshlanish && extraFields.ijara_tugash) {
      const start = new Date(extraFields.ijara_boshlanish)
      const end = new Date(extraFields.ijara_tugash)
      months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    }
    if (months > 0) {
      setForm({ ...form, amount: String(oylik * months) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraFields.oylik_tolov, extraFields.ijara_muddat, extraFields.ijara_boshlanish, extraFields.ijara_tugash, form.contract_type])

  function applyTplPlaceholders(content: string, ex: Record<string, string>): string {
    const { org, cp } = buildOrgCp(form)
    const amount = parseFloat(form.amount) || 0
    const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n)
    let t = content
    t = t.replaceAll('{{RAQAM}}', form.contract_number || '___')
    t = t.replaceAll('{{SANA}}', form.contract_date || '___')
    t = t.replaceAll('{{SHAHAR}}', form.city || 'Toshkent')
    t = t.replaceAll('{{BUYURTMACHI}}', org?.name || '___')
    t = t.replaceAll('{{BUYURTMACHI_RAHBAR}}', org?.director_name || '___')
    t = t.replaceAll('{{BUYURTMACHI_INN}}', org?.inn || '___')
    t = t.replaceAll('{{IJROCHI}}', cp?.name || '___')
    t = t.replaceAll('{{IJROCHI_RAHBAR}}', cp?.director_name || '___')
    t = t.replaceAll('{{IJROCHI_INN}}', cp?.inn || '___')
    t = t.replaceAll('{{SUMMA}}', amount ? fmt(amount) : '___')
    t = t.replaceAll('{{SUMMA_MATN}}', amount ? numberToWords(amount) : '___')
    // oylik tolov (formatted)
    const oylikVal = parseFloat(ex.oylik_tolov || '0') || 0
    t = t.replaceAll('{{OYLIK_TOLOV}}', oylikVal ? fmt(oylikVal) : '___')
    t = t.replaceAll('{{OYLIK_TOLOV_MATN}}', oylikVal ? numberToWords(oylikVal) : '___')
    // extra fields
    Object.entries(ex).forEach(([k, v]) => {
      t = t.replaceAll(`{{${k.toUpperCase()}}}`, v || '___')
    })
    return t
  }

  function textToStructure(text: string): ContractStructure {
    const lines = text.split('\n')
    const bolimlar: { sarlavha: string; bandlar: { matn: string }[] }[] = []
    let cur: { sarlavha: string; bandlar: { matn: string }[] } | null = null
    let buf = ''
    const flush = () => {
      if (buf.trim() && cur) { cur.bandlar.push({ matn: buf.trim() }); buf = '' }
    }
    for (const line of lines) {
      const isSection = /^\d+\. \S/.test(line) && !/^\d+\.\d+/.test(line)
      const isBand = /^\d+\.\d+\. /.test(line)
      if (isSection) {
        flush()
        const title = line.replace(/^\d+\. /, '').trim()
        cur = { sarlavha: title, bandlar: [] }
        bolimlar.push(cur)
      } else if (isBand) {
        flush()
        const bandText = line.replace(/^\d+\.\d+\. /, '').trim()
        if (cur) cur.bandlar.push({ matn: bandText })
      } else if (line.trim()) {
        if (cur) buf += (buf ? '\n' : '') + line.trim()
      } else {
        flush()
      }
    }
    flush()
    if (!bolimlar.length) {
      return { bolimlar: [{ sarlavha: 'SHARTNOMA MATNI', bandlar: [{ matn: text.trim() }] }] }
    }
    return { bolimlar }
  }

  function calcItem(item: SpecItem): SpecItem {
    const asosiy = item.miqdori * item.narxi
    const foiz = item.qqs_foiz === 'siz' ? 0 : parseFloat(item.qqs_foiz || '0')
    const qqs_summa = Math.round(asosiy * foiz / 100)
    return { ...item, qqs_summa, summa: asosiy + qqs_summa }
  }

  const emptySpecItem = (): SpecItem => calcItem({ nomi: '', birlik: 'dona', miqdori: 1, narxi: 0, qqs_foiz: 'siz', qqs_summa: 0, summa: 0 })

  function addSpecItem() {
    const updated = [...specItems, emptySpecItem()]
    setSpecItems(updated)
    setForm({ ...form, spec_items: updated })
  }
  function removeSpecItem(i: number) {
    const updated = specItems.filter((_, idx) => idx !== i)
    setSpecItems(updated)
    setForm({ ...form, spec_items: updated })
  }
  function updateSpecItem(i: number, field: keyof SpecItem, value: string | number) {
    const updated = specItems.map((item, idx) => {
      if (idx !== i) return item
      return calcItem({ ...item, [field]: value })
    })
    setSpecItems(updated)
    setForm({ ...form, spec_items: updated })
  }
  function applyBarchaQqs(foiz: string) {
    setBarchaQqs(foiz)
    const updated = specItems.map(item => calcItem({ ...item, qqs_foiz: foiz }))
    setSpecItems(updated)
    setForm({ ...form, spec_items: updated })
  }
  const specAsosiy   = specItems.reduce((s, it) => s + it.miqdori * it.narxi, 0)
  const specQqsJami  = specItems.reduce((s, it) => s + it.qqs_summa, 0)
  const specGrand    = specItems.reduce((s, it) => s + it.summa, 0)
  const hasAnyQqs    = specItems.some(it => it.qqs_foiz !== 'siz' && it.qqs_foiz !== '0')

  function buildOrgCp(f: any) {
    const org = orgs.find(o => o.id === f.organization_id) || null
    const cp  = cps.find(c => c.id === f.counterparty_id) || null
    return { org, cp }
  }

  function syncToContent(s: ContractStructure, f: any) {
    const { org, cp } = buildOrgCp(f)
    const typeName = CONTRACT_TYPE_NAMES[f.contract_type as keyof typeof CONTRACT_TYPE_NAMES] || f.contract_type
    const text = structureToText(s, {
      type_name: typeName,
      number: f.contract_number,
      date: f.contract_date,
      city: f.city || 'Toshkent',
      org, cp,
    })
    setForm({ ...f, content: text })
  }

  function applyStructure(s: ContractStructure) {
    setStructure(s)
    syncToContent(s, form)
  }

  const EMPTY_STRUCTURE: ContractStructure = { bolimlar: [{ sarlavha: '', bandlar: [{ matn: '' }] }] }

  function goToStep2() {
    const errors: Record<string, boolean> = {}
    if (!form.contract_number?.trim()) errors.contract_number = true
    if (!form.contract_date) errors.contract_date = true
    if (!form.organization_id) errors.organization_id = true
    if (!form.counterparty_id) errors.counterparty_id = true
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})
    if (hasExtraFields) {
      setStep(2)
    } else {
      loadTemplateAndGoToBolimlar()
    }
  }

  function loadTemplateAndGoToBolimlar() {
    if (useTemplate) {
      const tpl = allTpls.find(t => t.id === selectedTplId)
      if (tpl) {
        const processed = applyTplPlaceholders(tpl.content, extraFields)
        const s = textToStructure(processed)
        setStructure(s)
        setForm({ ...form, content: processed })
      } else {
        // fallback to contractStructures
        const { org, cp } = buildOrgCp(form)
        const amount = parseFloat(form.amount) || 0
        const s = getStructure(form.contract_type, {
          contract_number: form.contract_number, contract_date: form.contract_date,
          city: form.city || 'Toshkent',
          org_name: org?.name, org_inn: org?.inn, org_director: org?.director_name,
          cp_name: cp?.name, cp_inn: cp?.inn, cp_director: cp?.director_name,
          amount, amount_text: numberToWords(amount),
          extra: {
            ...extraFields,
            oylik_tolov: extraFields.oylik_tolov
              ? new Intl.NumberFormat('uz-UZ').format(parseFloat(extraFields.oylik_tolov) || 0)
              : '',
            oylik_tolov_matn: extraFields.oylik_tolov
              ? numberToWords(parseFloat(extraFields.oylik_tolov) || 0)
              : '',
          },
        })
        setStructure(s)
        const typeName = CONTRACT_TYPE_NAMES[form.contract_type as keyof typeof CONTRACT_TYPE_NAMES] || form.contract_type
        setForm({ ...form, content: structureToText(s, { type_name: typeName, number: form.contract_number, date: form.contract_date, city: form.city || 'Toshkent', org, cp }) })
      }
    } else {
      setStructure(EMPTY_STRUCTURE)
      setForm({ ...form, content: '' })
    }
    setStep(3)
  }

  function reloadStructure() {
    const { org, cp } = buildOrgCp(form)
    const amount = parseFloat(form.amount) || 0
    const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n)
    const oylik = parseFloat(extraFields.oylik_tolov || '0') || 0
    const tplData = {
      contract_number: form.contract_number,
      contract_date: form.contract_date,
      city: form.city || 'Toshkent',
      org_name: org?.name, org_inn: org?.inn, org_director: org?.director_name,
      cp_name: cp?.name, cp_inn: cp?.inn, cp_director: cp?.director_name,
      amount, amount_text: numberToWords(amount),
      extra: {
        ...extraFields,
        oylik_tolov: oylik ? fmt(oylik) : '',
        oylik_tolov_matn: oylik ? numberToWords(oylik) : '',
      },
    }
    const s = getStructure(form.contract_type, tplData)
    applyStructure(s)
  }

  function handleFieldChange(field: string, value: string) {
    setForm({ ...form, [field]: value })
  }

  function addBand(bi: number) {
    applyStructure({
      bolimlar: structure.bolimlar.map((b, i) =>
        i === bi ? { ...b, bandlar: [...b.bandlar, { matn: '' }] } : b
      )
    })
  }

  function removeBand(bi: number, bdi: number) {
    applyStructure({
      bolimlar: structure.bolimlar.map((b, i) =>
        i === bi ? { ...b, bandlar: b.bandlar.filter((_, j) => j !== bdi) } : b
      )
    })
  }

  function updateBand(bi: number, bdi: number, value: string) {
    applyStructure({
      bolimlar: structure.bolimlar.map((b, i) =>
        i === bi ? { ...b, bandlar: b.bandlar.map((band, j) => j === bdi ? { matn: value } : band) } : b
      )
    })
  }

  function updateSarlavha(bi: number, value: string) {
    applyStructure({
      bolimlar: structure.bolimlar.map((b, i) => i === bi ? { ...b, sarlavha: value } : b)
    })
  }

  function addBolim() {
    applyStructure({
      bolimlar: [...structure.bolimlar, { sarlavha: '', bandlar: [{ matn: '' }] }]
    })
  }

  function removeBolim(bi: number) {
    applyStructure({ bolimlar: structure.bolimlar.filter((_, i) => i !== bi) })
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-semibold text-white">{form.id ? T(t.contractModal.editTitle) : T(t.contractModal.newTitle)}</h2>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-0.5">
              <button type="button" onClick={() => setStep(1)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${step===1 ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                {T(t.modal.step1)}
              </button>
              {hasExtraFields && (
                <button type="button" onClick={() => setStep(2)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${step===2 ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                  {T(t.modal.step2)}
                </button>
              )}
              <button type="button" onClick={() => { if (structure.bolimlar.length === 0) { loadTemplateAndGoToBolimlar() } else { setStep(3) } }}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${step===3 ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                {T(t.modal.step3)}
              </button>
              <button type="button" onClick={() => setStep(4)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${step===4 ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                {T(t.modal.step4)}
              </button>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-xl">×</button>
        </div>

        <form onSubmit={onSave} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">

            {/* ── 1-QADAM: Ma'lumotlar ── */}
            {step === 1 && (
              <div className="space-y-5">

                {/* Raqam / Sana / Shahar */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={lbl}><span className="text-red-400">*</span> {T(t.modal.contractNum)}</label>
                    <input className={inp + (formErrors.contract_number ? ' border-red-500 ring-1 ring-red-500' : '')}
                      placeholder="2026/001"
                      value={form.contract_number}
                      onChange={e => { handleFieldChange('contract_number', e.target.value); setFormErrors(p=>({...p, contract_number:false})) }}/>
                    {formErrors.contract_number && <p className="text-red-400 text-xs mt-1">Shartnoma raqamini kiriting</p>}
                  </div>
                  <div>
                    <label className={lbl}><span className="text-red-400">*</span> {T(t.modal.contractDate)}</label>
                    <input type="date" className={inp + (formErrors.contract_date ? ' border-red-500 ring-1 ring-red-500' : '')}
                      value={form.contract_date}
                      onChange={e => { handleFieldChange('contract_date', e.target.value); setFormErrors(p=>({...p, contract_date:false})) }}/>
                  </div>
                  <div>
                    <label className={lbl}>{T(t.modal.city)}</label>
                    <input className={inp} placeholder="Toshkent"
                      value={form.city}
                      onChange={e => handleFieldChange('city', e.target.value)}/>
                  </div>
                </div>

                {/* Shartnoma turi — ixcham select */}
                <div>
                  <label className={lbl}>{T(t.modal.contractType)} *</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(CONTRACT_TYPE_NAMES).map(([k,v]) => (
                      <button key={k} type="button"
                        onClick={() => handleFieldChange('contract_type', k)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition whitespace-nowrap ${
                          form.contract_type === k
                            ? 'border-blue-500 bg-blue-900/40 text-blue-300'
                            : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                        }`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mahsulot/xizmat nomi + Summa + Holat */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={lbl}>{T(t.modal.productName)}</label>
                    <input className={inp} placeholder="Masalan: Qurilish materiallari yoki Dasturiy ta'minot yaratish"
                      value={form.product_name || ''}
                      onChange={e => handleFieldChange('product_name', e.target.value)}/>
                  </div>
                  <div>
                    <label className={lbl}>{T(t.modal.amount)}</label>
                    <input type="number" className={inp} placeholder="5000000"
                      value={form.amount}
                      onChange={e => handleFieldChange('amount', e.target.value)}/>
                  </div>
                </div>

                {/* Tomonlar */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{T(t.contractModal.parties)}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}><span className="text-red-400">*</span> {T(t.contractModal.customer)}</label>
                      <select className={inp + (formErrors.organization_id ? ' border-red-500 ring-1 ring-red-500' : '')}
                        value={form.organization_id}
                        onChange={e => { handleFieldChange('organization_id', e.target.value); setFormErrors(p=>({...p, organization_id:false})) }}>
                        <option value="">{T(t.contractModal.selectOrg)}</option>
                        {orgs.map(o => <option key={o.id} value={o.id}>{o.name}{o.inn ? ` (${o.inn})` : ''}</option>)}
                      </select>
                      {formErrors.organization_id && <p className="text-red-400 text-xs mt-1">Tashkilotni tanlang</p>}
                      {orgs.length===0 && <p className="text-xs text-yellow-500 mt-1">{T(t.contractModal.addOrgWarn)}</p>}
                    </div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={lbl + ' mb-0'}><span className="text-red-400">*</span> {T(t.contractModal.cpLabel)}</label>
                        <button type="button" onClick={() => setQuickCpOpen(true)}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition font-medium">
                          <span className="text-base leading-none">+</span> {T(t.contractModal.addNew)}
                        </button>
                      </div>
                      {/* Tanlangan kontragent ko'rsatish */}
                      {formErrors.counterparty_id && !selectedCp && <p className="text-red-400 text-xs mb-1">Kontragentni tanlang</p>}
                      {selectedCp ? (
                        <div className="flex items-center gap-2 bg-gray-800 border border-blue-600 rounded-lg px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium truncate">{selectedCp.name}</div>
                            {selectedCp.inn && <div className="text-xs text-gray-400">STR: {selectedCp.inn}</div>}
                          </div>
                          <button type="button" onClick={() => { handleFieldChange('counterparty_id',''); setCpSearch(''); setCpDropOpen(true) }}
                            className="text-gray-400 hover:text-white text-lg leading-none flex-shrink-0">×</button>
                        </div>
                      ) : (
                        <div>
                          <input
                            value={cpSearch}
                            onChange={e => { setCpSearch(e.target.value); setCpDropOpen(true); setFormErrors(p=>({...p, counterparty_id:false})) }}
                            onFocus={() => setCpDropOpen(true)}
                            placeholder={T(t.contractModal.cpSearch)}
                            className={inp + (formErrors.counterparty_id ? ' border-red-500 ring-1 ring-red-500' : '')}
                          />
                          {cpDropOpen && (
                            <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl max-h-52 overflow-auto">
                              {filteredCpsInModal.length === 0 ? (
                                <div className="px-3 py-3 text-sm text-gray-500 text-center">
                                  {T(t.contractModal.cpNotFound)}{' '}
                                  <button type="button" onClick={() => { setQuickCpOpen(true); setCpDropOpen(false) }}
                                    className="text-blue-400 hover:text-blue-300">{T(t.contractModal.addNewLink)}</button>
                                </div>
                              ) : (
                                filteredCpsInModal.map(cp => (
                                  <button key={cp.id} type="button"
                                    onClick={() => { handleFieldChange('counterparty_id', cp.id); setCpSearch(''); setCpDropOpen(false) }}
                                    className="w-full text-left px-3 py-2.5 hover:bg-gray-700 transition border-b border-gray-700/50 last:border-0">
                                    <div className="text-sm text-white">{cp.name}</div>
                                    {cp.inn && <div className="text-xs text-gray-400">STR: {cp.inn}</div>}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Tez qo'shish modal — barcha maydonlar */}
                      {quickCpOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setQuickCpOpen(false)}>
                          <div className="bg-gray-900 border border-blue-700 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                              <div>
                                <h3 className="font-bold text-white text-base">{T(t.contractModal.newCpTitle)}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{T(t.contractModal.newCpDesc)}</p>
                              </div>
                              <button type="button" onClick={() => setQuickCpOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                              </button>
                            </div>
                            <form onSubmit={saveQuickCp}>
                              <div className="p-5 space-y-3 max-h-[70vh] overflow-auto">
                                {/* Asosiy */}
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{T(t.contractModal.basicInfo)}</p>
                                <input value={quickCpForm.name} onChange={e => setQuickCpForm({...quickCpForm, name: e.target.value})}
                                  placeholder="Tashkilot nomi *" required
                                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                                <div className="grid grid-cols-2 gap-3">
                                  <input value={quickCpForm.inn} onChange={e => setQuickCpForm({...quickCpForm, inn: e.target.value})}
                                    placeholder="STR / INN"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                                  <input value={quickCpForm.director_name} onChange={e => setQuickCpForm({...quickCpForm, director_name: e.target.value})}
                                    placeholder="Rahbar F.I.O."
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <input value={quickCpForm.phone} onChange={e => setQuickCpForm({...quickCpForm, phone: e.target.value})}
                                    placeholder="Telefon raqami"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                                  <input value={quickCpForm.qqsreg} onChange={e => setQuickCpForm({...quickCpForm, qqsreg: e.target.value})}
                                    placeholder="QQS reg. raqami"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                                </div>
                                <input value={quickCpForm.address} onChange={e => setQuickCpForm({...quickCpForm, address: e.target.value})}
                                  placeholder="Yuridik manzil"
                                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                                {/* Bank */}
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold pt-1">{T(t.contractModal.bankDetails)}</p>
                                <input value={quickCpForm.bank_name} onChange={e => setQuickCpForm({...quickCpForm, bank_name: e.target.value})}
                                  placeholder="Bank nomi"
                                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                                <div className="grid grid-cols-2 gap-3">
                                  <input value={quickCpForm.bank_account} onChange={e => setQuickCpForm({...quickCpForm, bank_account: e.target.value})}
                                    placeholder="Hisob raqami (h/r)"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                                  <input value={quickCpForm.mfo} onChange={e => setQuickCpForm({...quickCpForm, mfo: e.target.value})}
                                    placeholder="MFO"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"/>
                                </div>
                              </div>
                              <div className="flex gap-3 px-5 py-4 border-t border-gray-800">
                                <button type="button" onClick={() => setQuickCpOpen(false)}
                                  className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-2.5 rounded-xl text-sm transition">
                                  {T(t.btn.cancel)}
                                </button>
                                <button type="submit" disabled={quickCpSaving}
                                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition">
                                  {quickCpSaving ? T(t.btn.saving) : T(t.contractModal.saveSelect)}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shablon tanlash */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">{T(t.contractModal.structure)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setUseTemplate(true)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                        useTemplate
                          ? 'border-emerald-500 bg-emerald-900/20 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}>
                      <span className={`mt-0.5 text-base flex-shrink-0 ${useTemplate ? 'text-emerald-400' : 'text-gray-600'}`}>
                        {useTemplate ? '●' : '○'}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{T(t.contractModal.viaTemplate)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{T(t.contractModal.viaTemplateDesc)}</div>
                      </div>
                    </button>
                    <button type="button" onClick={() => setUseTemplate(false)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                        !useTemplate
                          ? 'border-blue-500 bg-blue-900/20 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}>
                      <span className={`mt-0.5 text-base flex-shrink-0 ${!useTemplate ? 'text-blue-400' : 'text-gray-600'}`}>
                        {!useTemplate ? '●' : '○'}
                      </span>
                      <div>
                        <div className="text-sm font-medium">{T(t.contractModal.manual)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{T(t.contractModal.manualDesc)}</div>
                      </div>
                    </button>
                  </div>

                  {/* Template list */}
                  {useTemplate && matchingTpls.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs text-gray-500 mb-2">{T(t.contractModal.selectTpl)}</p>
                      {matchingTpls.map(tpl => (
                        <button key={tpl.id} type="button"
                          onClick={() => setSelectedTplId(tpl.id)}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition ${
                            selectedTplId === tpl.id
                              ? 'border-blue-500 bg-blue-900/20'
                              : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/60'
                          }`}>
                          <span className="text-lg flex-shrink-0 mt-0.5">{tpl.icon}</span>
                          <div className="min-w-0">
                            <div className={`text-xs font-medium truncate ${selectedTplId === tpl.id ? 'text-blue-300' : 'text-gray-300'}`}>
                              {tpl.name}
                              {!tpl.isDefault && <span className="ml-1.5 text-xs text-emerald-400">{T(t.tplTab.custom)}</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tpl.description}</div>
                          </div>
                          {selectedTplId === tpl.id && (
                            <span className="text-blue-400 flex-shrink-0 mt-0.5">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {useTemplate && matchingTpls.length === 0 && form.contract_type && (
                    <p className="text-xs text-gray-500 mt-3 text-center">{T(t.contractModal.noTpl)}</p>
                  )}
                </div>

                <button type="button" onClick={goToStep2}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                  {hasExtraFields ? T(t.contractModal.goToSections) : useTemplate ? T(t.contractModal.loadAndEdit) : T(t.contractModal.openEmpty)}
                </button>
              </div>
            )}

            {/* ── 2-QADAM: Qo'shimcha maydonlar (shartnoma turiga xos) ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="text-sm font-semibold text-white">{T(t.contractModal.extraFields)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{T(t.contractModal.extraDesc)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {currentExtraFields.map((field) => (
                    <div key={field.key}>
                      <label className={lbl}>
                        {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
                          placeholder={field.placeholder}
                          value={extraFields[field.key] || ''}
                          onChange={e => setExtraFields({ ...extraFields, [field.key]: e.target.value })}
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                          placeholder={field.placeholder}
                          value={extraFields[field.key] || ''}
                          onChange={e => setExtraFields({ ...extraFields, [field.key]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}

                  {/* Ijara: umumiy summa hisob-kitobi */}
                  {form.contract_type === 'ijara' && extraFields.oylik_tolov && extraFields.ijara_muddat && (
                    <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl px-4 py-3">
                      <div className="text-xs text-blue-400 mb-1">Umumiy ijara summasi (avtomatik)</div>
                      <div className="text-white font-semibold text-sm">
                        {new Intl.NumberFormat('uz-UZ').format(
                          (parseFloat(extraFields.oylik_tolov) || 0) * (parseInt(extraFields.ijara_muddat) || 0)
                        )} so'm
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {extraFields.oylik_tolov && new Intl.NumberFormat('uz-UZ').format(parseFloat(extraFields.oylik_tolov) || 0)} so'm × {extraFields.ijara_muddat} oy
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800 transition">
                    {T(t.contractModal.back)}
                  </button>
                  <button type="button" onClick={loadTemplateAndGoToBolimlar}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                    {useTemplate ? T(t.contractModal.loadAndEdit) : T(t.contractModal.openEmpty)}
                  </button>
                </div>
              </div>
            )}

            {/* ── 3-QADAM: Bo'limlar va bandlar ── */}
            {step === 3 && (
              <div className="space-y-4">

                {/* Status bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {useTemplate ? (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-900/30 border border-emerald-700/50 text-emerald-400 px-2.5 py-1 rounded-full">
                        <span>✓</span> {T(t.contractModal.tplApplied)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs bg-blue-900/30 border border-blue-700/50 text-blue-400 px-2.5 py-1 rounded-full">
                        <span>✎</span> {T(t.contractModal.manualMode)}
                      </span>
                    )}
                    <span className="text-xs text-gray-600">{structure.bolimlar.length} bo&apos;lim</span>
                  </div>
                  {useTemplate && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-amber-900/20 border border-amber-800/40 text-amber-400 text-xs px-2.5 py-1 rounded-lg">
                        <span>💡</span>
                        <span>1-2-bosqichlarda o'zgartirish bo'lsa, «Qayta yuklash» tugmasini bosing</span>
                      </div>
                      <button type="button" onClick={reloadStructure}
                        className="text-xs text-gray-400 hover:text-blue-300 border border-gray-700 hover:border-blue-700 px-3 py-1.5 rounded-lg transition">
                        {T(t.contractModal.reload)}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bo'limlar */}
                {structure.bolimlar.map((bolim, bi) => (
                  <div key={bi} className="bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden">

                    {/* Sarlavha */}
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-800/80 border-b border-gray-700">
                      <span className="text-blue-400 font-bold text-sm w-7 flex-shrink-0 select-none">{bi+1}.</span>
                      <input
                        value={bolim.sarlavha}
                        onChange={e => updateSarlavha(bi, e.target.value)}
                        className="flex-1 bg-transparent text-white text-sm font-semibold focus:outline-none placeholder-gray-600 min-w-0"
                        placeholder={T(t.contractModal.secTitle)}
                      />
                      <button type="button" onClick={() => removeBolim(bi)}
                        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition text-lg flex-shrink-0"
                        title={T(t.contractModal.delSection)}>×</button>
                    </div>

                    {/* Bandlar */}
                    <div className="p-3 space-y-2">
                      {bolim.bandlar.map((band, bdi) => (
                        <div key={bdi} className="flex gap-2 items-start">
                          <span className="text-gray-600 text-xs font-mono w-9 pt-2.5 flex-shrink-0 text-right select-none">
                            {bi+1}.{bdi+1}.
                          </span>
                          <textarea
                            value={band.matn}
                            onChange={e => updateBand(bi, bdi, e.target.value)}
                            rows={2}
                            className="flex-1 bg-gray-800 border border-gray-700/80 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none leading-relaxed min-w-0"
                            placeholder={T(t.contractModal.clauseText)}
                          />
                          <button type="button" onClick={() => removeBand(bi, bdi)}
                            className="w-7 h-7 flex items-center justify-center rounded text-gray-700 hover:text-red-400 hover:bg-red-900/20 transition text-base flex-shrink-0 mt-1"
                            title={T(t.contractModal.delClause)}>×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addBand(bi)}
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 px-2 py-1.5 rounded-lg hover:bg-blue-900/20 transition ml-11 font-medium">
                        {T(t.contractModal.addClause)}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Bo'lim qo'shish */}
                <button type="button" onClick={addBolim}
                  className="w-full border-2 border-dashed border-gray-700 hover:border-blue-600 text-gray-500 hover:text-blue-400 py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
                  {T(t.contractModal.addSection)}
                </button>
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={() => setStep(4)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition">
                    {T(t.contractModal.toSpec)}
                  </button>
                </div>
              </div>
            )}

            {/* ── 4-QADAM: Spesifikatsiya ── */}
            {step === 4 && (
              <div className="space-y-3">
                <datalist id="birliklar-list">
                  {BIRLIKLAR.map(b => <option key={b} value={b}/>)}
                </datalist>

                {/* Sarlavha + Barcha uchun QQS */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">{T(t.contractModal.specList)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{T(t.contractModal.specAppend)}</p>
                  </div>
                  {specItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{T(t.contractModal.forAll)}</span>
                      <div className="flex gap-0.5 bg-gray-800 rounded-lg p-0.5">
                        {QQS_OPTIONS.map(opt => (
                          <button key={opt.val} type="button"
                            onClick={() => applyBarchaQqs(opt.val)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${barchaQqs === opt.val ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Jadval */}
                {specItems.length > 0 && (
                  <div className="rounded-xl border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[640px]">
                        <thead>
                          <tr className="bg-gray-800 text-gray-400 text-left border-b border-gray-700">
                            <th className="px-3 py-2.5 w-7 text-center">№</th>
                            <th className="px-2 py-2.5">Nomi *</th>
                            <th className="px-2 py-2.5 w-20">O&apos;lchov *</th>
                            <th className="px-2 py-2.5 w-24 text-right">Soni *</th>
                            <th className="px-2 py-2.5 w-24 text-right">Narx *</th>
                            <th className="px-2 py-2.5 w-20 text-center">QQS, %</th>
                            <th className="px-2 py-2.5 w-24 text-right">QQS, miqdori</th>
                            <th className="px-2 py-2.5 w-24 text-right">Jami *</th>
                            <th className="px-1 py-2.5 w-7"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {specItems.map((item, i) => (
                            <tr key={i} className="border-t border-gray-700/50 hover:bg-gray-800/20">
                              <td className="px-3 py-1.5 text-gray-500 text-center">{i+1}</td>
                              <td className="px-2 py-1.5">
                                <input
                                  className="w-full bg-gray-800/80 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs"
                                  value={item.nomi} placeholder="Mahsulot yoki xizmat nomi"
                                  onChange={e => updateSpecItem(i, 'nomi', e.target.value)}/>
                              </td>
                              <td className="px-2 py-1.5">
                                <BirlikPicker
                                  value={item.birlik}
                                  options={BIRLIKLAR}
                                  onChange={v => updateSpecItem(i, 'birlik', v)}
                                />
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="number"
                                  className="w-full bg-gray-800/80 border border-gray-700 rounded px-2 py-2 text-white focus:outline-none focus:border-blue-500 text-sm font-medium text-right"
                                  value={item.miqdori} min={0} step="any"
                                  onChange={e => updateSpecItem(i, 'miqdori', parseFloat(e.target.value)||0)}/>
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="number"
                                  className="w-full bg-gray-800/80 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs text-right"
                                  value={item.narxi} min={0}
                                  onChange={e => updateSpecItem(i, 'narxi', parseFloat(e.target.value)||0)}/>
                              </td>
                              <td className="px-2 py-1.5">
                                <select
                                  className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white focus:outline-none focus:border-orange-500 text-xs text-center cursor-pointer"
                                  value={item.qqs_foiz}
                                  onChange={e => updateSpecItem(i, 'qqs_foiz', e.target.value)}>
                                  {QQS_OPTIONS.map(opt => (
                                    <option key={opt.val} value={opt.val}>{opt.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-1.5 text-right text-orange-400 font-medium">
                                {item.qqs_summa > 0 ? item.qqs_summa.toLocaleString() : <span className="text-gray-600">—</span>}
                              </td>
                              <td className="px-2 py-1.5 text-right text-white font-semibold">
                                {item.summa.toLocaleString()}
                              </td>
                              <td className="px-1 py-1.5">
                                <button type="button" onClick={() => removeSpecItem(i)}
                                  className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition">×</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          {/* Jami qatori — Didox uslubida: label | narx jami | QQS jami | Grand total */}
                          <tr className="border-t-2 border-gray-600 bg-gray-800/60 text-xs font-semibold">
                            <td colSpan={4} className="px-3 py-2.5 text-right text-gray-400">{T(t.spec.total)}:</td>
                            <td className="px-2 py-2.5 text-right text-white">{specAsosiy.toLocaleString()}</td>
                            <td className="px-2 py-2.5 text-center text-gray-500">—</td>
                            <td className="px-2 py-2.5 text-right text-orange-400">
                              {specQqsJami > 0 ? specQqsJami.toLocaleString() : '—'}
                            </td>
                            <td className="px-2 py-2.5 text-right text-white font-bold text-sm">
                              {specGrand.toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                <button type="button" onClick={addSpecItem}
                  className="w-full border-2 border-dashed border-gray-700 hover:border-emerald-600 text-gray-500 hover:text-emerald-400 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
                  {T(t.contractModal.addProduct)}
                </button>
                {specItems.length === 0 && (
                  <p className="text-center text-gray-600 text-xs py-1">
                    {T(t.contractModal.specOptional)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-800 flex gap-3 flex-shrink-0">
            {step > 1 && step !== 2 && (
              <button type="button" onClick={() => {
                if (step === 4) setStep(3)
                else if (step === 3) setStep(hasExtraFields ? 2 : 1)
              }}
                className="px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800 transition">
                {T(t.contractModal.back)}
              </button>
            )}
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800 transition">
              {T(t.btn.cancel)}
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
              {saving ? T(t.btn.saving) : T(t.contractModal.saveContract)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
