import { parseMontoCO } from './montoCO'
import { fechaCeldaAISO, parsePeriodo, parseFechaProcesado } from './fechas'

export type Celda = string | number | boolean | Date | null | undefined

export interface CuentaParseada {
  codigo: string
  descripcion: string
}

export interface MovimientoParseado {
  cuenta: string
  nit: string
  tercero: string
  comprobante: string
  fecha: string
  detalle: string
  centroCosto: string
  debito: number
  credito: number
}

export interface ChecksumCuenta {
  codigo: string
  debitosParse: number
  creditosParse: number
  debitosReporte: number
  creditosReporte: number
  cuadra: boolean
}

export interface FilaInvalida {
  fila: number
  motivo: string
}

export interface ResultadoParseo {
  periodoInicio: string | null
  periodoFin: string | null
  fechaProcesado: string | null
  cuentas: CuentaParseada[]
  movimientos: MovimientoParseado[]
  checksumPorCuenta: ChecksumCuenta[]
  checksumGlobal: {
    debitosParse: number
    creditosParse: number
    debitosReporte: number | null
    creditosReporte: number | null
    cuadra: boolean
  }
  errores: FilaInvalida[]
  ok: boolean
}

const COL = {
  cuenta: 0,
  descripcion: 1,
  nit: 2,
  nombre: 3,
  comprobante: 4,
  fecha: 5,
  detalle: 6,
  centroCosto: 8,
  debitos: 10,
  creditos: 11
} as const

const TOLERANCIA = 1

function texto(celda: Celda): string {
  if (celda === null || celda === undefined) return ''
  if (celda instanceof Date) return celda.toISOString()
  return String(celda).trim()
}

function esCodigoCuenta(valor: string): boolean {
  return /^\d{4,}$/.test(valor)
}

/**
 * Parsea la matriz de un Libro Auxiliar de Siimed. Detecta el encabezado por
 * ancla ("CUENTA"), agrupa por cuenta, separa filas de apertura/movimiento/total
 * y valida los totales por cuenta y global como checksum de integridad.
 */
export function parsearLibroAuxiliar(filas: Celda[][]): ResultadoParseo {
  let periodoInicio: string | null = null
  let periodoFin: string | null = null
  let fechaProcesado: string | null = null
  let filaEncabezado = -1

  for (let i = 0; i < filas.length; i++) {
    const primera = texto(filas[i]?.[0])
    const linea = filas[i].map(texto).join(' ')
    if (!periodoInicio && /Entre:/i.test(linea)) {
      const p = parsePeriodo(linea)
      periodoInicio = p.inicio
      periodoFin = p.fin
    }
    if (!fechaProcesado && /Procesado/i.test(linea)) {
      fechaProcesado = parseFechaProcesado(linea)
    }
    if (primera.toUpperCase() === 'CUENTA') {
      filaEncabezado = i
      break
    }
  }

  const cuentas = new Map<string, CuentaParseada>()
  const movimientos: MovimientoParseado[] = []
  const sumas = new Map<string, { debitos: number; creditos: number }>()
  const totalesReporte = new Map<string, { debitos: number; creditos: number }>()
  const errores: FilaInvalida[] = []
  let totalGlobalDebitos: number | null = null
  let totalGlobalCreditos: number | null = null

  const inicio = filaEncabezado === -1 ? 0 : filaEncabezado + 1

  for (let i = inicio; i < filas.length; i++) {
    const fila = filas[i]
    if (!fila) continue
    const c0 = texto(fila[COL.cuenta])
    if (c0 === '') continue

    if (/^grand total$/i.test(c0)) {
      totalGlobalDebitos = parseMontoCO(fila[COL.debitos])
      totalGlobalCreditos = parseMontoCO(fila[COL.creditos])
      continue
    }

    const totalMatch = c0.match(/^(\d{4,})\s+Total$/i)
    if (totalMatch) {
      totalesReporte.set(totalMatch[1], {
        debitos: parseMontoCO(fila[COL.debitos]),
        creditos: parseMontoCO(fila[COL.creditos])
      })
      continue
    }

    if (!esCodigoCuenta(c0)) {
      errores.push({ fila: i + 1, motivo: `Código de cuenta no reconocido: "${c0}"` })
      continue
    }

    const codigo = c0
    const descripcion = texto(fila[COL.descripcion])
    if (!cuentas.has(codigo)) cuentas.set(codigo, { codigo, descripcion })
    else if (descripcion && !cuentas.get(codigo)!.descripcion) {
      cuentas.get(codigo)!.descripcion = descripcion
    }

    const comprobante = texto(fila[COL.comprobante])
    if (comprobante === '') continue // fila de apertura (saldo anterior)

    const fecha = fechaCeldaAISO(fila[COL.fecha])
    if (!fecha) {
      errores.push({ fila: i + 1, motivo: `Fecha inválida en comprobante ${comprobante}` })
      continue
    }

    const debito = parseMontoCO(fila[COL.debitos])
    const credito = parseMontoCO(fila[COL.creditos])

    movimientos.push({
      cuenta: codigo,
      nit: texto(fila[COL.nit]),
      tercero: texto(fila[COL.nombre]),
      comprobante,
      fecha,
      detalle: texto(fila[COL.detalle]),
      centroCosto: texto(fila[COL.centroCosto]),
      debito,
      credito
    })

    const acum = sumas.get(codigo) ?? { debitos: 0, creditos: 0 }
    acum.debitos += debito
    acum.creditos += credito
    sumas.set(codigo, acum)
  }

  const checksumPorCuenta: ChecksumCuenta[] = []
  for (const [codigo, suma] of sumas) {
    const reporte = totalesReporte.get(codigo)
    const debitosReporte = reporte?.debitos ?? 0
    const creditosReporte = reporte?.creditos ?? 0
    const cuadra =
      !!reporte &&
      Math.abs(suma.debitos - debitosReporte) < TOLERANCIA &&
      Math.abs(suma.creditos - creditosReporte) < TOLERANCIA
    checksumPorCuenta.push({
      codigo,
      debitosParse: suma.debitos,
      creditosParse: suma.creditos,
      debitosReporte,
      creditosReporte,
      cuadra
    })
  }

  const totalParseDebitos = checksumPorCuenta.reduce((a, c) => a + c.debitosParse, 0)
  const totalParseCreditos = checksumPorCuenta.reduce((a, c) => a + c.creditosParse, 0)
  const globalCuadra =
    totalGlobalDebitos !== null &&
    totalGlobalCreditos !== null &&
    Math.abs(totalParseDebitos - totalGlobalDebitos) < TOLERANCIA &&
    Math.abs(totalParseCreditos - totalGlobalCreditos) < TOLERANCIA

  const ok = errores.length === 0 && checksumPorCuenta.every((c) => c.cuadra) && globalCuadra

  return {
    periodoInicio,
    periodoFin,
    fechaProcesado,
    cuentas: [...cuentas.values()],
    movimientos,
    checksumPorCuenta,
    checksumGlobal: {
      debitosParse: totalParseDebitos,
      creditosParse: totalParseCreditos,
      debitosReporte: totalGlobalDebitos,
      creditosReporte: totalGlobalCreditos,
      cuadra: globalCuadra
    },
    errores,
    ok
  }
}
