'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; msg: string; type: ToastType }

type ToastCtx = { toast: (msg: string, type?: ToastType) => void }
const ToastContext = createContext<ToastCtx>({ toast: () => {} })

let _id = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((msg: string, type: ToastType = 'success') => {
    const id = ++_id
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-in slide-in-from-right-5 fade-in duration-200 ${
            t.type === 'success' ? 'bg-emerald-900 border-emerald-700 text-emerald-100' :
            t.type === 'error'   ? 'bg-red-900 border-red-700 text-red-100' :
                                   'bg-gray-800 border-gray-700 text-gray-100'
          }`}>
            <span className="flex-shrink-0 mt-0.5">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
