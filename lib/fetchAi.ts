// Auth-aware wrapper for /api/ai calls with exponential-backoff retry
import { supabase } from './supabase'

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])
const MAX_RETRIES = 2

export async function fetchAi(body: Record<string, unknown>): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const bodyStr = JSON.stringify(body)

  let lastResponse: Response | null = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, 1000 * 2 ** (attempt - 1)))
    }
    try {
      const res = await fetch('/api/ai', { method: 'POST', headers, body: bodyStr })
      if (!RETRYABLE_STATUS.has(res.status) || attempt === MAX_RETRIES) return res
      lastResponse = res
    } catch {
      if (attempt === MAX_RETRIES) throw new Error('Serverga ulanishda xatolik')
    }
  }
  return lastResponse!
}
