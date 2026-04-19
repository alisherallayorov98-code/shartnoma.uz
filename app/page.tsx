'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  FileText, Building2, Users, Download, Shield,
  CheckCircle, ArrowRight, Zap, Star, Crown, Sparkles,
  Clock, Lock, ChevronRight, Bot, Briefcase, Calculator,
  PenTool, Scale, MessageSquare, FileCheck, UserCheck
} from 'lucide-react'
import { useLang } from '@/lib/LanguageContext'
import { LANG_LABELS, type Lang } from '@/lib/i18n'
import { useTheme } from '@/lib/ThemeContext'

// ── Animation variants ───────────────────────────────────────────────────────
const easeOut = [0.22, 1, 0.36, 1] as [number, number, number, number]
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut as any } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const staggerFast = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const spring = { type: 'spring' as const, stiffness: 300, damping: 22 }

const LP: Record<Lang, {
  badge: string; h1a: string; h1b: string; h1c: string
  subtitle: string; cta: string; how: string; freeNote: string
  statsLabels: string[]; statsValues: string[]
  featuresTag: string; featuresTitle: string; featuresSub: string
  features: { title: string; desc: string }[]
  deptTag: string; deptTitle: string; deptSub: string
  depts: { name: string; desc: string; docs: string[] }[]
  howTag: string; howTitle: string
  steps: { title: string; desc: string }[]
  aiDemoTag: string; aiDemoTitle: string; aiDemoSub: string
  aiPrompt: string; aiReply: string
  pricingTag: string; pricingTitle: string; pricingSub: string
  perMonth: string; tryIt: string; forOrg: string; forCorp: string
  freePlan: string; stdPlan: string; aiPlan: string
  popular: string; premium: string
  freeFeatures: string[]; stdFeatures: string[]; aiFeatures: string[]
  startFree: string; start: string; signup: string; payNote: string
  ctaTitle: string; ctaSub: string; ctaBtn: string; ctaNote: string
  nav: string[]; footerLinks: string[]; login: string
}> = {
  uz: {
    badge: "O'zbekistondagi birinchi AI-yordamchi hujjat tizimi",
    h1a: "Hujjatni tavsiflab bering —", h1b: "AI tayyor qiladi", h1c: "",
    subtitle: "Kadrlar, buxgalter, kotiba, yurist bo'limlari uchun sun'iy intellekt. Mehnat shartnomasi, buyruq, bayonnoma, dalolatnoma — 2 daqiqada Word va PDF.",
    cta: "Bepul boshlash", how: "Qanday ishlaydi?",
    freeNote: "Oyiga 5 ta hujjat bepul. Kredit karta kerak emas.",
    statsLabels: ["Hujjat turi", "Yaratish vaqti", "AI bo'lim", "Tashkilot boshqaruvi"],
    statsValues: ["30+", "< 2 min", "4", "Ko'p"],
    featuresTag: "IMKONIYATLAR", featuresTitle: "Nima uchun Kabinetim.uz?",
    featuresSub: "Faqat shartnoma emas — butun tashkilot hujjat aylanmasi bitta tizimda",
    features: [
      { title: "AI Yordamchi", desc: "Hujjatni so'z bilan tasvirlab bering — AI o'zbek tilida professional hujjat yaratadi. Kadrlar, buxgalter, kotiba va yurist uchun." },
      { title: "Ko'p tashkilot", desc: "Bitta hisobda bir nechta tashkilotni boshqaring. Har birining muhri, imzosi va rekvizitlari alohida." },
      { title: "Kontragentlar bazasi", desc: "STIR yoki nom bo'yicha qidiring. Bir marta kiriting — har safar avtomatik to'ladi." },
      { title: "Word va PDF eksport", desc: "Professional formatda Word (.docx) va PDF. Imzo, muhr, rekvizitlar avtomatik kiritiladi." },
      { title: "30+ shablon", desc: "Mehnat shartnomasi, NDA, buyruqlar, bayonnoma, dalolatnoma — tayyor shablonlar to'plami." },
      { title: "Xavfsiz saqlash", desc: "Har bir foydalanuvchi faqat o'z ma'lumotlarini ko'radi. Supabase RLS himoyasi bilan." },
    ],
    deptTag: "BO'LIMLAR", deptTitle: "4 bo'lim — bitta tizim",
    deptSub: "Har bir bo'lim uchun maxsus AI va shablonlar to'plami",
    depts: [
      { name: "Kadrlar", desc: "Ishga qabul qilishdan to bo'shatishgacha barcha hujjatlar", docs: ["Mehnat shartnomasi", "Ishga qabul buyrug'i", "Ta'til buyrug'i", "NDA shartnomasi", "Lavozim yo'riqnomasi", "Ishonchnoma"] },
      { name: "Buxgalter", desc: "Moliyaviy hujjatlar va shartnomalar", docs: ["Dalolatnoma", "Talabnoma", "To'lov grafigi", "Debitor undirish xati", "Xizmat shartnomasi", "Ijara shartnomasi"] },
      { name: "Kotiba", desc: "Tashkiliy hujjatlar va yozishmalar", docs: ["Tashkiliy buyruq", "Bayonnoma", "Rasmiy xat", "Taklifnoma", "Murojaatnoma", "Kafolat xati"] },
      { name: "Yurist AI", desc: "Shartnoma tahlili va yuridik yordam", docs: ["Shartnoma tekshirish", "Risk tahlili", "Grammatika tuzatish", "Qonuniy muvofiqlik", "Yuridik maslahat", "Nizolarni oldini olish"] },
    ],
    howTag: "QANDAY ISHLAYDI", howTitle: "3 qadam — hujjat tayyor",
    steps: [
      { title: "Ro'yxatdan o'ting", desc: "Bepul hisob oching. Tashkilot rekvizitlarini bir marta kiriting — keyingi har bir hujjatga avtomatik qo'shiladi." },
      { title: "Bo'lim va shablon tanlang", desc: "Kadrlar, buxgalter, kotiba yoki yurist. Tayyor shablon tanlang yoki AI ga o'zbek tilida tavsiflab bering." },
      { title: "Word / PDF yuklab oling", desc: "AI hujjatni yaratadi. Ko'rib chiqing, kerak bo'lsa tahrirlang, keyin Word yoki PDF formatda yuklab oling." },
    ],
    aiDemoTag: "AI DEMO", aiDemoTitle: "AI bilan suhbat — hujjat tayyor",
    aiDemoSub: "O'zbek tilida tavsiflab bering, AI professional hujjat yaratadi",
    aiPrompt: "Abdullayev Jasur uchun 2025-yil 1-apreldan boshlab oylik maoshi 3,500,000 so'm bo'lgan mehnat shartnomasi kerak. U IT bo'limida dasturchi sifatida ishlaydi.",
    aiReply: "MEHNAT SHARTNOMASI\n\n\"Texnologiya\" MChJ va Abdullayev Jasur o'rtasida\n\n1. TOMONLAR\n   Ish beruvchi: \"Texnologiya\" MChJ\n   Xodim: Abdullayev Jasur Aliyevich\n\n2. ISH JOYI VA LAVOZIM\n   Bo'lim: Axborot texnologiyalari\n   Lavozim: Dasturchi\n\n3. SHARTNOMA MUDDATI\n   Boshlanish: 2025-yil 1-aprel\n   Tur: Belgilanmagan muddatli\n\n4. ISH HAQI\n   Oylik maosh: 3 500 000 so'm\n   ...",
    pricingTag: "NARXLAR", pricingTitle: "Har bir tashkilot uchun", pricingSub: "Arzon, shaffof, adolatli",
    perMonth: "so'm / oyiga", tryIt: "Sinab ko'rish", forOrg: "Har bir tashkilot uchun", forCorp: "AI imkoniyatlari bilan",
    freePlan: "Bepul", stdPlan: "Standart", aiPlan: "AI Pro",
    popular: "🔥 Mashhur", premium: "⭐ Premium",
    freeFeatures: ["Oyiga 5 ta hujjat", "8 tur shartnoma", "Word va PDF yuklab olish", "Kontragentlar bazasi", "Kabinetim.uz belgili PDF"],
    stdFeatures: ["Cheksiz hujjatlar", "8 tur shartnoma", "Belgi va reklamasiz PDF/Word", "Imzo va muhr avtomatik", "Bir nechta bank hisob", "Ustunlik qo'llab-quvvatlash"],
    aiFeatures: ["Standart tarifning hammasi", "Kadrlar AI — 15+ hujjat turi", "Buxgalter AI — dalolatnoma, talabnoma", "Kotiba AI — buyruqlar, bayonnoma, xatlar", "Yurist AI — risk tahlili, tuzatish", "AI shartnoma tahlili", "Ustuvor qo'llab-quvvatlash"],
    startFree: "Bepul boshlash", start: "Boshlash →", signup: "Ro'yxatdan o'tish →",
    payNote: "To'lov: Telegram orqali. Aktivatsiya 24 soat ichida.",
    ctaTitle: "Bugun boshlang — bepul",
    ctaSub: "Word hujjatlariga sarflangan vaqtni biznesni rivojlantirishga sarflang.",
    ctaBtn: "Bepul ro'yxatdan o'tish", ctaNote: "Kredit karta talab qilinmaydi · O'rnatish shart emas",
    nav: ["Imkoniyatlar", "Bo'limlar", "Narxlar"],
    footerLinks: ["Imkoniyatlar", "Narxlar", "Kirish", "Ro'yxatdan o'tish"],
    login: "Kirish",
  },
  oz: {
    badge: "Ўзбекистондаги биринчи AI-ёрдамчи ҳужжат тизими",
    h1a: "Ҳужжатни тавсифлаб беринг —", h1b: "AI тайёр қилади", h1c: "",
    subtitle: "Кадрлар, бухгалтер, котиба, юрист бўлимлари учун сунъий интеллект. Меҳнат шартномаси, буйруқ, баённома, далолатнома — 2 дақиқада Word ва PDF.",
    cta: "Бепул бошлаш", how: "Қандай ишлайди?",
    freeNote: "Ойига 5 та ҳужжат бепул. Кредит карта керак эмас.",
    statsLabels: ["Ҳужжат тури", "Яратиш вақти", "AI бўлим", "Ташкилот бошқаруви"],
    statsValues: ["30+", "< 2 min", "4", "Кўп"],
    featuresTag: "ИМКОНИЯТЛАР", featuresTitle: "Нима учун Kabinetim.uz?",
    featuresSub: "Фақат шартнома эмас — бутун ташкилот ҳужжат айланмаси битта тизимда",
    features: [
      { title: "AI Ёрдамчи", desc: "Ҳужжатни сўз билан тасвирлаб беринг — AI ўзбек тилида профессионал ҳужжат яратади." },
      { title: "Кўп ташкилот", desc: "Битта ҳисобда бир нечта ташкилотни бошқаринг. Ҳар бирининг муҳри, имзоси алоҳида." },
      { title: "Контрагентлар базаси", desc: "СТИР ёки ном бўйича қидиринг. Бир марта киритинг — ҳар сафар автоматик тўлади." },
      { title: "Word ва PDF экспорт", desc: "Профессионал форматда Word ва PDF. Имзо, муҳр, реквизитлар автоматик киритилади." },
      { title: "30+ шаблон", desc: "Меҳнат шартномаси, NDA, буйруқлар, баённома — тайёр шаблонлар тўплами." },
      { title: "Хавфсиз сақлаш", desc: "Ҳар бир фойдаланувчи фақат ўз маълумотларини кўради. Supabase RLS ҳимояси." },
    ],
    deptTag: "БЎЛИМЛАР", deptTitle: "4 бўлим — битта тизим",
    deptSub: "Ҳар бир бўлим учун махсус AI ва шаблонлар тўплами",
    depts: [
      { name: "Кадрлар", desc: "Ишга қабул қилишдан то бўшатишгача барча ҳужжатлар", docs: ["Меҳнат шартномаси", "Ишга қабул буйруғи", "Таътил буйруғи", "NDA шартномаси", "Лавозим йўриқномаси", "Ишончнома"] },
      { name: "Бухгалтер", desc: "Молиявий ҳужжатлар ва шартномалар", docs: ["Далолатнома", "Талабнома", "Тўлов графиги", "Дебитор ундириш хати", "Хизмат шартномаси", "Ижара шартномаси"] },
      { name: "Котиба", desc: "Ташкилий ҳужжатлар ва ёзишмалар", docs: ["Ташкилий буйруқ", "Баённома", "Расмий хат", "Таклифнома", "Мурожаатнома", "Кафолат хати"] },
      { name: "Юрист AI", desc: "Шартнома таҳлили ва юридик ёрдам", docs: ["Шартнома текшириш", "Хавф таҳлили", "Грамматика тузатиш", "Қонуний мувофиқлик", "Юридик маслаҳат", "Низоларни олдини олиш"] },
    ],
    howTag: "ҚАНДАЙ ИШЛАЙДИ", howTitle: "3 қадам — ҳужжат тайёр",
    steps: [
      { title: "Рўйхатдан ўтинг", desc: "Бепул ҳисоб очинг. Ташкилот реквизитларини бир марта киритинг — кейинги ҳар бир ҳужжатга автоматик қўшилади." },
      { title: "Бўлим ва шаблон танланг", desc: "Кадрлар, бухгалтер, котиба ёки юрист. Тайёр шаблон танланг ёки AI га ўзбек тилида тавсифлаб беринг." },
      { title: "Word / PDF юклаб олинг", desc: "AI ҳужжатни яратади. Кўриб чиқинг, керак бўлса таҳрирланг, кейин Word ёки PDF форматда юклаб олинг." },
    ],
    aiDemoTag: "AI DEMO", aiDemoTitle: "AI билан суҳбат — ҳужжат тайёр",
    aiDemoSub: "Ўзбек тилида тавсифлаб беринг, AI профессионал ҳужжат яратади",
    aiPrompt: "Абдуллаев Жасур учун 2025-йил 1-апрелдан бошлаб ойлик маоши 3 500 000 сўм бўлган меҳнат шартномаси керак.",
    aiReply: "МЕҲНАТ ШАРТНОМАСИ\n\n\"Технология\" МЧЖ ва Абдуллаев Жасур ўртасида\n\n1. ТОМОНЛАР\n   Иш берувчи: \"Технология\" МЧЖ\n   Ходим: Абдуллаев Жасур\n\n2. ИШ ЖОЙИ ВА ЛАВОЗИМ\n   Бўлим: Ахборот технологиялари\n   Лавозим: Дастурчи\n\n3. ШАРТНОМА МУДДАТИ\n   Бошланиш: 2025-йил 1-апрел\n   ...",
    pricingTag: "НАРХЛАР", pricingTitle: "Ҳар бир ташкилот учун", pricingSub: "Арзон, шаффоф, адолатли",
    perMonth: "so'm / oyiga", tryIt: "Синаб кўриш", forOrg: "Ҳар бир ташкилот учун", forCorp: "AI имкониятлари билан",
    freePlan: "Бепул", stdPlan: "Стандарт", aiPlan: "AI Pro",
    popular: "🔥 Машҳур", premium: "⭐ Premium",
    freeFeatures: ["Ойига 5 та ҳужжат", "8 тур шартнома", "Word ва PDF юклаб олиш", "Контрагентлар базаси", "Kabinetim.uz белгили PDF"],
    stdFeatures: ["Чексиз ҳужжатлар", "8 тур шартнома", "Белги ва рекламасиз PDF/Word", "Имзо ва муҳр автоматик", "Бир нечта банк ҳисоб", "Устунлик қўллаб-қувватлаш"],
    aiFeatures: ["Стандарт тарифнинг ҳаммаси", "Кадрлар AI — 15+ ҳужжат тури", "Бухгалтер AI — далолатнома, талабнома", "Котиба AI — буйруқлар, баённома, хатлар", "Юрист AI — хавф таҳлили, тузатиш", "AI шартнома таҳлили", "Устувор қўллаб-қувватлаш"],
    startFree: "Бепул бошлаш", start: "Бошлаш →", signup: "Рўйхатдан ўтиш →",
    payNote: "Тўлов: Telegram орқали. Активация 24 соат ичида.",
    ctaTitle: "Бугун бошланг — бепул",
    ctaSub: "Word ҳужжатларига сарфланган вақтни бизнесни ривожлантиришга сарфланг.",
    ctaBtn: "Бепул рўйхатдан ўтиш", ctaNote: "Кредит карта талаб қилинмайди · Ўрнатиш шарт эмас",
    nav: ["Имкониятлар", "Бўлимлар", "Нархлар"],
    footerLinks: ["Имкониятлар", "Нархлар", "Кириш", "Рўйхатдан ўтиш"],
    login: "Кириш",
  },
  ru: {
    badge: "Первая AI-система документооборота в Узбекистане",
    h1a: "Опишите документ —", h1b: "AI создаст его", h1c: "",
    subtitle: "Искусственный интеллект для кадров, бухгалтерии, секретариата и юриста. Трудовой договор, приказ, протокол, акт — Word и PDF за 2 минуты.",
    cta: "Начать бесплатно", how: "Как это работает?",
    freeNote: "5 документов в месяц — бесплатно. Карта не нужна.",
    statsLabels: ["Типов документов", "Время создания", "AI-отделов", "Управление орг."],
    statsValues: ["30+", "< 2 мин", "4", "Несколько"],
    featuresTag: "ВОЗМОЖНОСТИ", featuresTitle: "Почему Kabinetim.uz?",
    featuresSub: "Не только договоры — весь документооборот организации в одной системе",
    features: [
      { title: "AI Ассистент", desc: "Опишите документ словами — AI создаст профессиональный документ на узбекском языке." },
      { title: "Несколько организаций", desc: "Управляйте несколькими организациями в одном аккаунте. У каждой — своя печать и подпись." },
      { title: "База контрагентов", desc: "Поиск по ИНН или названию. Введите один раз — заполняется автоматически каждый раз." },
      { title: "Word и PDF экспорт", desc: "Профессиональный Word и PDF. Подпись, печать, реквизиты вставляются автоматически." },
      { title: "30+ шаблонов", desc: "Трудовой договор, NDA, приказы, протоколы, акты — готовая коллекция шаблонов." },
      { title: "Безопасное хранение", desc: "Каждый пользователь видит только свои данные. Защита Supabase RLS." },
    ],
    deptTag: "ОТДЕЛЫ", deptTitle: "4 отдела — одна система",
    deptSub: "Специальный AI и набор шаблонов для каждого отдела",
    depts: [
      { name: "Кадры", desc: "Все документы от найма до увольнения", docs: ["Трудовой договор", "Приказ о приёме", "Приказ об отпуске", "NDA договор", "Должностная инструкция", "Доверенность"] },
      { name: "Бухгалтерия", desc: "Финансовые документы и договоры", docs: ["Акт выполненных работ", "Заявка", "График платежей", "Письмо о взыскании", "Договор услуг", "Договор аренды"] },
      { name: "Секретариат", desc: "Организационные документы и переписка", docs: ["Организационный приказ", "Протокол", "Официальное письмо", "Приглашение", "Обращение", "Гарантийное письмо"] },
      { name: "Юрист AI", desc: "Анализ договоров и юридическая помощь", docs: ["Проверка договора", "Анализ рисков", "Исправление грамматики", "Правовое соответствие", "Юридическая консультация", "Предотвращение споров"] },
    ],
    howTag: "КАК ЭТО РАБОТАЕТ", howTitle: "3 шага — документ готов",
    steps: [
      { title: "Зарегистрируйтесь", desc: "Создайте бесплатный аккаунт. Введите реквизиты организации один раз — они будут автоматически добавляться в каждый документ." },
      { title: "Выберите отдел и шаблон", desc: "Кадры, бухгалтерия, секретариат или юрист. Выберите готовый шаблон или опишите AI на русском/узбекском языке." },
      { title: "Скачайте Word / PDF", desc: "AI создаёт документ. Просмотрите, при необходимости отредактируйте, затем скачайте в формате Word или PDF." },
    ],
    aiDemoTag: "AI DEMO", aiDemoTitle: "Диалог с AI — документ готов",
    aiDemoSub: "Опишите документ, AI создаст профессиональный результат",
    aiPrompt: "Нужен трудовой договор для Абдуллаева Жасура с окладом 3 500 000 сум с 1 апреля 2025 года. Должность — программист в IT-отделе.",
    aiReply: "ТРУДОВОЙ ДОГОВОР\n\nМежду ООО \"Технология\" и Абдуллаевым Жасуром\n\n1. СТОРОНЫ\n   Работодатель: ООО \"Технология\"\n   Работник: Абдуллаев Жасур\n\n2. МЕСТО РАБОТЫ\n   Отдел: Информационные технологии\n   Должность: Программист\n\n3. СРОК ДОГОВОРА\n   Начало: 1 апреля 2025 г.\n   Вид: Бессрочный\n\n4. ОПЛАТА ТРУДА\n   Оклад: 3 500 000 сум\n   ...",
    pricingTag: "ЦЕНЫ", pricingTitle: "Для каждой организации", pricingSub: "Доступно, прозрачно, справедливо",
    perMonth: "сум / в месяц", tryIt: "Для ознакомления", forOrg: "Для каждой организации", forCorp: "С AI возможностями",
    freePlan: "Бесплатно", stdPlan: "Стандарт", aiPlan: "AI Pro",
    popular: "🔥 Популярный", premium: "⭐ Premium",
    freeFeatures: ["5 документов в месяц", "8 типов договоров", "Скачивание Word и PDF", "База контрагентов", "PDF с маркой Kabinetim.uz"],
    stdFeatures: ["Неограниченные документы", "8 типов договоров", "PDF/Word без рекламы", "Авт. подпись и печать", "Несколько банковских счетов", "Приоритетная поддержка"],
    aiFeatures: ["Всё из тарифа Стандарт", "Кадры AI — 15+ типов документов", "Бухгалтерия AI — акты, заявки", "Секретариат AI — приказы, протоколы", "Юрист AI — анализ рисков", "AI-анализ договора", "Приоритетная поддержка"],
    startFree: "Начать бесплатно", start: "Начать →", signup: "Зарегистрироваться →",
    payNote: "Оплата: через Telegram. Активация в течение 24 часов.",
    ctaTitle: "Начните сегодня — бесплатно",
    ctaSub: "Время, потраченное на документы в Word, направьте на развитие бизнеса.",
    ctaBtn: "Зарегистрироваться бесплатно", ctaNote: "Карта не требуется · Установка не нужна",
    nav: ["Возможности", "Отделы", "Цены"],
    footerLinks: ["Возможности", "Цены", "Войти", "Регистрация"],
    login: "Войти",
  },
}

