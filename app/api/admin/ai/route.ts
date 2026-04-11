import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return false
  const db = getAdminDb()
  const { data: { user } } = await db.auth.getUser(token)
  if (!user) return false
  const { data } = await db.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (data) return true
  const fallbackEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  return fallbackEmails.includes(user.email ?? '')
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 })
  }

  const { messages } = await req.json()
  const db = getAdminDb()
  const now = new Date()
  const d7 = new Date(now.getTime() - 7  * 86400000).toISOString()
  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString()

  // Fetch platform data in parallel
  const [
    { data: orgs },
    { data: subs },
    { data: contracts },
    { data: payments },
    { data: feedbacks },
    { data: templates },
    { data: demos },
  ] = await Promise.all([
    db.from('organizations').select('id,name,inn,created_at,user_email,admin_note').order('created_at', { ascending: false }).limit(300),
    db.from('subscriptions').select('*'),
    db.from('contracts').select('organization_id,created_at,status,amount,contract_type').order('created_at', { ascending: false }).limit(1000),
    db.from('payments').select('amount,plan,created_at,organizations(name,inn)').order('created_at', { ascending: false }).limit(200),
    db.from('feedback').select('category,title,message,status,created_at').order('created_at', { ascending: false }).limit(100),
    db.from('custom_templates').select('name,type,created_at,organization_id').limit(200),
    db.from('demo_access').select('organization_id,expires_at,is_active').eq('is_active', true),
  ])

  // Compute stats
  const totalOrgs     = orgs?.length || 0
  const newOrgs7d     = orgs?.filter(o => o.created_at > d7).length || 0
  const newOrgs30d    = orgs?.filter(o => o.created_at > d30).length || 0
  const paidSubs      = subs?.filter(s => s.plan !== 'free' && s.is_active).length || 0
  const freeSubs      = subs?.filter(s => s.plan === 'free').length || 0
  const totalContracts = contracts?.length || 0
  const contracts7d   = contracts?.filter(c => c.created_at > d7).length || 0
  const contracts30d  = contracts?.filter(c => c.created_at > d30).length || 0
  const activeContracts = contracts?.filter(c => c.status === 'active').length || 0
  const totalRevenue  = payments?.reduce((s, p) => s + (p.amount || 0), 0) || 0
  const revenue30d    = payments?.filter(p => p.created_at > d30).reduce((s, p) => s + (p.amount || 0), 0) || 0
  const revenue7d     = payments?.filter(p => p.created_at > d7).reduce((s, p) => s + (p.amount || 0), 0) || 0
  const openFeedbacks = feedbacks?.filter(f => f.status === 'open' || f.status === 'new').length || 0
  const demoCount     = demos?.length || 0

  // Churn risk: paid subs expiring in ≤14 days
  const churnList = (subs || [])
    .filter(s => s.plan !== 'free' && s.is_active && s.period_end)
    .map(s => {
      const org = orgs?.find(o => o.id === s.organization_id)
      const daysLeft = Math.ceil((new Date(s.period_end).getTime() - now.getTime()) / 86400000)
      return { name: org?.name || '—', inn: org?.inn || '', plan: s.plan, daysLeft, email: org?.user_email || '', contracts: contracts?.filter(c => c.organization_id === s.organization_id).length || 0 }
    })
    .filter(c => c.daysLeft >= 0 && c.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  // Top active orgs by contract count
  const orgContractCount: Record<string, number> = {}
  for (const c of (contracts || [])) orgContractCount[c.organization_id] = (orgContractCount[c.organization_id] || 0) + 1
  const topOrgs = Object.entries(orgContractCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, cnt]) => { const o = orgs?.find(x => x.id === id); return { name: o?.name || '—', cnt } })

  // Plan distribution
  const planDist: Record<string, number> = {}
  for (const s of (subs || [])) planDist[s.plan] = (planDist[s.plan] || 0) + 1

  // Recent feedback titles
  const recentFb = (feedbacks || []).slice(0, 10).map(f => `[${f.category}] ${f.title || f.message?.slice(0, 60)}`)

  const systemPrompt = `Sen Kabinetim.uz — O'zbekistonning onlayn hujjat boshqaruv platformasi (shartnomalar, E-IMZO, AI yurist, buxgalteriya) — ning AQLLI ADMIN YORDAMCHISISISAN.

═══ PLATFORMA STATISTIKASI (${now.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}) ═══

👥 FOYDALANUVCHILAR:
• Jami tashkilotlar: ${totalOrgs}
• Yangi (7 kun): +${newOrgs7d} | Yangi (30 kun): +${newOrgs30d}
• Pullik obunalar: ${paidSubs} | Bepul: ${freeSubs}
• Demo rejimida: ${demoCount}

📄 SHARTNOMALAR:
• Jami: ${totalContracts}
• 7 kunda: +${contracts7d} | 30 kunda: +${contracts30d}
• Faol: ${activeContracts}
• Foydalanuvchi shablonlari: ${templates?.length || 0}

💰 DAROMAD:
• Jami: ${totalRevenue.toLocaleString()} so'm
• 30 kunda: ${revenue30d.toLocaleString()} so'm
• 7 kunda: ${revenue7d.toLocaleString()} so'm

📊 OBUNA TAQSIMOTI:
${Object.entries(planDist).map(([p, n]) => `• ${p}: ${n} ta`).join('\n')}

⚠️ CHURN RISK (14 kun ichida tugaydi — ${churnList.length} ta):
${churnList.length > 0 ? churnList.map(c => `• ${c.name} | ${c.plan} | ${c.daysLeft} kun | ${c.contracts} shartnoma | ${c.email}`).join('\n') : '• Hozircha yo\'q'}

🏆 TOP TASHKILOTLAR (shartnoma bo'yicha):
${topOrgs.map((o, i) => `${i + 1}. ${o.name} — ${o.cnt} ta`).join('\n')}

💬 FEEDBACKLAR:
• Ochiq/yangi: ${openFeedbacks} | Jami: ${feedbacks?.length || 0}
• So'nggi: ${recentFb.slice(0, 5).join(' | ')}

═══════════════════════════════════════

Qoidalar:
- Javoblar o'zbek tilida, qisqa va aniq
- Muhim raqamlarni **qalin** qilib ko'rsat
- Muammolarni aniqlab, konkret tavsiyalar ber
- Churn risk bo'yicha savolda batafsil tahlil ber
- Daromad o'sishi/pasayishi haqida fikr bildirgin`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          system: systemPrompt,
          messages: messages,
          stream: true,
        })
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch {
        controller.enqueue(encoder.encode('\n[Xatolik yuz berdi. Qayta urinib ko\'ring.]'))
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
