'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, type Lang } from '@/lib/i18n'
import { useDashboard } from '../context'
import { downloadTextAsWord } from '@/lib/downloadUtils'
import { saveAiDocument } from '@/lib/aiDocuments'
import { fetchAi } from '@/lib/fetchAi'
import { useToast } from '@/lib/toast'
import { CONTRACT_TYPES_I18N } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import SavedDocumentsPanel from '../_components/SavedDocumentsPanel'
import AiProgressIndicator from '../_components/AiProgressIndicator'
import ContractSelector from './_components/ContractSelector'
import { TarjimaInput, TarjimaResult } from './_components/features/TarjimaFeature'
import { QaInput, QaResult } from './_components/features/QaFeature'
import { ClauseInput, ClauseResult } from './_components/features/ClauseFeature'
import { RecommendInput, RecommendResult } from './_components/features/RecommendFeature'
import { XulosaResult } from './_components/features/XulosaFeature'
import { GrammatikResult } from './_components/features/GrammatikFeature'
import { TahlilResult } from './_components/features/TahlilFeature'
import { WriteInput, WriteResult } from './_components/features/WriteFeature'
import { TuzatishInput, TuzatishResult } from './_components/features/TuzatishFeature'

type HubFeature = 'xulosa' | 'tarjima' | 'grammatika' | 'tahlil' | 'qa' | 'clause' | 'recommend' | 'write' | 'tuzatish'

// ─── Typed results per feature ────────────────────────────────────────────────
type XulosaData    = { xulosa: string; asosiy_shartlar?: string[]; muddat?: string; summa?: string; muhim_bandlar?: string[] }
type TarjimaData   = { tarjima: string }
type GrammatikData = { xatolar_soni?: number; umumiy_baho?: string; xatolar: { xato: string; togri: string; izoh: string }[] }
type TahlilData    = { baho: string; umumiy: string; kuchli_tomonlar?: string[]; zaif_tomonlar?: string[]; yuridik_xatarlar?: { daraja: string; tavsif: string }[]; tavsiyalar?: string[] }
type QaData        = { javob: string; havola?: string }
type ClauseData    = { band: string; band_nomi?: string }
type RecommendData = { tur?: string; tur_nomi?: string; tavsiya: string; sabab?: string; qoshimcha_maslahat?: string }
type WriteData     = { shartnoma: string; bandlar_soni?: number }
type TuzatishData  = { tuzatilgan_shartnoma: string; ozgartirishlar: { original: string; fixed: string; izoh: string }[]; ozgartirishlar_soni?: number; umumiy_baho?: string }

type HubResult =
  | ({ _type: 'xulosa' }    & XulosaData)
  | ({ _type: 'tarjima' }   & TarjimaData)
  | ({ _type: 'grammatika'} & GrammatikData)
  | ({ _type: 'tahlil' }    & TahlilData)
  | ({ _type: 'qa' }        & QaData)
  | ({ _type: 'clause' }    & ClauseData)
  | ({ _type: 'recommend' } & RecommendData)
  | ({ _type: 'write' }     & WriteData)
  | ({ _type: 'tuzatish' } & TuzatishData)

