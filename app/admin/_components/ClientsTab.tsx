'use client'

import type { Client } from '../types'

interface Props {
  clients: Client[]
  filtered: Client[]
  saving: string
  search: string
  setSearch: (v: string) => void
  planFilter: string
  setPlanFilter: (v: string) => void
  now: Date
  darkMode: boolean
  giveSubscription: (orgId: string, userId: string, plan: string, months: number) => void
  deactivateSubscription: (subId: string, orgName: string) => void
  setEditClient: (c: Client) => void
  setEditForm: (f: { plan: string; period_end: string; is_active: boolean }) => void
  setNoteClient: (c: Client) => void
  setNoteText: (t: string) => void
  setDemoForm: React.Dispatch<React.SetStateAction<{ orgId: string; days: string; note: string }>>
  setDemoSearch: (s: string) => void
  setAddDemoModal: (v: boolean) => void
  planBadge: (c: Client) => React.ReactNode
  activityColor: (d: string) => string
  activityLabel: (d: string) => string
}

export default function ClientsTab({
  clients, filtered, saving, search, setSearch, planFilter, setPlanFilter,
  now, darkMode, giveSubscription, deactivateSubscription,
  setEditClient, setEditForm, setNoteClient, setNoteText,
  setDemoForm, setDemoSearch, setAddDemoModal,
  planBadge, activityColor, activityLabel,
}: Props) {
  const dm = darkMode
  const card = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const th = dm ? 'bg-gray-800/60 text-gray-400 border-gray-800' : 'bg-gray-50 text-gray-500 border-gray-200'
  const td = dm ? 'border-gray-800/60' : 'border-gray-100'
  const rowHover = dm ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'
  const textPrimary = dm ? 'text-white' : 'text-gray-900'
  const textSub = dm ? 'text-gray-400' : 'text-gray-500'
  const searchBg = dm ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
  const filterBg = dm ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'
  const filterActive = 'bg-blue-600 text-white'
  const filterIdle = dm ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'

  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${textSub}`}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Email, tashkilot, STR..."
            className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${searchBg}`}/>
        </div>
        <div className={`flex gap-1 border rounded-lg p-1 ${filterBg}`}>
          {[{k:'all',l:'Hammasi'},{k:'paid',l:"To'lovli"},{k:'free',l:'Bepul'},{k:'demo',l:'Demo'}].map(f => (
            <button key={f.k} onClick={() => setPlanFilter(f.k)}
              className={`px-3 py-1 rounded text-xs font-medium transition ${planFilter === f.k ? filterActive : filterIdle}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className={`border rounded-xl overflow-hidden ${card}`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${th}`}>
              {['TASHKILOT / EMAIL','TARIF','MUDDAT','FAOLLIK','SHARTNOMA','IZOH','TEZKOR AMAL','⚙️'].map(h => (
                <th key={h} className="text-left text-xs font-medium px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${td}`}>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className={`px-4 py-10 text-center text-sm ${textSub}`}>Topilmadi</td></tr>
            )}
            {filtered.map(c => {
              const isExpired = c.period_end && new Date(c.period_end) < now
              const dl = c.period_end ? Math.ceil((new Date(c.period_end).getTime() - now.getTime()) / 86400000) : null
              const isBusy = saving.startsWith(c.id) || saving === 'edit'
              return (
                <tr key={c.id} className={`transition ${rowHover}`}>
                  <td className="px-4 py-3">
                    <div className={`text-sm font-bold ${textPrimary}`}>{c.name || "(nomi yo'q)"}</div>
                    <div className="text-xs text-blue-400">{c.user_email || '—'}</div>
                    {c.inn && <div className={`text-xs font-mono ${textSub}`}>STR: {c.inn}</div>}
                  </td>
                  <td className="px-4 py-3">{planBadge(c)}</td>
                  <td className="px-4 py-3 text-sm">
                    {c.demo_active && c.demo_expires ? (
                      <span className="text-orange-400">Demo: {Math.ceil((new Date(c.demo_expires).getTime() - now.getTime()) / 86400000)} kun</span>
                    ) : c.period_end && c.is_active ? (
                      <span className={isExpired ? 'text-red-400' : dl && dl <= 7 ? 'text-yellow-400' : textPrimary}>
                        {isExpired ? `${Math.abs(dl!)} kun o'tdi` : `${dl} kun qoldi`}
                        <div className={`text-xs ${textSub}`}>{new Date(c.period_end).toLocaleDateString('uz-UZ')}</div>
                      </span>
                    ) : <span className={textSub}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-xs font-medium ${activityColor(c.last_login)}`}>{activityLabel(c.last_login)}</div>
                    {c.last_contract && (
                      <div className={`text-xs ${textSub}`}>Shartnoma: {activityLabel(c.last_contract)}</div>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-sm ${textSub}`}>{c.contracts_count} ta</td>
                  <td className="px-4 py-3">
                    {c.admin_note ? (
                      <div className={`text-xs max-w-[120px] truncate ${textSub}`} title={c.admin_note}>{c.admin_note}</div>
                    ) : (
                      <span className={`text-xs opacity-30 ${textSub}`}>—</span>
                    )}
                    <button onClick={() => { setNoteClient(c); setNoteText(c.admin_note) }}
                      className={`text-xs mt-0.5 block transition hover:text-blue-400 ${textSub}`}>✏️ tahrir</button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <button disabled={isBusy} onClick={() => giveSubscription(c.id, c.user_id, 'standard', 1)}
                        className="text-xs bg-blue-900/70 hover:bg-blue-800 disabled:opacity-40 text-blue-300 px-2 py-1 rounded transition">+1 oy</button>
                      <button disabled={isBusy} onClick={() => giveSubscription(c.id, c.user_id, 'standard', 3)}
                        className="text-xs bg-blue-900/70 hover:bg-blue-800 disabled:opacity-40 text-blue-300 px-2 py-1 rounded transition">+3 oy</button>
                      <button disabled={isBusy} onClick={() => giveSubscription(c.id, c.user_id, 'ai_pro', 1)}
                        className="text-xs bg-purple-900/70 hover:bg-purple-800 disabled:opacity-40 text-purple-300 px-2 py-1 rounded transition">AI Pro</button>
                      <button disabled={isBusy} onClick={() => { setDemoForm(f => ({ ...f, orgId: c.id })); setDemoSearch(c.name); setAddDemoModal(true) }}
                        className="text-xs bg-orange-900/70 hover:bg-orange-800 disabled:opacity-40 text-orange-300 px-2 py-1 rounded transition">🎯</button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => {
                        setEditClient(c)
                        setEditForm({ plan: c.plan || 'standard', period_end: c.period_end ? c.period_end.split('T')[0] : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], is_active: c.is_active ?? true })
                      }}
                        className={`text-xs px-2.5 py-1 rounded transition ${dm ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>✏️</button>
                      {c.sub_id && c.is_active && !isExpired && (
                        <button disabled={isBusy} onClick={() => deactivateSubscription(c.sub_id!, c.name)}
                          className="text-xs bg-red-900/50 hover:bg-red-800 disabled:opacity-40 text-red-400 px-2.5 py-1 rounded transition">🚫</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
