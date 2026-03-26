import type { Lang } from '@/lib/i18n'

// ─── Contract type labels (uz/oz/ru) ─────────────────────────────────────────
// Single source of truth used across all dashboard pages.

export const CONTRACT_TYPES_I18N: Record<string, Record<Lang, string>> = {
  oldi_sotdi: { uz: 'Oldi-sotdi',          oz: 'Олди-сотди',          ru: 'Купля-продажа' },
  xizmat:     { uz: "Xizmat ko'rsatish",   oz: 'Хизмат кўрсатиш',    ru: 'Услуги' },
  ijara:      { uz: 'Ijara',               oz: 'Ижара',               ru: 'Аренда' },
  pudrat:     { uz: 'Pudrat',              oz: 'Пудрат',              ru: 'Подряд' },
  qoshimcha:  { uz: "Qo'shimcha",          oz: 'Қўшимча',             ru: 'Дополнительный' },
  moliyaviy:  { uz: 'Moliyaviy yordam',    oz: 'Молиявий ёрдам',      ru: 'Финансовая помощь' },
  daval:      { uz: 'Daval',               oz: 'Давал',               ru: 'Давальческий' },
  agentlik:   { uz: 'Agentlik',            oz: 'Агентлик',            ru: 'Агентский' },
  transport:  { uz: 'Transport',           oz: 'Транспорт',           ru: 'Транспортный' },
  lizing:     { uz: 'Lizing',              oz: 'Лизинг',              ru: 'Лизинг' },
  xalqaro:    { uz: 'Xalqaro',             oz: 'Халқаро',             ru: 'Международный' },
  boshqa:     { uz: 'Boshqa',              oz: 'Бошқа',               ru: 'Другой' },
}
