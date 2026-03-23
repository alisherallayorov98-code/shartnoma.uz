'use client'

import Link from 'next/link'
import {
  FileText, Building2, Users, Download, Copy, Shield,
  CheckCircle, ArrowRight, Zap, Star, Crown, Sparkles,
  Clock, TrendingUp, Lock, ChevronRight
} from 'lucide-react'
import { useLang } from '@/lib/LanguageContext'
import { LANG_LABELS, type Lang } from '@/lib/i18n'

const LP: Record<Lang, {
  badge: string; h1a: string; h1b: string; h1c: string; h1d: string; h1e: string
  subtitle: string; cta: string; how: string; freeNote: string
  statsLabels: string[]; featuresTag: string; featuresTitle: string; featuresSub: string
  features: { title: string; desc: string }[]
  howTag: string; howTitle: string
  steps: { title: string; desc: string }[]
  typesTitle: string; typesSub: string
  typeNames: string[]
  pricingTag: string; pricingTitle: string; pricingSub: string
  perMonth: string; tryIt: string; forOrg: string; forCorp: string
  freePlan: string; stdPlan: string; aiPlan: string
  popular: string; comingSoon: string
  freeFeatures: string[]; stdFeatures: string[]; aiFeatures: string[]
  startFree: string; start: string; signup: string; payNote: string
  trustTitle: string; trust: { title: string; desc: string }[]
  ctaTitle: string; ctaSub: string; ctaBtn: string; ctaNote: string
  nav: string[]; footerLinks: string[]; login: string; loginShort: string
}> = {
  uz: {
    badge: "O'zbekistondagi birinchi AI-yordamchi hujjat tizimi",
    h1a: "Hujjatlarni", h1b: "AI bilan", h1c: " tez va ", h1d: "professional", h1e: "yarating",
    subtitle: "Shartnomalar, buyruqlar, kadrlar va buxgalteriya hujjatlari — barchasi bir tizimda. PDF va Word tayyor.",
    cta: "Bepul boshlash", how: "Qanday ishlaydi?",
    freeNote: "Oyiga 5 ta shartnoma — bepul. Kredit karta kerak emas.",
    statsLabels: ["Hujjat turi", "O'rtacha yaratish vaqti", "Ma'lumotlar xavfsizligi"],
    featuresTag: "IMKONIYATLAR", featuresTitle: "Nima uchun Shartnoma.uz?",
    featuresSub: "Faqat shartnoma emas — butun tashkilot hujjat aylanmasi bitta tizimda",
    features: [
      { title: "AI Yordamchi", desc: "Kadrlar, buxgalter, kotiba va yurist bo'limlari uchun AI. Hujjatni tavsiflab bering — tayyor." },
      { title: "Ko'p tashkilot", desc: "Bitta hisobda bir nechta tashkilotni boshqaring. Buxgalterlar uchun ideal yechim." },
      { title: "Kontragentlar bazasi", desc: "STR yoki nom bo'yicha qidiring. Bir marta kiriting — har safar avtomatik to'ladi." },
      { title: "PDF va Word eksport", desc: "Professional PDF va to'g'ri formatlangan Word hujjat. Imzo, muhr, rekvizitlar avtomatik." },
      { title: "Kadrlar va kotiba", desc: "Mehnat shartnomasi, buyruqlar, bayonnoma, rasmiy xat — 30+ shablon tayyor." },
      { title: "To'liq xavfsizlik", desc: "Har bir foydalanuvchi faqat o'z ma'lumotlarini ko'radi. Shifrlangan saqlash." },
    ],
    howTag: "QANDAY ISHLAYDI", howTitle: "3 qadam — hujjat tayyor",
    steps: [
      { title: "Ro'yxatdan o'ting", desc: "Bepul hisob oching. Tashkilot rekvizitlarini bir marta kiriting." },
      { title: "Bo'limni tanlang", desc: "Shartnomalar, kadrlar, buxgalter, kotiba yoki yurist — kerakli bo'limga o'ting." },
      { title: "Hujjat yarating", desc: "Shablon tanlang yoki AI ga tavsif bering — PDF/Word bir daqiqada tayyor!" },
    ],
    typesTitle: "Shartnoma turlari", typesSub: "Eng ko'p ishlatiladigan 8 tur tayyor",
    typeNames: ["Oldi-sotdi", "Xizmat ko'rsatish", "Ijara", "Pudrat", "Qo'shimcha", "Moliyaviy yordam", "Daval", "Xalqaro"],
    pricingTag: "NARXLAR", pricingTitle: "Har bir tashkilot uchun", pricingSub: "Arzon, shaffof, adolatli narx",
    perMonth: "so'm / oyiga", tryIt: "Sinab ko'rish uchun", forOrg: "Har bir tashkilot uchun", forCorp: "Korporativ va professional uchun",
    freePlan: "Bepul", stdPlan: "Standart", aiPlan: "AI Pro",
    popular: "🔥 Mashhur", comingSoon: "⭐ Premium",
    freeFeatures: ["Oyiga 5 ta shartnoma", "8 tur shartnoma", "PDF va Word yuklab olish", "Kontragentlar bazasi", "Shartnoma.uz belgili PDF"],
    stdFeatures: ["Cheksiz shartnomalar", "8 tur shartnoma", "Reklama belgisisiz PDF va Word", "Imzo va muhr avtomatik", "Nusxa olish funksiyasi", "Bir nechta bank hisob", "Ustunlik qo'llab-quvvatlash"],
    aiFeatures: ["Standart tarifning hammasi", "AI shartnoma tahlili va tuzatish", "Kadrlar AI — 15+ hujjat turi", "Buxgalter AI — dalolatnoma, talabnoma", "Kotiba AI — buyruqlar, bayonnoma, xatlar", "Yurist AI — risk tahlili, grammatika", "Ustuvor qo'llab-quvvatlash"],
    startFree: "Bepul boshlash", start: "Boshlash →", signup: "Ro'yxatdan o'tish →",
    payNote: "To'lov: Telegram orqali. Aktivatsiya 24 soat ichida.",
    trustTitle: "Ishonch asosida qurilgan",
    trust: [
      { title: "Ma'lumotlar xavfsiz", desc: "Har bir foydalanuvchi faqat o'z ma'lumotlarini ko'radi. Supabase RLS himoyasi." },
      { title: "Shifrlangan saqlash", desc: "Barcha ma'lumotlar shifrlangan holda saqlanadi. Uchinchi shaxs kira olmaydi." },
      { title: "Doim mavjud", desc: "99.9% uptime kafolati. Vercel va Supabase infratuzilmasi asosida." },
    ],
    ctaTitle: "Bugun boshlang",
    ctaSub: "Word hujjatlariga sarflangan vaqtni biznesni rivojlantirishga sarflang. Kadrlar, buxgalter, kotiba — hammasi bitta tizimda.",
    ctaBtn: "Bepul ro'yxatdan o'tish", ctaNote: "Kredit karta talab qilinmaydi · O'rnatish shart emas",
    nav: ["Imkoniyatlar", "Qanday ishlaydi", "Narxlar"],
    footerLinks: ["Imkoniyatlar", "Narxlar", "Kirish", "Ro'yxatdan o'tish"],
    login: "Kirish", loginShort: "Kirish",
  },
  oz: {
    badge: "Ўзбекистондаги биринчи AI-ёрдамчи ҳужжат тизими",
    h1a: "Ҳужжатларни", h1b: "AI билан", h1c: " тез ва ", h1d: "профессионал", h1e: "яратинг",
    subtitle: "Шартномалар, буйруқлар, кадрлар ва бухгалтерия ҳужжатлари — барчаси бир тизимда. PDF ва Word тайёр.",
    cta: "Бепул бошлаш", how: "Қандай ишлайди?",
    freeNote: "Ойига 5 та шартнома — бепул. Кредит карта керак эмас.",
    statsLabels: ["Ҳужжат тури", "Ўртача яратиш вақти", "Маълумотлар хавфсизлиги"],
    featuresTag: "ИМКОНИЯТЛАР", featuresTitle: "Нима учун Shartnoma.uz?",
    featuresSub: "Фақат шартнома эмас — бутун ташкилот ҳужжат айланмаси битта тизимда",
    features: [
      { title: "AI Ёрдамчи", desc: "Кадрлар, бухгалтер, котиба ва юрист бўлимлари учун AI. Ҳужжатни тавсифлаб беринг — тайёр." },
      { title: "Кўп ташкилот", desc: "Битта ҳисобда бир нечта ташкилотни бошқаринг. Бухгалтерлар учун идеал ечим." },
      { title: "Контрагентлар базаси", desc: "СТР ёки ном бўйича қидиринг. Бир марта киритинг — ҳар сафар автоматик тўлади." },
      { title: "PDF ва Word экспорт", desc: "Профессионал PDF ва тўғри форматланган Word ҳужжат. Имзо, муҳр, реквизитлар автоматик." },
      { title: "Кадрлар ва котиба", desc: "Меҳнат шартномаси, буйруқлар, баённома, расмий хат — 30+ шаблон тайёр." },
      { title: "Тўлиқ хавфсизлик", desc: "Ҳар бир фойдаланувчи фақат ўз маълумотларини кўради. Шифрланган сақлаш." },
    ],
    howTag: "ҚАНДАЙ ИШЛАЙДИ", howTitle: "3 қадам — ҳужжат тайёр",
    steps: [
      { title: "Рўйхатдан ўтинг", desc: "Бепул ҳисоб очинг. Ташкилот реквизитларини бир марта киритинг." },
      { title: "Бўлимни танланг", desc: "Шартномалар, кадрлар, бухгалтер, котиба ёки юрист — керакли бўлимга ўтинг." },
      { title: "Ҳужжат яратинг", desc: "Шаблон танланг ёки AI га тавсиф беринг — PDF/Word бир дақиқада тайёр!" },
    ],
    typesTitle: "Шартнома турлари", typesSub: "Энг кўп ишлатиладиган 8 тур тайёр",
    typeNames: ["Олди-сотди", "Хизмат кўрсатиш", "Ижара", "Пудрат", "Қўшимча", "Молиявий ёрдам", "Давал", "Халқаро"],
    pricingTag: "НАРХЛАР", pricingTitle: "Ҳар бир ташкилот учун", pricingSub: "Арзон, шаффоф, адолатли нарх",
    perMonth: "so'm / oyiga", tryIt: "Синаб кўриш учун", forOrg: "Ҳар бир ташкилот учун", forCorp: "Корпоратив ва профессионал учун",
    freePlan: "Бепул", stdPlan: "Стандарт", aiPlan: "AI Pro",
    popular: "🔥 Машҳур", comingSoon: "⭐ Premium",
    freeFeatures: ["Ойига 5 та шартнома", "8 тур шартнома", "PDF ва Word юклаб олиш", "Контрагентлар базаси", "Shartnoma.uz белгили PDF"],
    stdFeatures: ["Чексиз шартномалар", "8 тур шартнома", "Реклама белгисисиз PDF ва Word", "Имзо ва муҳр автоматик", "Нусха олиш функцияси", "Бир нечта банк ҳисоб", "Устунлик қўллаб-қувватлаш"],
    aiFeatures: ["Стандарт тарифнинг ҳаммаси", "AI шартнома таҳлили ва тузатиш", "Кадрлар AI — 15+ ҳужжат тури", "Бухгалтер AI — далолатнома, талабнома", "Котиба AI — буйруқлар, баённома, хатлар", "Юрист AI — хавф таҳлили, грамматика", "Устувор қўллаб-қувватлаш"],
    startFree: "Бепул бошлаш", start: "Бошлаш →", signup: "Рўйхатдан ўтиш →",
    payNote: "Тўлов: Telegram орқали. Активация 24 соат ичида.",
    trustTitle: "Ишонч асосида қурилган",
    trust: [
      { title: "Маълумотлар хавфсиз", desc: "Ҳар бир фойдаланувчи фақат ўз маълумотларини кўради. Supabase RLS ҳимояси." },
      { title: "Шифрланган сақлаш", desc: "Барча маълумотлар шифрланган ҳолда сақланади. Учинчи шахс кира олмайди." },
      { title: "Доим мавжуд", desc: "99.9% uptime кафолати. Vercel ва Supabase инфратузилмаси асосида." },
    ],
    ctaTitle: "Бугун бошланг",
    ctaSub: "Word ҳужжатларига сарфланган вақтни бизнесни ривожлантиришга сарфланг. Кадрлар, бухгалтер, котиба — ҳаммаси битта тизимда.",
    ctaBtn: "Бепул рўйхатдан ўтиш", ctaNote: "Кредит карта талаб қилинмайди · Ўрнатиш шарт эмас",
    nav: ["Имкониятлар", "Қандай ишлайди", "Нархлар"],
    footerLinks: ["Имкониятлар", "Нархлар", "Кириш", "Рўйхатдан ўтиш"],
    login: "Кириш", loginShort: "Кириш",
  },
  ru: {
    badge: "Первая AI-система документооборота в Узбекистане",
    h1a: "Создавайте документы", h1b: "с AI", h1c: " быстро и ", h1d: "профессионально", h1e: "",
    subtitle: "Договоры, приказы, кадровые и бухгалтерские документы — всё в одной системе. PDF и Word готовы.",
    cta: "Начать бесплатно", how: "Как это работает?",
    freeNote: "5 договоров в месяц — бесплатно. Карта не нужна.",
    statsLabels: ["Типов документов", "Среднее время создания", "Безопасность данных"],
    featuresTag: "ВОЗМОЖНОСТИ", featuresTitle: "Почему Shartnoma.uz?",
    featuresSub: "Не только договоры — весь документооборот организации в одной системе",
    features: [
      { title: "AI Ассистент", desc: "AI для кадров, бухгалтерии, секретариата и юриста. Опишите документ — готово." },
      { title: "Несколько организаций", desc: "Управляйте несколькими организациями в одном аккаунте. Идеально для бухгалтеров." },
      { title: "База контрагентов", desc: "Поиск по ИНН или названию. Введите один раз — каждый раз автоматически." },
      { title: "PDF и Word экспорт", desc: "Профессиональный PDF и правильно отформатированный Word. Подпись, печать, реквизиты автоматически." },
      { title: "Кадры и секретариат", desc: "Трудовой договор, приказы, протоколы, официальные письма — 30+ шаблонов готовы." },
      { title: "Полная безопасность", desc: "Каждый пользователь видит только свои данные. Зашифрованное хранение." },
    ],
    howTag: "КАК ЭТО РАБОТАЕТ", howTitle: "3 шага — документ готов",
    steps: [
      { title: "Зарегистрируйтесь", desc: "Создайте бесплатный аккаунт. Введите реквизиты организации один раз." },
      { title: "Выберите раздел", desc: "Договоры, кадры, бухгалтерия, секретариат или юрист — перейдите в нужный раздел." },
      { title: "Создайте документ", desc: "Выберите шаблон или опишите AI — PDF/Word готов за минуту!" },
    ],
    typesTitle: "Типы договоров", typesSub: "8 наиболее используемых типов готовы",
    typeNames: ["Купля-продажа", "Оказание услуг", "Аренда", "Подряд", "Дополнительное", "Финансовая помощь", "Давальческое", "Международный"],
    pricingTag: "ЦЕНЫ", pricingTitle: "Для каждой организации", pricingSub: "Доступные, прозрачные, справедливые цены",
    perMonth: "сум / в месяц", tryIt: "Для ознакомления", forOrg: "Для каждой организации", forCorp: "Для корпораций и профессионалов",
    freePlan: "Бесплатно", stdPlan: "Стандарт", aiPlan: "AI Pro",
    popular: "🔥 Популярный", comingSoon: "⭐ Premium",
    freeFeatures: ["5 договоров в месяц", "8 типов договоров", "Скачивание PDF и Word", "База контрагентов", "PDF с маркой Shartnoma.uz"],
    stdFeatures: ["Неограниченные договоры", "8 типов договоров", "PDF и Word без рекламы", "Автоматические подпись и печать", "Функция копирования", "Несколько банковских счетов", "Приоритетная поддержка"],
    aiFeatures: ["Всё из тарифа Стандарт", "AI-анализ и исправление договора", "Кадры AI — 15+ типов документов", "Бухгалтерия AI — акты, заявки", "Секретариат AI — приказы, протоколы, письма", "Юрист AI — анализ рисков, грамматика", "Приоритетная поддержка"],
    startFree: "Начать бесплатно", start: "Начать →", signup: "Зарегистрироваться →",
    payNote: "Оплата: через Telegram. Активация в течение 24 часов.",
    trustTitle: "Построено на доверии",
    trust: [
      { title: "Данные в безопасности", desc: "Каждый пользователь видит только свои данные. Защита Supabase RLS." },
      { title: "Зашифрованное хранение", desc: "Все данные хранятся в зашифрованном виде. Третьи лица не имеют доступа." },
      { title: "Всегда доступно", desc: "Гарантия uptime 99.9%. На базе инфраструктуры Vercel и Supabase." },
    ],
    ctaTitle: "Начните сегодня",
    ctaSub: "Время, потраченное на Word-документы, направьте на развитие бизнеса. Кадры, бухгалтерия, секретариат — всё в одной системе.",
    ctaBtn: "Зарегистрироваться бесплатно", ctaNote: "Карта не требуется · Установка не нужна",
    nav: ["Возможности", "Как работает", "Цены"],
    footerLinks: ["Возможности", "Цены", "Войти", "Регистрация"],
    login: "Войти", loginShort: "Войти",
  },
}

