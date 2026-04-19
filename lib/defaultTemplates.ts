import {
  OLDI_SOTDI_STANDART_OZ, OLDI_SOTDI_YETKAZIB_OZ,
  XIZMAT_STANDART_OZ, XIZMAT_IT_OZ, XIZMAT_KONSALTING_OZ,
  IJARA_KOCHMAS_MULK_OZ, IJARA_TEXNIKA_OZ, IJARA_TEKIN_OZ,
  PUDRAT_QURILISH_OZ, QOSHIMCHA_STANDART_OZ,
  MOLIYAVIY_FOIZSIZ_OZ, MOLIYAVIY_FOIZLI_OZ,
  DAVAL_STANDART_OZ, XALQARO_SAVDO_OZ,
  HAMKORLIK_SHARTNOMA_OZ, VOSITACHILIK_SHARTNOMA_OZ,
  DEFAULT_TEMPLATE_NAMES_OZ,
} from './defaultTemplates.oz'
import {
  OLDI_SOTDI_STANDART_RU, OLDI_SOTDI_YETKAZIB_RU,
  XIZMAT_STANDART_RU, XIZMAT_IT_RU, XIZMAT_KONSALTING_RU,
  IJARA_KOCHMAS_MULK_RU, IJARA_TEXNIKA_RU, IJARA_TEKIN_RU,
  PUDRAT_QURILISH_RU, QOSHIMCHA_STANDART_RU,
  MOLIYAVIY_FOIZSIZ_RU, MOLIYAVIY_FOIZLI_RU,
  DAVAL_STANDART_RU, XALQARO_SAVDO_RU,
  HAMKORLIK_SHARTNOMA_RU, VOSITACHILIK_SHARTNOMA_RU,
  DEFAULT_TEMPLATE_NAMES_RU,
} from './defaultTemplates.ru'

export type AppTemplate = {
  id: string
  type: string
  name: string
  description: string
  content: string
  isDefault: boolean
  icon: string
  tags: string[]
  name_oz?: string
  name_ru?: string
  description_oz?: string
  description_ru?: string
  content_oz?: string
  content_ru?: string
}

export function getTplField(
  tpl: AppTemplate,
  field: 'name' | 'description' | 'content',
  lang: string,
): string {
  if (lang === 'oz') return (tpl[`${field}_oz` as keyof AppTemplate] as string) || tpl[field]
  if (lang === 'ru') return (tpl[`${field}_ru` as keyof AppTemplate] as string) || tpl[field]
  return tpl[field]
}

// ─── OLDI-SOTDI ──────────────────────────────────────────────────────────────

const OLDI_SOTDI_STANDART = `OLDI-SOTDI SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Xaridor" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Sotuvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, O'zbekiston Respublikasi Fuqarolik Kodeksining 386-410-moddalari asosida quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Sotuvchi Xaridorga tovarlarni (keyingi o'rinlarda "Tovar" deb yuritiladi) sotishi, Xaridor esa ushbu tovarlarni qabul qilib olishi va to'lashi majburiyatini oladi.
1.2. Tovarning nomi, sifat ko'rsatkichlari, miqdori va narxi ushbu shartnomaga ilova qilinadigan Spesifikatsiyada ko'rsatiladi va shartnomaning ajralmas qismi hisoblanadi.
1.3. Tovar sifati amaldagi O'zDSt standartlari va texnik shartlar talablariga muvofiq bo'lishi kerak.

2. TOVAR NARXI VA UMUMIY SUMMA

2.1. Ushbu shartnoma bo'yicha tovarlarning umumiy qiymati {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
2.2. Tovar narxi O'zbekiston Respublikasi milliy valyutasida — so'mda belgilangan va shartnoma amal qilish davomida o'zgartirilmaydi.
2.3. QQS amaldagi soliq qonunchiligiga muvofiq hisoblab qo'shiladi va alohida ko'rsatiladi.

3. TO'LOV TARTIBI

3.1. Xaridor tovarni qabul qilib olgandan so'ng 10 (o'n) bank ishi kuni ichida to'lovni to'liq amalga oshiradi.
3.2. To'lov naqd pulsiz bank o'tkazma yo'li bilan amalga oshiriladi.
3.3. To'lov sanasi — Sotuvchining bank hisobvarag'iga pul tushgan sana hisoblanadi.
3.4. Tomonlar kelishgan holda avans to'lov joriy qilinishi mumkin; bunda avans miqdori qo'shimcha protokol orqali belgilanadi.

4. TOVARNI YETKAZIB BERISH TARTIBI

4.1. Tovarni yetkazib berish muddati: {{YETKAZISH_MUDDAT}}.
4.2. Tovar yetkazib berish joyi: {{YETKAZISH_JOY}}.
4.3. Tovarni saqlash va tashish xarajatlari Sotuvchi tomonidan qoplanadi (boshqacha kelishuv bo'lmasa).
4.4. Tovar topshirilganda Xaridor tovar-pul hujjatlariga (o'tkazish-qabul qilish dalolatnomasi, faktura, yuk xati) imzo qo'yadi.
4.5. Tovar bilan birga sifat sertifikati, texnik pasport va ishlatish yo'riqnomasi (agar mavjud bo'lsa) taqdim etiladi.

5. TOMONLARNING HUQUQ VA MAJBURIYATLARI

5.1. Sotuvchi majburiyatlari:
— belgilangan muddatda va sifatda tovarni yetkazib berish;
— tovar bilan birga barcha kerakli hujjatlarni taqdim etish;
— tovar nuqsonli bo'lsa, uni almashtirish yoki narxini qaytarish;
— soliq hujjatlarini o'z vaqtida taqdim etish.

5.2. Xaridor majburiyatlari:
— tovarni belgilangan muddatda qabul qilish;
— to'lovni o'z vaqtida amalga oshirish;
— tovarni qabul qilishda sifatini tekshirib, nuqsonlar bo'lsa darhol xabar berish;
— tovarni qabul qilgandan so'ng tegishli sharoitda saqlash.

5.3. Xaridorning huquqlari:
— belgilangan muddatda tovar yetkazib berilmasa, buyurtmadan voz kechib to'langan avansni qaytarib olish;
— nuqsonli tovar o'rniga yangi tovar talab qilish yoki narxni kamaytirish talabi qo'yish.

6. TOVAR SIFATI VA KAFOLAT

6.1. Sotuvchi tovar sifatiga 12 (o'n ikki) oy muddatga kafolat beradi.
6.2. Kafolat muddati tovar Xaridorga rasman topshirilgan kundan boshlanadi.
6.3. Kafolat muddatida yuzaga kelgan nuqsonlar Sotuvchi tomonidan bepul bartaraf etiladi.
6.4. Xaridorning noto'g'ri foydalanishi natijasida yuzaga kelgan nuqsonlarga kafolat tatbiq etilmaydi.

7. MAS'ULIYAT

7.1. Tomonlar ushbu shartnoma bo'yicha o'z majburiyatlarini bajarmaslik uchun amaldagi qonunchilikka muvofiq javobgar bo'ladi.
7.2. To'lovni kechiktirganlik uchun Xaridor har kechiktirilgan kun uchun kechiktirilgan summaning 0,1% miqdorida penya to'laydi. Penya umumiy summasining 10% dan oshmasligi kerak.
7.3. Tovar yetkazib berishni kechiktirganlik uchun Sotuvchi har kechiktirilgan kun uchun tovar qiymatining 0,1% miqdorida penya to'laydi.
7.4. Shartnomadan asossiz bir tomonlama voz kechish uchun javobgar tomon shartnoma summasining 5% miqdorida jarima to'laydi.

8. FORS-MAJOR HOLATLARI

8.1. Tomonlar o'z nazoratidan tashqarida bo'lgan holatlar (tabiiy ofat, urush, epidemiya, davlat organlari qarorlari va boshqalar) natijasida majburiyatlarni bajara olmaslik uchun javobgar emas.
8.2. Fors-major holat yuzaga kelganda, ta'sirlangan tomon boshqa tomonga 5 (besh) kalendar kuni ichida yozma xabar berishi va tasdiqlash hujjatini taqdim etishi shart.
8.3. Fors-major holat 30 (o'ttiz) kundan ko'proq davom etsa, tomonlardan biri shartnomani majburiyatsiz bekor qilish huquqiga ega.

9. NIZOLARNI HAL ETISH

9.1. Nizolar birinchi navbatda muzokaralar yo'li bilan hal etiladi.
9.2. Agar muzokaralar 30 (o'ttiz) kun ichida natija bermasa, nizolar O'zbekiston Respublikasi Iqtisodiy sudlarida ko'rib chiqiladi.
9.3. Ushbu shartnomaga O'zbekiston Respublikasining amaldagi qonunchiligi tatbiq etiladi.

10. SHARTNOMANING AMAL QILISH MUDDATI

10.1. Ushbu shartnoma tomonlar imzolagan kundan kuchga kiradi va majburiyatlar to'liq bajarilgunga qadar amal qiladi.
10.2. Tomonlardan biri shartnomani muddatidan oldin bekor qilmoqchi bo'lsa, boshqa tomonga kamida 30 (o'ttiz) kun oldin yozma xabar berishi kerak.

11. BOSHQA SHARTLAR

11.1. Ushbu shartnomaga o'zgartirishlar faqat ikki tomonning yozma kelishuviga binoan kiritiladi.
11.2. Ushbu shartnoma ikki nusxada tuzilgan, har bir tomon uchun bir nusxadan; ikkala nusxa teng yuridik kuchga ega.
11.3. Shartnomaga ilova: Spesifikatsiya (1-ilova) — tovarlar ro'yxati, miqdori va narxi.

12. TOMONLARNING REKVIZITLARI

XARIDOR:                                    SOTUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const OLDI_SOTDI_YETKAZIB = `TOVAR YETKAZIB BERISH SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Xaridor" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Yetkazib beruvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, O'zbekiston Respublikasi Fuqarolik Kodeksining 416-425-moddalari asosida quyidagi tovar yetkazib berish shartnomasi tuzildi:

1. SHARTNOMA PREDMETI

1.1. Yetkazib beruvchi Xaridorga ushbu shartnomada belgilangan tovarlarni muntazam ravishda yetkazib berish majburiyatini oladi.
1.2. Yetkazib beriladigan tovarlarning nomi, miqdori, narxi va yetkazib berish grafigi ushbu shartnomaga ilova qilinadigan Spesifikatsiyada belgilanadi.
1.3. Tovar sifati amaldagi standartlar va texnik shartlarga muvofiq bo'lishi kerak.

2. NARX VA TO'LOV TARTIBI

2.1. Ushbu shartnoma bo'yicha tovarlarning umumiy qiymati {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
2.2. Narxlar shartnoma amal qilish davomida o'zgartirilmaydi. Narxlarni o'zgartirish uchun tomonlar yozma kelishuviga ehtiyoj bor.
2.3. To'lov har bir partiya yetkazib berilganidan keyin 5 (besh) bank ishi kuni ichida bank o'tkazma orqali amalga oshiriladi.
2.4. Tomonlar kelishgan holda avans asosida ishlash ham mumkin.

3. YETKAZIB BERISH TARTIBI VA MUDDATI

3.1. Tovarlar partiyalar bo'lib yetkazib beriladi. Har bir partiya miqdori va yetkazib berish sanasi tomonlarning yozma (jumladan, elektron) kelishuvi bilan belgilanadi.
3.2. Har bir partiya uchun yetkazib berish muddati: {{YETKAZISH_MUDDAT}}.
3.3. Tovar yetkazib berish joyi: {{YETKAZISH_JOY}}. Tashish xarajatlari Yetkazib beruvchi tomonidan qoplanadi.
3.4. Har bir partiya topshirilganda qabul-topshiriq dalolatnomasi yoki tovar-faktura imzolanadi.

4. TOMONLARNING MAJBURIYATLARI

4.1. Yetkazib beruvchi majburiyatlari:
— tovarlarni kelishilgan sifat, miqdor va muddatda yetkazib berish;
— har bir partiya bilan birga barcha kerakli hujjatlarni (sertifikat, sifat pasporti) taqdim etish;
— nuqsonli tovar o'rniga 5 ish kuni ichida bepul almashtirish.

4.2. Xaridor majburiyatlari:
— har bir partiyaga buyurtma berishda kamida 3 (uch) ish kuni oldin yozma xabar berish;
— tovarni qabul qilganda sifat va miqdorini tekshirish;
— to'lovni belgilangan muddatda amalga oshirish.

5. KAFOLAT VA MAS'ULIYAT

5.1. Har bir partiya uchun kafolat muddati topshirilgan kundan 6 (olti) oy.
5.2. To'lovni kechiktirganlik uchun Xaridor kechiktirilgan summaning kuniga 0,1% penya to'laydi.
5.3. Tovar yetkazib berishni kechiktirganlik uchun Yetkazib beruvchi ham xuddi shunday penya to'laydi.

6. FORS-MAJOR, NIZOLARNI HAL ETISH VA AMAL QILISH MUDDATI

6.1. Fors-major holatlari: tabiiy ofat, urush, epidemiya va davlat organlari to'siqlovchi qarorlari. Xabar berish muddati — 5 kun ichida.
6.2. Nizolar muzokara orqali, hal bo'lmasa O'zbekiston Respublikasi Iqtisodiy sudlarida ko'rib chiqiladi.
6.3. Shartnoma imzolangan kundan kuchga kiradi va 1 (bir) yil davomida amal qiladi. Tomonlardan biri e'tiroz bildirmasa, shartnoma har yili avtomatik tarzda uzaytiriladi.

7. TOMONLARNING REKVIZITLARI

XARIDOR:                                    YETKAZIB BERUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── XIZMAT KO'RSATISH ────────────────────────────────────────────────────────

const XIZMAT_STANDART = `XIZMAT KO'RSATISH SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

Ushbu Xizmat ko'rsatish shartnomasi (keyingi o'rinlarda "Shartnoma") quyidagi tomonlar o'rtasida tuzildi:

{{BUYURTMACHI}}, O'zbekiston Respublikasi qonunchiligiga muvofiq tashkil topgan yuridik shaxs, INN: {{BUYURTMACHI_INN}}, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi (keyingi o'rinlarda "Buyurtmachi"), bir tomondan, va

{{IJROCHI}}, O'zbekiston Respublikasi qonunchiligiga muvofiq tashkil topgan yuridik shaxs, INN: {{IJROCHI_INN}}, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi (keyingi o'rinlarda "Ijrochi"), ikkinchi tomondan,

birgalikda "Tomonlar" deb ataladi, O'zbekiston Respublikasi Fuqarolik Kodeksining 703-730-moddalari hamda amaldagi qonunchilik talablariga asosan quyidagilar to'g'risida ushbu Shartnomani tuzdilar:

1. ATAMALAR VA TA'RIFLAR

1.1. "Xizmatlar" — Shartnomaning 2-bandida ko'rsatilgan va Ijrochi tomonidan Buyurtmachiga ko'rsatiladigan ishlar majmuasi.
1.2. "Natijalar" — Xizmatlar ko'rsatilishi natijasida yaratilgan, o'tkazilgan yoki taqdim etilgan har qanday moddiy yoki nomoddiy mahsulot.
1.3. "Maxfiy ma'lumot" — Tomonlar o'rtasida "maxfiy" deb belgilangan yoxud mohiyatiga ko'ra maxfiy bo'lgan barcha axborot.
1.4. "Ish kuni" — O'zbekiston Respublikasida rasmiy dam olish va bayram kunlari bo'lmagan odatdagi ish kunlari.

2. SHARTNOMA PREDMETI

2.1. Ijrochi Buyurtmachiga ushbu Shartnoma va unga ilova qilingan Texnik topshiriq asosida quyidagi xizmatlarni ko'rsatadi: {{XIZMAT_TAVSIF}} (keyingi o'rinlarda "Xizmatlar").
2.2. Xizmatlarning batafsil tavsifi, hajmi, sifat talablari va muddatlari Shartnomaga 1-ilova sifatida biriktiriladi va uning ajralmas qismi hisoblanadi.
2.3. Ijrochi xizmatlarni shaxsan yoki o'z nazoratidagi subpudratchilar orqali ko'rsatishga haqli. Subpudratchilar uchun Ijrochi to'liq javobgarlikni saqlaydi.
2.4. Xizmatlar O'zbekiston Respublikasining amaldagi qonunchilik va normativ-texnik hujjatlar talablariga muvofiq ko'rsatiladi.

3. XIZMAT KO'RSATISH MUDDATI

3.1. Xizmat ko'rsatish boshlanish sanasi: {{XIZMAT_BOSHLANISH}}.
3.2. Xizmat ko'rsatish yakunlanish muddati: {{XIZMAT_TUGASH}}.
3.3. Kechikish xavfi aniqlangan taqdirda Ijrochi Buyurtmachiga kamida 5 (besh) ish kuni oldin yozma ravishda xabar beradi, sabablarini ko'rsatadi va yangi muddatni kelishadi.
3.4. Tomonlarning yozma kelishuviga asosan xizmat ko'rsatish muddati o'zgartirilishi mumkin.

4. XIZMAT NARXI VA TO'LOV TARTIBI

4.1. Ko'rsatiladigan Xizmatlar uchun umumiy to'lov miqdori {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi. QQS O'zbekiston Respublikasining amaldagi soliq qonunchiligiga muvofiq alohida hisoblab qo'shiladi.
4.2. To'lov tartibi: {{XIZMAT_TOLOV}}.
4.3. Ijrochi har bir to'lov bosqichi uchun qonun talablariga muvofiq hisob-faktura taqdim etadi. Buyurtmachi hisob-fakturani olgandan so'ng 5 (besh) ish kuni ichida to'lovni amalga oshiradi.
4.4. Barcha to'lovlar O'zbekiston Respublikasi milliy valyutasida — so'mda bank o'tkazma yo'li bilan amalga oshiriladi.
4.5. To'lov sanasi — Ijrochining bank hisobvarag'iga mablag' tushgan sana hisoblanadi.
4.6. Xizmatlar hajmini kengaytirish yoki qisqartirish zarur bo'lganda, tomonlar yozma qo'shimcha kelishuv tuzadi.

5. XIZMATLARNI QABUL QILISH TARTIBI

5.1. Ijrochi Xizmatlarni ko'rsatib bo'lgach yoki belgilangan bosqich yakunida Buyurtmachiga qabul-topshiriq dalolatnomasini (ikki nusxada) taqdim etadi.
5.2. Buyurtmachi dalolatnomani olgandan so'ng 5 (besh) ish kuni ichida:
— dalolatnomani imzolaydi va bir nusxasini Ijrochiga qaytaradi; yoki
— aniq ko'rsatilgan kamchiliklar ro'yxatini o'z ichiga olgan asosli yozma rad etish xatini yuboradi.
5.3. Belgilangan 5 kunlik muddat ichida Buyurtmachi hech qanday javob bermasa, Xizmatlar to'liq va belgilangan sifatda qabul qilingan hisoblanadi.
5.4. Kamchiliklar aniqlangan taqdirda Ijrochi ularni 10 (o'n) ish kuni ichida o'z hisobidan bartaraf etadi va qayta qabul-topshiriq dalolatnomasini taqdim etadi.
5.5. Asossiz yoki qasddan kechiktirilgan rad etish qabul qilinmagan hisoblanmaydi va Ijrochining to'lov talab qilish huquqiga ta'sir qilmaydi.

6. TOMONLARNING HUQUQ VA MAJBURIYATLARI

6.1. Ijrochi majburiyatlari:
a) Xizmatlarni belgilangan sifat, hajm va muddatda ko'rsatish;
b) Xizmat ko'rsatish jarayonida Buyurtmachining qonuniy ko'rsatmalariga rioya qilish;
c) Xavfsizlik va mehnat qonunchiligi talablariga muvofiq faoliyat yuritish;
d) Shartnomani bajarish uchun zarur litsenziya, sertifikat va ruxsatnomalarning amal qilishini ta'minlash;
e) Ko'rsatilgan Xizmatlar natijalari uchun kafolatli javobgarlikni o'z zimmasiga olish;
f) Buyurtmachi so'ragan holda xizmat ko'rsatish davomida progress to'g'risida hisobot berish.

6.2. Buyurtmachi majburiyatlari:
a) Ijrochi uchun xizmat ko'rsatishga zarur shart-sharoit, ma'lumotlar va kirish imkoniyatini ta'minlash;
b) Zarur hujjatlar, texnik topshiriq va ma'lumotlarni o'z vaqtida yetkazish;
c) To'lovni belgilangan muddatda to'liq amalga oshirish;
d) Xizmatlarni o'z vaqtida qabul qilib dalolatnomani imzolash;
e) Ijrochining ish jarayoniga asossiz aralashmaslik.

7. INTELLEKTUAL MULK

7.1. Ushbu Shartnoma asosida Ijrochi tomonidan maxsus yaratilgan Natijalarga oid barcha intellektual mulk huquqlari to'lov to'liq amalga oshirilgandan so'ng Buyurtmachiga o'tadi.
7.2. Ijrochi Shartnomadan oldin mavjud bo'lgan va xizmatda foydalanilgan o'z xususiy metodologiyasi, vositalari va bilim bazasini saqlaydi — ular Buyurtmachiga o'tmaydi.
7.3. Ijrochi Buyurtmachining roziligi bilan loyihani o'z portfoliosida umumiy ma'lumot sifatida keltirishi mumkin, biroq maxfiy ma'lumotlarni oshkor etmaslik majburiyati saqlanadi.

8. KONFIDENSIALLIK

8.1. Har bir tomon Shartnoma doirasida ikkinchi tomondan olgan Maxfiy ma'lumotni:
a) faqat ushbu Shartnomani bajarish maqsadida ishlatadi;
b) uchinchi shaxslarga, ommaga yoki OAVga oshkor etmaydi;
c) o'z maxfiy ma'lumotlariga ko'rsatilgan darajadagi ehtiyotkorlik bilan muhofaza qiladi.
8.2. Ushbu majburiyatlar qonun talabiga ko'ra, sudning buyrug'i asosida yoki umumiy foydalanishdagi ma'lumotlarga tatbiq etilmaydi.
8.3. Konfidensiallik majburiyati Shartnoma tugaganidan yoki bekor qilinganidan so'ng 3 (uch) yil davomida kuchda qoladi.

9. MAS'ULIYAT VA SANKSIYALAR

9.1. To'lov muddatini kechiktirganlik uchun Buyurtmachi kechiktirilgan summaning har bir kechikish kuni uchun 0,1% (nol butun bir foiz) miqdorida penya to'laydi.
9.2. Xizmat ko'rsatish muddatini kechiktirganlik uchun Ijrochi kechiktirilgan bosqich summasining har bir kechikish kuni uchun 0,1% miqdorida penya to'laydi.
9.3. Shartnomani asossiz bir tomonlama bekor qilgan tomon Shartnoma summasining 10% (o'n foiz) miqdorida jarima to'laydi.
9.4. Ushbu bandda ko'rsatilgan sanksiyalarning umumiy miqdori Shartnoma summasining 20% dan oshmasligi kerak.
9.5. Tomonlarning javobgarligi faqat to'g'ridan-to'g'ri ko'rilgan zararlarga nisbatan qo'llaniladi; bilvosita yoki foyda yo'qotilishi uchun javobgarlik Shartnoma summasidan oshib ketmaydi.

10. SHARTNOMANI BEKOR QILISH

10.1. Tomonlardan biri Shartnomani muddatidan oldin bekor qilmoqchi bo'lsa, boshqa tomonga kamida 30 (o'ttiz) kun oldin yozma ogohlantirish yuboradi.
10.2. Buyurtmachi quyidagi holatlarda Shartnomani darhol bekor qilish huquqiga ega:
— Ijrochi xizmatlarni kelishilgan sifatda ko'rsatmay 2 (ikki) martadan ko'proq kechiktirsa;
— Ijrochi to'liq to'lovni olgandan so'ng xizmat ko'rsatishdan bosh tortsa;
— Ijrochi bankrot e'lon qilinsa yoki faoliyati to'xtatilsa.
10.3. Ijrochi quyidagi holatlarda Shartnomani darhol bekor qilish huquqiga ega:
— Buyurtmachi to'lovni 2 (ikki) to'lov muddatidan ortiq kechiktirsa;
— Buyurtmachi xizmat ko'rsatish uchun zarur shart-sharoitlarni yaratishdan bosh tortsa.
10.4. Bekor qilish sababidan qat'i nazar, bajarilgan xizmatlar uchun to'lov to'liq amalga oshiriladi.

11. FORS-MAJOR

11.1. Tomonlar nazoratidan tashqaridagi va oldini olish imkoni bo'lmagan hodisalar — tabiiy ofatlar, epidemiyalar, urushlar, davlat organlarining qarorlari, ommaviy tartibsizliklar — fors-major sifatida tan olinadi.
11.2. Fors-major holatini boshidan kechirgan tomon boshqa tomonga 5 (besh) kun ichida yozma ravishda xabar beradi va vakolatli organ tomonidan berilgan tasdiqlash hujjatini taqdim etadi.
11.3. Fors-major holati 60 (oltmish) kundan ortiq davom etsa, har qaysi tomon Shartnomani jarima va sanksiyalarsiz bekor qilish huquqiga ega. Bajarilgan xizmatlar uchun to'lov qilinadi.

12. NIZOLARNI HAL ETISH VA QONUNCHILIK

12.1. Ushbu Shartnomadan kelib chiqadigan har qanday nizo, birinchi navbatda, 30 (o'ttiz) kun ichida tomonlar o'rtasidagi muzokaralar orqali hal etiladi.
12.2. Muzokara yo'li bilan hal bo'lmagan nizolar O'zbekiston Respublikasining vakolatli sudlarida ko'rib chiqiladi.
12.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari tatbiq etiladi.

13. YAKUNIY QOIDALAR

13.1. Ushbu Shartnoma va unga ilovalar tomonlar o'rtasidagi to'liq kelishuvni tashkil etadi hamda avvalgi barcha yozma va og'zaki kelishuvlarni o'z ichiga oladi.
13.2. Shartnomaga har qanday o'zgartirish yoki qo'shimcha faqat ikkala tomonning vakolatli vakillari imzolagan yozma qo'shimcha kelishuv bilan kuchga kiradi.
13.3. Shartnomaning biron-bir bandining haqiqiy emas deb topilishi boshqa bandlarning yuridik kuchini yo'qotmaydi.
13.4. Shartnoma ikki nusxada tuzilgan bo'lib, har bir tomon uchun bittadan beriladi; ikkala nusxa ham teng yuridik kuchga ega.

14. TOMONLARNING REKVIZITLARI VA IMZOLARI

BUYURTMACHI:                                IJROCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const XIZMAT_IT = `IT XIZMATLAR SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

