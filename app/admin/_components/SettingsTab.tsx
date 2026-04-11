'use client'

interface Props {
  settings: Record<string, string>
  setSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>
  settingsSaving: boolean
  darkMode: boolean
  saveAllSettings: (e: React.FormEvent) => void
}

export default function SettingsTab({ settings, setSettings, settingsSaving, darkMode, saveAllSettings }: Props) {
  const dm = darkMode
  const card = dm ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const inp = dm
    ? 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
    : 'w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500'
  const lbl = `block text-xs font-medium mb-1.5 ${dm ? 'text-gray-400' : 'text-gray-600'}`
  const sectionTitle = `text-sm font-semibold border-b pb-3 mb-4 ${dm ? 'text-white border-gray-800' : 'text-gray-900 border-gray-200'}`

  return (
    <form onSubmit={saveAllSettings} className="space-y-5 max-w-2xl">
      <div className={`border rounded-xl p-5 ${card}`}>
        <div className={sectionTitle}>📊 Shartnoma limitlari</div>
        {[
          { key: 'free_contract_limit', label: 'Bepul tarif limiti', hint: 'Standart: 5' },
          { key: 'standard_contract_limit', label: 'Standart tarif limiti', hint: 'Standart: cheksiz (999999)' },
          { key: 'ai_pro_contract_limit', label: 'AI Pro tarif limiti', hint: 'Standart: cheksiz (999999)' },
        ].map(s => (
          <div key={s.key} className="mb-4">
            <label className={lbl}>{s.label} <span className={dm ? 'text-gray-600' : 'text-gray-400'}>({s.hint})</span></label>
            <input type="number" className={inp} value={settings[s.key] || ''}
              onChange={e => setSettings(prev => ({ ...prev, [s.key]: e.target.value }))}/>
          </div>
        ))}
      </div>

      <div className={`border rounded-xl p-5 ${card}`}>
        <div className={sectionTitle}>💰 Narxlar</div>
        {[
          { key: 'standard_price', label: "Standart tarif narxi (so'm/oy)" },
          { key: 'ai_pro_price', label: "AI Pro tarif narxi (so'm/oy)" },
        ].map(s => (
          <div key={s.key} className="mb-4">
            <label className={lbl}>{s.label}</label>
            <input type="number" className={inp} value={settings[s.key] || ''}
              onChange={e => setSettings(prev => ({ ...prev, [s.key]: e.target.value }))}/>
          </div>
        ))}
      </div>

      <div className={`border rounded-xl p-5 ${card}`}>
        <div className={sectionTitle}>📢 E&apos;lon (foydalanuvchilarga ko&apos;rinadigan xabar)</div>
        <div className="mb-4">
          <label className={lbl}>E&apos;lon matni (bo&apos;sh qoldirilsa ko&apos;rinmaydi)</label>
          <textarea className={inp + ' min-h-[80px] resize-none'} value={settings['announcement'] || ''}
            onChange={e => setSettings(prev => ({ ...prev, announcement: e.target.value }))}
            placeholder="Masalan: Tizim 25-aprel 02:00-04:00 oralig'ida texnik ishlar sababli ishlamaydi"/>
        </div>
        <div>
          <label className={lbl}>E&apos;lon rangi</label>
          <div className="flex gap-2">
            {[{v:'blue',l:"Ko'k",c:'bg-blue-600'},{v:'yellow',l:'Sariq',c:'bg-yellow-600'},{v:'red',l:'Qizil',c:'bg-red-600'},{v:'green',l:'Yashil',c:'bg-emerald-600'}].map(c => (
              <button key={c.v} type="button" onClick={() => setSettings(prev => ({ ...prev, announcement_color: c.v }))}
                className={`${c.c} text-white text-xs px-3 py-1.5 rounded-lg transition ${settings['announcement_color'] === c.v ? 'ring-2 ring-white/50' : 'opacity-60 hover:opacity-100'}`}>
                {c.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`border rounded-xl p-5 ${card}`}>
        <div className={sectionTitle}>🔧 Texnik holat</div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            className={`relative w-11 h-6 rounded-full transition-colors ${settings['maintenance_mode'] === 'true' ? 'bg-red-600' : 'bg-gray-700'}`}
            onClick={() => setSettings(prev => ({ ...prev, maintenance_mode: prev.maintenance_mode === 'true' ? 'false' : 'true' }))}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings['maintenance_mode'] === 'true' ? 'left-6' : 'left-1'}`}/>
          </div>
          <div>
            <div className={`text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>Texnik ishlar rejimi (Maintenance Mode)</div>
            <div className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-400'}`}>Yoqilsa, saytga kirish cheklanadi</div>
          </div>
        </label>
      </div>

      <button type="submit" disabled={settingsSaving}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition">
        {settingsSaving ? 'Saqlanmoqda...' : '💾 Barcha sozlamalarni saqlash'}
      </button>
    </form>
  )
}
