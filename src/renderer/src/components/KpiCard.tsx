import type { JSX } from 'react'
import { Tarjeta } from './ui/Tarjeta'

export function KpiCard({
  titulo,
  valor,
  detalle,
  acento = 'text-slate-800'
}: {
  titulo: string
  valor: string
  detalle?: string
  acento?: string
}): JSX.Element {
  return (
    <Tarjeta className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className={`mt-1.5 text-2xl font-semibold ${acento}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-400">{detalle}</p>}
    </Tarjeta>
  )
}