Ushbu IT Xizmatlar shartnomasi (keyingi o'rinlarda "Shartnoma") quyidagi tomonlar o'rtasida tuzildi:

{{BUYURTMACHI}}, O'zbekiston Respublikasi qonunchiligiga muvofiq tashkil topgan yuridik shaxs, INN: {{BUYURTMACHI_INN}}, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi (keyingi o'rinlarda "Buyurtmachi"), bir tomondan, va

{{IJROCHI}}, O'zbekiston Respublikasi qonunchiligiga muvofiq tashkil topgan yuridik shaxs, INN: {{IJROCHI_INN}}, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi (keyingi o'rinlarda "Ijrochi"), ikkinchi tomondan,

birgalikda "Tomonlar" deb ataladi, O'zbekiston Respublikasi Fuqarolik Kodeksining 703-730-moddalari, "Mualliflik huquqi va turdosh huquqlar to'g'risida"gi Qonun hamda amaldagi qonunchilikka asosan ushbu Shartnomani tuzdilar:

1. ATAMALAR VA TA'RIFLAR

1.1. "Texnik topshiriq" — Shartnomaga 1-ilova sifatida biriktirilgan, bajarilishi lozim bo'lgan barcha funksional, texnik va sifat talablarini belgilovchi hujjat.
1.2. "Dasturiy mahsulot" — Ijrochi tomonidan ushbu Shartnoma asosida yaratilgan dasturiy kod, interfeys, ma'lumotlar bazasi, API va boshqa raqamli ob'ektlar majmuasi.
1.3. "Manba kodi" (Source code) — Dasturiy mahsulotni tuzgan dasturlash tillari orqali yozilgan, to'liq o'qiladigan va tahrir qilinadigan kod to'plami.
1.4. "Kafolat muddati" — Dasturiy mahsulot yakuniy qabul qilinganidan keyin Ijrochi aniqlangan nosozliklarni bepul bartaraf etish majburiyati amal qiladigan davr.
1.5. "Nosozlik" (Bug) — Dasturiy mahsulotning Texnik topshiriqda belgilangan talablardan og'ishi yoki noto'g'ri ishlashi.

2. SHARTNOMA PREDMETI

2.1. Ijrochi Buyurtmachiga Texnik topshiriq (1-ilova) asosida quyidagi IT xizmatlarni ko'rsatadi: {{XIZMAT_TAVSIF}}.
2.2. Xizmatlar quyidagilarni o'z ichiga olishi mumkin:
a) veb-ilova, mobil ilova, ERP/CRM tizimi yoki boshqa dasturiy ta'minot ishlab chiqish;
b) mavjud tizimni modernizatsiya qilish, integratsiya va API ishlab chiqish;
c) foydalanuvchi interfeysi (UI/UX) va dizayn;
d) texnik hujjatlashtirish — foydalanuvchi qo'llanmasi va texnik spesifikatsiya;
e) sinov (testing), topshirish va ishlatishga kiritish (deployment).
2.3. Texnik topshiriqda ko'rsatilmagan barcha qo'shimcha ishlar alohida yozma kelishuv va to'lov asosida bajariladi.
2.4. Ijrochi ishlarni o'z xodimlari yoki mas'ul subpudratchilar orqali amalga oshirishga haqli; uchinchi shaxslarga topshirilgan ishlar uchun Ijrochi to'liq javobgar qoladi.

3. LOYIHANI AMALGA OSHIRISH BOSQICHLARI VA MUDDATLARI

3.1. Ishlar quyidagi bosqichlarda amalga oshiriladi:
— 1-bosqich: Tahlil, Texnik topshiriqni tasdiqlash, prototip — boshlanish: {{XIZMAT_BOSHLANISH}};
— 2-bosqich: Asosiy ishlab chiqish va oraliq nazorat;
— 3-bosqich: Sinov, nosozliklarni bartaraf etish, topshirish va hujjatlashtirish — yakunlanish: {{XIZMAT_TUGASH}}.
3.2. Har bir bosqichning aniq muddati va kutilgan natijalari Texnik topshiriqda (1-ilovada) belgilanadi.
3.3. Kechikish xavfi aniqlangan taqdirda Ijrochi Buyurtmachiga 3 (uch) ish kuni oldin yozma xabar beradi, sabablarini ko'rsatadi va tomonlar yangi muddatni yozma kelishadi.

4. NARX VA TO'LOV TARTIBI

4.1. Jami Shartnoma summasi: {{SUMMA}} ({{SUMMA_MATN}}) so'm. QQS amaldagi soliq qonunchiligiga muvofiq alohida hisoblab qo'shiladi.
4.2. To'lov quyidagi bosqichlarda amalga oshiriladi:
— 1-to'lov (avans): Shartnoma imzolanganidan so'ng 3 (uch) ish kuni ichida — jami summaning 30%;
— 2-to'lov: 2-bosqich qabul-topshiriq aktiga asosan — jami summaning 40%;
— 3-to'lov (yakuniy): Yakuniy qabul-topshiriq aktiga asosan — jami summaning 30%.
4.3. Ijrochi har bir to'lov bosqichi uchun qonunchilik talablariga muvofiq hisob-faktura taqdim etadi.
4.4. Barcha to'lovlar bank o'tkazma orqali O'zbekiston so'mida amalga oshiriladi.
4.5. Buyurtmachi tomonidan tasdiqlangan qo'shimcha ish buyurtmalari alohida hisob-faktura asosida to'lanadi.

5. QABUL QILISH TARTIBI

5.1. Har bir bosqich yakunida Ijrochi Buyurtmachiga quyidagi hujjatlarni taqdim etadi:
a) qabul-topshiriq dalolatnomasini (ikki nusxada);
b) bosqich doirasidagi barcha Natijalar va tegishli texnik hujjatlar;
c) Manba kodining so'nggi versiyasi (1-ilovada belgilangan bo'lsa).
5.2. Buyurtmachi hujjatlarni olgandan so'ng 7 (yetti) ish kuni ichida sinov o'tkazib:
— dalolatnomani imzolaydi; yoki
— kamchiliklar ro'yxatini aniq texnik tavsif bilan yozma ravishda bildiradi.
5.3. 7 kunlik muddat ichida Buyurtmachi hech qanday javob bermasa, bosqich to'liq qabul qilingan hisoblanadi.
5.4. Ijrochi aniqlangan kamchiliklar ro'yxatini olgandan so'ng 10 (o'n) ish kuni ichida bartaraf etadi va qaytadan qabul uchun taqdim etadi.

6. KAFOLAT MUDDATI VA TEXNIK QO'LLAB-QUVVATLASH

6.1. Yakuniy qabul-topshiriq dalolatnomasiga imzo qo'yilganidan so'ng 6 (olti) oy mobaynida Ijrochi Dasturiy mahsulotda aniqlangan nosozliklarni bepul bartaraf etadi.
6.2. Kafolat muddati ichida nosozliklarni bartaraf etish muddatlari:
a) Muhim (critical) nosozliklar — 2 (ikki) ish kunida;
b) O'rta darajali nosozliklar — 5 (besh) ish kunida;
c) Ozgina ta'sir qiluvchi nosozliklar — keyingi rejimdagi yangilanishda.
6.3. Kafolat majburiyati quyidagi hollarda kuchini yo'qotadi:
— Buyurtmachi Ijrochining yozma roziligisiz Manba kodini o'zgartirsa;
— Buyurtmachi tavsiya etilmagan muhitda (servida) joylashtirsa yoki texnik muhitni o'zgartirsa;
— Nosozlik uchunchi tomon kutubxonasi yoki Buyurtmachi kiritgan noto'g'ri ma'lumotlar sababli yuzaga kelgan bo'lsa.
6.4. Kafolat muddatidan keyingi texnik qo'llab-quvvatlash (support) alohida shartnoma yoki qo'shimcha kelishuv asosida amalga oshiriladi.

7. MUALLIFLIK HUQUQI VA INTELLEKTUAL MULK

7.1. Ushbu Shartnoma asosida maxsus yaratilgan Dasturiy mahsulot va unga oid barcha intellektual mulk huquqlari — Manba kodi, ikkilik kod (binary), texnik hujjatlar, dizayn fayllari va ma'lumotlar bazasi sxemasi — to'lov to'liq amalga oshirilgandan so'ng Buyurtmachiga to'liq hajmda o'tadi (O'zR FK 1105-moddasi asosida).
7.2. O'tkazilgan huquqlar cheksiz, muddatsiz va dunyoning istalgan hududida qo'llaniladi.
7.3. Ijrochi loyiha doirasida ochiq kodli (open-source) kutubxonalar va uchinchi tomon komponentlaridan foydalangan taqdirda ularning litsenziyasi va foydalanish shartlarini Buyurtmachiga yozma ravishda bildiradi.
7.4. Ijrochi Shartnomadan oldin mavjud bo'lgan va loyihada ishlatilgan o'z xususiy metodologiyasi, frameworklari va vositalarini saqlaydi — ular Buyurtmachiga o'tmaydi, biroq faqat Buyurtmachi loyihasiga doir maqsadlarda ishlatiladi.
7.5. Ijrochi Buyurtmachining yozma roziligi bilan loyihani o'z portfoliosida umumiy ma'lumot sifatida ko'rsatishi mumkin; maxfiy ma'lumotlar, savdo belgisi va tijorat sirlarini oshkor etish man etiladi.

8. MA'LUMOTLAR XAVFSIZLIGI VA MAXFIYLIK

8.1. Ijrochi Buyurtmachining shaxsiy ma'lumotlari, tijorat sirlari, mijozlar bazasi va boshqa maxfiy ma'lumotlarini "Shaxsga doir ma'lumotlar to'g'risida"gi Qonun va amaldagi qonunchilik talablariga muvofiq muhofaza qiladi.
8.2. Ijrochi ushbu ma'lumotlarni faqat Shartnomani bajarish maqsadida ishlatadi va uchinchi shaxslarga oshkor etmaydi.
8.3. Shartnoma tugaganidan so'ng Ijrochi Buyurtmachining maxfiy ma'lumotlarini o'z ichiga olgan barcha nusxalar va ko'chirilgan fayllarni yo'q qiladi yoki Buyurtmachiga qaytaradi.
8.4. Ushbu majburiyatlar Shartnoma tugaganidan so'ng 5 (besh) yil davomida kuchda qoladi.

9. MAS'ULIYAT VA SANKSIYALAR

9.1. To'lov muddatini kechiktirganlik uchun Buyurtmachi kechiktirilgan summaning har bir kechikish kuni uchun 0,1% miqdorida penya to'laydi.
9.2. Bosqich muddatini kechiktirganlik uchun Ijrochi muddati o'tgan bosqich summasining har bir kechikish kuni uchun 0,1% miqdorida penya to'laydi.
9.3. Kafolat muddatida muhim nosozlikni bartaraf etishni kechiktirganlik uchun Ijrochi har bir kechikish kuni uchun oylik qo'llab-quvvatlash to'lovining 0,5% miqdorida penya to'laydi (support shartnomasi mavjud bo'lgan holda).
9.4. Ijrochining umumiy moddiy javobgarligi hech qanday holatda Shartnoma summasidan oshib ketmaydi.
9.5. Tomonlar bilvosita zararlar — foyda yo'qotilishi, biznes uzilishi, reputatsiya zarari uchun javobgar hisoblanmaydi.

10. SHARTNOMANI BEKOR QILISH

10.1. Buyurtmachi Shartnomani 30 (o'ttiz) kunlik yozma ogohlantirish bilan istalgan vaqtda bekor qilishi mumkin; bunda bajarilgan ishlar uchun proporsional to'lov amalga oshiriladi.
10.2. Quyidagi holatlarda tomon Shartnomani darhol bekor qilishga haqli:
a) Boshqa tomon o'z asosiy majburiyatini bildirish sanasidan 20 (yigirma) kun ichida bartaraf etmasa;
b) Boshqa tomon bankrot e'lon qilinsa yoki faoliyati to'xtatilsa;
c) Fors-major holati 60 (oltmish) kundan ortiq davom etsa.
10.3. Bekor qilinish vaqtiga qadar bajarilgan ishlar uchun to'lov kamaytirilmaydi.

11. FORS-MAJOR

11.1. Tomonlarning nazoratidan tashqaridagi va oldini olish imkoni bo'lmagan hodisalar — tabiiy ofatlar, epidemiyalar, urushlar, davlat organlari tomonidan faoliyatni to'xtatish, global infratuzilma uzilishlari — fors-major sifatida tan olinadi.
11.2. Fors-major holati 5 (besh) kun ichida yozma ravishda boshqa tomonga bildiriladi va vakolatli organ tomonidan berilgan tasdiqlash hujjati taqdim etiladi.
11.3. Fors-major holati 60 kundan ortiq davom etsa, har qaysi tomon jarima va sanksiyalarsiz Shartnomani bekor qilish huquqiga ega; bajarilgan ishlar uchun to'lov qilinadi.

12. NIZOLARNI HAL ETISH VA QONUNCHILIK

