import type { Importacion } from '@shared/domain/types'
import { store } from '../infra/store'

export const importacionRepo = {
  listar(): Importacion[] {
    return [...store.getData().importaciones].sort((a, b) =>
      b.fechaCarga.localeCompare(a.fechaCarga)
    )
  },

  buscarPorHash(hash: string): Importacion | undefined {
    return store.getData().importaciones.find((i) => i.hash === hash)
  },

  insertar(importacion: Importacion): Importacion {
    return store.mutate((data) => {
      data.importaciones.push(importacion)
      return importacion
    })
  },

  eliminar(id: string): void {
    store.mutate((data) => {
      data.importaciones = data.importaciones.filter((i) => i.id !== id)
    })
  }
}
