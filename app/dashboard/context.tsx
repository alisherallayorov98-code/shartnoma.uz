'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Org, BankAccount, Counterparty, Contract, Subscription } from '@/lib/types'

const FREE_LIMIT = 5

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
  contractsTotal: number
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
  loadMoreContracts: () => Promise<void>
  reloadSubscription: () => Promise<void>
  canCreateContract: () => boolean
  hasAiAccess: () => boolean
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
  orgs: [], activeOrg: null, bankAccounts: [], cps: [], contracts: [], contractsTotal: 0,
  subscription: null, demoAccess: null, profile: defaultProfile,
  sidebarOpen: true, setSidebarOpen: () => {}, orgDropdown: false, setOrgDropdown: () => {},
  initialLoading: true,
  isFree: true, isDemoActive: false, isSubValid: false, subDaysLeft: null,
  switchOrg: () => {}, reloadOrgs: async () => {}, reloadCps: async () => {},
  reloadContracts: async () => {}, loadMoreContracts: async () => {}, reloadSubscription: async () => {},
  canCreateContract: () => false, hasAiAccess: () => false, getQuotaInfo: () => null,
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
  const [contractsTotal, setContractsTotal] = useState(0)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [demoAccess, setDemoAccess] = useState<{ expires_at: string } | null>(null)
  const [profile, setProfile] = useState<Profile>(defaultProfile)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [orgDropdown, setOrgDropdown] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  // ── Computed ──────────────────────────────────────────────────────────────
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
    const { data, error } = await supabase.from('subscriptions').select('*')
      .eq('organization_id', orgId).eq('is_active', true)
      .gt('period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) { console.error('loadSubscription:', error.message); return }
    const list: Subscription[] = data || []
    const best = list.find(s => s.plan === 'ai_pro') || list.find(s => s.plan === 'standard') || list[0] || null
    setSubscription(best)
  }, [])

  const loadDemoAccess = useCallback(async (orgId: string) => {
    const { data, error } = await supabase.from('demo_access').select('expires_at')
      .eq('organization_id', orgId).eq('is_active', true)
      .gt('expires_at', new Date().toISOString()).single()
    if (error && error.code !== 'PGRST116') { console.error('loadDemoAccess:', error.message); return }
    setDemoAccess(data || null)
  }, [])

  const loadCps = useCallback(async () => {
    const { data, error } = await supabase.from('counterparties').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadCps:', error.message); return }
    setCps(data || [])
  }, [])

  const loadContracts = useCallback(async (orgId?: string, limit = 50) => {
    const base = supabase.from('contracts').select('*, organizations(*), counterparties(*)', { count: 'exact' }).order('created_at', { ascending: false }).limit(limit)
    const { data, count, error } = orgId ? await base.eq('organization_id', orgId) : await base
    if (error) { console.error('loadContracts:', error.message); return }
    setContracts(data || [])
    setContractsTotal(count ?? data?.length ?? 0)
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
      const [adminCheck] = await Promise.all([
        fetch('/api/admin', { method: 'HEAD', headers: { Authorization: `Bearer ${session.access_token}` } }),
        loadOrgs(),
        loadCps(),
        loadProfile(session.user.id),
      ])
      setIsAdmin(adminCheck.ok)
      setInitialLoading(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── When activeOrg changes ────────────────────────────────────────────────
  useEffect(() => {
    if (!activeOrg) return
    loadBankAccounts(activeOrg.id)
    loadSubscription(activeOrg.id)
    loadDemoAccess(activeOrg.id)
    loadContracts(activeOrg.id)

    // Real-time: reload data when another tab/device changes them
    const contractsChannel = supabase
      .channel(`contracts:${activeOrg.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'contracts',
        filter: `organization_id=eq.${activeOrg.id}`,
      }, () => { loadContracts(activeOrg.id) })
      .subscribe()

    const cpsChannel = supabase
      .channel(`counterparties:${activeOrg.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'counterparties',
        filter: `organization_id=eq.${activeOrg.id}`,
      }, () => { loadCps() })
      .subscribe()

    const orgsChannel = supabase
      .channel(`organizations:${activeOrg.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'organizations',
      }, () => { loadOrgs(activeOrg.id) })
      .subscribe()

    return () => {
      supabase.removeChannel(contractsChannel)
      supabase.removeChannel(cpsChannel)
      supabase.removeChannel(orgsChannel)
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

  function hasAiAccess(): boolean {
    if (isAdmin) return true
    if (!subscription) return false
    return subscription.plan === 'ai_pro' && subscription.is_active
  }

  function getQuotaInfo(): QuotaInfo | null {
    if (!activeOrg) return null
    const orgContracts = contracts.filter(c => c.organization_id === activeOrg.id)
    if (!subscription || subscription.plan === 'free') {
      const used = subscription?.contracts_used ?? orgContracts.length
      return { plan: 'Bepul', used, limit: FREE_LIMIT, percent: Math.min((used / FREE_LIMIT) * 100, 100) }
    }
    const planLabel = subscription.plan === 'ai_pro' ? 'AI Pro' : subscription.plan === 'standard' ? 'Standart' : 'Bepul'
    return { plan: planLabel, used: orgContracts.length, limit: null, percent: null }
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

  const contractsLengthRef = useRef(0)
  contractsLengthRef.current = contracts.length

  const loadMoreContracts = useCallback(async () => {
    if (!activeOrg) return
    const offset = contractsLengthRef.current
    const { data, error } = await supabase.from('contracts')
      .select('*, organizations(*), counterparties(*)')
      .eq('organization_id', activeOrg.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + 49)
    if (error || !data) return
    setContracts(prev => [...prev, ...data])
  }, [activeOrg])

  const reloadSubscription = useCallback(async () => {
    if (activeOrg) await loadSubscription(activeOrg.id)
  }, [loadSubscription, activeOrg?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DashboardContext.Provider value={{
      userId, userEmail, isAdmin,
      orgs, activeOrg, bankAccounts, cps, contracts, contractsTotal, subscription, demoAccess, profile,
      sidebarOpen, setSidebarOpen, orgDropdown, setOrgDropdown,
      initialLoading,
      isFree, isDemoActive, isSubValid, subDaysLeft,
      switchOrg,
      reloadOrgs, reloadCps, reloadContracts, loadMoreContracts, reloadSubscription,
      canCreateContract, hasAiAccess, getQuotaInfo,
      openUpgradeModal: () => setUpgradeModalOpen(true),
      closeUpgradeModal: () => setUpgradeModalOpen(false),
      upgradeModalOpen,
      logout,
    }}>
      {children}
    </DashboardContext.Provider>
  )
}
