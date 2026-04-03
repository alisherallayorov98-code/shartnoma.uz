// Input formatting utilities for Uzbek phone numbers and digit-only fields

/** Format phone as +998 XX XXX-XX-XX */
export function formatPhoneUz(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const national = digits.startsWith('998') ? digits.slice(3) : digits
  const d = national.slice(0, 9)
  let out = '+998'
  if (d.length === 0) return out
  out += ' ' + d.slice(0, 2)
  if (d.length > 2) out += ' ' + d.slice(2, 5)
  if (d.length > 5) out += '-' + d.slice(5, 7)
  if (d.length > 7) out += '-' + d.slice(7, 9)
  return out
}

/** Keep only digits, optionally capped at maxLen */
export function filterDigits(value: string, maxLen?: number): string {
  const digits = value.replace(/\D/g, '')
  return maxLen !== undefined ? digits.slice(0, maxLen) : digits
}
