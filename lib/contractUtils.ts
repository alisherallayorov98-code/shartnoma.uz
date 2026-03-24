// ─── Contract template placeholder utilities ──────────────────────────────────
import { formatDateUz } from './contractStructures'

export type PlaceholderData = {
  contract_number?: string
  contract_date?: string
  city?: string
  amount?: number | string
  organizations?: { name?: string; inn?: string; address?: string; director_name?: string } | null
  counterparties?: { name?: string; inn?: string; address?: string; director_name?: string } | null
  ijara_manzil?: string
  ijara_maydon?: string
  oylik_tolov?: string
  ijara_muddat?: string
  ijara_boshlanish?: string
  ijara_tugash?: string
  xizmat_tavsif?: string
  xizmat_boshlanish?: string
  xizmat_tugash?: string
  xizmat_tolov?: string
  pudrat_obekt?: string
  pudrat_tavsif?: string
  pudrat_boshlanish?: string
  pudrat_tugash?: string
  qarz_maqsad?: string
  qarz_foiz?: string
  qarz_muddat?: string
  daval_material?: string
  daval_mahsulot?: string
  incoterms?: string
  yetkazish_joy?: string
  yetkazish_muddat?: string
  tolov_usuli?: string
  valyuta?: string
  asosiy_raqam?: string
  asosiy_sana?: string
  ozgartirish?: string
  product_name?: string
}

export function fillPlaceholders(content: string, c: PlaceholderData): string {
  const amount = Number(c.amount || 0)
  const amountText = amount > 0 ? amount.toLocaleString('uz-UZ') + " so'm" : '___'
  const oylik = Number(c.oylik_tolov || 0)
  const oylikText = oylik > 0 ? oylik.toLocaleString('uz-UZ') + " so'm" : ''

  const map: Record<string, string> = {
    // Core
    '{{RAQAM}}':              c.contract_number || '',
    '{{SANA}}':               formatDateUz(c.contract_date),
    '{{SHAHAR}}':             c.city || 'Toshkent',
    // Parties
    '{{BUYURTMACHI}}':        c.organizations?.name || '___',
    '{{BUYURTMACHI_INN}}':    c.organizations?.inn || '___',
    '{{BUYURTMACHI_RAHBAR}}': c.organizations?.director_name || '___',
    '{{IJROCHI}}':            c.counterparties?.name || '___',
    '{{IJROCHI_INN}}':        c.counterparties?.inn || '___',
    '{{IJROCHI_RAHBAR}}':     c.counterparties?.director_name || '___',
    // Amount
    '{{SUMMA}}':              amount.toLocaleString('uz-UZ'),
    '{{SUMMA_MATN}}':         amountText,
    // Ijara
    '{{IJARA_MANZIL}}':       c.ijara_manzil || '___',
    '{{IJARA_MAYDON}}':       c.ijara_maydon || '___',
    '{{OYLIK_TOLOV}}':        oylik ? oylik.toLocaleString('uz-UZ') : '___',
    '{{OYLIK_TOLOV_MATN}}':   oylikText || '___',
    '{{IJARA_MUDDAT}}':       c.ijara_muddat || '___',
    '{{IJARA_BOSHLANISH}}':   c.ijara_boshlanish || '___',
    '{{IJARA_TUGASH}}':       c.ijara_tugash || '___',
    // Xizmat
    '{{XIZMAT_TAVSIF}}':      c.xizmat_tavsif || '___',
    '{{XIZMAT_BOSHLANISH}}':  c.xizmat_boshlanish || '___',
    '{{XIZMAT_TUGASH}}':      c.xizmat_tugash || '___',
    '{{XIZMAT_TOLOV}}':       c.xizmat_tolov || '___',
    // Pudrat
    '{{PUDRAT_OBEKT}}':       c.pudrat_obekt || '___',
    '{{PUDRAT_TAVSIF}}':      c.pudrat_tavsif || '___',
    '{{PUDRAT_BOSHLANISH}}':  c.pudrat_boshlanish || '___',
    '{{PUDRAT_TUGASH}}':      c.pudrat_tugash || '___',
    // Moliyaviy/qarz
    '{{QARZ_MAQSAD}}':        c.qarz_maqsad || '___',
    '{{QARZ_FOIZ}}':          c.qarz_foiz || '___',
    '{{QARZ_MUDDAT}}':        c.qarz_muddat || '___',
    '{{QARZ_TARTIB}}':        '___',
    // Daval
    '{{DAVAL_MATERIAL}}':     c.daval_material || '___',
    '{{DAVAL_MAHSULOT}}':     c.daval_mahsulot || '___',
    '{{DAVAL_MIQDOR}}':       '___',
    '{{DAVAL_MUDDAT}}':       '___',
    // Xalqaro
    '{{INCOTERMS}}':          c.incoterms || '___',
    '{{YETKAZISH_JOY}}':      c.yetkazish_joy || '___',
    '{{YETKAZISH_MUDDAT}}':   c.yetkazish_muddat || '___',
    '{{TOLOV_USULI}}':        c.tolov_usuli || '___',
    '{{VALYUTA}}':            c.valyuta || 'USD',
    // Oldi-sotdi
    '{{TOVAR_NOMI}}':         c.product_name || '___',
    // Qo'shimcha
    '{{ASOSIY_RAQAM}}':       c.asosiy_raqam || '___',
    '{{ASOSIY_SANA}}':        c.asosiy_sana || '___',
    '{{OZGARTIRISH}}':        c.ozgartirish || '___',
  }
  return content.replace(/\{\{[A-Z_]+\}\}/g, (key) => map[key] ?? key)
}
