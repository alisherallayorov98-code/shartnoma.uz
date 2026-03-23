// Kadrlar bo'limi – shablonlar (template-based, AI ishlatilmaydi)

type Org = { name: string; inn: string; director_name: string }
type F = Record<string, string>

export function fmtD(iso?: string): string {
  if (!iso) {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
  }
  const parts = iso.split('-')
  return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : iso
}

// ─────────────────────────────────────────────────────────────
// 1. MEHNAT SHARTNOMASI
// ─────────────────────────────────────────────────────────────
export function tplMehnatShartnoma(f: F, org: Org, tur: string): string {
  const TURLABEL: Record<string, string> = {
    belgilanmagan_muddatli: 'belgilanmagan muddatli (doimiy)',
    belgilangan_muddatli: 'belgilangan muddatli (muddatli)',
    yarim_stavkada: 'yarim stavkali (0,5 stavka)',
    masofaviy: 'masofaviy (distant)',
    amaliyot: 'amaliyot / stajyorlik',
  }
  const sana = fmtD(f.boshlanish_sana)
  const turText = TURLABEL[tur] || tur
  const stavka = tur === 'yarim_stavkada' ? '0,5 stavka' : "to'liq stavka"
  const hafta = tur === 'yarim_stavkada' ? '20' : '40'
  const ishVaqti = f.ish_vaqti || (tur === 'yarim_stavkada' ? 'Kuniga 4 soat, dushanba–juma' : 'Kuniga 8 soat, dushanba–juma, 09:00–18:00')
  const muddatBand = tur === 'belgilangan_muddatli' && f.tugash_sana
    ? `\n1.5. Shartnoma muddati: ${fmtD(f.boshlanish_sana)} dan ${fmtD(f.tugash_sana)} gacha.` : ''
  const masofaviyBand = tur === 'masofaviy'
    ? "\n1.6. Xodim ishni masofadan (remote) bajaradi; muloqot vositalari tomonlar kelishuviga ko'ra belgilanadi." : ''

  return `MEHNAT SHARTNOMASI
(${turText})

Toshkent shahri                                    "${sana}"

${org.name} (INN: ${org.inn}), keyingi o'rinlarda "Ish beruvchi" deb yuritiladi,
vakili — ${org.director_name},
va fuqaro ${f.xodim_ism || '________________'}, pasport: ${f.passport || 'AA 0000000'},
keyingi o'rinlarda "Xodim" deb yuritiladi,
O'zbekiston Respublikasi Mehnat kodeksi asosida quyidagi shartlarda mehnat shartnomasini tuzdik:

─────────────────────────────────────────────────
1. SHARTNOMA PREDMETI
─────────────────────────────────────────────────

1.1. Ish beruvchi Xodimni "${f.lavozim || '___'}" lavozimiga${f.bolim ? ` "${f.bolim}" bo'limiga` : ''} qabul qiladi.
1.2. Ushbu shartnoma ${turText} mehnat shartnomasi hisoblanadi.
1.3. Ish boshlash sanasi: ${sana}.
1.4. Ish joyi: ${f.ish_joyi || org.name}.
1.5. Xodim ${stavka}da mehnat qiladi.${muddatBand}${masofaviyBand}

─────────────────────────────────────────────────
2. ISH HAQI VA TO'LOV TARTIBI
─────────────────────────────────────────────────

2.1. Xodimga oylik tarif ish haqi ${f.maosh || '________________'} so'm miqdorida belgilanadi.
2.2. Ish haqi har oyning 10-sanasiga ko'p bo'lmagan muddatda naqd yoki bank kartasi orqali to'lanadi.
2.3. Daromad solig'i va ijtimoiy sug'urta badallari O'zbekiston Respublikasi qonunchiligiga muvofiq
     ushlab qolinadi va to'lanadi.
2.4. Mehnat natijalari yaxshi bo'lganda qo'shimcha mukofot to'lash mumkin.

─────────────────────────────────────────────────
3. ISH VAQTI VA DAM OLISH
─────────────────────────────────────────────────

3.1. Xodimning ish vaqti: ${ishVaqti}.
3.2. Haftalik ish vaqti: ${hafta} soat.
3.3. Xodimga har yili kamida 15 ish kuni asosiy mehnat ta'tili beriladi.
3.4. Milliy bayram va dam olish kunlari O'zbekiston Respublikasi qonunchiligiga muvofiq belgilanadi.
3.5. Qo'shimcha ish vaqti tomonlar kelishuviga binoan va qonun doirasida amalga oshiriladi.

─────────────────────────────────────────────────
4. TOMONLARNING HUQUQ VA MAJBURIYATLARI
─────────────────────────────────────────────────

4.1. Ish beruvchi majburiyatlari:
     a) zarur ish joyi, asbob-uskunalar va materiallarni ta'minlash;
     b) ish haqini o'z vaqtida va to'liq to'lash;
     c) xavfsiz va sog'lom mehnat sharoitlarini yaratish;
     d) majburiy davlat ijtimoiy sug'urta badallari to'lash;
     e) Xodimni kasbiy rivojlantirishga ko'maklashish.

