'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import ConfirmModal from '../_components/ConfirmModal'
import { useToast } from '@/lib/toast'
import type { Specification } from '@/lib/types'
import { generateSpecWord, generateSpecPDF, generateSpecExcel } from '@/lib/specExport'
import { formatDateUz } from '@/lib/contractStructures'
import { FileText, Plus, Download, Pencil, Trash2 } from 'lucide-react'

export default function SpesifikatsiyalarPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { activeOrg, contracts, cps, isFree, openUpgradeModal } = useDashboard()
  const { toast } = useToast()

  const [specs, setSpecs] = useState<Specification[]>([])
  const [search, setSearch] = useState('')
  const [filterCp, setFilterCp] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [viewSpec, setViewSpec] = useState<Specification | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [perPage, setPerPage] = useState(20)
  const [specPage, setSpecPage] = useState(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setSpecPage(1) }, [search, filterCp, filterYear])

  useEffect(() => {
    if (activeOrg) loadSpecs(activeOrg.id)
  }, [activeOrg?.id])

  async function loadSpecs(orgId: string) {
    const { data, error } = await supabase.from('specifications')
      .select('*, contracts(contract_number, contract_date, contract_type, counterparty_id, counterparties(name))')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
    if (error) { console.error('loadSpecs:', error.message); return }
    setSpecs(data || [])
  }

  function deleteSpec(id: string) {
    setConfirmDeleteId(id)
  }

  async function doDeleteSpec(id: string) {
    const { error } = await supabase.from('specifications').delete().eq('id', id)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    if (activeOrg) loadSpecs(activeOrg.id)
  }


  const specYears = useMemo(() => {
    const years = new Set(specs.map(s => s.created_at.slice(0, 4)))
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [specs])

  const specCpNames = useMemo(() => {
    const names = new Set(specs.map(s => s.contracts?.counterparties?.name).filter(Boolean) as string[])
    return Array.from(names).sort()
  }, [specs])

  const filteredSpecs = useMemo(() => {
    return specs.filter(s => {
      if (search) {
        const q = search.toLowerCase().replace(/^#/, '')
        const match = s.spec_number.toLowerCase().includes(q) ||
          (s.notes || '').toLowerCase().includes(q) ||
          (s.contracts?.contract_number || '').toLowerCase().includes(q) ||
          (s.contracts?.counterparties?.name || '').toLowerCase().includes(q)
        if (!match) return false
      }
      if (filterCp && s.contracts?.counterparties?.name !== filterCp) return false
      if (filterYear && !s.created_at.startsWith(filterYear)) return false
      return true
    })
  }, [specs, search, filterCp, filterYear])

  const specTotalPages = Math.max(1, Math.ceil(filteredSpecs.length / perPage))
  const safeSpecPage = Math.min(specPage, specTotalPages)
  const paginatedSpecs = filteredSpecs.slice((safeSpecPage - 1) * perPage, safeSpecPage * perPage)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600/15 border border-blue-600/20 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400"/>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Spesifikatsiyalar</h1>
            <p className="text-gray-500 text-xs mt-0.5">{specs.length} ta spesifikatsiya</p>
          </div>
        </div>
        {isFree && specs.length >= 5 ? (
          <button onClick={openUpgradeModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
            <Plus className="w-4 h-4"/> {T(t.specTab.newBtn)}
          </button>
        ) : (
          <Link href="/dashboard/spesifikatsiyalar/yangi"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
            <Plus className="w-4 h-4"/> {T(t.specTab.newBtn)}
          </Link>
        )}
      </div>

      {/* Search + Filters */}
      {specs.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Raqam, shartnoma, kontragent yoki izoh…"
              className="w-full bg-[#111827] border border-[#1E293B] text-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
          </div>
          {specCpNames.length > 1 && (
            <select value={filterCp} onChange={e => setFilterCp(e.target.value)}
              className="bg-[#111827] border border-[#1E293B] text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600">
              <option value="">Barcha kontragentlar</option>
              {specCpNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          {specYears.length > 1 && (
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
              className="bg-[#111827] border border-[#1E293B] text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600">
              <option value="">Barcha yillar</option>
              {specYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {(filterCp || filterYear) && (
            <button onClick={() => { setFilterCp(''); setFilterYear('') }}
              className="px-3 py-2 text-xs text-gray-400 hover:text-white bg-[#1F2937] border border-[#1E293B] rounded-lg transition">
              ✕ Tozalash
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {specs.length === 0 ? (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-16 text-center">
          <div className="w-14 h-14 bg-[#1F2937] border border-[#1E293B] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-gray-500"/>
          </div>
          <p className="text-gray-400 font-medium">{T(t.specTab.empty)}</p>
          <p className="text-gray-600 text-sm mt-1">{T(t.specTab.createNew)}</p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0F172A]">
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colNum)}</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colContract)}</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colCp)}</th>
                <th className="text-center px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colItems)}</th>
                <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colTotal)}</th>
                <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">{T(t.specTab.colDate)}</th>
                <th className="px-4 py-2.5 text-xs text-gray-400 font-medium text-right">{T(t.specTab.colActions)}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpecs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500 text-sm">Qidiruv bo'yicha natija topilmadi</td>
                </tr>
              ) : paginatedSpecs.map(spec => {
                const total = spec.items.reduce((s, it) => s + (it.summa || 0), 0)
                const contract = spec.contracts
                return (
                  <tr key={spec.id} className="border-t border-[#1E293B] hover:bg-[#1F2937] transition cursor-pointer"
                    onClick={() => setViewSpec(spec)}>
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-semibold text-white">#{spec.spec_number}</span>
                      {spec.notes && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[120px]">{spec.notes}</div>}
                    </td>
                    <td className="px-4 py-2.5">
                      {contract
                        ? <span className="text-xs bg-[#1F2937] text-blue-300 border border-[#1E293B] px-2 py-0.5 rounded-full">№{contract.contract_number}</span>
                        : <span className="text-xs text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-300 max-w-[150px] truncate">
                      {contract?.counterparties?.name || <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-xs bg-[#1F2937] text-gray-400 border border-[#1E293B] px-2 py-0.5 rounded-full">{spec.items.length} {T(t.specTab.items)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-white font-semibold text-sm">
                      {total.toLocaleString()} <span className="text-xs text-gray-500">{T(t.overviewTab.som)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">
                      {formatDateUz(spec.created_at.split('T')[0])}
                    </td>
                    <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => generateSpecWord(spec, activeOrg, cps)}
                          className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition font-medium">
                          <Download className="w-3 h-3"/> Word
                        </button>
                        <button onClick={() => generateSpecPDF(spec, activeOrg, cps)}
                          className="inline-flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg transition font-medium">
                          <Download className="w-3 h-3"/> PDF
                        </button>
                        <button onClick={() => generateSpecExcel(spec, activeOrg, cps)}
                          className="inline-flex items-center gap-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg transition font-medium">
                          <Download className="w-3 h-3"/> Excel
                        </button>
                        <Link href={`/dashboard/spesifikatsiyalar/yangi?id=${spec.id}`}
                          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-[#1F2937] transition">
                          <Pencil className="w-3 h-3"/>
                        </Link>
                        <button onClick={() => deleteSpec(spec.id)}
                          className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-900/20 transition">
                          <Trash2 className="w-3 h-3"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#1E293B] flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-gray-500">{filteredSpecs.length} ta spesifikatsiya</span>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span>Qatorlar:</span>
                {[20, 50, 100].map(n => (
                  <button key={n} onClick={() => { setPerPage(n); setSpecPage(1) }}
                    className={`px-2 py-0.5 rounded border transition ${perPage === n ? 'bg-blue-600 border-blue-600 text-white' : 'border-[#1E293B] bg-[#0F172A] text-gray-400 hover:text-white'}`}>
                    {n}
                  </button>
                ))}
              </div>
              {specTotalPages > 1 && (
                <div className="flex items-center gap-1 text-xs">
                  <button disabled={safeSpecPage <= 1} onClick={() => setSpecPage(p => p - 1)}
                    className="px-2 py-0.5 rounded border border-[#1E293B] bg-[#0F172A] text-gray-400 hover:text-white disabled:opacity-30 transition">‹</button>
                  {Array.from({ length: specTotalPages }, (_, i) => i + 1).filter(p => p === 1 || p === specTotalPages || Math.abs(p - safeSpecPage) <= 1).map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-600">…</span>}
                      <button onClick={() => setSpecPage(p)}
                        className={`px-2 py-0.5 rounded border transition ${safeSpecPage === p ? 'bg-blue-600 border-blue-600 text-white' : 'border-[#1E293B] bg-[#0F172A] text-gray-400 hover:text-white'}`}>
                        {p}
                      </button>
                    </span>
                  ))}
                  <button disabled={safeSpecPage >= specTotalPages} onClick={() => setSpecPage(p => p + 1)}
                    className="px-2 py-0.5 rounded border border-[#1E293B] bg-[#0F172A] text-gray-400 hover:text-white disabled:opacity-30 transition">›</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {viewSpec && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-white">Spesifikatsiya #{viewSpec.spec_number}</h2>
                {viewSpec.contracts?.counterparties?.name && (
                  <p className="text-xs text-gray-500 mt-0.5">{viewSpec.contracts.counterparties.name}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => generateSpecWord(viewSpec, activeOrg, cps)}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-semibold">📝 Word</button>
                <button onClick={() => generateSpecPDF(viewSpec, activeOrg, cps)}
                  className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-500 transition font-semibold">📄 PDF</button>
                <button onClick={() => generateSpecExcel(viewSpec, activeOrg, cps)}
                  className="px-3 py-1.5 text-xs bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition font-semibold">📊 Excel</button>
                <Link href={`/dashboard/spesifikatsiyalar/yangi?id=${viewSpec.id}`}
                  onClick={() => setViewSpec(null)}
                  className="px-3 py-1.5 text-xs bg-[#1F2937] border border-[#1E293B] text-gray-300 rounded-lg hover:text-white transition">
                  ✎ Tahrirlash
                </Link>
                <button onClick={() => setViewSpec(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition text-xl">×</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {viewSpec.contracts && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-[#0F172A] rounded-xl p-3 border border-[#1E293B]">
                    <p className="text-xs text-gray-500 mb-1">Shartnoma</p>
                    <p className="text-sm text-white font-medium">№{viewSpec.contracts.contract_number}</p>
                    <p className="text-xs text-gray-500">{viewSpec.contracts.contract_date}</p>
                  </div>
                  <div className="bg-[#0F172A] rounded-xl p-3 border border-[#1E293B]">
                    <p className="text-xs text-gray-500 mb-1">Kontragent</p>
                    <p className="text-sm text-white font-medium">{viewSpec.contracts.counterparties?.name || '—'}</p>
                  </div>
                </div>
              )}
              {viewSpec.notes && (
                <p className="text-xs text-gray-400 mb-4 bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2">{viewSpec.notes}</p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-[#1E293B]">
                      <th className="text-left pb-2 pr-2 w-7">№</th>
                      <th className="text-left pb-2 pr-2">Nomi</th>
                      <th className="text-left pb-2 pr-2">Birlik</th>
                      <th className="text-right pb-2 pr-2">Miqdor</th>
                      <th className="text-right pb-2 pr-2">Narx</th>
                      <th className="text-center pb-2 pr-2">QQS</th>
                      <th className="text-right pb-2">Jami</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewSpec.items.map((item, i) => (
                      <tr key={i} className="border-b border-[#1E293B]/50">
                        <td className="py-1.5 pr-2 text-gray-500">{i + 1}</td>
                        <td className="py-1.5 pr-2 text-gray-200">{item.nomi}</td>
                        <td className="py-1.5 pr-2 text-gray-400">{item.birlik}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-300">{item.miqdori}</td>
                        <td className="py-1.5 pr-2 text-right text-gray-300">{item.narxi.toLocaleString()}</td>
                        <td className="py-1.5 pr-2 text-center text-gray-400">{item.qqs_foiz === 'siz' ? 'QQSsiz' : item.qqs_foiz + '%'}</td>
                        <td className="py-1.5 text-right font-semibold text-white">{item.summa.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#1E293B]">
                      <td colSpan={6} className="pt-2 text-right text-gray-400 font-medium pr-2">Jami summa:</td>
                      <td className="pt-2 text-right text-white font-bold text-sm">
                        {viewSpec.items.reduce((s, it) => s + (it.summa || 0), 0).toLocaleString()} so'm
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message={T(t.msg.deleteSpecConfirm)}
          onConfirm={() => { const id = confirmDeleteId; setConfirmDeleteId(null); doDeleteSpec(id) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
