export type ContractType =
  | 'oldi_sotdi'
  | 'xizmat'
  | 'ijara'
  | 'pudrat'
  | 'qoshimcha'
  | 'moliyaviy'
  | 'daval'
  | 'xalqaro'
  | 'boshqa'

export const CONTRACT_TYPE_NAMES: Record<ContractType, string> = {
  oldi_sotdi:  'Oldi-sotdi shartnomasi',
  xizmat:      "Xizmat ko'rsatish shartnomasi",
  ijara:       'Ijara shartnomasi',
  pudrat:      'Pudrat shartnomasi',
  qoshimcha:   "Qo'shimcha shartnoma",
  moliyaviy:   'Moliyaviy yordam shartnomasi',
  daval:       'Daval shartnomasi',
  xalqaro:     'Xalqaro shartnoma',
  boshqa:      'Boshqa shartnoma',
}

// Platseholder-lar:
// {{RAQAM}}          — shartnoma raqami
// {{SANA}}           — shartnoma sanasi
// {{SHAHAR}}         — shahar (Toshkent)
// {{BUYURTMACHI}}    — buyurtmachi nomi
// {{BUYURTMACHI_INN}} — buyurtmachi INN
// {{BUYURTMACHI_RAHBAR}} — buyurtmachi rahbari
// {{IJROCHI}}        — ijrochi nomi
// {{IJROCHI_INN}}    — ijrochi INN
// {{IJROCHI_RAHBAR}} — ijrochi rahbari
// {{SUMMA}}          — shartnoma summasi (raqamda)
// {{SUMMA_MATN}}     — shartnoma summasi (so'zda)

