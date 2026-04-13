import { NextRequest, NextResponse } from 'next/server'

const SOLIQ_API_KEY = process.env.SOLIQ_API_KEY || ''
const SOLIQ_API_URL = process.env.SOLIQ_API_URL || ''

// Per-user rate limit: max 20 req/min
const _stirRl = new Map<string, { n: number; reset: number }>()
function checkStirRate(userId: string): boolean {
  const now = Date.now()
  const e = _stirRl.get(userId)
  if (!e || now > e.reset) { _stirRl.set(userId, { n: 1, reset: now + 60_000 }); return true }
  if (e.n >= 20) return false
  e.n++; return true
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeCompany(raw: Record<string, any>) {
  const co   = (raw.company && typeof raw.company === 'object' ? raw.company : {}) as Record<string, any>
  const dir  = (raw.director && typeof raw.director === 'object' ? raw.director : {}) as Record<string, any>
  const acct = (raw.accountant && typeof raw.accountant === 'object' ? raw.accountant : {}) as Record<string, any>
  const addr = (raw.companyBillingAddress && typeof raw.companyBillingAddress === 'object'
    ? raw.companyBillingAddress : {}) as Record<string, any>

  const str = (v: unknown): string => (v != null && v !== '' ? String(v).trim() : '')

  // ── Manzil ──
  const region   = addr.region   as Record<string, any> | null
  const district = addr.district as Record<string, any> | null
  const parts = [
    str(region?.name_uz_latn || region?.name),
    str(district?.name_uz_latn || district?.name),
    str(addr.streetName || co.streetName),
  ].filter(Boolean)
  const address = parts.join(', ')

  // ── Rahbar ──
  const director_name = [str(dir.lastName), str(dir.firstName), str(dir.middleName)]
    .filter(Boolean).join(' ')

  // ── Bosh hisobchi ──
  const accountant_name = [str(acct.lastName), str(acct.firstName), str(acct.middleName)]
    .filter(Boolean).join(' ')

  // ── Status (statusDetail.group dan) ──
  const statusDetail = co.statusDetail as Record<string, any> | null
  const statusGroup = str(statusDetail?.group).toUpperCase()
  const status =
    statusGroup === 'ACTIVE' ? 'active' :
    statusGroup === 'INACTIVE' || statusGroup === 'LIQUIDATED' ? 'inactive' :
    statusGroup ? 'unknown' : ''
  const status_text = str(statusDetail?.name_uz_latn) || str(statusDetail?.name_ru)

  // ── OKED ──
  const oked = str(co.oked)
  const okedDetail = co.okedDetail as Record<string, any> | null
  const oked_name = str(okedDetail?.name_short_uz_latn) || str(okedDetail?.name)

  // ── OPF (tashkilot shakli) ──
  const opfDetail = co.opfDetail as Record<string, any> | null
  const opf_name = str(opfDetail?.name_uz_latn) || str(opfDetail?.name_ru)

  // ── Soliq rejimi ──
  const taxMode = co.taxMode
  const tax_mode = taxMode === 0 ? 'umumiy' : taxMode === 1 ? 'soddlashtirilgan' : taxMode === 2 ? 'yagona' : ''

  // ── Biznes tuzilmasi ──
  const bsDetail = co.businessStructureDetail as Record<string, any> | null
  const business_structure = str(bsDetail?.name_uz_latn) || str(bsDetail?.name_ru)

  // ── Xodimlar limiti ──
  const employee_limit_small = okedDetail?.employee_limit_mf ?? null
  const employee_limit_large = okedDetail?.employee_limit_lf ?? null

  return {
    // Asosiy
    name:             str(co.shortName) || str(co.name),
    full_name:        str(co.name),
    inn:              str(co.tin),
    director_name,
    accountant_name,
    address,
    postcode:         str(addr.postcode),

    // Bank (API bermaydi)
    bank_name:     '',
    bank_account:  '',
    mfo:           '',
    phone:         '',

    // Soliq
    qqsreg:           str(co.vatNumber),
    status,
    status_text,
    oked,
    oked_name,
    reg_date:         str(co.registrationDate),
    reg_number:       str(co.registrationNumber),

    // Tashkilot shakli
    opf_name,
    business_structure,
    tax_mode,

    // Moliya
    ustav_capital:    co.businessFund ?? null,
    taxpayer_type:    co.taxpayerType ?? null,

    // Xodimlar limiti
    employee_limit_small,
    employee_limit_large,

    // Klassifikatorlar
    soato:            co.soato ?? null,
    soogu:            str(co.soogu),
  }
}

export async function GET(req: NextRequest) {
  // Auth is enforced by middleware (cookie-based session)
  // Rate limit by IP (no userId available without token)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkStirRate(ip)) {
    return NextResponse.json({ error: "Juda ko'p so'rov, 1 daqiqa kuting" }, { status: 429 })
  }

  const stir = req.nextUrl.searchParams.get('stir')?.trim()

  if (!stir) {
    return NextResponse.json({ error: "STIR raqami kiritilmagan" }, { status: 400 })
  }
  if (!/^\d{9}$/.test(stir)) {
    return NextResponse.json({ error: "STIR 9 raqamdan iborat bo'lishi kerak" }, { status: 400 })
  }
  if (!SOLIQ_API_KEY || !SOLIQ_API_URL) {
    return NextResponse.json({ error: "Soliq API sozlanmagan" }, { status: 500 })
  }

  const url = SOLIQ_API_URL.replace('%s', stir) + '?type=full'

  try {
    const res = await fetch(url, {
      headers: {
        'X-API-KEY':    SOLIQ_API_KEY,
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      if (res.status === 404) {
        return NextResponse.json({ error: "Bu STIR raqami bo'yicha tashkilot topilmadi" }, { status: 404 })
      }
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ error: "API kaliti noto'g'ri yoki muddati o'tgan" }, { status: 401 })
      }
      return NextResponse.json({ error: `Soliq API xatoligi: ${res.status} ${errText}` }, { status: 502 })
    }

    const raw: Record<string, unknown> = await res.json()
    const company = normalizeCompany(raw)

    return NextResponse.json({ company })

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Noma'lum xatolik"
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: "Soliq API javob bermadi (timeout)" }, { status: 504 })
    }
    return NextResponse.json({ error: `Ulanish xatoligi: ${msg}` }, { status: 503 })
  }
}
