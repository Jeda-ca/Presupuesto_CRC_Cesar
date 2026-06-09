import type { Configuracion } from '@shared/domain/types'
import type { ActualizarConfiguracionInput } from '@shared/schemas/dto'
import { configRepo } from '../repositories/configRepo'

export const configService = {
  obtener(): Configuracion {
    return configRepo.obtener()
  },

  actualizar(input: ActualizarConfiguracionInput): Configuracion {
    return configRepo.actualizar(input)
  }
}
