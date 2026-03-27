/**
 * Kadrlar bo'limi — yuridik kuchga ega shablon hujjatlar
 *
 * Asoslar:
 *  — O'zbekiston Respublikasi Mehnat kodeksi (MK), 2022-yil tahririda
 *  — O'zbekiston Respublikasi Fuqarolik kodeksi (FK)
 *  — "Tijorat siri to'g'risida"gi O'zR Qonuni (2008-yil 11-dekabr, № ЗРУ-190)
 *  — "Hujjatlashtirish va hujjatlar aylanmasi" davlat standarti (O'z DSt 1212)
 */

type Org = { name: string; inn: string; director_name: string }
type F   = Record<string, string>

// ─── Yordamchi funksiyalar ────────────────────────────────────────────────────

export function fmtD(iso?: string): string {
  if (!iso) {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
  }
  const pts = iso.split('-')
  return pts.length === 3 ? `${pts[2]}.${pts[1]}.${pts[0]}` : iso
}

function blank(val?: string, fallback = '________________') {
  return (val && val.trim()) ? val.trim() : fallback
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MEHNAT SHARTNOMASI
// Huquqiy asos: MK 75–80-moddalar (tuzish), 91–96 (ish haqi),
//               110–132 (ish vaqti), 133–145 (ta'til), 187–192 (javobgarlik)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplMehnatShartnoma(f: F, org: Org, tur: string): string {

  const TUR: Record<string, string> = {
    belgilanmagan_muddatli : 'belgilanmagan muddatli (doimiy)',
    belgilangan_muddatli   : 'belgilangan muddatli (muddatli)',
    yarim_stavkada         : 'yarim stavkali (0,5 stavka)',
    masofaviy              : 'masofaviy (distant)',
    amaliyot               : 'amaliyot / stajyorlik',
  }

  const sana      = fmtD(f.boshlanish_sana)
  const turText   = TUR[tur] || tur
  const lavozim   = blank(f.lavozim)
  const bolim     = f.bolim ? ` "${f.bolim}" bo'limi,` : ''
  const ish_joyi  = blank(f.ish_joyi, org.name)
  const hafta_s   = tur === 'yarim_stavkada' ? '20' : '40'
  const stavka    = tur === 'yarim_stavkada' ? '0,5 (yarim) stavka' : "to'liq (1,0) stavka"
  const ish_v     = blank(f.ish_vaqti, tur === 'yarim_stavkada'
    ? 'kuniga 4 soat, dushanba–juma'
    : 'kuniga 8 soat, dushanba–juma, 09:00–18:00, tushlik: 13:00–14:00')

  const muddatQator = tur === 'belgilangan_muddatli' && f.tugash_sana
    ? `\n1.5. Shartnoma muddati: ${fmtD(f.boshlanish_sana)} dan ${fmtD(f.tugash_sana)} gacha`
      + `\n     (MK 78-moddasi: muddatli shartnoma 5 yildan oshmasligi shart).` : ''

  const masofaBand = tur === 'masofaviy' ? `
2.4. Xodim ishni masofadan (remote) bajaradi. Muloqot kanallari, hisobot shakli
     va ish natijalarini topshirish tartibi ish beruvchi direktivi bilan belgilanadi.` : ''

  const sinovBand = (f.sinov && f.sinov.trim()) ? `

3. SINOV MUDDATI (MK 77-moddasi)

3.1. Tomonlar kelishuviga binoan xodimga ${f.sinov} sinov muddati belgilanadi.
3.2. Sinov muddatida har bir tomon 3 (uch) kun oldin yozma ogohlantirish bilan
     shartnomani bekor qilish huquqiga ega.
3.3. Sinov davrida xodim O'zbekiston Respublikasi mehnat qonunchiligining to'liq
     himoyasidan foydalanadi va barcha kafolatlarga ega bo'ladi.
3.4. Sinov ijobiy yakunlansa, alohida buyruqsiz mehnat munosabatlari davom etadi.` : ''

  const asosiyRaqam = f.sinov ? '4' : '3'

  const raqam = blank(f.shartnoma_raqam, '___')

  return `MEHNAT SHARTNOMASI № ${raqam}
(${turText})

${blank(f.shahar, 'Toshkent')} shahri                             "${sana}"

${org.name} (INN: ${org.inn}), keyingi o'rinlarda "Ish beruvchi" deb yuritiladi,
direktori ${org.director_name} tomonidan vakilligi qilinadi,

va fuqaro ${blank(f.xodim_ism)}, pasport: ${blank(f.passport, 'AA 0000000')},
JSHSHIR: ${blank(f.jshshir, '______________')},
yashash manzili: ${blank(f.xodim_manzil)},
keyingi o'rinlarda "Xodim" deb yuritiladi,

O'zbekiston Respublikasi Mehnat kodeksining 75 va 76-moddalari asosida
quyidagi mehnat shartnomasini tuzdik:

════════════════════════════════════════════════════════════════
1. SHARTNOMA PREDMETI
════════════════════════════════════════════════════════════════

1.1. Ish beruvchi Xodimni "${lavozim}" lavozimiga,${bolim}
     ${ish_joyi} ish joyiga qabul qiladi.
1.2. Ushbu shartnoma ${turText} mehnat shartnomasi hisoblanadi
     (O'zR Mehnat kodeksi 78-moddasi).
1.3. Xodim ish boshlash sanasi: ${sana}.${muddatQator}
1.4. Ish joyi: ${ish_joyi}.
1.5. Xodim ${stavka}da mehnat qiladi.

════════════════════════════════════════════════════════════════
2. MEHNAT FUNKSIYASI VA ISH SHAROITI
════════════════════════════════════════════════════════════════

2.1. Xodim "${lavozim}" lavozimi bo'yicha lavozim yo'riqnomasida belgilangan
     barcha vazifalarni bajaradi.
2.2. Xodimning ish vaqti: ${ish_v}.
2.3. Haftalik ish vaqti: ${hafta_s} soat (MK 112-moddasi).${masofaBand}
2.5. Xodim O'zbekiston Respublikasi qonunchiligida nazarda tutilgan sanitar-gigiyena,
     mehnat xavfsizligi va yong'in xavfsizligi qoidalariga rioya qiladi.
${sinovBand}

════════════════════════════════════════════════════════════════
${asosiyRaqam}. ISH HAQI VA TO'LOV TARTIBI (MK 91–100-moddalar)
════════════════════════════════════════════════════════════════

${asosiyRaqam}.1. Xodimga oylik tarif ish haqi ${blank(f.maosh)} so'm miqdorida belgilanadi.
${asosiyRaqam}.2. Ish haqi to'lovi tartibi:
     — avans to'lovi: har oyning 25-sanasiga qadar 40 % miqdorida;
     — asosiy to'lov: keyingi oyning 10-sanasigacha qolgan qismi.
${asosiyRaqam}.3. To'lov shakli: ${blank(f.tolov_shakli, "bank plastik kartasi yoki naqd")}.
${asosiyRaqam}.4. O'zbekiston Respublikasi qonunchiligida belgilangan jismoniy shaxslar
     daromad solig'i (12 %) va ijtimoiy sug'urta badallari (1 %) ushlab qolinib,
     davlat byudjetiga va Pensiya jamg'armasiga o'tkaziladi.
${asosiyRaqam}.5. Ish haqi belgilangan muddatda to'lanmagan taqdirda ish beruvchi
     MK 153-moddasiga muvofiq moliyaviy javobgarlik ko'radi.
${asosiyRaqam}.6. Yillik mehnat natijalari va tashkilot moliyaviy imkoniyatlariga qarab
     qo'shimcha mukofot to'lash mumkin (mukofot ish haqining ajralmas qismi emas).

════════════════════════════════════════════════════════════════
${parseInt(asosiyRaqam)+1}. DAM OLISH VA TA'TIL HUQUQI (MK 133–145-moddalar)
════════════════════════════════════════════════════════════════

${parseInt(asosiyRaqam)+1}.1. Xodimga yiliga kamida 15 (o'n besh) ish kuni asosiy mehnat ta'tili
     beriladi (MK 134-moddasi).
${parseInt(asosiyRaqam)+1}.2. Ta'til muddati keyingi qo'shimcha ta'tillar bilan uzaytirilishi mumkin
     (MK 136-138-moddalar).
${parseInt(asosiyRaqam)+1}.3. Ta'til puli ta'til boshlanishidan kamida 3 (uch) kun oldin to'liq
     to'lanadi (MK 141-moddasi).
${parseInt(asosiyRaqam)+1}.4. O'zbekiston Respublikasi Mehnat kodeksida nazarda tutilgan bayram
     va dam olish kunlari ish bajarilmaydi.
${parseInt(asosiyRaqam)+1}.5. Ishlab chiqarish zaruriyati tug'ilganda qo'shimcha ish vaqti
     tomonlar kelishuviga binoan va MK 120–127-moddalar doirasida amalga oshiriladi.

════════════════════════════════════════════════════════════════
${parseInt(asosiyRaqam)+2}. ISH BERUVCHINING HUQUQ VA MAJBURIYATLARI
════════════════════════════════════════════════════════════════

${parseInt(asosiyRaqam)+2}.1. Ish beruvchi quyidagilarga majburdir:
     a) xodimga ish bajarish uchun zarur ish joyi, jihozlar, materiallar va
        axborot resurslarini ta'minlash;
     b) ish haqini belgilangan muddatda to'liq va o'z vaqtida to'lash;
     c) mehnat xavfsizligi va sog'lom mehnat sharoitlarini ta'minlash;
     d) majburiy davlat ijtimoiy sug'urta badallarini to'lash;
     e) xodimning kasbiy malakasini oshirishga ko'maklashish;
     f) mehnat qonunchiligi va ushbu shartnoma shartlarini so'zsiz bajarish.

${parseInt(asosiyRaqam)+2}.2. Ish beruvchi quyidagi huquqlarga ega:
     a) xodimdan lavozim yo'riqnomasida belgilangan vazifalarni sifatli bajarishini talab qilish;
     b) xodimni amaldagi qonunchilikka muvofiq intizomiy javobgarlikka tortish;
     c) moddiy zararni MK 187–192-moddalari doirasida qoplash talab qilish.

════════════════════════════════════════════════════════════════
${parseInt(asosiyRaqam)+3}. XODIMNING HUQUQ VA MAJBURIYATLARI
════════════════════════════════════════════════════════════════

${parseInt(asosiyRaqam)+3}.1. Xodim quyidagilarga majburdir:
     a) belgilangan lavozim vazifalarini vijdonan va yuqori sifatda bajarish;
     b) tashkilotning ichki mehnat tartib-qoidalariga rioya qilish;
     c) ish beruvchiga tegishli mol-mulk va ma'lumotlarni ehtiyotkorlik bilan muhofaza qilish;
     d) tijorat siri va konfidensial ma'lumotlarni uchinchi shaxslarga oshkor etmaslik;
     e) mehnat xavfsizligi, sanitariya va yong'in xavfsizligi qoidalarini bajarish;
     f) bexatar muhit yaratish — hamkasblar va mijozlarga nisbatan xurmatli munosabatda bo'lish.

${parseInt(asosiyRaqam)+3}.2. Xodim quyidagi huquqlarga ega:
     a) o'z mehnati uchun o'z vaqtida va to'liq ish haqi olish;
     b) xavfsiz ish sharoitlariga va zarur jihozlarga ega bo'lish;
     c) yillik mehnat ta'tilidan foydalanish;
     d) kasbiy rivojlanish va malaka oshirish;
     e) mehnat nizosi yuzaga kelganda komissiya yoki sudga murojaat qilish.

════════════════════════════════════════════════════════════════
${parseInt(asosiyRaqam)+4}. IJTIMOIY SUG'URTA VA KAFOLATLAR
════════════════════════════════════════════════════════════════

${parseInt(asosiyRaqam)+4}.1. Ish beruvchi xodim uchun majburiy davlat ijtimoiy sug'urtasiga
     badallar to'laydi (belgilangan stavka bo'yicha).
${parseInt(asosiyRaqam)+4}.2. Xodimning vaqtinchalik mehnatga layoqatsizligi davrida nafaqa
     "Ijtimoiy sug'urta to'g'risida"gi qonunga muvofiq to'lanadi.
${parseInt(asosiyRaqam)+4}.3. Homilador xodimlar va bola tug'ilishi munosabati bilan ta'til
     olayotganlar MK 225–233-moddalari bo'yicha qo'shimcha kafolatlardan foydalanadi.
${parseInt(asosiyRaqam)+4}.4. Xodim ishda baxtsiz hodisa yoki kasb kasalligiga duchor bo'lsa,
     MK 206–217-moddalariga muvofiq zararni qoplash amalga oshiriladi.

════════════════════════════════════════════════════════════════
${parseInt(asosiyRaqam)+5}. MAXFIYLIK VA TIJORAT SIRI
════════════════════════════════════════════════════════════════

${parseInt(asosiyRaqam)+5}.1. Quyidagi ma'lumotlar tijorat siri deb hisoblanadi va
     "Tijorat siri to'g'risida"gi Qonun (2008-yil, № ЗРУ-190) himoyasi ostida turadi:
     — mijozlar bazasi, shartnomalar, kelishuvlar va narxlar;
     — moliyaviy ma'lumotlar, ish haqlar, daromad va xarajatlar;
     — texnologik jarayonlar, dasturiy ta'minot va biznes-modellar;
     — strategik rejalar va yangi mahsulot/xizmatlar haqidagi ma'lumotlar;
     — xodimlar, hamkorlar va boshqa shaxslar haqidagi shaxsiy ma'lumotlar;
     — ish beruvchi tomonidan maxfiy deb belgilangan boshqa ma'lumotlar.
${parseInt(asosiyRaqam)+5}.2. Xodim ushbu ma'lumotlarni ish davomida va ishdan bo'shagandan
     keyin 3 (uch) yil mobaynida oshkor etmaydi.
${parseInt(asosiyRaqam)+5}.3. Maxfiylik buzilganda ish beruvchi FK 14-moddasi asosida zararni
     qoplash va ma'naviy zarar undirish huquqiga ega.

════════════════════════════════════════════════════════════════
${parseInt(asosiyRaqam)+6}. MODDIY JAVOBGARLIK (MK 187–192-moddalar)
════════════════════════════════════════════════════════════════

${parseInt(asosiyRaqam)+6}.1. Xodim o'z aybli xatti-harakati natijasida ish beruvchiga
     etkazgan zararni qoplashga majburdir.
${parseInt(asosiyRaqam)+6}.2. Cheklangan javobgarlik (MK 187-moddasi): zararning o'rtacha
     oylik ish haqidan oshmaydigan qismi qoplanadi.
${parseInt(asosiyRaqam)+6}.3. To'liq moddiy javobgarlik faqat MK 189-moddasida nazarda tutilgan
     holatlarda (masalan, maxsus ishonch bilan topshirilgan mol-mulk, intentional zarar) qo'llaniladi.
${parseInt(asosiyRaqam)+6}.4. Zararni qoplash ish haqidan bosqichma-bosqich ushlab qolish
     yo'li bilan amalga oshiriladi (har oyda ish haqining 20 % dan oshmasligi shart — MK 191).

════════════════════════════════════════════════════════════════
${parseInt(asosiyRaqam)+7}. SHARTNOMANI O'ZGARTIRISH VA BEKOR QILISH
════════════════════════════════════════════════════════════════

${parseInt(asosiyRaqam)+7}.1. Shartnoma shartlariga o'zgartirish kiritish faqat tomonlarning
     yozma kelishuvi asosida amalga oshiriladi (MK 80-moddasi).
${parseInt(asosiyRaqam)+7}.2. Ish beruvchi mehnat sharoitlarini o'zgartirishdan kamida 2 (ikki)
     oy oldin xodimni yozma ravishda ogohlantirishga majburdir (MK 81-moddasi).
${parseInt(asosiyRaqam)+7}.3. Shartnoma quyidagi asoslarda bekor qilinishi mumkin:
     — tomonlarning o'zaro kelishuviga binoan (MK 97-moddasi);
     — xodimning o'z ixtiyori bilan — kamida 2 hafta oldin yozma ariza bergan holda
       (MK 99-moddasi; sinovda bo'lsa — 3 kun oldin);
     — ish beruvchi tashabbusiga binoan faqat MK 100-moddasida ko'rsatilgan holatlarda
       (ishlab chiqarishni qisqartirish, xodimning intizom qoidalarini buzishi va h.k.);
     — xodim boshqa ish joyiga o'tishi munosabati bilan (MK 98-moddasi);
     — tomonlarga bog'liq bo'lmagan holatlar (MK 105-moddasi).

════════════════════════════════════════════════════════════════
${parseInt(asosiyRaqam)+8}. NIZOLARNI HAL QILISH
════════════════════════════════════════════════════════════════

${parseInt(asosiyRaqam)+8}.1. Ushbu shartnomadan kelib chiqadigan nizolar avval tomonlarning
     muzokaralari yoki tashkilot mehnat nizolari komissiyasi (MNK) orqali hal etiladi
     (MK 271–280-moddalar).
${parseInt(asosiyRaqam)+8}.2. MNK hal qila olmagan nizo xodim ixtiyoriga ko'ra ish beruvchi
     joylashgan joy sudiga topshiriladi.
${parseInt(asosiyRaqam)+8}.3. Xodim sudga murojaat qilish huquqidan qat'i nazar, MNK-ga
     murojaat qilishi shart emas (MK 271-moddasi).

════════════════════════════════════════════════════════════════
${parseInt(asosiyRaqam)+9}. YAKKUNIY QOIDALAR
════════════════════════════════════════════════════════════════

${parseInt(asosiyRaqam)+9}.1. Ushbu shartnoma O'zbekiston Respublikasi qonunchiligiga muvofiq
     tuzilgan bo'lib, ikki nusxada — har bir tomon uchun bittadan imzolangan.
${parseInt(asosiyRaqam)+9}.2. Shartnomada belgilanmagan masalalar O'zbekiston Respublikasi
     Mehnat kodeksi va boshqa qonunchilik hujjatlariga muvofiq hal etiladi.
${parseInt(asosiyRaqam)+9}.3. Shartnomaga qo'shimcha kelishuvlar faqat yozma shaklda va
     tomonlarning imzosi hamda tashkilot muhri bilan kuchga kiradi.

════════════════════════════════════════════════════════════════
TOMONLARNING REKVIZITLARI VA IMZOLARI
════════════════════════════════════════════════════════════════

ISH BERUVCHI:                              XODIM:
${org.name}                                ${blank(f.xodim_ism)}
INN: ${org.inn}                            Pasport: ${blank(f.passport, 'AA 0000000')}
Manzil: ${blank(f.org_manzil)}             JSHSHIR: ${blank(f.jshshir, '______________')}
Tel: ${blank(f.org_tel)}                   Manzil: ${blank(f.xodim_manzil)}
Hisob: ${blank(f.org_hisob)}               Tel: ${blank(f.xodim_tel)}

Direktor: ___________________              Imzo: ___________________
${org.director_name}

M.O.                                       Sana: ${sana}
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. TASHQI O'RINDOSHLIK BO'YICHA MEHNAT SHARTNOMASI
// Huquqiy asos: MK 28–30-moddalar
// ═══════════════════════════════════════════════════════════════════════════════
export function tplOrindoshlik(f: F, org: Org): string {
  const sana   = fmtD(f.boshlanish_sana)
  const kunlar = blank(f.kunlar, 'dushanba, chorshanba, juma')
  const soat   = blank(f.soat_soni, '4')
  const raqam  = blank(f.shartnoma_raqam, '___')

  return `TASHQI O'RINDOSHLIK BO'YICHA MEHNAT SHARTNOMASI № ${raqam}

${blank(f.shahar, 'Toshkent')} shahri                             "${sana}"

${org.name} (INN: ${org.inn}), keyingi o'rinlarda "Ish beruvchi" deb yuritiladi,
direktori ${org.director_name} tomonidan vakilligi qilinadi,

va fuqaro ${blank(f.xodim_ism)}, pasport: ${blank(f.passport, 'AA 0000000')},
JSHSHIR: ${blank(f.jshshir, '______________')},
yashash manzili: ${blank(f.xodim_manzil)},
keyingi o'rinlarda "Xodim" deb yuritiladi,

O'zbekiston Respublikasi Mehnat kodeksining 28–30-moddalari asosida
tashqi o'rindoshlik mehnat shartnomasini tuzdik:

════════════════════════════════════════════════════════════════
1. SHARTNOMA PREDMETI
════════════════════════════════════════════════════════════════

1.1. Ish beruvchi Xodimni tashqi o'rindoshlik asosida "${blank(f.lavozim)}" lavozimiga
     qabul qiladi.
1.2. Tashqi o'rindoshlik — xodim asosiy ish joyini saqlab qolgan holda, o'z ish vaqtidan
     tashqari, boshqa tashkilotda qo'shimcha ish bajarishi (MK 28-moddasi).
1.3. Xodimning asosiy ish joyi: ${blank(f.asosiy_ish_joyi, "Xodim tomonidan ko'rsatiladi")}.
1.4. Ish boshlash sanasi: ${sana}.${f.tugash_sana ? `
1.5. Shartnoma muddati: ${fmtD(f.boshlanish_sana)} dan ${fmtD(f.tugash_sana)} gacha.` : ''}

════════════════════════════════════════════════════════════════
2. ISH VAQTI VA MEHNAT REJIMI (MK 28, 112-moddalar)
════════════════════════════════════════════════════════════════

2.1. Tashqi o'rindoshning haftalik ish vaqti 20 soatdan oshmasligi shart (MK 28-moddasi).
2.2. Xodim ${kunlar} kunlari, kuniga ${soat} soat ishlaydi.
2.3. Aniq ish grafigi tomonlar kelishuviga binoan belgilanib, unga amal qilinadi.
2.4. Xodim o'zining asosiy ish joyi majburiyatlarini bajarish uchun ushbu joyda
     ruxsatsiz ish vaqtini o'zgartira olmaydi.

════════════════════════════════════════════════════════════════
3. ISH HAQI VA TO'LOV TARTIBI (MK 91–100-moddalar)
════════════════════════════════════════════════════════════════

3.1. Xodimga bajarilgan ish hajmiga qarab oylik ish haqi ${blank(f.maosh)} so'm belgilanadi.
3.2. Ish haqi har oyning 10-sanasiga qadar bank plastik kartasiga yoki naqd to'lanadi.
3.3. Daromad solig'i (12 %) va ijtimoiy sug'urta badallari qonunchilikka muvofiq
     ushlab qolinadi.
3.4. Ish bajarilmagan kunlar uchun ish haqi to'lanmaydi (proporsional hisob).

════════════════════════════════════════════════════════════════
4. MEHNAT TA'TILI (MK 136-moddasi)
════════════════════════════════════════════════════════════════

4.1. Tashqi o'rindosh ham asosiy ta'tilga haqli, biroq ta'til asosiy ish joyi bilan
     bir vaqtda beriladi (MK 136-moddasi).
4.2. Asosiy ish joyida ta'til boshlanishidan oldin xodim ish beruvchiga yozma xabar qiladi.
4.3. Ta'til puli bajarilgan ish hajmiga nisbatan proporsional hisoblanib to'lanadi.

════════════════════════════════════════════════════════════════
5. TOMONLARNING HUQUQ VA MAJBURIYATLARI
════════════════════════════════════════════════════════════════

5.1. Ish beruvchi majburiyatlari:
     a) zarur ish sharoiti, ish joyi va kerakli resurslarni ta'minlash;
     b) ish haqini belgilangan muddatda to'lash;
     c) mehnat xavfsizligini ta'minlash va mehnat daftarchasiga yozuv kiritish;
     d) ijtimoiy sug'urta badallarini to'lash.

