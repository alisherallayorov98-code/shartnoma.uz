'use client'

import ResultActions from '../ResultActions'

type XatarItem = { daraja: string; tavsif: string }

export function TahlilResult({
  baho, umumiy, kuchli_tomonlar, zaif_tomonlar, yuridik_xatarlar, tavsiyalar,
  hubContract, hasContractContent, onTuzatish, setPreviewText, onSave,
}: {
  baho: string; umumiy: string
  kuchli_tomonlar?: string[]; zaif_tomonlar?: string[]
  yuridik_xatarlar?: XatarItem[]; tavsiyalar?: string[]
  hubContract: string; hasContractContent: boolean
  onTuzatish: () => void
  setPreviewText: (v: string) => void
  onSave: (t: string) => void
}) {
  const bahoClass =
    baho === 'A' ? { wrap: 'bg-emerald-900/40 border-emerald-700', text: 'text-emerald-400' } :
    baho === 'B' ? { wrap: 'bg-blue-900/40 border-blue-700',       text: 'text-blue-400'    } :
    baho === 'C' ? { wrap: 'bg-yellow-900/40 border-yellow-700',   text: 'text-yellow-400'  } :
                   { wrap: 'bg-red-900/40 border-red-700',         text: 'text-red-400'     }
  return (
    <div className="space-y-3">
      <div className={`rounded-xl p-4 border flex items-center gap-3 ${bahoClass.wrap}`}>
        <span className={`text-4xl font-black ${bahoClass.text}`}>{baho}</span>
        <div className="text-gray-200 text-sm">{umumiy}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(kuchli_tomonlar?.length ?? 0) > 0 && (
          <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-3">
            <div className="text-xs text-emerald-400 mb-1.5">✅ Kuchli tomonlar</div>
            {kuchli_tomonlar!.map((s, i) => <div key={i} className="text-xs text-gray-200">• {s}</div>)}
          </div>
        )}
        {(zaif_tomonlar?.length ?? 0) > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-3">
            <div className="text-xs text-yellow-400 mb-1.5">⚠️ Zaif tomonlar</div>
            {zaif_tomonlar!.map((s, i) => <div key={i} className="text-xs text-gray-200">• {s}</div>)}
          </div>
        )}
      </div>
      {yuridik_xatarlar?.map((x, i) => (
        <div key={i} className="flex items-start gap-2 bg-[#0F172A] border border-[#1E293B] rounded-xl p-3">
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${x.daraja.match(/yuqori|высок|юқори/i) ? 'bg-red-900 text-red-300' : x.daraja.match(/rta|редний|ўрта/i) ? 'bg-yellow-900 text-yellow-300' : 'bg-[#1F2937] text-gray-200'}`}>{x.daraja}</span>
          <span className="text-gray-200 text-sm">{x.tavsif}</span>
        </div>
      ))}
      {tavsiyalar?.map((s, i) => <div key={i} className="text-gray-200 text-sm">• {s}</div>)}
      <ResultActions
        text={[
          `Baho: ${baho}`, umumiy,
          (kuchli_tomonlar?.length ?? 0) > 0 ? `\nKuchli tomonlar:\n${kuchli_tomonlar!.map(s => '• ' + s).join('\n')}` : '',
          (zaif_tomonlar?.length ?? 0) > 0 ? `\nZaif tomonlar:\n${zaif_tomonlar!.map(s => '• ' + s).join('\n')}` : '',
          (yuridik_xatarlar?.length ?? 0) > 0 ? `\nYuridik xatarlar:\n${yuridik_xatarlar!.map(x => `[${x.daraja}] ${x.tavsif}`).join('\n')}` : '',
          (tavsiyalar?.length ?? 0) > 0 ? `\nTavsiyalar:\n${tavsiyalar!.map(s => '• ' + s).join('\n')}` : '',
        ].filter(Boolean).join('\n')}
        label="tahlil" onPreview={setPreviewText} onSave={onSave}
      />
      {hubContract && hasContractContent && (
        <button onClick={onTuzatish}
          className="w-full py-2.5 rounded-xl text-sm font-semibold border border-orange-600/50 text-orange-400 hover:bg-orange-900/20 transition">
          🔧 Ushbu kamchiliklarni shartnomada tuzatish →
        </button>
      )}
    </div>
  )
}
