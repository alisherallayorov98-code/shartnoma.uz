'use client'

import type { GlobalCompany } from '../types'

interface Props {
  globalCompanies: GlobalCompany[]
  globalSearch: string
  setGlobalSearch: (v: string) => void
  darkMode: boolean
  handleGlobalDelete: (inn: string) => void
}

export default function GlobalDbTab({ globalCompanies, globalSearch, setGlobalSearch, darkMode, handleGlobalDelete }: Props) {
  const dm = darkMode
  const card = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const th = dm ? 'text-gray-400 border-gray-800' : 'text-gray-500 border-gray-200'
  const td = dm ? 'border-gray-800/60' : 'border-gray-100'
  const rowHover = dm ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50'
  const textSub = dm ? 'text-gray-400' : 'text-gray-500'
  const searchBg = dm ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'

  const filtered = globalCompanies.filter(c =>
    !globalSearch || c.inn.includes(globalSearch) || c.name.toLowerCase().includes(globalSearch.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input value={globalSearch} onChange={e => setGlobalSearch(e.target.value)}
          placeholder="INN yoki nom bo'yicha qidirish..."
          className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 max-w-sm ${searchBg}`}/>
        <span className={`text-xs ml-auto ${textSub}`}>{globalCompanies.length} ta tashkilot</span>
      </div>

      <div className={`border rounded-xl overflow-hidden ${card}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-xs border-b ${th}`}>
              {['INN','Nomi','Rahbar','MFO','Hisob raqam','Manba',''].map((h, i) => (
                <th key={i} className="text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className={`border-b transition ${td} ${rowHover}`}>
                <td className={`px-4 py-3 font-mono text-xs ${textSub}`}>{c.inn}</td>
                <td className={`px-4 py-3 max-w-[200px] truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{c.name}</td>
                <td className={`px-4 py-3 text-xs ${textSub}`}>{c.director || '—'}</td>
                <td className={`px-4 py-3 font-mono text-xs ${textSub}`}>{c.mfo || '—'}</td>
                <td className={`px-4 py-3 font-mono text-xs ${textSub}`}>{c.account ? c.account.slice(0, 8) + '...' : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    c.source === 'manual' ? 'bg-emerald-900/40 text-emerald-400' :
                    c.source === 'soliq_api' ? 'bg-blue-900/40 text-blue-400' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {c.source === 'manual' ? 'Admin' : c.source === 'soliq_api' ? 'Soliq API' : 'Foydalanuvchi'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleGlobalDelete(c.inn)}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2 py-1 rounded transition">
                    O&apos;chirish
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className={`px-4 py-8 text-center text-sm ${textSub}`}>Hali ma&apos;lumot yo&apos;q</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
