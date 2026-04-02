'use client'

import { useState } from 'react'
import { useDashboard } from '../context'
import { useLang } from '@/lib/LanguageContext'
import { LANG_LABELS, type Lang } from '@/lib/i18n'
import { useTheme } from '@/lib/ThemeContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'

const LANG_CODES: Record<Lang, string> = { uz: 'UZ', oz: 'УЗ', ru: 'RU' }

export function TopBar() {
  const { userEmail, isAdmin, userId, activeOrg } = useDashboard()
  const { lang, setLang } = useLang()
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()
  const [langOpen, setLangOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [fbForm, setFbForm] = useState({ category: 'taklif', title: '', message: '' })
  const [fbSaving, setFbSaving] = useState(false)

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault()
    if (!fbForm.title.trim() || !fbForm.message.trim()) return
    setFbSaving(true)
    const { error } = await supabase.from('feedback').insert({
      user_id: userId,
      organization_id: activeOrg?.id || null,
      user_email: userEmail,
      category: fbForm.category,
      title: fbForm.title.trim(),
      message: fbForm.message.trim(),
    })
    setFbSaving(false)
    if (error) { toast('Yuborishda xato: ' + error.message, 'error'); return }
    toast('Fikr-mulohazangiz yuborildi. Rahmat!', 'success')
    setFeedbackOpen(false)
    setFbForm({ category: 'taklif', title: '', message: '' })
  }

  return (
    <>
    <div className="hidden sm:flex items-center justify-end gap-1 px-4 h-10 border-b border-[#1E293B] bg-[#0F172A] flex-shrink-0">

      {/* Language compact dropdown */}
      <div className="relative">
        <button
          onClick={() => setLangOpen(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#1F2937] transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
          </svg>
          <span className="font-medium">{LANG_CODES[lang]}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        {langOpen && (
          <div className="absolute right-0 top-full mt-1 bg-[#111827] border border-[#1E293B] rounded-xl shadow-xl z-50 overflow-hidden min-w-[120px]">
            {(['uz', 'oz', 'ru'] as Lang[]).map(l => (
              <button key={l} onClick={() => { setLang(l); setLangOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition hover:bg-[#1F2937] ${lang === l ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>
                <span>{LANG_LABELS[l]}</span>
                {lang === l && <span className="text-blue-400">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feedback button */}
      <button onClick={() => setFeedbackOpen(true)} title="Taklif / Xato bildirish"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-[#1F2937] transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      </button>

      {/* Theme toggle */}
      <button onClick={toggleTheme} title={theme === 'dark' ? 'Kunduzgi rejim' : 'Tungi rejim'}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition">
        {theme === 'dark' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/>
          </svg>
        )}
      </button>

      {/* User */}
      <div className="flex items-center gap-2 pl-2 border-l border-[#1E293B]">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold uppercase">
          {userEmail?.[0] || 'U'}
        </div>
        <span className="text-sm text-gray-300 max-w-[160px] truncate hidden lg:block">{userEmail}</span>
        {isAdmin && <span className="text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded">Admin</span>}
      </div>
    </div>

    {/* Feedback modal */}
    {feedbackOpen && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
            <h2 className="text-base font-semibold text-white">💬 Taklif yoki xato bildirish</h2>
            <button onClick={() => setFeedbackOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] text-xl">×</button>
          </div>
          <form onSubmit={submitFeedback} className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Turi</label>
              <div className="flex gap-2">
                {[
                  { value: 'taklif', label: '💡 Taklif' },
                  { value: 'bug',    label: '🐛 Xato' },
                  { value: 'savol',  label: '❓ Savol' },
                  { value: 'boshqa', label: '📝 Boshqa' },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setFbForm(f => ({ ...f, category: opt.value }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition border ${
                      fbForm.category === opt.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-[#0F172A] border-[#1E293B] text-gray-400 hover:border-blue-600/50'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sarlavha *</label>
              <input
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-500"
                placeholder="Qisqacha ta'rif..."
                required
                value={fbForm.title}
                onChange={e => setFbForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Batafsil *</label>
              <textarea
                className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-500 resize-none"
                rows={4}
                placeholder="Muammo yoki taklifingizni batafsil yozing..."
                required
                value={fbForm.message}
                onChange={e => setFbForm(f => ({ ...f, message: e.target.value }))}
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setFeedbackOpen(false)}
                className="flex-1 py-2.5 rounded-lg text-sm text-gray-400 bg-[#1F2937] hover:bg-[#334155] transition">
                Bekor qilish
              </button>
              <button type="submit" disabled={fbSaving}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition">
                {fbSaving ? 'Yuborilmoqda...' : 'Yuborish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  )
}