// ── CountUp component ────────────────────────────────────────────────────────
function CountUp({ end, suffix = '', duration = 1600 }: { end: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  const [going, setGoing] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGoing(true); obs.disconnect() } }, { threshold: 0.5 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!going) return
    const steps = 50; const inc = end / steps; let cur = 0
    const id = setInterval(() => { cur += inc; if (cur >= end) { setVal(end); clearInterval(id) } else { setVal(Math.floor(cur)) } }, duration / steps)
    return () => clearInterval(id)
  }, [going, end, duration])
  return <span ref={ref}>{val}{suffix}</span>
}

// ── Testimonials data ─────────────────────────────────────────────────────────
const TESTIMONIALS: { name: string; role: Record<string, string>; company: string; text: Record<string, string>; avatar: string; color: string }[] = [
  {
    name: 'Nodira Yusupova', avatar: 'NY', color: 'bg-violet-500',
    role: { uz: 'HR menejeri', oz: 'HR менежери', ru: 'HR менеджер' },
    company: 'Toshkent Logistika MChJ',
    text: {
      uz: "Avval har bir shartnomani Word da qo'lda yozardim — 30-40 daqiqa ketardi. Endi 2 daqiqada tayyor. Kadrlar bo'limi uchun o'zgarishlar ulkan.",
      oz: "Аввал ҳар бир шартномани Word да қўлда ёзардим — 30-40 дақиқа кетарди. Энди 2 дақиқада тайёр. Кадрлар бўлими учун ўзгаришлар улкан.",
      ru: "Раньше каждый договор писала вручную в Word — уходило 30-40 минут. Теперь готово за 2 минуты. Для HR огромный прогресс.",
    },
  },
  {
    name: 'Bobur Xasanov', avatar: 'BX', color: 'bg-blue-500',
    role: { uz: 'Moliyaviy direktor', oz: 'Молиявий директор', ru: 'Финансовый директор' },
    company: 'Samarqand Trade LLC',
    text: {
      uz: "Bir nechta tashkilotni bitta hisobdan boshqarish imkoniyati menga eng ko'p yoqadi. Buxgalter bo'limi uchun ham to'liq mos keladi.",
      oz: "Бир нечта ташкилотни битта ҳисобдан бошқариш имконияти менга энг кўп ёқади. Бухгалтер бўлими учун ҳам тўлиқ мос келади.",
      ru: "Больше всего нравится управление несколькими организациями из одного аккаунта. Для бухгалтерии тоже идеально подходит.",
    },
  },
  {
    name: 'Malika Rahimova', avatar: 'MR', color: 'bg-emerald-500',
    role: { uz: "Yuridik bo'lim boshlig'i", oz: "Юридик бўлим бошлиғи", ru: 'Руководитель юротдела' },
    company: 'Andijon Qurilish Holding',
    text: {
      uz: "Yurist AI shartnomadagi xatolarni topib beradi. Xavf tahlili funksiyasi — real pul tejaydi. Butun jamoaga tavsiya qilaman.",
      oz: "Юрист AI шартномадаги хатоларни топиб беради. Хавф таҳлили функцияси — реал пул тежайди.",
      ru: "Юрист AI находит ошибки в договорах. Функция анализа рисков реально экономит деньги. Рекомендую всей команде.",
    },
  },
]

