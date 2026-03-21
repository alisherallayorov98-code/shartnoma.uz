function localDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getAiUsedToday(): number {
  if (typeof window === 'undefined') return 0
  try {
    const stored = localStorage.getItem('ai_usage')
    if (!stored) return 0
    const { date, count } = JSON.parse(stored)
    return date === localDateStr() ? count : 0
  } catch { return 0 }
}

export function incrementAiUsage() {
  try {
    const cur = getAiUsedToday()
    localStorage.setItem('ai_usage', JSON.stringify({ date: localDateStr(), count: cur + 1 }))
  } catch { /* */ }
}
