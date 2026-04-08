import { cyrillicToLatin } from '@/lib/downloadUtils'
import { numberToWords, formatDateUz } from '@/lib/contractStructures'
import type { Specification, Org, Counterparty } from '@/lib/types'

type OrgLike = {
  name?: string; inn?: string; address?: string; director_name?: string
  bank_name?: string; bank_account?: string; mfo?: string
}

export async function generateSpecWord(
  spec: Specification,
  activeOrg: Org | null,
  cps: Counterparty[]
): Promise<void> {
  const {
    Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
    WidthType, AlignmentType, BorderStyle, Footer, PageNumber,
  } = await import('docx')

  type Align = typeof AlignmentType[keyof typeof AlignmentType]

  const items = Array.isArray(spec.items) ? spec.items : []
  const totalBase = items.reduce((s, i) => s + i.miqdori * i.narxi, 0)
  const totalQqs  = items.reduce((s, i) => s + (i.qqs_summa || 0), 0)
  const totalJami = items.reduce((s, i) => s + (i.summa || 0), 0)
  const F = 'Times New Roman'
  const fmt = (n: number) => n.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const thinBorder = { style: BorderStyle.SINGLE, size: 6, color: '888888' }
  const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }
  const headerBg = '1F3864'

  const p = (text: string, opts: { bold?: boolean; underline?: boolean; size?: number; align?: Align; italic?: boolean; color?: string; spaceBefore?: number; spaceAfter?: number; indent?: boolean } = {}) =>
    new Paragraph({
      alignment: opts.align ?? AlignmentType.LEFT,
      spacing: { line: 276, lineRule: 'auto' as const, before: opts.spaceBefore ?? 0, after: opts.spaceAfter ?? 80 },
      indent: opts.indent ? { firstLine: 426 } : undefined,
      children: [new TextRun({
        text,
        bold: opts.bold,
        underline: opts.underline ? {} : undefined,
        italics: opts.italic,
        font: F,
        size: opts.size ?? 24,
        color: opts.color ?? '000000',
      })],
    })

  const headerCell = (text: string, w: number, align: Align = AlignmentType.CENTER) =>
    new TableCell({
      width: { size: w, type: WidthType.PERCENTAGE },
      shading: { fill: headerBg },
      borders: cellBorders,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ alignment: align, children: [new TextRun({ text, bold: true, size: 20, font: F, color: 'FFFFFF' })] })],
    })

  const dataCell = (text: string, w: number, align: Align = AlignmentType.CENTER, bold = false, color = '000000') =>
    new TableCell({
      width: { size: w, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      children: [new Paragraph({ alignment: align, spacing: { line: 276, lineRule: 'auto' as const }, children: [new TextRun({ text, bold, size: 22, font: F, color })] })],
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
            shading: { fill: 'F0F4FF' },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'JAMI:', bold: true, size: 24, font: F })] })],
          }),
          dataCell(fmt(totalBase), 13, AlignmentType.RIGHT, true),
          dataCell('', 9),
          dataCell(fmt(totalQqs), 10, AlignmentType.RIGHT, true),
          dataCell(fmt(totalJami), 10, AlignmentType.RIGHT, true, '1F3864'),
        ],
      }),
    ],
  })

  // Signature table
  const contract = spec.contracts
  const cpFull: OrgLike | null = contract?.counterparty_id
    ? cps.find(c => c.id === contract.counterparty_id) || null
    : null
  const cp: OrgLike | undefined = cpFull || (contract?.counterparties as OrgLike | undefined)

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }

  function orgCell(title: string, org: OrgLike | null | undefined) {
    return new TableCell({
      borders: noBorders,
      margins: { top: 160, bottom: 160, left: 160, right: 160 },
      children: [
        new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, size: 24, font: F, underline: {} })] }),
        new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: org?.name || '_______________', bold: true, size: 24, font: F })] }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `Rahbar: ${org?.director_name || '_______________'}`, size: 22, font: F })] }),
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `INN: ${org?.inn || '_______________'}`, size: 22, font: F })] }),
        new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: '_________________________', size: 22, font: F })] }),
        new Paragraph({ children: [new TextRun({ text: 'M.O.', size: 20, font: F, color: '666666' })] }),
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
    styles: {
      default: {
        document: {
          run: { font: F, size: 24, color: '000000' },
          paragraph: { spacing: { line: 276, lineRule: 'auto' as const } },
        },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 851, right: 851 } } },
      footers: { default: footer },
      children: [
        ...(contract ? [
          p('1-ILOVA', { bold: true, align: AlignmentType.RIGHT, spaceAfter: 40 }),
          p(`№${contract.contract_number}-sonli shartnomaga`, { align: AlignmentType.RIGHT, spaceAfter: 40 }),
          p(`${contractDate} dan`, { align: AlignmentType.RIGHT, spaceAfter: 200 }),
        ] : [
          p(`Sana: ${formatDateUz(spec.created_at.split('T')[0])}`, { align: AlignmentType.RIGHT, spaceAfter: 200 }),
        ]),
        p('NARXNI KELISHISH PROTOKOLI', { bold: true, underline: true, size: 28, align: AlignmentType.CENTER, spaceAfter: 200 }),
        specTable,
        p(`Jami so'z bilan: ${numberToWords(Math.round(totalJami), 'uz')} so'm`, { bold: true, spaceBefore: 120, spaceAfter: 80 }),
        p("Ushbu Protokol Shartnomaning ajralmas qismi hisoblanadi va ikki nusxada tuzilgan.", { italic: true, spaceAfter: 240 }),
        new Paragraph({ text: '', spacing: { after: 280 } }),
        sigTable,
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `Spesifikatsiya-${spec.spec_number}.docx`; a.click()
  URL.revokeObjectURL(url)
}

