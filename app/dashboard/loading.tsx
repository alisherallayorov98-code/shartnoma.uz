export default function DashboardLoading() {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="h-7 w-48 bg-[#1F2937] rounded-lg animate-pulse"/>
        <div className="h-9 w-32 bg-[#1F2937] rounded-lg animate-pulse"/>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="h-4 w-24 bg-[#1F2937] rounded mb-3"/>
            <div className="h-7 w-16 bg-[#1F2937] rounded"/>
          </div>
        ))}
      </div>
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1E293B] flex items-center gap-3">
          <div className="h-5 w-32 bg-[#1F2937] rounded animate-pulse"/>
          <div className="ml-auto h-8 w-48 bg-[#1F2937] rounded-lg animate-pulse"/>
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-[#1E293B]/50 animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-4 w-28 bg-[#1F2937] rounded"/>
            <div className="h-4 w-20 bg-[#1F2937] rounded"/>
            <div className="h-4 w-32 bg-[#1F2937] rounded"/>
            <div className="ml-auto h-6 w-16 bg-[#1F2937] rounded-full"/>
          </div>
        ))}
      </div>
    </div>
  )
}
