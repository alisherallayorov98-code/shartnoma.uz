'use client'

import { useState, useRef, useEffect } from 'react'
import type { Org, Counterparty, Contract } from '@/lib/types'

type Props = { org: Org | null; cps: Counterparty[]; contracts?: Contract[] }

type HujjatTuri = 'faktura' | 'tolov' | 'qaytarish' | 'dalolatnoma' | 'boshqa'
type Row = {
  id: number
  sana: string
  hujjat_turi: HujjatTuri
  hujjat_raqam: string
  debet: string   // bizdan kontragentga (yetkazib berish, xizmat)
  kredit: string  // kontragentdan bizga (to'lov)
}

let _rid = 1
function emptyRow(): Row {
  return { id: _rid++, sana: '', hujjat_turi: 'faktura', hujjat_raqam: '', debet: '', kredit: '' }
}

const HUJJAT_LABELS: Record<HujjatTuri, string> = {
  faktura: 'Schyot-faktura',
  tolov: "To'lov",
  qaytarish: 'Qaytarish',
  dalolatnoma: 'Dalolatnoma',
  boshqa: 'Boshqa',
}

function num(s: string): number { return parseFloat(s.replace(/[\s,]/g, '')) || 0 }
function fmt(n: number): string { return Math.round(n).toLocaleString('uz-UZ') }

