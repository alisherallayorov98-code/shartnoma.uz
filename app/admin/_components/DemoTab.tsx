'use client'

import type { DemoRow } from '../types'

interface Props {
  demos: DemoRow[]
  now: Date
  darkMode: boolean
  deactivateDemo: (id: string) => void
}

export default function DemoTab({ demos, now, darkMode, deactivateDemo }: Props) {
  const dm = darkMode
  const card = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const th = dm ? 'bg-gray-800/60 text-gray-400 border-gray-800' : 'bg-gray-50 text-gray-500 border-gray-200'
  const td = dm ? 'divide-gray-800/60' : 'divide-gray-100'
  const rowHover = dm ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'
  const textPrimary = dm ? 'text-white' : 'text-gray-900'
  const textSub = dm ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`border rounded-xl overflow-hidden ${card}`}>
      <table className="w-full">
        <thead>
          <tr className={`border-b ${th}`}>
            {['TASHKILOT','STR','BERILGAN','TUGASH','QOLGAN','IZOH','HOLAT','AMAL'].map(h => (
              <th key={h} className="text-left text-xs font-medium px-4 py-3 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${td}`}>
          {demos.length === 0 && (
            <tr><td colSpan={8} className={`px-4 py-10 text-center text-sm ${textSub}`}>Demo yo&apos;q</td></tr>
          )}
          {demos.map(d => {
            const exp = new Date(d.expires_at)
            const isExp = exp < now
            const dl = Math.ceil((exp.getTime() - now.getTime()) / 86400000)
            return (
              <tr key={d.id} className={`transition ${rowHover}`}>
                <td className={`px-4 py-3 text-sm font-medium ${textPrimary}`}>{d.org_name || '—'}</td>
                <td className={`px-4 py-3 text-sm font-mono ${textSub}`}>{d.org_inn || '—'}</td>
                <td className={`px-4 py-3 text-sm ${textSub}`}>{new Date(d.created_at).toLocaleDateString('uz-UZ')}</td>
                <td className={`px-4 py-3 text-sm ${isExp ? 'text-red-400' : textPrimary}`}>{exp.toLocaleDateString('uz-UZ')}</td>
                <td className="px-4 py-3 text-sm">
                  {d.is_active && !isExp
                    ? <span className="text-emerald-400 font-semibold">{dl} kun</span>
                    : <span className="text-red-400">Tugagan</span>}
                </td>
                <td className={`px-4 py-3 text-sm max-w-[140px] truncate ${textSub}`}>{d.note || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.is_active && !isExp ? 'bg-emerald-900 text-emerald-300' : 'bg-gray-700 text-gray-500'}`}>
                    {d.is_active && !isExp ? 'Faol' : 'Tugagan'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {d.is_active && !isExp && (
                    <button onClick={() => deactivateDemo(d.id)}
                      className="text-xs bg-red-900/50 hover:bg-red-800 text-red-400 px-2.5 py-1.5 rounded transition">
                      Bekor
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
