'use client'

import { tr, type Lang } from '@/lib/i18n'
import { type FeatureConfig, type KotibaFeature } from '../_config/features'

export default function FeatureCards({
  features, onSelect, lang,
}: {
  features: FeatureConfig[]
  onSelect: (key: KotibaFeature) => void
  lang: Lang
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {features.map(f => (
        <button key={f.key} onClick={() => onSelect(f.key)}
          className="bg-[#111827] border border-[#1E293B] hover:border-blue-600/50 hover:bg-[#1F2937] rounded-xl p-5 text-left transition group">
          <div className="text-2xl mb-3">{f.icon}</div>
          <div className="font-semibold text-white text-sm mb-1 group-hover:text-blue-400 transition">{tr(f.title, lang)}</div>
          <div className="text-xs text-gray-500 leading-relaxed">{tr(f.description, lang)}</div>
        </button>
      ))}
    </div>
  )
}