5.2. Xodim majburiyatlari:
     a) lavozim yo'riqnomasiga muvofiq vazifalarni belgilangan sifatda bajarish;
     b) ish beruvchi ichki tartib qoidalariga rioya qilish;
     c) tijorat siri va maxfiy ma'lumotlarni muhofaza qilish;
     d) asosiy ish joyidagi ish jadvaliga zarar yetkazmaslik.

════════════════════════════════════════════════════════════════
6. SHARTNOMANI BEKOR QILISH (MK 30-moddasi)
════════════════════════════════════════════════════════════════

6.1. Ushbu shartnoma quyidagi holatlarda muddatidan oldin bekor qilinishi mumkin:
     a) tomonlarning o'zaro yozma kelishuviga binoan;
     b) ish beruvchi ushbu lavozimga asosiy xodim qabul qilganda — kamida 1 (bir) hafta
        oldin yozma ogohlantirish bilan (MK 30-moddasi — bu o'rindoshlikka xos maxsus asos);
     c) MK 99-moddasi: xodimning o'z xohishi bilan — 2 hafta oldin yozma ariza;
     d) MK 100-moddasi bo'yicha ish beruvchi tashabbusi bilan (asoslangan holda);
     e) MK 105-moddasi: tomonlarga bog'liq bo'lmagan holatlar (force-majeure).
