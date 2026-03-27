'use client'

import { useState, useRef, useEffect } from 'react'
import type { Org, Counterparty } from '@/lib/types'

type Props = { org: Org | null; cps: Counterparty[] }
type QqsFoiz = '0' | '12' | '15' | 'siz'
type Item = { id: number; nomi: string; birlik: string; miqdori: string; narxi: string; qqs: QqsFoiz }

function calcItem(it: Item) {
  const m = parseFloat(it.miqdori) || 0
  const n = parseFloat(it.narxi.replace(/[\s,]/g, '')) || 0
  const gross = m * n
  const rate = it.qqs === 'siz' ? 0 : it.qqs === '0' ? 0 : parseFloat(it.qqs) / 100
  // QQS ichida (included in price) — O'zbekiston standarti
  const qqs = it.qqs === 'siz' ? 0 : Math.round(gross * rate / (1 + rate))
  const sozsiz = gross - qqs
  return { gross, qqs, sozsiz }
}

let _id = 1

export default function FakturaBuilder({ org, cps }: Props) {
  const [fakRaqam, setFakRaqam] = useState('')
  const [sana, setSana] = useState(new Date().toISOString().split('T')[0])
  const [xaridor, setXaridor] = useState('')
  const [xaridorInn, setXaridorInn] = useState('')
  const [xaridorBank, setXaridorBank] = useState('')
  const [xaridorMfo, setXaridorMfo] = useState('')
  const [items, setItems] = useState<Item[]>([{ id: _id++, nomi: '', birlik: 'dona', miqdori: '1', narxi: '', qqs: '12' }])
  const [cpSearch, setCpSearch] = useState('')
  const [cpOpen, setCpOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [xlsxLoading, setXlsxLoading] = useState(false)
  const cpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (cpRef.current && !cpRef.current.contains(e.target as Node)) setCpOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function addItem() { setItems(p => [...p, { id: _id++, nomi: '', birlik: 'dona', miqdori: '1', narxi: '', qqs: '12' }]) }
  function removeItem(id: number) { setItems(p => p.filter(i => i.id !== id)) }
  function updateItem(id: number, field: keyof Item, val: string) {
    setItems(p => p.map(i => i.id === id ? { ...i, [field]: val } : i))
  }

  const calcs = items.map(calcItem)
  const totalGross = calcs.reduce((s, c) => s + c.gross, 0)
  const totalQqs = calcs.reduce((s, c) => s + c.qqs, 0)
  const totalSozsiz = calcs.reduce((s, c) => s + c.sozsiz, 0)

  function fmt(n: number) { return Math.round(n).toLocaleString('uz-UZ') }

  const filteredCps = cps.filter(c => c.name.toLowerCase().includes(cpSearch.toLowerCase())).slice(0, 8)

  function selectCp(cp: Counterparty) {
    setXaridor(cp.name)
    setXaridorInn(cp.inn || '')
    setXaridorBank(cp.bank_name || '')
    setXaridorMfo(cp.mfo || '')
    setCpOpen(false)
  }

  async function downloadWord() {
    setDownloading(true)
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, WidthType } = await import('docx')
      const cellB = { style: BorderStyle.SINGLE, size: 4, color: '999999' as const }
      // Cell-level borders: top/bottom/left/right only
      const brd = { top: cellB, bottom: cellB, left: cellB, right: cellB }
      const nb = { style: BorderStyle.NIL, size: 0, color: 'auto' as const }
      // Table-level borders include insideH/insideV; cell-level: top/bottom/left/right only
      const nbrd = { top: nb, bottom: nb, left: nb, right: nb, insideH: nb, insideV: nb }
      const nbrdCell = { top: nb, bottom: nb, left: nb, right: nb }
      function hCell(text: string, span = 1) {
        return new TableCell({ borders: brd, columnSpan: span, shading: { fill: 'F0F0F0' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 18 })] })] })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function dCell(text: string, align: any = AlignmentType.RIGHT) {
        return new TableCell({ borders: brd,
          children: [new Paragraph({ alignment: align, children: [new TextRun({ text, size: 18 })] })] })
      }

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `SCHYOT-FAKTURA № ${fakRaqam || '___'}`, bold: true, size: 28 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Sana: ${sana}`, size: 22 })] }),
            new Paragraph({ children: [] }),
            // Tomonlar table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE }, borders: nbrd,
              rows: [
                new TableRow({ children: [
                  new TableCell({ borders: nbrdCell, children: [
                    new Paragraph({ children: [new TextRun({ text: 'SOTUVCHI:', bold: true, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: org?.name || '___', size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: `INN: ${org?.inn || '___'}`, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Bank: ${org?.bank_name || '___'}`, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: `H/R: ${org?.bank_account || '___'}`, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: `MFO: ${org?.mfo || '___'}`, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Rahbar: _____ / ${org?.director_name || '___'}`, size: 20 })] }),
                  ] }),
                  new TableCell({ borders: nbrdCell, children: [
                    new Paragraph({ children: [new TextRun({ text: 'XARIDOR:', bold: true, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: xaridor || '___', size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: `INN: ${xaridorInn || '___'}`, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Bank: ${xaridorBank || '___'}`, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: `MFO: ${xaridorMfo || '___'}`, size: 20 })] }),
                    new Paragraph({ children: [new TextRun({ text: `Rahbar: _________________________`, size: 20 })] }),
                  ] }),
                ] }),
              ],
            }),
            new Paragraph({ children: [] }),
            // Items table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({ children: [
                  hCell('№'), hCell("Mahsulot/xizmat nomi"), hCell("Birlik"), hCell("Miqdor"),
                  hCell("Narxi (so'm)"), hCell("Jami (so'm)"), hCell("QQS %"), hCell("QQS (so'm)"), hCell("Jami QQS bilan")
                ] }),
                ...items.map((it, i) => {
                  const c = calcItem(it)
                  return new TableRow({ children: [
                    dCell(String(i + 1)),
                    dCell(it.nomi || '___', AlignmentType.LEFT),
                    dCell(it.birlik),
                    dCell(it.miqdori),
                    dCell(fmt(parseFloat(it.narxi.replace(/[\s,]/g,''))||0)),
                    dCell(fmt(c.sozsiz)),
                    dCell(it.qqs === 'siz' ? 'QQSsiz' : `${it.qqs}%`),
                    dCell(fmt(c.qqs)),
                    dCell(fmt(c.gross)),
                  ] })
                }),
                new TableRow({ children: [
                  new TableCell({ borders: brd, columnSpan: 5, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'JAMI:', bold: true, size: 18 })] })] }),
                  dCell(fmt(totalSozsiz)),
                  dCell(''),
                  dCell(fmt(totalQqs)),
                  dCell(fmt(totalGross)),
                ] }),
              ],
            }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: `Jami QQSsiz: ${fmt(totalSozsiz)} so'm`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `QQS: ${fmt(totalQqs)} so'm`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `JAMI TO'LASH: ${fmt(totalGross)} so'm`, bold: true, size: 22 })] }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: `To'lov maqsadi: Schyot-faktura № ${fakRaqam || '___'} ga asosan to'lov`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `Bank: ${org?.bank_name || '___'}  H/R: ${org?.bank_account || '___'}  MFO: ${org?.mfo || '___'}`, size: 20 })] }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: `Sotuvchi rahbari: _________________ / ${org?.director_name || '___'}    M.O.   Sana: ${sana}`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: 'Bosh buxgalter:   _________________ / ___', size: 20 })] }),
          ],
        }],
      })
      const buf = await Packer.toBlob(doc)
      const url = URL.createObjectURL(buf)
      const a = document.createElement('a')
      a.href = url; a.download = `faktura_${fakRaqam || sana}.docx`; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  async function downloadExcel() {
    setXlsxLoading(true)
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      // Header info rows
      const headerRows = [
        [`SCHYOT-FAKTURA № ${fakRaqam || '___'}`],
        [`Sana: ${sana}`],
        [],
        ['SOTUVCHI:', org?.name || '___', '', 'XARIDOR:', xaridor || '___'],
        ['INN:', org?.inn || '___', '', 'INN:', xaridorInn || '___'],
        ['Bank:', org?.bank_name || '___', '', '', ''],
        ['H/R:', org?.bank_account || '___', '', '', ''],
        ['MFO:', org?.mfo || '___', '', '', ''],
        [],
      ]

      // Table header
      const tableHeader = ['№', 'Mahsulot/xizmat nomi', 'Birlik', 'Miqdor', 'Narxi (so\'m)', 'Jami QQSsiz', 'QQS %', 'QQS (so\'m)', 'Jami (so\'m)']

      // Table data rows
      const dataRows = items.map((it, i) => {
        const c = calcItem(it)
        return [
          i + 1,
          it.nomi || '',
          it.birlik,
          parseFloat(it.miqdori) || 0,
          parseFloat(it.narxi.replace(/[\s,]/g, '')) || 0,
          c.sozsiz,
          it.qqs === 'siz' ? 'QQSsiz' : `${it.qqs}%`,
          c.qqs,
          c.gross,
        ]
      })

      // Totals row
      const totalsRow = ['', 'JAMI', '', '', '', totalSozsiz, '', totalQqs, totalGross]

      // Footer rows
      const footerRows = [
        [],
        [`Jami QQSsiz: ${fmt(totalSozsiz)} so'm`],
        [`QQS: ${fmt(totalQqs)} so'm`],
        [`JAMI TO'LASH: ${fmt(totalGross)} so'm`],
        [],
        [`To'lov maqsadi: Schyot-faktura № ${fakRaqam || '___'} ga asosan to'lov`],
        [`Bank: ${org?.bank_name || '___'}  H/R: ${org?.bank_account || '___'}  MFO: ${org?.mfo || '___'}`],
        [],
        [`Sotuvchi rahbari: _________________ / ${org?.director_name || '___'}    M.O.   Sana: ${sana}`],
        ['Bosh buxgalter:   _________________ / ___'],
      ]

      const allRows = [
        ...headerRows,
        tableHeader,
        ...dataRows,
        totalsRow,
        ...footerRows,
      ]

      const ws = XLSX.utils.aoa_to_sheet(allRows)

      // Column widths
      ws['!cols'] = [
        { wch: 4 }, { wch: 35 }, { wch: 10 }, { wch: 8 },
        { wch: 16 }, { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 16 },
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Faktura')
      XLSX.writeFile(wb, `faktura_${fakRaqam || sana}.xlsx`)
    } finally { setXlsxLoading(false) }
  }

  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-500'
  const inpSm = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-600 placeholder-gray-500'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Faktura raqami</label>
          <input type="text" value={fakRaqam} onChange={e => setFakRaqam(e.target.value)} placeholder="2025/04-001" className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Sana</label>
          <input type="date" value={sana} onChange={e => setSana(e.target.value)} className={inp} />
        </div>
        {/* Xaridor */}
        <div className="relative" ref={cpRef}>
          <label className="block text-xs text-gray-400 mb-1">Xaridor (kontragent)</label>
          <input type="text" value={cpOpen ? cpSearch : xaridor}
            onFocus={() => { setCpOpen(true); setCpSearch(xaridor) }}
            onChange={e => { setCpSearch(e.target.value); setXaridor(e.target.value); setCpOpen(true) }}
            placeholder="Xaridor nomi" className={inp} autoComplete="off"
          />
          {cpOpen && filteredCps.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              {filteredCps.map(cp => (
                <button key={cp.id} type="button" onMouseDown={() => selectCp(cp)}
                  className="w-full text-left px-3 py-2 hover:bg-[#1F2937] transition">
                  <div className="text-sm text-white">{cp.name}</div>
                  {cp.inn && <div className="text-xs text-gray-500">INN: {cp.inn}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Xaridor INN</label>
          <input type="text" value={xaridorInn} onChange={e => setXaridorInn(e.target.value)} placeholder="123456789" className={inp} />
        </div>
      </div>

      {/* Sotuvchi info */}
      {org && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-gray-400">
          Sotuvchi: <span className="text-white font-medium">{org.name}</span>
          {org.bank_name && <> · {org.bank_name}</>}
          {org.bank_account && <> · H/R: {org.bank_account}</>}
          {org.mfo && <> · MFO: {org.mfo}</>}
        </div>
      )}

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400 font-medium">Mahsulot/xizmatlar</label>
          <button onClick={addItem} className="text-xs text-blue-400 hover:text-blue-300 transition">+ Qo&apos;shish</button>
        </div>
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[2fr_80px_80px_120px_80px] gap-2 text-xs text-gray-500 px-1">
            <span>Nomi</span><span>Birlik</span><span>Miqdor</span><span>Narxi</span><span>QQS</span>
          </div>
          {items.map((it, idx) => {
            const c = calcItem(it)
            return (
              <div key={it.id} className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-2">
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_80px_80px_120px_80px_24px] gap-2 items-center">
                  <input type="text" value={it.nomi} onChange={e => updateItem(it.id, 'nomi', e.target.value)}
                    placeholder={`${idx + 1}. Mahsulot nomi`} className={inpSm} />
                  <select value={it.birlik} onChange={e => updateItem(it.id, 'birlik', e.target.value)} className={inpSm}>
                    <option>dona</option><option>kg</option><option>m</option><option>m²</option>
                    <option>m³</option><option>litr</option><option>soat</option><option>xizmat</option><option>to&apos;plam</option>
                  </select>
                  <input type="number" min={0} value={it.miqdori} onChange={e => updateItem(it.id, 'miqdori', e.target.value)}
                    placeholder="1" className={inpSm} />
                  <input type="text" value={it.narxi} onChange={e => updateItem(it.id, 'narxi', e.target.value)}
                    placeholder="0" className={inpSm} />
                  <select value={it.qqs} onChange={e => updateItem(it.id, 'qqs', e.target.value as QqsFoiz)} className={inpSm}>
                    <option value="12">12%</option>
                    <option value="15">15%</option>
                    <option value="0">0%</option>
                    <option value="siz">QQSsiz</option>
                  </select>
                  <button onClick={() => items.length > 1 && removeItem(it.id)}
                    className="text-gray-600 hover:text-red-400 transition text-sm leading-none">✕</button>
                </div>
                {c.gross > 0 && (
                  <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-3">
                    <span>Jami: <span className="text-white">{fmt(c.gross)}</span></span>
                    {c.qqs > 0 && <span>QQSsiz: <span className="text-gray-300">{fmt(c.sozsiz)}</span> + QQS: <span className="text-amber-400">{fmt(c.qqs)}</span></span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Totals */}
      {totalGross > 0 && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Jami QQSsiz:</span>
            <span className="text-white font-medium">{fmt(totalSozsiz)} so&apos;m</span>
          </div>
          {totalQqs > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">QQS:</span>
              <span className="text-amber-400">{fmt(totalQqs)} so&apos;m</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t border-[#1E293B] pt-2 mt-2">
            <span className="text-gray-300">JAMI TO&apos;LASH:</span>
            <span className="text-emerald-400">{fmt(totalGross)} so&apos;m</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={downloadWord} disabled={downloading || totalGross === 0}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-[#1E293B] disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
          {downloading ? '⏳ Yuklanmoqda...' : '📄 Word (.docx)'}
        </button>
        <button onClick={downloadExcel} disabled={xlsxLoading || totalGross === 0}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-[#1E293B] disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
          {xlsxLoading ? '⏳ Yuklanmoqda...' : '📊 Excel (.xlsx)'}
        </button>
      </div>
    </div>
  )
}
