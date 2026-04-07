/**
 * AI Output Post-Processor
 * AI dan kelgan matnni eksport yoki saqlashdan oldin tozalash va normalizatsiya qilish.
 */

// ─── Markdown → Plain text ────────────────────────────────────────────────────

/**
 * Markdown sarlavhalarni (`# Sarlavha`, `## Bo'lim`) katta harfli matn yoki
 * raqamlangan bo'lim sifatida qaytaradi.
 */
function stripMarkdownHeadings(text: string): string {
  return text.replace(/^#{1,6}\s+(.+)$/gm, (_, title: string) => title.trim().toUpperCase())
}

/** `**matn**` va `__matn__` → `matn` */
function stripBold(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
}

/** `*matn*` va `_matn_` → `matn` */
function stripItalic(text: string): string {
  return text
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1')
}

/** ` ```...``` ` va `` `kod` `` → kod matni */
function stripCodeBlocks(text: string): string {
  // Multi-line code fences
  text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code: string) => code.trim())
  // Inline code
  text = text.replace(/`([^`]+)`/g, '$1')
  return text
}

/** `---`, `===`, `***` (horizontal rules) → olib tashlash */
function stripHorizontalRules(text: string): string {
  return text.replace(/^[ \t]*(?:[-*_][ \t]*){3,}[ \t]*$/gm, '')
}

/** Markdown havolalar `[Matn](url)` → `Matn` */
function stripLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

/** HTML teglarini olib tashlash */
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]+>/g, '')
}

/**
 * Markdown ro'yxat belgisini (`- item`, `* item`) standart `– item` ko'rinishiga
 * o'tkazish. Raqamli ro'yxat (`1. item`) o'zgarishsiz qoladi.
 */
function normalizeLists(text: string): string {
  return text.replace(/^[ \t]*[-*+][ \t]+(.+)$/gm, '– $1')
}

// ─── Bo'sh qatorlar va whitespace ─────────────────────────────────────────────

/** 3 yoki undan ko'p ketma-ket bo'sh qatorni → bitta bo'sh qatorga tushirish */
function collapseBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n')
}

/** Har bir qatorning oxiridagi bo'sh joyni olib tashlash */
function trimLineEnds(text: string): string {
  return text.replace(/[ \t]+$/gm, '')
}

/** Non-breaking space (`\u00A0`, `\u2009`, `\u202F` va boshqalar) → oddiy bo'shliq */
function normalizeSpaces(text: string): string {
  return text.replace(/[\u00A0\u2009\u200A\u202F\u205F\u3000]/g, ' ')
}

/** Windows `\r\n` → Unix `\n` */
function normalizeCrlf(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

// ─── Shartnoma spetsifik ─────────────────────────────────────────────────────

/**
 * AI ba'zan sarlavha va birinchi band orasiga ortiqcha bo'sh qator
 * qo'shadi. Bo'lim sarlavhasi (`1. BO'LIM`) dan keyin 2+ bo'sh qator → 1 ta.
 */
function fixSectionSpacing(text: string): string {
  return text.replace(
    /(^[A-ZЎҚҒҲ0-9][A-ZЎҚҒҲ\s\.\-:'"0-9]{4,}$)\n{2,}/gm,
    '$1\n'
  )
}

/**
 * AI ba'zan band oxirida qo'shtirnoq yoki nuqta-vergulni qayta yozadi.
 * Qo'shtirnoq juftligini normalizatsiya qilish (`"` → `"` va `"` qoladi).
 */
function normalizeQuotes(text: string): string {
  return text
    .replace(/\u201C|\u201E/g, '"') // « va similar → "
    .replace(/\u201D/g, '"')        // » → "
    .replace(/\u2018|\u201B/g, "'") // ' → '
    .replace(/\u2019/g, "'")        // ' → '
}

/**
 * AI chiqishida ba'zan `---BEGIN CONTRACT---` yoki `[SHARTNOMA]` kabi
 * texnik teglari qoladi — ularni olib tashlash.
 */
function stripTechnicalMarkers(text: string): string {
  return text
    .replace(/^-{3,}[ \t]*(?:BEGIN|END|START|STOP)?[ \t]*(?:CONTRACT|SHARTNOMA|DOCUMENT)?[ \t]*-{3,}$/gim, '')
    .replace(/^\[(?:SHARTNOMA|CONTRACT|MATN|TEXT|START|END)\]$/gim, '')
    .replace(/^(?:---|\*\*\*|___)[ \t]*$/gm, '')
}

// ─── Asosiy funksiya ─────────────────────────────────────────────────────────

/**
 * AI dan olingan xom matnni eksport yoki saqlashdan oldin tozalaydi.
 *
 * Tartib:
 * 1. CRLF → LF
 * 2. HTML teglar
 * 3. Kod bloklari (mazmunni saqlagan holda)
 * 4. Texnik markerlari
 * 5. Markdown sarlavhalar → katta harf
 * 6. Bold / italic
 * 7. Havolalar
 * 8. Gorizontal chiziqlar
 * 9. Ro'yxat belgilari → `–`
 * 10. Non-breaking spaces
 * 11. Qo'shtirnoq normalizatsiyasi
 * 12. Qator oxiri bo'shliqlar
 * 13. Ortiqcha bo'sh qatorlar
 * 14. Bo'lim oralig'ini tartibga solish
 * 15. Umumiy trim
 */
export function cleanAiText(raw: string): string {
  if (!raw) return ''

  let text = raw

  text = normalizeCrlf(text)
  text = stripHtmlTags(text)
  text = stripCodeBlocks(text)
  text = stripTechnicalMarkers(text)
  text = stripMarkdownHeadings(text)
  text = stripBold(text)
  text = stripItalic(text)
  text = stripLinks(text)
  text = stripHorizontalRules(text)
  text = normalizeLists(text)
  text = normalizeSpaces(text)
  text = normalizeQuotes(text)
  text = trimLineEnds(text)
  text = collapseBlankLines(text)
  text = fixSectionSpacing(text)

  return text.trim()
}

/**
 * AI JSON javobidan shartnoma matnini ajratib oladi va tozalaydi.
 * Qo'llab-quvvatlanadigan maydonlar: `shartnoma`, `shartnoma_yangi`,
 * `tuzatilgan_shartnoma`, `tarjima`, `band`.
 */
export function extractAndCleanContract(parsed: Record<string, unknown>): string {
  const raw =
    (parsed.shartnoma as string) ||
    (parsed.shartnoma_yangi as string) ||
    (parsed.tuzatilgan_shartnoma as string) ||
    (parsed.tarjima as string) ||
    (parsed.band as string) ||
    ''
  return cleanAiText(raw)
}
