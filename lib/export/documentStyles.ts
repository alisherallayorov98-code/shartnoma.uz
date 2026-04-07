/**
 * Universal Document Styler — O'zbekiston standartlari asosida
 * Barcha hujjat eksport funksiyalari (DOCX, PDF) shu yerdan import qiladi.
 */

// ─── Shrift ───────────────────────────────────────────────────────────────────
export const FONT_MAIN = 'Times New Roman'

// ─── Shrift o'lchamlari (DOCX: half-points, PDF: pt) ────────────────────────
export const DOCX_SIZE = {
  title:    32, // 16pt
  heading:  26, // 13pt
  section:  24, // 12pt — asosiy matn
  sub:      24, // 12pt
  small:    22, // 11pt
  caption:  20, // 10pt
  footer:   18, // 9pt
  tableHdr: 18, // 9pt
  tableRow: 20, // 10pt
} as const

export const PDF_SIZE = {
  title:   14,
  heading: 10,
  section:  9.5,
  body:     9.5,
  small:    8.5,
  caption:  8,
  footer:   7,
  tableHdr: 7.5,
  tableRow: 8,
} as const

// ─── O'zbekiston davlat standarti bo'yicha chekkalar ─────────────────────────
// DOCX: twips birligida (1 sm = 567 twips)
export const DOCX_MARGINS = {
  top:    1134, // 2 sm
  bottom: 1134, // 2 sm
  left:   1701, // 3 sm (chapdan)
  right:   851, // 1.5 sm
} as const

// PDF: millimetr birligida
export const PDF_MARGINS = {
  top:    20, // 2 sm
  bottom: 20, // 2 sm
  left:   30, // 3 sm
  right:  15, // 1.5 sm
} as const

// ─── Ranglar ─────────────────────────────────────────────────────────────────
export const COLORS = {
  // DOCX (hex string)
  docx: {
    black:       '000000',
    darkGray:    '333333',
    gray:        '888888',
    lightGray:   'F2F2F2',
    white:       'FFFFFF',
    accent:      '1F3864', // jadval sarlavha foni
    number:      'CC0000', // summalar, raqamlar
    footer:      '999999',
  },
  // PDF (RGB array)
  pdf: {
    black:       [20, 20, 20]    as [number, number, number],
    darkGray:    [40, 40, 40]    as [number, number, number],
    gray:        [80, 80, 80]    as [number, number, number],
    lightGray:   [150, 150, 150] as [number, number, number],
    white:       [255, 255, 255] as [number, number, number],
    tableHeader: [40, 50, 80]    as [number, number, number],
    tableStripe: [248, 249, 255] as [number, number, number],
    tableTotal:  [230, 240, 255] as [number, number, number],
    accent:      [0, 90, 200]    as [number, number, number],
    number:      [180, 30, 30]   as [number, number, number],
  },
} as const

// ─── Qator oralig'i (DOCX: line spacing, 240 = single) ──────────────────────
export const DOCX_LINE_SPACING = {
  single:  240,
  one15:   276, // 1.15
  onehalf: 360, // 1.5
} as const

// ─── Imzo va muhr joyi uchun standart bo'sh joy ───────────────────────────────
// DOCX: spacing after (twips), PDF: mm
export const SIGNATURE_SPACE = {
  docx: 240,
  pdf:  22,
} as const

// ─── Jadval chegaralari (DOCX) ────────────────────────────────────────────────
// BorderStyle va cellBorders contractDocx.ts dan import qilinadi,
// bu yerda faqat rang va o'lchamlarni eksport qilamiz
export const DOCX_BORDER = {
  thinColor:  '888888',
  thinSize:   6,
  midColor:   'CCCCCC',
  midSize:    4,
} as const
