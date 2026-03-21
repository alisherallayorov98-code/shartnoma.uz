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
  const { Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber } = await import('docx')

  const F = 'Times New Roman'

  // Improved line classifier for Word output
  function detectKind(line: string): 'empty' | 'title' | 'main' | 'sub' | 'label' | 'bullet' | 'body' {
    const t = line.trim()
    if (!t || /^={3,}$|^-{3,}$/.test(t)) return 'empty'
    // Main numbered section: "1. TEXT", "2. TEXT" (not subsection like 1.1)
    if (/^(\d+\.\s+\S|§\s*\d)/.test(t) && !/^\d+\.\d/.test(t)) return 'main'
    // Subsection: "1.1.", "1.2.3"
    if (/^\d+\.\d+/.test(t)) return 'sub'
    // Title: short line, starts with uppercase, mostly uppercase letters
    if (t.length <= 80 && /^[A-ZА-ЯЁЎҚҒҲ]/.test(t)) {
      const letters = t.replace(/\s+/g, '').replace(/[^a-zA-ZА-ЯЁа-яёЎҚҒҲўқғҳ]/g, '')
      const uppers = t.replace(/[^A-ZА-ЯЁЎҚҒҲ]/g, '')
      if (letters.length >= 4 && uppers.length / letters.length >= 0.65) return 'title'
    }
    // Label: "BUYURTMACHI:", "IJROCHI:" etc.
    if (/^[A-ZА-ЯЁЎҚҒҲ][A-ZА-ЯЁЎҚҒҲ\s]{2,20}:\s*$/.test(t)) return 'label'
    // Bullet
    if (/^[-–•]\s/.test(t)) return 'bullet'
    return 'body'
  }

  const lines = text.split('\n')
  const paragraphs = lines.map((line, i, arr) => {
    const t = line.trim()
    const kind = detectKind(line)

    if (kind === 'empty') {
      return new Paragraph({ text: '', spacing: { after: 80 } })
    }

    if (kind === 'title') {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: i > 0 ? 240 : 0, after: 160 },
        children: [new TextRun({ text: t, bold: true, size: 30, font: F, color: '000000' })],
      })
    }

    if (kind === 'main') {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 280, after: 120 },
        children: [new TextRun({ text: t, bold: true, size: 24, font: F, color: '000000' })],
      })
    }

    if (kind === 'sub') {
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 120, after: 80 },
        children: [new TextRun({ text: t, bold: true, size: 24, font: F, color: '000000' })],
      })
    }

    if (kind === 'label') {
      return new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: t, bold: true, size: 24, font: F, color: '000000' })],
      })
    }

    if (kind === 'bullet') {
      const bt = t.replace(/^[-–•]\s*/, '')
      return new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 360, hanging: 180 },
        spacing: { after: 60 },
        children: [new TextRun({ text: `– ${bt}`, size: 24, font: F })],
      })
    }

    // body
    const prevKind = i > 0 ? detectKind(arr[i - 1]) : 'empty'
    const isParaStart = prevKind === 'empty' || prevKind === 'title' || prevKind === 'main' || prevKind === 'sub' || prevKind === 'label'
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: isParaStart ? { firstLine: 720 } : {},
      spacing: { after: 80, line: 276 },
      children: [new TextRun({ text: t, size: 24, font: F, color: '000000' })],
    })
  })

  const doc = new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 } },
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
