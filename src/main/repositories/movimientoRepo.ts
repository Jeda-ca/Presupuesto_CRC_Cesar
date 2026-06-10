import type { Movimiento } from '@shared/domain/types'
import { store } from '../infra/store'

export const movimientoRepo = {
  listar(): Movimiento[] {
    return store.getData().movimientos
  },

  listarEntre(desde: string, hasta: string, sedeId?: string): Movimiento[] {
    return store
      .getData()
      .movimientos.filter(
        (m) => m.fecha >= desde && m.fecha <= hasta && (!sedeId || m.sedeId === sedeId)
      )
  },

  idsExistentes(): Set<string> {
    return new Set(store.getData().movimientos.map((m) => m.id))
  },

  upsertLote(movimientos: Movimiento[]): { insertados: number; actualizados: number } {
    return store.mutate((data) => {
      const indice = new Map(data.movimientos.map((m, i) => [m.id, i]))
      let insertados = 0
      let actualizados = 0
      for (const mov of movimientos) {
        const i = indice.get(mov.id)
        if (i === undefined) {
          indice.set(mov.id, data.movimientos.length)
          data.movimientos.push(mov)
          insertados++
        } else {
          data.movimientos[i] = mov
          actualizados++
        }
      }
      return { insertados, actualizados }
    })
  },

  eliminarPorImportacion(importacionId: string): number {
    return store.mutate((data) => {
      const antes = data.movimientos.length
      data.movimientos = data.movimientos.filter((m) => m.importacionId !== importacionId)
      return antes - data.movimientos.length
    })
  }
}
