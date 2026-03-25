'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import type { Contract } from '@/lib/types'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import { getStructure, structureToText, numberToWords, formatDateUz } from '@/lib/contractStructures'
import { type AppTemplate } from '@/lib/defaultTemplates'
import ContractModal, { type ContractForm } from './_components/ContractModal'
import ViewContractModal from './_components/ViewContractModal'
import AiModal from './_components/AiModal'
import { cyrillicToLatin } from '@/lib/downloadUtils'
import { latinToCyrillic } from '@/lib/scriptNorm'
import { fillPlaceholders } from '@/lib/contractUtils'
import { fetchAi } from '@/lib/fetchAi'
import { logAudit } from '@/lib/audit'
import { useToast } from '@/lib/toast'
import ConfirmModal from '../_components/ConfirmModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTRACT_TYPES_I18N: Record<string, Record<Lang, string>> = {
  oldi_sotdi: { uz: 'Oldi-sotdi',          oz: 'Олди-сотди',          ru: 'Купля-продажа' },
  xizmat:     { uz: "Xizmat ko'rsatish",   oz: 'Хизмат кўрсатиш',    ru: 'Услуги' },
  ijara:      { uz: 'Ijara',               oz: 'Ижара',               ru: 'Аренда' },
  pudrat:     { uz: 'Pudrat',              oz: 'Пудрат',              ru: 'Подряд' },
  qoshimcha:  { uz: "Qo'shimcha",          oz: 'Қўшимча',             ru: 'Дополнительный' },
  moliyaviy:  { uz: 'Moliyaviy yordam',    oz: 'Молиявий ёрдам',      ru: 'Финансовая помощь' },
  daval:      { uz: 'Daval',               oz: 'Давал',               ru: 'Давальческий' },
  agentlik:   { uz: 'Agentlik',            oz: 'Агентлик',            ru: 'Агентский' },
  transport:  { uz: 'Transport',           oz: 'Транспорт',           ru: 'Транспортный' },
  lizing:     { uz: 'Lizing',             oz: 'Лизинг',              ru: 'Лизинг' },
  xalqaro:    { uz: 'Xalqaro',             oz: 'Халқаро',             ru: 'Международный' },
  boshqa:     { uz: 'Boshqa',              oz: 'Бошқа',               ru: 'Другой' },
}

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

