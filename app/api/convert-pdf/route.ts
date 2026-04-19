import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFile, readFile, unlink } from 'fs/promises'
import { promisify } from 'util'
import path from 'path'
import { randomUUID } from 'crypto'

const execAsync = promisify(exec)

export async function POST(req: NextRequest) {
  let inputPath = ''
  let outputPath = ''

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const id = randomUUID()
    const tmpDir = '/tmp'
    inputPath  = path.join(tmpDir, `${id}.docx`)
    outputPath = path.join(tmpDir, `${id}.pdf`)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(inputPath, buffer)

    await execAsync(
      `libreoffice --headless --convert-to pdf --outdir ${tmpDir} ${inputPath}`,
      { timeout: 30000 }
    )

    const pdfBuffer = await readFile(outputPath)
    const filename = (file.name || 'shartnoma').replace(/\.docx$/i, '.pdf')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('PDF conversion error:', err)
    return NextResponse.json({ error: 'PDF konversiya xatosi' }, { status: 500 })
  } finally {
    if (inputPath)  await unlink(inputPath).catch(() => {})
    if (outputPath) await unlink(outputPath).catch(() => {})
  }
}