const FEATURES: { key: HubFeature; icon: string; name: Record<Lang, string>; desc: Record<Lang, string>; needsContract: boolean; premiumOnly: boolean }[] = [
  { key: 'xulosa',     icon: '📝',
    name: { uz: 'Xulosa',          oz: 'Хулоса',           ru: 'Резюме' },
    desc: { uz: "Shartnomaning asosiy shartlarini qisqacha bayon qiladi", oz: "Шартноманинг асосий шартларини қисқача баён қилади", ru: "Кратко излагает основные условия договора" },
    needsContract: true,  premiumOnly: false },
  { key: 'tarjima',    icon: '🌐',
    name: { uz: 'Tarjima',          oz: 'Таржима',           ru: 'Перевод' },
    desc: { uz: "Shartnomani boshqa tilga professional tarjima qiladi", oz: "Шартномани бошқа тилга профессионал таржима қилади", ru: "Профессионально переводит договор на другой язык" },
    needsContract: true,  premiumOnly: false },
  { key: 'grammatika', icon: '✏️',
    name: { uz: 'Grammatika',       oz: 'Грамматика',        ru: 'Грамматика' },
    desc: { uz: "Matnidagi imlo, grammatika va uslub xatolarini topadi", oz: "Матнидаги имло, грамматика ва услуб хатоларини топади", ru: "Находит орфографические, грамматические и стилистические ошибки" },
    needsContract: true,  premiumOnly: false },
  { key: 'tahlil',     icon: '📊',
    name: { uz: 'Chuqur tahlil',    oz: 'Чуқур таҳлил',      ru: 'Глубокий анализ' },
    desc: { uz: "Yuridik xatarlar, zaif tomonlar va baho (A-D)", oz: "Юридик хатарлар, заиф томонлар ва баҳо (A-D)", ru: "Юридические риски, слабые стороны и оценка (A-D)" },
    needsContract: true,  premiumOnly: true  },
  { key: 'qa',         icon: '💬',
    name: { uz: 'Savol-Javob',      oz: 'Савол-Жавоб',       ru: 'Вопрос-Ответ' },
    desc: { uz: "Shartnoma haqida istalgan savolga javob beradi", oz: "Шартнома ҳақида исталган саволга жавоб беради", ru: "Отвечает на любой вопрос по договору" },
    needsContract: true,  premiumOnly: true  },
  { key: 'clause',     icon: '➕',
    name: { uz: "Band qo'shish",    oz: 'Банд қўшиш',        ru: 'Добавить пункт' },
    desc: { uz: "Ko'rsatma asosida yangi band yozib beradi", oz: "Кўрсатма асосида янги банд ёзиб беради", ru: "Составляет новый пункт по инструкции" },
    needsContract: false, premiumOnly: true  },
  { key: 'recommend',  icon: '🎯',
    name: { uz: 'Tur tavsiyasi',    oz: 'Тур тавсияси',      ru: 'Тип договора' },
    desc: { uz: "Vaziyatni ta'riflang — qaysi shartnoma turi mos ekanini aytadi", oz: "Вазиятни таърифланг — қайси шартнома тури мос эканини айтади", ru: "Опишите ситуацию — подскажет подходящий тип договора" },
    needsContract: false, premiumOnly: false },
  { key: 'write',      icon: '✍️',
    name: { uz: 'Shartnoma yoz',    oz: 'Шартнома ёз',       ru: 'Написать договор' },
    desc: { uz: "Ma'lumotlar asosida to'liq shartnoma matnini yozadi", oz: "Маълумотлар асосида тўлиқ шартнома матнини ёзади", ru: "Составляет полный текст договора на основе данных" },
    needsContract: false, premiumOnly: true  },
  { key: 'tuzatish',   icon: '📎',
    name: { uz: 'Tuzatish',         oz: 'Тузатиш',           ru: 'Исправление' },
    desc: { uz: "Tashqaridan kelgan shartnomani tahlil qilib, kamchiliklarini bartaraf etadi", oz: "Ташқаридан келган шартномани таҳлил қилиб, камчиликларини бартараф этади", ru: "Анализирует и исправляет недостатки во внешнем договоре" },
    needsContract: false, premiumOnly: true  },
]

