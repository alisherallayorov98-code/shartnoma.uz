'use client'

interface Contract {
  id: string; contract_number: string; contract_type: string
  status: string; amount: number; contract_date: string; created_at: string
  organization_id: string; organizations: { name: string; inn: string }
}

interface Props {
  allContracts: Contract[]
  contractSearch: string
  setContractSearch: (v: string) => void
  contractStatusFilter: string
  setContractStatusFilter: (v: string) => void
  loadAllContracts: () => void
  darkMode: boolean
}

const CONTRACT_TYPES_MAP: Record<string, string> = {
  oldi_sotdi: 'Oldi-sotdi', xizmat: 'Xizmat', ijara: 'Ijara', pudrat: 'Pudrat',
  qoshimcha: "Qo'shimcha", moliyaviy: 'Moliyaviy', daval: 'Daval', agentlik: 'Agentlik',
  transport: 'Transport', lizing: 'Lizing', xalqaro: 'Xalqaro', boshqa: 'Boshqa',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-900 text-emerald-300', draft: 'bg-gray-700 text-gray-400',
  completed: 'bg-blue-900 text-blue-300', cancelled: 'bg-red-900 text-red-300',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Faol', draft: 'Qoralama', completed: 'Bajarildi', cancelled: 'Bekor',
}

export default function ContractsTab({ allContracts, contractSearch, setContractSearch, contractStatusFilter, setContractStatusFilter, loadAllContracts, darkMode }: Props) {
  const dm = darkMode
  const card = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const th = dm ? 'bg-gray-800/60 text-gray-400 border-gray-800' : 'bg-gray-50 text-gray-500 border-gray-200'
  const td = dm ? 'divide-gray-800/60' : 'divide-gray-100'
  const rowHover = dm ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'
  const textSub = dm ? 'text-gray-400' : 'text-gray-500'
  const searchBg = dm ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300 text-gray-900'
  const filterBg = dm ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'

  const filtered = allContracts.filter(c => {
    const q = contractSearch.toLowerCase()
    const ms = !contractSearch || c.contract_number?.toLowerCase().includes(q) || (c.organizations as any)?.name?.toLowerCase().includes(q)
    const mst = contractStatusFilter === 'all' || c.status === contractStatusFilter
    return ms && mst
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={loadAllContracts}
          className={`text-xs px-3 py-1.5 rounded-lg transition ${dm ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
          🔄 Yangilash
        </button>
        <input value={contractSearch} onChange={e => setContractSearch(e.target.value)}
          placeholder="Raqam yoki tashkilot nomi..."
          className={`flex-1 max-w-xs border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 ${searchBg}`}/>
        <div className={`flex gap-1 border rounded-lg p-1 ${filterBg}`}>
          {[{k:'all',l:'Hammasi'},{k:'active',l:'Faol'},{k:'draft',l:'Qoralama'},{k:'completed',l:'Bajarildi'},{k:'cancelled',l:'Bekor'}].map(f => (
            <button key={f.k} onClick={() => setContractStatusFilter(f.k)}
              className={`px-3 py-1 rounded text-xs font-medium transition ${contractStatusFilter === f.k ? 'bg-blue-600 text-white' : `${textSub} hover:${dm ? 'text-white' : 'text-gray-800'}`}`}>
              {f.l}
            </button>
          ))}
        </div>
        <span className={`text-xs ml-auto ${textSub}`}>{filtered.length} ta</span>
      </div>

      <div className={`border rounded-xl overflow-hidden ${card}`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${th}`}>
              {['RAQAM','TASHKILOT','TUR','HOLAT','SUMMA','SANA'].map(h => (
                <th key={h} className="text-left text-xs font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${td}`}>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className={`px-4 py-10 text-center text-sm ${textSub}`}>Topilmadi</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className={`transition ${rowHover}`}>
                <td className={`px-4 py-3 text-sm font-mono ${textSub}`}>{c.contract_number || '—'}</td>
                <td className="px-4 py-3">
                  <div className={`text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{(c.organizations as any)?.name || '—'}</div>
                  <div className={`text-xs font-mono ${textSub}`}>{(c.organizations as any)?.inn}</div>
                </td>
                <td className={`px-4 py-3 text-sm ${textSub}`}>{CONTRACT_TYPES_MAP[c.contract_type] || c.contract_type}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] || 'bg-gray-700 text-gray-400'}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-yellow-400">
                  {c.amount ? Number(c.amount).toLocaleString('uz-UZ') + " so'm" : '—'}
                </td>
                <td className={`px-4 py-3 text-sm ${textSub}`}>{new Date(c.created_at).toLocaleDateString('uz-UZ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
