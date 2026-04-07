'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import type { Contract } from '@/lib/types'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import { getStructure, structureToText, numberToWords, formatDateUz } from '@/lib/contractStructures'
import { type AppTemplate } from '@/lib/defaultTemplates'
import dynamic from 'next/dynamic'
import type { ContractForm } from './_components/ContractModal'
const ContractModal  = dynamic(() => import('./_components/ContractModal'),  { ssr: false })
const ViewContractModal = dynamic(() => import('./_components/ViewContractModal'), { ssr: false })
const AiModal        = dynamic(() => import('./_components/AiModal'),        { ssr: false })
import { latinToCyrillic } from '@/lib/scriptNorm'
import { fillPlaceholders } from '@/lib/contractUtils'
import { generateContractDOCX } from '@/lib/export/contractDocx'
import { logAudit } from '@/lib/audit'
import { FaTelegram, FaFilePdf } from 'react-icons/fa'
import { useToast } from '@/lib/toast'
import ConfirmModal from '../_components/ConfirmModal'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'
import { useContractSearch } from './hooks/useContractSearch'
import { useContractAi } from './hooks/useContractAi'
import {
  updateContractStatus, toggleContractSigned, notifyBothSigned,
  deleteContractById, shareByTelegram, exportContractsCSV,
} from './services/contractService'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: Record<string, Record<Lang, string>> = {
  all:       { uz: 'Barchasi',  oz: 'Барчаси',  ru: 'Все' },
  active:    { uz: 'Faol',      oz: 'Фаол',     ru: 'Активный' },
  draft:     { uz: 'Qoralama',  oz: 'Қоралама', ru: 'Черновик' },
  completed: { uz: 'Bajarildi', oz: 'Бажарилди',ru: 'Выполнен' },
  cancelled: { uz: 'Bekor',     oz: 'Бекор',    ru: 'Отменён' },
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/20 text-green-400 border border-green-500/30',
  draft:     'bg-[#1F2937] text-gray-400 border border-[#1E293B]',
  completed: 'bg-blue-900/50 text-blue-300 border border-blue-700/30',
  cancelled: 'bg-red-900/50 text-red-300 border border-red-700/30',
}

const TYPE_COLORS: Record<string, string> = {
  oldi_sotdi: 'bg-[#1F2937] text-blue-300 border border-[#1E293B]',
  xizmat:     'bg-[#1F2937] text-emerald-300 border border-[#1E293B]',
  ijara:      'bg-[#1F2937] text-cyan-300 border border-[#1E293B]',
  pudrat:     'bg-[#1F2937] text-orange-300 border border-[#1E293B]',
  qoshimcha:  'bg-[#1F2937] text-gray-400 border border-[#1E293B]',
  moliyaviy:  'bg-[#1F2937] text-yellow-300 border border-[#1E293B]',
  daval:      'bg-[#1F2937] text-teal-300 border border-[#1E293B]',
  agentlik:   'bg-[#1F2937] text-rose-300 border border-[#1E293B]',
  transport:  'bg-[#1F2937] text-slate-300 border border-[#1E293B]',
  lizing:     'bg-[#1F2937] text-amber-300 border border-[#1E293B]',
  xalqaro:    'bg-[#1F2937] text-blue-300 border border-[#1E293B]',
  boshqa:     'bg-[#1F2937] text-gray-400 border border-[#1E293B]',
}

// ─── Empty form factory ───────────────────────────────────────────────────────

