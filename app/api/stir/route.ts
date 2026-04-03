import { NextRequest, NextResponse } from 'next/server'

const SOLIQ_API_KEY = process.env.SOLIQ_API_KEY || ''
const SOLIQ_API_URL = process.env.SOLIQ_API_URL || ''

// Soliq API javob strukturasi:
// { company: { tin, name, shortName, vatNumber, streetName, ... },
//   companyBillingAddress: { region, district, streetName },
//   director: { lastName, firstName, middleName } }
function normalizeCompany(raw: Record<string, unknown>) {
  const co  = (raw.company && typeof raw.company === 'object' ? raw.company : {}) as Record<string, unknown>
  const dir = (raw.director && typeof raw.director === 'object' ? raw.director : {}) as Record<string, unknown>
  const addr = (raw.companyBillingAddress && typeof raw.companyBillingAddress === 'object'
    ? raw.companyBillingAddress : {}) as Record<string, unknown>

  const str = (v: unknown): string => (v != null && v !== '' ? String(v).trim() : '')

  // To'liq manzil: shahar/viloyat + tuman + ko'cha
  const region   = addr.region   as Record<string, unknown> | null
  const district = addr.district as Record<string, unknown> | null
  const parts = [
    str(region?.name_uz_latn   || region?.name),
    str(district?.name_uz_latn || district?.name),
    str(addr.streetName || co.streetName),
  ].filter(Boolean)
  const address = parts.join(', ')

  // Rahbar ismi
  const director_name = [str(dir.lastName), str(dir.firstName), str(dir.middleName)]
    .filter(Boolean).join(' ')

  // Tashkilot holati: faol / tugatilgan / muallaq
  const rawStatus = str(co.statusOfActivity) || str(co.activityStatus) || str(co.state) || str(co.status)
  const statusLower = rawStatus.toLowerCase()
  const status =
    statusLower.includes('faol') || statusLower.includes('activ') || statusLower === '1' ? 'active' :
    statusLower.includes('tugatil') || statusLower.includes('likvid') || statusLower.includes('inactive') ? 'inactive' :
    rawStatus ? 'unknown' : ''

  const oked = str(co.oked) || str(co.industrialCode) || str(co.okedCode) || str(co.industryCode)
  const reg_date = str(co.registrationDate) || str(co.regDate) || str(co.stateRegistrationDate)

  return {
    name:          str(co.shortName) || str(co.name),
    full_name:     str(co.name),
    inn:           str(co.tin),
    director_name,
    address,
    bank_name:     '',  // Bu API da bank ma'lumotlari yo'q
    bank_account:  '',
    mfo:           '',
    phone:         '',
    qqsreg:        str(co.vatNumber),
    status,
    oked,
    reg_date,
  }
}

export async function GET(req: NextRequest) {
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

    if (!company.name) {
      return NextResponse.json({ company, raw }, { status: 200 })
    }

    return NextResponse.json({ company })

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Noma'lum xatolik"
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: "Soliq API javob bermadi (timeout)" }, { status: 504 })
    }
    return NextResponse.json({ error: `Ulanish xatoligi: ${msg}` }, { status: 503 })
  }
}