6.2. Shartnoma muddati tugashi bilan avtomatik bekor bo'ladi.

════════════════════════════════════════════════════════════════
7. YAKKUNIY QOIDALAR VA REKVIZITLAR
════════════════════════════════════════════════════════════════

7.1. Shartnoma ikki nusxada tuzilgan, har bir tomon uchun bir nusxa.
7.2. Belgilanmagan masalalar O'zR Mehnat kodeksiga muvofiq hal etiladi.

ISH BERUVCHI:                              XODIM:
${org.name}                                ${blank(f.xodim_ism)}
INN: ${org.inn}                            Pasport: ${blank(f.passport, 'AA 0000000')}
Manzil: ${blank(f.org_manzil)}             JSHSHIR: ${blank(f.jshshir, '______________')}
Tel: ${blank(f.org_tel)}                   Manzil: ${blank(f.xodim_manzil)}
                                           Tel: ${blank(f.xodim_tel)}

Direktor: ___________________              Imzo: ___________________
${org.director_name}

M.O.                                       Sana: ${sana}
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. FUQAROVIY-HUQUQIY TUSIDAGI XIZMAT KO'RSATISH (PODRYAD) SHARTNOMASI
// Huquqiy asos: FK 734–756-moddalar (podryad); FK 779–791 (haq evaziga xizmat)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplFuqaroviy(f: F, org: Org): string {
  const sana  = fmtD(f.boshlanish_sana) || fmtD()
  const raqam = blank(f.shartnoma_raqam, '___')

  return `FUQAROVIY-HUQUQIY TUSIDAGI XIZMAT KO'RSATISH SHARTNOMASI
(Podryad / Yollanma shartnomasi)
№ ${raqam}

${blank(f.shahar, 'Toshkent')} shahri                             "${sana}"

${org.name} (INN: ${org.inn}), keyingi o'rinlarda "Buyurtmachi" deb yuritiladi,
direktori ${org.director_name} tomonidan vakilligi qilinadi,

va fuqaro ${blank(f.ijrochi_ism)}, pasport: ${blank(f.passport, 'AA 0000000')},
JSHSHIR: ${blank(f.ijrochi_jshshir, '______________')},
STIR: ${blank(f.ijrochi_stir, '___________')},
yashash manzili: ${blank(f.ijrochi_manzil)},
keyingi o'rinlarda "Ijrochi" deb yuritiladi,

O'zbekiston Respublikasi Fuqarolik kodeksining 734–756-moddalari asosida
quyidagi shartnomani tuzdik:

════════════════════════════════════════════════════════════════
1. SHARTNOMA PREDMETI VA FARQ
════════════════════════════════════════════════════════════════

1.1. Ijrochi Buyurtmachiga quyidagi xizmatlarni ko'rsatishi yoki ishlarni bajarishi lozim:

     ${blank(f.xizmat_nomi, '(xizmat tavsifi yoziladi)')}

1.2. Xizmat ko'rsatish muddati:
     — boshlanishi: ${fmtD(f.boshlanish_sana)}
     — tugashi: ${fmtD(f.tugash_sana) || '________________'}

1.3. Xizmat ko'rsatish joyi: ${blank(f.xizmat_joyi, org.name + ' ko\'rsatgan joy yoki masofadan')}.

1.4. MUHIM FARQ: Ushbu shartnoma mehnat shartnomasi emas.
     — Ijrochi Buyurtmachi tashkilotining shtat xodimlari tarkibiga kirmaydi;
     — Mehnat kodeksining kafolatlari (ta'til, ish haqi, intizomiy jazo va h.k.)
       ushbu munosabatlarga tatbiq etilmaydi;
     — Ijrochi mustaqil faoliyat yurituvchi shaxs sifatida natija uchun javobgardir;
     — Soliqlar (daromad solig'i, ijtimoiy to'lovlar) Ijrochi tomonidan mustaqil to'lanadi
       yoki Buyurtmachi tomonidan qonunga muvofiq ushlab qolinadi.

════════════════════════════════════════════════════════════════
2. NARX, TO'LOV TARTIBI VA SOLIQ MASALALARI (FK 744-moddasi)
════════════════════════════════════════════════════════════════

2.1. Xizmatlarning umumiy shartnoma narxi: ${blank(f.narx)} so'm
     (barcha soliqlar va yig'imlar hisobga olingan holda).
2.2. To'lov tartibi: ${blank(f.tolov_tartibi, "ishlar qabul-topshirish dalolatnomasi imzolangandan so'ng 5 ish kuni ichida")}.
2.3. To'lov asosi: tomonlar imzolagan Xizmat qabul-topshirish dalolatnomasi.
2.4. Ijrochi jismoniy shaxs bo'lsa, Buyurtmachi amaldagi qonunchilikka muvofiq
     daromad solig'ini manba'dan ushlab qolish va budjetga o'tkazish majburiyatini
     o'z zimmasiga oladi.
2.5. Xizmat hajmi yoki muddati o'zgarsa, narx tomonlar yozma kelishuviga binoan
     tuzatiladi.

════════════════════════════════════════════════════════════════
3. TOMONLARNING MAJBURIYATLARI (FK 735–736-moddalar)
════════════════════════════════════════════════════════════════

3.1. Ijrochi majburiyatlari:
     a) xizmatlarni belgilangan muddatda, kelishilgan hajmda va talabdagi sifatda ko'rsatish;
     b) Buyurtmachining maxfiy ma'lumotlari va tijorat sirlarini muhofaza qilish;
     c) bajarilgan ish bosqichlari to'g'risida Buyurtmachini xabardor qilib borish;
     d) Buyurtmachi taqdim etgan moddiy va axborot resurslarini faqat shartnoma maqsadida
        ishlatish va ish tugagach qaytarish;
     e) pastki pudratchilarga topshirish talab qilsa, Buyurtmachining yozma roziligini olish.

3.2. Buyurtmachi majburiyatlari:
     a) Ijrochiga zarur ma'lumot, materiallar va kirish huquqlarini o'z vaqtida taqdim etish;
     b) bajarilgan ishlarni belgilangan muddatda qabul qilish yoki asosli rad etish;
     c) kelishilgan to'lovni o'z vaqtida to'lash;
     d) Ijrochining xizmat ko'rsatishiga aralashmaslik.

════════════════════════════════════════════════════════════════
4. INTELLEKTUAL MULK HUQUQLARI
════════════════════════════════════════════════════════════════

4.1. Ijrochi ushbu shartnoma doirasida yaratgan barcha natijalar
     (dastur, dizayn, hujjat, tahlil, matn va boshqalar) to'lov amalga oshirilgandan
     so'ng Buyurtmachiga to'liq o'tadi.
4.2. Ijrochi yaratilgan natijalarni Buyurtmachi rozilugisiz uchinchi shaxslarga
     bermaydi, nashr etmaydi yoki namoyish qilmaydi.
4.3. Ijrochi shartnomaga qadar yaratgan va ushbu shartnomaga almashinmaydigan
     oldindan mavjud materiallarga nisbatan o'z huquqini saqlab qoladi.

════════════════════════════════════════════════════════════════
5. SIFAT TALABLARI VA QABUL QILISH TARTIBI (FK 740–741-moddalar)
════════════════════════════════════════════════════════════════

5.1. Ijrochi xizmatlarni quyidagi mezon va standartlarga muvofiq ko'rsatadi:
     ${blank(f.sifat_mezoni, 'kelishilgan texnik vazifa va odatdagi xizmat standartlari')}.
5.2. Ishlar tugatilgandan so'ng 3 (uch) ish kuni ichida xizmat qabul-topshirish
     dalolatnomasi tuziladi.
5.3. Buyurtmachi dalolatnomani imzolashdan bosh tortsa, yozma va asoslangan shikoyat
     taqdim etishi shart. Shikoyat belgilangan muddatda bo'lmasa, ish qabul qilingan hisoblanadi.
5.4. Aniqlangan kamchiliklarni Ijrochi o'z hisobidan va kelishilgan muddatda bartaraf etadi
     (FK 741-moddasi).

════════════════════════════════════════════════════════════════
6. JAVOBGARLIK VA JARIMA (FK 327–337-moddalar)
════════════════════════════════════════════════════════════════

6.1. Tomonlar ushbu shartnoma bo'yicha o'z majburiyatlarini bajarmaganligi uchun
     FK 14, 327–337-moddalari asosida javobgar bo'ladi.
6.2. Muddatni kechiktirganlik uchun jarima: kechiktirilgan har bir kun uchun
     shartnoma summasining 0,1 % (lekin umumiy jarima shartnoma summasining
     10 % dan oshmasligi kerak).
6.3. Force-majeure holatlari (tabiiy ofat, epidemiya, davlat qarorlari) uchun tomonlar
     javobgar emas, biroq bu haqda darhol va yozma xabar yuborilishi shart.
6.4. Zarar hajmida kelishmovchilik bo'lsa, sud tartibida hal etiladi.

════════════════════════════════════════════════════════════════
7. MAXFIYLIK
════════════════════════════════════════════════════════════════

7.1. Ijrochi shartnoma davomida bilib olgan Buyurtmachiga oid har qanday tijorat,
     texnik va moliyaviy ma'lumotlarni uchinchi shaxslarga oshkor etmaydi.
7.2. Ushbu majburiyat shartnoma muddati tugagandan keyin ham 2 (ikki) yil kuchda qoladi.

════════════════════════════════════════════════════════════════
8. SHARTNOMANI BEKOR QILISH (FK 367–378-moddalar)
════════════════════════════════════════════════════════════════

8.1. Shartnoma muddati tugagach o'z-o'zidan bekor bo'ladi.
8.2. Muddatidan oldin bekor qilish — kamida 5 (besh) ish kuni oldin yozma xabar.
8.3. Buyurtmachi muddatidan oldin bekor qilsa, Ijrochining haqiqatda bajargan
     ish ulushiga to'liq to'lov amalga oshiriladi.
8.4. Ijrochi o'z tashabbusi bilan bekor qilsa va Buyurtmachi zarar ko'rsa, Ijrochi
     etkazilgan zararni qoplashga majburdir.

════════════════════════════════════════════════════════════════
9. NIZOLARNI HAL QILISH
════════════════════════════════════════════════════════════════

9.1. Nizolar avval tomonlarning muzokara yo'li bilan hal etiladi (10 kun muddat).
9.2. Kelishuv chiqmagan taqdirda nizo O'zR qonunchiligiga muvofiq sudga topshiriladi.
9.3. Shartnomaga O'zbekiston Respublikasi qonunchiligi tatbiq etiladi.

════════════════════════════════════════════════════════════════
TOMONLARNING REKVIZITLARI
════════════════════════════════════════════════════════════════

BUYURTMACHI:                               IJROCHI:
${org.name}                                ${blank(f.ijrochi_ism)}
INN: ${org.inn}                            Pasport: ${blank(f.passport, 'AA 0000000')}
Manzil: ${blank(f.org_manzil)}             JSHSHIR: ${blank(f.ijrochi_jshshir, '______________')}
Tel: ${blank(f.org_tel)}                   STIR: ${blank(f.ijrochi_stir)}
Hisob: ${blank(f.org_hisob)}               Manzil: ${blank(f.ijrochi_manzil)}
                                           Tel: ${blank(f.ijrochi_tel)}
                                           Hisob/Karta: ${blank(f.ijrochi_hisob)}

Direktor: ___________________              Imzo: ___________________
${org.director_name}

M.O.                                       Sana: ${sana}
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. MAXFIYLIK (KONFIDENSIALLIK / NDA) SHARTNOMASI
// Huquqiy asos: "Tijorat siri to'g'risida"gi Qonun (2008, № ЗРУ-190);
//               FK 14-moddasi; Shaxsiy ma'lumotlar to'g'risida"gi Qonun (2019)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplMaxfiylik(f: F, org: Org): string {
  const sana   = fmtD()
  const muddat = blank(f.muddat, '3 yil')
  const raqam  = blank(f.shartnoma_raqam, '___')

  return `MAXFIYLIK (KONFIDENSIALLIK) SHARTNOMASI
