'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, LANG_LABELS, type Lang } from '@/lib/i18n'
import forge from 'node-forge'

export default function LoginPage() {
  const router = useRouter()
  const { lang, setLang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // E-IMZO state
  const [eimzoFile, setEimzoFile] = useState<File | null>(null)
  const [eimzoPass, setEimzoPass] = useState('')
  const [eimzoLoading, setEimzoLoading] = useState(false)
  const eimzoFileRef = useRef<HTMLInputElement>(null)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const m = error.message.toLowerCase()
      if (m.includes('email not confirmed') || m.includes('not confirmed')) {
        setError(T({ uz: 'Email tasdiqlash havolasi yuborilgan edi. Iltimos, emailingizni tekshiring.', oz: 'Email тасдиқлаш ҳаволаси юборилган эди. Илтимос, emailингизни текширинг.', ru: 'Ссылка для подтверждения отправлена на email. Пожалуйста, проверьте почту.' }))
      } else {
        setError(T(t.login.error))
      }
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  async function handleEimzoLogin() {
    if (!eimzoFile) { setError('E-IMZO fayl tanlanmagan'); return }
    if (!eimzoPass) { setError('E-IMZO paroli kiritilmagan'); return }
    setEimzoLoading(true)
    setError('')
    try {
      // 1. Get challenge
      const { id: challengeId, challenge } = await fetch('/api/auth/eimzo/challenge').then(r => r.json())

      // 2. Parse .pfx
      const arrayBuffer = await eimzoFile.arrayBuffer()
      const pfxDer = forge.util.binary.raw.encode(new Uint8Array(arrayBuffer))
      const pfxAsn1 = forge.asn1.fromDer(pfxDer)
      let pfx: forge.pkcs12.Pkcs12Pfx
      try {
        pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, eimzoPass)
      } catch {
        setError('E-IMZO paroli noto\'g\'ri yoki fayl buzilgan')
        setEimzoLoading(false)
        return
      }

      // 3. Extract private key and certificate
      const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
      const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag })
      const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key as forge.pki.rsa.PrivateKey
      const certificate = certBags[forge.pki.oids.certBag]?.[0]?.cert

      if (!privateKey || !certificate) {
        setError('Kalit yoki sertifikat topilmadi')
        setEimzoLoading(false)
        return
      }

      // 4. Sign challenge
      const md = forge.md.sha256.create()
      md.update(challenge)
      const signature = privateKey.sign(md)

      // 5. Send to server
      const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).bytes()
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
      if (!res.ok) { setError(data.error || 'E-IMZO xatoligi'); setEimzoLoading(false); return }

      // 6. Set Supabase session
      await supabase.auth.setSession(data.session)
      router.push('/dashboard')
    } catch (e) {
      console.error(e)
      setError('E-IMZO orqali kirishda xatolik yuz berdi')
    }
    setEimzoLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Bosh sahifa + Til tanlash */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1">
            ← Bosh sahifa
          </Link>
          <div className="flex gap-1">
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 text-xs rounded-lg transition ${
                  lang === l
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-blue-400">Shartnoma.uz</Link>
          <h1 className="text-2xl font-bold text-white mt-4">{T(t.login.title)}</h1>
          <p className="text-gray-400 mt-2">{T(t.login.subtitle)}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* E-IMZO */}
          <div className="mb-4 border border-gray-700 rounded-xl p-4 bg-gray-800/50">
            <p className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <span>🔐</span> E-IMZO bilan kirish
            </p>
            <div className="space-y-3">
              <div>
                <input
                  ref={eimzoFileRef}
                  type="file"
                  accept=".pfx,.p12"
                  onChange={e => setEimzoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => eimzoFileRef.current?.click()}
                  className="w-full text-left bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg px-4 py-2.5 hover:border-blue-500 transition truncate"
                >
                  {eimzoFile ? eimzoFile.name : 'PFX fayl tanlang...'}
                </button>
              </div>
              <input
                type="password"
                value={eimzoPass}
                onChange={e => setEimzoPass(e.target.value)}
                placeholder="E-IMZO paroli"
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleEimzoLogin}
                disabled={eimzoLoading || !eimzoFile}
                className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                {eimzoLoading ? 'Tekshirilmoqda...' : 'E-IMZO orqali kirish'}
              </button>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {T(t.login.googleBtn)}
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-gray-500 text-sm">{T(t.login.or)}</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{T(t.login.password)}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition"
            >
              {loading ? T(t.btn.loading) : T(t.login.submit)}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            {T(t.login.noAccount)}{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300">
              {T(t.login.signupLink)}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
