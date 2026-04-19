import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await sb.from('org_members')
    .update({ user_id: user.id, status: 'active' })
    .eq('invited_email', user.email.toLowerCase())
    .eq('status', 'pending')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
