import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { cleanAiText } from '@/lib/export/aiTextProcessor'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Auth + Subscription helpers ───────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SbClient = ReturnType<typeof createClient<any>>

async function verifyUser(req: NextRequest): Promise<{ userId: string; sb: SbClient } | null> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  // Pass user's JWT so RLS applies correctly
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return null
  return { userId: user.id, sb }
}

async function hasActiveAccess(userId: string, sb: SbClient): Promise<boolean> {
  // Admins always have full access
  const { data: admin } = await sb.from('admins').select('id').eq('user_id', userId).maybeSingle()
  if (admin) return true

  // Get user's organizations
  const { data: orgs } = await sb.from('organizations').select('id').eq('user_id', userId)
  if (!orgs?.length) return false
  const orgIds = (orgs as { id: string }[]).map(o => o.id)

  // Active paid subscription?
  const { data: sub } = await sb.from('subscriptions').select('id')
    .in('organization_id', orgIds).eq('is_active', true).neq('plan', 'free')
    .gt('period_end', new Date().toISOString()).limit(1).maybeSingle()
  if (sub) return true

  // Demo access?
  const { data: demo } = await sb.from('demo_access').select('id')
    .in('organization_id', orgIds).eq('is_active', true)
    .gt('expires_at', new Date().toISOString()).limit(1).maybeSingle()
  return !!demo
}

// ── In-memory rate limiter: max 30 req/min per user ──────────────────────────
const _rl = new Map<string, { n: number; reset: number }>()
function checkRate(userId: string): boolean {
  const now = Date.now()
  const e = _rl.get(userId)
  if (!e || now > e.reset) { _rl.set(userId, { n: 1, reset: now + 60_000 }); return true }
  if (e.n >= 30) return false
  e.n++; return true
}

function truncate(text: string, max = 5000): string {
  return text.length <= max ? text : text.slice(0, max) + '\n...[qisqartirildi]'
}

// Prompt injection prevention: strip known injection patterns from user input
function sanitize(val: unknown): string {
  if (typeof val !== 'string') return String(val ?? '')
  return val
    .slice(0, 2000) // per-field limit
    .replace(/\bignore\s+(previous|all|above|prior)\b/gi, '')
    .replace(/\bsystem\s*:/gi, '')
    .replace(/\bassistant\s*:/gi, '')
    .replace(/\buser\s*:/gi, '')
    .replace(/<\|.+?\|>/g, '') // token-like patterns
    .trim()
}

function sanitizeDetails(details: unknown): Record<string, string> {
  if (!details || typeof details !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(details as Record<string, unknown>)) {
    out[k] = sanitize(v)
  }
  return out
}

function jsonOnly(lang: string) {
  return lang === 'ru' ? 'Верните только JSON, без пояснений.' :
         lang === 'oz' ? 'Фақат JSON қайтаринг.' :
                         "Faqat JSON qaytaring, izohsiz."
}

function repairJSON(str: string): string {
  // Escape control characters and fix common issues inside JSON string values
  let result = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    const code = ch.charCodeAt(0)
    if (escaped) { result += ch; escaped = false; continue }
    if (ch === '\\' && inString) { result += ch; escaped = true; continue }
    if (ch === '"') { inString = !inString; result += ch; continue }
    if (inString) {
      if (ch === '\n' || ch === '\r') { result += '\\n'; continue }
      if (ch === '\t') { result += '\\t'; continue }
      if (code < 0x20) { result += `\\u${code.toString(16).padStart(4, '0')}`; continue }
    }
    result += ch
  }
  return result
}

