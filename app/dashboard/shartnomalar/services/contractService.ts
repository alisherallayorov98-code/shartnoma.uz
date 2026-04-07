/**
 * Shartnomalar — sof API funksiyalari
 * React state ga bog'liq emas; page.tsx dan import qilinadi.
 */

import { supabase } from '@/lib/supabase'
import { logAudit } from '@/lib/audit'
import { generateContractDOCX } from '@/lib/export/contractDocx'
import { CONTRACT_TYPE_NAMES } from '@/lib/contractTemplates'
import type { Contract } from '@/lib/types'

/** Shartnoma holatini o'zgartirish */
export async function updateContractStatus(
  id: string,
  status: string,
  orgId: string,
): Promise<string | null> {
  const { error } = await supabase
    .from('contracts').update({ status }).eq('id', id).eq('organization_id', orgId)
  return error?.message ?? null
}

/** Imzo belgisini almashtirish (signed_us / signed_cp) */
export async function toggleContractSigned(
  c: Contract,
  side: 'signed_us' | 'signed_cp',
  orgId: string,
): Promise<{ error: string | null; bothSigned: boolean }> {
  const { error } = await supabase
    .from('contracts').update({ [side]: !c[side] }).eq('id', c.id).eq('organization_id', orgId)
  if (error) return { error: error.message, bothSigned: false }

  const newUs = side === 'signed_us' ? !c.signed_us : c.signed_us
  const newCp = side === 'signed_cp' ? !c.signed_cp : c.signed_cp
  return { error: null, bothSigned: !!(newUs && newCp) }
}

/** Ikki tomonlama imzolanganda email bildirishnoma yuborish */
export async function notifyBothSigned(contractId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  fetch('/api/notify/signed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ contractId }),
  }).catch(() => {})
}

/** Shartnomani o'chirish (versiyalar bilan) */
export async function deleteContractById(
  id: string,
  orgId: string,
  contractNumber?: string,
  contractType?: string,
): Promise<string | null> {
  await supabase.from('contract_versions').delete().eq('contract_id', id)
  const { error } = await supabase
    .from('contracts').delete().eq('id', id).eq('organization_id', orgId)
  if (error) return error.message
  logAudit('delete', 'contracts', id, { contract_number: contractNumber, contract_type: contractType })
  return null
}

/** Telegram orqali Word fayl yuborish */
export async function shareByTelegram(c: Contract): Promise<'sent' | 'fallback' | 'error'> {
  try {
    const blob = await generateContractDOCX(c, true) as Blob
    if (!blob) return 'error'

    const fileName = `contract-shares/${c.id}-${Date.now()}.docx`
    const { error: uploadError } = await supabase.storage
      .from('contract-shares')
      .upload(fileName, blob, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      })

    if (uploadError) {
      // Fallback: foydalanuvchi qo'lda yuborsin
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `shartnoma-${c.contract_number || 'yangi'}.docx`; a.click()
      URL.revokeObjectURL(url)
      window.open('tg://', '_blank')
      return 'fallback'
    }

    const { data: signedData } = await supabase.storage
      .from('contract-shares').createSignedUrl(fileName, 7 * 24 * 3600)

    if (!signedData?.signedUrl) return 'error'

    const typeName = (CONTRACT_TYPE_NAMES as Record<string, string>)[c.contract_type] || c.contract_type
    const text = [
      `📄 Shartnoma: ${typeName}`,
      `№ ${c.contract_number}`,
      `Tashkilot: ${c.organizations?.name || ''}`,
      `Kontragent: ${c.counterparties?.name || ''}`,
      `Summa: ${Number(c.amount || 0).toLocaleString()} so'm`,
      `\nWord faylni yuklab oling:`,
    ].join('\n')

    window.open(
      `tg://msg_url?url=${encodeURIComponent(signedData.signedUrl)}&text=${encodeURIComponent(text)}`,
      '_blank',
    )
    return 'sent'
  } catch {
    return 'error'
  }
}

/** CSV eksport (kontrakt ro'yxatidan) */
export function exportContractsCSV(list: Contract[]): void {
  const TYPE_NAMES: Record<string, string> = {
    oldi_sotdi: 'Oldi-sotdi', xizmat: "Xizmat ko'rsatish", ijara: 'Ijara',
    pudrat: 'Pudrat', qoshimcha: "Qo'shimcha", moliyaviy: 'Moliyaviy yordam',
    daval: 'Daval', xalqaro: 'Xalqaro', agentlik: 'Agentlik',
    transport: 'Transport', lizing: 'Lizing', boshqa: 'Boshqa',
  }
  const headers = ['Raqam', 'Sana', 'Tur', 'Holat', 'Summa', 'Kontragent', 'Tashkilot', 'Shahar']
  const rows = list.map(c => [
    c.contract_number,
    c.contract_date,
    TYPE_NAMES[c.contract_type] || c.contract_type,
    c.status,
    c.amount?.toLocaleString() || '0',
    c.counterparties?.name || '',
    c.organizations?.name || '',
    c.city || '',
  ])
  const bom = '\uFEFF'
  const csv = bom + [headers, ...rows]
    .map(row => row.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'shartnomalar.csv'; a.click()
  URL.revokeObjectURL(url)
}
