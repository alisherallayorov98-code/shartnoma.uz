'use client'

import { type Lang } from '@/lib/i18n'
import { t, tr } from '@/lib/i18n'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'

type Contract = {
  id: string
  content?: string | null
  contract_number: string
  contract_type: string
  counterparty_id?: string | null
  counterparties?: { name: string } | null
}

export default function ContractSelector({
  lang, contracts, cpOptions, hubCp, hubContract, setHubCp, setHubContract, setHubResult, setHubError,
}: {
  lang: Lang
  contracts: Contract[]
  cpOptions: [string, string][]
  hubCp: string
  hubContract: string
  setHubCp: (v: string) => void
  setHubContract: (v: string) => void
  setHubResult: (v: null) => void
  setHubError: (v: string) => void
}) {
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const contractsWithContent = contracts.filter(c => c.content?.trim())
  const selectedHasContent = contracts.find(c => c.id === hubContract)?.content?.trim()

  return (
    <div className="space-y-3">
      {cpOptions.length > 0 && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Kontragent</label>
          <select value={hubCp} onChange={e => { setHubCp(e.target.value); setHubContract(''); setHubResult(null); setHubError('') }}
            className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer">
            <option value="">{T(t.yuristPage.allCps)}</option>
            {cpOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          {T({ uz: 'Shartnoma tanlang', oz: 'Шартнома танланг', ru: 'Выберите договор' })}
          {contractsWithContent.length === 0 && contracts.length > 0 && (
            <span className="ml-2 text-amber-400">{T(t.yuristPage.noContentWarn)}</span>
          )}
        </label>
        <select value={hubContract} onChange={e => { setHubContract(e.target.value); setHubResult(null); setHubError('') }}
          className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 cursor-pointer">
          <option value="">{T(t.yuristPage.selectContract)}</option>
          {contracts.map(c => {
            const hasContent = Boolean(c.content?.trim())
            return (
              <option key={c.id} value={c.id} disabled={!hasContent}>
                {hasContent ? '✓' : '✗'} #{c.contract_number} · {CONTRACT_TYPES_I18N[c.contract_type]?.[lang]}
                {!hubCp ? ` · ${c.counterparties?.name || '—'}` : ''}
                {!hasContent ? ` ${T(t.yuristPage.noContractText)}` : ''}
              </option>
            )
          })}
        </select>
        {hubContract && !selectedHasContent && (
          <p className="text-amber-400 text-xs mt-1">{T(t.yuristPage.noTextWarn)}</p>
        )}
      </div>
    </div>
  )
}
