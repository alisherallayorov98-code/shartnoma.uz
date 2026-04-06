'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, LANG_LABELS, type Lang } from '@/lib/i18n'

// Signup-only marketing content (not in global i18n)
const M: Record<Lang, { headline: string; sub: string; benefits: string[]; trust: string }> = {
  uz: {
    headline: 'Hujjatlaringizni AI bilan tayyorlang',
    sub: 'Kadrlar, buxgalter, kotiba va yurist uchun professional hujjatlar — Word va PDF formatida.',
    benefits: [
      '30+ shablon: mehnat shartnomasi, buyruq, bayonnoma',
      'AI yordamchi: tavsiflab bering, hujjat tayyor',
      'Oyiga 5 ta hujjat bepul',
    ],
    trust: "Kredit karta talab qilinmaydi · O'rnatish shart emas",
  },
  oz: {
    headline: 'Ҳужжатларингизни AI билан тайёрланг',
    sub: 'Кадрлар, бухгалтер, котиба ва юрист учун профессионал ҳужжатлар — Word ва PDF форматида.',
    benefits: [
      '30+ шаблон: меҳнат шартномаси, буйруқ, баённома',
      'AI ёрдамчи: тавсифлаб беринг, ҳужжат тайёр',
      'Ойига 5 та ҳужжат бепул',
    ],
    trust: 'Кредит карта талаб қилинмайди · Ўрнатиш шарт эмас',
  },
  ru: {
    headline: 'Создавайте документы с помощью AI',
    sub: 'Профессиональные документы для кадров, бухгалтерии, секретариата и юриста — Word и PDF.',
    benefits: [
      '30+ шаблонов: трудовой договор, приказ, протокол',
      'AI-ассистент: опишите — документ готов',
      '5 документов в месяц — бесплатно',
    ],
    trust: 'Карта не требуется · Установка не нужна',
  },
}

const BACK: Record<Lang, string> = { uz: 'Bosh sahifa', oz: 'Бош саҳифа', ru: 'На главную' }

