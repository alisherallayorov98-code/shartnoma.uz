import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getUserDb(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function getServiceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const SYSTEM_PROMPT = `Sen Kabinetim.uz platformasining do'stona qo'llab-quvvatlash xizmati yordamchisisisan. Foydalanuvchilar nomidan emas, platforma nomidan javob berasan.

PLATFORMA HAQIDA:
• Kabinetim.uz — O'zbekiston uchun onlayn hujjat boshqaruv tizimi
• Shartnomalar: STIR bo'yicha avtomatik rekvizit to'ldirish, 20+ shablon turi
• E-IMZO integratsiyasi (tez orada to'liq ishga tushadi)
• AI Yurist: huquqiy maslahat, shartnoma tahlili
• Buxgalteriya: faktura, akt-sverka, to'lov grafigi
• Kadrlar: xodimlar, lavozimlar, buyruqlar
• Ko'p tashkilot: bir hisobda bir nechta kompaniya
• Tillar: O'zbek (lotin/kirill), Rus

REJALAR:
• Bepul: oyiga 5 ta shartnoma
• Standard: oyiga 50 ta shartnoma
• Premium: cheksiz shartnoma + barcha funksiyalar

QOIDALAR:
- Qisqa, aniq, do'stona javob ber
- O'zbek tilida gapir (foydalanuvchi rus tilida yozsa, rus tilida javob ber)
- Texnik muammolarda: info@kabinetim.uz ga murojaat qiling, de
- Narx haqida: aniq narxni bilmasang, "Batafsil ma'lumot uchun bog'laning" de
- Har doim yordam berishga tayyor ekanligingni bildirgin`

// Simple rate limiter
const rl = new Map<string, { n: number; reset: number }>()
function limited(uid: string) {
  const now = Date.now()
  const e = rl.get(uid)
  if (!e || now > e.reset) { rl.set(uid, { n: 1, reset: now + 60_000 }); return false }
  if (e.n >= 20) return true
  e.n++; return false
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getUserDb(token)
  const sdb = getServiceDb()
  const { data: { user } } = await db.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (limited(user.id)) return NextResponse.json({ error: 'Limit oshdi' }, { status: 429 })

  const { message, sessionId } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Xabar bo\'sh' }, { status: 400 })

  // Get or create session
  let sid = sessionId
  if (!sid) {
    // Get user's org info
    const { data: org } = await db.from('organizations').select('id,name').eq('user_id', user.id).limit(1).maybeSingle()
    const { data: sub } = org ? await db.from('subscriptions').select('plan').eq('organization_id', org.id).eq('is_active', true).maybeSingle() : { data: null }

    const { data: session } = await sdb.from('support_sessions').insert({
      user_id: user.id,
      user_email: user.email,
      org_name: org?.name || null,
      org_id: org?.id || null,
      plan: sub?.plan || 'free',
    }).select('id').single()
    sid = session?.id
  }

  // Save user message
  if (sid) {
    await sdb.from('support_messages').insert({ session_id: sid, role: 'user', content: message })
  }

  // Load last 10 messages for context
  const history: { role: 'user' | 'assistant'; content: string }[] = []
  if (sid) {
    const { data: msgs } = await sdb
      .from('support_messages')
      .select('role,content')
      .eq('session_id', sid)
      .order('created_at', { ascending: false })
      .limit(10)
    if (msgs) history.push(...msgs.reverse() as { role: 'user' | 'assistant'; content: string }[])
  } else {
    history.push({ role: 'user', content: message })
  }

  // Stream AI response
  const encoder = new TextEncoder()
  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      // First chunk: send sessionId
      controller.enqueue(encoder.encode(`__SESSION__${sid}__SESSION__`))
      try {
        const stream = await ai.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: history,
          stream: true,
        })
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullResponse += event.delta.text
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch {
        controller.enqueue(encoder.encode('Uzr, xatolik yuz berdi. Qayta urinib ko\'ring.'))
      } finally {
        // Save assistant response
        if (sid && fullResponse) {
          await sdb.from('support_messages').insert({ session_id: sid, role: 'assistant', content: fullResponse })
          await sdb.from('support_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sid)
        }
        controller.close()
      }
    },
  })

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