// ── FAQ Component ────────────────────────────────────────────────────────────
const FAQ_ITEMS: { q: Record<Lang, string>; a: Record<Lang, string> }[] = [
  {
    q: { uz: "Bepul tarifda nima bor?", oz: "Bepul tarifda nima bor?", ru: "Что входит в бесплатный тариф?" },
    a: { uz: "Oyiga 5 ta hujjat yaratish, 8 tur shartnoma, Word va PDF yuklab olish — kredit karta talab qilinmaydi.", oz: "Oyiga 5 ta hujjat yaratish, 8 tur shartnoma, Word va PDF yuklab olish — kredit karta talab qilinmaydi.", ru: "5 документов в месяц, 8 типов договоров, скачивание Word и PDF — карта не требуется." },
  },
  {
    q: { uz: "To'lov qanday amalga oshiriladi?", oz: "To'lov qanday amalga oshiriladi?", ru: "Как осуществляется оплата?" },
    a: { uz: "To'lov Telegram orqali bank o'tkazma yoki Click/Payme orqali amalga oshiriladi. Aktivatsiya 24 soat ichida.", oz: "To'lov Telegram orqali bank o'tkazma yoki Click/Payme orqali amalga oshiriladi. Aktivatsiya 24 soat ichida.", ru: "Оплата через Telegram банковским переводом или через Click/Payme. Активация в течение 24 часов." },
  },
  {
    q: { uz: "Ma'lumotlarim xavfsizmi?", oz: "Ma'lumotlarim xavfsizmi?", ru: "Безопасны ли мои данные?" },
    a: { uz: "Ha. Har bir foydalanuvchi faqat o'z ma'lumotlarini ko'radi. Supabase Row Level Security (RLS) himoyasi bilan.", oz: "Ha. Har bir foydalanuvchi faqat o'z ma'lumotlarini ko'radi. Supabase Row Level Security (RLS) himoyasi bilan.", ru: "Да. Каждый пользователь видит только свои данные. Защита через Supabase Row Level Security (RLS)." },
  },
  {
    q: { uz: "Bir nechta tashkilotni boshqarish mumkinmi?", oz: "Bir nechta tashkilotni boshqarish mumkinmi?", ru: "Можно ли управлять несколькими организациями?" },
    a: { uz: "Ha, bitta hisobdan cheksiz tashkilot qo'sha olasiz. Har birining muhri, imzosi va rekvizitlari alohida saqlanadi.", oz: "Ha, bitta hisobdan cheksiz tashkilot qo'sha olasiz. Har birining muhri, imzosi va rekvizitlari alohida saqlanadi.", ru: "Да, с одного аккаунта можно добавить неограниченное количество организаций. У каждой свои реквизиты, печать и подпись." },
  },
  {
    q: { uz: "Qaysi formatda yuklab olish mumkin?", oz: "Qaysi formatda yuklab olish mumkin?", ru: "В каком формате можно скачать?" },
    a: { uz: "Word (.docx) va PDF formatlarida. Standart va AI Pro tariflarida muhr, imzo va rekvizitlar avtomatik kiritiladi.", oz: "Word (.docx) va PDF formatlarida. Standart va AI Pro tariflarida muhr, imzo va rekvizitlar avtomatik kiritiladi.", ru: "В форматах Word (.docx) и PDF. На тарифах Стандарт и AI Pro — печать, подпись и реквизиты вставляются автоматически." },
  },
  {
    q: { uz: "AI qanday ishlaydi?", oz: "AI qanday ishlaydi?", ru: "Как работает AI?" },
    a: { uz: "O'zbek tilida hujjatni tavsiflab bering — AI GPT-4 asosida professional hujjat yaratadi. Yurist AI esa shartnomangizni tahlil qilib, xatolar va risklar haqida xabar beradi.", oz: "O'zbek tilida hujjatni tavsiflab bering — AI GPT-4 asosida professional hujjat yaratadi.", ru: "Опишите документ на узбекском языке — AI на основе GPT-4 создаст профессиональный документ. Юрист AI анализирует договор и сообщает об ошибках и рисках." },
  },
]

