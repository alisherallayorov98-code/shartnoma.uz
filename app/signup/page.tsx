'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/lib/LanguageContext'
import { t, tr, LANG_LABELS, type Lang } from '@/lib/i18n'
import { FileText, Bot, Users, CheckCircle2, Eye, EyeOff, ArrowLeft } from 'lucide-react'

// ── Typing animation words ───────────────────────────────────────────────────
const TYPING_WORDS: Record<Lang, string[]> = {
  uz: ['shartnomalar', 'hujjatlar', 'buyruqlar', 'bayonnomalar', 'aktlar'],
  oz: ['шартномалар', 'ҳужжатлар', 'буйруқлар', 'баённомалар', 'актлар'],
  ru: ['договоры', 'документы', 'приказы', 'протоколы', 'акты'],
}

// ── Confetti pieces (predefined) ─────────────────────────────────────────────
const CONFETTI_PIECES = [
  { left: '8%',  delay: '0s',    color: '#3B82F6', size: 8,  rotate: 30  },
  { left: '18%', delay: '0.2s',  color: '#10B981', size: 6,  rotate: 60  },
  { left: '28%', delay: '0.1s',  color: '#F59E0B', size: 10, rotate: 120 },
  { left: '38%', delay: '0.3s',  color: '#6366F1', size: 7,  rotate: 45  },
  { left: '50%', delay: '0.15s', color: '#EC4899', size: 9,  rotate: 90  },
  { left: '60%', delay: '0.25s', color: '#14B8A6', size: 6,  rotate: 150 },
  { left: '70%', delay: '0.05s', color: '#F97316', size: 8,  rotate: 75  },
  { left: '80%', delay: '0.35s', color: '#8B5CF6', size: 7,  rotate: 30  },
  { left: '90%', delay: '0.2s',  color: '#EF4444', size: 6,  rotate: 100 },
  { left: '13%', delay: '0.4s',  color: '#22C55E', size: 9,  rotate: 55  },
  { left: '44%', delay: '0.18s', color: '#3B82F6', size: 6,  rotate: 80  },
  { left: '63%', delay: '0.28s', color: '#F59E0B', size: 8,  rotate: 135 },
  { left: '84%', delay: '0.08s', color: '#EC4899', size: 7,  rotate: 20  },
  { left: '23%', delay: '0.32s', color: '#6366F1', size: 10, rotate: 65  },
  { left: '54%', delay: '0.12s', color: '#10B981', size: 6,  rotate: 110 },
]

// ── Avatar stack ─────────────────────────────────────────────────────────────
const AVATARS = [
  { initials: 'AZ', bg: 'bg-blue-500' },
  { initials: 'MK', bg: 'bg-emerald-500' },
  { initials: 'SH', bg: 'bg-violet-500' },
  { initials: 'NR', bg: 'bg-amber-500' },
  { initials: 'BT', bg: 'bg-rose-500' },
]

// ── Password strength ─────────────────────────────────────────────────────────
function getPasswordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels: Record<number, Record<Lang, string>> = {
    0: { uz: '', oz: '', ru: '' },
    1: { uz: 'Juda zaif', oz: 'Жуда заиф', ru: 'Очень слабый' },
    2: { uz: 'Zaif', oz: 'Заиф', ru: 'Слабый' },
    3: { uz: "O'rtacha", oz: 'Ўртача', ru: 'Средний' },
    4: { uz: 'Kuchli', oz: 'Кучли', ru: 'Сильный' },
  }
  const colors = ['', '#EF4444', '#F97316', '#EAB308', '#22C55E']
  return { score, label: labels[score], color: colors[score] ?? '' }
}

