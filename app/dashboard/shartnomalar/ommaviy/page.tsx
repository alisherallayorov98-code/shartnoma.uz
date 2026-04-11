'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../../context'
import { getStructure, structureToText, numberToWords } from '@/lib/contractStructures'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import { type AppTemplate } from '@/lib/defaultTemplates'
import { fillPlaceholders } from '@/lib/contractUtils'
import { latinToCyrillic } from '@/lib/scriptNorm'
import { logAudit } from '@/lib/audit'
import { useToast } from '@/lib/toast'
import type { Counterparty } from '@/lib/types'

// ─── Shartnoma raqam generatsiyasi ────────────────────────────────────────────

function generateContractNumbers(base: string, count: number): string[] {
  if (count === 0) return []
  const b = base.trim()

  // 1. Toza son: 50 → 50, 51, 52, 53
  if (/^\d+$/.test(b)) {
    const start = parseInt(b)
    return Array.from({ length: count }, (_, i) => String(start + i))
  }

  // 2. Nol bilan boshlanadigan suffiks: 2026/001 → 2026/001, 2026/002, 2026/003
  const padded = b.match(/^(.*[\/\-])(\d+)$/)
  if (padded && padded[2].startsWith('0')) {
    const prefix = padded[1], num = padded[2]
    const start = parseInt(num), pad = num.length
    return Array.from({ length: count }, (_, i) =>
      prefix + String(start + i).padStart(pad, '0')
    )
  }

  // 3. Boshqa holat: 01/10 → 01/10, 01/10-1, 01/10-2, 01/10-3
  return [b, ...Array.from({ length: count - 1 }, (_, i) => `${b}-${i + 1}`)]
}

// ─── Tur ranglari ─────────────────────────────────────────────────────────────

const CONTRACT_TYPES = [
  { key: 'oldi_sotdi', color: '#3B82F6' }, { key: 'xizmat', color: '#10B981' },
  { key: 'ijara', color: '#F59E0B' },      { key: 'pudrat', color: '#F97316' },
  { key: 'moliyaviy', color: '#8B5CF6' },  { key: 'daval', color: '#06B6D4' },
  { key: 'xalqaro', color: '#6366F1' },    { key: 'agentlik', color: '#EC4899' },
  { key: 'transport', color: '#14B8A6' },  { key: 'lizing', color: '#64748B' },
  { key: 'qoshimcha', color: '#6B7280' },  { key: 'boshqa', color: '#4B5563' },
]

// ─── Viloyat → Shahar ─────────────────────────────────────────────────────────

