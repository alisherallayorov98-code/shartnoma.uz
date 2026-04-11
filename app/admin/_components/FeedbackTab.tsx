'use client'

import { supabase } from '@/lib/supabase'
import type { Feedback } from '../types'

interface Props {
  feedbacks: Feedback[]
  setFeedbacks: React.Dispatch<React.SetStateAction<Feedback[]>>
  darkMode: boolean
}

export default function FeedbackTab({ feedbacks, setFeedbacks, darkMode }: Props) {
  const dm = darkMode
  const textSub = dm ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="space-y-2">
      {feedbacks.length === 0 ? (
        <div className={`text-center py-12 ${textSub}`}>Hali takliflar yo&apos;q</div>
      ) : feedbacks.map(fb => (
        <div key={fb.id} className={`border rounded-xl p-4 ${
          fb.status === 'new'
            ? dm ? 'bg-gray-900 border-blue-800/60' : 'bg-white border-blue-300'
            : dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  fb.category === 'bug' ? 'bg-red-900/40 text-red-400' :
                  fb.category === 'taklif' ? 'bg-blue-900/40 text-blue-400' :
                  fb.category === 'savol' ? 'bg-yellow-900/40 text-yellow-400' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {fb.category === 'bug' ? '🐛 Xato' : fb.category === 'taklif' ? '💡 Taklif' : fb.category === 'savol' ? '❓ Savol' : '📝 Boshqa'}
                </span>
                {fb.status === 'new' && (
                  <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">Yangi</span>
                )}
                <span className={`text-xs ${textSub}`}>{fb.user_email}</span>
                <span className={`text-xs ${dm ? 'text-gray-600' : 'text-gray-400'}`}>{new Date(fb.created_at).toLocaleDateString('uz-UZ')}</span>
              </div>
              <div className={`font-medium text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{fb.title}</div>
              <div className={`text-xs mt-1 whitespace-pre-wrap ${textSub}`}>{fb.message}</div>
            </div>
            <button
              onClick={async () => {
                await supabase.from('feedback').update({ status: fb.status === 'new' ? 'seen' : 'new' }).eq('id', fb.id)
                setFeedbacks(prev => prev.map(f => f.id === fb.id ? { ...f, status: f.status === 'new' ? 'seen' : 'new' } : f))
              }}
              className={`text-xs px-2 py-1 rounded-lg transition flex-shrink-0 ${dm ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
              {fb.status === 'new' ? "Ko'rildi" : 'Yangilash'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