(Non-Disclosure Agreement — NDA)
№ ${raqam}

${blank(f.shahar, 'Toshkent')} shahri                             "${sana}"

${org.name} (INN: ${org.inn}), keyingi o'rinlarda "Tashkilot" deb yuritiladi,
direktori ${org.director_name} tomonidan vakilligi qilinadi,

va fuqaro ${blank(f.xodim_ism)}, pasport: ${blank(f.passport, 'AA 0000000')},
JSHSHIR: ${blank(f.jshshir, '______________')},
lavozim: "${blank(f.lavozim)}",
keyingi o'rinlarda "Xodim" deb yuritiladi,

"Tijorat siri to'g'risida"gi O'zbekiston Respublikasi Qonuni (2008-yil 11-dekabr,
№ ЗРУ-190), "Shaxsiy ma'lumotlar to'g'risida"gi Qonun (2019-yil 2-iyul, № ЗРУ-547)
hamda O'zbekiston Respublikasi Fuqarolik kodeksining 14-moddasi asosida ushbu
maxfiylik shartnomasini tuzdik:

════════════════════════════════════════════════════════════════
1. MAQSAD VA ASOSLAR
════════════════════════════════════════════════════════════════

1.1. Ushbu shartnoma Xodimning mehnat yoki xizmat faoliyati davomida bilib oladigan
     Tashkilotga oid maxfiy ma'lumotlarni himoya qilish va Tashkilotning tijorat,
     texnik va boshqa qonuniy manfaatlarini ta'minlash maqsadida tuziladi.
