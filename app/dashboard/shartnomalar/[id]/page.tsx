'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useDashboard } from '../../context'
import { useT } from '@/lib/useT'
import type { Contract } from '@/lib/types'
import { fillPlaceholders } from '@/lib/contractUtils'
import { numberToWords, formatDateUz } from '@/lib/contractStructures'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import { generateContractDOCX, generateContractPDF, generateContractPDFBlob } from '@/lib/export/contractDocx'
import { toggleContractSigned, shareByTelegram } from '../services/contractService'
import { type Lang } from '@/lib/i18n'

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/20 text-green-400 border border-green-500/30',
  draft:     'bg-[#1F2937] text-gray-400 border border-[#1E293B]',
  completed: 'bg-blue-900/50 text-blue-300 border border-blue-700/30',
  cancelled: 'bg-red-900/50 text-red-300 border border-red-700/30',
}

const STATUSES: Record<string, Record<Lang, string>> = {
  active:    { uz: 'Faol',      oz: 'Фаол',     ru: 'Активный' },
  draft:     { uz: 'Qoralama',  oz: 'Қоралама', ru: 'Черновик' },
  completed: { uz: 'Bajarildi', oz: 'Бажарилди',ru: 'Выполнен' },
  cancelled: { uz: 'Bekor',     oz: 'Бекор',    ru: 'Отменён' },
}

