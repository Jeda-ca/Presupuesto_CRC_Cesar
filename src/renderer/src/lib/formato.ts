const monedaCO = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const numeroCO = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 })

const compactoCO = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1
})

export function formatoCompacto(valor: number): string {
  return `$${compactoCO.format(valor)}`
}

export function formatoMoneda(valor: number): string {
  return monedaCO.format(Math.round(valor))
}

export function formatoNumero(valor: number): string {
  return numeroCO.format(valor)
}

export function formatoPorcentaje(fraccion: number, decimales = 1): string {
  return `${(fraccion * 100).toFixed(decimales)}%`
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
]

export function nombreMes(indice: number): string {
  return MESES[indice] ?? ''
}

export function formatoFechaISO(iso: string): string {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  if (!a || !m || !d) return iso
  return `${d}/${m}/${a}`
}