1.2. Ushbu shartnoma mehnat shartnomasi yoki xizmat ko'rsatish shartnomasining
     ajralmas qo'shimchasi (annexi) sifatida kuchga kiradi.

════════════════════════════════════════════════════════════════
2. MAXFIY MA'LUMOTLAR TARKIBI
════════════════════════════════════════════════════════════════

2.1. Quyidagilar maxfiy ma'lumot deb tan olinadi:
     a) MOLIYAVIY: daromad va xarajat ko'rsatkichlari, ish haqi, shartnoma summalari,
        investitsiyalar, kreditlar, bank hisobraqamlari va shaxsiy moliyaviy ma'lumotlar;
     b) MIJOZLAR: mijozlar ro'yxati, aloqa ma'lumotlari, shartnomalar, muzokaralar
        tarixi, talablar va shikoyatlar;
     c) TEXNOLOGIK: dasturiy ta'minot, algoritmlar, dizayn, patentlanmagan ixtirolar,
        ishlab chiqarish jarayonlari va know-how;
     d) STRATEGIK: biznes-rejalar, bozor tadqiqotlari, yangi mahsulot rejalashtirish,
        raqobatchilar haqida to'plangan ma'lumotlar;
     e) KADRLAR: xodimlar ro'yxati, lavozimlari, ish haqilari, mehnat tarixi
        va shaxsiy ma'lumotlar;
     f) HAMKORLAR: yetkazib beruvchilar, narxlar, ta'minot shartlari, ekskluziv
        kelishuvlar va hamkorlik shartlari;
     g) BOSHQA: Tashkilot tomonidan "MAXFIY" belgisi bilan belgilangan har qanday hujjat,
        fayl yoki ma'lumot.

2.2. Maxfiy ma'lumot deb HISOBLANMAYDI:
     a) rasmiy ommaviy manbalarda mavjud bo'lgan ma'lumotlar;
     b) Xodim Tashkilotga kirishidan avval allaqachon umum uchun ma'lum bo'lgan ma'lumotlar;
     c) qonun yoki sud talabi bo'yicha ochilishi majburiy bo'lgan ma'lumotlar.

════════════════════════════════════════════════════════════════
3. XODIMNING MAXFIYLIK MAJBURIYATLARI
════════════════════════════════════════════════════════════════

3.1. Xodim quyidagilarga qat'iyan majburdir:
     a) maxfiy ma'lumotlarni og'zaki, yozma, elektron yoki boshqa shaklda uchinchi
        shaxslarga, raqobit tashkilotlarga yoki ommaga oshkor etmaslik;
     b) maxfiy ma'lumotlarni faqat rasmiy ish vazifalarini bajarish maqsadida ishlatish;
     c) maxfiy ma'lumotlarni Tashkilot tasdiqlagan qurilmalarda saqlash va ruxsatsiz
        nusxa ko'chirmaslik yoki tashqi muhitga o'tkazmaslik;
     d) maxfiy ma'lumotlarga nisbatan barcha zarur texnik va tashkiliy himoya choralarini
        ko'rish;
     e) ishdan bo'shaganda yoki shartnoma tugaganda barcha maxfiy hujjat va
        ma'lumot tashuvchilarni Tashkilotga topshirish yoki yo'q qilish;
     f) maxfiy ma'lumotlar xavf ostida qolganligi to'g'risida darhol Tashkilotni
        xabardor qilish.

3.2. Maxfiy ma'lumotlarni oshkor etish faqat quyidagi hollarda mumkin:
     a) Tashkilotning oldindan olingan yozma ruxsati bilan;
     b) O'zbekiston Respublikasi qonunchiligiga muvofiq davlat organlari talabiga binoan —
        faqat so'ralgan hajm va doirada, va bu haqda Tashkilot darhol xabardor qilinadi.

════════════════════════════════════════════════════════════════
4. SHARTNOMA MUDDATI
════════════════════════════════════════════════════════════════

4.1. Ushbu shartnoma imzolangan kundan boshlab kuchga kiradi.
4.2. Maxfiylik majburiyati mehnat munosabatlari yoki xizmat shartnomasi tugagandan
     keyin ham ${muddat} davomida kuchda qoladi (maxfiylik muddati).
4.3. Maxfiylik muddatini tomonlar yozma kelishuvi bilan uzaytirishi mumkin.

════════════════════════════════════════════════════════════════
5. JAVOBGARLIK VA SANKSIYALAR
════════════════════════════════════════════════════════════════