export const CONTRACT_TEMPLATES: Record<ContractType, string> = {

  // ─────────────────────────────────────────────────
  oldi_sotdi: `OLDI-SOTDI SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Xaridor" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Sotuvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Sotuvchi Xaridorga tovarlarni (keyingi o'rinlarda "Tovar" deb yuritiladi) sotishi va Xaridor ushbu tovarlarni qabul qilib olishi va to'lashi majburiyatini oladi.
1.2. Tovarning nomi, miqdori va narxi ushbu shartnomaga ilova qilinadigan Spesifikatsiyada ko'rsatiladi.
1.3. Tovarlar sifati amaldagi standartlar va texnik shartlarga muvofiq bo'lishi kerak.

2. TOVAR NARXI VA UMUMIY SUMMA

2.1. Ushbu shartnoma bo'yicha tovarlarning umumiy qiymati {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
2.2. Tovar narxi O'zbekiston Respublikasi milliy valyutasida — so'mda belgilangan.
2.3. QQS amaldagi qonunchilikka muvofiq hisoblab qo'shiladi.

3. TO'LOV TARTIBI

3.1. Xaridor tovarni qabul qilib olgandan so'ng 10 (o'n) bank ishi kuni ichida to'lovni amalga oshiradi.
3.2. To'lov Xaridorning bank hisobvarag'idan Sotuvchining bank hisobvarag'iga naqd pulsiz o'tkazma yo'li bilan amalga oshiriladi.
3.3. To'lov sana hisoblanadi — Sotuvchining bank hisobvarag'iga pul tushgan sana.

4. TOVARNI YETKAZIB BERISH TARTIBI

4.1. Tovarni yetkazib berish muddati: shartnoma imzolanganidan keyin 30 (o'ttiz) kalendar kuni ichida.
4.2. Tovar yetkazib berish joyi: Xaridorning yuridik manzili yoki tomonlar kelishgan joy.
4.3. Tovarni saqlash va tashish xarajatlari Sotuvchi tomonidan qoplanadi (boshqacha kelishuv bo'lmasa).
4.4. Tovar topshirilganda Xaridor tovar-pul hujjatlariga imzo qo'yadi.

5. TOMONLARNING HUQUQ VA MAJBURIYATLARI

5.1. Sotuvchi majburiyatlari:
— belgilangan muddatda va sifatda tovarni yetkazib berish;
— tovar bilan birga barcha kerakli hujjatlarni (sertifikat, yo'l-yo'riq va h.k.) taqdim etish;
— tovar nuqsonli bo'lsa, uni almashtirish yoki narxini qaytarish.

5.2. Xaridor majburiyatlari:
— tovarni belgilangan muddatda qabul qilish;
— to'lovni o'z vaqtida amalga oshirish;
— tovarni qabul qilishda tekshirib ko'rish va nuqsonlar aniqlansa darhol xabar berish.

6. TOVAR SIFATI VA KAFOLAT

6.1. Sotuvchi tovar sifatiga 12 (o'n ikki) oy kafolat beradi.
6.2. Kafolat muddati tovar Xaridorga topshirilgan kundan boshlanadi.
6.3. Kafolat muddatida yuzaga kelgan nuqsonlar Sotuvchi tomonidan bepul bartaraf etiladi.

7. MAS'ULIYAT

7.1. Tomonlar ushbu shartnoma bo'yicha o'z majburiyatlarini bajarmaslik yoki lozim darajada bajarmaslik uchun amaldagi qonunchilikka muvofiq javobgar bo'ladi.
7.2. To'lovni kechiktirganlik uchun Xaridor har kechiktirilgan kun uchun kechiktirilgan summaning 0.1% miqdorida penya to'laydi.
7.3. Tovar yetkazib berishni kechiktirganlik uchun Sotuvchi har kechiktirilgan kun uchun tovar qiymatining 0.1% miqdorida penya to'laydi.

8. FORS-MAJOR HOLATLARI

8.1. Tomonlar o'z nazoratidan tashqarida bo'lgan va oldindan ko'rib bo'lmaydigan holatlar (fors-major): tabiiy ofat, urush, epidemiya, davlat organlari qarorlari natijasida yuzaga keladigan majburiyatlarni bajara olmaslik uchun javobgar emas.
8.2. Fors-major holatlar yuzaga kelganda, ta'sirlangan tomon boshqa tomonga 5 (besh) kalendar kuni ichida xabar berishi shart.

9. NIZOLARNI HAL ETISH

9.1. Ushbu shartnoma bo'yicha yuzaga keladigan nizolar muzokaralar yo'li bilan hal etiladi.
9.2. Muzokaralar natija bermasa, nizolar O'zbekiston Respublikasining amaldagi qonunchiligiga muvofiq sudda hal etiladi.

10. SHARTNOMANING AMAL QILISH MUDDATI

10.1. Ushbu shartnoma imzolanган kundan kuchga kiradi va majburiyatlar to'liq bajarilgunga qadar amal qiladi.
10.2. Tomonlardan biri shartnomani bekor qilmoqchi bo'lsa, boshqa tomonga kamida 30 (o'ttiz) kun oldin yozma xabar berishi kerak.

11. BOSHQA SHARTLAR

11.1. Ushbu shartnomaga o'zgartirishlar faqat ikki tomonning yozma kelishuvi bilan kiritilishi mumkin.
11.2. Ushbu shartnoma ikki nusxada tuzilgan, har bir tomon uchun bir nusxadan.
11.3. Shartnomaga ilova: Spesifikatsiya (tovarlar ro'yxati).

12. TOMONLARNING REKVIZITLARI

XARIDOR:                                    SOTUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`,

  // ─────────────────────────────────────────────────
  xizmat: `XIZMAT KO'RSATISH SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Buyurtmachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Ijrochi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijrochi Buyurtmachiga ushbu shartnomada belgilangan xizmatlarni ko'rsatish majburiyatini oladi, Buyurtmachi esa ko'rsatilgan xizmatlarni qabul qilib olish va haq to'lash majburiyatini oladi.
1.2. Ko'rsatiladigan xizmatlarning to'liq ro'yxati va tavsifi ushbu shartnomaga ilova qilinadigan Texnik topshiriqda belgilanadi.
1.3. Xizmatlar O'zbekiston Respublikasining amaldagi qonunchiligiga va taraflar o'rtasida kelishilgan talablarga muvofiq ko'rsatiladi.

2. XIZMAT NARXI VA TO'LOV TARTIBI

2.1. Ko'rsatilgan xizmatlar uchun umumiy to'lov miqdori {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
2.2. To'lov tartibi:
— Shartnoma imzolanganidan keyin 3 (uch) ish kuni ichida 50% avans to'lovi;
— Xizmatlar to'liq ko'rsatilgandan va qabul dalolatnomasi imzolanganidan keyin 5 (besh) ish kuni ichida qolgan 50%.
2.3. To'lov naqd pulsiz bank o'tkazma yo'li bilan amalga oshiriladi.

3. XIZMAT KO'RSATISH MUDDATI

3.1. Xizmat ko'rsatishning boshlanish sanasi: shartnoma imzolanganidan keyin 3 (uch) ish kuni.
3.2. Xizmat ko'rsatishning tugash muddati: tomonlar qo'shimcha kelishuvi bilan belgilanadi.
3.3. Ijrochi xizmat ko'rsatishning belgilangan muddatlariga rioya qilishi shart.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Ijrochi majburiyatlari:
— xizmatlarni belgilangan sifat va muddatda ko'rsatish;
— xizmat ko'rsatish jarayonida Buyurtmachining qonuniy talablarini bajarish;
— xizmat ko'rsatish davomida olgan maxfiy ma'lumotlarni oshkor etmaslik;
— xizmatlar ko'rsatilib bo'lgach, qabul dalolatnomasini taqdim etish.

4.2. Buyurtmachi majburiyatlari:
— xizmat ko'rsatish uchun zarur sharoit yaratish;
— to'lovni belgilangan muddatda amalga oshirish;
— xizmatlarni o'z vaqtida qabul qilib olish va dalolatnomani imzolash.

5. XIZMATLARNI QABUL QILISH TARTIBI

5.1. Ijrochi xizmatlarni ko'rsatib bo'lgach, Buyurtmachiga qabul-topshiriq dalolatnomasini taqdim etadi.
5.2. Buyurtmachi 3 (uch) ish kuni ichida dalolatnomani imzolaydi yoki asosli rad etishni yozma ravishda bildiradi.
5.3. Belgilangan muddat ichida Buyurtmachi hech qanday javob bermasa, xizmatlar qabul qilingan hisoblanadi.

6. KONFIDENSIALLIK

6.1. Tomonlar ushbu shartnoma doirasida olgan barcha ma'lumotlarni maxfiy saqlab, uchinchi shaxslarga oshkor etmaslik majburiyatini oladilar.
6.2. Ushbu band shartnoma tugaganidan keyin ham 3 (uch) yil davomida kuchda qoladi.

7. MAS'ULIYAT

7.1. To'lovni kechiktirganlik uchun Buyurtmachi kechiktirilgan har bir kun uchun 0.1% miqdorida penya to'laydi.
7.2. Xizmat ko'rsatishni kechiktirganlik uchun Ijrochi kechiktirilgan har bir kun uchun 0.1% miqdorida penya to'laydi.
7.3. Sifatsiz xizmat ko'rsatilgan taqdirda Ijrochi xizmatni qayta ko'rsatish yoki Buyurtmachiga yetkazilgan zararni qoplash majburiyatini oladi.

8. NIZOLARNI HAL ETISH

8.1. Nizolar muzokara yo'li bilan hal etiladi.
8.2. Kelishmovchilik hal bo'lmasa, O'zbekiston Respublikasi sudlari orqali ko'rib chiqiladi.

9. SHARTNOMANING AMAL QILISH MUDDATI

9.1. Shartnoma imzolangan kundan kuchga kiradi va majburiyatlar to'liq bajarilgunga qadar amal qiladi.

10. TOMONLARNING REKVIZITLARI

BUYURTMACHI:                                IJROCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`,

  // ─────────────────────────────────────────────────
  ijara: `IJARA SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Ijarachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Ijaraberuvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijaraberuvchi Ijarachiga quyidagi mol-mulkni (keyingi o'rinlarda "Ijara ob'ekti") vaqtincha foydalanish uchun beradi:
— Manzil / tavsif: _______________________
— Maydoni / hajmi: _______________________
— Kadastr raqami (agar mavjud bo'lsa): _______________________
1.2. Ijara ob'ekti ushbu shartnoma imzolanganida ko'rsatilgan holda topshiriladi.

2. IJARA MUDDATI

2.1. Ijara muddati: shartnoma imzolanganidan boshlab 12 (o'n ikki) oy.
2.2. Ijara muddati tugagandan keyin tomonlar kelishgan holda shartnoma uzaytirilishi mumkin.

3. IJARA HAQI

3.1. Oylik ijara haqi {{OYLIK_TOLOV}} ({{OYLIK_TOLOV_MATN}}) so'mni tashkil etadi. Butun ijara muddati uchun umumiy summa: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
3.2. Ijara haqi har oyning 5 (beshinchi) kuniga qadar to'lanadi.
3.3. Kommunal xizmatlar (elektr, gaz, suv) Ijarachi tomonidan alohida to'lanadi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Ijaraberuvchi majburiyatlari:
— ijara ob'ektini kelishilgan holda va muddatda topshirish;
— ijara muddati davomida ob'ektdan foydalanishga to'sqinlik qilmaslik;
— kapital ta'mirlash ishlarini o'z vaqtida bajarish.

4.2. Ijarachi majburiyatlari:
— ijara haqini belgilangan muddatda to'lash;
— ijara ob'ektini ehtiyotkorlik bilan ishlatish va saqlash;
— ob'ektda joylashgan muhandislik tarmoqlarini buzmaslik;
— ijara muddati tugagach ob'ektni dastlabki holatda qaytarish;
— ob'ektda o'zgartirish kiritish uchun oldindan yozma ruxsat olish.

5. MAS'ULIYAT

5.1. Ijara haqini kechiktirganlik uchun Ijarachi kechiktirilgan har bir kun uchun 0.1% penya to'laydi.
5.2. Ijara ob'ektiga yetkazilgan zarar uchun Ijarachi to'liq javob beradi.

6. SHARTNOMANI BEKOR QILISH

6.1. Tomonlardan biri shartnomani muddatidan oldin bekor qilmoqchi bo'lsa, 30 (o'ttiz) kun oldin yozma ogohlantirish berishi shart.
6.2. Ijara haqi 2 (ikki) oydan ko'p kechiktirilsa, Ijaraberuvchi shartnomani bir tomonlama bekor qilish huquqiga ega.

7. NIZOLARNI HAL ETISH

7.1. Nizolar muzokara yo'li bilan, kelishmovchilik hal bo'lmasa O'zbekiston Respublikasi sudlari orqali hal etiladi.

8. TOMONLARNING REKVIZITLARI

IJARACHI:                                   IJARABERUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`,

  // ─────────────────────────────────────────────────
  pudrat: `PUDRAT SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Buyurtmachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Pudratchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Pudratchi Buyurtmachining topshirig'iga binoan quyidagi ishlarni bajarish majburiyatini oladi:
— Ishning nomi va hajmi: _______________________
— Ish joyi (ob'ekt): _______________________
— Texnik talablar: ushbu shartnomaga ilova qilinadigan Texnik topshiriqqa muvofiq.
1.2. Buyurtmachi bajarilgan ishlarni qabul qilib olish va belgilangan haqni to'lash majburiyatini oladi.

2. ISH BAJARISH MUDDATI

2.1. Ishlarni boshlash sanasi: shartnoma imzolanganidan keyin 5 (besh) ish kuni ichida.
2.2. Ishlarni yakunlash muddati: _______________________
2.3. Alohida bosqichlar bo'lsa, bosqichlar jadvali qo'shimcha kelishuvda belgilanadi.

3. SHARTNOMA NARXI VA TO'LOV TARTIBI

3.1. Ishlarning umumiy narxi {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
3.2. To'lov tartibi:
— Shartnoma imzolanganida 30% avans;
— Ishlar 50% bajarilganda 40%;
— Ishlar to'liq qabul qilinganida qolgan 30%.
3.3. To'lov qabul-topshiriq dalolatnomasiga asosan amalga oshiriladi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Pudratchi majburiyatlari:
— ishlarni belgilangan muddatda va sifatda bajarish;
— o'z mablag'i va resurslari bilan ta'minlash (boshqacha kelishuv bo'lmasa);
— xavfsizlik texnikasi qoidalariga rioya qilish;
— ishlar davomida Buyurtmachini muhim holatlar haqida xabardor qilib borish.

4.2. Buyurtmachi majburiyatlari:
— ishlar uchun zarur sharoit va materiallarni ta'minlash (kelishilgan bo'lsa);
— bajarilgan ishlarni o'z vaqtida qabul qilish;
— to'lovni belgilangan jadval asosida amalga oshirish.

5. ISHLARNI QABUL QILISH

5.1. Pudratchi ishlarni yakunlagach, Buyurtmachiga qabul-topshiriq dalolatnomasini taqdim etadi.
5.2. Buyurtmachi 5 (besh) ish kuni ichida ishlarni tekshirib, dalolatnomani imzolaydi yoki asosli rad etishni bildiradi.

6. KAFOLAT MUDDATI

6.1. Bajarilgan ishlar sifatiga kafolat muddati 12 (o'n ikki) oy.
6.2. Kafolat muddatida yuzaga kelgan nuqsonlar Pudratchi tomonidan bepul bartaraf etiladi.

7. MAS'ULIYAT

7.1. Ishlarni kechiktirganlik uchun Pudratchi kechiktirilgan har bir kun uchun shartnoma summasining 0.1% miqdorida penya to'laydi.
7.2. To'lovni kechiktirganlik uchun Buyurtmachi ham xuddi shunday penya to'laydi.

8. NIZOLARNI HAL ETISH

8.1. Nizolar muzokara yo'li bilan hal etiladi, kelishmovchilik hal bo'lmasa O'zbekiston Respublikasi sudlari orqali.

9. TOMONLARNING REKVIZITLARI

BUYURTMACHI:                                PUDRATCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`,

  // ─────────────────────────────────────────────────
  qoshimcha: `QO'SHIMCHA SHARTNOMA
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "1-tomon" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "2-tomon" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, asosiy shartnomaga qo'shimcha sifatida quyidagilarni kelishib oldilar:

1. ASOSIY SHARTNOMA MA'LUMOTLARI

1.1. Ushbu qo'shimcha shartnoma ________________ raqamli ________________ sanasida tuzilgan asosiy shartnomaning ajralmas qismi hisoblanadi.

2. O'ZGARTIRISHLAR VA QO'SHIMCHALAR

2.1. Asosiy shartnomaning ___ bandiga quyidagi o'zgartirish kiritilsin:
"_______________________"
o'rniga:
"_______________________"

2.2. Asosiy shartnomaga quyidagi yangi band qo'shilsin:
"_______________________"

3. MOLIYAVIY O'ZGARISHLAR

3.1. Ushbu qo'shimcha shartnoma asosida tomonlar o'rtasidagi hisob-kitob summasi {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
3.2. To'lov tartibi asosiy shartnomada belgilangan tartibda amalga oshiriladi.

4. KUCHGA KIRISH TARTIBI

4.1. Ushbu qo'shimcha shartnoma ikki tomon imzolagan kundan kuchga kiradi.
4.2. Asosiy shartnomaning ushbu qo'shimchada zikr etilmagan barcha qolgan bandlari o'z kuchini saqlaydi.

5. TOMONLARNING REKVIZITLARI

1-TOMON:                                    2-TOMON:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`,

  // ─────────────────────────────────────────────────
  moliyaviy: `MOLIYAVIY YORDAM SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Qarz beruvchi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Qarz oluvchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Qarz beruvchi Qarz oluvchiga moliyaviy yordam sifatida {{SUMMA}} ({{SUMMA_MATN}}) so'm miqdorida qarz beradi.
1.2. Ushbu qarz foizsiz beriladi (yoki: yillik ____% foiz bilan beriladi).
1.3. Qarz maqsadi: _______________________

2. QARZNI BERISH TARTIBI

2.1. Qarz shartnoma imzolanganidan keyin 5 (besh) bank ishi kuni ichida Qarz oluvchining hisob raqamiga o'tkaziladi.
2.2. Pul o'tkazilgandan keyin Qarz oluvchi qabul qilganini tasdiqlovchi hujjat imzolaydi.

3. QARZNI QAYTARISH TARTIBI

3.1. Qarz oluvchi qarzni ___ oy (yil) ichida to'liq qaytarish majburiyatini oladi.
3.2. Qaytarish jadvalı:
— Har oyning ___ kuniga qadar oylik to'lov: _______ so'm;
— Yoki bir mushtda: ________________ sanasiga qadar.
3.3. Muddatidan oldin qaytarish mumkin, bu haqda 3 (uch) kun oldin xabar berish kerak.

4. MAS'ULIYAT

4.1. Qarzni qaytarishni kechiktirganlik uchun Qarz oluvchi kechiktirilgan summaning kuniga 0.05% miqdorida penya to'laydi.
4.2. Qarz oluvchi qarzni qaytara olmaydigan bo'lib qolsa, Qarz beruvchiga zudlik bilan xabar berishi shart.

5. NIZOLARNI HAL ETISH

5.1. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi sudlari orqali hal etiladi.

6. TOMONLARNING REKVIZITLARI

QARZ BERUVCHI:                              QARZ OLUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`,

  // ─────────────────────────────────────────────────
  daval: `DAVAL SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "Buyurtmachi" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "Qayta ishlovchi" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Buyurtmachi Qayta ishlovchiga xom ashyo (daval material) beradi, Qayta ishlovchi esa uni qayta ishlab, tayyor mahsulot sifatida Buyurtmachiga qaytaradi.
1.2. Daval material turi va miqdori: _______________________
1.3. Tayyor mahsulot turi va hajmi: _______________________

2. TOMONLARNING MAJBURIYATLARI

2.1. Buyurtmachi majburiyatlari:
— xom ashyoni kelishilgan miqdor va muddatda yetkazib berish;
— xom ashyo sifatiga doir hujjatlarni taqdim etish;
— qayta ishlash xizmatini belgilangan muddatda to'lash.

2.2. Qayta ishlovchi majburiyatlari:
— xom ashyoni belgilangan texnologiya asosida qayta ishlash;
— tayyor mahsulotni kelishilgan muddatda topshirish;
— xom ashyo yo'qolishi yoki buzilishi uchun javob berish.

3. QAYTA ISHLASH NARXI VA TO'LOV

3.1. Qayta ishlash xizmati narxi {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
3.2. To'lov tayyor mahsulot topshirilganidan keyin 10 (o'n) ish kuni ichida amalga oshiriladi.

4. MUDDATLAR

4.1. Xom ashyo topshirilish sanasi: _______________________
4.2. Tayyor mahsulot topshirilish sanasi: _______________________

5. MAS'ULIYAT

5.1. Qayta ishlovchi xom ashyoni yo'qotish yoki shikastlash uchun uning to'liq qiymatini qoplash majburiyatini oladi.
5.2. Kechikishlar uchun kechiktirilgan har bir kun uchun 0.1% penya to'lanadi.

6. NIZOLARNI HAL ETISH

6.1. Nizolar muzokara orqali, hal bo'lmasa O'zbekiston Respublikasi sudlari orqali hal etiladi.

7. TOMONLARNING REKVIZITLARI

BUYURTMACHI:                                QAYTA ISHLOVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`,

  // ─────────────────────────────────────────────────
  xalqaro: `XALQARO SHARTNOMA (FOREIGN TRADE CONTRACT)
№ {{RAQAM}}

{{SHAHAR}}                                           "{{SANA}}"

{{BUYURTMACHI}}, hereinafter referred to as the "Buyer", represented by {{BUYURTMACHI_RAHBAR}}, on the one hand, and {{IJROCHI}}, hereinafter referred to as the "Seller", represented by {{IJROCHI_RAHBAR}}, on the other hand, have concluded this Contract as follows:

1. SUBJECT OF THE CONTRACT / SHARTNOMA PREDMETI

1.1. The Seller agrees to supply and the Buyer agrees to accept and pay for the goods in accordance with the terms of this Contract.
1.2. Goods description, quantity and specifications are defined in the Annex (Specification) to this Contract.

2. TOTAL CONTRACT VALUE / SHARTNOMA UMUMIY SUMMASI

2.1. The total value of this Contract is {{SUMMA}} ({{SUMMA_MATN}}) UZS.
2.2. All payments shall be made in USD / EUR / UZS (as agreed by the parties).

3. DELIVERY TERMS / YETKAZIB BERISH SHARTLARI

3.1. Delivery terms: _______ (Incoterms 2020)
3.2. Delivery period: within ______ days from the date of signing this Contract.
3.3. Place of delivery: _______________________

4. PAYMENT TERMS / TO'LOV SHARTLARI

4.1. Payment method: Bank Transfer / Letter of Credit
4.2. Payment due: within ______ banking days after shipment documents are provided.

5. QUALITY AND INSPECTION / SIFAT VA TEKSHIRUV

5.1. The goods shall comply with the technical specifications agreed by the parties.
5.2. Inspection at loading port: Seller's responsibility.
5.3. Claims for quality: within 30 days after delivery.

6. FORCE MAJEURE / FORS-MAJOR

6.1. Neither party shall be liable for failure to perform its obligations due to force majeure circumstances.
6.2. The affected party must notify the other party within 5 days.

7. DISPUTE RESOLUTION / NIZOLARNI HAL ETISH

7.1. All disputes shall be settled through negotiations.
7.2. If no agreement is reached — through arbitration under ICC rules or courts of the Republic of Uzbekistan.

8. APPLICABLE LAW / QONUNCHILIK

8.1. This Contract is governed by the laws of the Republic of Uzbekistan and international trade law norms.

9. PARTIES' DETAILS / TOMONLARNING REKVIZITLARI

BUYER / XARIDOR:                            SELLER / SOTUVCHI:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN/TIN: {{BUYURTMACHI_INN}}               INN/TIN: {{IJROCHI_INN}}
Director: {{BUYURTMACHI_RAHBAR}}           Director: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        SEAL                                        SEAL`,

  // ─────────────────────────────────────────────────
  boshqa: `SHARTNOMA
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{BUYURTMACHI}}, keyingi o'rinlarda "1-tomon" deb yuritiladi, {{BUYURTMACHI_RAHBAR}} nomidan, bir tomondan, va {{IJROCHI}}, keyingi o'rinlarda "2-tomon" deb yuritiladi, {{IJROCHI_RAHBAR}} nomidan, ikkinchi tomondan, quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. _______________________
1.2. _______________________

2. NARX VA TO'LOV TARTIBI

2.1. Shartnoma summasi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.2. To'lov tartibi: _______________________

3. TOMONLARNING MAJBURIYATLARI

3.1. 1-tomon majburiyatlari:
— _______________________

3.2. 2-tomon majburiyatlari:
— _______________________

4. MAS'ULIYAT

4.1. Tomonlar ushbu shartnomani bajarmaslik yoki lozim darajada bajarmaslik uchun amaldagi qonunchilikka muvofiq javobgar bo'ladi.

5. NIZOLARNI HAL ETISH

5.1. Nizolar muzokara yo'li bilan, hal bo'lmasa O'zbekiston Respublikasi sudlari orqali hal etiladi.

6. SHARTNOMANING AMAL QILISH MUDDATI

6.1. Shartnoma imzolangan kundan kuchga kiradi va majburiyatlar to'liq bajarilgunga qadar amal qiladi.

7. TOMONLARNING REKVIZITLARI

1-TOMON:                                    2-TOMON:
{{BUYURTMACHI}}                             {{IJROCHI}}
INN: {{BUYURTMACHI_INN}}                   INN: {{IJROCHI_INN}}
Rahbar: {{BUYURTMACHI_RAHBAR}}             Rahbar: {{IJROCHI_RAHBAR}}

________________ / {{BUYURTMACHI_RAHBAR}}  ________________ / {{IJROCHI_RAHBAR}}
        M.O.                                        M.O.`,
}

