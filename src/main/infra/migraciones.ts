import type { StoreData } from '@shared/domain/types'
import { STORE_VERSION } from '@shared/schemas/models'
import { SEDES_INICIALES } from '@shared/domain/sedes'

export function storeVacio(): StoreData {
  return {
    version: STORE_VERSION,
    sedes: SEDES_INICIALES.map((s) => ({ ...s })),
    areas: [],
    cuentas: [],
    presupuestos: [],
    movimientos: [],
    importaciones: [],
    configuracion: {
      umbralRiesgo: 0.85,
      umbralBajoUso: 0.3,
      anioActivo: new Date().getFullYear(),
      sedeActiva: null
    }
  }
}

/**
 * Lleva un workspace persistido a la versión vigente. El paso v1 -> v2
 * introduce el modelo por sedes: los datos v1 no tenían sede asignable de
 * forma confiable, por lo que se reinician (decisión de producto) conservando
 * únicamente los umbrales y el año configurados.
 */
export function migrar(json: unknown): unknown {
  if (json === null || typeof json !== 'object') return json
  const data = json as { version?: unknown; configuracion?: unknown }
  const version = typeof data.version === 'number' ? data.version : 1
  if (version >= STORE_VERSION) return json

  const base = storeVacio()
  const cfg = (data.configuracion ?? {}) as Record<string, unknown>
  return {
    ...base,
    configuracion: {
      ...base.configuracion,
      ...(typeof cfg.umbralRiesgo === 'number' ? { umbralRiesgo: cfg.umbralRiesgo } : {}),
      ...(typeof cfg.umbralBajoUso === 'number' ? { umbralBajoUso: cfg.umbralBajoUso } : {}),
      ...(typeof cfg.anioActivo === 'number' ? { anioActivo: cfg.anioActivo } : {})
    }
  }
}