export async function generateSpecPDF(
  spec: Specification,
  activeOrg: Org | null,
  cps: Counterparty[]
): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210, pageH = 297, mL = 20, mR = 20, mT = 20, mB = 28
  const cW = pageW - mL - mR
  const safe = (s: string) => cyrillicToLatin(s || '')

  const contract = spec.contracts
  const cpFull: Counterparty | null = contract?.counterparty_id
    ? cps.find(cp => cp.id === contract.counterparty_id) || null
    : null

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

  const asosiy = spec.items.reduce((s, it) => s + it.miqdori * it.narxi, 0)
  const qqsJami = spec.items.reduce((s, it) => s + it.qqs_summa, 0)
  const grand   = spec.items.reduce((s, it) => s + it.summa, 0)
  y += 3
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  const totals: [string, string][] = [
    ['Asosiy summa:', asosiy.toLocaleString() + " so'm"],
    ['QQS jami:', qqsJami > 0 ? qqsJami.toLocaleString() + " so'm" : '—'],
    ['JAMI:', grand.toLocaleString() + " so'm"],
  ]
  totals.forEach(([label, val]) => {
    doc.text(safe(label), pageW - mR - 60, y)
    doc.text(safe(val), pageW - mR, y, { align: 'right' })
    y += 6
  })

  y += 8
  if (y > pageH - 50) { doc.addPage(); y = mT }
  const half = cW / 2
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80)
  doc.text('SOTUVCHI:', mL, y); doc.text('XARIDOR:', mL + half + 5, y); y += 5
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 0, 0)
  doc.text(safe(activeOrg?.name || '—'), mL, y)
  doc.text(safe(cpFull?.name || contract?.counterparties?.name || '—'), mL + half + 5, y); y += 8
  doc.setDrawColor(0, 0, 0)
  doc.line(mL, y, mL + 55, y); doc.line(mL + half + 5, y, mL + half + 60, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(80, 80, 80)
  doc.text(safe(`Rahbar: _____________ / ${activeOrg?.director_name || ''}`), mL, y + 5)
  doc.text(safe(`Rahbar: _____________ / ${cpFull?.director_name || ''}`), mL + half + 5, y + 5)

  const totalPages = (doc.internal as unknown as { getNumberOfPages(): number }).getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(7.5); doc.setTextColor(160, 160, 160)
    doc.text('Shartnoma.uz', pageW / 2, pageH - 10, { align: 'center' })
    doc.text(`${p} / ${totalPages}`, pageW - mR, pageH - 10, { align: 'right' })
  }

  doc.save(`spec-${spec.spec_number}.pdf`)
}