// ── Floating mock document card ───────────────────────────────────────────────
function MockDocCard({ title, type, lines, animDelay }: { title: string; type: string; lines: number[]; animDelay: string }) {
  return (
    <div className="bg-[#0F172A]/90 backdrop-blur-sm border border-white/10 rounded-xl p-3.5 shadow-xl"
      style={{ animation: `floatCard 6s ease-in-out ${animDelay} infinite` }}>
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white truncate">{title}</div>
          <div className="text-[10px] text-gray-500">{type}</div>
        </div>
      </div>
      <div className="space-y-1.5">
        {lines.map((w, i) => (
          <div key={i} className="h-1.5 bg-[#1E293B] rounded-full" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}

// ── Brand-panel copy ──────────────────────────────────────────────────────────
const M: Record<Lang, { headline1: string; sub: string; benefits: { icon: React.ElementType; text: string }[]; trust: string }> = {
  uz: {
    headline1: 'AI bilan yarating',
    sub: "Kadrlar, buxgalter, kotiba va yurist uchun professional hujjatlar — Word va PDF formatida.",
    benefits: [
      { icon: FileText, text: "30+ shablon: mehnat shartnomasi, buyruq, bayonnoma" },
      { icon: Bot,      text: "AI yordamchi: tavsiflab bering, hujjat tayyor" },
      { icon: Users,    text: "Oyiga 5 ta hujjat bepul, karta talab qilinmaydi" },
    ],
    trust: "Kredit karta talab qilinmaydi · O'rnatish shart emas",
  },
  oz: {
    headline1: 'AI билан яратинг',
    sub: 'Кадрлар, бухгалтер, котиба ва юрист учун профессионал ҳужжатлар — Word ва PDF форматида.',
    benefits: [
      { icon: FileText, text: '30+ шаблон: меҳнат шартномаси, буйруқ, баённома' },
      { icon: Bot,      text: 'AI ёрдамчи: тавсифлаб беринг, ҳужжат тайёр' },
      { icon: Users,    text: 'Ойига 5 та ҳужжат бепул, карта талаб қилинмайди' },
    ],
    trust: 'Кредит карта талаб қилинмайди · Ўрнатиш шарт эмас',
  },
  ru: {
    headline1: 'Создавайте с AI',
    sub: 'Профессиональные документы для кадров, бухгалтерии, секретариата и юриста — Word и PDF.',
    benefits: [
      { icon: FileText, text: '30+ шаблонов: трудовой договор, приказ, протокол' },
      { icon: Bot,      text: 'AI-ассистент: опишите — документ готов' },
      { icon: Users,    text: '5 документов в месяц бесплатно, карта не нужна' },
    ],
    trust: 'Карта не требуется · Установка не нужна',
  },
}

const BACK: Record<Lang, string> = { uz: 'Bosh sahifa', oz: 'Бош саҳифа', ru: 'На главную' }

const KEYFRAMES = `
  @keyframes floatCard {
    0%, 100% { transform: translateY(0px);   }
    50%       { transform: translateY(-10px); }
  }
  @keyframes blobPulse {
    0%, 100% { transform: scale(1)    translate(0,     0);   }
    33%       { transform: scale(1.1)  translate(20px, -20px); }
    66%       { transform: scale(0.95) translate(-10px, 15px); }
  }
  @keyframes badgePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
    50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
  }
  @keyframes gradientBtn {
    0%, 100% { background-position: 0%   50%; }
    50%       { background-position: 100% 50%; }
  }
  @keyframes pulseRing {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
    50%       { box-shadow: 0 0 0 10px rgba(34,197,94,0); }
  }
  @keyframes confettiFall {
    0%   { top: -12px; opacity: 1; transform: rotate(0deg)   translateX(0);    }
    100% { top: 105vh; opacity: 0; transform: rotate(720deg) translateX(40px); }
  }
  .gradient-btn {
    background: linear-gradient(135deg, #3B82F6, #6366F1, #8B5CF6);
    background-size: 200% 200%;
    animation: gradientBtn 4s ease infinite;
    transition: opacity .2s;
  }
  .gradient-btn:hover { opacity: .9; }
  .gradient-btn:disabled { opacity: .5; animation: none; background: #374151; }
`

export default function SignupPage() {
  const { lang, setLang } = useLang()
  const T = (obj: Record<Lang, string>) => tr(obj, lang)

  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [confirm,        setConfirm]        = useState('')
  const [showPw,         setShowPw]         = useState(false)
  const [showCf,         setShowCf]         = useState(false)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState('')
  const [success,        setSuccess]        = useState(false)
  const [resendSent,     setResendSent]     = useState(false)
  const [resendLoading,  setResendLoading]  = useState(false)

  // Typing animation
  const [typedWord,   setTypedWord]   = useState('')
  const [wordIdx,     setWordIdx]     = useState(0)
  const [isDeleting,  setIsDeleting]  = useState(false)

  const pwStrength = getPasswordStrength(password)

  useEffect(() => {
    const words   = TYPING_WORDS[lang]
    const current = words[wordIdx % words.length]

    // Full word shown — wait then start deleting
    if (!isDeleting && typedWord === current) {
      const id = setTimeout(() => setIsDeleting(true), 2000)
      return () => clearTimeout(id)
    }

    const speed = isDeleting ? 55 : 110
    const id = setTimeout(() => {
      if (!isDeleting) {
        setTypedWord(current.slice(0, typedWord.length + 1))
      } else if (typedWord.length > 0) {
        setTypedWord(current.slice(0, typedWord.length - 1))
      } else {
        setIsDeleting(false)
        setWordIdx(i => (i + 1) % words.length)
      }
    }, speed)
    return () => clearTimeout(id)
  }, [typedWord, isDeleting, wordIdx, lang])

  function translateSupabaseError(msg: string): string {
    const m = msg.toLowerCase()
    if (m.includes('already registered') || m.includes('user already exists'))
      return T({ uz: "Bu email allaqachon ro'yxatdan o'tgan", oz: 'Бу email аллақачон рўйхатдан ўтган', ru: 'Этот email уже зарегистрирован' })
    if (m.includes('rate limit') || m.includes('too many'))
      return T({ uz: "Juda ko'p urinish. Biroz kutib, qayta urinib ko'ring", oz: 'Жуда кўп уриниш. Бир оз кутиб, қайта уриниб кўринг', ru: 'Слишком много попыток. Подождите и повторите' })
    if (m.includes('invalid email') || m.includes('email is invalid'))
      return T({ uz: "Noto'g'ri email manzil", oz: 'Нотўғри email манзил', ru: 'Некорректный email адрес' })
    if (m.includes('password') && (m.includes('weak') || m.includes('short') || m.includes('6')))
      return T({ uz: 'Parol juda zaif. Kamida 8 belgi ishlatish tavsiya etiladi', oz: 'Парол жуда заиф. Камида 8 белги ишлатиш тавсия этилади', ru: 'Пароль слишком слабый. Рекомендуется минимум 8 символов' })
    if (m.includes('disabled') || m.includes('not allowed'))
      return T({ uz: "Ro'yxatdan o'tish hozircha o'chirilgan", oz: 'Рўйхатдан ўтиш ҳозирча ўчирилган', ru: 'Регистрация временно отключена' })
    if (m.includes('network') || m.includes('fetch'))
      return T({ uz: 'Tarmoq xatoligi. Internet aloqasini tekshiring', oz: 'Тармоқ хатолиги. Интернет алоқасини текширинг', ru: 'Ошибка сети. Проверьте подключение к интернету' })
    return T({ uz: "Ro'yxatdan o'tishda xatolik. Qayta urinib ko'ring", oz: 'Рўйхатдан ўтишда хатолик. Қайта уриниб кўринг', ru: 'Ошибка при регистрации. Попробуйте ещё раз' })
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
    else       setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    })
  }

  async function handleResend() {
    if (resendLoading || resendSent) return
    setResendLoading(true)
    await supabase.auth.resend({ type: 'signup', email })
    setResendLoading(false)
    setResendSent(true)
  }

  const inp = 'w-full bg-white/[0.05] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 placeholder-gray-600 transition'

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center px-4 overflow-hidden relative">
        <style>{KEYFRAMES}</style>

        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {CONFETTI_PIECES.map((p, i) => (
            <div key={i} className="absolute"
              style={{
                left: p.left, top: '-12px',
                width: p.size, height: Math.round(p.size * 1.5),
                backgroundColor: p.color, borderRadius: 2,
                animation: `confettiFall 3.5s ease-in ${p.delay} forwards`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-sm w-full">
          {/* Icon */}
          <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ animation: 'pulseRing 2s ease-in-out infinite' }}>
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{T(t.signup.verifyTitle)}</h2>
          <p className="text-sm text-gray-400 mb-1">
            <span className="text-blue-300 font-medium">{email}</span>
          </p>
          <p className="text-sm text-gray-500 mb-8">{T(t.signup.verifyText)}</p>

          {/* Onboarding steps */}
          <div className="bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl p-5 mb-6 text-left">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              {T({ uz: 'Keyingi qadamlar', oz: 'Кейинги қадамлар', ru: 'Следующие шаги' })}
            </p>
            {[
              {
                n: 1,
                text: {
                  uz: 'Emailingizni tekshiring va tasdiqlash havolasini bosing',
                  oz: 'Emailingizni текширинг ва тасдиқлаш ҳаволасини босинг',
                  ru: 'Проверьте email и нажмите ссылку подтверждения',
                },
              },
              {
                n: 2,
                text: {
                  uz: "Tashkilotingizni yarating yoki qo'shing",
                  oz: 'Ташкилотингизни яратинг ёки қўшинг',
                  ru: 'Создайте или добавьте вашу организацию',
                },
              },
              {
                n: 3,
                text: {
                  uz: 'Birinchi shartnomangizni yarating — 5 daqiqada',
                  oz: 'Биринчи шартномангизни яратинг — 5 дақиқада',
                  ru: 'Создайте первый договор — за 5 минут',
                },
              },
            ].map(step => (
              <div key={step.n} className="flex items-start gap-3 mb-3 last:mb-0">
                <div className="w-6 h-6 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-400 mt-0.5">
                  {step.n}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{T(step.text)}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            <Link href="/login"
              className="gradient-btn px-8 py-3 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-900/30">
              {T(t.signup.goLogin)}
            </Link>
            <button onClick={handleResend} disabled={resendSent || resendLoading}
              className="text-xs text-gray-500 hover:text-gray-400 transition disabled:opacity-50 disabled:cursor-default">
              {resendSent
                ? T({ uz: 'Xat qayta yuborildi ✓', oz: 'Хат қайта юборилди ✓', ru: 'Письмо отправлено повторно ✓' })
                : resendLoading
                  ? T({ uz: 'Yuborilmoqda…', oz: 'Юборилмоқда…', ru: 'Отправка…' })
                  : T({ uz: "Xat kelmadimi? Qayta yuborish", oz: 'Хат келмадими? Қайта юбориш', ru: 'Не получили письмо? Отправить повторно' })
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{KEYFRAMES}</style>

      <div className="min-h-screen bg-[#0B1220] flex flex-col lg:flex-row">

        {/* ── LEFT: Animated brand panel ── */}
        <div className="hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between px-10 py-10 border-r border-[#1E293B] relative overflow-hidden">

          {/* Animated gradient blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 -left-24 w-80 h-80 bg-blue-600/12 rounded-full blur-3xl"
              style={{ animation: 'blobPulse 9s ease-in-out 0s infinite' }} />
            <div className="absolute bottom-1/3 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl"
              style={{ animation: 'blobPulse 11s ease-in-out 2s infinite' }} />
            <div className="absolute top-2/3 left-1/3 w-52 h-52 bg-indigo-600/8 rounded-full blur-3xl"
              style={{ animation: 'blobPulse 7s ease-in-out 1s infinite' }} />
            {/* Subtle dot grid */}
            <div className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }} />
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
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">
                AI · SaaS · O&apos;zbekiston
              </p>
              {/* Headline with typing animation */}
              <h2 className="text-[1.85rem] font-bold text-white leading-tight mb-3">
                {M[lang].headline1}{' '}
                <span className="text-blue-400">
                  {typedWord}
                  <span className="opacity-70 animate-pulse">|</span>
                </span>
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">{M[lang].sub}</p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              {M[lang].benefits.map((b, i) => {
                const Icon = b.icon
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600/15 border border-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-gray-300 text-sm leading-relaxed pt-1.5">{b.text}</span>
                  </div>
                )
              })}
            </div>

            {/* Floating mock document cards */}
            <div className="relative h-32">
              <div className="absolute left-0 w-48 top-0">
                <MockDocCard title="Mehnat shartnomasi" type="Word · PDF" lines={[80, 60, 90, 45]} animDelay="0s" />
              </div>
              <div className="absolute right-4 top-3 w-44">
                <MockDocCard title="Buyruq №12" type="Kadrlar" lines={[70, 85, 55]} animDelay="1.8s" />
              </div>
            </div>

            {/* Social proof: avatars + counter + stars */}
            <div className="flex items-center gap-5">
              {/* Avatar stack */}
              <div className="flex items-center">
                {AVATARS.map((a, i) => (
                  <div key={i}
                    className={`w-8 h-8 rounded-full border-2 border-[#0B1220] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${a.bg}`}
                    style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: AVATARS.length - i }}>
                    {a.initials}
                  </div>
                ))}
              </div>
              {/* Count */}
              <div>
                <div className="text-white font-bold text-sm">500+</div>
                <div className="text-gray-500 text-xs">{T({ uz: 'foydalanuvchi', oz: 'фойдаланувчи', ru: 'пользователей' })}</div>
              </div>
              {/* Stars */}
              <div className="ml-auto flex flex-col items-end">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <svg key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">4.9 / 5.0</div>
              </div>
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
            <div className="w-full max-w-[420px]">

              {/* Back link */}
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition mb-6">
                <ArrowLeft className="w-3.5 h-3.5" />
                {BACK[lang]}
              </Link>

              {/* Free offer badge */}
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5"
                  style={{ animation: 'badgePulse 2.5s ease-in-out infinite' }}>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-green-300 text-xs font-semibold">
                    {T({ uz: 'Bepul boshlash — karta shart emas', oz: 'Бепул бошлаш — карта шарт эмас', ru: 'Бесплатный старт — карта не нужна' })}
                  </span>
                </div>
              </div>

              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-1.5">{T(t.signup.title)}</h1>
                <p className="text-gray-400 text-sm">{T(t.signup.subtitle)}</p>
              </div>

              {/* Glassmorphism form card */}
              <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/60">
                {/* Inner gradient glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/[0.06] to-violet-600/[0.04] pointer-events-none" />

                <div className="relative">
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
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-gray-600 text-xs">{T(t.signup.or)}</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        required className={inp} placeholder="email@example.com" />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">{T(t.signup.password)}</label>
                      <div className="relative">
                        <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                          required className={inp + ' pr-11'} placeholder={T(t.signup.passwordHint)} />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {/* Password strength bar */}
                      {password.length > 0 && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                                style={{ backgroundColor: i <= pwStrength.score ? pwStrength.color : '#1E293B' }} />
                            ))}
                          </div>
                          {pwStrength.score > 0 && (
                            <p className="text-xs transition-colors" style={{ color: pwStrength.color }}>
                              {T(pwStrength.label)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">{T(t.signup.confirmPw)}</label>
                      <div className="relative">
                        <input type={showCf ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                          required className={inp + ' pr-11'} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowCf(!showCf)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                          {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Gradient submit button */}
                    <button type="submit" disabled={loading}
                      className="gradient-btn w-full text-white font-semibold py-3 rounded-xl text-sm mt-1 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2">
                      {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
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
              </div>

              {/* Mobile trust note */}
              <p className="lg:hidden text-center text-xs text-gray-600 mt-5">{M[lang].trust}</p>

            </div>
          </div>
        </div>

      </div>
    </>
  )
}
