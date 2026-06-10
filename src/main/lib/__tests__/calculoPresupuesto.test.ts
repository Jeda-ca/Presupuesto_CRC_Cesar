import { describe, it, expect } from 'vitest'
import {
  mesesEnPeriodo,
  presupuestoEnPeriodo,
  indiceMes,
  calcularEstado
} from '../calculoPresupuesto'

const MESES_100 = Array.from({ length: 12 }, () => 100)

describe('mesesEnPeriodo', () => {
  it('incluye todos los meses del año completo', () => {
    expect(mesesEnPeriodo(2026, '2026-01-01', '2026-12-31')).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    ])
  })

  it('resuelve el primer trimestre', () => {
    expect(mesesEnPeriodo(2026, '2026-01-01', '2026-03-31')).toEqual([0, 1, 2])
  })

  it('resuelve un rango dentro de un solo mes', () => {
    expect(mesesEnPeriodo(2026, '2026-02-15', '2026-02-20')).toEqual([1])
  })

  it('incluye el mes aunque el rango toque solo el último día', () => {
    expect(mesesEnPeriodo(2026, '2026-03-31', '2026-03-31')).toEqual([2])
  })
})

describe('presupuestoEnPeriodo', () => {
  it('suma el presupuesto de los meses del trimestre', () => {
    expect(presupuestoEnPeriodo(MESES_100, 2026, '2026-01-01', '2026-03-31')).toBe(300)
  })

  it('suma el año completo', () => {
    expect(presupuestoEnPeriodo(MESES_100, 2026, '2026-01-01', '2026-12-31')).toBe(1200)
  })
})

describe('indiceMes', () => {
  it('extrae el índice 0-11 del mes desde una fecha ISO', () => {
    expect(indiceMes('2026-01-24')).toBe(0)
    expect(indiceMes('2026-12-31')).toBe(11)
  })
})

describe('calcularEstado', () => {
  const RIESGO = 0.85
  const BAJO = 0.3

  it('para gastos: superar el presupuesto es excedido', () => {
    expect(calcularEstado(100, 150, RIESGO, BAJO, 'gasto')).toBe('excedido')
    expect(calcularEstado(100, 90, RIESGO, BAJO, 'gasto')).toBe('en_riesgo')
    expect(calcularEstado(100, 50, RIESGO, BAJO, 'gasto')).toBe('normal')
    expect(calcularEstado(100, 10, RIESGO, BAJO, 'gasto')).toBe('bajo_uso')
    expect(calcularEstado(100, 150, RIESGO, BAJO, 'costo')).toBe('excedido')
  })

  it('para ingresos: superar la meta es positivo (meta_superada), nunca excedido', () => {
    expect(calcularEstado(100, 150, RIESGO, BAJO, 'ingreso')).toBe('meta_superada')
    expect(calcularEstado(100, 100, RIESGO, BAJO, 'ingreso')).toBe('meta_superada')
    expect(calcularEstado(100, 90, RIESGO, BAJO, 'ingreso')).toBe('normal')
    expect(calcularEstado(100, 10, RIESGO, BAJO, 'ingreso')).toBe('bajo_uso')
  })

  it('sin presupuesto definido el estado es sin_presupuesto para ambas naturalezas', () => {
    expect(calcularEstado(0, 50, RIESGO, BAJO, 'gasto')).toBe('sin_presupuesto')
    expect(calcularEstado(0, 50, RIESGO, BAJO, 'ingreso')).toBe('sin_presupuesto')
  })
})
