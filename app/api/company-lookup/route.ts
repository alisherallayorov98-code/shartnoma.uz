import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const inn = req.nextUrl.searchParams.get('inn')?.trim().replace(/\D/g, '')

  if (!inn || !/^\d{9}$/.test(inn)) {
    return NextResponse.json({ error: "INN 9 raqamdan iborat bo'lishi kerak" }, { status: 400 })
  }

  const db = getDb()

  // 1. Global bazadan qidirish
  const { data: cached } = await db
    .from('global_companies')
    .select('*')
    .eq('inn', inn)
    .maybeSingle()

  if (cached) {
    return NextResponse.json({
      source: 'global_db',
      company: {
        name:        cached.name,
        inn:         cached.inn,
        director:    cached.director    || '',
        address:     cached.address     || '',
        mfo:         cached.mfo         || '',
        bank_name:   cached.bank_name   || '',
        account:     cached.account     || '',
        phone:       cached.phone       || '',
      },
    })
  }

  // 2. Soliq API dan qidirish
  const soliqUrl = process.env.SOLIQ_API_URL?.replace('%s', inn)
  const soliqKey = process.env.SOLIQ_API_KEY

  if (!soliqUrl || !soliqKey) {
    return NextResponse.json({ error: "Bu STIR bo'yicha ma'lumot topilmadi" }, { status: 404 })
  }

  try {
    const res = await fetch(soliqUrl + '?type=full', {
      headers: { 'X-API-KEY': soliqKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      if (res.status === 404) return NextResponse.json({ error: "Bu STIR raqami bo'yicha tashkilot topilmadi" }, { status: 404 })
      return NextResponse.json({ error: `Soliq API xatoligi: ${res.status}` }, { status: 502 })
    }

    const raw = await res.json()
    const co   = raw.company   || {}
    const dir  = raw.director  || {}
    const addr = raw.companyBillingAddress || {}

    const str = (v: unknown) => v != null && v !== '' ? String(v).trim() : ''

    const region   = addr.region   || {}
    const district = addr.district || {}
    const addressParts = [
      str(region.name_uz_latn   || region.name),
      str(district.name_uz_latn || district.name),
      str(addr.streetName || co.streetName),
    ].filter(Boolean)

    const director = [str(dir.lastName), str(dir.firstName), str(dir.middleName)].filter(Boolean).join(' ')
    const name     = str(co.shortName) || str(co.name)
    const address  = addressParts.join(', ')

    // 3. Global bazaga saqlab qo'yish (mfo/account yo'q, keyinchalik to'ldiriladi)
    await db.from('global_companies').upsert({
      inn,
      name,
      director,
      address,
      source: 'soliq_api',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'inn', ignoreDuplicates: false })

    return NextResponse.json({
      source: 'soliq_api',
      company: { name, inn, director, address, mfo: '', bank_name: '', account: '', phone: '' },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: 'Soliq API javob bermadi' }, { status: 504 })
    }
    return NextResponse.json({ error: "Ma'lumot olishda xatolik" }, { status: 503 })
  }
}

// Admin: global bazaga qo'shish yoki yangilash
export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!auth) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 })

  // Admin tekshiruvi
  const db = getDb()
  const { data: { user } } = await db.auth.getUser(auth)
  if (!user) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 })
  const { data: adminRow } = await db.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  const isAdmin = !!adminRow || (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).includes(user.email ?? '')
  if (!isAdmin) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })

  const body = await req.json()
  const { inn, name, director, address, mfo, bank_name, account, phone } = body

  if (!inn || !name) return NextResponse.json({ error: 'INN va nomi majburiy' }, { status: 400 })

  const { error } = await db.from('global_companies').upsert({
    inn: inn.trim(),
    name: name.trim(),
    director: director?.trim() || null,
    address:  address?.trim()  || null,
    mfo:      mfo?.trim()      || null,
    bank_name: bank_name?.trim() || null,
    account:  account?.trim()  || null,
    phone:    phone?.trim()    || null,
    source: 'manual',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'inn', ignoreDuplicates: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Admin: o'chirish
export async function DELETE(req: NextRequest) {
  const auth = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!auth) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 })

  const db = getDb()
  const { data: { user } } = await db.auth.getUser(auth)
  if (!user) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 401 })
  const { data: adminRow } = await db.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  const isAdmin = !!adminRow || (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).includes(user.email ?? '')
  if (!isAdmin) return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 })

  const inn = req.nextUrl.searchParams.get('inn')
  if (!inn) return NextResponse.json({ error: 'INN kerak' }, { status: 400 })

  await db.from('global_companies').delete().eq('inn', inn)
  return NextResponse.json({ ok: true })
}
