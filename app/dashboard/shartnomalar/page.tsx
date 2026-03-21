'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import type { Contract } from '@/lib/types'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import { getStructure, structureToText, numberToWords } from '@/lib/contractStructures'
import { DEFAULT_TEMPLATES, type AppTemplate } from '@/lib/defaultTemplates'
import ContractModal, { type ContractForm } from './_components/ContractModal'

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
    let content = contractForm.content
    if (!content) {
      const org = orgs.find(o => o.id === contractForm.organization_id)
      const cp = cps.find(c => c.id === contractForm.counterparty_id)
      const amount = parseFloat(contractForm.amount) || 0
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

  // ── PDF generation ─────────────────────────────────────────────────────────
  async function generatePDF(c: Contract) {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let y = margin

    // ─ Header ─
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(c.organizations?.name || 'Tashkilot', margin, y)
    y += 5
    doc.setFontSize(14)
    doc.setTextColor(20, 20, 20)
    const typeName = (CONTRACT_TYPE_NAMES as Record<string, string>)[c.contract_type] || c.contract_type
    doc.text(typeName.toUpperCase(), pageWidth / 2, y, { align: 'center' })
    y += 6
    doc.setFontSize(11)
    doc.text(`No ${c.contract_number}`, pageWidth / 2, y, { align: 'center' })
    y += 5
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    const dateStr = `${c.city || 'Toshkent'} shahri,  "${c.contract_date}"`
    doc.text(dateStr, pageWidth / 2, y, { align: 'center' })
    y += 6

    // ─ Divider ─
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6

    // ─ Content ─
    doc.setFontSize(9)
    doc.setTextColor(30, 30, 30)
    const rawContent = c.content || ''
    // Transliterate non-latin chars to safe representation for jsPDF
    const safeContent = rawContent
      .replace(/'/g, "'")
      .replace(/'/g, "'")
      .replace(/[^\x00-\x7F]/g, ch => {
        const map: Record<string, string> = {
          '\u0430':'a','\u0431':'b','\u0432':'v','\u0433':'g','\u0434':'d','\u0435':'e','\u0451':'yo','\u0436':'zh','\u0437':'z','\u0438':'i','\u0439':'y',
          '\u043a':'k','\u043b':'l','\u043c':'m','\u043d':'n','\u043e':'o','\u043f':'p','\u0440':'r','\u0441':'s','\u0442':'t','\u0443':'u','\u0444':'f',
          '\u0445':'x','\u0446':'ts','\u0447':'ch','\u0448':'sh','\u0449':'sch','\u044a':"'",'\u044b':'y','\u044c':"'",'\u044d':'e','\u044e':'yu','\u044f':'ya',
          '\u0410':'A','\u0411':'B','\u0412':'V','\u0413':'G','\u0414':'D','\u0415':'E','\u0401':'Yo','\u0416':'Zh','\u0417':'Z','\u0418':'I','\u0419':'Y',
          '\u041a':'K','\u041b':'L','\u041c':'M','\u041d':'N','\u041e':'O','\u041f':'P','\u0420':'R','\u0421':'S','\u0422':'T','\u0423':'U','\u0424':'F',
          '\u0425':'X','\u0426':'Ts','\u0427':'Ch','\u0428':'Sh','\u0429':'Sch','\u042d':'E','\u042e':'Yu','\u042f':'Ya',
          '\u02bb':"'",'\u02bc':"'",'\u0492':'G','\u0493':'g','\u04b2':'H','\u04b3':'h','\u049a':'Q','\u049b':'q',
          '\u04b6':'J','\u04b7':'j','\u04e2':'I','\u04e3':'i','\u04ee':'U','\u04ef':'u',
          '\u006f\u02bc':"o'",'\u004f\u02bc':"O'",'\u0067\u02bb':'g','\u0047\u02bb':'G',
        }
        return map[ch] || ch
      })

    const lines = safeContent.split('\n')
    for (const rawLine of lines) {
      const wrapped = doc.splitTextToSize(rawLine || ' ', contentWidth)
      for (const wline of wrapped) {
        if (y > pageHeight - margin - 20) {
          doc.addPage()
          y = margin
        }
        doc.text(wline, margin, y)
        y += 4.5
      }
    }

    y += 8
    // ─ Signatures ─
    if (y > pageHeight - 60) { doc.addPage(); y = margin }
    doc.setFontSize(9)
    doc.setTextColor(50, 50, 50)
    doc.text('TOMONLARNING IMZOLARI', pageWidth / 2, y, { align: 'center' })
    y += 8

    const leftX = margin
    const rightX = pageWidth / 2 + 10

    const orgName = c.organizations?.name || '___'
    const cpName = c.counterparties?.name || '___'
    const orgDir = c.organizations?.director_name || '___'
    const cpDir = c.counterparties?.director_name || '___'

    doc.text('BUYURTMACHI:', leftX, y)
    doc.text('IJROCHI:', rightX, y)
    y += 5
    doc.setFontSize(8)
    doc.text(orgName, leftX, y)
    doc.text(cpName, rightX, y)
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
    const signUrl = c.organizations?.signature_url
    const stampUrl = c.organizations?.stamp_url
    const [signData, stampData] = await Promise.all([
      signUrl ? loadImg(signUrl) : Promise.resolve(null),
      stampUrl ? loadImg(stampUrl) : Promise.resolve(null),
    ])

    const sigY = y
    if (signData) {
      try { doc.addImage(signData, 'PNG', leftX, sigY, 40, 18) } catch { /* skip */ }
    }
    if (stampData) {
      try { doc.addImage(stampData, 'PNG', leftX + 10, sigY + 2, 22, 22) } catch { /* skip */ }
    }
    y += 20
    doc.setDrawColor(100, 100, 100)
    doc.line(leftX, y, leftX + 60, y)
    doc.line(rightX, y, rightX + 60, y)
    y += 4
    doc.setFontSize(8)
    doc.setTextColor(50, 50, 50)
    doc.text(`/ ${orgDir}`, leftX, y)
    doc.text(`/ ${cpDir}`, rightX, y)
    y += 5
    doc.text('M.O.', leftX + 25, y)
    doc.text('M.O.', rightX + 25, y)

    // ─ Footer ─
    const totalPages = ((doc.internal as unknown) as { getNumberOfPages(): number }).getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.text('Shartnoma.uz', pageWidth / 2, pageHeight - 8, { align: 'center' })
      doc.text(`${i} / ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
    }

    doc.save(`shartnoma-${c.contract_number || 'yangi'}.pdf`)
  }

  // ── DOCX generation ────────────────────────────────────────────────────────
  async function generateDOCX(c: Contract) {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } = await import('docx')

    const typeName = (CONTRACT_TYPE_NAMES as Record<string, string>)[c.contract_type] || c.contract_type
    const contentLines = (c.content || '').split('\n')

    const contentParagraphs = contentLines.map(line => {
      if (!line.trim()) return new Paragraph({ text: '' })
      const isSectionHead = /^\d+\.\s+[A-Z\s']{4,}$/.test(line.trim())
      return new Paragraph({
        children: [new TextRun({
          text: line,
          bold: isSectionHead,
          size: 22,
        })],
        spacing: { after: 100 },
      })
    })

    const sigTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              children: [
                new Paragraph({ text: 'BUYURTMACHI:', spacing: { after: 100 } }),
                new Paragraph({ text: c.organizations?.name || '___', spacing: { after: 100 } }),
                new Paragraph({ text: `INN: ${c.organizations?.inn || '___'}`, spacing: { after: 100 } }),
                new Paragraph({ text: `Rahbar: ${c.organizations?.director_name || '___'}`, spacing: { after: 200 } }),
                new Paragraph({ text: '_________________ M.O.', spacing: { after: 100 } }),
              ],
            }),
            new TableCell({
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              children: [
                new Paragraph({ text: 'IJROCHI:', spacing: { after: 100 } }),
                new Paragraph({ text: c.counterparties?.name || '___', spacing: { after: 100 } }),
                new Paragraph({ text: `INN: ${c.counterparties?.inn || '___'}`, spacing: { after: 100 } }),
                new Paragraph({ text: `Rahbar: ${c.counterparties?.director_name || '___'}`, spacing: { after: 200 } }),
                new Paragraph({ text: '_________________ M.O.', spacing: { after: 100 } }),
              ],
            }),
          ],
        }),
      ],
    })

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: typeName.toUpperCase(), bold: true, size: 28 })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `No ${c.contract_number}`, bold: true, size: 24 })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `${c.city || 'Toshkent'} shahri  "${c.contract_date}"`, size: 22 })],
            spacing: { after: 400 },
          }),
          ...contentParagraphs,
          new Paragraph({ text: '', spacing: { after: 400 } }),
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">{T(t.contracts.title)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {orgContracts.length} ta shartnoma
          </p>
        </div>
        <button
          onClick={openNewContract}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          {T(t.contracts.new)}
        </button>
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
                  <th className="text-left px-4 py-3 font-medium">{T(t.contracts.date)}</th>
                  <th className="text-left px-4 py-3 font-medium">{T(t.contracts.type)}</th>
                  <th className="text-left px-4 py-3 font-medium">{T(t.contracts.org)}</th>
                  <th className="text-left px-4 py-3 font-medium">{T(t.contracts.counterparty)}</th>
                  <th className="text-right px-4 py-3 font-medium">{T(t.contracts.amount)}</th>
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
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-400">{c.contract_date}</span>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[c.contract_type] || 'bg-gray-700 text-gray-300'}`}>
                        {CONTRACT_TYPES_I18N[c.contract_type] ? T(CONTRACT_TYPES_I18N[c.contract_type]) : c.contract_type}
                      </span>
                    </td>
                    {/* Org */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300 truncate max-w-[120px] block">
                        {c.organizations?.name || '—'}
                      </span>
                    </td>
                    {/* Counterparty */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300 truncate max-w-[120px] block">
                        {c.counterparties?.name || '—'}
                      </span>
                    </td>
                    {/* Amount */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-white font-medium">
                        {c.amount ? Number(c.amount).toLocaleString() : '—'}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-gray-700 text-gray-300'}`}>
                        {STATUSES[c.status] ? T(STATUSES[c.status]) : c.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
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
                        {/* DOCX */}
                        <button
                          title="Word"
                          onClick={() => generateDOCX(c)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                <button onClick={() => generatePDF(viewContract)} className="px-3 py-1.5 text-xs bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition">
                  PDF
                </button>
                <button onClick={() => generateDOCX(viewContract)} className="px-3 py-1.5 text-xs bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition">
                  Word
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
              </div>

              {/* Contract text */}
              {viewContract.content && (
                <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {viewContract.content}
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