4.2. Xodim majburiyatlari:
     a) lavozim yo'riqnomasidagi vazifalarni sifatli va o'z vaqtida bajarish;
     b) ichki mehnat tartib-qoidalariga rioya qilish;
     c) tashkilot mulkini ehtiyotkorlik bilan ishlatish;
     d) tijorat siri va maxfiy ma'lumotlarni muhofaza qilish;
     e) mehnat xavfsizligi va sanitariya qoidalarini bajarish.

─────────────────────────────────────────────────
5. IJTIMOIY KAFOLATLAR
─────────────────────────────────────────────────

5.1. Xodim O'zbekiston Respublikasi qonunchiligida belgilangan barcha ijtimoiy kafolatlarga ega.
5.2. Vaqtinchalik mehnatga layoqatsizlik davridagi nafaqa qonunchilik asosida to'lanadi.
5.3. Ish beruvchi Xodim uchun majburiy davlat ijtimoiy sug'urta badallari to'laydi.
5.4. Homilador va bola parvarish qilayotgan xodimlar uchun qonuniy imtiyozlar qo'llaniladi.

─────────────────────────────────────────────────
6. MAXFIYLIK
─────────────────────────────────────────────────

6.1. Xodim ish jarayonida bilib olgan tijorat sirlari, mijozlar ma'lumotlari va tashkilot ichki
     axboroti uchinchi shaxslarga oshkor etilmasligi shart.
6.2. Ushbu majburiyat shartnoma bekor qilinganidan keyin ham 2 (ikki) yil davomida kuchda qoladi.

─────────────────────────────────────────────────
7. MODDIY JAVOBGARLIK
─────────────────────────────────────────────────

7.1. Xodim o'z aybi bilan yetkazgan zararni MK 187-moddasi asosida o'rtacha oylik ish haqidan
     oshmaydigan miqdorda qoplashga majburdir.
7.2. To'liq moddiy javobgarlik faqat MK 189-moddasi nazarda tutgan holatlarda qo'llaniladi.

─────────────────────────────────────────────────
8. SHARTNOMANI BEKOR QILISH
─────────────────────────────────────────────────

8.1. Shartnoma quyidagi asoslarda bekor qilinishi mumkin:
     a) tomonlarning o'zaro roziligiga binoan (MK 97-moddasi);
     b) Xodimning o'z xohishi bilan — kamida 2 hafta oldin yozma ogohlantirish yuborgan holda
        (MK 99-moddasi);
     c) Ish beruvchi tashabbusiga binoan — MK 100 va 104-moddalarida belgilangan asoslar
        mavjud bo'lganda;
     d) tomonlarga bog'liq bo'lmagan sharoitlar yuzaga kelganda (MK 105-moddasi).

─────────────────────────────────────────────────
9. NIZOLARNI HAL QILISH
─────────────────────────────────────────────────

9.1. Nizolar avval tomonlarning muzokarasi yoki mehnat nizolari komissiyasi orqali hal etiladi.
9.2. Kelishuv chiqmagan taqdirda nizo O'zbekiston Respublikasi qonunchiligiga muvofiq sudga
     topshiriladi.

─────────────────────────────────────────────────
10. TOMONLARNING REKVIZITLARI
─────────────────────────────────────────────────

ISH BERUVCHI:                              XODIM:
${org.name}                                ${f.xodim_ism || '________________'}
INN: ${org.inn}                            Pasport: ${f.passport || 'AA 0000000'}
Manzil: ${f.org_manzil || '________________'}
Tel: ${f.org_tel || '________________'}    Tel: ${f.xodim_tel || '________________'}

Direktor: ___________________              Imzo: ___________________
${org.director_name}

