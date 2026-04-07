'use client'

/**
 * I18nProvider — next-intl ni mavjud LanguageContext bilan bog'laydi.
 *
 * `LanguageProvider` ichida joylashtirilishi kerak — u yerdan `lang` o'qiladi.
 * Til o'zgarganda `messages` avtomatik yangilanadi va barcha
 * `useTranslations()` chaqiruvlari qayta render bo'ladi.
 */

import { ReactNode, useMemo } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { useLang } from './LanguageContext'
import { getMessages } from './messages'

export function I18nProvider({ children }: { children: ReactNode }) {
  const { lang } = useLang()

  // useMemo: til o'zgarmasa messages qayta hisoblanmaydi
  const messages = useMemo(() => getMessages(lang), [lang])

  return (
    <NextIntlClientProvider locale={lang} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
