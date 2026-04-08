'use client'

import { useState, useRef, useEffect } from 'react'
import type { Org, Counterparty, Contract } from '@/lib/types'
import { buildFakturaXlsx } from '@/lib/export/excelTemplates'

type Props = { org: Org | null; cps: Counterparty[]; contracts?: Contract[] }
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

export default function FakturaBuilder({ org, cps, contracts = [] }: Props) {
  const [fakRaqam, setFakRaqam] = useState('')
  const [sana, setSana] = useState(new Date().toISOString().split('T')[0])
  const [shartnoma, setShartnoma] = useState('')
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
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, WidthType, Footer, PageNumber } = await import('docx')
      const F   = 'Times New Roman'
      const NB  = { style: BorderStyle.NIL,    size: 0, color: 'auto'   } as const
      const BD  = { style: BorderStyle.SINGLE, size: 4, color: '999999' } as const
      const BDH = { style: BorderStyle.SINGLE, size: 6, color: '444444' } as const
      const noBord  = { top: NB,  bottom: NB,  left: NB,  right: NB,  insideH: NB,  insideV: NB }
      const noBordC = { top: NB,  bottom: NB,  left: NB,  right: NB }
      const allBord = { top: BD,  bottom: BD,  left: BD,  right: BD }

      const p = (txt: string, opts: {bold?:boolean; size?:number; align?: typeof AlignmentType[keyof typeof AlignmentType]; before?:number; after?:number} = {}) =>
        new Paragraph({
          alignment: opts.align ?? AlignmentType.LEFT,
          spacing: { before: opts.before ?? 0, after: opts.after ?? 60, line: 276 },
          children: [new TextRun({ text: txt, bold: opts.bold, size: opts.size ?? 22, font: F, color: '000000' })],
        })

      function hCell(text: string, span = 1) {
        return new TableCell({
          borders: allBord, columnSpan: span,
          shading: { fill: '1F3864' },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({ text, bold: true, size: 18, font: F, color: 'FFFFFF' })],
          })],
        })
      }
      function dCell(text: string, align = AlignmentType.RIGHT, bold = false) {
        return new TableCell({
          borders: allBord,
          children: [new Paragraph({
            alignment: align,
            spacing: { after: 40 },
            children: [new TextRun({ text, bold, size: 20, font: F, color: '000000' })],
          })],
        })
      }
      function rekvCell(children: InstanceType<typeof Paragraph>[]) {
        return new TableCell({ borders: noBordC, children })
      }

      const doc = new Document({
        styles: { default: { document: { run: { font: F, size: 22 }, paragraph: { spacing: { line: 276, after: 60 } } } } },
        sections: [{
          properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 851 } } },
          footers: {
            default: new Footer({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Kabinetim.uz  |  ', size: 18, font: F, color: 'AAAAAA' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, font: F, color: 'AAAAAA' }),
                  new TextRun({ text: ' / ', size: 18, font: F, color: 'AAAAAA' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: F, color: 'AAAAAA' }),
                ],
              })],
            }),
          },
          children: [
            // Sarlavha
            p(`SCHYOT-FAKTURA № ${fakRaqam || '___'}`, { bold: true, size: 28, align: AlignmentType.CENTER, after: 40 }),
            p(`Sana: ${sana}`, { size: 22, align: AlignmentType.CENTER, after: shartnoma ? 40 : 120 }),
            ...(shartnoma ? [p(`Shartnoma: ${shartnoma}`, { size: 20, align: AlignmentType.CENTER, after: 120 })] : []),

            // Tomonlar
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBord,
              rows: [new TableRow({ children: [
                rekvCell([
                  p('SOTUVCHI:', { bold: true, size: 20, after: 30 }),
                  p(org?.name || '___', { size: 20, after: 20 }),
                  p(`INN: ${org?.inn || '___'}`, { size: 18, after: 20 }),
                  p(`Bank: ${org?.bank_name || '___'}`, { size: 18, after: 20 }),
                  p(`H/R: ${org?.bank_account || '___'}`, { size: 18, after: 20 }),
                  p(`MFO: ${org?.mfo || '___'}`, { size: 18, after: 20 }),
                  p(`Rahbar: _____ / ${org?.director_name || '___'}`, { size: 18, after: 0 }),
                ]),
                rekvCell([
                  p('XARIDOR:', { bold: true, size: 20, after: 30 }),
                  p(xaridor || '___', { size: 20, after: 20 }),
                  p(`INN: ${xaridorInn || '___'}`, { size: 18, after: 20 }),
                  p(`Bank: ${xaridorBank || '___'}`, { size: 18, after: 20 }),
                  p(`MFO: ${xaridorMfo || '___'}`, { size: 18, after: 20 }),
                  p('Rahbar: _________________________', { size: 18, after: 0 }),
                ]),
              ] })],
            }),

            // Gorizontal ajratuvchi
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBord,
              rows: [new TableRow({ children: [new TableCell({
                borders: { top: NB, left: NB, right: NB, bottom: BDH },
                children: [new Paragraph({ text: '', spacing: { before: 80, after: 80 } })],
              })] })],
            }),

            // Mahsulotlar jadvali
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({ children: [
                  hCell('№'), hCell("Nomi"), hCell("Birlik"), hCell("Miqdor"),
                  hCell("Narxi"), hCell("Jami"), hCell("QQS%"), hCell("QQS"), hCell("Jami QQS bilan"),
                ] }),
                ...items.map((it, i) => {
                  const c = calcItem(it)
                  return new TableRow({ children: [
                    dCell(String(i + 1), AlignmentType.CENTER),
                    dCell(it.nomi || '___', AlignmentType.LEFT),
                    dCell(it.birlik, AlignmentType.CENTER),
                    dCell(it.miqdori, AlignmentType.CENTER),
                    dCell(fmt(parseFloat(it.narxi.replace(/[\s,]/g,''))||0)),
                    dCell(fmt(c.sozsiz)),
                    dCell(it.qqs === 'siz' ? 'QQSsiz' : `${it.qqs}%`, AlignmentType.CENTER),
                    dCell(fmt(c.qqs)),
                    dCell(fmt(c.gross)),
                  ] })
                }),
                new TableRow({ children: [
                  new TableCell({ borders: allBord, columnSpan: 5, shading: { fill: 'F5F5F5' },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 40 },
                      children: [new TextRun({ text: 'JAMI:', bold: true, size: 20, font: F })] })] }),
                  dCell(fmt(totalSozsiz), AlignmentType.RIGHT, true),
                  dCell('', AlignmentType.CENTER),
                  dCell(fmt(totalQqs), AlignmentType.RIGHT, true),
                  dCell(fmt(totalGross), AlignmentType.RIGHT, true),
                ] }),
              ],
            }),

            // Yig'indi
            p('', { after: 80 }),
            p(`Jami QQSsiz: ${fmt(totalSozsiz)} so'm`, { size: 20 }),
            p(`QQS summasi: ${fmt(totalQqs)} so'm`, { size: 20 }),
            p(`JAMI TO'LASH: ${fmt(totalGross)} so'm`, { bold: true, size: 24, after: 120 }),
            p(`To'lov maqsadi: Schyot-faktura № ${fakRaqam || '___'} ga asosan`, { size: 20 }),
            p(`Bank: ${org?.bank_name || '___'}   H/R: ${org?.bank_account || '___'}   MFO: ${org?.mfo || '___'}`, { size: 18, after: 160 }),

            // Imzo
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE }, borders: noBord,
              rows: [new TableRow({ children: [
                rekvCell([
                  p('Sotuvchi rahbari:', { size: 20, after: 20 }),
                  p(`_________________ / ${org?.director_name || '___'}`, { size: 20, after: 20 }),
                  p('M.O.', { size: 20, after: 0 }),
                ]),
                rekvCell([
                  p('Bosh buxgalter:', { size: 20, after: 20 }),
                  p('_________________ / ___', { size: 20, after: 0 }),
                ]),
                rekvCell([
                  p(`Sana: ${sana}`, { size: 20, after: 0 }),
                ]),
              ] })],
            }),
          ],
        }],
      })

      const buf = await Packer.toBlob(doc)
      const url = URL.createObjectURL(buf)
      const a   = document.createElement('a')
      a.href = url; a.download = `faktura_${fakRaqam || sana}.docx`; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  async function downloadExcel() {
    setXlsxLoading(true)
    try {
      await buildFakturaXlsx({
        fakRaqam, sana, shartnoma: shartnoma || undefined, org,
        xaridor, xaridorInn,
        items: items.map(it => {
          const c = calcItem(it)
          return {
            nomi: it.nomi || '',
            birlik: it.birlik,
            miqdori: parseFloat(it.miqdori) || 0,
            narxi: parseFloat(it.narxi.replace(/[\s,]/g, '')) || 0,
            sozsiz: c.sozsiz, qqs: c.qqs, gross: c.gross,
            qqsFoiz: it.qqs === 'siz' ? 'QQSsiz' : `${it.qqs}%`,
          }
        }),
        totalSozsiz, totalQqs, totalGross,
      })
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
        {/* Shartnoma */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Shartnoma (ixtiyoriy)</label>
          <select value={shartnoma} onChange={e => setShartnoma(e.target.value)} className={inp}>
            <option value="">— Shartnoma tanlanmagan —</option>
            {contracts.map(c => (
              <option key={c.id} value={`${c.contract_number} (${c.contract_date})`}>
                № {c.contract_number} · {c.contract_date} · {c.counterparties?.name || ''}
              </option>
            ))}
          </select>
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
          <div className="hidden sm:grid grid-cols-[2fr_60px_55px_95px_55px_85px_72px_78px_24px] gap-2 text-xs text-gray-500 px-1">
            <span>Nomi</span><span>Birlik</span><span>Miqdor</span><span>Narxi (so&apos;m)</span><span>QQS</span>
            <span className="text-right">Sozsiz</span><span className="text-right">QQS summa</span><span className="text-right">Jami</span><span/>
          </div>
          {items.map((it, idx) => {
            const c = calcItem(it)
            return (
              <div key={it.id} className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-2">
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_60px_55px_95px_55px_85px_72px_78px_24px] gap-2 items-center">
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
                  {/* Sozsiz summa */}
                  <div className="text-right text-xs">
                    {c.sozsiz > 0 ? <span className="text-gray-300">{fmt(c.sozsiz)}</span> : <span className="text-gray-600">—</span>}
                  </div>
                  {/* QQS summasi */}
                  <div className="text-right text-xs">
                    {c.qqs > 0 ? <span className="text-amber-400">{fmt(c.qqs)}</span> : <span className="text-gray-600">—</span>}
                  </div>
                  {/* Jami (gross) */}
                  <div className="text-right text-xs font-semibold">
                    {c.gross > 0 ? <span className="text-emerald-400">{fmt(c.gross)}</span> : <span className="text-gray-600">—</span>}
                  </div>
                  <button onClick={() => items.length > 1 && removeItem(it.id)}
                    className="text-gray-600 hover:text-red-400 transition text-sm leading-none">✕</button>
                </div>
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
