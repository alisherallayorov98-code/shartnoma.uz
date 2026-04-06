/**
 * E-IMZO CAPIWS integration
 *
 * Based on official E-IMZO documentation:
 * - WebSocket: wss://127.0.0.1:64443/service/cryptapi
 * - Requires API-KEY per domain
 * - Plugin "pkcs11" for listing certs, "pkcs7" for signing
 */

export interface EimzoCert {
  disk: string
  alias: string
  serialNumber: string
  validFrom: string
  validTo: string
  CN: string
  TIN?: string
  O?: string
  T?: string
  UID?: string
  name?: string
  type?: string
  [key: string]: unknown
}

// ─── WebSocket URLs to try ───────────────────────────────────────────────────

const WS_URLS = [
  'wss://127.0.0.1:64443/service/cryptapi',
  'ws://127.0.0.1:64646/service/cryptapi',
  'wss://localhost:64443/service/cryptapi',
  'ws://localhost:64646/service/cryptapi',
]

// ─── API Keys ────────────────────────────────────────────────────────────────
// Test keys for localhost. Production key for kabinetim.uz must be obtained
// from E-IMZO center (https://e-imzo.uz)

const API_KEYS: [string, string][] = [
  ['localhost', '96D0C1491615C82B9A54D9989779DF825B690748224C2B04F500F370D51827CE2644D8D4A82C18184D73AB8530BB8ED537269603F61DB0D03D2104ABF789970B'],
  ['127.0.0.1', 'A7BCFA5D490B351BE0754130DF03A068F855DB4333D43921125B9CF2670EF6A40370C646B90401955E1F7BC9CDBF59CE0B2C5467D820BE189C845D0B79CFC96F'],
  ['kabinetim.uz', process.env.NEXT_PUBLIC_EIMZO_API_KEY || ''],
]

// ─── CAPIWS Client ───────────────────────────────────────────────────────────

type CAPICallback = (event: unknown, data: Record<string, unknown>) => void
type CAPIErrorCallback = (error: string) => void

let ws: WebSocket | null = null
let wsReady = false
let pendingCallbacks: { resolve: CAPICallback; reject: CAPIErrorCallback }[] = []

function getApiKeyForDomain(): [string, string] | null {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  for (const [domain, key] of API_KEYS) {
    if (domain === hostname && key) return [domain, key]
  }
  // Fallback: try all keys
  for (const [domain, key] of API_KEYS) {
    if (key) return [domain, key]
  }
  return null
}

function connectWs(url: string, timeout = 3000): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { socket.close() } catch { /* */ }
      reject(new Error('timeout'))
    }, timeout)

    let socket: WebSocket
    try {
      socket = new WebSocket(url)
    } catch {
      clearTimeout(timer)
      reject(new Error('ws_create_failed'))
      return
    }

    socket.onopen = () => {
      clearTimeout(timer)
      resolve(socket)
    }
    socket.onerror = () => {
      clearTimeout(timer)
      reject(new Error('ws_error'))
    }
  })
}

export async function initEimzo(): Promise<boolean> {
  const apiKeyPair = getApiKeyForDomain()

  // Try each WebSocket URL
  for (const url of WS_URLS) {
    try {
      console.log(`[E-IMZO] trying ${url}...`)
      const socket = await connectWs(url, 3000)

      // Send API key
      const apiKeyResult = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('apikey_timeout')), 5000)

        socket.onmessage = (e) => {
          clearTimeout(timer)
          try {
            resolve(JSON.parse(e.data))
          } catch {
            reject(new Error('invalid_response'))
          }
        }
        socket.onerror = () => {
          clearTimeout(timer)
          reject(new Error('ws_error'))
        }

        if (apiKeyPair) {
          // Send API key as flat array: [domain, key, domain2, key2, ...]
          const flatKeys: string[] = []
          for (const [d, k] of API_KEYS) {
            if (k) { flatKeys.push(d); flatKeys.push(k) }
          }
          socket.send(JSON.stringify({
            name: 'apikey',
            plugin: 'e-imzo',
            arguments: flatKeys,
          }))
        } else {
          // Try without API key
          socket.send(JSON.stringify({
            name: 'apikey',
            plugin: 'e-imzo',
            arguments: [],
          }))
        }
      })

      console.log('[E-IMZO] apikey response:', apiKeyResult)

      if (apiKeyResult.success) {
        ws = socket
        wsReady = true

        // Set up message handler for subsequent calls
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            const cb = pendingCallbacks.shift()
            if (cb) cb.resolve(null, data)
          } catch {
            const cb = pendingCallbacks.shift()
            if (cb) cb.reject('Invalid response')
          }
        }
        ws.onerror = () => {
          const cb = pendingCallbacks.shift()
          if (cb) cb.reject('WebSocket error')
          wsReady = false
        }
        ws.onclose = () => {
          wsReady = false
          ws = null
        }

        console.log(`[E-IMZO] connected via ${url}`)
        return true
      }
    } catch (e) {
      console.log(`[E-IMZO] ${url} failed:`, (e as Error).message)
    }
  }

  console.log('[E-IMZO] all WebSocket URLs failed')
  return false
}

function callFunction(request: Record<string, unknown>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    if (!ws || !wsReady) {
      reject('E-IMZO ulanmagan')
      return
    }

    const timer = setTimeout(() => {
      // Remove the pending callback
      const idx = pendingCallbacks.findIndex(cb => cb.resolve === successCb)
      if (idx >= 0) pendingCallbacks.splice(idx, 1)
      reject('Timeout')
    }, 10000)

    const successCb: CAPICallback = (_event, data) => {
      clearTimeout(timer)
      if (data.success) {
        resolve(data)
      } else {
        reject((data.reason || data.message || 'E-IMZO xatoligi') as string)
      }
    }
    const errorCb: CAPIErrorCallback = (error) => {
      clearTimeout(timer)
      reject(error)
    }

    pendingCallbacks.push({ resolve: successCb, reject: errorCb })
    ws.send(JSON.stringify(request))
  })
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function listCertificates(): Promise<EimzoCert[]> {
  const data = await callFunction({
    plugin: 'pkcs11',
    name: 'list_all_certificates',
  })
  return (data.certificates || []) as EimzoCert[]
}

export async function signPkcs7(certId: string, dataBase64: string): Promise<string> {
  const data = await callFunction({
    plugin: 'pkcs7',
    name: 'create_pkcs7',
    arguments: [dataBase64, certId, 'no'],
  })
  return (data.pkcs7_64 || data.signature || '') as string
}

export function isConnected(): boolean {
  return wsReady && ws !== null && ws.readyState === WebSocket.OPEN
}

export function disconnect() {
  if (ws) {
    try { ws.close() } catch { /* */ }
    ws = null
    wsReady = false
    pendingCallbacks = []
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function parseCertLabel(cert: EimzoCert): string {
  const cn = cert.CN || cert.name || cert.alias || "Noma'lum"
  const tin = cert.TIN || cert.UID || ''
  return tin ? `${cn} (${tin})` : String(cn)
}

export function certExpiry(cert: EimzoCert): string {
  const d = cert.validTo
  if (!d) return ''
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return String(d)
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`
  } catch { return String(d) }
}
