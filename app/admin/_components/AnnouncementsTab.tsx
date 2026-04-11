'use client'

import type { Announcement } from '../types'

interface AnnForm {
  title: string; body: string; type: string; link_url: string; link_text: string
}

interface Props {
  announcements: Announcement[]
  annForm: AnnForm
  setAnnForm: React.Dispatch<React.SetStateAction<AnnForm>>
  annSaving: boolean
  darkMode: boolean
  saveAnnouncement: () => void
  togglePublish: (id: string, current: boolean) => void
  deleteAnnouncement: (id: string) => void
}

export default function AnnouncementsTab({
  announcements, annForm, setAnnForm, annSaving, darkMode,
  saveAnnouncement, togglePublish, deleteAnnouncement,
}: Props) {
  const dm = darkMode
  const card = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const inp = dm
    ? 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
    : 'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
  const lbl = `block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`
  const textSub = dm ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Add form */}
      <div className={`border rounded-xl p-5 space-y-4 ${card}`}>
        <h3 className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>Yangi e&apos;lon qo&apos;shish</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Sarlavha *</label>
            <input value={annForm.title} onChange={e => setAnnForm(p => ({ ...p, title: e.target.value }))}
              className={inp} placeholder="Yangilik sarlavhasi"/>
          </div>
          <div>
            <label className={lbl}>Turi</label>
            <select value={annForm.type} onChange={e => setAnnForm(p => ({ ...p, type: e.target.value }))} className={inp}>
              <option value="yangilik">📰 Yangilik</option>
              <option value="yangilanish">🔄 Yangilanish</option>
              <option value="ilova">🚀 Yangi ilova</option>
            </select>
          </div>
        </div>
        <div>
          <label className={lbl}>Matn *</label>
          <textarea value={annForm.body} onChange={e => setAnnForm(p => ({ ...p, body: e.target.value }))}
            className={inp} rows={4} placeholder="Batafsil ma'lumot..."/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Havola URL (ixtiyoriy)</label>
            <input value={annForm.link_url} onChange={e => setAnnForm(p => ({ ...p, link_url: e.target.value }))}
              className={inp} placeholder="https://..."/>
          </div>
          <div>
            <label className={lbl}>Havola matni</label>
            <input value={annForm.link_text} onChange={e => setAnnForm(p => ({ ...p, link_text: e.target.value }))}
              className={inp} placeholder="Ko'proq o'qish"/>
          </div>
        </div>
        <button onClick={saveAnnouncement} disabled={annSaving}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition">
          {annSaving ? 'Saqlanmoqda...' : "Qo'shish (nashr etilmagan)"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {announcements.length === 0 && (
          <p className={`text-sm ${textSub}`}>Hali e&apos;lon yo&apos;q</p>
        )}
        {announcements.map(a => (
          <div key={a.id} className={`border rounded-xl p-4 flex items-start gap-4 ${
            a.is_published
              ? dm ? 'bg-gray-900 border-emerald-700/40' : 'bg-white border-emerald-300'
              : dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  a.type === 'yangilik' ? 'bg-blue-900/40 text-blue-300 border-blue-700/40' :
                  a.type === 'yangilanish' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' :
                  'bg-purple-900/40 text-purple-300 border-purple-700/40'
                }`}>
                  {a.type === 'yangilik' ? '📰 Yangilik' : a.type === 'yangilanish' ? '🔄 Yangilanish' : '🚀 Yangi ilova'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.is_published ? 'bg-emerald-900/40 text-emerald-300' : 'bg-gray-800 text-gray-400'}`}>
                  {a.is_published ? '✓ Nashr etilgan' : '○ Nashr etilmagan'}
                </span>
                <span className={`text-xs ml-auto ${dm ? 'text-gray-600' : 'text-gray-400'}`}>{new Date(a.created_at).toLocaleDateString('uz-UZ')}</span>
              </div>
              <p className={`text-sm font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>{a.title}</p>
              <p className={`text-xs mt-1 line-clamp-2 ${textSub}`}>{a.body}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => togglePublish(a.id, a.is_published)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  a.is_published
                    ? dm ? 'bg-gray-800 text-gray-300 hover:bg-red-900/40 hover:text-red-300' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
                    : 'bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/70'
                }`}>
                {a.is_published ? 'Yashirish' : 'Nashr etish'}
              </button>
              <button onClick={() => deleteAnnouncement(a.id)}
                className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-900/30 transition">
                O&apos;chirish
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