export default function SignupPage() {
  const router = useRouter()
  const { lang, setLang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  function translateSupabaseError(msg: string): string {
    const m = msg.toLowerCase()
    if (m.includes('already registered') || m.includes('user already exists'))
      return T({ uz: "Bu email allaqachon ro'yxatdan o'tgan", oz: 'Бу email аллақачон рўйхатдан ўтган', ru: 'Этот email уже зарегистрирован' })
    if (m.includes('rate limit') || m.includes('too many'))
      return T({ uz: "Juda ko'p urinish. Bir oz kutib, qayta urinib ko'ring", oz: 'Жуда кўп уриниш. Бир оз кутиб, қайта уриниб кўринг', ru: 'Слишком много попыток. Подождите и повторите' })
    if (m.includes('invalid email') || m.includes('email is invalid'))
      return T({ uz: "Noto'g'ri email manzil", oz: 'Нотўғри email манзил', ru: 'Некорректный email адрес' })
    if (m.includes('password') && (m.includes('weak') || m.includes('short') || m.includes('6')))
      return T({ uz: 'Parol juda zaif. Kamida 8 belgi ishlatish tavsiya etiladi', oz: 'Парол жуда заиф. Камида 8 белги ишлатиш тавсия этилади', ru: 'Пароль слишком слабый. Рекомендуется минимум 8 символов' })
    if (m.includes('disabled') || m.includes('not allowed'))
      return T({ uz: "Ro'yxatdan o'tish hozircha o'chirilgan", oz: 'Рўйхатдан ўтиш ҳозирча ўчирилган', ru: 'Регистрация временно отключена' })
    if (m.includes('network') || m.includes('fetch'))
      return T({ uz: 'Tarmoq xatoligi. Internet aloqasini tekshiring', oz: 'Тармоқ хатолиги. Интернет алоқасини текширинг', ru: 'Ошибка сети. Проверьте подключение к интернету' })
    return T({ uz: "Ro'yxatdan o'tishda xatolik yuz berdi. Qayta urinib ko'ring", oz: 'Рўйхатдан ўтишда хатолик юз берди. Қайта уриниб кўринг', ru: 'Ошибка при регистрации. Попробуйте ещё раз' })
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError(T(t.signup.mismatch)); return }
    if (password.length < 8)  { setError(T(t.signup.shortPass)); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/login' },
    })
    if (error) setError(translateSupabaseError(error.message))
    else setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
  }

  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-600 transition'

  // ── Success screen ────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">{T(t.signup.verifyTitle)}</h2>
          <p className="text-gray-500 text-sm mb-1.5">
            <span className="text-gray-200 font-medium">{email}</span>
          </p>
          <p className="text-gray-500 text-sm mb-8">{T(t.signup.verifyText)}</p>
          <Link href="/login" className="text-sm text-blue-400 hover:text-blue-300 transition">
            {T(t.signup.goLogin)}
          </Link>
        </div>
      </div>
    )
  }

  // ── Main layout ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col lg:flex-row">

      {/* ── LEFT: Brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between px-12 py-10 border-r border-[#1E293B] relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 -left-24 w-72 h-72 bg-blue-600/6 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-4 w-56 h-56 bg-blue-500/4 rounded-full blur-3xl" />
        </div>

        {/* Logo + lang */}
        <div className="relative flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-900/40">S</div>
            <span className="text-white font-bold text-lg tracking-tight">Kabinetim.uz</span>
          </Link>
          <div className="flex gap-1">
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs rounded-lg transition ${lang === l ? 'bg-blue-600 text-white' : 'bg-[#1F2937] text-gray-400 hover:text-white'}`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Value proposition */}
        <div className="relative space-y-7">
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">AI · SaaS · O'zbekiston</p>
            <h2 className="text-[1.75rem] font-bold text-white leading-snug mb-4">{M[lang].headline}</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{M[lang].sub}</p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {M[lang].benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue-600/15 border border-blue-600/25 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span className="text-gray-300 text-sm">{b}</span>
              </div>
            ))}
          </div>

          {/* Dept tags */}
          <div className="flex flex-wrap gap-2">
            {['📄 Word / PDF', '🤖 AI', '👥 Kadrlar', '💼 Buxgalter', '🗂️ Kotiba', '⚖️ Yurist'].map(d => (
              <span key={d} className="text-xs bg-[#111827] border border-[#1E293B] text-gray-400 px-2.5 py-1 rounded-lg">{d}</span>
            ))}
          </div>
        </div>

        {/* Trust footer */}
        <div className="relative">
          <p className="text-xs text-gray-600">{M[lang].trust}</p>
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="flex-1 flex flex-col">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-5 pt-6 pb-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">S</div>
            <span className="text-white font-semibold text-sm">Kabinetim.uz</span>
          </Link>
          <div className="flex gap-1">
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs rounded-lg transition ${lang === l ? 'bg-blue-600 text-white' : 'bg-[#1F2937] text-gray-400'}`}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 lg:px-12">
          <div className="w-full max-w-[400px]">

            {/* Back link */}
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition mb-7">
              ← {BACK[lang]}
            </Link>

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-white mb-1.5">{T(t.signup.title)}</h1>
              <p className="text-gray-400 text-sm">{T(t.signup.subtitle)}</p>
            </div>

            {/* Form card */}
            <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 shadow-2xl shadow-black/40">

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm leading-relaxed">
                  {error}
                </div>
              )}

              {/* Google button */}
              <button onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-xl transition text-sm mb-5 shadow-sm">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {T(t.signup.googleBtn)}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[#1E293B]" />
                <span className="text-gray-600 text-xs">{T(t.signup.or)}</span>
                <div className="flex-1 h-px bg-[#1E293B]" />
              </div>

              {/* Email/password form */}
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required className={inp} placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{T(t.signup.password)}</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required className={inp} placeholder={T(t.signup.passwordHint)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">{T(t.signup.confirmPw)}</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    required className={inp} placeholder="••••••••" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm mt-1">
                  {loading ? T(t.btn.loading) : T(t.signup.submit)}
                </button>
              </form>

              {/* Login link */}
              <p className="text-center text-gray-500 text-xs mt-5">
                {T(t.signup.hasAccount)}{' '}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 transition font-medium">
                  {T(t.signup.loginLink)}
                </Link>
              </p>
            </div>

            {/* Mobile trust note */}
            <p className="lg:hidden text-center text-xs text-gray-600 mt-5">{M[lang].trust}</p>

          </div>
        </div>
      </div>

    </div>
  )
}
