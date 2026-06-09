import type { JSX, ReactNode } from 'react'
import { Icono } from './Icono'

export function Modal({
  titulo,
  abierto,
  onCerrar,
  children,
  ancho = 'max-w-lg'
}: {
  titulo: string
  abierto: boolean
  onCerrar: () => void
  children: ReactNode
  ancho?: string
}): JSX.Element | null {
  if (!abierto) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-6"
      onMouseDown={onCerrar}
    >
      <div
        className={`mt-10 w-full ${ancho} rounded-xl bg-white shadow-xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <Icono nombre="cerrar" className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
