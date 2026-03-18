import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Matnni belgilangan uzunlikka qisqartirish
function truncate(text: string, maxChars = 4000): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n...[matn qisqartirildi]'
}

export async function POST(req: NextRequest) {
  try {
    const { type, content, lang } = await req.json()

    if (!content || !type) {
      return NextResponse.json({ error: 'content va type kerak' }, { status: 400 })
    }

    const shortContent = truncate(content)
    const L = lang || 'uz'

    const LABELS: Record<string, Record<string, string>> = {
      uz: {
        grade: "A=alo, B=yaxshi, C=qoniqarli, D=yomon",
        high: "yuqori", mid: "o'rta", low: "past",
        summary: "Qisqa xulosa (1-2 jumla)",
        strong: "Kuchli tomonlar (max 3 ta)",
        weak: "Zaif tomonlar (max 3 ta)",
        risks: "Yuridik xatarlar (max 3 ta)",
        tips: "Tavsiyalar (max 3 ta)",
        grammar: "Grammatika xatolari (max 5 ta)",
        intro: "Siz O'zbekiston qonunchiligini yaxshi biladigan yurist yordamchisiz.",
        doc: "SHARTNOMA",
        docGrammar: "MATN",
        grammarTask: "Quyidagi matnda grammatika, imlo va uslub xatolarini toping.",
        analysisTask: "Quyidagi shartnomani tahlil qiling.",
      },
      ru: {
        grade: "A=отлично, B=хорошо, C=удовлетворительно, D=плохо",
        high: "высокий", mid: "средний", low: "низкий",
        summary: "Краткий вывод (1-2 предложения)",
        strong: "Сильные стороны (макс 3)",
        weak: "Слабые стороны (макс 3)",
        risks: "Юридические риски (макс 3)",
        tips: "Рекомендации (макс 3)",
        grammar: "Грамматические ошибки (макс 5)",
        intro: "Вы юридический ассистент, знающий законодательство Узбекистана.",
        doc: "ДОГОВОР",
        docGrammar: "ТЕКСТ",
        grammarTask: "Найдите грамматические и стилистические ошибки в тексте.",
        analysisTask: "Проанализируйте договор.",
      },
      oz: {
        grade: "A=аъло, B=яхши, C=қониқарли, D=ёмон",
        high: "юқори", mid: "ўрта", low: "паст",
        summary: "Қисқа хулоса (1-2 жумла)",
        strong: "Кучли томонлар (макс 3 та)",
        weak: "Заиф томонлар (макс 3 та)",
        risks: "Юридик хатарлар (макс 3 та)",
        tips: "Тавсиялар (макс 3 та)",
        grammar: "Грамматика хатолари (макс 5 та)",
        intro: "Сиз Ўзбекистон қонунчилигини яхши биладиган юрист ёрдамчисисиз.",
        doc: "ШАРТНОМА",
        docGrammar: "МАТН",
        grammarTask: "Қуйидаги матнда грамматика ва услуб хатоларини топинг.",
        analysisTask: "Қуйидаги шартномани таҳлил қилинг.",
      },
    }

    const lb = LABELS[L] || LABELS['uz']

    const jsonOnly: Record<string, string> = {
      uz: "Faqat JSON qaytaring, boshqa matn bo'lmasin.",
      ru: "Верните только JSON, без другого текста.",
      oz: "Фақат JSON қайтаринг, бошқа матн бўлмасин.",
    }
    const jsonInstr = jsonOnly[L] || jsonOnly['uz']

    let prompt = ''

    if (type === 'analysis') {
      prompt = `${lb.intro} ${lb.analysisTask}

${jsonInstr}
{"baho":"${lb.grade}","umumiy":"${lb.summary}","kuchli_tomonlar":["..."],"zaif_tomonlar":["..."],"yuridik_xatarlar":[{"daraja":"${lb.high}|${lb.mid}|${lb.low}","tavsif":"..."}],"tavsiyalar":["..."],"grammatika_xatolari":["..."]}

${lb.doc}:
${shortContent}`
    } else {
      prompt = `${lb.grammarTask}

${jsonInstr}
{"xatolar_soni":0,"xatolar":[{"xato":"...","togri":"...","izoh":"..."}],"umumiy_baho":"..."}

${lb.docGrammar}:
${shortContent}`
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()

    // JSON ni ajratib olish
    let jsonStr = raw
    const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (fenced) {
      jsonStr = fenced[1].trim()
    } else {
      const start = raw.indexOf('{')
      const end   = raw.lastIndexOf('}')
      if (start !== -1 && end !== -1) jsonStr = raw.slice(start, end + 1)
    }

    const result = JSON.parse(jsonStr)
    return NextResponse.json({ result })

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Noma'lum xatolik"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
