'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Msg { role: 'user' | 'assistant'; content: string; time?: string }

const QUICK = [
  "Shartnoma qanday yaratiladi?",
  "Obuna rejalari narxi qancha?",
  "E-IMZO qachon ishlaydi?",
  "Kontragent qo'shish qanday?",
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)
  const [shown, setShown] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Show widget after 3s delay
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
      // Welcome message on first open
      if (msgs.length === 0) {
        setMsgs([{
          role: 'assistant',
          content: "Salom! 👋 Men Kabinetim.uz yordamchisiman.\n\nShartnomalar, obuna, funksiyalar haqida savol bering — yordam berishdan xursandman!",
          time: now(),
        }])
      }
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, streaming])

  function now() {
    return new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  }

  async function send(text?: string) {
    const msg = (text || input).trim()
    if (!msg || streaming) return
    setInput('')
    const time = now()
    setMsgs(m => [...m, { role: 'user', content: msg, time }])
    setStreaming(true)

    abortRef.current = new AbortController()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setMsgs(m => [...m, { role: 'assistant', content: 'Kirish talab qilinadi.', time: now() }]); return }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: msg, sessionId }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) { setMsgs(m => [...m, { role: 'assistant', content: "Xatolik yuz berdi. Qayta urinib ko'ring.", time: now() }]); return }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let sidExtracted = false

      setMsgs(m => [...m, { role: 'assistant', content: '', time: now() }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        let chunk = decoder.decode(value, { stream: true })

        // Extract session ID from first chunk
        if (!sidExtracted && chunk.includes('__SESSION__')) {
          const match = chunk.match(/__SESSION__([^_]+)__SESSION__/)
          if (match) { setSessionId(match[1]); chunk = chunk.replace(/__SESSION__[^_]+__SESSION__/, '') }
          sidExtracted = true
        }

        full += chunk
        setMsgs(m => m.map((msg, i) => i === m.length - 1 && msg.role === 'assistant' ? { ...msg, content: full } : msg))
      }

      if (!open) setUnread(u => u + 1)
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setMsgs(m => [...m, { role: 'assistant', content: "Ulanishda xatolik.", time: now() }])
      }
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">

      {/* Chat window */}
      {open && (
        <div
          className="w-80 sm:w-96 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          style={{
            background: '#0d1525',
            border: '1px solid rgba(99,102,241,0.25)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
            maxHeight: '520px',
            animation: 'chatOpen 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}>

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5"
            style={{ background: 'linear-gradient(135deg, #1e1b4b, #1e1040)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>💬</div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold">Kabinetim Yordam</div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-xs text-gray-400">Doim yordamga tayor</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: '280px', maxHeight: '360px' }}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-xs"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>🤖</div>
                )}
                <div className={`max-w-[82%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user' ? 'rounded-tr-sm text-white' : 'rounded-tl-sm text-gray-200'
                  }`} style={m.role === 'user'
                    ? { background: 'linear-gradient(135deg, #4f46e5, #6d28d9)' }
                    : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {m.content === '' && streaming && i === msgs.length - 1 ? (
                      <div className="flex items-center gap-1">
                        {[0,1,2].map(j => <span key={j} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${j*150}ms` }}/>)}
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    )}
                  </div>
                  {m.time && <span className="text-[10px] text-gray-700 px-1">{m.time}</span>}
                </div>
                {m.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-xs"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>👤</div>
                )}
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* Quick questions */}
          {msgs.length <= 1 && !streaming && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {QUICK.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="text-xs px-2.5 py-1.5 rounded-lg transition text-indigo-300 hover:text-white"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-2.5 flex items-end gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              disabled={streaming}
              rows={1}
              placeholder="Savol yozing..."
              className="flex-1 text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 text-gray-200 placeholder-gray-600 disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                maxHeight: '80px',
              }}
              onInput={e => { const el = e.target as HTMLTextAreaElement; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 80) + 'px' }}
            />
            <button onClick={() => send()} disabled={!input.trim() || streaming}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition disabled:opacity-40 text-white"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      {shown && (
        <button
          onClick={() => setOpen(o => !o)}
          className="relative group"
          style={{ animation: 'chatBtnIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>

          {/* Outer pulse ring */}
          {!open && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}/>
          )}

          {/* Button */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${open ? 'rotate-90' : 'group-hover:scale-110'}`}
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              boxShadow: '0 4px 20px rgba(79,70,229,0.5)',
            }}>
            {open ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            )}
          </div>

          {/* Unread badge */}
          {unread > 0 && !open && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes chatOpen {
          from { opacity: 0; transform: scale(0.85) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes chatBtnIn {
          from { opacity: 0; transform: scale(0) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}}/>
    </div>
  )
}
