import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const name = file.name.toLowerCase()

    if (name.endsWith('.txt')) {
      const text = buffer.toString('utf-8')
      return NextResponse.json({ text })
    }

    if (name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer })
      return NextResponse.json({ text: result.value })
    }

    return NextResponse.json({ error: "Faqat .txt yoki .docx fayl qo'llab-quvvatlanadi" }, { status: 400 })
  } catch (err) {
    console.error('[extract-text]', err)
    return NextResponse.json({ error: "Faylni o'qishda xatolik yuz berdi" }, { status: 500 })
  }
}
