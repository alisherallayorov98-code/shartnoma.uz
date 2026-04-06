'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, LANG_LABELS, type Lang } from '@/lib/i18n'
import forge from 'node-forge'
import {
  detectEimzo, listCertificates, signPkcs7,
  parseCertLabel, certExpiry,
  type EimzoConnection, type EimzoCert,
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

  // E-IMZO state
  const [eimzoConn, setEimzoConn] = useState<EimzoConnection | null>(null)
  const [eimzoCerts, setEimzoCerts] = useState<EimzoCert[]>([])
  const [selectedAlias, setSelectedAlias] = useState('')
  const [eimzoLoading, setEimzoLoading] = useState(false)
  const [detectStatus, setDetectStatus] = useState<'checking' | 'found' | 'notfound'>('checking')

  // PFX fallback state
  const [pfxMode, setPfxMode] = useState(false)
  const [pfxFile, setPfxFile] = useState<File | null>(null)
  const [pfxPass, setPfxPass] = useState('')
  const pfxFileRef = useRef<HTMLInputElement>(null)

  // ── Detect E-IMZO desktop client ────────────────────────────────────────────
  useEffect(() => {
    detectEimzo().then(async (conn) => {
      console.log('[E-IMZO] detectEimzo result:', conn)
      if (conn) {
        setEimzoConn(conn)
        setDetectStatus('found')
        try {
          const certs = await listCertificates(conn)
          console.log('[E-IMZO] certificates:', certs)
          setEimzoCerts(certs)
          if (certs.length > 0) setSelectedAlias(certs[0].alias)
        } catch (e) {
          console.warn('[E-IMZO] listCertificates error:', e)
          setDetectStatus('found')
        }
      } else {
        console.log('[E-IMZO] desktop client not detected')
        setDetectStatus('notfound')
      }
    }).catch((e) => { console.warn('[E-IMZO] detect error:', e); setDetectStatus('notfound') })
  }, [])

  // ── Email/password login ────────────────────────────────────────────────────
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const m = error.message.toLowerCase()
      if (m.includes('email not confirmed') || m.includes('not confirmed')) {
        setError(T({
          uz: 'Email tasdiqlash havolasi yuborilgan edi. Iltimos, emailingizni tekshiring.',
          oz: 'Email тасдиқлаш ҳаволаси юборилган эди. Илтимос, emailингизни текширинг.',
          ru: 'Ссылка для подтверждения отправлена на email. Проверьте почту.',
        }))
      } else {
        setError(T(t.login.error))
      }
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  // ── Google login ────────────────────────────────────────────────────────────
  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
  }

  // ── E-IMZO Desktop login ───────────────────────────────────────────────────
  async function handleDesktopLogin() {
    if (!eimzoConn || !selectedAlias) { setError('Kalit tanlanmagan'); return }
    setEimzoLoading(true)
    setError('')
    try {
      // 1. Get challenge from server
      const { id: challengeId, challenge } = await fetch('/api/auth/eimzo/challenge').then(r => r.json())

      // 2. Sign challenge via E-IMZO desktop (WebSocket or REST)
      const pkcs7B64 = await signPkcs7(eimzoConn, selectedAlias, challenge)

      // 3. Verify on server
      const res = await fetch('/api/auth/eimzo/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pkcs7B64, challengeId, challenge }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server xatoligi')
      await supabase.auth.setSession(data.session)
      router.push('/dashboard')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'E-IMZO xatoligi'
      if (msg.includes('ws_') || msg.includes('timeout') || msg.includes('fetch')) {
        setError("E-IMZO ilovasi bilan bog'lanib bo'lmadi. PFX fayl orqali kiring.")
        setPfxMode(true)
      } else {
        setError(msg)
      }
    }
    setEimzoLoading(false)
  }

  // ── PFX file login ─────────────────────────────────────────────────────────
  async function handlePfxLogin() {
    if (!pfxFile) { setError('E-IMZO fayl tanlanmagan'); return }
    if (!pfxPass) { setError('E-IMZO paroli kiritilmagan'); return }
    setEimzoLoading(true)
    setError('')
    try {
      // 1. Get challenge
      const { id: challengeId, challenge } = await fetch('/api/auth/eimzo/challenge').then(r => r.json())

      // 2. Read PFX and extract key + certificate
      const arrayBuffer = await pfxFile.arrayBuffer()
      const pfxDer = forge.util.binary.raw.encode(new Uint8Array(arrayBuffer))
      const pfxAsn1 = forge.asn1.fromDer(pfxDer)
      let pfx: forge.pkcs12.Pkcs12Pfx
      try {
        pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, pfxPass)
      } catch {
        setError("E-IMZO paroli noto'g'ri yoki fayl buzilgan")
        setEimzoLoading(false)
        return
      }

      const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
      const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag })
      const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key as forge.pki.rsa.PrivateKey
      const certificate = certBags[forge.pki.oids.certBag]?.[0]?.cert
      if (!privateKey || !certificate) {
        setError('Kalit yoki sertifikat topilmadi')
        setEimzoLoading(false)
        return
      }

      // 3. Sign challenge
      const md = forge.md.sha256.create()
      md.update(challenge)
      const signature = privateKey.sign(md)
      const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).bytes()

      // 4. Verify on server
      const res = await fetch('/api/auth/eimzo/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          signatureB64: forge.util.encode64(signature),
          certificateB64: forge.util.encode64(certDer),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'E-IMZO xatoligi')
      await supabase.auth.setSession(data.session)
      router.push('/dashboard')
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'E-IMZO orqali kirishda xatolik')
    }
    setEimzoLoading(false)
  }

  // ── Refresh certs (desktop) ────────────────────────────────────────────────
  async function refreshCerts() {
    if (!eimzoConn) return
    try {
      const certs = await listCertificates(eimzoConn)
      setEimzoCerts(certs)
      if (certs.length > 0 && !selectedAlias) setSelectedAlias(certs[0].alias)
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Top bar: back + language */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1">
            ← Bosh sahifa
          </Link>
          <div className="flex gap-1">
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-3 py-1 text-xs rounded-lg transition ${
                  lang === l ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-400">Kabinetim.uz</Link>
          <h1 className="text-2xl font-bold text-white mt-4">{T(t.login.title)}</h1>
          <p className="text-gray-400 mt-2">{T(t.login.subtitle)}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Tab selector */}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setTab('eimzo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === 'eimzo'
                  ? 'bg-green-700/30 border border-green-600 text-green-400'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
              }`}>
              🔐 E-IMZO
            </button>
            <button onClick={() => setTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === 'email'
                  ? 'bg-blue-700/30 border border-blue-600 text-blue-400'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
              }`}>
              ✉ Email
            </button>
          </div>

          {/* ═══════════════════ E-IMZO Tab ═══════════════════ */}
          {tab === 'eimzo' && (
            <div className="space-y-4">

              {/* Desktop mode */}
              {detectStatus === 'checking' && (
                <div className="text-center py-4">
                  <svg className="animate-spin w-6 h-6 mx-auto text-green-400 mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <p className="text-sm text-gray-400">E-IMZO ilovasi tekshirilmoqda...</p>
                </div>
              )}

              {detectStatus === 'found' && !pfxMode && (
                <>
                  <div className="flex items-center gap-2 text-xs text-green-400 bg-green-900/20 border border-green-800/30 rounded-lg px-3 py-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
                    E-IMZO ilovasi topildi
                    {eimzoConn && <span className="text-green-600 ml-auto text-[10px]">{eimzoConn.baseUrl}</span>}
                  </div>

                  {eimzoCerts.length > 0 ? (
                    <>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Kalitni tanlang</label>
                        <select value={selectedAlias} onChange={e => setSelectedAlias(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-green-500">
                          {eimzoCerts.map(cert => (
                            <option key={cert.alias} value={cert.alias}>
                              {parseCertLabel(cert)} — {certExpiry(cert)} gacha
                            </option>
                          ))}
                        </select>
                      </div>
                      <button type="button" onClick={handleDesktopLogin}
                        disabled={eimzoLoading || !selectedAlias}
                        className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium py-3 rounded-lg transition">
                        {eimzoLoading ? (
                          <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Imzolanmoqda...</>
                        ) : '🔐 E-IMZO orqali kirish'}
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-sm text-yellow-500 mb-2">Kalitlar topilmadi</p>
                      <p className="text-xs text-gray-500 mb-3">E-IMZO ilovasiga kalit o'rnatilganligini tekshiring</p>
                      <button type="button" onClick={refreshCerts}
                        className="text-xs text-blue-400 hover:text-blue-300 underline">
                        Qayta tekshirish
                      </button>
                    </div>
                  )}

                  <button type="button" onClick={() => setPfxMode(true)}
                    className="text-xs text-gray-500 hover:text-gray-400 w-full text-center mt-2">
                    PFX fayl orqali kirish →
                  </button>
                </>
              )}

              {/* PFX mode */}
              {(detectStatus === 'notfound' || pfxMode) && (
                <>
                  {detectStatus === 'notfound' && !pfxMode && (
                    <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-3 py-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"/>
                      E-IMZO ilovasi topilmadi — PFX fayl bilan kiring
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">E-IMZO fayl (.pfx)</label>
                      <input ref={pfxFileRef} type="file" accept=".pfx,.p12"
                        onChange={e => setPfxFile(e.target.files?.[0] || null)} className="hidden" />
                      <button type="button" onClick={() => pfxFileRef.current?.click()}
                        className="w-full text-left bg-gray-800 border border-gray-700 text-sm rounded-lg px-4 py-2.5 hover:border-green-500 transition truncate">
                        {pfxFile ? (
                          <span className="text-green-400">✓ {pfxFile.name}</span>
                        ) : (
                          <span className="text-gray-400">Faylni tanlash uchun bosing...</span>
                        )}
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">E-IMZO paroli</label>
                      <input type="password" value={pfxPass} onChange={e => setPfxPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-green-500"
                        onKeyDown={e => e.key === 'Enter' && handlePfxLogin()}
                      />
                    </div>

                    <button type="button" onClick={handlePfxLogin}
                      disabled={eimzoLoading || !pfxFile || !pfxPass}
                      className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium py-3 rounded-lg transition">
                      {eimzoLoading ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Tekshirilmoqda...</>
                      ) : '🔐 E-IMZO orqali kirish'}
                    </button>

                    {pfxMode && (
                      <button type="button" onClick={() => setPfxMode(false)}
                        className="text-xs text-gray-500 hover:text-gray-400 w-full text-center">
                        ← Orqaga
                      </button>
                    )}
                  </div>

                  {/* PFX instructions */}
                  <div className="mt-3 border-t border-gray-800 pt-3">
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-400">PFX faylni qayerdan olish mumkin?</summary>
                      <div className="mt-2 space-y-1 pl-3 border-l-2 border-gray-800">
                        <p>1. E-IMZO dasturini oching</p>
                        <p>2. Kalitlar ro&apos;yxatidan kerakli kalitni tanlang</p>
                        <p>3. &quot;Eksport&quot; tugmasini bosing</p>
                        <p>4. PFX formatda saqlang</p>
                        <p className="text-yellow-600 mt-1">⚠ PFX faylni ishonchli joyda saqlang</p>
                      </div>
                    </details>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══════════════════ Email Tab ═══════════════════ */}
          {tab === 'email' && (
            <div className="space-y-4">
              <button onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {T(t.login.googleBtn)}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-700"/>
                <span className="text-gray-500 text-sm">{T(t.login.or)}</span>
                <div className="flex-1 h-px bg-gray-700"/>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">{T(t.login.password)}</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm">
                  {loading ? T(t.btn.loading) : T(t.login.submit)}
                </button>
              </form>

              <p className="text-center text-gray-400 text-sm">
                {T(t.login.noAccount)}{' '}
                <Link href="/signup" className="text-blue-400 hover:text-blue-300">
                  {T(t.login.signupLink)}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-gray-600 text-xs mt-4">
          E-IMZO bilan kirganingizda STIR raqamingiz asosida akkaunt yaratiladi
        </p>
      </div>
    </div>
  )
}
