'use client'

import { useState, useEffect } from 'react'
import { downloadTextAsPDF } from '@/lib/downloadUtils'
import { saveAiDocument } from '@/lib/aiDocuments'
import { useDashboard } from '../../context'
import { supabase } from '@/lib/supabase'

// ─── Types ──────────────────────────────────────────────────────────────────

type BayonnomaType =
  | 'kredit' | 'dividend' | 'xarid' | 'sotish'
  | 'tasischichiqish' | 'direktor' | 'boshqa'

type Taasischi = { ism: string; ulush: string }

type CommonForm = {
  bay_raqam: string
  sana: string
  boshlanish_vaqt: string
  tugash_vaqt: string
  joy: string
  yig_tur: 'navbatdagi' | 'navbatdan_tashqari'
  kotib: string
  tasischilar: Taasischi[]
}

type KreditForm = {
  bank_nomi: string; kredit_miqdori: string; kredit_muddat: string
  kredit_foiz: string; imtiyoz_muddat: string; garov_tur: string
  garov_begona: boolean; garov_fio: string; garov_passport: string; garov_manzil: string
}
type DividendForm = {
  dividend_davr: string; dividend_jami: string; dividend_tolov_muddat: string
}
type XaridForm = {
  xarid_nima: string; xarid_narx: string; xarid_sotuvchi: string; xarid_maqsad: string; moliya_manba: string
}
type SotishForm = {
  sotish_nima: string; sotish_inventar: string; sotish_balans: string
  sotish_xaridor: string; sotish_narx: string; sotish_sabab: string; sotish_mablag_maqsad: string
}
type TaasischiChiqishForm = {
  chiquvchi_ism: string; chiquvchi_ulush: string; chiquvchi_qiymat: string; hisobdan_chiqarish: string
}
type DirektorForm = {
  yangi_direktor: string; yangi_direktor_pinfl: string; eski_direktor: string; tayinlanish_sana: string; sabab: string
}
type BoshqaForm = { kun_tartibi: string; qaror: string }

interface Props {
  orgName: string; orgInn: string; direktorName: string
  onSaved?: () => void
}

// ─── Type configs ───────────────────────────────────────────────────────────

const BAYONNOMA_TYPES: { key: BayonnomaType; icon: string; title: string; desc: string }[] = [
  { key: 'kredit',           icon: '🏦', title: 'Kredit olish',                 desc: 'Bank muassasasidan kredit olish to\'g\'risida' },
  { key: 'dividend',         icon: '💰', title: 'Dividend taqsimlash',           desc: 'Foyda (dividend) taqsimlash to\'g\'risida' },
  { key: 'xarid',            icon: '🏗️',  title: 'Katta xarid',                  desc: 'Asosiy vosita yoki qimmat mulk sotib olish' },
  { key: 'sotish',           icon: '📦', title: 'Mulkni sotish',                 desc: 'Balansidagi asosiy vositani yoki mol-mulkni sotish' },
  { key: 'tasischichiqish',  icon: '🚪', title: 'Ta\'sischi chiqib ketishi',      desc: 'Muassisning jamiyatdan chiqib ketishi' },
  { key: 'direktor',         icon: '👤', title: 'Direktor tayinlash',             desc: 'Yangi direktor tayinlash yoki almashtirish' },
  { key: 'boshqa',           icon: '📋', title: 'Boshqa masala',                 desc: 'Erkin shakldagi yig\'ilish bayonnomasi' },
]

const n2w: Record<number, string> = {
  1:'bir',2:'ikki',3:'uch',4:'to\'rt',5:'besh',
  6:'olti',7:'yetti',8:'sakkiz',9:'to\'qiz',10:'o\'n',
}
function numWord(n: number) { return n2w[n] ? `${n} (${n2w[n]})` : String(n) }

function fmtSana(iso: string) {
  if (!iso) return '___'
  const d = new Date(iso)
  const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} yil`
}

function calcDividends(tasischilar: Taasischi[], jami: string): string {
  const total = parseFloat(jami.replace(/[\s,]/g, ''))
  if (!tasischilar.length) return ''
  return tasischilar.map(t => {
    const pct = parseFloat(t.ulush.replace('%', '').trim())
    if (isNaN(total) || isNaN(pct)) return `      — ${t.ism} (${t.ulush}): hisoblab chiqilsin`
    const amount = Math.round(total * pct / 100)
    return `      — ${t.ism} (${t.ulush}): ${amount.toLocaleString('ru-RU')} so'm`
  }).join('\n')
}

// ─── Document generator ──────────────────────────────────────────────────────

