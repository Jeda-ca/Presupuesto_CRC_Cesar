import type { JSX } from 'react'
import { Entrada } from './ui/Campo'

export interface Periodo {
  desde: string
  hasta: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function rangoAnio(anio: number): Periodo {
  return { desde: `${anio}-01-01`, hasta: `${anio}-12-31` }
}

function rangoTrimestre(anio: number, q: number): Periodo {
  const mesInicio = (q - 1) * 3 + 1
  const mesFin = mesInicio + 2
  const ultimoDia = new Date(anio, mesFin, 0).getDate()
  return { desde: `${anio}-${pad(mesInicio)}-01`, hasta: `${anio}-${pad(mesFin)}-${pad(ultimoDia)}` }
}

export function PeriodoSelector({
  periodo,
  anio,
  onCambio
}: {
  periodo: Periodo
  anio: number
  onCambio: (p: Periodo) => void
}): JSX.Element {
  const presets: { etiqueta: string; periodo: Periodo }[] = [
    { etiqueta: `Año ${anio}`, periodo: rangoAnio(anio) },
    { etiqueta: 'T1', periodo: rangoTrimestre(anio, 1) },
    { etiqueta: 'T2', periodo: rangoTrimestre(anio, 2) },
    { etiqueta: 'T3', periodo: rangoTrimestre(anio, 3) },
    { etiqueta: 'T4', periodo: rangoTrimestre(anio, 4) }
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Entrada
          type="date"
          value={periodo.desde}
          onChange={(e) => onCambio({ ...periodo, desde: e.target.value })}
          className="h-9 w-40"
        />
        <span className="text-slate-400">a</span>
        <Entrada
          type="date"
          value={periodo.hasta}
          onChange={(e) => onCambio({ ...periodo, hasta: e.target.value })}
          className="h-9 w-40"
        />
      </div>
      <div className="flex gap-1">
        {presets.map((p) => {
          const activo = p.periodo.desde === periodo.desde && p.periodo.hasta === periodo.hasta
          return (
            <button
              key={p.etiqueta}
              onClick={() => onCambio(p.periodo)}
              className={`h-9 rounded-lg border px-3 text-xs font-medium transition-colors ${
                activo
                  ? 'border-crc-500 bg-crc-50 text-crc-700'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.etiqueta}
            </button>
          )
        })}
      </div>
    </div>
  )
}
