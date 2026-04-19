import type { Lang } from '@/lib/i18n'

export type KotibaFeature =
  | 'bayonnoma' | 'rasmiy_xat' | 'taklifnoma'
  | 'hisobot' | 'eslatma' | 'murojaatnoma' | 'tushuntirish_xati'
  | 'ishonchnoma' | 'dalolatnoma' | 'kafolat_xat' | 'tabriklash_xat' | 'rekvizitlar_xat'
  | 'buyruq' | 'firmenniy_blank' | 'tashkilot_rekvizitlari'

export type FeatureField = {
  key: string
  label: string
  placeholder: string
  type?: string
  textarea?: boolean
  isCpField?: boolean
}

export type FeatureConfig = {
  key: KotibaFeature
  icon: string
  title: Record<Lang, string>
  description: Record<Lang, string>
  fields: FeatureField[]
  apiType: string
  resultField: string
  isCustomComponent?: boolean
}

export const FEATURES: FeatureConfig[] = [
  {
    key: 'bayonnoma', icon: '📝',
    title: { uz: "Yig'ilish bayonnomasi", oz: "Йиғилиш баённомаси", ru: "Протокол собрания" },
    description: { uz: "Kredit, dividend, xarid, ta'sischi va boshqa turlari", oz: "Кредит, дивиденд, харид, таъсисчи ва бошқа турлари", ru: "Кредит, дивиденды, закупки, учредители и другие виды" },
    apiType: '', resultField: '', fields: [], isCustomComponent: true,
  },
  {
    key: 'rasmiy_xat', icon: '✉️',
    title: { uz: 'Rasmiy xat', oz: 'Расмий хат', ru: 'Официальное письмо' },
    description: { uz: "Hamkorlar, davlat organlari yoki kontragentlarga rasmiy xat", oz: "Ҳамкорлар, давлат органлари ёки контрагентларга расмий хат", ru: "Официальное письмо партнёрам, госорганам или контрагентам" },
    apiType: 'rasmiy_xat', resultField: 'xat',
    fields: [
      { key: 'kim_uchun', label: "Kimga", placeholder: "Soliq inspeksiyasi boshlig'iga", isCpField: true },
      { key: 'mavzu', label: 'Mavzu', placeholder: "Ma'lumot so'rash haqida" },
      { key: 'xat_raqami', label: 'Xat raqami', placeholder: '25/03-15' },
      { key: 'sana', label: 'Sana', placeholder: '', type: 'date' },
      { key: 'asosiy_mazmun', label: "Mazmun", placeholder: "2024-yil 3-kvartal hisoboti bo'yicha...", textarea: true },
      { key: 'muddati', label: 'Javob muddati (ixtiyoriy)', placeholder: '10 ish kuni ichida' },
    ],
  },
  {
    key: 'taklifnoma', icon: '📨',
    title: { uz: 'Taklifnoma', oz: 'Таклифнома', ru: 'Приглашение' },
    description: { uz: "Tadbir, seminar yoki uchrashuvga rasmiy taklifnoma", oz: "Тадбир, семинар ёки учрашувга расмий таклифнома", ru: "Официальное приглашение на мероприятие, семинар или встречу" },
    apiType: 'taklifnoma', resultField: 'taklifnoma',
    fields: [
      { key: 'tadbir_nomi', label: 'Tadbir nomi', placeholder: "Yillik sheriklar konferensiyasi" },
      { key: 'tadbir_sana', label: 'Sana va vaqt', placeholder: '15-aprel 2025, soat 10:00' },
      { key: 'tadbir_joyi', label: 'Joyi', placeholder: "Toshkent, Hyatt Regency" },
      { key: 'mehmonga', label: "Kimga", placeholder: 'Alfa Texnologiya MChJ direktori' },
      { key: 'dastur', label: 'Dastur', placeholder: "Ochilish, ma'ruzalar, tushlik, muhokama", textarea: true },
    ],
  },
  {
    key: 'hisobot', icon: '📊',
    title: { uz: 'Hisobot', oz: 'Ҳисобот', ru: 'Отчёт' },
    description: { uz: "Oylik, kvartallik yoki loyiha bo'yicha rasmiy hisobot", oz: "Ойлик, кварталлик ёки лойиҳа бўйича расмий ҳисобот", ru: "Официальный отчёт: месячный, квартальный или по проекту" },
    apiType: 'hisobot', resultField: 'hisobot',
    fields: [
      { key: 'hisobot_turi', label: 'Hisobot turi', placeholder: 'Oylik faoliyat hisoboti' },
      { key: 'davr', label: 'Davr', placeholder: '2025-yil mart oyi' },
      { key: 'bajarilgan_ishlar', label: 'Bajarilgan ishlar', placeholder: "- 3 ta yangi shartnoma imzolandi", textarea: true },
      { key: 'muammolar', label: "Muammolar (ixtiyoriy)", placeholder: "Etkazib berish kechikdi..." },
      { key: 'rejalar', label: "Keyingi davr rejalari", placeholder: "- Yangi bozorga chiqish", textarea: true },
    ],
  },
  {
    key: 'eslatma', icon: '📌',
    title: { uz: 'Ichki eslatma (memo)', oz: 'Ички эслатма (memo)', ru: 'Внутренняя памятка (memo)' },
    description: { uz: "Xodimlarga yoki bo'limlarga rasmiy ichki eslatma", oz: "Ходимларга ёки бўлимларга расмий ички эслатма", ru: "Официальная внутренняя памятка сотрудникам или отделам" },
    apiType: 'eslatma', resultField: 'eslatma',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "Barcha bo'lim boshliqlari" },
      { key: 'mavzu', label: 'Mavzu', placeholder: "Ish vaqti tartibiga rioya qilish haqida" },
      { key: 'mazmun', label: 'Mazmun', placeholder: "Quyidagilarga e'tiboringizni qaratishingizni so'raymiz...", textarea: true },
      { key: 'muddat', label: "Muddat (ixtiyoriy)", placeholder: '20-aprelgacha' },
    ],
  },
  {
    key: 'murojaatnoma', icon: '📋',
    title: { uz: "Murojaatnoma / ariza", oz: "Мурожааtnoma / ариза", ru: "Обращение / заявление" },
    description: { uz: "Davlat organlari yoki rahbariyatga rasmiy murojaatnoma", oz: "Давлат органлари ёки раҳбариятга расмий мурожаатнома", ru: "Официальное обращение в госорганы или руководство" },
    apiType: 'murojaatnoma', resultField: 'murojaatnoma',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "Toshkent shahar hokimligiga" },
      { key: 'maqsad', label: "Maqsad", placeholder: "Ruxsatnoma berish so'rash" },
      { key: 'asosiy_mazmun', label: 'Mazmun', placeholder: "Biz O'zbekiston Respublikasining ...", textarea: true },
      { key: 'kutilgan_natija', label: "Kutilayotgan natija", placeholder: "30 kunlik ruxsatnoma berish" },
    ],
  },
  {
    key: 'tushuntirish_xati', icon: '📄',
    title: { uz: "Tushuntirish xati", oz: "Тушунтириш хати", ru: "Объяснительная записка" },
    description: { uz: "Xodimdan yoki tashkilotdan rasmiy tushuntirish xati", oz: "Ходимдан ёки ташкилотдан расмий тушунтириш хати", ru: "Официальная объяснительная от сотрудника или организации" },
    apiType: 'tushuntirish_xati', resultField: 'tushuntirish',
    fields: [
      { key: 'xodim_ism', label: "Xodim ismi", placeholder: "Rahimov Bobur Aliyevich" },
      { key: 'lavozim', label: "Lavozim", placeholder: "Bosh muhandis" },
      { key: 'hodisa', label: "Voqea", placeholder: "3-aprel kuni kechikib kelgan" },
      { key: 'sabab', label: "Sabab", placeholder: "Transport muammosi tufayli...", textarea: true },
      { key: 'qayta_takrorlanmasligi', label: "Takrorlanmaslik choralari (ixtiyoriy)", placeholder: "Bundan buyon erta chiqishga harakat qilaman..." },
    ],
  },
  {
    key: 'ishonchnoma', icon: '📜',
    title: { uz: 'Ishonchnoma', oz: 'Ишончнома', ru: 'Доверенность' },
    description: { uz: "Kompaniya nomidan vakil tayinlash — bank, hujjat, tender", oz: "Компания номидан вакил тайинлаш — банк, ҳужжат, тендер", ru: "Назначение представителя от компании — банк, документы, тендер" },
    apiType: 'ishonchnoma', resultField: 'ishonchnoma',
    fields: [
      { key: 'vakil_ism', label: "Vakil F.I.Sh.", placeholder: "Rahimov Bobur Aliyevich" },
      { key: 'vakil_lavozim', label: "Lavozim", placeholder: "Bosh buxgalter" },
      { key: 'vakil_passport', label: "Pasport", placeholder: "AB1234567" },
      { key: 'vakolat_maqsad', label: "Vakolat maqsadi", placeholder: "Soliq inspeksiyasidan hujjat olish...", textarea: true },
      { key: 'amal_muddati', label: "Muddat", placeholder: "6 oy / 1 yil / 2026 yil 31 dekabrgacha" },
    ],
  },
  {
    key: 'dalolatnoma', icon: '📑',
    title: { uz: 'Dalolatnoma', oz: 'Далолатнома', ru: 'Акт' },
    description: { uz: "Qabul-topshirish, yo'qotish, inventarizatsiya dalolatnomasi", oz: "Қабул-топшириш, йўқотиш, инвентаризация далолатномаси", ru: "Акт приёма-передачи, утраты или инвентаризации" },
    apiType: 'dalolatnoma', resultField: 'dalolatnoma',
    fields: [
      { key: 'dalolatnoma_turi', label: "Tur", placeholder: "Qabul-topshirish / Yo'qotish / Inventarizatsiya" },
      { key: 'sana', label: "Sana", placeholder: "2026-03-23", type: 'date' },
      { key: 'joy', label: "Joy", placeholder: "Tashkilot omborxonasi, Toshkent" },
      { key: 'ishtirokchilar', label: "Ishtirokchilar", placeholder: "Ombor mudiri Karimov A., Buxgalter Rahimova N." },
      { key: 'predmet', label: "Predmet", placeholder: "Nima topshirildi / tekshirildi / yo'qoldi", textarea: true },
      { key: 'xulosa', label: "Xulosa", placeholder: "Hujjatlar to'liq topshirildi...", textarea: true },
    ],
  },
  {
    key: 'kafolat_xat', icon: '🔒',
    title: { uz: 'Kafolat xati', oz: 'Кафолат хати', ru: 'Гарантийное письмо' },
    description: { uz: "Hamkor, bank yoki davlat organiga kafolat xati", oz: "Ҳамкор, банк ёки давлат органига кафолат хати", ru: "Гарантийное письмо партнёру, банку или госоргану" },
    apiType: 'kafolat_xat', resultField: 'kafolat_xat',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "Ipoteka-bank bosh ofisi" },
      { key: 'kafolat_maqsad', label: "Maqsad", placeholder: "Kredit to'lovlari / Shartnoma bajarish" },
      { key: 'kafolat_miqdori', label: "Summa (ixtiyoriy)", placeholder: "500 000 000 so'm" },
      { key: 'kafolat_muddati', label: "Muddat", placeholder: "2026 yil 31 dekabrgacha" },
      { key: 'qoshimcha', label: "Qo'shimcha (ixtiyoriy)", placeholder: "Shartnoma bajarilmagan taqdirda...", textarea: true },
    ],
  },
  {
    key: 'tabriklash_xat', icon: '🎉',
    title: { uz: 'Tabriklash xati', oz: 'Табриклаш хати', ru: 'Поздравительное письмо' },
    description: { uz: "Sherik, mijoz yoki tashkilotga rasmiy tabrik xati", oz: "Шерик, мижоз ёки ташкилотга расмий табрик хати", ru: "Официальное поздравительное письмо партнёру, клиенту или организации" },
    apiType: 'tabriklash_xat', resultField: 'tabriklash_xat',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "\"Alfa\" MChJ direktori Karimov Alisher" },
      { key: 'bayram', label: "Bayram", placeholder: "Yangi yil / Navro'z / Tashkilot yubileyi" },
      { key: 'asosiy_mazmun', label: "Mazmun (ixtiyoriy)", placeholder: "Hamkorlik uchun minnatdorchilik...", textarea: true },
    ],
  },
  {
    key: 'rekvizitlar_xat', icon: '📨',
    title: { uz: 'Rekvizitlar xati', oz: 'Реквизитлар хати', ru: 'Запрос реквизитов' },
    description: { uz: "Hamkordan bank rekvizitlari yoki hujjat so'rash", oz: "Ҳамкордан банк реквизитлари ёки ҳужжат сўраш", ru: "Запрос банковских реквизитов или документов у партнёра" },
    apiType: 'rekvizitlar_xat', resultField: 'rekvizitlar_xat',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "\"Beta Savdo\" MChJ" },
      { key: 'sorov_turi', label: "So'rov turi", placeholder: "Bank rekvizitlari / Ustav nusxasi" },
      { key: 'maqsad', label: "Maqsad", placeholder: "Shartnoma tuzish uchun" },
      { key: 'muddat', label: "Javob muddati", placeholder: "2 ish kuni ichida" },
    ],
  },
  {
    key: 'buyruq', icon: '📜',
    title: { uz: 'Tashkiliy buyruqlar', oz: 'Ташкилий буйруқлар', ru: 'Организационные приказы' },
    description: { uz: "Asosiy vosita, komissiya, safari, vazifa va boshqa buyruqlar", oz: "Асосий восита, комиссия, сафари, вазифа ва бошқа буйруқлар", ru: "Приказы: основные средства, комиссии, командировки, задания" },
    apiType: '', resultField: '', fields: [], isCustomComponent: true,
  },
  {
    key: 'firmenniy_blank', icon: '🏢',
    title: { uz: "Tashkilot blankasi", oz: "Ташкилот бланкаси", ru: "Фирменный бланк" },
    description: { uz: "Tashkilot sarlavhali bo'sh rasmiy xat blankini Word formatda yuklab oling", oz: "Ташкилот сарлавҳали бўш расмий хат бланкини Word форматда юклаб олинг", ru: "Скачайте пустой фирменный бланк организации в формате Word" },
    apiType: '', resultField: '', fields: [], isCustomComponent: true,
  },
  {
    key: 'tashkilot_rekvizitlari', icon: '📋',
    title: { uz: 'Tashkilot rekvizitlari', oz: 'Ташкилот реквизитлари', ru: 'Реквизиты организации' },
    description: { uz: "Tashkilotingiz to'liq rekvizitlarini Word hujjat sifatida yuklab oling", oz: "Ташкилотингиз тўлиқ реквизитларини Word ҳужжат сифатида юклаб олинг", ru: "Скачайте полные реквизиты организации в виде Word-документа" },
    apiType: '', resultField: '', fields: [], isCustomComponent: true,
  },
]
