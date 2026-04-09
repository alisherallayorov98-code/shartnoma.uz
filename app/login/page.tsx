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

type LoginTab = 'eimzo' | 'email'

export default function LoginPage() {
  const router = useRouter()
  const { lang, setLang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const [tab, setTab] = useState<LoginTab>('eimzo')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [desktopStatus, setDesktopStatus] = useState<'checking' | 'connected' | 'failed'>('checking')
  const [certs, setCerts] = useState<EimzoCert[]>([])
  const [selectedCert, setSelectedCert] = useState('')
  const [eimzoLoading, setEimzoLoading] = useState(false)

  const [pfxMode, setPfxMode] = useState(false)
  const [pfxFile, setPfxFile] = useState<File | null>(null)
  const [pfxPass, setPfxPass] = useState('')
  const pfxFileRef = useRef<HTMLInputElement>(null)

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

  const inp = 'w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder-gray-400 transition'

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left: Form ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-8 py-10 max-w-[520px]">

        {/* Logo + lang */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">K</div>
            <span className="text-gray-900 font-bold text-lg">Kabinetim.uz</span>
          </Link>
          <div className="flex gap-1">
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs rounded-lg transition ${lang === l ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Xush kelibsiz</h1>
          <p className="text-gray-500 text-sm">Hisobingizga kiring</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm flex items-start gap-2">
            <span className="mt-0.5 shrink-0">⚠</span> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          {(['eimzo', 'email'] as LoginTab[]).map(tabKey => (
            <button key={tabKey} onClick={() => { setTab(tabKey); setError('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === tabKey ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tabKey === 'eimzo' ? '🔐 E-IMZO' : '✉ Email'}
            </button>
          ))}
        </div>

        {/* ── E-IMZO ── */}
        {tab === 'eimzo' && (
          <div className="space-y-4">
            {desktopStatus === 'checking' && !pfxMode && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
                <svg className="animate-spin w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                E-IMZO ilovasi tekshirilmoqda...
              </div>
            )}

            {desktopStatus === 'connected' && !pfxMode && (
              <>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-xs text-green-700">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0"/>
                  E-IMZO ilovasi ulandi
                </div>
                {certs.length > 0 ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Kalit</label>
                      <select value={selectedCert} onChange={e => setSelectedCert(e.target.value)} className={inp}>
                        {certs.map((cert, i) => (
                          <option key={i} value={cert.alias || cert.serialNumber || String(i)}>
                            {parseCertLabel(cert)} — {certExpiry(cert)} gacha
                          </option>
                        ))}
                      </select>
                    </div>
                    <button onClick={handleDesktopLogin} disabled={eimzoLoading || !selectedCert}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm">
                      {eimzoLoading ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Imzolanmoqda...</> : 'Kirish'}
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl py-3 text-center">Kalitlar topilmadi</p>
                )}
                <button onClick={() => setPfxMode(true)} className="text-xs text-gray-400 hover:text-gray-600 w-full text-center transition">
                  PFX fayl orqali kirish →
                </button>
              </>
            )}

            {(desktopStatus === 'failed' || pfxMode) && (
              <>
                {desktopStatus === 'failed' && !pfxMode && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0"/>
                    E-IMZO ilovasi topilmadi — PFX fayl bilan kiring
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">E-IMZO kalit fayli (.pfx)</label>
                  <input ref={pfxFileRef} type="file" accept=".pfx,.p12" onChange={e => { setPfxFile(e.target.files?.[0] || null); setError('') }} className="hidden" />
                  <button onClick={() => pfxFileRef.current?.click()}
                    className={`w-full text-left bg-white border rounded-xl px-4 py-3 text-sm transition ${pfxFile ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}`}>
                    {pfxFile ? `✓ ${pfxFile.name}` : '📁 Fayl tanlash...'}
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">E-IMZO paroli</label>
                  <input type="password" value={pfxPass} onChange={e => setPfxPass(e.target.value)} placeholder="••••••••"
                    className={inp} onKeyDown={e => e.key === 'Enter' && pfxFile && pfxPass && handlePfxLogin()} />
                </div>
                <button onClick={handlePfxLogin} disabled={eimzoLoading || !pfxFile || !pfxPass}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm">
                  {eimzoLoading ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Tekshirilmoqda...</> : 'Kirish'}
                </button>
                {pfxMode && (
                  <button onClick={() => setPfxMode(false)} className="text-xs text-gray-400 hover:text-gray-600 w-full text-center transition">← Orqaga</button>
                )}
                <details className="text-xs text-gray-400">
                  <summary className="cursor-pointer hover:text-gray-600 transition">PFX faylni qayerdan olaman?</summary>
                  <div className="mt-2 pl-3 border-l-2 border-gray-100 space-y-1 text-gray-400">
                    <p>1. E-IMZO dasturini oching</p>
                    <p>2. Kalitni tanlang → Eksport → PFX</p>
                    <p>3. Saqlangan faylni yuqoriga yuklang</p>
                    <p className="text-amber-500">⚠ PFX faylni hech kimga bermang</p>
                  </div>
                </details>
              </>
            )}
          </div>
        )}

        {/* ── Email ── */}
        {tab === 'email' && (
          <div className="space-y-4">
            <button onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google bilan kirish
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100"/>
              <span className="text-gray-400 text-xs">{T(t.login.or)}</span>
              <div className="flex-1 h-px bg-gray-100"/>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inp} placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{T(t.login.password)}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inp} placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm">
                {loading ? T(t.btn.loading) : T(t.login.submit)}
              </button>
            </form>

            <p className="text-center text-gray-400 text-xs">
              {T(t.login.noAccount)}{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium transition">{T(t.login.signupLink)}</Link>
            </p>
          </div>
        )}
      </div>

      {/* ── Right: Branding ────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex-col justify-center px-14 relative overflow-hidden">
        {/* Document pattern background */}
        <div
          className="absolute inset-0 opacity-100"
          style={{ backgroundImage: 'url(/bg-pattern.svg)', backgroundSize: '120px 140px', backgroundRepeat: 'repeat' }}
        />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-80 h-80 bg-white rounded-full blur-3xl"/>
          <div className="absolute bottom-20 left-10 w-56 h-56 bg-white rounded-full blur-2xl"/>
        </div>

        <div className="relative z-10">
          <div className="text-blue-100 text-xs font-semibold mb-4 uppercase tracking-widest">Kabinetim.uz</div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Biznes hujjatlarini<br/>professional darajada
          </h2>
          <p className="text-blue-100 text-sm mb-10 leading-relaxed max-w-xs">
            Shartnomalar, kadrlar, buxgalteriya hujjatlarini bir joyda yarating va boshqaring.
          </p>

          <div className="space-y-4">
            {[
              { icon: '📄', title: 'Avtomatik shartnomalar', desc: "STIR bo'yicha rekvizitlarni avtomatik to'ldirish" },
              { icon: '🔐', title: 'E-IMZO integratsiyasi', desc: 'Elektron imzo bilan xavfsiz kirish' },
              { icon: '🏢', title: "Ko'p tashkilot", desc: "Bir hisobda bir nechta tashkilotni boshqaring" },
              { icon: '🤖', title: 'AI yordamchi', desc: 'Hujjatlarni AI yordamida yarating' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg shrink-0">{item.icon}</div>
                <div>
                  <div className="text-white font-semibold text-sm">{item.title}</div>
                  <div className="text-blue-100 text-xs mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3 bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {['🧑‍💼', '👩‍💼', '👨‍💼'].map((emoji, i) => (
                <div key={i} className="w-7 h-7 bg-white/30 rounded-full flex items-center justify-center text-sm border-2 border-white/20">{emoji}</div>
              ))}
            </div>
            <div>
              <div className="text-white text-xs font-semibold">10,000+ tashkilot ishlatmoqda</div>
              <div className="text-blue-200 text-xs">O'zbekiston bo'ylab</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
