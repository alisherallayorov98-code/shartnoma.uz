'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useDashboard } from '../context'
import type { Counterparty, Contract } from '@/lib/types'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import {
  getStructure, structureToText, numberToWords,
} from '@/lib/contractStructures'
import { generateContractDOCX } from '@/lib/export/contractDocx'
import { generateContractPDF } from '@/lib/export/contractPdf'
import { shareByTelegram } from '../shartnomalar/services/contractService'
import { logAudit } from '@/lib/audit'
import { useToast } from '@/lib/toast'

// ─── Contract type config ────────────────────────────────────────────────────

const CONTRACT_TYPES = [
  { key: 'oldi_sotdi', label: "Oldi-sotdi",        icon: '🛒', color: '#3B82F6' },
  { key: 'xizmat',     label: "Xizmat",             icon: '🔧', color: '#10B981' },
  { key: 'ijara',      label: "Ijara",              icon: '🏠', color: '#F59E0B' },
  { key: 'pudrat',     label: "Pudrat",             icon: '🏗️', color: '#F97316' },
  { key: 'moliyaviy',  label: "Moliyaviy",          icon: '💰', color: '#8B5CF6' },
  { key: 'daval',      label: "Daval",              icon: '⚙️', color: '#06B6D4' },
  { key: 'xalqaro',    label: "Xalqaro",            icon: '🌐', color: '#6366F1' },
  { key: 'agentlik',   label: "Agentlik",           icon: '🤝', color: '#EC4899' },
  { key: 'transport',  label: "Transport",          icon: '🚛', color: '#14B8A6' },
  { key: 'lizing',     label: "Lizing",             icon: '📦', color: '#64748B' },
  { key: 'qoshimcha',  label: "Qo'shimcha",         icon: '➕', color: '#6B7280' },
  { key: 'boshqa',     label: "Boshqa",             icon: '📋', color: '#4B5563' },
]

function autoNum(): string {
  return `${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`
}

