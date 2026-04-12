import { cyrillicToLatin } from '@/lib/downloadUtils'
import { formatDateUz } from '@/lib/contractStructures'
import { fillPlaceholders } from '@/lib/contractUtils'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import type { Contract } from '@/lib/types'
import { PDF_MARGINS, PDF_SIZE, COLORS } from './documentStyles'

export async function generateContractPDF(c: Contract): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageWidth  = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const ML = PDF_MARGINS.left, MR = PDF_MARGINS.right, MT = PDF_MARGINS.top, MB = PDF_MARGINS.bottom
  const contentWidth = pageWidth - ML - MR
  let y = MT

  // ─ Header ─
  const orgName = cyrillicToLatin(c.organizations?.name || 'Tashkilot')
  doc.setFontSize(PDF_SIZE.small)
  doc.setTextColor(...COLORS.pdf.lightGray)
  const orgNameLines = doc.splitTextToSize(orgName, contentWidth) as string[]
  for (const ln of orgNameLines) { doc.text(ln, ML, y); y += 5 }

  doc.setFontSize(PDF_SIZE.title)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLORS.pdf.black)
  const typeName = cyrillicToLatin((CONTRACT_TYPE_NAMES as Record<string, string>)[c.contract_type] || c.contract_type)
  doc.text(typeName.toUpperCase(), pageWidth / 2, y, { align: 'center' })
  y += 7
  doc.setFontSize(PDF_SIZE.heading)
  doc.setFont('helvetica', 'normal')
  doc.text(`No ${c.contract_number}`, pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.setFontSize(PDF_SIZE.section)
  doc.setTextColor(...COLORS.pdf.gray)
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

  const hlTokens: Array<{ val: string; r: number; g: number; b: number }> = []
  const _pname = cyrillicToLatin(c.product_name || '').trim()
  const _amount = cyrillicToLatin(Number(c.amount || 0).toLocaleString('uz-UZ')).trim()
  if (_pname) hlTokens.push({ val: _pname, r: 0, g: 90, b: 200 })
  if (_amount && _amount !== '0') hlTokens.push({ val: _amount, r: 180, g: 30, b: 30 })

  function drawLine(line: string, startX: number, lineY: number) {
    if (!hlTokens.length) { doc.text(line, startX, lineY); return }
    let rem = line
    let cx = startX
    while (rem.length > 0) {
      let best: { idx: number; len: number; r: number; g: number; b: number } | null = null
      for (const h of hlTokens) {
        const idx = rem.indexOf(h.val)
        if (idx !== -1 && (!best || idx < best.idx)) best = { idx, len: h.val.length, r: h.r, g: h.g, b: h.b }
      }
      if (!best) { doc.setTextColor(...COLORS.pdf.darkGray); doc.text(rem, cx, lineY); break }
      if (best.idx > 0) {
        const before = rem.slice(0, best.idx)
        doc.setTextColor(...COLORS.pdf.darkGray); doc.text(before, cx, lineY)
        cx += doc.getTextWidth(before)
      }
      const hl = rem.slice(best.idx, best.idx + best.len)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(best.r, best.g, best.b); doc.text(hl, cx, lineY)
      doc.setFont('helvetica', 'normal')
      cx += doc.getTextWidth(hl)
      rem = rem.slice(best.idx + best.len)
    }
    doc.setTextColor(...COLORS.pdf.darkGray)
  }

  const filledContent = fillPlaceholders(c.content || '', c).replace(/\*\*([^*]+)\*\*/g, '$1')
  const rekvizitIdx = filledContent.search(/\n[ \t]*(\d+\.\s*)?(TOMONLARNING REKVIZITLARI|TOMONLARNING IMZOLARI|PARTIES' DETAILS)/i)
  const contentForPdf = rekvizitIdx !== -1 ? filledContent.slice(0, rekvizitIdx) : filledContent
  const rawLines = contentForPdf.split('\n')

  for (let li = 0; li < rawLines.length; li++) {
    const raw = rawLines[li]
    const safe = cyrillicToLatin(raw)
    const trimmed = safe.trim()

    if (!trimmed) { y += 2.5; continue }

    const isSection = /^(\d+[\.\)]\s|§\s*\d)/.test(trimmed) ||
      (trimmed.length <= 60 && /^[A-Z\s\.\-:'"]{6,}$/.test(trimmed))
    const isLabel = /^(BUYURTMACHI|IJROCHI|TOMONLAR|M\.O\.|Imzo|Sign)/i.test(trimmed)

    if (isSection || isLabel) {
      y += 2
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(PDF_SIZE.section)
      doc.setTextColor(...COLORS.pdf.black)
      const wrapped = doc.splitTextToSize(trimmed, contentWidth)
      for (const wl of wrapped) { guardY(6); doc.text(wl, ML, y); y += 5.5 }
      y += 0.5
      doc.setFont('helvetica', 'normal')
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(PDF_SIZE.section)
      doc.setTextColor(...COLORS.pdf.darkGray)
      const prevRaw = li > 0 ? rawLines[li - 1] : ''
      const indent = !prevRaw.trim() ? 8 : 0
      const firstPart = doc.splitTextToSize(trimmed, contentWidth - indent)
      guardY(5.5)
      drawLine(firstPart[0], ML + indent, y); y += 5.5
      if (firstPart.length > 1) {
        const rest = doc.splitTextToSize(firstPart.slice(1).join(' '), contentWidth)
        for (const wl of rest) { guardY(5.5); drawLine(wl, ML, y); y += 5.5 }
      }
    }
  }

  y += 8

  // ─ Spec items table ─
  if (c.spec_items && c.spec_items.length > 0) {
    if (y > pageHeight - 60) { doc.addPage(); y = MT }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PDF_SIZE.heading)
    doc.setTextColor(...COLORS.pdf.black)
    doc.text('SPESIFIKATSIYA', ML, y)
    y += 6

    const cols = ['#', 'Nomi', 'Birlik', 'Miqdori', 'Narxi', 'QQS%', 'Summa']
    const colW = [8, 58, 16, 18, 24, 14, 22]
    const rowH = 6.5

    doc.setFont('helvetica', 'bold')
    doc.setFillColor(...COLORS.pdf.tableHeader)
    doc.setDrawColor(150, 150, 180)
    let cx = ML
    doc.setFontSize(PDF_SIZE.tableHdr)
    doc.setTextColor(...COLORS.pdf.white)
    cols.forEach((col, i) => {
      doc.rect(cx, y, colW[i], rowH, 'FD')
      doc.text(col, cx + 1.5, y + 4.5)
      cx += colW[i]
    })
    y += rowH

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(PDF_SIZE.tableRow)
    doc.setTextColor(...COLORS.pdf.black)
    let total = 0
    c.spec_items.forEach((item, idx) => {
      if (y > pageHeight - MB - 10) { doc.addPage(); y = MT }
      cx = ML
      if (idx % 2 === 0) {
        doc.setFillColor(...COLORS.pdf.tableStripe)
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
        const cellText = doc.splitTextToSize(cell, colW[i] - 2) as string[]
        doc.text(cellText[0] || '', cx + 1.5, y + 4.5)
        cx += colW[i]
      })
      total += item.summa || 0
      y += rowH
    })

    doc.setFillColor(...COLORS.pdf.tableTotal)
    doc.rect(ML, y, colW.reduce((a, b) => a + b, 0), rowH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(PDF_SIZE.small)
    const jamiX = ML + colW[0] + colW[1] + colW[2] + colW[3] + colW[4]
    doc.text("Jami:", jamiX + 1, y + 4.5)
    doc.text(total.toLocaleString() + " so'm", jamiX + colW[5] + 1, y + 4.5)
    doc.setFont('helvetica', 'normal')
    y += rowH + 6
  }

  // ─ Imzolar ─
  if (y > pageHeight - 60) { doc.addPage(); y = MT }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_SIZE.section)
  doc.setTextColor(...COLORS.pdf.darkGray)
  doc.text('TOMONLARNING IMZOLARI', pageWidth / 2, y, { align: 'center' })
  y += 8

  const leftX = ML
  const rightX = pageWidth / 2 + 10

  const sigOrgName = cyrillicToLatin(c.organizations?.name || '___')
  const sigCpName  = cyrillicToLatin(c.counterparties?.name || '___')
  const sigOrgDir  = cyrillicToLatin(c.organizations?.director_name || '___')
  const sigCpDir   = cyrillicToLatin(c.counterparties?.director_name || '___')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(PDF_SIZE.section)
  doc.text('BUYURTMACHI:', leftX, y)
  doc.text('IJROCHI:', rightX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(PDF_SIZE.tableRow)
  const orgNameShort = doc.splitTextToSize(sigOrgName, 80) as string[]
  const cpNameShort  = doc.splitTextToSize(sigCpName, 80) as string[]
  doc.text(orgNameShort[0], leftX, y)
  doc.text(cpNameShort[0], rightX, y)
  y += 6

  if (y > pageHeight - MB - 25) { doc.addPage(); y = MT }
  y += 22
  doc.setDrawColor(...COLORS.pdf.gray)
  doc.line(leftX, y, leftX + 70, y)
  doc.line(rightX, y, rightX + 70, y)
  y += 4
  doc.setFontSize(PDF_SIZE.tableRow)
  doc.setTextColor(...COLORS.pdf.darkGray)
  doc.text(`/ ${sigOrgDir}`, leftX, y)
  doc.text(`/ ${sigCpDir}`, rightX, y)
  y += 5
  doc.setTextColor(...COLORS.pdf.gray)
  doc.text('M.O.', leftX + 30, y)
  doc.text('M.O.', rightX + 30, y)

  // ─ Footer ─
  const totalPages = (doc.internal as unknown as { getNumberOfPages(): number }).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(PDF_SIZE.footer)
    doc.setTextColor(...COLORS.pdf.lightGray)
    doc.text('Shartnoma.uz', pageWidth / 2, pageHeight - 10, { align: 'center' })
    doc.text(`${i} / ${totalPages}`, pageWidth - MR, pageHeight - 10, { align: 'right' })
  }

  doc.save(`shartnoma-${c.contract_number || 'yangi'}.pdf`)
}
