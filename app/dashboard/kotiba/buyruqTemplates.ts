// Tashkiliy-operatsion buyruqlar shablonlari (kotiba bo'limi)

export type BuyruqType =
  | 'av_sotib_olish'
  | 'av_sotish'
  | 'av_hisobdan_chiqarish'
  | 'komissiya_tuzish'
  | 'inventarizatsiya'
  | 'xizmat_safari'
  | 'moddiy_javobgar'
  | 'vazifa_yuklatish'

export const BUYRUQ_TYPES: { key: BuyruqType; icon: string; title: string; desc: string }[] = [
  { key: 'av_sotib_olish',       icon: '🚗', title: 'Asosiy vosita sotib olish',       desc: 'Avtomobil, asbob-uskunа yoki boshqa asosiy vositani xarid qilish' },
  { key: 'av_sotish',            icon: '💰', title: 'Asosiy vositani sotish',           desc: 'Balansdan chiqarish va sotuvni rasmiylashtirish' },
  { key: 'av_hisobdan_chiqarish',icon: '🗑️', title: 'Asosiy vositani hisobdan chiqarish', desc: 'Eskirgan yoki ishdan chiqqan vositani balansdan olib tashlash' },
  { key: 'komissiya_tuzish',     icon: '👥', title: 'Komissiya tuzish',                 desc: 'Tekshiruv, qabul-topshirish yoki boshqa maqsad uchun komissiya' },
  { key: 'inventarizatsiya',     icon: '📦', title: 'Inventarizatsiya o\'tkazish',      desc: 'Mol-mulk, kassa yoki hujjatlar inventarizatsiyasi' },
  { key: 'xizmat_safari',        icon: '✈️', title: 'Xizmat safari',                   desc: 'Xodimni boshqa shaharga/davlatga xizmat safariga yuborish' },
  { key: 'moddiy_javobgar',      icon: '🔑', title: 'Moddiy javobgar tayinlash',       desc: 'Mol-mulk, kassa yoki omborxona uchun javobgar shaxsni tayinlash' },
  { key: 'vazifa_yuklatish',     icon: '📋', title: 'Vazifa (topshiriq) yuklatish',    desc: 'Xodimga yoki bo\'limga maxsus vazifa/topshiriq berish' },
]

export type BuyruqFields = Record<string, string>

// Umumiy yordamchi
function b(val: string | undefined, fallback = '___________') {
  return val?.trim() || fallback
}
function fmtD(iso?: string) {
  if (!iso) return '"___" __________ 20___ yil'
  const d = new Date(iso)
  const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
  return `"${d.getDate()}" ${months[d.getMonth()]} ${d.getFullYear()} yil`
}

// Buyruq sarlavha bloki
function header(tashkilot: string, raqam: string, sana: string, shahar: string, sarlavha: string) {
  return `${b(tashkilot, 'TASHKILOT NOMI').toUpperCase()}

BUYRUQ
${fmtD(sana)}                                                  № ${b(raqam, '___')}
${b(shahar, 'Toshkent')}

${sarlavha.toUpperCase()}`
}

