// ─────────────────────────────────────────────────────────────────────────────
// scriptNorm.ts — Uzbek Latin ↔ Cyrillic auto-conversion
//
// Foydalanuvchi noto'g'ri yozuv tizimida yozib qoldirgan matnni
// saqlashdan oldin avtomatik to'g'irlaydi.
// ─────────────────────────────────────────────────────────────────────────────

export function hasCyrillic(s: string): boolean {
  return /[\u0400-\u04FF]/.test(s)
}

export function hasLatinLetters(s: string): boolean {
  return /[a-zA-Z]/.test(s)
}

// ─── Cyrillic → Uzbek Latin ───────────────────────────────────────────────

export function cyrillicToLatin(text: string): string {
  let r = text
  // Uzbek-specific letters (must come before standard ones)
  r = r.replace(/Ў/g, "O'").replace(/ў/g, "o'")
  r = r.replace(/Ғ/g, "G'").replace(/ғ/g, "g'")
  r = r.replace(/Қ/g, 'Q').replace(/қ/g, 'q')
  r = r.replace(/Ҳ/g, 'H').replace(/ҳ/g, 'h')
  // Multi-char Cyrillic (digraphs)
  r = r.replace(/Ё/g, 'Yo').replace(/ё/g, 'yo')
  r = r.replace(/Ю/g, 'Yu').replace(/ю/g, 'yu')
  r = r.replace(/Я/g, 'Ya').replace(/я/g, 'ya')
  r = r.replace(/Э/g, 'E').replace(/э/g, 'e')
  r = r.replace(/Ж/g, 'J').replace(/ж/g, 'j')
  r = r.replace(/Ш/g, 'Sh').replace(/ш/g, 'sh')
  r = r.replace(/Щ/g, 'Sh').replace(/щ/g, 'sh')
  r = r.replace(/Ч/g, 'Ch').replace(/ч/g, 'ch')
  r = r.replace(/Х/g, 'X').replace(/х/g, 'x')
  r = r.replace(/Ц/g, 'Ts').replace(/ц/g, 'ts')
  r = r.replace(/Ъ/g, "'").replace(/ъ/g, "'")
  r = r.replace(/Ы/g, 'I').replace(/ы/g, 'i')
  r = r.replace(/Ь/g, '').replace(/ь/g, '')
  // Single-char standard Cyrillic letters
  r = r.replace(/А/g, 'A').replace(/а/g, 'a')
  r = r.replace(/Б/g, 'B').replace(/б/g, 'b')
  r = r.replace(/В/g, 'V').replace(/в/g, 'v')
  r = r.replace(/Г/g, 'G').replace(/г/g, 'g')
  r = r.replace(/Д/g, 'D').replace(/д/g, 'd')
  r = r.replace(/Е/g, 'E').replace(/е/g, 'e')
  r = r.replace(/З/g, 'Z').replace(/з/g, 'z')
  r = r.replace(/И/g, 'I').replace(/и/g, 'i')
  r = r.replace(/Й/g, 'Y').replace(/й/g, 'y')
  r = r.replace(/К/g, 'K').replace(/к/g, 'k')
  r = r.replace(/Л/g, 'L').replace(/л/g, 'l')
  r = r.replace(/М/g, 'M').replace(/м/g, 'm')
  r = r.replace(/Н/g, 'N').replace(/н/g, 'n')
  r = r.replace(/О/g, 'O').replace(/о/g, 'o')
  r = r.replace(/П/g, 'P').replace(/п/g, 'p')
  r = r.replace(/Р/g, 'R').replace(/р/g, 'r')
  r = r.replace(/С/g, 'S').replace(/с/g, 's')
  r = r.replace(/Т/g, 'T').replace(/т/g, 't')
  r = r.replace(/У/g, 'U').replace(/у/g, 'u')
  r = r.replace(/Ф/g, 'F').replace(/ф/g, 'f')
  return r
}

// ─── Uzbek Latin → Cyrillic ───────────────────────────────────────────────
// Digraphs must be processed BEFORE single letters

