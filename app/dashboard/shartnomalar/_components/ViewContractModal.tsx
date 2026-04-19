'use client'

import { useState } from 'react'
import { type Lang } from '@/lib/i18n'
import { useT } from '@/lib/useT'
import type { Contract } from '@/lib/types'
import { fillPlaceholders } from '@/lib/contractUtils'
import { numberToWords, formatDateUz } from '@/lib/contractStructures'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import { generateContractPDFBlob } from '@/lib/export/contractDocx'

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/20 text-green-400 border border-green-500/30',
  draft:     'bg-[#1F2937] text-gray-400 border border-[#1E293B]',
  completed: 'bg-blue-900/50 text-blue-300 border border-blue-700/30',
  cancelled: 'bg-red-900/50 text-red-300 border border-red-700/30',
}

const STATUSES: Record<string, Record<Lang, string>> = {
  all:       { uz: 'Barchasi',  oz: 'Барчаси',  ru: 'Все' },
  active:    { uz: 'Faol',      oz: 'Фаол',     ru: 'Активный' },
  draft:     { uz: 'Qoralama',  oz: 'Қоралама', ru: 'Черновик' },
  completed: { uz: 'Bajarildi', oz: 'Бажарилди',ru: 'Выполнен' },
  cancelled: { uz: 'Bekor',     oz: 'Бекор',    ru: 'Отменён' },
}

interface ViewContractModalProps {
  viewContract: Contract
  onClose: () => void
  onGenerateDOCX: (c: Contract) => Promise<void | Blob>
  onGeneratePDF: (c: Contract) => Promise<void>
  onSendByTelegram: (c: Contract) => Promise<void>
  onRunAiAnalysis: (c: Contract, type: 'tahlil' | 'grammatika') => void
  onToggleSigned: (c: Contract, side: 'signed_us' | 'signed_cp') => void
  isPremium: boolean
}

