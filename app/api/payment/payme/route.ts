import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Payme (PaycomBusiness) JSON-RPC webhook handler
// Docs: https://developer.help.paycom.uz/

const PAYME_KEY = process.env.PAYME_SECRET_KEY || ''
const PLANS: Record<string, { months: number; plan: string }> = {
  standard_1m:  { months: 1,  plan: 'standard' },
  standard_3m:  { months: 3,  plan: 'standard' },
  standard_12m: { months: 12, plan: 'standard' },
  pro_1m:       { months: 1,  plan: 'pro' },
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function err(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message: { uz: message, ru: message, en: message } } })
}

function ok(id: unknown, result: Record<string, unknown>) {
  return NextResponse.json({ jsonrpc: '2.0', id, result })
}

export async function POST(req: NextRequest) {
  // Verify Basic auth
  const auth = req.headers.get('Authorization') || ''
  const expected = `Basic ${Buffer.from(`Paycom:${PAYME_KEY}`).toString('base64')}`
  if (auth !== expected) return err(null, -32504, 'Unauthorized')

  const { id, method, params } = await req.json()
  const db = getDb()

  // account.account = "orgId:planKey"
  const accountStr: string = params?.account?.account || ''
  const [orgId, planKey] = accountStr.split(':')
  const planInfo = planKey ? PLANS[planKey] : null

  if (method === 'CheckPerformTransaction') {
    if (!orgId || !planInfo) return err(id, -31050, 'Invalid account')
    const { data: org } = await db.from('organizations').select('id').eq('id', orgId).single()
    if (!org) return err(id, -31050, 'Organization not found')
    return ok(id, { allow: true })
  }

  if (method === 'CreateTransaction') {
    if (!orgId || !planInfo) return err(id, -31050, 'Invalid account')
    const { data: org } = await db.from('organizations').select('id').eq('id', orgId).single()
    if (!org) return err(id, -31050, 'Organization not found')
    return ok(id, {
      create_time: Date.now(),
      transaction: params.id,
      state: 1,
    })
  }

  if (method === 'PerformTransaction') {
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + (planInfo?.months ?? 1))

    const { data: existing } = await db.from('subscriptions')
      .select('id, period_end').eq('organization_id', orgId).single()

    if (existing) {
      const base = new Date(existing.period_end) > new Date() ? new Date(existing.period_end) : new Date()
      base.setMonth(base.getMonth() + (planInfo?.months ?? 1))
      await db.from('subscriptions').update({
        plan: planInfo?.plan ?? 'standard',
        period_end: base.toISOString(),
        is_active: true,
        contracts_used: 0,
      }).eq('id', existing.id)
    } else {
      await db.from('subscriptions').insert({
        organization_id: orgId,
        plan: planInfo?.plan ?? 'standard',
        period_end: periodEnd.toISOString(),
        is_active: true,
        contracts_used: 0,
      })
    }

    await db.from('payments').insert({
      organization_id: orgId,
      amount: Math.round((params.amount ?? 0) / 100),
      currency: 'UZS',
      plan: planKey,
      note: `Payme txn ${params.id}`,
    })

    return ok(id, {
      transaction: params.id,
      perform_time: Date.now(),
      state: 2,
    })
  }

  if (method === 'CancelTransaction') {
    return ok(id, {
      transaction: params.id,
      cancel_time: Date.now(),
      state: -1,
    })
  }

  if (method === 'CheckTransaction') {
    return ok(id, {
      create_time: Date.now(),
      perform_time: 0,
      cancel_time: 0,
      transaction: params.id,
      state: 1,
      reason: null,
    })
  }

  return err(id, -32601, 'Method not found')
}
