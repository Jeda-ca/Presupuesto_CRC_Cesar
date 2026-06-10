import type { Presupuesto, AmbitoPresupuesto } from '@shared/domain/types'
import { store } from '../infra/store'

export const presupuestoRepo = {
  listarPorAnio(sedeId: string, anio: number): Presupuesto[] {
    return store.getData().presupuestos.filter((p) => p.sedeId === sedeId && p.anio === anio)
  },

  buscar(
    sedeId: string,
    ambito: AmbitoPresupuesto,
    referenciaId: string,
    anio: number
  ): Presupuesto | undefined {
    return store
      .getData()
      .presupuestos.find(
        (p) =>
          p.sedeId === sedeId &&
          p.ambito === ambito &&
          p.referenciaId === referenciaId &&
          p.anio === anio
      )
  },

  insertar(presupuesto: Presupuesto): Presupuesto {
    return store.mutate((data) => {
      data.presupuestos.push(presupuesto)
      return presupuesto
    })
  },

  actualizar(presupuesto: Presupuesto): Presupuesto {
    return store.mutate((data) => {
      const i = data.presupuestos.findIndex((p) => p.id === presupuesto.id)
      if (i === -1) throw new Error('Presupuesto no encontrado')
      data.presupuestos[i] = presupuesto
      return presupuesto
    })
  },

  eliminar(id: string): void {
    store.mutate((data) => {
      data.presupuestos = data.presupuestos.filter((p) => p.id !== id)
    })
  }
}
