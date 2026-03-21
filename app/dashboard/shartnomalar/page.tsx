'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import type { Contract } from '@/lib/types'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import { getStructure, structureToText, numberToWords } from '@/lib/contractStructures'
import { DEFAULT_TEMPLATES, type AppTemplate } from '@/lib/defaultTemplates'
import ContractModal, { type ContractForm } from './_components/ContractModal'
import { cyrillicToLatin } from '@/lib/downloadUtils'

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTRACT_TYPES_I18N: Record<string, Record<Lang, string>> = {
  oldi_sotdi: { uz: 'Oldi-sotdi',          oz: 'Олди-сотди',          ru: 'Купля-продажа' },
  xizmat:     { uz: "Xizmat ko'rsatish",   oz: 'Хизмат кўрсатиш',    ru: 'Услуги' },
  ijara:      { uz: 'Ijara',               oz: 'Ижара',               ru: 'Аренда' },
  pudrat:     { uz: 'Pudrat',              oz: 'Пудрат',              ru: 'Подряд' },
  qoshimcha:  { uz: "Qo'shimcha",          oz: 'Қўшимча',             ru: 'Дополнительный' },
  moliyaviy:  { uz: 'Moliyaviy yordam',    oz: 'Молиявий ёрдам',      ru: 'Финансовая помощь' },
  daval:      { uz: 'Daval',               oz: 'Давал',               ru: 'Давальческий' },
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
  active:    'bg-green-900/50 text-green-300',
  draft:     'bg-gray-700 text-gray-300',
  completed: 'bg-blue-900/50 text-blue-300',
  cancelled: 'bg-red-900/50 text-red-300',
}

const TYPE_COLORS: Record<string, string> = {
  oldi_sotdi: 'bg-blue-900/50 text-blue-300',
  xizmat:     'bg-emerald-900/50 text-emerald-300',
  ijara:      'bg-purple-900/50 text-purple-300',
  pudrat:     'bg-orange-900/50 text-orange-300',
  qoshimcha:  'bg-gray-700 text-gray-300',
  moliyaviy:  'bg-yellow-900/50 text-yellow-300',
  daval:      'bg-cyan-900/50 text-cyan-300',
  xalqaro:    'bg-indigo-900/50 text-indigo-300',
  boshqa:     'bg-pink-900/50 text-pink-300',
}

// ─── Template placeholder filler ─────────────────────────────────────────────

type PlaceholderData = {
  contract_number?: string
  contract_date?: string
  city?: string
  amount?: number | string
  organizations?: { name?: string; inn?: string; address?: string; director_name?: string } | null
  counterparties?: { name?: string; inn?: string; address?: string; director_name?: string } | null
  // Extra contract-type-specific fields
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
  yetkazish_muddat?: string
  tolov_usuli?: string
  valyuta?: string
  asosiy_raqam?: string
  asosiy_sana?: string
  ozgartirish?: string
}