function orgCityDefault(org: { viloyat?: string; tuman?: string } | null | undefined): string {
  if (!org) return 'Toshkent shahri'
  if (org.tuman?.trim()) return org.tuman.trim()
  const MAP: Record<string, string> = {
    'Toshkent shahri': 'Toshkent shahri', 'Toshkent viloyati': 'Toshkent shahri',
    'Samarqand': 'Samarqand shahri', 'Buxoro': 'Buxoro shahri',
    "Farg'ona": "Farg'ona shahri", 'Andijon': 'Andijon shahri',
    'Namangan': 'Namangan shahri', 'Qashqadaryo': 'Qarshi shahri',
  }
  return MAP[org.viloyat?.trim() || ''] || 'Toshkent shahri'
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MobilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    orgs, cps, activeOrg, subscription, userId,
    canCreateContract, openUpgradeModal, reloadContracts,
  } = useDashboard()

  // ── Form state ────────────────────────────────────────────────────────────
  const [cpQuery, setCpQuery]               = useState('')
  const [selectedCp, setSelectedCp]         = useState<Counterparty | null>(null)
  const [cpOpen, setCpOpen]                 = useState(false)
  const [cpStirLoading, setCpStirLoading]   = useState(false)
  const [contractType, setContractType]     = useState('oldi_sotdi')
  const [amount, setAmount]                 = useState('')
  const [contractNumber, setContractNumber] = useState(() => autoNum())
  const [contractDate, setContractDate]     = useState(() => new Date().toISOString().split('T')[0])

  // ── Result state ──────────────────────────────────────────────────────────
  const [step, setStep]             = useState<'form' | 'done'>('form')
  const [saving, setSaving]         = useState(false)
  const [savedContract, setSavedContract] = useState<Contract | null>(null)
  const [tgLoading, setTgLoading]   = useState(false)
  const [docxLoading, setDocxLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const cpRef = useRef<HTMLDivElement>(null)

  // close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cpRef.current && !cpRef.current.contains(e.target as Node)) setCpOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Filtered counterparties ───────────────────────────────────────────────
  const filteredCps = cps.filter(cp => {
    if (!cpQuery.trim()) return true
    const q = cpQuery.toLowerCase()
    return cp.name.toLowerCase().includes(q) || cp.inn?.includes(q)
  })

  // ── STIR auto-lookup ─────────────────────────────────────────────────────
  async function handleStirLookup(val: string) {
    const digits = val.replace(/\D/g, '')
    if (digits.length !== 9) return
    const existing = cps.find(c => (c.inn || '').replace(/\D/g, '') === digits)
    if (existing) { setSelectedCp(existing); setCpOpen(false); setCpQuery(existing.name); return }
    setCpStirLoading(true)
    try {
      const res = await fetch(`/api/company-lookup?inn=${digits}`)
      const apiData = await res.json()
      if (!res.ok) { toast(apiData.error || "STIR bo'yicha ma'lumot topilmadi", 'error'); return }
      const co = apiData.company
      const { data: { session } } = await supabase.auth.getSession()
      const { data: saved, error: saveErr } = await supabase.from('counterparties').insert({
        name: co.name, inn: digits,
        director_name: co.director || '', address: co.address || '',
        phone: co.phone || '', bank_name: co.bank_name || '',
        bank_account: co.account || '', mfo: co.mfo || '',
        user_id: session!.user.id,
      }).select().single()
      if (saveErr) {
        if (saveErr.code === '23505') {
          const { data: found } = await supabase.from('counterparties').select('*').eq('inn', digits).maybeSingle()
          if (found) { setSelectedCp(found as Counterparty); setCpOpen(false); setCpQuery((found as Counterparty).name); toast(`Bazadan topildi: ${(found as Counterparty).name}`, 'success'); return }
        }
        toast('Saqlashda xato: ' + saveErr.message, 'error'); return
      }
      setSelectedCp(saved as Counterparty)
      setCpOpen(false)
      setCpQuery((saved as Counterparty).name)
      toast(`${apiData.source === 'global_db' ? 'Bazadan topildi' : 'Soliq API dan olindi'}: ${co.name}`, 'success')
    } catch { toast("So'rovda xatolik", 'error') }
    finally { setCpStirLoading(false) }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!activeOrg) { toast("Tashkilot tanlanmagan", 'error'); return }
    if (!selectedCp) { toast("Kontragentni tanlang", 'error'); return }
    if (!contractNumber.trim()) { toast("Shartnoma raqami kiritilishi shart", 'error'); return }

    if (!canCreateContract()) { openUpgradeModal(); return }

    setSaving(true)
    try {
      const org = activeOrg
      const cp = selectedCp
      const numAmount = parseFloat(amount.replace(/\s/g, '')) || 0
      const city = orgCityDefault(org)

      const structure = getStructure(contractType, {
        contract_number: contractNumber,
        contract_date: contractDate,
        city,
        org_name: org.name || '',
        org_inn: org.inn || '',
        org_director: org.director_name || '',
        cp_name: cp.name || '',
        cp_inn: cp.inn || '',
        cp_director: cp.director_name || '',
        amount: numAmount,
        amount_text: numAmount > 0 ? numberToWords(numAmount, 'uz') + " so'm" : '___',
        extra: {},
      })

      const content = structureToText(structure, {
        type_name: (CONTRACT_TYPE_NAMES as Record<string, string>)[contractType] || contractType,
        number: contractNumber,
        date: contractDate,
        city,
        org,
        cp,
        contract_type: contractType,
      })

      const payload = {
        contract_number: contractNumber,
        contract_date: contractDate,
        contract_type: contractType,
        amount: numAmount,
        organization_id: org.id,
        counterparty_id: cp.id,
        status: 'active',
        content,
        city,
        product_name: '',
        spec_items: [],
        qqs_enabled: false,
        qqs_rate: 12,
        extra_data: {},
        user_id: userId,
      }

      const { data: inserted, error } = await supabase
        .from('contracts').insert(payload).select(`
          id, contract_number, contract_date, contract_type,
          amount, status, organization_id, counterparty_id,
          content, city, created_at,
          organizations:organization_id (id, name, inn, director_name, address, viloyat, tuman),
          counterparties:counterparty_id (id, name, inn, director_name, address)
        `).single()

      if (error) { toast(`Xato: ${error.message}`, 'error'); return }

      logAudit('create', 'contracts', inserted.id, {
        contract_number: payload.contract_number,
        contract_type: payload.contract_type,
      })
      if (subscription) {
        await supabase.from('subscriptions')
          .update({ contracts_used: (subscription.contracts_used || 0) + 1 })
          .eq('id', subscription.id)
      }
      await reloadContracts()
      setSavedContract(inserted as unknown as Contract)
      setStep('done')
    } finally {
      setSaving(false)
    }
  }

  // ── Download DOCX ─────────────────────────────────────────────────────────
  async function handleDocx() {
    if (!savedContract) return
    setDocxLoading(true)
    try {
      await generateContractDOCX(savedContract)
    } catch { toast("Word faylda xato", 'error') }
    finally { setDocxLoading(false) }
  }

  // ── Download PDF ──────────────────────────────────────────────────────────
  async function handlePdf() {
    if (!savedContract) return
    setPdfLoading(true)
    try {
      await generateContractPDF(savedContract)
    } catch { toast("PDF faylda xato", 'error') }
    finally { setPdfLoading(false) }
  }

  // ── Telegram ──────────────────────────────────────────────────────────────
  async function handleTelegram() {
    if (!savedContract) return
    setTgLoading(true)
    try {
      const res = await shareByTelegram(savedContract)
      if (res === 'error') toast("Telegram yuborishda xato", 'error')
    } finally {
      setTgLoading(false)
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function handleNew() {
    setStep('form')
    setSelectedCp(null)
    setCpQuery('')
    setContractType('oldi_sotdi')
    setAmount('')
    setContractNumber(autoNum())
    setContractDate(new Date().toISOString().split('T')[0])
    setSavedContract(null)
  }

  const selectedTypeMeta = CONTRACT_TYPES.find(t => t.key === contractType)

  // ── DONE screen ───────────────────────────────────────────────────────────
  if (step === 'done' && savedContract) {
    const typeName = (CONTRACT_TYPE_NAMES as Record<string, string>)[savedContract.contract_type] || savedContract.contract_type
    return (
      <div className="min-h-screen bg-[#0B1220] flex flex-col px-4 py-6 max-w-lg mx-auto">
        {/* Success */}
        <div className="flex flex-col items-center text-center pt-8 pb-6">
          <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Shartnoma yaratildi!</h1>
          <p className="text-gray-400 text-sm">{typeName}</p>
          <div className="mt-3 px-4 py-2 bg-[#1E293B] rounded-xl">
            <span className="text-blue-400 font-mono font-semibold">№ {savedContract.contract_number}</span>
            <span className="text-gray-500 text-xs ml-2">{savedContract.contract_date}</span>
          </div>
          <div className="mt-2 text-sm text-gray-300">
            <span className="text-gray-500">Kontragent: </span>
            {savedContract.counterparties?.name || selectedCp?.name}
          </div>
          {savedContract.amount > 0 && (
            <div className="mt-1 text-sm text-green-400 font-semibold">
              {savedContract.amount.toLocaleString()} so'm
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={handleDocx}
            disabled={docxLoading}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base transition disabled:opacity-60"
          >
            {docxLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            ) : <span className="text-xl">📄</span>}
            Word yuklab olish
          </button>

          <button
            onClick={handlePdf}
            disabled={pdfLoading}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[#1E293B] hover:bg-[#253448] active:bg-[#2d3f55] text-white font-semibold text-base transition disabled:opacity-60 border border-[#2d4060]"
          >
            {pdfLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            ) : <span className="text-xl">📋</span>}
            PDF yuklab olish
          </button>

          <button
            onClick={handleTelegram}
            disabled={tgLoading}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[#2CA5E0]/15 hover:bg-[#2CA5E0]/25 active:bg-[#2CA5E0]/35 text-[#2CA5E0] font-semibold text-base transition disabled:opacity-60 border border-[#2CA5E0]/30"
          >
            {tgLoading ? (
              <span className="w-5 h-5 border-2 border-[#2CA5E0]/30 border-t-[#2CA5E0] rounded-full animate-spin"/>
            ) : <span className="text-xl">✈️</span>}
            Telegramga yuborish
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-2 mt-6 border-t border-[#1E293B] pt-5">
          <button
            onClick={handleNew}
            className="w-full py-3.5 rounded-2xl bg-[#111827] border border-[#1E293B] text-gray-300 font-medium text-sm hover:border-blue-600 hover:text-white transition"
          >
            ➕ Yangi shartnoma
          </button>
          <button
            onClick={() => router.push('/dashboard/shartnomalar')}
            className="w-full py-3.5 rounded-2xl text-gray-500 text-sm hover:text-gray-300 transition"
          >
            Shartnomalar ro'yxatiga o'tish →
          </button>
        </div>
      </div>
    )
  }

  // ── FORM screen ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0B1220]/95 backdrop-blur border-b border-[#1E293B] px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/shartnomalar')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1E293B] text-gray-400 hover:text-white transition"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-base leading-tight">Tez shartnoma</h1>
          <p className="text-gray-400 text-xs truncate">{activeOrg?.name || 'Tashkilot tanlanmagan'}</p>
          {activeOrg?.bank_name && (
            <p className="text-gray-600 text-[10px] truncate">{activeOrg.bank_name} · MFO: {activeOrg.mfo}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">

        {/* Kontragent */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            Kontragent
          </label>
          <div ref={cpRef} className="relative">
            {selectedCp ? (
              <div
                className="px-4 py-3.5 bg-[#111827] border border-blue-600 rounded-2xl cursor-pointer"
                onClick={() => { setSelectedCp(null); setCpQuery(''); setCpOpen(true) }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-white font-medium text-sm">{selectedCp.name}</div>
                  <span className="text-gray-500 text-xs ml-2 flex-shrink-0">✕</span>
                </div>
                {selectedCp.inn && <div className="text-gray-500 text-xs mt-0.5">INN: {selectedCp.inn}</div>}
                {selectedCp.director_name && <div className="text-gray-500 text-xs">Rahbar: {selectedCp.director_name}</div>}
                {selectedCp.bank_name && (
                  <div className="text-gray-600 text-xs mt-1.5 border-t border-[#1E293B] pt-1.5 space-y-0.5">
                    <div>{selectedCp.bank_name}{selectedCp.mfo ? ` · MFO: ${selectedCp.mfo}` : ''}</div>
                    {selectedCp.bank_account && <div>H/r: {selectedCp.bank_account}</div>}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-base">🔍</span>
                  <input
                    autoFocus={false}
                    type="text"
                    placeholder="Kontragent qidirish..."
                    value={cpQuery}
                    onChange={e => {
                      const val = e.target.value
                      setCpQuery(val)
                      setCpOpen(true)
                      if (val.replace(/\D/g, '').length === 9) handleStirLookup(val)
                    }}
                    onFocus={() => setCpOpen(true)}
                    placeholder="STIR (9 raqam) yoki tashkilot nomi..."
                    className={`w-full pl-10 pr-4 py-3.5 bg-[#111827] border border-[#1E293B] rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-600 ${cpStirLoading ? 'opacity-60' : ''}`}
                  />
                  {cpStirLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    </div>
                  )}
                </div>
                {cpOpen && !cpStirLoading && (
                  <div className="absolute z-30 mt-1 w-full bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
                    {filteredCps.length === 0 ? (
                      <div className="px-4 py-3 text-gray-500 text-sm">Topilmadi</div>
                    ) : filteredCps.map(cp => (
                      <button
                        key={cp.id}
                        onClick={() => { setSelectedCp(cp); setCpOpen(false); setCpQuery('') }}
                        className="w-full text-left px-4 py-3 hover:bg-[#1E293B] active:bg-[#253448] transition border-b border-[#1E293B]/50 last:border-0"
                      >
                        <div className="text-white text-sm font-medium">{cp.name}</div>
                        {cp.inn && <div className="text-gray-500 text-xs">{cp.inn}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Shartnoma turi */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            Shartnoma turi
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CONTRACT_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setContractType(t.key)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition text-center ${
                  contractType === t.key
                    ? 'border-transparent text-white'
                    : 'border-[#1E293B] bg-[#111827] text-gray-400 hover:border-gray-600'
                }`}
                style={contractType === t.key ? { backgroundColor: t.color + '22', borderColor: t.color + '88' } : {}}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span className="text-xs font-medium leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Summa */}
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
            Summa (so'm)
          </label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full px-4 py-3.5 bg-[#111827] border border-[#1E293B] rounded-2xl text-white text-base focus:outline-none focus:border-blue-600 placeholder-gray-600"
          />
          {amount && parseFloat(amount) > 0 && (
            <div className="mt-1 text-xs text-gray-500 px-1">
              {parseFloat(amount).toLocaleString()} so'm
            </div>
          )}
        </div>

        {/* Raqam va sana */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
              Raqam
            </label>
            <input
              type="text"
              value={contractNumber}
              onChange={e => setContractNumber(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#111827] border border-[#1E293B] rounded-2xl text-white text-sm focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 block">
              Sana
            </label>
            <input
              type="date"
              value={contractDate}
              onChange={e => setContractDate(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#111827] border border-[#1E293B] rounded-2xl text-white text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Selected summary */}
        {selectedCp && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#1E293B] bg-[#0F172A]"
            style={{ borderLeftColor: selectedTypeMeta?.color, borderLeftWidth: 3 }}
          >
            <span className="text-lg">{selectedTypeMeta?.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{selectedCp.name}</div>
              <div className="text-gray-500 text-xs">{selectedTypeMeta?.label}</div>
            </div>
            {parseFloat(amount) > 0 && (
              <div className="text-green-400 text-sm font-semibold whitespace-nowrap">
                {parseFloat(amount).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create button — fixed bottom */}
      <div className="sticky bottom-0 bg-[#0B1220]/95 backdrop-blur border-t border-[#1E293B] p-4">
        <button
          onClick={handleCreate}
          disabled={saving || !selectedCp || !activeOrg}
          className="w-full py-4 rounded-2xl font-bold text-base text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            background: saving || !selectedCp || !activeOrg
              ? '#1E293B'
              : `linear-gradient(135deg, ${selectedTypeMeta?.color || '#2563EB'}, #1D4ED8)`,
          }}
        >
          {saving ? (
            <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Saqlanmoqda...</>
          ) : (
            <>✅ Shartnoma yaratish</>
          )}
        </button>
      </div>
    </div>
  )
}
