import { useEffect, useMemo, useState, type JSX } from 'react'
import type { Presupuesto } from '@shared/domain/types'
import { Boton } from './ui/Boton'
import { Entrada } from './ui/Campo'
import { formatoMoneda, nombreMes } from '../lib/formato'

interface Props {
  presupuesto: Presupuesto | null
  anio: number
  guardando: boolean
  onGuardar: (montoAnual: number, meses: number[]) => void
  onEliminar?: () => void
}

const CERO_12 = (): number[] => Array.from({ length: 12 }, () => 0)

function distribuir(total: number): number[] {
  if (!Number.isFinite(total) || total <= 0) return CERO_12()
  const base = Math.round(total / 12)
  const meses = Array.from({ length: 12 }, () => base)
  meses[11] = Math.round((total - base * 11) * 100) / 100
  return meses
}

export function PresupuestoEditor({
  presupuesto,
  anio,
  guardando,
  onGuardar,
  onEliminar
}: Props): JSX.Element {
  const [meses, setMeses] = useState<number[]>(presupuesto?.meses ?? CERO_12())
  const [anualHelper, setAnualHelper] = useState<number>(presupuesto?.montoAnual ?? 0)

  useEffect(() => {
    setMeses(presupuesto?.meses ?? CERO_12())
    setAnualHelper(presupuesto?.montoAnual ?? 0)
  }, [presupuesto])

  const suma = useMemo(() => meses.reduce((a, b) => a + b, 0), [meses])

  function editarMes(i: number, valor: number): void {
    setMeses((prev) => {
      const copia = [...prev]
      copia[i] = Number.isFinite(valor) ? valor : 0
      return copia
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            Monto anual {anio} (para distribuir)
          </span>
          <Entrada
            type="number"
            min={0}
            value={anualHelper}
            onChange={(e) => setAnualHelper(Number(e.target.value))}
            className="w-48"
          />
        </label>
        <Boton variante="secundario" tam="sm" onClick={() => setMeses(distribuir(anualHelper))}>
          Distribuir por igual
        </Boton>
        <Boton variante="secundario" tam="sm" onClick={() => setMeses(CERO_12())}>
          Limpiar
        </Boton>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {meses.map((valor, i) => (
          <label key={i} className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">{nombreMes(i)}</span>
            <Entrada
              type="number"
              min={0}
              value={valor}
              onChange={(e) => editarMes(i, Number(e.target.value))}
              className="h-9"
            />
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="text-sm">
          <span className="text-slate-500">Total anual presupuestado: </span>
          <span className="font-semibold text-slate-800">{formatoMoneda(suma)}</span>
        </div>
        <div className="flex gap-2">
          {onEliminar && presupuesto && (
            <Boton variante="peligro" tam="sm" onClick={onEliminar} disabled={guardando}>
              Eliminar
            </Boton>
          )}
          <Boton tam="sm" onClick={() => onGuardar(suma, meses)} disabled={guardando || suma <= 0}>
            {guardando ? 'Guardando...' : 'Guardar presupuesto'}
          </Boton>
        </div>
      </div>
    </div>
  )
}