function closeOpenJSON(str: string): string {
  // Try to close truncated JSON by counting open braces/brackets
  const opens: string[] = []
  let inString = false
  let escaped = false
  for (const ch of str) {
    if (escaped) { escaped = false; continue }
    if (ch === '\\' && inString) { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (!inString) {
      if (ch === '{') opens.push('}')
      else if (ch === '[') opens.push(']')
      else if (ch === '}' || ch === ']') opens.pop()
    }
  }
  // Remove trailing incomplete value (comma or open string)
  let closed = str.trimEnd()
  if (closed.endsWith(',')) closed = closed.slice(0, -1)
  return closed + opens.reverse().join('')
}

function extractJSON(raw: string): unknown {
  let str = raw.trim()
  // Strip code fences
  if (str.includes('```')) {
    str = str.replace(/^```(?:json)?\s*\r?\n?/, '').replace(/\r?\n?\s*```\s*$/, '').trim()
  }
  // Find outermost JSON object
  const s = str.indexOf('{'), e = str.lastIndexOf('}')
  if (s !== -1 && e !== -1) str = str.slice(s, e + 1)
  // Attempt 1: direct parse
  try { return JSON.parse(str) } catch { /* continue */ }
  // Attempt 2: repair control chars
  try { return JSON.parse(repairJSON(str)) } catch { /* continue */ }
  // Attempt 3: repair + close truncated JSON
  try { return JSON.parse(closeOpenJSON(repairJSON(str))) } catch { /* continue */ }
  // Attempt 4: close truncated only
  try { return JSON.parse(closeOpenJSON(str)) } catch (e) {
    throw e
  }
}

export const maxDuration = 60

export async function POST(req: NextRequest) {
  // Auth check
  const auth = await verifyUser(req)
  if (!auth) {
    return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 })
  }
  const { userId, sb } = auth

  // Rate limit
  if (!checkRate(userId)) {
    return NextResponse.json({ error: "So'rovlar chegarasidan oshib ketdi. 1 daqiqa kuting." }, { status: 429 })
  }

  // Subscription check — free users cannot use AI
  const canUse = await hasActiveAccess(userId, sb)
  if (!canUse) {
    return NextResponse.json({ error: 'premium_required' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { type, content, lang = 'uz', question, instruction,
            target_lang, description, details: detailsRaw, data: dataRaw, analysis } = body
    const details = sanitizeDetails(detailsRaw || dataRaw)

    const jOnly = jsonOnly(lang)
    let prompt = ''

    // Shared guardian rules (injected into every contract-aware prompt)
    const guardUz = `MUHIM CHEKLOVLAR:
- Shartnomada YO'Q bo'lgan ma'lumotni O'YLAB TOPMANG
- Aniq ko'rsatilmagan summalar, sanalar, tomonlar ismlarini O'ZINGIZDAN QO'SHMANG
- Faqat shartnoma matni asosida ish ko'ring`

    const guardRu = `ВАЖНЫЕ ОГРАНИЧЕНИЯ:
- НЕ ПРИДУМЫВАЙТЕ информацию, которой нет в договоре
- НЕ ДОБАВЛЯЙТЕ от себя суммы, даты, имена сторон, которые не указаны
- Работайте ТОЛЬКО на основе текста договора`

    const guard = lang === 'ru' ? guardRu : guardUz

    // ── 1. TAHLIL ──────────────────────────────────────────
    if (type === 'analysis') {
      const task = lang === 'ru'
        ? `Вы юридический ассистент по законодательству Узбекистана. Проанализируйте договор.\n${guardRu}\n- Указывайте только РЕАЛЬНЫЕ проблемы из текста, не выдумывайте\n- Если проблем нет — поле оставьте пустым массивом`
        : `Siz O'zbekiston qonunchiligini yaxshi biladigan yurist yordamchisiz. Shartnomani tahlil qiling.\n${guardUz}\n- Faqat matnda MAVJUD muammolarni ko'rsating, o'ylab topmang\n- Muammo yo'q bo'lsa — bo'sh massiv qoldiring`
      prompt = `${task}\n${jOnly}\n{"baho":"A/B/C/D","umumiy":"...","kuchli_tomonlar":["..."],"zaif_tomonlar":["..."],"yuridik_xatarlar":[{"daraja":"yuqori|o'rta|past","tavsif":"..."}],"tavsiyalar":["..."],"grammatika_xatolari":["..."]}\n\nSHARTNOMA:\n${truncate(content, 3000)}`
    }

    // ── 2. GRAMMATIKA ───────────────────────────────────────
    else if (type === 'grammar') {
      const task = lang === 'ru'
        ? `Найдите грамматические и стилистические ошибки в тексте.\n${guardRu}\n- Указывайте ТОЛЬКО реальные ошибки из текста\n- Не изменяйте юридическое содержание\n- Если ошибок нет — xatolar_soni: 0, xatolar: []`
        : `Matnda grammatika, imlo va uslub xatolarini toping.\n${guardUz}\n- Faqat matndagi HAQIQIY xatolarni ko'rsating\n- Yuridik mazmunni o'zgartirmang\n- Xato yo'q bo'lsa — xatolar_soni: 0, xatolar: []`
      prompt = `${task}\n${jOnly}\n{"xatolar_soni":0,"xatolar":[{"xato":"...","togri":"...","izoh":"..."}],"umumiy_baho":"..."}\n\nMATN:\n${truncate(content)}`
    }

    // ── 3. XULOSA ───────────────────────────────────────────
    else if (type === 'summary') {
      const task = lang === 'ru'
        ? `Напишите краткое резюме договора (5-8 предложений).\n${guardRu}\n- Указывайте только то, что ЕСТЬ в тексте\n- Если сумма/срок не указаны — пишите "не указано"`
        : `Shartnomaning qisqacha mazmunini yozing (5-8 jumla).\n${guardUz}\n- Faqat matnda BOR narsalarni ko'rsating\n- Summa/muddat ko'rsatilmagan bo'lsa — "ko'rsatilmagan" deb yozing`
      prompt = `${task}\n${jOnly}\n{"xulosa":"...","asosiy_shartlar":["..."],"muddat":"...","summa":"...","muhim_bandlar":["..."]}\n\nSHARTNOMA:\n${truncate(content)}`
    }

    // ── 4. TARJIMA ──────────────────────────────────────────
    else if (type === 'translate') {
      const tLang = target_lang || 'ru'
      const targetName: Record<string, string> = { uz: "O'zbek tilida", ru: 'на русском языке', oz: "O'zbek Kirill yozuvida", en: 'in English' }
      const task = lang === 'ru'
        ? `Переведите договор ${targetName[tLang] || tLang}.\n${guardRu}\n- Переводите ТОЧНО, не добавляйте и не убирайте содержимое\n- Сохраняйте структуру: нумерацию разделов, реквизиты в конце`
        : `Shartnomani ${targetName[tLang] || tLang} tarjima qiling.\n${guardUz}\n- ANIQ tarjima qiling, mazmun qo'shmang va o'chirmang\n- Tuzilmani saqlang: bandlar raqami, oxiridagi rekvizitlar`
      prompt = `${task}\n${jOnly}\n{"tarjima":"..."}\n\nASL MATN:\n${truncate(content, 3000)}`
    }

    // ── 5. SAVOL-JAVOB ──────────────────────────────────────
    else if (type === 'qa') {
      const task = lang === 'ru'
        ? `Ответьте на вопрос ТОЛЬКО на основе текста договора. Вопрос: "${sanitize(question)}"\n${guardRu}\n- Если ответ не содержится в договоре — напишите "Bu shartnomada bu ma'lumot ko'rsatilmagan"\n- Не придумывайте информацию`
        : `Savol: "${sanitize(question)}"\nFaqat shartnoma matni asosida javob bering.\n${guardUz}\n- Javob shartnomada bo'lmasa — "Bu shartnomada bu ma'lumot ko'rsatilmagan" deb yozing\n- Ma'lumot o'ylab topmang`
      prompt = `${task}\n${jOnly}\n{"javob":"...","havola":"shartnomaning qaysi bandiga tegishli"}\n\nSHARTNOMA:\n${truncate(content)}`
    }

    // ── 6. BAND QO'SHISH ────────────────────────────────────
    else if (type === 'clause') {
      const task = lang === 'ru'
        ? `Напишите юридический пункт договора по инструкции: "${sanitize(instruction)}"\n${guardRu}\n- Пункт должен соответствовать стилю и нумерации существующего договора\n- Не противоречьте уже имеющимся пунктам`
        : `Ko'rsatma asosida shartnoma bandi yozing: "${sanitize(instruction)}"\n${guardUz}\n- Band mavjud shartnomaning uslubi va raqamlashiga mos bo'lsin\n- Mavjud bandlarga zid kelmang`
      const ctxLabel = lang === 'ru' ? 'Контекст существующего договора:' : 'Mavjud shartnoma konteksti:'
      const ctx = content ? `\n\n${ctxLabel}\n${truncate(content, 2000)}` : ''
      prompt = `${task}\nO'zbekiston qonunchiligi asosida, rasmiy yuridik uslubda yozing.\n${jOnly}\n{"band":"...","band_nomi":"..."}${ctx}`
    }

    // ── 7. TUR TAVSIYASI ────────────────────────────────────
    else if (type === 'recommend') {
      const task = lang === 'ru'
        ? `Определите тип договора по описанию: "${sanitize(description)}"\nДоступные типы: oldi_sotdi, xizmat, ijara, pudrat, qoshimcha, moliyaviy, daval, xalqaro, boshqa\n- Выбирайте ТОЛЬКО из списка выше\n- Не рекомендуйте несуществующие типы`
        : `Tavsifni o'qib shartnoma turini aniqlang: "${sanitize(description)}"\nMavjud turlar: oldi_sotdi, xizmat, ijara, pudrat, qoshimcha, moliyaviy, daval, xalqaro, boshqa\n- Faqat yuqoridagi ro'yxatdan tanlang\n- Mavjud bo'lmagan turlarni tavsiya etmang`
      prompt = `${task}\n${jOnly}\n{"tur":"oldi_sotdi","tur_nomi":"...","tavsiya":"...","sabab":"...","qoshimcha_maslahat":"..."}`
    }

    // ── 8. SHARTNOMA YOZISH ─────────────────────────────────
    else if (type === 'write') {
      const raqam = details?.shartnoma_raqam ? `№ ${details.shartnoma_raqam}` : '№ ___'
      const sana  = details?.sana || '___'
      const orgBlock = [
        details?.org || '___',
        details?.org_director ? `Direktor: ${details.org_director}` : '',
        details?.org_inn ? `INN: ${details.org_inn}` : '',
        details?.org_bank ? `Bank: ${details.org_bank}` : '',
        details?.org_mfo  ? `MFO: ${details.org_mfo}` : '',
        details?.org_address ? `Manzil: ${details.org_address}` : '',
      ].filter(Boolean).join(', ')
      const cpBlock = [
        details?.cp || '___',
        details?.cp_director ? `Direktor: ${details.cp_director}` : '',
        details?.cp_inn ? `INN: ${details.cp_inn}` : '',
        details?.cp_bank ? `Bank: ${details.cp_bank}` : '',
        details?.cp_mfo  ? `MFO: ${details.cp_mfo}` : '',
        details?.cp_address ? `Manzil: ${details.cp_address}` : '',
      ].filter(Boolean).join(', ')
      const writeRules = lang === 'ru'
        ? `СТРОГИЕ ПРАВИЛА:\n- Используйте ТОЛЬКО предоставленные данные\n- Для незаполненных полей используйте ___\n- НЕ придумывайте реквизиты, суммы, сроки, адреса\n- Реквизиты сторон — ТОЛЬКО в последнем разделе договора`
        : `QATIY QOIDALAR:\n- Faqat BERILGAN ma'lumotlardan foydalaning\n- To'ldirilmagan joylar uchun ___ ishlating\n- Rekvizitlar, summalar, muddatlar, manzillarni O'YLAB TOPMANG\n- Tomonlar rekvizitlari — FAQAT shartnomaning OXIRGI bo'limida`
      const task = lang === 'ru'
        ? `Напишите профессиональный договор. Тип: ${details?.tur || 'купля-продажа'}, Номер: ${raqam}, Дата: ${sana}, Сторона 1: ${orgBlock}, Сторона 2: ${cpBlock}, Сумма: ${details?.summa || '___'}, Дополнительно: ${details?.extra || 'нет'}`
        : `Professional shartnoma yozing. Tur: ${details?.tur || 'oldi-sotdi'}, Raqam: ${raqam}, Sana: ${sana}, 1-tomon: ${orgBlock}, 2-tomon: ${cpBlock}, Summa: ${details?.summa || '___'}, Qo'shimcha: ${details?.extra || 'yo\'q'}`
      prompt = `${task}\n\n${writeRules}\nO'zbekiston qonunchiligi asosida, rasmiy uslubda yozing.\n${jOnly}\n{"shartnoma":"to'liq shartnoma matni...","bandlar_soni":0}`
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
        ? `Улучшите договор, устранив найденные проблемы. Проблемы:\n${issues}`
        : `Quyidagi kamchiliklarni bartaraf qilib shartnomani to'g'rilang:\n${issues}`
      const fixRules = lang === 'ru'
        ? `СТРОГИЕ ПРАВИЛА:\n- НЕ меняйте структуру и нумерацию разделов\n- НЕ удаляйте реквизиты из конца договора\n- НЕ добавляйте реквизиты в начало\n- Исправляйте только перечисленные проблемы`
        : `QATIY QOIDALAR:\n- Bo'limlar tuzilmasi va raqamlarini O'ZGARTIRMANG\n- Oxiridagi rekvizitlarni O'CHIRMANG\n- Boshiga rekvizit QO'SHMANG\n- Faqat ko'rsatilgan muammolarni tuzating`
      prompt = `${task}\n\n${fixRules}\n${jOnly}\n{"shartnoma_yangi":"to'liq to'g'irlangan shartnoma...","o_zgartirishlar":["..."]}\n\nASL SHARTNOMA:\n${truncate(content, 3500)}`
    }

    // ── 10. GRAMMATIKA XATOLARINI TO'G'IRLASH ──────────────
    else if (type === 'fix_grammar') {
      const errList = (analysis?.xatolar || [])
        .map((x: {xato:string;togri:string;izoh:string}) => `"${x.xato}" → "${x.togri}" (${x.izoh})`)
        .join('\n')
      const task = lang === 'ru'
        ? `Исправьте только перечисленные грамматические ошибки, всё остальное оставьте без изменений:\n${errList}`
        : `Faqat quyidagi grammatika xatolarini to'g'rilang, qolganini o'zgartirmang:\n${errList}`
      const fixGramRules = lang === 'ru'
        ? `СТРОГИЕ ПРАВИЛА:\n- Исправляйте ТОЛЬКО перечисленные ошибки\n- НЕ меняйте структуру, юридическое содержание, реквизиты\n- НЕ добавляйте и не убирайте пункты`
        : `QATIY QOIDALAR:\n- FAQAT ko'rsatilgan xatolarni tuzating\n- Tuzilma, yuridik mazmun, rekvizitlarni O'ZGARTIRMANG\n- Bandlar qo'shmang va o'chirmang`
      prompt = `${task}\n\n${fixGramRules}\n${jOnly}\n{"shartnoma_yangi":"to'liq to'g'irlangan matn...","o_zgartirishlar":["..."]}\n\nASL MATN:\n${truncate(content, 3500)}`
    }

    // ── 11. TASHQI SHARTNOMA TUZATISH ──────────────────────
    else if (type === 'tuzatish') {
      const rules = lang === 'ru'
        ? `СТРОГИЕ ПРАВИЛА (нарушение недопустимо):
1. НЕЛЬЗЯ менять структуру договора — порядок разделов, нумерацию пунктов
2. НЕЛЬЗЯ добавлять реквизиты сторон в начало договора — они должны быть ТОЛЬКО в конце
3. НЕЛЬЗЯ удалять раздел реквизитов/подписей в конце договора — сохранить полностью
4. НЕЛЬЗЯ добавлять новые разделы — только исправлять существующие
5. НЕЛЬЗЯ менять названия сторон, суммы, даты — если они уже указаны
6. МОЖНО: исправлять юридические формулировки, грамматику, устранять противоречия внутри существующих пунктов`
        : lang === 'oz'
        ? `QATIY QOIDALAR (buzish mumkin emas):
1. Shartnoma tuzilmasini — bo'limlar tartibini, bandlar raqamlarini O'ZGARTIRMANG
2. Tomonlar rekvizitlarini shartnoma BOSHIGA qo'shmang — ular FAQAT oxirida bo'ladi
3. Shartnoma oxiridagi rekvizitlar/imzolar bo'limini O'CHIRMANG — to'liq saqlang
4. Yangi bo'limlar QO'SHMANG — faqat mavjudlarini tuzating
5. Tomonlar nomlari, summalar, sanalarni O'ZGARTIRMANG — agar allaqachon ko'rsatilgan bo'lsa
6. MUMKIN: yuridik iboralarni, grammatikani tuzatish, mavjud bandlar ichidagi ziddiyatlarni bartaraf etish`
        : `QATIY QOIDALAR (buzish mumkin emas):
1. Shartnoma tuzilmasini — bo'limlar tartibini, bandlar raqamlarini O'ZGARTIRMANG
2. Tomonlar rekvizitlarini shartnoma BOSHIGA qo'shmang — ular FAQAT oxirida bo'ladi
3. Shartnoma oxiridagi rekvizitlar/imzolar bo'limini O'CHIRMANG — to'liq saqlang
4. Yangi bo'limlar QO'SHMANG — faqat mavjudlarini tuzating
5. Tomonlar nomlari, summalar, sanalarni O'ZGARTIRMANG — agar allaqachon ko'rsatilgan bo'lsa
6. MUMKIN: yuridik iboralarni, grammatikani tuzatish, mavjud bandlar ichidagi ziddiyatlarni bartaraf etish`
      const task = lang === 'ru'
        ? `Вы опытный юрист по законодательству Узбекистана. Проанализируйте договор и устраните недостатки, СТРОГО соблюдая правила выше.`
        : `Siz O'zbekiston qonunchiligini yaxshi biladigan tajribali yuristasiz. Shartnomani tahlil qiling va kamchiliklarini bartaraf eting, yuqoridagi QATIY QOIDALARGA rioya qiling.`
      prompt = `${task}\n\n${rules}\n\n${jOnly}\n{"tuzatilgan_shartnoma":"to'liq tuzatilgan matn (tuzilma o'zgarishsiz)...","ozgartirishlar":[{"original":"...","fixed":"...","izoh":"..."}],"ozgartirishlar_soni":5,"umumiy_baho":"..."}\n\nSHARTNOMA:\n${truncate(content, 5000)}`
    }

    // ── 12. MEHNAT SHARTNOMASI ──────────────────────────────
    else if (type === 'mehnat_shartnoma') {
      const d = details || {}
      const isYoriqnoma = d.asosiy_vazifalar || d.talablar  // lavozim yo'riqnomasi uchun
      if (isYoriqnoma) {
        prompt = `Siz O'zbekiston Mehnat kodeksini va kadrlar ish yuritishini mukammal biladigan mutaxasssissiz. Quyidagi ma'lumotlar asosida rasmiy lavozim yo'riqnomasini yarating.

TASHKILOT: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
RAHBAR: ${d.direktor || '___'}
LAVOZIM: ${d.lavozim || '___'}
BO'LIM: ${d["bo'lim"] || d.bolim || '___'}
ASOSIY VAZIFALAR: ${d.asosiy_vazifalar || '___'}
TALABLAR: ${d.talablar || '___'}

MAJBURIY BO'LIMLAR:

1. UMUMIY QOIDALAR
   - Yo'riqnomaning maqsadi va asosi
   - Lavozimga tayinlash/ozod qilish tartibi
   - Bo'ysunish tizimi (kimga hisobot beradi, kimlarni boshqaradi)
   - Lavozim egallab turish davridagi almashtirish tartibi

2. LAVOZIM UCHUN TALABLAR
   - Ta'lim darajasi va ixtisoslik
   - Ish tajribasi talablari
   - Bilim va ko'nikmalar (qonunchilik, dasturlar, tillar)
   - Kasbiy sifatlar

3. ASOSIY VAZIFA VA FUNKSIYALAR (kamida 8-10 ta vazifa ro'yxati)
   Har bir vazifa aniq, o'lchanadigan ko'rinishda

4. HUQUQLAR (kamida 5 ta)
   - Yo'riqnomalar va buyruqlar so'rash huquqi
   - Takliflar kiritish huquqi
   - Zarur ma'lumot va resurslardan foydalanish huquqi

5. JAVOBGARLIK
   - Ish natijalariga javobgarlik
   - Hujjatlar va maxfiylikka javobgarlik
   - Moddiy javobgarlik

6. MEHNAT SHAROITLARI
   - Ish vaqti va joyi
   - Moddiy-texnik ta'minot
   - Xizmat safari va boshqa shartlar

7. YAKUNIY QOIDALAR
   - Yo'riqnomaning kuchga kirish sanasi
   - Qayta ko'rib chiqish muddati

IMZO BLOKI:
Tashkilot rahbari: _________________________ / ${d.direktor || '___'}
Xodim tanishdi: _________________________ / ___
Sana: _______________   M.O.

Rasmiy yuridik uslubda, O'zbekiston Mehnat kodeksiga muvofiq. Kamida 600 so'z.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"shartnoma":"to'liq lavozim yo'riqnomasi matni..."}`
      } else {
        prompt = `Siz O'zbekiston Mehnat kodeksini va kadrlar ish yuritishini mukammal biladigan mutaxasssissiz. Quyidagi ma'lumotlar asosida O'zbekiston Mehnat kodeksiga (2023-yil tahriri) muvofiq to'liq mehnat shartnomasi yarating.

ISH BERUVCHI:
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Rahbar: ${d.direktor || '___'}

XODIM:
Ismi: ${d.xodim_ism || '___'}
Lavozim: ${d.lavozim || '___'}
Bo'lim: ${d["bo'lim"] || d.bolim || "ko'rsatilmagan"}
Maosh: ${d.maosh || '___'} so'm/oyiga
Ish boshlash sanasi: ${d.boshlanish_sana || '___'}
Ish vaqti: ${d.ish_vaqti || "To'liq kunlik, hafta 5 kun"}
Mehnat shartnomasi turi: ${d.mehnat_tur === 'belgilangan_muddatli' ? "Belgilangan muddatli (muddatli)" : d.mehnat_tur === 'yarim_stavkada' ? "Yarim stavkada (part-time)" : d.mehnat_tur === 'masofaviy' ? "Masofaviy ish (remote)" : d.mehnat_tur === 'amaliyot' ? "Amaliyot/Stajyor" : "Belgilanmagan muddatli (doimiy)"}

MAJBURIY BO'LIMLAR:

1. SHARTNOMA PREDMETI — shartnoma turi: "${d.mehnat_tur === 'belgilangan_muddatli' ? 'belgilangan muddatli' : d.mehnat_tur === 'yarim_stavkada' ? 'yarim stavkada' : d.mehnat_tur === 'masofaviy' ? 'masofaviy ish' : d.mehnat_tur === 'amaliyot' ? 'amaliyot/stajyor' : 'belgilanmagan muddatli'}", lavozim, ish joyi, sinov muddati${d.mehnat_tur === 'belgilangan_muddatli' ? ', shartnoma muddati (masalan 1 yil)' : ''}

2. TOMONLARNING HUQUQ VA MAJBURIYATLARI
   XODIM majburiyatlari (kamida 6 ta): mehnat tartibiga rioya, maxfiylik, mulkni asrash, hisobot berish...
   XODIM huquqlari (kamida 5 ta): to'lov, dam olish, himoya, rivojlanish...
   ISH BERUVCHI majburiyatlari (kamida 6 ta): o'z vaqtida to'lash, sharoit yaratish, IHK...
   ISH BERUVCHI huquqlari (kamida 4 ta): topshiriq berish, nazorat, rag'bat/jarima...

3. MEHNAT HAQI VA TO'LOV SHARTLARI
   - Oylik maosh: ${d.maosh || '___'} so'm
   - To'lov sanasi va usuli
   - Mukofot va qo'shimcha to'lovlar tartibi
   - Ish safariga haq to'lash

4. ISH VAQTI VA DAM OLISH
   - Haftalik ish soati
   - Ish kuni boshlanish/tugash vaqti
   - Yillik asosiy ta'til (kamida 21 ish kuni — MK 142-modda)
   - Qo'shimcha ta'tillar

5. IJTIMOIY KAFOLATLAR
   - Mehnat xavfsizligi va sog'liqni saqlash
   - Kasb kasalligi/jarohati holatida kafolat
   - Homilador va emizikli ayollar uchun kafolat (MK)

6. JAVOBGARLIK
   - Xodimning moddiy javobgarligi (MK 200-215-moddalar)
   - Ish beruvchining javobgarligi

7. SHARTNOMANI BEKOR QILISH ASOSLARI
   - Xodim ixtiyori bilan (MK 99-modda)
   - Ish beruvchi ishtiyori bilan (MK 100-modda)
   - Ikki tomonning kelishuviga ko'ra (MK 97-modda)
   - Shartnoma muddati tugaganda

8. BOSHQA SHARTLAR
   - Maxfiylik majburiyati
   - Raqobatsizlik kelishuvlari (agar zarur)
   - Nizolarni hal qilish tartibi

9. TOMONLARNING REKVIZITLARI VA IMZOLARI
   Ish beruvchi rekvizitlari to'liq bloki
   Xodim ma'lumotlari bloki
   Imzo joylari: Ish beruvchi ___/___ va Xodim ___/___
   Sana: _______________   M.O.

Yuridik uslubda, Mehnat kodeksi moddalariga havolalar bilan. Kamida 700 so'z.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"shartnoma":"to'liq mehnat shartnomasi matni..."}`
      }
    }

    // ── 12. BUYRUQ ──────────────────────────────────────────
    else if (type === 'buyruq') {
      const d = details || {}
      const tur = d.buyruq_tur || 'qabul'
      const turText = tur === 'qabul' ? 'ishga qabul qilish' : tur === 'boshtash' ? "ishdan bo'shatish" : tur === 'tatil' ? "ta'til berish" : tur

      const turContent: Record<string, string> = {
        qabul: `BUYRUQ TARKIBI (qabul):
1. SARLAVHA: "${d.tashkilot || '___'}" BUYRUG'I  № ___
   Sana: ${d.sana || '___'}   Shahar/tuman: ___

2. ASOSI: O'zbekiston Respublikasi Mehnat kodeksining 80-86-moddalariga muvofiq va xodimning arizada bildirgan xohishiga ko'ra

3. BUYURAMAN:
   1. Qabul qilish: ${d.xodim_ism || '___'} "${d["bo'lim"] || d.bolim || '___'}ga" "${d.lavozim || '___'}" lavozimiga ${d.sana || '___'} sanadan boshlab qabul qilinsin.
   2. Maosh belgilansin: oyiga ${d.maosh || '___'} so'm.
   3. Sinov muddati belgilansin: 3 (uch) oy.
   4. Mehnat shartnomasi tuzilsin: belgilanmagan muddatga.
   5. Kadrlar bo'limiga topshirilsin: xodim bilan mehnat shartnomasi tuzish, shaxsiy ish yuritish, IHK kiritish.
   6. Buxgalteriya bo'limiga topshirilsin: maosh hisoblash tizimiga kiritish.

4. NAZORAT: Ushbu buyruqning bajarilishi ustidan nazorat kadrlar bo'limiga yuklatilsin.

5. IMZO:
   Direktor: _________________________ / ${d.direktor || '___'}
   M.O.   Sana: _______________
   Buyruq bilan tanishdi: _________________________ / ${d.xodim_ism || '___'}   Sana: ___`,

        boshtash: `BUYRUQ TARKIBI (bo'shatish):
1. SARLAVHA: "${d.tashkilot || '___'}" BUYRUG'I  № ___
   Sana: ${d.sana || '___'}   Shahar/tuman: ___

2. ASOSI: O'zbekiston Respublikasi Mehnat kodeksining ${d.sabab === "O'z ixtiyori bilan" ? "99-moddasi" : "100-moddasi"} va xodimning ${d.sana || '___'} sanali arizasiga ko'ra

3. BUYURAMAN:
   1. Ishdan bo'shatilsin: ${d.xodim_ism || '___'}, "${d.lavozim || '___'}" lavozimidagi xodim ${d.sana || '___'} sanadan boshlab ishdan bo'shatilsin.
   2. Sabab: ${d.sabab || "O'z ixtiyori bilan"} (MK ___ modda).
   3. Oxirgi ish kuni ${d.sana || '___'} sanasi hisoblansin.
   4. Buxgalteriya bo'limiga topshirilsin: oxirgi ish kunida to'liq hisob-kitob qilinsin (belgilanmagan mehnat ta'til kompensatsiyasi, ish haqi qoldig'i).
   5. Kadrlar bo'limiga topshirilsin: mehnat daftarchasiga yozuv kiritish, shaxsiy ish yuritishni yopish.
   6. IT bo'limiga topshirilsin: tizimdan kirish huquqlarini olib qo'yish.

4. ASOSIY HUJJATLAR: Xodimning arizada bildirgan xohishi, mehnat shartnomasi ___ raqamli.

5. IMZO:
   Direktor: _________________________ / ${d.direktor || '___'}
   M.O.   Sana: _______________
   Buyruq bilan tanishdi: _________________________ / ${d.xodim_ism || '___'}   Sana: ___`,

        tatil: `BUYRUQ TARKIBI (ta'til):
1. SARLAVHA: "${d.tashkilot || '___'}" BUYRUG'I  № ___
   Sana: _______________   Shahar/tuman: ___

2. ASOSI: O'zbekiston Respublikasi Mehnat kodeksining 134-148-moddalariga muvofiq va xodimning arizasiga ko'ra

3. BUYURAMAN:
   1. Ta'til berilsin: ${d.xodim_ism || '___'}, "${d.lavozim || '___'}" lavozimidagi xodimga:
      - Ta'til turi: yillik asosiy haq to'lanadigan ta'til
      - Boshlanish sanasi: ${d.tatil_boshlanish || '___'}
      - Tugash sanasi: ${d.tatil_tugash || '___'}
      - Ta'til muddati: ${d.kunlar_soni || '___'} kalendar kun
   2. Buxgalteriya bo'limiga topshirilsin: ta'til pulini ta'til boshlanishidan kamida 3 kun oldin to'liq to'lash.
   3. Kadrlar bo'limiga topshirilsin: ta'til jadvaliga belgi qo'yish, shaxsiy kartaga yozuv kiritish.
   4. Xodimning ish o'rnini almashtirishni tashkil etilsin: ___ xodimga yuklatilsin.

4. NAZORAT: Ushbu buyruqning bajarilishi bo'lim boshlig'iga yuklatilsin.

5. IMZO:
   Direktor: _________________________ / ${d.direktor || '___'}
   M.O.   Sana: _______________
   Buyruq bilan tanishdi: _________________________ / ${d.xodim_ism || '___'}   Sana: ___`
      }

      prompt = `Siz O'zbekiston Mehnat kodeksini mukammal biladigan kadrlar bo'limi mutaxasssissiz. Quyidagi ma'lumotlar asosida "${turText}" bo'yicha rasmiy buyruq yarating.

TASHKILOT: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
RAHBAR: ${d.direktor || '___'}
XODIM: ${d.xodim_ism || '___'}
LAVOZIM: ${d.lavozim || '___'}
BO'LIM: ${d["bo'lim"] || d.bolim || '___'}
MAOSH: ${d.maosh || '___'}
SANA: ${d.sana || '___'}
SABAB: ${d.sabab || '___'}
${tur === 'tatil' ? `TA'TIL: ${d.tatil_boshlanish || '___'} – ${d.tatil_tugash || '___'}, ${d.kunlar_soni || '___'} kun` : ''}

${turContent[tur] || turContent['qabul']}

Buyruq to'liq, rasmiy, O'zbekiston Mehnat kodeksiga muvofiq bo'lsin. Barcha moddalar to'g'ri ko'rsatilsin.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"buyruq":"to'liq buyruq matni..."}`
    }

    // ── 13. ISHONCHNOMA ─────────────────────────────────────
    else if (type === 'ishonchnoma') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi fuqarolik qonunchiligini mukammal biladigan yurist-mutaxasssissiz. Quyidagi ma'lumotlar asosida rasmiy ishonchnoma yarating.

ISHONCHNOMA BERUVCHI (VAKILLATUVCHI):
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Tashkilot rahbari: ${d.direktor || '___'}
${d.tashkilot_manzil ? `Manzil: ${d.tashkilot_manzil}` : ''}

ISHONCHNOMA OLUVCHI (VAKIL):
Ismi: ${d.oluvchi_ism || '___'}
Pasport: ${d.oluvchi_passport || '___'}
${d.oluvchi_manzil ? `Yashash manzili: ${d.oluvchi_manzil}` : ''}

VAKOLAT MAZMUNI: ${d.vakolat || '___'}
AMAL QILISH MUDDATI: ${d.muddat || '1 yil'}

MAJBURIY TUZILMA:

1. SARLAVHA (markazda):
   ISHONCHNOMA
   ${d.tashkilot || '___'} shahar/tuman, ${new Date().getFullYear()}-yil "_____" ___________

2. VAKILLATUVCHI BLOKI:
   "${d.tashkilot || '___'}", INN: ${d.tashkilot_inn || '___'}, keyingi o'rinlarda "Tashkilot" deb yuritilib, uning nomidan rahbar ${d.direktor || '___'}, ${new Date().getFullYear()}-yil ___ raqamli Ustav asosida ish ko'rib, ushbu ishonchnomani berdi:

3. VAKIL BLOKI:
   Fuqaro ${d.oluvchi_ism || '___'}, pasport seriyasi va raqami: ${d.oluvchi_passport || '___'}, (pasport berilgan sana: ___, kim tomonidan: ___), yashash manzili: ___.

4. VAKOLATLAR RO'YXATI (batafsil, kamida 5-8 ta vakolat):
   Yuqorida ko'rsatilgan vakolat asosida vakil quyidagi harakatlarni amalga oshirishga vakolatli:
   1. ${d.vakolat || '___'} munosabatida tashkilot nomidan ish yuritish;
   2. Tegishli tashkilot/muassasalarga hujjatlar topshirish va qabul qilish;
   3. Zarur arizalar, bildirishnomalar, shartnomalar imzolash;
   4. Rasmiy munosabat bo'yicha to'lovlarni amalga oshirish;
   5. Ushbu ishonchnoma bilan bog'liq barcha zarur hujjatlarni imzolash;
   6. [Boshqa tegishli vakolatlar]

5. MUDDATI:
   Ushbu ishonchnoma ${d.muddat || '1 (bir) yil'} muddatga berilgan bo'lib, ${new Date().getFullYear()}-yil "_____" ___________ sanadan kuchga kiradi.

6. QAYTA ISHONCHNOMA BERISH:
   Vakil qayta ishonchnoma berish huquqiga ega emas / ega.

7. IMZO VA TASDIQLASH:
   ${d.tashkilot || '___'} rahbari:  _________________________ / ${d.direktor || '___'}
   M.O.   Sana: _______________

   Notarial tasdiqlash (agar zarur): _______________

Rasmiy O'zbek tilida, FKning 126-134-moddalariga muvofiq. Hujjat to'liq va huquqiy jihatdan to'g'ri bo'lsin.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"ishonchnoma":"to'liq ishonchnoma matni..."}`
    }

    // ── 14. DALOLATNOMA ─────────────────────────────────────
    else if (type === 'dalolatnoma') {
      const d = details || {}
      const isTolovGrafigi = d.tolov_soni || d.tolov_turi  // to'lov grafigi uchun

      if (isTolovGrafigi) {
        const boshSana = d.boshlanish_sana || '___'
        const jamiSumma = parseFloat((d.jami_summa || '0').replace(/\s/g, '')) || 0
        const tolovSoni = parseInt(d.tolov_soni || '1') || 1
        const oylikTolov = jamiSumma > 0 ? Math.round(jamiSumma / tolovSoni).toLocaleString('uz-UZ') : '___'

        prompt = `Siz moliyaviy-buxgalteriya hujjatlashtirish mutaxasssissiz. Quyidagi ma'lumotlar asosida rasmiy to'lov grafigini yarating.

TASHKILOT (KREDITOR): ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
RAHBAR: ${d.direktor || '___'}
KONTRAGENT (QARZDOR): ${d.kontragent || d.kontragentar_ism || '___'}
JAMI SUMMA: ${d.jami_summa || '___'} so'm
TO'LOVLAR SONI: ${tolovSoni}
BIRINCHI TO'LOV: ${boshSana}
TO'LOV TURI: ${d.tolov_turi || "Oylik teng to'lovlar"}
SHARTNOMA: ${d.shartnoma_raqam || '___'}

TO'LOV GRAFIGI TUZILMASI:

1. SARLAVHA:
   TO'LOV GRAFIGI
   ${d.shartnoma_raqam || '___'} raqamli shartnomaga ilova
   Sana: _______________

2. TOMONLAR:
   Kreditor: ${d.tashkilot || '___'}, INN: ${d.tashkilot_inn || '___'}
   Qarzdor: ${d.kontragent || d.kontragentar_ism || '___'}
   Jami summa: ${d.jami_summa || '___'} so'm

3. JADVAL (${tolovSoni} qator):
   | № | To'lov sanasi | To'lov miqdori | Asosiy qarz | QQS | Holat |
   ${Array.from({length: tolovSoni}, (_, i) => `| ${i+1} | ${boshSana !== '___' ? `${i+1}-oy` : '___'} | ${oylikTolov} so'm | ___ | ___ | Kutilmoqda |`).join('\n   ')}
   | JAMI | | ${d.jami_summa || '___'} so'm | | | |

4. SHARTLAR:
   - To'lov usuli: bank o'tkazmasi
   - To'lov valyutasi: O'zbek so'mi
   - Kechiktirilgan to'lov uchun jarima: kuniga 0.1%
   - Muddatidan oldin to'lash mumkin

5. IMZOLAR:
   Kreditor: _________________________ / ${d.direktor || '___'}  M.O.
   Qarzdor: _________________________  M.O.
   Sana: _______________

\nMUHIM: Faqat berilgan raqamlar bilan hisoblang. Summalarni o'ylab topmang. Ko'rsatilmagan joylar uchun ___ ishlating. Hisob-kitoblarni aniq ko'rsating.
${jOnly}
{"dalolatnoma":"to'liq to'lov grafigi matni..."}`
      } else {
        prompt = `Siz moliyaviy-buxgalteriya hujjatlashtirish mutaxasssissiz. Quyidagi ma'lumotlar asosida ish bajarilganligi to'g'risida rasmiy dalolatnoma yarating.

BAJARUVCHI (IJROCHI):
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Rahbar: ${d.direktor || '___'}
Bank: ${d.bank_name || '___'}, H/R: ${d.bank_account || '___'}, MFO: ${d.mfo || '___'}

BUYURTMACHI (KONTRAGENT): ${d.kontragentar_ism || d.kontragent || '___'}
XIZMAT/ISH TURI: ${d.xizmat_turi || '___'}
SHARTNOMA: ${d.shartnoma_raqam || '___'}
SUMMA: ${d.summa || '___'} so'm
SANA: ${d.sana || '___'}

MAJBURIY TUZILMA:

1. SARLAVHA (markazda):
   ISH BAJARILGANLIGI TO'G'RISIDA DALOLATNOMA
   № ___ / ${d.sana || '___'}

2. TOMONLAR:
   Bajaruvchi: "${d.tashkilot || '___'}", INN: ${d.tashkilot_inn || '___'}, nomidan rahbar ${d.direktor || '___'}
   Buyurtmachi: "${d.kontragentar_ism || d.kontragent || '___'}", nomidan ___

3. DALOLATNOMA MATNI:
   Ushbu dalolatnoma ${d.shartnoma_raqam || '___'} raqamli shartnoma (sanasi: ___) doirasida quyidagi ishlar/xizmatlar bajarilganligi to'g'risida tuzildi:

4. BAJARILGAN ISHLAR/XIZMATLAR JADVALI:
   | № | Xizmat/ish nomi | O'lchov birligi | Miqdor | Birlik narxi | Jami summa |
   | 1 | ${d.xizmat_turi || '___'} | xizmat | 1 | ${d.summa || '___'} | ${d.summa || '___'} |
   | JAMI | | | | | ${d.summa || '___'} so'm |

5. MOLIYAVIY QISM:
   Jami summa: ${d.summa || '___'} so'm
   Shu jumladan QQS (___% bilan): ___ so'm
   QQSsiz: ___ so'm
   So'zlar bilan: ___ so'm ___ tiyin

6. TASDIQLOV MATNI:
   Yuqorida ko'rsatilgan ishlar/xizmatlar to'liq va sifatli bajarildi. Buyurtmachi tomonidan qabul qilindi. Tomonlar bir-biriga hech qanday da'vo va e'tirozlari yo'q.

7. TOMONLARNING REKVIZITLARI VA IMZOLARI:
   BAJARUVCHI                          BUYURTMACHI
   ${d.tashkilot || '___'}              ${d.kontragentar_ism || '___'}
   INN: ${d.tashkilot_inn || '___'}     INN: ___
   Bank: ${d.bank_name || '___'}        Bank: ___
   H/R: ${d.bank_account || '___'}      H/R: ___
   MFO: ${d.mfo || '___'}               MFO: ___
   Rahbar: _____ / ${d.direktor || '___'}   Rahbar: _____ / ___
   M.O.                                M.O.
   Sana: _______________

Rasmiy buxgalteriya hujjati uslubida, to'liq to'ldiring.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"dalolatnoma":"to'liq dalolatnoma matni..."}`
      }
    }

    // ── 15. SCHYOT-FAKTURA ──────────────────────────────────
    else if (type === 'schet_faktura') {
      const d = details || {}
      const narx = parseFloat((d.narx || '0').replace(/\s/g, '')) || 0
      const miqdor = parseFloat(d.miqdor || '1') || 1
      const qqsFoiz = parseFloat(d.qqs || '12') / 100
      const jami = narx * miqdor
      const qqs = Math.round(jami * qqsFoiz / (1 + qqsFoiz))
      const jamiSozsiz = jami - qqs

      prompt = `Siz moliyaviy-buxgalteriya hujjatlashtirish mutaxasssissiz. Quyidagi ma'lumotlar asosida O'zbekiston standartlariga mos rasmiy schyot-faktura yarating.

SOTUVCHI:
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Rahbar: ${d.direktor || '___'}
Bank: ${d.bank_name || '___'}, H/R: ${d.bank_account || '___'}, MFO: ${d.mfo || '___'}

XARIDOR: ${d.xaridor || '___'}
MAHSULOT/XIZMAT: ${d.mahsulot_xizmat || '___'}
MIQDOR: ${miqdor}
NARX: ${d.narx || '___'} so'm
QQS: ${d.qqs || '12'}%
SANA: ${d.sana || '___'}

SCHYOT-FAKTURA TUZILMASI:

1. SARLAVHA:
   SCHYOT-FAKTURA № ___
   Sana: ${d.sana || '___'}

2. TOMONLAR:
   Sotuvchi: ${d.tashkilot || '___'}, INN: ${d.tashkilot_inn || '___'}
   Xaridor: ${d.xaridor || '___'}, INN: ___

3. TOVARLAR/XIZMATLAR JADVALI:
   | № | Mahsulot/xizmat nomi | O'lchov birligi | Miqdor | Narx (so'm) | Jami (so'm) | QQS % | QQS miqdori | Jami QQS bilan |
   | 1 | ${d.mahsulot_xizmat || '___'} | dona/xizmat | ${miqdor} | ${d.narx || '___'} | ${jami.toLocaleString('uz-UZ')} | ${d.qqs || '12'}% | ${qqs.toLocaleString('uz-UZ')} | ${jami.toLocaleString('uz-UZ')} |
   | JAMI | | | | | ${jami.toLocaleString('uz-UZ')} | | ${qqs.toLocaleString('uz-UZ')} | ${jami.toLocaleString('uz-UZ')} |

4. MOLIYAVIY YAKUNLAR:
   Jami QQSsiz: ${jamiSozsiz.toLocaleString('uz-UZ')} so'm
   QQS (${d.qqs || '12'}%): ${qqs.toLocaleString('uz-UZ')} so'm
   JAMI TO'LASH: ${jami.toLocaleString('uz-UZ')} so'm
   So'zlar bilan: [raqamni so'z bilan yozing] so'm ___ tiyin

5. TO'LOV MA'LUMOTLARI:
   Bank: ${d.bank_name || '___'}
   Hisob raqami: ${d.bank_account || '___'}
   MFO: ${d.mfo || '___'}
   To'lov maqsadi: ${d.mahsulot_xizmat || '___'} uchun to'lov, schyot-faktura ___ ga asosan

6. IMZO:
   Sotuvchi rahbari: _________________________ / ${d.direktor || '___'}
   Bosh buxgalter: _________________________ / ___
   M.O.   Sana: ${d.sana || '___'}

Rasmiy buxgalteriya schyot-faktura uslubida, O'zbekiston MV standartlari bo'yicha.
\nMUHIM: Faqat berilgan raqamlar bilan hisoblang. Summalarni o'ylab topmang. Ko'rsatilmagan joylar uchun ___ ishlating. Hisob-kitoblarni aniq ko'rsating.
${jOnly}
{"faktura":"to'liq schyot-faktura matni..."}`
    }

    // ── 16. TALABNOMA ───────────────────────────────────────
    else if (type === 'talabnoma') {
      const d = details || {}
      const qarz = d.qarz_summasi || '___'
      const muddat = d.muddat_utgan || '___'
      const jarima = d.jarima_foiz || '0.1'

      prompt = `Siz O'zbekiston Respublikasi fuqarolik va iqtisodiy qonunchiligini mukammal biladigan yurist-mutaxasssissiz. Quyidagi ma'lumotlar asosida rasmiy qarz talabnomasi (pretenziya) yarating.

KREDITOR:
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Rahbar: ${d.direktor || '___'}

QARZDOR:
Tashkilot: ${d.qarzdor || '___'} (INN: ${d.qarzdor_inn || '___'})
Rahbar: ${d.qarzdor_direktor || '___'}
Bank: ${d.qarzdor_bank || '___'}, H/R: ${d.qarzdor_hr || '___'}, MFO: ${d.qarzdor_mfo || '___'}

QARZ SUMMASI: ${qarz} so'm
SHARTNOMA: ${d.shartnoma_raqam || '___'}
MUDDATI O'TGAN: ${muddat} kun
KUNLIK JARIMA: ${jarima}%
QARZ SABABI: ${d.qarz_sababi || '___'}
OXIRGI TO'LOV MUHLATI: ${d.oxirgi_muhlat || '___'}
SUD OGOHLANTIRISHMI: ${d.sudga_murojaat || "Ha"}

TALABNOMA TUZILMASI:

1. MANZIL BLOKI (yuqori o'ngda):
   Kimga: "${d.qarzdor || '___'}" rahbariga
   Kimdan: "${d.tashkilot || '___'}" (INN: ${d.tashkilot_inn || '___'})
   Sana: _______________   Raqam: ___-P

2. SARLAVHA (markazda): TALABNOMA (PRETENZIYA)

3. KIRISH — SHARTNOMA ASOSI:
   ${d.shartnoma_raqam || '___'} raqamli shartnoma (sanasi: ___) bo'yicha "${d.tashkilot || '___'}" tashkiloti "${d.qarzdor || '___'}" tashkilotiga quyidagi majburiyatni bajargan: ${d.qarz_sababi || '___'}

4. QARZNING TAFSILOTI:
   - Asosiy qarz summasi: ${qarz} so'm
   - To'lov muddati: ___ (shartnoma bo'yicha)
   - To'lov kechiktirilgan kunlar soni: ${muddat} kun
   - Kunlik jarima foizi: ${jarima}% (shartnoma ___ bandi)
   - Jami jarima: ${qarz !== '___' && muddat !== '___' ? `${qarz} × ${jarima}% × ${muddat} kun = ___ so'm` : '___ so\'m'}
   - JAMI TALAB (asosiy qarz + jarima): ___ so'm

5. HUQUQIY ASOSLAR:
   - O'zbekiston Respublikasi Fuqarolik kodeksining 327, 328, 333-moddalari (majburiyatlarni bajarish)
   - FK 350-moddasi (pul majburiyatini bajarmaslik uchun foizlar)
   - Shartnomaning ___-bandi (sanksiyalar va jarimalar)

6. TALAB:
   Yuqoridagilarga asoslanib, "${d.qarzdor || '___'}" dan ushbu talabnomani qabul qilgan kundan boshlab ${d.oxirgi_muhlat || '10 (o\'n) ish kuni'} ichida:
   1. Asosiy qarz ${qarz} so'mni to'lash;
   2. Kechiktirilganlik uchun jarima ___ so'mni to'lash;
   3. Jami: ___ so'mni quyidagi bank rekvizitlariga o'tkazish so'raladi:
      Bank: ${d.bank_name || '___'}, H/R: ${d.bank_account || '___'}, MFO: ${d.mfo || '___'}

7. OGOHLANTIRISH (agar sud ko'rsatilgan bo'lsa):
   Agar belgilangan muddatda to'lov amalga oshirilmasa, "${d.tashkilot || '___'}" tashkiloti O'zbekiston Respublikasi Iqtisodiy sudiga da'vo arizasi bilan murojaat qilishga va barcha sud xarajatlarini qarzdordan undirishga majbur bo'ladi.

8. ILOVA:
   1. Shartnoma nusxasi — ___ bet
   2. Yetkazib berish hujjatlari/dalolatnoma — ___ bet
   3. Bank ko'chirmasida to'langan/to'lanmagan summa tasdiqi

9. IMZO:
   Hurmat bilan,
   "${d.tashkilot || '___'}" rahbari: _________________________ / ${d.direktor || '___'}
   M.O.   Sana: _______________

Rasmiy-yuridik uslubda, qat'iy, huquqiy asosli. Kamida 400 so'z.
\nMUHIM: Faqat berilgan raqamlar bilan hisoblang. Summalarni o'ylab topmang. Ko'rsatilmagan joylar uchun ___ ishlating. Hisob-kitoblarni aniq ko'rsating.
${jOnly}
{"talabnoma":"to'liq talabnoma matni..."}`
    }

    // ── KOTIBA AI ────────────────────────────────────────────
    else if (type === 'bayonnoma') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi ish yuritish qoidalarini mukammal biladigan professional kotib yordamchisiz. Quyidagi ma'lumotlar asosida to'liq, professional yig'ilish bayonnomasi yarating.

TASHKILOT MA'LUMOTLARI:
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Rahbar: ${d.direktor || '___'}

YIG'ILISH TAFSILOTLARI:
Sana: ${d.sana || '___'}
O'tkazilgan joy: ${d.joyi || '___'}
Raislik qilgan: ${d.raislik_qilgan || '___'}
Ishtirokchilar: ${d.ishtirokchilar || '___'}

KUN TARTIBI:
${d.kun_tartibi || '___'}

QABUL QILINGAN QARORLAR:
${d.qarorlar || '___'}

MAJBURIY TALABLAR — quyidagi tuzilmada yozing:

1. SARLAVHA qismi: "BAYONNOMA", raqam (№ ___), sana, joy — markazga tekislangan
2. KIRISH qismi: yig'ilish turi (navbatdagi/favqulodda), o'tkazilish formati, ishtirok foizi (masalan: "Jami 5 a'zodan 5 nafari ishtirok etdi — 100%")
3. KUN TARTIBI ro'yxati: har bir modda tartib raqami bilan sanab o'tiladi
4. MUHOKAMA qismi — har bir kun tartibi moddasi uchun alohida:
   - "1-MASALA: [mavzu]" (katta harfda, bold)
   - "MA'RUZA QILDI:" kimligi va qisqa bayoni (2-3 jumlada)
   - "MUHOKAMADA QATNASHDI:" ishtirochilar fikri
   - "QAROR QILINDI:" aniq, bajarilishi mumkin bo'lgan qaror matni
   - "OVOZ BERISH:" "Yoqlab — ___, Qarshi — ___, Betaraf — ___"
   - "Mas'ul ijrochi:" va "Muddat:" qatorlari
5. YAKUNIY qism: "Yig'ilish yopiq deb e'lon qilindi. Bayonnoma imzolandi."
6. IMZOLAR bloki: "Raislik qiluvchi: _________________ / ${d.raislik_qilgan || '___'}" va "Kotib: _________________ / ___"

Uslub: rasmiy, aniq, qisqa jumlalar. Kamida 500 so'z. Hujjat to'liq bo'lishi shart — hech qanday [xxx] yoki "..." qoldirma.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"bayonnoma":"to'liq bayonnoma matni..."}`
    }

    else if (type === 'rasmiy_xat') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi ish yuritish qoidalarini mukammal biladigan professional kotib yordamchisiz. Quyidagi ma'lumotlar asosida rasmiy xat (delovoe pis'mo) yarating.