function orgCityDefault(org: { viloyat?: string; tuman?: string } | null | undefined): string {
  if (!org) return 'Toshkent shahri'
  if (org.tuman?.trim()) return org.tuman.trim()
  const v = org.viloyat?.trim() || ''
  const MAP: Record<string, string> = {
    'Toshkent shahri': 'Toshkent shahri', 'Toshkent viloyati': 'Toshkent shahri',
    'Samarqand': 'Samarqand shahri', 'Buxoro': 'Buxoro shahri',
    "Farg'ona": "Farg'ona shahri", 'Andijon': 'Andijon shahri',
    'Namangan': 'Namangan shahri', 'Qashqadaryo': 'Qarshi shahri',
    'Surxondaryo': 'Termiz shahri', 'Navoiy': 'Navoiy shahri',
    'Jizzax': 'Jizzax shahri', 'Sirdaryo': 'Guliston shahri',
    'Xorazm': 'Urganch shahri', "Qoraqalpog'iston": 'Nukus shahri',
  }
  return MAP[v] || 'Toshkent shahri'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OmmaviyPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { toast } = useToast()
  const router = useRouter()

  const {
    orgs, cps, activeOrg, subscription, contracts, bankAccounts,
    canCreateContract, openUpgradeModal, reloadContracts, userId, isSubValid,
  } = useDashboard()

  const [step, setStep] = useState(1)

  // Step 1 — sozlamalar
  const [contractType, setContractType] = useState('oldi_sotdi')
  const [baseNumber, setBaseNumber] = useState('')
  const [contractDate, setContractDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [productName, setProductName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('auto')
  const [customTemplates, setCustomTemplates] = useState<AppTemplate[]>([])

  // Step 2 — kontragentlar
  const [cpSearch, setCpSearch] = useState('')
  const [selectedCpIds, setSelectedCpIds] = useState<Set<string>>(new Set())
  const [cpStatusFilter, setCpStatusFilter] = useState<'all' | 'without' | 'with'>('all')
  const [filterYear, setFilterYear] = useState<number>(() => new Date().getFullYear())
  const [existingCpIds, setExistingCpIds] = useState<Set<string>>(new Set())
  const [loadingExisting, setLoadingExisting] = useState(false)

  // Step 3 — yaratish
  const [creating, setCreating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [createdCount, setCreatedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!canCreateContract()) { openUpgradeModal(); router.push('/dashboard/shartnomalar'); return }
    if (!activeOrg) { router.push('/dashboard/shartnomalar'); return }
    loadCustomTemplates()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // contractDate o'zgarganda filterYear yangilansin
  useEffect(() => {
    const year = new Date(contractDate).getFullYear()
    if (!isNaN(year)) setFilterYear(year)
  }, [contractDate])

  // Step 2 ga o'tganda yoki filterYear o'zgarganda mavjud shartnomalarni yukla
  useEffect(() => {
    if (step === 2 && activeOrg) {
      loadExistingContracts(filterYear)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, filterYear, activeOrg])

  async function loadExistingContracts(year: number) {
    if (!activeOrg) return
    setLoadingExisting(true)
    const { data } = await supabase
      .from('contracts')
      .select('counterparty_id')
      .eq('organization_id', activeOrg.id)
      .gte('contract_date', `${year}-01-01`)
      .lte('contract_date', `${year}-12-31`)
    if (data) {
      setExistingCpIds(new Set(
        data.map((d: { counterparty_id: string }) => d.counterparty_id).filter(Boolean)
      ))
    }
    setLoadingExisting(false)
  }

  async function loadCustomTemplates() {
    if (!activeOrg) return
    const { data } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('organization_id', activeOrg.id)
      .order('created_at', { ascending: false })
    if (data) {
      setCustomTemplates(data.map((d: Record<string, unknown>) => ({
        id: d.id as string, type: d.type as string, name: d.name as string,
        description: (d.description as string) || '', content: d.content as string,
        isDefault: false, icon: '📄', tags: [],
      })))
    }
  }

  // ── Filtrlangan kontragentlar ─────────────────────────────────────────────

  const filteredCps = useMemo(() => {
    let result = cps
    const q = cpSearch.trim().toLowerCase()
    if (q) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.inn || '').includes(q)
      )
    }
    if (cpStatusFilter === 'without') result = result.filter(c => !existingCpIds.has(c.id))
    else if (cpStatusFilter === 'with') result = result.filter(c => existingCpIds.has(c.id))
    return result
  }, [cps, cpSearch, cpStatusFilter, existingCpIds])

  // ── Tanlangan kontragentlar ───────────────────────────────────────────────

  const selectedCps = useMemo(
    () => cps.filter(c => selectedCpIds.has(c.id)),
    [cps, selectedCpIds]
  )

  // ── Shartnoma raqamlari preview ───────────────────────────────────────────

  const previewNumbers = useMemo(() => {
    if (!baseNumber.trim() || selectedCps.length === 0) return []
    return generateContractNumbers(baseNumber.trim(), selectedCps.length)
  }, [baseNumber, selectedCps.length])

  // ── Toggle ────────────────────────────────────────────────────────────────

  function toggleCp(id: string) {
    setSelectedCpIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (filteredCps.every(c => selectedCpIds.has(c.id))) {
      setSelectedCpIds(prev => {
        const next = new Set(prev)
        filteredCps.forEach(c => next.delete(c.id))
        return next
      })
    } else {
      setSelectedCpIds(prev => {
        const next = new Set(prev)
        filteredCps.forEach(c => next.add(c.id))
        return next
      })
    }
  }

  // ── Validatsiya ───────────────────────────────────────────────────────────

  function validateStep1(): boolean {
    if (!baseNumber.trim()) { toast(T(t.ommaviy.errNumRequired), 'error'); return false }
    if (!contractDate) { toast(T(t.ommaviy.errDateRequired), 'error'); return false }
    return true
  }

  function validateStep2(): boolean {
    if (selectedCpIds.size === 0) { toast(T(t.ommaviy.errSelectCp), 'error'); return false }
    return true
  }

  // ── Kontent generatsiya ───────────────────────────────────────────────────

  function buildContent(contractNumber: string, cp: Counterparty): string {
    const org = orgs.find(o => o.id === activeOrg?.id)
    const amt = parseFloat(amount) || 0
    const city = orgCityDefault(org)
    const defaultBank = bankAccounts.find(b => b.is_default) || bankAccounts[0]

    // Agar maxsus shablon tanlangan bo'lsa
    const tpl = customTemplates.find(t => t.id === selectedTemplate)
    if (tpl) {
      let content = fillPlaceholders(tpl.content, {
        contract_number: contractNumber,
        contract_date: contractDate,
        city,
        amount: amt,
        organizations: org,
        counterparties: cp,
        org_bank: defaultBank
          ? { bank_name: defaultBank.bank_name, account_number: defaultBank.account_number, mfo: defaultBank.mfo }
          : null,
        product_name: productName,
      })
      if (lang === 'oz') content = latinToCyrillic(content)
      return content
    }

    // Avtomatik shablon (structure)
    const structure = getStructure(contractType, {
      contract_number: contractNumber,
      contract_date: contractDate,
      city,
      org_name: org?.name || '',
      org_inn: org?.inn || '',
      org_director: org?.director_name || '',
      cp_name: cp.name || '',
      cp_inn: cp.inn || '',
      cp_director: cp.director_name || '',
      amount: amt,
      amount_text: amt > 0 ? numberToWords(amt, 'uz') + " so'm" : '___',
      extra: productName ? { TOVAR_NOMI: productName } : {},
    })

    let content = structureToText(structure, {
      type_name: (CONTRACT_TYPE_NAMES as Record<string, string>)[contractType] || contractType,
      number: contractNumber,
      date: contractDate,
      city,
      org,
      cp,
      contract_type: contractType,
    })

    if (lang === 'oz') content = latinToCyrillic(content)
    return content
  }

  // ── Batch yaratish ────────────────────────────────────────────────────────

  async function handleCreate() {
    // Bepul rejada qolgan slotni tekshirish
    if (!isSubValid) {
      const FREE_LIMIT = 5
      const used = subscription
        ? (subscription.contracts_used || 0)
        : contracts.filter(c => c.organization_id === activeOrg?.id).length
      const remaining = Math.max(0, FREE_LIMIT - used)
      if (selectedCps.length > remaining) {
        toast(
          remaining === 0
            ? T(t.ommaviy.errFreeLimit).replace('{limit}', String(FREE_LIMIT))
            : T(t.ommaviy.errFreeSlots).replace('{remaining}', String(remaining)).replace('{count}', String(selectedCps.length)),
          'error'
        )
        openUpgradeModal()
        return
      }
    }

    setCreating(true)
    setProgress(0)
    setCreatedCount(0)
    setErrorCount(0)

    const numbers = generateContractNumbers(baseNumber.trim(), selectedCps.length)
    const total = selectedCps.length
    let ok = 0, fail = 0

    const CHUNK = 5
    for (let i = 0; i < total; i += CHUNK) {
      const chunk = selectedCps.slice(i, i + CHUNK)
      const payloads = chunk.map((cp, j) => {
        const contractNumber = numbers[i + j]
        return {
          contract_number: contractNumber,
          contract_date: contractDate,
          contract_type: contractType,
          amount: parseFloat(amount) || 0,
          organization_id: activeOrg!.id,
          counterparty_id: cp.id,
          status: 'active',
          content: buildContent(contractNumber, cp),
          city: orgCityDefault(orgs.find(o => o.id === activeOrg?.id)),
          product_name: productName,
          spec_items: [],
          qqs_enabled: false,
          qqs_rate: 12,
          extra_data: {},
          user_id: userId,
        }
      })

      const { data: inserted, error } = await supabase
        .from('contracts')
        .insert(payloads)
        .select('id')

      if (error) {
        fail += chunk.length
      } else {
        ok += inserted?.length || 0
        // Audit log
        inserted?.forEach((row: { id: string }, j: number) => {
          logAudit('create', 'contracts', row.id, {
            contract_number: payloads[j].contract_number,
            contract_type: contractType,
          })
        })
      }

      setProgress(Math.round(((i + chunk.length) / total) * 100))
      setCreatedCount(ok)
      setErrorCount(fail)
    }

    // Subscription yangilash
    if (subscription && ok > 0) {
      await supabase
        .from('subscriptions')
        .update({ contracts_used: (subscription.contracts_used || 0) + ok })
        .eq('id', subscription.id)
    }

    await reloadContracts()
    setDone(true)
    setCreating(false)

    if (fail === 0) {
      toast(T(t.ommaviy.toastSuccess).replace('{count}', String(ok)), 'success')
    } else {
      toast(T(t.ommaviy.toastPartial).replace('{ok}', String(ok)).replace('{fail}', String(fail)), 'error')
    }
  }

  // ─── UI ────────────────────────────────────────────────────────────────────

  const allFilteredSelected = filteredCps.length > 0 && filteredCps.every(c => selectedCpIds.has(c.id))

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard/shartnomalar')}
          className="text-gray-400 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-white">{T(t.ommaviy.title)}</h1>
      </div>

      {/* ── Steps ── */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: T(t.ommaviy.step1) },
          { n: 2, label: T(t.ommaviy.step2) },
          { n: 3, label: T(t.ommaviy.step3) },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
              step === n
                ? 'bg-orange-500 text-white'
                : step > n
                  ? 'bg-green-600/30 text-green-400 border border-green-600/30'
                  : 'bg-[#1F2937] text-gray-500'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step > n ? 'bg-green-500 text-white' : step === n ? 'bg-white/20' : 'bg-[#374151]'
              }`}>
                {step > n ? '✓' : n}
              </span>
              {label}
            </div>
            {n < 3 && <div className="w-6 h-px bg-[#1E293B]"/>}
          </div>
        ))}
      </div>

      {/* ──────────────────── STEP 1 ──────────────────── */}
      {step === 1 && (
        <div className="max-w-2xl space-y-6">
          {/* Shartnoma turi */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <label className="block text-sm text-gray-400 mb-3 font-medium">{T(t.ommaviy.typeLabel)}</label>
            <div className="grid grid-cols-3 gap-2">
              {CONTRACT_TYPES.map(({ key, color }) => (
                <button
                  key={key}
                  onClick={() => setContractType(key)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition border ${
                    contractType === key
                      ? 'border-transparent text-white'
                      : 'border-[#1E293B] text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}
                  style={contractType === key ? { backgroundColor: color + '33', borderColor: color, color } : {}}
                >
                  {(CONTRACT_TYPE_NAMES as Record<string, string>)[key]}
                </button>
              ))}
            </div>
          </div>

          {/* Raqam va sana */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                {T(t.ommaviy.baseNumLabel)}
              </label>
              <input
                type="text"
                value={baseNumber}
                onChange={e => setBaseNumber(e.target.value)}
                placeholder={T(t.ommaviy.baseNumPlh)}
                className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:border-orange-500 focus:outline-none"
              />
              {baseNumber.trim() && (
                <p className="mt-2 text-xs text-gray-500">
                  {T(t.ommaviy.sample)}&nbsp;
                  {generateContractNumbers(baseNumber.trim(), Math.min(4, 5)).map((n, i) => (
                    <span key={i} className="text-orange-400 font-mono mr-2">{n}</span>
                  ))}
                  {selectedCpIds.size > 4 && <span className="text-gray-600">...</span>}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">{T(t.ommaviy.dateLabel)}</label>
              <input
                type="date"
                value={contractDate}
                onChange={e => setContractDate(e.target.value)}
                className="bg-[#0B1220] border border-[#1E293B] rounded-lg px-3 py-2.5 text-white text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Ixtiyoriy maydonlar */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 space-y-4">
            <p className="text-sm text-gray-400 font-medium">{T(t.ommaviy.optionalFields)}</p>

            <div>
              <label className="block text-xs text-gray-500 mb-1">{T(t.ommaviy.amountLabel)}</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">{T(t.ommaviy.productLabel)}</label>
              <input
                type="text"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder={T(t.ommaviy.productPlh)}
                className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {customTemplates.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">{T(t.ommaviy.templateLabel)}</label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg px-3 py-2.5 text-white text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="auto">{T(t.ommaviy.templateAuto)}</option>
                  {customTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => { if (validateStep1()) setStep(2) }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition"
            >
              {T(t.ommaviy.next)}
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────── STEP 2 ──────────────────── */}
      {step === 2 && (
        <div className="max-w-2xl space-y-4">
          {/* Yil + status filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{T(t.ommaviy.checkYear)}</span>
              <select
                value={filterYear}
                onChange={e => setFilterYear(Number(e.target.value))}
                className="bg-[#111827] border border-[#1E293B] rounded-lg px-2 py-1.5 text-white text-sm focus:border-orange-500 focus:outline-none"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1">
              {([
                { key: 'all',     label: T(t.ommaviy.filterAll) },
                { key: 'without', label: T(t.ommaviy.filterWithout) },
                { key: 'with',    label: T(t.ommaviy.filterWith) },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCpStatusFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    cpStatusFilter === key
                      ? key === 'without'
                        ? 'bg-green-500/20 text-green-400 border-green-500/40'
                        : key === 'with'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'bg-[#111827] border-[#1E293B] text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {loadingExisting && <span className="text-xs text-gray-500 animate-pulse">{T(t.ommaviy.checking)}</span>}
          </div>

          {/* Search + select all */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                value={cpSearch}
                onChange={e => setCpSearch(e.target.value)}
                placeholder={T(t.ommaviy.searchPlh)}
                className="w-full bg-[#111827] border border-[#1E293B] rounded-lg pl-9 pr-3 py-2.5 text-white text-sm placeholder-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <button
              onClick={toggleAll}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition border ${
                allFilteredSelected
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30'
                  : 'bg-[#111827] border-[#1E293B] text-gray-300 hover:border-gray-500'
              }`}
            >
              {allFilteredSelected ? T(t.ommaviy.deselectAll) : T(t.ommaviy.selectAll)}
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span>{T(t.ommaviy.total)} <b className="text-white">{cps.length}</b></span>
            {cpSearch && <span>{T(t.ommaviy.found)} <b className="text-white">{filteredCps.length}</b></span>}
            <span>
              {filterYear}{T(t.ommaviy.withContract)} <b className="text-orange-400">{existingCpIds.size}</b>
            </span>
            {selectedCpIds.size > 0 && (
              <span className="text-orange-400">
                {T(t.ommaviy.selected)} <b>{selectedCpIds.size}</b>
              </span>
            )}
          </div>

          {/* List */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            {filteredCps.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                {cps.length === 0 ? T(t.ommaviy.noCps) : T(t.ommaviy.noSearch)}
              </div>
            ) : (
              <div className="divide-y divide-[#1E293B] max-h-[480px] overflow-y-auto">
                {filteredCps.map(cp => {
                  const checked = selectedCpIds.has(cp.id)
                  return (
                    <label
                      key={cp.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                        checked ? 'bg-orange-500/5' : 'hover:bg-[#0B1220]/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCp(cp.id)}
                        className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{cp.name}</p>
                        <p className="text-xs text-gray-500">{cp.inn || '—'}</p>
                      </div>
                      {existingCpIds.has(cp.id) && (
                        <span className="text-xs text-orange-400 bg-orange-900/20 px-2 py-0.5 rounded whitespace-nowrap">
                          {filterYear} ✓
                        </span>
                      )}
                      {cp.stir_status === 'inactive' && (
                        <span className="text-xs text-red-400 bg-red-900/20 px-2 py-0.5 rounded">{T(t.ommaviy.inactive)}</span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-gray-400 hover:text-white text-sm transition"
            >
              {T(t.ommaviy.back)}
            </button>
            <button
              onClick={() => { if (validateStep2()) setStep(3) }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition"
            >
              {T(t.ommaviy.next)}
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────── STEP 3 ──────────────────── */}
      {step === 3 && (
        <div className="max-w-2xl space-y-6">

          {/* Yakunlanmagan holatda xulosa */}
          {!done && (
            <>
              {/* Umumiy ma'lumot */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 space-y-3">
                <p className="text-sm text-gray-400 font-medium mb-3">{T(t.ommaviy.summaryTitle)}</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#0B1220] rounded-lg p-3">
                    <p className="text-gray-500 text-xs">{T(t.ommaviy.labelType)}</p>
                    <p className="text-white font-medium mt-0.5">
                      {(CONTRACT_TYPE_NAMES as Record<string, string>)[contractType]}
                    </p>
                  </div>
                  <div className="bg-[#0B1220] rounded-lg p-3">
                    <p className="text-gray-500 text-xs">{T(t.ommaviy.labelDate)}</p>
                    <p className="text-white font-medium mt-0.5">{contractDate}</p>
                  </div>
                  <div className="bg-[#0B1220] rounded-lg p-3">
                    <p className="text-gray-500 text-xs">{T(t.ommaviy.labelCps)}</p>
                    <p className="text-orange-400 font-bold text-xl mt-0.5">{selectedCps.length}</p>
                  </div>
                  {amount && (
                    <div className="bg-[#0B1220] rounded-lg p-3">
                      <p className="text-gray-500 text-xs">{T(t.ommaviy.labelAmount)}</p>
                      <p className="text-white font-medium mt-0.5">
                        {parseFloat(amount).toLocaleString('uz-UZ')} so&apos;m
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Raqamlar preview */}
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
                <p className="text-sm text-gray-400 font-medium mb-3">{T(t.ommaviy.numbersTitle)}</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {previewNumbers.slice(0, 8).map((num, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="font-mono text-orange-400 min-w-[120px]">{num}</span>
                      <span className="text-gray-500 truncate">{selectedCps[i]?.name}</span>
                    </div>
                  ))}
                  {previewNumbers.length > 8 && (
                    <p className="text-xs text-gray-600 pt-1">
                      {T(t.ommaviy.andMore)} {previewNumbers.length - 8} {T(t.ommaviy.andMoreSuffix)}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bar (faqat yaratish jarayonida) */}
              {creating && (
                <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">{T(t.ommaviy.creating)}</span>
                    <span className="text-white font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 bg-[#0B1220] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {createdCount} {T(t.ommaviy.progressText)}{errorCount > 0 ? `, ${errorCount} ${T(t.ommaviy.errorText)}` : ''}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  disabled={creating}
                  className="text-gray-400 hover:text-white text-sm transition disabled:opacity-40"
                >
                  {T(t.ommaviy.back)}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {T(t.ommaviy.creating)}
                    </>
                  ) : (
                    `${selectedCps.length} ${T(t.ommaviy.createBtn)}`
                  )}
                </button>
              </div>
            </>
          )}

          {/* Tugatilgan holatda */}
          {done && (
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">{createdCount} {T(t.ommaviy.doneTitle)}</p>
                {errorCount > 0 && (
                  <p className="text-red-400 text-sm mt-1">{errorCount} {T(t.ommaviy.doneError)}</p>
                )}
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setStep(1); setBaseNumber(''); setSelectedCpIds(new Set())
                    setDone(false); setProgress(0); setCreatedCount(0); setErrorCount(0)
                  }}
                  className="bg-[#1F2937] hover:bg-[#374151] text-gray-300 px-5 py-2.5 rounded-lg text-sm transition"
                >
                  {T(t.ommaviy.newBatch)}
                </button>
                <button
                  onClick={() => router.push('/dashboard/shartnomalar')}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
                >
                  {T(t.ommaviy.toList)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
