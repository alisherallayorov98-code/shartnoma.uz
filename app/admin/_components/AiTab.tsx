'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  { icon: '📊', label: 'Umumiy holat', prompt: "Platformaning bugungi umumiy holatini tahlil qil. Eng muhim ko'rsatkichlarni, ijobiy va salbiy tomonlarni ayt." },
  { icon: '⚠️', label: 'Churn risk', prompt: "Obunasi tugayotgan mijozlarni tahlil qil. Kim ketib qolishi mumkin? Ularni ushlab qolish uchun nima qilish kerak?" },
  { icon: '📈', label: "O'sish tahlili", prompt: "So'nggi 30 va 7 kundagi o'sishni tahlil qil. Foydalanuvchilar va daromad dinamikasi qanday? Tendentsiya ijobiyami?" },
  { icon: '💰', label: 'Daromad', prompt: "Daromad tahlilini ber. Qaysi obuna rejalari ko'proq sotilmoqda? O'rtacha daromadni hisoblash mumkinmi?" },
  { icon: '💬', label: 'Feedbacklar', prompt: "Ochiq feedbacklarni tahlil qil. Foydalanuvchilar nima haqida shikoyat qilmoqda? Qanday yaxshilash mumkin?" },
  { icon: '🏆', label: 'Top mijozlar', prompt: "Eng faol tashkilotlarni tahlil qil. Ular nimadan foydalanmoqda? Boshqalarga ham tavsiya qilish mumkinmi?" },
  { icon: '🎯', label: 'Demo konversiya', prompt: "Demo rejimidagi tashkilotlar to'g'risida tahlil ber. Demoni pullik rejimga o'tkazish uchun qanday strategiya tavsiya qilasan?" },
  { icon: '📝', label: 'Haftalik hisobot', prompt: "So'nggi 7 kun uchun qisqa haftalik hisobot yoz: yangi foydalanuvchilar, shartnomalar, daromad va eng muhim voqealar." },
]

interface Props {
  token: string
  darkMode: boolean
}

export default function AiTab({ token, darkMode }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [currentStream, setCurrentStream] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentStream])

  async function send(promptText?: string) {
    const text = (promptText || input).trim()
    if (!text || streaming) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setStreaming(true)
    setCurrentStream('')

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) { setMessages(m => [...m, { role: 'assistant', content: 'Xatolik yuz berdi.' }]); return }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setCurrentStream(full)
      }

      setMessages(m => [...m, { role: 'assistant', content: full }])
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') {
        setMessages(m => [...m, { role: 'assistant', content: 'Ulanishda xatolik.' }])
      }
    } finally {
      setStreaming(false)
      setCurrentStream('')
    }
  }

  function stop() {
    abortRef.current?.abort()
    if (currentStream) setMessages(m => [...m, { role: 'assistant', content: currentStream }])
    setStreaming(false)
    setCurrentStream('')
  }

  function clear() {
    if (streaming) stop()
    setMessages([])
  }

  const card = darkMode ? 'bg-[#0d1424] border-[#1e293b]' : 'bg-white border-gray-200'
  const inputBg = darkMode ? 'bg-[#0a0f1e] border-[#1e293b] text-white placeholder-gray-600' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto">

      {/* Header */}
      <div className={`rounded-2xl p-5 border ${card} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ background: 'radial-gradient(circle at 80% 50%, #818cf8 0%, transparent 60%)' }}/>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 0 20px rgba(79,70,229,0.4)' }}>
              🤖
            </div>
            <div>
              <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin AI Yordamchi</h2>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Platforma statistikasi bilan ishlaydi · Claude AI (Haiku)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              Jonli ma&apos;lumotlar
            </div>
            {messages.length > 0 && (
              <button onClick={clear} className={`text-xs px-3 py-1.5 rounded-lg transition ${darkMode ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                Tozalash
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick prompts */}
      <div>
        <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tezkor savollar:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_PROMPTS.map((q, i) => (
            <button key={i} onClick={() => send(q.prompt)} disabled={streaming}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all border ${
                darkMode
                  ? 'bg-[#0d1424] border-[#1e293b] text-gray-300 hover:border-indigo-500/50 hover:bg-indigo-900/20 hover:text-white disabled:opacity-40'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40'
              }`}>
              <span className="text-base shrink-0">{q.icon}</span>
              <span className="truncate">{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className={`rounded-2xl border ${card} flex flex-col overflow-hidden`} style={{ minHeight: '400px', maxHeight: '600px' }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streaming && (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
              <div className="text-5xl mb-4 opacity-20">🤖</div>
              <p className={`text-sm ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Yuqoridagi tezkor savollardan birini tanlang yoki o&apos;z savolingizni yozing
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-sm"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>🤖</div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-tr-sm'
                  : `${darkMode ? 'text-gray-200' : 'text-gray-800'} rounded-tl-sm`
              }`} style={msg.role === 'user'
                ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }
                : { background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}` }}>
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}/>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-sm"
                  style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }}>👤</div>
              )}
            </div>
          ))}

          {/* Streaming */}
          {streaming && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>🤖</div>
              <div className={`max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed`}
                style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}` }}>
                {currentStream ? (
                  <div className={`whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
                    dangerouslySetInnerHTML={{ __html: currentStream.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}/>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }}/>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}/>

        {/* Input */}
        <div className="p-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={streaming}
            rows={1}
            placeholder="Savol yozing... (Enter — yuborish, Shift+Enter — yangi qator)"
            className={`flex-1 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 border transition ${inputBg} ${darkMode ? 'focus:border-indigo-500/50 focus:ring-indigo-500/20' : 'focus:border-indigo-400 focus:ring-indigo-400/20'}`}
            style={{ maxHeight: '120px' }}
            onInput={e => { const el = e.target as HTMLTextAreaElement; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }}
          />
          {streaming ? (
            <button onClick={stop}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition text-white"
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1"/>
              </svg>
            </button>
          ) : (
            <button onClick={() => send()} disabled={!input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition disabled:opacity-40 text-white"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: input.trim() ? '0 4px 15px rgba(79,70,229,0.3)' : 'none' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Info footer */}
      <p className={`text-xs text-center ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>
        AI real vaqtda Supabase dan ma&apos;lumot o&apos;qib javob beradi · Har so&apos;rov yangi statistika bilan ishlaydi
      </p>
    </div>
  )
}
