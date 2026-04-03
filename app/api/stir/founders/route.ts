import { NextRequest, NextResponse } from 'next/server'

const SOLIQ_API_KEY = process.env.SOLIQ_API_KEY || ''
const SOLIQ_API_URL = process.env.SOLIQ_API_URL || ''

export type StirFounder = { full_name: string; ulush: number }

// Ta'sischilarni API javobidan ajratib olish.
// API to'liq ulangach shu yerga to'g'ri field path qo'shiladi.
function extractFounders(raw: Record<string, unknown>): StirFounder[] | null {
  const str = (v: unknown) => (v != null && v !== '' ? String(v).trim() : '')
  const co = (raw.company ?? {}) as Record<string, unknown>

  const candidates = [
    raw.founders,
    raw.participants,
    raw.shareholders,
    raw.owners,
    co.founders,
    co.participants,
  ]

  for (const list of candidates) {
    if (!Array.isArray(list) || list.length === 0) continue
    const mapped: StirFounder[] = list
      .map((item: Record<string, unknown>) => {
        const full_name =
          [str(item.lastName), str(item.firstName), str(item.middleName)]
            .filter(Boolean)
            .join(' ') ||
          str(item.name) ||
          str(item.fullName) ||
          str(item.full_name)
        const ulush =
          parseFloat(
            String(item.percent ?? item.share ?? item.sharePercent ?? item.ulush ?? 0)
          ) || 0
        return { full_name, ulush }
      })
      .filter((f) => f.full_name)
    if (mapped.length > 0) return mapped
  }
  return null
}

function extractUstavKapital(raw: Record<string, unknown>): string {
  const co = (raw.company ?? {}) as Record<string, unknown>
  const val =
    co.authorizedCapital ??
    co.ustavCapital ??
    co.charterCapital ??
    raw.authorizedCapital ??
    raw.ustavCapital
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

    return NextResponse.json({ founders, ustav_kapital })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Noma'lum xatolik"
    if (msg.includes('timeout') || msg.includes('abort')) {
      return NextResponse.json({ error: 'Soliq API javob bermadi (timeout)' }, { status: 504 })
    }
    return NextResponse.json({ error: `Ulanish xatoligi: ${msg}` }, { status: 503 })
  }
}