M.O.                                       Sana: ${sana}
`
}

// ─────────────────────────────────────────────────────────────
// 2. TASHQI O'RINDOSHLIK SHARTNOMASI
// ─────────────────────────────────────────────────────────────
export function tplOrindoshlik(f: F, org: Org): string {
  const sana = fmtD(f.boshlanish_sana)
  const kunlar = f.kunlar || 'dushanba, chorshanba, juma'
  const soat = f.soat_soni || '4'

  return `TASHQI O'RINDOSHLIK BO'YICHA MEHNAT SHARTNOMASI

Toshkent shahri                                    "${sana}"

${org.name} (INN: ${org.inn}), keyingi o'rinlarda "Ish beruvchi" deb yuritiladi,
vakili — ${org.director_name},
va fuqaro ${f.xodim_ism || '________________'}, pasport: ${f.passport || 'AA 0000000'},
keyingi o'rinlarda "Xodim" deb yuritiladi,
O'zbekiston Respublikasi Mehnat kodeksining 28-moddasi asosida quyidagi shartlarda
tashqi o'rindoshlik mehnat shartnomasini tuzdik:

─────────────────────────────────────────────────
1. SHARTNOMA PREDMETI
─────────────────────────────────────────────────

1.1. Ish beruvchi Xodimni tashqi o'rindoshlik asosida "${f.lavozim || '___'}" lavozimiga qabul qiladi.
1.2. Xodim asosiy ish joyini saqlab qolgan holda ushbu tashkilotda qo'shimcha mehnat qiladi.
1.3. O'zbekiston Respublikasi Mehnat kodeksiga muvofiq tashqi o'rindoshlik uchun haftalik ish vaqti
     20 soatdan oshmasligi shart.
1.4. Ish boshlash sanasi: ${sana}.${f.tugash_sana ? `\n1.5. Shartnoma muddati: ${fmtD(f.boshlanish_sana)} dan ${fmtD(f.tugash_sana)} gacha.` : ''}

─────────────────────────────────────────────────
2. ISH VAQTI
─────────────────────────────────────────────────

2.1. Xodim ${kunlar} kunlari ishlaydi.
2.2. Kunlik ish vaqti: ${soat} soat.
2.3. Aniq ish jadvali va vazifalar tarkibi tomonlar kelishuviga binoan belgilanadi.

─────────────────────────────────────────────────
3. ISH HAQI VA TO'LOV TARTIBI
─────────────────────────────────────────────────

3.1. Xodimga oylik ish haqi ${f.maosh || '________________'} so'm miqdorida belgilanadi.
3.2. Ish haqi har oyning 10-sanasiga naqd yoki bank kartasiga o'tkazish orqali to'lanadi.
3.3. Soliqlar va ijtimoiy sug'urta badallari qonunchilikka muvofiq ushlab qolinadi.

─────────────────────────────────────────────────
4. TOMONLARNING MAJBURIYATLARI
─────────────────────────────────────────────────

4.1. Ish beruvchi:
     a) zarur ish sharoiti va resurslarni ta'minlash;
     b) ish haqini o'z vaqtida to'lash;
     c) mehnat xavfsizligini ta'minlash.

4.2. Xodim:
     a) lavozim vazifalarini sifatli bajarish;
     b) tashkilot ichki tartib-qoidalariga rioya qilish;
     c) tijorat siri va maxfiy ma'lumotlarni muhofaza qilish;
     d) asosiy ish joyidagi ish jadvaliga xalaqit bermasligi shart.

─────────────────────────────────────────────────
5. IJTIMOIY KAFOLATLAR
─────────────────────────────────────────────────

5.1. Tashqi o'rindosh asosiy ish joyidagi kafolatlarga qo'shimcha ravishda ushbu shartnoma
     bo'yicha ham O'zbekiston Respublikasi qonunchiligida belgilangan kafolatlarga ega.
5.2. Ta'til puli bajarilgan ish haqi miqdoriga nisbatan hisoblab to'lanadi.

─────────────────────────────────────────────────
6. SHARTNOMANI BEKOR QILISH
─────────────────────────────────────────────────

6.1. Shartnoma quyidagi asoslarda bekor qilinishi mumkin:
     a) tomonlar kelishuviga binoan;
     b) Ish beruvchi ushbu lavozim uchun asosiy xodim qabul qilganda
        (1 hafta oldin yozma ogohlantirish bilan);
     c) MK 100, 104-moddalarida nazarda tutilgan asoslar bo'yicha.

