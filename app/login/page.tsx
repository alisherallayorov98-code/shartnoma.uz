'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, LANG_LABELS, type Lang } from '@/lib/i18n'
import forge from 'node-forge'

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

  // E-IMZO PFX state
  const [pfxFile, setPfxFile] = useState<File | null>(null)
  const [pfxPass, setPfxPass] = useState('')
  const [eimzoLoading, setEimzoLoading] = useState(false)
  const pfxFileRef = useRef<HTMLInputElement>(null)

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

  // ── E-IMZO PFX login ──────────────────────────────────────────────────────
  async function handlePfxLogin() {
    if (!pfxFile) { setError('E-IMZO fayl tanlanmagan'); return }
    if (!pfxPass) { setError('E-IMZO paroli kiritilmagan'); return }
    setEimzoLoading(true)
    setError('')
    try {
      // 1. Get challenge
      const challengeRes = await fetch('/api/auth/eimzo/challenge')
      const { id: challengeId, challenge } = await challengeRes.json()

      // 2. Read PFX and extract key + certificate
      const arrayBuffer = await pfxFile.arrayBuffer()
      const pfxDer = forge.util.binary.raw.encode(new Uint8Array(arrayBuffer))
      const pfxAsn1 = forge.asn1.fromDer(pfxDer)
      let pfx: forge.pkcs12.Pkcs12Pfx
      try {
        pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, pfxPass)
      } catch {
        setError("Parol noto'g'ri yoki fayl buzilgan")
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

      // Show cert info
      const cn = certificate.subject.getField('CN')
      console.log('[E-IMZO] Certificate CN:', cn?.value)

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

      // 5. Set session and redirect
      const { error: sessionError } = await supabase.auth.setSession(data.session)
      if (sessionError) throw new Error('Sessiya o\'rnatishda xato: ' + sessionError.message)
      router.push('/dashboard')
    } catch (e) {
      console.error('[E-IMZO]', e)
      setError(e instanceof Error ? e.message : 'E-IMZO orqali kirishda xatolik')
    }
    setEimzoLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Top bar */}
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
            <button onClick={() => { setTab('eimzo'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === 'eimzo'
                  ? 'bg-green-700/30 border border-green-600 text-green-400'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
              }`}>
              🔐 E-IMZO
            </button>
            <button onClick={() => { setTab('email'); setError('') }}
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
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">E-IMZO kalit fayli (.pfx)</label>
                  <input ref={pfxFileRef} type="file" accept=".pfx,.p12"
                    onChange={e => { setPfxFile(e.target.files?.[0] || null); setError('') }} className="hidden" />
                  <button type="button" onClick={() => pfxFileRef.current?.click()}
                    className={`w-full text-left bg-gray-800 border text-sm rounded-lg px-4 py-3 transition truncate ${
                      pfxFile ? 'border-green-600 text-green-400' : 'border-gray-700 text-gray-400 hover:border-green-500'
                    }`}>
                    {pfxFile ? (
                      <span>✓ {pfxFile.name}</span>
                    ) : (
                      <span>📁 Faylni tanlash uchun bosing...</span>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">E-IMZO paroli</label>
                  <input type="password" value={pfxPass} onChange={e => setPfxPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                    onKeyDown={e => e.key === 'Enter' && pfxFile && pfxPass && handlePfxLogin()}
                  />
                </div>

                <button type="button" onClick={handlePfxLogin}
                  disabled={eimzoLoading || !pfxFile || !pfxPass}
                  className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium py-3 rounded-lg transition">
                  {eimzoLoading ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Tekshirilmoqda...</>
                  ) : '🔐 E-IMZO orqali kirish'}
                </button>
              </div>

              {/* Instructions */}
              <div className="border-t border-gray-800 pt-3">
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-400">PFX faylni qayerdan olish mumkin?</summary>
                  <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-gray-800">
                    <p>1. E-IMZO dasturini kompyuteringizda oching</p>
                    <p>2. Kalitlar ro&apos;yxatidan kerakli kalitni tanlang</p>
                    <p>3. &quot;Eksport&quot; yoki &quot;Saqlash&quot; tugmasini bosing</p>
                    <p>4. PFX (.pfx yoki .p12) formatda saqlang</p>
                    <p>5. Saqlangan faylni shu yerga yuklang</p>
                    <p className="text-yellow-600 mt-2">⚠ PFX fayl va parolni boshqalarga bermang</p>
                  </div>
                </details>
              </div>
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

        <p className="text-center text-gray-600 text-xs mt-4">
          E-IMZO bilan kirganingizda STIR raqamingiz asosida akkaunt yaratiladi
        </p>
      </div>
    </div>
  )
}
