export type Band = { matn: string }
export type Bolim = { sarlavha: string; bandlar: Band[] }
export type ContractStructure = { bolimlar: Bolim[] }

// Shablonni to'ldirish uchun ma'lumotlar
export type TemplateData = {
  contract_number: string
  contract_date: string
  city: string
  org_name: string
  org_inn: string
  org_director: string
  cp_name: string
  cp_inn: string
  cp_director: string
  amount: number
  amount_text: string
  extra?: Record<string, string>
}

// "2026-03-22" → "22.03.2026-yil"
export function formatDateUz(dateStr: string | undefined): string {
  if (!dateStr) return '___'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const [y, m, d] = parts
  return `${d}.${m}.${y}-yil`
}

function yearEnd(dateStr: string | undefined): string {
  if (!dateStr) return '___'
  const year = dateStr.split('-')[0]
  if (!year || year.length !== 4) return '___'
  return `31.12.${year}-yil`
}

function fill(text: string, d: Partial<TemplateData>): string {
  let result = text
    .replace(/\[RAQAM\]/g, d.contract_number || '___')
    .replace(/\[SANA\]/g, formatDateUz(d.contract_date))
    .replace(/\[SHAHAR\]/g, d.city || 'Toshkent')
    .replace(/\[YIL_OXIRI\]/g, yearEnd(d.contract_date))
    .replace(/\[BUYURTMACHI\]/g, d.org_name || '_________________')
    .replace(/\[BUYURTMACHI_INN\]/g, d.org_inn || '___')
    .replace(/\[BUYURTMACHI_RAHBAR\]/g, d.org_director || '___')
    .replace(/\[IJROCHI\]/g, d.cp_name || '_________________')
    .replace(/\[IJROCHI_INN\]/g, d.cp_inn || '___')
    .replace(/\[IJROCHI_RAHBAR\]/g, d.cp_director || '___')
    .replace(/\[SUMMA\]/g, d.amount ? d.amount.toLocaleString('uz-UZ') : '___')
    .replace(/\[SUMMA_MATN\]/g, (d.amount && d.amount_text) ? d.amount_text : '___')
  if (d.extra) {
    for (const [key, value] of Object.entries(d.extra)) {
      result = result.replace(new RegExp(`\\[${key.toUpperCase()}\\]`, 'g'), value || '___')
    }
  }
  return result
}

// Summani so'zga aylantirish — uz / oz / ru
export function numberToWords(num: number, lang: 'uz' | 'oz' | 'ru' = 'uz'): string {
  if (!num || isNaN(num)) return lang === 'ru' ? 'ноль' : lang === 'oz' ? 'нол' : 'nol'
  const n = Math.floor(num)
  if (lang === 'ru') return _ntwRu(n)
  if (lang === 'oz') return _ntwOz(n)
  return _ntwUz(n)
}

function _ntwUz(num: number): string {
  const ones  = ["","bir","ikki","uch","to'rt","besh","olti","yetti","sakkiz","to'qqiz"]
  const tens  = ["","o'n","yigirma","o'ttiz","qirq","ellik","oltmish","yetmish","sakson","to'qson"]
  const sc    = ["","ming","million","milliard"]
  function ch(n: number): string {
    if (!n) return ""
    if (n < 10) return ones[n]
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " "+ones[n%10] : "")
    return ones[Math.floor(n/100)] + " yuz" + (n%100 ? " "+ch(n%100) : "")
  }
  const parts: string[] = []
  let rem = num, i = 0
  while (rem > 0) { const c = rem%1000; if (c) parts.unshift(ch(c)+(sc[i]?" "+sc[i]:"")); rem=Math.floor(rem/1000); i++ }
  return parts.join(" ") || "nol"
}

function _ntwOz(num: number): string {
  const ones = ["","бир","икки","уч","тўрт","беш","олти","етти","саккиз","тўққиз"]
  const tens = ["","ўн","йигирма","ўттиз","қирқ","эллик","олтмиш","етмиш","саксон","тўқсон"]
  const sc   = ["","минг","миллион","миллиард"]
  function ch(n: number): string {
    if (!n) return ""
    if (n < 10) return ones[n]
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? " "+ones[n%10] : "")
    return ones[Math.floor(n/100)] + " юз" + (n%100 ? " "+ch(n%100) : "")
  }
  const parts: string[] = []
  let rem = num, i = 0
  while (rem > 0) { const c = rem%1000; if (c) parts.unshift(ch(c)+(sc[i]?" "+sc[i]:"")); rem=Math.floor(rem/1000); i++ }
  return parts.join(" ") || "нол"
}

function _ntwRu(num: number): string {
  const onesM   = ["","один","два","три","четыре","пять","шесть","семь","восемь","девять"]
  const onesF   = ["","одна","две","три","четыре","пять","шесть","семь","восемь","девять"]
  const teens   = ["десять","одиннадцать","двенадцать","тринадцать","четырнадцать",
                   "пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"]
  const tensArr = ["","","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"]
  const hunds   = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"]
  const sc      = [["","",""],["тысяча","тысячи","тысяч"],["миллион","миллиона","миллионов"],["миллиард","миллиарда","миллиардов"]]

  function form(n: number, f: string[]): string {
    const n10=n%10, n100=n%100
    if (n100>=11&&n100<=19) return f[2]
    if (n10===1) return f[0]
    if (n10>=2&&n10<=4) return f[1]
    return f[2]
  }
  function ch(n: number, fem: boolean): string {
    if (!n) return ""
    const parts: string[] = []
    if (n>=100) { parts.push(hunds[Math.floor(n/100)]); n=n%100 }
    if (n>=10&&n<20) { parts.push(teens[n-10]); return parts.filter(Boolean).join(" ") }
    if (n>=20) { parts.push(tensArr[Math.floor(n/10)]); n=n%10 }
    if (n>0) parts.push(fem ? onesF[n] : onesM[n])
    return parts.filter(Boolean).join(" ")
  }
  const parts: string[] = []
  let rem = num, i = 0
  while (rem > 0) {
    const c = rem%1000
    if (c) {
      const isFem = i===1
      const chStr = ch(c, isFem)
      const scStr = i>0 ? form(c, sc[i]) : ""
      parts.unshift([chStr, scStr].filter(Boolean).join(" "))
    }
    rem=Math.floor(rem/1000); i++
  }
  return parts.join(" ") || "ноль"
}

// ─── Tuzilmali shablonlar ────────────────────────────────────────────────────
//
// Placeholder mapping (fill() funksiyasi):
//   [BUYURTMACHI]       → org_name  (foydalanuvchi tashkiloti)
//   [BUYURTMACHI_INN]   → org_inn
//   [BUYURTMACHI_RAHBAR]→ org_director
//   [IJROCHI]           → cp_name   (kontragent)
//   [IJROCHI_INN]       → cp_inn
//   [IJROCHI_RAHBAR]    → cp_director
//   [SUMMA]             → amount (raqam)
//   [SUMMA_MATN]        → amount_text (so'z)
//   [SHAHAR]            → city
//
// Shartnoma tanasida tomonlar ularning ROLI bo'yicha ataladi,
// [BUYURTMACHI]/[IJROCHI] faqat boshlanish bandida bir marta ishlatiladi.
// ─────────────────────────────────────────────────────────────────────────────