export default function ContractViewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const T = useT()
  const { hasAiAccess, activeOrg } = useDashboard()

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)

  const [didoxStep, setDidoxStep] = useState<null | 'ready'>(null)
  const [apStatus, setApStatus] = useState<null | 'loading' | 'ok' | 'error'>(null)
  const [apMsg, setApMsg] = useState('')
  const [showPwdPanel, setShowPwdPanel] = useState(false)
  const [eimzoPwd, setEimzoPwd] = useState('')

  useEffect(() => {
    if (!id) return
    supabase
      .from('contracts')
      .select('*, organizations(*), counterparties(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setContract(data as unknown as Contract)
        setLoading(false)
      })
  }, [id])

  async function handleToggleSigned(side: 'signed_us' | 'signed_cp') {
    if (!contract || !activeOrg) return
    await toggleContractSigned(contract, side, activeOrg.id)
    setContract(prev => prev ? { ...prev, [side]: !prev[side] } : prev)
  }

  async function handleDidoxClick() {
    if (!contract) return
    const health = await fetch('http://127.0.0.1:9876/health', { signal: AbortSignal.timeout(2000) }).catch(() => null)
    if (health?.ok) {
      setShowPwdPanel(true)
    } else {
      setApStatus(null); setApMsg('')
      await generateContractPDF(contract)
      const cpInn = contract.counterparties?.inn || ''
      if (cpInn) { try { await navigator.clipboard.writeText(cpInn) } catch { /* */ } }
      window.open('https://didox.uz/document_form/000', '_blank', 'noopener')
      setDidoxStep('ready')
    }
  }

  async function runAutopilot() {
    if (!contract) return
    setShowPwdPanel(false); setApStatus('loading'); setApMsg('')
    try {
      const pdfBlob = await generateContractPDFBlob(contract)
      const reader = new FileReader()
      const pdf_base64: string = await new Promise((res, rej) => {
        reader.onload = () => res((reader.result as string).split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(pdfBlob)
      })
      const resp = await fetch('http://127.0.0.1:9876/fill-didox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_number: contract.contract_number || '', doc_date: contract.contract_date || '',
          contract_number: contract.contract_number || '', contract_date: contract.contract_date || '',
          cp_inn: contract.counterparties?.inn || '', eimzo_password: eimzoPwd, pdf_base64,
        }),
      })
      const data = await resp.json()
      setApStatus(data.status === 'ok' ? 'ok' : 'error')
      setApMsg(data.message || '')
    } catch (e: unknown) {
      setApStatus('error')
      setApMsg(e instanceof Error ? e.message : 'Xatolik')
    }
    setEimzoPwd('')
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#0B1220]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  if (!contract) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-[#0B1220] gap-4">
        <div className="text-gray-400 text-sm">Shartnoma topilmadi</div>
        <button onClick={() => router.push('/dashboard/shartnomalar')}
          className="text-xs text-blue-400 hover:text-blue-300 underline">
          ← Shartnomalar ro'yxatiga qaytish
        </button>
      </main>
    )
  }

  const statusLabel = STATUSES[contract.status]
  const filledContent = contract.content
    ? fillPlaceholders(contract.content, contract).replace(/\*\*([^*]+)\*\*/g, '$1')
    : ''
  const rekvizitIdx = filledContent.search(/\n[ \t]*(\d+\.\s*)?(TOMONLARNING\s+(REKVIZITLARI|MA['']LUMOTLARI|IMZOLARI)|TOMONLAR\s+(IMZOSI|REKVIZIT))/i)
  const displayText = rekvizitIdx !== -1 ? filledContent.slice(0, rekvizitIdx) : filledContent

  return (
    <main className="flex-1 overflow-auto bg-[#0B1220]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/dashboard/shartnomalar')}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition flex-shrink-0">
              ←
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-white truncate">
                {(CONTRACT_TYPE_NAMES as Record<string, string>)[contract.contract_type] || contract.contract_type}
              </h1>
              <p className="text-xs text-gray-500">No {contract.contract_number} · {formatDateUz(contract.contract_date)}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => generateContractDOCX(contract)}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-semibold">
              📝 Word
            </button>
            <button onClick={() => generateContractPDF(contract)}
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-500 transition font-semibold">
              📄 PDF
            </button>
            <button onClick={() => shareByTelegram(contract)}
              className="px-3 py-1.5 text-xs bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Telegram
            </button>
            <button onClick={handleDidoxClick} disabled={apStatus === 'loading'}
              className="px-3 py-1.5 text-xs bg-violet-600/20 hover:bg-violet-600/40 border border-violet-600/30 text-violet-300 rounded-lg transition font-semibold flex items-center gap-1.5 disabled:opacity-50">
              {apStatus === 'loading'
                ? <span className="animate-spin inline-block w-3 h-3 border border-violet-400 border-t-transparent rounded-full"/>
                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
              }
              Didox
            </button>
            <button onClick={() => window.print()}
              className="px-3 py-1.5 text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 rounded-lg transition">
              🖨️ Print
            </button>
            {hasAiAccess() && (
              <button onClick={() => router.push(`/dashboard/yurist?f=tahlil&cid=${contract.id}`)}
                className="px-3 py-1.5 text-xs bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition">
                🤖 AI Tahlil
              </button>
            )}
            <button onClick={() => router.push(`/dashboard/shartnomalar/${contract.id}/edit`)}
              className="px-3 py-1.5 text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 rounded-lg transition">
              ✎ Tahrirlash
            </button>
          </div>
        </div>

        {/* E-imzo parol paneli */}
        {showPwdPanel && (
          <div className="bg-violet-950/40 border border-violet-700/30 rounded-xl px-4 py-4 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">🔐</span>
            <div className="flex-1">
              <p className="text-xs text-violet-200 font-semibold mb-2">E-imzo kaliti paroli</p>
              <div className="flex gap-2">
                <input type="password" value={eimzoPwd} onChange={e => setEimzoPwd(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && eimzoPwd && apStatus !== 'loading' && runAutopilot()}
                  placeholder="Kalit paroli..." autoFocus
                  className="flex-1 bg-[#0F172A] border border-violet-700/50 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500"/>
                <button onClick={runAutopilot} disabled={!eimzoPwd}
                  className="px-4 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg font-semibold transition">
                  Yuborish
                </button>
                <button onClick={() => setShowPwdPanel(false)} className="text-violet-500 hover:text-violet-300 text-lg px-1">×</button>
              </div>
            </div>
          </div>
        )}

        {/* Autopilot banner */}
        {apStatus === 'loading' && (
          <div className="bg-violet-950/30 border border-violet-700/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full flex-shrink-0"/>
            <p className="text-xs text-violet-300">Didox forma to'ldirilmoqda — iltimos kuting...</p>
          </div>
        )}
        {(apStatus === 'ok' || apStatus === 'error') && (
          <div className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${apStatus === 'ok' ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-red-900/20 border-red-700/30'}`}>
            <span className="text-base flex-shrink-0">{apStatus === 'ok' ? '✅' : '❌'}</span>
            <p className={`flex-1 text-xs ${apStatus === 'ok' ? 'text-emerald-300' : 'text-red-300'}`}>{apMsg}</p>
            <button onClick={() => setApStatus(null)} className="text-gray-500 hover:text-gray-300 text-lg px-1">×</button>
          </div>
        )}
        {didoxStep === 'ready' && (
          <div className="bg-violet-900/20 border border-violet-700/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">✅</span>
            <div className="flex-1 text-xs text-violet-300 space-y-1">
              <p className="font-semibold text-violet-200">Didox oynasi ochildi — 3 qadam qoldi:</p>
              <p>1. <strong>СТИР/ЖШШИР</strong> maydoniga yapishtirib qo'ying
                {contract.counterparties?.inn && (
                  <span className="ml-2 font-mono bg-violet-900/40 border border-violet-700/40 px-1.5 py-0.5 rounded text-violet-200">
                    {contract.counterparties.inn}
                  </span>
                )}
                {' '}— Enter bosing</p>
              <p>2. <strong>Файлни шу ерга кўчиринг</strong> maydoniga PDF ni birikting</p>
              <p>3. E-imzo bilan imzolang</p>
            </div>
            <button onClick={() => setDidoxStep(null)} className="text-violet-500 hover:text-violet-300 text-lg px-1">×</button>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Tashkilot</p>
            <p className="text-sm text-white font-medium">{contract.organizations?.name || '—'}</p>
            <p className="text-xs text-gray-500">STIR: {contract.organizations?.inn || '—'}</p>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Kontragent</p>
            <p className="text-sm text-white font-medium">{contract.counterparties?.name || '—'}</p>
            <p className="text-xs text-gray-500">STIR: {contract.counterparties?.inn || '—'}</p>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Summa</p>
            <p className="text-sm text-white font-semibold">{Number(contract.amount || 0).toLocaleString()} so'm</p>
            <p className="text-xs text-gray-500">{numberToWords(Number(contract.amount || 0), 'uz')} so'm</p>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Holat</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[contract.status] || 'bg-gray-700 text-gray-300'}`}>
              {statusLabel ? T(statusLabel) : contract.status}
            </span>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-3 col-span-2">
            <p className="text-xs text-gray-500 mb-2">Imzolash holati</p>
            <div className="flex gap-3">
              <button onClick={() => handleToggleSigned('signed_us')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${contract.signed_us ? 'bg-emerald-700 text-white' : 'bg-[#1F2937] text-gray-400 hover:bg-[#111827] border border-[#1E293B]'}`}>
                {contract.signed_us ? '✅' : '⬜'} Biz imzoladik
              </button>
              <button onClick={() => handleToggleSigned('signed_cp')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${contract.signed_cp ? 'bg-emerald-700 text-white' : 'bg-[#1F2937] text-gray-400 hover:bg-[#111827] border border-[#1E293B]'}`}>
                {contract.signed_cp ? '✅' : '⬜'} Kontragent imzoladi
              </button>
            </div>
          </div>
        </div>

        {/* Contract text */}
        {displayText && (
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
              {displayText}
            </pre>
          </div>
        )}

        {/* Spec items */}
        {contract.spec_items && contract.spec_items.length > 0 && (
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Spesifikatsiya</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-[#1E293B]">
                    <th className="text-left pb-2 pr-2">Nomi</th>
                    <th className="text-left pb-2 pr-2">Birlik</th>
                    <th className="text-right pb-2 pr-2">Miqdor</th>
                    <th className="text-right pb-2 pr-2">Narxi</th>
                    <th className="text-center pb-2 pr-2">QQS%</th>
                    <th className="text-right pb-2">Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {contract.spec_items.map((item, i) => (
                    <tr key={i} className="border-b border-[#1E293B]/50 hover:bg-[#1F2937]">
                      <td className="py-1.5 pr-2 text-gray-200">{item.nomi}</td>
                      <td className="py-1.5 pr-2 text-gray-400">{item.birlik}</td>
                      <td className="py-1.5 pr-2 text-right text-gray-300">{item.miqdori}</td>
                      <td className="py-1.5 pr-2 text-right text-gray-300">{item.narxi?.toLocaleString()}</td>
                      <td className="py-1.5 pr-2 text-center text-gray-400">{item.qqs_foiz === 'siz' ? 'QQSsiz' : item.qqs_foiz + '%'}</td>
                      <td className="py-1.5 text-right font-medium text-white">{item.summa?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="pt-2 text-right text-gray-400 font-medium text-xs pr-2">Jami:</td>
                    <td className="pt-2 text-right text-white font-bold text-sm">
                      {contract.spec_items.reduce((s, i) => s + (i.summa || 0), 0).toLocaleString()} so'm
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