function FaqList({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <motion.div className="space-y-3"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      initial="hidden" whileInView="show" viewport={{ once: true }}>
      {FAQ_ITEMS.map((item, i) => (
        <motion.div key={i}
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] } } }}
          className="border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
          <button onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left">
            <span className="text-white font-semibold text-sm">{item.q[lang]}</span>
            <motion.svg
              animate={{ rotate: open === i ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
              className="w-5 h-5 text-gray-400 flex-shrink-0"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </motion.svg>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
                className="overflow-hidden">
                <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                  {item.a[lang]}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ── Hero typing words ─────────────────────────────────────────────────────────
const HERO_WORDS: Record<Lang, string[]> = {
  uz: ['AI tayyor qiladi', '2 daqiqada tayyor', 'Word va PDF chiqaradi', 'professional hujjat'],
  oz: ['AI тайёр қилади', '2 дақиқада тайёр', 'Word ва PDF чиқаради', 'профессионал ҳужжат'],
  ru: ['AI создаёт', 'готово за 2 минуты', 'Word и PDF на выходе', 'профессиональный документ'],
}

// ── Marquee items ─────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  'Mehnat shartnomasi', 'Buyruq', 'Bayonnoma', 'Dalolatnoma', 'NDA', 'Ijara shartnomasi',
  "To'lov grafigi", 'Kafolat xati', 'Rasmiy xat', 'Ishonchnoma', 'Xizmat shartnomasi',
  "Lavozim yo'riqnomasi", 'Faktura', 'Akt sverki', 'Transport shartnomasi', 'Talabnoma',
]

const DEPT_ICONS = [
  <UserCheck key="uc" className="w-7 h-7"/>,
  <Calculator key="calc" className="w-7 h-7"/>,
  <PenTool key="pen" className="w-7 h-7"/>,
  <Scale key="scale" className="w-7 h-7"/>,
]
const DEPT_STYLES = [
  { gradient: 'from-blue-600/25 to-blue-900/10', border: 'border-blue-500/30', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-300', dot: 'bg-blue-400' },
  { gradient: 'from-emerald-600/25 to-emerald-900/10', border: 'border-emerald-500/30', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-400' },
  { gradient: 'from-violet-600/25 to-violet-900/10', border: 'border-violet-500/30', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400', badge: 'bg-violet-500/15 text-violet-300', dot: 'bg-violet-400' },
  { gradient: 'from-orange-600/25 to-orange-900/10', border: 'border-orange-500/30', iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300', dot: 'bg-orange-400' },
]
const FEATURES_ICONS = [
  <Bot key="bot" className="w-7 h-7"/>,
  <Building2 key="b2" className="w-7 h-7"/>,
  <Users key="users" className="w-7 h-7"/>,
  <Download key="dl" className="w-7 h-7"/>,
  <FileCheck key="fc" className="w-7 h-7"/>,
  <Shield key="shield" className="w-7 h-7"/>,
]
const FEATURES_STYLES = [
  { gradient: 'from-yellow-500/20 to-orange-500/10', border: 'border-yellow-500/20', iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/10' },
  { gradient: 'from-blue-500/20 to-cyan-500/10',     border: 'border-blue-500/20',   iconColor: 'text-blue-400',   iconBg: 'bg-blue-500/10'   },
  { gradient: 'from-purple-500/20 to-pink-500/10',   border: 'border-purple-500/20', iconColor: 'text-purple-400', iconBg: 'bg-purple-500/10' },
  { gradient: 'from-emerald-500/20 to-teal-500/10',  border: 'border-emerald-500/20',iconColor: 'text-emerald-400',iconBg: 'bg-emerald-500/10'},
  { gradient: 'from-cyan-500/20 to-blue-500/10',     border: 'border-cyan-500/20',   iconColor: 'text-cyan-400',   iconBg: 'bg-cyan-500/10'   },
  { gradient: 'from-red-500/20 to-rose-500/10',      border: 'border-red-500/20',    iconColor: 'text-red-400',    iconBg: 'bg-red-500/10'    },
]

export default function Home() {
  const { lang, setLang } = useLang()
  const { theme, toggleTheme } = useTheme()
  const l = LP[lang]
  const isLight = theme === 'light'

  const [mobileMenu,  setMobileMenu]  = useState(false)
  const [activeDept,  setActiveDept]  = useState(0)
  const [liveCount,   setLiveCount]   = useState(247)

  useEffect(() => {
    const id = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 2) + 1), 4500)
    return () => clearInterval(id)
  }, [])

  // Hero typing animation
  const [heroWord,    setHeroWord]    = useState('')
  const [heroDeleting, setHeroDeleting] = useState(false)
  const [heroIdx,     setHeroIdx]     = useState(0)

  useEffect(() => {
    const words   = HERO_WORDS[lang]
    const current = words[heroIdx % words.length]
    if (!heroDeleting && heroWord === current) {
      const id = setTimeout(() => setHeroDeleting(true), 2200)
      return () => clearTimeout(id)
    }
    const speed = heroDeleting ? 45 : 90
    const id = setTimeout(() => {
      if (!heroDeleting) {
        setHeroWord(current.slice(0, heroWord.length + 1))
      } else if (heroWord.length > 0) {
        setHeroWord(current.slice(0, heroWord.length - 1))
      } else {
        setHeroDeleting(false)
        setHeroIdx(i => (i + 1) % words.length)
      }
    }, speed)
    return () => clearTimeout(id)
  }, [heroWord, heroDeleting, heroIdx, lang])

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 80])

  return (
    <>
    <style>{`
      @keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .marquee-track { animation: marqueeScroll 28s linear infinite; }
      .marquee-track:hover { animation-play-state: paused; }
    `}</style>

    <div className={`lp min-h-screen overflow-x-hidden ${isLight ? 'lp-light bg-[#f8fafc] text-gray-900' : 'bg-[#080810] text-white'}`}>

      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px]"
          style={{ y: blobY }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}/>
        <motion.div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}/>
        <motion.div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] bg-cyan-600/8 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}/>
      </div>

      {/* ── HEADER ── */}
      <motion.header className="relative border-b border-white/5 sticky top-0 bg-[#080810]/85 backdrop-blur-xl z-50"
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-sm shadow-lg shadow-blue-900/60">
              S
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Kabinetim.uz
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition">{l.nav[0]}</a>
            <a href="#depts" className="hover:text-white transition">{l.nav[1]}</a>
            <a href="#pricing" className="hover:text-white transition">{l.nav[2]}</a>
          </nav>
          <div className="flex gap-2 items-center">
            <div className="hidden sm:flex gap-1 mr-2">
              {(Object.keys(LANG_LABELS) as Lang[]).map(lng => (
                <button key={lng} onClick={() => setLang(lng)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition ${lang===lng ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                  {LANG_LABELS[lng]}
                </button>
              ))}
            </div>
            <button onClick={toggleTheme} title={isLight ? 'Tungi rejim' : 'Kunduzgi rejim'}
              className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${isLight ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              {isLight ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
              )}
            </button>
            <Link href="/login" className={`px-4 py-2 text-sm transition hidden sm:block ${isLight ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}>
              {l.login}
            </Link>
            <Link href="/signup"
              className="hidden sm:flex px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-sm font-bold transition shadow-lg shadow-blue-900/40 items-center gap-2">
              {l.cta} <ArrowRight className="w-4 h-4"/>
            </Link>
            {/* Hamburger — only mobile */}
            <button onClick={() => setMobileMenu(v => !v)}
              className="sm:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition">
              {mobileMenu
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
              }
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
        {mobileMenu && (
          <motion.div className="sm:hidden border-t border-white/5 bg-[#080810]/95 backdrop-blur-xl px-5 py-4 space-y-3"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}>
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-300 hover:text-white py-2 border-b border-white/5">{l.nav[0]}</a>
            <a href="#depts"    onClick={() => setMobileMenu(false)} className="block text-sm text-gray-300 hover:text-white py-2 border-b border-white/5">{l.nav[1]}</a>
            <a href="#pricing"  onClick={() => setMobileMenu(false)} className="block text-sm text-gray-300 hover:text-white py-2 border-b border-white/5">{l.nav[2]}</a>
            <div className="flex gap-2 pt-1">
              {(Object.keys(LANG_LABELS) as Lang[]).map(lng => (
                <button key={lng} onClick={() => { setLang(lng); setMobileMenu(false) }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition ${lang===lng ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}>
                  {LANG_LABELS[lng]}
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-1">
              <Link href="/login" onClick={() => setMobileMenu(false)}
                className="flex-1 text-center py-2.5 border border-white/10 text-sm text-gray-300 rounded-xl hover:bg-white/5 transition">
                {l.login}
              </Link>
              <Link href="/signup" onClick={() => setMobileMenu(false)}
                className="flex-1 text-center py-2.5 bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white rounded-xl transition">
                {l.cta}
              </Link>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.header>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative max-w-7xl mx-auto px-5 pt-24 pb-12 text-center">
        <motion.div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/30 text-blue-300 text-xs px-5 py-2.5 rounded-full mb-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Sparkles className="w-3.5 h-3.5 text-yellow-400"/>
          {l.badge}
        </motion.div>

        {/* Live counter */}
        <motion.div className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
            <motion.span className="text-emerald-300 text-sm font-semibold"
              animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
              {liveCount}
            </motion.span>
            <span className="text-emerald-400/70 text-sm">
              {lang==='ru' ? 'документов создано сегодня' : lang==='oz' ? 'ta hujjat bugun yaratildi' : 'ta hujjat bugun yaratildi'}
            </span>
          </div>
        </motion.div>

        <motion.h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.08] tracking-tight"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease: [0.22,1,0.36,1] }}>
          <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent block">
            {l.h1a}
          </span>
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent inline-block min-h-[1.2em]">
            {heroWord}
            <span className="opacity-80 animate-pulse">|</span>
          </span>
        </motion.h1>

        <motion.p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38, duration: 0.6 }}>
          {l.subtitle}
        </motion.p>

        <motion.div className="flex gap-4 justify-center flex-wrap mb-16"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <Link href="/signup"
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 rounded-2xl text-lg font-bold transition shadow-2xl shadow-blue-900/50 flex items-center gap-3">
            {l.cta}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
          </Link>
          <a href="#how"
            className="px-8 py-4 border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 rounded-2xl text-lg transition text-gray-300 hover:text-white">
            {l.how}
          </a>
        </motion.div>

        <motion.p className="text-sm text-gray-600 mb-20"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.5 }}>
          {l.freeNote}
        </motion.p>

        {/* Hero image */}
        <motion.div className="relative mx-auto max-w-4xl mt-4"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.8, ease: [0.22,1,0.36,1] }}>

          {/* Floating badge — top left */}
          <motion.div className="hidden md:block absolute -top-5 -left-8 z-20 pointer-events-none"
            animate={{ y: [0, -8, 0], rotate: [-1, 1, -1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
            <div className="bg-[#0F172A]/95 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-blue-400"/>
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">2 daqiqa</div>
                <div className="text-gray-500 text-xs">{lang==='ru'?'время создания':'yaratish vaqti'}</div>
              </div>
            </div>
          </motion.div>

          {/* Floating badge — top right */}
          <motion.div className="hidden md:block absolute -top-5 -right-8 z-20 pointer-events-none"
            animate={{ y: [0, -10, 0], rotate: [1, -1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
            <div className="bg-[#0F172A]/95 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-400"/>
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">Word + PDF</div>
                <div className="text-gray-500 text-xs">{lang==='ru'?'экспорт':'eksport'}</div>
              </div>
            </div>
          </motion.div>

          {/* Floating badge — bottom left */}
          <motion.div className="hidden md:block absolute -bottom-5 -left-6 z-20 pointer-events-none"
            animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
            <div className="bg-[#0F172A]/95 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-purple-400"/>
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">AI tayyor</div>
                <div className="text-gray-500 text-xs">GPT-4 asosida</div>
              </div>
            </div>
          </motion.div>

          {/* Floating badge — bottom right */}
          <motion.div className="hidden md:block absolute -bottom-5 -right-6 z-20 pointer-events-none"
            animate={{ y: [0, -8, 0], rotate: [-1, 1, -1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}>
            <div className="bg-[#0F172A]/95 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-amber-400"/>
              </div>
              <div className="text-left">
                <div className="text-white font-bold text-sm">500+</div>
                <div className="text-gray-500 text-xs">{lang==='ru'?'компаний':'kompaniya'}</div>
              </div>
            </div>
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-transparent to-transparent z-10 pointer-events-none" style={{top:'65%'}}/>
          {/* Browser chrome frame */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-white/10 ring-1 ring-white/5">
            {/* Fake browser bar */}
            <div className="bg-[#0F172A] border-b border-white/10 px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60"/>
                <div className="w-3 h-3 rounded-full bg-yellow-500/60"/>
                <div className="w-3 h-3 rounded-full bg-emerald-500/60"/>
              </div>
              <div className="flex-1 bg-white/5 border border-white/8 rounded-md px-3 py-1 mx-4 text-xs text-gray-500">
                kabinetim.uz/dashboard
              </div>
            </div>
            <Image
              src="/img-hero.png"
              alt="Kabinetim.uz dashboard"
              width={1200}
              height={700}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
          {/* Glow */}
          <div className="absolute -inset-4 bg-blue-600/15 rounded-3xl blur-3xl -z-10 pointer-events-none"/>
          <div className="absolute -inset-8 bg-purple-600/8 rounded-3xl blur-3xl -z-10 pointer-events-none"/>
        </motion.div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="relative border-y border-white/5 py-4 overflow-hidden bg-white/[0.01]">
        <div className="flex whitespace-nowrap marquee-track gap-0">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-xs text-gray-500 px-5 border-r border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 flex-shrink-0"/>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section className="relative border-y border-white/5 py-14 bg-white/[0.015]">
        <motion.div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          {[
            { val: <CountUp end={30} suffix="+" />, label: l.statsLabels[0] },
            { val: '< 2 min',                       label: l.statsLabels[1] },
            { val: <CountUp end={4} />,              label: l.statsLabels[2] },
            { val: lang === 'ru' ? 'Много' : lang === 'oz' ? "Ko'p" : "Ko'p", label: l.statsLabels[3] },
          ].map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="group"
              whileHover={{ scale: 1.05 }} transition={spring}>
              <div className="text-4xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-2 group-hover:from-blue-300 group-hover:to-blue-500 transition-all duration-300">
                {s.val}
              </div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── DEPARTMENTS ── */}
      <section id="depts" className="relative max-w-7xl mx-auto px-5 py-28">
        <motion.div className="text-center mb-16"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 text-cyan-400 text-sm font-medium mb-4">
            <Briefcase className="w-4 h-4"/> {l.deptTag}
          </div>
          <h2 className="text-5xl font-black mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {l.deptTitle}
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">{l.deptSub}</p>
        </motion.div>

        {/* Interactive tabs */}
        <motion.div className="flex flex-col lg:flex-row gap-4"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>

          {/* Tab buttons */}
          <div className="flex lg:flex-col gap-2 lg:w-56 flex-shrink-0">
            {l.depts.map((dept, i) => {
              const st = DEPT_STYLES[i]
              return (
                <motion.button key={i} onClick={() => setActiveDept(i)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 w-full ${
                    activeDept === i
                      ? `bg-gradient-to-r ${st.gradient} border ${st.border} shadow-lg`
                      : 'bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:border-white/15'
                  }`}>
                  <div className={`w-9 h-9 ${activeDept===i ? st.iconBg : 'bg-white/5'} rounded-xl flex items-center justify-center ${activeDept===i ? st.iconColor : 'text-gray-500'} flex-shrink-0 transition-all`}>
                    {DEPT_ICONS[i]}
                  </div>
                  <span className={`font-bold text-sm ${activeDept===i ? 'text-white' : 'text-gray-400'} transition-colors`}>
                    {dept.name}
                  </span>
                  {activeDept === i && (
                    <motion.div layoutId="dept-dot" className={`ml-auto w-1.5 h-1.5 ${st.dot} rounded-full flex-shrink-0`}/>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Tab content - AnimatePresence */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDept}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={`bg-gradient-to-br ${DEPT_STYLES[activeDept].gradient} border ${DEPT_STYLES[activeDept].border} rounded-3xl p-8`}>
                <div className="flex items-start gap-5 mb-7">
                  <div className={`w-16 h-16 ${DEPT_STYLES[activeDept].iconBg} rounded-2xl flex items-center justify-center ${DEPT_STYLES[activeDept].iconColor} flex-shrink-0`}>
                    {DEPT_ICONS[activeDept]}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white mb-1">{l.depts[activeDept].name}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{l.depts[activeDept].desc}</p>
                  </div>
                </div>

                <motion.div className="flex flex-wrap gap-2.5"
                  variants={staggerFast} initial="hidden" animate="show">
                  {l.depts[activeDept].docs.map((doc, j) => (
                    <motion.span key={j} variants={fadeUp}
                      className={`inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl ${DEPT_STYLES[activeDept].badge} border border-white/10 font-medium`}>
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 opacity-70"/>
                      {doc}
                    </motion.span>
                  ))}
                </motion.div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring} className="inline-block">
                    <Link href="/signup"
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${DEPT_STYLES[activeDept].iconBg} ${DEPT_STYLES[activeDept].iconColor} border ${DEPT_STYLES[activeDept].border}`}>
                      {lang==='ru'?'Начать бесплатно':lang==='oz'?"Bepul boshlash":"Bepul boshlash"}
                      <ArrowRight className="w-4 h-4"/>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative border-y border-white/5 bg-white/[0.015] py-28">
        <div className="max-w-7xl mx-auto px-5">
          <motion.div className="text-center mb-16"
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 text-blue-400 text-sm font-medium mb-4">
              <Zap className="w-4 h-4"/> {l.featuresTag}
            </div>
            <h2 className="text-5xl font-black mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {l.featuresTitle}
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{l.featuresSub}</p>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
            {l.features.map((f, i) => {
              const st = FEATURES_STYLES[i]
              return (
                <motion.div key={i} variants={fadeUp}
                  whileHover={{ scale: 1.03, y: -4 }} transition={spring}
                  className={`group bg-gradient-to-br ${st.gradient} border ${st.border} rounded-2xl p-7`}>
                  <div className={`w-14 h-14 ${st.iconBg} rounded-2xl flex items-center justify-center ${st.iconColor} mb-6`}>
                    {FEATURES_ICONS[i]}
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-white">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="relative max-w-5xl mx-auto px-5 py-28">
        <motion.div className="text-center mb-16"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium mb-4">
            <Clock className="w-4 h-4"/> {l.howTag}
          </div>
          <h2 className="text-5xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {l.howTitle}
          </h2>
        </motion.div>
        {/* How it works image */}
        <div className="relative mx-auto max-w-3xl mb-16 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/20">
          <Image
            src="/img-how.png"
            alt="Qanday ishlaydi"
            width={900}
            height={400}
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080810]/50 via-transparent to-transparent pointer-events-none"/>
        </div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-600/50 via-purple-600/50 to-emerald-600/50"/>
          {l.steps.map((s, i) => {
            const colors = [
              { color: 'from-blue-600 to-cyan-600', shadow: 'shadow-blue-900/40' },
              { color: 'from-purple-600 to-pink-600', shadow: 'shadow-purple-900/40' },
              { color: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-900/40' },
            ][i]
            return (
              <motion.div key={i} variants={fadeUp} className="relative text-center group">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: [0, -3, 3, 0] }}
                  transition={spring}
                  className={`w-20 h-20 bg-gradient-to-br ${colors.color} rounded-3xl flex items-center justify-center text-2xl font-black mx-auto mb-8 shadow-xl ${colors.shadow}`}>
                  {String(i+1).padStart(2,'0')}
                </motion.div>
                <h3 className="text-xl font-bold mb-4 text-white">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

      {/* ── AI DEMO SECTION ── */}
      <section className="relative border-y border-white/5 bg-white/[0.015] py-28">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div className="text-center mb-16"
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 text-yellow-400 text-sm font-medium mb-4">
              <MessageSquare className="w-4 h-4"/> {l.aiDemoTag}
            </div>
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {l.aiDemoTitle}
            </h2>
            <p className="text-gray-400 text-lg">{l.aiDemoSub}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* AI chat image */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-900/20">
              <Image
                src="/img-ai.png"
                alt="AI hujjat yaratish"
                width={720}
                height={520}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080810]/60 via-transparent to-transparent pointer-events-none"/>
            </div>

            {/* Dashboard image */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/20">
              <Image
                src="/img-dashboard.png"
                alt="Dashboard ko'rinishi"
                width={720}
                height={520}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080810]/60 via-transparent to-transparent pointer-events-none"/>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative max-w-6xl mx-auto px-5 py-24">
        <motion.div className="text-center mb-14"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 text-amber-400 text-sm font-medium mb-4">
            <Star className="w-4 h-4"/>
            {lang === 'ru' ? 'ОТЗЫВЫ' : lang === 'oz' ? 'ФИКРLAR' : 'MIJOZLAR FIKRI'}
          </div>
          <h2 className="text-5xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-4">
            {lang === 'ru' ? 'Что говорят пользователи' : lang === 'oz' ? 'Foydalanuvchilar nima deydi' : "Foydalanuvchilar nima deydi"}
          </h2>
        </motion.div>
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-5"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i} variants={fadeUp}
              whileHover={{ scale: 1.02, y: -4 }} transition={spring}
              className="bg-white/[0.03] border border-white/10 rounded-3xl p-7 hover:border-white/20 hover:bg-white/[0.05]">
              <div className="flex gap-0.5 mb-5">
                {[1,2,3,4,5].map(s => <svg key={s} className="w-4 h-4 fill-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">&ldquo;{t.text[lang]}&rdquo;</p>
              <div className="flex items-center gap-3">
                <Image
                  src={`/testimonial-${i + 1}.png`}
                  alt={t.name}
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-white/10"
                />
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role[lang]} · {t.company}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative max-w-6xl mx-auto px-5 py-28">
        <motion.div className="text-center mb-16"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium mb-4">
            <Star className="w-4 h-4"/> {l.pricingTag}
          </div>
          <h2 className="text-5xl font-black mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {l.pricingTitle}
          </h2>
          <p className="text-gray-400 text-lg">{l.pricingSub}</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }}>
          {/* FREE */}
          <motion.div variants={fadeUp}
            whileHover={{ scale: 1.02, y: -4 }} transition={spring}
            className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 hover:border-white/20">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-gray-700 rounded-xl flex items-center justify-center">
                  <FileText className="w-4.5 h-4.5 text-gray-300"/>
                </div>
                <span className="font-bold text-gray-300">{l.freePlan}</span>
              </div>
              <div className="text-5xl font-black text-white mb-1">0</div>
              <div className="text-gray-500 text-sm mb-3">{l.perMonth}</div>
              <p className="text-gray-500 text-sm">{l.tryIt}</p>
            </div>
            <ul className="space-y-3 mb-8">
              {l.freeFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-gray-600 flex-shrink-0"/>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full text-center py-3.5 border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-xl text-sm font-bold transition text-gray-300">
              {l.startFree}
            </Link>
          </motion.div>

          {/* STANDARD */}
          <motion.div variants={fadeUp}
            whileHover={{ scale: 1.04, y: -6 }} transition={spring}
            className="relative bg-gradient-to-b from-blue-600/20 to-blue-900/10 border border-blue-500/40 rounded-3xl p-8 shadow-2xl shadow-blue-900/25 scale-[1.02]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-black px-6 py-2 rounded-full shadow-lg">
              {l.popular}
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-4.5 h-4.5 text-white"/>
                </div>
                <span className="font-bold text-white">{l.stdPlan}</span>
              </div>
              <div className="text-5xl font-black text-white mb-1">50,000</div>
              <div className="text-blue-300 text-sm mb-3">{l.perMonth}</div>
              <p className="text-gray-400 text-sm">{l.forOrg}</p>
            </div>
            <ul className="space-y-3 mb-8">
              {l.stdFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0"/>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full text-center py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-sm font-black transition shadow-lg shadow-blue-900/40">
              {l.start}
            </Link>
          </motion.div>

          {/* AI PRO */}
          <motion.div variants={fadeUp}
            whileHover={{ scale: 1.02, y: -4 }} transition={spring}
            className="relative bg-gradient-to-b from-purple-600/20 to-purple-900/10 border border-purple-500/30 rounded-3xl p-8 hover:border-purple-500/50">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black px-6 py-2 rounded-full shadow-lg">
              {l.premium}
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Crown className="w-4.5 h-4.5 text-white"/>
                </div>
                <span className="font-bold text-white">{l.aiPlan}</span>
              </div>
              <div className="text-5xl font-black text-white mb-1">199,000</div>
              <div className="text-purple-300 text-sm mb-3">{l.perMonth}</div>
              <p className="text-gray-400 text-sm">{l.forCorp}</p>
            </div>
            <ul className="space-y-3 mb-8">
              {l.aiFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0"/>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block w-full text-center py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-sm font-black transition shadow-lg shadow-purple-900/40">
              {l.signup}
            </Link>
          </motion.div>
        </motion.div>
        {/* ── PAYMENT DETAILS ── */}
        <div className="mt-14 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/10 border border-emerald-700/30 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400"/>
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {lang==='ru' ? 'Реквизиты для оплаты' : lang==='oz' ? 'Тўлов реквизитлари' : "To'lov rekvizitlari"}
                </h3>
                <p className="text-emerald-400 text-xs mt-0.5">
                  {lang==='ru' ? 'Банковский перевод · Активация в течение 24 часов' : lang==='oz' ? 'Банк ўтказмаси · 24 соат ичида активация' : "Bank o'tkazma · 24 soat ichida aktivatsiya"}
                </p>
              </div>
            </div>

            {/* Rekvizitlar — niqoblangan */}
            <div className="relative">
              {/* Blur overlay */}
              <div className="absolute inset-0 z-10 rounded-2xl backdrop-blur-md bg-[#0B1220]/60 flex flex-col items-center justify-center gap-3">
                <div className="w-11 h-11 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <p className="text-white font-semibold text-sm text-center px-4">
                  {lang==='ru'
                    ? 'Реквизиты доступны после подписки'
                    : lang==='oz'
                    ? 'Реквизитлар обунадан сўнг кўринади'
                    : "Rekvizitlar obunadan so'ng ko'rinadi"}
                </p>
                <p className="text-gray-400 text-xs text-center px-6">
                  {lang==='ru'
                    ? 'Напишите нам в Telegram — отправим реквизиты'
                    : lang==='oz'
                    ? "Telegram'da yozing — rekvizitlarni yuboramiz"
                    : "Telegramda yozing — rekvizitlarni yuboramiz"}
                </p>
              </div>
              {/* Blurred content beneath */}
              <div className="space-y-3 select-none pointer-events-none" aria-hidden>
                {[
                  { label: 'Tashkilot', value: '██████████████ MCHJ' },
                  { label: 'STIR',      value: '█████████' },
                  { label: 'Hisob raqami', value: '████████████████████' },
                  { label: 'Bank',      value: '████████████████████' },
                  { label: 'MFO',       value: '█████' },
                ].map((row, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-gray-500 text-sm flex-shrink-0">{row.label}</span>
                    <span className="text-white/20 text-sm font-medium text-right tracking-wider">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aloqa — Telegram */}
            <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-3 bg-white/[0.03] rounded-xl p-4">
              <div className="w-9 h-9 bg-blue-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.268.089z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-xs mb-1">
                  {lang==='ru' ? 'Написать и получить реквизиты:' : lang==='oz' ? "Yozish va rekvizit olish:" : "Yozish va rekvizit olish:"}
                </p>
                <a href="https://t.me/Alisher_All" target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 font-bold text-base hover:text-blue-300 transition">
                  @Alisher_All
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="relative border-y border-white/5 bg-white/[0.015] py-14">
        <motion.div className="max-w-5xl mx-auto px-5 grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          {[
            { icon: <Lock className="w-6 h-6"/>, color: 'text-emerald-400', bg: 'bg-emerald-500/10',
              title: lang==='ru'?'Данные в безопасности':lang==='oz'?'Маълумотлар хавфсиз':'Ma\'lumotlar xavfsiz',
              desc: lang==='ru'?'Supabase RLS защита. Каждый видит только своё.':lang==='oz'?'Supabase RLS ҳимояси.':'Supabase RLS himoyasi. Har biri faqat o\'zini ko\'radi.' },
            { icon: <Shield className="w-6 h-6"/>, color: 'text-blue-400', bg: 'bg-blue-500/10',
              title: lang==='ru'?'Зашифрованное хранение':lang==='oz'?'Шифрланган сақлаш':'Shifrlangan saqlash',
              desc: lang==='ru'?'Все данные зашифрованы. Третьи лица не имеют доступа.':lang==='oz'?'Барча маълумотлар шифрланган.':'Barcha ma\'lumotlar shifrlangan.' },
            { icon: <Star className="w-6 h-6"/>, color: 'text-yellow-400', bg: 'bg-yellow-500/10',
              title: lang==='ru'?'Всегда доступно':lang==='oz'?'Доим мавжуд':'Doim mavjud',
              desc: lang==='ru'?'99.9% uptime. Vercel + Supabase инфраструктура.':lang==='oz'?'99.9% uptime кафолати.':'99.9% uptime kafolati. Vercel + Supabase.' },
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp} className="flex flex-col items-center"
              whileHover={{ scale: 1.04 }} transition={spring}>
              <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} mb-4`}>
                {item.icon}
              </div>
              <h3 className="font-bold text-white mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="relative max-w-4xl mx-auto px-5 py-24">
        <motion.div className="text-center mb-14"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 text-blue-400 text-sm font-medium mb-4">
            <Zap className="w-4 h-4"/>
            {lang==='ru' ? 'СРАВНЕНИЕ' : lang==='oz' ? 'TAQQOSLASH' : 'TAQQOSLASH'}
          </div>
          <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-3">
            {lang==='ru' ? 'Kabinetim.uz vs Вручную' : lang==='oz' ? "Kabinetim.uz vs Qo'lda" : "Kabinetim.uz vs Qo'lda"}
          </h2>
          <p className="text-gray-500 text-base">
            {lang==='ru' ? 'Почему тысячи компаний переходят на автоматизацию' : lang==='oz' ? "Nima uchun minglab kompaniyalar avtomatizatsiyaga o'tmoqda" : "Nima uchun minglab kompaniyalar avtomatizatsiyaga o'tmoqda"}
          </p>
        </motion.div>

        <motion.div className="overflow-hidden rounded-2xl border border-white/10"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          {/* Header row */}
          <div className="grid grid-cols-3 bg-white/[0.05] border-b border-white/10">
            <div className="px-5 py-4 text-sm font-semibold text-gray-400">
              {lang==='ru' ? 'Критерий' : lang==='oz' ? "Mezon" : "Mezon"}
            </div>
            <div className="px-5 py-4 text-sm font-black text-blue-300 text-center border-x border-white/10 bg-blue-500/10">
              Kabinetim.uz
            </div>
            <div className="px-5 py-4 text-sm font-semibold text-gray-500 text-center">
              {lang==='ru' ? 'Word вручную' : lang==='oz' ? "Word qo'lda" : "Word qo'lda"}
            </div>
          </div>

          {[
            {
              label: { uz: 'Hujjat yaratish vaqti', oz: 'Hujjat yaratish vaqti', ru: 'Время создания документа' },
              us: '~2 daqiqa',   them: '~40 daqiqa',  usGood: true,
            },
            {
              label: { uz: 'Xato ehtimoli', oz: 'Xato ehtimoli', ru: 'Вероятность ошибок' },
              us: lang==='ru'?'Минимальная':'Minimal', them: lang==='ru'?'Высокая':'Yuqori', usGood: true,
            },
            {
              label: { uz: 'Shablon soni', oz: 'Shablon soni', ru: 'Количество шаблонов' },
              us: '30+', them: lang==='ru'?'1 (самодельный)':lang==='oz'?"1 (o'zi yasagan)":"1 (o'zi yasagan)", usGood: true,
            },
            {
              label: { uz: 'Kontragent ma\'lumotlari', oz: "Kontragent ma'lumotlari", ru: 'Данные контрагента' },
              us: lang==='ru'?'Автозаполнение':lang==='oz'?'Avtoto\'ldirish':"Avtoto'ldirish", them: lang==='ru'?'Вручную каждый раз':lang==='oz'?"Har safar qo'lda":"Har safar qo'lda", usGood: true,
            },
            {
              label: { uz: 'Word + PDF eksport', oz: 'Word + PDF eksport', ru: 'Экспорт Word + PDF' },
              us: '✓', them: lang==='ru'?'Только Word':'Faqat Word', usGood: true,
            },
            {
              label: { uz: 'Ko\'p tashkilot', oz: "Ko'p tashkilot", ru: 'Несколько организаций' },
              us: '✓', them: '✗', usGood: true,
            },
            {
              label: { uz: 'AI tahlil', oz: 'AI tahlil', ru: 'AI анализ' },
              us: '✓', them: '✗', usGood: true,
            },
            {
              label: { uz: 'Narxi', oz: 'Narxi', ru: 'Стоимость' },
              us: lang==='ru'?'Бесплатно / 50 000 сум':lang==='oz'?"Bepul / 50 000 so'm":"Bepul / 50 000 so'm",
              them: lang==='ru'?'Время сотрудника':lang==='oz'?"Xodimning vaqti":"Xodimning vaqti", usGood: true,
            },
          ].map((row, i) => (
            <div key={i} className={`grid grid-cols-3 border-b border-white/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}>
              <div className="px-5 py-3.5 text-sm text-gray-400">{row.label[lang]}</div>
              <div className="px-5 py-3.5 text-sm font-semibold text-emerald-400 text-center border-x border-white/5 bg-blue-500/[0.04]">
                {row.us}
              </div>
              <div className="px-5 py-3.5 text-sm text-red-400/80 text-center">{row.them}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative max-w-3xl mx-auto px-5 pb-24">
        <motion.div className="text-center mb-14"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium mb-4">
            <MessageSquare className="w-4 h-4"/>
            FAQ
          </div>
          <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {lang==='ru' ? 'Частые вопросы' : lang==='oz' ? "Ko'p so'raladigan savollar" : "Ko'p so'raladigan savollar"}
          </h2>
        </motion.div>

        <FaqList lang={lang} />
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="/img-cta.png"
            alt=""
            fill
            className="object-cover opacity-10"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080810]/80 via-transparent to-[#080810]/80"/>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/8 to-transparent pointer-events-none"/>
        <motion.div className="max-w-3xl mx-auto px-5 text-center"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <motion.div variants={fadeUp}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-8 shadow-2xl shadow-blue-900/50"
            animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <Sparkles className="w-8 h-8 text-white"/>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
            {l.ctaTitle}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-xl mb-12 leading-relaxed max-w-xl mx-auto">{l.ctaSub}</motion.p>
          <motion.div variants={fadeUp} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={spring} className="inline-block">
            <Link href="/signup"
              className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-2xl text-xl font-black transition shadow-2xl shadow-blue-900/50 hover:shadow-blue-900/70">
              {l.ctaBtn}
              <ChevronRight className="w-6 h-6"/>
            </Link>
          </motion.div>
          <motion.p variants={fadeUp} className="text-gray-600 text-sm mt-6">{l.ctaNote}</motion.p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-5 pt-16 pb-8">

          {/* Top grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            {/* Brand col */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-sm shadow-lg shadow-blue-900/40">S</div>
                <span className="font-black text-lg bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Kabinetim.uz</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                {lang==='ru'
                  ? "O'zbekiston's first AI document management system for business."
                  : lang==='oz'
                  ? "O'zbekistonning birinchi AI hujjat boshqaruv tizimi."
                  : "O'zbekistonning birinchi AI hujjat boshqaruv tizimi."}
              </p>
              {/* Telegram */}
              <a href="https://t.me/Alisher_All" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:text-blue-300 hover:border-blue-400/40 px-4 py-2 rounded-xl text-sm transition">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.47l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.268.089z"/>
                </svg>
                @Alisher_All
              </a>
            </div>

            {/* Product col */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5">
                {lang==='ru' ? 'Продукт' : 'Mahsulot'}
              </h4>
              <ul className="space-y-3">
                {[
                  { label: l.nav[0], href: '#features' },
                  { label: l.nav[1], href: '#depts' },
                  { label: l.nav[2], href: '#pricing' },
                  { label: lang==='ru'?'Сравнение':lang==='oz'?'Taqqoslash':'Taqqoslash', href: '#' },
                  { label: 'FAQ', href: '#' },
                ].map((item, i) => (
                  <li key={i}>
                    <a href={item.href} className="text-gray-500 hover:text-gray-300 text-sm transition">{item.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Departments col */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5">
                {lang==='ru' ? 'Отделы' : lang==='oz' ? "Bo'limlar" : "Bo'limlar"}
              </h4>
              <ul className="space-y-3">
                {[
                  lang==='ru'?'Кадры':'Kadrlar',
                  lang==='ru'?'Бухгалтер':'Buxgalter',
                  lang==='ru'?'Секретарь':'Kotiba',
                  lang==='ru'?'Юрист AI':'Yurist AI',
                  lang==='ru'?'Шаблоны':'Shablonlar',
                ].map((item, i) => (
                  <li key={i}>
                    <span className="text-gray-500 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account col */}
            <div>
              <h4 className="text-white font-bold text-sm mb-5">
                {lang==='ru' ? 'Аккаунт' : 'Hisob'}
              </h4>
              <ul className="space-y-3">
                <li><Link href="/login"  className="text-gray-500 hover:text-gray-300 text-sm transition">{l.login}</Link></li>
                <li><Link href="/signup" className="text-gray-500 hover:text-gray-300 text-sm transition">{l.footerLinks[3]}</Link></li>
                <li>
                  <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/>
                    {lang==='ru'?'Сервис работает':'Xizmat ishlayapti'}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">© 2026 Kabinetim.uz — {lang==='ru'?'Все права защищены':lang==='oz'?"Barcha huquqlar himoyalangan":"Barcha huquqlar himoyalangan"}</p>
            <div className="flex gap-1">
              {(Object.keys(LANG_LABELS) as Lang[]).map(lng => (
                <button key={lng} onClick={() => setLang(lng)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition ${lang===lng ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30' : 'text-gray-600 hover:text-gray-400'}`}>
                  {LANG_LABELS[lng]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