const STRUCTURES: Record<string, (d: Partial<TemplateData>) => ContractStructure> = {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. OLDI-SOTDI SHARTNOMASI
  //    org=[BUYURTMACHI]=Sotuvchi | cp=[IJROCHI]=Xaridor
  // ══════════════════════════════════════════════════════════════════════════
  oldi_sotdi: (d) => ({ bolimlar: [

    { sarlavha: "SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "Sotuvchi") va [IJROCHI] (keyingi o'rinlarda "Xaridor") o'rtasida ushbu Tovar yetkazib berish shartnomasi (keyingi o'rinlarda "Shartnoma") tuzildi.` },
      { matn: `Sotuvchi ushbu Shartnoma amal qilish davrida Xaridorga tovarlarni (keyingi o'rinlarda "Tovar") mulk sifatida topshirish, Xaridor esa Tovarni qabul qilib, ushbu Shartnoma va unga ilovalar bilan belgilangan tartibda, muddatlarda va shartlarda to'lash majburiyatini oladi.` },
      { matn: `Tovarning nomenklaturasi: [TOVAR_NOMI]. Tovarning narxi ushbu Shartnomaga 1-ilova sifatida biriktirilgan Narxni kelishish protokolida belgilanadi. Tovar miqdori Xaridor tomonidan beriladigan So'rovnoma asosida aniqlanadi. Har bir tovar partiyasiga alohida tovar-xat rasmiylashtiriladi va Shartnomaning ajralmas qismi hisoblanadi.` },
      { matn: `Ushbu Shartnoma bo'yicha tovarlarning taxminiy umumiy qiymati [SUMMA] ([SUMMA_MATN]) so'mni tashkil etadi, QQS hisobga olingan holda. Shartnomaning yakuniy summasi barcha tovar-xatlar summasini qo'shish yo'li bilan aniqlanadi.` },
    ]},

    { sarlavha: "SO'ROVNOMA VA YETKAZIB BERISH SHARTLARI", bandlar: [
      { matn: "Yetkazib berish Sotuvchi bilan kelishilgan Xaridor So'rovnomasi asosida amalga oshiriladi. So'rovnomada Tovarning nomenklaturasi va miqdori ko'rsatilishi shart. So'rovnomada Tovarga bo'lgan maxsus talablar, yetkazib berish kerak bo'lgan sana va vaqt ham ko'rsatilishi mumkin." },
      { matn: "So'rovnoma og'zaki yoki yozma shaklda (elektron pochta yoki faks orqali) yuborilishi mumkin. Agar Sotuvchi belgilangan muddatda So'rovnomani bajarib bo'lmasligini Xaridorga ma'lum qilmasa, So'rovnoma Tomonlar tomonidan qabul qilingan va kelishilgan hisoblanadi." },
      { matn: "Agar Sotuvchi So'rovnomani Xaridor shartlarida qabul qila olmasa, u So'rovnomani olgan kundan boshlab 3 (uch) ish kuni ichida Xaridorga xabar berishi shart. Bunda Xaridor Sotuvchi takliflari hisobga olingan holda So'rovnomani qayta yuborishi mumkin. Qayta yuborilgan So'rovnoma yuborilgan zahoti Sotuvchi tomonidan qabul qilingan hisoblanadi." },
      { matn: `Tovar Sotuvchi tomonidan So'rovnoma qabul qilingan va oldindan to'lov summasi Sotuvchining hisob raqamiga kelib tushgan kundan boshlab eng ko'pi bilan [YETKAZISH_MUDDAT] ichida beriladi.` },
      { matn: "Yetkazib berish sharti — Sotuvchining omborxonasidan Xaridor kuchi va vositalari bilan olib ketish (EXW). Tovarni miqdor va sifat jihatidan qabul qilib-topshirish Sotuvchining omborxonasida amalga oshiriladi." },
      { matn: "Tomonlar kelishib olgan jo'natish sanasi va vaqtidan boshlab 5 (besh) ish kuni ichida Xaridor kelmasa, Sotuvchi omborxonada Tovar mavjud emasligi uchun javobgar emas." },
      { matn: "Tovarni qabul qilish Xaridorning vakolatli vakili (berilgan Ishonchnomaga asosan) tomonidan Sotuvchi taqdim etgan tovar-xatni imzolash yo'li bilan amalga oshiriladi." },
      { matn: "Tovar uchinchi shaxsning omborxonasidan jo'natilgan hollarda, tovar-xatni uchinchi shaxs (Saqlash tashkiloti) rasmiylashtiradi." },
      { matn: "Mulk huquqi va Tovarning tasodifiy nobud bo'lish xavfi Tovar topshirilgan va tovar-xat imzolangan zahoti Xaridorga o'tadi." },
      { matn: "Tovar qabul qilib olinganidan keyin yashirin nuqsonlar aniqlansa, Xaridor 24 (yigirma to'rt) soat ichida Sotuvchiga nuqsonlar aktini birga tuzish uchun yozma chaqiruv yuborishi shart." },
      { matn: "Sotuvchi chaqiruv olinganidan 3 (uch) ish kuni ichida akt tuzishda qatnashish uchun vakolatli vakil yuboradi. Tomonlar Tovar nuqsonlarining sabablarini aniqlash uchun mutaxassislarni jalb qilish huquqiga ega." },
      { matn: "Sotuvchi qabul qilish vaqtida yashirinligi sababli Xaridor aniqlay olmagan nuqsonlari bo'lgan Tovarni, Tomonlar vakillari tomonidan tegishli tarzda rasmiylashtirilgan akt mavjud bo'lganda va Sotuvchi sifat pretenziyasini tan olganda, 10 (o'n) ish kuni ichida almashtirish majburiyatini oladi." },
      { matn: "Sotuvchi tomonidan yetkaziladigan Tovarning sifati O'zbekiston Respublikasi standartlariga (O'z DSt) va GOST talablariga javob berishi kerak. Tovarni sertifikatlash majburiyati faqat O'zbekiston Respublikasi Vazirlar Mahkamasi tomonidan tasdiqlangan majburiy sertifikatlashtirish ro'yxatiga kiruvchi mahsulotlarga nisbatan yuzaga keladi." },
    ]},

    { sarlavha: "NARX VA TO'LOV TARTIBI", bandlar: [
      { matn: "Tovar Sotuvchi bilan kelishilgan Narxni kelishish protokolida (1-ilova) ko'rsatilgan narxlarda, jo'natish paytida amalda bo'lgan narxlar asosida yetkaziladi." },
      { matn: "To'lov Xaridor tomonidan quyidagi tartibda amalga oshiriladi: Xaridor So'rovnoma kelishilgan kundan boshlab 3 (uch) ish kuni ichida So'rovnomadagi Tovar umumiy qiymatining 20 (yigirma) foizini oldindan to'lov sifatida Sotuvchining hisob raqamiga o'tkazadi; qolgan 80 (sakson) foizini esa Tovar olingan kundan boshlab 30 (o'ttiz) kalendar kuni ichida to'liq to'laydi." },
      { matn: "Yetkazilishi kerak bo'lgan Tovarning yakuniy narxi tovar-xatda ko'rsatiladi." },
      { matn: "Sotuvchi Tovar jo'natilganidan keyin 5 (besh) ish kuni ichida elektron hisob-faktura rasmiylashtiradi." },
      { matn: "Tovar narxi xarajatlar o'zgarishi munosabati bilan (shu jumladan energiya tashuvchilar va materiallar narxining o'zgarishi, soliq yukini oshiruvchi normativ-huquqiy hujjatlarning kuchga kirishi va boshqalar) Sotuvchi tomonidan o'zgartirilishi mumkin. Sotuvchi yangi narxlar kuchga kirguniga qadar 7 (yetti) ish kuni oldin Xaridorni yozma ravishda xabardor qilishi shart. Narx o'zgarishlari yangi tahrirdagi Narxni kelishish protokoli bilan rasmiylashtiriladi." },
      { matn: "Tovar narxi 20 (yigirma) foizdan ko'proq oshirilganda Xaridor Shartnoma muddati tugashiga kamida 7 (yetti) ish kuni qolganida Sotuvchini xabardor qilish orqali Shartnomadan suddan tashqari tartibda bir tomonlama voz kechish huquqiga ega." },
    ]},

    { sarlavha: "TOMONLARNING HUQUQ VA MAJBURIYATLARI", bandlar: [
      { matn: "Sotuvchi majburiyatlari: a) Xaridorga Tovarni Shartnomada nazarda tutilgan muddat va shartlarda yetkazib berish; b) Kam yetkazib berilgan Tovar miqdorini 30 (o'ttiz) ish kuni ichida to'ldirish; v) Shartnoma bo'yicha barcha masalalarni hal qiladigan mas'ul shaxsni tayinlash; g) Shartnomada belgilangan muddatda elektron hisob-faktura rasmiylashtirish." },
      { matn: "Sotuvchining huquqlari: a) So'rovnomaga o'zgartirish kiritish (texnik xususiyatlarni aniqlashtirish, yetkazib berish hajmi, nomenklaturasi, miqdori va muddatlarini kamaytirish yoki bekor qilish); b) Xaridor Shartnoma shartlarini buzgan taqdirda Tovar va/yoki pul mablag'larini ushlab turish; v) To'lov muddatlari buzilganda keyingi Tovar partiyalarini yetkazib bermaslik yoki Shartnomani bekor qilish." },
      { matn: "Xaridor majburiyatlari: a) To'lov amalga oshirilgan kundan boshlab 3 (uch) ish kuni ichida Sotuvchini pul o'tkazilganligi haqida xabardor qilish; b) Tovarni Shartnoma shartlariga muvofiq qabul qilib olish; v) Tovar sifatining belgilangan standartlarga nomuvofiqligini darhol yozma ravishda Sotuvchiga bildirish; g) Shartnomada belgilangan tartibda Tovarni qabul qilib to'lash; d) Shartnoma bo'yicha faoliyatdan kelib chiqadigan barcha soliqlar, yig'imlar va bank komissiyalarini to'lash." },
      { matn: "Xaridorning huquqlari: a) Tovar sifati namunalarga yoki Shartnoma shartlariga mos kelmasa, tovarni qabul qilishdan voz kechish va to'langan summalarni qaytarish yoki Tovarni almashtirish talabini qo'yish; b) Yetkazib berish muddati buzilganda Shartnomadan voz kechish va to'langan avans summasini qaytarishni talab qilish." },
    ]},

    { sarlavha: "TOMONLARNING JAVOBGARLIGI", bandlar: [
      { matn: "Tomonlarning Shartnomada nazarda tutilgan majburiyatlarni bajarmasligi va/yoki lozim darajada bajarmasligi uchun javobgarligi O'zbekiston Respublikasining amaldagi qonunchiligi bilan belgilanadi." },
      { matn: "Yetkazib berish muddatlari buzilganda, Sotuvchi Xaridorga yetkazib berilmagan Tovar qiymatidan har bir kechikkan kun uchun 0,5 (nol butun besh) foiz miqdorida penya to'laydi, lekin penya bajarilmagan majburiyat hajmining 50 (ellik) foizidan oshmasligi kerak." },
      { matn: "Xaridorning Tovar sifati bo'yicha pretenziyalari Shartnomaning 2.9-bandiga muvofiq mulk huquqi Xaridorga o'tguniga qadar qabul qilinadi." },
      { matn: "To'lov muddatlari buzilganda, Xaridor Sotuvchiga muddati o'tgan to'lov summasidan har bir kechikkan kun uchun 0,5 (nol butun besh) foiz miqdorida penya to'laydi, lekin penya bajarilmagan majburiyat hajmining 50 (ellik) foizidan oshmasligi kerak." },
      { matn: "Tomonlardan biri Shartnomani bajarmaganligi sababli boshqa tomon ko'rgan haqiqiy zararni, shu jumladan boy berilgan foyda va boshqa yo'qotishlarni qoplashi shart; bu majburiyat penyani to'lashdan qat'i nazar amal qiladi." },
    ]},

    { sarlavha: "FORS-MAJOR", bandlar: [
      { matn: "Tomonlar ushbu Shartnoma bo'yicha majburiyatlarni qisman yoki to'liq bajarmaganlik uchun, agar bunday bajarmaslik majburiyatlarni bajarishni to'g'ridan-to'g'ri imkonsiz qilib qo'ygan fors-major holatlari — stixiyali ofatlar (yong'in, suv toshqini, zilzila), harbiy harakatlar, epidemiyalar, transportdagi avariyalar, Tomonlar uchun majburiy yuridik kuchga ega bo'lgan hokimiyat organlarining aktlari oqibatida yuzaga kelgan bo'lsa, javobgarlikdan ozod etiladi." },
      { matn: "Fors-major holati yuzaga kelganda, ta'sirlangan tomon boshqa tomonga 5 (besh) kalendar kuni ichida yozma ravishda xabar berishi shart. O'z vaqtida xabar bermaslik fors-major holatlariga havola qilish huquqini yo'qotishga olib keladi. Fors-major holati vakolatli organ (Savdo-sanoat palatasi yoki boshqa vakolatli organ) tomonidan tasdiqlanishi kerak." },
      { matn: "Fors-major holatlari 3 (uch) oydan ortiq davom etsa, har bir tomon Shartnomani keyingi bajarishdan voz kechish huquqiga ega; bu holda Tomonlarning hech biri boshqa tomondan mumkin bo'lgan zararlarni talab qilish huquqiga ega bo'lmaydi." },
    ]},

    { sarlavha: "NIZOLARNI HAL ETISH", bandlar: [
      { matn: "Shartnomadan kelib chiqadigan va muzokaralar yo'li bilan 15 (o'n besh) kun ichida ixtiyoriy tartibda hal etilmagan nizolar O'zbekiston Respublikasi [SHAHAR] shahri iqtisodiy sudiga ko'rib chiqish uchun topshiriladi." },
      { matn: "Shartnoma bo'yicha barcha pretenziyalar yozma shaklda taqdim etilishi va pretenziya olingan kundan boshlab 15 (o'n besh) ish kuni ichida Tomonlar tomonidan ko'rib chiqilishi kerak. Pretenziyaga javob berilmagan taqdirda u rad etilgan hisoblanadi." },
      { matn: "Tovar yetkazib berilgandan so'ng Sotuvchi hisobida avans qoldiq qolsa: agar qoldiq 100 000 (yuz ming) so'mdan kam bo'lsa va Shartnoma majburiyatlari to'liq bajarilganidan keyin 60 (oltmish) kalendar kuni ichida Xaridor tomonidan qaytarish to'g'risida yozma talab kelmasa, qoldiq Sotuvchi tomonidan hadya sifatida qabul qilinadi; agar qoldiq 100 000 (yuz ming) so'mdan ko'p bo'lsa, Sotuvchi uni yozma talabga qadar, lekin 3 (uch) yildan ko'p bo'lmagan muddatda saqlaydi, muddat o'tgandan so'ng qoldiq Sotuvchining daromadi hisoblanadi." },
    ]},

    { sarlavha: "SHARTNOMANING AMAL QILISH MUDDATI VA BEKOR QILISH TARTIBI", bandlar: [
      { matn: `Shartnoma Tomonlar tomonidan imzolangan kundan kuchga kiradi va [YIL_OXIRI] gacha amal qiladi.` },
      { matn: "Shartnoma muddati tugagandan so'ng Tomonlardan biri uni tugatish haqida kamida 30 (o'ttiz) kalendar kuni oldin yozma xabar bermasa, Shartnoma keyingi bir yilga avtomatik uzaytirilgan hisoblanadi." },
      { matn: "Tomonlar bir-birlarini Shartnoma bo'yicha majburiyatlarini bajarishiga sezilarli ta'sir ko'rsatishi mumkin bo'lgan barcha o'zgarishlar (yuridik va faktik manzillarning, bank rekvizitlarining o'zgarishi, qayta tashkil etilishi, tugatilishi va boshqa shu kabi o'zgarishlar) haqida darhol — 3 (uch) ish kuni ichida yozma ravishda xabardor qilish majburiyatini oladilar." },
      { matn: "Shartnomaga o'zgartirishlar va qo'shimchalar faqat yozma shaklda — qo'shimcha kelishuvlar bilan rasmiylashtiriladi va ikki tomon imzolagandan keyingina kuchga kiradi." },
      { matn: "Shartnoma o'zbek tilida 2 (ikki) nusxada tuzilgan bo'lib, barcha nusxalar teng yuridik kuchga ega. Shartnoma imzolanganidan so'ng unga oid barcha oldindan tuzilgan shartnomalar, yozishmalar, dastlabki kelishuvlar va niyat protokollari yuridik kuchini yo'qotadi." },
      { matn: "Shartnoma Tomonlar kelishuviga binoan yoki Tomonlardan biri tugatish talabini bildirsa, sud qarori bilan bekor qilinishi mumkin." },
      { matn: "Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasining amaldagi qonunchiligi, jumladan O'zbekiston Respublikasi Fuqarolik kodeksining 386–398-moddalari bilan tartibga solinadi." },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 2. XIZMAT KO'RSATISH SHARTNOMASI
  //    org=[BUYURTMACHI]=Buyurtmachi | cp=[IJROCHI]=Ijrochi
  // ══════════════════════════════════════════════════════════════════════════
  xizmat: (d) => ({ bolimlar: [

    { sarlavha: "SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "Buyurtmachi") va [IJROCHI] (keyingi o'rinlarda "Ijrochi") o'rtasida ushbu Xizmat ko'rsatish shartnomasi (keyingi o'rinlarda "Shartnoma") tuzildi.` },
      { matn: "Ijrochi Buyurtmachiga Shartnomada belgilangan hajm va sifatda xizmatlarni ko'rsatish majburiyatini oladi, Buyurtmachi esa ko'rsatilgan xizmatlarni qabul qilib, ushbu Shartnomada nazarda tutilgan tartib va muddatlarda to'lash majburiyatini oladi." },
      { matn: "Ko'rsatiladigan xizmatlarning to'liq tavsifi, hajmi va texnik talablari ushbu Shartnomaga 1-ilova sifatida biriktirilgan Texnik topshiriqda belgilanadi. Texnik topshiriq Shartnomaning ajralmas qismi hisoblanadi." },
      { matn: `Xizmatlarning umumiy narxi [SUMMA] ([SUMMA_MATN]) so'mni tashkil etadi, QQS hisobga olingan holda.` },
    ]},

    { sarlavha: "XIZMAT KO'RSATISH MUDDATI", bandlar: [
      { matn: "Ijrochi xizmatlarni ko'rsatishni Shartnoma imzolanganidan keyin 5 (besh) ish kuni ichida boshlaydi va Texnik topshiriqda belgilangan muddatda yakunlaydi." },
      { matn: "Zarur bo'lgan hollarda, Tomonlarning yozma kelishuviga binoan xizmat ko'rsatish muddati uzaytirilishi mumkin. Muddatni uzaytirish to'g'risidagi talab kechikish boshlanishidan kamida 5 (besh) ish kuni oldin yozma shaklda taqdim etilishi kerak." },
      { matn: "Ijrochi xizmatlarni belgilangan muddatdan oldin yakunlashga haqli, lekin Buyurtmachi buni oldindan — kamida 3 (uch) ish kuni oldin yozma shaklda xabardor qilinishi shart." },
    ]},

    { sarlavha: "NARX VA TO'LOV TARTIBI", bandlar: [
      { matn: "Xizmatlar uchun to'lov quyidagi tartibda amalga oshiriladi: Shartnoma imzolanganidan keyin 5 (besh) ish kuni ichida Buyurtmachi xizmatlar umumiy qiymatining 30 (o'ttiz) foizini oldindan to'lov sifatida Ijrochi hisob raqamiga o'tkazadi; qolgan 70 (yetmish) foizini esa qabul-topshiriq dalolatnomasi imzolanganidan keyin 10 (o'n) ish kuni ichida to'liq to'laydi." },
      { matn: "Agar xizmatlar bosqichma-bosqich ko'rsatilsa, to'lov ham har bir bosqich qabul-topshiriq dalolatnomasi imzolanganidan keyin 10 (o'n) ish kuni ichida amalga oshiriladi. Har bir bosqich narxi Texnik topshiriqda belgilanadi." },
      { matn: "Ijrochi Buyurtmachining yozma roziligi bo'lmagan holda narxni bir tomonlama o'zgartirish huquqiga ega emas. Narxni o'zgartirish zarurati yuzaga kelganda Ijrochi 15 (o'n besh) kun oldin yozma shaklda Buyurtmachini xabardor qilishi shart." },
      { matn: "Ijrochi qabul-topshiriq dalolatnomasi imzolanganidan keyin 5 (besh) ish kuni ichida elektron hisob-faktura rasmiylashtiradi." },
    ]},

    { sarlavha: "XIZMATLARNI QABUL QILISH", bandlar: [
      { matn: "Ijrochi xizmatlarni ko'rsatib bo'lgach, Buyurtmachiga qabul-topshiriq dalolatnomasini taqdim etadi. Dalolatnomasida ko'rsatilgan xizmatlarning ro'yxati, hajmi, sifati va narxi ko'rsatiladi." },
      { matn: "Buyurtmachi dalolatnomani olgandan boshlab 5 (besh) ish kuni ichida uni imzolaydi yoki asosli rad etishni yozma ravishda bildiradi. Belgilangan muddatda imzolash yoki rad etish bildirmaslik ko'rsatilgan xizmatlarning lozim darajada qabul qilinganligini bildiradi." },
      { matn: "Xizmatlar sifatiga nisbatan pretenziyalar asosli bo'lsa, Ijrochi pretenziya olinganidan keyin 10 (o'n) ish kuni ichida nuqsonlarni bepul bartaraf etishi shart. Nuqsonlar bartaraf etilganidan keyin Tomonlar yangi qabul-topshiriq dalolatnomasini imzolaydilar." },
    ]},

    { sarlavha: "TOMONLARNING HUQUQ VA MAJBURIYATLARI", bandlar: [
      { matn: "Ijrochi majburiyatlari: a) Xizmatlarni Shartnomada belgilangan sifat, hajm va muddatda ko'rsatish; b) Buyurtmachining xizmat ko'rsatish bilan bog'liq ko'rsatmalarini bajarish; v) Xizmat ko'rsatish uchun kerakli malakali mutaxassislarni jalb qilish; g) Buyurtmachining tijorat sirlarini va maxfiy ma'lumotlarini saqlash; d) Buyurtmachini ishning borishi haqida so'rov bo'yicha yoki har haftada xabardor qilib turish." },
      { matn: "Buyurtmachi majburiyatlari: a) Xizmat ko'rsatish uchun zarur sharoit va ma'lumotlarni yaratib berish; b) To'lovni belgilangan muddatda amalga oshirish; v) Xizmatlarni belgilangan muddatda qabul qilib dalolatnomani imzolash yoki asosli rad etishni bildirish; g) Ijrochining vakillariga ob'ektga yoki kerakli ma'lumotlarga ruxsat berish; d) Xizmatlar ko'rsatilishiga to'sqinlik qilmasligi." },
      { matn: "Buyurtmachining huquqlari: a) Istalgan vaqtda xizmatlar ko'rsatilishi borishi haqida hisobot talab qilish; b) Xizmatlar sifatiga nisbatan pretenziya qo'yish va nuqsonlarni bartaraf etishni talab qilish; v) Ijrochi Shartnomani to'liq bajarmaganda to'langan avans summasini qaytarish va zararlarni qoplashni talab qilish." },
    ]},

    { sarlavha: "INTELLEKTUAL MULK", bandlar: [
      { matn: "Ushbu Shartnoma doirasida Ijrochi tomonidan yaratilgan barcha intellektual mulk mahsulotlari (loyihalar, dasturlar, tahlillar, hujjatlar va boshqalar) Buyurtmachiga tegishli bo'lib, to'liq to'lov amalga oshirilgandan so'ng Buyurtmachiga topshiriladi." },
      { matn: "Ijrochi Buyurtmachi ruxsatisiz Shartnoma doirasida yaratilgan intellektual mulk mahsulotlarini uchinchi shaxslarga o'tkazish, foydalanish huquqini berish yoki nashr etish huquqiga ega emas." },
    ]},

    { sarlavha: "KONFIDENSIALLIK", bandlar: [
      { matn: "Tomonlar ushbu Shartnoma doirasida olgan barcha ma'lumotlarni (texnik, tijorat, moliyaviy va boshqa ma'lumotlar) maxfiy saqlab, uchinchi shaxslarga oshkor etmaslik majburiyatini oladilar, bundan qonunchilik talablariga muvofiq oshkor etish holatlari mustasno." },
      { matn: "Konfidensiallik majburiyati Shartnoma tugatilganidan yoki bekor qilinganidan keyin ham 3 (uch) yil davomida kuchda qoladi. Majburiyat buzilganda aybdor tomon ko'rilgan zarar va yo'qotilgan foyda uchun to'liq javobgar bo'ladi." },
    ]},

    { sarlavha: "TOMONLARNING JAVOBGARLIGI", bandlar: [
      { matn: "Tomonlarning Shartnomada nazarda tutilgan majburiyatlarni bajarmasligi va/yoki lozim darajada bajarmasligi uchun javobgarligi O'zbekiston Respublikasining amaldagi qonunchiligi bilan belgilanadi." },
      { matn: "Xizmat ko'rsatishni kechiktirganlik uchun Ijrochi Buyurtmachiga har bir kechikkan kun uchun xizmat umumiy narxining 0,5 (nol butun besh) foizini penya sifatida to'laydi, lekin penyaning umumiy miqdori Shartnoma summasining 50 (ellik) foizidan oshmasligi kerak." },
      { matn: "To'lovni kechiktirganlik uchun Buyurtmachi Ijrochiga muddati o'tgan to'lov summasining har bir kechikkan kun uchun 0,5 (nol butun besh) foizini penya sifatida to'laydi, lekin penyaning umumiy miqdori Shartnoma summasining 50 (ellik) foizidan oshmasligi kerak." },
      { matn: "Shartnomani bajarmaslik yoki lozim darajada bajarmaslik natijasida ko'rilgan haqiqiy zarar va boy berilgan foyda penyani to'lashdan qat'i nazar qoplanishi shart." },
    ]},

    { sarlavha: "FORS-MAJOR", bandlar: [
      { matn: "Tomonlar o'z nazoratlaridan tashqarida bo'lgan va oldindan ko'ra bilish imkoni bo'lmagan fors-major holatlari — stixiyali ofatlar, harbiy harakatlar, epidemiyalar, hokimiyat organlarining majburiy aktlari oqibatida majburiyatlarini bajarish imkonsiz bo'lsa, javobgarlikdan ozod etiladi." },
      { matn: "Ta'sirlangan tomon boshqa tomonga fors-major holati haqida 5 (besh) kalendar kuni ichida yozma xabar berishi shart; o'z vaqtida xabar bermaslik fors-major holatlariga havola qilish huquqini yo'qotishga olib keladi. Fors-major holati vakolatli organ tomonidan tasdiqlanishi kerak. Fors-major holatlari 2 (ikki) oydan ortiq davom etsa, Tomonlardan har biri Shartnomani bir tomonlama bekor qilish huquqiga ega." },
    ]},

    { sarlavha: "NIZOLARNI HAL ETISH", bandlar: [
      { matn: "Shartnomadan kelib chiqadigan va muzokaralar yo'li bilan 15 (o'n besh) ish kuni ichida hal etilmagan nizolar O'zbekiston Respublikasi [SHAHAR] shahri iqtisodiy sudiga topshiriladi. Shartnoma bo'yicha pretenziyalar yozma shaklda taqdim etilishi va 15 (o'n besh) ish kuni ichida ko'rib chiqilishi kerak." },
    ]},

    { sarlavha: "SHARTNOMANING AMAL QILISH MUDDATI VA BEKOR QILISH TARTIBI", bandlar: [
      { matn: "Shartnoma Tomonlar tomonidan imzolangan kundan kuchga kiradi va Tomonlar majburiyatlarini to'liq bajargunga qadar amal qiladi." },
      { matn: "Shartnomani muddatidan oldin bekor qilish faqat Tomonlarning yozma kelishuviga binoan yoki sud qarori bilan amalga oshiriladi. Buyurtmachi Shartnomani muddatidan oldin bir tomonlama bekor qilishni xohlasa, Ijrochiga kamida 30 (o'ttiz) kun oldin yozma xabar berishi va amalda ko'rsatilgan xizmatlar uchun to'lovni amalga oshirishi shart." },
      { matn: "Shartnomaga o'zgartirishlar va qo'shimchalar faqat yozma shaklda qo'shimcha kelishuvlar bilan rasmiylashtiriladi. Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasi Fuqarolik kodeksining 703–730-moddalari bilan tartibga solinadi." },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 3. IJARA SHARTNOMASI
  //    org=[BUYURTMACHI]=Ijaraberuvchi | cp=[IJROCHI]=Ijarachi
  // ══════════════════════════════════════════════════════════════════════════
  ijara: (d) => ({ bolimlar: [

    { sarlavha: "SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "Ijaraberuvchi") va [IJROCHI] (keyingi o'rinlarda "Ijarachi") o'rtasida ushbu Ijara shartnomasi (keyingi o'rinlarda "Shartnoma") tuzildi.` },
      { matn: `Ijaraberuvchi Ijarachiga mulkni (keyingi o'rinlarda "Ijara ob'ekti") vaqtincha egallab foydalanish uchun beradi, Ijarachi esa ijara haqini o'z vaqtida to'lash va ijara ob'ektini Shartnomada belgilangan shartlarda saqlash majburiyatini oladi.` },
      { matn: "Ijara ob'ektining manzili, maydoni va texnik xususiyatlari ushbu Shartnomaga 1-ilova sifatida biriktirilgan Topshirish-qabul qilish aktida ko'rsatiladi. Ijara ob'ektining holati akt imzolanish vaqtiga ko'ra qayd etiladi." },
      { matn: "Ijaraberuvchi ijara ob'ekti ustidan mulk huquqiga (yoki uni ijaraga berish huquqini beradigan boshqa asos) egaligini tasdiqlaydi. Ijaraberuvchi ijara ob'ektini uchinchi shaxslarning huquqlari va da'volaridan xoli tarzda topshirish majburiyatini oladi." },
    ]},

    { sarlavha: "IJARA MUDDATI", bandlar: [
      { matn: "Ijara muddati ___ — Tomonlar qo'l qo'ygan Topshirish-qabul qilish akti sanasidan boshlanadi. Ijara oxiri ushbu Shartnomada yoki qo'shimcha kelishuvda ko'rsatilgan sana hisoblanadi." },
      { matn: "Ijara muddati tugagandan so'ng Tomonlar yozma kelishuvga asosan Shartnomani uzaytirishi mumkin. Agar muddati tugashidan kamida 30 (o'ttiz) kun oldin hech biri tugatish haqida yozma xabar bermasa, Shartnoma xuddi shunday muddatga uzaytirilgan hisoblanadi." },
      { matn: "Ijara muddati 1 (bir) yildan ortiq bo'lsa, Shartnoma O'zbekiston Respublikasining amaldagi qonunchiligiga muvofiq davlat ro'yxatidan o'tkazilishi shart; o'tkazilmagan taqdirda Shartnoma kuchga kirmagan hisoblanadi." },
    ]},

    { sarlavha: "IJARA HAQI VA TO'LOV TARTIBI", bandlar: [
      { matn: `Oylik ijara haqi [SUMMA] ([SUMMA_MATN]) so'mni tashkil etadi. Ijara haqi QQS va boshqa majburiy to'lovlarni hisobga olmagan holda belgilangan.` },
      { matn: "Ijara haqi har oyning 5 (beshinchi) kuniga qadar bank o'tkazma orqali Ijaraberuvchining hisob raqamiga to'lanadi. To'lov sanasi Ijaraberuvchining bank hisobvarag'iga pul kelib tushgan sana hisoblanadi." },
      { matn: "Ijarachi Shartnoma imzolanganida birinchi oy va oxirgi oy ijara haqiga teng miqdorda — 2 (ikki) oylik garov depositi to'laydi. Garov ijara ob'ektiga yetkazilgan zararni qoplash va kechiktirilgan to'lovlarni qoplash uchun ishlatiladi. Shartnoma to'liq bajarilganidan keyin 10 (o'n) ish kuni ichida garov qaytariladi." },
      { matn: "Kommunal xizmatlar (elektr energiyasi, gaz, suv, issiqlik va boshqalar) uchun to'lovlar Ijarachi tomonidan alohida va bevosita xizmat ko'rsatuvchi tashkilotlarga to'lanadi. Ijarachi kommunal xizmatlarni to'lash bilan bog'liq barcha hujjatlarni mustaqil ravishda rasmiylashtiradi." },
      { matn: "Ijaraberuvchi ijara haqini oshirishdan kamida 30 (o'ttiz) kun oldin Ijarachini yozma ravishda xabardor qilishi shart. Ijara haqini bir yil ichida bir marta 15 (o'n besh) foizdan ko'p oshirish mumkin emas. Taklif etilgan narx oshirilishiga rozi bo'lmagan Ijarachi 15 (o'n besh) ish kuni ichida Shartnomani bekor qilish huquqiga ega." },
    ]},

    { sarlavha: "TOMONLARNING HUQUQ VA MAJBURIYATLARI", bandlar: [
      { matn: "Ijaraberuvchi majburiyatlari: a) Ijara ob'ektini Topshirish-qabul qilish akti imzolanish paytida kelishilgan holat va jihozlash bilan topshirish; b) Ijara muddati davomida Ijarachining ijara ob'ektidan to'siqsiz foydalanishini ta'minlash; v) Ijara ob'ektining kapitali ta'mirlash ishlarini o'z hisobidan amalga oshirish; g) Ijara ob'ekti haqidagi hujjatlarni (texnik pasport, mulk guvohnomasi va h.k.) Ijarachiga taqdim etish." },
      { matn: "Ijarachi majburiyatlari: a) Ijara haqini Shartnomada belgilangan muddatda to'lash; b) Ijara ob'ektini faqat maqsadli foydalanish (shartnomada belgilangan maqsad uchun); v) Ijara ob'ektini ehtiyotkorlik bilan saqlash va jozibadorligini saqlab turish; g) Joriy ta'mirni o'z hisobidan amalga oshirish; d) Ijaraberuvchining yozma ruxsatisiz ijara ob'ektida qayta rejalashtirishlar va qayta qurishlar amalga oshirmaslik; e) Ijara ob'ektini uchinchi shaxslarga quyi-ijara asosida bermaslik; j) Ijara muddati tugagach ijara ob'ektini Topshirish-qabul qilish aktida ko'rsatilgan holda qaytarish." },
      { matn: "Ijarachining huquqlari: a) Ijara muddati davomida ijara ob'ektidan to'siqsiz foydalanish; b) Ijara ob'ektida ishini yaxshilash maqsadida Ijaraberuvchining yozma ruxsati bilan ta'mirlash va o'zgartirishlar amalga oshirish; v) Shartnoma muddati uzaytirilanda boshqa shartlar teng bo'lganda ustunlik huquqi." },
    ]},

    { sarlavha: "IJARA OB'EKTINI QAYTARISH", bandlar: [
      { matn: "Ijara muddati tugagach yoki Shartnoma muddatidan oldin bekor qilinganda, Ijarachi ijara ob'ektini Ijaraberuvchiga Topshirish-qabul qilish akti bilan qaytaradi. Akt ikki tomon vakillari tomonidan imzolanadi." },
      { matn: "Ob'ektni qaytarish vaqtida oddiy eskirishdan tashqari zarar yetkazilganlik aniqlansa, Ijarachi zararsizlantirishni Topshirish-qabul qilish akti imzolanganidan keyin 10 (o'n) ish kuni ichida amalga oshirishi shart. Zarar miqdori kelishilmasa, mustaqil baholovchi jalb qilinadi." },
      { matn: "Ijarachi o'z hisobidan amalga oshirgan va ajratib olish mumkin bo'lgan yaxshilanishlar uning mulki bo'lib qoladi. Ajratib olish mumkin bo'lmagan yaxshilanishlar — bu borada oldindan Ijaraberuvchining yozma ruxsati bo'lgan hollarda — Ijarachi tomonidan talab qilinishi mumkin bo'lgan qoplash miqdori Tomonlarning yozma kelishuviga asosan belgilanadi." },
    ]},

    { sarlavha: "TOMONLARNING JAVOBGARLIGI", bandlar: [
      { matn: "Ijara haqini kechiktirganlik uchun Ijarachi kechiktirilgan summadan har bir kechikkan kun uchun 0,5 (nol butun besh) foiz miqdorida penya to'laydi, lekin penyaning umumiy miqdori yillik ijara haqi summasining 50 (ellik) foizidan oshmasligi kerak." },
      { matn: "Ijara ob'ektini yetarli holda topshirmaslik yoki topshirishni kechiktirganlik uchun Ijaraberuvchi 30 (o'ttiz) kunlik ijara haqiga teng miqdorda jarimani to'laydi." },
      { matn: "Ijara ob'ektiga yetkazilgan zarar uchun Ijarachi to'liq moddiy javobgarlik oladi. Tomonlar o'rtasida zararni baholashda kelishuv bo'lmasa, masala sudda hal etiladi." },
    ]},

    { sarlavha: "FORS-MAJOR", bandlar: [
      { matn: "Tomonlar o'z nazoratlaridan tashqarida bo'lgan fors-major holatlari — stixiyali ofatlar, harbiy harakatlar, epidemiyalar, hokimiyat organlarining majburiy aktlari oqibatida majburiyatlarini bajara olmaslik uchun javobgarlikdan ozod etiladi." },
      { matn: "Ta'sirlangan tomon boshqa tomonga fors-major holati haqida 5 (besh) kalendar kuni ichida yozma xabar berishi shart. Fors-major holatlari 2 (ikki) oydan ortiq davom etsa, Tomonlardan har biri Shartnomani bekor qilish huquqiga ega. Bu holda Shartnoma bo'yicha avvaldan to'langan ijara haqining fors-major boshlanganidan keyingi davr uchun qaytarilishi shart." },
    ]},

    { sarlavha: "NIZOLARNI HAL ETISH", bandlar: [
      { matn: "Shartnomadan kelib chiqadigan va muzokaralar yo'li bilan 15 (o'n besh) ish kuni ichida hal etilmagan nizolar O'zbekiston Respublikasi [SHAHAR] shahri iqtisodiy sudiga topshiriladi. Shartnoma bo'yicha pretenziyalar yozma shaklda taqdim etilishi va 15 (o'n besh) ish kuni ichida ko'rib chiqilishi kerak." },
    ]},

    { sarlavha: "SHARTNOMANING AMAL QILISH MUDDATI VA BEKOR QILISH TARTIBI", bandlar: [
      { matn: "Shartnoma Topshirish-qabul qilish akti imzolanganidan kuchga kiradi. Ijara ob'ektini topshirish aktsiz amalga oshirilmagan taqdirda Shartnoma kuchga kirmagan hisoblanadi." },
      { matn: "Shartnoma ikki tomon kelishuviga binoan istalgan vaqtda bekor qilinishi mumkin. Bir tomonlama bekor qilish uchun kamida 30 (o'ttiz) kalendar kun oldin yozma xabar berish shart. Ijarachi o'z vaqtida xabar bermasa, bekor qilingan oy uchun ijara haqi to'lanishi shart." },
      { matn: "Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasi Fuqarolik kodeksining 534–553-moddalari bilan tartibga solinadi." },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 4. PUDRAT SHARTNOMASI
  //    org=[BUYURTMACHI]=Buyurtmachi | cp=[IJROCHI]=Pudratchi
  // ══════════════════════════════════════════════════════════════════════════
  pudrat: (d) => ({ bolimlar: [

    { sarlavha: "SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "Buyurtmachi") va [IJROCHI] (keyingi o'rinlarda "Pudratchi") o'rtasida ushbu Pudrat shartnomasi (keyingi o'rinlarda "Shartnoma") tuzildi.` },
      { matn: "Pudratchi ushbu Shartnoma asosida Buyurtmachi topshirig'iga binoan ishlarni bajarish majburiyatini oladi, Buyurtmachi esa bajarilgan ishlarni qabul qilib belgilangan tartibda to'lash majburiyatini oladi." },
      { matn: "Bajariladigan ishlarning to'liq tavsifi, hajmi va texnik talablari ushbu Shartnomaga 1-ilova sifatida biriktirilgan Texnik topshiriq va ish hajmlari jadvalida (Smeta) ko'rsatiladi. 1-ilova Shartnomaning ajralmas qismi hisoblanadi." },
      { matn: `Ishlarning umumiy narxi (Shartnoma bahosi) [SUMMA] ([SUMMA_MATN]) so'mni tashkil etadi, QQS hisobga olingan holda. Shartnoma bahosi Texnik topshiriqda belgilangan ish hajmlari asosida hisoblanadi.` },
    ]},

    { sarlavha: "ISH BAJARISH MUDDATI", bandlar: [
      { matn: "Pudratchi ishlarni Shartnoma imzolanganidan keyin 5 (besh) ish kuni ichida boshlaydi va Texnik topshiriqda belgilangan jadvalga muvofiq yakunlaydi." },
      { matn: "Ish bajarish jarayonida bosqichli qabul qilish nazarda tutilgan bo'lsa, har bir bosqichning boshlanish va tugash sanalari Texnik topshiriqda alohida ko'rsatiladi. Har bir bosqich yakunida Tomonlar qabul-topshiriq dalolatnomasini imzolaydilar." },
      { matn: "Ish bajarish muddatini uzaytirish zarurati yuzaga kelsa, Pudratchi Buyurtmachini kamida 10 (o'n) ish kuni oldin yozma ravishda xabardor qilishi va muddatni uzaytirish sabablarini ko'rsatishi shart. Muddatni uzaytirish faqat Tomonlarning yozma kelishuviga binoan rasmiylashtiriladi." },
    ]},

    { sarlavha: "NARX VA TO'LOV TARTIBI", bandlar: [
      { matn: "Shartnoma bahosi bo'yicha to'lov quyidagi tartibda amalga oshiriladi: Shartnoma imzolanganidan keyin 5 (besh) ish kuni ichida Buyurtmachi umumiy Shartnoma bahosining 30 (o'ttiz) foizini avans sifatida to'laydi; ishlar 50 (ellik) foiz bajarilganda qo'shimcha 40 (qirq) foiz to'lanadi; ishlar to'liq qabul qilinib yakuniy dalolatnoma imzolanganida qolgan 30 (o'ttiz) foiz to'lanadi." },
      { matn: "Buyurtmachi qabul-topshiriq dalolatnomasini imzolaganidan keyin 10 (o'n) ish kuni ichida tegishli to'lov bosqichini to'liq amalga oshirishi shart." },
      { matn: "Ish hajmi o'zgarganda (ish hajmini qo'shish yoki kamaytirishda) Shartnoma bahosi Tomonlarning yozma kelishuviga asosan qo'shimcha smetani tuzish yo'li bilan o'zgartiriladi. Smetasiz ish bajarish uchun Pudratchi qo'shimcha to'lov talab qilish huquqiga ega emas." },
      { matn: "Pudratchi bajarilgan ishlar bo'yicha hisob-fakturani qabul-topshiriq dalolatnomasiga birga taqdim etadi. Buyurtmachi hisob-fakturani 5 (besh) ish kuni ichida ko'rib chiqadi." },
    ]},

    { sarlavha: "MATERIALLAR VA RESURSLAR", bandlar: [
      { matn: "Ishlarni bajarish uchun zarur bo'lgan materiallar, asbob-uskunalar va mexanizmlar Pudratchi tomonidan ta'minlanadi va Shartnoma bahosiga kiritiladi, agar Texnik topshiriqda boshqacha ko'rsatilmagan bo'lsa." },
      { matn: "Buyurtmachi tomonidan ta'minlanadigan materiallar (bo'lsa) Texnik topshiriqda alohida ro'yxat bilan ko'rsatiladi. Buyurtmachi materiallari topshirish vaqtida ularning sifati va miqdorini tasdiqlovchi hujjatlar bilan birga aktda rasmiylashtiriladi." },
      { matn: "Pudratchi Buyurtmachi tomonidan berilgan materiallarning saqlanishi va maqsadli ishlatilishi uchun to'liq moddiy javobgarlik oladi. Ish yakunida sarflangan va qolgan materiallar bo'yicha hisobot taqdim etiladi." },
    ]},

    { sarlavha: "TOMONLARNING HUQUQ VA MAJBURIYATLARI", bandlar: [
      { matn: "Pudratchi majburiyatlari: a) Ishlarni Texnik topshiriq talablariga muvofiq belgilangan sifat va muddatda bajarish; b) Ish jarayonida xavfsizlik texnikasi va mehnatni muhofaza qilish qoidalariga rioya qilish; v) Ish ob'ektida Buyurtmachiga tegishli mol-mulkni saqlash; g) Ish borishi haqida haftalik yozma hisobot berish; d) Subpudratchi jalb qilishda Buyurtmachining yozma ruxsatini olish; e) Ishni to'liq tugatgandan so'ng ish joyini tozalab topshirish." },
      { matn: "Buyurtmachi majburiyatlari: a) Ish bajarish uchun zarur sharoit yaratib berish (kirish ruxsati, elektr, suv va h.k.); b) Texnik topshiriqni o'z vaqtida va to'liq taqdim etish; v) Bajarilgan ishlarni belgilangan muddatda qabul qilish; g) To'lovlarni ish qabul dalolatnomasiga asosan o'z vaqtida amalga oshirish; d) Ish jarayonida zarur bo'lgan texnik maslahatlarni berish." },
    ]},

    { sarlavha: "ISHLARNI QABUL QILISH", bandlar: [
      { matn: "Pudratchi ishlarni tugatganidan keyin Buyurtmachiga yozma xabar beradi va qabul-topshiriq dalolatnomasini taqdim etadi. Buyurtmachi xabarnoma olinganidan 5 (besh) ish kuni ichida ishlarni qabul qiladi yoki asosli rad etishni yozma shaklda bildiradi." },
      { matn: "Qabul jarayonida aniqlangan nuqsonlar Qabul-topshiriq aktida qayd etiladi va Pudratchi tomonidan 10 (o'n) ish kuni ichida bepul bartaraf etiladi. Nuqsonlar bartaraf etilganidan so'ng ishlar qayta qabul qilinadi." },
      { matn: "Buyurtmachi belgilangan muddatda qabul qilmasa yoki asosli rad etishni bildirmasa, ishlar qabul qilingan hisoblanadi va to'lov amalga oshirilishi kerak." },
    ]},

    { sarlavha: "KAFOLAT", bandlar: [
      { matn: "Pudratchi bajarilgan ishlar sifatiga 24 (yigirma to'rt) oy kafolat muddatini taqdim etadi. Kafolat muddati Yakuniy qabul-topshiriq dalolatnomasi imzolanganidan boshlanadi." },
      { matn: "Kafolat muddati ichida yuzaga kelgan nuqsonlar Pudratchi tomonidan bepul bartaraf etiladi. Pudratchi kafolat pretenziyasini olgandan 10 (o'n) ish kuni ichida nuqsonlarni bartaraf etishni boshlashi shart." },
      { matn: "Kafolat majburiyatlarini ta'minlash uchun Buyurtmachi Shartnoma bahosining 5 (besh) foizini to'lovning oxirgi qismidan kafolat puli sifatida ushlab qolish huquqiga ega. Ushbu summa kafolat muddati tugaganidan keyin 30 (o'ttiz) ish kuni ichida qaytariladi." },
    ]},

    { sarlavha: "TOMONLARNING JAVOBGARLIGI", bandlar: [
      { matn: "Tomonlarning Shartnomada nazarda tutilgan majburiyatlarni bajarmasligi uchun javobgarligi O'zbekiston Respublikasining amaldagi qonunchiligi bilan belgilanadi." },
      { matn: "Ishlarni kechiktirganlik uchun Pudratchi Shartnoma bahosidan har bir kechikkan kun uchun 0,5 (nol butun besh) foiz miqdorida penya to'laydi, lekin penyaning umumiy miqdori Shartnoma bahosining 50 (ellik) foizidan oshmasligi kerak." },
      { matn: "To'lovni kechiktirganlik uchun Buyurtmachi muddati o'tgan summadan har bir kechikkan kun uchun 0,5 (nol butun besh) foiz miqdorida penya to'laydi, lekin penyaning umumiy miqdori Shartnoma bahosining 50 (ellik) foizidan oshmasligi kerak." },
    ]},

    { sarlavha: "FORS-MAJOR", bandlar: [
      { matn: "Tomonlar o'z nazoratlaridan tashqarida bo'lgan fors-major holatlari oqibatida majburiyatlarini bajara olmaslik uchun javobgarlikdan ozod etiladi. Ta'sirlangan tomon boshqa tomonga 5 (besh) kalendar kuni ichida yozma xabar berishi shart; xabar bermaslik javobgarlikdan ozod etilish huquqini yo'qotishga olib keladi. Fors-major holatlari 3 (uch) oydan ortiq davom etsa, har bir tomon Shartnomani bekor qilish huquqiga ega." },
    ]},

    { sarlavha: "NIZOLARNI HAL ETISH", bandlar: [
      { matn: "Shartnomadan kelib chiqadigan va muzokaralar yo'li bilan 15 (o'n besh) ish kuni ichida hal etilmagan nizolar O'zbekiston Respublikasi [SHAHAR] shahri iqtisodiy sudiga topshiriladi. Pretenziyalar yozma shaklda taqdim etilishi va 15 (o'n besh) ish kuni ichida ko'rib chiqilishi kerak." },
    ]},

    { sarlavha: "SHARTNOMANING AMAL QILISH MUDDATI VA BEKOR QILISH TARTIBI", bandlar: [
      { matn: "Shartnoma Tomonlar tomonidan imzolangan kundan kuchga kiradi va Tomonlar o'z majburiyatlarini to'liq bajargunga qadar amal qiladi. Shartnomaga o'zgartirishlar faqat yozma qo'shimcha kelishuvlar bilan rasmiylashtiriladi. Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasi Fuqarolik kodeksining 631–663-moddalari bilan tartibga solinadi." },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 5. MOLIYAVIY YORDAM (QARZ) SHARTNOMASI
  //    org=[BUYURTMACHI]=Qarz beruvchi | cp=[IJROCHI]=Qarz oluvchi
  // ══════════════════════════════════════════════════════════════════════════
  moliyaviy: (d) => ({ bolimlar: [

    { sarlavha: "SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "Qarz beruvchi") va [IJROCHI] (keyingi o'rinlarda "Qarz oluvchi") o'rtasida ushbu Moliyaviy yordam (Qarz) shartnomasi (keyingi o'rinlarda "Shartnoma") tuzildi.` },
      { matn: `Qarz beruvchi Qarz oluvchiga [SUMMA] ([SUMMA_MATN]) so'm miqdorida qarz (moliyaviy yordam) beradi, Qarz oluvchi esa qarzni belgilangan muddatda foizlar bilan (yoki foizsiz) qaytarish majburiyatini oladi.` },
      { matn: "Qarz maqsadi: ___________________________. Qarz oluvchi qarzni faqat ushbu maqsadda foydalanish majburiyatini oladi. Maqsadli foydalanish ustidan nazorat huquqi Qarz beruvchiga tegishli." },
      { matn: "Qarz miqdori Qarz beruvchining bank hisob raqamidan Qarz oluvchining bank hisob raqamiga naqd pulsiz bank o'tkazma orqali beriladi." },
    ]},

    { sarlavha: "QARZNI BERISH TARTIBI", bandlar: [
      { matn: "Qarz Shartnoma Tomonlar tomonidan imzolanganidan keyin 5 (besh) bank ish kuni ichida Qarz oluvchining hisob raqamiga o'tkaziladi." },
      { matn: "Qarz oluvchi pul o'tkazilganidan keyin 3 (uch) ish kuni ichida qarzni qabul qilganligini tasdiqlovchi yozma hujjatni Qarz beruvchiga taqdim etadi." },
      { matn: "Agar Qarz beruvchi Shartnomada belgilangan muddatda qarzni o'tkazmasа, Qarz oluvchi Shartnomadan voz kechish va ko'rilgan zararlarini qoplashni talab qilish huquqiga ega." },
    ]},

    { sarlavha: "FOIZLAR VA QARZNI QAYTARISH TARTIBI", bandlar: [
      { matn: "Qarz bo'yicha yillik foiz stavkasi ___ foizni tashkil etadi. Foizlar qarz summasi asosida kunlik hisoblanadi va qarzning asosiy qismi bilan birga qaytariladi. (Agar qarz foizsiz bo'lsa: Ushbu qarz foizsiz beriladi.)" },
      { matn: "Qarz oluvchi qarzni Shartnoma kuchga kirganidan boshlab ___ oy ichida quyidagi jadvalga muvofiq qaytarish majburiyatini oladi: oylik teng ulushda to'lash. Har oyning ___ sanasida to'lov amalga oshiriladi." },
      { matn: "Qarz oluvchi qarzni muddatidan oldin qaytarish huquqiga ega; buning uchun Qarz beruvchiga kamida 3 (uch) ish kuni oldin yozma xabar berishi shart. Muddatidan oldin qaytarishda ortiqcha foiz yoki jarima undirilmaydi." },
      { matn: "Barcha to'lovlar O'zbekiston Respublikasi milliy valyutasida — so'mda amalga oshiriladi. To'lov sanasi Qarz beruvchining bank hisobvarag'iga pul kelib tushgan sana hisoblanadi." },
    ]},

    { sarlavha: "TOMONLARNING HUQUQ VA MAJBURIYATLARI", bandlar: [
      { matn: "Qarz beruvchi majburiyatlari: a) Shartnomada belgilangan muddatda qarz summasini o'tkazish; b) Qarz oluvchiga qarzni qaytarish grafigi va hisob-kitob hujjatlarini taqdim etish; v) Qarz oluvchining maqsadli foydalanish bo'yicha hisobotlarini ko'rib chiqish." },
      { matn: "Qarz oluvchi majburiyatlari: a) Qarzni faqat belgilangan maqsadda foydalanish; b) Qarzni belgilangan jadval asosida o'z vaqtida qaytarish; v) Qarz beruvchining so'roviga binoan qarz mablag'laridan foydalanish to'g'risida hujjatli hisobot berish; g) Moliyaviy ahvolining sezilarli yomonlashuvi haqida Qarz beruvchini darhol xabardor qilish." },
    ]},

    { sarlavha: "TOMONLARNING JAVOBGARLIGI", bandlar: [
      { matn: "Qarzni qaytarish muddatlarini kechiktirganlik uchun Qarz oluvchi muddati o'tgan summadan har bir kechikkan kun uchun 0,1 (nol butun bir) foiz miqdorida penya to'laydi, lekin penyaning umumiy miqdori qarz summasining 30 (o'ttiz) foizidan oshmasligi kerak." },
      { matn: "Qarzni maqsadsiz sarflaganligi aniqlansa, Qarz beruvchi qarz summasini muddatidan oldin to'liq qaytarishni talab qilish huquqiga ega, shu bilan birga Qarz oluvchi qarz summasining 10 (o'n) foizi miqdorida jarima to'laydi." },
      { matn: "Tomonlarning majburiyatlarni bajarmasligi uchun javobgarligi O'zbekiston Respublikasining amaldagi qonunchiligi, jumladan Fuqarolik kodeksining 732–757-moddalari bilan belgilanadi." },
    ]},

    { sarlavha: "FORS-MAJOR", bandlar: [
      { matn: "Tomonlar o'z nazoratlaridan tashqarida bo'lgan fors-major holatlari oqibatida majburiyatlarini bajara olmaslik uchun javobgarlikdan ozod etiladi. Ta'sirlangan tomon boshqa tomonga 5 (besh) kalendar kuni ichida yozma xabar berishi shart. Fors-major holatlari vakolatli organ tomonidan tasdiqlanishi kerak. Fors-major holatlari 2 (ikki) oydan ortiq davom etsa, Tomonlar qarz qaytarish muddatini uzaytirish yoki boshqa yechimlarga kelishish haqida muzokaralar olib borishlari shart." },
    ]},

    { sarlavha: "NIZOLARNI HAL ETISH", bandlar: [
      { matn: "Shartnomadan kelib chiqadigan nizolar muzokaralar yo'li bilan 15 (o'n besh) ish kuni ichida hal etiladi; hal etilmagan nizolar O'zbekiston Respublikasi [SHAHAR] shahri iqtisodiy sudiga topshiriladi. Pretenziyalar yozma shaklda taqdim etilishi va 15 (o'n besh) ish kuni ichida ko'rib chiqilishi kerak." },
    ]},

    { sarlavha: "SHARTNOMANING AMAL QILISH MUDDATI VA BEKOR QILISH TARTIBI", bandlar: [
      { matn: "Shartnoma Tomonlar tomonidan imzolanganidan kuchga kiradi va qarz summasi hamda foizlar to'liq qaytarilgunga qadar amal qiladi. Shartnomaga o'zgartirishlar faqat yozma qo'shimcha kelishuvlar bilan rasmiylashtiriladi. Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasi Fuqarolik kodeksining 732–757-moddalari bilan tartibga solinadi." },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 6. DAVAL (QAYTA ISHLASH) SHARTNOMASI
  //    org=[BUYURTMACHI]=Buyurtmachi | cp=[IJROCHI]=Qayta ishlovchi
  // ══════════════════════════════════════════════════════════════════════════
  daval: (d) => ({ bolimlar: [

    { sarlavha: "SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "Buyurtmachi") va [IJROCHI] (keyingi o'rinlarda "Qayta ishlovchi") o'rtasida ushbu Daval (Qayta ishlash) shartnomasi (keyingi o'rinlarda "Shartnoma") tuzildi.` },
      { matn: "Buyurtmachi Qayta ishlovchiga xom ashyo (daval material) taqdim etadi, Qayta ishlovchi esa uni belgilangan texnologiya asosida qayta ishlab tayyor mahsulot holatida Buyurtmachiga qaytarish majburiyatini oladi." },
      { matn: "Daval materialning turi, miqdori va sifat xususiyatlari ushbu Shartnomaga 1-ilova sifatida biriktirilgan Xom ashyo topshirish-qabul qilish aktida ko'rsatiladi. Tayyor mahsulotning taxminiy chiqishi (yield) va sifat talablari Texnik topshiriqda (2-ilova) belgilanadi." },
      { matn: `Qayta ishlash xizmati narxi [SUMMA] ([SUMMA_MATN]) so'mni tashkil etadi. Ushbu narxga xom ashyo qiymati kirmaydi.` },
    ]},

    { sarlavha: "XOM ASHYO TOPSHIRISH TARTIBI", bandlar: [
      { matn: "Buyurtmachi xom ashyoni Tomonlar kelishgan muddatda Qayta ishlovchining ob'ektiga (yoki belgilangan joyga) yetkazib beradi. Xom ashyo topshirish Topshirish-qabul qilish akti bilan rasmiylashtiriladi." },
      { matn: "Xom ashyo topshirish aktida quyidagilar ko'rsatiladi: nomi, miqdori (og'irligi/hajmi), sifat ko'rsatkichlari (tahlil natijalari, sertifikatlar), topshirish sanasi. Akt ikki tomon vakillari tomonidan imzolanadi." },
      { matn: "Qayta ishlovchi qabul qilingan xom ashyoni alohida hisobda saqlash, boshqa materiallar bilan aralashmaslik va faqat belgilangan maqsadda ishlatish majburiyatini oladi." },
      { matn: "Agar xom ashyo belgilangan sifat talablariga javob bermasa, Qayta ishlovchi uni qabul qilishdan voz kechish va Buyurtmachini 24 (yigirma to'rt) soat ichida yozma ravishda xabardor qilish huquqiga ega." },
    ]},

    { sarlavha: "NARX VA TO'LOV TARTIBI", bandlar: [
      { matn: "Qayta ishlash xizmati to'lovi quyidagi tartibda amalga oshiriladi: Buyurtmachi xom ashyo topshirish aktini imzolagan kundan boshlab 5 (besh) ish kuni ichida xizmat narxining 50 (ellik) foizini oldindan to'laydi; qolgan 50 (ellik) foizini esa tayyor mahsulot topshirilgandan keyin 10 (o'n) ish kuni ichida to'liq to'laydi." },
      { matn: "Agar qayta ishlash jarayonida xom ashyo qo'shimcha sarflanishi kerak bo'lsa, Qayta ishlovchi Buyurtmachini darhol xabardor qiladi va narxni o'zgartirishga faqat Buyurtmachining yozma ruxsatiga asosan yo'l qo'yiladi." },
      { matn: "Qayta ishlovchi xizmat yakunlanganidan keyin 5 (besh) ish kuni ichida elektron hisob-faktura rasmiylashtiradi." },
    ]},

    { sarlavha: "TOMONLARNING HUQUQ VA MAJBURIYATLARI", bandlar: [
      { matn: "Qayta ishlovchi majburiyatlari: a) Xom ashyoni belgilangan texnologiya asosida sifatli qayta ishlash; b) Qabul qilingan xom ashyo va tayyor mahsulot bo'yicha to'liq hisobdorlik yuritish; v) Xom ashyo yo'qolishi, shikastlanishi yoki sifatsiz qayta ishlanishi uchun to'liq moddiy javobgarlik; g) Qayta ishlash jarayonida hosil bo'lgan chiqindilarni qonunchilikka muvofiq yo'qotish; d) Tayyor mahsulot tayyorligini Buyurtmachiga 3 (uch) ish kuni oldin xabar berish." },
      { matn: "Buyurtmachi majburiyatlari: a) Xom ashyoni belgilangan sifat va miqdorda o'z vaqtida yetkazib berish; b) Xom ashyoga doir barcha kerakli hujjatlarni (sertifikatlar, tahlillar) taqdim etish; v) To'lovlarni belgilangan muddatda amalga oshirish; g) Tayyor mahsulotni xabar berilganidan 5 (besh) ish kuni ichida qabul qilib olish." },
    ]},

    { sarlavha: "TAYYOR MAHSULOTNI TOPSHIRISH", bandlar: [
      { matn: "Qayta ishlovchi tayyor mahsulotni Topshirish-qabul qilish akti bilan topshiradi. Aktda tayyor mahsulotning nomi, miqdori, sifat ko'rsatkichlari va topshirish sanasi ko'rsatiladi." },
      { matn: "Buyurtmachi tayyor mahsulotni 5 (besh) ish kuni ichida qabul qiladi. Sifat bo'yicha kelishmovchiliklar bo'lsa, mustaqil akkreditatsiyalangan laboratoriya xulosasi hal qiluvchi hujjat hisoblanadi." },
      { matn: "Qayta ishlash natijasida hosil bo'lgan chiqindilar va yo'qotishlarning maksimal ruxsat etilgan miqdori Texnik topshiriqda belgilanadi. Ruxsat etilgan miqdordan ortiq yo'qotishlar uchun Qayta ishlovchi Buyurtmachiga qoplash majburiyatini oladi." },
    ]},

    { sarlavha: "TOMONLARNING JAVOBGARLIGI", bandlar: [
      { matn: "Qayta ishlovchi qabul qilingan xom ashyoni yo'qotish yoki shikastlash uchun uning bozor qiymatini to'liq qoplash majburiyatini oladi." },
      { matn: "Tayyor mahsulotni topshirishni kechiktirganlik uchun Qayta ishlovchi Shartnoma summasidan har bir kechikkan kun uchun 0,5 (nol butun besh) foiz miqdorida penya to'laydi, lekin penyaning umumiy miqdori Shartnoma summasining 50 (ellik) foizidan oshmasligi kerak." },
      { matn: "To'lovni kechiktirganlik uchun Buyurtmachi muddati o'tgan summadan har bir kechikkan kun uchun 0,5 (nol butun besh) foiz miqdorida penya to'laydi, lekin penyaning umumiy miqdori Shartnoma summasining 50 (ellik) foizidan oshmasligi kerak." },
    ]},

    { sarlavha: "FORS-MAJOR VA NIZOLARNI HAL ETISH", bandlar: [
      { matn: "Tomonlar o'z nazoratlaridan tashqarida bo'lgan fors-major holatlari oqibatida majburiyatlarini bajara olmaslik uchun javobgarlikdan ozod etiladi. Ta'sirlangan tomon 5 (besh) kalendar kuni ichida yozma xabar berishi shart. Fors-major holatlari 2 (ikki) oydan ortiq davom etsa, Tomonlar xom ashyoni qaytarish va hisob-kitob qilish shartlari to'g'risida muzokaralar olib borishlari shart." },
      { matn: "Shartnomadan kelib chiqadigan nizolar muzokaralar yo'li bilan 15 (o'n besh) ish kuni ichida hal etiladi; hal etilmagan nizolar O'zbekiston Respublikasi [SHAHAR] shahri iqtisodiy sudiga topshiriladi. Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasining amaldagi qonunchiligi bilan tartibga solinadi." },
    ]},

    { sarlavha: "SHARTNOMANING AMAL QILISH MUDDATI", bandlar: [
      { matn: "Shartnoma Tomonlar tomonidan imzolanganidan kuchga kiradi va Tomonlar o'z majburiyatlarini to'liq bajargunga qadar amal qiladi. Shartnomaga o'zgartirishlar faqat yozma qo'shimcha kelishuvlar bilan rasmiylashtiriladi." },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 7. XALQARO SAVDO SHARTNOMASI
  //    org=[BUYURTMACHI]=Seller | cp=[IJROCHI]=Buyer
  // ══════════════════════════════════════════════════════════════════════════
  xalqaro: (d) => ({ bolimlar: [

    { sarlavha: "SUBJECT OF THE CONTRACT / SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (hereinafter "Seller" / keyingi o'rinlarda "Sotuvchi") and [IJROCHI] (hereinafter "Buyer" / keyingi o'rinlarda "Xaridor") have concluded this International Trade Contract (hereinafter "Contract" / keyingi o'rinlarda "Shartnoma").` },
      { matn: "The Seller agrees to supply and the Buyer agrees to accept and pay for the Goods in accordance with the terms of this Contract. The Goods description, quantity and technical specifications are defined in Annex No. 1 (Specification) which forms an integral part of this Contract." },
      { matn: `The total value of this Contract is [SUMMA] ([SUMMA_MATN]) UZS (or as agreed in the applicable currency). The final Contract value shall be determined as the sum of all invoices issued under this Contract.` },
    ]},

    { sarlavha: "DELIVERY TERMS / YETKAZIB BERISH SHARTLARI", bandlar: [
      { matn: "Delivery terms are governed by Incoterms 2020 rules as specified in Annex No. 1. The applicable Incoterms rule, place of delivery and risk transfer point shall be clearly stated in each shipment order." },
      { matn: "Delivery schedule: within ___ calendar days from the date of receipt of the Buyer's advance payment. In case of delay exceeding 10 (ten) business days, the Seller shall notify the Buyer in writing with a revised delivery schedule." },
      { matn: "The Seller shall provide the Buyer with the following shipping documents: commercial invoice, packing list, bill of lading (or CMR/airway bill), certificate of origin, and quality/conformity certificate. Documents shall be provided within 5 (five) business days from shipment." },
      { matn: "Title to and risk of loss of the Goods shall pass to the Buyer at the delivery point as defined by the applicable Incoterms rule." },
    ]},

    { sarlavha: "PAYMENT TERMS / TO'LOV SHARTLARI", bandlar: [
      { matn: "Payment shall be made in ___ (currency) by bank wire transfer to the Seller's bank account. Payment method: 30% advance within 5 (five) banking days of Contract signing; 70% balance within 30 (thirty) calendar days from the date of shipment documents." },
      { matn: "The Buyer bears all bank charges, commissions and fees related to the payment transfer. The payment date is the date the funds are credited to the Seller's bank account." },
      { matn: "Currency risk: if the agreed payment currency fluctuates by more than 10% against the UZS between the Contract date and the payment date, the Parties shall negotiate a price adjustment in good faith." },
      { matn: "The Seller shall issue a commercial invoice within 3 (three) business days from shipment. All invoices must reference this Contract number." },
    ]},

    { sarlavha: "QUALITY AND WARRANTIES / SIFAT VA KAFOLATLAR", bandlar: [
      { matn: "The Goods shall conform to the quality standards specified in Annex No. 1 and to the applicable international standards (ISO, EN, GOST or equivalent). The Seller warrants that the Goods are free from defects in materials and workmanship." },
      { matn: "The Buyer must inspect the Goods upon receipt and notify the Seller of any visible defects within 5 (five) business days; hidden defects must be notified within 30 (thirty) calendar days of discovery. The warranty period for hidden defects is 12 (twelve) months from delivery date." },
    ]},

    { sarlavha: "RIGHTS AND OBLIGATIONS / HUQUQ VA MAJBURIYATLAR", bandlar: [
      { matn: "Seller's obligations: a) Supply the Goods in conformity with the Contract specifications and in agreed quantities; b) Provide all required shipping and quality documentation; c) Notify the Buyer of any delay or inability to perform within 3 (three) business days; d) Maintain confidentiality of the Buyer's business information." },
      { matn: "Buyer's obligations: a) Make payments on time and in full; b) Provide timely instructions for shipment when required; c) Inspect and accept the Goods within the agreed timeframe; d) Notify the Seller of any quality claims within the prescribed period; e) Obtain all necessary import licenses and customs clearance at destination." },
    ]},

    { sarlavha: "LIABILITY / JAVOBGARLIK", bandlar: [
      { matn: "For late delivery, the Seller shall pay to the Buyer a penalty of 0.5% of the value of undelivered Goods for each day of delay, but not exceeding 10% of the total Contract value. For late payment, the Buyer shall pay to the Seller a penalty of 0.5% of the overdue amount for each day of delay, not exceeding 10% of the total Contract value." },
      { matn: "Neither Party shall be liable for indirect, consequential or punitive damages. The total liability of either Party under this Contract shall not exceed the total Contract value." },
    ]},

    { sarlavha: "FORCE MAJEURE / FORS-MAJOR", bandlar: [
      { matn: "Neither Party shall be liable for failure to perform its obligations due to force majeure circumstances beyond its reasonable control, including but not limited to: natural disasters, acts of war, epidemics, embargoes, government restrictions or transport disruptions." },
      { matn: "The affected Party must notify the other Party in writing within 5 (five) calendar days of the occurrence of force majeure. The notification must be supported by a certificate from the relevant authority (e.g., Chamber of Commerce). If force majeure continues for more than 3 (three) months, either Party may terminate the Contract without liability for damages." },
    ]},

    { sarlavha: "DISPUTE RESOLUTION / NIZOLARNI HAL ETISH", bandlar: [
      { matn: "The Parties shall attempt to resolve any disputes arising from this Contract through good-faith negotiations within 30 (thirty) calendar days of written notice. If negotiations fail, disputes shall be submitted to arbitration under the Rules of the International Chamber of Commerce (ICC) or to the Economic Court of the Republic of Uzbekistan, at the claimant's choice." },
      { matn: "This Contract shall be governed by the laws of the Republic of Uzbekistan. The official language of arbitration proceedings shall be Russian or Uzbek. Each Party shall bear its own legal costs unless the arbitral tribunal decides otherwise." },
    ]},

    { sarlavha: "VALIDITY AND GENERAL PROVISIONS / SHARTNOMA MUDDATI", bandlar: [
      { matn: "This Contract enters into force upon signing by both Parties and remains in effect until all obligations are fully performed. Amendments to this Contract are valid only if made in writing and signed by authorized representatives of both Parties." },
      { matn: "This Contract is made in 2 (two) originals in Uzbek and/or Russian, each having equal legal force. Upon signing, all prior negotiations, letters of intent and preliminary agreements related to this Contract lose legal force." },
      { matn: "Matters not covered by this Contract shall be governed by the applicable legislation of the Republic of Uzbekistan and, where applicable, the United Nations Convention on Contracts for the International Sale of Goods (CISG)." },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 8. QO'SHIMCHA KELISHUV
  // ══════════════════════════════════════════════════════════════════════════
  qoshimcha: (d) => ({ bolimlar: [

    { sarlavha: "ASOSIY SHARTNOMA TO'G'RISIDA MA'LUMOT", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "1-tomon") va [IJROCHI] (keyingi o'rinlarda "2-tomon") o'rtasida ushbu Qo'shimcha kelishuv tuzildi.` },
      { matn: `Ushbu Qo'shimcha kelishuv Tomonlar o'rtasida [ASOSIY_SANA] kuni tuzilgan №[ASOSIY_RAQAM]-sonli asosiy shartnomaning (keyingi o'rinlarda "Asosiy shartnoma") ajralmas qismi hisoblanadi va uning shartlarini o'zgartiradi yoki to'ldiradi.` },
      { matn: "Asosiy shartnomaning ushbu Qo'shimcha kelishuvda o'zgartirilmagan barcha bandlari o'z kuchini saqlab qoladi." },
    ]},

    { sarlavha: "KIRITILAYOTGAN O'ZGARTIRISHLAR", bandlar: [
      { matn: `Tomonlar Asosiy shartnomaga quyidagi o'zgartirish va qo'shimchalarni kiritish to'g'risida kelishib oldilar: [OZGARTIRISH].` },
      { matn: "O'zgartirish asoslari va sabablari: Tomonlarning o'zaro manfaatlari va amaldagi qonunchilik talablari asosida amalga oshirilmoqda." },
    ]},

    { sarlavha: "MOLIYAVIY SHARTLAR", bandlar: [
      { matn: `Ushbu Qo'shimcha kelishuv asosida Tomonlar o'rtasidagi hisob-kitob summasi [SUMMA] ([SUMMA_MATN]) so'mni tashkil etadi. To'lov tartibi Asosiy shartnomada belgilangan tartibda amalga oshiriladi, agar ushbu Qo'shimcha kelishuvda boshqacha ko'rsatilmagan bo'lsa.` },
      { matn: "Narxni o'zgartirish asoslantirilgan bo'lishi va Tomonlarning yozma kelishuviga ega bo'lishi shart. O'zgartirilgan narx Qo'shimcha kelishuv kuchga kirgan kundan boshlab amal qiladi." },
    ]},

    { sarlavha: "KUCHGA KIRISH TARTIBI", bandlar: [
      { matn: "Ushbu Qo'shimcha kelishuv ikki tomon imzolagan kundan kuchga kiradi. Ushbu Qo'shimcha kelishuvda o'zgartirilgan shartlar imzolangan kundan boshlab amal qiladi; o'zgartirilmagan barcha bandlar Asosiy shartnoma tahririda qoladi." },
      { matn: "Ushbu Qo'shimcha kelishuv 2 (ikki) nusxada tuzilgan bo'lib, barcha nusxalar teng yuridik kuchga ega — Tomonlarning har biriga bittadan. Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasining amaldagi qonunchiligi bilan tartibga solinadi." },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 9. AGENTLIK SHARTNOMASI
  //    org=[BUYURTMACHI]=Principal | cp=[IJROCHI]=Agent
  // ══════════════════════════════════════════════════════════════════════════
  agentlik: (d) => ({ bolimlar: [

    { sarlavha: "SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "Principal") va [IJROCHI] (keyingi o'rinlarda "Agent") o'rtasida ushbu Agentlik shartnomasi (keyingi o'rinlarda "Shartnoma") tuzildi.` },
      { matn: `Agent Principalning topshirig'i va hisobidan uning nomidan [AGENT_VAZIFA] bo'yicha yuridik va faktik harakatlar amalga oshirish majburiyatini oladi. Principal esa Agent xizmatlarini qabul qilib, ushbu Shartnomada belgilangan tartibda haq to'lash majburiyatini oladi.` },
      { matn: `Agentlik vakolati geografik doirasi: [AGENT_HUDUD]. Agent Principalning yozma roziligisiz ushbu hudud doirasidan chiqib harakat qilish huquqiga ega emas.` },
      { matn: `Shartnoma bo'yicha taxminiy aylanma hajmi [SUMMA] ([SUMMA_MATN]) so'mni tashkil etadi. Agentlik haqi bajarilgan bitimlar summasi asosida hisoblanadi.` },
    ]},

    { sarlavha: "AGENTNING HUQUQ VA MAJBURIYATLARI", bandlar: [
      { matn: `Agent quyidagi majburiyatlarni oladi: a) Principalning manfaatlarini vijdonan himoya qilish va Principalga zarar yetkazishi mumkin bo'lgan harakatlardan tiyilish; b) Principal tomonidan belgilangan narx va shartlarda bitimlar tuzish; v) Har oy oxirida bajarilgan ishlar to'g'risida hisobot taqdim etish; g) Tijorat siri saqlanishi va Principalning ishbilarmonlik obro'sini himoya qilish.` },
      { matn: `Agent quyidagi huquqlarga ega: a) O'z vazifalarini bajarish uchun zarur ma'lumot va hujjatlarni Principaldan talab qilish; b) Shartnomada belgilangan agentlik haqini o'z vaqtida olish; v) Principalning yozma roziligi bilan quyi agentlar jalb etish.` },
      { matn: `Agent Principalning raqobatchilari bilan bir vaqtda agentlik shartnomalari tuzishdan manfaatdorlik to'qnashuvi yuzaga kelgan taqdirda Principalga darhol xabar berishi shart.` },
    ]},

    { sarlavha: "PRINCIPALNING HUQUQ VA MAJBURIYATLARI", bandlar: [
      { matn: `Principal quyidagi majburiyatlarni oladi: a) Agent faoliyati uchun zarur vakolatlar, hujjatlar va ma'lumotlarni taqdim etish; b) Agentlik haqini belgilangan muddatlarda to'liq to'lash; v) Agent tuzgan bitimlarni o'z vaqtida bajarish; g) Agentning makul harakatlaridan kelib chiqadigan majburiyatlarni qabul qilish.` },
      { matn: `Principal ixtiyoriy vaqtda Agentga yangi topshiriqlar berish, mavjud topshiriqlarni o'zgartirish yoki bekor qilish huquqiga ega. Topshiriqni o'zgartirish yoki bekor qilish yozma shaklda kamida 5 (besh) ish kuni oldin bildirilishi shart.` },
    ]},

    { sarlavha: "AGENTLIK HAQI VA TO'LOV TARTIBI", bandlar: [
      { matn: `Agentlik haqi Agent tomonidan amalga oshirilgan bitimlar umumiy summasining [AGENT_FOZ] foizini tashkil etadi. Minimal oylik agentlik haqi [SUMMA] so'mdan kam bo'lmasligi kerak.` },
      { matn: `Agentlik haqi Agent hisoboti tasdiqlangandan keyin 10 (o'n) ish kuni ichida bank o'tkazma orqali to'lanadi. Hisob-kitob O'zbekiston Respublikasi milliy valyutasida — so'mda amalga oshiriladi.` },
      { matn: `Agent xarajatlari (transport, aloqa, reklama) Principalning oldindan yozma roziligi bilan qoplanadi. Roziliksiz qilingan xarajatlar Agent hisobidan to'lanadi.` },
    ]},

    { sarlavha: "HISOBOT TARTIBI", bandlar: [
      { matn: `Agent har oy 25-sanasiga qadar Principalga quyidagi ma'lumotlarni o'z ichiga olgan hisobot taqdim etadi: tuzilgan bitimlar soni va umumiy summasi; potentsial mijozlar ro'yxati; bozor holati to'g'risida ma'lumot; kelgusi oy uchun harakat rejasi.` },
      { matn: `Principal hisobotni olganidan keyin 5 (besh) ish kuni ichida uni tasdiqlaydi yoki asosli e'tirozlarini yozma shaklda bildiradi. Muddatida javob berilmasa, hisobot tasdiqlanган hisoblanadi.` },
    ]},

    { sarlavha: "TOMONLARNING JAVOBGARLIGI", bandlar: [
      { matn: `Agent o'z majburiyatlarini bajarmaganlik yoki lozim darajada bajarmaganlik uchun Principalga yetkazilgan haqiqiy zararni to'liq qoplash majburiyatini oladi. Agent tomonidan ruxsatsiz tuzilgan bitimlar bo'yicha javobgarlik Agentga yuklanadi.` },
      { matn: `To'lov muddati buzilganda aybdor tomon kechiktirilgan summadan har bir kechikkan kun uchun 0,5 (nol butun besh) foiz miqdorida penya to'laydi, lekin penyaning umumiy miqdori asosiy qarzdorlik summasining 50 (ellik) foizidan oshmasligi kerak.` },
      { matn: `Tomonlar fors-major holatlari — tabiiy ofatlar, harbiy harakatlar, epidemiyalar, hokimiyat organlarining majburiy aktlari tufayli majburiyatlarni bajara olmaslik uchun javobgarlikdan ozod etiladi. Ta'sirlangan tomon 5 (besh) kalendar kuni ichida yozma xabar berishi shart.` },
    ]},

    { sarlavha: "NIZOLARNI HAL ETISH", bandlar: [
      { matn: `Shartnomadan kelib chiqadigan barcha nizolar muzokaralar yo'li bilan 15 (o'n besh) ish kuni ichida hal etiladi. Kelishuv bo'lmagan taqdirda nizo O'zbekiston Respublikasi [SHAHAR] shahri iqtisodiy sudiga topshiriladi. Pretenziyalar yozma shaklda taqdim etilib, 15 (o'n besh) ish kuni ichida ko'rib chiqilishi kerak.` },
    ]},

    { sarlavha: "SHARTNOMANING AMAL QILISH MUDDATI VA BEKOR QILISH TARTIBI", bandlar: [
      { matn: `Shartnoma Tomonlar tomonidan imzolangan kundan kuchga kiradi va [YIL_OXIRI] gacha amal qiladi. Shartnoma muddati tugagandan so'ng hech biri tugatish haqida kamida 30 (o'ttiz) kun oldin yozma xabar bermasa, Shartnoma keyingi bir yilga avtomatik uzaytirilgan hisoblanadi.` },
      { matn: `Har bir Tomon Shartnomani 30 (o'ttiz) kun oldin yozma xabar berish orqali bir tomonlama bekor qilish huquqiga ega. Shartnoma bekor qilingan taqdirda Agent bekor qilish sanasigacha bajarilgan ishlar uchun agentlik haqini olish huquqini saqlab qoladi.` },
      { matn: `Shartnoma o'zbek tilida 2 (ikki) nusxada tuzilgan bo'lib, barcha nusxalar teng yuridik kuchga ega. Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasi Fuqarolik kodeksining 817–833-moddalari bilan tartibga solinadi.` },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 10. TRANSPORT (YUK TASHISH) SHARTNOMASI
  //     org=[BUYURTMACHI]=Jo'natuvchi | cp=[IJROCHI]=Tashuvchi
  // ══════════════════════════════════════════════════════════════════════════
  transport: (d) => ({ bolimlar: [

    { sarlavha: "SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "Jo'natuvchi") va [IJROCHI] (keyingi o'rinlarda "Tashuvchi") o'rtasida ushbu Transport xizmatlarini ko'rsatish shartnomasi (keyingi o'rinlarda "Shartnoma") tuzildi.` },
      { matn: `Tashuvchi Jo'natuvchining yukini [YETKAZISH_JOY] manzilidan [QABUL_JOY] manziliga yetkazib berish majburiyatini oladi. Jo'natuvchi esa transport xizmatlarini qabul qilib, belgilangan haqni to'lash majburiyatini oladi.` },
      { matn: `Har bir yuk tashish Tomonlar imzolagan Buyurtma (yo'llanma) asosida amalga oshiriladi. Buyurtmada yukнинг nomi, og'irligi, hajmi, qadoqlash turi, jo'natish va yetkazib berish manzillari, muddati ko'rsatiladi.` },
      { matn: `Shartnoma bo'yicha taxminiy transport xizmatlari umumiy qiymati [SUMMA] ([SUMMA_MATN]) so'mni tashkil etadi.` },
    ]},

    { sarlavha: "YUK TOPSHIRISH VA QABUL QILISH TARTIBI", bandlar: [
      { matn: `Jo'natuvchi yukni Tashuvchiga topshirishdan kamida 24 (yigirma to'rt) soat oldin yozma yoki elektron shaklda Buyurtma yuborishi shart. Buyurtmada yukнинг barcha xususiyatlari va maxsus tashish talablari ko'rsatilishi shart.` },
      { matn: `Yuk topshirishda tovar-transport hujjatlari (TTH) 3 (uch) nusxada rasmiylashtiriladi: biri Jo'natuvchida, biri Tashuvchida, biri Qabul qiluvchida qoladi. TTH imzolangandan so'ng yuk Tashuvchi mas'uliyatiga o'tadi.` },
      { matn: `Yuk yetkazib berilganda qabul qiluvchi hujjatlarni tekshirish va yukнинг tashqi ko'rinishini ko'zdan kechirish huquqiga ega. Shikoyatlar yukni qabul qilish vaqtida TTH ga kiritilishi kerak; keyinroq bildirish qabul qilinmaydi, yashirin nuqsonlar bundan mustasno.` },
      { matn: `Yashirin nuqsonlar aniqlanganda Jo'natuvchi yuk qabul qilinganidan keyin 3 (uch) kun ichida yozma da'vo taqdim etishi shart. Tashuvchi 10 (o'n) ish kuni ichida da'voni ko'rib chiqishi va javob berishi shart.` },
    ]},

    { sarlavha: "NARX VA TO'LOV TARTIBI", bandlar: [
      { matn: `Transport xizmatlarining narxi har bir Buyurtmaga ko'ra alohida belgilanadi va TTH da ko'rsatiladi. Yonilg'i narxining keskin o'zgarishi (20 foizdan ortiq) yoki yo'l yopilishi kabi fors-major holatlarda narx Tomonlarning yozma kelishuviga asosan qayta ko'rib chiqilishi mumkin.` },
      { matn: `To'lov yuk muvaffaqiyatli yetkazib berilgandan keyin 5 (besh) ish kuni ichida bank o'tkazma orqali amalga oshiriladi. Katta hajmdagi buyurtmalar uchun 30 (o'ttiz) foizgacha oldindan to'lov talab qilinishi mumkin.` },
      { matn: `To'lov kechiktirilganda Jo'natuvchi kechiktirilgan summadan har bir kechikkan kun uchun 0,5 (nol butun besh) foiz miqdorida penya to'laydi, lekin umumiy penya asosiy summaning 30 (o'ttiz) foizidan oshmasligi kerak.` },
    ]},

    { sarlavha: "TASHUVCHINING JAVOBGARLIGI", bandlar: [
      { matn: `Tashuvchi yukнинg yo'qolishi yoki shikastlanishi uchun TTH da ko'rsatilgan qiymat miqdorida to'liq javobgar hisoblanadi. Yuk sigortasi Jo'natuvchining talabiga ko'ra amalga oshiriladi va sug'urta xarajatlari alohida to'lanadi.` },
      { matn: `Tashuvchi yuk yetkazib berishning kechikishi uchun har bir kechikkan soat uchun transport xizmatlari summasining 0,1 (nol butun bir) foizi miqdorida penya to'laydi. Penyaning umumiy miqdori transport xizmatlari summasining 50 (ellik) foizidan oshmasligi kerak.` },
      { matn: `Tashuvchi quyidagi holatlarda javobgarlikdan ozod etiladi: fors-major holatlari; Jo'natuvchi tomonidan noto'g'ri deklaratsiya qilingan yuk xususiyatlari; yuk noto'g'ri qadoqlangan bo'lsa; yo'l harakati qoidalari buzilmagan holda tabiiy yo'qotishlar (quritish, bug'lanish va h.k.) doirasida.` },
    ]},

    { sarlavha: "NIZOLARNI HAL ETISH", bandlar: [
      { matn: `Shartnomadan kelib chiqadigan barcha nizolar muzokaralar yo'li bilan 15 (o'n besh) ish kuni ichida hal etiladi. Kelishuv bo'lmagan taqdirda nizo O'zbekiston Respublikasi [SHAHAR] shahri iqtisodiy sudiga topshiriladi. Pretenziyalar yozma shaklda taqdim etilib, 15 (o'n besh) ish kuni ichida ko'rib chiqilishi kerak.` },
    ]},

    { sarlavha: "SHARTNOMANING AMAL QILISH MUDDATI VA BEKOR QILISH TARTIBI", bandlar: [
      { matn: `Shartnoma Tomonlar tomonidan imzolangan kundan kuchga kiradi va [YIL_OXIRI] gacha amal qiladi. Shartnoma muddati tugagandan so'ng hech biri tugatish haqida kamida 30 (o'ttiz) kun oldin yozma xabar bermasa, Shartnoma keyingi bir yilga avtomatik uzaytirilgan hisoblanadi.` },
      { matn: `Shartnoma o'zbek tilida 2 (ikki) nusxada tuzilgan bo'lib, barcha nusxalar teng yuridik kuchga ega. Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasi Fuqarolik kodeksining 688–730-moddalari bilan tartibga solinadi.` },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 11. LIZING SHARTNOMASI
  //     org=[BUYURTMACHI]=Lizingberuvchi | cp=[IJROCHI]=Lizingoluvchi
  // ══════════════════════════════════════════════════════════════════════════
  lizing: (d) => ({ bolimlar: [

    { sarlavha: "SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "Lizingberuvchi") va [IJROCHI] (keyingi o'rinlarda "Lizingoluvchi") o'rtasida ushbu Moliyaviy lizing shartnomasi (keyingi o'rinlarda "Shartnoma") tuzildi.` },
      { matn: `Lizingberuvchi Lizingoluvchi ko'rsatgan [LIZING_OBEKT] (keyingi o'rinlarda "Lizing ob'ekti") ni sotib olib, Lizingoluvchiga vaqtincha egalik qilish va foydalanish uchun beradi. Lizing muddati tugagandan so'ng Lizingoluvchi Lizing ob'ektini to'liq sotib olish huquqiga ega.` },
      { matn: `Lizing ob'ektining umumiy qiymati [SUMMA] ([SUMMA_MATN]) so'mni tashkil etadi. Lizing to'lovlari jadvali ushbu Shartnomaga 1-ilova sifatida biriktiriladi va Shartnomaning ajralmas qismi hisoblanadi.` },
      { matn: `Lizing muddati [LIZING_MUDDAT] bo'lib, Lizing ob'ekti Lizingoluvchiga topshirilgan kundan boshlanadi. Muddат tugagandan so'ng Lizingoluvchi qoldiq qiymatni to'lab, mulk huquqini rasmiylashtirish huquqiga ega.` },
    ]},

    { sarlavha: "LIZING TO'LOVLARI TARTIBI", bandlar: [
      { matn: `Lizingoluvchi dastlabki badal sifatida Lizing ob'ekti qiymatining [BOSHLANGICH_BADAL] foizini Shartnoma imzolanganidan keyin 5 (besh) ish kuni ichida to'laydi. Qolgan summa lizing to'lovlari jadvaliga muvofiq oylik to'lovlar shaklida amalga oshiriladi.` },
      { matn: `Oylik lizing to'lovi asosiy qarz qismi, lizing foizi va sug'urta xarajatlarini o'z ichiga oladi. Oylik to'lov miqdori har oy 5-sanasiga qadar Lizingberuvchining hisob raqamiga o'tkaziladi.` },
      { matn: `Lizing to'lovlari kechiktirilganda Lizingoluvchi kechiktirilgan summadan har bir kechikkan kun uchun 0,05 (nol butun besh yuzdan besh) foiz miqdorida penya to'laydi. 30 (o'ttiz) kundan ortiq kechikish Lizingberuvchiga Shartnomani bir tomonlama bekor qilish va Lizing ob'ektini qaytarib olish huquqini beradi.` },
      { matn: `Lizing foiz stavkasi yillik [LIZING_FOIZ] foizni tashkil etadi va O'zbekiston Respublikasi Markaziy banki qayta moliyalashtirish stavkasi o'zgargan taqdirda Tomonlarning yozma kelishuviga asosan qayta ko'rib chiqilishi mumkin.` },
    ]},

    { sarlavha: "LIZING OB'EKTINI FOYDALANISH SHARTLARI", bandlar: [
      { matn: `Lizingoluvchi Lizing ob'ektidan faqat uning maqsadli vazifalari doirasida foydalanish, texnik xizmat ko'rsatish va to'g'ri saqlash majburiyatini oladi. Lizing ob'ektini uchinchi shaxslarga ijaraga berish, garovga qo'yish yoki boshqa har qanday shakldagi yuklama solish taqiqlanadi.` },
      { matn: `Lizingoluvchi Lizing ob'ektini texnik ko'rik va xizmat ko'rsatishga o'z vaqtida topshirish, sug'urtasini saqlash majburiyatini oladi. Sug'urta xarajatlari Lizingoluvchi tomonidan to'lanadi, sug'urta benefitsiari Lizingberuvchi hisoblanadi.` },
      { matn: `Lizing ob'ektida ro'y bergan har qanday shikast yoki yo'qolish Lizingberuvchiga darhol — 24 (yigirma to'rt) soat ichida xabar qilinishi shart. Lizingoluvchi Lizing ob'ektining yo'qolishi yoki to'liq shikastlanishi uchun uning to'liq bozor qiymatini qoplash majburiyatini oladi.` },
    ]},

    { sarlavha: "MULK HUQUQI VA LIZING MUDDATI TUGASHI", bandlar: [
      { matn: `Lizing muddati davomida Lizing ob'ektiga mulk huquqi Lizingberuvchida qoladi. Lizingoluvchi barcha lizing to'lovlarini to'liq to'laganidan keyin qoldiq qiymatni — [QOLDIQ_QIYMAT] so'mni to'lab, mulk huquqini o'z nomiga rasmiylashtirish huquqiga ega.` },
      { matn: `Lizingoluvchi muddatidan oldin to'liq to'lov qilish huquqiga ega, bunda qolgan muddatga to'g'ri keladigan lizing foizlari qaytariladi. Muddatdan oldin to'lash niyati kamida 30 (o'ttiz) kun oldin yozma shaklda bildirilishi kerak.` },
    ]},

    { sarlavha: "TOMONLARNING JAVOBGARLIGI VA NIZOLARNI HAL ETISH", bandlar: [
      { matn: `Lizingberuvchi Lizing ob'ektini o'z vaqtida yetkazib bermagan taqdirda Lizingoluvchi kechiktirilgan har bir kun uchun lizing ob'ekti qiymatining 0,05 foizi miqdorida penya talab qilish huquqiga ega.` },
      { matn: `Shartnomadan kelib chiqadigan barcha nizolar muzokaralar yo'li bilan 15 (o'n besh) ish kuni ichida hal etiladi. Kelishuv bo'lmagan taqdirda nizo O'zbekiston Respublikasi [SHAHAR] shahri iqtisodiy sudiga topshiriladi.` },
    ]},

    { sarlavha: "SHARTNOMANING AMAL QILISH MUDDATI", bandlar: [
      { matn: `Shartnoma Tomonlar tomonidan imzolangan kundan kuchga kiradi va barcha lizing to'lovlari to'liq amalga oshirilgunga hamda mulk huquqi rasmiylashtirilgunga qadar amal qiladi.` },
      { matn: `Shartnoma o'zbek tilida 2 (ikki) nusxada tuzilgan bo'lib, barcha nusxalar teng yuridik kuchga ega. Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasining "Lizing to'g'risida"gi Qonuni va Fuqarolik kodeksining 595–625-moddalari bilan tartibga solinadi.` },
    ]},

  ]}),

  // ══════════════════════════════════════════════════════════════════════════
  // 12. BOSHQA (UMUMIY) SHARTNOMA
  // ══════════════════════════════════════════════════════════════════════════
  boshqa: (d) => ({ bolimlar: [

    { sarlavha: "SHARTNOMA PREDMETI", bandlar: [
      { matn: `[BUYURTMACHI] (keyingi o'rinlarda "1-tomon") va [IJROCHI] (keyingi o'rinlarda "2-tomon") o'rtasida ushbu Shartnoma tuzildi.` },
      { matn: "Shartnoma predmeti: _____________________________. Tomonlar ushbu Shartnomada belgilangan huquq va majburiyatlarni qabul qiladilar." },
      { matn: `Shartnoma summasi: [SUMMA] ([SUMMA_MATN]) so'mni tashkil etadi. Yakuniy summa Tomonlarning kelishuviga asosan o'zgartirilishi mumkin.` },
    ]},

    { sarlavha: "NARX VA TO'LOV TARTIBI", bandlar: [
      { matn: "To'lov quyidagi tartibda amalga oshiriladi: Shartnoma imzolanganidan keyin ___ ish kuni ichida 30 (o'ttiz) foiz oldindan to'lov; qolgan summa Shartnoma predmeti bo'yicha majburiyatlar bajarilganidan keyin ___ ish kuni ichida." },
      { matn: "Barcha to'lovlar bank o'tkazma orqali O'zbekiston Respublikasi milliy valyutasida — so'mda amalga oshiriladi. To'lov sanasi to'lovni oluvchining bank hisobvarag'iga pul kelib tushgan sana hisoblanadi." },
      { matn: "Tomonlar Shartnoma summasini faqat yozma qo'shimcha kelishuv asosida o'zgartirish huquqiga ega." },
    ]},

    { sarlavha: "TOMONLARNING HUQUQ VA MAJBURIYATLARI", bandlar: [
      { matn: "1-tomon majburiyatlari: a) Shartnomada kelishilgan majburiyatlarni o'z vaqtida va lozim darajada bajarish; b) 2-tomonga Shartnoma predmeti bo'yicha kerakli ma'lumot va hujjatlarni taqdim etish; v) O'z majburiyatlarini bajarish imkonsiz bo'lsa, 2-tomonga darhol yozma xabar berish." },
      { matn: "2-tomon majburiyatlari: a) To'lovni belgilangan tartib va muddatda amalga oshirish; b) 1-tomon tomonidan taqdim etilgan natijalarni belgilangan muddatda qabul qilish yoki asosli rad etishni bildirish; v) Shartnomaning lozim darajada bajarilishi uchun zarur sharoitlarni ta'minlash." },
    ]},

    { sarlavha: "TOMONLARNING JAVOBGARLIGI", bandlar: [
      { matn: "Tomonlarning Shartnomada nazarda tutilgan majburiyatlarni bajarmasligi va/yoki lozim darajada bajarmasligi uchun javobgarligi O'zbekiston Respublikasining amaldagi qonunchiligi bilan belgilanadi." },
      { matn: "Majburiyatlarni kechiktirganlik uchun aybdor tomon kechiktirilgan summadan (yoki shartnoma summasidan) har bir kechikkan kun uchun 0,5 (nol butun besh) foiz miqdorida penya to'laydi, lekin penyaning umumiy miqdori Shartnoma summasining 50 (ellik) foizidan oshmasligi kerak." },
      { matn: "Shartnomani bajarmaslik yoki lozim darajada bajarmaslik natijasida ko'rilgan haqiqiy zarar penyani to'lashdan qat'i nazar qoplanishi shart." },
    ]},

    { sarlavha: "FORS-MAJOR", bandlar: [
      { matn: "Tomonlar o'z nazoratlaridan tashqarida bo'lgan fors-major holatlari — stixiyali ofatlar, harbiy harakatlar, epidemiyalar, hokimiyat organlarining majburiy aktlari oqibatida majburiyatlarini bajara olmaslik uchun javobgarlikdan ozod etiladi. Ta'sirlangan tomon boshqa tomonga 5 (besh) kalendar kuni ichida yozma xabar berishi shart; xabar bermaslik fors-major holatlariga havola qilish huquqini yo'qotishga olib keladi. Fors-major holatlari 3 (uch) oydan ortiq davom etsa, har bir tomon Shartnomani bir tomonlama bekor qilish huquqiga ega." },
    ]},

    { sarlavha: "NIZOLARNI HAL ETISH", bandlar: [
      { matn: "Shartnomadan kelib chiqadigan nizolar muzokaralar yo'li bilan 15 (o'n besh) ish kuni ichida hal etiladi; hal etilmagan nizolar O'zbekiston Respublikasi [SHAHAR] shahri iqtisodiy sudiga topshiriladi. Pretenziyalar yozma shaklda taqdim etilishi va 15 (o'n besh) ish kuni ichida ko'rib chiqilishi kerak." },
    ]},

    { sarlavha: "SHARTNOMANING AMAL QILISH MUDDATI VA BEKOR QILISH TARTIBI", bandlar: [
      { matn: `Shartnoma Tomonlar tomonidan imzolanganidan kuchga kiradi va [YIL_OXIRI] gacha amal qiladi. Shartnoma muddati tugagandan so'ng hech biri tugatish haqida kamida 30 (o'ttiz) kun oldin yozma xabar bermasa, Shartnoma keyingi bir yilga avtomatik uzaytirilgan hisoblanadi.` },
      { matn: "Shartnomaga o'zgartirishlar va qo'shimchalar faqat yozma shaklda — qo'shimcha kelishuvlar bilan rasmiylashtiriladi va ikki tomon imzolagandan keyingina kuchga kiradi." },
      { matn: "Shartnoma o'zbek tilida 2 (ikki) nusxada tuzilgan bo'lib, barcha nusxalar teng yuridik kuchga ega. Shartnomada tartibga solinmagan masalalar O'zbekiston Respublikasining amaldagi qonunchiligi bilan tartibga solinadi." },
    ]},

  ]}),
}

export function getStructure(type: string, data: Partial<TemplateData>): ContractStructure {
  const fn = STRUCTURES[type] || STRUCTURES['boshqa']
  const structure = fn(data)
  return {
    bolimlar: structure.bolimlar.map(b => ({
      sarlavha: b.sarlavha,
      bandlar: b.bandlar.map(band => ({
        matn: fill(band.matn, data)
      }))
    }))
  }
}

// org-label va cp-label: TYPE_LABELS[contract_type] → [orgLabel, cpLabel]
// orgLabel = foydalanuvchi tashkiloti roli, cpLabel = kontragent roli
const TYPE_LABELS: Record<string, [string, string]> = {
  oldi_sotdi: ['SOTUVCHI',        'XARIDOR'],
  xizmat:     ['BUYURTMACHI',     'IJROCHI'],
  ijara:      ['IJARABERUVCHI',   'IJARACHI'],
  pudrat:     ['BUYURTMACHI',     'PUDRATCHI'],
  qoshimcha:  ['1-TOMON',         '2-TOMON'],
  moliyaviy:  ['QARZ BERUVCHI',   'QARZ OLUVCHI'],
  daval:      ['BUYURTMACHI',     'QAYTA ISHLOVCHI'],
  xalqaro:    ['SELLER',          'BUYER'],
  agentlik:   ['PRINCIPAL',       'AGENT'],
  transport:  ['JO\'NATUVCHI',    'TASHUVCHI'],
  lizing:     ['LIZINGBERUVCHI',  'LIZINGOLUVCHI'],
  boshqa:     ['1-TOMON',         '2-TOMON'],
}

type SpecItemForText = {
  nomi: string
  birlik: string
  miqdori: number
  narxi: number
  qqs_foiz: string
  qqs_summa: number
  summa: number
}

function buildSpecTable(items: SpecItemForText[], number: string, date: string, org: any, cp: any): string {
  const lines: string[] = []
  const sep = '─'.repeat(110)
  const formatNum = (n: number) => n.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const pad = (s: string, w: number) => s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length)
  const rpad = (s: string, w: number) => s.length >= w ? s.slice(0, w) : ' '.repeat(w - s.length) + s

  lines.push('')
  lines.push('1-ILOVA')
  lines.push(`№${number}-sonli shartnomaga`)
  lines.push(`${formatDateUz(date)} dan`)
  lines.push('')
  lines.push('NARXNI KELISHISH PROTOKOLI')
  lines.push('')
  lines.push(sep)
  lines.push(
    pad('№', 4) +
    pad('Tovarlar (ish, xizmatlar) nomi', 32) +
    pad("O'lchov", 10) +
    rpad('Miqdori', 10) +
    rpad('Narxi', 16) +
    rpad('Yetkazib ber.', 18) +
    rpad('QQS%', 6) +
    rpad('QQS sum.', 16) +
    rpad('Jami (QQS bilan)', 20)
  )
  lines.push(sep)

  let totalBase = 0, totalQqs = 0, totalSum = 0
  items.forEach((item, i) => {
    const base = item.miqdori * item.narxi
    totalBase += base
    totalQqs += item.qqs_summa
    totalSum += item.summa
    lines.push(
      pad(String(i + 1), 4) +
      pad(item.nomi || '—', 32) +
      pad(item.birlik || 'dona', 10) +
      rpad(String(item.miqdori), 10) +
      rpad(formatNum(item.narxi), 16) +
      rpad(formatNum(base), 18) +
      rpad(item.qqs_foiz === 'siz' ? 'QQSsiz' : item.qqs_foiz + '%', 6) +
      rpad(formatNum(item.qqs_summa), 16) +
      rpad(formatNum(item.summa), 20)
    )
  })

  lines.push(sep)
  lines.push(
    pad('JAMI:', 56) +
    rpad(formatNum(totalBase), 18) +
    rpad('', 6) +
    rpad(formatNum(totalQqs), 16) +
    rpad(formatNum(totalSum), 20)
  )
  lines.push(sep)
  lines.push('')
  lines.push(`So'z bilan: ${numberToWords(Math.round(totalSum), 'uz')} so'm`)
  lines.push('')
  lines.push('Ushbu Protokol Shartnomaning ajralmas qismi hisoblanadi va ikki nusxada tuzilgan.')
  lines.push('')

  if (org) {
    lines.push('SOTUVCHI: ' + org.name)
    lines.push('INN: ' + (org.inn || '—') + '    MFO: ' + (org.mfo || '—'))
    lines.push('H/r: ' + (org.bank_account || '—'))
    lines.push('Rahbar: ' + (org.director_name || '—'))
    lines.push('_________________ / ' + (org.director_name || '___') + '        M.O.')
  }
  lines.push('')
  if (cp) {
    lines.push('XARIDOR: ' + cp.name)
    lines.push('INN: ' + (cp.inn || '—') + '    MFO: ' + (cp.mfo || '—'))
    lines.push('H/r: ' + (cp.bank_account || '—'))
    lines.push('Rahbar: ' + (cp.director_name || '—'))
    lines.push('_________________ / ' + (cp.director_name || '___') + '        M.O.')
  }
  return lines.join('\n')
}

export function structureToText(
  structure: ContractStructure,
  header: { type_name: string; number: string; date: string; city: string; org: any; cp: any; contract_type?: string; spec_items?: SpecItemForText[] }
): string {
  const lines: string[] = []
  lines.push(header.type_name.toUpperCase())
  lines.push(`№ ${header.number}`)
  lines.push('')
  lines.push(`${header.city} shahri${' '.repeat(40)}${formatDateUz(header.date)}`)
  lines.push('')

  structure.bolimlar.forEach((bolim, bi) => {
    lines.push(`${bi + 1}. ${bolim.sarlavha}`)
    lines.push('')
    bolim.bandlar.forEach((band, bdi) => {
      lines.push(`${bi + 1}.${bdi + 1}. ${band.matn}`)
      lines.push('')
    })
  })

  const [orgLabel, cpLabel] = TYPE_LABELS[header.contract_type || 'boshqa'] || ['1-TOMON', '2-TOMON']

  lines.push('TOMONLARNING REKVIZITLARI')
  lines.push('')
  if (header.org) {
    lines.push(`${orgLabel}: ${header.org.name}`)
    lines.push(`INN: ${header.org.inn || '—'}`)
    lines.push(`Rahbar: ${header.org.director_name || '—'}`)
    lines.push(`Bank: ${header.org.bank_name || '—'}`)
    lines.push(`H/r: ${header.org.bank_account || '—'}, MFO: ${header.org.mfo || '—'}`)
    lines.push(`Manzil: ${header.org.address || '—'}`)
  }
  lines.push('')
  if (header.cp) {
    lines.push(`${cpLabel}: ${header.cp.name}`)
    lines.push(`INN: ${header.cp.inn || '—'}`)
    lines.push(`Rahbar: ${header.cp.director_name || '—'}`)
    lines.push(`Bank: ${header.cp.bank_name || '—'}`)
    lines.push(`H/r: ${header.cp.bank_account || '—'}, MFO: ${header.cp.mfo || '—'}`)
    lines.push(`Manzil: ${header.cp.address || '—'}`)
  }
  lines.push('')
  lines.push('_________________ / ' + (header.org?.director_name || '___'))
  lines.push('        M.O.')
  lines.push('')
  lines.push('_________________ / ' + (header.cp?.director_name || '___'))
  lines.push('        M.O.')

  // 1-ILOVA: spec items mavjud bo'lsa
  if (header.spec_items && header.spec_items.length > 0) {
    lines.push(buildSpecTable(header.spec_items, header.number, header.date, header.org, header.cp))
  }

  return lines.join('\n')
}