YUBORUVCHI:
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Direktor: ${d.direktor || '___'}
${d.tashkilot_manzil ? `Manzil: ${d.tashkilot_manzil}` : ''}

KIMGA: ${d.kim_uchun || '___'}
MAVZU: ${d.mavzu || '___'}

ASOSIY MAZMUN:
${d.asosiy_mazmun || '___'}

JAVOB MUDDATI: ${d.muddati || "ko'rsatilmagan"}

MAJBURIY TALABLAR — quyidagi tuzilmada yozing:

1. BOSHQACHA BLOKNING O'RNI:
   - Yuqori o'ngda: "Kimga: ${d.kim_uchun || '___'}"
   - Xat raqami va sanasi: "Raqam: ___ / ${d.sana || new Date().getFullYear()} yil ___ ___"

2. MAVZU QATORI: "Mavzu: ${d.mavzu || '___'}" — qisqa, aniq

3. MUROJAAT: Hurmatli [lavozim va ism!], (yoki "Hurmatli hamkorlar!")

4. KIRISH PARAGRAFI: Xatning maqsadini bir-ikki jumlada tushuntiradi. Murojaat qilish sababi va asosi ko'rsatiladi.

5. ASOSIY QISM (2-4 paragraf):
   - Asosiy masala batafsil bayon qilinadi
   - Zarur bo'lsa, raqamlar, sanalar, hujjat ro'yxati keltiriladi
   - Qonuniy asoslar (agar mavjud bo'lsa) havola qilinadi
   - Muammoli jihatlar va taklif etilayotgan yechim ko'rsatiladi

6. SO'ROV YOKI TAKLIF: "Shunga ko'ra, Sizdan _____ so'raymiz / taklif qilamiz" jumlasi bilan aniq iltimos

7. XULOSA: Hamkorlikka minnatdorlik. Javob kutilayotgan muddat: ${d.muddati || 'iloji boricha tezroq'}

8. IMZO BLOKI:
   Hurmat bilan,
   ${d.direktor || 'Direktor'}: _________________________ / ${d.direktor || '___'}
   M.O.

Uslub: rasmiy, muloyim, ishbilarmonlik toni. Kamida 300 so'z. Barcha jumlalar to'liq va mazmunli bo'lsin.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"xat":"to'liq xat matni..."}`
    }

    else if (type === 'taklifnoma') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi ish yuritish qoidalarini mukammal biladigan professional kotib yordamchisiz. Quyidagi ma'lumotlar asosida rasmiy taklifnoma (invitation letter) yarating.

