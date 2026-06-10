import type { CuentaContable } from '@shared/domain/types'
import type { AsignarCuentaAreaInput } from '@shared/schemas/dto'
import { cuentaRepo } from '../repositories/cuentaRepo'
import { areaRepo } from '../repositories/areaRepo'

export const cuentaService = {
  listar(sedeId: string): CuentaContable[] {
    return cuentaRepo.listar(sedeId)
  },

  asignarArea(input: AsignarCuentaAreaInput): CuentaContable {
    if (input.areaId !== null) {
      const area = areaRepo.buscarPorId(input.areaId)
      if (!area) throw new Error('Área destino no encontrada')
      if (area.sedeId !== input.sedeId) {
        throw new Error('El área pertenece a otra sede')
      }
    }
    if (!cuentaRepo.buscarPorCodigo(input.sedeId, input.codigo)) {
      throw new Error('Cuenta no encontrada')
    }
    return cuentaRepo.asignarArea(input.sedeId, input.codigo, input.areaId)
  }
}
