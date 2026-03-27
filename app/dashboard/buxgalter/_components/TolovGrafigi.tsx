'use client'

import { useState, useRef, useEffect } from 'react'
import type { Org, Counterparty } from '@/lib/types'

type Props = { org: Org | null; cps: Counterparty[] }
type TolovTuri = 'foizsiz' | 'teng' | 'kamayuvchi'
type Row = { num: number; sana: string; asosiy: number; foiz: number; jami: number; qoldiq: number }

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}
function fmt(n: number): string { return Math.round(n).toLocaleString('uz-UZ') }

function calcRows(P: number, n: number, r: number, bosh: string, tur: TolovTuri): Row[] {
  if (!P || !n || !bosh) return []
  const res: Row[] = []
  if (tur === 'foizsiz' || r === 0) {
    const bir = Math.floor(P / n)
    let q = P
    for (let i = 0; i < n; i++) {
      const a = i === n - 1 ? q : bir; q -= a
      res.push({ num: i + 1, sana: addMonths(bosh, i), asosiy: a, foiz: 0, jami: a, qoldiq: Math.max(0, q) })
    }
  } else if (tur === 'teng') {
    const A = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    let bal = P
    for (let i = 0; i < n; i++) {
      const foiz = bal * r; const asosiy = A - foiz; bal -= asosiy
      res.push({ num: i + 1, sana: addMonths(bosh, i), asosiy: Math.round(asosiy), foiz: Math.round(foiz), jami: Math.round(A), qoldiq: Math.max(0, Math.round(bal)) })
    }
  } else {
    const bir = Math.floor(P / n); let bal = P
    for (let i = 0; i < n; i++) {
      const foiz = Math.round(bal * r); const a = i === n - 1 ? bal : bir; bal -= a
      res.push({ num: i + 1, sana: addMonths(bosh, i), asosiy: a, foiz, jami: a + foiz, qoldiq: Math.max(0, Math.round(bal)) })
    }
  }
  return res
}

