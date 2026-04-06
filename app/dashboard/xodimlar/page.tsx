'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDashboard } from '../context'
import { Modal, ModalActions } from '../_components/Modal'
import ConfirmModal from '../_components/ConfirmModal'
import { useToast } from '@/lib/toast'
import type { Employee } from '@/lib/types'
import { logAudit } from '@/lib/audit'

const emptyEmp = {
  ism: '', jshshir: '', passport: '', lavozim: '',
  bolim: '', maosh: '', ish_boshi: '', tel: '', status: 'active',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Faol',
  fired:  'Ishdan bo\'shagan',
}
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border border-green-500/30',
  fired:  'bg-red-900/30 text-red-400 border border-red-700/30',
}

export default function XodimlarPage() {
  const { activeOrg, employees, reloadEmployees } = useDashboard()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'fired'>('active')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState({ ...emptyEmp })
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

  const filtered = employees.filter(e => {
    if (statusFilter !== 'all' && (e.status || 'active') !== statusFilter) return false
    if (!search) return true
    const q = search.toLowerCase()
    return e.ism.toLowerCase().includes(q) ||
      (e.lavozim || '').toLowerCase().includes(q) ||
      (e.bolim || '').toLowerCase().includes(q) ||
      (e.jshshir || '').includes(q)
  })

  function openAdd() {
    setEditing(null)
    setForm({ ...emptyEmp })
    setModal(true)
  }

  function openEdit(emp: Employee) {
    setEditing(emp)
    setForm({
      ism: emp.ism, jshshir: emp.jshshir || '', passport: emp.passport || '',
      lavozim: emp.lavozim || '', bolim: emp.bolim || '',
      maosh: emp.maosh || '', ish_boshi: emp.ish_boshi || '',
      tel: emp.tel || '', status: emp.status || 'active',
    })
    setModal(true)
  }

  async function saveEmp(e: React.FormEvent) {
    e.preventDefault()
    if (!activeOrg) { toast("Tashkilot tanlanmagan", 'error'); return }
    if (!form.ism.trim()) { toast("F.I.O. majburiy", 'error'); return }
    setSaving(true)
    const payload = {
      ism: form.ism.trim(),
      jshshir: form.jshshir.trim() || null,
      passport: form.passport.trim() || null,
      lavozim: form.lavozim.trim() || null,
      bolim: form.bolim.trim() || null,
      maosh: form.maosh.trim() || null,
      ish_boshi: form.ish_boshi || null,
      tel: form.tel.trim() || null,
      status: form.status,
    }
    let err = null
    if (editing) {
      const { error } = await supabase.from('employees').update(payload).eq('id', editing.id).eq('organization_id', activeOrg.id)
      err = error
      if (!error) logAudit('update', 'employees', editing.id, { ism: payload.ism })
    } else {
      const { data: inserted, error } = await supabase.from('employees').insert({ ...payload, organization_id: activeOrg.id }).select('id').single()
      err = error
      if (!error && inserted) logAudit('create', 'employees', inserted.id, { ism: payload.ism })
    }
    setSaving(false)
    if (err) { toast('Xato: ' + err.message, 'error'); return }
    toast(editing ? 'Xodim tahrirlandi' : 'Xodim qo\'shildi', 'success')
    setModal(false)
    reloadEmployees()
  }

  async function doDelete(id: string) {
    const emp = employees.find(e => e.id === id)
    const { error } = await supabase.from('employees').delete().eq('id', id).eq('organization_id', activeOrg!.id)
    if (error) { toast('Xato: ' + error.message, 'error'); return }
    if (emp) logAudit('delete', 'employees', id, { ism: emp.ism })
    toast("Xodim o'chirildi", 'success')
    reloadEmployees()
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🧑‍💼 Xodimlar</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {employees.filter(e => (e.status || 'active') === 'active').length} ta faol xodim
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          + Xodim qo'shish
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism, lavozim, bo'lim yoki JSHSHIR…"
            className="w-full bg-[#111827] border border-[#1E293B] text-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'fired'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#111827] border border-[#1E293B] text-gray-400 hover:text-white'
              }`}>
              {s === 'all' ? 'Barchasi' : s === 'active' ? 'Faol' : "Ishdan bo'shagan"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">🧑‍💼</div>
          <p className="text-gray-400 font-medium">
            {search || statusFilter !== 'active' ? "Xodim topilmadi" : "Hali xodim qo'shilmagan"}
          </p>
          {!search && statusFilter === 'active' && (
            <button onClick={openAdd} className="mt-3 text-blue-400 text-sm hover:text-blue-300">
              Birinchi xodimni qo'shish →
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-8">№</th>
                <th className="px-4 py-3 text-left">F.I.O.</th>
                <th className="px-4 py-3 text-left">Lavozim</th>
                <th className="px-4 py-3 text-left">Bo'lim</th>
                <th className="px-4 py-3 text-left">Maosh</th>
                <th className="px-4 py-3 text-left">Telefon</th>
                <th className="px-4 py-3 text-center">Holat</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => (
                <tr key={emp.id}
                  className="border-t border-[#1E293B] hover:bg-[#1F2937] transition group cursor-pointer"
                  onClick={() => openEdit(emp)}>
                  <td className="px-4 py-3 text-gray-500 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-900/50 rounded-lg flex items-center justify-center text-blue-300 font-bold text-sm flex-shrink-0">
                        {emp.ism[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{emp.ism}</div>
                        {emp.jshshir && <div className="text-xs text-gray-500 font-mono">{emp.jshshir.slice(0, 4)}{'*'.repeat(Math.max(0, emp.jshshir.length - 6))}{emp.jshshir.slice(-2)}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{emp.lavozim || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{emp.bolim || '—'}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {emp.maosh ? `${Number(emp.maosh.replace(/\s/g, '')).toLocaleString()} so'm` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{emp.tel || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[emp.status || 'active']}`}>
                      {STATUS_LABEL[emp.status || 'active']}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openEdit(emp)}
                        className="p-1.5 bg-[#1F2937] hover:bg-blue-700 rounded text-xs text-gray-300" title="Tahrirlash">✎</button>
                      <button onClick={() => setConfirmDeleteId(emp.id)}
                        className="p-1.5 bg-[#1F2937] hover:bg-red-800 rounded text-xs text-gray-300" title="O'chirish">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#1E293B] text-xs text-gray-500">
            Jami: {filtered.length} ta xodim
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <Modal
          title={editing ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
          onClose={() => setModal(false)}>
          <form onSubmit={saveEmp} className="space-y-4">
            <div>
              <label className={lbl}>F.I.O. *</label>
              <input className={inp} required placeholder="Rahimov Bobur Aliyevich"
                value={form.ism} onChange={e => setForm({ ...form, ism: e.target.value })}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>JSHSHIR (14 raqam)</label>
                <input className={inp} placeholder="12345678901234" maxLength={14}
                  value={form.jshshir} onChange={e => setForm({ ...form, jshshir: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Pasport seriya/raqam</label>
                <input className={inp} placeholder="AB 1234567"
                  value={form.passport} onChange={e => setForm({ ...form, passport: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Lavozim</label>
                <input className={inp} placeholder="Dasturchi"
                  value={form.lavozim} onChange={e => setForm({ ...form, lavozim: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Bo'lim</label>
                <input className={inp} placeholder="IT bo'limi"
                  value={form.bolim} onChange={e => setForm({ ...form, bolim: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Maosh (so'm)</label>
                <input className={inp} placeholder="5 000 000"
                  value={form.maosh} onChange={e => setForm({ ...form, maosh: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Telefon</label>
                <input className={inp} placeholder="+998901234567"
                  value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Ishga kirgan sana</label>
                <input className={inp} type="date"
                  value={form.ish_boshi} onChange={e => setForm({ ...form, ish_boshi: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Holat</label>
                <select className={inp} value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Faol</option>
                  <option value="fired">Ishdan bo'shagan</option>
                </select>
              </div>
            </div>
            <ModalActions onClose={() => setModal(false)} saving={saving}/>
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message="Bu xodimni o'chirishni tasdiqlaysizmi?"
          onConfirm={() => { const id = confirmDeleteId; setConfirmDeleteId(null); doDelete(id) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}