export default function ViewContractModal({
  viewContract, onClose,
  onGenerateDOCX, onGeneratePDF, onSendByTelegram, onRunAiAnalysis,
  onToggleSigned, isPremium,
}: ViewContractModalProps) {
  const T = useT()
  const [didoxStep, setDidoxStep] = useState<null | 'ready'>(null)
  const [apStatus, setApStatus] = useState<null | 'loading' | 'ok' | 'error'>(null)
  const [apMsg, setApMsg] = useState('')
  const [showPwdPanel, setShowPwdPanel] = useState(false)
  const [eimzoPwd, setEimzoPwd] = useState('')

  async function handleDidoxClick() {
    // Avval Autopilot bor-yo'qligini tekshir
    const health = await fetch('http://127.0.0.1:9876/health', { signal: AbortSignal.timeout(2000) }).catch(() => null)
    if (health?.ok) {
      // Autopilot ishlamoqda — parol panelini ko'rsat
      setShowPwdPanel(true)
    } else {
      // Manual yo'l
      await onGeneratePDF(viewContract)
      const cpInn = viewContract.counterparties?.inn || ''
      if (cpInn) { try { await navigator.clipboard.writeText(cpInn) } catch { /* */ } }
      window.open('https://didox.uz/document_form/000', '_blank', 'noopener')
      setDidoxStep('ready')
    }
  }

  async function runAutopilot() {
    setShowPwdPanel(false)
    setApStatus('loading')
    setApMsg('')
    try {
      const pdfBlob = await generateContractPDFBlob(viewContract)
      const reader = new FileReader()
      const pdf_base64: string = await new Promise((res, rej) => {
        reader.onload = () => res((reader.result as string).split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(pdfBlob)
      })
      const payload = {
        doc_number:       viewContract.contract_number || '',
        doc_date:         viewContract.contract_date   || '',
        contract_number:  viewContract.contract_number || '',
        contract_date:    viewContract.contract_date   || '',
        cp_inn:           viewContract.counterparties?.inn || '',
        eimzo_password:   eimzoPwd,
        pdf_base64,
      }
      const resp = await fetch('http://127.0.0.1:9876/fill-didox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              {(CONTRACT_TYPE_NAMES as Record<string, string>)[viewContract.contract_type] || viewContract.contract_type}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">No {viewContract.contract_number} · {formatDateUz(viewContract.contract_date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onGenerateDOCX(viewContract)} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-semibold">
              📝 Word
            </button>
            <button onClick={() => onGeneratePDF(viewContract)} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-500 transition font-semibold">
              📄 PDF
            </button>
            <button onClick={() => onSendByTelegram(viewContract)} className="px-3 py-1.5 text-xs bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </button>
            <button onClick={handleDidoxClick}
              disabled={apStatus === 'loading'}
              title="Autopilot ishlab tursa avtomatik to'ldiradi va imzolaydi"
              className="px-3 py-1.5 text-xs bg-violet-600/20 hover:bg-violet-600/40 border border-violet-600/30 text-violet-300 rounded-lg transition font-semibold flex items-center gap-1.5 disabled:opacity-50">
              {apStatus === 'loading'
                ? <span className="animate-spin inline-block w-3 h-3 border border-violet-400 border-t-transparent rounded-full"/>
                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
              }
              Didox
            </button>
            <button onClick={() => window.print()} className="px-3 py-1.5 text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 rounded-lg transition">
              🖨️ Print
            </button>
            {isPremium && (
              <button
                onClick={() => { onClose(); onRunAiAnalysis(viewContract, 'tahlil') }}
                className="px-3 py-1.5 text-xs bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition"
              >
                AI Tahlil
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition text-xl">
              ×
            </button>
          </div>
        </div>

        {/* E-imzo parol paneli */}
        {showPwdPanel && (
          <div className="px-6 py-4 bg-violet-950/40 border-b border-violet-700/30 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">🔐</span>
            <div className="flex-1">
              <p className="text-xs text-violet-200 font-semibold mb-2">E-imzo kaliti paroli</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={eimzoPwd}
                  onChange={e => setEimzoPwd(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && eimzoPwd && runAutopilot()}
                  placeholder="Kalit paroli..."
                  autoFocus
                  className="flex-1 bg-[#0F172A] border border-violet-700/50 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={runAutopilot}
                  disabled={!eimzoPwd}
                  className="px-4 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg font-semibold transition"
                >
                  Yuborish
                </button>
                <button onClick={() => setShowPwdPanel(false)} className="text-violet-500 hover:text-violet-300 text-lg leading-none px-1">×</button>
              </div>
            </div>
          </div>
        )}

        {/* Autopilot natija banneri */}
        {apStatus === 'loading' && (
          <div className="px-6 py-3 bg-violet-950/30 border-b border-violet-700/20 flex items-center gap-3">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full flex-shrink-0"/>
            <p className="text-xs text-violet-300">Didox forma to'ldirilmoqda — iltimos kuting...</p>
          </div>
        )}
        {(apStatus === 'ok' || apStatus === 'error') && (
          <div className={`px-6 py-3 border-b flex items-center gap-3 ${apStatus === 'ok' ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-red-900/20 border-red-700/30'}`}>
            <span className="text-base flex-shrink-0">{apStatus === 'ok' ? '✅' : '❌'}</span>
            <p className={`flex-1 text-xs ${apStatus === 'ok' ? 'text-emerald-300' : 'text-red-300'}`}>{apMsg}</p>
            <button onClick={() => setApStatus(null)} className="text-gray-500 hover:text-gray-300 text-lg leading-none flex-shrink-0">×</button>
          </div>
        )}

        {/* Didox instruction banner */}
        {didoxStep === 'ready' && (
          <div className="px-6 py-3 bg-violet-900/20 border-b border-violet-700/30 flex items-start gap-3">
            <span className="text-lg flex-shrink-0">✅</span>
            <div className="flex-1 text-xs text-violet-300 space-y-1">
              <p className="font-semibold text-violet-200">Didox oynasi ochildi — 3 qadam qoldi:</p>
              <p>1. Didox'da <strong>СТИР/ЖШШИР</strong> maydoniga yapishtirib qo'ying
                {viewContract.counterparties?.inn && (
                  <span className="ml-2 font-mono bg-violet-900/40 border border-violet-700/40 px-1.5 py-0.5 rounded text-violet-200">
                    {viewContract.counterparties.inn}
                  </span>
                )}
                {' '}— Enter bosing, Didox qolganini to'ldiradi</p>
              <p>2. <strong>Файлни шу ерга кўчиринг</strong> maydoniga yuklab olingan PDF'ni birikting</p>
              <p>3. E-imzo bilan imzolang</p>
            </div>
            <button onClick={() => setDidoxStep(null)} className="text-violet-500 hover:text-violet-300 text-lg leading-none flex-shrink-0">×</button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Info cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0F172A] rounded-xl p-3 border border-[#1E293B]">
              <p className="text-xs text-gray-500 mb-1">Tashkilot</p>
              <p className="text-sm text-white font-medium">{viewContract.organizations?.name || '—'}</p>
              <p className="text-xs text-gray-500">STIR: {viewContract.organizations?.inn || '—'}</p>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3 border border-[#1E293B]">
              <p className="text-xs text-gray-500 mb-1">Kontragent</p>
              <p className="text-sm text-white font-medium">{viewContract.counterparties?.name || '—'}</p>
              <p className="text-xs text-gray-500">STIR: {viewContract.counterparties?.inn || '—'}</p>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3 border border-[#1E293B]">
              <p className="text-xs text-gray-500 mb-1">Summa</p>
              <p className="text-sm text-white font-semibold">{Number(viewContract.amount || 0).toLocaleString()} so'm</p>
              <p className="text-xs text-gray-500">{numberToWords(Number(viewContract.amount || 0), 'uz')} so'm</p>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3 border border-[#1E293B]">
              <p className="text-xs text-gray-500 mb-1">Holat</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewContract.status] || 'bg-gray-700 text-gray-300'}`}>
                {STATUSES[viewContract.status] ? T(STATUSES[viewContract.status]) : viewContract.status}
              </span>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-3 border border-[#1E293B] col-span-2">
              <p className="text-xs text-gray-500 mb-2">Imzolash holati</p>
              <div className="flex gap-3">
                <button onClick={() => onToggleSigned(viewContract, 'signed_us')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewContract.signed_us ? 'bg-emerald-700 text-white' : 'bg-[#1F2937] text-gray-400 hover:bg-[#111827] border border-[#1E293B]'}`}>
                  {viewContract.signed_us ? '✅' : '⬜'} Biz imzoladik
                </button>
                <button onClick={() => onToggleSigned(viewContract, 'signed_cp')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewContract.signed_cp ? 'bg-emerald-700 text-white' : 'bg-[#1F2937] text-gray-400 hover:bg-[#111827] border border-[#1E293B]'}`}>
                  {viewContract.signed_cp ? '✅' : '⬜'} Kontragent imzoladi
                </button>
              </div>
            </div>
          </div>

          {/* Contract text */}
          {viewContract.content && (() => {
            const filled = fillPlaceholders(viewContract.content, viewContract).replace(/\*\*([^*]+)\*\*/g, '$1')
            const rekvizitIdx = filled.search(/\n[ \t]*(\d+\.\s*)?(TOMONLARNING\s+(REKVIZITLARI|MA['']LUMOTLARI|IMZOLARI)|TOMONLAR\s+(IMZOSI|REKVIZIT))/i)
            const displayText = rekvizitIdx !== -1 ? filled.slice(0, rekvizitIdx) : filled
            return (
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {displayText}
                </pre>
              </div>
            )
          })()}

          {/* Spec items */}
          {viewContract.spec_items && viewContract.spec_items.length > 0 && (
            <div className="mt-6">
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
                    {viewContract.spec_items.map((item, i) => (
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
                        {viewContract.spec_items.reduce((s, i) => s + (i.summa || 0), 0).toLocaleString()} so'm
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
