#!/usr/bin/env node
/**
 * audit-i18n.js — i18n kalitlarini audit qiluvchi skript.
 *
 * Nima qiladi:
 *   1. lib/i18n.ts dan barcha kalitlarni o'qiydi (namespace.key)
 *   2. Loyihadagi barcha .tsx/.ts fayllarni skanerlab t.xxx.yyy ishlatilishini topadi
 *   3. Hisobot chiqaradi:
 *      - Kodda ishlatilgan lekin i18n.ts da yo'q kalitlar
 *      - i18n.ts da bor, lekin oz yoki ru bo'sh/yo'q kalitlar
 *      - Foydalanilmayotgan kalitlar
 *
 * Ishlatish: node scripts/audit-i18n.js
 */

const fs   = require('fs')
const path = require('path')

const ROOT      = path.join(__dirname, '..')
const I18N_FILE = path.join(ROOT, 'lib', 'i18n.ts')
const SCAN_DIRS = ['app', 'lib', 'components']
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'scripts'])

// ── ANSI ranglar ──────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
}
const clr  = (c, s) => `${c}${s}${C.reset}`
const bold = s => clr(C.bold, s)
const red  = s => clr(C.red, s)
const yel  = s => clr(C.yellow, s)
const grn  = s => clr(C.green, s)
const cyn  = s => clr(C.cyan, s)
const gry  = s => clr(C.gray, s)

// ─────────────────────────────────────────────────────────────────────────────
// 1. lib/i18n.ts ni tahlil qilish
// ─────────────────────────────────────────────────────────────────────────────

