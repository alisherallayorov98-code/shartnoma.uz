'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Org, BankAccount, Counterparty, Contract, Subscription } from '@/lib/types'

const FREE_LIMIT = 5
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim())

type Profile = {
  full_name: string; phone: string; lavozim: string; avatar_url: string
  company_name: string; company_inn: string; company_director: string
  company_bank: string; company_account: string; company_mfo: string; company_address: string
}

type QuotaInfo = {
  plan: string
  used: number | null
  limit: number | null
  percent: number | null
}

type DashboardContextType = {
  // Auth
  userId: string
  userEmail: string
  isAdmin: boolean

  // Data
  orgs: Org[]
  activeOrg: Org | null
  bankAccounts: BankAccount[]
  cps: Counterparty[]
  contracts: Contract[]
  subscription: Subscription | null
  demoAccess: { expires_at: string } | null
  profile: Profile

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  orgDropdown: boolean
  setOrgDropdown: (v: boolean) => void
  initialLoading: boolean

  // Computed
  isFree: boolean
  isDemoActive: boolean
  isSubValid: boolean
  subDaysLeft: number | null

  // Actions
  switchOrg: (org: Org) => void
  reloadOrgs: () => Promise<void>
  reloadCps: () => Promise<void>
  reloadContracts: () => Promise<void>
  reloadSubscription: () => Promise<void>
  canCreateContract: () => boolean
  getQuotaInfo: () => QuotaInfo | null
  openUpgradeModal: () => void
  closeUpgradeModal: () => void
  upgradeModalOpen: boolean
  logout: () => Promise<void>
}

const defaultProfile: Profile = {
  full_name: '', phone: '', lavozim: '', avatar_url: '',
  company_name: '', company_inn: '', company_director: '',
  company_bank: '', company_account: '', company_mfo: '', company_address: ''
}

export const DashboardContext = createContext<DashboardContextType>({
  userId: '', userEmail: '', isAdmin: false,
  orgs: [], activeOrg: null, bankAccounts: [], cps: [], contracts: [],
  subscription: null, demoAccess: null, profile: defaultProfile,
  sidebarOpen: true, setSidebarOpen: () => {}, orgDropdown: false, setOrgDropdown: () => {},
  initialLoading: true,
  isFree: true, isDemoActive: false, isSubValid: false, subDaysLeft: null,
  switchOrg: () => {}, reloadOrgs: async () => {}, reloadCps: async () => {},
  reloadContracts: async () => {}, reloadSubscription: async () => {},
  canCreateContract: () => false, getQuotaInfo: () => null,
  openUpgradeModal: () => {}, closeUpgradeModal: () => {}, upgradeModalOpen: false,
  logout: async () => {},
})