export default function AktSverki({ org, cps, contracts = [] }: Props) {
  const [kontragent, setKontragent] = useState('')
  const [kontragentInn, setKontragentInn] = useState('')
  const [shartnoma, setShartnoma] = useState('')
  const [davrBosh, setDavrBosh] = useState('')
  const [davrOxir, setDavrOxir] = useState('')
  const [boshQoldiq, setBoshQoldiq] = useState('0')  // musbat = kontragent qarzdor, manfiy = biz qarzdormiz
  const [rows, setRows] = useState<Row[]>([emptyRow()])
  const [aktRaqam, setAktRaqam] = useState('')
  const [downloading, setDownloading] = useState(false)

  const [cpSearch, setCpSearch] = useState('')
  const [cpOpen, setCpOpen] = useState(false)
  const [contractOpen, setContractOpen] = useState(false)
  const [contractSearch, setContractSearch] = useState('')
  const cpRef = useRef<HTMLDivElement>(null)
  const contractRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (cpRef.current && !cpRef.current.contains(e.target as Node)) setCpOpen(false)
      if (contractRef.current && !contractRef.current.contains(e.target as Node)) setContractOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function addRow() { setRows(p => [...p, emptyRow()]) }
  function removeRow(id: number) { setRows(p => p.length > 1 ? p.filter(r => r.id !== id) : p) }
  function updateRow(id: number, field: keyof Row, val: string) {
    setRows(p => p.map(r => r.id === id ? { ...r, [field]: val } : r))
  }

  // Qoldiq hisoblash
  const bq = num(boshQoldiq)
  const totalDebet = rows.reduce((s, r) => s + num(r.debet), 0)
  const totalKredit = rows.reduce((s, r) => s + num(r.kredit), 0)
  const yakunQoldiq = bq + totalDebet - totalKredit
  // Running balance
  let runBalance = bq
  const rowsWithBalance = rows.map(r => {
    runBalance += num(r.debet) - num(r.kredit)
    return { ...r, balance: runBalance }
  })

  const filteredCps = cps.filter(c => c.name.toLowerCase().includes(cpSearch.toLowerCase())).slice(0, 8)
  const filteredContracts = contracts.filter(c => {
    const cpMatch = !kontragent || (c.counterparties?.name || '').toLowerCase().includes(kontragent.toLowerCase())
    const srch = contractSearch.toLowerCase()
    return cpMatch && (!srch || c.contract_number.toLowerCase().includes(srch))
  }).slice(0, 10)

  function selectCp(cp: Counterparty) {
    setKontragent(cp.name); setKontragentInn(cp.inn || '')
    setCpOpen(false); setCpSearch('')
  }
  function selectContract(c: Contract) {
    setShartnoma(c.contract_number)
    if (!kontragent && c.counterparties?.name) { setKontragent(c.counterparties.name); setKontragentInn('') }
    setContractOpen(false); setContractSearch('')
  }

  async function downloadWord() {
    setDownloading(true)
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, AlignmentType, WidthType } = await import('docx')
      const nb = { style: BorderStyle.NIL, size: 0, color: 'auto' as const }
      const brdNone = { top: nb, bottom: nb, left: nb, right: nb, insideH: nb, insideV: nb }
      const brdNoneCell = { top: nb, bottom: nb, left: nb, right: nb }
      const cb = { style: BorderStyle.SINGLE, size: 4, color: '999999' as const }
      const brd = { top: cb, bottom: cb, left: cb, right: cb }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function hc(text: string, span = 1, align: any = AlignmentType.CENTER) {
        return new TableCell({ borders: brd, columnSpan: span, shading: { fill: 'EEEEEE' },
          children: [new Paragraph({ alignment: align, children: [new TextRun({ text, bold: true, size: 18 })] })] })
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function dc(text: string, align: any = AlignmentType.RIGHT, shade?: string) {
        return new TableCell({ borders: brd, ...(shade ? { shading: { fill: shade } } : {}),
          children: [new Paragraph({ alignment: align, children: [new TextRun({ text, size: 18 })] })] })
      }

      const davr = davrBosh && davrOxir ? `${davrBosh} – ${davrOxir}` : davrBosh || davrOxir || '___'

      const doc = new Document({ sections: [{ children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `O'ZARO HISOB-KITOBLARNI TEKSHIRISH AKTI`, bold: true, size: 28 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `№ ${aktRaqam || '___'}   Davr: ${davr}`, size: 22 })] }),
        new Paragraph({ children: [] }),
        // Tomonlar 2-ustunli jadval
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE }, borders: brdNone,
          rows: [new TableRow({ children: [
            new TableCell({ borders: brdNoneCell, children: [
              new Paragraph({ children: [new TextRun({ text: 'BIZ:', bold: true, size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: org?.name || '___', size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: `INN: ${org?.inn || '___'}`, size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: `Bank: ${org?.bank_name || '___'}`, size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: `H/R: ${org?.bank_account || '___'}  MFO: ${org?.mfo || '___'}`, size: 20 })] }),
            ] }),
            new TableCell({ borders: brdNoneCell, children: [
              new Paragraph({ children: [new TextRun({ text: 'KONTRAGENT:', bold: true, size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: kontragent || '___', size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: `INN: ${kontragentInn || '___'}`, size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Bank: _________________________', size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: 'H/R: _______________  MFO: ______', size: 20 })] }),
            ] }),
          ] })],
        }),
        ...(shartnoma ? [new Paragraph({ children: [new TextRun({ text: `Shartnoma: № ${shartnoma}`, size: 20 })] })] : []),
        new Paragraph({ children: [] }),
        // Tranzaksiyalar jadvali
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              hc('№', 1), hc('Sana'), hc('Hujjat turi va raqami', 1, AlignmentType.LEFT),
              hc("Debet (so'm)\n(yetkazish/xizmat)"), hc("Kredit (so'm)\n(to'lov qabul)"), hc("Qoldiq (so'm)"),
            ] }),
            // Boshlanish qoldig'i
            new TableRow({ children: [
              dc('', AlignmentType.CENTER), dc(''), dc('Boshlanish qoldig\'i', AlignmentType.LEFT, 'FFFDE7'),
              dc(''), dc(''), dc(fmt(bq) + (bq >= 0 ? ' (K. qarz)' : ' (B. qarz)'), AlignmentType.RIGHT, 'FFFDE7'),
            ] }),
            ...rowsWithBalance.map((r, i) => new TableRow({ children: [
              dc(String(i + 1), AlignmentType.CENTER),
              dc(r.sana || '___'),
              dc(`${HUJJAT_LABELS[r.hujjat_turi]} № ${r.hujjat_raqam || '___'}`, AlignmentType.LEFT),
              dc(r.debet ? fmt(num(r.debet)) : '—'),
              dc(r.kredit ? fmt(num(r.kredit)) : '—'),
              dc(fmt(r.balance) + (r.balance >= 0 ? ' (K)' : ' (B)')),
            ] })),
            // Jami
            new TableRow({ children: [
              new TableCell({ borders: brd, columnSpan: 3, shading: { fill: 'EEEEEE' }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'JAMI:', bold: true, size: 18 })] })] }),
              dc(fmt(totalDebet), AlignmentType.RIGHT, 'EEEEEE'),
              dc(fmt(totalKredit), AlignmentType.RIGHT, 'EEEEEE'),
              dc(fmt(yakunQoldiq) + (yakunQoldiq >= 0 ? ' (K. qarz)' : ' (B. qarz)'), AlignmentType.RIGHT, 'EEEEEE'),
            ] }),
          ],
        }),
        new Paragraph({ children: [] }),
        new Paragraph({ children: [new TextRun({ text: `Yakuniy qoldiq: ${fmt(Math.abs(yakunQoldiq))} so'm — ${yakunQoldiq > 0 ? `"${kontragent || 'Kontragent'}" bizga qarzdor` : yakunQoldiq < 0 ? `Biz "${kontragent || 'Kontragent'}"ga qarzdormiz` : 'Qarz yo\'q, hisob-kitob muvozanatlashgan'}`, bold: true, size: 20 })] }),
        new Paragraph({ children: [] }),
        // Imzolar
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE }, borders: brdNone,
          rows: [new TableRow({ children: [
            new TableCell({ borders: brdNoneCell, children: [
              new Paragraph({ children: [new TextRun({ text: `"${org?.name || '___'}" nomidan:`, size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: `Bosh buxgalter: _____________ / ___`, size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: `Rahbar: _____________ / ${org?.director_name || '___'}`, size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: 'M.O.   Sana: _______________', size: 20 })] }),
            ] }),
            new TableCell({ borders: brdNoneCell, children: [
              new Paragraph({ children: [new TextRun({ text: `"${kontragent || '___'}" nomidan:`, size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Bosh buxgalter: _____________ / ___', size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Rahbar: _____________ / ___', size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: 'M.O.   Sana: _______________', size: 20 })] }),
            ] }),
          ] })],
        }),
      ] }] })

      const buf = await Packer.toBlob(doc)
      const url = URL.createObjectURL(buf)
      const a = document.createElement('a'); a.href = url
      a.download = `akt_sverki_${kontragent.replace(/\s/g, '_') || Date.now()}.docx`; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-500'
  const inpSm = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-600 placeholder-gray-500'

  return (
    <div className="space-y-5">
      {/* Meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Akt raqami</label>
          <input type="text" value={aktRaqam} onChange={e => setAktRaqam(e.target.value)} placeholder="2025/04-01" className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Boshlanish qoldig&apos;i (so&apos;m)</label>
          <input type="text" value={boshQoldiq} onChange={e => setBoshQoldiq(e.target.value)}
            placeholder="0 (musbat = kontragent qarz, manfiy = biz qarz)" className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Davr boshi</label>
          <input type="date" value={davrBosh} onChange={e => setDavrBosh(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Davr oxiri</label>
          <input type="date" value={davrOxir} onChange={e => setDavrOxir(e.target.value)} className={inp} />
        </div>

        {/* Kontragent */}
        <div className="relative" ref={cpRef}>
          <label className="block text-xs text-gray-400 mb-1">Kontragent</label>
          <input type="text" value={cpOpen ? cpSearch : kontragent}
            onFocus={() => { setCpOpen(true); setCpSearch(kontragent) }}
            onChange={e => { setCpSearch(e.target.value); setKontragent(e.target.value); setCpOpen(true) }}
            placeholder="Kontragent nomi" className={inp} autoComplete="off"
          />
          {cpOpen && filteredCps.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl max-h-48 overflow-y-auto">
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

        {/* Shartnoma */}
        <div className="relative" ref={contractRef}>
          <label className="block text-xs text-gray-400 mb-1">Shartnoma (ixtiyoriy)</label>
          <input type="text" value={contractOpen ? contractSearch : shartnoma}
            onFocus={() => { setContractOpen(true); setContractSearch(shartnoma) }}
            onChange={e => { setContractSearch(e.target.value); setShartnoma(e.target.value); setContractOpen(true) }}
            placeholder={kontragent ? `${kontragent} shartnomalaridan...` : "Shartnoma raqami"} className={inp} autoComplete="off"
          />
          {contractOpen && filteredContracts.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {filteredContracts.map(c => (
                <button key={c.id} type="button" onMouseDown={() => selectContract(c)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#1F2937] transition border-b border-[#1E293B] last:border-0">
                  <div className="text-sm font-medium text-white">№ {c.contract_number} <span className="text-gray-500 text-xs">{c.contract_date}</span></div>
                  {c.counterparties?.name && <div className="text-xs text-gray-400">{c.counterparties.name}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium">Tranzaksiyalar jadvali</span>
          <button onClick={addRow} className="text-xs text-blue-400 hover:text-blue-300 transition">+ Qator qo&apos;shish</button>
        </div>
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[90px_2fr_90px_110px_110px_28px] gap-2 text-xs text-gray-500 px-1 mb-1">
          <span>Sana</span><span>Hujjat turi / raqami</span><span>Tur</span>
          <span className="text-right">Debet (bizdan)</span><span className="text-right">Kredit (bizga)</span><span/>
        </div>
        <div className="space-y-1.5">
          {rowsWithBalance.map((r, i) => (
            <div key={r.id} className="bg-[#0F172A] border border-[#1E293B] rounded-lg p-2">
              <div className="grid grid-cols-1 sm:grid-cols-[90px_2fr_90px_110px_110px_28px] gap-2 items-center">
                <input type="date" value={r.sana} onChange={e => updateRow(r.id, 'sana', e.target.value)} className={inpSm} />
                <input type="text" value={r.hujjat_raqam} onChange={e => updateRow(r.id, 'hujjat_raqam', e.target.value)}
                  placeholder={`${i + 1}. Hujjat raqami`} className={inpSm} />
                <select value={r.hujjat_turi} onChange={e => updateRow(r.id, 'hujjat_turi', e.target.value as HujjatTuri)} className={inpSm}>
                  {Object.entries(HUJJAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input type="text" value={r.debet} onChange={e => updateRow(r.id, 'debet', e.target.value)}
                  placeholder="0" className={inpSm + ' text-right'} />
                <input type="text" value={r.kredit} onChange={e => updateRow(r.id, 'kredit', e.target.value)}
                  placeholder="0" className={inpSm + ' text-right'} />
                <button onClick={() => removeRow(r.id)} className="text-gray-600 hover:text-red-400 transition text-sm">✕</button>
              </div>
              {(num(r.debet) > 0 || num(r.kredit) > 0) && (
                <div className="mt-1 flex gap-4 text-[11px]">
                  {num(r.debet) > 0 && <span className="text-blue-400">D: {fmt(num(r.debet))}</span>}
                  {num(r.kredit) > 0 && <span className="text-emerald-400">K: {fmt(num(r.kredit))}</span>}
                  <span className={r.balance >= 0 ? 'text-amber-400' : 'text-red-400'}>
                    Qoldiq: {fmt(Math.abs(r.balance))} {r.balance >= 0 ? '(K. qarz)' : '(B. qarz)'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="text-center">
            <div className="text-sm font-bold text-white">{fmt(bq)}</div>
            <div className="text-xs text-gray-500">Bosh. qoldiq</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-blue-400">{fmt(totalDebet)}</div>
            <div className="text-xs text-gray-500">Jami debet</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-emerald-400">{fmt(totalKredit)}</div>
            <div className="text-xs text-gray-500">Jami kredit</div>
          </div>
          <div className="text-center">
            <div className={`text-sm font-bold ${yakunQoldiq > 0 ? 'text-amber-400' : yakunQoldiq < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {fmt(Math.abs(yakunQoldiq))}
            </div>
            <div className="text-xs text-gray-500">Yakuniy qoldiq</div>
          </div>
        </div>
        <div className={`text-sm font-semibold text-center py-2 rounded-lg ${
          yakunQoldiq > 0 ? 'bg-amber-950/30 text-amber-400' :
          yakunQoldiq < 0 ? 'bg-red-950/30 text-red-400' :
          'bg-emerald-950/30 text-emerald-400'
        }`}>
          {yakunQoldiq > 0
            ? `"${kontragent || 'Kontragent'}" bizga ${fmt(yakunQoldiq)} so'm qarzdor`
            : yakunQoldiq < 0
            ? `Biz "${kontragent || 'Kontragent'}"ga ${fmt(Math.abs(yakunQoldiq))} so'm qarzdormiz`
            : 'Hisob-kitob muvozanatlashgan — qarz yo\'q'}
        </div>
      </div>

      <button onClick={downloadWord} disabled={downloading}
        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-[#1E293B] disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
        {downloading ? '⏳ Yuklanmoqda...' : '📄 Word (.docx) yuklab olish'}
      </button>
    </div>
  )
}
