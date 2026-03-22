import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendContractSigned } from '@/lib/email'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { user } } = await db.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contractId } = await req.json()
  if (!contractId) return NextResponse.json({ error: 'contractId required' }, { status: 400 })

  // Verify ownership + get contract details
  const { data: contract } = await db
    .from('contracts')
    .select('*, organizations(name, user_id), counterparties(name)')
    .eq('id', contractId)
    .eq('user_id', user.id)
    .single()

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!contract.signed_us || !contract.signed_cp) return NextResponse.json({ ok: false, reason: 'not_fully_signed' })

  try {
    await sendContractSigned({
      to: user.email!,
      orgName: contract.organizations?.name ?? '',
      contractNumber: contract.contract_number,
      contractType: contract.contract_type,
      counterpartyName: contract.counterparties?.name ?? 'Noma\'lum',
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, reason: 'email_failed' })
  }
}
