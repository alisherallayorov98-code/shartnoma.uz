import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { type, content, lang } = await req.json()

    if (!content || !type) {
      return NextResponse.json({ error: 'content va type kerak' }, { status: 400 })
    }

    const PROMPTS: Record<string, Record<string, string>> = {
      analysis: {
        uz: `Siz O'zbekiston qonunchiligini bilgan yurist yordamchisiz. Quyidagi shartnomani tahlil qiling va JSON formatida javob bering:
{
  "baho": "A/B/C/D (A=a'lo, D=yomon)",
  "umumiy": "1-2 jumlada umumiy xulosa",
  "kuchli_tomonlar": ["..."],
  "zaif_tomonlar": ["..."],
  "yuridik_xatarlar": [{"daraja": "yuqori/o'rta/past", "tavsif": "..."}],
  "tavsiyalar": ["..."],
  "grammatika_xatolari": ["..."]
}
Faqat JSON, boshqa matn yo'q.

SHARTNOMA:
${content}`,

        ru: `Вы юридический ассистент, знающий законодательство Узбекистана. Проанализируйте договор и ответьте в формате JSON:
{
  "baho": "A/B/C/D (A=отлично, D=плохо)",
  "umumiy": "Общий вывод в 1-2 предложениях",
  "kuchli_tomonlar": ["..."],
  "zaif_tomonlar": ["..."],
  "yuridik_xatarlar": [{"daraja": "высокий/средний/низкий", "tavsif": "..."}],
  "tavsiyalar": ["..."],
  "grammatika_xatolari": ["..."]
}
Только JSON, без другого текста.

ДОГОВОР:
${content}`,

        oz: `Сиз Ўзбекистон қонунчилигини билган юрист ёрдамчисисиз. Қуйидаги шартномани таҳлил қилинг ва JSON форматида жавоб беринг:
{
  "baho": "A/B/C/D (A=аъло, D=ёмон)",
  "umumiy": "1-2 жумлада умумий хулоса",
  "kuchli_tomonlar": ["..."],
  "zaif_tomonlar": ["..."],
  "yuridik_xatarlar": [{"daraja": "юқори/ўрта/паст", "tavsif": "..."}],
  "tavsiyalar": ["..."],
  "grammatika_xatolari": ["..."]
}
Фақат JSON, бошқа матн йўқ.

ШАРТНОМА:
${content}`,
      },

      grammar: {
        uz: `Quyidagi shartnoma matnidagi grammatika, imlo va uslub xatolarini toping. JSON formatida:
{
  "xatolar_soni": 5,
  "xatolar": [{"xato": "...", "togri": "...", "izoh": "..."}],
  "umumiy_baho": "Matn sifati haqida qisqacha"
}
Faqat JSON.

MATN:
${content}`,

        ru: `Найдите грамматические, орфографические и стилистические ошибки в следующем тексте договора. Формат JSON:
{
  "xatolar_soni": 5,
  "xatolar": [{"xato": "...", "togri": "...", "izoh": "..."}],
  "umumiy_baho": "Краткая оценка качества текста"
}
Только JSON.

ТЕКСТ:
${content}`,

        oz: `Қуйидаги шартнома матнидаги грамматика, имло ва услуб хатоларини топинг. JSON форматида:
{
  "xatolar_soni": 5,
  "xatolar": [{"xato": "...", "togri": "...", "izoh": "..."}],
  "umumiy_baho": "Матн сифати ҳақида қисқача"
}
Фақат JSON.

МАТН:
${content}`,
      },
    }

    const prompt = PROMPTS[type]?.[lang] || PROMPTS[type]?.['uz']
    if (!prompt) return NextResponse.json({ error: "Noto'g'ri type" }, { status: 400 })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    // JSON ni ajratib olish (ba'zan Claude ```json ... ``` bilan o'raydi)
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/```\s*([\s\S]*?)```/)
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : raw
    const result = JSON.parse(jsonStr)

    return NextResponse.json({ result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Noma\'lum xatolik'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
