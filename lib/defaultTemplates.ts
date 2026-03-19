export type AppTemplate = {
  id: string
  type: string
  name: string
  description: string
  content: string
  isDefault: boolean
  icon: string
  tags: string[]
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

{{BUYURTMACHI}}, keyingi o'rinlarda "Buyurtmachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Ijrochi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, O'zbekiston Respublikasi Fuqarolik Kodeksining 703-730-moddalari asosida quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijrochi Buyurtmachiga ushbu shartnomada belgilangan xizmatlarni ko'rsatish majburiyatini oladi; Buyurtmachi esa ko'rsatilgan xizmatlarni qabul qilib olish va haq to'lash majburiyatini oladi.
1.2. Ko'rsatiladigan xizmatning tavsifi: {{XIZMAT_TAVSIF}}.
1.3. Xizmatlar O'zbekiston Respublikasining amaldagi qonunchiligi va tomonlar o'rtasida kelishilgan talablarga muvofiq ko'rsatiladi.

2. XIZMAT NARXI VA TO'LOV TARTIBI

2.1. Ko'rsatilgan xizmatlar uchun umumiy to'lov miqdori {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
2.2. To'lov tartibi: {{XIZMAT_TOLOV}}.
2.3. To'lov naqd pulsiz bank o'tkazma yo'li bilan amalga oshiriladi.
2.4. QQS amaldagi qonunchilikka muvofiq hisoblab qo'shiladi.

3. XIZMAT KO'RSATISH MUDDATI

3.1. Xizmat ko'rsatishning boshlanish sanasi: {{XIZMAT_BOSHLANISH}}.
3.2. Xizmat ko'rsatishning tugash muddati: {{XIZMAT_TUGASH}}.
3.3. Ijrochi xizmat ko'rsatishda muddatlarga qat'iy rioya qilishi shart.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Ijrochi majburiyatlari:
— xizmatlarni belgilangan sifat va muddatda ko'rsatish;
— xizmat ko'rsatish jarayonida Buyurtmachining qonuniy ko'rsatmalarini bajarish;
— xizmat ko'rsatish davomida olgan har qanday maxfiy ma'lumotlarni oshkor etmaslik;
— xizmatlar ko'rsatilib bo'lgach, qabul-topshiriq dalolatnomasini taqdim etish.

4.2. Buyurtmachi majburiyatlari:
— xizmat ko'rsatish uchun zarur sharoit va kirish imkoniyatini ta'minlash;
— to'lovni belgilangan muddatda amalga oshirish;
— xizmatlarni o'z vaqtida qabul qilib dalolatnomani imzolash.

5. XIZMATLARNI QABUL QILISH TARTIBI

5.1. Ijrochi xizmatlarni ko'rsatib bo'lgach, Buyurtmachiga qabul-topshiriq dalolatnomasini taqdim etadi.
5.2. Buyurtmachi 3 (uch) ish kuni ichida dalolatnomani imzolaydi yoki asosli rad etishni yozma ravishda bildiradi.
5.3. Belgilangan muddat ichida Buyurtmachi hech qanday javob bermasa, xizmatlar qabul qilingan hisoblanadi.

6. KONFIDENSIALLIK

6.1. Tomonlar ushbu shartnoma doirasida olgan barcha ma'lumotlarni maxfiy saqlab, uchinchi shaxslarga oshkor etmaslik majburiyatini oladilar.
6.2. Ushbu majburiyat shartnoma tugaganidan keyin ham 3 (uch) yil davomida kuchda qoladi.

7. MAS'ULIYAT

7.1. To'lovni kechiktirganlik uchun Buyurtmachi kechiktirilgan har bir kun uchun 0,1% penya to'laydi.
7.2. Xizmat ko'rsatishni kechiktirganlik uchun Ijrochi kechiktirilgan har bir kun uchun 0,1% penya to'laydi.
7.3. Sifatsiz xizmat ko'rsatilgan taqdirda Ijrochi xizmatni qayta ko'rsatish yoki Buyurtmachiga yetkazilgan zararni qoplash majburiyatini oladi.
7.4. Ushbu shartnomadan asossiz voz kechish uchun javobgar tomon shartnoma summasining 10% miqdorida jarima to'laydi.

8. FORS-MAJOR VA NIZOLARNI HAL ETISH

8.1. Tabiiy ofat, epidemiya, urush, davlat organlari qarorlari kabi fors-major holatlar natijasida majburiyatlar bajarilmaganda tomonlar javobgar emas. Xabar berish muddati — 5 kun.
8.2. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi Iqtisodiy sudlarida ko'rib chiqiladi.

9. SHARTNOMANING AMAL QILISH MUDDATI

9.1. Shartnoma imzolangan kundan kuchga kiradi va majburiyatlar to'liq bajarilgunga qadar amal qiladi.

10. TOMONLARNING REKVIZITLARI

BUYURTMACHI:                                IJROCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const XIZMAT_IT = `IT XIZMATLAR SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Buyurtmachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Ijrochi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, quyidagi IT xizmatlar ko'rsatish shartnomasi tuzildi:

1. SHARTNOMA PREDMETI

1.1. Ijrochi Buyurtmachiga quyidagi IT xizmatlarni ko'rsatadi:
— dasturiy ta'minot ishlab chiqish / sozlash / modernizatsiya qilish;
— veb-sayt yoki mobil ilova yaratish;
— texnik yordam (support) va tizimni qo'llab-quvvatlash;
— boshqa IT xizmatlar (Texnik topshiriqqa muvofiq).
1.2. Ko'rsatiladigan xizmatning tavsifi: {{XIZMAT_TAVSIF}}. Batafsil texnik talablar Texnik topshiriqda (1-ilova) ko'rsatiladi.

2. NARX VA TO'LOV TARTIBI

2.1. Xizmatlar uchun umumiy to'lov: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.2. To'lov bosqichlari:
— shartnoma imzolanganidan keyin 3 ish kuni ichida — 30% (texnik topshiriq tasdiqlangach);
— ishlar 50% bajarilganda (oraliq qabul aktiga asosan) — 40%;
— loyiha to'liq qabul qilinganidan keyin 3 ish kuni ichida — 30%.
2.3. To'lov bank o'tkazma yo'li bilan amalga oshiriladi.

3. BAJARISH MUDDATI VA BOSQICHLARI

3.1. Ishlar boshlanish sanasi: {{XIZMAT_BOSHLANISH}}.
3.2. Yakunlanish muddati: {{XIZMAT_TUGASH}}.
3.3. Kechikish bo'lsa, Ijrochi Buyurtmachiga 3 ish kuni oldin yozma xabar beradi va yangi muddatni kelishib oladi.

4. MUALLIFLIK HUQUQI

4.1. Ijrochi tomonidan yaratilgan dasturiy mahsulot, dizayn va boshqa intellektual mulk ob'ektlariga oid to'liq huquqlar to'lov amalga oshirilgandan so'ng Buyurtmachiga o'tadi.
4.2. Ijrochi ishlatilgan ochiq kodli kutubxonalar (open-source) haqida Buyurtmachiga xabar beradi.
4.3. Ijrochi Buyurtmachining tijorat sirlari va maxfiy ma'lumotlarini uchinchi shaxslarga oshkor etmaydi. Ushbu majburiyat shartnoma tugaganidan keyin ham 5 yil davomida kuchda qoladi.

5. QABUL QILISH TARTIBI VA KAFOLAT

5.1. Har bir bosqich yakunida Ijrochi qabul-topshiriq aktini taqdim etadi.
5.2. Buyurtmachi 5 (besh) ish kuni ichida testlash o'tkazib, aktni imzolaydi yoki asosli kamchiliklarni yozma bildiradi.
5.3. Loyiha qabul qilinganidan keyin 3 (uch) oy davomida Ijrochi aniqlanuvchi xatolarni (bug'larni) bepul bartaraf etadi.
5.4. Texnik yordam (support) xizmati alohida shartnoma yoki kelishuv asosida ko'rsatiladi.

6. MAS'ULIYAT VA NIZOLARNI HAL ETISH

6.1. To'lovni kechiktirganlik uchun Buyurtmachi kuniga 0,1% penya to'laydi.
6.2. Muddatni kechiktirganlik uchun Ijrochi kuniga 0,1% penya to'laydi.
6.3. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi Iqtisodiy sudlarida ko'rib chiqiladi.

7. TOMONLARNING REKVIZITLARI

BUYURTMACHI:                                IJROCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const XIZMAT_KONSALTING = `KONSALTING XIZMATLAR SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Buyurtmachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Maslahatchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, quyidagi konsalting xizmatlar shartnomasi tuzildi:

1. SHARTNOMA PREDMETI

1.1. Maslahatchi Buyurtmachiga quyidagi sohalarda professional konsalting xizmatlarini ko'rsatadi:
— moliyaviy tahlil va boshqaruv maslahat xizmatlari;
— huquqiy maslahat va shartnoma tayyorlash;
— boshqaruv va biznes-jarayonlarni optimallashtirish;
— bozor tadqiqotlari va strategik rejalashtirish.
1.2. Ko'rsatiladigan xizmatning tavsifi: {{XIZMAT_TAVSIF}}. Batafsil ko'lami tomonlar yozma kelishuvida belgilanadi.
1.3. Maslahatchi mustaqil mutaxassis sifatida faoliyat yuritadi va Buyurtmachi xodimlari tarkibiga kirmaydi.

2. NARX VA TO'LOV TARTIBI

2.1. Xizmatlar uchun umumiy to'lov: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.2. To'lov tartibi: {{XIZMAT_TOLOV}}.
2.3. Safarbar xarajatlar (mehmonxona, transport va boshqalar) hujjatlar asosida alohida qoplanadi.

3. MASLAHAT KO'RSATISH TARTIBI

3.1. Maslahatchi tayinlangan soat yoki kunlarda ishlaydi; ish vaqti tomonlar o'rtasida kelishiladi.
3.2. Maslahat natijalari (hisobot, tahlil, tavsiyalar) yozma shaklda taqdim etiladi.
3.3. Maslahatchi Buyurtmachining ichki hujjatlari va tijorat sirlariga maxfiylikni ta'minlaydi.

4. KONFIDENSIALLIK VA MANFAATLAR ZIDDIYATI

4.1. Maslahatchi ushbu shartnoma doirasida olgan barcha maxfiy ma'lumotlarni oshkor etmaslik majburiyatini oladi. Ushbu majburiyat shartnoma tugaganidan keyin ham 3 yil davomida kuchda qoladi.
4.2. Maslahatchi bir vaqtda Buyurtmachining bevosita raqiblariga xuddi shunday xizmatlar ko'rsatmaslik majburiyatini oladi.

5. MAS'ULIYAT VA NIZOLARNI HAL ETISH

5.1. Maslahatchi tavsiyalari natijasida Buyurtmachiga yetkazilgan bevosita zararlar uchun mas'uliyat xizmat to'lovidan oshmaslik sharti bilan belgilanadi.
5.2. To'lovni kechiktirganlik uchun Buyurtmachi kuniga 0,1% penya to'laydi.
5.3. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi Iqtisodiy sudlarida ko'rib chiqiladi.

6. SHARTNOMANING AMAL QILISH MUDDATI

6.1. Shartnoma imzolangan kundan kuchga kiradi va 12 (o'n ikki) oy amal qiladi. Tomonlar kelishgan holda uzaytiriladi.
6.2. Tomonlardan biri shartnomani 30 (o'ttiz) kun oldin yozma ogohlantirish bilan bekor qilish huquqiga ega.

7. TOMONLARNING REKVIZITLARI

BUYURTMACHI:                                MASLAHATCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── IJARA ───────────────────────────────────────────────────────────────────

const IJARA_KOCHMAS_MULK = `KO'CHMAS MULK IJARA SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Ijarachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Ijaraberuvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, O'zbekiston Respublikasi Fuqarolik Kodeksining 535-576-moddalari asosida quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijaraberuvchi Ijarachiga quyidagi ko'chmas mulkni (keyingi o'rinlarda "Ijara ob'ekti") vaqtincha foydalanish uchun beradi:
— Manzil: {{IJARA_MANZIL}}
— Umumiy maydoni: {{IJARA_MAYDON}} m²
1.2. Ijara ob'ekti ushbu shartnoma imzolanganida ko'rsatilgan holda, o'tkazish-qabul qilish dalolatnomasiga asosan topshiriladi.
1.3. Ijara ob'ektida mulk huquqiga oid hujjatlar — Ijaraberuvchida saqlanadi.

2. IJARA MUDDATI

2.1. Ijara muddati: {{IJARA_MUDDAT}} oy (boshlanish: {{IJARA_BOSHLANISH}}, tugash: {{IJARA_TUGASH}}).
2.2. Ijara muddati tugashidan 30 (o'ttiz) kun oldin tomonlardan biri e'tiroz bildirmasa, shartnoma bir yilga avtomatik ravishda uzaytiriladi.
2.3. Ijarachi Ijaraberuvchining roziligisiz uchinchi shaxslarga qayta ijara berishga haqli emas.

3. IJARA HAQI VA TO'LOV TARTIBI

3.1. Oylik ijara haqi {{OYLIK_TOLOV}} ({{OYLIK_TOLOV_MATN}}) so'mni tashkil etadi.
3.2. Butun ijara muddati uchun umumiy summa: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
3.3. Ijara haqi har oyning 5 (beshinchi) kuniga qadar oldindan to'lanadi.
3.4. Ijara haqi naqd pulsiz bank o'tkazma orqali yoki tomonlar kelishgan boshqa usulda to'lanadi.
3.5. Kommunal xizmatlar (elektr energiyasi, gaz, suv, chiqindilarni chiqarish) Ijarachi tomonidan alohida to'lanadi.
3.6. Ijara haqi kelgusi 12 oy ichida O'zbekiston Respublikasi Statistika qo'mitasi tomonidan e'lon qilingan inflyatsiya darajasidan 5% dan ortiq o'zgartirilmasligi kerak; bundan ko'proq o'zgartirishga tomonlarning yozma kelishuvi talab etiladi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Ijaraberuvchi majburiyatlari:
— ijara ob'ektini kelishilgan holda va muddatda topshirish;
— ijara muddati davomida ob'ektdan Ijarachining foydalanishiga to'sqinlik qilmaslik;
— kapital ta'mirlash ishlarini (agar zarur bo'lsa) o'z vaqtida va o'z hisobidan bajarish;
— muhandislik tarmoqlarining ishlaydigan holatda bo'lishini ta'minlash.

4.2. Ijarachi majburiyatlari:
— ijara haqini belgilangan muddatda to'lash;
— ijara ob'ektini ehtiyotkorlik bilan ishlatish va yaxshi holatda saqlash;
— joriy ta'mirlash (eshik, oyna, santexnika kabi) ishlarini o'z hisobidan bajarish;
— ob'ektda joylashgan muhandislik tarmoqlarini (elektr, suv, isitish) buzmaslik;
— ob'ektda o'zgartirish, qayta qurish ishlarini bajarishdan oldin Ijaraberuvchidan yozma ruxsat olish;
— ijara muddati tugagach ob'ektni dastlabki holatda o'tkazish-qabul qilish dalolatnomasiga asosan qaytarish.

5. MAS'ULIYAT

5.1. Ijara haqini kechiktirganlik uchun Ijarachi kechiktirilgan har bir kun uchun oylik ijara haqining 0,1% miqdorida penya to'laydi.
5.2. Ijara ob'ektiga Ijarachi aybiga ko'ra yetkazilgan zarar uchun Ijarachi to'liq javob beradi.
5.3. Ijara haqini 2 (ikki) oydan ko'p kechiktirsa, Ijaraberuvchi shartnomani bir tomonlama bekor qilish va ob'ektni egallash huquqiga ega.

6. SHARTNOMANI BEKOR QILISH

6.1. Tomonlardan biri shartnomani muddatidan oldin bekor qilmoqchi bo'lsa, boshqa tomonga 30 (o'ttiz) kun oldin yozma ogohlantirish berishi shart.
6.2. Ijaraberuvchi ob'ektni o'z ehtiyoji uchun kerak bo'lganda shartnomani 60 (oltmish) kun oldin xabardor qilgan holda bekor qilishi mumkin.

7. FORS-MAJOR VA NIZOLARNI HAL ETISH

7.1. Tabiiy ofat yoki davlat tomonidan ob'ektni musodara qilish holatlarida tomonlar javobgar emas. Xabar berish muddati — 5 kun ichida.
7.2. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi Fuqarolik sudlarida ko'rib chiqiladi.

8. TOMONLARNING REKVIZITLARI

IJARACHI:                                   IJARABERUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const IJARA_TEXNIKA = `TEXNIKA (ASBOB-USKUNA) IJARASI SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Ijarachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Ijaraberuvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, ushbu asbob-uskuna (texnika) ijarasi shartnomasi tuzildi:

1. SHARTNOMA PREDMETI

1.1. Ijaraberuvchi Ijarachiga quyidagi texnikani (asbob-uskunani) vaqtincha foydalanish uchun beradi:
— Texnika nomi / rusumi: _______________________
— Zavodskoy / seriya raqami: _______________________
— Texnik holati topshirish vaqtida: yaxshi (dalolatnomada ko'rsatiladi)
— Ilova hujjatlari: texnik pasport, ishlatish yo'riqnomasi.
1.2. Texnika Ijarachiga o'tkazish-qabul qilish dalolatnomasiga asosan topshiriladi.

2. IJARA MUDDATI VA HAQI

2.1. Ijara muddati: shartnoma imzolanganidan boshlab ________ oy.
2.2. Oylik ijara haqi {{OYLIK_TOLOV}} ({{OYLIK_TOLOV_MATN}}) so'mni tashkil etadi. Umumiy summa: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.3. To'lov har oyning 5 (beshinchi) kuniga qadar oldindan bank o'tkazma orqali amalga oshiriladi.
2.4. Yoqilg'i, elektr energiyasi va foydalanish xarajatlari Ijarachi hisobidan qoplanadi.

3. TOMONLARNING MAJBURIYATLARI

3.1. Ijaraberuvchi majburiyatlari:
— texnikani ishlaydigan holatda topshirish;
— kafolat muddatida yuzaga kelgan ishlab chiqaruvchi nuqsonlarini bepul bartaraf etish;
— zarur ehtiyot qismlar mavjudligi to'g'risida ma'lumot berish.

3.2. Ijarachi majburiyatlari:
— texnikani faqat maqsadli belgilangan ishlar uchun ishlatish;
— texnik xizmat ko'rsatishni (TO) o'z vaqtida o'tkazish;
— texnikani boshqa shaxslarga berishdan oldin Ijaraberuvchidan yozma ruxsat olish;
— ijara muddati tugagach texnikani dastlabki holda qaytarish.

4. TEXNIKA SHIKASTLANGANDA

4.1. Texnika butunlay yo'qolsa yoki qayta tiklash imkonsiz bo'lguday shikastlansa, Ijarachi bozor qiymatida to'liq kompensatsiya to'laydi.
4.2. Qisman shikastlanish uchun ta'mirlash xarajatlarini Ijarachi to'liq qoplash majburiyatini oladi.
4.3. Ijara muddati tugamasdan texnikani qaytarishda Ijarachi qolgan muddat uchun ijara haqining 50% ni to'laydi.

5. MAS'ULIYAT VA NIZOLARNI HAL ETISH

5.1. To'lovni kechiktirganlik uchun Ijarachi kuniga 0,1% penya to'laydi.
5.2. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi sudlarida ko'rib chiqiladi.

6. TOMONLARNING REKVIZITLARI

IJARACHI:                                   IJARABERUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const IJARA_TEKIN = `BEPUL FOYDALANISH SHARTNOMASI (TEKIN IJARA)
No {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Foydalanuvchi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Beruvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, O'zbekiston Respublikasi Fuqarolik Kodeksining 582–586-moddalariga asosan quyidagilar haqida ushbu bepul foydalanish (tekin ijara) shartnomasi tuzildi:

1. SHARTNOMA PREDMETI

1.1. Beruvchi Foydalanuvchiga quyidagi mol-mulkni vaqtincha BEPUL foydalanish uchun beradi:
— Manzil / tavsif: {{IJARA_MANZIL}}
— Maydoni: {{IJARA_MAYDON}} m²
1.2. Ushbu shartnoma bo'yicha hech qanday ijara haqi yoki boshqa to'lov olinmaydi — mol-mulkdan foydalanish mutlaqo bepul (tekin) asosida amalga oshiriladi.
1.3. Mol-mulk shartnoma imzolanganida ko'rsatilgan holda topshiriladi.

2. FOYDALANISH MUDDATI

2.1. Foydalanish muddati: {{IJARA_MUDDAT}} oy.
2.2. Boshlanish sanasi: {{IJARA_BOSHLANISH}}. Tugash sanasi: {{IJARA_TUGASH}}.
2.3. Muddat tugashidan 30 (o'ttiz) kun oldin tomonlardan biri e'tiroz bildirmasa, shartnoma bir yilga avtomatik ravishda uzaytiriladi.

3. BEPUL FOYDALANISH SHARTLARI

3.1. Ushbu shartnoma bo'yicha hech qanday ijara haqi belgilanmaydi. Shartnoma bepul (tekin) foydalanish munosabatlarini tartibga soladi.
3.2. Kommunal xizmatlar (elektr energiyasi, gaz, suv, chiqindilarni chiqarish) va joriy ta'mirlash xarajatlari Foydalanuvchi tomonidan o'z hisobidan to'lanadi.
3.3. Mol-mulkda kapital ta'mirlash ishlarini Beruvchi o'z hisobidan amalga oshiradi.

4. TOMONLARNING MAJBURIYATLARI

4.1. Beruvchi majburiyatlari:
— mol-mulkni kelishilgan holda va muddatda topshirish;
— foydalanish davomida to'sqinlik qilmaslik;
— mol-mulkdagi yashirin kamchiliklari haqida oldindan xabardor qilish.

4.2. Foydalanuvchi majburiyatlari:
— mol-mulkni ehtiyotkorlik bilan ishlatish va yaxshi holatda saqlash;
— ob'ektda o'zgartirish, ta'mirlash yoki qayta qurish ishlarini bajarishdan oldin Beruvchidan yozma ruxsat olish;
— mol-mulkni uchinchi shaxslarga topshirmaslik;
— foydalanish muddati tugagach mol-mulkni dastlabki holatda o'tkazish-qabul qilish dalolatnomasiga asosan qaytarish.

5. MAS'ULIYAT

5.1. Mol-mulkka Foydalanuvchi aybiga ko'ra yetkazilgan zarar uchun Foydalanuvchi to'liq javob beradi va zararni qoplash majburiyatini oladi.
5.2. Mol-mulkni yo'qotish yoki qaytarib bera olmaslik holatida Foydalanuvchi uning bozor qiymatini to'liq qoplash majburiyatini oladi.
5.3. Mol-mulkni ruxsatsiz uchinchi shaxslarga berganlik uchun Foydalanuvchi shartnomaning bir tomonlama bekor qilinishiga va zararning qoplanishiga javobgar bo'ladi.

6. SHARTNOMANI BEKOR QILISH

6.1. Har qaysi tomon shartnomani kamida 30 (o'ttiz) kun oldin yozma xabar berish orqali muddatidan oldin bekor qilishi mumkin.
6.2. Foydalanuvchi mol-mulkni buzilishi, yo'qotishi yoki uchinchi shaxslarga topshirishi holatida Beruvchi shartnomani zudlik bilan bir tomonlama bekor qilish huquqiga ega.

7. NIZOLARNI HAL ETISH

7.1. Nizolar muzokara yo'li bilan hal etiladi, hal bo'lmasa O'zbekiston Respublikasi sudlari orqali.

8. TOMONLARNING REKVIZITLARI

FOYDALANUVCHI:                              BERUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── PUDRAT ──────────────────────────────────────────────────────────────────

const PUDRAT_QURILISH = `QURILISH PUDRATCHILIGI SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Buyurtmachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Pudratchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, O'zbekiston Respublikasi Fuqarolik Kodeksining 630-660-moddalari asosida quyidagilar haqida ushbu pudrat shartnomasi tuzildi:

1. SHARTNOMA PREDMETI

1.1. Pudratchi Buyurtmachining topshirig'iga binoan quyidagi qurilish (ta'mirlash) ishlarini bajarish majburiyatini oladi:
— Ob'ekt manzili: {{PUDRAT_OBEKT}}
— Bajariladigan ishlarning tavsifi: {{PUDRAT_TAVSIF}}
1.2. Buyurtmachi bajarilgan ishlarni qabul qilib olish va belgilangan haqni to'lash majburiyatini oladi.
1.3. Texnik topshiriq va smeta (1-ilova) ushbu shartnomaning ajralmas qismi hisoblanadi.

2. ISH BAJARISH MUDDATI

2.1. Ishlarni boshlash sanasi: {{PUDRAT_BOSHLANISH}}.
2.2. Ishlarni yakunlash muddati: {{PUDRAT_TUGASH}}.
2.3. Ish bosqichlari va har bir bosqich muddati smeta va calendar rejaga muvofiq belgilanadi.
2.4. Muddatni o'zgartirish faqat ikki tomonning yozma kelishuvi asosida amalga oshiriladi.

3. SHARTNOMA NARXI VA TO'LOV TARTIBI

3.1. Ishlarning umumiy narxi {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
3.2. To'lov tartibi:
— shartnoma imzolanganida 30% avans to'lovi;
— ishlarning 50% bajarilishi bo'yicha oraliq qabul aktiga asosan 40%;
— barcha ishlar to'liq bajarilgach va yakuniy qabul aktiga asosan qolgan 30%.
3.3. To'lov bank o'tkazma yo'li bilan amalga oshiriladi.
3.4. Narxda o'zgartirishlar faqat Buyurtmachining yozma roziligi bilan amalga oshiriladi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Pudratchi majburiyatlari:
— ishlarni belgilangan muddat, sifat va texnik talablarga muvofiq bajarish;
— o'z mablag'i, jihozi va mehnat resurslari bilan ta'minlash (agar boshqacha kelishilmagan bo'lsa);
— mehnat xavfsizligi va sanitariya-gigiyena qoidalariga rioya qilish;
— ishlar davomida Buyurtmachini muhim holatlar, to'siqlar yoki qo'shimcha xarajatlar haqida darhol xabardor qilish;
— ish joyida tartibni saqlash va kundalik xabar-u hisobotlar berish.

4.2. Buyurtmachi majburiyatlari:
— Pudratchi uchun ish joyiga kirishni ta'minlash;
— loyiha hujjatlarini va zarur ruxsatnomalarni vaqtida taqdim etish;
— bajarilgan ishlarni belgilangan muddatda qabul qilish;
— to'lovni jadval asosida amalga oshirish.

5. ISHLARNI QABUL QILISH TARTIBI

5.1. Pudratchi har bir bosqich ishlarini yakunlagach, Buyurtmachiga qabul-topshiriq dalolatnomasini taqdim etadi.
5.2. Buyurtmachi 5 (besh) ish kuni ichida ishlarni texnik inspektor bilan tekshirib, dalolatnomani imzolaydi yoki asosli kamchiliklarni yozma ravishda bildiradi.
5.3. Aniqlangan kamchiliklar Pudratchi tomonidan 10 (o'n) ish kuni ichida bepul bartaraf etiladi.

6. KAFOLAT MUDDATI

6.1. Bajarilgan qurilish ishlari sifatiga kafolat muddati — 2 (ikki) yil.
6.2. Kafolat muddatida yuzaga kelgan strukturaviy nuqsonlar va ishchi loyiha standartlaridan og'ish holatlari Pudratchi tomonidan bepul bartaraf etiladi.
6.3. Tabiiy eskirish va Buyurtmachining noto'g'ri foydalanishiga kafolat tatbiq etilmaydi.

7. MAS'ULIYAT

7.1. Ishlarni kechiktirganlik uchun Pudratchi kechiktirilgan har bir kun uchun shartnoma summasining 0,1% miqdorida penya to'laydi.
7.2. To'lovni kechiktirganlik uchun Buyurtmachi ham xuddi shunday penya to'laydi.
7.3. Qurilish ishlari xavfsizlik qoidalariga rioya etilmaganlik oqibatida yuzaga keladigan baxtsiz hodisalar va zararlar uchun Pudratchi to'liq javobgar.

8. FORS-MAJOR VA NIZOLARNI HAL ETISH

8.1. Tabiiy ofat, sel, yer silkinishi, urush holatlari fors-major hisoblanadi. Xabar berish muddati — 5 kun ichida.
8.2. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi Iqtisodiy sudlarida ko'rib chiqiladi.

9. TOMONLARNING REKVIZITLARI

BUYURTMACHI:                                PUDRATCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── QO'SHIMCHA SHARTNOMA ─────────────────────────────────────────────────────

const QOSHIMCHA_STANDART = `QO'SHIMCHA SHARTNOMA
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "1-tomon" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "2-tomon" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, asosiy shartnomaga qo'shimcha sifatida quyidagilarni kelishib oldilar:

1. ASOSIY SHARTNOMA MA'LUMOTLARI

1.1. Ushbu Qo'shimcha shartnoma {{ASOSIY_RAQAM}} raqamli, {{ASOSIY_SANA}} sanasida tuzilgan asosiy shartnomaning (keyingi o'rinlarda "Asosiy shartnoma") ajralmas qismi hisoblanadi.
1.2. Asosiy shartnomaning ushbu Qo'shimchada zikr etilmagan barcha bandlari o'z kuchini saqlaydi.

2. KIRITILAYOTGAN O'ZGARTIRISHLAR

2.1. Kiritilayotgan o'zgarishlar:
{{OZGARTIRISH}}

3. MOLIYAVIY O'ZGARISHLAR (AGAR MAVJUD BO'LSA)

3.1. Ushbu Qo'shimcha shartnoma asosida shartnoma umumiy summasi {{SUMMA}} ({{SUMMA_MATN}}) so'mga o'zgartiriladigan.
3.2. Qo'shimcha to'lov tartibi asosiy shartnomada belgilangan tartibda amalga oshiriladi.

4. KUCHGA KIRISH TARTIBI

4.1. Ushbu Qo'shimcha shartnoma ikki tomon imzolagan kundan kuchga kiradi.
4.2. Ushbu Qo'shimcha shartnoma ikki nusxada tuzilgan, har bir tomon uchun bir nusxadan; ikkala nusxa teng yuridik kuchga ega.

5. TOMONLARNING REKVIZITLARI

1-TOMON:                                    2-TOMON:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── MOLIYAVIY YORDAM ─────────────────────────────────────────────────────────

const MOLIYAVIY_FOIZSIZ = `FOIZSIZ QARZ SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Qarz beruvchi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Qarz oluvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, O'zbekiston Respublikasi Fuqarolik Kodeksining 732-740-moddalari asosida quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Qarz beruvchi Qarz oluvchiga moliyaviy yordam sifatida {{SUMMA}} ({{SUMMA_MATN}}) so'm miqdorida foizsiz qarz beradi.
1.2. Ushbu qarz foizsiz beriladi va faqat asl miqdorini qaytarish talab etiladi.
1.3. Qarz maqsadi: {{QARZ_MAQSAD}}.

2. QARZNI BERISH TARTIBI

2.1. Qarz shartnoma imzolanganidan keyin 5 (besh) bank ishi kuni ichida Qarz oluvchining bank hisobvarag'iga o'tkaziladi.
2.2. Pul mablag'larini o'tkazish — to'lov topshiriqnomasi asosida amalga oshiriladi.
2.3. Qarz o'tkazilganidan keyin Qarz oluvchi 2 (ikki) ish kuni ichida qabul qilganini tasdiqlovchi til xati yuborganini yozma ravishda bildiradi.

3. QARZNI QAYTARISH TARTIBI

3.1. Qarz oluvchi qarzni {{QARZ_MUDDAT}} ichida to'liq qaytarish majburiyatini oladi.
3.2. Qaytarish tartibi: {{QARZ_TARTIB}}.
3.3. Muddatidan oldin to'liq qaytarish mumkin — bu haqda 3 (uch) kun oldin xabar berish kerak.

4. MAS'ULIYAT

4.1. Qarzni qaytarishni kechiktirganlik uchun Qarz oluvchi kechiktirilgan summaning kuniga 0,05% miqdorida penya to'laydi.
4.2. Agar Qarz oluvchi qarzni qaytara olmaydigan holatga tushib qolsa, Qarz beruvchiga zudlik bilan yozma xabar berishi shart; tomonlar qaytarish jadvalini qayta kelishib olishlari mumkin.

5. FORS-MAJOR VA NIZOLARNI HAL ETISH

5.1. Fors-major holatlari (tabiiy ofat, urush, qo'yilgan cheklovlar) yuzaga kelganda tomonlar javobgar emas. Xabar berish muddati — 5 kun ichida.
5.2. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi Fuqarolik sudlarida ko'rib chiqiladi.

6. BOSHQA SHARTLAR

6.1. Shartnoma ikki nusxada tuzilgan; ikkala nusxa teng yuridik kuchga ega.
6.2. Shartnomaga o'zgartirishlar faqat ikki tomonning yozma kelishuviga binoan kiritiladi.

7. TOMONLARNING REKVIZITLARI

QARZ BERUVCHI:                              QARZ OLUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const MOLIYAVIY_FOIZLI = `FOIZLI QARZ SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Qarz beruvchi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Qarz oluvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, O'zbekiston Respublikasi Fuqarolik Kodeksining 732-740-moddalari asosida quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Qarz beruvchi Qarz oluvchiga {{SUMMA}} ({{SUMMA_MATN}}) so'm miqdorida qarz beradi.
1.2. Foiz shartlari: {{QARZ_FOIZ}}.
1.3. Qarz maqsadi: {{QARZ_MAQSAD}}.

2. QARZNI BERISH TARTIBI

2.1. Qarz shartnoma imzolanganidan keyin 5 (besh) bank ishi kuni ichida Qarz oluvchining bank hisobvarag'iga o'tkaziladi.
2.2. Foiz hisoblanishining boshlanish sanasi — pul Qarz oluvchining hisobvarag'iga tushgan sana.

3. FOIZLAR VA TO'LOV TARTIBI

3.1. Foizlar har oy asl qarz qoldiqqa hisoblanadi.
3.2. Qaytarish muddati: {{QARZ_MUDDAT}}.
3.3. Qaytarish tartibi: {{QARZ_TARTIB}}.
3.4. Muddatidan oldin to'liq to'lash — 5 (besh) kun oldin xabar bergan holda mumkin. Bunday holda faqat haqiqatan hisoblangan foizlar to'lanadi.

4. MAS'ULIYAT

4.1. To'lovni kechiktirganlik uchun Qarz oluvchi kechiktirilgan summaning kuniga 0,1% miqdorida penya to'laydi.
4.2. Qarzni belgilangan muddatda qaytara olmagan taqdirda Qarz beruvchi sud orqali undirish choralarini ko'rish huquqiga ega.

5. NIZOLARNI HAL ETISH

5.1. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi Fuqarolik sudlarida ko'rib chiqiladi.

6. TOMONLARNING REKVIZITLARI

QARZ BERUVCHI:                              QARZ OLUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── DAVAL ───────────────────────────────────────────────────────────────────

const DAVAL_STANDART = `DAVAL SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Buyurtmachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Qayta ishlovchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, O'zbekiston Respublikasi Fuqarolik Kodeksining 630-650-moddalari va O'zbekiston Respublikasining "Soliq kodeksi" talablari asosida quyidagilar haqida ushbu daval shartnomasi tuzildi:

1. SHARTNOMA PREDMETI

1.1. Buyurtmachi Qayta ishlovchiga o'z mulki bo'lgan xom ashyo (daval material) beradi. Qayta ishlovchi ushbu xom ashyoni belgilangan texnologiya asosida qayta ishlab, tayyor mahsulot sifatida Buyurtmachiga qaytaradi.
1.2. Daval material: {{DAVAL_MATERIAL}}, miqdori: {{DAVAL_MIQDOR}}.
1.3. Kutilayotgan tayyor mahsulot: {{DAVAL_MAHSULOT}}.

2. TOMONLARNING MAJBURIYATLARI

2.1. Buyurtmachi majburiyatlari:
— xom ashyoni kelishilgan miqdor, sifat va muddatda Qayta ishlovchining omboriga yetkazib berish;
— xom ashyo sifatiga doir hujjatlarni (sifat sertifikati, guvohnoma) taqdim etish;
— qayta ishlash xizmatini to'lovini belgilangan muddatda amalga oshirish;
— agar Buyurtmachi topshiradigan materiallar tarzdosh bo'lib chiqsa, Qayta ishlovchiga zudlik bilan xabar berish.

2.2. Qayta ishlovchi majburiyatlari:
— xom ashyoni kelishilgan texnologiya, GOST/texnik shartlar asosida sifatli qayta ishlash;
— tayyor mahsulotni belgilangan miqdor va muddatda topshirish;
— xom ashyoni alohida hisobda yuritish, boshqa buyurtmachilarning xom ashyosi bilan aralashtirmaslik;
— ishlab chiqarish chiqindilari (qoldiq, suyuqlik va boshqalar) ni xavfsiz yo'q qilish yoki qaytarish;
— xom ashyo yo'qolishi, buzilishi yoki me'yordan ortiq sarflanishi uchun Buyurtmachiga to'liq javob berish.

3. QAYTA ISHLASH NARXI VA TO'LOV

3.1. Qayta ishlash xizmati uchun umumiy haq {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
3.2. To'lov tartibi:
— tayyor mahsulot topshirilgandan va qabul-topshiriq dalolatnomasiga imzo qo'yilgandan keyin 10 (o'n) ish kuni ichida.
3.3. To'lov bank o'tkazma yo'li bilan amalga oshiriladi.

4. MUDDATLAR VA QABUL QILISH

4.1. Xom ashyo topshirilish sanasi: shartnoma imzolanganidan keyin 3 (uch) ish kuni ichida.
4.2. Qayta ishlash muddati: {{DAVAL_MUDDAT}}. Tayyor mahsulot xom ashyo qabul qilinganidan so'ng ushbu muddat ichida topshiriladi.
4.3. Tayyor mahsulot topshirilganda qabul-topshiriq dalolatnomasi imzolanadi; dalolatnamada miqdor, sifat va qoldiq materiallar (chiqindilar) ko'rsatiladi.

5. MAS'ULIYAT

5.1. Qayta ishlovchi xom ashyoni yo'qotish yoki shikastlash uchun uning bozor qiymatini to'liq qoplash majburiyatini oladi.
5.2. Me'yordan ortiq sarflangan xom ashyo uchun Qayta ishlovchi bozor narxida qoplash majburiyatini oladi.
5.3. Muddatlarni kechiktirganlik uchun kechiktirilgan har bir kun uchun 0,1% penya to'lanadi.

6. BUXGALTERIYA VA SOLIQ MASALALARI

6.1. Daval materiallari Buyurtmachining balansida qoladi va Qayta ishlovchining balansiga o'tkazilmaydi.
6.2. Buyurtmachi daval materiallariga oid hujjatlar (vakolatxona, MX-1 dalolatnomasi) ni taqdim etadi.
6.3. Qayta ishlash xizmati uchun Qayta ishlovchi QQS hisobini to'g'ri yuritadi.

7. FORS-MAJOR VA NIZOLARNI HAL ETISH

7.1. Tabiiy ofat, to'satdan yong'in, texnogen halokat kabi fors-major holatlarda tomonlar javobgar emas. Xabar berish muddati — 5 kun.
7.2. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi Iqtisodiy sudlarida ko'rib chiqiladi.

8. TOMONLARNING REKVIZITLARI

BUYURTMACHI:                                QAYTA ISHLOVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

// ─── XALQARO ─────────────────────────────────────────────────────────────────

const XALQARO_SAVDO = `INTERNATIONAL TRADE CONTRACT / XALQARO SAVDO SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}}                                                    "{{SANA}}"

{{BUYURTMACHI}}, hereinafter referred to as the "Buyer" / "Xaridor", represented by {{BUYURTMACHI_RAHBAR}}, on the one hand, and {{IJROCHI}}, hereinafter referred to as the "Seller" / "Sotuvchi", represented by {{IJROCHI_RAHBAR}}, on the other hand, have entered into this Contract as follows:

1. SUBJECT OF THE CONTRACT / SHARTNOMA PREDMETI

1.1. The Seller agrees to sell and deliver, and the Buyer agrees to accept and pay for the goods in accordance with the terms and conditions of this Contract.
1.2. Goods description, quantity, unit of measurement, and unit price are specified in the Annex (Specification / Spesifikatsiya) No. 1, which is an integral part of this Contract.
1.3. The goods must conform to the agreed specifications and applicable international quality standards.

2. TOTAL CONTRACT VALUE / UMUMIY SUMMA

2.1. The total value of this Contract is {{SUMMA}} ({{SUMMA_MATN}}) UZS / (or agreed currency).
2.2. Unit prices are fixed for the duration of this Contract and shall not be amended without written mutual consent.
2.3. All bank charges in the Seller's country are borne by the Seller; charges in the Buyer's country are borne by the Buyer.

3. DELIVERY TERMS / YETKAZIB BERISH SHARTLARI

3.1. Delivery terms: {{INCOTERMS}} (Incoterms 2020).
3.2. Place of delivery: {{YETKAZISH_JOY}}.
3.3. Delivery period: within _______ days from the date of signing this Contract / receipt of advance payment.
3.4. Partial shipments: [ ] Allowed / [ ] Not allowed.

4. PAYMENT TERMS / TO'LOV SHARTLARI

4.1. Payment method: {{TOLOV_USULI}}.
4.2. Payment currency: {{VALYUTA}}.
4.3. Payment schedule:
— ___% advance within _____ banking days from signing;
— balance within _____ banking days after shipping documents received.
4.4. Banking details of the Seller: _______________________

5. SHIPPING DOCUMENTS / YETKAZIB BERISH HUJJATLARI

5.1. The Seller shall provide the following shipping documents:
— Commercial Invoice (Tijorat fakturasi);
— Packing List (Qadoqlash ro'yxati);
— Bill of Lading / CMR / Airway Bill;
— Certificate of Origin (Kelib chiqish sertifikati);
— Quality Certificate (Sifat sertifikati);
— Other documents as agreed by the parties.

6. QUALITY AND INSPECTION / SIFAT VA TEKSHIRUV

6.1. The goods shall comply with the agreed specifications and certificates.
6.2. Inspection at port of loading: Seller's responsibility (certificate of inspection to be provided).
6.3. Claims for quality and quantity: to be submitted within 30 days after delivery.
6.4. If defective goods are confirmed, the Seller shall replace them or refund the price.

7. FORCE MAJEURE / FORS-MAJOR

7.1. Neither party shall be held liable for failure to perform obligations due to force majeure circumstances (natural disasters, wars, sanctions, government prohibitions, pandemic, etc.).
7.2. The affected party must notify the other party in writing within 7 days and provide a certificate from the competent authority.
7.3. If force majeure continues for more than 60 days, either party may terminate this Contract without penalty.

8. DISPUTE RESOLUTION / NIZOLARNI HAL ETISH

8.1. All disputes shall first be resolved through negotiations within 30 days.
8.2. If no resolution is reached, disputes shall be submitted to:
[ ] Arbitration under ICC Rules (Paris) [ ] Arbitration under UNCITRAL Rules
[ ] Courts of the Republic of Uzbekistan [ ] Other: _______________________
8.3. The governing law of this Contract: Law of the Republic of Uzbekistan / CISG (UN Convention on Contracts for the International Sale of Goods).

9. VALIDITY / AMAL QILISH MUDDATI

9.1. This Contract enters into force upon signing and remains valid until obligations are fully performed.
9.2. Either party may terminate this Contract by giving 30 days written notice.

10. PARTIES' DETAILS / TOMONLARNING REKVIZITLARI

BUYER / XARIDOR:                            SELLER / SOTUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN/TIN: {{BUYURTMACHI_INN}}               INN/TIN: {{IJROCHI_INN}}
Director: {{BUYURTMACHI_RAHBAR}}           Director: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        SEAL / M.O.                                 SEAL / M.O.`

// ─── BOSHQA ──────────────────────────────────────────────────────────────────

const HAMKORLIK_SHARTNOMA = `HAMKORLIK SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "1-tomon" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "2-tomon" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, o'zaro hamkorlik to'g'risida quyidagilarni kelishib oldilar:

1. HAMKORLIK PREDMETI

1.1. Tomonlar quyidagi soha(lar)da o'zaro hamkorlikni yo'lga qo'yishga qaror qildilar:
— _______________________
1.2. Hamkorlikning maqsadi: umumiy foyda ko'rish, bozorni kengaytirish va iqtisodiy samaradorlikni oshirish.
1.3. Hamkorlik doirasida bajariladigan ishlarning batafsil ro'yxati tomonlar o'rtasidagi yozma kelishuvlarda belgilanadi.

2. TOMONLARNING VAZIFALARI VA ULUSHI

2.1. 1-tomon zimmasidagi vazifalar:
— _______________________
2.2. 2-tomon zimmasidagi vazifalar:
— _______________________
2.3. Foyda va xarajatlarni taqsimlash nisbati: 1-tomon ____%, 2-tomon ____%.

3. MOLIYAVIY SHARTLAR

3.1. Hamkorlik bo'yicha umumiy loyiha qiymati: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
3.2. Har bir tomon investitsiyasi: alohida kelishuvda belgilanadi.
3.3. Moliyaviy hisob-kitob tartibi tomonlarning yozma kelishuviga asosan oyma-oy amalga oshiriladi.

4. MAXFIYLIK

4.1. Tomonlar hamkorlik davomida olgan tijorat sirlari, texnologiyalar va boshqa maxfiy ma'lumotlarni uchinchi shaxslarga oshkor etmaslik majburiyatini oladilar.
4.2. Ushbu majburiyat shartnoma tugaganidan keyin ham 5 (besh) yil davomida kuchda qoladi.

5. INTELLEKTUAL MULK

5.1. Hamkorlik doirasida birgalikda yaratilgan intellektual mulk ob'ektlari tomonlarga teng ulushda tegishli.
5.2. Biror tomon o'z hissasi bilan yaratgan ob'ektga oid huquqlar unga tegishli bo'lib qoladi.

6. MAS'ULIYAT VA NIZOLARNI HAL ETISH

6.1. Tomonlar o'z majburiyatlarini bajarmasa amaldagi qonunchilikka muvofiq javobgarlikka tortiladi.
6.2. Nizolar muzokara yo'li bilan 30 kun ichida hal etiladi; hal bo'lmasa O'zbekiston Respublikasi Iqtisodiy sudlarida ko'rib chiqiladi.

7. SHARTNOMANING AMAL QILISH MUDDATI

7.1. Shartnoma imzolangan kundan kuchga kiradi va 1 (bir) yil amal qiladi. Tomonlardan biri e'tiroz bildirmasa avtomatik ravishda uzaytiriladi.
7.2. Tomonlardan biri shartnomani 30 (o'ttiz) kun oldin yozma ogohlantirish bilan bekor qilish huquqiga ega.

8. TOMONLARNING REKVIZITLARI

1-TOMON:                                    2-TOMON:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`

const VOSITACHILIK_SHARTNOMA = `VOSITACHILIK (AGENT) SHARTNOMASI
No {{RAQAM}}

{{SHAHAR}} shahri                                             "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Prinsipal" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Agent" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, O'zbekiston Respublikasi Fuqarolik Kodeksining 817-828-moddalari asosida quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Agent Prinsipalning nomidan va hisobidan (yoki o'z nomidan, lekin Prinsipal hisobidan) uchinchi shaxslar bilan quyidagi turdagi bitimlar tuzish majburiyatini oladi:
— _______________________
1.2. Agent vakolati: ushbu shartnomaga ilova qilingan ishonchnoma asosida belgilanadi.
1.3. Agent faqat ushbu shartnomada ko'rsatilgan vakolat doirasida harakat qiladi.

2. AGENTLIK HAQI VA TO'LOV TARTIBI

2.1. Agentning haqi: tuzilgan har bir bitim summasining _______ % miqdorida.
2.2. Agar shartnoma muddati uchun belgilangan umumiy haq: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.3. To'lov tartibi: har oy oxirida hisobot taqdim etilgandan keyin 5 (besh) ish kuni ichida.
2.4. Safarbar xarajatlar (yo'l, mehmonxona) Prinsipal tomonidan hujjatlar asosida qoplanadi.

3. TOMONLARNING MAJBURIYATLARI

3.1. Agent majburiyatlari:
— Prinsipalning manfaatlarini ko'zlab harakat qilish;
— tuzilgan bitimlar to'g'risida oyma-oy yozma hisobot berish;
— Prinsipalning tijorat sirlarini saqlash;
— uchinchi shaxslardan tushgan barcha to'lovlarni zudlik bilan Prinsipalga o'tkazish.

3.2. Prinsipal majburiyatlari:
— Agent faoliyati uchun zarur hujjat va ma'lumotlarni taqdim etish;
— Agentning asosli xarajatlarini qoplash;
— agentlik haqini o'z vaqtida to'lash.

4. SUBAGENTLIK

4.1. Agent Prinsipalning yozma roziligisiz subagent jalb qilish huquqiga ega emas.

5. KONFIDENSIALLIK VA MAS'ULIYAT

5.1. Agent Prinsipalning tijorat sirlari, mijozlar bazasi va boshqa maxfiy ma'lumotlarini oshkor etmaslik majburiyatini oladi. Ushbu majburiyat 3 yil davomida kuchda qoladi.
5.2. Agent vakolat doirasidan chiqib tuzilgan bitimlar uchun shaxsan javob beradi.
5.3. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi Iqtisodiy sudlarida ko'rib chiqiladi.

6. SHARTNOMANING AMAL QILISH MUDDATI

6.1. Shartnoma imzolangan kundan kuchga kiradi va _______ oy (yil) amal qiladi.
6.2. Tomonlardan biri shartnomani 30 (o'ttiz) kun oldin yozma ogohlantirish bilan bekor qilish huquqiga ega.

7. TOMONLARNING REKVIZITLARI

PRINSIPAL:                                  AGENT:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
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
  },

  // ── MOLIYAVIY ──
  {
    id: 'dt-moliyaviy-01',
    type: 'moliyaviy',
    name: 'Foizsiz qarz shartnomasi',
    description: "Yuridik shaxslar o'rtasida foizsiz moliyaviy yordam ko'rsatish uchun. Oylik, choraklik yoki bir mushtda qaytarish varianti belgilangan.",
    icon: '💰',
    isDefault: true,
    tags: ['qarz', 'foizsiz', 'moliyaviy yordam'],
    content: MOLIYAVIY_FOIZSIZ,
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
  },
]
