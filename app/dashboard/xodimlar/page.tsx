'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDashboard } from '../context'
import { Modal, ModalActions } from '../_components/Modal'
import ConfirmModal from '../_components/ConfirmModal'
import { useToast } from '@/lib/toast'
import type { Employee } from '@/lib/types'
import { logAudit } from '@/lib/audit'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'

const emptyEmp = {
  ism: '', jshshir: '', passport: '', lavozim: '',
  bolim: '', maosh: '', ish_boshi: '', tel: '',
  tugilgan_sana: '', manzil: '', status: 'active',
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border border-green-500/30',
  fired:  'bg-red-900/30 text-red-400 border border-red-700/30',
}

const PAGE_SIZE = 25

// ── Validators ────────────────────────────────────────────────────────────
const RX_JSHSHIR = /^\d{14}$/
const RX_PASSPORT = /^[A-Z]{2}\s?\d{7}$/
const RX_PHONE = /^\+?998\d{9}$/
const RX_NUMBER = /^[\d\s]+$/

function maskJshshir(j: string): string {
  if (!j) return ''
  if (j.length < 7) return j
  return `${j.slice(0, 4)}${'*'.repeat(j.length - 6)}${j.slice(-2)}`
}

function formatMaosh(raw: string): string {
  if (!raw) return '—'
  const num = Number(raw.replace(/\s/g, ''))
  if (!Number.isFinite(num)) return '—'
  return num.toLocaleString()
}

type SortKey = 'ism' | 'lavozim' | 'bolim' | 'maosh' | 'status'

