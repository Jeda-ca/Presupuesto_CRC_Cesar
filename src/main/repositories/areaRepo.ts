import type { Area } from '@shared/domain/types'
import { store } from '../infra/store'

export const areaRepo = {
  listar(sedeId: string): Area[] {
    return store
      .getData()
      .areas.filter((a) => a.sedeId === sedeId)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  },

  buscarPorId(id: string): Area | undefined {
    return store.getData().areas.find((a) => a.id === id)
  },

  existeNombre(sedeId: string, nombre: string, excluirId?: string): boolean {
    const objetivo = nombre.trim().toLowerCase()
    return store
      .getData()
      .areas.some(
        (a) =>
          a.sedeId === sedeId &&
          a.nombre.trim().toLowerCase() === objetivo &&
          a.id !== excluirId
      )
  },

  insertar(area: Area): Area {
    return store.mutate((data) => {
      data.areas.push(area)
      return area
    })
  },

  actualizar(area: Area): Area {
    return store.mutate((data) => {
      const i = data.areas.findIndex((a) => a.id === area.id)
      if (i === -1) throw new Error('Área no encontrada')
      data.areas[i] = area
      return area
    })
  },

  eliminar(id: string): void {
    store.mutate((data) => {
      data.areas = data.areas.filter((a) => a.id !== id)
      for (const cuenta of data.cuentas) {
        if (cuenta.areaId === id) cuenta.areaId = null
      }
      data.presupuestos = data.presupuestos.filter(
        (p) => !(p.ambito === 'area' && p.referenciaId === id)
      )
    })
  }
}
