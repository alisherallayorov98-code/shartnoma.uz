// Auth-aware wrapper for /api/ai calls
import { supabase } from './supabase'

export async function fetchAi(body: Record<string, unknown>): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || ''
  return fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}
