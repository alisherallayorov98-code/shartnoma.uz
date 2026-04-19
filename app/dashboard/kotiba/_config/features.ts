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
  title: string
  description: string
  fields: FeatureField[]
  apiType: string
  resultField: string
  isCustomComponent?: boolean
}

export const FEATURES: FeatureConfig[] = [
  {
    key: 'bayonnoma', icon: '📝', title: "Yig'ilish bayonnomasi",
    description: "Kredit, dividend, xarid, ta'sischi va boshqa turlari",
    apiType: '', resultField: '', fields: [], isCustomComponent: true,
  },
  {
    key: 'rasmiy_xat', icon: '✉️', title: 'Rasmiy xat',
    description: "Hamkorlar, davlat organlari yoki kontragentlarga rasmiy xat",
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
    key: 'taklifnoma', icon: '📨', title: 'Taklifnoma',
    description: "Tadbir, seminar yoki uchrashuvga rasmiy taklifnoma",
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
    key: 'hisobot', icon: '📊', title: 'Hisobot',
    description: "Oylik, kvartallik yoki loyiha bo'yicha rasmiy hisobot",
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
    key: 'eslatma', icon: '📌', title: 'Ichki eslatma (memo)',
    description: "Xodimlarga yoki bo'limlarga rasmiy ichki eslatma",
    apiType: 'eslatma', resultField: 'eslatma',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "Barcha bo'lim boshliqlari" },
      { key: 'mavzu', label: 'Mavzu', placeholder: "Ish vaqti tartibiga rioya qilish haqida" },
      { key: 'mazmun', label: 'Mazmun', placeholder: "Quyidagilarga e'tiboringizni qaratishingizni so'raymiz...", textarea: true },
      { key: 'muddat', label: "Muddat (ixtiyoriy)", placeholder: '20-aprelgacha' },
    ],
  },
  {
    key: 'murojaatnoma', icon: '📋', title: "Murojaatnoma / ariza",
    description: "Davlat organlari yoki rahbariyatga rasmiy murojaatnoma",
    apiType: 'murojaatnoma', resultField: 'murojaatnoma',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "Toshkent shahar hokimligiga" },
      { key: 'maqsad', label: "Maqsad", placeholder: "Ruxsatnoma berish so'rash" },
      { key: 'asosiy_mazmun', label: 'Mazmun', placeholder: "Biz O'zbekiston Respublikasining ...", textarea: true },
      { key: 'kutilgan_natija', label: "Kutilayotgan natija", placeholder: "30 kunlik ruxsatnoma berish" },
    ],
  },
  {
    key: 'tushuntirish_xati', icon: '📄', title: "Tushuntirish xati",
    description: "Xodimdan yoki tashkilotdan rasmiy tushuntirish xati",
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
    key: 'ishonchnoma', icon: '📜', title: 'Ishonchnoma',
    description: "Kompaniya nomidan vakil tayinlash — bank, hujjat, tender",
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
    key: 'dalolatnoma', icon: '📑', title: 'Dalolatnoma',
    description: "Qabul-topshirish, yo'qotish, inventarizatsiya dalolatnomasi",
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
    key: 'kafolat_xat', icon: '🔒', title: 'Kafolat xati',
    description: "Hamkor, bank yoki davlat organiga kafolat xati",
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
    key: 'tabriklash_xat', icon: '🎉', title: 'Tabriklash xati',
    description: "Sherik, mijoz yoki tashkilotga rasmiy tabrik xati",
    apiType: 'tabriklash_xat', resultField: 'tabriklash_xat',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "\"Alfa\" MChJ direktori Karimov Alisher" },
      { key: 'bayram', label: "Bayram", placeholder: "Yangi yil / Navro'z / Tashkilot yubileyi" },
      { key: 'asosiy_mazmun', label: "Mazmun (ixtiyoriy)", placeholder: "Hamkorlik uchun minnatdorchilik...", textarea: true },
    ],
  },
  {
    key: 'rekvizitlar_xat', icon: '📨', title: 'Rekvizitlar xati',
    description: "Hamkordan bank rekvizitlari yoki hujjat so'rash",
    apiType: 'rekvizitlar_xat', resultField: 'rekvizitlar_xat',
    fields: [
      { key: 'kimga', label: "Kimga", placeholder: "\"Beta Savdo\" MChJ" },
      { key: 'sorov_turi', label: "So'rov turi", placeholder: "Bank rekvizitlari / Ustav nusxasi" },
      { key: 'maqsad', label: "Maqsad", placeholder: "Shartnoma tuzish uchun" },
      { key: 'muddat', label: "Javob muddati", placeholder: "2 ish kuni ichida" },
    ],
  },
  {
    key: 'buyruq', icon: '📜', title: 'Tashkiliy buyruqlar',
    description: "Asosiy vosita, komissiya, safari, vazifa va boshqa buyruqlar",
    apiType: '', resultField: '', fields: [], isCustomComponent: true,
  },
  {
    key: 'firmenniy_blank', icon: '🏢', title: "Tashkilot blankasi (firmenniy blank)",
    description: "Tashkilot sarlavhali bo'sh rasmiy xat blankini Word formatda yuklab oling",
    apiType: '', resultField: '', fields: [], isCustomComponent: true,
  },
  {
    key: 'tashkilot_rekvizitlari', icon: '📋', title: 'Tashkilot rekvizitlari',
    description: "Tashkilotingiz to'liq rekvizitlarini Word hujjat sifatida yuklab oling",
    apiType: '', resultField: '', fields: [], isCustomComponent: true,
  },
]
