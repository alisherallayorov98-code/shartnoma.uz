'use client'

import type { Client, NewUser } from '../types'

interface Props {
  filteredNewUsers: NewUser[]
  clients: Client[]
  newDaysFilter: number
  setNewDaysFilter: (d: number) => void
  darkMode: boolean
  planBadge: (c: Client) => React.ReactNode
  activityColor: (d: string) => string
  activityLabel: (d: string) => string
}

export default function NewUsersTab({ filteredNewUsers, clients, newDaysFilter, setNewDaysFilter, darkMode, planBadge, activityColor, activityLabel }: Props) {
  const dm = darkMode
  const card = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const th = dm ? 'bg-gray-800/60 text-gray-400 border-gray-800' : 'bg-gray-50 text-gray-500 border-gray-200'
  const td = dm ? 'divide-gray-800/60' : 'divide-gray-100'
  const rowHover = dm ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'
  const textSub = dm ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        {[7, 14, 30].map(d => (
          <button key={d} onClick={() => setNewDaysFilter(d)}
            className={`px-4 py-1.5 rounded-lg text-sm transition ${newDaysFilter === d ? 'bg-blue-600 text-white' : dm ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-800'}`}>
            So&apos;nggi {d} kun
          </button>
        ))}
        <span className={`ml-auto text-xs ${textSub}`}>{filteredNewUsers.length} ta yangi foydalanuvchi</span>
      </div>

      <div className={`border rounded-xl overflow-hidden ${card}`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${th}`}>
              {["EMAIL","RO'YXATDAN O'TGAN","SO'NGI KIRISH","TASHKILOT","TARIF"].map(h => (
                <th key={h} className="text-left text-xs font-medium px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${td}`}>
            {filteredNewUsers.length === 0 && (
              <tr><td colSpan={5} className={`px-4 py-10 text-center text-sm ${textSub}`}>Yangi foydalanuvchi yo&apos;q</td></tr>
            )}
            {filteredNewUsers.map(u => {
              const org = clients.find(c => c.user_id === u.id)
              return (
                <tr key={u.id} className={`transition ${rowHover}`}>
                  <td className="px-4 py-3 text-sm text-blue-400">{u.email}</td>
                  <td className={`px-4 py-3 text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>{new Date(u.created_at).toLocaleDateString('uz-UZ')}</td>
                  <td className={`px-4 py-3 text-sm ${activityColor(u.last_sign_in_at)}`}>{activityLabel(u.last_sign_in_at)}</td>
                  <td className={`px-4 py-3 text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                    {org?.name || <span className={textSub}>Tashkilot qo&apos;shilmagan</span>}
                  </td>
                  <td className="px-4 py-3">{org ? planBadge(org) : <span className={`text-xs ${textSub}`}>—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