// Viloyat nomidan shahar labelini chiqarish
function orgCityDefault(org: { viloyat?: string; tuman?: string } | null | undefined): string {
  if (!org) return 'Toshkent shahri'
  if (org.tuman?.trim()) return org.tuman.trim()
  const v = org.viloyat?.trim() || ''
  const MAP: Record<string, string> = {
    'Toshkent shahri': 'Toshkent shahri',
    'Toshkent viloyati': 'Toshkent shahri',
    'Samarqand': 'Samarqand shahri',
    'Buxoro': 'Buxoro shahri',
    "Farg'ona": "Farg'ona shahri",
    'Andijon': 'Andijon shahri',
    'Namangan': 'Namangan shahri',
    'Qashqadaryo': 'Qarshi shahri',
    'Surxondaryo': 'Termiz shahri',
    'Navoiy': 'Navoiy shahri',
    'Jizzax': 'Jizzax shahri',
    'Sirdaryo': 'Guliston shahri',
    'Xorazm': 'Urganch shahri',
    "Qoraqalpog'iston": 'Nukus shahri',
  }
  return MAP[v] || 'Toshkent shahri'
}

function makeEmptyForm(orgId: string, orgCity?: string): ContractForm {
  return {
    id: '',
    contract_number: '',
    contract_date: new Date().toISOString().split('T')[0],
    contract_type: 'oldi_sotdi',
    amount: '',
    organization_id: orgId,
    counterparty_id: '',
    status: 'active',
    content: '',
    city: orgCity || 'Toshkent shahri',
    product_name: '',
    spec_items: [],
    qqs_enabled: false,
    qqs_rate: 12,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShartnomalarPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const {
    contracts, contractsTotal, orgs, cps, activeOrg, subscription, isFree, bankAccounts,
    reloadContracts, loadMoreContracts, reloadCps, canCreateContract, openUpgradeModal, userId,
    hasAiAccess,
  } = useDashboard()

  // ── State ──────────────────────────────────────────────────────────────────
  const { search, setSearch, serverResults, setServerResults } = useContractSearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState<null | 'contract' | 'viewContract'>(null)
  const [contractForm, setContractForm] = useState<ContractForm>(makeEmptyForm(activeOrg?.id || '', orgCityDefault(activeOrg)))
  const [viewContract, setViewContract] = useState<Contract | null>(null)
  const [saving, setSaving] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<AppTemplate[]>([])

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  // Sort state
  const [sortCol, setSortCol] = useState<'number' | 'date' | 'amount' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [yearFilter, setYearFilter] = useState<string>('all')

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // AI state — useContractAi hook orqali boshqariladi
  const {
    aiContract, aiResult, aiError, aiLoading,
    aiTab, setAiTab,
    aiModal, setAiModal,
    fixLoading, fixResult, setFixResult,
    fixSaving,
    runAiAnalysis, fixContract, saveFixedContract,
  } = useContractAi({
    lang,
    openUpgradeModal,
    onSaved: () => { setServerResults(null); reloadContracts() },
  })

  // ── Load custom templates ──────────────────────────────────────────────────
  useEffect(() => {
    if (activeOrg?.id) loadCustomTemplates(activeOrg.id)
  }, [activeOrg?.id])

  // ── Handle from_tpl (template → contract) ─────────────────────────────────
  useEffect(() => {
    if (searchParams.get('from_tpl') !== '1') return
    const raw = localStorage.getItem('tpl_to_contract')
    if (!raw || !activeOrg) return
    if (!canCreateContract()) { openUpgradeModal(); return }
    router.push('/dashboard/shartnomalar/yangi?from_tpl=1')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeOrg])

  async function loadCustomTemplates(orgId: string) {
    const { data } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
    if (data) {
      setCustomTemplates(data.map((d: Record<string, unknown>) => ({
        id: d.id as string,
        type: d.type as string,
        name: d.name as string,
        description: (d.description as string) || '',
        content: d.content as string,
        isDefault: false,
        icon: '📄',
        tags: [],
      })))
    }
  }

  // ── Auto contract number ───────────────────────────────────────────────────
  function autoContractNum(): string {
    const year = new Date().getFullYear()
    const orgContracts = contracts.filter(c => c.organization_id === (activeOrg?.id || ''))
    const yearContracts = orgContracts.filter(c => c.contract_number?.startsWith(String(year)))
    const max = yearContracts.reduce((m, c) => {
      // Support any separator: 2026/001, 2026-001, 2026_001, etc.
      const parts = c.contract_number?.split(/[\/\-_]/)
      const n = parts ? parseInt(parts[parts.length - 1]) || 0 : 0
      return Math.max(m, n)
    }, 0)
    return `${year}/${String(max + 1).padStart(3, '0')}`
  }

  // ── Open modal ─────────────────────────────────────────────────────────────
  function openNewContract() {
    if (!canCreateContract()) { openUpgradeModal(); return }
    if (!activeOrg) { toast(T(t.msg.noOrgs), 'error'); return }
    router.push('/dashboard/shartnomalar/yangi')
  }

  // ── Save contract ──────────────────────────────────────────────────────────
  async function saveContract(contentOverride?: string) {
    if (!contractForm.organization_id) { toast(T(t.msg.selectOrg), 'error'); return }
    if (!contractForm.contract_number.trim()) { toast("Shartnoma raqami kiritilishi shart", 'error'); return }

    setSaving(true)

    // Build content if not set
    const org = orgs.find(o => o.id === contractForm.organization_id)
    const cp = cps.find(c => c.id === contractForm.counterparty_id)
    const amount = parseFloat(contractForm.amount) || 0
    let content = contentOverride ?? contractForm.content
    if (!content) {
      const structure = getStructure(contractForm.contract_type, {
        contract_number: contractForm.contract_number,
        contract_date: contractForm.contract_date,
        city: contractForm.city,
        org_name: org?.name || '',
        org_inn: org?.inn || '',
        org_director: org?.director_name || '',
        cp_name: cp?.name || '',
        cp_inn: cp?.inn || '',
        cp_director: cp?.director_name || '',
        amount,
        amount_text: amount > 0 ? numberToWords(amount, 'uz') + " so'm" : '___',
        extra: (() => {
          const ex: Record<string, string> = {
            YETKAZISH_MUDDAT: contractForm.yetkazish_muddat || '20 (yigirma) ish kuni',
            QOLDIQ_QIYMAT: '___',
          }
          if (contractForm.product_name) ex.TOVAR_NOMI = contractForm.product_name
          // Agentlik
          if (contractForm.xizmat_tavsif) ex.AGENT_VAZIFA = contractForm.xizmat_tavsif
          if (contractForm.qarz_foiz) ex.AGENT_FOZ = contractForm.qarz_foiz
          if (contractForm.yetkazish_joy) ex.AGENT_HUDUD = contractForm.yetkazish_joy
          // Transport
          if (contractForm.ijara_manzil) {
            ex.YETKAZISH_JOY = contractForm.ijara_manzil
            ex.QABUL_JOY = contractForm.yetkazish_joy || '___'
          }
          // Lizing
          if (contractForm.pudrat_obekt) ex.LIZING_OBEKT = contractForm.pudrat_obekt
          if (contractForm.ijara_muddat) ex.LIZING_MUDDAT = contractForm.ijara_muddat
          if (contractForm.oylik_tolov) ex.LIZING_FOIZ = contractForm.oylik_tolov
          if (contractForm.qarz_foiz) ex.BOSHLANGICH_BADAL = contractForm.qarz_foiz
          if (contractForm.asosiy_raqam) ex.ASOSIY_RAQAM = contractForm.asosiy_raqam
          if (contractForm.asosiy_sana) ex.ASOSIY_SANA = contractForm.asosiy_sana.split('-').reverse().join('.') + '-yil'
          const parts: string[] = []
          if (contractForm.yangi_muddat) {
            const d = contractForm.yangi_muddat.split('-').reverse().join('.') + '-yil'
            parts.push(`Asosiy shartnomaning amal qilish muddati ${d} gacha uzaytirilsin`)
          }
          if (contractForm.ozgartirish) parts.push(contractForm.ozgartirish)
          if (parts.length) ex.OZGARTIRISH = parts.join('. ')
          return ex
        })(),
      })
      content = structureToText(structure, {
        type_name: (CONTRACT_TYPE_NAMES as Record<string, string>)[contractForm.contract_type] || contractForm.contract_type,
        number: contractForm.contract_number,
        date: contractForm.contract_date,
        city: contractForm.city,
        org,
        cp,
        contract_type: contractForm.contract_type,
        spec_items: contractForm.spec_items.length > 0 ? contractForm.spec_items : undefined,
      })
      if (lang === 'oz') content = latinToCyrillic(content)
    } else {
      // Template-based content: fill all {{PLACEHOLDER}} variables now so DB stores clean text
      const defaultBank = bankAccounts.find(b => b.is_default) || bankAccounts[0]
      content = fillPlaceholders(content, {
        ...contractForm,
        contract_number: contractForm.contract_number,
        contract_date: contractForm.contract_date,
        city: contractForm.city,
        amount,
        organizations: org,
        counterparties: cp,
        org_bank: defaultBank ? { bank_name: defaultBank.bank_name, account_number: defaultBank.account_number, mfo: defaultBank.mfo } : null,
      })
    }

    // Collect extra fields into extra_data
    const extra_data: Record<string, string> = {}
    const extraKeys: (keyof typeof contractForm)[] = [
      'ijara_manzil','ijara_maydon','oylik_tolov','ijara_muddat','ijara_boshlanish','ijara_tugash',
      'xizmat_tavsif','xizmat_boshlanish','xizmat_tugash','xizmat_tolov',
      'pudrat_obekt','pudrat_tavsif','pudrat_boshlanish','pudrat_tugash',
      'qarz_maqsad','qarz_foiz','qarz_muddat',
      'daval_material','daval_mahsulot','incoterms','yetkazish_joy','tolov_usuli','valyuta',
      'asosiy_raqam','asosiy_sana','ozgartirish','yangi_muddat','yetkazish_muddat','yetkazish_place',
    ]
    for (const k of extraKeys) {
      const v = contractForm[k]
      if (v) extra_data[k] = v as string
    }

    const payload = {
      contract_number: contractForm.contract_number,
      contract_date: contractForm.contract_date,
      contract_type: contractForm.contract_type,
      amount: parseFloat(contractForm.amount) || 0,
      organization_id: contractForm.organization_id,
      counterparty_id: contractForm.counterparty_id || null,
      status: contractForm.status || 'active',
      content,
      city: contractForm.city,
      product_name: contractForm.product_name,
      spec_items: contractForm.spec_items,
      qqs_enabled: contractForm.qqs_enabled,
      qqs_rate: contractForm.qqs_rate,
      extra_data,
      user_id: userId,
    }

    let error: { message: string } | null = null

    if (contractForm.id) {
      // Save current version before overwriting
      const existing = contracts.find(c => c.id === contractForm.id)
      if (existing) {
        const { data: lastVer } = await supabase
          .from('contract_versions').select('version').eq('contract_id', contractForm.id)
          .order('version', { ascending: false }).limit(1).maybeSingle()
        await supabase.from('contract_versions').insert({
          contract_id: contractForm.id,
          version: (lastVer?.version ?? 0) + 1,
          content: existing.content,
          amount: existing.amount,
          status: existing.status,
          saved_by: userId,
        })
      }
      const { error: e } = await supabase.from('contracts').update(payload).eq('id', contractForm.id).eq('organization_id', activeOrg!.id)
      error = e
      if (!e) logAudit('update', 'contracts', contractForm.id, { contract_number: payload.contract_number, contract_type: payload.contract_type })
    } else {
      const { data: inserted, error: e } = await supabase.from('contracts').insert(payload).select('id').single()
      error = e
      if (!e && inserted) logAudit('create', 'contracts', inserted.id, { contract_number: payload.contract_number, contract_type: payload.contract_type })
      if (!e && subscription) {
        await supabase.from('subscriptions')
          .update({ contracts_used: (subscription.contracts_used || 0) + 1 })
          .eq('id', subscription.id)
      }
    }

    setSaving(false)
    if (error) { toast(`Xato: ${error.message}`, 'error'); return }
    setModal(null)
    setServerResults(null); reloadContracts()
  }

  // ── Update status ──────────────────────────────────────────────────────────
  async function updateStatus(id: string, status: string) {
    const err = await updateContractStatus(id, status, activeOrg!.id)
    if (err) { toast(`Xato: ${err}`, 'error'); return }
    setServerResults(null); reloadContracts()
  }

  const toggleSigned = useCallback(async (c: Contract, side: 'signed_us' | 'signed_cp') => {
    const { error, bothSigned } = await toggleContractSigned(c, side, activeOrg!.id)
    if (error) { toast(`Xato: ${error}`, 'error'); return }
    setServerResults(null); reloadContracts()
    if (bothSigned) notifyBothSigned(c.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg?.id])

  // ── Edit contract ──────────────────────────────────────────────────────────
  function openEditContract(c: Contract) {
    const form: ContractForm = {
      id: c.id,
      contract_number: c.contract_number,
      contract_date: c.contract_date,
      contract_type: c.contract_type,
      amount: String(c.amount || ''),
      organization_id: c.organization_id,
      counterparty_id: c.counterparty_id,
      status: c.status,
      content: c.content || '',
      city: c.city || '',
      product_name: c.product_name || '',
      spec_items: c.spec_items || [],
      qqs_enabled: c.qqs_enabled || false,
      qqs_rate: c.qqs_rate || 12,
      ...(c.extra_data || {}),
    }
    setContractForm(form)
    setModal('contract')
  }

  // ── Delete contract ────────────────────────────────────────────────────────
  function deleteContract(id: string) {
    setConfirmDeleteId(id)
  }

  async function doDeleteContract(id: string) {
    const contract = contracts.find(c => c.id === id)
    const err = await deleteContractById(id, activeOrg!.id, contract?.contract_number, contract?.contract_type)
    if (err) { toast(`Xato: ${err}`, 'error'); return }
    toast("Shartnoma o'chirildi", 'info')
    setServerResults(null); reloadContracts()
  }

  // ── Copy contract ──────────────────────────────────────────────────────────
  function copyContract(c: Contract) {
    if (!canCreateContract()) { openUpgradeModal(); return }
    const form: ContractForm = {
      id: '',
      contract_number: autoContractNum(),
      contract_date: new Date().toISOString().split('T')[0],
      contract_type: c.contract_type,
      amount: String(c.amount),
      organization_id: c.organization_id,
      counterparty_id: c.counterparty_id,
      status: 'draft',
      content: c.content || '',
      city: c.city || '',
      product_name: c.product_name || '',
      spec_items: c.spec_items || [],
      qqs_enabled: c.qqs_enabled || false,
      qqs_rate: c.qqs_rate || 12,
    }
    setContractForm(form)
    setModal('contract')
  }

  // ── Excel (CSV) export — contractService.ts ga ko'chirildi ──────────────────

  // ── Telegram orqali yuborish — contractService.ts ga ko'chirildi ─────────────
  const sendByTelegram = useCallback(async (c: Contract) => {
    toast('Word fayl tayyorlanmoqda...', 'info')
    const result = await shareByTelegram(c)
    if (result === 'fallback') toast("Word fayl yuklab olindi. Telegramda hamkorga yuboring.", 'info')
    else if (result === 'error') toast('Xato yuz berdi', 'error')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Filtered contracts ─────────────────────────────────────────────────────
  const orgContracts = useMemo(
    () => contracts.filter(c => !activeOrg || c.organization_id === activeOrg.id),
    [contracts, activeOrg]
  )

  const years = useMemo(
    () => Array.from(new Set(
      orgContracts.map(c => c.contract_date?.slice(0, 4)).filter(Boolean)
    )).sort((a, b) => Number(b) - Number(a)) as string[],
    [orgContracts]
  )

  const filtered = useMemo(() => {
    const base = serverResults !== null ? serverResults : orgContracts
    return base.filter(c => {
      const matchSearch = serverResults !== null || !search ||
        c.contract_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.organizations?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.counterparties?.name?.toLowerCase().includes(search.toLowerCase()) ||
        (c.product_name || '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      const matchYear = yearFilter === 'all' || c.contract_date?.startsWith(yearFilter)
      return matchSearch && matchStatus && matchYear
    })
  }, [orgContracts, serverResults, search, statusFilter, yearFilter])

  // ── Sort ───────────────────────────────────────────────────────────────────
  function toggleSort(col: 'number' | 'date' | 'amount') {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (!sortCol) return 0
    let va: string | number = '', vb: string | number = ''
    if (sortCol === 'number') { va = a.contract_number || ''; vb = b.contract_number || '' }
    else if (sortCol === 'date') { va = a.contract_date || ''; vb = b.contract_date || '' }
    else { va = Number(a.amount || 0); vb = Number(b.amount || 0) }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  }), [filtered, sortCol, sortDir])

  // ── Bulk selection ─────────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === sorted.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(sorted.map(c => c.id)))
  }

  async function bulkUpdateStatus(status: string) {
    await Promise.all([...selectedIds].map(id =>
      supabase.from('contracts').update({ status }).eq('id', id).eq('organization_id', activeOrg!.id)
    ))
    setSelectedIds(new Set())
    setServerResults(null); reloadContracts()
  }

  // ── Quota info ─────────────────────────────────────────────────────────────
  const isNearLimit = isFree && orgContracts.length >= 4

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">{T(t.contracts.title)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {orgContracts.length} ta shartnoma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportContractsCSV(sorted)}
            title="Excel (CSV) yuklab olish"
            className="flex items-center gap-1.5 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-3 py-2.5 rounded-lg text-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Excel
          </button>
          <button
            onClick={openNewContract}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            {T(t.contracts.new)}
          </button>
        </div>
      </div>

      {/* ── Quota warning ── */}
      {isNearLimit && (
        <div className="mb-4 bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-yellow-300 text-sm font-medium">Bepul limit tugayapti</p>
            <p className="text-yellow-500 text-xs mt-0.5">
              {orgContracts.length} / 5 ta shartnoma ishlatildi
            </p>
          </div>
          <button
            onClick={openUpgradeModal}
            className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition"
          >
            Tarifni yangilash
          </button>
        </div>
      )}

      {/* ── Search + filter ── */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={T(t.contracts.search)}
            className={`w-full bg-[#0F172A] border text-gray-200 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none placeholder-gray-500 ${serverResults !== null ? 'border-blue-600 focus:border-blue-400' : 'border-[#1E293B] focus:border-blue-600'}`}
          />
          {serverResults !== null ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400">
              {serverResults.length} natija
            </span>
          ) : search.length > 0 && search.length < 3 ? (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              3 ta belgi kiriting
            </span>
          ) : null}
        </div>
        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          className="bg-[#0F172A] border border-[#1E293B] text-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-600 cursor-pointer"
        >
          <option value="all">Barcha yillar</option>
          {years.map(y => (
            <option key={y} value={y}>{y}-yil</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#0F172A] border border-[#1E293B] text-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-600 cursor-pointer"
        >
          {Object.entries(STATUSES).map(([key, labels]) => (
            <option key={key} value={key}>{T(labels)}</option>
          ))}
        </select>
      </div>

      {/* ── Bulk actions bar ── */}
      {selectedIds.size > 0 && (
        <div className="mb-3 bg-blue-900/30 border border-blue-700/40 rounded-xl px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-blue-300 font-medium">{selectedIds.size} ta tanlandi</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <button onClick={() => bulkUpdateStatus('completed')}
              className="text-xs bg-green-900/40 hover:bg-green-800/50 border border-green-700/40 text-green-300 px-3 py-1.5 rounded-lg transition">
              Bajarildi
            </button>
            <button onClick={() => bulkUpdateStatus('cancelled')}
              className="text-xs bg-red-900/40 hover:bg-red-800/50 border border-red-700/40 text-red-300 px-3 py-1.5 rounded-lg transition">
              Bekor qilish
            </button>
            <button onClick={() => bulkUpdateStatus('draft')}
              className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg transition">
              Qoralama
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-500 hover:text-gray-300 transition ml-1">
              Bekor
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">{T(t.contracts.empty)}</p>
            <button onClick={openNewContract} className="mt-3 text-blue-400 hover:text-blue-300 text-sm">
              {T(t.contracts.new)}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E293B] text-xs text-gray-500 bg-[#0F172A]">
                  <th className="px-3 py-3 w-8">
                    <input type="checkbox" checked={sorted.length > 0 && selectedIds.size === sorted.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[#1E293B] bg-[#0F172A] accent-blue-600 cursor-pointer" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium cursor-pointer select-none hover:text-white transition"
                    onClick={() => toggleSort('number')}>
                    {T(t.contracts.number)}{sortCol === 'number' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell cursor-pointer select-none hover:text-white transition"
                    onClick={() => toggleSort('date')}>
                    {T(t.contracts.date)}{sortCol === 'date' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{T(t.contracts.type)}</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">{T(t.contracts.counterparty)}</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell cursor-pointer select-none hover:text-white transition"
                    onClick={() => toggleSort('amount')}>
                    {T(t.contracts.amount)}{sortCol === 'amount' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                  <th className="text-left px-4 py-3 font-medium">{T(t.contracts.status)}</th>
                  <th className="text-left px-4 py-3 font-medium">{T(t.contracts.actions)}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c.id} className={`border-b border-[#1E293B] hover:bg-[#1F2937] transition ${selectedIds.has(c.id) ? 'bg-blue-900/10' : ''}`}>
                    {/* Checkbox */}
                    <td className="px-3 py-3 w-8">
                      <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)}
                        className="rounded border-[#1E293B] bg-[#0F172A] accent-blue-600 cursor-pointer" />
                    </td>
                    {/* Number */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">{c.contract_number}</span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-400">{formatDateUz(c.contract_date)}</span>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[c.contract_type] || 'bg-gray-700 text-gray-300'}`}>
                        {CONTRACT_TYPES_I18N[c.contract_type] ? T(CONTRACT_TYPES_I18N[c.contract_type]) : c.contract_type}
                      </span>
                    </td>
                    {/* Counterparty */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-300 truncate max-w-[120px] block">
                        {c.counterparties?.name || '—'}
                      </span>
                    </td>
                    {/* Amount */}
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-sm text-white font-medium">
                        {c.amount ? `${Number(c.amount).toLocaleString()} so'm` : '—'}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium w-fit ${STATUS_COLORS[c.status] || 'bg-gray-700 text-gray-300'}`}>
                          {STATUSES[c.status] ? T(STATUSES[c.status]) : c.status}
                        </span>
                        <span className="text-xs text-gray-600">
                          {c.signed_us ? '✅Biz' : '⬜Biz'} {c.signed_cp ? '✅KG' : '⬜KG'}
                        </span>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {/* Edit */}
                        <button
                          title="Tahrirlash"
                          onClick={() => openEditContract(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        {/* View */}
                        <button
                          title="Ko'rish"
                          onClick={() => { setViewContract(c); setModal('viewContract') }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {/* DOCX — primary */}
                        <button
                          title="Word yuklab olish"
                          onClick={() => generateContractDOCX(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-500/10 transition"
                        >
                          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                            <rect width="24" height="24" rx="3" fill="#2B7CD3"/>
                            <text x="3.5" y="17" fontFamily="Arial" fontWeight="bold" fontSize="14" fill="white">W</text>
                          </svg>
                        </button>
                        {/* Word → PDF */}
                        <a
                          href="https://www.ilovepdf.com/ru/word_to_pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Word faylni PDF ga o'tkazish"
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-orange-500/10 transition"
                        >
                          <FaFilePdf className="w-4 h-4 text-orange-400" />
                        </a>
                        {/* AI (ai_pro only) */}
                        {hasAiAccess() && (
                          <button
                            title="AI Tahlil"
                            onClick={() => runAiAnalysis(c, 'tahlil')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-400/10 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </button>
                        )}
                        {/* Copy */}
                        <button
                          title="Nusxa olish"
                          onClick={() => copyContract(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-green-400 hover:bg-green-400/10 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {/* Telegram */}
                        <button
                          title="Telegram orqali yuborish"
                          onClick={() => sendByTelegram(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sky-500/10 transition"
                        >
                          <FaTelegram className="w-4 h-4 text-[#2AABEE]" />
                        </button>
                        {/* Done */}
                        {c.status !== 'completed' && c.status !== 'cancelled' && (
                          <button
                            title="Bajarildi"
                            onClick={() => updateStatus(c.id, 'completed')}
                            className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg text-gray-400 hover:text-green-400 hover:bg-[#1F2937] transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        {/* Cancel */}
                        {c.status !== 'cancelled' && c.status !== 'completed' && (
                          <button
                            title="Bekor qilish"
                            onClick={() => setConfirmCancelId(c.id)}
                            className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-[#1F2937] transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                        {/* Delete */}
                        <button
                          title="O'chirish"
                          onClick={() => deleteContract(c.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#1F2937] transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Load more ── */}
      {contracts.length < contractsTotal && (
        <div className="mt-3 text-center">
          <button onClick={loadMoreContracts}
            className="text-xs text-gray-400 hover:text-white bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] px-4 py-2 rounded-lg transition">
            Ko&apos;proq yuklash ({contracts.length} / {contractsTotal})
          </button>
        </div>
      )}

      {/* ── Total for active contracts ── */}
      {filtered.length > 0 && (
        <div className="mt-3 text-right text-xs text-gray-500">
          {T(t.contracts.total)}{' '}
          <span className="text-white font-medium">
            {filtered.filter(c => c.status === 'active').reduce((s, c) => s + Number(c.amount || 0), 0).toLocaleString()} so'm
          </span>
        </div>
      )}

      {/* ── Contract create/edit modal ── */}
      {modal === 'contract' && (
        <ContractModal
          orgs={orgs}
          cps={cps}
          form={contractForm}
          setForm={setContractForm}
          onSave={saveContract}
          onClose={() => setModal(null)}
          saving={saving}
          customTemplates={customTemplates}
          onCpAdded={() => reloadCps()}
        />
      )}

      {/* ── View contract modal ── */}
      {modal === 'viewContract' && viewContract && (
        <ViewContractModal
          viewContract={viewContract}
          onClose={() => setModal(null)}
          onGenerateDOCX={generateContractDOCX}
          onGeneratePDF={async () => { window.open('https://www.ilovepdf.com/ru/word_to_pdf', '_blank') }}
          onSendByTelegram={sendByTelegram}
          onRunAiAnalysis={runAiAnalysis}
          onToggleSigned={toggleSigned}
          isPremium={hasAiAccess()}
        />
      )}

      {/* ── AI modal ── */}
      {aiModal && (
        <AiModal
          aiContract={aiContract}
          aiLoading={aiLoading}
          aiError={aiError}
          aiResult={aiResult}
          aiTab={aiTab}
          onTabChange={setAiTab}
          onClose={() => { setAiModal(false); setFixResult(null) }}
          onRunAiAnalysis={runAiAnalysis}
          fixLoading={fixLoading}
          fixResult={fixResult}
          fixSaving={fixSaving}
          onFix={fixContract}
          onSaveFixed={saveFixedContract}
        />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message={T(t.contracts.deleteConfirm)}
          onConfirm={() => { const id = confirmDeleteId; setConfirmDeleteId(null); doDeleteContract(id) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {confirmCancelId && (
        <ConfirmModal
          message="Shartnomani bekor qilmoqchimisiz?"
          onConfirm={() => { const id = confirmCancelId; setConfirmCancelId(null); updateStatus(id, 'cancelled') }}
          onCancel={() => setConfirmCancelId(null)}
        />
      )}
    </div>
  )
}
