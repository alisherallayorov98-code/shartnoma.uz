'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Check } from 'lucide-react'

// To'liq to'g'ri nomlar: shahar = "X shahri", tuman = "X tumani"
// Har viloyatda avval mustaqil shaharlar, keyin tumanlar
const REGIONS: { name: string; places: string[] }[] = [
  {
    name: "Toshkent shahri",
    places: ["Toshkent shahri"],
  },
  {
    name: "Toshkent viloyati",
    places: [
      "Angren shahri", "Bekobod shahri", "Chirchiq shahri",
      "Nurafshon shahri", "Ohangaron shahri", "Olmaliq shahri",
      "Bo'stonliq tumani", "Bo'ka tumani", "Qibray tumani",
      "O'rtachirchiq tumani", "Parkent tumani", "Piskent tumani",
      "Quyi Chirchiq tumani", "Toshkent tumani", "Uchtepa tumani",
      "Yangiyul tumani", "Yuqorichirchiq tumani", "Zangiota tumani",
    ],
  },
  {
    name: "Samarqand viloyati",
    places: [
      "Samarqand shahri", "Kattaqo'rg'on shahri",
      "Bulungur tumani", "Ishtixon tumani", "Jomboy tumani",
      "Kattaqo'rg'on tumani", "Narpay tumani", "Nurobod tumani",
      "Oqdaryo tumani", "Pastdarg'om tumani", "Payariq tumani",
      "Paxtachi tumani", "Qo'shrabot tumani", "Toyloq tumani", "Urgut tumani",
    ],
  },
  {
    name: "Farg'ona viloyati",
    places: [
      "Farg'ona shahri", "Marg'ilon shahri", "Qo'qon shahri",
      "Bag'dod tumani", "Beshariq tumani", "Buvayda tumani",
      "Dang'ara tumani", "Furqat tumani", "Oltiariq tumani",
      "O'zbekiston tumani", "Quva tumani", "Rishton tumani",
      "Toshloq tumani", "Uchko'prik tumani", "Yozyovon tumani",
    ],
  },
  {
    name: "Andijon viloyati",
    places: [
      "Andijon shahri", "Asaka shahri",
      "Baliqchi tumani", "Bo'z tumani", "Buloqboshi tumani",
      "Izboskan tumani", "Jalaquduq tumani", "Marhamat tumani",
      "Oltinkul tumani", "Paxtaobod tumani", "Qo'rg'ontepa tumani",
      "Shahrixon tumani", "Ulug'nor tumani", "Xo'jaobod tumani",
    ],
  },
  {
    name: "Namangan viloyati",
    places: [
      "Namangan shahri",
      "Chortoq tumani", "Chust tumani", "Kosonsoy tumani",
      "Mingbuloq tumani", "Norin tumani", "Pop tumani",
      "To'raqo'rg'on tumani", "Uchqo'rg'on tumani",
      "Uychi tumani", "Yangiqo'rg'on tumani",
    ],
  },
  {
    name: "Buxoro viloyati",
    places: [
      "Buxoro shahri", "Kogon shahri",
      "G'ijduvon tumani", "Jondor tumani", "Karakul tumani",
      "Olot tumani", "Peshku tumani", "Qorovulbozor tumani",
      "Romitan tumani", "Shofirkon tumani", "Vobkent tumani",
    ],
  },
  {
    name: "Navoiy viloyati",
    places: [
      "Navoiy shahri", "Zarafshon shahri", "Karmana shahri", "Konimex shahri",
      "Navbahor tumani", "Nurota tumani", "Qiziltepa tumani",
      "Tomdi tumani", "Uchquduq tumani", "Xatirchi tumani",
    ],
  },
  {
    name: "Qashqadaryo viloyati",
    places: [
      "Qarshi shahri", "Shahrisabz shahri", "Muborak shahri",
      "Chiroqchi tumani", "Dehqonobod tumani", "G'uzor tumani",
      "Kamashi tumani", "Kasbi tumani", "Kitob tumani",
      "Koson tumani", "Mirishkor tumani", "Nishon tumani", "Yakkabog' tumani",
    ],
  },
  {
    name: "Surxondaryo viloyati",
    places: [
      "Termiz shahri", "Denov shahri",
      "Angor tumani", "Bandixon tumani", "Boysun tumani",
      "Jarqo'rg'on tumani", "Muzrabot tumani", "Oltinsoy tumani",
      "Qiziriq tumani", "Sariosiyo tumani", "Sherobod tumani",
      "Sho'rchi tumani", "Uzun tumani",
    ],
  },
  {
    name: "Jizzax viloyati",
    places: [
      "Jizzax shahri",
      "Arnasoy tumani", "Baxmal tumani", "Do'stlik tumani",
      "Forish tumani", "G'allaorol tumani", "Mirzacho'l tumani",
      "Paxtakor tumani", "Sharof Rashidov tumani", "Yangiobod tumani",
      "Zafarobod tumani", "Zarbdor tumani", "Zomin tumani",
    ],
  },
  {
    name: "Sirdaryo viloyati",
    places: [
      "Guliston shahri", "Shirin shahri",
      "Boyovut tumani", "Havast tumani", "Mirzaobod tumani",
      "Oqoltin tumani", "Sardoba tumani", "Sayxunobod tumani", "Xovos tumani",
    ],
  },
  {
    name: "Xorazm viloyati",
    places: [
      "Urganch shahri", "Xiva shahri",
      "Bog'ot tumani", "Gurlan tumani", "Hazorasp tumani",
      "Qo'shko'pir tumani", "Shovot tumani", "Tuproqqal'a tumani",
      "Yangiariq tumani", "Yangibozor tumani",
    ],
  },
  {
    name: "Qoraqalpog'iston",
    places: [
      "Nukus shahri", "Taxiatosh shahri",
      "Amudaryo tumani", "Beruniy tumani", "Chimboy tumani",
      "Ellikkala tumani", "Kegeyli tumani", "Mo'ynoq tumani",
      "Qonliko'l tumani", "Qo'ng'irot tumani", "Shumanay tumani",
      "To'rtko'l tumani", "Xo'jayli tumani",
    ],
  },
]

