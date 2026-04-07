/**
 * messages.ts — mavjud `t` ob'ektini `next-intl` kutubxonasi uchun
 * locale-specific messages formatiga o'giradi.
 *
 * Afzalligi: JSON fayllarsiz, `lib/i18n.ts` yagona manba bo'lib qoladi.
 * Funksiya qiymatlari (doc.intro.*) avtomatik o'tkazib yuboriladi.
 */

import { t as translations, type Lang } from './i18n'

type PlainRecord = Record<string, unknown>

/**
 * Rekursiv ravishda `{ uz, oz, ru }` leaf qiymatlarini `lang` ga mos
 * string ga o'giradi. Funksiya qiymatlarini o'tkazib yuboradi.
 */
function extractLocale(obj: PlainRecord, lang: Lang): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(obj)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue

    const v = val as PlainRecord

    // Leaf: { uz: string, oz: string, ru: string }
    if (typeof v.uz === 'string' && typeof v.ru === 'string') {
      result[key] = (v[lang] as string | undefined) ?? (v.uz as string)
      continue
    }

    // Function leaf (doc.intro.*) — skip
    if (typeof v.uz === 'function') continue

    // Nested namespace — recurse
    const nested = extractLocale(v, lang)
    if (Object.keys(nested).length > 0) {
      result[key] = nested
    }
  }

  return result
}

/**
 * Berilgan `lang` uchun barcha UI matnlarini qaytaradi.
 * `NextIntlClientProvider` ning `messages` prop-iga uzatish uchun.
 */
export function getMessages(lang: Lang): Record<string, unknown> {
  return extractLocale(translations as unknown as PlainRecord, lang)
}