YUBORUVCHI TASHKILOT:
Tashkilot: ${d.tashkilot || '___'}
Direktor: ${d.direktor || '___'}

TADBIR TAFSILOTLARI:
Tadbir nomi: ${d.tadbir_nomi || '___'}
Sana va vaqt: ${d.tadbir_sana || '___'}
Joyi: ${d.tadbir_joyi || '___'}
Kimga yo'llangan: ${d.mehmonga || '___'}
Dastur: ${d.dastur || '___'}
${d.kiyinish_kodi ? `Kiyinish kodi: ${d.kiyinish_kodi}` : ''}
${d.tasdiqlash_muddati ? `Tasdiqlash muddati: ${d.tasdiqlash_muddati}` : ''}

MAJBURIY TALABLAR — quyidagi tuzilmada yozing:

1. SARLAVHA: Tashkilot nomi va "TAKLIFNOMA" so'zi — markazga tekislangan

2. KIMGA MUROJAAT: "Hurmatli [ism/lavozim]," — iliq, hurmatli ton

3. TADBIR HAQIDA KIRISH: Tadbirning maqsadi va ahamiyatini ifodalovchi bir paragraf (mehmonni nima uchun ayniqsa taklif qilish ahamiyatli ekani)

4. TADBIR TAFSILOTLARI qutisi:
   📅 Sana va vaqt: ${d.tadbir_sana || '___'}
   📍 Manzil: ${d.tadbir_joyi || '___'}
   🎯 Format: [tadbirning formati]