─────────────────────────────────────────────────
7. TOMONLARNING REKVIZITLARI
─────────────────────────────────────────────────

ISH BERUVCHI:                              XODIM:
${org.name}                                ${f.xodim_ism || '________________'}
INN: ${org.inn}                            Pasport: ${f.passport || 'AA 0000000'}
Manzil: ${f.org_manzil || '________________'}
Tel: ${f.org_tel || '________________'}    Tel: ${f.xodim_tel || '________________'}

Direktor: ___________________              Imzo: ___________________
${org.director_name}

M.O.                                       Sana: ${sana}
`
}

// ─────────────────────────────────────────────────────────────
// 3. FUQAROVIY-HUQUQIY TUSIDAGI YOLLANMA SHARTNOMASI
// ─────────────────────────────────────────────────────────────
export function tplFuqaroviy(f: F, org: Org): string {
  const sana = fmtD(f.boshlanish_sana) || fmtD()

  return `FUQAROVIY-HUQUQIY TUSIDAGI XIZMAT KO'RSATISH SHARTNOMASI
(Yollanma shartnomasi)

Toshkent shahri                                    "${sana}"

${org.name} (INN: ${org.inn}), keyingi o'rinlarda "Buyurtmachi" deb yuritiladi,
vakili — ${org.director_name},
va fuqaro ${f.ijrochi_ism || '________________'}, pasport: ${f.passport || 'AA 0000000'},
STIR: ${f.ijrochi_stir || '___________'}, keyingi o'rinlarda "Ijrochi" deb yuritiladi,
O'zbekiston Respublikasi Fuqarolik kodeksining 734–756-moddalari asosida quyidagi shartlarda
shartnoma tuzdik:

MUHIM ESLATMA: Ushbu shartnoma mehnat shartnomasi emas. Ijrochi mustaqil faoliyat yurituvchi
shaxs bo'lib, tashkilotning shtat xodimlari tarkibiga kirmaydi va Mehnat kodeksining
kafolatlari ushbu shartnomaga tatbiq etilmaydi.

─────────────────────────────────────────────────
1. SHARTNOMA PREDMETI
─────────────────────────────────────────────────

1.1. Ijrochi Buyurtmachiga quyidagi xizmatlarni ko'rsatishga (ishlarni bajarishga) majburdir:
     ${f.xizmat_nomi || '___________________________________________'}

1.2. Xizmat ko'rsatish muddati:
     Boshlanish: ${fmtD(f.boshlanish_sana)}
     Tugash: ${fmtD(f.tugash_sana) || '________________'}

1.3. Xizmat ko'rsatish joyi: ${f.xizmat_joyi || org.name + ' ko\'rsatgan joy'}.

─────────────────────────────────────────────────
2. NARX VA TO'LOV TARTIBI
─────────────────────────────────────────────────

2.1. Xizmatlarning umumiy shartnoma narxi: ${f.narx || '________________'} so'm.
2.2. To'lov tartibi: ${f.tolov_tartibi || "ishlar qabul-topshirish dalolatnomasi imzolangandan so'ng 5 ish kuni ichida"}.
2.3. To'lov uchun asos: Ijrochi imzolagan xizmat qabul-topshirish dalolatnomasi.
2.4. Xizmat ko'rsatishga sarflangan xarajatlar alohida hujjatlar asosida qoplanishi mumkin.

─────────────────────────────────────────────────
3. TOMONLARNING MAJBURIYATLARI
─────────────────────────────────────────────────

3.1. Ijrochi majburiyatlari:
     a) xizmatlarni belgilangan muddatda va yuqori sifatda ko'rsatish;
     b) Buyurtmachining maxfiy ma'lumotlarini muhofaza qilish;
     c) bajarilgan ishlar bo'yicha hisobot va dalolatnoma taqdim etish;
     d) Buyurtmachi taqdim etgan materiallarni maqsadli ishlatish.

3.2. Buyurtmachi majburiyatlari:
     a) ishlarni bajarish uchun zarur ma'lumot va materiallarni o'z vaqtida taqdim etish;
     b) bajarilgan ishlarni 3 ish kuni ichida qabul qilish yoki asosli rad etish;
     c) kelishilgan to'lovni o'z vaqtida amalga oshirish.

─────────────────────────────────────────────────
4. ISHNI QABUL QILISH
─────────────────────────────────────────────────

