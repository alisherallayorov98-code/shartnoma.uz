'use client'

/**
 * useT() — professional i18n hook.
 *
 * Mavjud pattern:
 *   const { lang } = useLang()
 *   const T = (obj: Record<Lang, string>) => tr(obj, lang)
 *
 * Yangi pattern (bu hook orqali):
 *   const T = useT()
 *
 * Afzalligi: komponent Context ga to'g'ridan-to'g'ri obuna bo'ladi —
 * til almashganda, `lang` prop sifatida uzatilmasa ham, avtomatik qayta render bo'ladi.
 */

import { tr, type Lang } from './i18n'
import { useLang } from './LanguageContext'
import { latinToCyrillic } from './transliterate'

export function useT(): (obj: Record<Lang, string>) => string {
  const { lang } = useLang()
  return (obj: Record<Lang, string>) => {
    // oz uchun: oz qiymati mavjud bo'lsa — ishlatiladi,
    // aks holda uz qiymatini avtomatik kirillga o'giradi
    if (lang === 'oz' && !obj.oz && obj.uz) {
      return latinToCyrillic(obj.uz)
    }
    return tr(obj, lang)
  }
}
