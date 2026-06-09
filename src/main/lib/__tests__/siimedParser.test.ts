import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { parsearLibroAuxiliar } from '../siimedParser'
import { leerMatriz } from '../lectorArchivo'
import { parseMontoCO } from '../montoCO'
import { naturalezaDeCuenta, ejecutadoMovimiento } from '@shared/domain/puc'

const fixture = fileURLToPath(new URL('./fixtures/libro-auxiliar.csv', import.meta.url))

describe('parseMontoCO', () => {
  it('interpreta el formato colombiano y los paréntesis como negativo', () => {
    expect(parseMontoCO('30.000,00')).toBe(30000)
    expect(parseMontoCO('56.027.160,60')).toBeCloseTo(56027160.6, 2)
    expect(parseMontoCO('(16.930.000,00)')).toBe(-16930000)
    expect(parseMontoCO('5.888,60')).toBeCloseTo(5888.6, 2)
    expect(parseMontoCO('0,00 ')).toBe(0)
    expect(parseMontoCO('')).toBe(0)
    expect(parseMontoCO(30000)).toBe(30000)
  })
})

describe('parsearLibroAuxiliar (fixture real Siimed)', () => {
  const resultado = parsearLibroAuxiliar(leerMatriz(fixture))

  it('extrae el período y la fecha de proceso del encabezado', () => {
    expect(resultado.periodoInicio).toBe('2026-01-01')
    expect(resultado.periodoFin).toBe('2026-03-31')
    expect(resultado.fechaProcesado).toBe('2026-06-08')
  })

  it('cuadra el checksum global contra el Grand Total', () => {
    expect(resultado.checksumGlobal.debitosReporte).toBe(7952000)
    expect(resultado.checksumGlobal.creditosReporte).toBeCloseTo(56027160.6, 2)
    expect(resultado.checksumGlobal.debitosParse).toBeCloseTo(7952000, 2)
    expect(resultado.checksumGlobal.creditosParse).toBeCloseTo(56027160.6, 2)
    expect(resultado.checksumGlobal.cuadra).toBe(true)
  })

  it('cuadra el checksum de todas las cuentas y no produce errores', () => {
    expect(resultado.errores).toHaveLength(0)
    expect(resultado.checksumPorCuenta.every((c) => c.cuadra)).toBe(true)
    expect(resultado.ok).toBe(true)
  })

  it('descubre las 18 cuentas y omite filas de apertura/total', () => {
    expect(resultado.cuentas).toHaveLength(18)
    const lab = resultado.checksumPorCuenta.find((c) => c.codigo === '41250101')
    expect(lab?.creditosParse).toBe(469000)
    expect(lab?.debitosParse).toBe(0)
    const muestra = resultado.movimientos.filter((m) => m.cuenta === '41250103')
    expect(muestra).toHaveLength(2)
  })

  it('registra las devoluciones como débito (no como crédito)', () => {
    const dev = resultado.checksumPorCuenta.find((c) => c.codigo === '41752501')
    expect(dev?.debitosParse).toBe(38000)
    expect(dev?.creditosParse).toBe(0)
  })

  it('clasifica la naturaleza por PUC y calcula el ejecutado por movimiento', () => {
    expect(naturalezaDeCuenta('41250101')).toBe('ingreso')
    const mov = resultado.movimientos.find((m) => m.comprobante === 'F-5-26466-1')!
    expect(ejecutadoMovimiento('ingreso', mov.debito, mov.credito)).toBe(30000)
  })
})

describe('parsearLibroAuxiliar (casos borde)', () => {
  const ENCABEZADO = [
    'CUENTA',
    'DESCRIPCION',
    'NIT',
    'NOMBRE',
    'COMPROBANTE',
    'FECHA',
    'DETALLE',
    'INV',
    'CENTRO COSTO',
    'SALDO ANT.',
    'DEBITOS',
    'CREDITOS'
  ]

  it('reporta y omite filas con fecha inválida sin abortar', () => {
    const matriz = [
      ENCABEZADO,
      ['41250101', 'LAB', '123', 'TERCERO', 'F-1-1', 'fecha-mala', 'x', '', '0001', '0', '0', '30.000,00'],
      ['41250101 Total', '', '', '', '', '', '', '', '', '', '0', '30.000,00']
    ]
    const r = parsearLibroAuxiliar(matriz)
    expect(r.errores).toHaveLength(1)
    expect(r.movimientos).toHaveLength(0)
    expect(r.ok).toBe(false)
  })

  it('no falla con una matriz vacía', () => {
    const r = parsearLibroAuxiliar([])
    expect(r.movimientos).toHaveLength(0)
    expect(r.ok).toBe(false)
  })
})