5.1. Maxfiy ma'lumotlar oshkor etilganda yoki noto'g'ri ishlatilganda Xodim:
     a) Tashkilotga etkazilgan to'g'ridan-to'g'ri zararni (yo'qotilgan foyda bilan birga)
        to'liq qoplashga majburdir — FK 14-moddasi;
     b) "Tijorat siri to'g'risida"gi Qonunning 14-moddasi bo'yicha ma'muriy javobgarlikka
        tortilishi mumkin;
     c) O'zR Jinoyat kodeksining 192-moddasi bo'yicha jinoiy javobgarlikka ham tortilishi
        mumkin (qasddan oshkor etilgan holda).
5.2. Shartnomaning buzilishi aniqlangan zahoti Tashkilot sudga murojaat qilib,
     buzilishni to'xtatishni va zararni qoplashni talab qilish huquqiga ega.

════════════════════════════════════════════════════════════════
6. NIZOLARNI HAL QILISH
════════════════════════════════════════════════════════════════

6.1. Nizolar muzokara yo'li bilan hal etiladi (muddati — 10 ish kuni).
6.2. Muzokara samarasiz bo'lsa, nizo O'zbekiston Respublikasi sudiga topshiriladi.
6.3. Ushbu shartnomaga O'zbekiston Respublikasi qonunchiligi tatbiq etiladi.

════════════════════════════════════════════════════════════════
TOMONLARNING REKVIZITLARI VA IMZOLARI
════════════════════════════════════════════════════════════════

TASHKILOT:                                 XODIM:
${org.name}                                ${blank(f.xodim_ism)}
INN: ${org.inn}                            Pasport: ${blank(f.passport, 'AA 0000000')}
                                           JSHSHIR: ${blank(f.jshshir, '______________')}
                                           Lavozim: ${blank(f.lavozim)}

Direktor: ___________________              Imzo: ___________________
${org.director_name}

M.O.                                       Sana: ${sana}
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ISHGA QABUL QILISH BUYRUG'I
// Huquqiy asos: MK 76-moddasi; O'z DSt 1212 (hujjatlashtirish standarti)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplBuyruqQabul(f: F, org: Org): string {
  const sana   = fmtD(f.sana)
  const raqam  = blank(f.buyruq_raqam, '___')
  const sinov  = f.sinov ? `, ${f.sinov} sinov muddati bilan` : ''
  const stavka = blank(f.stavka, "to'liq (1,0)")

  return `${org.name}
INN: ${org.inn}
Manzil: ${blank(f.org_manzil)}

════════════════════════════════════════════════════════════════
                         BUYRUQ № ${raqam}
                         "${sana}"

              ISHGA QABUL QILISH TO'G'RISIDA
════════════════════════════════════════════════════════════════

O'QITAMAN / BUYURAMAN:

Fuqaro ${blank(f.xodim_ism)}, pasport ${blank(f.passport, 'AA 0000000')}, JSHSHIR: ${blank(f.jshshir, '______________')},
"${blank(f.lavozim)}" lavozimiga${f.bolim ? ` "${f.bolim}" bo'limiga` : ''},
${fmtD(f.sana)} sanasidan boshlab,
ish haqi oyiga ${blank(f.maosh)} so'm miqdorida,
${stavka} stavkada${sinov} QABUL QILINSIN.

Xodim bilan O'zbekiston Respublikasi Mehnat kodeksining 75–76-moddalari
asosida mehnat shartnomasi tuzilsin.

Kadrlar bo'limiga topshiriqlar:
  1. Mehnat shartnomasi tuzilsin va tomonlar imzosi bilan rasmiylashtirilsin;
  2. Mehnat daftarchasiga yozuv kiritilsin;
  3. Xodim lavozim yo'riqnomasi, tashkilot ichki mehnat tartib-qoidalari va
     mehnat xavfsizligi qoidalari bilan tanishtirilsin, tanishganlik imzosi olinsin;
  4. Zarur bo'lsa, xodimdan maxfiylik shartnomasi imzolatilsin.

Asoslar:
  — fuqaro ${blank(f.xodim_ism)} ning "${fmtD(f.sana)}" sanali ariza-so'rovi;
  — O'zbekiston Respublikasi Mehnat kodeksining 76-moddasi.

════════════════════════════════════════════════════════════════
Direktor:  _________________________  ${org.director_name}

M.O.

Ijro uchun mas'ul: Kadrlar bo'limi boshlig'i

Buyruq bilan tanishtirildi:
  Kadrlar bo'limi boshlig'i: _________________________  "${sana}"
  Xodim: _________________________  ${blank(f.xodim_ism)}  "${sana}"
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ISHDAN BO'SHATISH BUYRUG'I
// Huquqiy asos: MK 97–105-moddalar (bekor qilish asoslari);
//               MK 168–170 (hisob-kitob va to'lovlar)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplBuyruqBoshtash(f: F, org: Org): string {
  const sana    = fmtD(f.sana)
  const raqam   = blank(f.buyruq_raqam, '___')
  const sabab   = blank(f.sabab, "o'z xohishi bilan")
  const mkModda = blank(f.mk_modda, '99')

  return `${org.name}
INN: ${org.inn}
Manzil: ${blank(f.org_manzil)}

════════════════════════════════════════════════════════════════
                         BUYRUQ № ${raqam}
                         "${sana}"

              ISHDAN BO'SHATISH TO'G'RISIDA
════════════════════════════════════════════════════════════════

BUYURAMAN:

Fuqaro ${blank(f.xodim_ism)},${f.bolim ? ` "${f.bolim}" bo'limi` : ''} "${blank(f.lavozim)}"
lavozimida ishlaydi, ${fmtD(f.sana)} sanasidan boshlab
ishdan BO'SHATILSIN.

