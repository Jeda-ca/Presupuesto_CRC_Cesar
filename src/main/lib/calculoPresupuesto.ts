import type { EstadoEjecucion } from '@shared/ipc/contract'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** Clasifica la ejecución frente al presupuesto según los umbrales configurados. */
export function calcularEstado(
  presupuesto: number,
  ejecutado: number,
  umbralRiesgo: number,
  umbralBajoUso: number
): EstadoEjecucion {
  if (presupuesto <= 0) return 'sin_presupuesto'
  const porcentaje = ejecutado / presupuesto
  if (ejecutado > presupuesto) return 'excedido'
  if (porcentaje >= umbralRiesgo) return 'en_riesgo'
  if (porcentaje < umbralBajoUso) return 'bajo_uso'
  return 'normal'
}

/**
 * Índices de mes (0-11) del año dado cuyo rango calendario se solapa con el
 * período [desde, hasta] (fechas ISO yyyy-mm-dd). Comparación lexicográfica
 * válida por el formato ISO.
 */
export function mesesEnPeriodo(anio: number, desde: string, hasta: string): number[] {
  const incluidos: number[] = []
  for (let m = 0; m < 12; m++) {
    const inicioMes = `${anio}-${pad2(m + 1)}-01`
    const ultimoDia = new Date(anio, m + 1, 0).getDate()
    const finMes = `${anio}-${pad2(m + 1)}-${pad2(ultimoDia)}`
    if (inicioMes <= hasta && finMes >= desde) incluidos.push(m)
  }
  return incluidos
}

/** Suma del presupuesto mensual correspondiente a los meses del período. */
export function presupuestoEnPeriodo(
  meses: number[],
  anio: number,
  desde: string,
  hasta: string
): number {
  return mesesEnPeriodo(anio, desde, hasta).reduce((total, m) => total + (meses[m] ?? 0), 0)
}

export function indiceMes(fechaISO: string): number {
  const m = Number.parseInt(fechaISO.slice(5, 7), 10)
  return Number.isNaN(m) ? -1 : m - 1
}