4.1. Ishlar tugatilgandan so'ng 3 ish kuni ichida xizmat qabul-topshirish dalolatnomasi tuziladi.
4.2. Buyurtmachi dalolatnomani imzolashdan bosh tortsa, asosli yozma shikoyat taqdim etishi shart.
4.3. Belgilangan muddatda shikoyat taqdim etilmasa, ish qabul qilingan hisoblanadi.

─────────────────────────────────────────────────
5. JAVOBGARLIK
─────────────────────────────────────────────────

5.1. Shartnoma bajarilmagan taqdirda aybdor tomon etkazilgan zararni to'liq qoplashga majbur.
5.2. Kechikish jarima: har kun uchun shartnoma summasining 0,1 foizi.
5.3. Force-majeur holatlari (tabiiy ofat, epidemiya, davlat talabi) uchun tomonlar javobgar emas.

─────────────────────────────────────────────────
6. SHARTNOMANI BEKOR QILISH
─────────────────────────────────────────────────

6.1. Shartnoma muddati tugagach o'z-o'zidan bekor bo'ladi.
6.2. Muddatdan oldin bekor qilish — kamida 3 ish kuni oldin yozma xabar bilan.
6.3. Muddatdan oldin bekor qilinganda bajarilgan ish hajmiga yarasha to'lov amalga oshiriladi.

─────────────────────────────────────────────────
7. TOMONLARNING REKVIZITLARI
─────────────────────────────────────────────────

BUYURTMACHI:                               IJROCHI:
${org.name}                                ${f.ijrochi_ism || '________________'}
INN: ${org.inn}                            Pasport: ${f.passport || 'AA 0000000'}
Manzil: ${f.org_manzil || '________________'}    STIR: ${f.ijrochi_stir || '___________'}
Tel: ${f.org_tel || '________________'}    Manzil: ${f.ijrochi_manzil || '________________'}
                                           Tel: ${f.ijrochi_tel || '________________'}

Direktor: ___________________              Imzo: ___________________
${org.director_name}

M.O.                                       Sana: ${sana}
`
}

// ─────────────────────────────────────────────────────────────
// 4. MAXFIYLIK (NDA) SHARTNOMASI
// ─────────────────────────────────────────────────────────────
export function tplMaxfiylik(f: F, org: Org): string {
  const sana = fmtD()
  const muddat = f.muddat || '3 yil'

  return `MAXFIYLIK (KONFIDENSIALLIK) SHARTNOMASI
(Non-Disclosure Agreement — NDA)

Toshkent shahri                                    "${sana}"

${org.name} (INN: ${org.inn}), keyingi o'rinlarda "Tashkilot" deb yuritiladi,
vakili — ${org.director_name},
va fuqaro ${f.xodim_ism || '________________'}, pasport: ${f.passport || 'AA 0000000'},
lavozim: "${f.lavozim || '___'}",
keyingi o'rinlarda "Xodim" deb yuritiladi, ushbu maxfiylik shartnomasini tuzdik:

─────────────────────────────────────────────────
1. SHARTNOMA MAQSADI
─────────────────────────────────────────────────

1.1. Ushbu shartnoma Xodimning mehnat faoliyati davomida bilib oladigan maxfiy ma'lumotlarni
     himoya qilish va tashkilot tijorat manfaatlarini ta'minlash maqsadida tuziladi.

─────────────────────────────────────────────────
2. MAXFIY MA'LUMOTLAR TARKIBI
─────────────────────────────────────────────────

2.1. Quyidagilar maxfiy ma'lumot hisoblanadi:
     a) moliyaviy ma'lumotlar — daromad, xarajat, ish haqi, shartnoma summalari, bank ma'lumotlari;
     b) mijozlar bazasi, shartnomalar, kelishuvlar va muzokaralar;
     c) texnologik jarayonlar, dasturiy ta'minot va know-how;
     d) xodimlar haqidagi shaxsiy ma'lumotlar;
     e) strategik rejalar, tahlillar va biznes-modellar;
     f) yetkazib beruvchilar, narxlar va ta'minot zanjiri;
     g) Tashkilot tomonidan "MAXFIY" deb belgilangan boshqa har qanday ma'lumot.

─────────────────────────────────────────────────
3. XODIMNING MAJBURIYATLARI
─────────────────────────────────────────────────

