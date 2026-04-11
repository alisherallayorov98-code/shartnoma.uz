'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, LANG_LABELS, type Lang } from '@/lib/i18n'
import forge from 'node-forge'
import {
  initEimzo, listCertificates, signPkcs7, isConnected,
  parseCertLabel, certExpiry, type EimzoCert,
} from '@/lib/eimzo-client'
import { Eye, EyeOff } from 'lucide-react'

type LoginTab = 'eimzo' | 'email'

const KEYFRAMES = `
@keyframes blobPulse {
  0%, 100% { transform: scale(1) translate(0, 0); }
  33% { transform: scale(1.12) translate(20px, -15px); }
  66% { transform: scale(0.92) translate(-15px, 20px); }
}
@keyframes blobPulse2 {
  0%, 100% { transform: scale(1) translate(0, 0); }
  33% { transform: scale(0.9) translate(-25px, 20px); }
  66% { transform: scale(1.1) translate(20px, -15px); }
}
@keyframes floatCard {
  0%, 100% { transform: translateY(0px) rotate(-1deg); }
  50% { transform: translateY(-10px) rotate(1deg); }
}
@keyframes floatCard2 {
  0%, 100% { transform: translateY(0px) rotate(1deg); }
  50% { transform: translateY(-8px) rotate(-1deg); }
}
@keyframes floatCard3 {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
@keyframes gradientBtn {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes pulseGlow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.login-float-1 { animation: floatCard 5s ease-in-out infinite; }
.login-float-2 { animation: floatCard2 6s ease-in-out infinite; }
.login-float-3 { animation: floatCard3 4s ease-in-out infinite; }
.login-gradient-btn {
  background: linear-gradient(135deg, #2563eb, #7c3aed, #2563eb);
  background-size: 200% 200%;
  animation: gradientBtn 3s ease infinite;
}
`

const FLOAT_CARDS = [
  { icon: '🔐', title: 'E-IMZO', desc: 'Xavfsiz imzolash', colorFrom: 'rgba(59,130,246,0.15)', colorTo: 'rgba(37,99,235,0.06)', border: 'rgba(59,130,246,0.25)', cls: 'login-float-1', top: '12%', left: '8%' },
  { icon: '📄', title: '12,400+', desc: 'Shartnoma yaratildi', colorFrom: 'rgba(139,92,246,0.15)', colorTo: 'rgba(109,40,217,0.06)', border: 'rgba(139,92,246,0.25)', cls: 'login-float-2', top: '40%', right: '6%' },
  { icon: '🤖', title: 'AI Yurist', desc: 'Doim yoningizda', colorFrom: 'rgba(16,185,129,0.15)', colorTo: 'rgba(5,150,105,0.06)', border: 'rgba(16,185,129,0.25)', cls: 'login-float-3', bottom: '20%', left: '5%' },
]

const STATS = [
  { val: '10,000+', label: { uz: 'Foydalanuvchi', oz: 'Фойдаланувчи', ru: 'Пользователей' } },
  { val: '99.9%',   label: { uz: 'Ishonchlilik', oz: 'Ишончлилик', ru: 'Надёжность' } },
  { val: '5 daqiqa', label: { uz: 'Boshlash', oz: 'Бошлаш', ru: 'Запуск' } },
]

const FEATURES_LIST = [
  { icon: '🔐', text: { uz: 'E-IMZO bilan xavfsiz kirish', oz: 'E-IMZO билан хавфсиз кириш', ru: 'Безопасный вход через E-IMZO' } },
  { icon: '📊', text: { uz: 'Barcha hujjatlar bir joyda', oz: 'Барча ҳужжатлар бир жойда', ru: 'Все документы в одном месте' } },
  { icon: '🤖', text: { uz: 'AI yordamchi har doim tayyor', oz: 'AI ёрдамчи ҳар доим тайёр', ru: 'ИИ-помощник всегда готов' } },
  { icon: '🏢', text: { uz: "Ko'p tashkilotni boshqaring", oz: 'Кўп ташкилотни бошқаринг', ru: 'Управляйте несколькими организациями' } },
]

