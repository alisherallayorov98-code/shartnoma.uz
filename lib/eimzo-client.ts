/**
 * E-IMZO Desktop Client — WebSocket (CAPIWS) protocol
 *
 * fetch() CORS bilan blokirovka qilinadi, shuning uchun
 * faqat WebSocket ishlatamiz — CORS cheklovi yo'q.
 *
 * E-IMZO CAPIWS protocol:
 *  - wss://127.0.0.1:64443  (E-IMZO v3, TLS)
 *  - ws://127.0.0.1:64646   (legacy)
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
  [key: string]: unknown
}

export interface EimzoConnection {
  wsUrl: string
}

// ─── WebSocket request helper ────────────────────────────────────────────────

function capiws(wsUrl: string, payload: unknown, timeout = 5000): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { ws.close() } catch { /* */ }
      reject(new Error('timeout'))
    }, timeout)

    let ws: WebSocket
    try {
      ws = new WebSocket(wsUrl)
    } catch {
      clearTimeout(timer)
      reject(new Error('ws_failed'))
      return
    }

    ws.onopen = () => {
      try {
        ws.send(JSON.stringify(payload))
      } catch {
        clearTimeout(timer)
        reject(new Error('ws_send_failed'))
      }
    }

    ws.onmessage = (e) => {
      clearTimeout(timer)
      try {
        const data = JSON.parse(e.data)
        resolve(data)
      } catch {
        resolve({ raw: e.data })
      }
      try { ws.close() } catch { /* */ }
    }

    ws.onerror = () => {
      clearTimeout(timer)
      reject(new Error('ws_error'))
    }

    ws.onclose = (event) => {
      clearTimeout(timer)
      if (!event.wasClean) {
        reject(new Error('ws_closed'))
      }
    }
  })
}

// ─── Detect E-IMZO desktop client ───────────────────────────────────────────

const WS_URLS = [
  'wss://127.0.0.1:64443',
  'ws://127.0.0.1:64646',
  'wss://localhost:64443',
  'ws://localhost:64646',
]

export async function detectEimzo(): Promise<EimzoConnection | null> {
  for (const wsUrl of WS_URLS) {
    try {
      console.log(`[E-IMZO] trying ${wsUrl}...`)
      const result = await capiws(wsUrl, {
        plugin: 'pfx',
        name: 'list_all_certificates',
        arguments: [],
      }, 2500)
      console.log(`[E-IMZO] success on ${wsUrl}:`, result)
      return { wsUrl }
    } catch (e) {
      console.log(`[E-IMZO] ${wsUrl} failed:`, (e as Error).message)
    }
  }
  return null
}

// ─── List certificates ───────────────────────────────────────────────────────

export async function listCertificates(conn: EimzoConnection): Promise<EimzoCert[]> {
  const data = await capiws(conn.wsUrl, {
    plugin: 'pfx',
    name: 'list_all_certificates',
    arguments: [],
  }, 5000)

  // E-IMZO returns in different formats
  const certs = (data.certificates || data.alias || data.keys || data.data || []) as EimzoCert[]
  return Array.isArray(certs) ? certs : []
}

// ─── Sign data (PKCS7) ──────────────────────────────────────────────────────

export async function signPkcs7(conn: EimzoConnection, alias: string, content: string): Promise<string> {
  const data = await capiws(conn.wsUrl, {
    plugin: 'pfx',
    name: 'create_pkcs7',
    arguments: [btoa(content), alias, 'no'],
  }, 15000)

  const sig = (data.pkcs7_64 || data.signature || data.pkcs7 || data.sign) as string
  if (!sig) {
    throw new Error((data.reason || data.message || data.error || "Imzolashda xatolik") as string)
  }
  return sig
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parseCertLabel(cert: EimzoCert): string {
  const subj = cert.subjectName || ''
  const cn = subj.match(/CN=([^,]+)/)?.[1]?.trim() || cert.CN || cert.name
  const tin = subj.match(/(?:TIN|INN|UID|SERIALNUMBER|1\.2\.860\.3\.16\.1\.2)=([^,]+)/i)?.[1]?.trim() || cert.TIN
  const label = cn || cert.alias || "Noma'lum"
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
