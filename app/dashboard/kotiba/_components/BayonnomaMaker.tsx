'use client'

import { useState, useEffect } from 'react'
import { downloadTextAsPDF } from '@/lib/downloadUtils'

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
  xarid_nima: string; xarid_narx: string; xarid_sotuvchi: string; xarid_maqsad: string
}
type SotishForm = {
  sotish_nima: string; sotish_inventar: string; sotish_balans: string
  sotish_xaridor: string; sotish_narx: string; sotish_sabab: string
}
type TaasischiChiqishForm = {
  chiquvchi_ism: string; chiquvchi_ulush: string; chiquvchi_qiymat: string; hisobdan_chiqarish: string
}
type DirektorForm = {
  yangi_direktor: string; eski_direktor: string; tayinlanish_sana: string; sabab: string
}
type BoshqaForm = { kun_tartibi: string; qaror: string }

interface Props {
  orgName: string; orgInn: string; direktorName: string
  onSave?: (text: string) => void
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

  const tasischiRoyxat = common.tasischilar.length > 0
    ? common.tasischilar.map((t, i) =>
        `   ${i + 1}. ${t.ism} — "${orgName}" muassisi (ishtirokchisi) — ulushi: ${t.ulush}`
      ).join('\n')
    : `   1. ${direktorName} — "${orgName}" muassisi (ishtirokchisi) — ulushi: 100%`

  const tasischiImzolar = common.tasischilar.length > 0
    ? common.tasischilar.map(t =>
        `Muassis (ishtirokchi):\n_________________ / ${t.ism} /\n"${orgName}" muassisi\n`
      ).join('\n')
    : `Muassis (ishtirokchi):\n_________________ / ${direktorName} /\n"${orgName}" muassisi\n`

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

    qarorlar = `   1. "${orgName}" (INN: ${orgInn}) tomonidan kompaniyaning ishlab chiqarish va xo'jalik faoliyatini moliyalashtirish maqsadida ${k.bank_nomi || '___'} muassasasidan ${k.kredit_miqdori || '___'} so'm miqdorida, ${k.kredit_muddat || '___'} yil muddatga, yillik ${k.kredit_foiz || '___'}% foiz stavkasi asosida kredit olishga ruxsat berilsin va mazkur qaror maqullansın.

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

    qarorlar = `   1. "${orgName}" ning ${d.dividend_davr || '___'} davrida olingan toza foydasidan ${d.dividend_jami || '___'} so'm miqdorida dividend taqsimlansin.

   2. Dividend har bir ishtirokchining ustav kapitalidagi ulushiga mutanosib ravishda quyidagicha taqsimlansin:\n${common.tasischilar.map(t => `      — ${t.ism} (${t.ulush}): hisoblab chiqilsin`).join('\n') || `      — ${direktorName} (100%): ${d.dividend_jami || '___'} so'm`}

   3. Dividendlar ${d.dividend_tolov_muddat || '30 (o\'ttiz) kalendar kun'} ichida to'liq to'lansin.

   4. Dividendlardan O'zbekiston Respublikasi qonunchiligiga muvofiq soliq ushlab qolinsin.`
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

   3. Mazkur xaridni amalga oshirish uchun zarur bo'lgan barcha hujjatlarni tayyorlash va imzolash vakolati Direktorgа berilsin.

