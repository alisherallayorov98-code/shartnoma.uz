/**
 * useContractAi — AI tahlil, tuzatish va saqlash mantiqini boshqaradi.
 * page.tsx dagi 8 state + 3 funksiyani almashtiradi.
 */

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchAi } from '@/lib/fetchAi'
import { logAudit } from '@/lib/audit'
import { useToast } from '@/lib/toast'
import type { Contract } from '@/lib/types'
import type { Lang } from '@/lib/i18n'

interface UseContractAiOptions {
  lang: Lang
  openUpgradeModal: () => void
  onSaved: () => void         // reloadContracts + setServerResults(null)
}

interface FixResult {
  shartnoma_yangi: string
  o_zgartirishlar: string[]
}

export function useContractAi({ lang, openUpgradeModal, onSaved }: UseContractAiOptions) {
  const { toast } = useToast()

  const [aiContract, setAiContract] = useState<Contract | null>(null)
  const [aiResult, setAiResult] = useState<unknown>(null)
  const [aiError, setAiError] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTab, setAiTab] = useState<'tahlil' | 'grammatika'>('tahlil')
  const [aiModal, setAiModal] = useState(false)
  const [fixLoading, setFixLoading] = useState(false)
  const [fixResult, setFixResult] = useState<FixResult | null>(null)
  const [fixSaving, setFixSaving] = useState(false)

  async function runAiAnalysis(c: Contract, type: 'tahlil' | 'grammatika') {
    setAiContract(c)
    setAiTab(type)
    setAiResult(null)
    setAiError('')
    setFixResult(null)
    setAiLoading(true)
    setAiModal(true)
    try {
      const res = await fetchAi({
        type: type === 'tahlil' ? 'analysis' : 'grammar',
        content: c.content || '',
        contract_type: c.contract_type,
        contract_number: c.contract_number,
      })
      const data = await res.json()
      if (data.error === 'premium_required') { setAiModal(false); openUpgradeModal(); return }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      setAiResult(data.result ?? null)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setAiLoading(false)
    }
  }

  async function fixContract() {
    if (!aiContract) return
    setFixLoading(true)
    setFixResult(null)
    try {
      const res = await fetchAi({
        type: 'fix',
        content: aiContract.content || '',
        analysis: aiResult,
        lang,
      })
      const data = await res.json()
      if (data.error === 'premium_required') { setAiModal(false); openUpgradeModal(); return }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      const r = data.result as { shartnoma_yangi?: string; o_zgartirishlar?: string[] }
      if (!r?.shartnoma_yangi) throw new Error("AI bo'sh natija qaytardi")
      setFixResult({ shartnoma_yangi: r.shartnoma_yangi, o_zgartirishlar: r.o_zgartirishlar || [] })
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xatolik yuz berdi', 'error')
    } finally {
      setFixLoading(false)
    }
  }

  async function saveFixedContract() {
    if (!aiContract || !fixResult) return
    setFixSaving(true)
    const { error } = await supabase
      .from('contracts')
      .update({ content: fixResult.shartnoma_yangi })
      .eq('id', aiContract.id)
    setFixSaving(false)
    if (error) { toast(`Saqlashda xato: ${error.message}`, 'error'); return }
    logAudit('update', 'contracts', aiContract.id, {
      action: 'ai_fix', changes_count: fixResult.o_zgartirishlar.length,
    })
    toast("Shartnoma muvaffaqiyatli yangilandi", 'success')
    onSaved()
    setAiModal(false)
    setFixResult(null)
  }

  return {
    aiContract, aiResult, aiError, aiLoading,
    aiTab, setAiTab,
    aiModal, setAiModal,
    fixLoading, fixResult, setFixResult,
    fixSaving,
    runAiAnalysis, fixContract, saveFixedContract,
  }
}
