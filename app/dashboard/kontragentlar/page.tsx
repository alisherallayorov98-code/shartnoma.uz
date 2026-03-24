'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { Modal, ModalActions } from '../_components/Modal'
import ConfirmModal from '../_components/ConfirmModal'
import { useToast } from '@/lib/toast'
import type { Counterparty } from '@/lib/types'

const emptyCp = { name: '', inn: '', director_name: '', bank_name: '', bank_account: '', mfo: '', address: '', phone: '', qqsreg: '' }

export default function KontragentlarPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { cps, contracts, reloadCps } = useDashboard()
  const { toast } = useToast()

  const [cpSearch, setCpSearch] = useState('')
  const [editingCp, setEditingCp] = useState<Counterparty | null>(null)
  const [cpForm, setCpForm] = useState(emptyCp)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [cpDetail, setCpDetail] = useState<Counterparty | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filteredCps = cps.filter(cp =>
    cp.name.toLowerCase().includes(cpSearch.toLowerCase()) ||
    (cp.inn || '').includes(cpSearch) ||
    (cp.director_name || '').toLowerCase().includes(cpSearch.toLowerCase())
  )

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

  async function saveCp(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!cpForm.name.trim()) { toast(T(t.msg.nameRequired), 'error'); setSaving(false); return }
    if (cpForm.inn && !/^\d{9}$/.test(cpForm.inn)) { toast(T(t.msg.innInvalid), 'error'); setSaving(false); return }
    if (cpForm.mfo && !/^\d{5}$/.test(cpForm.mfo)) { toast(T(t.msg.mfoInvalid), 'error'); setSaving(false); return }
    if (cpForm.bank_account && !/^\d{20}$/.test(cpForm.bank_account)) { toast(T(t.msg.accountInvalid), 'error'); setSaving(false); return }
    const { data: { session } } = await supabase.auth.getSession()
    let cpErr = null
    if (editingCp) {
      const { error } = await supabase.from('counterparties').update(cpForm).eq('id', editingCp.id)
      cpErr = error; setEditingCp(null)
    } else {
      const { error } = await supabase.from('counterparties').insert({ ...cpForm, user_id: session!.user.id })
      cpErr = error
    }
    setSaving(false)
    if (cpErr) { toast(`${T(t.msg.errorPrefix)}: ${cpErr.message}`, 'error'); return }
    setModal(false); setCpForm(emptyCp); reloadCps()
  }

  async function deleteCp(id: string) {
    setConfirmDeleteId(id)
  }

  async function doDeleteCp(id: string) {
    const { error } = await supabase.from('counterparties').delete().eq('id', id)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    setCpDetail(null); reloadCps(); setEditingCp(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🤝 {T(t.cp.title)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{cps.length} ta kontragent</p>
        </div>
        <button onClick={() => { setEditingCp(null); setCpForm(emptyCp); setModal(true) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          + {T(t.cpTab.addBtn)}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input value={cpSearch} onChange={e => setCpSearch(e.target.value)}
          placeholder={T(t.cpTab.searchPlaceholder)}
          className="w-full bg-[#111827] border border-[#1E293B] text-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
      </div>

      {/* Table or empty */}
      {filteredCps.length === 0 ? (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <p className="text-gray-400 font-medium">{cpSearch ? T(t.cpTab.noFound) : T(t.cpTab.noAdded)}</p>
          {!cpSearch && (
            <button onClick={() => { setEditingCp(null); setCpForm(emptyCp); setModal(true) }}
              className="mt-3 text-blue-400 text-sm hover:text-blue-300">
              {T(t.cpTab.addBtn)}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-8">№</th>
                <th className="px-4 py-3 text-left">{T(t.cpTab.colName)}</th>
                <th className="px-4 py-3 text-left">{T(t.cpTab.colInn)}</th>
                <th className="px-4 py-3 text-left">{T(t.cpTab.colDirector)}</th>
                <th className="px-4 py-3 text-left">{T(t.cpTab.colBank)}</th>
                <th className="px-4 py-3 text-left">{T(t.cpTab.colMfo)}</th>
                <th className="px-4 py-3 text-center">{T(t.cpTab.colContracts)}</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCps.map((cp, idx) => {
                const cpContracts = contracts.filter(c => c.counterparty_id === cp.id).length
                return (
                  <tr key={cp.id}
                    className="border-t border-[#1E293B] hover:bg-[#1F2937] cursor-pointer transition group"
                    onClick={() => setCpDetail(cp)}>
                    <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-900/60 rounded-lg flex items-center justify-center text-orange-300 font-bold text-sm flex-shrink-0">
                          {cp.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{cp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cp.inn || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{cp.director_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{cp.bank_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{cp.mfo || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {cpContracts > 0
                        ? <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded-full">{cpContracts}</span>
                        : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => {
                          setEditingCp(cp)
                          setCpForm({ name: cp.name, inn: cp.inn, director_name: cp.director_name, bank_name: cp.bank_name, bank_account: cp.bank_account, mfo: cp.mfo, address: cp.address, phone: cp.phone || '', qqsreg: cp.qqsreg || '' })
                          setModal(true)
                        }} className="p-1.5 bg-[#1F2937] hover:bg-blue-700 rounded text-xs text-gray-300" title="Tahrirlash">✎</button>
                        <button onClick={() => deleteCp(cp.id)}
                          className="p-1.5 bg-[#1F2937] hover:bg-red-800 rounded text-xs text-gray-300" title="O'chirish">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#1E293B] text-xs text-gray-500">
            {T(t.cpTab.total)}: {filteredCps.length} {T(t.cpTab.contacts)}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {cpDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCpDetail(null)}>
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-orange-900/60 rounded-2xl flex items-center justify-center text-orange-300 font-bold text-2xl">
                {cpDetail.name[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{cpDetail.name}</h2>
                {cpDetail.inn && <p className="text-xs text-gray-500 mt-0.5">INN: {cpDetail.inn}</p>}
              </div>
              <button onClick={() => setCpDetail(null)} className="ml-auto w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-lg hover:bg-[#1F2937] text-xl">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Direktor', cpDetail.director_name],
                ['Bank', cpDetail.bank_name],
                ['Hisob raqami', cpDetail.bank_account],
                ['MFO', cpDetail.mfo],
                ['Manzil', cpDetail.address],
                ['Telefon', cpDetail.phone],
                ['QQS', cpDetail.qqsreg],
              ].map(([label, val]) => val ? (
                <div key={label}>
                  <span className="text-gray-500 text-xs">{label}: </span>
                  <span className="text-gray-300">{val}</span>
                </div>
              ) : null)}
            </div>
            <div className="flex gap-3 mt-5 pt-4 border-t border-[#1E293B]">
              <button onClick={() => {
                setEditingCp(cpDetail)
                setCpForm({ name: cpDetail.name, inn: cpDetail.inn, director_name: cpDetail.director_name, bank_name: cpDetail.bank_name, bank_account: cpDetail.bank_account, mfo: cpDetail.mfo, address: cpDetail.address, phone: cpDetail.phone || '', qqsreg: cpDetail.qqsreg || '' })
                setCpDetail(null); setModal(true)
              }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition">
                Tahrirlash
              </button>
              <button onClick={() => deleteCp(cpDetail.id)}
                className="px-4 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm transition">
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <Modal title={editingCp ? "Kontragentni tahrirlash" : T(t.cp.new)} onClose={() => { setModal(false); setEditingCp(null); setCpForm(emptyCp) }}>
          <form onSubmit={saveCp} className="space-y-4">
            <div>
              <label className={lbl}>Kontragent nomi *</label>
              <input className={inp} required placeholder="Beta Savdo MChJ" value={cpForm.name} onChange={e => setCpForm({ ...cpForm, name: e.target.value })}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>STIR (INN)</label>
                <input className={inp} placeholder="123456789" maxLength={9} value={cpForm.inn} onChange={e => setCpForm({ ...cpForm, inn: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Direktor F.I.Sh</label>
                <input className={inp} placeholder="Rahimov Jasur" value={cpForm.director_name} onChange={e => setCpForm({ ...cpForm, director_name: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Bank nomi</label>
                <input className={inp} placeholder="Xalq banki" value={cpForm.bank_name} onChange={e => setCpForm({ ...cpForm, bank_name: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Hisob raqami</label>
                <input className={inp} placeholder="20208000000000000000" maxLength={20} value={cpForm.bank_account} onChange={e => setCpForm({ ...cpForm, bank_account: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>MFO</label>
                <input className={inp} placeholder="00873" maxLength={5} value={cpForm.mfo} onChange={e => setCpForm({ ...cpForm, mfo: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Telefon</label>
                <input className={inp} placeholder="+998901234567" value={cpForm.phone} onChange={e => setCpForm({ ...cpForm, phone: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>QQS ro'yxat raqami</label>
                <input className={inp} placeholder="318060007067" value={cpForm.qqsreg} onChange={e => setCpForm({ ...cpForm, qqsreg: e.target.value })}/>
              </div>
            </div>
            <div>
              <label className={lbl}>Manzil</label>
              <input className={inp} placeholder="Toshkent shahri, ..." value={cpForm.address} onChange={e => setCpForm({ ...cpForm, address: e.target.value })}/>
            </div>
            <ModalActions onClose={() => { setModal(false); setEditingCp(null); setCpForm(emptyCp) }} saving={saving}/>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message={T(t.msg.deleteCpConfirm)}
          onConfirm={() => { const id = confirmDeleteId; setConfirmDeleteId(null); doDeleteCp(id) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
