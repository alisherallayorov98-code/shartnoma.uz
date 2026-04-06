/**
 * E-IMZO Desktop Client communication layer
 *
 * E-IMZO v3+ supports both REST and WebSocket APIs.
 * WebSocket has no CORS restrictions — works on HTTP and HTTPS sites.
 *
 * Connection priority:
 *  1. WebSocket wss://127.0.0.1:64646  (E-IMZO v3+ with TLS)
 *  2. WebSocket ws://127.0.0.1:64646   (E-IMZO older or fallback)
 *  3. HTTPS REST https://127.0.0.1:64646 (E-IMZO v3+)
 *  4. HTTP REST  http://127.0.0.1:64646  (legacy, may be CORS-blocked)
 */

export interface EimzoCert {
  alias: string
  subjectName: string
  serialNumber: string
  validTo: string
  validFrom: string
  CN?: string
  O?: string
  TIN?: string
}

export interface EimzoConnection {
  type: 'ws' | 'rest'
  baseUrl: string
  ws?: WebSocket
}

// ─── WebSocket communication ─────────────────────────────────────────────────

function wsRequest(wsUrl: string, payload: unknown, timeout = 5000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let ws: WebSocket
    const timer = setTimeout(() => {
      try { ws?.close() } catch { /* noop */ }
      reject(new Error('timeout'))
    }, timeout)

    try {
      ws = new WebSocket(wsUrl)
    } catch {
      clearTimeout(timer)
      reject(new Error('ws_connect_failed'))
      return
    }

    ws.onopen = () => {
      ws.send(JSON.stringify(payload))
    }
    ws.onmessage = (e) => {
      clearTimeout(timer)
      try {
        resolve(JSON.parse(e.data))
      } catch {
        resolve(e.data)
      }
      ws.close()
    }
    ws.onerror = () => {
      clearTimeout(timer)
      reject(new Error('ws_error'))
    }
    ws.onclose = (event) => {
      if (!event.wasClean) {
        clearTimeout(timer)
        reject(new Error('ws_closed'))
      }
    }
  })
}

// ─── REST communication ──────────────────────────────────────────────────────

async function restRequest(baseUrl: string, path: string, options?: RequestInit): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    signal: AbortSignal.timeout(3000),
  })
  return res.json()
}

// ─── Connection detection ────────────────────────────────────────────────────

const WS_URLS = [
  'wss://127.0.0.1:64646',
  'ws://127.0.0.1:64646',
]
const REST_URLS = [
  'https://127.0.0.1:64646',
  'http://127.0.0.1:64646',
]

export async function detectEimzo(): Promise<EimzoConnection | null> {
  // Try WebSocket first (no CORS issues)
  for (const wsUrl of WS_URLS) {
    try {
      const result = await wsRequest(wsUrl, {
        plugin: 'pfx',
        name: 'list_all_certificates',
      }, 2000) as { certificates?: unknown[] }
      if (result && typeof result === 'object') {
        return { type: 'ws', baseUrl: wsUrl }
      }
    } catch { /* try next */ }
  }

  // Try REST (may be CORS-blocked on HTTP sites)
  for (const restUrl of REST_URLS) {
    try {
      const result = await restRequest(restUrl, '/e-imzo/api/v1/certificate/list') as { alias?: unknown[] }
      if (result && typeof result === 'object') {
        return { type: 'rest', baseUrl: restUrl }
      }
    } catch { /* try next */ }
  }

  return null
}

// ─── List certificates ───────────────────────────────────────────────────────

export async function listCertificates(conn: EimzoConnection): Promise<EimzoCert[]> {
  if (conn.type === 'ws') {
    // WebSocket API
    const result = await wsRequest(conn.baseUrl, {
      plugin: 'pfx',
      name: 'list_all_certificates',
    }, 5000) as { certificates?: EimzoCert[] }
    return result?.certificates || []
  }

  // REST API
  const result = await restRequest(conn.baseUrl, '/e-imzo/api/v1/certificate/list') as { alias?: EimzoCert[] }
  return result?.alias || []
}

// ─── Sign data (create PKCS7) ────────────────────────────────────────────────

export async function signPkcs7(conn: EimzoConnection, alias: string, content: string): Promise<string> {
  if (conn.type === 'ws') {
    // WebSocket API
    const result = await wsRequest(conn.baseUrl, {
      plugin: 'pfx',
      name: 'create_pkcs7',
      arguments: [btoa(content), alias, 'no'],
    }, 10000) as { pkcs7_64?: string; signature?: string; error?: string }
    const sig = result?.pkcs7_64 || result?.signature
    if (!sig) throw new Error(result?.error || "Imzolashda xatolik")
    return sig
  }

  // REST API
  const result = await restRequest(conn.baseUrl, '/e-imzo/api/v1/pkcs7/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias, content: btoa(content), detached: false }),
  }) as { pkcs7_64?: string; message?: string }
  if (!result.pkcs7_64) throw new Error(result.message || "Imzolashda xatolik")
  return result.pkcs7_64
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parseCertLabel(cert: EimzoCert): string {
  const cn = cert.subjectName?.match(/CN=([^,]+)/)?.[1]?.trim()
  const tin = cert.subjectName?.match(/(?:TIN|INN|UID|1\.2\.860\.3\.16\.1\.2)=([^,]+)/i)?.[1]?.trim()
  const label = cn || cert.alias
  return tin ? `${label} (${tin})` : label
}

export function certExpiry(cert: EimzoCert): string {
  if (!cert.validTo) return ''
  try {
    const d = new Date(cert.validTo)
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`
  } catch { return cert.validTo }
}