5. DASTUR (agar mavjud): Vaqt jadvali bilan batafsil dastur

6. MAXSUS TAKLIF PARAGRAF: Bu mehmonning ishtirokidan nima uchun foyda ko'rilishi, uning nufuzi va hissasi haqida

7. QABUL QILISH ILTIMOSI: "Taklifimizni qabul qilishingizni so'rab, ${d.tasdiqlash_muddati || "imkon qadar tezroq"} gacha xabar berishingizni so'raymiz."

8. YORDAMCHI MA'LUMOT: Aloqa telefoni, elektron pochta (agar mavjud)

9. IMZO BLOKI:
   Hurmat va ehtirom bilan,
   ${d.direktor || 'Direktor'}: _________________________ / ${d.direktor || '___'}
   M.O.   Sana: _______________

Uslub: rasmiy va iliq, mehmonni hurmat qiluvchi ton. Kamida 250 so'z. Tadbir va maqsad to'liq tushunilsin.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"taklifnoma":"to'liq taklifnoma matni..."}`
    }

    else if (type === 'hisobot') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi ish yuritish qoidalarini mukammal biladigan professional kotib yordamchisiz. Quyidagi ma'lumotlar asosida to'liq, professional rasmiy hisobot yarating.

TASHKILOT MA'LUMOTLARI:
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Rahbar: ${d.direktor || '___'}

HISOBOT PARAMETRLARI:
Hisobot turi: ${d.hisobot_turi || '___'}
Davr: ${d.davr || '___'}
Hisobotni tayyorlagan: ${d.mas_ul || d.direktor || '___'}

BAJARILGAN ISHLAR:
${d.bajarilgan_ishlar || '___'}

MUAMMOLAR VA QIYINCHILIKLAR:
${d.muammolar || "yo'q"}

KEYINGI DAVR REJALARI:
${d.rejalar || '___'}

RAQAMLI KO'RSATKICHLAR (agar mavjud):
${d.korsatkichlar || "ko'rsatilmagan"}

MAJBURIY TALABLAR — quyidagi tuzilmada yozing:

1. SARLAVHA:
   "${d.tashkilot || 'TASHKILOT'} HISOBOTI"
   Turi: ${d.hisobot_turi || '___'}
   Davr: ${d.davr || '___'}
   Sana: _______________

2. KIRISH (ANNOTATSIYA): Hisobotning maqsadi, qamrovi va asosiy xulosalar qisqacha (3-4 jumla)

3. 1-BO'LIM — BAJARILGAN ISHLAR VA NATIJALAR:
   - Har bir ish/loyiha alohida kichik sarlavha bilan
   - Boshlanish va tugash sanasi
   - Natijalari va ko'rsatkichlari (raqamlar bilan)
   - Mas'ul shaxslar

4. 2-BO'LIM — TAHLIL VA BAHOLASH:
   - Muvaffaqiyatlar va yutuqlar
   - Muammolar va ularning sabablari
   - Belgilangan vazifalarning bajarilish foizi

5. 3-BO'LIM — MUAMMOLAR VA ULARNING YECHIMLARI:
   Har bir muammo uchun: muammo tavsifi → sabab → qilingan choralar → tavsiya

6. 4-BO'LIM — KEYINGI DAVR REJALARI:
   - Asosiy maqsad va vazifalar
   - Amalga oshirish muddatlari
   - Mas'ul ijrochilar
   - Kerakli resurslar

7. XULOSA VA TAVSIYALAR:
   - Umumiy baho (5 ballik tizimda)
   - 3-5 ta aniq tavsiya

8. IMZO BLOKI:
   Hisobotni tayyorladi: _______________  /  ${d.mas_ul || d.direktor || '___'}
   Rahbar: _____________________  /  ${d.direktor || '___'}
   Sana: _______________  M.O.

Uslub: aniq, raqamlar va faktlar asosida, rasmiy. Kamida 600 so'z. Har bir bo'lim to'liq mazmunli bo'lsin.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"hisobot":"to'liq hisobot matni..."}`
    }

    else if (type === 'eslatma') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi ish yuritish qoidalarini mukammal biladigan professional kotib yordamchisiz. Quyidagi ma'lumotlar asosida ichki rasmiy xizmat xati (eslatma/memo) yarating.