function generateText(
  type: BayonnomaType,
  common: CommonForm,
  specific: Record<string, string | boolean>,
  orgName: string, orgInn: string, direktorName: string
): string {
  const sep = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  const sana = fmtSana(common.sana)
  const n = common.tasischilar.length || 1
  const isYagona = n === 1

  const tasischiRoyxat = common.tasischilar.length > 0
    ? common.tasischilar.map((t, i) =>
        isYagona
          ? `   ${i + 1}. ${t.ism} — "${orgName}" yagona ta'sischisi — ulushi: ${t.ulush}`
          : `   ${i + 1}. ${t.ism} — "${orgName}" muassisi (ishtirokchisi) — ulushi: ${t.ulush}`
      ).join('\n')
    : `   1. ${direktorName} — "${orgName}" yagona ta'sischisi — ulushi: 100%`

  const tasischiImzolar = common.tasischilar.length > 0
    ? common.tasischilar.map(t =>
        isYagona
          ? `Yagona ta'sischi:\n_________________ / ${t.ism} /\n"${orgName}" yagona ta'sischisi\n`
          : `Muassis (ishtirokchi):\n_________________ / ${t.ism} /\n"${orgName}" muassisi\n`
      ).join('\n')
    : `Yagona ta'sischi:\n_________________ / ${direktorName} /\n"${orgName}" yagona ta'sischisi\n`

  // Type-specific content
  let kunTartibi = ''
  let muhokama = ''
  let qarorlar = ''
  const masulIjrochi = direktorName
  let muddat = '30 (o\'ttiz) kalendar kun ichida'

  if (type === 'kredit') {
    const k = specific as Record<string, string | boolean>
    const garovText = k.garov_begona
      ? `"${orgName}" muassisi/${k.garov_fio || '___'} ga tegishli ${k.garov_tur || 'mulk'} (pasport: ${k.garov_passport || '___'}, manzil: ${k.garov_manzil || '___'})`
      : `"${orgName}" mulki — ${k.garov_tur || 'ko\'chmas mulk'}`

    kunTartibi = `   1-MODDA: "${orgName}" faoliyatini rivojlantirish va joriy xo'jalik ehtiyojlarini moliyalashtirish maqsadida ${k.bank_nomi || 'bank muassasasi'}dan ${k.kredit_miqdori || '___'} so'm miqdorida kredit (qarz mablag'lari) olish masalasini ko'rib chiqish va tegishli qaror qabul qilish.`

    muhokama = `1-MASALA: "${orgName}" NOMIDAN BANK MUASSASASIDAN KREDIT OLISH TO'G'RISIDA

   MA'RUZA QILDI: ${direktorName} — "${orgName}" Direktori.

   Ma'ruza mazmuni: ${direktorName} yig'ilish ishtirokchilarini kompaniyaning joriy moliyaviy ahvoli va xo'jalik faoliyatini kengaytirish zaruriyati hamda buning uchun bank kreditini jalb qilish borasidagi taklif bilan tanishtirdi. Quyidagi kredit shartlari taklif etildi:

   — Bank: ${k.bank_nomi || '___'}
   — Kredit miqdori: ${k.kredit_miqdori || '___'} so'm
   — Muddat: ${k.kredit_muddat || '___'} yil
   — Yillik foiz stavkasi: ${k.kredit_foiz || '___'}%
   — Imtiyoz muddati: ${k.imtiyoz_muddat ? k.imtiyoz_muddat + ' oy' : 'belgilanmagan'}
   — Garov: ${garovText}

   MUHOKAMADA QATNASHDI: ${common.tasischilar.map(t => t.ism).join(', ') || direktorName} — "${orgName}" muassisi.

   Muassis(lar) ma'ruza mazmunini diqqat bilan tingladi va bank kreditini jalb qilish tashabbusini qo'llab-quvvatlashini bildirdi. Kredit shartnomasini kompaniya manfaatlaridan kelib chiqib, eng qulay shartlarda tuzish zarurligini ta'kidladi.`

    qarorlar = `   1. "${orgName}" (INN: ${orgInn}) tomonidan kompaniyaning ishlab chiqarish va xo'jalik faoliyatini moliyalashtirish maqsadida ${k.bank_nomi || '___'} muassasasidan ${k.kredit_miqdori || '___'} so'm miqdorida, ${k.kredit_muddat || '___'} yil muddatga, yillik ${k.kredit_foiz || '___'}% foiz stavkasi asosida kredit olishga ruxsat berilsin va mazkur qaror tasdiqlansin.

   2. "${orgName}" Direktori ${direktorName}ga quyidagi vakolatlar berilsin:
      a) bank muassasasi bilan kredit shartnomasini tuzish va imzolash;
      b) kredit olish uchun zarur bo'lgan barcha hujjatlarni tayyorlash va taqdim etish;
      v) kredit majburiyatlarini ta'minlash maqsadida ${garovText}ni garovga qo'yish;
      g) kreditga oid barcha qo'shimcha hujjat va bitimlarga imzo chekish.

   3. Kredit bo'yicha olingan mablag'larni tasarruf etish va ulardan maqsadli foydalanishni nazorat qilish Direktorgа yuklatilsin.

   4. Direktor kredit shartnomasi tuzilgandan so'ng muassisni mazkur shartlar to'g'risida xabardor qilsin.`

    muddat = '60 (oltmish) kalendar kun ichida'
  }

  else if (type === 'dividend') {
    const d = specific
    kunTartibi = `   1-MODDA: "${orgName}" ning ${d.dividend_davr || '___'} davridagi toza foydasini (dividend) taqsimlash masalasini ko'rib chiqish va tegishli qaror qabul qilish.`

    muhokama = `1-MASALA: DIVIDEND TAQSIMLASH TO'G'RISIDA

   MA'RUZA QILDI: ${direktorName} — "${orgName}" Direktori.

   Ma'ruza mazmuni: Direktor ${d.dividend_davr || '___'} davrida kompaniya tomonidan olingan toza foyda va uni taqsimlash tartibi haqida yig'ilish ishtirokchilarini xabardor qildi. Taqsimlanishi lozim bo'lgan jami dividend miqdori — ${d.dividend_jami || '___'} so'm. Dividend har bir ishtirokchining ustav kapitalidagi ulushiga mutanosib ravishda taqsimlanishi taklif etildi.

   MUHOKAMADA QATNASHDI: ${common.tasischilar.map(t => t.ism).join(', ') || direktorName} — "${orgName}" muassisi.

   Muassis(lar) taklif etilgan dividend miqdori va taqsimlash tartibini o'rganib, qo'llab-quvvatladi.`

    const dividendRows = common.tasischilar.length > 0
      ? calcDividends(common.tasischilar, d.dividend_jami || '0')
      : `      — ${direktorName} (100%): ${d.dividend_jami || '___'} so'm`

    qarorlar = `   1. "${orgName}" ning ${d.dividend_davr || '___'} davrida olingan toza foydasidan ${d.dividend_jami || '___'} so'm miqdorida dividend taqsimlansin.

   2. Dividend har bir ishtirokchining ustav kapitalidagi ulushiga mutanosib ravishda quyidagicha taqsimlansin:
${dividendRows}

   3. Dividendlar ${d.dividend_tolov_muddat || '30 (o\'ttiz) kalendar kun'} ichida to'liq to'lansin.

   4. Dividendlardan O'zbekiston Respublikasi qonunchiligiga muvofiq (jismoniy shaxslar uchun 5% yoki qo'llaniladigan stavka bo'yicha) soliq ushlab qolinsin va davlat byudjetiga o'tkazilsin.

   5. Dividend to'lovlarini amalga oshirish va soliq hisobotini taqdim etish vakolati Direktorgа yuklatilsin.`
  }

  else if (type === 'xarid') {
    const x = specific
    kunTartibi = `   1-MODDA: "${orgName}" uchun ${x.xarid_nima || '___'} sotib olish masalasini ko'rib chiqish va tegishli qaror qabul qilish.`

    muhokama = `1-MASALA: ${(x.xarid_nima as string || 'MULK').toUpperCase()} SOTIB OLISH TO'G'RISIDA

   MA'RUZA QILDI: ${direktorName} — "${orgName}" Direktori.

   Ma'ruza mazmuni: Direktor kompaniyaning ishlab chiqarish faoliyatini kengaytirish va samaradorligini oshirish maqsadida ${x.xarid_nima || '___'} sotib olish zarurligini asoslab berdi. Sotuvchi: ${x.xarid_sotuvchi || '___'}. Narxi: ${x.xarid_narx || '___'} so'm. Maqsad: ${x.xarid_maqsad || '___'}.

   MUHOKAMADA QATNASHDI: ${common.tasischilar.map(t => t.ism).join(', ') || direktorName} — "${orgName}" muassisi.

   Muassis(lar) taklif etilgan xaridni maqsadga muvofiq deb topdi va qo'llab-quvvatladi.`

    qarorlar = `   1. "${orgName}" tomonidan ${x.xarid_nima || '___'} ${x.xarid_narx || '___'} so'm narxida ${x.xarid_sotuvchi || '___'}dan sotib olinsin.

   2. Sotib olish maqsadi: ${x.xarid_maqsad || '___'}.

   3. Moliyaviy hisob-kitoblar ${x.moliya_manba || "kompaniyaning o'z mablag'lari"} hisobidan amalga oshirilsin.

   4. Mazkur xaridni amalga oshirish uchun zarur bo'lgan barcha hujjatlarni tayyorlash va imzolash vakolati Direktorgа berilsin.

   5. Sotib olingan mulk kompaniya balansiga qabul qilinsin va hisobga olinsin.`
  }

  else if (type === 'sotish') {
    const s = specific
    kunTartibi = `   1-MODDA: "${orgName}" balansidagi ${s.sotish_nima || '___'}ni sotish masalasini ko'rib chiqish va tegishli qaror qabul qilish.`

    muhokama = `1-MASALA: BALANSIDAGI MULKNI SOTISH TO'G'RISIDA

   MA'RUZA QILDI: ${direktorName} — "${orgName}" Direktori.

   Ma'ruza mazmuni: Direktor kompaniya balansida turgan ${s.sotish_nima || '___'} (inventar raqami: ${s.sotish_inventar || '___'}, boshlang'ich balans qiymati: ${s.sotish_balans || '___'} so'm)ni ${s.sotish_sabab || 'eskirganligi sababli'} sotish zarurligi haqida ma'lumo berdi. Xaridor: ${s.sotish_xaridor || '___'}. Sotish narxi: ${s.sotish_narx || '___'} so'm.

   MUHOKAMADA QATNASHDI: ${common.tasischilar.map(t => t.ism).join(', ') || direktorName} — "${orgName}" muassisi.

   Muassis(lar) taklif etilgan sotish shartlarini o'rganib, maqsadga muvofiq deb topdi.`

    qarorlar = `   1. "${orgName}" balansidagi ${s.sotish_nima || '___'} (inventar raqami: ${s.sotish_inventar || '___'}, boshlang'ich balans qiymati: ${s.sotish_balans || '___'} so'm)ni ${s.sotish_narx || '___'} so'm narxida ${s.sotish_xaridor || '___'}ga sotishga ruxsat berilsin.

   2. Sotish sababi: ${s.sotish_sabab || '___'}.

   3. Sotish bitimini rasmiylashtirish, mulkni hisobdan chiqarish va tegishli hujjatlarni imzolash vakolati Direktorgа yuklatilsin.

   4. Sotishdan tushgan ${s.sotish_narx || '___'} so'm miqdoridagi mablag' ${s.sotish_mablag_maqsad || "kompaniyaning joriy xo'jalik faoliyatini moliyalashtirish"} uchun yo'naltirilsin.

   5. Buxgalteriya xizmati sotilgan mulkni belgilangan tartibda balansdan chiqarsin va soliq hisobotini taqdim etsin.`
  }

  else if (type === 'tasischichiqish') {
    const t = specific
    kunTartibi = `   1-MODDA: "${orgName}" muassisi ${t.chiquvchi_ism || '___'}ning jamiyatdan chiqib ketishi va uning ulushini qayta taqsimlash masalasini ko'rib chiqish.`

    muhokama = `1-MASALA: MUASSISNING JAMIYATDAN CHIQIB KETISHI TO'G'RISIDA

   MA'RUZA QILDI: ${direktorName} — "${orgName}" Direktori.

   Ma'ruza mazmuni: "${orgName}" muassisi ${t.chiquvchi_ism || '___'} (ulushi: ${t.chiquvchi_ulush || '___'}%) jamiyatdan o'z ixtiyori bilan chiqib ketish to'g'risida ariza berganligini va uning ulushining qiymati ${t.chiquvchi_qiymat || '___'} so'm ekanligi ma'lum qilindi. Chiqib ketayotgan muassisning ulushini hisobdan chiqarish tartibi: ${t.hisobdan_chiqarish || 'qolgan muassislar o\'rtasida taqsimlash'}.

   MUHOKAMADA QATNASHDI: ${common.tasischilar.filter(ts => ts.ism !== t.chiquvchi_ism).map(ts => ts.ism).join(', ') || 'Boshqa muassislar'}.`

    qarorlar = `   1. "${orgName}" muassisi ${t.chiquvchi_ism || '___'}ning jamiyatdan o'z ixtiyori bilan chiqib ketish arizasi qabul qilinsin va qaror kuchga kirsin.

   2. Chiqib ketayotgan muassisning ustav kapitalidagi ${t.chiquvchi_ulush || '___'}% ulushi (haqiqiy qiymati: ${t.chiquvchi_qiymat || '___'} so'm) — ${t.hisobdan_chiqarish || 'qolgan muassislar o\'rtasida ulushlariga mutanosib taqsimlansin'}.

   3. O'zR MCJ qonunining 26-moddasi asosida ulush qiymati (${t.chiquvchi_qiymat || '___'} so'm) ushbu qaror qabul qilingan sanadan boshlab 3 (uch) oy ichida ${t.chiquvchi_ism || '___'}ga to'liq to'lansin.

   4. Direktorgа quyidagilar yuklatilsin:
      a) ushbu qaror qabul qilingan kundan boshlab 15 (o'n besh) kalendar kun ichida davlat ro'yxatidan o'tkazish organlariga (Adliya vazirligiga) o'zgartirish haqida xabar berish;
      b) ta'sis hujjatlariga (ustav va ta'sis shartnomasiga) tegishli o'zgartirishlar kiritish va qayta ro'yxatdan o'tkazish;
      v) soliq organlariga belgilangan muddatda xabar qilish.`
  }

  else if (type === 'direktor') {
    const d = specific
    kunTartibi = `   1-MODDA: "${orgName}" ning ijro etuvchi organi — Direktori lavozimiga ${d.yangi_direktor || '___'}ni tayinlash masalasini ko'rib chiqish.`

    muhokama = `1-MASALA: YANGI DIREKTOR TAYINLASH TO'G'RISIDA

   MA'RUZA QILDI: ${common.tasischilar[0]?.ism || direktorName} — "${orgName}" muassisi.

   Ma'ruza mazmuni: "${orgName}"da Direktor lavozimini o'zgartirish zarurligi haqida ma'lumot berildi. ${d.sabab ? 'Sabab: ' + d.sabab + '.' : ''} Joriy Direktor ${d.eski_direktor || direktorName} o'rniga ${d.yangi_direktor || '___'}ni tayinlash taklif etildi.

   MUHOKAMADA QATNASHDI: ${common.tasischilar.map(t => t.ism).join(', ') || direktorName}.

   Muassis(lar) taklif qilingan nomzodini o'rganib, lavozimga munosib deb topdi.`

    const tSana = d.tayinlanish_sana ? fmtSana(String(d.tayinlanish_sana)) + 'dan' : 'ushbu qaror qabul qilingan sanadan'
    qarorlar = `   1. "${orgName}" Direktori ${d.eski_direktor || '___'}ning vakolatlari ${tSana} boshlab tugatilsin va lavozimdan ozod qilinsin.

   2. "${orgName}" Direktori lavozimiga ${d.yangi_direktor || '___'}${d.yangi_direktor_pinfl ? ` (JSHSHIR: ${d.yangi_direktor_pinfl})` : ''} ${tSana} boshlab tayinlansin.

   3. Yangi Direktor ${d.yangi_direktor || '___'}ga O'zR qonunchiligi va "${orgName}" Ustavi doirasida kompaniyani boshqarish, manfaatlarini ifodalash va barcha hujjatlarga imzo chekish vakolati to'liq berilsin.

   4. Direktorgа quyidagilar yuklatilsin:
      a) ushbu qaror qabul qilingan kundan boshlab 15 (o'n besh) kalendar kun ichida davlat ro'yxatidan o'tkazish organlariga (Adliya vazirligiga) o'zgartirish haqida xabar berish;
      b) ta'sis hujjatlariga tegishli o'zgartirishlar kiritish va qayta ro'yxatdan o'tkazish;
      v) bank va boshqa tashkilotlarda imzo kartochkalarini yangilash.`
  }

  else {
    // boshqa
    kunTartibi = `   1-MODDA: ${specific.kun_tartibi || '___'}`
    muhokama = `1-MASALA: ${(specific.kun_tartibi as string || '').toUpperCase()}

   MA'RUZA QILDI: ${direktorName} — "${orgName}" Direktori.

   Muhokama mazmuni ko'rib chiqildi va qaror qabul qilindi.

   MUHOKAMADA QATNASHDI: ${common.tasischilar.map(t => t.ism).join(', ') || direktorName}.`

    qarorlar = `   ${specific.qaror || '___'}`
  }

  return `                              BAYONNOMA
                              № ${common.bay_raqam}
   ${sana}
   ${common.joy || '___'}

                        YIG'ILISH BAYONNOMASI

   "${orgName}" (INN: ${orgInn})
   ${isYagona ? "Yagona ta'sischi qarori" : "Muassislar (ishtirokchilar) umumiy yig'ilishi"}

${sep}

                           I. KIRISH QISMI

   ${isYagona ? "Qaror shakli: Yagona ta'sischining yozma qarori" : `Yig'ilish turi: ${common.yig_tur === 'navbatdagi' ? "Navbatdagi umumiy yig'ilish" : "Navbatdan tashqari umumiy yig'ilish"}`}
   O'tkazilish formati: Yuzma-yuz (bevosita ishtirok etish)
   O'tkazilgan joy: ${common.joy || '___'}
   ${isYagona ? 'Qaror sanasi' : "Yig'ilish sanasi"}: ${sana}
   ${isYagona ? '' : `Yig'ilish boshlanish vaqti: soat ${common.boshlanish_vaqt || '10:00'}\n   Yig'ilish tugash vaqti: soat ${common.tugash_vaqt || '11:00'}\n`}
   Raislik qiluvchi: ${direktorName} — "${orgName}" Direktori
   ${isYagona ? '' : `Kotib: ${common.kotib || '___'}\n`}
   ${isYagona ? "Ta'sischi:" : 'Ishtirokchilar tarkibi:\n   Jami yig\'ilishga taklif etilgan: ' + numWord(n) + ' nafar muassis (ishtirokchi)\n   Yig\'ilishda ishtirok etdi: ' + numWord(n) + ' nafar\n   Ishtirok foizi: 100%\n\n   Ishtirokchilar ro\'yxati:'}
${tasischiRoyxat}

   ${isYagona
     ? `Mazkur qaror O'zbekiston Respublikasining 2022 yil 20 oktyabrdagi «Mas'uliyati cheklangan va qo'shimcha mas'uliyatli jamiyatlar to'g'risida»gi Qonuni hamda "${orgName}" Ustaviga muvofiq yagona ta'sischi tomonidan qabul qilinadi.`
     : `Yig'ilish O'zbekiston Respublikasining 2022 yil 20 oktyabrdagi «Mas'uliyati cheklangan va qo'shimcha mas'uliyatli jamiyatlar to'g'risida»gi Qonuni hamda "${orgName}" Ustaviga muvofiq chaqirildi va o'tkazildi.`
   }

   ${isYagona
     ? `Yagona ta'sischi sifatida kompaniya ustav kapitalining 100% ulushiga ega bo'lgan holda qaror qabul qilish vakolatiga ega.`
     : `Kvorumi tekshirildi: Yig'ilishda kompaniya ustav kapitalining 100% ulushini ifodalovchi muassis(lar) ishtirok etmoqda. Yig'ilish vakolatli deb e'tirof etildi.`
   }

${sep}

                          II. KUN TARTIBI

   Yig'ilish raisi ${direktorName} yig'ilishning kun tartibini e'lon qildi:

${kunTartibi}

   Yig'ilish ishtirokchisi kun tartibiga kiritilgan moddani o'rganish va muhokama qilishga rozilik bildirdi.

${sep}

                        III. MUHOKAMA QISMI

   ${muhokama}

                          QAROR QILINDI:

${qarorlar}

   OVOZ BERISH:
   Yoqlab  — ${numWord(n)}
   Qarshi  — 0 (nol)
   Betaraf — 0 (nol)

   Qaror yagona ovoz bilan qabul qilindi.

   Mas'ul ijrochi: ${masulIjrochi} — "${orgName}" Direktori
   Muddat: ${sana}dan boshlab ${muddat}

${sep}

                          IV. YAKUNIY QISM

   Kun tartibidagi barcha masalalar ko'rib chiqildi va tegishli qarorlar qabul qilindi. Qabul qilingan qarorlar O'zbekiston Respublikasining «Mas'uliyati cheklangan va qo'shimcha mas'uliyatli jamiyatlar to'g'risida»gi Qonuniga, O'zbekiston Respublikasi Fuqarolik kodeksiga hamda "${orgName}" Ustaviga muvofiqdir.

   Yig'ilish yopiq deb e'lon qilindi. Bayonnoma imzolandi.

   Yig'ilish tugash vaqti: soat ${common.tugash_vaqt || '11:00'}

${sep}

                            V. IMZOLAR

   Raislik qiluvchi:
   _________________ / ${direktorName} /
   "${orgName}" Direktori

   Kotib:
   _________________ / ${common.kotib || '___'} /

${tasischiImzolar}
   M.O.

   ${common.sana ? new Date(common.sana).getFullYear() + ' yil "' + new Date(common.sana).getDate() + '" ' + ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'][new Date(common.sana).getMonth()] : '____'}

${sep}

   Izoh: Mazkur bayonnoma 2 (ikki) nusxada tuzildi. Har bir nusxa bir xil yuridik kuchga ega. Bayonnomaning bir nusxasi kompaniya arxivida saqlanadi, ikkinchi nusxasi Direktorda qoladi.

   "${orgName}" (INN: ${orgInn})
   ${common.joy || 'Toshkent shahri'}, ${sana}`
}

// ─── Word export ─────────────────────────────────────────────────────────────

async function downloadAsWord(text: string, orgName: string, raqam: string) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, Footer, PageNumber } = await import('docx')
  const F  = 'Times New Roman'
  const NB = { style: BorderStyle.NIL, size: 0, color: 'auto' } as const

  const children = text.split('\n').map(line => {
    const t = line.trim()

    // Ajratuvchi chiziq: ━━━ yoki ---
    if (/^[━─=\-]{3,}$/.test(t)) {
      return new Paragraph({
        spacing: { before: 80, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '888888' } },
        children: [],
      })
    }

    // Bo'sh satr
    if (!t) return new Paragraph({ text: '', spacing: { after: 60 } })

    // Asosiy sarlavha: BAYONNOMA, YIG'ILISH BAYONNOMASI
    if (/^(BAYONNOMA|YIG['']ILISH|MEETING MINUTES)/i.test(t)) {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 80 },
        children: [new TextRun({ text: t, bold: true, underline: { type: 'single' }, size: 28, font: F, color: '000000' })],
      })
    }

    // Rim raqamli bo'lim: "I. ESHITILDI:", "II. QAROR QILINDI:"
    if (/^[IVX]+[\.\)]\s/.test(t)) {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: t, bold: true, underline: { type: 'single' }, size: 24, font: F, color: '000000' })],
      })
    }

    // QAROR QILINDI, OVOZ BERISH, ISHTIROKCHILAR ro'yxati sarlavhasi
    if (/^(QAROR QILINDI|OVOZ BERISH|ISHTIROKCHILAR|KUN TARTIBI|M\.O\.)/.test(t)) {
      return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 160, after: 60 },
        children: [new TextRun({ text: t, bold: true, size: 24, font: F, color: '000000' })],
      })
    }

    // Raqamlangan band: "1.", "2." (bitta raqam)
    if (/^\d+\.\s/.test(t) && !/^\d+\.\d/.test(t)) {
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 360, hanging: 360 },
        spacing: { after: 60, line: 276 },
        children: [new TextRun({ text: t, size: 24, font: F, color: '000000' })],
      })
    }

    // Bullet / dash ro'yxat
    if (/^[-–•]\s/.test(t)) {
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        indent: { left: 360, hanging: 240 },
        spacing: { after: 40, line: 276 },
        children: [new TextRun({ text: `– ${t.replace(/^[-–•]\s*/, '')}`, size: 24, font: F, color: '000000' })],
      })
    }

    // Imzo satri: "Rais: ____________"
    if (/_/.test(t)) {
      return new Paragraph({
        spacing: { after: 60, line: 276 },
        children: [new TextRun({ text: t, size: 24, font: F, color: '000000' })],
      })
    }

    // Oddiy matn
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 60, line: 276 },
      children: [new TextRun({ text: t, size: 24, font: F, color: '000000' })],
    })
  })

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: F, size: 24 }, paragraph: { spacing: { line: 276, after: 60 } } },
      },
    },
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 851 } } },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Kabinetim.uz  |  ', size: 18, font: F, color: 'AAAAAA' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, font: F, color: 'AAAAAA' }),
              new TextRun({ text: ' / ', size: 18, font: F, color: 'AAAAAA' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: F, color: 'AAAAAA' }),
            ],
          })],
        }),
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `Bayonnoma_${raqam || '1'}_${orgName}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BayonnomaMaker({ orgName, orgInn, direktorName, onSaved }: Props) {
  const { activeOrg } = useDashboard()
  const [step, setStep] = useState<'type' | 'form'>('type')
  const [selType, setSelType] = useState<BayonnomaType | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)

  const [common, setCommon] = useState<CommonForm>({
    bay_raqam: '1', sana: new Date().toISOString().split('T')[0],
    boshlanish_vaqt: '10:00', tugash_vaqt: '11:00',
    joy: `"${orgName}" bosh ofisi, Toshkent shahri`,
    yig_tur: 'navbatdagi', kotib: '',
    tasischilar: [{ ism: '', ulush: '100%' }],
  })

  const [kredit, setKredit] = useState<KreditForm>({
    bank_nomi:'', kredit_miqdori:'', kredit_muddat:'', kredit_foiz:'',
    imtiyoz_muddat:'', garov_tur:'ko\'chmas mulk', garov_begona:false,
    garov_fio:'', garov_passport:'', garov_manzil:'',
  })
  const [dividend, setDividend] = useState<DividendForm>({ dividend_davr:'', dividend_jami:'', dividend_tolov_muddat:'30 (o\'ttiz) kun' })
  const [xarid, setXarid] = useState<XaridForm>({ xarid_nima:'', xarid_narx:'', xarid_sotuvchi:'', xarid_maqsad:'', moliya_manba:"kompaniyaning o'z mablag'lari" })
  const [sotish, setSotish] = useState<SotishForm>({ sotish_nima:'', sotish_inventar:'', sotish_balans:'', sotish_xaridor:'', sotish_narx:'', sotish_sabab:'', sotish_mablag_maqsad:"kompaniyaning joriy xo'jalik faoliyatini moliyalashtirish" })
  const [tasischichiqish, setTaasischiChiqish] = useState<TaasischiChiqishForm>({ chiquvchi_ism:'', chiquvchi_ulush:'', chiquvchi_qiymat:'', hisobdan_chiqarish:'qolgan muassislar o\'rtasida ulushlariga mutanosib taqsimlansin' })
  const [direktor, setDirektor] = useState<DirektorForm>({ yangi_direktor:'', yangi_direktor_pinfl:'', eski_direktor: direktorName, tayinlanish_sana:'', sabab:'' })
  const [boshqa, setBoshqa] = useState<BoshqaForm>({ kun_tartibi:'', qaror:'' })

  const [foundersFromDb, setFoundersFromDb] = useState(false)

  // Load founders from Supabase tasischilar table
  useEffect(() => {
    if (!activeOrg) return
    supabase.from('tasischilar').select('full_name, ulush').eq('org_id', activeOrg.id).order('created_at')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCommon(c => ({ ...c, tasischilar: data.map(f => ({ ism: f.full_name, ulush: `${f.ulush}%` })) }))
          setFoundersFromDb(true)
        } else {
          setFoundersFromDb(false)
        }
      })
  }, [activeOrg])

  function updateTaasischi(i: number, field: keyof Taasischi, val: string) {
    setCommon(c => ({ ...c, tasischilar: c.tasischilar.map((t, idx) => idx === i ? { ...t, [field]: val } : t) }))
  }

  function addTaasischi() {
    setCommon(c => ({ ...c, tasischilar: [...c.tasischilar, { ism: '', ulush: '' }] }))
  }

  function removeTaasischi(i: number) {
    setCommon(c => ({ ...c, tasischilar: c.tasischilar.filter((_, idx) => idx !== i) }))
  }

  function getSpecific(): Record<string, string | boolean> {
    if (selType === 'kredit') return kredit as unknown as Record<string, string | boolean>
    if (selType === 'dividend') return dividend as unknown as Record<string, string | boolean>
    if (selType === 'xarid') return xarid as unknown as Record<string, string | boolean>
    if (selType === 'sotish') return sotish as unknown as Record<string, string | boolean>
    if (selType === 'tasischichiqish') return tasischichiqish as unknown as Record<string, string | boolean>
    if (selType === 'direktor') return direktor as unknown as Record<string, string | boolean>
    return boshqa as unknown as Record<string, string | boolean>
  }

  function generate() {
    if (!selType) return
    const text = generateText(selType, common, getSpecific(), orgName, orgInn, direktorName)
    setResult(text)
    if (activeOrg) {
      saveAiDocument({ organization_id: activeOrg.id, section: 'kotiba', feature_key: 'bayonnoma', title: "Yig'ilish bayonnomasi", content: text, meta: {} })
        .then(() => onSaved?.()).catch(console.error)
    }
  }

  const inp = 'w-full bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 placeholder-gray-500'
  const lbl = 'block text-xs text-gray-400 mb-1'
  const sel = `${inp} cursor-pointer`

  // ── Step 1: Type selector ──
  if (step === 'type') return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Yig&apos;ilish turini tanlang:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BAYONNOMA_TYPES.map(t => (
          <button key={t.key} onClick={() => { setSelType(t.key); setStep('form'); setResult(null) }}
            className="bg-[#111827] border border-[#1E293B] hover:border-blue-600/50 hover:bg-[#1F2937] rounded-xl p-4 text-left transition group">
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="text-sm font-semibold text-white group-hover:text-blue-400">{t.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{t.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )

  const typeInfo = BAYONNOMA_TYPES.find(t => t.key === selType)

  // ── Step 2: Form ──
  return (
    <div className="space-y-5">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={() => { setStep('type'); setResult(null) }}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition font-medium">
          ← Orqaga
        </button>
        <div className="w-px h-4 bg-[#1E293B]"/>
        <span className="text-xl">{typeInfo?.icon}</span>
        <span className="font-semibold text-white text-sm">{typeInfo?.title}</span>
      </div>

      {/* ── Common fields ── */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Umumiy ma&apos;lumotlar</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className={lbl}>Bayonnoma №</label>
            <input className={inp} value={common.bay_raqam} onChange={e => setCommon(c => ({ ...c, bay_raqam: e.target.value }))} placeholder="1"/>
          </div>
          <div>
            <label className={lbl}>Yig&apos;ilish sanasi</label>
            <input type="date" className={inp} value={common.sana} onChange={e => setCommon(c => ({ ...c, sana: e.target.value }))}/>
          </div>
          <div>
            <label className={lbl}>Boshlanish vaqti</label>
            <input type="time" className={inp} value={common.boshlanish_vaqt} onChange={e => setCommon(c => ({ ...c, boshlanish_vaqt: e.target.value }))}/>
          </div>
          <div>
            <label className={lbl}>Tugash vaqti</label>
            <input type="time" className={inp} value={common.tugash_vaqt} onChange={e => setCommon(c => ({ ...c, tugash_vaqt: e.target.value }))}/>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className={lbl}>O&apos;tkazilgan joy</label>
            <input className={inp} value={common.joy} onChange={e => setCommon(c => ({ ...c, joy: e.target.value }))} placeholder={`"${orgName}" bosh ofisi, Toshkent shahri`}/>
          </div>
          <div>
            <label className={lbl}>Yig&apos;ilish turi</label>
            <select className={sel} value={common.yig_tur} onChange={e => setCommon(c => ({ ...c, yig_tur: e.target.value as 'navbatdagi' | 'navbatdan_tashqari' }))}>
              <option value="navbatdagi">Navbatdagi</option>
              <option value="navbatdan_tashqari">Navbatdan tashqari</option>
            </select>
          </div>
        </div>
        <div>
          <label className={lbl}>Yig&apos;ilish kotibi</label>
          <input className={inp} value={common.kotib} onChange={e => setCommon(c => ({ ...c, kotib: e.target.value }))} placeholder="Familiya Ism Sharif"/>
        </div>
      </div>

      {/* ── Founders ── */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Ta&apos;sischilar (ishtirokchilar)
            {foundersFromDb
              ? <span className="ml-2 text-emerald-500 font-normal normal-case">✓ Profildan yuklandi</span>
              : <span className="ml-2 text-yellow-600 font-normal normal-case">— Profil → Ta&apos;sischilar bo&apos;limida saqlang</span>
            }
          </div>
          <button type="button" onClick={addTaasischi}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition">
            + Qo&apos;shish
          </button>
        </div>
        {common.tasischilar.map((t, i) => (
          <div key={i} className="flex gap-2 items-center">
            <div className="flex-1">
              <input className={inp} value={t.ism} onChange={e => updateTaasischi(i, 'ism', e.target.value)}
                placeholder="Familiya Ism Sharif"/>
            </div>
            <div className="w-28">
              <input className={inp} value={t.ulush} onChange={e => updateTaasischi(i, 'ulush', e.target.value)}
                placeholder="100%"/>
            </div>
            {common.tasischilar.length > 1 && (
              <button onClick={() => removeTaasischi(i)}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-400 rounded transition text-sm">×</button>
            )}
          </div>
        ))}
        <div className="text-xs text-gray-500">Raislik qiluvchi: <span className="text-gray-400">{direktorName} (avtomatik)</span></div>
      </div>

      {/* ── Type-specific fields ── */}
      {selType === 'kredit' && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kredit ma&apos;lumotlari</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Bank nomi</label>
              <input className={inp} value={kredit.bank_nomi} onChange={e => setKredit(k => ({ ...k, bank_nomi: e.target.value }))} placeholder="Ipoteka-bank, Xalq banki..."/>
            </div>
            <div>
              <label className={lbl}>Kredit miqdori (so&apos;mda)</label>
              <input className={inp} value={kredit.kredit_miqdori} onChange={e => setKredit(k => ({ ...k, kredit_miqdori: e.target.value }))} placeholder="500 000 000"/>
            </div>
            <div>
              <label className={lbl}>Muddat (yil)</label>
              <input className={inp} value={kredit.kredit_muddat} onChange={e => setKredit(k => ({ ...k, kredit_muddat: e.target.value }))} placeholder="3"/>
            </div>
            <div>
              <label className={lbl}>Yillik foiz stavkasi (%)</label>
              <input className={inp} value={kredit.kredit_foiz} onChange={e => setKredit(k => ({ ...k, kredit_foiz: e.target.value }))} placeholder="22"/>
            </div>
            <div>
              <label className={lbl}>Imtiyoz muddati (oy)</label>
              <input className={inp} value={kredit.imtiyoz_muddat} onChange={e => setKredit(k => ({ ...k, imtiyoz_muddat: e.target.value }))} placeholder="6"/>
            </div>
            <div>
              <label className={lbl}>Garov turi</label>
              <select className={sel} value={kredit.garov_tur} onChange={e => setKredit(k => ({ ...k, garov_tur: e.target.value }))}>
                <option>Ko&apos;chmas mulk</option>
                <option>Transport vositasi</option>
                <option>Jihozlar va uskunalar</option>
                <option>Tovar zahirasi</option>
                <option>Kafolat xati</option>
                <option>Boshqa</option>
              </select>
            </div>
          </div>
          {/* Third-party collateral */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={kredit.garov_begona}
              onChange={e => setKredit(k => ({ ...k, garov_begona: e.target.checked }))}
              className="w-4 h-4 rounded accent-blue-600"/>
            <span className="text-sm text-gray-300">Garov boshqa shaxsning mulki</span>
          </label>
          {kredit.garov_begona && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#111827] border border-[#1E293B] rounded-lg p-3">
              <div>
                <label className={lbl}>Garov egasi F.I.Sh.</label>
                <input className={inp} value={kredit.garov_fio} onChange={e => setKredit(k => ({ ...k, garov_fio: e.target.value }))} placeholder="Familiya Ism Sharif"/>
              </div>
              <div>
                <label className={lbl}>Pasport seriya/raqami</label>
                <input className={inp} value={kredit.garov_passport} onChange={e => setKredit(k => ({ ...k, garov_passport: e.target.value }))} placeholder="AB1234567"/>
              </div>
              <div>
                <label className={lbl}>Yashash manzili</label>
                <input className={inp} value={kredit.garov_manzil} onChange={e => setKredit(k => ({ ...k, garov_manzil: e.target.value }))} placeholder="Toshkent sh., ..."/>
              </div>
            </div>
          )}
        </div>
      )}

      {selType === 'dividend' && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dividend ma&apos;lumotlari</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Taqsimlash davri</label>
              <input className={inp} value={dividend.dividend_davr} onChange={e => setDividend(d => ({ ...d, dividend_davr: e.target.value }))} placeholder="2025-yil yillik"/>
            </div>
            <div>
              <label className={lbl}>Jami dividend (so&apos;m)</label>
              <input className={inp} value={dividend.dividend_jami} onChange={e => setDividend(d => ({ ...d, dividend_jami: e.target.value }))} placeholder="100 000 000"/>
            </div>
            <div>
              <label className={lbl}>To&apos;lov muddati</label>
              <input className={inp} value={dividend.dividend_tolov_muddat} onChange={e => setDividend(d => ({ ...d, dividend_tolov_muddat: e.target.value }))} placeholder="30 (o'ttiz) kun"/>
            </div>
          </div>
        </div>
      )}

      {selType === 'xarid' && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Xarid ma&apos;lumotlari</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Nima sotib olinadi</label>
              <input className={inp} value={xarid.xarid_nima} onChange={e => setXarid(x => ({ ...x, xarid_nima: e.target.value }))} placeholder="Yuk mashinasi, dastgoh..."/>
            </div>
            <div>
              <label className={lbl}>Narxi (so&apos;m)</label>
              <input className={inp} value={xarid.xarid_narx} onChange={e => setXarid(x => ({ ...x, xarid_narx: e.target.value }))} placeholder="250 000 000"/>
            </div>
            <div>
              <label className={lbl}>Sotuvchi</label>
              <input className={inp} value={xarid.xarid_sotuvchi} onChange={e => setXarid(x => ({ ...x, xarid_sotuvchi: e.target.value }))} placeholder="Tashkilot nomi yoki FISh"/>
            </div>
            <div>
              <label className={lbl}>Xarid maqsadi</label>
              <input className={inp} value={xarid.xarid_maqsad} onChange={e => setXarid(x => ({ ...x, xarid_maqsad: e.target.value }))} placeholder="Ishlab chiqarishni kengaytirish"/>
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Moliya manbai</label>
              <select className={sel} value={xarid.moliya_manba} onChange={e => setXarid(x => ({ ...x, moliya_manba: e.target.value }))}>
                <option value="kompaniyaning o'z mablag'lari">Kompaniyaning o'z mablag'lari</option>
                <option value="bank krediti mablag'lari">Bank krediti mablag'lari</option>
                <option value="qarz mablag'lari (muassislar qarzlari)">Qarz mablag'lari (muassislar qarzlari)</option>
                <option value="lizing shartnomasi asosida">Lizing shartnomasi asosida</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {selType === 'sotish' && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sotish ma&apos;lumotlari</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Nima sotiladi</label>
              <input className={inp} value={sotish.sotish_nima} onChange={e => setSotish(s => ({ ...s, sotish_nima: e.target.value }))} placeholder="GAZ-3307 yuk mashinasi"/>
            </div>
            <div>
              <label className={lbl}>Inventar raqami</label>
              <input className={inp} value={sotish.sotish_inventar} onChange={e => setSotish(s => ({ ...s, sotish_inventar: e.target.value }))} placeholder="INV-2021-0045"/>
            </div>
            <div>
              <label className={lbl}>Balans qiymati (so&apos;m)</label>
              <input className={inp} value={sotish.sotish_balans} onChange={e => setSotish(s => ({ ...s, sotish_balans: e.target.value }))} placeholder="15 000 000"/>
            </div>
            <div>
              <label className={lbl}>Sotish narxi (so&apos;m)</label>
              <input className={inp} value={sotish.sotish_narx} onChange={e => setSotish(s => ({ ...s, sotish_narx: e.target.value }))} placeholder="20 000 000"/>
            </div>
            <div>
              <label className={lbl}>Xaridor</label>
              <input className={inp} value={sotish.sotish_xaridor} onChange={e => setSotish(s => ({ ...s, sotish_xaridor: e.target.value }))} placeholder="Tashkilot nomi yoki FISh"/>
            </div>
            <div>
              <label className={lbl}>Sotish sababi</label>
              <input className={inp} value={sotish.sotish_sabab} onChange={e => setSotish(s => ({ ...s, sotish_sabab: e.target.value }))} placeholder="Eskirgan, foydalanilmayapti"/>
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Tushgan mablag' qayerga sarflanadi</label>
              <select className={sel} value={sotish.sotish_mablag_maqsad} onChange={e => setSotish(s => ({ ...s, sotish_mablag_maqsad: e.target.value }))}>
                <option value="kompaniyaning joriy xo'jalik faoliyatini moliyalashtirish">Joriy xo'jalik faoliyatini moliyalashtirish</option>
                <option value="bank krediti qarzini to'lash">Bank krediti qarzini to'lash</option>
                <option value="yangi asosiy vosita sotib olish">Yangi asosiy vosita sotib olish</option>
                <option value="ustav kapitalini to'ldirish">Ustav kapitalini to'ldirish</option>
                <option value="muassislarga dividend to'lash">Muassislarga dividend to'lash</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {selType === 'tasischichiqish' && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ta&apos;sischi chiqish ma&apos;lumotlari</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Chiqib ketuvchi ta&apos;sischi</label>
              <input className={inp} value={tasischichiqish.chiquvchi_ism} onChange={e => setTaasischiChiqish(t => ({ ...t, chiquvchi_ism: e.target.value }))} placeholder="Familiya Ism Sharif"/>
            </div>
            <div>
              <label className={lbl}>Ulushi (%)</label>
              <input className={inp} value={tasischichiqish.chiquvchi_ulush} onChange={e => setTaasischiChiqish(t => ({ ...t, chiquvchi_ulush: e.target.value }))} placeholder="50"/>
            </div>
            <div>
              <label className={lbl}>Ulush qiymati (so&apos;m)</label>
              <input className={inp} value={tasischichiqish.chiquvchi_qiymat} onChange={e => setTaasischiChiqish(t => ({ ...t, chiquvchi_qiymat: e.target.value }))} placeholder="50 000 000"/>
            </div>
            <div>
              <label className={lbl}>Hisobdan chiqarish tartibi</label>
              <select className={sel} value={tasischichiqish.hisobdan_chiqarish} onChange={e => setTaasischiChiqish(t => ({ ...t, hisobdan_chiqarish: e.target.value }))}>
                <option value="qolgan muassislar o'rtasida ulushlariga mutanosib taqsimlansin">Qolgan ta&apos;sischilar o&apos;rtasida taqsimlash</option>
                <option value="jamiyat tomonidan sotib olinsin">Jamiyat tomonidan sotib olish</option>
                <option value="uchinchi shaxsga sotilsin">Uchinchi shaxsga sotish</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {selType === 'direktor' && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Direktor tayinlash ma&apos;lumotlari</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Yangi direktor F.I.Sh.</label>
              <input className={inp} value={direktor.yangi_direktor} onChange={e => setDirektor(d => ({ ...d, yangi_direktor: e.target.value }))} placeholder="Familiya Ism Sharif"/>
            </div>
            <div>
              <label className={lbl}>Yangi direktor JSHSHIR (PINFL)</label>
              <input className={inp} value={direktor.yangi_direktor_pinfl} onChange={e => setDirektor(d => ({ ...d, yangi_direktor_pinfl: e.target.value }))} placeholder="30405704070022"/>
            </div>
            <div>
              <label className={lbl}>Eski direktor F.I.Sh.</label>
              <input className={inp} value={direktor.eski_direktor} onChange={e => setDirektor(d => ({ ...d, eski_direktor: e.target.value }))} placeholder={direktorName}/>
            </div>
            <div>
              <label className={lbl}>Tayinlanish sanasi</label>
              <input type="date" className={inp} value={direktor.tayinlanish_sana} onChange={e => setDirektor(d => ({ ...d, tayinlanish_sana: e.target.value }))}/>
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>O&apos;zgartirish sababi</label>
              <input className={inp} value={direktor.sabab} onChange={e => setDirektor(d => ({ ...d, sabab: e.target.value }))} placeholder="O'z ixtiyori bilan bo'shatish talabi bilan"/>
            </div>
          </div>
        </div>
      )}

      {selType === 'boshqa' && (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Masala va qaror</div>
          <div>
            <label className={lbl}>Kun tartibi (masala)</label>
            <textarea className={`${inp} resize-y`} rows={3} value={boshqa.kun_tartibi} onChange={e => setBoshqa(b => ({ ...b, kun_tartibi: e.target.value }))} placeholder="Kompaniya nomini o'zgartirish masalasini ko'rib chiqish..."/>
          </div>
          <div>
            <label className={lbl}>Qabul qilingan qaror</label>
            <textarea className={`${inp} resize-y`} rows={3} value={boshqa.qaror} onChange={e => setBoshqa(b => ({ ...b, qaror: e.target.value }))} placeholder="1. ... tasdiqlansin.\n2. Direktorgа ... yuklatilsin."/>
          </div>
        </div>
      )}

      {/* Generate button */}
      <button onClick={generate}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
        📄 Bayonnomani tayyorlash
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-white flex items-center gap-2">Natija <span className="text-green-400 text-xs bg-green-500/20 border border-green-500/30 px-2 py-0.5 rounded-full">✓ Tayyor</span></span>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setPreview(true)}
                className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg transition">👁 Ko&apos;rish</button>
              <button onClick={() => downloadAsWord(result, orgName, common.bay_raqam)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold transition">📝 Word</button>
              <button onClick={() => downloadTextAsPDF(result, `Bayonnoma №${common.bay_raqam}`)}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition">📄 PDF</button>
              <button onClick={() => navigator.clipboard.writeText(result)}
                className="text-xs bg-[#1F2937] hover:bg-[#111827] border border-[#1E293B] text-gray-400 px-3 py-1.5 rounded-lg transition">📋 Nusxa</button>
            </div>
          </div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 text-xs text-gray-200 whitespace-pre font-mono leading-relaxed max-h-[500px] overflow-y-auto">
            {result}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && result && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(false)}>
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
              <h3 className="font-semibold text-white">Bayonnoma № {common.bay_raqam}</h3>
              <div className="flex gap-2">
                <button onClick={() => downloadAsWord(result, orgName, common.bay_raqam)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition">📝 Word</button>
                <button onClick={() => setPreview(false)} className="text-gray-400 hover:text-white text-xl leading-none transition">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white text-gray-900 rounded-xl p-8 font-serif text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
