/**
 * E-IMZO Desktop Client communication layer
 *
 * Tries multiple ports, hosts, protocols, and API paths
 * to find the running E-IMZO desktop client.
 *
 * Known E-IMZO client configurations:
 *  - Port 64646 (standard), 64443 (HTTPS variant)
 *  - Paths: /e-imzo/api/v1/... , /frontend/api/v1/... , /api/v1/...
 *  - Hosts: 127.0.0.1, localhost
 */

export interface EimzoCert {
  alias: string
  subjectName?: string
  serialNumber?: string
  validTo?: string
  validFrom?: string
  CN?: string
  O?: string
  TIN?: string
  name?: string
  // Some versions return different field names
  [key: string]: unknown
}

export interface EimzoConnection {
  type: 'rest'
  baseUrl: string
  listPath: string
  signPath: string
}

// ─── All possible base URLs ──────────────────────────────────────────────────

const BASE_URLS = [
  'http://127.0.0.1:64646',
  'https://127.0.0.1:64646',
  'http://localhost:64646',
  'https://localhost:64646',
  'http://127.0.0.1:64443',
  'https://127.0.0.1:64443',
]

// ─── All possible API paths for listing certificates ─────────────────────────

const LIST_PATHS = [
  '/e-imzo/api/v1/certificate/list',
  '/frontend/api/v1/certificate/list',
  '/api/v1/certificate/list',
  '/e-imzo/api/v1/keys',
  '/frontend/api/v1/keys',
]

// ─── Corresponding sign paths ────────────────────────────────────────────────

const SIGN_PATHS_MAP: Record<string, string> = {
  '/e-imzo/api/v1/certificate/list': '/e-imzo/api/v1/pkcs7/create',
  '/frontend/api/v1/certificate/list': '/frontend/api/v1/pkcs7/create',
  '/api/v1/certificate/list': '/api/v1/pkcs7/create',
  '/e-imzo/api/v1/keys': '/e-imzo/api/v1/pkcs7/create',
  '/frontend/api/v1/keys': '/frontend/api/v1/pkcs7/create',
}

// ─── REST communication ──────────────────────────────────────────────────────

async function tryFetch(url: string, timeout = 2500): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)
    return await res.json()
  } catch {
    clearTimeout(timer)
    throw new Error('fetch_failed')
  }
}

// ─── Connection detection ────────────────────────────────────────────────────

export async function detectEimzo(): Promise<EimzoConnection | null> {
  // Try all combinations of baseUrl + listPath in parallel batches
  for (const baseUrl of BASE_URLS) {
    // Try all paths for this baseUrl concurrently
    const results = await Promise.allSettled(
      LIST_PATHS.map(async (path) => {
        const data = await tryFetch(`${baseUrl}${path}`, 2000)
        if (data && typeof data === 'object') {
          return { baseUrl, listPath: path }
        }
        throw new Error('invalid_response')
      })
    )

    // Find the first successful result
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { baseUrl: url, listPath } = result.value
        return {
          type: 'rest',
          baseUrl: url,
          listPath,
          signPath: SIGN_PATHS_MAP[listPath] || '/e-imzo/api/v1/pkcs7/create',
        }
      }
    }
  }

  return null
}

// ─── List certificates ───────────────────────────────────────────────────────

export async function listCertificates(conn: EimzoConnection): Promise<EimzoCert[]> {
  const data = await tryFetch(`${conn.baseUrl}${conn.listPath}`, 5000) as Record<string, unknown>
  // E-IMZO returns certs in different fields depending on version
  const certs = (data?.alias || data?.certificates || data?.keys || data?.data || []) as EimzoCert[]
  return Array.isArray(certs) ? certs : []
}

// ─── Sign data (create PKCS7) ────────────────────────────────────────────────

export async function signPkcs7(conn: EimzoConnection, alias: string, content: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(`${conn.baseUrl}${conn.signPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, content: btoa(content), detached: false }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    const data = await res.json() as Record<string, unknown>
    const sig = (data.pkcs7_64 || data.signature || data.pkcs7 || data.sign) as string
    if (!sig) throw new Error((data.message || data.error || "Imzolashda xatolik") as string)
    return sig
  } catch (e) {
    clearTimeout(timer)
    throw e
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parseCertLabel(cert: EimzoCert): string {
  const subj = cert.subjectName || ''
  const cn = subj.match(/CN=([^,]+)/)?.[1]?.trim() || cert.CN || cert.name
  const tin = subj.match(/(?:TIN|INN|UID|SERIALNUMBER|1\.2\.860\.3\.16\.1\.2)=([^,]+)/i)?.[1]?.trim() || cert.TIN
  const label = cn || cert.alias || 'Noma\'lum'
  return tin ? `${label} (${tin})` : String(label)
}

export function certExpiry(cert: EimzoCert): string {
  const d = cert.validTo
  if (!d) return ''
  try {
    const date = new Date(d as string)
    if (isNaN(date.getTime())) return String(d)
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
  } catch { return String(d) }
}