export default function TolovGrafigi({ org, cps }: Props) {
  const [kontragent, setKontragent] = useState('')
  const [shartnoma, setShartnoma] = useState('')
  const [jamiSumma, setJamiSumma] = useState('')
  const [tolovSoni, setTolovSoni] = useState('12')
  const [boshSana, setBoshSana] = useState('')
  const [tolovTuri, setTolovTuri] = useState<TolovTuri>('foizsiz')
  const [yillikFoiz, setYillikFoiz] = useState('0')
  const [rows, setRows] = useState<Row[]>([])
  const [cpSearch, setCpSearch] = useState('')
  const [cpOpen, setCpOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const cpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (cpRef.current && !cpRef.current.contains(e.target as Node)) setCpOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function handleCalc() {
    const P = parseFloat(jamiSumma.replace(/[\s,]/g, '')) || 0
    const n = Math.min(parseInt(tolovSoni) || 1, 120)
    const r = tolovTuri !== 'foizsiz' ? (parseFloat(yillikFoiz) || 0) / 100 / 12 : 0
    setRows(calcRows(P, n, r, boshSana, tolovTuri))
  }

  async function downloadWord() {
    if (!rows.length) return
    setDownloading(true)
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, WidthType } = await import('docx')
      const P = parseFloat(jamiSumma.replace(/[\s,]/g, '')) || 0
      const hasInterest = tolovTuri !== 'foizsiz' && parseFloat(yillikFoiz) > 0
      const nb = { style: BorderStyle.NIL, size: 0, color: 'auto' as const }
      const tableNoBorders = { top: nb, bottom: nb, left: nb, right: nb, insideH: nb, insideV: nb }
      const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: '999999' as const }
      // Cell borders only support top/bottom/left/right (no insideH/insideV)
      const rowBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder }

      function hCell(text: string) {
        return new TableCell({
          borders: rowBorders,
          shading: { fill: 'F0F0F0' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 18 })] })],
        })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function dCell(text: string, align: any = AlignmentType.CENTER) {
        return new TableCell({
          borders: rowBorders,
          children: [new Paragraph({ alignment: align, children: [new TextRun({ text, size: 18 })] })],
        })
      }

      const headers = hasInterest
        ? ['№', 'Sana', "Asosiy qarz (so'm)", "Foiz (so'm)", "Jami to'lov (so'm)", "Qoldiq (so'm)"]
        : ['№', 'Sana', "To'lov summasi (so'm)", "Qoldiq (so'm)"]

      const tableRows = [
        new TableRow({ children: headers.map(h => hCell(h)) }),
        ...rows.map(r => new TableRow({
          children: hasInterest
            ? [dCell(String(r.num)), dCell(r.sana), dCell(fmt(r.asosiy), AlignmentType.RIGHT), dCell(fmt(r.foiz), AlignmentType.RIGHT), dCell(fmt(r.jami), AlignmentType.RIGHT), dCell(fmt(r.qoldiq), AlignmentType.RIGHT)]
            : [dCell(String(r.num)), dCell(r.sana), dCell(fmt(r.jami), AlignmentType.RIGHT), dCell(fmt(r.qoldiq), AlignmentType.RIGHT)]
        })),
        new TableRow({
          children: hasInterest
            ? [
                new TableCell({ borders: rowBorders, columnSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'JAMI', bold: true, size: 18 })] })] }),
                dCell(fmt(rows.reduce((s, r) => s + r.asosiy, 0)), AlignmentType.RIGHT),
                dCell(fmt(rows.reduce((s, r) => s + r.foiz, 0)), AlignmentType.RIGHT),
                dCell(fmt(rows.reduce((s, r) => s + r.jami, 0)), AlignmentType.RIGHT),
                dCell('0'),
              ]
            : [
                new TableCell({ borders: rowBorders, columnSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'JAMI', bold: true, size: 18 })] })] }),
                dCell(fmt(P), AlignmentType.RIGHT),
                dCell('0'),
              ]
        }),
      ]

      const turText = tolovTuri === 'foizsiz' ? "Foizsiz teng to'lovlar" : tolovTuri === 'teng' ? `Annuitet (${yillikFoiz}% yillik)` : `Kamayuvchi asosiy qarz (${yillikFoiz}% yillik)`

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TO'LOV GRAFIGI", bold: true, size: 28 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: shartnoma ? `${shartnoma} raqamli shartnomaga ilova` : '', size: 20 })] }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: `Tashkilot: ${org?.name || '___'}  (INN: ${org?.inn || '___'})`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `Kontragent: ${kontragent || '___'}`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `Jami summa: ${fmt(P)} so'm`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `To'lov turi: ${turText}`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `Birinchi to'lov: ${boshSana}`, size: 20 })] }),
            new Paragraph({ children: [] }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: "Shartlar:", bold: true, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: "– To'lov usuli: bank o'tkazmasi", size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: "– Kechiktirilgan to'lov uchun kuniga 0.1% jarima belgilanadi", size: 20 })] }),
            new Paragraph({ children: [] }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: tableNoBorders,
              rows: [
                new TableRow({ children: [
                  new TableCell({ borders: { top: nb, bottom: nb, left: nb, right: nb }, children: [new Paragraph({ children: [new TextRun({ text: `${org?.name || '___'} rahbari:`, size: 20 })] }), new Paragraph({ children: [new TextRun({ text: "_________________________ / " + (org?.director_name || '___'), size: 20 })] }), new Paragraph({ children: [new TextRun({ text: "M.O.   Sana: _______________", size: 20 })] })] }),
                  new TableCell({ borders: { top: nb, bottom: nb, left: nb, right: nb }, children: [new Paragraph({ children: [new TextRun({ text: `${kontragent || '___'} rahbari:`, size: 20 })] }), new Paragraph({ children: [new TextRun({ text: "_________________________", size: 20 })] }), new Paragraph({ children: [new TextRun({ text: "M.O.   Sana: _______________", size: 20 })] })] }),
                ] }),
              ],
            }),
          ],
        }],
      })

      const buf = await Packer.toBlob(doc)
      const url = URL.createObjectURL(buf)
      const a = document.createElement('a')
      a.href = url; a.download = `tolov_grafigi_${shartnoma || Date.now()}.docx`; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  const filtered = cps.filter(c => c.name.toLowerCase().includes(cpSearch.toLowerCase())).slice(0, 8)
  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'
  const totalJami = rows.reduce((s, r) => s + r.jami, 0)
  const totalFoiz = rows.reduce((s, r) => s + r.foiz, 0)
  const hasInterest = tolovTuri !== 'foizsiz' && parseFloat(yillikFoiz) > 0

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Kontragent */}
        <div className="relative" ref={cpRef}>
          <label className="block text-xs text-gray-400 mb-1">Kontragent</label>
          <input
            type="text" value={cpOpen ? cpSearch : kontragent}
            onFocus={() => { setCpOpen(true); setCpSearch(kontragent) }}
            onChange={e => { setCpSearch(e.target.value); setCpOpen(true) }}
            placeholder="Kontragent nomi" className={inp} autoComplete="off"
          />
          {cpOpen && filtered.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              {filtered.map(cp => (
                <button key={cp.id} type="button" onMouseDown={() => { setKontragent(cp.name); setCpOpen(false) }}
                  className="w-full text-left px-3 py-2 hover:bg-[#1F2937] transition">
                  <div className="text-sm text-white">{cp.name}</div>
                  {cp.inn && <div className="text-xs text-gray-500">INN: {cp.inn}</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Shartnoma raqami</label>
          <input type="text" value={shartnoma} onChange={e => setShartnoma(e.target.value)} placeholder="2025/04-01" className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Jami summa (so&apos;m)</label>
          <input type="text" value={jamiSumma} onChange={e => setJamiSumma(e.target.value)} placeholder="120 000 000" className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">To&apos;lovlar soni</label>
          <input type="number" min={1} max={120} value={tolovSoni} onChange={e => setTolovSoni(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Birinchi to&apos;lov sanasi</label>
          <input type="date" value={boshSana} onChange={e => setBoshSana(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">To&apos;lov turi</label>
          <select value={tolovTuri} onChange={e => setTolovTuri(e.target.value as TolovTuri)} className={inp}>
            <option value="foizsiz">Foizsiz teng to&apos;lovlar</option>
            <option value="teng">Annuitet (teng oylik to&apos;lov)</option>
            <option value="kamayuvchi">Kamayuvchi asosiy qarz</option>
          </select>
        </div>
        {tolovTuri !== 'foizsiz' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Yillik foiz stavkasi (%)</label>
            <input type="number" min={0} max={100} step={0.1} value={yillikFoiz} onChange={e => setYillikFoiz(e.target.value)} placeholder="18" className={inp} />
          </div>
        )}
      </div>

      <button onClick={handleCalc}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
        📊 Grafikni hisoblash
      </button>

      {rows.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-center">
              <div className="text-base font-bold text-white">{fmt(parseFloat(jamiSumma.replace(/[\s,]/g, '')) || 0)}</div>
              <div className="text-xs text-gray-500 mt-0.5">Asosiy qarz</div>
            </div>
            {hasInterest && (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-center">
                <div className="text-base font-bold text-amber-400">{fmt(totalFoiz)}</div>
                <div className="text-xs text-gray-500 mt-0.5">Jami foiz</div>
              </div>
            )}
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-center">
              <div className="text-base font-bold text-emerald-400">{fmt(totalJami)}</div>
              <div className="text-xs text-gray-500 mt-0.5">Jami to&apos;lov</div>
            </div>
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-center">
              <div className="text-base font-bold text-blue-400">{rows.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">To&apos;lovlar soni</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-[#1E293B]">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#1E293B] text-gray-400">
                  <th className="px-3 py-2 text-center">№</th>
                  <th className="px-3 py-2 text-left">Sana</th>
                  <th className="px-3 py-2 text-right">Asosiy qarz</th>
                  {hasInterest && <th className="px-3 py-2 text-right">Foiz</th>}
                  <th className="px-3 py-2 text-right">Jami to&apos;lov</th>
                  <th className="px-3 py-2 text-right">Qoldiq</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.num} className={i % 2 === 0 ? 'bg-[#0F172A]' : 'bg-[#111827]'}>
                    <td className="px-3 py-2 text-center text-gray-400">{r.num}</td>
                    <td className="px-3 py-2 text-gray-300">{r.sana}</td>
                    <td className="px-3 py-2 text-right text-white">{fmt(r.asosiy)}</td>
                    {hasInterest && <td className="px-3 py-2 text-right text-amber-400">{fmt(r.foiz)}</td>}
                    <td className="px-3 py-2 text-right text-emerald-400 font-semibold">{fmt(r.jami)}</td>
                    <td className="px-3 py-2 text-right text-gray-400">{fmt(r.qoldiq)}</td>
                  </tr>
                ))}
                <tr className="bg-[#1E293B] font-semibold">
                  <td className="px-3 py-2 text-center text-gray-400" colSpan={2}>JAMI</td>
                  <td className="px-3 py-2 text-right text-white">{fmt(rows.reduce((s, r) => s + r.asosiy, 0))}</td>
                  {hasInterest && <td className="px-3 py-2 text-right text-amber-400">{fmt(totalFoiz)}</td>}
                  <td className="px-3 py-2 text-right text-emerald-400">{fmt(totalJami)}</td>
                  <td className="px-3 py-2 text-right text-gray-500">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <button onClick={downloadWord} disabled={downloading}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-[#1E293B] disabled:text-gray-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
            {downloading ? '⏳ Yuklanmoqda...' : '📄 Word (.docx) yuklab olish'}
          </button>
        </div>
      )}
    </div>
  )
}
