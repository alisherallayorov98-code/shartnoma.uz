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
function cyrillicToLatin(str: string): string {
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
    // O'zbek lotin maxsus belgilari (apostroflar)
    '\u02bb':"'",'ʻ':"'",'ʼ':"'",
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

  const ML = 25, MR = 20, MT = 25, MB = 25
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
      .replace(/[^\x00-\xFF]/g, '?')  // strip anything outside Latin-1
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
      const firstW = doc.splitTextToSize(t, bodyW - indent)
      guard(5.5)
      doc.text(firstW[0], ML + indent, y); y += 5.5
      if (firstW.length > 1) {
        const rest = doc.splitTextToSize(firstW.slice(1).join(' '), bodyW)
        for (const w of rest) { guard(5.5); doc.text(w, ML, y); y += 5.5 }
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
  const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import('docx')

  const paragraphs = text.split('\n').map((line, i, arr) => {
    const trimmed = line.trim()
    const kind = classifyLine(line)

    if (kind === 'empty') {
      return new Paragraph({ text: '', spacing: { after: 100 } })
    }

    if (kind === 'title') {
      return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({
          text: trimmed,
          bold: true,
          size: 28,
          font: 'Times New Roman',
          color: '000000',
        })],
      })
    }

    if (kind === 'section') {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({
          text: trimmed,
          bold: true,
          size: 24,
          font: 'Times New Roman',
          color: '000000',
        })],
      })
    }

    if (kind === 'bullet') {
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 360, hanging: 200 },
        spacing: { after: 60 },
        children: [new TextRun({
          text: trimmed,
          size: 24,
          font: 'Times New Roman',
        })],
      })
    }

    if (kind === 'subsection') {
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 720 },
        spacing: { after: 60 },
        children: [new TextRun({
          text: trimmed,
          size: 24,
          font: 'Times New Roman',
        })],
      })
    }

    // body paragraph
    const prevKind = i > 0 ? classifyLine(arr[i - 1]) : 'empty'
    const isParaStart = prevKind === 'empty' || prevKind === 'section' || prevKind === 'title'
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: isParaStart ? { firstLine: 720 } : {},
      spacing: { after: 80, line: 276 },
      children: [new TextRun({
        text: trimmed,
        size: 24,
        font: 'Times New Roman',
        color: '000000',
      })],
    })
  })

  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          run: { bold: true, size: 28, font: 'Times New Roman' },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 } },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          run: { bold: true, size: 24, font: 'Times New Roman' },
          paragraph: { spacing: { before: 200, after: 80 } },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 }, // ~2cm/3cm
        },
      },
      children: paragraphs,
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