// Imzo bloki
function footer(direktor_lavozim: string, direktor: string) {
  return `
${b(direktor_lavozim, 'Direktor')}          ___________________          ${b(direktor, 'F.I.Sh.')}
                              (imzo)`
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ASOSIY VOSITA SOTIB OLISH
// ─────────────────────────────────────────────────────────────────────────────
export function tplAvSotibOlish(f: BuyruqFields, org: { name: string; director_name: string }) {
  return `${header(org.name, f.raqam, f.sana, f.shahar,
    `"${b(f.vosita_nomi, 'ASOSIY VOSITA NOMI')}" SOTIB OLISH TO'G'RISIDA`)}

Asosida: ${b(f.asos, 'tashkilot ehtiyojlaridan kelib chiqib')}.

BUYURAMAN:

1. Quyidagi asosiy vositani sotib olish amalga oshirilsin:
   – Nomi:                ${b(f.vosita_nomi)}
   – Markasi/modeli:      ${b(f.model, '___________')}
   – Miqdori:             ${b(f.miqdor, '1 dona')}
   – Taxminiy qiymati:    ${b(f.narxi, '___________')} so'm

2. Sotib olish manbai: ${b(f.manbaa, 'tashkilot hisobidan')}.

3. Xarid qilingan asosiy vositani balansga kiritish va belgilangan tartibda hujjatlashtirish ${b(f.buxgalter, 'bosh buxgalter')} zimmasiga yuklatilsin.

4. Asosiy vositaga mas'ul shaxs etib ${b(f.mas_ul)} tayinlansin.

5. Buyruq bajarilishini nazorat qilish ${b(f.nazoratchi, "o'rinbosar")} zimmasiga yuklatilsin.

6. Ushbu buyruq imzolanган kundan e'tiboran kuchga kiradi.
${footer(f.direktor_lavozim, org.director_name)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ASOSIY VOSITA SOTISH
// ─────────────────────────────────────────────────────────────────────────────
export function tplAvSotish(f: BuyruqFields, org: { name: string; director_name: string }) {
  return `${header(org.name, f.raqam, f.sana, f.shahar,
    `"${b(f.vosita_nomi, 'ASOSIY VOSITA')}" NI SOTISH TO'G'RISIDA`)}

Asosida: ${b(f.asos, 'tashkilot qarori va texnik holat xulosasiga asosan')}.

BUYURAMAN:

1. Quyidagi asosiy vosita sotilsin:
   – Nomi:               ${b(f.vosita_nomi)}
   – Inventar raqami:    ${b(f.inventar_raqam, '___________')}
   – Balans qiymati:     ${b(f.balans_qiymati, '___________')} so'm
   – Sotish narxi:       ${b(f.sotish_narxi, '___________')} so'm

2. Xaridor: ${b(f.xaridor, '___________')}.

3. Sotuvni rasmiylashtirish uchun qabul-topshirish dalolatnomasi tuzilsin.

4. Sotishdan tushgan mablag' tashkilot hisob raqamiga o'tkazilsin.

5. Asosiy vositani balansdan chiqarish va hisob-kitob yuritish ${b(f.buxgalter, 'bosh buxgalter')} zimmasiga yuklatilsin.

6. Ushbu buyruq bajarilishini nazorat qilish ${b(f.nazoratchi, "o'rinbosar")} zimmasiga yuklatilsin.

7. Buyruq imzolanган kundan e'tiboran kuchga kiradi.
${footer(f.direktor_lavozim, org.director_name)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ASOSIY VOSITA HISOBDAN CHIQARISH
// ─────────────────────────────────────────────────────────────────────────────
export function tplAvHisobdanChiqarish(f: BuyruqFields, org: { name: string; director_name: string }) {
  return `${header(org.name, f.raqam, f.sana, f.shahar,
    `"${b(f.vosita_nomi, 'ASOSIY VOSITA')}" NI HISOBDAN CHIQARISH TO'G'RISIDA`)}

Asosida: texnik ekspertiza xulosasi va ${b(f.komissiya_xulosa, 'komissiya xulosasi')}.

BUYURAMAN:

1. Quyidagi asosiy vosita balansdan hisobdan chiqarilsin:
   – Nomi:               ${b(f.vosita_nomi)}
   – Inventar raqami:    ${b(f.inventar_raqam, '___________')}
   – Dastlabki qiymati:  ${b(f.dastlabki_qiymat, '___________')} so'm
   – Eskirish foizi:     ${b(f.eskirish, '___')}%
   – Qoldiq qiymati:     ${b(f.qoldiq_qiymat, '___________')} so'm
   – Hisobdan chiqarish sababi: ${b(f.sabab, 'to\'la ishdan chiqishi, texnik holati qoniqarsiz')}

2. Hisobdan chiqarish dalolatnomasi tuzilsin va belgilangan tartibda rasmiylashtirilsin.

3. Foydalanish mumkin bo'lgan qism va materiallar inventarlashtirilib, omborga topshirilsin.

4. Barcha hujjatlarni rasmiylashtirish va buxgalteriya hisobini yuritish ${b(f.buxgalter, 'bosh buxgalter')} zimmasiga yuklatilsin.

5. Buyruq bajarilishini nazorat qilish ${b(f.nazoratchi, "o'rinbosar")} zimmasiga yuklatilsin.

6. Buyruq imzolangan kundan e'tiboran kuchga kiradi.
${footer(f.direktor_lavozim, org.director_name)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. KOMISSIYA TUZISH
// ─────────────────────────────────────────────────────────────────────────────
export function tplKomissiyaTuzish(f: BuyruqFields, org: { name: string; director_name: string }) {
  const azolar = b(f.azolar, '___________').split('\n').map(a => `   – ${a.trim()}`).join('\n')
  return `${header(org.name, f.raqam, f.sana, f.shahar,
    `${b(f.maqsad, 'TEKSHIRUV').toUpperCase()} KOMISSIYASINI TUZISH TO'G'RISIDA`)}

Asosida: ${b(f.asos, 'tashkilot ehtiyojlaridan kelib chiqib')}.

BUYURAMAN:

1. ${b(f.maqsad, 'Tekshiruv')} komissiyasi tuzilsin.

2. Komissiya tarkibi:
   – Rais: ${b(f.rais, '___________')}
${azolar}

3. Komissiya vazifalari:
   ${b(f.vazifalar, '– Belgilangan maqsad doirasida ishni amalga oshirish;\n   – Natijalar bo\'yicha dalolatnoma (xulosa) tuzish.')}

4. Komissiya ishini ${b(f.muddat, '"___" __________ 20___ yilgacha')} yakunlasin va natijalar bo'yicha hisobot taqdim etsin.

5. Komissiya raisi ${b(f.rais, '___________')} zimmasiga barcha tashkiliy masalalarni hal etish yuklatilsin.

6. Buyruq imzolangan kundan e'tiboran kuchga kiradi.
${footer(f.direktor_lavozim, org.director_name)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. INVENTARIZATSIYA
// ─────────────────────────────────────────────────────────────────────────────
export function tplInventarizatsiya(f: BuyruqFields, org: { name: string; director_name: string }) {
  return `${header(org.name, f.raqam, f.sana, f.shahar,
    `INVENTARIZATSIYA O'TKAZISH TO'G'RISIDA`)}

Asosida: ${b(f.asos, 'yillik inventarizatsiya rejasiga muvofiq')}.

BUYURAMAN:

1. ${b(f.inventar_turi, 'Mol-mulk va moddiy boyliklar')} inventarizatsiyasi o'tkazilsin.

2. Inventarizatsiya o'tkazish muddati: ${b(f.boshlanish, '"___" __________')} dan ${b(f.tugash, '"___" __________')} gacha.

3. Inventarizatsiya komissiyasi tarkibi:
   – Rais: ${b(f.rais, '___________')}
   – A'zolar: ${b(f.azolar, '___________')}

4. Inventarizatsiya qamrovi: ${b(f.qamrov, 'barcha moddiy boyliklar, asosiy vositalar va tovar-moddiy qiymatliklar')}.

5. Inventarizatsiya natijalar bo'yicha dalolatnoma tuzilsin va rahbariyatga ${b(f.hisobot_muddati, '"___" __________')} gacha taqdim etilsin.

6. Moddiy javobgar shaxslar inventarizatsiya davomida o'z vazifalarini bajarishda davom etsin.

7. Buyruq bajarilishini nazorat qilish ${b(f.nazoratchi, 'bosh buxgalter')} zimmasiga yuklatilsin.

8. Buyruq imzolanган kundan e'tiboran kuchga kiradi.
${footer(f.direktor_lavozim, org.director_name)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. XIZMAT SAFARI
// ─────────────────────────────────────────────────────────────────────────────
export function tplXizmatSafari(f: BuyruqFields, org: { name: string; director_name: string }) {
  return `${header(org.name, f.raqam, f.sana, f.shahar,
    `XIZMAT SAFARIGA YUBORISH TO'G'RISIDA`)}

Asosida: ${b(f.asos, 'tashkilot ishlab chiqarish ehtiyojlaridan kelib chiqib')}.

BUYURAMAN:

1. ${b(f.xodim_lavozim, 'Lavozim')} ${b(f.xodim_ism, 'F.I.Sh.')} xizmat safariga yuborilsin.

2. Safari yo'nalishi: ${b(f.manzil, '___________')}.

3. Safari maqsadi: ${b(f.maqsad, '___________')}.

4. Safari muddati: ${b(f.boshlanish, '"___" __________')} dan ${b(f.tugash, '"___" __________')} gacha (${b(f.kun_soni, '___')} kun).

5. Safari xarajatlari tashkilot hisobidan qoplansin:
   – Yo'l xarajati: ${b(f.yol_xarajat, 'haqiqiy miqdorda')}
   – Kunlik xarajat: ${b(f.kunlik, 'belgilangan me\'yor bo\'yicha')}
   – Turar joy: ${b(f.turar_joy, 'haqiqiy miqdorda')}

6. Safari natijalari bo'yicha hisobot ${b(f.hisobot_muddat, 'qaytgandan keyin 3 ish kuni ichida')} taqdim etilsin.

7. Buyruq imzolangan kundan e'tiboran kuchga kiradi.
${footer(f.direktor_lavozim, org.director_name)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. MODDIY JAVOBGAR TAYINLASH
// ─────────────────────────────────────────────────────────────────────────────
export function tplModdiyJavobgar(f: BuyruqFields, org: { name: string; director_name: string }) {
  return `${header(org.name, f.raqam, f.sana, f.shahar,
    `MODDIY JAVOBGAR SHAXSNI TAYINLASH TO'G'RISIDA`)}

Asosida: ${b(f.asos, 'tashkilot ichki tartib-qoidalariga muvofiq')}.

BUYURAMAN:

1. ${b(f.xodim_lavozim, 'Lavozim')} ${b(f.xodim_ism, 'F.I.Sh.')} ${b(f.javobgarlik_predmeti, 'omborxona mol-mulki va tovar-moddiy qiymatliklar')} uchun moddiy javobgar shaxs etib tayinlansin.

2. Moddiy javobgar shaxs quyidagi majburiyatlarni o'z zimmasiga olsin:
   – Tegishli mol-mulkni saqlash va ularning to'liqligini ta'minlash;
   – Mol-mulk harakati bo'yicha hujjatlarni belgilangan tartibda yuritish;
   – Inventarizatsiya o'tkazilganda komissiyaga to'liq ko'maklashish;
   – Yo'qolish yoki zarar etkazilgan taqdirda moddiy javobgarlikni o'z zimmasiga olish.

3. ${b(f.xodim_ism)} bilan moddiy javobgarlik to'g'risidagi shartnoma tuzilsin.

4. Oldingi moddiy javobgar ${b(f.oldingi_javobgar, '___________')} (agar mavjud bo'lsa) bilan qabul-topshirish dalolatnomasi tuzilsin.

5. Buyruq bajarilishini nazorat qilish ${b(f.nazoratchi, 'bosh buxgalter')} zimmasiga yuklatilsin.

6. Buyruq imzolangan kundan e'tiboran kuchga kiradi.
${footer(f.direktor_lavozim, org.director_name)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. VAZIFA YUKLATISH
// ─────────────────────────────────────────────────────────────────────────────
export function tplVazifaYuklatish(f: BuyruqFields, org: { name: string; director_name: string }) {
  return `${header(org.name, f.raqam, f.sana, f.shahar,
    `VAZIFA YUKLATISH TO'G'RISIDA`)}

Asosida: ${b(f.asos, 'tashkilot faoliyat ehtiyojlaridan kelib chiqib')}.

BUYURAMAN:

1. ${b(f.ijrochi_lavozim, 'Lavozim')} ${b(f.ijrochi_ism, 'F.I.Sh.')} zimmasiga quyidagi vazifa yuklatilsin:

   ${b(f.vazifa_mazmuni, '___________')}

2. Vazifani bajarish muddati: ${b(f.muddat, '"___" __________ 20___ yilgacha')}.

3. Bajarilish natijasi bo'yicha hisobot: ${b(f.hisobot_shakli, 'yozma hisobot shaklida')} taqdim etilsin.

4. Vazifani bajarish uchun zarur resurslar va vakolatlar ajratilsin.

5. Ushbu buyruq bajarilishini nazorat qilish ${b(f.nazoratchi, "to'g'ridan-to'g'ri rahbar")} zimmasiga yuklatilsin.

6. Buyruq imzolangan kundan e'tiboran kuchga kiradi.
${footer(f.direktor_lavozim, org.director_name)}`
}

// ─── Dispetcher ─────────────────────────────────────────────────────────────
export function generateBuyruq(
  type: BuyruqType,
  fields: BuyruqFields,
  org: { name: string; director_name: string }
): string {
  switch (type) {
    case 'av_sotib_olish':        return tplAvSotibOlish(fields, org)
    case 'av_sotish':             return tplAvSotish(fields, org)
    case 'av_hisobdan_chiqarish': return tplAvHisobdanChiqarish(fields, org)
    case 'komissiya_tuzish':      return tplKomissiyaTuzish(fields, org)
    case 'inventarizatsiya':      return tplInventarizatsiya(fields, org)
    case 'xizmat_safari':         return tplXizmatSafari(fields, org)
    case 'moddiy_javobgar':       return tplModdiyJavobgar(fields, org)
    case 'vazifa_yuklatish':      return tplVazifaYuklatish(fields, org)
  }
}
