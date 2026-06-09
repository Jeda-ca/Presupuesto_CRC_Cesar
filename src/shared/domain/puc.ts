import type { Naturaleza } from './types'

/**
 * Plan Único de Cuentas (PUC) colombiano. El primer dígito del código
 * determina la clase y, de ahí, la naturaleza presupuestal de la cuenta.
 */
export function claseDeCuenta(codigo: string): number {
  const primer = codigo.trim().charAt(0)
  const n = Number.parseInt(primer, 10)
  return Number.isNaN(n) ? 0 : n
}

export function naturalezaDeClase(clase: number): Naturaleza {
  switch (clase) {
    case 4:
      return 'ingreso'
    case 5:
      return 'gasto'
    case 6:
    case 7:
      return 'costo'
    default:
      return 'gasto'
  }
}

export function naturalezaDeCuenta(codigo: string): Naturaleza {
  return naturalezaDeClase(claseDeCuenta(codigo))
}

/**
 * Valor ejecutado de un movimiento según su naturaleza. Para ingresos el
 * recaudo es el crédito neto; para gastos/costos la ejecución es el débito neto.
 */
export function ejecutadoMovimiento(
  naturaleza: Naturaleza,
  debito: number,
  credito: number
): number {
  return naturaleza === 'ingreso' ? credito - debito : debito - credito
}

export const ETIQUETA_NATURALEZA: Record<Naturaleza, string> = {
  ingreso: 'Ingreso',
  gasto: 'Gasto',
  costo: 'Costo'
}
