import { NextRequest, NextResponse } from 'next/server'

const SOLIQ_API_KEY = process.env.SOLIQ_API_KEY || ''
const SOLIQ_API_URL = process.env.SOLIQ_API_URL || ''

export type StirFounder = { full_name: string; ulush: number }

// Ta'sischilarni API javobidan ajratib olish.
function extractFounders(raw: Record<string, unknown>): StirFounder[] | null {
  const str = (v: unknown) => (v != null && v !== '' ? String(v).trim() : '')
  const co = (raw.company ?? {}) as Record<string, unknown>

  // Known field name candidates (expanded)
  const candidates = [
    raw.founders,
    raw.participants,
    raw.shareholders,
    raw.owners,
    raw.members,
    raw.companyMembers,
    raw.capital_members,
    raw.tasischilar,
    raw.uchredители,
    raw.uchreditel,
    co.founders,
    co.participants,
    co.members,
    co.companyMembers,
    co.shareholders,
    co.owners,
    co.tasischilar,
    co.capital_members,
  ]

  function tryMapList(list: unknown[]): StirFounder[] {
    return list
      .map((item: unknown) => {
        const rec = item as Record<string, unknown>
        const full_name =
          [str(rec.lastName), str(rec.firstName), str(rec.middleName)]
            .filter(Boolean)
            .join(' ') ||
          str(rec.fullName) ||
          str(rec.full_name) ||
          str(rec.name) ||
          str(rec.fio) ||
          str(rec.FIO) ||
          str(rec.title)
        const ulush =
          parseFloat(
            String(rec.percent ?? rec.share ?? rec.sharePercent ?? rec.shareSize ??
                   rec.ulush ?? rec.dol ?? rec.participation ?? 0)
          ) || 0
        return { full_name, ulush }
      })
      .filter((f) => f.full_name)
  }

  for (const list of candidates) {
    if (!Array.isArray(list) || list.length === 0) continue
    const mapped = tryMapList(list)
    if (mapped.length > 0) return mapped
  }

  // Smart fallback: scan ALL array fields in raw and raw.company
  // looking for any that contain objects with name-like properties
  function scanObject(obj: Record<string, unknown>): StirFounder[] | null {
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      if (!Array.isArray(val) || val.length === 0) continue
      if (typeof val[0] !== 'object' || val[0] === null) continue
      const mapped = tryMapList(val)
      if (mapped.length > 0) return mapped
    }
    return null
  }

  const fromRaw = scanObject(raw)
  if (fromRaw) return fromRaw

  const fromCo = scanObject(co)
  if (fromCo) return fromCo

  return null
}

function extractUstavKapital(raw: Record<string, unknown>): string {
  const co = (raw.company ?? {}) as Record<string, unknown>
  const val =
    co.businessFund ??
    co.authorizedCapital ??
    co.ustavCapital ??
    co.charterCapital ??
    raw.authorizedCapital ??
    raw.ustavCapital ??
    raw.businessFund
  return val != null ? String(val) : ''
}

export async function GET(req: NextRequest) {
  const stir = req.nextUrl.searchParams.get('stir')?.trim()

  if (!stir || !/^\d{9}$/.test(stir)) {
    return NextResponse.json({ error: "STIR 9 raqamdan iborat bo'lishi kerak" }, { status: 400 })
  }

  if (!SOLIQ_API_KEY || !SOLIQ_API_URL) {
    return NextResponse.json({ notReady: true })
  }

  const url = SOLIQ_API_URL.replace('%s', stir) + '?type=full'

  try {
    const res = await fetch(url, {
      headers: {
        'X-API-KEY': SOLIQ_API_KEY,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "Bu STIR bo'yicha tashkilot topilmadi" }, { status: 404 })
      }
      return NextResponse.json({ error: `Soliq API: ${res.status}` }, { status: 502 })
    }

    const raw: Record<string, unknown> = await res.json()
    const founders = extractFounders(raw)
    const ustav_kapital = extractUstavKapital(raw)

    // Debug: raw keys ko'rish uchun ?debug=true
    if (req.nextUrl.searchParams.get('debug') === 'true') {
      const co = (raw.company ?? {}) as Record<string, unknown>
      return NextResponse.json({
        founders,
        ustav_kapital,
        _debug: {
          raw_keys: Object.keys(raw),
          company_keys: Object.keys(co),
          raw,
        },
      })
    }

    return NextResponse.json({ founders, ustav_kapital })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Noma'lum xatolik"
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: 'Soliq API javob bermadi (timeout)' }, { status: 504 })
    }
    return NextResponse.json({ error: `Ulanish xatoligi: ${msg}` }, { status: 503 })
  }
}