Bo'shatish sababi: ${sabab}
(O'zbekiston Respublikasi Mehnat kodeksining ${mkModda}-moddasi asosida).

Kadrlar bo'limi va buxgalteriyaga topshiriqlar:
  1. Ishdan bo'shatilgan kunda barcha hisob-kitoblar amalga oshirilsin:
     — to'lanmagan ish haqi to'liq to'lansin;
     — foydalanilmagan ta'til kunlari uchun kompensatsiya to'lansin (MK 168-moddasi);
     — qonunda nazarda tutilgan boshqa to'lovlar amalga oshirilsin;
  2. Mehnat daftarchasiga tegishli yozuv kiritilsin va xodimga topshirilsin;
  3. Xodim tomonidan foydalanilgan ish joyi, jihozlar, yo'riqnomalar, maxfiy hujjatlar
     va korporativ vositalar (kompyuter, telefon, kalitlar) qabul qilib olinsin;
  4. Xodimga barcha hujjatlar bo'shatilgan kunda taqdim etilsin (MK 170-moddasi).

Asoslar:
  — fuqaro ${blank(f.xodim_ism)} ning "${fmtD(f.sana)}" sanali ariza-so'rovi;
  — O'zbekiston Respublikasi Mehnat kodeksining ${mkModda}-moddasi.

════════════════════════════════════════════════════════════════
Direktor:  _________________________  ${org.director_name}

M.O.

Ijro uchun mas'ul: Kadrlar bo'limi boshlig'i, Buxgalteriya

Buyruq bilan tanishtirildi:
  Kadrlar bo'limi boshlig'i: _________________________  "${sana}"
  Xodim: _________________________  ${blank(f.xodim_ism)}  "${sana}"
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. TA'TIL BUYRUG'I
// Huquqiy asos: MK 133–145-moddalar
// ═══════════════════════════════════════════════════════════════════════════════
export function tplTatilBuyruq(f: F, org: Org): string {
  const sana      = fmtD()
  const raqam     = blank(f.buyruq_raqam, '___')
  const tatilTuri = blank(f.tatil_turi, "asosiy yillik mehnat ta'tili")
  const hisobYil  = blank(f.tatil_yil, String(new Date().getFullYear()))
  const keyingiYil = String(parseInt(hisobYil) + 1)

  return `${org.name}
INN: ${org.inn}
Manzil: ${blank(f.org_manzil)}

════════════════════════════════════════════════════════════════
                         BUYRUQ № ${raqam}
                         "${sana}"

              TA'TIL BERISH TO'G'RISIDA
════════════════════════════════════════════════════════════════

BUYURAMAN:

Fuqaro ${blank(f.xodim_ism)},${f.bolim ? ` "${f.bolim}" bo'limi` : ''}
"${blank(f.lavozim)}" lavozimida ishlovchi xodimga,

Ta'til turi: ${tatilTuri}
(MK 134–136-moddalar asosida)

${fmtD(f.tatil_boshlanish)} sanasidan ${fmtD(f.tatil_tugash)} sanasigacha,
jami: ${blank(f.kunlar_soni, '___')} ish kuni

TA'TIL BERILSIN.

Hisobot yili: ${hisobYil} – ${keyingiYil} yillar.

Buxgalteriyaga:
  Ta'til puli O'zR Mehnat kodeksining 141-moddasi va amaldagi qonunchilikka
  muvofiq ta'til boshlanishidan kamida 3 (uch) kun oldin to'liq to'lansin.

Asoslar:
  — fuqaro ${blank(f.xodim_ism)} ning ta'til so'rovi arizasi;
  — O'zbekiston Respublikasi Mehnat kodeksining 133–141-moddalari;
  — Mehnat ta'tili jadvaliga muvofiqlik.

════════════════════════════════════════════════════════════════
Direktor:  _________________________  ${org.director_name}

M.O.

Buyruq bilan tanishtirildi:
  Buxgalteriya: _________________________  "${sana}"
  Xodim: _________________________  ${blank(f.xodim_ism)}  "${sana}"
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. LAVOZIM O'ZGARTIRISH BUYRUG'I
// Huquqiy asos: MK 80–82-moddalar (o'tkazish va o'zgartirish)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplBuyruqLavozim(f: F, org: Org): string {
  const sana  = fmtD(f.sana)
  const raqam = blank(f.buyruq_raqam, '___')

  return `${org.name}
INN: ${org.inn}
Manzil: ${blank(f.org_manzil)}

════════════════════════════════════════════════════════════════
                         BUYRUQ № ${raqam}
                         "${sana}"

              LAVOZIMNI O'ZGARTIRISH (O'TKAZISH) TO'G'RISIDA
════════════════════════════════════════════════════════════════

BUYURAMAN:

Fuqaro ${blank(f.xodim_ism)},
hozirda "${blank(f.eski_lavozim)}" lavozimida ishlaydi,

${fmtD(f.sana)} sanasidan boshlab

"${blank(f.yangi_lavozim)}" lavozimiga${f.yangi_bolim ? ` "${f.yangi_bolim}" bo'limiga` : ''}

O'TKAZILSIN.

Yangi lavozim bo'yicha oylik ish haqi: ${blank(f.yangi_maosh)} so'm.
O'tkazish sababi: ${blank(f.sabab)}.

Kadrlar bo'limiga topshiriqlar:
  1. Mehnat shartnomasiga qo'shimcha kelishuv tuzilsin va tomonlar imzosi olinsin
     (MK 80-moddasi — shartnoma shartlari o'zgarishi faqat yozma kelishuv bilan amalga oshadi);
  2. Yangi lavozim yo'riqnomasi tayyorlansin va xodim imzosi bilan tanishtirilsin;
  3. Mehnat daftarchasiga o'tkazish to'g'risida yozuv kiritilsin;
  4. Buxgalteriyaga yangi ish haqi ma'lumotlari yuborilsin.

ESLATMA: MK 81-moddasiga muvofiq, mehnat sharoitlarining muhim o'zgarishlari
     kamida 2 oy oldin xodimga yozma bildirilishi shart. Xodimning yozma roziligi
     olindi: _________________ "${sana}"

Asoslar:
  — fuqaro ${blank(f.xodim_ism)} ning yozma roziligi;
  — O'zbekiston Respublikasi Mehnat kodeksining 80 va 82-moddalari.

════════════════════════════════════════════════════════════════
Direktor:  _________________________  ${org.director_name}

M.O.

Buyruq bilan tanishtirildi:
  Kadrlar bo'limi boshlig'i: _________________________  "${sana}"
  Xodim: _________________________  ${blank(f.xodim_ism)}  "${sana}"
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. MUKOFOT (RAG'BAT) BERISH BUYRUG'I
// Huquqiy asos: MK 154–157-moddalar (rag'batlantirish)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplBuyruqMukofot(f: F, org: Org): string {
  const sana   = fmtD(f.sana)
  const raqam  = blank(f.buyruq_raqam, '___')
  const sabab  = blank(f.sabab, "mehnatdagi yuqori natijalari uchun")
  const mukTuri = blank(f.mukofot_turi, "bir martalik pul mukofoti")

  return `${org.name}
INN: ${org.inn}
Manzil: ${blank(f.org_manzil)}

════════════════════════════════════════════════════════════════
                         BUYRUQ № ${raqam}
                         "${sana}"

              MUKOFOT (RAG'BAT) BERISH TO'G'RISIDA
════════════════════════════════════════════════════════════════

BUYURAMAN:

Fuqaro ${blank(f.xodim_ism)},
"${blank(f.lavozim)}" lavozimida${f.bolim ? ` "${f.bolim}" bo'limida` : ''} ishlovchi xodimga,

${sabab} munosabati bilan

Mukofot turi: ${mukTuri}
Mukofot miqdori: ${blank(f.mukofot_miqdori)} so'm

BERILSIN.

Mukofot to'lovi shu buyruq chiqarilgan kundan boshlab 3 (uch) ish kuni ichida
buxgalteriya tomonidan xodimning plastik kartasiga yoki naqd to'lansin.

Mukofot foydadan to'lanadi va qonunchilikda belgilangan tartibda soliqqa tortiladi.

Asoslar:
  — bo'lim boshlig'ining "${sana}" sanali taqdimномаsi;
  — O'zbekiston Respublikasi Mehnat kodeksining 154-moddasi;
  — tashkilotning mukofot to'g'risidagi ichki nizomi (mavjud bo'lsa).

════════════════════════════════════════════════════════════════
Direktor:  _________________________  ${org.director_name}

M.O.

Buyruq bilan tanishtirildi:
  Buxgalteriya: _________________________  "${sana}"
  Xodim: _________________________  ${blank(f.xodim_ism)}  "${sana}"
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. INTIZOMIY JAZO BUYRUG'I
// Huquqiy asos: MK 181–186-moddalar (intizomiy javobgarlik va tartib)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplBuyruqJazo(f: F, org: Org): string {
  const sana      = fmtD(f.sana)
  const raqam     = blank(f.buyruq_raqam, '___')
  const jazaTuri  = blank(f.jazo_turi, 'hayfsan (ogoh qilish)')
  const holat     = blank(f.holat, 'ichki mehnat tartib-qoidalarini buzish')
  const qbSana    = fmtD(f.qoidabuzarlik_sana)
  const tushSana  = fmtD(f.tushuntirish_sana)

  return `${org.name}
INN: ${org.inn}
Manzil: ${blank(f.org_manzil)}

════════════════════════════════════════════════════════════════
                         BUYRUQ № ${raqam}
                         "${sana}"

              INTIZOMIY JAZO QO'LLASH TO'G'RISIDA
════════════════════════════════════════════════════════════════

BUYURAMAN:

Fuqaro ${blank(f.xodim_ism)},${f.bolim ? ` "${f.bolim}" bo'limi` : ''}
"${blank(f.lavozim)}" lavozimida ishlovchi xodimga,

Qoidabuzarlik sana: ${qbSana}
Qoidabuzarlikning mazmuni: ${holat}

O'ZBEKISTON RESPUBLIKASI MEHNAT KODEKSINING 181-MODDASIGA MUVOFIQ:

"${jazaTuri}" ko'rinishidagi INTIZOMIY JAZO QO'LLANILSIN.

────────────────────────────────────────────────────────────────
QONUNIY PROTSEDURA BAJARILGANLIGI TO'G'RISIDA:
────────────────────────────────────────────────────────────────
1. Xodimdan yozma tushuntirish so'raldi (MK 182-moddasi 2-qismi).
2. Xodim tushuntirish xatini taqdim etdi / rad etdi:
   "${tushSana}" — ___________________________
3. Qoidabuzarlik aniqlangan kundan boshlab 1 (bir) oy ichida chiqarilmoqda
   (MK 183-moddasi: 1 oydan kech va 6 oydan keyin jazo qo'llanilmaydi).
4. Xodim bu voqeaga oldin jazo olmagan / avvalgi jazo № __ dan hisob qilinganda
   ushbu jazo bir qoidabuzarlik uchun ikkinchi jazo emas.

────────────────────────────────────────────────────────────────
XODIMGA ESLATMA (MK 186-moddasi):
────────────────────────────────────────────────────────────────
Siz ushbu buyruqni qabul qilgan kundan boshlab:
  — 3 oy ichida mehnat nizolari komissiyasiga (MNK);
  — yoki bevosita sudga murojaat qilish huquqiga egasiz.
Keyingi 1 yil mobaynida yangi intizom buzilmasa, jazo o'z-o'zidan
yo'qolgan hisoblanadi (MK 185-moddasi).

Asoslar:
  — bo'lim boshlig'ining xizmati yozuvi;
  — xodimning tushuntirish xati (${tushSana});
  — O'zbekiston Respublikasi Mehnat kodeksining 181–183-moddalari.

════════════════════════════════════════════════════════════════
Direktor:  _________________________  ${org.director_name}

M.O.

Buyruq bilan tanishtirildi (3 kun ichida topshirilishi shart — MK 182 4-qism):
  Kadrlar bo'limi: _________________________  "${sana}"
  Xodim: _________________________  ${blank(f.xodim_ism)}  "${sana}"

Xodim imzo qo'yishdan bosh tortsa, dalolatnoma tuziladi va buyruq yopiq
xatda pochta orqali yuboriladi (MK 182 5-qismi).
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. XIZMAT SAFARI BUYRUG'I
// Huquqiy asos: MK 166–170-moddalar (xizmat safari);
//               "Xizmat safarlariga yuborish tartibi to'g'risida" Nizom (2018)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplSafariBuyruq(f: F, org: Org): string {
  const sana        = fmtD(f.buyruq_sana)
  const raqam       = blank(f.buyruq_raqam, '___')
  const safBosh     = fmtD(f.safari_bosh)
  const safTugash   = fmtD(f.safari_tugash)
  const bolim       = f.bolim ? ` "${f.bolim}" bo'limi,` : ''
  const xarajat     = blank(f.xarajat_manba, "tashkilot hisobidan")

  // Kunlar soni
  let kunlar = '___'
  if (f.safari_bosh && f.safari_tugash) {
    const d1 = new Date(f.safari_bosh)
    const d2 = new Date(f.safari_tugash)
    const diff = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1
    if (diff > 0) kunlar = String(diff)
  }

  return `${org.name}
INN: ${org.inn}

════════════════════════════════════════════════════════════════
                    BUYRUQ № ${raqam}
                    "${sana}"

         XIZMAT SAFARIGA YUBORISH TO'G'RISIDA
════════════════════════════════════════════════════════════════

O'QITAMAN / BUYURAMAN:

${blank(f.xodim_ism)}, JSHSHIR: ${blank(f.jshshir, '______________')},
"${blank(f.lavozim)}" lavozimi,${bolim}
${safBosh} sanadan ${safTugash} sanagacha (${kunlar} kun)
${blank(f.safari_manzil)} ga xizmat safariga YUBORILSIN.

Safari maqsadi:
${blank(f.safari_maqsad, '________________')}

Safari xarajatlari: ${xarajat}.

Kadrlar bo'limiga topshiriqlar:
  1. Safari topshirig'i (komandirovka guvohnomasi) rasmiylashtirilib,
     xodimga topshirilsin;
  2. Safarga ketish va qaytish sanasi mehnat daftarchasiga qayd etilsin;
  3. Safar tugagach 3 (uch) ish kuni ichida avans hisoboti taqdim etilsin
     (MK 169-moddasi).

Asoslar:
  — O'zbekiston Respublikasi Mehnat kodeksining 166–170-moddalari;
  — Xizmat safarlariga yuborish tartibi to'g'risida amaldagi Nizom.

════════════════════════════════════════════════════════════════
Direktor:  _________________________  ${org.director_name}
           M.O.

Buyruq bilan tanishtirildi:
  Kadrlar bo'limi: _________________________  "${sana}"
  Xodim: _________________________  ${blank(f.xodim_ism)}  "${sana}"
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 12. QO'SHIMCHA KELISHUV (MEHNAT SHARTNOMASIGA O'ZGARTIRISH)
// Huquqiy asos: MK 75-moddasi (shartlarni o'zgartirish);
//               FK 354-moddasi (shartnomani o'zgartirish tartibi)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplQoshimchaKelishuv(f: F, org: Org): string {
  const sana        = fmtD(f.kelishuv_sana)
  const raqam       = blank(f.kelishuv_raqam, '___')
  const aslRaq      = blank(f.asl_shartnoma_raq, '___')
  const aslSan      = fmtD(f.asl_shartnoma_san)
  const kuchga      = fmtD(f.kuchga_kirish)

  return `QO'SHIMCHA KELISHUV № ${raqam}
MEHNAT SHARTNOMASIGA

${blank(f.shahar, 'Toshkent')} shahri                             "${sana}"

Ushbu Qo'shimcha kelishuv quyidagi tomonlar o'rtasida tuzildi:

ISH BERUVCHI: ${org.name}, INN: ${org.inn},
              direktor ${org.director_name} nomidan,

XODIM:        ${blank(f.xodim_ism)}, JSHSHIR: ${blank(f.jshshir, '______________')},

birgalikda "Tomonlar" deb ataluvchilar.

1. KELISHUV PREDMETI

1.1. Tomonlar ${aslSan} sanali № ${aslRaq}-sonli mehnat shartnomasiga
     quyidagi o'zgartirishlarni kiritishga kelishdi:

${blank(f.ozgartirishlar, '________________')}

1.2. Ushbu o'zgartirishlar ${kuchga} sanadan kuchga kiradi.

2. UMUMIY QOIDALAR

2.1. Ushbu Qo'shimcha kelishuvda ko'rsatilmagan barcha qoidalarda
     asosiy mehnat shartnomasi (№ ${aslRaq}) o'z kuchini saqlab qoladi.
2.2. Ushbu Qo'shimcha kelishuv ikki nusxada tuzilgan, har bir tomon
     uchun bittadan; ikkala nusxa ham teng yuridik kuchga ega.
2.3. Asoslar: O'zbekiston Respublikasi Mehnat kodeksining 75-moddasi;
     Fuqarolik kodeksining 354-moddasi.

════════════════════════════════════════════════════════════════
ISH BERUVCHI:                          XODIM:
${org.name}                            ${blank(f.xodim_ism)}
INN: ${org.inn}                        JSHSHIR: ${blank(f.jshshir, '______________')}

_________________________              _________________________
${org.director_name}                   "${sana}"
M.O.
`
}

// ═══════════════════════════════════════════════════════════════════════════════
// 13. MEHNAT DAFTARCHASI YOZUVI (SHAKL)
// Huquqiy asos: MK 81-moddasi; O'zR Vazirlar Mahkamasi 2022-yil 262-sonli
//               Qaror (mehnat daftarchasini yuritish tartibi)
// ═══════════════════════════════════════════════════════════════════════════════
export function tplMehnatDaftarcha(f: F, org: Org): string {
  const yozuvSana   = fmtD(f.yozuv_sana)
  const buyruqSana  = fmtD(f.buyruq_sana)
  const raqam       = blank(f.yozuv_raqam, '___')
  const buyruqRaq   = blank(f.buyruq_raqam, '___')
  const bolim       = f.bolim ? `"${f.bolim}" bo'limi, ` : ''
  const tur         = blank(f.yozuv_turi, 'Ishga qabul')
  const mkModda     = f.mk_modda ? `MK ${f.mk_modda}-moddasi` : 'O\'zR Mehnat kodeksi'

  // Tur asosida yozuv matni
  const turMatn: Record<string, string> = {
    'Ishga qabul':             `${org.name} korxonasiga ${bolim}"${blank(f.lavozim)}" lavozimiga qabul qilindi`,
    "Ishdan bo'shatish":       `${org.name} korxonasidan ${bolim}"${blank(f.lavozim)}" lavozimidan bo'shatildi`,
    "Lavozim o'zgartirish":    `${org.name} korxonasida "${blank(f.lavozim)}" lavozimiga o'tkazildi`,
  }
  const yozuvMatn = turMatn[tur] || `${org.name}: ${tur} — "${blank(f.lavozim)}" lavozimi`

  return `MEHNAT DAFTARCHASI YOZUVI
(Rasmiy shakl — O'zR VMQ 2022-yil 262-son asosida)

════════════════════════════════════════════════════════════════
Xodim: ${blank(f.xodim_ism)}

YOZUV MA'LUMOTLARI:
────────────────────────────────────────────────────────────────
Tartib №    : ${raqam}
Yozuv sanasi: ${yozuvSana}
Yozuv mazmuni:
  ${yozuvMatn}.

Asosiy hujjat:
  Buyruq № ${buyruqRaq}, "${buyruqSana}" sanali.
  Huquqiy asos: ${mkModda}.

════════════════════════════════════════════════════════════════
JADVAL KO'RINISHI (Daftarchaga kiritish uchun):
────────────────────────────────────────────────────────────────
 №   │ Sana       │ Ma'lumot                             │ Hujjat
─────┼────────────┼──────────────────────────────────────┼──────────────
 ${raqam.padEnd(3)} │ ${yozuvSana} │ ${yozuvMatn.slice(0, 36).padEnd(36)} │ Buyruq № ${buyruqRaq}
─────┴────────────┴──────────────────────────────────────┴──────────────

KADRLAR BO'LIMI TASDIQI:
════════════════════════════════════════════════════════════════
Kadrlar bo'limi mudiri: _________________________
Ism-sharif:             ________________
Sana:                   "${yozuvSana}"
Muhr:                   M.O.

IZOH: Ushbu shakl mehnat daftarchasiga yozuv kiritish uchun
namunadir. Asl yozuv belgilangan tartibda qo'lda kiritiladi.
`
}
