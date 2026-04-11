'use client'

import type { SysTemplate } from '../types'

const CONTRACT_TYPES = [
  { value: 'oldi_sotdi', label: 'Oldi-sotdi' }, { value: 'xizmat', label: 'Xizmat' },
  { value: 'ijara', label: 'Ijara' }, { value: 'pudrat', label: 'Pudrat' },
  { value: 'qoshimcha', label: "Qo'shimcha" }, { value: 'moliyaviy', label: 'Moliyaviy' },
  { value: 'daval', label: 'Daval' }, { value: 'agentlik', label: 'Agentlik' },
  { value: 'transport', label: 'Transport' }, { value: 'lizing', label: 'Lizing' },
  { value: 'xalqaro', label: 'Xalqaro' }, { value: 'boshqa', label: 'Boshqa' },
]
const LANGS = [{ v: 'uz', l: "O'zbek (lotin)" }, { v: 'oz', l: "O'zbek (kirill)" }, { v: 'ru', l: 'Rus' }]

interface Props {
  sysTemplates: SysTemplate[]
  tplType: string; setTplType: (v: string) => void
  tplLang: string; setTplLang: (v: string) => void
  tplName: string; setTplName: (v: string) => void
  tplContent: string; setTplContent: (v: string) => void
  tplSaving: boolean
  darkMode: boolean
  saveTemplate: (e: React.FormEvent) => void
  loadTemplateForEdit: (type: string, lang: string) => void
  deleteTemplate: (id: string) => void
  loadTemplates: () => void
}

export default function TemplatesTab({
  sysTemplates, tplType, setTplType, tplLang, setTplLang,
  tplName, setTplName, tplContent, setTplContent, tplSaving,
  darkMode, saveTemplate, loadTemplateForEdit, deleteTemplate, loadTemplates,
}: Props) {
  const dm = darkMode
  const card = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const inp = dm
    ? 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
    : 'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
  const lbl = `block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`
  const textSub = dm ? 'text-gray-400' : 'text-gray-500'
  const textMuted = dm ? 'text-gray-600' : 'text-gray-400'

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Left: list */}
      <div className="col-span-1 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <div className={`text-xs font-semibold uppercase tracking-wider ${textSub}`}>
            Saqlangan ({sysTemplates.length})
          </div>
          <button onClick={loadTemplates}
            className={`text-xs px-2 py-1 rounded-lg transition ${dm ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
            🔄
          </button>
        </div>

        {sysTemplates.length === 0 && (
          <div className={`text-sm py-6 text-center rounded-xl border ${dm ? 'text-gray-600 border-gray-800 bg-gray-900/50' : 'text-gray-400 border-gray-200 bg-gray-50'}`}>
            <div className="text-3xl mb-2">📭</div>
            <div>Hali shablon yo&apos;q</div>
            <div className={`text-xs mt-1 ${textMuted}`}>O&apos;ngdan yozing va saqlang</div>
          </div>
        )}

        {sysTemplates.map(t => (
          <div key={t.id} className={`border rounded-xl p-3 flex items-start justify-between gap-2 ${card}`}>
            <div className="min-w-0">
              <div className={`text-sm font-medium truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{t.name}</div>
              <div className={`text-xs mt-0.5 ${textSub}`}>
                {CONTRACT_TYPES.find(c => c.value === t.type)?.label || t.type} · {t.language}
              </div>
              <div className={`text-xs ${textMuted}`}>{new Date(t.updated_at).toLocaleDateString('uz-UZ')}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => { setTplType(t.type); setTplLang(t.language); setTplName(t.name); setTplContent(t.content) }}
                className="text-xs bg-blue-900/40 hover:bg-blue-800 text-blue-300 px-2 py-1 rounded transition">✏️</button>
              <button onClick={() => deleteTemplate(t.id)}
                className="text-xs bg-red-900/30 hover:bg-red-800 text-red-400 px-2 py-1 rounded transition">🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Right: editor */}
      <div className="col-span-2">
        <form onSubmit={saveTemplate} className={`border rounded-xl p-5 space-y-4 ${card}`}>
          <div className={`text-sm font-semibold ${dm ? 'text-white' : 'text-gray-900'}`}>Yangi / mavjud shablon tahriri</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Shartnoma turi</label>
              <select value={tplType} onChange={e => { setTplType(e.target.value); loadTemplateForEdit(e.target.value, tplLang) }}
                className={inp}>
                {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Tili</label>
              <select value={tplLang} onChange={e => { setTplLang(e.target.value); loadTemplateForEdit(tplType, e.target.value) }}
                className={inp}>
                {LANGS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Shablon nomi</label>
            <input className={inp} value={tplName} onChange={e => setTplName(e.target.value)}
              placeholder="Masalan: Standart xizmat ko'rsatish shartnomasi" required/>
          </div>
          <div>
            <label className={lbl}>Kontent (placeholder misol: {'{{seller_name}}'}, {'{{amount}}'}, {'{{contract_date}}'})</label>
            <textarea className={inp + ' min-h-[400px] resize-y font-mono text-xs'} value={tplContent}
              onChange={e => setTplContent(e.target.value)}
              placeholder="Shartnoma matnini shu yerga yozing..." required/>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setTplName(''); setTplContent('') }}
              className={`border px-4 py-2 rounded-lg text-sm transition ${dm ? 'border-gray-700 text-gray-400 hover:bg-gray-800' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
              Tozalash
            </button>
            <button type="submit" disabled={tplSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition">
              {tplSaving ? 'Saqlanmoqda...' : '💾 Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