function fillPlaceholders(content: string, c: PlaceholderData): string {
  const amount = Number(c.amount || 0)
  const amountText = amount > 0 ? amount.toLocaleString('uz-UZ') + " so'm" : "nol so'm"
  const oylik = Number(c.oylik_tolov || 0)
  const oylikText = oylik > 0 ? oylik.toLocaleString('uz-UZ') + " so'm" : ''

  const map: Record<string, string> = {
    // Core
    '{{RAQAM}}':              c.contract_number || '',
    '{{SANA}}':               c.contract_date || '',
    '{{SHAHAR}}':             c.city || 'Toshkent',
    // Parties
    '{{BUYURTMACHI}}':        c.organizations?.name || '___',
    '{{BUYURTMACHI_INN}}':    c.organizations?.inn || '___',
    '{{BUYURTMACHI_RAHBAR}}': c.organizations?.director_name || '___',
    '{{IJROCHI}}':            c.counterparties?.name || '___',
    '{{IJROCHI_INN}}':        c.counterparties?.inn || '___',
    '{{IJROCHI_RAHBAR}}':     c.counterparties?.director_name || '___',
    // Amount
    '{{SUMMA}}':              amount.toLocaleString('uz-UZ'),
    '{{SUMMA_MATN}}':         amountText,
    // Ijara
    '{{IJARA_MANZIL}}':       c.ijara_manzil || '___',
    '{{IJARA_MAYDON}}':       c.ijara_maydon || '___',
    '{{OYLIK_TOLOV}}':        oylik ? oylik.toLocaleString('uz-UZ') : '___',
    '{{OYLIK_TOLOV_MATN}}':   oylikText || '___',
    '{{IJARA_MUDDAT}}':       c.ijara_muddat || '___',
    '{{IJARA_BOSHLANISH}}':   c.ijara_boshlanish || '___',
    '{{IJARA_TUGASH}}':       c.ijara_tugash || '___',
    // Xizmat
    '{{XIZMAT_TAVSIF}}':      c.xizmat_tavsif || '___',
    '{{XIZMAT_BOSHLANISH}}':  c.xizmat_boshlanish || '___',
    '{{XIZMAT_TUGASH}}':      c.xizmat_tugash || '___',
    '{{XIZMAT_TOLOV}}':       c.xizmat_tolov || '___',
    // Pudrat
    '{{PUDRAT_OBEKT}}':       c.pudrat_obekt || '___',
    '{{PUDRAT_TAVSIF}}':      c.pudrat_tavsif || '___',
    '{{PUDRAT_BOSHLANISH}}':  c.pudrat_boshlanish || '___',
    '{{PUDRAT_TUGASH}}':      c.pudrat_tugash || '___',
    // Moliyaviy/qarz
    '{{QARZ_MAQSAD}}':        c.qarz_maqsad || '___',
    '{{QARZ_FOIZ}}':          c.qarz_foiz || '___',
    '{{QARZ_MUDDAT}}':        c.qarz_muddat || '___',
    '{{QARZ_TARTIB}}':        '___',
    // Daval
    '{{DAVAL_MATERIAL}}':     c.daval_material || '___',
    '{{DAVAL_MAHSULOT}}':     c.daval_mahsulot || '___',
    '{{DAVAL_MIQDOR}}':       '___',
    '{{DAVAL_MUDDAT}}':       '___',
    // Xalqaro
    '{{INCOTERMS}}':          c.incoterms || '___',
    '{{YETKAZISH_JOY}}':      c.yetkazish_joy || '___',
    '{{YETKAZISH_MUDDAT}}':   c.yetkazish_muddat || '___',
    '{{TOLOV_USULI}}':        c.tolov_usuli || '___',
    '{{VALYUTA}}':            c.valyuta || 'USD',
    // Qo'shimcha
    '{{ASOSIY_RAQAM}}':       c.asosiy_raqam || '___',
    '{{ASOSIY_SANA}}':        c.asosiy_sana || '___',
    '{{OZGARTIRISH}}':        c.ozgartirish || '___',
  }
  return content.replace(/\{\{[A-Z_]+\}\}/g, (key) => map[key] ?? key)
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

  const {
    contracts, orgs, cps, activeOrg, subscription, isFree,
    reloadContracts, reloadCps, canCreateContract, openUpgradeModal, userId,
  } = useDashboard()

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState<null | 'contract' | 'viewContract'>(null)
  const [contractForm, setContractForm] = useState<ContractForm>(makeEmptyForm(activeOrg?.id || ''))
  const [viewContract, setViewContract] = useState<Contract | null>(null)
  const [saving, setSaving] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<AppTemplate[]>([])

  // AI state
  const [aiContract, setAiContract] = useState<Contract | null>(null)
  const [aiResult, setAiResult] = useState('')
  const [aiError, setAiError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTab, setAiTab] = useState<'tahlil' | 'grammatika'>('tahlil')
  const [aiModal, setAiModal] = useState(false)

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
      const parts = c.contract_number?.split('/')
      const n = parts ? parseInt(parts[parts.length - 1]) || 0 : 0
      return Math.max(m, n)
    }, 0)
    return `${year}/${String(max + 1).padStart(3, '0')}`
  }

  // ── Open modal ─────────────────────────────────────────────────────────────
  function openNewContract() {
    if (!canCreateContract()) { openUpgradeModal(); return }
    if (!activeOrg) { alert(T(t.msg.noOrgs)); return }
    const form = makeEmptyForm(activeOrg.id)
    form.contract_number = autoContractNum()
    setContractForm(form)
    setModal('contract')
  }

  // ── Save contract ──────────────────────────────────────────────────────────
  async function saveContract(e: React.FormEvent) {
    e.preventDefault()
    if (!contractForm.organization_id) { alert(T(t.msg.selectOrg)); return }

    setSaving(true)

    // Build content if not set
    const org = orgs.find(o => o.id === contractForm.organization_id)
    const cp = cps.find(c => c.id === contractForm.counterparty_id)
    const amount = parseFloat(contractForm.amount) || 0
    let content = contractForm.content
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
        amount_text: numberToWords(amount, 'uz') + " so'm",
      })
      content = structureToText(structure, {
        type_name: (CONTRACT_TYPE_NAMES as Record<string, string>)[contractForm.contract_type] || contractForm.contract_type,
        number: contractForm.contract_number,
        date: contractForm.contract_date,
        city: contractForm.city,
        org,
        cp,
      })
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
      const { error: e } = await supabase.from('contracts').update(payload).eq('id', contractForm.id)
      error = e
    } else {
      const { error: e } = await supabase.from('contracts').insert(payload)
      error = e
      if (!e && subscription) {
        await supabase.from('subscriptions')
          .update({ contracts_used: (subscription.contracts_used || 0) + 1 })
          .eq('id', subscription.id)
      }
    }

    setSaving(false)
    if (error) { alert(`Xato: ${error.message}`); return }
    setModal(null)
    reloadContracts()
  }

  // ── Update status ──────────────────────────────────────────────────────────
  async function updateStatus(id: string, status: string) {
    await supabase.from('contracts').update({ status }).eq('id', id)
    reloadContracts()
  }

  async function toggleSigned(c: Contract, side: 'signed_us' | 'signed_cp') {
    await supabase.from('contracts').update({ [side]: !c[side] }).eq('id', c.id)
    reloadContracts()
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
      city: c.city || 'Toshkent',
      product_name: c.product_name || '',
      spec_items: c.spec_items || [],
      qqs_enabled: c.qqs_enabled || false,
      qqs_rate: c.qqs_rate || 12,
    }
    setContractForm(form)
    setModal('contract')
  }

  // ── Delete contract ────────────────────────────────────────────────────────
  async function deleteContract(id: string) {
    if (!confirm(T(t.contracts.deleteConfirm))) return
    await supabase.from('contracts').delete().eq('id', id)
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
      city: c.city || 'Toshkent',
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
    const dateStr = cyrillicToLatin(`${c.city || 'Toshkent'} shahri,  "${c.contract_date}"`)
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
      daval: 'Daval', xalqaro: 'Xalqaro', boshqa: 'Boshqa',
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
      WidthType, AlignmentType, BorderStyle, Footer, PageNumber,
    } = await import('docx')

    const typeName = (CONTRACT_TYPE_NAMES as Record<string, string>)[c.contract_type] || c.contract_type
    const F = 'Times New Roman'

    // Border helpers
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
    const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
    const thinBorder = { style: BorderStyle.SINGLE, size: 6, color: '888888' }
    const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }

    // Line classifier for contract content
    function lineKind(line: string): 'empty' | 'main' | 'sub' | 'label' | 'bullet' | 'body' {
      const t = line.trim()
      if (!t || /^={3,}$|^-{3,}$/.test(t)) return 'empty'
      if (/^(\d+\.\s+\S|§\s*\d)/.test(t) && !/^\d+\.\d/.test(t)) return 'main'
      if (/^\d+\.\d+/.test(t)) return 'sub'
      if (/^[A-ZЎҚҒҲ][A-ZЎҚҒҲ\s]{2,20}:\s*$/.test(t)) return 'label'
      if (/^[-–•]\s/.test(t)) return 'bullet'
      return 'body'
    }

    // ── Content cleaning ──────────────────────────────────────────────────────
    // 1. Skip duplicate header lines (title, №, city/date) — start from first
    //    numbered section like "1. SHARTNOMA PREDMETI"
    // 2. Cut signature/rekvizitlar section at the end — we render our own table
    const rawLines = fillPlaceholders(c.content || '', c).split('\n')

    let startIdx = 0
    for (let i = 0; i < rawLines.length; i++) {
      const t = rawLines[i].trim()
      if (/^(\d+\.\s+[A-ZЎҚҒҲA-z]|§\s*\d)/.test(t) && !/^\d+\.\d+/.test(t)) {
        startIdx = i
        break
      }
    }

    let endIdx = rawLines.length
    for (let i = 0; i < rawLines.length; i++) {
      const t = rawLines[i].trim()
      if (/^TOMONLARNING\s+(REKVIZITLARI|MA['']LUMOTLARI|IMZOLARI)/i.test(t) ||
          /^TOMONLAR\s+(IMZOSI|REKVIZIT)/i.test(t)) {
        endIdx = i
        break
      }
    }

    const cleanedLines = rawLines.slice(startIdx, endIdx)

    const contentParagraphs = cleanedLines.map((line, i, arr) => {
      const t = line.trim()
      const kind = lineKind(line)

      if (kind === 'empty') return new Paragraph({ text: '', spacing: { after: 20 } })

      if (kind === 'main') return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 160, after: 60 },
        children: [new TextRun({ text: t, bold: true, italics: false, underline: {}, size: 24, font: F, color: '000000' })],
      })

      if (kind === 'sub') return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: t, bold: false, italics: false, underline: {}, size: 24, font: F, color: '000000' })],
      })

      if (kind === 'label') return new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [new TextRun({ text: t, bold: true, italics: false, underline: {}, size: 22, font: F, color: '000000' })],
      })

      if (kind === 'bullet') {
        const bt = t.replace(/^[-–•]\s*/, '')
        return new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 360, hanging: 180 },
          spacing: { after: 30 },
          children: [new TextRun({ text: `– ${bt}`, bold: false, italics: false, underline: {}, size: 24, font: F, color: '000000' })],
        })
      }

      const prevKind = i > 0 ? lineKind(arr[i - 1]) : 'empty'
      const isStart = prevKind === 'empty' || prevKind === 'main' || prevKind === 'sub' || prevKind === 'label'
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: isStart ? { firstLine: 360 } : {},
        spacing: { after: 40, line: 240 },
        children: [new TextRun({ text: t, bold: false, italics: false, underline: {}, size: 24, font: F, color: '000000' })],
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
              children: [new TextRun({ text: c.contract_date || '', size: 22, font: F })],
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

    // Org details helper — works for both organizations and counterparties
    function orgCell(title: string, org: { name?: string; inn?: string; address?: string; director_name?: string; bank_name?: string; bank_account?: string; mfo?: string } | null | undefined) {
      const details = [
        new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 24, font: F })], spacing: { after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: org?.name || '___', bold: true, size: 22, font: F })], spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: `INN: ${org?.inn || '___'}`, size: 20, font: F, color: '555555' })], spacing: { after: 50 } }),
        ...(org?.address ? [new Paragraph({ children: [new TextRun({ text: `Manzil: ${org.address}`, size: 20, font: F, color: '555555' })], spacing: { after: 50 } })] : []),
        ...(org?.bank_name ? [new Paragraph({ children: [new TextRun({ text: `Bank: ${org.bank_name}`, size: 20, font: F, color: '555555' })], spacing: { after: 50 } })] : []),
        ...(org?.bank_account ? [new Paragraph({ children: [new TextRun({ text: `H/R: ${org.bank_account}`, size: 20, font: F, color: '555555' })], spacing: { after: 50 } })] : []),
        ...(org?.mfo ? [new Paragraph({ children: [new TextRun({ text: `MFO: ${org.mfo}`, size: 20, font: F, color: '555555' })], spacing: { after: 50 } })] : []),
        new Paragraph({ children: [new TextRun({ text: `Rahbar: ${org?.director_name || '___'}`, size: 20, font: F })], spacing: { after: 240 } }),
        new Paragraph({ children: [new TextRun({ text: 'Imzo: _______________________', size: 22, font: F })], spacing: { after: 50 } }),
        new Paragraph({ children: [new TextRun({ text: 'M.O.', size: 20, font: F, color: '888888' })], spacing: { after: 0 } }),
      ]
      return new TableCell({ borders: cellBorders, margins: { top: 150, bottom: 150, left: 200, right: 200 }, children: details })
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

    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 } },
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
    setAiResult('')
    setAiError('')
    setAiLoading(true)
    setAiModal(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type === 'tahlil' ? 'analysis' : 'grammar',
          content: c.content || '',
          contract_type: c.contract_type,
          contract_number: c.contract_number,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAiResult(data.result || data.message || 'Natija yo\'q')
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Filtered contracts ─────────────────────────────────────────────────────
  const orgContracts = contracts.filter(c =>
    !activeOrg || c.organization_id === activeOrg.id
  )

  const filtered = orgContracts.filter(c => {
    const matchSearch = !search ||
      c.contract_number?.toLowerCase().includes(search.toLowerCase()) ||
      c.organizations?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.counterparties?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (c.product_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  // ── Quota info ─────────────────────────────────────────────────────────────
  const isNearLimit = isFree && orgContracts.length >= 4
  const isPremium = !isFree

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
            onClick={() => exportToCSV(orgContracts)}
            title="Excel (CSV) yuklab olish"
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-2.5 rounded-lg text-sm transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Excel
          </button>
          <button
            onClick={openNewContract}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
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
            className="w-full bg-gray-900 border border-gray-800 text-white pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-800 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500"
        >
          {Object.entries(STATUSES).map(([key, labels]) => (
            <option key={key} value={key}>{T(labels)}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
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
                <tr className="border-b border-gray-800 text-xs text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">{T(t.contracts.number)}</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">{T(t.contracts.date)}</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{T(t.contracts.type)}</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">{T(t.contracts.org)}</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">{T(t.contracts.counterparty)}</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">{T(t.contracts.amount)}</th>
                  <th className="text-left px-4 py-3 font-medium">{T(t.contracts.status)}</th>
                  <th className="text-left px-4 py-3 font-medium">{T(t.contracts.actions)}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr key={c.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition ${idx % 2 === 0 ? '' : 'bg-gray-900/30'}`}>
                    {/* Number */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">{c.contract_number}</span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-400">{c.contract_date}</span>
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
                        {c.amount ? Number(c.amount).toLocaleString() : '—'}
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
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          title="Tahrirlash"
                          onClick={() => openEditContract(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-gray-700 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        {/* View */}
                        <button
                          title="Ko'rish"
                          onClick={() => { setViewContract(c); setModal('viewContract') }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
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
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {/* AI (premium only) */}
                        {isPremium && (
                          <div className="flex gap-1">
                            <button
                              title="AI Tahlil"
                              onClick={() => runAiAnalysis(c, 'tahlil')}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-purple-400 hover:bg-gray-700 transition"
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
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-green-400 hover:bg-gray-700 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {/* Email */}
                        <button
                          title="Email yuborish"
                          onClick={() => sendByEmail(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-gray-700 transition"
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
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-green-400 hover:bg-gray-700 transition"
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
                            onClick={() => updateStatus(c.id, 'cancelled')}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-gray-700 transition"
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
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-700 transition"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-white">
                  {(CONTRACT_TYPE_NAMES as Record<string, string>)[viewContract.contract_type] || viewContract.contract_type}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">No {viewContract.contract_number} · {viewContract.contract_date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => generateDOCX(viewContract)} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-semibold">
                  📝 Word
                </button>
                <button onClick={() => generatePDF(viewContract)} className="px-3 py-1.5 text-xs bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition">
                  📄 PDF
                </button>
                <button onClick={() => sendByEmail(viewContract)} className="px-3 py-1.5 text-xs bg-yellow-700/30 text-yellow-400 rounded-lg hover:bg-yellow-700/50 transition">
                  ✉️ Email
                </button>
                <button onClick={() => window.print()} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition">
                  🖨️ Print
                </button>
                {isPremium && (
                  <button
                    onClick={() => { setModal(null); runAiAnalysis(viewContract, 'tahlil') }}
                    className="px-3 py-1.5 text-xs bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition"
                  >
                    AI Tahlil
                  </button>
                )}
                <button onClick={() => setModal(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-xl">
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {/* Info cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Tashkilot</p>
                  <p className="text-sm text-white font-medium">{viewContract.organizations?.name || '—'}</p>
                  <p className="text-xs text-gray-500">INN: {viewContract.organizations?.inn || '—'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Kontragent</p>
                  <p className="text-sm text-white font-medium">{viewContract.counterparties?.name || '—'}</p>
                  <p className="text-xs text-gray-500">INN: {viewContract.counterparties?.inn || '—'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Summa</p>
                  <p className="text-sm text-white font-semibold">{Number(viewContract.amount || 0).toLocaleString()} so'm</p>
                  <p className="text-xs text-gray-500">{numberToWords(Number(viewContract.amount || 0), 'uz')} so'm</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Holat</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewContract.status] || 'bg-gray-700 text-gray-300'}`}>
                    {STATUSES[viewContract.status] ? T(STATUSES[viewContract.status]) : viewContract.status}
                  </span>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-gray-500 mb-2">Imzolash holati</p>
                  <div className="flex gap-3">
                    <button onClick={() => toggleSigned(viewContract, 'signed_us')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewContract.signed_us ? 'bg-emerald-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                      {viewContract.signed_us ? '✅' : '⬜'} Biz imzoladik
                    </button>
                    <button onClick={() => toggleSigned(viewContract, 'signed_cp')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewContract.signed_cp ? 'bg-emerald-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                      {viewContract.signed_cp ? '✅' : '⬜'} Kontragent imzoladi
                    </button>
                  </div>
                </div>
              </div>

              {/* Contract text */}
              {viewContract.content && (
                <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {fillPlaceholders(viewContract.content, viewContract)}
                  </pre>
                </div>
              )}

              {/* Spec items */}
              {viewContract.spec_items && viewContract.spec_items.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-white mb-3">Spesifikatsiya</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-gray-700">
                          <th className="text-left pb-2 pr-2">Nomi</th>
                          <th className="text-left pb-2 pr-2">Birlik</th>
                          <th className="text-right pb-2 pr-2">Miqdor</th>
                          <th className="text-right pb-2 pr-2">Narxi</th>
                          <th className="text-center pb-2 pr-2">QQS%</th>
                          <th className="text-right pb-2">Jami</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewContract.spec_items.map((item, i) => (
                          <tr key={i} className="border-b border-gray-800/50">
                            <td className="py-1.5 pr-2 text-gray-200">{item.nomi}</td>
                            <td className="py-1.5 pr-2 text-gray-400">{item.birlik}</td>
                            <td className="py-1.5 pr-2 text-right text-gray-300">{item.miqdori}</td>
                            <td className="py-1.5 pr-2 text-right text-gray-300">{item.narxi?.toLocaleString()}</td>
                            <td className="py-1.5 pr-2 text-center text-gray-400">{item.qqs_foiz === 'siz' ? 'QQSsiz' : item.qqs_foiz + '%'}</td>
                            <td className="py-1.5 text-right font-medium text-white">{item.summa?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={5} className="pt-2 text-right text-gray-400 font-medium text-xs pr-2">Jami:</td>
                          <td className="pt-2 text-right text-white font-bold text-sm">
                            {viewContract.spec_items.reduce((s, i) => s + (i.summa || 0), 0).toLocaleString()} so'm
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── AI modal ── */}
      {aiModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="text-purple-400">✦</span> AI Tahlil
              </h2>
              <button onClick={() => setAiModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-xl">
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 flex-shrink-0">
              <button
                onClick={() => { setAiTab('tahlil'); if (aiContract) runAiAnalysis(aiContract, 'tahlil') }}
                className={`flex-1 py-2.5 text-sm font-medium transition ${aiTab === 'tahlil' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Shartnoma tahlili
              </button>
              <button
                onClick={() => { setAiTab('grammatika'); if (aiContract) runAiAnalysis(aiContract, 'grammatika') }}
                className={`flex-1 py-2.5 text-sm font-medium transition ${aiTab === 'grammatika' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Grammatika tekshirish
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  <p className="text-gray-400 text-sm">AI tahlil qilmoqda...</p>
                </div>
              ) : aiError ? (
                <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
                  <p className="text-red-300 text-sm">{aiError}</p>
                </div>
              ) : aiResult ? (
                <div className="prose prose-invert max-w-none">
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                    {aiResult}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">Natija kutilmoqda...</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-800 flex-shrink-0">
              <button
                onClick={() => setAiModal(false)}
                className="w-full border border-gray-700 text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-800 transition"
              >
                {T(t.btn.close)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
