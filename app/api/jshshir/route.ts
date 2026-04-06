import { NextRequest, NextResponse } from 'next/server'

const SOLIQ_API_KEY = process.env.SOLIQ_API_KEY || ''
const SOLIQ_API_URL = process.env.SOLIQ_API_URL || ''

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizePerson(raw: Record<string, any>) {
  const str = (v: unknown): string => (v != null && v !== '' ? String(v).trim() : '')

  // Soliq API jismoniy shaxs uchun ham company wrapperi bilan qaytarishi mumkin
  const co = (raw.company && typeof raw.company === 'object' ? raw.company : {}) as Record<string, any>
  const dir = (raw.director && typeof raw.director === 'object' ? raw.director : {}) as Record<string, any>

  // Jismoniy shaxs — director bo'limi asosiy shaxs bo'ladi
  const full_name = [str(dir.lastName), str(dir.firstName), str(dir.middleName)]
    .filter(Boolean).join(' ') || str(co.shortName) || str(co.name)

  // Manzil
  const addr = (raw.companyBillingAddress && typeof raw.companyBillingAddress === 'object'
    ? raw.companyBillingAddress : {}) as Record<string, any>
  const region = addr.region as Record<string, any> | null
  const district = addr.district as Record<string, any> | null
  const parts = [
    str(region?.name_uz_latn || region?.name),
    str(district?.name_uz_latn || district?.name),
    str(addr.streetName || co.streetName),
  ].filter(Boolean)
  const address = parts.join(', ')

  // Status
  const statusDetail = co.statusDetail as Record<string, any> | null
  const statusGroup = str(statusDetail?.group).toUpperCase()
  const status =
    statusGroup === 'ACTIVE' ? 'active' :
    statusGroup === 'INACTIVE' || statusGroup === 'LIQUIDATED' ? 'inactive' :
    statusGroup ? 'unknown' : ''

  // PINFL
  const pinfl = str(co.tin) || str(dir.tin)

  return {
    full_name,
    pinfl,
    address,
    status,
    inn: str(co.tin),
    oked: str(co.oked),
    reg_date: str(co.registrationDate),
  }
}

export async function GET(req: NextRequest) {
  const jshshir = req.nextUrl.searchParams.get('jshshir')?.trim()

  if (!jshshir) {
    return NextResponse.json({ error: "JSHSHIR raqami kiritilmagan" }, { status: 400 })
  }
  if (!/^\d{14}$/.test(jshshir)) {
    return NextResponse.json({ error: "JSHSHIR 14 raqamdan iborat bo'lishi kerak" }, { status: 400 })
  }
  if (!SOLIQ_API_KEY || !SOLIQ_API_URL) {
    return NextResponse.json({ error: "Soliq API sozlanmagan" }, { status: 500 })
  }

  const url = SOLIQ_API_URL.replace('%s', jshshir) + '?type=full'

  try {
    const res = await fetch(url, {
      headers: {
        'X-API-KEY': SOLIQ_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "Bu JSHSHIR bo'yicha ma'lumot topilmadi" }, { status: 404 })
      }
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ error: "API kaliti noto'g'ri yoki muddati o'tgan" }, { status: 401 })
      }
      const errText = await res.text().catch(() => '')
      return NextResponse.json({ error: `Soliq API xatoligi: ${res.status} ${errText}` }, { status: 502 })
    }

    const raw: Record<string, unknown> = await res.json()
    const person = normalizePerson(raw)

    return NextResponse.json({ person })

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Noma'lum xatolik"
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: "Soliq API javob bermadi (timeout)" }, { status: 504 })
    }
    return NextResponse.json({ error: `Ulanish xatoligi: ${msg}` }, { status: 503 })
  }
}
