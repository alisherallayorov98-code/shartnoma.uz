import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSubscriptionReminder } from '@/lib/email'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const now = new Date().toISOString()
  const results = { expired: 0, demos_expired: 0, reminders_sent: 0, errors: [] as string[] }

  // 1. Muddati o'tgan obunalarni o'chirish
  const { data: expired } = await adminDb
    .from('subscriptions')
    .update({ is_active: false })
    .eq('is_active', true)
    .neq('plan', 'free')
    .lt('period_end', now)
    .select('organization_id')
  results.expired = expired?.length ?? 0

  // 2. Muddati o'tgan demo kirishlarni o'chirish
  const { data: expiredDemos } = await adminDb
    .from('demo_access')
    .update({ is_active: false })
    .eq('is_active', true)
    .lt('expires_at', now)
    .select('id')
  results.demos_expired = expiredDemos?.length ?? 0

  // 3. 1-5 kun ichida tugaydigan obunalar uchun email yuborish
  const in5days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()

  const { data: expiringSubs } = await adminDb
    .from('subscriptions')
    .select('id, organization_id, plan, period_end')
    .eq('is_active', true)
    .neq('plan', 'free')
    .gt('period_end', now)
    .lt('period_end', in5days)

  if (expiringSubs && expiringSubs.length > 0) {
    // Tashkilot va foydalanuvchi ma'lumotlarini olish
    const orgIds = expiringSubs.map((s: any) => s.organization_id)
    const { data: orgs } = await adminDb
      .from('organizations')
      .select('id, name, user_id')
      .in('id', orgIds)

    // Foydalanuvchi emaillarini olish
    const { data: { users } } = await adminDb.auth.admin.listUsers({ perPage: 1000 })
    const emailMap: Record<string, string> = {}
    for (const u of (users || [])) emailMap[u.id] = u.email || ''

    const orgMap: Record<string, { name: string; user_id: string }> = {}
    for (const o of (orgs || [])) orgMap[o.id] = { name: o.name, user_id: o.user_id }

    // Har bir tugayotgan obuna uchun email yuborish
    for (const sub of expiringSubs) {
      const org = orgMap[sub.organization_id]
      if (!org) continue
      const email = emailMap[org.user_id]
      if (!email) continue

      const daysLeft = Math.ceil(
        (new Date(sub.period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      try {
        await sendSubscriptionReminder({
          to: email,
          orgName: org.name,
          daysLeft,
          periodEnd: sub.period_end,
        })
        results.reminders_sent++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        results.errors.push(`${email}: ${msg}`)
      }
    }
  }

  console.log(`[CRON] ${new Date().toISOString()}`, results)
  return NextResponse.json({ ok: true, ...results })
}