   4. Moliyaviy hisob-kitoblar kompaniyaning joriy mablag'lari hisobidan amalga oshirilsin.`
  }

  else if (type === 'sotish') {
    const s = specific
    kunTartibi = `   1-MODDA: "${orgName}" balansidagi ${s.sotish_nima || '___'}ni sotish masalasini ko'rib chiqish va tegishli qaror qabul qilish.`

    muhokama = `1-MASALA: BALANSIDAGI MULKNI SOTISH TO'G'RISIDA

   MA'RUZA QILDI: ${direktorName} — "${orgName}" Direktori.

   Ma'ruza mazmuni: Direktor kompaniya balansida turgan ${s.sotish_nima || '___'} (inventar raqami: ${s.sotish_inventar || '___'}, boshlang'ich balans qiymati: ${s.sotish_balans || '___'} so'm)ni ${s.sotish_sabab || 'eskirganligi sababli'} sotish zarurligi haqida ma'lumo berdi. Xaridor: ${s.sotish_xaridor || '___'}. Sotish narxi: ${s.sotish_narx || '___'} so'm.

   MUHOKAMADA QATNASHDI: ${common.tasischilar.map(t => t.ism).join(', ') || direktorName} — "${orgName}" muassisi.

   Muassis(lar) taklif etilgan sotish shartlarini o'rganib, maqsadga muvofiq deb topdi.`

    qarorlar = `   1. "${orgName}" balansidagi ${s.sotish_nima || '___'} (inventar raqami: ${s.sotish_inventar || '___'})ni ${s.sotish_narx || '___'} so'm narxida ${s.sotish_xaridor || '___'}ga sotishga ruxsat berilsin.

   2. Sotish sababi: ${s.sotish_sabab || '___'}.

   3. Sotish bitimini rasmiylashtirish va tegishli hujjatlarni imzolash vakolati Direktorgа yuklatilsin.

   4. Sotishdan tushgan mablag'lar kompaniyaning joriy faoliyatini moliyalashtirish uchun ishlatilsin.`
  }

  else if (type === 'tasischichiqish') {
    const t = specific
    kunTartibi = `   1-MODDA: "${orgName}" muassisi ${t.chiquvchi_ism || '___'}ning jamiyatdan chiqib ketishi va uning ulushini qayta taqsimlash masalasini ko'rib chiqish.`

    muhokama = `1-MASALA: MUASSISNING JAMIYATDAN CHIQIB KETISHI TO'G'RISIDA

   MA'RUZA QILDI: ${direktorName} — "${orgName}" Direktori.

   Ma'ruza mazmuni: "${orgName}" muassisi ${t.chiquvchi_ism || '___'} (ulushi: ${t.chiquvchi_ulush || '___'}%) jamiyatdan o'z ixtiyori bilan chiqib ketish to'g'risida ariza berganligini va uning ulushining qiymati ${t.chiquvchi_qiymat || '___'} so'm ekanligi ma'lum qilindi. Chiqib ketayotgan muassisning ulushini hisobdan chiqarish tartibi: ${t.hisobdan_chiqarish || 'qolgan muassislar o\'rtasida taqsimlash'}.

   MUHOKAMADA QATNASHDI: ${common.tasischilar.filter(ts => ts.ism !== t.chiquvchi_ism).map(ts => ts.ism).join(', ') || 'Boshqa muassislar'}.`

    qarorlar = `   1. "${orgName}" muassisi ${t.chiquvchi_ism || '___'}ning jamiyatdan chiqib ketish arizasi qabul qilinsin.

   2. Chiqib ketayotgan muassisning ustav kapitalidagi ${t.chiquvchi_ulush || '___'}% ulushi (qiymati ${t.chiquvchi_qiymat || '___'} so'm) ${t.hisobdan_chiqarish || 'qolgan muassislar o\'rtasida ulushlariga mutanosib taqsimlansin'}.

   3. Direktorgа quyidagilar yuklatilsin:
      a) chiqib ketayotgan muassisga uning ulushi qiymatini belgilangan muddatda to'lash;
      b) ta'sis hujjatlariga tegishli o'zgartirishlar kiritish;
      v) davlat ro'yxatidan o'tkazish organlarga belgilangan tartibda xabar qilish.`
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
    qarorlar = `   1. "${orgName}" Direktori ${d.eski_direktor || '___'}ning vakolatlari ${tSana} boshlab tugatilsin.

   2. "${orgName}" Direktori lavozimiga ${d.yangi_direktor || '___'} ${tSana} boshlab tayinlansin.

   3. Yangi Direktor ${d.yangi_direktor || '___'}ga kompaniyani boshqarish va vakillik qilish bo'yicha to'liq vakolat berilsin.

   4. Ta'sis hujjatlariga tegishli o'zgartirishlar kiritilsin va davlat ro'yxatidan o'tkazish organlariga xabar qilinsin.`
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
   Muassislar (ishtirokchilar) umumiy yig'ilishi

${sep}

                           I. KIRISH QISMI

   Yig'ilish turi: ${common.yig_tur === 'navbatdagi' ? 'Navbatdagi umumiy yig\'ilish' : 'Navbatdan tashqari umumiy yig\'ilish'}
   O'tkazilish formati: Yuzma-yuz (bevosita ishtirok etish)
   O'tkazilgan joy: ${common.joy || '___'}
   Yig'ilish sanasi: ${sana}
   Yig'ilish boshlanish vaqti: soat ${common.boshlanish_vaqt || '10:00'}
   Yig'ilish tugash vaqti: soat ${common.tugash_vaqt || '11:00'}

   Raislik qiluvchi: ${direktorName} — "${orgName}" Direktori
   Kotib: ${common.kotib || '___'}

   Ishtirokchilar tarkibi:
   Jami yig'ilishga taklif etilgan: ${numWord(n)} nafar muassis (ishtirokchi)
   Yig'ilishda ishtirok etdi: ${numWord(n)} nafar
   Ishtirok foizi: 100%

   Ishtirokchilar ro'yxati:
