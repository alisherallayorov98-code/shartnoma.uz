'use client'

import type { Payment } from '../types'

interface Props {
  payments: Payment[]
  totalRevenue: number
  now: Date
  darkMode: boolean
}

export default function PaymentsTab({ payments, totalRevenue, now, darkMode }: Props) {
  const dm = darkMode
  const card = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const th = dm ? 'bg-gray-800/60 text-gray-400 border-gray-800' : 'bg-gray-50 text-gray-500 border-gray-200'
  const td = dm ? 'divide-gray-800/60' : 'divide-gray-100'
  const rowHover = dm ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'
  const textSub = dm ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className={`border rounded-xl p-4 ${card}`}>
          <div className="text-2xl font-bold text-yellow-400">{totalRevenue.toLocaleString('uz-UZ')}</div>
          <div className={`text-xs mt-0.5 ${textSub}`}>Jami daromad (so&apos;m)</div>
        </div>
        <div className={`border rounded-xl p-4 ${card}`}>
          <div className="text-2xl font-bold text-blue-400">
            {payments.filter(p => new Date(p.created_at).getMonth() === now.getMonth()).length}
          </div>
          <div className={`text-xs mt-0.5 ${textSub}`}>Bu oy to&apos;lovlar</div>
        </div>
        <div className={`border rounded-xl p-4 ${card}`}>
          <div className="text-2xl font-bold text-emerald-400">
            {payments.filter(p => new Date(p.created_at).getMonth() === now.getMonth()).reduce((s, p) => s + p.amount, 0).toLocaleString('uz-UZ')}
          </div>
          <div className={`text-xs mt-0.5 ${textSub}`}>Bu oy daromad (so&apos;m)</div>
        </div>
      </div>

      <div className={`border rounded-xl overflow-hidden ${card}`}>
        <table className="w-full">
          <thead>
            <tr className={`border-b ${th}`}>
              {["TASHKILOT","MIQDOR","TARIF","IZOH","SANA"].map(h => (
                <th key={h} className="text-left text-xs font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${td}`}>
            {payments.length === 0 && (
              <tr><td colSpan={5} className={`px-4 py-10 text-center text-sm ${textSub}`}>To&apos;lovlar yo&apos;q</td></tr>
            )}
            {payments.map(p => (
              <tr key={p.id} className={`transition ${rowHover}`}>
                <td className={`px-4 py-3 text-sm font-medium ${dm ? 'text-white' : 'text-gray-900'}`}>{p.org_name || '—'}</td>
                <td className="px-4 py-3 text-sm text-yellow-400 font-semibold">{p.amount.toLocaleString('uz-UZ')} {p.currency}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.plan === 'ai_pro' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'}`}>
                    {p.plan === 'ai_pro' ? 'AI Pro' : 'Standart'}
                  </span>
                </td>
                <td className={`px-4 py-3 text-sm ${textSub}`}>{p.note || '—'}</td>
                <td className={`px-4 py-3 text-sm ${textSub}`}>{new Date(p.created_at).toLocaleDateString('uz-UZ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