function makeEmptyForm(orgId: string): ContractForm {
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
    city: 'Toshkent',
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
  const { toast } = useToast()

  const {
    contracts, contractsTotal, orgs, cps, activeOrg, subscription, isFree,
    reloadContracts, loadMoreContracts, reloadCps, canCreateContract, openUpgradeModal, userId,
    hasAiAccess,
  } = useDashboard()

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [serverResults, setServerResults] = useState<Contract[] | null>(null)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState<null | 'contract' | 'viewContract'>(null)
  const [contractForm, setContractForm] = useState<ContractForm>(makeEmptyForm(activeOrg?.id || ''))
  const [viewContract, setViewContract] = useState<Contract | null>(null)
  const [saving, setSaving] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<AppTemplate[]>([])

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  // Sort state
  const [sortCol, setSortCol] = useState<'number' | 'date' | 'amount' | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // AI state
  const [aiContract, setAiContract] = useState<Contract | null>(null)
  const [aiResult, setAiResult] = useState<unknown>(null)
  const [aiError, setAiError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTab, setAiTab] = useState<'tahlil' | 'grammatika'>('tahlil')
  const [aiModal, setAiModal] = useState(false)
  const [fixLoading, setFixLoading] = useState(false)
  const [fixResult, setFixResult] = useState<{ shartnoma_yangi: string; o_zgartirishlar: string[] } | null>(null)
  const [fixSaving, setFixSaving] = useState(false)

  // ── Load custom templates ──────────────────────────────────────────────────
  useEffect(() => {
    if (activeOrg?.id) loadCustomTemplates(activeOrg.id)
  }, [activeOrg?.id])

  // ── Handle from_tpl (template → contract) ─────────────────────────────────
  useEffect(() => {
    if (searchParams.get('from_tpl') !== '1') return
    const raw = localStorage.getItem('tpl_to_contract')
    if (!raw || !activeOrg) return
    try {
      const { type, content } = JSON.parse(raw) as { type: string; content: string }
      localStorage.removeItem('tpl_to_contract')
      if (!canCreateContract()) { openUpgradeModal(); return }
      const form = makeEmptyForm(activeOrg.id)
      form.contract_number = autoContractNum()
      form.contract_type = type || 'oldi_sotdi'
      form.content = content || ''
      setContractForm(form)
      setModal('contract')
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeOrg])

  // ── Server-side search (debounced + AbortController) ─────────────────────
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (search.length < 3) { setServerResults(null); return }
    const controller = new AbortController()
    searchDebounce.current = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        })
        if (!res.ok) { setServerResults(null); return }
        const json = await res.json()
        setServerResults(json.results ?? null)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setServerResults(null)
      }
    }, 400)
    return () => { controller.abort(); if (searchDebounce.current) clearTimeout(searchDebounce.current) }
  }, [search])  

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
    const form = makeEmptyForm(activeOrg.id)
    form.contract_number = autoContractNum()
    setContractForm(form)
    setModal('contract')
  }

  // ── Save contract ──────────────────────────────────────────────────────────
  async function saveContract(e: React.FormEvent, contentOverride?: string) {
    e.preventDefault()
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
      content = fillPlaceholders(content, {
        ...contractForm,
        contract_number: contractForm.contract_number,
        contract_date: contractForm.contract_date,
        city: contractForm.city,
        amount,
        organizations: org,
        counterparties: cp,
      })
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
      const { error: e } = await supabase.from('contracts').update(payload).eq('id', contractForm.id)
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
    reloadContracts()
  }

  // ── Update status ──────────────────────────────────────────────────────────
  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('contracts').update({ status }).eq('id', id)
    if (error) { toast(`Xato: ${error.message}`, 'error'); return }
    reloadContracts()
  }

  async function toggleSigned(c: Contract, side: 'signed_us' | 'signed_cp') {
    const { error } = await supabase.from('contracts').update({ [side]: !c[side] }).eq('id', c.id)
    if (error) { toast(`Xato: ${error.message}`, 'error'); return }
    reloadContracts()
    // If both sides are now signed, send notification email
    const newUs = side === 'signed_us' ? !c.signed_us : c.signed_us
    const newCp = side === 'signed_cp' ? !c.signed_cp : c.signed_cp
    if (newUs && newCp) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        fetch('/api/notify/signed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ contractId: c.id }),
        }).catch(() => {})
      }
    }
  }

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
    await supabase.from('contract_versions').delete().eq('contract_id', id)
    const { error } = await supabase.from('contracts').delete().eq('id', id)
    if (error) { toast(`Xato: ${error.message}`, 'error'); return }
    if (contract) logAudit('delete', 'contracts', id, { contract_number: contract.contract_number, contract_type: contract.contract_type })
    toast("Shartnoma o'chirildi", 'info')
    reloadContracts()
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

  // ── Email yuborish ─────────────────────────────────────────────────────────
  function sendByEmail(c: Contract) {
    const typeName = (CONTRACT_TYPE_NAMES as Record<string, string>)[c.contract_type] || c.contract_type
    const subject = encodeURIComponent(`Shartnoma: ${typeName} No ${c.contract_number}`)
    const body = encodeURIComponent(
      `Hurmatli ${c.counterparties?.director_name || 'hamkor'},\n\n` +
      `Sizga quyidagi shartnomani ko'rib chiqishni taklif qilamiz:\n\n` +
      `Shartnoma turi: ${typeName}\n` +
      `Raqam: ${c.contract_number}\n` +
      `Sana: ${c.contract_date}\n` +
      `Summa: ${Number(c.amount || 0).toLocaleString()} so'm\n\n` +
      `Yuboruvchi: ${c.organizations?.name || ''}\n` +
      `Direktor: ${c.organizations?.director_name || ''}\n\n` +
      `Shartnomani imzolash uchun biz bilan bog'laning.`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  // ── PDF generation ─────────────────────────────────────────────────────────
  async function generatePDF(c: Contract) {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageWidth  = doc.internal.pageSize.getWidth()   // 210
    const pageHeight = doc.internal.pageSize.getHeight()  // 297
    const ML = 25, MR = 20, MT = 20, MB = 30
    const contentWidth = pageWidth - ML - MR
    let y = MT

    // ─ Header ─
    const orgName = cyrillicToLatin(c.organizations?.name || 'Tashkilot')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    // Tashkilot nomi uzun bo'lsa wrap qiladi
    const orgNameLines = doc.splitTextToSize(orgName, contentWidth) as string[]
    for (const ln of orgNameLines) { doc.text(ln, ML, y); y += 5 }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(20, 20, 20)
    const typeName = cyrillicToLatin((CONTRACT_TYPE_NAMES as Record<string, string>)[c.contract_type] || c.contract_type)
    doc.text(typeName.toUpperCase(), pageWidth / 2, y, { align: 'center' })
    y += 7
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`No ${c.contract_number}`, pageWidth / 2, y, { align: 'center' })
    y += 5
    doc.setFontSize(9.5)
    doc.setTextColor(80, 80, 80)
    const dateStr = cyrillicToLatin(`${c.city || 'Toshkent'} shahri,  ${formatDateUz(c.contract_date)}`)
    doc.text(dateStr, pageWidth / 2, y, { align: 'center' })
    y += 6

    // ─ Divider ─
    doc.setDrawColor(180, 180, 180)
    doc.line(ML, y, pageWidth - MR, y)
    y += 7

    // ─ Content ─
    function guardY(need: number) {
      if (y + need > pageHeight - MB) { doc.addPage(); y = MT }
    }

    const rawLines = fillPlaceholders(c.content || '', c).split('\n')
    for (let li = 0; li < rawLines.length; li++) {
      const raw = rawLines[li]
      const safe = cyrillicToLatin(raw)
      const trimmed = safe.trim()

      if (!trimmed) { y += 2.5; continue }

      const isSection = /^(\d+[\.\)]\s|§\s*\d+)/.test(trimmed) ||
        (trimmed.length <= 60 && /^[A-Z\s\.\-:'"]{6,}$/.test(trimmed))
      const isLabel = /^(BUYURTMACHI|IJROCHI|TOMONLAR|M\.O\.|Imzo|Sign)/i.test(trimmed)

      if (isSection || isLabel) {
        y += 2
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(10, 10, 10)
        const wrapped = doc.splitTextToSize(trimmed, contentWidth)
        for (const wl of wrapped) { guardY(6); doc.text(wl, ML, y); y += 5.5 }
        y += 0.5
        doc.setFont('helvetica', 'normal')
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9.5)
        doc.setTextColor(30, 30, 30)
        const prevRaw = li > 0 ? rawLines[li - 1] : ''
        const indent = !prevRaw.trim() ? 8 : 0
        const firstPart = doc.splitTextToSize(trimmed, contentWidth - indent)
        guardY(5.5)
        doc.text(firstPart[0], ML + indent, y); y += 5.5
        if (firstPart.length > 1) {
          const rest = doc.splitTextToSize(firstPart.slice(1).join(' '), contentWidth)
          for (const wl of rest) { guardY(5.5); doc.text(wl, ML, y); y += 5.5 }
        }
      }
    }

    y += 8

    // ─ Spec items table ─
    if (c.spec_items && c.spec_items.length > 0) {
      if (y > pageHeight - 60) { doc.addPage(); y = MT }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(20, 20, 20)
      doc.text('SPESIFIKATSIYA', ML, y)
      y += 6

      const cols = ['#', 'Nomi', 'Birlik', 'Miqdori', 'Narxi', 'QQS%', 'Summa']
      const colW = [8, 58, 16, 18, 24, 14, 22]  // jami: 160 — ML=25 + 160 = 185 < 190 (210-20)
      const rowH = 6.5

      doc.setFont('helvetica', 'bold')
      doc.setFillColor(40, 50, 80)
      doc.setDrawColor(150, 150, 180)
      let cx = ML
      doc.setFontSize(7.5)
      doc.setTextColor(255, 255, 255)
      cols.forEach((col, i) => {
        doc.rect(cx, y, colW[i], rowH, 'FD')
        doc.text(col, cx + 1.5, y + 4.5)
        cx += colW[i]
      })
      y += rowH

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(20, 20, 20)
      let total = 0
      c.spec_items.forEach((item, idx) => {
        if (y > pageHeight - MB - 10) { doc.addPage(); y = MT }
        cx = ML
        if (idx % 2 === 0) {
          doc.setFillColor(248, 249, 255)
          doc.rect(ML, y, colW.reduce((a, b) => a + b, 0), rowH, 'F')
        }
        const rowData = [
          String(idx + 1),
          cyrillicToLatin(item.nomi || ''),
          cyrillicToLatin(item.birlik || ''),
          String(item.miqdori),
          item.narxi.toLocaleString(),
          item.qqs_foiz === 'siz' ? '-' : `${item.qqs_foiz}%`,
          item.summa.toLocaleString(),
        ]
        rowData.forEach((cell, i) => {
          doc.setDrawColor(180, 180, 200)
          doc.rect(cx, y, colW[i], rowH, 'S')
          // Matn ustiga splitTextToSize, birinchi satrini olamiz
          const cellText = doc.splitTextToSize(cell, colW[i] - 2) as string[]
          doc.text(cellText[0] || '', cx + 1.5, y + 4.5)
          cx += colW[i]
        })
        total += item.summa || 0
        y += rowH
      })

      // Jami satr
      doc.setFillColor(230, 240, 255)
      doc.rect(ML, y, colW.reduce((a, b) => a + b, 0), rowH, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      const jamiX = ML + colW[0] + colW[1] + colW[2] + colW[3] + colW[4]
      doc.text("Jami:", jamiX + 1, y + 4.5)
      doc.text(total.toLocaleString() + " so'm", jamiX + colW[5] + 1, y + 4.5)
      doc.setFont('helvetica', 'normal')
      y += rowH + 6
    }

    // ─ Imzolar ─
    if (y > pageHeight - 60) { doc.addPage(); y = MT }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(40, 40, 40)
    doc.text('TOMONLARNING IMZOLARI', pageWidth / 2, y, { align: 'center' })
    y += 8

    const leftX = ML
    const rightX = pageWidth / 2 + 10

    const sigOrgName = cyrillicToLatin(c.organizations?.name || '___')
    const sigCpName  = cyrillicToLatin(c.counterparties?.name || '___')
    const sigOrgDir  = cyrillicToLatin(c.organizations?.director_name || '___')
    const sigCpDir   = cyrillicToLatin(c.counterparties?.director_name || '___')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('BUYURTMACHI:', leftX, y)
    doc.text('IJROCHI:', rightX, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    // Uzun nomlar uchun truncate (40mm ichida)
    const orgNameShort = doc.splitTextToSize(sigOrgName, 80) as string[]
    const cpNameShort  = doc.splitTextToSize(sigCpName, 80) as string[]
    doc.text(orgNameShort[0], leftX, y)
    doc.text(cpNameShort[0], rightX, y)
    y += 6

    // ─ Imzo va muhr rasmlari ─
    async function loadImg(url: string): Promise<string | null> {
      try {
        const res = await fetch(url)
        const blob = await res.blob()
        return await new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => resolve(null)
          reader.readAsDataURL(blob)
        })
      } catch { return null }
    }

    // Rasm formatini data URL dan aniqlash (PNG yoki JPEG)
    function detectImgFormat(dataUrl: string): 'PNG' | 'JPEG' {
      return dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')
        ? 'JPEG' : 'PNG'
    }

    const signUrl = c.organizations?.signature_url
    const stampUrl = c.organizations?.stamp_url
    const [signData, stampData] = await Promise.all([
      signUrl ? loadImg(signUrl) : Promise.resolve(null),
      stampUrl ? loadImg(stampUrl) : Promise.resolve(null),
    ])

    if (y > pageHeight - MB - 25) { doc.addPage(); y = MT }
    const sigY = y
    if (signData) {
      try { doc.addImage(signData, detectImgFormat(signData), leftX, sigY, 40, 18) } catch { /* skip */ }
    }
    if (stampData) {
      try { doc.addImage(stampData, detectImgFormat(stampData), leftX + 8, sigY, 24, 24) } catch { /* skip */ }
    }
    y += 22
    doc.setDrawColor(80, 80, 80)
    doc.line(leftX, y, leftX + 70, y)
    doc.line(rightX, y, rightX + 70, y)
    y += 4
    doc.setFontSize(8)
    doc.setTextColor(40, 40, 40)
    doc.text(`/ ${sigOrgDir}`, leftX, y)
    doc.text(`/ ${sigCpDir}`, rightX, y)
    y += 5
    doc.setTextColor(100, 100, 100)
    doc.text('M.O.', leftX + 30, y)
    doc.text('M.O.', rightX + 30, y)

    // ─ Footer ─
    const totalPages = ((doc.internal as unknown) as { getNumberOfPages(): number }).getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text('Shartnoma.uz', pageWidth / 2, pageHeight - 10, { align: 'center' })
      doc.text(`${i} / ${totalPages}`, pageWidth - MR, pageHeight - 10, { align: 'right' })
    }

    doc.save(`shartnoma-${c.contract_number || 'yangi'}.pdf`)
  }

  // ── Excel (CSV) export ─────────────────────────────────────────────────────
  function exportToCSV(list: Contract[]) {
    const CONTRACT_TYPE_NAMES_LOCAL: Record<string, string> = {
      oldi_sotdi: 'Oldi-sotdi', xizmat: "Xizmat ko'rsatish", ijara: 'Ijara',
      pudrat: 'Pudrat', qoshimcha: "Qo'shimcha", moliyaviy: 'Moliyaviy yordam',
      daval: 'Daval', xalqaro: 'Xalqaro', agentlik: 'Agentlik',
      transport: 'Transport', lizing: 'Lizing', boshqa: 'Boshqa',
    }
    const headers = ['Raqam', 'Sana', 'Tur', 'Holat', 'Summa', 'Kontragent', 'Tashkilot', 'Shahar']
    const rows = list.map(c => [
      c.contract_number,
      c.contract_date,
      CONTRACT_TYPE_NAMES_LOCAL[c.contract_type] || c.contract_type,
      c.status,
      c.amount?.toLocaleString() || '0',
      c.counterparties?.name || '',
      c.organizations?.name || '',
      c.city || '',
    ])
    const bom = '\uFEFF'
    const csv = bom + [headers, ...rows].map(row => row.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'shartnomalar.csv'
    a.click(); URL.revokeObjectURL(url)
  }

  // ── DOCX generation ────────────────────────────────────────────────────────
  async function generateDOCX(c: Contract) {
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      WidthType, AlignmentType, BorderStyle, Footer, PageNumber, UnderlineType,
    } = await import('docx')

    const typeName = (CONTRACT_TYPE_NAMES as Record<string, string>)[c.contract_type] || c.contract_type
    const F = 'Times New Roman'

    // Border helpers
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
    const thinBorder = { style: BorderStyle.SINGLE, size: 6, color: '888888' }
    const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }

    // Line classifier for contract content
    function lineKind(line: string): 'empty' | 'main' | 'sub' | 'sub_label' | 'label' | 'bullet' | 'body' {
      const t = line.trim()
      if (!t || /^={3,}$|^-{3,}$/.test(t)) return 'empty'
      if (/^(\d+\.\s+\S|§\s*\d)/.test(t) && !/^\d+\.\d/.test(t)) return 'main'
      if (/^\d+\.\d+/.test(t)) return /:\s*$/.test(t) ? 'sub_label' : 'sub'
      if (/^[A-ZЎҚҒҲ][A-ZЎҚҒҲ\s]{2,20}:\s*$/.test(t)) return 'label'
      if (/^[-–•]\s/.test(t)) return 'bullet'
      return 'body'
    }

    // Rich text runs — highlights amounts (500 000 000), percentages (20%),
    // and deadline numbers (30 (o'ttiz)) in red+bold; rest in normal black.
    // UnderlineType.NONE explicitly prevents Word from auto-applying list underline.
    function richRuns(text: string, baseBold = false) {
      const base = { font: F, size: 24, color: '000000', italics: false, underline: { type: UnderlineType.NONE } }
      const pat = /(\d{1,3}(?:\s\d{3})+(?:\s*\([^)]+\))?|\d+[,.]?\d*\s*%|\d+\s*\([^)]+\))/g
      const runs = []
      let last = 0, m: RegExpExecArray | null
      while ((m = pat.exec(text)) !== null) {
        if (m.index > last) runs.push(new TextRun({ ...base, text: text.slice(last, m.index), bold: baseBold }))
        runs.push(new TextRun({ ...base, text: m[0], bold: true, color: 'CC0000' }))
        last = m.index + m[0].length
      }
      if (last < text.length) runs.push(new TextRun({ ...base, text: text.slice(last), bold: baseBold }))
      return runs.length ? runs : [new TextRun({ ...base, text, bold: baseBold })]
    }

    // ── Content cleaning ──────────────────────────────────────────────────────
    const rawLines = fillPlaceholders(c.content || '', c).split('\n')

    let startIdx = 0
    for (let i = 0; i < rawLines.length; i++) {
      const t = rawLines[i].trim()
      if (/^(\d+\.\s+[A-ZЎҚҒҲA-z]|§\s*\d)/.test(t) && !/^\d+\.\d+/.test(t)) { startIdx = i; break }
    }
    let endIdx = rawLines.length
    for (let i = 0; i < rawLines.length; i++) {
      const t = rawLines[i].trim()
      if (/^TOMONLARNING\s+(REKVIZITLARI|MA['']LUMOTLARI|IMZOLARI)/i.test(t) ||
          /^TOMONLAR\s+(IMZOSI|REKVIZIT)/i.test(t)) { endIdx = i; break }
    }

    const cleanedLines = rawLines.slice(startIdx, endIdx)

    const contentParagraphs = cleanedLines.map((line, i, arr) => {
      const t = line.trim()
      const kind = lineKind(line)

      // Empty lines: minimal height, no extra space
      if (kind === 'empty') return new Paragraph({ text: '', spacing: { after: 0, line: 80 } })

      if (kind === 'main') return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 40 },
        children: [new TextRun({ text: t, bold: true, size: 24, font: F, color: '000000' })],
      })

      if (kind === 'sub_label') return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 0, firstLine: 0 },
        spacing: { before: 20, after: 0 },
        children: [new TextRun({ text: t, bold: true, underline: {}, size: 24, font: F, color: '000000' })],
      })

      if (kind === 'sub') return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 0, firstLine: 0 },
        spacing: { before: 0, after: 10, line: 240 },
        children: richRuns(t),
      })

      if (kind === 'label') return new Paragraph({
        spacing: { before: 60, after: 10 },
        children: [new TextRun({ text: t, bold: true, size: 22, font: F, color: '000000' })],
      })

      if (kind === 'bullet') {
        const bt = t.replace(/^[-–•]\s*/, '')
        return new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 360, hanging: 180 },
          spacing: { after: 10, line: 240 },
          children: richRuns(`– ${bt}`),
        })
      }

      const prevKind = i > 0 ? lineKind(arr[i - 1]) : 'empty'
      const isStart = ['empty','main','sub','sub_label','label'].includes(prevKind)
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: isStart ? { firstLine: 360 } : {},
        spacing: { after: 10, line: 240 },
        children: richRuns(t),
      })
    })

    // City LEFT / Date RIGHT header
    const cityDateTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { after: 320 },
              children: [new TextRun({ text: `${c.city || 'Toshkent'} shahri`, size: 22, font: F })],
            })],
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 320 },
              children: [new TextRun({ text: formatDateUz(c.contract_date) || '', size: 22, font: F })],
            })],
          }),
        ],
      })],
    })

    // Party labels depend on contract type
    const partyLabels: Record<string, [string, string]> = {
      oldi_sotdi: ['SOTUVCHI', 'XARIDOR'],
      xizmat:     ['BUYURTMACHI', 'IJROCHI'],
      ijara:      ['IJARABERUVCHI', 'IJARACHI'],
      pudrat:     ['BUYURTMACHI', 'PUDRATCHI'],
    }
    const [label1, label2] = partyLabels[c.contract_type] || ['1-TOMON', '2-TOMON']

    // Org details helper — all text bold dark black, no hyperlink coloring
    const B = { font: F, color: '000000', bold: true }
    function orgCell(title: string, org: { name?: string; inn?: string; address?: string; director_name?: string; bank_name?: string; bank_account?: string; mfo?: string } | null | undefined) {
      const mfoInn = [org?.mfo ? `MFO: ${org.mfo}` : '', org?.inn ? `INN: ${org.inn}` : ''].filter(Boolean).join('   ')
      const details = [
        new Paragraph({ children: [new TextRun({ ...B, text: title, size: 24 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ ...B, text: org?.name || '___', size: 22 })], spacing: { after: 50 } }),
        ...(org?.address ? [new Paragraph({ children: [new TextRun({ ...B, text: `Manzil: ${org.address}`, size: 20 })], spacing: { after: 40 } })] : []),
        ...(org?.bank_account ? [new Paragraph({ children: [new TextRun({ ...B, text: `H/R: ${org.bank_account}`, size: 20 })], spacing: { after: 40 } })] : []),
        ...(org?.bank_name ? [new Paragraph({ children: [new TextRun({ ...B, text: `Bank: ${org.bank_name}`, size: 20 })], spacing: { after: 40 } })] : []),
        ...(mfoInn ? [new Paragraph({ children: [new TextRun({ ...B, text: mfoInn, size: 20 })], spacing: { after: 40 } })] : []),
        new Paragraph({ children: [new TextRun({ ...B, text: `Rahbar: ${org?.director_name || '___'}`, size: 20 })], spacing: { after: 160 } }),
        new Paragraph({ children: [new TextRun({ ...B, text: '_________________________', size: 22 })], spacing: { after: 20 } }),
        new Paragraph({ children: [new TextRun({ ...B, text: 'M.O.', size: 20 })], spacing: { after: 0 } }),
      ]
      return new TableCell({ borders: cellBorders, margins: { top: 160, bottom: 160, left: 220, right: 220 }, children: details })
    }

    const sigTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({
        children: [
          orgCell(label1, c.organizations),
          orgCell(label2, c.counterparties),
        ],
      })],
    })

    // Footer with page numbers
    const footer = new Footer({
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Shartnoma.uz  |  bet ', size: 18, font: F, color: '999999' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, font: F, color: '999999' }),
          new TextRun({ text: ' / ', size: 18, font: F, color: '999999' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: F, color: '999999' }),
        ],
      })],
    })

    // ── 1-ILOVA: Spec table ──────────────────────────────────────────────────
    const specItems = (c.spec_items || []) as Array<{
      nomi: string; birlik: string; miqdori: number; narxi: number
      qqs_foiz: string; qqs_summa: number; summa: number
    }>

    const headerBg = '1F3864'
    const headerCell = (text: string, w: number, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER) =>
      new TableCell({
        width: { size: w, type: WidthType.PERCENTAGE },
        shading: { fill: headerBg },
        borders: cellBorders,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({
          alignment: align,
          children: [new TextRun({ text, bold: true, size: 18, font: F, color: 'FFFFFF' })],
        })],
      })

    const dataCell = (text: string, w: number, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER, bold = false, color = '000000') =>
      new TableCell({
        width: { size: w, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        children: [new Paragraph({
          alignment: align,
          children: [new TextRun({ text, bold, size: 20, font: F, color })],
        })],
      })

    const specSection = specItems.length > 0 ? [
      // Page break before appendix
      new Paragraph({ pageBreakBefore: true, text: '' }),
      // Appendix header
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [new TextRun({ text: '1-ILOVA', bold: true, size: 22, font: F })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [new TextRun({ text: `№${c.contract_number}-sonli shartnomaga`, size: 20, font: F })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
        children: [new TextRun({ text: `${c.contract_date} dan`, size: 20, font: F })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 200 },
        children: [new TextRun({ text: 'NARXNI KELISHISH PROTOKOLI', bold: true, size: 26, font: F, underline: {} })],
      }),
      // Spec table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          // Header row
          new TableRow({
            tableHeader: true,
            children: [
              headerCell('№', 4),
              headerCell('Tovarlar (ish, xizmatlar) nomi', 26, AlignmentType.LEFT),
              headerCell("O'lchov birligi", 9),
              headerCell('Miqdori', 7),
              headerCell('Narxi (so\'m)', 12),
              headerCell('Yetkazib berish qiymati', 13),
              headerCell('QQS stavkasi', 9),
              headerCell('QQS summasi', 10),
              headerCell('QQS bilan jami', 10),
            ],
          }),
          // Data rows
          ...specItems.map((item, i) => {
            const base = item.miqdori * item.narxi
            const fmt = (n: number) => n.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            const qqs = item.qqs_foiz === 'siz' ? 'QQSsiz' : item.qqs_foiz + '%'
            return new TableRow({
              children: [
                dataCell(String(i + 1), 4),
                dataCell(item.nomi || '—', 26, AlignmentType.LEFT),
                dataCell(item.birlik || 'dona', 9),
                dataCell(String(item.miqdori), 7, AlignmentType.RIGHT),
                dataCell(fmt(item.narxi), 12, AlignmentType.RIGHT),
                dataCell(fmt(base), 13, AlignmentType.RIGHT),
                dataCell(qqs, 9),
                dataCell(fmt(item.qqs_summa), 10, AlignmentType.RIGHT),
                dataCell(fmt(item.summa), 10, AlignmentType.RIGHT, true, 'CC0000'),
              ],
            })
          }),
          // Total row
          (() => {
            const totalBase = specItems.reduce((s, i) => s + i.miqdori * i.narxi, 0)
            const totalQqs = specItems.reduce((s, i) => s + i.qqs_summa, 0)
            const totalSum = specItems.reduce((s, i) => s + i.summa, 0)
            const fmt = (n: number) => n.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            return new TableRow({
              children: [
                new TableCell({
                  columnSpan: 5,
                  borders: cellBorders,
                  shading: { fill: 'F2F2F2' },
                  margins: { top: 60, bottom: 60, left: 100, right: 100 },
                  children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: 'JAMI:', bold: true, size: 22, font: F })],
                  })],
                }),
                dataCell(fmt(totalBase), 13, AlignmentType.RIGHT, true),
                dataCell('', 9),
                dataCell(fmt(totalQqs), 10, AlignmentType.RIGHT, true),
                dataCell(fmt(totalSum), 10, AlignmentType.RIGHT, true, 'CC0000'),
              ],
            })
          })(),
        ],
      }),
      // Total in words
      new Paragraph({
        spacing: { before: 120, after: 80 },
        children: [new TextRun({
          text: `Jami so'z bilan: ${numberToWords(Math.round(specItems.reduce((s, i) => s + i.summa, 0)), 'uz')} so'm`,
          bold: true, size: 22, font: F,
        })],
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({
          text: "Ushbu Protokol Shartnomaning ajralmas qismi hisoblanadi va ikki nusxada tuzilgan.",
          size: 20, font: F, italics: true,
        })],
      }),
      // Signature table for appendix
      new Paragraph({ text: '', spacing: { after: 240 } }),
      sigTable,
    ] : []

    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 567, right: 851 } },
        },
        footers: { default: footer },
        children: [
          // Document title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: typeName.toUpperCase(), bold: true, size: 32, font: F })],
          }),
          // Contract number
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: `№ ${c.contract_number}`, bold: true, size: 26, font: F })],
          }),
          // City + Date row
          cityDateTable,
          // Content
          ...contentParagraphs,
          // Spacer before signatures
          new Paragraph({ text: '', spacing: { after: 480 } }),
          // Signature table (bordered)
          sigTable,
          // 1-ILOVA: spec table (if exists)
          ...specSection,
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shartnoma-${c.contract_number || 'yangi'}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── AI analysis ────────────────────────────────────────────────────────────
  async function runAiAnalysis(c: Contract, type: 'tahlil' | 'grammatika') {
    setAiContract(c)
    setAiTab(type)
    setAiResult(null)
    setAiError('')
    setFixResult(null)
    setAiLoading(true)
    setAiModal(true)
    try {
      const res = await fetchAi({
        type: type === 'tahlil' ? 'analysis' : 'grammar',
        content: c.content || '',
        contract_type: c.contract_type,
        contract_number: c.contract_number,
      })
      const data = await res.json()
      if (data.error === 'premium_required') { setAiModal(false); openUpgradeModal(); return }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      setAiResult(data.result ?? null)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Fix contract via AI ─────────────────────────────────────────────────────
  async function fixContract() {
    if (!aiContract) return
    setFixLoading(true)
    setFixResult(null)
    try {
      const res = await fetchAi({
        type: 'fix',
        content: aiContract.content || '',
        analysis: aiResult,
        lang,
      })
      const data = await res.json()
      if (data.error === 'premium_required') { setAiModal(false); openUpgradeModal(); return }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      const r = data.result as { shartnoma_yangi?: string; o_zgartirishlar?: string[] }
      if (!r?.shartnoma_yangi) throw new Error("AI bo'sh natija qaytardi")
      setFixResult({
        shartnoma_yangi: r.shartnoma_yangi,
        o_zgartirishlar: r.o_zgartirishlar || [],
      })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error')
    } finally {
      setFixLoading(false)
    }
  }

  async function saveFixedContract() {
    if (!aiContract || !fixResult) return
    setFixSaving(true)
    const { error } = await supabase
      .from('contracts')
      .update({ content: fixResult.shartnoma_yangi })
      .eq('id', aiContract.id)
    setFixSaving(false)
    if (error) { toast(`Saqlashda xato: ${error.message}`, 'error'); return }
    logAudit('update', 'contracts', aiContract.id, { action: 'ai_fix', changes_count: fixResult.o_zgartirishlar.length })
    toast("Shartnoma muvaffaqiyatli yangilandi", 'success')
    reloadContracts()
    setAiModal(false)
    setFixResult(null)
  }

  // ── Filtered contracts ─────────────────────────────────────────────────────
  const orgContracts = contracts.filter(c =>
    !activeOrg || c.organization_id === activeOrg.id
  )

  const searchBase = serverResults !== null ? serverResults : orgContracts
  const filtered = searchBase.filter(c => {
    const matchSearch = serverResults !== null || !search ||
      c.contract_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.organizations?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.counterparties?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (c.product_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  // ── Sort ───────────────────────────────────────────────────────────────────
  function toggleSort(col: 'number' | 'date' | 'amount') {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const sorted = [...filtered].sort((a, b) => {
    if (!sortCol) return 0
    let va: string | number = '', vb: string | number = ''
    if (sortCol === 'number') { va = a.contract_number || ''; vb = b.contract_number || '' }
    else if (sortCol === 'date') { va = a.contract_date || ''; vb = b.contract_date || '' }
    else { va = Number(a.amount || 0); vb = Number(b.amount || 0) }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

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
      supabase.from('contracts').update({ status }).eq('id', id)
    ))
    setSelectedIds(new Set())
    reloadContracts()
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
            onClick={() => exportToCSV(sorted)}
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
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">{T(t.contracts.org)}</th>
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
                    {/* Org */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-300 truncate max-w-[120px] block">
                        {c.organizations?.name || '—'}
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
                      <div className="flex items-center gap-1 flex-wrap">
                        {/* Edit */}
                        <button
                          title="Tahrirlash"
                          onClick={() => openEditContract(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-[#1F2937] transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        {/* View */}
                        <button
                          title="Ko'rish"
                          onClick={() => { setViewContract(c); setModal('viewContract') }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {/* DOCX — primary */}
                        <button
                          title="Word"
                          onClick={() => generateDOCX(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        {/* PDF */}
                        <button
                          title="PDF"
                          onClick={() => generatePDF(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#1F2937] transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {/* AI (ai_pro only) */}
                        {hasAiAccess() && (
                          <div className="flex gap-1">
                            <button
                              title="AI Tahlil"
                              onClick={() => runAiAnalysis(c, 'tahlil')}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-400 hover:bg-[#1F2937] transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        {/* Copy */}
                        <button
                          title="Nusxa"
                          onClick={() => copyContract(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-green-400 hover:bg-[#1F2937] transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {/* Email */}
                        <button
                          title="Email yuborish"
                          onClick={() => sendByEmail(c)}
                          className="hidden sm:flex w-7 h-7 items-center justify-center rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-[#1F2937] transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
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
        />
      )}

      {/* ── View contract modal ── */}
      {modal === 'viewContract' && viewContract && (
        <ViewContractModal
          viewContract={viewContract}
          onClose={() => setModal(null)}
          onGenerateDOCX={generateDOCX}
          onGeneratePDF={generatePDF}
          onSendByEmail={sendByEmail}
          onRunAiAnalysis={runAiAnalysis}
          onToggleSigned={toggleSigned}
          isPremium={hasAiAccess()}
          lang={lang}
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
          lang={lang}
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
