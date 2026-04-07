/**
 * Excel Shablon Kutubxonasi
 * ExcelJS yordamida buxgalteriya hujjatlari uchun standart uslublar.
 *
 * Eksport qilinadigan funksiyalar:
 *  - applyExcelStyles()  — varaqqa sarlavha/ma'lumot/jami uslublarini qo'llash
 *  - buildFakturaXlsx()  — Schyot-faktura
 *  - buildTolovGrafigiXlsx() — To'lov grafigi
 *  - buildAktSverkiXlsx()    — Akt sverki
 */

import ExcelJS from 'exceljs'

// ─── Rang palitrasi ───────────────────────────────────────────────────────────
const C = {
  headerBg:   '1F3864',   // jadval sarlavha foni (to'q ko'k)
  headerFg:   'FFFFFF',   // sarlavha matni (oq)
  titleBg:    'E8EDF5',   // hujjat sarlavhasi foni
  totalBg:    'D9E8FF',   // jami qator foni
  stripeBg:   'F5F7FF',   // toq qatorlar foni
  border:     '9BB0CC',   // chegara rangi
  redNum:     'CC2200',   // summalar (qizil)
  grayText:   '666666',   // ikkilamchi matn
  darkText:   '1A1A2E',   // asosiy matn
  white:      'FFFFFF',
  accent:     '2563EB',
} as const

// ─── Shrift nomi ──────────────────────────────────────────────────────────────
const FONT = 'Times New Roman'

// ─── Raqam formatlari ─────────────────────────────────────────────────────────
export const NUM_FMT = {
  money:    '#,##0.00 "so\'m"',
  moneyInt: '#,##0 "so\'m"',
  percent:  '0.00%',
  date:     'DD.MM.YYYY',
  integer:  '#,##0',
} as const

// ─── Chegara yordamchisi ──────────────────────────────────────────────────────
function thinBorder(color = C.border): Partial<ExcelJS.Border> {
  return { style: 'thin', color: { argb: 'FF' + color } }
}
function allBorders(color = C.border): Partial<ExcelJS.Borders> {
  const b = thinBorder(color)
  return { top: b, bottom: b, left: b, right: b }
}

// ─── Hujayra uslub yordamchilari ─────────────────────────────────────────────

/** Jadval sarlavhasi (to'q ko'k fon, oq shrift) */
export function headerStyle(bold = true): Partial<ExcelJS.Style> {
  return {
    font:      { name: FONT, size: 10, bold, color: { argb: 'FF' + C.headerFg } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.headerBg } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border:    allBorders(),
  }
}

/** Asosiy ma'lumot qatori */
export function dataStyle(
  align: ExcelJS.Alignment['horizontal'] = 'left',
  bold = false,
  stripe = false,
): Partial<ExcelJS.Style> {
  return {
    font:      { name: FONT, size: 10, bold, color: { argb: 'FF' + C.darkText } },
    fill:      stripe
      ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.stripeBg } }
      : { type: 'pattern', pattern: 'none' },
    alignment: { horizontal: align, vertical: 'middle', wrapText: true },
    border:    allBorders(),
  }
}

/** Jami / yakunlovchi qator */
export function totalStyle(
  align: ExcelJS.Alignment['horizontal'] = 'right',
  red = false,
): Partial<ExcelJS.Style> {
  return {
    font:  { name: FONT, size: 10, bold: true, color: { argb: 'FF' + (red ? C.redNum : C.darkText) } },
    fill:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.totalBg } },
    alignment: { horizontal: align, vertical: 'middle', wrapText: true },
    border: allBorders(),
    numFmt: NUM_FMT.moneyInt,
  }
}

/** Hujjat sarlavha qatori (birlashtirilgan hujayra) */
export function titleStyle(size = 14): Partial<ExcelJS.Style> {
  return {
    font:      { name: FONT, size, bold: true, color: { argb: 'FF' + C.darkText } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.titleBg } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  }
}

/** Rekvizit qatori (ikkilamchi ma'lumotlar) */
export function metaStyle(bold = false): Partial<ExcelJS.Style> {
  return {
    font:      { name: FONT, size: 9, bold, color: { argb: 'FF' + C.grayText } },
    alignment: { horizontal: 'left', vertical: 'middle' },
  }
}

/** Pul summasi hujayrasi */
export function moneyStyle(red = false, stripe = false): Partial<ExcelJS.Style> {
  return {
    font:      { name: FONT, size: 10, bold: false, color: { argb: 'FF' + (red ? C.redNum : C.darkText) } },
    fill:      stripe
      ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.stripeBg } }
      : { type: 'pattern', pattern: 'none' },
    alignment: { horizontal: 'right', vertical: 'middle' },
    border:    allBorders(),
    numFmt:    NUM_FMT.moneyInt,
  }
}

