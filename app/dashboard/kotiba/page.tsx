'use client'

import { useState } from 'react'
import { useDashboard } from '../context'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { fetchAi } from '@/lib/fetchAi'
import { saveAiDocument } from '@/lib/aiDocuments'
import { downloadRasmiyXatWord, downloadFirmenniyBlank } from '@/lib/downloadUtils'
import dynamic from 'next/dynamic'
import SavedDocumentsPanel from '../_components/SavedDocumentsPanel'
import HujjatResult from '../_components/HujjatResult'
import FeatureCards from './_components/FeatureCards'
import DocFormFields from './_components/DocFormFields'
import { FEATURES, type KotibaFeature } from './_config/features'

const BayonnomaMaker    = dynamic(() => import('./_components/BayonnomaMaker'),    { ssr: false })
const BuyruqMaker       = dynamic(() => import('./_components/BuyruqMaker'),       { ssr: false })
const RekvizitlarViewer = dynamic(() => import('./_components/RekvizitlarViewer'), { ssr: false })

export default function KotibaPage() {
  const { activeOrg, hasAiAccess, isFree, openUpgradeModal, cps } = useDashboard()
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const [selected, setSelected] = useState<KotibaFeature | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedKey, setSavedKey] = useState(0)
  const [cpSearch, setCpSearch] = useState<Record<string, string>>({})
  const [cpOpen, setCpOpen] = useState<string | null>(null)

  const currentFeature = FEATURES.find(f => f.key === selected)

  function selectFeature(key: KotibaFeature) {
    if (key === 'firmenniy_blank') {
      if (!activeOrg) return
      downloadFirmenniyBlank({
        orgName: activeOrg.name,
        orgInn: activeOrg.inn,
        orgDirector: activeOrg.director_name,
        orgBankName: activeOrg.bank_name,
        orgBankAccount: activeOrg.bank_account,
        orgMfo: activeOrg.mfo,
        orgAddress: activeOrg.address,
      })
      return
    }
    if (key === 'tashkilot_rekvizitlari') {
      setSelected(key); setResult(null); setError('')
      return
    }
    const defaults: Record<string, string> = {}
    if (key === 'rasmiy_xat') defaults.sana = new Date().toISOString().slice(0, 10)
    setSelected(key); setFormData(defaults); setResult(null); setError('')
    setCpSearch({}); setCpOpen(null)
  }

  async function handleGenerate() {
    if (!currentFeature) return
    if (isFree) { openUpgradeModal(); return }
    if (!hasAiAccess()) { openUpgradeModal(); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetchAi({
        type: currentFeature.apiType,
        data: { ...formData, tashkilot: activeOrg?.name || '', tashkilot_inn: activeOrg?.inn || '', direktor: activeOrg?.director_name || '' },
      })
      const data = await res.json()
      if (data.error === 'premium_required') { openUpgradeModal(); return }
      if (!res.ok || data.error) { setError(data.error || 'Xatolik yuz berdi'); return }
      const text = data.result?.[currentFeature.resultField]
        || data.result?.bayonnoma || data.result?.xat || data.result?.taklifnoma
        || data.result?.hisobot || data.result?.eslatma || data.result?.murojaatnoma
        || data.result?.tushuntirish || JSON.stringify(data.result, null, 2)
      setResult(text)
      if (text && activeOrg) {
        saveAiDocument({ organization_id: activeOrg.id, section: 'kotiba', feature_key: selected!, title: currentFeature.title, content: text, meta: {} })
          .then(() => setSavedKey(k => k + 1)).catch(console.error)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <main className="flex-1 overflow-auto p-4 sm:p-6 bg-[#0B1220] min-h-screen">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 border border-blue-600/30 rounded-xl flex items-center justify-center text-xl">🤖</div>
            <div>
              <h1 className="text-xl font-bold text-white">{T({ uz: 'Kotiba AI', oz: 'Котиба AI', ru: 'Секретарь AI' })}</h1>
              <p className="text-gray-500 text-sm">{T({ uz: 'Rasmiy hujjatlarni AI yordamida bir zumda tayyorlang', oz: 'Расмий ҳужжатларни AI ёрдамида бир зумда тайёрланг', ru: 'Готовьте официальные документы мгновенно с помощью AI' })}</p>
            </div>
          </div>
          {(isFree || !hasAiAccess()) && (
            <button onClick={openUpgradeModal}
              className={`text-white text-sm font-semibold px-4 py-2 rounded-lg transition ${isFree ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isFree ? T(t.aiPage.getSubBtn) : T(t.aiPage.getAiProBtn)}
            </button>
          )}
        </div>

        {/* Banners */}
        {isFree && (
          <div className="bg-orange-600/10 border border-orange-600/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-white font-semibold text-sm mb-0.5">{T(t.aiPage.subRequired)}</div>
              <div className="text-gray-400 text-xs">{T({ uz: 'Kotiba hujjatlarini yaratish Standart yoki AI Pro tarifida ishlaydi', oz: 'Котиба ҳужжатларини яратиш Стандарт ёки AI Pro тарифида ишлайди', ru: 'Создание документов Котиба — тарифы Стандарт или AI Pro' })}</div>
            </div>
            <button onClick={openUpgradeModal}
              className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
              {T(t.aiPage.getSubBtn)}
            </button>
          </div>
        )}
        {!isFree && !hasAiAccess() && (
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-white font-semibold text-sm mb-0.5">{T(t.aiPage.aiProTitle)}</div>
              <div className="text-gray-400 text-xs">{T({ uz: 'Barcha kotiba hujjatlari Kabinetim AI yordamida bir zumda tayyorlanadi', oz: 'Барча котиба ҳужжатлари Kabinetim AI ёрдамида бир зумда тайёрланади', ru: 'Все документы Котиба готовятся мгновенно с помощью Kabinetim AI' })}</div>
            </div>
            <button onClick={openUpgradeModal}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
              {T(t.aiPage.getAiProBtn)}
            </button>
          </div>
        )}

        {/* Feature cards */}
        {!selected && <FeatureCards features={FEATURES} onSelect={selectFeature} />}

        {/* Form panel */}
        {selected && currentFeature && (
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1E293B] bg-[#111827]">
              <button onClick={() => { setSelected(null); setResult(null); setError('') }}
                className="text-gray-500 hover:text-white text-sm flex items-center gap-1.5 transition">
                {T(t.aiPage.back)}
              </button>
              <div className="w-px h-4 bg-[#1E293B]"/>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentFeature.icon}</span>
                <h2 className="font-semibold text-white text-sm">{currentFeature.title}</h2>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {selected === 'bayonnoma' ? (
                <BayonnomaMaker
                  orgName={activeOrg?.name || ''} orgInn={activeOrg?.inn || ''} direktorName={activeOrg?.director_name || ''}
                  onSaved={() => setSavedKey(k => k + 1)}
                />
              ) : selected === 'tashkilot_rekvizitlari' ? (
                activeOrg
                  ? <RekvizitlarViewer org={activeOrg} />
                  : <p className="text-gray-400 text-sm">{T(t.aiPage.errorNoOrg)}</p>
              ) : selected === 'buyruq' ? (
                <BuyruqMaker
                  orgName={activeOrg?.name || ''} orgDirector={activeOrg?.director_name || ''}
                  onSaved={() => setSavedKey(k => k + 1)}
                />
              ) : (
                <>
                  <DocFormFields
                    feature={currentFeature}
                    formData={formData}
                    setFormData={setFormData}
                    cpSearch={cpSearch}
                    setCpSearch={setCpSearch}
                    cpOpen={cpOpen}
                    setCpOpen={setCpOpen}
                    cps={cps}
                  />

                  {activeOrg && (
                    <div className="bg-[#111827] border border-[#1E293B] rounded-xl px-4 py-2.5 text-xs text-gray-400 flex items-center gap-2">
                      <span className="text-base">🏢</span>
                      <span className="text-white font-medium">{activeOrg.name}</span>
                      <span className="text-gray-600">·</span>
                      <span>{activeOrg.director_name}</span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-2.5 text-sm text-red-300 flex items-center gap-2">
                      <span>⚠</span> {error}
                    </div>
                  )}

                  <button onClick={handleGenerate} disabled={loading}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-[#1F2937] disabled:text-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
                    {loading ? (
                      <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>{T(t.aiPage.preparing)}</>
                    ) : <>{T(t.aiPage.generateAi)}</>}
                  </button>
                </>
              )}

              {result && (
                <div className="border-t border-[#1E293B] pt-5 space-y-3">
                  <HujjatResult
                    result={result}
                    title={currentFeature?.title || 'hujjat'}
                    copied={copied}
                    onCopy={handleCopy}
                  />
                  {selected === 'rasmiy_xat' && activeOrg && (
                    <button
                      onClick={() => downloadRasmiyXatWord({
                        orgName: activeOrg.name,
                        orgInn: activeOrg.inn,
                        orgDirector: activeOrg.director_name,
                        orgBankName: activeOrg.bank_name,
                        orgAddress: activeOrg.address,
                        xatRaqami: formData.xat_raqami,
                        sana: formData.sana,
                        kimga: formData.kim_uchun,
                        mavzu: formData.mavzu,
                        body: result,
                        filename: `Rasmiy_xat_${formData.xat_raqami || new Date().toISOString().slice(0,10)}`,
                      })}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      {T({ uz: '🏢 Firmenniy blank (Word)', oz: '🏢 Фирменний бланк (Word)', ru: '🏢 Фирменный бланк (Word)' })}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeOrg && (
          <SavedDocumentsPanel orgId={activeOrg.id} section="kotiba" accentColor="blue" refreshKey={savedKey} />
        )}
      </div>
    </main>
  )
}
