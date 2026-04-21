'use client'

import { useRouter } from 'next/navigation'
import { useDashboard } from '../../context'
import dynamic from 'next/dynamic'

const FakturaBuilder = dynamic(() => import('../_components/FakturaBuilder'), { ssr: false })

export default function FakturaPage() {
  const router = useRouter()
  const { activeOrg, cps, contracts } = useDashboard()

  return (
    <main className="flex-1 overflow-auto bg-[#0B1220]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/dashboard/buxgalter')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition">
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">🧾 Hisob-faktura</h1>
            <p className="text-xs text-gray-500">Schyot-faktura yaratish va Word eksport</p>
          </div>
        </div>
        <FakturaBuilder org={activeOrg} cps={cps} contracts={contracts} />
      </div>
    </main>
  )
}