const FEATURES_ICONS = [
  <Zap key="zap" className="w-7 h-7"/>,
  <Building2 key="b2" className="w-7 h-7"/>,
  <Users key="users" className="w-7 h-7"/>,
  <Download key="dl" className="w-7 h-7"/>,
  <Copy key="copy" className="w-7 h-7"/>,
  <Shield key="shield" className="w-7 h-7"/>,
]
const FEATURES_STYLES = [
  { gradient:"from-yellow-500/20 to-orange-500/10", border:"border-yellow-500/20", iconColor:"text-yellow-400", iconBg:"bg-yellow-500/10" },
  { gradient:"from-blue-500/20 to-cyan-500/10",     border:"border-blue-500/20",   iconColor:"text-blue-400",   iconBg:"bg-blue-500/10"   },
  { gradient:"from-purple-500/20 to-pink-500/10",   border:"border-purple-500/20", iconColor:"text-purple-400", iconBg:"bg-purple-500/10" },
  { gradient:"from-emerald-500/20 to-teal-500/10",  border:"border-emerald-500/20",iconColor:"text-emerald-400",iconBg:"bg-emerald-500/10"},
  { gradient:"from-cyan-500/20 to-blue-500/10",     border:"border-cyan-500/20",   iconColor:"text-cyan-400",   iconBg:"bg-cyan-500/10"   },
  { gradient:"from-red-500/20 to-rose-500/10",      border:"border-red-500/20",    iconColor:"text-red-400",    iconBg:"bg-red-500/10"    },
]
const TYPE_ICONS = [
  <TrendingUp key="t" className="w-5 h-5"/>, <Zap key="z" className="w-5 h-5"/>,
  <Building2 key="b" className="w-5 h-5"/>,  <FileText key="f" className="w-5 h-5"/>,
  <Copy key="c" className="w-5 h-5"/>,       <Star key="s" className="w-5 h-5"/>,
  <Shield key="sh" className="w-5 h-5"/>,    <Crown key="cr" className="w-5 h-5"/>,
]
const TRUST_ICONS = [
  <Lock key="l" className="w-8 h-8"/>,
  <Shield key="s" className="w-8 h-8"/>,
  <Star key="st" className="w-8 h-8"/>,
]
const TRUST_STYLES = [
  { color:"text-emerald-400", bg:"bg-emerald-500/10" },
  { color:"text-blue-400",    bg:"bg-blue-500/10"    },
  { color:"text-yellow-400",  bg:"bg-yellow-500/10"  },
]

