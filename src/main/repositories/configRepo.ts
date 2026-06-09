import type { Configuracion } from '@shared/domain/types'
import { store } from '../infra/store'

export const configRepo = {
  obtener(): Configuracion {
    return store.getData().configuracion
  },

  actualizar(config: Configuracion): Configuracion {
    return store.mutate((data) => {
      data.configuracion = config
      return config
    })
  }
}
