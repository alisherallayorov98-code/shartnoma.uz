// Shared PDF and Word download utilities for AI-generated document results

export type SavedAiResult = {
  id: string
  title: string
  content: string
  savedAt: string
}

export function saveAiResult(title: string, content: string) {
  const key = 'saved_ai_results'
  const existing: SavedAiResult[] = JSON.parse(localStorage.getItem(key) || '[]')
  const entry: SavedAiResult = {
    id: Date.now().toString(),
    title,
    content,
    savedAt: new Date().toISOString(),
  }
  existing.unshift(entry)
  // Keep max 50
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)))
}

export function loadSavedAiResults(): SavedAiResult[] {
  return JSON.parse(localStorage.getItem('saved_ai_results') || '[]')
}

export function deleteSavedAiResult(id: string) {
  const existing: SavedAiResult[] = JSON.parse(localStorage.getItem('saved_ai_results') || '[]')
  localStorage.setItem('saved_ai_results', JSON.stringify(existing.filter(r => r.id !== id)))
}

// ─── Kirill → Lotin transkripsiyasi (jsPDF faqat ASCII/Latin-1 qo'llab-quvvatlaydi) ─────
// export — boshqa fayllar ham bu funksiyadan foydalanadi
export function cyrillicToLatin(str: string): string {
  const map: Record<string, string> = {
    // Kichik kirill harflari
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y',
    'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
    'х':'x','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':"'",'ы':'y','ь':"'",'э':'e','ю':'yu','я':'ya',
    // Katta kirill harflari
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh','З':'Z','И':'I','Й':'Y',
    'К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R','С':'S','Т':'T','У':'U','Ф':'F',
    'Х':'X','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Sch','Э':'E','Ю':'Yu','Я':'Ya',
    // O'zbek maxsus harflari (kirill)
    'ғ':"g'",'Ғ':"G'",'ҳ':'h','Ҳ':'H','қ':'q','Қ':'Q','ў':"o'",'Ў':"O'",'ҷ':'j','Ҷ':'J',
    // O'zbek lotin maxsus belgilari — \u02bb=ʻ modifier letter turned comma, \u02bc=ʼ modifier letter apostrophe
    '\u02bb':"'",'\u02bc':"'",
    // Tinish belgilari — izchil ko'rinish uchun
    '\u2013':'-','\u2014':'-',   // en-dash, em-dash
    '\u201c':'"','\u201d':'"',   // qo'shtirnoq chapdan/o'ngdan
    '\u2018':"'",'`':"'",        // apostrof turlari
    '\u00ab':'<<','\u00bb':'>>',  // «»
  }
  // Faqat kirill va maxsus belgilarni almashtir — ASCII/lotin harflari o'zgarishsiz qoladi
  return str.replace(/[а-яёА-ЯЁ\u0400-\u04FF\u02bb\u02bc\u2013\u2014\u201c\u201d\u2018\u2019`\u00ab\u00bb]/gu,
    ch => map[ch] ?? ch
  ).replace(/[^\x00-\xFF]/g, '?')  // qolgan noma'lum belgilar
}

// Tekst satri turini aniqlash
type LineType = 'empty' | 'title' | 'section' | 'subsection' | 'bullet' | 'body'
function classifyLine(line: string): LineType {
  const t = line.trim()
  if (!t) return 'empty'
  // Title: qisqa, bosh harflar bilan yoki ==, ---
  if (/^={3,}$/.test(t) || /^-{3,}$/.test(t)) return 'empty'
  if (t.length <= 60 && /^[A-ZА-ЯЁЎҚҒҲ\s"'«»\-\.]{6,}$/.test(t)) return 'title'
  // Numbered section: "1.", "1.1.", "MODDA 1"
  if (/^(\d+[\.\)](\d+[\.\)])*\s|§\s*\d+|[A-ZА-ЯЁ]+\s+\d+[\.\:])/.test(t)) return 'section'
  // BUYURTMACHI:, IJROCHI: kabi
  if (/^[A-ZА-ЯЁЎҚҒҲ ]{4,30}:\s*$/.test(t) || /^[A-ZА-ЯЁЎҚҒҲ ]{4,20}:\s+\S/.test(t)) return 'section'
  // Bullet
  if (/^[\-–•]\s/.test(t)) return 'bullet'
  // Subsection: a), b), i), "–" leader
  if (/^[a-z]\)\s/.test(t)) return 'subsection'
  return 'body'
}

export async function downloadTextAsPDF(text: string, filename: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const ML = 25, MR = 20, MT = 25, MB = 30  // MB=30 footer uchun joy qoldiradi
  const pageW = 210
  const pageH = 297
  const bodyW = pageW - ML - MR
  let y = MT

  function guard(need: number) {
    if (y + need > pageH - MB) { doc.addPage(); y = MT }
  }

  const rawLines = text.split('\n')
  let firstLine = true

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i]
    const safe = cyrillicToLatin(raw)
    const t = safe.trim()
    const kind = classifyLine(raw)

    if (kind === 'empty') {
      y += firstLine ? 0 : 3
      continue
    }

    if (kind === 'title') {
      guard(10)
      if (!firstLine) y += 4
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(10, 10, 10)
      const wrapped = doc.splitTextToSize(t, bodyW)
      for (const w of wrapped) { guard(7); doc.text(w, pageW / 2, y, { align: 'center' }); y += 7 }
      y += 2
      // Underline
      doc.setDrawColor(180, 180, 180)
      doc.line(ML, y, pageW - MR, y)
      y += 4
    } else if (kind === 'section') {
      guard(9)
      if (!firstLine) y += 3
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(15, 15, 15)
      const wrapped = doc.splitTextToSize(t, bodyW)
      for (const w of wrapped) { guard(6); doc.text(w, ML, y); y += 6 }
      y += 1
    } else if (kind === 'bullet') {
      guard(5.5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(30, 30, 30)
      const indent = 5
      const bulletText = t.replace(/^[\-–•]\s*/, '')
      const wrapped = doc.splitTextToSize(bulletText, bodyW - indent - 3)
      doc.text('-', ML + indent, y)
      for (let wi = 0; wi < wrapped.length; wi++) {
        guard(5.5)
        doc.text(wrapped[wi], ML + indent + 3, y)
        y += 5.5
      }
    } else if (kind === 'subsection') {
      guard(5.5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(40, 40, 40)
      const indent = 8
      const wrapped = doc.splitTextToSize(t, bodyW - indent)
      for (const w of wrapped) { guard(5.5); doc.text(w, ML + indent, y); y += 5.5 }
    } else {
      // body — detect if line follows empty line (paragraph start → first-line indent)
      const prevKind = i > 0 ? classifyLine(rawLines[i - 1]) : 'empty'
      const isParaStart = prevKind === 'empty' || prevKind === 'section' || prevKind === 'title'
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(30, 30, 30)
      const indent = isParaStart ? 8 : 0
      if (indent > 0) {
        // Abzas boshi: birinchi satr chetdan, qolganlar to'liq kenglikda
        const firstLineWrapped = doc.splitTextToSize(t, bodyW - indent)
        guard(5.5)
        doc.text(firstLineWrapped[0], ML + indent, y); y += 5.5
        if (firstLineWrapped.length > 1) {
          // Qolgan qism to'liq kenglikda qayta wrap
          const remainder = firstLineWrapped.slice(1).join(' ')
          const restWrapped = doc.splitTextToSize(remainder, bodyW)
          for (const w of restWrapped) { guard(5.5); doc.text(w, ML, y); y += 5.5 }
        }
      } else {
        // Oddiy satr — to'g'ridan-to'g'ri wrap
        const wrapped = doc.splitTextToSize(t, bodyW)
        for (const w of wrapped) { guard(5.5); doc.text(w, ML, y); y += 5.5 }
      }
    }
    firstLine = false
  }

  // Sahifa raqamlari
  const total = ((doc.internal as unknown) as { getNumberOfPages(): number }).getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFontSize(7.5)
    doc.setTextColor(160, 160, 160)
    doc.text('Shartnoma.uz', pageW / 2, pageH - 10, { align: 'center' })
    doc.text(`${p} / ${total}`, pageW - MR, pageH - 10, { align: 'right' })
  }

  doc.save(`${filename}.pdf`)
}

export async function downloadTextAsWord(text: string, filename: string) {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber,
    Table, TableRow, TableCell, WidthType, BorderStyle,
  } = await import('docx')

  const F = 'Times New Roman'
  const NB = { style: BorderStyle.NIL, size: 0, color: 'auto' } as const
  const noBorders = { top: NB, bottom: NB, left: NB, right: NB }

  type LineKind = 'empty' | 'separator' | 'title' | 'main' | 'sub' | 'label' | 'bullet' | 'twocol' | 'body'

  function detectKind(line: string): LineKind {
    const t = line.trim()
    if (!t) return 'empty'
    // Decorator lines: ════, ────, ═══, === etc.
    if (/^[═─=\-]{3,}$/.test(t)) return 'separator'
    // Signature lines: only underscores and spaces  ← MUST be before twocol
    if (/^_+(\s+_+)*$/.test(t)) return 'body'
    // Two-column line: non-whitespace, 5+ spaces gap, non-whitespace
    // Excluded: numbered lists, pure underscore/dash lines
    if (
      /\S[ \t]{5,}\S/.test(line) &&
      !/^\d+\.\s/.test(t) &&
      !/^[_\-\s]+$/.test(t)
    ) return 'twocol'
    // Main numbered section: "1. TEXT" but not "1.1."
    if (/^(\d+\.\s+\S|§\s*\d)/.test(t) && !/^\d+\.\d/.test(t)) return 'main'
    // Subsection: "1.1.", "1.2.3"
    if (/^\d+\.\d+/.test(t)) return 'sub'
    // Title: short, starts uppercase, ≥65% uppercase letters
    if (t.length <= 80 && /^[A-ZА-ЯЁЎҚҒҲ]/.test(t)) {
      const letters = t.replace(/\s+/g, '').replace(/[^a-zA-ZА-ЯЁа-яёЎҚҒҲўқғҳ]/g, '')
      const uppers = t.replace(/[^A-ZА-ЯЁЎҚҒҲ]/g, '')
      if (letters.length >= 4 && uppers.length / letters.length >= 0.65) return 'title'
    }
    // Label: "ISH BERUVCHI:", "XODIM:" etc. (standalone label on own line)
    if (/^[A-ZА-ЯЁЎҚҒҲ][A-ZА-ЯЁЎҚҒҲ\s]{1,25}:\s*$/.test(t)) return 'label'
    // Bullet
    if (/^[-–•]\s/.test(t)) return 'bullet'
    return 'body'
  }

  // Split a two-column line into [left, right]
  function splitTwoCol(line: string): [string, string] {
    const m = line.match(/^(.+?)[ \t]{5,}(.+)$/)
    if (m) return [m[1].trim(), m[2].trim()]
    return [line.trim(), '']
  }

  // Build blocks: group consecutive twocol lines into table blocks
  type ParaBlock = { type: 'para'; line: string; bi: number }
  type TableBlock = { type: 'table'; rows: [string, string][] }
  type Block = ParaBlock | TableBlock

  const rawLines = text.split('\n')
  const blocks: Block[] = []
  let li = 0
  while (li < rawLines.length) {
    const k = detectKind(rawLines[li])
    if (k === 'twocol') {
      const rows: [string, string][] = []
      while (li < rawLines.length) {
        const kk = detectKind(rawLines[li])
        if (kk === 'twocol') { rows.push(splitTwoCol(rawLines[li])); li++ }
        else if (kk === 'empty' && li + 1 < rawLines.length && detectKind(rawLines[li + 1]) === 'twocol') { li++ } // skip blank between twocol rows
        else break
      }
      if (rows.length > 0) blocks.push({ type: 'table', rows })
    } else {
      blocks.push({ type: 'para', line: rawLines[li], bi: blocks.length })
      li++
    }
  }

  // Helper: make a no-border table cell with one paragraph
  function makeCell(txt: string, bold = false, align = AlignmentType.LEFT) {
    return new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: noBorders,
      children: [new Paragraph({
        alignment: align,
        spacing: { after: 30 },
        children: [new TextRun({ text: txt, bold, size: 24, font: F, color: '000000' })],
      })],
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []

  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi]

    // ── Table block (two-column rekvizitlar) ────────────────────────────────
    if (block.type === 'table') {
      children.push(new Paragraph({ text: '', spacing: { before: 80, after: 0 } }))
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: block.rows.map(([l, r]) => {
          const isHeader = /^[A-ZА-ЯЁЎҚҒҲ\s]{3,}:?\s*$/.test(l.trim())
          return new TableRow({
            children: [makeCell(l, isHeader), makeCell(r, isHeader)],
          })
        }),
      }))
      children.push(new Paragraph({ text: '', spacing: { before: 0, after: 60 } }))
      continue
    }

    // ── Paragraph block ──────────────────────────────────────────────────────
    const { line } = block
    const t = line.trim()
    const kind = detectKind(line)

    if (kind === 'empty' || kind === 'separator') {
      children.push(new Paragraph({ text: '', spacing: { after: kind === 'separator' ? 40 : 20 } }))
      continue
    }

    if (kind === 'title') {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: bi > 0 ? 160 : 0, after: 100 },
        children: [new TextRun({ text: t, bold: true, underline: {}, size: 28, font: F, color: '000000' })],
      }))
      continue
    }

    if (kind === 'main') {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: t, bold: true, size: 24, font: F, color: '000000' })],
      }))
      continue
    }

    if (kind === 'sub') {
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 80, after: 40 },
        children: [new TextRun({ text: t, bold: true, size: 24, font: F, color: '000000' })],
      }))
      continue
    }

    if (kind === 'label') {
      children.push(new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [new TextRun({ text: t, bold: true, size: 24, font: F, color: '000000' })],
      }))
      continue
    }

    if (kind === 'bullet') {
      const bt = t.replace(/^[-–•]\s*/, '')
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 360, hanging: 200 },
        spacing: { after: 40 },
        children: [new TextRun({ text: `– ${bt}`, size: 24, font: F, color: '000000' })],
      }))
      continue
    }

    // body — determine paragraph start for first-line indent
    const prevBlock = bi > 0 ? blocks[bi - 1] : null
    let prevKind: LineKind | 'table' = 'empty'
    if (prevBlock?.type === 'para') prevKind = detectKind(prevBlock.line)
    else if (prevBlock?.type === 'table') prevKind = 'table'
    const isParaStart = prevKind === 'empty' || prevKind === 'separator' || prevKind === 'table'
      || prevKind === 'title' || prevKind === 'main' || prevKind === 'sub' || prevKind === 'label'
    children.push(new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: isParaStart ? { firstLine: 360 } : {},
      spacing: { after: 40, line: 276 },
      children: [new TextRun({ text: t, size: 24, font: F, color: '000000' })],
    }))
  }

  const doc = new Document({
    sections: [{
      properties: {
        // Standard Uzbek legal doc margins: left 3cm, right 1.5cm, top/bottom 2cm
        page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 851 } },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Shartnoma.uz  |  bet ', size: 18, font: F, color: '999999' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: F, color: '999999' }),
              new TextRun({ text: ' / ', size: 18, font: F, color: '999999' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: F, color: '999999' }),
            ],
          })],
        }),
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Rasmiy xat — firmenniy blanks sifatida Word yuklash ─────────────────────
export async function downloadRasmiyXatWord(opts: {
  orgName: string
  orgInn?: string
  orgDirector?: string
  orgBankName?: string
  orgAddress?: string
  xatRaqami?: string
  sana?: string
  kimga?: string
  mavzu?: string
  body: string
  filename: string
}) {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber,
    Table, TableRow, TableCell, WidthType, BorderStyle,
  } = await import('docx')

  const F = 'Times New Roman'
  const NB = { style: BorderStyle.NIL, size: 0, color: 'auto' } as const
  const noBorders = { top: NB, bottom: NB, left: NB, right: NB }

  // Sana formatlash: YYYY-MM-DD → DD.MM.YYYY
  let dateStr = ''
  if (opts.sana) {
    const d = new Date(opts.sana)
    dateStr = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`
  } else {
    const d = new Date()
    dateStr = `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []

  // ── 1. Sarlavha jadvali (chapda org, o'ngda raqam+sana) ──────────────────
  const leftLines = [
    new Paragraph({
      spacing: { after: 30 },
      children: [new TextRun({ text: opts.orgName, bold: true, size: 26, font: F, color: '000000' })],
    }),
    ...(opts.orgInn ? [new Paragraph({
      spacing: { after: 10 },
      children: [new TextRun({ text: `STIR: ${opts.orgInn}`, size: 18, font: F, color: '666666' })],
    })] : []),
    ...(opts.orgAddress ? [new Paragraph({
      spacing: { after: 10 },
      children: [new TextRun({ text: opts.orgAddress, size: 18, font: F, color: '666666' })],
    })] : []),
    ...(opts.orgBankName ? [new Paragraph({
      spacing: { after: 10 },
      children: [new TextRun({ text: opts.orgBankName, size: 18, font: F, color: '666666' })],
    })] : []),
  ]

  const rightLines = [
    ...(opts.xatRaqami ? [new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 10 },
      children: [new TextRun({ text: `№ ${opts.xatRaqami}`, size: 22, font: F, color: '000000' })],
    })] : []),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 10 },
      children: [new TextRun({ text: dateStr, size: 22, font: F, color: '000000' })],
    }),
  ]

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [new TableRow({
      children: [
        new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, borders: noBorders, children: leftLines }),
        new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, borders: noBorders, children: rightLines }),
      ],
    })],
  }))

  // ── 2. Gorizontal chiziq (pastki chegara) ────────────────────────────────
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: NB, left: NB, right: NB, bottom: { style: BorderStyle.SINGLE, size: 8, color: '222222' } },
        children: [new Paragraph({ text: '', spacing: { after: 60 } })],
      })],
    })],
  }))

  // ── 3. Kimga (o'ng tomon) ─────────────────────────────────────────────────
  if (opts.kimga) {
    children.push(new Paragraph({ text: '', spacing: { after: 40 } }))
    children.push(new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 20 },
      children: [
        new TextRun({ text: 'Kimga: ', bold: true, size: 22, font: F, color: '000000' }),
        new TextRun({ text: opts.kimga, size: 22, font: F, color: '000000' }),
      ],
    }))
  }
  children.push(new Paragraph({ text: '', spacing: { after: 120 } }))

  // ── 4. Mavzu (markazda, qalin) ────────────────────────────────────────────
  if (opts.mavzu) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 200 },
      children: [new TextRun({ text: opts.mavzu, bold: true, underline: {}, size: 24, font: F, color: '000000' })],
    }))
  }

  // ── 5. Asosiy mazmun ──────────────────────────────────────────────────────
  for (const line of opts.body.split('\n')) {
    const t = line.trim()
    if (!t) { children.push(new Paragraph({ text: '', spacing: { after: 20 } })); continue }
    children.push(new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 360 },
      spacing: { after: 60, line: 276 },
      children: [new TextRun({ text: t, size: 24, font: F, color: '000000' })],
    }))
  }

  // ── 6. Imzo bloki ─────────────────────────────────────────────────────────
  children.push(new Paragraph({ text: '', spacing: { after: 400 } }))
  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: 'Hurmat bilan,', size: 24, font: F, color: '000000' })],
  }))
  children.push(new Paragraph({ text: '', spacing: { after: 300 } }))
  children.push(new Paragraph({
    spacing: { after: 20 },
    children: [
      new TextRun({ text: 'Direktor', bold: true, size: 24, font: F, color: '000000' }),
      new TextRun({ text: '   ___________________   ', size: 24, font: F, color: '000000' }),
      new TextRun({ text: opts.orgDirector || '', bold: true, size: 24, font: F, color: '000000' }),
    ],
  }))

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 851 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Shartnoma.uz  |  bet ', size: 18, font: F, color: '999999' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: F, color: '999999' }),
              new TextRun({ text: ' / ', size: 18, font: F, color: '999999' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: F, color: '999999' }),
            ],
          })],
        }),
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${opts.filename}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Tashkilot blankasi (firmenniy blank) — rasmiy xat shabloni ──────────────
export async function downloadFirmenniyBlank(opts: {
  orgName: string
  orgInn?: string
  orgDirector?: string
  orgBankName?: string
  orgBankAccount?: string
  orgMfo?: string
  orgAddress?: string
  orgPhone?: string
}) {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, Footer,
    PageNumber, Table, TableRow, TableCell, WidthType, BorderStyle,
  } = await import('docx')

  const F = 'Times New Roman'
  const NB = { style: BorderStyle.NIL, size: 0, color: 'auto' } as const
  const noBorders = { top: NB, bottom: NB, left: NB, right: NB }
  const tableNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideH: NB, insideV: NB }
  const Nr = String.fromCharCode(8470)
  const year = new Date().getFullYear()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []

  // ── 1. Tashkilot nomi — markazda, katta, qalin ────────────────────────────
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 60 },
    children: [new TextRun({ text: opts.orgName, bold: true, size: 40, font: F, color: '000000' })],
  }))

  // ── 2. Ikki chiziq (DOUBLE border) ───────────────────────────────────────
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableNoBorders,
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: NB, left: NB, right: NB, bottom: { style: BorderStyle.DOUBLE, size: 8, color: '000000' } },
        children: [new Paragraph({ text: '', spacing: { after: 20 } })],
      })],
    })],
  }))

  // ── 3. Rekvizitlar (markazda, kichik) ────────────────────────────────────
  // Manzil
  if (opts.orgAddress) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 10 },
      children: [new TextRun({ text: `Yuridik manzil:  ${opts.orgAddress}`, size: 16, font: F, color: '000000' })],
    }))
  }
  // Bank rekvizitlari qatori
  const bankParts: string[] = []
  if (opts.orgBankAccount) bankParts.push(`X/R: ${opts.orgBankAccount}`)
  if (opts.orgMfo) bankParts.push(`MFO: ${opts.orgMfo}`)
  if (opts.orgBankName) bankParts.push(opts.orgBankName)
  if (bankParts.length > 0) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 10 },
      children: [new TextRun({ text: bankParts.join('   '), size: 16, font: F, color: '000000' })],
    }))
  }
  // STIR va telefon
  const innPhone: string[] = []
  if (opts.orgInn) innPhone.push(`STIR: ${opts.orgInn}`)
  if (opts.orgPhone) innPhone.push(`Tel: ${opts.orgPhone}`)
  if (innPhone.length > 0) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 30 },
      children: [new TextRun({ text: innPhone.join('   '), size: 16, font: F, color: '000000' })],
    }))
  }

  // ── 5. № (chap) va sana (o'ng) ───────────────────────────────────────────
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableNoBorders,
    rows: [new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: noBorders,
          children: [new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [new TextRun({ text: `${Nr}________`, size: 22, font: F, color: '000000' })],
          })],
        }),
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          borders: noBorders,
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 60, after: 60 },
            children: [new TextRun({ text: `"____" "________________" ${year} y.`, size: 22, font: F, color: '000000' })],
          })],
        }),
      ],
    })],
  }))

  // ── 6. Kimga (o'ng tomon) ────────────────────────────────────────────────
  children.push(new Paragraph({ text: '', spacing: { after: 60 } }))
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 10 },
    children: [new TextRun({ text: 'Kimga: ________________________________', size: 22, font: F, color: '000000' })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 200 },
    children: [new TextRun({ text: '________________________________________', size: 22, font: F, color: '000000' })],
  }))

  // ── 7. Bo'sh matn satrlari ────────────────────────────────────────────────
  for (let i = 0; i < 18; i++) {
    children.push(new Paragraph({
      spacing: { after: 40 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'BBBBBB', space: 1 } },
      children: [new TextRun({ text: '', size: 24, font: F })],
    }))
  }

  // ── 8. Imzo bloki ─────────────────────────────────────────────────────────
  children.push(new Paragraph({ text: '', spacing: { after: 300 } }))
  children.push(new Paragraph({
    spacing: { after: 20 },
    children: [
      new TextRun({ text: 'Direktor', bold: true, size: 24, font: F, color: '000000' }),
      new TextRun({ text: '   ___________________   ', size: 24, font: F, color: '000000' }),
      new TextRun({ text: opts.orgDirector || '', bold: true, size: 24, font: F, color: '000000' }),
    ],
  }))

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 851, bottom: 1134, left: 1134, right: 851 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Shartnoma.uz  |  bet ', size: 16, font: F, color: '999999' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, font: F, color: '999999' }),
              new TextRun({ text: ' / ', size: 16, font: F, color: '999999' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, font: F, color: '999999' }),
            ],
          })],
        }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: children as any,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${opts.orgName.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '_')}_blanka.docx`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Tashkilot rekvizitlari — Word hujjat ────────────────────────────────────
export async function downloadRekvizitlarWord(opts: {
  orgName: string
  orgInn?: string
  orgDirector?: string
  orgBankName?: string
  orgBankAccount?: string
  orgMfo?: string
  orgAddress?: string
  orgPhone?: string
}) {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, Footer,
    PageNumber, Table, TableRow, TableCell, WidthType, BorderStyle,
  } = await import('docx')

  const F = 'Times New Roman'
  const NB = { style: BorderStyle.NIL, size: 0, color: 'auto' } as const
  const noBorders = { top: NB, bottom: NB, left: NB, right: NB }
  const tableNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideH: NB, insideV: NB }

  function row(label: string, value?: string) {
    if (!value) return null
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          borders: noBorders,
          children: [new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: label, bold: true, size: 22, font: F, color: '000000' })],
          })],
        }),
        new TableCell({
          width: { size: 65, type: WidthType.PERCENTAGE },
          borders: noBorders,
          children: [new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: value, size: 22, font: F, color: '000000' })],
          })],
        }),
      ],
    })
  }

  const rows = [
    row('Tashkilot nomi:', opts.orgName),
    row('STIR:', opts.orgInn),
    row('Rahbar:', opts.orgDirector),
    row('Yuridik manzil:', opts.orgAddress),
    row('Bank:', opts.orgBankName),
    row('Hisob raqami (X/R):', opts.orgBankAccount),
    row('MFO:', opts.orgMfo),
    row('Telefon:', opts.orgPhone),
  ].filter(Boolean)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []

  // Sarlavha
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'TASHKILOT REKVIZITLARI', bold: true, size: 28, font: F, color: '000000' })],
  }))

  // Chiziq
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableNoBorders,
    rows: [new TableRow({
      children: [new TableCell({
        borders: { top: NB, left: NB, right: NB, bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
        children: [new Paragraph({ text: '', spacing: { after: 10 } })],
      })],
    })],
  }))

  children.push(new Paragraph({ text: '', spacing: { after: 60 } }))

  // Rekvizitlar jadvali
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableNoBorders,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: rows as any,
  }))

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 851 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Shartnoma.uz', size: 16, font: F, color: '999999' }),
            ],
          })],
        }),
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${opts.orgName.replace(/[^a-zA-Z0-9\u0400-\u04FF]/g, '_')}_rekvizitlar.docx`
  a.click()
  URL.revokeObjectURL(url)
}
