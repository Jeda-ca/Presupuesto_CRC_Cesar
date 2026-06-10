import { describe, it, expect } from 'vitest'
import { prefijoDeCentroCosto, nombreSede } from '../sedes'

describe('prefijoDeCentroCosto', () => {
  it('extrae el prefijo del centro de costo de Siimed', () => {
    expect(prefijoDeCentroCosto('0001-705')).toBe('0001')
    expect(prefijoDeCentroCosto('0002-200')).toBe('0002')
    expect(prefijoDeCentroCosto(' 0003-101 ')).toBe('0003')
    expect(prefijoDeCentroCosto('')).toBe('')
  })
})

describe('nombreSede', () => {
  it('resuelve los nombres de las sedes conocidas', () => {
    expect(nombreSede('0001')).toBe('Valledupar')
    expect(nombreSede('0002')).toBe('Aguachica')
    expect(nombreSede('0003')).toBe('Becerril')
  })

  it('maneja prefijos desconocidos y vacíos', () => {
    expect(nombreSede('0009')).toBe('Sede 0009')
    expect(nombreSede('')).toBe('Sin centro de costo')
  })
})
