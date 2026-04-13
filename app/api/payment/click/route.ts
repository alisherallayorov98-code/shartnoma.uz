import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

// Click payment system webhook handler
// Docs: https://docs.click.uz/

const CLICK_SECRET = process.env.CLICK_SECRET_KEY || ''
const PLANS: Record<string, { months: number; plan: string }> = {
  standard_1m:  { months: 1,  plan: 'standard' },
  standard_3m:  { months: 3,  plan: 'standard' },
  standard_12m: { months: 12, plan: 'standard' },
  pro_1m:       { months: 1,  plan: 'pro' },
  pro_3m:       { months: 3,  plan: 'pro' },
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Click sends: click_trans_id, service_id, click_paydoc_id, merchant_trans_id,
//              amount, action, error, error_note, sign_time, sign_string
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    click_trans_id,
    service_id,
    merchant_trans_id,    // format: "orgId:planKey"
    amount,
    action,               // 0=prepare, 1=complete
    error,
    sign_time,
    sign_string,
  } = body

  // Verify signature
  const expectedSign = createHash('md5')
    .update(`${click_trans_id}${service_id}${CLICK_SECRET}${merchant_trans_id}${amount}${action}${sign_time}`)
    .digest('hex')

  if (sign_string !== expectedSign) {
    return NextResponse.json({ error: -1, error_note: 'Invalid sign' })
  }

  // Parse merchant_trans_id
  const [orgId, planKey] = (merchant_trans_id as string).split(':')
  const planInfo = PLANS[planKey]

  if (!orgId || !planInfo) {
    return NextResponse.json({ error: -5, error_note: 'Invalid merchant_trans_id' })
  }

  const db = getDb()

  // Action 0: Prepare — validate before charging
  if (action === 0) {
    const { data: org } = await db.from('organizations').select('id').eq('id', orgId).single()
    if (!org) return NextResponse.json({ error: -5, error_note: 'Organization not found' })
    return NextResponse.json({
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id: orgId,
      error: 0,
      error_note: 'Success',
    })
  }

  // Action 1: Complete — payment confirmed, activate subscription
  if (action === 1 && error === 0) {
    // Idempotency: skip if this transaction was already processed
    const { data: existingPayment } = await db.from('payments')
      .select('id').like('note', `%Click txn ${click_trans_id}%`).maybeSingle()
    if (existingPayment) {
      return NextResponse.json({ click_trans_id, merchant_trans_id, merchant_confirm_id: click_trans_id, error: 0, error_note: 'Already processed' })
    }
    const now = new Date()

    // Safe month addition: avoids Jan 31 + 1 month → Feb 31 rollover bug
    function addMonths(d: Date, m: number): Date {
      return new Date(d.getFullYear(), d.getMonth() + m, d.getDate())
    }

    // Upsert subscription
    const { data: existing } = await db.from('subscriptions')
      .select('id, period_end')
      .eq('organization_id', orgId)
      .single()

    if (existing) {
      const currentEnd = new Date(existing.period_end)
      const base = currentEnd > now ? currentEnd : now
      await db.from('subscriptions').update({
        plan: planInfo.plan,
        period_end: addMonths(base, planInfo.months).toISOString(),
        is_active: true,
        // contracts_used is NOT reset — only resets at billing period boundary
      }).eq('id', existing.id)
    } else {
      await db.from('subscriptions').insert({
        organization_id: orgId,
        plan: planInfo.plan,
        period_end: addMonths(now, planInfo.months).toISOString(),
        is_active: true,
        contracts_used: 0,
      })
    }

    // Log payment
    await db.from('payments').insert({
      organization_id: orgId,
      amount: Number(amount),
      currency: 'UZS',
      plan: planKey,
      note: `Click txn ${click_trans_id}`,
    }).select()

    return NextResponse.json({
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: click_trans_id,
      error: 0,
      error_note: 'Success',
    })
  }

  return NextResponse.json({ error: 0, error_note: 'Success' })
}
