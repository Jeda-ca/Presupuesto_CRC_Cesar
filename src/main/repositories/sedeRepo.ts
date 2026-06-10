import type { Sede } from '@shared/domain/types'
import { store } from '../infra/store'

export const sedeRepo = {
  listar(): Sede[] {
    return [...store.getData().sedes].sort((a, b) => a.prefijo.localeCompare(b.prefijo))
  },

  buscar(prefijo: string): Sede | undefined {
    return store.getData().sedes.find((s) => s.prefijo === prefijo)
  },

  upsert(sede: Sede): Sede {
    return store.mutate((data) => {
      const i = data.sedes.findIndex((s) => s.prefijo === sede.prefijo)
      if (i === -1) data.sedes.push(sede)
      else data.sedes[i] = sede
      return sede
    })
  }
}