// Har qanday city qiymatini to'g'ri ko'rsatish uchun
// Eski ma'lumotlar "Toshkent" → "Toshkent shahri", yangi "Paxtachi tumani" → o'zgarishsiz
export function cityLabel(city: string): string {
  if (!city) return 'Toshkent shahri'
  const lower = city.toLowerCase()
  if (
    lower.endsWith(' tumani') ||
    lower.endsWith(' shahri') ||
    lower.endsWith(' shahristoni') ||
    lower.endsWith(' shahar')
  ) return city
  return `${city} shahri`
}

// Barcha joylarni flat list sifatida
export const ALL_PLACES = REGIONS.flatMap(r => r.places)

interface Props {
  value: string
  onChange: (v: string) => void
  className?: string
}

export default function CityPicker({ value, onChange, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Joriy qiymatga mos viloyatni topish
  useEffect(() => {
    if (value) {
      const normalizedVal = cityLabel(value)
      const r = REGIONS.find(r =>
        r.places.includes(value) ||
        r.places.includes(normalizedVal) ||
        r.name === value
      )
      if (r) setSelectedRegion(r.name)
    }
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const activeRegion = REGIONS.find(r => r.name === selectedRegion)
  const displayValue = cityLabel(value)

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-[#0F172A] border border-[#1E293B] text-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-600 hover:border-blue-600/50 transition cursor-pointer"
      >
        <span className={value ? 'text-white' : 'text-gray-500'}>
          {value ? displayValue : 'Shahar / tuman tanlang...'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[360px] bg-[#111827] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden">
          <div className="flex max-h-72">
            {/* Viloyatlar */}
            <div className="w-1/2 border-r border-[#1E293B] overflow-y-auto">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-[#1E293B] bg-[#0F172A]">
                Viloyat / Respublika
              </div>
              {REGIONS.map(r => (
                <button key={r.name} type="button"
                  onClick={() => setSelectedRegion(r.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                    selectedRegion === r.name ? 'bg-blue-600/20 text-blue-300' : 'text-gray-300 hover:bg-[#1F2937]'
                  }`}>
                  <span>{r.name}</span>
                  {selectedRegion === r.name && <ChevronRight className="w-3 h-3 flex-shrink-0"/>}
                </button>
              ))}
            </div>

            {/* Shahar / Tumanlar */}
            <div className="w-1/2 overflow-y-auto">
              {activeRegion ? (
                <>
                  <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide border-b border-[#1E293B] bg-[#0F172A]">
                    Shahar / Tuman
                  </div>
                  {activeRegion.places.map(place => (
                    <button key={place} type="button"
                      onClick={() => { onChange(place); setOpen(false) }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                        value === place || cityLabel(value) === place
                          ? 'bg-blue-600/20 text-blue-300'
                          : place.endsWith(' tumani')
                            ? 'text-gray-400 hover:bg-[#1F2937]'
                            : 'text-gray-200 hover:bg-[#1F2937]'
                      }`}>
                      <span>{place}</span>
                      {(value === place || cityLabel(value) === place) && <Check className="w-3 h-3 flex-shrink-0 text-blue-400"/>}
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
