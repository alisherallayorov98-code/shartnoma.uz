'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Session {
  id: string
  user_email: string
  org_name: string
  plan: string
  status: string
  created_at: string
  updated_at: string
  msg_count?: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

function getAdminDb(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface Props { token: string; darkMode: boolean }

const PLAN_COLOR: Record<string, string> = {
  free: 'text-gray-400 bg-gray-800/50',
  standard: 'text-blue-300 bg-blue-900/30',
  premium: 'text-yellow-300 bg-yellow-900/30',
}

export default function SupportTab({ token, darkMode }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selected, setSelected] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [msgLoading, setMsgLoading] = useState(false)
  const [search, setSearch] = useState('')

  const card = darkMode ? 'bg-[#0d1424] border-[#1e293b]' : 'bg-white border-gray-200'
  const txt  = darkMode ? 'text-white' : 'text-gray-900'
  const sub  = darkMode ? 'text-gray-400' : 'text-gray-500'
  const inp  = darkMode ? 'bg-[#0a0f1e] border-[#1e293b] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-300 text-gray-900'

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    setLoading(true)
    try {
      const db = getAdminDb(token)
      // Admin can read all via service role — use service endpoint
      const res = await fetch('/api/admin/support', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function openSession(s: Session) {
    setSelected(s)
    setMsgLoading(true)
    try {
      const res = await fetch(`/api/admin/support?sessionId=${s.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } finally {
      setMsgLoading(false)
    }
  }

  const filtered = sessions.filter(s =>
    !search || s.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    s.org_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)]">

      {/* Sessions list */}
      <div className={`w-80 flex-shrink-0 rounded-2xl border ${card} flex flex-col overflow-hidden`}>
        <div className="p-3 border-b" style={{ borderColor: darkMode ? '#1e293b' : '#e5e7eb' }}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${txt}`}>Chat tarixlari</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
              {sessions.length} ta
            </span>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Email yoki tashkilot..."
            className={`w-full text-xs rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-indigo-500/30 ${inp}`}/>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`text-center py-10 ${sub} text-sm`}>Chat yo&apos;q</div>
          ) : (
            filtered.map(s => (
              <button key={s.id} onClick={() => openSession(s)}
                className={`w-full text-left px-3 py-3 border-b transition ${
                  selected?.id === s.id
                    ? darkMode ? 'bg-indigo-900/20 border-indigo-800/30' : 'bg-indigo-50'
                    : darkMode ? 'hover:bg-white/[0.03] border-[#1e293b]' : 'hover:bg-gray-50 border-gray-100'
                }`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-medium truncate ${txt}`}>{s.org_name || s.user_email}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2 ${PLAN_COLOR[s.plan] || PLAN_COLOR.free}`}>
                    {s.plan}
                  </span>
                </div>
                <div className={`text-[11px] truncate ${sub}`}>{s.user_email}</div>
                <div className={`text-[10px] mt-0.5 ${sub} opacity-70`}>
                  {new Date(s.updated_at).toLocaleString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages panel */}
      <div className={`flex-1 rounded-2xl border ${card} flex flex-col overflow-hidden`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-5xl mb-3 opacity-20">💬</div>
            <p className={`text-sm ${sub}`}>Chaptagi suhbatni tanlang</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: darkMode ? '#1e293b' : '#e5e7eb' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>💬</div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${txt}`}>{selected.org_name || selected.user_email}</div>
                <div className={`text-xs ${sub}`}>{selected.user_email} · {selected.plan}</div>
              </div>
              <button onClick={() => setSelected(null)} className={`text-sm ${sub} hover:${txt} transition`}>✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              ) : messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg shrink-0 mt-0.5 text-xs flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>🤖</div>
                  )}
                  <div className={`max-w-[75%] flex flex-col gap-0.5 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'rounded-tr-sm text-white'
                        : `rounded-tl-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`
                    }`} style={m.role === 'user'
                      ? { background: 'linear-gradient(135deg, #4f46e5, #6d28d9)' }
                      : { background: darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}` }}>
                      {m.content}
                    </div>
                    <span className={`text-[10px] px-1 ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-6 h-6 rounded-lg shrink-0 mt-0.5 text-xs flex items-center justify-center"
                      style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>👤</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
