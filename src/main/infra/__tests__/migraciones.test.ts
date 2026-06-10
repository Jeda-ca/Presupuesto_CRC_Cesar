import { describe, it, expect } from 'vitest'
import { migrar, storeVacio } from '../migraciones'
import { storeDataSchema, STORE_VERSION } from '@shared/schemas/models'
import type { StoreData } from '@shared/domain/types'

function workspaceV1(): Record<string, unknown> {
  return {
    version: 1,
    areas: [{ id: 'a1', nombre: 'Infraestructura' }],
    cuentas: [{ codigo: '42201606' }],
    presupuestos: [{ id: 'p1' }],
    movimientos: [{ id: 'm1', centroCosto: '0002-200' }],
    importaciones: [{ id: 'i1' }],
    configuracion: { umbralRiesgo: 0.9, umbralBajoUso: 0.2, anioActivo: 2026 }
  }
}

describe('migrar v1 -> v2', () => {
  it('reinicia los datos al modelo por sedes conservando la configuración', () => {
    const resultado = migrar(workspaceV1()) as StoreData
    expect(resultado.version).toBe(STORE_VERSION)
    expect(resultado.sedes.map((s) => s.prefijo)).toEqual(['0001', '0002', '0003'])
    expect(resultado.areas).toHaveLength(0)
    expect(resultado.cuentas).toHaveLength(0)
    expect(resultado.movimientos).toHaveLength(0)
    expect(resultado.importaciones).toHaveLength(0)
    expect(resultado.configuracion.umbralRiesgo).toBe(0.9)
    expect(resultado.configuracion.umbralBajoUso).toBe(0.2)
    expect(resultado.configuracion.anioActivo).toBe(2026)
    expect(resultado.configuracion.sedeActiva).toBeNull()
  })

  it('el resultado migrado valida contra el esquema vigente', () => {
    expect(() => storeDataSchema.parse(migrar(workspaceV1()))).not.toThrow()
  })

  it('un workspace v2 pasa sin modificarse (misma referencia)', () => {
    const v2 = storeVacio()
    expect(migrar(v2)).toBe(v2)
  })

  it('el store vacío arranca con las sedes sembradas y valida', () => {
    const vacio = storeVacio()
    expect(vacio.sedes).toHaveLength(3)
    expect(() => storeDataSchema.parse(vacio)).not.toThrow()
  })
})
