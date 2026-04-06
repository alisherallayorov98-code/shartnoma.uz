'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { Modal, ModalActions } from '../_components/Modal'
import { useToast } from '@/lib/toast'
import type { Org } from '@/lib/types'
import { getBankByMfo } from '@/lib/bankMfo'

const emptyOrg = { name: '', inn: '', director_name: '', bank_name: '', bank_account: '', mfo: '', address: '', qqsreg: '' }
const emptyBank = { bank_name: '', account_number: '', mfo: '', is_default: false }

const validate = {
  inn:     (v: string) => !v || /^\d{9}$/.test(v),
  mfo:     (v: string) => !v || /^\d{5}$/.test(v),
  account: (v: string) => !v || /^\d{20}$/.test(v),
}

type OrgMember = {
  id: string
  user_id: string | null
  invited_email: string | null
  role: 'owner' | 'member'
  status: 'pending' | 'active'
}

export default function TashkilotlarPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { orgs, activeOrg, bankAccounts, switchOrg, reloadOrgs, userId } = useDashboard()
  const { toast } = useToast()

  const [orgForm, setOrgForm] = useState(emptyOrg)
  const [bankForm, setBankForm] = useState(emptyBank)
  const [saving, setSaving] = useState(false)
  const [orgModal, setOrgModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Org | null>(null)
  const [bankModal, setBankModal] = useState(false)
  const [rekvizitOrg, setRekvizitOrg] = useState<Org | null>(null)

  // STIR lookup
  const [stirLoading, setStirLoading] = useState(false)

  // Stamp/Signature upload
  const [stampUploading, setStampUploading] = useState(false)
  const [sigUploading, setSigUploading] = useState(false)
  const stampRef = useRef<HTMLInputElement>(null)
  const sigRef = useRef<HTMLInputElement>(null)

  // Org members
  const [members, setMembers] = useState<OrgMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

  // Load members when activeOrg changes
  useEffect(() => {
    if (!activeOrg) return
    loadMembers(activeOrg.id)
  }, [activeOrg?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMembers(orgId: string) {
    setMembersLoading(true)
    const { data } = await supabase.from('org_members').select('*').eq('organization_id', orgId)
    setMembers((data || []) as OrgMember[])
    setMembersLoading(false)
  }

  // ── STIR lookup ──────────────────────────────────────────────────────────
  async function lookupStir(inn: string, target: 'org' | 'cp') {
    if (!inn || !/^\d{9}$/.test(inn)) { toast('STIR 9 raqamdan iborat bo\'lishi kerak', 'error'); return }
    setStirLoading(true)
    try {
      const res = await fetch(`/api/stir?stir=${inn}`)
      const data = await res.json()
      if (!res.ok) { toast(data.error || 'STIR ma\'lumot topilmadi', 'error'); return }
      const co = data.company
      if (target === 'org') {
        setOrgForm(prev => ({
          ...prev,
          name: co.name || prev.name,
          director_name: co.director_name || prev.director_name,
          address: co.address || prev.address,
          qqsreg: co.qqsreg || prev.qqsreg,
        }))
        const infoParts: string[] = ['Ma\'lumotlar to\'ldirildi']
        if (co.status === 'active') infoParts.push('✓ Faol')
        else if (co.status === 'inactive') infoParts.push('⚠ Faol emas!')
        if (co.oked_name) infoParts.push(co.oked_name)
        if (co.reg_date) infoParts.push(`Ro'yxatdan: ${co.reg_date}`)
        if (co.ustav_capital) infoParts.push(`Ustav kapitali: ${Number(co.ustav_capital).toLocaleString()} so'm`)
        toast(infoParts.join(' | '), co.status === 'inactive' ? 'error' : 'success')
      }
    } catch {
      toast('STIR so\'rovida xatolik', 'error')
    } finally {
      setStirLoading(false)
    }
  }

  // ── Save org (create or update) ──────────────────────────────────────────
  async function saveOrg(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!orgForm.name.trim()) { toast(T(t.msg.nameRequired), 'error'); setSaving(false); return }
    if (!validate.inn(orgForm.inn)) { toast(T(t.msg.innInvalid), 'error'); setSaving(false); return }
    if (!validate.mfo(orgForm.mfo)) { toast(T(t.msg.mfoInvalid), 'error'); setSaving(false); return }
    if (!validate.account(orgForm.bank_account)) { toast(T(t.msg.accountInvalid), 'error'); setSaving(false); return }

    if (editingOrg) {
      const { error } = await supabase.from('organizations').update(orgForm).eq('id', editingOrg.id)
      if (error) { toast(`Xato: ${error.message}`, 'error'); setSaving(false); return }
    } else {
      const { data: newOrg, error: orgErr } = await supabase
        .from('organizations')
        .insert({ ...orgForm, user_id: userId })
        .select()
        .single()
      if (orgErr || !newOrg) {
        toast(`Tashkilot saqlashda xato: ${orgErr?.message || 'Noma\'lum xatolik'}`, 'error')
        setSaving(false); return
      }
      // Subscription yaratish
      const { error: subErr } = await supabase.from('subscriptions').insert({
        organization_id: newOrg.id, user_id: userId,
        plan: 'free', contracts_used: 0,
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      if (subErr) console.error('Subscription error:', subErr.message)
      // Egani a'zo sifatida qo'shish (xato bo'lsa ham davom etadi)
      await supabase.from('org_members').insert({
        organization_id: newOrg.id, user_id: userId, role: 'owner', status: 'active'
      })
    }
    setOrgModal(false); setEditingOrg(null); setOrgForm(emptyOrg); setSaving(false); reloadOrgs()
  }

  async function saveBankAccount(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!validate.mfo(bankForm.mfo)) { toast(T(t.msg.mfoInvalid), 'error'); setSaving(false); return }
    if (!validate.account(bankForm.account_number)) { toast(T(t.msg.accountInvalid), 'error'); setSaving(false); return }
    if (bankForm.is_default && activeOrg) {
      await supabase.from('bank_accounts').update({ is_default: false }).eq('organization_id', activeOrg.id)
    }
    const { error } = await supabase.from('bank_accounts').insert({ ...bankForm, organization_id: activeOrg!.id, user_id: userId })
    setSaving(false)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    setBankModal(false); setBankForm(emptyBank); reloadOrgs()
  }

  async function deleteBankAccount(id: string) {
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    reloadOrgs()
  }

  // ── Stamp / Signature upload ─────────────────────────────────────────────
  async function uploadImage(file: File, type: 'stamp' | 'signature') {
    if (!activeOrg) return
    const setLoading = type === 'stamp' ? setStampUploading : setSigUploading
    setLoading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${activeOrg.id}/${type}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('org-assets')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) { toast('Yuklashda xato: ' + upErr.message, 'error'); return }
      const { data: urlData } = supabase.storage.from('org-assets').getPublicUrl(path)
      const url = urlData.publicUrl + '?t=' + Date.now()
      const field = type === 'stamp' ? 'stamp_url' : 'signature_url'
      const { error: dbErr } = await supabase.from('organizations').update({ [field]: url }).eq('id', activeOrg.id)
      if (dbErr) { toast('Ma\'lumot saqlashda xato', 'error'); return }
      toast(type === 'stamp' ? 'Muhur yuklandi' : 'Imzo yuklandi', 'success')
      reloadOrgs()
    } finally {
      setLoading(false)
    }
  }

  async function removeImage(type: 'stamp' | 'signature') {
    if (!activeOrg) return
    const field = type === 'stamp' ? 'stamp_url' : 'signature_url'
    await supabase.from('organizations').update({ [field]: null }).eq('id', activeOrg.id)
    toast(type === 'stamp' ? 'Muhur o\'chirildi' : 'Imzo o\'chirildi', 'success')
    reloadOrgs()
  }

  // ── Org members ──────────────────────────────────────────────────────────
  async function inviteMember() {
    if (!activeOrg || !inviteEmail.trim()) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast('Email manzil noto\'g\'ri', 'error'); return
    }
    setInviting(true)
    const { error } = await supabase.from('org_members').insert({
      organization_id: activeOrg.id,
      invited_email: inviteEmail.trim().toLowerCase(),
      role: 'member',
      status: 'pending',
    })
    setInviting(false)
    if (error) {
      if (error.code === '23505') { toast('Bu email allaqachon taklif qilingan', 'error') }
      else { toast('Xato: ' + error.message, 'error') }
      return
    }
    setInviteEmail('')
    toast('Taklif yuborildi. Foydalanuvchi tizimga kirganida kirishi mumkin bo\'ladi.', 'success')
    loadMembers(activeOrg.id)
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase.from('org_members').delete().eq('id', memberId)
    if (error) { toast('Xato: ' + error.message, 'error'); return }
    toast('A\'zo chiqarildi', 'success')
    if (activeOrg) loadMembers(activeOrg.id)
  }

  const isOwner = activeOrg?.user_id === userId

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🏢 {T(t.orgs.title)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orgs.length} ta tashkilot</p>
        </div>
        <button onClick={() => { setEditingOrg(null); setOrgForm(emptyOrg); setOrgModal(true) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          + {T(t.orgs.new)}
        </button>
      </div>

      {/* Org list */}
      {orgs.length === 0 ? (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-gray-400 font-medium">{T(t.orgs.empty)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map(org => (
            <div key={org.id}
              className={`bg-[#111827] border rounded-xl p-5 transition cursor-pointer ${activeOrg?.id === org.id ? 'border-blue-600' : 'border-[#1E293B] hover:border-blue-600/50'}`}
              onClick={() => switchOrg(org)}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-600/10 border border-blue-600/30 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl flex-shrink-0">
                  {org.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white">{org.name}</h3>
                    {activeOrg?.id === org.id && (
                      <span className="text-xs bg-blue-600/10 text-blue-400 border border-blue-600/30 px-2 py-0.5 rounded-full">{T(t.orgTab.active)}</span>
                    )}
                    {org.user_id !== userId && (
                      <span className="text-xs bg-purple-600/10 text-purple-400 border border-purple-600/30 px-2 py-0.5 rounded-full">A&apos;zo</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">INN: {org.inn || '—'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {org.user_id === userId && (
                    <button
                      onClick={() => { setEditingOrg(org); setOrgForm({ name: org.name, inn: org.inn || '', director_name: org.director_name || '', bank_name: org.bank_name || '', bank_account: org.bank_account || '', mfo: org.mfo || '', address: org.address || '', qqsreg: org.qqsreg || '' }); setOrgModal(true) }}
                      className="flex items-center gap-1.5 text-xs bg-[#1F2937] hover:bg-[#334155] border border-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg transition">
                      ✎ Tahrirlash
                    </button>
                  )}
                  <button
                    onClick={() => setRekvizitOrg(org)}
                    className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Rekvizit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-4">
                {[
                  [T(t.orgs.director), org.director_name],
                  [T(t.orgs.bank), org.bank_name],
                  [T(t.orgs.account), org.bank_account],
                  [T(t.orgs.mfo), org.mfo],
                ].map(([l, v]) => (
                  <div key={l}><span className="text-gray-500">{l}: </span><span className="text-gray-300">{v || '—'}</span></div>
                ))}
                <div className="col-span-2"><span className="text-gray-500">{T(t.orgs.address)}: </span><span className="text-gray-300">{org.address || '—'}</span></div>
              </div>

              {/* Bank accounts + stamp/signature + members for active org */}
              {activeOrg?.id === org.id && (
                <div className="border-t border-[#1E293B] pt-4 mt-2 space-y-5" onClick={e => e.stopPropagation()}>

                  {/* Bank accounts */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{T(t.orgTab.bankAccounts)}</span>
                      <button onClick={() => setBankModal(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        {T(t.orgTab.addAccount)}
                      </button>
                    </div>
                    {bankAccounts.length === 0 ? (
                      <p className="text-xs text-gray-500">{T(t.orgTab.noAccount)}</p>
                    ) : (
                      <div className="space-y-2">
                        {bankAccounts.map(ba => (
                          <div key={ba.id} className="flex items-center gap-3 bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white font-mono">{ba.account_number}</span>
                                {ba.is_default && <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded">{T(t.orgTab.primary)}</span>}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">{ba.bank_name} | MFO: {ba.mfo || '—'}</div>
                            </div>
                            <button onClick={() => deleteBankAccount(ba.id)} className="text-red-500 hover:text-red-400 text-xs p-1">🗑</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stamp & Signature */}
                  {isOwner && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">Muhur va Imzo</span>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Stamp */}
                        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                          <div className="text-xs text-gray-400 mb-3 font-medium">Muhur (Stamp)</div>
                          {org.stamp_url ? (
                            <div className="space-y-2">
                              <div className="bg-white rounded-lg p-2 flex items-center justify-center h-24">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={org.stamp_url} alt="Muhur" className="max-h-20 max-w-full object-contain" />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => stampRef.current?.click()} disabled={stampUploading}
                                  className="flex-1 text-xs py-1.5 bg-[#1F2937] hover:bg-[#334155] text-gray-300 rounded-lg transition">
                                  {stampUploading ? 'Yuklanmoqda...' : 'Almashtirish'}
                                </button>
                                <button onClick={() => removeImage('stamp')}
                                  className="text-xs py-1.5 px-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition">
                                  🗑
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => stampRef.current?.click()} disabled={stampUploading}
                              className="w-full h-24 border-2 border-dashed border-[#1E293B] hover:border-blue-600/50 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition">
                              {stampUploading ? (
                                <span className="text-xs">Yuklanmoqda...</span>
                              ) : (
                                <>
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                  <span className="text-xs">Yuklash</span>
                                </>
                              )}
                            </button>
                          )}
                          <input ref={stampRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'stamp'); e.target.value = '' }} />
                        </div>

                        {/* Signature */}
                        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                          <div className="text-xs text-gray-400 mb-3 font-medium">Imzo (Signature)</div>
                          {org.signature_url ? (
                            <div className="space-y-2">
                              <div className="bg-white rounded-lg p-2 flex items-center justify-center h-24">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={org.signature_url} alt="Imzo" className="max-h-20 max-w-full object-contain" />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => sigRef.current?.click()} disabled={sigUploading}
                                  className="flex-1 text-xs py-1.5 bg-[#1F2937] hover:bg-[#334155] text-gray-300 rounded-lg transition">
                                  {sigUploading ? 'Yuklanmoqda...' : 'Almashtirish'}
                                </button>
                                <button onClick={() => removeImage('signature')}
                                  className="text-xs py-1.5 px-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition">
                                  🗑
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => sigRef.current?.click()} disabled={sigUploading}
                              className="w-full h-24 border-2 border-dashed border-[#1E293B] hover:border-blue-600/50 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-300 transition">
                              {sigUploading ? (
                                <span className="text-xs">Yuklanmoqda...</span>
                              ) : (
                                <>
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                  <span className="text-xs">Yuklash</span>
                                </>
                              )}
                            </button>
                          )}
                          <input ref={sigRef} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'signature'); e.target.value = '' }} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">PNG, JPG yoki SVG. Aqlli kontrast uchun shaffof fon tavsiya etiladi.</p>
                    </div>
                  )}

                  {/* Org members */}
                  {isOwner && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">Tashkilot a&apos;zolari</span>
                      <p className="text-xs text-gray-500 mb-3">
                        Buxgalter yoki xodim tizimdan chiqsa ham tashkilot ma&apos;lumotlari saqlanadi.
                        A&apos;zo qo&apos;shish uchun email kiriting — ular tizimga kirganida kirishadi.
                      </p>

                      {/* Existing members */}
                      {membersLoading ? (
                        <div className="text-xs text-gray-500">Yuklanmoqda...</div>
                      ) : (
                        <div className="space-y-2 mb-3">
                          {members.map(m => (
                            <div key={m.id} className="flex items-center gap-3 bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2.5">
                              <div className="w-7 h-7 bg-blue-900/50 rounded-full flex items-center justify-center text-blue-300 text-xs font-bold">
                                {m.role === 'owner' ? '👑' : '👤'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-200">
                                  {m.user_id === userId ? 'Siz' : (m.invited_email || m.user_id?.slice(0, 8) + '...')}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${m.role === 'owner' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                    {m.role === 'owner' ? 'Egasi' : 'A\'zo'}
                                  </span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${m.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                    {m.status === 'active' ? 'Faol' : 'Kutilmoqda'}
                                  </span>
                                </div>
                              </div>
                              {m.user_id !== userId && m.role !== 'owner' && (
                                <button onClick={() => removeMember(m.id)}
                                  className="text-xs text-red-500 hover:text-red-400 px-2 py-1 hover:bg-red-900/20 rounded transition">
                                  Chiqarish
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Invite form */}
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="yangi@buxgalter.uz"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); inviteMember() } }}
                          className="flex-1 bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500"
                        />
                        <button onClick={inviteMember} disabled={inviting || !inviteEmail.trim()}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition whitespace-nowrap">
                          {inviting ? '...' : '+ Qo\'shish'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit org modal */}
      {orgModal && (
        <Modal title={editingOrg ? 'Tashkilotni tahrirlash' : T(t.orgs.new)} onClose={() => { setOrgModal(false); setEditingOrg(null); setOrgForm(emptyOrg) }}>
          <form onSubmit={saveOrg} className="space-y-4">
            <div>
              <label className={lbl}>Tashkilot nomi *</label>
              <input className={inp} required placeholder="Alfa Texnologiya MChJ" value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>STIR (INN)</label>
                <div className="flex gap-2">
                  <input className={inp} placeholder="123456789" maxLength={9} value={orgForm.inn} onChange={e => setOrgForm({ ...orgForm, inn: e.target.value })}/>
                  <button type="button" disabled={stirLoading || !orgForm.inn}
                    onClick={() => lookupStir(orgForm.inn, 'org')}
                    className="px-2.5 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-400 rounded-lg text-xs disabled:opacity-40 transition flex-shrink-0 whitespace-nowrap"
                    title="Soliqdan ma'lumot olish">
                    {stirLoading ? '...' : '🔍'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">9 raqam kiriting va 🔍 bosing</p>
              </div>
              <div>
                <label className={lbl}>Direktor F.I.Sh</label>
                <input className={inp} placeholder="Karimov Alisher" value={orgForm.director_name} onChange={e => setOrgForm({ ...orgForm, director_name: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Bank nomi</label>
                <input className={inp} placeholder="Xalq banki" value={orgForm.bank_name} onChange={e => setOrgForm({ ...orgForm, bank_name: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Hisob raqami (X/R)</label>
                <input className={inp} placeholder="20208000000000000000" maxLength={20} value={orgForm.bank_account} onChange={e => setOrgForm({ ...orgForm, bank_account: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>MFO</label>
                <input className={inp} placeholder="00873" maxLength={5} value={orgForm.mfo} onChange={e => {
                  const mfo = e.target.value
                  const bankName = mfo.length === 5 ? getBankByMfo(mfo) : null
                  setOrgForm({ ...orgForm, mfo, ...(bankName ? { bank_name: bankName } : {}) })
                }}/>
              </div>
              <div>
                <label className={lbl}>QQS raqami</label>
                <input className={inp} placeholder="318060007067" value={orgForm.qqsreg} onChange={e => setOrgForm({ ...orgForm, qqsreg: e.target.value })}/>
              </div>
            </div>
            <div>
              <label className={lbl}>Manzil</label>
              <input className={inp} placeholder="Toshkent shahri, ..." value={orgForm.address} onChange={e => setOrgForm({ ...orgForm, address: e.target.value })}/>
            </div>
            <ModalActions onClose={() => { setOrgModal(false); setEditingOrg(null); setOrgForm(emptyOrg) }} saving={saving}/>
          </form>
        </Modal>
      )}

      {/* Rekvizit kartochkasi modal */}
      {rekvizitOrg && (
        <RekvizitModal org={rekvizitOrg} onClose={() => setRekvizitOrg(null)} />
      )}

      {/* Add bank account modal */}
      {bankModal && (
        <Modal title={T(t.orgTab.addAccount)} onClose={() => { setBankModal(false); setBankForm(emptyBank) }}>
          <form onSubmit={saveBankAccount} className="space-y-4">
            <div>
              <label className={lbl}>Bank nomi</label>
              <input className={inp} placeholder="Xalq banki" value={bankForm.bank_name} onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })}/>
            </div>
            <div>
              <label className={lbl}>Hisob raqami (20 raqam)</label>
              <input className={inp} placeholder="20208000000000000000" maxLength={20} value={bankForm.account_number} onChange={e => setBankForm({ ...bankForm, account_number: e.target.value })}/>
            </div>
            <div>
              <label className={lbl}>MFO (5 raqam)</label>
              <input className={inp} placeholder="00873" maxLength={5} value={bankForm.mfo} onChange={e => setBankForm({ ...bankForm, mfo: e.target.value })}/>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={bankForm.is_default} onChange={e => setBankForm({ ...bankForm, is_default: e.target.checked })} className="w-4 h-4 accent-blue-600"/>
              <span className="text-sm text-gray-300">Asosiy hisob sifatida belgilash</span>
            </label>
            <ModalActions onClose={() => { setBankModal(false); setBankForm(emptyBank) }} saving={saving}/>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── Rekvizit kartochkasi modal ───────────────────────────────────────────────
function RekvizitModal({ org, onClose }: { org: Org; onClose: () => void }) {
  const { toast } = useToast()
  const cardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'jpeg' | 'pdf' | 'word' | null>(null)

  const row = (label: string, value?: string) =>
    value ? { label, value } : null

  const rows = [
    row('Tashkilot nomi', org.name),
    row('STIR (INN)', org.inn),
    row('Direktor', org.director_name),
    row('Manzil', org.address),
    row('Telefon', org.phone),
    row('Bank', org.bank_name),
    row('Hisob raqami (X/R)', org.bank_account),
    row('MFO', org.mfo),
    row('OKED', org.oked),
    row('QQS ro\'yxat raqami', org.qqsreg),
  ].filter(Boolean) as { label: string; value: string }[]

  const plainText = [
    'REKVIZITLAR',
    '─'.repeat(40),
    ...rows.map(r => `${r.label.padEnd(24)}: ${r.value}`),
    '─'.repeat(40),
    'kabinetim.uz orqali yaratildi',
  ].join('\n')

  async function downloadJpeg() {
    if (!cardRef.current) return
    setExporting('jpeg')
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: '#ffffff', useCORS: true, logging: false })
      const link = document.createElement('a')
      link.download = `rekvizit-${org.name}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally { setExporting(null) }
  }

  async function downloadPdf() {
    setExporting('pdf')
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const F = 'helvetica'
      const blue = [30, 64, 175] as [number, number, number]
      doc.setFillColor(...blue)
      doc.rect(0, 0, 210, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont(F, 'bold')
      doc.setFontSize(16)
      doc.text('REKVIZITLAR', 14, 12)
      doc.setFontSize(10)
      doc.setFont(F, 'normal')
      doc.text(org.name, 14, 21)
      doc.setTextColor(0, 0, 0)
      let y = 42
      rows.forEach(({ label, value }) => {
        doc.setFont(F, 'bold'); doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(label, 14, y)
        doc.setFont(F, 'normal'); doc.setFontSize(11)
        doc.setTextColor(20, 20, 20)
        doc.text(value, 14, y + 6)
        doc.setDrawColor(230, 230, 230)
        doc.line(14, y + 9, 196, y + 9)
        y += 16
      })
      doc.setFontSize(8); doc.setTextColor(150, 150, 150)
      doc.text('kabinetim.uz orqali yaratildi', 14, 285)
      doc.save(`rekvizit-${org.name}.pdf`)
    } finally { setExporting(null) }
  }

  async function downloadWord() {
    setExporting('word')
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = await import('docx')
      const F = 'Times New Roman'
      const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
      const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
      const thinLine = { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' }
      const lineBorders = { top: thinLine, bottom: noBorder, left: noBorder, right: noBorder }
      void noBorders

      const dataRows = rows.map(({ label, value }) =>
        new TableRow({ children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: lineBorders,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: F, color: '6B7280' })] })],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: lineBorders,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 22, font: F, color: '111827' })] })],
          }),
        ]})
      )

      const doc = new Document({ sections: [{ children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'REKVIZITLAR', bold: true, size: 32, font: F, color: '1E40AF' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 320 }, children: [new TextRun({ text: org.name, bold: true, size: 26, font: F })] }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: dataRows }),
        new Paragraph({ spacing: { before: 480 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'kabinetim.uz orqali yaratildi', size: 16, font: F, color: '9CA3AF' })] }),
      ]}]})

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `rekvizit-${org.name}.docx`; a.click()
      URL.revokeObjectURL(url)
    } finally { setExporting(null) }
  }

  async function copyText() {
    await navigator.clipboard.writeText(plainText)
    toast('Rekvizitlar nusxalandi', 'success')
  }

  const btnCls = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition border ${active ? 'opacity-50 cursor-wait' : ''}`

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[95vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
          <h2 className="text-base font-semibold text-white">Rekvizit kartochkasi</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition text-xl">×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <div ref={cardRef} style={{ background: '#ffffff', borderRadius: 12, padding: 36, fontFamily: '"Segoe UI", Arial, sans-serif', minWidth: 420 }}>
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', borderRadius: 10, padding: '22px 28px', marginBottom: 28 }}>
              <div style={{ color: '#bfdbfe', fontSize: 11, fontWeight: 700, letterSpacing: 3, marginBottom: 8, textTransform: 'uppercase' }}>Rekvizitlar</div>
              <div style={{ color: '#ffffff', fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>{org.name}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rows.map(({ label, value }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', borderBottom: i < rows.length - 1 ? '1px solid #e5e7eb' : 'none', paddingTop: 12, paddingBottom: 12, gap: 16 }}>
                  <div style={{ minWidth: 160, color: '#6b7280', fontSize: 13, fontWeight: 500, paddingTop: 1 }}>{label}</div>
                  <div style={{ flex: 1, color: '#111827', fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid #f3f4f6', textAlign: 'center', color: '#9ca3af', fontSize: 11 }}>
              kabinetim.uz
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#1E293B] flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={downloadJpeg} disabled={!!exporting}
              className={btnCls(exporting === 'jpeg') + ' bg-purple-600/10 border-purple-600/30 text-purple-400 hover:bg-purple-600/20'}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              {exporting === 'jpeg' ? 'Yuklanmoqda...' : 'PNG yuklab olish'}
            </button>
            <button onClick={downloadPdf} disabled={!!exporting}
              className={btnCls(exporting === 'pdf') + ' bg-red-600/10 border-red-600/30 text-red-400 hover:bg-red-600/20'}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              {exporting === 'pdf' ? 'Yuklanmoqda...' : 'PDF yuklab olish'}
            </button>
            <button onClick={downloadWord} disabled={!!exporting}
              className={btnCls(exporting === 'word') + ' bg-blue-600/10 border-blue-600/30 text-blue-400 hover:bg-blue-600/20'}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              {exporting === 'word' ? 'Yuklanmoqda...' : 'Word yuklab olish'}
            </button>
            <button onClick={copyText}
              className={btnCls(false) + ' bg-green-600/10 border-green-600/30 text-green-400 hover:bg-green-600/20'}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              Matnni nusxalash
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
