const MESES_ES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12
}

const DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g')

function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(DIACRITICOS, '')
}

function iso(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/**
 * Normaliza una celda de fecha (cadena `2026/01/24` o `Date` de xlsx) a ISO
 * `yyyy-mm-dd`. Devuelve null si no se reconoce.
 */
export function fechaCeldaAISO(valor: unknown): string | null {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return iso(valor.getFullYear(), valor.getMonth() + 1, valor.getDate())
  }
  if (typeof valor !== 'string') return null
  const m = valor.trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (!m) return null
  return iso(Number(m[1]), Number(m[2]), Number(m[3]))
}

/**
 * Interpreta la línea de período del encabezado Siimed, por ejemplo
 * "Período Entre: Enero 1 y Marzo 31 Del 2026".
 */
export function parsePeriodo(texto: string): { inicio: string | null; fin: string | null } {
  const limpio = sinAcentos(texto)
  const m = limpio.match(
    /Entre:\s*([A-Za-z]+)\s+(\d{1,2})\s+y\s+([A-Za-z]+)\s+(\d{1,2})\s+Del\s+(\d{4})/i
  )
  if (!m) return { inicio: null, fin: null }
  const mes1 = MESES_ES[m[1].toLowerCase()]
  const mes2 = MESES_ES[m[3].toLowerCase()]
  const anio = Number(m[5])
  if (!mes1 || !mes2) return { inicio: null, fin: null }
  return { inicio: iso(anio, mes1, Number(m[2])), fin: iso(anio, mes2, Number(m[4])) }
}

/** Extrae la fecha de la línea "Procesado: 2026/06/08 20:29:35:80". */
export function parseFechaProcesado(texto: string): string | null {
  const m = texto.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (!m) return null
  return iso(Number(m[1]), Number(m[2]), Number(m[3]))
}