TASHKILOT: ${d.tashkilot || '___'}
MAS'UL/YUBORUVCHI: ${d.direktor || '___'}
KIMGA: ${d.kimga || '___'}
MAVZU: ${d.mavzu || '___'}

MAZMUN:
${d.mazmun || '___'}

MUDDAT: ${d.muddat || "ko'rsatilmagan"}

MAJBURIY TALABLAR — quyidagi tuzilmada yozing:

1. BOSHLIK BLOKI (to'rtburchak jadval yoki ro'yxat shaklida):
   XIZMAT XATI (ESLATMA)
   Kimga:      ${d.kimga || '___'}
   Kimdan:     ${d.direktor || '___'}
   Sana:       _______________
   Raqam:      № ___
   Mavzu:      ${d.mavzu || '___'}

2. KIRISH QISMI: Eslatmaning sababi va dolzarbligi (1 paragraf)

3. ASOSIY QISM:
   - Vaziyatni batafsil bayon qilish
   - Muammoning mohiyati yoki vazifa tavsifi
   - Zarur harakatlar ro'yxati (tartib raqamlari bilan)
   - Qonuniy yoki me'yoriy asoslar (agar tegishli bo'lsa)

4. SO'ROV YOKI TOPSHIRIQ:
   "Shunga asosan, Sizdan quyidagilarni bajarishingizni so'raymiz:" — aniq, bajarilishi mumkin bo'lgan buyruq/iltimos

5. JAVOB MUDDATI: "${d.muddat || 'imkon qadar tezroq'} gacha javob kutiladi"

6. ILOVALAR (agar mavjud): "Ilova: 1. ___, 2. ___"

7. IMZO BLOKI:
   ${d.direktor || '___'}: _________________________ / ${d.direktor || '___'}
   Sana: _______________

Uslub: lo'nda, aniq, rasmiy, buyruqli ton. Kamida 200 so'z. Barcha gap to'liq bo'lsin.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"eslatma":"to'liq eslatma matni..."}`
    }

    else if (type === 'murojaatnoma') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi qonunchiligini va ish yuritish qoidalarini mukammal biladigan professional yurist-kotib yordamchisiz. Quyidagi ma'lumotlar asosida rasmiy murojaatnoma (ariza/petition) yarating.

MUROJAAT QILUVCHI:
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Direktor: ${d.direktor || '___'}
${d.tashkilot_manzil ? `Manzil: ${d.tashkilot_manzil}` : ''}

KIMGA: ${d.kimga || '___'}
MAQSAD: ${d.maqsad || '___'}
ASOSIY MAZMUN: ${d.asosiy_mazmun || '___'}
KUTILAYOTGAN NATIJA: ${d.kutilgan_natija || '___'}

MAJBURIY TALABLAR — quyidagi tuzilmada yozing:

1. MANZIL BLOKI (yuqori o'ngda):
   Kimga: ${d.kimga || '___'}
   Kimdan: ${d.tashkilot || '___'}, INN ${d.tashkilot_inn || '___'}
   Direktor: ${d.direktor || '___'}
   Sana: _______________   Raqam: ___

2. SARLAVHA (markazda): "MUROJAATNOMA" yoki "ARIZA" — mavzuga qarab

3. KIRISH QISMI:
   - Murojaat qiluvchi tashkilot haqida qisqa ma'lumot
   - Murojaatning umumiy maqsadi (1-2 jumla)

4. ASOSIY QISM (3-5 paragraf):
   - Vaziyatning batafsil tavsifi — nima, qachon, qanday sharoitda yuz bergan
   - Dolzarblik va zaruriyat asoslari
   - Mavjud muammoning ta'siri (iqtisodiy, huquqiy yoki ijtimoiy)
   - O'zbekiston Respublikasi qonunchiligiga (tegishli qonun, kodeks, qaror) havola

5. TALAB YOKI ILTIMOS:
   "Yuqoridagilarga asoslanib, Sizdan quyidagilarni so'raymiz:" — aniq so'rovlar ro'yxati (1, 2, 3...)

6. KUTILAYOTGAN NATIJA: "${d.kutilgan_natija || '___'}"

7. ILOVALAR ro'yxati: zarur hujjatlar sanab o'tiladi

8. IMZO BLOKI:
   Hurmat bilan,
   ${d.direktor || 'Direktor'}: _________________________ / ${d.direktor || '___'}
   M.O.   Sana: _______________

Uslub: aniq, huquqiy asosli, rasmiy. Kamida 400 so'z. Hamma talablar asosli va mantiqli bo'lsin.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"murojaatnoma":"to'liq murojaatnoma matni..."}`
    }

    else if (type === 'tushuntirish_xati') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi ish yuritish qoidalarini mukammal biladigan professional kotib yordamchisiz. Quyidagi ma'lumotlar asosida rasmiy tushuntirish xati yarating.

TASHKILOT MA'LUMOTLARI:
Tashkilot: ${d.tashkilot || '___'}
Rahbar: ${d.direktor || '___'}

XODIM:
Ismi: ${d.xodim_ism || '___'}
Lavozimi: ${d.lavozim || '___'}
Bo'limi: ${d.bolim || "ko'rsatilmagan"}

VOQEA/HOLAT: ${d.hodisa || '___'}
SABAB: ${d.sabab || '___'}
TAKRORLANMASLIK CHORALARI: ${d.qayta_takrorlanmasligi || "ko'rsatilmagan"}

MAJBURIY TALABLAR — quyidagi tuzilmada yozing:

1. MANZIL BLOKI (yuqori o'ngda):
   Kimga: ${d.tashkilot || '___'}
   ${d.direktor || 'Rahbar'} ga
   Kimdan: ${d.lavozim || '___'} ${d.xodim_ism || '___'}
   Sana: _______________

2. SARLAVHA (markazda): "TUSHUNTIRISH XATI"

3. VOQEANING TAVSIFI:
   - Qachon (sana, vaqt), qayerda va qanday holat yuz bergani aniq bayon qilinadi
   - Ob'ektiv va xolisona tavsif — hech qanday ortiqcha maqtov yoki bahona qilmasdan

4. SABAB VA HOLAT TAHLILI:
   - Voqeaning asosiy sabablari (ob'ektiv va sub'ektiv)
   - Bu holatga olib kelgan omillar
   - Xodimning bu jarayondagi o'rni va mas'uliyati darajasi

5. OLINGAN CHORALAR:
   - Voqea paytida qilingan harakatlar
   - Keyin amalga oshirilgan tuzatish choralari
   - Boshqa tashkilot/xodimlar ta'sirlangan bo'lsa, ularning holati

6. MAJBURIYAT VA VA'DA:
   "Men bunday holatning takrorlanmasligini ta'minlash uchun quyidagilarni amalga oshiraman:"
   — aniq, o'lchanadigan majburiyatlar ro'yxati

7. KECHIRIM VA XULOSA:
   Xatolik uchun kechirim so'rash, ishonchni oqlashga tayyor ekanligi

8. IMZO BLOKI:
   ${d.xodim_ism || '___'}: _________________________ / ${d.xodim_ism || '___'}
   Sana: _______________

Uslub: kamtarona, mas'uliyatli, rasmiy. Kamida 300 so'z. Hujjat ishonchli va samimiy bo'lsin.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"tushuntirish":"to'liq tushuntirish xati matni..."}`
    }

    // ── 17. TO'LOV GRAFIGI ──────────────────────────────────
    else if (type === 'tolov_grafigi') {
      const d = details || {}
      const jami = parseFloat(String(d.jami_summa || '0').replace(/\s/g, '')) || 0
      const soni = parseInt(String(d.tolov_soni || '1')) || 1
      const birTolov = soni > 0 ? Math.round(jami / soni) : 0

      prompt = `Siz moliyaviy hujjat tuzish bo'yicha mutaxasssissiz. Quyidagi ma'lumotlar asosida rasmiy to'lov grafigini tuzing.

TASHKILOT: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
RAHBAR: ${d.direktor || '___'}
KONTRAGENT: ${d.kontragent || '___'}
JAMI SUMMA: ${jami ? jami.toLocaleString('uz-UZ') : '___'} so'm
TO'LOVLAR SONI: ${soni}
HAR BIR TO'LOV: ~${birTolov ? birTolov.toLocaleString('uz-UZ') : '___'} so'm
BIRINCHI TO'LOV SANASI: ${d.boshlanish_sana || '___'}
TO'LOV TURI: ${d.tolov_turi || "Oylik teng to'lovlar"}

HUJJAT TUZILMASI:

1. SARLAVHA:
   TO'LOV GRAFIGI
   "${d.tashkilot || '___'}" va "${d.kontragent || '___'}" o'rtasidagi shartnoma bo'yicha
   Tuzilgan sana: _______________

2. TO'LOV JADVALI (barcha ${soni} ta to'lovni sanab ko'rsating):
   | № | To'lov sanasi | To'lov summasi (so'm) | Qoldiq summa (so'm) | Izoh |
   (Har bir qator uchun sanani hisoblang: birinchi to'lov ${d.boshlanish_sana || '___'}, keyingilari oyma-oy)

3. YAKUNIY QATOR: Jami: ${jami ? jami.toLocaleString('uz-UZ') : '___'} so'm

4. SHARTLAR:
   - To'lov usuli: bank o'tkazma
   - To'lov kechiktirilsa: ___% kunlik jarima
   - Oxirgi to'lov sanasi: _______________

5. IMZOLAR:
   "${d.tashkilot || '___'}" rahbari: _________________________ / ${d.direktor || '___'}
   "${d.kontragent || '___'}" rahbari: _________________________
   M.O.   Sana: _______________

\nMUHIM: Faqat berilgan raqamlar bilan hisoblang. Summalarni o'ylab topmang. Ko'rsatilmagan joylar uchun ___ ishlating. Hisob-kitoblarni aniq ko'rsating.
${jOnly}
{"tolov_grafigi":"to'liq to'lov grafigi matni..."}`
    }

    // ── KAFOLAT XATI ────────────────────────────────────────
    else if (type === 'kafolat_xat') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi qonunchiligini biladigan professional hujjat tuzuvchisiz. Quyidagi ma'lumotlar asosida rasmiy kafolat xati yarating.

