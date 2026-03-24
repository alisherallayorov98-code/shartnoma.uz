'use client'

import Link from 'next/link'
import {
  FileText, Building2, Users, Download, Shield,
  CheckCircle, ArrowRight, Zap, Star, Crown, Sparkles,
  Clock, Lock, ChevronRight, Bot, Briefcase, Calculator,
  PenTool, Scale, MessageSquare, FileCheck, UserCheck
} from 'lucide-react'
import { useLang } from '@/lib/LanguageContext'
import { LANG_LABELS, type Lang } from '@/lib/i18n'

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
    featuresTag: "IMKONIYATLAR", featuresTitle: "Nima uchun Shartnoma.uz?",
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
    freeFeatures: ["Oyiga 5 ta hujjat", "8 tur shartnoma", "Word va PDF yuklab olish", "Kontragentlar bazasi", "Shartnoma.uz belgili PDF"],
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
    featuresTag: "ИМКОНИЯТЛАР", featuresTitle: "Нима учун Shartnoma.uz?",
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
    freeFeatures: ["Ойига 5 та ҳужжат", "8 тур шартнома", "Word ва PDF юклаб олиш", "Контрагентлар базаси", "Shartnoma.uz белгили PDF"],
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
    featuresTag: "ВОЗМОЖНОСТИ", featuresTitle: "Почему Shartnoma.uz?",
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
    freeFeatures: ["5 документов в месяц", "8 типов договоров", "Скачивание Word и PDF", "База контрагентов", "PDF с маркой Shartnoma.uz"],
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
  const l = LP[lang]

  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">

      {/* ── BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px]"/>
        <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"/>
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] bg-cyan-600/8 rounded-full blur-[100px]"/>
      </div>

      {/* ── HEADER ── */}
      <header className="relative border-b border-white/5 sticky top-0 bg-[#080810]/85 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-sm shadow-lg shadow-blue-900/60">
              S
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Shartnoma.uz
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
            <Link href="/login" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition hidden sm:block">
              {l.login}
            </Link>
            <Link href="/signup"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-sm font-bold transition shadow-lg shadow-blue-900/40 flex items-center gap-2">
              {l.cta} <ArrowRight className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative max-w-7xl mx-auto px-5 pt-24 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/30 text-blue-300 text-xs px-5 py-2.5 rounded-full mb-10 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400"/>
          {l.badge}
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.08] tracking-tight">
          <span className="bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent block">
            {l.h1a}
          </span>
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
            {l.h1b}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">{l.subtitle}</p>

        <div className="flex gap-4 justify-center flex-wrap mb-16">
          <Link href="/signup"
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 rounded-2xl text-lg font-bold transition shadow-2xl shadow-blue-900/50 flex items-center gap-3">
            {l.cta}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
          </Link>
          <a href="#how"
            className="px-8 py-4 border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 rounded-2xl text-lg transition text-gray-300 hover:text-white">
            {l.how}
          </a>
        </div>

        <p className="text-sm text-gray-600 mb-20">{l.freeNote}</p>

        {/* AI Demo preview */}
        <div className="relative mx-auto max-w-4xl">
          <div className="absolute inset-0 bg-gradient-to-t from-[#080810] via-transparent to-transparent z-10 pointer-events-none" style={{top:'70%'}}/>
          <div className="bg-gray-900/60 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5 bg-white/[0.02]">
              <div className="w-3 h-3 rounded-full bg-red-500/70"/>
              <div className="w-3 h-3 rounded-full bg-yellow-500/70"/>
              <div className="w-3 h-3 rounded-full bg-green-500/70"/>
              <div className="flex-1 bg-gray-800/60 rounded-full h-6 mx-6 flex items-center px-4">
                <span className="text-gray-500 text-xs">shartnoma.uz/dashboard/kadrlar</span>
              </div>
            </div>
            {/* Content */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: sidebar + stats */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: lang==='ru'?'Кадры':lang==='oz'?'Кадрлар':'Kadrlar', val: '15', color: 'bg-blue-900/60 text-blue-300' },
                    { label: lang==='ru'?'Договоры':lang==='oz'?'Шартномалар':'Shartnomalar', val: '32', color: 'bg-emerald-900/60 text-emerald-300' },
                    { label: lang==='ru'?'Бухг.':lang==='oz'?'Бухг.':'Buxg.', val: '8', color: 'bg-violet-900/60 text-violet-300' },
                    { label: lang==='ru'?'Котиба':lang==='oz'?'Котиба':'Kotiba', val: '12', color: 'bg-orange-900/60 text-orange-300' },
                  ].map((c,i)=>(
                    <div key={i} className={`${c.color} rounded-xl p-3 text-left border border-white/5`}>
                      <div className="text-xl font-black">{c.val}</div>
                      <div className="text-xs opacity-70 mt-0.5">{c.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3 space-y-2">
                  {[
                    { name: lang==='ru'?'Трудовой договор':lang==='oz'?'Меҳнат шартномаси':'Mehnat shartnomasi', status: lang==='ru'?'Готово':lang==='oz'?'Тайёр':'Tayyor', color: 'text-emerald-400' },
                    { name: lang==='ru'?'Приказ об отпуске':lang==='oz'?'Таътил буйруғи':'Ta\'til buyrug\'i', status: 'AI', color: 'text-blue-400' },
                    { name: lang==='ru'?'Акт выпол. работ':lang==='oz'?'Далолатнома':'Dalolatnoma', status: lang==='ru'?'Готово':lang==='oz'?'Тайёр':'Tayyor', color: 'text-emerald-400' },
                  ].map((item,i)=>(
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-900/60 rounded-lg flex-shrink-0"/>
                        <span className="text-xs text-gray-300">{item.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${item.color} bg-gray-700/50 px-2 py-0.5 rounded-full`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right: AI chat */}
              <div className="bg-gray-800/40 rounded-xl p-3 space-y-2.5 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white"/>
                  </div>
                  <span className="text-xs font-semibold text-blue-300">Kadrlar AI</span>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full ml-auto"/>
                </div>
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-blue-600/30 border border-blue-500/30 rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                    <p className="text-xs text-gray-200 leading-relaxed">
                      {lang==='ru' ? 'Договор для Ахмедова на 3 месяца, оклад 2,500,000' : lang==='oz' ? 'Аҳмедов учун 3 ойлик, 2 500 000 маош' : "Ahmedov uchun 3 oylik, 2 500 000 maosh"}
                    </p>
                  </div>
                </div>
                {/* AI message */}
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Bot className="w-3 h-3 text-white"/>
                  </div>
                  <div className="bg-gray-700/50 border border-white/5 rounded-xl rounded-tl-sm px-3 py-2 flex-1">
                    <p className="text-xs text-gray-300 leading-relaxed font-mono">
                      {lang==='ru' ? 'ТРУДОВОЙ ДОГОВОР\n\nРаботник: Ахмедов...\nОклад: 2 500 000 сум\nСрок: 3 месяца...' : lang==='oz' ? 'МЕҲНАТ ШАРТНОМАСИ\n\nХодим: Аҳмедов...\nМаош: 2 500 000 сўм...' : "MEHNAT SHARTNOMASI\n\nXodim: Ahmedov...\nMaosh: 2 500 000 so'm..."}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <div className="flex-1 bg-gray-700/40 rounded-lg px-2.5 py-1.5 text-xs text-gray-500">
                    {lang==='ru' ? 'Сообщение...' : lang==='oz' ? 'Хабар...' : 'Xabar...'}
                  </div>
                  <button className="bg-blue-600 rounded-lg px-3 py-1.5">
                    <ArrowRight className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative border-y border-white/5 py-12 bg-white/[0.015]">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {l.statsValues.map((val, i) => (
            <div key={i} className="group">
              <div className="text-4xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-2 group-hover:from-blue-300 group-hover:to-blue-500 transition-all duration-300">{val}</div>
              <div className="text-gray-500 text-sm">{l.statsLabels[i]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEPARTMENTS ── */}
      <section id="depts" className="relative max-w-7xl mx-auto px-5 py-28">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-cyan-400 text-sm font-medium mb-4">
            <Briefcase className="w-4 h-4"/> {l.deptTag}
          </div>
          <h2 className="text-5xl font-black mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {l.deptTitle}
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">{l.deptSub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {l.depts.map((dept, i) => {
            const st = DEPT_STYLES[i]
            return (
              <div key={i} className={`group relative bg-gradient-to-br ${st.gradient} border ${st.border} rounded-3xl p-8 hover:scale-[1.01] transition-all duration-300`}>
                <div className="flex items-start gap-5 mb-6">
                  <div className={`w-14 h-14 ${st.iconBg} rounded-2xl flex items-center justify-center ${st.iconColor} flex-shrink-0`}>
                    {DEPT_ICONS[i]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white mb-1">{dept.name}</h3>
                    <p className="text-gray-400 text-sm">{dept.desc}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dept.docs.map((doc, j) => (
                    <span key={j} className={`text-xs px-3 py-1.5 rounded-full ${st.badge} border border-white/5`}>
                      {doc}
                    </span>
                  ))}
                </div>
                <div className={`absolute top-6 right-6 w-2 h-2 ${st.dot} rounded-full`}/>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative border-y border-white/5 bg-white/[0.015] py-28">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
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
                <div key={i} className={`group bg-gradient-to-br ${st.gradient} border ${st.border} rounded-2xl p-7 hover:scale-[1.02] transition-all duration-300`}>
                  <div className={`w-14 h-14 ${st.iconBg} rounded-2xl flex items-center justify-center ${st.iconColor} mb-6`}>
                    {FEATURES_ICONS[i]}
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-white">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="relative max-w-5xl mx-auto px-5 py-28">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium mb-4">
            <Clock className="w-4 h-4"/> {l.howTag}
          </div>
          <h2 className="text-5xl font-black bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {l.howTitle}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-600/50 via-purple-600/50 to-emerald-600/50"/>
          {l.steps.map((s, i) => {
            const colors = [
              { color: 'from-blue-600 to-cyan-600', shadow: 'shadow-blue-900/40' },
              { color: 'from-purple-600 to-pink-600', shadow: 'shadow-purple-900/40' },
              { color: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-900/40' },
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
      </section>

      {/* ── AI DEMO SECTION ── */}
      <section className="relative border-y border-white/5 bg-white/[0.015] py-28">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-yellow-400 text-sm font-medium mb-4">
              <MessageSquare className="w-4 h-4"/> {l.aiDemoTag}
            </div>
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
              {l.aiDemoTitle}
            </h2>
            <p className="text-gray-400 text-lg">{l.aiDemoSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Chat panel */}
            <div className="bg-gray-900/70 border border-white/10 rounded-3xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white"/>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Kadrlar AI</div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"/>
                    {lang==='ru' ? 'Онлайн' : lang==='oz' ? 'Онлайн' : 'Onlayn'}
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-blue-600/25 border border-blue-500/25 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-gray-200 leading-relaxed">{l.aiPrompt}</p>
                  </div>
                </div>
                {/* AI response */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex-shrink-0 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white"/>
                  </div>
                  <div className="bg-gray-800/60 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
                    <pre className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">{l.aiReply}</pre>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-800/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-500">
                    {lang==='ru' ? 'Опишите документ...' : lang==='oz' ? 'Ҳужжатни тавсифланг...' : "Hujjatni tasvirlab bering..."}
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-500 rounded-xl px-4 py-2.5 transition">
                    <ArrowRight className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            </div>

            {/* Result panel */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-blue-900/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600"/>
                  <span className="font-bold text-gray-800 text-sm">
                    {lang==='ru' ? 'Трудовой договор.docx' : lang==='oz' ? 'Меҳнат шартномаси.docx' : 'Mehnat shartnomasi.docx'}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-7 px-3 bg-blue-600 text-white text-xs rounded-lg flex items-center gap-1 font-medium">
                    <Download className="w-3 h-3"/> Word
                  </div>
                  <div className="h-7 px-3 bg-red-600 text-white text-xs rounded-lg flex items-center gap-1 font-medium">
                    <Download className="w-3 h-3"/> PDF
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-center font-black text-gray-900 text-base mb-4">
                  {lang==='ru' ? 'ТРУДОВОЙ ДОГОВОР' : lang==='oz' ? 'МЕҲНАТ ШАРТНОМАСИ' : 'MEHNAT SHARTNOMASI'}
                </div>
                {[
                  { w: 'w-full', dark: true },
                  { w: 'w-4/5', dark: false },
                  { w: 'w-full', dark: false },
                  { w: 'w-3/4', dark: false },
                  { w: 'w-full', dark: false },
                  { w: 'w-5/6', dark: false },
                  { w: 'w-full', dark: false },
                  { w: 'w-2/3', dark: false },
                ].map((line, i) => (
                  <div key={i} className={`h-2 ${line.dark ? 'bg-gray-400' : 'bg-gray-200'} rounded-full ${line.w}`}/>
                ))}
                <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <div className="h-1.5 w-20 bg-gray-200 rounded mb-1"/>
                    <div className="h-1.5 w-28 bg-gray-300 rounded"/>
                    <div className="mt-4 h-8 w-24 border-b-2 border-gray-400"/>
                  </div>
                  <div>
                    <div className="h-1.5 w-20 bg-gray-200 rounded mb-1"/>
                    <div className="h-1.5 w-28 bg-gray-300 rounded"/>
                    <div className="mt-4 h-8 w-24 border-b-2 border-gray-400"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative max-w-6xl mx-auto px-5 py-28">
        <div className="text-center mb-16">
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
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all">
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
          </div>

          {/* STANDARD */}
          <div className="relative bg-gradient-to-b from-blue-600/20 to-blue-900/10 border border-blue-500/40 rounded-3xl p-8 shadow-2xl shadow-blue-900/25 scale-[1.02]">
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
          </div>

          {/* AI PRO */}
          <div className="relative bg-gradient-to-b from-purple-600/20 to-purple-900/10 border border-purple-500/30 rounded-3xl p-8 hover:border-purple-500/50 transition-all">
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
          </div>
        </div>
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
            <div className="space-y-3">
              {[
                { label: lang==='ru'?'Организация':lang==='oz'?'Ташкилот':"Tashkilot", value: '"JAMSHIDBEK NUR KURGAN" MCHJ' },
                { label: 'STIR', value: '307367795' },
                { label: lang==='ru'?'Расчётный счёт':lang==='oz'?'Ҳисоб рақами':"Hisob raqami", value: '20208000505219713001' },
                { label: lang==='ru'?'Банк':lang==='oz'?'Банк':'Bank', value: '"Biznesni rivojlantirish banki" ATB Bosh ofisi' },
                { label: 'MFO', value: '01037' },
              ].map((row, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-gray-500 text-sm flex-shrink-0">{row.label}</span>
                  <span className="text-white text-sm font-medium text-right">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-3 bg-white/[0.03] rounded-xl p-4">
              <div className="w-9 h-9 bg-blue-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 text-base">✉</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-300 text-sm">
                  {lang==='ru'
                    ? 'После оплаты отправьте чек на:'
                    : lang==='oz'
                    ? "To'lovdan so'ng chekni yuboring:"
                    : "To'lovdan so'ng chekni yuboring:"}
                </p>
                <a href="tel:+998979291970" className="text-blue-400 font-bold text-base hover:text-blue-300 transition">
                  +998 97 929 19 70
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="relative border-y border-white/5 bg-white/[0.015] py-14">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
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
            <div key={i} className="flex flex-col items-center">
              <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center ${item.color} mb-4`}>
                {item.icon}
              </div>
              <h3 className="font-bold text-white mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/8 to-transparent pointer-events-none"/>
        <div className="max-w-3xl mx-auto px-5 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-8 shadow-2xl shadow-blue-900/50">
            <Sparkles className="w-8 h-8 text-white"/>
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
            {l.ctaTitle}
          </h2>
          <p className="text-gray-400 text-xl mb-12 leading-relaxed max-w-xl mx-auto">{l.ctaSub}</p>
          <Link href="/signup"
            className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-2xl text-xl font-black transition shadow-2xl shadow-blue-900/50 hover:shadow-blue-900/70">
            {l.ctaBtn}
            <ChevronRight className="w-6 h-6"/>
          </Link>
          <p className="text-gray-600 text-sm mt-6">{l.ctaNote}</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-black text-xs">S</div>
            <span className="font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Shartnoma.uz</span>
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
