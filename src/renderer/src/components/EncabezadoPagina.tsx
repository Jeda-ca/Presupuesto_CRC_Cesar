import type { JSX, ReactNode } from 'react'

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones
}: {
  titulo: string
  descripcion?: string
  acciones?: ReactNode
}): JSX.Element {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex items-center gap-2">{acciones}</div>}
    </div>
  )
}

export function EnConstruccion({ modulo }: { modulo: string }): JSX.Element {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400">
      Módulo de {modulo} — disponible en la siguiente fase.
    </div>
  )
}
