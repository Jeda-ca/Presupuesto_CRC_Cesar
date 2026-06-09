import type { JSX } from 'react'
import { useAppStore } from '../store/appStore'
import { Icono } from './ui/Icono'

const ESTILOS = {
  exito: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-800'
} as const

export function Toasts(): JSX.Element {
  const toasts = useAppStore((s) => s.toasts)
  const cerrar = useAppStore((s) => s.cerrarToast)

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg ${ESTILOS[t.tipo]}`}
        >
          <span className="flex-1">{t.mensaje}</span>
          <button onClick={() => cerrar(t.id)} className="opacity-80 hover:opacity-100">
            <Icono nombre="cerrar" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
