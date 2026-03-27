'use client'

import { useState, useRef, useEffect } from 'react'
import type { Org, Counterparty } from '@/lib/types'

type Props = { org: Org | null; cps: Counterparty[] }
type TolovTuri = 'foizsiz' | 'teng' | 'kamayuvchi'
type Row = { num: number; sana: string; asosiy: number; foiz: number; jami: number; qoldiq: number; izoh?: string }

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}
function fmt(n: number): string { return Math.round(n).toLocaleString('uz-UZ') }

interface CalcOptions {
  P: number; n: number; r: number; bosh: string; tur: TolovTuri
  grace: number   // imtiyoz davri (oylar soni)
  rGrace: number  // oylik foiz imtiyoz davrida
}

function calcRows({ P, n, r, bosh, tur, grace, rGrace }: CalcOptions): Row[] {
  if (!P || !n || !bosh) return []
  const res: Row[] = []

  // ── Imtiyoz davri (grace period) ─────────────────────────
  // Faqat foizli to'lov turlari uchun (teng/kamayuvchi)
  const effectiveGrace = tur !== 'foizsiz' ? grace : 0
  for (let i = 0; i < effectiveGrace; i++) {
    const foiz = Math.round(P * rGrace)
    res.push({
      num: i + 1,
      sana: addMonths(bosh, i),
      asosiy: 0,
      foiz,
      jami: foiz,
      qoldiq: P,
      izoh: 'Imtiyoz davri',
    })
  }

  // ── Asosiy to'lov davri ───────────────────────────────────
  const startMonth = effectiveGrace
  if (tur === 'foizsiz' || r === 0) {
    const bir = Math.floor(P / n); let q = P
    for (let i = 0; i < n; i++) {
      const a = i === n - 1 ? q : bir; q -= a
      res.push({ num: startMonth + i + 1, sana: addMonths(bosh, startMonth + i), asosiy: a, foiz: 0, jami: a, qoldiq: Math.max(0, q) })
    }
  } else if (tur === 'teng') {
    // Annuitet
    const A = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    let bal = P
    for (let i = 0; i < n; i++) {
      const foiz = bal * r; const asosiy = A - foiz; bal -= asosiy
      res.push({ num: startMonth + i + 1, sana: addMonths(bosh, startMonth + i), asosiy: Math.round(asosiy), foiz: Math.round(foiz), jami: Math.round(A), qoldiq: Math.max(0, Math.round(bal)) })
    }
  } else {
    // Differensial (kamayuvchi asosiy qarz)
    const bir = Math.floor(P / n); let bal = P
    for (let i = 0; i < n; i++) {
      const foiz = Math.round(bal * r); const a = i === n - 1 ? bal : bir; bal -= a
      res.push({ num: startMonth + i + 1, sana: addMonths(bosh, startMonth + i), asosiy: a, foiz, jami: a + foiz, qoldiq: Math.max(0, Math.round(bal)) })
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
  const [imtiyozDavri, setImtiyozDavri] = useState('0')
  const [imtiyozFoiz, setImtiyozFoiz] = useState('')  // bo'sh = asosiy foiz bilan bir xil
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
    const grace = Math.max(0, Math.min(parseInt(imtiyozDavri) || 0, 60))
    // Imtiyoz davrida foiz: ko'rsatilmagan bo'lsa asosiy foiz bilan bir xil
    const rGrace = tolovTuri !== 'foizsiz'
      ? (imtiyozFoiz.trim() !== '' ? (parseFloat(imtiyozFoiz) || 0) : (parseFloat(yillikFoiz) || 0)) / 100 / 12
      : 0
    setRows(calcRows({ P, n, r, bosh: boshSana, tur: tolovTuri, grace, rGrace }))
  }

  async function downloadWord() {
    if (!rows.length) return
    setDownloading(true)
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, WidthType } = await import('docx')
      const P = parseFloat(jamiSumma.replace(/[\s,]/g, '')) || 0
      const grace = parseInt(imtiyozDavri) || 0
      const hasInterest = tolovTuri !== 'foizsiz' && parseFloat(yillikFoiz) > 0
      const nb = { style: BorderStyle.NIL, size: 0, color: 'auto' as const }
      const tableNoBorders = { top: nb, bottom: nb, left: nb, right: nb, insideH: nb, insideV: nb }
      const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: '999999' as const }
      const rowBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder }

      function hCell(text: string) {
        return new TableCell({ borders: rowBorders, shading: { fill: 'F0F0F0' },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 18 })] })] })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function dCell(text: string, align: any = AlignmentType.CENTER, shade?: string) {
        return new TableCell({
          borders: rowBorders,
          ...(shade ? { shading: { fill: shade } } : {}),
          children: [new Paragraph({ alignment: align, children: [new TextRun({ text, size: 18 })] })],
        })
      }

      const hasGrace = grace > 0 && hasInterest
      const headers = hasInterest
        ? ['№', 'Sana', "Asosiy qarz (so'm)", "Foiz (so'm)", "Jami to'lov (so'm)", "Qoldiq (so'm)", ...(hasGrace ? ['Izoh'] : [])]
        : ['№', 'Sana', "To'lov summasi (so'm)", "Qoldiq (so'm)"]

      const tableRows = [
        new TableRow({ children: headers.map(h => hCell(h)) }),
        ...rows.map(row => {
          const isGrace = !!row.izoh
          const shade = isGrace ? 'FFF8E1' : undefined
          return new TableRow({ children: hasInterest
            ? [
                dCell(String(row.num), AlignmentType.CENTER, shade),
                dCell(row.sana, AlignmentType.CENTER, shade),
                dCell(fmt(row.asosiy), AlignmentType.RIGHT, shade),
                dCell(fmt(row.foiz), AlignmentType.RIGHT, shade),
                dCell(fmt(row.jami), AlignmentType.RIGHT, shade),
                dCell(fmt(row.qoldiq), AlignmentType.RIGHT, shade),
                ...(hasGrace ? [dCell(row.izoh || '', AlignmentType.CENTER, shade)] : []),
              ]
            : [
                dCell(String(row.num)),
                dCell(row.sana),
                dCell(fmt(row.jami), AlignmentType.RIGHT),
                dCell(fmt(row.qoldiq), AlignmentType.RIGHT),
              ]
          })
        }),
        new TableRow({ children: hasInterest
          ? [
              new TableCell({ borders: rowBorders, columnSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'JAMI', bold: true, size: 18 })] })] }),
              dCell(fmt(rows.reduce((s, r) => s + r.asosiy, 0)), AlignmentType.RIGHT),
              dCell(fmt(rows.reduce((s, r) => s + r.foiz, 0)), AlignmentType.RIGHT),
              dCell(fmt(rows.reduce((s, r) => s + r.jami, 0)), AlignmentType.RIGHT),
              dCell('0'),
              ...(hasGrace ? [dCell('')] : []),
            ]
          : [
              new TableCell({ borders: rowBorders, columnSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'JAMI', bold: true, size: 18 })] })] }),
              dCell(fmt(P), AlignmentType.RIGHT),
              dCell('0'),
            ]
        }),
      ]

      const turLabels: Record<TolovTuri, string> = {
        foizsiz: "Foizsiz teng to'lovlar",
        teng: `Annuitet — teng oylik to'lov (${yillikFoiz}% yillik)`,
        kamayuvchi: `Differensial — kamayuvchi asosiy qarz (${yillikFoiz}% yillik)`,
      }

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TO'LOV GRAFIGI", bold: true, size: 28 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: shartnoma ? `${shartnoma} raqamli shartnomaga ilova` : '', size: 20 })] }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: `Tashkilot: ${org?.name || '___'}  (INN: ${org?.inn || '___'})`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `Kontragent: ${kontragent || '___'}`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `Jami summa: ${fmt(P)} so'm`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `To'lov turi: ${turLabels[tolovTuri]}`, size: 20 })] }),
            ...(hasGrace ? [
              new Paragraph({ children: [new TextRun({ text: `Imtiyoz davri: ${grace} oy (faqat foiz to'lanadi)`, size: 20 })] }),
              ...(imtiyozFoiz.trim() ? [new Paragraph({ children: [new TextRun({ text: `Imtiyoz davri foizi: ${imtiyozFoiz}% yillik`, size: 20 })] })] : []),
            ] : []),
            new Paragraph({ children: [new TextRun({ text: `Birinchi to'lov: ${boshSana}`, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: `Jami to'lovlar soni: ${rows.length} oy`, size: 20 })] }),
            new Paragraph({ children: [] }),
            new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows }),
            new Paragraph({ children: [] }),
            new Paragraph({ children: [new TextRun({ text: "Shartlar:", bold: true, size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: "– To'lov usuli: bank o'tkazmasi", size: 20 })] }),
            new Paragraph({ children: [new TextRun({ text: "– Kechiktirilgan to'lov uchun kuniga 0.1% jarima belgilanadi", size: 20 })] }),
            ...(hasGrace ? [new Paragraph({ children: [new TextRun({ text: `– Imtiyoz davri (${grace} oy): faqat foiz to'lanadi, asosiy qarz to'lanmaydi`, size: 20 })] })] : []),
            new Paragraph({ children: [] }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableNoBorders,
              rows: [new TableRow({ children: [
                new TableCell({ borders: { top: nb, bottom: nb, left: nb, right: nb }, children: [
                  new Paragraph({ children: [new TextRun({ text: `${org?.name || '___'} rahbari:`, size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "_________________________ / " + (org?.director_name || '___'), size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "M.O.   Sana: _______________", size: 20 })] }),
                ] }),
                new TableCell({ borders: { top: nb, bottom: nb, left: nb, right: nb }, children: [
                  new Paragraph({ children: [new TextRun({ text: `${kontragent || '___'} rahbari:`, size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "_________________________", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "M.O.   Sana: _______________", size: 20 })] }),
                ] }),
              ] })],
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
  const graceCount = rows.filter(r => r.izoh).length
  const regularCount = rows.length - graceCount

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Kontragent */}
        <div className="relative" ref={cpRef}>
          <label className="block text-xs text-gray-400 mb-1">Kontragent</label>
          <input type="text" value={cpOpen ? cpSearch : kontragent}
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
          <label className="block text-xs text-gray-400 mb-1">To&apos;lovlar soni (asosiy davr)</label>
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
            <option value="kamayuvchi">Differensial (kamayuvchi asosiy qarz)</option>
          </select>
        </div>

        {/* Foizli to'lov uchun qo'shimcha maydonlar */}
        {tolovTuri !== 'foizsiz' && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Yillik foiz stavkasi (%)</label>
              <input type="number" min={0} max={100} step={0.1} value={yillikFoiz} onChange={e => setYillikFoiz(e.target.value)} placeholder="18" className={inp} />
            </div>

            {/* Imtiyoz davri bloki */}
            <div className="sm:col-span-2">
              <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm font-semibold">⏳ Imtiyoz davri (Grace period)</span>
                  <span className="text-xs text-gray-500">— asosiy qarz to&apos;lanmaydi, faqat foiz</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Imtiyoz davri (oylar soni)</label>
                    <input type="number" min={0} max={60} value={imtiyozDavri} onChange={e => setImtiyozDavri(e.target.value)}
                      placeholder="0 (bo'lmasa 0)" className={inp} />
                    {parseInt(imtiyozDavri) > 0 && (
                      <div className="text-xs text-amber-400/80 mt-1">
                        Jami muddati: {parseInt(imtiyozDavri) + (parseInt(tolovSoni) || 0)} oy
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Imtiyoz davrida foiz (%)
                      <span className="text-gray-600 ml-1">— bo&apos;sh = asosiy foiz bilan bir xil</span>
                    </label>
                    <input type="number" min={0} max={100} step={0.1} value={imtiyozFoiz} onChange={e => setImtiyozFoiz(e.target.value)}
                      placeholder={yillikFoiz || '0'} className={inp} />
                    <div className="text-xs text-gray-600 mt-1">Masalan: 0 (foizsiz), yoki kamaytirilgan stavka</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <button onClick={handleCalc}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
        📊 Grafikni hisoblash
      </button>

      {rows.length > 0 && (
        <div className="space-y-4">
          {/* Summary cards */}
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
              <div className="text-xs text-gray-500 mt-0.5">
                Jami oy
                {graceCount > 0 && <span className="text-amber-500/70"> ({graceCount}+{regularCount})</span>}
              </div>
            </div>
          </div>

          {/* Grace period badge */}
          {graceCount > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg px-3 py-2 text-xs text-amber-400">
              ⏳ Sariq qatorlar — imtiyoz davri ({graceCount} oy): faqat foiz to&apos;lanadi, asosiy qarz to&apos;lanmaydi
            </div>
          )}

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
                {rows.map((r, i) => {
                  const isGrace = !!r.izoh
                  return (
                    <tr key={r.num}
                      className={isGrace
                        ? 'bg-amber-950/20 border-l-2 border-l-amber-600/40'
                        : i % 2 === 0 ? 'bg-[#0F172A]' : 'bg-[#111827]'
                      }>
                      <td className="px-3 py-2 text-center text-gray-400">
                        {r.num}
                        {isGrace && <span className="ml-1 text-[10px] text-amber-500">●</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-300">{r.sana}</td>
                      <td className="px-3 py-2 text-right text-white">
                        {isGrace ? <span className="text-gray-500">—</span> : fmt(r.asosiy)}
                      </td>
                      {hasInterest && <td className="px-3 py-2 text-right text-amber-400">{fmt(r.foiz)}</td>}
                      <td className="px-3 py-2 text-right text-emerald-400 font-semibold">{fmt(r.jami)}</td>
                      <td className="px-3 py-2 text-right text-gray-400">{fmt(r.qoldiq)}</td>
                    </tr>
                  )
                })}
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
