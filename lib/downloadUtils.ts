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

export async function downloadTextAsPDF(text: string, filename: string) {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const margin = 20
  const pageW = 210
  const contentWidth = pageW - margin * 2
  const lineHeight = 6
  const pageHeight = 297
  let y = margin

  doc.setFont('helvetica')

  const lines = text.split('\n')
  for (const rawLine of lines) {
    const safe = rawLine.replace(/[^\x00-\x7Eа-яА-ЯёЁ\u0400-\u04FF\u0300-\u036f]/g, (ch) => {
      try { return ch } catch { return '?' }
    })

    const isBold = /^[A-ZА-ЯЁ\d][\.\)]\s/.test(safe.trimStart()) || /^\d+\.\s/.test(safe.trimStart())
    doc.setFontSize(isBold ? 10 : 9)

    const wrapped = doc.splitTextToSize(safe || ' ', contentWidth)
    for (const wline of wrapped) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(wline, margin, y)
      y += lineHeight
    }
  }

  doc.save(`${filename}.pdf`)
}

export async function downloadTextAsWord(text: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun } = await import('docx')

  const paragraphs = text.split('\n').map(line => {
    if (!line.trim()) return new Paragraph({ text: '' })
    const isBold = /^[A-ZА-ЯЁ\d][\.\)]\s/.test(line.trimStart()) || /^\d+\.\s/.test(line.trimStart())
    return new Paragraph({
      children: [new TextRun({ text: line, bold: isBold, size: 22, font: 'Times New Roman' })],
      spacing: { after: 80 },
    })
  })

  const doc = new Document({
    sections: [{
      properties: {},
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