3.1. Xodim quyidagilarga majburdir:
     a) maxfiy ma'lumotlarni uchinchi shaxslarga, raqobatchi tashkilotlarga yoki ommaga
        oshkor etmaslik;
     b) maxfiy ma'lumotlarni faqat rasmiy ish vazifalarini bajarish uchun ishlatish;
     c) maxfiy ma'lumotlarni tashkilot tasdiqlagan qurilmalarda saqlash;
     d) ish tugagandan so'ng barcha maxfiy hujjat va materiallarni topshirish yoki yo'q qilish;
     e) maxfiy ma'lumotlar bilan ishlash chog'ida ehtiyotkorlik choralarini qo'llash.

─────────────────────────────────────────────────
4. OSHKOR ETISH MUMKIN BO'LGAN HOLAT
─────────────────────────────────────────────────

4.1. Maxfiy ma'lumotlarni oshkor etish faqat quyidagi hollarda mumkin:
     a) Tashkilotning oldindan olingan yozma ruxsati bilan;
     b) Qonun yoki sud talabiga binoan — faqat so'ralgan hajm va doirada.

─────────────────────────────────────────────────
5. SHARTNOMA MUDDATI
─────────────────────────────────────────────────

5.1. Ushbu shartnoma imzolangan sanadan boshlab kuchga kiradi.
5.2. Maxfiylik majburiyati ish munosabatlari tugagandan so'ng ham ${muddat} davomida kuchda qoladi.

─────────────────────────────────────────────────
6. JAVOBGARLIK
─────────────────────────────────────────────────

6.1. Maxfiy ma'lumotlar oshkor etilgan taqdirda Xodim Tashkilotga etkazilgan to'g'ridan-to'g'ri
     va bilvosita zararlarni to'liq qoplashga majburdir.
6.2. Bundan tashqari, O'zbekiston Respublikasi qonunchiligida nazarda tutilgan ma'muriy
     va jinoiy javobgarlik qo'llanilishi mumkin.

─────────────────────────────────────────────────
7. UMUMIY QOIDALAR
─────────────────────────────────────────────────

7.1. Ushbu shartnoma mehnat shartnomasi yoki xizmat ko'rsatish shartnomasining ajralmas
     qo'shimchasi hisoblanadi.
7.2. Shartnoma O'zbekiston Respublikasi qonunchiligiga muvofiq tartibga solinadi.
7.3. Nizolar birinchi navbatda muzokara yo'li bilan, hal etilmagan taqdirda sud orqali
     ko'rib chiqiladi.

─────────────────────────────────────────────────
TOMONLARNING REKVIZITLARI VA IMZOLARI
─────────────────────────────────────────────────

TASHKILOT:                                 XODIM:
${org.name}                                ${f.xodim_ism || '________________'}
INN: ${org.inn}                            Pasport: ${f.passport || 'AA 0000000'}
                                           Lavozim: ${f.lavozim || '________________'}

Direktor: ___________________              Imzo: ___________________
${org.director_name}

M.O.                                       Sana: ${sana}
`
}

// ─────────────────────────────────────────────────────────────
// 5. ISHGA QABUL QILISH BUYRUG'I
// ─────────────────────────────────────────────────────────────
export function tplBuyruqQabul(f: F, org: Org): string {
  const sana = fmtD(f.sana)
  const raqam = f.buyruq_raqam || '___'
  const sinovBand = f.sinov ? ` ${f.sinov} sinov muddati bilan` : ''

  return `${org.name}
─────────────────────────────────────────────────

BUYRUQ № ${raqam}
"${sana}"

ISHGA QABUL QILISH TO'G'RISIDA

Fuqaro ${f.xodim_ism || '________________'} ${fmtD(f.sana)} sanasidan boshlab
"${f.lavozim || '___'}" lavozimiga${f.bolim ? ` "${f.bolim}" bo'limiga` : ''} ish haqi
${f.maosh || '___'} so'm miqdorida${sinovBand} qabul qilinsin.

Xodim bilan mehnat shartnomasi tuzilsin va lavozim yo'riqnomasi bilan tanishtirilsin.

Asoslar:
  — fuqaro ${f.xodim_ism || '________________'} ning ariza-so'rovi, "${sana}";
  — O'zbekiston Respublikasi Mehnat kodeksining 76-moddasi.

Ijro uchun mas'ul: Kadrlar bo'limi boshlig'i.

─────────────────────────────────────────────────
Direktor: ___________________  ${org.director_name}

M.O.

