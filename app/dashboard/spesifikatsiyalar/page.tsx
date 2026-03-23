'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { Modal, ModalActions } from '../_components/Modal'
import ConfirmModal from '../_components/ConfirmModal'
import { useToast } from '@/lib/toast'
import { cyrillicToLatin } from '@/lib/downloadUtils'
import type { Counterparty } from '@/lib/types'
import { numberToWords, formatDateUz } from '@/lib/contractStructures'

type SpecItem = {
  nomi: string; birlik: string; miqdori: number; narxi: number
  qqs_foiz: string; qqs_summa: number; summa: number
}
type Specification = {
  id: string; organization_id: string; contract_id: string | null
  spec_number: string; items: SpecItem[]; notes: string; created_at: string
  contracts?: { contract_number: string; contract_date: string; contract_type?: string; counterparty_id?: string; counterparties?: { name: string } }
}

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
  const { activeOrg, contracts, cps } = useDashboard()
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
  const inp = 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'

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

  async function generateSpecWord(spec: Specification) {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, BorderStyle, Footer, PageNumber } = await import('docx')
    const items: SpecItem[] = Array.isArray(spec.items) ? spec.items : []
    const totalBase = items.reduce((s, i) => s + i.miqdori * i.narxi, 0)
    const totalQqs  = items.reduce((s, i) => s + (i.qqs_summa || 0), 0)
    const totalJami = items.reduce((s, i) => s + (i.summa || 0), 0)
    const F = 'Times New Roman'
    const fmt = (n: number) => n.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const thinBorder = { style: BorderStyle.SINGLE, size: 6, color: '888888' }
    const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }
    const headerBg = '1F3864'

    const headerCell = (text: string, w: number, align: string = AlignmentType.CENTER) =>
      new TableCell({
        width: { size: w, type: WidthType.PERCENTAGE },
        shading: { fill: headerBg },
        borders: cellBorders,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: [new Paragraph({ alignment: align as any, children: [new TextRun({ text, bold: true, size: 18, font: F, color: 'FFFFFF' })] })],
      })

    const dataCell = (text: string, w: number, align: string = AlignmentType.CENTER, bold = false, color = '000000') =>
      new TableCell({
        width: { size: w, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        children: [new Paragraph({ alignment: align as any, children: [new TextRun({ text, bold, size: 20, font: F, color })] })],
      })

    const specTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('№', 4),
            headerCell('Tovarlar (ish, xizmatlar) nomi', 26, AlignmentType.LEFT),
            headerCell("O'lchov birligi", 9),
            headerCell('Miqdori', 7),
            headerCell("Narxi (so'm)", 12),
            headerCell('Yetkazib berish qiymati', 13),
            headerCell('QQS stavkasi', 9),
            headerCell('QQS summasi', 10),
            headerCell('QQS bilan jami', 10),
          ],
        }),
        ...items.map((item, i) => {
          const base = item.miqdori * item.narxi
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
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 5, borders: cellBorders,
              shading: { fill: 'F2F2F2' },
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'JAMI:', bold: true, size: 22, font: F })] })],
            }),
            dataCell(fmt(totalBase), 13, AlignmentType.RIGHT, true),
            dataCell('', 9),
            dataCell(fmt(totalQqs), 10, AlignmentType.RIGHT, true),
            dataCell(fmt(totalJami), 10, AlignmentType.RIGHT, true, 'CC0000'),
          ],
        }),
      ],
    })

    // Signature table
    const B = { font: F, color: '000000', bold: true }
    const contract = spec.contracts
    // Get full counterparty data from cps array (contracts join only has name)
    const cpFull = contract?.counterparty_id
      ? cps.find(c => c.id === contract.counterparty_id) || null
      : null
    const cp = cpFull || contract?.counterparties as { name?: string; inn?: string; address?: string; director_name?: string; bank_name?: string; bank_account?: string; mfo?: string } | undefined

    function orgCell(title: string, org: { name?: string; inn?: string; address?: string; director_name?: string; bank_name?: string; bank_account?: string; mfo?: string } | null | undefined) {
      const mfoInn = [org?.mfo ? `MFO: ${org.mfo}` : '', org?.inn ? `INN: ${org.inn}` : ''].filter(Boolean).join('   ')
      return new TableCell({
        borders: cellBorders,
        margins: { top: 160, bottom: 160, left: 220, right: 220 },
        children: [
          new Paragraph({ children: [new TextRun({ ...B, text: title, size: 24 })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ ...B, text: org?.name || '___', size: 22 })], spacing: { after: 50 } }),
          ...(org?.address ? [new Paragraph({ children: [new TextRun({ ...B, text: `Manzil: ${org.address}`, size: 20 })], spacing: { after: 40 } })] : []),
          ...(org?.bank_account ? [new Paragraph({ children: [new TextRun({ ...B, text: `H/R: ${org.bank_account}`, size: 20 })], spacing: { after: 40 } })] : []),
          ...(org?.bank_name ? [new Paragraph({ children: [new TextRun({ ...B, text: `Bank: ${org.bank_name}`, size: 20 })], spacing: { after: 40 } })] : []),
          ...(mfoInn ? [new Paragraph({ children: [new TextRun({ ...B, text: mfoInn, size: 20 })], spacing: { after: 40 } })] : []),
          new Paragraph({ children: [new TextRun({ ...B, text: `Rahbar: ${org?.director_name || '___'}`, size: 20 })], spacing: { after: 160 } }),
          new Paragraph({ children: [new TextRun({ ...B, text: '_________________________', size: 22 })], spacing: { after: 20 } }),
          new Paragraph({ children: [new TextRun({ ...B, text: 'M.O.', size: 20 })] }),
        ],
      })
    }

    const sigTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [orgCell('SOTUVCHI', activeOrg), orgCell('XARIDOR', cp)] })],
    })

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

    const contractDate = contract?.contract_date ? formatDateUz(contract.contract_date) : ''

    const doc = new Document({
      sections: [{
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 567, right: 851 } } },
        footers: { default: footer },
        children: [
          // Right-aligned ilova info
          ...(contract ? [
            new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 40 }, children: [new TextRun({ text: '1-ILOVA', bold: true, size: 22, font: F })] }),
            new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 40 }, children: [new TextRun({ text: `№${contract.contract_number}-sonli shartnomaga`, size: 20, font: F })] }),
            new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 200 }, children: [new TextRun({ text: `${contractDate} dan`, size: 20, font: F })] }),
          ] : [
            new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 200 }, children: [new TextRun({ text: `Sana: ${formatDateUz(spec.created_at.split('T')[0])}`, size: 20, font: F })] }),
          ]),
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
            children: [new TextRun({ text: 'NARXNI KELISHISH PROTOKOLI', bold: true, size: 26, font: F, underline: {} })],
          }),
          // Table
          specTable,
          // Totals in words
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [new TextRun({ text: `Jami so'z bilan: ${numberToWords(Math.round(totalJami), 'uz')} so'm`, bold: true, size: 22, font: F })],
          }),
          new Paragraph({
            spacing: { after: 240 },
            children: [new TextRun({ text: "Ushbu Protokol Shartnomaning ajralmas qismi hisoblanadi va ikki nusxada tuzilgan.", size: 20, font: F, italics: true })],
          }),
          new Paragraph({ text: '', spacing: { after: 240 } }),
          // Signatures
          sigTable,
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `Spesifikatsiya-${spec.spec_number}.docx`; a.click()
    URL.revokeObjectURL(url)
  }

  async function generateSpecPDF(spec: Specification) {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210, pageH = 297, mL = 20, mR = 20, mT = 20, mB = 28
    const cW = pageW - mL - mR
    // cyrillicToLatin import qilingan — barcha kirill va maxsus belgilarni to'g'ri aylantiradi
    const safe = (s: string) => cyrillicToLatin(s || '')

    const org = activeOrg
    const contract = spec.contracts

    let cpFull: Counterparty | null = null
    if (spec.contract_id) {
      const found = contracts.find(c => c.id === spec.contract_id)
      if (found?.counterparty_id) {
        cpFull = cps.find(cp => cp.id === found.counterparty_id) || null
      }
    }

    const specDate = new Date(spec.created_at)
    const dd = specDate.getDate(), mm = specDate.getMonth() + 1, yy = specDate.getFullYear()
    const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
    const dateLong = `"${dd}" ${MONTHS[mm - 1]} ${yy} y.`

    let y = mT
    function guardSpec(need: number) {
      if (y + need > pageH - mB) { doc.addPage(); y = mT }
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(0, 0, 0)
    doc.text(safe(`SPESIFIKATSIYA No${spec.spec_number}`), pageW / 2, y, { align: 'center' }); y += 7

    if (contract) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60, 60, 60)
      doc.text(safe(`Shartnoma No${contract.contract_number} ga ilova`), pageW / 2, y, { align: 'center' }); y += 7
    }

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(0, 0, 0)
    doc.text(dateLong, pageW / 2, y, { align: 'center' }); y += 8

    // Table
    const cols = [8, 60, 20, 20, 25, 20, 15, 25]
    const headers = ['№', 'Nomi', "O'lchov", 'Miqdori', 'Narx', 'QQS', 'QQS sm', 'Jami']
    const rowH = 7
    const x = mL

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255)
    doc.setFillColor(30, 60, 120)
    doc.rect(mL, y, cW, rowH, 'F')
    let cx = x
    headers.forEach((h, i) => { doc.text(safe(h), cx + 2, y + 5); cx += cols[i] })
    y += rowH

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(0, 0, 0)
    spec.items.forEach((item, idx) => {
      const isEven = idx % 2 === 0
      if (isEven) { doc.setFillColor(245, 247, 255); doc.rect(mL, y, cW, rowH, 'F') }
      cx = mL
      const row = [
        String(idx + 1),
        safe(item.nomi),
        safe(item.birlik),
        String(item.miqdori),
        item.narxi.toLocaleString(),
        item.qqs_foiz === 'siz' ? 'siz' : `${item.qqs_foiz}%`,
        item.qqs_summa > 0 ? item.qqs_summa.toLocaleString() : '—',
        item.summa.toLocaleString(),
      ]
      row.forEach((v, i) => {
        const lines = doc.splitTextToSize(v, cols[i] - 3) as string[]
        doc.text(lines[0] || '', cx + 2, y + 5)
        cx += cols[i]
      })
      y += rowH
      guardSpec(rowH + 5)
    })

    // Totals
    const asosiy = spec.items.reduce((s, it) => s + it.miqdori * it.narxi, 0)
    const qqsJami = spec.items.reduce((s, it) => s + it.qqs_summa, 0)
    const grand = spec.items.reduce((s, it) => s + it.summa, 0)
    y += 3
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    const totals = [
      ['Asosiy summa:', asosiy.toLocaleString() + " so'm"],
      ['QQS jami:', qqsJami > 0 ? qqsJami.toLocaleString() + " so'm" : '—'],
      ['JAMI:', grand.toLocaleString() + " so'm"],
    ]
    totals.forEach(([label, val]) => {
      doc.text(safe(label), pageW - mR - 60, y)
      doc.text(safe(val), pageW - mR, y, { align: 'right' })
      y += 6
    })

    // Signatures
    y += 8
    if (y > pageH - 50) { doc.addPage(); y = mT }
    const half = cW / 2
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80)
    doc.text('SOTUVCHI:', mL, y); doc.text('XARIDOR:', mL + half + 5, y); y += 5
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0)
    doc.text(safe(org?.name || '—'), mL, y); doc.text(safe(cpFull?.name || contract?.counterparties?.name || '—'), mL + half + 5, y); y += 8
    doc.setDrawColor(0, 0, 0)
    doc.line(mL, y, mL + 55, y); doc.line(mL + half + 5, y, mL + half + 60, y)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80)
    doc.text(safe(`Rahbar: _____________ / ${org?.director_name || ''}`), mL, y + 5)
    doc.text(safe(`Rahbar: _____________ / ${cpFull?.director_name || ''}`), mL + half + 5, y + 5)

    const totalPages = ((doc.internal as unknown) as { getNumberOfPages(): number }).getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      doc.setFontSize(7.5); doc.setTextColor(160, 160, 160)
      doc.text('Shartnoma.uz', pageW / 2, pageH - 10, { align: 'center' })
      doc.text(`${p} / ${totalPages}`, pageW - mR, pageH - 10, { align: 'right' })
    }

    doc.save(`spec-${spec.spec_number}.pdf`)
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
    const cnt = specs.length
    return `SPEC-${String(cnt + 1).padStart(3, '0')}`
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">📋 Spesifikatsiyalar</h1>
          <p className="text-gray-500 text-sm mt-0.5">{specs.length} ta spesifikatsiya</p>
        </div>
        <button onClick={() => {
          setEditingSpec(null)
          setSpecForm({ ...emptySpecForm, spec_number: nextSpecNumber() })
          setSpecItems([emptySpecItem()])
          setSpecCpId('')
          setSpecModal(true)
        }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          {T(t.specTab.newBtn)}
        </button>
      </div>

      {/* Empty state */}
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
                const total = spec.items.reduce((s, it) => s + (it.summa || 0), 0)
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
                        <button onClick={() => generateSpecWord(spec)}
                          className="flex items-center gap-1 text-xs bg-blue-600 text-white hover:bg-blue-500 px-2 py-1 rounded transition font-semibold">
                          📝 Word
                        </button>
                        <button onClick={() => generateSpecPDF(spec)}
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
                  {cps.filter(cp => contracts.some(c => c.organization_id === activeOrg?.id && c.counterparty_id === cp.id)).map(cp => (
                    <option key={cp.id} value={cp.id}>{cp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Shartnoma (ixtiyoriy)</label>
                <select className={inp} value={specForm.contract_id}
                  onChange={e => setSpecForm({ ...specForm, contract_id: e.target.value })}>
                  <option value="">— Shartnomani tanlang —</option>
                  {contracts.filter(c => c.organization_id === activeOrg?.id && (!specCpId || c.counterparty_id === specCpId)).map(c => (
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
                  <div className="flex gap-0.5 bg-gray-800 rounded-lg p-0.5">
                    {QQS_OPTIONS.map(opt => (
                      <button key={opt.val} type="button"
                        onClick={() => setSpecItems(specItems.map(item => calcItem({ ...item, qqs_foiz: opt.val })))}
                        className="px-2.5 py-1 rounded-md text-xs font-medium transition text-gray-400 hover:text-white hover:bg-gray-700">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {specItems.length > 0 && (
                <div className="rounded-xl border border-gray-700 overflow-hidden mb-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[580px]">
                      <thead>
                        <tr className="bg-gray-800 text-gray-400 text-left border-b border-gray-700">
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
                          <tr key={i} className="border-t border-gray-700/50">
                            <td className="px-3 py-1.5 text-gray-500 text-center">{i + 1}</td>
                            <td className="px-2 py-1.5">
                              <input className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs"
                                value={item.nomi} placeholder="Mahsulot nomi"
                                onChange={e => updateSpecItem(i, 'nomi', e.target.value)}/>
                            </td>
                            <td className="px-2 py-1.5">
                              <input className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none focus:border-blue-500 text-xs text-center"
                                value={item.birlik} placeholder="dona"
                                onChange={e => updateSpecItem(i, 'birlik', e.target.value)}/>
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none text-xs text-right"
                                value={item.miqdori} min={0}
                                onChange={e => updateSpecItem(i, 'miqdori', parseFloat(e.target.value) || 0)}/>
                            </td>
                            <td className="px-2 py-1.5">
                              <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white focus:outline-none text-xs text-right"
                                value={item.narxi} min={0}
                                onChange={e => updateSpecItem(i, 'narxi', parseFloat(e.target.value) || 0)}/>
                            </td>
                            <td className="px-2 py-1.5">
                              <select className="w-full bg-gray-800 border border-gray-700 rounded px-1 py-1 text-white focus:outline-none text-xs text-center"
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
                          <tr className="border-t-2 border-gray-600 bg-gray-800/60">
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
                className="w-full border-2 border-dashed border-gray-700 hover:border-emerald-600 text-gray-500 hover:text-emerald-400 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
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