export function useDashboard() {
  return useContext(DashboardContext)
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [orgs, setOrgs] = useState<Org[]>([])
  const [activeOrg, setActiveOrg] = useState<Org | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [cps, setCps] = useState<Counterparty[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [demoAccess, setDemoAccess] = useState<{ expires_at: string } | null>(null)
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [orgDropdown, setOrgDropdown] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  // ── Computed ──────────────────────────────────────────────────────────────
  const ADMIN_EMAILS_LIST = ADMIN_EMAILS
  const isAdmin = ADMIN_EMAILS_LIST.includes(userEmail)
  const isDemoActive = !!demoAccess && new Date(demoAccess.expires_at) > new Date()
  const isSubValid = !!subscription && subscription.plan !== 'free' && new Date(subscription.period_end) > new Date()
  const isFree = !isAdmin && !isDemoActive && !isSubValid

  const subDaysLeft = isSubValid && subscription?.period_end
    ? Math.ceil((new Date(subscription.period_end).getTime() - Date.now()) / 86400000)
    : null

  // ── Data loaders ──────────────────────────────────────────────────────────

  const loadOrgs = useCallback(async (currentActiveOrgId?: string) => {
    const { data, error } = await supabase.from('organizations').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadOrgs:', error.message); return }
    const list: Org[] = data || []
    setOrgs(list)
    if (list.length > 0) {
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('active_org_id') : null
      const current = list.find(o => o.id === savedId) || list.find(o => o.id === currentActiveOrgId) || list[0]
      setActiveOrg(current)
    }
  }, [])

  const loadBankAccounts = useCallback(async (orgId: string) => {
    const { data, error } = await supabase.from('bank_accounts').select('*')
      .eq('organization_id', orgId).order('is_default', { ascending: false })
    if (error) { console.error('loadBankAccounts:', error.message); return }
    setBankAccounts(data || [])
  }, [])

  const loadSubscription = useCallback(async (orgId: string) => {
    const { data } = await supabase.from('subscriptions').select('*')
      .eq('organization_id', orgId).eq('is_active', true)
      .gt('period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
    const list: Subscription[] = data || []
    // Best plan: ai_pro > standard > free
    const best = list.find(s => s.plan === 'ai_pro') || list.find(s => s.plan === 'standard') || list[0] || null
    setSubscription(best)
  }, [])

  const loadDemoAccess = useCallback(async (orgId: string) => {
    const { data } = await supabase.from('demo_access').select('expires_at')
      .eq('organization_id', orgId).eq('is_active', true)
      .gt('expires_at', new Date().toISOString()).single()
    setDemoAccess(data || null)
  }, [])

  const loadCps = useCallback(async () => {
    const { data, error } = await supabase.from('counterparties').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadCps:', error.message); return }
    setCps(data || [])
  }, [])

  const loadContracts = useCallback(async (orgId?: string) => {
    const q = supabase.from('contracts').select('*, organizations(*), counterparties(*)').order('created_at', { ascending: false })
    const { data, error } = orgId ? await q.eq('organization_id', orgId) : await q
    if (error) { console.error('loadContracts:', error.message); return }
    setContracts(data || [])
  }, [])

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (data) setProfile({
      full_name: data.full_name || '', phone: data.phone || '',
      lavozim: data.lavozim || '', avatar_url: data.avatar_url || '',
      company_name: data.company_name || '', company_inn: data.company_inn || '',
      company_director: data.company_director || '', company_bank: data.company_bank || '',
      company_account: data.company_account || '', company_mfo: data.company_mfo || '',
      company_address: data.company_address || ''
    })
  }, [])

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserEmail(session.user.email || '')
      setUserId(session.user.id)
      await Promise.all([loadOrgs(), loadCps(), loadProfile(session.user.id)])
      setInitialLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── When activeOrg changes ────────────────────────────────────────────────
  useEffect(() => {
    if (activeOrg) {
      loadBankAccounts(activeOrg.id)
      loadSubscription(activeOrg.id)
      loadDemoAccess(activeOrg.id)
      loadContracts(activeOrg.id)
    }
  }, [activeOrg?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────
  function switchOrg(org: Org) {
    setActiveOrg(org)
    setOrgDropdown(false)
    try { localStorage.setItem('active_org_id', org.id) } catch { /* */ }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function canCreateContract(): boolean {
    if (!subscription) return (contracts.filter(c => c.organization_id === activeOrg?.id).length < FREE_LIMIT)
    if (subscription.plan === 'free') return subscription.contracts_used < FREE_LIMIT
    return true
  }

  function getQuotaInfo(): QuotaInfo | null {
    if (!activeOrg) return null
    const orgContracts = contracts.filter(c => c.organization_id === activeOrg.id)
    if (!subscription || subscription.plan === 'free') {
      const used = subscription?.contracts_used ?? orgContracts.length
      return { plan: 'Bepul', used, limit: FREE_LIMIT, percent: Math.min((used / FREE_LIMIT) * 100, 100) }
    }
    const planLabel = subscription.plan === 'ai_pro' ? 'AI Pro' : subscription.plan === 'standard' ? 'Standart' : 'Bepul'
    return { plan: planLabel, used: null, limit: null, percent: null }
  }

  const reloadOrgs = useCallback(async () => {
    await loadOrgs(activeOrg?.id)
  }, [loadOrgs, activeOrg?.id])

  const reloadCps = useCallback(async () => {
    await loadCps()
  }, [loadCps])

  const reloadContracts = useCallback(async () => {
    await loadContracts(activeOrg?.id)
  }, [loadContracts, activeOrg?.id])

  const reloadSubscription = useCallback(async () => {
    if (activeOrg) await loadSubscription(activeOrg.id)
  }, [loadSubscription, activeOrg?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DashboardContext.Provider value={{
      userId, userEmail, isAdmin,
      orgs, activeOrg, bankAccounts, cps, contracts, subscription, demoAccess, profile,
      sidebarOpen, setSidebarOpen, orgDropdown, setOrgDropdown,
      initialLoading,
      isFree, isDemoActive, isSubValid, subDaysLeft,
      switchOrg,
      reloadOrgs, reloadCps, reloadContracts, reloadSubscription,
      canCreateContract, getQuotaInfo,
      openUpgradeModal: () => setUpgradeModalOpen(true),
      closeUpgradeModal: () => setUpgradeModalOpen(false),
      upgradeModalOpen,
      logout,
    }}>
      {children}
    </DashboardContext.Provider>
  )
}