// ─── Ustun kengligini o'rnatish ───────────────────────────────────────────────
export function setColWidths(sheet: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w
  })
}

// ─── Schyot-faktura Excel shabloni ────────────────────────────────────────────

export interface FakturaData {
  fakRaqam: string
  sana: string
  shartnoma?: string
  org: { name?: string; inn?: string; bank_name?: string; bank_account?: string; mfo?: string; director_name?: string } | null
  xaridor: string
  xaridorInn?: string
  items: Array<{
    nomi: string; birlik: string; miqdori: number
    narxi: number; sozsiz: number; qqs: number; gross: number; qqsFoiz: string
  }>
  totalSozsiz: number; totalQqs: number; totalGross: number
}

export async function buildFakturaXlsx(data: FakturaData): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Shartnoma.uz'
  wb.created = new Date()

  const ws = wb.addWorksheet('Faktura', { pageSetup: { paperSize: 9, orientation: 'portrait' } })

  // Ustun kengliklari
  setColWidths(ws, [5, 36, 10, 10, 18, 18, 9, 15, 18])

  // ── Sarlavha bloki ────────────────────────────────────────
  ws.mergeCells('A1:I1')
  const titleCell = ws.getCell('A1')
  titleCell.value = `SCHYOT-FAKTURA № ${data.fakRaqam}`
  Object.assign(titleCell, titleStyle(14))
  ws.getRow(1).height = 28

  ws.mergeCells('A2:I2')
  const dateCell = ws.getCell('A2')
  dateCell.value = `Sana: ${data.sana}${data.shartnoma ? `  |  Shartnoma: ${data.shartnoma}` : ''}`
  Object.assign(dateCell, metaStyle())
  ws.getRow(2).height = 18

  ws.addRow([])

  // ── Tomonlar bloki ────────────────────────────────────────
  const partiesRow = ws.addRow(['SOTUVCHI:', data.org?.name || '___', '', '', 'XARIDOR:', data.xaridor || '___'])
  partiesRow.getCell(1).font = { name: FONT, size: 9, bold: true, color: { argb: 'FF' + C.grayText } }
  partiesRow.getCell(5).font = { name: FONT, size: 9, bold: true, color: { argb: 'FF' + C.grayText } }
  partiesRow.getCell(2).font = { name: FONT, size: 10, bold: true }
  partiesRow.getCell(6).font = { name: FONT, size: 10, bold: true }

  const metaRows: [string, string, string, string][] = [
    ['INN:', data.org?.inn || '___',          'INN:', data.xaridorInn || '___'],
    ['Bank:', data.org?.bank_name || '___',    '',     ''],
    ['H/R:', data.org?.bank_account || '___',  '',     ''],
    ['MFO:', data.org?.mfo || '___',           '',     ''],
  ]
  for (const [l1, v1, l2, v2] of metaRows) {
    const r = ws.addRow([l1, v1, '', '', l2, v2])
    r.eachCell({ includeEmpty: true }, cell => Object.assign(cell, metaStyle()))
    r.getCell(2).font = { name: FONT, size: 9, color: { argb: 'FF' + C.darkText } }
    r.getCell(6).font = { name: FONT, size: 9, color: { argb: 'FF' + C.darkText } }
  }
  ws.addRow([])

  // ── Jadval sarlavhasi ─────────────────────────────────────
  const hdr = ws.addRow(['№', 'Mahsulot/xizmat nomi', 'Birlik', 'Miqdor', "Narxi (so'm)", "Jami QQSsiz", 'QQS%', "QQS (so'm)", "Jami (so'm)"])
  hdr.height = 30
  hdr.eachCell(cell => Object.assign(cell, headerStyle()))

  // ── Ma'lumot qatorlari ────────────────────────────────────
  data.items.forEach((it, i) => {
    const stripe = i % 2 === 1
    const r = ws.addRow([
      i + 1, it.nomi, it.birlik, it.miqdori,
      it.narxi, it.sozsiz, it.qqsFoiz,
      it.qqs, it.gross,
    ])
    r.height = 20
    r.getCell(1).style = { ...dataStyle('center', false, stripe), numFmt: NUM_FMT.integer }
    r.getCell(2).style = dataStyle('left', false, stripe)
    r.getCell(3).style = dataStyle('center', false, stripe)
    r.getCell(4).style = { ...dataStyle('right', false, stripe), numFmt: NUM_FMT.integer }
    r.getCell(5).style = moneyStyle(false, stripe)
    r.getCell(6).style = moneyStyle(false, stripe)
    r.getCell(7).style = dataStyle('center', false, stripe)
    r.getCell(8).style = moneyStyle(false, stripe)
    r.getCell(9).style = moneyStyle(true, stripe)
  })

  // ── Jami qator ───────────────────────────────────────────
  const totRow = ws.addRow(['', 'JAMI', '', '', '', data.totalSozsiz, '', data.totalQqs, data.totalGross])
  totRow.height = 22
  for (let ci = 1; ci <= 9; ci++) {
    const cell = totRow.getCell(ci)
    if ([6, 8, 9].includes(ci)) {
      cell.style = totalStyle('right', ci === 9)
    } else {
      cell.style = totalStyle('right')
      cell.numFmt = ''
      cell.value = cell.value || null
    }
  }
  totRow.getCell(2).font = { name: FONT, size: 10, bold: true, color: { argb: 'FF' + C.darkText } }

  ws.addRow([])

  // ── Foter qatorlari ───────────────────────────────────────
  const fmtMoney = (n: number) => Math.round(n).toLocaleString('uz-UZ') + " so'm"
  for (const [label, val] of [
    [`Jami QQSsiz:`, fmtMoney(data.totalSozsiz)],
    [`QQS:`, fmtMoney(data.totalQqs)],
    [`JAMI TO'LASH:`, fmtMoney(data.totalGross)],
  ]) {
    const r = ws.addRow([label, val])
    r.getCell(1).font = { name: FONT, size: 10, bold: true }
    r.getCell(2).font = { name: FONT, size: 10, bold: true, color: { argb: 'FF' + C.redNum } }
  }
  ws.addRow([`To'lov maqsadi: Schyot-faktura № ${data.fakRaqam} bo'yicha to'lov`])
  ws.addRow([`Bank: ${data.org?.bank_name || '___'}  H/R: ${data.org?.bank_account || '___'}  MFO: ${data.org?.mfo || '___'}`])
  ws.addRow([])
  ws.addRow([`Sotuvchi rahbari: _________________ / ${data.org?.director_name || '___'}    M.O.    Sana: ${data.sana}`])
  ws.addRow(['Bosh buxgalter:   _________________ / ___'])

  // ── Fayl yuklash ─────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `faktura_${data.fakRaqam || data.sana}.xlsx`; a.click()
  URL.revokeObjectURL(url)
}

