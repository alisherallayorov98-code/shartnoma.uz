'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Org, BankAccount, Counterparty, Contract, Subscription, Employee } from '@/lib/types'

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
  employees: Employee[]
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
  reloadEmployees: () => Promise<void>
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
  orgs: [], activeOrg: null, bankAccounts: [], cps: [], employees: [], contracts: [], contractsTotal: 0,
  subscription: null, demoAccess: null, profile: defaultProfile,
  sidebarOpen: true, setSidebarOpen: () => {}, orgDropdown: false, setOrgDropdown: () => {},
  initialLoading: true,
  isFree: true, isDemoActive: false, isSubValid: false, subDaysLeft: null,
  switchOrg: () => {}, reloadOrgs: async () => {}, reloadCps: async () => {}, reloadEmployees: async () => {},
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
  const [employees, setEmployees] = useState<Employee[]>([])
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
      .gt('expires_at', new Date().toISOString()).maybeSingle()
    if (error) { console.error('loadDemoAccess:', error.message); return }
    setDemoAccess(data || null)
  }, [])

  const loadCps = useCallback(async () => {
    const { data, error } = await supabase.from('counterparties').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadCps:', error.message); return }
    // INN bo'yicha deduplikatsiya — birinchi (yangi) yozuvni saqlaydi
    const seen = new Set<string>()
    const unique = (data || []).filter(cp => {
      const key = cp.inn?.trim() || cp.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    setCps(unique)
  }, [])

  const loadEmployees = useCallback(async (orgId?: string) => {
    const base = supabase.from('employees').select('*').order('ism', { ascending: true })
    const { data, error } = orgId ? await base.eq('organization_id', orgId) : await base
    if (error) { console.error('loadEmployees:', error.message); return }
    setEmployees(data || [])
  }, [])

  const loadContracts = useCallback(async (orgId?: string, limit = 50) => {
    // Faqat kerakli fieldlar — to'liq join emas (tezligi 3-5x oshadi)
    const base = supabase.from('contracts')
      .select('id, status, created_at, organization_id, counterparty_id, contract_number, currency, content, contract_date, contract_type, amount, end_date, description, extra_data, signed_us, signed_cp, spec_items, city, product_name, organizations(name,inn,address,director_name,bank_name,bank_account,mfo), counterparties(name,inn,address,director_name,bank_name,bank_account,mfo)', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(limit)
    const { data, count, error } = orgId ? await base.eq('organization_id', orgId) : await base
    if (error) { console.error('loadContracts:', error.message); return }
    setContracts((data || []) as unknown as Contract[])
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
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return }
        setUserEmail(session.user.email || '')
        setUserId(session.user.id)

        // Accept pending org invites — POST avoids email in URL query params (PII)
        if (session.user.email) {
          fetch('/api/accept-invite', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).catch(() => {/* non-critical */})
        }

        // Admin holati sessionStorage da keshlangan — har safar HTTP so'rov ketmaydi
        const cacheKey = `admin_${session.user.id}`
        const cached = sessionStorage.getItem(cacheKey)
        let adminOk = cached === '1'

        const adminFetch = cached === null
          ? fetch('/api/admin', {
              method: 'HEAD',
              headers: { Authorization: `Bearer ${session.access_token}` },
              signal: AbortSignal.timeout(2000),
            }).then(r => { sessionStorage.setItem(cacheKey, r.ok ? '1' : '0'); return r }).catch(() => ({ ok: false }))
          : Promise.resolve({ ok: adminOk })

        const [adminCheck] = await Promise.all([
          adminFetch,
          loadOrgs(),
          loadProfile(session.user.id),
        ])
        setIsAdmin((adminCheck as { ok: boolean }).ok)
      } catch (e) {
        console.error('Dashboard init error:', e)
      } finally {
        setInitialLoading(false)
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── When activeOrg changes ────────────────────────────────────────────────
  useEffect(() => {
    if (!activeOrg) return
    // Muhim ma'lumotlar — darhol parallel yuklanadi
    Promise.all([
      loadSubscription(activeOrg.id),
      loadDemoAccess(activeOrg.id),
      loadContracts(activeOrg.id),
    ])
    // Kam kerakli — kechiktiriladi (50ms dan keyin)
    const deferTimer = setTimeout(() => {
      loadBankAccounts(activeOrg.id)
      loadEmployees(activeOrg.id)
      loadCps()
    }, 50)

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
      }, () => { loadCps() })
      .subscribe()

    const orgsChannel = supabase
      .channel(`organizations:${activeOrg.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'organizations',
      }, () => { loadOrgs(activeOrg.id) })
      .subscribe()

    const employeesChannel = supabase
      .channel(`employees:${activeOrg.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'employees',
        filter: `organization_id=eq.${activeOrg.id}`,
      }, () => { loadEmployees(activeOrg.id) })
      .subscribe()

    // Subscription changes (e.g. payment webhook activates plan)
    const subsChannel = supabase
      .channel(`subscriptions:${activeOrg.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'subscriptions',
        filter: `organization_id=eq.${activeOrg.id}`,
      }, () => { loadSubscription(activeOrg.id) })
      .subscribe()

    return () => {
      clearTimeout(deferTimer)
      supabase.removeChannel(contractsChannel)
      supabase.removeChannel(cpsChannel)
      supabase.removeChannel(orgsChannel)
      supabase.removeChannel(employeesChannel)
      supabase.removeChannel(subsChannel)
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
    if (!activeOrg) return false
    if (!subscription) return contracts.filter(c => c.organization_id === activeOrg.id).length < FREE_LIMIT
    if (subscription.plan === 'free') return subscription.contracts_used < FREE_LIMIT
    return subscription.is_active
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

  const reloadEmployees = useCallback(async () => {
    await loadEmployees(activeOrg?.id)
  }, [loadEmployees, activeOrg?.id])

  const reloadContracts = useCallback(async () => {
    await loadContracts(activeOrg?.id)
  }, [loadContracts, activeOrg?.id])

  const contractsLengthRef = useRef(0)
  contractsLengthRef.current = contracts.length

  const loadMoreContracts = useCallback(async () => {
    if (!activeOrg) return
    const offset = contractsLengthRef.current
    const { data, error } = await supabase.from('contracts')
      .select('id, status, created_at, organization_id, counterparty_id, contract_number, currency, content, contract_date, contract_type, amount, end_date, description, extra_data, signed_us, signed_cp, spec_items, city, product_name, organizations(name,inn,address,director_name,bank_name,bank_account,mfo), counterparties(name,inn,address,director_name,bank_name,bank_account,mfo)')
      .eq('organization_id', activeOrg.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + 49)
    if (error || !data) return
    setContracts(prev => [...prev, ...(data as unknown as Contract[])])
  }, [activeOrg])

  const reloadSubscription = useCallback(async () => {
    if (activeOrg) await loadSubscription(activeOrg.id)
  }, [loadSubscription, activeOrg?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const ctxValue = useMemo(() => ({
    userId, userEmail, isAdmin,
    orgs, activeOrg, bankAccounts, cps, employees, contracts, contractsTotal, subscription, demoAccess, profile,
    sidebarOpen, setSidebarOpen, orgDropdown, setOrgDropdown,
    initialLoading,
    isFree, isDemoActive, isSubValid, subDaysLeft,
    switchOrg,
    reloadOrgs, reloadCps, reloadEmployees, reloadContracts, loadMoreContracts, reloadSubscription,
    canCreateContract, hasAiAccess, getQuotaInfo,
    openUpgradeModal: () => setUpgradeModalOpen(true),
    closeUpgradeModal: () => setUpgradeModalOpen(false),
    upgradeModalOpen,
    logout,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [userId, userEmail, isAdmin, orgs, activeOrg, bankAccounts, cps, employees, contracts,
      contractsTotal, subscription, demoAccess, profile, sidebarOpen, orgDropdown,
      initialLoading, isFree, isDemoActive, isSubValid, subDaysLeft, upgradeModalOpen])

  return (
    <DashboardContext.Provider value={ctxValue}>
      {children}
    </DashboardContext.Provider>
  )
}