export default function LoginPage() {
  const router = useRouter()
  const { lang, setLang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const [tab, setTab]                     = useState<LoginTab>('eimzo')
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [showPass, setShowPass]           = useState(false)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')

  const [desktopStatus, setDesktopStatus] = useState<'checking' | 'connected' | 'failed'>('checking')
  const [certs, setCerts]                 = useState<EimzoCert[]>([])
  const [selectedCert, setSelectedCert]   = useState('')
  const [eimzoLoading, setEimzoLoading]   = useState(false)

  const [pfxMode, setPfxMode]             = useState(false)
  const [pfxFile, setPfxFile]             = useState<File | null>(null)
  const [pfxPass, setPfxPass]             = useState('')
  const pfxFileRef                        = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initEimzo().then(async (connected) => {
      if (connected) {
        setDesktopStatus('connected')
        try {
          const certList = await listCertificates()
          setCerts(certList)
          if (certList.length > 0) setSelectedCert(certList[0].alias || certList[0].serialNumber || '0')
        } catch { /* ignore */ }
      } else {
        setDesktopStatus('failed')
      }
    }).catch(() => setDesktopStatus('failed'))
  }, [])

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const m = error.message.toLowerCase()
      setError(m.includes('not confirmed')
        ? T({ uz: 'Email tasdiqlash havolasi yuborilgan. Emailingizni tekshiring.', oz: 'Email тасдиқлаш ҳаволаси юборилган.', ru: 'Письмо подтверждения отправлено. Проверьте почту.' })
        : T(t.login.error))
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback?next=/dashboard' },
    })
  }

  async function finishLogin(body: Record<string, string>) {
    const res = await fetch('/api/auth/eimzo/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'E-IMZO xatoligi')
    const { error: se } = await supabase.auth.setSession(data.session)
    if (se) throw new Error('Sessiya xatosi: ' + se.message)
    router.push('/dashboard')
  }

  async function handleDesktopLogin() {
    if (!isConnected() || !selectedCert) { setError('Kalit tanlanmagan'); return }
    setEimzoLoading(true); setError('')
    try {
      const { id: challengeId, challenge } = await fetch('/api/auth/eimzo/challenge').then(r => r.json())
      const pkcs7B64 = await signPkcs7(selectedCert, btoa(challenge))
      if (!pkcs7B64) throw new Error('Imzolashda xatolik')
      await finishLogin({ pkcs7B64, challengeId, challenge })
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    setEimzoLoading(false)
  }

  async function handlePfxLogin() {
    if (!pfxFile) { setError('E-IMZO fayl tanlanmagan'); return }
    if (!pfxPass) { setError('E-IMZO paroli kiritilmagan'); return }
    setEimzoLoading(true); setError('')
    try {
      const { id: challengeId, challenge } = await fetch('/api/auth/eimzo/challenge').then(r => r.json())
      const pfxDer = forge.util.binary.raw.encode(new Uint8Array(await pfxFile.arrayBuffer()))
      let pfx: forge.pkcs12.Pkcs12Pfx
      try { pfx = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(pfxDer), pfxPass) }
      catch { setError("Parol noto'g'ri yoki fayl buzilgan"); setEimzoLoading(false); return }
      const privateKey = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key as forge.pki.rsa.PrivateKey
      const certificate = pfx.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]?.[0]?.cert
      if (!privateKey || !certificate) { setError('Kalit yoki sertifikat topilmadi'); setEimzoLoading(false); return }
      const md = forge.md.sha256.create(); md.update(challenge)
      await finishLogin({ challengeId, signatureB64: forge.util.encode64(privateKey.sign(md)), certificateB64: forge.util.encode64(forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).bytes()) })
    } catch (e) { setError(e instanceof Error ? e.message : 'Xatolik') }
    setEimzoLoading(false)
  }

  const inp = 'w-full bg-white/[0.03] border border-white/[0.08] text-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder-gray-600 transition'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div className="min-h-screen flex bg-[#060D1A]">

        {/* ── LEFT PANEL (visual) ─────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">

          {/* Animated blobs */}
          <div className="absolute w-[520px] h-[520px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)', top: '-160px', left: '-100px', animation: 'blobPulse 12s ease-in-out infinite' }}/>
          <div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 70%)', bottom: '-80px', left: '30%', animation: 'blobPulse2 15s ease-in-out infinite' }}/>
          <div className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)', top: '40%', right: '-60px' }}/>

          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '44px 44px' }}/>

          {/* Floating cards */}
          {FLOAT_CARDS.map((card, i) => (
            <div key={i} className={`absolute ${card.cls}`}
              style={{ top: card.top, left: (card as { left?: string }).left, right: (card as { right?: string }).right, bottom: (card as { bottom?: string }).bottom }}>
              <div className="backdrop-blur-xl rounded-2xl px-4 py-3.5 shadow-xl min-w-[150px]"
                style={{ background: `linear-gradient(135deg, ${card.colorFrom}, ${card.colorTo})`, border: `1px solid ${card.border}` }}>
                <div className="text-2xl mb-1.5">{card.icon}</div>
                <div className="text-white text-sm font-bold">{card.title}</div>
                <div className="text-gray-400 text-xs mt-0.5">{card.desc}</div>
              </div>
            </div>
          ))}

          {/* Main content */}
          <div className="relative z-10 flex flex-col justify-center px-14 py-12 w-full">
            <div className="max-w-md">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 mb-7"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)' }}>
                <span className="w-2 h-2 bg-blue-400 rounded-full" style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}/>
                <span className="text-blue-300 text-xs font-medium">
                  {T({ uz: "O'zbekiston ishonchli platformasi", oz: 'Ўзбекистон ишончли платформаси', ru: 'Надёжная платформа Узбекистана' })}
                </span>
              </div>

              <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                {T({ uz: 'Biznes hujjatlari', oz: 'Бизнес ҳужжатлари', ru: 'Бизнес-документы' })}<br/>
                <span className="text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }}>
                  {T({ uz: 'yangi darajada', oz: 'янги даражада', ru: 'нового уровня' })}
                </span>
              </h2>

              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                {T({
                  uz: "Shartnomalar, E-IMZO, AI yurist va buxgalteriya — hammasi bir joyda. O'zbekistonning ishonchli hujjat boshqaruv tizimi.",
                  oz: 'Шартномалар, E-IMZO, AI юрист ва бухгалтерия — ҳаммаси бир жойда.',
                  ru: 'Договоры, E-IMZO, AI-юрист и бухгалтерия — всё в одном месте.',
                })}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {STATS.map((s, i) => (
                  <div key={i} className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-white font-bold text-sm">{s.val}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{T(s.label)}</div>
                  </div>
                ))}
              </div>

              {/* Feature list */}
              <div className="space-y-3">
                {FEATURES_LIST.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="text-lg">{item.icon}</span>
                    <span>{T(item.text)}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (form) ─────────────────────────────────────────── */}
        <div className="w-full lg:w-[480px] xl:w-[520px] flex-shrink-0 flex flex-col justify-between px-6 py-8 relative">

          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)' }}/>

          <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative">

            {/* Back + Lang */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
                {T({ uz: 'Bosh sahifa', oz: 'Бош саҳифа', ru: 'На главную' })}
              </Link>
              <div className="flex gap-1">
                {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition ${lang === l ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                    {LANG_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-7">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ boxShadow: '0 0 20px rgba(37,99,235,0.4)' }}>K</div>
              <span className="text-white font-bold text-lg">Kabinetim.uz</span>
            </div>

            {/* Glassmorphism card */}
            <div className="rounded-2xl p-6 shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.07)', animation: 'fadeSlideIn 0.5s ease-out' }}>

              <h1 className="text-2xl font-bold text-white mb-1">
                {T({ uz: 'Xush kelibsiz!', oz: 'Хуш келибсиз!', ru: 'Добро пожаловать!' })}
              </h1>
              <p className="text-gray-500 text-sm mb-5">
                {T({ uz: 'Hisobingizga kiring', oz: 'Ҳисобингизга киринг', ru: 'Войдите в свой аккаунт' })}
              </p>

              {/* Tab switcher */}
              <div className="flex rounded-xl p-1 mb-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => { setTab('eimzo'); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'eimzo' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-300'}`}>
                  🔐 E-IMZO
                </button>
                <button onClick={() => { setTab('email'); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'email' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-300'}`}>
                  ✉ Email
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl px-4 py-3 mb-4 text-xs flex items-start gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
                  <span className="mt-0.5 shrink-0">⚠</span> {error}
                </div>
              )}

              {/* ── E-IMZO TAB ── */}
              {tab === 'eimzo' && (
                <div className="space-y-3">
                  {desktopStatus === 'checking' && !pfxMode && (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs text-gray-400"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <svg className="animate-spin w-4 h-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      E-IMZO ilovasi tekshirilmoqda...
                    </div>
                  )}

                  {desktopStatus === 'connected' && !pfxMode && (
                    <>
                      <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shrink-0"/>
                        E-IMZO ilovasi ulandi
                      </div>
                      {certs.length > 0 ? (
                        <>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Kalit</label>
                            <select value={selectedCert} onChange={e => setSelectedCert(e.target.value)} className={inp}>
                              {certs.map((cert, i) => (
                                <option key={i} value={cert.alias || cert.serialNumber || String(i)}>
                                  {parseCertLabel(cert)} — {certExpiry(cert)} gacha
                                </option>
                              ))}
                            </select>
                          </div>
                          <button onClick={handleDesktopLogin} disabled={eimzoLoading || !selectedCert}
                            className="login-gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm"
                            style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.25)' }}>
                            {eimzoLoading
                              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Imzolanmoqda...</>
                              : <>{T({ uz: 'Kirish', oz: 'Кириш', ru: 'Войти' })} →</>}
                          </button>
                        </>
                      ) : (
                        <p className="text-xs rounded-xl py-3 text-center"
                          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                          Kalitlar topilmadi
                        </p>
                      )}
                      <button onClick={() => setPfxMode(true)} className="text-xs text-gray-500 hover:text-gray-300 w-full text-center transition">
                        PFX fayl orqali kirish →
                      </button>
                    </>
                  )}

                  {(desktopStatus === 'failed' || pfxMode) && (
                    <>
                      {desktopStatus === 'failed' && !pfxMode && (
                        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs"
                          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0"/>
                          E-IMZO ilovasi topilmadi — PFX fayl bilan kiring
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">E-IMZO kalit fayli (.pfx)</label>
                        <input ref={pfxFileRef} type="file" accept=".pfx,.p12" onChange={e => { setPfxFile(e.target.files?.[0] || null); setError('') }} className="hidden" />
                        <button onClick={() => pfxFileRef.current?.click()}
                          className={`w-full text-left rounded-xl px-4 py-3 text-sm transition ${
                            pfxFile
                              ? 'text-blue-400'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                          style={pfxFile
                            ? { background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }
                            : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {pfxFile ? `✓ ${pfxFile.name}` : '📁 Fayl tanlash...'}
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">E-IMZO paroli</label>
                        <input type="password" value={pfxPass} onChange={e => setPfxPass(e.target.value)} placeholder="••••••••"
                          className={inp} onKeyDown={e => e.key === 'Enter' && pfxFile && pfxPass && handlePfxLogin()} />
                      </div>
                      <button onClick={handlePfxLogin} disabled={eimzoLoading || !pfxFile || !pfxPass}
                        className="login-gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm"
                        style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.25)' }}>
                        {eimzoLoading
                          ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Tekshirilmoqda...</>
                          : <>{T({ uz: 'Kirish', oz: 'Кириш', ru: 'Войти' })} →</>}
                      </button>
                      {pfxMode && (
                        <button onClick={() => setPfxMode(false)} className="text-xs text-gray-500 hover:text-gray-300 w-full text-center transition">← Orqaga</button>
                      )}
                      <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-400 transition">PFX faylni qayerdan olaman?</summary>
                        <div className="mt-2 pl-3 space-y-1 text-gray-600" style={{ borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
                          <p>1. E-IMZO dasturini oching</p>
                          <p>2. Kalitni tanlang → Eksport → PFX</p>
                          <p>3. Saqlangan faylni yuqoriga yuklang</p>
                          <p style={{ color: 'rgba(245,158,11,0.6)' }}>⚠ PFX faylni hech kimga bermang</p>
                        </div>
                      </details>
                    </>
                  )}
                </div>
              )}

              {/* ── EMAIL TAB ── */}
              {tab === 'email' && (
                <div className="space-y-3">
                  <button onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 text-gray-200 font-medium py-3 rounded-xl text-sm transition-all hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google bilan kirish
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}/>
                    <span className="text-gray-600 text-xs">{T(t.login.or)}</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }}/>
                  </div>

                  <form onSubmit={handleEmailLogin} className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">
                        {T({ uz: 'Email', oz: 'Email', ru: 'Email' })}
                      </label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        className={inp} placeholder="email@misol.com" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-gray-400">
                          {T({ uz: 'Parol', oz: 'Парол', ru: 'Пароль' })}
                        </label>
                        <a href="#" className="text-blue-400 text-xs hover:text-blue-300 transition">
                          {T({ uz: 'Unutdingizmi?', oz: 'Унутдингизми?', ru: 'Забыли?' })}
                        </a>
                      </div>
                      <div className="relative">
                        <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                          className={`${inp} pr-10`} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                          {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={loading}
                      className="login-gradient-btn w-full flex items-center justify-center gap-2 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm"
                      style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.25)' }}>
                      {loading
                        ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> {T(t.btn.loading)}</>
                        : <>{T({ uz: 'Kirish', oz: 'Кириш', ru: 'Войти' })} →</>}
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Sign up link */}
            <p className="text-center text-gray-600 text-xs mt-5">
              {T(t.login.noAccount)}{' '}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition">
                {T(t.login.signupLink)}
              </Link>
            </p>

          </div>

          {/* Footer */}
          <p className="text-center text-gray-700 text-xs mt-4">
            © 2024 Kabinetim.uz. Barcha huquqlar himoyalangan.
          </p>
        </div>

      </div>
    </>
  )
}
