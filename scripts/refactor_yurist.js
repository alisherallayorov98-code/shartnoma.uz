const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'app/dashboard/yurist/page.tsx');
let c = fs.readFileSync(filePath, 'utf8');

// 1. setHubResult — _type qo'shish
c = c.replace(
  'setHubResult(result)',
  "setHubResult({ _type: hubFeature, ...result } as HubResult)"
);

// 2. Result section: hubFeature === 'xxx' → hubResult._type === 'xxx'
const features = ['xulosa','tarjima','grammatika','tahlil','qa','clause','recommend','write'];
for (const f of features) {
  // Replace in result rendering section (after "Result" comment)
  c = c.replace(
    new RegExp(`\\{hubFeature === '${f}'`, 'g'),
    `{hubResult._type === '${f}'`
  );
}

// 3. ResultActions komponenti — export oldiga qo'shish
const resultActionsComponent = `
// ─── ResultActions: download/copy/save tugmalari ─────────────────────────────
function ResultActions({
  text, label, saveName, onPreview, toast,
}: {
  text: string; label: string; saveName: string
  onPreview: (t: string) => void
  toast: (msg: string, type: 'success' | 'error') => void
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={() => onPreview(text)}
        className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">
        👁 Ko&apos;rish
      </button>
      <button onClick={() => downloadTextAsWord(text, label)}
        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">
        📝 Word
      </button>
      <button onClick={() => downloadTextAsPDF(text, label)}
        className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">
        📄 PDF
      </button>
      <button onClick={() => navigator.clipboard.writeText(text)}
        className="text-xs text-gray-500 hover:text-gray-300 transition">
        📋 Nusxa
      </button>
      <button onClick={() => { saveAiResult(saveName, text); toast('Saqlandi!', 'success') }}
        className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">
        💾 Saqlash
      </button>
    </div>
  )
}

`;

c = c.replace('export default function YuristPage()', resultActionsComponent + 'export default function YuristPage()');

// 4. xulosa result — tugmalar blokini ResultActions bilan almashtirish
c = c.replace(
  `                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setPreviewText(String(hubResult.xulosa || ''))}
                    className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">👁 Ko&apos;rish</button>
                  <button onClick={() => downloadTextAsWord(String(hubResult.xulosa || ''), 'xulosa')}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">📝 Word</button>
                  <button onClick={() => downloadTextAsPDF(String(hubResult.xulosa || ''), 'xulosa')}
                    className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">📄 PDF</button>
                  <button onClick={() => navigator.clipboard.writeText(String(hubResult.xulosa || ''))}
                    className="text-xs text-gray-500 hover:text-gray-300 transition">📋 Nusxa</button>
                  <button onClick={() => { saveAiResult('Yurist xulosa', String(hubResult.xulosa || '')); toast('Saqlandi!', 'success') }}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">💾 Saqlash</button>
                </div>`,
  `                <ResultActions text={hubResult.xulosa} label="xulosa" saveName="Yurist xulosa" onPreview={setPreviewText} toast={toast} />`
);

// 5. tarjima result — tugmalar blokini ResultActions bilan almashtirish
c = c.replace(
  `                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setPreviewText(String(hubResult.tarjima || ''))}
                      className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">👁 Ko&apos;rish</button>
                    <button onClick={() => downloadTextAsWord(String(hubResult.tarjima || ''), 'tarjima')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">📝 Word</button>
                    <button onClick={() => downloadTextAsPDF(String(hubResult.tarjima || ''), 'tarjima')}
                      className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">📄 PDF</button>
                    <button onClick={() => navigator.clipboard.writeText(String(hubResult.tarjima || ''))}
                      className="text-xs text-gray-500 hover:text-gray-300 transition">📋 Nusxa</button>
                    <button onClick={() => { saveAiResult('Tarjima', String(hubResult.tarjima || '')); toast('Saqlandi!', 'success') }}
                      className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">💾 Saqlash</button>
                  </div>`,
  `                  <ResultActions text={hubResult.tarjima} label="tarjima" saveName="Tarjima" onPreview={setPreviewText} toast={toast} />`
);

// 6. clause result — tugmalar blokini ResultActions bilan almashtirish
c = c.replace(
  `                <div className="flex gap-2 mt-3 flex-wrap">
                  <button onClick={() => setPreviewText(String(hubResult.band || ''))}
                    className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">👁 Ko&apos;rish</button>
                  <button onClick={() => downloadTextAsWord(String(hubResult.band || ''), 'band')}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">📝 Word</button>
                  <button onClick={() => downloadTextAsPDF(String(hubResult.band || ''), 'band')}
                    className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">📄 PDF</button>
                  <button onClick={() => navigator.clipboard.writeText(String(hubResult.band || ''))}
                    className="text-xs text-gray-500 hover:text-gray-300 transition">📋 Nusxa</button>
                  <button onClick={() => { saveAiResult('Yuridik band', String(hubResult.band || '')); toast('Saqlandi!', 'success') }}
                    className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">💾 Saqlash</button>
                </div>`,
  `                <div className="mt-3"><ResultActions text={hubResult.band} label="band" saveName="Yuridik band" onPreview={setPreviewText} toast={toast} /></div>`
);

// 7. write result — tugmalar blokini ResultActions bilan almashtirish
c = c.replace(
  `                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setPreviewText(String(hubResult.shartnoma || ''))}
                      className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">👁 Ko&apos;rish</button>
                    <button onClick={() => downloadTextAsWord(String(hubResult.shartnoma || ''), 'shartnoma')}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg font-semibold transition">📝 Word</button>
                    <button onClick={() => downloadTextAsPDF(String(hubResult.shartnoma || ''), 'shartnoma')}
                      className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-2.5 py-1 rounded-lg transition">📄 PDF</button>
                    <button onClick={() => navigator.clipboard.writeText(String(hubResult.shartnoma || ''))}
                      className="text-xs text-gray-400 hover:text-gray-200">📋 Nusxa</button>
                    <button onClick={() => { saveAiResult('AI shartnoma', String(hubResult.shartnoma || '')); toast('Saqlandi!', 'success') }}
                      className="text-xs bg-green-700 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg transition">💾 Saqlash</button>
                  </div>`,
  `                  <ResultActions text={hubResult.shartnoma} label="shartnoma" saveName="AI shartnoma" onPreview={setPreviewText} toast={toast} />`
);

fs.writeFileSync(filePath, c, 'utf8');
console.log('Done');