// ─── To'lov grafigi Excel shabloni ────────────────────────────────────────────

export interface TolovRow {
  num: number; sana: string; asosiy: number; foiz: number; jami: number; qoldiq: number; izoh?: string
}

export interface TolovGrafigiData {
  tashkilot: string; kontragent: string; shartnoma: string
  summa: number; foiz: number; sana: string
  rows: TolovRow[]
}

export async function buildTolovGrafigiXlsx(data: TolovGrafigiData): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Shartnoma.uz'

  const ws = wb.addWorksheet("To'lov grafigi")
  setColWidths(ws, [6, 14, 18, 18, 18, 18, 20])

  ws.mergeCells('A1:G1')
  const t = ws.getCell('A1')
  t.value = "TO'LOV GRAFIGI"
  Object.assign(t, titleStyle(14))
  ws.getRow(1).height = 28

  ws.mergeCells('A2:G2')
  const sub = ws.getCell('A2')
  sub.value = `${data.tashkilot} ↔ ${data.kontragent}  |  ${data.shartnoma}  |  Sana: ${data.sana}`
  Object.assign(sub, metaStyle())
  ws.getRow(2).height = 18

  ws.addRow([])

  const hdr = ws.addRow(['№', 'Sana', "Asosiy to'lov", "Foiz to'lov", "Jami to'lov", 'Qoldiq', 'Izoh'])
  hdr.height = 28
  hdr.eachCell(cell => Object.assign(cell, headerStyle()))

  data.rows.forEach((row, i) => {
    const stripe = i % 2 === 1
    const isGrace = !!row.izoh
    const r = ws.addRow([row.num, row.sana, row.asosiy, row.foiz, row.jami, row.qoldiq, row.izoh || ''])
    r.height = 18
    r.getCell(1).style = dataStyle('center', false, stripe)
    r.getCell(2).style = { ...dataStyle('center', false, stripe), numFmt: NUM_FMT.date }
    for (const ci of [3, 4, 5, 6]) {
      r.getCell(ci).style = moneyStyle(ci === 5, stripe)
    }
    r.getCell(7).style = dataStyle('center', isGrace, stripe)
    if (isGrace) r.getCell(7).font = { name: FONT, size: 9, italic: true, color: { argb: 'FF' + C.grayText } }
  })

  // Jami
  const tot = ws.addRow([
    '', 'JAMI',
    data.rows.reduce((s, r) => s + r.asosiy, 0),
    data.rows.reduce((s, r) => s + r.foiz, 0),
    data.rows.reduce((s, r) => s + r.jami, 0),
    '', '',
  ])
  tot.height = 22
  tot.getCell(2).style = totalStyle('center')
  for (const ci of [3, 4, 5]) tot.getCell(ci).style = totalStyle('right', ci === 5)

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `tolov-grafigi_${data.shartnoma || data.sana}.xlsx`; a.click()
  URL.revokeObjectURL(url)
}

