'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useDashboard } from '../context'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'

type Announcement = {
  id: string
  title: string
  body: string
  type: string
  image_url: string | null
  link_url: string | null
  link_text: string | null
  created_at: string
  is_read?: boolean
}

const TYPE_COLORS: Record<string, string> = {
  yangilik:    'bg-blue-900/40 text-blue-300 border-blue-700/40',
  yangilanish: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  ilova:       'bg-purple-900/40 text-purple-300 border-purple-700/40',
}
const TYPE_ICONS: Record<string, string> = {
  yangilik: '📰', yangilanish: '🔄', ilova: '🚀',
}

export default function YangiliklarPage() {
  const { userId } = useDashboard()
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  const TYPE_LABELS: Record<string, string> = {
    yangilik:    T(t.news.typeYangilik),
    yangilanish: T(t.news.typeYangilanish),
    ilova:       T(t.news.typeIlova),
  }

  useEffect(() => {
    if (userId) loadAnnouncements()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function loadAnnouncements() {
    const [{ data: anns }, { data: reads }] = await Promise.all([
      supabase.from('announcements').select('*').eq('is_published', true).order('created_at', { ascending: false }),
      supabase.from('announcement_reads').select('announcement_id').eq('user_id', userId!),
    ])
    const readSet = new Set((reads || []).map(r => r.announcement_id))
    setItems((anns || []).map(a => ({ ...a, is_read: readSet.has(a.id) })))
    setLoading(false)

    // O'qilmagan barchasini o'qilgan deb belgilash
    const unread = (anns || []).filter(a => !readSet.has(a.id))
    if (unread.length > 0) {
      await supabase.from('announcement_reads').upsert(
        unread.map(a => ({ user_id: userId!, announcement_id: a.id })),
        { onConflict: 'user_id,announcement_id' }
      )
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">{T(t.news.title)}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{T(t.news.subtitle)}</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-16 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-400">{T(t.news.empty)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const typeKey = item.type in TYPE_COLORS ? item.type : 'yangilik'
            return (
              <div key={item.id}
                className={`bg-[#111827] border rounded-xl overflow-hidden transition ${item.is_read ? 'border-[#1E293B]' : 'border-blue-600/40'}`}>
                {item.image_url && (
                  <img src={item.image_url} alt="" className="w-full h-48 object-cover"/>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${TYPE_COLORS[typeKey]}`}>
                      {TYPE_ICONS[typeKey]} {TYPE_LABELS[typeKey]}
                    </span>
                    {!item.is_read && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600 text-white font-medium">{T(t.news.newBadge)}</span>
                    )}
                    <span className="text-xs text-gray-500 ml-auto">{formatDate(item.created_at)}</span>
                  </div>
                  <h2 className="text-base font-bold text-white mb-2">{item.title}</h2>
                  <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{item.body}</p>
                  {item.link_url && (
                    <a href={item.link_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-4 text-sm text-blue-400 hover:text-blue-300 transition">
                      {item.link_text || T(t.news.readMore)}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
