import type { CuentaContable } from '@shared/domain/types'
import type { AsignarCuentaAreaInput } from '@shared/schemas/dto'
import { cuentaRepo } from '../repositories/cuentaRepo'
import { areaRepo } from '../repositories/areaRepo'

export const cuentaService = {
  listar(): CuentaContable[] {
    return cuentaRepo.listar()
  },

  asignarArea(input: AsignarCuentaAreaInput): CuentaContable {
    if (input.areaId !== null && !areaRepo.buscarPorId(input.areaId)) {
      throw new Error('Área destino no encontrada')
    }
    if (!cuentaRepo.buscarPorCodigo(input.codigo)) {
      throw new Error('Cuenta no encontrada')
    }
    return cuentaRepo.asignarArea(input.codigo, input.areaId)
  }
}
