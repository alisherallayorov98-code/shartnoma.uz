'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { useToast } from '@/lib/toast'

export default function ProfilPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { userEmail, orgs, activeOrg, cps, contracts, subscription, profile: ctxProfile, reloadOrgs, logout, userId } = useDashboard()

  const [profileTab, setProfileTab] = useState<'account' | 'company'>('account')

  // Profile state
  const [profile, setProfile] = useState(() => ({ ...ctxProfile }))
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')

  // Org ext form state
  const [orgExtForm, setOrgExtForm] = useState<Record<string, string>>(() => ({
    name: activeOrg?.name || '',
    inn: activeOrg?.inn || '',
    director_name: activeOrg?.director_name || '',
    bank_name: activeOrg?.bank_name || '',
    bank_account: activeOrg?.bank_account || '',
    mfo: activeOrg?.mfo || '',
    address: activeOrg?.address || '',
    phone: (activeOrg as Record<string, unknown>)?.phone as string || '',
    oked: (activeOrg as Record<string, unknown>)?.oked as string || '',
    viloyat: (activeOrg as Record<string, unknown>)?.viloyat as string || '',
    tuman: (activeOrg as Record<string, unknown>)?.tuman as string || '',
    qqsreg: (activeOrg as Record<string, unknown>)?.qqsreg as string || '',
    qqs_stavka: (activeOrg as Record<string, unknown>)?.qqs_stavka as string || 'yoq',
    director_pinfl: (activeOrg as Record<string, unknown>)?.director_pinfl as string || '',
    chief_accountant: (activeOrg as Record<string, unknown>)?.chief_accountant as string || '',
    sender_pinfl: (activeOrg as Record<string, unknown>)?.sender_pinfl as string || '',
    sender_name: (activeOrg as Record<string, unknown>)?.sender_name as string || '',
  }))
  const [orgExtSaving, setOrgExtSaving] = useState(false)

  const { toast } = useToast()
  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'

  async function uploadAvatar(file: File) {
    setAvatarUploading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const ext = file.name.split('.').pop()
    const path = `avatars/${session!.user.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('org-assets').upload(path, file, { upsert: true })
    if (upErr) { toast(`${T(t.msg.uploadError)}: ${upErr.message}`, 'error'); setAvatarUploading(false); return }
    const { data } = supabase.storage.from('org-assets').getPublicUrl(path)
    const updated = { ...profile, avatar_url: data.publicUrl }
    const { error: dbErr } = await supabase.from('profiles').upsert({ id: session!.user.id, ...updated, updated_at: new Date().toISOString() })
    setAvatarUploading(false)
    if (dbErr) { toast(`Avatar saqlashda xato: ${dbErr.message}`, 'error'); return }
    setProfile(updated)
    toast('Avatar yangilandi')
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setProfileSaving(true); setProfileMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('profiles').upsert({ id: session!.user.id, ...profile, updated_at: new Date().toISOString() })
    setProfileSaving(false)
    if (error) { toast(`Saqlashda xato: ${error.message}`, 'error'); return }
    setProfileMsg(T(t.msg.profileSaved))
    setTimeout(() => setProfileMsg(''), 3000)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setPwdMsg('')
    if (newPassword.length < 8) { setPwdMsg(T(t.msg.pwdShort)); return }
    if (newPassword !== confirmPassword) { setPwdMsg(T(t.msg.pwdMismatch)); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwdMsg(`${T(t.msg.errorPrefix)}: ${error.message}`)
    else { setPwdMsg(T(t.msg.pwdChanged)); setNewPassword(''); setConfirmPassword('') }
    setTimeout(() => setPwdMsg(''), 4000)
  }

  async function saveOrgExt(e: React.FormEvent) {
    e.preventDefault()
    if (!activeOrg) return
    setOrgExtSaving(true)
    const { error } = await supabase.from('organizations').update(orgExtForm).eq('id', activeOrg.id)
    setOrgExtSaving(false)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    toast(T(t.msg.saved))
    reloadOrgs()
  }

  const planLabel =
    !subscription || subscription.plan === 'free' ? 'Bepul' :
    subscription.plan === 'ai_pro' ? '⭐ AI Pro' :
    subscription.plan === 'standard' ? '✦ Standart' : '⭐ Premium'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-white">👤 Profil</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {[
          { key: 'account', label: T(t.profileTab.accountTab) },
          { key: 'company', label: T(t.profileTab.companyTab) },
        ].map(pt => (
          <button key={pt.key} type="button"
            onClick={() => setProfileTab(pt.key as 'account' | 'company')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${profileTab === pt.key ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
            {pt.label}
          </button>
        ))}
      </div>

      {/* ── ACCOUNT tab ── */}
      {profileTab === 'account' && (
        <>
          {/* Avatar + info card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-start gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover"/>
                    : userEmail[0]?.toUpperCase()
                  }
                </div>
                <button type="button" onClick={() => avatarRef.current?.click()} disabled={avatarUploading}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white text-sm shadow-lg transition border-2 border-gray-900">
                  {avatarUploading ? '…' : '✎'}
                </button>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }}/>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xl font-bold text-white">{profile.full_name || "Ism kiritilmagan"}</div>
                {profile.lavozim && <div className="text-sm text-blue-400 mt-0.5">{profile.lavozim}</div>}
                <div className="text-sm text-gray-400 mt-1">{userEmail}</div>
                {profile.phone && <div className="text-sm text-gray-500 mt-0.5">📞 {profile.phone}</div>}
              </div>

              <div className="flex-shrink-0 text-right">
                {subscription ? (
                  <div className="inline-flex flex-col items-end gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      subscription.plan === 'ai_pro' ? 'bg-purple-900/50 text-purple-300 border border-purple-700' :
                      subscription.plan === 'standard' ? 'bg-blue-900/50 text-blue-300 border border-blue-700' :
                      'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>{planLabel}</span>
                    <span className="text-xs text-gray-500">
                      {subscription.contracts_used}/{subscription.plan === 'free' ? '5' : '∞'} shartnoma
                    </span>
                    {subscription.period_end && subscription.plan !== 'free' && (
                      <span className="text-xs text-gray-600">
                        {new Date(subscription.period_end).toLocaleDateString('uz-UZ')} gacha
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-600">Tarif yuklanmoqda...</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: T(t.contracts.title), value: contracts.length, icon: '📄' },
              { label: T(t.cp.title), value: cps.length, icon: '🤝' },
              { label: T(t.orgs.title), value: orgs.length, icon: '🏢' },
            ].map(s => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Personal info form */}
          <form onSubmit={saveProfile} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{T(t.profileTab.personalInfo)}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>{T(t.profileTab.fullName)}</label>
                <input className={inp} placeholder="Alisher Karimov"
                  value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>{T(t.profileTab.position)}</label>
                <input className={inp} placeholder="Direktor / Buxgalter / Menejer"
                  value={profile.lavozim} onChange={e => setProfile({ ...profile, lavozim: e.target.value })}/>
              </div>
              <div className="col-span-2">
                <label className={lbl}>{T(t.profileTab.phone)}</label>
                <input className={inp} placeholder="+998 90 123 45 67"
                  value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}/>
              </div>
            </div>
            {profileMsg && (
              <div className="bg-emerald-900/40 border border-emerald-700 text-emerald-300 text-sm px-4 py-2.5 rounded-lg">{profileMsg}</div>
            )}
            <button type="submit" disabled={profileSaving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition">
              {profileSaving ? T(t.btn.saving) : T(t.btn.save)}
            </button>
          </form>

          {/* Security */}
          <form onSubmit={changePassword} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{T(t.profileTab.security)}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>{T(t.profileTab.newPass)}</label>
                <input type="password" className={inp} placeholder="Kamida 8 belgi"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}/>
              </div>
              <div>
                <label className={lbl}>{T(t.profileTab.confirmPass)}</label>
                <input type="password" className={inp} placeholder="Qayta kiriting"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/>
              </div>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400">{T(t.profileTab.passMismatch)}</p>
            )}
            {pwdMsg && (
              <div className={`text-sm px-4 py-2.5 rounded-lg ${pwdMsg.includes('✓') ? 'bg-emerald-900/40 border border-emerald-700 text-emerald-300' : 'bg-red-900/40 border border-red-700 text-red-300'}`}>
                {pwdMsg}
              </div>
            )}
            <button type="submit" disabled={!newPassword || newPassword !== confirmPassword}
              className="border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 px-6 py-2.5 rounded-lg text-sm font-medium transition">
              {T(t.profileTab.changePass)}
            </button>
          </form>

          {/* Logout */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">{T(t.profileTab.logoutTitle)}</div>
              <div className="text-xs text-gray-500 mt-0.5">{userEmail}</div>
            </div>
            <button type="button" onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition">
              {T(t.profileTab.logoutBtn)}
            </button>
          </div>

          {/* Support card */}
          {(() => {
            const plan = !subscription || subscription.plan === 'free' ? 'free'
              : subscription.plan === 'ai_pro' ? 'ai_pro' : 'paid'
            const isPaid = plan !== 'free'
            const isAiPro = plan === 'ai_pro'
            return (
              <div className={`rounded-2xl border p-6 ${isAiPro ? 'bg-purple-950/40 border-purple-700/50' : isPaid ? 'bg-blue-950/40 border-blue-700/50' : 'bg-gray-900 border-gray-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    <div>
                      <h3 className="font-semibold text-white text-sm">Qo'llab-quvvatlash</h3>
                      <p className={`text-xs mt-0.5 ${isAiPro ? 'text-purple-300' : isPaid ? 'text-blue-300' : 'text-gray-500'}`}>
                        {isAiPro ? '⚡ Premium — 4 soat ichida javob' : isPaid ? '✦ Ustunlik — 24 soat ichida javob' : 'Asosiy — 2–3 ish kuni'}
                      </p>
                    </div>
                  </div>
                  {isPaid && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isAiPro ? 'bg-purple-800 text-purple-200' : 'bg-blue-800 text-blue-200'}`}>
                      {isAiPro ? '⭐ AI Pro' : '✦ Standart'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 mb-5">
                  <a href="https://t.me/shartnoma_uz_support" target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${isPaid ? 'bg-blue-500 hover:bg-blue-400 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                    </svg>
                    Telegram
                    {isPaid && <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">Ustunlik</span>}
                  </a>
                  <a href={`mailto:support@shartnoma.uz?subject=Murojaat [${userEmail}]&body=Muammo tavsifi:%0A%0A`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    Email
                  </a>
                </div>
                {!isPaid && (
                  <div className="bg-gray-800/60 rounded-xl p-4 flex items-center justify-between gap-4">
                    <p className="text-gray-400 text-xs">Ustunlik qo'llab-quvvatlash uchun Standart yoki Premium tarifiga o'ting</p>
                  </div>
                )}
              </div>
            )
          })()}
        </>
      )}

      {/* ── COMPANY tab ── */}
      {profileTab === 'company' && (
        activeOrg ? (
          <form onSubmit={saveOrgExt} className="space-y-5">
            {/* Main info */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{T(t.profileTab.mainInfo)}</h2>
                <span className="text-xs text-gray-600">{activeOrg.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Tashkilot nomi *</label>
                  <input className={inp} placeholder="Alfa MChJ" value={orgExtForm.name || ''} onChange={e => setOrgExtForm({ ...orgExtForm, name: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>STIR (INN)</label>
                  <input className={inp} placeholder="123456789" value={orgExtForm.inn || ''} onChange={e => setOrgExtForm({ ...orgExtForm, inn: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>Direktor (F.I.Sh)</label>
                  <input className={inp} placeholder="Karimov Alisher Baxtiyorovich" value={orgExtForm.director_name || ''} onChange={e => setOrgExtForm({ ...orgExtForm, director_name: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>Rahbar JSHSHIR (PINFL)</label>
                  <input className={inp} placeholder="30405704070022" value={orgExtForm.director_pinfl || ''} onChange={e => setOrgExtForm({ ...orgExtForm, director_pinfl: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>Bosh buxgalter</label>
                  <input className={inp} placeholder="Rahimova Dilnoza Sobirovna" value={orgExtForm.chief_accountant || ''} onChange={e => setOrgExtForm({ ...orgExtForm, chief_accountant: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>Telefon</label>
                  <input className={inp} placeholder="+998901234567" value={orgExtForm.phone || ''} onChange={e => setOrgExtForm({ ...orgExtForm, phone: e.target.value })}/>
                </div>
              </div>
            </div>

            {/* Bank & finance */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{T(t.profileTab.bankInfo)}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Bank nomi</label>
                  <input className={inp} placeholder="Xalq banki" value={orgExtForm.bank_name || ''} onChange={e => setOrgExtForm({ ...orgExtForm, bank_name: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>Hisob raqami (X/R)</label>
                  <input className={inp} placeholder="20208000000000000000" value={orgExtForm.bank_account || ''} onChange={e => setOrgExtForm({ ...orgExtForm, bank_account: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>MFO</label>
                  <input className={inp} placeholder="00873" value={orgExtForm.mfo || ''} onChange={e => setOrgExtForm({ ...orgExtForm, mfo: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>OKED (faoliyat kodi)</label>
                  <input className={inp} placeholder="46130" value={orgExtForm.oked || ''} onChange={e => setOrgExtForm({ ...orgExtForm, oked: e.target.value })}/>
                </div>
              </div>
            </div>

            {/* Tax & address */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{T(t.profileTab.taxAddress)}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>QQS ro&apos;yxat raqami</label>
                  <input className={inp} placeholder="318060007067" value={orgExtForm.qqsreg || ''} onChange={e => setOrgExtForm({ ...orgExtForm, qqsreg: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>QQS stavkasi</label>
                  <select className={inp} value={orgExtForm.qqs_stavka || 'yoq'} onChange={e => setOrgExtForm({ ...orgExtForm, qqs_stavka: e.target.value })}>
                    <option value="yoq">QQS to&apos;lovchi emas</option>
                    <option value="0">0%</option>
                    <option value="12">12%</option>
                    <option value="15">15%</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Yuridik manzil</label>
                  <input className={inp} placeholder="Toshkent shahri, Yunusobod tumani, ..." value={orgExtForm.address || ''} onChange={e => setOrgExtForm({ ...orgExtForm, address: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>Viloyat</label>
                  <select className={inp} value={orgExtForm.viloyat || ''} onChange={e => setOrgExtForm({ ...orgExtForm, viloyat: e.target.value })}>
                    <option value="">— Tanlang —</option>
                    {["Toshkent shahri", "Toshkent viloyati", "Samarqand", "Buxoro", "Farg'ona", "Andijon", "Namangan", "Qashqadaryo", "Surxondaryo", "Navoiy", "Jizzax", "Sirdaryo", "Xorazm", "Qoraqalpog'iston"].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Tuman/Shahar</label>
                  <input className={inp} placeholder="Yunusobod tumani" value={orgExtForm.tuman || ''} onChange={e => setOrgExtForm({ ...orgExtForm, tuman: e.target.value })}/>
                </div>
              </div>
            </div>

            {/* Sender */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">{T(t.profileTab.sender)}</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>F.I.Sh</label>
                  <input className={inp} placeholder="Karimov Alisher Baxtiyorovich" value={orgExtForm.sender_name || ''} onChange={e => setOrgExtForm({ ...orgExtForm, sender_name: e.target.value })}/>
                </div>
                <div>
                  <label className={lbl}>JSHSHIR (PINFL)</label>
                  <input className={inp} placeholder="30405704070022" value={orgExtForm.sender_pinfl || ''} onChange={e => setOrgExtForm({ ...orgExtForm, sender_pinfl: e.target.value })}/>
                </div>
              </div>
            </div>

            <button type="submit" disabled={orgExtSaving}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition">
              {orgExtSaving ? T(t.btn.saving) : T(t.profileTab.saveChanges)}
            </button>
          </form>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500">
            <p className="text-sm">{T(t.profileTab.noOrg)}</p>
          </div>
        )
      )}
    </div>
  )
}
