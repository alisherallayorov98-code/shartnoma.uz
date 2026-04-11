'use client'

import type { Client } from '../types'

/* ── EDIT SUBSCRIPTION MODAL ── */
export function EditSubModal({
  editClient, editForm, setEditForm, saving, darkMode,
  onClose, onSubmit,
}: {
  editClient: Client | null
  editForm: { plan: string; period_end: string; is_active: boolean }
  setEditForm: React.Dispatch<React.SetStateAction<{ plan: string; period_end: string; is_active: boolean }>>
  saving: string
  darkMode: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  if (!editClient) return null
  const dm = darkMode
  const bg = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const inp = dm
    ? 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'
    : 'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'
  const lbl = `block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`border rounded-2xl w-full max-w-md shadow-2xl ${bg}`}>
        <div className={`flex justify-between items-center px-6 py-4 border-b ${dm ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <div className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>{editClient.name}</div>
            <div className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Tarifni tahrirlash</div>
          </div>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition ${dm ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>×</button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className={lbl}>Tarif rejasi</label>
            <div className="grid grid-cols-3 gap-2">
              {[{v:'free',l:'Bepul',c:'gray'},{v:'standard',l:'Standart',c:'blue'},{v:'ai_pro',l:'AI Pro',c:'purple'}].map(p => (
                <button key={p.v} type="button" onClick={() => setEditForm(f => ({ ...f, plan: p.v }))}
                  className={`py-2 rounded-lg text-sm font-medium transition border ${editForm.plan === p.v
                    ? (p.c === 'blue' ? 'bg-blue-700 border-blue-500 text-white' : p.c === 'purple' ? 'bg-purple-700 border-purple-500 text-white' : 'bg-gray-600 border-gray-500 text-white')
                    : dm ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-800'
                  }`}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Muddat tugash sanasi</label>
            <input type="date" className={inp} value={editForm.period_end}
              onChange={e => setEditForm(f => ({ ...f, period_end: e.target.value }))}/>
            <div className="flex gap-2 mt-2">
              {[1, 3, 6, 12].map(m => (
                <button key={m} type="button"
                  onClick={() => setEditForm(f => ({ ...f, period_end: new Date(Date.now() + m * 30 * 86400000).toISOString().split('T')[0] }))}
                  className={`text-xs px-2.5 py-1 rounded transition ${dm ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                  +{m} oy
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={editForm.is_active}
              onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 accent-blue-500"/>
            <span className={`text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>Faol holat</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className={`flex-1 border py-2.5 rounded-lg text-sm transition ${dm ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Bekor</button>
            <button type="submit" disabled={saving === 'edit'}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
              {saving === 'edit' ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── NOTE MODAL ── */
export function NoteModal({
  noteClient, noteText, setNoteText, saving, darkMode, onClose, onSave,
}: {
  noteClient: Client | null
  noteText: string
  setNoteText: (v: string) => void
  saving: string
  darkMode: boolean
  onClose: () => void
  onSave: () => void
}) {
  if (!noteClient) return null
  const dm = darkMode
  const bg = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const inp = dm
    ? 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 min-h-[120px] resize-none'
    : 'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 min-h-[120px] resize-none'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`border rounded-2xl w-full max-w-md shadow-2xl ${bg}`}>
        <div className={`flex justify-between items-center px-6 py-4 border-b ${dm ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <div className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>{noteClient.name}</div>
            <div className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Admin izohi</div>
          </div>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition ${dm ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>×</button>
        </div>
        <div className="p-6 space-y-4">
          <textarea className={inp} value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Masalan: 21-mart qo'ng'iroq qilindi. To'lov kutilmoqda."/>
          <div className="flex gap-3">
            <button onClick={onClose} className={`flex-1 border py-2.5 rounded-lg text-sm transition ${dm ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Bekor</button>
            <button onClick={onSave} disabled={saving === 'note'}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
              {saving === 'note' ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── PAYMENT MODAL ── */
export function PaymentModal({
  addPaymentModal, payForm, setPayForm, paySearch, setPaySearch,
  paySaving, clients, darkMode, onClose, onSubmit,
}: {
  addPaymentModal: boolean
  payForm: { orgId: string; amount: string; plan: string; note: string }
  setPayForm: React.Dispatch<React.SetStateAction<{ orgId: string; amount: string; plan: string; note: string }>>
  paySearch: string
  setPaySearch: (v: string) => void
  paySaving: boolean
  clients: Client[]
  darkMode: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  if (!addPaymentModal) return null
  const dm = darkMode
  const bg = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const inp = dm
    ? 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
    : 'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
  const lbl = `block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`
  const listBg = dm ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
  const listBorder = dm ? 'border-gray-700 divide-gray-800' : 'border-gray-200 divide-gray-100'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`border rounded-2xl w-full max-w-md shadow-2xl ${bg}`}>
        <div className={`flex justify-between items-center px-6 py-4 border-b ${dm ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <div className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>💳 To&apos;lov qo&apos;shish</div>
            <div className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Obuna avtomatik faollashadi</div>
          </div>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition ${dm ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>×</button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className={lbl}>Tashkilot</label>
            <input className={inp + ' mb-2'} placeholder="Email yoki tashkilot nomi..." value={paySearch}
              onChange={e => { setPaySearch(e.target.value); setPayForm(f => ({ ...f, orgId: '' })) }}/>
            {!payForm.orgId && (
              <div className={`max-h-36 overflow-y-auto rounded-lg border divide-y ${listBorder}`}>
                {clients.filter(c => !paySearch || c.name.toLowerCase().includes(paySearch.toLowerCase()) || c.user_email.toLowerCase().includes(paySearch.toLowerCase()) || c.inn.includes(paySearch))
                  .slice(0, 8).map(c => (
                    <button key={c.id} type="button"
                      onClick={() => { setPayForm(f => ({ ...f, orgId: c.id })); setPaySearch(c.name) }}
                      className={`w-full text-left px-3 py-2.5 text-sm transition flex justify-between ${listBg}`}>
                      <span className="truncate">{c.name}</span>
                      <span className={`text-xs ml-2 shrink-0 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{c.user_email}</span>
                    </button>
                  ))}
              </div>
            )}
            {payForm.orgId && (
              <div className="flex items-center justify-between bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2">
                <span className="text-sm text-blue-300">✓ {clients.find(c => c.id === payForm.orgId)?.name}</span>
                <button type="button" onClick={() => { setPayForm(f => ({ ...f, orgId: '' })); setPaySearch('') }}
                  className={`text-xs ${dm ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>o&apos;zgartir</button>
              </div>
            )}
          </div>
          <div>
            <label className={lbl}>Miqdor (so&apos;m)</label>
            <input className={inp} placeholder="50 000" value={payForm.amount}
              onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required/>
            <div className="flex gap-2 mt-2">
              {['50000','100000','199000','500000'].map(v => (
                <button key={v} type="button" onClick={() => setPayForm(f => ({ ...f, amount: v }))}
                  className={`text-xs px-2.5 py-1 rounded transition ${dm ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                  {Number(v).toLocaleString('uz-UZ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Tarif</label>
            <div className="grid grid-cols-2 gap-2">
              {[{v:'standard',l:'Standart'},{v:'ai_pro',l:'AI Pro'}].map(p => (
                <button key={p.v} type="button" onClick={() => setPayForm(f => ({ ...f, plan: p.v }))}
                  className={`py-2 rounded-lg text-sm font-medium border transition ${payForm.plan === p.v
                    ? (p.v === 'ai_pro' ? 'bg-purple-700 border-purple-500 text-white' : 'bg-blue-700 border-blue-500 text-white')
                    : dm ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Izoh (ixtiyoriy)</label>
            <input className={inp} placeholder="Masalan: Payme orqali to'ladi" value={payForm.note}
              onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))}/>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className={`flex-1 border py-2.5 rounded-lg text-sm transition ${dm ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Bekor</button>
            <button type="submit" disabled={paySaving || !payForm.orgId || !payForm.amount}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
              {paySaving ? 'Saqlanmoqda...' : 'Saqlash + Obuna faollashtir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── DEMO MODAL ── */
export function DemoModal({
  addDemoModal, demoForm, setDemoForm, demoSearch, setDemoSearch,
  demoSaving, clients, darkMode, onClose, onSubmit,
}: {
  addDemoModal: boolean
  demoForm: { orgId: string; days: string; note: string }
  setDemoForm: React.Dispatch<React.SetStateAction<{ orgId: string; days: string; note: string }>>
  demoSearch: string
  setDemoSearch: (v: string) => void
  demoSaving: boolean
  clients: Client[]
  darkMode: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  if (!addDemoModal) return null
  const dm = darkMode
  const bg = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const inp = dm
    ? 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
    : 'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
  const lbl = `block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`
  const listBg = dm ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
  const listBorder = dm ? 'border-gray-700 divide-gray-800' : 'border-gray-200 divide-gray-100'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`border rounded-2xl w-full max-w-md shadow-2xl ${bg}`}>
        <div className={`flex justify-between items-center px-6 py-4 border-b ${dm ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <div className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>🎯 Demo kirish berish</div>
            <div className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-500'}`}>Obunaga ta&apos;sir qilmaydi</div>
          </div>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition ${dm ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>×</button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className={lbl}>Tashkilot</label>
            <input className={inp + ' mb-2'} placeholder="Nomi yoki email..." value={demoSearch}
              onChange={e => { setDemoSearch(e.target.value); setDemoForm(f => ({ ...f, orgId: '' })) }}/>
            {!demoForm.orgId && (
              <div className={`max-h-36 overflow-y-auto rounded-lg border divide-y ${listBorder}`}>
                {clients.filter(c => !demoSearch || c.name.toLowerCase().includes(demoSearch.toLowerCase()) || c.inn.includes(demoSearch) || c.user_email.toLowerCase().includes(demoSearch.toLowerCase()))
                  .slice(0, 8).map(c => (
                    <button key={c.id} type="button"
                      onClick={() => { setDemoForm(f => ({ ...f, orgId: c.id })); setDemoSearch(c.name) }}
                      className={`w-full text-left px-3 py-2.5 text-sm transition flex justify-between ${listBg}`}>
                      <span className="truncate">{c.name}</span>
                      <span className={`text-xs ml-2 shrink-0 font-mono ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{c.inn}</span>
                    </button>
                  ))}
              </div>
            )}
            {demoForm.orgId && (
              <div className="flex items-center justify-between bg-orange-900/20 border border-orange-800/40 rounded-lg px-3 py-2">
                <span className="text-sm text-orange-300">✓ {clients.find(c => c.id === demoForm.orgId)?.name}</span>
                <button type="button" onClick={() => { setDemoForm(f => ({ ...f, orgId: '' })); setDemoSearch('') }}
                  className={`text-xs ${dm ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>o&apos;zgartir</button>
              </div>
            )}
          </div>
          <div>
            <label className={lbl}>Necha kun</label>
            <div className="grid grid-cols-7 gap-1.5">
              {['1','2','3','5','7','14','30'].map(d => (
                <button key={d} type="button" onClick={() => setDemoForm(f => ({ ...f, days: d }))}
                  className={`py-2 rounded-lg text-sm font-medium transition ${demoForm.days === d ? 'bg-orange-600 text-white' : dm ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={lbl}>Izoh (ixtiyoriy)</label>
            <input className={inp} placeholder="Masalan: Instagram reklama" value={demoForm.note}
              onChange={e => setDemoForm(f => ({ ...f, note: e.target.value }))}/>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className={`flex-1 border py-2.5 rounded-lg text-sm transition ${dm ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Bekor</button>
            <button type="submit" disabled={demoSaving || !demoForm.orgId}
              className="flex-1 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition">
              {demoSaving ? 'Berilmoqda...' : `${demoForm.days} kun demo berish`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── ADD CONTENT MODAL ── */
export function AddContentModal({
  addContentModal, newContentForm, setNewContentForm, darkMode, onClose, onSubmit,
}: {
  addContentModal: boolean
  newContentForm: { key: string; label: string; type: string; value: string }
  setNewContentForm: React.Dispatch<React.SetStateAction<{ key: string; label: string; type: string; value: string }>>
  darkMode: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  if (!addContentModal) return null
  const dm = darkMode
  const bg = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const inp = dm
    ? 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
    : 'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
  const lbl = `block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`border rounded-2xl w-full max-w-md shadow-2xl ${bg}`}>
        <div className={`flex justify-between items-center px-6 py-4 border-b ${dm ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>+ Yangi kontent qo&apos;shish</div>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition ${dm ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>×</button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className={lbl}>Kalit (slug)</label>
            <input className={inp} value={newContentForm.key}
              onChange={e => setNewContentForm(f => ({ ...f, key: e.target.value.replace(/\s/g, '_') }))}
              placeholder="masalan: promo_banner" required/>
          </div>
          <div>
            <label className={lbl}>Nom (admin uchun)</label>
            <input className={inp} value={newContentForm.label}
              onChange={e => setNewContentForm(f => ({ ...f, label: e.target.value }))}
              placeholder="masalan: Promo banner rasmi" required/>
          </div>
          <div>
            <label className={lbl}>Turi</label>
            <div className="grid grid-cols-3 gap-2">
              {[{v:'text',l:'📝 Matn'},{v:'image',l:'🖼 Rasm'},{v:'video',l:'🎬 Video'}].map(t => (
                <button key={t.v} type="button" onClick={() => setNewContentForm(f => ({ ...f, type: t.v }))}
                  className={`py-2 rounded-lg text-sm transition border ${newContentForm.type === t.v ? 'bg-blue-700 border-blue-500 text-white' : dm ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          {newContentForm.type === 'text' && (
            <div>
              <label className={lbl}>Boshlang&apos;ich qiymat</label>
              <input className={inp} value={newContentForm.value}
                onChange={e => setNewContentForm(f => ({ ...f, value: e.target.value }))} placeholder="..."/>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className={`flex-1 border py-2.5 rounded-lg text-sm transition ${dm ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Bekor</button>
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-semibold transition">Qo&apos;shish</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── GLOBAL ADD MODAL ── */
export function GlobalAddModal({
  globalAddOpen, globalForm, setGlobalForm, globalSaving, globalStirLoading,
  darkMode, onClose, onSubmit, onStirLookup,
}: {
  globalAddOpen: boolean
  globalForm: { inn: string; name: string; director: string; address: string; mfo: string; bank_name: string; account: string; phone: string }
  setGlobalForm: React.Dispatch<React.SetStateAction<{ inn: string; name: string; director: string; address: string; mfo: string; bank_name: string; account: string; phone: string }>>
  globalSaving: boolean
  globalStirLoading: boolean
  darkMode: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onStirLookup: () => void
}) {
  if (!globalAddOpen) return null
  const dm = darkMode
  const bg = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const inp = dm
    ? 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'
    : 'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500'
  const lbl = `block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`border rounded-2xl w-full max-w-lg shadow-2xl ${bg}`}>
        <div className={`flex justify-between items-center px-6 py-4 border-b ${dm ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className={`font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>Tashkilot qo&apos;shish</div>
          <button onClick={onClose} className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition ${dm ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>×</button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-3">
          <div>
            <label className={lbl}>INN / STIR <span className="text-red-400">*</span></label>
            <div className="flex gap-2">
              <input value={globalForm.inn}
                onChange={e => setGlobalForm(p => ({ ...p, inn: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onStirLookup() } }}
                placeholder="123456789 — Enter bosing" maxLength={9}
                className={inp + ' flex-1'} required/>
              <button type="button" onClick={onStirLookup} disabled={globalStirLoading || globalForm.inn.length !== 9}
                className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/30 text-blue-400 rounded-lg text-sm disabled:opacity-40 transition">
                {globalStirLoading ? '...' : 'Soliq'}
              </button>
            </div>
          </div>
          <div>
            <label className={lbl}>Nomi <span className="text-red-400">*</span></label>
            <input value={globalForm.name} onChange={e => setGlobalForm(p => ({ ...p, name: e.target.value }))} className={inp} required/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Rahbar</label>
              <input value={globalForm.director} onChange={e => setGlobalForm(p => ({ ...p, director: e.target.value }))} className={inp}/>
            </div>
            <div>
              <label className={lbl}>Telefon</label>
              <input value={globalForm.phone} onChange={e => setGlobalForm(p => ({ ...p, phone: e.target.value }))} className={inp} placeholder="+998..."/>
            </div>
          </div>
          <div>
            <label className={lbl}>Manzil</label>
            <input value={globalForm.address} onChange={e => setGlobalForm(p => ({ ...p, address: e.target.value }))} className={inp}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>MFO</label>
              <input value={globalForm.mfo} onChange={e => setGlobalForm(p => ({ ...p, mfo: e.target.value }))} className={inp} placeholder="00000"/>
            </div>
            <div>
              <label className={lbl}>Bank nomi</label>
              <input value={globalForm.bank_name} onChange={e => setGlobalForm(p => ({ ...p, bank_name: e.target.value }))} className={inp}/>
            </div>
          </div>
          <div>
            <label className={lbl}>Hisob raqami</label>
            <input value={globalForm.account} onChange={e => setGlobalForm(p => ({ ...p, account: e.target.value }))} className={inp} placeholder="20208000000000000000"/>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={globalSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition text-sm">
              {globalSaving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button type="button" onClick={onClose}
              className={`px-5 border py-2.5 rounded-lg transition text-sm ${dm ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'}`}>
              Bekor
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