export default function YuristPage() {
  const { lang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)
  const { toast } = useToast()
  const { contracts, activeOrg, cps, hasAiAccess, subscription, openUpgradeModal, reloadContracts } = useDashboard()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [hubFeature, setHubFeature] = useState<HubFeature>(() => {
    const f = searchParams.get('f') as HubFeature | null
    return (f && ['xulosa','tarjima','tahlil','grammatika','qa','clause','recommend','write','tuzatish'].includes(f)) ? f : 'xulosa'
  })
  const [hubContract, setHubContract] = useState('')
  const [hubTargetLang, setHubTargetLang] = useState('oz')
  const [hubQuestion, setHubQuestion] = useState('')
  const [hubInstruction, setHubInstruction] = useState('')
  const [hubDescription, setHubDescription] = useState('')
  const [hubWriteDetails, setHubWriteDetails] = useState({ tur: 'oldi_sotdi', summa: '', org: '', cp: '', extra: '', shartnoma_raqam: '', sana: '' })
  const [writeCpSearch, setWriteCpSearch] = useState('')
  const [writeCpOpen, setWriteCpOpen] = useState(false)
  const [hubCp, setHubCp] = useState('')
  const [hubLoading, setHubLoading] = useState(false)
  const [hubResult, setHubResult] = useState<HubResult | null>(null)
  const [hubError, setHubError] = useState('')
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [addingClause, setAddingClause] = useState(false)
  const [fixContent, setFixContent] = useState('')
  const [fixFileName, setFixFileName] = useState('')
  const [fixFileLoading, setFixFileLoading] = useState(false)
  const [fixEditedText, setFixEditedText] = useState('')
  const [fixEditMode, setFixEditMode] = useState(false)
  const [savedPanelKey, setSavedPanelKey] = useState(0)
  const [saveContractModal, setSaveContractModal] = useState<{ content: string; tur: string; raqam: string; sana: string } | null>(null)
  const [saveContractCp, setSaveContractCp] = useState('')
  const [saveContractLoading, setSaveContractLoading] = useState(false)

  function selectFeature(f: HubFeature) {
    setHubFeature(f); setHubResult(null); setHubError(''); setHubLoading(false)
    router.push(`/dashboard/yurist?f=${f}`, { scroll: false })
  }

  // Handle ?cid param (from contract view page "AI Tahlil" button)
  useEffect(() => {
    const cid = searchParams.get('cid')
    if (cid) setHubContract(cid)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const contractList = contracts.filter(c => c.organization_id === activeOrg?.id)

  async function addClauseToContract(clauseText: string) {
    if (!hubContract) return
    const contract = contracts.find(c => c.id === hubContract)
    if (!contract) return
    setAddingClause(true)
    try {
      const newContent = (contract.content || '') + '\n\n' + clauseText
      const { error } = await supabase.from('contracts').update({ content: newContent }).eq('id', hubContract)
      if (error) { toast(error.message, 'error'); return }
      toast(T(t.yuristPage.clauseAddedMsg), 'success')
      reloadContracts()
    } finally {
      setAddingClause(false)
    }
  }

  async function handleFileUpload(file: File) {
    setFixFileName(file.name)
    setFixContent('')
    setHubResult(null)
    setHubError('')
    const name = file.name.toLowerCase()
    if (name.endsWith('.txt')) {
      const text = await file.text()
      setFixContent(text)
      return
    }
    if (name.endsWith('.docx')) {
      setFixFileLoading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/extract-text', { method: 'POST', body: fd, headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} })
        const data = await res.json()
        if (data.error) { setHubError(data.error); return }
        setFixContent(data.text)
      } catch {
        setHubError("Faylni o'qishda xatolik")
      } finally {
        setFixFileLoading(false)
      }
      return
    }
    setHubError(".txt yoki .docx fayl yuklang")
  }

  async function saveToDb(featureKey: string, title: string, content: string) {
    if (!activeOrg?.id) { toast(T(t.aiPage.errorNoOrg), 'error'); return }
    const result = await saveAiDocument({
      organization_id: activeOrg.id,
      section: 'yurist',
      feature_key: featureKey,
      title,
      content,
      meta: {},
    })
    if (result) { toast(T(t.yuristPage.savedMsg), 'success'); setSavedPanelKey(k => k + 1) }
    else toast(T(t.yuristPage.saveErrorMsg), 'error')
  }

  async function runTuzatishDirect(contractContent: string) {
    if (!hasAiAccess()) { openUpgradeModal(); return }
    setHubFeature('tuzatish')
    setFixContent(contractContent)
    setFixFileName('tizimdan_shartnoma.txt')
    setHubResult(null)
    setHubError('')
    setFixEditMode(false)
    setHubLoading(true)
    try {
      const res  = await fetchAi({ type: 'tuzatish', lang, content: contractContent })
      const data = await res.json()
      if (data.error === 'premium_required') { openUpgradeModal(); return }
      if (!res.ok || data.error) { setHubError(data.error || 'Xatolik'); return }
      const result = data.result
      if (!result || typeof result !== 'object') { setHubError("AI bo'sh natija qaytardi."); return }
      setHubResult({ _type: 'tuzatish', ...result } as HubResult)
      setFixEditedText((result as TuzatishData).tuzatilgan_shartnoma || '')
    } catch {
      setHubError('Serverga ulanishda xatolik')
    } finally {
      setHubLoading(false)
    }
  }

  async function saveContractToSystem() {
    if (!saveContractModal || !activeOrg?.id) return
    setSaveContractLoading(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('contracts').insert({
        organization_id: activeOrg.id,
        counterparty_id: saveContractCp || null,
        contract_type: saveContractModal.tur || 'boshqa',
        contract_number: saveContractModal.raqam || `AI-${Date.now()}`,
        contract_date: saveContractModal.sana || today,
        amount: 0,
        status: 'draft',
        content: saveContractModal.content,
        user_id: user?.id,
      })
      if (error) { toast(error.message, 'error'); return }
      toast(T({ uz: 'Shartnoma tizimga saqlandi!', oz: 'Шартнома тизимга сақланди!', ru: 'Договор сохранён в систему!' }), 'success')
      setSaveContractModal(null)
      setSaveContractCp('')
      reloadContracts()
    } finally {
      setSaveContractLoading(false)
    }
  }

  const cpOptions = Array.from(
    new Map(contractList.map(c => [c.counterparty_id, c.counterparties?.name || '—'])).entries()
  ).filter(([id, name]) => id && name !== '—') as [string, string][]

  const filteredBycp = hubCp ? contractList.filter(c => c.counterparty_id === hubCp) : contractList

  const sel = FEATURES.find(f => f.key === hubFeature)!
  const canUse = hasAiAccess()

  async function runHubFeature() {
    if (!hasAiAccess()) { openUpgradeModal(); return }
    const selectedContract = contracts.find(c => c.id === hubContract)
    const content = hubFeature === 'tuzatish' ? fixContent : (selectedContract?.content || '')
    const needsContract = ['tahlil', 'grammatika', 'xulosa', 'tarjima', 'qa'].includes(hubFeature)
    if (needsContract && !content.trim()) {
      setHubError("Shartnomani tanlang yoki uning matni bo'sh. Avval shartnoma yaratib, matn kiriting.")
      return
    }
    if (hubFeature === 'tuzatish' && !fixContent.trim()) {
      setHubError("Avval shartnoma faylini yuklang yoki matnni yapishtirib qo'ying.")
      return
    }
    if (hubFeature === 'qa' && !hubQuestion.trim()) { setHubError("Iltimos, savolingizni kiriting."); return }
    if (hubFeature === 'clause' && !hubInstruction.trim()) { setHubError("Iltimos, band uchun ko'rsatma kiriting."); return }
    if (hubFeature === 'recommend' && !hubDescription.trim()) { setHubError("Iltimos, vaziyatni ta'riflang."); return }

    setHubLoading(true); setHubError(''); setHubResult(null)
    try {
      const typeMap: Record<HubFeature, string> = {
        tahlil: 'analysis', grammatika: 'grammar', xulosa: 'summary',
        tarjima: 'translate', qa: 'qa', clause: 'clause', recommend: 'recommend', write: 'write', tuzatish: 'tuzatish',
      }
      const body: Record<string, unknown> = { type: typeMap[hubFeature], lang, content }
      if (hubFeature === 'qa')        body.question    = hubQuestion
      if (hubFeature === 'clause')    body.instruction = hubInstruction
      if (hubFeature === 'tarjima')   body.target_lang = hubTargetLang
      if (hubFeature === 'recommend') { body.description = hubDescription; delete body.content }
      if (hubFeature === 'write') {
        const selectedCp = cps.find(c => c.name === hubWriteDetails.cp)
        body.details = {
          ...hubWriteDetails,
          org: activeOrg?.name || hubWriteDetails.org,
          org_inn: activeOrg?.inn || '',
          org_director: activeOrg?.director_name || '',
          org_bank: activeOrg?.bank_name || '',
          org_mfo: activeOrg?.mfo || '',
          org_address: activeOrg?.address || '',
          cp_inn: selectedCp?.inn || '',
          cp_director: selectedCp?.director_name || '',
          cp_bank: selectedCp?.bank_name || '',
          cp_mfo: selectedCp?.mfo || '',
          cp_address: selectedCp?.address || '',
        }
        delete body.content
      }
      const res  = await fetchAi(body)
      const data = await res.json()
      if (data.error === 'premium_required') { openUpgradeModal(); return }
      if (!res.ok || data.error) { setHubError(data.error || 'Xatolik'); return }
      const result = data.result
      if (!result || typeof result !== 'object' || Object.keys(result).length === 0) {
        setHubError("AI bo'sh natija qaytardi. Qayta urinib ko'ring.")
        return
      }
      setHubResult({ _type: hubFeature, ...result } as HubResult)
      if (hubFeature === 'tuzatish') setFixEditedText((result as TuzatishData).tuzatilgan_shartnoma || '')
    } catch {
      setHubError('Serverga ulanishda xatolik')
    } finally {
      setHubLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">{T(t.yuristPage.title)}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{T(t.yuristPage.subtitle)}</p>
        </div>
        {!hasAiAccess() ? (
          <button onClick={openUpgradeModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
            {T(t.yuristPage.getProBtn)}
          </button>
        ) : (
          <span className="text-xs bg-blue-600/10 border border-blue-600/30 text-blue-400 px-3 py-1.5 rounded-xl font-medium">
            ⭐ {subscription?.plan === 'ai_pro' ? 'AI Pro' : subscription?.plan === 'standard' ? 'Standart' : 'Premium'} — {T(t.yuristPage.unlimitedBadge)}
          </span>
        )}
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {FEATURES.map(f => {
          const locked = !hasAiAccess()
          return (
            <button key={f.key}
              onClick={() => {
                if (locked) { openUpgradeModal(); return }
                selectFeature(f.key)
                if (!f.needsContract) { setHubContract(''); setHubCp('') }
                if (f.key === 'write') {
                  setHubWriteDetails(d => ({ ...d, org: activeOrg?.name || '' }))
                  setWriteCpSearch(''); setWriteCpOpen(false)
                }
              }}
              className={`relative text-left p-4 rounded-xl border transition ${
                hubFeature === f.key
                  ? 'bg-blue-600/10 border-blue-600/50 shadow-lg shadow-blue-900/20'
                  : locked
                  ? 'bg-[#111827] border-[#1E293B] opacity-60 hover:border-blue-600/40 cursor-pointer'
                  : 'bg-[#111827] border-[#1E293B] hover:border-blue-600/40'
              }`}>
              {locked && (
                <span className="absolute top-2 right-2 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">PRO</span>
              )}
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className={`text-sm font-semibold mb-1 ${hubFeature === f.key ? 'text-white' : 'text-gray-200'}`}>{T(f.name)}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{T(f.desc)}</div>
            </button>
          )
        })}
      </div>

      {/* Feature panel */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{sel.icon}</span>
          <h3 className="font-semibold text-white">{T(sel.name)}</h3>
          {!hasAiAccess() && (
            <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">{T(t.yuristPage.proBadge)}</span>
          )}
        </div>

        {/* Contract selector */}
        {sel.needsContract && (
          <ContractSelector
            lang={lang}
            contracts={filteredBycp}
            cpOptions={cpOptions}
            hubCp={hubCp}
            hubContract={hubContract}
            setHubCp={setHubCp}
            setHubContract={setHubContract}
            setHubResult={() => setHubResult(null)}
            setHubError={setHubError}
          />
        )}

        {/* Feature-specific inputs */}
        {hubFeature === 'tarjima' && (
          <TarjimaInput hubTargetLang={hubTargetLang} setHubTargetLang={setHubTargetLang} />
        )}

        {hubFeature === 'qa' && (
          <QaInput
            hubQuestion={hubQuestion}
            setHubQuestion={setHubQuestion}
            hubResult={Boolean(hubResult)}
            hubLoading={hubLoading}
            runHubFeature={runHubFeature}
            setHubResult={() => setHubResult(null)}
          />
        )}

        {hubFeature === 'clause' && (
          <ClauseInput
            lang={lang}
            hubCp={hubCp}
            setHubCp={setHubCp}
            hubContract={hubContract}
            setHubContract={setHubContract}
            setHubResult={() => setHubResult(null)}
            hubInstruction={hubInstruction}
            setHubInstruction={setHubInstruction}
            hubLoading={hubLoading}
            runHubFeature={runHubFeature}
            cpOptions={cpOptions}
            filteredContracts={filteredBycp}
          />
        )}

        {hubFeature === 'recommend' && (
          <RecommendInput hubDescription={hubDescription} setHubDescription={setHubDescription} />
        )}

        {hubFeature === 'write' && (
          <WriteInput
            lang={lang}
            hubWriteDetails={hubWriteDetails}
            setHubWriteDetails={setHubWriteDetails}
            writeCpSearch={writeCpSearch}
            setWriteCpSearch={setWriteCpSearch}
            writeCpOpen={writeCpOpen}
            setWriteCpOpen={setWriteCpOpen}
            activeOrgName={activeOrg?.name}
            activeOrgInn={activeOrg?.inn}
            cps={cps}
          />
        )}

        {hubFeature === 'tuzatish' && (
          <TuzatishInput
            fixContent={fixContent}
            setFixContent={setFixContent}
            fixFileName={fixFileName}
            fixFileLoading={fixFileLoading}
            handleFileUpload={handleFileUpload}
          />
        )}

        {/* Error */}
        {hubError && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
            <span>⚠️</span>
            <div>
              {hubError}
              {hubError.includes('premium') && (
                <button onClick={openUpgradeModal}
                  className="block mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg">
                  {T(t.yuristPage.getProBtn)}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Premium lock */}
        {!canUse && (
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-5 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <div className="text-white font-semibold mb-1">{T(t.yuristPage.proLockTitle)}</div>
            <div className="text-gray-400 text-sm mb-4">{T(t.yuristPage.proLockDesc)}</div>
            <button onClick={openUpgradeModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition">
              {T(t.yuristPage.getProBtn)}
            </button>
          </div>
        )}

        {/* Action button */}
        {canUse && !hubLoading && !hubResult && (
          <button onClick={runHubFeature} disabled={fixFileLoading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed">
            {fixFileLoading ? T(t.yuristPage.fileReading) : `${sel.icon} ${T(sel.name)} ${T(t.yuristPage.startBtn)}`}
          </button>
        )}

        {/* Loading */}
        {hubLoading && <AiProgressIndicator />}

        {/* Preview modal */}
        {previewText !== null && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewText(null)}>
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
                <h3 className="font-semibold text-white">👁 {T(t.yuristPage.previewTitle)}: {T(sel.name)}</h3>
                <button onClick={() => setPreviewText(null)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white text-gray-900 rounded-xl p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                  {previewText}
                </div>
              </div>
              <div className="px-5 py-4 border-t border-[#1E293B] flex gap-3">
                <button onClick={() => { downloadTextAsWord(previewText, T(sel.name)); setPreviewText(null) }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                  {T(t.yuristPage.downloadWord)}
                </button>
                <a href="https://www.ilovepdf.com/ru/word_to_pdf" target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 py-2.5 rounded-xl text-sm font-semibold transition text-center">
                  📄 Word→PDF
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {hubResult && !hubLoading && (
          <div className="space-y-3">
            <div className="h-px bg-[#1E293B]"/>

            {(() => {
              const sc = contracts.find(c => c.id === hubContract)
              const ctxSuffix = sc ? ` — #${sc.contract_number || sc.id.slice(0,6)}` : ''
              return <>

            {hubResult._type === 'xulosa' && (
              <XulosaResult
                xulosa={hubResult.xulosa}
                asosiy_shartlar={hubResult.asosiy_shartlar}
                muddat={hubResult.muddat}
                summa={hubResult.summa}
                muhim_bandlar={hubResult.muhim_bandlar}
                setPreviewText={setPreviewText}
                onSave={t => saveToDb('xulosa', `Xulosa${ctxSuffix}`, t)}
              />
            )}

            {hubResult._type === 'tarjima' && (
              <TarjimaResult
                tarjima={hubResult.tarjima}
                setPreviewText={setPreviewText}
                onSave={t => saveToDb('tarjima', `Tarjima${ctxSuffix}`, t)}
              />
            )}

            {hubResult._type === 'grammatika' && (
              <GrammatikResult
                xatolar_soni={hubResult.xatolar_soni}
                umumiy_baho={hubResult.umumiy_baho}
                xatolar={hubResult.xatolar}
                setPreviewText={setPreviewText}
                onSave={t => saveToDb('grammatika', `Grammatika${ctxSuffix}`, t)}
              />
            )}

            {hubResult._type === 'tahlil' && (
              <TahlilResult
                baho={hubResult.baho}
                umumiy={hubResult.umumiy}
                kuchli_tomonlar={hubResult.kuchli_tomonlar}
                zaif_tomonlar={hubResult.zaif_tomonlar}
                yuridik_xatarlar={hubResult.yuridik_xatarlar}
                tavsiyalar={hubResult.tavsiyalar}
                hubContract={hubContract}
                hasContractContent={Boolean(sc?.content?.trim())}
                onTuzatish={() => runTuzatishDirect(sc?.content || '')}
                setPreviewText={setPreviewText}
                onSave={t => saveToDb('tahlil', `Chuqur tahlil${ctxSuffix}`, t)}
              />
            )}

            {hubResult._type === 'qa' && (
              <QaResult
                javob={hubResult.javob}
                havola={hubResult.havola}
                hubQuestion={hubQuestion}
                setPreviewText={setPreviewText}
                onSave={t => saveToDb('qa', `Savol-Javob${ctxSuffix}`, t)}
              />
            )}

            {hubResult._type === 'clause' && (
              <ClauseResult
                band={hubResult.band}
                band_nomi={hubResult.band_nomi}
                hubContract={hubContract}
                addingClause={addingClause}
                addClauseToContract={addClauseToContract}
                setPreviewText={setPreviewText}
                onSave={t => saveToDb('clause', `Band qo'shish${ctxSuffix}`, t)}
              />
            )}

            {hubResult._type === 'recommend' && (
              <RecommendResult
                tur={hubResult.tur}
                tur_nomi={hubResult.tur_nomi}
                tavsiya={hubResult.tavsiya}
                sabab={hubResult.sabab}
                qoshimcha_maslahat={hubResult.qoshimcha_maslahat}
                onWriteWithTur={tur => { setHubFeature('write'); setHubWriteDetails({ ...hubWriteDetails, tur, org: activeOrg?.name || '' }); setHubResult(null) }}
                setPreviewText={setPreviewText}
                onSave={t => saveToDb('recommend', 'Tur tavsiyasi', t)}
              />
            )}

            {hubResult._type === 'write' && (
              <WriteResult
                shartnoma={hubResult.shartnoma}
                bandlar_soni={hubResult.bandlar_soni}
                tur={hubWriteDetails.tur}
                shartnoma_raqam={hubWriteDetails.shartnoma_raqam}
                sana={hubWriteDetails.sana}
                setPreviewText={setPreviewText}
                onSave={t => saveToDb('write', 'AI shartnoma', t)}
                onSaveToSystem={() => setSaveContractModal({ content: hubResult.shartnoma, tur: hubWriteDetails.tur, raqam: hubWriteDetails.shartnoma_raqam, sana: hubWriteDetails.sana })}
              />
            )}

            {hubResult._type === 'tuzatish' && (
              <TuzatishResult
                ozgartirishlar_soni={hubResult.ozgartirishlar_soni}
                umumiy_baho={hubResult.umumiy_baho}
                ozgartirishlar={hubResult.ozgartirishlar}
                fixEditedText={fixEditedText}
                setFixEditedText={setFixEditedText}
                fixEditMode={fixEditMode}
                setFixEditMode={setFixEditMode}
                setPreviewText={setPreviewText}
                onSave={t => saveToDb('tuzatish', `Tuzatilgan shartnoma${fixFileName ? ` — ${fixFileName}` : ''}`, t)}
                onSaveToSystem={() => setSaveContractModal({ content: fixEditedText, tur: 'boshqa', raqam: '', sana: new Date().toISOString().slice(0, 10) })}
              />
            )}

            </>})()} {/* end ctxSuffix IIFE */}

            <button onClick={() => { setHubResult(null); setHubError(''); setFixEditMode(false) }}
              className="text-xs text-gray-500 hover:text-gray-400 transition">🔄 Qayta bajarish</button>
          </div>
        )}
      </div>

      {/* Upgrade banner for free users */}
      {!hasAiAccess() && (
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-semibold text-sm mb-1">{T(t.yuristPage.proLockTitle)}</div>
            <div className="text-gray-400 text-xs">{T({ uz: 'Shartnoma tahlili, tarjima, grammatika, yuridik maslahat — barchasi AI bilan', oz: 'Шартнома таҳлили, таржима, грамматика, юридик маслаҳат — барчаси AI билан', ru: 'Анализ договора, перевод, грамматика, юридическая консультация — всё с AI' })}</div>
          </div>
          <button onClick={openUpgradeModal}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
            {T(t.yuristPage.getProBtn)}
          </button>
        </div>
      )}

      {/* AI disclaimer */}
      <div className="bg-yellow-900/10 border border-yellow-700/20 rounded-xl px-4 py-3 flex gap-3 text-xs text-yellow-600/80">
        <span className="flex-shrink-0">⚠️</span>
        <span>{T({ uz: "Yurist AI tavsiyalari ma'lumot maqsadida beriladi — yuridik maslahat hisoblanmaydi. Muhim qarorlar uchun professional yuristga murojaat qiling.", oz: "Юрист AI тавсиялари маълумот мақсадида берилади — юридик маслаҳат ҳисобланмайди. Муҳим қарорлар учун профессионал юристга мурожаат қилинг.", ru: "Рекомендации Юрист AI носят информационный характер и не являются юридической консультацией. Для важных решений обратитесь к профессиональному юристу." })}</span>
      </div>

      {/* Saved documents panel */}
      {activeOrg?.id && (
        <SavedDocumentsPanel orgId={activeOrg.id} section="yurist" accentColor="blue" refreshKey={savedPanelKey} />
      )}

      {/* Save to contracts modal */}
      {saveContractModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
              <h3 className="font-semibold text-white">📂 {T(t.yuristPage.saveToSystem)}</h3>
              <button onClick={() => { setSaveContractModal(null); setSaveContractCp('') }}
                className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{T({ uz: 'Shartnoma raqami', oz: 'Шартнома рақами', ru: 'Номер договора' })}</label>
                  <input value={saveContractModal.raqam}
                    onChange={e => setSaveContractModal({ ...saveContractModal, raqam: e.target.value })}
                    placeholder="2026/01"
                    className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">{T({ uz: 'Sana', oz: 'Сана', ru: 'Дата' })}</label>
                  <input type="date" value={saveContractModal.sana}
                    onChange={e => setSaveContractModal({ ...saveContractModal, sana: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600"/>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{T({ uz: 'Shartnoma turi', oz: 'Шартнома тури', ru: 'Тип договора' })}</label>
                <select value={saveContractModal.tur}
                  onChange={e => setSaveContractModal({ ...saveContractModal, tur: e.target.value })}
                  className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 cursor-pointer">
                  {Object.entries(CONTRACT_TYPES_I18N).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{T({ uz: 'Kontragent (ixtiyoriy)', oz: 'Контрагент (ихтиёрий)', ru: 'Контрагент (необязательно)' })}</label>
                <select value={saveContractCp} onChange={e => setSaveContractCp(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 cursor-pointer">
                  <option value="">{T({ uz: '— Kontragent tanlanmagan —', oz: '— Контрагент танланмаган —', ru: '— Контрагент не выбран —' })}</option>
                  {cps.map(cp => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={saveContractToSystem} disabled={saveContractLoading}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                  {saveContractLoading ? T({ uz: '⏳ Saqlanmoqda...', oz: '⏳ Сақланмоқда...', ru: '⏳ Сохранение...' }) : T(t.yuristPage.saveBtn)}
                </button>
                <button onClick={() => { setSaveContractModal(null); setSaveContractCp('') }}
                  className="flex-1 bg-[#1F2937] hover:bg-[#0F172A] border border-[#1E293B] text-gray-300 py-2.5 rounded-xl text-sm transition">
                  {T({ uz: 'Bekor qilish', oz: 'Бекор қилиш', ru: 'Отмена' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