${tasischiRoyxat}

   Yig'ilish O'zbekiston Respublikasining 2022 yil 20 oktyabrdagi «Mas'uliyati cheklangan va qo'shimcha mas'uliyatli jamiyatlar to'g'risida»gi Qonuni hamda "${orgName}" Ustaviga muvofiq chaqirildi va o'tkazildi.

   Kvorumi tekshirildi: Yig'ilishda kompaniya ustav kapitalining 100% ulushini ifodalovchi muassis(lar) ishtirok etmoqda. Yig'ilish vakolatli deb e'tirof etildi.

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
  const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, BorderStyle } = await import('docx')
  const F = 'Times New Roman'
  const lines = text.split('\n')

  const paras = lines.map(line => {
    const trimmed = line.trim()
    const isSep = /^━+$/.test(trimmed)
    const isCenter = /^[IVX]+\.|^BAYONNOMA$|^YIG'ILISH|^QAROR QILINDI|^OVOZ BERISH|^M\.O\.$/.test(trimmed)
    const isBold = /^[IVX]+\. |^QAROR QILINDI|^OVOZ BERISH/.test(trimmed)

    if (isSep) return new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '444444' } },
      children: [],
    })

    return new Paragraph({
      alignment: isCenter ? AlignmentType.CENTER : AlignmentType.BOTH,
      spacing: { after: 80, before: 0 },
      children: [new TextRun({
        text: trimmed,
        bold: isBold || trimmed === 'BAYONNOMA',
        underline: /^[IVX]+\. /.test(trimmed) ? {} : undefined,
        size: 24,
        font: F,
      })],
    })
  })

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1701, right: 850 },
        },
      },
      children: paras,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Bayonnoma_${raqam || '1'}_${orgName}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BayonnomaMaker({ orgName, orgInn, direktorName, onSave }: Props) {
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
  const [xarid, setXarid] = useState<XaridForm>({ xarid_nima:'', xarid_narx:'', xarid_sotuvchi:'', xarid_maqsad:'' })
  const [sotish, setSotish] = useState<SotishForm>({ sotish_nima:'', sotish_inventar:'', sotish_balans:'', sotish_xaridor:'', sotish_narx:'', sotish_sabab:'' })
  const [tasischichiqish, setTaasischiChiqish] = useState<TaasischiChiqishForm>({ chiquvchi_ism:'', chiquvchi_ulush:'', chiquvchi_qiymat:'', hisobdan_chiqarish:'qolgan muassislar o\'rtasida ulushlariga mutanosib taqsimlansin' })
  const [direktor, setDirektor] = useState<DirektorForm>({ yangi_direktor:'', eski_direktor: direktorName, tayinlanish_sana:'', sabab:'' })
  const [boshqa, setBoshqa] = useState<BoshqaForm>({ kun_tartibi:'', qaror:'' })

  // Load saved founders from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tasischilar_${orgInn}`)
      if (saved) {
        const parsed = JSON.parse(saved) as Taasischi[]
        // eslint-disable-next-line
        if (parsed.length > 0) setCommon(c => ({ ...c, tasischilar: parsed }))
      }
    } catch {}
  }, [orgInn])

  function saveTasischilar(list: Taasischi[]) {
    try { localStorage.setItem(`tasischilar_${orgInn}`, JSON.stringify(list)) } catch {}
  }

  function updateTaasischi(i: number, field: keyof Taasischi, val: string) {
    const list = common.tasischilar.map((t, idx) => idx === i ? { ...t, [field]: val } : t)
    setCommon(c => ({ ...c, tasischilar: list }))
    saveTasischilar(list)
  }

  function addTaasischi() {
    const list = [...common.tasischilar, { ism: '', ulush: '' }]
    setCommon(c => ({ ...c, tasischilar: list }))
    saveTasischilar(list)
  }

  function removeTaasischi(i: number) {
    const list = common.tasischilar.filter((_, idx) => idx !== i)
    setCommon(c => ({ ...c, tasischilar: list }))
    saveTasischilar(list)
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
    onSave?.(text)
  }

  const inp = 'w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 placeholder-gray-500'
  const lbl = 'block text-xs text-gray-400 mb-1'
  const sel = `${inp} cursor-pointer`

  // ── Step 1: Type selector ──
  if (step === 'type') return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Yig&apos;ilish turini tanlang:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BAYONNOMA_TYPES.map(t => (
          <button key={t.key} onClick={() => { setSelType(t.key); setStep('form'); setResult(null) }}
            className="bg-gray-800/60 border border-gray-700 hover:border-violet-600 rounded-xl p-4 text-left transition group">
            <div className="text-2xl mb-2">{t.icon}</div>
            <div className="text-sm font-semibold text-white group-hover:text-violet-300">{t.title}</div>
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
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition">
          ← Orqaga
        </button>
        <div className="w-px h-4 bg-gray-700"/>
        <span className="text-xl">{typeInfo?.icon}</span>
        <span className="font-semibold text-white text-sm">{typeInfo?.title}</span>
      </div>

      {/* ── Common fields ── */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Umumiy ma&apos;lumotlar</div>
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
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Ta&apos;sischilar (ishtirokchilar)
            <span className="ml-2 text-gray-600 font-normal normal-case">— LocalStorage'da saqlanadi</span>
          </div>
          <button type="button" onClick={addTaasischi}
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition">
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
        <div className="text-xs text-gray-600">Raislik qiluvchi: <span className="text-gray-400">{direktorName} (avtomatik)</span></div>
      </div>

      {/* ── Type-specific fields ── */}
      {selType === 'kredit' && (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kredit ma&apos;lumotlari</div>
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
              className="w-4 h-4 rounded accent-violet-500"/>
            <span className="text-sm text-gray-300">Garov boshqa shaxsning mulki</span>
          </label>
          {kredit.garov_begona && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-700/30 rounded-lg p-3">
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
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dividend ma&apos;lumotlari</div>
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
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Xarid ma&apos;lumotlari</div>
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
          </div>
        </div>
      )}

      {selType === 'sotish' && (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sotish ma&apos;lumotlari</div>
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
          </div>
        </div>
      )}

      {selType === 'tasischichiqish' && (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ta&apos;sischi chiqish ma&apos;lumotlari</div>
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
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Direktor tayinlash ma&apos;lumotlari</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Yangi direktor F.I.Sh.</label>
              <input className={inp} value={direktor.yangi_direktor} onChange={e => setDirektor(d => ({ ...d, yangi_direktor: e.target.value }))} placeholder="Familiya Ism Sharif"/>
            </div>
            <div>
              <label className={lbl}>Eski direktor F.I.Sh.</label>
              <input className={inp} value={direktor.eski_direktor} onChange={e => setDirektor(d => ({ ...d, eski_direktor: e.target.value }))} placeholder={direktorName}/>
            </div>
            <div>
              <label className={lbl}>Tayinlanish sanasi</label>
              <input type="date" className={inp} value={direktor.tayinlanish_sana} onChange={e => setDirektor(d => ({ ...d, tayinlanish_sana: e.target.value }))}/>
            </div>
            <div>
              <label className={lbl}>O&apos;zgartirish sababi</label>
              <input className={inp} value={direktor.sabab} onChange={e => setDirektor(d => ({ ...d, sabab: e.target.value }))} placeholder="O'z ixtiyori bilan bo'shatish talabi..."/>
            </div>
          </div>
        </div>
      )}

      {selType === 'boshqa' && (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Masala va qaror</div>
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
        className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
        📄 Bayonnomani tayyorlash
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-semibold text-white flex items-center gap-2">Natija: <span className="text-green-400 text-xs">✓ Tayyor</span></span>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setPreview(true)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition">👁 Ko&apos;rish</button>
              <button onClick={() => downloadAsWord(result, orgName, common.bay_raqam)}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold transition">📝 Word</button>
              <button onClick={() => downloadTextAsPDF(result, `Bayonnoma №${common.bay_raqam}`)}
                className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition">📄 PDF</button>
              <button onClick={() => navigator.clipboard.writeText(result)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition">📋 Nusxa</button>
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-xs text-gray-200 whitespace-pre font-mono leading-relaxed max-h-[500px] overflow-y-auto">
            {result}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && result && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h3 className="font-semibold text-white">Bayonnoma № {common.bay_raqam}</h3>
              <div className="flex gap-2">
                <button onClick={() => downloadAsWord(result, orgName, common.bay_raqam)}
                  className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition">📝 Word</button>
                <button onClick={() => setPreview(false)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
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
