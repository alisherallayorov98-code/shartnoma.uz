/**
 * useContractSearch — debounced server-side qidiruv
 * 3+ belgidan keyin /api/search ga murojaat qiladi, AbortController bilan.
 */

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Contract } from '@/lib/types'

interface UseContractSearchResult {
  search: string
  setSearch: (v: string) => void
  serverResults: Contract[] | null
  setServerResults: (v: Contract[] | null) => void
}

export function useContractSearch(): UseContractSearchResult {
  const [search, setSearch] = useState('')
  const [serverResults, setServerResults] = useState<Contract[] | null>(null)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    if (search.length < 3) { setServerResults(null); return }

    const controller = new AbortController()
    debounce.current = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        })
        if (!res.ok) { setServerResults(null); return }
        const json = await res.json()
        setServerResults(json.results ?? null)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setServerResults(null)
      }
    }, 400)

    return () => {
      controller.abort()
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [search])

  return { search, setSearch, serverResults, setServerResults }
}