// ─── Akt sverki Excel shabloni ────────────────────────────────────────────────

export interface AktRow {
  sana: string; hujjat: string; debet: number; kredit: number; qoldiq: number
}

export interface AktSverkiData {
  tashkilot: string; tashkilotInn?: string; direkto?: string
  kontragent: string; shartnoma?: string; davr: string
  rows: AktRow[]
  boshQoldiq: number; debetJami: number; kreditJami: number; yakunQoldiq: number
}

export async function buildAktSverkiXlsx(data: AktSverkiData): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Shartnoma.uz'

  const ws = wb.addWorksheet('Akt Sverki')
  setColWidths(ws, [14, 24, 18, 18, 18])

  ws.mergeCells('A1:E1')
  const t = ws.getCell('A1')
  t.value = "O'ZARO HISOB-KITOBLARNI TEKSHIRISH AKTI"
  Object.assign(t, titleStyle(13))
  ws.getRow(1).height = 28

  ws.mergeCells('A2:E2')
  const sub = ws.getCell('A2')
  sub.value = `${data.davr} davri  |  ${data.tashkilot} ↔ ${data.kontragent}${data.shartnoma ? `  |  ${data.shartnoma}` : ''}`
  Object.assign(sub, metaStyle())
  ws.getRow(2).height = 18

  ws.addRow([])

  const hdr = ws.addRow(['Sana', 'Hujjat', 'Debet (so\'m)', 'Kredit (so\'m)', 'Qoldiq (so\'m)'])
  hdr.height = 28
  hdr.eachCell(cell => Object.assign(cell, headerStyle()))

  // Boshlanish qoldig'i
  const startRow = ws.addRow(['', 'Boshlanish qoldig\'i', '', '', data.boshQoldiq])
  startRow.getCell(2).font = { name: FONT, size: 9, italic: true, color: { argb: 'FF' + C.grayText } }
  startRow.getCell(5).style = moneyStyle()

  data.rows.forEach((row, i) => {
    const stripe = i % 2 === 1
    const r = ws.addRow([row.sana, row.hujjat, row.debet || null, row.kredit || null, row.qoldiq])
    r.height = 18
    r.getCell(1).style = { ...dataStyle('center', false, stripe), numFmt: NUM_FMT.date }
    r.getCell(2).style = dataStyle('left', false, stripe)
    r.getCell(3).style = moneyStyle(false, stripe)
    r.getCell(4).style = moneyStyle(false, stripe)
    r.getCell(5).style = moneyStyle(false, stripe)
  })

  // Jami
  const tot = ws.addRow(['', 'JAMI', data.debetJami, data.kreditJami, data.yakunQoldiq])
  tot.height = 22
  tot.getCell(2).style = totalStyle('left')
  for (const ci of [3, 4]) tot.getCell(ci).style = totalStyle('right')
  tot.getCell(5).style = totalStyle('right', true)

  ws.addRow([])
  ws.addRow([`Yakuniy qoldiq: ${Math.abs(data.yakunQoldiq).toLocaleString('uz-UZ')} so'm (${data.yakunQoldiq >= 0 ? data.kontragent + ' zimmasida' : data.tashkilot + ' zimmasida'})`])

  ws.addRow([])
  ws.addRow([`${data.tashkilot}`, '', '', '', `${data.kontragent}`])
  ws.addRow([`Rahbar: ________ / ${data.direkto || '___'}`, '', '', '', 'Rahbar: ________ / ___'])
  ws.addRow(['M.O.', '', '', '', 'M.O.'])

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `akt-sverki_${data.davr || 'yangi'}.xlsx`; a.click()
  URL.revokeObjectURL(url)
}
