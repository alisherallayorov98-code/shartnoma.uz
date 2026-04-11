'use client'

import type { SiteContent } from '../types'

interface Props {
  siteContent: SiteContent[]
  contentSaving: string
  contentUploading: string
  contentDrafts: Record<string, string>
  setContentDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>
  darkMode: boolean
  saveContentItem: (key: string, label: string, type: string, value: string, file_url?: string) => void
  uploadMediaFile: (key: string, label: string, type: string, file: File) => void
  deleteContentItem: (id: string) => void
}

export default function ContentTab({
  siteContent, contentSaving, contentUploading, contentDrafts, setContentDrafts,
  darkMode, saveContentItem, uploadMediaFile, deleteContentItem,
}: Props) {
  const dm = darkMode
  const card = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const inp = dm
    ? 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
    : 'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
  const textSub = dm ? 'text-gray-400' : 'text-gray-500'
  const textMuted = dm ? 'text-gray-600' : 'text-gray-400'

  return (
    <div className="space-y-3">
      {siteContent.length === 0 && (
        <div className={`text-center py-10 text-sm ${textSub}`}>Yuklanmoqda...</div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {siteContent.map(item => (
          <div key={item.id} className={`border rounded-xl p-5 ${card}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className={`text-sm font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>{item.label}</div>
                <div className={`text-xs font-mono ${textSub}`}>{item.key}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.type === 'image' ? 'bg-purple-900 text-purple-300' :
                  item.type === 'video' ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-400'
                }`}>
                  {item.type === 'image' ? '🖼 Rasm' : item.type === 'video' ? '🎬 Video' : '📝 Matn'}
                </span>
                <button onClick={() => deleteContentItem(item.id)} className="text-xs text-red-500 hover:text-red-400 transition">🗑</button>
              </div>
            </div>

            {item.type === 'text' && (() => {
              const val = contentDrafts[item.key] !== undefined ? contentDrafts[item.key] : item.value
              const isLong = (item.value || '').length > 100
              return (
                <div className="flex gap-2">
                  {isLong
                    ? <textarea className={inp + ' flex-1 min-h-[80px] resize-none'} value={val}
                        onChange={e => setContentDrafts(prev => ({ ...prev, [item.key]: e.target.value }))}/>
                    : <input className={inp + ' flex-1'} value={val}
                        onChange={e => setContentDrafts(prev => ({ ...prev, [item.key]: e.target.value }))}/>
                  }
                  <button onClick={() => saveContentItem(item.key, item.label, item.type, val)}
                    disabled={contentSaving === item.key}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition shrink-0">
                    {contentSaving === item.key ? '...' : '💾'}
                  </button>
                </div>
              )
            })()}

            {(item.type === 'image' || item.type === 'video') && (
              <div className="space-y-3">
                {item.file_url && (
                  <div>
                    {item.type === 'image'
                      ? <img src={item.file_url} alt={item.label} className="max-h-40 rounded-lg border border-gray-700 object-cover"/>
                      : <video src={item.file_url} controls className="max-h-40 rounded-lg border border-gray-700 w-full"/>
                    }
                    <div className={`text-xs mt-1 truncate ${textMuted}`}>{item.file_url}</div>
                  </div>
                )}
                <div className="flex gap-3 items-center">
                  <label className="flex-1 cursor-pointer">
                    <div className={`border border-dashed rounded-lg px-4 py-3 text-center text-sm transition ${
                      dm ? 'bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-blue-500 text-gray-400 hover:text-white'
                         : 'bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-blue-400 text-gray-500 hover:text-gray-700'
                    }`}>
                      {contentUploading === item.key ? '⏳ Yuklanmoqda...' : `📁 ${item.type === 'image' ? 'Rasm' : 'Video'} yuklash`}
                    </div>
                    <input type="file" className="hidden"
                      accept={item.type === 'image' ? 'image/*' : 'video/*'}
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (file) await uploadMediaFile(item.key, item.label, item.type, file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  <div className={`text-xs ${textSub}`}>yoki URL:</div>
                  <input className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${
                    dm ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                    placeholder="https://..."
                    defaultValue={item.file_url || ''}
                    onBlur={e => { if (e.target.value !== item.file_url) saveContentItem(item.key, item.label, item.type, e.target.value, e.target.value) }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