function parseI18n(filePath) {
  const src    = fs.readFileSync(filePath, 'utf8')
  const keys   = {}   // 'namespace.key' → { uz, oz, ru }

  // Namespace bloklarini ajratib olish
  // Misol: "  nav: {" yoki "  btn: {"
  const nsRegex = /^\s{2}(\w+)\s*:\s*\{/gm
  let nsMatch

  while ((nsMatch = nsRegex.exec(src)) !== null) {
    const ns      = nsMatch[1]
    const nsStart = nsMatch.index + nsMatch[0].length

    // Blok tugashini topish (chuqurlikka qarab)
    let depth = 1
    let i     = nsStart
    while (i < src.length && depth > 0) {
      if (src[i] === '{') depth++
      else if (src[i] === '}') depth--
      i++
    }
    const nsBlock = src.slice(nsStart, i - 1)

    // Har bir kalit: "  key: { uz: '...', oz: '...', ru: '...' }"
    // Shuningdek ko'p qatorli variantlar ham uchraydi
    const keyRegex = /(\w+)\s*:\s*\{[^}]*uz\s*:\s*(['"`])(.*?)\2[^}]*\}/gs
    let kMatch

    while ((kMatch = keyRegex.exec(nsBlock)) !== null) {
      const key       = kMatch[1]
      const fullBlock = kMatch[0]

      // uz, oz, ru qiymatlarini ajratish
      const extract = (lang) => {
        const r = new RegExp(`${lang}\\s*:\\s*(['"\`])(.*?)\\1`, 's')
        const m = r.exec(fullBlock)
        return m ? m[2].trim() : ''
      }

      keys[`${ns}.${key}`] = {
        uz: extract('uz'),
        oz: extract('oz'),
        ru: extract('ru'),
      }
    }
  }

  return keys
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Fayllarda t.xxx.yyy ishlatilishini topish
// ─────────────────────────────────────────────────────────────────────────────

function collectFiles(dir) {
  const result = []
  if (!fs.existsSync(dir)) return result

  for (const entry of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = path.join(dir, entry)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      result.push(...collectFiles(full))
    } else if (/\.(tsx?|jsx?)$/.test(entry) && !entry.endsWith('.d.ts')) {
      result.push(full)
    }
  }
  return result
}

function scanUsages(files) {
  // 'namespace.key' → [{ file, line }]
  const usages = {}

  // t.nav.contracts, T(t.btn.save), {t.status.active}, vs.
  const pattern = /\bt\.([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)/g

  // JavaScript metod nomlari — false positive ni oldini olish
  const JS_METHODS = new Set([
    'replace','split','join','map','filter','find','forEach','reduce',
    'includes','indexOf','slice','trim','toLowerCase','toUpperCase',
    'toString','length','push','pop','shift','unshift','sort','reverse',
    'some','every','flat','keys','values','entries','assign','create',
    'call','apply','bind','catch','then','finally','next','return',
  ])

  for (const file of files) {
    const src   = fs.readFileSync(file, 'utf8')
    const lines = src.split('\n')

    for (let ln = 0; ln < lines.length; ln++) {
      let m
      const line = lines[ln]
      // Reset lastIndex for global regex
      pattern.lastIndex = 0
      while ((m = pattern.exec(line)) !== null) {
        const ns  = m[1]
        const key = m[2]
        // JS metod yoki native property bo'lsa — o'tkazib yuborish
        if (JS_METHODS.has(key) || JS_METHODS.has(ns)) continue
        const fullKey = `${ns}.${key}`
        if (!usages[fullKey]) usages[fullKey] = []
        usages[fullKey].push({
          file: path.relative(ROOT, file).replace(/\\/g, '/'),
          line: ln + 1,
        })
      }
    }
  }

  return usages
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Hisobot
// ─────────────────────────────────────────────────────────────────────────────

function printSection(title, color) {
  console.log()
  console.log(color + '─'.repeat(60) + C.reset)
  console.log(bold(color + title + C.reset))
  console.log(color + '─'.repeat(60) + C.reset)
}

function main() {
  console.log()
  console.log(bold(cyn('  🔍  i18n Kalitlari Auditi')))
  console.log(gry('  lib/i18n.ts ↔ manba fayllar tekshirilmoqda...\n'))

  // 1. i18n.ts ni tahlil qilish
  const i18nKeys = parseI18n(I18N_FILE)
  const i18nSet  = new Set(Object.keys(i18nKeys))
  console.log(gry(`  i18n.ts: ${i18nSet.size} ta kalit topildi`))

  // 2. Manba fayllarini skanerlash
  const allFiles = SCAN_DIRS.flatMap(d => collectFiles(path.join(ROOT, d)))
  console.log(gry(`  Skaner: ${allFiles.length} ta fayl`))

  const usages    = scanUsages(allFiles)
  const usedSet   = new Set(Object.keys(usages))

  // ── A: Kodda bor, i18n.ts da yo'q ─────────────────────────────
  const missingInI18n = [...usedSet].filter(k => !i18nSet.has(k))

  printSection('A. Kodda ishlatilgan, i18n.ts da YO\'Q kalitlar', C.red)
  if (missingInI18n.length === 0) {
    console.log(grn('  ✓ Barcha ishlatilgan kalitlar mavjud!'))
  } else {
    for (const key of missingInI18n.sort()) {
      console.log(`  ${red('✗')} ${bold(key)}`)
      const locs = usages[key].slice(0, 3)
      for (const loc of locs) {
        console.log(`      ${gry(loc.file + ':' + loc.line)}`)
      }
      if (usages[key].length > 3) {
        console.log(`      ${gry(`... yana ${usages[key].length - 3} ta joy`)}`)
      }
    }
  }

  // ── B: oz yoki ru bo'sh ───────────────────────────────────────
  const incompleteKeys = Object.entries(i18nKeys).filter(([, v]) => !v.oz || !v.ru)

  printSection('B. Tarjimasi to\'liq bo\'lmagan kalitlar (oz yoki ru bo\'sh)', C.yellow)
  if (incompleteKeys.length === 0) {
    console.log(grn('  ✓ Barcha kalitlarning oz va ru tarjimalari to\'liq!'))
  } else {
    for (const [key, val] of incompleteKeys.sort((a, b) => a[0].localeCompare(b[0]))) {
      const missing = []
      if (!val.oz) missing.push('oz')
      if (!val.ru) missing.push('ru')
      console.log(`  ${yel('!')} ${bold(key)}  ${gry('[' + missing.join(', ') + ' bo\'sh]')}`)
      console.log(`      uz: "${val.uz}"`)
    }
  }

  // ── C: i18n.ts da bor, kodda ishlatilmayotgan ─────────────────
  const unusedKeys = [...i18nSet].filter(k => !usedSet.has(k))

  printSection('C. i18n.ts da bor, kodda ISHLATILMAYOTGAN kalitlar', C.gray)
  if (unusedKeys.length === 0) {
    console.log(grn('  ✓ Barcha kalitlar ishlatilmoqda!'))
  } else {
    for (const key of unusedKeys.sort()) {
      console.log(`  ${gry('○')} ${gry(key)}`)
    }
    console.log(gry(`\n  Jami: ${unusedKeys.length} ta (keyinchalik o'chirilishi mumkin)`))
  }

  // ── Yakuniy hisobot ────────────────────────────────────────────
  printSection('Xulosa', C.blue)
  const total = i18nSet.size
  const miss  = missingInI18n.length
  const inc   = incompleteKeys.length
  const unu   = unusedKeys.length
  const ok    = total - inc - unu

  console.log(`  ${gry('Jami kalitlar:')}      ${bold(total)}`)
  console.log(`  ${grn('To\'liq tarjima:')}    ${bold(grn(ok))}`)
  console.log(`  ${yel('Noto\'liq tarjima:')} ${bold(yel(inc))}`)
  console.log(`  ${red('Kod da yo\'q:')}       ${bold(red(miss))}`)
  console.log(`  ${gry('Ishlatilmagan:')}      ${bold(gry(unu))}`)
  console.log()

  if (miss > 0 || inc > 0) {
    process.exit(1)   // CI uchun: xato bo'lsa non-zero exit
  }
}

main()