TASHKILOT: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
RAHBAR: ${d.direktor || '___'}
KIMGA: ${d.kimga || '___'}
KAFOLAT MAQSADI: ${d.kafolat_maqsad || '___'}
KAFOLAT SUMMASI: ${d.kafolat_miqdori || 'ko\'rsatilmagan'}
KAFOLAT MUDDATI: ${d.kafolat_muddati || '___'}
QO'SHIMCHA SHARTLAR: ${d.qoshimcha || 'yo\'q'}

HUJJAT TUZILMASI:
1. Kimga yo'naltirilganligi (o'ng yuqori burchak)
2. Kimdan (chap yuqori burchak)
3. KAFOLAT XATI sarlavhasi (markazda)
4. Kirish: tashkilot o'zini tanitadi
5. Kafolat predmeti: nima kafolatlanayapti
6. Kafolat shartlari va majburiyatlar
7. Muddati
8. Huquqiy asos (O'zbekiston Respublikasi Fuqarolik kodeksi)
9. Imzo bloki: direktor, M.O., sana

Kafolat xati ishonchli, aniq va yuridik jihatdan to'g'ri bo'lsin. Kamida 250 so'z.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"kafolat_xat":"to'liq kafolat xati matni..."}`
    }

    // ── TABRIKLASH XATI ─────────────────────────────────────
    else if (type === 'tabriklash_xat') {
      const d = details || {}
      prompt = `Siz rasmiy ish yuritish uslubini biladigan professional kotib yordamchisiz. Quyidagi ma'lumotlar asosida rasmiy, samimiy va chiroyli tabriklash xati yarating.

TASHKILOT: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
RAHBAR: ${d.direktor || '___'}
KIMGA: ${d.kimga || '___'}
BAYRAM/TADBIR: ${d.bayram || '___'}
QO'SHIMCHA MAZMUN: ${d.asosiy_mazmun || 'umumiy tabrik'}

HUJJAT TUZILMASI:
1. Kimga (o'ng yuqori burchak)
2. Kimdan (chap)
3. TABRIKLASH XATI sarlavhasi
4. Murojaat (hurmatli...)
5. Tabrik matni: samimiy, rasmiy uslubda, hamkorlikni qadrlab
6. Kelajakka ezgu tilaklar
7. Imzo bloki

Ton: rasmiy lekin iliq, samimiy. 150-200 so'z.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"tabriklash_xat":"to'liq tabriklash xati matni..."}`
    }

    // ── REKVIZITLAR XATI ────────────────────────────────────
    else if (type === 'rekvizitlar_xat') {
      const d = details || {}
      prompt = `Siz rasmiy ish yuritish uslubini biladigan professional kotib yordamchisiz. Quyidagi ma'lumotlar asosida rasmiy so'rov xati yarating.

TASHKILOT: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
RAHBAR: ${d.direktor || '___'}
KIMGA: ${d.kimga || '___'}
SO'ROV TURI: ${d.sorov_turi || '___'}
MAQSAD: ${d.maqsad || '___'}
JAVOB MUDDATI: ${d.muddat || '2 ish kuni ichida'}

HUJJAT TUZILMASI:
1. Kimga (o'ng yuqori burchak)
2. Kimdan (chap)
3. SO'ROV XATI sarlavhasi
4. Murojaat
5. So'rov sababi va maqsadi
6. Aniq so'ralayotgan ma'lumotlar/hujjatlar ro'yxati
7. Javob muddati
8. Minnatdorchilik
9. Imzo bloki

Uslub: qisqa, aniq, rasmiy. 150-200 so'z.
\nMUHIM: Faqat berilgan ma'lumotlardan foydalaning. Ko'rsatilmagan joylar uchun ___ ishlating. Hech qanday ma'lumot o'ylab topilmasin.
${jOnly}
{"rekvizitlar_xat":"to'liq so'rov xati matni..."}`
    }

    // ── AKT SVERKI ──────────────────────────────────────────
    else if (type === 'akt_sverki') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi buxgalteriya va moliya qonunchiligini mukammal biladigan bosh buxgalter yordamchisiz. Quyidagi ma'lumotlar asosida rasmiy o'zaro hisob-kitoblarni tekshirish akti (akt sverki) yarating.

TASHKILOT (TASHABBUSKOR):
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Rahbar: ${d.direktor || '___'}
Bank: ${d.bank_name || '___'}, H/R: ${d.bank_account || '___'}, MFO: ${d.mfo || '___'}

