'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/lib/LanguageContext'
import { type Lang } from '@/lib/i18n'

const DEFAULT_STAGES: Record<Lang, string[]> = {
  uz: ['Matn tahlil qilinmoqda...', 'AI ishlamoqda...', 'Natija tayyorlanmoqda...', 'Yakunlanmoqda...'],
  oz: ['Матн таҳлил қилинмоқда...', 'AI ишламоқда...', 'Натижа тайёрланмоқда...', 'Якунланмоқда...'],
  ru: ['Анализируется текст...', 'AI работает...', 'Готовится результат...', 'Завершается...'],
}

const PROGRESS_STEPS = [15, 40, 70, 92]

interface Props {
  stages?: Record<Lang, string[]>
  intervalMs?: number
}

export default function AiProgressIndicator({ stages = DEFAULT_STAGES, intervalMs = 3000 }: Props) {
  const { lang } = useLang()
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(PROGRESS_STEPS[0])

  useEffect(() => {
    setStep(0)
    setProgress(PROGRESS_STEPS[0])
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        const next = Math.min(prev + 1, stages[lang].length - 1)
        setProgress(PROGRESS_STEPS[next] ?? 92)
        return next
      })
    }, intervalMs)
    return () => clearInterval(timer)
  }, [lang, stages, intervalMs])

  return (
    <div className="flex flex-col items-center py-8 gap-4">
      {/* Spinner */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20"/>
        <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"/>
        <div className="absolute inset-2 rounded-full border border-orange-500/40 border-b-transparent animate-spin [animation-direction:reverse] [animation-duration:1.5s]"/>
      </div>

      {/* Stage text */}
      <div className="text-center">
        <div className="text-white text-sm font-medium mb-0.5">{stages[lang][step]}</div>
        <div className="text-gray-500 text-xs">Kabinetim AI</div>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-orange-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
