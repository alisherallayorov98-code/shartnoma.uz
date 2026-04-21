'use client'

import { useRouter } from 'next/navigation'
import { useDashboard } from '../../context'
import dynamic from 'next/dynamic'

const BuyruqMaker = dynamic(() => import('../_components/BuyruqMaker'), { ssr: false })

export default function BuyruqPage() {
  const router = useRouter()
  const { activeOrg } = useDashboard()

  return (
    <main className="flex-1 overflow-auto bg-[#0B1220]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/dashboard/kotiba')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#1F2937] transition">
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">📜 Buyruq</h1>
            <p className="text-xs text-gray-500">Mulk sotib olish, sotish, hisobdan chiqarish buyruqlari</p>
          </div>
        </div>
        {activeOrg ? (
          <BuyruqMaker
            orgName={activeOrg.name}
            orgDirector={activeOrg.director_name}
          />
        ) : (
          <div className="text-gray-500 text-sm text-center py-12">Tashkilot tanlanmagan</div>
        )}
      </div>
    </main>
  )
}
