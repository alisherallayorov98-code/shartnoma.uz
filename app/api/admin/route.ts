import { NextRequest, NextResponse } from 'next/server'
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
  return !!data
}

export async function HEAD(req: NextRequest) {
  const ok = await verifyAdmin(req)
  return new NextResponse(null, { status: ok ? 200 : 403 })
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }

  const adminDb = getAdminDb()
  const [
    { data: orgs },
    { data: subs },
    { data: demos },
    { data: contracts },
    { data: payments },
    { data: { users } },
  ] = await Promise.all([
    adminDb.from('organizations').select('*').order('created_at', { ascending: false }),
    adminDb.from('subscriptions').select('*'),
    adminDb.from('demo_access').select('*').eq('is_active', true).gt('expires_at', new Date().toISOString()),
    adminDb.from('contracts').select('organization_id, created_at').order('created_at', { ascending: false }),
    adminDb.from('payments').select('*, organizations(name, inn)').order('created_at', { ascending: false }),
    adminDb.auth.admin.listUsers({ perPage: 1000 }),
  ])

  const emailMap: Record<string, string> = {}
  const lastLoginMap: Record<string, string> = {}
  for (const u of (users || [])) {
    emailMap[u.id] = u.email || ''
    lastLoginMap[u.id] = u.last_sign_in_at || u.created_at || ''
  }

  // Last contract per org
  const lastContractMap: Record<string, string> = {}
  for (const c of (contracts || [])) {
    if (!lastContractMap[c.organization_id]) lastContractMap[c.organization_id] = c.created_at
  }

  const orgsWithMeta = (orgs || []).map((o: any) => ({
    ...o,
    user_email: emailMap[o.user_id] || '',
    last_login: lastLoginMap[o.user_id] || '',
    last_contract: lastContractMap[o.id] || '',
  }))

  // New users — last 30 days
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const newUsers = (users || [])
    .filter((u: any) => u.created_at > since30)
    .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))
    .map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }))

  return NextResponse.json({ orgs: orgsWithMeta, subs, demos, contracts, payments, newUsers })
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin(req)) {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })
  }

  const adminDb = getAdminDb()
  const body = await req.json()
  const { action } = body

  if (action === 'upsert_sub') {
    const { org_id, user_id, sub_id, plan, period_end, is_active } = body
    if (sub_id) {
      // Boshqa barcha aktiv obunalarni o'chirish
      await adminDb.from('subscriptions').update({ is_active: false }).eq('organization_id', org_id).neq('id', sub_id)
      await adminDb.from('subscriptions').update({ plan, period_end, is_active, contracts_used: 0 }).eq('id', sub_id)
    } else {
      // Mavjud barcha obunalarni o'chirish, keyin yangi qo'shish
      await adminDb.from('subscriptions').update({ is_active: false }).eq('organization_id', org_id)
      await adminDb.from('subscriptions').insert({ organization_id: org_id, user_id, plan, contracts_used: 0, period_end, is_active })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'deactivate_sub') {
    await adminDb.from('subscriptions').update({ is_active: false }).eq('id', body.sub_id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'add_demo') {
    const expires_at = new Date(Date.now() + Number(body.days) * 24 * 60 * 60 * 1000).toISOString()
    await adminDb.from('demo_access').update({ is_active: false }).eq('organization_id', body.org_id)
    await adminDb.from('demo_access').insert({ organization_id: body.org_id, expires_at, note: body.note, is_active: true })
    return NextResponse.json({ ok: true })
  }

  if (action === 'deactivate_demo') {
    await adminDb.from('demo_access').update({ is_active: false }).eq('id', body.demo_id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'load_demos') {
    const { data } = await adminDb.from('demo_access')
      .select('*, organizations(name, inn)')
      .order('created_at', { ascending: false })
    return NextResponse.json({ demos: data })
  }

  if (action === 'add_payment') {
    const { org_id, amount, plan, note } = body
    const { error } = await adminDb.from('payments').insert({ organization_id: org_id, amount, plan, note })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update_note') {
    const { org_id, note } = body
    await adminDb.from('organizations').update({ admin_note: note }).eq('id', org_id)
    return NextResponse.json({ ok: true })
  }

  // ── SYSTEM SETTINGS ──
  if (action === 'get_settings') {
    const { data } = await adminDb.from('system_settings').select('key, value')
    const settings: Record<string, string> = {}
    for (const row of (data || [])) settings[row.key] = row.value
    return NextResponse.json({ settings })
  }

  if (action === 'save_setting') {
    const { key, value } = body
    await adminDb.from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    return NextResponse.json({ ok: true })
  }

  // ── SYSTEM TEMPLATES ──
  if (action === 'get_system_templates') {
    const { data } = await adminDb.from('system_templates')
      .select('id, type, language, name, content, updated_at')
      .order('type')
    return NextResponse.json({ templates: data || [] })
  }

  if (action === 'save_template') {
    const { type, language, name, content } = body
    const { error } = await adminDb.from('system_templates')
      .upsert({ type, language, name, content, updated_at: new Date().toISOString() }, { onConflict: 'type,language' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_template') {
    await adminDb.from('system_templates').delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  // ── SITE CONTENT ──
  if (action === 'get_site_content') {
    const { data } = await adminDb.from('site_content')
      .select('id, key, label, type, value, file_url, updated_at')
      .order('key')
    return NextResponse.json({ content: data || [] })
  }

  if (action === 'save_content') {
    const { key, label, type, value, file_url } = body
    const { error } = await adminDb.from('site_content')
      .upsert({ key, label, type, value: value || '', file_url: file_url || null, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete_content') {
    await adminDb.from('site_content').delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  // ── ALL CONTRACTS (monitoring) ──
  if (action === 'get_all_contracts') {
    const { data } = await adminDb.from('contracts')
      .select('id, contract_number, contract_type, status, amount, contract_date, created_at, organization_id, organizations(name, inn)')
      .order('created_at', { ascending: false })
      .limit(500)
    return NextResponse.json({ contracts: data || [] })
  }

  // ── USER TEMPLATES (custom_templates) ──
  if (action === 'get_user_templates') {
    const { data } = await adminDb.from('custom_templates')
      .select('id, organization_id, type, name, description, content, organizations(name)')
      .order('created_at', { ascending: false })
      .limit(200)
    return NextResponse.json({ templates: data || [] })
  }

  return NextResponse.json({ error: 'Noma\'lum action' }, { status: 400 })
}
