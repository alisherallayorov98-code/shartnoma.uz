'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { Modal, ModalActions } from '../_components/Modal'
import { useToast } from '@/lib/toast'
import type { Org } from '@/lib/types'

const emptyOrg = { name: '', inn: '', director_name: '', bank_name: '', bank_account: '', mfo: '', address: '' }
const emptyBank = { bank_name: '', account_number: '', mfo: '', is_default: false }

export default function TashkilotlarPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { orgs, activeOrg, bankAccounts, switchOrg, reloadOrgs, userId } = useDashboard()
  const { toast } = useToast()

  const [orgForm, setOrgForm] = useState(emptyOrg)
  const [bankForm, setBankForm] = useState(emptyBank)
  const [saving, setSaving] = useState(false)
  const [orgModal, setOrgModal] = useState(false)
  const [bankModal, setBankModal] = useState(false)
  const [rekvizitOrg, setRekvizitOrg] = useState<Org | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const lbl = 'block text-xs text-gray-400 mb-1'
  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (!orgForm.name.trim()) { toast(T(t.msg.nameRequired), 'error'); setSaving(false); return }
    if (orgForm.inn && !/^\d{9}$/.test(orgForm.inn)) { toast(T(t.msg.innInvalid), 'error'); setSaving(false); return }
    if (orgForm.mfo && !/^\d{5}$/.test(orgForm.mfo)) { toast(T(t.msg.mfoInvalid), 'error'); setSaving(false); return }
    if (orgForm.bank_account && !/^\d{20}$/.test(orgForm.bank_account)) { toast(T(t.msg.accountInvalid), 'error'); setSaving(false); return }
    const { data: { session } } = await supabase.auth.getSession()
    const { data: newOrg } = await supabase.from('organizations').insert({ ...orgForm, user_id: session!.user.id }).select().single()
    if (newOrg) {
      await supabase.from('subscriptions').insert({
        organization_id: newOrg.id, user_id: session!.user.id,
        plan: 'free', contracts_used: 0,
        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
    setOrgModal(false); setOrgForm(emptyOrg); setSaving(false); reloadOrgs()
  }

  async function saveBankAccount(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    if (bankForm.mfo && !/^\d{5}$/.test(bankForm.mfo)) { toast(T(t.msg.mfoInvalid), 'error'); setSaving(false); return }
    if (bankForm.account_number && !/^\d{20}$/.test(bankForm.account_number)) { toast(T(t.msg.accountInvalid), 'error'); setSaving(false); return }
    const { data: { session } } = await supabase.auth.getSession()
    if (bankForm.is_default && activeOrg) {
      await supabase.from('bank_accounts').update({ is_default: false }).eq('organization_id', activeOrg.id)
    }
    const { error } = await supabase.from('bank_accounts').insert({ ...bankForm, organization_id: activeOrg!.id, user_id: session!.user.id })
    setSaving(false)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    setBankModal(false); setBankForm(emptyBank); reloadOrgs()
  }

  async function deleteBankAccount(id: string) {
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id)
    if (error) { toast(`${T(t.msg.errorPrefix)}: ${error.message}`, 'error'); return }
    reloadOrgs()
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🏢 {T(t.orgs.title)}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orgs.length} ta tashkilot</p>
        </div>
        <button onClick={() => { setOrgForm(emptyOrg); setOrgModal(true) }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
          + {T(t.orgs.new)}
        </button>
      </div>

      {/* Org list */}
      {orgs.length === 0 ? (
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-gray-400 font-medium">{T(t.orgs.empty)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orgs.map(org => (
            <div key={org.id}
              className={`bg-[#111827] border rounded-xl p-5 transition cursor-pointer ${activeOrg?.id === org.id ? 'border-blue-600' : 'border-[#1E293B] hover:border-blue-600/50'}`}
              onClick={() => switchOrg(org)}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-600/10 border border-blue-600/30 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl flex-shrink-0">
                  {org.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white">{org.name}</h3>
                    {activeOrg?.id === org.id && (
                      <span className="text-xs bg-blue-600/10 text-blue-400 border border-blue-600/30 px-2 py-0.5 rounded-full">{T(t.orgTab.active)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">INN: {org.inn || '—'}</p>
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setRekvizitOrg(org)}
                    className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition font-medium flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Rekvizit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-4">
                {[
                  [T(t.orgs.director), org.director_name],
                  [T(t.orgs.bank), org.bank_name],
                  [T(t.orgs.account), org.bank_account],
                  [T(t.orgs.mfo), org.mfo],
                ].map(([l, v]) => (
                  <div key={l}><span className="text-gray-500">{l}: </span><span className="text-gray-300">{v || '—'}</span></div>
                ))}
                <div className="col-span-2"><span className="text-gray-500">{T(t.orgs.address)}: </span><span className="text-gray-300">{org.address || '—'}</span></div>
              </div>

              {/* Bank accounts + stamp/signature for active org */}
              {activeOrg?.id === org.id && (
                <div className="border-t border-[#1E293B] pt-4 mt-2" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{T(t.orgTab.bankAccounts)}</span>
                    <button onClick={() => setBankModal(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      {T(t.orgTab.addAccount)}
                    </button>
                  </div>
                  {bankAccounts.length === 0 ? (
                    <p className="text-xs text-gray-500">{T(t.orgTab.noAccount)}</p>
                  ) : (
                    <div className="space-y-2">
                      {bankAccounts.map(ba => (
                        <div key={ba.id} className="flex items-center gap-3 bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white font-mono">{ba.account_number}</span>
                              {ba.is_default && <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded">{T(t.orgTab.primary)}</span>}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{ba.bank_name} | MFO: {ba.mfo || '—'}</div>
                          </div>
                          <button onClick={() => deleteBankAccount(ba.id)} className="text-red-500 hover:text-red-400 text-xs p-1">🗑</button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add org modal */}
      {orgModal && (
        <Modal title={T(t.orgs.new)} onClose={() => setOrgModal(false)}>
          <form onSubmit={saveOrg} className="space-y-4">
            <div>
              <label className={lbl}>Tashkilot nomi *</label>
              <input className={inp} required placeholder="Alfa Texnologiya MChJ" value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>STIR (INN)</label>
                <input className={inp} placeholder="123456789" maxLength={9} value={orgForm.inn} onChange={e => setOrgForm({ ...orgForm, inn: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Direktor F.I.Sh</label>
                <input className={inp} placeholder="Karimov Alisher" value={orgForm.director_name} onChange={e => setOrgForm({ ...orgForm, director_name: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Bank nomi</label>
                <input className={inp} placeholder="Xalq banki" value={orgForm.bank_name} onChange={e => setOrgForm({ ...orgForm, bank_name: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>Hisob raqami (X/R)</label>
                <input className={inp} placeholder="20208000000000000000" maxLength={20} value={orgForm.bank_account} onChange={e => setOrgForm({ ...orgForm, bank_account: e.target.value })}/>
              </div>
              <div>
                <label className={lbl}>MFO</label>
                <input className={inp} placeholder="00873" maxLength={5} value={orgForm.mfo} onChange={e => setOrgForm({ ...orgForm, mfo: e.target.value })}/>
              </div>
            </div>
            <div>
              <label className={lbl}>Manzil</label>
              <input className={inp} placeholder="Toshkent shahri, ..." value={orgForm.address} onChange={e => setOrgForm({ ...orgForm, address: e.target.value })}/>
            </div>
            <ModalActions onClose={() => setOrgModal(false)} saving={saving}/>
          </form>
        </Modal>
      )}

      {/* Rekvizit kartochkasi modal */}
      {rekvizitOrg && (
        <RekvizitModal org={rekvizitOrg} onClose={() => setRekvizitOrg(null)} cardRef={cardRef} />
      )}

      {/* Add bank account modal */}
      {bankModal && (
        <Modal title={T(t.orgTab.addAccount)} onClose={() => { setBankModal(false); setBankForm(emptyBank) }}>
          <form onSubmit={saveBankAccount} className="space-y-4">
            <div>
              <label className={lbl}>Bank nomi</label>
              <input className={inp} placeholder="Xalq banki" value={bankForm.bank_name} onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })}/>
            </div>
            <div>
              <label className={lbl}>Hisob raqami (20 raqam)</label>
              <input className={inp} placeholder="20208000000000000000" maxLength={20} value={bankForm.account_number} onChange={e => setBankForm({ ...bankForm, account_number: e.target.value })}/>
            </div>
            <div>
              <label className={lbl}>MFO (5 raqam)</label>
              <input className={inp} placeholder="00873" maxLength={5} value={bankForm.mfo} onChange={e => setBankForm({ ...bankForm, mfo: e.target.value })}/>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={bankForm.is_default} onChange={e => setBankForm({ ...bankForm, is_default: e.target.checked })} className="w-4 h-4 accent-blue-600"/>
              <span className="text-sm text-gray-300">Asosiy hisob sifatida belgilash</span>
            </label>
            <ModalActions onClose={() => { setBankModal(false); setBankForm(emptyBank) }} saving={saving}/>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── Rekvizit kartochkasi modal ───────────────────────────────────────────────
function RekvizitModal({ org, onClose, cardRef }: { org: Org; onClose: () => void; cardRef: React.RefObject<HTMLDivElement | null> }) {
  const { toast } = useToast()
  const [exporting, setExporting] = useState<string | null>(null)

  const row = (label: string, value?: string) =>
    value ? { label, value } : null

  const rows = [
    row('Tashkilot nomi', org.name),
    row('STIR (INN)', org.inn),
    row('Direktor', org.director_name),
    row('Manzil', org.address),
    row('Telefon', org.phone),
    row('Bank', org.bank_name),
    row('Hisob raqami (X/R)', org.bank_account),
    row('MFO', org.mfo),
    row('OKED', org.oked),
    row('QQS ro\'yxat raqami', org.qqsreg),
  ].filter(Boolean) as { label: string; value: string }[]

  const plainText = [
    'REKVIZITLAR',
    '─'.repeat(40),
    ...rows.map(r => `${r.label.padEnd(24)}: ${r.value}`),
    '─'.repeat(40),
    'shartnoma.uz orqali yaratildi',
  ].join('\n')

  async function downloadJpeg() {
    if (!cardRef.current) return
    setExporting('jpeg')
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      const link = document.createElement('a')
      link.download = `rekvizit-${org.name}.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
    } finally { setExporting(null) }
  }

  async function downloadPdf() {
    setExporting('pdf')
    try {
      const { default: jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const F = 'helvetica'
      const blue = [30, 64, 175] as [number, number, number]
      // Header bar
      doc.setFillColor(...blue)
      doc.rect(0, 0, 210, 28, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont(F, 'bold')
      doc.setFontSize(16)
      doc.text('REKVIZITLAR', 14, 12)
      doc.setFontSize(10)
      doc.setFont(F, 'normal')
      doc.text(org.name, 14, 21)
      // Rows
      doc.setTextColor(0, 0, 0)
      let y = 42
      rows.forEach(({ label, value }) => {
        doc.setFont(F, 'bold'); doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(label, 14, y)
        doc.setFont(F, 'normal'); doc.setFontSize(11)
        doc.setTextColor(20, 20, 20)
        doc.text(value, 14, y + 6)
        doc.setDrawColor(230, 230, 230)
        doc.line(14, y + 9, 196, y + 9)
        y += 16
      })
      // Footer
      doc.setFontSize(8); doc.setTextColor(150, 150, 150)
      doc.text('shartnoma.uz orqali yaratildi', 14, 285)
      doc.save(`rekvizit-${org.name}.pdf`)
    } finally { setExporting(null) }
  }

  async function downloadWord() {
    setExporting('word')
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = await import('docx')
      const F = 'Times New Roman'
      const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
      const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
      const thinLine = { style: BorderStyle.SINGLE, size: 4, color: 'E5E7EB' }
      const lineBorders = { top: thinLine, bottom: noBorder, left: noBorder, right: noBorder }

      const dataRows = rows.map(({ label, value }) =>
        new TableRow({ children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            borders: lineBorders,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: F, color: '6B7280' })] })],
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            borders: lineBorders,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 22, font: F, color: '111827' })] })],
          }),
        ]})
      )

      const doc = new Document({ sections: [{ children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'REKVIZITLAR', bold: true, size: 32, font: F, color: '1E40AF' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 320 }, children: [new TextRun({ text: org.name, bold: true, size: 26, font: F })] }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: dataRows }),
        new Paragraph({ spacing: { before: 480 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'shartnoma.uz orqali yaratildi', size: 16, font: F, color: '9CA3AF' })] }),
      ]}]})

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `rekvizit-${org.name}.docx`; a.click()
      URL.revokeObjectURL(url)
    } finally { setExporting(null) }
  }

  async function copyText() {
    await navigator.clipboard.writeText(plainText)
    toast('Rekvizitlar nusxalandi', 'success')
  }

  const btnCls = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition border ${active ? 'opacity-50 cursor-wait' : ''}`

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] flex-shrink-0">
          <h2 className="text-base font-semibold text-white">Rekvizit kartochkasi</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition text-xl">×</button>
        </div>

        {/* Card preview */}
        <div className="overflow-y-auto flex-1 p-6">
          <div ref={cardRef} style={{ background: '#ffffff', borderRadius: 12, padding: 32, fontFamily: 'Arial, sans-serif' }}>
            {/* Card header */}
            <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)', borderRadius: 8, padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ color: '#93c5fd', fontSize: 11, fontWeight: 600, letterSpacing: 2, marginBottom: 4 }}>REKVIZITLAR</div>
              <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 700 }}>{org.name}</div>
            </div>
            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {rows.map(({ label, value }, i) => (
                <div key={i} style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingTop: 10, paddingBottom: 10 }}>
                  <div style={{ width: '40%', color: '#6b7280', fontSize: 12, paddingRight: 12 }}>{label}</div>
                  <div style={{ flex: 1, color: '#111827', fontSize: 13, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div style={{ marginTop: 24, textAlign: 'center', color: '#9ca3af', fontSize: 10 }}>
              shartnoma.uz orqali yaratildi
            </div>
          </div>
        </div>

        {/* Export buttons */}
        <div className="px-6 py-4 border-t border-[#1E293B] flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={downloadJpeg} disabled={!!exporting}
              className={btnCls(exporting === 'jpeg') + ' bg-purple-600/10 border-purple-600/30 text-purple-400 hover:bg-purple-600/20'}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              {exporting === 'jpeg' ? 'Yuklanmoqda...' : 'JPEG yuklab olish'}
            </button>
            <button onClick={downloadPdf} disabled={!!exporting}
              className={btnCls(exporting === 'pdf') + ' bg-red-600/10 border-red-600/30 text-red-400 hover:bg-red-600/20'}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              {exporting === 'pdf' ? 'Yuklanmoqda...' : 'PDF yuklab olish'}
            </button>
            <button onClick={downloadWord} disabled={!!exporting}
              className={btnCls(exporting === 'word') + ' bg-blue-600/10 border-blue-600/30 text-blue-400 hover:bg-blue-600/20'}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              {exporting === 'word' ? 'Yuklanmoqda...' : 'Word yuklab olish'}
            </button>
            <button onClick={copyText}
              className={btnCls(false) + ' bg-green-600/10 border-green-600/30 text-green-400 hover:bg-green-600/20'}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              Matnni nusxalash
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
