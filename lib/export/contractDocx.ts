import { formatDateUz, numberToWords } from '@/lib/contractStructures'
import { fillPlaceholders } from '@/lib/contractUtils'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import type { Contract } from '@/lib/types'
import type { ITableCellBorders } from 'docx'

export async function generateContractDOCX(c: Contract, returnBlob = false): Promise<Blob | void> {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, BorderStyle, Footer, PageNumber, UnderlineType,
  } = await import('docx')

  type Align = typeof AlignmentType[keyof typeof AlignmentType]

  const typeName = (CONTRACT_TYPE_NAMES as Record<string, string>)[c.contract_type] || c.contract_type
  const F = 'Times New Roman'

  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
  const thinBorder = { style: BorderStyle.SINGLE, size: 6, color: '888888' }
  const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder }

  function lineKind(line: string): 'empty' | 'main' | 'sub' | 'sub_label' | 'label' | 'bullet' | 'body' {
    const t = line.trim()
    if (!t || /^={3,}$|^-{3,}$/.test(t)) return 'empty'
    if (/^(\d+\.\s+\S|§\s*\d)/.test(t) && !/^\d+\.\d/.test(t)) return 'main'
    if (/^\d+\.\d+/.test(t)) return /:\s*$/.test(t) ? 'sub_label' : 'sub'
    if (/^[A-ZЎҚҒҲ][A-ZЎҚҒҲ\s]{2,20}:\s*$/.test(t)) return 'label'
    if (/^[-–•]\s/.test(t)) return 'bullet'
    return 'body'
  }

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

  // Content cleaning
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

  // Bilingual 2-column rendering for xalqaro contracts
  const midBorder = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' }
  const biL: ITableCellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: midBorder }
  const biR: ITableCellBorders = { top: noBorder, bottom: noBorder, left: midBorder, right: noBorder }

  function biCell(text: string, borders: ITableCellBorders, isHeading: boolean) {
    return new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders,
      margins: { top: 40, bottom: 40, left: 150, right: 150 },
      children: [new Paragraph({
        alignment: isHeading ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        spacing: { after: 0, line: 240 },
        children: isHeading
          ? [new TextRun({ text, bold: true, size: 21, font: F, color: '1F3864' })]
          : richRuns(text),
      })],
    })
  }

  function biRow(en: string, uz: string, isHeading = false) {
    return new TableRow({ children: [biCell(en, biL, isHeading), biCell(uz, biR, isHeading)] })
  }

  function biSpacerRow() {
    return new TableRow({ children: [
      new TableCell({ borders: biL, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new Paragraph({ text: '', spacing: { after: 0, line: 60 } })] }),
      new TableCell({ borders: biR, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children: [new Paragraph({ text: '', spacing: { after: 0, line: 60 } })] }),
    ]})
  }

  function buildBilingualTable() {
    const rows: ReturnType<typeof biRow>[] = []
    let li = 0
    const lines = cleanedLines
    while (li < lines.length) {
      const t = lines[li].trim()
      if (!t || /^={3,}$|^-{3,}$/.test(t)) { rows.push(biSpacerRow()); li++; continue }
      if (/^ARTICLE\s+\d+\./i.test(t)) {
        const si = t.indexOf(' / ')
        rows.push(biRow(si !== -1 ? t.slice(0, si) : t, si !== -1 ? t.slice(si + 3) : '', true))
        li++; continue
      }
      if (t.includes(' / ') && !/^\d+\.\d+/.test(t)) {
        const si = t.indexOf(' / ')
        rows.push(biRow(t.slice(0, si), t.slice(si + 3)))
        li++; continue
      }
      const next = lines[li + 1]?.trim() || ''
      const nextIsNew = !next || /^ARTICLE\s+\d+\./i.test(next) || /^\d+\.\d+/.test(next) || /^[-–•]\s/.test(next) || /^={3,}$|^-{3,}$/.test(next)
      if (next && !nextIsNew) { rows.push(biRow(t, next)); li += 2; continue }
      rows.push(biRow(t, ''))
      li++
    }
    return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
  }

  const contentParagraphs = c.contract_type === 'xalqaro'
    ? [buildBilingualTable()]
    : cleanedLines.map((line, i, arr) => {
        const t = line.trim()
        const kind = lineKind(line)
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
        const isStart = ['empty', 'main', 'sub', 'sub_label', 'label'].includes(prevKind)
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

  const partyLabels: Record<string, [string, string]> = {
    oldi_sotdi: ['SOTUVCHI', 'XARIDOR'],
    xizmat:     ['BUYURTMACHI', 'IJROCHI'],
    ijara:      ['IJARABERUVCHI', 'IJARACHI'],
    pudrat:     ['BUYURTMACHI', 'PUDRATCHI'],
  }
  const [label1, label2] = partyLabels[c.contract_type] || ['1-TOMON', '2-TOMON']

  const B = { font: F, color: '000000', bold: true }
  type OrgLike = { name?: string; inn?: string; address?: string; director_name?: string; bank_name?: string; bank_account?: string; mfo?: string } | null | undefined

  function orgCell(title: string, org: OrgLike) {
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
        new Paragraph({ children: [new TextRun({ ...B, text: 'M.O.', size: 20 })], spacing: { after: 0 } }),
      ],
    })
  }

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [orgCell(label1, c.organizations), orgCell(label2, c.counterparties)] })],
  })

  // Simple signature table for spec appendix — only name, director, signature, stamp
  function specOrgCell(title: string, org: OrgLike) {
    return new TableCell({
      borders: cellBorders,
      margins: { top: 160, bottom: 160, left: 220, right: 220 },
      children: [
        new Paragraph({ children: [new TextRun({ ...B, text: title, size: 24 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ ...B, text: org?.name || '___', size: 22 })], spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ ...B, text: `Rahbar: ${org?.director_name || '___'}`, size: 20 })], spacing: { after: 240 } }),
        new Paragraph({ children: [new TextRun({ ...B, text: '_________________________', size: 22 })], spacing: { after: 20 } }),
        new Paragraph({ children: [new TextRun({ ...B, text: 'M.O.', size: 20 })], spacing: { after: 0 } }),
      ],
    })
  }

  const specSigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [specOrgCell(label1, c.organizations), specOrgCell(label2, c.counterparties)] })],
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

  // 1-ILOVA: Spec table
  const specItems = (c.spec_items || [])
  const headerBg = '1F3864'

  const headerCell = (text: string, w: number, align: Align = AlignmentType.CENTER) =>
    new TableCell({
      width: { size: w, type: WidthType.PERCENTAGE },
      shading: { fill: headerBg },
      borders: cellBorders,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ alignment: align, children: [new TextRun({ text, bold: true, size: 18, font: F, color: 'FFFFFF' })] })],
    })

  const dataCell = (text: string, w: number, align: Align = AlignmentType.CENTER, bold = false, color = '000000') =>
    new TableCell({
      width: { size: w, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      children: [new Paragraph({ alignment: align, children: [new TextRun({ text, bold, size: 20, font: F, color })] })],
    })

  const fmt = (n: number) => n.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const specSection = specItems.length > 0 ? [
    new Paragraph({ pageBreakBefore: true, text: '' }),
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 40 }, children: [new TextRun({ text: '1-ILOVA', bold: true, size: 22, font: F })] }),
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 40 }, children: [new TextRun({ text: `№${c.contract_number}-sonli shartnomaga`, size: 20, font: F })] }),
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 200 }, children: [new TextRun({ text: `${c.contract_date} dan`, size: 20, font: F })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: 'NARXNI KELISHISH PROTOKOLI', bold: true, size: 26, font: F, underline: {} })],
    }),
    new Table({
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
        ...specItems.map((item, i) => {
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
        (() => {
          const totalBase = specItems.reduce((s, i) => s + i.miqdori * i.narxi, 0)
          const totalQqs  = specItems.reduce((s, i) => s + i.qqs_summa, 0)
          const totalSum  = specItems.reduce((s, i) => s + i.summa, 0)
          return new TableRow({
            children: [
              new TableCell({
                columnSpan: 5, borders: cellBorders, shading: { fill: 'F2F2F2' },
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'JAMI:', bold: true, size: 22, font: F })] })],
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
    new Paragraph({
      spacing: { before: 120, after: 80 },
      children: [new TextRun({ text: `Jami so'z bilan: ${numberToWords(Math.round(specItems.reduce((s, i) => s + i.summa, 0)), 'uz')} so'm`, bold: true, size: 22, font: F })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [new TextRun({ text: "Ushbu Protokol Shartnomaning ajralmas qismi hisoblanadi va ikki nusxada tuzilgan.", size: 20, font: F, italics: true })],
    }),
    new Paragraph({ text: '', spacing: { after: 240 } }),
    specSigTable,
  ] : []

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 567, right: 851 } } },
      footers: { default: footer },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: typeName.toUpperCase(), bold: true, size: 32, font: F })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: `№ ${c.contract_number}`, bold: true, size: 26, font: F })] }),
        cityDateTable,
        ...contentParagraphs,
        new Paragraph({ text: '', spacing: { after: 480 } }),
        sigTable,
        ...specSection,
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  if (returnBlob) return blob
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `shartnoma-${c.contract_number || 'yangi'}.docx`
  a.click()
  URL.revokeObjectURL(url)
}
