'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

type Client = {
  id: string; name: string; inn: string; address: string
  created_at: string; user_id: string; user_email: string
  admin_note: string; last_login: string; last_contract: string
  sub_id?: string; plan: string; period_end?: string
  is_active?: boolean; contracts_used?: number
  contracts_count: number; demo_expires?: string; demo_active?: boolean
}
type DemoRow = {
  id: string; organization_id: string; expires_at: string
  note: string; is_active: boolean; created_at: string
  org_name?: string; org_inn?: string
}
type Payment = {
  id: string; organization_id: string; amount: number
  currency: string; plan: string; note: string; created_at: string
  organizations?: { name: string; inn: string }
}
type NewUser = {
  id: string; email: string; created_at: string; last_sign_in_at: string
}
type Feedback = {
  id: string; user_email: string; category: string; title: string
  message: string; status: string; created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const tokenRef = useRef<string>('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'clients'|'payments'|'demo'|'new'|'feedback'>('clients')
  const [clients, setClients] = useState<Client[]>([])
  const [demos, setDemos] = useState<DemoRow[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [newUsers, setNewUsers] = useState<NewUser[]>([])
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [msg, setMsg] = useState<{text:string;ok:boolean}>({text:'',ok:true})
  const [saving, setSaving] = useState('')

  // Edit sub modal
  const [editClient, setEditClient] = useState<Client|null>(null)
  const [editForm, setEditForm] = useState({ plan:'standard', period_end:'', is_active:true })

  // Note modal
  const [noteClient, setNoteClient] = useState<Client|null>(null)
  const [noteText, setNoteText] = useState('')

  // Demo modal
  const [addDemoModal, setAddDemoModal] = useState(false)
  const [demoForm, setDemoForm] = useState({ orgId:'', days:'3', note:'' })
  const [demoSearch, setDemoSearch] = useState('')
  const [demoSaving, setDemoSaving] = useState(false)

  // Payment modal
  const [addPaymentModal, setAddPaymentModal] = useState(false)
  const [payForm, setPayForm] = useState({ orgId:'', amount:'', plan:'standard', note:'' })
  const [paySearch, setPaySearch] = useState('')
  const [paySaving, setPaySaving] = useState(false)

  // New users filter
  const [newDaysFilter, setNewDaysFilter] = useState(7)

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
    for (const c of (data.contracts || [])) {
      contractCount[c.organization_id] = (contractCount[c.organization_id] || 0) + 1
    }
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
    setPayments((data.payments || []).map((p: any) => ({
      ...p, org_name: p.organizations?.name, org_inn: p.organizations?.inn,
    })))
    setNewUsers(data.newUsers || [])
    await loadDemos()
    // Load feedback separately (direct Supabase query - no admin API needed)
    const { data: fbData } = await supabase
      .from('feedback')
      .select('id, user_email, category, title, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    setFeedbacks(fbData || [])
  }

  async function loadDemos() {
    const data = await apiPost({ action: 'load_demos' })
    if (data?.demos) {
      setDemos(data.demos.map((d: any) => ({
        ...d, org_name: d.organizations?.name, org_inn: d.organizations?.inn,
      })))
    }
  }

  function notify(text: string, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg({ text:'', ok:true }), 3000)
  }

  async function giveSubscription(orgId: string, userId: string, plan: string, months: number) {
    setSaving(orgId + plan)
    const period_end = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
    const existing = clients.find(c => c.id === orgId)
    await apiPost({ action:'upsert_sub', org_id:orgId, user_id:userId, sub_id:existing?.sub_id, plan, period_end, is_active:true })
    notify(`✓ ${plan==='standard'?'Standart':'AI Pro'} tarif berildi (${months} oy)`)
    setSaving(''); loadAll()
  }

  async function deactivateSubscription(subId: string, orgName: string) {
    setSaving(subId)
    await apiPost({ action:'deactivate_sub', sub_id:subId })
    notify(`✓ ${orgName} obunasi o'chirildi`)
    setSaving(''); loadAll()
  }

  async function updateSubscription(e: React.FormEvent) {
    e.preventDefault()
    if (!editClient) return
    setSaving('edit')
    await apiPost({ action:'upsert_sub', org_id:editClient.id, user_id:editClient.user_id, sub_id:editClient.sub_id, plan:editForm.plan, period_end:new Date(editForm.period_end).toISOString(), is_active:editForm.is_active })
    notify(`✓ ${editClient.name} tarifi yangilandi`)
    setSaving(''); setEditClient(null); loadAll()
  }

  async function saveNote() {
    if (!noteClient) return
    setSaving('note')
    await apiPost({ action:'update_note', org_id:noteClient.id, note:noteText })
    notify('✓ Izoh saqlandi')
    setSaving(''); setNoteClient(null); loadAll()
  }

  async function addDemo(e: React.FormEvent) {
    e.preventDefault()
    if (!demoForm.orgId) return
    setDemoSaving(true)
    await apiPost({ action:'add_demo', org_id:demoForm.orgId, days:demoForm.days, note:demoForm.note })
    setDemoSaving(false)
    notify(`✓ ${demoForm.days} kunlik demo berildi`)
    setAddDemoModal(false); setDemoForm({ orgId:'', days:'3', note:'' }); setDemoSearch('')
    loadAll()
  }

  async function deactivateDemo(id: string) {
    await apiPost({ action:'deactivate_demo', demo_id:id })
    notify('✓ Demo bekor qilindi'); loadAll()
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!payForm.orgId || !payForm.amount) return
    setPaySaving(true)
    const org = clients.find(c => c.id === payForm.orgId)
    await apiPost({ action:'add_payment', org_id:payForm.orgId, amount:Number(payForm.amount.replace(/\s/g,'')), plan:payForm.plan, note:payForm.note })
    // Obunani ham yangilash
    if (org) {
      const months = payForm.plan === 'ai_pro' ? 1 : 1
      await giveSubscription(payForm.orgId, org.user_id, payForm.plan, months)
    }
    setPaySaving(false)
    notify(`✓ To'lov qayd etildi`)
    setAddPaymentModal(false); setPayForm({ orgId:'', amount:'', plan:'standard', note:'' }); setPaySearch('')
    loadAll()
  }

  function exportExcel() {
    const rows = filtered.map(c => ({
      'Email': c.user_email,
      'Tashkilot': c.name,
      'STR (INN)': c.inn,
      'Tarif': c.plan === 'free' ? 'Bepul' : c.plan === 'standard' ? 'Standart' : 'AI Pro',
      'Muddat tugash': c.period_end ? new Date(c.period_end).toLocaleDateString('uz-UZ') : '—',
      'Shartnomalar': c.contracts_count,
      'So\'nggi kirish': c.last_login ? new Date(c.last_login).toLocaleDateString('uz-UZ') : '—',
      'Izoh': c.admin_note,
      "Ro'yxatdan o'tgan": new Date(c.created_at).toLocaleDateString('uz-UZ'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Mijozlar')

    // To'lovlar
    const payRows = payments.map(p => ({
      'Tashkilot': (p as any).org_name || '',
      'Miqdor': p.amount.toLocaleString('uz-UZ') + ' ' + p.currency,
      'Tarif': p.plan,
      'Izoh': p.note,
      'Sana': new Date(p.created_at).toLocaleDateString('uz-UZ'),
    }))
    const ws2 = XLSX.utils.json_to_sheet(payRows)
    XLSX.utils.book_append_sheet(wb, ws2, "To'lovlar")

    XLSX.writeFile(wb, `shartnoma-uz-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const now = new Date()
  const in7 = new Date(Date.now() + 7 * 86400000)
  const expiringSoon = clients.filter(c => c.is_active && c.plan!=='free' && c.period_end && new Date(c.period_end)>now && new Date(c.period_end)<=in7)
  const expired = clients.filter(c => c.is_active && c.plan!=='free' && c.period_end && new Date(c.period_end)<now)
  const totalRevenue = payments.reduce((s,p)=>s+p.amount,0)

  const stats = {
    total: clients.length,
    paid: clients.filter(c=>c.plan!=='free'&&c.is_active&&c.period_end&&new Date(c.period_end)>now).length,
    free: clients.filter(c=>!c.demo_active&&(c.plan==='free'||!c.is_active||(c.period_end&&new Date(c.period_end)<now))).length,
    demo: clients.filter(c=>c.demo_active).length,
    contracts: clients.reduce((s,c)=>s+c.contracts_count,0),
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const ms = !search||c.name.toLowerCase().includes(q)||c.inn.includes(search)||c.user_email.toLowerCase().includes(q)
    const mp = planFilter==='all'||(planFilter==='paid'&&c.plan!=='free'&&c.is_active&&c.period_end&&new Date(c.period_end)>now)||(planFilter==='free'&&(c.plan==='free'||!c.is_active))||(planFilter==='demo'&&c.demo_active)
    return ms && mp
  })

  const sinceDate = new Date(Date.now() - newDaysFilter * 86400000).toISOString()
  const filteredNewUsers = newUsers.filter(u => u.created_at > sinceDate)

  function activityColor(dateStr: string) {
    if (!dateStr) return 'text-gray-600'
    const days = Math.floor((Date.now()-new Date(dateStr).getTime())/86400000)
    if (days<=1) return 'text-emerald-400'
    if (days<=7) return 'text-blue-400'
    if (days<=30) return 'text-yellow-400'
    return 'text-red-400'
  }

  function activityLabel(dateStr: string) {
    if (!dateStr) return '—'
    const days = Math.floor((Date.now()-new Date(dateStr).getTime())/86400000)
    if (days===0) return 'Bugun'
    if (days===1) return 'Kecha'
    if (days<7) return `${days} kun oldin`
    if (days<30) return `${Math.floor(days/7)} hafta oldin`
    return `${Math.floor(days/30)} oy oldin`
  }

  const planBadge = (c: Client) => {
    if (c.demo_active) return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900 text-orange-300 font-medium">🎯 Demo</span>
    const expired2 = c.period_end && new Date(c.period_end)<now
    if (!c.is_active||expired2) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Bepul</span>
    if (c.plan==='standard') return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900 text-blue-300 font-medium">Standart</span>
    if (c.plan==='ai_pro') return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900 text-purple-300 font-medium">AI Pro</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Bepul</span>
  }

  const inp = "w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
  const lbl = "block text-xs font-medium text-gray-400 mb-1.5"

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center font-bold text-xs">A</div>
          <span className="font-bold text-sm">Shartnoma.uz</span>
          <span className="text-red-400 text-xs bg-red-900/30 px-2 py-0.5 rounded font-medium">ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportExcel}
            className="text-xs bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1.5">
            📥 Excel
          </button>
          <button onClick={() => window.close()} className="text-gray-400 hover:text-white text-sm transition">✕ Yopish</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-5 space-y-5">
        {msg.text && (
          <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${msg.ok?'bg-emerald-900/50 border border-emerald-700 text-emerald-300':'bg-red-900/50 border border-red-700 text-red-300'}`}>
            {msg.text}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label:'Jami mijoz', value:stats.total, color:'text-white', sub:'tashkilot' },
            { label:"To'lovli", value:stats.paid, color:'text-blue-400', sub:'faol' },
            { label:'Bepul', value:stats.free, color:'text-gray-400', sub:'foydalanuvchi' },
            { label:'Demo', value:stats.demo, color:'text-orange-400', sub:'faol' },
            { label:'Shartnomalar', value:stats.contracts, color:'text-emerald-400', sub:'jami' },
            { label:'Daromad', value:totalRevenue>=1000000?`${(totalRevenue/1000000).toFixed(1)}M`:(totalRevenue/1000).toFixed(0)+'K', color:'text-yellow-400', sub:"so'm" },
          ].map((s,i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              <div className="text-xs text-gray-600">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {(expired.length>0||expiringSoon.length>0) && (
          <div className="space-y-2">
            {expired.length>0 && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-red-400 text-sm font-semibold">🔴 Muddati o'tgan — {expired.length} ta</div>
                  <button onClick={()=>Promise.all(expired.filter(c=>c.sub_id).map(c=>apiPost({action:'deactivate_sub',sub_id:c.sub_id}))).then(loadAll)}
                    className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition">Hammasini o'chir</button>
                </div>
                {expired.map(c=>(
                  <div key={c.id} className="flex items-center justify-between bg-red-900/20 rounded-lg px-3 py-2 mb-1">
                    <div>
                      <span className="text-sm text-white">{c.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{c.user_email}</span>
                      <span className="text-xs text-red-400 ml-2">{c.period_end?new Date(c.period_end).toLocaleDateString('uz-UZ'):''} tugagan</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>giveSubscription(c.id,c.user_id,c.plan,1)} className="text-xs bg-blue-800 hover:bg-blue-700 text-white px-2 py-1 rounded">+1 oy</button>
                      <button onClick={()=>c.sub_id&&deactivateSubscription(c.sub_id,c.name)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded">O'chir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {expiringSoon.length>0 && (
              <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-yellow-400 text-sm font-semibold">⚠️ 7 kun ichida tugaydi — {expiringSoon.length} ta</div>
                  <button onClick={()=>Promise.all(expiringSoon.map(c=>giveSubscription(c.id,c.user_id,c.plan,1)))}
                    className="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg transition">Hammasini +1 oy</button>
                </div>
                {expiringSoon.map(c=>{
                  const dl=Math.ceil((new Date(c.period_end!).getTime()-now.getTime())/86400000)
                  return (
                    <div key={c.id} className="flex items-center justify-between bg-yellow-900/10 rounded-lg px-3 py-2 mb-1">
                      <div>
                        <span className="text-sm text-white">{c.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{c.user_email}</span>
                        <span className="text-xs text-yellow-400 ml-2">{dl} kun qoldi</span>
                      </div>
                      <button onClick={()=>giveSubscription(c.id,c.user_id,c.plan,1)} className="text-xs bg-yellow-700 hover:bg-yellow-600 text-white px-2 py-1 rounded">+1 oy</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-gray-800">
          <div className="flex gap-1">
            {[
              { key:'clients', label:`Mijozlar (${clients.length})` },
              { key:'payments', label:`To'lovlar (${payments.length})` },
              { key:'demo', label:`Demo (${demos.filter(d=>d.is_active).length})` },
              { key:'new', label:`Yangi (${filteredNewUsers.length})` },
              { key:'feedback', label:`Takliflar (${feedbacks.filter(f=>f.status==='new').length})` },
            ].map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${tab===t.key?'border-blue-500 text-white':'border-transparent text-gray-500 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-px">
            {tab==='demo' && (
              <button onClick={()=>setAddDemoModal(true)} className="text-sm bg-orange-600 hover:bg-orange-500 text-white px-4 py-1.5 rounded-lg transition font-medium">
                + Demo berish
              </button>
            )}
            {tab==='payments' && (
              <button onClick={()=>setAddPaymentModal(true)} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition font-medium">
                + To'lov qo'shish
              </button>
            )}
          </div>
        </div>

        {/* ── CLIENTS ── */}
        {tab==='clients' && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Email, tashkilot, STR..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500"/>
              </div>
              <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
                {[{k:'all',l:'Hammasi'},{k:'paid',l:"To'lovli"},{k:'free',l:'Bepul'},{k:'demo',l:'Demo'}].map(f=>(
                  <button key={f.k} onClick={()=>setPlanFilter(f.k)}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${planFilter===f.k?'bg-blue-600 text-white':'text-gray-400 hover:text-white'}`}>
                    {f.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/60">
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">TASHKILOT / EMAIL</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">TARIF</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">MUDDAT</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">FAOLLIK</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">SHARTNOMA</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">IZOH</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">TEZKOR AMAL</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">⚙️</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filtered.length===0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500 text-sm">Topilmadi</td></tr>}
                  {filtered.map(c=>{
                    const isExpired2=c.period_end&&new Date(c.period_end)<now
                    const dl=c.period_end?Math.ceil((new Date(c.period_end).getTime()-now.getTime())/86400000):null
                    const isBusy=saving.startsWith(c.id)||saving==='edit'
                    return (
                      <tr key={c.id} className="hover:bg-gray-800/30 transition">
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-white">{c.name||'(nomi yo\'q)'}</div>
                          <div className="text-xs text-blue-400">{c.user_email||'—'}</div>
                          {c.inn&&<div className="text-xs text-gray-600 font-mono">STR: {c.inn}</div>}
                        </td>
                        <td className="px-4 py-3">{planBadge(c)}</td>
                        <td className="px-4 py-3 text-sm">
                          {c.demo_active&&c.demo_expires?(
                            <span className="text-orange-400">Demo: {Math.ceil((new Date(c.demo_expires).getTime()-now.getTime())/86400000)} kun</span>
                          ):c.period_end&&c.is_active?(
                            <span className={isExpired2?'text-red-400':dl&&dl<=7?'text-yellow-400':'text-gray-300'}>
                              {isExpired2?`${Math.abs(dl!)} kun o'tdi`:`${dl} kun qoldi`}
                              <div className="text-xs text-gray-600">{new Date(c.period_end).toLocaleDateString('uz-UZ')}</div>
                            </span>
                          ):<span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-xs font-medium ${activityColor(c.last_login)}`}>
                            {activityLabel(c.last_login)}
                          </div>
                          {c.last_contract&&(
                            <div className="text-xs text-gray-600">Shartnoma: {activityLabel(c.last_contract)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{c.contracts_count} ta</td>
                        <td className="px-4 py-3">
                          {c.admin_note?(
                            <div className="text-xs text-gray-400 max-w-[120px] truncate" title={c.admin_note}>{c.admin_note}</div>
                          ):(
                            <span className="text-xs text-gray-700">—</span>
                          )}
                          <button onClick={()=>{setNoteClient(c);setNoteText(c.admin_note)}}
                            className="text-xs text-gray-600 hover:text-gray-400 mt-0.5 block transition">✏️ tahrir</button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <button disabled={isBusy} onClick={()=>giveSubscription(c.id,c.user_id,'standard',1)}
                              className="text-xs bg-blue-900/70 hover:bg-blue-800 disabled:opacity-40 text-blue-300 px-2 py-1 rounded transition">+1 oy</button>
                            <button disabled={isBusy} onClick={()=>giveSubscription(c.id,c.user_id,'standard',3)}
                              className="text-xs bg-blue-900/70 hover:bg-blue-800 disabled:opacity-40 text-blue-300 px-2 py-1 rounded transition">+3 oy</button>
                            <button disabled={isBusy} onClick={()=>giveSubscription(c.id,c.user_id,'ai_pro',1)}
                              className="text-xs bg-purple-900/70 hover:bg-purple-800 disabled:opacity-40 text-purple-300 px-2 py-1 rounded transition">AI Pro</button>
                            <button disabled={isBusy} onClick={()=>{setDemoForm({...demoForm,orgId:c.id});setDemoSearch(c.name);setAddDemoModal(true)}}
                              className="text-xs bg-orange-900/70 hover:bg-orange-800 disabled:opacity-40 text-orange-300 px-2 py-1 rounded transition">🎯</button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={()=>{setEditClient(c);setEditForm({plan:c.plan||'standard',period_end:c.period_end?c.period_end.split('T')[0]:new Date(Date.now()+30*86400000).toISOString().split('T')[0],is_active:c.is_active??true})}}
                              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2.5 py-1 rounded transition">✏️</button>
                            {c.sub_id&&c.is_active&&!isExpired2&&(
                              <button disabled={isBusy} onClick={()=>deactivateSubscription(c.sub_id!,c.name)}
                                className="text-xs bg-red-900/50 hover:bg-red-800 disabled:opacity-40 text-red-400 px-2.5 py-1 rounded transition">🚫</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {tab==='payments' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-yellow-400">{totalRevenue.toLocaleString('uz-UZ')}</div>
                <div className="text-xs text-gray-400 mt-0.5">Jami daromad (so'm)</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-400">{payments.filter(p=>new Date(p.created_at).getMonth()===now.getMonth()).length}</div>
                <div className="text-xs text-gray-400 mt-0.5">Bu oy to'lovlar</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-2xl font-bold text-emerald-400">
                  {payments.filter(p=>new Date(p.created_at).getMonth()===now.getMonth()).reduce((s,p)=>s+p.amount,0).toLocaleString('uz-UZ')}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Bu oy daromad (so'm)</div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/60">
                    {['TASHKILOT','MIQDOR','TARIF','IZOH','SANA'].map(h=>(
                      <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {payments.length===0&&<tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">To'lovlar yo'q</td></tr>}
                  {payments.map(p=>(
                    <tr key={p.id} className="hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3 text-sm font-medium text-white">{(p as any).org_name||'—'}</td>
                      <td className="px-4 py-3 text-sm text-yellow-400 font-semibold">{p.amount.toLocaleString('uz-UZ')} {p.currency}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.plan==='ai_pro'?'bg-purple-900 text-purple-300':'bg-blue-900 text-blue-300'}`}>
                          {p.plan==='ai_pro'?'AI Pro':'Standart'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{p.note||'—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{new Date(p.created_at).toLocaleDateString('uz-UZ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DEMO ── */}
        {tab==='demo' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/60">
                  {['TASHKILOT','STR','BERILGAN','TUGASH','QOLGAN','IZOH','HOLAT','AMAL'].map(h=>(
                    <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {demos.length===0&&<tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500 text-sm">Demo yo'q</td></tr>}
                {demos.map(d=>{
                  const exp=new Date(d.expires_at); const isExp=exp<now
                  const dl=Math.ceil((exp.getTime()-now.getTime())/86400000)
                  return (
                    <tr key={d.id} className="hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3 text-sm font-medium text-white">{d.org_name||'—'}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">{d.org_inn||'—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{new Date(d.created_at).toLocaleDateString('uz-UZ')}</td>
                      <td className={`px-4 py-3 text-sm ${isExp?'text-red-400':'text-gray-300'}`}>{exp.toLocaleDateString('uz-UZ')}</td>
                      <td className="px-4 py-3 text-sm">{d.is_active&&!isExp?<span className="text-emerald-400 font-semibold">{dl} kun</span>:<span className="text-red-400">Tugagan</span>}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 max-w-[140px] truncate">{d.note||'—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${d.is_active&&!isExp?'bg-emerald-900 text-emerald-300':'bg-gray-700 text-gray-500'}`}>
                          {d.is_active&&!isExp?'Faol':'Tugagan'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {d.is_active&&!isExp&&<button onClick={()=>deactivateDemo(d.id)} className="text-xs bg-red-900/50 hover:bg-red-800 text-red-400 px-2.5 py-1.5 rounded transition">Bekor</button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── NEW USERS ── */}
        {tab==='new' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {[7,14,30].map(d=>(
                <button key={d} onClick={()=>setNewDaysFilter(d)}
                  className={`px-4 py-1.5 rounded-lg text-sm transition ${newDaysFilter===d?'bg-blue-600 text-white':'bg-gray-800 text-gray-400 hover:text-white'}`}>
                  So'nggi {d} kun
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-500 self-center">{filteredNewUsers.length} ta yangi foydalanuvchi</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/60">
                    {['EMAIL',"RO'YXATDAN O'TGAN",'SO\'NGI KIRISH','TASHKILOT','TARIF'].map(h=>(
                      <th key={h} className="text-left text-xs font-medium text-gray-400 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredNewUsers.length===0&&<tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">Yangi foydalanuvchi yo'q</td></tr>}
                  {filteredNewUsers.map(u=>{
                    const org=clients.find(c=>c.user_id===u.id)
                    return (
                      <tr key={u.id} className="hover:bg-gray-800/30 transition">
                        <td className="px-4 py-3 text-sm text-blue-400">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{new Date(u.created_at).toLocaleDateString('uz-UZ')}</td>
                        <td className={`px-4 py-3 text-sm ${activityColor(u.last_sign_in_at)}`}>{activityLabel(u.last_sign_in_at)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{org?.name||<span className="text-gray-600">Tashkilot qo'shilmagan</span>}</td>
                        <td className="px-4 py-3">{org?planBadge(org):<span className="text-xs text-gray-600">—</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {tab==='feedback' && (
          <div className="space-y-2">
            {feedbacks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Hali takliflar yo&apos;q</div>
            ) : feedbacks.map(fb => (
              <div key={fb.id} className={`bg-gray-900 border rounded-xl p-4 ${fb.status==='new' ? 'border-blue-800/60' : 'border-gray-800'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        fb.category==='bug' ? 'bg-red-900/40 text-red-400' :
                        fb.category==='taklif' ? 'bg-blue-900/40 text-blue-400' :
                        fb.category==='savol' ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {fb.category==='bug'?'🐛 Xato':fb.category==='taklif'?'💡 Taklif':fb.category==='savol'?'❓ Savol':'📝 Boshqa'}
                      </span>
                      {fb.status==='new' && <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">Yangi</span>}
                      <span className="text-xs text-gray-500">{fb.user_email}</span>
                      <span className="text-xs text-gray-600">{new Date(fb.created_at).toLocaleDateString('uz-UZ')}</span>
                    </div>
                    <div className="font-medium text-white text-sm">{fb.title}</div>
                    <div className="text-gray-400 text-xs mt-1 whitespace-pre-wrap">{fb.message}</div>
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.from('feedback').update({ status: fb.status==='new'?'seen':'new' }).eq('id', fb.id)
                      setFeedbacks(prev => prev.map(f => f.id===fb.id ? {...f, status: f.status==='new'?'seen':'new'} : f))
                    }}
                    className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition flex-shrink-0">
                    {fb.status==='new' ? 'Ko\'rildi' : 'Yangilash'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── EDIT SUB MODAL ── */}
      {editClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <div><div className="font-semibold">{editClient.name}</div><div className="text-xs text-gray-400">Tarifni tahrirlash</div></div>
              <button onClick={()=>setEditClient(null)} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-lg text-lg">×</button>
            </div>
            <form onSubmit={updateSubscription} className="p-6 space-y-4">
              <div>
                <label className={lbl}>Tarif rejasi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{v:'free',l:'Bepul',c:'gray'},{v:'standard',l:'Standart',c:'blue'},{v:'ai_pro',l:'AI Pro',c:'purple'}].map(p=>(
                    <button key={p.v} type="button" onClick={()=>setEditForm({...editForm,plan:p.v})}
                      className={`py-2 rounded-lg text-sm font-medium transition border ${editForm.plan===p.v?(p.c==='blue'?'bg-blue-700 border-blue-500 text-white':p.c==='purple'?'bg-purple-700 border-purple-500 text-white':'bg-gray-600 border-gray-500 text-white'):'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Muddat tugash sanasi</label>
                <input type="date" className={inp} value={editForm.period_end} onChange={e=>setEditForm({...editForm,period_end:e.target.value})}/>
                <div className="flex gap-2 mt-2">
                  {[1,3,6,12].map(m=>(
                    <button key={m} type="button" onClick={()=>setEditForm({...editForm,period_end:new Date(Date.now()+m*30*86400000).toISOString().split('T')[0]})}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded transition">+{m} oy</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={editForm.is_active} onChange={e=>setEditForm({...editForm,is_active:e.target.checked})} className="w-4 h-4 accent-blue-500"/>
                <span className="text-sm text-gray-300">Faol holat</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setEditClient(null)} className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition">Bekor</button>
                <button type="submit" disabled={saving==='edit'} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
                  {saving==='edit'?'Saqlanmoqda...':'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NOTE MODAL ── */}
      {noteClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <div><div className="font-semibold">{noteClient.name}</div><div className="text-xs text-gray-400">Admin izohi</div></div>
              <button onClick={()=>setNoteClient(null)} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-lg text-lg">×</button>
            </div>
            <div className="p-6 space-y-4">
              <textarea className={inp + ' min-h-[120px] resize-none'} value={noteText}
                onChange={e=>setNoteText(e.target.value)}
                placeholder="Masalan: 21-mart qo'ng'iroq qilindi. To'lov kutilmoqda. Aprelda uzaytiradi."/>
              <div className="flex gap-3">
                <button onClick={()=>setNoteClient(null)} className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition">Bekor</button>
                <button onClick={saveNote} disabled={saving==='note'} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
                  {saving==='note'?'Saqlanmoqda...':'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENT MODAL ── */}
      {addPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <div><div className="font-semibold">💳 To'lov qo'shish</div><div className="text-xs text-gray-400">Obuna avtomatik faollashadi</div></div>
              <button onClick={()=>{setAddPaymentModal(false);setPayForm({orgId:'',amount:'',plan:'standard',note:''});setPaySearch('')}}
                className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-lg text-lg">×</button>
            </div>
            <form onSubmit={addPayment} className="p-6 space-y-4">
              <div>
                <label className={lbl}>Tashkilot</label>
                <input className={inp+' mb-2'} placeholder="Email yoki tashkilot nomi..." value={paySearch}
                  onChange={e=>{setPaySearch(e.target.value);setPayForm({...payForm,orgId:''})}}/>
                {!payForm.orgId&&(
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-700 divide-y divide-gray-800">
                    {clients.filter(c=>!paySearch||c.name.toLowerCase().includes(paySearch.toLowerCase())||c.user_email.toLowerCase().includes(paySearch.toLowerCase())||c.inn.includes(paySearch))
                      .slice(0,8).map(c=>(
                        <button key={c.id} type="button" onClick={()=>{setPayForm({...payForm,orgId:c.id});setPaySearch(c.name)}}
                          className="w-full text-left px-3 py-2.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition flex justify-between">
                          <span className="truncate">{c.name}</span>
                          <span className="text-xs text-gray-500 ml-2 shrink-0">{c.user_email}</span>
                        </button>
                      ))}
                  </div>
                )}
                {payForm.orgId&&(
                  <div className="flex items-center justify-between bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2">
                    <span className="text-sm text-blue-300">✓ {clients.find(c=>c.id===payForm.orgId)?.name}</span>
                    <button type="button" onClick={()=>{setPayForm({...payForm,orgId:''});setPaySearch('')}} className="text-xs text-gray-500 hover:text-white">o'zgartir</button>
                  </div>
                )}
              </div>
              <div>
                <label className={lbl}>Miqdor (so'm)</label>
                <input className={inp} placeholder="50 000" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})} required/>
                <div className="flex gap-2 mt-2">
                  {['50000','100000','199000','500000'].map(v=>(
                    <button key={v} type="button" onClick={()=>setPayForm({...payForm,amount:v})}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded transition">
                      {Number(v).toLocaleString('uz-UZ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Tarif</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{v:'standard',l:'Standart'},{v:'ai_pro',l:'AI Pro'}].map(p=>(
                    <button key={p.v} type="button" onClick={()=>setPayForm({...payForm,plan:p.v})}
                      className={`py-2 rounded-lg text-sm font-medium border transition ${payForm.plan===p.v?(p.v==='ai_pro'?'bg-purple-700 border-purple-500 text-white':'bg-blue-700 border-blue-500 text-white'):'bg-gray-800 border-gray-700 text-gray-400'}`}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Izoh (ixtiyoriy)</label>
                <input className={inp} placeholder="Masalan: Payme orqali to'ladi" value={payForm.note} onChange={e=>setPayForm({...payForm,note:e.target.value})}/>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={()=>{setAddPaymentModal(false);setPayForm({orgId:'',amount:'',plan:'standard',note:''});setPaySearch('')}}
                  className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition">Bekor</button>
                <button type="submit" disabled={paySaving||!payForm.orgId||!payForm.amount}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
                  {paySaving?'Saqlanmoqda...':'Saqlash + Obuna faollashtir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DEMO MODAL ── */}
      {addDemoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <div><div className="font-semibold">🎯 Demo kirish berish</div><div className="text-xs text-gray-400">Obunaga ta'sir qilmaydi</div></div>
              <button onClick={()=>{setAddDemoModal(false);setDemoForm({orgId:'',days:'3',note:''});setDemoSearch('')}}
                className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded-lg text-lg">×</button>
            </div>
            <form onSubmit={addDemo} className="p-6 space-y-4">
              <div>
                <label className={lbl}>Tashkilot</label>
                <input className={inp+' mb-2'} placeholder="Nomi yoki email..." value={demoSearch}
                  onChange={e=>{setDemoSearch(e.target.value);setDemoForm({...demoForm,orgId:''})}}/>
                {!demoForm.orgId&&(
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-700 divide-y divide-gray-800">
                    {clients.filter(c=>!demoSearch||c.name.toLowerCase().includes(demoSearch.toLowerCase())||c.inn.includes(demoSearch)||c.user_email.toLowerCase().includes(demoSearch.toLowerCase()))
                      .slice(0,8).map(c=>(
                        <button key={c.id} type="button" onClick={()=>{setDemoForm({...demoForm,orgId:c.id});setDemoSearch(c.name)}}
                          className="w-full text-left px-3 py-2.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 transition flex justify-between">
                          <span className="truncate">{c.name}</span>
                          <span className="text-xs text-gray-500 ml-2 shrink-0 font-mono">{c.inn}</span>
                        </button>
                      ))}
                  </div>
                )}
                {demoForm.orgId&&(
                  <div className="flex items-center justify-between bg-orange-900/20 border border-orange-800/40 rounded-lg px-3 py-2">
                    <span className="text-sm text-orange-300">✓ {clients.find(c=>c.id===demoForm.orgId)?.name}</span>
                    <button type="button" onClick={()=>{setDemoForm({...demoForm,orgId:''});setDemoSearch('')}} className="text-xs text-gray-500 hover:text-white">o'zgartir</button>
                  </div>
                )}
              </div>
              <div>
                <label className={lbl}>Necha kun</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {['1','2','3','5','7','14','30'].map(d=>(
                    <button key={d} type="button" onClick={()=>setDemoForm({...demoForm,days:d})}
                      className={`py-2 rounded-lg text-sm font-medium transition ${demoForm.days===d?'bg-orange-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Izoh (ixtiyoriy)</label>
                <input className={inp} placeholder="Masalan: Instagram reklama" value={demoForm.note} onChange={e=>setDemoForm({...demoForm,note:e.target.value})}/>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={()=>{setAddDemoModal(false);setDemoForm({orgId:'',days:'3',note:''});setDemoSearch('')}}
                  className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition">Bekor</button>
                <button type="submit" disabled={demoSaving||!demoForm.orgId}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
                  {demoSaving?'Berilmoqda...':`${demoForm.days} kun demo berish`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
