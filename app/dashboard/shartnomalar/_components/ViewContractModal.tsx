'use client'

import { tr, type Lang } from '@/lib/i18n'
import type { Contract } from '@/lib/types'
import { fillPlaceholders } from '@/lib/contractUtils'
import { numberToWords } from '@/lib/contractStructures'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-900/50 text-green-300',
  draft:     'bg-gray-700 text-gray-300',
  completed: 'bg-blue-900/50 text-blue-300',
  cancelled: 'bg-red-900/50 text-red-300',
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
  onGenerateDOCX: (c: Contract) => Promise<void>
  onGeneratePDF: (c: Contract) => Promise<void>
  onSendByEmail: (c: Contract) => void
  onRunAiAnalysis: (c: Contract, type: 'tahlil' | 'grammatika') => void
  onToggleSigned: (c: Contract, side: 'signed_us' | 'signed_cp') => void
  isPremium: boolean
  lang: Lang
}

export default function ViewContractModal({
  viewContract, onClose,
  onGenerateDOCX, onGeneratePDF, onSendByEmail, onRunAiAnalysis,
  onToggleSigned, isPremium, lang,
}: ViewContractModalProps) {
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              {(CONTRACT_TYPE_NAMES as Record<string, string>)[viewContract.contract_type] || viewContract.contract_type}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">No {viewContract.contract_number} · {viewContract.contract_date}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onGenerateDOCX(viewContract)} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-semibold">
              📝 Word
            </button>
            <button onClick={() => onGeneratePDF(viewContract)} className="px-3 py-1.5 text-xs bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition">
              📄 PDF
            </button>
            <button onClick={() => onSendByEmail(viewContract)} className="px-3 py-1.5 text-xs bg-yellow-700/30 text-yellow-400 rounded-lg hover:bg-yellow-700/50 transition">
              ✉️ Email
            </button>
            <button onClick={() => window.print()} className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition">
              🖨️ Print
            </button>
            {isPremium && (
              <button
                onClick={() => { onClose(); onRunAiAnalysis(viewContract, 'tahlil') }}
                className="px-3 py-1.5 text-xs bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition"
              >
                AI Tahlil
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-xl">
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Info cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Tashkilot</p>
              <p className="text-sm text-white font-medium">{viewContract.organizations?.name || '—'}</p>
              <p className="text-xs text-gray-500">INN: {viewContract.organizations?.inn || '—'}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Kontragent</p>
              <p className="text-sm text-white font-medium">{viewContract.counterparties?.name || '—'}</p>
              <p className="text-xs text-gray-500">INN: {viewContract.counterparties?.inn || '—'}</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Summa</p>
              <p className="text-sm text-white font-semibold">{Number(viewContract.amount || 0).toLocaleString()} so'm</p>
              <p className="text-xs text-gray-500">{numberToWords(Number(viewContract.amount || 0), 'uz')} so'm</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Holat</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[viewContract.status] || 'bg-gray-700 text-gray-300'}`}>
                {STATUSES[viewContract.status] ? T(STATUSES[viewContract.status]) : viewContract.status}
              </span>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3 col-span-2">
              <p className="text-xs text-gray-500 mb-2">Imzolash holati</p>
              <div className="flex gap-3">
                <button onClick={() => onToggleSigned(viewContract, 'signed_us')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewContract.signed_us ? 'bg-emerald-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                  {viewContract.signed_us ? '✅' : '⬜'} Biz imzoladik
                </button>
                <button onClick={() => onToggleSigned(viewContract, 'signed_cp')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewContract.signed_cp ? 'bg-emerald-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                  {viewContract.signed_cp ? '✅' : '⬜'} Kontragent imzoladi
                </button>
              </div>
            </div>
          </div>

          {/* Contract text */}
          {viewContract.content && (
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4">
              <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                {fillPlaceholders(viewContract.content, viewContract)}
              </pre>
            </div>
          )}

          {/* Spec items */}
          {viewContract.spec_items && viewContract.spec_items.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white mb-3">Spesifikatsiya</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-700">
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
                      <tr key={i} className="border-b border-gray-800/50">
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
