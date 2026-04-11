'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

import AdminLayout from './_components/AdminLayout'
import AiTab from './_components/AiTab'
import ClientsTab from './_components/ClientsTab'
import PaymentsTab from './_components/PaymentsTab'
import DemoTab from './_components/DemoTab'
import NewUsersTab from './_components/NewUsersTab'
import FeedbackTab from './_components/FeedbackTab'
import ContractsTab from './_components/ContractsTab'
import TemplatesTab from './_components/TemplatesTab'
import ContentTab from './_components/ContentTab'
import SettingsTab from './_components/SettingsTab'
import GlobalDbTab from './_components/GlobalDbTab'
import AnnouncementsTab from './_components/AnnouncementsTab'
import {
  EditSubModal, NoteModal, PaymentModal, DemoModal, AddContentModal, GlobalAddModal,
} from './_components/Modals'

import type {
  Client, DemoRow, Payment, NewUser, Feedback,
  SysTemplate, SiteContent, Announcement, GlobalCompany,
} from './types'

export default function AdminPage() {
  const router = useRouter()
  const tokenRef = useRef<string>('')
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [tab, setTab] = useState('clients')
  const [msg, setMsg] = useState<{ text: string; ok: boolean }>({ text: '', ok: true })
  const [saving, setSaving] = useState('')

  // Data
  const [clients, setClients] = useState<Client[]>([])
  const [demos, setDemos] = useState<DemoRow[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [newUsers, setNewUsers] = useState<NewUser[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [sysTemplates, setSysTemplates] = useState<SysTemplate[]>([])
  const [siteContent, setSiteContent] = useState<SiteContent[]>([])
  const [allContracts, setAllContracts] = useState<any[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [globalCompanies, setGlobalCompanies] = useState<GlobalCompany[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  // Filters / search
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [newDaysFilter, setNewDaysFilter] = useState(7)
  const [contractSearch, setContractSearch] = useState('')
  const [contractStatusFilter, setContractStatusFilter] = useState('all')
  const [globalSearch, setGlobalSearch] = useState('')
  const [contentDrafts, setContentDrafts] = useState<Record<string, string>>({})

  // Loading flags
  const [globalLoaded, setGlobalLoaded] = useState(false)
  const [annLoaded, setAnnLoaded] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [tplSaving, setTplSaving] = useState(false)
  const [contentSaving, setContentSaving] = useState('')
  const [contentUploading, setContentUploading] = useState('')
  const [annSaving, setAnnSaving] = useState(false)
  const [globalSaving, setGlobalSaving] = useState(false)
  const [globalStirLoading, setGlobalStirLoading] = useState(false)

  // Template form
  const [tplType, setTplType] = useState('oldi_sotdi')
  const [tplLang, setTplLang] = useState('uz')
  const [tplName, setTplName] = useState('')
  const [tplContent, setTplContent] = useState('')

  // Ann form
  const [annForm, setAnnForm] = useState({ title: '', body: '', type: 'yangilik', link_url: '', link_text: '' })

  // Modals
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [editForm, setEditForm] = useState({ plan: 'standard', period_end: '', is_active: true })
  const [noteClient, setNoteClient] = useState<Client | null>(null)
  const [noteText, setNoteText] = useState('')
  const [addDemoModal, setAddDemoModal] = useState(false)
  const [demoForm, setDemoForm] = useState({ orgId: '', days: '3', note: '' })
  const [demoSearch, setDemoSearch] = useState('')
  const [demoSaving, setDemoSaving] = useState(false)
  const [addPaymentModal, setAddPaymentModal] = useState(false)
  const [payForm, setPayForm] = useState({ orgId: '', amount: '', plan: 'standard', note: '' })
  const [paySearch, setPaySearch] = useState('')
  const [paySaving, setPaySaving] = useState(false)
  const [addContentModal, setAddContentModal] = useState(false)
  const [newContentForm, setNewContentForm] = useState({ key: '', label: '', type: 'text', value: '' })
  const [globalAddOpen, setGlobalAddOpen] = useState(false)
  const [globalForm, setGlobalForm] = useState({ inn: '', name: '', director: '', address: '', mfo: '', bank_name: '', account: '', phone: '' })

  useEffect(() => { checkAdmin() }, [])

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/dashboard'); return }
    tokenRef.current = session.access_token
    await loadAll()
    setLoading(false)
  }

  async function apiGet() {
    const res = await fetch('/api/admin', { headers: { Authorization: `Bearer ${tokenRef.current}` } })
    if (res.status === 403) { router.push('/dashboard'); return null }
    return res.json()
  }

  async function apiPost(body: object) {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  function buildClients(data: any): Client[] {
    const contractCount: Record<string, number> = {}
    for (const c of (data.contracts || [])) contractCount[c.organization_id] = (contractCount[c.organization_id] || 0) + 1
    return (data.orgs || []).map((org: any) => {
      const sub = (data.subs || []).find((s: any) => s.organization_id === org.id)
      const demo = (data.demos || []).find((d: any) => d.organization_id === org.id)
      return {
        id: org.id, name: org.name, inn: org.inn || '',
        address: org.address || '', created_at: org.created_at,
        user_id: org.user_id, user_email: org.user_email || '',
        admin_note: org.admin_note || '',
        last_login: org.last_login || '', last_contract: org.last_contract || '',
        sub_id: sub?.id, plan: sub?.plan || 'free',
        period_end: sub?.period_end, is_active: sub?.is_active,
        contracts_used: sub?.contracts_used ?? 0,
        contracts_count: contractCount[org.id] || 0,
        demo_expires: demo?.expires_at, demo_active: !!demo,
      }
    })
  }

  async function loadAll() {
    const data = await apiGet()
    if (!data) return
    setClients(buildClients(data))
    setPayments((data.payments || []).map((p: any) => ({ ...p, org_name: p.organizations?.name, org_inn: p.organizations?.inn })))
    setNewUsers(data.newUsers || [])
    await loadDemos()
    const { data: fbData } = await supabase.from('feedback').select('id,user_email,category,title,message,status,created_at').order('created_at', { ascending: false }).limit(200)
    setFeedbacks(fbData || [])
  }

  async function loadDemos() {
    const data = await apiPost({ action: 'load_demos' })
    if (data?.demos) setDemos(data.demos.map((d: any) => ({ ...d, org_name: d.organizations?.name, org_inn: d.organizations?.inn })))
  }

  async function loadTemplates() {
    const data = await apiPost({ action: 'get_system_templates' })
    if (data?.templates) setSysTemplates(data.templates)
  }

  async function loadSiteContent() {
    const data = await apiPost({ action: 'get_site_content' })
    if (data?.content) setSiteContent(data.content)
  }

  async function loadAllContracts() {
    const data = await apiPost({ action: 'get_all_contracts' })
    if (data?.contracts) setAllContracts(data.contracts)
  }

  async function loadSettings() {
    const data = await apiPost({ action: 'get_settings' })
    if (data?.settings) setSettings(data.settings)
  }

  async function loadAnnouncements() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    if (data) setAnnouncements(data)
    setAnnLoaded(true)
  }

  async function loadGlobalCompanies() {
    const { data } = await supabase.from('global_companies').select('*').order('updated_at', { ascending: false }).limit(500)
    if (data) setGlobalCompanies(data)
    setGlobalLoaded(true)
  }

  function handleTabChange(key: string) {
    setTab(key)
    if (key === 'templates' && sysTemplates.length === 0) loadTemplates()
    if (key === 'content' && siteContent.length === 0) loadSiteContent()
    if (key === 'contracts' && allContracts.length === 0) loadAllContracts()
    if (key === 'settings' && Object.keys(settings).length === 0) loadSettings()
    if (key === 'global_db' && !globalLoaded) loadGlobalCompanies()
    if (key === 'announcements' && !annLoaded) loadAnnouncements()
  }

  function notify(text: string, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg({ text: '', ok: true }), 3000)
  }

  async function giveSubscription(orgId: string, userId: string, plan: string, months: number) {
    setSaving(orgId + plan)
    const period_end = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
    const existing = clients.find(c => c.id === orgId)
    await apiPost({ action: 'upsert_sub', org_id: orgId, user_id: userId, sub_id: existing?.sub_id, plan, period_end, is_active: true })
    notify(`✓ ${plan === 'standard' ? 'Standart' : 'AI Pro'} tarif berildi (${months} oy)`)
    setSaving(''); loadAll()
  }

  async function deactivateSubscription(subId: string, orgName: string) {
    setSaving(subId)
    await apiPost({ action: 'deactivate_sub', sub_id: subId })
    notify(`✓ ${orgName} obunasi o'chirildi`)
    setSaving(''); loadAll()
  }

  async function updateSubscription(e: React.FormEvent) {
    e.preventDefault()
    if (!editClient) return
    setSaving('edit')
    await apiPost({ action: 'upsert_sub', org_id: editClient.id, user_id: editClient.user_id, sub_id: editClient.sub_id, plan: editForm.plan, period_end: editForm.period_end ? new Date(editForm.period_end).toISOString() : null, is_active: editForm.is_active })
    notify(`✓ ${editClient.name} tarifi yangilandi`)
    setSaving(''); setEditClient(null); loadAll()
  }

  async function saveNote() {
    if (!noteClient) return
    setSaving('note')
    await apiPost({ action: 'update_note', org_id: noteClient.id, note: noteText })
    notify('✓ Izoh saqlandi')
    setSaving(''); setNoteClient(null); loadAll()
  }

  async function addDemo(e: React.FormEvent) {
    e.preventDefault()
    if (!demoForm.orgId) return
    setDemoSaving(true)
    await apiPost({ action: 'add_demo', org_id: demoForm.orgId, days: demoForm.days, note: demoForm.note })
    setDemoSaving(false)
    notify(`✓ ${demoForm.days} kunlik demo berildi`)
    setAddDemoModal(false); setDemoForm({ orgId: '', days: '3', note: '' }); setDemoSearch('')
    loadAll()
  }

  async function deactivateDemo(id: string) {
    await apiPost({ action: 'deactivate_demo', demo_id: id })
    notify('✓ Demo bekor qilindi'); loadAll()
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!payForm.orgId || !payForm.amount) return
    setPaySaving(true)
    const org = clients.find(c => c.id === payForm.orgId)
    await apiPost({ action: 'add_payment', org_id: payForm.orgId, amount: Number(payForm.amount.replace(/\s/g, '')), plan: payForm.plan, note: payForm.note })
    if (org) await giveSubscription(payForm.orgId, org.user_id, payForm.plan, 1)
    setPaySaving(false)
    notify("✓ To'lov qayd etildi")
    setAddPaymentModal(false); setPayForm({ orgId: '', amount: '', plan: 'standard', note: '' }); setPaySearch('')
    loadAll()
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (!tplName || !tplContent) return
    setTplSaving(true)
    await apiPost({ action: 'save_template', type: tplType, language: tplLang, name: tplName, content: tplContent })
    notify('✓ Shablon saqlandi')
    setTplSaving(false)
    loadTemplates()
  }

  function loadTemplateForEdit(type: string, lang: string) {
    const found = sysTemplates.find(t => t.type === type && t.language === lang)
    if (found) { setTplName(found.name); setTplContent(found.content) }
    else { setTplName(''); setTplContent('') }
  }

  async function deleteTemplate(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return
    await apiPost({ action: 'delete_template', id })
    notify("✓ Shablon o'chirildi")
    loadTemplates()
  }

  async function saveContentItem(key: string, label: string, type: string, value: string, file_url?: string) {
    setContentSaving(key)
    await apiPost({ action: 'save_content', key, label, type, value, file_url })
    notify('✓ Saqlandi')
    setContentSaving('')
    loadSiteContent()
  }

  async function uploadMediaFile(key: string, label: string, type: string, file: File) {
    setContentUploading(key)
    const ext = file.name.split('.').pop()
    const path = `media/${key}-${Date.now()}.${ext}`
    const { data: upData, error } = await supabase.storage.from('media').upload(path, file, { upsert: true })
    if (error) { notify('Yuklash xatosi: ' + error.message, false); setContentUploading(''); return }
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(upData.path)
    await saveContentItem(key, label, type, publicUrl, publicUrl)
    setContentUploading('')
  }

  async function deleteContentItem(id: string) {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return
    await apiPost({ action: 'delete_content', id })
    notify("✓ O'chirildi")
    loadSiteContent()
  }

  async function addNewContent(e: React.FormEvent) {
    e.preventDefault()
    if (!newContentForm.key || !newContentForm.label) return
    await apiPost({ action: 'save_content', key: newContentForm.key, label: newContentForm.label, type: newContentForm.type, value: newContentForm.value, file_url: null })
    notify("✓ Kontent qo'shildi")
    setAddContentModal(false)
    setNewContentForm({ key: '', label: '', type: 'text', value: '' })
    loadSiteContent()
  }

  async function saveAllSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsSaving(true)
    await Promise.all(Object.entries(settings).map(([k, v]) => apiPost({ action: 'save_setting', key: k, value: v })))
    notify('✓ Barcha sozlamalar saqlandi')
    setSettingsSaving(false)
  }

  async function handleGlobalStirLookup() {
    const inn = globalForm.inn.trim()
    if (!/^\d{9}$/.test(inn)) return
    setGlobalStirLoading(true)
    try {
      const res = await fetch(`/api/stir?stir=${inn}`)
      const data = await res.json()
      if (res.ok && data.company) {
        const co = data.company
        setGlobalForm(p => ({ ...p, name: co.name || p.name, director: co.director_name || p.director, address: co.address || p.address }))
      }
    } finally { setGlobalStirLoading(false) }
  }

  async function handleGlobalSave(e: React.FormEvent) {
    e.preventDefault()
    if (!globalForm.inn || !globalForm.name) return
    setGlobalSaving(true)
    await fetch('/api/company-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenRef.current}` },
      body: JSON.stringify(globalForm),
    })
    setGlobalSaving(false)
    setGlobalAddOpen(false)
    setGlobalForm({ inn: '', name: '', director: '', address: '', mfo: '', bank_name: '', account: '', phone: '' })
    loadGlobalCompanies()
    notify('✓ Saqlandi')
  }

  async function handleGlobalDelete(inn: string) {
    if (!confirm(`${inn} ni o'chirasizmi?`)) return
    await fetch(`/api/company-lookup?inn=${inn}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenRef.current}` } })
    setGlobalCompanies(prev => prev.filter(c => c.inn !== inn))
  }

  async function saveAnnouncement() {
    if (!annForm.title.trim() || !annForm.body.trim()) { setMsg({ text: 'Sarlavha va matn kiritilishi shart', ok: false }); return }
    setAnnSaving(true)
    const { error } = await supabase.from('announcements').insert({
      title: annForm.title.trim(), body: annForm.body.trim(), type: annForm.type,
      link_url: annForm.link_url.trim() || null, link_text: annForm.link_text.trim() || null, is_published: false,
    })
    setAnnSaving(false)
    if (error) { setMsg({ text: 'Xato: ' + error.message, ok: false }); return }
    setAnnForm({ title: '', body: '', type: 'yangilik', link_url: '', link_text: '' })
    notify("Yangilik qo'shildi (hali nashr etilmagan)")
    loadAnnouncements()
  }

  async function togglePublish(id: string, current: boolean) {
    await supabase.from('announcements').update({ is_published: !current }).eq('id', id)
    loadAnnouncements()
  }

  async function deleteAnnouncement(id: string) {
    await supabase.from('announcements').delete().eq('id', id)
    loadAnnouncements()
  }

  function exportExcel() {
    const rows = filtered.map(c => ({
      'Email': c.user_email, 'Tashkilot': c.name, 'STR (INN)': c.inn,
      'Tarif': c.plan === 'free' ? 'Bepul' : c.plan === 'standard' ? 'Standart' : 'AI Pro',
      'Muddat tugash': c.period_end ? new Date(c.period_end).toLocaleDateString('uz-UZ') : '—',
      'Shartnomalar': c.contracts_count,
      "So'nggi kirish": c.last_login ? new Date(c.last_login).toLocaleDateString('uz-UZ') : '—',
      'Izoh': c.admin_note,
      "Ro'yxatdan o'tgan": new Date(c.created_at).toLocaleDateString('uz-UZ'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Mijozlar')
    const payRows = payments.map(p => ({
      'Tashkilot': p.org_name || '', 'Miqdor': p.amount.toLocaleString('uz-UZ') + ' ' + p.currency,
      'Tarif': p.plan, 'Izoh': p.note, 'Sana': new Date(p.created_at).toLocaleDateString('uz-UZ'),
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payRows), "To'lovlar")
    XLSX.writeFile(wb, `shartnoma-uz-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // ── Computed ──
  const now = new Date()
  const in7 = new Date(Date.now() + 7 * 86400000)
  const expiringSoon = clients.filter(c => c.is_active && c.plan !== 'free' && c.period_end && new Date(c.period_end) > now && new Date(c.period_end) <= in7)
  const expired = clients.filter(c => c.is_active && c.plan !== 'free' && c.period_end && new Date(c.period_end) < now)
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)
  const sinceDate = new Date(Date.now() - newDaysFilter * 86400000).toISOString()
  const filteredNewUsers = newUsers.filter(u => u.created_at > sinceDate)
  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const ms = !search || c.name.toLowerCase().includes(q) || c.inn.includes(search) || c.user_email.toLowerCase().includes(q)
    const mp = planFilter === 'all' || (planFilter === 'paid' && c.plan !== 'free' && c.is_active && c.period_end && new Date(c.period_end) > now) || (planFilter === 'free' && (c.plan === 'free' || !c.is_active)) || (planFilter === 'demo' && c.demo_active)
    return ms && mp
  })
  const stats = {
    total: clients.length,
    paid: clients.filter(c => c.plan !== 'free' && c.is_active && c.period_end && new Date(c.period_end) > now).length,
    free: clients.filter(c => !c.demo_active && (c.plan === 'free' || !c.is_active || (c.period_end && new Date(c.period_end) < now))).length,
    demo: clients.filter(c => c.demo_active).length,
    contracts: clients.reduce((s, c) => s + c.contracts_count, 0),
  }
  const counts = {
    clients: clients.length,
    payments: payments.length,
    demo: demos.filter(d => d.is_active).length,
    new: filteredNewUsers.length,
    feedback: feedbacks.filter(f => f.status === 'new').length,
    announcements: announcements.filter(a => !a.is_published).length,
  }

  function activityColor(dateStr: string) {
    if (!dateStr) return 'text-gray-600'
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (days <= 1) return 'text-emerald-400'
    if (days <= 7) return 'text-blue-400'
    if (days <= 30) return 'text-yellow-400'
    return 'text-red-400'
  }

  function activityLabel(dateStr: string) {
    if (!dateStr) return '—'
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (days === 0) return 'Bugun'
    if (days === 1) return 'Kecha'
    if (days < 7) return `${days} kun oldin`
    if (days < 30) return `${Math.floor(days / 7)} hafta oldin`
    return `${Math.floor(days / 30)} oy oldin`
  }

  function planBadge(c: Client) {
    if (c.demo_active) return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900 text-orange-300 font-medium">🎯 Demo</span>
    const exp2 = c.period_end && new Date(c.period_end) < now
    if (!c.is_active || exp2) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Bepul</span>
    if (c.plan === 'standard') return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 font-medium">Standart</span>
    if (c.plan === 'ai_pro') return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900 text-purple-300 font-medium">AI Pro</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Bepul</span>
  }

  const dm = darkMode

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <AdminLayout
      tab={tab}
      setTab={handleTabChange}
      darkMode={darkMode}
      toggleDark={() => setDarkMode(d => !d)}
      onExcel={exportExcel}
      msg={msg}
      counts={counts}
    >
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Jami mijoz', value: stats.total, color: dm ? 'text-white' : 'text-gray-900', sub: 'tashkilot' },
          { label: "To'lovli", value: stats.paid, color: 'text-blue-400', sub: 'faol' },
          { label: 'Bepul', value: stats.free, color: 'text-gray-400', sub: 'foydalanuvchi' },
          { label: 'Demo', value: stats.demo, color: 'text-orange-400', sub: 'faol' },
          { label: 'Shartnomalar', value: stats.contracts, color: 'text-emerald-400', sub: 'jami' },
          { label: 'Daromad', value: totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M` : (totalRevenue / 1000).toFixed(0) + 'K', color: 'text-yellow-400', sub: "so'm" },
        ].map((s, i) => (
          <div key={i} className={`border rounded-xl p-3 ${dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className={`text-xs mt-0.5 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</div>
            <div className={`text-xs ${dm ? 'text-gray-600' : 'text-gray-400'}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Alerts ── */}
      {(expired.length > 0 || expiringSoon.length > 0) && (
        <div className="space-y-2 mb-5">
          {expired.length > 0 && (
            <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-red-400 text-sm font-semibold">🔴 Muddati o&apos;tgan — {expired.length} ta</div>
                <button
                  onClick={() => Promise.all(expired.filter(c => c.sub_id).map(c => apiPost({ action: 'deactivate_sub', sub_id: c.sub_id }))).then(loadAll)}
                  className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition">Hammasini o&apos;chir</button>
              </div>
              {expired.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-red-900/20 rounded-lg px-3 py-2 mb-1">
                  <div>
                    <span className={`text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{c.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{c.user_email}</span>
                    <span className="text-xs text-red-400 ml-2">{c.period_end ? new Date(c.period_end).toLocaleDateString('uz-UZ') : ''} tugagan</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => giveSubscription(c.id, c.user_id, c.plan, 1)} className="text-xs bg-blue-800 hover:bg-blue-700 text-white px-2 py-1 rounded">+1 oy</button>
                    <button onClick={() => c.sub_id && deactivateSubscription(c.sub_id, c.name)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded">O&apos;chir</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-yellow-400 text-sm font-semibold">⚠️ 7 kun ichida tugaydi — {expiringSoon.length} ta</div>
                <button onClick={() => Promise.all(expiringSoon.map(c => giveSubscription(c.id, c.user_id, c.plan, 1)))}
                  className="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition">Hammasini +1 oy</button>
              </div>
              {expiringSoon.map(c => {
                const dl = Math.ceil((new Date(c.period_end!).getTime() - now.getTime()) / 86400000)
                return (
                  <div key={c.id} className="flex items-center justify-between bg-yellow-900/10 rounded-lg px-3 py-2 mb-1">
                    <div>
                      <span className={`text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{c.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{c.user_email}</span>
                      <span className="text-xs text-yellow-400 ml-2">{dl} kun qoldi</span>
                    </div>
                    <button onClick={() => giveSubscription(c.id, c.user_id, c.plan, 1)} className="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-1 rounded">+1 oy</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab actions (demo/payments/content/global add buttons) ── */}
      <div className={`flex justify-end gap-2 mb-4`}>
        {tab === 'demo' && (
          <button onClick={() => setAddDemoModal(true)} className="text-sm bg-orange-600 hover:bg-orange-500 text-white px-4 py-1.5 rounded-lg transition font-medium">
            + Demo berish
          </button>
        )}
        {tab === 'payments' && (
          <button onClick={() => setAddPaymentModal(true)} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition font-medium">
            + To&apos;lov qo&apos;shish
          </button>
        )}
        {tab === 'content' && (
          <button onClick={() => setAddContentModal(true)} className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg transition font-medium">
            + Kontent qo&apos;shish
          </button>
        )}
        {tab === 'global_db' && (
          <button onClick={() => setGlobalAddOpen(true)} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition font-medium">
            + Tashkilot qo&apos;shish
          </button>
        )}
      </div>

      {/* ── Tab content ── */}
      {tab === 'ai' && <AiTab token={tokenRef.current} darkMode={darkMode} />}

      {tab === 'clients' && (
        <ClientsTab
          clients={clients} filtered={filtered} saving={saving}
          search={search} setSearch={setSearch} planFilter={planFilter} setPlanFilter={setPlanFilter}
          now={now} darkMode={darkMode}
          giveSubscription={giveSubscription} deactivateSubscription={deactivateSubscription}
          setEditClient={setEditClient} setEditForm={setEditForm}
          setNoteClient={setNoteClient} setNoteText={setNoteText}
          setDemoForm={setDemoForm} setDemoSearch={setDemoSearch} setAddDemoModal={setAddDemoModal}
          planBadge={planBadge} activityColor={activityColor} activityLabel={activityLabel}
        />
      )}
      {tab === 'payments' && (
        <PaymentsTab payments={payments} totalRevenue={totalRevenue} now={now} darkMode={darkMode}/>
      )}
      {tab === 'demo' && (
        <DemoTab demos={demos} now={now} darkMode={darkMode} deactivateDemo={deactivateDemo}/>
      )}
      {tab === 'new' && (
        <NewUsersTab
          filteredNewUsers={filteredNewUsers} clients={clients}
          newDaysFilter={newDaysFilter} setNewDaysFilter={setNewDaysFilter}
          darkMode={darkMode} planBadge={planBadge}
          activityColor={activityColor} activityLabel={activityLabel}
        />
      )}
      {tab === 'feedback' && (
        <FeedbackTab feedbacks={feedbacks} setFeedbacks={setFeedbacks} darkMode={darkMode}/>
      )}
      {tab === 'contracts' && (
        <ContractsTab
          allContracts={allContracts}
          contractSearch={contractSearch} setContractSearch={setContractSearch}
          contractStatusFilter={contractStatusFilter} setContractStatusFilter={setContractStatusFilter}
          loadAllContracts={loadAllContracts} darkMode={darkMode}
        />
      )}
      {tab === 'templates' && (
        <TemplatesTab
          sysTemplates={sysTemplates}
          tplType={tplType} setTplType={setTplType}
          tplLang={tplLang} setTplLang={setTplLang}
          tplName={tplName} setTplName={setTplName}
          tplContent={tplContent} setTplContent={setTplContent}
          tplSaving={tplSaving} darkMode={darkMode}
          saveTemplate={saveTemplate} loadTemplateForEdit={loadTemplateForEdit}
          deleteTemplate={deleteTemplate} loadTemplates={loadTemplates}
        />
      )}
      {tab === 'content' && (
        <ContentTab
          siteContent={siteContent} contentSaving={contentSaving} contentUploading={contentUploading}
          contentDrafts={contentDrafts} setContentDrafts={setContentDrafts} darkMode={darkMode}
          saveContentItem={saveContentItem} uploadMediaFile={uploadMediaFile} deleteContentItem={deleteContentItem}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab settings={settings} setSettings={setSettings} settingsSaving={settingsSaving} darkMode={darkMode} saveAllSettings={saveAllSettings}/>
      )}
      {tab === 'global_db' && (
        <GlobalDbTab globalCompanies={globalCompanies} globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} darkMode={darkMode} handleGlobalDelete={handleGlobalDelete}/>
      )}
      {tab === 'announcements' && (
        <AnnouncementsTab
          announcements={announcements} annForm={annForm} setAnnForm={setAnnForm}
          annSaving={annSaving} darkMode={darkMode}
          saveAnnouncement={saveAnnouncement} togglePublish={togglePublish} deleteAnnouncement={deleteAnnouncement}
        />
      )}

      {/* ── Modals ── */}
      <EditSubModal
        editClient={editClient} editForm={editForm} setEditForm={setEditForm}
        saving={saving} darkMode={darkMode} onClose={() => setEditClient(null)} onSubmit={updateSubscription}
      />
      <NoteModal
        noteClient={noteClient} noteText={noteText} setNoteText={setNoteText}
        saving={saving} darkMode={darkMode} onClose={() => setNoteClient(null)} onSave={saveNote}
      />
      <PaymentModal
        addPaymentModal={addPaymentModal} payForm={payForm} setPayForm={setPayForm}
        paySearch={paySearch} setPaySearch={setPaySearch} paySaving={paySaving}
        clients={clients} darkMode={darkMode}
        onClose={() => { setAddPaymentModal(false); setPayForm({ orgId: '', amount: '', plan: 'standard', note: '' }); setPaySearch('') }}
        onSubmit={addPayment}
      />
      <DemoModal
        addDemoModal={addDemoModal} demoForm={demoForm} setDemoForm={setDemoForm}
        demoSearch={demoSearch} setDemoSearch={setDemoSearch} demoSaving={demoSaving}
        clients={clients} darkMode={darkMode}
        onClose={() => { setAddDemoModal(false); setDemoForm({ orgId: '', days: '3', note: '' }); setDemoSearch('') }}
        onSubmit={addDemo}
      />
      <AddContentModal
        addContentModal={addContentModal} newContentForm={newContentForm} setNewContentForm={setNewContentForm}
        darkMode={darkMode} onClose={() => setAddContentModal(false)} onSubmit={addNewContent}
      />
      <GlobalAddModal
        globalAddOpen={globalAddOpen} globalForm={globalForm} setGlobalForm={setGlobalForm}
        globalSaving={globalSaving} globalStirLoading={globalStirLoading} darkMode={darkMode}
        onClose={() => setGlobalAddOpen(false)} onSubmit={handleGlobalSave} onStirLookup={handleGlobalStirLookup}
      />
    </AdminLayout>
  )
}