// Summani so'zga aylantirish (oddiy versiya)
export function numberToWords(num: number): string {
  if (!num || isNaN(num)) return 'nol'
  const ones = ['', 'bir', 'ikki', 'uch', 'to\'rt', 'besh', 'olti', 'yetti', 'sakkiz', 'to\'qqiz']
  const tens = ['', 'o\'n', 'yigirma', 'o\'ttiz', 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', 'to\'qson']
  const thousands = ['', 'ming', 'million', 'milliard']

  function convertChunk(n: number): string {
    if (n === 0) return ''
    if (n < 10) return ones[n]
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '')
    return ones[Math.floor(n/100)] + ' yuz' + (n%100 ? ' ' + convertChunk(n%100) : '')
  }

  const parts: string[] = []
  let remaining = Math.floor(num)
  let chunkIndex = 0

  while (remaining > 0) {
    const chunk = remaining % 1000
    if (chunk !== 0) {
      const chunkWords = convertChunk(chunk)
      parts.unshift(chunkWords + (thousands[chunkIndex] ? ' ' + thousands[chunkIndex] : ''))
    }
    remaining = Math.floor(remaining / 1000)
    chunkIndex++
  }

  return parts.join(' ') || 'nol'
}

// Shablonni to'ldirish
export function fillTemplate(
  template: string,
  data: {
    contract_number: string
    contract_date: string
    city?: string
    org_name?: string
    org_inn?: string
    org_director?: string
    cp_name?: string
    cp_inn?: string
    cp_director?: string
    amount?: number
  }
): string {
  const summa = data.amount || 0
  const summaMatn = numberToWords(summa) + ' so\'m'

  return template
    .replace(/{{RAQAM}}/g, data.contract_number || '___')
    .replace(/{{SANA}}/g, data.contract_date || '___')
    .replace(/{{SHAHAR}}/g, data.city || 'Toshkent')
    .replace(/{{BUYURTMACHI}}/g, data.org_name || '_________________')
    .replace(/{{BUYURTMACHI_INN}}/g, data.org_inn || '___')
    .replace(/{{BUYURTMACHI_RAHBAR}}/g, data.org_director || '___')
    .replace(/{{IJROCHI}}/g, data.cp_name || '_________________')
    .replace(/{{IJROCHI_INN}}/g, data.cp_inn || '___')
    .replace(/{{IJROCHI_RAHBAR}}/g, data.cp_director || '___')
    .replace(/{{SUMMA}}/g, summa.toLocaleString())
    .replace(/{{SUMMA_MATN}}/g, summaMatn)
}
