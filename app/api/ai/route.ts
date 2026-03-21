import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function truncate(text: string, max = 4000): string {
  return text.length <= max ? text : text.slice(0, max) + '\n...[qisqartirildi]'
}

function jsonOnly(lang: string) {
  return lang === 'ru' ? 'Верните только JSON, без пояснений.' :
         lang === 'oz' ? 'Фақат JSON қайтаринг.' :
                         "Faqat JSON qaytaring, izohsiz."
}

function repairJSON(str: string): string {
  // Replace literal newlines/carriage-returns inside JSON string values
  let result = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (escaped) { result += ch; escaped = false; continue }
    if (ch === '\\' && inString) { result += ch; escaped = true; continue }
    if (ch === '"') { inString = !inString; result += ch; continue }
    if (inString && (ch === '\n' || ch === '\r')) { result += '\\n'; continue }
    result += ch
  }
  return result
}

function extractJSON(raw: string): unknown {
  let str = raw.trim()
  // Strip opening and closing code fences (handles long content that breaks capturing regex)
  if (str.includes('```')) {
    str = str.replace(/^```(?:json)?\s*\r?\n?/, '').replace(/\r?\n?\s*```\s*$/, '').trim()
  }
  // Find outermost JSON object
  const s = str.indexOf('{'), e = str.lastIndexOf('}')
  if (s !== -1 && e !== -1) str = str.slice(s, e + 1)
  try {
    return JSON.parse(str)
  } catch {
    return JSON.parse(repairJSON(str))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, content, lang = 'uz', question, instruction,
            target_lang, description, details, analysis } = body

    const jOnly = jsonOnly(lang)
    let prompt = ''

    // ── 1. TAHLIL ──────────────────────────────────────────
    if (type === 'analysis') {
      const labels: Record<string, string> = {
        uz: `Siz O'zbekiston qonunchiligini yaxshi biladigan yurist yordamchisiz. Shartnomani tahlil qiling.\n${jOnly}\n{"baho":"A/B/C/D","umumiy":"...","kuchli_tomonlar":["..."],"zaif_tomonlar":["..."],"yuridik_xatarlar":[{"daraja":"yuqori|o'rta|past","tavsif":"..."}],"tavsiyalar":["..."],"grammatika_xatolari":["..."]}`,
        ru: `Вы юридический ассистент по законодательству Узбекистана. Проанализируйте договор.\n${jOnly}\n{"baho":"A/B/C/D","umumiy":"...","kuchli_tomonlar":["..."],"zaif_tomonlar":["..."],"yuridik_xatarlar":[{"daraja":"высокий|средний|низкий","tavsif":"..."}],"tavsiyalar":["..."],"grammatika_xatolari":["..."]}`,
        oz: `Сиз Ўзбекистон қонунчилигини яхши биладиган юрист ёрдамчисисиз.\n${jOnly}\n{"baho":"A/B/C/D","umumiy":"...","kuchli_tomonlar":["..."],"zaif_tomonlar":["..."],"yuridik_xatarlar":[{"daraja":"юқори|ўрта|паст","tavsif":"..."}],"tavsiyalar":["..."],"grammatika_xatolari":["..."]}`,
      }
      prompt = `${labels[lang] || labels['uz']}\n\nSHARTNOMA:\n${truncate(content)}`
    }

    // ── 2. GRAMMATIKA ───────────────────────────────────────
    else if (type === 'grammar') {
      const task = lang === 'ru' ? 'Найдите грамматические и стилистические ошибки.' :
                   lang === 'oz' ? 'Грамматика ва услуб хатоларини топинг.' :
                                   'Grammatika, imlo va uslub xatolarini toping.'
      prompt = `${task}\n${jOnly}\n{"xatolar_soni":0,"xatolar":[{"xato":"...","togri":"...","izoh":"..."}],"umumiy_baho":"..."}\n\nMATN:\n${truncate(content)}`
    }

    // ── 3. XULOSA ───────────────────────────────────────────
    else if (type === 'summary') {
      const task = lang === 'ru' ? 'Напишите краткое резюме договора (5-8 предложений): главные условия, обязательства, сроки, сумма.' :
                   lang === 'oz' ? 'Шартнома мазмунини қисқача баён қилинг (5-8 жумла).' :
                                   "Shartnomaning asosiy shartlarini qisqacha bayon qiling (5-8 jumla): tomonlar, majburiyatlar, muddat, summa."
      prompt = `${task}\n${jOnly}\n{"xulosa":"...","asosiy_shartlar":["..."],"muddat":"...","summa":"...","muhim_bandlar":["..."]}\n\nSHARTNOMA:\n${truncate(content)}`
    }

    // ── 4. TARJIMA ──────────────────────────────────────────
    else if (type === 'translate') {
      const tLang = target_lang || 'ru'
      const targetName: Record<string, string> = { uz: "O'zbek tilida", ru: 'на русском языке', oz: "O'zbek Kirill yozuvida", en: 'in English' }
      const task = lang === 'ru'
        ? `Переведите следующий договор ${targetName[tLang] || tLang}. Переводите юридические термины точно.`
        : lang === 'oz'
        ? `Қуйидаги шартномани ${targetName[tLang] || tLang} таржима қилинг. Юридик атамаларни тўғри таржима қилинг.`
        : `Quyidagi shartnomani ${targetName[tLang] || tLang} tarjima qiling. Yuridik atamalarni to'g'ri tarjima qiling.`
      prompt = `${task}\n${jOnly}\n{"tarjima":"..."}\n\nASL MATN:\n${truncate(content, 3000)}`
    }

    // ── 5. SAVOL-JAVOB ──────────────────────────────────────
    else if (type === 'qa') {
      const task = lang === 'ru' ? `Ответьте на вопрос по договору. Вопрос: "${question}"` :
                   lang === 'oz' ? `Шартнома бўйича саволга жавоб беринг. Савол: "${question}"` :
                                   `Shartnoma bo'yicha savolga javob bering. Savol: "${question}"`
      prompt = `${task}\n${jOnly}\n{"javob":"...","havola":"shartnomaning qaysi bandiga tegishli"}\n\nSHARTNOMA:\n${truncate(content)}`
    }

    // ── 6. BAND QO'SHISH ────────────────────────────────────
    else if (type === 'clause') {
      const task = lang === 'ru' ? `Напишите юридический пункт договора по инструкции: "${instruction}"` :
                   lang === 'oz' ? `Кўрсатма бўйича шартнома банди ёзинг: "${instruction}"` :
                                   `Ko'rsatma asosida shartnoma bandi yozing: "${instruction}"`
      const ctxLabel = lang === 'ru' ? 'Контекст существующего договора:' : lang === 'oz' ? 'Mavjud shartnoma konteksti:' : 'Mavjud shartnoma konteksti:'
      const ctx = content ? `\n\n${ctxLabel}\n${truncate(content, 2000)}` : ''
      prompt = `${task}. O'zbekiston qonunchiligi asosida, rasmiy yuridik uslubda yozing.\n${jOnly}\n{"band":"...","band_nomi":"..."} ${ctx}`
    }

    // ── 7. TUR TAVSIYASI ────────────────────────────────────
    else if (type === 'recommend') {
      const task = lang === 'ru' ? `Определите тип договора по описанию: "${description}"` :
                   lang === 'oz' ? `Таснифни ўқиб, шартнома турини аниқланг: "${description}"` :
                                   `Tavsifni o'qib, qaysi shartnoma turi mos ekanini aniqlang: "${description}"`
      const turlar = lang === 'ru' ? 'Доступные типы: oldi_sotdi, xizmat, ijara, pudrat, qoshimcha, moliyaviy, daval, xalqaro, boshqa' : 'Mavjud turlar: oldi_sotdi, xizmat, ijara, pudrat, qoshimcha, moliyaviy, daval, xalqaro, boshqa'
      prompt = `${task}\n${turlar}\n${jOnly}\n{"tur":"oldi_sotdi","tur_nomi":"...","tavsiya":"...","sabab":"...","qoshimcha_maslahat":"..."}`
    }

    // ── 8. SHARTNOMA YOZISH ─────────────────────────────────
    else if (type === 'write') {
      const task = lang === 'ru'
        ? `Напишите профессиональный договор на основе данных. Тип: ${details?.tur || 'купля-продажа'}, Продавец: ${details?.org || '___'}, Покупатель: ${details?.cp || '___'}, Сумма: ${details?.summa || '___'}, Дополнительно: ${details?.extra || 'нет'}`
        : lang === 'oz'
        ? `Қуйидаги маълумотлар асосида профессионал шартнома матнини ёзинг. Тур: ${details?.tur || 'oldi-sotdi'}, Сотувчи: ${details?.org || '___'}, Харидор: ${details?.cp || '___'}, Сумма: ${details?.summa || '___'}, Қўшимча: ${details?.extra || 'йўқ'}`
        : `Quyidagi ma'lumotlar asosida professional shartnoma matnini yozing. Tur: ${details?.tur || 'oldi-sotdi'}, Sotuvchi: ${details?.org || '___'}, Xaridor: ${details?.cp || '___'}, Summa: ${details?.summa || '___'}, Qo'shimcha: ${details?.extra || 'yo\'q'}`
      prompt = `${task}\n\nO'zbekiston qonunchiligi asosida, rasmiy uslubda, to'liq bandlar bilan yozing.\n${jOnly}\n{"shartnoma":"to'liq shartnoma matni...","bandlar_soni":0}`
    }

    // ── 9. KAMCHILIKLARNI TO'G'IRLASH ──────────────────────
    else if (type === 'fix') {
      const issues = [
        ...(analysis?.zaif_tomonlar || []).map((s: string) => `- Zaif tomonlar: ${s}`),
        ...(analysis?.yuridik_xatarlar || []).map((x: {daraja:string;tavsif:string}) => `- Yuridik xatar [${x.daraja}]: ${x.tavsif}`),
        ...(analysis?.tavsiyalar || []).map((s: string) => `- Tavsiya: ${s}`),
        ...(analysis?.grammatika_xatolari || []).map((s: string) => `- Grammatika xatosi: ${s}`),
      ].join('\n')
      const task = lang === 'ru'
        ? `Улучшите договор, устранив все найденные проблемы. Проблемы:\n${issues}`
        : lang === 'oz'
        ? `Шартномани қуйидаги камчиликларни бартараф қилган ҳолда яхшиланг. Камчиликлар:\n${issues}`
        : `Quyidagi kamchiliklarni bartaraf qilib shartnomani to'g'rilang. Kamchiliklar:\n${issues}`
      prompt = `${task}\n\nO'zbekiston qonunchiligi asosida, rasmiy uslubda, hamma bandlarni saqlab yozing.\n${jOnly}\n{"shartnoma_yangi":"to'liq to'g'irlangan shartnoma...","o_zgartirishlar":["..."]}\n\nASL SHARTNOMA:\n${truncate(content, 3500)}`
    }

    // ── 10. GRAMMATIKA XATOLARINI TO'G'IRLASH ──────────────
    else if (type === 'fix_grammar') {
      const errList = (analysis?.xatolar || [])
        .map((x: {xato:string;togri:string;izoh:string}) => `"${x.xato}" → "${x.togri}" (${x.izoh})`)
        .join('\n')
      const task = lang === 'ru'
        ? `Исправьте следующие грамматические ошибки в тексте, сохраняя официальный стиль:\n${errList}`
        : lang === 'oz'
        ? `Matndagi quyidagi grammatika xatolarini to'g'rilang, rasmiy uslubni saqlang:\n${errList}`
        : `Matndagi quyidagi grammatika xatolarini to'g'rilang, rasmiy uslubni saqlang:\n${errList}`
      prompt = `${task}\n\n${jOnly}\n{"shartnoma_yangi":"to'liq to'g'irlangan matn...","o_zgartirishlar":["..."]}\n\nASL MATN:\n${truncate(content, 3500)}`
    }

    // ── 11. MEHNAT SHARTNOMASI ──────────────────────────────
    else if (type === 'mehnat_shartnoma') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida O'zbekiston Mehnat kodeksiga muvofiq professional mehnat shartnomasi yoki lavozim yo'riqnomasini yozing.\nTashkilot: ${d.tashkilot || '___'}, INN: ${d.tashkilot_inn || '___'}, Direktor: ${d.direktor || '___'}\nXodim: ${d.xodim_ism || d.lavozim || '___'}, Lavozim: ${d.lavozim || '___'}\nMaosh: ${d.maosh || '___'}, Boshlanish: ${d.boshlanish_sana || '___'}\nIsh vaqti: ${d.ish_vaqti || '___'}\nBo'lim: ${d["bo'lim"] || d.bolim || '___'}`
      prompt = `${task}\n\nRasmiy yuridik uslubda to'liq hujjat yozing.\n${jOnly}\n{"shartnoma":"to'liq hujjat matni..."}`
    }

    // ── 12. BUYRUQ ──────────────────────────────────────────
    else if (type === 'buyruq') {
      const d = details || {}
      const tur = d.buyruq_tur || 'qabul'
      const turText = tur === 'qabul' ? 'ishga qabul qilish' : tur === 'boshtash' ? "ishdan bo'shatish" : tur === 'tatil' ? "ta'til berish" : tur
      const task = `Quyidagi ma'lumotlar asosida "${turText}" buyrug'ini rasmiy shakilda yozing.\nTashkilot: ${d.tashkilot || '___'}, Direktor: ${d.direktor || '___'}\nXodim: ${d.xodim_ism || '___'}, Lavozim: ${d.lavozim || '___'}\nBo'lim: ${d["bo'lim"] || d.bolim || '___'}, Maosh: ${d.maosh || '___'}\nSana: ${d.sana || '___'}, Sabab: ${d.sabab || '___'}\nTa'til: ${d.tatil_boshlanish || ''} – ${d.tatil_tugash || ''}, ${d.kunlar_soni || ''} kun`
      prompt = `${task}\n\nO'zbekiston qonunchiligiga muvofiq, buyruq formatida yozing.\n${jOnly}\n{"buyruq":"to'liq buyruq matni..."}`
    }

    // ── 13. ISHONCHNOMA ─────────────────────────────────────
    else if (type === 'ishonchnoma') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida rasmiy ishonchnoma hujjatini yozing.\nIshonchnoma beruvchi: ${d.tashkilot || '___'} (${d.tashkilot_inn || '___'}), Direktor: ${d.direktor || '___'}\nIshonchnoma oluvchi: ${d.oluvchi_ism || '___'}, Pasport: ${d.oluvchi_passport || '___'}\nVakolat mazmuni: ${d.vakolat || '___'}\nAmal qilish muddati: ${d.muddat || '___'}`
      prompt = `${task}\n\nO'zbekiston qonunchiligiga muvofiq, rasmiy ishonchnoma formatida yozing.\n${jOnly}\n{"ishonchnoma":"to'liq ishonchnoma matni..."}`
    }

    // ── 14. DALOLATNOMA ─────────────────────────────────────
    else if (type === 'dalolatnoma') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida ish bajarilganligi to'g'risida dalolatnoma yoki to'lov grafigi tuzing.\nBajaruvchi tashkilot: ${d.tashkilot || '___'} (${d.tashkilot_inn || '___'}), Direktor: ${d.direktor || '___'}\nBank: ${d.bank_name || '___'}, H/R: ${d.bank_account || '___'}\nKontragent: ${d.kontragentar_ism || d.kontragent || '___'}\nXizmat/ish turi: ${d.xizmat_turi || '___'}\nShartnoma raqami: ${d.shartnoma_raqam || '___'}\nSumma: ${d.summa || d.jami_summa || '___'}\nSana: ${d.sana || '___'}\nTo'lov soni: ${d.tolov_soni || '___'}, Boshlanish: ${d.boshlanish_sana || '___'}`
      prompt = `${task}\n\nRasmiy hujjat formatida yozing.\n${jOnly}\n{"dalolatnoma":"to'liq hujjat matni..."}`
    }

    // ── 15. SCHYOT-FAKTURA ──────────────────────────────────
    else if (type === 'schet_faktura') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida schyot-faktura (invoice) tayyorlang.\nSotuvchi: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'}), Direktor: ${d.direktor || '___'}\nBank: ${d.bank_name || '___'}, H/R: ${d.bank_account || '___'}, MFO: ${d.mfo || '___'}\nXaridor: ${d.xaridor || '___'}\nMahsulot/xizmat: ${d.mahsulot_xizmat || '___'}\nMiqdor: ${d.miqdor || '1'}, Narx: ${d.narx || '___'}\nQQS: ${d.qqs || '12'}%\nSana: ${d.sana || '___'}`
      prompt = `${task}\n\nO'zbekiston standartlariga mos schyot-faktura formatida yozing.\n${jOnly}\n{"faktura":"to'liq schyot-faktura matni..."}`
    }

    // ── 16. TALABNOMA ───────────────────────────────────────
    else if (type === 'talabnoma') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida qarz undirish talab xati yoki debitor undirish xatini yozing.\nKreditor: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'}), Direktor: ${d.direktor || '___'}\nQarzdor: ${d.qarzdor || '___'}\nQarz summasi: ${d.qarz_summasi || '___'}\nShartnoma raqami: ${d.shartnoma_raqam || '___'}\nMuddati o'tgan kunlar: ${d.muddat_utgan || '___'}\nKunlik jarima: ${d.jarima_foiz || '0.1'}%\nQarz sababi: ${d.qarz_sababi || '___'}\nOxirgi to'lov muhlati: ${d.oxirgi_muhlat || '___'}\nSud murojaat: ${d.sudga_murojaat || "Agar to'lanmasa, sudga murojaat qilinadi"}`
      prompt = `${task}\n\nO'zbekiston qonunchiligiga muvofiq, rasmiy talab xati formatida yozing.\n${jOnly}\n{"talabnoma":"to'liq talab xati matni..."}`
    }

    // ── KOTIBA AI ────────────────────────────────────────────
    else if (type === 'bayonnoma') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida rasmiy yig'ilish bayonnomasini tayyorla.\nTashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'}), Direktor: ${d.direktor || '___'}\nYig'ilish sanasi: ${d.sana || '___'}\nO'tkazilgan joy: ${d.joyi || '___'}\nRaislik qilgan: ${d.raislik_qilgan || '___'}\nIshtirokchilar: ${d.ishtirokchilar || '___'}\nKun tartibi:\n${d.kun_tartibi || '___'}\nQabul qilingan qarorlar:\n${d.qarorlar || '___'}`
      prompt = `${task}\n\nO'zbekiston Respublikasi standartlariga mos rasmiy bayonnoma formatida yoz. Raqamlash, imzolar joyini qo'sh.\n${jOnly}\n{"bayonnoma":"to'liq bayonnoma matni..."}`
    }

    else if (type === 'rasmiy_xat') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida rasmiy xat tayyorla.\nYuboruvchi tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'}), Direktor: ${d.direktor || '___'}\nKimga: ${d.kim_uchun || '___'}\nMavzu: ${d.mavzu || '___'}\nAsosiy mazmun:\n${d.asosiy_mazmun || '___'}\nJavob muddati: ${d.muddati || 'ko\'rsatilmagan'}`
      prompt = `${task}\n\nO'zbekiston ish yuritish standartlariga mos rasmiy xat formatida yoz. Sana, raqam, imzo joyi bo'lsin.\n${jOnly}\n{"xat":"to'liq xat matni..."}`
    }

    else if (type === 'taklifnoma') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida rasmiy taklifnoma tayyorla.\nYuboruvchi tashkilot: ${d.tashkilot || '___'}, Direktor: ${d.direktor || '___'}\nTabir nomi: ${d.tadbir_nomi || '___'}\nSana va vaqt: ${d.tadbir_sana || '___'}\nJoyi: ${d.tadbir_joyi || '___'}\nKimga yo'llangan: ${d.mehmonga || '___'}\nDastur: ${d.dastur || '___'}`
      prompt = `${task}\n\nRasmiy va iliq uslubda taklifnoma yoz. Sana, imzo joyi bo'lsin.\n${jOnly}\n{"taklifnoma":"to'liq taklifnoma matni..."}`
    }

    else if (type === 'hisobot') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida rasmiy hisobot tayyorla.\nTashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'}), Direktor: ${d.direktor || '___'}\nHisobot turi: ${d.hisobot_turi || '___'}\nDavr: ${d.davr || '___'}\nBajarilgan ishlar:\n${d.bajarilgan_ishlar || '___'}\nMuammolar:\n${d.muammolar || 'yo\'q'}\nKeyingi davr rejalari:\n${d.rejalar || '___'}`
      prompt = `${task}\n\nRasmiy hisobot formatida yoz. Kirish, asosiy qism, xulosa va tavsiyalar bo'lsin.\n${jOnly}\n{"hisobot":"to'liq hisobot matni..."}`
    }

    else if (type === 'eslatma') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida ichki rasmiy eslatma (memo) tayyorla.\nYuboruvchi tashkilot: ${d.tashkilot || '___'}, Direktor/mas'ul: ${d.direktor || '___'}\nKimga: ${d.kimga || '___'}\nMavzu: ${d.mavzu || '___'}\nMatn:\n${d.mazmun || '___'}\nMuddat: ${d.muddat || 'ko\'rsatilmagan'}`
      prompt = `${task}\n\nRasmiy ichki eslatma (memo) formatida yoz. Sana, imzo joyi bo'lsin.\n${jOnly}\n{"eslatma":"to'liq eslatma matni..."}`
    }

    else if (type === 'murojaatnoma') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida rasmiy murojaatnoma yoki ariza tayyorla.\nMurojaat qiluvchi: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'}), Direktor: ${d.direktor || '___'}\nKimga: ${d.kimga || '___'}\nMaqsad: ${d.maqsad || '___'}\nMurojaat mazmuni:\n${d.asosiy_mazmun || '___'}\nKutilayotgan natija: ${d.kutilgan_natija || '___'}`
      prompt = `${task}\n\nO'zbekiston qonunchiligiga mos rasmiy murojaatnoma formatida yoz. Huquqiy asoslar, sana, imzo joyi bo'lsin.\n${jOnly}\n{"murojaatnoma":"to'liq murojaatnoma matni..."}`
    }

    else if (type === 'tushuntirish_xati') {
      const d = details || {}
      const task = `Quyidagi ma'lumotlar asosida rasmiy tushuntirish xati tayyorla.\nTashkilot: ${d.tashkilot || '___'}, Rahbar: ${d.direktor || '___'}\nXodim: ${d.xodim_ism || '___'}, Lavozim: ${d.lavozim || '___'}\nVoqea/holat: ${d.hodisa || '___'}\nSabab:\n${d.sabab || '___'}\nTakrorlanmaslik choralari: ${d.qayta_takrorlanmasligi || 'ko\'rsatilmagan'}`
      prompt = `${task}\n\nRasmiy tushuntirish xati formatida yoz. Sana, imzo joyi bo'lsin.\n${jOnly}\n{"tushuntirish":"to'liq tushuntirish xati matni..."}`
    }

    else {
      return NextResponse.json({ error: "Noto'g'ri type" }, { status: 400 })
    }

    const longTypes = ['write', 'fix', 'fix_grammar', 'mehnat_shartnoma', 'buyruq', 'ishonchnoma', 'dalolatnoma', 'schet_faktura', 'talabnoma', 'bayonnoma', 'rasmiy_xat', 'taklifnoma', 'hisobot', 'eslatma', 'murojaatnoma', 'tushuntirish_xati']
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: longTypes.includes(type) ? 6000 : 3000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const result = extractJSON(raw)
    return NextResponse.json({ result })

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Noma'lum xatolik"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
