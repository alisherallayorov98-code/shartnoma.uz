'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Check } from 'lucide-react'

// Faqat shahar nomi (template " shahri" qo'shadi)
const REGIONS: { name: string; cities: string[] }[] = [
  {
    name: "Toshkent shahri",
    cities: ["Toshkent"],
  },
  {
    name: "Toshkent viloyati",
    cities: ["Nurafshon", "Angren", "Bekobod", "Chirchiq", "Olmaliq", "Yangiyo'l", "Ohangaron", "Qibray", "Zangiota", "Bo'stonliq", "Bostonliq", "Parkent", "Piskent", "O'rtachirchiq", "Yuqorichirchiq", "Quyi Chirchiq"],
  },
  {
    name: "Samarqand viloyati",
    cities: ["Samarqand", "Kattaqo'rg'on", "Ishtixon", "Jomboy", "Qo'shrabot", "Narpay", "Nurobod", "Oqdaryo", "Payariq", "Pastdarg'om", "Paxtachi", "Toyloq", "Urgut"],
  },
  {
    name: "Farg'ona viloyati",
    cities: ["Farg'ona", "Qo'qon", "Marg'ilon", "Quva", "Rishton", "Bag'dod", "Beshariq", "Buvayda", "Dang'ara", "Furqat", "Oltiariq", "O'zbekiston", "Toshloq", "Uchko'prik", "Yozyovon"],
  },
  {
    name: "Andijon viloyati",
    cities: ["Andijon", "Xo'jaobod", "Asaka", "Baliqchi", "Bo'z", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Oltinkul", "Paxtaobod", "Qo'rg'ontepa", "Shahrixon", "Ulug'nor"],
  },
  {
    name: "Namangan viloyati",
    cities: ["Namangan", "Chortoq", "Chust", "Kosonsoy", "Mingbuloq", "Norin", "Pop", "To'raqo'rg'on", "Uchqo'rg'on", "Uychi", "Yangiqo'rg'on"],
  },
  {
    name: "Buxoro viloyati",
    cities: ["Buxoro", "G'ijduvon", "Qorovulbozor", "Kogon", "Jondor", "Olot", "Peshku", "Romitan", "Shofirkon", "Vobkent"],
  },
  {
    name: "Navoiy viloyati",
    cities: ["Navoiy", "Zarafshon", "Karmana", "Konimex", "Navbahor", "Nurota", "Qiziltepa", "Tomdi", "Uchquduq", "Xatirchi"],
  },
  {
    name: "Qashqadaryo viloyati",
    cities: ["Qarshi", "Shahrisabz", "Chiroqchi", "Dehqonobod", "G'uzor", "Kamashi", "Kasbi", "Kitob", "Koson", "Mirishkor", "Muborak", "Nishon", "Yakkabog'"],
  },
  {
    name: "Surxondaryo viloyati",
    cities: ["Termiz", "Denov", "Angor", "Bandixon", "Boysun", "Jarqo'rg'on", "Muzrabot", "Oltinsoy", "Qiziriq", "Sariosiyo", "Sherobod", "Sho'rchi", "Uzun"],
  },
  {
    name: "Jizzax viloyati",
    cities: ["Jizzax", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Sharof Rashidov", "Mirzacho'l", "Paxtakor", "Yangiobod", "Zomin", "Zarbdor"],
  },
  {
    name: "Sirdaryo viloyati",
    cities: ["Guliston", "Shirin", "Bayavut", "Boyovut", "Havast", "Mirzaobod", "Oqoltin", "Sardoba", "Sayxunobod", "Xovos"],
  },
  {
    name: "Xorazm viloyati",
    cities: ["Urganch", "Xiva", "Bog'ot", "Gurlan", "Qo'shko'pir", "Shovot", "Tuproqqal'a", "Yangiariq", "Yangibozor"],
  },
  {
    name: "Qoraqalpog'iston",
    cities: ["Nukus", "Beruniy", "Chimboy", "Ellikkala", "Kegeyli", "Mo'ynoq", "Qonliko'l", "Qo'ng'irot", "Shumanay", "Taxiatosh", "To'rtko'l", "Xo'jayli"],
  },
]

interface Props {
  value: string
  onChange: (v: string) => void
  className?: string
}

export default function CityPicker({ value, onChange, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // On mount, find which region the current value belongs to
  useEffect(() => {
    if (value) {
      const r = REGIONS.find(r => r.cities.includes(value) || r.name.startsWith(value))
      if (r) setSelectedRegion(r.name)
    }
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectCity(city: string) {
    onChange(city)
    setOpen(false)
  }

  const activeRegion = REGIONS.find(r => r.name === selectedRegion)

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 hover:border-blue-600/50 transition cursor-pointer"
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>
          {value || 'Shahar tanlang...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[340px] bg-[#111827] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden">
          <div className="flex max-h-72">
            {/* Left: Viloyatlar */}
            <div className="w-1/2 border-r border-[#1E293B] overflow-y-auto">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-[#1E293B] bg-[#0F172A]">
                Viloyat
              </div>
              {REGIONS.map(r => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => setSelectedRegion(r.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                    selectedRegion === r.name
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-gray-300 hover:bg-[#1F2937]'
                  }`}
                >
                  <span>{r.name}</span>
                  {selectedRegion === r.name && <ChevronRight className="w-3 h-3 flex-shrink-0"/>}
                </button>
              ))}
            </div>

            {/* Right: Shaharlar/Tumanlar */}
            <div className="w-1/2 overflow-y-auto">
              {activeRegion ? (
                <>
                  <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-[#1E293B] bg-[#0F172A]">
                    Shahar / Tuman
                  </div>
                  {activeRegion.cities.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => selectCity(city)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                        value === city
                          ? 'bg-blue-600/20 text-blue-300'
                          : 'text-gray-300 hover:bg-[#1F2937]'
                      }`}
                    >
                      <span>{city}</span>
                      {value === city && <Check className="w-3 h-3 flex-shrink-0 text-blue-400"/>}
                    </button>
                  ))}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs p-4 text-center">
                  Chap tarafdan viloyat tanlang
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
