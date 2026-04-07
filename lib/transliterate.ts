/**
 * transliterate.ts — O'zbek lotin ↔ kirill o'girgich.
 * AI aralashuvisiz, tez va aniq ishlaydi.
 *
 * Qo'llab-quvvatlash:
 *   latinToCyrillic(text)  — uz  → oz
 *   cyrillicToLatin(text)  — oz  → uz
 *   transliterate(text, from, to) — universal
 */

import type { Lang } from './i18n'

// ── Latin → Kirill xaritasi ────────────────────────────────────────────────
// Tartib muhim: ko'p belgili juftlar avval keladi (sh, ch, ng, o', g')
const LAT_TO_CYR: [string, string][] = [
  // Tutuq belgisi bilan (apostrof va grave variantlari)
  ["O'", 'Ў'], ["o'", 'ў'],
  ['O`', 'Ў'], ['o`', 'ў'],
  ['Oʻ', 'Ў'], ['oʻ', 'ў'],   // U+02BB modifier letter turned comma
  ["G'", 'Ғ'], ["g'", 'ғ'],
  ['G`', 'Ғ'], ['g`', 'ғ'],
  ['Gʻ', 'Ғ'], ['gʻ', 'ғ'],

  // Ikki harfli birikmalar (katta → kichik)
  ['SH', 'Ш'], ['Sh', 'Ш'], ['sh', 'ш'],
  ['CH', 'Ч'], ['Ch', 'Ч'], ['ch', 'ч'],
  ['NG', 'НГ'], ['Ng', 'Нг'], ['ng', 'нг'],
  ['TS', 'ТС'], ['Ts', 'Тс'], ['ts', 'тс'],

  // Yakka harflar (katta → kichik)
  ['A', 'А'], ['a', 'а'],
  ['B', 'Б'], ['b', 'б'],
  ['D', 'Д'], ['d', 'д'],
  ['E', 'Е'], ['e', 'е'],
  ['F', 'Ф'], ['f', 'ф'],
  ['G', 'Г'], ['g', 'г'],
  ['H', 'Ҳ'], ['h', 'ҳ'],
  ['I', 'И'], ['i', 'и'],
  ['J', 'Ж'], ['j', 'ж'],
  ['K', 'К'], ['k', 'к'],
  ['L', 'Л'], ['l', 'л'],
  ['M', 'М'], ['m', 'м'],
  ['N', 'Н'], ['n', 'н'],
  ['O', 'О'], ['o', 'о'],
  ['P', 'П'], ['p', 'п'],
  ['Q', 'Қ'], ['q', 'қ'],
  ['R', 'Р'], ['r', 'р'],
  ['S', 'С'], ['s', 'с'],
  ['T', 'Т'], ['t', 'т'],
  ['U', 'У'], ['u', 'у'],
  ['V', 'В'], ['v', 'в'],
  ['X', 'Х'], ['x', 'х'],
  ['Y', 'Й'], ['y', 'й'],
  ['Z', 'З'], ['z', 'з'],
]

// ── Kirill → Latin xaritasi ────────────────────────────────────────────────
const CYR_TO_LAT: [string, string][] = [
  // O'zbek maxsus harflari (avval)
  ['Ў', "O'"], ['ў', "o'"],
  ['Ғ', "G'"], ['ғ', "g'"],
  ['Қ', 'Q'],  ['қ', 'q'],
  ['Ҳ', 'H'],  ['ҳ', 'h'],
  ['Ъ', "'"],  ['ъ', "'"],    // qattiq belgi → apostrof

  // НГ / Нг / нг — ng dan avval (noto'g'ri ajralmaslik uchun)
  ['НГ', 'NG'], ['Нг', 'Ng'], ['нг', 'ng'],

  // Ikki harfdan hosil bo'ladigan kirill harflari
  ['Ш', 'Sh'], ['ш', 'sh'],
  ['Ч', 'Ch'], ['ч', 'ch'],
  ['Щ', 'Sh'], ['щ', 'sh'],   // ruscha, lekin uchrab qoladi
  ['Ж', 'J'],  ['ж', 'j'],
  ['Ё', "Yo"], ['ё', "yo"],
  ['Ю', 'Yu'], ['ю', 'yu'],
  ['Я', 'Ya'], ['я', 'ya'],
  ['Э', 'E'],  ['э', 'e'],

  // Yakka harflar
  ['А', 'A'], ['а', 'a'],
  ['Б', 'B'], ['б', 'b'],
  ['Д', 'D'], ['д', 'd'],
  ['Е', 'E'], ['е', 'e'],
  ['Ф', 'F'], ['ф', 'f'],
  ['Г', 'G'], ['г', 'g'],
  ['И', 'I'], ['и', 'i'],
  ['К', 'K'], ['к', 'k'],
  ['Л', 'L'], ['л', 'l'],
  ['М', 'M'], ['м', 'm'],
  ['Н', 'N'], ['н', 'n'],
  ['О', 'O'], ['о', 'o'],
  ['П', 'P'], ['п', 'p'],
  ['Р', 'R'], ['р', 'r'],
  ['С', 'S'], ['с', 's'],
  ['Т', 'T'], ['т', 't'],
  ['У', 'U'], ['у', 'u'],
  ['В', 'V'], ['в', 'v'],
  ['Х', 'X'], ['х', 'x'],
  ['Й', 'Y'], ['й', 'y'],
  ['З', 'Z'], ['з', 'z'],
  ['Ц', 'Ts'], ['ц', 'ts'],
]

// ── Yordamchi: xaritani matnга qo'llash ──────────────────────────────────
function applyMap(text: string, map: [string, string][]): string {
  let result = text
  for (const [from, to] of map) {
    // split+join — global replaceAll dan tezroq, RegExp kerak emas
    result = result.split(from).join(to)
  }
  return result
}

// ── Ochiq API ─────────────────────────────────────────────────────────────

/** O'zbek lotin matnni kirillga o'giradi (uz → oz) */
export function latinToCyrillic(text: string): string {
  return applyMap(text, LAT_TO_CYR)
}

/** O'zbek kirill matnni lotinga o'giradi (oz → uz) */
export function cyrillicToLatin(text: string): string {
  return applyMap(text, CYR_TO_LAT)
}

/**
 * Universal o'giruvchi.
 * - `from === to` bo'lsa yoki `ru` bo'lsa — o'zgarmaydi.
 * - `uz → oz` → latinToCyrillic
 * - `oz → uz` → cyrillicToLatin
 */
export function transliterate(text: string, from: Lang, to: Lang): string {
  if (from === to) return text
  if (from === 'uz' && to === 'oz') return latinToCyrillic(text)
  if (from === 'oz' && to === 'uz') return cyrillicToLatin(text)
  return text   // ru ↔ uz/oz o'girish qo'llab-quvvatlanmaydi
}