export default function XodimlarPage() {
  const { activeOrg, employees, reloadEmployees } = useDashboard()
  const { toast } = useToast()
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const STATUS_LABEL: Record<string, string> = {
    active: T(t.empPage.statusActive),
    fired:  T(t.empPage.statusFired),
  }

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'fired'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('ism')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(false)
  const [viewModal, setViewModal] = useState<Employee | null>(null)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [form, setForm] = useState({ ...emptyEmp })
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [jshshirLoading, setJshshirLoading] = useState(false)

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

  const countActive = useMemo(() => employees.filter(e => (e.status || 'active') === 'active').length, [employees])
  const countFired = useMemo(() => employees.filter(e => e.status === 'fired').length, [employees])
  const avgSalary = useMemo(() => {
    const vals = employees
      .filter(e => (e.status || 'active') === 'active')
      .map(e => Number((e.maosh || '').replace(/\s/g, '')))
      .filter(n => Number.isFinite(n) && n > 0)
    if (!vals.length) return 0
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  }, [employees])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const list = employees.filter(e => {
      if (statusFilter !== 'all' && (e.status || 'active') !== statusFilter) return false
      if (!q) return true
      return e.ism.toLowerCase().includes(q) ||
        (e.lavozim || '').toLowerCase().includes(q) ||
        (e.bolim || '').toLowerCase().includes(q) ||
        (e.jshshir || '').includes(q)
    })
    list.sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      if (sortKey === 'maosh') {
        va = Number((a.maosh || '').replace(/\s/g, '')) || 0
        vb = Number((b.maosh || '').replace(/\s/g, '')) || 0
      } else {
        va = (a[sortKey] as string) || ''
        vb = (b[sortKey] as string) || ''
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [employees, search, statusFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  function headerCellClass(k: SortKey) {
    return `px-4 py-3 text-left cursor-pointer select-none hover:text-white transition ${sortKey === k ? 'text-white' : ''}`
  }

  function sortArrow(k: SortKey) {
    if (sortKey !== k) return <span className="opacity-30 ml-1">↕</span>
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

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
      tel: emp.tel || '',
      tugilgan_sana: emp.tugilgan_sana || '', manzil: emp.manzil || '',
      status: emp.status || 'active',
    })
    setViewModal(null)
    setModal(true)
  }

  async function saveEmp(e: React.FormEvent) {
    e.preventDefault()
    if (!activeOrg) { toast(T(t.msg.selectOrg), 'error'); return }
    if (!form.ism.trim()) { toast(T(t.empPage.fioRequired), 'error'); return }
    if (!form.lavozim.trim()) { toast(T(t.empPage.positionRequired), 'error'); return }
    if (form.jshshir.trim() && !RX_JSHSHIR.test(form.jshshir.trim())) {
      toast(T(t.empPage.jshshirInvalid), 'error'); return
    }
    if (form.passport.trim() && !RX_PASSPORT.test(form.passport.trim().toUpperCase())) {
      toast(T(t.empPage.passportInvalid), 'error'); return
    }
    if (form.tel.trim() && !RX_PHONE.test(form.tel.trim().replace(/[\s()-]/g, ''))) {
      toast(T(t.empPage.phoneInvalid), 'error'); return
    }
    if (form.maosh.trim() && !RX_NUMBER.test(form.maosh.trim())) {
      toast(T(t.empPage.salaryInvalid), 'error'); return
    }
    setSaving(true)
    const payload = {
      ism: form.ism.trim(),
      jshshir: form.jshshir.trim() || null,
      passport: form.passport.trim().toUpperCase() || null,
      lavozim: form.lavozim.trim() || null,
      bolim: form.bolim.trim() || null,
      maosh: form.maosh.replace(/\s/g, '').trim() || null,
      ish_boshi: form.ish_boshi || null,
      tel: form.tel.trim() || null,
      tugilgan_sana: form.tugilgan_sana || null,
      manzil: form.manzil.trim() || null,
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
    if (err) { toast(`${T(t.msg.errorPrefix)}: ${err.message}`, 'error'); return }
    toast(editing ? T(t.empPage.edited) : T(t.empPage.added), 'success')
    setModal(false)
    reloadEmployees()
  }

  async function doDelete(id: string) {
    const emp = employees.find(e => e.id === id)
    const { error } = await supabase.from('employees').delete().eq('id', id).eq('organization_id', activeOrg!.id)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    if (emp) logAudit('delete', 'employees', id, { ism: emp.ism })
    toast(T(t.empPage.deleted), 'success')
    setModal(false)
    setViewModal(null)
    reloadEmployees()
  }

  async function lookupJshshir() {
    const jshshir = form.jshshir.trim()
    if (!jshshir || !RX_JSHSHIR.test(jshshir)) {
      toast(T(t.empPage.jshshirInvalid), 'error'); return
    }
    setJshshirLoading(true)
    try {
      const res = await fetch(`/api/jshshir?jshshir=${jshshir}`)
      const data = await res.json()
      if (!res.ok) { toast(data.error || T(t.empPage.notFoundById), 'error'); return }
      const p = data.person
      setForm(prev => ({
        ...prev,
        ism: p.full_name || prev.ism,
        manzil: p.address || prev.manzil,
      }))
      const infoParts: string[] = []
      if (p.full_name) infoParts.push(p.full_name)
      if (p.status === 'active') infoParts.push(`✓ ${T(t.empPage.statusActive)}`)
      else if (p.status === 'inactive') infoParts.push(`⚠ ${T(t.status.cancelled)}`)
      if (p.address) infoParts.push(p.address)
      toast(infoParts.length ? infoParts.join(' | ') : T(t.empPage.dataFilled), p.status === 'inactive' ? 'error' : 'success')
    } catch {
      toast(T(t.empPage.lookupError), 'error')
    } finally {
      setJshshirLoading(false)
    }
  }

  const statusCountLabel = statusFilter === 'fired'
    ? `${countFired} ${T(t.empPage.statusFired).toLowerCase()}`
    : statusFilter === 'active'
    ? `${countActive} ${T(t.empPage.activeCount)}`
    : `${employees.length} ${T(t.empPage.taXodim)}`

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{T(t.empPage.title)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{statusCountLabel}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          {T(t.empPage.addBtn)}
        </button>
      </div>

      {/* Stats */}
      {employees.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl px-4 py-3">
            <div className="text-xs text-gray-500">{T(t.empPage.statusActive)}</div>
            <div className="text-lg font-bold text-green-400">{countActive}</div>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl px-4 py-3">
            <div className="text-xs text-gray-500">{T(t.empPage.statusFired)}</div>
            <div className="text-lg font-bold text-red-400">{countFired}</div>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl px-4 py-3 col-span-2 sm:col-span-1">
            <div className="text-xs text-gray-500">{T(t.empPage.statsAvg)}</div>
            <div className="text-lg font-bold text-blue-400">
              {avgSalary ? `${avgSalary.toLocaleString()} ${T(t.empPage.sum)}` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={T(t.empPage.searchPlaceholder)}
            className="w-full bg-[#111827] border border-[#1E293B] text-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"/>
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'fired'] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#111827] border border-[#1E293B] text-gray-400 hover:text-white'
              }`}>
              {s === 'all' ? T(t.empPage.statusAll) : s === 'active' ? T(t.empPage.statusActive) : T(t.empPage.statusFired)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">🧑‍💼</div>
          <p className="text-gray-400 font-medium">
            {employees.length === 0 ? T(t.empPage.emptyFirst) : T(t.empPage.empty)}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {search && (
              <button onClick={() => setSearch('')} type="button"
                className="px-4 py-2 bg-[#1F2937] hover:bg-[#2A3441] text-gray-300 text-sm rounded-lg transition">
                {T(t.empPage.clearSearch)}
              </button>
            )}
            <button onClick={openAdd} type="button"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition font-medium">
              {employees.length === 0 ? T(t.empPage.addFirst) : T(t.empPage.addNewBtn)}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left w-8">№</th>
                <th className={headerCellClass('ism')} onClick={() => toggleSort('ism')}>{T(t.empPage.colFio)}{sortArrow('ism')}</th>
                <th className={headerCellClass('lavozim')} onClick={() => toggleSort('lavozim')}>{T(t.empPage.colPosition)}{sortArrow('lavozim')}</th>
                <th className={headerCellClass('bolim')} onClick={() => toggleSort('bolim')}>{T(t.empPage.colDept)}{sortArrow('bolim')}</th>
                <th className={headerCellClass('maosh')} onClick={() => toggleSort('maosh')}>{T(t.empPage.colSalary)}{sortArrow('maosh')}</th>
                <th className="px-4 py-3 text-left">{T(t.empPage.colPhone)}</th>
                <th className={`${headerCellClass('status')} text-center`} onClick={() => toggleSort('status')}>{T(t.empPage.colStatus)}{sortArrow('status')}</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((emp, idx) => (
                <tr key={emp.id}
                  className="border-t border-[#1E293B] hover:bg-[#1F2937] transition group cursor-pointer"
                  onClick={() => setViewModal(emp)}>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(pageSafe - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-900/50 rounded-lg flex items-center justify-center text-blue-300 font-bold text-sm flex-shrink-0">
                        {emp.ism[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-white">{emp.ism}</div>
                        {emp.jshshir && <div className="text-xs text-gray-500 font-mono">{maskJshshir(emp.jshshir)}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{emp.lavozim || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{emp.bolim || '—'}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">
                    {emp.maosh ? `${formatMaosh(emp.maosh)} ${T(t.empPage.sum)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{emp.tel || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[emp.status || 'active']}`}>
                      {STATUS_LABEL[emp.status || 'active']}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => setViewModal(emp)} type="button"
                        className="p-1.5 bg-[#1F2937] hover:bg-slate-600 rounded text-xs text-gray-300" title={T(t.empPage.viewBtn)}>👁</button>
                      <button onClick={() => openEdit(emp)} type="button"
                        className="p-1.5 bg-[#1F2937] hover:bg-blue-700 rounded text-xs text-gray-300" title="Tahrirlash">✎</button>
                      <button onClick={() => setConfirmDeleteId(emp.id)} type="button"
                        className="p-1.5 bg-[#1F2937] hover:bg-red-800 rounded text-xs text-gray-300" title={T(t.empPage.deleteBtn)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="px-4 py-3 border-t border-[#1E293B] flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
            <div>{T(t.empPage.total)}: {filtered.length} {T(t.empPage.taXodim)}</div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageSafe <= 1}
                  className="px-2 py-1 bg-[#1F2937] hover:bg-[#2A3441] disabled:opacity-30 rounded">←</button>
                <span>{pageSafe} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}
                  className="px-2 py-1 bg-[#1F2937] hover:bg-[#2A3441] disabled:opacity-30 rounded">→</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View modal */}
      {viewModal && (
        <Modal title={viewModal.ism} onClose={() => setViewModal(null)}>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label={T(t.empPage.jshshirLabel)} value={viewModal.jshshir} />
              <Info label={T(t.empPage.passportLabel)} value={viewModal.passport} />
              <Info label={T(t.empPage.positionLabel)} value={viewModal.lavozim} />
              <Info label={T(t.empPage.deptLabel)} value={viewModal.bolim} />
              <Info label={T(t.empPage.salaryLabel)} value={viewModal.maosh ? `${formatMaosh(viewModal.maosh)} ${T(t.empPage.sum)}` : ''} />
              <Info label={T(t.empPage.phoneLabel)} value={viewModal.tel} />
              <Info label={T(t.empPage.startDateLabel)} value={viewModal.ish_boshi} />
              <Info label={T(t.empPage.birthDateLabel)} value={viewModal.tugilgan_sana} />
              <Info label={T(t.empPage.addressLabel)} value={viewModal.manzil} />
              <Info label={T(t.empPage.statusLabel)} value={STATUS_LABEL[viewModal.status || 'active']} />
            </div>
            <div className="flex gap-2 pt-2 border-t border-[#1E293B]">
              <button type="button" onClick={() => openEdit(viewModal)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                ✎ {T(t.empPage.editModal).split(' ')[0]}
              </button>
              <button type="button" onClick={() => setConfirmDeleteId(viewModal.id)}
                className="bg-red-700/60 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
                🗑 {T(t.empPage.deleteBtn)}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <Modal
          title={editing ? T(t.empPage.editModal) : T(t.empPage.addModal)}
          onClose={() => setModal(false)}>
          <form onSubmit={saveEmp} className="space-y-4">
            <div>
              <label className={lbl}>{T(t.empPage.fioLabel)}</label>
              <input className={inp} required placeholder="Toshmatov Anvar Qudratovich"
                value={form.ism} onChange={e => setForm({ ...form, ism: e.target.value })}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={lbl}>{T(t.empPage.jshshirLabel)}</label>
                <div className="flex gap-1.5">
                  <input className={`${inp} flex-1`} placeholder="12345678901234" maxLength={14}
                    inputMode="numeric" pattern="\d{14}"
                    value={form.jshshir} onChange={e => setForm({ ...form, jshshir: e.target.value.replace(/\D/g, '').slice(0, 14) })}/>
                  <button type="button" onClick={lookupJshshir} disabled={jshshirLoading}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-[#1F2937] text-white px-3 rounded-lg transition text-sm"
                    title="Soliq API orqali izlash">
                    {jshshirLoading ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    ) : '🔍'}
                  </button>
                </div>
              </div>
              <div>
                <label className={lbl}>{T(t.empPage.passportLabel)}</label>
                <input className={inp} placeholder="AB 1234567" maxLength={10}
                  value={form.passport}
                  onChange={e => setForm({ ...form, passport: e.target.value.toUpperCase() })}/>
              </div>
              <div>
                <label className={lbl}>{T(t.empPage.positionLabel)} *</label>
                <input className={inp} required placeholder="Dasturchi"
                  value={form.lavozim} onChange={e => setForm({ ...form, lavozim: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>{T(t.empPage.deptLabel)}</label>
                <input className={inp} placeholder="IT bo'limi"
                  value={form.bolim} onChange={e => setForm({ ...form, bolim: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>{T(t.empPage.salaryLabel)}</label>
                <input className={inp} placeholder="5 000 000" inputMode="numeric"
                  value={form.maosh}
                  onChange={e => setForm({ ...form, maosh: e.target.value.replace(/[^\d\s]/g, '') })}/>
              </div>
              <div>
                <label className={lbl}>{T(t.empPage.phoneLabel)}</label>
                <input className={inp} placeholder="+998901234567" type="tel"
                  value={form.tel}
                  onChange={e => setForm({ ...form, tel: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>{T(t.empPage.startDateLabel)}</label>
                <input className={inp} type="date"
                  value={form.ish_boshi} onChange={e => setForm({ ...form, ish_boshi: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>{T(t.empPage.birthDateLabel)}</label>
                <input className={inp} type="date"
                  value={form.tugilgan_sana} onChange={e => setForm({ ...form, tugilgan_sana: e.target.value })}/>
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>{T(t.empPage.addressLabel)}</label>
                <input className={inp} placeholder="Toshkent sh., Yunusobod t., ..."
                  value={form.manzil} onChange={e => setForm({ ...form, manzil: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>{T(t.empPage.statusLabel)}</label>
                <select className={inp} value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">{T(t.empPage.statusActive)}</option>
                  <option value="fired">{T(t.empPage.statusFired)}</option>
                </select>
              </div>
            </div>
            {editing ? (
              <div className="flex gap-2">
                <button type="button" onClick={() => { setModal(false); setConfirmDeleteId(editing.id) }}
                  className="bg-red-700/60 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
                  🗑 {T(t.empPage.deleteBtn)}
                </button>
                <div className="flex-1">
                  <ModalActions onClose={() => setModal(false)} saving={saving}/>
                </div>
              </div>
            ) : (
              <ModalActions onClose={() => setModal(false)} saving={saving}/>
            )}
          </form>
        </Modal>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message={T(t.empPage.deleteConfirm)}
          onConfirm={() => { const id = confirmDeleteId; setConfirmDeleteId(null); doDelete(id) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-gray-200 text-sm">{value || '—'}</div>
    </div>
  )
}
