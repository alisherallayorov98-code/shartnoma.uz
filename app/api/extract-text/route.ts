import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import mammoth from 'mammoth'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  // Auth check
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Avtorizatsiya kerak' }, { status: 401 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Token yaroqsiz' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fayl topilmadi' }, { status: 400 })
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Fayl hajmi 10 MB dan oshmasligi kerak' }, { status: 400 })

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
