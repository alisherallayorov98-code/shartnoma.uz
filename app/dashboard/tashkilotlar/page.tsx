'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { Modal, ModalActions } from '../_components/Modal'
import { useToast } from '@/lib/toast'
import type { Org } from '@/lib/types'

const emptyOrg = { name: '', inn: '', director_name: '', bank_name: '', bank_account: '', mfo: '', address: '' }
const emptyBank = { bank_name: '', account_number: '', mfo: '', is_default: false }

export default function TashkilotlarPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { orgs, activeOrg, bankAccounts, switchOrg, reloadOrgs, userId } = useDashboard()
  const { toast } = useToast()

  const [orgForm, setOrgForm] = useState(emptyOrg)
  const [bankForm, setBankForm] = useState(emptyBank)
  const [saving, setSaving] = useState(false)
  const [orgModal, setOrgModal] = useState(false)
  const [bankModal, setBankModal] = useState(false)

  const signatureRef = useRef<HTMLInputElement>(null)
  const stampRef = useRef<HTMLInputElement>(null)

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!orgForm.name.trim()) { toast(T(t.msg.nameRequired), 'error'); setSaving(false); return }
    if (orgForm.inn && !/^\d{9}$/.test(orgForm.inn)) { toast(T(t.msg.innInvalid), 'error'); setSaving(false); return }
    if (orgForm.mfo && !/^\d{5}$/.test(orgForm.mfo)) { toast(T(t.msg.mfoInvalid), 'error'); setSaving(false); return }
    if (orgForm.bank_account && !/^\d{20}$/.test(orgForm.bank_account)) { toast(T(t.msg.accountInvalid), 'error'); setSaving(false); return }
    const { data: { session } } = await supabase.auth.getSession()
    const { data: newOrg } = await supabase.from('organizations').insert({ ...orgForm, user_id: session!.user.id }).select().single()
    if (newOrg) {
      await supabase.from('subscriptions').insert({
        organization_id: newOrg.id, user_id: session!.user.id,
        plan: 'free', contracts_used: 0,
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
    setOrgModal(false); setOrgForm(emptyOrg); setSaving(false); reloadOrgs()
  }

  async function saveBankAccount(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (bankForm.mfo && !/^\d{5}$/.test(bankForm.mfo)) { toast(T(t.msg.mfoInvalid), 'error'); setSaving(false); return }
    if (bankForm.account_number && !/^\d{20}$/.test(bankForm.account_number)) { toast(T(t.msg.accountInvalid), 'error'); setSaving(false); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (bankForm.is_default && activeOrg) {
      await supabase.from('bank_accounts').update({ is_default: false }).eq('organization_id', activeOrg.id)
    }
    const { error } = await supabase.from('bank_accounts').insert({ ...bankForm, organization_id: activeOrg!.id, user_id: session!.user.id })
    setSaving(false)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    setBankModal(false); setBankForm(emptyBank); reloadOrgs()
  }

  async function deleteBankAccount(id: string) {
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    reloadOrgs()
  }

  async function uploadImage(file: File, field: 'stamp_url' | 'signature_url') {
    if (!activeOrg) return
    if (!file.type.startsWith('image/')) { toast('Faqat rasm fayllari qabul qilinadi', 'error'); return }
    if (file.size > 2 * 1024 * 1024) { toast('Fayl hajmi 2MB dan oshmasligi kerak', 'error'); return }
    const ext = file.name.split('.').pop()
    const path = `${userId}/${activeOrg.id}/${field}.${ext}`
    const { error: upErr } = await supabase.storage.from('org-assets').upload(path, file, { upsert: true })
    if (upErr) { toast(`${T(t.msg.uploadError)}: ${upErr.message}`, 'error'); return }
    const { data } = supabase.storage.from('org-assets').getPublicUrl(path)
    const { error: dbErr } = await supabase.from('organizations').update({ [field]: data.publicUrl }).eq('id', activeOrg.id)
    if (dbErr) { toast(`Saqlashda xato: ${dbErr.message}`, 'error'); return }
    toast(field === 'stamp_url' ? 'Muhr saqlandi' : 'Imzo saqlandi')
    reloadOrgs()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🏢 {T(t.orgs.title)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orgs.length} ta tashkilot</p>
        </div>
        <button onClick={() => { setOrgForm(emptyOrg); setOrgModal(true) }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          + {T(t.orgs.new)}
        </button>
      </div>

      {/* Org list */}
      {orgs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-gray-400 font-medium">{T(t.orgs.empty)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map(org => (
            <div key={org.id}
              className={`bg-gray-900 border rounded-xl p-5 transition cursor-pointer ${activeOrg?.id === org.id ? 'border-blue-600' : 'border-gray-800 hover:border-gray-700'}`}
              onClick={() => switchOrg(org)}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center text-purple-300 font-bold text-xl flex-shrink-0">
                  {org.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{org.name}</h3>
                    {activeOrg?.id === org.id && (
                      <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">{T(t.orgTab.active)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">INN: {org.inn || '—'}</p>
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

              {/* Bank accounts + stamp/signature for active org */}
              {activeOrg?.id === org.id && (
                <div className="border-t border-gray-800 pt-4 mt-2" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{T(t.orgTab.bankAccounts)}</span>
                    <button onClick={() => setBankModal(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      {T(t.orgTab.addAccount)}
                    </button>
                  </div>
                  {bankAccounts.length === 0 ? (
                    <p className="text-xs text-gray-600">{T(t.orgTab.noAccount)}</p>
                  ) : (
                    <div className="space-y-2">
                      {bankAccounts.map(ba => (
                        <div key={ba.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white font-mono">{ba.account_number}</span>
                              {ba.is_default && <span className="text-xs bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded">{T(t.orgTab.primary)}</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{ba.bank_name} | MFO: {ba.mfo || '—'}</div>
                          </div>
                          <button onClick={() => deleteBankAccount(ba.id)} className="text-red-500 hover:text-red-400 text-xs p-1">🗑</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stamp & Signature */}
                  <div className="border-t border-gray-800 pt-4 mt-4">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{T(t.orgTab.stampSign)}</span>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-2">{T(t.orgTab.signImg)}</div>
                        {org.signature_url ? (
                          <div className="relative group">
                            <img src={org.signature_url} alt="Imzo" className="h-16 object-contain bg-white rounded-lg p-1"/>
                            <button onClick={() => signatureRef.current?.click()}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg text-xs text-white transition flex items-center justify-center">
                              {T(t.orgTab.change)}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => signatureRef.current?.click()}
                            className="w-full h-16 border-2 border-dashed border-gray-700 rounded-lg text-xs text-gray-500 hover:border-blue-600 hover:text-blue-400 transition flex items-center justify-center gap-2">
                            {T(t.orgTab.upload)}
                          </button>
                        )}
                        <input ref={signatureRef} type="file" accept="image/*" className="hidden"
                          onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'signature_url') }}/>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-2">{T(t.orgTab.stampImg)}</div>
                        {org.stamp_url ? (
                          <div className="relative group">
                            <img src={org.stamp_url} alt="Muhr" className="h-16 object-contain bg-white rounded-lg p-1"/>
                            <button onClick={() => stampRef.current?.click()}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg text-xs text-white transition flex items-center justify-center">
                              {T(t.orgTab.change)}
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => stampRef.current?.click()}
                            className="w-full h-16 border-2 border-dashed border-gray-700 rounded-lg text-xs text-gray-500 hover:border-blue-600 hover:text-blue-400 transition flex items-center justify-center gap-2">
                            {T(t.orgTab.upload)}
                          </button>
                        )}
                        <input ref={stampRef} type="file" accept="image/*" className="hidden"
                          onChange={e => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'stamp_url') }}/>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add org modal */}
      {orgModal && (
        <Modal title={T(t.orgs.new)} onClose={() => setOrgModal(false)}>
          <form onSubmit={saveOrg} className="space-y-4">
            <div>
              <label className={lbl}>Tashkilot nomi *</label>
              <input className={inp} required placeholder="Alfa Texnologiya MChJ" value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>STIR (INN)</label>
                <input className={inp} placeholder="123456789" maxLength={9} value={orgForm.inn} onChange={e => setOrgForm({ ...orgForm, inn: e.target.value })}/>
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
                <input className={inp} placeholder="00873" maxLength={5} value={orgForm.mfo} onChange={e => setOrgForm({ ...orgForm, mfo: e.target.value })}/>
              </div>
            </div>
            <div>
              <label className={lbl}>Manzil</label>
              <input className={inp} placeholder="Toshkent shahri, ..." value={orgForm.address} onChange={e => setOrgForm({ ...orgForm, address: e.target.value })}/>
            </div>
            <ModalActions onClose={() => setOrgModal(false)} saving={saving}/>
          </form>
        </Modal>
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
              <input type="checkbox" checked={bankForm.is_default} onChange={e => setBankForm({ ...bankForm, is_default: e.target.checked })} className="w-4 h-4 accent-blue-500"/>
              <span className="text-sm text-gray-300">Asosiy hisob sifatida belgilash</span>
            </label>
            <ModalActions onClose={() => { setBankModal(false); setBankForm(emptyBank) }} saving={saving}/>
          </form>
        </Modal>
      )}
    </div>
  )
}