12.1. Nizolar birinchi navbatda 30 (o'ttiz) kun ichida tomonlar muzokarasi orqali hal etiladi.
12.2. Muzokara yo'li bilan hal etilmasa, nizo O'zbekiston Respublikasining vakolatli sudida ko'rib chiqiladi.
12.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari tatbiq etiladi.

13. YAKUNIY QOIDALAR

13.1. Shartnoma va ilovalar tomonlar o'rtasidagi to'liq kelishuvni tashkil etadi hamda avvalgi barcha yozma va og'zaki kelishuvlarni o'z ichiga oladi.
13.2. Shartnomaga har qanday o'zgartirish yoki qo'shimcha faqat ikkala tomonning vakolatli vakillari imzolagan yozma qo'shimcha kelishuv orqali amal qiladi.
13.3. Shartnomaning biron-bir bandining haqiqiy emas deb topilishi boshqa bandlarning yuridik kuchini yo'qotmaydi.
13.4. Shartnoma ikki nusxada tuzilgan; ikkala nusxa ham teng yuridik kuchga ega.

14. TOMONLARNING REKVIZITLARI VA IMZOLARI

BUYURTMACHI:                                IJROCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const XIZMAT_KONSALTING = `KONSALTING XIZMATLAR SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

Ushbu Konsalting xizmatlar shartnomasi (keyingi o'rinlarda "Shartnoma") quyidagi tomonlar o'rtasida tuzildi:

{{BUYURTMACHI}}, O'zbekiston Respublikasi qonunchiligiga muvofiq tashkil topgan yuridik shaxs, INN: {{BUYURTMACHI_INN}}, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi (keyingi o'rinlarda "Buyurtmachi"), bir tomondan, va

{{IJROCHI}}, O'zbekiston Respublikasi qonunchiligiga muvofiq tashkil topgan yuridik shaxs, INN: {{IJROCHI_INN}}, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi (keyingi o'rinlarda "Maslahatchi"), ikkinchi tomondan,

birgalikda "Tomonlar" deb ataladi, O'zbekiston Respublikasi Fuqarolik Kodeksining 703-730-moddalari asosida ushbu Shartnomani tuzdilar:

1. ATAMALAR VA TA'RIFLAR

1.1. "Konsalting xizmatlari" — Maslahatchi tomonidan o'z bilim, tajriba va professional ko'nikmalariga asoslanib Buyurtmachiga taqdim etadigan maslahat, tahlil, tavsiya, strategiya va tegishli Natijalar.
1.2. "Natijalar" — Maslahatchi tomonidan ushbu Shartnoma doirasida yaratilgan hisobotlar, tahlillar, strategiyalar, metodologiyalar, prognozlar va boshqa yozma yoki raqamli hujjatlar.
1.3. "Maxfiy ma'lumot" — Buyurtmachi tomonidan "maxfiy" deb belgilangan yoxud mohiyatiga ko'ra maxfiy bo'lgan moliyaviy, tijorat, texnologik va shaxsga doir ma'lumotlar.
1.4. "Manfaatlar ziddiyati" — Maslahatchi boshqa mijozlar yoki shaxsiy manfaatlari bilan munosabatlari Buyurtmachiga xolisona xizmat ko'rsatishiga to'sqinlik qiladigan holat.

2. SHARTNOMA PREDMETI VA KO'LAMI

2.1. Maslahatchi Buyurtmachiga quyidagi sohalarda professional konsalting xizmatlarini ko'rsatadi: {{XIZMAT_TAVSIF}}.
2.2. Konsalting xizmatlari quyidagilarni o'z ichiga oladi:
a) Buyurtmachi belgilagan masalalar bo'yicha professional tahlil, baholash va hisobotlar;
b) Strategik va taktik reja ishlab chiqish;
c) Zarur hollarda taqdimotlar, brifinglar va seminarlar o'tkazish;
d) Amalga oshirish bosqichlarida maslahat va monitoring;
e) Tomonlar kelishgan boshqa professional xizmatlar.
2.3. Xizmatlarning batafsil ko'lami, kutilgan Natijalar va muddatlar Shartnomaga 1-ilova sifatida biriktiriladi.
2.4. Vazifani kengaytirish zarur bo'lganda tomonlar yozma qo'shimcha kelishuv va qo'shimcha to'lov asosida ish bajaradilar.

3. XIZMAT KO'RSATISH MUDDATI VA TARTIBI

3.1. Shartnoma amal qilish muddati: {{XIZMAT_BOSHLANISH}} dan {{XIZMAT_TUGASH}} gacha.
3.2. Muddatni uzaytirish uchun tomonlar 30 (o'ttiz) kun oldin yozma kelishadilar.
3.3. Maslahat natijalari (Natijalar) 1-ilovada belgilangan muddatlarda yozma shaklda — hisobot, tahlil, tavsiyalar ko'rinishida — taqdim etiladi.
3.4. Maslahatchi xizmat ko'rsatish jarayonida Buyurtmachi bilan belgilangan davriylikda (haftalik, ikki haftada bir yoki oylik) progress hisoboti taqdim etadi.
3.5. Maslahatchi mustaqil mutaxassis sifatida faoliyat yuritadi: ish vaqtini mustaqil belgilaydi, biroq muddatlar va taqdimotlar bo'yicha kelishilgan jadvalga rioya qiladi.

4. NARX VA TO'LOV TARTIBI

4.1. Xizmatlar uchun umumiy to'lov: {{SUMMA}} ({{SUMMA_MATN}}) so'm. QQS amaldagi soliq qonunchiligiga muvofiq alohida hisoblab qo'shiladi.
4.2. To'lov tartibi: {{XIZMAT_TOLOV}}.
4.3. Xizmat soat asosida hisoblanganda Maslahatchi soatlik stavkasini va sarflangan soatlar sonini hujjatlashtirib, oylik hisob-faktura taqdim etadi. Buyurtmachi hisob-fakturani olgandan so'ng 10 (o'n) ish kuni ichida to'lovni amalga oshiradi.
4.4. Barcha to'lovlar bank o'tkazma orqali O'zbekiston so'mida amalga oshiriladi.
4.5. Safarbar xarajatlar (transport, mehmonxona, hujjatlashtirish kabi to'g'ridan-to'g'ri xarajatlar) Buyurtmachi bilan oldindan kelishilgan va hujjatlashtirilgan taqdirda alohida qoplanadi. Buyurtmachining roziligisiz safarbar xarajatlari amalga oshirilmaydi.

5. NATIJALARNI TAQDIM ETISH VA QABUL QILISH

5.1. Maslahatchi Natijalarni 1-ilovada belgilangan muddatlarda va shaklda taqdim etadi.
5.2. Buyurtmachi har bir Natijani olgandan so'ng 7 (yetti) ish kuni ichida:
— Natijani qabul qiladi va tasdiqlash xatini yuboradi; yoki
— Aniq asoslangan e'tirozlar ro'yxatini yozma ravishda bildiradi.
5.3. Maslahatchi e'tirozlarni ko'rib 5 (besh) ish kuni ichida tuzatilgan Natijani taqdim etadi.
5.4. 7 kunlik muddat ichida Buyurtmachi hech qanday javob bermasa, Natija qabul qilingan hisoblanadi.
5.5. Maslahatchi tavsiyalari Buyurtmachi tomonidan taqdim etilgan to'liq va to'g'ri ma'lumotlarga asoslanadi. Buyurtmachi yashirgan yoki noto'g'ri taqdim etgan ma'lumotlar sababli yuzaga keladigan salbiy natijalar uchun Maslahatchi javobgar emas.

6. TOMONLARNING HUQUQ VA MAJBURIYATLARI

6.1. Maslahatchi majburiyatlari:
a) Xizmatlarni o'z sohasi bo'yicha professional me'yorlarga muvofiq ko'rsatish;
b) Buyurtmachining Maxfiy ma'lumotlarini belgilangan tartibda muhofaza qilish;
c) Manfaatlar ziddiyati mavjud bo'lsa yoki kelib chiqsa, Buyurtmachiga darhol yozma ravishda xabar berish;
d) Natijalarni kelishilgan muddatlarda va sifatda taqdim etish;
e) Buyurtmachining vakolatli vakilini zarur holatlar to'g'risida o'z vaqtida xabardor qilish.

6.2. Buyurtmachi majburiyatlari:
a) Maslahatchi uchun zarur ma'lumotlar, hujjatlar va kirish imkoniyatini o'z vaqtida taqdim etish;
b) Maslahatchi faoliyatiga xalaqit bermaslik va kasbiy mustaqilligini ta'minlash;
c) To'lovlarni belgilangan muddatda to'liq amalga oshirish;
d) Maslahatchi so'ragan qarorlarni muddatida qabul qilish;
e) Taqdim etilgan ma'lumotlarning to'liqligi va aniqligi uchun javobgarlikni o'z zimmasiga olish.

7. MUSTAQIL PUDRATCHI MAQOMI

7.1. Maslahatchi mustaqil pudratchi sifatida xizmat ko'rsatadi va hech qanday holda Buyurtmachining xodimi, agent yoki vakili hisoblanmaydi.
7.2. Maslahatchi o'z soliqlarini, ijtimoiy to'lovlarini va boshqa qonuniy majburiyatlarini mustaqil ravishda bajaradi.
7.3. Maslahatchi Buyurtmachining nomidan hech qanday majburiyat olmaydi va uchinchi shaxslar bilan shartnoma tuzmaydi.

8. INTELLEKTUAL MULK VA NATIJALAR HUQUQI

8.1. Ushbu Shartnoma asosida maxsus yaratilgan Natijalar (hisobotlar, tahlillar, strategiyalar) va ularga oid mualliflik huquqlari to'lov to'liq amalga oshirilgandan so'ng Buyurtmachiga o'tadi (O'zR FK 1105-moddasi asosida).
8.2. Maslahatchi Shartnomadan oldin mavjud bo'lgan professional metodologiyasi, umumiy bilim bazasi va xususiy vositalarini saqlaydi — ular Buyurtmachiga o'tmaydi.
8.3. Maslahatchi Buyurtmachining yozma roziligi bo'lmasa, Natijalar mazmunini o'z marketing materiallarida keltira olmaydi.

9. KONFIDENSIALLIK VA MA'LUMOTLARNI MUHOFAZA QILISH

9.1. Maslahatchi Shartnoma doirasida olgan barcha Maxfiy ma'lumotni:
a) faqat Shartnomani bajarish maqsadida ishlatadi;
b) uchinchi shaxslarga, ommaga yoki OAVga oshkor etmaydi;
c) zaruriy xodimlar doirasida cheklangan holda ko'rsatadi.
9.2. Ushbu majburiyat quyidagi ma'lumotlarga tatbiq etilmaydi:
a) umumiy foydalanishdagi ma'lumotlar;
b) Maslahatchi mustaqil ravishda kashf etgan ma'lumotlar;
c) Qonun yoki sud buyrug'i asosida oshkor qilinishi lozim ma'lumotlar.
9.3. Shartnoma tugaganidan so'ng Maslahatchi Buyurtmachining maxfiy hujjatlarini qaytaradi yoki yo'q qiladi.
9.4. Ushbu majburiyatlar Shartnoma tugaganidan so'ng 3 (uch) yil davomida kuchda qoladi.

10. MANFAATLAR ZIDDIYATI VA RAQOBAT CHEKLOVI

10.1. Maslahatchi Shartnoma amal qilish davrida va keyingi 12 (o'n ikki) oy mobaynida Buyurtmachining bevosita raqiblariga xuddi shu soha bo'yicha konsalting xizmatlari ko'rsatmaydi, agar Buyurtmachi yozma rozilik bermasa.
10.2. Maslahatchi Shartnoma davomida va keyingi 12 oy mobaynida Buyurtmachining xodimlarini yoki biznes-hamkorlarini ushbu Shartnomadan tashqari ish yoki loyihalarga jalb etmaydi.
10.3. Maslahatchi allaqachon Manfaatlar ziddiyati mavjud bo'lsa yoki kelib chiqsa, Buyurtmachiga darhol yozma ravishda xabar beradi va tomonlar birgalikda yechim topadi.

11. MAS'ULIYAT VA JAVOBGARLIK CHEGARASI

11.1. Maslahatchi Buyurtmachiga taqdim etilgan tavsiyalar asosida Buyurtmachi tomonidan qabul qilingan qarorlar va harakatlar uchun javobgar hisoblanmaydi. Maslahatchi tavsiyalar beradi — qarorni Buyurtmachi mustaqil qabul qiladi.
11.2. Maslahatchi tavsiyalarida ishlatilgan ma'lumotlarning o'zi to'plagan qismidagi to'g'riligi uchun javobgar. Buyurtmachi tomonidan taqdim etilgan noto'g'ri ma'lumotlardan kelib chiquvchi natijalar uchun Maslahatchi javobgar emas.
11.3. Maslahatchi javobgarligi har qanday holatda ham ushbu Shartnoma bo'yicha to'langan umumiy to'lov miqdoridan oshib ketmaydi.
11.4. Tomonlar bilvosita zararlar — foyda yo'qotilishi, reputatsiya zarari, biznes uzilishi uchun javobgar emas.
11.5. To'lovni kechiktirganlik uchun Buyurtmachi kechiktirilgan summaning har bir kechikish kuni uchun 0,1% miqdorida penya to'laydi.

12. SHARTNOMANI BEKOR QILISH

12.1. Har qaysi tomon Shartnomani 30 (o'ttiz) kunlik yozma ogohlantirish bilan bekor qilishi mumkin.
12.2. Buyurtmachi quyidagi holatlarda Shartnomani darhol bekor qilish huquqiga ega:
— Maslahatchi professional etika normalarini qo'pol ravishda buzsa;
— Maslahatchi Maxfiy ma'lumotni ruxsatsiz oshkor etsa;
— Maslahatchi bankrot e'lon qilinsa yoki faoliyati to'xtatilsa.
12.3. Maslahatchi quyidagi holatlarda Shartnomani darhol bekor qilish huquqiga ega:
— Buyurtmachi to'lovni 30 (o'ttiz) kundan ortiq kechiktirsa;
— Buyurtmachi Maslahatchi faoliyatiga aralashib kasbiy mustaqilligini buzsa.
12.4. Bekor qilinish vaqtiga qadar ko'rsatilgan xizmatlar uchun proporsional to'lov amalga oshiriladi.

13. FORS-MAJOR

13.1. Tomonlarning nazoratidan tashqaridagi va kutilmagan hodisalar — tabiiy ofatlar, urushlar, epidemiyalar, davlat organlari tomonidan faoliyatni to'xtatish — fors-major sifatida tan olinadi.
13.2. Fors-major holati 5 (besh) kun ichida yozma ravishda boshqa tomonga bildiriladi va tasdiqlash hujjati taqdim etiladi.
13.3. Fors-major holati 60 (oltmish) kundan ortiq davom etsa, har qaysi tomon jarima va sanksiyalarsiz Shartnomani bekor qilish huquqiga ega; bajarilgan xizmatlar uchun to'lov qilinadi.

14. NIZOLARNI HAL ETISH VA QONUNCHILIK

14.1. Ushbu Shartnomadan kelib chiqadigan har qanday nizo birinchi navbatda 30 (o'ttiz) kun ichida tomonlar muzokarasi orqali hal etiladi.
14.2. Muzokara yo'li bilan hal etilmasa, nizo O'zbekiston Respublikasining vakolatli sudida ko'rib chiqiladi.
14.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari tatbiq etiladi.

15. YAKUNIY QOIDALAR

15.1. Shartnoma va ilovalar tomonlar o'rtasidagi to'liq kelishuvni tashkil etadi hamda avvalgi barcha yozma va og'zaki kelishuvlarni o'z ichiga oladi.
15.2. Shartnomaga har qanday o'zgartirish yoki qo'shimcha faqat ikkala tomonning vakolatli vakillari imzolagan yozma qo'shimcha kelishuv orqali amal qiladi.
15.3. Shartnomaning biron-bir bandining haqiqiy emas deb topilishi boshqa bandlarning yuridik kuchini yo'qotmaydi.
15.4. Shartnoma ikki nusxada tuzilgan; ikkala nusxa ham teng yuridik kuchga ega.

16. TOMONLARNING REKVIZITLARI VA IMZOLARI

BUYURTMACHI:                                MASLAHATCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── IJARA ───────────────────────────────────────────────────────────────────

const IJARA_KOCHMAS_MULK = `KO'CHMAS MULK IJARA SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

O'zbekiston Respublikasi Fuqarolik Kodeksining 535-576-moddalari, shuningdek ko'chmas mulkka oid qonunchilikka muvofiq,

{{BUYURTMACHI}} (STIR: {{BUYURTMACHI_INN}}), keyingi o'rinlarda "Ijarachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi, bir tomondan, va

{{IJROCHI}} (STIR: {{IJROCHI_INN}}), keyingi o'rinlarda "Ijaraberuvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi, ikkinchi tomondan,

birgalikda "Tomonlar" deb atalib, quyidagilar haqida ushbu ijara shartnomasi (keyingi o'rinlarda "Shartnoma") ni tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijaraberuvchi Ijarachiga quyida ko'rsatilgan ko'chmas mulkni (keyingi o'rinlarda "Ijara ob'ekti") vaqtincha egallab foydalanish uchun beradi:
— To'liq manzil: {{IJARA_MANZIL}}
— Ob'ekt turi: ofis / do'kon / ombor / ishlab chiqarish binosi / boshqa (keraklisi chiziladi)
— Umumiy maydoni: {{IJARA_MAYDON}} m², shundan asosiy maydon: __________ m²
— Kadastr raqami: ___________________________________
— Mulk huquqi asosi: ________________________________ (guvohnoma/qaror raqami va sanasi)
1.2. Ijara ob'ektining hozirgi texnik holati: yaxshi / qoniqarli / ta'mirlashga muhtoj (keraklisi chiziladi). Batafsil holat o'tkazish-qabul qilish dalolatnomasida aks ettiriladi.
1.3. Ijara ob'ekti Ijarachiga ushbu Shartnoma imzolanganida yoki kelishilgan sanada, ikki tomonlama o'tkazish-qabul qilish dalolatnomasiga asosan topshiriladi; dalolatnomaga Ijaraberuvchi kafolat bergan inventar va jihozlar ro'yxati ilova qilinadi.
1.4. Ijaraberuvchi Ijara ob'ektida mustaqil mulk egaligi huquqiga ega ekanligini kafolatlaydi va ob'ekt uchinchi shaxslar talabi, garov yoki arrest ostida emasligini tasdiqlaydi.

2. IJARA MUDDATI

2.1. Ijara muddati: {{IJARA_MUDDAT}} oy. Boshlanish: {{IJARA_BOSHLANISH}}. Tugash: {{IJARA_TUGASH}}.
2.2. Bir yil va undan ortiq muddatga tuzilgan ijara shartnomasi O'zbekiston Respublikasi qonunchiligi talabiga muvofiq davlat ro'yxatidan o'tkazilishi shart (O'zR FK 545-moddasi).
2.3. Ijara muddati tugashidan kamida 30 (o'ttiz) kalendar kun oldin tomonlardan biri yozma ravishda rad javobi bermasa, Shartnoma xuddi shu shartlarda yana 12 (o'n ikki) oyga avtomatik uzaytiriladi.
2.4. Ijarachining boshqa barcha shartlar teng bo'lganda Shartnomani uzaytirish bo'yicha ustun (afzallikli) huquqi mavjud (O'zR FK 549-moddasi).

3. IJARA HAQI VA TO'LOV TARTIBI

3.1. Oylik ijara haqi: {{OYLIK_TOLOV}} ({{OYLIK_TOLOV_MATN}}) so'm (QQS hisobga olinmagan / QQS qo'shilgan holda — keraklisi chiziladi).
3.2. Butun ijara muddati uchun umumiy shartnoma summasi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
3.3. Ijara haqi har oyning 5 (beshinchi) kalendar kuniga qadar oldindan Ijaraberuvchining bank hisobvarag'iga naqd pulsiz o'tkazma orqali to'lanadi. To'lov sanasi bank hujjatida ko'rsatilgan sana hisoblanadi.
3.4. Kommunal xizmatlar (elektr energiyasi, gaz, issiqlik, suv ta'minoti, chiqindilarni chiqarish, internet) Ijarachi tomonidan bevosita xizmat ko'rsatuvchi tashkilotlarga yoki Ijaraberuvchiga hisobraqam asosida alohida to'lanadi.
3.5. Shartnoma imzolanishida Ijarachi Ijaraberuvchiga bir oylik ijara haqiga teng miqdorda kafolat (depozit) to'lovini o'tkazadi: {{OYLIK_TOLOV}} so'm. Shartnoma muddati tugagach va Ijarachi barcha majburiyatlarini to'liq bajargan bo'lsa, depozit 5 (besh) ish kuni ichida qaytariladi; aks holda yetkazilgan zararni qoplash uchun ushlab qolinadi.
3.6. Ijara haqi faqat tomonlarning yozma kelishuvi asosida o'zgartirilishi mumkin. Ijaraberuvchi O'zR Statistika qo'mitasi e'lon qilgan yillik inflyatsiya ko'rsatkichidan 10% dan ortiq bo'lmagan miqdorda taklif qilishi mumkin; Ijarachi 15 (o'n besh) kun ichida yozma javob bermasa, muzokaralar o'tkaziladi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Ijaraberuvchi majburiyatlari:
— Ijara ob'ektini belgilangan kunda, foydalanishga yaroqli yaxshi texnik holatda, o'tkazish-qabul qilish dalolatnomasiga asosan topshirish;
— Ijara muddati davomida Ijarachining ob'ektdan to'sqinliksiz foydalanishini ta'minlash;
— Kapital ta'mirlash ishlarini (konstruktiv elementlar, muhandislik tizimlari: quvurlar, isitish, elektr tarmoq) o'z vaqtida va o'z hisobidan amalga oshirish; ta'mirlash boshlanishidan kamida 15 (o'n besh) kun oldin xabardor qilish;
— Ob'ektdagi yashirin kamchiliklar (Ijaraberuvchi bilgan yoki bilishi lozim bo'lgan) haqida Ijarachini oldindan yozma ravishda xabardor qilish (O'zR FK 540-moddasi);
— Ob'ektni elektr, gaz, suv ta'minoti va isitish tizimlari bilan ta'minlangan holatda topshirish;
— O'z soliq va yuridik majburiyatlarini o'z vaqtida bajarish.

4.2. Ijarachi huquqlari:
— Ijara ob'ektidan kelishilgan maqsadlarda erkin foydalanish;
— Ijaraberuvchidan yozma ruxsat olgach, Ijara ob'ektini uchinchi shaxslarga qayta ijara berish (O'zR FK 547-moddasi);
— Kapital ta'mirlash kechiktirilganda mustaqil ta'mirlash o'tkazib, xarajatlarni ijara haqidan ushlab qolish yoki alohida undirish huquqi.

4.3. Ijarachi majburiyatlari:
— Ijara haqini belgilangan muddatda to'lash;
— Ob'ektni ehtiyotkorlik bilan ishlatish va yaxshi holatda saqlash; tabiiy eskirishdan tashqari har qanday zararga yo'l qo'ymaslik;
— Joriy ta'mirlash (eshiklar, oynalar, santexnika, elektr rozetkalar va kalitlar) ishlarini o'z hisobidan amalga oshirish;
— Muhandislik tarmoqlarini (elektr, suv, gaz, isitish, kanalizatsiya) buzmaslik va ruxsatsiz ulash ishlarini amalga oshirmaslik;
— Ob'ektda qayta qurilish, yuk tashuvchi devorlarni buzish, qo'shimcha kirish eshiklar ochish kabi o'zgartirishlarni Ijaraberuvchidan oldindan yozma ruxsat olmasdan amalga oshirmaslik;
— Ijaraberuvchiga ob'ektni tekshirishga imkon berish (kamida 24 soat oldin yozma xabardor qilib);
— Ob'ektda yong'in, suv tosishi yoki boshqa avariya xavfi yuzaga kelsa, zudlik bilan Ijaraberuvchiga va tegishli xizmat tashkilotlariga xabardor qilish;
— Ijara muddati tugagach ob'ektni ikki tomonlama o'tkazish-qabul qilish dalolatnomasiga asosan, yaxshi holatda (oddiy eskirishni hisobga olgan holda) qaytarish.

5. KAFOLAT VA SIFAT MAJBURIYATLARI

5.1. Ijaraberuvchi Ijara ob'ektining topshirish paytida foydalanish uchun to'liq yaroqli ekanligini kafolatlaydi.
5.2. Ob'ektda Ijaraberuvchi bilgan, lekin Ijarachiga bildirilmagan yashirin nuqsonlar topilsa, Ijarachi quyidagi huquqlardan birini tanlashi mumkin: nuqsonlarni bartaraf etishni talab qilish; ijara haqini mutanosib kamaytirish; nuqsonlarni o'zi bartaraf etib xarajatlarni undirishni talab qilish; Shartnomani bekor qilish (O'zR FK 540-moddasi).
5.3. Ob'ekt nuqsonlari Ijarachi aybiga ko'ra yuzaga kelgan bo'lsa, ushbu modda qo'llanilmaydi.

6. MAS'ULIYAT

6.1. Ijara haqini belgilangan muddatdan kechiktirganligi uchun Ijarachi kechiktirilgan har bir kalendar kun uchun muddati o'tgan summa miqdorining 0,1% miqdorida penya to'laydi.
6.2. Ijara ob'ektiga Ijarachi aybiga ko'ra yetkazilgan to'g'ri zarar, ta'mirlash xarajatlari va isbotlangan foyda ko'rilmagan zarar uchun Ijarachi to'liq moddiy javob beradi.
6.3. Ijarachi ijara haqini ketma-ket 2 (ikki) oydan ortiq to'lamasa, Ijaraberuvchi yozma talab jo'natgan kundan 10 (o'n) ish kuni o'tgach Shartnomani bir tomonlama bekor qilish va ob'ektni qaytarish talabini qo'yish huquqiga ega.
6.4. Ijaraberuvchi Ijara ob'ektini o'z vaqtida topshirmasa yoki Ijarachining foydalanishiga asossiz to'sqinlik qilsa, Ijarachi etkazilgan to'g'ri zararni undirish huquqiga ega.
6.5. Tomonlardan biri Shartnomani asossiz ravishda muddatidan oldin bekor qilsa, boshqa tomonga 1 (bir) oylik ijara haqiga teng miqdorda kompensatsiya to'laydi.

7. SHARTNOMANI MUDDATIDAN OLDIN BEKOR QILISH

7.1. Tomonlardan biri Shartnomani muddatidan oldin bekor qilmoqchi bo'lsa, boshqa tomonga kamida 30 (o'ttiz) kalendar kun oldin yozma ogohlantirish yuborishi shart.
7.2. Ijaraberuvchi quyidagi hollarda Shartnomani muddatidan oldin bir tomonlama bekor qilishi mumkin:
— Ijarachi ijara haqini ketma-ket 2 (ikki) oydan ortiq to'lamasa;
— Ijarachi ob'ektni kelishilmagan maqsadlarda ishlatsa yoki ob'ektga qaytarib bo'lmas zarar yetkazsa;
— Ijarachi Ijaraberuvchi roziligisiz uchinchi shaxslarga qayta ijara bersa.
7.3. Ijarachi quyidagi hollarda Shartnomani muddatidan oldin bir tomonlama bekor qilishi mumkin:
— Ijaraberuvchi ob'ektni o'z vaqtida topshirmasa yoki foydalanishga yaroqli holatda ta'minlamasa;
— Ob'ektda Ijaraberuvchi yashirgan, foydalanishga to'sqinlik qiluvchi kamchiliklar aniqlansa;
— Kapital ta'mirlash majburiyati bajarilmasligi natijasida ob'ekt foydalanishga yaroqsiz holga kelsa.

8. FORS-MAJOR

8.1. Tomonlar nazoratidan tashqaridagi va kutilmagan holda yuzaga kelgan favqulodda holatlar (tabiiy ofatlar, zilzila, sel, tashqaridan yong'in, davlat organlari tomonidan ob'ektni musodara qilishi, urush holati) fors-major sifatida tan olinadi.
8.2. Fors-major holati yuzaga kelgan tomon boshqa tomonga 5 (besh) kalendar kun ichida vakolatli organ tomonidan tasdiqlanuvchi hujjat ilova qilingan yozma xabardorlik yuborishi shart.
8.3. Fors-major holati 30 (o'ttiz) kundan ortiq davom etsa, har qaysi tomon jarima va sanksiyalarsiz Shartnomani bekor qilish huquqiga ega; fors-major boshlanguniga qadar bajarilgan majburiyatlar bo'yicha hisob-kitob to'liq amalga oshiriladi.

9. MAXFIYLIK

9.1. Tomonlar Shartnoma shartlari, ijara haqi miqdori va tomonlarning tijorat ma'lumotlarini uchinchi shaxslarga faqat tomonlarning yozma roziligi yoki qonun talabi asosida oshkor qilishi mumkin.
9.2. Ushbu majburiyat Shartnoma muddati tugagandan keyin ham 2 (ikki) yil davomida kuchda qoladi.

10. NIZOLARNI HAL ETISH

10.1. Tomonlar o'rtasida yuzaga keladigan har qanday nizo birinchi navbatda muzokaralar orqali 30 (o'ttiz) kalendar kun ichida hal etilishga harakat qilinadi.
10.2. Muzokara yo'li bilan hal etilmasa, nizo O'zbekiston Respublikasining vakolatli sudida ko'rib chiqiladi.
10.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari tatbiq etiladi.

11. YAKUNIY QOIDALAR

11.1. Ushbu Shartnoma ikki nusxada tuzilgan bo'lib, har bir nusxa teng yuridik kuchga ega.
11.2. Shartnomaga barcha ilovalar (o'tkazish-qabul qilish dalolatnomalari, inventar ro'yxati va qo'shimcha kelishuvlar) uning ajralmas qismini tashkil etadi.
11.3. Shartnomaga har qanday o'zgartirish yoki qo'shimcha faqat ikkala tomonning vakolatli vakillari imzolagan yozma qo'shimcha kelishuv orqali kuchga kiradi.
11.4. Shartnomaning biron-bir bandining haqiqiy emas deb topilishi qolgan bandlarning yuridik kuchini yo'qotmaydi.
11.5. Ushbu Shartnoma bir yildan ortiq muddatga tuzilgan bo'lsa, O'zR qonunchiligi talabiga ko'ra davlat ro'yxatidan o'tkazilishi lozim.

12. TOMONLARNING REKVIZITLARI VA IMZOLARI

IJARACHI:                                   IJARABERUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
STIR: {{BUYURTMACHI_INN}}                  STIR: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const IJARA_TEXNIKA = `TEXNIKA (ASBOB-USKUNA) IJARASI SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

O'zbekiston Respublikasi Fuqarolik Kodeksining 535-576-moddalari asosida,

{{BUYURTMACHI}} (STIR: {{BUYURTMACHI_INN}}), keyingi o'rinlarda "Ijarachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi, bir tomondan, va

{{IJROCHI}} (STIR: {{IJROCHI_INN}}), keyingi o'rinlarda "Ijaraberuvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi, ikkinchi tomondan,

birgalikda "Tomonlar" deb atalib, quyidagilar haqida ushbu asbob-uskuna (texnika) ijara shartnomasi (keyingi o'rinlarda "Shartnoma") ni tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijaraberuvchi Ijarachiga quyidagi texnikani (asbob-uskunani) (keyingi o'rinlarda "Texnika") vaqtincha egallab foydalanish uchun beradi:
— Texnika nomi / turi / rusumi: ___________________________________
— Ishlab chiqaruvchi va ishlab chiqarilgan yil: ______________________
— Zavod / seriya / inventar raqami: ________________________________
— Texnik holati topshirish vaqtida: yaxshi / qoniqarli (dalolatnomasida batafsil ko'rsatiladi)
— Ilova hujjatlari: texnik pasport, ishlatish yo'riqnomasi, xizmat ko'rsatish jadvali.
1.2. Texnika Ijarachiga ikki tomonlama o'tkazish-qabul qilish dalolatnomasiga asosan topshiriladi; dalolatnomasida Texnikaning texnik holati, hisoblagichlar ko'rsatgichi, mavjud nuqsonlar va zarur ehtiyot qismlar ro'yxati aks ettiriladi.
1.3. Ijaraberuvchi Texnikaning topshirish paytida foydalanish uchun to'liq yaroqli ekanligini kafolatlaydi.
1.4. Texnika Ijaraberuvchiga tegishli bo'lib, uchinchi shaxslar talabi, garov yoki arrest ostida emasligini Ijaraberuvchi tasdiqlaydi.

2. IJARA MUDDATI

2.1. Ijara muddati: shartnoma imzolanganidan boshlab __________ oy.
2.2. Boshlanish sanasi: {{IJARA_BOSHLANISH}}. Tugash sanasi: {{IJARA_TUGASH}}.
2.3. Ijara muddati tugashidan kamida 15 (o'n besh) kun oldin tomonlardan biri yozma ravishda e'tiroz bildirmasa, Shartnoma xuddi shu shartlarda yana 3 (uch) oyga avtomatik uzaytiriladi.

3. IJARA HAQI VA TO'LOV TARTIBI

3.1. Oylik ijara haqi: {{OYLIK_TOLOV}} ({{OYLIK_TOLOV_MATN}}) so'm.
3.2. Butun ijara muddati uchun umumiy shartnoma summasi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
3.3. To'lov har oyning 5 (beshinchi) kalendar kuniga qadar oldindan Ijaraberuvchining bank hisobvarag'iga naqd pulsiz o'tkazma orqali amalga oshiriladi.
3.4. Yoqilg'i, elektr energiyasi, moylash materiallari va boshqa foydalanish sarfxarajatlari Ijarachi hisobidan to'liq qoplanadi.
3.5. Ijara haqini belgilangan muddatdan kechiktirganligi uchun Ijarachi kechiktirilgan har bir kalendar kun uchun muddati o'tgan summa miqdorining 0,1% miqdorida penya to'laydi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Ijaraberuvchi majburiyatlari:
— Texnikani ishlaydigan, foydalanishga to'liq yaroqli holatda va barcha hujjatlari bilan topshirish;
— Kafolat muddatida (ishlab chiqaruvchi kafolati doirasidagi) yuzaga kelgan ishlab chiqaruvchi nuqsonlarini o'z hisobidan bartaraf etish;
— Texnikaning ehtiyot qismlari mavjudligi to'g'risida Ijarachiga ma'lumot berish;
— Zarur bo'lganda texnik maslahat ko'rsatish.

4.2. Ijarachi huquqlari:
— Texnikadan kelishilgan maqsadlarda to'liq foydalanish;
— Texnikada ishlab chiqaruvchi nuqsonlari aniqlanganda ta'mirlash yoki kompensatsiya talab qilish;
— Ijaraberuvchining yozma roziligini olgach, Texnikani uchinchi shaxslarga qayta ijara berish.

4.3. Ijarachi majburiyatlari:
— Texnikani faqat uning texnik xususiyatlariga va maqsadli tayinlanishiga mos ravishda ishlatish;
— Texnik xizmat ko'rsatish (TO) jadvalini ishlab chiqaruvchi yo'riqnomasiga muvofiq o'z vaqtida o'tkazish;
— Har qanday nosozlik yoki shikastlanish to'g'risida 24 soat ichida Ijaraberuvchiga yozma xabardor qilish;
— Texnikani Ijaraberuvchi roziligisiz uchinchi shaxslarga, shu jumladan ijara yoki vaqtinchalik foydalanish uchun bermaslik;
— Texnikani Ijaraberuvchining yozma roziligisiz boshqa hududga ko'chirmaslik;
— Ijara muddati tugagach Texnikani ikki tomonlama o'tkazish-qabul qilish dalolatnomasiga asosan, topshirilgan texnik holat darajasida (oddiy eskirishni hisobga olgan holda) qaytarish.

5. TEXNIKA SHIKASTLANGANDA

5.1. Texnika Ijarachi aybiga ko'ra butunlay yo'qolsa yoki qayta tiklash imkonsiz bo'lguday shikastlansa, Ijarachi uni shu turdagi yangi yoki bozor qiymatidagi texnika bilan almashtiradi yoki bozor qiymatini mustaqil ekspert xulosasi asosida to'liq pul kompensatsiyasi sifatida to'laydi.
5.2. Qisman shikastlanish uchun Ijarachi ta'mirlash xarajatlarini to'liq qoplaydi; ta'mirlash tashkiloti Ijaraberuvchi roziligida tanlanadi.
5.3. Ijara muddati tugamasdan Ijarachi Texnikani qaytarmoqchi bo'lsa, qolgan muddat uchun ijara haqining 30% miqdorida bekor qilish kompensatsiyasi to'laydi (agar tomonlar boshqacha kelishmagan bo'lsa).
5.4. Texnika nosozligi ishlab chiqaruvchi kamchiligi yoki tabiiy eskirish tufayli yuzaga kelgan bo'lsa, ta'mirlash xarajatlari Ijaraberuvchi hisobidan qoplanadi.

6. SIFAT KAFOLATI

6.1. Texnika topshirilganda, o'tkazish-qabul qilish dalolatnomasida ko'rsatilmagan yashirin nuqsonlar keyinchalik aniqlansa, Ijarachi Ijaraberuvchiga 3 (uch) ish kuni ichida yozma ravishda xabardor qilishi shart.
6.2. Bunday hollarda Ijaraberuvchi nuqsonlarni 10 (o'n) ish kuni ichida bepul bartaraf etishga majburdir; aks holda Ijarachi nuqsonlar bartaraf etilmaguncha ijara haqini to'lashni to'xtatish yoki Shartnomani bekor qilish huquqiga ega.

7. SHARTNOMANI MUDDATIDAN OLDIN BEKOR QILISH

7.1. Ijaraberuvchi quyidagi hollarda Shartnomani bir tomonlama bekor qilishi mumkin:
— Ijarachi ijara haqini 30 (o'ttiz) kundan ortiq kechiktirsa;
— Ijarachi Texnikani o'z maqsadidan tashqarida yoki yo'riqnomaga xilof ravishda ishlatsa;
— Ijarachi Texnikani Ijaraberuvchi roziligisiz uchinchi shaxslarga bersa yoki boshqa hududga ko'chirsa;
— Ijarachi shikastlanish haqida o'z vaqtida xabardor qilmasa va bu Texnikaga qo'shimcha zarar yetkazsa.
7.2. Ijarachi quyidagi hollarda Shartnomani bir tomonlama bekor qilishi mumkin:
— Texnika topshirilganda foydalanishga yaroqsiz holda bo'lsa va Ijaraberuvchi 10 (o'n) ish kuni ichida bartaraf etmasa;
— Ijaraberuvchidan kelib chiqadigan sabablarga ko'ra Ijarachi Texnikadan foydalana olmasa.
7.3. Muddatidan oldin bekor qilish to'g'risidagi yozma ogohlantirish kamida 15 (o'n besh) kun oldin yuborilishi shart (favqulodda hollar bundan mustasno).

8. FORS-MAJOR VA NIZOLARNI HAL ETISH

8.1. Tomonlar nazoratidan tashqaridagi favqulodda holatlar (tabiiy ofat, yong'in tashqaridan, davlat organlari harakatlari, urush holati) fors-major sifatida tan olinadi. Xabardor qilish muddati: 5 (besh) kalendar kun ichida vakolatli organ tasdiqlovchi hujjat bilan.
8.2. Fors-major holati 20 (yigirma) kundan ortiq davom etsa, har qaysi tomon jarima va kompensatsiyasiz Shartnomani bekor qilish huquqiga ega.
8.3. Tomonlar o'rtasidagi barcha nizolar muzokara yo'li bilan, hal etilmasa O'zbekiston Respublikasining vakolatli sudida ko'rib chiqiladi. Shartnomaga O'zbekiston Respublikasi qonunlari tatbiq etiladi.

9. YAKUNIY QOIDALAR

9.1. Ushbu Shartnoma ikki nusxada tuzilgan; har bir nusxa teng yuridik kuchga ega.
9.2. Shartnomaga barcha ilovalar (o'tkazish-qabul qilish dalolatnomalari va boshqalar) uning ajralmas qismini tashkil etadi.
9.3. Shartnomaga har qanday o'zgartirish faqat ikkala tomonning imzolagan yozma qo'shimcha kelishuvi orqali kuchga kiradi.

10. TOMONLARNING REKVIZITLARI VA IMZOLARI

IJARACHI:                                   IJARABERUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
STIR: {{BUYURTMACHI_INN}}                  STIR: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const IJARA_TEKIN = `BEPUL FOYDALANISH SHARTNOMASI
(SSUDA — TEKIN IJARA)
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

O'zbekiston Respublikasi Fuqarolik Kodeksining 582-586-moddalari (ssuda — bepul foydalanish) asosida,

{{BUYURTMACHI}} (STIR: {{BUYURTMACHI_INN}}), keyingi o'rinlarda "Ssudachi" (foydalanuvchi) deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi, bir tomondan, va

{{IJROCHI}} (STIR: {{IJROCHI_INN}}), keyingi o'rinlarda "Ssudaberuvchi" (beruvchi) deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi, ikkinchi tomondan,

birgalikda "Tomonlar" deb atalib, quyidagilar haqida ushbu bepul foydalanish shartnomasi (keyingi o'rinlarda "Shartnoma") ni tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ssudaberuvchi Ssudachiga quyidagi mol-mulkni (keyingi o'rinlarda "Mol-mulk") vaqtincha BEPUL foydalanish uchun beradi:
— Mol-mulk tavsifi / manzili: {{IJARA_MANZIL}}
— Umumiy maydoni: {{IJARA_MAYDON}} m²
— Kadastr raqami (agar ko'chmas mulk bo'lsa): ___________________
— Texnik holati topshirish vaqtida: yaxshi / qoniqarli (dalolatnomasida ko'rsatiladi)
1.2. Ushbu Shartnoma to'liq bepul (tekin) asosida tuzilgan. Ssudachi hech qanday ijara haqi yoki boshqa pul to'lovini to'lamaydi.
1.3. Mol-mulk Ssudachiga o'tkazish-qabul qilish dalolatnomasiga asosan topshiriladi; dalolatnomasida Mol-mulkning holati va inventar tarkibi aks ettiriladi.
1.4. Ssudaberuvchi Mol-mulkda mustaqil mulk egaligi huquqiga ega ekanligini kafolatlaydi; Mol-mulk uchinchi shaxslar talabi, garov yoki arrest ostida emasligini tasdiqlaydi.

2. FOYDALANISH MUDDATI

2.1. Foydalanish muddati: {{IJARA_MUDDAT}} oy.
2.2. Boshlanish sanasi: {{IJARA_BOSHLANISH}}. Tugash sanasi: {{IJARA_TUGASH}}.
2.3. Foydalanish muddati tugashidan 30 (o'ttiz) kun oldin tomonlardan biri yozma e'tiroz bildirmasa, Shartnoma xuddi shu shartlarda yana 12 (o'n ikki) oyga avtomatik ravishda uzaytiriladi.
2.4. Muddatsiz tuzilgan shartnomada har qaysi tomon 30 (o'ttiz) kun oldin yozma ogohlantirish bergan holda Shartnomani bekor qilishi mumkin (O'zR FK 585-moddasi).

3. BEPUL FOYDALANISH SHARTLARI

3.1. Ushbu Shartnoma bo'yicha hech qanday pul to'lovi yoki natura evaziga to'lov amalga oshirilmaydi. Ssudachi faqat quyidagi xarajatlarni o'z hisobidan to'lashi shart:
— Kommunal xizmatlar (elektr energiyasi, gaz, suv, isitish, chiqindilarni chiqarish) haqiqiy sarflanganiga qarab;
— Joriy ta'mirlash xarajatlari (mayda nosozliklarni bartaraf etish);
— Mol-mulkdan foydalanish bilan bevosita bog'liq boshqa operatsion xarajatlar.
3.2. Kapital ta'mirlash ishlarini Ssudaberuvchi o'z hisobidan amalga oshiradi; Ssudachi bu ishlarni mustaqil bajarib, xarajatlarni undirishga haqli emas (O'zR FK 584-moddasi).
3.3. Mol-mulk bilan birga topshirilgan ashyolar va jihozlar foydalanish muddati tugagach to'liq holda qaytarilishi lozim.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Ssudaberuvchi majburiyatlari:
— Mol-mulkni foydalanishga yaroqli holatda, o'tkazish-qabul qilish dalolatnomasiga asosan topshirish;
— Mol-mulkdagi o'ziga ma'lum yashirin kamchiliklar yoki cheklovlar haqida Ssudachini oldindan yozma xabardor qilish (O'zR FK 583-moddasi); xabardor qilinmagan yashirin kamchiliklar topilganda Ssudachi zararni undirish yoki Shartnomani bekor qilish huquqiga ega;
— Foydalanish davomida Ssudachiga Mol-mulkdan foydalanishga to'sqinlik qilmaslik.

4.2. Ssudachi huquqlari:
— Mol-mulkdan kelishilgan maqsadlarda erkin foydalanish;
— Mol-mulkda yashirin kamchiliklar topilganda Ssudaberuvchidan bartaraf etishni talab qilish.

4.3. Ssudachi majburiyatlari:
— Mol-mulkni faqat uning maqsadli belgilashiga muvofiq va ehtiyotkorlik bilan ishlatish;
— Mol-mulkni yaxshi va foydalanishga yaroqli holatda saqlash, tabiiy eskirishdan tashqari har qanday zararga yo'l qo'ymaslik;
— Mol-mulkda qayta qurilish, o'zgartirish yoki ta'mirlash ishlarini Ssudaberuvchidan oldindan yozma ruxsat olmasdan amalga oshirmaslik;
— Mol-mulkni uchinchi shaxslarga, shu jumladan ijara yoki qarz sifatida, Ssudaberuvchi yozma roziligisiz topshirmaslik;
— Mol-mulkda avariya yoki shikast yuzaga kelsa, 24 soat ichida Ssudaberuvchiga yozma xabardor qilish;
— Ssudaberuvchiga Mol-mulkni tekshirishga ruxsat berish (kamida 24 soat oldin xabardor qilib);
— Foydalanish muddati tugagach Mol-mulkni o'tkazish-qabul qilish dalolatnomasiga asosan, qabul qilingan holat darajasida (oddiy eskirishni hisobga olgan holda) qaytarish.

5. MAS'ULIYAT

5.1. Ssudachi Mol-mulkka yetkazgan zarari uchun to'liq moddiy javob beradi; shu jumladan Mol-mulkni yo'qotish yoki qaytarib bera olmaslik holatida uning bozor qiymatini mustaqil ekspert xulosasi asosida to'liq qoplash majburiyatini oladi.
5.2. Ssudachi Mol-mulkni ruxsatsiz uchinchi shaxslarga berganlik uchun Ssudaberuvchi Shartnomani zudlik bilan bir tomonlama bekor qilish, Mol-mulkni qaytarish va etkazilgan zararni undirish huquqiga ega (O'zR FK 585-moddasi).
5.3. Mol-mulk Ssudaberuvchi yashirgan yashirin kamchilik sababli shikastlansa, bu zarar uchun Ssudaberuvchi javob beradi.
5.4. Ssudachi Mol-mulkdan foydalanish chog'ida uchinchi shaxslarga etkazilgan zarar uchun O'zbekiston Respublikasi qonunchiligi asosida javob beradi.

6. SHARTNOMANI MUDDATIDAN OLDIN BEKOR QILISH

6.1. Ssudaberuvchi quyidagi hollarda Shartnomani bir tomonlama zudlik bilan bekor qilishi mumkin (O'zR FK 585-moddasi):
— Ssudachi Mol-mulkni maqsadidan tashqari foydalansa yoki unga zarar yetkazsa;
— Ssudachi Mol-mulkni ruxsatsiz uchinchi shaxslarga bersa;
— Ssudachi Mol-mulkni yaxshi holatda saqlash majburiyatini bajarmaslik natijasida holati yomonlashsa.
6.2. Ssudachi quyidagi hollarda Shartnomani bir tomonlama bekor qilishi mumkin:
— Ssudaberuvchi Mol-mulkni topshirishdan bosh tortsa;
— Mol-mulkda Ssudaberuvchi yashirgan, to'liq foydalanishga to'sqinlik qiluvchi kamchiliklar aniqlansa;
— Ssudaberuvchi Mol-mulkdan foydalanishni kutilmagan tarzda cheklasa.
6.3. Muddatidan oldin bekor qilish to'g'risidagi yozma ogohlantirish kamida 30 (o'ttiz) kalendar kun oldin yuborilishi shart.

7. FORS-MAJOR

7.1. Tomonlar nazoratidan tashqaridagi favqulodda holatlar (tabiiy ofat, zilzila, sel, yong'in tashqaridan, davlat organlarining Mol-mulkni musodara qilishi) fors-major sifatida tan olinadi.
7.2. Fors-major holati yuzaga kelgan tomon boshqa tomonga 5 (besh) kun ichida vakolatli organ tomonidan tasdiqlanuvchi hujjat ilova qilingan holda yozma xabardorlik yuborishi shart.
7.3. Fors-major 30 (o'ttiz) kundan ortiq davom etsa, har qaysi tomon Shartnomani hech qanday javobgarliksiz bekor qilishi mumkin.

8. NIZOLARNI HAL ETISH

8.1. Tomonlar o'rtasida yuzaga keladigan barcha nizolar 30 (o'ttiz) kun ichida muzokaralar orqali hal etilishga harakat qilinadi.
8.2. Muzokara yo'li bilan hal etilmasa, nizo O'zbekiston Respublikasining vakolatli sudida ko'rib chiqiladi.
8.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari, xususan Fuqarolik Kodeksining 582-586-moddalari tatbiq etiladi.

9. YAKUNIY QOIDALAR

9.1. Ushbu Shartnoma ikki nusxada tuzilgan; har bir nusxa teng yuridik kuchga ega.
9.2. Barcha ilovalar (o'tkazish-qabul qilish dalolatnomalari va boshqalar) Shartnomaning ajralmas qismini tashkil etadi.
9.3. Shartnomaga har qanday o'zgartirish yoki qo'shimcha faqat ikkala tomonning imzolagan yozma qo'shimcha kelishuvi orqali kuchga kiradi.
9.4. Ushbu Shartnomaning biron-bir bandining haqiqiy emas deb topilishi qolgan bandlarning yuridik kuchiga ta'sir qilmaydi.

10. TOMONLARNING REKVIZITLARI VA IMZOLARI

SSUDACHI (FOYDALANUVCHI):                  SSUDABERUVCHI (BERUVCHI):
{{BUYURTMACHI}}                             {{IJROCHI}}
STIR: {{BUYURTMACHI_INN}}                  STIR: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── PUDRAT ──────────────────────────────────────────────────────────────────

const PUDRAT_QURILISH = `QURILISH PUDRATCHILIGI SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

O'zbekiston Respublikasi Fuqarolik Kodeksining 630-660-moddalari va O'zbekiston Respublikasining "Arxitektura va qurilish faoliyati to'g'risida"gi qonuniga muvofiq,

{{BUYURTMACHI}} (STIR: {{BUYURTMACHI_INN}}), keyingi o'rinlarda "Buyurtmachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi, bir tomondan, va

{{IJROCHI}} (STIR: {{IJROCHI_INN}}), keyingi o'rinlarda "Pudratchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi, ikkinchi tomondan,

birgalikda "Tomonlar" deb atalib, quyidagilar haqida ushbu qurilish pudratchiligi shartnomasi (keyingi o'rinlarda "Shartnoma") ni tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Pudratchi Buyurtmachining topshirig'iga binoan quyidagi qurilish, rekonstruksiya yoki kapital ta'mirlash ishlarini (keyingi o'rinlarda "Ishlar") o'z kuchi va vositalari bilan bajarish majburiyatini oladi:
— Ob'ekt manzili va nomi: {{PUDRAT_OBEKT}}
— Bajariladigan ishlarning batafsil tavsifi: {{PUDRAT_TAVSIF}}
— Texnik topshiriq: ushbu Shartnomaning 1-ilovasi (ajralmas qism)
— Loyiha-smeta hujjatlari: ushbu Shartnomaning 2-ilovasi (ajralmas qism)
1.2. Buyurtmachi Pudratchi tomonidan bajarilgan Ishlarni belgilangan tartibda qabul qilib olish va kelishilgan haqni to'lash majburiyatini oladi.
1.3. Pudratchi O'zbekiston Respublikasi qonunchiligida talab etilgan tegishli litsenziya va ruxsatnomaga (qurilish faoliyatini amalga oshirishga) ega ekanligini kafolatlaydi; litsenziya nusxasi ushbu Shartnomaga ilova qilinadi.

2. ISH BAJARISH MUDDATI

2.1. Ishlarni boshlash sanasi: {{PUDRAT_BOSHLANISH}}.
2.2. Ishlarni to'liq yakunlash muddati: {{PUDRAT_TUGASH}}.
2.3. Bosqichma-bosqich bajarish jadvali (agar belgilangan bo'lsa) ushbu Shartnomaning 3-ilovasi sifatida ilova qilinadi; har bir bosqich muddati majburiy hisoblanadi.
2.4. Ish muddatini uzaytirish faqat quyidagi asoslar bo'yicha va tomonlarning yozma kelishuvi bilan amalga oshiriladi:
— Buyurtmachi tomonidan loyiha hujjatlari yoki materiallar o'z vaqtida taqdim etilmasa;
— Buyurtmachi topshirig'iga binoan qo'shimcha ishlar hajmi oshirilsa;
— Fors-major holatlari yuzaga kelsa.
2.5. Muddatni uzaytirish asossiz bo'lsa, Pudratchi kechikish uchun mas'uliyat davogar olmaydi — muddat uzaytirish xat Buyurtmachi tomonidan yozma ravishda tasdiqlanishi shart.

3. SHARTNOMA NARXI VA TO'LOV TARTIBI

3.1. Ishlarning umumiy shartnoma narxi: {{SUMMA}} ({{SUMMA_MATN}}) so'm (QQS qo'shib/qo'shmasdan — keraklisi chiziladi). Ushbu summa tasdiqlangan smeta asosida belgilangan.
3.2. To'lov quyidagi jadval asosida amalga oshiriladi:
— Shartnoma imzolanganidan 3 (uch) ish kuni ichida — 30% avans to'lovi: __________ so'm;
— Ishlarning 50% bajarilishi bo'yicha oraliq qabul dalolatnomasiga asosan — 40%: __________ so'm;
— Barcha Ishlar to'liq bajarilgach, yakuniy qabul dalolatnomasiga asosan — qolgan 30%: __________ so'm.
3.3. Barcha to'lovlar bank o'tkazma orqali amalga oshiriladi.
3.4. Smeta doirasidan tashqari qo'shimcha ishlar faqat Buyurtmachining oldindan yozma buyurtmasi va narxlar kelishilgandan keyingina bajariladi; bunday ishlar uchun to'lov alohida hisob-kitob asosida amalga oshiriladi.
3.5. Pudratchi tomonidan materiallar xarid qilish zarur bo'lganda, Buyurtmachi tomonidan tasdiqlangan material ro'yxati va narxlarga asosan chek yoki hisobraqam taqdim etiladi.
3.6. Yakuniy hisob-kitobdan 5% (besh foiz) kafolat tutib qolish miqdori sifatida 2 (ikki) yillik kafolat muddat davomida ushlab turiladi; kafolat muddati muammosiz tugashidan keyin 10 (o'n) ish kuni ichida qaytariladi.

4. TEXNIK HUJJATLAR VA MATERIALLAR

4.1. Buyurtmachi quyidagi hujjatlarni Ishlar boshlanishidan kamida 5 (besh) ish kuni oldin Pudratchi ixtiyoriga beradi:
— Tasdiqlangan loyiha-smeta hujjatlari to'plami (arxitektura, konstruktiv, muhandislik qismlari);
— Ob'ektni qurishga yoki ta'mirlashga ruxsatnoma (tegishli organ tomonidan berilgan);
— Yer uchastkasiga egalik huquqi hujjati yoki foydalanish ruxsatnomasi.
4.2. Loyiha hujjatlarining to'liqligi va rasmiy tasdiqlanganligi uchun Buyurtmachi javobgar.
4.3. Materiallar ta'minoti:
— Asosiy qurilish materiallari (tsement, g'isht, armatura, qum, shag'al) Pudratchi tomonidan smeta narxlarida ta'minlanadi (agar boshqacha kelishilmagan bo'lsa);
— Maxsus yoki Buyurtmachi ko'rsatgan materiallar Buyurtmachi hisobidan taqdim etiladi;
— Barcha materiallar belgilangan davlat standartlariga (O'zDSt) yoki texnik shartlarga muvofiq bo'lishi shart; sertifikatlar talab etilganda taqdim etiladi.

5. TOMONLARNING HUQUQ VA MAJBURIYATLARI

5.1. Pudratchi majburiyatlari:
— Ishlarni belgilangan muddat va sifatda, tasdiqlangan loyiha hujjatlari, qurilish normalari va qoidalariga (QNQ) to'liq muvofiq bajarish;
— Ish joyida mehnat xavfsizligi, yong'in xavfsizligi va sanitariya-gigiyena qoidalariga rioya qilish; tegishli himoya vositalari bilan ta'minlash;
— Ishlar davomida yuzaga keladigan muhim to'siqlar, kutilmagan geologik sharoitlar, loyihadagi nomuvofiqliklar to'g'risida 48 soat ichida Buyurtmachiga yozma xabardor qilish;
— Ish joyida tartibni saqlash, qurilish chiqindilarini muntazam olib chiqish;
— Buyurtmachining texnik nazorat vakili bilan hamkorlik qilish va har hafta ish hisoboti taqdim etish;
— Ob'ektda Buyurtmachiga tegishli mol-mulk, muhandislik tizimlari va qo'shni binolarga zarar yetkazmaslik;
— Ish tugagach ob'ektni tozalab topshirish va barcha qurilish asbob-uskunalarini olib chiqish.

5.2. Pudratchi huquqlari:
— Muayyan ishlar qismlarini sub-pudrat tashkilotlariga Buyurtmachining oldindan yozma roziligini olgach topshirish; ammo umumiy javobgarlik Pudratchi zimmasida qoladi;
— Buyurtmachi o'z vaqtida to'lamagan taqdirda ishlarni to'xtatish (yozma ogohlantirish jo'natilgandan 5 ish kuni o'tgach);
— Buyurtmachi topshirig'i bo'yicha qo'shimcha ishlar bajarilganda qo'shimcha haq talab qilish.

5.3. Buyurtmachi majburiyatlari:
— Pudratchi uchun ob'ektga to'sqinliksiz kirishni va ishlar uchun zarur sharoitlarni ta'minlash;
— Tasdiqlangan loyiha-smeta hujjatlarini va qurilish ruxsatnomasini o'z vaqtida taqdim etish;
— Texnik nazorat vakilini tayinlash va Pudratchi bilan o'z vaqtida aloqa qilish;
— Bajarilgan Ishlarni belgilangan muddatlarda qabul qilish yoki asosli rad yetkazmaslik;
— To'lovlarni kelishilgan jadval asosida o'z vaqtida amalga oshirish.

5.4. Buyurtmachi huquqlari:
— Istalgan vaqtda texnik nazorat o'tkazish (Pudratchi ishiga aralashmasdan);
— Materiallar sifatini tekshirish va sifat sertifikatlarini talab qilish;
— Loyihadagi o'zgarishlarni yozma buyurtma orqali kiritish (narx va muddat qayta kelishiladi);
— Pudratchi kafolat muddatida nuqsonlarni bartaraf etmasa, uchinchi shaxslarga bajartirib, xarajatlarni Pudratchi hisobidan undirish.

6. ISHLARNI QABUL QILISH TARTIBI

6.1. Pudratchi har bir bosqich ishlarini yakunlagach, Buyurtmachiga qabul-topshiriq dalolatnomasini (ishlar hajmi va qiymati ko'rsatilgan, tegishli KS-2 va KS-3 shakllari bilan) taqdim etadi.
6.2. Buyurtmachi taqdim etilgan hujjatlarni olgandan keyin 5 (besh) ish kuni ichida texnik nazorat vakili bilan birgalikda Ishlarni tekshirib, qabul dalolatnomasini imzolaydi yoki asosli kamchiliklarni yozma ravishda bildiradi.
6.3. Aniqlangan kamchiliklar Pudratchi tomonidan 10 (o'n) ish kuni ichida bepul bartaraf etiladi. Kamchiliklar bartaraf etilgach qayta qabul amalga oshiriladi.
6.4. Buyurtmachi 5 (besh) ish kuni ichida dalolatnomani imzolamasa va asosli e'tiroz bildirmasa, Ishlar qabul qilingan deb hisoblanadi.
6.5. Buyurtmachi qabul-topshiriq dalolatnomasini imzolashdan asossiz ravishda bosh tortsa, Pudratchi bir tomonlama dalolatnoma tuzib, to'lovni sud orqali undirish huquqiga ega.
6.6. Yashirin ishlar (zamin qazish, poydevor, kommunikatsiya qo'yish) bajarilganda texnik nazorat vakili ishtirkida oraliq qabul va yashirin ishlar dalolatnomasi rasmiylashtiriladi; ushbu ishlar yopilishidan oldin tekshirilishi majburiy.

7. KAFOLAT MUDDATI VA SIFAT TALABLARI

7.1. Bajarilgan qurilish va ta'mirlash ishlariga kafolat muddati: 2 (ikki) yil, yakuniy qabul dalolatnomasiga imzo chekkan kundan boshlab.
7.2. Kafolat muddatida quyidagi holatlar yuzaga kelsa Pudratchi bepul bartaraf etish majburiyatini oladi:
— Loyiha-smeta hujjatlari yoki qurilish normalari (QNQ) ga muvofiq bajarilmagan konstruktiv nuqsonlar;
— Materiallar sifat talablariga javob bermasligi tufayli yuzaga kelgan nuqsonlar;
— Qo'llangan texnologiya yoki ish usullari kamchiligi natijasida yuzaga kelgan nosozliklar.
7.3. Kafolat quyidagi holatlarga tatbiq etilmaydi:
— Buyurtmachi yoki uchinchi shaxslarning noto'g'ri foydalanishi tufayli yuzaga kelgan shikastlanishlar;
— Tabiiy eskirish va ob'ektiv eskirish;
— Fors-major holatlari natijasida yuzaga kelgan shikastlanishlar.
7.4. Kafolat muddatida nuqson to'g'risidagi yozma xabar olgandan keyin Pudratchi 5 (besh) ish kuni ichida ob'ektga kelishi va 15 (o'n besh) ish kuni ichida nuqsonlarni bartaraf etishi shart. Avariya holatida — zudlik bilan.

8. MAS'ULIYAT

8.1. Ishlarni belgilangan muddatdan kechiktirganligi uchun Pudratchi kechiktirilgan har bir kalendar kun uchun umumiy shartnoma summasining 0,1% miqdorida penya to'laydi; ammo penya jami to'liq shartnoma summasining 10% dan oshmasligi kerak.
8.2. To'lovni belgilangan muddatdan kechiktirganligi uchun Buyurtmachi kechiktirilgan har bir kalendar kun uchun kechiktirilgan summa miqdorining 0,1% penya to'laydi.
8.3. Pudratchi mehnat xavfsizligi qoidalarini buzganligi natijasida yuzaga keladigan baxtsiz hodisalar, jarohatlar va kasb kasalliklari uchun O'zbekiston Respublikasi qonunchiligiga muvofiq to'liq moddiy va ma'muriy javobgarlik oladi.
8.4. Pudratchi tomonidan Buyurtmachiga yoki uchinchi shaxslarga yetkazilgan to'g'ri moddiy zarar, shu jumladan qo'shni binolarga, muhandislik tarmoqlariga va mulklarga yetkazilgan zarar, Pudratchi hisobidan to'liq qoplanadi.
8.5. Tomonlar o'zaro kelishgan holda penya miqdorini kamaytirishi yoki ortiqcha kechikish bo'lsa shartnomani bekor qilishi mumkin.

9. SHARTNOMANI MUDDATIDAN OLDIN BEKOR QILISH

9.1. Buyurtmachi quyidagi hollarda Shartnomani muddatidan oldin bir tomonlama bekor qilishi mumkin:
— Pudratchi belgilangan muddatdan 20 (yigirma) kundan ortiq kechiksa va muddatini uzaytirish asoslarini taqdim eta olmasa;
— Pudratchi Ishlarni tasdiqlangan loyiha yoki qurilish normalaridan aniq chetlantirib bajarsa va 10 (o'n) ish kuni ichida bartaraf etmasa;
— Pudratchi litsenziyasi bekor qilinsa yoki to'xtatilsa;
— Pudratchi qurilish xavfsizligiga jiddiy xavf tug'diradigan qoidabuzarlikka yo'l qo'ysa.
9.2. Pudratchi quyidagi hollarda Shartnomani muddatidan oldin bir tomonlama bekor qilishi mumkin:
— Buyurtmachi avans yoki oraliq to'lovni 15 (o'n besh) ish kunidan ortiq kechiktirsa;
— Buyurtmachi Pudratchi uchun zarur qurilish sharoitini ta'minlamasa va bu Ishlar bajarilishiga to'sqinlik qilsa;
— Buyurtmachi loyiha hujjatlari yoki qurilish ruxsatnomasini taqdim etmasa.
9.3. Shartnoma muddatidan oldin bekor qilinganida, Pudratchi faktik bajarilgan Ishlar hajmiga mos keladigan miqdorni olish huquqiga ega; Buyurtmachi esa ortiqcha to'langan avans summasini qaytarib olish huquqiga ega.

10. FORS-MAJOR

10.1. Tomonlar nazoratidan tashqaridagi favqulodda holatlar (tabiiy ofatlar, zilzila, sel, yong'in tashqaridan, ommaviy tartibsizliklar, davlat organlarining favqulodda qarorlari) fors-major sifatida tan olinadi.
10.2. Fors-major holati yuzaga kelgan tomon boshqa tomonga 5 (besh) kalendar kun ichida vakolatli organ tomonidan tasdiqlanuvchi hujjat ilova qilingan yozma xabardorlik yuborishi shart.
10.3. Fors-major holati 30 (o'ttiz) kundan ortiq davom etsa, har qaysi tomon jarima va sanksiyalarsiz Shartnomani bekor qilish huquqiga ega; bajarilgan Ishlar hajmiga ko'ra hisob-kitob amalga oshiriladi.

11. MAXFIYLIK

11.1. Tomonlar Shartnoma shartlari, narxlar, loyiha hujjatlari va tomonlarning tijorat ma'lumotlarini uchinchi shaxslarga tomonlarning yozma roziligi yoki qonun talabi asosidagina oshkor qilishi mumkin.
11.2. Ushbu majburiyat Shartnoma muddati tugagandan keyin ham 3 (uch) yil davomida kuchda qoladi.

12. NIZOLARNI HAL ETISH

12.1. Tomonlar o'rtasida yuzaga keladigan har qanday nizo birinchi navbatda muzokaralar orqali 20 (yigirma) kalendar kun ichida hal etilishga harakat qilinadi.
12.2. Muzokara yo'li bilan hal etilmasa, nizo O'zbekiston Respublikasining vakolatli iqtisodiy sudida ko'rib chiqiladi.
12.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari, xususan Fuqarolik Kodeksining 630-660-moddalari tatbiq etiladi.
12.4. Sud qaroriga qadar tomonlar o'z majburiyatlarini (Ishlarni bajarish va to'lovni amalga oshirish) to'xtatmasliği kerak — agar muqobil kelishuv bo'lmasa.

13. YAKUNIY QOIDALAR

13.1. Ushbu Shartnoma ikki nusxada tuzilgan bo'lib, har bir nusxa teng yuridik kuchga ega.
13.2. Quyidagi hujjatlar Shartnomaning ajralmas qismini tashkil etadi:
— 1-ilova: Texnik topshiriq;
— 2-ilova: Loyiha-smeta hujjatlari;
— 3-ilova: Ish bajarish grafigi (bosqichlari bilan);
— 4-ilova: Pudratchi litsenziyasi nusxasi.
13.3. Shartnomaga har qanday o'zgartirish yoki qo'shimcha faqat ikkala tomonning vakolatli vakillari imzolagan yozma qo'shimcha kelishuv orqali kuchga kiradi.
13.4. Shartnomaning biron-bir bandining haqiqiy emas deb topilishi qolgan bandlarning yuridik kuchini yo'qotmaydi.

14. TOMONLARNING REKVIZITLARI VA IMZOLARI

BUYURTMACHI:                                PUDRATCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
STIR: {{BUYURTMACHI_INN}}                  STIR: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── QO'SHIMCHA SHARTNOMA ─────────────────────────────────────────────────────

const QOSHIMCHA_STANDART = `QO'SHIMCHA SHARTNOMA
№ {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

O'zbekiston Respublikasi Fuqarolik Kodeksining 354-355-moddalari (shartnomani o'zgartirish va bekor qilish) asosida,

{{BUYURTMACHI}} (STIR: {{BUYURTMACHI_INN}}), keyingi o'rinlarda "1-Tomon" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi, bir tomondan, va

{{IJROCHI}} (STIR: {{IJROCHI_INN}}), keyingi o'rinlarda "2-Tomon" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi, ikkinchi tomondan,

birgalikda "Tomonlar" deb atalib, quyidagilar haqida ushbu qo'shimcha shartnoma (keyingi o'rinlarda "Qo'shimcha") ni tuzdilar:

1. ASOSIY SHARTNOMA MA'LUMOTLARI

1.1. Ushbu Qo'shimcha shartnoma {{ASOSIY_RAQAM}} raqamli, {{ASOSIY_SANA}} sanasida tuzilgan asosiy shartnomaning (keyingi o'rinlarda "Asosiy shartnoma") ajralmas qismi hisoblanadi.
1.2. Asosiy shartnomaning ushbu Qo'shimchada zikr etilmagan barcha qoidalari, shartlari va bandlari o'z kuchini saqlab qoladi va to'liq amal qiladi.
1.3. Ushbu Qo'shimcha Asosiy shartnomaga zid kelgan taqdirda, Qo'shimchaning qoidalari ustuvorlik qiladi (O'zR FK 355-moddasi).

2. KIRITILAYOTGAN O'ZGARTIRISHLAR

2.1. Tomonlar o'zaro kelishuv asosida Asosiy shartnomaga quyidagi o'zgartirishlarni kiritadilar:
{{OZGARTIRISH}}

2.2. Yuqoridagi o'zgartirishlar Qo'shimcha imzolanganidan boshlab kuchga kiradi, agar 2.1-bandda boshqacha ko'rsatilmagan bo'lsa.

3. MOLIYAVIY O'ZGARISHLAR

3.1. Ushbu Qo'shimcha shartnoma asosida Asosiy shartnomaning umumiy summasi quyidagi miqdorga o'zgartiriladi:
— Yangi umumiy shartnoma summasi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
3.2. Agar moliyaviy o'zgarish bo'lmasa, Asosiy shartnomaning dastlabki summasi o'z kuchini saqlaydi.
3.3. Qo'shimcha to'lovlar yoki ortiqcha to'langan summalarni qaytarish Asosiy shartnomada belgilangan to'lov tartibida amalga oshiriladi, agar tomonlar boshqacha kelishmagan bo'lsa.

4. MUDDAT O'ZGARISHLARI

4.1. Agar Asosiy shartnomaning muddati o'zgartiriladigan bo'lsa, yangi tugash muddati: {{YANGI_MUDDAT}}.
4.2. Agar muddat o'zgartirish nazarda tutilmagan bo'lsa, Asosiy shartnomaning dastlabki muddati o'z kuchida qoladi.
4.3. Muddat uzaytirilganda tomonlarning barcha majburiyatlari yangi muddat tugagunga qadar kuchda bo'ladi.

5. KUCHGA KIRISH TARTIBI

5.1. Ushbu Qo'shimcha shartnoma ikkala tomon vakolatli vakillari tomonidan imzolangan va muhrlangan kundan boshlab kuchga kiradi.
5.2. Ushbu Qo'shimcha shartnoma ikki nusxada tuzilgan; har bir tomon uchun bir nusxadan bo'lib, ikkala nusxa teng yuridik kuchga ega.
5.3. Ushbu Qo'shimcha Asosiy shartnomaning barcha huquqiy merosxo'rlari, qonuniy vakillari va vakolatli topshiriqnoma egalari uchun ham majburiy kuchga ega.

6. TOMONLARNING TASDIQNOMALARI

6.1. Har bir Tomon ushbu Qo'shimchani imzolash uchun to'liq huquq va vakolatga ega ekanligini tasdiqlaydi.
6.2. Tomonlar ushbu Qo'shimcha shartlarini to'liq o'qib, tushunib va roziligi bilan imzolamoqda.

7. TOMONLARNING REKVIZITLARI VA IMZOLARI

1-TOMON:                                    2-TOMON:
{{BUYURTMACHI}}                             {{IJROCHI}}
STIR: {{BUYURTMACHI_INN}}                  STIR: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── MOLIYAVIY YORDAM ─────────────────────────────────────────────────────────

const MOLIYAVIY_FOIZSIZ = `FOIZSIZ QARZ SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

O'zbekiston Respublikasi Fuqarolik Kodeksining 732-740-moddalari (qarz shartnomasi) asosida,

{{BUYURTMACHI}} (STIR: {{BUYURTMACHI_INN}}), keyingi o'rinlarda "Qarz beruvchi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi, bir tomondan, va

{{IJROCHI}} (STIR: {{IJROCHI_INN}}), keyingi o'rinlarda "Qarz oluvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi, ikkinchi tomondan,

birgalikda "Tomonlar" deb atalib, quyidagilar haqida ushbu foizsiz qarz shartnomasi (keyingi o'rinlarda "Shartnoma") ni tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Qarz beruvchi Qarz oluvchiga ushbu Shartnoma asosida quyidagi miqdorda foizsiz pul qarz (keyingi o'rinlarda "Qarz") beradi:
— Qarz miqdori: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
— Qarz maqsadi: {{QARZ_MAQSAD}}.
1.2. Ushbu Qarz to'liq foizsiz beriladi; Qarz beruvchi hech qanday foiz, komissiya yoki boshqa to'lovlarni talabi qilishga haqli emas. Faqat asosiy qarz miqdori qaytariladi.
1.3. Ushbu Shartnoma O'zR FK 734-moddasi 3-qismi asosida foizsiz qarz shartnomasi sifatida rasmiylashtirilib, tijorat maqsadida foydalanishni nazarda tutmaydi.

2. QARZNI BERISH TARTIBI

2.1. Qarz beruvchi Shartnoma imzolanganidan keyin 5 (besh) bank ish kuni ichida Qarz miqdorini Qarz oluvchining quyidagi bank hisobvarag'iga naqd pulsiz o'tkazma orqali beradi:
— Bank: ___________________________
— H/r: ___________________________
— MFO: ___________________________
2.2. Qarzni berish sanasi — bank to'lov topshiriqnomasida ko'rsatilgan sana. Pul Qarz oluvchining hisobiga tushgan sana Qarz berish sanasi hisoblanadi.
2.3. Qarz oluvchi Qarz summasini olgandan keyin 2 (ikki) ish kuni ichida Qarz beruvchiga yozma ravishda tasdiqlaydi.
2.4. Qarz oluvchi Qarz mablag'larini faqat 1.1-bandda ko'rsatilgan maqsad uchun ishlatishi shart. Maqsad o'zgartirilganda Qarz beruvchining oldindan yozma roziligini olish lozim.

3. QARZNI QAYTARISH TARTIBI

3.1. Qarz oluvchi Qarz miqdorini quyidagi tartibda qaytarish majburiyatini oladi:
— Qaytarish muddati: {{QARZ_MUDDAT}}.
— Qaytarish usuli: oylik teng ulushlar / bir yo'la / choraklik to'lovlar (keraklisi chiziladi).
3.2. Har bir to'lov Qarz beruvchining bank hisobvarag'iga naqd pulsiz o'tkazma orqali amalga oshiriladi; to'lov maqsadida "Foizsiz qarz qaytarish, shartnoma № {{RAQAM}}" yoziladi.
3.3. Muddatidan oldin to'liq yoki qisman qaytarish mumkin; Qarz beruvchiga kamida 3 (uch) ish kuni oldin yozma xabardorlik yuborilishi shart. Muddatidan oldin to'lashda hech qanday jarima yoki qo'shimcha to'lov talab etilmaydi.
3.4. To'lovning belgilangan sanasiga to'g'ri kelishi bank ish kuniga qarab hisoblanadi; bayram yoki dam olish kunlari to'g'ri kelgan taqdirda to'lov keyingi ish kunida amalga oshiriladi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Qarz beruvchi majburiyatlari:
— Qarz summasini belgilangan muddatda va tartibda berish;
— Qarz oluvchi maqsadga muvofiq foydalanganda qo'shimcha talab yoki cheklov qo'ymaslik;
— Qarz oluvchining moliyaviy ahvolini uchinchi shaxslarga oshkor qilmaslik.

4.2. Qarz oluvchi majburiyatlari:
— Qarzni faqat belgilangan maqsad uchun sarflash;
— Qarzni kelishilgan jadval asosida o'z vaqtida qaytarish;
— Moliyaviy ahvol keskin yomonlashganda (to'lovga qodir emaslik xavfi yuzaga kelganda) Qarz beruvchini zudlik bilan yozma xabardor qilish;
— Qarz beruvchining yozma roziligisiz Qarz majburiyatlarini uchinchi shaxslarga o'tkazmaslik (cessiya).

4.3. Qarz beruvchi huquqlari:
— Qarz mablag'laridan maqsadga muvofiq foydalanilishini tekshirish maqsadida hujjat (cheklar, bank ko'chirmalari) talab qilish;
— Qarz oluvchi maqsadsiz sarflagan taqdirda Qarzni muddatidan oldin qaytarishni talab qilish.

5. MAS'ULIYAT

5.1. Qarzni belgilangan muddatdan kechiktirib qaytarganligi uchun Qarz oluvchi kechiktirilgan har bir kalendar kun uchun muddati o'tgan summa miqdorining 0,05% miqdorida penya to'laydi.
5.2. Kechikish 30 (o'ttiz) kalendar kundan oshsa, Qarz beruvchi butun qolgan Qarz summasini va to'plangan penyani bir yo'la undirish talabini qo'yish huquqiga ega.
5.3. Qarz beruvchi Qarz summasini belgilangan muddatda bermaslik uchun Qarz oluvchiga kechiktirilgan har bir kalendar kun uchun Qarz summasining 0,05% miqdorida penya to'laydi.
5.4. Qarz mablag'lari maqsadiga xilof ishlatilsa, Qarz beruvchi Shartnomani bir tomonlama bekor qilib, butun Qarz summasini zudlik bilan qaytarishni talab qilish huquqiga ega.

6. GAROV VA TA'MINOT (IXTIYORIY)

6.1. Qarz miqdori yuqori bo'lgan taqdirda tomonlar kelishuvi asosida Qarz majburiyatlarining bajarilishi garov, kafillik yoki boshqa ta'minot vositasi bilan ta'minlanishi mumkin; bunday holda alohida garov shartnomasi rasmiylashtiriladi.
6.2. Garov shartnomasi tuzilgan bo'lsa, u ushbu Shartnomaning ajralmas qismi hisoblanadi.

7. FORS-MAJOR

7.1. Tomonlar nazoratidan tashqaridagi favqulodda holatlar (tabiiy ofat, epidemiya, urush holati, davlat organlari tomonidan tomonlar faoliyatini to'xtatish) fors-major sifatida tan olinadi.
7.2. Fors-major holati yuzaga kelgan tomon boshqa tomonga 5 (besh) kalendar kun ichida vakolatli organ tasdiqlovchi hujjat ilova qilingan yozma xabardorlik yuborishi shart.
7.3. Fors-major davomida qarz qaytarish muddati fors-major davom etgan muddat miqdorida uzaytiriladi; penya hisoblanmaydi.

8. MAXFIYLIK

8.1. Tomonlar Shartnoma shartlari, Qarz miqdori va tomonlarning moliyaviy ma'lumotlarini uchinchi shaxslarga tomonlarning yozma roziligi yoki qonun talabi asosidagina oshkor qilishi mumkin.
8.2. Ushbu majburiyat Shartnoma to'liq bajarilgandan keyin ham 3 (uch) yil davomida kuchda qoladi.

9. NIZOLARNI HAL ETISH

9.1. Tomonlar o'rtasida yuzaga keladigan har qanday nizo birinchi navbatda muzokaralar orqali 20 (yigirma) kalendar kun ichida hal etilishga harakat qilinadi.
9.2. Muzokara yo'li bilan hal etilmasa, nizo O'zbekiston Respublikasining vakolatli sudida ko'rib chiqiladi.
9.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari tatbiq etiladi.

10. YAKUNIY QOIDALAR

10.1. Ushbu Shartnoma ikki nusxada tuzilgan bo'lib, har bir nusxa teng yuridik kuchga ega.
10.2. Shartnomaga har qanday o'zgartirish faqat ikkala tomonning imzolagan yozma qo'shimcha kelishuvi orqali kuchga kiradi.
10.3. Shartnomaning biron-bir bandining haqiqiy emas deb topilishi qolgan bandlarning yuridik kuchini yo'qotmaydi.

11. TOMONLARNING REKVIZITLARI VA IMZOLARI

QARZ BERUVCHI:                              QARZ OLUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
STIR: {{BUYURTMACHI_INN}}                  STIR: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const MOLIYAVIY_FOIZLI = `FOIZLI QARZ SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

O'zbekiston Respublikasi Fuqarolik Kodeksining 732-740-moddalari (qarz shartnomasi) va O'zbekiston Respublikasi Markaziy banki me'yoriy hujjatlariga muvofiq,

{{BUYURTMACHI}} (STIR: {{BUYURTMACHI_INN}}), keyingi o'rinlarda "Qarz beruvchi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi, bir tomondan, va

{{IJROCHI}} (STIR: {{IJROCHI_INN}}), keyingi o'rinlarda "Qarz oluvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi, ikkinchi tomondan,

birgalikda "Tomonlar" deb atalib, quyidagilar haqida ushbu foizli qarz shartnomasi (keyingi o'rinlarda "Shartnoma") ni tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Qarz beruvchi Qarz oluvchiga ushbu Shartnoma asosida quyidagi shartlarda pul qarz (keyingi o'rinlarda "Qarz") beradi:
— Qarz asosiy summasi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
— Yillik foiz stavkasi: {{QARZ_FOIZ}}% (yillik).
— Qarz maqsadi: {{QARZ_MAQSAD}}.
1.2. Foiz stavkasi Shartnoma muddati davomida o'zgarmaydi (agar 3.5-bandda boshqacha ko'rsatilmagan bo'lsa).
1.3. Qarz oluvchi asosiy summani va hisoblangan foizlarni ushbu Shartnomada belgilangan tartibda qaytarish majburiyatini oladi.

2. QARZNI BERISH TARTIBI

2.1. Qarz beruvchi Shartnoma imzolanganidan keyin 5 (besh) bank ish kuni ichida Qarz summasini Qarz oluvchining quyidagi bank hisobvarag'iga naqd pulsiz o'tkazma orqali beradi:
— Bank: ___________________________
— H/r: ___________________________
— MFO: ___________________________
2.2. Foiz hisoblanishi pul Qarz oluvchining hisobvarag'iga tushgan kundan boshlanadi.
2.3. Qarz oluvchi Qarz summasini olgandan keyin 2 (ikki) ish kuni ichida Qarz beruvchiga yozma ravishda qabul qilganini tasdiqlaydi.
2.4. Qarz oluvchi mablag'larni faqat 1.1-bandda ko'rsatilgan maqsad uchun ishlatishi shart.

3. FOIZLAR VA TO'LOV TARTIBI

3.1. Foiz hisoblash usuli: oddiy foiz (simple interest) — har oy qolgan asosiy qarz miqdoriga {{QARZ_FOIZ}}% yillik stavka asosida, ya'ni oylik {{QARZ_FOIZ}} / 12 = ________% hisoblanadi.
3.2. To'lov jadvali (annuitet yoki differensial — keraklisi chiziladi):
— Qaytarish muddati: {{QARZ_MUDDAT}}.
— Har oyning ________ sanasida teng miqdorda oylik to'lov (asosiy qarz + foiz): __________ so'm.
— Batafsil to'lov jadvali ushbu Shartnomaning 1-ilovasi sifatida ilova qilinadi va ajralmas qism hisoblanadi.
3.3. Barcha to'lovlar Qarz beruvchining bank hisobvarag'iga naqd pulsiz o'tkazma orqali amalga oshiriladi; to'lov maqsadida "Foizli qarz to'lovi, shartnoma № {{RAQAM}}, sana: ____" yoziladi.
3.4. Muddatidan oldin to'liq yoki qisman qaytarish mumkin; Qarz beruvchiga kamida 5 (besh) ish kuni oldin yozma xabardorlik yuborilishi shart. Muddatidan oldin qaytarishda faqat haqiqatan hisoblangan foizlar to'lanadi; kelajakdagi foizlar talab etilmaydi.
3.5. Foiz stavkasini o'zgartirish faqat tomonlarning yozma qo'shimcha kelishuvi asosida amalga oshirilishi mumkin; bir tomonlama o'zgartirish taqiqlanadi.
3.6. Qarz oluvchi har bir oylik to'lovdan keyin 3 (uch) ish kuni ichida bank ko'chirmasini Qarz beruvchiga yuboradi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Qarz beruvchi majburiyatlari:
— Qarz summasini belgilangan muddatda va tartibda berish;
— To'lov jadvalini oldindan (Shartnoma imzolanishida) Qarz oluvchiga taqdim etish;
— Har bir to'lovdan keyin qolgan qarz qoldig'i haqida so'ralganda ma'lumot berish;
— Qarz oluvchining moliyaviy ma'lumotlarini uchinchi shaxslarga oshkor qilmaslik.

4.2. Qarz oluvchi majburiyatlari:
— Qarzni faqat belgilangan maqsad uchun sarflash;
— Oylik to'lovlarni kelishilgan jadval asosida o'z vaqtida amalga oshirish;
— Moliyaviy ahvol keskin yomonlashganda (to'lovga qodir emaslik xavfi yuzaga kelganda) Qarz beruvchini darhol yozma xabardor qilish;
— Qarz majburiyatlarini uchinchi shaxslarga Qarz beruvchi yozma roziligisiz o'tkazmaslik.

4.3. Qarz beruvchi huquqlari:
— Qarz mablag'laridan maqsadga muvofiq foydalanilishini tasdiqlash uchun hujjat talab qilish;
— Qarz oluvchi maqsadsiz sarflagan yoki to'lovlarni ketma-ket 2 (ikki) oy kechiktirgan taqdirda butun qolgan Qarz va foizlarni muddatidan oldin qaytarishni talab qilish;
— Belgilangan garov yoki kafillik mavjud bo'lsa, undirish choralarini ko'rish.

5. MAS'ULIYAT

5.1. Oylik to'lovni belgilangan muddatdan kechiktirganligi uchun Qarz oluvchi kechiktirilgan har bir kalendar kun uchun kechiktirilgan summa miqdorining 0,1% miqdorida penya to'laydi.
5.2. Kechikish ketma-ket 2 (ikki) oylik to'lovni qamrab olsa, Qarz beruvchi qolgan butun Qarz summasini, hisoblangan foizlar va penyalarni bir yo'la undirish talabini qo'yish hamda garov mol-mulkini sotish huquqiga ega.
5.3. Qarz beruvchi Qarz summasini belgilangan muddatda bermaslik uchun Qarz oluvchiga kechiktirilgan har bir kalendar kun uchun Qarz summasining 0,1% miqdorida penya to'laydi (FK 327-moddasi asosida).
5.4. Penya shartnomaviy javobgarlik bilan birga qo'llaniladi va zarar miqdorini qoplash uchun etarli bo'lmasa, qo'shimcha zarar undirish ham talabi qilinishi mumkin.

6. GAROV VA TA'MINOT (IXTIYORIY)

6.1. Ushbu Shartnoma bo'yicha Qarz majburiyatlarining bajarilishi quyidagi ta'minot bilan ta'minlanishi mumkin:
— Garov (ko'chmas mulk, transport vositasi, qimmatli qog'ozlar);
— Uchinchi shaxsning kafilligi;
— Boshqa tomonlar kelishgan ta'minot turi.
6.2. Garov yoki kafillik tuzilgan bo'lsa, tegishli shartnoma alohida rasmiylashtiriladi va ushbu Shartnomaning ajralmas qismi hisoblanadi.

7. FORS-MAJOR

7.1. Tomonlar nazoratidan tashqaridagi favqulodda holatlar (tabiiy ofat, epidemiya, urush holati, davlat organlari tomonidan moliyaviy faoliyatni to'xtatish) fors-major sifatida tan olinadi.
7.2. Fors-major holati yuzaga kelgan tomon boshqa tomonga 5 (besh) kalendar kun ichida vakolatli organ tasdiqlovchi hujjat ilova qilingan yozma xabardorlik yuborishi shart.
7.3. Fors-major davomida to'lov muddatlari fors-major davom etgan muddat miqdorida uzaytiriladi; penya hisoblanmaydi. Fors-major 60 (oltmish) kundan oshsa, tomonlar yangi to'lov jadvalini kelishadilar.

8. MAXFIYLIK

8.1. Tomonlar Shartnoma shartlari, Qarz miqdori, foiz stavkasi va tomonlarning moliyaviy ma'lumotlarini uchinchi shaxslarga tomonlarning yozma roziligi yoki qonun talabi asosidagina oshkor qilishi mumkin.
8.2. Ushbu majburiyat Shartnoma to'liq bajarilgandan keyin ham 3 (uch) yil davomida kuchda qoladi.

9. NIZOLARNI HAL ETISH

9.1. Tomonlar o'rtasida yuzaga keladigan har qanday nizo birinchi navbatda muzokaralar orqali 20 (yigirma) kalendar kun ichida hal etilishga harakat qilinadi.
9.2. Muzokara yo'li bilan hal etilmasa, nizo O'zbekiston Respublikasining vakolatli sudida ko'rib chiqiladi.
9.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari tatbiq etiladi.

10. YAKUNIY QOIDALAR

10.1. Ushbu Shartnoma ikki nusxada tuzilgan bo'lib, har bir nusxa teng yuridik kuchga ega.
10.2. Quyidagi hujjatlar Shartnomaning ajralmas qismini tashkil etadi:
— 1-ilova: To'lov jadvali (oylik miqdorlar, foiz va asosiy qarz taqsimoti bilan).
10.3. Shartnomaga har qanday o'zgartirish faqat ikkala tomonning imzolagan yozma qo'shimcha kelishuvi orqali kuchga kiradi.
10.4. Shartnomaning biron-bir bandining haqiqiy emas deb topilishi qolgan bandlarning yuridik kuchini yo'qotmaydi.

11. TOMONLARNING REKVIZITLARI VA IMZOLARI

QARZ BERUVCHI:                              QARZ OLUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
STIR: {{BUYURTMACHI_INN}}                  STIR: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── DAVAL ───────────────────────────────────────────────────────────────────

const DAVAL_STANDART = `DAVAL SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

O'zbekiston Respublikasi Fuqarolik Kodeksining 630-650-moddalari (pudrat), O'zbekiston Respublikasi Soliq kodeksining daval materiallari bilan bog'liq qoidalari va O'zR Moliya vazirligi me'yoriy hujjatlariga muvofiq,

{{BUYURTMACHI}} (STIR: {{BUYURTMACHI_INN}}), keyingi o'rinlarda "Buyurtmachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi, bir tomondan, va

{{IJROCHI}} (STIR: {{IJROCHI_INN}}), keyingi o'rinlarda "Qayta ishlovchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi, ikkinchi tomondan,

birgalikda "Tomonlar" deb atalib, quyidagilar haqida ushbu daval shartnomasi (keyingi o'rinlarda "Shartnoma") ni tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Buyurtmachi Qayta ishlovchiga o'z mulki bo'lgan xom ashyo va materiallarni (keyingi o'rinlarda "Daval material") beradi. Qayta ishlovchi Daval materialni belgilangan texnologiya va texnik talablar asosida qayta ishlab, tayyor mahsulot va qoldiq materiallarni Buyurtmachiga qaytaradi.
1.2. Daval material tavsifi va miqdori:
— Material nomi / turi: {{DAVAL_MATERIAL}}
— Miqdori: {{DAVAL_MIQDOR}} (o'lchov birligi: _________)
— Sifat ko'rsatkichlari: tegishli standartlar yoki texnik shartlarga muvofiq (sifat guvohnomasi bilan tasdiqlanadi)
1.3. Kutilayotgan tayyor mahsulot:
— Mahsulot nomi: {{DAVAL_MAHSULOT}}
— Kutilayotgan miqdor: _________ (o'lchov birligi: _________)
— Qayta ishlash normasi (sarf-me'yor): _______ kg/t/litr xom ashyodan _______ kg/t/litr mahsulot.
1.4. Ushbu Shartnoma bo'yicha mulk huquqi Buyurtmachida qoladi; Daval material Qayta ishlovchining balansiga o'tkazilmaydi.

2. XOMASHYONI TOPSHIRISH VA QABUL QILISH

2.1. Buyurtmachi Daval materialni quyidagi muddatda Qayta ishlovchining ombori/ishlab chiqarish joyiga yetkazib beradi: shartnoma imzolanganidan keyin __________ ish kuni ichida.
2.2. Xom ashyo topshirishda ikki tomonlama qabul-topshiriq dalolatnomasi (MX-1 shakli yoki tomonlar kelishgan shakl) rasmiylashtiriladi; dalolatnomasida miqdor, sifat, og'irlik/hajm, partiya raqami va tekshiruv natijalari ko'rsatiladi.
2.3. Buyurtmachi quyidagi hujjatlarni Daval material bilan birga topshiradi:
— Sifat sertifikati yoki texnik sharti;
— Yuk xati (nakladnoy) yoki yo'l varaqasi;
— Qayta ishlash uchun texnologik yo'riqnoma (agar mavjud bo'lsa).
2.4. Qayta ishlovchi Daval materialni qabul qilgandan keyin 2 (ikki) ish kuni ichida uni alohida omborlash va hisobga olish tartibini ta'minlaydi.
2.5. Qabul chog'ida topilgan sifat yoki miqdor nomuvofiqliklar dalolatnomasida qayd etiladi; bunday hollarda Qayta ishlovchi ishni boshlashdan oldin Buyurtmachining yozma ko'rsatmasini olishi shart.

3. QAYTA ISHLASH MUDDATI VA TARTIBI

3.1. Qayta ishlash boshlanish sanasi: xom ashyo to'liq qabul qilinganidan keyin __________ ish kuni ichida.
3.2. Qayta ishlash yakunlanish muddati: {{DAVAL_MUDDAT}} (xom ashyo qabul qilingan kundan boshlab).
3.3. Qayta ishlash texnologiyasi, parametrlari va sifat talablari ushbu Shartnomaning 1-ilovasi (Texnologik topshiriq) sifatida belgilanadi va ajralmas qismini tashkil etadi.
3.4. Qayta ishlovchi texnologik jarayonda kutilmagan muammolar (xom ashyo sifatsizligi, uskunaning buzilishi va h.k.) yuzaga kelganda 24 soat ichida Buyurtmachiga yozma xabardor qilishi va ko'rsatma olishi shart.
3.5. Muddatni uzaytirish faqat tomonlarning yozma kelishuvi asosida amalga oshiriladi.

4. TAYYOR MAHSULOTNI TOPSHIRISH

4.1. Qayta ishlovchi tayyor mahsulotni (va qaytariladigan qoldiq materiallarni) belgilangan muddat ichida ikki tomonlama qabul-topshiriq dalolatnomasiga asosan Buyurtmachiga topshiradi.
4.2. Qabul-topshiriq dalolatnomasida quyidagilar ko'rsatiladi:
— Tayyor mahsulotning nomi, miqdori, og'irligi va sifat ko'rsatkichlari;
— Qayta ishlashdan chiqqan qoldiq materiallar miqdori (agar qaytarilsa);
— Chiqindi (chiqit) miqdori va yo'q qilish usuli;
— Sarflangan xom ashyo miqdori (me'yoriy va haqiqiy).
4.3. Buyurtmachi tayyor mahsulotni 3 (uch) ish kuni ichida tekshirib qabul qiladi yoki asosli kamchiliklarini yozma ravishda bildiradi.
4.4. Asosli kamchiliklar aniqlanganda Qayta ishlovchi 7 (yetti) ish kuni ichida nuqsonlarni bepul bartaraf etadi (agar xom ashyo sifatiga bog'liq bo'lmasa).

5. QAYTA ISHLASH NARXI VA TO'LOV TARTIBI

5.1. Qayta ishlash xizmati uchun umumiy haq: {{SUMMA}} ({{SUMMA_MATN}}) so'm (QQS qo'shib/qo'shmasdan — keraklisi chiziladi).
5.2. To'lov tartibi:
— Shartnoma imzolanishida avans to'lov (ixtiyoriy): __________ so'm;
— Tayyor mahsulot topshirilgandan va qabul-topshiriq dalolatnomasiga imzo chekishdan keyin 10 (o'n) ish kuni ichida qolgan summa to'liq to'lanadi.
5.3. Barcha to'lovlar Qayta ishlovchining bank hisobvarag'iga naqd pulsiz o'tkazma orqali amalga oshiriladi.
5.4. Qayta ishlash narxiga quyidagilar kiradi: ishchi kuchi, energiya, sarf materiallar va texnik xizmat ko'rsatish. Daval material qiymati narxga kirmaydi.
5.5. Qo'shimcha ishlar (texnologik topshiriqdan tashqari) faqat Buyurtmachining yozma buyurtmasi va narx kelishilgandan keyingina bajariladi.

6. TOMONLARNING HUQUQ VA MAJBURIYATLARI

6.1. Buyurtmachi majburiyatlari:
— Daval materialni belgilangan miqdor, sifat va muddatda topshirish;
— Xom ashyo sifatiga doir hujjatlarni to'liq taqdim etish;
— Qayta ishlash xizmatini belgilangan muddatda to'lash;
— Texnologik topshiriq bo'yicha o'z vaqtida ko'rsatma va ma'lumot berish;
— Xom ashyo xususiyatlari o'zgarsa yoki xavfli tarkib bo'lsa, darhol yozma xabardor qilish.

6.2. Qayta ishlovchi majburiyatlari:
— Daval materialni faqat maqsadli ishlash uchun ishlatish; boshqa buyurtmachilarning materiallari bilan mutlaqo aralashtirmaslik;
— Har bir Buyurtmachi bo'yicha alohida omborni ta'minlash va hisobvaraqni yuritish;
— Daval materialni uning tegishli xususiyatlarini, sifat va miqdorini saqlab qolgan holda saqlash;
— Tayyor mahsulotni belgilangan miqdor va sifatda topshirish;
— Chiqindilarni O'zR qonunchiligi talablariga muvofiq yo'q qilish yoki Buyurtmachiga qaytarish;
— Daval material sarfi bo'yicha hisobot (ishlab chiqarish hisobotini) har topshiruqdan keyin taqdim etish.

6.3. Qayta ishlovchi huquqlari:
— Belgilangan texnologiya doirasida qayta ishlash usullarini mustaqil tanlash;
— Xom ashyo sifati texnik talablarga javob bermasa, ishni to'xtatib, Buyurtmachidan yangi xom ashyo talab qilish;
— To'lov kechiktirilganda, yozma ogohlantirish jo'natilgandan 5 ish kuni o'tgach ishni to'xtatish huquqi.

7. MAS'ULIYAT

7.1. Qayta ishlovchi Daval materialni yo'qotish yoki shikastlash (o'g'irlik, yong'in, texnik baxtsizlik va h.k.) uchun materialni qabul qilgan kundagi bozor qiymatida to'liq moddiy javob beradi.
7.2. Qayta ishlash normalaridan oshiq sarflangan xom ashyo uchun Qayta ishlovchi ortiqcha sarflangan qism qiymatini bozor narxida Buyurtmachiga to'liq qoplashi shart; ortiqcha sarf Buyurtmachi buyurtmasi bo'yicha bo'lmasa.
7.3. Muddatlarni kechiktirganligi uchun Qayta ishlovchi kechiktirilgan har bir kalendar kun uchun qayta ishlash haqining 0,1% miqdorida penya to'laydi.
7.4. Buyurtmachi to'lovni belgilangan muddatdan kechiktirganligi uchun kechiktirilgan har bir kun uchun kechiktirilgan summa miqdorining 0,1% miqdorida penya to'laydi.
7.5. Qayta ishlovchi texnologik jarayonda xavfsizlik qoidalarini buzganligi oqibatida yuzaga keladigan baxtsiz hodisalar va uchinchi shaxslarga etkazilgan zararlar uchun to'liq javob beradi.
7.6. Xom ashyo sifatsizligi Buyurtmachi aybidan bo'lsa va bu mahsulot sifatiga ta'sir qilsa, Qayta ishlovchi bu uchun mas'ul emas; biroq yozma xabardor qilish majburiyati bajarilishi shart.

8. BUXGALTERIYA VA SOLIQ MASALALARI

8.1. Daval materiallar Buyurtmachining balansida hisobga olinadi; Qayta ishlovchi ularni balansdan tashqari hisobda (003-schyot) yuritadi.
8.2. Buyurtmachi tomonidan Qayta ishlovchiga berilayotgan Daval material MX-1 (mol-qabul dalolatnomasi) yoki tomonlar belgilagan shakldagi hujjat asosida rasmiylashtiriladi; odatda QQS hisoblanmaydi (daval material sifatida topshirish QQS bazasiga kiritilmaydi); biroq soliq rejimingizga qarab buxgalteriyangiz bilan kelishib oling.
8.3. Qayta ishlash xizmati uchun to'lov Qayta ishlovchi tomonidan QQS soliq to'lovchisi bo'lsa, QQS qo'shilgan holda hisob-faktura taqdim etiladi.
8.4. Chiqindi va chiqit materiallar ikki tomonlama qabul-topshiriq dalolatnomasida qayd etiladi; agar Buyurtmachiga qaytarilsa, alohida yuk xati bilan rasmiylashtiriladi.
8.5. Har bir topshiruq bo'yicha Qayta ishlovchi quyidagi hujjatlarni taqdim etadi:
— Ishlab chiqarish hisoboti (sarflangan xom ashyo, chiqim me'yori, tayyor mahsulot miqdori);
— Qabul-topshiriq dalolatnomasi;
— QQS to'lovchisi bo'lsa — elektron hisob-faktura (O'zR Soliq kodeksiga muvofiq).

9. MAXFIYLIK VA INTELLEKTUAL MULK

9.1. Tomonlar Shartnoma shartlari, texnologik jarayon, narxlar va ishlab chiqarish hajmlari to'g'risidagi ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladi.
9.2. Qayta ishlovchi Buyurtmachi texnologiyasi va ishlab chiqarish sirlari bo'yicha hech qanday huquq da'vo qilmaydi.
9.3. Ushbu majburiyat Shartnoma muddati tugagandan keyin ham 3 (uch) yil davomida kuchda qoladi.

10. FORS-MAJOR

10.1. Tomonlar nazoratidan tashqaridagi favqulodda holatlar (tabiiy ofat, yong'in tashqaridan, texnogen halokat, epidemiya, davlat organlari tomonidan ishlab chiqarishni to'xtatish) fors-major sifatida tan olinadi.
10.2. Fors-major holati yuzaga kelgan tomon boshqa tomonga 5 (besh) kalendar kun ichida vakolatli organ tomonidan tasdiqlanuvchi hujjat ilova qilingan yozma xabardorlik yuborishi shart.
10.3. Fors-major davomida muddatlar fors-major davom etgan muddat miqdorida uzaytiriladi; penya hisoblanmaydi.
10.4. Fors-major 30 (o'ttiz) kundan ortiq davom etsa, har qaysi tomon Shartnomani jarima va sanksiyalarsiz bekor qilishi mumkin; bajarilgan ishlar hajmiga ko'ra hisob-kitob amalga oshiriladi.

11. NIZOLARNI HAL ETISH

11.1. Tomonlar o'rtasida yuzaga keladigan har qanday nizo birinchi navbatda muzokaralar orqali 20 (yigirma) kalendar kun ichida hal etilishga harakat qilinadi.
11.2. Muzokara yo'li bilan hal etilmasa, nizo O'zbekiston Respublikasining vakolatli iqtisodiy sudida ko'rib chiqiladi.
11.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari tatbiq etiladi.

12. YAKUNIY QOIDALAR

12.1. Ushbu Shartnoma ikki nusxada tuzilgan bo'lib, har bir nusxa teng yuridik kuchga ega.
12.2. Quyidagi hujjatlar Shartnomaning ajralmas qismini tashkil etadi:
— 1-ilova: Texnologik topshiriq (qayta ishlash parametrlari, sarf-me'yorlar);
— 2-ilova: Xom ashyo va tayyor mahsulot sifat talablari.
12.3. Shartnomaga har qanday o'zgartirish yoki qo'shimcha faqat ikkala tomonning imzolagan yozma qo'shimcha kelishuvi orqali kuchga kiradi.
12.4. Shartnomaning biron-bir bandining haqiqiy emas deb topilishi qolgan bandlarning yuridik kuchini yo'qotmaydi.

13. TOMONLARNING REKVIZITLARI VA IMZOLARI

BUYURTMACHI:                                QAYTA ISHLOVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
STIR: {{BUYURTMACHI_INN}}                  STIR: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── XALQARO ─────────────────────────────────────────────────────────────────

const XALQARO_SAVDO = `INTERNATIONAL TRADE CONTRACT / XALQARO SAVDO SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}}                                                   "{{SANA}}"

{{BUYURTMACHI}}, a company incorporated under the laws of the Republic of Uzbekistan, hereinafter the "Buyer", represented by {{BUYURTMACHI_RAHBAR}}, acting under the Charter, on the one part,
{{BUYURTMACHI}}, O'zbekiston Respublikasi qonunlari asosida ro'yxatdan o'tgan, keyingi o'rinlarda "Xaridor" deb yuritilib, Ustav asosida harakat qiluvchi {{BUYURTMACHI_RAHBAR}} vakili, bir tomondan,

and {{IJROCHI}}, a company incorporated under the laws of __________ (davlat/mamlakat), hereinafter the "Seller", represented by {{IJROCHI_RAHBAR}}, acting under the Charter, on the other part,
va {{IJROCHI}}, __________ (davlat/mamlakat) qonunlari asosida ro'yxatdan o'tgan, keyingi o'rinlarda "Sotuvchi" deb yuritilib, Ustav asosida harakat qiluvchi {{IJROCHI_RAHBAR}} vakili, ikkinchi tomondan,

hereinafter jointly referred to as the "Parties", have concluded this Contract as follows:
keyingi o'rinlarda birgalikda "Tomonlar" deb yuritilib, ushbu Shartnomani quyidagicha tuzishdi:

ARTICLE 1. SUBJECT OF CONTRACT / 1-MODDA. SHARTNOMA PREDMETI

1.1. The Seller shall sell and deliver, and the Buyer shall accept and pay for the goods (hereinafter the "Goods") described in the Specification (Annex No. 1), which forms an integral part of this Contract.
Sotuvchi 1-ilovadagi Spesifikatsiyada (ushbu Shartnomaning ajralmas qismi) tavsiflangan tovarni (keyingi o'rinlarda "Tovar") sotadi va yetkazadi; Xaridor esa qabul qilib to'laydi.

1.2. The Goods description, quantity, HS code (TN VED), unit price, and total value are set out in Annex No. 1 (Specification).
Tovarning nomi, miqdori, HS kodi (TN VED), birlik narxi va umumiy qiymati 1-ilovada (Spesifikatsiya) ko'rsatilgan.

1.3. Country of origin of the Goods: _________________________.
Tovarning kelib chiqish mamlakati: _________________________.

ARTICLE 2. QUALITY OF GOODS / 2-MODDA. TOVAR SIFATI

2.1. The Goods shall conform to the quality standards specified in Annex No. 1 and applicable international standards (ISO/IEC/other: _____________), or the Seller's technical documentation submitted to the Buyer prior to shipment.
Tovar 1-ilovada va tegishli xalqaro standartlarda (ISO/IEC/boshqa: _____________) ko'rsatilgan sifat talablariga, yoki jo'natilishidan oldin Xaridorga taqdim etilgan Sotuvchining texnik hujjatlariga muvofiq bo'lishi shart.

2.2. The Seller shall provide with each shipment: Certificate of Quality, Certificate of Conformity (if applicable), and Safety Data Sheet (if applicable).
Har bir jo'natma bilan Sotuvchi quyidagilarni taqdim etadi: Sifat sertifikati, Muvofiqlik sertifikati (zarur holda), Xavfsizlik ma'lumotlar varaqasi (zarur holda).

2.3. The Goods shall be new, unused, and free from any defects — whether patent or latent — at the time of shipment.
Tovar jo'natish vaqtida yangi, ishlatilmagan va oshkor yoki yashirin nuqsonlardan xoli bo'lishi shart.

ARTICLE 3. PRICE AND TOTAL CONTRACT VALUE / 3-MODDA. NARX VA UMUMIY QIYMAT

3.1. The total value of this Contract is {{SUMMA}} {{VALYUTA}} ({{SUMMA_MATN}}). Unit prices are stated in Annex No. 1 in the agreed currency: {{VALYUTA}}.
Ushbu Shartnomaning umumiy qiymati {{SUMMA}} {{VALYUTA}} ({{SUMMA_MATN}}) ni tashkil etadi. Birlik narxlari 1-ilovada kelishilgan valyutada ko'rsatilgan: {{VALYUTA}}.

3.2. Prices are understood as {{INCOTERMS}} (Incoterms(R) 2020) and include all costs up to the agreed delivery point.
Narxlar {{INCOTERMS}} (Incoterms® 2020) asosida tushuniladi va kelishilgan yetkazib berish nuqtasigacha bo'lgan barcha xarajatlarni o'z ichiga oladi.

3.3. Unit prices are fixed and may be revised only by a written amendment signed by both Parties.
Birlik narxlari qat'iy bo'lib, faqat Tomonlar imzolagan yozma qo'shimcha shartnoma orqali o'zgartirilishi mumkin.

ARTICLE 4. DELIVERY TERMS / 4-MODDA. YETKAZIB BERISH SHARTLARI

4.1. Delivery basis: {{INCOTERMS}} (Incoterms(R) 2020). Place of delivery: {{YETKAZISH_JOY}}.
Yetkazib berish asosi: {{INCOTERMS}} (Incoterms® 2020). Yetkazib berish joyi: {{YETKAZISH_JOY}}.

4.2. Delivery period: within _______ calendar days from receipt of advance payment, unless otherwise specified in the Specification.
Yetkazib berish muddati: Spesifikatsiyada boshqacha ko'rsatilmagan bo'lsa, avans to'lovini olganidan _______ kalendar kun ichida.

4.3. Partial shipments are: [ ] Permitted  [ ] Not permitted.
Qisman jo'natmalar: [ ] Ruxsat etiladi  [ ] Ruxsat etilmaydi.

4.4. The Seller shall notify the Buyer in writing at least _______ days prior to the scheduled shipment date, indicating the estimated dispatch date, transport details, and expected arrival date.
Sotuvchi rejalashtirilgan jo'natma sanasidan kamida _______ kun oldin Xaridorni yozma ravishda xabardor qiladi (taxminiy jo'natish sanasi, transport ma'lumotlari va kutilayotgan yetib kelish sanasini ko'rsatgan holda).

ARTICLE 5. PACKING AND MARKING / 5-MODDA. QADOQLASH VA MARKALASH

5.1. The Goods shall be packed in a manner adequate for international transportation, protecting against damage, moisture, and corrosion during transit and storage. Packing type: ________________________.
Tovar xalqaro tashuvga mos tarzda qadoqlanishi kerak, tranzit va saqlash jarayonida shikastlanish, namlik va korroziyadan himoya ta'minlanishi shart. Qadoqlash turi: ________________________.

5.2. Each package shall be marked with the following:
Har bir qadoqda quyidagilar ko'rsatilishi shart:
- Seller's name and address / Sotuvchining nomi va manzili;
- Buyer's name and address / Xaridorning nomi va manzili;
- Contract No. and date / Shartnoma raqami va sanasi;
- Goods name and HS code (TN VED) / Tovar nomi va HS kodi (TN VED);
- Gross and net weight (kg) / Brutto va netto og'irligi (kg);
- Package No. and dimensions (cm) / Qadoq raqami va o'lchamlari (sm);
- Country of origin / Kelib chiqish mamlakati;
- Handling instructions (Fragile / Keep dry / This side up, if applicable) / Ehtiyotkorlik belgilari (zarur holda).

5.3. The Seller shall provide a detailed Packing List for each shipment indicating the contents and weight of each package.
Sotuvchi har bir jo'natma uchun har bir qadoqning tarkibini va og'irligini ko'rsatgan batafsil Qadoqlash ro'yxatini taqdim etadi.

ARTICLE 6. PAYMENT TERMS / 6-MODDA. TO'LOV SHARTLARI

6.1. Payment currency: {{VALYUTA}}. Payment method: {{TOLOV_USULI}}.
To'lov valyutasi: {{VALYUTA}}. To'lov usuli: {{TOLOV_USULI}}.

6.2. Payment schedule / To'lov jadvali:
- ___% advance payment within _____ banking days from signing this Contract;
  ___% avans to'lovi ushbu Shartnomani imzolagan kundan _____ bank ishi kuni ichida;
- ___% balance payment within _____ banking days from the date the Buyer receives all shipping documents listed in Article 7.
  ___% qoldiq to'lov Xaridor 7-moddada ko'rsatilgan barcha yuk hujjatlarini olganidan _____ bank ishi kuni ichida.

6.3. Banking details of the Seller / Sotuvchining bank rekvizitlari:
   Bank name / Bank nomi:              ________________________________
   SWIFT/BIC:                          ________________________________
   IBAN / Account No.:                 ________________________________
   Correspondent bank / Muxbir bank:   ________________________________
   Correspondent SWIFT:                ________________________________
   Address / Manzil:                   ________________________________

6.4. All bank charges in the Seller's country are borne by the Seller; charges in the Buyer's country by the Buyer; third-country charges by _____________.
Sotuvchi mamlakatidagi bank to'lovlari Sotuvchi, Xaridor mamlakatidagisi Xaridor tomonidan; uchinchi mamlakat to'lovlari _____________ tomonidan ko'riladi.

ARTICLE 7. SHIPPING DOCUMENTS / 7-MODDA. YUK HUJJATLARI

7.1. The Seller shall forward the following documents to the Buyer within _______ banking days after the shipment date:
Sotuvchi jo'natma sanasidan _______ bank ishi kuni ichida quyidagi hujjatlarni Xaridorga yuboradi:

(a) Commercial Invoice, 3 originals / Tijorat fakturasi, 3 nusxa original;
(b) Full set of B/L (CMR / Airway Bill / Railway Bill), 3 originals / To'liq yuk xati to'plami, 3 nusxa original;
(c) Packing List, 3 originals / Qadoqlash ro'yxati, 3 nusxa original;
(d) Certificate of Origin, 2 originals / Kelib chiqish sertifikati, 2 nusxa original;
(e) Quality / Conformity Certificate / Sifat / Muvofiqlik sertifikati;
(f) Phytosanitary / Veterinary / Sanitary Certificate (if applicable) / Fitosanitariya / Veterinariya / Sanitariya sertifikati (zarur holda);
(g) Insurance Policy or Certificate, if CIF/CIP / Sug'urta polisi yoki sertifikati, CIF/CIP bo'lsa.

7.2. The Seller shall be liable for any losses caused to the Buyer by late or incorrect submission of shipping documents.
Yuk hujjatlarining kechiktirib yoki noto'g'ri taqdim etilishi sababli Xaridor ko'rgan zararlar uchun Sotuvchi javobgar bo'ladi.

ARTICLE 8. ACCEPTANCE OF GOODS / 8-MODDA. TOVARNI QABUL QILISH

8.1. Upon arrival at destination, the Buyer shall inspect the Goods for quantity and quality within _______ calendar days.
Tovar belgilangan joyga yetib kelganida, Xaridor _______ kalendar kun ichida miqdor va sifat jihatidan tekshiradi.

8.2. Acceptance for quantity: based on B/L (CMR) and Packing List. Acceptance for quality: based on Quality Certificate and Specification.
Miqdor bo'yicha qabul: B/L (CMR) va Qadoqlash ro'yxatiga asosan. Sifat bo'yicha qabul: Sifat sertifikati va Spesifikatsiyaga asosan.

8.3. In case of discrepancies, the Buyer shall invite a representative of an independent inspection company or the competent Chamber of Commerce to witness the inspection; a bilateral (or trilateral) act shall be drawn up.
Nomuvofiqlik aniqlansa, Xaridor mustaqil ekspertiza kompaniyasi yoki vakolatli Savdo-sanoat palatasi vakilini taklif qiladi; ikki tomonlama (yoki uch tomonlama) dalolatnoma tuziladi.

8.4. Goods shall be deemed accepted if no written claim is submitted within the periods specified in Article 9.
9-moddada belgilangan muddatlarda yozma reklamatsiya berilmasa, Tovar qabul qilingan hisoblanadi.

ARTICLE 9. CLAIMS / 9-MODDA. REKLAMATSIYALAR

9.1. Claims for quantity discrepancies: within 20 (twenty) calendar days from the date of arrival of the Goods at destination.
Miqdor bo'yicha reklamatsiyalar: Tovar belgilangan joyga yetib kelganidan 20 (yigirma) kalendar kun ichida.

9.2. Claims for quality defects: within 20 (twenty) calendar days from the date of discovery of the defect, but no later than the warranty period expiry.
Sifat kamchiliklari bo'yicha reklamatsiyalar: Kamchilik aniqlangan kundan 20 (yigirma) kalendar kun ichida, ammo kafolat muddati tugashidan kech bo'lmagan holda.

9.3. Each claim shall be in writing and accompanied by: survey/inspection act, photographs, and supporting documents.
Har bir reklamatsiya yozma shaklda bo'lib, quyidagilar bilan birga taqdim etiladi: ekspertiza/tekshiruv dalolatnomasi, fotosuratar va qo'llab-quvvatlovchi hujjatlar.

9.4. The Seller shall respond to a claim within 20 (twenty) calendar days of its receipt.
Sotuvchi reklamatsiyani olgandan 20 (yigirma) kalendar kun ichida javob beradi.

9.5. If a quality claim is acknowledged, the Seller shall, at its option: (a) replace the defective Goods; (b) remedy the defects; or (c) reduce the price proportionally.
Sifat reklamatsiyasi tan olinsa, Sotuvchi o'z xohishiga ko'ra: (a) nuqsonli Tovarni almashtiradi; (b) kamchiliklarni bartaraf etadi; yoki (c) narxni mutanosib ravishda kamaytiradi.

ARTICLE 10. SANCTIONS AND LIABILITY / 10-MODDA. SANKSIYALAR VA JAVOBGARLIK

10.1. For late delivery, the Seller shall pay a penalty of ___% of the undelivered Goods value per day of delay, not exceeding ___% of the total Contract value.
Kechiktirilgan yetkazib berish uchun Sotuvchi har kechikish kuni uchun yetkazilmagan Tovar qiymatining ___%ini to'laydi, ammo bu miqdor Shartnoma umumiy qiymatining ___%idan oshmaydi.

10.2. For late payment, the Buyer shall pay a penalty of ___% of the overdue amount per day of delay.
Kechiktirilgan to'lov uchun Xaridor har kechikish kuni uchun muddati o'tgan summaning ___%ini to'laydi.

10.3. Payment of penalties shall not release the Parties from their contractual obligations.
Jarimalarni to'lash Tomonlarni shartnomaviy majburiyatlarini bajarishdan ozod etmaydi.

ARTICLE 11. FORCE MAJEURE / 11-MODDA. FORS-MAJOR

11.1. Neither Party shall be liable for full or partial non-performance of obligations if caused by force majeure: acts of God, war, blockade, embargo, epidemic, government prohibition, or other extraordinary circumstances beyond the Parties' control.
Majburiyatlarni to'liq yoki qisman bajarolmaslik uchun hech bir Tomon javobgar bo'lmaydi, agar bu fors-major holatlaridan kelib chiqsa: tabiiy ofat, urush, blokada, embargo, epidemiya, hukumat taqiqi yoki Tomonlar nazoratidan tashqaridagi favqulodda holatlar.

11.2. The affected Party shall notify the other Party in writing within 10 (ten) calendar days of the onset of force majeure, attaching a certificate from the competent authority (Chamber of Commerce, government body, or similar).
Jabrlanuvchi Tomon fors-major boshlanganidan 10 (o'n) kalendar kun ichida vakolatli organ (Savdo-sanoat palatasi, davlat idorasi yoki shunga o'xshash) tasdiqnomasini ilova qilib, boshqa Tomonga yozma xabarnoma beradi.

11.3. If force majeure continues for more than 90 (ninety) calendar days, either Party may terminate this Contract by giving 10 days written notice, with no liability for damages.
Fors-major 90 (to'qson) kalendar kundan ortiq davom etsa, har qaysi Tomon 10 kunlik yozma ogohlantirish bilan ushbu Shartnomani hech qanday zarar to'lamasdan bekor qilish huquqiga ega.

ARTICLE 12. DISPUTE RESOLUTION / 12-MODDA. NIZOLARNI HAL ETISH

12.1. All disputes arising from or in connection with this Contract shall first be resolved by good-faith negotiations within 30 (thirty) calendar days from receipt of a written claim.
Ushbu Shartnomadan kelib chiqadigan barcha nizolar avvalo yozma da'vo olinganidan 30 (o'ttiz) kalendar kun ichida yaxshi niyatli muzokaralar orqali hal qilinadi.

12.2. If no resolution is reached, disputes shall be finally settled by arbitration:
Hal qilinmasa, nizolar quyidagi arbitraj tomonidan yakuniy ravishda hal etiladi:
[ ] ICC International Court of Arbitration (Paris), under ICC Rules / ICC Xalqaro Arbitraj Sudi (Paris), ICC Qoidalari bo'yicha;
[ ] UNCITRAL Arbitration Rules, ______ arbitrators, seated in _____________ / UNCITRAL Qoidalari, ______ arbitr, o'rni: _____________;
[ ] Tashkent International Arbitration Centre (TIAC) / Toshkent Xalqaro Arbitraj Markazi (TXAM).

12.3. Language of arbitration proceedings: _____________.
Arbitraj tili: _____________.

12.4. This Contract is governed by the UN Convention on Contracts for the International Sale of Goods (CISG, Vienna, 1980); matters not regulated by CISG are governed by the substantive law of _________________________.
Ushbu Shartnoma BMT Xalqaro Tovarlarni Sotib Olish-Sotish Shartnomalariga oid Konventsiyasi (CISG, Vena, 1980) bilan tartibga solinadi; CISG tartibga solmagan masalalarda _________________________ moddiy huquqi qo'llaniladi.

ARTICLE 13. CONFIDENTIALITY / 13-MODDA. MAXFIYLIK

13.1. The Parties shall keep confidential all information received in connection with this Contract and shall not disclose it to third parties without prior written consent of the other Party, except as required by applicable law.
Tomonlar ushbu Shartnoma bilan bog'liq barcha ma'lumotlarni maxfiy saqlaydi va amaldagi qonun talab qilgan hollar bundan mustasno, boshqa Tomon yozma roziligisiz uchinchi shaxslarga oshkor qilmaydi.

13.2. This confidentiality obligation survives termination or expiry of this Contract for 3 (three) years.
Ushbu maxfiylik majburiyati Shartnoma bekor qilingan yoki muddati tugaganidan 3 (uch) yil davomida kuchda qoladi.

ARTICLE 14. VALIDITY AND FINAL PROVISIONS / 14-MODDA. AMAL MUDDATI VA YAKUNIY QOIDALAR

14.1. This Contract enters into force upon signing by both Parties and remains valid until full performance of all obligations, unless terminated earlier in accordance with its terms.
Ushbu Shartnoma Tomonlar imzolaganidan kuchga kiradi va barcha majburiyatlar to'liq bajarilgunga qadar, agar shartlariga muvofiq avvalroq bekor qilinmasa, amal qiladi.

14.2. Any amendments to this Contract shall be valid only if made in writing and signed by duly authorized representatives of both Parties.
Ushbu Shartnomaga har qanday o'zgartirishlar faqat yozma shaklda va Tomonlarning vakolatli vakillari imzolagan bo'lsa kuchga ega.

14.3. This Contract is made in 4 (four) original copies: 2 (two) in English and 2 (two) in Uzbek, each having equal legal force. In case of discrepancies between the texts, the ____________ text shall prevail.
Ushbu Shartnoma 4 (to'rt) nusxada tuziladi: 2 (ikki) nusxa ingliz va 2 (ikki) nusxa o'zbek tilida; barchasi teng yuridik kuchga ega. Matnlar o'rtasida nomuvofiqlik bo'lsa, ____________ tili ustun turadi.

14.4. Annex No. 1 (Specification) forms an integral part of this Contract.
1-ilova (Spesifikatsiya) ushbu Shartnomaning ajralmas qismi hisoblanadi.

14.5. Notices shall be deemed delivered if sent by: (a) courier with acknowledgment of receipt; (b) registered mail with return receipt; (c) email with read receipt — to the addresses in Article 15.
Xabarnomalar quyidagilar orqali yuborilib, yetkazilgan hisoblanadi: (a) qabul tasdiqnomasi bilan kuryer; (b) qaytarma tilxat bilan ro'yxatdan o'tkazilgan pochta; (c) o'qilganligi tasdiqlanishi bilan elektron pochta — 15-moddadagi manzillarga.

ARTICLE 15. PARTIES' DETAILS / 15-MODDA. TOMONLARNING REKVIZITLARI

BUYER / XARIDOR:                              SELLER / SOTUVCHI:
{{BUYURTMACHI}}                               {{IJROCHI}}
Registration No.:                             Registration No.:
________________________                      ________________________
Address / Manzil:                             Address / Manzil:
________________________                      ________________________
Tel / Fax:                                    Tel / Fax:
________________________                      ________________________
Email:                                        Email:
________________________                      ________________________
Bank / Bank:                                  Bank / Bank:
________________________                      ________________________
SWIFT/BIC:                                    SWIFT/BIC:
________________________                      ________________________
Account No. / IBAN:                           Account No. / IBAN:
________________________                      ________________________
INN/TIN: {{BUYURTMACHI_INN}}                 INN/TIN: {{IJROCHI_INN}}
Director: {{BUYURTMACHI_RAHBAR}}              Director: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}     ________________ / {{IJROCHI_RAHBAR}}
         SEAL / M.O.                                   SEAL / M.O.

──────────────────────────────────────────────────────────────────────────────
ANNEX No. 1 / 1-ILOVA — SPECIFICATION / SPESIFIKATSIYA
to Contract No. {{RAQAM}} dated {{SANA}} / {{RAQAM}}-sonli {{SANA}} Shartnomaga
──────────────────────────────────────────────────────────────────────────────

No. | Goods name / Tovar nomi | HS Code (TN VED) | Unit / Birlik | Qty / Miqdor | Unit price {{VALYUTA}} | Total {{VALYUTA}}
----|-------------------------|------------------|---------------|--------------|------------------------|------------------
 1. |                         |                  |               |              |                        |
 2. |                         |                  |               |              |                        |

TOTAL / JAMI: {{SUMMA}} {{VALYUTA}}

Delivery basis / Yetkazib berish asosi: {{INCOTERMS}} (Incoterms(R) 2020)
Place of delivery / Yetkazib berish joyi: {{YETKAZISH_JOY}}

Buyer / Xaridor: _______________________     Seller / Sotuvchi: _______________________`

// ─── BOSHQA ──────────────────────────────────────────────────────────────────

const HAMKORLIK_SHARTNOMA = `HAMKORLIK SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

O'zbekiston Respublikasi Fuqarolik Kodeksining 26-27-moddalari (tadbirkorlik faoliyati), 353-moddasi (shartnoma erkinligi) va amaldagi qonunchilikka muvofiq,

{{BUYURTMACHI}} (STIR: {{BUYURTMACHI_INN}}), keyingi o'rinlarda "1-Tomon" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi, bir tomondan, va

{{IJROCHI}} (STIR: {{IJROCHI_INN}}), keyingi o'rinlarda "2-Tomon" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi, ikkinchi tomondan,

birgalikda "Tomonlar" deb atalib, o'zaro hamkorlik to'g'risida ushbu shartnoma (keyingi o'rinlarda "Shartnoma") ni tuzdilar:

1. HAMKORLIK PREDMETI VA MAQSADI

1.1. Tomonlar quyidagi soha(lar)da o'zaro uzoq muddatli hamkorlikni yo'lga qo'yishga qaror qildilar:
— Hamkorlik sohasi: ___________________________________
— Loyiha/faoliyat nomi: _______________________________
1.2. Hamkorlikning asosiy maqsadi: umumiy foyda olish, bozor imkoniyatlarini kengaytirish, iqtisodiy samaradorlikni oshirish va tomonlarning raqobatbardoshligini mustahkamlash.
1.3. Hamkorlik doirasida amalga oshiriladigan alohida loyihalar, ishlar yoki tadbirlar tomonlarning yozma kelishuvi (qo'shimcha shartnoma yoki protokol) bilan belgilanadi va ushbu Shartnomaning ajralmas qismi hisoblanadi.
1.4. Ushbu Shartnoma tomonlar o'rtasida alohida yuridik shaxs (qo'shma korxona) tuzilishini nazarda tutmaydi; har bir Tomon o'z faoliyatini mustaqil amalga oshirishda davom etadi.

2. TOMONLARNING VAZIFALARI VA HISSASI

2.1. 1-Tomon zimmasidagi asosiy vazifalar va hissa:
— ___________________________________
— ___________________________________
2.2. 2-Tomon zimmasidagi asosiy vazifalar va hissa:
— ___________________________________
— ___________________________________
2.3. Har bir Tomon o'z vazifalari bajarilishi uchun zarur resurslarni (moliyaviy, moddiy, mehnat) o'z hisobidan ta'minlaydi.
2.4. Biror vazifa bajarilishi qo'shimcha muvofiqlashuvni talab qilsa, Tomonlar 5 (besh) ish kuni ichida yozma ravishda kelishib oladilar.

3. MOLIYAVIY SHARTLAR VA FOYDA TAQSIMOTI

3.1. Hamkorlik bo'yicha umumiy loyiha qiymati (agar belgilangan bo'lsa): {{SUMMA}} ({{SUMMA_MATN}}) so'm.
3.2. Investitsiyalar va xarajatlarni taqsimlash nisbati:
— 1-Tomon ulushi: _______%
— 2-Tomon ulushi: _______%
3.3. Hamkorlik natijasida olingan foyda (daromad) taqsimlash nisbati:
— 1-Tomon: _______%
— 2-Tomon: _______%
3.4. Moliyaviy hisob-kitob tartibi: oyda bir marta, har oyning ________ sanasida tomonlarning vakolatli vakillari tomonidan imzolangan moliyaviy hisobot asosida amalga oshiriladi.
3.5. Umumiy xarajatlar (agar mavjud bo'lsa) faqat ikkala Tomon imzolagan xarajatlar ro'yxati yoki smeta asosida qoplanadi.
3.6. Har bir Tomon o'z faoliyatiga oid soliq majburiyatlarini (QQS, daromad solig'i, ijtimoiy to'lovlar) mustaqil ravishda bajaradi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Har bir Tomon majburiyatlari:
— O'z zimmasidagi vazifalarni sifatli va o'z vaqtida bajarish;
— Hamkorlikni amalga oshirish uchun zarur ma'lumotlar, hujjatlar va resurslarni o'z vaqtida taqdim etish;
— Boshqa Tomon manfaatlariga zarar yetkazadigan harakatlardan saqlanish;
— Muhim qarorlar qabul qilishdan oldin boshqa Tomon bilan oldindan kelishish;
— O'z faoliyatida amaldagi qonunchilik talablariga to'liq rioya qilish;
— Hamkorlik doirasidagi moliyaviy operatsiyalar bo'yicha shaffof hisobdorlikni ta'minlash.

4.2. Har bir Tomon huquqlari:
— Hamkorlik faoliyatining borishi haqida to'liq va ishonchli ma'lumot olish;
— Umumiy xarajatlar va daromadlar hisobini tekshirish (audit o'tkazish);
— Hamkorlik doirasida qabul qilinayotgan muhim qarorlarda ishtirok etish;
— Ushbu Shartnomada belgilangan tartibda Shartnomadan chiqish.

5. INTELLEKTUAL MULK

5.1. Hamkorlik doirasida birgalikda yaratilgan intellektual mulk ob'ektlari (ixtiro, dizayn, dasturiy ta'minot, brend va h.k.) Tomonlarga kelishilgan ulushda (3.3-bandda belgilangan nisbatda) tegishli bo'ladi; alohida kelishuv bo'lmasa teng ulushda.
5.2. Hamkorlikdan oldin har bir Tomon mustaqil yaratgan yoki egalik qilgan intellektual mulk ob'ektlari Shartnoma muddatida ham o'sha Tomonga tegishli bo'lib qoladi.
5.3. Hamkorlik natijasida yaratilgan intellektual mulk ob'ektlaridan foydalanish, litsenziya berish yoki uchinchi shaxslarga o'tkazish faqat ikkala Tomon yozma kelishuvi asosida amalga oshiriladi.
5.4. Shartnoma muddati tugaganda yoki bekor qilinganda, birgalikda yaratilgan intellektual mulk ob'ektlari bo'yicha tomonlar alohida hujjat rasmiylashtirib, huquqlarni mustahkamlaydi.

6. MAXFIYLIK

6.1. Tomonlar hamkorlik davomida olgan barcha tijorat sirlari, texnologiyalar, mijozlar bazasi, moliyaviy ko'rsatkichlar, ichki jarayonlar va boshqa maxfiy ma'lumotlarni (keyingi o'rinlarda "Maxfiy ma'lumot") uchinchi shaxslarga faqat tomonlarning yozma roziligi yoki qonun talabi asosida oshkor qilishi mumkin.
6.2. Tomonlar Maxfiy ma'lumotni faqat ushbu Shartnoma maqsadlari uchun ishlatadi.
6.3. Ushbu majburiyat Shartnoma muddati tugagandan keyin ham 5 (besh) yil davomida kuchda qoladi.
6.4. Maxfiylik majburiyatini buzganlik uchun aybdor Tomon etkazilgan zararni (to'g'ri zarar va foyda ko'rilmagan zarar) to'liq qoplash majburiyatini oladi.

7. MAS'ULIYAT

7.1. Tomonlardan biri o'z zimmasidagi vazifalarni bajarmaslik yoki kech bajarish oqibatida boshqa Tomonga zarar yetkazsa, aybdor Tomon etkazilgan to'g'ri zararni va isbotlangan foyda ko'rilmagan zararni to'liq qoplash majburiyatini oladi.
7.2. Tomonlardan biri moliyaviy majburiyatlarini (hissa kiritish, xarajatlarni qoplash) belgilangan muddatdan kechiktirganligi uchun kechiktirilgan har bir kalendar kun uchun kechiktirilgan summa miqdorining 0,1% miqdorida penya to'laydi.
7.3. Tomonlardan birining xatoligi tufayli Shartnomadan manfaat ko'rilmagan taqdirda, aybdor Tomon yo'qotilgan daromadni tomonlar kelishgan tartibda qoplaydi.

8. SHARTNOMANING AMAL QILISH MUDDATI

8.1. Shartnoma imzolanganidan boshlab kuchga kiradi va 1 (bir) yil amal qiladi.
8.2. Shartnoma muddati tugashidan 30 (o'ttiz) kun oldin tomonlardan biri yozma ravishda e'tiroz bildirmasa, Shartnoma xuddi shu shartlarda yana 1 (bir) yilga avtomatik uzaytiriladi.
8.3. Tomonlardan biri Shartnomani muddatidan oldin bekor qilmoqchi bo'lsa, boshqa Tomonga kamida 30 (o'ttiz) kalendar kun oldin yozma ogohlantirish yuborishi shart.
8.4. Shartnomani muddatidan oldin bekor qilishda Tomonlar quyidagilarni amalga oshiradi:
— Bajarilgan va hisob-kitob qilinmagan ishlar bo'yicha yakuniy hisob-kitob;
— Birgalikda yaratilgan intellektual mulk bo'yicha huquqlarni belgilash;
— Maxfiy ma'lumotlarga oid hujjatlarni qaytarish yoki yo'q qilish.

9. FORS-MAJOR

9.1. Tomonlar nazoratidan tashqaridagi favqulodda holatlar (tabiiy ofat, epidemiya, urush holati, davlat organlari tomonidan faoliyatni to'xtatish) fors-major sifatida tan olinadi.
9.2. Fors-major holati yuzaga kelgan Tomon boshqa Tomonga 5 (besh) kalendar kun ichida vakolatli organ tasdiqlovchi hujjat ilova qilingan yozma xabardorlik yuborishi shart.
9.3. Fors-major davomida majburiyatlarni bajarish muddatlari fors-major davom etgan muddat miqdorida uzaytiriladi; penya hisoblanmaydi.
9.4. Fors-major 60 (oltmish) kundan ortiq davom etsa, har qaysi Tomon Shartnomani jarima va sanksiyalarsiz bekor qilishi mumkin.

10. NIZOLARNI HAL ETISH

10.1. Tomonlar o'rtasida yuzaga keladigan har qanday nizo birinchi navbatda muzokaralar orqali 30 (o'ttiz) kalendar kun ichida hal etilishga harakat qilinadi.
10.2. Muzokara yo'li bilan hal etilmasa, nizo O'zbekiston Respublikasining vakolatli iqtisodiy sudida ko'rib chiqiladi.
10.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari tatbiq etiladi.

11. YAKUNIY QOIDALAR

11.1. Ushbu Shartnoma ikki nusxada tuzilgan bo'lib, har bir nusxa teng yuridik kuchga ega.
11.2. Shartnomaga barcha ilovalar va qo'shimcha kelishuvlar uning ajralmas qismini tashkil etadi.
11.3. Shartnomaga har qanday o'zgartirish yoki qo'shimcha faqat ikkala Tomon vakillari imzolagan yozma qo'shimcha kelishuv orqali kuchga kiradi.
11.4. Shartnomaning biron-bir bandining haqiqiy emas deb topilishi qolgan bandlarning yuridik kuchini yo'qotmaydi.

12. TOMONLARNING REKVIZITLARI VA IMZOLARI

1-TOMON:                                    2-TOMON:
{{BUYURTMACHI}}                             {{IJROCHI}}
STIR: {{BUYURTMACHI_INN}}                  STIR: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const VOSITACHILIK_SHARTNOMA = `VOSITACHILIK (AGENTLIK) SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

O'zbekiston Respublikasi Fuqarolik Kodeksining 817-828-moddalari (topshiriq shartnomasi — FK 817, komissiya shartnomasi — FK 820) asosida (eslatma: O'zR FK da mustaqil "agentlik shartnomasi" instituti mavjud emas; ushbu shartnoma topshiriq yoki komissiya sifatida rasmiylashtirilib, tegishli modda tanlanadi),

{{BUYURTMACHI}} (STIR: {{BUYURTMACHI_INN}}), keyingi o'rinlarda "Prinsipal" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan harakat qiluvchi, bir tomondan, va

{{IJROCHI}} (STIR: {{IJROCHI_INN}}), keyingi o'rinlarda "Agent" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan harakat qiluvchi, ikkinchi tomondan,

birgalikda "Tomonlar" deb atalib, quyidagilar haqida ushbu agentlik shartnomasi (keyingi o'rinlarda "Shartnoma") ni tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Prinsipal Agent ga quyidagi topshiriqlarni (yuridik va boshqa harakatlarni) bajarish vakolatini beradi:
— Topshiriq turi: ___________________________________
— Harakatlar doirasi: ___________________________________
— Bozor hududi / geografiyasi: ___________________________________
1.2. Agent harakat qilish usuli (keraklisi chiziladi):
— Prinsipal nomidan va Prinsipal hisobidan (vakillik — FK 817-moddasi); yoki
— O'z nomidan, lekin Prinsipal hisobidan (komissiya — FK 820-moddasi).
1.3. Agent Prinsipal nomidan yoki hisobidan tuzgan bitimlarning huquqiy oqibatlari to'g'ridan-to'g'ri Prinsipalga tegishli bo'ladi (1.2-bandning birinchi turi bo'lsa); o'z nomidan tuzgan bitimlar uchun Agent shaxsan javob beradi, keyin Prinsipalga o'tkazadi (ikkinchi tur bo'lsa).
1.4. Agent vakolati ushbu Shartnomaga ilova qilingan ishonchnoma (2-ilova) bilan tasdiqlanadi; ishonchnomaning kuchi va muddati belgilangan vakolat doirasida chegaralanadi.

2. AGENTLIK HAQI VA TO'LOV TARTIBI

2.1. Agentlik haqi hisoblash usuli (keraklisi chiziladi):
— Tuzilgan har bir bitim summasining _______ % miqdorida komissiya; yoki
— Oy uchun belgilangan miqdor: __________ so'm; yoki
— Har bir bajarilgan topshiriq uchun: __________ so'm.
2.2. Shartnoma muddati uchun taxminiy umumiy agentlik haqi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.3. To'lov tartibi: Agent oyning oxirida hisobot va hisob-faktura taqdim etgandan keyin 5 (besh) ish kuni ichida Prinsipal agentlik haqini Agent ning bank hisobvarag'iga o'tkazadi.
2.4. Agent ning asoslantirilgan va hujjatlashtirilgan xarajatlari (yo'l, mehmonxona, xabar berish xarajatlari) Prinsipal tomonidan belgilangan cheklov doirasida qoplanadi: oylik __________ so'm gacha.
2.5. Agentlik haqi Agent tomonidan to'g'ridan-to'g'ri uchinchi shaxslardan olingan summalardan ushlab qolish huquqini beradi; Prinsipalga qolgan summa 3 (uch) ish kuni ichida o'tkaziladi.

3. AGENT NING HISOBDORLIGI

3.1. Agent har oyning __________ sanasida Prinsipalga quyidagilarni o'z ichiga olgan yozma hisobot taqdim etadi:
— Bajarilgan topshiriqlar ro'yxati (sana, summa, kontragent nomi);
— Tuzilgan shartnomalar va bitimlarning nusxalari;
— Uchinchi shaxslardan olingan va Prinsipalga o'tkazilgan summalar;
— Sarflangan xarajatlar va ularni tasdiqlovchi hujjatlar.
3.2. Prinsipal hisobotni olgandan keyin 5 (besh) ish kuni ichida uni tasdiqlaydi yoki asosli e'tirozini yozma ravishda bildiradi; e'tiroz bildirmasa hisobot tasdiqlangan hisoblanadi.
3.3. Agent uchinchi shaxslardan tushgan barcha to'lovlarni (Prinsipal hisob-varag'i ko'rsatilgan bo'lsa, bevosita; aks holda o'z hisobiga) 3 (uch) ish kuni ichida Prinsipalga to'liq o'tkazadi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Agent majburiyatlari:
— Prinsipalning manfaatlarini ko'zlab va ko'rsatmalariga muvofiq harakat qilish;
— Faqat belgilangan vakolat doirasida ish tutish; vakolat doirasidan chiqish uchun Prinsipalning oldindan yozma roziligini olish;
— Har oy hisobot taqdim etish va to'lovlarni o'z vaqtida o'tkazish;
— Prinsipalning tijorat sirlarini, mijozlar bazasini va boshqa maxfiy ma'lumotlarini saqlash;
— Prinsipal manfaatlariga zid bo'lgan raqobatchilar bilan Shartnoma muddatida hamkorlik qilmaslik;
— Prinsipaldan olingan hujjatlar, tovarlar va mablag'larni ehtiyotkorlik bilan saqlash.

4.2. Prinsipal majburiyatlari:
— Agent faoliyati uchun zarur bo'lgan hujjatlar, ma'lumotlar, vakolat va resurslarni o'z vaqtida taqdim etish;
— Agent ning asoslantirilgan tavsiyalarini ko'rib chiqish va o'z vaqtida ko'rsatma berish;
— Agentlik haqini va tasdiqlangan xarajatlarni belgilangan muddatda to'lash;
— Agent vakolati doirasida tuzgan bitimlarini bajarish;
— Agent faoliyatiga sababsiz aralashmaslik.

4.3. Agent huquqlari:
— Vakolat doirasida uchinchi shaxslar bilan bitimlar tuzish;
— Prinsipal ko'rsatmalariga zid bo'lgan topshiriqlarni bajarishdan bosh tortish;
— Agentlik haqini va xarajatlarini o'z vaqtida olish;
— Prinsipaldan zarur ko'rsatma va ma'lumot talab qilish.

5. SUBAGENTLIK

5.1. Agent Prinsipalning oldindan yozma roziligisiz subagent jalb qilish huquqiga ega emas (O'zR FK 823-moddasi).
5.2. Subagent jalb qilingan taqdirda ham Prinsipal oldidagi barcha majburiyatlar va javobgarlik Agent zimmasida qoladi.
5.3. Subagentlik shartnomasi shartlari ushbu Shartnoma shartlaridan yumshoqroq bo'lishi mumkin emas.

6. RAQOBAT TAQIQI

6.1. Shartnoma muddatida Agent ushbu Shartnomada belgilangan soha va hududda Prinsipalning bevosita raqobatchilari bilan shunga o'xshash agentlik shartnomasi tuzishi mumkin emas; bundan mustasno — Prinsipalning yozma roziligini olganda.
6.2. Raqobat taqiqi Shartnoma muddati tugagandan keyin ________ oy davomida ham kuchda qoladi.

7. MAS'ULIYAT

7.1. Agent vakolat doirasidan chiqib tuzgan bitimlar uchun Agent shaxsan javob beradi; Prinsipal bunday bitimlarni tasdiqlashga majbur emas.
7.2. Agent uchinchi shaxslardan olgan pul va mol-mulkni belgilangan muddatda Prinsipalga o'tkazmasa, kechiktirilgan har bir kun uchun kechiktirilgan summa miqdorining 0,1% miqdorida penya to'laydi.
7.3. Prinsipal agentlik haqini belgilangan muddatdan kechiktirganligi uchun kechiktirilgan har bir kun uchun kechiktirilgan summa miqdorining 0,1% miqdorida penya to'laydi.
7.4. Agent maxfiylik majburiyatini buzganlik uchun etkazilgan barcha zararni (to'g'ri zarar, foyda ko'rilmagan zarar, obro' zararini) qoplash majburiyatini oladi.
7.5. Tomonlardan biri Shartnomani asossiz ravishda muddatidan oldin bekor qilsa, boshqa Tomonga 2 (ikki) oylik agentlik haqiga teng miqdorda kompensatsiya to'laydi.

8. SHARTNOMANING AMAL QILISH MUDDATI

8.1. Shartnoma imzolanganidan boshlab kuchga kiradi va _______ oy (yil) amal qiladi.
8.2. Shartnoma muddati tugashidan 30 (o'ttiz) kun oldin tomonlardan biri yozma ravishda e'tiroz bildirmasa, Shartnoma xuddi shu shartlarda yana 12 (o'n ikki) oyga avtomatik uzaytiriladi.
8.3. Tomonlardan biri Shartnomani muddatidan oldin bekor qilmoqchi bo'lsa, boshqa Tomonga kamida 30 (o'ttiz) kalendar kun oldin yozma ogohlantirish yuborishi shart.
8.4. Shartnoma bekor qilinganda Agent tugallanmagan topshiriqlar bo'yicha hisobot taqdim etadi; Prinsipal hisob-kitobni 10 (o'n) ish kuni ichida amalga oshiradi.

9. FORS-MAJOR

9.1. Tomonlar nazoratidan tashqaridagi favqulodda holatlar (tabiiy ofat, epidemiya, urush holati, davlat organlari tomonidan faoliyatni to'xtatish) fors-major sifatida tan olinadi.
9.2. Fors-major holati yuzaga kelgan Tomon boshqa Tomonga 5 (besh) kalendar kun ichida vakolatli organ tasdiqlovchi hujjat ilova qilingan yozma xabardorlik yuborishi shart.
9.3. Fors-major davomida majburiyatlarni bajarish muddatlari uzaytiriladi; penya hisoblanmaydi.

10. MAXFIYLIK

10.1. Tomonlar Shartnoma shartlari, agentlik haqi, mijozlar bazasi, tijorat sirlari va boshqa maxfiy ma'lumotlarni uchinchi shaxslarga faqat tomonlarning yozma roziligi yoki qonun talabi asosida oshkor qilishi mumkin.
10.2. Ushbu majburiyat Shartnoma muddati tugagandan keyin ham 3 (uch) yil davomida kuchda qoladi.

11. NIZOLARNI HAL ETISH

11.1. Tomonlar o'rtasida yuzaga keladigan har qanday nizo birinchi navbatda muzokaralar orqali 20 (yigirma) kalendar kun ichida hal etilishga harakat qilinadi.
11.2. Muzokara yo'li bilan hal etilmasa, nizo O'zbekiston Respublikasining vakolatli iqtisodiy sudida ko'rib chiqiladi.
11.3. Shartnomaga O'zbekiston Respublikasining amaldagi qonunlari tatbiq etiladi.

12. YAKUNIY QOIDALAR

12.1. Ushbu Shartnoma ikki nusxada tuzilgan bo'lib, har bir nusxa teng yuridik kuchga ega.
12.2. Quyidagi hujjatlar Shartnomaning ajralmas qismini tashkil etadi:
— 1-ilova: Topshiriqlar ro'yxati va bajarish ko'rsatmalari;
— 2-ilova: Ishonchnoma (Agent vakolati).
12.3. Shartnomaga har qanday o'zgartirish faqat ikkala Tomon vakillari imzolagan yozma qo'shimcha kelishuvi orqali kuchga kiradi.
12.4. Shartnomaning biron-bir bandining haqiqiy emas deb topilishi qolgan bandlarning yuridik kuchini yo'qotmaydi.

13. TOMONLARNING REKVIZITLARI VA IMZOLARI

PRINSIPAL:                                  AGENT:
{{BUYURTMACHI}}                             {{IJROCHI}}
STIR: {{BUYURTMACHI_INN}}                  STIR: {{IJROCHI_INN}}
Manzil: ___________________________        Manzil: ___________________________
Bank: _____________________________        Bank: _____________________________
H/r: ______________________________        H/r: ______________________________
MFO: ______________________________        MFO: ______________________________
Tel: ______________________________        Tel: ______________________________
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── DEFAULT TEMPLATES ARRAY ─────────────────────────────────────────────────

export const DEFAULT_TEMPLATES: AppTemplate[] = [
  // ── OLDI-SOTDI ──
  {
    id: 'dt-oldi-01',
    type: 'oldi_sotdi',
    name: 'Standart oldi-sotdi shartnomasi',
    description: "Tovar sotish-sotib olish uchun to'liq shartnoma. Kafolat muddati, yetkazib berish shartlari, penya va fors-major bandlari to'liq kiritilgan.",
    icon: '🛒',
    isDefault: true,
    tags: ['tovar', 'savdo', 'kafolat'],
    content: OLDI_SOTDI_STANDART,
    content_oz: OLDI_SOTDI_STANDART_OZ,
    content_ru: OLDI_SOTDI_STANDART_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-oldi-01'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-oldi-01'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-oldi-01'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-oldi-01'].description,
  },
  {
    id: 'dt-oldi-02',
    type: 'oldi_sotdi',
    name: 'Muntazam yetkazib berish shartnomasi',
    description: 'Partiyalar bo\'lib doimiy tovar yetkazib berish uchun. Grafik asosida buyurtma va to\'lov imkoniyati bilan. Uzoq muddatli hamkorlikka mos.',
    icon: '🚚',
    isDefault: true,
    tags: ['yetkazib berish', 'dostavka', 'partiya'],
    content: OLDI_SOTDI_YETKAZIB,
    content_oz: OLDI_SOTDI_YETKAZIB_OZ,
    content_ru: OLDI_SOTDI_YETKAZIB_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-oldi-02'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-oldi-02'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-oldi-02'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-oldi-02'].description,
  },

  // ── XIZMAT KO'RSATISH ──
  {
    id: 'dt-xizmat-01',
    type: 'xizmat',
    name: "Xizmat ko'rsatish shartnomasi (universal)",
    description: "Har qanday xizmat turi uchun universal shablon. Avans to'lov, qabul dalolatnomasi, konfidensiallik va 0,1% penya bandlari to'liq nazarda tutilgan.",
    icon: '🔧',
    isDefault: true,
    tags: ['xizmat', 'universal', 'avans'],
    content: XIZMAT_STANDART,
    content_oz: XIZMAT_STANDART_OZ,
    content_ru: XIZMAT_STANDART_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-xizmat-01'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-xizmat-01'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-xizmat-01'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-xizmat-01'].description,
  },
  {
    id: 'dt-xizmat-02',
    type: 'xizmat',
    name: 'IT xizmatlar shartnomasi',
    description: 'Dasturiy ta\'minot ishlab chiqish, veb-sayt, mobil ilova yoki texnik support uchun. Bosqichma-bosqich to\'lov, mualliflik huquqi va bug-fix kafolati belgilangan.',
    icon: '💻',
    isDefault: true,
    tags: ['IT', 'dasturiy ta\'minot', 'veb-sayt'],
    content: XIZMAT_IT,
    content_oz: XIZMAT_IT_OZ,
    content_ru: XIZMAT_IT_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-xizmat-02'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-xizmat-02'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-xizmat-02'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-xizmat-02'].description,
  },
  {
    id: 'dt-xizmat-03',
    type: 'xizmat',
    name: 'Konsalting xizmatlar shartnomasi',
    description: 'Moliyaviy, huquqiy yoki boshqaruv sohasida maslahat uchun. Oylik to\'lov, manfaatlar ziddiyati va maxfiylik shartlari alohida ko\'rsatilgan.',
    icon: '📊',
    isDefault: true,
    tags: ['konsalting', 'maslahat', 'moliya'],
    content: XIZMAT_KONSALTING,
    content_oz: XIZMAT_KONSALTING_OZ,
    content_ru: XIZMAT_KONSALTING_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-xizmat-03'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-xizmat-03'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-xizmat-03'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-xizmat-03'].description,
  },

  // ── IJARA ──
  {
    id: 'dt-ijara-01',
    type: 'ijara',
    name: "Ko'chmas mulk ijara shartnomasi",
    description: "Ofis, do'kon, bino yoki ombor ijarasi uchun. Kommunal xarajatlar, kapital ta'mirlash, ijara haqini indekslash va o'z vaqtida qaytarish shartlari belgilangan.",
    icon: '🏢',
    isDefault: true,
    tags: ['ofis', 'bino', 'ombor'],
    content: IJARA_KOCHMAS_MULK,
    content_oz: IJARA_KOCHMAS_MULK_OZ,
    content_ru: IJARA_KOCHMAS_MULK_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-ijara-01'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-ijara-01'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-ijara-01'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-ijara-01'].description,
  },
  {
    id: 'dt-ijara-02',
    type: 'ijara',
    name: 'Texnika va asbob-uskuna ijarasi',
    description: "Transport, ishlab chiqarish jihozi yoki boshqa texnika ijarasi uchun. Shikastlanganda kompensatsiya tartibi va texnik xizmat ko'rsatish masalalari belgilangan.",
    icon: '⚙️',
    isDefault: true,
    tags: ['texnika', 'asbob-uskuna', 'transport'],
    content: IJARA_TEXNIKA,
    content_oz: IJARA_TEXNIKA_OZ,
    content_ru: IJARA_TEXNIKA_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-ijara-02'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-ijara-02'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-ijara-02'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-ijara-02'].description,
  },
  {
    id: 'dt-ijara-03',
    type: 'ijara',
    name: 'Bepul foydalanish (tekin ijara) shartnomasi',
    description: "Mol-mulkni haq to'lamasdan (bepul) vaqtincha foydalanish uchun. Shartnomada tekin foydalanish holati aniq ko'rsatilgan, FK 582–586-moddalariga asoslangan.",
    icon: '🆓',
    isDefault: true,
    tags: ['tekin', 'bepul', 'foydalanish'],
    content: IJARA_TEKIN,
    content_oz: IJARA_TEKIN_OZ,
    content_ru: IJARA_TEKIN_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-ijara-03'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-ijara-03'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-ijara-03'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-ijara-03'].description,
  },

  // ── PUDRAT ──
  {
    id: 'dt-pudrat-01',
    type: 'pudrat',
    name: 'Qurilish pudratchiligi shartnomasi',
    description: "Yangi qurilish yoki kapital ta'mirlash uchun. Smeta, bosqichma-bosqich qabul, 2 yillik kafolat muddati va xavfsizlik talablari belgilangan.",
    icon: '🏗️',
    isDefault: true,
    tags: ['qurilish', 'ta\'mirlash', 'smeta'],
    content: PUDRAT_QURILISH,
    content_oz: PUDRAT_QURILISH_OZ,
    content_ru: PUDRAT_QURILISH_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-pudrat-01'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-pudrat-01'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-pudrat-01'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-pudrat-01'].description,
  },

  // ── QO'SHIMCHA ──
  {
    id: 'dt-qoshimcha-01',
    type: 'qoshimcha',
    name: "Qo'shimcha shartnoma (standart)",
    description: "Asosiy shartnomaga o'zgartirish kiritish, bandni qo'shish yoki olib tashlash uchun. Moliyaviy o'zgarishlar ham ifodalanishi mumkin.",
    icon: '📝',
    isDefault: true,
    tags: ["qo'shimcha", "o'zgartirish", 'ilova'],
    content: QOSHIMCHA_STANDART,
    content_oz: QOSHIMCHA_STANDART_OZ,
    content_ru: QOSHIMCHA_STANDART_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-qoshimcha-01'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-qoshimcha-01'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-qoshimcha-01'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-qoshimcha-01'].description,
  },

  // ── MOLIYAVIY ──
  {
    id: 'dt-moliyaviy-01',
    type: 'moliyaviy',
    name: 'Foizsiz qarz shartnomasi',
    description: "Yuridik shaxslar o'rtasida foizsiz moliyaviy yordam ko'rsatish uchun. Oylik, choraklik yoki bir yo'la qaytarish varianti belgilangan.",
    icon: '💰',
    isDefault: true,
    tags: ['qarz', 'foizsiz', 'moliyaviy yordam'],
    content: MOLIYAVIY_FOIZSIZ,
    content_oz: MOLIYAVIY_FOIZSIZ_OZ,
    content_ru: MOLIYAVIY_FOIZSIZ_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-moliyaviy-01'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-moliyaviy-01'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-moliyaviy-01'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-moliyaviy-01'].description,
  },
  {
    id: 'dt-moliyaviy-02',
    type: 'moliyaviy',
    name: 'Foizli qarz shartnomasi',
    description: "Yillik foiz stavkasi bilan qarz berish uchun. Oylik to'lov jadvali, muddatidan oldin to'lash tartibi va kechikish uchun penya belgilangan.",
    icon: '📈',
    isDefault: true,
    tags: ['qarz', 'foizli', 'kredit'],
    content: MOLIYAVIY_FOIZLI,
    content_oz: MOLIYAVIY_FOIZLI_OZ,
    content_ru: MOLIYAVIY_FOIZLI_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-moliyaviy-02'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-moliyaviy-02'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-moliyaviy-02'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-moliyaviy-02'].description,
  },

  // ── DAVAL ──
  {
    id: 'dt-daval-01',
    type: 'daval',
    name: 'Daval shartnomasi (standart)',
    description: "Xom ashyoni qayta ishlash uchun. Materiallar hisobi, yo'qotish uchun kompensatsiya, soliq va buxgalteriya masalalari to'liq nazarda tutilgan.",
    icon: '🏭',
    isDefault: true,
    tags: ['daval', 'qayta ishlash', 'xom ashyo'],
    content: DAVAL_STANDART,
    content_oz: DAVAL_STANDART_OZ,
    content_ru: DAVAL_STANDART_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-daval-01'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-daval-01'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-daval-01'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-daval-01'].description,
  },

  // ── XALQARO ──
  {
    id: 'dt-xalqaro-01',
    type: 'xalqaro',
    name: 'Xalqaro savdo shartnomasi (ikki tilli)',
    description: "O'zbek va ingliz tilidagi ikki tilli xalqaro shartnoma. Incoterms 2020, akkreditiv, sifat sertifikati, ICC arbitraj va CISG konventsiyasi asosida.",
    icon: '🌐',
    isDefault: true,
    tags: ['xalqaro', 'eksport', 'import', 'Incoterms'],
    content: XALQARO_SAVDO,
    content_oz: XALQARO_SAVDO_OZ,
    content_ru: XALQARO_SAVDO_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-xalqaro-01'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-xalqaro-01'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-xalqaro-01'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-xalqaro-01'].description,
  },

  // ── BOSHQA ──
  {
    id: 'dt-boshqa-01',
    type: 'boshqa',
    name: 'Hamkorlik shartnomasi',
    description: "Ikki tashkilot o'rtasida uzoq muddatli hamkorlik uchun. Foyda taqsimlash, intellektual mulk huquqlari va maxfiylik majburiyatlari belgilangan.",
    icon: '🤝',
    isDefault: true,
    tags: ['hamkorlik', 'sheriklik', 'foyda'],
    content: HAMKORLIK_SHARTNOMA,
    content_oz: HAMKORLIK_SHARTNOMA_OZ,
    content_ru: HAMKORLIK_SHARTNOMA_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-boshqa-01'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-boshqa-01'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-boshqa-01'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-boshqa-01'].description,
  },
  {
    id: 'dt-boshqa-02',
    type: 'boshqa',
    name: 'Vositachilik (agent) shartnomasi',
    description: "Prinsipal nomidan harakat qiluvchi agent uchun. Agentlik haqi foizi, hisobot tartibi, subagentlik cheklovlari va maxfiylik shartlari belgilangan.",
    icon: '🧩',
    isDefault: true,
    tags: ['agent', 'vositachi', 'komissiya'],
    content: VOSITACHILIK_SHARTNOMA,
    content_oz: VOSITACHILIK_SHARTNOMA_OZ,
    content_ru: VOSITACHILIK_SHARTNOMA_RU,
    name_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-boshqa-02'].name,
    name_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-boshqa-02'].name,
    description_oz: DEFAULT_TEMPLATE_NAMES_OZ['dt-boshqa-02'].description,
    description_ru: DEFAULT_TEMPLATE_NAMES_RU['dt-boshqa-02'].description,
  },
]