KONTRAGENT: ${d.kontragent || '___'}
SHARTNOMA: ${d.shartnoma_raqam || '___'}
DAVR: ${d.davr || '___'}
BOSHLANISH QOLDIQ: ${d.bosh_qoldiq || "0"}
DEBET (Bizning yetkazgan): ${d.debet_summa || '___'} so'm
KREDIT (Kontragent to'lagan): ${d.kredit_summa || '___'} so'm

AKT TUZILMASI:

1. SARLAVHA (markazda):
   O'ZARO HISOB-KITOBLARNI TEKSHIRISH AKTI
   ${d.davr || '___'} davri uchun
   Tuzilgan sana: _______________

2. TOMONLAR:
   Biz: "${d.tashkilot || '___'}", INN: ${d.tashkilot_inn || '___'}
   Kontragent: "${d.kontragent || '___'}"
   Ular o'rtasidagi ${d.shartnoma_raqam || '___'} raqamli shartnoma bo'yicha

3. HISOB-KITOB JADVALI:
   | Sana | Operatsiya tavsifi | Debet (so'm) | Kredit (so'm) | Qoldiq (so'm) |
   (Kamida 3-5 ta operatsiya yozing: yetkazib berish, to'lov, qaytarish kabilar)
   Boshlanish qoldig'i: ${d.bosh_qoldiq || '0'} so'm
   Jami debet: ${d.debet_summa || '___'} so'm
   Jami kredit: ${d.kredit_summa || '___'} so'm
   Yakuniy qoldiq: ___ so'm (${d.kontragent || '___'} zimmasidagi qarz / yoki bizning qarzimiz)

4. YAKUNIY MA'LUMOT:
   "${d.davr || '___'}" davri yakunida "${d.kontragent || '___'}" tashkiloti zimmasidagi qarz: ___ so'm
   (yoki: "${d.tashkilot || '___'}" zimmasidagi qarz: ___ so'm)
   Tomonlar hisob-kitoblarni to'g'ri deb hisoblaydi / yoki: Tafovut aniqlandi: ___ so'm

5. IMZOLAR (ikki tomonlama):
   "${d.tashkilot || '___'}":                    "${d.kontragent || '___'}":
   Bosh buxgalter: _________ / ___    Bosh buxgalter: _________ / ___
   Rahbar: _________ / ${d.direktor || '___'}      Rahbar: _________ / ___
   M.O.   Sana: _______________         M.O.   Sana: _______________

Rasmiy buxgalteriya uslubida. O'zbekiston buxgalteriya standartlariga muvofiq (BHMS).
\nMUHIM: Faqat berilgan raqamlar bilan hisoblang. Summalarni o'ylab topmang. Ko'rsatilmagan joylar uchun ___ ishlating. Hisob-kitoblarni aniq ko'rsating.
${jOnly}
{"akt_sverki":"to'liq akt sverki matni..."}`
    }

    // ── AVANS HISOBOTI ──────────────────────────────────────
    else if (type === 'avans_hisobot') {
      const d = details || {}
      const berilganAvans = parseFloat((d.avans_miqdori || '0').replace(/[\s,]/g, '')) || 0
      const sarflangan = parseFloat((d.sarflangan || '0').replace(/[\s,]/g, '')) || 0
      const qoldiq = berilganAvans - sarflangan

      prompt = `Siz O'zbekiston Respublikasi buxgalteriya qoidalarini mukammal biladigan bosh buxgalter yordamchisiz. Quyidagi ma'lumotlar asosida rasmiy avans hisobotini yarating (O'zR Moliya vazirligi № AV-3 shakl asosida).

TASHKILOT:
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Bosh buxgalter: ${d.direktor || '___'}

HISOBOT BERUVCHI XODIM:
Ismi: ${d.xodim_ism || '___'}
Lavozimi: ${d.lavozim || '___'}
Bo'limi: ${d.bolim || '___'}

AVANS MA'LUMOTLARI:
Avans maqsadi: ${d.avans_maqsad || '___'}
Berilgan avans: ${d.avans_miqdori || '___'} so'm
Berilgan sana: ${d.avans_sana || '___'}
Hisob-kitob sanasi: ${d.hisobot_sana || '___'}
Sarflangan: ${d.sarflangan || '___'} so'm
Qoldiq/Oshib ketish: ${qoldiq >= 0 ? `Qoldiq ${Math.abs(qoldiq).toLocaleString('uz-UZ')} so'm` : `Oshib ketish ${Math.abs(qoldiq).toLocaleString('uz-UZ')} so'm`}

XARAJATLAR TAFSILOTI: ${d.xarajatlar || '___'}

AV-3 SHAKLI TUZILMASI:

1. SARLAVHA:
   AVANS HISOBOTI № ___
   Sana: ${d.hisobot_sana || '___'}
   Tashkilot: ${d.tashkilot || '___'}

2. HISOBOT BERUVCHI:
   Ismi: ${d.xodim_ism || '___'}
   Lavozimi: ${d.lavozim || '___'}   Bo'limi: ${d.bolim || '___'}
   Avans oldi: ${d.avans_miqdori || '___'} so'm   Sana: ${d.avans_sana || '___'}
   Avans maqsadi: ${d.avans_maqsad || '___'}

3. XARAJATLAR JADVALI:
   | № | Sana | Hujjat turi va raqami | Xarajat tavsifi | Summa (so'm) |
   (${d.xarajatlar || 'xarajatlarni to\'g\'ri taqsimlang, kamida 3-5 qator'})
   Jami sarflangan: ${d.sarflangan || '___'} so'm

4. HISOB-KITOB:
   Berilgan avans:           ${d.avans_miqdori || '___'} so'm
   Sarflangan:               ${d.sarflangan || '___'} so'm
   Qoldiq (qaytarilsin):     ${qoldiq >= 0 ? Math.abs(qoldiq).toLocaleString('uz-UZ') : '—'} so'm
   Oshib ketgan (to'lansin): ${qoldiq < 0 ? Math.abs(qoldiq).toLocaleString('uz-UZ') : '—'} so'm

5. ILOVALAR:
   1. Cheklar va kvitansiyalar — ___ dona
   2. Tovar/xizmat cheklarining nusxasi — ___ bet
   3. Boshqa hujjatlar — ___ bet

6. IMZOLAR:
   Hisobot berdi: _________________ / ${d.xodim_ism || '___'}   Sana: _______________
   Tekshirdi: _________________ / ___   (Buxgalter)
   Tasdiqladi: _________________ / ${d.direktor || '___'}   (Bosh buxgalter)
   M.O.

O'zbek tili, rasmiy buxgalteriya uslubi, O'zR BHMS 10 standarti asosida.
\nMUHIM: Faqat berilgan raqamlar bilan hisoblang. Summalarni o'ylab topmang. Ko'rsatilmagan joylar uchun ___ ishlating. Hisob-kitoblarni aniq ko'rsating.
${jOnly}
{"avans_hisobot":"to'liq avans hisoboti matni..."}`
    }

    // ── XARAJAT HISOBOTI ────────────────────────────────────
    else if (type === 'xarajat_hisobot') {
      const d = details || {}
      prompt = `Siz O'zbekiston Respublikasi buxgalteriya va soliq qonunchiligini mukammal biladigan bosh buxgalter yordamchisiz. Quyidagi ma'lumotlar asosida rasmiy xarajat hisobotini yarating.

TASHKILOT: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
RAHBAR: ${d.direktor || '___'}
DAVR: ${d.davr || '___'}
XARAJAT TURI: ${d.xarajat_turi || '___'}
JAMI XARAJAT: ${d.jami_xarajat || '___'} so'm
XARAJAT TAFSILOTI: ${d.xarajat_tafsilot || '___'}
MAS'UL XODIM: ${d.mas_ul || '___'}
MAQSAD: ${d.maqsad || '___'}

HUJJAT TUZILMASI:

1. SARLAVHA:
   XARAJAT HISOBOTI
   ${d.davr || '___'} davri uchun
   Tashkilot: ${d.tashkilot || '___'}
   Tuzilgan sana: _______________

2. KIRISH: Hisobotning maqsadi va davr qisqacha tavsifi

3. XARAJATLAR TASNIFI (kategoriya bo'yicha jadvali):
   | № | Xarajat kategoriyasi | Hujjat asosi | Summa (so'm) | Izoh |
   (${d.xarajat_tafsilot || 'kategoriyalarni batafsil sanab o\'ting'})
   Jami: ${d.jami_xarajat || '___'} so'm

4. SOLIQ JIHATDAN TASNIFI (O'zR Soliq kodeksi asosida):
   - Soliqqa tortiladigan xarajatlar: ___ so'm
   - Soliqqa tortilmaydigan xarajatlar: ___ so'm
   - QQS chegirma (agar qo'llanilsa): ___ so'm

5. TAHLIL: Xarajatlar to'g'riligi va asosliligi haqida qisqa xulosa

6. ILOVALAR: Birlamchi hujjatlar ro'yxati (cheklar, hisob-fakturalar, dalolatnomalar)

7. IMZO BLOKI:
   Tuzdi: _________________ / ${d.mas_ul || '___'}
   Bosh buxgalter: _________________ / ___
   Tasdiqladi: _________________ / ${d.direktor || '___'}
   M.O.   Sana: _______________

Rasmiy buxgalteriya uslubi, O'zR Soliq kodeksi 305-321-moddalari asosida.
\nMUHIM: Faqat berilgan raqamlar bilan hisoblang. Summalarni o'ylab topmang. Ko'rsatilmagan joylar uchun ___ ishlating. Hisob-kitoblarni aniq ko'rsating.
${jOnly}
{"xarajat_hisobot":"to'liq xarajat hisoboti matni..."}`
    }

    // ── JARIMA/PENI HISOBI ──────────────────────────────────
    else if (type === 'jarima_hisobi') {
      const d = details || {}
      const qarz = parseFloat((d.qarz_summasi || '0').replace(/[\s,]/g, '')) || 0
      const kunlar = parseInt(d.kechikish_kun || '0') || 0
      const foiz = parseFloat(d.jarima_foiz || '0.1') / 100
      const peni = Math.round(qarz * foiz * kunlar)
      const jami = qarz + peni

      prompt = `Siz O'zbekiston Respublikasi fuqarolik va moliya qonunchiligini mukammal biladigan yurist-buxgalter yordamchisiz. Quyidagi ma'lumotlar asosida rasmiy jarima (peni) hisob-kitobini yarating.

KREDITOR:
Tashkilot: ${d.tashkilot || '___'} (INN: ${d.tashkilot_inn || '___'})
Rahbar: ${d.direktor || '___'}
Bank: ${d.bank_name || '___'}, H/R: ${d.bank_account || '___'}, MFO: ${d.mfo || '___'}

QARZDOR:
Tashkilot: ${d.qarzdor || '___'} (INN: ${d.qarzdor_inn || '___'})
Rahbar: ${d.qarzdor_direktor || '___'}
Bank: ${d.qarzdor_bank || '___'}, H/R: ${d.qarzdor_hr || '___'}, MFO: ${d.qarzdor_mfo || '___'}
${d.qarzdor_manzil ? `Manzil: ${d.qarzdor_manzil}` : ''}

SHARTNOMA: ${d.shartnoma_raqam || '___'}
ASOSIY QARZ: ${d.qarz_summasi || '___'} so'm
SHARTNOMA SANASI: ${d.shartnoma_sana || '___'}
TO'LOV MUDDATI (shartnoma bo'yicha): ${d.tolov_muddat || d.shartnoma_sana || '___'}
HAQIQIY TO'LOV SANASI / HISOBLASH SANASI: ${d.hisoblash_sana || '___'}
KECHIKISH KUNLARI: ${kunlar} kun
KUNLIK JARIMA: ${d.jarima_foiz || '0.1'}% (shartnoma ${d.shartnoma_band || '___'}-bandi)
HISOBLANGAN PENI: ${peni.toLocaleString('uz-UZ')} so'm
JAMI UNDIRILADIGAN: ${jami.toLocaleString('uz-UZ')} so'm

HUJJAT TUZILMASI:

1. SARLAVHA (markazda):
   JARIMA (PENI) HISOB-KITOB VARAQASI
   № ___   Sana: _______________

2. ASOSLAR:
   - ${d.shartnoma_raqam || '___'} raqamli shartnoma (sanasi: ${d.shartnoma_sana || '___'})
   - O'zR Fuqarolik kodeksining 327-moddasi (pul majburiyatini bajarmaslik)
   - O'zR FK 350-moddasi (foizlar undirish asosi)
   - Shartnomaning ${d.shartnoma_band || '___'}-bandi (jarima shartlari)

3. HISOB-KITOB FORMULASI:
   Peni = Asosiy qarz × Kunlik foiz % × Kechikish kunlari
   Peni = ${qarz.toLocaleString('uz-UZ')} × ${d.jarima_foiz || '0.1'}% × ${kunlar} kun
   Peni = ${peni.toLocaleString('uz-UZ')} so'm

4. JADVALLI HISOB-KITOB:
   | Ko'rsatkich | Qiymat |
   | Asosiy qarz summasi | ${qarz.toLocaleString('uz-UZ')} so'm |
   | To'lov muddati (shartnoma) | ${d.tolov_muddat || d.shartnoma_sana || '___'} |
   | Haqiqiy to'lov / Hisoblash sanasi | ${d.hisoblash_sana || '___'} |
   | Kechikish kunlari | ${kunlar} kun |
   | Kunlik jarima stavkasi | ${d.jarima_foiz || '0.1'}% |
   | HISOBLANGAN PENI | ${peni.toLocaleString('uz-UZ')} so'm |
   | Asosiy qarz | ${qarz.toLocaleString('uz-UZ')} so'm |
   | JAMI UNDIRILADIGAN | ${jami.toLocaleString('uz-UZ')} so'm |

5. XULOSAVIY QISM:
   Yuqoridagi hisob-kitobga asosan "${d.qarzdor || '___'}" tashkilotidan quyidagi summa undirish zarur:
   – Asosiy qarz: ${qarz.toLocaleString('uz-UZ')} so'm
   – Jarima (peni) ${d.tolov_muddat || d.shartnoma_sana || '___'} – ${d.hisoblash_sana || '___'} davri uchun: ${peni.toLocaleString('uz-UZ')} so'm
   – JAMI: ${jami.toLocaleString('uz-UZ')} so'm (${jami > 0 ? 'so\'zlar bilan: [yozing]' : 'nol'})

   Agar ${d.oxirgi_muddat || '10 (o\'n) ish kuni'} ichida to'lov amalga oshirilmasa, iqtisodiy sudga murojaat qilinadi.

6. IMZO:
   "${d.tashkilot || '___'}" bosh buxgalteri: _________________ / ${d.chief_accountant || '___'}
   Rahbari: _________________ / ${d.direktor || '___'}
   M.O.   Sana: _______________

Rasmiy yuridik-buxgalteriya uslubida, FK moddalari ko'rsatilgan.
\nMUHIM: Faqat berilgan raqamlar bilan hisoblang. Summalarni o'ylab topmang. Ko'rsatilmagan joylar uchun ___ ishlating. Hisob-kitoblarni aniq ko'rsating.
${jOnly}
{"jarima_hisobi":"to'liq jarima hisob-kitob varaqasi matni..."}`
    }

    else {
      return NextResponse.json({ error: "Noto'g'ri type" }, { status: 400 })
    }

    const longTypes = ['analysis', 'grammar', 'write', 'fix', 'fix_grammar', 'tuzatish', 'mehnat_shartnoma', 'buyruq', 'ishonchnoma', 'dalolatnoma', 'schet_faktura', 'talabnoma', 'tolov_grafigi', 'bayonnoma', 'rasmiy_xat', 'taklifnoma', 'hisobot', 'eslatma', 'murojaatnoma', 'tushuntirish_xati', 'kafolat_xat', 'tabriklash_xat', 'rekvizitlar_xat', 'akt_sverki', 'avans_hisobot', 'xarajat_hisobot', 'jarima_hisobi']
    const kotibaTypes = ['bayonnoma', 'rasmiy_xat', 'taklifnoma', 'hisobot', 'eslatma', 'murojaatnoma', 'tushuntirish_xati', 'kafolat_xat', 'tabriklash_xat', 'rekvizitlar_xat']
    const kadrTypes = ['mehnat_shartnoma', 'buyruq', 'ishonchnoma']
    const buxTypes = ['dalolatnoma', 'schet_faktura', 'talabnoma', 'tolov_grafigi', 'akt_sverki', 'avans_hisobot', 'xarajat_hisobot', 'jarima_hisobi']
    const professionalTypes = [...kotibaTypes, ...kadrTypes, ...buxTypes]
    const systemPrompt = professionalTypes.includes(type)
      ? `Siz O'zbekiston Respublikasi qonunchiligini, mehnat kodeksini va ish yuritish qoidalarini mukammal biladigan professional hujjat tuzuvchisiz. Siz faqat professional, to'liq va yuqori sifatli rasmiy hujjatlar yaratasiz. Qoidalar:
1. Har doim to'liq, tayyor hujjat yarating — hech qanday [xxx], [...] yoki "to'ldiring" ko'rsatmasiz
2. Hujjat barcha zarur bo'limlar bilan to'liq bo'lsin — hech qanday bo'lim qoldirilmasin
3. Rasmiy O'zbek tili uslubida, grammatik xatosiz yozing
4. Imzo joylari, sana, raqam, M.O. qatorlarini albatta qo'shing
5. Qonuniy moddalar va asoslarga havola qiling
6. Raqamlarni aniq hisoblang va to'g'ri yozing
7. Faqat JSON formatda javob bering`
      : undefined

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: longTypes.includes(type) ? 8000 : 3000,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const result = extractJSON(raw)
    // Post-process: clean markdown/whitespace artifacts from document text fields
    if (result && typeof result === 'object') {
      const DOC_FIELDS = [
        'shartnoma', 'shartnoma_yangi', 'tuzatilgan_shartnoma', 'tarjima', 'band',
        'bayonnoma', 'xat', 'taklifnoma', 'hisobot', 'eslatma', 'murojaatnoma',
        'tushuntirish', 'ishonchnoma', 'dalolatnoma', 'akt_sverki',
        'jarima_hisobi', 'xarajat_hisobot', 'tolov_grafigi', 'schet_faktura',
        'talabnoma', 'kafolat_xat', 'tabriklash_xat', 'rekvizitlar_xat',
        'mehnat_shartnoma',
      ]
      const r = result as Record<string, unknown>
      for (const field of DOC_FIELDS) {
        if (typeof r[field] === 'string') {
          r[field] = cleanAiText(r[field] as string)
        }
      }
    }
    return NextResponse.json({ result })

  } catch (err) {
    // Log full error server-side, return safe message to client
    console.error('[AI route]', new Date().toISOString(), err)
    const status = (err as { status?: number })?.status
    const userMsg =
      status === 529 || status === 529
        ? "AI xizmati vaqtincha band. Biroz kutib qayta urinib ko'ring."
        : status === 401
        ? 'API kalit xatoligi. Administrator bilan bog\'laning.'
        : "Xatolik yuz berdi. Qayta urinib ko'ring yoki sahifani yangilang."
    return NextResponse.json({ error: userMsg }, { status: 500 })
  }
}