Buyruq bilan tanishtirildi:
___________________  ${f.xodim_ism || '________________'}  "${sana}"
`
}

// ─────────────────────────────────────────────────────────────
// 6. ISHDAN BO'SHATISH BUYRUG'I
// ─────────────────────────────────────────────────────────────
export function tplBuyruqBoshtash(f: F, org: Org): string {
  const sana = fmtD(f.sana)
  const raqam = f.buyruq_raqam || '___'
  const sabab = f.sabab || "xodimning o'z ixtiyori (MK 99-moddasi)"
  const mkModda = f.mk_modda || '99'

  return `${org.name}
─────────────────────────────────────────────────

BUYRUQ № ${raqam}
"${sana}"

ISHDAN BO'SHATISH TO'G'RISIDA

Fuqaro ${f.xodim_ism || '________________'},
"${f.lavozim || '___'}" lavozimida${f.bolim ? ` "${f.bolim}" bo'limida` : ''} ishlaydi,
${fmtD(f.sana)} sanasidan boshlab ishdan bo'shatilsin.

Ishdan bo'shatish sababi: ${sabab}.

Kadrlar bo'limiga topshiriq:
  — oxirgi ish haqi va belgilangan kompensatsiyalar qonunchilikka muvofiq to'lansin;
  — mehnat daftarchasi va shaxsiy hujjatlar xodimga topshirilsin;
  — xodim tomonidan foydalanilgan ish joyi, jihozlar va materiallar qabul qilib olinsin.

Asoslar:
  — fuqaro ${f.xodim_ism || '________________'} ning ariza-so'rovi;
  — O'zbekiston Respublikasi Mehnat kodeksining ${mkModda}-moddasi.

─────────────────────────────────────────────────
Direktor: ___________________  ${org.director_name}

M.O.

Buyruq bilan tanishtirildi:
___________________  ${f.xodim_ism || '________________'}  "${sana}"
`
}

// ─────────────────────────────────────────────────────────────
// 7. TA'TIL BUYRUG'I
// ─────────────────────────────────────────────────────────────
export function tplTatilBuyruq(f: F, org: Org): string {
  const sana = fmtD()
  const raqam = f.buyruq_raqam || '___'
  const tatilTuri = f.tatil_turi || "asosiy yillik mehnat ta'tili"
  const hisobiYil = f.tatil_yil || String(new Date().getFullYear())

  return `${org.name}
─────────────────────────────────────────────────

BUYRUQ № ${raqam}
"${sana}"

TA'TIL BERISH TO'G'RISIDA

Fuqaro ${f.xodim_ism || '________________'},
"${f.lavozim || '___'}" lavozimida${f.bolim ? ` "${f.bolim}" bo'limida` : ''} ishlovchi xodimga,
${tatilTuri} ${fmtD(f.tatil_boshlanish)} sanasidan ${fmtD(f.tatil_tugash)} sanasigacha,
jami ${f.kunlar_soni || '___'} ish kuni miqdorida berilsin.

Ta'til turi: ${tatilTuri}.
Hisobot yili: ${hisobiYil} – ${parseInt(hisobiYil) + 1} yillar.

Ta'til puli: qonunchilikka muvofiq ta'til boshlanishidan kamida 3 kun oldin to'lansin.

Asoslar:
  — fuqaro ${f.xodim_ism || '________________'} ning ariza-so'rovi;
  — O'zbekiston Respublikasi Mehnat kodeksining 133–139-moddalari.

─────────────────────────────────────────────────
Direktor: ___________________  ${org.director_name}

M.O.

Buyruq bilan tanishtirildi:
___________________  ${f.xodim_ism || '________________'}  "${sana}"
`
}

// ─────────────────────────────────────────────────────────────
// 8. LAVOZIM O'ZGARTIRISH BUYRUG'I
// ─────────────────────────────────────────────────────────────
export function tplBuyruqLavozim(f: F, org: Org): string {
  const sana = fmtD(f.sana)
  const raqam = f.buyruq_raqam || '___'

  return `${org.name}
─────────────────────────────────────────────────

BUYRUQ № ${raqam}
"${sana}"

LAVOZIM (ISH SHAROITI) O'ZGARTIRISH TO'G'RISIDA

Fuqaro ${f.xodim_ism || '________________'},
hozirda "${f.eski_lavozim || '___'}" lavozimida ishlovchi xodim,
${fmtD(f.sana)} sanasidan boshlab "${f.yangi_lavozim || '___'}" lavozimiga${f.yangi_bolim ? ` "${f.yangi_bolim}" bo'limiga` : ''} o'tkazilsin.