export default function Home() {
  const { lang, setLang } = useLang()
  const l = LP[lang]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* ── BACKGROUND GRADIENTS ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"/>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl"/>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl"/>
      </div>

      {/* ── HEADER ── */}
      <header className="relative border-b border-white/5 sticky top-0 bg-[#0a0a0f]/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-900/50">
              S
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Shartnoma.uz
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition">{l.nav[0]}</a>
            <a href="#how" className="hover:text-white transition">{l.nav[1]}</a>
            <a href="#pricing" className="hover:text-white transition">{l.nav[2]}</a>
          </nav>
          <div className="flex gap-2 items-center">
            {/* Til tanlash */}
            <div className="hidden sm:flex gap-1 mr-2">
              {(Object.keys(LANG_LABELS) as Lang[]).map(lng => (
                <button key={lng} onClick={() => setLang(lng)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition ${lang===lng ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                  {LANG_LABELS[lng]}
                </button>
              ))}
            </div>
            <Link href="/login" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">
              {l.login}
            </Link>
            <Link href="/signup"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl text-sm font-semibold transition shadow-lg shadow-blue-900/40 flex items-center gap-2">
              {l.cta} <ArrowRight className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative max-w-7xl mx-auto px-6 pt-28 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/30 text-blue-300 text-xs px-5 py-2.5 rounded-full mb-10 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5"/>
          {l.badge}
        </div>

        <h1 className="text-6xl md:text-7xl font-black mb-8 leading-[1.05] tracking-tight">
          <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
            {l.h1a}
          </span>
          <br/>
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
            {l.h1b}
          </span>
          <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">{l.h1c}</span>
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">
            {l.h1d}
          </span>
          {l.h1e && <><br/><span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">{l.h1e}</span></>}
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">{l.subtitle}</p>

        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <Link href="/signup"
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 rounded-2xl text-lg font-bold transition shadow-2xl shadow-blue-900/50 flex items-center gap-3">
            {l.cta}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
          </Link>
          <a href="#how"
            className="px-8 py-4 border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl text-lg transition text-gray-300 hover:text-white">
            {l.how}
          </a>
        </div>

        <p className="text-sm text-gray-600">{l.freeNote}</p>

        {/* Dashboard preview */}
        <div className="relative mt-20 mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10 pointer-events-none" style={{top:'60%'}}/>
          <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-white/10 rounded-3xl p-6 backdrop-blur-sm shadow-2xl">
            <div className="flex gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-500"/>
              <div className="w-3 h-3 rounded-full bg-yellow-500"/>
              <div className="w-3 h-3 rounded-full bg-green-500"/>
              <div className="flex-1 bg-gray-700/50 rounded-full h-3 ml-4"/>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: lang==='ru' ? 'Договоры' : lang==='oz' ? 'Шартномалар' : 'Shartnomalar', val: '24', color: 'from-blue-600 to-blue-800' },
                { label: lang==='ru'?'Активных':lang==='oz'?'Фаол':'Faol', val: '12', color: 'from-emerald-600 to-emerald-800' },
                { label: lang==='ru'?'Организации':lang==='oz'?'Ташкилотлар':'Tashkilotlar', val: '3', color: 'from-purple-600 to-purple-800' },
                { label: lang==='ru'?'Контрагенты':lang==='oz'?'Контрагентлар':'Kontragentlar', val: '18', color: 'from-orange-600 to-orange-800' },
              ].map((c, i) => (
                <div key={i} className={`bg-gradient-to-br ${c.color} rounded-xl p-4 text-left`}>
                  <div className="text-2xl font-bold">{c.val}</div>
                  <div className="text-xs opacity-75 mt-1">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-gray-800/60 rounded-xl p-4">
              <div className="flex gap-3 mb-3">
                <div className="h-3 bg-gray-600 rounded-full w-24"/>
                <div className="h-3 bg-gray-700 rounded-full w-16"/>
              </div>
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-700/50 last:border-0">
                  <div className="w-8 h-8 bg-blue-900/60 rounded-lg"/>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-gray-600 rounded-full w-32"/>
                    <div className="h-2 bg-gray-700 rounded-full w-48"/>
                  </div>
                  <div className="h-6 bg-emerald-900/60 rounded-full w-16"/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative border-y border-white/5 py-14 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            { value: '8+', label: l.statsLabels[0], icon: <FileText className="w-5 h-5"/> },
            { value: '5 min', label: l.statsLabels[1], icon: <Clock className="w-5 h-5"/> },
            { value: '100%', label: l.statsLabels[2], icon: <Shield className="w-5 h-5"/> },
          ].map((s, i) => (
            <div key={i} className="group">
              <div className="flex justify-center mb-3 text-blue-400 opacity-60 group-hover:opacity-100 transition">{s.icon}</div>
              <div className="text-4xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-2">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative max-w-7xl mx-auto px-6 py-28">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 text-blue-400 text-sm font-medium mb-4">
            <Zap className="w-4 h-4"/> {l.featuresTag}
          </div>
          <h2 className="text-5xl font-black mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {l.featuresTitle}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{l.featuresSub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {l.features.map((f, i) => {
            const st = FEATURES_STYLES[i]
            return (
              <div key={i} className={`group relative bg-gradient-to-br ${st.gradient} border ${st.border} rounded-2xl p-7 hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm`}>
                <div className={`w-14 h-14 ${st.iconBg} rounded-2xl flex items-center justify-center ${st.iconColor} mb-6`}>
                  {FEATURES_ICONS[i]}
                </div>
                <h3 className="text-lg font-bold mb-3 text-white">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="relative py-28 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4"/> {l.howTag}
            </div>
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {l.howTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-600/50 via-purple-600/50 to-pink-600/50"/>
            {l.steps.map((s, i) => {
              const colors = [
                { color:"from-blue-600 to-cyan-600", shadow:"shadow-blue-900/40" },
                { color:"from-purple-600 to-pink-600", shadow:"shadow-purple-900/40" },
                { color:"from-emerald-600 to-teal-600", shadow:"shadow-emerald-900/40" },
              ][i]
              return (
                <div key={i} className="relative text-center group">
                  <div className={`w-20 h-20 bg-gradient-to-br ${colors.color} rounded-3xl flex items-center justify-center text-2xl font-black mx-auto mb-8 shadow-xl ${colors.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-white">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CONTRACT TYPES ── */}
      <section className="relative max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {l.typesTitle}
          </h2>
          <p className="text-gray-400">{l.typesSub}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {l.typeNames.map((name, i) => (
            <div key={i} className="group flex items-center gap-3 bg-white/[0.03] border border-white/8 hover:border-blue-500/40 hover:bg-blue-500/5 rounded-xl p-4 transition-all duration-300 cursor-default">
              <div className="text-blue-400 opacity-60 group-hover:opacity-100 transition flex-shrink-0">{TYPE_ICONS[i]}</div>
              <span className="text-sm text-gray-300 group-hover:text-white transition font-medium">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative py-28 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium mb-4">
              <Star className="w-4 h-4"/> {l.pricingTag}
            </div>
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {l.pricingTitle}
            </h2>
            <p className="text-gray-400 text-lg">{l.pricingSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* FREE */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-300">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-300"/>
                  </div>
                  <span className="font-bold text-gray-300">{l.freePlan}</span>
                </div>
                <div className="text-5xl font-black text-white mb-2">0</div>
                <div className="text-gray-500 text-sm">{l.perMonth}</div>
                <p className="text-gray-500 text-sm mt-3">{l.tryIt}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {l.freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                    <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0"/>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full text-center py-3.5 border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-xl text-sm font-semibold transition text-gray-300">
                {l.startFree}
              </Link>
            </div>

            {/* STANDARD */}
            <div className="relative bg-gradient-to-b from-blue-600/20 to-blue-900/10 border border-blue-500/30 rounded-3xl p-8 shadow-2xl shadow-blue-900/20 scale-[1.02]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold px-5 py-2 rounded-full shadow-lg">
                {l.popular}
              </div>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white"/>
                  </div>
                  <span className="font-bold text-white">{l.stdPlan}</span>
                </div>
                <div className="text-5xl font-black text-white mb-2">50,000</div>
                <div className="text-blue-300 text-sm">{l.perMonth}</div>
                <p className="text-gray-400 text-sm mt-3">{l.forOrg}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {l.stdFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0"/>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup"
                className="block w-full text-center py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-sm font-bold transition shadow-lg shadow-blue-900/40">
                {l.start}
              </Link>
            </div>

            {/* AI PRO */}
            <div className="relative bg-gradient-to-b from-purple-600/20 to-purple-900/10 border border-purple-500/30 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-5 py-2 rounded-full shadow-lg">
                {l.comingSoon}
              </div>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white"/>
                  </div>
                  <span className="font-bold text-white">{l.aiPlan}</span>
                </div>
                <div className="text-5xl font-black text-white mb-2">199,000</div>
                <div className="text-purple-300 text-sm">{l.perMonth}</div>
                <p className="text-gray-400 text-sm mt-3">{l.forCorp}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {l.aiFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0"/>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup"
                className="block w-full text-center py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-sm font-bold transition shadow-lg shadow-purple-900/40">
                {l.signup}
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-600 text-sm mt-10">{l.payNote}</p>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="relative max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-black mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
          {l.trustTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
          {l.trust.map((tr, i) => {
            const st = TRUST_STYLES[i]
            return (
              <div key={i} className="bg-white/[0.03] border border-white/8 rounded-2xl p-7 text-center">
                <div className={`w-16 h-16 ${st.bg} rounded-2xl flex items-center justify-center ${st.color} mx-auto mb-5`}>
                  {TRUST_ICONS[i]}
                </div>
                <h3 className="font-bold text-white mb-3">{tr.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{tr.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent pointer-events-none"/>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-6xl mb-8">🚀</div>
          <h2 className="text-5xl font-black mb-6 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
            {l.ctaTitle}
          </h2>
          <p className="text-gray-400 text-xl mb-12 leading-relaxed">{l.ctaSub}</p>
          <Link href="/signup"
            className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-2xl text-xl font-black transition shadow-2xl shadow-blue-900/50">
            {l.ctaBtn}
            <ChevronRight className="w-6 h-6"/>
          </Link>
          <p className="text-gray-600 text-sm mt-6">{l.ctaNote}</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-xs">S</div>
            <span className="font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Shartnoma.uz</span>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <a href="#features" className="hover:text-white transition">{l.footerLinks[0]}</a>
            <a href="#pricing" className="hover:text-white transition">{l.footerLinks[1]}</a>
            <Link href="/login" className="hover:text-white transition">{l.footerLinks[2]}</Link>
            <Link href="/signup" className="hover:text-white transition">{l.footerLinks[3]}</Link>
          </div>
          <p className="text-gray-600 text-sm">© 2026 Shartnoma.uz</p>
        </div>
      </footer>
    </div>
  )
}
