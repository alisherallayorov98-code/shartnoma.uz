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

function extractJSON(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  let str = fenced ? fenced[1].trim() : raw.trim()
  const s = str.indexOf('{'), e = str.lastIndexOf('}')
  if (s !== -1 && e !== -1) str = str.slice(s, e + 1)
  return JSON.parse(str)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, content, lang = 'uz', question, instruction,
            target_lang, description, details } = body

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
      const task = `Quyidagi shartnomani ${targetName[tLang] || tLang} tarjima qiling. Yuridik atamalarni to'g'ri tarjima qiling.`
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
      const ctx = content ? `\n\nMavjud shartnoma konteksti:\n${truncate(content, 2000)}` : ''
      prompt = `${task}. O'zbekiston qonunchiligi asosida, rasmiy yuridik uslubda yozing.\n${jOnly}\n{"band":"...","band_nomi":"..."} ${ctx}`
    }

    // ── 7. TUR TAVSIYASI ────────────────────────────────────
    else if (type === 'recommend') {
      const task = lang === 'ru' ? `Определите тип договора по описанию: "${description}"` :
                   lang === 'oz' ? `Таснифни ўқиб, шартнома турини аниқланг: "${description}"` :
                                   `Tavsifni o'qib, qaysi shartnoma turi mos ekanini aniqlang: "${description}"`
      prompt = `${task}\nMavjud turlar: oldi_sotdi, xizmat, ijara, pudrat, qoshimcha, moliyaviy, daval, xalqaro, boshqa\n${jOnly}\n{"tur":"oldi_sotdi","tur_nomi":"...","tavsiya":"...","sabab":"...","qoshimcha_maslahat":"..."}`
    }

    // ── 8. SHARTNOMA YOZISH ─────────────────────────────────
    else if (type === 'write') {
      const task = lang === 'ru'
        ? `Напишите профессиональный договор на основе данных. Тип: ${details?.tur || 'купля-продажа'}, Продавец: ${details?.org || '___'}, Покупатель: ${details?.cp || '___'}, Сумма: ${details?.summa || '___'}, Дополнительно: ${details?.extra || 'нет'}`
        : `Quyidagi ma'lumotlar asosida professional shartnoma matnini yozing. Tur: ${details?.tur || 'oldi-sotdi'}, Sotuvchi: ${details?.org || '___'}, Xaridor: ${details?.cp || '___'}, Summa: ${details?.summa || '___'}, Qo'shimcha: ${details?.extra || 'yo\'q'}`
      prompt = `${task}\n\nO'zbekiston qonunchiligi asosida, rasmiy uslubda, to'liq bandlar bilan yozing.\n${jOnly}\n{"shartnoma":"to'liq shartnoma matni...","bandlar_soni":0}`
    }

    else {
      return NextResponse.json({ error: "Noto'g'ri type" }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
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