Yangi lavozim bo'yicha ish haqi: ${f.yangi_maosh || '___'} so'm.
O'tkazish sababi: ${f.sabab || '___________________________________________'}.

Kadrlar bo'limiga topshiriq:
  — mehnat shartnomasiga qo'shimcha kelishuv tuzilsin;
  — lavozim yo'riqnomasi bilan tanishtirilsin.

Xodimning yozma roziligi olindi. ___________________

Asoslar:
  — xodimning ariza-so'rovi va yozma roziligi;
  — O'zbekiston Respublikasi Mehnat kodeksining 82-moddasi.

─────────────────────────────────────────────────
Direktor: ___________________  ${org.director_name}

M.O.

Buyruq bilan tanishtirildi:
___________________  ${f.xodim_ism || '________________'}  "${sana}"
`
}

// ─────────────────────────────────────────────────────────────
// 9. MUKOFOT BERISH BUYRUG'I
// ─────────────────────────────────────────────────────────────
export function tplBuyruqMukofot(f: F, org: Org): string {
  const sana = fmtD(f.sana)
  const raqam = f.buyruq_raqam || '___'
  const sabab = f.sabab || "mehnatdagi yuqori natijalari va fidokorona xizmati munosabati bilan"

  return `${org.name}
─────────────────────────────────────────────────

BUYRUQ № ${raqam}
"${sana}"

MUKOFOT (RAG'BAT) BERISH TO'G'RISIDA

${sabab} fuqaro ${f.xodim_ism || '________________'},
"${f.lavozim || '___'}" lavozimida ishlovchi xodimga,
${f.mukofot_miqdori || '___'} so'm miqdorida bir martalik pul mukofoti berilsin.

Mukofot turi: ${f.mukofot_turi || "Bir martalik pul mukofoti"}.
Mukofot sababi: ${sabab}.
To'lov muddati: buyruq chiqarilgan kundan boshlab 3 ish kuni ichida.

Asoslar:
  — bo'lim boshlig'ining taqdimномаsi;
  — O'zbekiston Respublikasi Mehnat kodeksining 154-moddasi.

─────────────────────────────────────────────────
Direktor: ___________________  ${org.director_name}

M.O.

Buyruq bilan tanishtirildi:
___________________  ${f.xodim_ism || '________________'}  "${sana}"
`
}

// ─────────────────────────────────────────────────────────────
// 10. INTIZOMIY JAZO BUYRUG'I
// ─────────────────────────────────────────────────────────────
export function tplBuyruqJazo(f: F, org: Org): string {
  const sana = fmtD(f.sana)
  const raqam = f.buyruq_raqam || '___'
  const jazaTuri = f.jazo_turi || 'hayfsan'

  return `${org.name}
─────────────────────────────────────────────────

BUYRUQ № ${raqam}
"${sana}"

INTIZOMIY JAZO QOʻLLASH TO'G'RISIDA

Fuqaro ${f.xodim_ism || '________________'},
"${f.lavozim || '___'}" lavozimida${f.bolim ? ` "${f.bolim}" bo'limida` : ''} ishlovchi xodimga,

${f.holat || 'ichki mehnat tartib-qoidalarini buzganligi'}
munosabati bilan "${jazaTuri}" shaklidagi intizomiy jazo qo'llanilsin.

Jazo qo'llash uchun asos:
  — xodimdan tushuntirish xati olindi (sana: ${fmtD(f.tushuntirish_sana) || '___'});
  — bo'lim boshlig'ining xizmati yozuvi.

Xodim haqidagi ma'lumot:
  — Qo'llaniladigan jazo turi: ${jazaTuri}
  — Qoidabuzarlik sanasi: ${fmtD(f.qoidabuzarlik_sana) || '___'}
  — Qoidabuzarlikning mazmuni: ${f.holat || '___'}

Muhim: Xodim ushbu buyruqni olganidan so'ng 10 kun ichida mehnat nizolari komissiyasiga
yoki sudga murojaat qilish huquqiga ega.

Asoslar:
  — O'zbekiston Respublikasi Mehnat kodeksining 181–186-moddalari.

─────────────────────────────────────────────────
Direktor: ___________________  ${org.director_name}

M.O.

Buyruq bilan tanishtirildi:
___________________  ${f.xodim_ism || '________________'}  "${sana}"
`
}