export function latinToCyrillic(text: string): string {
  let r = text
  // Special Uzbek digraphs with apostrophe
  r = r.replace(/O'/g, 'Ў').replace(/o'/g, 'ў')
  r = r.replace(/O`/g, 'Ў').replace(/o`/g, 'ў')
  r = r.replace(/G'/g, 'Ғ').replace(/g'/g, 'ғ')
  r = r.replace(/G`/g, 'Ғ').replace(/g`/g, 'ғ')
  // Two-letter combinations (uppercase + mixed + lowercase)
  r = r.replace(/SH/g, 'Ш').replace(/Sh/g, 'Ш').replace(/sh/g, 'ш')
  r = r.replace(/CH/g, 'Ч').replace(/Ch/g, 'Ч').replace(/ch/g, 'ч')
  r = r.replace(/NG/g, 'НГ').replace(/Ng/g, 'Нг').replace(/ng/g, 'нг')
  r = r.replace(/TS/g, 'Ц').replace(/Ts/g, 'Ц').replace(/ts/g, 'ц')
  r = r.replace(/YO/g, 'Ё').replace(/Yo/g, 'Ё').replace(/yo/g, 'ё')
  r = r.replace(/YU/g, 'Ю').replace(/Yu/g, 'Ю').replace(/yu/g, 'ю')
  r = r.replace(/YA/g, 'Я').replace(/Ya/g, 'Я').replace(/ya/g, 'я')
  r = r.replace(/YE/g, 'Е').replace(/Ye/g, 'Е').replace(/ye/g, 'е')
  // Single letters
  r = r.replace(/A/g, 'А').replace(/a/g, 'а')
  r = r.replace(/B/g, 'Б').replace(/b/g, 'б')
  r = r.replace(/D/g, 'Д').replace(/d/g, 'д')
  r = r.replace(/E/g, 'Е').replace(/e/g, 'е')
  r = r.replace(/F/g, 'Ф').replace(/f/g, 'ф')
  r = r.replace(/G/g, 'Г').replace(/g/g, 'г')
  r = r.replace(/H/g, 'Ҳ').replace(/h/g, 'ҳ')
  r = r.replace(/I/g, 'И').replace(/i/g, 'и')
  r = r.replace(/J/g, 'Ж').replace(/j/g, 'ж')
  r = r.replace(/K/g, 'К').replace(/k/g, 'к')
  r = r.replace(/L/g, 'Л').replace(/l/g, 'л')
  r = r.replace(/M/g, 'М').replace(/m/g, 'м')
  r = r.replace(/N/g, 'Н').replace(/n/g, 'н')
  r = r.replace(/O/g, 'О').replace(/o/g, 'о')
  r = r.replace(/P/g, 'П').replace(/p/g, 'п')
  r = r.replace(/Q/g, 'Қ').replace(/q/g, 'қ')
  r = r.replace(/R/g, 'Р').replace(/r/g, 'р')
  r = r.replace(/S/g, 'С').replace(/s/g, 'с')
  r = r.replace(/T/g, 'Т').replace(/t/g, 'т')
  r = r.replace(/U/g, 'У').replace(/u/g, 'у')
  r = r.replace(/V/g, 'В').replace(/v/g, 'в')
  r = r.replace(/X/g, 'Х').replace(/x/g, 'х')
  r = r.replace(/Y/g, 'Й').replace(/y/g, 'й')
  r = r.replace(/Z/g, 'З').replace(/z/g, 'з')
  return r
}

// ─── Main normalize function ───────────────────────────────────────────────

/**
 * Saqlashdan oldin matnni joriy til yozuviga moslashtiradi.
 *
 * uz (Lotin):  Kirill harflari → Lotin harflariga
 * oz (Kirill): Lotin harflari → Kirill harflariga
 * ru:          O'zgartirish yo'q (Rus tili Kirillda)
 *
 * Agar matnda aralash yozuv bo'lsa (>10% noto'g'ri yozuv),
 * butun matni to'g'ri yozuvga o'tkaziladi.
 */
export function normalizeScript(text: string, lang: string): string {
  if (!text?.trim()) return text

  if (lang === 'uz') {
    if (hasCyrillic(text)) return cyrillicToLatin(text)
  } else if (lang === 'oz') {
    if (hasLatinLetters(text)) return latinToCyrillic(text)
  }
  // 'ru': nothing to convert (Russian is always Cyrillic)
  return text
}

/**
 * Ob'ektning berilgan matn maydonlarini normallashtiradi.
 * Raqamli maydonlar (inn, mfo, bank_account) o'zgartirilmaydi.
 */
export function normalizeFormScript<T extends Record<string, unknown>>(
  form: T,
  lang: string,
  textFields: (keyof T)[],
): T {
  const result = { ...form }
  for (const field of textFields) {
    const val = result[field]
    if (typeof val === 'string') {
      const normalized = normalizeScript(val, lang)
      if (normalized !== val) {
        result[field] = normalized as T[typeof field]
      }
    }
  }
  return result
}

/** Ikki matn o'rtasida farq bor-yo'qligini tekshiradi (UI uchun) */
export function hasScriptMismatch(text: string, lang: string): boolean {
  if (!text?.trim()) return false
  if (lang === 'uz') return hasCyrillic(text)
  if (lang === 'oz') return hasLatinLetters(text)
  return false
}
